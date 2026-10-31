import assert from "node:assert/strict";
import test from "node:test";
import { resolveId } from "../js/core/id-resolver.js";

for (const [id, path] of [
  ["evt0001", "../data/evt/evt0001.json"],
  ["per0001", "../data/per/per0001.json"],
  ["ppl0001", "../data/ppl/ppl0001.json"],
  ["plc0001", "../data/plc/plc0001.json"],
  ["src0001", "../data/src/src0001.json"]
]) {
  test("resolveId trả URL đúng cho " + id, () => {
    const url = resolveId(id);
    assert.ok(url instanceof URL);
    assert.equal(url.href, new URL(path, import.meta.url).href);
  });
}

test("từ chối ID sai kiểu, dấu gạch nối, độ dài và ký tự", () => {
  for (const id of [
    undefined, null, 1, {}, [], true, "", new String("evt0001"),
    "evt-0001", "evt001", "evt00001", "EVT0001",
    "evt0001\n", "evt0001\r", "evt0001 ", " evt0001",
    "evt０００１", "evt٠٠٠١", "../evt0001", "evt0001?x", "evt0001#x"
  ]) {
    assert.throws(() => resolveId(id), error => {
      assert.equal(error.name, "InvalidResourceIdError");
      assert.match(error.message, /ID không hợp lệ/);
      return true;
    });
  }
});

test("từ chối prefix ngoài phạm vi evt/per/ppl/plc/src", () => {
  for (const id of ["art0001", "cul0001", "sty0001", "tml0001", "img0001", "map0001", "abc0001"]) {
    assert.throws(() => resolveId(id), error => {
      assert.equal(error.name, "InvalidResourceIdError");
      assert.ok(error.message.includes(id.slice(0, 3)));
      return true;
    });
  }
});
