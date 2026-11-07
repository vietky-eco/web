import {
  loadCatalog,
  searchCatalog,
  searchURL,
} from "../features/search-ui-adapter.js";
import {
  element,
  resultCard,
  showLoading,
  showState,
} from "./search-results.js";

export function createSearchDialog(input) {
  const dialog = element("dialog", "sr-dialog");
  dialog.setAttribute("aria-labelledby", "sr-quick-title");
  const shell = element("div", "sr-dialog-shell");
  const top = element("div", "sr-dialog-top");
  const title = element("h2", "", "Kết quả tìm kiếm");
  title.id = "sr-quick-title";
  const closeButton = element("button", "sr-close", "×");
  closeButton.type = "button";
  closeButton.setAttribute("aria-label", "Đóng kết quả tìm kiếm");
  top.append(title, closeButton);
  const count = element("p", "sr-quick-count");
  count.setAttribute("role", "status");
  const results = element("div", "sr-quick-results");
  const bottom = element("div", "sr-dialog-bottom");
  const edit = element("button", "sr-text-button", "Sửa từ khóa");
  edit.type = "button";
  const all = element("a", "sr-button", "Xem tất cả kết quả →");
  bottom.append(edit, all);
  shell.append(top, count, results, bottom);
  dialog.append(shell);
  document.body.append(dialog);
  let request = 0;
  function close() {
    if (!dialog.open) return;
    request++;
    input.dataset.searchReturn = "true";
    dialog.close();
  }
  dialog.addEventListener("close", () => {
    document.body.classList.remove("sr-dialog-open");
    input.dataset.searchReturn = "true";
    input.focus({ preventScroll: true });
    setTimeout(() => {
      delete input.dataset.searchReturn;
    }, 0);
  });
  closeButton.addEventListener("click", close);
  edit.addEventListener("click", close);
  dialog.addEventListener("cancel", (event) => {
    event.preventDefault();
    close();
  });
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) {
      const rect = dialog.getBoundingClientRect();
      if (
        event.clientX < rect.left ||
        event.clientX > rect.right ||
        event.clientY < rect.top ||
        event.clientY > rect.bottom
      )
        close();
    }
  });
  dialog.addEventListener("keydown", (event) => {
    if (!["ArrowDown", "ArrowUp"].includes(event.key)) return;
    const links = [...results.querySelectorAll(".sr-result-link")];
    if (!links.length) return;
    const current = links.indexOf(document.activeElement);
    if (current < 0 && document.activeElement !== closeButton) return;
    event.preventDefault();
    links[
      Math.max(
        0,
        Math.min(
          links.length - 1,
          current + (event.key === "ArrowDown" ? 1 : -1),
        ),
      )
    ].focus();
  });
  async function open(query, retry = false) {
    const q = query.trim().slice(0, 100);
    if (!q) return;
    const token = ++request;
    title.textContent = `Kết quả cho “${q}”`;
    count.textContent = "Đang tìm kiếm…";
    all.href = searchURL({ q }).href;
    showLoading(results);
    if (!dialog.open) {
      dialog.showModal();
      document.body.classList.add("sr-dialog-open");
    }
    closeButton.focus();
    try {
      const catalog = await loadCatalog({ retry });
      if (token !== request || !dialog.open) return;
      const matches = searchCatalog(catalog.records, { q, type: "all" });
      count.textContent = `${matches.length} kết quả${matches.length > 6 ? " · Hiển thị 6 kết quả nhanh" : ""}`;
      results.removeAttribute("aria-busy");
      if (!matches.length) {
        showState(results, {
          title: "Chưa tìm thấy nội dung phù hợp",
          text: catalog.unconfigured
            ? "Nội dung tìm kiếm đang được cập nhật. Bạn vẫn có thể dùng các gợi ý danh mục trên thanh tìm kiếm."
            : "Thử từ khóa ngắn hơn hoặc tìm trong trang kết quả đầy đủ.",
          action: close,
          label: "Sửa từ khóa",
        });
        return;
      }
      const list = element("ol", "sr-results");
      list.append(...matches.slice(0, 6).map((item) => resultCard(item, q)));
      results.replaceChildren(list);
    } catch {
      if (token !== request || !dialog.open) return;
      results.removeAttribute("aria-busy");
      count.textContent = "Không tải được kết quả";
      showState(results, {
        title: "Không tải được dữ liệu tìm kiếm",
        text: "Kiểm tra kết nối hoặc thử tải lại. Từ khóa của bạn vẫn được giữ.",
        action: () => open(q, true),
      });
    }
  }
  return { open, close, isOpen: () => dialog.open };
}
