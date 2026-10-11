/* Tenno Vault — Vault Mentor. A little Warframe guide character (SVG, CSS animated)
   that gives first-visit tips and acts as the visual face of the Vault Guide AI.
   Click the character to open the AI chat. Non-naggy: each tip shows once.
   Playful: random pop-ups (max 3/session), wave, dance, holiday costumes, live online badge.
   API: window.TV.mentor.say(text, opts), .pointAt(selector, text, opts), .hide() */
(function () {
  'use strict';

  /* ---------- SVG character: sleek Warframe ninja, ~60px ----------
     Arms/eyes are groups with ids so CSS can animate them. */
  function charSVG(mode) {
    var costume = '';
    try {
      if (typeof window.TV !== 'undefined' && typeof window.TV.getHolidayCostume === 'function') {
        costume = window.TV.getHolidayCostume() || '';
      }
    } catch (e) { costume = ''; }
    var armR = (mode === 'point')
      ? '<g id="tm-arm-r"><path d="M34 36 L58 26" stroke="#1a2433" stroke-width="5" stroke-linecap="round"/>' +
        '<path d="M34 36 L58 26" stroke="#00e5ff" stroke-width="1" stroke-linecap="round" opacity="0.6"/>' +
        '<circle cx="60" cy="25" r="3" fill="#ffd54a"/><circle cx="60" cy="25" r="5.5" fill="#ffd54a" opacity="0.25"/></g>'
      : '<g id="tm-arm-r"><path d="M36 34 L42 48" stroke="#1a2433" stroke-width="5" stroke-linecap="round"/>' +
        '<path d="M36 34 L42 48" stroke="#00e5ff" stroke-width="1" stroke-linecap="round" opacity="0.6"/></g>';
    return '<svg viewBox="0 0 60 72" width="60" height="72" aria-hidden="true">' +
      '<g id="tm-costume">' + costume + '</g>' +
      /* scarf/cape flowing behind */
      '<path d="M30 34 C18 38 12 50 14 66 C22 58 26 46 30 40 Z" fill="#0d2233" stroke="#00e5ff" stroke-width="1" opacity="0.85"/>' +
      /* body */
      '<path d="M30 30 L24 58 L28 58 L30 46 L32 58 L36 58 Z" fill="#1a2433" stroke="#00e5ff" stroke-width="1.2"/>' +
      /* chest plate */
      '<path d="M25 32 L35 32 L33 44 L27 44 Z" fill="#243447" stroke="#ffd54a" stroke-width="1"/>' +
      /* left arm (resting) */
      '<path d="M24 34 L18 48" stroke="#1a2433" stroke-width="5" stroke-linecap="round"/>' +
      '<path d="M24 34 L18 48" stroke="#00e5ff" stroke-width="1" stroke-linecap="round" opacity="0.6"/>' +
      armR +
      /* helmet head with fin */
      '<ellipse cx="30" cy="20" rx="11" ry="12" fill="#1a2433" stroke="#00e5ff" stroke-width="1.5"/>' +
      '<path d="M30 8 L26 0 L34 0 Z" fill="#ffd54a"/>' +
      /* glowing cyan visor eyes (blinkable) */
      '<g id="tm-eyes">' +
      '<ellipse cx="25" cy="20" rx="3.4" ry="2" fill="#00e5ff"/>' +
      '<ellipse cx="35" cy="20" rx="3.4" ry="2" fill="#00e5ff"/>' +
      '<ellipse cx="25" cy="20" rx="4.6" ry="3" fill="#00e5ff" opacity="0.25"/>' +
      '<ellipse cx="35" cy="20" rx="4.6" ry="3" fill="#00e5ff" opacity="0.25"/>' +
      '</g>' +
      /* legs */
      '<path d="M26 58 L25 68 M34 58 L35 68" stroke="#1a2433" stroke-width="4" stroke-linecap="round"/>' +
      '</svg>';
  }

  var TIPS = {
    'index': "Welcome to Tenno Vault, Tenno! I'm your guide. Tap me anytime to ask the AI anything about Warframe.",
    'builds': "These are community builds. Tap the ⭐ filter to see only one-shot Steel Path builds.",
    'starchart': "Tap any planet to see what drops there — resources, bosses, and frames.",
    'donate': "Donations keep the lights on — no pressure though! Every bit helps.",
    'live': "Check here for day/night cycles, fissures, and alerts — all live.",
    'farming': "These are the best verified farms. Tap a currency for the fastest grind.",
    'marketplace': "Post what you're selling or buying — trades happen in-game, no accounts needed."
  };

  var GREETINGS = [
    "Hello, Tenno! 👋",
    "Need a build? Tap me!",
    "Psst… check the News tab for the latest hotfix",
    "Your arsenal is looking strong today",
    "Did you know? You can ask me anything about Warframe",
    "Don't forget to check today's fissures!"
  ];

  var HOLIDAY_GREETINGS = {
    'halloween': ["Spooky builds for spooky season, Tenno! 🎃", "Trick or treat, Tenno — I brought builds! 🦇"],
    'christmas': ["Happy holidays, Tenno! 🎄", "All I want for Christmas is a God-roll riven 🎁"],
    'newyear': ["Happy New Year, Tenno! 🎆", "New year, new main? I can help you pick! ✨"]
  };

  var LS_KEY = 'tv-mentor-seen';
  var els = {};
  var bubbleTimer = null;
  var reducedMotion = false;

  /* session-only playful state (never persisted) */
  var session = {
    popups: 0,
    lastDismiss: 0,
    lastTip: 0,
    greetIdx: Math.floor(Math.random() * GREETINGS.length)
  };

  function seenMap() {
    try { return JSON.parse(localStorage.getItem(LS_KEY) || '{}'); }
    catch (e) { return {}; }
  }
  function markSeen(key) {
    try {
      var m = seenMap();
      m[key] = 1;
      localStorage.setItem(LS_KEY, JSON.stringify(m));
    } catch (e) { /* private mode */ }
  }
  function wasSeen(key) { return !!seenMap()[key]; }

  function pageKey() {
    var p = (location.pathname.split('/').pop() || 'index.html').replace('.html', '');
    return p === '' ? 'index' : p;
  }

  function holiday() {
    try {
      return (window.TV && window.TV.holiday) || null;
    } catch (e) { return null; }
  }

  function build() {
    if (document.getElementById('tv-mentor')) return;
    var wrap = document.createElement('div');
    wrap.id = 'tv-mentor';
    wrap.setAttribute('role', 'button');
    wrap.setAttribute('tabindex', '0');
    wrap.setAttribute('aria-label', 'Open Vault Guide AI chat');
    wrap.title = 'Ask the Vault Guide AI';
    wrap.innerHTML =
      '<div id="tv-mentor-badge" class="tv-mentor-badge" hidden><span class="tv-mentor-dot"></span><span id="tv-mentor-count"></span></div>' +
      '<div id="tv-mentor-bubble" class="tv-mentor-bubble" hidden>' +
        '<button id="tv-mentor-close" aria-label="Dismiss">×</button>' +
        '<span id="tv-mentor-text"></span>' +
      '</div>' +
      '<div id="tv-mentor-char" class="tv-mentor-char">' + charSVG('idle') + '</div>';
    document.body.appendChild(wrap);
    els.wrap = wrap;
    els.char = wrap.querySelector('#tv-mentor-char');
    els.bubble = wrap.querySelector('#tv-mentor-bubble');
    els.text = wrap.querySelector('#tv-mentor-text');
    els.badge = wrap.querySelector('#tv-mentor-badge');
    els.count = wrap.querySelector('#tv-mentor-count');

    function openAI() {
      squash();
      setTimeout(function () {
        hide();
        var btn = document.getElementById('vault-ai-btn');
        if (btn) btn.click();
      }, reducedMotion ? 0 : 180);
    }
    els.char.addEventListener('click', openAI);
    wrap.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openAI(); }
    });
    wrap.querySelector('#tv-mentor-close').addEventListener('click', function (e) {
      e.stopPropagation();
      session.lastDismiss = Date.now();
      hide();
    });
  }

  /* ---------- one-shot animation helpers ---------- */
  function playAnim(cls, ms) {
    if (reducedMotion || !els.char) return;
    els.char.classList.remove('attn', 'wave', 'dance', 'squash');
    /* force reflow so re-triggering works */
    void els.char.offsetWidth;
    els.char.classList.add(cls);
    setTimeout(function () { if (els.char) els.char.classList.remove(cls); }, ms);
  }
  function attention() { playAnim('attn', 700); }
  function wave() { playAnim('wave', 1400); }
  function dance() { playAnim('dance', 2000); }
  function squash() { playAnim('squash', 400); }

  function setChar(mode) {
    if (!els.char) return;
    els.char.innerHTML = charSVG(mode);
  }

  function say(text, opts) {
    opts = opts || {};
    build();
    session.lastTip = Date.now();
    els.text.textContent = text;
    setChar('idle');
    els.bubble.hidden = false;
    els.wrap.classList.add('visible');
    els.wrap.classList.remove('pointing');
    attention();
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { els.bubble.classList.add('show'); });
    });
    if (opts.once) markSeen('tip:' + opts.once);
    clearTimeout(bubbleTimer);
    if (opts.autoHide !== false) {
      bubbleTimer = setTimeout(hide, opts.duration || 12000);
    }
  }

  function pointAt(selector, text, opts) {
    opts = opts || {};
    var target = document.querySelector(selector);
    build();
    if (target) {
      var r = target.getBoundingClientRect();
      var x = Math.min(Math.max(r.left + r.width / 2 - 30, 8), window.innerWidth - 76);
      var y = Math.max(r.top - 84, 8);
      els.wrap.style.left = x + 'px';
      els.wrap.style.top = y + 'px';
      els.wrap.style.right = 'auto';
      els.wrap.style.bottom = 'auto';
      els.wrap.classList.add('pointing');
      /* arm extends with a smooth motion */
      if (els.char) els.char.classList.add('point-anim');
    }
    say(text, opts);
    setChar('point');
  }

  function hide() {
    if (!els.wrap) return;
    clearTimeout(bubbleTimer);
    els.bubble.classList.remove('show');
    if (reducedMotion) {
      finishHide();
      return;
    }
    els.wrap.classList.add('exiting');
    setTimeout(finishHide, 280);
  }
  function finishHide() {
    if (!els.wrap) return;
    els.wrap.classList.remove('visible', 'pointing', 'exiting');
    if (els.char) els.char.classList.remove('point-anim');
    els.wrap.style.left = ''; els.wrap.style.top = '';
    els.wrap.style.right = ''; els.wrap.style.bottom = '';
    setChar('idle');
  }

  function resetPosition() {
    if (!els.wrap || els.wrap.classList.contains('pointing')) return;
    els.wrap.style.left = ''; els.wrap.style.top = '';
  }

  /* ---------- online counter badge ---------- */
  function updateBadge() {
    if (!els.badge) return;
    var n = 0;
    try {
      if (window.TV && typeof window.TV.getOnlineCount === 'function') n = window.TV.getOnlineCount();
    } catch (e) { /* not ready */ }
    if (n > 0) {
      els.count.textContent = n + (n === 1 ? ' Tenno' : ' Tenno') + ' online';
      els.badge.hidden = false;
    } else {
      els.badge.hidden = true;
    }
  }

  /* ---------- playful random pop-ups ---------- */
  function nextGreeting() {
    var h = holiday();
    if (h && h.id && HOLIDAY_GREETINGS[h.id]) {
      var arr = HOLIDAY_GREETINGS[h.id];
      return arr[Math.floor(Math.random() * arr.length)];
    }
    var g = GREETINGS[session.greetIdx % GREETINGS.length];
    session.greetIdx++;
    return g;
  }

  function canPopup() {
    if (session.popups >= 3) return false;
    var now = Date.now();
    if (now - session.lastDismiss < 10 * 60 * 1000) return false;
    if (now - session.lastTip < 5 * 60 * 1000) return false;
    /* update banner visible? */
    var banner = document.getElementById('tv-update-banner');
    if (banner && banner.classList.contains('show')) return false;
    /* AI chat open or user typing in it? */
    var aiPanel = document.getElementById('vault-ai-panel');
    if (aiPanel && aiPanel.style.display === 'flex') return false;
    var active = document.activeElement;
    if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA') &&
        active.closest && active.closest('#vault-ai-panel')) return false;
    /* mid-donation? (typing amount or PayPal iframe present) */
    if (pageKey() === 'donate') {
      var amt = document.getElementById('pp-amount');
      if (amt && document.activeElement === amt) return false;
      var ppFrame = document.querySelector('#pp-donate-btn iframe');
      if (ppFrame) return false;
    }
    return true;
  }

  function randomPopup() {
    if (!canPopup()) { schedulePopup(); return; }
    session.popups++;
    var msg = nextGreeting();
    /* occasionally brag about the crowd */
    if (Math.random() < 0.3) {
      var n = 0;
      try { if (window.TV && typeof window.TV.getOnlineCount === 'function') n = window.TV.getOnlineCount(); } catch (e) {}
      if (n > 1) msg = n + ' Tenno browsing the Vault right now! 🎉';
    }
    /* 1 in 4: dance instead of wave */
    var doDance = Math.random() < 0.25;
    say(msg, { duration: 8000 });
    setTimeout(function () { doDance ? dance() : wave(); }, 400);
    schedulePopup();
  }

  function schedulePopup() {
    /* 3–7 minutes, randomized */
    var delay = (3 + Math.random() * 4) * 60 * 1000;
    setTimeout(randomPopup, delay);
  }

  function maybeFirstVisit() {
    var key = pageKey();
    var tip = TIPS[key];
    if (!tip || wasSeen('tip:' + key)) return;
    /* small delay so the page settles first */
    setTimeout(function () { say(tip, { once: key, duration: 15000 }); }, 2500);
  }

  function init() {
    try {
      reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    } catch (e) { reducedMotion = false; }
    build();
    /* entrance: slide/fade in with a little bounce */
    setTimeout(function () {
      els.wrap.classList.add('visible', 'entering');
      setTimeout(function () { if (els.wrap) els.wrap.classList.remove('entering'); }, reducedMotion ? 0 : 700);
    }, 1200);
    maybeFirstVisit();
    updateBadge();
    setInterval(updateBadge, 30000);
    schedulePopup();
    window.addEventListener('resize', resetPosition);
  }

  window.TV = window.TV || {};
  window.TV.mentor = { say: say, pointAt: pointAt, hide: hide, init: init };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
