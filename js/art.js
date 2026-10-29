'use strict';
/* ============================== RENDERING: CANVAS ============================== */

const W = 720, H = 320, GROUND = 262;
const DPR = Math.min(2, window.devicePixelRatio || 1);
function seeded(seed) { let s = seed; return () => (s = (s * 16807) % 2147483647) / 2147483647; }
// Sizes a canvas's backing store for sharp drawing on high-density screens; returns a context in CSS-pixel units.
function hiDpi(cv, w, h) {
  const bw = Math.round(w * DPR), bh = Math.round(h * DPR);
  if (cv.width !== bw || cv.height !== bh) { cv.width = bw; cv.height = bh; }
  const c = cv.getContext('2d'); c.setTransform(DPR, 0, 0, DPR, 0, 0); return c;
}

/* ---------- Battle scenes: a cached back layer (sky), live stars, a cached front layer, then live effects ---------- */
const SCENES = ['colony', 'hive', 'station', 'forge', 'void', 'hall', 'fire'];
const SCENE_HALL = 5, SCENE_FIRE = 6;
// Light colour each scene casts on the edges of sprites.
const SCENE_RIM = ['#ffb48a', '#ffe2a8', '#9ad8ff', '#ff8a4a', '#d49aff', '#fff0c8', '#ff9a4a'];
const bgCache = {};
function layer() { const cv = document.createElement('canvas'); const c = hiDpi(cv, W, H); c.lineJoin = 'round'; return [cv, c]; }
function skyGrad(c, stops) { const g = c.createLinearGradient(0, 0, 0, GROUND); stops.forEach((s, i) => g.addColorStop(i / (stops.length - 1), s)); c.fillStyle = g; c.fillRect(0, 0, W, H); }
function nebula(c, x, y, r, col) { const g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, col); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2); }
function haze(c, y0, y1, col) { const g = c.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, col); c.fillStyle = g; c.fillRect(0, y0, W, y1 - y0); }
// Jagged mountain line from a random walk; optional rim light along the crest.
function ridge(c, r, base, amp, step, fill, rim) {
  const pts = []; let n = r();
  for (let x = -step; x <= W + step; x += step) { n = clamp(n + (r() - 0.5) * 0.75, 0, 1); pts.push(x + (r() - 0.5) * step * 0.4, base - amp * n); }
  c.beginPath(); c.moveTo(-step, H); for (let i = 0; i < pts.length; i += 2) c.lineTo(pts[i], pts[i + 1]); c.lineTo(W + step, H); c.closePath();
  c.fillStyle = fill; c.fill();
  if (rim) { c.beginPath(); c.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) c.lineTo(pts[i], pts[i + 1]); c.strokeStyle = rim; c.lineWidth = 1.2; c.stroke(); }
}
function body(c, x, y, r, lit, dark, glow) {
  if (glow) nebula(c, x, y, r * 2.2, glow);
  const g = c.createRadialGradient(x - r * 0.4, y - r * 0.4, r * 0.1, x, y, r); g.addColorStop(0, lit); g.addColorStop(1, dark);
  c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill();
}
function groundBand(c, top, bottom) {
  const g = c.createLinearGradient(0, GROUND, 0, H); g.addColorStop(0, top); g.addColorStop(1, bottom);
  c.fillStyle = g; c.fillRect(0, GROUND, W, H - GROUND);
  c.fillStyle = 'rgba(255,255,255,0.06)'; c.fillRect(0, GROUND, W, 1.5);
}
function rocks(c, r, n, col, lit, ymin = GROUND + 6) {
  for (let i = 0; i < n; i++) {
    const x = r() * W, y = ymin + r() * (H - ymin), s = 3 + r() * 9 * ((y - GROUND) / (H - GROUND) + 0.4);
    P(c, [x - s, y, x - s * 0.6, y - s * 0.7, x + s * 0.3, y - s * 0.9, x + s, y - s * 0.2, x + s * 0.8, y], col, 0);
    P(c, [x - s * 0.6, y - s * 0.7, x + s * 0.3, y - s * 0.9, x + s * 0.2, y - s * 0.4], lit, 0);
  }
}

function buildScene(i) {
  const kind = SCENES[i], r = seeded(i * 131 + 7);
  const [bcv, b] = layer(), [fcv, f] = layer();
  if (kind === 'colony') {
    skyGrad(b, ['#140a20', '#3e1d34', '#9a4a3a', '#d27a4a']);
    nebula(b, 160, 70, 190, 'rgba(255,140,100,0.12)');
    body(f, 590, 76, 38, '#f2dcc8', '#8a6a6a', 'rgba(255,220,190,0.12)');
    f.fillStyle = 'rgba(120,80,80,0.35)'; for (const [cx, cy, cr] of [[578, 66, 7], [600, 90, 5], [606, 64, 4], [584, 94, 3]]) { f.beginPath(); f.arc(cx, cy, cr, 0, Math.PI * 2); f.fill(); }
    f.fillStyle = 'rgba(20,10,20,0.45)'; f.beginPath(); f.arc(604, 84, 38, 0, Math.PI * 2); f.arc(590, 76, 38, 0, Math.PI * 2, true); f.fill('evenodd');
    ridge(f, r, GROUND - 58, 52, 20, '#5a2834', 'rgba(255,190,150,0.35)');
    haze(f, GROUND - 110, GROUND - 20, 'rgba(210,122,74,0.35)');
    const bc = '#2c1520', bl = '#3e2028';
    for (const [x, w, h, broken] of [[30, 48, 72, 1], [86, 26, 112, 0], [290, 64, 56, 1], [366, 22, 92, 1], [628, 54, 80, 0]]) {
      const y = GROUND - 22;
      const top = broken ? [x + w, y - h + 14, x + w * 0.7, y - h, x + w * 0.45, y - h + 10, x + w * 0.2, y - h - 4, x, y - h + 6] : [x + w, y - h, x, y - h];
      P(f, [x, y, x + w, y, ...top], bc, 0);
      P(f, [x + w * 0.75, y, x + w, y, ...top.slice(0, 2), x + w * 0.75, y - h + 12], bl, 0);
      for (let wy = y - h + 18; wy < y - 8; wy += 12) for (let wx = x + 5; wx < x + w - 6; wx += 9) if (r() < 0.3) { f.fillStyle = r() < 0.5 ? 'rgba(255,170,90,0.75)' : 'rgba(255,170,90,0.25)'; f.fillRect(wx, wy, 4, 5); }
    }
    L(f, [99, GROUND - 134, 99, GROUND - 176], bc, 2); L(f, [92, GROUND - 160, 106, GROUND - 160], bc, 1.5); L(f, [94, GROUND - 168, 104, GROUND - 168], bc, 1.2);
    f.strokeStyle = bc; f.lineWidth = 2.4; f.beginPath(); f.arc(500, GROUND - 22, 48, Math.PI, Math.PI * 1.62); f.stroke();
    f.beginPath(); f.arc(500, GROUND - 22, 48, Math.PI * 1.82, Math.PI * 2); f.stroke();
    for (const a of [1.1, 1.3, 1.5]) L(f, [500, GROUND - 22, 500 + Math.cos(Math.PI * a) * 48, GROUND - 22 + Math.sin(Math.PI * a) * 48], 'rgba(44,21,32,0.7)', 1.2);
    ridge(f, r, GROUND - 6, 26, 28, '#2a141c');
    groundBand(f, '#3a2024', '#170b0f');
    for (let k = 0; k < 10; k++) { const x = r() * W, y = GROUND + 8 + r() * 40; L(f, [x, y, x + 10 + r() * 14, y + r() * 4 - 2, x + 20 + r() * 20, y + r() * 6], 'rgba(0,0,0,0.35)', 1); }
    rocks(f, r, 14, '#2a161a', '#4a2a2a');
  } else if (kind === 'hive') {
    skyGrad(b, ['#1c1008', '#5e2c14', '#c26a2c', '#f2b46a']);
    nebula(b, 520, 120, 160, 'rgba(255,200,120,0.25)');
    body(f, 520, 118, 30, '#fff8e0', '#ffc860', 'rgba(255,190,80,0.35)');
    body(f, 604, 68, 12, '#fff0d0', '#ffb050', 'rgba(255,190,80,0.25)');
    f.fillStyle = '#b8682e';
    f.beginPath(); f.moveTo(0, GROUND - 40); for (let x = 0; x <= W; x += 60) f.quadraticCurveTo(x + 30, GROUND - 70 - r() * 30, x + 60, GROUND - 42 - r() * 10); f.lineTo(W, H); f.lineTo(0, H); f.fill();
    haze(f, GROUND - 100, GROUND - 30, 'rgba(242,180,106,0.4)');
    for (const [x, h, w] of [[70, 150, 34], [126, 104, 24], [596, 172, 40], [660, 118, 26], [300, 70, 18]]) {
      const y = GROUND - 30, sp = '#5a2e16';
      P(f, [x - w / 2, y, x - w * 0.3, y - h * 0.4, x - w * 0.42, y - h * 0.6, x - w * 0.12, y - h, x + w * 0.1, y - h * 0.95, x + w * 0.36, y - h * 0.55, x + w * 0.26, y - h * 0.35, x + w / 2, y], sp, 0);
      P(f, [x + w * 0.1, y - h * 0.95, x + w * 0.36, y - h * 0.55, x + w * 0.26, y - h * 0.35, x + w / 2, y, x + w * 0.2, y], '#7a4220', 0);
      f.fillStyle = '#2a1408'; for (let k = 0; k < 3; k++) { const hy = y - h * (0.25 + k * 0.22); f.beginPath(); f.ellipse(x - w * 0.05, hy, w * 0.1, w * 0.16, 0, 0, Math.PI * 2); f.fill(); }
    }
    f.fillStyle = '#8a4c22';
    f.beginPath(); f.moveTo(0, GROUND - 4); for (let x = 0; x <= W; x += 90) f.quadraticCurveTo(x + 45, GROUND - 24 - r() * 14, x + 90, GROUND - 6); f.lineTo(W, H); f.lineTo(0, H); f.fill();
    groundBand(f, '#94582a', '#3e2210');
    for (let k = 0; k < 9; k++) { const y = GROUND + 8 + k * 6.5, o = r() * 40; f.beginPath(); f.moveTo(0, y); for (let x = 0; x <= W; x += 40) f.quadraticCurveTo(x + 20, y - 3, x + 40, y); f.strokeStyle = `rgba(255,220,160,${0.18 - k * 0.015})`; f.lineWidth = 1; f.stroke(); }
    rocks(f, r, 6, '#5a3216', '#8a5428');
  } else if (kind === 'station') {
    skyGrad(b, ['#03041a', '#0e1440', '#22205a', '#2e2a6a']);
    nebula(b, 190, 90, 240, 'rgba(150,70,255,0.22)'); nebula(b, 470, 50, 200, 'rgba(40,200,230,0.16)'); nebula(b, 320, 160, 160, 'rgba(255,90,190,0.10)');
    const gx = 600, gy = 112;
    f.save(); f.translate(gx, gy); f.rotate(-0.25);
    f.strokeStyle = 'rgba(200,190,255,0.35)'; f.lineWidth = 7; f.beginPath(); f.ellipse(0, 0, 120, 22, 0, Math.PI, Math.PI * 2); f.stroke(); f.restore();
    body(f, gx, gy, 66, '#d8c0ff', '#3a2a7a', 'rgba(170,140,255,0.15)');
    f.save(); f.beginPath(); f.arc(gx, gy, 66, 0, Math.PI * 2); f.clip();
    for (let k = -4; k <= 4; k++) { f.fillStyle = k % 2 ? 'rgba(255,255,255,0.08)' : 'rgba(40,20,90,0.22)'; f.save(); f.translate(gx, gy); f.rotate(-0.25); f.fillRect(-80, k * 14, 160, 8); f.restore(); }
    f.fillStyle = 'rgba(10,6,30,0.5)'; f.beginPath(); f.arc(gx + 26, gy + 18, 70, 0, Math.PI * 2); f.fill(); f.restore();
    f.save(); f.translate(gx, gy); f.rotate(-0.25); f.strokeStyle = 'rgba(220,210,255,0.55)'; f.lineWidth = 7; f.beginPath(); f.ellipse(0, 0, 120, 22, 0, 0, Math.PI); f.stroke();
    f.strokeStyle = 'rgba(255,255,255,0.25)'; f.lineWidth = 2; f.beginPath(); f.ellipse(0, 0, 112, 19, 0, 0, Math.PI); f.stroke(); f.restore();
    const sc = '#151a3c', sl = '#232a5a';
    for (const [x, w, h] of [[20, 40, 170], [70, 26, 120], [250, 30, 96], [404, 54, 140], [470, 22, 70]]) {
      const y = GROUND - 30;
      P(f, [x, y, x, y - h, x + w * 0.3, y - h - 12, x + w * 0.7, y - h - 12, x + w, y - h, x + w, y], sc, 0);
      P(f, [x + w * 0.7, y, x + w * 0.7, y - h - 12, x + w, y - h, x + w, y], sl, 0);
      for (let wy = y - h + 6; wy < y - 6; wy += 9) for (let wx = x + 4; wx < x + w - 4; wx += 7) if (r() < 0.45) { f.fillStyle = r() < 0.3 ? 'rgba(120,230,255,0.85)' : 'rgba(120,230,255,0.25)'; f.fillRect(wx, wy, 3, 4); }
    }
    for (let x = 110; x < 250; x += 16) { L(f, [x, GROUND - 92, x + 16, GROUND - 72], sl, 1.2); L(f, [x, GROUND - 72, x + 16, GROUND - 92], sl, 1.2); }
    L(f, [110, GROUND - 92, 250, GROUND - 92], sl, 2); L(f, [110, GROUND - 72, 250, GROUND - 72], sl, 2);
    P(f, [0, GROUND - 30, W, GROUND - 30, W, GROUND, 0, GROUND], '#1b2048', 0);
    groundBand(f, '#2c3260', '#10132e');
    for (let k = -12; k <= 12; k++) L(f, [W / 2 + k * 34, GROUND, W / 2 + k * 70, H], 'rgba(150,170,255,0.12)', 1);
    for (const y of [GROUND + 16, GROUND + 38]) L(f, [0, y, W, y], 'rgba(150,170,255,0.1)', 1);
    f.save(); f.beginPath(); f.rect(0, GROUND, W, 5); f.clip();
    for (let x = -10; x < W; x += 18) P(f, [x, GROUND + 5, x + 9, GROUND + 5, x + 14, GROUND, x + 5, GROUND], '#f2b544', 0);
    f.restore();
  } else if (kind === 'forge') {
    skyGrad(b, ['#0c0204', '#2e0a08', '#7a1e0c', '#c2400e']);
    body(f, 340, GROUND - 30, 118, '#ff9a4a', '#a8200a', 'rgba(255,90,30,0.25)');
    for (const [x, y, rr] of [[130, 80, 70], [220, 50, 60], [600, 40, 80]]) nebula(f, x, y, rr, 'rgba(20,6,6,0.55)');
    ridge(f, r, GROUND - 52, 50, 22, '#3a0e08', 'rgba(255,120,60,0.45)');
    P(f, [430, GROUND - 20, 510, GROUND - 150, 528, GROUND - 156, 552, GROUND - 150, 566, GROUND - 158, 690, GROUND - 20], '#2a0a06', 0);
    P(f, [552, GROUND - 150, 566, GROUND - 158, 690, GROUND - 20, 600, GROUND - 20], '#3e120a', 0);
    nebula(f, 538, GROUND - 160, 46, 'rgba(255,140,40,0.7)');
    f.save(); glowOn(f, '#ff7a2a', 10);
    L(f, [526, GROUND - 150, 512, GROUND - 120, 520, GROUND - 92, 498, GROUND - 60, 506, GROUND - 24], '#ff7a2a', 2.4);
    L(f, [548, GROUND - 148, 566, GROUND - 110, 556, GROUND - 74, 580, GROUND - 26], '#ff9a3a', 2);
    f.restore();
    haze(f, GROUND - 80, GROUND, 'rgba(194,64,14,0.35)');
    ridge(f, r, GROUND - 4, 22, 30, '#1e0806');
    groundBand(f, '#2a0c08', '#0e0303');
    rocks(f, r, 14, '#1a0604', '#3a120a');
  } else if (kind === 'hall') {
    const g0 = b.createLinearGradient(0, 0, 0, H); g0.addColorStop(0, '#0e0b1a'); g0.addColorStop(1, '#2a2238'); b.fillStyle = g0; b.fillRect(0, 0, W, H);
    for (let y = 20; y < GROUND; y += 22) { L(b, [0, y, W, y], 'rgba(255,255,255,0.05)', 1); for (let x = ((y / 22) % 2) * 30; x < W; x += 60) L(b, [x, y, x, y + 22], 'rgba(255,255,255,0.035)', 1); }
    const wx = 360, wy = 30, ww = 62, wh = 168;
    const arch = () => { f.beginPath(); f.moveTo(wx - ww, wy + wh); f.lineTo(wx - ww, wy + 60); f.quadraticCurveTo(wx - ww, wy, wx, wy - 8); f.quadraticCurveTo(wx + ww, wy, wx + ww, wy + 60); f.lineTo(wx + ww, wy + wh); f.closePath(); };
    nebula(f, wx, wy + 80, 170, 'rgba(120,200,255,0.16)');
    arch(); const wg = f.createLinearGradient(0, wy, 0, wy + wh); wg.addColorStop(0, '#1e4488'); wg.addColorStop(1, '#0e1e4a'); f.fillStyle = wg; f.fill();
    f.save(); arch(); f.clip();
    const r2 = seeded(77);
    for (let y = wy - 10; y < wy + wh; y += 16) for (let x = wx - ww; x < wx + ww; x += 16) { f.fillStyle = ['rgba(42,184,176,0.4)', 'rgba(232,194,90,0.32)', 'rgba(90,120,220,0.32)', 'rgba(196,106,255,0.22)'][Math.floor(r2() * 4)]; f.fillRect(x + 1, y + 1, 14, 14); }
    const st = []; for (let i = 0; i < 16; i++) { const rr = i % 2 ? 12 : 34, an = -Math.PI / 2 + i * Math.PI / 8; st.push(wx + Math.cos(an) * rr, wy + 78 + Math.sin(an) * rr); }
    glowOn(f, '#fff0c8', 16); P(f, st, 'rgba(255,240,200,0.9)', 0); glowOff(f);
    for (let x = wx - ww; x <= wx + ww; x += 16) L(f, [x, wy - 12, x, wy + wh], 'rgba(10,8,20,0.8)', 1.6);
    for (let y = wy - 10; y <= wy + wh; y += 16) L(f, [wx - ww, y, wx + ww, y], 'rgba(10,8,20,0.8)', 1.6);
    f.restore();
    arch(); f.strokeStyle = '#4a4060'; f.lineWidth = 6; f.stroke(); f.strokeStyle = INK; f.lineWidth = 1.4; f.stroke();
    f.save(); f.globalCompositeOperation = 'lighter';
    const lg = f.createLinearGradient(0, wy, 0, H); lg.addColorStop(0, 'rgba(160,220,255,0.15)'); lg.addColorStop(1, 'rgba(160,220,255,0)');
    f.fillStyle = lg; f.beginPath(); f.moveTo(wx - ww, wy + 40); f.lineTo(wx + ww, wy + 40); f.lineTo(wx + ww * 2.4, H); f.lineTo(wx - ww * 1.2, H); f.fill(); f.restore();
    for (const px of [56, 204, 516, 664]) {
      const pg = f.createLinearGradient(px - 20, 0, px + 20, 0); pg.addColorStop(0, '#2a2236'); pg.addColorStop(0.45, '#544a6c'); pg.addColorStop(1, '#1e1828');
      P(f, [px - 18, 0, px + 18, 0, px + 18, GROUND, px - 18, GROUND], pg, 1.2);
      for (const dx of [-8, 0, 8]) L(f, [px + dx, 46, px + dx, GROUND - 16], 'rgba(0,0,0,0.25)', 1);
      P(f, [px - 25, GROUND - 14, px + 25, GROUND - 14, px + 25, GROUND, px - 25, GROUND], '#3a3248', 1.2);
      P(f, [px - 25, 30, px + 25, 30, px + 19, 44, px - 19, 44], '#3a3248', 1.2);
      L(f, [px - 24, 31, px + 24, 31], 'rgba(255,240,200,0.25)', 1);
    }
    for (const bx of [130, 590]) {
      P(f, [bx - 22, 50, bx + 22, 50, bx + 22, 170, bx, 188, bx - 22, 170], '#1e6a6a', 1.2);
      P(f, [bx - 22, 50, bx - 8, 50, bx - 8, 175, bx - 22, 170], 'rgba(0,0,0,0.2)', 0);
      P(f, [bx - 24, 46, bx + 24, 46, bx + 24, 56, bx - 24, 56], '#c9a24a', 1);
      const sg = []; for (let i = 0; i < 16; i++) { const rr = i % 2 ? 4 : 11, an = -Math.PI / 2 + i * Math.PI / 8; sg.push(bx + Math.cos(an) * rr, 112 + Math.sin(an) * rr); }
      P(f, sg, '#e8c25a', 0.8);
      L(f, [bx - 22, 168, bx, 185, bx + 22, 168], '#c9a24a', 1.2);
    }
    groundBand(f, '#3a3048', '#120e1a');
    for (let k = -14; k <= 14; k++) L(f, [W / 2 + k * 30, GROUND, W / 2 + k * 64, H], 'rgba(255,240,200,0.07)', 1);
    for (const y of [GROUND + 12, GROUND + 30, GROUND + 52]) L(f, [0, y, W, y], 'rgba(255,240,200,0.06)', 1);
    P(f, [W / 2 - 60, GROUND, W / 2 + 60, GROUND, W / 2 + 112, H, W / 2 - 112, H], '#6a1a24', 0);
    L(f, [W / 2 - 54, GROUND, W / 2 - 101, H], '#c9a24a', 1.2); L(f, [W / 2 + 54, GROUND, W / 2 + 101, H], '#c9a24a', 1.2);
  } else if (kind === 'fire') {
    skyGrad(b, ['#0a0204', '#3a0806', '#8a1e0a', '#e0581a']);
    nebula(b, 360, GROUND - 40, 300, 'rgba(255,120,40,0.25)');
    for (const [x, y, rr] of [[140, 90, 90], [330, 60, 110], [560, 80, 100]]) nebula(f, x, y, rr, 'rgba(14,4,4,0.6)');
    ridge(f, r, GROUND - 58, 52, 20, '#3a1010', 'rgba(255,150,80,0.5)');
    const bc = '#160608';
    for (const [x, w, h] of [[30, 48, 66], [86, 26, 100], [290, 64, 50], [366, 22, 84], [628, 54, 74]]) {
      const y = GROUND - 22;
      P(f, [x, y, x + w, y, x + w, y - h + 14, x + w * 0.7, y - h, x + w * 0.45, y - h + 10, x + w * 0.2, y - h - 4, x, y - h + 6], bc, 0);
      for (let wy2 = y - h + 18; wy2 < y - 8; wy2 += 12) for (let wx2 = x + 5; wx2 < x + w - 6; wx2 += 9) if (r() < 0.4) { f.fillStyle = 'rgba(255,140,40,0.9)'; f.fillRect(wx2, wy2, 4, 5); }
    }
    ridge(f, r, GROUND - 6, 26, 28, '#1a0808');
    groundBand(f, '#2a0c0a', '#0e0303');
    rocks(f, r, 14, '#1a0604', '#3a120a');
  } else {
    skyGrad(b, ['#000000', '#05020c', '#0e0618', '#1a0a2a']);
    nebula(b, 520, 100, 220, 'rgba(160,70,255,0.18)');
    nebula(f, 520, 100, 70, 'rgba(255,120,220,0.25)');
    f.save(); f.translate(520, 100); f.rotate(0.18);
    const dg = f.createLinearGradient(-130, 0, 130, 0); dg.addColorStop(0, 'rgba(160,70,255,0)'); dg.addColorStop(0.3, '#c46aff'); dg.addColorStop(0.5, '#ffd0f4'); dg.addColorStop(0.7, '#ff5aa8'); dg.addColorStop(1, 'rgba(255,90,168,0)');
    f.strokeStyle = dg; f.lineWidth = 10; f.beginPath(); f.ellipse(0, 0, 120, 20, 0, Math.PI, Math.PI * 2); f.stroke();
    f.fillStyle = '#000'; f.beginPath(); f.arc(0, 0, 34, 0, Math.PI * 2); f.fill();
    f.strokeStyle = 'rgba(255,200,240,0.7)'; f.lineWidth = 1.6; f.beginPath(); f.arc(0, 0, 35.5, 0, Math.PI * 2); f.stroke();
    f.strokeStyle = dg; f.lineWidth = 10; f.beginPath(); f.ellipse(0, 0, 120, 20, 0, 0, Math.PI); f.stroke();
    f.restore();
    for (const [x, y, s] of [[60, GROUND - 60, 30], [200, GROUND - 40, 20], [380, GROUND - 50, 26], [650, GROUND - 46, 34]]) {
      P(f, [x - s, GROUND - 20, x - s * 0.5, y, x, y - s * 0.8, x + s * 0.4, y + 4, x + s, GROUND - 20], '#0c0616', 0);
      L(f, [x - s * 0.5, y, x, y - s * 0.8, x + s * 0.4, y + 4], 'rgba(196,106,255,0.45)', 1);
    }
    groundBand(f, '#120a20', '#030106');
    for (let k = 0; k < 14; k++) { const x = r() * W, y = GROUND + 6 + r() * 50; L(f, [x, y, x + 30 + r() * 50, y], 'rgba(196,106,255,0.12)', 1); }
    f.save(); glowOn(f, '#9a4aff', 8);
    for (let k = 0; k < 4; k++) { const x = 60 + r() * 600, y = GROUND + 12 + r() * 40; L(f, [x, y, x + 12, y + 4, x + 20, y + 1, x + 34, y + 6], 'rgba(170,90,255,0.7)', 1.2); }
    f.restore();
  }
  return { back: bcv, front: fcv };
}

const PARTICLES = {
  colony:  { n: 26, col: 'rgba(255,205,170,0.55)', vx: 0.012, vy: 0.002, len: 0 },
  hive:    { n: 40, col: 'rgba(255,225,170,0.45)', vx: -0.09, vy: 0.004, len: 14 },
  station: { n: 22, col: 'rgba(130,230,255,0.6)', vx: 0.003, vy: -0.008, len: 0 },
  forge:   { n: 34, col: '#ffae4a', vx: 0.006, vy: -0.03, len: 0, glow: true },
  void:    { n: 28, col: 'rgba(196,120,255,0.75)', vx: 0, vy: -0.012, len: 0, glow: true },
  hall:    { n: 24, col: 'rgba(255,236,190,0.45)', vx: 0.002, vy: 0.003, len: 0 },
  fire:    { n: 44, col: '#ffb04a', vx: 0.01, vy: -0.04, len: 0, glow: true },
};

function drawBackdrop(c, w, t) {
  const i = typeof w === 'number' ? w : PLANETS.indexOf(w), kind = SCENES[i];
  const sc = bgCache[i] || (bgCache[i] = buildScene(i));
  c.drawImage(sc.back, 0, 0, W, H);
  const r = seeded(i * 97 + 13);
  c.fillStyle = '#ffffff';
  for (let k = 0; k < (kind === 'hall' ? 0 : 90); k++) {
    const x = r() * W, y = r() * GROUND * 0.75, s = r() * 1.5 + 0.4, ph = r() * 6;
    c.globalAlpha = 0.2 + 0.6 * Math.abs(Math.sin(t * 0.0012 + ph));
    c.fillRect(x, y, s, s);
  }
  c.globalAlpha = 1;
  if (kind === 'void') {
    for (const [x, y, s, ph] of [[110, 120, 16, 0], [300, 64, 10, 2], [660, 190, 12, 4]]) {
      const yy = y + Math.sin(t * 0.0012 + ph) * 6;
      P(c, [x - s, yy, x - s * 0.2, yy - s * 1.1, x + s * 0.8, yy - s * 0.3, x + s * 0.3, yy + s * 0.8], '#140a24', 1);
      L(c, [x - s * 0.2, yy - s * 1.1, x + s * 0.8, yy - s * 0.3], 'rgba(210,140,255,0.7)', 1.2);
    }
  }
  c.drawImage(sc.front, 0, 0, W, H);
  if (kind === 'station') for (const [x, y, ph] of [[40, GROUND - 212, 0], [83, GROUND - 162, 1.5], [431, GROUND - 182, 3]]) if (Math.sin(t * 0.004 + ph) > 0.3) { c.save(); glowOn(c, '#ff4a4a', 10); c.fillStyle = '#ff4a4a'; c.fillRect(x - 1.5, y - 1.5, 3, 3); c.restore(); }
  if (kind === 'forge') {
    const pulse = 0.4 + 0.3 * Math.sin(t * 0.003);
    c.save(); c.globalAlpha = pulse; glowOn(c, '#ff6a1a', 12);
    const rr = seeded(55);
    for (let k = 0; k < 5; k++) { const x = rr() * W, y = GROUND + 10 + rr() * 44; L(c, [x, y, x + 14, y + 5, x + 26, y + 2, x + 44, y + 8], '#ff7a2a', 1.6); }
    c.restore();
  }
  if (kind === 'void') {
    c.save(); c.translate(520, 100); c.rotate(0.18); c.globalCompositeOperation = 'lighter';
    const a0 = (t * 0.0006) % (Math.PI * 2);
    c.strokeStyle = 'rgba(255,220,250,0.5)'; c.lineWidth = 3; c.beginPath(); c.ellipse(0, 0, 120, 20, 0, a0, a0 + 0.5); c.stroke();
    c.restore();
  }
  if (kind === 'fire') {
    c.save(); c.globalCompositeOperation = 'lighter';
    for (const [x, y, sz] of [[54, GROUND - 80, 1.3], [100, GROUND - 120, 1], [320, GROUND - 70, 1.4], [377, GROUND - 104, 0.9], [655, GROUND - 92, 1.2], [470, GROUND - 22, 1.6], [200, GROUND - 18, 1.1]]) {
      for (let k = 0; k < 3; k++) {
        const fl = Math.sin(t * 0.012 + x + k * 2) * 4, hh = (30 - k * 7) * sz + fl;
        const g = c.createLinearGradient(0, y, 0, y - hh); g.addColorStop(0, k ? 'rgba(255,220,120,0.6)' : 'rgba(255,90,20,0.75)'); g.addColorStop(1, 'rgba(255,60,0,0)');
        P(c, [x - 10 * sz + k * 3, y, x - 4 * sz + fl * 0.5, y - hh * 0.6, x + fl, y - hh, x + 5 * sz, y - hh * 0.55, x + 10 * sz - k * 3, y], g, 0);
      }
    }
    c.restore();
  }
  const pc = PARTICLES[kind], pr = seeded(i * 11 + 3);
  c.save(); c.fillStyle = pc.col; c.strokeStyle = pc.col; c.lineWidth = 1;
  if (pc.glow) glowOn(c, pc.col, 6);
  for (let k = 0; k < pc.n; k++) {
    const sx = pr() * W, sy = pr() * H, sp = 0.6 + pr() * 0.8;
    const x = ((sx + t * pc.vx * sp * 60) % W + W) % W, y = ((sy + t * pc.vy * sp * 60) % H + H) % H;
    c.globalAlpha = 0.4 + 0.6 * Math.abs(Math.sin(t * 0.002 + k));
    if (pc.len) L(c, [x, y, x + pc.len * sp, y], pc.col, 1); else c.fillRect(x, y, 1.6, 1.6);
  }
  c.restore();
}

// Foreground silhouettes at the bottom corners of each scene, plus a vignette, for depth in front of the actors.
function drawForeground(c, i, t) {
  const kind = SCENES[i], rim = SCENE_RIM[i], dk = '#07050a';
  const edge = pts => { P(c, pts, dk, 0); L(c, pts.slice(0, pts.length - 4), rim, 1.2); };
  c.save(); c.globalAlpha = 0.95;
  if (kind === 'colony' || kind === 'fire') {
    edge([0, 300, 18, 286, 40, 290, 62, 304, 80, 320, 0, 320]);
    edge([720, 296, 700, 288, 676, 296, 660, 312, 650, 320, 720, 320]);
    plate(c, [24, 292, 70, 284, 72, 290, 26, 298], '#2a1a1c', '#4a2a2a', '#100608', 1);
    if (kind === 'fire') { c.save(); glowOn(c, '#ff7a2a', 12); for (const [x, h] of [[36, 16], [690, 20]]) { const f = Math.sin(t * 0.012 + x) * 3; P(c, [x - 6, 292, x, 292 - h - f, x + 6, 292], 'rgba(255,140,40,0.8)', 0); } c.restore(); }
  } else if (kind === 'hive') {
    edge([0, 302, 40, 292, 90, 300, 120, 320, 0, 320]);
    edge([720, 298, 680, 292, 640, 304, 620, 320, 720, 320]);
    for (let k = 0; k < 9; k++) { const x = 8 + k * 9, sw = Math.sin(t * 0.002 + k) * 2; L(c, [x, 300, x - 3 + sw, 284 - (k % 3) * 4], '#3a2410', 1.2); }
  } else if (kind === 'station') {
    for (const x of [14, 64, 114]) plate(c, [x, 320, x + 6, 320, x + 6, 270, x, 270], '#1a1e3a', '#3a4270', '#0a0c1c', 1);
    L(c, [0, 276, 130, 276], '#3a4270', 3); L(c, [0, 292, 130, 292], '#2a3058', 2);
    plate(c, [640, 320, 640, 282, 700, 278, 720, 286, 720, 320], '#141834', '#2a3060', '#08091a', 1.2);
    c.save(); glowOn(c, '#5ad1e6', 8); c.fillStyle = '#5ad1e6'; c.fillRect(656, 292, 18, 3); c.restore();
  } else if (kind === 'forge') {
    edge([0, 296, 30, 282, 64, 290, 90, 320, 0, 320]);
    edge([720, 290, 690, 280, 660, 292, 640, 320, 720, 320]);
    c.save(); glowOn(c, '#ff6a1a', 10); c.globalAlpha = 0.6 + 0.3 * Math.sin(t * 0.004); L(c, [20, 300, 34, 306, 50, 302], '#ff7a2a', 1.6); L(c, [670, 300, 690, 296, 704, 304], '#ff7a2a', 1.6); c.restore();
  } else if (kind === 'void') {
    for (const [x, h, w] of [[16, 46, 10], [34, 28, 8], [690, 52, 12], [668, 30, 8]]) { P(c, [x - w, 320, x, 320 - h, x + w, 320], dk, 0); c.save(); glowOn(c, '#c46aff', 8); L(c, [x - w, 320, x, 320 - h, x + w * 0.4, 320 - h * 0.6], '#c46aff', 1.2); c.restore(); }
  } else if (kind === 'hall') {
    for (const x of [0, 690]) { plate(c, [x, 320, x, 280, x + 30, 280, x + 30, 320], '#2a2236', '#4a4060', '#120e1a', 1.2); plate(c, [x - 4, 280, x + 34, 280, x + 34, 272, x - 4, 272], '#3a3248', '#5a5070', '#1a1424', 1); }
  }
  c.restore();
  const vg = c.createRadialGradient(W / 2, H * 0.55, H * 0.35, W / 2, H * 0.55, W * 0.62);
  vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.42)');
  c.fillStyle = vg; c.fillRect(0, 0, W, H);
}

function shadow(c, x, rx) {
  const g = c.createRadialGradient(x, GROUND + 3, 1, x, GROUND + 3, rx);
  g.addColorStop(0, 'rgba(0,0,0,0.55)'); g.addColorStop(1, 'rgba(0,0,0,0)');
  c.fillStyle = g; c.save(); c.translate(x, GROUND + 3); c.scale(1, 0.22); c.beginPath(); c.arc(0, 0, rx, 0, Math.PI * 2); c.restore(); c.fill();
}

/* ---------- Combat effects ---------- */
const huge = e => !!e && (e.kind === 'titan' || e.kind === 'singularity');
function unitPos(side) {
  const a = (B && B.act && B.act[side]) || { dx: 0, dy: 0, kb: 0 };
  if (side === 'p') return { x: 200 + a.dx + a.kb, y: GROUND - 78 + a.dy };
  const h = B && huge(B.e) ? 160 : 82 * (B && B.e.big ? 1.45 : 1);
  return { x: 520 + a.dx + a.kb, y: GROUND - h + a.dy };
}
function vfx(type, o) { if (B && B.vfx) B.vfx.push({ type, t: 0, life: 0.4, ...o }); }
function drawVfx(c, dt) {
  B.vfx = B.vfx.filter(v => (v.t += dt / 1000) < v.life);
  for (const v of B.vfx) {
    const k = v.t / v.life, inv = 1 - k;
    c.save(); c.globalCompositeOperation = 'lighter';
    switch (v.type) {
      case 'slash': {
        c.translate(v.x, v.y); c.scale(v.dir, 1); c.rotate(-0.6 + k * 0.5);
        c.globalAlpha = inv; glowOn(c, v.col, 14);
        c.beginPath(); c.arc(0, 0, 50, -1.3, 1.1); c.arc(-10, 4, 44, 1.1, -1.3, true); c.closePath();
        c.fillStyle = v.col; c.fill();
        break;
      }
      case 'sparks': {
        const r = seeded(Math.floor(v.seed) + 1);
        c.strokeStyle = v.col; c.lineWidth = 1.6; glowOn(c, v.col, 8); c.globalAlpha = inv;
        for (let i = 0; i < 12; i++) {
          const a = r() * Math.PI * 2, sp = 30 + r() * 60, x = v.x + Math.cos(a) * sp * k, y = v.y + Math.sin(a) * sp * k + 50 * k * k;
          L(c, [x, y, x - Math.cos(a) * 7 * inv, y - Math.sin(a) * 7 * inv], v.col, 1.6);
        }
        break;
      }
      case 'bolt': {
        const a = unitPos(v.from), b = unitPos(v.to), x = a.x + (b.x - a.x) * k, y = a.y + (b.y - a.y) * k - Math.sin(k * Math.PI) * 18;
        glowOn(c, v.col, 18); c.fillStyle = v.col;
        for (let i = 0; i < 6; i++) { const kk = Math.max(0, k - i * 0.04), tx = a.x + (b.x - a.x) * kk, ty = a.y + (b.y - a.y) * kk - Math.sin(kk * Math.PI) * 18; c.globalAlpha = 1 - i / 6; c.beginPath(); c.arc(tx, ty, 7 - i, 0, Math.PI * 2); c.fill(); }
        c.globalAlpha = 1; c.fillStyle = '#ffffff'; c.beginPath(); c.arc(x, y, 3.5, 0, Math.PI * 2); c.fill();
        break;
      }
      case 'burst': {
        const rr = 14 + 56 * k, g = c.createRadialGradient(v.x, v.y, 0, v.x, v.y, rr);
        g.addColorStop(0, `rgba(255,240,200,${inv})`); g.addColorStop(0.4, v.col); g.addColorStop(1, 'rgba(0,0,0,0)');
        c.globalAlpha = inv; c.fillStyle = g; c.beginPath(); c.arc(v.x, v.y, rr, 0, Math.PI * 2); c.fill();
        const r = seeded(9);
        c.fillStyle = v.col;
        for (let i = 0; i < 7; i++) { const a = -Math.PI / 2 + (r() - 0.5) * 2.2, len = 30 + r() * 30; P(c, [v.x + Math.cos(a - 0.2) * 10, v.y + Math.sin(a - 0.2) * 10, v.x + Math.cos(a) * len * (0.4 + k), v.y + Math.sin(a) * len * (0.4 + k), v.x + Math.cos(a + 0.2) * 10, v.y + Math.sin(a + 0.2) * 10], v.col, 0); }
        break;
      }
      case 'ring': {
        c.globalAlpha = inv; c.strokeStyle = v.col; c.lineWidth = 4 * inv + 1; glowOn(c, v.col, 12);
        c.beginPath(); c.ellipse(v.x, v.y, 20 + 150 * k, 5 + 20 * k, 0, 0, Math.PI * 2); c.stroke();
        c.lineWidth = 2; c.beginPath(); c.ellipse(v.x, v.y, 10 + 90 * k, 3 + 12 * k, 0, 0, Math.PI * 2); c.stroke();
        break;
      }
      case 'heal': {
        const r = seeded(4); c.fillStyle = '#8affb0'; glowOn(c, '#6fdc8c', 10);
        for (let i = 0; i < 10; i++) {
          const x = v.x - 30 + r() * 60, y = v.y + 40 - (r() * 40 + 70 * k), s = 2 + r() * 2.5;
          c.globalAlpha = inv * (0.5 + r() * 0.5); c.fillRect(x - s, y - 0.8, s * 2, 1.6); c.fillRect(x - 0.8, y - s, 1.6, s * 2);
        }
        break;
      }
      case 'hex': {
        c.globalAlpha = 0.9 * inv; c.strokeStyle = '#5ad1e6'; c.lineWidth = 1.6; glowOn(c, '#5ad1e6', 12);
        const rr = 56 + 10 * k;
        for (let ring = 0; ring < 2; ring++) {
          const rad = rr - ring * 14, pts = [];
          for (let i = 0; i < 6; i++) { const a = Math.PI / 6 + i * Math.PI / 3; pts.push(v.x + Math.cos(a) * rad * 0.8, v.y + Math.sin(a) * rad); }
          P(c, pts, ring ? null : 'rgba(90,209,230,0.12)', 0); L(c, [...pts, pts[0], pts[1]], '#5ad1e6', 1.6);
        }
        break;
      }
      case 'charge': {
        const r = seeded(Math.floor(v.seed || 3)); glowOn(c, v.col, 16); c.fillStyle = v.col;
        for (let i = 0; i < 12; i++) { const an = r() * Math.PI * 2, d = (1 - k) * (28 + r() * 34); c.globalAlpha = Math.min(1, k * 1.5); c.fillRect(v.x + Math.cos(an) * d - 1, v.y + Math.sin(an) * d - 1, 2.4, 2.4); }
        c.globalAlpha = 1; const rr = 3 + 9 * k; c.beginPath(); c.arc(v.x, v.y, rr, 0, Math.PI * 2); c.fill();
        c.fillStyle = '#ffffff'; c.beginPath(); c.arc(v.x, v.y, rr * 0.45, 0, Math.PI * 2); c.fill();
        break;
      }
      case 'tracer': {
        const x = v.x1 + (v.x2 - v.x1) * k, y = v.y1 + (v.y2 - v.y1) * k, k0 = Math.max(0, k - 0.4);
        glowOn(c, v.col, 10); L(c, [v.x1 + (v.x2 - v.x1) * k0, v.y1 + (v.y2 - v.y1) * k0, x, y], v.col, 3); L(c, [v.x1 + (v.x2 - v.x1) * k0, v.y1 + (v.y2 - v.y1) * k0, x, y], '#ffffff', 1.2);
        break;
      }
      case 'muzzle': {
        c.translate(v.x, v.y); c.scale(v.dir || 1, 1); glowOn(c, v.col, 14); c.globalAlpha = inv;
        P(c, [0, -9, 26, 0, 0, 9, 6, 0], v.col, 0); P(c, [0, -5, 14, 0, 0, 5, 3, 0], '#ffffff', 0);
        break;
      }
      case 'dissolve': {
        const r = seeded(17); c.fillStyle = v.col; glowOn(c, v.col, 8);
        for (let i = 0; i < 46; i++) { const x = v.x - v.w / 2 + r() * v.w, y = v.y - r() * v.h - k * (40 + r() * 70), sz = 1 + r() * 2.6; c.globalAlpha = inv * (0.4 + r() * 0.6); c.fillRect(x + Math.sin(k * 6 + i) * 6, y, sz, sz); }
        break;
      }
      case 'nova': {
        c.translate(v.x, v.y); c.rotate(k * 0.6); glowOn(c, v.col, 20); c.globalAlpha = inv;
        for (let i = 0; i < 8; i++) { const len = (i % 2 ? 50 : 90) * (0.4 + k); c.rotate(Math.PI / 4); P(c, [-4, 0, 0, -len, 4, 0, 0, 6], i % 2 ? v.col : '#ffffff', 0); }
        break;
      }
    }
    c.restore();
  }
}

/* ---------- Art kit: outlined, cel-shaded vector sprites ---------- */
const INK = '#0b0918';
function shade(col, amt) {
  let r, g, b;
  if (col[0] === '#') { const n = parseInt(col.slice(1), 16); r = n >> 16; g = (n >> 8) & 255; b = n & 255; }
  else [r, g, b] = col.match(/\d+/g).map(Number);
  const f = v => clamp(Math.round(v + amt), 0, 255);
  return `rgb(${f(r)},${f(g)},${f(b)})`;
}
// Filled, ink-outlined polygon from a flat [x,y,...] list. Pass fill=null to only outline, lw=0 to skip the outline.
function P(c, pts, fill, lw = 1.3) {
  c.beginPath(); c.moveTo(pts[0], pts[1]);
  for (let i = 2; i < pts.length; i += 2) c.lineTo(pts[i], pts[i + 1]);
  c.closePath();
  if (fill) { c.fillStyle = fill; c.fill(); }
  if (lw) { c.lineWidth = lw; c.strokeStyle = INK; c.stroke(); }
}
function L(c, pts, color, lw) {
  c.beginPath(); c.moveTo(pts[0], pts[1]);
  for (let i = 2; i < pts.length; i += 2) c.lineTo(pts[i], pts[i + 1]);
  c.strokeStyle = color; c.lineWidth = lw; c.stroke();
}
const glowOn = (c, col, blur) => { c.shadowColor = col; c.shadowBlur = window.__fast ? 0 : blur; };
const glowOff = c => { c.shadowBlur = 0; };
// Tapered segment between two joints, with a lit edge.
function limb(c, x1, y1, x2, y2, w1, w2, fill, hi) {
  const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy) || 1, nx = -dy / len, ny = dx / len;
  P(c, [x1 + nx * w1, y1 + ny * w1, x2 + nx * w2, y2 + ny * w2, x2 - nx * w2, y2 - ny * w2, x1 - nx * w1, y1 - ny * w1], fill);
  if (hi) P(c, [x1 + nx * w1 * 0.85, y1 + ny * w1 * 0.85, x2 + nx * w2 * 0.85, y2 + ny * w2 * 0.85, x2 + nx * w2 * 0.25, y2 + ny * w2 * 0.25, x1 + nx * w1 * 0.25, y1 + ny * w1 * 0.25], hi, 0);
}

/* ---------- Hero appearance ---------- */
const SKIN = ['#f3cfae', '#dfa57c', '#b97a52', '#8a5638', '#5a3624', '#8fb7d0', '#9cc48a'];
const HAIR = ['#1c1714', '#5a3a22', '#a8692e', '#e3c46e', '#cfd0d8', '#b8323a', '#3f62c8'];
const EYES = ['#5ad1e6', '#f2b544', '#6fdc8c', '#ff5a6a', '#c46aff', '#f4f4ff'];
const LOOK_OPTS = {
  build: [['m', 'Broad'], ['f', 'Slender']],
  gear: [['visor', 'Visor helm'], ['knight', 'Open helm'], ['horned', 'Horned helm'], ['crest', 'Plumed helm'], ['hood', 'Hood'], ['circlet', 'Circlet'], ['mask', 'Rebreather'], ['none', 'Bare head']],
  hair: [['short', 'Short'], ['long', 'Long'], ['mohawk', 'Mohawk'], ['tail', 'Ponytail'], ['braids', 'Braids'], ['topknot', 'Topknot'], ['shaved', 'Shaved']],
  beard: [['none', 'None'], ['stubble', 'Stubble'], ['goatee', 'Goatee'], ['moustache', 'Moustache'], ['full', 'Full beard']],
  mark: [['none', 'None'], ['scar', 'Scar'], ['paint', 'War paint'], ['tattoo', 'Circuit tattoo'], ['patch', 'Eye patch']],
};
const DEFAULT_LOOK = { build: 'm', gear: 'knight', skin: 1, hair: 'short', hairCol: 1, eyes: 0, beard: 'stubble', mark: 'scar' };
const pal = (v, list) => typeof v === 'number' ? list[v % list.length] : v;

// How each armour piece looks on the body. Enemy knights pass their own objects in the same shape.
const ARMOR_LOOK = {
  a_vest:  { style: 'cloth', base: '#8a6a48', trim: '#3a2a1e', pauldron: 'pad', cloth: true, scarf: '#9a3a2a', motif: 'stitch' },
  a_alloy: { style: 'munition', base: '#8a93a3', trim: '#4a505c', pauldron: 'round', cape: '#7a2a34', motif: 'rivet', tabard: '#7a2a34', under: '#3a2e2a' },
  a_cara:  { style: 'chitin', base: '#4f6a3e', trim: '#c9b46a', pauldron: 'elytra', spike: '#d8cfa8', under: '#2a2a1c' },
  a_aegis: { style: 'paladin', base: '#c2ccdc', trim: '#3a6ad0', pauldron: 'paladin', cape: '#2a3a8a', capeLong: true, rivet: '#e8c25a', motif: 'filigree', tabard: '#2a3a8a', under: '#22283a' },
  a_magma: { style: 'jugg', base: '#3a2e2c', trim: '#ff7a2a', glow: '#ff7a2a', seams: true, pauldron: 'massive', spike: '#5a4440', under: '#1a1210' },
  t_horizon: { style: 'paladin', base: '#2a3050', trim: '#ffd27a', pauldron: 'paladin', cape: '#10183a', capeLong: true, rivet: '#ffd27a', motif: 'rune', glow: '#ffd27a', stars: true, tabard: '#10183a', under: '#141830' },
  a_void:  { style: 'void', base: '#2e2448', trim: '#c46aff', glow: '#c46aff', stars: true, pauldron: 'float', cape: '#1a1030', capeLong: true, motif: 'rune', under: '#120c1c' },
};
function armorStyle(a) { return { dark: shade(a.base, -38), light: shade(a.base, 42), ...a }; }

function headPath(c, f) {
  c.beginPath(); c.moveTo(-7, -3);
  c.quadraticCurveTo(-8, -11.5, 0, -11.5); c.quadraticCurveTo(7, -11.5, 8.5, -5);
  c.lineTo(8.7, -2.6); c.lineTo(10.2, 0.8); c.lineTo(8.7, 2); c.lineTo(9.1, 3.9); c.lineTo(8.1, 5.1);
  if (f) { c.quadraticCurveTo(8.2, 7.6, 2.8, 8.8); c.lineTo(-1.8, 6.2); }
  else { c.lineTo(8.4, 7); c.quadraticCurveTo(7.2, 9.6, 3, 9.6); c.lineTo(-2, 6.6); }
  c.quadraticCurveTo(-6, 4, -7, -3); c.closePath();
}
const HAIR_CAP = [-7.6, -2, -8.4, -9, -3.4, -13, 3.5, -12.8, 8.9, -7.4, 7.4, -5.6, 5.6, -7.4, 3.6, -5.8, 1.6, -7.8, -1.2, -6, -3.6, -4.2, -5, -1];

// Head in local space: centre (0,0), facing right, about 22 units tall.
function drawHead(c, look, A, acc, t) {
  look = { ...DEFAULT_LOOK, ...look };
  const fem = look.build === 'f';
  const skin = pal(look.skin, SKIN), hair = pal(look.hairCol, HAIR), eye = pal(look.eyes, EYES);
  const g = look.gear, closed = g === 'visor' || g === 'horned', open = g === 'knight' || g === 'crest';
  const bare = g === 'none' || g === 'circlet' || g === 'mask';
  const sw = Math.sin(t * 0.004) * 1.2;
  const hairDark = shade(hair, -22), hairLit = shade(hair, 45);

  // Hair that hangs behind the head
  if (bare || open) {
    if (look.hair === 'long') {
      P(c, [-6, -8, -9.6, 0, -9.8 + sw * 0.3, 10, -7 + sw * 0.4, 15, -3.2, 13.4, -4.2, 6, -3, -2], hairDark);
      L(c, [-7.6, -2, -8.2, 6, -6.8 + sw * 0.4, 12.6], shade(hair, 15), 0.6);
    }
    if (look.hair === 'tail') {
      P(c, [-7, -7, -11, -4.5, -15 + sw, 4, -13.6 + sw, 12, -11 + sw, 6, -9, -1, -6, -4], shade(hair, -12));
      L(c, [-11, -2, -13 + sw, 6], hairLit, 0.6);
      P(c, [-9.8, -5.6, -7.6, -6.8, -7, -4.4, -9.2, -3.4], A.trim, 0.9);
    }
    if (look.hair === 'braids') for (const [ox, len] of [[-6.6, 6], [-3.8, 5]]) {
      for (let i = 0; i < len; i++) { const y = -1 + i * 2.8, x = ox - i * 0.35 + sw * 0.15 * i; P(c, [x, y - 1.6, x + 1.5, y, x, y + 1.6, x - 1.5, y], i % 2 ? hair : hairDark, 0.7); }
      P(c, [ox - len * 0.35 - 1, -1 + len * 2.8, ox - len * 0.35 + 1, -1 + len * 2.8, ox - len * 0.35, 1 + len * 2.8], '#c9a24a', 0.6);
    }
  }
  if (g === 'crest') {
    P(c, [-3, -13, 3, -14.6, -1, -20 + sw * 0.3, -9, -19.6, -17 + sw, -12, -16 + sw, -3.6, -12, -8.6], hair);
    for (const k of [0, 1, 2]) L(c, [-1 - k * 2, -17.5 + k, -8 - k * 2, -16 + k * 2, -13 + sw - k, -9 + k * 2], k ? hairDark : hairLit, 0.7);
  }
  P(c, [-3, 5, 3, 6, 3.5, 13, -3.5, 13], shade(skin, -30), 1);
  L(c, [2.4, 7, 2.8, 12], shade(skin, -45), 0.6);
  if (g === 'horned') {
    P(c, [-3, -11, -9, -15, -14, -23, -15.5, -31, -10.6, -22, -6, -17, 0, -13.4], '#d9cdb0');
    for (const k of [0, 1, 2]) L(c, [-5 - k * 2.6, -14.4 - k * 2.4, -2.8 - k * 2.6, -16 - k * 2.6], '#a8987a', 0.6);
  }

  if (closed) {
    const helm = [-8.8, -1, -8.8, -9.6, -3.4, -13.8, 4.4, -13.4, 9.8, -7, 10.8, 0, 9.8, 6.6, 5.4, 10.6, -2, 10.4, -6.4, 7];
    P(c, [-8.2, 5.6, -3, 10, -4.4, 13.2, -10, 9.4], A.dark, 1);
    P(c, helm, A.base);
    c.save(); P(c, helm, null, 0); c.clip();
    c.fillStyle = A.dark; c.fillRect(-10, -15, 7, 28);
    P(c, [3.4, -11, 9.8, -7, 10.8, 0, 9.8, 6.6, 5.4, 10.6, 3, 9, 2.2, 0], shade(A.base, 16), 0);
    P(c, [-1.6, -13, 4.4, -12.8, 9.2, -7.2, 6, -7, 1.6, -10.4], A.light, 0);
    c.restore();
    L(c, [-6.4, -12.2, -1, -14.2, 5, -13.6, 9.8, -7], shade(A.light, 25), 1.1);
    L(c, [3.4, -11, 2.2, 0, 3, 9], A.dark, 0.8);
    L(c, [-8.8, -1, -6.4, 7, -2, 10.4], A.trim, 1.2);
    P(c, helm, null);
    P(c, [2.2, -4.4, 10.8, -3.4, 10.9, -0.4, 2.2, -0.8], '#08060e', 0.8);
    glowOn(c, eye, 10); P(c, [3, -3.4, 10.4, -2.6, 10.4, -1.4, 3, -1.8], eye, 0); glowOff(c);
    c.fillStyle = '#ffffff'; c.globalAlpha = 0.8; c.fillRect(6.5, -2.9, 2.2, 0.6); c.globalAlpha = 1;
    c.fillStyle = '#08060e'; for (const [hx, hy] of [[5.8, 2.6], [7.4, 2.4], [9, 2.2], [6, 4.6], [7.6, 4.4], [9.2, 4.2]]) c.fillRect(hx, hy, 0.9, 0.9);
    c.fillStyle = A.rivet || A.light; c.fillRect(-5.6, -6, 1.3, 1.3); c.fillRect(-3, 4.4, 1.3, 1.3);
    if (g === 'horned') {
      P(c, [4, -11.5, 7, -17, 7.6, -24.5, 10, -17, 8.4, -11], '#e8dcc4');
      for (const k of [0, 1]) L(c, [5.4 + k * 0.6, -14 - k * 3, 8.6 + k * 0.4, -14.4 - k * 3], '#b8aa8c', 0.6);
    }
    if (acc === 'x_scope') { glowOn(c, '#ff4a4a', 6); P(c, [5, -5, 8.6, -5, 8.6, -1.4, 5, -1.4], 'rgba(255,70,70,0.5)', 0.8); glowOff(c); }
    if (A.style) helmAccent(c, A, true, t);
    return;
  }

  // Face
  headPath(c, fem); c.fillStyle = skin; c.fill();
  c.save(); headPath(c, fem); c.clip();
  c.fillStyle = shade(skin, -26); c.beginPath(); c.moveTo(-9, -14); c.lineTo(0.5, -14); c.lineTo(-1.5, 12); c.lineTo(-9, 12); c.fill();
  P(c, [2.6, 4, 8.2, 7.4, 7.6, 9.6, 2, 9.4, -1, 6.6], shade(skin, -14), 0);
  P(c, [6, -6, 8.4, -5, 8.6, -2.6, 6.2, -3], shade(skin, 20), 0);
  P(c, [4.6, 0.6, 7.4, 0.4, 6.4, 2.6], shade(skin, 12), 0);
  c.restore();
  headPath(c, fem); c.lineWidth = 1.3; c.strokeStyle = INK; c.stroke();
  L(c, [8.6, -2.4, 9.8, 0.8], shade(skin, -32), 0.6);
  c.fillStyle = shade(skin, -55); c.fillRect(8.6, 1.1, 0.8, 0.6);
  P(c, [7.3, 3.8, 9.1, 3.9, 8.6, 4.9, 7.5, 4.8], fem ? '#b8566a' : shade(skin, -38), 0);
  P(c, [-1.4, -2.6, -4, -3, -4.6, 1.6, -2, 2.6], shade(skin, -14), 0.9);
  L(c, [-2.4, -1.6, -3.4, 0.8], shade(skin, -40), 0.6);
  if (look.mark === 'patch') {
    L(c, [3.4, -4.6, -6, -7.4], '#1a1418', 0.9); L(c, [3.6, -0.8, -5.6, 1.2], '#1a1418', 0.9);
    P(c, [3.6, -3.6, 8, -3.8, 7.6, -0.4, 4, -0.2], '#1a1418', 0.8);
  } else {
    P(c, [4, -2.6, 7.4, -2.6, 6.9, -1, 4.4, -1.2], '#f4efe8', 0.6);
    c.fillStyle = eye; c.fillRect(5.5, -2.5, 1.6, 1.45); c.fillStyle = INK; c.fillRect(6.2, -2.3, 0.7, 1);
    c.fillStyle = '#ffffff'; c.fillRect(5.6, -2.45, 0.5, 0.5);
    L(c, [3.8, -2.9, 7.6, -2.8], INK, 0.7);
    if (fem) { L(c, [7.4, -2.8, 8.6, -3.8], INK, 0.6); L(c, [6.8, -2.9, 7.6, -4], INK, 0.5); }
  }
  P(c, [3.6, -4.6, 8.4, -4.9, 8.2, -3.7, 3.8, -3.5], hairDark, 0);
  if (look.mark === 'scar') { L(c, [4.2, -6.6, 7.4, 1.6], shade(skin, -40), 1.1); L(c, [4.4, -6.4, 7.6, 1.4], shade(skin, 35), 0.5); }
  if (look.mark === 'paint') { P(c, [4.4, 0, 8.2, 0.2, 8, 1.1, 4.6, 0.9], '#c43a3a', 0); P(c, [4, 2, 7.6, 2.3, 7.4, 3.1, 4.2, 2.9], '#c43a3a', 0); P(c, [1, -9, 3, -9.4, 2.6, -7.6], '#c43a3a', 0); }
  if (look.mark === 'tattoo') { c.save(); glowOn(c, eye, 6); L(c, [-1, -9, 1.6, -7, 1.6, -4, 3, -3.4], eye, 0.6); L(c, [3.4, 1.4, 5, 3, 5, 6.4, 3.4, 7.6], eye, 0.6); c.fillStyle = eye; c.fillRect(2.7, -3.9, 1, 1); c.fillRect(3, 7.2, 1, 1); c.restore(); }
  if (look.beard !== 'none') {
    const bc = shade(hair, -6);
    if (look.beard === 'stubble') { c.save(); c.globalAlpha = 0.42; P(c, [8.8, 3.4, 9.1, 7.4, 7, 10.6, 3, 11.4, -1.6, 7.6, -2, 5, 1, 6.4, 4, 6.8, 6.4, 5.6, 7.4, 5.4], bc, 0); c.restore(); }
    if (look.beard === 'full') { P(c, [8.8, 3.4, 9.2, 7.4, 7.4, 11, 3.6, 12.6, -1.6, 8, -2, 5, 1, 6.4, 4, 6.8, 6.4, 5.6, 7.4, 5.4], bc, 1); L(c, [5, 7.6, 4.6, 11], hairDark, 0.6); L(c, [7.4, 6.8, 7.4, 10], hairLit, 0.5); }
    if (look.beard === 'goatee') P(c, [7.2, 5.6, 8.6, 6.2, 8.6, 9.4, 6.6, 11.2, 5.2, 9.4], bc, 0.8);
    if (look.beard === 'moustache' || look.beard === 'full' || look.beard === 'goatee') P(c, [6.8, 3.4, 9.2, 2.6, 9.6, 3.8, 8.8, 4.2, 7.2, 4.6, 6.2, 5.6], bc, 0.7);
  }
  if (acc === 'x_scope') { L(c, [4.5, -2, -3, -4], '#2a2a33', 0.8); glowOn(c, '#ff4a4a', 6); P(c, [4.3, -3.6, 7.8, -3.6, 7.8, -0.3, 4.3, -0.3], 'rgba(255,70,70,0.45)', 0.8); glowOff(c); }

  if (bare) {
    const h = look.hair;
    if (h === 'mohawk' || h === 'shaved' || h === 'topknot') {
      c.save(); headPath(c, fem); c.clip(); c.globalAlpha = 0.3; c.fillStyle = hair; c.fillRect(-9, -14, 18, 9); c.fillRect(-9, -14, 5, 16); c.restore();
    }
    if (h === 'mohawk') {
      P(c, [-6.6, -8, -9.4, -14, -4.2, -12, -3.2, -18.4, 0, -13, 2.6, -18, 4.2, -12.4, 8.4, -15, 7.6, -9, 4, -10, 0, -10.6, -4, -9.6], hair);
      L(c, [-3.2, -16.6, -2, -12.4], hairLit, 0.6); L(c, [2.6, -16.2, 3, -12], hairLit, 0.6);
    } else if (h === 'topknot') {
      P(c, [-5, -12.4, -4.4, -17.4, -1, -19.4, 2.8, -17.6, 2.4, -12.6], hair);
      P(c, [-4.6, -13.4, 2.6, -13.6, 2.4, -12, -4.4, -11.8], '#c9a24a', 0.7);
      L(c, [-2.6, -17.6, 0.4, -18.4], hairLit, 0.6);
    } else if (h !== 'shaved') {
      P(c, HAIR_CAP, hair);
      L(c, [-4, -11.4, 2, -11.6, 6, -9], hairLit, 0.8);
      L(c, [-6, -7, -3, -10.4], hairDark, 0.6); L(c, [0, -8, 3, -11], hairDark, 0.6);
    }
    if (g === 'circlet') {
      P(c, [-7.8, -6.8, 8.6, -7.4, 8.8, -5.6, -7.8, -5], '#e8c25a', 0.8);
      L(c, [-6, -6.6, 7, -7], '#fff2b8', 0.4);
      glowOn(c, eye, 8); P(c, [6.4, -8.6, 7.8, -6.5, 6.4, -4.6, 5, -6.5], eye, 0.6); glowOff(c);
    }
    if (g === 'mask') {
      L(c, [3, 2.6, -3.6, -0.6], '#2a2a33', 1);
      P(c, [4.4, -0.6, 10.8, 0.6, 11.2, 6.2, 8.4, 9.4, 3.4, 8.6, 2.6, 2.4], '#4a4e5a');
      P(c, [4.4, -0.6, 10.8, 0.6, 11.2, 3, 4, 2], '#7a808e', 0);
      for (const y of [3.6, 5.2, 6.8]) L(c, [5.4, y, 9.6, y + 0.3], '#22242a', 0.6);
      P(c, [8.6, 6.6, 12.4, 7.4, 12.2, 10.4, 8.8, 10], '#33363e', 0.8);
      glowOn(c, eye, 6); c.fillStyle = eye; c.fillRect(10, 8, 1.6, 1.2); glowOff(c);
    }
  } else if (open) {
    const helm = [-8.6, 7, -8.9, -8, -3.4, -13.6, 4.6, -13.2, 9.6, -6.6, 9.4, -4.2, 4.2, -4.6, 3, -3, 3.6, 5, 1, 9.8, -3.6, 9.4];
    P(c, [-8.8, 5, 1.6, 8.4, 2.6, 13.6, -8.8, 13.4], A.dark, 1);
    for (let y = 7.6; y <= 13; y += 1.5) for (let x = -8; x <= 1.4; x += 1.6) L(c, [x, y, x + 0.8, y + 0.7, x + 1.6, y], shade(A.dark, 34), 0.4);
    P(c, helm, A.base);
    c.save(); P(c, helm, null, 0); c.clip();
    c.fillStyle = A.dark; c.fillRect(-10, -15, 6.5, 26);
    P(c, [-2, -12.6, 4.5, -12.4, 8.8, -6.8, 6, -6.6, 2, -10], A.light, 0);
    c.restore();
    L(c, [-6.6, -12, -1, -14, 4.6, -13.2, 9.6, -6.6], shade(A.light, 25), 0.9);
    L(c, [9.4, -4.4, 4.2, -4.8, 3, -3, 3.6, 5], A.trim, 1.2);
    P(c, helm, null);
    P(c, [2.8, -3, 5, -3.4, 5.4, 5.4, 3.4, 8.6, 1.2, 8], A.base, 0.9);
    L(c, [3.2, -2.4, 4.6, 6], A.light, 0.5);
    P(c, [7.6, -4.8, 8.9, -4.8, 9.4, 1.4, 8.3, 1.6], A.light, 0.9);
    c.fillStyle = A.rivet || A.light; c.fillRect(-5.5, -6, 1.4, 1.4); c.fillRect(-5.5, 2, 1.4, 1.4); c.fillRect(3.6, 0, 1, 1);
    if (A.style) helmAccent(c, A, false, t);
  } else if (g === 'hood') {
    c.save(); headPath(c, fem); c.clip(); c.fillStyle = 'rgba(5,3,12,0.3)'; c.fillRect(-10, -14, 22, 26); c.restore();
    const hc = A.cape || shade(A.base, -8);
    P(c, [-9.6, 12, -10.8, -5, -4.6, -14.8, 4.8, -14, 10.8, -7, 10.4, -3.8, 5, -6.4, 3, -2.4, 3.4, 6, 0.6, 12], hc);
    P(c, [-4.6, -14.8, 4.8, -14, 10.8, -7, 7, -8, 1, -11.4], shade(hc, 30), 0);
    L(c, [10.4, -3.8, 5, -6.4, 3, -2.4, 3.4, 6, 0.6, 12], shade(hc, -35), 1.4);
    L(c, [-6, -10, -8, 4], shade(hc, -30), 0.8); L(c, [-2, -12, -4, 8], shade(hc, -25), 0.6);
  }
}


// Weapons are drawn around the grip, blade pointing up (-y). The caller rotates.
// Each has a bevelled build and its own moving detail.
function grip(c, y0, y1, col, wrap) {
  plate(c, [-1.7, y0, 1.7, y0, 1.7, y1, -1.7, y1], col, shade(col, 40), shade(col, -40), 1);
  for (let y = y0 + 1.6; y < y1 - 0.6; y += 2) L(c, [-1.7, y, 1.7, y - 1.2], wrap, 0.7);
}
function drawWeapon(c, id, A, t) {
  switch (id) {
    case 'w_ion': {
      grip(c, -4, 7, '#2e333e', '#8a93a3');
      plate(c, [-2.6, 7, 2.6, 7, 2, 9.6, -2, 9.6], '#9aa3b3', '#d0d6e0', '#4a505c', 0.9);
      plate(c, [-3.2, -9, 3.2, -9, 2.6, -4, -2.6, -4], '#9aa3b3', '#d8dee8', '#4a505c', 1);
      for (const y of [-7.6, -6]) L(c, [-3, y, 3, y], '#3a3f4a', 0.6);
      c.save(); glowOn(c, '#5ad1e6', 6); c.fillStyle = '#5ad1e6'; c.fillRect(-0.6, -2, 1.2, 4); c.restore();
      const fl = 1 + Math.sin(t * 0.04) * 0.04;
      c.save(); glowOn(c, '#5ad1e6', 16);
      P(c, [-2.1, -9.5, 2.1, -9.5, 2.1 * fl, -51, 0, -55, -2.1 * fl, -51], '#5ad1e6', 0);
      c.restore();
      P(c, [-0.8, -9.5, 0.8, -9.5, 0.8, -51, 0, -53, -0.8, -51], '#effcff', 0);
      break;
    }
    case 'w_lance': {
      plate(c, [-1.4, 26, 1.4, 26, 1.4, -56, -1.4, -56], '#3e434e', '#6a707e', '#1e2128', 1.1);
      for (const y of [-8, -4, 0, 4, 8]) L(c, [-1.4, y, 1.4, y - 1.4], '#c9a24a', 0.9);
      plate(c, [-2.4, 26, 2.4, 26, 1.4, 30, -1.4, 30], '#c9a24a', '#f2d68a', '#7a5a1a', 0.9);
      plate(c, [-3.4, -56, 3.4, -56, 2.4, -62, -2.4, -62], '#c9a24a', '#f2d68a', '#7a5a1a', 1);
      plate(c, [-2.4, -61, -7.6, -68, -5.4, -59], '#d4dbe6', '#ffffff', '#8a94a8', 1);
      plate(c, [2.4, -61, 7.6, -68, 5.4, -59], '#d4dbe6', '#ffffff', '#8a94a8', 1);
      plate(c, [0, -84, 4.8, -70, 2.4, -61, -2.4, -61, -4.8, -70], '#dfe6f0', '#ffffff', '#8a94a8', 1.2);
      L(c, [0, -82, 0, -63], '#8a94a8', 0.7);
      // spinning containment rings around the tip
      c.save(); glowOn(c, '#fff27a', 8); c.strokeStyle = '#fff27a'; c.lineWidth = 0.8;
      for (let i = 0; i < 2; i++) { const yy = -66 - i * 6, ph = t * 0.012 + i * 2; c.beginPath(); c.ellipse(0, yy, 6.4 - i, 1.6, 0, ph, ph + Math.PI * 1.3); c.stroke(); }
      for (let i = 0; i < 3; i++) { const a0 = Math.random() * Math.PI * 2; L(c, [0, -74, Math.cos(a0) * 6, -74 + Math.sin(a0) * 6, Math.cos(a0 + 0.6) * 11, -74 + Math.sin(a0 + 0.6) * 11], '#fff27a', 0.9); }
      c.restore();
      break;
    }
    case 'w_grav': {
      grip(c, -2, 9, '#2a2a33', '#5a5a6a');
      plate(c, [-5, -5, 5, -5, 5, -1, -5, -1], '#5a5a6a', '#8a8a9a', '#2a2a33', 1);
      const blade = [-3, -5, 10, -7, 14, -45, 4, -52, -3.6, -47];
      plate(c, blade, '#555b70', '#8a90a8', '#2a2e3c', 1.3);
      plate(c, [10, -7, 14, -45, 11.4, -45, 8, -8], '#c0c8e0', '#ffffff', '#8a90a8', 0);
      // rune channel that pulses down the blade
      const pulse = 0.5 + 0.5 * Math.sin(t * 0.005);
      c.save(); glowOn(c, '#b48cff', 10 + 6 * pulse);
      L(c, [1.6, -9, 3, -24, 1.6, -40], '#b48cff', 1.4);
      for (const y of [-14, -25, -36]) P(c, [3.4, y - 3, 6, y, 3.4, y + 3, 0.8, y], '#d8c0ff', 0);
      c.restore();
      for (let i = 0; i < 3; i++) {
        const yy = -18 - i * 12 + Math.sin(t * 0.004 + i) * 2, xx = 18 + Math.sin(t * 0.003 + i * 2) * 2;
        plate(c, [xx, yy - 2.6, xx + 2.6, yy, xx, yy + 2.6, xx - 2.6, yy], '#555b70', '#8a90a8', '#2a2e3c', 0.8);
      }
      break;
    }
    case 'w_nova': {
      grip(c, -3, 8, '#2a1a1a', '#c9a24a');
      plate(c, [-4, -4.6, 0, -6.6, 4, -4.6, 0, -2.6], '#c9a24a', '#f2d68a', '#7a5a1a', 1);
      const g = c.createLinearGradient(0, -5, 0, -56); g.addColorStop(0, '#ff5a1a'); g.addColorStop(0.55, '#ffc46a'); g.addColorStop(1, '#ffffff');
      c.save(); glowOn(c, '#ff9a3a', 16);
      c.beginPath(); c.moveTo(-1.9, -5); c.quadraticCurveTo(-2.6, -32, 7.4, -57); c.lineTo(5.2, -50); c.quadraticCurveTo(1.8, -30, 1.9, -5); c.closePath();
      c.fillStyle = g; c.fill(); c.restore();
      c.lineWidth = 1; c.strokeStyle = INK; c.stroke();
      c.strokeStyle = '#ffffff'; c.lineWidth = 0.7; c.beginPath(); c.moveTo(-1, -8); c.quadraticCurveTo(-1.4, -30, 6, -52); c.stroke();
      // embers peeling off the edge
      c.save(); glowOn(c, '#ff9a3a', 8); c.fillStyle = '#ffd08a';
      for (let i = 0; i < 4; i++) { const k = ((t * 0.0016 + i * 0.25) % 1); c.globalAlpha = 1 - k; c.fillRect(-4 - k * 8, -14 - i * 10 - k * 6, 1.6, 1.6); }
      c.restore();
      break;
    }
    case 'w_star': {
      grip(c, -3, 11, '#26264a', '#9ad8ff');
      plate(c, [-2.8, 11, 2.8, 11, 0, 15.6], '#3a8aff', '#9ad8ff', '#1a3a8a', 1);
      plate(c, [-12, -7, -4, -3.6, 4, -3.6, 12, -7, 9.4, -0.6, 0, -1.8, -9.4, -0.6], '#e8c25a', '#fff2b8', '#8a6a2a', 1.1);
      for (const sx of [-1, 1]) {
        plate(c, [sx * 12, -7, sx * 16, -13, sx * 14, -6, sx * 18, -9, sx * 9, -2.6], '#e8c25a', '#fff2b8', '#8a6a2a', 1);
      }
      plate(c, [-3.6, -4, 3.6, -4, 4, -55, 0, -66, -4, -55], '#dfe6f2', '#ffffff', '#8a94b4', 1.2);
      const pulse = 0.5 + 0.5 * Math.sin(t * 0.004);
      c.save(); glowOn(c, '#9ad8ff', 10 + 8 * pulse); P(c, [-1, -9, 1, -9, 1, -51, -1, -51], '#c8ecff', 0); c.restore();
      for (let i = 0; i < 3; i++) { const yy = -14 - ((t * 0.02 + i * 14) % 38); c.save(); glowOn(c, '#ffffff', 8); c.fillStyle = '#ffffff'; c.globalAlpha = 0.9; P(c, [0, yy - 1.6, 0.8, yy, 0, yy + 1.6, -0.8, yy], '#ffffff', 0); c.restore(); }
      plate(c, [0, -6.4, 2, -4, 0, -1.6, -2, -4], '#3a8aff', '#9ad8ff', '#1a3a8a', 0.8);
      break;
    }
    case 'gun': {
      plate(c, [-3, 4, 3, 4, 3.8, 13.6, -2.6, 12.6], '#2a2d34', '#4a4e58', '#14161a', 1.1);
      plate(c, [-2.9, 6, 2.9, 6, 2.9, -22, -2.9, -22], '#3a3e48', '#5a606e', '#1a1c22', 1.2);
      for (const y of [-18, -14, -10]) L(c, [-2.9, y, 2.9, y], '#1a1c22', 0.6);
      plate(c, [2.9, -10, 7.6, -8, 7.2, -1.6, 2.9, -2.6], '#22252c', '#3a3e48', '#0e1014', 1);
      plate(c, [-1.2, -22, 1.2, -22, 1.2, -37, -1.2, -37], '#1e2026', '#3a3e48', '#0e1014', 1);
      plate(c, [-1.8, -37, 1.8, -37, 1.8, -39, -1.8, -39], '#2a2d34', '#4a4e58', '#14161a', 0.8);
      plate(c, [-6.6, -17, -2.9, -17, -2.9, -5, -6.6, -5], '#22252c', '#3a3e48', '#0e1014', 1);
      c.save(); glowOn(c, A.trim, 6); c.fillStyle = A.trim; c.fillRect(-6, -15.6, 2.4, 2); c.restore();
      break;
    }
    case 'axe': {
      plate(c, [-1.5, 18, 1.5, 18, 1.5, -47, -1.5, -47], '#4a3424', '#6a4a30', '#2a1a10', 1.1);
      for (const y of [6, 10, 14]) L(c, [-1.5, y, 1.5, y - 1.2], '#2a1a10', 0.7);
      plate(c, [-1, -42, -8, -39, -1, -35], '#5a5a62', '#8a8a96', '#2a2a30', 1);
      plate(c, [1, -47, 8, -54, 16.6, -46, 17.6, -34, 9, -27, 1, -32], '#4a4a52', '#7a7a86', '#22222a', 1.3);
      c.save(); glowOn(c, A.glow || '#d8d8e0', 12); L(c, [8, -54, 16.6, -46, 17.6, -34, 9, -27], A.glow || '#d8d8e0', 1.8); c.restore();
      c.save(); glowOn(c, A.glow || '#d8d8e0', 6); L(c, [6, -46, 9, -40, 6, -36], A.glow || '#c8c8d0', 0.8); c.restore();
      break;
    }
    case 'sword': {
      const bl = A.blade || '#c9ccd6';
      grip(c, -3, 7, '#2a2a33', A.trim);
      plate(c, [-2.6, 7, 2.6, 7, 0, 10.4], A.trim, shade(A.trim, 40), shade(A.trim, -40), 0.9);
      plate(c, [-7.6, -4.8, 7.6, -4.8, 6.4, -2, -6.4, -2], A.trim, shade(A.trim, 40), shade(A.trim, -40), 1);
      plate(c, [-2.8, -4.8, 2.8, -4.8, 3, -49, 0, -56, -3, -49], bl, shade(bl, 40), shade(bl, -40), 1.2);
      L(c, [0, -8, 0, -46], shade(bl, -36), 0.9);
      if (A.glow) { c.save(); glowOn(c, A.glow, 10); L(c, [0, -8, 0, -46], A.glow, 1); c.restore(); }
      break;
    }
    case 'staff': {
      plate(c, [-1.4, 36, 1.4, 36, 1.4, -58, -1.4, -58], '#6a4a2a', '#8a6a44', '#3a2a16', 1.1);
      for (const y of [-6, -2, 2, 6]) L(c, [-1.4, y, 1.4, y - 1.2], '#c9a24a', 0.8);
      plate(c, [-4, -58, 4, -58, 2.6, -62, -2.6, -62], '#c9a24a', '#f2d68a', '#7a5a1a', 1);
      const st = []; for (let i = 0; i < 16; i++) { const r = i % 2 ? 3 : 8.6, an = -Math.PI / 2 + i * Math.PI / 8 + t * 0.0008; st.push(Math.cos(an) * r, -71 + Math.sin(an) * r); }
      c.save(); glowOn(c, '#fff0b0', 14); P(c, st, '#e8c25a', 1); P(c, [0, -74, 2.6, -71, 0, -68, -2.6, -71], '#ffffff', 0); c.restore();
      break;
    }
    case 't_glaive': { // chitin shaft, twin mandible blades with venom channels
      plate(c, [-1.3, 24, 1.3, 24, 1.3, -50, -1.3, -50], '#3a4a2e', '#5a6a46', '#1e2616', 1.1);
      for (const y of [-6, 0, 6, 12]) P(c, [-2, y, 2, y, 1.4, y + 2.6, -1.4, y + 2.6], '#c9b46a', 0.7);
      plate(c, [-2.6, 24, 2.6, 24, 0, 30], '#d8cfa8', '#fff8e0', '#8a8460', 0.9);
      plate(c, [-2.6, -50, 2.6, -50, 2, -55, -2, -55], '#c9b46a', '#f2e0a0', '#6a5a2a', 1);
      plate(c, [-1.8, -54, -9, -62, -12, -76, -7, -90, -4, -76, -2, -64], '#d8cfa8', '#fff8e0', '#8a8460', 1.1);
      plate(c, [1.8, -54, 8, -60, 10, -70, 6, -82, 4.2, -70, 1.6, -62], '#c9c098', '#f8f0d0', '#7a7450', 1.1);
      c.save(); glowOn(c, '#b6ff4a', 8); L(c, [-4, -60, -7.6, -72, -6.4, -84], '#b6ff4a', 0.9); L(c, [3.6, -60, 6.4, -70, 5.4, -78], '#b6ff4a', 0.8);
      c.globalAlpha = 0.6 + 0.4 * Math.sin(t * 0.006); P(c, [0, -57, 1.8, -55, 0, -53, -1.8, -55], '#d8ff8a', 0); c.restore();
      break;
    }
    case 't_maul': { // forged block head with a molten heart
      plate(c, [-1.6, 20, 1.6, 20, 1.6, -36, -1.6, -36], '#3a2a24', '#5a4438', '#1e1410', 1.1);
      for (let y = -2; y < 16; y += 2.4) L(c, [-1.6, y, 1.6, y - 1.2], '#8a5a3a', 0.7);
      plate(c, [-2.4, 20, 2.4, 20, 1.6, 24, -1.6, 24], '#5a4440', '#7a6460', '#2a1e1c', 0.9);
      plate(c, [-13, -36, 13, -36, 15, -40, 15, -54, 13, -58, -13, -58, -15, -54, -15, -40], '#3a2e2c', '#6a5a56', '#1a1210', 1.3);
      plate(c, [-15, -40, -19, -42, -19, -52, -15, -54], '#5a4440', '#7a6460', '#2a1e1c', 1);
      plate(c, [15, -40, 19, -42, 19, -52, 15, -54], '#5a4440', '#7a6460', '#2a1e1c', 1);
      const pulse = 0.5 + 0.5 * Math.sin(t * 0.005);
      c.save(); glowOn(c, '#ff7a2a', 10 + 8 * pulse); P(c, [0, -53, 5, -47, 0, -41, -5, -47], '#ff9a3a', 1); P(c, [0, -50, 2.4, -47, 0, -44, -2.4, -47], '#fff0a0', 0);
      L(c, [-12, -44, -6, -47], '#ff7a2a', 0.9); L(c, [12, -50, 6, -47], '#ff7a2a', 0.9); c.restore();
      for (const x of [-10, 10]) { rivet(c, x, -55, '#e8c25a'); rivet(c, x, -39, '#e8c25a'); }
      break;
    }
    case 'w_sever': { // Kol's blade: black steel, violet rune channel, hooked tip
      grip(c, -3, 8, '#1e1a24', '#5a3a6a');
      P(c, [-2, 8, 2, 8, 0, 11.4], '#c46aff', 0.8);
      plate(c, [-8, -3, 8, -3, 6, 0, -6, 0], '#2a2236', '#4a3a5a', '#120c18', 1);
      P(c, [-8, -3, -11.4, -7, -6, -3], '#2a2236', 0.9); P(c, [8, -3, 11.4, -7, 6, -3], '#2a2236', 0.9);
      plate(c, [-2.8, -3, 2.8, -3, 3.2, -46, 1, -52, 0, -60, -1.6, -50, -3.2, -46], '#2a2236', '#5a4a6a', '#0e0a14', 1.2);
      c.save(); glowOn(c, '#c46aff', 10); L(c, [0, -6, 0.6, -24, 0, -44], '#c46aff', 1); for (const y of [-14, -28, -40]) P(c, [-1.2, y, 0, y - 2, 1.2, y, 0, y + 2], '#e8c0ff', 0); c.restore();
      break;
    }
    default: { // w_rust: chipped and rusted
      plate(c, [-1.6, 5, 1.6, 5, 2.2, 7.6, 0, 9, -2.2, 7.6], '#6a5a3a', '#8a7a5a', '#3a2e1a', 1);
      grip(c, -2, 5, '#4a3424', '#2a1a10');
      plate(c, [-6, -3.6, 6, -3.6, 5, -1.6, -5, -1.6], '#7a6a5a', '#9a8a7a', '#4a3a2e', 1);
      const blade = [-1.9, -3.6, 1.9, -3.6, 2.1, -18, 1, -19.4, 2.1, -21, 2.1, -36, 0, -41, -2.1, -36, -2.1, -28, -1, -27, -2.1, -26];
      plate(c, blade, '#958a7f', '#c8bcae', '#5a5046', 1.2);
      for (const pp of [[-1.9, -14, 0, -15, 0.5, -11, -1.9, -10], [0.5, -30, 2, -31, 2, -27, 1, -27], [-1.9, -34, -0.4, -35, -0.4, -32]]) P(c, pp, '#8a4a24', 0);
      break;
    }
  }
}


// Glow colour and blade length per weapon, used for swing smears and effects.
const WEAPON_GLOW = { t_glaive: '#b6ff4a', t_maul: '#ff7a2a', w_sever: '#c46aff', w_rust: '#efe6d6', w_ion: '#5ad1e6', w_lance: '#fff27a', w_grav: '#b48cff', w_nova: '#ff9a3a', w_star: '#9ad8ff', sword: '#e8eef8', axe: '#ffb07a', staff: '#fff0b0', gun: '#ffd27a', void: '#c46aff' };
const WEAPON_LEN = { t_glaive: 88, t_maul: 58, w_sever: 60, w_rust: 41, w_ion: 54, w_lance: 82, w_grav: 51, w_nova: 55, w_star: 64, sword: 55, axe: 52, staff: 70, gun: 36 };


function torsoPath(c, f, br, k = 1) {
  c.beginPath();
  if (f) {
    c.moveTo(-8.4, -83 + br); c.lineTo(8.6, -84 + br);
    c.quadraticCurveTo(12, -83 + br, 12.6, -78 + br);
    c.quadraticCurveTo(14.2 + (k - 0.5) * 4, -72 + br, 12.2, -66 + br);
    c.quadraticCurveTo(8.4, -61, 6.6, -57);
    c.quadraticCurveTo(6.4, -54.4, 8, -52);
    c.lineTo(-6, -52); c.quadraticCurveTo(-7, -55, -6.4, -58); c.quadraticCurveTo(-8.6, -66, -9.4, -74 + br);
  } else {
    c.moveTo(-12, -83 + br); c.lineTo(13, -84 + br); c.lineTo(17, -71 + br); c.lineTo(12, -52); c.lineTo(-9, -52); c.lineTo(-14, -69 + br);
  }
  c.closePath();
}

// A bevelled plate: a lit sliver along its upper-left edge, a shadowed sliver along its lower-right edge, then the ink outline.
function plate(c, pts, base, lit, dk, lw = 1.3) {
  const sh = (dx, dy) => pts.map((v, i) => v + (i % 2 ? dy : dx));
  c.save(); P(c, pts, null, 0); c.clip();
  P(c, pts, dk || shade(base, -38), 0);
  P(c, sh(-0.7, -1.2), lit || shade(base, 42), 0);
  c.save(); P(c, sh(0.55, 0.95), null, 0); c.clip(); P(c, sh(-0.7, -1.2), base, 0); c.restore();
  c.restore();
  if (lw) P(c, pts, null, lw);
}
const rivet = (c, x, y, col) => { c.fillStyle = INK; c.fillRect(x - 0.9, y - 0.9, 1.8, 1.8); c.fillStyle = col; c.fillRect(x - 0.6, y - 0.75, 1.1, 1.1); };

// An armoured limb: padded undersuit, a bevelled plate over most of its length, and a lame at the top.
// Cloth armour gets wrapped sleeves instead.
function armLimb(c, x1, y1, x2, y2, w1, w2, A, front) {
  const base = front ? A.base : A.dark, lit = front ? A.light : A.base;
  const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy) || 1, nx = -dy / len, ny = dx / len;
  const at = (k, s) => { const w = (w1 + (w2 - w1) * k) * s; return [x1 + dx * k + nx * w, y1 + dy * k + ny * w, x1 + dx * k - nx * w, y1 + dy * k - ny * w]; };
  if (A.cloth) {
    limb(c, x1, y1, x2, y2, w1, w2, base, front ? lit : null);
    for (const k of [0.3, 0.55, 0.8]) { const p = at(k, 1); L(c, p, shade(base, -34), 0.7); }
    return;
  }
  if (A.style === 'void') {
    limb(c, x1, y1, x2, y2, w1 * 0.9, w2 * 0.9, base, front ? shade(base, 26) : null);
    const m0 = at(0.12, 0.25), m1 = at(0.9, 0.25);
    c.save(); glowOn(c, A.glow, 6); L(c, [m0[0], m0[1], m1[0], m1[1]], A.glow, 0.7); c.restore();
    return;
  }
  limb(c, x1, y1, x2, y2, w1 * 0.9, w2 * 0.9, front ? (A.under || '#2c2732') : shade(A.under || '#2c2732', -14));
  const seg = (k0, k1, s) => { const a = at(k0, s), b = at(k1, s); plate(c, [a[0], a[1], b[0], b[1], b[2], b[3], a[2], a[3]], base, lit); };
  if (A.style === 'chitin') {
    seg(0.06, 0.52, 1.1); seg(0.44, 0.94, 1.04);
    if (front) { const m = at(0.5, -1.1), n = at(0.62, -1.1); P(c, [m[2], m[3], n[2] + (n[2] - m[2]) * 0.4 - ny * 4, n[3] + (n[3] - m[3]) * 0.4 + nx * 4, n[2], n[3]], A.spike || lit, 0.8); }
    return;
  }
  seg(0.16, 0.9, A.style === 'jugg' ? 1.14 : 1.06);
  seg(0.02, 0.2, 0.98);
  if (A.style === 'jugg') seg(0.82, 0.98, 1.1);
  if (A.style === 'paladin' && front) { const g0 = at(0.2, 1), g1 = at(0.86, 1); L(c, [g0[0], g0[1], g1[0], g1[1]], A.rivet || '#e8c25a', 0.7); }
  const r0 = at(0.24, 0.3), r1 = at(0.84, 0.3);
  L(c, [r0[0], r0[1], r1[0], r1[1]], front ? shade(lit, 30) : lit, 0.7);
  if (A.seams && front) { const m = at(0.55, 0); c.save(); glowOn(c, A.glow, 8); L(c, [m[0] - 1, m[1] - 3, m[0] + 1, m[1], m[0] - 0.5, m[1] + 3], A.glow, 1); c.restore(); }
}
// Knee or elbow cop: a bevelled diamond with a side wing.
function cop(c, x, y, s, A, front) {
  const base = front ? A.light : A.base;
  plate(c, [x - 3.4 * s, y - 4.4 * s, x + 3.4 * s, y - 3.6 * s, x + 4.4 * s, y + 3.4 * s, x - 2.4 * s, y + 4.4 * s], base, shade(base, 30), shade(base, -40));
  if (front) P(c, [x - 3.4 * s, y - 1 * s, x - 6.4 * s, y + 1.4 * s, x - 2.6 * s, y + 3 * s], A.base, 0.9);
  if (A.rivet) rivet(c, x + 0.4 * s, y, A.rivet);
}

function foot(c, ax, ay, col, lit, s = 1) {
  if (s !== 1) { c.save(); c.translate(ax, ay); c.scale(s, s); foot(c, 0, 0, col, lit); c.restore(); return; }
  const pts = [ax - 4.4, ay - 2.4, ax + 3.6, ay - 2.4, ax + 10.6, ay + 3.4, ax + 10.6, ay + 5, ax - 4.4, ay + 5];
  plate(c, pts, col, lit || shade(col, 36), shade(col, -40));
  for (const k of [0, 1, 2]) L(c, [ax + 2.6 + k * 2.4, ay - 1.6 + k * 1.4, ax + 3.4 + k * 2.4, ay + 5], shade(col, -46), 0.6);
  plate(c, [ax - 4.8, ay - 4.6, ax + 2.4, ay - 4.6, ax + 3, ay - 1.4, ax - 4.8, ay - 1.4], shade(col, 12), lit || shade(col, 40), shade(col, -40), 1);
}

// Shoulder guard. back = the far shoulder, drawn in shadow.
function pauldron(c, x, y, A, back) {
  if (stylePauldron(c, x, y, A, back, performance.now())) return;
  const f = back ? A.dark : A.base, li = back ? A.base : A.light, dk = shade(f, -36);
  const kind = A.pauldron;
  if (kind === 'pad') {
    plate(c, [x - 6, y - 3, x + 5, y - 4.5, x + 8.4, y + 3, x + 5, y + 8, x - 5, y + 7, x - 8, y + 2], f, li, dk);
    c.save(); c.setLineDash([1.1, 1.1]); L(c, [x - 5, y + 2, x + 6, y + 1.5], shade(f, 40), 0.6); L(c, [x - 4, y + 5, x + 4.6, y + 5], shade(f, 40), 0.6); c.restore();
    return;
  }
  if (kind === 'layered') {
    for (let i = 2; i >= 0; i--) {
      const o = i * 4;
      plate(c, [x - 8, y - 2 + o, x - 2, y - 7 + o, x + 8, y - 6 + o, x + 11, y + 1 + o, x + 7, y + 5 + o, x - 7, y + 4 + o], i ? f : li, i ? li : shade(li, 26), dk);
      L(c, [x - 7, y + 4 + o, x + 7, y + 5 + o, x + 11, y + 1 + o], A.glow || A.trim, 1);
    }
    if (A.rivet) { rivet(c, x - 4, y - 2.2, A.rivet); rivet(c, x + 5, y - 2.2, A.rivet); }
    return;
  }
  if (kind === 'spiky') {
    const sp = A.spike || li;
    plate(c, [x - 5, y - 4, x - 4, y - 15, x, y - 5], sp, shade(sp, 30), shade(sp, -40));
    plate(c, [x + 1, y - 6, x + 5, y - 17, x + 6.4, y - 5], sp, shade(sp, 30), shade(sp, -40));
  }
  plate(c, [x - 8, y - 1, x - 3, y - 6.4, x + 6, y - 6.6, x + 10.4, y + 1, x + 9, y + 9, x - 6, y + 8], f, li, dk);
  plate(c, [x - 6, y + 5.4, x + 9.4, y + 6.4, x + 9, y + 9, x - 6, y + 8], shade(f, -8), li, dk, 1);
  L(c, [x - 6, y + 8, x + 9, y + 9], A.glow || A.trim, 1.2);
  if (A.rivet || A.motif === 'rivet') { const rc = A.rivet || shade(f, 50); rivet(c, x - 3, y - 2, rc); rivet(c, x + 5, y - 2.6, rc); }
  if (A.motif === 'ridge') { c.strokeStyle = shade(f, 34); c.lineWidth = 0.8; c.beginPath(); c.moveTo(x - 5, y); c.quadraticCurveTo(x + 2, y - 4, x + 8, y + 1); c.stroke(); }
}

// Per-set surface detail on the breastplate.
function chestMotif(c, A, f, br, t) {
  const m = A.motif;
  if (m === 'stitch') {
    c.save(); c.setLineDash([1.2, 1.1]);
    for (const yy of [-78, -70, -62]) L(c, [-10, yy + br * 0.5, 12, yy - 1 + br * 0.5], shade(A.base, 34), 0.6);
    c.restore();
  }
  if (m === 'rivet') for (const [x, y] of [[-9, -80], [9, -80.6], [-8, -64], [10, -64.6]]) rivet(c, x * (f ? 0.75 : 1), y + br, shade(A.base, 55));
  if (m === 'ridge') {
    c.strokeStyle = shade(A.base, 36); c.lineWidth = 0.9;
    for (let i = 0; i < 3; i++) { c.beginPath(); c.moveTo(-9 + i, -78 + i * 6 + br); c.quadraticCurveTo(2, -82 + i * 6 + br, 12 - i, -77 + i * 6 + br); c.stroke(); }
  }
  if (m === 'filigree') {
    const sc = f ? 0.7 : 1;
    L(c, [2 - 8 * sc, -81 + br, 2, -76 + br, 2 + 8 * sc, -81 + br], A.rivet || '#e8c25a', 0.9);
    P(c, [2, -79 + br, 3.6, -76.6 + br, 2, -74.2 + br, 0.4, -76.6 + br], A.trim, 0.6);
  }
  if (m === 'rune') {
    c.save(); glowOn(c, A.glow, 8); c.strokeStyle = A.glow; c.lineWidth = 0.8;
    c.globalAlpha = 0.6 + 0.4 * Math.sin(t * 0.004);
    L(c, [-4, -76 + br, -1, -80 + br, 2, -76 + br, 5, -80 + br], A.glow, 0.8); L(c, [-2, -72 + br, 4, -72 + br], A.glow, 0.8);
    c.restore();
  }
}

// Full knight. Origin at the feet, facing right, about 110 units tall.
// o: { armor, weapon, look, acc, flip, pose: { arm, lean, crouch, walk, smear, smearT, aura } }
function drawKnight(c, x, y, s, o, t) {
  const A = o.armor, look = { ...DEFAULT_LOOK, ...(o.look || {}) }, wpn = o.weapon, f = look.build === 'f';
  const ps = o.pose || {};
  const arm = ps.arm ?? (o.swing > 0 ? Math.sin((1 - o.swing) * Math.PI) * 1.5 : 0);
  const lean = ps.lean || 0, cr = clamp(ps.crouch || 0, 0, 1), wk = ps.walk != null ? Math.sin(ps.walk) * 7 : 0;
  c.save(); c.translate(x, y); c.scale(o.flip ? -s : s, s);
  c.lineJoin = 'round'; c.lineCap = 'round';
  const br = Math.sin(t * 0.004) * 1.1 + (ps.walk != null ? Math.abs(Math.cos(ps.walk)) * -1.6 : 0), wv = Math.sin(t * 0.003) * 3;
  const hipY = -46 + cr * 14, lw = (f ? 0.68 : 1) * (A.style === 'jugg' ? 1.2 : A.style === 'void' ? 0.88 : 1);
  const upper = fn => { c.save(); c.translate(0, hipY); c.rotate(lean); c.translate(0, 46); fn(); c.restore(); };
  const tab = A.tabard || null, sword = !['w_lance', 'staff', 'gun', 'axe', 't_glaive', 't_maul'].includes(wpn);
  upper(() => styleBack(c, A, br, t));

  if (ps.aura) {
    const g = c.createRadialGradient(0, -60, 4, 0, -60, 70); g.addColorStop(0, ps.aura); g.addColorStop(1, 'rgba(0,0,0,0)');
    c.save(); c.globalAlpha = 0.45 + 0.15 * Math.sin(t * 0.02); c.fillStyle = g; c.fillRect(-70, -130, 140, 140); c.restore();
  }

  // cape (outer cloth with a darker lining showing at the turn) and scarf
  upper(() => {
    if (A.cape && A.style === 'void') {
      // a mantle split into ribbons that drift behind
      const flow = -lean * 30 - (ps.walk != null ? 6 : 0);
      for (let i = 0; i < 4; i++) {
        const x0 = -9 + i * 4, sway = Math.sin(t * 0.0025 + i) * 4 + flow, end = -2 - hipY - 46 - (i % 2) * 8;
        P(c, [x0 - 2, -82 + br, x0 + 2, -82 + br, x0 - 8 + sway * 0.6, -50, x0 - 14 + sway, end, x0 - 18 + sway, end - 3, x0 - 12 + sway * 0.6, -50], i % 2 ? A.cape : shade(A.cape, 14), 1);
        c.save(); glowOn(c, A.glow, 6); L(c, [x0 + 2, -82 + br, x0 - 8 + sway * 0.6, -50, x0 - 14 + sway, end], A.glow, 0.6); c.restore();
      }
    } else if (A.cape) {
      const end = A.capeLong ? -1 - hipY - 46 : -16 - hipY - 46, flow = -lean * 30 - (ps.walk != null ? 6 : 0);
      const capePts = [-10, -82 + br, 6, -83 + br, -3, -60, -12 + wv * 0.3 + flow * 0.4, end - 2, -18 + wv + flow, end + 3, -24 + wv + flow, end - 2, -30 + wv * 1.2 + flow, end + 2, -28 + wv + flow * 0.6, -40, -19, -70];
      P(c, capePts, A.cape);
      c.save(); P(c, capePts, null, 0); c.clip();
      P(c, [-20, -70, -30 + wv * 1.2 + flow, end + 4, -24 + wv + flow, end + 4, -14, -64], shade(A.cape, -30), 0);
      P(c, [-6, -80 + br, 4, -82 + br, -4, -60, -10, -66], shade(A.cape, 18), 0);
      c.restore();
      L(c, [-13, -72, -21 + wv * 0.7 + flow, end + 1], shade(A.cape, -40), 1.1);
      L(c, [-7, -74, -13 + wv * 0.4 + flow * 0.5, end], shade(A.cape, 28), 0.8);
      L(c, [-12 + wv * 0.3 + flow * 0.4, end - 2, -18 + wv + flow, end + 3, -24 + wv + flow, end - 2, -30 + wv * 1.2 + flow, end + 2], A.trim, 0.9);
      P(c, [-10, -82 + br, 6, -83 + br, 1, -77, -8, -76.4], shade(A.cape, -45), 0);
    }
    if (A.scarf) {
      P(c, [-7, -86 + br, 3, -86 + br, -3, -80 + br, -18 + wv, -72, -21 + wv, -74, -14 + wv * 0.5, -79], A.scarf);
      L(c, [-6, -83 + br, -17 + wv, -74], shade(A.scarf, -30), 0.8);
    }
  });
  if (o.acc === 'x_boots') {
    glowOn(c, '#5ad1e6', 10);
    for (const fx of [-18 - wk, 10 + wk]) { const fl = 6 + Math.random() * 5; P(c, [fx - 2, -2, fx + 3, -2, fx, fl], '#9fefff', 0); }
    glowOff(c);
  }

  // back arm
  upper(() => {
    const sw = ps.walk != null ? -wk * 0.5 : 0, bs = f ? 2 : 0;
    armLimb(c, -9 + bs, -77 + br, -15 + bs + sw, -62 + br, 4.2 * lw, 3.6 * lw, A, false);
    armLimb(c, -15 + bs + sw, -62 + br, -11 + bs + sw * 1.4, -50 + br, 3.6 * lw, 3.2 * lw, A, false);
    cop(c, -15 + bs + sw, -62 + br, 0.7 * (f ? 0.8 : 1), A, false);
    c.save(); c.translate(bs, 0); if (f) { c.translate(-11, -50 + br); c.scale(0.75, 0.75); c.translate(11, 50 - br); }
    plate(c, [-14 + sw * 1.4, -53 + br, -8 + sw * 1.4, -53 + br, -7.6 + sw * 1.4, -47 + br, -13 + sw * 1.4, -46.4 + br], shade(A.dark, -10), A.base, shade(A.dark, -40)); c.restore();
    c.save(); if (f) { c.translate(-8, -82 + br); c.scale(0.72, 0.72); c.translate(10, 80 - br); } pauldron(c, -10, -80 + br, A, true); c.restore();
  });

  // scabbard on the far hip, behind the back leg
  if (sword) upper(() => {
    P(c, [-5, -47, -2, -45.4, -20, -21, -23.4, -23.2], '#3a2a22');
    L(c, [-4.6, -46, -21.6, -22.4], '#5a4434', 0.7);
    for (const k of [0.2, 0.55]) { const x0 = -5 + (-18) * k, y0 = -46 + 24 * k; P(c, [x0 - 1.6, y0 - 1.4, x0 + 1.8, y0 + 0.6, x0 + 0.8, y0 + 2.2, x0 - 2.6, y0], A.trim, 0.8); }
    P(c, [-20, -21, -23.4, -23.2, -25, -19.4], '#c9ccd6', 0.9);
  });

  // back leg: the foot stays planted while the knee bends
  const bkx = (f ? -9 : -11) - cr * 2 - wk * 0.6, bky = -25 + cr * 17, bfx = (f ? -13.5 : -15) - wk, fs = f ? 0.8 : 1;
  armLimb(c, f ? -4.6 : -4, hipY, bkx, bky, 6 * lw, 5 * lw, A, false);
  armLimb(c, bkx, bky, bfx, -5, 5 * lw, 3.8 * lw, A, false);
  cop(c, bkx, bky, fs * 0.9, A, false);
  foot(c, bfx, -5, shade(A.dark, -12), A.base, fs);

  // torso
  upper(() => {
    const k = look.bust ?? 0.5, special = ['chitin', 'void', 'jugg'].includes(A.style);
    if (A.style === 'jugg') { c.translate(1, 0); c.scale(1.14, 1); c.translate(-1, 0); }
    // padded undersuit at the neck
    P(c, [-6, -86 + br, 7, -86 + br, 8, -82 + br, -7, -82 + br], A.cloth ? A.base : shade(A.under || '#2c2732', 10), 1);
    torsoPath(c, f, br, k); c.fillStyle = A.base; c.fill();
    c.save(); torsoPath(c, f, br, k); c.clip();
    P(c, [-14, -86 + br, -2, -86 + br, -3, -50, -14, -50], A.dark, 0);
    if (special) { /* drawn below, outside the clip */ }
    else if (!A.cloth && !f) {
      // breastplate and an overlapping plackart
      plate(c, [-13, -84 + br, 14, -85 + br, 18, -71 + br, 15, -62 + br, -13, -62 + br, -15, -69 + br], A.base, A.light, A.dark, 0);
      P(c, [-14, -86 + br, -2, -86 + br, -3, -60, -14, -60], 'rgba(0,0,0,0.28)', 0);
      P(c, [5, -82 + br, 13, -83 + br, 16, -71 + br, 9, -67 + br], A.light, 0);
      L(c, [12, -81 + br, 15, -73 + br], 'rgba(255,255,255,0.7)', 0.8);
      plate(c, [-11, -64 + br, 14, -65 + br, 13, -52, -9, -52], shade(A.base, -10), A.light, A.dark);
      P(c, [-11, -64 + br, -1, -64.4 + br, -2, -52, -9, -52], 'rgba(0,0,0,0.25)', 0);
      L(c, [-10, -58, 13, -58.6], A.trim, 0.9);
    } else if (!A.cloth && f && A.style !== 'munition') {
      plate(c, [-9, -84 + br, 9, -85 + br, 13.4, -77 + br, 13, -66 + br, -9.6, -66 + br, -10, -74 + br], A.base, A.light, A.dark, 0);
      P(c, [-9, -84 + br, -1, -84 + br, -2, -62, -10, -62], 'rgba(0,0,0,0.26)', 0);
      P(c, [4, -82 + br, 11, -83 + br, 13.6, -72 + br, 8.6, -69 + br], A.light, 0);
      L(c, [10.4, -80 + br, 12.4, -74 + br], 'rgba(255,255,255,0.65)', 0.8);
      // laced corset section at the waist
      plate(c, [-7.6, -66 + br, 9.6, -66 + br, 7, -57, 8, -52, -6, -52, -6.6, -58], shade(A.base, -14), A.base, A.dark);
      for (let i = 0; i < 4; i++) L(c, [-0.4, -64 + i * 3, 2.6, -62.6 + i * 3, -0.4, -61.2 + i * 3], A.trim, 0.6);
    } else if (!A.cloth) {
      plate(c, [-9, -84 + br, 9, -85 + br, 13.4, -77 + br, 12.4, -60, -9.6, -60, -10, -74 + br], A.base, A.light, A.dark, 0);
      P(c, [-9, -84 + br, -1, -84 + br, -2, -60, -10, -60], 'rgba(0,0,0,0.26)', 0);
    } else {
      for (const yy of [-76, -68, -60]) L(c, [-12, yy + br * 0.5, 14, yy - 1 + br * 0.5], shade(A.base, -30), 0.7);
      P(c, [4, -74 + br, 9, -74 + br, 9, -68 + br, 4, -68 + br], shade(A.base, -16), 0.7);
    }
    c.restore();
    torsoPath(c, f, br, k); c.lineWidth = 1.3; c.strokeStyle = INK; c.stroke();
    if (special) styleTorso(c, A, f, br, t);
    if (A.cloth) P(c, [-12, -80 + br, -8, -82 + br, 15, -57, 11, -54], A.trim, 1);
    else if (!special) L(c, f ? [2, -84 + br, 2.6, -66 + br] : [3, -84 + br, 2.4, -64 + br], A.dark, 0.9);
    chestMotif(c, A, f, br, t);
    if (A.seams) { glowOn(c, A.glow, 10); L(c, [-6, -78 + br, -1, -72 + br, -4, -64, 2, -58], A.glow, 1.4); L(c, [8, -80 + br, 11, -70 + br, 7, -62], A.glow, 1.2); glowOff(c); }
    if (A.stars) { c.fillStyle = A.glow; for (const [sx, sy, ph] of [[-6, -76, 0], [8, -72, 2], [0, -62, 4], [-4, -66, 1]]) { c.globalAlpha = 0.4 + 0.6 * Math.abs(Math.sin(t * 0.002 + ph)); c.fillRect(sx * (f ? 0.75 : 1), sy + br, 1.4, 1.4); } c.globalAlpha = 1; }
    // the Order's star sits on the chest, or on the belt buckle for the slender build
    if (A.sigil) { const pts = [], sy = f ? -55.5 : -73 + br; for (let i = 0; i < 16; i++) { const r = i % 2 ? 1.6 : 4.2, an = -Math.PI / 2 + i * Math.PI / 8; pts.push(1 + Math.cos(an) * r, sy + Math.sin(an) * r); } P(c, pts, A.sigil, 0.7); }
    if (o.acc === 'x_core') { glowOn(c, '#5ad1e6', 12); P(c, [2, -74 + br, 5.4, -72 + br, 5.4, -68 + br, 2, -66 + br, -1.4, -68 + br, -1.4, -72 + br], '#5ad1e6', 1); glowOff(c); }
    if (o.acc === 't_core') { const cy = -71 + br; glowOn(c, '#4ad0ff', 10); const hx6 = []; for (let i = 0; i < 6; i++) { const an = Math.PI / 6 + i * Math.PI / 3; hx6.push(2 + Math.cos(an) * 4.4, cy + Math.sin(an) * 4.4); } P(c, hx6, '#1e3a5a', 1); P(c, [2, cy - 2.4, 4, cy, 2, cy + 2.4, 0, cy], '#9ae8ff', 0); glowOff(c); }
    if (o.acc === 'x_seal') { const cy = -73 + br; c.beginPath(); c.arc(-4, cy, 3.4, 0, Math.PI * 2); c.fillStyle = '#e8c25a'; c.fill(); c.strokeStyle = INK; c.lineWidth = 0.9; c.stroke(); c.beginPath(); c.arc(-4, cy, 1.6, 0, Math.PI * 2); c.fillStyle = '#3a6aff'; c.fill(); L(c, [-4, cy - 3.4, -2, -82 + br], '#3a6aff', 0.8); }
    if (o.acc === 'x_sigil') { const pts = []; for (let i = 0; i < 10; i++) { const r = i % 2 ? 2 : 4.6, an = -Math.PI / 2 + i * Math.PI / 5; pts.push(2 + Math.cos(an) * r, -70 + br + Math.sin(an) * r); } P(c, pts, '#e8c25a', 0.9); }

    // waist: mail, belt, buckle, pouches
    const wR = f ? 8.4 : 12, wL = f ? -6 : -9;
    P(c, [wL, -53, wR, -53, wR - 1, -46, wL + 1, -46], A.cloth ? shade(A.base, -20) : A.dark);
    if (!A.cloth) for (let mx = wL + 1.4; mx < wR - 1.4; mx += 2.2) for (const my of [-51.6, -49.6]) L(c, [mx, my, mx + 1.1, my + 1, mx + 2.2, my], shade(A.dark, 30), 0.5);
    plate(c, [wL - 0.6, -48.6, wR + 0.6, -48.6, wR + 0.6, -44.2, wL - 0.6, -44.2], A.trim, shade(A.trim, 40), shade(A.trim, -40), 1);
    if (o.acc === 't_lantern') {
      const lx = wL - 3, ly = -37 + Math.sin(t * 0.003) * 0.8;
      L(c, [wL, -45, lx, ly - 5], '#2a2016', 0.8);
      plate(c, [lx - 3, ly - 5, lx + 3, ly - 5, lx + 3.6, ly + 3, lx - 3.6, ly + 3], '#4a3a24', '#6a5a3a', '#2a1e12', 0.9);
      glowOn(c, '#9affee', 10); P(c, [lx, ly - 3.6, lx + 1.8, ly, lx, ly + 2.2, lx - 1.8, ly], '#dafff8', 0); glowOff(c);
    }
    if (o.acc === 'x_heart') { glowOn(c, '#ff3a5a', 6 + 6 * Math.abs(Math.sin(t * 0.004))); P(c, [3, -50, 6, -46.4, 3, -42.6, 0, -46.4], '#ff3a5a', 1); glowOff(c); }
    else if (!(A.sigil && f)) { plate(c, [1, -49.4, 5, -49.4, 5, -43.4, 1, -43.4], '#e8c25a', '#fff2b8', '#8a6a2a', 1); P(c, [2.2, -48, 3.8, -48, 3.8, -44.8, 2.2, -44.8], INK, 0); }
    plate(c, [wL - 1.6, -47.6, wL + 2.6, -47.6, wL + 2.4, -41, wL - 1.4, -41.2], '#5a3e2a', '#7a5a3e', '#2e2016', 1);
    L(c, [wL - 1.4, -45.2, wL + 2.5, -45.2], '#2e2016', 0.6);
    plate(c, [wR - 2.6, -47.6, wR + 1, -47.6, wR + 1.2, -42.6, wR - 2.4, -42.4], '#5a3e2a', '#7a5a3e', '#2e2016', 0.9);

    // tassets; the slender build adds a longer cloth skirt underneath
    if (styleSkirt(c, A, f, wv)) { /* tier-specific skirt */ }
    else if (f) {
      if (tab) P(c, [-11, -44.4, 11, -44.4, 16.6, -30.6 + wv * 0.1, -14.6, -30.6], tab);
      plate(c, [-7.4, -44.4, 1, -44.4, 0, -33, -13, -34.6], A.base, A.light, A.dark);
      plate(c, [1.6, -44.4, 9.6, -44.4, 15, -34.6, 2.4, -33], A.cloth ? A.base : A.light, shade(A.light, 26), A.base);
      L(c, [-12.4, -35.4, -0.4, -33.8], A.trim, 0.9); L(c, [2.8, -33.8, 14.4, -35.4], A.trim, 0.9);
    } else {
      plate(c, [-9, -44.4, 0.6, -44.4, -0.4, -35, -10.4, -37], A.base, A.light, A.dark);
      plate(c, [1.6, -44.4, 12.6, -44.4, 14, -36.4, 3, -34.8], A.cloth ? A.base : A.light, shade(A.light, 26), A.base);
      if (!A.cloth) { L(c, [-9.4, -40, 0.2, -39.6], A.dark, 0.7); L(c, [2.2, -39.6, 13.2, -40.4], A.base, 0.7); }
    }
  });

  // front leg
  const fkx = (f ? 9 : 11) + cr * 9 + wk * 0.6, fky = -25 + cr * 8, ffx = (f ? 12 : 13) + wk;
  armLimb(c, f ? 5.6 : 5, hipY, fkx, fky, 6.4 * lw, 5.2 * lw, A, true);
  armLimb(c, fkx, fky, ffx, -5, 5.2 * lw, 4 * lw, A, true);
  cop(c, fkx, fky, fs, A, true);
  foot(c, ffx, -5, A.base, A.light, fs * (A.style === 'jugg' ? 1.15 : 1));
  if (A.style === 'chitin') for (const k of [0, 1]) P(c, [ffx + 8 * fs, -2 + k * 3, ffx + 13.6 * fs, k * 3 - 0.4, ffx + 8.4 * fs, 0.6 + k * 3], A.spike || A.light, 0.8);

  // tabard hanging from the belt, over the legs
  if (tab && !f) upper(() => {
    const tl = A.style === 'paladin' ? 10 : 0;
    const tp = [-2.4, -44.2, 6.4, -44.2, 7.6 + wv * 0.2, -27 + tl, 4.6 + wv * 0.2, -24.6 + tl, 2 + wv * 0.15, -27 + tl, -0.6 + wv * 0.1, -24.6 + tl, -3.4 + wv * 0.1, -27 + tl];
    P(c, tp, tab);
    c.save(); P(c, tp, null, 0); c.clip(); P(c, [-4, -44, 1.4, -44, 0 + wv * 0.1, -22, -4, -22], shade(tab, -26), 0); c.restore();
    L(c, [7.4 + wv * 0.2, -28 + tl, 4.6 + wv * 0.2, -25.6 + tl, 2 + wv * 0.15, -28 + tl, -0.6 + wv * 0.1, -25.6 + tl, -3.2 + wv * 0.1, -28 + tl], A.rivet || A.trim, 0.8);
    const em = A.sigil || A.trim;
    P(c, [2, -40, 4.2, -37, 2, -34, -0.2, -37], em, 0.8);
  });

  // head, gorget, weapon arm, front pauldron
  upper(() => {
    c.save(); c.translate(f ? 1.6 : 2, (f ? -98.5 : -96.5) + br); if (f) c.scale(0.94, 0.94); drawHead(c, look, A, o.acc, t); c.restore();
    if (!A.cloth) {
      plate(c, [-7, -86.6 + br, 8.4, -87.2 + br, 10.4, -82 + br, -8, -81.4 + br], A.base, A.light, A.dark, 1.1);
      L(c, [-7.4, -84 + br, 9.4, -84.4 + br], A.dark, 0.6);
    }
    const gun = wpn === 'gun', base = gun ? Math.PI / 2 : wpn === 'w_lance' ? 0.9 : wpn === 'staff' ? 0.15 : 0.35;
    const sx = f ? 10.6 : 13, sy = -77 + br;
    const rot = (px, py, a) => { const dx = px - sx, dy = py - sy, ca = Math.cos(a), sa = Math.sin(a); return [sx + dx * ca - dy * sa, sy + dx * sa + dy * ca]; };
    const hand0 = [(gun ? 26 : 27) - (f ? 3 : 0), (gun ? -60 : -55) + br];
    const [ex, ey] = rot(f ? 17 : 20, -63 + br, arm), [hx, hy] = rot(hand0[0], hand0[1], arm);
    // swing smear: the band the blade swept through since the swing began
    if (ps.smear != null && (ps.smearT ?? 1) > 0 && !gun) {
      const len = WEAPON_LEN[wpn] || 50, a0 = ps.smear, a1 = arm, n = 10, outer = [], inner = [];
      for (let i = 0; i <= n; i++) {
        const a = a0 + (a1 - a0) * i / n, [px, py] = rot(hand0[0], hand0[1], a), th = base + a;
        outer.push(px + Math.sin(th) * len * 1.05, py - Math.cos(th) * len * 1.05);
        inner.unshift(px + Math.sin(th) * len * 0.35, py - Math.cos(th) * len * 0.35);
      }
      c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.6 * (ps.smearT ?? 1);
      glowOn(c, WEAPON_GLOW[wpn] || '#ffffff', 14);
      P(c, [...outer, ...inner], WEAPON_GLOW[wpn] || '#ffffff', 0);
      c.globalAlpha = 0.9 * (ps.smearT ?? 1); L(c, outer, '#ffffff', 2);
      c.restore();
    }
    c.save(); c.translate(hx, hy); c.rotate(base + arm); drawWeapon(c, wpn, A, t); c.restore();
    armLimb(c, sx, sy, ex, ey, 4.4 * lw, 3.8 * lw, A, true);
    armLimb(c, ex, ey, hx, hy, 3.8 * lw, 3.4 * lw, A, true);
    cop(c, ex, ey, 0.75 * (f ? 0.85 : 1), A, true);
    // gauntlet with knuckle plates over the grip
    const gs = f ? 0.85 : 1;
    plate(c, [hx - 3.6 * gs, hy - 3.6 * gs, hx + 3.4 * gs, hy - 3.8 * gs, hx + 4 * gs, hy + 3 * gs, hx - 3 * gs, hy + 3.4 * gs], A.cloth ? shade(A.base, -20) : A.light, shade(A.light, 30), A.base);
    for (const k of [-1.6, 0.4, 2.4]) L(c, [hx + k * gs, hy - 3.4 * gs, hx + (k + 0.4) * gs, hy + 3 * gs], A.cloth ? shade(A.base, -50) : A.dark, 0.6);
    if (A.style === 'jugg') for (const k of [-2, 0.6]) P(c, [hx + 3.6, hy + k - 1, hx + 7.4, hy + k, hx + 3.6, hy + k + 1.2], A.spike || A.light, 0.7);
    c.save(); if (f) { c.translate(9.4, -83 + br); c.scale(0.72, 0.72); c.translate(-12, 80 - br); } pauldron(c, 12, -80 + br, A, false); c.restore();
    if (A.style === 'void') voidShards(c, A, br, t, true);
    // cape clasp
    if (A.cape && A.style !== 'void') { const cx = f ? 4.6 : 6, cy = -82.6 + br; P(c, [cx - 2, cy, cx, cy - 2, cx + 2, cy, cx, cy + 2], '#e8c25a', 0.8); c.fillStyle = A.trim; c.fillRect(cx - 0.6, cy - 0.6, 1.2, 1.2); }
    if (o.acc === 'x_last') {
      const oy = -106 + Math.sin(t * 0.003) * 3, fl = Math.sin(t * 0.02) * 1.2;
      glowOn(c, '#7affe8', 14); P(c, [-22, oy - 7 - fl, -18.8, oy, -22, oy + 3, -25.2, oy], '#7affe8', 0); P(c, [-22, oy - 3 - fl * 0.5, -20.6, oy, -22, oy + 1.6, -23.4, oy], '#ffffff', 0); glowOff(c);
    }
    if (o.acc === 'x_lens') {
      const oy = -104 + Math.sin(t * 0.003) * 3;
      glowOn(c, '#9ad8ff', 12); P(c, [-22, oy - 5, -18.6, oy, -22, oy + 5, -25.4, oy], '#9ad8ff', 1); glowOff(c);
      P(c, [-22, oy - 5, -18.6, oy, -22, oy], '#e8f8ff', 0);
    }
  });
  c.restore();
}

/* ---------- Armour styles: each armour tier has its own silhouette, not just its own colours ----------
   cloth: quilted tunic and wraps · munition: soldier's plate over mail · chitin: insect shell
   paladin: full plate with heraldry · jugg: hulking forged plate · void: bodysuit with floating plates */

// Behind the body: halo and far shards (void), exhaust vents with smoke (jugg).
function styleBack(c, A, br, t) {
  const st = A.style;
  if (st === 'void') {
    c.save(); glowOn(c, A.glow, 12);
    c.strokeStyle = A.glow; c.lineWidth = 1.6; c.globalAlpha = 0.85;
    c.beginPath(); c.ellipse(-2, -104 + br, 15, 5, -0.25, 0, Math.PI * 2); c.stroke();
    c.lineWidth = 0.7; c.globalAlpha = 0.5; c.beginPath(); c.ellipse(-2, -104 + br, 19, 6.6, -0.25, 0, Math.PI * 2); c.stroke();
    c.restore();
    voidShards(c, A, br, t, false);
  }
  if (st === 'jugg') {
    for (const [x0, x1, top] of [[-9, -13, -100], [-3, -6, -103]]) {
      plate(c, [x0 - 2.4, -82 + br, x0 + 2.4, -82 + br, x1 + 2.2, top + br, x1 - 2.2, top + br], '#2a2220', '#4a3c38', '#120c0a', 1.1);
      P(c, [x1 - 2.8, top - 1 + br, x1 + 2.8, top - 1 + br, x1 + 2.4, top + 2 + br, x1 - 2.4, top + 2 + br], '#4a3c38', 1);
      c.save(); glowOn(c, A.glow, 8); c.fillStyle = A.glow; c.fillRect(x1 - 1.6, top - 0.6 + br, 3.2, 1.2); c.restore();
      for (let i = 0; i < 3; i++) {
        const k = ((t * 0.0006 + i / 3 + (x0 + 9) * 0.07) % 1), r = 2 + k * 5;
        c.save(); c.globalAlpha = 0.45 * (1 - k); c.fillStyle = '#6a605c';
        c.beginPath(); c.arc(x1 - k * 6, top - 3 - k * 22 + br, r, 0, Math.PI * 2); c.fill(); c.restore();
      }
    }
  }
}
// Shards orbiting a void-armoured knight; the half of the orbit nearer the viewer is drawn after the body.
function voidShards(c, A, br, t, front) {
  for (let i = 0; i < 3; i++) {
    const a = t * 0.0012 + i * 2.1, near = Math.sin(a) > 0;
    if (near !== front) continue;
    const x = Math.cos(a) * 24, y = -66 + br + Math.sin(a * 2) * 6 + i * 6, s = near ? 1 : 0.75;
    c.save(); glowOn(c, A.glow, 10);
    P(c, [x, y - 4 * s, x + 2.2 * s, y, x, y + 4 * s, x - 2.2 * s, y], near ? shade(A.base, 50) : A.base, 0.9);
    c.restore();
  }
}

// Torso per style. Called inside the upper-body transform; return false to fall back to the plate torso.
function styleTorso(c, A, f, br, t) {
  const st = A.style;
  if (st === 'chitin') {
    // overlapping shell segments, lit on their upper edge, with spines down the back
    for (let i = 0; i < 4; i++) {
      const y0 = -84 + i * 8 + br * (1 - i * 0.25), y1 = y0 + 10, w0 = f ? 9 : 13 - i * 0.6, w1 = f ? 8 : 12.4 - i * 0.6;
      plate(c, [-w0 - 1, y0 + 1, -2, y0 - 2, w0 + 3, y0, w1 + 3, y1, -2, y1 + 2, -w1 - 1, y1], i % 2 ? A.base : shade(A.base, -8), A.light, A.dark, 1.1);
      L(c, [-w0 + 2, y0 + 2, -2, y0 - 0.6, w0, y0 + 1.4], shade(A.light, 30), 0.7);
    }
    for (let i = 0; i < 4; i++) P(c, [-12 + i * 0.5, -80 + i * 7 + br, -17 + i * 0.5, -78 + i * 7 + br, -12 + i * 0.5, -75 + i * 7 + br], A.spike || A.light, 0.8);
    return true;
  }
  if (st === 'void') {
    // a dark bodysuit traced with glowing lines, and a chest plate floating just off the body
    c.save(); glowOn(c, A.glow, 8);
    L(c, [-6, -82 + br, -3, -70 + br, -5, -58], A.glow, 0.8); L(c, [8, -82 + br, 6, -66 + br, 7, -56], A.glow, 0.8);
    c.restore();
    const fl = Math.sin(t * 0.003) * 0.8, pts = f ? [-6, -82, 8, -83, 11.4, -73, 9, -66, -6, -66] : [-9, -83, 12, -84, 15.4, -72, 12, -63, -9, -63];
    const pp = pts.map((v, i) => v + (i % 2 ? -1.6 + br + fl : 1.6));
    c.save(); glowOn(c, A.glow, 10); P(c, pp, null, 0); c.strokeStyle = A.glow; c.lineWidth = 1.4; c.stroke(); c.restore();
    plate(c, pp, A.light, shade(A.light, 40), A.base);
    P(c, [pp[0] + 4, pp[1] + 3, pp[2] - 3, pp[3] + 3, pp[4] - 4, pp[5] + 4], shade(A.light, 50), 0);
    return true;
  }
  if (st === 'jugg') {
    plate(c, [-14, -85 + br, 15, -86 + br, 19, -72 + br, 16, -58, -12, -58, -16, -70 + br], A.base, A.light, A.dark, 1.4);
    plate(c, [-12, -60, 15, -60, 14, -51, -10, -51], shade(A.base, -10), A.light, A.dark);
    const pulse = 0.7 + 0.3 * Math.sin(t * 0.005);
    c.save(); glowOn(c, A.glow, 14 * pulse);
    P(c, [2, -78 + br, 7, -74 + br, 7, -67 + br, 2, -63 + br, -3, -67 + br, -3, -74 + br], '#2a0e06', 1.2);
    P(c, [2, -76 + br, 5.4, -73 + br, 5.4, -68 + br, 2, -65 + br, -1.4, -68 + br, -1.4, -73 + br], A.glow, 0);
    P(c, [2, -74 + br, 3.6, -72 + br, 3.6, -69 + br, 2, -67 + br, 0.4, -69 + br, 0.4, -72 + br], '#fff2c0', 0);
    c.restore();
    for (const x of [-9, 12]) for (const y of [-80, -64]) rivet(c, x, y + br, shade(A.base, 50));
    return true;
  }
  return false;
}

// Below the belt per style. Return false to fall back to plain tassets.
function styleSkirt(c, A, f, wv) {
  const st = A.style;
  if (st === 'cloth') {
    // a long quilted tunic with a ragged hem
    const hem = [-11, -44.4, 13, -44.4, 15 + wv * 0.15, -28, 11, -26, 8, -29, 4, -25.6, 0, -29, -4, -26, -8, -29, -12.6 + wv * 0.1, -27];
    P(c, hem, A.base);
    c.save(); P(c, hem, null, 0); c.clip(); P(c, [-12, -44, -2, -44, -3, -24, -13, -24], shade(A.base, -26), 0);
    c.setLineDash([1.2, 1.2]); for (const y of [-40, -34]) L(c, [-11, y, 14, y], shade(A.base, 36), 0.6); c.restore();
    P(c, [3, -40, 8, -40, 8, -35, 3, -35], shade(A.base, -18), 0.8);
    return true;
  }
  if (st === 'munition') {
    // a hauberk skirt of mail under two short tassets
    const mail = [-11, -45, 14, -45, 15.4, -30, -12.6, -30];
    P(c, mail, '#6c7280');
    c.save(); P(c, mail, null, 0); c.clip();
    for (let y = -44; y < -30; y += 1.8) for (let x = -12; x < 16; x += 2) { c.strokeStyle = (Math.round((x + y) / 2) % 2) ? '#9aa0ac' : '#4a505c'; c.lineWidth = 0.6; c.beginPath(); c.arc(x + ((y / 1.8) % 2 ? 1 : 0), y, 0.9, 0, Math.PI); c.stroke(); }
    c.restore();
    plate(c, [-8.4, -44.4, 0.4, -44.4, -0.4, -38, -9.4, -39.2], A.base, A.light, A.dark);
    plate(c, [1.6, -44.4, 11.4, -44.4, 12.4, -39.2, 2.6, -38], A.light, shade(A.light, 26), A.base);
    return true;
  }
  if (st === 'chitin') {
    for (let row = 0; row < 3; row++) for (let i = 0; i < 3; i++) {
      const x = -11 + i * 8.6, y = -44 + row * 4.4;
      plate(c, [x, y, x + 9, y, x + 9.6, y + 4, x + 4.6, y + 7.4, x - 0.4, y + 4], row % 2 ? A.base : shade(A.base, -10), A.light, A.dark, 1);
    }
    return true;
  }
  if (st === 'jugg') {
    plate(c, [-12, -44.4, 0.6, -44.4, -0.4, -32, -13.6, -34], A.base, A.light, A.dark, 1.4);
    plate(c, [1.6, -44.4, 15, -44.4, 16.6, -34, 3, -32], A.light, shade(A.light, 26), A.base, 1.4);
    for (const x of [-11, -5, 5, 12]) P(c, [x - 1.6, -33.6, x, -28.4, x + 1.6, -33.4], A.spike || A.light, 0.9);
    c.save(); glowOn(c, A.glow, 8); L(c, [-8, -42, -6, -37, -9, -34], A.glow, 1); L(c, [10, -42, 8, -36], A.glow, 1); c.restore();
    return true;
  }
  if (st === 'void') {
    // a skirt of long ribbons that trail behind in the drift
    for (let i = 0; i < 5; i++) {
      const x = -9 + i * 5, sway = Math.sin(wv * 0.6 + i) * 2 - i * 0.6, len = 20 + (i % 2) * 6;
      const pts = [x - 2, -44.4, x + 2.4, -44.4, x + 1.8 + sway, -44.4 + len, x - 0.6 + sway * 1.2, -42 + len, x - 2.6 + sway, -44.4 + len];
      P(c, pts, i % 2 ? A.cape || A.dark : A.dark, 0.9);
      c.save(); glowOn(c, A.glow, 6); L(c, [x + 2.2, -44, x + 1.8 + sway, -44.4 + len], A.glow, 0.6); c.restore();
    }
    return true;
  }
  return false;
}

// New shoulder shapes, one per tier. Returns true when it handled the kind.
function stylePauldron(c, x, y, A, back, t) {
  const f = back ? A.dark : A.base, li = back ? A.base : A.light, dk = shade(f, -36), kind = A.pauldron;
  if (kind === 'round') {
    plate(c, [x - 7, y + 3, x - 5, y - 4, x + 1, y - 7.4, x + 7, y - 6, x + 10.4, y, x + 10, y + 6, x + 5, y + 8.4, x - 5, y + 7.4], f, li, dk);
    plate(c, [x - 6, y + 6, x + 10, y + 5, x + 9.6, y + 8.4, x - 5.4, y + 9.4], shade(f, -10), li, dk, 1);
    rivet(c, x + 2, y - 2, shade(f, 50));
    return true;
  }
  if (kind === 'elytra') {
    // a beetle's wing case sweeping back past the shoulder
    const pts = [x + 9, y - 5, x - 1, y - 8.4, x - 12, y - 4, x - 21, y + 7, x - 24, y + 18, x - 14, y + 10, x - 4, y + 8, x + 9, y + 4];
    plate(c, pts, f, li, dk, 1.3);
    c.strokeStyle = shade(li, 20); c.lineWidth = 0.8;
    c.beginPath(); c.moveTo(x + 6, y - 3); c.quadraticCurveTo(x - 10, y - 2, x - 20, y + 12); c.stroke();
    c.beginPath(); c.moveTo(x + 6, y + 1); c.quadraticCurveTo(x - 8, y + 3, x - 15, y + 10); c.stroke();
    P(c, [x - 2, y - 8, x - 6, y - 14, x - 7, y - 6.6], A.spike || li, 0.9);
    return true;
  }
  if (kind === 'paladin') {
    for (let i = 2; i >= 0; i--) {
      const o = i * 4.4;
      plate(c, [x - 9, y - 2 + o, x - 3, y - 8 + o, x + 9, y - 7 + o, x + 12.4, y + 1 + o, x + 8, y + 6 + o, x - 8, y + 5 + o], i ? f : li, i ? li : shade(li, 26), dk);
      L(c, [x - 8, y + 5 + o, x + 8, y + 6 + o, x + 12.4, y + 1 + o], A.rivet || '#e8c25a', 0.9);
    }
    // a raised fin along the top
    plate(c, [x - 5, y - 6.4, x + 1, y - 17, x + 4, y - 16, x + 10, y - 7], f, li, dk, 1);
    L(c, [x - 3, y - 7, x + 1.6, y - 15.4, x + 8, y - 7.4], A.rivet || '#e8c25a', 0.7);
    return true;
  }
  if (kind === 'massive') {
    const sp = A.spike || li;
    x += back ? -2 : 4; y += 5;
    for (const [a, b, h] of [[-7, -3, 9], [0, 4, 12], [7, 11, 8]]) plate(c, [x + a, y - 9, x + (a + b) / 2 + 1, y - 9 - h, x + b, y - 9], sp, shade(sp, 30), shade(sp, -40), 1);
    plate(c, [x - 12, y - 1, x - 5, y - 11, x + 9, y - 12, x + 16, y - 2, x + 15, y + 12, x - 9, y + 11], f, li, dk, 1.4);
    plate(c, [x - 10, y + 7, x + 15, y + 7.6, x + 14.6, y + 12.6, x - 9, y + 12], shade(f, -10), li, dk, 1.1);
    c.save(); glowOn(c, A.glow, 8); L(c, [x - 6, y - 4, x - 1, y + 1, x + 4, y - 3], A.glow, 1); c.restore();
    return true;
  }
  if (kind === 'float') {
    // detached plate hovering over the shoulder on a band of light
    const lift = -5 + Math.sin(t * 0.003 + (back ? 1 : 0)) * 1.4;
    c.save(); glowOn(c, A.glow, 10); c.strokeStyle = A.glow; c.lineWidth = 1; c.globalAlpha = 0.8;
    L(c, [x - 6, y + 1, x + 9, y + 0], A.glow, 1); c.restore();
    plate(c, [x - 9, y - 4 + lift, x, y - 10 + lift, x + 12, y - 6 + lift, x + 13, y + 1 + lift, x + 2, y - 1 + lift, x - 7, y + 1 + lift], f, li, dk, 1.2);
    c.save(); glowOn(c, A.glow, 8); L(c, [x - 6, y - 2 + lift, x + 1, y - 6 + lift, x + 10, y - 3 + lift], A.glow, 0.8); c.restore();
    return true;
  }
  return false;
}

// Helmet accents per style, drawn after a helm in head space (head centre at 0,0).
function helmAccent(c, A, closed, t) {
  const st = A.style;
  if (st === 'jugg') {
    plate(c, [-6, -11, -16, -18, -20, -28, -14, -20, -3, -14], '#2a2220', '#4a3c38', '#120c0a', 1);
    plate(c, [5, -12, 12, -20, 13, -29, 15, -18, 9, -10], '#2a2220', '#4a3c38', '#120c0a', 1);
  }
  if (st === 'paladin') {
    P(c, [-7, -9, -16, -15, -13, -8, -18, -9, -12, -4, -7, -5], '#eef0f6', 1);
    L(c, [-8, -8, -15, -13], A.rivet || '#e8c25a', 0.7);
  }
  if (st === 'chitin') { P(c, [6, 4, 12, 11, 8, 5.4], A.spike || A.light, 0.9); P(c, [-2, 7, 1, 14, 2, 8], A.spike || A.light, 0.9); }
  if (st === 'void') { c.save(); glowOn(c, A.glow, 8); L(c, [-8, -6, -2, -13, 6, -12, 10, -6], A.glow, 1); c.restore(); }
}

/* ---------- Sprite renderer: bold silhouette outline, scene rim light, hit flash, afterimages ---------- */
const SPR = {};
function sprLayer(k, w, h) { if (!SPR[k]) SPR[k] = document.createElement('canvas'); return hiDpi(SPR[k], w, h); }
// draw(ctx, ax, ay) paints the sprite with its feet at (ax, ay) on an offscreen canvas; o.x/o.y place those feet on c.
function renderSprite(c, draw, o) {
  const w = o.w || 300, h = o.h || 250, ax = o.ax ?? w / 2, ay = o.ay ?? h - 20;
  const key = w + 'x' + h, s = sprLayer(key + 'a', w, h), tx = sprLayer(key + 'b', w, h), sc = SPR[key + 'a'], tc = SPR[key + 'b'];
  s.clearRect(0, 0, w, h); s.save(); s.lineJoin = 'round'; s.lineCap = 'round'; draw(s, ax, ay); s.restore();
  const X = o.x - ax, Y = o.y - ay, alpha = o.alpha ?? 1;
  const tint = col => { tx.save(); tx.globalCompositeOperation = 'copy'; tx.drawImage(sc, 0, 0, w, h); tx.globalCompositeOperation = 'source-in'; tx.fillStyle = col; tx.fillRect(0, 0, w, h); tx.restore(); };
  c.save();
  if (o.ghosts && o.ghosts.length && !RM) {
    tint(o.ghostCol || '#9ad8ff');
    o.ghosts.forEach((g, i) => { c.globalAlpha = alpha * 0.3 * (1 - i / o.ghosts.length); c.drawImage(tc, X + g, Y, w, h); });
  }
  c.globalAlpha = alpha;
  tint(INK);
  const d = o.outline ?? 2, e = d * 0.7;
  for (const [ox, oy] of [[d, 0], [-d, 0], [0, d], [0, -d], [e, e], [-e, e], [e, -e], [-e, -e]]) c.drawImage(tc, X + ox, Y + oy, w, h);
  if (o.silhouette) { tint(o.silhouette); c.drawImage(tc, X, Y, w, h); } else c.drawImage(sc, X, Y, w, h);
  if (o.rim) {
    tint(o.rim);
    tx.save(); tx.globalCompositeOperation = 'destination-out'; tx.drawImage(sc, -2.2, 2.2, w, h); tx.restore();
    c.globalAlpha = alpha * 0.8; c.drawImage(tc, X, Y, w, h);
  }
  if (o.flash > 0) { tint('#ffffff'); c.globalAlpha = alpha * o.flash; c.drawImage(tc, X, Y, w, h); }
  c.restore();
}

function heroLook() {
  const s = S || {};
  const eq = s.equip || { weapon: 'w_rust', armor: 'a_vest', acc: null };
  return { armor: armorStyle(ARMOR_LOOK[eq.armor] || ARMOR_LOOK.a_vest), weapon: eq.weapon, acc: eq.acc, look: s.look || DEFAULT_LOOK };
}

/* ---------- Enemies (all face left, toward the hero) ----------
   Each kind is built from bevelled plates over a darker body, with glowing details.
   e.variant picks a distinct build within a kind (scrap/sentinel drones, dust/scout/spitter crawlers, void/abyss wraiths, golem/pyrelord). */
function eyeGlow(c, x, y, r, col) { c.save(); glowOn(c, col, 10); P(c, [x - r, y, x, y - r * 0.8, x + r, y, x, y + r * 0.8], col, 0); c.restore(); c.fillStyle = '#ffffff'; c.fillRect(x - r * 0.3, y - r * 0.3, r * 0.5, r * 0.4); }
function drawEnemy(c, e, x, s, t, swing, gy) {
  const G = gy ?? GROUND;
  const [a, b] = e.col || ['#666666', '#ffffff'], k = e.kind, v = e.variant, bob = Math.sin(t * 0.004) * 3;
  const al = shade(a, 40), ad = shade(a, -38);
  if (k === 'humanoid') { drawKnight(c, x, G, s * 1.05, { armor: armorStyle(e.armor), look: e.look, weapon: e.weapon, flip: true, swing }, t); return; }
  c.save(); c.lineJoin = 'round'; c.lineCap = 'round';
  switch (k) {
    case 'drone': {
      c.translate(x, G - 92 * s + bob * 2); c.scale(s, s);
      const sent = v === 'sentinel';
      // thruster
      const fl = 12 + Math.random() * 5, tg = c.createLinearGradient(0, 12, 0, 12 + fl * 2);
      tg.addColorStop(0, '#ffffff'); tg.addColorStop(0.3, b); tg.addColorStop(1, 'rgba(0,0,0,0)');
      P(c, [-6, 12, 6, 12, 2, 12 + fl * 2, -2, 12 + fl * 2], tg, 0);
      plate(c, [-7, 9, 7, 9, 5, 15, -5, 15], ad, a, shade(ad, -30), 1.1);
      if (sent) {
        // orbiting shield ring, the far half behind the hull
        c.save(); glowOn(c, b, 10); c.strokeStyle = b; c.lineWidth = 1.4; c.globalAlpha = 0.6;
        const r0 = t * 0.002;
        for (let i = 0; i < 6; i++) { const a0 = r0 + i * Math.PI / 3; if (Math.sin(a0) < 0) { c.beginPath(); c.ellipse(0, 0, 40, 12, -0.2, a0, a0 + 0.6); c.stroke(); } }
        c.restore();
      }
      // rotor arms
      for (const sx of [-1, 1]) {
        const droop = !sent && sx > 0 ? 6 : 0;
        plate(c, [sx * 10, -12, sx * 28, -20 + droop, sx * 30, -15 + droop, sx * 12, -5], ad, a, shade(ad, -30), 1.1);
        const sp = Math.sin(t * 0.06 + sx);
        c.save(); c.globalAlpha = 0.45; P(c, [sx * 29 - 16 * sp, -24 + droop, sx * 29 + 16 * sp, -22 + droop, sx * 29 + 16 * sp, -20.4 + droop, sx * 29 - 16 * sp, -22.4 + droop], '#e8eef4', 0); c.restore();
        plate(c, [sx * 29 - 2.6, -28 + droop, sx * 29 + 2.6, -28 + droop, sx * 29 + 2.6, -18 + droop, sx * 29 - 2.6, -18 + droop], shade(ad, -10), a, shade(ad, -40), 1);
      }
      const hull = sent ? [-26, 0, -18, -15, 4, -20, 22, -11, 24, 4, 10, 15, -14, 13] : [-24, -2, -16, -16, 6, -20, 22, -10, 22, 6, 8, 16, -12, 14];
      plate(c, hull, a, al, ad, 1.4);
      c.save(); P(c, hull, null, 0); c.clip();
      P(c, [-30, 4, 30, 2, 30, 20, -30, 20], 'rgba(0,0,0,0.22)', 0);
      if (sent) { c.save(); glowOn(c, b, 8); L(c, [-18, -6, 0, -12, 20, -6], b, 1.2); L(c, [-14, 6, 6, 8, 20, 2], b, 0.9); c.restore(); }
      else { P(c, [4, -14, 14, -14, 15, -6, 5, -6], '#8a4a24', 0); P(c, [-6, 4, 2, 4, 3, 10, -5, 10], '#7a3a1c', 0); for (const [x0, y0] of [[-4, -12], [12, 0]]) { P(c, [x0, y0, x0 + 6, y0, x0 + 6, y0 + 5, x0, y0 + 5], '#9a9a9a', 0.7); L(c, [x0, y0, x0 + 6, y0 + 5], '#5a5a5a', 0.6); L(c, [x0 + 6, y0, x0, y0 + 5], '#5a5a5a', 0.6); } }
      c.restore();
      L(c, [-8, -8, -5, 10], shade(a, -55), 1); L(c, [10, -8, 13, 8], shade(a, -55), 1);
      for (const [rx, ry] of [[-10, -12], [16, -8], [16, 6]]) rivet(c, rx, ry, al);
      // weapons and eye
      if (sent) { for (const yy of [8, 12]) plate(c, [-20, yy - 1.6, -36, yy - 1.2, -36, yy + 1.2, -20, yy + 1.6], '#e8eef4', '#ffffff', '#8a94a8', 1); c.save(); glowOn(c, b, 8); c.fillStyle = b; c.fillRect(-38, 6, 2, 8); c.restore(); }
      else plate(c, [-20, 7, -35, 7, -35, 11, -20, 12], '#2a2d34', '#4a4e58', '#14161a', 1.1);
      plate(c, [-22, -8, -16, -12.4, -9, -11, -6, -4, -10, 2, -18, 2], '#15151c', '#2a2a34', '#08080c', 1.2);
      const flick = sent || Math.sin(t * 0.03) > -0.8;
      if (flick) { c.save(); glowOn(c, b, 14); P(c, sent ? [-20, -6, -8, -7, -8, -3, -20, -2] : [-19, -7, -15, -9, -11, -7, -11, -3, -15, -1, -19, -3], b, 0); c.restore(); }
      if (!sent) { P(c, [-15.5, -8, -14.6, -8, -14.6, -2, -15.5, -2], INK, 0); c.strokeStyle = '#2a2a2a'; c.lineWidth = 0.9; c.beginPath(); c.moveTo(4, 14); c.quadraticCurveTo(8, 28, 2, 32 + Math.sin(t * 0.005) * 2); c.stroke(); if (Math.random() < 0.2) { c.save(); glowOn(c, '#ffe08a', 8); c.fillStyle = '#ffe08a'; c.fillRect(1, 31, 2, 2); c.restore(); } }
      L(c, [8, -19, sent ? 14 : 12, -34], shade(a, -30), 1.4);
      if (Math.sin(t * 0.006) > 0) { c.save(); glowOn(c, b, 8); c.fillStyle = b; c.fillRect(sent ? 12.4 : 10.6, -36, 3, 3); c.restore(); }
      if (sent) { c.save(); glowOn(c, b, 10); c.strokeStyle = b; c.lineWidth = 1.6; const r0 = t * 0.002; for (let i = 0; i < 6; i++) { const a0 = r0 + i * Math.PI / 3; if (Math.sin(a0) >= 0) { c.beginPath(); c.ellipse(0, 0, 40, 12, -0.2, a0, a0 + 0.6); c.stroke(); } } c.restore(); }
      break;
    }
    case 'crawler': case 'queen': {
      const q = k === 'queen', scout = v === 'scout', spit = v === 'spitter', sc = s * (q ? 1.5 : 1.05);
      c.translate(x, G); c.scale(sc, sc);
      const lift = scout ? 8 : 0, legL = scout ? 1.35 : 1;
      const reach = [-17, -3, 13];
      const leg = (jx, jy, i, ph, col, lit) => {
        const w = Math.sin(t * 0.01 + ph) * 1.6, r = reach[i] * legL, kx = jx + r * 0.45, ky = jy - 10 * legL - lift + w * 0.5, fx = jx + r + w;
        limb(c, jx, jy, kx, ky, 2.6, 2.1, col, lit); limb(c, kx, ky, fx, 0, 2.1, 0.5, col, lit);
        plate(c, [kx - 2, ky - 2, kx + 2, ky - 2, kx + 2, ky + 2, kx - 2, ky + 2], shade(col, 26), shade(col, 50), col, 0.8);
      };
      for (let i = 0; i < 3; i++) leg(-4 + i * 9, -15 - lift, i, i, shade(a, -48), null);
      if (q) {
        c.save(); c.globalAlpha = 0.45 + 0.1 * Math.sin(t * 0.02);
        for (const [p0, p1] of [[[4, -30, 30, -66, 50, -62, 20, -28], [8, -30, 40, -60]], [[10, -28, 48, -48, 54, -38, 18, -24], [14, -27, 46, -42]]]) { P(c, p0, '#d8e8ff', 1); L(c, p1, '#8aa0c0', 0.8); }
        c.restore();
      }
      // abdomen: segmented plates; the spitter's is a swollen acid sac
      const abd = spit ? [2, -20, 12, -40, 36, -44, 50, -28, 46, -10, 28, -4, 8, -8] : [4, -20 - lift, 14, -33 - lift, 32, -34 - lift, 44, -24 - lift, 42, -12 - lift, 30, -6 - lift, 10, -8 - lift];
      plate(c, abd, shade(a, -10), a, ad, 1.3);
      if (spit) {
        c.save(); P(c, abd, null, 0); c.clip();
        const g = c.createRadialGradient(30, -26, 2, 30, -26, 22); g.addColorStop(0, '#f4ffb0'); g.addColorStop(0.5, b); g.addColorStop(1, shade(b, -80));
        c.globalAlpha = 0.85; c.fillStyle = g; c.fillRect(0, -50, 56, 50);
        c.globalAlpha = 0.7; c.fillStyle = '#f8ffd0';
        for (let i = 0; i < 5; i++) { const yy = -10 - ((t * 0.02 + i * 9) % 30); c.beginPath(); c.arc(18 + i * 6, yy, 1.4 + (i % 2), 0, Math.PI * 2); c.fill(); }
        c.restore();
        for (let i = 0; i < 3; i++) L(c, [16 + i * 10, -42 + i * 2, 14 + i * 10, -6], ad, 1.6);
        P(c, abd, null, 1.3);
      } else {
        for (let i = 0; i < 3; i++) L(c, [18 + i * 8, -33.6 - lift, 15 + i * 8, -7 - lift], ad, 1.2);
        P(c, [14, -33 - lift, 32, -34 - lift, 40, -28 - lift, 20, -28 - lift], al, 0);
        for (const [sx, sy] of [[22, -33.6], [32, -33]]) plate(c, [sx, sy - lift, sx + 3, sy - 8 - lift, sx + 6, sy - lift], shade(a, 34), shade(a, 60), a, 1);
      }
      if (q) { c.save(); glowOn(c, b, 10); for (const [ex, ey] of [[20, -18], [28, -16], [36, -20], [26, -24], [32, -28]]) P(c, [ex - 2.6, ey, ex, ey - 2.6, ex + 2.6, ey, ex, ey + 2.6], b, 0.6); c.restore(); }
      // thorax and head
      plate(c, [-10, -16 - lift, -4, -30 - lift, 8, -31 - lift, 12, -20 - lift, 6, -10 - lift, -6, -10 - lift], a, al, ad, 1.3);
      L(c, [-4, -26 - lift, 8, -26 - lift], ad, 0.9);
      plate(c, [-28, -20 - lift, -22, -31 - lift, -10, -30 - lift, -6, -18 - lift, -14, -12 - lift, -25, -14 - lift], shade(a, 8), shade(a, 46), ad, 1.3);
      const m = Math.sin(t * 0.008) * 1.5;
      plate(c, [-26, -16 - lift, -36, -14 + m - lift, -41, -7 + m - lift, -34, -10 + m - lift, -27, -12 - lift], '#e6dcc4', '#ffffff', '#a8987a', 1);
      plate(c, [-27, -22 - lift, -38, -24 - m - lift, -43, -17 - m - lift, -35, -19 - m - lift, -28, -19 - lift], '#c8bea2', '#efe6cc', '#8a7a5c', 1);
      for (const [ex, ey, r] of [[-20, -26, 1.8], [-15.6, -27, 1.6], [-23, -22, 1.4], [-18, -21.4, 1.1]]) eyeGlow(c, ex, ey - lift, r, b);
      // antennae
      L(c, [-22, -30 - lift, -30, -44 - lift - (scout ? 8 : 0), -38, -46 - lift - (scout ? 10 : 0)], ad, 1);
      L(c, [-18, -31 - lift, -22, -46 - lift - (scout ? 8 : 0), -28, -52 - lift - (scout ? 10 : 0)], ad, 1);
      if (spit) { c.save(); glowOn(c, b, 8); const d = (t * 0.03) % 14; P(c, [-34, -10 + d, -32.6, -7 + d, -34, -5 + d, -35.4, -7 + d], b, 0); c.restore(); }
      if (q) for (let i = 0; i < 3; i++) plate(c, [-23 + i * 5, -30.5, -21 + i * 5, -42 + (i === 1 ? -5 : 0), -19 + i * 5, -30.5], b, shade(b, 50), shade(b, -50), 1);
      for (let i = 0; i < 3; i++) leg(-2 + i * 9, -12 - lift, i, i + 1.5, shade(a, -18), shade(a, 14));
      if (scout) {
        // mantis blades on the forelegs
        const sw2 = Math.sin(t * 0.006) * 3;
        limb(c, -8, -24 - lift, -20, -40 - lift + sw2, 2.6, 2, a, al);
        plate(c, [-20, -40 - lift + sw2, -38, -30 - lift + sw2, -40, -26 - lift + sw2, -21, -35 - lift + sw2], '#e6dcc4', '#ffffff', '#8a7a5c', 1.1);
        L(c, [-22, -38 - lift + sw2, -38, -29 - lift + sw2], '#ffffff', 0.6);
      }
      break;
    }
    case 'wyrm': {
      c.translate(x, G); c.scale(s, s);
      // sand thrown up where it breaches
      c.save(); c.fillStyle = shade(a, -10);
      for (let i = 0; i < 10; i++) { const kk = ((t * 0.0012 + i * 0.1) % 1); c.globalAlpha = 0.6 * (1 - kk); c.fillRect(-10 + i * 7 + kk * (i - 5) * 3, -kk * 30 - 2, 2.4, 2.4); }
      c.restore();
      P(c, [-22, 0, -8, -12, 24, -18, 54, -9, 66, 0], shade(a, -40), 1.2);
      const pts = [];
      for (let i = 0; i <= 10; i++) { const u = i / 10; pts.push([34 - u * 56 + Math.sin(t * 0.003 + u * 4) * 4, -4 - u * 92 - Math.sin(u * Math.PI) * 8]); }
      for (let i = 0; i < 10; i++) {
        const [x1, y1] = pts[i], [x2, y2] = pts[i + 1], w1 = 15 - i * 0.8, w2 = 15 - (i + 1) * 0.8;
        const dx = x2 - x1, dy = y2 - y1, ln = Math.hypot(dx, dy), nx = -dy / ln, ny = dx / ln;
        plate(c, [x1 + nx * w1, y1 + ny * w1, (x1 + x2) / 2 + nx * (w1 + 10), (y1 + y2) / 2 + ny * (w1 + 10), x2 + nx * w2, y2 + ny * w2], shade(b, -20), b, shade(b, -60), 1);
        const segp = [x1 + nx * w1, y1 + ny * w1, x2 + nx * w2, y2 + ny * w2, x2 - nx * w2, y2 - ny * w2, x1 - nx * w1, y1 - ny * w1];
        plate(c, segp, i % 2 ? a : shade(a, -12), al, ad, 1.2);
        // pale belly scutes
        plate(c, [x1 - nx * w1 * 0.95, y1 - ny * w1 * 0.95, x2 - nx * w2 * 0.95, y2 - ny * w2 * 0.95, x2 - nx * w2 * 0.45, y2 - ny * w2 * 0.45, x1 - nx * w1 * 0.45, y1 - ny * w1 * 0.45], shade(a, 50), shade(a, 70), shade(a, 20), 0.8);
      }
      P(c, [-16, 0, -4, -7, 14, -9, 30, -5, 42, 0], shade(a, -25), 1.2);
      const [hx, hy] = pts[10]; c.translate(hx, hy);
      const jo = 3 + Math.sin(t * 0.004) * 2;
      for (const [p, col] of [[[4, -9, 22, -24, 10, -6], shade(b, -15)], [[-2, -11, 10, -28, 4, -9], b], [[-8, -11, -2, -24, -2, -10], shade(b, 10)]]) plate(c, p, col, shade(col, 40), shade(col, -40), 1);
      P(c, [-26, -1, -8, 0, -8, 3 + jo, -24, 4 + jo * 1.5], '#2a0a0a', 0);
      P(c, [-22, 2 + jo * 0.8, -12, 1.6 + jo * 0.6, -10, 3 + jo, -20, 3.6 + jo * 1.2], '#c43a4a', 0);
      plate(c, [6, 4, -8, 2 + jo, -27, 4 + jo * 1.6, -12, 10 + jo, 6, 10], shade(a, -15), a, ad, 1.2);
      for (let i = 0; i < 4; i++) P(c, [-25 + i * 4.4, 3.4 + jo * 1.2, -23.4 + i * 4.4, -0.6 + jo, -21.6 + i * 4.4, 3.4 + jo * 1.1], '#f1ead8', 0.7);
      plate(c, [8, -6, -4, -12, -24, -8, -31, -2, -10, 0, 8, 4], shade(a, 8), al, ad, 1.3);
      L(c, [-4, -10, -22, -6], al, 0.8);
      for (let i = 0; i < 5; i++) P(c, [-29 + i * 4.4, -1.6, -27.4 + i * 4.4, 3.6, -25.6 + i * 4.4, -1.4], '#f1ead8', 0.7);
      eyeGlow(c, -10, -7.6, 3, b);
      break;
    }
    case 'mech': {
      c.translate(x, G); c.scale(s, s);
      const legM = (ox, col) => {
        limb(c, ox, -58, ox + 14, -34, 7, 6, col, shade(col, 26)); limb(c, ox + 14, -34, ox + 4, -6, 6, 5, col, shade(col, 26));
        L(c, [ox + 2, -54, ox + 12, -36], '#d8dce4', 1.8); L(c, [ox + 12, -32, ox + 5, -10], '#d8dce4', 1.8);
        plate(c, [ox - 10, -8, ox + 14, -8, ox + 19, 0, ox - 14, 0], shade(col, -20), col, shade(col, -50), 1.2);
        plate(c, [ox + 9, -40, ox + 19, -40, ox + 20, -29, ox + 10, -28], shade(col, 25), shade(col, 50), col, 1.1);
      };
      legM(8, shade(a, -40));
      L(c, [20, -96 + bob, 30, -80 + bob, 26, -64 + bob], '#2a2a30', 2.2);
      plate(c, [-18, -67, 20, -67, 16, -54, -14, -54], shade(a, -28), a, shade(a, -55), 1.2);
      const hull = [-34, -112 + bob, 22, -118 + bob, 38, -98 + bob, 30, -64 + bob, -26, -62 + bob, -40, -84 + bob];
      plate(c, hull, a, al, ad, 1.5);
      c.save(); P(c, hull, null, 0); c.clip();
      P(c, [-26, -62 + bob, 30, -64 + bob, 34, -76 + bob, -34, -74 + bob], 'rgba(0,0,0,0.3)', 0);
      for (const [p0, p1] of [[[-20, -86 + bob, 8, -88 + bob], [-20, -70 + bob, 8, -72 + bob]]]) { L(c, p0, ad, 1); L(c, p1, ad, 1); }
      L(c, [8, -116 + bob, 10, -64 + bob], ad, 1.1);
      c.restore();
      for (const [rx, ry] of [[-28, -104], [16, -110], [26, -72], [-20, -68]]) rivet(c, rx, ry + bob, al);
      const plateZ = [14, -92 + bob, 30, -92 + bob, 29, -76 + bob, 13, -76 + bob];
      c.save(); P(c, plateZ, null, 0); c.clip();
      for (let i = -2; i < 6; i++) P(c, [12 + i * 6, -76 + bob, 16 + i * 6, -76 + bob, 22 + i * 6, -92 + bob, 18 + i * 6, -92 + bob], i % 2 ? b : INK, 0);
      c.restore(); P(c, plateZ, null);
      plate(c, [-38, -98 + bob, -22, -104 + bob, -6, -102 + bob, -8, -90 + bob, -30, -86 + bob], '#14161c', '#2a2e38', '#08080c', 1.3);
      c.save(); glowOn(c, b, 12); P(c, [-34, -96 + bob, -22, -100 + bob, -10, -99 + bob, -11, -94 + bob, -30, -91 + bob], b, 0); c.restore();
      P(c, [-30, -97 + bob, -24, -99.4 + bob, -22, -96 + bob], 'rgba(255,255,255,0.6)', 0);
      const scan = -30 + ((t * 0.02) % 18); c.fillStyle = 'rgba(255,255,255,0.7)'; c.fillRect(scan, -98 + bob, 2, 6);
      plate(c, [-8, -134 + bob, 22, -136 + bob, 24, -116 + bob, -6, -114 + bob], shade(a, -15), a, ad, 1.3);
      for (let i = 0; i < 4; i++) { P(c, [-4 + i * 7, -131 + bob, 1 + i * 7, -131 + bob, 1 + i * 7, -123 + bob, -4 + i * 7, -123 + bob], '#1a1a20', 0.8); c.fillStyle = '#ff4a3a'; c.fillRect(-3 + i * 7, -129 + bob, 3, 2); }
      if (Math.sin(t * 0.008) > 0.2) { c.save(); glowOn(c, '#ffb02e', 10); c.fillStyle = '#ffb02e'; c.fillRect(19, -122 + bob, 3, 3); c.fillRect(-38, -84 + bob, 3, 3); c.restore(); }
      limb(c, -10, -86 + bob, -24, -70 + bob, 6, 5, shade(a, -20), a);
      plate(c, [-22, -78 + bob, -66, -76 + bob, -66, -65 + bob, -22, -62 + bob], '#3a3d46', '#5a5e6a', '#1a1c22', 1.3);
      for (const rx of [-34, -46, -56]) plate(c, [rx - 2, -79 + bob, rx + 2, -79 + bob, rx + 2, -62 + bob, rx - 2, -62 + bob], '#2a2c34', '#4a4e58', '#14161a', 0.8);
      c.save(); glowOn(c, b, 10); c.fillStyle = b; c.fillRect(-69, -74 + bob, 3, 6); c.restore();
      L(c, [16, -118 + bob, 24, -142 + bob], shade(a, -30), 1.4);
      if (Math.sin(t * 0.006) > 0) { c.save(); glowOn(c, '#ff4a3a', 8); c.fillStyle = '#ff4a3a'; c.fillRect(22.6, -144 + bob, 3, 3); c.restore(); }
      legM(-12, shade(a, -12));
      break;
    }
    case 'wraith': {
      const abyss = v === 'abyss';
      c.translate(x, G - 46 + bob * 2); c.scale(s, s);
      if (abyss) {
        // tendrils from the back
        for (let i = 0; i < 4; i++) {
          let px = 10, py = -70 + i * 10, w = 5;
          for (let j = 0; j < 5; j++) { const an = -0.4 + i * 0.25 + Math.sin(t * 0.004 + i + j) * 0.4, nx = px + Math.cos(an) * 10, ny = py + Math.sin(an) * 8 - 4; limb(c, px, py, nx, ny, w, w - 0.9, shade(a, 10), shade(a, 30)); px = nx; py = ny; w -= 0.9; }
          eyeGlow(c, px, py, 1.6, b);
        }
      }
      const gr = c.createLinearGradient(0, -96, 0, 40); gr.addColorStop(0, shade(a, 20)); gr.addColorStop(0.6, a); gr.addColorStop(1, 'rgba(0,0,0,0)');
      const pts = abyss ? [-8, -88, 12, -86, 22, -64, 26, -30, 28, 10] : [-4, -100, 10, -92, 18, -72, 24, -40, 28, 8];
      for (let i = 1; i <= 6; i++) pts.push(28 - i * 9, (i % 2 ? 36 : 14) + Math.sin(t * 0.008 + i) * 5);
      pts.push(-26, -30, -22, -66, -14, -88);
      P(c, pts, gr, 1.3);
      c.save(); P(c, pts, null, 0); c.clip();
      for (const [x0, x1] of [[6, 14], [-8, -10], [16, 22]]) L(c, [x0, -74, x1, 30], shade(a, -40), 1.2);
      P(c, [8, -90, 24, -60, 22, 20, 12, 20], 'rgba(0,0,0,0.25)', 0);
      c.restore();
      if (abyss) {
        // a jagged maw and a cluster of eyes
        plate(c, [-18, -80, -4, -90, 10, -82, 8, -60, -6, -54, -20, -64], shade(a, 6), shade(a, 30), shade(a, -30), 1.3);
        P(c, [-16, -70, 4, -72, 2, -60, -12, -58], '#05030a', 0);
        for (let i = 0; i < 5; i++) { P(c, [-15 + i * 4, -71.6, -13 + i * 4, -66, -11 + i * 4, -71.8], '#f1ead8', 0.6); P(c, [-13 + i * 3.4, -58.4, -11.4 + i * 3.4, -63, -10 + i * 3.4, -58.6], '#f1ead8', 0.6); }
        for (const [ex, ey, r] of [[-12, -82, 2], [-4, -84, 2.4], [4, -80, 1.8], [-8, -77, 1.4], [2, -75, 1.4]]) eyeGlow(c, ex, ey, r, b);
      } else {
        plate(c, [-16, -86, -6, -96, 6, -90, 4, -70, -8, -64, -18, -72], shade(a, 14), shade(a, 40), a, 1.3);
        P(c, [-14, -84, -6, -92, 2, -86, 1, -71, -8, -66, -15, -73], '#05030a', 0);
        eyeGlow(c, -10, -78, 2.4, b); eyeGlow(c, -2, -79, 2.4, b);
        // chains wrapped around the robe
        c.strokeStyle = '#8a8496'; c.lineWidth = 1.1;
        for (let i = 0; i < 9; i++) { const xx = -20 + i * 5, yy = -40 + i * 2.4 + Math.sin(t * 0.004 + i) * 0.6; c.beginPath(); c.ellipse(xx, yy, 2.6, 1.4, 0.3, 0, Math.PI * 2); c.stroke(); }
      }
      const r = Math.sin(t * 0.004) * 3;
      for (const [oy, len] of [[0, 1], [16, 0.8]]) {
        plate(c, [-12, -64 + oy, -30, -56 + oy + r, -34, -47 + oy + r, -18, -48 + oy], shade(a, -12), a, shade(a, -40), 1.1);
        L(c, [-32, -52 + oy + r, -40 * len - 2, -56 + oy + r], '#d8d0c0', 2);
        for (const [dx, dy] of [[-10, -7], [-12, 0], [-10, 6]]) { L(c, [-40 * len - 2, -56 + oy + r, -40 * len - 2 + dx, -56 + oy + r + dy], '#e8e0d0', 1.3); P(c, [-40 * len - 2 + dx, -56 + oy + r + dy - 1, -40 * len - 6 + dx, -56 + oy + r + dy, -40 * len - 2 + dx, -56 + oy + r + dy + 1], '#ffffff', 0); }
      }
      c.globalAlpha = 0.4;
      for (let i = 0; i < 5; i++) { const yy = -((t * 0.04 + i * 30) % 120); L(c, [-10 + i * 8, yy, -14 + i * 8, yy - 10], b, 1); }
      c.globalAlpha = 1;
      break;
    }
    case 'golem': {
      const pyre = v === 'pyrelord';
      c.translate(x, G); c.scale(s, s);
      const rock = (pts, lit) => { plate(c, pts, a, al, ad, 1.4); if (lit) P(c, lit, shade(a, 24), 0); P(c, pts, null, 1.4); };
      rock([44, -110 + bob, 62, -104 + bob, 66, -70 + bob, 58, -50 + bob, 42, -56 + bob]);
      rock([-30, -46, -10, -48, -8, 0, -34, 0, -37, -22], [-30, -46, -10, -48, -11, -36, -28, -38]);
      rock([6, -48, 26, -46, 30, -22, 28, 0, 4, 0], [6, -48, 26, -46, 25, -38, 8, -38]);
      rock([-46, -104 + bob, -20, -128 + bob, 22, -126 + bob, 46, -100 + bob, 38, -50, -36, -46], [-20, -128 + bob, 22, -126 + bob, 40, -104 + bob, 0, -110 + bob]);
      if (pyre) {
        // obsidian plates bolted over the rock, and an exposed molten heart
        for (const pp of [[-44, -100 + bob, -24, -122 + bob, -10, -116 + bob, -26, -92 + bob], [24, -120 + bob, 44, -98 + bob, 36, -86 + bob, 18, -104 + bob]]) plate(c, pp, '#14100e', '#3a302c', '#000000', 1.2);
        const pulse = 0.7 + 0.3 * Math.sin(t * 0.005);
        c.save(); glowOn(c, b, 24 * pulse);
        P(c, [-12, -100 + bob, 10, -102 + bob, 14, -82 + bob, -2, -72 + bob, -16, -82 + bob], '#3a0e04', 1.4);
        const mg = c.createRadialGradient(-1, -88 + bob, 2, -1, -88 + bob, 14); mg.addColorStop(0, '#fff2c0'); mg.addColorStop(0.5, b); mg.addColorStop(1, '#c43a0a');
        P(c, [-9, -98 + bob, 8, -99 + bob, 11, -84 + bob, -2, -76 + bob, -13, -84 + bob], mg, 0);
        c.restore();
      }
      L(c, [-40, -78 + bob, 30, -84 + bob], ad, 1);
      rock([-16, -144 + bob, 4, -148 + bob, 14, -132 + bob, 6, -120 + bob, -14, -122 + bob], [-16, -144 + bob, 4, -148 + bob, 10, -138 + bob, -10, -136 + bob]);
      if (pyre) {
        for (let i = 0; i < 5; i++) {
          const fx = -14 + i * 7, fh = 12 + (i === 2 ? 10 : i % 2 ? 4 : 7) + Math.sin(t * 0.015 + i) * 3;
          const fg = c.createLinearGradient(0, -146 + bob, 0, -146 - fh + bob); fg.addColorStop(0, b); fg.addColorStop(1, 'rgba(255,240,180,0)');
          c.save(); glowOn(c, b, 12); P(c, [fx - 3, -144 + bob, fx, -146 - fh + bob, fx + 3, -144 + bob], fg, 0); c.restore();
        }
        for (const [hx0, dir] of [[-12, -1], [8, 1]]) plate(c, [hx0, -140 + bob, hx0 + dir * 10, -154 + bob, hx0 + dir * 4, -138 + bob], '#14100e', '#3a302c', '#000000', 1);
      }
      c.save(); glowOn(c, b, 12);
      P(c, [-12, -135 + bob, -6, -136 + bob, -6, -133 + bob, -12, -132 + bob], b, 0); P(c, [-3, -136 + bob, 2, -136.4 + bob, 2, -133 + bob, -3, -133 + bob], b, 0);
      L(c, [-28, -110 + bob, -16, -96 + bob, -22, -84 + bob, -8, -70 + bob], b, 2.2);
      L(c, [14, -116 + bob, 6, -98 + bob, 18, -80 + bob], b, 2);
      L(c, [-22, -40, -18, -24, -24, -10], b, 1.6); L(c, [16, -42, 20, -26], b, 1.6);
      if (!pyre) P(c, [-2, -100 + bob, 4, -94 + bob, -2, -88 + bob, -8, -94 + bob], b, 0);
      c.restore();
      rock([-66, -108 + bob, -44, -114 + bob, -38, -80 + bob, -48, -46 + bob, -70, -52 + bob, -74, -84 + bob], [-66, -108 + bob, -44, -114 + bob, -42, -96 + bob, -64, -94 + bob]);
      c.save(); glowOn(c, b, 10); L(c, [-62, -96 + bob, -52, -84 + bob, -58, -70 + bob], b, 1.8); c.restore();
      if (pyre) { c.save(); glowOn(c, b, 10); const d = (t * 0.03) % 20; P(c, [-60, -48 + bob + d, -58, -44 + bob + d, -60, -41 + bob + d, -62, -44 + bob + d], b, 0); c.restore(); }
      c.fillStyle = b;
      for (let i = 0; i < 7; i++) { const yy = (t * 0.03 + i * 37) % 80; c.globalAlpha = 1 - yy / 80; c.fillRect(-36 + i * 12, -112 - yy + bob, 2, 2); }
      c.globalAlpha = 1;
      break;
    }
    case 'imp': {
      c.translate(x, G); c.scale(s, s);
      const fl = Math.sin(t * 0.012) * 6;
      const wing = [6, -62, 30, -96 - fl, 34, -74 - fl, 46, -78 - fl, 38, -58 - fl * 0.5, 44, -50, 14, -50];
      P(c, wing, shade(a, -32));
      c.save(); P(c, wing, null, 0); c.clip(); P(c, [10, -60, 30, -96 - fl, 34, -74 - fl, 20, -54], shade(a, -14), 0); c.restore();
      for (const [x1, y1] of [[30, -94 - fl], [34, -74 - fl], [44, -77 - fl]]) L(c, [10, -58, x1, y1], shade(a, -55), 1.1);
      P(c, wing, null, 1.3);
      c.strokeStyle = shade(a, -20); c.lineWidth = 2.6; c.beginPath(); c.moveTo(10, -32); c.quadraticCurveTo(30, -20, 42, -32 + Math.sin(t * 0.006) * 3); c.stroke();
      c.save(); glowOn(c, b, 12); const tf = Math.random() * 2; P(c, [40, -34, 46, -42 - tf, 48, -30], b, 0.8); c.restore();
      limb(c, 4, -34, 12, -20, 4, 3.4, shade(a, -25)); limb(c, 12, -20, 6, -1, 3.4, 2.4, shade(a, -25));
      P(c, [0, -2, 9, -2, 10, 0, -2, 0], '#2a1a1a', 1);
      limb(c, -6, -34, -14, -20, 4, 3.4, a, shade(a, 25)); limb(c, -14, -20, -10, -1, 3.4, 2.4, a, shade(a, 25));
      P(c, [-16, -2, -7, -2, -6, 0, -18, 0], '#2a1a1a', 1);
      for (const cx of [-17, -13]) P(c, [cx, -1, cx - 3, 0.6, cx, 0.6], '#f1ead8', 0.5);
      const torso = [-10, -36, 10, -34, 12, -56, 0, -66, -14, -58];
      plate(c, torso, a, al, ad, 1.3);
      for (let i = 0; i < 3; i++) plate(c, [-8 + i * 0.6, -54 + i * 6, 0, -55 + i * 6, -0.6, -50 + i * 6, -8.6 + i * 0.6, -49 + i * 6], shade(a, 30), shade(a, 50), a, 0.8);
      plate(c, [-2, -72, 12, -82, 3, -65], shade(a, -10), a, ad, 1.1);
      plate(c, [-22, -66, -16, -77, -4, -77, 2, -66, -4, -58, -16, -58], shade(a, 8), shade(a, 44), ad, 1.3);
      plate(c, [-14, -76, -20, -90, -16, -94, -10, -78], '#3a2020', '#6a4040', '#1a0a0a', 1); plate(c, [-7, -77, -6, -92, -2, -95, -1, -77], '#3a2020', '#6a4040', '#1a0a0a', 1);
      L(c, [-21, -63, -10, -61], INK, 1);
      for (let i = 0; i < 4; i++) P(c, [-20 + i * 2.6, -62.6, -18.8 + i * 2.6, -60, -17.6 + i * 2.6, -62.2], '#f1ead8', 0);
      eyeGlow(c, -16, -70.8, 2, b); eyeGlow(c, -7, -71, 2, b);
      limb(c, -8, -56, -22, -46, 3, 2.6, a, al); limb(c, -22, -46, -30, -52, 2.6, 2, a, al);
      for (const dy of [-4, 0, 4]) L(c, [-30, -52, -36, -52 + dy], '#f1ead8', 1.1);
      c.save(); glowOn(c, b, 16); const ff = Math.random() * 3;
      P(c, [-37, -54, -33, -62 - ff, -30, -70 - ff * 2, -26, -60, -29, -52], b, 0); c.restore();
      P(c, [-34, -55, -31, -62, -29, -56], '#fff6c0', 0);
      break;
    }
    case 'eye': {
      c.translate(x, G - 100 * s + bob * 2); c.scale(s, s);
      for (let i = 0; i < 7; i++) {
        const ang = Math.PI * 0.12 + i * (Math.PI * 1.76 / 6); let px = Math.cos(ang) * 34, py = Math.sin(ang) * 34, w = 6.4;
        for (let j = 1; j <= 4; j++) {
          const a2 = ang + Math.sin(t * 0.003 + i + j * 0.8) * 0.32;
          const nx = px + Math.cos(a2) * 13, ny = py + Math.sin(a2) * 13;
          limb(c, px, py, nx, ny, w, w - 1.3, j % 2 ? shade(a, 12) : a, shade(a, 34));
          c.fillStyle = shade(b, -30); c.beginPath(); c.arc((px + nx) / 2, (py + ny) / 2, Math.max(0.6, w * 0.25), 0, Math.PI * 2); c.fill();
          px = nx; py = ny; w -= 1.3;
        }
        eyeGlow(c, px, py, 2.6, b);
      }
      const oct = r => { const p = []; for (let i = 0; i < 8; i++) { const an = Math.PI / 8 + i * Math.PI / 4; p.push(Math.cos(an) * r, Math.sin(an) * r); } return p; };
      for (let i = 0; i < 8; i++) { const an = i * Math.PI / 4; plate(c, [Math.cos(an - 0.2) * 44, Math.sin(an - 0.2) * 44, Math.cos(an) * 58, Math.sin(an) * 58, Math.cos(an + 0.2) * 44, Math.sin(an + 0.2) * 44], shade(a, 20), shade(a, 50), ad, 1.2); }
      plate(c, oct(48), a, al, ad, 1.6);
      for (let i = 0; i < 8; i++) { const an = Math.PI / 8 + i * Math.PI / 4; L(c, [Math.cos(an) * 38, Math.sin(an) * 38, Math.cos(an) * 48, Math.sin(an) * 48], ad, 1.1); rivet(c, Math.cos(an + 0.2) * 43, Math.sin(an + 0.2) * 43, al); }
      plate(c, oct(40), shade(a, -20), a, shade(a, -50), 1.2);
      const blink = (t % 5200) < 180 ? 1 : 0;
      const scl = [-36, 0, -18, -21 + blink * 20, 18, -21 + blink * 20, 36, 0, 18, 21 - blink * 20, -18, 21 - blink * 20];
      const sg = c.createRadialGradient(0, 0, 4, 0, 0, 36); sg.addColorStop(0, '#fff6f8'); sg.addColorStop(1, '#c8b0bc');
      P(c, scl, sg, 1.4);
      if (!blink) {
        c.save(); P(c, scl, null, 0); c.clip();
        for (const vp of [[-34, -2, -24, -6, -18, -4, -14, -8], [32, 4, 22, 8, 16, 6], [-30, 8, -22, 12, -16, 10], [28, -6, 20, -10]]) L(c, vp, '#c4506a', 0.9);
        const lx = Math.sin(t * 0.0013) * 8 - 6;
        c.save(); glowOn(c, b, 16);
        const ir = []; for (let i = 0; i < 8; i++) { const an = Math.PI / 8 + i * Math.PI / 4; ir.push(lx + Math.cos(an) * 15, Math.sin(an) * 15); }
        const ig = c.createRadialGradient(lx, 0, 2, lx, 0, 15); ig.addColorStop(0, shade(b, 60)); ig.addColorStop(1, shade(b, -40));
        P(c, ir, ig, 1); c.restore();
        for (let i = 0; i < 8; i++) { const an = i * Math.PI / 4; L(c, [lx + Math.cos(an) * 6, Math.sin(an) * 6, lx + Math.cos(an) * 13, Math.sin(an) * 13], shade(b, -50), 0.8); }
        P(c, [lx - 2, -12, lx + 2, -12, lx + 2.8, 0, lx + 2, 12, lx - 2, 12, lx - 2.8, 0], INK, 0);
        P(c, [lx + 5, -9, lx + 10, -9, lx + 7.4, -4], 'rgba(255,255,255,0.85)', 0);
        P(c, [-36, -24, 36, -24, 36, -14, -36, -10], 'rgba(0,0,0,0.25)', 0);
        c.restore();
      }
      plate(c, [-40, 0, -18, -25, 18, -25, 40, 0, 18, -19, -18, -19], shade(a, -15), a, shade(a, -50), 1.3);
      plate(c, [-40, 0, -18, 25, 18, 25, 40, 0, 18, 19, -18, 19], shade(a, -15), a, shade(a, -50), 1.3);
      break;
    }
  }
  c.restore();
}


// The Hollow Dark: a crowned titan of black armour around a starless void. Faces left; about 250 units tall.
// ps.arm swings the greatsword (negative raises it, positive brings it down). e.p2 = armour broken open.
function drawTitan(c, e, t, ps) {
  const glow = e.col ? e.col[1] : '#c46aff', p2 = !!e.p2, arm = ps.arm || 0;
  const br = Math.sin(t * 0.0025) * 2, wv = Math.sin(t * 0.002) * 6;
  const plate = '#1c1630', plateL = '#3e3260', plateD = '#0b0814', edge = shade(glow, -40);
  const voidFill = (pts) => {
    c.save(); P(c, pts, '#05030a', 1.2); P(c, pts, null, 0); c.clip();
    const r = seeded(31); c.fillStyle = '#ffffff';
    for (let i = 0; i < 40; i++) { c.globalAlpha = 0.3 + 0.7 * Math.abs(Math.sin(t * 0.002 + i)); c.fillRect(-80 + r() * 160, -240 + r() * 240, 1.2, 1.2); }
    c.globalAlpha = 0.35; const g = c.createRadialGradient(-4, -168, 2, -4, -168, 60); g.addColorStop(0, glow); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(-80, -240, 160, 160);
    c.restore();
  };

  // cape of night
  const cape = [-30, -212 + br, 40, -214 + br, 72, -150, 92 + wv * 0.4, -64, 104 + wv, 0, 86 + wv, -9, 70 + wv, 3, 52, -8, 34, -2, 14, -40, -4, -120];
  const cg = c.createLinearGradient(0, -214, 0, 0); cg.addColorStop(0, '#1a1030'); cg.addColorStop(1, '#05030c');
  P(c, cape, cg, 1.4);
  c.save(); P(c, cape, null, 0); c.clip(); const sr = seeded(5); c.fillStyle = '#d8c8ff';
  for (let i = 0; i < 26; i++) { c.globalAlpha = 0.2 + 0.6 * Math.abs(Math.sin(t * 0.0015 + i * 2)); c.fillRect(-10 + sr() * 110, -200 + sr() * 200, 1.4, 1.4); }
  c.restore();

  if (p2) {
    for (let i = 0; i < 4; i++) {
      let px = 20 + i * 8, py = -190 + i * 10, w = 7;
      for (let j = 0; j < 5; j++) {
        const a = -0.6 + i * 0.35 + Math.sin(t * 0.003 + i + j * 0.7) * 0.35, nx = px + Math.cos(a) * 16, ny = py + Math.sin(a) * 16 - 4;
        limb(c, px, py, nx, ny, w, w - 1.2, j % 2 ? '#1a1030' : '#120a22'); px = nx; py = ny; w -= 1.2;
      }
      P(c, [px - 2, py, px + 9, py - 4, px - 1, py + 3], glow, 0.8);
    }
  }

  // back arm: raised open hand holding a void flame
  limb(c, 36, -196 + br, 62, -164 + br, 12, 10, plateD); limb(c, 62, -164 + br, 54, -128 + br, 10, 8, plateD);
  P(c, [44, -134 + br, 62, -134 + br, 64, -122 + br, 46, -120 + br], plate);
  glowOn(c, glow, 18);
  const ff = Math.sin(t * 0.01) * 3;
  P(c, [44, -140 + br, 50, -160 - ff + br, 54, -148 + br, 58, -166 + ff + br, 62, -142 + br], glow, 0);
  glowOff(c);

  // legs
  const leg = (hx, kx, ax, col, lit) => {
    limb(c, hx, -122, kx, -66, 15, 12, col, lit); limb(c, kx, -66, ax, -12, 12, 9, col, lit);
    P(c, [kx - 10, -74, kx + 8, -72, kx + 10, -60, kx - 2, -54, kx - 12, -60], lit || plateL);
    P(c, [kx - 6, -74, kx - 2, -88, kx + 2, -73], shade(glow, -60));
    P(c, [ax - 12, -14, ax + 12, -14, ax + 14, 0, ax - 28, 0, ax - 22, -6], col);
    P(c, [ax - 28, 0, ax - 34, -2, ax - 22, -6], shade(glow, -50), 0.8);
  };
  leg(18, 30, 36, plateD);
  // armoured skirt
  P(c, [-34, -136, 34, -138, 42, -96, 20, -88, 4, -98, -14, -86, -40, -94], plate);
  for (const x of [-20, 2, 22]) L(c, [x, -134, x + 2, -94], plateD, 1.4);
  L(c, [-34, -136, 34, -138], edge, 2);
  leg(-20, -36, -44, plate, plateL);

  // torso
  const torso = [-52, -206 + br, 46, -212 + br, 40, -150, 28, -128, -28, -126, -42, -150];
  if (!p2) {
    P(c, torso, plate);
    P(c, [-52, -206 + br, -6, -210 + br, -10, -128, -28, -126, -42, -150], plateL, 0);
    P(c, [-48, -200 + br, -20, -204 + br, -24, -176 + br], shade(plateL, 30), 0);
    for (const y of [-150, -138]) L(c, [-36, y, 34, y - 2], plateD, 1.6);
    P(c, torso, null);
  } else {
    voidFill(torso);
    P(c, [-52, -206 + br, -6, -210 + br, -16, -188 + br, -36, -176, -42, -150], plate);
    P(c, [20, -210 + br, 46, -212 + br, 40, -150, 30, -170], plate);
    P(c, [-28, -126, 28, -128, 24, -140, -6, -146, -24, -138], plate);
  }
  // core
  const cr = p2 ? 22 : 12, pulse = 1 + 0.12 * Math.sin(t * 0.006);
  glowOn(c, glow, p2 ? 30 : 16);
  P(c, [-4, -170 - cr * pulse, -4 + cr * 0.7 * pulse, -170, -4, -170 + cr * pulse, -4 - cr * 0.7 * pulse, -170], glow, 1);
  P(c, [-4, -170 - cr * 0.5, -4 + cr * 0.3, -170, -4, -170 + cr * 0.5, -4 - cr * 0.3, -170], '#ffffff', 0);
  if (p2) for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3 + t * 0.001; L(c, [-4 + Math.cos(a) * 26, -170 + Math.sin(a) * 26, -4 + Math.cos(a) * 44, -170 + Math.sin(a) * 44], glow, 1.4); }
  glowOff(c);
  if (!p2) { glowOn(c, glow, 8); L(c, [-30, -196 + br, -18, -184, -24, -168, -12, -150], shade(glow, -10), 1.2); glowOff(c); }
  else { glowOn(c, glow, 10); L(c, [-36, -176, -20, -186, -14, -150], glow, 1.6); L(c, [24, -168, 30, -190 + br], glow, 1.6); glowOff(c); }

  // head with crown
  P(c, [-14, -206 + br, 8, -206 + br, 6, -216 + br, -12, -216 + br], plateD);
  const helm = [-26, -228 + br, -6, -240 + br, 12, -234 + br, 14, -214 + br, 2, -206 + br, -22, -208 + br];
  P(c, helm, plate);
  P(c, [-26, -228 + br, -6, -240 + br, -2, -232 + br, -20, -222 + br], plateL, 0);
  P(c, helm, null);
  for (let i = 0; i < 5; i++) { const x = -20 + i * 7, h = [16, 26, 34, 24, 14][i]; P(c, [x - 3, -232 + br + i * 0.6, x - 1 - i * 0.8, -232 - h + br, x + 3, -232 + br + i * 0.4], i === 2 ? edge : plateD, 1); }
  P(c, [10, -230 + br, 26, -244 + br, 30, -262 + br, 22, -246 + br, 12, -238 + br], plateD);
  glowOn(c, glow, p2 ? 22 : 12);
  P(c, [-24, -222 + br, -14, -224 + br, -15, -220 + br, -24, -219 + br], p2 ? '#ffffff' : glow, 0);
  P(c, [-11, -224 + br, -3, -225 + br, -4, -221 + br, -11, -220 + br], p2 ? '#ffffff' : glow, 0);
  glowOff(c);

  // sword arm and greatsword. Shoulder at (-44,-196).
  const sx = -44, sy = -196 + br;
  const rot = (px, py, a) => { const dx = px - sx, dy = py - sy, ca = Math.cos(a), sa = Math.sin(a); return [sx + dx * ca - dy * sa, sy + dx * sa + dy * ca]; };
  const a = arm < 0 ? arm * 1.25 : arm * -0.45;
  const [ex, ey] = rot(-62, -160 + br, -a), [hx, hy] = rot(-70, -126 + br, -a);
  const th = -2.6 - a;
  if (ps.smear != null && (ps.smearT ?? 1) > 0) {
    const outer = [], n = 10, a0s = ps.smear < 0 ? ps.smear * 1.25 : ps.smear * -0.45;
    for (let i = 0; i <= n; i++) { const aa = a0s + (a - a0s) * i / n, [px, py] = rot(-70, -126 + br, -aa), tt = -2.6 - aa; outer.push(px + Math.sin(tt) * 170, py - Math.cos(tt) * 170); }
    c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.55 * (ps.smearT ?? 1); glowOn(c, glow, 18);
    P(c, [hx, hy, ...outer], glow, 0); c.restore();
  }
  c.save(); c.translate(hx, hy); c.rotate(th);
  P(c, [-3, 14, 3, 14, 3, -8, -3, -8], '#2a2236');
  P(c, [-18, -8, 18, -8, 14, -14, -14, -14], plateL);
  P(c, [-8, -14, 8, -14, 9, -160, 0, -178, -9, -160], '#0e0a16', 1.4);
  P(c, [0, -14, 8, -14, 9, -160, 0, -178], '#1e1830', 0);
  glowOn(c, glow, 12); L(c, [8.5, -18, 9, -160, 0, -178], glow, 1.6); L(c, [0, -22, 0, -150], shade(glow, -30), 1); glowOff(c);
  c.restore();
  limb(c, sx, sy, ex, ey, 13, 11, plate, plateL); limb(c, ex, ey, hx, hy, 11, 9, plate, plateL);
  P(c, [hx - 9, hy - 8, hx + 8, hy - 9, hx + 9, hy + 7, hx - 8, hy + 8], plateL);
  // front pauldron
  for (let i = 2; i >= 0; i--) {
    const o = i * 9;
    P(c, [sx - 22, sy - 4 + o, sx - 8, sy - 18 + o, sx + 18, sy - 16 + o, sx + 24, sy + 2 + o, sx + 12, sy + 12 + o, sx - 18, sy + 10 + o], i ? plate : plateL);
    L(c, [sx - 18, sy + 10 + o, sx + 12, sy + 12 + o, sx + 24, sy + 2 + o], edge, 1.4);
  }
  for (let i = 0; i < 3; i++) P(c, [sx - 14 + i * 12, sy - 16, sx - 12 + i * 12 - 4, sy - 34 - i * 3, sx - 8 + i * 12, sy - 17], plateD, 1);
}

// A black hole: lensing halo, accretion disk (far half, bent-up far side, horizon, near half), photon ring.
function blackHole(c, x, y, R, t, tilt = -0.18) {
  const spin = t * 0.0005;
  const g = c.createRadialGradient(x, y, R * 0.9, x, y, R * 3.4);
  g.addColorStop(0, 'rgba(255,190,110,0.5)'); g.addColorStop(0.3, 'rgba(255,110,60,0.18)'); g.addColorStop(0.6, 'rgba(160,70,255,0.12)'); g.addColorStop(1, 'rgba(0,0,0,0)');
  c.fillStyle = g; c.beginPath(); c.arc(x, y, R * 3.4, 0, Math.PI * 2); c.fill();
  const ring = front => {
    c.save(); c.translate(x, y); c.rotate(tilt);
    for (const [col, k, w] of [['#a04aff', 3.2, 0.16], ['#ff5a3a', 2.6, 0.2], ['#ff9a4a', 2.1, 0.24], ['#ffd27a', 1.6, 0.28], ['#fff6d8', 1.25, 0.3]]) {
      c.strokeStyle = col; c.lineWidth = R * w * 0.5; c.globalAlpha = 0.85;
      c.beginPath(); c.ellipse(0, 0, R * k, R * k * 0.24, 0, front ? 0 : Math.PI, front ? Math.PI : Math.PI * 2); c.stroke();
    }
    c.fillStyle = '#fff2c8';
    for (let i = 0; i < 22; i++) { const a = spin * (3 - (i % 3)) + i * 2.1, k = 1.3 + (i % 5) * 0.42, sy = Math.sin(a); if ((sy > 0) !== front) continue; c.globalAlpha = 0.5 + 0.5 * Math.abs(sy); c.fillRect(Math.cos(a) * R * k - R * 0.05, sy * R * k * 0.24 - R * 0.02, R * 0.1, R * 0.04); }
    c.restore();
  };
  ring(false);
  c.save(); c.globalAlpha = 0.9; c.strokeStyle = '#ffdca0'; c.lineWidth = R * 0.16; glowOn(c, '#ffb46a', R * 0.4); c.beginPath(); c.ellipse(x, y, R * 1.24, R * 1.12, tilt, Math.PI * 1.04, Math.PI * 1.96); c.stroke(); c.restore();
  c.save(); c.globalAlpha = 0.45; c.strokeStyle = '#ffb46a'; c.lineWidth = R * 0.08; c.beginPath(); c.ellipse(x, y, R * 1.16, R * 1.08, tilt, Math.PI * 0.08, Math.PI * 0.92); c.stroke(); c.restore();
  c.save(); glowOn(c, '#fff0d0', R * 0.3); c.strokeStyle = '#fff6e6'; c.lineWidth = Math.max(1, R * 0.05); c.beginPath(); c.arc(x, y, R * 1.03, 0, Math.PI * 2); c.stroke(); c.restore();
  c.fillStyle = '#000000'; c.beginPath(); c.arc(x, y, R, 0, Math.PI * 2); c.fill();
  ring(true);
}
// Phase 3 of the final battle: the titan's remains orbit a black hole that drinks in debris.
function drawSingularity(c, e, t, ps) {
  const y = -168, R = 42 * (ps.sx || 1), r = seeded(77);
  for (let i = 0; i < 36; i++) {
    const a0 = r() * 6.283, r0 = 90 + r() * 120, sp = 0.4 + r() * 0.8, k = (t * 0.00012 * sp + r()) % 1;
    const rad = r0 * (1 - k) + R * k, a = a0 + k * 4;
    c.save(); c.globalAlpha = 0.25 + 0.6 * k; c.fillStyle = i % 3 ? '#ffb46a' : '#c49aff';
    c.translate(Math.cos(a) * rad, y + Math.sin(a) * rad * 0.45); c.rotate(a + 1.4); c.fillRect(-3 - k * 6, -0.7, 6 + k * 12, 1.4); c.restore();
  }
  blackHole(c, 0, y, R, t);
  // what is left of the titan's crown, circling the drain
  for (let i = 0; i < 5; i++) {
    const a = t * 0.0008 + i * 1.26, x = Math.cos(a) * 118, yy = y + Math.sin(a) * 34, k = 0.8 + 0.3 * Math.sin(a);
    P(c, [x - 6 * k, yy - 8 * k, x + 5 * k, yy - 11 * k, x + 8 * k, yy + 4 * k, x - 4 * k, yy + 7 * k], '#1c1630', 1.2);
    c.save(); glowOn(c, '#c46aff', 6); L(c, [x - 4 * k, yy - 6 * k, x + 5 * k, yy - 8 * k], '#c46aff', 0.8); c.restore();
  }
}
// The star chart's sector view: five worlds on a route, and the Hollow sized by how far it has spread.
function drawSector(cv, t) {
  const w = 720, h = 200, c = hiDpi(cv, w, h), st = S, rot = st.rot || 0;
  const bg = c.createLinearGradient(0, 0, w, 0); bg.addColorStop(0, '#0a0610'); bg.addColorStop(1, '#14060e'); c.fillStyle = bg; c.fillRect(0, 0, w, h);
  const r = seeded(5); c.fillStyle = '#ffffff';
  for (let i = 0; i < 120; i++) { const x = r() * w, y = r() * h, ph = r() * 6, sz = r() * 1.4 + 0.4; c.globalAlpha = 0.15 + 0.5 * Math.abs(Math.sin(t * 0.001 + ph)); c.fillRect(x, y, sz, sz); }
  c.globalAlpha = 1;
  nebula(c, 120, 60, 160, 'rgba(212,20,46,0.08)');
  const sealed = st.done && st.final === 'rim', bound = st.done && !sealed;
  const R = sealed ? 0 : bound ? 12 : 16 + rot * 0.42, hx = 650, hy = 98;
  const pos = [[70, 112], [180, 72], [290, 124], [400, 78], [510, 112]];
  c.save(); c.setLineDash([3, 5]); c.strokeStyle = 'rgba(229,57,74,0.45)'; c.lineWidth = 1.2; c.beginPath(); pos.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.stroke(); c.restore();
  if (R && !bound) for (const [x, y] of pos) {
    const k = rot / 100 * (x / hx), gr = c.createLinearGradient(x, y, hx, hy);
    gr.addColorStop(0, `rgba(255,140,80,${0.04 + 0.35 * k})`); gr.addColorStop(1, 'rgba(255,140,80,0)');
    c.strokeStyle = gr; c.lineWidth = 2 + 7 * k; c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo((x + hx) / 2, y - 26, hx, hy); c.stroke();
  }
  if (R) blackHole(c, hx, hy, R, t);
  if (bound) { c.save(); glowOn(c, '#e8c25a', 8); c.strokeStyle = '#e8c25a'; c.lineWidth = 1.4; for (let i = 0; i < 3; i++) { c.beginPath(); c.ellipse(hx, hy, R * 2.4, R * 0.9, t * 0.0004 + i * 1.05, 0, Math.PI * 2); c.stroke(); } c.restore(); }
  if (sealed) { nebula(c, hx, hy, 70, 'rgba(255,240,200,0.16)'); c.save(); glowOn(c, '#fff4d8', 16); P(c, [hx, hy - 10, hx + 2.4, hy - 2.4, hx + 10, hy, hx + 2.4, hy + 2.4, hx, hy + 10, hx - 2.4, hy + 2.4, hx - 10, hy, hx - 2.4, hy - 2.4], '#fff8e8', 0); c.restore(); }
  c.textAlign = 'center';
  pos.forEach(([x0, y], i) => {
    const pw = PLANETS[i], locked = i >= st.unlocked, k = R && !bound ? rot / 100 * (x0 / hx) : 0, x = x0 + k * 10, pr = 19;
    if (k > 0.05) { c.save(); c.globalAlpha = k; const tr = c.createLinearGradient(x, y, x + 40, y); tr.addColorStop(0, pw.globe[0]); tr.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = tr; c.beginPath(); c.ellipse(x + 16, y, 26, pr * 0.6, 0, 0, Math.PI * 2); c.fill(); c.restore(); }
    if (i === st.world) { c.save(); glowOn(c, '#e5394a', 10); c.strokeStyle = '#e5394a'; c.lineWidth = 1.6; c.beginPath(); c.arc(x, y, pr + 7 + Math.sin(t * 0.004) * 1.5, 0, Math.PI * 2); c.stroke(); c.restore(); }
    const gg = c.createRadialGradient(x - pr * 0.35, y - pr * 0.35, 1, x, y, pr); gg.addColorStop(0, locked ? '#2a2430' : pw.globe[0]); gg.addColorStop(1, locked ? '#0c0a10' : pw.globe[1]);
    c.fillStyle = gg; c.beginPath(); c.arc(x, y, pr, 0, Math.PI * 2); c.fill(); c.strokeStyle = INK; c.lineWidth = 1.6; c.stroke();
    if (st.bosses[i]) { c.save(); glowOn(c, '#6fdc8c', 6); L(c, [x - 5, y, x - 1, y + 4, x + 6, y - 5], '#6fdc8c', 2); c.restore(); }
    c.font = '600 11px "Chakra Petch", sans-serif'; c.fillStyle = locked ? '#6a5a62' : '#f1ecef'; c.fillText(locked ? '???' : pw.name, x, y + pr + 16);
  });
  c.textAlign = 'right'; c.font = '600 11px "Chakra Petch", sans-serif'; c.fillStyle = sealed ? '#fff0c8' : '#ff9a7a';
  c.fillText(sealed ? 'THE EDGE · SEALED' : bound ? 'THE HOLLOW · SLEEPING' : 'THE HOLLOW', w - 12, h - 12);
}

// Enemies face left. ps is the battle pose: { dx, dy, lean, sx, sy, arm, smear, smearT }.
function drawEnemyPosed(c, e, x, y, s, t, ps = {}) {
  if (e.kind === 'humanoid') { drawKnight(c, x, y, s * 0.98, { armor: armorStyle(e.armor), look: e.look, weapon: e.weapon, flip: true, pose: ps }, t); return; }
  c.save(); c.translate(x, y); c.rotate(-(ps.lean || 0)); c.scale(ps.sx || 1, ps.sy || 1); c.translate(-x, -y);
  if (huge(e)) { c.translate(x, y); c.scale(s, s); c.lineJoin = 'round'; c.lineCap = 'round'; (e.kind === 'singularity' ? drawSingularity : drawTitan)(c, e, t, ps); }
  else drawEnemy(c, e, x, s, t, 0, y);
  c.restore();
}

function drawPortrait(cv, hl, size) {
  paintBust(cv, bustFromLook(hl), size, size, performance.now(), size <= 64 ? 'face' : null);
}

let raf = 0, last = 0;
function shieldHex(c, x, y, rad, t) {
  const pts = []; for (let i = 0; i < 6; i++) { const a = Math.PI / 6 + i * Math.PI / 3; pts.push(x + Math.cos(a) * rad * 0.75, y + Math.sin(a) * rad); }
  c.save(); c.globalAlpha = 0.35 + 0.15 * Math.sin(t * 0.005); glowOn(c, '#5ad1e6', 10);
  P(c, pts, 'rgba(90,209,230,0.08)', 0); L(c, [...pts, pts[0], pts[1]], '#5ad1e6', 1.4); c.restore();
}
const actorPose = a => ({ arm: a.arm, lean: a.lean, crouch: a.crouch, smear: a.smear, smearT: a.smearT, aura: a.aura, sx: a.sx, sy: a.sy });
// Offscreen box for each enemy size: w/h of the sprite canvas and where its feet sit.
function enemyBox(e) {
  if (huge(e)) return { w: 640, h: 330, ax: 340, ay: 312, s: 0.95 };
  if (e.big) return { w: 460, h: 330, ax: 230, ay: 312, s: 1.25 * 1.45 };
  return { w: 360, h: 270, ax: 180, ay: 250, s: 1.25 };
}
function loop(t) {
  raf = 0;
  const cv = document.getElementById('battleCanvas');
  if (!cv || !B) return;
  const rdt = Math.min(50, t - (last || t)); last = t;
  let dt = rdt;
  if (B.hitstop > 0) { B.hitstop -= rdt; dt = 0; }
  stepTweens(dt);
  const c = hiDpi(cv, W, H), a = B.anim, pa = B.act.p, ea = B.act.e;
  for (const act of [pa, ea, B.act.l]) {
    act.kb *= Math.pow(0.84, dt / 16);
    if (act.smear != null && !act.swinging) { act.smearT = Math.max(0, act.smearT - dt / 180); if (act.smearT <= 0) act.smear = null; }
    if (dt > 0) { act.trail.unshift(act.dx); act.trail.length = Math.min(act.trail.length, 6); }
  }
  for (const k of ['pHit', 'eHit', 'flash']) a[k] = Math.max(0, a[k] - dt / (k === 'flash' ? 250 : 300));
  c.save();
  B.cam = Math.max(0, (B.cam || 0) - rdt / 260);
  if (B.cam > 0 && !RM) { const z = 1 + B.cam * 0.06, f = unitPos('e'); c.translate(f.x, f.y); c.scale(z, z); c.translate(-f.x, -f.y); }
  if (a.flash > 0 && !RM) c.translate((Math.random() - 0.5) * 9 * a.flash, (Math.random() - 0.5) * 7 * a.flash);
  drawBackdrop(c, B.world, t);
  const rim = SCENE_RIM[B.world];
  // Lyra, when she fights beside you
  if (B.ally) {
    const la = B.act.l; shadow(c, 112 + la.dx, 28);
    renderSprite(c, (s, ax, ay) => drawKnight(s, ax, ay, 1.22, { ...CAST.lyra(), pose: actorPose(la) }, t), { x: 112 + la.dx, y: GROUND + la.dy, w: 360, h: 260, ax: 150, ay: 240, rim,
      ghosts: la.ghost ? la.trail.slice(1, 5).map(d => d - la.dx) : null, ghostCol: '#fff27a' });
  }
  // hero
  const hx = 200 + pa.dx + pa.kb, hy = GROUND + pa.dy;
  shadow(c, 200 + pa.dx, 34 * (1 - Math.min(0.5, -pa.dy / 120)));
  if (B.p.hp > 0 || B.over?.result !== 'lost') {
    const hl = heroLook();
    renderSprite(c, (s, ax, ay) => drawKnight(s, ax, ay, 1.4, { ...hl, pose: actorPose(pa) }, t), {
      x: hx, y: hy, w: 360, h: 260, ax: 150, ay: 240, rim, flash: a.pHit > 0.4 ? (a.pHit - 0.4) / 0.6 : 0,
      ghosts: pa.ghost ? pa.trail.slice(1, 5).map(d => d - pa.dx) : null, ghostCol: WEAPON_GLOW[hl.weapon] || '#9ad8ff' });
  }
  if (B.p.fx.shield) shieldHex(c, hx, GROUND - 76 + pa.dy, 82, t);
  // enemy
  const box = enemyBox(B.e), ex = 520 + ea.dx + ea.kb, die = a.eDie > 0 ? (a.eDie = Math.min(1, a.eDie + dt / 800)) : 0;
  const ey = GROUND + ea.dy + die * 18;
  if (B.e.charging && die === 0) {
    // a telegraphed attack: a pulsing red corona behind the enemy
    const u = unitPos('e'), k = 0.6 + 0.4 * Math.sin(t * 0.012), rr = huge(B.e) ? 170 : 100 * (B.e.big ? 1.4 : 1);
    const g = c.createRadialGradient(u.x, u.y, 4, u.x, u.y, rr); g.addColorStop(0, 'rgba(255,60,80,0)'); g.addColorStop(0.6, `rgba(255,60,80,${0.28 * k})`); g.addColorStop(1, 'rgba(255,60,80,0)');
    c.fillStyle = g; c.fillRect(u.x - rr, u.y - rr, rr * 2, rr * 2);
  }
  shadow(c, 520 + ea.dx, (huge(B.e) ? 90 : 44 * (B.e.big ? 1.45 : 1)) * (1 - die));
  if (die < 1) renderSprite(c, (s, ax, ay) => drawEnemyPosed(s, B.e, ax, ay, box.s, t, actorPose(ea)), {
    x: ex, y: ey, w: box.w, h: box.h, ax: box.ax, ay: box.ay, alpha: 1 - die,
    rim: B.phase === 2 ? '#ff5aa8' : rim, flash: a.eHit > 0.4 ? (a.eHit - 0.4) / 0.6 : die > 0 ? 0.6 * (1 - die) : 0,
    ghosts: ea.ghost ? ea.trail.slice(1, 5).map(d => d - ea.dx) : null, ghostCol: (B.e.col && B.e.col[1]) || '#ff8a7a' });
  if (B.e.fx.shield && die === 0) { const u = unitPos('e'); shieldHex(c, u.x, u.y, huge(B.e) ? 150 : 96 * (B.e.big ? 1.45 : 1), t); }
  if (B.hazard > 0) for (let i = 0; i < 9; i++) {
    const x = 60 + ((i * 97 + t * 0.03) % 320), y = ((t * 0.22 + i * 61) % (GROUND + 30)) - 20, z = 3 + (i % 3) * 2;
    P(c, [x - z, y, x, y - z, x + z, y + z * 0.4, x - z * 0.3, y + z], '#2a2236', 1);
  }
  drawVfx(c, dt);
  drawForeground(c, B.world, t);
  if (a.flash > 0) { c.fillStyle = `rgba(255,255,255,${a.flash * 0.28})`; c.fillRect(-20, -20, W + 40, H + 40); }
  // floating numbers pop in, then rise and fade
  c.textAlign = 'center';
  B.fl = B.fl.filter(f => (f.t += dt / 1000) < 1.1);
  for (const f of B.fl) {
    const u = f.side === 'p' ? 200 + pa.dx : 520 + ea.dx, x = u + f.dx, y = GROUND - (f.side === 'e' && huge(B.e) ? 250 : 150) - f.t * 50;
    const pop = 1 + 0.7 * Math.max(0, 1 - f.t * 7), big = /CRIT/.test(f.text) ? 1.3 : 1;
    c.font = `700 ${Math.round(22 * pop * big)}px "Chakra Petch", sans-serif`;
    c.globalAlpha = clamp(1.4 - f.t * 1.3, 0, 1);
    c.lineWidth = 4; c.strokeStyle = 'rgba(0,0,0,0.75)'; c.strokeText(f.text, x, y);
    c.fillStyle = f.color.startsWith('var') ? '#6fdc8c' : f.color; c.fillText(f.text, x, y);
  }
  c.restore();
  raf = requestAnimationFrame(loop);
}

let ambient = false;
const PENDING_KEY = 'starbreaker-look-v1';
function loadPending() { try { return JSON.parse(localStorage.getItem(PENDING_KEY)) || null; } catch (e) { return null; } }
function savePending(v) { try { localStorage.setItem(PENDING_KEY, JSON.stringify(v)); } catch (e) {} }
const OUTFITS = [null, ['a_vest', 'w_rust', null], ['a_alloy', 'w_ion', 'x_scope'], ['a_cara', 'w_lance', 'x_boots'], ['a_aegis', 'w_grav', 'x_heart'], ['a_magma', 'w_nova', 'x_lens'], ['a_void', 'w_star', 'x_sigil']];
// The hero as the main menu shows it: the game in play, else the saved game, else the look set up for the next game.
function menuHero() {
  if (S) return heroLook();
  const sv = loadSaved();
  if (sv && sv.equip) return { armor: armorStyle(ARMOR_LOOK[sv.equip.armor] || ARMOR_LOOK.a_vest), weapon: sv.equip.weapon, acc: sv.equip.acc, look: sv.look || DEFAULT_LOOK };
  return { armor: armorStyle(ARMOR_LOOK.a_vest), weapon: 'w_rust', acc: null, look: (loadPending() || {}).look || DEFAULT_LOOK };
}
function draftHero() {
  const o = OUTFITS[U.outfit || 0];
  const base = o ? { armor: armorStyle(ARMOR_LOOK[o[0]]), weapon: o[1], acc: o[2] } : menuHero();
  return { ...base, look: U.draft };
}
function ambientLoop() {
  ambient = false;
  const t = performance.now();
  const tc = document.getElementById('titleCanvas');
  if (tc) {
    const w = 720, h = 360, c = hiDpi(tc, w, h);
    runeBg(c, w, h, t);
    c.save(); c.translate(424, 0); c.scale(0.9, 0.9); drawBust(c, bustSpec('lyra'), t); c.restore();
    const fade = c.createLinearGradient(380, 0, 470, 0); fade.addColorStop(0, 'rgba(5,3,5,0.7)'); fade.addColorStop(1, 'rgba(5,3,5,0)');
    c.save(); c.textAlign = 'left';
    const tg = c.createLinearGradient(0, 120, 0, 186); tg.addColorStop(0, '#ffffff'); tg.addColorStop(0.45, '#c9cdd8'); tg.addColorStop(0.55, '#7d8294'); tg.addColorStop(1, '#eef0f6');
    c.font = '700 64px "Chakra Petch", sans-serif'; c.lineWidth = 6; c.strokeStyle = '#2a0008'; c.strokeText('STARBREAKER', 36, 180);
    c.fillStyle = tg; c.fillText('STARBREAKER', 36, 180);
    glowOn(c, '#d4142e', 12); c.fillStyle = '#d4142e'; c.fillRect(40, 192, 360, 3); P(c, [400, 190, 418, 193.5, 400, 197], '#d4142e', 0); glowOff(c);
    c.font = '600 18px "Chakra Petch", sans-serif'; c.fillStyle = '#ff4a5e'; c.fillText('S  A  G  A', 42, 222);
    c.restore();
  }
  const cc = document.getElementById('createCanvas');
  if (cc && U.draft) {
    const w = 240, h = 300, c = hiDpi(cc, w, h);
    const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#2a0a12'); g.addColorStop(1, '#070508');
    c.fillStyle = g; c.fillRect(0, 0, w, h);
    nebula(c, 120, 120, 140, 'rgba(196,106,255,0.12)');
    const sg = c.createRadialGradient(112, h - 16, 1, 112, h - 16, 60); sg.addColorStop(0, 'rgba(0,0,0,0.5)'); sg.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = sg; c.fillRect(40, h - 40, 150, 40);
    const hl = draftHero();
    renderSprite(c, (s, ax, ay) => drawKnight(s, ax, ay, 2.0, hl, t), { x: 104, y: h - 16, w: 240, h: 300, ax: 104, ay: 284, rim: '#c8b8ff', outline: 2.4 });
    const pc = document.getElementById('createPortrait'); if (pc) drawPortrait(pc, hl, 150);
  }
  const hc = document.getElementById('hubHero');
  if (hc && S) {
    const c = hiDpi(hc, 96, 120); c.clearRect(0, 0, 96, 120);
    const sg = c.createRadialGradient(44, 112, 1, 44, 112, 36); sg.addColorStop(0, 'rgba(0,0,0,0.5)'); sg.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = sg; c.fillRect(0, 96, 96, 24);
    renderSprite(c, (s, ax, ay) => drawKnight(s, ax, ay, 0.86, heroLook(), t), { x: 42, y: 112, w: 110, h: 124, ax: 42, ay: 116, rim: SCENE_RIM[S.world], outline: 1.4 });
  }
  const hall = document.getElementById('hallCanvas');
  if (hall && S) drawHall(hall, t);
  const sec = document.getElementById('sectorCanvas');
  if (sec && S) drawSector(sec, t);
  const kp = document.getElementById('keeperPortrait');
  if (kp) paintBust(kp, bustSpec(kp.dataset.id), 150, 170, t, null, kp.dataset.id === 'keeper' ? '#2ab8b0' : null);
  if ((tc || cc || hc || hall || sec || kp) && !ambient) { ambient = true; requestAnimationFrame(ambientLoop); }
}

