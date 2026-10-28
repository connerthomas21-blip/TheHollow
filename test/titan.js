// Win rate against the final boss at a fixed build, to compare boss variants.
const { chromium } = require('playwright');
(async () => {
  const server = await require('./serve')();
  const b = await chromium.launch(); const pg = await b.newPage();
  await pg.goto(server.url);
  const out = await pg.evaluate(async () => {
    window.__fast = true;
    const run = async (kind, n) => {
      let wins = 0, p2 = 0;
      for (let k = 0; k < n; k++) {
        S = fresh(); S.lvl = 18; S.base = { str: 22, def: 12, agi: 8, tec: 10, vit: 18 };
        S.equip = { weapon: 'w_star', armor: 'a_magma', acc: 'x_sigil' }; S.gear = Object.values(S.equip);
        S.skills = { slash: 5, star: 5, over: 3, repair: 3, barrier: 2, inferno: 2 }; S.inv = { megakit: 2, supercell: 2 };
        S.world = 4; S.kolDown = true; topUpCaps(); S.hp = stats().maxHp; S.en = stats().maxEn;
        PLANETS[4].boss.kind = kind;
        startBattle(true);
        let turns = 0;
        while (!B.over && turns < 300) {
          if (B.busy) { await new Promise(r => setTimeout(r, 0)); continue; }
          turns++;
          const p = B.p, kit = ['megakit', 'medkit'].find(x => S.inv[x] > 0);
          if (p.hp < p.maxHp * 0.35 && S.skills.repair && p.en >= 8) await playerAction('skill', 'repair');
          else if (p.hp < p.maxHp * 0.35 && kit) await playerAction('item', kit);
          else if (!p.fx.power && p.en >= 32) await playerAction('skill', 'over');
          else if (p.en < 12 && S.inv.supercell) await playerAction('item', 'supercell');
          else if (p.en >= 22) await playerAction('skill', 'star');
          else await playerAction('attack');
        }
        if (B.over.result === 'won') wins++; if (B.phase === 2) p2++;
        B = null;
      }
      return `${kind}: won ${wins}/${n}, reached phase 2 ${p2}/${n}`;
    };
    return [await run('eye', 20), await run('titan', 20)];
  });
  console.log(out.join('\n'));
  await b.close(); server.close();
})();
