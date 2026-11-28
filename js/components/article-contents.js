function addSectionLinkButton(heading, link) {
  const headingRow = document.createElement("div");
  headingRow.className = "vk-detail-section-heading";

  const action = document.createElement("div");
  action.className = "vk-detail-section-action";
  const copy = document.createElement("button");
  copy.type = "button";
  copy.title = "Sao chép liên kết tới mục này";
  copy.setAttribute("aria-label", `Sao chép liên kết đến mục ${link.textContent}`);
  const status = document.createElement("span");
  status.setAttribute("role", "status");
  let feedbackTimer;
  copy.addEventListener("click", async () => {
    clearTimeout(feedbackTimer);
    status.textContent = "";
    try {
      await navigator.clipboard.writeText(link.href);
      status.textContent = "Đã sao chép liên kết";
      feedbackTimer = setTimeout(() => { status.textContent = ""; }, 3000);
    } catch {
      window.prompt("Sao chép liên kết đến mục này:", link.href);
    }
  });

  heading.before(headingRow);
  action.append(copy, status);
  headingRow.append(heading, action);
}

export function initArticleContents(article) {
  const list = article.querySelector("#detail-contents-list");
  const sections = [...article.querySelectorAll(
    "#detail-context-section, #detail-content > section[id], #detail-sources",
  )].filter(section => !section.hidden && section.querySelector("h2")?.textContent.trim());

  if (sections.some(section => section.id !== "detail-sources")) {
    for (const section of sections) {
      section.tabIndex = -1;
      section.classList.add("vk-detail-section-target");

      const link = document.createElement("a");
      link.href = `#${encodeURIComponent(section.id)}`;
      const heading = section.querySelector("h2");
      link.textContent = heading.textContent.trim();
      addSectionLinkButton(heading, link);

      const item = document.createElement("li");
      item.append(link);
      list.append(item);
    }
    list.closest("nav").hidden = false;
  }

  // The browser can resolve the initial fragment before JSON sections exist.
  let id;
  try {
    id = decodeURIComponent(window.location.hash.slice(1));
  } catch {
    return;
  }
  const target = sections.find(section => section.id === id);
  if (target) requestAnimationFrame(() => target.scrollIntoView());
}
