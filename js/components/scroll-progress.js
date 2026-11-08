function updateScrollProgress(fill, scroller) {
  const scrollableHeight = scroller.scrollHeight - scroller.clientHeight;
  const ratio = scrollableHeight > 0
    ? Math.min(1, Math.max(0, scroller.scrollTop / scrollableHeight))
    : 0;
  fill.style.transform = `scaleX(${ratio})`;
  return scrollableHeight > 0;
}

export function createScrollArea(content) {
  const area = document.createElement("div");
  area.className = "vk-scroll-area";
  const viewport = document.createElement("div");
  viewport.className = "vk-scroll-area-viewport";
  viewport.append(content);

  const progress = document.createElement("div");
  progress.className = "vk-scroll-progress";
  progress.setAttribute("aria-hidden", "true");
  progress.hidden = true;
  const fill = document.createElement("span");
  fill.className = "vk-scroll-progress-fill";
  progress.append(fill);
  area.append(viewport, progress);

  let frame = null;
  function scheduleUpdate() {
    if (frame !== null) return;
    frame = requestAnimationFrame(() => {
      frame = null;
      progress.hidden = !updateScrollProgress(fill, viewport);
    });
  }

  viewport.addEventListener("scroll", scheduleUpdate, { passive: true });
  // Nội dung có thể cao hơn hoặc ngắn đi dù khung cuộn giữ nguyên kích thước.
  const observer = new ResizeObserver(scheduleUpdate);
  observer.observe(viewport);
  observer.observe(content);

  return { element: area, viewport };
}

export function initScrollProgress(host) {
  const progress = host?.querySelector(".vk-scroll-progress-fill");
  if (!progress || progress.dataset.initialized) return;
  progress.dataset.initialized = "true";

  let frame = null;

  function updateProgress() {
    frame = null;
    const page = document.scrollingElement || document.documentElement;
    updateScrollProgress(progress, page);
  }

  // Gộp cập nhật trong một khung hình; tính lại khi nội dung đổi chiều cao.
  function scheduleUpdate() {
    if (frame === null) frame = requestAnimationFrame(updateProgress);
  }

  window.addEventListener("scroll", scheduleUpdate, { passive: true });
  window.addEventListener("resize", scheduleUpdate);
  window.addEventListener("pageshow", scheduleUpdate);

  const observer = new ResizeObserver(scheduleUpdate);
  observer.observe(document.documentElement);
  observer.observe(document.body);
  updateProgress();
}
