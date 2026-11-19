/** Lọc loại bài MVP; giá trị thiếu/không hợp lệ được xem là Tất cả. */
export function filterByType(records, type = "all") {
  if (!Array.isArray(records))
    throw new TypeError("Danh sách Catalog phải là mảng.");
  if (!["event", "person", "place"].includes(type)) return [...records];
  return records.filter((record) => record?.type === type);
}
