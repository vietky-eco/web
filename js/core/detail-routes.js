const SLUG_INDEX_URL = new URL("../../data/slug-index.json", import.meta.url);

export async function loadSlugIndex() {
  const response = await fetch(SLUG_INDEX_URL);
  if (!response.ok)
    throw new Error("Không thể tải danh mục bài viết. Vui lòng thử lại sau.");
  const index = await response.json();
  if (!index || typeof index !== "object" || Array.isArray(index)) {
    throw new Error("Danh mục bài viết không hợp lệ.");
  }
  return index;
}

export function indexDetailPaths(index) {
  return new Map(Object.entries(index).map(([path, id]) => [id, path]));
}

export function detailPath(id, pathsById) {
  return pathsById.get(id) ?? `/chi-tiet?id=${encodeURIComponent(id)}`;
}
