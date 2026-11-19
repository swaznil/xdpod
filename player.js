const tracks = [
  { title: 'test1', artist: 'From your library', src: 'assets/music/test1.mp3' },
  { title: 'test2', artist: 'From your library', src: 'assets/music/test2.mp3' }
];

const audio = document.querySelector('#audio');
const $ = (selector) => document.querySelector(selector);
const ui = {
  title: $('#screen-title'), view: $('#screen-view'), footer: $('#screen-footer-left'),
  footerRight: $('#screen-footer-right'), message: $('#message'), play: $('#play'), wheel: $('#clickwheel')
};
const queue = [...tracks];
let current = -1, page = 'home', selected = 0;
const fmt = (value) => Number.isFinite(value)
  ? `${Math.floor(value / 60)}:${String(Math.floor(value % 60)).padStart(2, '0')}` : '0:00';


function setPage(next) { page = next; selected = Math.min(selected, Math.max(0, rowCount() - 1)); render(); }

function rowCount() { return page === 'home' ? (current < 0 ? 1 : 2) : page === 'songs' ? queue.length : 0; }

function makeRow(label, icon, index, action) {
  const row = document.createElement('li'); row.className = `menu-row${index === selected ? ' selected' : ''}`;
  const left = document.createElement('span'); left.className = 'row-left';
  const glyph = document.createElement('span'); glyph.className = 'row-icon'; glyph.textContent = icon;
  const text = document.createElement('span'); text.className = 'row-label'; text.textContent = label;
  left.append(glyph, text); row.append(left);
  const arrow = document.createElement('span'); arrow.className = 'row-arrow'; arrow.textContent = '›'; row.append(arrow);
  row.addEventListener('click', action); return row;
}

function homeItems() {
  const items = []; if (current >= 0) items.push(['Now Playing', '♫', () => setPage('playing')]);
  items.push(['Songs', '♪', () => { selected = 0; setPage('songs'); }]); return items;
}

function renderHome() {
  homeItems().forEach(([label, icon, action], i) => ui.view.append(makeRow(label, icon, i, action)));
  ui.title.textContent = 'Music'; ui.footer.textContent = `${queue.length} ${queue.length === 1 ? 'song' : 'songs'}`; ui.footerRight.textContent = '♪';
}

function renderSongs() {
  ui.title.textContent = 'Songs'; ui.footer.textContent = queue.length ? `${Math.min(selected + 1, queue.length)} of ${queue.length}` : 'No songs';
  ui.footerRight.textContent = '♪'; const list = document.createElement('ul'); list.className = 'menu-list';
  queue.forEach((track, i) => { const row = makeRow(track.title, i === current ? '♫' : '♪', i, () => load(i)); row.classList.add('track-row'); list.append(row); });
  ui.view.append(list);
}

function renderPlaying() {
  const track = queue[current]; if (!track) { setPage('home'); return; }
  ui.title.textContent = 'Now Playing'; ui.footer.textContent = audio.paused ? 'Paused' : 'Playing'; ui.footerRight.textContent = '♫';
  const container = document.createElement('div'); container.className = 'now-playing';
  const main = document.createElement('div'); main.className = 'np-main';
  const art = document.createElement('div'); art.className = 'np-art'; art.textContent = '♪';
  const copy = document.createElement('div'); copy.className = 'np-copy';
  const title = document.createElement('div'); title.className = 'np-title'; title.textContent = track.title;
  const artist = document.createElement('div'); artist.className = 'np-artist'; artist.textContent = track.artist;
  const album = document.createElement('div'); album.className = 'np-album'; album.textContent = `Track ${current + 1} of ${queue.length}`;
  copy.append(title, artist, album); main.append(art, copy);
  const progress = document.createElement('div'); progress.className = 'np-progress';
  const seek = document.createElement('input'); seek.className = 'np-seek'; seek.type = 'range'; seek.min = '0';
  seek.max = String(Number.isFinite(audio.duration) ? audio.duration : 0); seek.step = '0.1'; seek.value = String(audio.currentTime || 0);
  const times = document.createElement('div'); times.className = 'np-times';
  const elapsed = document.createElement('span'); elapsed.textContent = fmt(audio.currentTime);
  const duration = document.createElement('span'); duration.textContent = fmt(audio.duration);
  times.append(elapsed, duration); progress.append(seek, times); container.append(main, progress);
  seek.addEventListener('input', () => { if (Number.isFinite(audio.duration)) audio.currentTime = Number(seek.value); elapsed.textContent = fmt(Number(seek.value)); });
  ui.view.append(container);
}

function updateNowPlayingProgress() {
  const seek = ui.view.querySelector('.np-seek'); if (!seek) return;
  if (Number.isFinite(audio.duration)) seek.max = String(audio.duration);
  if (document.activeElement !== seek) seek.value = String(audio.currentTime || 0);
  const [elapsed, duration] = ui.view.querySelector('.np-times').children;
  elapsed.textContent = fmt(audio.currentTime); duration.textContent = fmt(audio.duration);
}

function render() { ui.view.replaceChildren(); if (page === 'songs') renderSongs(); else if (page === 'playing') renderPlaying(); else renderHome(); }

function load(index, autoplay = true) {
  if (index < 0 || index >= queue.length) return;
  current = index; selected = index; audio.src = queue[index].src; audio.load(); ui.message.textContent = ''; setPage('playing');
  if (autoplay) audio.play().catch(() => { ui.message.textContent = 'Press the center button to start playback.'; render(); });
}

function moveSelection(direction) { const count = rowCount(); if (!count) return; selected = (selected + direction + count) % count; render(); }

function activate() { if (page === 'home') homeItems()[selected]?.[2](); else if (page === 'songs') { if (queue.length) load(selected); } else if (current >= 0) togglePlayback(); }

function togglePlayback() {
  if (current < 0) { if (queue.length) load(0); }
  else if (audio.paused) audio.play().catch(() => { ui.message.textContent = 'This track could not be played.'; });
  else audio.pause();
}

function skip(direction) { if (!queue.length) return; if (page === 'songs' || page === 'home') moveSelection(direction); else load((current + direction + queue.length) % queue.length); }
$('#menu').addEventListener('click', () => setPage(page === 'playing' ? 'songs' : 'home'));
$('#select').addEventListener('click', activate); $('#previous').addEventListener('click', () => skip(-1)); $('#next').addEventListener('click', () => skip(1));
ui.play.addEventListener('click', togglePlayback);
audio.addEventListener('play', () => { ui.wheel.classList.add('playing'); if (page === 'playing') render(); });
audio.addEventListener('pause', () => { ui.wheel.classList.remove('playing'); if (page === 'playing') render(); });
audio.addEventListener('timeupdate', updateNowPlayingProgress); audio.addEventListener('loadedmetadata', updateNowPlayingProgress);
audio.addEventListener('ended', () => { if (queue.length) load((current + 1) % queue.length); });
render();
