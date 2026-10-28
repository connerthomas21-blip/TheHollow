// Renders the anime portraits, the title screen and a cutscene with a speaker portrait.
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const out = process.argv[2];
  const server = await require('./serve')();
  const b = await chromium.launch(); const pg = await b.newPage({ viewport: { width: 1000, height: 900 } });
  const errs = []; pg.on('pageerror', e => errs.push(e.message)); pg.on('console', m => m.type() === 'error' && errs.push(m.text()));
  await pg.goto(server.url); await pg.waitForTimeout(700);
  await pg.screenshot({ path: path.join(out, 'p-title.png'), fullPage: true });
  const data = await pg.evaluate(() => {
    const ids = ['lyra', 'lyraHood', 'kol', 'kolDark', 'gm', 'vex'];
    const looks = [{ gear: 'none', hair: 'long', build: 'f', skin: 0, hairCol: 3, eyes: 4 }, { gear: 'visor' }, { gear: 'knight', beard: 'full' }, { gear: 'none', hair: 'mohawk', mark: 'tattoo', skin: 5 }, { gear: 'circlet', hair: 'braids', build: 'f', mark: 'paint', skin: 3 }, { gear: 'mask', hair: 'short', mark: 'patch' }];
    const cv = document.createElement('canvas'); const c = hiDpi(cv, 1800, 800);
    const tmp = document.createElement('canvas');
    ids.forEach((id, i) => { paintBust(tmp, bustSpec(id), 300, 400, 1000, 'full'); c.drawImage(tmp, i * 300, 0, 300, 400); });
    looks.forEach((lk, i) => { paintBust(tmp, bustFromLook({ look: lk, armor: armorStyle(ARMOR_LOOK[['a_vest', 'a_alloy', 'a_aegis', 'a_magma', 'a_void', 'a_cara'][i]]) }), 300, 400, 1000, 'full'); c.drawImage(tmp, i * 300, 400, 300, 400); });
    return cv.toDataURL();
  });
  require('fs').writeFileSync(path.join(out, 'p-sheet.png'), Buffer.from(data.split(',')[1], 'base64'));
  await pg.evaluate(() => { S = fresh(); playCutscene('w2_out', () => goTo('map'), true); for (let i = 0; i < 4; i++) { U.cs.t0 = -1e9; csAdvance(); } U.cs.t0 = -1e9; });
  await pg.waitForTimeout(1500);
  await pg.screenshot({ path: path.join(out, 'p-cutscene.png') });
  await pg.setViewportSize({ width: 390, height: 844 });
  await pg.waitForTimeout(400);
  await pg.screenshot({ path: path.join(out, 'p-cutscene-phone.png') });
  console.log('errors:', errs.length ? errs : 'none');
  await b.close(); server.close();
})();
