export function initArticleNarration(container, entity, article) {
  const controls = document.createElement("div");
  controls.className = "vk-detail-narration";
  const play = document.createElement("button");
  play.type = "button";
  play.textContent = "Nghe bài viết";
  const stop = document.createElement("button");
  stop.type = "button";
  stop.textContent = "Dừng đọc";
  stop.hidden = true;
  const status = document.createElement("span");
  status.setAttribute("role", "status");
  controls.append(play, stop, status);
  container.querySelector("#detail-summary").after(controls);

  const speech = window.speechSynthesis;
  const paragraphs = [
    entity.summary,
    article.context,
    ...article.sections.flatMap(section => [section.heading, section.body]),
  ].filter(Boolean).flatMap(text => text.split(/\n\s*\n/));

  let active = false;
  let paused = false;
  let utterance;

  function reset() {
    active = false;
    paused = false;
    utterance = null;
    stop.hidden = true;
    play.textContent = "Nghe bài viết";
  }

  function read(index, voice) {
    if (index >= paragraphs.length) {
      reset();
      return;
    }
    const segment = new SpeechSynthesisUtterance(paragraphs[index]);
    utterance = segment;
    segment.lang = "vi-VN";
    segment.voice = voice;
    segment.onend = () => {
      if (utterance === segment) read(index + 1, voice);
    };
    segment.onerror = () => {
      if (utterance !== segment) return;
      reset();
      status.textContent = "Không thể đọc bài viết. Bạn có thể thử lại.";
    };
    speech.speak(segment);
  }

  play.addEventListener("click", () => {
    status.textContent = "";
    if (active) {
      if (paused) speech.resume();
      else speech.pause();
      paused = !paused;
      play.textContent = paused ? "Nghe tiếp" : "Tạm dừng";
      return;
    }
    const voice = speech?.getVoices().find(candidate => /^vi(?:-|$)/i.test(candidate.lang));
    if (!voice) {
      status.textContent = "Trình duyệt chưa có giọng đọc tiếng Việt.";
      return;
    }
    active = true;
    play.textContent = "Tạm dừng";
    stop.hidden = false;
    read(0, voice);
  });
  stop.addEventListener("click", () => {
    reset();
    speech.cancel();
    play.focus();
  });
  window.addEventListener("pagehide", () => {
    if (active) {
      reset();
      speech.cancel();
    }
  });
}
