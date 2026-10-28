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
const SCENES = ['colony', 'hive', 'station', 'forge', 'void'];
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
};

function drawBackdrop(c, w, t) {
  const i = PLANETS.indexOf(w), kind = SCENES[i];
  const sc = bgCache[i] || (bgCache[i] = buildScene(i));
  c.drawImage(sc.back, 0, 0, W, H);
  const r = seeded(i * 97 + 13);
  c.fillStyle = '#ffffff';
  for (let k = 0; k < 90; k++) {
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

function shadow(c, x, rx) {
  const g = c.createRadialGradient(x, GROUND + 3, 1, x, GROUND + 3, rx);
  g.addColorStop(0, 'rgba(0,0,0,0.55)'); g.addColorStop(1, 'rgba(0,0,0,0)');
  c.fillStyle = g; c.save(); c.translate(x, GROUND + 3); c.scale(1, 0.22); c.beginPath(); c.arc(0, 0, rx, 0, Math.PI * 2); c.restore(); c.fill();
}

/* ---------- Combat effects ---------- */
function unitPos(side) { return side === 'p' ? { x: 200, y: GROUND - 78 } : { x: 520, y: GROUND - 82 * (B && B.e.big ? 1.45 : 1) }; }
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
  gear: [['visor', 'Visor helm'], ['knight', 'Open helm'], ['horned', 'Horned helm'], ['crest', 'Plumed helm'], ['hood', 'Hood'], ['circlet', 'Circlet'], ['mask', 'Rebreather'], ['none', 'Bare head']],
  hair: [['short', 'Short'], ['long', 'Long'], ['mohawk', 'Mohawk'], ['tail', 'Ponytail'], ['braids', 'Braids'], ['topknot', 'Topknot'], ['shaved', 'Shaved']],
  beard: [['none', 'None'], ['stubble', 'Stubble'], ['goatee', 'Goatee'], ['moustache', 'Moustache'], ['full', 'Full beard']],
  mark: [['none', 'None'], ['scar', 'Scar'], ['paint', 'War paint'], ['tattoo', 'Circuit tattoo'], ['patch', 'Eye patch']],
};
const DEFAULT_LOOK = { gear: 'knight', skin: 1, hair: 'short', hairCol: 1, eyes: 0, beard: 'stubble', mark: 'scar' };
const pal = (v, list) => typeof v === 'number' ? list[v % list.length] : v;

// How each armour piece looks on the body. Enemy knights pass their own objects in the same shape.
const ARMOR_LOOK = {
  a_vest:  { base: '#8a6a48', trim: '#3a2a1e', pauldron: 'pad', cloth: true, scarf: '#9a3a2a' },
  a_alloy: { base: '#8a93a3', trim: '#4a505c', pauldron: 'plate', cape: '#7a2a34' },
  a_cara:  { base: '#4f6a3e', trim: '#c9b46a', pauldron: 'spiky', cape: '#5a4a2a', spike: '#d8cfa8' },
  a_aegis: { base: '#c2ccdc', trim: '#3a6ad0', pauldron: 'layered', cape: '#2a3a8a', rivet: '#e8c25a' },
  a_magma: { base: '#3a2e2c', trim: '#ff7a2a', glow: '#ff7a2a', seams: true, pauldron: 'spiky', cape: '#4a1a12', spike: '#5a4440' },
  a_void:  { base: '#2e2448', trim: '#c46aff', glow: '#c46aff', stars: true, pauldron: 'layered', cape: '#1a1030', capeLong: true },
};
function armorStyle(a) { return { dark: shade(a.base, -38), light: shade(a.base, 42), ...a }; }

function headPath(c) {
  c.beginPath(); c.moveTo(-7, -3);
  c.quadraticCurveTo(-8, -11.5, 0, -11.5); c.quadraticCurveTo(7, -11.5, 8.5, -5);
  c.lineTo(8.7, -2.6); c.lineTo(10.6, 1); c.lineTo(8.7, 2); c.lineTo(9.1, 3.9); c.lineTo(8.1, 5.1); c.lineTo(8.4, 7);
  c.quadraticCurveTo(7.2, 9.6, 3, 9.6); c.lineTo(-2, 6.6); c.quadraticCurveTo(-6, 4, -7, -3); c.closePath();
}
const HAIR_CAP = [-7.6, -2, -8.4, -9, -3.4, -13, 3.5, -12.8, 8.9, -7.4, 7.4, -5.6, 5.6, -7.4, 3.6, -5.8, 1.6, -7.8, -1.2, -6, -3.6, -4.2, -5, -1];

// Head in local space: centre (0,0), facing right, about 22 units tall.
function drawHead(c, look, A, acc, t) {
  look = { ...DEFAULT_LOOK, ...look };
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
    return;
  }

  // Face
  headPath(c); c.fillStyle = skin; c.fill();
  c.save(); headPath(c); c.clip();
  c.fillStyle = shade(skin, -26); c.beginPath(); c.moveTo(-9, -14); c.lineTo(0.5, -14); c.lineTo(-1.5, 12); c.lineTo(-9, 12); c.fill();
  P(c, [2.6, 4, 8.2, 7.4, 7.6, 9.6, 2, 9.4, -1, 6.6], shade(skin, -14), 0);
  P(c, [6, -6, 8.4, -5, 8.6, -2.6, 6.2, -3], shade(skin, 20), 0);
  P(c, [4.6, 0.6, 7.4, 0.4, 6.4, 2.6], shade(skin, 12), 0);
  c.restore();
  headPath(c); c.lineWidth = 1.3; c.strokeStyle = INK; c.stroke();
  L(c, [8.6, -2.4, 9.8, 0.8], shade(skin, -32), 0.6);
  c.fillStyle = shade(skin, -55); c.fillRect(8.6, 1.1, 0.8, 0.6);
  P(c, [7.3, 3.8, 9.1, 3.9, 8.6, 4.9, 7.5, 4.8], shade(skin, -38), 0);
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
      c.save(); headPath(c); c.clip(); c.globalAlpha = 0.3; c.fillStyle = hair; c.fillRect(-9, -14, 18, 9); c.fillRect(-9, -14, 5, 16); c.restore();
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
  } else if (g === 'hood') {
    c.save(); headPath(c); c.clip(); c.fillStyle = 'rgba(5,3,12,0.3)'; c.fillRect(-10, -14, 22, 26); c.restore();
    const hc = A.cape || shade(A.base, -8);
    P(c, [-9.6, 12, -10.8, -5, -4.6, -14.8, 4.8, -14, 10.8, -7, 10.4, -3.8, 5, -6.4, 3, -2.4, 3.4, 6, 0.6, 12], hc);
    P(c, [-4.6, -14.8, 4.8, -14, 10.8, -7, 7, -8, 1, -11.4], shade(hc, 30), 0);
    L(c, [10.4, -3.8, 5, -6.4, 3, -2.4, 3.4, 6, 0.6, 12], shade(hc, -35), 1.4);
    L(c, [-6, -10, -8, 4], shade(hc, -30), 0.8); L(c, [-2, -12, -4, 8], shade(hc, -25), 0.6);
  }
}

function pauldron(c, x, y, A, back) {
  const f = back ? A.dark : A.base, li = back ? A.base : A.light;
  const kind = A.pauldron;
  if (kind === 'pad') {
    P(c, [x - 6, y - 3, x + 5, y - 4.5, x + 8.4, y + 3, x + 5, y + 8, x - 5, y + 7, x - 8, y + 2], f);
    L(c, [x - 5, y + 2, x + 6, y + 1.5], shade(f, -30), 0.7);
    return;
  }
  if (kind === 'layered') {
    for (let i = 2; i >= 0; i--) {
      const o = i * 4;
      P(c, [x - 8, y - 2 + o, x - 2, y - 7 + o, x + 8, y - 6 + o, x + 11, y + 1 + o, x + 7, y + 5 + o, x - 7, y + 4 + o], i ? f : li);
      L(c, [x - 7, y + 4 + o, x + 7, y + 5 + o, x + 11, y + 1 + o], A.glow || A.trim, 1);
    }
    if (A.rivet) { c.fillStyle = A.rivet; c.fillRect(x - 4, y - 3, 1.6, 1.6); c.fillRect(x + 5, y - 3, 1.6, 1.6); }
    return;
  }
  if (kind === 'spiky') {
    const sp = A.spike || li;
    P(c, [x - 5, y - 4, x - 4, y - 15, x, y - 5], sp);
    P(c, [x + 1, y - 6, x + 5, y - 17, x + 6.4, y - 5], sp);
  }
  P(c, [x - 8, y - 1, x - 3, y - 6.4, x + 6, y - 6.6, x + 10.4, y + 1, x + 9, y + 9, x - 6, y + 8], f);
  P(c, [x - 3, y - 5.6, x + 6, y - 5.8, x + 9.4, y + 1, x + 2, y], li, 0);
  L(c, [x - 6, y + 8, x + 9, y + 9], A.glow || A.trim, 1.2);
}

// Weapons are drawn around the grip, blade pointing up (-y). The caller rotates.
function drawWeapon(c, id, A, t) {
  switch (id) {
    case 'w_ion':
      P(c, [-1.8, -4, 1.8, -4, 1.8, 6, -1.8, 6], '#3a3f4a');
      for (const y of [-1, 1.5, 4]) L(c, [-1.8, y, 1.8, y], '#8a93a3', 0.6);
      P(c, [-2.8, -7, 2.8, -7, 2.2, -4, -2.2, -4], '#9aa3b3');
      glowOn(c, '#5ad1e6', 14);
      P(c, [-1.9, -7.5, 1.9, -7.5, 1.9, -50, 0, -54, -1.9, -50], '#5ad1e6', 0);
      glowOff(c);
      P(c, [-0.7, -7.5, 0.7, -7.5, 0.7, -50, 0, -52, -0.7, -50], '#effcff', 0);
      break;
    case 'w_lance':
      P(c, [-1.3, 24, 1.3, 24, 1.3, -56, -1.3, -56], '#3e434e');
      for (const y of [-6, -2, 2, 6]) L(c, [-1.3, y, 1.3, y - 1.4], '#c9a24a', 0.8);
      P(c, [-3.2, -56, 3.2, -56, 2.2, -61, -2.2, -61], '#c9a24a');
      P(c, [-2.4, -61, -7, -67, -5.4, -59], '#d4dbe6', 1); P(c, [2.4, -61, 7, -67, 5.4, -59], '#d4dbe6', 1);
      P(c, [0, -82, 4.6, -69, 2.4, -61, -2.4, -61, -4.6, -69], '#dfe6f0');
      P(c, [0, -82, 4.6, -69, 2.4, -61, 0, -62], '#ffffff', 0);
      glowOn(c, '#fff27a', 10);
      for (let i = 0; i < 3; i++) {
        const a0 = Math.random() * Math.PI * 2;
        L(c, [0, -72, Math.cos(a0) * 6, -72 + Math.sin(a0) * 6, Math.cos(a0 + 0.6) * 11, -72 + Math.sin(a0 + 0.6) * 11], '#fff27a', 0.9);
      }
      glowOff(c);
      break;
    case 'w_grav':
      P(c, [-1.6, -2, 1.6, -2, 1.6, 8, -1.6, 8], '#2a2a33');
      P(c, [-4.4, -4.6, 4.4, -4.6, 4.4, -1, -4.4, -1], '#5a5a6a');
      P(c, [-3, -4.6, 10, -6.6, 13.6, -44, 4, -51, -3.4, -46], '#555b70');
      P(c, [10, -6.6, 13.6, -44, 11.2, -44.4, 7.8, -7.4], '#c0c8e0', 0);
      L(c, [-1, -8, 0, -44], '#3a3f52', 1);
      glowOn(c, '#b48cff', 10);
      for (const y of [-14, -25, -36]) P(c, [4, y - 3, 6.4, y, 4, y + 3, 1.6, y], '#c9a8ff', 0);
      glowOff(c);
      break;
    case 'w_nova': {
      P(c, [-1.6, -3, 1.6, -3, 1.6, 8, -1.6, 8], '#2a1a1a');
      for (const y of [-1, 2, 5]) L(c, [-1.6, y, 1.6, y + 2], '#c9a24a', 0.6);
      P(c, [-3.6, -4.4, 0, -6, 3.6, -4.4, 0, -2.8], '#c9a24a');
      const g = c.createLinearGradient(0, -5, 0, -54); g.addColorStop(0, '#ff6a2a'); g.addColorStop(0.6, '#ffc46a'); g.addColorStop(1, '#ffffff');
      glowOn(c, '#ff9a3a', 14);
      c.beginPath(); c.moveTo(-1.8, -5); c.quadraticCurveTo(-2.4, -32, 7, -55); c.lineTo(5, -49); c.quadraticCurveTo(1.6, -30, 1.8, -5); c.closePath();
      c.fillStyle = g; c.fill(); glowOff(c); c.lineWidth = 1; c.strokeStyle = INK; c.stroke();
      break;
    }
    case 'w_star':
      P(c, [-1.8, -3, 1.8, -3, 1.8, 10, -1.8, 10], '#26264a');
      P(c, [-2.6, 10, 2.6, 10, 0, 14], '#3a8aff', 1);
      P(c, [-11, -6.6, -4, -3.6, 4, -3.6, 11, -6.6, 8.6, -1, 0, -2, -8.6, -1], '#e8c25a');
      P(c, [-11, -6.6, -14, -11, -7, -5.4], '#e8c25a', 1); P(c, [11, -6.6, 14, -11, 7, -5.4], '#e8c25a', 1);
      P(c, [-3.4, -4, 3.4, -4, 3.8, -54, 0, -64, -3.8, -54], '#dfe6f2');
      P(c, [0, -4, 3.4, -4, 3.8, -54, 0, -64], '#ffffff', 0);
      glowOn(c, '#9ad8ff', 12); P(c, [-0.9, -9, 0.9, -9, 0.9, -50, -0.9, -50], '#9ad8ff', 0); glowOff(c);
      P(c, [0, -6, 1.8, -4, 0, -2, -1.8, -4], '#3a8aff', 0.8);
      break;
    case 'gun':
      P(c, [-3, 4, 3, 4, 3.6, 13, -2.6, 12], '#2a2d34');
      P(c, [-2.8, 6, 2.8, 6, 2.8, -22, -2.8, -22], '#3a3e48');
      P(c, [-2.8, 6, -1, 6, -1, -22, -2.8, -22], '#5a606e', 0);
      P(c, [2.8, -10, 7.4, -8, 7, -2, 2.8, -3], '#22252c');
      P(c, [-1.1, -22, 1.1, -22, 1.1, -36, -1.1, -36], '#1e2026');
      P(c, [-6.4, -16, -2.8, -16, -2.8, -6, -6.4, -6], '#22252c');
      glowOn(c, A.trim, 6); c.fillStyle = A.trim; c.fillRect(-5.8, -14.6, 2.4, 2); glowOff(c);
      break;
    case 'axe':
      P(c, [-1.4, 16, 1.4, 16, 1.4, -46, -1.4, -46], '#4a3424');
      P(c, [-1, -41, -7, -38, -1, -35], '#5a5a62');
      P(c, [1, -46, 8, -52, 15.6, -45, 16.6, -34, 9, -28, 1, -32], '#4a4a52');
      P(c, [8, -50, 14.6, -44.6, 15.4, -35, 12, -36, 10, -46], '#7a7a86', 0);
      glowOn(c, A.glow || '#d8d8e0', 10); L(c, [8, -52, 15.6, -45, 16.6, -34, 9, -28], A.glow || '#d8d8e0', 1.6); glowOff(c);
      break;
    case 'sword': {
      const bl = A.blade || '#c9ccd6';
      P(c, [-1.6, -3, 1.6, -3, 1.6, 7, -1.6, 7], '#2a2a33');
      P(c, [-7, -4.6, 7, -4.6, 6, -2, -6, -2], A.trim);
      P(c, [-2.6, -4.6, 2.6, -4.6, 2.8, -48, 0, -55, -2.8, -48], bl);
      P(c, [0, -4.6, 2.6, -4.6, 2.8, -48, 0, -55], shade(bl, 30), 0);
      if (A.glow) { glowOn(c, A.glow, 10); L(c, [0, -8, 0, -46], A.glow, 1); glowOff(c); }
      break;
    }
    default: // w_rust
      P(c, [-1.6, 5, 1.6, 5, 2.2, 7.6, 0, 9, -2.2, 7.6], '#6a5a3a', 1);
      P(c, [-1.4, -2, 1.4, -2, 1.4, 5, -1.4, 5], '#4a3424', 1);
      P(c, [-6, -3.6, 6, -3.6, 5, -1.6, -5, -1.6], '#7a6a5a', 1);
      P(c, [-1.9, -3.6, 1.9, -3.6, 2.1, -36, 0, -41, -2.1, -36], '#958a7f', 1.2);
      P(c, [0, -4, 1.9, -4, 2.1, -36, 0, -41], '#b9aea0', 0);
      P(c, [-1.9, -14, 0, -15, 0.5, -11, -1.9, -10], '#8a4a24', 0);
      P(c, [0.5, -26, 2, -27, 2, -23, 1, -23], '#8a4a24', 0);
      P(c, [2.2, -20, 0.6, -19, 2.2, -18], INK, 0);
  }
}

// Full knight. Origin at the feet, facing right, about 110 units tall. o: { armor, weapon, look, acc, flip, swing }
function drawKnight(c, x, y, s, o, t) {
  const A = o.armor, look = o.look || DEFAULT_LOOK, wpn = o.weapon;
  c.save(); c.translate(x, y); c.scale(o.flip ? -s : s, s);
  c.lineJoin = 'round'; c.lineCap = 'round';
  const br = Math.sin(t * 0.004) * 1.1, wv = Math.sin(t * 0.003) * 3;
  const sw = o.swing || 0, swingRot = sw > 0 ? Math.sin((1 - sw) * Math.PI) * 1.5 : 0;

  if (A.cape) {
    const end = A.capeLong ? -1 : -16;
    P(c, [-10, -82 + br, 6, -83 + br, -3, -60, -12 + wv * 0.3, end - 2, -18 + wv, end + 3, -24 + wv, end - 2, -30 + wv * 1.2, end + 2, -28 + wv, -40, -19, -70], A.cape);
    L(c, [-13, -72, -21 + wv * 0.7, end + 1], shade(A.cape, -28), 1.2);
    L(c, [-6, -74, -12 + wv * 0.4, end], shade(A.cape, 22), 0.9);
    P(c, [-10, -82 + br, 6, -83 + br, 1, -77, -8, -76.4], shade(A.cape, -40), 0);
  }
  if (A.scarf) P(c, [-7, -86 + br, 3, -86 + br, -3, -80 + br, -18 + wv, -72, -21 + wv, -74, -14 + wv * 0.5, -79], A.scarf);
  if (o.acc === 'x_boots') {
    glowOn(c, '#5ad1e6', 10);
    for (const fx of [-18, 10]) { const f = 6 + Math.random() * 5; P(c, [fx - 2, -2, fx + 3, -2, fx, f], '#9fefff', 0); }
    glowOff(c);
  }

  // back arm and leg (in shadow)
  limb(c, -9, -77 + br, -15, -62 + br, 4.2, 3.6, A.dark);
  limb(c, -15, -62 + br, -11, -50 + br, 3.6, 3.2, A.dark);
  P(c, [-14, -53 + br, -8, -53 + br, -7.6, -47 + br, -13, -46.4 + br], shade(A.dark, -10));
  pauldron(c, -10, -80 + br, A, true);
  limb(c, -4, -46, -11, -25, 6, 5, A.dark);
  limb(c, -11, -25, -15, -5, 5, 3.8, A.dark);
  P(c, [-14, -29, -9, -29, -8, -22, -13, -21], A.base, 1);
  P(c, [-20, -6, -11, -6, -7, 0, -21, 0], shade(A.dark, -12));

  // torso
  const chest = [-12, -83 + br, 13, -84 + br, 17, -71 + br, 12, -52, -9, -52, -14, -69 + br];
  P(c, chest, A.base);
  P(c, [-12, -83 + br, -2, -83.6 + br, -3, -52, -9, -52, -14, -69 + br], A.dark, 0);
  P(c, [5, -82 + br, 13, -83 + br, 16, -71 + br, 9, -66 + br], A.light, 0);
  P(c, chest, null);
  if (A.cloth) {
    for (const yy of [-76, -68, -60]) L(c, [-12, yy + br * 0.5, 14, yy - 1 + br * 0.5], shade(A.base, -30), 0.7);
    P(c, [-12, -80 + br, -8, -82 + br, 15, -57, 11, -54], A.trim, 1);
  } else {
    L(c, [3, -82 + br, 2, -56], A.dark, 1);
    L(c, [-10, -58, 12, -58], A.trim, 1.1);
  }
  if (A.seams) { glowOn(c, A.glow, 10); L(c, [-6, -78 + br, -1, -72 + br, -4, -64, 2, -58], A.glow, 1.4); L(c, [8, -80 + br, 11, -70 + br, 7, -62], A.glow, 1.2); glowOff(c); }
  if (A.stars) { c.fillStyle = A.glow; for (const [sx, sy, ph] of [[-6, -76, 0], [8, -72, 2], [0, -62, 4], [-4, -66, 1]]) { c.globalAlpha = 0.4 + 0.6 * Math.abs(Math.sin(t * 0.002 + ph)); c.fillRect(sx, sy + br, 1.4, 1.4); } c.globalAlpha = 1; }
  if (o.acc === 'x_core') { glowOn(c, '#5ad1e6', 12); P(c, [2, -74 + br, 5.4, -72 + br, 5.4, -68 + br, 2, -66 + br, -1.4, -68 + br, -1.4, -72 + br], '#5ad1e6', 1); glowOff(c); }
  if (o.acc === 'x_sigil') { const pts = []; for (let i = 0; i < 10; i++) { const r = i % 2 ? 2 : 4.6, an = -Math.PI / 2 + i * Math.PI / 5; pts.push(2 + Math.cos(an) * r, -70 + br + Math.sin(an) * r); } P(c, pts, '#e8c25a', 0.9); }

  // waist, belt and tassets
  P(c, [-9, -53, 12, -53, 11, -46, -8, -46], A.dark);
  for (let mx = -7.6; mx < 10.6; mx += 2.2) for (const my of [-51.6, -49.6]) L(c, [mx, my, mx + 1.1, my + 1, mx + 2.2, my], shade(A.dark, 28), 0.5);
  P(c, [-9.6, -48.4, 12.6, -48.4, 12.6, -44.4, -9.6, -44.4], A.trim);
  if (o.acc === 'x_heart') { glowOn(c, '#ff3a5a', 6 + 6 * Math.abs(Math.sin(t * 0.004))); P(c, [3, -50, 6, -46.4, 3, -42.6, 0, -46.4], '#ff3a5a', 1); glowOff(c); }
  else P(c, [1, -49.2, 5, -49.2, 5, -43.6, 1, -43.6], '#e8c25a', 1);
  P(c, [-10.6, -47.6, -6.4, -47.6, -6.6, -41.4, -10.4, -41.6], '#4a3424', 1);
  L(c, [-10.4, -45.4, -6.5, -45.4], '#6a4a30', 0.6);
  P(c, [-9, -44.4, 0.6, -44.4, -0.4, -35, -10.4, -37], A.base);
  P(c, [1.6, -44.4, 12.6, -44.4, 14, -36.4, 3, -34.8], A.cloth ? A.base : A.light);

  // front leg
  limb(c, 5, -46, 11, -25, 6.4, 5.2, A.base, A.light);
  limb(c, 11, -25, 13, -5, 5.2, 4, A.base, A.light);
  P(c, [7.6, -29.6, 14.4, -28.6, 15.4, -21.6, 8.6, -20.6], A.light);
  if (A.seams) { glowOn(c, A.glow, 8); L(c, [9, -42, 11, -34, 9, -30], A.glow, 1.1); glowOff(c); }
  P(c, [8.6, -6.4, 16.6, -6.4, 23.4, -1.4, 23.4, 0, 8.6, 0], A.base);
  P(c, [10, -6, 16, -6, 20, -3, 10, -3], A.light, 0);
  L(c, [15.6, -6, 16.6, 0], A.dark, 0.7); L(c, [19.4, -3.8, 20.2, 0], A.dark, 0.7);

  // head
  c.save(); c.translate(2, -96.5 + br); drawHead(c, look, A, o.acc, t); c.restore();

  // weapon arm and front pauldron
  const gun = wpn === 'gun', lance = wpn === 'w_lance';
  const hx = gun ? 26 : 27, hy = (gun ? -60 : -55) + br;
  const base = gun ? Math.PI / 2 : lance ? 0.9 : 0.35;
  c.save(); c.translate(hx, hy); c.rotate(base + (gun ? -swingRot * 0.15 : swingRot)); drawWeapon(c, wpn, A, t); c.restore();
  limb(c, 13, -77 + br, 20, -63 + br, 4.4, 3.8, A.base, A.light);
  limb(c, 20, -63 + br, hx, hy, 3.8, 3.4, A.base, A.light);
  P(c, [17.2, -65.4 + br, 21.2, -67 + br, 23.4, -62 + br, 19.4, -60 + br], A.light, 1);
  P(c, [hx - 3.6, hy - 3.6, hx + 3.4, hy - 3.8, hx + 4, hy + 3, hx - 3, hy + 3.4], A.light);
  L(c, [hx + 1.6, hy - 3.4, hx + 2.2, hy + 2.8], A.dark, 0.6); L(c, [hx - 0.6, hy - 3.4, hx - 0.2, hy + 3], A.dark, 0.6);
  pauldron(c, 12, -80 + br, A, false);
  if (o.acc === 'x_lens') {
    const oy = -104 + Math.sin(t * 0.003) * 3;
    glowOn(c, '#9ad8ff', 12); P(c, [-22, oy - 5, -18.6, oy, -22, oy + 5, -25.4, oy], '#9ad8ff', 1); glowOff(c);
    P(c, [-22, oy - 5, -18.6, oy, -22, oy], '#e8f8ff', 0);
  }
  c.restore();
}

function heroLook() {
  const s = S || {};
  const eq = s.equip || { weapon: 'w_rust', armor: 'a_vest', acc: null };
  return { armor: armorStyle(ARMOR_LOOK[eq.armor] || ARMOR_LOOK.a_vest), weapon: eq.weapon, acc: eq.acc, look: s.look || DEFAULT_LOOK };
}

/* ---------- Enemies (all face left, toward the hero) ---------- */
function drawEnemy(c, e, x, s, t, swing) {
  const [a, b] = e.col || ['#666666', '#ffffff'], k = e.kind, bob = Math.sin(t * 0.004) * 3;
  if (k === 'humanoid') { drawKnight(c, x, GROUND, s * 0.98, { armor: armorStyle(e.armor), look: e.look, weapon: e.weapon, flip: true, swing }, t); return; }
  c.save(); c.lineJoin = 'round'; c.lineCap = 'round';
  switch (k) {
    case 'drone': {
      c.translate(x, GROUND - 92 * s + bob * 2); c.scale(s, s);
      const fl = 12 + Math.random() * 5, g = c.createLinearGradient(0, 10, 0, 10 + fl * 2);
      g.addColorStop(0, b); g.addColorStop(1, 'rgba(0,0,0,0)');
      P(c, [-6, 10, 6, 10, 2, 10 + fl * 2, -2, 10 + fl * 2], g, 0);
      for (const sx of [-1, 1]) {
        P(c, [sx * 10, -12, sx * 28, -20, sx * 30, -16, sx * 12, -6], shade(a, -30));
        const sp = Math.sin(t * 0.06 + sx);
        P(c, [sx * 29 - 15 * sp, -24, sx * 29 + 15 * sp, -22, sx * 29 + 15 * sp, -20.6, sx * 29 - 15 * sp, -22.6], 'rgba(220,230,240,0.5)', 0);
        P(c, [sx * 29 - 2.4, -27, sx * 29 + 2.4, -27, sx * 29 + 2.4, -18, sx * 29 - 2.4, -18], shade(a, -45));
      }
      const hull = [-24, -2, -16, -16, 6, -20, 22, -10, 22, 6, 8, 16, -12, 14];
      P(c, hull, a);
      P(c, [-16, -16, 6, -20, 22, -10, 10, -8, -8, -8], shade(a, 30), 0);
      P(c, [-12, 14, 8, 16, 22, 6, 14, 4, -4, 8], shade(a, -35), 0);
      P(c, hull, null);
      L(c, [-8, -8, -5, 10], shade(a, -50), 1); L(c, [10, -8, 13, 8], shade(a, -50), 1);
      P(c, [-20, 7, -35, 7, -35, 11, -20, 12], '#2a2d34');
      P(c, [-22, -8, -16, -12.4, -9, -11, -6, -4, -10, 2, -18, 2], '#15151c');
      glowOn(c, b, 14); P(c, [-19, -7, -15, -9, -11, -7, -11, -3, -15, -1, -19, -3], b, 0); glowOff(c);
      P(c, [-15.5, -8, -14.6, -8, -14.6, -2, -15.5, -2], INK, 0);
      L(c, [8, -19, 12, -32], shade(a, -30), 1.4);
      if (Math.sin(t * 0.006) > 0) { glowOn(c, b, 8); c.fillStyle = b; c.fillRect(10.6, -34.6, 3, 3); glowOff(c); }
      break;
    }
    case 'crawler': case 'queen': {
      const q = k === 'queen', sc = s * (q ? 1.5 : 1.05);
      c.translate(x, GROUND); c.scale(sc, sc);
      // Legs splay out: front pair reaches forward, back pair trails behind.
      const reach = [-17, -3, 13];
      const leg = (jx, jy, i, ph, col) => {
        const w = Math.sin(t * 0.01 + ph) * 1.6, r = reach[i], kx = jx + r * 0.45, ky = jy - 9 + w * 0.5, fx = jx + r + w;
        limb(c, jx, jy, kx, ky, 2.6, 2.1, col); limb(c, kx, ky, fx, 0, 2.1, 0.6, col);
        P(c, [kx - 1.6, ky - 1.6, kx + 1.6, ky - 1.6, kx + 1.6, ky + 1.6, kx - 1.6, ky + 1.6], shade(col, 20), 0.8);
      };
      for (let i = 0; i < 3; i++) leg(-4 + i * 9, -15, i, i, shade(a, -45));
      if (q) {
        c.save(); c.globalAlpha = 0.4 + 0.1 * Math.sin(t * 0.02);
        P(c, [4, -30, 30, -64, 48, -60, 20, -28], '#d8e8ff', 1); P(c, [10, -28, 46, -46, 52, -36, 18, -24], '#d8e8ff', 1);
        c.restore();
      }
      const abd = [4, -20, 14, -33, 32, -34, 44, -24, 42, -12, 30, -6, 10, -8];
      P(c, abd, shade(a, -10));
      P(c, [14, -33, 32, -34, 40, -28, 20, -28], shade(a, 22), 0);
      for (let i = 0; i < 3; i++) L(c, [18 + i * 8, -33.6, 15 + i * 8, -7], shade(a, -45), 1.1);
      P(c, abd, null);
      P(c, [22, -33.6, 25, -41, 28, -33.8], shade(a, 30)); P(c, [32, -33, 36, -39, 38, -29], shade(a, 30));
      if (q) { glowOn(c, b, 10); for (const [ex, ey] of [[20, -18], [28, -16], [36, -20], [26, -24]]) P(c, [ex - 2.4, ey, ex, ey - 2.4, ex + 2.4, ey, ex, ey + 2.4], b, 0); glowOff(c); }
      P(c, [-10, -16, -4, -30, 8, -31, 12, -20, 6, -10, -6, -10], a);
      P(c, [-4, -30, 8, -31, 9, -25, -2, -24], shade(a, 30), 0);
      P(c, [-28, -20, -22, -31, -10, -30, -6, -18, -14, -12, -25, -14], shade(a, 10));
      P(c, [-22, -31, -10, -30, -9, -25, -20, -25], shade(a, 36), 0);
      const m = Math.sin(t * 0.008) * 1.5;
      P(c, [-26, -16, -36, -14 + m, -40, -8 + m, -34, -10 + m, -27, -12], '#e6dcc4', 1);
      P(c, [-27, -22, -38, -24 - m, -42, -18 - m, -35, -19 - m, -28, -19], '#b8ae96', 1);
      glowOn(c, b, 8);
      for (const [ex, ey] of [[-20, -26], [-15.6, -27], [-23, -22]]) P(c, [ex - 1.6, ey, ex, ey - 1.6, ex + 1.6, ey, ex, ey + 1.6], b, 0);
      glowOff(c);
      if (q) for (let i = 0; i < 3; i++) P(c, [-23 + i * 5, -30.5, -21 + i * 5, -41 + (i === 1 ? -4 : 0), -19 + i * 5, -30.5], b, 1);
      for (let i = 0; i < 3; i++) leg(-2 + i * 9, -12, i, i + 1.5, shade(a, -15));
      break;
    }
    case 'wyrm': {
      c.translate(x, GROUND); c.scale(s, s);
      P(c, [-20, 0, -8, -10, 24, -16, 52, -8, 64, 0], shade(a, -40), 1.2);
      const pts = [];
      for (let i = 0; i <= 10; i++) { const u = i / 10; pts.push([34 - u * 56 + Math.sin(t * 0.003 + u * 4) * 4, -4 - u * 92 - Math.sin(u * Math.PI) * 8]); }
      for (let i = 0; i < 10; i++) {
        const [x1, y1] = pts[i], [x2, y2] = pts[i + 1], w1 = 15 - i * 0.8, w2 = 15 - (i + 1) * 0.8;
        const dx = x2 - x1, dy = y2 - y1, ln = Math.hypot(dx, dy), nx = -dy / ln, ny = dx / ln;
        P(c, [x1 + nx * w1, y1 + ny * w1, (x1 + x2) / 2 + nx * (w1 + 9), (y1 + y2) / 2 + ny * (w1 + 9), x2 + nx * w2, y2 + ny * w2], shade(b, -25), 1);
        limb(c, x1, y1, x2, y2, w1, w2, i % 2 ? a : shade(a, -12), shade(a, 26));
        L(c, [x1 - nx * w1 * 0.6, y1 - ny * w1 * 0.6, x2 - nx * w2 * 0.6, y2 - ny * w2 * 0.6], shade(a, 45), 1.4);
      }
      P(c, [-14, 0, -4, -6, 14, -8, 30, -4, 40, 0], shade(a, -25), 1.2);
      const [hx, hy] = pts[10]; c.translate(hx, hy);
      const jo = 3 + Math.sin(t * 0.004) * 2;
      P(c, [2, -9, 15, -21, 8, -7], shade(b, -15)); P(c, [-4, -11, 4, -23, 2, -10], shade(b, -5));
      P(c, [-26, -1, -8, 0, -8, 3 + jo, -24, 4 + jo * 1.5], '#2a0a0a', 0);
      P(c, [6, 4, -8, 2 + jo, -27, 4 + jo * 1.6, -12, 10 + jo, 6, 10], shade(a, -15));
      for (let i = 0; i < 4; i++) P(c, [-25 + i * 4.4, 3.4 + jo * 1.2, -23.4 + i * 4.4, -0.6 + jo, -21.6 + i * 4.4, 3.4 + jo * 1.1], '#f1ead8', 0.7);
      P(c, [8, -6, -4, -12, -24, -8, -31, -2, -10, 0, 8, 4], shade(a, 8));
      P(c, [-4, -12, -24, -8, -26, -5, -4, -8], shade(a, 34), 0);
      for (let i = 0; i < 5; i++) P(c, [-29 + i * 4.4, -1.6, -27.4 + i * 4.4, 3.6, -25.6 + i * 4.4, -1.4], '#f1ead8', 0.7);
      glowOn(c, b, 10); P(c, [-13, -8, -8, -10, -5.6, -7, -10, -5.6], b, 0); glowOff(c);
      break;
    }
    case 'mech': {
      c.translate(x, GROUND); c.scale(s, s);
      const leg = (ox, col) => {
        limb(c, ox, -58, ox + 14, -34, 7, 6, col); limb(c, ox + 14, -34, ox + 4, -6, 6, 5, col);
        P(c, [ox - 9, -7, ox + 14, -7, ox + 18, 0, ox - 13, 0], shade(col, -20));
        P(c, [ox + 9, -39, ox + 19, -39, ox + 20, -30, ox + 10, -29], shade(col, 25));
      };
      leg(8, shade(a, -40));
      P(c, [-18, -66, 20, -66, 16, -54, -14, -54], shade(a, -28));
      const hull = [-34, -112 + bob, 22, -118 + bob, 38, -98 + bob, 30, -64 + bob, -26, -62 + bob, -40, -84 + bob];
      P(c, hull, a);
      P(c, [-30, -108 + bob, 20, -114 + bob, 32, -100 + bob, -20, -97 + bob], shade(a, 30), 0);
      P(c, [-26, -62 + bob, 30, -64 + bob, 34, -76 + bob, -34, -74 + bob], shade(a, -30), 0);
      P(c, hull, null);
      const plate = [14, -92 + bob, 30, -92 + bob, 29, -76 + bob, 13, -76 + bob];
      c.save(); P(c, plate, null, 0); c.clip();
      for (let i = -2; i < 6; i++) P(c, [12 + i * 6, -76 + bob, 16 + i * 6, -76 + bob, 22 + i * 6, -92 + bob, 18 + i * 6, -92 + bob], i % 2 ? b : INK, 0);
      c.restore(); P(c, plate, null);
      P(c, [-38, -98 + bob, -22, -104 + bob, -6, -102 + bob, -8, -90 + bob, -30, -86 + bob], '#14161c');
      glowOn(c, b, 12); P(c, [-34, -96 + bob, -22, -100 + bob, -10, -99 + bob, -11, -94 + bob, -30, -91 + bob], b, 0); glowOff(c);
      const scan = -30 + ((t * 0.02) % 18); c.fillStyle = 'rgba(255,255,255,0.7)'; c.fillRect(scan, -98 + bob, 2, 6);
      P(c, [-8, -133 + bob, 22, -135 + bob, 24, -116 + bob, -6, -114 + bob], shade(a, -15));
      for (let i = 0; i < 4; i++) { P(c, [-4 + i * 7, -130 + bob, 1 + i * 7, -130 + bob, 1 + i * 7, -123 + bob, -4 + i * 7, -123 + bob], '#1a1a20', 0.8); c.fillStyle = '#ff4a3a'; c.fillRect(-3 + i * 7, -128 + bob, 3, 2); }
      limb(c, -10, -86 + bob, -24, -70 + bob, 6, 5, shade(a, -20));
      P(c, [-22, -77 + bob, -64, -75 + bob, -64, -66 + bob, -22, -63 + bob], '#3a3d46');
      for (const rx of [-34, -46, -56]) L(c, [rx, -76 + bob, rx, -65 + bob], '#22242a', 1.2);
      glowOn(c, b, 10); c.fillStyle = b; c.fillRect(-67, -73 + bob, 3, 5); glowOff(c);
      L(c, [16, -117 + bob, 24, -140 + bob], shade(a, -30), 1.4);
      leg(-12, shade(a, -12));
      break;
    }
    case 'wraith': {
      c.translate(x, GROUND - 46 + bob * 2); c.scale(s, s);
      const g = c.createLinearGradient(0, -96, 0, 40); g.addColorStop(0, a); g.addColorStop(0.7, shade(a, -25)); g.addColorStop(1, 'rgba(0,0,0,0)');
      const pts = [-4, -100, 10, -92, 18, -72, 24, -40, 28, 8];
      for (let i = 1; i <= 6; i++) pts.push(28 - i * 9, (i % 2 ? 36 : 14) + Math.sin(t * 0.008 + i) * 5);
      pts.push(-26, -30, -22, -66, -14, -88);
      P(c, pts, g, 1.2);
      L(c, [6, -70, 12, -20, 14, 20], shade(a, -40), 1); L(c, [-8, -60, -12, -10, -10, 24], shade(a, -40), 1);
      P(c, [-14, -86, -6, -94, 4, -88, 2, -70, -8, -64, -16, -72], '#05030a', 0);
      glowOn(c, b, 14); P(c, [-12.6, -79, -8, -81, -7, -77.6, -11.6, -76.6], b, 0); P(c, [-3, -80, 1.4, -81, 1, -77.4, -3, -76.4], b, 0); glowOff(c);
      const r = Math.sin(t * 0.004) * 3;
      for (const [oy, len] of [[0, 1], [16, 0.8]]) {
        P(c, [-12, -64 + oy, -30, -56 + oy + r, -34, -47 + oy + r, -18, -48 + oy], shade(a, -12));
        L(c, [-32, -52 + oy + r, -40 * len - 2, -56 + oy + r], '#d8d0c0', 1.8);
        for (const [dx, dy] of [[-8, -6], [-10, 0], [-8, 5]]) L(c, [-40 * len - 2, -56 + oy + r, -40 * len - 2 + dx, -56 + oy + r + dy], '#e8e0d0', 1.1);
      }
      c.globalAlpha = 0.35;
      for (let i = 0; i < 4; i++) { const yy = -((t * 0.04 + i * 30) % 120); L(c, [-10 + i * 8, yy, -14 + i * 8, yy - 10], b, 1); }
      c.globalAlpha = 1;
      break;
    }
    case 'golem': {
      c.translate(x, GROUND); c.scale(s, s);
      const rock = (pts, lit) => { P(c, pts, a); if (lit) P(c, lit, shade(a, 24), 0); P(c, pts, null); };
      rock([44, -110 + bob, 62, -104 + bob, 66, -70 + bob, 58, -50 + bob, 42, -56 + bob]);
      rock([-30, -46, -10, -48, -8, 0, -34, 0, -37, -22], [-30, -46, -10, -48, -11, -36, -28, -38]);
      rock([6, -48, 26, -46, 30, -22, 28, 0, 4, 0], [6, -48, 26, -46, 25, -38, 8, -38]);
      rock([-46, -104 + bob, -20, -128 + bob, 22, -126 + bob, 46, -100 + bob, 38, -50, -36, -46], [-20, -128 + bob, 22, -126 + bob, 40, -104 + bob, 0, -110 + bob]);
      L(c, [-40, -78 + bob, 30, -84 + bob], shade(a, -30), 1);
      rock([-16, -144 + bob, 4, -148 + bob, 14, -132 + bob, 6, -120 + bob, -14, -122 + bob], [-16, -144 + bob, 4, -148 + bob, 10, -138 + bob, -10, -136 + bob]);
      glowOn(c, b, 12);
      P(c, [-12, -135 + bob, -6, -136 + bob, -6, -133 + bob, -12, -132 + bob], b, 0); P(c, [-3, -136 + bob, 2, -136.4 + bob, 2, -133 + bob, -3, -133 + bob], b, 0);
      L(c, [-28, -110 + bob, -16, -96 + bob, -22, -84 + bob, -8, -70 + bob], b, 2.2);
      L(c, [14, -116 + bob, 6, -98 + bob, 18, -80 + bob], b, 2);
      L(c, [-22, -40, -18, -24, -24, -10], b, 1.6); L(c, [16, -42, 20, -26], b, 1.6);
      P(c, [-2, -100 + bob, 4, -94 + bob, -2, -88 + bob, -8, -94 + bob], b, 0);
      glowOff(c);
      rock([-66, -108 + bob, -44, -114 + bob, -38, -80 + bob, -48, -46 + bob, -70, -52 + bob, -74, -84 + bob], [-66, -108 + bob, -44, -114 + bob, -42, -96 + bob, -64, -94 + bob]);
      glowOn(c, b, 10); L(c, [-62, -96 + bob, -52, -84 + bob, -58, -70 + bob], b, 1.8); glowOff(c);
      c.fillStyle = b;
      for (let i = 0; i < 5; i++) { const yy = (t * 0.03 + i * 37) % 80; c.globalAlpha = 1 - yy / 80; c.fillRect(-30 + i * 14, -112 - yy + bob, 2, 2); }
      c.globalAlpha = 1;
      break;
    }
    case 'imp': {
      c.translate(x, GROUND); c.scale(s, s);
      const fl = Math.sin(t * 0.012) * 6;
      P(c, [6, -62, 30, -94 - fl, 34, -72 - fl, 44, -76 - fl, 37, -57 - fl * 0.5, 41, -50, 14, -50], shade(a, -32));
      L(c, [10, -58, 30, -92 - fl], shade(a, -55), 1); L(c, [12, -54, 34, -72 - fl], shade(a, -55), 1);
      L(c, [10, -32, 26, -26, 36, -18, 42, -32], shade(a, -20), 2.4);
      P(c, [40, -32, 46, -38, 44, -28], shade(a, -20));
      limb(c, 4, -34, 12, -20, 4, 3.4, shade(a, -25)); limb(c, 12, -20, 6, -1, 3.4, 2.4, shade(a, -25));
      P(c, [0, -2, 9, -2, 10, 0, -2, 0], '#2a1a1a', 1);
      limb(c, -6, -34, -14, -20, 4, 3.4, a, shade(a, 25)); limb(c, -14, -20, -10, -1, 3.4, 2.4, a, shade(a, 25));
      P(c, [-16, -2, -7, -2, -6, 0, -18, 0], '#2a1a1a', 1);
      const torso = [-10, -36, 10, -34, 12, -56, 0, -66, -14, -58];
      P(c, torso, a);
      P(c, [-10, -36, 2, -35, -2, -52, -12, -54], shade(a, 25), 0);
      P(c, torso, null);
      P(c, [-2, -72, 12, -80, 3, -65], shade(a, -10));
      P(c, [-22, -66, -16, -77, -4, -77, 2, -66, -4, -58, -16, -58], shade(a, 8));
      P(c, [-16, -77, -4, -77, -2, -70, -14, -70], shade(a, 30), 0);
      P(c, [-14, -76, -19, -89, -10, -78], '#3a2020'); P(c, [-7, -77, -5, -91, -1, -77], '#3a2020');
      L(c, [-21, -63, -10, -61], INK, 1);
      for (let i = 0; i < 3; i++) P(c, [-19 + i * 3, -62.4, -17.6 + i * 3, -60, -16.4 + i * 3, -62], '#f1ead8', 0);
      glowOn(c, b, 10); P(c, [-18, -71, -13, -72, -14, -69.4], b, 0); P(c, [-9, -72, -5, -72, -6, -69.6], b, 0); glowOff(c);
      limb(c, -8, -56, -22, -46, 3, 2.6, a); limb(c, -22, -46, -30, -52, 2.6, 2, a);
      for (const dy of [-4, 0, 4]) L(c, [-30, -52, -35, -52 + dy], '#f1ead8', 1);
      glowOn(c, b, 14); const ff = Math.random() * 3;
      P(c, [-36, -54, -32, -60 - ff, -30, -66 - ff * 2, -27, -58, -30, -52], b, 0); glowOff(c);
      P(c, [-34, -55, -31, -60, -29, -56], '#fff6c0', 0);
      break;
    }
    case 'eye': {
      c.translate(x, GROUND - 100 * s + bob * 2); c.scale(s, s);
      for (let i = 0; i < 7; i++) {
        const ang = Math.PI * 0.12 + i * (Math.PI * 1.76 / 6); let px = Math.cos(ang) * 34, py = Math.sin(ang) * 34, w = 6.4;
        for (let j = 1; j <= 4; j++) {
          const a2 = ang + Math.sin(t * 0.003 + i + j * 0.8) * 0.32;
          const nx = px + Math.cos(a2) * 13, ny = py + Math.sin(a2) * 13;
          limb(c, px, py, nx, ny, w, w - 1.3, j % 2 ? shade(a, 12) : a, shade(a, 34));
          px = nx; py = ny; w -= 1.3;
        }
        const a3 = ang + Math.sin(t * 0.003 + i + 4) * 0.32;
        P(c, [px + Math.cos(a3 + 1.5) * 2, py + Math.sin(a3 + 1.5) * 2, px + Math.cos(a3) * 10, py + Math.sin(a3) * 10, px + Math.cos(a3 - 1.5) * 2, py + Math.sin(a3 - 1.5) * 2], b, 1);
      }
      const oct = r => { const p = []; for (let i = 0; i < 8; i++) { const an = Math.PI / 8 + i * Math.PI / 4; p.push(Math.cos(an) * r, Math.sin(an) * r); } return p; };
      for (let i = 0; i < 8; i++) { const an = i * Math.PI / 4; P(c, [Math.cos(an - 0.2) * 44, Math.sin(an - 0.2) * 44, Math.cos(an) * 56, Math.sin(an) * 56, Math.cos(an + 0.2) * 44, Math.sin(an + 0.2) * 44], shade(a, 20), 1); }
      P(c, oct(47), a);
      P(c, [-30, -34, 0, -47, 30, -34, 0, -30], shade(a, 28), 0);
      for (let i = 0; i < 8; i++) { const an = Math.PI / 8 + i * Math.PI / 4; L(c, [Math.cos(an) * 38, Math.sin(an) * 38, Math.cos(an) * 47, Math.sin(an) * 47], shade(a, -30), 1); }
      P(c, oct(47), null);
      const blink = (t % 5200) < 180 ? 1 : 0;
      P(c, [-36, 0, -18, -21 + blink * 20, 18, -21 + blink * 20, 36, 0, 18, 21 - blink * 20, -18, 21 - blink * 20], '#e9dfe6', 1.4);
      if (!blink) {
        L(c, [-28, -4, -20, -8, -16, -6], '#c4506a', 0.8); L(c, [26, 6, 20, 10, 15, 8], '#c4506a', 0.8);
        const lx = Math.sin(t * 0.0013) * 8 - 6;
        glowOn(c, b, 16);
        const ir = []; for (let i = 0; i < 8; i++) { const an = Math.PI / 8 + i * Math.PI / 4; ir.push(lx + Math.cos(an) * 14, Math.sin(an) * 14); }
        P(c, ir, b, 0); glowOff(c);
        P(c, [lx - 2, -11, lx + 2, -11, lx + 2.6, 0, lx + 2, 11, lx - 2, 11, lx - 2.6, 0], INK, 0);
        P(c, [lx + 5, -8, lx + 9, -8, lx + 7, -4], 'rgba(255,255,255,0.8)', 0);
      }
      P(c, [-38, 0, -18, -24, 18, -24, 38, 0, 18, -19, -18, -19], shade(a, -15), 1.2);
      P(c, [-38, 0, -18, 24, 18, 24, 38, 0, 18, 19, -18, 19], shade(a, -15), 1.2);
      break;
    }
  }
  c.restore();
}

function drawPortrait(cv, hl, size, zoom = 34) {
  const c = hiDpi(cv, size, size), w = size, h = size;
  c.clearRect(0, 0, w, h);
  const g = c.createRadialGradient(w * 0.5, h * 0.4, 2, w * 0.5, h * 0.5, w * 0.7);
  g.addColorStop(0, '#3a3670'); g.addColorStop(1, '#14122c');
  c.fillStyle = g; c.fillRect(0, 0, w, h);
  c.save(); c.translate(w * 0.46, h * (zoom > 34 ? 0.6 : 0.56)); const k = w / zoom; c.scale(k, k);
  c.lineJoin = 'round'; c.lineCap = 'round';
  drawHead(c, hl.look, hl.armor, hl.acc, performance.now());
  c.restore();
}

let raf = 0, last = 0;
function shieldHex(c, x, y, rad, t) {
  const pts = []; for (let i = 0; i < 6; i++) { const a = Math.PI / 6 + i * Math.PI / 3; pts.push(x + Math.cos(a) * rad * 0.75, y + Math.sin(a) * rad); }
  c.save(); c.globalAlpha = 0.35 + 0.15 * Math.sin(t * 0.005); glowOn(c, '#5ad1e6', 10);
  P(c, pts, 'rgba(90,209,230,0.08)', 0); L(c, [...pts, pts[0], pts[1]], '#5ad1e6', 1.4); c.restore();
}
function loop(t) {
  raf = 0;
  const cv = document.getElementById('battleCanvas');
  if (!cv || !B) return;
  const dt = Math.min(50, t - (last || t)); last = t;
  const c = hiDpi(cv, W, H), a = B.anim, w = PLANETS[B.world];
  c.save();
  if (a.flash > 0 && !RM) c.translate((Math.random() - 0.5) * 8 * a.flash, (Math.random() - 0.5) * 6 * a.flash);
  drawBackdrop(c, w, t);
  for (const k of ['pLunge', 'eLunge', 'pHit', 'eHit', 'flash']) a[k] = Math.max(0, a[k] - dt / (k === 'flash' ? 250 : 320));
  const lunge = v => Math.sin(v * Math.PI) * 60;
  const shake = v => Math.sin(v * 40) * 6 * v;
  const hitFlash = v => { if (v > 0.55 && 'filter' in c) c.filter = 'brightness(2.4) saturate(0.3)'; };
  // hero
  const px = 200 + lunge(a.pLunge) + shake(a.pHit);
  shadow(c, px, 34);
  if (B.p.hp > 0 || B.over?.result !== 'lost') {
    hitFlash(a.pHit);
    drawKnight(c, px, GROUND, 1.4, { ...heroLook(), swing: a.pLunge }, t);
    c.filter = 'none';
  }
  if (B.p.fx.shield) shieldHex(c, px, GROUND - 76, 82, t);
  // enemy
  const big = B.e.big ? 1.45 : 1;
  const ex = 520 - lunge(a.eLunge) + shake(a.eHit);
  if (a.eDie > 0) a.eDie = Math.min(1, a.eDie + dt / 700);
  shadow(c, ex, 44 * big);
  c.save();
  c.globalAlpha = a.eDie > 0 ? 1 - a.eDie : 1;
  hitFlash(a.eHit);
  if (B.phase === 2) { c.shadowColor = '#ff3a8a'; c.shadowBlur = 30; }
  drawEnemy(c, B.e, ex, 1.25 * big, t, a.eLunge);
  c.restore();
  if (B.e.fx.shield) shieldHex(c, ex, GROUND - 82 * big, 96 * big, t);
  drawVfx(c, dt);
  // flash + floating numbers
  if (a.flash > 0) { c.fillStyle = `rgba(255,255,255,${a.flash * 0.3})`; c.fillRect(-10, -10, W + 20, H + 20); }
  c.textAlign = 'center'; c.font = '700 22px "Chakra Petch", sans-serif';
  B.fl = B.fl.filter(f => (f.t += dt / 1000) < 1.1);
  for (const f of B.fl) {
    const x = (f.side === 'p' ? 200 : 520) + f.dx, y = GROUND - 150 - f.t * 50;
    c.globalAlpha = clamp(1.4 - f.t * 1.3, 0, 1);
    c.lineWidth = 4; c.strokeStyle = 'rgba(0,0,0,0.7)'; c.strokeText(f.text, x, y);
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
    const c = hiDpi(tc, 420, 210); c.clearRect(0, 0, 420, 210);
    const r = seeded(7); c.fillStyle = '#fff';
    for (let i = 0; i < 60; i++) { c.globalAlpha = 0.2 + 0.6 * Math.abs(Math.sin(t * 0.001 + i)); c.fillRect(r() * 420, r() * 210, 1.5, 1.5); }
    c.globalAlpha = 1;
    const g = c.createRadialGradient(300, 210, 10, 300, 210, 200); g.addColorStop(0, 'rgba(196,106,255,0.33)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = g; c.fillRect(0, 0, 420, 210);
    if (!ambientLoop.hero) ambientLoop.hero = menuHero();
    drawKnight(c, 150, 200, 1.6, ambientLoop.hero, t);
  }
  const cc = document.getElementById('createCanvas');
  if (cc && U.draft) {
    const w = 240, h = 300, c = hiDpi(cc, w, h);
    const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#24205a'); g.addColorStop(1, '#0e0d22');
    c.fillStyle = g; c.fillRect(0, 0, w, h);
    nebula(c, 120, 120, 140, 'rgba(196,106,255,0.12)');
    const sg = c.createRadialGradient(112, h - 16, 1, 112, h - 16, 60); sg.addColorStop(0, 'rgba(0,0,0,0.5)'); sg.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = sg; c.fillRect(40, h - 40, 150, 40);
    const hl = draftHero();
    drawKnight(c, 104, h - 18, 2.3, hl, t);
    const pc = document.getElementById('createPortrait'); if (pc) drawPortrait(pc, hl, 150, 44);
  }
  const hc = document.getElementById('hubHero');
  if (hc && S) {
    const c = hiDpi(hc, 96, 120); c.clearRect(0, 0, 96, 120);
    const sg = c.createRadialGradient(44, 112, 1, 44, 112, 36); sg.addColorStop(0, 'rgba(0,0,0,0.5)'); sg.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = sg; c.fillRect(0, 96, 96, 24);
    drawKnight(c, 42, 112, 0.86, heroLook(), t);
  }
  if ((tc || cc || hc) && !ambient) { ambient = true; requestAnimationFrame(ambientLoop); }
}

