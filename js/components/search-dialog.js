import { formatSearchYear, loadCatalog, localSearchPreviewUrl, SEARCH_QUICK_TYPES, searchCatalog, TYPES } from "../features/search-ui-adapter.js";
import { createPagination } from "./pagination.js";
import { createScrollArea } from "./scroll-progress.js";
import { createSearchFilters, createSearchSelect } from "./search-filters.js";
import { element, resultCard, searchIcon, showLoading, showState } from "./search-results.js";

const PAGE_SIZE = 10;
const LEGACY_CATEGORIES = { "su-kien": "event", "nhan-vat": "person", "dia-danh": "place", "di-tich": "place", "hien-vat": "artifact", "phong-tuc": "culture", "tin-nguong": "culture", "nghe-thuat": "culture", "le-hoi": "culture" };

function restoreFilters(saved, catalog) {
  if (!saved) return {};
  const savedTypes = Array.isArray(saved.types) ? saved.types : [saved.type];
  const legacyTypes = Array.isArray(saved.categories) ? saved.categories.map((id) => LEGACY_CATEGORIES[id]) : [];
  const types = [...new Set([...savedTypes, ...legacyTypes].filter((id) => SEARCH_QUICK_TYPES.includes(id)))];
  const period = catalog.periods.has(saved.period) ? saved.period : "";
  const bounds = period ? catalog.periods.get(period).bounds : catalog.yearBounds;
  let from = null;
  let to = null;
  if (bounds && period === (saved.period || "")) {
    const [min, max] = bounds;
    if (Number.isSafeInteger(saved.from) && saved.from > min) from = Math.min(max, saved.from);
    if (Number.isSafeInteger(saved.to) && saved.to < max) to = Math.max(min, saved.to);
    if (from != null && to != null && from > to) from = to = null;
  }
  return { types, period, from, to };
}

export function createSearchDialog(navbarInput) {
  const mobile = window.matchMedia("(max-width: 680px)");
  // Khung popup và thanh tìm kiếm.
  const dialog = element("dialog", "sr-dialog");
  dialog.setAttribute("aria-label", "Tra cứu Việt Ký");
  const shell = element("div", "sr-dialog-shell");
  const toolbar = element("header", "sr-dialog-toolbar");
  const search = element("div", "sr-quick-search");
  search.setAttribute("role", "search");
  search.setAttribute("aria-label", "Tìm kiếm trong popup");
  const queryInput = element("input", "sr-query-input");
  queryInput.type = "search";
  queryInput.maxLength = 100;
  queryInput.autocomplete = "off";
  queryInput.spellcheck = false;
  queryInput.placeholder = "Nhập từ khóa…";
  queryInput.setAttribute("aria-label", "Từ khóa tìm kiếm");
  const clearQuery = element("button", "sr-search-clear");
  clearQuery.type = "button";
  clearQuery.setAttribute("aria-label", "Xóa từ khóa");
  clearQuery.title = "Xóa từ khóa";
  clearQuery.append(searchIcon("Delete"));
  const queryIcon = searchIcon("Search", "sr-query-icon");
  search.append(queryIcon, queryInput, clearQuery);
  const filters = createSearchFilters({ onChange: applyFilters });
  toolbar.append(search);
  const sortSelect = createSearchSelect("Sắp xếp", [
    ["relevance", "Liên quan nhất"],
    ["year-asc", "Năm tăng dần"],
    ["year-desc", "Năm giảm dần"],
  ], "sr-sort-field");
  const { field: sortField, select: sort } = sortSelect;
  sortField.hidden = true;
  const count = element("p", "sr-quick-count");
  count.setAttribute("role", "status");
  const resultHeading = element("div", "sr-results-heading");
  resultHeading.append(count, filters.toggle, sortField);

  const chips = element("div", "sr-chip-bar");
  const appliedFilters = element("ul", "sr-applied-filters");
  appliedFilters.setAttribute("aria-label", "Bộ lọc đang áp dụng");
  const clearFilters = element("button", "sr-text-button", "Xóa hết");
  clearFilters.type = "button";
  clearFilters.hidden = true;
  clearFilters.setAttribute("aria-label", "Xóa hết bộ lọc");
  chips.append(appliedFilters, clearFilters);
  const suggestions = element("div", "sr-query-suggestions");
  suggestions.hidden = true;

  const results = element("div", "sr-quick-results");
  const resultArea = createScrollArea(results);
  resultArea.element.classList.add("sr-results-scroll");
  const content = element("div", "sr-quick-content");
  content.append(resultHeading, chips, suggestions, resultArea.element);
  const pagination = createPagination({
    label: "Phân trang kết quả",
    showSinglePage: true,
    onPageChange(target) {
      page = target;
      renderResults();
    },
  });
  pagination.element.classList.add("sr-dialog-bottom");
  const view = element("div", "sr-results-view");
  view.append(content, pagination.element);
  shell.append(filters.element, view);
  dialog.append(toolbar, shell);
  document.body.append(dialog);

  let queryVersion = 0;
  let activeQuery = "";
  let page = 1;
  let catalog;
  let applied = {};
  let pendingFilters;
  let sectionAfterLoad = "";
  let showAllChips = false;

  function findMatches(filters) {
    const state = { ...filters, q: activeQuery, sort: sort.value };
    if (state.from != null || state.to != null) {
      const bounds = state.period ? catalog.periods.get(state.period).bounds : catalog.yearBounds;
      state.from ??= bounds?.[0];
      state.to ??= bounds?.[1];
    }
    return searchCatalog(catalog.records, state);
  }

  function applyFilters(next) {
    applied = next;
    showAllChips = false;
    page = 1;
    renderResults();
  }

  function replaceFilters(next) {
    filters.setFilters(next);
    applyFilters(next);
  }

  function clearAllFilters() {
    replaceFilters({});
    filters.focusTrigger();
  }

  function renderChips() {
    const { types = [], period, from, to } = applied;
    const entries = [];
    entries.push(...types.map((id) => [TYPES[id], () => ({ ...applied, types: types.filter((type) => type !== id) })]));
    if (period) entries.push([
      catalog.periods.get(period).label,
      () => ({ ...applied, period: "", from: null, to: null }),
    ]);
    if (from != null || to != null) {
      let label;
      if (from != null && to != null) label = from === to ? `Năm ${formatSearchYear(from)}` : `${formatSearchYear(from)}–${formatSearchYear(to)}`;
      else label = from != null ? `Từ năm ${formatSearchYear(from)}` : `Đến năm ${formatSearchYear(to)}`;
      entries.push([label, () => ({ ...applied, from: null, to: null })]);
    }

    clearFilters.hidden = !entries.length;
    appliedFilters.hidden = !entries.length;
    const limit = mobile.matches ? 1 : 3;
    const visible = showAllChips ? entries : entries.slice(0, limit);
    const rows = visible.map(([label, remove]) => {
      const row = element("li");
      const button = element("button", "sr-filter-chip");
      button.type = "button";
      button.title = label;
      button.setAttribute("aria-label", `Bỏ bộ lọc ${label}`);
      button.append(element("span", "", label), searchIcon("X"));
      button.addEventListener("click", () => {
        replaceFilters(remove());
        const nextChip = appliedFilters.querySelector("button");
        if (nextChip) nextChip.focus();
        else filters.focusTrigger();
      });
      row.append(button);
      return row;
    });
    if (entries.length > limit) {
      const row = element("li");
      const more = element("button", "sr-chip-more", showAllChips ? "Thu gọn" : `+${entries.length - limit} điều kiện`);
      more.type = "button";
      more.setAttribute("aria-expanded", String(showAllChips));
      more.addEventListener("click", () => {
        showAllChips = !showAllChips;
        renderChips();
        appliedFilters.querySelector(".sr-chip-more").focus();
      });
      row.append(more);
      rows.push(row);
    }
    chips.toggleAttribute("data-expanded", showAllChips);
    appliedFilters.replaceChildren(...rows);
    return entries.length;
  }

  function renderSuggestions(activeFilters) {
    const terms = activeQuery || activeFilters ? [] : [...catalog.periods.values()]
      .map(({ label }) => label.replace(/\s*\([^)]*\)$/, ""))
      .filter((label) => !/^per\d+$/.test(label))
      .slice(0, 3);
    suggestions.hidden = !terms.length;
    suggestions.replaceChildren(element("span", "", "Gợi ý"));
    for (const term of terms) {
      const button = element("button", "sr-query-suggestion", term);
      button.type = "button";
      button.addEventListener("click", () => {
        queryInput.value = term;
        queryInput.focus();
        updateQuery();
      });
      suggestions.append(button);
    }
  }

  function renderResults() {
    if (!catalog) return;
    const activeFilters = renderChips();
    const matches = findMatches(applied);
    const totalPages = Math.max(1, Math.ceil(matches.length / PAGE_SIZE));
    page = Math.min(Math.max(1, page), totalPages);
    const start = (page - 1) * PAGE_SIZE;
    count.textContent = `${matches.length} kết quả`;
    sortField.hidden = !matches.length;
    pagination.update(page, totalPages);
    pagination.element.hidden = matches.length === 0;
    renderSuggestions(activeFilters);
    results.removeAttribute("aria-busy");
    resultArea.viewport.scrollTop = 0;
    if (!matches.length) {
      if (!catalog.records.length) {
        const previewUrl = localSearchPreviewUrl();
        showState(results, {
          title: "Chưa có nội dung đã xuất bản",
          text: previewUrl ? "Bật chế độ xem thử để tìm và lọc nội dung bản nháp trên máy này." : "Danh mục Việt Ký đang được cập nhật.",
          label: "Xem bản nháp",
          action: previewUrl ? () => {
            window.history.replaceState(window.history.state, "", previewUrl);
            queryInput.focus();
            open(activeQuery, { retry: true });
          } : undefined,
        });
        return;
      }
      showState(results, {
        title: "Chưa tìm thấy nội dung phù hợp",
        text: activeFilters ? "Thử bỏ bớt điều kiện lọc để mở rộng kết quả." : "Thử một từ khóa ngắn hơn.",
        label: activeFilters ? "Đổi bộ lọc" : "Sửa từ khóa",
        action: activeFilters ? openActiveFilter : () => {
          queryInput.focus();
          queryInput.select();
        },
      });
      return;
    }
    const list = element("ol", "sr-results");
    list.start = start + 1;
    list.append(...matches.slice(start, start + PAGE_SIZE).map((item) => resultCard(item, activeQuery)));
    results.replaceChildren(list);
  }

  function openActiveFilter() {
    const { period, from, to } = applied;
    const section = period || from != null || to != null ? "period" : "type";
    filters.show(section, true);
  }

  function dismiss() {
    if (filters.getActiveSection()) filters.show("", true);
    else close();
  }

  async function open(query, { retry = false, showFilters = false, restore } = {}) {
    const q = query.trim().slice(0, queryInput.maxLength);
    const version = ++queryVersion;
    activeQuery = q;
    navbarInput.value = q;
    const firstOpen = !dialog.open;
    if (firstOpen) {
      queryInput.value = q;
      clearQuery.hidden = !q;
      applied = {};
      pendingFilters = restore?.filters ?? restore;
      showAllChips = false;
      const defaultSection = showFilters || !mobile.matches ? "type" : "";
      const restoredSection = restore?.drawerOpen || restore?.mobileFiltersOpen ? "type" : "";
      const savedSection = ["place", "categories"].includes(restore?.filterSection) ? "type" : restore?.filterSection;
      sectionAfterLoad = restore ? (savedSection ?? restoredSection) : defaultSection;
      sort.value = [...sort.options].some((option) => option.value === restore?.sort) ? restore.sort : "relevance";
      sortSelect.sync();
      dialog.showModal();
      document.body.classList.add("sr-dialog-open");
      queryInput.focus({ preventScroll: true });
    }
    if (!retry) page = Number.isSafeInteger(restore?.page) && restore.page > 0 ? restore.page : 1;
    const needsCatalog = !catalog || retry;
    if (needsCatalog) {
      catalog = null;
      sectionAfterLoad ||= filters.getActiveSection();
      filters.setEnabled(false);
      sortField.hidden = true;
      clearFilters.hidden = true;
      appliedFilters.hidden = true;
      suggestions.hidden = true;
      pagination.update(1, 1);
      pagination.element.hidden = true;
      count.textContent = "Đang tìm kiếm…";
      showLoading(results);
      try {
        const data = await loadCatalog({ retry });
        if (version !== queryVersion || !dialog.open) return;
        catalog = data;
        filters.setCatalog(data);
      } catch {
        if (version !== queryVersion || !dialog.open) return;
        results.removeAttribute("aria-busy");
        count.textContent = "Không tải được kết quả";
        showState(results, {
          icon: "CircleAlert",
          title: "Không tải được dữ liệu tìm kiếm",
          text: "Kiểm tra kết nối hoặc thử tải lại.",
          action: () => {
            queryInput.focus();
            open(q, { retry: true });
          },
        });
        return;
      }
    }
    if (pendingFilters) {
      applied = restoreFilters(pendingFilters, catalog);
      pendingFilters = undefined;
    }
    filters.setEnabled(true);
    if (firstOpen || needsCatalog) filters.setFilters(applied);
    renderResults();
    if (sectionAfterLoad) {
      filters.show(sectionAfterLoad, showFilters);
      sectionAfterLoad = "";
    }
  }

  function close() {
    if (!dialog.open) return;
    queryVersion++;
    filters.show("");
    navbarInput.dataset.searchReturn = "true";
    dialog.close();
  }

  function getState() {
    if (!dialog.open) return null;
    return {
      query: queryInput.value,
      filters: pendingFilters ?? applied,
      sort: sort.value,
      page,
      filterSection: sectionAfterLoad || filters.getActiveSection(),
    };
  }

  function updateQuery() {
    clearQuery.hidden = !queryInput.value;
    const q = queryInput.value.trim().slice(0, queryInput.maxLength);
    if (q !== activeQuery) open(q);
  }
  queryInput.addEventListener("input", updateQuery);
  queryInput.addEventListener("compositionend", updateQuery);
  clearQuery.addEventListener("click", () => {
    queryInput.value = "";
    queryInput.focus();
    updateQuery();
  });
  clearFilters.addEventListener("click", clearAllFilters);
  sort.addEventListener("change", () => {
    page = 1;
    renderResults();
  });
  mobile.addEventListener("change", () => {
    if (catalog && dialog.open) renderChips();
  });

  dialog.addEventListener("close", () => {
    document.body.classList.remove("sr-dialog-open");
    navbarInput.dataset.searchReturn = "true";
    navbarInput.focus({ preventScroll: true });
    setTimeout(() => { delete navbarInput.dataset.searchReturn; }, 0);
  });
  dialog.addEventListener("cancel", (event) => {
    event.preventDefault();
    dismiss();
  });
  dialog.addEventListener("click", (event) => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) {
      close();
    }
  });
  dialog.addEventListener("keydown", (event) => {
    if (event.isComposing) return;
    if (event.key === "Escape") {
      event.preventDefault();
      dismiss();
      return;
    }
    if (!["ArrowDown", "ArrowUp"].includes(event.key)) return;
    const links = [...results.querySelectorAll(".sr-result-link")];
    if (!links.length) return;
    const focused = document.activeElement;
    const current = links.indexOf(focused);
    if (current < 0 && (event.key !== "ArrowDown" || focused !== queryInput)) return;
    event.preventDefault();
    if (current === 0 && event.key === "ArrowUp") {
      queryInput.focus();
      return;
    }
    links[Math.max(0, Math.min(links.length - 1, current + (event.key === "ArrowDown" ? 1 : -1)))].focus();
  });

  return { open, close, isOpen: () => dialog.open, getState };
}
