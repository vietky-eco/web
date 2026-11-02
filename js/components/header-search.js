// Ô tìm kiếm luôn hiện trên navbar; dữ liệu hiện tại là các danh mục có thật.
import { NAVIGATION_GROUPS, categoryURL } from "./navigation-data.js?v=2";

function normalize(value) {
  return value.toLocaleLowerCase("vi")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d");
}

const categories = NAVIGATION_GROUPS.flatMap((group) =>
  group.items.map((item) => ({
    title: item.title,
    group: group.title,
    href: categoryURL(item),
    keywords: normalize(`${item.title} ${group.title} ${item.description}`),
  })),
);

export function initHeaderSearch(header, { onFocus }) {
  const container = header.querySelector(".vk-search");
  const form = header.querySelector("#vk-search-form");
  const input = form.querySelector("input");
  const results = form.querySelector(".vk-search-results");
  const status = form.querySelector(".vk-search-status");
  let suppressFocus = false;

  // Giữ danh sách gợi ý trong màn hình cả khi ô nhập nằm sát mép phải.
  function positionResults() {
    if (results.hidden) return;
    const bounds = form.getBoundingClientRect();
    const width = Math.min(320, window.innerWidth - 32);
    const left = Math.max(16, Math.min(bounds.right - width, window.innerWidth - width - 16));
    results.style.width = `${width}px`;
    results.style.right = `${bounds.right - left - width}px`;
  }

  function renderResults() {
    const words = normalize(input.value.trim()).split(/\s+/).filter(Boolean);
    results.replaceChildren();
    results.hidden = words.length === 0;
    status.textContent = "";
    if (!words.length) return;
    const matches = categories.filter((item) =>
      words.every((word) => item.keywords.includes(word)),
    );
    status.textContent = `Tìm thấy ${matches.length} danh mục.`;
    matches.forEach((item) => {
      const row = document.createElement("li");
      const link = document.createElement("a");
      link.href = item.href;
      const title = document.createElement("span");
      title.textContent = item.title;
      const group = document.createElement("small");
      group.textContent = item.group;
      link.append(title, group);
      row.append(link);
      results.append(row);
    });
    if (!matches.length) {
      const row = document.createElement("li");
      row.className = "vk-search-empty";
      row.textContent = "Không tìm thấy danh mục phù hợp.";
      results.append(row);
    }
    positionResults();
  }

  function close(restoreFocus = false) {
    results.hidden = true;
    status.textContent = "";
    if (restoreFocus) {
      suppressFocus = true;
      input.focus();
      suppressFocus = false;
    }
  }

  input.addEventListener("focus", () => {
    if (suppressFocus) return;
    onFocus();
    renderResults();
  });
  input.addEventListener("input", renderResults);
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    onFocus();
    renderResults();
    const first = results.querySelector("a");
    (first || input).focus();
  });
  form.addEventListener("keydown", (event) => {
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    const links = [...results.querySelectorAll("a")];
    if (results.hidden || !links.length) return;
    const current = links.indexOf(document.activeElement);
    if (document.activeElement !== input && current < 0) return;
    event.preventDefault();
    if (document.activeElement === input) {
      links[event.key === "ArrowDown" ? 0 : links.length - 1].focus();
    } else {
      const next = current + (event.key === "ArrowDown" ? 1 : -1);
      (links[next] || input).focus();
    }
  });
  form.addEventListener("click", (event) => {
    if (event.target.closest("a")) close();
  });
  document.addEventListener("pointerdown", (event) => {
    if (!results.hidden && !container.contains(event.target)) close();
  });
  document.addEventListener("focusin", (event) => {
    if (!results.hidden && !container.contains(event.target)) close();
  });
  const observer = new ResizeObserver(positionResults);
  observer.observe(header.querySelector(".vk-header-inner"));
  window.addEventListener("resize", positionResults);

  return { close, isOpen: () => !results.hidden };
}
