import { loadCatalog } from "../core/catalog-loader.js";
import { loadContent } from "../core/content-loader.js";
import { loadTimelineEvents, renderTimeline } from "../features/timeline.js";

const $ = selector => document.querySelector(selector);
const list = $("#timeline");
const count = $("#event-count");
const rail = $(".periods");
const dots = $(".dots");
const slots = 4;
const preview = ["localhost", "127.0.0.1", "[::1]"].includes(location.hostname) &&
  new URLSearchParams(location.search).get("preview") === "1";
const visible = record => preview || record.status === "published";
let periods = [];
let placesById = new Map();
let events = [];
let current = 0;
let firstVisible = 0;

function periodLabel(title) {
  const match = title.match(/^(.*?)\s*\(([^()]*)\)$/);
  return { name: match?.[1] || title, dates: match?.[2] || "" };
}

function renderOverview(period) {
  const { name, dates } = periodLabel(period.title);
  $("#period-name").textContent = name;
  $("#period-dates").textContent = dates;
  $("#period-dates").hidden = !dates;
  const summary = period.summary?.trim() || "";
  $("#period-summary").textContent = summary;
  $("#period-summary").hidden = !summary;

  const capitals = [];
  for (const { placeId, context } of period.capitals || []) {
    const place = placesById.get(placeId);
    if (!place) continue;
    const entry = document.createElement("span");
    entry.textContent = place.title;
    if (context) {
      const note = document.createElement("small");
      note.textContent = " (" + context + ")";
      entry.append(note);
    }
    capitals.push(entry);
  }
  $("#period-capital").replaceChildren(...capitals);
  $(".sq-capital").hidden = !capitals.length;
  $(".sq-chapter-copy").hidden = !summary && !capitals.length;
  $(".sq-overview").hidden = false;
}

function select(index) {
  current = (index + periods.length) % periods.length;
  const period = periods[current];
  firstVisible = Math.min(current, Math.max(firstVisible, current - slots + 1));
  const buttons = periods.slice(firstVisible, firstVisible + slots).map((record, offset) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "period";
    button.dataset.index = firstVisible + offset;
    button.setAttribute("aria-pressed", String(record.id === period.id));
    const name = document.createElement("strong");
    const dates = document.createElement("span");
    const label = periodLabel(record.title);
    name.textContent = label.name;
    dates.textContent = label.dates;
    button.append(name, dates);
    return button;
  });
  const hadFocus = rail.contains(document.activeElement);
  rail.replaceChildren(...buttons);
  $(".composition").dataset.selected = current - firstVisible;
  if (hadFocus) buttons[current - firstVisible].focus({preventScroll:true});
  [...dots.children].forEach((dot, i) => dot.classList.toggle("current", i === current));
  const inPeriod = events.filter(event => event.periodIds?.includes(period.id));
  renderOverview(period);
  $(".sq-events-empty").hidden = inPeriod.length > 0;
  if (inPeriod.length) {
    renderTimeline(list, inPeriod);
    list.querySelectorAll("details").forEach(card => {
      card.name = "su-quyen-events";
      const link = card.querySelector(".tl-card-link");
      link.setAttribute("aria-label", link.textContent);
      link.textContent = "Xem chi tiết";
    });
  } else {
    list.replaceChildren();
    list.hidden = true;
    list.dataset.timelineState = "empty";
  }
  count.textContent = inPeriod.length + " sự kiện";
}

async function init() {
  try {
    const catalog = (await loadCatalog()).filter(visible);
    placesById = new Map(catalog.filter(record => record.type === "place").map(place => [place.id, place]));
    const periodIds = catalog.filter(r => r.type === "period").map(r => r.id);
    periods = (await Promise.all(periodIds.map(loadContent))).filter(visible).sort((a,b) => a.order-b.order);
    if (!periods.length) {
      count.textContent = "Chưa có thời kỳ được công bố.";
      return;
    }
    events = (await loadTimelineEvents(catalog.filter(r => r.type === "event").map(r => r.id))).filter(visible);
    if (periods.length > slots) {
      for (const period of periods) {
        const dot = document.createElement("span");
        dot.className = "dot";
        dot.dataset.period = period.id;
        dots.append(dot);
      }
      dots.hidden = false;
    }
    $(".previous").hidden = $(".next").hidden = periods.length === 1;
    $(".su-quyen").hidden = false;
    select(Math.max(0, periods.findIndex(p => p.id === "per0004")));
  } catch {
    count.textContent = "Không thể tải dòng thời gian. Vui lòng tải lại trang.";
  }
}
rail.addEventListener("click", event => {
  const button = event.target.closest("button");
  if (button) select(Number(button.dataset.index));
});
rail.addEventListener("keydown", event => {
  const from = Number(event.target.closest("button")?.dataset.index);
  const target = {ArrowLeft:from-1, ArrowRight:from+1, Home:0, End:periods.length-1}[event.key];
  if (target !== undefined) { event.preventDefault(); select(target); }
});
$(".previous").addEventListener("click", () => select(current-1));
$(".next").addEventListener("click", () => select(current+1));
list.addEventListener("click", event => {
  const card = event.target.closest("details");
  if (card && !event.target.closest("summary, a")) card.querySelector("summary").click();
});
init();
