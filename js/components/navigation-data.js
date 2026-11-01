// Ba nhóm dropdown chỉ chứa liên kết đến các mục phụ.
const PROJECT_URL = new URL("../../", import.meta.url);

export const NAVIGATION_GROUPS = [
  {
    id: "dau-xua",
    title: "Dấu xưa",
    graphic: "heritage",
    description:
      "Theo dấu những vùng đất, công trình và chứng tích của Việt Nam qua thời gian.",
    items: [
      {
        id: "dia-danh",
        href: "pages/dau-xua/places.html",
        title: "Địa danh lịch sử",
        graphic: "place",
        description: "Những vùng đất gắn liền với lịch sử",
      },
      {
        id: "di-tich",
        href: "pages/dau-xua/monuments.html",
        title: "Di tích & Kiến trúc",
        graphic: "architecture",
        description: "Những công trình lưu dấu thời gian",
      },
      {
        id: "hien-vat",
        href: "pages/dau-xua/artifacts.html",
        title: "Hiện vật lịch sử",
        graphic: "artifact",
        description: "Những chứng tích từ quá khứ",
      },
      {
        id: "ban-do",
        href: "pages/dau-xua/map.html",
        title: "Bản đồ lịch sử",
        graphic: "map",
        description: "Lịch sử qua không gian địa lý",
      },
    ],
  },
  {
    id: "van-hoa",
    title: "Văn hóa",
    graphic: "culture",
    description: "Khám phá những nếp sống, niềm tin và sáng tạo làm nên bản sắc Việt.",
    items: [
      {
        id: "phong-tuc",
        href: "pages/van-hoa/customs.html",
        title: "Phong tục & Tập quán",
        graphic: "custom",
        description: "Những nét đẹp trong đời sống người Việt",
      },
      {
        id: "tin-nguong",
        href: "pages/van-hoa/beliefs.html",
        title: "Tín ngưỡng & Tôn giáo",
        graphic: "belief",
        description: "Đời sống tín ngưỡng qua các thời kỳ",
      },
      {
        id: "nghe-thuat",
        href: "pages/van-hoa/arts.html",
        title: "Nghệ thuật truyền thống",
        graphic: "art",
        description: "Những hình thức nghệ thuật và sáng tạo",
      },
      {
        id: "le-hoi",
        href: "pages/van-hoa/festivals.html",
        title: "Lễ hội & Đời sống",
        graphic: "festival",
        description: "Những sinh hoạt văn hóa cộng đồng",
      },
    ],
  },
  {
    id: "chuyen-su",
    title: "Chuyện sử",
    graphic: "story",
    description:
      "Kết nối những thời kỳ, sự kiện và con người trong dòng chảy lịch sử Việt Nam.",
    items: [
      {
        id: "dong-thoi-gian",
        title: "Dòng thời gian",
        graphic: "timeline",
        description: "Lịch sử theo trình tự thời gian",
        href: "pages/chuyen-su/timeline.html",
      },
      {
        id: "thoi-ky",
        href: "pages/chuyen-su/periods.html",
        title: "Các thời kỳ",
        graphic: "period",
        description: "Những giai đoạn và triều đại",
      },
      {
        id: "su-kien",
        href: "pages/chuyen-su/events.html",
        title: "Sự kiện lịch sử",
        graphic: "event",
        description: "Những biến cố và dấu mốc quan trọng",
      },
      {
        id: "nhan-vat",
        title: "Nhân vật lịch sử",
        graphic: "person",
        description: "Những con người để lại dấu ấn",
        href: "pages/chuyen-su/people.html",
      },
    ],
  },
];

// Mỗi danh mục có trang HTML riêng trong pages.
export function categoryURL(item) {
  return new URL(item.href, PROJECT_URL).href;
}
