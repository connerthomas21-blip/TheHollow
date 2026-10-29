'use strict';
/* ============================== DATA ============================== */

const heroName = () => (S && S.name) || 'Kael';

// Skills: rank 1–5. Each level of rank adds ~15% power. `lv` is the hero level required to learn it.
const SKILLS = {
  slash:  { name: 'Twin Slash',     lv: 1,  en: 4,  kind: 'atk',    desc: 'Two fast sword strikes.',                         p: r => ({ type: 'phys', mult: 0.72 + 0.08 * (r - 1), hits: 2 }) },
  bolt:   { name: 'Plasma Bolt',    lv: 2,  en: 6,  kind: 'atk',    desc: 'Tech blast that ignores half of the target’s armour.', p: r => ({ type: 'mag', mult: 1.45 + 0.15 * (r - 1), pierce: 0.5 }) },
  barrier:{ name: 'Barrier',        lv: 3,  en: 7,  kind: 'shield', desc: 'A shield that soaks damage for 3 turns.',          p: (r, u) => ({ amt: Math.round(u.mag * (1.6 + 0.3 * (r - 1)) + 10) }) },
  repair: { name: 'Nanite Repair',  lv: 4,  en: 8,  kind: 'heal',   desc: 'Restore HP and clear burn and poison.',            p: (r, u) => ({ amt: Math.round(u.mag * (2.2 + 0.4 * (r - 1)) + 15) }) },
  quake:  { name: 'Shockwave',      lv: 6,  en: 10, kind: 'atk',    desc: 'Heavy slam. May stun the target.',                 p: r => ({ type: 'phys', mult: 1.25 + 0.15 * (r - 1), fx: 'stun', chance: 0.35 + 0.05 * (r - 1) }) },
  over:   { name: 'Overdrive',      lv: 8,  en: 10, kind: 'buff',   desc: 'Deal 50% more damage for 3 turns.',                p: r => ({ fx: 'power', turns: 3 + Math.floor((r - 1) / 2) }) },
  inferno:{ name: 'Inferno Core',   lv: 10, en: 12, kind: 'atk',    desc: 'Tech fire attack that sets the target burning.',   p: r => ({ type: 'mag', mult: 1.35 + 0.15 * (r - 1), fx: 'burn', chance: 1 }) },
  star:   { name: 'Starbreaker',    lv: 13, en: 22, kind: 'atk',    desc: 'The lost art of the Order. Strength and tech combined.', p: r => ({ type: 'both', mult: 1.6 + 0.2 * (r - 1), pierce: 0.3 }) },
};

// Colour and effect for each skill's animation.
const SKILL_FX = { slash: { col: '#cfeaff' }, bolt: { col: '#5ad1e6', el: 'tech' }, quake: { vfx: 'ring' }, inferno: { col: '#ff8a3a', el: 'fire' }, star: { col: '#9ad8ff', vfx: 'nova', el: 'star' } };

const ITEMS = {
  medkit:  { name: 'Med Kit',       price: 25,  w: 1, desc: 'Restore 60 HP.',              use: u => heal(u, 60) },
  cell:    { name: 'Energy Cell',   price: 30,  w: 1, desc: 'Restore 25 EN.',              use: u => restoreEn(u, 25) },
  purifier:{ name: 'Purifier',      price: 30,  w: 1, desc: 'Cure burn, poison and armour break.', use: u => cleanse(u) },
  frag:    { name: 'Frag Grenade',  price: 60,  w: 1, desc: 'Deal 90 damage that ignores armour.', battleOnly: true, use: (u, e) => trueDamage(e, 90) },
  smoke:   { name: 'Smoke Bomb',    price: 40,  w: 1, desc: 'Escape any non-boss battle.', battleOnly: true, use: () => 'flee' },
  megakit: { name: 'Mega Kit',      price: 90,  w: 2, desc: 'Restore 220 HP.',             use: u => heal(u, 220) },
  supercell:{ name: 'Fusion Cell',  price: 85,  w: 3, desc: 'Restore 70 EN.',              use: u => restoreEn(u, 70) },
  elixir:  { name: 'Star Elixir',   price: 320, w: 3, desc: 'Fully restore HP and EN.',    use: u => { heal(u, 99999); restoreEn(u, 9999); } },
};

// Gear: `w` = first world whose shop sells it.
const GEAR = {
  w_rust:   { name: 'Rusted Blade',      slot: 'weapon', price: 0,    w: 9, b: { atk: 3 } },
  w_ion:    { name: 'Ion Saber',         slot: 'weapon', price: 120,  w: 1, b: { atk: 8 } },
  w_lance:  { name: 'Shock Lance',       slot: 'weapon', price: 220,  w: 2, b: { atk: 14, mag: 4 } },
  w_grav:   { name: 'Graviton Cleaver',  slot: 'weapon', price: 700, w: 3, b: { atk: 22 } },
  w_nova:   { name: 'Nova Edge',         slot: 'weapon', price: 1000, w: 4, b: { atk: 32, mag: 10 } },
  w_star:   { name: 'Oathkeeper',        slot: 'weapon', price: 3000, w: 5, b: { atk: 45, mag: 18, crit: 5 } },
  a_vest:   { name: 'Padded Vest',       slot: 'armor',  price: 0,    w: 9, b: { armor: 2 } },
  a_alloy:  { name: 'Alloy Plate',       slot: 'armor',  price: 100,  w: 1, b: { armor: 6 } },
  a_cara:   { name: 'Skrell Carapace',   slot: 'armor',  price: 270,  w: 2, b: { armor: 11, hp: 20 } },
  a_aegis:  { name: 'Aegis Mail',        slot: 'armor',  price: 650, w: 3, b: { armor: 17 } },
  a_magma:  { name: 'Magmaforged Plate', slot: 'armor',  price: 1400, w: 4, b: { armor: 24, hp: 60 } },
  a_void:   { name: 'Voidweave Mantle',  slot: 'armor',  price: 2800, w: 5, b: { armor: 32, en: 20, agi: 3 } },
  x_scope:  { name: 'Targeting Scope',   slot: 'acc',    price: 150,  w: 1, b: { crit: 6 } },
  x_core:   { name: 'Spare Core',        slot: 'acc',    price: 220,  w: 2, b: { en: 15 } },
  x_boots:  { name: 'Thruster Boots',    slot: 'acc',    price: 250,  w: 2, b: { agi: 4 } },
  x_heart:  { name: 'Titan Heart',       slot: 'acc',    price: 600,  w: 3, b: { vit: 4 } },
  x_lens:   { name: 'Arc Lens',          slot: 'acc',    price: 1000, w: 4, b: { tec: 4, mag: 6 } },
  x_sigil:  { name: 'Sigil of the Order',slot: 'acc',    price: 2000, w: 5, b: { str: 4, def: 4 } },
  // Not sold. Won in Rift trials (`trial` = world), by story choices, or from the Lost Sweeper. `perk` is a special rule.
  t_lantern:{ name: 'Colonist’s Lantern', slot: 'acc',   price: 0, w: 99, trial: 0, b: { tec: 3, en: 15 }, perk: 'Regain 3 more EN every turn.' },
  t_glaive: { name: 'Mandible Glaive',   slot: 'weapon', price: 0, w: 99, trial: 1, b: { atk: 18, crit: 6 }, perk: 'Hits may poison (25%).' },
  t_core:   { name: 'Sentinel Shield Core', slot: 'acc', price: 0, w: 99, trial: 2, b: { armor: 8 }, perk: 'Start every battle behind a 60-point shield.' },
  t_maul:   { name: 'Forgeheart Maul',   slot: 'weapon', price: 0, w: 99, trial: 3, b: { atk: 40, mag: 6 }, perk: 'Hits may set the target burning (30%).' },
  t_horizon:{ name: 'Horizon Plate',     slot: 'armor',  price: 0, w: 99, trial: 4, b: { armor: 34, hp: 90, agi: 2 }, perk: 'Immune to gravity. Halves the Hollow’s pull on enemies.' },
  x_seal:   { name: 'Admiral’s Seal',    slot: 'acc',    price: 0, w: 99, b: { atk: 10, armor: 6, crit: 4 }, perk: 'Taken from Admiral Vex.' },
  w_sever:  { name: 'Severance',         slot: 'weapon', price: 0, w: 99, b: { atk: 40, mag: 14, crit: 4 }, perk: 'Master Kol’s blade.' },
  x_last:   { name: 'Last Light',        slot: 'acc',    price: 0, w: 99, b: { str: 6, def: 6, tec: 6, agi: 6 }, perk: 'The first Sweeper’s lantern flame.' },
};
const hasGear = id => !!S && Object.values(S.equip).includes(id);
const BONUS_LABEL = { atk: 'ATK', mag: 'TECH ATK', armor: 'ARMOUR', hp: 'HP', en: 'EN', crit: 'CRIT %', str: 'STR', def: 'DEF', agi: 'AGI', tec: 'TEC', vit: 'VIT' };

// Enemy move: n=name, c=chance per turn, m=damage multiplier, hits, fx=effect on hit, heal/shield/buff = self effects.
const PLANETS = [
  { name: 'Veyra Outpost', sub: 'Fallen mining colony', lv: '1–4', globe: ['#c98b5a', '#5b3420'], glow: '#c98b5a55',
    sky: ['#2b1a2e', '#7a4a3a'], hills: '#3a2228', ground: '#2a1a1a',
    foes: [
      { name: 'Scrap Drone', variant: 'scrap', weak: ['tech'],   kind: 'drone',   col: ['#9aa3ad', '#ff6b4a'], hp: 28, atk: 9,  def: 2, agi: 6, xp: 12, cr: 14,  moves: [{ n: 'Zap', c: 0.3, m: 1.3 }] },
      { name: 'Dust Crawler', variant: 'dust', weak: ['fire'],  kind: 'crawler', col: ['#a8865a', '#e6d36a'], hp: 36, atk: 8,  def: 4, agi: 3, xp: 13, cr: 11,  moves: [{ n: 'Venom Bite', c: 0.3, m: 1, fx: 'poison' }] },
      { name: 'Rogue Trooper', weak: ['fire'], kind: 'humanoid',col: ['#5a6a4a', '#d84a3a'], hp: 42, atk: 11, def: 4, agi: 5, xp: 16, cr: 24, armor: { style: 'munition', base: '#5a6a4a', trim: '#d84a3a', pauldron: 'round' }, look: { gear: 'visor', eyes: '#ff5a3a' }, weapon: 'gun', moves: [{ n: 'Burst Fire', c: 0.35, m: 0.65, hits: 2 }] },
    ],
    boss: { name: 'Warden Mk-II', weak: ['tech'], resist: ['phys'], kind: 'mech', col: ['#7d8590', '#ffb02e'], hp: 140, atk: 14, def: 7, agi: 4, xp: 70, cr: 224,
      moves: [{ n: 'Rocket Salvo', c: 0.3, m: 0.6, hits: 3 }, { n: 'Lockdown Beam', c: 0.15, m: 0.8, fx: 'stun' }, { n: 'Self-Repair', c: 0.12, heal: 0.15 }, { n: 'Overload Cannon', c: 0.14, m: 2.4, charge: true }] } },
  { name: 'Krytos Wastes', sub: 'Skrell hive desert', lv: '4–8', globe: ['#d9b45a', '#6b4a1a'], glow: '#d9b45a55',
    sky: ['#3a2a14', '#c9864a'], hills: '#6a4426', ground: '#4a3018',
    foes: [
      { name: 'Skrell Scout', variant: 'scout', weak: ['fire'],   kind: 'crawler', col: ['#4a7a5a', '#c6ff6a'], hp: 70,  atk: 22, def: 8,  agi: 10, xp: 30, cr: 38, moves: [{ n: 'Lunge', c: 0.3, m: 1.4 }] },
      { name: 'Skrell Spitter', variant: 'spitter', weak: ['phys'], resist: ['tech'], kind: 'crawler', col: ['#6a5a8a', '#b6ff4a'], hp: 62,  atk: 25, def: 6,  agi: 7,  xp: 32, cr: 42, moves: [{ n: 'Acid Spit', c: 0.4, m: 1.1, fx: 'poison' }] },
      { name: 'Sand Wyrm', weak: ['tech'], resist: ['fire'],      kind: 'wyrm',    col: ['#b8925a', '#ff7a3a'], hp: 115, atk: 27, def: 12, agi: 5,  xp: 40, cr: 54, moves: [{ n: 'Burrow Strike', c: 0.25, m: 1.6 }] },
    ],
    boss: { name: 'Skrell Brood Queen', weak: ['fire'], resist: ['tech'], kind: 'queen', col: ['#5a3a6a', '#d4ff5a'], hp: 420, atk: 31, def: 14, agi: 8, xp: 260, cr: 720,
      moves: [{ n: 'Acid Rain', c: 0.25, m: 0.55, hits: 3, fx: 'poison' }, { n: 'Crushing Mandibles', c: 0.2, m: 1.7 }, { n: 'Brood Feast', c: 0.12, heal: 0.1 }, { n: 'Brood Swarm', c: 0.14, m: 0.75, hits: 4, charge: true }] } },
  { name: 'Nebulon Station', sub: 'Order fleet dockyard', lv: '8–12', globe: ['#6a8ad9', '#1a2a5a'], glow: '#6a8ad955',
    sky: ['#0a0e2a', '#2a3a7a'], hills: '#1a2048', ground: '#20244a',
    foes: [
      { name: 'Sentinel Unit', variant: 'sentinel', weak: ['tech'], resist: ['phys'],  kind: 'drone',    col: ['#c8d0e0', '#4ad0ff'], hp: 150, atk: 38, def: 18, agi: 12, xp: 70, cr: 88, moves: [{ n: 'Laser Grid', c: 0.35, m: 0.8, hits: 2 }] },
      { name: 'Void Wraith', variant: 'void', weak: ['tech'], resist: ['phys'],    kind: 'wraith',   col: ['#3a2a6a', '#c46aff'], hp: 125, atk: 43, def: 10, agi: 18, xp: 75, cr: 80, moves: [{ n: 'Soul Drain', c: 0.35, m: 1.2, drain: true }] },
      { name: 'Merc Captain', weak: ['tech'],   kind: 'humanoid', col: ['#3a3a4a', '#ffcf4a'], hp: 180, atk: 40, def: 16, agi: 12, xp: 85, cr: 144, armor: { style: 'munition', base: '#3e3e4e', trim: '#ffcf4a', pauldron: 'round', cape: '#5a4a2a' }, look: { gear: 'knight', skin: 2, hair: 'short', hairCol: 0, eyes: 1, beard: 'full', mark: 'scar' }, weapon: 'gun', moves: [{ n: 'Flashbang', c: 0.18, m: 0.6, fx: 'stun' }, { n: 'Headshot', c: 0.2, m: 1.8 }] },
    ],
    boss: { name: 'Admiral Vex', weak: ['fire'], resist: ['tech'], kind: 'humanoid', big: true, col: ['#e6e6f0', '#3a6aff'], hp: 600, atk: 40, def: 22, agi: 14, xp: 600, cr: 1760, armor: { style: 'paladin', base: '#d6dbe6', trim: '#3a6aff', pauldron: 'paladin', cape: '#2a3a8a', rivet: '#e8c25a' }, look: { gear: 'crest', skin: 0, hair: 'short', hairCol: 4, eyes: 0, beard: 'full', mark: 'none' }, weapon: 'sword', cape: '#2a3a8a',
      moves: [{ n: 'Fleet Barrage', c: 0.25, m: 0.5, hits: 4 }, { n: 'Command Shield', c: 0.15, shield: 140 }, { n: 'Execution', c: 0.15, m: 2.0 }, { n: 'Orbital Strike', c: 0.13, m: 3.0, charge: true }] } },
  { name: 'Cinder Moon', sub: 'Volcanic forge world', lv: '12–16', globe: ['#ff6a3a', '#5a1a0a'], glow: '#ff6a3a66',
    sky: ['#1a0808', '#8a2a14'], hills: '#3a1010', ground: '#2a0c08',
    foes: [
      { name: 'Magma Golem', weak: ['tech'], resist: ['fire'], kind: 'golem',    col: ['#4a3a3a', '#ff7a2a'], hp: 300, atk: 58, def: 30, agi: 6,  xp: 140, cr: 152,  moves: [{ n: 'Lava Fist', c: 0.35, m: 1.3, fx: 'burn' }] },
      { name: 'Fire Imp', weak: ['phys'], resist: ['fire'],    kind: 'imp',      col: ['#c43a1a', '#ffd04a'], hp: 185, atk: 62, def: 18, agi: 26, xp: 130, cr: 144,  moves: [{ n: 'Fireball', c: 0.3, m: 1.2, fx: 'burn' }, { n: 'Claw Flurry', c: 0.25, m: 0.5, hits: 3 }] },
      { name: 'Ash Knight', weak: ['tech'], resist: ['fire'],  kind: 'humanoid', col: ['#3a3434', '#ff5a2a'], hp: 265, atk: 65, def: 28, agi: 16, xp: 155, cr: 192, armor: { style: 'jugg', base: '#3a3434', trim: '#ff5a2a', glow: '#ff5a2a', seams: true, pauldron: 'massive', cape: '#2a1010' }, look: { gear: 'horned', eyes: '#ff5a2a' }, weapon: 'axe', moves: [{ n: 'Cinder Cleave', c: 0.3, m: 1.6 }, { n: 'Sunder', c: 0.15, m: 0.8, fx: 'weaken' }] },
    ],
    boss: { name: 'Pyrelord Skarn', variant: 'pyrelord', weak: ['tech'], resist: ['fire'], kind: 'golem', big: true, col: ['#2a1a1a', '#ffb02a'], hp: 860, atk: 52, def: 34, agi: 14, xp: 1300, cr: 3840,
      moves: [{ n: 'Eruption', c: 0.25, m: 0.6, hits: 3, fx: 'burn' }, { n: 'Magma Armour', c: 0.12, shield: 180 }, { n: 'Meteor Fall', c: 0.15, m: 2.2 }, { n: 'Caldera Burst', c: 0.13, m: 2.6, fx: 'burn', charge: true }] } },
  { name: 'The Hollow Dark', sub: 'Beyond the last star', lv: '16+', globe: ['#2a1a4a', '#000000'], glow: '#9a5aff66',
    sky: ['#000000', '#1a0a2a'], hills: '#0e0618', ground: '#08040e',
    foes: [
      { name: 'Abyss Spawn', variant: 'abyss', weak: ['fire'], resist: ['phys'], kind: 'wraith',   col: ['#1a0a2a', '#ff3a8a'], hp: 380, atk: 87, def: 36, agi: 24, xp: 240, cr: 256, moves: [{ n: 'Hungering Touch', c: 0.35, m: 1.3, drain: true }] },
      { name: 'Shade Knight', weak: ['phys'], resist: ['tech'],kind: 'humanoid', col: ['#1a1a2a', '#9a6aff'], hp: 420, atk: 84, def: 44, agi: 22, xp: 260, cr: 288, armor: { style: 'void', base: '#24203a', trim: '#9a6aff', glow: '#9a6aff', stars: true, pauldron: 'float', cape: '#140a24', capeLong: true, blade: '#3a2a5a' }, look: { gear: 'hood', skin: 5, eyes: '#c49aff', beard: 'none', mark: 'none' }, weapon: 'sword', cape: '#1a0a2a', moves: [{ n: 'Dark Slash', c: 0.3, m: 1.5 }, { n: 'Hex of Ruin', c: 0.18, m: 0.6, fx: 'weaken' }] },
      { name: 'Null Horror', weak: ['phys'], resist: ['fire'], kind: 'eye',      col: ['#2a1a3a', '#ff4a4a'], hp: 400, atk: 90, def: 38, agi: 20, xp: 280, cr: 304, moves: [{ n: 'Paralysing Gaze', c: 0.18, m: 0.7, fx: 'stun' }, { n: 'Mind Rend', c: 0.25, m: 1.6 }] },
    ],
    boss: { name: 'The Hollow Dark', resist: ['phys'], kind: 'titan', big: true, col: ['#120820', '#c46aff'], hp: 1500, atk: 70, def: 36, agi: 24, xp: 0, cr: 0, phase2: true,
      moves: [{ n: 'Swallowing Night', c: 0.25, m: 0.55, hits: 4 }, { n: 'Unmaking Gaze', c: 0.15, m: 0.9, fx: 'stun' }, { n: 'Entropy', c: 0.15, m: 0.8, fx: 'weaken' }, { n: 'Worldbreaker', c: 0.14, m: 2.5, charge: true, smash: true }] } },
];
// Master Ardent Kol guards the heart of the Hollow Dark. He must fall before the titan wakes.
const KOL = { name: 'Master Ardent Kol', kind: 'humanoid', col: ['#3a2e2a', '#c46aff'], hp: 1150, atk: 60, def: 34, agi: 20, xp: 1500, cr: 2600, weapon: 'sword',
  armor: { style: 'void', base: '#3a2e2a', trim: '#c46aff', glow: '#c46aff', seams: true, pauldron: 'float', cape: '#2a0a24', spike: '#5a4a44', blade: '#2a2236' },
  look: { build: 'm', gear: 'none', skin: 1, hair: 'short', hairCol: 4, eyes: '#c46aff', beard: 'full', mark: 'scar' },
  moves: [{ n: 'Sweeper’s Judgement', c: 0.2, m: 1.9 }, { n: 'Twin Cut', c: 0.2, m: 0.6, hits: 2 }, { n: 'Severing Oath', c: 0.18, m: 0.8, fx: 'weaken' }, { n: 'Hollow Pact', c: 0.1, heal: 0.12 }, { n: 'Fall of Veyra', c: 0.12, m: 3.0, charge: true }], mirror: true };
const PHASE2 = { name: 'The Hollow Dark, Unbound', atkMul: 1.15, weak: ['tech'], resist: [],
  moves: [{ n: 'Event Horizon', c: 0.12, m: 3.0, charge: true }, { n: 'Night Hammer', c: 0.2, m: 1.8 }, { n: 'Starless Rain', c: 0.25, m: 0.5, hits: 4, fx: 'burn' }, { n: 'Devour Light', c: 0.15, m: 1.2, drain: true }] };
const WINS_FOR_BOSS = 5;



// Phase 3: the titan collapses into what it always was, a black hole. It drags at you every turn.
const PHASE3 = { name: 'The Singularity', kind: 'singularity', atkMul: 1.1, hpMul: 0.45, pull: 0.05, weak: ['tech'], resist: ['phys', 'fire'],
  moves: [{ n: 'Spaghettify', c: 0.3, m: 0.7, hits: 2 }, { n: 'Light Eater', c: 0.2, m: 1.2, drain: true }, { n: 'Total Collapse', c: 0.15, m: 3.4, charge: true }] };

// Damage multipliers against weaknesses and resistances. 'star' (Starbreaker) counts as both phys and tech.
const WEAK_MUL = 1.4, RESIST_MUL = 0.65;
const EL_NAME = { phys: 'Blade', tech: 'Tech', fire: 'Fire' };

// Difficulty. dmg = damage you take, out = damage you deal, med = medbay visits per world, rot = how fast the Hollow spreads.
const DIFFICULTY = {
  story:  { name: 'Story',          dmg: 0.65, out: 1.2,  med: 99, xp: 1.25, cr: 1.2,  rot: 0.5, desc: 'For the tale. Softer hits, unlimited medbay, and the Hollow spreads slowly.' },
  knight: { name: 'Knight',         dmg: 1,    out: 1,    med: 3,  xp: 1,    cr: 1,    rot: 1,   desc: 'The intended challenge. Three medbay visits per world, restocked when you beat its boss.' },
  oath:   { name: 'Sweeper’s Oath', dmg: 1.3,  out: 0.92, med: 2,  xp: 1,    cr: 0.85, rot: 1.6, desc: 'Hits hurt, two medbay visits per world, and the Hollow spreads fast.' },
};
const diff = () => DIFFICULTY[(S && S.diff) || 'knight'];

// The Hollow's pull (0–100). Patrols and defeats feed it, bosses and trials push it back.
// Every 25 points makes enemies tougher and better paid.
const ROT_TIER = r => r >= 75 ? 3 : r >= 50 ? 2 : r >= 25 ? 1 : 0;
const ROT_NAME = ['Quiet', 'Stirring', 'Hungering', 'Devouring'];

// Rift trials: three fights in a row with no items and no medbay. Opens once the world's boss is beaten.
const TRIALS = [
  { name: 'Rift of Embers',   reward: 't_lantern', text: 'A tear in the ash where the colony’s last night still burns.' },
  { name: 'Rift of Mandibles',reward: 't_glaive',  text: 'The hive remembers every Sweeper it ate.' },
  { name: 'Rift of Iron',     reward: 't_core',    text: 'The dockyard’s ghosts still run their drills.' },
  { name: 'Rift of the Anvil',reward: 't_maul',    text: 'The first forge, where the old binding was struck.' },
  { name: 'Rift of the Horizon', reward: 't_horizon', text: 'The edge of the event horizon, where light goes to die.' },
];

// Post-game: echoes of every boss at full strength, then the secret one.
const ECHO = { hp: 1700, atk: 80, def: 40, agi: 22, xp: 900, cr: 1600 };
const LOST_SWEEPER = { name: 'The Lost Sweeper', kind: 'humanoid', big: true, col: ['#1e3a3a', '#7affe8'], hp: 3200, atk: 96, def: 46, agi: 30, xp: 3000, cr: 6000, weapon: 'w_star', mirror: true,
  armor: { style: 'paladin', base: '#5a6a70', trim: '#7affe8', glow: '#7affe8', pauldron: 'paladin', cape: '#14262a', capeLong: true, motif: 'rune', tabard: '#14262a', under: '#0e1618', seams: true },
  look: { build: 'm', gear: 'hood', skin: 5, hair: 'long', hairCol: 4, eyes: '#7affe8', beard: 'none', mark: 'none' },
  moves: [{ n: 'The First Sweep', c: 0.2, m: 1.7 }, { n: 'Lantern Ward', c: 0.12, shield: 300 }, { n: 'Thousand-Year Cut', c: 0.18, m: 0.55, hits: 5 }, { n: 'Close the Door', c: 0.12, m: 3.2, charge: true }] };
