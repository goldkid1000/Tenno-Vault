/* Tenno Vault — Vault Guide chat. Built-in guide answering from the Vault's own
   data (warframes, weapons, mods, arcanes, relics, builds, farming). Not a live AI. */
(function () {
  'use strict';

  var D = null;          /* loaded data cache */
  var loadingPromise = null;
  var opened = false;

  function esc(s) { return window.TV ? window.TV.esc(s) : String(s); }
  function link(page, name) {
    return page + '#' + encodeURIComponent(name);
  }

  /* drops can be a string, a string array, or [{location, chance}] */
  function fmtDrops(drops) {
    if (!drops) return '';
    var arr = [].concat(drops);
    if (!arr.length) return '';
    return arr.map(function (d) {
      if (typeof d === 'string') return d;
      if (d && d.location) return d.location + (d.chance != null ? ' (' + d.chance + '%)' : '');
      return '';
    }).filter(Boolean).join('; ');
  }

  /* ---------- lazy data load (once, reused for every question) ---------- */
  function loadData() {
    if (D) return Promise.resolve(D);
    if (loadingPromise) return loadingPromise;
    var TV = window.TV;
    loadingPromise = Promise.all([
      TV.getJSONParts('data/site/search-index', 7),
      TV.getJSON('data/site/builds.json'),
      TV.getJSONParts('data/site/warframes', 2),
      TV.getJSONParts('data/site/weapons', 3),
      TV.getJSONParts('data/site/mods', 8),
      TV.getJSONParts('data/site/relics', 6),
      TV.getJSON('data/site/arcanes.json'),
      TV.getJSON('data/site/farming.json')
    ]).then(function (r) {
      D = {
        index: r[0], builds: r[1], warframes: r[2], weapons: r[3],
        mods: r[4], relics: r[5], arcanes: r[6], farming: r[7]
      };
      return D;
    });
    return loadingPromise;
  }

  /* ---------- matching helpers ---------- */
  function norm(s) { return String(s || '').toLowerCase().trim(); }

  /* escape + turn literal \n sequences in data into line breaks */
  function fmtText(s) {
    return esc(s).replace(/\\n/g, '<br>');
  }

  function findByName(list, q) {
    q = norm(q);
    if (!q) return null;
    var i, n;
    for (i = 0; i < list.length; i++) { if (norm(list[i].name) === q) return list[i]; }
    for (i = 0; i < list.length; i++) {
      n = norm(list[i].name);
      if (n.indexOf(q) === 0 && q.length >= 4) return list[i];
    }
    for (i = 0; i < list.length; i++) { if (norm(list[i].name).indexOf(q) !== -1) return list[i]; }
    return null;
  }

  function findBuild(q) {
    q = norm(q);
    if (!q) return null;
    var i, b;
    for (i = 0; i < D.builds.length; i++) {
      b = D.builds[i];
      if (norm(b.item) === q || norm(b.name) === q) return b;
    }
    for (i = 0; i < D.builds.length; i++) {
      b = D.builds[i];
      if (norm(b.item).indexOf(q) !== -1 && q.length >= 4) return b;
    }
    return null;
  }

  /* find a farm answer for a thing across warframes, mods, arcanes, relics, resources */
  function findFarm(q) {
    var w = findByName(D.warframes, q);
    if (w && w.farm) return { kind: 'warframe', e: w };
    var m = findByName(D.mods, q);
    if (m && fmtDrops(m.drops)) return { kind: 'mod', e: m };
    var a = findByName(D.arcanes, q);
    if (a && a.drops && a.drops.length) return { kind: 'arcane', e: a };
    var r = findByName(D.relics, q);
    if (r) return { kind: 'relic', e: r };
    /* resource / farm-spot tables */
    var cats = ['resourceFarms', 'modFarms', 'arcaneFarms', 'relicFarms', 'primePartFarms'];
    for (var c = 0; c < cats.length; c++) {
      var list = D.farming[cats[c]] || [];
      for (var i = 0; i < list.length; i++) {
        if (norm(list[i].what).indexOf(norm(q)) !== -1 && norm(q).length >= 3) {
          return { kind: 'spot', e: list[i] };
        }
      }
    }
    /* prime weapon/part -> which relics drop it? */
    var wp = findByName(D.weapons, q);
    if (wp) {
      var hits = [];
      for (var ri = 0; ri < D.relics.length && hits.length < 6; ri++) {
        var rel = D.relics[ri];
        for (var rj = 0; rj < rel.rewards.length; rj++) {
          if (norm(rel.rewards[rj].name).indexOf(norm(wp.name)) !== -1) {
            hits.push({ relic: rel, reward: rel.rewards[rj] });
            break;
          }
        }
      }
      if (hits.length) return { kind: 'weapon-relic', e: wp, hits: hits };
      return { kind: 'weapon', e: wp };
    }
    return null;
  }

  /* ---------- answer builders (HTML) ---------- */
  function buildAnswer(b) {
    var mods = (b.mods || []).map(function (m) { return esc(m.name); }).join(', ');
    return '<b>' + esc(b.name || b.item) + '</b> — ' + esc(b.item) +
      (window.TV.badge ? ' ' + window.TV.badge(b.tags || []) : '') +
      '<p>' + fmtText(b.description || '') + '</p>' +
      (mods ? '<p><b>Mods:</b> ' + mods + '</p>' : '') +
      (b.arcane ? '<p><b>Arcane:</b> ' + esc(b.arcane) + '</p>' : '') +
      '<p><a href="builds.html#build-' + encodeURIComponent(b.id) + '">Open the full build &rarr;</a></p>';
  }

  function farmAnswer(f) {
    var e = f.e;
    if (f.kind === 'warframe') {
      return '<b>' + esc(e.name) + '</b><p><b>Farm:</b> ' + esc(e.farm) + '</p>' +
        '<p><a href="' + link('warframes.html', e.name) + '">Warframe page &rarr;</a></p>';
    }
    if (f.kind === 'mod') {
      return '<b>' + esc(e.name) + '</b><p><b>Farm:</b> ' + esc(fmtDrops(e.drops)) + '</p>' +
        '<p><a href="' + link('mods.html', e.name) + '">Mod page &rarr;</a></p>';
    }
    if (f.kind === 'arcane') {
      var aloc = fmtDrops(e.drops);
      return '<b>' + esc(e.name) + '</b>' +
        (aloc ? '<p><b>Farm:</b> ' + esc(aloc) + '</p>' : '') +
        '<p><a href="' + link('arcanes.html', e.name) + '">Arcane page &rarr;</a></p>';
    }
    if (f.kind === 'relic') {
      return '<b>' + esc(e.name) + '</b> (' + esc(e.tier) + ' relic)<p>Crack it in <b>Void Fissure</b> missions — ' +
        'relics drop from endless missions (survival/defense), bounties, and Void captures.</p>' +
        '<p><a href="' + link('relics.html', e.name) + '">Relic page &rarr;</a></p>';
    }
    if (f.kind === 'spot') {
      return '<b>' + esc(e.what) + '</b><p><b>Farm:</b> ' + esc(e.source) + '</p>' +
        '<p><a href="farming.html">Farming Hub &rarr;</a></p>';
    }
    if (f.kind === 'weapon-relic') {
      var rows = f.hits.map(function (h) {
        return '<li><a href="' + link('relics.html', h.relic.name) + '">' + esc(h.relic.name) +
          '</a> <span class="muted small">' + esc(h.relic.tier) + ' · ' + esc(h.reward.rarity) + '</span></li>';
      }).join('');
      return '<b>' + esc(e.name) + '</b><p>Prime parts drop from these relics (crack in Void Fissures):</p><ul>' +
        rows + '</ul><p><a href="' + link('weapons.html', e.name) + '">Weapon page &rarr;</a></p>';
    }
    return '<b>' + esc(e.name) + '</b><p>The Vault doesn\'t list a farm spot for this one yet.</p>' +
      '<p><a href="' + link('weapons.html', e.name) + '">Weapon page &rarr;</a></p>';
  }

  function describeAnswer(e, page) {
    var desc = e.description || e.effect || '';
    var extra = '';
    if (e.effect) extra += '<p><b>Effect:</b> ' + fmtText(e.effect) + '</p>';
    var dloc = fmtDrops(e.drops);
    if (dloc) extra += '<p><b>Farm:</b> ' + esc(dloc) + '</p>';
    if (e.farm) extra += '<p><b>Farm:</b> ' + esc(e.farm) + '</p>';
    return '<b>' + esc(e.name) + '</b>' + (desc ? '<p>' + fmtText(desc) + '</p>' : '') + extra +
      '<p><a href="' + link(page, e.name) + '">Full page &rarr;</a></p>';
  }

  function steelPathAnswer() {
    var picks = D.builds.filter(function (b) {
      return (b.tags || []).indexOf('steel-path') !== -1 || (b.tags || []).indexOf('one-shot') !== -1;
    }).slice(0, 8);
    if (!picks.length) return 'No Steel Path builds found in the Vault.';
    var rows = picks.map(function (b) {
      return '<li><a href="builds.html#build-' + encodeURIComponent(b.id) + '"><b>' + esc(b.name || b.item) +
        '</b></a> <span class="muted small">' + esc(b.item) + '</span> ' +
        (window.TV.badge ? window.TV.badge(b.tags || []) : '') + '</li>';
    }).join('');
    return '<b>Steel Path / one-shot builds</b><ul>' + rows + '</ul>' +
      '<p><a href="builds.html">All builds &rarr;</a></p>';
  }

  function sellAnswer() {
    return '<b>Selling for platinum</b><p>1) Farm prime parts from Void Relics (crack them in fissures). ' +
      '2) List them on <b>warframe.market</b>. 3) Meet the buyer in-game — trade at a relay or clan dojo. ' +
      'Vaulted relics and rare mods fetch the most.</p>' +
      '<p><a href="trading.html">Full trading guide &rarr;</a></p>';
  }

  function helpAnswer() {
    return '<b>What I can answer</b> (from the Vault\'s data):' +
      '<ul><li>Best build for a weapon or frame — <i>"best build for Kuva Zarr"</i></li>' +
      '<li>Where to farm anything — <i>"where do I farm Argon Crystals"</i></li>' +
      '<li>What a mod or arcane does — <i>"what does Hunter Munitions do"</i></li>' +
      '<li>Steel Path / one-shot picks — <i>"best Steel Path builds"</i></li>' +
      '<li>How to sell for platinum — <i>"how do I sell for platinum"</i></li></ul>' +
      'I\'m the Vault\'s built-in guide, not a live AI — I only know what\'s in the Vault.';
  }

  function fallbackAnswer(q) {
    var hits = D.index.filter(function (e) {
      return e.n && norm(e.n).indexOf(norm(q)) !== -1;
    }).slice(0, 5);
    if (!hits.length) {
      return 'I couldn\'t find that in the Vault. Try a warframe, weapon, mod, arcane, or relic name — ' +
        'or ask "help" to see what I can answer.';
    }
    var rows = hits.map(function (h) {
      return '<li><a href="' + esc(h.u) + '"><b>' + esc(h.n) + '</b></a> ' +
        '<span class="muted small">' + esc(h.t) + '</span></li>';
    }).join('');
    return 'I didn\'t quite get that — did you mean:<ul>' + rows + '</ul>';
  }

  /* ---------- intent routing ---------- */
  function stripQ(q) { return norm(q).replace(/\?+$/, '').trim(); }

  function answer(q) {
    var t = stripQ(q);
    if (!t) return 'Ask me something — a build, a farm spot, a mod, or "help".';

    if (/^(hi|hey|hello|yo|sup|howdy)\b/.test(t)) {
      return 'Hey, Tenno. ' + helpAnswer();
    }
    if (t.indexOf('help') !== -1 || t.indexOf('what can you') !== -1) return helpAnswer();
    if (t.indexOf('steel path') !== -1 || t.indexOf('one-shot') !== -1 || t.indexOf('oneshot') !== -1) {
      return steelPathAnswer();
    }
    if (t.indexOf('sell') !== -1 || t.indexOf('platinum') !== -1 || t.indexOf('trade') !== -1) {
      return sellAnswer();
    }

    var m;
    m = t.match(/^what does (.+?) do$/);
    if (m) {
      var thing = m[1];
      var mod = findByName(D.mods, thing);
      if (mod) return describeAnswer(mod, 'mods.html');
      var arc = findByName(D.arcanes, thing);
      if (arc) return describeAnswer(arc, 'arcanes.html');
      return 'I don\'t know a mod or arcane called "' + esc(thing) + '".';
    }

    m = t.match(/^(?:where (?:do|can) i farm|where to (?:farm|get)|how do i (?:get|farm|obtain|find)|how to (?:get|farm|obtain|find)|farm) (.+)$/);
    if (m) {
      var f = findFarm(m[1]);
      if (f) return farmAnswer(f);
      return 'I couldn\'t find a farm spot for "' + esc(m[1]) + '" in the Vault.';
    }

    m = t.match(/^(?:best |strongest )?(.+?) build$/) || t.match(/^(?:best |strongest )?build for (.+)$/);
    if (m) {
      var b = findBuild(m[1]);
      if (b) return buildAnswer(b);
      return 'No build for "' + esc(m[1]) + '" in the Vault yet. Try "best Steel Path builds" for the top picks.';
    }

    m = t.match(/^what is (?:a |an |the )?(.+)$/);
    if (m) {
      var w = findByName(D.warframes, m[1]);
      if (w) return describeAnswer(w, 'warframes.html');
      var wp = findByName(D.weapons, m[1]);
      if (wp) return describeAnswer(wp, 'weapons.html');
      var md = findByName(D.mods, m[1]);
      if (md) return describeAnswer(md, 'mods.html');
      var ar = findByName(D.arcanes, m[1]);
      if (ar) return describeAnswer(ar, 'arcanes.html');
    }

    return fallbackAnswer(t);
  }

  /* ---------- UI ---------- */
  var els = {};

  function addMsg(html, who) {
    var d = document.createElement('div');
    d.className = 'vai-msg ' + who;
    if (who === 'user') {
      d.textContent = html;
    } else {
      d.innerHTML = html;
    }
    els.msgs.appendChild(d);
    els.msgs.scrollTop = els.msgs.scrollHeight;
  }

  function ask(q) {
    if (!q) return;
    addMsg(q, 'user');
    els.input.value = '';
    loadData().then(function () {
      addMsg(answer(q), 'bot');
    }).catch(function () {
      addMsg('Couldn\'t load the Vault\'s data — try the retry button on the page, or reload.', 'bot');
    });
  }

  function toggle(open) {
    var show = typeof open === 'boolean' ? open : els.panel.style.display !== 'flex';
    els.panel.style.display = show ? 'flex' : 'none';
    els.btn.classList.toggle('open', show);
    if (show && !opened) {
      opened = true;
      addMsg('Hey, Tenno — I\'m the Vault\'s <b>built-in guide</b>. I answer from Tenno Vault\'s own data ' +
        '(not a live AI): builds, farm spots, what mods/arcanes do, and how to sell for platinum. ' +
        'Try a question below or tap a chip.', 'bot');
      loadData().catch(function () {
        addMsg('Heads up: the Vault data didn\'t load — answers may be limited until you reload.', 'bot');
      });
    }
    if (show) setTimeout(function () { els.input.focus(); }, 60);
  }

  var CHIPS = [
    'Best Steel Path builds?',
    'Where do I farm Argon Crystals?',
    'How do I sell for platinum?'
  ];

  function init() {
    if (document.getElementById('vault-ai-btn') || !window.TV) return;

    var btn = document.createElement('button');
    btn.id = 'vault-ai-btn';
    btn.type = 'button';
    btn.innerHTML = '◈ Ask the Vault';
    btn.setAttribute('aria-label', 'Ask the Vault guide');

    var panel = document.createElement('div');
    panel.id = 'vault-ai-panel';
    panel.style.display = 'none';
    panel.innerHTML =
      '<div class="vai-head"><span>◈ Vault Guide</span>' +
      '<button id="vai-close" type="button" aria-label="Close">✕</button></div>' +
      '<div id="vai-msgs"></div>' +
      '<div class="vai-chips">' +
      CHIPS.map(function (c) { return '<button type="button" class="vai-chip">' + esc(c) + '</button>'; }).join('') +
      '</div>' +
      '<form id="vai-form"><input id="vai-input" type="text" autocomplete="off" ' +
      'placeholder="Ask about builds, farms, mods…" aria-label="Ask the Vault">' +
      '<button type="submit" aria-label="Send">➤</button></form>';

    document.body.appendChild(btn);
    document.body.appendChild(panel);

    els = {
      btn: btn, panel: panel,
      msgs: panel.querySelector('#vai-msgs'),
      input: panel.querySelector('#vai-input'),
      form: panel.querySelector('#vai-form')
    };

    btn.addEventListener('click', function () { toggle(); });
    panel.querySelector('#vai-close').addEventListener('click', function () { toggle(false); });
    els.form.addEventListener('submit', function (e) {
      e.preventDefault();
      ask(els.input.value.trim());
    });
    panel.querySelectorAll('.vai-chip').forEach(function (chip) {
      chip.addEventListener('click', function () { ask(chip.textContent); });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && panel.style.display === 'flex') toggle(false);
    });
  }

  window.TVAI = { init: init, _answer: answer, _load: loadData };
})();
