// Renders every hero gear set, head option and enemy to PNGs for visual review.
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const out = process.argv[2];
  const server = await require('./serve')();
  const b = await chromium.launch(); const pg = await b.newPage({ viewport: { width: 1200, height: 800 } });
  const errs = []; pg.on('pageerror', e => errs.push(e.message)); pg.on('console', m => m.type() === 'error' && errs.push(m.text()));
  await pg.goto(server.url);
  await pg.waitForTimeout(300);
  const shot = async (name, fn) => {
    const data = await pg.evaluate(fn);
    require('fs').writeFileSync(path.join(out, name), Buffer.from(data.split(',')[1], 'base64'));
  };
  await shot('gear.png', () => {
    const cv = document.createElement('canvas'); cv.width = 1200; cv.height = 300; const c = cv.getContext('2d');
    c.fillStyle = '#1d1a42'; c.fillRect(0, 0, 1200, 300);
    const sets = [['a_vest', 'w_rust', null], ['a_alloy', 'w_ion', 'x_scope'], ['a_cara', 'w_lance', 'x_boots'], ['a_aegis', 'w_grav', 'x_heart'], ['a_magma', 'w_nova', 'x_lens'], ['a_void', 'w_star', 'x_sigil']];
    sets.forEach(([ar, w, acc], i) => drawKnight(c, 90 + i * 195, 270, 1.9, { armor: armorStyle(ARMOR_LOOK[ar]), weapon: w, acc, look: DEFAULT_LOOK }, 1000));
    return cv.toDataURL();
  });
  await shot('heads.png', () => {
    const cv = document.createElement('canvas'); cv.width = 1600; cv.height = 440; const c = cv.getContext('2d');
    c.fillStyle = '#1d1a42'; c.fillRect(0, 0, 1600, 440);
    const hairs = LOOK_OPTS.hair.map(h => h[0]), beards = LOOK_OPTS.beard.map(b => b[0]), marks = LOOK_OPTS.mark.map(m => m[0]);
    for (let i = 0; i < 16; i++) {
      const lk = { gear: LOOK_OPTS.gear[i % 8][0], skin: i % 7, hair: hairs[(i + Math.floor(i / 8)) % hairs.length], hairCol: (i * 3) % 7, eyes: i % 6, beard: beards[i % 5], mark: marks[(i + 2) % 5] };
      if (i >= 8) lk.gear = ['none', 'none', 'circlet', 'mask', 'none', 'knight', 'crest', 'none'][i - 8];
      c.save(); c.translate(100 + (i % 8) * 200, 110 + Math.floor(i / 8) * 220); c.scale(6.5, 6.5); drawHead(c, lk, armorStyle(ARMOR_LOOK[['a_aegis', 'a_alloy', 'a_void', 'a_magma'][i % 4]]), null, 1000); c.restore();
    }
    return cv.toDataURL();
  });
  await shot('scenes.png', () => {
    const cv = document.createElement('canvas'); cv.width = 1440; cv.height = 960; const c = cv.getContext('2d');
    PLANETS.forEach((w, i) => { c.save(); c.translate((i % 2) * 720, Math.floor(i / 2) * 320); drawBackdrop(c, w, 1000); c.restore(); });
    return cv.toDataURL();
  });
  await shot('enemies.png', () => {
    const cv = document.createElement('canvas'); cv.width = 1400; cv.height = 900; const c = cv.getContext('2d');
    c.fillStyle = '#2a2450'; c.fillRect(0, 0, 1400, 900);
    const all = PLANETS.flatMap(p => [...p.foes, p.boss]);
    all.forEach((e, i) => {
      const col = i % 5, row = Math.floor(i / 5);
      c.save(); c.translate(0, row * 225 - GROUND + 210); drawEnemyPosed(c, e, 140 + col * 270, GROUND, e.kind === 'titan' ? 0.75 : (e.big ? 1.2 : 0.85), 1000, {}); c.restore();
      c.fillStyle = '#fff'; c.font = '14px sans-serif'; c.fillText(e.name, 60 + col * 270, row * 225 + 222);
    });
    return cv.toDataURL();
  });
  await shot('cast.png', () => {
    const cv = document.createElement('canvas'); cv.width = 1400; cv.height = 620; const c = cv.getContext('2d');
    drawBackdrop(c, SCENE_HALL, 1000); c.drawImage(c.canvas, 0, 0, 720, 320, 0, 0, 1400, 620);
    const who = ['heroSweeper', 'lyra', 'lyraHood', 'kol', 'kolDark', 'gm', 'knight'];
    who.forEach((w, i) => renderSprite(c, (s, ax, ay) => drawKnight(s, ax, ay, 1.6, { ...CAST[w](), flip: i > 3 }, 1000), { x: 110 + i * 190, y: 290, w: 300, h: 280, ax: 150, ay: 262, rim: '#fff0c8' }));
    const poses = ['kneel', 'raise', 'guard', 'bow', 'ready', 'slump'];
    poses.forEach((p, i) => renderSprite(c, (s, ax, ay) => drawKnight(s, ax, ay, 1.4, { ...CAST.lyra(), pose: POSES[p] }, 1000), { x: 110 + i * 200, y: 590, w: 300, h: 260, ax: 150, ay: 240, rim: '#fff0c8' }));
    return cv.toDataURL();
  });
  await shot('titan.png', () => {
    const cv = document.createElement('canvas'); cv.width = 1440; cv.height = 320; const c = cv.getContext('2d');
    drawBackdrop(c, 4, 1000); c.save(); c.translate(720, 0); drawBackdrop(c, 4, 1000); c.restore();
    const box = enemyBox(PLANETS[4].boss);
    renderSprite(c, (s, ax, ay) => drawEnemyPosed(s, PLANETS[4].boss, ax, ay, box.s, 1000, {}), { x: 400, y: GROUND, ...box, rim: '#d49aff' });
    renderSprite(c, (s, ax, ay) => drawEnemyPosed(s, { ...PLANETS[4].boss, p2: true }, ax, ay, box.s, 1000, { arm: -1.5 }), { x: 1120, y: GROUND, ...box, rim: '#ff5aa8' });
    return cv.toDataURL();
  });
  // creator screen and battle
  await pg.click('[data-a="new"]');
  await pg.waitForTimeout(400);
  await pg.screenshot({ path: path.join(out, 'creator.png'), fullPage: true });
  for (let i = 0; i < 2; i++) await pg.click('[data-a="cyc"][data-k="gear"][data-d="-1"]');
  await pg.click('[data-a="cyc"][data-k="hair"][data-d="1"]');
  await pg.click('[data-a="cyc"][data-k="mark"][data-d="1"]');
  await pg.fill('#heroName', 'Vessa');
  await pg.click('[data-a="create-done"]'); await pg.click('[data-a="cs-skip"]');
  await pg.click('[data-a="world"][data-id="0"]'); await pg.click('[data-a="cs-skip"]'); await pg.click('[data-a="cs-skip"]');
  await pg.evaluate(() => { S.equip = { weapon: 'w_star', armor: 'a_void', acc: 'x_lens' }; PLANETS[0].foes = [PLANETS[2].boss]; });
  await pg.click('[data-a="patrol"]'); await pg.waitForTimeout(700);
  await pg.waitForTimeout(1500);
  await pg.evaluate(() => { B.busy = false; B.p.en = 99; S.skills.star = 3; playerAction('skill', 'star'); });
  for (const ms of [200, 140, 120]) { await pg.waitForTimeout(ms); await pg.screenshot({ path: path.join(out, `swing-${ms}.png`), clip: { x: 220, y: 190, width: 760, height: 340 } }); }
  await pg.waitForTimeout(2500);
  await pg.screenshot({ path: path.join(out, 'battle2.png') });
  await pg.setViewportSize({ width: 390, height: 844 });
  await pg.evaluate(() => { B = null; U.draft = { ...S.look }; U.editing = 'game'; U.outfit = 0; U.screen = 'create'; render(); });
  await pg.waitForTimeout(300);
  await pg.screenshot({ path: path.join(out, 'creator-phone.png'), fullPage: true });
  await pg.setViewportSize({ width: 1000, height: 900 });
  for (const [id, steps] of [['prologue', 4], ['prologue', 9], ['prologue', 14], ['w2_out', 4], ['kol_down', 2], ['ending', 3]]) {
    await pg.evaluate(([id, n]) => { playCutscene(id, () => goTo('map'), true); for (let i = 0; i < n; i++) { U.cs.t0 = -1e9; csAdvance(); } U.cs.t0 = -1e9; }, [id, steps]);
    await pg.waitForTimeout(1600);
    await pg.screenshot({ path: path.join(out, `cs-${id}-${steps}.png`) });
  }
  await pg.evaluate(() => { U.cs = null; S.done = true; S.bosses = [true, true, true, true, true]; S.kolDown = true; goTo('hall'); });
  await pg.waitForTimeout(500);
  await pg.click('[data-a="talk"][data-id="lyra"]'); await pg.waitForTimeout(400);
  await pg.screenshot({ path: path.join(out, 'hall.png'), fullPage: true });
  console.log('errors:', errs.length ? errs : 'none');
  await b.close(); server.close();
})();
