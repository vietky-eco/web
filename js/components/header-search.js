import { NAVIGATION_GROUPS, categoryURL } from "./navigation-data.js?v=2";
import {
  loadCatalog,
  searchCatalog,
  TYPES,
} from "../features/search-ui-adapter.js";
import { normalizeSearchText } from "../features/search.js";
import { createScrollArea } from "./scroll-progress.js";
import { element, resultTypeIcon, searchIcon, suggestionRow } from "./search-results.js";
import { createSearchDialog } from "./search-dialog.js";

const SUGGESTION_LIMIT = 10;
const SUGGESTION_DELAY_MS = 110;
const SEARCH_RELOAD_KEY = "vk-search-reload";

// Dùng dữ liệu menu để gợi ý danh mục ngay cả khi catalog không tải được.
const categories = NAVIGATION_GROUPS.flatMap((group) =>
  group.items.map((item) => ({
    id: item.id,
    title: item.title,
    group: group.title,
    href: categoryURL(item),
    keywords: normalizeSearchText(`${item.title} ${group.title} ${item.description}`),
  })),
);

export function initHeaderSearch(header, { onFocus }) {
  // Header dùng chung trên nhiều trang, nên nạp CSS tìm kiếm tại đây.
  if (!document.getElementById("vk-search-css")) {
    const sheet = document.createElement("link");
    sheet.id = "vk-search-css";
    sheet.rel = "stylesheet";
    sheet.href = new URL(
      "../../css/components/search.css",
      import.meta.url,
    ).href;
    document.head.append(sheet);
  }

  const container = header.querySelector(".vk-search");
  const form = header.querySelector("#vk-search-form");
  const input = form.querySelector("input");
  const results = element("div", "vk-search-results");
  results.id = "vk-search-results";
  results.hidden = true;
  const suggestions = element("ul", "vk-search-suggestion-list");
  const suggestionArea = createScrollArea(suggestions);
  const footer = element("div", "vk-search-suggestion-footer");
  const more = element("button", "vk-search-suggestion-more", "Xem thêm");
  more.type = "submit";
  more.append(searchIcon("ChevronRight", "vk-search-suggestion-arrow"));
  const moreRow = element("li");
  moreRow.append(more);
  const advanced = element("button", "vk-search-suggestion-advanced");
  advanced.type = "submit";
  advanced.append(searchIcon("SlidersHorizontal"), element("span", "", "Tìm kiếm nâng cao"));
  footer.append(advanced);
  results.append(suggestionArea.element, footer);
  const status = element("span", "vk-search-status");
  status.setAttribute("role", "status");
  input.setAttribute("aria-controls", results.id);
  form.append(results, status);

  const popup = createSearchDialog(input);
  let timer;
  let suggestionVersion = 0;

  // Đóng dropdown cũng vô hiệu hóa kết quả của lượt tìm đang chờ.
  function closeSuggestions() {
    clearTimeout(timer);
    suggestionVersion++;
    results.hidden = true;
    status.textContent = "";
  }

  // Ưu tiên nội dung trong catalog rồi điền chỗ còn trống bằng danh mục.
  function renderSuggestions(q, matches) {
    const words = normalizeSearchText(q).split(" ").filter(Boolean);
    const navigation = categories
      .filter((item) => words.length && words.every((word) => item.keywords.includes(word)))
      .slice(0, SUGGESTION_LIMIT - matches.length);
    suggestions.replaceChildren(
      ...matches.map((item) =>
        suggestionRow(
          item.title,
          [TYPES[item.type], item.year ?? ""].filter(Boolean).join(" · "),
          item.href,
          resultTypeIcon(item.type),
        ),
      ),
      ...navigation.map((item) => {
        const icon = header.querySelector(`[data-vk-category="${item.id}"] .vk-category-icon svg`);
        return suggestionRow(
          item.title,
          `Danh mục · ${item.group}`,
          item.href,
          icon?.cloneNode(true) ?? searchIcon("Layers"),
        );
      }),
    );

    const count = matches.length + navigation.length;
    if (!count) {
      suggestions.append(element("li", "vk-search-empty", "Chưa có gợi ý phù hợp."));
    }
    suggestions.append(moreRow);
    suggestionArea.viewport.scrollTop = 0;
    status.textContent = `${count} gợi ý. Dùng phím mũi tên để chọn.`;
  }

  // Chỉ lượt tìm mới nhất được cập nhật dropdown sau khi tải dữ liệu.
  async function suggest() {
    const q = input.value.trim().slice(0, input.maxLength);
    if (!q || popup.isOpen()) {
      closeSuggestions();
      return;
    }
    const version = ++suggestionVersion;
    if (results.hidden) {
      suggestions.replaceChildren(element("li", "vk-search-empty", "Đang tìm gợi ý…"));
    }
    results.hidden = false;

    let matches = [];
    try {
      const catalog = await loadCatalog();
      matches = searchCatalog(catalog.records, { q, type: "all" }).slice(0, SUGGESTION_LIMIT);
    } catch {
      // Vẫn hiện danh mục và nút mở popup để người dùng có thể thử lại.
    }
    if (version !== suggestionVersion || popup.isOpen()) return;
    renderSuggestions(q, matches);
  }

  function queueSuggestions() {
    if (!input.value.trim()) {
      closeSuggestions();
      return;
    }
    clearTimeout(timer);
    suggestionVersion++;
    timer = setTimeout(suggest, SUGGESTION_DELAY_MS);
  }

  // Quay lại ô tìm để tiếp tục từ khóa trước đó sau khi rời navbar.
  input.addEventListener("focus", () => {
    if (input.dataset.searchReturn) return;
    onFocus();
    if (results.hidden && input.value.trim()) suggest();
  });

  // Navbar nhận cả ký tự đang ghép dấu để gợi ý xuất hiện trước khi bấm Space.
  input.addEventListener("input", queueSuggestions);
  input.addEventListener("compositionend", queueSuggestions);

  // Các nút tìm mở cùng popup. Tìm kiếm nâng cao mở thẳng bộ lọc.
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (event.isComposing) return;
    onFocus();
    closeSuggestions();
    popup.open(input.value, { showFilters: event.submitter === advanced });
  });

  // Điều hướng gợi ý và đóng dropdown khi người dùng rời cụm tìm kiếm.
  form.addEventListener("keydown", (event) => {
    if (event.isComposing) return;
    if (event.key === "Escape") {
      event.preventDefault();
      if (results.contains(document.activeElement)) input.focus();
      closeSuggestions();
      return;
    }
    if (!["ArrowDown", "ArrowUp"].includes(event.key) || results.hidden) return;
    const links = [...results.querySelectorAll("a, button")],
      index = links.indexOf(document.activeElement);
    if (!links.length) return;
    event.preventDefault();
    const next = index + (event.key === "ArrowDown" ? 1 : -1);
    if (next < 0) input.focus();
    else links[Math.min(next, links.length - 1)].focus();
  });
  form.addEventListener("click", (event) => {
    if (event.target.closest(".vk-search-results a")) closeSuggestions();
  });
  document.addEventListener("pointerdown", (event) => {
    if (!container.contains(event.target) && !popup.isOpen()) closeSuggestions();
  });
  document.addEventListener("focusin", (event) => {
    if (!container.contains(event.target) && !popup.isOpen()) closeSuggestions();
  });

  // Chỉ khôi phục khi tải lại cùng trang trong tab hiện tại.
  const route = location.pathname + location.search;
  window.addEventListener("pagehide", () => {
    try {
      const state = popup.getState();
      sessionStorage.setItem(SEARCH_RELOAD_KEY, JSON.stringify({
        route: location.pathname + location.search,
        query: state?.query ?? input.value,
        popup: state,
      }));
    } catch {
      // Tìm kiếm vẫn hoạt động nếu trình duyệt chặn bộ nhớ của tab.
    }
  });
  if (performance.getEntriesByType("navigation")[0]?.type === "reload") {
    try {
      const state = JSON.parse(sessionStorage.getItem(SEARCH_RELOAD_KEY));
      if (state?.route === route && typeof state.query === "string") {
        input.value = state.query.slice(0, input.maxLength);
        if (state.popup && typeof state.popup === "object") popup.open(input.value, { restore: state.popup });
      }
    } catch {
      // Bỏ qua trạng thái cũ nếu bộ nhớ bị chặn hoặc dữ liệu không hợp lệ.
    }
  }
}
