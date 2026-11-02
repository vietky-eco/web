const asset = (path) => new URL(`../../assets/${path}`, import.meta.url).href;
export const ASSETS = Object.freeze({
  paperTexture: asset("ui/paper-texture.svg"),
  scrollBanner: asset("timeline/scroll-frame-320.webp"),
  scrollBanner2x: asset("timeline/scroll-frame-640.webp"),
  scrollBanner3x: asset("timeline/scroll-frame-960.webp"),
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

// Ảnh AI theo bộ đã duyệt; các giai đoạn không có bộ phù hợp giữ trạng thái bổ sung.
const periodArt = (folder) => Object.freeze({
  desktop: asset(`timeline/${folder}/banner-desktop-1280.webp`),
  mobile: asset(`timeline/${folder}/banner-mobile-780.webp`),
  ornament: asset(`timeline/${folder}/ornament-256.webp`),
});
export const TIMELINE_ART = Object.freeze({
  "early": periodArt("02-hung-vuong"),
  "north": periodArt("03-bac-thuoc"),
  "ngo": periodArt("04-ngo-dinh-tien-le"),
  "ly": periodArt("05-ly"),
  "tran": periodArt("06-tran"),
  "ho": periodArt("07-ho"),
  "le": periodArt("08-le-so"),
  "north-south": periodArt("09-mac"),
  "trinh-nguyen": periodArt("10-le-trung-hung"),
  "tay-son": periodArt("11-tay-son"),
  "nguyen": periodArt("12-nguyen"),
  "modern": periodArt("13-hien-dai"),
});
