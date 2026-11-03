import { ASSETS } from "../core/assets.js";

export function ScrollBanner() {
  const frame = document.createElement("span");
  frame.className = "tl-scroll-banner";
  frame.setAttribute("aria-hidden", "true");
  frame.style.setProperty("--tl-scroll-frame", `image-set(url("${ASSETS.scrollBanner}") 1x, url("${ASSETS.scrollBanner2x}") 2x, url("${ASSETS.scrollBanner3x}") 3x)`);
  for (const side of ["left", "right"]) {
    const roller = document.createElement("span");
    roller.className = `tl-scroll-roller tl-scroll-roller--${side}`;
    frame.append(roller);
  }
  return frame;
}
