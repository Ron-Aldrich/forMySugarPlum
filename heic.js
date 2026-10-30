/* HEIC / HEIF support.
   Phones (iPhone) save photos as .heic, but most browsers can't show them.
   This file converts them automatically in the browser, only when needed.
   You don't need to edit anything here. Just use the .heic file names in config.js. */
(function () {
  var ua = navigator.userAgent;
  // Safari on iPhone, iPad and Mac can show HEIC by itself
  var native = /iPhone|iPad|iPod/.test(ua) || (/^((?!chrome|android|crios|fxios|edg).)*safari/i.test(ua));
  if (native) return;

  var isHeic = function (v) { return typeof v === 'string' && /\.hei[cf]($|[?#])/i.test(v); };
  var desc = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'src');
  var BAD = 'data:text/plain,heic-failed';
  var cache = {}, queue = [], running = 0, MAX = 2, libPromise = null;

  function loadLib() {
    if (window.heic2any) return Promise.resolve();
    if (libPromise) return libPromise;
    libPromise = new Promise(function (res, rej) {
      var s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/heic2any@0.0.4/dist/heic2any.min.js';
      s.onload = res; s.onerror = rej;
      document.head.appendChild(s);
    });
    return libPromise;
  }

  function convert(url) {
    if (cache[url]) return cache[url];
    cache[url] = new Promise(function (resolve, reject) {
      queue.push({ url: url, resolve: resolve, reject: reject });
      pump();
    });
    return cache[url];
  }

  function pump() {
    while (running < MAX && queue.length) {
      (function (job) {
        running++;
        loadLib()
          .then(function () { return fetch(job.url); })
          .then(function (r) { if (!r.ok) throw new Error('missing'); return r.blob(); })
          .then(function (b) { return window.heic2any({ blob: b, toType: 'image/jpeg', quality: 0.82 }); })
          .then(function (out) { job.resolve(URL.createObjectURL(Array.isArray(out) ? out[0] : out)); })
          .catch(function (e) { job.reject(e); })
          .then(function () { running--; pump(); });
      })(queue.shift());
    }
  }

  Object.defineProperty(HTMLImageElement.prototype, 'src', {
    configurable: true,
    enumerable: true,
    get: function () { return desc.get.call(this); },
    set: function (v) {
      if (!isHeic(v)) return desc.set.call(this, v);
      var img = this;
      convert(v).then(
        function (blobUrl) { desc.set.call(img, blobUrl); },
        function () { desc.set.call(img, BAD); }   // triggers the normal "Add your photo" placeholder
      );
    }
  });
})();
