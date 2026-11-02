// Icon Lucide dùng bản cố định trong assets/vendor/lucide.
import "../../assets/vendor/lucide/lucide.min.js";

const LUCIDE_GRAPHICS = {
  place: "map-pin",
  architecture: "landmark",
  artifact: "amphora",
  map: "map",
  custom: "sprout",
  belief: "flame",
  art: "music",
  festival: "flag",
  timeline: "list-tree",
  period: "columns-3",
  event: "flag-triangle-right",
  person: "users-round",
  heritage: "landmark",
  culture: "flower-2",
  story: "route",
  search: "search",
  menu: "menu",
  close: "x",
};

// Dựng SVG sau khi tải fragment để tránh lỗi Live Server.
export function renderHeaderGraphics(root) {
  root.querySelectorAll("[data-vk-graphic]").forEach((element) => {
    const iconName = LUCIDE_GRAPHICS[element.dataset.vkGraphic];
    if (!iconName) return;
    const icon = document.createElement("i");
    icon.dataset.lucide = iconName;
    element.replaceChildren(icon);
  });

  globalThis.lucide.createIcons({
    root,
    attrs: {
      "stroke-width": 2,
      "aria-hidden": "true",
      focusable: "false",
    },
  });
}
