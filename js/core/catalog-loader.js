const CATALOG_URL = new URL("../../data/catalog.json", import.meta.url);
const RECORD_TYPES = {evt: "event", per: "period", ppl: "person", plc: "place", cul: "culture"};

/** Kiểm tra trường chỉ mục; build script kiểm tra thêm file nguồn và tham chiếu. */
export function validateCatalog(records) {
  if (!Array.isArray(records)) throw new TypeError("Catalog phải là mảng JSON.");
  const ids = new Set();
  for (const record of records) {
    if (!record || typeof record !== "object" || Array.isArray(record) ||
        typeof record.id !== "string" || record.id.length !== 7 ||
        !/^(evt|per|ppl|plc|cul)[0-9]{4}$/.test(record.id) ||
        record.type !== RECORD_TYPES[record.id.slice(0, 3)] ||
        typeof record.title !== "string" || !record.title.trim() ||
        typeof record.summary !== "string" || !record.summary.trim() ||
        !["draft", "review", "published"].includes(record.status)) {
      throw new TypeError("Bản ghi Catalog phải có ID, type, title, summary và status hợp lệ.");
    }
    if (ids.has(record.id)) throw new TypeError("Catalog có ID trùng: " + record.id + ".");
    ids.add(record.id);

    if (!Array.isArray(record.periodIds) ||
        new Set(record.periodIds).size !== record.periodIds.length ||
        record.periodIds.some(id => typeof id !== "string" || id.length !== 7 || !/^per[0-9]{4}$/.test(id)) ||
        record.periodId !== (record.periodIds.length === 1 ? record.periodIds[0] : null)) {
      throw new TypeError("Catalog " + record.id + ": periodIds/periodId không hợp lệ hoặc không khớp.");
    }
    if (record.time !== undefined) {
      const time = record.time;
      if (!time || typeof time !== "object" || Array.isArray(time) ||
          !Number.isInteger(time.sortYear) || record.year !== time.sortYear ||
          typeof time.label !== "string" || !time.label.trim() ||
          (time.order !== undefined && (!Number.isInteger(time.order) || time.order < 0))) {
        throw new TypeError("Catalog " + record.id + ": time/year không hợp lệ hoặc không khớp.");
      }
    } else if (record.year !== null) {
      throw new TypeError("Catalog " + record.id + ": năm chưa biết phải là null.");
    }
    if (record.articleId !== undefined && record.articleId !== null &&
        (typeof record.articleId !== "string" || record.articleId.length !== 7 || !/^art[0-9]{4}$/.test(record.articleId))) {
      throw new TypeError("Catalog " + record.id + ": articleId không hợp lệ.");
    }
  }
  return records;
}

/** Chỉ đọc chỉ mục; nội dung chi tiết tiếp tục lấy từ Entity JSON. */
export async function loadCatalog() {
  let response;
  try {
    response = await fetch(CATALOG_URL);
  } catch (cause) {
    throw new Error("Không thể tải Catalog. Kiểm tra kết nối mạng.", {cause});
  }
  if (!response.ok) throw new Error("Không thể tải Catalog (HTTP " + response.status + ").");

  let records;
  try {
    records = await response.json();
  } catch (cause) {
    throw new Error("JSON Catalog không hợp lệ.", {cause});
  }
  return validateCatalog(records);
}
