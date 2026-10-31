// Tải component, chuẩn hóa URL rồi khởi tạo navbar.
import { initHeader } from "../components/header.js?v=2";

const COMPONENTS_URL = new URL("../../components/", import.meta.url);

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
  const projectUrl = new URL("../../", import.meta.url);
  host.querySelectorAll("[href], [src], [action]").forEach((element) => {
    ["href", "src", "action"].forEach((attribute) => {
      const value = element.getAttribute(attribute);
      if (value?.startsWith("/") && !value.startsWith("//")) {
        element.setAttribute(attribute, new URL(value.slice(1), projectUrl).href);
      }
    });
  });
  return host;
}

function markActivePage() {
  const currentPage = location.pathname.replace(/\/$/, "/index.html");
  document
    .querySelectorAll(".site-header nav a, .site-footer nav a")
    .forEach((link) => {
      const target = new URL(link.href);

      if (target.pathname === currentPage) {
        link.setAttribute("aria-current", "page");
      } else {
        link.removeAttribute("aria-current");
      }
    });
}

async function initComponents() {
  // Một component tải lỗi không chặn component còn lại.
  const [headerResult, footerResult] = await Promise.allSettled([
    loadComponent("site-header", "header.html"),
    loadComponent("site-footer", "footer.html"),
  ]);

  if (headerResult.status === "rejected") {
    console.error("Không tải được Header:", headerResult.reason);
    document.getElementById("site-header").innerHTML =
      '<a href="/index.html">Việt Ký</a>';
  }

  if (footerResult.status === "rejected") {
    console.error("Không tải được Footer:", footerResult.reason);
  }

  if (headerResult.status === "fulfilled") {
    markActivePage();
    initHeader(headerResult.value?.querySelector(".vk-header"));
  }
}

initComponents();
