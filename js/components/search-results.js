import { TYPES, normalize } from "../features/search-ui-adapter.js";

export function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function highlighted(text, query) {
  const fragment = document.createDocumentFragment();
  const ranges = [];
  const normalized = normalize(text);
  for (const word of normalize(query).split(/\s+/).filter(Boolean)) {
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

export function resultCard(item, query) {
  const row = element("li", `sr-result sr-result--${item.type}`);
  const link = element("a", "sr-result-link");
  link.href = item.href;
  if (!item.image) {
    const tones = ["clay", "sage", "sand", "stone", "ochre"];
    const tone =
      tones[
        [...item.id].reduce(
          (total, letter) => total + letter.charCodeAt(0),
          0,
        ) % tones.length
      ];
    const media = element(
      "span",
      "sr-result-media sr-result-placeholder sr-result-placeholder--" + tone,
    );
    media.setAttribute("aria-hidden", "true");
    media.append(element("span", "sr-placeholder-label", "Ảnh chờ bổ sung"));
    link.append(media);
  }
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
        media.replaceChildren(
          element("span", "sr-image-missing", "Ảnh chưa tải được"),
        );
      },
      { once: true },
    );
    media.append(image);
    if (item.imageIsAI)
      media.append(element("span", "sr-image-label", "Ảnh minh họa AI"));
    link.append(media);
  }
  const copy = element("span", "sr-result-copy");
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
  const title = element("span", "sr-result-title");
  title.append(highlighted(item.title, query));
  copy.append(title);
  if (item.summary)
    copy.append(element("span", "sr-result-summary", item.summary));
  if (item.periodTitle)
    copy.append(element("span", "sr-result-period", item.periodTitle));
  if (item.image && item.imageCredit)
    copy.append(element("span", "sr-image-credit", item.imageCredit));
  const arrow = element("span", "sr-result-arrow", "→");
  arrow.setAttribute("aria-hidden", "true");
  link.append(copy, arrow);
  row.append(link);
  return row;
}

export function showState(host, { title, text, action, label = "Thử lại" }) {
  host.replaceChildren();
  const box = element("div", "sr-state");
  box.append(element("h3", "", title), element("p", "", text));
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
