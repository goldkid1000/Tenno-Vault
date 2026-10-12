/* Tenno Vault — update flow. When a new version is detected:
   1. Popup appears: "Update available" + version + what's new
   2. "Update" button next to it
   3. Tapping Update shows a loading bar, clears caches, unregisters the SW
   4. Auto-refreshes when done
   Works on mobile PWA, PC installed app, and regular browser tabs. */
(function () {
  'use strict';

  var CHECK_INTERVAL = 15 * 60 * 1000; /* check every 15 minutes */
  var seenVersion = null;
  var updating = false;
  var pendingData = null;

  function check() {
    if (updating) return;
    fetch('version.json', { cache: 'no-store' })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (!seenVersion) {
          seenVersion = data.version;
          try { localStorage.setItem('tv-seen-version', data.version); } catch (e) {}
          return;
        }
        if (data.version !== seenVersion) {
          seenVersion = data.version;
          pendingData = data;
          /* only pop up for real updates WE push (notify flag) —
             not auto-added content like content-watch videos */
          if (data.notify === true) {
            showUpdatePopup(data);
          } else {
            /* silent: just remember it so we don't prompt later */
            try { localStorage.setItem('tv-seen-version', data.version); } catch (e) {}
          }
        }
      })
      .catch(function () { /* offline — stay quiet */ });
  }

  /* ---------- the popup ---------- */
  function showUpdatePopup(data) {
    if (document.getElementById('tv-update-popup')) return;
    if (updating) return;

    var notesHTML = '';
    if (data.notes) {
      var items = String(data.notes).split(/,\s*/);
      if (items.length > 1) {
        notesHTML = '<ul class="tv-upd-list">' +
          items.map(function (n) { return '<li>' + escapeHtml(n.trim()) + '</li>'; }).join('') +
          '</ul>';
      } else {
        notesHTML = '<p class="tv-upd-notes">' + escapeHtml(data.notes) + '</p>';
      }
    }

    var p = document.createElement('div');
    p.id = 'tv-update-popup';
    p.setAttribute('role', 'alertdialog');
    p.setAttribute('aria-label', 'Update available');
    p.innerHTML =
      '<div class="tv-upd-card">' +
        '<div class="tv-upd-head">' +
          '<span class="tv-upd-icon">🚀</span>' +
          '<div><b>Update available</b>' +
          '<span class="tv-upd-ver">v' + escapeHtml(data.version) + '</span></div>' +
          '<button class="tv-upd-dismiss" aria-label="Dismiss">×</button>' +
        '</div>' +
        notesHTML +
        '<div class="tv-upd-actions">' +
          '<button id="tv-upd-btn" class="btn primary">⬇ Update</button>' +
          '<button id="tv-upd-later" class="btn ghost">Later</button>' +
        '</div>' +
        '<div class="tv-upd-progress" hidden>' +
          '<div class="tv-upd-bar"><div class="tv-upd-fill"></div></div>' +
          '<span class="tv-upd-status">Updating…</span>' +
        '</div>' +
      '</div>';
    document.body.appendChild(p);
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { p.classList.add('show'); });
    });

    p.querySelector('.tv-upd-dismiss').addEventListener('click', dismiss);
    p.querySelector('#tv-upd-later').addEventListener('click', dismiss);
    p.querySelector('#tv-upd-btn').addEventListener('click', startUpdate);
  }

  function dismiss() {
    var p = document.getElementById('tv-update-popup');
    if (!p || updating) return;
    p.classList.remove('show');
    setTimeout(function () { if (p.parentNode) p.parentNode.removeChild(p); }, 350);
  }

  /* ---------- the update with loading bar ---------- */
  function startUpdate() {
    if (updating) return;
    updating = true;
    var p = document.getElementById('tv-update-popup');
    if (!p) return;
    var prog = p.querySelector('.tv-upd-progress');
    var fill = p.querySelector('.tv-upd-fill');
    var status = p.querySelector('.tv-upd-status');
    var actions = p.querySelector('.tv-upd-actions');
    if (actions) actions.style.display = 'none';
    prog.hidden = false;

    var steps = [
      ['Checking for new files…', 15],
      ['Downloading update…', 45],
      ['Clearing old cache…', 70],
      ['Finalizing…', 90]
    ];
    var i = 0;
    function nextStep() {
      if (i < steps.length) {
        status.textContent = steps[i][0];
        fill.style.width = steps[i][1] + '%';
        i++;
        setTimeout(nextStep, 600 + Math.random() * 500);
      } else {
        doActualUpdate(fill, status);
      }
    }
    nextStep();
  }

  function doActualUpdate(fill, status) {
    status.textContent = 'Almost done…';
    fill.style.width = '95%';
    var done = function () {
      fill.style.width = '100%';
      status.textContent = 'Done! Refreshing…';
      try { localStorage.setItem('tv-seen-version', seenVersion); } catch (e) {}
      setTimeout(function () { window.location.reload(true); }, 800);
    };
    /* clear caches + unregister service worker so nothing stale survives */
    var clearCaches = ('caches' in window)
      ? caches.keys().then(function (names) {
          return Promise.all(names.map(function (n) { return caches.delete(n); }));
        })
      : Promise.resolve();
    var unregSW = ('serviceWorker' in navigator)
      ? navigator.serviceWorker.getRegistrations().then(function (regs) {
          return Promise.all(regs.map(function (r) { return r.unregister(); }));
        })
      : Promise.resolve();
    Promise.all([clearCaches, unregSW]).then(done).catch(done);
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /* init: check shortly after load, then periodically */
  /* restore seen version so we don't re-prompt after the user already updated */
  try {
    var stored = localStorage.getItem('tv-seen-version');
    if (stored) seenVersion = stored;
  } catch (e) {}
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

  /* expose for manual trigger / debugging */
  window.TV = window.TV || {};
  window.TV.checkForUpdate = check;
})();
