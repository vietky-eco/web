const COMPONENTS_URL = new URL("../../components/", import.meta.url);

async function loadComponent(hostId, fileName) {
  const host = document.getElementById(hostId);
  if (!host) return null;

  const url = new URL(fileName, COMPONENTS_URL);
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Không tải được ${fileName}: HTTP ${response.status}`);
  }

  host.innerHTML = await response.text();
  return host;
}

function markActivePage() {
  const currentPage = location.pathname.endsWith("/pages/timeline.html")
    ? "/pages/timeline.html"
    : "/index.html";

  document.querySelectorAll(".site-header a, .site-footer a").forEach((link) => {
    if (link.getAttribute("href") === currentPage) {
      link.setAttribute("aria-current", "page");
    }
  });
}

function setupMobileMenu() {
  const button = document.querySelector(".vk-menu-button");
  const menu = document.getElementById("vk-mobile-nav");

  if (!button || !menu) return;

  const pageContent = document.querySelector("main");
  const footer = document.getElementById("site-footer");

  function setMenuOpen(isOpen) {
    menu.hidden = !isOpen;
    button.setAttribute("aria-expanded", String(isOpen));
    button.setAttribute("aria-label", isOpen ? "Đóng menu" : "Mở menu");
    if (pageContent) pageContent.inert = isOpen;
    if (footer) footer.inert = isOpen;
    document.body.classList.toggle("vk-menu-open", isOpen);
    if (isOpen) menu.querySelector("a")?.focus();
  }

  button.addEventListener("click", () => {
    setMenuOpen(menu.hidden);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !menu.hidden) {
      setMenuOpen(false);
      button.focus();
    }
  });
}

async function initComponents() {
  const [headerResult, footerResult] = await Promise.allSettled([
    loadComponent("site-header", "header.html"),
    loadComponent("site-footer", "footer.html"),
  ]);

  if (headerResult.status === "rejected") {
    console.error("Không tải được Header:", headerResult.reason);
    document.getElementById("site-header").innerHTML = '<a href="/index.html">Việt Ký</a>';
  }

  if (footerResult.status === "rejected") {
    console.error("Không tải được Footer:", footerResult.reason);
  }

  if (headerResult.status === "fulfilled") {
    markActivePage();
    setupMobileMenu();
  }
}

initComponents();
