// Renders the story expansion for review: trader screens, the sector chart, battles (Lyra, charge warning, singularity),
// new cutscenes and both Hall endings. Usage: node test/expansion.js <dir>
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const out = process.argv[2];
  const server = await require('./serve')();
  const b = await chromium.launch(); const pg = await b.newPage({ viewport: { width: 820, height: 1000 } });
  const errs = []; pg.on('pageerror', e => errs.push(e.message)); pg.on('console', m => m.type() === 'error' && errs.push(m.text()));
  await pg.goto(server.url);
  await pg.waitForTimeout(300);
  const snap = async (name, full = true) => { await pg.waitForTimeout(450); await pg.screenshot({ path: path.join(out, name), fullPage: full }); };
  await pg.click('[data-a="new"]'); await pg.click('[data-a="cyc"][data-k="diff"][data-d="1"]'); await snap('create-diff.png');
  await pg.click('[data-a="create-done"]'); await pg.click('[data-a="cs-skip"]');
  // a mid-game state
  await pg.evaluate(() => { Object.assign(S, { lvl: 14, unlocked: 4, world: 2, rot: 58, bosses: [true, true, true, false, false], wins: [5, 5, 5, 2, 0], lyra: 'forgive', vex: 'spare', seen: { 0: 1, 1: 1, 2: 1, 3: 1 } }); S.base.vit = 20; topUpCaps(); S.hp = stats().maxHp; goTo('map'); });
  await snap('map.png');
  for (let w = 0; w < 5; w++) { await pg.evaluate(w => { S.world = w; U.kTalk = w % 2 ? 1 : null; goTo('shop'); }, w); await snap(`shop-${w}.png`); }
  await pg.evaluate(() => { S.vex = 'execute'; S.world = 2; goTo('shop'); }); await snap('shop-2-closed.png'); await pg.evaluate(() => { S.vex = 'spare'; });
  await pg.evaluate(() => { S.world = 2; goTo('hub'); }); await snap('hub.png');
  // battle with Lyra and a charge telegraph
  await pg.evaluate(() => { S.world = 3; startBattle(true); B.e.charging = B.e.moves.find(m => m.charge); B.act.e.aura = '#ffb02a'; render(); });
  await snap('battle-charge.png', false);
  // the singularity
  await pg.evaluate(() => { B = null; S.world = 4; S.kolDown = true; S.kol = 'mercy'; startBattle(true); B.phase = 2; B.e.p2 = true; B.e.hp = 0; window.__fast = true; return checkEnd(); });
  await pg.evaluate(() => { window.__fast = false; B.hazard = 2; render(); });
  await snap('battle-singularity.png', false);
  await pg.evaluate(() => { B = null; });
  // cutscene frames
  const cs = async (id, beats, name) => {
    await pg.evaluate(([id, n]) => { playCutscene(id, () => goTo('map'), true); for (let i = 0; i < n; i++) { U.cs.t0 = -1e9; csAdvance(); } U.cs.t0 = -1e9; }, [id, beats]);
    await pg.waitForTimeout(900); await pg.screenshot({ path: path.join(out, name), fullPage: true });
  };
  await cs('prologue', 9, 'cs-relay.png');
  await cs('w0_past', 2, 'cs-w0-past.png');
  await cs('w3_past', 2, 'cs-w3-past.png');
  await cs('w4_past', 6, 'cs-rise.png');
  await cs('kol_down', 2, 'cs-kol-choice.png');
  await cs('ending', 2, 'cs-ending-gm.png');
  await cs('lost_in', 2, 'cs-lost.png');
  // both Halls
  await pg.evaluate(() => { U.cs = null; Object.assign(S, { done: true, final: 'rim', bosses: [true, true, true, true, true], kolDown: true, unlocked: 5, echo: [true, false, true, false, false] }); U.talk = { id: 'maro', n: 0 }; drawHall.cast = null; goTo('hall'); });
  await snap('hall-rim.png');
  await pg.evaluate(() => { S.final = 'order'; U.talk = { id: 'gm', n: 0 }; drawHall.cast = null; goTo('hall'); });
  await snap('hall-order.png');
  await pg.evaluate(() => { S.final = 'rim'; goTo('map'); }); await snap('map-sealed.png');
  // trial gear sprites
  const data = await pg.evaluate(() => {
    const cv = document.createElement('canvas'); cv.width = 1000; cv.height = 300; const c = cv.getContext('2d');
    c.fillStyle = '#1d1a42'; c.fillRect(0, 0, 1000, 300);
    const sets = [['a_vest', 't_glaive', 't_lantern'], ['t_horizon', 't_maul', 't_core'], ['a_aegis', 'w_sever', 'x_seal'], ['t_horizon', 'w_star', 'x_last'], ['a_alloy', 'w_ion', null]];
    sets.forEach(([ar, w, acc], i) => drawKnight(c, 100 + i * 200, 270, 1.9, { armor: armorStyle(ARMOR_LOOK[ar]), weapon: w, acc, look: { ...DEFAULT_LOOK, build: i % 2 ? 'f' : 'm' } }, 1000));
    return cv.toDataURL();
  });
  require('fs').writeFileSync(path.join(out, 'trial-gear.png'), Buffer.from(data.split(',')[1], 'base64'));
  console.log('errors:', errs.length ? errs : 'none');
  await b.close(); server.close();
})();
