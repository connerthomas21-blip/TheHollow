// Renders each main character's expressions (neutral, smile, sad, angry, shock, grim, blink, talking) for review.
// Usage: node test/moods.js <dir>
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const out = process.argv[2], server = await require('./serve')();
  const b = await chromium.launch(); const pg = await b.newPage();
  const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.goto(server.url); await pg.waitForTimeout(300);
  const data = await pg.evaluate(() => {
    const ids = ['lyra', 'kol', 'hero', 'gm', 'vex', 'sesk'], moods = [{}, { mood: 'smile' }, { mood: 'sad' }, { mood: 'angry' }, { mood: 'shock' }, { mood: 'grim' }, { blink: true }, { talk: 0.9 }, { mood: 'smile', talk: 0.8 }];
    const cw = 130, ch = 130, cv = document.createElement('canvas'); cv.width = cw * moods.length; cv.height = ch * ids.length; const c = cv.getContext('2d');
    const tmp = document.createElement('canvas'); tmp.width = cw; tmp.height = ch;
    ids.forEach((id, r) => moods.forEach((m, k) => { paintBust(tmp, { ...bustSpec(id), ...m }, cw, ch, 1000, 'face'); c.drawImage(tmp, k * cw, r * ch, cw, ch); }));
    return cv.toDataURL();
  });
  require('fs').writeFileSync(path.join(out, 'moods.png'), Buffer.from(data.split(',')[1], 'base64'));
  console.log('errors:', errs.length ? errs : 'none'); await b.close(); server.close();
})();
