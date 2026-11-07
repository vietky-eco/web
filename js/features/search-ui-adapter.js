import { loadCatalog as readCatalog } from "../core/catalog-loader.js";
import { loadContent } from "../core/content-loader.js";
import { searchCatalog as findCatalog } from "./search.js";
import { filterByType } from "./filter.js";

export const SEARCH_URL = new URL("../../pages/search.html", import.meta.url);
export const TYPES = Object.freeze({
  all: "Tất cả",
  event: "Sự kiện",
  person: "Nhân vật",
  place: "Địa danh",
});
let catalogRequest;

export function normalize(value = "") {
  return String(value)
    .toLocaleLowerCase("vi")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/đ/g, "d");
}

export function searchURL(state = {}) {
  const url = new URL(SEARCH_URL);
  for (const key of ["q", "type", "period", "from", "to", "sort", "page"]) {
    if (
      state[key] &&
      state[key] !== "all" &&
      state[key] !== "relevance" &&
      !(key === "page" && state[key] <= 1)
    ) {
      url.searchParams.set(key, state[key]);
    }
  }
  return url;
}

export function readSearchState(url = location.href) {
  const params = new URL(url).searchParams;
  const year = (key) =>
    /^-?\d{1,4}$/.test(params.get(key) || "") ? params.get(key) : "";
  return {
    q: (params.get("q") || "").trim().slice(0, 100),
    type: Object.hasOwn(TYPES, params.get("type")) ? params.get("type") : "all",
    period: /^per\d{4}$/.test(params.get("period") || "")
      ? params.get("period")
      : "",
    from: year("from"),
    to: year("to"),
    sort: ["year-asc", "year-desc"].includes(params.get("sort"))
      ? params.get("sort")
      : "relevance",
    page: /^\d{1,6}$/.test(params.get("page") || "")
      ? Math.max(1, Number(params.get("page")))
      : 1,
  };
}

/** UI dùng chỉ mục thật; không tạo dữ kiện, ảnh hay kết quả thay thế. */
export function loadCatalog({ retry = false } = {}) {
  if (retry) catalogRequest = null;
  if (!catalogRequest)
    catalogRequest = (async () => {
      const rows = await readCatalog();
      const periodIds = [...new Set(rows.flatMap((item) => item.periodIds))];
      // Nhãn phụ thiếu không làm mất các kết quả đã có trong catalog.
      const periodResults = await Promise.allSettled(
        periodIds.map((id) => loadContent(id)),
      );
      const periods = new Map(
        periodIds.map((id, index) => {
          const result = periodResults[index];
          return [
            id,
            result.status === "fulfilled" &&
            typeof result.value.title === "string"
              ? result.value.title
              : id,
          ];
        }),
      );
      const records = rows.map((item) => {
        const href = new URL("../../pages/detail.html", import.meta.url);
        href.searchParams.set("id", item.id);
        return {
          ...item,
          periodTitle: item.periodIds.map((id) => periods.get(id)).join(" · "),
          href: href.href,
        };
      });
      return { records, periods };
    })().catch((error) => {
      catalogRequest = null;
      throw error;
    });
  return catalogRequest;
}

export function searchCatalog(records, state) {
  const query = state.q?.trim();
  if (!query) return [];
  const matches = filterByType(findCatalog(query, records), state.type).filter(
    (item) =>
      (!state.period || item.periodIds.includes(state.period)) &&
      (!state.from ||
        (item.year !== null && item.year >= Number(state.from))) &&
      (!state.to || (item.year !== null && item.year <= Number(state.to))),
  );
  return matches.sort((a, b) => {
    if (state.sort === "year-asc" || state.sort === "year-desc") {
      if (a.year === null || b.year === null)
        return Number(a.year === null) - Number(b.year === null);
      return (state.sort === "year-desc" ? -1 : 1) * (a.year - b.year);
    }
    const term = normalize(query);
    const score = (item) =>
      normalize(item.title) === term
        ? 2
        : normalize(item.title).includes(term)
          ? 1
          : 0;
    return score(b) - score(a);
  });
}
