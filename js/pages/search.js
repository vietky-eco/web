import {
  TYPES,
  loadCatalog,
  readSearchState,
  searchCatalog,
  searchURL,
} from "../features/search-ui-adapter.js";
import {
  element,
  resultCard,
  showLoading,
  showState,
} from "../components/search-results.js";

const host = document.getElementById("search-results"),
  count = document.getElementById("search-count");
const types = document.getElementById("search-types");
const pagination = document.getElementById("search-pagination");
const PAGE_SIZE = 6;
const filter = document.getElementById("search-filters"),
  form = document.getElementById("search-filter-form");
const period = document.getElementById("search-period"),
  from = document.getElementById("search-from"),
  to = document.getElementById("search-to");
const error = document.getElementById("search-filter-error"),
  sort = document.getElementById("search-sort");
let state = readSearchState(),
  catalog = null,
  request = 0;

function syncURL(replace = false) {
  const url = searchURL(state);
  if (url.href !== location.href)
    history[replace ? "replaceState" : "pushState"]({}, "", url);
  window.dispatchEvent(
    new CustomEvent("vk:search-state", { detail: { q: state.q } }),
  );
}
function resetFilters() {
  state = { ...state, type: "all", period: "", from: "", to: "" };
  state.page = 1;
  syncURL();
  render();
}
function renderFilters() {
  const base = catalog
    ? searchCatalog(catalog.records, { ...state, type: "all" })
    : [];
  types.replaceChildren(
    ...Object.entries(TYPES).map(([key, label]) => {
      const n =
        key === "all"
          ? base.length
          : base.filter((item) => item.type === key).length;
      const button = element(
        "button",
        "",
        `${label}${catalog ? ` (${n})` : ""}`,
      );
      button.type = "button";
      button.dataset.type = key;
      button.setAttribute("aria-pressed", String(key === state.type));
      button.addEventListener("click", () => {
        state.type = key;
        state.page = 1;
        syncURL();
        render();
      });
      return button;
    }),
  );
  sort.value = state.sort;
  const filterCount = [state.period, state.from, state.to].filter(
    Boolean,
  ).length;
  const filterButton = document.getElementById("search-filter-open");
  filterButton.textContent = filterCount
    ? `Bộ lọc nâng cao (${filterCount})`
    : "Bộ lọc nâng cao";
  filterButton.dataset.active = String(filterCount > 0);
  const applied = document.getElementById("search-applied");
  applied.replaceChildren();
  const selected = [];
  if (state.type !== "all")
    selected.push(["type", "Loại: " + TYPES[state.type]]);
  if (state.period)
    selected.push([
      "period",
      "Thời kỳ: " + (catalog?.periods.get(state.period) || state.period),
    ]);
  if (state.from) selected.push(["from", "Từ năm: " + state.from]);
  if (state.to) selected.push(["to", "Đến năm: " + state.to]);
  if (selected.length) {
    applied.append(element("span", "search-applied-label", "Đang lọc:"));
    for (const [key, label] of selected) {
      const chip = element("button", "search-filter-chip");
      chip.type = "button";
      chip.setAttribute("aria-label", "Bỏ lọc " + label);
      const icon = element("span", "", "×");
      icon.setAttribute("aria-hidden", "true");
      chip.append(element("span", "", label), icon);
      chip.addEventListener("click", () => {
        state[key] = key === "type" ? "all" : "";
        state.page = 1;
        syncURL();
        render();
        const next = applied.querySelector("button") || filterButton;
        next.focus({ preventScroll: true });
      });
      applied.append(chip);
    }
    const clear = element("button", "sr-text-button", "Xóa tất cả bộ lọc");
    clear.type = "button";
    clear.addEventListener("click", () => {
      resetFilters();
      filterButton.focus({ preventScroll: true });
    });
    applied.append(clear);
  }
}
function renderPagination(totalPages) {
  pagination.hidden = totalPages <= 1;
  if (totalPages <= 1) return;
  const goToPage = (nextPage) => {
    if (nextPage === state.page) return;
    state.page = nextPage;
    syncURL();
    render();
    host.tabIndex = -1;
    host.focus({ preventScroll: true });
    host.scrollIntoView({ block: "start", behavior: "instant" });
  };
  const step = (text, label, target, disabled) => {
    const button = element("button", "search-page-step", text);
    button.type = "button";
    button.setAttribute("aria-label", label);
    button.disabled = disabled;
    button.addEventListener("click", () => goToPage(target));
    return button;
  };
  pagination.append(step("‹", "Trang trước", state.page - 1, state.page === 1));
  const pages = [
    ...new Set([1, state.page - 1, state.page, state.page + 1, totalPages]),
  ]
    .filter((value) => value >= 1 && value <= totalPages)
    .sort((a, b) => a - b);
  const addNumber = (number) => {
    const link = element("a", "search-page-number", String(number));
    link.href = searchURL({ ...state, page: number }).href;
    link.setAttribute("aria-label", `Trang ${number}`);
    if (number === state.page) link.setAttribute("aria-current", "page");
    link.addEventListener("click", (event) => {
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey)
        return;
      event.preventDefault();
      goToPage(number);
    });
    pagination.append(link);
  };
  pages.forEach((number, index) => {
    const gap = number - pages[index - 1];
    if (gap === 2) addNumber(number - 1);
    else if (gap > 2) {
      const dots = element("span", "search-page-ellipsis", "…");
      dots.setAttribute("aria-hidden", "true");
      pagination.append(dots);
    }
    addNumber(number);
  });
  pagination.append(
    step("›", "Trang sau", state.page + 1, state.page === totalPages),
  );
}

function render() {
  host.removeAttribute("aria-busy");
  pagination.hidden = true;
  pagination.replaceChildren();
  document.getElementById("search-range").textContent = "";
  document.getElementById("search-query-label").textContent = state.q
    ? `Từ khóa: “${state.q}”`
    : "Nhập từ khóa trên thanh tìm kiếm.";
  document.title = state.q
    ? `Tìm “${state.q}” | Việt Ký`
    : "Tìm kiếm | Việt Ký";
  renderFilters();
  if (!state.q) {
    count.textContent = "";
    showState(host, {
      title: "Bạn muốn tìm hiểu điều gì?",
      text: "Nhập sự kiện, nhân vật hoặc địa danh vào ô tìm kiếm trên navbar.",
    });
    return;
  }
  if (!catalog) return;
  const matches = searchCatalog(catalog.records, state);
  count.textContent = `${matches.length} kết quả`;
  if (!matches.length) {
    const hasFilters =
      state.type !== "all" || state.period || state.from || state.to;
    const editQuery = () => {
      const input = document.getElementById("vk-search-input");
      input?.focus();
      input?.select();
    };
    showState(host, {
      title: "Chưa tìm thấy nội dung phù hợp",
      text: "Thử từ khóa ngắn hơn, tìm không dấu hoặc bỏ bớt bộ lọc.",
      action: hasFilters ? resetFilters : editQuery,
      label: hasFilters ? "Xóa bộ lọc" : "Đổi từ khóa",
    });
    return;
  }
  const totalPages = Math.ceil(matches.length / PAGE_SIZE);
  const currentPage = Math.min(Math.max(1, state.page), totalPages);
  if (currentPage !== state.page) {
    state.page = currentPage;
    syncURL(true);
  }
  const start = (currentPage - 1) * PAGE_SIZE;
  const end = Math.min(start + PAGE_SIZE, matches.length);
  const list = element("ol", "sr-results");
  list.start = start + 1;
  list.append(
    ...matches.slice(start, end).map((item) => resultCard(item, state.q)),
  );
  host.replaceChildren(list);
  document.getElementById("search-range").textContent =
    `Hiển thị ${start + 1}–${end} trong ${matches.length} kết quả`;
  renderPagination(totalPages);
}
async function load(retry = false) {
  const token = ++request;
  catalog = null;
  count.textContent = "Đang tải kết quả…";
  showLoading(host);
  pagination.hidden = true;
  pagination.replaceChildren();
  renderFilters();
  try {
    const data = await loadCatalog({ retry });
    if (token !== request) return;
    catalog = data;
    render();
  } catch {
    if (token !== request) return;
    host.removeAttribute("aria-busy");
    count.textContent = "Không tải được kết quả";
    showState(host, {
      title: "Không tải được dữ liệu tìm kiếm",
      text: "Kiểm tra kết nối hoặc thử lại. Từ khóa và bộ lọc của bạn vẫn được giữ.",
      action: () => load(true),
    });
  }
}
document.getElementById("search-filter-open").addEventListener("click", () => {
  period.replaceChildren(new Option("Tất cả thời kỳ", ""));
  const periods = new Map(catalog?.periods || []);
  if (state.period && !periods.has(state.period))
    periods.set(state.period, state.period);
  for (const [id, title] of periods) period.add(new Option(title, id));
  period.value = state.period;
  from.value = state.from;
  to.value = state.to;
  error.textContent = "";
  updateFilterPreview();
  filter.showModal();
  document.body.classList.add("sr-dialog-open");
});
filter.addEventListener("close", () =>
  document.body.classList.remove("sr-dialog-open"),
);
document
  .getElementById("search-filter-close")
  .addEventListener("click", () => filter.close());
document.getElementById("search-filter-clear").addEventListener("click", () => {
  period.value = "";
  from.value = "";
  to.value = "";
  error.textContent = "";
  updateFilterPreview();
});
function updateFilterPreview() {
  const preview = document.getElementById("search-filter-preview");
  if (
    !from.validity.valid ||
    !to.validity.valid ||
    (from.value && to.value && Number(from.value) > Number(to.value))
  ) {
    preview.textContent = "Kiểm tra lại khoảng năm đã nhập.";
    return;
  }
  if (!catalog) {
    preview.textContent = "Dữ liệu chưa sẵn sàng. Hãy thử tải lại kết quả.";
    return;
  }
  const total = searchCatalog(catalog.records, {
    ...state,
    period: period.value,
    from: from.value,
    to: to.value,
  }).length;
  preview.textContent = total + " kết quả phù hợp với lựa chọn";
}
form.addEventListener("input", () => {
  error.textContent = "";
  updateFilterPreview();
});
form.addEventListener("change", updateFilterPreview);
document
  .getElementById("search-filter-cancel")
  .addEventListener("click", () => filter.close());
form.addEventListener("submit", (event) => {
  event.preventDefault();
  if (from.value && to.value && Number(from.value) > Number(to.value)) {
    error.textContent = "Năm bắt đầu phải nhỏ hơn hoặc bằng năm kết thúc.";
    from.focus();
    return;
  }
  state = { ...state, period: period.value, from: from.value, to: to.value };
  state.page = 1;
  filter.close();
  syncURL();
  render();
});
sort.addEventListener("change", () => {
  state.sort = sort.value;
  state.page = 1;
  syncURL();
  render();
});
window.addEventListener("vk:search-submit", (event) => {
  state.q = event.detail.q.trim().slice(0, 100);
  state.page = 1;
  syncURL();
  if (catalog) render();
  else load();
});
window.addEventListener("popstate", () => {
  state = readSearchState();
  window.dispatchEvent(
    new CustomEvent("vk:search-state", { detail: { q: state.q } }),
  );
  if (catalog) render();
  else load();
});
syncURL(true);
load();
