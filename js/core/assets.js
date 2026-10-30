const asset = (path) => new URL(`../../assets/${path}`, import.meta.url).href;
const reference = asset("ui/timeline-reference.png");

// Ảnh cắt từ mockup vẫn là placeholder, thay tại đây khi có ảnh riêng.
export const ASSETS = Object.freeze({
  paperTexture: asset("ui/paper-texture.svg"),
  scrollBanner: asset("ui/scroll-banner.svg"),
  heroMountains: reference,
  heroForeground: reference,
  tranSeal: asset("icons/tran-seal-reference.png"),
  tranIntro: asset("ui/tran-pho-minh-concept.webp"),
  eventCourt: reference,
  eventDefense: reference,
  eventBachDang: reference,
  decoLeft: null,
  decoRight: null,
  decoBottom: null,
  icons: Object.freeze({
    all: asset("icons/lucide/layout-grid.svg"),
    court: asset("icons/lucide/crown.svg"),
    defense: asset("icons/lucide/swords.svg"),
    culture: asset("icons/lucide/landmark.svg"),
  }),
});
