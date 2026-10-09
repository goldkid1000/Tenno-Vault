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
      TV.getJSONParts('data/site/mods', 9),
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

  /* drop leading "the/a/an" so "is the kuva bramma good" still matches */
  function stripArticles(s) { return norm(s).replace(/^(the|a|an)\s+/, ''); }

  /* escape + turn literal \n sequences in data into line breaks */
  function fmtText(s) {
    return esc(s).replace(/\\n/g, '<br>');
  }

  /* levenshtein distance for typo tolerance */
  function lev(a, b) {
    var m = a.length, n = b.length;
    if (!m) return n; if (!n) return m;
    var d = [], i, j;
    for (i = 0; i <= m; i++) d[i] = [i];
    for (j = 0; j <= n; j++) d[0][j] = j;
    for (i = 1; i <= m; i++) for (j = 1; j <= n; j++)
      d[i][j] = Math.min(d[i-1][j]+1, d[i][j-1]+1, d[i-1][j-1] + (a[i-1]===b[j-1]?0:1));
    return d[m][n];
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
    /* fuzzy: allow 1-2 typos on names of similar length */
    var best = null, bestD = 3;
    for (i = 0; i < list.length; i++) {
      n = norm(list[i].name);
      if (Math.abs(n.length - q.length) > 2) continue;
      var dd = lev(n, q);
      if (dd < bestD) { bestD = dd; best = list[i]; }
    }
    return best;
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
    return 'Good pick — here\'s the <b>' + esc(b.name || b.item) + '</b> setup:' +
      (window.TV.badge ? ' ' + window.TV.badge(b.tags || []) : '') +
      '<p>' + fmtText(b.description || '') + '</p>' +
      (mods ? '<p><b>Mods:</b> ' + mods + '</p>' : '') +
      (b.arcane ? '<p><b>Arcane:</b> ' + esc(b.arcane) + '</p>' : '') +
      '<p class="muted small">Want to know where to farm any of these mods? Just ask.</p>' +
      '<p><a href="builds.html#build-' + encodeURIComponent(b.id) + '">Open the full build &rarr;</a></p>';
  }

  function farmAnswer(f) {
    var e = f.e;
    var itemLabel = e.name || e.what || 'it';
    /* build offer only makes sense for gear, not raw resources */
    var buildOffer = (f.kind === 'spot')
      ? ''
      : '<p class="muted small">Want a build for it once you have it? Just ask <i>"make me a ' +
        esc(itemLabel) + ' build"</i>.</p>';
    if (f.kind === 'warframe') {
      return 'Good pick — here\'s where to get <b>' + esc(e.name) + '</b>:<p><b>📍 Farm:</b> ' + esc(e.farm) + '</p>' +
        buildOffer +
        '<p><a href="' + link('warframes.html', e.name) + '">Warframe page &rarr;</a></p>';
    }
    if (f.kind === 'mod') {
      return 'Here\'s where <b>' + esc(e.name) + '</b> drops:<p><b>📍 Farm:</b> ' + esc(fmtDrops(e.drops)) + '</p>' +
        buildOffer +
        '<p><a href="' + link('mods.html', e.name) + '">Mod page &rarr;</a></p>';
    }
    if (f.kind === 'arcane') {
      var aloc = fmtDrops(e.drops);
      return '<b>' + esc(e.name) + '</b>' +
        (aloc ? '<p><b>📍 Farm:</b> ' + esc(aloc) + '</p>' : '<p>Farm info coming — check the arcane page for now.</p>') +
        buildOffer +
        '<p><a href="' + link('arcanes.html', e.name) + '">Arcane page &rarr;</a></p>';
    }
    if (f.kind === 'relic') {
      return '<b>' + esc(e.name) + '</b> (' + esc(e.tier) + ' relic)<p>📍 Crack it in <b>Void Fissure</b> missions — ' +
        'relics drop from endless missions (survival/defense), bounties, and Void captures.</p>' +
        buildOffer +
        '<p><a href="' + link('relics.html', e.name) + '">Relic page &rarr;</a></p>';
    }
    if (f.kind === 'spot') {
      return 'You\'ll find <b>' + esc(e.what) + '</b> here:<p><b>📍 Farm:</b> ' + esc(e.source) + '</p>' +
        buildOffer +
        '<p><a href="farming.html">Farming Hub &rarr;</a></p>';
    }
    if (f.kind === 'weapon-relic') {
      var rows = f.hits.map(function (h) {
        return '<li><a href="' + link('relics.html', h.relic.name) + '">' + esc(h.relic.name) +
          '</a> <span class="muted small">' + esc(h.relic.tier) + ' · ' + esc(h.reward.rarity) + '</span></li>';
      }).join('');
      return 'To get <b>' + esc(e.name) + '</b>, crack these relics in Void Fissures:<ul>' +
        rows + '</ul>' + buildOffer +
        '<p><a href="' + link('weapons.html', e.name) + '">Weapon page &rarr;</a></p>';
    }
    return '<b>' + esc(e.name) + '</b><p>The Vault doesn\'t list a farm spot for this one yet — ' +
      'the in-game Codex will have the latest source.</p>' +
      buildOffer +
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
    if (!picks.length) return 'Hmm, no Steel Path builds in the Vault yet — but ask me <i>"make me a [frame/weapon] Steel Path build"</i> and I\'ll generate one for you on the spot.';
    var rows = picks.map(function (b) {
      return '<li><a href="builds.html#build-' + encodeURIComponent(b.id) + '"><b>' + esc(b.name || b.item) +
        '</b></a> <span class="muted small">' + esc(b.item) + '</span> ' +
        (window.TV.badge ? window.TV.badge(b.tags || []) : '') + '</li>';
    }).join('');
    return 'Here are the Vault\'s <b>Steel Path / one-shot builds</b> — these delete high-level enemies:<ul>' + rows + '</ul>' +
      '<p class="muted small">Don\'t see your favorite? Ask <i>"make me a [frame] Steel Path build"</i> and I\'ll whip one up.</p>' +
      '<p><a href="builds.html">All builds &rarr;</a></p>';
  }

  function sellAnswer() {
    return 'Selling for platinum is easier than it looks. Here\'s the loop:' +
      '<p><b>1.</b> Farm <b>prime parts</b> from Void Relics (crack them in fissure missions).<br>' +
      '<b>2.</b> List them on <b>warframe.market</b> — check the Live tab\'s price checker first so you don\'t undersell.<br>' +
      '<b>3.</b> Meet the buyer in-game and trade at a relay or your clan dojo.</p>' +
      '<p class="muted small">Pro tip: vaulted relics and rare mods fetch the most. Good luck out there, Tenno. 💰</p>' +
      '<p><a href="trading.html">Full trading guide &rarr;</a></p>';
  }

  function beginnerAnswer() {
    return 'Welcome to Warframe, Tenno! 🎉 Here\'s the short version of what to do first:' +
      '<p><b>1.</b> Pick <b>Excalibur</b> as your starter frame — simple, strong, forgiving.<br>' +
      '<b>2.</b> Clear the <b>star chart</b> planet by planet and open <b>junctions</b> — that\'s your main progression.<br>' +
      '<b>3.</b> Do the early <b>quests</b> (Vor\'s Prize → Once Awake → The Archwing) — they unlock core systems.<br>' +
      '<b>4.</b> Level <b>mods</b>, not just gear — a ranked-up Serration matters more than a new rifle.<br>' +
      '<b>5.</b> Don\'t stress about builds yet — just ask me <i>"make me an Excalibur build"</i> when you\'re ready.</p>' +
      '<p><a href="index.html#beginner-guide">Full New Player Guide &rarr;</a></p>';
  }

  function helpAnswer() {
    return 'Here\'s what I can do for you, Tenno:' +
      '<ul><li>🛠 <b>Build anything</b> — <i>"make me a Nova Prime Steel Path build"</i></li>' +
      '<li>📍 <b>Find anything</b> — <i>"where do I farm Argon Crystals"</i></li>' +
      '<li>❓ <b>Explain mods & arcanes</b> — <i>"what does Hunter Munitions do"</i></li>' +
      '<li>💥 <b>Steel Path picks</b> — <i>"best Steel Path builds"</i></li>' +
      '<li>💰 <b>Platinum trading</b> — <i>"how do I sell for platinum"</i></li>' +
      '<li>🌱 <b>New player help</b> — <i>"I\'m new, what should I do first"</i></li></ul>' +
      '<p class="muted small">I\'m the Vault\'s built-in guide — I answer from the Vault\'s own data, not a live AI. ' +
      'But I\'ll always try to get you something useful.</p>';
  }

  function fallbackAnswer(q) {
    var hits = D.index.filter(function (e) {
      return e.n && norm(e.n).indexOf(norm(q)) !== -1;
    }).slice(0, 5);
    if (!hits.length) {
      return 'Hmm, I don\'t have anything called "' + esc(q) + '" in the Vault. 🤔 ' +
        'Double-check the spelling — or try asking about a warframe, weapon, mod, arcane, or relic. ' +
        'You can also ask <i>"help"</i> to see everything I can do.';
    }
    var rows = hits.map(function (h) {
      return '<li><a href="' + esc(h.u) + '"><b>' + esc(h.n) + '</b></a> ' +
        '<span class="muted small">' + esc(h.t) + '</span></li>';
    }).join('');
    return 'I didn\'t quite catch that — did you mean one of these?<ul>' + rows + '</ul>' +
      '<p class="muted small">Or rephrase — I\'m best with things like <i>"make me a Rhino build"</i> or <i>"where do I farm Orokin Cells"</i>.</p>';
  }

/* ---------- GENERATIVE BUILD ENGINE ----------
   Generates complete 8-mod loadouts on the spot for ANY warframe or weapon.
   Picks mods based on the item's actual stats + requested purpose. */

function findModExact(name) {
  var q = norm(name);
  for (var i = 0; i < D.mods.length; i++) {
    if (norm(D.mods[i].name) === q) return D.mods[i];
  }
  return null;
}

/* pick a mod, return {mod, reason} or null if not in DB */
function pick(name, reason) {
  var m = findModExact(name);
  if (!m) return null;
  return { mod: m, reason: reason };
}

function modFarmLine(m) {
  var d = fmtDrops(m.drops);
  return d ? '<span class="muted small">Farm: ' + esc(d) + '</span>' : '';
}

function renderLoadout(title, itemName, picks, notes, page, purpose) {
  var rows = picks.map(function (p, i) {
    return '<div class="mod-row"><div><b>' + (i + 1) + '. ' + esc(p.mod.name) + '</b>' +
      '<div class="muted small">' + esc(p.reason) + '</div>' + modFarmLine(p.mod) + '</div></div>';
  }).join('');
  var cheer = purpose && purpose.steelPath
    ? 'This\'ll shred Steel Path. 💪'
    : purpose && purpose.oneShot
    ? 'This thing\'s going to delete enemies. Enjoy. 💥'
    : 'Solid setup — you\'ll feel the difference right away. 👍';
  return '<b>' + esc(title) + '</b> <span class="muted small">generated for ' + esc(itemName) + '</span>' +
    '<p>' + cheer + '</p>' +
    rows +
    (notes ? '<p class="muted small">' + notes + '</p>' : '') +
    '<p class="muted small">Want to know where to farm any of these mods? Just ask <i>"where do I farm ' +
    esc(picks[0] ? picks[0].mod.name : 'this mod') + '"</i>.</p>' +
    '<p><a href="' + link(page, itemName) + '">Full ' + esc(itemName) + ' page &rarr;</a> · ' +
    '<a href="builds.html">Curated builds &rarr;</a></p>';
}

/* ===== WARFRAME BUILD GENERATOR ===== */
function genWarframeBuild(frame, purpose) {
  var picks = [];
  var armor = frame.armor || 0, energy = frame.energy || 150;

  function add(name, reason) {
    if (picks.length >= 8) return;
    var p = pick(name, reason);
    if (p && !picks.some(function (x) { return x.mod.name === p.mod.name; })) picks.push(p);
  }

  /* core survivability */
  add('Vitality', 'Core survivability — more health keeps you alive through burst damage.');
  if (armor >= 150) add('Steel Fiber', 'Your ' + armor + ' base armor makes this huge — armor scales your effective health.');
  else add('Redirection', 'Boosts shields since your base armor is low.');

  /* ability stats */
  add('Intensify', 'Ability Strength powers up everything ' + frame.name + ' does.');
  add(purpose.beginner ? 'Continuity' : 'Primed Continuity', 'Ability Duration — longer buffs, longer CC, less recasting.');
  if (energy <= 175) add(purpose.beginner ? 'Flow' : 'Primed Flow', 'Bigger energy pool so you can actually cast.');
  add('Stretch', 'Ability Range — hits more enemies, covers more ground.');

  /* purpose-specific */
  if (purpose.steelPath) {
    add('Adaptation', 'Steel Path essential — stacking damage resistance keeps you alive at high levels.');
    add('Rolling Guard', 'Brief invulnerability on dodge — dodges one-shots in Steel Path.');
  }
  if (purpose.oneShot) {
    add('Blind Rage', 'Massive Ability Strength for one-shot ability damage (watch the efficiency hit).');
    add('Transient Fortitude', 'More strength for the nuke — pair with Fleeting Expertise if energy suffers.');
  }
  /* fill remaining */
  add('Augur Secrets', 'Extra strength plus shield-gating synergy.');
  add('Fleeting Expertise', 'Efficiency for spamming abilities.');
  add('Natural Talent', 'Faster casting — less time vulnerable mid-animation.');
  add('Cunning Drift', 'Slide + range in one slot.');
  add('Constitution', 'Duration plus faster knockdown recovery.');

  var notes = purpose.steelPath
    ? 'Steel Path tip: shield-gating (brief shield regen = invulnerability) matters more than raw health at high levels. Rolling Guard + Adaptation is the standard survival package.'
    : 'Level the mods as you get Endo — even rank 6-8 mods carry you through the star chart.';
  return renderLoadout(frame.name + ' build', frame.name, picks,
    notes + ' Shard/arcane picks depend on your focus school — check the full page.', 'warframes.html', purpose);
}

/* ===== WEAPON BUILD GENERATOR ===== */
function weaponClass(w) {
  var t = (w.type || '').toLowerCase();
  if (t.indexOf('melee') !== -1) return 'melee';
  if (t.indexOf('secondary') !== -1 || t.indexOf('pistol') !== -1 || t.indexOf('shotgun') !== -1 && w.slot === 1) return 'secondary';
  return 'primary';
}

function genWeaponBuild(weapon, purpose) {
  var picks = [];
  var cls = weaponClass(weapon);
  var cc = parseFloat(weapon.criticalChance) || 0;
  var sc = parseFloat(weapon.statusChance) || 0;
  var isCrit = cc >= 18, isStatus = sc >= 18;

  function add(name, reason) {
    if (picks.length >= 8) return;
    var p = pick(name, reason);
    if (p && !picks.some(function (x) { return x.mod.name === p.mod.name; })) picks.push(p);
  }

  if (cls === 'melee') {
    add(purpose.steelPath ? 'Primed Pressure Point' : 'Pressure Point', 'Base damage — the foundation of every melee build.');
    if (isCrit) {
      add('Blood Rush', 'Your ' + cc + '% crit chance makes this scale insanely with your combo counter.');
      add('Organ Shatter', 'Crit damage multiplier — pairs with Blood Rush.');
    }
    if (isStatus || purpose.steelPath) {
      add('Weeping Wounds', 'Status chance that scales with combo — ' + sc + '% base loves this.');
      add('Condition Overload', 'Steel Path king — +damage per status type on the enemy.');
    }
    add('Fury', 'Attack speed — more hits per second, faster combo building.');
    add('Primed Reach', 'Range — hit more enemies per swing.');
    /* elements */
    add('Voltaic Strike', 'Electric 60/60 — pairs toward Corrosive (anti-armor).');
    add('Vicious Frost', 'Cold 60/60 — completes Corrosive, the Steel Path meta element.');
    add('Gladiator Might', 'Crit damage + combo duration backup.');
    add('Drifting Contact', 'Combo duration — keeps your counter alive between packs.');
  } else {
    var dmgMod = cls === 'secondary' ? 'Hornet Strike' : 'Serration';
    var msMod = cls === 'secondary' ? 'Barrel Diffusion' : 'Split Chamber';
    var galvMs = cls === 'secondary' ? 'Galvanized Shot' : 'Galvanized Chamber';
    var critC = cls === 'secondary' ? 'Primed Pistol Gambit' : 'Point Strike';
    var critD = cls === 'secondary' ? 'Primed Target Cracker' : 'Vital Sense';

    add(dmgMod, 'Base damage — every gun build starts here.');
    add(purpose.steelPath ? galvMs : msMod, purpose.steelPath
      ? 'Galvanized multishot — stacks on kill, the Steel Path standard.'
      : 'Multishot — more projectiles per trigger pull.');
    if (isCrit) {
      add(critC, 'Your ' + cc + '% crit chance wants this.');
      add(critD, 'Crit damage to cash in on those crits.');
      if (purpose.steelPath || purpose.oneShot) {
        var hm = pick('Hunter Munitions', 'The one-shot engine — crits apply Slash procs that bypass armor.');
        if (hm) picks.push(hm);
      }
    }
    if (isStatus || !isCrit) {
      add(cls === 'secondary' ? 'Pistol Pestilence' : 'Malignant Force', 'Toxin 60/60 — start of the Viral combo.');
      add(cls === 'secondary' ? 'Frostbite' : 'Rime Rounds', 'Cold 60/60 — Viral (Toxin+Cold) is the meta element.');
    } else {
      add(cls === 'secondary' ? 'Jolt' : 'Stormbringer', 'Electric for Corrosive, or swap to Viral 60/60s vs flesh.');
      add(cls === 'secondary' ? 'Scorch' : 'Infected Clip', 'Toxin for Corrosive/Viral flexibility.');
    }
    if (purpose.steelPath) {
      var bane = pick('Primed Bane of Grineer', 'Faction damage — the biggest Steel Path multiplier, swap per faction.');
      if (bane) picks.push(bane);
      else add(cls === 'secondary' ? 'Lethal Torrent' : 'Shred', 'Fire rate / punch-through utility.');
    }
    add(cls === 'secondary' ? 'Lethal Torrent' : 'Vigilante Armaments', 'Fire rate or more multishot — pick your feel.');
  }

  var notes = purpose.steelPath
    ? 'Steel Path notes: Viral + Hunter Munitions slash procs bypass armor — that\'s the one-shot formula. Swap the faction Bane mod per mission.'
    : 'Level these gradually — a half-ranked core build beats a wishlist of unranked mods.';
  return renderLoadout(weapon.name + ' build', weapon.name, picks, notes, 'weapons.html', purpose);
}

/* extract item name + purpose from a build question */
function parseBuildQ(t) {
  var purpose = {
    steelPath: /steel\s?path/.test(t),
    oneShot: /one[\s-]?shot/.test(t),
    beginner: /beginner|starter|early|new player/.test(t)
  };
  /* strip build-related words to isolate the item name */
  var q = t
    .replace(/^(can you |please |hey |hi )?make( me)?/,'')
    .replace(/\b(a|an|the)\b/g,' ')
    .replace(/\b(build|setup|loadout)\b/g,' ')
    .replace(/\bfor\b/g,' ')
    .replace(/\b(best|strongest|good|top)\b/g,' ')
    .replace(/\bsteel\s?path\b/g,' ')
    .replace(/\bone[\s-]?shot\b/g,' ')
    .replace(/\bbeginner|starter|early\b/g,' ')
    .replace(/\?+$/,'')
    .replace(/\s+/g,' ').trim();
  return { name: q, purpose: purpose };
}

/* no specific item named — recommend something useful instead of dead-ending.
   "what's a good beginner warframe build" -> Rhino starter build + curated list. */
function genericBuildAnswer(t, purpose) {
  var isBeginner = purpose.beginner || /\b(beginner|starter|new player|just started)\b/.test(t);
  if (/steel/.test(t)) return steelPathAnswer();
  if (isBeginner) {
    var rhino = findByName(D.warframes, 'rhino');
    var gb = rhino ? genWarframeBuild(rhino, { beginner: true }) : null;
    var curated = D.builds.filter(function (b) { return (b.tags || []).indexOf('beginner') !== -1; }).slice(0, 5);
    var rows = curated.map(function (b) {
      return '<li><a href="builds.html#build-' + encodeURIComponent(b.id) + '"><b>' +
        esc(b.name || b.item) + '</b></a> <span class="muted small">' + esc(b.item || '') + '</span></li>';
    }).join('');
    return 'Great question — for a beginner you can\'t go wrong with <b>Rhino</b>. ' +
      'Iron Skin makes you nearly unkillable while you\'re learning the game. Here\'s a starter build for him:' +
      (gb ? gb.replace(/^<b>[^<]+<\/b> <span[^>]+>[^<]+<\/span>/, '') : '') +
      (rows ? '<p>More starter builds in the Vault:</p><ul>' + rows + '</ul>' : '') +
      '<p class="muted small">Want one for a specific frame? Just ask <i>"make me an Excalibur build"</i>.</p>' +
      '<p><a href="builds.html">All builds &rarr;</a></p>';
  }
  /* generic "give me a warframe/weapon build" — show strong curated picks */
  var picks = D.builds.filter(function (b) { return (b.tags || []).indexOf('strong') !== -1; }).slice(0, 6);
  if (!picks.length) picks = D.builds.slice(0, 6);
  var rows2 = picks.map(function (b) {
    return '<li><a href="builds.html#build-' + encodeURIComponent(b.id) + '"><b>' +
      esc(b.name || b.item) + '</b></a> <span class="muted small">' + esc(b.item || '') + '</span> ' +
      (window.TV.badge ? window.TV.badge(b.tags || []) : '') + '</li>';
  }).join('');
  return 'Here are some of the Vault\'s most popular builds to get you started:<ul>' + rows2 + '</ul>' +
    '<p class="muted small">Or name a frame/weapon and I\'ll generate a build on the spot — ' +
    'try <i>"make me a Saryn build"</i>.</p>' +
    '<p><a href="builds.html">All builds &rarr;</a></p>';
}

function findItemForBuild(q) {
  var w = findByName(D.warframes, q);
  if (w) return { kind: 'warframe', e: w };
  var wp = findByName(D.weapons, q);
  if (wp) return { kind: 'weapon', e: wp };
  return null;
}

/* find any known item name appearing anywhere inside a longer question.
   Longest names first so "Nova Prime" beats "Nova". */
function findItemInText(list, t) {
  var best = null, bestLen = 0;
  for (var i = 0; i < list.length; i++) {
    var n = norm(list[i].name);
    if (n.length >= 4 && n.length > bestLen && t.indexOf(n) !== -1) {
      best = list[i]; bestLen = n.length;
    }
  }
  return best;
}

/* main entry: generate a build for any item */
function generateBuild(t) {
  var parsed = parseBuildQ(t);
  var found = findItemForBuild(parsed.name);
  if (!found) {
    /* try the raw question in case parsing stripped too much */
    found = findItemForBuild(t.replace(/\b(build|make|for|me|a|please)\b/g,' ').replace(/\s+/g,' ').trim());
  }
  if (!found) return null;
  if (found.kind === 'warframe') return genWarframeBuild(found.e, parsed.purpose);
  return genWeaponBuild(found.e, parsed.purpose);
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
    /* BUILD INTENT — catch this FIRST, before anything else. If the player wants
       a build for a specific item, generate it. Handles: "make me a nova prime
       steelpath build", "wisp prime one shot", "rhino build", etc. */
    var buildIntent = /\b(build|make|setup|loadout|steel\s?path|one[\s-]?shot)\b/.test(t);
    if (buildIntent) {
      var bp = parseBuildQ(t);
      if (bp.name.length >= 3) {
        var bf = findItemForBuild(bp.name);
        if (bf) {
          return bf.kind === 'warframe'
            ? genWarframeBuild(bf.e, bp.purpose)
            : genWeaponBuild(bf.e, bp.purpose);
        }
      }
      /* item name might be embedded without clear build words stripped right —
         try matching any known warframe/weapon name appearing in the question */
      var fw2 = findItemInText(D.warframes, t);
      if (fw2) return genWarframeBuild(fw2, { steelPath: /steel/.test(t), oneShot: /one/.test(t) });
      var wp2 = findItemInText(D.weapons, t);
      if (wp2) return genWeaponBuild(wp2, { steelPath: /steel/.test(t), oneShot: /one/.test(t) });
      /* no specific item found — recommend instead of dead-ending */
      return genericBuildAnswer(t, bp.purpose);
    }
    if (/\bi'?m new\b/.test(t) || /\bnew player\b/.test(t) || /\bjust started\b/.test(t) ||
        /\bwhat should i do first\b/.test(t) || /\bwhere do i start\b/.test(t) ||
        /\bbeginner (guide|tips|help)\b/.test(t)) {
      return beginnerAnswer();
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
      return 'Hmm, I don\'t know a mod or arcane called "' + esc(thing) + '". 🤔 ' +
        'Check the spelling — or browse the <a href="mods.html">mods list</a> to find it.';
    }

    m = t.match(/^(?:where (?:do|can) i (?:farm|get|find)|where to (?:farm|get|find)|how do i (?:get|farm|obtain|find)|how to (?:get|farm|obtain|find)|farm|get|find) (.+)$/);
    if (m) {
      var f = findFarm(m[1]);
      if (f) return farmAnswer(f);
      return 'Hmm, I couldn\'t find a farm spot for "' + esc(m[1]) + '" in the Vault. ' +
        'Try the full item name — or check the <a href="farming.html">Farming Hub</a> for resource spots.';
    }

    m = t.match(/^is (.+?) good(?: for (.+?))?$/) || t.match(/^how (?:is|good is) (.+?)(?: for (.+?))?$/);
    if (m) {
      var itemQ = stripArticles(m[1]), ctx = m[2] || '';
      var fw = findByName(D.warframes, itemQ);
      var fp = findByName(D.weapons, itemQ);
      var it = fw || fp;
      if (it) {
        var isSP = /steel/.test(ctx) || /steel/.test(t);
        var verdict = isSP
          ? 'Oh yeah — <b>' + esc(it.name) + '</b> can absolutely hang in Steel Path with the right build. 💪 '
          : '<b>' + esc(it.name) + '</b>? Solid pick, Tenno. ';
        var genQ = it.name + ' build' + (isSP ? ' steel path' : '');
        var gb = generateBuild(genQ);
        return verdict + 'Here\'s a build to make it shine:' +
          (gb ? gb.replace(/^<b>[^<]+<\/b> <span[^>]+>[^<]+<\/span>(<p>[^<]*<\/p>)?/, '') : '') +
          '<p class="muted small">Want the farm location too? Just ask <i>"where do I get ' + esc(it.name) + '"</i>.</p>';
      }
    }

    m = t.match(/^(?:best |strongest )?(.+?) build$/) || t.match(/^(?:best |strongest )?build for (.+)$/) ||
        t.match(/^make(?: me)?(?: a)? (.+?) build$/) || t.match(/^(?:can you )?make(?: me)? (.+)$/);
    if (m) {
      /* try curated build first, then GENERATE one */
      var b = findBuild(m[1]);
      if (b) return buildAnswer(b);
      var gen = generateBuild(t);
      if (gen) return gen;
      /* last resort: suggest closest */
      var sug = findItemForBuild(m[1]) || findItemForBuild(t);
      if (sug) return generateBuild(sug.e.name + ' build');
      return 'Hmm, I couldn\'t pin down which item you mean. 🤔 Try the full name — like <i>"Nova Prime build"</i> or <i>"Kuva Zarr build"</i>. ' +
        'Or ask <i>"help"</i> to see what I can do.';
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
      addMsg('Hey Tenno! ◈ Welcome to the Vault — I\'m your built-in guide. ' +
        'Ask me to <b>build</b> something ("make me a Nova Prime Steel Path build"), ' +
        'tell you <b>where to farm</b> anything ("where do I find Argon Crystals"), ' +
        'or explain <b>mods, arcanes, and platinum trading</b>. What are you working on?', 'bot');
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
