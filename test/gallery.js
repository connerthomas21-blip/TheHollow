// Renders every hero gear set, head option and enemy to PNGs for visual review.
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const out = process.argv[2];
  const html = require('fs').readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const b = await chromium.launch(); const pg = await b.newPage({ viewport: { width: 1200, height: 800 } });
  const errs = []; pg.on('pageerror', e => errs.push(e.message)); pg.on('console', m => m.type() === 'error' && errs.push(m.text()));
  await pg.setContent(`<!doctype html><meta charset="utf-8">` + html);
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
    const cv = document.createElement('canvas'); cv.width = 1200; cv.height = 260; const c = cv.getContext('2d');
    c.fillStyle = '#1d1a42'; c.fillRect(0, 0, 1200, 260);
    const looks = LOOK_OPTS.gear.map(([g], i) => ({ gear: g, skin: i, hair: ['long', 'tail', 'mohawk', 'long', 'short', 'mohawk'][i], hairCol: i, eyes: i % 6, beard: ['none', 'stubble', 'full'][i % 3], mark: ['scar', 'paint', 'none'][i % 3] }));
    looks.forEach((lk, i) => { c.save(); c.translate(100 + i * 200, 130); c.scale(6, 6); drawHead(c, lk, armorStyle(ARMOR_LOOK.a_aegis), null, 1000); c.restore(); });
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
  await pg.click('[data-a="look"][data-k="gear"][data-v="none"]'); await pg.click('[data-a="look"][data-k="hair"][data-v="long"]');
  await pg.fill('#heroName', 'Vessa');
  await pg.click('[data-a="create-done"]'); await pg.click('[data-a="story-next"]');
  await pg.click('[data-a="world"][data-id="0"]'); await pg.click('[data-a="story-next"]');
  await pg.evaluate(() => { S.equip = { weapon: 'w_star', armor: 'a_void', acc: 'x_lens' }; PLANETS[0].foes = [PLANETS[2].boss]; });
  await pg.click('[data-a="patrol"]'); await pg.waitForTimeout(600);
  await pg.screenshot({ path: path.join(out, 'battle2.png') });
  await pg.setViewportSize({ width: 390, height: 844 });
  await pg.evaluate(() => { B = null; U.draft = { ...S.look }; U.editing = true; U.screen = 'create'; render(); });
  await pg.waitForTimeout(300);
  await pg.screenshot({ path: path.join(out, 'creator-phone.png'), fullPage: true });
  console.log('errors:', errs.length ? errs : 'none');
  await b.close();
})();
