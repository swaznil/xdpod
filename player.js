const tracks = [
  { title: "Din", artist: "From your library", src: "assets/music/Din.mp3" },
  {
    title: "Maryo Ni Maryo Ni",
    artist: "From your library",
    src: "assets/music/Maryo Ni Maryo Ni.mp3",
  },
];
const audio = document.querySelector("#audio");
const $ = (selector) => document.querySelector(selector);
const ui = {
  title: $("#screen-title"),
  view: $("#screen-view"),
  footer: $("#screen-footer-left"),
  footerRight: $("#screen-footer-right"),
  message: $("#message"),
  filePicker: $("#file-picker"),
  play: $("#play"),
  volume: $("#volume"),
  wheel: $("#clickwheel"),
  volumeUp: $("#volume-up"),
  volumeDown: $("#volume-down"),
};
const queue = [...tracks];
let current = -1;
let page = "home";
let selected = 0;
let wheelAngle = null;
let wheelRemainder = 0;
const fmt = (value) =>
  Number.isFinite(value)
    ? `${Math.floor(value / 60)}:${String(Math.floor(value % 60)).padStart(2, "0")}`
    : "0:00";
const clock = document.querySelector("#device-time");

function updateClock() {
  const now = new Date();
  clock.dateTime = now.toISOString();
  clock.textContent = now.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

function setPage(next) {
  page = next;
  selected = Math.min(selected, Math.max(0, rowCount() - 1));
  render();
}

function rowCount() {
  return page === "home"
    ? current < 0
      ? 2
      : 3
    : page === "songs"
      ? queue.length
      : 0;
}

function makeRow(label, icon, index, action, arrow = true) {
  const row = document.createElement("li");
  row.className = `menu-row${index === selected ? " selected" : ""}`;
  const left = document.createElement("span");
  left.className = "row-left";
  const glyph = document.createElement("span");
  glyph.className = "row-icon";
  glyph.textContent = icon;
  const text = document.createElement("span");
  text.className = "row-label";
  text.textContent = label;
  left.append(glyph, text);
  row.append(left);
  if (arrow) {
    const chevron = document.createElement("span");
    chevron.className = "row-arrow";
    chevron.textContent = "›";
    row.append(chevron);
  }
  row.addEventListener("click", action);
  return row;
}

function homeItems() {
  const items = [];
  if (current >= 0) items.push(["Now Playing", "♫", () => setPage("playing")]);
  items.push([
    "Songs",
    "♪",
    () => {
      selected = 0;
      setPage("songs");
    },
  ]);
  items.push(["Add Music", "＋", () => ui.filePicker.click()]);
  return items;
}

function renderHome() {
  const items = homeItems();
  items.forEach(([label, icon, action], i) =>
    ui.view.append(makeRow(label, icon, i, action)),
  );
  ui.title.textContent = "Music";
  ui.footer.textContent = `${queue.length} ${queue.length === 1 ? "song" : "songs"}`;
  ui.footerRight.textContent = "♪";
}

function renderSongs() {
  ui.title.textContent = "Songs";
  ui.footer.textContent = queue.length
    ? `${Math.min(selected + 1, queue.length)} of ${queue.length}`
    : "No songs";
  ui.footerRight.textContent = queue.length ? "♪" : "＋";
  if (!queue.length) {
    const empty = document.createElement("div");
    empty.className = "empty-screen";
    empty.textContent =
      "Your music library is empty. Add songs to get started.";
    ui.view.append(empty);
    return;
  }
  const list = document.createElement("ul");
  list.className = "menu-list";
  queue.forEach((track, i) => {
    const row = makeRow(track.title, i === current ? "♫" : "♪", i, () =>
      load(i),
    );
    row.classList.add("track-row");
    list.append(row);
  });
  ui.view.append(list);
  const active = list.children[selected];
  if (active && active.offsetTop + active.offsetHeight > ui.view.clientHeight)
    active.scrollIntoView({ block: "nearest" });
}

function renderPlaying() {
  const track = queue[current];
  if (!track) {
    setPage("home");
    return;
  }
  ui.title.textContent = "Now Playing";
  ui.footer.textContent = audio.paused ? "Paused" : "Playing";
  ui.footerRight.textContent = "♫";
  const container = document.createElement("div");
  container.className = "now-playing";
  const main = document.createElement("div");
  main.className = "np-main";
  const art = document.createElement("div");
  art.className = "np-art";
  art.textContent = "♪";
  const copy = document.createElement("div");
  copy.className = "np-copy";
  const title = document.createElement("div");
  title.className = "np-title";
  title.textContent = track.title;
  const artist = document.createElement("div");
  artist.className = "np-artist";
  artist.textContent = track.artist;
  const album = document.createElement("div");
  album.className = "np-album";
  album.textContent = `Track ${current + 1} of ${queue.length}`;
  copy.append(title, artist, album);
  main.append(art, copy);
  const progress = document.createElement("div");
  progress.className = "np-progress";
  const seek = document.createElement("input");
  seek.className = "np-seek";
  seek.type = "range";
  seek.min = "0";
  seek.max = String(Number.isFinite(audio.duration) ? audio.duration : 0);
  seek.step = "0.1";
  seek.value = String(audio.currentTime || 0);
  const times = document.createElement("div");
  times.className = "np-times";
  const elapsed = document.createElement("span");
  elapsed.textContent = fmt(audio.currentTime);
  const duration = document.createElement("span");
  duration.textContent = fmt(audio.duration);
  times.append(elapsed, duration);
  progress.append(seek, times);
  container.append(main, progress);
  seek.addEventListener("input", () => {
    if (Number.isFinite(audio.duration)) audio.currentTime = Number(seek.value);
    elapsed.textContent = fmt(Number(seek.value));
  });
  ui.view.append(container);
}

function updateNowPlayingProgress() {
  const seek = ui.view.querySelector(".np-seek");
  if (!seek) return;
  if (Number.isFinite(audio.duration)) seek.max = String(audio.duration);
  if (document.activeElement !== seek)
    seek.value = String(audio.currentTime || 0);
  const [elapsed, duration] = ui.view.querySelector(".np-times").children;
  elapsed.textContent = fmt(audio.currentTime);
  duration.textContent = fmt(audio.duration);
}

function render() {
  ui.view.replaceChildren();
  if (page === "songs") renderSongs();
  else if (page === "playing") renderPlaying();
  else renderHome();
}

function load(index, autoplay = true) {
  if (index < 0 || index >= queue.length) return;
  current = index;
  selected = index;
  audio.src = queue[index].src;
  audio.load();
  ui.message.textContent = "";
  setPage("playing");
  if (autoplay)
    audio.play().catch(() => {
      ui.message.textContent = "Press the center button to start playback.";
      render();
    });
}

function moveSelection(direction) {
  const count = rowCount();
  if (!count) return;
  selected = (selected + direction + count) % count;
  render();
}

function activate() {
  if (page === "home") {
    homeItems()[selected]?.[2]();
  } else if (page === "songs") {
    if (queue.length) load(selected);
    else ui.filePicker.click();
  } else if (current >= 0) {
    togglePlayback();
  }
}

function togglePlayback() {
  if (current < 0) {
    if (queue.length) load(0);
    else ui.filePicker.click();
  } else if (audio.paused) {
    audio.play().catch(() => {
      ui.message.textContent = "This track could not be played.";
    });
  } else audio.pause();
}

function skip(direction) {
  if (!queue.length) return;
  if (page === "songs" || page === "home") moveSelection(direction);
  else load((current + direction + queue.length) % queue.length);
}
$("#menu").addEventListener("click", () => {
  if (page !== "home") setPage(page === "playing" ? "songs" : "home");
  else setPage("home");
});
$("#select").addEventListener("click", activate);
$("#previous").addEventListener("click", () => skip(-1));
$("#next").addEventListener("click", () => skip(1));
ui.play.addEventListener("click", togglePlayback);
function changeVolume(delta) {
  const value = Math.max(0, Math.min(1, Number(ui.volume.value) + delta));
  ui.volume.value = String(value);
  audio.volume = value;
}
ui.volumeUp.addEventListener("click", () => changeVolume(0.05));
ui.volumeDown.addEventListener("click", () => changeVolume(-0.05));
ui.filePicker.addEventListener("change", (event) => {
  const files = [...event.target.files].filter((file) =>
    file.type.startsWith("audio/"),
  );
  if (!files.length) {
    if (event.target.files.length)
      ui.message.textContent = "Choose audio files such as MP3, WAV, or M4A.";
    return;
  }
  const start = queue.length;
  for (const file of files) {
    const raw = file.name
      .replace(/\.[^.]+$/, "")
      .replace(/[_]+/g, " ")
      .trim();
    const parts = raw.split(/\s+[—–-]\s+/);
    const hasArtist = parts.length > 1;
    queue.push({
      title: hasArtist ? parts.slice(1).join(" — ") : raw || "Untitled",
      artist: hasArtist ? parts[0] : "From your device",
      src: URL.createObjectURL(file),
    });
  }
  selected = start;
  if (current < 0) load(start);
  else {
    setPage("songs");
    ui.message.textContent = `${files.length} ${files.length === 1 ? "song" : "songs"} added.`;
  }
  event.target.value = "";
});
audio.addEventListener("play", () => {
  ui.wheel.classList.add("playing");
  if (page === "playing") render();
});
audio.addEventListener("pause", () => {
  ui.wheel.classList.remove("playing");
  if (page === "playing") render();
});
audio.addEventListener("timeupdate", updateNowPlayingProgress);
audio.addEventListener("loadedmetadata", updateNowPlayingProgress);
audio.addEventListener("ended", () => {
  if (queue.length) load((current + 1) % queue.length);
});
audio.addEventListener("error", () => {
  if (current >= 0)
    ui.message.textContent = "This file could not be played by your browser.";
});
ui.volume.addEventListener("input", (event) => {
  audio.volume = Number(event.target.value);
});
audio.volume = Number(ui.volume.value);

ui.wheel.addEventListener(
  "wheel",
  (event) => {
    event.preventDefault();
    moveSelection(event.deltaY > 0 ? 1 : -1);
  },
  { passive: false },
);
ui.wheel.addEventListener("pointerdown", (event) => {
  if (event.target.closest("button")) return;
  const rect = ui.wheel.getBoundingClientRect();
  wheelAngle = Math.atan2(
    event.clientY - (rect.top + rect.height / 2),
    event.clientX - (rect.left + rect.width / 2),
  );
  wheelRemainder = 0;
  ui.wheel.setPointerCapture(event.pointerId);
});
ui.wheel.addEventListener("pointermove", (event) => {
  if (wheelAngle === null) return;
  const rect = ui.wheel.getBoundingClientRect();
  const angle = Math.atan2(
    event.clientY - (rect.top + rect.height / 2),
    event.clientX - (rect.left + rect.width / 2),
  );
  let delta = angle - wheelAngle;
  if (delta > Math.PI) delta -= Math.PI * 2;
  if (delta < -Math.PI) delta += Math.PI * 2;
  wheelAngle = angle;
  wheelRemainder += delta;
  while (Math.abs(wheelRemainder) > 0.42) {
    const direction = wheelRemainder > 0 ? 1 : -1;
    moveSelection(direction);
    wheelRemainder -= direction * 0.42;
  }
});
const endWheel = () => {
  wheelAngle = null;
  wheelRemainder = 0;
};
ui.wheel.addEventListener("pointerup", endWheel);
ui.wheel.addEventListener("pointercancel", endWheel);
document.addEventListener("keydown", (event) => {
  const activeTag = document.activeElement?.tagName;
  if (
    ["INPUT", "TEXTAREA", "SELECT"].includes(activeTag) ||
    document.activeElement?.isContentEditable ||
    event.altKey ||
    event.ctrlKey ||
    event.metaKey
  )
    return;

  if (
    page === "playing" &&
    Number.isFinite(audio.duration) &&
    (event.key === "ArrowUp" || event.key === "ArrowDown")
  ) {
    event.preventDefault();
    audio.currentTime = Math.max(
      0,
      Math.min(
        audio.duration,
        audio.currentTime + (event.key === "ArrowUp" ? 5 : -5),
      ),
    );
    updateNowPlayingProgress();
    return;
  }

  if (event.key === "ArrowDown") {
    event.preventDefault();
    moveSelection(1);
  } else if (event.key === "ArrowUp") {
    event.preventDefault();
    moveSelection(-1);
  } else if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    activate();
  } else if (event.key === "Escape" || event.key === "Backspace") {
    event.preventDefault();
    setPage(page === "home" ? "home" : page === "playing" ? "songs" : "home");
  } else if (event.key === "ArrowRight") {
    event.preventDefault();
    skip(1);
  } else if (event.key === "ArrowLeft") {
    event.preventDefault();
    skip(-1);
  }
});

render();
updateClock();
setInterval(updateClock, 30_000);
