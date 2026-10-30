'use strict';
/* ============================== STILLS: full-screen illustrations for the story's biggest moments ==============================
   A cutscene beat with `cg: 'name'` shows one of these instead of the stage; the camera drifts in slowly.
   Each is drawn in the 720×320 stage space with the same ink, plates and lighting as the rest of the game. */

function stillStars(c, seed, n, t) {
  const r = seeded(seed); c.fillStyle = '#ffffff';
  for (let i = 0; i < n; i++) { const x = r() * W, y = r() * H, s = r() * 1.6 + 0.3, ph = r() * 6; c.globalAlpha = 0.2 + 0.6 * Math.abs(Math.sin(t * 0.001 + ph)); c.fillRect(x, y, s, s); }
  c.globalAlpha = 1;
}
function spaceGrad(c, a, b) { const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, a); g.addColorStop(1, b); c.fillStyle = g; c.fillRect(0, 0, W, H); }

// Veyra burning, seen through the Krytos relay's broken window. You, from behind, too far away.
function stillVeyraOrbit(c, t) {
  spaceGrad(c, '#05030a', '#160610');
  stillStars(c, 11, 160, t);
  nebula(c, 520, 140, 260, 'rgba(255,90,40,0.14)');
  // the planet: night side, then fires scattered across it, then a burning rim of atmosphere
  const cx = 500, cy = 560, R = 400;
  c.save(); c.beginPath(); c.arc(cx, cy, R, 0, Math.PI * 2); c.fillStyle = '#120a10'; c.fill(); c.clip();
  const r = seeded(23);
  for (let i = 0; i < 46; i++) {
    const a = -Math.PI / 2 + (r() - 0.5) * 1.4, d = R * (0.55 + r() * 0.45), x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d, s = 6 + r() * 26;
    const flick = 0.7 + 0.3 * Math.sin(t * 0.006 + i);
    const g = c.createRadialGradient(x, y, 0, x, y, s * 2.2); g.addColorStop(0, `rgba(255,220,140,${0.9 * flick})`); g.addColorStop(0.3, `rgba(255,110,40,${0.6 * flick})`); g.addColorStop(1, 'rgba(120,20,10,0)');
    c.fillStyle = g; c.fillRect(x - s * 2.2, y - s * 2.2, s * 4.4, s * 4.4);
  }
  // smoke drifting off the fires
  for (let i = 0; i < 16; i++) {
    const x = 240 + r() * 500, y = 190 + r() * 100, w = 50 + r() * 80, drift = (t * 0.004 + i * 7) % 30;
    c.save(); c.translate(x + drift, y - drift * 0.3); c.scale(1, 0.35);
    const g = c.createRadialGradient(0, 0, 0, 0, 0, w); g.addColorStop(0, 'rgba(40,18,22,0.55)'); g.addColorStop(1, 'rgba(40,18,22,0)');
    c.fillStyle = g; c.fillRect(-w, -w, w * 2, w * 2); c.restore();
  }
  c.restore(); c.globalAlpha = 1;
  c.save(); glowOn(c, '#ff6a2a', 24); c.strokeStyle = 'rgba(255,140,70,0.9)'; c.lineWidth = 3; c.beginPath(); c.arc(cx, cy, R + 1, Math.PI * 1.12, Math.PI * 1.9); c.stroke(); c.restore();
  light(c, 520, 200, 300, '#ff6a2a', 0.18);
  // the window: a heavy bevelled frame, a cross strut, cracked glass
  const fr = '#1a1418', frL = '#3a2e34', frD = '#07050a';
  plate(c, [0, 0, W, 0, W, 34, 0, 34], fr, frL, frD, 1.4);
  plate(c, [0, H - 30, W, H - 30, W, H, 0, H], fr, frL, frD, 1.4);
  plate(c, [0, 0, 40, 0, 40, H, 0, H], fr, frL, frD, 1.4);
  plate(c, [W - 40, 0, W, 0, W, H, W - 40, H], fr, frL, frD, 1.4);
  plate(c, [352, 34, 368, 34, 368, H - 30, 352, H - 30], fr, frL, frD, 1.2);
  for (const [x, y] of [[48, 42], [344, 42], [376, 42], [W - 48, 42], [48, H - 38], [W - 48, H - 38]]) rivet(c, x, y, '#6a5a60');
  c.save(); c.globalAlpha = 0.7; for (const pts of [[520, 34, 540, 90, 528, 140, 560, 200], [540, 90, 600, 110, 680, 96], [528, 140, 470, 170, 440, 230], [560, 200, 640, 230]]) L(c, pts, 'rgba(255,220,200,0.55)', 1); c.restore();
  // window glare
  c.save(); c.globalAlpha = 0.06; P(c, [420, 34, 470, 34, 380, H - 30, 330, H - 30], '#ffffff', 0); c.restore();
  // you, from behind: a silhouette rimmed by the fire
  renderSprite(c, (g, ax, ay) => drawKnight(g, ax, ay, 3.1, { ...CAST.heroSweeper(), pose: { lean: 0.04, arm: 0.5 } }, t), { x: 190, y: H + 120, w: 300, h: 420, ax: 150, ay: 400, silhouette: '#07050a', rim: '#ff7a3a', outline: 0 });
}

// Your old master kneels in the dark; your blade is at his throat. The black hole hangs behind his head like a halo.
function stillKolKneel(c, t) {
  spaceGrad(c, '#050208', '#12061c');
  stillStars(c, 31, 120, t);
  blackHole(c, 488, 74, 46, t, -0.22);
  light(c, 488, 74, 220, '#c46aff', 0.12);
  c.fillStyle = '#08040e'; c.fillRect(0, 286, W, 40);
  light(c, 470, 290, 220, '#c46aff', 0.25, 0.22);
  renderSprite(c, (g, ax, ay) => drawKnight(g, ax, ay, 2.6, { ...CAST.kolDark(), flip: true, pose: { crouch: 1, lean: 0.3, arm: 0.9 } }, t), { x: 480, y: 318, w: 360, h: 360, ax: 180, ay: 340, rim: '#d49aff' });
  // your blade, held from off-frame bottom left, its tip at his throat
  const hl = (S && heroLook()) || menuHero(), wpn = hl.weapon || 'w_rust', glow = WEAPON_GLOW[wpn] || '#e8eef8', A = hl.armor;
  const hx = 118, hy = 236, tx = 404, ty = 112, ang = Math.atan2(tx - hx, -(ty - hy)), sc = Math.hypot(tx - hx, ty - hy) / (WEAPON_LEN[wpn] || 50);
  renderSprite(c, g => {
    g.save(); g.translate(hx, hy); g.rotate(ang); g.scale(sc, sc); drawWeapon(g, wpn, A, t); g.restore();
    // forearm and gauntlet closing on the grip
    plate(g, [-30, 360, 30, 360, hx + 20, hy + 26, hx - 8, hy + 6], A.dark, A.base, shade(A.dark, -30), 2);
    plate(g, [hx - 22, hy - 4, hx + 12, hy - 16, hx + 26, hy + 12, hx - 6, hy + 26], A.light, shade(A.light, 30), A.dark, 2);
    for (const k of [0, 8, 16]) L(g, [hx - 14 + k, hy - 6 - k * 0.3, hx - 2 + k, hy + 20 - k * 0.3], A.dark, 1.4);
  }, { x: 0, y: 0, w: W, h: H, ax: 0, ay: 0, rim: glow, outline: 2.4 });
  light(c, 300, 150, 140, glow, 0.2);
}

// The Citadel of the Rim, a thousand years old, falls into the dark like a lit match.
function stillCitadelFall(c, t) {
  spaceGrad(c, '#030206', '#0e0612');
  stillStars(c, 47, 180, t);
  const hx = 470, hy = 170, R = 74;
  blackHole(c, hx, hy, R, t, -0.12);
  // the Citadel: a spired fortress on a wedge-shaped hull, stretched as it nears the horizon
  c.save(); c.translate(250, 116); c.rotate(0.32); c.scale(1.25, 0.9);
  // engine trail behind it
  const tg = c.createLinearGradient(-260, 0, -40, 0); tg.addColorStop(0, 'rgba(255,240,200,0)'); tg.addColorStop(1, 'rgba(255,240,200,0.9)');
  c.save(); glowOn(c, '#ffe0a0', 20); P(c, [-260, -6, -40, -14, -40, 14, -260, 6], tg, 0); c.restore();
  const hull = '#2a2430', hl = '#5a5068', hd = '#0e0a14';
  plate(c, [-60, 0, 90, -10, 130, 4, 90, 22, -60, 18], hull, hl, hd, 1.6);
  for (const [x, w, h] of [[-40, 14, 38], [-18, 10, 56], [2, 18, 80], [26, 10, 50], [46, 14, 36], [66, 8, 26]]) {
    plate(c, [x, 0, x + w, 0, x + w, -h, x + w / 2, -h - 14, x, -h], hull, hl, hd, 1.2);
    c.fillStyle = 'rgba(255,220,140,0.85)'; for (let y = -h + 8; y < -4; y += 9) c.fillRect(x + w / 2 - 1.2, y, 2.4, 3.4);
  }
  // the Order's star on the great tower
  P(c, [11, -96, 13, -91, 18, -90, 14, -87, 15, -82, 11, -85, 7, -82, 8, -87, 4, -90, 9, -91], '#e8c25a', 0.8);
  // the prow catching fire as it touches the disk
  c.save(); glowOn(c, '#ffb46a', 18); P(c, [110, -2, 140, 6, 112, 16], '#ffd27a', 0); c.restore();
  c.restore();
  light(c, 380, 150, 200, '#ffb46a', 0.18);
  // debris pulled along with it
  const r = seeded(9);
  for (let i = 0; i < 26; i++) { const k = (t * 0.00008 + r()) % 1, a = r() * 6.28, d = 260 * (1 - k) + R, x = hx + Math.cos(a) * d, y = hy + Math.sin(a) * d * 0.4; c.globalAlpha = 0.3 + 0.6 * k; c.fillStyle = i % 2 ? '#ffb46a' : '#5a5068'; c.fillRect(x, y, 3, 1.4); }
  c.globalAlpha = 1;
}

// The Lantern Keeper's hood falls back: the first Sweeper, a thousand years in the dark.
function stillLostReveal(c, t) {
  runeBg(c, W, H, t, '#2ab8b0');
  c.save(); c.globalAlpha = 0.55; c.fillStyle = '#020608'; c.fillRect(0, 0, W, H); c.restore();
  stillStars(c, 61, 80, t);
  // the lantern, held out to the left
  const ly = 196 + Math.sin(t * 0.002) * 3;
  light(c, 190, ly, 260, '#7affe8', 0.3);
  plate(c, [176, ly - 22, 204, ly - 22, 208, ly + 18, 172, ly + 18], '#3a4a46', '#6a807a', '#141c1a', 1.6);
  L(c, [190, ly - 22, 190, ly - 40, 260, ly - 60], '#2a3432', 2.4);
  c.save(); glowOn(c, '#9affee', 24); P(c, [190, ly - 14, 198, ly, 190, ly + 10, 182, ly], '#e8fff8', 0); c.restore();
  for (let i = 0; i < 18; i++) { const k = (t * 0.0002 + i / 18) % 1, x = 190 + Math.sin(i * 2.3 + k * 4) * 30, y = ly - k * 160; c.globalAlpha = 1 - k; c.fillStyle = '#9affee'; c.fillRect(x, y, 2, 2); }
  c.globalAlpha = 1;
  // the bust, large, on the right
  c.save(); c.translate(380, -40); c.scale(1.05, 1.05);
  drawBust(c, { ...bustSpec('lost'), blink: blinkAt(t, 9), mood: 'sad' }, t);
  c.restore();
  const fade = c.createLinearGradient(0, H - 60, 0, H); fade.addColorStop(0, 'rgba(0,0,0,0)'); fade.addColorStop(1, 'rgba(0,0,0,0.7)');
  c.fillStyle = fade; c.fillRect(0, H - 60, W, 60);
}

const STILLS = { veyra_orbit: stillVeyraOrbit, kol_kneel: stillKolKneel, citadel_fall: stillCitadelFall, lost_reveal: stillLostReveal };
// Draws a still with a slow push-in over its first ten seconds.
function drawStill(c, id, t, age) {
  const k = Math.min(1, age / 10000), z = 1 + 0.05 * EASE.out(k);
  c.save(); c.translate(W / 2, H / 2); c.scale(z, z); c.translate(-W / 2, -H / 2);
  STILLS[id](c, t);
  c.restore();
}
