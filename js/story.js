'use strict';
/* ============================== STORY: cast and cutscene scripts ============================== */

// Order of Sweepers armour: silver plate, teal trim.
const SWEEPER_ARMOR = { base: '#d4dbe6', trim: '#2ab8b0', pauldron: 'layered', cape: '#1e6a6a', rivet: '#e8c25a', sigil: '#2ab8b0' };
const KOL_ARMOR = { base: '#8a6a3a', trim: '#e8c25a', pauldron: 'layered', cape: '#7a1a24', rivet: '#e8c25a', sigil: '#e8c25a' };
const KOL_DARK_ARMOR = { base: '#3a2e2a', trim: '#c46aff', glow: '#c46aff', seams: true, pauldron: 'spiky', cape: '#2a0a24', spike: '#5a4a44', blade: '#2a2236' };
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
};
const POSES = {
  stand: {}, kneel: { crouch: 1, lean: 0.18, arm: 0.7 }, raise: { arm: -2.4 }, guard: { crouch: 0.45, arm: -0.5, lean: -0.1 },
  bow: { lean: 0.32, crouch: 0.2, arm: 0.4 }, point: { arm: -1.3 }, slump: { crouch: 0.8, lean: 0.4, arm: 0.9 }, ready: { crouch: 0.3, arm: -0.9, lean: 0.06 },
};

// Beats: bg (scene index), title (big caption), cast (merge actors; null removes), move (walk to x), pose, say [speaker, text],
// fx ('flash' | 'shake'), choice [[label, value]...] with key, and if (skip the beat when it returns false).
const L_FORGAVE = () => storyState().lyra === 'forgive', L_COLD = () => storyState().lyra === 'cold';
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
    { bg: SCENE_FIRE, title: 'That night', cast: null },
    { cast: { kol: { who: 'kolHood', x: 300 }, shadow: { who: 'shadow', x: 580, scale: 1 } }, say: [null, 'While you chased an empty signal, Veyra burned.'] },
    { fx: 'shake', say: ['A vast voice', 'ONE WORLD, AS WE AGREED. YOUR ORDER IS SPARED. FOR NOW.'] },
    { pose: { kol: 'bow' }, say: ['Hooded figure', 'Then the rest of the Rim lives. That is all that matters.'] },
    { cast: { lyra: { who: 'lyraHood', x: 70, pose: 'guard' } }, say: [null, 'Behind a broken wall, someone saw everything, and said nothing.'] },
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
    { cast: { hero: { who: 'hero', x: 240 } }, say: ['Lyra', 'Kol’s last order went to the forges of Cinder Moon. Whatever he is building, it’s there.'] },
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
    { bg: 4, cast: { hero: { who: 'hero', x: 240 }, lyra: { who: 'lyra', x: 130 }, kol: { who: 'kolDark', x: 520, flip: true } }, say: ['Master Kol', 'Look at you. Rusted blade and all, you came the whole way.'] },
    { say: ['{name}', 'Why, Master?'] },
    { say: ['Master Kol', 'Because the Hollow cannot be beaten. Only fed. I chose which worlds would be eaten so the rest could live. I chose Veyra.'] },
    { say: ['Master Kol', 'And I chose you to carry the blame, because you were the only one strong enough to survive it.'] },
    { pose: { hero: 'ready', kol: 'ready' }, say: ['{name}', 'Then I’ll survive you too.'] },
  ] },
  kol_down: { title: 'The King Beneath', beats: [
    { bg: 4, cast: { hero: { who: 'hero', x: 240 }, lyra: { who: 'lyra', x: 130 }, kol: { who: 'kolDark', x: 480, flip: true, pose: 'kneel' } }, say: ['Master Kol', 'It isn’t a mind, {name}. It’s a king. And you’ve just taken away the only one feeding it.'] },
    { fx: 'shake', cast: { titan: { who: 'titan', x: 620, scale: 1, alpha: 0.5 } }, say: [null, 'The dark behind Kol stands up.'] },
    { cast: { kol: null, titan: { who: 'titan', x: 560, scale: 1 } }, fx: 'flash', say: ['The Hollow Dark', 'LITTLE SWEEPER. YOUR MASTER FED ME WORLDS. YOU WILL FEED ME THE REST.'] },
    { pose: { hero: 'ready', lyra: 'guard' }, say: ['Lyra', '{name}! Together, or not at all!'] },
  ] },
  ending: { title: 'Epilogue: Starbreaker', beats: [
    { bg: 4, cast: { hero: { who: 'hero', x: 240, pose: 'raise' }, titan: { who: 'titanBroken', x: 560, pose: 'slump' } }, fx: 'flash', say: [null, 'The Hollow Dark folds in on itself like a dying star. For the first time in a generation, light pours back into the Rim.'] },
    { bg: SCENE_HALL, title: 'The Citadel of the Rim', cast: null },
    { cast: { hero: { who: 'hero', x: 360 }, gm: { who: 'gm', x: 560, flip: true }, lyra: { who: 'lyra', x: 200 }, k1: { who: 'knight', x: 660, flip: true, scale: 1.2 }, k2: { who: 'knight', x: 70, scale: 1.2 } },
      say: ['Grand Master', 'Sweeper {name}. Three years ago this Order cast you out on the word of a traitor. We were wrong, and a world paid for it.'] },
    { pose: { gm: 'bow', k1: 'kneel', k2: 'kneel', lyra: 'kneel' }, say: ['Grand Master', 'Today the Order kneels to you. Your crest, your rank, and a new name: Starbreaker.'] },
    { if: L_FORGAVE, pose: { lyra: 'stand' }, say: ['Lyra', 'I said I’d stand with you to the end. I didn’t think the end would look this bright.'] },
    { if: L_COLD, pose: { lyra: 'stand' }, say: ['Lyra', 'I don’t expect your forgiveness. But I’m proud I fought beside you.'] },
    { pose: { hero: 'raise' }, say: [null, 'The Rim will tell this story for a long time.'] },
    { title: 'Starbreaker', say: [null, 'The Hall of Heroes is open to you. Your journey goes on.'] },
  ] },
};
// Replay list for the Story menu, in order, with the progress that unlocks each scene.
const STORY_ORDER = ['prologue', 'w0_in', 'w0_out', 'w1_in', 'w1_out', 'w2_in', 'w2_out', 'w3_in', 'w3_out', 'w4_in', 'kol_in', 'kol_down', 'ending'];
function storyUnlocked(id, s) {
  if (!s) return id === 'prologue';
  const cs = s.cs || {}, seen = s.seen || {};
  if (cs[id] || id === 'prologue') return true;
  const m = /^w(\d)_(in|out)$/.exec(id);
  if (m) return m[2] === 'in' ? !!seen[m[1]] : !!(s.bosses || [])[+m[1]];
  if (id === 'kol_down') return !!s.kolDown;
  if (id === 'ending') return !!s.done;
  return false;
}
