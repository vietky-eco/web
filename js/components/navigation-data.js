// Danh mục dùng chung cho navbar và trang tổng quan.
const PROJECT_URL = new URL("../../", import.meta.url);

export const NAVIGATION_GROUPS = [
  {
    id: "dau-xua",
    href: "pages/heritage.html",
    image: "13_dau_xua.webp",
    title: "Dấu xưa",
    graphic: "heritage",
    bannerTagline: "Bước qua miền ký ức",
    description:
      "Theo dấu những vùng đất, công trình và chứng tích của Việt Nam qua thời gian.",
    items: [
      {
        id: "dia-danh",
        href: "pages/places.html",
        image: "01_dia_danh_lich_su.webp",
        title: "Địa danh lịch sử",
        graphic: "place",
        description: "Những vùng đất gắn liền với lịch sử",
      },
      {
        id: "di-tich",
        href: "pages/monuments.html",
        image: "02_di_tich_kien_truc.webp",
        title: "Di tích & Kiến trúc",
        graphic: "architecture",
        description: "Những công trình lưu dấu thời gian",
      },
      {
        id: "hien-vat",
        href: "pages/artifacts.html",
        image: "03_hien_vat_lich_su.webp",
        title: "Hiện vật lịch sử",
        graphic: "artifact",
        description: "Những chứng tích từ quá khứ",
      },
      {
        id: "ban-do",
        href: "pages/map.html",
        image: "04_ban_do_lich_su.webp",
        title: "Bản đồ lịch sử",
        graphic: "map",
        description: "Lịch sử qua không gian địa lý",
      },
    ],
  },
  {
    id: "van-hoa",
    href: "pages/culture.html",
    image: "14_van_hoa.webp",
    title: "Văn hóa",
    graphic: "culture",
    bannerTagline: "Nếp sống, hồn Việt",
    description: "Khám phá những nếp sống, niềm tin và sáng tạo làm nên bản sắc Việt.",
    items: [
      {
        id: "phong-tuc",
        href: "pages/customs.html",
        image: "05_phong_tuc_tap_quan.webp",
        title: "Phong tục & Tập quán",
        graphic: "custom",
        description: "Những nét đẹp trong đời sống người Việt",
      },
      {
        id: "tin-nguong",
        href: "pages/beliefs.html",
        image: "06_tin_nguong_ton_giao.webp",
        title: "Tín ngưỡng & Tôn giáo",
        graphic: "belief",
        description: "Đời sống tín ngưỡng qua các thời kỳ",
      },
      {
        id: "nghe-thuat",
        href: "pages/arts.html",
        image: "07_nghe_thuat_truyen_thong.webp",
        title: "Nghệ thuật truyền thống",
        graphic: "art",
        description: "Những hình thức nghệ thuật và sáng tạo",
      },
      {
        id: "le-hoi",
        href: "pages/festivals.html",
        image: "08_le_hoi_doi_song.webp",
        title: "Lễ hội & Đời sống",
        graphic: "festival",
        description: "Những sinh hoạt văn hóa cộng đồng",
      },
    ],
  },
  {
    id: "chuyen-su",
    href: "pages/history.html",
    image: "15_chuyen_su.webp",
    title: "Chuyện sử",
    graphic: "story",
    bannerTagline: "Chuyện kể ngàn năm",
    description:
      "Kết nối những thời kỳ, sự kiện và con người trong dòng chảy lịch sử Việt Nam.",
    items: [
      {
        id: "dong-thoi-gian",
        image: "09_dong_thoi_gian.webp",
        title: "Dòng thời gian",
        graphic: "timeline",
        description: "Lịch sử theo trình tự thời gian",
        href: "pages/timeline.html",
      },
      {
        id: "thoi-ky",
        href: "pages/periods.html",
        image: "10_cac_thoi_ky.webp",
        title: "Các thời kỳ",
        graphic: "period",
        description: "Những giai đoạn và triều đại",
      },
      {
        id: "su-kien",
        href: "pages/events.html",
        image: "11_su_kien_lich_su.webp",
        title: "Sự kiện lịch sử",
        graphic: "event",
        description: "Những biến cố và dấu mốc quan trọng",
      },
      {
        id: "nhan-vat",
        image: "12_nhan_vat_lich_su.webp",
        title: "Nhân vật lịch sử",
        graphic: "person",
        description: "Những con người để lại dấu ấn",
        href: "pages/people.html",
      },
    ],
  },
];

// Mỗi danh mục có trang HTML riêng trong pages.
export function categoryURL(group, item = null) {
  return new URL((item || group).href, PROJECT_URL).href;
}

// image là tên file trong assets/images/navigation/banners.
export function categoryImageURL(content) {
  return new URL(
    `../../assets/images/navigation/banners/${content.image}`,
    import.meta.url,
  ).href;
}
