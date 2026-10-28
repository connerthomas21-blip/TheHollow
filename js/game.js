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

function heroUnit() {
  const st = stats();
  return { side: 'p', name: heroName(), hp: S.hp, maxHp: st.maxHp, en: S.en, maxEn: st.maxEn, atk: st.atk, mag: st.mag, def: st.armor, agi: st.agi, crit: st.crit, fx: {} };
}
function enemyUnit(d) {
  return { side: 'e', ...clone(d), maxHp: d.hp, mag: d.atk, crit: 5 + d.agi * 0.3, fx: {} };
}

function startBattle(boss) {
  const w = PLANETS[S.world];
  const def = boss ? w.boss : w.foes[Math.floor(Math.random() * w.foes.length)];
  topUpCaps();
  B = { p: heroUnit(), e: enemyUnit(def), boss, log: [], busy: false, over: null, menu: null, fl: [],
        anim: { pLunge: 0, eLunge: 0, pHit: 0, eHit: 0, flash: 0, eDie: 0, t: 0 }, vfx: [], world: S.world, phase: 1 };
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

// One attack from a to t. Returns total damage dealt.
async function strike(a, t, o, label) {
  B.anim[a.side + 'Lunge'] = 1;
  const pos = unitPos(t.side), tint = a.side === 'p' ? (o.col || '#cfeaff') : ((a.col && a.col[1]) || '#ff8a7a');
  if (o.type === 'mag' || o.type === 'both') { vfx('bolt', { from: a.side, to: t.side, col: o.col || '#5ad1e6', life: 0.24 }); await sleep(230); }
  else await sleep(180);
  let total = 0, hits = o.hits || 1, crits = 0, missed = 0;
  for (let i = 0; i < hits; i++) {
    const r = calcHit(a, t, o);
    if (r.miss) { missed++; pop(t, 'MISS', '#a29dcc'); }
    else {
      total += applyDamage(t, r.d, r.crit); if (r.crit) crits++;
      vfx('sparks', { x: pos.x + rnd(-10, 10), y: pos.y + rnd(-14, 14), col: r.crit ? '#ffd27a' : tint, seed: Math.random() * 999, life: 0.45 });
      if (o.type !== 'mag') vfx('slash', { ...pos, col: tint, dir: a.side === 'p' ? 1 : -1, life: 0.26 });
    }
    if (hits > 1) await sleep(170);
    if (t.hp <= 0) break;
  }
  if (total > 0 && o.vfx === 'ring') vfx('ring', { x: pos.x, y: GROUND, col: '#f2b544', life: 0.55 });
  if (total > 0 && o.vfx === 'nova') vfx('nova', { ...pos, col: '#9ad8ff', life: 0.6 });
  if (total > 0 && (o.fx === 'burn' || o.fx === 'poison')) vfx('burst', { ...pos, col: o.fx === 'burn' ? '#ff7a2a' : '#8aff5a', life: 0.5 });
  let msg = `${label}${hits > 1 ? ` (${hits} hits)` : ''}: `;
  msg += missed === hits ? 'miss!' : `<b>${total}</b> damage${crits ? ' (critical!)' : ''}.`;
  if (total > 0 && o.fx && t.hp > 0 && Math.random() < (o.chance ?? 1)) { addFx(t, o.fx); msg += ` ${t.name} is ${fxWord(o.fx)}.`; }
  if (o.drain && total > 0) { const h = Math.round(total * 0.5); a.hp = Math.min(a.maxHp, a.hp + h); pop(a, '+' + h, 'var(--good)'); msg += ` Drains ${h} HP.`; }
  log(msg);
  render();
  await sleep(300);
  return total;
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
  else if (kind === 'defend') { p.fx.guard = { t: 1 }; restoreEn(p, 5); log('You raise your guard. Damage halved this turn, +5 EN.'); render(); await sleep(300); }
  else if (kind === 'flee') {
    const chance = clamp(0.5 + (p.agi - e.agi) * 0.04, 0.2, 0.9);
    if (!B.boss && Math.random() < chance) return endBattle('fled');
    log(B.boss ? 'There’s no escape from this fight!' : 'You couldn’t get away!'); render(); await sleep(400);
  }
  else if (kind === 'skill') {
    const sk = SKILLS[id], r = S.skills[id], prm = { ...sk.p(r, p), ...(SKILL_FX[id] || {}) };
    p.en -= sk.en;
    if (sk.kind === 'atk') await strike(p, e, prm, sk.name);
    else if (sk.kind === 'shield') { p.fx.shield = { amt: prm.amt, t: 3 }; vfx('hex', { ...unitPos('p'), life: 0.7 }); pop(p, 'SHIELD ' + prm.amt, '#5ad1e6'); log(`${sk.name}: a ${prm.amt}-point shield surrounds you.`); }
    else if (sk.kind === 'heal') { const m = heal(p, prm.amt); cleanse(p); log(`${sk.name} ${m}.`); }
    else if (sk.kind === 'buff') { addFx(p, prm.fx, prm.turns); log(`${sk.name}! Your damage is boosted for ${prm.turns} turns.`); }
    render(); await sleep(350);
  }
  else if (kind === 'item') {
    const it = ITEMS[id];
    S.inv[id]--; if (!S.inv[id]) delete S.inv[id];
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
    else if (mv.heal) { heal(e, Math.round(e.maxHp * mv.heal)); log(`${e.name} uses <b>${mv.n}</b> and recovers.`); render(); await sleep(400); }
    else if (mv.shield) { e.fx.shield = { amt: mv.shield, t: 3 }; vfx('hex', { ...unitPos('e'), life: 0.7 }); pop(e, 'SHIELD', '#5ad1e6'); log(`${e.name} uses <b>${mv.n}</b>.`); render(); await sleep(400); }
    else await strike(e, p, { type: 'phys', mult: mv.m, hits: mv.hits, fx: mv.fx, chance: 1, drain: mv.drain }, `${e.name}: ${mv.n}`);
  } else await sleep(400);
  if (await checkEnd()) return;
  // Hero's turn begins: small EN regeneration, then effects tick.
  p.en = Math.min(p.maxEn, p.en + 2 + Math.floor(stats().tec / 6));
  const acts = await tick(p);
  if (await checkEnd()) return;
  if (!acts) { await sleep(450); return enemyTurn(); }
  B.busy = false; render();
}

async function checkEnd() {
  if (B.e.hp <= 0) {
    if (B.e.phase2 && B.phase === 1) {
      B.phase = 2; B.anim.flash = 1;
      Object.assign(B.e, { name: PHASE2.name, moves: PHASE2.moves, atk: Math.round(B.e.atk * PHASE2.atkMul), hp: Math.round(B.e.maxHp * 0.5), maxHp: Math.round(B.e.maxHp * 0.5), fx: {} });
      B.e.mag = B.e.atk;
      log('The darkness tears itself open. <b>Something worse crawls out.</b>');
      render(); await sleep(900);
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
    if (B.boss) {
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

