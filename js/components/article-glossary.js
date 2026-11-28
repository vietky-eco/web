export function initArticleGlossary(article, glossary) {
  const definitions = new Map(glossary.map(({ term, description }) => [term.toLowerCase(), description]));
  const terms = [...definitions.keys()].sort((a, b) => b.length - a.length)
    .map(term => term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const pattern = new RegExp(`(?<![\\p{L}\\p{N}])(?:${terms.join("|")})(?![\\p{L}\\p{N}])`, "giu");
  const seen = new Set();
  const tooltip = document.createElement("div");
  tooltip.id = "detail-glossary-tooltip";
  tooltip.className = "vk-detail-glossary-tooltip";
  tooltip.setAttribute("role", "tooltip");
  tooltip.hidden = true;
  document.body.append(tooltip);

  let active;
  let pinned = false;
  let dismissTimer;

  function hide() {
    clearTimeout(dismissTimer);
    active?.removeAttribute("aria-describedby");
    active = null;
    pinned = false;
    tooltip.hidden = true;
  }

  function show(trigger, description, pin = false) {
    hide();
    active = trigger;
    pinned = pin;
    tooltip.textContent = description;
    tooltip.hidden = false;
    trigger.setAttribute("aria-describedby", tooltip.id);

    position();
  }

  function position() {
    if (!active) return;
    const rect = active.getBoundingClientRect();
    if (rect.bottom < 0 || rect.top > window.innerHeight) {
      hide();
      return;
    }
    const left = Math.max(8, Math.min(rect.left, document.documentElement.clientWidth - tooltip.offsetWidth - 8));
    const below = rect.bottom + 6;
    const top = below + tooltip.offsetHeight <= window.innerHeight - 8
      ? below
      : Math.max(8, rect.top - tooltip.offsetHeight - 6);
    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;
  }

  function deferHide() {
    if (active && !pinned && !active.matches(":focus-visible")) {
      clearTimeout(dismissTimer);
      dismissTimer = setTimeout(hide, 160);
    }
  }

  const paragraphs = article.querySelectorAll("#detail-summary, #detail-context p, #detail-content > section > p");
  for (const paragraph of paragraphs) {
    const text = paragraph.textContent;
    const matches = [...text.matchAll(pattern)].filter(([term]) => {
      const key = term.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    if (!matches.length) continue;

    const fragment = document.createDocumentFragment();
    let start = 0;
    for (const match of matches) {
      const term = match[0];
      fragment.append(text.slice(start, match.index));
      const trigger = document.createElement("button");
      trigger.type = "button";
      trigger.className = "vk-detail-glossary-term";
      trigger.textContent = term;
      const description = definitions.get(term.toLowerCase());
      trigger.addEventListener("pointerenter", event => {
        if (event.pointerType === "mouse" && active !== trigger) show(trigger, description);
        clearTimeout(dismissTimer);
      });
      trigger.addEventListener("pointerleave", deferHide);
      trigger.addEventListener("focus", () => {
        if (trigger.matches(":focus-visible")) show(trigger, description);
      });
      trigger.addEventListener("blur", () => {
        if (active === trigger) hide();
      });
      trigger.addEventListener("click", () => {
        if (active === trigger && pinned) hide();
        else show(trigger, description, true);
      });
      fragment.append(trigger);
      start = match.index + term.length;
    }
    fragment.append(text.slice(start));
    paragraph.replaceChildren(fragment);
  }

  tooltip.addEventListener("pointerenter", () => clearTimeout(dismissTimer));
  tooltip.addEventListener("pointerleave", deferHide);
  document.addEventListener("pointerdown", event => {
    if (active && !active.contains(event.target) && !tooltip.contains(event.target)) hide();
  });
  document.addEventListener("keydown", event => {
    if (active && event.key === "Escape") hide();
  });
  window.addEventListener("resize", position);
  window.addEventListener("scroll", position, { passive: true });
}
