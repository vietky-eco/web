// Icon Lucide dùng bản cố định trong assets/vendor/lucide.
import "../../assets/vendor/lucide/lucide.min.js";

const LUCIDE_GRAPHICS = {
  place: "map-pin",
  architecture: "landmark",
  artifact: "drum",
  map: "map",
  custom: "hand-heart",
  belief: "flame",
  art: "drama",
  festival: "flag-triangle-right",
  timeline: "list-ordered",
  period: "layers",
  event: "calendar-days",
  person: "contact-round",
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
      "stroke-width": 1.75,
      "aria-hidden": "true",
      focusable: "false",
    },
  });
}
