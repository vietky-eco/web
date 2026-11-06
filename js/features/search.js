function normalizeText(text) {
  return text.toLowerCase().normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/đ/g, "d")
    .replace(/\s+/g, " ")
    .trim();
}

/** Tìm title/summary trong Catalog được bên gọi cung cấp, giữ thứ tự và record gốc. */
export function searchCatalog(query, records) {
  if (!Array.isArray(records)) throw new TypeError("Danh sách Catalog phải là mảng.");
  const text = query ?? "";
  if (typeof text !== "string") throw new TypeError("Từ khóa tìm kiếm phải là chuỗi.");
  const term = normalizeText(text);
  if (!term) return [...records];

  return records.filter(record =>
    [record?.title, record?.summary].some(value =>
      typeof value === "string" && normalizeText(value).includes(term)
    )
  );
}
