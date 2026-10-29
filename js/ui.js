'use strict';
/* ============================== RENDERING: DOM ============================== */

const app = document.getElementById('app');
const esc = s => String(s).replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));

function bar(label, cur, max, color) {
  const pct = max ? clamp(cur / max * 100, 0, 100) : 0;
  return `<div class="bar"><div class="meta"><span class="label">${label}</span><span class="num">${Math.round(cur)} / ${Math.round(max)}</span></div>
    <div class="track"><div class="fill" style="width:${pct}%;background:${color}"></div></div></div>`;
}
function hud() {
  const st = stats();
  const hp = B && !B.over ? B.p.hp : S.hp, en = B && !B.over ? B.p.en : S.en;
  return `<div class="hud">
    <div class="who"><canvas class="portrait" data-portrait width="80" height="80" aria-hidden="true"></canvas><span>${esc(heroName())}<small>${S.done ? 'Starbreaker · ' : ''}LV ${S.lvl}</small></span></div>
    <div class="bars">${bar('HP', hp, st.maxHp, 'var(--hp)')}${bar('EN', en, st.maxEn, 'var(--en)')}${bar('XP', S.xp, xpNext(S.lvl), 'var(--xp)')}</div>
    <div class="hud-end"><span class="credits num">${S.cr.toLocaleString()} cr</span>
      <button class="btn small" data-a="main-menu" ${B && !B.over ? 'disabled title="Finish the battle first"' : ''}>Main menu</button></div>
  </div>`;
}
const globeStyle = w => `background: radial-gradient(circle at 35% 35%, ${w.globe[0]}, ${w.globe[1]}); --glow:${w.glow}`;

function screenTitle() {
  const sv = loadSaved();
  const sub = sv ? `${esc(sv.name || 'Kael')} \u00B7 Level ${sv.lvl} \u00B7 ${esc(PLANETS[sv.world || 0].name)}` : 'No saved game yet';
  return `<div class="panel title-card">
    <canvas id="titleCanvas" width="720" height="360" aria-hidden="true"></canvas>
    <h1 class="sr-only">Starbreaker Saga</h1>
    <p>A disgraced Sweeper Knight. A master who lied. Five worlds and one darkness at the edge of the stars. Fight, level up, gear up and win back your name.</p>
    <span class="label">${sub}</span>
    <div class="menu-col">
      ${sv ? `<button class="btn primary" data-a="continue">Continue</button>` : ''}
      <button class="btn ${sv ? '' : 'primary'}" data-a="new">New game</button>
      <button class="btn" data-a="look-open">Appearance</button>
      <button class="btn" data-a="story-open">Story</button>
    </div>
    ${U.confirmNew ? `<div class="row" style="justify-content:center"><span class="dim">This replaces your saved game.</span><button class="btn small" data-a="new-yes">Start over</button><button class="btn small" data-a="new-no">Keep my save</button></div>` : ''}
    <details style="max-width:420px;width:100%;text-align:left"><summary class="dim" style="cursor:pointer">Load a save code</summary>
      <div style="display:flex;flex-direction:column;gap:8px;margin-top:8px"><textarea id="importBox" placeholder="Paste a save code"></textarea><button class="btn small" data-a="import">Load save code</button></div></details>
  </div>`;
}

const COLOUR_NAMES = {
  skin: ['Fair', 'Light', 'Tan', 'Brown', 'Deep', 'Azure', 'Jade'],
  hairCol: ['Black', 'Brown', 'Auburn', 'Blonde', 'Silver', 'Crimson', 'Cobalt'],
  eyes: ['Cyan', 'Amber', 'Green', 'Red', 'Violet', 'White'],
};
const LOOK_ROWS = [['build', 'Build'], ['gear', 'Headgear'], ['hair', 'Hair'], ['hairCol', 'Hair colour'], ['skin', 'Skin'], ['eyes', 'Eyes and visor glow'], ['beard', 'Beard'], ['mark', 'Face mark']];
const lookList = k => k === 'skin' ? SKIN : k === 'hairCol' ? HAIR : k === 'eyes' ? EYES : LOOK_OPTS[k];
function cycleLook(k, d) {
  if (k === 'diff') { const ks = Object.keys(DIFFICULTY), i = ks.indexOf(U.diff || 'knight'); U.diff = ks[(i + d + ks.length) % ks.length]; return; }
  if (k === 'outfit') { U.outfit = ((U.outfit || 0) + d + OUTFITS.length) % OUTFITS.length; return; }
  const list = lookList(k), colour = k in COLOUR_NAMES;
  const i = colour ? U.draft[k] : list.findIndex(o => o[0] === U.draft[k]);
  const n = ((i < 0 ? 0 : i) + d + list.length) % list.length;
  U.draft[k] = colour ? n : list[n][0];
}
function diffRow() {
  const dk = U.diff || 'knight', ks = Object.keys(DIFFICULTY), d = DIFFICULTY[dk];
  return `<div class="cyc"><span class="label">Difficulty</span><div class="cyc-ctl">
      <button class="btn small arrow" data-a="cyc" data-k="diff" data-d="-1" aria-label="Previous difficulty">\u25C0</button>
      <span class="cyc-val">${esc(d.name)}<small>${ks.indexOf(dk) + 1}/${ks.length}</small></span>
      <button class="btn small arrow" data-a="cyc" data-k="diff" data-d="1" aria-label="Next difficulty">\u25B6</button></div></div>
    <span class="dim note">${esc(d.desc)}</span>`;
}
function screenCreate() {
  const d = U.draft, mode = U.editing;
  const row = (k, label) => {
    const list = lookList(k), colour = k in COLOUR_NAMES;
    const i = colour ? d[k] : Math.max(0, list.findIndex(o => o[0] === d[k]));
    const name = colour ? COLOUR_NAMES[k][i] : list[i][1];
    return `<div class="cyc"><span class="label">${label}</span><div class="cyc-ctl">
      <button class="btn small arrow" data-a="cyc" data-k="${k}" data-d="-1" aria-label="Previous ${label.toLowerCase()}">\u25C0</button>
      <span class="cyc-val">${colour ? `<i class="chip" style="background:${list[i]}"></i>` : ''}${name}<small>${i + 1}/${list.length}</small></span>
      <button class="btn small arrow" data-a="cyc" data-k="${k}" data-d="1" aria-label="Next ${label.toLowerCase()}">\u25B6</button></div></div>`;
  };
  const oi = U.outfit || 0, outfitName = oi ? GEAR[OUTFITS[oi][0]].name + ' set' : (S || loadSaved() ? 'Your current gear' : 'Starting gear');
  const hairNote = ['none', 'circlet', 'mask'].includes(d.gear) ? '' : (d.gear === 'knight' || d.gear === 'crest') ? 'Long hair, ponytails and braids show under an open helm.' : 'Hair is hidden under this headgear.';
  const title = mode === 'new' ? 'Create your knight' : 'Appearance';
  const note = mode === 'pending' ? 'No saved game yet. This look is used when you start a new game.' : mode === 'saved' ? 'Changes apply to your saved game.' : '';
  return `<div class="panel">
    <div class="row between"><h2>${title}</h2><button class="btn small" data-a="back">\u2190 Back</button></div>
    ${note ? `<p class="dim">${note}</p>` : ''}
    <div class="creator">
      <div class="preview">
        <canvas id="createCanvas" width="240" height="300" aria-label="Your knight, full body"></canvas>
        <canvas id="createPortrait" class="portrait-big" width="150" height="150" aria-label="Close-up of your knight's head"></canvas>
      </div>
      <div class="opts">
        ${mode === 'new' ? diffRow() : ''}
        <div class="opt"><label class="label" for="heroName">Name</label><input id="heroName" maxlength="16" autocomplete="off" value="${esc(U.draftName)}"></div>
        ${LOOK_ROWS.map(([k, l]) => row(k, l) + (k === 'hair' && hairNote ? `<span class="dim note">${hairNote}</span>` : '')).join('')}
        <div class="cyc outfit"><span class="label">Preview outfit</span><div class="cyc-ctl">
          <button class="btn small arrow" data-a="cyc" data-k="outfit" data-d="-1" aria-label="Previous outfit">\u25C0</button>
          <span class="cyc-val">${outfitName}<small>${oi + 1}/${OUTFITS.length}</small></span>
          <button class="btn small arrow" data-a="cyc" data-k="outfit" data-d="1" aria-label="Next outfit">\u25B6</button></div></div>
        <span class="dim note">Outfit preview only changes this picture. In the game, your look follows the gear you equip.</span>
      </div>
    </div>
    <div class="row"><button class="btn primary" data-a="create-done">${mode === 'new' ? 'Begin' : 'Save appearance'}</button><button class="btn" data-a="look-random">Randomise</button><button class="btn" data-a="look-reset">Reset</button></div>
  </div>`;
}

function screenMap() {
  return `${hud()}<div class="panel">
    <div class="row between"><h2>Star chart</h2><div class="row"><button class="btn small" data-a="story-open">Story</button><button class="btn small" data-a="look-open">Appearance</button><button class="btn small" data-a="go-status">Status${S.pts ? ` (${S.pts})` : ''}</button><button class="btn small" data-a="go-skills">Skills${S.sp ? ` (${S.sp})` : ''}</button></div></div>
    ${S.done ? `<div class="row between"><p style="color:var(--gold)">${S.final === 'order' ? 'The Hollow sleeps, bound by the Order’s secret.' : 'The Hollow is gone. The Rim is yours to roam.'} Echoes of old foes wait in every world.</p><button class="btn small primary" data-a="go-hall">${S.final === 'rim' ? 'The Hall on Veyra' : 'Hall of Heroes'}</button></div>` : ''}
    <canvas id="sectorCanvas" class="sector" width="720" height="200" aria-label="Map of the sector: your five worlds, and the Hollow at the edge"></canvas>
    ${S.done ? '' : `<div class="hollow">${bar(`The Hollow’s pull · ${ROT_NAME[ROT_TIER(S.rot || 0)]}`, S.rot || 0, 100, '#a04aff')}
      <span class="dim note">Patrols and defeats feed the black hole. Bosses and Rift trials push it back. Every 25 points makes enemies tougher, and better paid.</span></div>`}
    <div class="worlds">${PLANETS.map((w, i) => {
      const locked = i >= S.unlocked;
      return `<button class="btn world ${locked ? 'locked' : ''}" data-a="world" data-id="${i}" ${locked ? 'disabled' : ''}>
        <div class="globe" style="${globeStyle(w)}"></div>
        <div class="info"><div>${locked ? 'Unknown signal' : esc(w.name)}</div>
        <span class="sub">${locked ? 'Defeat the previous boss' : `${esc(w.sub)} · LV ${w.lv}`}</span>
        <span class="sub">${S.bosses[i] ? '✓ Boss defeated' : locked ? '' : `${Math.min(S.wins[i], WINS_FOR_BOSS)}/${WINS_FOR_BOSS} patrols`}</span></div>
      </button>`;
    }).join('')}</div>
  </div>`;
}

function screenHub() {
  const w = PLANETS[S.world], i = S.world, st = stats();
  const ready = S.wins[i] >= WINS_FOR_BOSS, kolNext = i === PLANETS.length - 1 && !S.kolDown, bossName = kolNext ? KOL.name : w.boss.name;
  const restCost = (S.hp >= st.maxHp && S.en >= st.maxEn) ? 0 : 5 + S.lvl * 3, k = KEEPERS[i];
  const medLeft = S.done ? 99 : diff().med - (S.med[i] || 0), medNote = medLeft <= 0 ? 'No visits left. Beat the boss to restock' : restCost ? `Full repair · ${restCost} cr` : 'Fully repaired';
  return `${hud()}<div class="panel">
    <div class="hub-head"><div class="globe" style="${globeStyle(w)}"></div>
      <div style="min-width:0;display:flex;flex-direction:column;gap:6px"><h2>${esc(w.name)}</h2><span class="dim">${esc(w.sub)} · recommended LV ${w.lv}</span>
      <div class="progress" aria-label="Patrol progress"><div style="width:${Math.min(100, S.wins[i] / WINS_FOR_BOSS * 100)}%"></div></div></div>
      <button class="hub-hero" data-a="look-open" aria-label="Change appearance"><canvas id="hubHero" width="96" height="120" aria-hidden="true"></canvas></button></div>
    <div class="grid3">
      <button class="btn primary" data-a="patrol" ${S.hp <= 0 ? 'disabled' : ''}>Patrol<span class="sub">Fight a random enemy</span></button>
      <button class="btn" data-a="boss" ${!ready || S.hp <= 0 ? 'disabled' : ''}>${S.bosses[i] ? 'Rematch boss' : 'Boss'}<span class="sub">${ready ? esc(bossName) : `${WINS_FOR_BOSS - S.wins[i]} more patrols`}</span></button>
      <button class="btn" data-a="rest" ${restCost === 0 || S.cr < restCost || medLeft <= 0 ? 'disabled' : ''}>Medbay${medLeft < 50 ? ` · ${Math.max(0, medLeft)} left` : ''}<span class="sub">${medNote}</span></button>
      <button class="btn" data-a="go-shop">${esc(k.shop)}<span class="sub">${k.closed && k.closed(S) ? 'Supply kiosk' : `Trade and talk with ${esc(k.name)}`}</span></button>
      <button class="btn" data-a="go-status">Status${S.pts ? ` · ${S.pts} pts` : ''}<span class="sub">Stats and equipment</span></button>
      <button class="btn" data-a="go-skills">Skills${S.sp ? ` · ${S.sp} pts` : ''}<span class="sub">Learn and rank up</span></button>
      ${S.bosses[i] ? `<button class="btn" data-a="trial" ${S.hp <= 0 ? 'disabled' : ''}>${esc(TRIALS[i].name)}<span class="sub">${S.trials[i] ? 'Cleared · run it again' : `Rift trial · win the ${esc(GEAR[TRIALS[i].reward].name)}`}</span></button>` : ''}
      ${S.done ? `<button class="btn" data-a="echo" ${S.hp <= 0 ? 'disabled' : ''}>Echo of ${esc(w.boss.name)}<span class="sub">${S.echo[i] ? 'Swept · fight again' : 'Post-game boss at full strength'}</span></button>` : ''}
    </div>
    ${S.bosses[i] && !S.trials[i] ? `<p class="dim note">${esc(TRIALS[i].text)} Three fights in a row: no items, no medbay, no escape.</p>` : ''}
    <div class="row"><button class="btn small" data-a="go-map">← Star chart</button><button class="btn small" data-a="go-save">Save code</button></div>
  </div>`;
}

function screenBattle() {
  const p = B.p, e = B.e, o = B.over;
  const fxl = u => Object.keys(u.fx).map(k => `<span class="fx">${k === 'shield' ? 'SHIELD ' + u.fx.shield.amt : k.toUpperCase()}</span>`).join('');
  const els = u => (u.weak || []).map(x => `<span class="fx weak">WEAK: ${EL_NAME[x]}</span>`).join('') + (u.resist || []).map(x => `<span class="fx res">RESISTS ${EL_NAME[x]}</span>`).join('');
  let actions;
  if (o) {
    const lines = [];
    if (o.result === 'won') {
      lines.push(`<h3>Victory</h3>`);
      lines.push(`<div class="row"><span class="num" style="color:var(--xp)">+${o.xp} XP</span><span class="num" style="color:var(--gold)">+${o.cr} cr</span>${o.drop ? `<span>Found: ${ITEMS[o.drop].name}</span>` : ''}</div>`);
      if (o.levels) lines.push(`<p style="color:var(--gold)">Level up! You are now level ${S.lvl}. +${o.levels * 3} stat points, +${o.levels} skill point${o.levels > 1 ? 's' : ''}. HP and EN restored.</p>`);
      const newSk = Object.entries(SKILLS).filter(([id, s]) => !S.skills[id] && s.lv <= S.lvl);
      if (o.levels && newSk.length) lines.push(`<p>New skill available to learn: ${newSk.map(([, s]) => s.name).join(', ')}.</p>`);
      if (o.next) lines.push(`<p>Rift fight ${B.trial.n} of ${B.trial.of} cleared. Your wounds come with you.</p>`);
      if (o.reward) lines.push(`<p style="color:var(--gold)">Rift trial complete! You won the <b>${GEAR[o.reward].name}</b>: ${gearText(GEAR[o.reward])}. Equip it from Status.</p>`);
      if (B.mode === 'lost') lines.push(`<p style="color:var(--gold)">You won the <b>Last Light</b>: ${gearText(GEAR.x_last)}.</p>`);
    } else if (o.result === 'lost') lines.push(`<h3>Defeated</h3><p class="dim">${B.trial ? 'The rift spits you out. ' : ''}The medbay pulled you back. Repair costs took ${-o.cr} cr. You wake with half HP.</p>`);
    else lines.push(`<h3>Escaped</h3>`);
    if (!S.done && ['patrol', 'boss'].includes(B.mode) || o.result !== 'won' && !S.done) lines.push(`<p class="dim">The Hollow’s pull: ${Math.round(S.rot)}/100 · ${ROT_NAME[ROT_TIER(S.rot)]}</p>`);
    actions = `<div class="panel" style="padding:14px">${lines.join('')}<div class="row"><button class="btn primary" data-a="battle-done">${o.next ? 'Next fight' : 'Continue'}</button></div></div>`;
  } else if (B.menu === 'skills') {
    const list = Object.keys(S.skills).map(id => { const s = SKILLS[id]; return `<button class="btn" data-a="use-skill" data-id="${id}" ${B.busy || p.en < s.en ? 'disabled' : ''}>${s.name} <span class="num" style="color:var(--en)">${s.en} EN</span><span class="sub">${s.desc}</span></button>`; }).join('');
    actions = `<div class="grid2">${list}<button class="btn" data-a="menu-back">← Back</button></div>`;
  } else if (B.menu === 'items') {
    const ids = Object.keys(S.inv).filter(id => S.inv[id] > 0);
    const list = ids.map(id => `<button class="btn" data-a="use-item" data-id="${id}" ${B.busy ? 'disabled' : ''}>${ITEMS[id].name} ×${S.inv[id]}<span class="sub">${ITEMS[id].desc}</span></button>`).join('');
    actions = `<div class="grid2">${list || '<p class="dim">Your pack is empty.</p>'}<button class="btn" data-a="menu-back">← Back</button></div>`;
  } else {
    const dis = B.busy ? 'disabled' : '';
    actions = `<div class="actions">
      <button class="btn primary" data-a="attack" ${dis}>Attack</button>
      <button class="btn" data-a="menu-skills" ${dis}>Skills</button>
      <button class="btn" data-a="menu-items" ${dis || (B.trial ? 'disabled title="No items in a Rift trial"' : '')}>Items</button>
      <button class="btn${e.charging ? ' primary' : ''}" data-a="defend" ${dis}>Defend</button>
      <button class="btn" data-a="flee" ${dis || (B.boss || B.trial ? 'disabled' : '')}>Flee</button></div>`;
  }
  return `${hud()}<div class="panel" style="gap:10px">
    <div class="combatants">
      <div class="cbox"><span class="nm">${esc(heroName())}${B.ally ? ' <span class="dim">&amp; Lyra</span>' : ''}</span>${bar('HP', p.hp, p.maxHp, 'var(--hp)')}<div class="fxrow">${fxl(p)}${B.hazard ? `<span class="fx">DEBRIS ${B.hazard}</span>` : ''}</div></div>
      <div class="cbox"><span class="nm" style="text-align:right">${esc(e.name)}${B.trial ? ` · RIFT ${B.trial.n}/${B.trial.of}` : B.boss ? ' · BOSS' : ''}</span>${bar('HP', e.hp, e.maxHp, 'var(--hp)')}<div class="fxrow" style="justify-content:flex-end">${els(e)}${fxl(e)}</div></div>
    </div>
    <canvas id="battleCanvas" width="${W}" height="${H}" aria-label="Battle scene"></canvas>
    <div class="log" aria-live="polite">${B.log.map(l => `<div>${l}</div>`).join('')}</div>
    ${e.charging && !o ? `<div class="warn" role="status">\u26A0 <b>${esc(e.name)}</b> is charging <b>${esc(e.charging.n)}</b>. Defend to brace and take a quarter of the damage.</div>` : ''}
    ${actions}
  </div>`;
}

function screenShop() {
  const wmax = S.world + 1, k = KEEPERS[S.world], closed = k.closed && k.closed(S);
  const tab = closed ? 'items' : U.tab;
  let body;
  if (tab === 'items') {
    body = Object.entries(ITEMS).filter(([, it]) => it.w <= wmax).map(([id, it]) => `<div class="item">
      <div><div class="name">${it.name} <span class="dim num">×${S.inv[id] || 0}</span></div><div class="desc">${it.desc}</div></div>
      <div class="row"><button class="btn small" data-a="buy-item" data-id="${id}" ${S.cr < it.price ? 'disabled' : ''}>Buy · ${it.price} cr</button></div></div>`).join('');
  } else {
    body = Object.entries(GEAR).filter(([id, g]) => g.w <= wmax || S.gear.includes(id)).map(([id, g]) => {
      const owned = S.gear.includes(id), eq = S.equip[g.slot] === id;
      const sell = Math.floor(g.price / 2);
      return `<div class="item"><div><div class="name">${g.name} <span class="tag">${g.slot === 'acc' ? 'accessory' : g.slot}</span> ${eq ? '<span class="tag on">equipped</span>' : ''}</div>
        <div class="desc">${gearText(g)}</div></div>
        <div class="row">${owned
          ? (eq ? '' : `<button class="btn small" data-a="equip" data-id="${id}">Equip</button>${sell ? `<button class="btn small" data-a="sell" data-id="${id}">Sell · ${sell} cr</button>` : ''}`)
          : `<button class="btn small" data-a="buy-gear" data-id="${id}" ${S.cr < g.price ? 'disabled' : ''}>Buy · ${g.price} cr</button>`}</div></div>`;
    }).join('');
  }
  const lines = keeperTalk(k, S), line = U.kTalk == null ? keeperLine(k.greet, S) : lines[U.kTalk % lines.length];
  const lostReady = S.world === PLANETS.length - 1 && S.done && S.echo.every(Boolean) && !S.lostDown;
  const card = closed
    ? `<div class="talk"><span>${esc(closed)}</span></div>`
    : `<div class="keeper"><canvas id="keeperPortrait" class="cs-portrait" width="150" height="170" data-id="${k.id}" aria-hidden="true"></canvas>
      <div class="keeper-words"><div class="cs-who">${esc(k.name)}</div><p aria-live="polite">${esc(line)}</p>
        <div class="row"><button class="btn small" data-a="k-talk">${U.kTalk == null ? 'Ask what happened here' : 'Keep talking'}</button>
        ${lostReady ? '<button class="btn small primary" data-a="lost">Follow the Lantern Keeper</button>' : ''}</div></div></div>`;
  return `${hud()}<div class="panel">
    <div class="row between"><h2>${esc(closed ? 'Supply kiosk' : k.shop)} · ${esc(PLANETS[S.world].name)}</h2><button class="btn small" data-a="go-hub">← Back</button></div>
    ${card}
    <div class="tabs"><button class="tab" data-a="tab" data-id="items" aria-pressed="${tab === 'items'}">Supplies</button>${closed ? '' : `<button class="tab" data-a="tab" data-id="gear" aria-pressed="${tab === 'gear'}">Gear</button>`}</div>
    <div class="list">${body}</div>
  </div>`;
}
const gearText = g => bonusText(g.b) + (g.perk ? ` · <i>${esc(g.perk)}</i>` : '');
const bonusText = b => Object.entries(b).map(([k, v]) => `+${v} ${BONUS_LABEL[k]}`).join(' · ');

function screenStatus() {
  const st = stats();
  const info = { str: 'Sword damage', def: 'Armour', agi: 'Crit chance, dodge, escape', tec: 'Tech damage, EN, healing', vit: 'Max HP' };
  const rows = ['str', 'def', 'agi', 'tec', 'vit'].map(k => `<div class="stat"><span class="k">${k.toUpperCase()}</span>
    <span><span class="num">${st[k]}</span> <span class="dim">${st[k] !== S.base[k] ? `(${S.base[k]} base) ` : ''}· ${info[k]}</span></span>
    <button class="btn small" data-a="add-stat" data-id="${k}" ${S.pts ? '' : 'disabled'} aria-label="Add a point to ${k}">+1</button></div>`).join('');
  const slots = ['weapon', 'armor', 'acc'].map(slot => {
    const g = GEAR[S.equip[slot]];
    const others = S.gear.filter(id => GEAR[id].slot === slot && id !== S.equip[slot]);
    return `<div class="item"><div><div class="label">${slot === 'acc' ? 'Accessory' : slot === 'armor' ? 'Armour' : 'Weapon'}</div><div class="name">${g ? g.name : 'Empty'}</div><div class="desc">${g ? gearText(g) : ''}</div></div>
      <div class="row">${others.map(id => `<button class="btn small" data-a="equip" data-id="${id}">${GEAR[id].name}</button>`).join('')}</div></div>`;
  }).join('');
  return `${hud()}<div class="panel">
    <div class="row between"><h2>Status</h2><div class="row"><button class="btn small" data-a="edit-look">Change appearance</button><button class="btn small" data-a="back">← Back</button></div></div>
    <div class="row"><span class="label">Stat points</span><span class="num" style="color:var(--gold)">${S.pts}</span></div>
    <div class="list">${rows}</div>
    <div class="grid3">
      <div class="item"><div><div class="label">Attack</div><div class="num">${st.atk}</div></div></div>
      <div class="item"><div><div class="label">Tech attack</div><div class="num">${st.mag}</div></div></div>
      <div class="item"><div><div class="label">Armour</div><div class="num">${st.armor}</div></div></div>
      <div class="item"><div><div class="label">Crit</div><div class="num">${st.crit.toFixed(1)}%</div></div></div>
      <div class="item"><div><div class="label">Enemies beaten</div><div class="num">${S.kills}</div></div></div>
      <div class="item"><div><div class="label">Next level</div><div class="num">${xpNext(S.lvl) - S.xp} XP</div></div></div>
    </div>
    <h3>Equipment</h3><div class="list">${slots}</div>
    <h3>Pack</h3><div class="list">${Object.keys(S.inv).filter(id => S.inv[id] > 0).map(id => `<div class="item"><div><div class="name">${ITEMS[id].name} ×${S.inv[id]}</div><div class="desc">${ITEMS[id].desc}</div></div>
      ${ITEMS[id].battleOnly ? '' : `<button class="btn small" data-a="field-item" data-id="${id}">Use</button>`}</div>`).join('') || '<p class="dim">Empty.</p>'}</div>
  </div>`;
}

function screenSkills() {
  const rows = Object.entries(SKILLS).map(([id, s]) => {
    const r = S.skills[id] || 0, can = S.lvl >= s.lv;
    const btn = r >= 5 ? '<span class="tag on">max rank</span>'
      : `<button class="btn small" data-a="skill-up" data-id="${id}" ${can && S.sp > 0 ? '' : 'disabled'}>${r ? 'Rank up' : 'Learn'} · 1 pt</button>`;
    return `<div class="item"><div><div class="name">${s.name} <span class="num dim">${r ? `rank ${r}/5` : can ? 'not learned' : `unlocks at LV ${s.lv}`}</span></div>
      <div class="desc">${s.desc} <span class="num" style="color:var(--en)">${s.en} EN</span></div></div>${btn}</div>`;
  }).join('');
  return `${hud()}<div class="panel">
    <div class="row between"><h2>Skills</h2><button class="btn small" data-a="back">← Back</button></div>
    <div class="row"><span class="label">Skill points</span><span class="num" style="color:var(--gold)">${S.sp}</span><span class="dim">You earn one per level. Each rank adds roughly 15% power.</span></div>
    <div class="list">${rows}</div>
  </div>`;
}

function screenSave() {
  return `${hud()}<div class="panel">
    <div class="row between"><h2>Save code</h2><button class="btn small" data-a="go-hub">← Back</button></div>
    <p class="dim">Your game saves automatically in this browser. Copy this code to move your game to another device or keep a backup.</p>
    <textarea id="saveBox" readonly>${encodeSave()}</textarea>
    <div class="row"><button class="btn small" data-a="copy-save">Copy code</button></div>
  </div>`;
}

let prevScreen = 'hub';
function render() {
  const sc = U.screen;
  const view = { cutscene: screenCutscene, storymenu: screenStoryMenu, hall: screenHall, create: screenCreate, title: screenTitle, map: screenMap, hub: screenHub, battle: screenBattle, shop: screenShop, status: screenStatus, skills: screenSkills, save: screenSave }[sc];
  // Keep live canvases alive across re-renders so animation never blinks.
  const cid = sc === 'battle' ? 'battleCanvas' : sc === 'cutscene' ? 'csCanvas' : null, keep = cid && document.getElementById(cid);
  app.innerHTML = view();
  if (keep) document.getElementById(cid).replaceWith(keep);
  if (sc === 'battle' && !raf) raf = requestAnimationFrame(loop);
  if (sc === 'cutscene' && !csRaf) csRaf = requestAnimationFrame(csLoop);
  if (sc === 'hall') drawHall.cast = null;
  for (const cv of app.querySelectorAll('canvas[data-portrait]')) drawPortrait(cv, heroLook(), 40);
  if (sc === 'title') ambientLoop.hero = null;
  if (['title', 'create', 'hub', 'hall', 'map', 'shop'].includes(sc) && !ambient) { ambient = true; requestAnimationFrame(ambientLoop); }
}

function toast(msg) {
  const t = document.getElementById('toast'); t.textContent = msg; t.hidden = false;
  clearTimeout(toast.h); toast.h = setTimeout(() => (t.hidden = true), 2200);
}


// Screen change usable from anywhere (cutscene callbacks included).
function goTo(s) { if (['status', 'skills', 'create', 'storymenu'].includes(s) && !['status', 'skills', 'create', 'storymenu'].includes(U.screen)) prevScreen = U.screen; U.screen = s; render(); scrollTo(0, 0); }

function enterWorld(i) {
  S.world = i; save();
  if (!S.seen[i]) { S.seen[i] = true; save(); return playCutscene('w' + i + '_in', () => playCutscene('w' + i + '_past', () => goTo('hub'))); }
  U.screen = 'hub'; render();
}

/* ============================== INPUT ============================== */

app.addEventListener('click', ev => {
  const el = ev.target.closest('[data-a]'); if (!el || el.disabled) return;
  const a = el.dataset.a, id = el.dataset.id;
  const go = goTo;
  switch (a) {
    case 'new': if (loadSaved() && !U.confirmNew) { U.confirmNew = true; render(); break; } // falls through when no save exists
    case 'new-yes': { U.confirmNew = false; S = null; U.diff = 'knight'; const pend = loadPending() || {}; U.draft = { ...DEFAULT_LOOK, ...pend.look }; U.draftName = pend.name || 'Kael'; U.editing = 'new'; U.outfit = 0; go('create'); break; }
    case 'look-open': {
      const sv = S ? null : loadSaved(), src = S || sv || loadPending() || {};
      U.editing = S ? 'game' : sv ? 'saved' : 'pending';
      U.draft = { ...DEFAULT_LOOK, ...src.look }; U.draftName = src.name || 'Kael'; U.outfit = 0; go('create'); break;
    }
    case 'cyc': cycleLook(el.dataset.k, +el.dataset.d); render(); app.querySelector(`[data-a="cyc"][data-k="${el.dataset.k}"][data-d="${el.dataset.d}"]`)?.focus(); break;
    case 'look-reset': U.draft = { ...DEFAULT_LOOK }; render(); break;
    case 'main-menu': if (B && !B.over) break; B = null; if (S) save(); S = null; U.confirmNew = false; go('title'); break;
    case 'look-random': {
      const pick = l => l[Math.floor(Math.random() * l.length)], n = l => Math.floor(Math.random() * l.length);
      U.draft = { gear: pick(LOOK_OPTS.gear)[0], skin: n(SKIN), hair: pick(LOOK_OPTS.hair)[0], hairCol: n(HAIR), eyes: n(EYES), beard: pick(LOOK_OPTS.beard)[0], mark: pick(LOOK_OPTS.mark)[0] };
      render(); break;
    }
    case 'edit-look': U.draft = { ...DEFAULT_LOOK, ...S.look }; U.draftName = S.name; U.editing = 'game'; U.outfit = 0; go('create'); break;
    case 'create-done': {
      const name = (U.draftName || '').trim().slice(0, 16) || 'Kael';
      const look = { ...U.draft };
      if (U.editing === 'game') { S.look = look; S.name = name; save(); }
      else if (U.editing === 'saved') { const sv = loadSaved(); if (sv) { sv.look = look; sv.name = name; try { localStorage.setItem(SAVE_KEY, JSON.stringify(sv)); } catch (e) {} } }
      else if (U.editing === 'pending') savePending({ look, name });
      if (U.editing !== 'new') { toast('Appearance saved'); go(prevScreen); break; }
      savePending({ look, name });
      S = fresh(); S.look = look; S.name = name; S.diff = U.diff || 'knight'; topUpCaps(); save();
      playCutscene('prologue', () => goTo('map')); break;
    }
    case 'new-no': U.confirmNew = false; render(); break;
    case 'continue': S = Object.assign(fresh(), loadSaved()); topUpCaps(); go('map'); break;
    case 'import': try { S = decodeSave(document.getElementById('importBox').value); topUpCaps(); save(); toast('Save loaded'); go('map'); } catch (e) { toast('That code didn’t work. Check it was copied in full.'); } break;
    case 'story-next': { const f = U.story.then; U.story = null; f(); break; }
    case 'world': enterWorld(+id); break;
    case 'go-map': go('map'); break;
    case 'go-hub': go('hub'); break;
    case 'go-shop': U.kTalk = null; go('shop'); break;
    case 'k-talk': U.kTalk = U.kTalk == null ? 0 : U.kTalk + 1; render(); break;
    case 'trial': startBattle(false, { mode: 'trial', trial: { n: 1, of: 3 } }); log('<b>Rift trial.</b> Three fights. No items, no escape.'); render(); break;
    case 'echo': startBattle(true, { mode: 'echo' }); break;
    case 'lost': playCutscene('lost_in', () => startBattle(true, { mode: 'lost' })); break;
    case 'go-status': go('status'); break;
    case 'go-skills': go('skills'); break;
    case 'go-save': go('save'); break;
    case 'back': go(U.screen === 'create' && U.editing === 'new' ? 'title' : prevScreen); break;
    case 'tab': U.tab = id; render(); break;
    case 'patrol': startBattle(false); break;
    case 'boss': {
      const kolNext = S.world === PLANETS.length - 1 && !S.kolDown;
      if (kolNext && !(S.cs && S.cs.kol_in)) playCutscene('kol_in', () => startBattle(true));
      else startBattle(true);
      break;
    }
    case 'cs-next': csNext(); break;
    case 'cs-skip': csSkip(); break;
    case 'cs-choose': csChoose(id); break;
    case 'cs-replay': playCutscene(id, () => goTo('storymenu'), true); break;
    case 'story-open': go('storymenu'); break;
    case 'go-hall': U.talk = null; go('hall'); break;
    case 'talk': U.talk = U.talk && U.talk.id === id ? { id, n: U.talk.n + 1 } : { id, n: 0 }; render(); break;
    case 'rest': { const st = stats(), cost = 5 + S.lvl * 3, left = S.done ? 99 : diff().med - (S.med[S.world] || 0); if (S.cr >= cost && left > 0) { S.cr -= cost; S.hp = st.maxHp; S.en = st.maxEn; if (!S.done) S.med[S.world] = (S.med[S.world] || 0) + 1; save(); toast(left - 1 < 50 ? `Fully repaired · ${left - 1} visit${left === 2 ? '' : 's'} left here` : 'Fully repaired'); render(); } break; }
    case 'buy-item': { const it = ITEMS[id]; if (S.cr >= it.price) { S.cr -= it.price; S.inv[id] = (S.inv[id] || 0) + 1; save(); toast(`Bought ${it.name}`); render(); } break; }
    case 'buy-gear': { const g = GEAR[id]; if (S.cr >= g.price && !S.gear.includes(id)) { S.cr -= g.price; S.gear.push(id); S.equip[g.slot] = id; topUpCaps(); save(); toast(`Bought and equipped ${g.name}`); render(); } break; }
    case 'sell': { const g = GEAR[id]; if (S.equip[g.slot] !== id) { S.gear = S.gear.filter(x => x !== id); S.cr += Math.floor(g.price / 2); save(); toast(`Sold ${g.name}`); render(); } break; }
    case 'equip': S.equip[GEAR[id].slot] = id; topUpCaps(); save(); render(); break;
    case 'add-stat': if (S.pts > 0) { const before = stats(); S.base[id]++; S.pts--; const after = stats(); S.hp += after.maxHp - before.maxHp; S.en += after.maxEn - before.maxEn; topUpCaps(); save(); render(); } break;
    case 'skill-up': { const s = SKILLS[id]; if (S.sp > 0 && S.lvl >= s.lv && (S.skills[id] || 0) < 5) { S.skills[id] = (S.skills[id] || 0) + 1; S.sp--; save(); toast(`${s.name} is now rank ${S.skills[id]}`); render(); } break; }
    case 'field-item': {
      const it = ITEMS[id], st = stats(), u = { hp: S.hp, maxHp: st.maxHp, en: S.en, maxEn: st.maxEn };
      it.use(u); S.hp = u.hp; S.en = u.en; S.inv[id]--; if (!S.inv[id]) delete S.inv[id]; save(); toast(`Used ${it.name}`); render(); break;
    }
    case 'copy-save': { const box = document.getElementById('saveBox'); navigator.clipboard?.writeText(box.value).then(() => toast('Copied'), () => { box.select(); toast('Press Ctrl+C to copy'); }) ?? box.select(); break; }
    // battle
    case 'attack': playerAction('attack'); break;
    case 'defend': playerAction('defend'); break;
    case 'flee': playerAction('flee'); break;
    case 'menu-skills': B.menu = 'skills'; render(); break;
    case 'menu-items': B.menu = 'items'; render(); break;
    case 'menu-back': B.menu = null; render(); break;
    case 'use-skill': playerAction('skill', id); break;
    case 'use-item': playerAction('item', id); break;
    case 'battle-done': {
      const o = B.over, won = o.result === 'won', mode = B.mode, wi = B.world;
      if (won && o.next) { startBattle(false, { mode: 'trial', trial: { ...B.trial, n: B.trial.n + 1 } }); break; }
      B = null;
      const seen = id => S.cs && S.cs[id];
      if (won && mode === 'kol') playCutscene('kol_down', () => goTo('hub'));
      else if (won && mode === 'lost') playCutscene('lost_out', () => goTo('hub'));
      else if (won && mode === 'boss' && wi === PLANETS.length - 1) { if (!seen('ending')) playCutscene('ending', () => { U.talk = null; drawHall.cast = null; goTo('hall'); }); else go('hub'); }
      else if (won && mode === 'boss' && !seen('w' + wi + '_out') && !S.seen['out' + wi]) { S.seen['out' + wi] = true; playCutscene('w' + wi + '_out', () => { toast(`New world unlocked: ${PLANETS[wi + 1].name}`); goTo('map'); }); }
      else go('hub');
      break;
    }
  }
});

app.addEventListener('input', ev => { if (ev.target.id === 'heroName') U.draftName = ev.target.value; });

// Keyboard: in cutscenes Space/Enter continues and Esc skips; in battle 1 Attack, 2 Skills, 3 Items, 4 Defend, 5 Flee, Esc back.
document.addEventListener('keydown', ev => {
  if (U.screen === 'cutscene' && U.cs && !/INPUT|TEXTAREA|BUTTON/.test(ev.target.tagName)) {
    if (ev.key === ' ' || ev.key === 'Enter') { ev.preventDefault(); csNext(); }
    if (ev.key === 'Escape') csSkip();
    return;
  }
  if (U.screen !== 'battle' || !B || ev.target.tagName === 'TEXTAREA') return;
  const map = { '1': 'attack', '2': 'menu-skills', '3': 'menu-items', '4': 'defend', '5': 'flee', 'Escape': 'menu-back', 'Enter': 'battle-done' };
  const a = map[ev.key]; if (!a) return;
  const el = app.querySelector(`[data-a="${a}"]`); if (el && !el.disabled) el.click();
});

/* ============================== BOOT ============================== */

function start(data) {
  if (data && data.save) { try { S = Object.assign(fresh(), JSON.parse(data.save)); topUpCaps(); U.screen = 'map'; } catch (e) {} }
  render();
}
window.claude?.hot?.snapshot?.(() => ({ save: S ? JSON.stringify(S) : null }));
window.claude?.hot?.ready ? window.claude.hot.ready(start) : start(window.claude?.hot?.data ?? {});
