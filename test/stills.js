// Renders every story still for review. Usage: node test/stills.js <dir>
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const out = process.argv[2], server = await require('./serve')();
  const b = await chromium.launch(); const pg = await b.newPage({ viewport: { width: 1280, height: 900 } });
  const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.goto(server.url); await pg.waitForTimeout(300);
  for (const [id, cg] of [['prologue', 'veyra_orbit'], ['kol_down', 'kol_kneel'], ['lost_in', 'lost_reveal']]) {
    await pg.evaluate(([id, cg]) => { playCutscene(id, () => goTo('title'), true); while (U.cs && U.cs.cg !== cg) { U.cs.t0 = -1e9; csAdvance(); } }, [id, cg]);
    await pg.waitForTimeout(3600);   // let any title card fade
    await (await pg.$('#csCanvas')).screenshot({ path: path.join(out, `still-${id}.png`) });
  }
  // the Citadel only falls if you save the Rim
  await pg.evaluate(() => { playCutscene('ending', () => goTo('title'), true); U.cs.tmp.final = 'rim'; U.cs.tmp.lyra = 'forgive'; while (U.cs && U.cs.cg !== 'citadel_fall') { U.cs.t0 = -1e9; csAdvance(); } });
  await pg.waitForTimeout(1500);
  await (await pg.$('#csCanvas')).screenshot({ path: path.join(out, 'still-citadel.png') });
  console.log('errors:', errs.length ? errs : 'none'); await b.close(); server.close();
})();
