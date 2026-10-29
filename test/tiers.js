// Renders the six armour tiers side by side, as sprites and as portraits, for both builds.
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const out = process.argv[2];
  const server = await require('./serve')();
  const b = await chromium.launch(); const pg = await b.newPage();
  const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.goto(server.url); await pg.waitForTimeout(500);
  const data = await pg.evaluate(() => {
    const sets = [['a_vest', 'w_rust'], ['a_alloy', 'w_ion'], ['a_cara', 'w_lance'], ['a_aegis', 'w_grav'], ['a_magma', 'w_nova'], ['a_void', 'w_star']];
    const cv = document.createElement('canvas'), c = hiDpi(cv, 1800, 1300), tmp = document.createElement('canvas');
    c.fillStyle = '#1d1a2a'; c.fillRect(0, 0, 1800, 1300);
    sets.forEach(([ar, w], i) => {
      for (const [row, build] of [[0, 'm'], [1, 'f']]) {
        const hl = { armor: armorStyle(ARMOR_LOOK[ar]), weapon: w, acc: null, look: { ...DEFAULT_LOOK, build, gear: 'knight', hair: build === 'f' ? 'tail' : 'short', beard: build === 'f' ? 'none' : 'stubble' } };
        renderSprite(c, (s, ax, ay) => drawKnight(s, ax, ay, 1.9, hl, 1000), { x: 150 + i * 300, y: 300 + row * 300, w: 300, h: 290, ax: 140, ay: 272, rim: '#ffb48a' });
        if (row === 0) { paintBust(tmp, bustFromLook(hl), 300, 340, 1000, 'full'); c.drawImage(tmp, i * 300, 640, 300, 340); }
        else { paintBust(tmp, bustFromLook(hl), 300, 300, 1000, 'full'); c.drawImage(tmp, i * 300, 990, 300, 300); }
      }
    });
    return cv.toDataURL();
  });
  require('fs').writeFileSync(path.join(out, 'tiers.png'), Buffer.from(data.split(',')[1], 'base64'));
  console.log('errors:', errs.length ? errs : 'none');
  await b.close(); server.close();
})();
