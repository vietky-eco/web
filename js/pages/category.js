// Chuyển URL danh mục cũ đến mục phụ hoặc danh sách khám phá hiện tại.
import { NAVIGATION_GROUPS, categoryURL } from "../components/navigation-data.js?v=2";

const params = new URL(location.href).searchParams;
const group = NAVIGATION_GROUPS.find((entry) => entry.id === params.get("group"));
const section = group?.items.find((entry) => entry.id === params.get("section"));
const destination = section
  ? categoryURL(section)
  : new URL(`../../kham-pha${group ? `#${group.id}` : ""}`, import.meta.url).href;

location.replace(destination);
