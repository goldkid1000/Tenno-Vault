/* Tenno Vault — auto-updater. Checks version.json for new releases.
   When an update is found, shows a brief "Updating..." toast, then
   automatically clears caches and reloads. No taps needed.
   Works on mobile PWA, PC installed app, and regular browser tabs. */
(function () {
  'use strict';

  var CHECK_INTERVAL = 15 * 60 * 1000; /* check every 15 minutes */
  var seenVersion = null;
  var updating = false;

  function check() {
    if (updating) return;
    fetch('version.json', { cache: 'no-store' })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (!seenVersion) {
          seenVersion = data.version;
          return;
        }
        if (data.version !== seenVersion) {
          seenVersion = data.version;
          autoUpdate(data);
        }
      })
      .catch(function () { /* offline — stay quiet */ });
  }

  function autoUpdate(data) {
    if (updating) return;
    updating = true;
    showToast('⬆️ Updating Tenno Vault to v' + data.version + '...');
    /* give it a moment so the user sees what's happening, then reload fresh */
    setTimeout(function () {
      if ('caches' in window) {
        caches.keys().then(function (names) {
          return Promise.all(names.map(function (n) { return caches.delete(n); }));
        }).then(hardReload);
      } else {
        hardReload();
      }
    }, 2500);
  }

  function showToast(msg) {
    var t = document.createElement('div');
    t.id = 'tv-update-toast';
    t.textContent = msg;
    document.body.appendChild(t);
    requestAnimationFrame(function () { t.classList.add('show'); });
  }

  function hardReload() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(function (regs) {
        return Promise.all(regs.map(function (r) { return r.unregister(); }));
      }).then(function () { window.location.reload(true); });
    } else {
      window.location.reload(true);
    }
  }

  /* init: check shortly after load, then periodically */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { setTimeout(check, 3000); });
  } else {
    setTimeout(check, 3000);
  }
  setInterval(check, CHECK_INTERVAL);

  /* also check when the app comes back to foreground (mobile) */
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible') check();
  });
})();
