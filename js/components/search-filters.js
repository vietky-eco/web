import { formatSearchYear, SEARCH_QUICK_TYPES, TYPES } from "../features/search-ui-adapter.js";
import { element, searchIcon } from "./search-results.js";

const SNAP_DISTANCE = 8;
const TYPE_ICONS = { all: "LayoutGrid", event: "CalendarDays", person: "UserRound", place: "MapPin", artifact: "Archive", culture: "Palette" };

// Chia theo mốc tròn, tối đa năm vạch giữa hai đầu.
function yearSnapPoints(min, max) {
  const interval = Math.max(1, (max - min) / 5);
  const magnitude = 10 ** Math.floor(Math.log10(interval));
  const step = [1, 2, 5, 10].map((unit) => unit * magnitude).find((unit) => unit >= interval);
  const points = [min];
  for (let year = (Math.floor(min / step) + 1) * step; year < max; year += step) points.push(year);
  points.push(max);
  return points;
}

// Select lưu trạng thái, còn menu dùng chung cho thời kỳ và sắp xếp.
export function createSearchSelect(label, options, className) {
  const field = element("div", className);
  const caption = element("span", "sr-select-label", label);
  const control = element("div", "sr-filter-select");
  const select = element("select");
  select.hidden = true;
  const trigger = element("button", "sr-period-trigger");
  trigger.type = "button";
  trigger.setAttribute("aria-label", label);
  trigger.setAttribute("aria-haspopup", "listbox");
  trigger.setAttribute("aria-expanded", "false");
  const value = element("span", "sr-period-value");
  trigger.append(value, searchIcon("ChevronDown", "sr-filter-chevron"));
  const list = element("div", "sr-period-options");
  list.setAttribute("role", "listbox");
  list.setAttribute("aria-label", label);
  list.hidden = true;
  control.append(select, trigger, list);
  field.append(caption, control);

  function close(focus = false) {
    list.hidden = true;
    trigger.setAttribute("aria-expanded", "false");
    if (focus) trigger.focus();
  }

  function sync() {
    value.textContent = select.selectedOptions[0]?.textContent || "";
    list.replaceChildren(...Array.from(select.options, (option) => {
      const item = element("button", "sr-period-option", option.textContent);
      item.type = "button";
      item.setAttribute("role", "option");
      item.setAttribute("aria-selected", String(option.selected));
      item.addEventListener("click", () => {
        select.value = option.value;
        sync();
        select.dispatchEvent(new Event("change", { bubbles: true }));
        close(true);
      });
      return item;
    }));
  }

  function open() {
    sync();
    list.hidden = false;
    trigger.setAttribute("aria-expanded", "true");
    (list.querySelector('[aria-selected="true"]') || list.firstElementChild)?.focus();
  }

  trigger.addEventListener("click", () => list.hidden ? open() : close());
  trigger.addEventListener("keydown", (event) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      open();
    }
  });
  list.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      close(true);
      return;
    }
    const items = Array.from(list.children);
    const current = items.indexOf(document.activeElement);
    let next;
    if (event.key === "ArrowDown") next = Math.min(current + 1, items.length - 1);
    else if (event.key === "ArrowUp") next = Math.max(current - 1, 0);
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = items.length - 1;
    else return;
    event.preventDefault();
    items[next]?.focus();
  });
  control.addEventListener("focusout", (event) => {
    if (!control.contains(event.relatedTarget)) close();
  });
  select.append(...options.map(([value, text]) => new Option(text, value)));
  sync();
  return { field, select, trigger, sync, close };
}

export function createSearchFilters({ onChange }) {
  const toggle = element("button", "sr-filter-toggle");
  toggle.type = "button";
  toggle.id = "sr-filter-trigger";
  toggle.disabled = true;
  toggle.setAttribute("aria-controls", "sr-filter-sidebar");
  toggle.setAttribute("aria-expanded", "false");
  const totalBadge = element("span", "sr-filter-badge");
  totalBadge.hidden = true;
  toggle.append(searchIcon("SlidersHorizontal"), element("span", "", "Bộ lọc"), totalBadge);

  const filters = element("aside", "sr-filter-sidebar");
  filters.id = "sr-filter-sidebar";
  filters.setAttribute("aria-labelledby", "sr-filter-title");
  filters.hidden = true;
  const heading = element("header", "sr-filter-heading");
  const title = element("h2");
  title.id = "sr-filter-title";
  title.append(searchIcon("SlidersHorizontal"), element("span", "", "Bộ lọc"));
  heading.append(title);

  const typePanel = element("section", "sr-filter-types");
  typePanel.id = "sr-filter-type";
  const typeTitle = element("h3", "", "Loại nội dung");
  const typeHeading = element("div", "sr-filter-group-heading");
  const resetTypes = element("button", "sr-filter-group-reset", "Đặt lại");
  resetTypes.type = "button";
  resetTypes.disabled = true;
  resetTypes.setAttribute("aria-label", "Đặt lại loại nội dung");
  typeHeading.append(typeTitle, resetTypes);
  const typeOptions = element("div", "sr-filter-type-options");
  typeOptions.setAttribute("role", "group");
  typeOptions.setAttribute("aria-label", "Loại nội dung");
  typePanel.append(typeHeading, typeOptions);
  const quickTypes = new Map(["all", ...SEARCH_QUICK_TYPES].map((id) => {
    const button = element("button", "sr-quick-type");
    button.type = "button";
    button.setAttribute("aria-pressed", String(id === "all"));
    button.append(searchIcon(TYPE_ICONS[id]), element("span", "sr-quick-type-label", TYPES[id]));
    button.addEventListener("click", () => {
      if (id === "all") selectedTypes.clear();
      else if (!selectedTypes.delete(id)) selectedTypes.add(id);
      commit();
    });
    typeOptions.append(button);
    return [id, button];
  }));

  const periodSelect = createSearchSelect("Thời kỳ", [["", "Tất cả thời kỳ"]], "sr-period-field");
  const { field: periodField, select: period } = periodSelect;
  const years = element("div", "sr-year-filter");
  const yearValue = element("span", "sr-year-value");
  const yearSlider = element("div", "sr-year-slider");
  const yearTrack = element("span", "sr-year-track");
  yearTrack.setAttribute("aria-hidden", "true");
  const from = element("input", "sr-year-start");
  const to = element("input", "sr-year-end");
  for (const [input, label] of [[from, "Từ năm"], [to, "Đến năm"]]) {
    input.type = "range";
    input.setAttribute("aria-label", label);
  }
  yearSlider.append(yearTrack, from, to);
  const yearLabels = element("div", "sr-year-labels");
  yearLabels.setAttribute("aria-hidden", "true");
  const startLabel = element("span");
  const endLabel = element("span");
  yearLabels.append(startLabel, endLabel);
  const yearHint = element("p", "sr-year-hint");
  years.append(yearSlider, yearLabels, yearHint);

  const periodPanel = element("section", "sr-filter-time");
  periodPanel.id = "sr-filter-period";
  const timeHeading = element("div", "sr-filter-group-heading");
  const timeTitle = element("h3", "", "Thời gian");
  const resetTime = element("button", "sr-filter-group-reset", "Đặt lại");
  resetTime.type = "button";
  resetTime.disabled = true;
  resetTime.setAttribute("aria-label", "Đặt lại thời gian");
  timeHeading.append(timeTitle, resetTime);
  periodPanel.append(timeHeading, yearValue, periodField, years);
  filters.append(heading, typePanel, periodPanel);

  let activeSection = "";
  let catalog;
  let selectedTypes = new Set();
  let yearBounds;
  let snapYears = [];
  let yearPointer;

  function state() {
    return {
      types: [...selectedTypes],
      period: period.value,
      from: !yearSlider.hidden && from.valueAsNumber !== yearBounds[0] ? from.valueAsNumber : null,
      to: !yearSlider.hidden && to.valueAsNumber !== yearBounds[1] ? to.valueAsNumber : null,
    };
  }

  function resetYearRange(start, end) {
    yearBounds = period.value ? catalog?.periods.get(period.value)?.bounds : catalog?.yearBounds;
    const canSlide = Boolean(yearBounds && yearBounds[0] < yearBounds[1]);
    yearSlider.hidden = !canSlide;
    yearLabels.hidden = !canSlide;
    yearHint.hidden = canSlide;
    if (!canSlide) {
      yearHint.textContent = yearBounds ? `Chỉ có mốc năm ${formatSearchYear(yearBounds[0])}.` : "Chưa có mốc năm cho phạm vi này.";
      return;
    }
    const [min, max] = yearBounds;
    snapYears = yearSnapPoints(min, max);
    yearTrack.replaceChildren(...snapYears.slice(1, -1).map((year) => {
      const tick = element("span", "sr-year-tick");
      tick.style.left = `${(year - min) / (max - min) * 100}%`;
      return tick;
    }));
    for (const input of [from, to]) {
      input.min = min;
      input.max = max;
    }
    from.value = Number.isSafeInteger(start) ? start : min;
    to.value = Number.isSafeInteger(end) ? end : max;
    if (from.valueAsNumber > to.valueAsNumber) {
      from.value = min;
      to.value = max;
    }
    startLabel.textContent = formatSearchYear(min);
    endLabel.textContent = formatSearchYear(max);
  }

  function renderYears() {
    yearValue.hidden = yearSlider.hidden;
    if (yearSlider.hidden) return;
    const [min, max] = yearBounds;
    const start = from.valueAsNumber;
    const end = to.valueAsNumber;
    from.setAttribute("aria-valuemax", String(end));
    to.setAttribute("aria-valuemin", String(start));
    from.setAttribute("aria-valuetext", formatSearchYear(start));
    to.setAttribute("aria-valuetext", formatSearchYear(end));
    yearSlider.toggleAttribute("data-start-on-top", start === max);
    yearTrack.style.setProperty("--sr-year-start", `${(start - min) / (max - min) * 100}%`);
    yearTrack.style.setProperty("--sr-year-end", `${(end - min) / (max - min) * 100}%`);
    yearValue.textContent = start === end ? formatSearchYear(start) : `${formatSearchYear(start)}–${formatSearchYear(end)}`;
  }

  function renderSelection(filters) {
    for (const [id, button] of quickTypes) {
      const pressed = id === "all" ? !selectedTypes.size : selectedTypes.has(id);
      button.setAttribute("aria-pressed", String(pressed));
    }
    renderYears();
    const total = selectedTypes.size + Number(Boolean(filters.period))
      + Number(filters.from != null || filters.to != null);
    resetTypes.disabled = !selectedTypes.size;
    resetTime.disabled = !filters.period && filters.from == null && filters.to == null;
    totalBadge.hidden = !total;
    totalBadge.textContent = total ? `(${total})` : "";
    toggle.setAttribute("aria-label", total ? `Bộ lọc (${total} điều kiện)` : "Bộ lọc");
  }

  function commit() {
    const filters = state();
    renderSelection(filters);
    onChange(filters);
  }

  function setFilters(filters) {
    selectedTypes = new Set(filters.types);
    period.value = filters.period || "";
    periodSelect.sync();
    const samePeriod = period.value === (filters.period || "");
    resetYearRange(samePeriod ? filters.from : null, samePeriod ? filters.to : null);
    renderSelection(state());
  }

  function show(key, focus = false) {
    if (key && toggle.disabled) return;
    const wasHidden = filters.hidden;
    activeSection = key;
    filters.hidden = !key;
    if (!key) periodSelect.close();
    toggle.setAttribute("aria-expanded", String(Boolean(key)));
    if (key && wasHidden) filters.scrollTop = 0;
    if (!focus) return;
    if (key === "period") periodSelect.trigger.focus();
    else if (key) quickTypes.get(selectedTypes.values().next().value ?? "all").focus();
    else toggle.focus({ preventScroll: true });
  }

  function setCatalog(data) {
    catalog = data;
    period.replaceChildren(
      new Option("Tất cả thời kỳ", ""),
      ...Array.from(catalog.periods, ([id, { label }]) => new Option(label, id)),
    );
    periodSelect.sync();
  }

  function snapYear(input, value) {
    const [min, max] = yearBounds;
    const width = yearTrack.getBoundingClientRect().width;
    const lower = input === from ? min : from.valueAsNumber;
    const upper = input === to ? max : to.valueAsNumber;
    let best = Math.round(Math.min(upper, Math.max(lower, value)));
    let distance = SNAP_DISTANCE;
    for (const year of snapYears) {
      if (year < lower || year > upper) continue;
      const gap = Math.abs(year - value) * width / (max - min);
      if (gap >= distance) continue;
      best = year;
      distance = gap;
    }
    return best;
  }

  toggle.addEventListener("click", () => show(activeSection ? "" : "type"));
  resetTypes.addEventListener("click", () => {
    selectedTypes.clear();
    commit();
    quickTypes.get("all").focus();
  });
  resetTime.addEventListener("click", () => {
    period.value = "";
    periodSelect.sync();
    resetYearRange();
    commit();
    periodSelect.trigger.focus();
  });
  period.addEventListener("change", () => {
    resetYearRange();
    commit();
  });
  yearSlider.addEventListener("input", ({ target }) => {
    if (yearPointer !== undefined) target.value = snapYear(target, target.valueAsNumber);
    if (from.valueAsNumber > to.valueAsNumber) target.value = target === from ? to.value : from.value;
    renderYears();
  });
  yearSlider.addEventListener("change", commit);
  yearSlider.addEventListener("pointerdown", ({ target, pointerId }) => {
    if (target === from || target === to) yearPointer = pointerId;
  });
  for (const event of ["pointerup", "pointercancel"]) {
    window.addEventListener(event, ({ pointerId }) => {
      if (yearPointer === pointerId) yearPointer = undefined;
    });
  }
  yearSlider.addEventListener("click", (event) => {
    if (event.target !== yearSlider || !yearBounds) return;
    const { left, width } = yearTrack.getBoundingClientRect();
    const [min, max] = yearBounds;
    const ratio = Math.min(1, Math.max(0, (event.clientX - left) / width));
    const value = min + ratio * (max - min);
    const input = value < (from.valueAsNumber + to.valueAsNumber) / 2 ? from : to;
    input.value = snapYear(input, value);
    input.focus({ preventScroll: true });
    commit();
  });

  return {
    element: filters,
    toggle,
    setCatalog,
    setFilters,
    show,
    getActiveSection: () => activeSection,
    focusTrigger() { toggle.focus(); },
    setEnabled(enabled) {
      toggle.disabled = !enabled;
      if (!enabled) show("");
    },
  };
}
