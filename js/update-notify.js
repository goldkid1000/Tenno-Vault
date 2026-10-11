/* Tenno Vault — auto-updater. Checks version.json for new releases.
   When an update is found, shows a prominent top banner notification,
   then automatically refreshes to the latest version. No taps needed.
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
    showBanner(data);
    /* let them read it, then refresh to the latest version */
    setTimeout(function () {
      if ('caches' in window) {
        caches.keys().then(function (names) {
          return Promise.all(names.map(function (n) { return caches.delete(n); }));
        }).then(hardReload);
      } else {
        hardReload();
      }
    }, 6000);
  }

  function showBanner(data) {
    /* remove any existing banner */
    var old = document.getElementById('tv-update-banner');
    if (old) old.remove();
    var b = document.createElement('div');
    b.id = 'tv-update-banner';
    b.setAttribute('role', 'alert');
    /* parse notes into bullet list if comma-separated */
    var notesHTML = '';
    if (data.notes) {
      var items = String(data.notes).split(/,\s*/);
      if (items.length > 1) {
        notesHTML = '<ul class="tv-whatsnew-list">' +
          items.map(function (n) { return '<li>' + escapeHtml(n.trim()) + '</li>'; }).join('') +
          '</ul>';
      } else {
        notesHTML = '<span>' + escapeHtml(data.notes) + '</span>';
      }
    }
    b.innerHTML =
      '<span class="tv-update-icon">✨</span>' +
      '<div class="tv-update-text"><b>What\'s new in v' + escapeHtml(data.version) + '</b>' +
      notesHTML +
      '<span class="tv-update-sub">Refreshing to the latest version…</span></div>';
    document.body.appendChild(b);
    /* slide down */
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { b.classList.add('show'); });
    });
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
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
