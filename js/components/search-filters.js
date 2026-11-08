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

export function createSearchSelect(label, options, className) {
  const field = element("label", className);
  const caption = element("span", "sr-select-label", label);
  const control = element("span", "sr-filter-select");
  const select = element("select");
  select.setAttribute("aria-label", label);
  select.append(...options.map(([value, text]) => new Option(text, value)));
  control.append(select, searchIcon("ChevronDown", "sr-filter-chevron"));
  field.append(caption, control);
  return { field, select };
}

export function createSearchFilters({ onChange, onClear }) {
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
  const reset = element("button", "sr-text-button", "Xóa bộ lọc");
  reset.type = "button";
  reset.disabled = true;
  reset.addEventListener("click", onClear);
  heading.append(title, reset);

  const typePanel = element("section", "sr-filter-types");
  typePanel.id = "sr-filter-type";
  const typeTitle = element("h3", "", "Loại nội dung");
  const typeOptions = element("div", "sr-filter-type-options");
  typeOptions.setAttribute("role", "group");
  typeOptions.setAttribute("aria-label", "Loại nội dung");
  typePanel.append(typeTitle, typeOptions);
  const quickTypes = new Map(["all", ...SEARCH_QUICK_TYPES].map((id) => {
    const button = element("button", "sr-quick-type");
    button.type = "button";
    button.setAttribute("aria-pressed", String(id === "all"));
    button.append(searchIcon(TYPE_ICONS[id]), searchIcon("Check", "sr-quick-type-check"), element("span", "sr-quick-type-label", TYPES[id]));
    button.addEventListener("click", () => {
      if (id === "all") selectedTypes.clear();
      else if (!selectedTypes.delete(id)) selectedTypes.add(id);
      commit();
    });
    typeOptions.append(button);
    return [id, button];
  }));

  const { field: periodField, select: period } = createSearchSelect("Thời kỳ", [["", "Tất cả thời kỳ"]], "sr-period-field");
  const years = element("details", "sr-year-filter");
  years.open = true;
  const yearToggle = element("summary", "sr-year-toggle", "Khoảng năm");
  const yearValue = element("span", "sr-year-value");
  yearToggle.append(yearValue, searchIcon("ChevronDown"));
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
  years.append(yearToggle, yearSlider, yearLabels, yearHint);

  const periodPanel = element("div");
  periodPanel.id = "sr-filter-period";
  periodPanel.append(periodField, years);
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
    reset.disabled = !total;
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
    const samePeriod = period.value === (filters.period || "");
    resetYearRange(samePeriod ? filters.from : null, samePeriod ? filters.to : null);
    renderSelection(state());
  }

  function show(key, focus = false) {
    if (key && toggle.disabled) return;
    const wasHidden = filters.hidden;
    activeSection = key;
    filters.hidden = !key;
    toggle.setAttribute("aria-expanded", String(Boolean(key)));
    if (key && wasHidden) filters.scrollTop = 0;
    if (!focus) return;
    if (key === "period") period.focus();
    else if (key) quickTypes.get(selectedTypes.values().next().value ?? "all").focus();
    else toggle.focus({ preventScroll: true });
  }

  function setCatalog(data) {
    catalog = data;
    period.replaceChildren(
      new Option("Tất cả thời kỳ", ""),
      ...Array.from(catalog.periods, ([id, { label }]) => new Option(label, id)),
    );
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
