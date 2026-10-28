// Headless playtest: checks for errors, then auto-plays every world with a simple strategy.
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const server = await require('./serve')();
  const b = await chromium.launch(); const pg = await b.newPage({ viewport: { width: 800, height: 900 } });
  const errs = []; pg.on('pageerror', e => errs.push(e.message)); pg.on('console', m => m.type() === 'error' && errs.push(m.text()));
  await pg.goto(server.url);
  await pg.waitForTimeout(500);
  await pg.screenshot({ path: process.argv[2] + '/title.png' });
  await pg.click('[data-a="new"]'); await pg.click('[data-a="create-done"]'); await pg.click('[data-a="cs-skip"]');
  await pg.click('[data-a="world"][data-id="0"]'); await pg.click('[data-a="cs-skip"]');
  await pg.click('[data-a="patrol"]'); await pg.waitForTimeout(700);
  await pg.click('[data-a="attack"]'); await pg.waitForTimeout(1500);
  await pg.screenshot({ path: process.argv[2] + '/battle.png' });
  const report = await pg.evaluate(async () => {
    window.__fast = true;
    const out = [];
    const spend = () => {
      // Stat plan: STR/VIT/DEF heavy with some TEC. Skills: rank up attacks first.
      const order = ['str', 'vit', 'def', 'str', 'tec', 'agi'];
      let i = 0; while (S.pts > 0) { S.base[order[i++ % order.length]]++; S.pts--; }
      for (const id of ['star', 'over', 'slash', 'inferno', 'repair', 'barrier', 'quake', 'bolt']) {
        while (S.sp > 0 && S.lvl >= SKILLS[id].lv && (S.skills[id] || 0) < 5) { S.skills[id] = (S.skills[id] || 0) + 1; S.sp--; }
      }
    };
    const shop = () => {
      const gearByW = Object.entries(GEAR).filter(([, g]) => g.w <= S.world + 1).sort((a, b) => b[1].price - a[1].price);
      for (const [id, g] of gearByW) if (!S.gear.includes(id) && S.cr >= g.price && (!S.equip[g.slot] || GEAR[S.equip[g.slot]].price < g.price)) { S.cr -= g.price; S.gear.push(id); S.equip[g.slot] = id; }
      const kit = S.world >= 1 ? 'megakit' : 'medkit'; if (S.world >= 2) while ((S.inv.supercell || 0) < 2 && S.cr >= 300) { S.cr -= 85; S.inv.supercell = (S.inv.supercell || 0) + 1; }
      while ((S.inv[kit] || 0) < 2 && S.cr >= ITEMS[kit].price + 150) { S.cr -= ITEMS[kit].price; S.inv[kit] = (S.inv[kit] || 0) + 1; }
    };
    const fight = async boss => {
      startBattle(boss);
      let turns = 0;
      while (!B.over && turns < 200) {
        if (B.busy) { await new Promise(r => setTimeout(r, 0)); continue; }
        turns++;
        const p = B.p, kit = ['megakit', 'medkit'].find(k => S.inv[k] > 0);
        const atkSkill = ['star', 'inferno', 'quake', 'slash'].find(id => S.skills[id] && p.en >= SKILLS[id].en);
        if (p.hp < p.maxHp * 0.35 && S.skills.repair && p.en >= 8) await playerAction('skill', 'repair');
        else if (p.hp < p.maxHp * 0.35 && kit) await playerAction('item', kit);
        else if (B.boss && S.skills.over && !p.fx.power && p.en >= 10 + 22) await playerAction('skill', 'over');
        else if (B.boss && S.skills.barrier && !p.fx.shield && p.en >= 7 + 22 && p.hp < p.maxHp * 0.7) await playerAction('skill', 'barrier');
        else if (p.en < 12 && S.inv.supercell) await playerAction('item', 'supercell');
        else if (atkSkill) await playerAction('skill', atkSkill);
        else await playerAction('attack');
      }
      const r = B.over.result; if (boss && r === 'lost') window.__bl = (window.__bl || '') + (B.phase === 2 ? 'P2:' : '') + Math.round(B.e.hp / B.e.maxHp * 100) + '% '; B = null; return [r, turns];
    };
    for (let w = 0; w < 5; w++) {
      S.world = w; let battles = 0, losses = 0;
      while (S.wins[w] < 5 || battles < 4) {
        spend(); shop(); const st = stats(); S.hp = st.maxHp; S.en = st.maxEn; // assume medbay between fights
        const [r] = await fight(false); battles++; if (r === 'lost') losses++; else S.cr -= 5 + S.lvl * 3;
        if (battles > 80) break;
      }
      // grind until boss is beaten (max 6 attempts, extra patrols between)
      let bossTries = 0, bossTurns = 0, res;
      do { spend(); shop(); const st = stats(); S.hp = st.maxHp; S.en = st.maxEn; [res, bossTurns] = await fight(true); bossTries++;
        if (res !== 'won') for (let k = 0; k < 4; k++) { spend(); shop(); const st2 = stats(); S.hp = st2.maxHp; S.en = st2.maxEn; await fight(false); battles++; }
      } while (!S.bosses[w] && bossTries < 12);
      out.push(`${PLANETS[w].name}: patrols=${battles} losses=${losses} bossTries=${bossTries} bossTurns=${bossTurns} -> LV ${S.lvl}, cr ${S.cr}, gear ${Object.values(S.equip).join(',')}`);
    }
    out.push('done=' + S.done + ' boss HP left on losses: ' + window.__bl);
    return out;
  });
  console.log(report.join('\n'));
  await pg.evaluate(() => { window.__fast = false; U.screen = 'hub'; render(); });
  await pg.setViewportSize({ width: 390, height: 844 });
  await pg.screenshot({ path: process.argv[2] + '/hub-phone.png', fullPage: true });
  console.log('errors:', errs.length ? errs : 'none');
  await b.close(); server.close();
})();
