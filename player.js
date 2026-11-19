const tracks = [
  { title: 'test1', artist: 'From your library', src: 'assets/music/test1.mp3' },
  { title: 'test2', artist: 'From your library', src: 'assets/music/test2.mp3' }
];

const $ = (selector) => document.querySelector(selector);
const ui = {
  title: $('#screen-title'),
  view: $('#screen-view'),
  footer: $('#screen-footer-left'),
  footerRight: $('#screen-footer-right')
};
let page = 'home';
let selected = 0;

function makeRow(label, index, action) {
  const row = document.createElement('li');
  row.className = `menu-row${index === selected ? ' selected' : ''}`;
  row.textContent = label;
  row.addEventListener('click', action);
  return row;
}

function renderHome() {
  ui.title.textContent = 'Music';
  ui.footer.textContent = `${tracks.length} songs`;
  ui.footerRight.textContent = '♪';
  const list = document.createElement('ul');
  list.className = 'menu-list';
  list.append(makeRow('Songs', 0, () => setPage('songs')));
  ui.view.append(list);
}

function renderSongs() {
  ui.title.textContent = 'Songs';
  ui.footer.textContent = `${selected + 1} of ${tracks.length}`;
  ui.footerRight.textContent = '♪';
  const list = document.createElement('ul');
  list.className = 'menu-list';
  tracks.forEach((track, index) => {
    list.append(makeRow(track.title, index, () => {
      selected = index;
      render();
    }));
  });
  ui.view.append(list);
}

function render() {
  ui.view.replaceChildren();
  if (page === 'songs') renderSongs();
  else renderHome();
}

function setPage(next) {
  page = next;
  selected = 0;
  render();
}

function moveSelection(direction) {
  const count = page === 'home' ? 1 : tracks.length;
  selected = (selected + direction + count) % count;
  render();
}

function activate() {
  if (page === 'home') setPage('songs');
  else ui.footer.textContent = `Selected ${selected + 1}`;
}

$('#menu').addEventListener('click', () => setPage('home'));
$('#select').addEventListener('click', activate);
$('#previous').addEventListener('click', () => moveSelection(-1));
$('#next').addEventListener('click', () => moveSelection(1));
render();
