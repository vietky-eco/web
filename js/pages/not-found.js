import "../../assets/vendor/lucide/lucide.min.js";

const root = document.querySelector(".vk-not-found-main");

if (root) {
  globalThis.lucide.createIcons({
    root,
    attrs: {
      width: 18,
      height: 18,
      "stroke-width": 1.75,
      "aria-hidden": "true",
      focusable: "false",
    },
  });
}

