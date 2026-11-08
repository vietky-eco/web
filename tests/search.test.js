import assert from "node:assert/strict";
import test from "node:test";
import { searchCatalog } from "../js/features/search-ui-adapter.js";

const records = [
  { title: "Một trận thủy chiến", summary: "Thắng trận trên sông Bạch Đằng." },
  { title: "Trận Bạch Đằng (1288)" },
  { title: "Bạch Đằng" },
  { title: "Trận Chi Lăng" },
];

test("tìm không dấu, có dấu câu hoặc đảo thứ tự từ", () => {
  const ordered = searchCatalog(records, { q: "Bạch Đằng" });
  assert.deepEqual(ordered, [records[2], records[1], records[0]]);
  const reordered = searchCatalog(records, { q: "dang, bach" });
  assert.deepEqual(reordered, [records[1], records[2], records[0]]);
  assert.deepEqual(searchCatalog(records, { q: "!!!" }), []);
});

test("kết hợp loại, thời kỳ, khoảng năm và thứ tự trong popup", () => {
  const events = [1288, 938, null, 981].map((year) => ({
    title: "Bạch Đằng", type: "event", year, periodIds: ["per0001"],
  }));
  events.push({ ...events[0], type: "place" });
  const matches = searchCatalog(events, {
    q: "Bạch Đằng", type: "event", period: "per0001", from: "950", to: "1300", sort: "year-desc",
  });
  assert.deepEqual(matches.map((item) => item.year), [1288, 981]);
});

test("lấy hợp các loại đã chọn và tách hiện vật khỏi địa danh", () => {
  const event = { type: "event", title: "Sự kiện" };
  const monument = { type: "place", categoryId: "di-tich", title: "Di tích" };
  const artifact = { type: "place", categoryId: "hien-vat", title: "Hiện vật" };
  const culture = { type: "culture", categoryId: "le-hoi", title: "Lễ hội" };
  const catalog = [event, monument, artifact, culture];
  assert.deepEqual(searchCatalog(catalog, { types: ["place", "event"] }), [event, monument]);
  assert.deepEqual(searchCatalog(catalog, { types: ["artifact", "culture"] }), [artifact, culture]);
  assert.deepEqual(searchCatalog(catalog, { types: [] }), catalog);
});
