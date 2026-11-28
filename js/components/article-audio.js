const AUDIO_PATH_PATTERN = /^assets\/audio\/[a-z0-9-]+\.mp3$/;
const PLAYBACK_RATES = [1, 1.25, 1.5, 2, 0.75];

function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const total = Math.floor(seconds);
  const minutes = Math.floor(total / 60);
  const remainder = total % 60;
  return `${minutes}:${String(remainder).padStart(2, "0")}`;
}

export function isValidArticleAudio(audio) {
  return Boolean(
    audio &&
    typeof audio === "object" &&
    !Array.isArray(audio) &&
    typeof audio.path === "string" &&
    AUDIO_PATH_PATTERN.test(audio.path),
  );
}

export function initArticleAudio(container, audio) {
  if (!isValidArticleAudio(audio)) return;
  const anchor = container.querySelector("#detail-summary");
  if (!anchor) return;

  const doc = container.ownerDocument;
  const section = doc.createElement("section");
  section.className = "vk-detail-audio";
  section.setAttribute("aria-label", audio.title || "Nghe câu chuyện");

  const audioEl = doc.createElement("audio");
  audioEl.preload = "none";
  audioEl.autoplay = false;
  audioEl.src = `/${audio.path}`;

  const toggle = doc.createElement("button");
  toggle.type = "button";
  toggle.className = "vk-detail-audio-toggle";
  toggle.setAttribute("aria-label", "Phát câu chuyện");
  const toggleLabel = doc.createElement("span");
  toggleLabel.textContent = audio.title || "Nghe câu chuyện";
  toggle.append(toggleLabel);

  const seek = doc.createElement("input");
  seek.type = "range";
  seek.className = "vk-detail-audio-seek";
  seek.min = "0";
  seek.max = "100";
  seek.step = "0.1";
  seek.value = "0";
  seek.setAttribute("aria-label", "Tua thời gian phát");

  const time = doc.createElement("span");
  time.className = "vk-detail-audio-time";
  const currentSpan = doc.createElement("span");
  currentSpan.textContent = "0:00";
  const sep = doc.createTextNode(" / ");
  const durationSpan = doc.createElement("span");
  durationSpan.textContent = Number.isInteger(audio.durationSeconds) && audio.durationSeconds > 0
    ? formatTime(audio.durationSeconds)
    : "0:00";
  time.append(currentSpan, sep, durationSpan);

  let rateIndex = 0;
  const speed = doc.createElement("button");
  speed.type = "button";
  speed.className = "vk-detail-audio-speed";
  speed.textContent = "1x";
  speed.setAttribute("aria-label", "Tốc độ phát 1x");

  const status = doc.createElement("span");
  status.className = "vk-detail-audio-status";
  status.setAttribute("role", "status");

  section.append(audioEl, toggle, seek, time, speed, status);
  anchor.after(section);

  let seeking = false;
  let pendingSeekRatio = null;

  function applySeek(ratio) {
    if (Number.isFinite(audioEl.duration) && audioEl.duration > 0) {
      audioEl.currentTime = ratio * audioEl.duration;
      pendingSeekRatio = null;
    } else {
      pendingSeekRatio = ratio;
    }
  }

  function syncDuration() {
    if (Number.isFinite(audioEl.duration) && audioEl.duration > 0) {
      durationSpan.textContent = formatTime(audioEl.duration);
      if (pendingSeekRatio !== null) {
        audioEl.currentTime = pendingSeekRatio * audioEl.duration;
        pendingSeekRatio = null;
      }
    }
  }

  function syncProgress() {
    if (seeking) return;
    currentSpan.textContent = formatTime(audioEl.currentTime);
    if (Number.isFinite(audioEl.duration) && audioEl.duration > 0) {
      seek.value = String((audioEl.currentTime / audioEl.duration) * 100);
    }
  }

  function setPlayingState(playing) {
    section.classList.toggle("is-playing", playing);
    toggle.setAttribute("aria-label", playing ? "Tạm dừng" : "Phát câu chuyện");
    toggleLabel.textContent = playing ? "Tạm dừng" : (audio.title || "Nghe câu chuyện");
  }

  toggle.addEventListener("click", async () => {
    status.textContent = "";
    if (!audioEl.paused) {
      audioEl.pause();
      return;
    }
    try {
      await audioEl.play();
    } catch {
      setPlayingState(false);
      status.textContent = "Không thể phát tệp âm thanh.";
    }
  });

  seek.addEventListener("pointerdown", () => { seeking = true; });
  seek.addEventListener("pointerup", () => { seeking = false; });
  seek.addEventListener("input", () => {
    const ratio = Number(seek.value) / 100;
    const duration = Number.isFinite(audioEl.duration) && audioEl.duration > 0
      ? audioEl.duration
      : (audio.durationSeconds ?? 0);
    currentSpan.textContent = formatTime(ratio * duration);
    applySeek(ratio);
  });
  seek.addEventListener("change", () => {
    seeking = false;
    applySeek(Number(seek.value) / 100);
  });

  speed.addEventListener("click", () => {
    rateIndex = (rateIndex + 1) % PLAYBACK_RATES.length;
    const rate = PLAYBACK_RATES[rateIndex];
    audioEl.playbackRate = rate;
    speed.textContent = `${rate}x`;
    speed.setAttribute("aria-label", `Tốc độ phát ${rate}x`);
  });

  audioEl.addEventListener("loadedmetadata", syncDuration);
  audioEl.addEventListener("durationchange", syncDuration);
  audioEl.addEventListener("timeupdate", syncProgress);
  audioEl.addEventListener("play", () => setPlayingState(true));
  audioEl.addEventListener("pause", () => setPlayingState(false));
  audioEl.addEventListener("ended", () => {
    setPlayingState(false);
    audioEl.currentTime = 0;
    seek.value = "0";
    currentSpan.textContent = "0:00";
  });
  audioEl.addEventListener("error", () => {
    setPlayingState(false);
    status.textContent = "Không thể tải tệp âm thanh.";
  });

  window.addEventListener("pagehide", () => {
    if (!audioEl.paused) audioEl.pause();
  });
}

