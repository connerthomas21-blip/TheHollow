# Starbreaker Saga — multi-session build plan

A browser RPG that plays like EyeSpyda's Flash series *Lethal RPG Universe*
(Ben Webb, 2000s): a disgraced space knight travels world to world, fighting
turn-based battles, levelling up, allocating stat points, buying gear and
beating a boss on each world before facing a final dark power.

Names, story and art are original. Only the gameplay style is borrowed.

Single file: `index.html` (no build step). Published as a claude.ai Artifact.
Save data lives in the browser (localStorage), and there's an export/import save code.

## Core loop (Session 1, done)
- Galaxy map with 5 worlds, unlocked in order
- World hub: Patrol (random battle), Boss (unlocks after 5 patrol wins), Medbay, Shop, Status, Skills
- Turn-based battle: Attack, Skills (cost EN), Items, Defend, Flee
- Effects: burn, poison, stun, shield, power-up, armour break, guard
- Stats STR / DEF / AGI / TEC / VIT, 3 points per level, 1 skill point per level
- 8 skills with 5 ranks each, 18 pieces of gear in 3 slots, 8 consumables
- Procedural canvas sprites and backgrounds, floating damage numbers, hit animations
- Two-phase final boss and an ending
- Autosave and save codes

## Session 2 — Companion & quests
- Ally knight joins after world 2 (two-member party, target selection)
- Multi-enemy encounters (1–3 foes)
- Quest board per world (kill X, collect drops) with rewards
- Enemy drops and materials

## Session 3 — Depth & polish
- Gear upgrading/crafting with materials
- WebAudio sound effects and a music toggle
- Difficulty settings, balance pass from playtest data
- Better sprite animation (idle frames, attack effects per skill)

## Session 4 — Second chapter
- New chapter with 5 more worlds, new skills tier
- New Game+ carrying level and gear
- Achievements and a bestiary

## Notes for the next session
- All tuning numbers are in `PLANETS`, `GEAR`, `ITEMS`, `SKILLS` near the top of the script.
- `window.__fast = true` makes battles run instantly (used by the balance test in `test/`).
- Balance check: `node test/play.js <screenshot-dir>` plays the whole game with a simple bot.
  After Session 1 tuning the bot finishes at about LV 15 and needs 1–5 tries per boss.
