// Close-ups of portrait faces for checking proportions.
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const out = process.argv[2];
  const server = await require('./serve')();
  const b = await chromium.launch(); const pg = await b.newPage();
  const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.goto(server.url); await pg.waitForTimeout(500);
  const data = await pg.evaluate(() => {
    const specs = [bustSpec('lyra'), bustSpec('kol'), bustSpec('vex'), bustSpec('gm'),
      bustFromLook({ look: { build: 'f', gear: 'none', hair: 'long', mark: 'patch', hairCol: 0, skin: 4, eyes: 3 }, armor: armorStyle(ARMOR_LOOK.a_void) }),
      bustFromLook({ look: { gear: 'mask', hair: 'mohawk', mark: 'tattoo', skin: 5 }, armor: armorStyle(ARMOR_LOOK.a_magma) }),
      bustFromLook({ look: { gear: 'hood', build: 'f' }, armor: armorStyle(ARMOR_LOOK.a_aegis) }),
      bustFromLook({ look: { gear: 'circlet', hair: 'braids', beard: 'moustache', mark: 'paint' }, armor: armorStyle(ARMOR_LOOK.a_cara) })];
    const cv = document.createElement('canvas'), c = hiDpi(cv, 1600, 800), tmp = document.createElement('canvas');
    specs.forEach((sp, i) => { paintBust(tmp, sp, 400, 400, 1000, 'face'); c.drawImage(tmp, (i % 4) * 400, Math.floor(i / 4) * 400, 400, 400); });
    return cv.toDataURL();
  });
  require('fs').writeFileSync(path.join(out, 'faces.png'), Buffer.from(data.split(',')[1], 'base64'));
  console.log('errors:', errs.length ? errs : 'none');
  await b.close(); server.close();
})();
