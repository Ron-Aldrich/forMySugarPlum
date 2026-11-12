(function () {
  var SRC = 'music/m.mp3';   // put your song here
  var K_ON = 'updMusicOn', K_T = 'updMusicTime';
  var ss = {
    get: function (k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { sessionStorage.setItem(k, v); } catch (e) {} }
  };

  var audio = new Audio(SRC);
  audio.loop = true;
  audio.preload = 'auto';
  audio.volume = 0.7;

  var btn = document.getElementById('uMusic');
  var wanted = ss.get(K_ON) !== '0';   // on by default, off only if she muted it
  var paint = function () { if (btn) btn.classList.toggle('off', audio.paused); };

  // continue from where the song was on the previous page
  var t = parseFloat(ss.get(K_T) || '0');
  if (t > 0) audio.addEventListener('loadedmetadata', function () {
    try { audio.currentTime = t % audio.duration; } catch (e) {}
  }, { once: true });

  function tryPlay() {
    if (!wanted) return;
    var p = audio.play();
    if (p && p.then) p.then(paint).catch(function () {
      // blocked by the browser: start on the first tap or key press
      var evs = ['pointerdown', 'touchend', 'keydown'];
      var unlock = function () {
        evs.forEach(function (ev) { document.removeEventListener(ev, unlock, true); });
        if (wanted) audio.play().then(paint).catch(function () {});
      };
      evs.forEach(function (ev) { document.addEventListener(ev, unlock, true); });
    });
  }

  if (btn) btn.onclick = function () {
    if (audio.paused) { wanted = true; ss.set(K_ON, '1'); audio.play().then(paint).catch(function () {}); }
    else { wanted = false; ss.set(K_ON, '0'); audio.pause(); paint(); }
  };

  var save = function () { ss.set(K_T, String(audio.currentTime || 0)); };
  audio.addEventListener('timeupdate', save);
  window.addEventListener('pagehide', save);
  audio.addEventListener('play', paint);
  audio.addEventListener('pause', paint);

  paint();
  tryPlay();
})();