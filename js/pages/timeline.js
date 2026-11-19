import { loadCatalog } from "../core/catalog-loader.js";
import { loadTimelineEvents, renderTimeline } from "../features/timeline.js";

function showState(container, state, message) {
  const node = document.createElement("li");
  node.className = "tl-empty";
  node.setAttribute("data-timeline-" + state, "");
  node.setAttribute("role", state === "error" ? "alert" : "status");
  node.textContent = message;
  container.dataset.timelineState = state;
  container.setAttribute("aria-busy", String(state === "loading"));
  container.replaceChildren(node);
}

/** Trang công khai chỉ dùng published; preview=1 dùng để kiểm thử draft cục bộ. */
export async function initTimeline() {
  const container = document.getElementById("timeline");
  if (!container) throw new Error('Trang Timeline thiếu vùng render "#timeline".');
  const url = new URL(window.location.href);
  const preview = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname) &&
    url.searchParams.get("preview") === "1";
  document.getElementById("timeline-preview-note").hidden = !preview;
  showState(container, "loading", "Đang tải sự kiện…");
  try {
    const catalog = await loadCatalog();
    const selected = catalog.filter(record =>
      record.type === "event" && (preview || record.status === "published")
    );
    const events = await loadTimelineEvents(selected.map(record => record.id));
    // Entity là nguồn quyết định; Catalog cũ không được làm lộ Event đã chuyển về draft.
    const visible = events.filter(event => preview || event.status === "published");
    renderTimeline(container, visible);
    if (!preview && !visible.length) {
      container.querySelector("[data-timeline-empty]").textContent = "Chưa có sự kiện được công bố.";
    }
    return visible;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Vui lòng thử lại.";
    showState(container, "error", "Không thể tải dòng thời gian. " + message);
    return null;
  }
}

if (typeof document !== "undefined") void initTimeline();
