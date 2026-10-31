// Điều khiển dropdown và menu trên điện thoại.
import { renderHeaderGraphics } from "./header-graphics.js?v=2";
import { createHeaderMotion } from "./header-motion.js?v=2";
import { initHeaderBanners } from "./header-banners.js?v=2";

// Chỉ khởi tạo sau khi fragment được chèn vào DOM.
export function initHeader(header) {
  if (!header || header.dataset.initialized) return;
  renderHeaderGraphics(header);
  const banners = initHeaderBanners(header);
  header.dataset.initialized = "true";

  const menuButton = header.querySelector("#vk-menu-toggle");
  const menuPanel = header.querySelector("#vk-menu-panel");

  // Breakpoint phải khớp header.css.
  const mobileQuery = window.matchMedia("(max-width: 1100px)");
  const hoverQuery = window.matchMedia("(any-hover: hover) and (any-pointer: fine)");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const navigation = header.querySelector(".vk-main-nav");
  const backdrop = header.querySelector(".vk-nav-backdrop");
  const categoryButtons = [...header.querySelectorAll(".vk-nav-trigger")];
  const motion = createHeaderMotion(header, {
    mobileQuery,
    reducedMotion,
  });

  let activePanel = null;
  let activeTrigger = null;
  let activeCategory = null;
  let hoveredCategory = null;
  // Click đầu tiên giữ menu vừa mở do hover.
  let categoryOpenedByHover = false;
  let hoverOpenTimer;
  let hoverCloseTimer;

  let backgroundState = [];

  function updateNavigationState() {
    const target = hoveredCategory || activeCategory;
    categoryButtons.forEach((button) => {
      button.classList.toggle(
        "vk-is-highlighted",
        button === target && !mobileQuery.matches,
      );
    });
    const isOpen = !mobileQuery.matches && Boolean(activeCategory);
    header.classList.toggle("vk-has-open-menu", isOpen);
    motion.setBackdrop(isOpen);
    if (isOpen) {
      header.style.setProperty(
        "--vk-backdrop-top",
        `${header.getBoundingClientRect().bottom}px`,
      );
    }
  }

  function clearHoverTimers() {
    clearTimeout(hoverOpenTimer);
    clearTimeout(hoverCloseTimer);
  }

  function closeCategory({ immediate = false } = {}) {
    clearHoverTimers();
    if (activeCategory) {
      const panel = header.querySelector(
        `#${activeCategory.getAttribute("aria-controls")}`,
      );
      motion.hideCategory(panel, { immediate });
      activeCategory.setAttribute("aria-expanded", "false");
    }
    activeCategory = null;
    categoryOpenedByHover = false;
    hoveredCategory = null;
    updateNavigationState();
  }

  function closePanel(restoreFocus = false, immediate = false) {
    const previousTrigger = activeTrigger;
    closeCategory({ immediate });
    menuPanel.classList.remove("vk-mobile-open");
    menuPanel.removeAttribute("role");
    menuPanel.removeAttribute("aria-modal");
    menuPanel.removeAttribute("aria-labelledby");
    menuButton.setAttribute("aria-expanded", "false");
    backgroundState.forEach(([element, wasInert]) => {
      element.inert = wasInert;
    });
    backgroundState = [];
    document.body.classList.remove("vk-header-panel-open");
    activePanel = null;
    activeTrigger = null;
    updateNavigationState();
    if (immediate) motion.reset();
    if (restoreFocus && previousTrigger) {
      (previousTrigger.getClientRects().length
        ? previousTrigger
        : header.querySelector(".vk-brand")
      ).focus();
    }
  }

  // Khóa nền trong dialog mobile; closePanel khôi phục trạng thái cũ.
  function isolatePanel(panel) {
    let branch = panel;
    while (branch.parentElement && branch !== document.body) {
      [...branch.parentElement.children]
        .filter((element) => element !== branch)
        .forEach((element) => {
          backgroundState.push([element, element.inert]);
          element.inert = true;
        });
      branch = branch.parentElement;
    }
    document.body.classList.add("vk-header-panel-open");
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-modal", "true");
  }

  function openPanel(panel, trigger) {
    if (activePanel === panel) {
      closePanel(true);
      return;
    }
    closePanel(false, true);
    activePanel = panel;
    activeTrigger = trigger;
    panel.classList.add("vk-mobile-open");
    panel.setAttribute("aria-labelledby", "vk-menu-title");
    trigger.setAttribute("aria-expanded", "true");
    updateNavigationState();
    if (mobileQuery.matches) isolatePanel(panel);
    panel.querySelector("[data-vk-close]").focus();
  }

  // Mở nhóm mới sẽ trả banner về tổng quan.
  function openCategory(button, source = "click") {
    const wasOpen = activeCategory === button;
    if (wasOpen && (source === "hover" || source === "keyboard")) {
      clearHoverTimers();
      updateNavigationState();
      return;
    }
    if (wasOpen && categoryOpenedByHover && source === "click") {
      clearHoverTimers();
      categoryOpenedByHover = false;
      return;
    }
    if (wasOpen) {
      closeCategory();
      return;
    }
    const previousButton = activeCategory;
    const previousPanel =
      previousButton &&
      header.querySelector(`#${previousButton.getAttribute("aria-controls")}`);
    clearHoverTimers();
    previousButton?.setAttribute("aria-expanded", "false");
    activeCategory = button;
    hoveredCategory = null;
    categoryOpenedByHover = source === "hover";
    button.setAttribute("aria-expanded", "true");
    const panel = header.querySelector(`#${button.getAttribute("aria-controls")}`);
    const direction =
      previousButton &&
      categoryButtons.indexOf(button) < categoryButtons.indexOf(previousButton)
        ? -1
        : 1;

    banners.reset(panel);
    motion.showCategory(panel, { previousPanel, direction });
    updateNavigationState();
  }

  // Hover mở trễ 75ms, đóng trễ 200ms để chuột đi vào dropdown.
  categoryButtons.forEach((button) => {
    button.addEventListener("click", () => openCategory(button));
    button.addEventListener("pointerenter", (event) => {
      if (mobileQuery.matches || !hoverQuery.matches || event.pointerType !== "mouse")
        return;
      clearHoverTimers();
      hoveredCategory = button;
      updateNavigationState();
      hoverOpenTimer = setTimeout(
        () => openCategory(button, "hover"),
        activeCategory ? 40 : 75,
      );
    });
    button.addEventListener("pointerleave", () => {
      clearTimeout(hoverOpenTimer);
      hoveredCategory = null;
      updateNavigationState();
    });
    button.parentElement.addEventListener("pointerenter", () =>
      clearTimeout(hoverCloseTimer),
    );
    button.parentElement.addEventListener("pointerleave", (event) => {
      if (mobileQuery.matches || event.pointerType !== "mouse") return;
      clearTimeout(hoverCloseTimer);
      hoverCloseTimer = setTimeout(() => {
        const panel = header.querySelector(`#${button.getAttribute("aria-controls")}`);
        if (activeCategory === button && !panel.contains(document.activeElement))
          closeCategory();
      }, 200);
    });
    button.addEventListener("keydown", (event) => {
      if (event.key !== "ArrowDown") return;
      event.preventDefault();
      openCategory(button, "keyboard");
      header.querySelector(`#${button.getAttribute("aria-controls")} a[href]`)?.focus();
    });

    if (button.parentElement.querySelector('.vk-dropdown a[aria-current="page"]'))
      button.classList.add("vk-has-current");
  });

  menuButton.addEventListener("click", () => {
    if (mobileQuery.matches) openPanel(menuPanel, menuButton);
  });
  header
    .querySelectorAll("[data-vk-close]")
    .forEach((button) => button.addEventListener("click", () => closePanel(true)));
  header.addEventListener("click", (event) => {
    if (event.target.closest("a[href]")) closePanel();
  });

  document.addEventListener("pointerdown", (event) => {
    if (event.target === backdrop) {
      closePanel();
      return;
    }
    if (activePanel === menuPanel || (activePanel && mobileQuery.matches)) return;
    if (!header.contains(event.target)) closePanel();
    else if (activeCategory && !event.target.closest(".vk-nav-group")) closeCategory();
  });

  document.addEventListener("focusin", (event) => {
    if (mobileQuery.matches) return;
    if (
      activePanel &&
      !activePanel.contains(event.target) &&
      event.target !== activeTrigger
    )
      closePanel();
    if (activeCategory && !activeCategory.parentElement.contains(event.target))
      closeCategory();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      if (activeCategory) {
        event.preventDefault();
        const button = activeCategory;
        closeCategory();
        button.focus();
      } else if (activePanel) {
        event.preventDefault();
        closePanel(true);
      }
      return;
    }
    if (event.key !== "Tab" || !activePanel || !mobileQuery.matches) return;
    const focusable = [
      ...activePanel.querySelectorAll("a[href], button:not([disabled])"),
    ].filter(
      (element) => element.getClientRects().length > 0 && !element.closest("[inert]"),
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
  });

  // Hai ngưỡng cuộn tránh navbar co giãn liên tục ở cùng một vị trí.
  const updateScroll = () => {
    const threshold = header.classList.contains("vk-is-scrolled") ? 8 : 32;
    header.classList.toggle("vk-is-scrolled", window.scrollY > threshold);
  };
  updateScroll();
  window.addEventListener("scroll", updateScroll, { passive: true });

  const navResizeObserver = new ResizeObserver(updateNavigationState);
  navResizeObserver.observe(navigation);
  navResizeObserver.observe(header.querySelector(".vk-header-inner"));
  mobileQuery.addEventListener("change", () => closePanel(true, true));
  window.addEventListener("pagehide", () => closePanel(false, true));
}
