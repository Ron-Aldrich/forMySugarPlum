const $ = id => document.getElementById(id);
const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; return e; };
const pad = n => String(n).padStart(2, '0');

const now = new Date();
const todayKey = now.getFullYear() + '-' + pad(now.getMonth() + 1) + '-' + pad(now.getDate());

const visible = UPDATES.entries.filter(e => e.date <= todayKey).sort((a, b) => a.date < b.date ? -1 : 1);
const want = new URLSearchParams(location.search).get('d');
const i = visible.findIndex(e => e.date === want);

/* Zoom viewer */
const lb = $('lightbox'), lbImg = $('lbImg'), lbCap = $('lbCap');
let cur = 0, shown = [];
function openLb(n) {
  cur = (n + shown.length) % shown.length;
  const many = shown.length > 1;
  $('lbPrev').style.display = $('lbNext').style.display = many ? '' : 'none';
  lbImg.style.animation = 'none'; void lbImg.offsetWidth; lbImg.style.animation = '';
  lbImg.src = shown[cur].src;
  lbImg.alt = shown[cur].caption || 'A picture from us';
  lbCap.textContent = shown[cur].caption || '';
  lb.classList.add('open');
  lb.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}
function closeLb() {
  lb.classList.remove('open');
  lb.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}
$('lbClose').onclick = closeLb;
$('lbPrev').onclick = () => openLb(cur - 1);
$('lbNext').onclick = () => openLb(cur + 1);
lb.onclick = e => { if (e.target === lb) closeLb(); };
document.addEventListener('keydown', e => {
  if (!lb.classList.contains('open')) return;
  if (e.key === 'Escape') closeLb();
  if (e.key === 'ArrowLeft') openLb(cur - 1);
  if (e.key === 'ArrowRight') openLb(cur + 1);
});
let tx = 0;
lb.addEventListener('touchstart', e => { tx = e.changedTouches[0].clientX; }, { passive: true });
lb.addEventListener('touchend', e => {
  const dx = e.changedTouches[0].clientX - tx;
  if (Math.abs(dx) > 50) openLb(cur + (dx < 0 ? 1 : -1));
}, { passive: true });

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

  /* Photos: one polaroid, swipe sideways to see the others */
  const raw = e.photos || (e.photo ? [e.photo] : []);
  const items = raw.map(p => typeof p === 'string' ? { src: p, caption: '' } : p);
  shown = items.map(it => ({ src: it.src, caption: it.caption || '' }));
  const capText = k => items[k].caption || short + ' \u2661';
  const box = $('dPhotos');
  box.className = 'p-stack';

  if (items.length) {
    const f = el('figure', 'polaroid');
    const win = el('div', 'p-win');
    const track = el('div', 'p-track');

    items.forEach((it, k) => {
      const slide = el('div', 'p-slide');
      const img = new Image();
      img.alt = 'Picture ' + (k + 1) + ' from ' + e.date;
      img.draggable = false;
      img.onload = () => { const r = img.naturalWidth / img.naturalHeight; if (r < 0.62 || r > 1.12) img.classList.add('fit'); };
      img.onerror = () => { slide.innerHTML = ''; slide.appendChild(el('div', 'empty', 'Add your photo: ' + it.src)); };
      img.src = it.src;
      slide.appendChild(img);
      slide.onclick = () => { if (slide.querySelector('img')) openLb(k); };
      track.appendChild(slide);
    });
    win.appendChild(track);

    const cap = el('figcaption', '', capText(0));
    let dots = null;

    if (items.length > 1) {
      dots = el('div', 'p-dots');
      items.forEach((_, k) => dots.appendChild(el('i', k === 0 ? 'on' : '')));
      const go = dir => track.scrollBy({ left: dir * track.clientWidth, behavior: 'smooth' });
      const hint = el('button', 'p-hint', '\u203A');
      hint.type = 'button';
      hint.setAttribute('aria-label', 'Swipe to see more');
      hint.onclick = () => go(1);
      const prev = el('button', 'p-arrow l', '\u2039'), next = el('button', 'p-arrow r', '\u203A');
      prev.type = next.type = 'button';
      prev.setAttribute('aria-label', 'Previous picture');
      next.setAttribute('aria-label', 'Next picture');
      prev.onclick = () => go(-1);
      next.onclick = () => go(1);
      track.addEventListener('scroll', () => {
        const idx = Math.min(items.length - 1, Math.max(0, Math.round(track.scrollLeft / track.clientWidth)));
        [...dots.children].forEach((d, k) => d.classList.toggle('on', k === idx));
        cap.textContent = capText(idx);
        if (track.scrollLeft > 10) hint.classList.add('hide');
      }, { passive: true });
      win.append(hint, prev, next);
    }

    f.style.setProperty('--r', '-1.5deg');
    f.append(el('span', 'tape'), win);
    if (dots) f.appendChild(dots);
    f.appendChild(cap);
    box.appendChild(f);

    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } }), { threshold: .15 });
      io.observe(f);
    } else f.classList.add('in');
  }

  $('dMsg').textContent = e.message || '';

  const older = visible[i - 1], newer = visible[i + 1];
  if (older) { $('dOlder').href = 'day.html?d=' + older.date; $('dOlder').textContent = '\u2039 Yesterday\u2019s note'; } else $('dOlder').style.visibility = 'hidden';
  if (newer) { $('dNewer').href = 'day.html?d=' + newer.date; $('dNewer').textContent = 'Next note \u203A'; } else $('dNewer').style.visibility = 'hidden';
}