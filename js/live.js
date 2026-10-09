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

  function renderWorld(d) {
    var html = '<h2>Right now in the Origin System</h2><div class="card-grid">';
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
      return fetch('https://api.warframe.market/v1/items/' + encodeURIComponent(urlName) + '/orders')
        .then(function (r) { if (!r.ok) throw new Error('not found'); return r.json(); })
        .then(function (d) {
          var sells = (d.payload.orders || [])
            .filter(function (o) { return o.order_type === 'sell' && o.user && o.user.status === 'ingame'; })
            .sort(function (a, b) { return a.platinum - b.platinum; })
            .slice(0, 5);
          if (!sells.length) {
            out.innerHTML = '<div class="notice">No in-game sellers right now for <b>' + esc(q) + '</b>. Try again later or check manually:</div>' + fallback;
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
        });
    }).catch(function () {
      out.innerHTML = '<div class="notice"><b>Automatic price check blocked.</b> warframe.market sometimes blocks automated lookups (bot protection). Check it directly — it takes 5 seconds:</div>' + fallback;
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    if (document.getElementById('live-world')) {
      loadWorld();
      setInterval(loadWorld, 60000);
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
