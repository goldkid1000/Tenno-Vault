/* Tenno Vault — Vault Mentor. A little Warframe guide character (SVG, CSS animated)
   that gives first-visit tips and acts as the visual face of the Vault Guide AI.
   Click the character to open the AI chat. Non-naggy: each tip shows once.
   API: window.TV.mentor.say(text, opts), .pointAt(selector, text, opts), .hide() */
(function () {
  'use strict';

  /* ---------- SVG character: sleek Warframe ninja, ~60px ---------- */
  var SVG_IDLE =
    '<svg viewBox="0 0 60 72" width="60" height="72" aria-hidden="true">' +
    /* scarf/cape flowing behind */
    '<path d="M30 34 C18 38 12 50 14 66 C22 58 26 46 30 40 Z" fill="#0d2233" stroke="#00e5ff" stroke-width="1" opacity="0.85"/>' +
    /* body */
    '<path d="M30 30 L24 58 L28 58 L30 46 L32 58 L36 58 Z" fill="#1a2433" stroke="#00e5ff" stroke-width="1.2"/>' +
    /* chest plate */
    '<path d="M25 32 L35 32 L33 44 L27 44 Z" fill="#243447" stroke="#ffd54a" stroke-width="1"/>' +
    /* arms (resting) */
    '<path d="M24 34 L18 48" stroke="#1a2433" stroke-width="5" stroke-linecap="round"/>' +
    '<path d="M36 34 L42 48" stroke="#1a2433" stroke-width="5" stroke-linecap="round"/>' +
    '<path d="M24 34 L18 48" stroke="#00e5ff" stroke-width="1" stroke-linecap="round" opacity="0.6"/>' +
    '<path d="M36 34 L42 48" stroke="#00e5ff" stroke-width="1" stroke-linecap="round" opacity="0.6"/>' +
    /* helmet head with fin */
    '<ellipse cx="30" cy="20" rx="11" ry="12" fill="#1a2433" stroke="#00e5ff" stroke-width="1.5"/>' +
    '<path d="M30 8 L26 0 L34 0 Z" fill="#ffd54a"/>' +
    /* glowing cyan visor eyes */
    '<ellipse cx="25" cy="20" rx="3.4" ry="2" fill="#00e5ff"/>' +
    '<ellipse cx="35" cy="20" rx="3.4" ry="2" fill="#00e5ff"/>' +
    '<ellipse cx="25" cy="20" rx="4.6" ry="3" fill="#00e5ff" opacity="0.25"/>' +
    '<ellipse cx="35" cy="20" rx="4.6" ry="3" fill="#00e5ff" opacity="0.25"/>' +
    /* legs */
    '<path d="M26 58 L25 68 M34 58 L35 68" stroke="#1a2433" stroke-width="4" stroke-linecap="round"/>' +
    '</svg>';

  var SVG_POINT =
    '<svg viewBox="0 0 72 72" width="66" height="66" aria-hidden="true">' +
    /* scarf */
    '<path d="M28 36 C16 40 10 52 12 68 C20 60 24 48 28 42 Z" fill="#0d2233" stroke="#00e5ff" stroke-width="1" opacity="0.85"/>' +
    /* body */
    '<path d="M28 32 L22 60 L26 60 L28 48 L30 60 L34 60 Z" fill="#1a2433" stroke="#00e5ff" stroke-width="1.2"/>' +
    /* chest plate */
    '<path d="M23 34 L33 34 L31 46 L25 46 Z" fill="#243447" stroke="#ffd54a" stroke-width="1"/>' +
    /* left arm resting */
    '<path d="M22 36 L16 50" stroke="#1a2433" stroke-width="5" stroke-linecap="round"/>' +
    '<path d="M22 36 L16 50" stroke="#00e5ff" stroke-width="1" stroke-linecap="round" opacity="0.6"/>' +
    /* right arm POINTING */
    '<path d="M34 36 L58 26" stroke="#1a2433" stroke-width="5" stroke-linecap="round"/>' +
    '<path d="M34 36 L58 26" stroke="#00e5ff" stroke-width="1" stroke-linecap="round" opacity="0.6"/>' +
    '<circle cx="60" cy="25" r="3" fill="#ffd54a"/>' +
    '<circle cx="60" cy="25" r="5.5" fill="#ffd54a" opacity="0.25"/>' +
    /* helmet head */
    '<ellipse cx="28" cy="22" rx="11" ry="12" fill="#1a2433" stroke="#00e5ff" stroke-width="1.5"/>' +
    '<path d="M28 10 L24 2 L32 2 Z" fill="#ffd54a"/>' +
    '<ellipse cx="23" cy="22" rx="3.4" ry="2" fill="#00e5ff"/>' +
    '<ellipse cx="33" cy="22" rx="3.4" ry="2" fill="#00e5ff"/>' +
    '<ellipse cx="23" cy="22" rx="4.6" ry="3" fill="#00e5ff" opacity="0.25"/>' +
    '<ellipse cx="33" cy="22" rx="4.6" ry="3" fill="#00e5ff" opacity="0.25"/>' +
    '<path d="M24 60 L23 70 M32 60 L33 70" stroke="#1a2433" stroke-width="4" stroke-linecap="round"/>' +
    '</svg>';

  var TIPS = {
    'index': "Welcome to Tenno Vault, Tenno! I'm your guide. Tap me anytime to ask the AI anything about Warframe.",
    'builds': "These are community builds. Tap the ⭐ filter to see only one-shot Steel Path builds.",
    'starchart': "Tap any planet to see what drops there — resources, bosses, and frames.",
    'donate': "Donations keep the lights on — no pressure though! Every bit helps.",
    'live': "Check here for day/night cycles, fissures, and alerts — all live.",
    'farming': "These are the best verified farms. Tap a currency for the fastest grind.",
    'marketplace': "Post what you're selling or buying — trades happen in-game, no accounts needed."
  };

  var LS_KEY = 'tv-mentor-seen';
  var els = {};
  var bubbleTimer = null;

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

  function build() {
    if (document.getElementById('tv-mentor')) return;
    var wrap = document.createElement('div');
    wrap.id = 'tv-mentor';
    wrap.setAttribute('role', 'button');
    wrap.setAttribute('tabindex', '0');
    wrap.setAttribute('aria-label', 'Open Vault Guide AI chat');
    wrap.title = 'Ask the Vault Guide AI';
    wrap.innerHTML =
      '<div id="tv-mentor-bubble" class="tv-mentor-bubble" hidden>' +
        '<button id="tv-mentor-close" aria-label="Dismiss">×</button>' +
        '<span id="tv-mentor-text"></span>' +
      '</div>' +
      '<div id="tv-mentor-char" class="tv-mentor-char">' + SVG_IDLE + '</div>';
    document.body.appendChild(wrap);
    els.wrap = wrap;
    els.char = wrap.querySelector('#tv-mentor-char');
    els.bubble = wrap.querySelector('#tv-mentor-bubble');
    els.text = wrap.querySelector('#tv-mentor-text');

    function openAI() {
      hide();
      var btn = document.getElementById('vault-ai-btn');
      if (btn) btn.click();
    }
    els.char.addEventListener('click', openAI);
    wrap.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openAI(); }
    });
    wrap.querySelector('#tv-mentor-close').addEventListener('click', function (e) {
      e.stopPropagation();
      hide();
    });
  }

  function say(text, opts) {
    opts = opts || {};
    build();
    els.text.textContent = text;
    els.char.innerHTML = SVG_IDLE;
    els.bubble.hidden = false;
    els.wrap.classList.add('visible');
    els.wrap.classList.remove('pointing');
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
      var x = Math.min(Math.max(r.left + r.width / 2 - 33, 8), window.innerWidth - 76);
      var y = Math.max(r.top - 84, 8);
      els.wrap.style.left = x + 'px';
      els.wrap.style.top = y + 'px';
      els.wrap.style.right = 'auto';
      els.wrap.style.bottom = 'auto';
      els.wrap.classList.add('pointing');
    }
    say(text, opts);
    els.char.innerHTML = SVG_POINT;
  }

  function hide() {
    if (!els.wrap) return;
    clearTimeout(bubbleTimer);
    els.bubble.classList.remove('show');
    els.wrap.classList.remove('visible', 'pointing');
    els.wrap.style.left = ''; els.wrap.style.top = '';
    els.wrap.style.right = ''; els.wrap.style.bottom = '';
  }

  function resetPosition() {
    if (!els.wrap || els.wrap.classList.contains('pointing')) return;
    els.wrap.style.left = ''; els.wrap.style.top = '';
  }

  function maybeFirstVisit() {
    var key = pageKey();
    var tip = TIPS[key];
    if (!tip || wasSeen('tip:' + key)) return;
    /* small delay so the page settles first */
    setTimeout(function () { say(tip, { once: key, duration: 15000 }); }, 2500);
  }

  function init() {
    build();
    /* reveal the character (tips come separately) */
    setTimeout(function () { els.wrap.classList.add('visible'); }, 1200);
    maybeFirstVisit();
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
