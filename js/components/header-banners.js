// Banner luôn mở mục lớn; mục con chỉ dùng để xem trước.
import { NAVIGATION_GROUPS, categoryImageURL } from "./navigation-data.js?v=2";

export function initHeaderBanners(header) {
  const resetters = new Map();

  NAVIGATION_GROUPS.forEach((group) => {
    const panel = header.querySelector(`#vk-dropdown-${group.id}`);
    const banner = panel?.querySelector(".vk-category-banner");
    if (!banner) return;
    const image = banner.querySelector(".vk-banner-image");
    if (!image) return;

    const caption = banner.querySelector(".vk-banner-caption");
    if (caption) {
      caption.querySelector(".vk-banner-tagline").textContent = group.bannerTagline;
    }
    const rows = [...panel.querySelectorAll("[data-vk-category]")];
    let selected;

    // Nạp trước ảnh để lần hover đầu không phải chờ tải.
    [group, ...group.items].forEach((content) => {
      const preload = new Image();
      preload.decoding = "async";
      preload.fetchPriority = "low";
      preload.src = categoryImageURL(content);
    });

    // Đổi ảnh và caption; giữ link trỏ về tổng quan.
    function show(item = null) {
      const key = item?.id || group.id;
      if (selected === key) return;
      selected = key;
      const content = item || group;

      const current = new URL(location.href);
      const destination = new URL(banner.href);
      const isCurrent = current.pathname === destination.pathname;
      if (isCurrent) banner.setAttribute("aria-current", "page");
      else banner.removeAttribute("aria-current");
      banner.dataset.preview = key;
      banner.dataset.previewMode = item ? "category" : "overview";
      banner.setAttribute("aria-label", `Xem tổng quan ${group.title}`);

      image.src = categoryImageURL(content);
      if (caption) {
        caption.querySelector(".vk-banner-name").textContent = content.title;
      }
      rows.forEach((row) => {
        row.classList.toggle("vk-preview-active", row.dataset.vkCategory === item?.id);
      });
    }

    rows.forEach((row) => {
      const item = group.items.find((entry) => entry.id === row.dataset.vkCategory);
      if (!item) return;
      row.addEventListener("pointerenter", (event) => {
        if (event.pointerType === "mouse") show(item);
      });
      row.addEventListener("focusin", () => show(item));
    });

    // Rê chuột hoặc Tab sang banner sẽ khôi phục mục lớn.
    banner.addEventListener("pointerenter", (event) => {
      if (event.pointerType === "mouse") show();
    });
    banner.addEventListener("focusin", () => show());

    resetters.set(panel, () => show());
    show();
  });

  return { reset: (panel) => resetters.get(panel)?.() };
}
