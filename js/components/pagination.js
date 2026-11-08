import "../../assets/vendor/lucide/lucide.min.js";

export function createPagination({ label = "Phân trang", onPageChange, showSinglePage = false }) {
  const nav = document.createElement("nav");
  nav.className = "vk-pagination";
  nav.setAttribute("aria-label", label);
  nav.hidden = true;

  const leading = document.createElement("div");
  leading.className = "vk-pagination-arrows";
  const range = document.createElement("div");
  range.className = "vk-pagination-range";
  const trailing = document.createElement("div");
  trailing.className = "vk-pagination-arrows";
  nav.append(leading, range, trailing);

  let page = 1;
  let total = 1;

  function goTo(target) {
    if (target !== page && target >= 1 && target <= total) onPageChange(target);
  }

  function arrow(icon, label, target) {
    const button = document.createElement("button");
    button.className = "vk-pagination-arrow";
    button.type = "button";
    button.setAttribute("aria-label", label);
    button.title = label;
    const lucide = globalThis.lucide;
    button.append(lucide.createElement(lucide[icon], { "aria-hidden": "true", focusable: "false" }));
    button.addEventListener("click", () => goTo(target()));
    return button;
  }

  const first = arrow("ChevronsLeft", "Trang đầu", () => 1);
  const previous = arrow("ChevronLeft", "Trang trước", () => page - 1);
  const next = arrow("ChevronRight", "Trang sau", () => page + 1);
  const last = arrow("ChevronsRight", "Trang cuối", () => total);
  leading.append(first, previous);
  trailing.append(next, last);

  function gap() {
    const item = document.createElement("span");
    item.className = "vk-pagination-gap";
    item.textContent = "…";
    item.setAttribute("aria-hidden", "true");
    return item;
  }

  function update(currentPage, totalPages) {
    const focused = document.activeElement;
    const numberHadFocus = range.contains(focused);
    total = Math.max(1, totalPages);
    page = Math.max(1, Math.min(currentPage, total));
    nav.hidden = total === 1 && !showSinglePage;
    first.disabled = previous.disabled = page === 1;
    next.disabled = last.disabled = page === total;
    if (nav.hidden) {
      range.replaceChildren();
      return;
    }

    // Luôn hiện trọn danh sách ngắn. Danh sách dài giữ một cụm quanh trang hiện tại.
    const start = total <= 5 ? 1 : Math.max(1, Math.min(page - 2, total - 3));
    const end = total <= 5 ? total : start + 3;
    const items = [];
    if (start > 1) items.push(gap());
    for (let number = start; number <= end; number++) {
      const button = document.createElement("button");
      button.className = "vk-pagination-number";
      button.type = "button";
      button.textContent = String(number);
      button.setAttribute("aria-label", `Trang ${number}`);
      if (number === page) button.setAttribute("aria-current", "page");
      button.addEventListener("click", () => goTo(number));
      items.push(button);
    }
    if (end < total) items.push(gap());
    range.replaceChildren(...items);

    if (numberHadFocus) range.querySelector('[aria-current="page"]').focus({ preventScroll: true });
    else if (nav.contains(focused) && focused.disabled) {
      (next.disabled ? previous : next).focus({ preventScroll: true });
    }
  }

  return { element: nav, update };
}
