import { loadCatalog as readCatalog } from "../core/catalog-loader.js";
import { loadContent } from "../core/content-loader.js";
import { detailPath, indexDetailPaths, loadSlugIndex } from "../core/detail-routes.js";
import { normalizeSearchText, searchCatalog as matchCatalog } from "./search.js";
import { filterByType } from "./filter.js";
import { NAVIGATION_GROUPS } from "../components/navigation-data.js?v=2";

const PROJECT_URL = new URL("../../", import.meta.url);
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);

export function localSearchPreviewUrl() {
  const url = new URL(window.location.href);
  if (!LOCAL_HOSTS.has(url.hostname) || url.searchParams.get("preview") === "1") return null;
  url.searchParams.set("preview", "1");
  return url;
}

export const TYPES = Object.freeze({
  all: "Tất cả",
  event: "Sự kiện",
  person: "Nhân vật",
  place: "Địa danh",
  artifact: "Hiện vật",
  period: "Thời kỳ",
  culture: "Văn hóa",
});
export const SEARCH_QUICK_TYPES = Object.freeze(["event", "person", "place", "artifact", "culture"]);
export const SEARCH_GROUPS = NAVIGATION_GROUPS.map(({ title, items }) => ({
  title,
  items: items.filter(({ id }) => id !== "ban-do" && id !== "dong-thoi-gian"),
}));
export const SEARCH_CATEGORIES = new Map(SEARCH_GROUPS.flatMap(({ items }) => items.map(({ id, title }) => [id, title])));
const DEFAULT_CATEGORIES = { event: "su-kien", person: "nhan-vat", place: "dia-danh", period: "thoi-ky" };

function categoryOf(record) {
  if ((record.type === "place" || record.type === "culture") && SEARCH_CATEGORIES.has(record.categoryId)) {
    return record.categoryId;
  }
  return DEFAULT_CATEGORIES[record.type];
}

export function formatSearchYear(year) {
  return year < 0 ? `${Math.abs(year)} TCN` : String(year);
}

function periodBounds(label) {
  const range = label.match(/\(\s*([-−]?\d+)\s*(TCN|SCN)?\s*[-–—]\s*([-−]?\d+)\s*(TCN|SCN)?\s*\)\s*$/iu);
  if (!range) return null;
  const [, start, startEra, end, endEra] = range;
  const first = Number(start.replace("−", "-"));
  const last = Number(end.replace("−", "-"));
  const min = (startEra ?? endEra)?.toUpperCase() === "TCN" ? -Math.abs(first) : first;
  const max = endEra?.toUpperCase() === "TCN" ? -Math.abs(last) : last;
  return min <= max ? [min, max] : null;
}
// Navbar và popup dùng chung Promise, kể cả khi cả hai cần dữ liệu cùng lúc.
let catalogRequest;
export function loadCatalog({ retry = false } = {}) {
  if (retry || !catalogRequest) {
    const request = loadSearchData().catch((error) => {
      // Lượt cũ thất bại có thể đến sau khi người dùng đã bấm Thử lại.
      if (catalogRequest === request) catalogRequest = undefined;
      throw error;
    });
    catalogRequest = request;
  }
  return catalogRequest;
}

// Catalog là dữ liệu chính. Thiếu slug hoặc tên thời kỳ thì dùng ID tương ứng.
async function loadSearchData() {
  const [allRows, slugIndex] = await Promise.all([
    readCatalog(),
    loadSlugIndex().catch(() => ({})),
  ]);
  const url = new URL(window.location.href);
  const preview = LOCAL_HOSTS.has(url.hostname) && url.searchParams.get("preview") === "1";
  const rows = allRows.filter((row) => preview || row.status === "published");
  const pathsById = indexDetailPaths(slugIndex);
  const periodIds = [...new Set(rows.flatMap((item) => item.type === "period" ? [item.id, ...item.periodIds] : item.periodIds))];
  const indexedPeriods = new Map(rows.filter(({ type }) => type === "period").map((row) => [row.id, row]));
  const periodResults = await Promise.allSettled(periodIds.map((id) => indexedPeriods.get(id) ?? loadContent(id)));
  const periods = new Map(
    periodIds.map((id, index) => {
      const result = periodResults[index];
      const title = result.status === "fulfilled" ? result.value.title : null;
      const label = typeof title === "string" ? title : id;
      return [id, { label, bounds: periodBounds(label) }];
    }),
  );
  let minYear = Infinity;
  let maxYear = -Infinity;
  for (const { year } of rows) {
    if (year === null) continue;
    minYear = Math.min(minYear, year);
    maxYear = Math.max(maxYear, year);
  }
  for (const { bounds } of periods.values()) {
    if (!bounds) continue;
    minYear = Math.min(minYear, bounds[0]);
    maxYear = Math.max(maxYear, bounds[1]);
  }
  const yearBounds = minYear <= maxYear ? [minYear, maxYear] : null;
  const records = rows.map((item) => ({
    ...item,
    periodTitle: item.periodIds.map((id) => periods.get(id).label).join(" · "),
    href: new URL(detailPath(item.id, pathsById).slice(1), PROJECT_URL).href,
  }));
  return { records, periods, yearBounds };
}

// Tìm theo từ khóa, áp dụng bộ lọc rồi sắp xếp danh sách trả về cho UI.
export function searchCatalog(records, state) {
  const query = state.q?.trim();
  const types = new Set(state.types);
  const categories = new Set(state.categories);
  const from = state.from === "" ? null : state.from;
  const to = state.to === "" ? null : state.to;
  const matches = filterByType(matchCatalog(query, records), state.type).filter(
    (item) =>
      (!types.size || types.has(categoryOf(item) === "hien-vat" ? "artifact" : item.type)) &&
      (!categories.size || categories.has(categoryOf(item))) &&
      (!state.period || item.id === state.period || item.periodIds.includes(state.period)) &&
      (from == null || (item.year !== null && item.year >= Number(from))) &&
      (to == null || (item.year !== null && item.year <= Number(to))),
  );

  // Mục chưa rõ năm luôn nằm cuối, kể cả khi sắp xếp giảm dần.
  if (state.sort === "year-asc" || state.sort === "year-desc") {
    const direction = state.sort === "year-desc" ? -1 : 1;
    return matches.sort((a, b) => {
      if (a.year === null || b.year === null)
        return Number(a.year === null) - Number(b.year === null);
      return direction * (a.year - b.year);
    });
  }

  if (!query) return matches;

  // Ưu tiên tiêu đề trùng, chứa nguyên cụm, chứa đủ từ rồi đến tóm tắt.
  const term = normalizeSearchText(query);
  const words = term.split(" ");
  const scores = new Map(matches.map((item) => {
    const title = normalizeSearchText(item.title);
    if (title === term) return [item, 3];
    if (title.includes(term)) return [item, 2];
    return [item, Number(words.every((word) => title.includes(word)))];
  }));
  return matches.sort((a, b) => scores.get(b) - scores.get(a));
}
