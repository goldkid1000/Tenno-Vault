/* Tenno Vault — shared layout, navigation, search, infinite scroll */
(function () {
  'use strict';

  var NAV = [
    { id: 'home', label: 'Home', sub: 'Start here', icon: '🏠', file: 'index.html' },
    { id: 'warframes', label: 'Warframes', sub: 'Pick your character', icon: '🥷', file: 'warframes.html' },
    { id: 'weapons', label: 'Weapons', sub: 'Guns & blades', icon: '🔫', file: 'weapons.html' },
    { id: 'mods', label: 'Mods', sub: 'Upgrade everything', icon: '🧩', file: 'mods.html' },
    { id: 'arcanes', label: 'Arcanes', sub: 'Bonus powers', icon: '✨', file: 'arcanes.html' },
    { id: 'relics', label: 'Relics', sub: 'Crack for prime parts', icon: '📦', file: 'relics.html' },
    { id: 'amps', label: 'Amps', sub: 'Operator weapons', icon: '🔷', file: 'amps.html' },
    { id: 'operators', label: 'Operators', sub: 'Focus schools', icon: '👁', file: 'operators.html' },
    { id: 'builds', label: 'Builds', sub: 'Steel Path setups', icon: '⚔️', file: 'builds.html' },
    { id: 'farming', label: 'Farming Hub', sub: 'Where to farm it', icon: '🌾', file: 'farming.html' },
    { id: 'trading', label: 'Trading', sub: 'Sell for platinum', icon: '💰', file: 'trading.html' },
    { id: 'marketplace', label: 'Market Board', sub: 'Player listings', icon: '🏪', file: 'marketplace.html' },
    { id: 'live', label: 'Live', sub: 'Right-now game info', icon: '📡', file: 'live.html' },
    { id: 'videos', label: 'Videos', sub: 'Watch & learn', icon: '🎬', file: 'videos.html' },
  ];

  var page = document.body.getAttribute('data-page') || 'home';

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  /* ---------- header ---------- */
  function buildHeader() {
    var host = document.getElementById('site-header');
    if (!host) return;
    host.innerHTML =
      '<div class="header-inner">' +
      '<a class="logo" href="index.html"><span class="lotus">◈</span> Tenno Vault</a>' +
      '<div class="search-wrap"><input id="global-search" type="search" placeholder="Search warframes, weapons, mods, builds…" autocomplete="off" aria-label="Search"></div>' +
      '<!-- DONATE: buttons link to donate.html; swap the embedded QR data URI and the PayPal.me href inside donate.html as needed -->' +
      '<a class="btn donate-btn" href="donate.html">♥ Donate</a>' +
      '</div>';
    var input = document.getElementById('global-search');
    input.addEventListener('focus', openSearch);
    input.addEventListener('click', openSearch);
  }

  /* ---------- sidebar (desktop) ---------- */
  function buildSidebar() {
    var host = document.getElementById('sidebar');
    if (!host) return;
    var html = '<nav>';
    NAV.forEach(function (n) {
      html += '<a href="' + n.file + '" class="' + (n.id === page ? 'active' : '') + '">' +
        n.icon + ' ' + esc(n.label) + '</a>';
    });
    html += '</nav>';
    host.innerHTML = html;
  }

  /* ---------- tab bar (mobile) ---------- */
  function buildTabbar() {
    var host = document.getElementById('tabbar');
    if (!host) return;
    var tabs = [
      { id: 'home', label: 'Home', icon: '🏠', file: 'index.html' },
      { id: 'builds', label: 'Builds', icon: '⚔️', file: 'builds.html' },
      { id: 'live', label: 'Live', icon: '📡', file: 'live.html' },
      { id: 'marketplace', label: 'Market', icon: '🏪', file: 'marketplace.html' },
      { id: 'index-more', label: 'More', icon: '☰', file: 'index.html#sections' },
    ];
    host.innerHTML = tabs.map(function (t) {
      return '<a href="' + t.file + '" class="' + (t.id === page ? 'active' : '') + '">' +
        '<span class="ti">' + t.icon + '</span>' + t.label + '</a>';
    }).join('');
  }

  /* ---------- breadcrumbs ---------- */
  function buildCrumbs() {
    var host = document.getElementById('breadcrumbs');
    if (!host) return;
    var crumb = document.body.getAttribute('data-crumb') || 'Home';
    var parts = crumb.split(',');
    host.innerHTML = parts.map(function (p, i) {
      p = p.trim();
      var link = i === 0 ? 'index.html' : null;
      var label = esc(p);
      if (i < parts.length - 1) {
        var target = i === 0 ? 'index.html' : '#';
        return '<a href="' + target + '">' + label + '</a><span class="sep">›</span>';
      }
      return '<span>' + label + '</span>';
    }).join('');
  }

  /* ---------- footer ---------- */
  function buildFooter() {
    var host = document.getElementById('site-footer');
    if (!host) return;
    host.innerHTML =
      '<div class="frow">' +
      '<!-- DONATE: buttons link to donate.html; swap the embedded QR data URI and the PayPal.me href inside donate.html as needed -->' +
      '<a class="btn donate-btn" href="donate.html">♥ Donate to Tenno Vault</a>' +
      '<span>Unofficial fan site. Not affiliated with Digital Extremes.</span>' +
      '<span>Game data: warframe-items (WFCD) · Prices: warframe.market · Live: warframestat.us</span>' +
      '</div>';
  }

  /* ---------- search ---------- */
  var searchIndex = null, searchLoading = null;
  function loadIndex() {
    if (searchIndex) return Promise.resolve(searchIndex);
    if (searchLoading) return searchLoading;
    searchLoading = getJSONParts('data/site/search-index', 7)
      .then(function (d) { searchIndex = d; return d; })
      .catch(function () { searchIndex = []; return []; });
    return searchLoading;
  }

  function openSearch() {
    var ov = document.getElementById('search-overlay');
    ov.classList.add('open');
    var input = document.getElementById('search-input');
    input.value = '';
    document.getElementById('search-results').innerHTML =
      '<div class="loading">Type to search 3,500+ warframes, weapons, mods, builds…</div>';
    setTimeout(function () { input.focus(); }, 30);
    loadIndex();
  }
  function closeSearch() {
    document.getElementById('search-overlay').classList.remove('open');
  }

  function renderHits(q) {
    var box = document.getElementById('search-results');
    if (!q || q.length < 2) {
      box.innerHTML = '<div class="loading">Type at least 2 letters…</div>';
      return;
    }
    loadIndex().then(function (idx) {
      q = q.toLowerCase();
      var hits = idx.filter(function (e) {
        return e.n.toLowerCase().indexOf(q) !== -1 || e.d.toLowerCase().indexOf(q) !== -1;
      }).slice(0, 60);
      if (!hits.length) {
        box.innerHTML = '<div class="loading">No matches. Try another spelling.</div>';
        return;
      }
      box.innerHTML = hits.map(function (h) {
        return '<a class="search-hit" href="' + esc(h.u) + '">' +
          '<div class="t">' + esc(h.t) + '</div><div><b>' + esc(h.n) + '</b></div>' +
          '<div class="muted small">' + esc(h.d) + '</div></a>';
      }).join('');
    });
  }

  function buildSearchOverlay() {
    var ov = document.createElement('div');
    ov.id = 'search-overlay';
    ov.innerHTML =
      '<div class="search-panel">' +
      '<input id="search-input" type="search" placeholder="Search everything…" autocomplete="off" aria-label="Search everything">' +
      '<div id="search-results"></div></div>';
    document.body.appendChild(ov);
    ov.addEventListener('click', function (e) { if (e.target === ov) closeSearch(); });
    document.getElementById('search-input').addEventListener('input', function (e) {
      renderHits(e.target.value.trim());
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeSearch();
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault(); openSearch();
      }
    });
  }

  /* ---------- infinite scroll ---------- */
  function infiniteScroll(container, items, renderItem, pageSize) {
    pageSize = pageSize || 40;
    var shown = 0;
    var sentinel = document.createElement('div');
    sentinel.className = 'sentinel';
    function more() {
      var frag = document.createDocumentFragment();
      var next = Math.min(shown + pageSize, items.length);
      for (var i = shown; i < next; i++) {
        frag.appendChild(renderItem(items[i], i));
      }
      container.insertBefore(frag, sentinel);
      shown = next;
      if (shown >= items.length && sentinel.parentNode) {
        sentinel.parentNode.removeChild(sentin);
        if (window._io) window._io.disconnect();
      }
    }
    container.appendChild(sentin);
    var io = new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting) more();
    }, { rootMargin: '600px' });
    window._io = io;
    io.observe(sentin);
    more();
    return {
      reset: function (newItems) {
        items = newItems; shown = 0;
        container.innerHTML = '';
        container.appendChild(sentin);
        io.observe(sentin);
        more();
      }
    };
  }

  /* ---------- data helpers ---------- */
  function getJSON(path) {
    return fetch(path).then(function (r) {
      if (!r.ok) throw new Error('load failed: ' + path);
      return r.json();
    });
  }

  function getJSONParts(base, count) {
    var ps = [];
    for (var i = 0; i < count; i++) ps.push(getJSON(base + '-' + i + '.json'));
    return Promise.all(ps).then(function (parts) { return [].concat.apply([], parts); });
  }

  function badge(tags) {
    var out = '';
    if (tags.indexOf('one-shot') !== -1) out += '<span class="badge oneshot">One-shot</span>';
    if (tags.indexOf('steel-path') !== -1) out += '<span class="badge steelpath">Steel Path</span>';
    if (tags.indexOf('strong') !== -1) out += '<span class="badge strong">Strong</span>';
    if (tags.indexOf('beginner') !== -1) out += '<span class="badge type">Beginner-friendly</span>';
    return out;
  }

  function liveNote() {
    return '<div class="notice"><b>Live data unavailable.</b> Could not reach the live server. ' +
      'Check your connection and refresh — the rest of the Vault still works.</div>';
  }

  /* ---------- related links ---------- */
  function relatedLinks(title, links) {
    if (!links || !links.length) return '';
    return '<div class="related"><h3>' + esc(title) + '</h3><div class="card-grid">' +
      links.map(function (l) {
        return '<a class="card" href="' + esc(l.url) + '"><h3>' + esc(l.label) +
          '</h3><p>' + esc(l.sub || '') + '</p></a>';
      }).join('') + '</div></div>';
  }

  /* ---------- init ---------- */
  document.addEventListener('DOMContentLoaded', function () {
    buildHeader();
    buildSidebar();
    buildTabbar();
    buildCrumbs();
    buildFooter();
    buildSearchOverlay();
  });

  window.TV = {
    NAV: NAV, page: page, esc: esc, getJSON: getJSON, getJSONParts: getJSONParts,
    infiniteScroll: infiniteScroll, badge: badge,
    liveNote: liveNote, relatedLinks: relatedLinks,
    openSearch: openSearch
  };
})();
