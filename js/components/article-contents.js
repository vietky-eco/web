async function copySectionLink(link, status) {
  status.textContent = "";
  try {
    await navigator.clipboard.writeText(link.href);
    status.textContent = `Đã sao chép liên kết đến mục “${link.textContent}”.`;
  } catch {
    window.prompt("Sao chép liên kết đến mục này:", link.href);
  }
}

export function initArticleContents(article) {
  const list = article.querySelector("#detail-contents-list");
  const status = article.querySelector("#detail-contents-status");
  const sections = [...article.querySelectorAll(
    "#detail-context-section, #detail-content > section[id], #detail-sources",
  )].filter(section => !section.hidden && section.querySelector("h2")?.textContent.trim());

  if (sections.some(section => section.id !== "detail-sources")) {
    for (const section of sections) {
      section.tabIndex = -1;
      section.classList.add("vk-detail-section-target");

      const link = document.createElement("a");
      link.href = `#${encodeURIComponent(section.id)}`;
      link.textContent = section.querySelector("h2").textContent.trim();

      const copy = document.createElement("button");
      copy.type = "button";
      copy.textContent = "Sao chép";
      copy.setAttribute("aria-label", `Sao chép liên kết đến mục ${link.textContent}`);
      copy.addEventListener("click", () => copySectionLink(link, status));

      const item = document.createElement("li");
      item.append(link, copy);
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
