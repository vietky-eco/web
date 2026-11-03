const CATALOG_URL = new URL("../../data/catalog.json", import.meta.url);
const RECORD_TYPES = {evt: "event", per: "period", ppl: "person", plc: "place", cul: "culture"};

/** Chỉ đọc chỉ mục; nội dung chi tiết tiếp tục lấy từ Entity JSON. */
export async function loadCatalog() {
  let response;
  try {
    response = await fetch(CATALOG_URL);
  } catch (cause) {
    throw new Error("Không thể tải Catalog. Kiểm tra kết nối mạng.", {cause});
  }
  if (!response.ok) {
    throw new Error("Không thể tải Catalog (HTTP " + response.status + ").");
  }

  let records;
  try {
    records = await response.json();
  } catch (cause) {
    throw new Error("JSON Catalog không hợp lệ.", {cause});
  }
  if (!Array.isArray(records)) throw new TypeError("Catalog phải là mảng JSON.");

  const ids = new Set();
  for (const record of records) {
    if (!record || typeof record !== "object" || Array.isArray(record) ||
        typeof record.id !== "string" || record.id.length !== 7 ||
        !/^(evt|per|ppl|plc|cul)[0-9]{4}$/.test(record.id) ||
        record.type !== RECORD_TYPES[record.id.slice(0, 3)] ||
        typeof record.title !== "string" || !record.title.trim() ||
        !["draft", "review", "published"].includes(record.status)) {
      throw new TypeError("Bản ghi Catalog phải có ID, type, title và status hợp lệ.");
    }
    if (ids.has(record.id)) throw new TypeError("Catalog có ID trùng: " + record.id + ".");
    ids.add(record.id);
  }
  return records;
}
