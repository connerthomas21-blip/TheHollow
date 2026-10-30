'use strict';
/* ============================== STORY: cast and cutscene scripts ============================== */

// Order of Sweepers armour: silver plate, teal trim.
const SWEEPER_ARMOR = { base: '#d4dbe6', trim: '#2ab8b0', pauldron: 'layered', cape: '#1e6a6a', rivet: '#e8c25a', sigil: '#2ab8b0', motif: 'filigree', tabard: '#1e6a6a', under: '#1c2a30' };
const KOL_ARMOR = { base: '#8a6a3a', trim: '#e8c25a', pauldron: 'layered', cape: '#7a1a24', rivet: '#e8c25a', sigil: '#e8c25a', motif: 'filigree', tabard: '#7a1a24', under: '#2a1c14' };
const KOL_DARK_ARMOR = { style: 'void', base: '#3a2e2a', trim: '#c46aff', glow: '#c46aff', seams: true, pauldron: 'float', cape: '#2a0a24', spike: '#5a4a44', blade: '#2a2236', tabard: '#2a0a24', under: '#160c14' };
const KOL_LOOK = { build: 'm', gear: 'none', skin: 1, hair: 'short', hairCol: 4, eyes: 1, beard: 'full', mark: 'scar' };
const LYRA_LOOK = { build: 'f', gear: 'none', skin: 2, hair: 'tail', hairCol: 2, eyes: 2, beard: 'none', mark: 'none' };
const GM_LOOK = { build: 'm', gear: 'circlet', skin: 3, hair: 'long', hairCol: 4, eyes: 1, beard: 'full', mark: 'none' };

// Who can appear in a cutscene. Knights are drawn with drawKnight; anything with `enemy` uses the enemy art.
const CAST = {
  hero:       () => ({ ...menuHero() }),
  heroSweeper:() => ({ ...menuHero(), armor: armorStyle(SWEEPER_ARMOR), weapon: 'w_ion', acc: null }),
  heroExile:  () => ({ ...menuHero(), armor: armorStyle(ARMOR_LOOK.a_vest), weapon: 'w_rust', acc: null }),
  kol:        () => ({ armor: armorStyle(KOL_ARMOR), look: KOL_LOOK, weapon: 'sword' }),
  kolHood:    () => ({ armor: armorStyle({ ...KOL_ARMOR, cape: '#1a1420' }), look: { ...KOL_LOOK, gear: 'hood' }, weapon: 'sword' }),
  kolDark:    () => ({ armor: armorStyle(KOL_DARK_ARMOR), look: { ...KOL_LOOK, eyes: '#c46aff' }, weapon: 'sword' }),
  lyra:       () => ({ armor: armorStyle({ ...SWEEPER_ARMOR, pauldron: 'plate' }), look: LYRA_LOOK, weapon: 'w_lance' }),
  lyraHood:   () => ({ armor: armorStyle({ ...SWEEPER_ARMOR, pauldron: 'plate', cape: '#2a2a34' }), look: { ...LYRA_LOOK, gear: 'hood' }, weapon: 'w_lance' }),
  gm:         () => ({ armor: armorStyle({ base: '#e6e0d0', trim: '#c9a24a', cloth: true, pauldron: 'layered', cape: '#8a1a24', rivet: '#e8c25a' }), look: GM_LOOK, weapon: 'staff' }),
  knight:     () => ({ armor: armorStyle(SWEEPER_ARMOR), look: { gear: 'visor', eyes: 0 }, weapon: 'sword' }),
  vex:        () => ({ enemy: PLANETS[2].boss }),
  warden:     () => ({ enemy: PLANETS[0].boss }),
  queen:      () => ({ enemy: PLANETS[1].boss }),
  skarn:      () => ({ enemy: PLANETS[3].boss }),
  titan:      () => ({ enemy: PLANETS[4].boss }),
  titanBroken:() => ({ enemy: { ...PLANETS[4].boss, p2: true } }),
  shadow:     () => ({ enemy: PLANETS[4].boss, silhouette: '#07040e' }),
  scout:      () => ({ enemy: PLANETS[1].foes[0] }),
  spitter:    () => ({ enemy: PLANETS[1].foes[1] }),
  trooper:    () => ({ enemy: PLANETS[0].foes[2] }),
  singularity:() => ({ enemy: { name: 'The Singularity', kind: 'singularity', col: ['#120820', '#ff9a4a'] } }),
  // the traders, one per world
  maro:       () => ({ armor: armorStyle({ style: 'cloth', base: '#6a5038', trim: '#3a2a1e', pauldron: 'pad', cloth: true, scarf: '#5a3a2a', motif: 'stitch' }), look: { build: 'm', gear: 'none', skin: 1, hair: 'shaved', hairCol: 4, eyes: 1, beard: 'full', mark: 'patch' }, weapon: 'staff' }),
  sesk:       () => ({ armor: armorStyle({ style: 'cloth', base: '#b08a5a', trim: '#5a3a22', pauldron: 'pad', cloth: true, scarf: '#9a3a2a', motif: 'stitch' }), look: { build: 'f', gear: 'mask', skin: 3, hair: 'braids', hairCol: 0, eyes: 2, beard: 'none', mark: 'paint' }, weapon: 'gun' }),
  ilo:        () => ({ armor: armorStyle({ style: 'munition', base: '#3a4a6a', trim: '#e8c25a', pauldron: 'round', motif: 'rivet', under: '#1c2230' }), look: { build: 'f', gear: 'none', skin: 0, hair: 'short', hairCol: 0, eyes: 0, beard: 'none', mark: 'none' }, weapon: 'gun' }),
  bram:       () => ({ armor: armorStyle({ ...ARMOR_LOOK.a_magma, base: '#4a3a32' }), look: { build: 'm', gear: 'none', skin: 2, hair: 'topknot', hairCol: 5, eyes: 1, beard: 'full', mark: 'paint' }, weapon: 'axe' }),
  keeper:     () => ({ armor: armorStyle({ style: 'cloth', base: '#3a4446', trim: '#1e2a2c', pauldron: 'pad', cloth: true, scarf: '#2a4a48', motif: 'stitch' }), look: { build: 'm', gear: 'hood', skin: 5, hair: 'long', hairCol: 4, eyes: '#7affe8', beard: 'none', mark: 'none' }, weapon: 'staff', acc: 't_lantern' }),
  lost:       () => ({ armor: armorStyle(LOST_SWEEPER.armor), look: LOST_SWEEPER.look, weapon: 'w_star' }),
};
const POSES = {
  stand: {}, kneel: { crouch: 1, lean: 0.18, arm: 0.7 }, raise: { arm: -2.4 }, guard: { crouch: 0.45, arm: -0.5, lean: -0.1 },
  bow: { lean: 0.32, crouch: 0.2, arm: 0.4 }, point: { arm: -1.3 }, slump: { crouch: 0.8, lean: 0.4, arm: 0.9 }, ready: { crouch: 0.3, arm: -0.9, lean: 0.06 },
};

// Beats: bg (scene index), title (big caption), cast (merge actors; null removes), move (walk to x), pose, say [speaker, text],
// fx ('flash' | 'shake'), choice [[label, value]...] with key, and if (skip the beat when it returns false).
const L_FORGAVE = () => storyState().lyra === 'forgive', L_COLD = () => storyState().lyra === 'cold';
const V_SPARE = () => storyState().vex === 'spare', V_EXEC = () => storyState().vex === 'execute';
const K_MERCY = () => storyState().kol === 'mercy', K_JUSTICE = () => storyState().kol === 'justice';
const F_RIM = () => storyState().final === 'rim', F_ORDER = () => storyState().final === 'order';
const CUTSCENES = {
  prologue: { title: 'Prologue: The Fall of Veyra', beats: [
    { bg: SCENE_HALL, title: 'Three years ago', cast: { kol: { who: 'kol', x: 470, flip: true }, hero: { who: 'heroSweeper', x: 250 }, k1: { who: 'knight', x: 640, flip: true, scale: 1.2 }, k2: { who: 'knight', x: 80, scale: 1.2 } },
      say: [null, 'The Citadel of the Rim, home of the Order of Sweepers. For a thousand years its knights have swept the edge of the stars clean of Hollow-spawn.'] },
    { say: ['Master Kol', '{name}. Youngest squire I ever took in. Now the finest blade in the Order.'] },
    { pose: { hero: 'bow' }, say: ['{name}', 'Everything I am, I learned from you, Master.'] },
    { pose: { hero: 'stand', kol: 'point' }, say: ['Master Kol', 'Then learn this. A distress call came from the Krytos relay. Go alone. Tell no one. Some burdens are safer in one heart.'] },
    { cast: { lyra: { who: 'lyra', x: 760, flip: true } }, move: { lyra: { x: 580, ms: 1100 } }, pose: { kol: 'stand' }, say: ['Lyra', 'Master, the Veyra watch tonight. {name} is the only Sweeper on the roster—'] },
    { say: ['Master Kol', 'Is handled, Lyra.'] },
    { move: { hero: { x: -90, ms: 1600 } }, say: ['Master Kol', 'Go, {name}. The stars are waiting.'] },
    { pose: { kol: 'stand' }, say: ['Master Kol', '(once the doors close behind you) Tell the Grand Master it is done.'] },
    { bg: 1, title: 'The Krytos relay', cast: null },
    { cast: { hero: { who: 'heroSweeper', x: -60 } }, move: { hero: { x: 260, ms: 1600 } }, say: [null, 'The Krytos relay hung over the wastes like a dead lantern. No lights. No crew. Only the distress call, looping.'] },
    { say: ['Relay recording', '…requesting Sweeper aid… requesting Sweeper aid… requesting…'] },
    { pose: { hero: 'kneel' }, say: [null, 'The crew quarters were empty. Beds made. Mugs on the table, still full. They had left days ago, in good order, as if someone had told them to.'] },
    { pose: { hero: 'stand' }, say: ['{name}', 'There’s no one to save here. Then why send me?'] },
    { fx: 'shake', cast: { s1: { who: 'scout', x: 820 }, s2: { who: 'spitter', x: 940 } }, move: { s1: { x: 540, ms: 900 }, s2: { x: 650, ms: 1200 } }, pose: { hero: 'ready' }, say: [null, 'Then the walls began to click.'] },
    { fx: 'flash', pose: { hero: 'guard' }, say: [null, 'You fought until dawn. They kept coming, more than any hive should send, as if something were pointing them at you.'] },
    { cg: 'veyra_orbit', cast: { s1: null, s2: null }, pose: { hero: 'stand' }, say: [null, 'Somewhere near the end, through the relay’s broken window, the far horizon turned red.'] },
    { say: ['{name}', 'That’s… Veyra. That’s my watch.'] },
    { cg: null, move: { hero: { x: -100, ms: 1300 } }, say: [null, 'You burned every engine you had getting back. It was not enough. It was never meant to be enough.'] },
    { bg: SCENE_FIRE, title: 'That night', cast: null },
    { cast: { kol: { who: 'kolHood', x: 300 }, shadow: { who: 'shadow', x: 580, scale: 1 } }, say: [null, 'While you chased an empty signal, Veyra burned.'] },
    { fx: 'shake', say: ['A vast voice', 'ONE WORLD, AS WE AGREED. YOUR ORDER IS SPARED. FOR NOW.'] },
    { pose: { kol: 'bow' }, say: ['Hooded figure', 'Then the rest of the Rim lives. That is all that matters.'] },
    { say: ['A vast voice', 'YOU SAY THAT EVERY TIME, LITTLE KNIGHTS. AND EVERY TIME I GROW.'] },
    { cast: { lyra: { who: 'lyraHood', x: 70, pose: 'guard' } }, say: [null, 'Behind a broken wall, someone saw everything, and said nothing.'] },
    { bg: 0, title: 'Dawn', cast: { hero: { who: 'heroSweeper', x: -60 } }, move: { hero: { x: 300, ms: 1500 } }, say: [null, 'You landed in the ash at dawn. Kol’s knights were already waiting, with chains.'] },
    { cast: { k1: { who: 'knight', x: 520, flip: true }, k2: { who: 'knight', x: 620, flip: true } }, pose: { hero: 'kneel' }, say: ['Sweeper knight', 'By order of Master Kol. You abandoned your post.'] },
    { bg: SCENE_HALL, title: 'The tribunal', cast: null },
    { cast: { hero: { who: 'heroSweeper', x: 300, pose: 'kneel' }, kol: { who: 'kol', x: 470, flip: true }, gm: { who: 'gm', x: 620, flip: true }, lyra: { who: 'lyra', x: 110 } },
      say: ['Master Kol', 'The guardian of Veyra abandoned their post while a world burned. I was their master. The shame is mine to cut away.'] },
    { pose: { kol: 'point' }, say: ['Master Kol', 'By the Sweeper Code, I strip {name} of rank, crest and blade.'] },
    { fx: 'flash', cast: { hero: { who: 'heroExile', x: 300, pose: 'kneel' } }, pose: { kol: 'stand' }, say: ['Grand Master', 'So it is spoken. Leave the Citadel, {name}. Do not return.'] },
    { cast: { lyra: { who: 'lyra', x: 110, flip: true } }, say: ['Lyra', '...'] },
    { bg: 0, title: 'Three years later', cast: null },
    { cast: { hero: { who: 'hero', x: -60 } }, move: { hero: { x: 300, ms: 1800 } }, say: [null, 'Three years of drifting. A rusted blade, a borrowed ship, and a name nobody says out loud.'] },
    { say: [null, 'Tonight a beacon woke you. It comes from the ruins of Veyra, and it is broadcasting on a Sweeper channel only the Order knows.'] },
    { pose: { hero: 'ready' }, say: ['{name}', 'Someone wants me here. Fine. Let them see what three years did to me.'] },
  ] },

  w0_in: { title: 'Veyra: Return to the Ashes', beats: [
    { bg: 0, cast: { hero: { who: 'hero', x: -60 } }, move: { hero: { x: 280, ms: 1600 } }, say: ['{name}', 'Veyra. I swore I would never set foot here again.'] },
    { pose: { hero: 'kneel' }, say: [null, 'In the ash you find a Sweeper crest, melted at the edges. It is not yours. Another Sweeper stood here the night it burned.'] },
    { pose: { hero: 'stand' }, say: [null, 'The colony machines have gone feral. Clear five patrols and the old Warden will come for you.'] },
  ] },
  w0_out: { title: 'Veyra: The Warden’s Memory', beats: [
    { bg: 0, cast: { hero: { who: 'hero', x: 250 }, warden: { who: 'warden', x: 520, pose: 'slump' } }, say: ['Warden Mk-II', 'MEMORY RECOVERED. NIGHT OF THE FIRE. ONE SWEEPER SIGNATURE ON SITE. IDENTITY: CORRUPTED.'] },
    { say: ['{name}', 'One of us was here. And someone wiped the record.'] },
    { say: [null, 'The beacon’s source points to the Krytos Wastes, where the Skrell have started marching in formation. Swarms don’t do that on their own.'] },
  ] },
  w1_in: { title: 'Krytos: The Stranger', beats: [
    { bg: 1, cast: { hero: { who: 'hero', x: 240 } }, say: [null, 'Heat shimmer and the clicking of a million legs. The Skrell hives stretch to the horizon.'] },
    { cast: { lyra: { who: 'lyraHood', x: 760, flip: true } }, move: { lyra: { x: 520, ms: 1200 } }, say: ['Hooded stranger', 'The Skrell don’t march in lines, Sweeper. Someone holds their leash.'] },
    { pose: { hero: 'ready' }, say: ['{name}', 'Who are you?'] },
    { say: ['Hooded stranger', 'Someone who owes you. Kill the Brood Queen. You’ll see whose hand is on the leash.'] },
    { move: { lyra: { x: 780, ms: 900 } }, pose: { hero: 'stand' }, say: [null, 'By the time you reach the ridge, the stranger is gone.'] },
  ] },
  w1_out: { title: 'Krytos: The Throne Crest', beats: [
    { bg: 1, cast: { hero: { who: 'hero', x: 240 }, queen: { who: 'queen', x: 520, pose: 'slump' } }, say: [null, 'The Brood Queen falls, and the hive goes quiet.'] },
    { say: [null, 'Carved into her throne is a crest you know: Admiral Vex, fleet commander of the Order of Sweepers.'] },
    { say: ['{name}', 'The Order’s own admiral, feeding worlds to the Skrell. Why?'] },
  ] },
  w2_in: { title: 'Nebulon: The Admiral', beats: [
    { bg: 2, cast: { hero: { who: 'hero', x: -60 } }, move: { hero: { x: 260, ms: 1500 } }, say: [null, 'Nebulon Station, the Order’s great dockyard. Its guns point at its own knights now.'] },
    { cast: { vex: { who: 'vex', x: 540, scale: 1.2 } }, say: ['Admiral Vex', 'The exile. Kol said you might crawl back. Turn around, {name}, while you still can.'] },
    { pose: { hero: 'ready' }, say: ['{name}', 'Kol? What does my master have to do with you?'] },
    { say: ['Admiral Vex', 'Everything. Now leave my station.'] },
  ] },
  w2_out: { title: 'Nebulon: The Confession', beats: [
    { bg: 2, cast: { hero: { who: 'hero', x: 240 }, vex: { who: 'vex', x: 500, scale: 1.2, pose: 'kneel' } }, say: ['Admiral Vex', 'I only followed the Master’s orders. Kol made the pact. Veyra was the price. The Order was the prize.'] },
    { pose: { hero: 'ready' }, say: ['{name}', 'You’re lying. Kol raised me.'] },
    { cast: { lyra: { who: 'lyraHood', x: 780, flip: true } }, move: { lyra: { x: 620, ms: 1000 } }, say: ['Hooded stranger', 'He isn’t lying, {name}.'] },
    { fx: 'flash', cast: { lyra: { who: 'lyra', x: 620, flip: true } }, pose: { hero: 'stand' }, say: ['{name}', 'Lyra.'] },
    { say: ['Lyra', 'I saw him that night. Kol, standing in the fire, talking to something so big it blotted out the sky.'] },
    { say: ['Lyra', 'I said nothing at the tribunal. I was afraid. I let them break you, and I’ve spent three years trying to find the nerve to tell you.'] },
    { choice: [['Forgive her', 'forgive'], ['Turn away', 'cold']], key: 'lyra', say: [null, 'Lyra waits for your answer.'] },
    { if: L_FORGAVE, say: ['{name}', 'You’re here now. That counts for more than you think.'] },
    { if: L_FORGAVE, say: ['Lyra', 'Then I’ll stand with you, all the way to the end.'] },
    { if: L_COLD, pose: { hero: 'stand' }, cast: { hero: { who: 'hero', x: 240, flip: true } }, say: ['{name}', 'Three years, Lyra.'] },
    { if: L_COLD, say: ['Lyra', 'I know. I don’t expect forgiveness. I’ll earn it anyway.'] },
    { if: L_FORGAVE, say: [null, 'Lyra now fights at your side.'] },
    { cast: { hero: { who: 'hero', x: 240 } }, say: ['Lyra', 'And Vex? He sold the Skrell their marching orders. He’s yours to judge, {name}.'] },
    { choice: [['Spare him', 'spare'], ['Execute him', 'execute']], key: 'vex', say: ['Admiral Vex', 'Do it, then. Or don’t. I stopped caring which a long time ago.'] },
    { if: V_SPARE, say: ['{name}', 'The Order will judge you. Not me. Get up.'] },
    { if: V_SPARE, pose: { vex: 'stand' }, say: ['Admiral Vex', '… What’s left of my fleet is loyal to me, not to Kol. When you face the dark, look up. We’ll be there.'] },
    { if: V_EXEC, fx: 'flash', cast: { vex: null }, say: [null, 'One stroke. The Admiral of the Order falls on the deck of his own station.'] },
    { if: V_EXEC, say: [null, 'You take the Admiral’s Seal from his coat. On the far dock, Quartermaster Ilo watches, and turns away.'] },
    { say: ['Lyra', 'Kol’s last order went to the forges of Cinder Moon. Whatever he is building, it’s there.'] },
  ] },
  w3_in: { title: 'Cinder Moon: The Forges', beats: [
    { bg: 3, cast: { hero: { who: 'hero', x: 220 }, lyra: { who: 'lyra', x: 120 } }, say: [null, 'Rivers of magma feed the Order’s ancient forges. The fire spirits bound to the anvils have been set loose and armed.'] },
    { say: ['Lyra', 'Kol is forging an army for something. Pyrelord Skarn guards the deep forge.'] },
  ] },
  w3_out: { title: 'Cinder Moon: The Black Gate', beats: [
    { bg: 3, cast: { hero: { who: 'hero', x: 240 }, lyra: { who: 'lyra', x: 130 }, skarn: { who: 'skarn', x: 540, pose: 'slump' } }, say: [null, 'Skarn’s flames gutter out. Beneath the forge lies a gate of black glass, and through it, no stars at all.'] },
    { say: ['Lyra', 'He went through. He’s waiting for you on the other side.'] },
    { pose: { hero: 'ready' }, say: ['{name}', 'Then let’s not keep him waiting.'] },
  ] },
  w4_in: { title: 'The Hollow Dark', beats: [
    { bg: 4, cast: { hero: { who: 'hero', x: -60 }, lyra: { who: 'lyra', x: -140 } }, move: { hero: { x: 260, ms: 1600 }, lyra: { x: 150, ms: 1700 } }, say: [null, 'No light. No sound. Only the feeling of being looked at by something very large.'] },
    { fx: 'shake', say: ['Master Kol', '(his voice everywhere at once) You always did finish what you started, {name}. Come to the heart. I’ll be waiting.'] },
    { say: ['Lyra', 'Its spawn guard every path. Cut through them, and we reach him.'] },
  ] },
  kol_in: { title: 'The Master', beats: [
    { bg: 4, cast: { hero: { who: 'hero', x: 240 }, kol: { who: 'kolDark', x: 520, flip: true } }, say: ['Master Kol', 'Look at you. Rusted blade and all, you came the whole way.'] },
    { if: L_FORGAVE, cast: { lyra: { who: 'lyra', x: -60 } }, move: { lyra: { x: 130, ms: 900 } }, say: ['Lyra', 'Not alone, Master. Never again.'] },
    { if: L_COLD, say: [null, 'Lyra’s voice crackles over the comm: “I’ll hold the gate. This one’s yours, {name}. Alone, the way he made you.”'] },
    { say: ['{name}', 'Why, Master?'] },
    { say: ['Master Kol', 'Because the Hollow cannot be beaten. Only fed. I chose which worlds would be eaten so the rest could live. I chose Veyra.'] },
    { say: ['Master Kol', 'And I chose you to carry the blame, because you were the only one strong enough to survive it.'] },
    { say: ['Master Kol', 'Everything you know, I taught you. Every move you make, I made first. Show me, and I will show it back.'] },
    { pose: { hero: 'ready', kol: 'ready' }, say: ['{name}', 'Then I’ll survive you too.'] },
  ] },
  kol_down: { title: 'Mercy or Justice', beats: [
    { bg: 4, cast: { hero: { who: 'hero', x: 240 }, kol: { who: 'kolDark', x: 480, flip: true, pose: 'kneel' } }, say: ['Master Kol', 'Finish it, then. You’ve earned that much.'] },
    { if: L_FORGAVE, cast: { lyra: { who: 'lyra', x: 130 } }, say: ['Lyra', '{name}… whatever you choose, I’m with you.'] },
    { cg: 'kol_kneel', choice: [['Show mercy', 'mercy'], ['Deliver justice', 'justice']], key: 'kol', say: [null, 'Your old master kneels in the dark, waiting.'] },
    { if: K_MERCY, say: ['{name}', 'No. You don’t get to make me into you.'] },
    { if: K_MERCY, cg: null, pose: { kol: 'stand' }, say: ['Master Kol', '… Then hear the last thing I owe you. I did not make the pact alone. The Grand Master signed it first. I was only his hand.'] },
    { if: K_MERCY, say: ['Master Kol', 'Whatever is left of me will hold the Hollow’s pull off you, for as long as I last. Go.'] },
    { if: K_MERCY, fx: 'flash', cast: { kol: null }, say: [null, 'Kol walks into the dark with his arms spread wide. Where he stood, the pull of the Hollow eases.'] },
    { if: K_JUSTICE, cg: null, fx: 'flash', cast: { kol: null }, say: [null, 'Your blade falls. Ardent Kol, master of the Order of Sweepers, is gone.'] },
    { if: K_JUSTICE, say: [null, 'His sword, Severance, lies at your feet. Under his breastplate is a letter sealed in white wax: “Veyra is the price. Let it be paid. —A., Grand Master.”'] },
    { say: ['{name}', 'The Grand Master… knew.'] },
    { fx: 'shake', cast: { titan: { who: 'titan', x: 620, scale: 1, alpha: 0.5 } }, say: [null, 'The dark behind you stands up.'] },
    { cast: { titan: { who: 'titan', x: 560, scale: 1 } }, fx: 'flash', say: ['The Hollow Dark', 'LITTLE SWEEPER. YOU TOOK MY SERVANT. NOW I TAKE THE SECTOR.'] },
    { if: L_FORGAVE, pose: { hero: 'ready', lyra: 'guard' }, say: ['Lyra', '{name}! Together, or not at all!'] },
    { if: L_COLD, pose: { hero: 'ready' }, say: ['{name}', 'Come on, then.'] },
  ] },
  ending: { title: 'Epilogue: The Order or the Rim', beats: [
    { bg: 4, cast: { hero: { who: 'hero', x: 240, pose: 'raise' }, sing: { who: 'singularity', x: 540 } }, fx: 'flash', say: [null, 'The singularity’s heart cracks. The Hollow Dark folds in on itself… and does not stop folding.'] },
    { fx: 'shake', say: [null, 'It is smaller now, but it is still a black hole, and the whole sector is still sliding toward its edge. Slower. But sliding.'] },
    { cast: { gm: { who: 'gm', x: 400, flip: true, alpha: 0.7 } }, say: ['Grand Master', '(a hologram, flickering) Well done, Sweeper. Now listen to me very carefully.'] },
    { say: ['Grand Master', 'It can be put back to sleep. One world, fed to it once a generation, keeps it small. The Order has done it quietly for three hundred years. Veyra was simply the turn that came due.'] },
    { pose: { hero: 'point' }, say: ['{name}', 'You knew. Kol, the pact, the tribunal. You let them break me for it.'] },
    { pose: { hero: 'stand' }, say: ['Grand Master', 'I let one world burn so a hundred would live. Keep the secret, and the Order rises higher than ever, with you at its head.'] },
    { if: L_FORGAVE, cast: { lyra: { who: 'lyra', x: 120 } }, say: ['Lyra', 'There’s another way. The Citadel isn’t just a fortress. It’s a ship, and its star engine could collapse the Hollow for good. It would take the Citadel with it.'] },
    { if: L_COLD, say: [null, 'Lyra’s voice crackles over the comm: “The Citadel’s star engine. Fly it into the Hollow and it closes forever. The Citadel goes with it.”'] },
    { say: ['Grand Master', 'And the Order with it! A thousand years of Sweepers, homeless, for the sake of a few dusty worlds.'] },
    { choice: [['Save the Rim', 'rim'], ['Save the Order', 'order']], key: 'final', say: [null, 'The Order, or the Rim. You cannot keep both.'] },
    { if: F_RIM, bg: SCENE_HALL, title: 'The last flight of the Citadel', cast: { sing: null, gm: null, lyra: null, hero: { who: 'hero', x: 360, pose: 'raise' }, k1: { who: 'knight', x: 600, flip: true, scale: 1.2 }, k2: { who: 'knight', x: 110, scale: 1.2 } }, say: [null, 'The Sweepers who heard your call took the Citadel’s bridge. The Grand Master was led away in chains, still shouting about history.'] },
    { if: F_RIM, bg: 4, cg: 'citadel_fall', fx: 'flash', cast: { hero: null, k1: null, k2: null, sing: { who: 'singularity', x: 400, alpha: 0.6 } }, say: [null, 'The Citadel of the Rim, a thousand years old, fell into the dark like a lit match.'] },
    { if: F_RIM, cg: null, fx: 'shake', cast: { sing: null }, say: [null, 'And the dark went out. For the first time in ten thousand years, there was nothing at the edge of the Rim but stars.'] },
    { if: F_RIM, bg: 0, title: 'One year later', cast: { hero: { who: 'hero', x: 360 }, maro: { who: 'maro', x: 520, flip: true } }, say: [null, 'On Veyra, the survivors built a new hall from the Citadel’s salvage. No walls. No secrets. They asked you to lead what was left of the Order.'] },
    { if: () => F_RIM() && L_FORGAVE(), cast: { lyra: { who: 'lyra', x: 220 } }, say: ['Lyra', 'Homeless, broke, and in charge. I’ve never seen you happier.'] },
    { if: F_RIM, say: ['Old Maro', 'Starbreaker. Sounds better than “the one who left”, eh?'] },
    { if: F_ORDER, bg: SCENE_HALL, title: 'The Citadel of the Rim', cast: { sing: null, lyra: null, hero: { who: 'hero', x: 360 }, gm: { who: 'gm', x: 560, flip: true }, k1: { who: 'knight', x: 660, flip: true, scale: 1.2 }, k2: { who: 'knight', x: 70, scale: 1.2 } }, say: ['Grand Master', 'Sweeper {name}. Three years ago this Order cast you out. Today it kneels to you.'] },
    { if: F_ORDER, pose: { gm: 'bow', k1: 'kneel', k2: 'kneel' }, say: ['Grand Master', 'Your crest, your rank, and a new name: Starbreaker, Hand of the Order.'] },
    { if: () => F_ORDER() && L_FORGAVE(), cast: { lyra: { who: 'lyra', x: 200, flip: true } }, say: ['Lyra', 'You kept his secret. I kept one once, too. You know what it cost.'] },
    { if: F_ORDER, say: [null, 'Far away, at the edge of the Rim, the Hollow sleeps. In a generation it will wake hungry, and someone will choose which world it eats. Perhaps you.'] },
    { title: 'Starbreaker', say: [null, 'The Hall of Heroes is open to you. Your journey goes on.'] },
  ] },

  /* ---------- In your absence: what happened to each world during the three years ---------- */
  w0_past: { title: 'Veyra: In Your Absence', beats: [
    { bg: SCENE_FIRE, title: 'In your absence', cast: { maro: { who: 'maro', x: 300, pose: 'kneel' } }, say: [null, 'The morning after the fire, the survivors counted each other. Forty-one, out of four thousand.'] },
    { pose: { maro: 'stand' }, say: ['Old Maro', 'The Order’s ships came at noon. They counted the dead, wrote down one name, and left. Your name.'] },
    { bg: 0, cast: { maro: null, kh: { who: 'kolHood', x: 280 }, warden: { who: 'warden', x: 540 } }, say: [null, 'A month later, a hooded knight in Order colours walked into the Warden’s bay.'] },
    { pose: { kh: 'point' }, say: ['Hooded figure', 'Guard the ruins. Let no one dig. And every night, forget everything you saw.'] },
    { cast: { kh: null, warden: null, t1: { who: 'trooper', x: 800 } }, move: { t1: { x: 460, ms: 1400 } }, say: [null, 'Scavengers came for the ore. The machines went feral. Veyra became a name people used to scare their children.'] },
  ] },
  w1_past: { title: 'Krytos: In Your Absence', beats: [
    { bg: 1, title: 'In your absence', cast: { vex: { who: 'vex', x: 480 } }, say: [null, 'Year one. Order dropships flew low over the hives at night and left beacons humming in the sand.'] },
    { say: ['Admiral Vex', 'Seed every hive. When the signal sounds, they march where we point them.'] },
    { fx: 'shake', cast: { vex: null, q: { who: 'queen', x: 520 } }, say: [null, 'Year two. The Skrell stopped fighting each other. A queen grew fat on the beacons’ song.'] },
    { cast: { sesk: { who: 'sesk', x: 200 } }, say: ['Sesk', 'Year three, they marched. My caravan was the only one that came back. I sold the others’ maps to buy water.'] },
    { say: ['Sesk', 'And that relay you chased? The hive swallowed it. Nobody went looking for the crew. Nobody had to. They were sent home a week before the call.'] },
  ] },
  w2_past: { title: 'Nebulon: In Your Absence', beats: [
    { bg: 2, title: 'In your absence', cast: { vex: { who: 'vex', x: 520, scale: 1.2 }, k1: { who: 'knight', x: 240 } }, say: [null, 'Nebulon was the Order’s pride: a thousand ships, ten thousand crew. Then Admiral Vex came home with new orders.'] },
    { pose: { k1: 'kneel' }, say: ['Admiral Vex', 'Loyalty to the Order means loyalty to me. Those who disagree may disagree from an airlock.'] },
    { cast: { k1: null, vex: null, ilo: { who: 'ilo', x: 300 } }, say: ['Quartermaster Ilo', 'He purged the loyal officers one by one. Half the fleet went out past the Rim on “patrol” and never came back.'] },
    { say: ['Quartermaster Ilo', 'I kept the stores and kept my head down. And I hid twelve Sweepers in containers marked “spoiled rations”. They’re very tired of rations.'] },
  ] },
  w3_past: { title: 'Cinder Moon: In Your Absence', beats: [
    { bg: 3, title: 'In your absence', cast: { kol: { who: 'kolDark', x: 280 }, skarn: { who: 'skarn', x: 540, pose: 'slump' } }, say: [null, 'Kol came down the black stair carrying a fire that did not burn right.'] },
    { fx: 'flash', pose: { kol: 'raise', skarn: 'stand' }, say: ['Master Kol', 'Wake, Pyrelord. The old binding is broken. Your new master is hungrier than the last.'] },
    { cast: { kol: null, skarn: null, bram: { who: 'bram', x: 300, pose: 'slump' } }, say: ['Bram', 'They chained us smiths to the anvils. Fifty forges, day and night, beating out armour for things that don’t have bodies yet.'] },
    { pose: { bram: 'stand' }, say: ['Bram', 'I broke my chain with my own hammer. Took three months, one blow a night. I’ll make you something better than that rust, if you let me.'] },
  ] },
  w4_past: { title: 'The Rise of the Hollow Dark', beats: [
    { bg: 4, title: 'Ten thousand years ago', cast: null, say: [null, 'Before the Rim had a name, a giant star at its edge burned out and fell into itself. What was left could not be seen. It could only be felt, pulling.'] },
    { cast: { sing: { who: 'singularity', x: 400 } }, say: [null, 'It ate its neighbours first: three suns, their worlds, their light. Then it learned to want.'] },
    { cast: { sing: null, keeper: { who: 'keeper', x: 300 } }, say: [null, 'The first Sweeper did not fight it. He walked to its edge with a lantern and bound it with an oath, so it would sleep.'] },
    { say: ['The Lantern Keeper', 'Oaths wear thin. Hunger does not.'] },
    { title: 'Five years ago', cast: { keeper: null, kh: { who: 'kolHood', x: 260 }, shadow: { who: 'shadow', x: 560 } }, say: [null, 'A Sweeper master came to the edge and offered it something it had never been given: a meal, served willingly.'] },
    { fx: 'shake', say: ['A vast voice', 'ONE WORLD. THEN ANOTHER. THEN I WAKE.'] },
    { title: 'Now', fx: 'flash', cast: { kh: null, shadow: null, sing: { who: 'singularity', x: 400, scale: 1.2 } }, say: [null, 'With every world fed to it, the Hollow grew heavier, and heavier things pull harder. It has swallowed the light of the whole outer Rim.'] },
    { say: [null, 'If nothing stops it, the black hole will drag every world in the sector past its edge. Veyra. Krytos. Nebulon. Cinder Moon. The Citadel itself.'] },
    { cast: { sing: null, titan: { who: 'titan', x: 520, alpha: 0.85 } }, fx: 'shake', say: [null, 'And from its heart, something has stood up to walk the Rim on its behalf.'] },
  ] },

  /* ---------- The secret boss ---------- */
  lost_in: { title: 'The Lantern Keeper', beats: [
    { bg: 4, cast: { hero: { who: 'hero', x: 240 }, keeper: { who: 'keeper', x: 520, flip: true } }, say: ['The Lantern Keeper', 'Five echoes swept. You are thorough. He was too.'] },
    { say: ['{name}', 'Who are you?'] },
    { fx: 'flash', cg: 'lost_reveal', cast: { keeper: { who: 'lost', x: 520, flip: true } }, say: ['The Lost Sweeper', 'The first of you. I walked into the dark with a lantern and an oath. The oath held. I did not get to leave.'] },
    { say: ['The Lost Sweeper', 'A thousand years I kept the door. Show me that the one who comes after me can hold it. Show me with your blade.'] },
    { cg: null, pose: { hero: 'ready', keeper: 'ready' }, say: ['{name}', 'Then let’s sweep.'] },
  ] },
  lost_out: { title: 'The Last Light', beats: [
    { bg: 4, cast: { hero: { who: 'hero', x: 240 }, keeper: { who: 'lost', x: 500, flip: true, pose: 'kneel' } }, say: ['The Lost Sweeper', 'Good. Good. The door has a new keeper, and I can finally rest.'] },
    { say: ['The Lost Sweeper', 'Take my light. Keep it lit. Someone always needs to find their way home.'] },
    { fx: 'flash', cast: { keeper: null }, pose: { hero: 'raise' }, say: [null, 'The lantern flame settles in your hand, cool as starlight. You have the Last Light.'] },
  ] },
};
// The speaker's expression for key lines (matched by a snippet of the line). Other lines follow their punctuation.
const LINE_MOODS = [
  ['Youngest squire I ever took in', 'smile'], ['Everything I am, I learned from you', 'smile'], ['Some burdens are safer', 'grim'],
  ['There’s no one to save here', 'grim'], ['That’s… Veyra. That’s my watch.', 'shock'], ['The guardian of Veyra abandoned', 'grim'],
  ['By the Sweeper Code, I strip', 'grim'], ['So it is spoken', 'grim'], ['Someone wants me here', 'grim'],
  ['I swore I would never set foot', 'sad'], ['One of us was here', 'grim'], ['The Order’s own admiral', 'angry'],
  ['I only followed the Master’s orders', 'sad'], ['You’re lying. Kol raised me.', 'angry'], ['I saw him that night', 'sad'],
  ['I said nothing at the tribunal', 'sad'], ['You’re here now. That counts', 'smile'], ['Then I’ll stand with you', 'smile'],
  ['Three years, Lyra.', 'grim'], ['I don’t expect forgiveness. I’ll earn it', 'sad'], ['He’s yours to judge', 'grim'],
  ['I stopped caring which', 'sad'], ['The Order will judge you. Not me.', 'grim'], ['Why, Master?', 'sad'],
  ['Then I’ll survive you too.', 'angry'], ['Not alone, Master. Never again.', 'angry'], ['Finish it, then.', 'sad'],
  ['whatever you choose, I’m with you', 'sad'], ['You don’t get to make me into you', 'angry'], ['hear the last thing I owe you', 'sad'],
  ['The Grand Master… knew.', 'shock'], ['Together, or not at all', 'angry'], ['Well done, Sweeper', 'smile'],
  ['You let them break me for it', 'angry'], ['I let one world burn', 'grim'], ['There’s another way', 'grim'],
  ['And the Order with it!', 'angry'], ['Homeless, broke, and in charge', 'smile'], ['Sounds better than', 'smile'],
  ['Today it kneels to you', 'smile'], ['Your crest, your rank', 'smile'], ['You kept his secret. I kept one once', 'sad'],
  ['The Order’s ships came at noon', 'sad'], ['Forty-one', 'sad'], ['They’re very tired of rations', 'smile'],
  ['I’ll make you something better', 'smile'], ['Oaths wear thin', 'grim'], ['The first of you', 'sad'],
  ['Show me with your blade', 'grim'], ['Then let’s sweep.', 'smile'], ['Good. Good.', 'smile'], ['Keep it lit', 'smile'],
];
function lineMood(who, text) {
  const hit = LINE_MOODS.find(([k]) => text.includes(k));
  if (hit) return hit[1];
  if (/!/.test(text)) return ['kolDark', 'vex', 'gm'].includes(who) ? 'angry' : 'shock';
  if (/^(…|\.\.\.)/.test(text)) return 'sad';
  return null;
}
// Replay list for the Story menu, in order, with the progress that unlocks each scene.
const STORY_ORDER = ['prologue', 'w0_in', 'w0_past', 'w0_out', 'w1_in', 'w1_past', 'w1_out', 'w2_in', 'w2_past', 'w2_out', 'w3_in', 'w3_past', 'w3_out', 'w4_in', 'w4_past', 'kol_in', 'kol_down', 'ending', 'lost_in', 'lost_out'];
function storyUnlocked(id, s) {
  if (!s) return id === 'prologue';
  const cs = s.cs || {}, seen = s.seen || {};
  if (cs[id] || id === 'prologue') return true;
  const m = /^w(\d)_(in|out|past)$/.exec(id);
  if (m) return m[2] === 'out' ? !!(s.bosses || [])[+m[1]] : !!seen[m[1]];
  if (id === 'kol_down') return !!s.kolDown;
  if (id === 'ending') return !!s.done;
  if (id === 'lost_out') return !!s.lostDown;
  return false;
}

/* ============================== TRADERS: one per world, with their own story of the lost years ============================== */
// greet/talk lines may be functions of the story state; a function returning null is skipped.
const KEEPERS = [
  { id: 'maro', name: 'Old Maro', shop: 'Maro’s Salvage',
    greet: s => s.bosses[0] ? 'The Warden’s quiet. First night’s sleep I’ve had in three years. What do you need, hero?' : 'A Sweeper. On Veyra. Ha! Buy something or get out of my light.',
    talk: ['Forty-one of us made it out of the fire. I was the oldest. Still am.',
      'The Order wrote your name in the book of shame. I never believed it. Somebody sent you away that night. Sweepers don’t just leave.',
      'A month after, a hooded knight rewired the Warden. Made it forget every night. Who does that, unless there’s something to forget?',
      s => s.bosses[0] ? 'You pulled the Warden’s memory out. One Sweeper on site that night, it said. Make them answer for it.' : 'The Warden’s still grinding through the ash out there. Clear five patrols and it’ll come for you. It hates tech. Always did.',
      s => s.done ? (s.final === 'rim' ? 'They’re building the new hall right on my old street. I’m charging them rent.' : 'They say the Hollow’s asleep now. They say a lot of things.') : null] },
  { id: 'sesk', name: 'Sesk', shop: 'Sesk’s Caravan',
    greet: s => s.bosses[1] ? 'The hive’s gone quiet. Quiet is good for business.' : 'Water’s extra. Everything’s extra. Welcome to Krytos, Sweeper.',
    talk: ['Year one, the Order’s dropships flew low over the hives at night. Year two, the Skrell stopped fighting each other. Year three, they marched.',
      'The relay station you went to? The hive ate it. But I’ll tell you for free: the crew signed out a week before that distress call. On orders from the Citadel.',
      'The beacons sing at a pitch only the Skrell hear. Somebody built those. Somebody with a fleet.',
      s => s.bosses[1] ? 'Without the Queen, the beacons have nobody to sing to. I sold two of them to a collector. Don’t tell anyone.' : 'The Queen hates fire. Everything out here hates fire. Bring some.'] },
  { id: 'ilo', name: 'Quartermaster Ilo', shop: 'Nebulon Stores',
    closed: s => s.vex === 'execute' ? 'Ilo’s counter is shuttered. A note is taped to it: “He had a daughter on this station. I can’t sell to the one who killed him. The supply kiosk still works.”' : null,
    greet: s => s.bosses[2] ? 'Quartermaster Ilo, back on the books. The stores are open to Sweepers again.' : 'Keep your voice down. Vex’s mercs patrol this deck. What do you need?',
    talk: ['Vex came back from the Citadel with new orders and a new crew. Loyal officers started having “accidents” near the airlocks.',
      'I kept the stores. I kept my head down. And I hid twelve Sweepers in containers marked “spoiled rations”.',
      'Half the fleet went out past the Rim on “patrol”. None came back. I think they were fed to something.',
      s => s.vex === 'spare' ? 'Vex is in the brig. He talks to the fleet every night, and they still listen. Strange, what loyalty survives.' : s.bosses[2] ? null : 'Vex wears paladin plate and a tech shield. Blade or fire, not tech.'] },
  { id: 'bram', name: 'Bram the Smith', shop: 'Bram’s Forge',
    greet: s => s.bosses[3] ? 'The forges are cooling. I can finally hear myself think. Mostly I think about lunch.' : 'Mind the slag. And the sparks. And me. What’ll it be?',
    talk: ['Kol came down the black stair carrying fire that didn’t burn right. Woke Skarn from the old binding with one word.',
      'Fifty forges, day and night, beating out armour for things that don’t have bodies yet.',
      'I broke my chain with my own hammer. Took three months, one blow a night.',
      s => s.bosses[3] ? 'There’s a rift under the first forge now. Something in there is swinging a hammer I’d sell my beard for.' : 'Skarn sits in the deep forge. Fire just feeds him. Hit him with tech.'] },
  { id: 'keeper', name: 'The Lantern Keeper', shop: 'The Last Lantern',
    greet: s => s.lostDown ? 'The lantern burns on, in better hands.' : s.done ? 'The door is shut, for now. My lantern can rest a while.' : 'You have come to the edge. Most turn back here. Buy what you need. It is a long way down.',
    talk: ['The Hollow was a star, once. It burned out and fell into itself, and what was left was hungry.',
      'The first Sweeper did not sweep the dark away. He walked into it, and held the door shut from the inside.',
      'Every world it eats makes it heavier. Heavier things pull harder. Soon it will pull the whole sector past its edge.',
      s => !s.done ? 'Kol waits at the heart. He thinks he is the one feeding it. It thinks otherwise.' : (s.echo || []).every(Boolean) ? 'You have swept every echo. Come with me to the edge, Sweeper. I have waited a long time for you.' : 'Five echoes still walk the Rift, one on every world. Sweep them all, and come back to me.'] },
];
const keeperLine = (v, s) => typeof v === 'function' ? v(s) : v;
const keeperTalk = (k, s) => k.talk.map(v => keeperLine(v, s)).filter(Boolean);
