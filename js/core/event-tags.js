import { ASSETS } from "./assets.js";

// Bộ lọc và chip lấy cùng nhãn từ đây; data-type giữ khóa của tag.
export const EVENT_TAGS = Object.freeze({
  all: Object.freeze({ label: "Tất cả", icon: ASSETS.icons.all }),
  court: Object.freeze({ label: "Triều chính", icon: ASSETS.icons.court }),
  defense: Object.freeze({ label: "Giữ nước", icon: ASSETS.icons.defense }),
  culture: Object.freeze({ label: "Văn hóa", icon: ASSETS.icons.culture }),
});
