const $ = id => document.getElementById(id);
const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; return e; };
const pad = n => String(n).padStart(2, '0');
const key = (y, m, d) => y + '-' + pad(m + 1) + '-' + pad(d);

const now = new Date();
const todayKey = key(now.getFullYear(), now.getMonth(), now.getDate());

const map = {};
UPDATES.entries.forEach(e => { if (e.date <= todayKey) map[e.date] = e; });
const dates = Object.keys(map).sort();

$('uTitle').textContent = UPDATES.title;
$('uSub').textContent = UPDATES.subtitle;

['S', 'M', 'T', 'W', 'T', 'F', 'S'].forEach(d => $('calDow').appendChild(el('span', '', d)));

const ym = s => { const p = s.split('-'); return +p[0] * 12 + (+p[1] - 1); };
const minYM = dates.length ? ym(dates[0]) : ym(todayKey);
const maxYM = ym(todayKey);
let cur = dates.length ? ym(dates[dates.length - 1]) : maxYM;

function render() {
  const y = Math.floor(cur / 12), m = cur % 12;
  $('calMonth').textContent = new Date(y, m, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  $('calPrev').disabled = cur <= minYM;
  $('calNext').disabled = cur >= maxYM;

  const box = $('calDays');
  box.innerHTML = '';
  const first = new Date(y, m, 1).getDay();
  const total = new Date(y, m + 1, 0).getDate();
  for (let i = 0; i < first; i++) box.appendChild(el('span', 'day blank'));
  for (let d = 1; d <= total; d++) {
    const k = key(y, m, d);
    let c;
    if (map[k]) {
      c = el('a', 'day has', d);
      c.href = 'day.html?d=' + k;
      c.setAttribute('aria-label', 'Open note for ' + k);
    } else {
      c = el('span', 'day', d);
    }
    if (k === todayKey) c.classList.add('today');
    box.appendChild(c);
  }
}
$('calPrev').onclick = () => { cur--; render(); };
$('calNext').onclick = () => { cur++; render(); };
render();

const latest = $('latest');
if (dates.length) {
  latest.href = 'day.html?d=' + dates[dates.length - 1];
  latest.textContent = 'Read the latest note \u203A';
} else {
  latest.style.display = 'none';
}
