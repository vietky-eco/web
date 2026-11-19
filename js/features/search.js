// Tách dấu tiếng Việt bằng NFD. Chữ đ cần chuyển riêng vì NFD giữ nguyên chữ này.
export function normalize(value = "") {
  return String(value)
    .toLocaleLowerCase("vi")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/đ/g, "d");
}

export function normalizeSearchText(text) {
  return normalize(text)
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

/** Tìm title/summary trong Catalog được bên gọi cung cấp, giữ thứ tự và record gốc. */
export function searchCatalog(query, records) {
  if (!Array.isArray(records))
    throw new TypeError("Danh sách Catalog phải là mảng.");
  const text = query ?? "";
  if (typeof text !== "string")
    throw new TypeError("Từ khóa tìm kiếm phải là chuỗi.");
  if (!text.trim()) return [...records];
  const term = normalizeSearchText(text);
  if (!term) return [];
  const words = term.split(" ");

  // Mỗi từ phải xuất hiện trong tiêu đề hoặc tóm tắt, ở bất kỳ thứ tự nào.
  return records.filter((record) => {
    const title =
      typeof record?.title === "string"
        ? normalizeSearchText(record.title)
        : "";
    const summary =
      typeof record?.summary === "string"
        ? normalizeSearchText(record.summary)
        : "";
    return words.every(
      (word) => title.includes(word) || summary.includes(word),
    );
  });
}
