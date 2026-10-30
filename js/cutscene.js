'use strict';
/* ============================== CUTSCENES ============================== */

const csName = () => (S && S.name) || (loadSaved() || {}).name || (loadPending() || {}).name || 'Kael';
const fmt = s => String(s || '').replace(/\{name\}/g, csName());
// Story flags: the live game, else the saved game; choices made while replaying stay local to the replay.
const storyState = () => ({ ...(S || loadSaved() || {}), ...((U.cs && U.cs.tmp) || {}) });
const POSE_KEYS = ['arm', 'lean', 'crouch'];

function playCutscene(id, then, replay = false) {
  U.cs = { id, i: -1, cast: {}, bg: 0, fade: 0, flash: 0, shake: 0, title: null, say: null, choice: null, then, replay, tmp: {}, t0: 0 };
  U.screen = 'cutscene';
  csAdvance();
}
function curPose(a, now = performance.now()) {
  const k = a.fromPose ? Math.min(1, (now - a.pt0) / 280) : 1, out = {};
  for (const p of POSE_KEYS) { const to = a.pose[p] || 0, from = a.fromPose ? (a.fromPose[p] || 0) : to; out[p] = from + (to - from) * EASE.io(k); }
  return out;
}
function csApply(b) {
  const cs = U.cs, now = performance.now();
  if (b.bg != null && b.bg !== cs.bg) { cs.bg = b.bg; cs.fade = now; }
  if (b.cast === null) cs.cast = {};
  else if (b.cast) for (const [k, v] of Object.entries(b.cast)) {
    if (v === null) { delete cs.cast[k]; continue; }
    const prev = cs.cast[k];
    cs.cast[k] = { who: v.who, def: CAST[v.who](), x: v.x, from: v.x, to: v.x, t0: now, ms: 0, flip: !!v.flip, scale: v.scale || 1, alpha: v.alpha ?? 1,
      pose: POSES[v.pose || 'stand'], fromPose: prev ? curPose(prev, now) : null, pt0: now };
  }
  if (b.move) for (const [k, m] of Object.entries(b.move)) { const a = cs.cast[k]; if (a) Object.assign(a, { from: a.x, to: m.x, t0: now, ms: m.ms || 1000 }); }
  if (b.pose) for (const [k, p] of Object.entries(b.pose)) { const a = cs.cast[k]; if (a) Object.assign(a, { fromPose: curPose(a, now), pose: POSES[p], pt0: now }); }
  if (b.fx === 'flash') cs.flash = now;
  if (b.fx === 'shake') cs.shake = now;
  if (b.title) cs.title = { text: b.title, t0: now };
  cs.say = b.say || null; cs.choice = b.choice || null; cs.key = b.key; cs.t0 = now;
}
function csAdvance() {
  const cs = U.cs, beats = CUTSCENES[cs.id].beats;
  for (;;) {
    cs.i++;
    if (cs.i >= beats.length) return csEnd();
    const b = beats[cs.i];
    if (b.if && !b.if()) continue;
    csApply(b);
    if (b.say || b.choice) break;
  }
  render();
}
function csChoose(v) {
  const cs = U.cs;
  cs.tmp[cs.key] = v;
  if (!cs.replay && S) { S[cs.key] = v; save(); }
  csAdvance();
}
function csSkip() {
  const cs = U.cs, beats = CUTSCENES[cs.id].beats;
  // A skipped choice takes its first option, so the story stays consistent.
  for (let i = cs.i; i < beats.length; i++) if (beats[i].choice && storyState()[beats[i].key] == null) { cs.tmp[beats[i].key] = beats[i].choice[0][1]; if (!cs.replay && S) S[beats[i].key] = beats[i].choice[0][1]; }
  csEnd();
}
function csNext() {
  const cs = U.cs;
  if (!cs || cs.choice) return;
  if (performance.now() - cs.t0 < fmt(cs.say?.[1]).length / 0.045) { cs.t0 = -1e9; return; }   // first press finishes the line
  csAdvance();
}
function csEnd() {
  const cs = U.cs;
  if (!cs.replay && S) { S.cs = S.cs || {}; S.cs[cs.id] = true; storyRewards(); save(); }
  U.cs = null;
  cs.then();
}

let csRaf = 0;
function drawActor(c, a, t, now, rim) {
  const k = a.ms ? Math.min(1, (now - a.t0) / a.ms) : 1, moving = a.ms && k < 1;
  a.x = a.from + (a.to - a.from) * k;
  const flip = moving ? a.to < a.from : a.flip, pose = { ...curPose(a, now), walk: moving ? now * 0.012 : undefined }, d = a.def;
  const sh = c.createRadialGradient(a.x, GROUND + 3, 1, a.x, GROUND + 3, 36 * a.scale);
  sh.addColorStop(0, `rgba(0,0,0,${0.5 * a.alpha})`); sh.addColorStop(1, 'rgba(0,0,0,0)');
  c.save(); c.translate(a.x, GROUND + 3); c.scale(1, 0.22); c.beginPath(); c.arc(0, 0, 40 * a.scale, 0, Math.PI * 2); c.restore();
  c.fillStyle = sh; c.fill();
  if (d.enemy) {
    const box = enemyBox(d.enemy), s = (huge(d.enemy) ? 0.95 : 1.25) * a.scale;
    renderSprite(c, (g, ax, ay) => drawEnemyPosed(g, d.enemy, ax, ay, s, t, { ...pose, lean: pose.lean * 0.5 }), { x: a.x, y: GROUND, w: box.w, h: box.h, ax: box.ax, ay: box.ay, rim, alpha: a.alpha, silhouette: d.silhouette });
  } else {
    renderSprite(c, (g, ax, ay) => drawKnight(g, ax, ay, 1.4 * a.scale, { ...d, flip, pose }, t), { x: a.x, y: GROUND, w: 300, h: 260, ax: 150, ay: 240, rim, alpha: a.alpha });
  }
}
function csLoop(t) {
  csRaf = 0;
  const cv = document.getElementById('csCanvas'), cs = U.cs;
  if (!cv || !cs) return;
  trackFrame(t - (csLoop.last || t)); csLoop.last = t;
  const c = stageCtx(cv), now = performance.now();
  c.save();
  if (cs.shake && now - cs.shake < 700 && !RM) { const k = 1 - (now - cs.shake) / 700; c.translate((Math.random() - 0.5) * 14 * k, (Math.random() - 0.5) * 9 * k); }
  drawBackdrop(c, cs.bg, t);
  const rim = SCENE_RIM[cs.bg];
  for (const a of Object.values(cs.cast)) drawActor(c, a, t, now, rim);
  drawForeground(c, cs.bg, t);
  grade(c, cs.bg, t);
  c.restore();
  bloom(c, cv, 0.45);
  if (cs.fade && now - cs.fade < 700) { c.fillStyle = `rgba(0,0,0,${1 - (now - cs.fade) / 700})`; c.fillRect(0, 0, W, H); }
  if (cs.flash && now - cs.flash < 500) { c.fillStyle = `rgba(255,255,255,${0.85 * (1 - (now - cs.flash) / 500)})`; c.fillRect(0, 0, W, H); }
  // letterbox
  c.fillStyle = '#000'; c.fillRect(0, 0, W, 18); c.fillRect(0, H - 18, W, 18);
  if (cs.title) {
    const age = now - cs.title.t0, al = age < 400 ? age / 400 : age > 2600 ? Math.max(0, 1 - (age - 2600) / 600) : 1;
    if (al > 0) {
      c.save(); c.globalAlpha = al; c.textAlign = 'center';
      c.fillStyle = 'rgba(0,0,0,0.45)'; c.fillRect(0, H / 2 - 40, W, 70);
      c.font = '600 13px "Chakra Petch", sans-serif'; c.fillStyle = '#f2b544'; c.fillText('—  —  —', W / 2, H / 2 - 16);
      c.font = '700 30px "Chakra Petch", sans-serif'; c.fillStyle = '#ffffff'; c.fillText(cs.title.text.toUpperCase(), W / 2, H / 2 + 18);
      c.restore();
    }
  }
  const pc = document.getElementById('csPortrait');
  if (pc) { const id = pc.dataset.id; paintBust(pc, bustSpec(id), 150, 170, t, null, id === 'kolDark' ? '#9a3aff' : id === 'keeper' || id === 'lost' ? '#2ab8b0' : null); }
  // typewriter text
  const el = document.getElementById('csText');
  if (el && cs.say) {
    const full = fmt(cs.say[1]), n = Math.min(full.length, Math.max(0, Math.floor((now - cs.t0) * 0.045)));
    if (+el.dataset.n !== n) { el.textContent = full.slice(0, n); el.dataset.n = n; }
  }
  csRaf = requestAnimationFrame(csLoop);
}

// Which portrait goes with each speaker.
function speakerPortrait(cs) {
  const s = cs.say && cs.say[0];
  if (!s) return null;
  if (s === '{name}') return 'hero';
  if (s === 'Lyra') return 'lyra';
  if (s === 'Hooded stranger') return 'lyraHood';
  if (s === 'Hooded figure') return 'kolHood';
  if (s === 'Master Kol') return (cs.cast.kol && cs.cast.kol.who === 'kolDark') || cs.id === 'w4_in' ? 'kolDark' : 'kol';
  if (s === 'Grand Master') return 'gm';
  if (s === 'Admiral Vex') return 'vex';
  const k = KEEPERS.find(k => k.name === s); if (k) return k.id;
  if (s === 'The Lost Sweeper') return 'lost';
  return null;
}
function screenCutscene() {
  const cs = U.cs, sc = CUTSCENES[cs.id], who = cs.say && cs.say[0] ? fmt(cs.say[0]) : '', por = speakerPortrait(cs);
  const line = fmt(cs.say ? cs.say[1] : '');
  return `<div class="panel cs">
    <div class="row between"><span class="label">${esc(sc.title)}</span><button class="btn small" data-a="cs-skip">Skip scene</button></div>
    <canvas id="csCanvas" width="${W}" height="${H}" data-a="cs-next" aria-label="Cutscene"></canvas>
    <div class="cs-box${who ? '' : ' narration'}${por ? ' has-portrait' : ''}">
      ${por ? `<canvas id="csPortrait" class="cs-portrait" width="150" height="170" data-id="${por}" aria-hidden="true"></canvas>` : ''}
      <div class="cs-words">
      ${who ? `<div class="cs-who">${esc(who)}</div>` : ''}
      <p id="csText" class="cs-text" data-n="0" aria-hidden="true"></p>
      <p class="sr-only" aria-live="polite">${who ? esc(who) + ': ' : ''}${esc(line)}</p>
      </div>
    </div>
    <div class="row cs-actions">${cs.choice
      ? cs.choice.map(([l, v]) => `<button class="btn primary" data-a="cs-choose" data-id="${v}">${esc(l)}</button>`).join('')
      : `<button class="btn primary" data-a="cs-next">Next ▶</button><span class="dim note">Space or click to continue</span>`}</div>
  </div>`;
}

/* ---------- Story menu and Hall of Heroes ---------- */
function screenStoryMenu() {
  const st = S || loadSaved();
  return `<div class="panel">
    <div class="row between"><h2>Story so far</h2><button class="btn small" data-a="back">← Back</button></div>
    <p class="dim">Replay any scene you’ve reached. Choices made in a replay don’t change your saved game.</p>
    <div class="list">${STORY_ORDER.map(id => {
      const open = storyUnlocked(id, st);
      return `<div class="item"><div><div class="name">${open ? esc(CUTSCENES[id].title) : 'Not reached yet'}</div></div>
        ${open ? `<button class="btn small" data-a="cs-replay" data-id="${id}">Watch</button>` : '<span class="tag">Locked</span>'}</div>`;
    }).join('')}</div>
  </div>`;
}

// Who's in the hall, and what they say, depends on the last choice: the Rim saved (a new hall on Veyra) or the Order saved.
const RIM_END = () => (S && S.final) === 'rim';
const HALL_TALK = {
  gm: ['Grand Master', [
    'The Order has never been stronger, and the Rim has never been safer. You see? I was right.',
    'Kol’s name has been struck from the rolls. Yours is carved where his used to be. Wear it well, Hand of the Order.',
    'In thirty years the Hollow will stir. We will talk then about which world. Not today.']],
  maro: ['Old Maro', [
    'They’re building the new hall right on my old street. I’m charging them rent.',
    'The Grand Master’s trial starts next month. The whole Rim wants a seat. I’m selling tickets.',
    'No more Hollow. Forty-one of us lived to see it. Feels like it should have been more.']],
  lyra: ['Lyra', () => {
    const st = storyState(), cold = st.lyra === 'cold';
    if (st.final === 'order') return cold ? [
      'You kept his secret. Maybe now you understand why I kept mine.',
      'Every night I look out at the edge of the Rim and wonder which world it’ll be.',
      'I’ll still fight for you. I just can’t cheer for this.'] : [
      'I’m still here. Not because I agree with you.',
      'Every night I look out at the edge of the Rim and wonder which world it’ll be.',
      'If you ever decide to tell the truth about the pact, I’ll be standing next to you when you do.'];
    return cold ? [
      'I’m still here. I said I’d earn it, and I meant it.',
      'Veyra’s first new house went up this morning. I thought you should know.',
      'If you ever go back out past the Rim, take me with you. Please.'] : [
      'Three years I couldn’t look at you. Now I can’t stop grinning. It’s embarrassing.',
      'Veyra’s first new house went up this morning. They hung your crest over the door.',
      'No Citadel, no Grand Master, no secrets. Just us and the stars. I like it.'];
  }],
  squire: ['Squire Tamsin', [
    'Is it true you beat the Warden with a rusted sword? Everyone in the barracks says so.',
    'I want to be a Sweeper like you. Lyra says I hold my blade like a broom.',
    'They’re writing a song about you. It’s not very good yet.',
    'Old Maro says there are echoes in the Rifts that look like the bosses you beat. Are you going to fight them? Can I watch?']],
};
function hallLine(id, n) { const [who, lines] = HALL_TALK[id], list = typeof lines === 'function' ? lines() : lines; return [who, list[n % list.length]]; }
const hallElder = () => RIM_END() ? 'maro' : 'gm';

function screenHall() {
  const trophies = [...PLANETS.slice(0, 4).map((w, i) => [w.boss.name, w.name, S.bosses[i]]), [KOL.name, PLANETS[4].name, S.kolDown], [PLANETS[4].boss.name, PLANETS[4].name, S.bosses[4]]];
  const echoes = PLANETS.map((w, i) => ['Echo of ' + w.boss.name, w.name, S.echo[i]]);
  const talk = U.talk ? hallLine(U.talk.id, U.talk.n) : null, elder = hallElder();
  const pick = (v, a, b) => v == null ? '—' : v === a[0] ? a[1] : b;
  return `${hud()}<div class="panel">
    <div class="row between"><h2>${RIM_END() ? 'The Hall on Veyra' : 'Hall of Heroes'}</h2><button class="btn small" data-a="go-map">← Star chart</button></div>
    <canvas id="hallCanvas" width="${W}" height="${H}" aria-label="The Hall, with you, Lyra, Squire Tamsin and ${elder === 'gm' ? 'the Grand Master' : 'Old Maro'}"></canvas>
    <p class="hall-title">${esc(heroName())} the Starbreaker${RIM_END() ? '' : ', Hand of the Order'}</p>
    <div class="talk" aria-live="polite">${talk ? `<b>${esc(talk[0])}</b><span>${esc(talk[1])}</span>` : '<span class="dim">The hall is full of people who want a word with you.</span>'}</div>
    <div class="row">
      <button class="btn small" data-a="talk" data-id="${elder}">Talk to ${elder === 'gm' ? 'the Grand Master' : 'Old Maro'}</button>
      <button class="btn small" data-a="talk" data-id="lyra">Talk to Lyra</button>
      <button class="btn small" data-a="talk" data-id="squire">Talk to Squire Tamsin</button>
    </div>
    <h3>Trophies</h3>
    <div class="grid3">${trophies.map(([n, w, ok]) => `<div class="item"><div><div class="name">${esc(n)}</div><div class="desc">${esc(w)}</div></div>${ok ? '<span class="tag on">Defeated</span>' : '<span class="tag">Not yet</span>'}</div>`).join('')}</div>
    <h3>Echoes of the Rift</h3>
    <p class="dim">Every world now has an Echo: its boss at full strength. Fight them from each world. Sweep all five and the Lantern Keeper will want a word.</p>
    <div class="grid3">${echoes.map(([n, w, ok]) => `<div class="item"><div><div class="name">${esc(n)}</div><div class="desc">${esc(w)}</div></div>${ok ? '<span class="tag on">Swept</span>' : '<span class="tag">Waiting</span>'}</div>`).join('')}
      <div class="item"><div><div class="name">${S.lostDown ? 'The Lost Sweeper' : '???'}</div><div class="desc">${S.lostDown ? 'The first Sweeper' : 'Unknown'}</div></div>${S.lostDown ? '<span class="tag on">At rest</span>' : '<span class="tag">Hidden</span>'}</div></div>
    <h3>Record</h3>
    <div class="grid3">
      <div class="item"><div><div class="label">Level</div><div class="num">${S.lvl}</div></div></div>
      <div class="item"><div><div class="label">Enemies beaten</div><div class="num">${S.kills}</div></div></div>
      <div class="item"><div><div class="label">Difficulty</div><div class="num">${esc(diff().name)}</div></div></div>
      <div class="item"><div><div class="label">Lyra</div><div class="num">${pick(S.lyra, ['cold', 'Earning it back'], 'Forgiven')}</div></div></div>
      <div class="item"><div><div class="label">Admiral Vex</div><div class="num">${pick(S.vex, ['execute', 'Executed'], 'Spared')}</div></div></div>
      <div class="item"><div><div class="label">Master Kol</div><div class="num">${pick(S.kol, ['justice', 'Justice'], 'Mercy')}</div></div></div>
      <div class="item"><div><div class="label">The last choice</div><div class="num">${pick(S.final, ['rim', 'Saved the Rim'], 'Saved the Order')}</div></div></div>
      <div class="item"><div><div class="label">Rift trials</div><div class="num">${S.trials.filter(Boolean).length} / 5</div></div></div>
    </div>
    <div class="row"><button class="btn" data-a="story-open">Replay the story</button></div>
  </div>`;
}
function drawHall(cv, t) {
  const c = stageCtx(cv), now = performance.now(), bg = RIM_END() ? 0 : SCENE_HALL;
  drawBackdrop(c, bg, t);
  if (!drawHall.cast) drawHall.cast = [['squire', 120, false, 0.85], ['lyra', 230, false, 1], ['hero', 360, false, 1.05], [hallElder(), 500, true, 1], ['knight', 630, true, 1.1]]
    .map(([who, x, flip, scale]) => ({ who, def: who === 'squire' ? SQUIRE() : CAST[who](), x, from: x, to: x, ms: 0, flip, scale, alpha: 1, pose: POSES.stand }));
  for (const a of drawHall.cast) {
    a.pose = U.talk && U.talk.id === a.who ? POSES.point : a.who === 'hero' ? POSES.raise : POSES.stand;
    drawActor(c, a, t, now, SCENE_RIM[bg]);
  }
  drawForeground(c, bg, t);
  grade(c, bg, t);
  bloom(c, cv, 0.4);
}
const SQUIRE = () => ({ armor: armorStyle({ base: '#9aa4b4', trim: '#2ab8b0', pauldron: 'pad', cape: '#1e6a6a' }), look: { build: 'f', gear: 'none', skin: 4, hair: 'braids', hairCol: 0, eyes: 1, beard: 'none', mark: 'none' }, weapon: 'w_rust' });
