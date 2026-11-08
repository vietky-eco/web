import { TYPES } from "../features/search-ui-adapter.js";
import { normalize, normalizeSearchText } from "../features/search.js";
import "../../assets/vendor/lucide/lucide.min.js";

const RESULT_ICONS = { event: "CalendarDays", person: "UserRound", place: "MapPin" };

// Icon và phần tử văn bản dùng chung cho navbar và popup.
export function searchIcon(name, className = "sr-icon") {
  const lucide = globalThis.lucide;
  return lucide.createElement(lucide[name], {
    class: className,
    "stroke-width": 1.75,
    "aria-hidden": "true",
    focusable: "false",
  });
}

export function resultTypeIcon(type) {
  return searchIcon(RESULT_ICONS[type] ?? "ScrollText");
}

export function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

// Dòng gợi ý trên navbar có thể trỏ đến bài viết hoặc danh mục.
export function suggestionRow(title, subtitle, href, icon) {
  const row = element("li", "vk-search-suggestion");
  const link = element("a");
  link.href = href;
  const symbol = element("span", "vk-search-suggestion-icon");
  const copy = element("span", "vk-search-suggestion-copy");
  symbol.append(icon);
  copy.append(element("span", "vk-search-suggestion-title", title), element("small", "", subtitle));
  link.append(symbol, copy, searchIcon("ChevronRight", "vk-search-suggestion-arrow"));
  row.append(link);
  return row;
}

// Tìm vị trí từ khóa trên bản bỏ dấu, rồi tô sáng chữ gốc bằng thẻ <mark>.
function highlighted(text, query) {
  const fragment = document.createDocumentFragment();
  const ranges = [];
  const normalized = normalize(text);
  for (const word of normalizeSearchText(query).split(" ").filter(Boolean)) {
    let from = 0,
      index;
    while ((index = normalized.indexOf(word, from)) >= 0) {
      ranges.push([index, index + word.length]);
      from = index + word.length;
    }
  }
  ranges.sort((a, b) => a[0] - b[0]);
  let cursor = 0;
  for (const [start, end] of ranges) {
    if (start < cursor) continue;
    fragment.append(
      document.createTextNode(text.slice(cursor, start)),
      element("mark", "", text.slice(start, end)),
    );
    cursor = end;
  }
  fragment.append(document.createTextNode(text.slice(cursor)));
  return fragment;
}

// Dòng kết quả trong popup có ảnh hoặc biểu tượng loại nội dung.
export function resultCard(item, query) {
  const row = element("li", `sr-result sr-result--${item.type}`);
  const link = element("a", "sr-result-link");
  link.href = item.href;
  const typeIcon = resultTypeIcon(item.type);

  if (item.image) {
    const media = element("span", "sr-result-media");
    const image = element("img");
    image.src = item.image;
    image.alt = item.imageAlt;
    image.width = 180;
    image.height = 110;
    image.loading = "lazy";
    image.addEventListener(
      "error",
      () => {
        media.className = "sr-result-symbol";
        media.replaceChildren(typeIcon);
      },
      { once: true },
    );
    media.append(image);
    if (item.imageIsAI)
      media.append(element("span", "sr-image-label", "Ảnh minh họa AI"));
    link.append(media);
  } else {
    const symbol = element("span", "sr-result-symbol");
    symbol.append(typeIcon);
    link.append(symbol);
  }

  const copy = element("span", "sr-result-copy");
  const title = element("span", "sr-result-title");
  title.append(highlighted(item.title, query));
  copy.append(title);
  const meta = element("span", "sr-result-meta");
  meta.append(
    element(
      "span",
      "sr-result-kind",
      [
        TYPES[item.type],
        item.time?.label || (item.year !== null ? String(item.year) : ""),
      ]
        .filter(Boolean)
        .join(" · "),
    ),
  );
  const status =
    item.status === "draft"
      ? "Bản nháp"
      : item.status === "review"
        ? "Chờ duyệt"
        : "";
  if (status) meta.append(element("span", "sr-result-status", status));
  copy.append(meta);
  if (item.summary)
    copy.append(element("span", "sr-result-summary", item.summary));
  if (item.periodTitle)
    copy.append(element("span", "sr-result-period", item.periodTitle));
  if (item.image && item.imageCredit)
    copy.append(element("span", "sr-image-credit", item.imageCredit));
  const arrow = searchIcon("ChevronRight", "sr-result-arrow");
  link.append(copy, arrow);
  row.append(link);
  return row;
}

// Trạng thái chờ tải, trống hoặc lỗi thay thế nội dung trong vùng kết quả.
export function showState(host, { title, text, action, label = "Thử lại", icon = "SearchX" }) {
  host.replaceChildren();
  const box = element("div", "sr-state");
  box.append(searchIcon(icon, "sr-state-icon"), element("h3", "", title), element("p", "", text));
  if (action) {
    const button = element("button", "sr-button", label);
    button.type = "button";
    button.addEventListener("click", action);
    box.append(button);
  }
  host.append(box);
}

export function showLoading(host) {
  host.replaceChildren();
  host.setAttribute("aria-busy", "true");
  const text = element("p", "sr-loading-text", "Đang tìm kiếm…");
  text.setAttribute("role", "status");
  host.append(text);
  const skeleton = element("div", "sr-skeleton");
  skeleton.setAttribute("aria-hidden", "true");
  for (let i = 0; i < 3; i++) {
    const row = element("div", "sr-skeleton-row");
    row.append(element("span"), element("span"), element("span"));
    skeleton.append(row);
  }
  host.append(skeleton);
}
