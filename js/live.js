/* Tenno Vault — live worldstate + platinum prices */
(function () {
  'use strict';
  var esc = function (s) { return window.TV.esc(s); };

  function countdown(iso) {
    try {
      var ms = new Date(iso).getTime() - Date.now();
      if (ms < 0) return 'expired';
      var s = Math.floor(ms / 1000);
      var h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60);
      return (h ? h + 'h ' : '') + m + 'm left';
    } catch (e) { return ''; }
  }

  /* ---------------- worldstate ---------------- */
  function cycleCard(title, state, timeLeft, icon) {
    return '<div class="card"><div class="icon">' + icon + '</div><h3>' + esc(title) + '</h3>' +
      '<p style="font-size:1.15rem;font-weight:700">' + esc(state) + '</p>' +
      '<p class="muted small">' + esc(timeLeft || '') + '</p></div>';
  }

  var lastUpdate = 0;

  function timeAgo() {
    var s = Math.floor((Date.now() - lastUpdate) / 1000);
    if (s < 5) return 'just now';
    if (s < 60) return s + 's ago';
    return Math.floor(s / 60) + 'm ago';
  }

  function renderIncoming(d) {
    var items = [];
    /* alerts */
    (d.alerts || []).forEach(function (a) {
      items.push({ title: '🚨 Alert: ' + (a.mission ? a.mission.type : 'Alert'),
        sub: (a.mission ? a.mission.node : '') + ' vs ' + (a.mission ? a.mission.faction : ''),
        expiry: a.expiry, kind: 'alert' });
    });
    /* events */
    (d.events || []).forEach(function (e) {
      if (e.expiry) items.push({ title: '🎉 ' + (e.description || 'Event'), sub: '', expiry: e.expiry, kind: 'event' });
    });
    /* sort by soonest expiry */
    items.sort(function (a, b) { return new Date(a.expiry) - new Date(b.expiry); });
    if (!items.length) return '';
    var html = '<h2>🔔 Incoming — ending soon</h2><div class="item-list">';
    items.slice(0, 10).forEach(function (it) {
      html += '<div class="list-item incoming-pulse"><h3>' + esc(it.title) + '</h3>' +
        '<p class="muted small">' + esc(it.sub) + (it.sub ? ' · ' : '') +
        'ends in <b>' + esc(countdown(it.expiry)) + '</b></p></div>';
    });
    return html + '</div>';
  }

  function renderWorld(d) {
    lastUpdate = Date.now();
    var html = '<p class="muted small" id="live-updated">Updated ' + timeAgo() + ' · auto-refreshes every minute</p>';
    html += '<h2>Right now in the Origin System</h2><div class="card-grid">';
    if (d.earthCycle) html += cycleCard('Earth', d.earthCycle.isDay ? '☀️ Day' : '🌙 Night', d.earthCycle.timeLeft, '🌍');
    if (d.cetusCycle) html += cycleCard('Cetus / Plains', d.cetusCycle.isDay ? '☀️ Day' : '🌙 Night', d.cetusCycle.timeLeft, '🌅');
    if (d.vallisCycle) html += cycleCard('Orb Vallis', d.vallisCycle.isWarm ? '🔥 Warm' : '❄️ Cold', d.vallisCycle.timeLeft, '🏔');
    if (d.cambionCycle) html += cycleCard('Deimos / Cambion Drift',
      d.cambionCycle.active === 'fass' ? '🟠 Fass' : '🔵 Vome', d.cambionCycle.timeLeft, '🦠');
    html += '</div>';

    // fissures
    if (d.fissures && d.fissures.length) {
      html += '<h2>Active Void Fissures</h2><div class="item-list">';
      d.fissures.slice(0, 24).forEach(function (f) {
        html += '<div class="list-item"><h3>' + esc(f.tier + ' — ' + f.missionType + ' <span class="muted">(' + f.node + ')</span>') + '</h3>' +
          '<p class="muted small">vs ' + esc(f.enemy) + ' · ' + esc(countdown(f.expiry)) +
          (f.isStorm ? ' · <b>Railjack</b>' : '') + (f.isHard ? ' · <b>Steel Path</b>' : '') + '</p></div>';
      });
      html += '</div>';
    }

    // sortie / archon hunt
    if (d.sortie && d.sortie.boss) {
      html += '<h2>Sortie — ' + esc(d.sortie.boss) + '</h2><div class="detail-box">';
      (d.sortie.missions || []).forEach(function (m) {
        html += '<div class="mod-row"><div><b>' + esc(m.missionType) + '</b> <span class="muted">(' + esc(m.node) + ')</span></div>' +
          '<div class="muted">' + esc(m.modifier) + '</div></div>';
      });
      html += '<p class="muted small">Resets in ' + esc(countdown(d.sortie.expiry)) + '</p></div>';
    }
    if (d.archonHunt && d.archonHunt.boss) {
      html += '<h2>Archon Hunt — ' + esc(d.archonHunt.boss) + '</h2><div class="detail-box">';
      (d.archonHunt.missions || []).forEach(function (m) {
        html += '<div class="mod-row"><div><b>' + esc(m.missionType || m.type) + '</b> <span class="muted">(' + esc(m.node) + ')</span></div></div>';
      });
      html += '</div>';
    }

    // news
    if (d.news && d.news.length) {
      html += '<h2>Official Warframe News</h2><div class="item-list">';
      d.news.slice(0, 8).forEach(function (n) {
        html += '<a class="list-item" href="' + esc(n.link) + '" target="_blank" rel="noopener">' +
          '<h3>' + esc(n.message) + '</h3>' +
          '<p class="muted small">' + esc(new Date(n.date).toLocaleDateString()) + ' · warframe.com ↗</p></a>';
      });
      html += '</div>';
    }
    /* incoming alerts/events with countdowns */
    html += renderIncoming(d);
    return html;
  }

  function loadWorld() {
    var box = document.getElementById('live-world');
    fetch('https://api.warframestat.us/pc')
      .then(function (r) { if (!r.ok) throw new Error('bad'); return r.json(); })
      .then(function (d) { box.innerHTML = renderWorld(d); })
      .catch(function () { box.innerHTML = window.TV.liveNote(); });
  }

  /* ---------------- platinum prices ---------------- */
  var marketIndex = null;
  function loadMarketIndex() {
    if (marketIndex) return Promise.resolve(marketIndex);
    return window.TV.getJSON('data/site/market-index.json').then(function (d) {
      marketIndex = d; return d;
    }).catch(function () { marketIndex = {}; return {}; });
  }
  function slugify(name) {
    return name.toLowerCase().trim()
      .replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, '_');
  }
  /* rough price estimate when live lookup yields nothing — clearly labeled as estimate */
  function estimatePrice(q) {
    var t = q.toLowerCase();
    var isPrimePart = /prime/.test(t) && /(systems|chassis|neuroptics|barrel|receiver|stock|blade|handle|link|barrel|blueprint)/.test(t);
    var isRareMod = false;
    try {
      /* check mod rarity from search index if available */
      if (window.TVAI && window.TVAI._mods) {
        var m = window.TVAI._mods.filter(function (x) { return x.name && x.name.toLowerCase() === t; })[0];
        if (m && /rare|legendary/i.test(m.rarity || '')) isRareMod = true;
      }
    } catch (e) {}
    if (isPrimePart) return 'Prime parts like this typically go for <b>5–20p</b> (vaulted ones more).';
    if (isRareMod) return 'Rare mods like this often fetch <b>20–80p+</b> depending on demand.';
    if (/prime/.test(t)) return 'Prime items usually run <b>10–40p</b> for common parts, more when vaulted.';
    return 'Common items like this usually go for <b>2–10p</b>.';
  }

  function lookupPrice() {
    var q = document.getElementById('plat-input').value.trim();
    var out = document.getElementById('plat-result');
    if (!q) return;
    out.innerHTML = '<div class="loading">Checking live prices…</div>';
    loadMarketIndex().then(function (idx) {
      var urlName = idx[q] || Object.keys(idx).find(function (k) {
        return k.toLowerCase() === q.toLowerCase();
      });
      urlName = urlName ? idx[urlName] || urlName : slugify(q);
      var marketLink = 'https://warframe.market/items/' + encodeURIComponent(urlName);
      var fallback = '<p class="small"><a href="' + marketLink + '" target="_blank" rel="noopener">Open on warframe.market ↗</a></p>';
      var blockedHTML = function () {
        out.innerHTML = '<div class="notice"><b>Automatic price check blocked.</b> ' +
          'warframe.market sometimes blocks automated lookups (bot protection). Check it directly — it takes 5 seconds:</div>' + fallback;
      };
      /* 10s timeout — never leave the spinner hanging */
      var timeout = new Promise(function (_, reject) {
        setTimeout(function () { reject(new Error('timeout')); }, 10000);
      });
      var req = fetch('https://api.warframe.market/v1/items/' + encodeURIComponent(urlName) + '/orders')
        .then(function (r) { if (!r.ok) throw new Error('not found'); return r.json(); });
      return Promise.race([req, timeout])
        .then(function (d) {
          var sells = (d.payload.orders || [])
            .filter(function (o) { return o.order_type === 'sell' && o.user && o.user.status === 'ingame'; })
            .sort(function (a, b) { return a.platinum - b.platinum; })
            .slice(0, 5);
          if (!sells.length) {
            out.innerHTML = '<div class="notice"><b>No in-game sellers right now</b> for <b>' + esc(q) + '</b>.<br>' +
              'Rough estimate: ' + estimatePrice(q) + '<br>' +
              '<span class="muted small">This is an estimate — check live prices before you trade.</span></div>' + fallback;
            return;
          }
          var mid = sells[Math.floor(sells.length / 2)].platinum;
          out.innerHTML = '<div class="detail-box"><h3>' + esc(q) + ' — about <b>' + mid + ' platinum</b></h3>' +
            '<p class="muted small">Cheapest in-game sell orders right now:</p>' +
            sells.map(function (o) {
              return '<div class="mod-row"><div><b>' + o.platinum + 'p</b> × ' + o.quantity + '</div>' +
                '<div class="muted">' + esc(o.user.ingame_name) + '</div></div>';
            }).join('') +
            '<p class="muted small">Live from warframe.market. Prices move — re-check before you trade.</p>' + fallback + '</div>';
        })
        .catch(blockedHTML);
    }).catch(function () {
      out.innerHTML = '<div class="notice"><b>Price check unavailable.</b> Try again in a moment.</div>';
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    if (document.getElementById('live-world')) {
      loadWorld();
      setInterval(loadWorld, 60000);
      /* refresh the "updated Xs ago" label every 10s */
      setInterval(function () {
        var el = document.getElementById('live-updated');
        if (el && lastUpdate) el.textContent = 'Updated ' + timeAgo() + ' · auto-refreshes every minute';
      }, 10000);
    }
    var btn = document.getElementById('plat-btn');
    if (btn) {
      btn.addEventListener('click', lookupPrice);
      document.getElementById('plat-input').addEventListener('keydown', function (e) {
        if (e.key === 'Enter') lookupPrice();
      });
      loadMarketIndex();
    }
  });

  window.TVMarket = { lookupPrice: lookupPrice };
})();
