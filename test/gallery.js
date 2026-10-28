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
      c.save(); c.translate(0, row * 225 - GROUND + 210); drawEnemy(c, e, 140 + col * 270, (e.big ? 1.2 : 0.85), 1000, 0); c.restore();
      c.fillStyle = '#fff'; c.font = '14px sans-serif'; c.fillText(e.name, 60 + col * 270, row * 225 + 222);
    });
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
  await pg.click('[data-a="create-done"]'); await pg.click('[data-a="story-next"]');
  await pg.click('[data-a="world"][data-id="0"]'); await pg.click('[data-a="story-next"]');
  await pg.evaluate(() => { S.equip = { weapon: 'w_star', armor: 'a_void', acc: 'x_lens' }; PLANETS[0].foes = [PLANETS[2].boss]; });
  await pg.click('[data-a="patrol"]'); await pg.waitForTimeout(700);
  await pg.evaluate(() => { B.busy = false; B.p.en = 99; S.skills.star = 3; });
  await pg.evaluate(() => playerAction('skill', 'star'));
  await pg.waitForTimeout(150);
  await pg.screenshot({ path: path.join(out, 'battle2.png') });
  await pg.setViewportSize({ width: 390, height: 844 });
  await pg.evaluate(() => { B = null; U.draft = { ...S.look }; U.editing = 'game'; U.outfit = 0; U.screen = 'create'; render(); });
  await pg.waitForTimeout(300);
  await pg.screenshot({ path: path.join(out, 'creator-phone.png'), fullPage: true });
  console.log('errors:', errs.length ? errs : 'none');
  await b.close(); server.close();
})();
