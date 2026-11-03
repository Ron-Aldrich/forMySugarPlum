const $ = id => document.getElementById(id);
const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; return e; };
const pad = n => String(n).padStart(2, '0');

const now = new Date();
const todayKey = now.getFullYear() + '-' + pad(now.getMonth() + 1) + '-' + pad(now.getDate());

const visible = UPDATES.entries.filter(e => e.date <= todayKey).sort((a, b) => a.date < b.date ? -1 : 1);
const want = new URLSearchParams(location.search).get('d');
const i = visible.findIndex(e => e.date === want);

if (i < 0) {
  $('dDate').textContent = 'Nothing here yet';
  $('dMsg').textContent = 'Come back soon.';
  $('dOlder').style.display = $('dNewer').style.display = 'none';
} else {
  const e = visible[i];
  const [y, m, d] = e.date.split('-').map(Number);
  $('dDate').textContent = new Date(y, m - 1, d).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  document.title = $('dDate').textContent;

  const short = new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  (e.photos || (e.photo ? [e.photo] : [])).forEach(src => {
    const f = el('figure', 'polaroid');
    const win = el('div', 'p-win');
    const img = new Image();
    img.alt = 'Picture from ' + e.date;
    img.onerror = () => { win.innerHTML = ''; win.appendChild(el('div', 'empty', 'Add your photo: ' + src)); };
    img.src = src;
    win.appendChild(img);
    f.append(el('span', 'tape'), win, el('figcaption', '', short + ' \u2661'));
    $('dPhotos').appendChild(f);
  });

  $('dMsg').textContent = e.message || '';

  const older = visible[i - 1], newer = visible[i + 1];
  if (older) { $('dOlder').href = 'day.html?d=' + older.date; $('dOlder').textContent = '\u2039 Yesterday\u2019s note'; } else $('dOlder').style.visibility = 'hidden';
  if (newer) { $('dNewer').href = 'day.html?d=' + newer.date; $('dNewer').textContent = 'Next note \u203A'; } else $('dNewer').style.visibility = 'hidden';
}