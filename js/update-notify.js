/* Tenno Vault — update notifier. Checks version.json for new releases,
   shows a popup banner when an update is available. Works on mobile PWA,
   PC installed app, and regular browser tabs. */
(function () {
  'use strict';

  var CHECK_INTERVAL = 15 * 60 * 1000; /* check every 15 minutes */
  var seenVersion = null;

  function check() {
    fetch('version.json', { cache: 'no-store' })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (!seenVersion) {
          seenVersion = data.version;
          try { localStorage.setItem('tv-version', data.version); } catch (e) {}
          return;
        }
        if (data.version !== seenVersion) {
          seenVersion = data.version;
          showUpdateBanner(data);
        }
      })
      .catch(function () { /* offline or first run — stay quiet */ });
  }

  function showUpdateBanner(data) {
    if (document.getElementById('tv-update-banner')) return;
    var banner = document.createElement('div');
    banner.id = 'tv-update-banner';
    banner.innerHTML =
      '<div class="tv-update-inner">' +
        '<span class="tv-update-icon">⬆️</span>' +
        '<div class="tv-update-text"><b>Update available!</b><span>' + esc(data.notes || 'New content and fixes.') + '</span></div>' +
        '<button class="tv-update-btn" id="tv-update-reload">Update Now</button>' +
        '<button class="tv-update-dismiss" id="tv-update-dismiss" aria-label="Dismiss">✕</button>' +
      '</div>';
    document.body.appendChild(banner);
    /* animate in */
    requestAnimationFrame(function () { banner.classList.add('show'); });
    document.getElementById('tv-update-reload').addEventListener('click', function () {
      /* clear service worker caches, then hard reload */
      if ('caches' in window) {
        caches.keys().then(function (names) {
          return Promise.all(names.map(function (n) { return caches.delete(n); }));
        }).then(function () { hardReload(); });
      } else {
        hardReload();
      }
    });
    document.getElementById('tv-update-dismiss').addEventListener('click', function () {
      banner.classList.remove('show');
      setTimeout(function () { banner.remove(); }, 300);
    });
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

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  /* init: check on load, then periodically */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { setTimeout(check, 3000); });
  } else {
    setTimeout(check, 3000);
  }
  setInterval(check, CHECK_INTERVAL);
})();
