// Chuyển cảnh navbar bằng Web Animations API.
export function createHeaderMotion(header, { mobileQuery, reducedMotion }) {
  const backdrop = header.querySelector(".vk-nav-backdrop");

  // Khung nền dùng chung cho các dropdown desktop.
  const frame = document.createElement("div");
  frame.className = "vk-menu-frame";
  frame.hidden = true;
  frame.setAttribute("aria-hidden", "true");
  header.querySelector(".vk-header-inner").append(frame);
  header.classList.add("vk-motion-ready");

  const runs = new Map();
  const easeOut = "cubic-bezier(0.16, 1, 0.3, 1)";
  const easeIn = "cubic-bezier(0.4, 0, 1, 1)";

  let frameAnimation;
  let backdropAnimation;
  let backdropOpen = false;
  let frameOpen = false;

  // Vô hiệu hóa callback cũ trước khi chạy chuyển cảnh mới.
  function cancelRun(element) {
    const run = runs.get(element);
    if (!run) return;
    run.cancelled = true;
    run.animations.forEach((animation) => animation.cancel());
    runs.delete(element);
  }

  function beginRun(element) {
    cancelRun(element);
    const run = { cancelled: false, animations: new Set() };
    runs.set(element, run);
    return run;
  }

  // Cancel là trạng thái dự kiến; gỡ fill sau khi DOM đạt trạng thái cuối.
  function play(element, keyframes, timing, run, finish) {
    const animation = element.animate(keyframes, { fill: "both", ...timing });
    run.animations.add(animation);
    animation.finished
      .then(() => {
        if (run.cancelled) return;
        finish?.();
        animation.cancel();
        run.animations.delete(animation);
      })
      .catch(() => {});
    return animation;
  }

  function settlePanel(panel) {
    panel.classList.remove(
      "vk-is-leaving",
      "vk-is-transitioning",
      "vk-is-animating-height",
    );
  }

  function hideNow(panel) {
    cancelRun(panel);
    panel.hidden = true;
    panel.inert = false;
    panel.removeAttribute("aria-hidden");
    settlePanel(panel);
  }

  // Đọc trạng thái hiện tại trước khi hủy để đổi nhóm không bị giật.
  function setFrame(panel) {
    const visible = !frame.hidden;
    const current = visible ? getComputedStyle(frame) : null;
    const start = {
      opacity: visible ? current.opacity : 0,
      transform: visible
        ? current.transform
        : "translateX(-50%) translateY(-8px) scale(.975)",
      width: visible ? current.width : `${panel.offsetWidth}px`,
      height: visible ? current.height : `${panel.offsetHeight}px`,
    };
    frameAnimation?.cancel();
    frameOpen = true;
    frame.hidden = false;
    frame.style.width = `${panel.offsetWidth}px`;
    frame.style.height = `${panel.offsetHeight}px`;
    if (reducedMotion.matches) return;
    const animation = frame.animate(
      [
        start,
        {
          opacity: 1,
          transform: "translateX(-50%) translateY(0) scale(1)",
          width: frame.style.width,
          height: frame.style.height,
        },
      ],
      { duration: visible ? 300 : 420, easing: easeOut, fill: "both" },
    );
    frameAnimation = animation;
    animation.finished
      .then(() => {
        if (frameAnimation !== animation) return;
        animation.cancel();
        frameAnimation = null;
      })
      .catch(() => {});
  }

  function hideFrame(immediate = false) {
    if (frame.hidden) return;
    const current = getComputedStyle(frame);
    const start = { opacity: current.opacity, transform: current.transform };
    frameAnimation?.cancel();
    frameOpen = false;
    if (immediate || reducedMotion.matches) {
      frame.hidden = true;
      return;
    }
    const animation = frame.animate(
      [
        start,
        {
          opacity: 0,
          transform: "translateX(-50%) translateY(-5px) scale(.99)",
        },
      ],
      { duration: 180, easing: easeIn, fill: "both" },
    );
    frameAnimation = animation;
    animation.finished
      .then(() => {
        if (frameAnimation !== animation || frameOpen) return;
        frame.hidden = true;
        animation.cancel();
        frameAnimation = null;
      })
      .catch(() => {});
  }

  function setBackdrop(open, { immediate = false } = {}) {
    if (backdropOpen === open && !immediate) return;
    backdropOpen = open;
    backdrop.classList.toggle("vk-is-leaving", !open);
    const current = backdrop.hidden ? null : getComputedStyle(backdrop);
    const from = {
      opacity: current?.opacity || 0,
    };
    backdropAnimation?.cancel();
    if (immediate || reducedMotion.matches) {
      backdrop.hidden = !open;
      return;
    }
    backdrop.hidden = false;
    const animation = backdrop.animate(
      [
        from,
        {
          opacity: open ? 1 : 0,
        },
      ],
      {
        duration: open ? 360 : 220,
        easing: open ? easeOut : "ease-out",
        fill: "both",
      },
    );
    backdropAnimation = animation;
    animation.finished
      .then(() => {
        if (backdropAnimation !== animation) return;
        backdrop.hidden = !backdropOpen;
        animation.cancel();
        backdropAnimation = null;
      })
      .catch(() => {});
  }

  // Khóa tương tác ngay; chỉ ẩn panel sau khi chuyển cảnh kết thúc.
  function hideCategory(
    panel,
    { immediate = false, keepFrame = false, direction = 0 } = {},
  ) {
    if (!panel || panel.hidden) {
      if (!keepFrame) hideFrame(immediate);
      return;
    }
    const style = getComputedStyle(panel);
    const startOpacity = style.opacity;
    const startHeight = style.height;
    const run = beginRun(panel);
    panel.inert = true;
    panel.setAttribute("aria-hidden", "true");
    panel.classList.add("vk-is-leaving");
    if (!keepFrame) hideFrame(immediate);
    if (immediate || reducedMotion.matches) {
      hideNow(panel);
      return;
    }
    if (mobileQuery.matches) {
      panel.classList.add("vk-is-animating-height");
      play(
        panel,
        [
          { height: startHeight, opacity: startOpacity },
          { height: "0px", opacity: 0 },
        ],
        { duration: 220, easing: easeOut },
        run,
        () => hideNow(panel),
      );
      return;
    }
    play(
      panel,
      [{ opacity: startOpacity }, { opacity: 0 }],
      { duration: keepFrame ? 150 : 160, easing: "ease-out" },
      run,
      () => hideNow(panel),
    );
    const body = panel.querySelector(".vk-dropdown-body");
    play(
      body,
      [
        { transform: getComputedStyle(body).transform },
        {
          transform: direction ? `translateX(${-direction * 8}px)` : "translateY(-4px)",
        },
      ],
      { duration: 160, easing: easeIn },
      run,
    );
  }

  // Mobile dùng accordion; desktop dùng khung nền chung.
  function showCategory(panel, { previousPanel = null, direction = 0 } = {}) {
    const wasVisible = !panel.hidden;
    const body = panel.querySelector(".vk-dropdown-body");
    const bodyTransform = wasVisible ? getComputedStyle(body).transform : null;
    const startOpacity = wasVisible ? getComputedStyle(panel).opacity : 0;
    const startHeight = wasVisible ? getComputedStyle(panel).height : "0px";
    [...runs.keys()].forEach((other) => {
      if (
        other !== panel &&
        other !== previousPanel &&
        other.matches(".vk-dropdown.vk-is-leaving")
      )
        hideNow(other);
    });
    const run = beginRun(panel);
    settlePanel(panel);
    panel.hidden = false;
    panel.inert = false;
    panel.removeAttribute("aria-hidden");
    if (previousPanel && previousPanel !== panel) {
      hideCategory(previousPanel, {
        keepFrame: !mobileQuery.matches,
        direction,
      });
    }
    if (mobileQuery.matches) {
      hideFrame(true);
      if (reducedMotion.matches) return;
      const height = `${panel.offsetHeight}px`;
      panel.classList.add("vk-is-animating-height");
      play(
        panel,
        [
          { height: startHeight, opacity: startOpacity },
          { height, opacity: 1 },
        ],
        { duration: 300, easing: easeOut },
        run,
        () => panel.classList.remove("vk-is-animating-height"),
      );
      return;
    }
    setFrame(panel);
    if (reducedMotion.matches) return;
    panel.classList.add("vk-is-transitioning");
    play(
      panel,
      [{ opacity: startOpacity }, { opacity: 1 }],
      { duration: 260, delay: wasVisible ? 0 : 35, easing: easeOut },
      run,
      () => panel.classList.remove("vk-is-transitioning"),
    );
    play(
      body,
      [
        {
          transform:
            bodyTransform ||
            (previousPanel ? `translateX(${direction * 10}px)` : "translateY(6px)"),
        },
        { transform: "translate(0, 0)" },
      ],
      { duration: 360, easing: easeOut },
      run,
    );

    if (wasVisible) return;
    const content = panel.querySelectorAll(".vk-category");
    content.forEach((element, index) => {
      play(
        element,
        [
          { opacity: 0, transform: "translateY(8px)" },
          { opacity: 1, transform: "translateY(0)" },
        ],
        { duration: 360, delay: 45 + Math.min(index, 5) * 28, easing: easeOut },
        run,
      );
    });
  }

  function reset() {
    [...runs.keys()].forEach(hideNow);
    header.querySelectorAll(".vk-dropdown").forEach(hideNow);
    hideFrame(true);
    setBackdrop(false, { immediate: true });
  }

  // Dừng chuyển động khi cài đặt hệ thống thay đổi.
  reducedMotion.addEventListener("change", () => {
    if (!reducedMotion.matches) return;
    runs.forEach((run, panel) => {
      const leaving = panel.classList.contains("vk-is-leaving");
      cancelRun(panel);
      settlePanel(panel);
      if (leaving) hideNow(panel);
    });
    frameAnimation?.cancel();
    frame.hidden = !frameOpen;
    backdropAnimation?.cancel();
    backdrop.hidden = !backdropOpen;
  });

  // Đồng bộ khung nền khi CSS hoặc kích thước panel thay đổi.
  const panelResizeObserver = new ResizeObserver((entries) => {
    if (mobileQuery.matches || !frameOpen) return;
    const panel = entries.find(
      ({ target }) => !target.hidden && !target.classList.contains("vk-is-leaving"),
    )?.target;
    if (!panel) return;
    const width = `${panel.offsetWidth}px`;
    const height = `${panel.offsetHeight}px`;
    if (frame.style.width === width && frame.style.height === height) return;
    frameAnimation?.cancel();
    frameAnimation = null;
    frame.style.width = width;
    frame.style.height = height;
  });
  header
    .querySelectorAll(".vk-dropdown")
    .forEach((panel) => panelResizeObserver.observe(panel));

  return {
    showCategory,
    hideCategory,
    setBackdrop,
    reset,
  };
}
