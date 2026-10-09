// Tenno Vault data builder.
// Downloads are already in ../data/*.json (raw warframe-items dumps).
// Run: node tools/build-data.js
// Outputs compact site-ready JSON into ../data/site/*.json
const fs = require('fs');
const path = require('path');

const RAW = path.join(__dirname, '..', 'data');
const OUT = path.join(__dirname, '..', 'data', 'site');
fs.mkdirSync(OUT, { recursive: true });

const read = (f) => JSON.parse(fs.readFileSync(path.join(RAW, f), 'utf8'));
const write = (f, obj) => {
  fs.writeFileSync(path.join(OUT, f), JSON.stringify(obj));
  console.log('wrote', f, JSON.stringify(obj).length, 'bytes');
};
const strip = (s) => String(s || '')
  .replace(/<[^>]*>/g, '')
  .replace(/\|[A-Z_]+\|/g, '')
  .replace(/\s+/g, ' ')
  .trim();
const round2 = (n) => (typeof n === 'number' ? Math.round(n * 100) / 100 : n);

// ---- curated warframe farm locations (most-searched frames) ----
const WARFRAME_FARMS = {
  'Ash': 'Grineer Manic drops (defection / survival missions, e.g. Uranus Ophelia)',
  'Ember': 'General Sargas Ruk — Saturn, Tethys (assassination)',
  'Excalibur': 'Lieutenant Lech Kril — Mars, War (assassination)',
  'Frost': 'Exta, Ceres — Lech Kril + Vor assassination',
  'Gara': 'Cetus bounties (Plains of Eidolon), Earth',
  'Garuda': 'Fortuna bounties (Orb Vallis), Venus',
  'Harrow': 'Chassis: Corrupted Vor (Orokin Void); Neuroptics: Vaults (Orokin Derelict); Systems: Defection (Yursa, Neptune)',
  'Hydroid': 'Corporal Vay Hek — Earth, Everest (assassination)',
  'Ivara': 'Spy missions (all tiers) — chassis/neuroptics/systems from vaults',
  'Khora': 'Sanctuary Onslaught (Cephalon Simaris), any tier',
  'Limbo': 'The Limbo Theorem quest',
  'Mag': 'Sergeant Nef Anyo — Venus, Fossa (assassination)',
  'Mesa': 'Mutalist Alad V coordinates — Eris, Omut Relay key (assassination)',
  'Nekros': 'Lephantis — Deimos, Magnacidium (assassination)',
  'Nezha': 'Tenno Lab research (clan dojo)',
  'Nidus': 'Infested Salvage — Eris, Oestrus (rotation C)',
  'Nova': 'Raptor — Europa, Naamah (assassination)',
  'Nyx': 'Phorid assassination (infested invasion missions)',
  'Oberon': 'Eximus unit drops (any mission)',
  'Octavia': "Octavia's Anthem quest",
  'Revenant': 'Mask of the Revenant quest (Cetus)',
  'Rhino': 'Jackal — Venus, Fossa (assassination)',
  'Saryn': 'Kela De Thaym — Sedna, Merrow (assassination, needs Saryn judgement points)',
  'Titania': 'The Silver Grove quest',
  'Trinity': 'Captain Vor + Lieutenant Lech Kril — Phobos, Iliad (assassination)',
  'Valkyr': 'Alad V — Jupiter, Themisto (assassination)',
  'Vauban': 'Nightwave Credo offerings (rotating)',
  'Volt': 'Tenno Lab research (dojo)',
  'Wisp': 'Ropalolyst assassination — Jupiter',
  'Wukong': 'Tenno Lab research (dojo)',
  'Xaku': 'Deimos bounties (Cambion Drift), Deimos',
  'Zephyr': 'Tenno Lab research (dojo)',
};

// ---- WARFRAMES ----
{
  const raw = read('Warframes.json');
  const out = raw
    .filter((w) => w.name)
    .map((w) => ({
      name: w.name,
      description: strip(w.description),
      health: w.health,
      shield: w.shield,
      armor: w.armor,
      energy: w.power,
      sprint: w.sprintSpeed,
      masteryReq: w.masteryReq || 0,
      passive: strip(w.passiveDescription),
      abilities: (w.abilities || []).map((a) => ({ name: a.name, description: strip(a.description) })),
      farm: WARFRAME_FARMS[w.name] || 'See the in-game Market / Codex for acquisition details.',
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
  write('warframes.json', out);
}

// ---- WEAPONS ----
{
  const out = [];
  for (const [file, type] of [['Primary.json', 'Primary'], ['Secondary.json', 'Secondary'], ['Melee.json', 'Melee']]) {
    const raw = read(file);
    for (const w of raw) {
      if (!w.name) continue;
      out.push({
        name: w.name,
        type,
        description: strip(w.description),
        totalDamage: round2(w.totalDamage),
        criticalChance: round2((w.criticalChance || 0) * 100),
        criticalMultiplier: round2(w.criticalMultiplier),
        statusChance: round2((w.procChance || 0) * 100),
        fireRate: round2(w.fireRate),
        magazine: w.magazineSize,
        reload: w.reloadTime,
        masteryReq: w.masteryReq || 0,
        trigger: w.trigger || null,
        multishot: w.multishot || 1,
      });
    }
  }
  out.sort((a, b) => a.name.localeCompare(b.name));
  write('weapons.json', out);
}

// Curated farm notes for vendor/secret mods that have no drop tables in the data
const VENDOR_DROPS = [
  { match: /^Primed /, location: "Baro Ki'Teer (Void Trader) — Ducats + Credits, visits relays every 2 weeks" },
  { match: /^Galvanized /, location: 'Arbitrations — Arbitration Honors vendor, buy with Vitus Essence' },
  { match: /^Amalgam /, location: 'Ropalolyst assassination — Jupiter' },
  { match: /^Sacrificial /, location: 'Umbra questline rewards / Cephalon Simaris offerings' },
  { match: /^Jolt$/, location: "Baro Ki'Teer (Void Trader) — Ducats + Credits" },
  { match: /^Seeker$/, location: 'Corpus Railjack / specific enemies — see drops' },
];

// ---- MODS ----
{
  const raw = read('Mods.json');
  const out = raw
    .filter((m) => m.name)
    .map((m) => {
      const maxStats = (m.levelStats && m.levelStats[m.levelStats.length - 1].stats) || [];
      const drops = (m.drops || [])
        .slice()
        .sort((a, b) => (b.chance || 0) - (a.chance || 0))
        .slice(0, 6)
        .map((d) => ({ location: d.location, chance: round2(d.chance) }));
      if (drops.length === 0) {
        const v = VENDOR_DROPS.find((x) => x.match.test(m.name));
        if (v) drops.push({ location: v.location, chance: null });
      }
      return {
        name: m.name,
        polarity: m.polarity || null,
        rarity: m.rarity || null,
        type: m.type || null,
        compat: m.compatName || null,
        effect: strip(maxStats.join(' | ')),
        drops,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
  write('mods.json', out);
}

// ---- RELICS (dedupe refinements) ----
const marketIndex = {};
{
  const raw = read('Relics.json');
  const seen = new Map();
  for (const r of raw) {
    const base = String(r.name).replace(/ (Intact|Exceptional|Flawless|Radiant)$/, '');
    if (!seen.has(base)) {
      const tier = /^(Lith|Meso|Neo|Axi|Requiem)/.exec(base);
      seen.set(base, {
        name: base,
        tier: tier ? tier[1] : 'Unknown',
        rewards: (r.rewards || []).map((rw) => {
          const item = rw.item || {};
          const urlName = item.warframeMarket && item.warframeMarket.urlName;
          if (urlName && item.name) marketIndex[item.name] = urlName;
          return { name: item.name, rarity: rw.rarity, urlName: urlName || null };
        }),
      });
    }
  }
  const out = [...seen.values()].sort((a, b) => a.name.localeCompare(b.name));
  write('relics.json', out);
  const idx = Object.keys(marketIndex)
    .sort()
    .reduce((o, k) => ((o[k] = marketIndex[k]), o), {});
  write('market-index.json', idx);
  console.log('market index entries:', Object.keys(idx).length);
}

// ---- ARCANES ----
{
  const raw = read('Arcanes.json');
  const out = raw
    .filter((a) => a.name)
    .map((a) => {
      const maxStats = (a.levelStats && a.levelStats[a.levelStats.length - 1].stats) || [];
      const drops = (a.drops || [])
        .slice()
        .sort((x, y) => (y.chance || 0) - (x.chance || 0))
        .slice(0, 5)
        .map((d) => ({ location: d.location, chance: round2(d.chance) }));
      return {
        name: a.name,
        type: a.type || null,
        rarity: a.rarity || null,
        maxRank: (a.levelStats || []).length || null,
        effect: strip(maxStats.join(' | ')),
        drops,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
  write('arcanes.json', out);
}

// ---- SEARCH INDEX (compact, for site-wide search) ----
{
  const idx = [];
  const push = (t, n, d, u) => idx.push({ t, n, d: strip(d).slice(0, 140), u });
  for (const w of read('site/warframes.json')) push('Warframe', w.name, w.description, 'warframes.html#' + encodeURIComponent(w.name));
  for (const w of read('site/weapons.json')) push(w.type + ' weapon', w.name, w.description, 'weapons.html#' + encodeURIComponent(w.name));
  for (const m of read('site/mods.json')) push('Mod', m.name, m.effect, 'mods.html#' + encodeURIComponent(m.name));
  for (const a of read('site/arcanes.json')) push('Arcane', a.name, a.effect, 'arcanes.html#' + encodeURIComponent(a.name));
  for (const r of read('site/relics.json')) push('Relic', r.name, r.tier + ' relic — ' + r.rewards.slice(0, 3).map((x) => x.name).join(', '), 'relics.html#' + encodeURIComponent(r.name));
  for (const b of read('site/builds.json')) push('Build', b.name, b.description, 'builds.html#' + b.id);
  const amps = read('site/amps.json');
  for (const p of [...amps.prisms, ...amps.scaffolds, ...amps.braces]) push('Amp part', p.name, p.effect, 'amps.html');
  for (const c of amps.combos) push('Amp combo', c.combo + ' ' + c.name, c.why, 'amps.html');
  const ops = read('site/operators.json');
  for (const s of ops.schools) push('Focus school', s.name, s.description, 'operators.html');
  for (const a of ops.arcanes) push('Operator arcane', a.name, a.effect, 'operators.html');
  write('search-index.json', idx);
  console.log('search index entries:', idx.length);
}

console.log('done');
