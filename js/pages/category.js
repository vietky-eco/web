// Chọn danh mục từ cấu hình theo group và section trong URL.
import { NAVIGATION_GROUPS, categoryURL } from "../components/navigation-data.js?v=2";

const params = new URL(location.href).searchParams;
const group = NAVIGATION_GROUPS.find((entry) => entry.id === params.get("group"));
const section = group?.items.find((entry) => entry.id === params.get("section"));
const main = document.querySelector("#vk-category-main");
const content = section || group;

if (content) {
  document.title = `${content.title} | Việt Ký`;
  main.querySelector("h1").textContent = content.title;
  main.querySelector("[data-category-description]").textContent = content.description;
  main.querySelector(".vk-info-eyebrow").textContent = section
    ? group.title.toLocaleUpperCase("vi")
    : "KHÁM PHÁ VIỆT KÝ";
}

const list = document.createElement("ul");
const links = section
  ? [{ title: `Tất cả ${group.title}`, href: categoryURL(group) }]
  : group
    ? group.items.map((item) => ({ title: item.title, href: categoryURL(group, item) }))
    : NAVIGATION_GROUPS.map((entry) => ({
        title: entry.title,
        href: categoryURL(entry),
      }));

links.forEach(({ title, href }) => {
  const row = document.createElement("li");
  const link = document.createElement("a");
  link.textContent = title;
  link.href = href;
  row.append(link);
  list.append(row);
});
main.querySelector("[data-category-links]").append(list);
