const $ = id => document.getElementById(id);
const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; return e; };

document.title = SITE.title;
$('title').textContent = SITE.title;
$('subtitle').textContent = SITE.subtitle;
$('videosTitle').textContent = SITE.videosTitle;
$('ending').textContent = SITE.ending;

SITE.memories.forEach(m => {
  const wrap = el('article', 'memory');
  const frame = el('div', 'frame');
  const list = m.photos || (m.photo ? [m.photo] : []);
  const track = el('div', 'track');
  list.forEach((src, k) => {
    const slide = el('div', 'slide');
    const img = new Image();
    img.alt = (m.title || 'A memory of us') + (list.length > 1 ? ' (' + (k + 1) + ' of ' + list.length + ')' : '');
    img.loading = 'lazy';
    img.draggable = false;
    img.onerror = () => { slide.innerHTML = ''; slide.appendChild(el('div', 'empty', 'Add your photo: ' + src)); };
    img.src = src;
    slide.appendChild(img);
    slide.onclick = () => {
      if (!slide.querySelector('img')) return;
      shown = list.map(src => ({ src: src, caption: m.title || '' }));
      openLb(k);
    };
    track.appendChild(slide);
  });
  frame.appendChild(track);

  if (list.length > 1) {
    const dots = el('div', 'dots');
    list.forEach((_, k) => dots.appendChild(el('i', k === 0 ? 'on' : '')));
    const hint = el('button', 'swipe', '\u203A');
    hint.type = 'button';
    hint.setAttribute('aria-label', 'Swipe to see more');
    const go = d => track.scrollBy({ left: d * track.clientWidth, behavior: 'smooth' });
    hint.onclick = () => go(1);
    const prev = el('button', 'arrow l', '\u2039'), next = el('button', 'arrow r', '\u203A');
    prev.type = next.type = 'button';
    prev.setAttribute('aria-label', 'Previous picture');
    next.setAttribute('aria-label', 'Next picture');
    prev.onclick = () => go(-1);
    next.onclick = () => go(1);
    track.addEventListener('scroll', () => {
      const idx = Math.round(track.scrollLeft / track.clientWidth);
      [...dots.children].forEach((d, k) => d.classList.toggle('on', k === idx));
      if (track.scrollLeft > 10) hint.classList.add('hide');
    }, { passive: true });
    frame.append(dots, hint, prev, next);
  }

  const note = el('div', 'note');
  if (m.date) note.appendChild(el('div', 'date', m.date));
  if (m.title) note.appendChild(el('h2', '', m.title));
  note.appendChild(el('p', '', m.message || ''));

  wrap.append(frame, note);
  $('memories').appendChild(wrap);
});

/* Photo wall + zoom */
const gal = (SITE.gallery || []).map(g => typeof g === 'string' ? { src: g, caption: '' } : g);
if (!gal.length) $('gallerySection').style.display = 'none';
$('galleryTitle').textContent = SITE.galleryTitle || '';
$('gallerySub').textContent = SITE.gallerySub || '';
const lb = $('lightbox'), lbImg = $('lbImg'), lbCap = $('lbCap');
let cur = 0, shown = [];
gal.forEach((g, i) => {
  const b = el('button', 'gitem');
  b.type = 'button';
  const im = new Image();
  im.alt = g.caption || 'A memory of us';
  im.loading = 'lazy';
  im.onerror = () => { b.className = 'gitem empty'; b.disabled = true; b.textContent = 'Add: ' + g.src; };
  im.src = g.src;
  b.appendChild(im);
  b.onclick = () => { shown = gal; openLb(i); };
  $('gallery').appendChild(b);
});
function openLb(i) {
  cur = (i + shown.length) % shown.length;
  const many = shown.length > 1;
  $('lbPrev').style.display = $('lbNext').style.display = many ? '' : 'none';
  lbImg.style.animation = 'none'; void lbImg.offsetWidth; lbImg.style.animation = '';
  lbImg.src = shown[cur].src;
  lbImg.alt = shown[cur].caption || 'A memory of us';
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

if (!SITE.videos.length) $('videosSection').style.display = 'none';
SITE.videos.forEach(v => {
  const item = el('div', 'vitem');
  const video = document.createElement('video');
  video.controls = true; video.playsInline = true; video.preload = 'metadata';
  video.src = v.src;
  video.onerror = () => video.replaceWith(el('div', 'empty', 'Add your video: ' + v.src));
  item.appendChild(video);
  if (v.caption) item.appendChild(el('p', '', v.caption));
  $('videos').appendChild(item);
});

/* Letter */
$('letterTitle').textContent = SITE.letterTitle;
SITE.letter.trim().split(/\n\s*\n/).forEach(t => $('letterBody').appendChild(el('p', '', t.trim())));
$('letterSign').textContent = SITE.letterSign ? '\u2014 ' + SITE.letterSign : '';

/* Intro + music: browsers only allow sound after a tap, so the first tap starts the song */
$('introTitle').textContent = SITE.title;
$('introNote').textContent = SITE.introNote;
$('begin').textContent = SITE.introButton;
const bgm = $('bgm'), btn = $('musicBtn'), intro = $('intro');
document.body.style.overflow = 'hidden';
let playing = false;
function setMusic(on) {
  playing = on;
  on ? bgm.play().catch(() => { playing = false; btn.classList.add('off'); }) : bgm.pause();
  btn.classList.toggle('off', !on);
}
bgm.onerror = () => btn.classList.remove('show');
if (SITE.music) { bgm.src = SITE.music; bgm.volume = 0.6; }
$('begin').onclick = () => {
  intro.classList.add('gone');
  document.body.style.overflow = '';
  if (SITE.music) { btn.classList.add('show'); setMusic(true); }
};
btn.onclick = () => setMusic(!playing);

const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .15 });
document.querySelectorAll('.memory').forEach(m => io.observe(m));