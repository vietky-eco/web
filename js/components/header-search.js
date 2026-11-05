// Giao diện nhập tìm kiếm; chưa tích hợp kết quả hoặc popup gợi ý.
export function initHeaderSearch(header, { onFocus }) {
  const form = header.querySelector("#vk-search-form");
  const input = form.querySelector("input");

  input.addEventListener("focus", onFocus);
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    input.focus();
  });
}
