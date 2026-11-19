import { loadContent } from "../core/content-loader.js";

function isEventId(id) {
  return typeof id === "string" && id.length === 7 && /^evt[0-9]{4}$/.test(id);
}

/** Sắp trên bản sao; giữ nguyên time.label và các trường của Event. */
export function sortEvents(events) {
  if (!Array.isArray(events)) {
    throw new TypeError("Danh sách sự kiện phải là mảng.");
  }

  for (const event of events) {
    if (!isEventId(event?.id) || event.type !== "event") {
      throw new TypeError("Timeline chỉ nhận sự kiện có type event và ID dạng evt0001.");
    }
    if (!Number.isInteger(event.time?.sortYear)) {
      throw new TypeError(`Sự kiện "${event.id}" phải có time.sortYear là số nguyên.`);
    }
    const order = event.time.order;
    if (order !== undefined && (!Number.isInteger(order) || order < 0)) {
      throw new TypeError(`Sự kiện "${event.id}" phải có time.order là số nguyên không âm.`);
    }
  }

  return [...events].sort((a, b) =>
    a.time.sortYear - b.time.sortYear ||
    (a.time.order ?? 0) - (b.time.order ?? 0) ||
    a.id.localeCompare(b.id)
  );
}

/** Tải các Event được chọn; bên gọi quyết định danh sách ID và trạng thái công bố. */
export async function loadTimelineEvents(eventIds) {
  if (!Array.isArray(eventIds)) {
    throw new TypeError("Danh sách ID sự kiện phải là mảng.");
  }
  for (const id of eventIds) {
    if (!isEventId(id)) {
      throw new TypeError("ID sự kiện không hợp lệ. Dùng dạng evt0001, không có dấu gạch nối.");
    }
  }
  if (new Set(eventIds).size !== eventIds.length) {
    throw new TypeError("Danh sách ID sự kiện không được trùng lặp.");
  }

  const events = await Promise.all(eventIds.map(id => loadContent(id)));
  return sortEvents(events);
}

function timelineContainer(container) {
  if (container?.nodeType !== 1 || !container.ownerDocument || typeof container.replaceChildren !== "function") {
    throw new TypeError("Vùng render Timeline phải là một Element.");
  }
  return container.ownerDocument;
}

function timelineNode(document, tag, className, text) {
  const node = document.createElement(tag);
  node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function timelineState(container, state, message) {
  const document = timelineContainer(container);
  const node = timelineNode(document, container.matches("ol, ul") ? "li" : "p", "tl-empty", message);
  node.setAttribute("data-timeline-" + state, "");
  node.setAttribute("role", state === "error" ? "alert" : "status");
  container.hidden = false;
  container.dataset.timelineState = state;
  container.setAttribute("aria-busy", String(state === "loading"));
  container.replaceChildren(node);
}

/** Render các Event do bên gọi lựa chọn; không fetch hoặc tự công bố dữ liệu draft. */
export function renderTimeline(container, events) {
  const document = timelineContainer(container);
  const sorted = sortEvents(events);
  if (!sorted.length) {
    timelineState(container, "empty", "Chưa có sự kiện để hiển thị.");
    return;
  }

  const fragment = document.createDocumentFragment();
  const list = container.matches("ol, ul") ? fragment : timelineNode(document, "ol", "tl-list");
  for (const [index, event] of sorted.entries()) {
    if (typeof event.title !== "string" || !event.title.trim() ||
        typeof event.time.label !== "string" || !event.time.label.trim()) {
      throw new TypeError('Sự kiện "' + event.id + '" phải có title và time.label để hiển thị.');
    }
    if (event.summary !== undefined && typeof event.summary !== "string") {
      throw new TypeError('Summary của sự kiện "' + event.id + '" phải là chuỗi.');
    }

    const item = timelineNode(document, "li", index % 2 === 0 ? "tl-item tl-item--left" : "tl-item");
    item.dataset.timelineItem = "";
    item.dataset.eventId = event.id;
    item.dataset.year = String(event.time.sortYear);
    const marker = timelineNode(document, "span", "tl-node");
    marker.setAttribute("aria-hidden", "true");
    const card = timelineNode(document, "details", "tl-card");
    const summary = document.createElement("summary");
    const copy = timelineNode(document, "span", "tl-card-copy");
    copy.append(
      timelineNode(document, "time", "", event.time.label),
      timelineNode(document, "span", "tl-card-title", event.title)
    );
    if (event.summary?.trim()) {
      copy.append(timelineNode(document, "span", "tl-card-description", event.summary));
    }
    summary.append(copy);
    const body = timelineNode(document, "div", "tl-card-body");
    const link = timelineNode(document, "a", "tl-card-link", "Xem chi tiết: " + event.title);
    const target = new URL("../../chi-tiet", import.meta.url);
    target.searchParams.set("id", event.id);
    link.href = target.href;
    body.append(link);
    card.append(summary, body);
    item.append(marker, card);
    list.append(item);
  }
  if (list !== fragment) fragment.append(list);
  container.hidden = false;
  container.dataset.timelineState = "ready";
  container.setAttribute("aria-busy", "false");
  container.replaceChildren(fragment);
}

/** Loading → ready/empty/error. Trả Event[] khi thành công; null khi lỗi đã được hiển thị. */
export async function loadAndRenderTimeline(container, eventIds) {
  timelineState(container, "loading", "Đang tải sự kiện…");
  try {
    const events = await loadTimelineEvents(eventIds);
    renderTimeline(container, events);
    return events;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Vui lòng thử lại.";
    timelineState(container, "error", "Không thể tải dòng thời gian. " + message);
    return null;
  }
}
