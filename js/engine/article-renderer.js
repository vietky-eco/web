function element(document, tag, text, id) {
  const node = document.createElement(tag);
  if (text) node.textContent = text;
  if (id) node.id = id;
  return node;
}

function paragraphs(container, text) {
  container.replaceChildren();
  if (typeof text !== "string") return;
  for (const paragraph of text
    .split(/\n\s*\n/)
    .filter((value) => value.trim())) {
    container.append(element(container.ownerDocument, "p", paragraph));
  }
}

function safeLink(document, label, href) {
  if (typeof href !== "string" || !href.trim())
    return element(document, "span", label);
  try {
    const url = new URL(href, document.baseURI);
    if (!["http:", "https:"].includes(url.protocol))
      return element(document, "span", label);
    const link = element(document, "a", label);
    link.href = url.href;
    return link;
  } catch {
    return element(document, "span", label);
  }
}

// Hỗ trợ cả khung detail.html và container trống trong playground.
function ensureMarkup(container) {
  if (container.querySelector("#detail-title")) return;
  const doc = container.ownerDocument;
  const header = element(doc, "header");
  header.append(
    element(doc, "h1", "", "detail-title"),
    element(doc, "p", "", "detail-meta"),
    element(doc, "p", "", "detail-summary"),
  );
  container.replaceChildren(header);
  for (const [id, title, childId, tag] of [
    ["detail-context-section", "Bối cảnh lịch sử", "detail-context", "div"],
    ["detail-sources", "Nguồn tư liệu", "detail-source-list", "ol"],
    ["detail-related", "Tìm hiểu thêm", "detail-related-list", "ul"],
  ]) {
    const section = element(doc, "section", "", id);
    section.append(element(doc, "h2", title), element(doc, tag, "", childId));
    container.append(section);
  }
  container
    .querySelector("#detail-sources")
    .before(element(doc, "div", "", "detail-content"));
}

function renderImageFigure(figure, media) {
  if (!figure) return;
  figure.hidden = true;
  if (!/^assets\/img\/img[0-9]{4}\.(webp|png|jpe?g|svg)$/.test(media?.path) ||
      ![media.alt, media.caption, media.credit, media.license].every(value =>
        typeof value === "string" && value.trim(),
      )) return;

  const doc = figure.ownerDocument;
  const image = figure.querySelector("img");
  const caption = figure.querySelector("figcaption");
  image.alt = media.alt;
  if ([media.width, media.height].every(size => Number.isInteger(size) && size > 0)) {
    image.width = media.width;
    image.height = media.height;
  }
  image.onerror = () => { figure.hidden = true; };
  caption.textContent = `${media.caption} `;
  if (media.licenseUrl) {
    caption.append(
      safeLink(doc, `Ảnh: ${media.credit}`, media.sourceUrl),
      doc.createTextNode(" · "),
      safeLink(doc, media.license, media.licenseUrl),
    );
  } else {
    caption.append(safeLink(doc, `Ảnh: ${media.credit} · ${media.license}`, media.sourceUrl));
  }
  caption.hidden = false;
  figure.hidden = false;
  image.src = `/${media.path}`;
}

function insertInlineImage(container, media, afterParagraph) {
  if (!media) return;
  const doc = container.ownerDocument;
  const figure = element(doc, "figure");
  figure.className = "vk-detail-inline-image";
  if (media.height > media.width) figure.classList.add("vk-detail-inline-image--portrait");
  const image = element(doc, "img");
  image.loading = "lazy";
  image.decoding = "async";
  figure.append(image, element(doc, "figcaption"));
  renderImageFigure(figure, media);
  const paragraph = container.querySelectorAll("p")[afterParagraph - 1];
  if (paragraph) paragraph.after(figure);
  else container.append(figure);
}

/** Chỉ dựng DOM từ dữ liệu; không đọc URL, tra ID hoặc gọi mạng. */
export function renderArticle(
  container,
  entity,
  article = null,
  { sources = [], related = [], people = [], cover = null, sectionImages = new Map() } = {},
) {
  if (typeof entity?.title !== "string" || !entity.title.trim()) {
    throw new Error("Tư liệu chưa có tiêu đề hợp lệ.");
  }
  ensureMarkup(container);
  const doc = container.ownerDocument;
  const get = (id) => container.querySelector(`#${id}`);
  get("detail-title").textContent = entity.title;
  get("detail-summary").textContent = entity.summary ?? "";
  get("detail-summary").hidden = !entity.summary;
  const date = entity.time?.label ?? entity.date;
  get("detail-meta").textContent = typeof date === "string" ? date : "";
  get("detail-meta").hidden = !get("detail-meta").textContent;
  renderImageFigure(get("detail-cover"), cover);

  const content = article ?? entity;
  paragraphs(get("detail-context"), content.context);
  insertInlineImage(get("detail-context"), sectionImages.get(content.contextImageId), content.contextImageAfterParagraph);
  get("detail-context-section").hidden = !get("detail-context").hasChildNodes();
  const body = get("detail-content");
  body.replaceChildren();
  for (const section of content.sections ?? []) {
    const node = element(doc, "section");
    // `content` tương thích fixture cũ; schema hiện tại dùng `body`.
    paragraphs(node, section.body ?? section.content);
    if (section.heading) node.prepend(element(doc, "h2", section.heading));
    if (section.id) node.id = section.id;
    insertInlineImage(node, sectionImages.get(section.imageId), section.imageAfterParagraph);
    body.append(node);
  }
  if (!body.hasChildNodes() && !content.context) {
    const notice = element(doc, "p", "Nội dung chi tiết đang được biên soạn.");
    notice.className = "vk-detail-empty";
    body.append(notice);
  }

  const sourceList = get("detail-source-list");
  sourceList.replaceChildren();
  const references = [...(content.references ?? []), ...sources];
  for (const source of references) {
    const item = element(doc, "li");
    if (source.unavailable) {
      item.textContent = `Nguồn ${source.id} hiện chưa tải được.`;
    } else {
      item.append(
        safeLink(doc, source.citation || source.title || source.id, source.url),
      );
      if (source.locator) item.append(element(doc, "p", source.locator));
    }
    sourceList.append(item);
  }
  get("detail-sources").hidden = references.length === 0;

  let peopleSection = get("detail-people");
  if (!peopleSection && people.length) {
    peopleSection = element(doc, "nav", "", "detail-people");
    peopleSection.className = "vk-detail-related";
    peopleSection.setAttribute("aria-labelledby", "detail-people-title");
    peopleSection.append(
      element(doc, "h2", "Nhân vật liên quan", "detail-people-title"),
      element(doc, "ul", "", "detail-people-list"),
    );
    get("detail-related").before(peopleSection);
  }
  if (peopleSection) {
    const peopleList = get("detail-people-list");
    peopleList.replaceChildren();
    for (const person of people) {
      const item = element(doc, "li");
      item.append(safeLink(doc, person.label, person.href));
      peopleList.append(item);
    }
    peopleSection.hidden = people.length === 0;
  }

  const relatedList = get("detail-related-list");
  relatedList.replaceChildren();
  for (const item of related) {
    const li = element(doc, "li");
    li.append(safeLink(doc, item.label, item.href));
    relatedList.append(li);
  }
  get("detail-related").hidden = related.length === 0;
}
