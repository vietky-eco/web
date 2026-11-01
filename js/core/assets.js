const asset = (path) => new URL(`../../assets/${path}`, import.meta.url).href;
export const ASSETS = Object.freeze({
  paperTexture: asset("ui/paper-texture.svg"),
  scrollBanner: asset("ui/scroll-banner.svg"),
  tranSeal: asset("icons/tran-seal-reference.png"),
  tranIntro: asset("ui/tran-pho-minh-concept.webp"),
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
