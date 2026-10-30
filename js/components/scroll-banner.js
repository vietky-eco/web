import { ASSETS } from "../core/assets.js";

export function ScrollBanner() {
  const image = document.createElement("img");
  image.className = "tl-scroll-banner";
  image.src = ASSETS.scrollBanner;
  image.alt = "";
  image.width = 240;
  image.height = 144;
  image.setAttribute("aria-hidden", "true");
  return image;
}
