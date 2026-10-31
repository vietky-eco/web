import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import { relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { loadContent } from "../js/core/content-loader.js";

const root = fileURLToPath(new URL("../", import.meta.url));
const fetchHTTP = globalThis.fetch;
const sampleIds = ["evt0001", "evt0002", "evt0004", "per0001", "per0002", "src0001", "src0002", "src0003"];
// Fixture kỹ thuật chỉ nằm trong bộ nhớ, không phải dữ liệu lịch sử của dự án.
const invalidJSON = new Map([
  ["evt9900", "{"], ["evt9901", ""],
  ["evt9902", "null"], ["evt9903", "[]"], ["evt9904", "42"],
  ["evt9905", '"text"'], ["evt9906", "true"],
  ["evt9907", '{"id":"evt0002"}'],
  ["evt9908", '{"id":{"toString":null}}'],
  ["evt9909", '{"title":"technical fixture"}']
]);
let server;
let origin;

before(async () => {
  const samples = new Map(sampleIds.map(id => [
    "/data/" + id.slice(0, 3) + "/" + id + ".json",
    readFileSync(new URL("../data/" + id.slice(0, 3) + "/" + id + ".json", import.meta.url))
  ]));
  server = createServer((request, response) => {
    const path = new URL(request.url, "http://localhost").pathname;
    if (path === "/data/evt/evt9997.json") {
      request.socket.destroy();
      return;
    }
    if (path === "/data/evt/evt9998.json") {
      response.writeHead(500);
      response.end("technical test failure");
      return;
    }
    const id = path.match(/^\/data\/evt\/(evt[0-9]{4})\.json$/)?.[1];
    const body = samples.get(path) ?? invalidJSON.get(id);
    response.writeHead(body === undefined ? 404 : 200, { "Content-Type": "application/json" });
    response.end(body ?? '{"error":"not found"}');
  });
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  origin = "http://127.0.0.1:" + server.address().port + "/";
});

after(async () => {
  if (!server?.listening) return;
  server.closeAllConnections();
  await new Promise(resolve => server.close(resolve));
});

function useHTTP(t) {
  // Node import module từ file:; chỉ đổi transport sang server HTTP thật.
  // Giữ nguyên đường dẫn do Resolver tạo và không thay kết quả của Loader.
  t.mock.method(globalThis, "fetch", (url, options) => {
    assert.ok(url instanceof URL);
    assert.equal(url.protocol, "file:");
    const path = relative(root, fileURLToPath(url)).split(sep).join("/");
    assert.ok(path.startsWith("data/"), "URL phải nằm trong data/");
    return fetchHTTP(new URL(path, origin), options);
  });
}

test("tải 3 sự kiện mẫu và mọi tham chiếu qua HTTP", async t => {
  useHTTP(t);
  for (const [id, year, title] of [
    ["evt0001", 968, "Thống nhất đất nước, lập Đại Cồ Việt (968)"],
    ["evt0002", 979, "Biến cố cung đình nhà Đinh (979)"],
    ["evt0004", 981, "Kháng chiến chống Tống (981)"]
  ]) {
    const event = await loadContent(id);
    assert.equal(event.id, id);
    assert.equal(event.title, title);
    assert.equal(event.time.sortYear, year);
    assert.ok(event.summary.trim());
    assert.ok(event.sourceIds.length > 0);
    assert.ok(event.periodIds.length > 0);
    assert.ok(event.related.length > 0);
    for (const ref of [...event.sourceIds, ...event.periodIds, ...event.related.map(item => item.targetId)]) {
      assert.equal((await loadContent(ref)).id, ref);
    }
  }
});

test("Loader từ chối ID sai trước khi gọi fetch", async t => {
  t.mock.method(globalThis, "fetch", () => {
    throw new Error("Không được gọi fetch cho ID sai");
  });
  for (const id of ["evt-0001", "evt0001\n", "art0001"]) {
    await assert.rejects(loadContent(id), { name: "InvalidResourceIdError" });
  }
});

test("404 trả ResourceNotFoundError có ID và mã HTTP", async t => {
  useHTTP(t);
  await assert.rejects(loadContent("evt9999"), error => {
    assert.equal(error.name, "ResourceNotFoundError");
    assert.match(error.message, /evt9999.*404/);
    return true;
  });
});

test("JSON sai cú pháp hoặc rỗng được bắt và giữ nguyên cause", async t => {
  useHTTP(t);
  for (const id of ["evt9900", "evt9901"]) {
    await assert.rejects(loadContent(id), error => {
      assert.match(error.message, /JSON.*không hợp lệ/);
      assert.ok(error.message.includes(id));
      assert.equal(error.cause.name, "SyntaxError");
      return true;
    });
  }
});

test("từ chối JSON null, array và giá trị nguyên thủy", async t => {
  useHTTP(t);
  for (const id of ["evt9902", "evt9903", "evt9904", "evt9905", "evt9906"]) {
    await assert.rejects(loadContent(id), /phải là object JSON/);
  }
});

test("ID không khớp luôn có thông báo rõ, kể cả ID là object", async t => {
  useHTTP(t);
  for (const id of ["evt9907", "evt9908"]) {
    await assert.rejects(loadContent(id), error => {
      assert.match(error.message, /ID trong JSON không khớp/);
      assert.ok(error.message.includes(id));
      return true;
    });
  }
});

test("HTTP 500 không bị nhầm thành lỗi 404", async t => {
  useHTTP(t);
  await assert.rejects(loadContent("evt9998"), error => {
    assert.notEqual(error.name, "ResourceNotFoundError");
    assert.match(error.message, /evt9998.*HTTP 500/);
    return true;
  });
});

test("mất kết nối trả lỗi có ID và cause", async t => {
  useHTTP(t);
  await assert.rejects(loadContent("evt9997"), error => {
    assert.match(error.message, /evt9997.*kết nối mạng/);
    assert.ok(error.cause);
    return true;
  });
});

test("object không có trường id vẫn hợp lệ theo contract hiện tại", async t => {
  useHTTP(t);
  assert.deepEqual(await loadContent("evt9909"), { title: "technical fixture" });
});

test("sau lỗi 404 và JSON lỗi vẫn tải được sự kiện thật", async t => {
  useHTTP(t);
  await assert.rejects(loadContent("evt9999"), { name: "ResourceNotFoundError" });
  await assert.rejects(loadContent("evt9900"), /JSON.*không hợp lệ/);
  const event = await loadContent("evt0001");
  assert.equal(event.id, "evt0001");
  assert.equal(event.type, "event");
});
