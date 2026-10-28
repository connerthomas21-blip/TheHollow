'use strict';
/* ============================== STATE ============================== */

const SAVE_KEY = 'starbreaker-save-v1';
const fresh = () => ({
  v: 1, name: 'Kael', look: { ...DEFAULT_LOOK }, lvl: 1, xp: 0, cr: 96, pts: 0, sp: 0,
  base: { str: 5, def: 5, agi: 5, tec: 5, vit: 5 },
  hp: null, en: null,
  equip: { weapon: 'w_rust', armor: 'a_vest', acc: null },
  gear: ['w_rust', 'a_vest'],
  inv: { medkit: 3, cell: 1 },
  skills: { slash: 1 },
  world: 0, unlocked: 1, wins: [0, 0, 0, 0, 0], bosses: [false, false, false, false, false],
  seen: {}, done: false, kills: 0,
});
let S = null;              // saved game state
let U = { screen: 'title', tab: 'items', story: null }; // UI state
let B = null;              // active battle

const clone = o => JSON.parse(JSON.stringify(o));
const rnd = (a, b) => a + Math.random() * (b - a);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
const sleep = ms => new Promise(r => setTimeout(r, window.__fast ? 0 : RM ? ms * 0.4 : ms));
const xpNext = l => Math.round(14 * Math.pow(l, 1.7));

function save() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) {} }
function loadSaved() { try { const s = localStorage.getItem(SAVE_KEY); return s ? JSON.parse(s) : null; } catch (e) { return null; } }
function encodeSave() { return btoa(unescape(encodeURIComponent(JSON.stringify(S)))); }
function decodeSave(code) { const s = JSON.parse(decodeURIComponent(escape(atob(code.trim())))); if (!s || s.v !== 1 || !s.base) throw new Error('bad'); return Object.assign(fresh(), s); }

function gearBonus() {
  const t = {};
  for (const slot of ['weapon', 'armor', 'acc']) {
    const g = GEAR[S.equip[slot]]; if (!g) continue;
    for (const k in g.b) t[k] = (t[k] || 0) + g.b[k];
  }
  return t;
}
function stats() {
  const g = gearBonus(), b = S.base, v = k => b[k] + (g[k] || 0);
  return {
    str: v('str'), def: v('def'), agi: v('agi'), tec: v('tec'), vit: v('vit'),
    maxHp: 30 + v('vit') * 10 + S.lvl * 12 + (g.hp || 0),
    maxEn: 15 + v('tec') * 3 + (g.en || 0),
    atk: Math.round(v('str') * 2.5) + (g.atk || 0),
    mag: Math.round(v('tec') * 2.5) + (g.mag || 0),
    armor: Math.round(v('def') * 1.2) + (g.armor || 0),
    crit: 5 + v('agi') * 0.5 + (g.crit || 0),
  };
}
function topUpCaps() {
  const st = stats();
  if (S.hp == null) S.hp = st.maxHp; if (S.en == null) S.en = st.maxEn;
  S.hp = clamp(S.hp, 0, st.maxHp); S.en = clamp(S.en, 0, st.maxEn);
}

/* ============================== EFFECTS (shared by items and skills) ============================== */
// `u` is a battle unit, or the hero outside battle (a light wrapper with hp/maxHp/en/maxEn).
function heal(u, n) { if (u.side) vfx('heal', { ...unitPos(u.side), life: 0.9 }); const before = u.hp; u.hp = Math.min(u.maxHp, u.hp + n); pop(u, '+' + (u.hp - before), 'var(--good)'); return `restores ${u.hp - before} HP`; }
function restoreEn(u, n) { const before = u.en; u.en = Math.min(u.maxEn, u.en + n); pop(u, '+' + (u.en - before) + ' EN', '#5ad1e6'); return `restores ${u.en - before} EN`; }
function cleanse(u) { if (u.fx) { delete u.fx.burn; delete u.fx.poison; delete u.fx.weaken; } return 'is purified'; }
function trueDamage(t, n) { applyDamage(t, n, false); return `deals ${n} damage`; }

/* ============================== BATTLE ENGINE ============================== */

/* ---------- Choreography: each side has a pose the renderer reads every frame. Tweens move it; strike() waits on them. ---------- */
const newAct = () => ({ dx: 0, dy: 0, lean: 0, arm: 0, crouch: 0, sx: 1, sy: 1, kb: 0, smear: null, smearT: 0, swinging: false, ghost: 0, aura: null, trail: [] });
const EASE = { out: k => 1 - (1 - k) * (1 - k), in: k => k * k * k, io: k => k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2 };
function tween(ms, fn) {
  if (window.__fast || !B || !B.tweens) { fn(1); return Promise.resolve(); }
  return new Promise(res => B.tweens.push({ t: 0, ms: RM ? ms * 0.6 : ms, fn, res }));
}
function stepTweens(dt) {
  if (!B || !B.tweens) return;
  const done = [];
  for (const tw of B.tweens) { tw.t += dt; const k = Math.min(1, tw.t / tw.ms); tw.fn(k); if (k >= 1) done.push(tw); }
  if (done.length) { B.tweens = B.tweens.filter(tw => !done.includes(tw)); done.forEach(tw => tw.res()); }
}
function to(act, target, ms, e = EASE.io) {
  const from = {}; for (const k in target) from[k] = act[k];
  return tween(ms, k => { const v = e(k); for (const p in target) act[p] = from[p] + (target[p] - from[p]) * v; });
}
const wait = ms => tween(ms, () => {});
// melee: dash in and swing; slam: leap and crash down; cast: charge then fire a bolt; ranged: shoot from where it stands
function attackStyle(a, o) {
  if (a.side === 'p') return o.type === 'mag' ? 'cast' : o.vfx === 'ring' ? 'slam' : 'melee';
  if (a.weapon === 'gun' || a.kind === 'drone' || a.kind === 'mech') return 'ranged';
  if (a.kind === 'wraith' || a.kind === 'eye') return 'cast';
  return 'melee';
}
const isArmed = a => a.side === 'p' || a.kind === 'humanoid' || a.kind === 'titan';
function handPos(side) {
  const u = unitPos(side);
  if (side === 'p') return { x: u.x + 40, y: u.y - 24 };
  const e = B.e;
  return { x: u.x - (e.kind === 'titan' ? 90 : e.big ? 70 : 46), y: u.y + (e.kind === 'drone' ? 10 : e.kind === 'titan' ? 20 : -4) };
}

function heroUnit() {
  const st = stats();
  return { side: 'p', name: heroName(), hp: S.hp, maxHp: st.maxHp, en: S.en, maxEn: st.maxEn, atk: st.atk, mag: st.mag, def: st.armor, agi: st.agi, crit: st.crit, fx: {} };
}
function enemyUnit(d) {
  return { side: 'e', ...clone(d), maxHp: d.hp, mag: d.atk, crit: 5 + d.agi * 0.3, fx: {} };
}

function startBattle(boss) {
  const w = PLANETS[S.world];
  const kolFight = boss && S.world === PLANETS.length - 1 && !S.kolDown;
  const def = boss ? (kolFight ? KOL : w.boss) : w.foes[Math.floor(Math.random() * w.foes.length)];
  topUpCaps();
  B = { p: heroUnit(), e: enemyUnit(def), boss, kol: kolFight, log: [], busy: false, over: null, menu: null, fl: [],
        anim: { pHit: 0, eHit: 0, flash: 0, eDie: 0 }, vfx: [], tweens: [], act: { p: newAct(), e: newAct() }, hitstop: 0, cam: 0, world: S.world, phase: 1 };
  U.screen = 'battle';
  log(boss ? `<b>${def.name}</b> blocks your path!` : `A <b>${def.name}</b> appears!`);
  render();
  if (!boss && B.e.agi > B.p.agi + 4 && Math.random() < 0.5) {
    log('It strikes first!');
    B.busy = true; render();
    sleep(600).then(enemyTurn);
  }
}

function log(msg) { if (!B) return; B.log.push(msg); if (B.log.length > 4) B.log.shift(); }
function pop(u, text, color) { if (B && u && u.side) B.fl.push({ side: u.side, text, color, t: 0, dx: rnd(-20, 20) }); }

function calcHit(a, t, o) {
  const power = o.type === 'mag' ? a.mag : o.type === 'both' ? (a.atk + a.mag) * 0.75 : a.atk;
  const dodge = clamp(0.03 + (t.agi - a.agi) * 0.01, 0, 0.25);
  if (Math.random() < dodge) return { miss: true, d: 0 };
  let d = power * o.mult * rnd(0.9, 1.1);
  const armor = t.def * (t.fx.weaken ? 0.6 : 1) * (1 - (o.pierce || 0));
  d -= armor * 0.5;
  if (a.fx.power) d *= 1.5;
  d = Math.max(1, d);
  const crit = Math.random() * 100 < a.crit;
  if (crit) d *= 1.75;
  if (t.fx.guard) d *= 0.5;
  return { d: Math.round(d), crit };
}
function applyDamage(t, d, crit) {
  if (t.fx.shield) {
    const soak = Math.min(t.fx.shield.amt, d);
    t.fx.shield.amt -= soak; d -= soak;
    if (soak) pop(t, 'shield ' + soak, '#5ad1e6');
    if (t.fx.shield.amt <= 0) delete t.fx.shield;
  }
  t.hp = Math.max(0, t.hp - d);
  if (d > 0 || !t.fx.shield) pop(t, (crit ? 'CRIT ' : '') + d, crit ? '#f2b544' : '#fff');
  B.anim[t.side + 'Hit'] = 1;
  if (crit) B.anim.flash = 1;
  return d;
}
function addFx(t, fx, turns) {
  const map = { burn: 3, poison: 4, stun: 1, weaken: 3, power: 3 };
  t.fx[fx] = { t: (turns || map[fx]) + (t.side === 'p' && fx === 'power' ? 1 : 0) };
  pop(t, fx.toUpperCase(), fx === 'power' ? '#f2b544' : '#c46aff');
}

// One attack from a to t, fully animated. Returns total damage dealt.
async function strike(a, t, o, label) {
  const act = a.side === 'p' ? B.act.p : B.act.e, dir = a.side === 'p' ? 1 : -1, style = attackStyle(a, o), armed = isArmed(a);
  const close = style === 'melee' || style === 'slam';
  const reach = a.side === 'p' ? 320 - (B.e.kind === 'titan' ? 175 : B.e.big ? 122 : 94) : -(320 - (a.kind === 'titan' ? 175 : a.big ? 120 : 100));
  const tint = a.side === 'p' ? (o.col || WEAPON_GLOW[S.equip.weapon] || '#cfeaff') : ((a.col && a.col[1]) || '#ff8a7a');
  let total = 0, hits = o.hits || 1, crits = 0, missed = 0;

  // wind-up and approach
  if (close) {
    await to(act, armed ? { crouch: 0.55, arm: -1.6, lean: -0.14, dx: -12 * dir } : { dx: -16 * dir, sx: 0.86, sy: 1.12, lean: -0.1 }, 190, EASE.out);
    act.ghost = 1;
    if (style === 'slam') await to(act, { dx: reach * 0.92, dy: -56, crouch: 0.1, lean: 0.1 }, 230, EASE.out);
    else await to(act, armed ? { dx: reach, crouch: 0.2, lean: 0.24 } : { dx: reach, sx: 1.18, sy: 0.86, lean: 0.14 }, 140, EASE.in);
  } else if (style === 'cast') {
    await to(act, armed ? { arm: -0.7, crouch: 0.25, lean: -0.1 } : { dy: -12, sx: 1.06, sy: 1.06 }, 160, EASE.out);
    act.aura = tint;
    vfx('charge', { ...handPos(a.side), col: tint, seed: Math.random() * 99, life: 0.32 }); await wait(300);
  } else await to(act, { lean: -0.06 }, 110);

  for (let i = 0; i < hits; i++) {
    // the moment of contact
    if (close && armed) {
      const from = i % 2 ? 1.9 : -1.6, end = i % 2 ? -1.2 : 1.9;
      act.arm = from; act.smear = from; act.smearT = 1; act.swinging = true;
      await to(act, style === 'slam' ? { arm: end, dy: 0, lean: 0.32 } : { arm: end, lean: i % 2 ? 0.08 : 0.32 }, style === 'slam' ? 120 : 95, EASE.in);
      act.swinging = false;
    } else if (close) {
      await to(act, { sx: 1, sy: 1, lean: 0.22, dx: reach + 8 * dir }, 80, EASE.in);
    } else if (style === 'cast') {
      vfx('bolt', { from: a.side, to: t.side, col: tint, life: 0.24 });
      act.kb = -8 * dir; await wait(230);
    } else {
      const m = handPos(a.side), tp = unitPos(t.side);
      vfx('muzzle', { ...m, col: tint, dir, life: 0.09 });
      vfx('tracer', { x1: m.x, y1: m.y, x2: tp.x + rnd(-8, 8), y2: tp.y + rnd(-16, 10), col: tint, life: 0.12 });
      act.kb = -10 * dir; await wait(110);
    }
    // resolve the hit
    const r = calcHit(a, t, o), pos = unitPos(t.side), tAct = B.act[t.side];
    if (r.miss) { missed++; pop(t, 'MISS', '#a29dcc'); tAct.kb = 12 * dir; }
    else {
      total += applyDamage(t, r.d, r.crit); if (r.crit) crits++;
      tAct.kb = (r.crit ? 28 : 16) * dir;
      B.hitstop = window.__fast ? 0 : r.crit ? 120 : 65; if (r.crit) B.cam = 1;
      vfx('sparks', { x: pos.x + rnd(-10, 10), y: pos.y + rnd(-14, 14), col: r.crit ? '#ffd27a' : tint, seed: Math.random() * 999, life: 0.45 });
      if (close) vfx('slash', { ...pos, col: tint, dir, life: 0.26 });
    }
    if (t.hp <= 0) break;
    if (i < hits - 1) await wait(close ? 50 : 70);
  }
  if (total > 0 && o.vfx === 'ring') { vfx('ring', { x: unitPos(t.side).x, y: GROUND, col: '#f2b544', life: 0.55 }); B.anim.flash = Math.max(B.anim.flash, 0.6); }
  if (total > 0 && o.vfx === 'nova') { vfx('nova', { ...unitPos(t.side), col: '#9ad8ff', life: 0.6 }); B.cam = 1; }
  if (total > 0 && (o.fx === 'burn' || o.fx === 'poison')) vfx('burst', { ...unitPos(t.side), col: o.fx === 'burn' ? '#ff7a2a' : '#8aff5a', life: 0.5 });

  // follow-through and recovery
  act.aura = null;
  await wait(close ? 110 : 60);
  if (close) {
    const x0 = act.dx;
    await tween(280, k => { const v = EASE.io(k); act.dx = x0 * (1 - v); act.dy = -Math.sin(k * Math.PI) * 18; act.arm *= 0.8; act.lean *= 0.82; act.crouch *= 0.82; });
  }
  await to(act, { dx: 0, dy: 0, arm: 0, lean: 0, crouch: 0, sx: 1, sy: 1 }, 120);
  act.ghost = 0;

  let msg = `${label}${hits > 1 ? ` (${hits} hits)` : ''}: `;
  msg += missed === hits ? 'miss!' : `<b>${total}</b> damage${crits ? ' (critical!)' : ''}.`;
  if (total > 0 && o.fx && t.hp > 0 && Math.random() < (o.chance ?? 1)) { addFx(t, o.fx); msg += ` ${t.name} is ${fxWord(o.fx)}.`; }
  if (o.drain && total > 0) { const h = Math.round(total * 0.5); a.hp = Math.min(a.maxHp, a.hp + h); pop(a, '+' + h, 'var(--good)'); msg += ` Drains ${h} HP.`; }
  log(msg);
  render();
  await sleep(150);
  return total;
}
// Raise the weapon, glow, then settle: used for buffs, shields and heals.
async function channel(act, col, fn) {
  await to(act, { arm: -2.2, crouch: 0.15, lean: -0.05 }, 180, EASE.out);
  act.aura = col; fn(); await wait(280); act.aura = null;
  await to(act, { arm: 0, crouch: 0, lean: 0 }, 180);
}
const fxWord = fx => ({ burn: 'burning', poison: 'poisoned', stun: 'stunned', weaken: 'armour-broken', power: 'overdriven' }[fx] || fx);

// Start-of-turn ticks. Returns false if the unit loses its turn.
async function tick(u) {
  for (const k of ['burn', 'poison']) if (u.fx[k] && u.hp > 0) {
    const d = Math.max(1, Math.round(u.maxHp * (k === 'burn' ? 0.06 : 0.05)));
    u.hp = Math.max(0, u.hp - d); pop(u, d, k === 'burn' ? '#ff8a3a' : '#9aff5a');
    vfx('burst', { ...unitPos(u.side), col: k === 'burn' ? '#ff7a2a' : '#8aff5a', life: 0.4 });
    log(`${u.name} takes ${d} ${k} damage.`); render(); await sleep(350);
  }
  delete u.fx.guard;
  let acts = true;
  if (u.fx.stun) { acts = false; log(`${u.name} is stunned and can’t move!`); }
  for (const k in u.fx) {
    if (k === 'shield') { if (--u.fx.shield.t <= 0) delete u.fx.shield; continue; }
    if (u.fx[k].t != null && --u.fx[k].t <= 0) delete u.fx[k];
  }
  render();
  return acts;
}

async function playerAction(kind, id) {
  if (!B || B.busy || B.over) return;
  const p = B.p, e = B.e;
  if (kind === 'skill') {
    const sk = SKILLS[id], r = S.skills[id];
    if (!r || p.en < sk.en) return;
  }
  if (kind === 'item' && !(S.inv[id] > 0)) return;
  B.busy = true; B.menu = null; render();

  if (kind === 'attack') await strike(p, e, { type: 'phys', mult: 1 }, 'Sword strike');
  else if (kind === 'defend') { p.fx.guard = { t: 1 }; await to(B.act.p, { crouch: 0.45, arm: -0.5, lean: -0.12 }, 160, EASE.out); restoreEn(p, 5); log('You raise your guard. Damage halved this turn, +5 EN.'); render(); await sleep(250); }
  else if (kind === 'flee') {
    const chance = clamp(0.5 + (p.agi - e.agi) * 0.04, 0.2, 0.9);
    if (!B.boss && Math.random() < chance) return endBattle('fled');
    await to(B.act.p, { dx: -40, lean: -0.15 }, 200, EASE.out); await to(B.act.p, { dx: 0, lean: 0 }, 200);
    log(B.boss ? 'There’s no escape from this fight!' : 'You couldn’t get away!'); render(); await sleep(200);
  }
  else if (kind === 'skill') {
    const sk = SKILLS[id], r = S.skills[id], prm = { ...sk.p(r, p), ...(SKILL_FX[id] || {}) };
    p.en -= sk.en;
    if (sk.kind === 'atk') await strike(p, e, prm, sk.name);
    else if (sk.kind === 'shield') await channel(B.act.p, '#5ad1e6', () => { p.fx.shield = { amt: prm.amt, t: 3 }; vfx('hex', { ...unitPos('p'), life: 0.7 }); pop(p, 'SHIELD ' + prm.amt, '#5ad1e6'); log(`${sk.name}: a ${prm.amt}-point shield surrounds you.`); });
    else if (sk.kind === 'heal') await channel(B.act.p, '#6fdc8c', () => { const m = heal(p, prm.amt); cleanse(p); log(`${sk.name} ${m}.`); });
    else if (sk.kind === 'buff') await channel(B.act.p, '#f2b544', () => { addFx(p, prm.fx, prm.turns); vfx('burst', { ...unitPos('p'), col: '#f2b544', life: 0.5 }); log(`${sk.name}! Your damage is boosted for ${prm.turns} turns.`); });
    render(); await sleep(150);
  }
  else if (kind === 'item') {
    const it = ITEMS[id];
    S.inv[id]--; if (!S.inv[id]) delete S.inv[id];
    await tween(220, k => { B.act.p.dy = -Math.sin(k * Math.PI) * 12; });
    if (id === 'frag') { vfx('bolt', { from: 'p', to: 'e', col: '#ffb04a', life: 0.24 }); await wait(230); vfx('burst', { ...unitPos('e'), col: '#ff9a3a', life: 0.5 }); B.act.e.kb = 20; B.anim.flash = 0.6; }
    const res = it.use(p, e);
    if (res === 'flee') { if (!B.boss) return endBattle('fled'); log('The smoke clears. The boss is still there.'); }
    else log(`${it.name} ${res || 'used'}.`);
    render(); await sleep(350);
  }

  if (await checkEnd()) return;
  await sleep(250);
  await enemyTurn();
}

async function enemyTurn() {
  const p = B.p, e = B.e;
  if (await tick(e)) {
    if (await checkEnd()) return;
    const mv = e.moves.find(m => Math.random() < m.c);
    if (!mv) await strike(e, p, { type: 'phys', mult: 1 }, e.name + ' attacks');
    else if (mv.heal || mv.shield) {
      const ea = B.act.e;
      await to(ea, isArmed(e) ? { arm: -2, crouch: 0.15 } : { dy: -10, sx: 1.08, sy: 1.08 }, 180, EASE.out);
      ea.aura = mv.heal ? '#6fdc8c' : '#5ad1e6';
      if (mv.heal) { heal(e, Math.round(e.maxHp * mv.heal)); log(`${e.name} uses <b>${mv.n}</b> and recovers.`); }
      else { e.fx.shield = { amt: mv.shield, t: 3 }; vfx('hex', { ...unitPos('e'), life: 0.7 }); pop(e, 'SHIELD', '#5ad1e6'); log(`${e.name} uses <b>${mv.n}</b>.`); }
      render(); await wait(300); ea.aura = null;
      await to(ea, { arm: 0, crouch: 0, dy: 0, sx: 1, sy: 1 }, 180);
    }
    else await strike(e, p, { type: 'phys', mult: mv.m, hits: mv.hits, fx: mv.fx, chance: 1, drain: mv.drain }, `${e.name}: ${mv.n}`);
  } else await sleep(400);
  if (await checkEnd()) return;
  // Hero's turn begins: drop any guard stance, regenerate a little EN, then effects tick.
  if (B.act.p.crouch > 0.01) await to(B.act.p, { crouch: 0, arm: 0, lean: 0 }, 150);
  p.en = Math.min(p.maxEn, p.en + 2 + Math.floor(stats().tec / 6));
  const acts = await tick(p);
  if (await checkEnd()) return;
  if (!acts) { await sleep(450); return enemyTurn(); }
  B.busy = false; render();
}

async function checkEnd() {
  if (B.e.hp <= 0) {
    if (B.e.phase2 && B.phase === 1) {
      B.phase = 2; B.anim.flash = 1; B.cam = 1;
      vfx('dissolve', { ...unitPos('e'), w: 160, h: 200, col: '#2a1a40', life: 1.2 });
      vfx('nova', { ...unitPos('e'), col: '#ff5aa8', life: 0.9 });
      Object.assign(B.e, { name: PHASE2.name, moves: PHASE2.moves, atk: Math.round(B.e.atk * PHASE2.atkMul), hp: Math.round(B.e.maxHp * 0.5), maxHp: Math.round(B.e.maxHp * 0.5), fx: {}, p2: true });
      B.e.mag = B.e.atk;
      log('Its armour shatters. <b>The starless void inside wakes up.</b>');
      render(); await sleep(1100);
      return false;
    }
    await endBattle('won'); return true;
  }
  if (B.p.hp <= 0) { await endBattle('lost'); return true; }
  return false;
}

async function endBattle(result) {
  const p = B.p, e = B.e;
  B.busy = true;
  S.hp = p.hp; S.en = p.en;
  const r = { result, xp: 0, cr: 0, drop: null, levels: 0 };
  if (result === 'won') {
    B.anim.eDie = 0.001;
    vfx('dissolve', { ...unitPos('e'), w: B.e.kind === 'titan' ? 200 : B.e.big ? 120 : 80, h: B.e.kind === 'titan' ? 240 : B.e.big ? 160 : 100, col: (e.col && e.col[1]) || '#ffffff', life: 1.1 });
    to(B.act.p, { arm: -2.4, lean: -0.06, crouch: 0 }, 300, EASE.out);
    r.xp = e.xp; r.cr = Math.round(e.cr * rnd(0.85, 1.15));
    S.xp += r.xp; S.cr += r.cr; S.kills++;
    if (!B.boss && Math.random() < 0.18) {
      const pool = ['medkit', 'medkit', 'cell', 'purifier', ...(S.world >= 1 ? ['megakit'] : []), ...(S.world >= 2 ? ['supercell'] : [])];
      r.drop = pool[Math.floor(Math.random() * pool.length)];
      S.inv[r.drop] = (S.inv[r.drop] || 0) + 1;
    }
    while (S.xp >= xpNext(S.lvl)) {
      S.xp -= xpNext(S.lvl); S.lvl++; S.pts += 3; S.sp += 1; r.levels++;
    }
    if (r.levels) { const st = stats(); S.hp = st.maxHp; S.en = st.maxEn; }
    if (B.kol) S.kolDown = true;
    else if (B.boss) {
      S.bosses[B.world] = true;
      S.unlocked = Math.max(S.unlocked, Math.min(PLANETS.length, B.world + 2));
      if (B.world === PLANETS.length - 1) S.done = true;
    } else S.wins[B.world]++;
    log(`<b>${e.name}</b> is defeated!`);
  } else if (result === 'lost') {
    r.cr = -Math.floor(S.cr * 0.3);
    S.cr += r.cr;
    S.hp = Math.round(stats().maxHp * 0.5);
    log('You fall... and wake up in the medbay.');
  } else log('You escape.');
  B.over = r;
  save();
  render();
}

