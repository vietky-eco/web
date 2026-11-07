import { NAVIGATION_GROUPS, categoryURL } from "./navigation-data.js?v=2";
import {
  loadCatalog,
  normalize,
  readSearchState,
  searchCatalog,
  SEARCH_URL,
  TYPES,
} from "../features/search-ui-adapter.js";
import { element } from "./search-results.js";
import { createSearchDialog } from "./search-dialog.js";

const categories = NAVIGATION_GROUPS.flatMap((group) =>
  group.items.map((item) => ({
    title: item.title,
    group: group.title,
    href: categoryURL(item),
    keywords: normalize(`${item.title} ${group.title} ${item.description}`),
  })),
);

export function initHeaderSearch(header, { onFocus }) {
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
  const container = header.querySelector(".vk-search"),
    form = header.querySelector("#vk-search-form");
  const input = form.querySelector("input");
  const results = element("ul", "vk-search-results");
  results.id = "vk-search-results";
  results.hidden = true;
  const status = element("span", "vk-search-status");
  status.setAttribute("role", "status");
  input.setAttribute("aria-controls", results.id);
  input.setAttribute("aria-expanded", "false");
  form.append(results, status);
  const popup = createSearchDialog(input);
  let timer,
    request = 0,
    suppressFocus = false;
  input.setAttribute(
    "aria-label",
    "Tìm kiếm trong Việt Ký",
  );
  input.value = readSearchState().q;
  form.action = SEARCH_URL.href;
  form.method = "get";
  function positionResults() {
    if (results.hidden) return;
    const bounds = form.getBoundingClientRect(),
      width = Math.min(390, window.innerWidth - 32);
    const left = Math.max(
      16,
      Math.min(bounds.right - width, window.innerWidth - width - 16),
    );
    results.style.width = `${width}px`;
    results.style.right = `${bounds.right - left - width}px`;
  }
  function closeSuggestions() {
    clearTimeout(timer);
    request++;
    results.hidden = true;
    input.setAttribute("aria-expanded", "false");
    status.textContent = "";
  }
  function restoreFocus() {
    suppressFocus = true;
    input.focus({ preventScroll: true });
    queueMicrotask(() => {
      suppressFocus = false;
    });
  }
  function close(restore = false) {
    closeSuggestions();
    popup.close();
    if (restore) restoreFocus();
  }
  function linkRow(title, subtitle, href) {
    const row = element("li"),
      link = element("a");
    link.href = href;
    link.append(element("span", "", title), element("small", "", subtitle));
    row.append(link);
    return row;
  }
  async function suggest() {
    const q = input.value.trim().slice(0, 100);
    if (!q) {
      closeSuggestions();
      return;
    }
    const token = ++request;
    results.replaceChildren(
      element("li", "vk-search-empty", "Đang tìm gợi ý…"),
    );
    results.hidden = false;
    input.setAttribute("aria-expanded", "true");
    positionResults();
    let matches = [];
    try {
      const catalog = await loadCatalog();
      matches = searchCatalog(catalog.records, { q, type: "all" }).slice(0, 4);
    } catch {
      /* Vẫn giữ lối vào danh mục và trang kết quả khi catalog lỗi. */
    }
    if (token !== request || popup.isOpen()) return;
    const words = normalize(q).split(/\s+/).filter(Boolean);
    const navigation = categories
      .filter((item) => words.every((word) => item.keywords.includes(word)))
      .slice(0, Math.max(0, 4 - matches.length));
    results.replaceChildren(
      ...matches.map((item) =>
        linkRow(
          item.title,
          [TYPES[item.type], item.year ?? ""].filter(Boolean).join(" · "),
          item.href,
        ),
      ),
      ...navigation.map((item) =>
        linkRow(item.title, `Danh mục · ${item.group}`, item.href),
      ),
    );
    if (!matches.length && !navigation.length)
      results.append(
        element(
          "li",
          "vk-search-empty",
          "Chưa có gợi ý phù hợp. Nhấn Enter để tìm toàn bộ nội dung.",
        ),
      );
    const row = element("li"),
      button = element(
        "button",
        "sr-suggestion-all",
        `Tìm “${q}” trong toàn bộ nội dung →`,
      );
    button.type = "button";
    button.addEventListener("click", submit);
    row.append(button);
    results.append(row);
    status.textContent = `${matches.length + navigation.length} gợi ý. Dùng phím mũi tên để chọn hoặc Enter để tìm toàn bộ.`;
    positionResults();
  }
  function submit() {
    const q = input.value.trim();
    if (!q) {
      closeSuggestions();
      input.focus();
      return;
    }
    closeSuggestions();
    if (
      location.pathname.replace(/\.html$/, "") ===
      SEARCH_URL.pathname.replace(/\.html$/, "")
    )
      window.dispatchEvent(
        new CustomEvent("vk:search-submit", { detail: { q } }),
      );
    else popup.open(q);
  }
  input.addEventListener("focus", () => {
    if (suppressFocus || input.dataset.searchReturn) return;
    onFocus();
    if (input.value.trim()) suggest();
  });
  input.addEventListener("input", (event) => {
    clearTimeout(timer);
    request++;
    if (event.isComposing) return;
    if (!input.value.trim()) {
      closeSuggestions();
      return;
    }
    timer = setTimeout(suggest, 160);
  });
  input.addEventListener("compositionstart", () => {
    clearTimeout(timer);
    request++;
  });
  input.addEventListener("compositionend", () => {
    clearTimeout(timer);
    timer = setTimeout(suggest, 160);
  });
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (event.isComposing) return;
    onFocus();
    submit();
  });
  form.addEventListener("keydown", (event) => {
    if (event.isComposing) return;
    if (event.key === "Escape") {
      event.preventDefault();
      close(true);
      return;
    }
    if (!["ArrowDown", "ArrowUp"].includes(event.key) || results.hidden) return;
    const links = [...results.querySelectorAll("a,button")],
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
    if (!container.contains(event.target)) closeSuggestions();
  });
  document.addEventListener("focusin", (event) => {
    if (!container.contains(event.target)) closeSuggestions();
  });
  window.addEventListener("vk:search-state", (event) => {
    input.value = event.detail.q;
    closeSuggestions();
  });
  new ResizeObserver(positionResults).observe(
    header.querySelector(".vk-header-inner"),
  );
  window.addEventListener("resize", positionResults);
  return { close, isOpen: () => !results.hidden || popup.isOpen() };
}
