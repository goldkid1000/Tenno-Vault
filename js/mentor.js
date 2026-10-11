/* Tenno Vault — Vault Mentor. A little Warframe guide character (SVG, CSS animated)
   that gives first-visit tips and acts as the visual face of the Vault Guide AI.
   Click the character to open the AI chat. Non-naggy: each tip shows once.
   Playful: random pop-ups (max 3/session), wave, dance, holiday costumes, live online badge.
   API: window.TV.mentor.say(text, opts), .pointAt(selector, text, opts), .hide() */
(function () {
  'use strict';

  /* ---------- SVG character: chibi Warframe, sitting pose ----------
     Big rounded helmet with ornate gold Orokin faceplate, stubby white body,
     folded legs, hands resting on knees. #tm-eyes (blink), #tm-arm-r (wave/point),
     #tm-costume (holiday hats, drawn on top) are kept for the animation system. */
  function charSVG(mode) {
    var costume = '';
    try {
      if (typeof window.TV !== 'undefined' && typeof window.TV.getHolidayCostume === 'function') {
        costume = window.TV.getHolidayCostume() || '';
      }
    } catch (e) { costume = ''; }
    var armR = (mode === 'point')
      ? '<g id="tm-arm-r">' +
        '<path d="M42 46 L59 33" stroke="#8a8f98" stroke-width="8" stroke-linecap="round"/>' +
        '<path d="M42 46 L59 33" stroke="#e8e8e8" stroke-width="5.5" stroke-linecap="round"/>' +
        '<circle cx="60" cy="32" r="4" fill="#e8e8e8" stroke="#8a8f98" stroke-width="1"/>' +
        '<circle cx="60" cy="32" r="2.4" fill="#ffd54a"/>' +
        '<circle cx="60" cy="32" r="5" fill="#ffd54a" opacity="0.25"/></g>'
      : '<g id="tm-arm-r">' +
        '<path d="M42 46 C47 50, 49 55, 48 60" stroke="#8a8f98" stroke-width="8" stroke-linecap="round"/>' +
        '<path d="M42 46 C47 50, 49 55, 48 60" stroke="#e8e8e8" stroke-width="5.5" stroke-linecap="round"/>' +
        '<path d="M45.5 52 L48 57" stroke="#d4a017" stroke-width="2" opacity="0.9"/>' +
        '<circle cx="48" cy="62" r="4.2" fill="#e8e8e8" stroke="#8a8f98" stroke-width="1"/></g>';
    return '<svg viewBox="0 0 64 76" width="64" height="76" aria-hidden="true">' +
      /* folded legs — sitting cross-legged */
      '<ellipse cx="21" cy="66" rx="11" ry="6" fill="#8a8f98"/>' +
      '<ellipse cx="43" cy="66" rx="11" ry="6" fill="#8a8f98"/>' +
      '<ellipse cx="21" cy="66" rx="11" ry="6" fill="none" stroke="#6e737b" stroke-width="1"/>' +
      '<ellipse cx="43" cy="66" rx="11" ry="6" fill="none" stroke="#6e737b" stroke-width="1"/>' +
      '<path d="M13 64 C17 62, 25 62, 29 64" stroke="#a9adb4" stroke-width="1.4" fill="none"/>' +
      '<path d="M35 64 C39 62, 47 62, 51 64" stroke="#a9adb4" stroke-width="1.4" fill="none"/>' +
      /* feet */
      '<ellipse cx="11" cy="69" rx="5" ry="3.6" fill="#2a2a2a"/>' +
      '<ellipse cx="53" cy="69" rx="5" ry="3.6" fill="#2a2a2a"/>' +
      /* stubby torso */
      '<path d="M32 42 L24 46 L23 60 L41 60 L40 46 Z" fill="#e8e8e8" stroke="#8a8f98" stroke-width="1.2"/>' +
      '<path d="M26 48 L25 58 M38 48 L39 58" stroke="#c6c9cf" stroke-width="1.4"/>' +
      /* gold chest plates */
      '<path d="M28 50 L32 54 L28 58 L24 54 Z" fill="#ffd54a" stroke="#d4a017" stroke-width="0.8"/>' +
      '<path d="M36 50 L40 54 L36 58 L32 54 Z" fill="#ffd54a" stroke="#d4a017" stroke-width="0.8"/>' +
      /* left arm resting on knee */
      '<path d="M22 46 C17 50, 15 55, 16 60" stroke="#8a8f98" stroke-width="8" stroke-linecap="round"/>' +
      '<path d="M22 46 C17 50, 15 55, 16 60" stroke="#e8e8e8" stroke-width="5.5" stroke-linecap="round"/>' +
      '<path d="M18.5 52 L16 57" stroke="#d4a017" stroke-width="2" opacity="0.9"/>' +
      '<circle cx="16" cy="62" r="4.2" fill="#e8e8e8" stroke="#8a8f98" stroke-width="1"/>' +
      armR +
      /* big rounded helmet */
      '<ellipse cx="32" cy="26" rx="17" ry="18" fill="#e8e8e8" stroke="#8a8f98" stroke-width="1.5"/>' +
      /* dome highlight + side shading */
      '<path d="M20 18 C23 12, 29 9, 35 9" stroke="#ffffff" stroke-width="2.5" fill="none" opacity="0.9" stroke-linecap="round"/>' +
      '<path d="M46 22 C48 28, 47 35, 43 40" stroke="#b9bdc4" stroke-width="2" fill="none" opacity="0.8" stroke-linecap="round"/>' +
      '<path d="M18 22 C16 28, 17 35, 21 40" stroke="#b9bdc4" stroke-width="2" fill="none" opacity="0.8" stroke-linecap="round"/>' +
      /* gold crest on top — soft rounded fin */
      '<path d="M32 0 Q27 5, 27.5 10 L36.5 10 Q37 5, 32 0 Z" fill="#ffd54a" stroke="#d4a017" stroke-width="1"/>' +
      '<circle cx="32" cy="4" r="2" fill="#ffd54a" stroke="#d4a017" stroke-width="0.8"/>' +
      '<path d="M21 11 C26 7, 38 7, 43 11" stroke="#d4a017" stroke-width="2" fill="none"/>' +
      /* dark face opening */
      '<ellipse cx="32" cy="29" rx="9.5" ry="11" fill="#1a1a1a"/>' +
      /* ornate gold ring around the face */
      '<ellipse cx="32" cy="29" rx="11" ry="12.5" fill="none" stroke="#d4a017" stroke-width="2.5"/>' +
      '<circle cx="32" cy="15.5" r="1.5" fill="#ffd54a"/>' +
      '<circle cx="22.5" cy="21" r="1.5" fill="#ffd54a"/>' +
      '<circle cx="41.5" cy="21" r="1.5" fill="#ffd54a"/>' +
      '<circle cx="21" cy="32" r="1.5" fill="#ffd54a"/>' +
      '<circle cx="43" cy="32" r="1.5" fill="#ffd54a"/>' +
      /* soft rounded gold chin guard */
      '<ellipse cx="32" cy="44" rx="5" ry="3" fill="#d4a017"/>' +
      '<ellipse cx="32" cy="43.4" rx="3.4" ry="1.8" fill="#ffd54a" opacity="0.7"/>' +
      /* big friendly glowing eyes with sparkles */
      '<g id="tm-eyes">' +
      '<ellipse cx="28" cy="28.5" rx="3.6" ry="4.4" fill="#00e5ff"/>' +
      '<ellipse cx="36" cy="28.5" rx="3.6" ry="4.4" fill="#00e5ff"/>' +
      '<ellipse cx="28" cy="28.5" rx="5" ry="5.8" fill="#00e5ff" opacity="0.22"/>' +
      '<ellipse cx="36" cy="28.5" rx="5" ry="5.8" fill="#00e5ff" opacity="0.22"/>' +
      '<circle cx="29.2" cy="26.8" r="1.2" fill="#ffffff" opacity="0.9"/>' +
      '<circle cx="37.2" cy="26.8" r="1.2" fill="#ffffff" opacity="0.9"/>' +
      '</g>' +
      /* blush marks + tiny smile = huggable */
      '<ellipse cx="24.5" cy="34" rx="2.2" ry="1.4" fill="#ff9db0" opacity="0.55"/>' +
      '<ellipse cx="39.5" cy="34" rx="2.2" ry="1.4" fill="#ff9db0" opacity="0.55"/>' +
      '<path d="M29 37 Q32 39 35 37" stroke="#ffd54a" stroke-width="1.2" fill="none" stroke-linecap="round" opacity="0.9"/>' +
      /* holiday costume sits on top of the helmet */
      '<g id="tm-costume">' + costume + '</g>' +
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
    if (session.popups >= 8) return false;
    var now = Date.now();
    if (now - session.lastDismiss < 5 * 60 * 1000) return false;
    if (now - session.lastTip < 2 * 60 * 1000) return false;
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
    /* 90 seconds – 3 minutes, randomized */
    var delay = (1.5 + Math.random() * 1.5) * 60 * 1000;
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
    /* real-time: update instantly when the count changes */
    document.addEventListener('tv-online-count', function (e) {
      if (e && e.detail && typeof e.detail.count === 'number') {
        window.TV = window.TV || {};
        window.TV._onlineCount = e.detail.count;
        updateBadge();
      }
    });
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
