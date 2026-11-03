// Tải component chung và chuẩn hóa URL theo gốc dự án.
import { initHeader } from "../components/header.js?v=2";
import { initScrollProgress } from "../components/scroll-progress.js";

const COMPONENTS_URL = new URL("../../components/", import.meta.url);
const PROJECT_URL = new URL("../../", import.meta.url);

async function loadComponent(hostId, fileName) {
  const host = document.getElementById(hostId);
  if (!host) return null;

  const url = new URL(fileName, COMPONENTS_URL);
  const response = await fetch(url, { cache: "no-store" });

  if (!response.ok) {
    throw new Error(`Không tải được ${fileName}: HTTP ${response.status}`);
  }

  host.innerHTML = await response.text();

  // Quy đổi link theo gốc dự án để hỗ trợ triển khai trong thư mục con.
  host.querySelectorAll("[href], [src], [action]").forEach((element) => {
    ["href", "src", "action"].forEach((attribute) => {
      const value = element.getAttribute(attribute);
      if (value?.startsWith("/") && !value.startsWith("//")) {
        element.setAttribute(attribute, new URL(value.slice(1), PROJECT_URL).href);
      }
    });
  });
  return host;
}

function normalizePagePath(pathname) {
  return pathname.replace(/\/+$/, "").replace(/\.html$/, "").replace(/\/index$/, "") || "/";
}

function markActivePage() {
  const currentPage = normalizePagePath(location.pathname);
  document
    .querySelectorAll(".site-header nav a, .site-footer nav a")
    .forEach((link) => {
      const target = new URL(link.href);

      if (target.origin === location.origin && normalizePagePath(target.pathname) === currentPage) {
        link.setAttribute("aria-current", "page");
      } else {
        link.removeAttribute("aria-current");
      }
    });
}

async function initComponents() {
  // Một component tải lỗi không chặn component còn lại.
  const [headerResult, footerResult, progressResult] = await Promise.allSettled([
    loadComponent("site-header", "header.html"),
    loadComponent("site-footer", "footer.html"),
    loadComponent("site-scroll-progress", "scroll-progress.html"),
  ]);

  if (headerResult.status === "rejected") {
    console.error("Không tải được Header:", headerResult.reason);
    document.getElementById("site-header").innerHTML =
      '<a href="/">Việt Ký</a>';
  }

  if (footerResult.status === "rejected") {
    console.error("Không tải được Footer:", footerResult.reason);
  }

  if (progressResult.status === "fulfilled") {
    initScrollProgress(progressResult.value);
  } else {
    console.error("Không tải được thanh tiến độ:", progressResult.reason);
  }

  if (headerResult.status === "fulfilled") {
    markActivePage();
    initHeader(headerResult.value?.querySelector(".vk-header"));
  }
}

initComponents();
