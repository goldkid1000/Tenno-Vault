/* Tenno Vault — community chat (Firebase Firestore).
 * Gracefully shows a "coming soon" placeholder when Firebase isn't configured. */
(function () {
  'use strict';
  var esc = function (s) { return window.TV.esc(s); };

  function placeholderHTML() {
    return '<div class="notice"><h3>💬 Chat coming soon</h3>' +
      '<p>The owner is setting up the community chat backend (free Firebase). ' +
      'Check back soon — or use the <b>Vault Guide</b> (◈ button, bottom-right) for build help right now.</p></div>';
  }

  function loadSDK(cb) {
    if (window.firebase && firebase.apps.length) return cb();
    var files = [
      'https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js',
      'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore-compat.js'
    ];
    (function next(i) {
      if (i >= files.length) return cb();
      var s = document.createElement('script');
      s.src = files[i];
      s.onload = function () { next(i + 1); };
      s.onerror = function () {
        document.getElementById('tv-chat').innerHTML =
          '<div class="notice">Chat unavailable — could not load. Check your connection.</div>';
      };
      document.head.appendChild(s);
    })(0);
  }

  function renderChat(db) {
    var box = document.getElementById('tv-chat');
    box.innerHTML =
      '<div id="chat-msgs" style="max-height:320px;overflow-y:auto;border:1px solid var(--border);' +
      'border-radius:var(--radius);padding:12px;margin-bottom:10px;background:var(--card)"></div>' +
      '<form id="chat-form" style="display:flex;gap:8px">' +
      '<input id="chat-name" placeholder="Tenno name" maxlength="24" style="max-width:140px" aria-label="Your name">' +
      '<input id="chat-text" placeholder="Say something kind…" maxlength="300" style="flex:1" aria-label="Message">' +
      '<button class="btn primary" type="submit">Send</button></form>' +
      '<p class="muted small" style="margin-top:6px">10 latest messages · no account needed · keep it friendly</p>';

    var msgs = box.querySelector('#chat-msgs');
    function fmtTime(ts) {
      try { return new Date(ts.toDate ? ts.toDate() : ts).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}); }
      catch (e) { return ''; }
    }
    db.collection('chat').orderBy('ts', 'desc').limit(10)
      .onSnapshot(function (snap) {
        var rows = [];
        snap.forEach(function (doc) {
          var m = doc.data();
          rows.unshift('<div class="mod-row"><div><b>' + esc(m.name || 'Tenno') + '</b> ' +
            '<span class="muted small">' + esc(fmtTime(m.ts)) + '</span>' +
            '<div>' + esc(m.text || '') + '</div></div></div>');
        });
        msgs.innerHTML = rows.join('') || '<p class="muted">No messages yet — say hi!</p>';
        msgs.scrollTop = msgs.scrollHeight;
      }, function () {
        msgs.innerHTML = '<p class="muted">Couldn\'t load messages. Try reloading.</p>';
      });

    box.querySelector('#chat-form').addEventListener('submit', function (e) {
      e.preventDefault();
      var name = box.querySelector('#chat-name').value.trim().slice(0, 24) || 'Tenno';
      var text = box.querySelector('#chat-text').value.trim().slice(0, 300);
      if (!text) return;
      box.querySelector('#chat-text').value = '';
      db.collection('chat').add({
        name: name,
        text: text,
        ts: firebase.firestore.FieldValue.serverTimestamp()
      }).catch(function () { /* silent fail */ });
      try { localStorage.setItem('tv-chat-name', name); } catch (e2) {}
    });
    try {
      var saved = localStorage.getItem('tv-chat-name');
      if (saved) box.querySelector('#chat-name').value = saved;
    } catch (e) {}
  }

  document.addEventListener('DOMContentLoaded', function () {
    var box = document.getElementById('tv-chat');
    if (!box) return;
    var configured = !!(window.TV_FIREBASE_READY && window.TV_FIREBASE_CONFIG &&
      window.TV_FIREBASE_CONFIG.apiKey &&
      window.TV_FIREBASE_CONFIG.apiKey.indexOf('PASTE_') !== 0);
    if (!configured) { box.innerHTML = placeholderHTML(); return; }
    box.innerHTML = '<div class="loading">Connecting to chat…</div>';
    loadSDK(function () {
      try {
        if (!firebase.apps.length) firebase.initializeApp(window.TV_FIREBASE_CONFIG);
        renderChat(firebase.firestore());
      } catch (e) {
        box.innerHTML = placeholderHTML();
      }
    });
  });
})();
