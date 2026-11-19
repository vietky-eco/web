import { loadContent } from "../core/content-loader.js";
import {
  detailPath,
  indexDetailPaths,
  loadSlugIndex,
} from "../core/detail-routes.js";
import { renderArticle } from "../engine/article-renderer.js";

const CATEGORIES = {
  "/chuyen-su/su-kien": ["Sự kiện lịch sử", "CHUYỆN SỬ"],
  "/chuyen-su/nhan-vat": ["Nhân vật lịch sử", "CHUYỆN SỬ"],
  "/chuyen-su/cac-thoi-ky": ["Các thời kỳ", "CHUYỆN SỬ"],
  "/chuyen-su/dong-thoi-gian": ["Dòng thời gian", "CHUYỆN SỬ"],
  "/dau-xua/dia-danh": ["Địa danh lịch sử", "DẤU XƯA"],
  "/dau-xua/di-tich": ["Di tích & Kiến trúc", "DẤU XƯA"],
  "/dau-xua/hien-vat": ["Hiện vật lịch sử", "DẤU XƯA"],
  "/van-hoa/phong-tuc": ["Phong tục & Tập quán", "VĂN HÓA"],
  "/van-hoa/tin-nguong": ["Tín ngưỡng & Tôn giáo", "VĂN HÓA"],
  "/van-hoa/nghe-thuat": ["Nghệ thuật truyền thống", "VĂN HÓA"],
  "/van-hoa/le-hoi": ["Lễ hội & Đời sống", "VĂN HÓA"],
};
const LEGACY_PATHS = new Set([
  "/pages/detail.html",
  "/pages/detail",
  "/chi-tiet",
]);

class DetailRouteError extends Error {}

async function resolveRoute() {
  let path;
  try {
    path = decodeURI(window.location.pathname).replace(/\/+$/, "");
  } catch {
    throw new DetailRouteError("Đường dẫn bài viết không hợp lệ.");
  }

  if (LEGACY_PATHS.has(path)) {
    const id = new URLSearchParams(window.location.search).get("id");
    if (!id)
      throw new DetailRouteError(
        "Đường dẫn chưa có ID bài viết. Hãy chọn một bài viết trong chuyên mục.",
      );
    // URL cũ vẫn đọc được ngay cả khi danh mục slug tạm thời không tải được.
    const index = await loadSlugIndex().catch(() => ({}));
    return {
      id,
      index,
      path: Object.keys(index).find((key) => index[key] === id) ?? path,
    };
  }

  const index = await loadSlugIndex();
  if (!Object.hasOwn(index, path)) {
    throw new DetailRouteError(
      "Không có bài viết tương ứng với đường dẫn này.",
    );
  }
  return { id: index[path], index, path };
}

function updateCategory(path, id) {
  const fallback = {
    evt: "/chuyen-su/su-kien",
    per: "/chuyen-su/cac-thoi-ky",
    ppl: "/chuyen-su/nhan-vat",
    plc: "/dau-xua/dia-danh",
  };
  const categoryPath = path.slice(0, path.lastIndexOf("/"));
  const href = Object.hasOwn(CATEGORIES, categoryPath)
    ? categoryPath
    : (fallback[id.slice(0, 3)] ?? "/");
  const [label, eyebrow] = CATEGORIES[href] ?? ["Trang chủ", "VIỆT KÝ"];
  const category = document.getElementById("detail-category-link");
  category.href = href;
  category.textContent = label;
  document.getElementById("detail-back-link").href = href;
  document.getElementById("detail-eyebrow").textContent = eyebrow;
}

async function loadSources(entity, article) {
  const ids = [
    ...new Set([...(entity.sourceIds ?? []), ...(article?.sourceIds ?? [])]),
  ];
  return Promise.all(
    ids.map(async (id) => {
      try {
        return await loadContent(id);
      } catch {
        return { id, unavailable: true };
      }
    }),
  );
}

function showError(error) {
  const notFound =
    error instanceof DetailRouteError ||
    ["InvalidResourceIdError", "ResourceNotFoundError"].includes(error.name);
  const title = notFound ? "Không tìm thấy bài viết" : "Không thể tải bài viết";
  document.title = `${title} | Việt Ký`;
  document.getElementById("detail-error-title").textContent = title;
  document.getElementById("detail-error-message").textContent = error.message;
  document.getElementById("detail-error").hidden = false;
  document.getElementById("detail-article").hidden = true;
  document.getElementById("detail-back").hidden = true;
}

async function initDetail() {
  try {
    const { id, index, path } = await resolveRoute();
    const entity = await loadContent(id);
    const article = entity.articleId
      ? await loadContent(entity.articleId)
      : null;
    if (article && article.entityId !== entity.id) {
      throw new Error("Bài viết không khớp với tư liệu đang mở.");
    }
    const sources = await loadSources(entity, article);
    const pathsById = indexDetailPaths(index);
    const related = (entity.related ?? []).map((item) => ({
      label: item.label || item.targetId,
      href: detailPath(item.targetId, pathsById),
    }));
    renderArticle(document.getElementById("detail-article"), entity, article, {
      sources,
      related,
    });
    updateCategory(path, id);
    document.title = `${entity.title} | Việt Ký`;
    document.querySelector('meta[name="description"]').content =
      entity.summary || entity.title;
    document.getElementById("detail-breadcrumb-current").textContent =
      entity.title;
    document.getElementById("detail-article").hidden = false;
    document.getElementById("detail-back").hidden = false;
  } catch (error) {
    showError(error);
  } finally {
    document.getElementById("detail-loading").hidden = true;
  }
}

initDetail();
