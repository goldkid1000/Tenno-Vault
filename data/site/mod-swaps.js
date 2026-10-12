/* Tenno Vault — Mod Equivalents data.
   "Don't have X? Use Y instead" — for damage, one-shots, and Steel Path.
   Each entry: the best-in-slot mod, then alternatives ranked by effectiveness. */

var MOD_SWAPS = [
  {
    category: "Rifle Damage",
    icon: "🔫",
    desc: "Base damage mods for rifles — the foundation of every build",
    swaps: [
      {
        best: "Serration",
        bestNote: "+165% damage. The standard.",
        alternatives: [
          { mod: "Primed Serration", note: "+220% damage. Baro Ki'Teer. Strict upgrade.", effectiveness: 133 },
          { mod: "Amalgam Serration", note: "+155% damage + sprint speed. Slightly weaker but faster.", effectiveness: 94 }
        ]
      },
      {
        best: "Split Chamber",
        bestNote: "+90% multishot. Non-negotiable on rifles.",
        alternatives: [
          { mod: "Primed Split Chamber", note: "Doesn't exist — Split Chamber IS the best. No alternative needed.", effectiveness: 100 },
          { mod: "Vigilante Armaments", note: "+60% multishot. Use if you need the set bonus.", effectiveness: 67 }
        ]
      }
    ]
  },
  {
    category: "Shotgun Damage",
    icon: "💥",
    desc: "Base damage for shotguns — Felarx, Hek, etc.",
    swaps: [
      {
        best: "Point Blank",
        bestNote: "+165% damage.",
        alternatives: [
          { mod: "Primed Point Blank", note: "+220% damage. Baro Ki'Teer. The one-shot standard.", effectiveness: 133 }
        ]
      },
      {
        best: "Hell's Chamber",
        bestNote: "+120% multishot.",
        alternatives: [
          { mod: "Primed Hell's Chamber", note: "Doesn't exist — regular is best-in-slot.", effectiveness: 100 },
          { mod: "Vigilante Armaments", note: "+60% multishot. Weaker but works.", effectiveness: 50 }
        ]
      }
    ]
  },
  {
    category: "Crit Mods (One-Shot Core)",
    icon: "🎯",
    desc: "Crit chance + crit damage — the heart of one-shot builds",
    swaps: [
      {
        best: "Point Strike",
        bestNote: "+150% crit chance (rifles).",
        alternatives: [
          { mod: "Primed Point Strike", note: "Doesn't exist for rifles. Point Strike is it.", effectiveness: 100 },
          { mod: "Critical Delay", note: "+200% crit chance, -20% fire rate. Better crit, slower. Great for one-shots.", effectiveness: 133 }
        ]
      },
      {
        best: "Vital Sense",
        bestNote: "+120% crit damage (rifles).",
        alternatives: [
          { mod: "Primed Vital Sense", note: "Doesn't exist. Vital Sense is best.", effectiveness: 100 },
          { mod: "Hammer Shot", note: "+60% crit damage +60% status. Weaker crit, adds status.", effectiveness: 50 }
        ]
      },
      {
        best: "Blunderbuss (shotguns)",
        bestNote: "+90% crit chance.",
        alternatives: [
          { mod: "Primed Blunderbuss", note: "+135% crit chance. Baro. Massive upgrade for crit shotguns.", effectiveness: 150 },
          { mod: "Critical Deceleration", note: "+200% crit chance, -20% fire rate. Best for one-shot Felarx.", effectiveness: 222 }
        ]
      },
      {
        best: "Ravage (shotguns)",
        bestNote: "+110% crit damage.",
        alternatives: [
          { mod: "Primed Ravage", note: "+165% crit damage. Baro. Essential for one-shot shotguns.", effectiveness: 150 }
        ]
      }
    ]
  },
  {
    category: "Melee Damage",
    icon: "⚔️",
    desc: "The big three for melee one-shots",
    swaps: [
      {
        best: "Pressure Point",
        bestNote: "+120% melee damage.",
        alternatives: [
          { mod: "Primed Pressure Point", note: "+165% damage. Baro/Login reward. Huge upgrade.", effectiveness: 138 },
          { mod: "Spoiled Strike", note: "+100% damage, -20% attack speed. NOT worth it for one-shots.", effectiveness: 83 }
        ]
      },
      {
        best: "Blood Rush",
        bestNote: "+440% crit chance at 12x combo. Core of every melee build.",
        alternatives: [
          { mod: "No alternative", note: "Nothing replaces Blood Rush. Farm it from Lua spies.", effectiveness: 0 }
        ]
      },
      {
        best: "Organ Shatter",
        bestNote: "+90% crit damage.",
        alternatives: [
          { mod: "Primed Organ Shatter", note: "Doesn't exist. Regular is best.", effectiveness: 100 }
        ]
      },
      {
        best: "Weeping Wounds",
        bestNote: "+660% status at 12x combo.",
        alternatives: [
          { mod: "No alternative", note: "Unique effect. Essential for status melee.", effectiveness: 0 }
        ]
      }
    ]
  },
  {
    category: "Warframe Ability Strength",
    icon: "💪",
    desc: "For Nova nukes, Rhino buffs, and every ability DPS frame",
    swaps: [
      {
        best: "Intensify",
        bestNote: "+30% ability strength.",
        alternatives: [
          { mod: "Primed Intensify", note: "Doesn't exist. Use Umbral Intensify instead.", effectiveness: 100 },
          { mod: "Umbral Intensify", note: "+44% strength (+55% with full Umbral set). The upgrade.", effectiveness: 147 },
          { mod: "Transient Fortitude", note: "+55% strength, -27.5% duration. Great for nuke frames.", effectiveness: 183 },
          { mod: "Blind Rage", note: "+99% strength, -55% efficiency. For max-strength one-shot builds.", effectiveness: 330 }
        ]
      },
      {
        best: "Augur Secrets",
        bestNote: "+24% strength. Easy to get.",
        alternatives: [
          { mod: "No direct alternative", note: "Stacks with Intensify. Use both.", effectiveness: 0 }
        ]
      }
    ]
  },
  {
    category: "Steel Path Essentials",
    icon: "🛡️",
    desc: "Survivability mods that make Steel Path bearable",
    swaps: [
      {
        best: "Adaptation",
        bestNote: "Up to 90% damage resistance. Arbitrations.",
        alternatives: [
          { mod: "No alternative", note: "Nothing else does this. Farm Arbitrations ASAP.", effectiveness: 0 },
          { mod: "Rolling Guard", note: "3s invulnerability on dodge. Different but great.", effectiveness: 80 }
        ]
      },
      {
        best: "Vitality",
        bestNote: "+440% health.",
        alternatives: [
          { mod: "Primed Vitality", note: "+440% health (same, less drain). Baro.", effectiveness: 100 },
          { mod: "Umbral Vitality", note: "+770% health with full Umbral set. The tank standard.", effectiveness: 175 },
          { mod: "Vigor", note: "+220% health + shields. Weaker, but cheap.", effectiveness: 50 }
        ]
      },
      {
        best: "Steel Fiber",
        bestNote: "+110% armor.",
        alternatives: [
          { mod: "Primed Steel Fiber", note: "Doesn't exist. Regular is fine.", effectiveness: 100 },
          { mod: "Umbral Fiber", note: "+160% armor with Umbral set. Better for Umbral builds.", effectiveness: 145 }
        ]
      }
    ]
  },
  {
    category: "One-Shot Enablers",
    icon: "☠️",
    desc: "The mods that make one-shots possible",
    swaps: [
      {
        best: "Hunter Munitions",
        bestNote: "Crits apply Slash procs. The one-shot engine for rifles/shotguns.",
        alternatives: [
          { mod: "No alternative", note: "Nothing else does this. Ghoul bounties on Cetus.", effectiveness: 0 }
        ]
      },
      {
        best: "Internal Bleeding",
        bestNote: "Like Hunter Munitions but for high-impact weapons.",
        alternatives: [
          { mod: "Hunter Munitions", note: "Use HM for slash-based, IB for impact-based.", effectiveness: 100 }
        ]
      },
      {
        best: "Galvanized Aptitude",
        bestNote: "+80% damage per status type. The Steel Path damage king.",
        alternatives: [
          { mod: "No alternative", note: "Arbitration reward. Nothing else scales like this.", effectiveness: 0 }
        ]
      }
    ]
  }
];
