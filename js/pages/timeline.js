import { ASSETS } from "../core/assets.js";
import { EVENT_TAGS } from "../core/event-tags.js";
import { ScrollBanner } from "../components/scroll-banner.js";

// Các thẻ HTML là bản mẫu bố cục; chưa nối dữ liệu JSON.
const container = document.getElementById("timeline");
const items = [...container.querySelectorAll("[data-timeline-item]")];
const queryInput = document.getElementById("timeline-query");
const yearSelect = document.getElementById("timeline-year");
const empty = document.getElementById("timeline-empty");
const periodButtons = [...document.querySelectorAll(".tl-period")];
const previous = document.getElementById("timeline-previous");
const next = document.getElementById("timeline-next");
const intro = document.querySelector(".tl-period-intro");
const description = document.getElementById("timeline-period-description");
const tranDescription = description.textContent;
const figure = document.querySelector(".tl-intro-figure");
let period = "tran";
let type = "all";

const desktopMotion = window.matchMedia("(min-width: 1101px) and (prefers-reduced-motion: no-preference)");
let carouselFrame = 0;
const assetVariables = {
  "--tl-reference-image": ASSETS.eventCourt,
  "--tl-event-court-image": ASSETS.eventCourt,
  "--tl-event-defense-image": ASSETS.eventDefense,
  "--tl-event-bach-dang-image": ASSETS.eventBachDang,
  "--tl-paper-texture": ASSETS.paperTexture,
  "--tl-hero-far-image": ASSETS.heroMountains,
  "--tl-hero-near-image": ASSETS.heroForeground,
  "--tl-deco-left-image": ASSETS.decoLeft,
  "--tl-deco-right-image": ASSETS.decoRight,
  "--tl-deco-bottom-image": ASSETS.decoBottom,
};
Object.entries(assetVariables).forEach(([name, url]) => {
  if (url) document.body.style.setProperty(name, `url("${url}")`);
});
document.querySelectorAll("[data-asset]").forEach((image) => {
  image.src = ASSETS[image.dataset.asset];
});

const filterHost = document.querySelector(".tl-types");
Object.entries(EVENT_TAGS).forEach(([key, tag]) => {
  const button = document.createElement("button");
  button.type = "button";
  button.dataset.type = key;
  button.setAttribute("aria-pressed", String(key === "all"));
  const icon = document.createElement("span");
  icon.className = "tl-filter-icon";
  icon.setAttribute("aria-hidden", "true");
  icon.style.setProperty("--tl-icon", `url("${tag.icon}")`);
  button.append(icon, document.createTextNode(tag.label));
  if (key === "all") {
    const count = document.createElement("span");
    count.id = "timeline-count";
    button.append(count);
  }
  filterHost.append(button);
});
items.forEach((item) => {
  const tag = EVENT_TAGS[item.dataset.type];
  if (tag) item.querySelector(".tl-tag").textContent = tag.label;
});

const pagination = document.querySelector(".tl-page-dots");
const pageDots = periodButtons.map((button) => {
  button.prepend(ScrollBanner());
  const dot = document.createElement("button");
  dot.type = "button";
  dot.className = "tl-page-dot";
  dot.tabIndex = -1;
  dot.setAttribute("aria-label", `Chọn ${button.dataset.title}`);
  dot.addEventListener("click", () => selectPeriod(button.dataset.period));
  pagination.append(dot);
  return dot;
});

function normalize(text) {
  return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d");
}

function filterSamples() {
  const query = normalize(queryInput.value.trim());
  const periodItems = items.filter((item) => item.dataset.period === period);
  let count = 0;
  items.forEach((item) => {
    const visible = item.dataset.period === period &&
      (type === "all" || item.dataset.type === type) &&
      (!yearSelect.value || Number(item.dataset.year) <= Number(yearSelect.value)) &&
      normalize(item.querySelector(".tl-card-copy").textContent).includes(query);
    item.hidden = !visible;
    item.classList.toggle("tl-item--left", visible && count % 2 === (window.matchMedia("(min-width: 1101px)").matches ? 0 : 1));
    if (visible) count++;
  });
  container.hidden = count === 0;
  empty.hidden = count !== 0;
  document.getElementById("timeline-count").textContent = periodItems.length;
  document.getElementById("timeline-status").textContent = `${count} / ${periodItems.length} mốc`;
  empty.querySelector("h3").textContent = periodItems.length ? "Chưa có mục phù hợp" : "Nội dung đang được cập nhật";
  empty.querySelector("p").textContent = periodItems.length
    ? "Thử đổi từ khóa, bộ lọc hoặc chọn lại thời kỳ."
    : "Bạn có thể chọn nhà Trần để xem các sự kiện hiện có.";
  document.getElementById("timeline-reset").textContent = periodItems.length ? "Đặt lại bộ lọc" : "Xem thời Trần";
}

function resetFilters() {
  type = "all";
  queryInput.value = "";
  yearSelect.value = "";
  document.querySelectorAll("button[data-type]").forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.type === "all"));
  });
}

function centerPeriod(button, animate = false) {
  cancelAnimationFrame(carouselFrame);
  const rail = button.parentElement;
  const target = Math.max(0, Math.min(rail.scrollWidth - rail.clientWidth,
    button.offsetLeft - rail.offsetLeft - (rail.clientWidth - button.offsetWidth) / 2));
  if (!animate || !desktopMotion.matches) {
    rail.scrollTo({ left: target, behavior: "instant" });
    return;
  }
  const start = rail.scrollLeft;
  const started = performance.now();
  function step(now) {
    const progress = Math.min((now - started) / 360, 1);
    rail.scrollLeft = start + (target - start) * (1 - (1 - progress) ** 3);
    if (progress < 1) carouselFrame = requestAnimationFrame(step);
  }
  carouselFrame = requestAnimationFrame(step);
}

function selectPeriod(value, reset = true) {
  period = value;
  const index = periodButtons.findIndex((button) => button.dataset.period === value);
  const button = periodButtons[index];
  const title = button.dataset.title;
  const heading = title.startsWith("Nhà ") ? `THỜI ${title.slice(4).toUpperCase()}` : title.toUpperCase();
  document.getElementById("timeline-period-title").textContent = heading;
  document.getElementById("timeline-period-years").textContent = button.querySelector("small").textContent;
  document.getElementById("timeline-period-position").textContent = `${index + 1} / ${periodButtons.length}`;
  queryInput.placeholder = title.startsWith("Nhà ") ? `Tìm trong thời ${title.slice(4)}…` : `Tìm trong ${title.toLowerCase()}…`;
  queryInput.setAttribute("aria-label", `Tìm sự kiện: ${title}`);
  periodButtons.forEach((control) => {
    control.setAttribute("aria-pressed", String(control === button));
    control.tabIndex = control === button ? 0 : -1;
  });
  pageDots.forEach((dot, dotIndex) => dot.setAttribute("aria-pressed", String(dotIndex === index)));
  previous.disabled = index === 0;
  next.disabled = index === periodButtons.length - 1;
  document.querySelector(".tl-period-seal").hidden = value !== "tran";
  document.querySelector(".tl-period-mark--fallback").hidden = value === "tran";
  document.querySelector(".tl-period-heading").classList.toggle("tl-period-heading--tran-seal", value === "tran");
  figure.hidden = value !== "tran";
  intro.classList.toggle("tl-period-intro--empty", value !== "tran");
  description.textContent = value === "tran" ? tranDescription : `Nội dung giới thiệu về ${title} đang được cập nhật.`;
  yearSelect.replaceChildren(new Option("Đến năm", ""));
  const years = [...new Set(items.filter((item) => item.dataset.period === value).map((item) => item.dataset.year))].sort((a, b) => Number(a) - Number(b));
  years.forEach((year) => yearSelect.add(new Option(year, year)));
  if (reset) resetFilters();
  filterSamples();
  centerPeriod(button, reset);
}

periodButtons.forEach((button, index) => {
  button.addEventListener("click", () => selectPeriod(button.dataset.period));
  button.addEventListener("keydown", (event) => {
    let target;
    if (event.key === "ArrowLeft") target = periodButtons[Math.max(0, index - 1)];
    if (event.key === "ArrowRight") target = periodButtons[Math.min(periodButtons.length - 1, index + 1)];
    if (event.key === "Home") target = periodButtons[0];
    if (event.key === "End") target = periodButtons.at(-1);
    if (!target) return;
    event.preventDefault();
    selectPeriod(target.dataset.period);
    target.focus({ preventScroll: true });
  });
});

previous.addEventListener("click", () => {
  const index = periodButtons.findIndex((button) => button.dataset.period === period);
  selectPeriod(periodButtons[Math.max(0, index - 1)].dataset.period);
});
next.addEventListener("click", () => {
  const index = periodButtons.findIndex((button) => button.dataset.period === period);
  selectPeriod(periodButtons[Math.min(periodButtons.length - 1, index + 1)].dataset.period);
});
document.querySelectorAll("button[data-type]").forEach((button) => {
  button.addEventListener("click", () => {
    type = button.dataset.type;
    document.querySelectorAll("button[data-type]").forEach((control) => control.setAttribute("aria-pressed", String(control === button)));
    filterSamples();
  });
});
queryInput.addEventListener("input", filterSamples);
yearSelect.addEventListener("change", filterSamples);
document.getElementById("timeline-reset").addEventListener("click", () => {
  if (!items.some((item) => item.dataset.period === period)) selectPeriod("tran");
  else {
    resetFilters();
    filterSamples();
  }
  queryInput.focus();
});
document.getElementById("timeline-period-image").addEventListener("error", (event) => {
  event.currentTarget.hidden = true;
  figure.classList.add("tl-intro-figure--unavailable");
  figure.querySelector("figcaption").textContent = "Ảnh minh họa hiện chưa tải được.";
});
selectPeriod("tran", false);
document.fonts.ready.then(() => centerPeriod(periodButtons.find((button) => button.dataset.period === period)));
window.addEventListener("resize", () => {
  filterSamples();
  centerPeriod(periodButtons.find((button) => button.dataset.period === period));
});

// Mỗi thẻ chỉ xuất hiện một lần; vẫn hiển thị bình thường khi giảm chuyển động.
if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      if (desktopMotion.matches) entry.target.querySelector(".tl-card").animate([
        { opacity: 0, transform: "translateY(14px)" },
        { opacity: 1, transform: "translateY(0)" },
      ], { duration: 400, easing: "cubic-bezier(.2,.7,.2,1)" });
      entry.target.dataset.revealed = "true";
      observer.unobserve(entry.target);
    });
  }, { threshold: .1 });
  items.forEach((item) => observer.observe(item));
}
