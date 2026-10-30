const query = new URLSearchParams(location.search).get("q")?.trim() ?? "";
const queryText = document.getElementById("search-query");
if (queryText) {
  queryText.textContent = query ? `Từ khóa bạn đã nhập: “${query}”` : "Nhập từ khóa vào ô tìm kiếm để tìm sự kiện hoặc nhân vật.";
}
