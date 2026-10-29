# Starbreaker Saga — multi-session build plan

A browser RPG that plays like EyeSpyda's Flash series *Lethal RPG Universe*
(Ben Webb, 2000s): a disgraced space knight travels world to world, fighting
turn-based battles, levelling up, allocating stat points, buying gear and
beating a boss on each world before facing a final dark power.

Names, story and art are original. Only the gameplay style is borrowed.

Files: `index.html` (styles + markup) and `js/` — data, art, story, cutscene, game, ui (loaded in that order, no build step). Published as a claude.ai Artifact.
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

## Session 1.5 — Art pass (done)
- All sprites redrawn as outlined, cel-shaded angular vector art (art kit: `P`, `L`, `limb`, `drawKnight`, `drawEnemy`)
- Hero look follows equipped gear: 6 armour sets, 6 weapons, 6 accessories each have a distinct look
- Character creator at new game (name, headgear, skin, hair, hair colour, eyes, beard, face mark), editable from Status
- Head portrait in the HUD
- `node test/gallery.js <dir>` renders every gear set, head option and enemy for review

## Session 1.6 — Art pass 2 + menus (done)
- Sharp rendering on high-density screens (`hiDpi`)
- Painted battle backdrops per world (`buildScene`, cached layers) with live stars, particles, blinking lights, lava pulse, black-hole swirl
- Combat effects (`drawVfx`): slashes, sparks, plasma bolts, fire bursts, shockwave ring, heal sparkles, hex shield, Starbreaker nova; hit flash and crit shake
- Heads redrawn with more detail; new options: Circlet, Rebreather, Braids, Topknot, Goatee, Moustache, Circuit tattoo, Eye patch
- Appearance screen with arrow cycling for every option, a large head close-up, and an outfit preview; reachable from the main menu any time (edits the saved game, or the look for the next new game if there's no save)
- Main menu button in the HUD (disabled mid-battle); hero shown on each world hub

## Session A — Story, cutscenes, art pass 3 (done)
- Story rewritten: the hero is an exiled Sweeper Knight, framed by Master Ardent Kol, who made a pact with the Hollow Dark. Lyra saw it and kept quiet; the player forgives her or not (`S.lyra`).
- Cutscene engine (`js/cutscene.js`): animated cast, walking, pose blending, typewriter text, title cards, flash/shake, choices, skip, replay from the Story menu. Scripts in `js/story.js`.
- Scenes: prologue (14 beats), world intros/outros, Kol confrontation, the titan's reveal, ending ceremony.
- Kol is a boss before the titan on world 5 (`KOL`, `S.kolDown`). The Hollow Dark is now a crowned titan (`drawTitan`) whose armour breaks open in phase 2.
- Post-game: Hall of Heroes (trophies, record, talk to the Grand Master, Lyra and Squire Tamsin), "Starbreaker" title in the HUD.
- Art: posable knights (arm, lean, crouch/kneel, walk), curvy build option, swing smears, sprite renderer with bold silhouette outline + scene rim light + hit flash + afterimages, hall and burning-Veyra backdrops.
- Attack choreography: wind-up, dash, swing, impact freeze, knockback, crit zoom, recovery; leaping slam, charged casts, ranged muzzle flash and tracers; enemy squash-and-stretch; death dissolve.

## Session A.2 — Flash-anime style (done)
- `js/portrait.js`: anime bust portraits (heavy ink, flat cel shading, glossy eyes, spiky hair) over crimson rune rings, after the look of the old Flash title cards. Specs for Lyra (crossed arms, sweetheart breastplate), Kol, dark Kol, hooded figures, the Grand Master, Vex, and the player (built from their appearance).
- Portraits next to dialogue in cutscenes, in the HUD and the Appearance close-up; title screen key art with Lyra and a metallic logo.
- Interface palette moved to black and crimson.
- `node test/portraits.js <dir>` renders every portrait, the title and a cutscene; `node test/faces.js <dir>` renders face close-ups.
- Faces are a consistent three-quarter view turned to the viewer's right: ear and larger near eye on the left, far eye by the right contour, nose/mouth/chin on a centre line near x = 166.
- Lyra uses a plain fitted breastplate (portrait) and a slim feminine sprite build (Appearance option "Slender"): narrow shoulders, cinched waist, flared armour skirt, thinner limbs, smaller feet, longer neck.

## Session A.3 — Structure pass (done)
- Sprites: bevelled plates everywhere (`plate`), armoured limbs over a padded undersuit (`armLimb`), knee/elbow cops (`cop`), gauntlet knuckles, gorget, breastplate + plackart (broad) or breastplate + laced corset and cloth skirt (slender), belt pouches, hip scabbard for sword users, tabard from the belt (`A.tabard`), cape lining and clasp, segmented sabatons, per-set motifs (`A.motif`: stitch, rivet, ridge, filigree, rune).
- Portraits: bevelled armour (`bevel`), layered pauldrons and plackart, rivets, per-set chest motif, cape clasp, quilted undersuit; hair back volume and shadow clumps; cheekbone, nose bridge, lip, collarbone and eyelid detail; crimson rim light composited from the rune rings.

## Open questions for the user
- "Scale it up": more content, a bigger screen, or deeper systems?

## Session 2 — Companion & quests
- Lyra joins as a party member after Nebulon (two-member party, target selection)
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
