export function initScrollProgress(host) {
  const progress = host?.querySelector(".vk-scroll-progress-fill");
  if (!progress || progress.dataset.initialized) return;
  progress.dataset.initialized = "true";

  let frame = null;

  function updateProgress() {
    frame = null;
    const page = document.scrollingElement || document.documentElement;
    const scrollableHeight = page.scrollHeight - page.clientHeight;
    const ratio = scrollableHeight > 0
      ? Math.min(1, Math.max(0, page.scrollTop / scrollableHeight))
      : 0;
    progress.style.transform = `scaleX(${ratio})`;
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
