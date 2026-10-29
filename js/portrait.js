'use strict';
/* ============================== ANIME PORTRAITS ============================== */
// Bust portraits in the style of 2000s Flash RPG title art: heavy ink outlines, flat two-tone cel shading,
// big glossy eyes and spiky hair, over glowing rune rings. Logical size 300 x 400 (head and shoulders in the top 340), facing right.

function path(c, k) {
  c.beginPath();
  for (let i = 0; i < k.length;) {
    const op = k[i++];
    if (op === 'M') c.moveTo(k[i++], k[i++]);
    else if (op === 'L') c.lineTo(k[i++], k[i++]);
    else if (op === 'Q') c.quadraticCurveTo(k[i++], k[i++], k[i++], k[i++]);
    else if (op === 'Z') c.closePath();
  }
}
function fp(c, k, fill, w = 2.6) { path(c, k); if (fill) { c.fillStyle = fill; c.fill(); } if (w) { c.lineWidth = w; c.strokeStyle = INK; c.stroke(); } }
// A bevelled shape: lit sliver on the upper-left edge, shadowed sliver on the lower-right, then the ink outline.
function bevel(c, k, base, lit, dk, w = 2.6) {
  c.save(); path(c, k); c.clip();
  path(c, k); c.fillStyle = dk || shade(base, -40); c.fill();
  c.save(); c.translate(-2.2, -3.2); path(c, k); c.fillStyle = lit || shade(base, 44); c.fill(); c.restore();
  c.save(); c.translate(1.6, 2.4); path(c, k); c.clip(); c.translate(-3.8, -5.6); path(c, k); c.fillStyle = base; c.fill(); c.restore();
  c.restore();
  if (w) { path(c, k); c.lineWidth = w; c.strokeStyle = INK; c.stroke(); }
}
function prv(c, x, y, col) { c.fillStyle = INK; c.beginPath(); c.arc(x, y, 3, 0, Math.PI * 2); c.fill(); c.fillStyle = col; c.beginPath(); c.arc(x - 0.4, y - 0.4, 1.8, 0, Math.PI * 2); c.fill(); }
// Per-set surface detail on the portrait breastplate.
function bustMotif(c, A, f) {
  const m = A.motif, cy = f ? 290 : 286;
  if (m === 'rivet') for (const [x, y] of [[112, 266], [196, 266], [112, 322], [196, 322]]) prv(c, x, y, shade(A.base, 55));
  if (m === 'stitch') { c.save(); c.setLineDash([4, 4]); for (const y of [276, 306]) L(c, [100, y, 208, y], shade(A.base, 40), 1.4); c.restore(); }
  if (m === 'ridge') { c.strokeStyle = shade(A.base, 36); c.lineWidth = 2; for (let i = 0; i < 3; i++) { c.beginPath(); c.moveTo(104 + i * 4, cy - 16 + i * 16); c.quadraticCurveTo(152, cy - 34 + i * 16, 204 - i * 4, cy - 14 + i * 16); c.stroke(); } }
  if (m === 'filigree') {
    const g = A.rivet || '#e8c25a';
    L(c, [112, cy - 30, 152, cy - 8, 192, cy - 30], g, 2.2); L(c, [118, cy - 22, 152, cy - 2, 186, cy - 22], shade(g, -40), 1.2);
    fp(c, ['M', 152, cy - 18, 'L', 160, cy - 8, 'L', 152, cy + 2, 'L', 144, cy - 8, 'Z'], A.trim, 1.8);
    fp(c, ['M', 152, cy - 15, 'L', 156, cy - 9, 'L', 152, cy - 8, 'Z'], '#ffffff', 0);
  }
  if (m === 'rune') { c.save(); glowOn(c, A.glow, 12); L(c, [132, cy - 10, 142, cy - 22, 152, cy - 10, 162, cy - 22, 172, cy - 10], A.glow, 1.8); L(c, [138, cy + 4, 166, cy + 4], A.glow, 1.8); c.restore(); }
}
// A tapered, curved lock of hair from root to tip.
function lock(c, x0, y0, x1, y1, w, bend, fill) {
  const dx = x1 - x0, dy = y1 - y0, len = Math.hypot(dx, dy) || 1, nx = -dy / len, ny = dx / len;
  const cx = (x0 + x1) / 2 + nx * bend, cy = (y0 + y1) / 2 + ny * bend;
  fp(c, ['M', x0 + nx * w, y0 + ny * w, 'Q', cx + nx * w * 0.6, cy + ny * w * 0.6, x1, y1, 'Q', cx - nx * w * 0.6, cy - ny * w * 0.6, x0 - nx * w, y0 - ny * w, 'Z'], fill, 2.2);
}

// Glowing crimson rings and circuit glyphs on black, like the title cards of the old Flash games.
function runeBg(c, w, h, t, col = '#d4142e') {
  c.fillStyle = '#050305'; c.fillRect(0, 0, w, h);
  const g = c.createRadialGradient(w * 0.35, h * 0.4, 4, w * 0.35, h * 0.4, w * 0.7); g.addColorStop(0, 'rgba(120,0,20,0.35)'); g.addColorStop(1, 'rgba(0,0,0,0)');
  c.fillStyle = g; c.fillRect(0, 0, w, h);
  c.save(); c.translate(w * 0.36, h * 0.42); glowOn(c, col, 14);
  const rings = [[0.52, 0.2, 0.45, 9], [0.42, 0.34, -0.9, 7], [0.24, 0.11, 0.2, 6], [0.15, 0.13, 1.2, 4], [0.62, 0.5, 0.05, 2]];
  rings.forEach(([rx, ry, a, lw], i) => {
    c.strokeStyle = i === 4 ? 'rgba(212,20,46,0.5)' : col; c.lineWidth = lw * (w / 300);
    c.beginPath(); c.ellipse(0, 0, rx * w, ry * w, a + t * 0.00012 * (i % 2 ? -1 : 1), 0, Math.PI * 2); c.stroke();
  });
  c.restore();
  c.save(); c.strokeStyle = 'rgba(212,20,46,0.55)'; c.lineWidth = 1.2 * (w / 300);
  const s = w / 300;
  L(c, [0, h * 0.22, 40 * s, h * 0.22, 54 * s, h * 0.3, 54 * s, h * 0.86, 90 * s, h * 0.86], 'rgba(212,20,46,0.55)', 1.2 * s);
  c.beginPath(); c.arc(72 * s, h * 0.86, 18 * s, 0, Math.PI * 2); c.stroke();
  c.fillStyle = 'rgba(212,20,46,0.6)'; c.font = `${Math.round(9 * s)}px "Chakra Petch", monospace`;
  c.fillText('← △ ↕ ⇄ ←', 46 * s, h * 0.95); c.fillText('≡ ← → ←', 6 * s, h * 0.18);
  c.restore();
}

const PINK = 'rgba(255,110,130,0.55)';
// Faces are drawn in three-quarter view, turned toward the viewer's right: the ear and the near eye are on the left,
// the far eye sits close to the right-hand contour, and nose, mouth and chin lie on a centre line around x = 166.
function bustFace(c, sp) {
  const skin = sp.skin, sh = shade(skin, -28), f = sp.f;
  fp(c, ['M', 128, 182, 'L', 124, 238, 'Q', 152, 250, 182, 238, 'L', 180, 186, 'Z'], skin, 2.4);
  fp(c, ['M', 128, 184, 'L', 126, 216, 'Q', 154, 226, 180, 208, 'L', 180, 190, 'Z'], sh, 0);
  fp(c, ['M', 98, 116, 'Q', 78, 110, 82, 134, 'Q', 86, 154, 104, 150, 'Z'], skin, 2.2);
  L(c, [90, 124, 94, 140], sh, 1.6); L(c, [88, 130, 96, 128], shade(skin, -45), 1.2);
  const face = f
    ? ['M', 96, 92, 'Q', 88, 142, 116, 178, 'Q', 140, 198, 166, 204, 'Q', 182, 198, 194, 178, 'Q', 206, 154, 208, 126, 'L', 207, 100, 'Q', 200, 60, 152, 56, 'Q', 104, 58, 96, 92, 'Z']
    : ['M', 92, 92, 'Q', 86, 148, 110, 184, 'L', 150, 209, 'L', 176, 206, 'Q', 196, 188, 204, 160, 'Q', 210, 134, 207, 100, 'Q', 198, 58, 150, 54, 'Q', 100, 56, 92, 92, 'Z'];
  const skull = ['M', 92, 104, 'Q', 82, 32, 150, 28, 'Q', 218, 32, 208, 104, 'Z'];
  fp(c, skull, skin, 2.8);
  if (['shaved', 'mohawk', 'topknot'].includes(sp.style)) { c.save(); path(c, skull); c.clip(); c.globalAlpha = 0.38; fp(c, ['M', 80, 20, 'L', 220, 20, 'L', 220, 76, 'Q', 150, 64, 84, 96, 'Z'], sp.hair, 0); c.restore(); }
  fp(c, face, skin, 2.8);
  c.save(); path(c, [...skull.slice(0, -1), 'L', 207, 100, 'Z']); path(c, face); c.restore();
  c.save(); path(c, face); c.clip();
  // the cheek turning away from us falls into shadow
  fp(c, ['M', 220, 40, 'L', 198, 40, 'Q', 206, 128, 188, 182, 'L', 164, 216, 'L', 220, 216, 'Z'], sh, 0);
  fp(c, ['M', 150, 196, 'Q', 166, 202, 182, 194, 'L', 182, 216, 'L', 150, 216, 'Z'], sh, 0);
  fp(c, ['M', 98, 148, 'Q', 112, 164, 134, 168, 'Q', 112, 174, 98, 162, 'Z'], shade(skin, -14), 0);
  fp(c, ['M', 192, 104, 'Q', 204, 116, 200, 132, 'L', 196, 120, 'Z'], shade(skin, 18), 0);
  if (f) { for (let i = 0; i < 3; i++) L(c, [110 + i * 6, 162, 115 + i * 6, 155], PINK, 1.8); for (let i = 0; i < 2; i++) L(c, [180 + i * 5, 160, 184 + i * 5, 154], PINK, 1.5); }
  c.restore();
  // nose: a small wedge on the centre line, shadowed on the side away from the light
  fp(c, ['M', 163, 147, 'L', 171, 160, 'L', 163, 162, 'Z'], shade(skin, -24), 0);
  L(c, [163, 145, 171, 160, 164, 162], shade(skin, -62), 1.8);
  L(c, [158, 118, 161, 140], shade(skin, 26), 1.4);
  L(c, [156, 196, 168, 196], shade(skin, -22), 1.6);
  L(c, [120, 238, 138, 233], shade(skin, -40), 1.4); L(c, [168, 233, 186, 238], shade(skin, -40), 1.4);
  if (!f) L(c, [149, 220, 151, 230], shade(skin, -40), 1.4);
  if (f) { L(c, [154, 183, 171, 181], shade(skin, -82), 2.2); L(c, [157, 189, 167, 189], shade(skin, -34), 1.4); }
  else L(c, sp.expr === 'grim' ? [150, 187, 176, 186] : [151, 186, 176, 183], shade(skin, -82), 2.4);
  return face;
}

// One anime eye centred at (cx, cy). The outer corner is on the right unless `mirror` is set;
// both irises look toward the viewer's right and the gloss always sits upper-left.
function animeEye(c, cx, cy, w, h, col, sp, far, mirror) {
  const f = sp.f, look = mirror ? -1 : 1;
  c.save(); c.translate(cx, cy); if (mirror) c.scale(-1, 1);
  const scl = ['M', -w / 2, 0, 'Q', -w * 0.1, -h * 0.62, w / 2, -h * 0.28, 'Q', w * 0.42, h * 0.38, w * 0.05, h * 0.46, 'Q', -w * 0.36, h * 0.4, -w / 2, 0, 'Z'];
  fp(c, scl, '#fbf8f4', 0);
  c.save(); path(c, scl); c.clip();
  const ix = w * 0.1 * look, iy = h * 0.06, rx = w * 0.3, ry = h * 0.46;
  const g = c.createLinearGradient(0, iy - ry, 0, iy + ry); g.addColorStop(0, shade(col, -95)); g.addColorStop(0.55, col); g.addColorStop(1, shade(col, 70));
  c.fillStyle = g; c.beginPath(); c.ellipse(ix, iy, rx, ry, 0, 0, Math.PI * 2); c.fill();
  c.lineWidth = 1.4; c.strokeStyle = shade(col, -110); c.stroke();
  c.fillStyle = shade(col, -120); c.beginPath(); c.ellipse(ix, iy + ry * 0.05, rx * 0.42, ry * 0.5, 0, 0, Math.PI * 2); c.fill();
  c.globalAlpha = 0.55; c.strokeStyle = shade(col, 60); c.lineWidth = 1.2; c.beginPath(); c.ellipse(ix, iy + ry * 0.1, rx * 0.7, ry * 0.74, 0, 0.2, Math.PI - 0.2); c.stroke(); c.globalAlpha = 1;
  c.fillStyle = 'rgba(0,0,0,0.22)'; c.fillRect(-w, -h, w * 2, h * 0.58);
  c.fillStyle = '#ffffff'; c.beginPath(); c.ellipse(ix - rx * 0.35 * look, iy - ry * 0.32, rx * 0.36, ry * 0.24, -0.4 * look, 0, Math.PI * 2); c.fill();
  c.beginPath(); c.arc(ix + rx * 0.42 * look, iy + ry * 0.45, rx * 0.15, 0, Math.PI * 2); c.fill();
  c.restore();
  const lt = f ? 4.4 : 3.2;
  fp(c, ['M', -w / 2 - 1, 1, 'Q', -w * 0.1, -h * 0.66, w / 2 + 3, -h * 0.32, 'L', w / 2 + (f ? 10 : 5), -h * 0.44, 'L', w / 2 + 2, -h * 0.16, 'Q', -w * 0.1, -h * 0.5 + lt, -w / 2 + 1, 2, 'Z'], INK, 0);
  if (f) L(c, [w * 0.34, -h * 0.4, w * 0.48, -h * (far ? 0.56 : 0.64)], INK, far ? 1.4 : 1.8);
  L(c, [w * 0.42, h * 0.3, w * 0.05, h * 0.46], INK, 1.3);
  c.strokeStyle = 'rgba(90,40,30,0.55)'; c.lineWidth = 1.1; c.beginPath(); c.moveTo(-w * 0.36, -h * 0.6); c.quadraticCurveTo(0, -h * 0.92, w * 0.46, -h * 0.5); c.stroke();
  c.strokeStyle = 'rgba(120,60,50,0.3)'; c.lineWidth = 1.8; c.beginPath(); c.moveTo(-w * 0.3, h * 0.5); c.quadraticCurveTo(0, h * 0.62, w * 0.36, h * 0.4); c.stroke();
  // brow: inner end (toward the nose) is at -x
  const by = -h * (sp.angry ? 0.66 : 0.8), bc = shade(sp.hair, -60);
  if (sp.angry) fp(c, ['M', -w * 0.5, by + 6, 'L', w * 0.58, by - 6, 'L', w * 0.54, by - 2, 'L', -w * 0.5, by + 10, 'Z'], bc, 1);
  else fp(c, ['M', -w * 0.45, by + 2, 'Q', 0, by - (f ? 7 : 4), w * 0.55, by + 1, 'L', w * 0.5, by + (f ? 3.5 : 6), 'Q', 0, by - (f ? 3 : 0), -w * 0.45, by + (f ? 5 : 7), 'Z'], bc, 1);
  c.restore();
}

function bustEyes(c, sp) {
  const f = sp.f, nw = f ? 34 : 30, nh = f ? 34 : 24, fw = f ? 24 : 21, fh = f ? 31 : 22;
  if (sp.mark === 'patch') {
    L(c, [114, 116, 92, 112], '#1a1418', 2.4); L(c, [146, 118, 204, 98], '#1a1418', 2.4);
    fp(c, ['M', 112, 120, 'Q', 130, 110, 150, 118, 'Q', 150, 142, 130, 148, 'Q', 112, 142, 112, 120, 'Z'], '#1a1418', 2);
  } else animeEye(c, 130, 130, nw, nh, sp.eyes, sp, false, true);
  animeEye(c, 186, 129, fw, fh, sp.eyes, sp, true, false);
}

function bustMarks(c, sp) {
  const skin = sp.skin;
  if (sp.mark === 'scar') { L(c, [118, 100, 144, 158], shade(skin, -60), 3); L(c, [120, 100, 146, 157], shade(skin, 30), 1.2); }
  if (sp.mark === 'paint') { for (const y of [154, 164]) fp(c, ['M', 104, y, 'L', 142, y - 3, 'L', 142, y + 2, 'L', 106, y + 5, 'Z'], '#c4202e', 0); }
  if (sp.mark === 'tattoo') { c.save(); glowOn(c, sp.eyes, 8); L(c, [102, 80, 106, 98, 98, 110, 102, 122], sp.eyes, 1.6); L(c, [118, 168, 128, 176, 128, 192], sp.eyes, 1.6); c.restore(); }
  const b = sp.beard, hc = shade(sp.hair, -10);
  const hd = shade(hc, -45);
  if (b === 'stubble') { c.save(); c.globalAlpha = 0.32; fp(c, ['M', 100, 158, 'Q', 112, 192, 150, 210, 'L', 176, 207, 'Q', 196, 190, 204, 160, 'Q', 186, 196, 160, 196, 'Q', 130, 192, 100, 158, 'Z'], hc, 0); c.restore(); }
  if (b === 'full') {
    fp(c, ['M', 100, 156, 'Q', 104, 186, 128, 204, 'L', 136, 216, 'L', 148, 212, 'L', 158, 230, 'L', 166, 214, 'L', 178, 222, 'L', 180, 206, 'Q', 198, 188, 204, 160, 'L', 196, 174, 'Q', 182, 196, 164, 200, 'Q', 132, 198, 112, 170, 'Z'], hc, 2.2);
    fp(c, ['M', 104, 166, 'Q', 112, 190, 130, 202, 'L', 136, 212, 'L', 132, 198, 'Q', 116, 186, 104, 166, 'Z'], hd, 0);
    for (const [x0, y0, x1, y1] of [[140, 202, 144, 212], [164, 204, 162, 218], [184, 192, 182, 202]]) L(c, [x0, y0, x1, y1], hd, 1.4);
  }
  if (b === 'goatee') { fp(c, ['M', 152, 194, 'L', 176, 192, 'L', 172, 212, 'L', 164, 224, 'L', 154, 210, 'Z'], hc, 2); L(c, [164, 198, 164, 216], hd, 1.2); }
  if (b === 'full' || b === 'goatee' || b === 'moustache') {
    fp(c, ['M', 163, 170, 'Q', 152, 172, 140, 186, 'L', 146, 186, 'Q', 154, 180, 163, 178, 'Z'], hc, 1.8);
    fp(c, ['M', 165, 170, 'Q', 178, 171, 188, 184, 'L', 182, 185, 'Q', 174, 179, 165, 178, 'Z'], hc, 1.8);
    L(c, [152, 189, 174, 188], shade(skin, -82), 2);
  }
}

function bustHairBack(c, sp, t) {
  const h = sp.hair, hd = shade(h, -38), sw = Math.sin(t * 0.0018) * 3;
  if (!['shaved', 'mohawk', 'topknot'].includes(sp.style)) {
    fp(c, ['M', 86, 92, 'Q', 64, 150, 74, 198, 'L', 88, 178, 'L', 92, 206, 'L', 104, 180, 'L', 106, 120, 'Z'], hd, 2.4);
    fp(c, ['M', 212, 92, 'Q', 230, 140, 222, 186, 'L', 212, 166, 'L', 204, 120, 'Z'], hd, 2.4);
  }
  if (sp.style === 'tail') {
    fp(c, ['M', 122, 44, 'Q', 60, 16, 32, 78 + sw, 'Q', 4, 150, 24 + sw, 240, 'L', 40, 198, 'L', 48, 250 + sw, 'L', 62, 192, 'L', 80, 232, 'Q', 74, 150, 92, 104, 'Q', 104, 76, 122, 70, 'Z'], h, 2.6);
    for (const k of [0, 1, 2]) L(c, [100 - k * 10, 50 + k * 4, 46 - k * 6 + sw, 120 + k * 30, 40 + k * 8 + sw, 200 + k * 10], k === 1 ? shade(h, 40) : hd, 1.4);
  }
  if (sp.style === 'long') {
    fp(c, ['M', 92, 80, 'Q', 50, 150, 56, 300, 'L', 76, 270, 'L', 90, 308, 'L', 104, 270, 'L', 200, 272, 'L', 214, 308, 'L', 228, 268, 'L', 248, 292, 'Q', 252, 150, 210, 86, 'Z'], hd, 2.6);
  }
}

function bustHairFront(c, sp, face) {
  const h = sp.hair, hl = shade(h, 50), hd = shade(h, -34), st = sp.style, f = sp.f;
  if (st === 'shaved' || st === 'mohawk' || st === 'topknot') {
    if (st === 'mohawk') for (let i = 0; i < 6; i++) lock(c, 112 + i * 16, 64 - i * 1.5, 92 + i * 18, 6 + (i % 2) * 14, 9, 6, h);
    if (st === 'topknot') { fp(c, ['M', 122, 52, 'Q', 112, 18, 146, 12, 'Q', 180, 16, 172, 52, 'Z'], h, 2.4); fp(c, ['M', 120, 50, 'L', 174, 50, 'L', 172, 60, 'L', 122, 60, 'Z'], '#c9a24a', 2); }
    return;
  }
  if (st === 'swept') {
    fp(c, ['M', 98, 60, 'L', 52, 52, 'L', 76, 82, 'L', 44, 96, 'L', 80, 112, 'L', 58, 136, 'L', 92, 132, 'Z'], hd, 2.4);
    fp(c, ['M', 86, 114, 'Q', 68, 28, 150, 24, 'Q', 232, 26, 214, 104, 'L', 206, 84, 'L', 198, 98, 'L', 188, 74, 'L', 178, 88, 'L', 166, 66, 'L', 158, 84, 'L', 144, 70, 'L', 132, 84, 'L', 120, 74, 'L', 110, 90, 'L', 100, 82, 'L', 96, 102, 'Z'], h, 2.6);
    fp(c, ['M', 104, 50, 'Q', 150, 32, 198, 48, 'L', 192, 56, 'Q', 150, 44, 110, 58, 'Z'], hl, 0);
    for (const k of [0, 1, 2, 3]) L(c, [196 - k * 22, 70 - k * 2, 150 - k * 22, 40], k % 2 ? hl : hd, 1.4);
    lock(c, 180, 66, 198, 116, 4, 8, h);
    return;
  }
  // forehead shadow cast by the bangs
  c.save(); path(c, face); c.clip();
  const sh = f ? [214, 128, 200, 144, 188, 120, 176, 132, 164, 116, 150, 126, 138, 114, 124, 122, 110, 118, 96, 132] : [212, 116, 198, 126, 186, 114, 174, 122, 162, 110, 150, 118, 136, 110, 122, 116, 108, 112, 94, 124];
  P(c, [80, 40, 230, 40, ...sh], shade(sp.skin, -32), 0);
  c.restore();
  const spikes = f ? [214, 122, 206, 100, 200, 138, 188, 92, 178, 126, 166, 88, 152, 120, 140, 86, 128, 114, 116, 90, 104, 126, 96, 98, 88, 132]
                   : [212, 108, 204, 94, 198, 118, 186, 86, 174, 112, 162, 84, 150, 106, 138, 84, 126, 106, 114, 88, 102, 112, 94, 96, 86, 118];
  const cap = ['M', 86, spikes[spikes.length - 1], 'Q', 64, 28, 152, 22, 'Q', 240, 26, 216, spikes[1] + 14];
  for (let i = 0; i < spikes.length; i += 2) cap.push('L', spikes[i], spikes[i + 1]);
  cap.push('Z');
  fp(c, cap, h, 2.8);
  // clumps of shadow running from the crown into the spikes
  c.save(); path(c, cap); c.clip();
  for (let i = 0; i + 3 < spikes.length; i += 4) P(c, [152 + (spikes[i] - 152) * 0.15, 30, spikes[i] - 4, spikes[i + 1] - 14, spikes[i + 2], spikes[i + 3]], shade(h, -22), 0);
  c.restore();
  path(c, cap); c.lineWidth = 2.8; c.strokeStyle = INK; c.stroke();
  fp(c, ['M', 104, 60, 'Q', 150, 36, 200, 56, 'L', 194, 68, 'L', 184, 58, 'L', 174, 70, 'L', 162, 58, 'L', 150, 70, 'L', 138, 58, 'L', 126, 70, 'L', 114, 60, 'L', 108, 70, 'Z'], hl, 0);
  for (const [x0, x1] of [[150, 140], [176, 168], [124, 116], [196, 190]]) L(c, [x0, 32, x1 + 2, 74, x1, 100], hd, 1.4);
  for (const [x0, y0, x1, y1] of [[128, 46, 120, 62], [170, 44, 176, 58]]) L(c, [x0, y0, x1, y1], shade(h, 70), 1.4);
  if (f || st === 'long' || st === 'tail' || st === 'braids') {
    lock(c, 206, 98, 206, f ? 240 : 196, 8, -8, h);
    lock(c, 214, 100, 222, f ? 206 : 170, 5, -6, h);
    lock(c, 92, 100, 98, f ? 218 : 180, 7, 7, h);
    L(c, [208, 120, 208, 210], hd, 1.2);
  }
  if (st === 'braids') for (let i = 0; i < 8; i++) { const y = 150 + i * 16, x = 214 + Math.sin(i) * 2; fp(c, ['M', x, y - 10, 'L', x + 9, y, 'L', x, y + 10, 'L', x - 9, y, 'Z'], i % 2 ? h : hd, 2); }
}

function bustOutfit(c, sp, t) {
  const A = sp.armor, under = sp.under || shade(A.base, -72);
  if (sp.cape) fp(c, ['M', 104, 236, 'Q', 36, 250, 14, 400, 'L', 96, 400, 'Z'], sp.cape, 2.6);
  fp(c, ['M', 36, 400, 'Q', 46, 262, 104, 236, 'L', 196, 236, 'Q', 256, 262, 266, 400, 'Z'], under, 2.6);
  if (sp.robe) {
    fp(c, ['M', 104, 230, 'L', 150, 290, 'L', 196, 230, 'Q', 252, 254, 266, 400, 'L', 36, 400, 'Q', 48, 254, 104, 230, 'Z'], A.base, 2.6);
    fp(c, ['M', 36, 400, 'Q', 48, 254, 104, 230, 'L', 120, 250, 'Q', 84, 300, 86, 400, 'Z'], A.dark, 0);
    for (const x of [128, 172]) fp(c, ['M', x - 10, 244, 'L', x + 10, 250, 'L', x + 6, 400, 'L', x - 12, 400, 'Z'], A.trim, 2.2);
    return;
  }
  for (const y of [244, 256]) L(c, [62 + (y - 244), y + 10, 98, y - 6], shade(under, 26), 1.4);
  bevel(c, ['M', 112, 224, 'L', 190, 224, 'L', 206, 250, 'L', 98, 250, 'Z'], sp.coat ? A.trim : A.base, null, null, 2.4);
  if (!sp.coat) L(c, [108, 236, 196, 236], shade(A.base, -40), 1.4);
  if (sp.f) {
    // fitted breastplate over a dark suit
    const chest = ['M', 92, 256, 'Q', 150, 248, 210, 256, 'L', 216, 340, 'Q', 150, 350, 88, 340, 'Z'];
    fp(c, ['M', 94, 330, 'L', 208, 330, 'L', 216, 400, 'L', 86, 400, 'Z'], A.base, 2.6);
    fp(c, ['M', 94, 330, 'L', 126, 330, 'L', 120, 400, 'L', 86, 400, 'Z'], A.dark, 0);
    L(c, [100, 366, 210, 366], A.trim, 2.4);
    bevel(c, chest, A.base, A.light, A.dark, 2.8);
    c.save(); path(c, chest); c.clip();
    fp(c, ['M', 80, 240, 'L', 128, 240, 'L', 120, 350, 'L', 80, 350, 'Z'], A.dark, 0);
    for (const y of [312, 326]) L(c, [88, y, 216, y], shade(A.base, -30), 1.6);
    fp(c, ['M', 176, 262, 'L', 204, 262, 'L', 210, 312, 'L', 188, 300, 'Z'], A.light, 0);
    c.restore();
    L(c, [152, 254, 150, 340], A.dark, 2);
    L(c, [94, 262, 150, 254, 208, 262], A.trim, 2.2);
    L(c, [96, 268, 150, 260, 206, 268], shade(A.trim, 40), 1);
    bustMotif(c, A, true);
  } else {
    bevel(c, ['M', 98, 250, 'L', 204, 250, 'L', 216, 400, 'L', 86, 400, 'Z'], A.base, A.light, A.dark, 2.6);
    fp(c, ['M', 98, 250, 'L', 132, 250, 'L', 124, 400, 'L', 86, 400, 'Z'], A.dark, 0);
    fp(c, ['M', 170, 256, 'L', 198, 256, 'L', 204, 300, 'L', 182, 290, 'Z'], A.light, 0);
    if (!sp.coat) {
      bevel(c, ['M', 96, 318, 'Q', 152, 306, 212, 318, 'L', 216, 400, 'L', 88, 400, 'Z'], shade(A.base, -12), A.light, A.dark, 2.4);
      L(c, [152, 254, 151, 316], A.dark, 2); L(c, [100, 312, 212, 312], A.trim, 2.4);
      bustMotif(c, A, false);
    }
    else { for (const y of [272, 300, 328, 356]) { c.fillStyle = '#e8c25a'; c.beginPath(); c.arc(160, y, 3.4, 0, Math.PI * 2); c.fill(); } L(c, [150, 250, 150, 400], A.trim, 3); }
  }
  if (sp.sigil) { const st = []; for (let i = 0; i < 16; i++) { const r = i % 2 ? 3.4 : 9, an = -Math.PI / 2 + i * Math.PI / 8; st.push(150 + Math.cos(an) * r, (sp.f ? 382 : 282) + Math.sin(an) * r); } P(c, st, sp.sigil, 1.6); }
  if (A.seams) { c.save(); glowOn(c, A.glow, 12); L(c, [120, 262, 132, 290, 122, 316, 136, 352, 128, 392], A.glow, 2.4); L(c, [186, 262, 178, 296, 190, 330, 184, 380], A.glow, 2.2); c.restore(); }
  // shoulders
  if (!sp.coat) bevel(c, ['M', 92, 268, 'Q', 66, 284, 48, 304, 'L', 52, 322, 'Q', 74, 306, 98, 292, 'Z'], shade(A.dark, -10), A.base, null, 2.4);
  bevel(c, ['M', 108, 240, 'Q', 60, 236, 40, 270, 'L', 46, 306, 'Q', 74, 296, 96, 270, 'Z'], sp.coat ? A.trim : A.dark, sp.coat ? null : A.base, null, 2.6);
  if (!sp.coat) bevel(c, ['M', 208, 268, 'Q', 238, 284, 262, 300, 'L', 258, 320, 'Q', 234, 306, 206, 290, 'Z'], shade(A.base, -10), A.light, A.dark, 2.4);
  bevel(c, ['M', 192, 240, 'Q', 246, 232, 268, 268, 'L', 262, 308, 'Q', 232, 296, 206, 270, 'Z'], sp.coat ? A.trim : A.base, sp.coat ? null : A.light, A.dark, 2.6);
  if (!sp.coat && (A.rivet || A.motif === 'rivet')) { prv(c, 216, 252, A.rivet || shade(A.base, 55)); prv(c, 246, 262, A.rivet || shade(A.base, 55)); }
  if (sp.coat) for (let i = 0; i < 6; i++) L(c, [214 + i * 9, 286 + i * 2, 212 + i * 9, 304 + i * 2], '#e8c25a', 2);
  else {
    fp(c, ['M', 200, 244, 'Q', 240, 238, 258, 262, 'L', 236, 262, 'Q', 222, 250, 204, 252, 'Z'], A.light, 0);
    L(c, [210, 278, 236, 290, 262, 300], A.glow || A.trim, 2.4);
    if (A.pauldron === 'layered') { L(c, [206, 262, 236, 274, 264, 284], A.dark, 1.8); }
    if (A.pauldron === 'spiky') { bevel(c, ['M', 222, 240, 'L', 236, 200, 'L', 242, 242, 'Z'], A.spike || A.light, null, null, 2.2); bevel(c, ['M', 244, 244, 'L', 262, 214, 'L', 260, 254, 'Z'], A.spike || A.light, null, null, 2.2); }
  }
  if (sp.cape) { fp(c, ['M', 186, 238, 'L', 196, 228, 'L', 206, 238, 'L', 196, 248, 'Z'], '#e8c25a', 2); c.fillStyle = A.trim; c.beginPath(); c.arc(196, 238, 3, 0, Math.PI * 2); c.fill(); }
  if (sp.arms === 'crossed') {
    // forearms folded under the chest, far arm beneath
    fp(c, ['M', 42, 300, 'Q', 52, 344, 92, 352, 'Q', 150, 346, 204, 358, 'L', 202, 390, 'Q', 140, 380, 80, 392, 'Q', 40, 380, 36, 330, 'Z'], A.dark, 2.6);
    fp(c, ['M', 262, 304, 'Q', 256, 346, 222, 352, 'Q', 168, 352, 106, 366, 'L', 110, 396, 'Q', 176, 384, 232, 386, 'Q', 270, 376, 268, 330, 'Z'], A.base, 2.6);
    for (const x of [186, 206, 226]) L(c, [x, 352, x + 2, 384], A.dark, 1.4);
    bevel(c, ['M', 106, 366, 'L', 142, 360, 'L', 146, 392, 'L', 110, 396, 'Z'], A.light, null, A.base, 2.2);
    fp(c, ['M', 230, 356, 'Q', 252, 346, 258, 322, 'L', 264, 330, 'Q', 260, 356, 236, 366, 'Z'], A.light, 0);
    L(c, [152, 358, 156, 390], A.trim, 2.4);
    for (const x of [114, 122, 130]) L(c, [x, 368, x - 2, 392], A.dark, 1.2);
  }
}

function bustGear(c, sp, face, phase) {
  const g = sp.gear, A = sp.armor, eye = sp.eyes;
  if (phase === 'back') {
    if (g === 'crest') fp(c, ['M', 150, 30, 'Q', 120, -12, 56, 8, 'Q', 16, 40, 8, 118, 'Q', 48, 62, 122, 54, 'Z'], sp.plume || sp.hair, 2.6);
    if (g === 'hood') fp(c, ['M', 62, 260, 'Q', 44, 120, 90, 46, 'Q', 150, -6, 218, 42, 'Q', 254, 110, 240, 260, 'Z'], sp.hoodCol || A.cape || A.dark, 2.8);
    return;
  }
  if (g === 'visor' || g === 'horned') {
    if (g === 'horned') { fp(c, ['M', 104, 50, 'Q', 50, 30, 36, -10, 'Q', 70, 20, 118, 36, 'Z'], '#e8dcc4', 2.4); }
    const helm = ['M', 84, 146, 'Q', 68, 28, 150, 20, 'Q', 234, 24, 220, 120, 'L', 216, 176, 'Q', 198, 208, 160, 216, 'Q', 112, 212, 96, 182, 'Z'];
    fp(c, helm, A.base, 3);
    c.save(); path(c, helm); c.clip();
    fp(c, ['M', 60, 0, 'L', 124, 0, 'Q', 110, 120, 128, 230, 'L', 60, 230, 'Z'], A.dark, 0);
    fp(c, ['M', 150, 26, 'Q', 210, 30, 214, 90, 'L', 196, 90, 'Q', 190, 48, 150, 40, 'Z'], A.light, 0);
    c.restore();
    fp(c, ['M', 112, 116, 'L', 220, 108, 'L', 220, 128, 'L', 114, 136, 'Z'], '#07050c', 2.4);
    c.save(); glowOn(c, eye, 16); fp(c, ['M', 122, 120, 'L', 216, 114, 'L', 216, 122, 'L', 122, 128, 'Z'], eye, 0); c.restore();
    for (const x of [168, 182, 196]) L(c, [x, 160, x + 2, 190], A.dark, 2.2);
    L(c, [150, 22, 160, 110], A.trim, 2.4);
    if (g === 'horned') fp(c, ['M', 196, 46, 'Q', 236, 20, 250, -16, 'Q', 230, 34, 206, 62, 'Z'], '#e8dcc4', 2.4);
    return;
  }
  if (g === 'knight' || g === 'crest') {
    fp(c, ['M', 84, 152, 'Q', 66, 30, 150, 22, 'Q', 234, 26, 218, 104, 'L', 198, 100, 'Q', 150, 88, 108, 104, 'L', 104, 162, 'Q', 96, 178, 86, 170, 'Z'], A.base, 2.8);
    fp(c, ['M', 150, 28, 'Q', 212, 32, 214, 92, 'L', 198, 94, 'Q', 192, 46, 150, 40, 'Z'], A.light, 0);
    L(c, [108, 104, 150, 92, 198, 100, 218, 104], A.trim, 3);
    fp(c, ['M', 204, 102, 'L', 218, 104, 'L', 212, 172, 'L', 198, 184, 'Z'], A.base, 2.4);
    c.fillStyle = A.rivet || A.light; for (const [x, y] of [[96, 120], [96, 146], [209, 120]]) { c.beginPath(); c.arc(x, y, 2.6, 0, Math.PI * 2); c.fill(); }
    return;
  }
  if (g === 'circlet') {
    fp(c, ['M', 88, 96, 'Q', 150, 76, 214, 94, 'L', 214, 102, 'Q', 150, 86, 88, 104, 'Z'], '#e8c25a', 2.2);
    c.save(); glowOn(c, eye, 12); fp(c, ['M', 166, 79, 'L', 174, 89, 'L', 166, 99, 'L', 158, 89, 'Z'], eye, 2); c.restore();
  }
  if (g === 'mask') {
    L(c, [128, 164, 96, 138], '#2a2a33', 3);
    fp(c, ['M', 128, 160, 'L', 200, 150, 'L', 206, 186, 'Q', 186, 214, 152, 212, 'L', 122, 188, 'Z'], '#4a4e5a', 2.6);
    fp(c, ['M', 128, 160, 'L', 200, 150, 'L', 202, 164, 'L', 130, 172, 'Z'], '#6a707e', 0);
    for (const y of [176, 188]) L(c, [140, y, 198, y - 4], '#22242a', 1.6);
    fp(c, ['M', 160, 200, 'L', 186, 196, 'L', 188, 222, 'L', 162, 226, 'Z'], '#33363e', 2.2);
  }
  if (g === 'hood') {
    c.save(); path(c, face); c.clip(); fp(c, ['M', 60, 30, 'L', 240, 30, 'L', 240, 112, 'Q', 160, 96, 60, 124, 'Z'], 'rgba(8,4,12,0.45)', 0); c.restore();
    const hc = sp.hoodCol || A.cape || A.dark;
    fp(c, ['M', 82, 150, 'Q', 80, 50, 150, 40, 'Q', 222, 44, 222, 134, 'L', 208, 108, 'Q', 152, 64, 98, 112, 'Z'], hc, 2.8);
    fp(c, ['M', 150, 46, 'Q', 210, 50, 218, 118, 'L', 206, 104, 'Q', 184, 74, 150, 66, 'Z'], shade(hc, 30), 0);
  }
}

// Draws the bust in its 300 x 340 box at the current transform.
function drawBust(c, sp, t) {
  c.save(); c.lineJoin = 'round'; c.lineCap = 'round';
  if (sp.aura) { const g = c.createRadialGradient(150, 160, 20, 150, 160, 190); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(0.6, sp.aura); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(0, 0, 300, 340); }
  const closed = sp.gear === 'visor' || sp.gear === 'horned';
  bustGear(c, sp, null, 'back');
  if (!closed && sp.gear !== 'hood') bustHairBack(c, sp, t);
  bustOutfit(c, sp, t);
  if (closed) bustGear(c, sp, null, 'front');
  else {
    const face = bustFace(c, sp);
    bustEyes(c, sp);
    bustMarks(c, sp);
    if (sp.gear !== 'knight' && sp.gear !== 'crest' && sp.gear !== 'hood') bustHairFront(c, sp, face);
    bustGear(c, sp, face, 'front');
    if (sp.gear === 'hood' && sp.glowEyes) { c.save(); glowOn(c, sp.eyes, 14); c.fillStyle = sp.eyes; c.fillRect(120, 128, 20, 4); c.fillRect(180, 127, 12, 4); c.restore(); }
  }
  c.restore();
}

const HAIR_STYLE = { short: 'short', long: 'long', mohawk: 'mohawk', tail: 'tail', braids: 'braids', topknot: 'topknot', shaved: 'shaved' };
// A portrait spec from a hero-style look: { look, armor }.
function bustFromLook(hl) {
  const L0 = { ...DEFAULT_LOOK, ...(hl.look || {}) };
  return { f: L0.build === 'f', skin: pal(L0.skin, SKIN), hair: pal(L0.hairCol, HAIR), eyes: pal(L0.eyes, EYES), style: HAIR_STYLE[L0.hair] || 'short',
    beard: L0.beard, mark: L0.mark, gear: L0.gear, armor: hl.armor, cape: hl.armor.cape, sigil: hl.armor.sigil };
}
function bustSpec(id) {
  const lyra = { f: true, skin: '#eab592', hair: '#b4502a', eyes: '#2fbf7a', style: 'tail', armor: armorStyle({ base: '#d4dbe6', trim: '#2ab8b0', motif: 'filigree', rivet: '#e8c25a' }), under: '#1a262c', arms: 'crossed', sigil: '#2ab8b0' };
  const kol = { f: false, skin: '#d8a17c', hair: '#cfd0d8', eyes: '#e0a83a', style: 'swept', beard: 'full', mark: 'scar', armor: armorStyle(KOL_ARMOR), cape: '#7a1a24', expr: 'grim', sigil: '#e8c25a' };
  switch (id) {
    case 'lyra': return lyra;
    case 'lyraHood': return { ...lyra, gear: 'hood', hoodCol: '#2a2a34', arms: null };
    case 'kol': return kol;
    case 'kolHood': return { ...kol, gear: 'hood', hoodCol: '#1a1420', glowEyes: true, cape: null };
    case 'kolDark': return { ...kol, eyes: '#c46aff', armor: armorStyle(KOL_DARK_ARMOR), cape: '#2a0a24', angry: true, aura: 'rgba(160,60,255,0.35)', sigil: null };
    case 'gm': return { f: false, skin: '#8a5638', hair: '#e8e8ee', eyes: '#e0a83a', style: 'long', beard: 'full', gear: 'circlet', robe: true, armor: armorStyle({ base: '#ece6d6', trim: '#c9a24a' }) };
    case 'vex': return { f: false, skin: '#f0c8a8', hair: '#e8e8ee', eyes: '#3a7aff', style: 'swept', beard: 'goatee', coat: true, armor: armorStyle({ base: '#e6e6f0', trim: '#2a4ab0' }), expr: 'grim' };
    case 'hero': return bustFromLook(menuHero());
  }
  return null;
}
// Paints a portrait into a canvas: rune background, then the bust scaled to fit. crop 'face' zooms on the head.
const BUST_LAYERS = {};
function paintBust(cv, sp, w, h, t, crop, bg) {
  const c = hiDpi(cv, w, h), key = w + 'x' + h;
  runeBg(c, w, h, t, bg || '#d4142e');
  if (!BUST_LAYERS[key]) BUST_LAYERS[key] = [document.createElement('canvas'), document.createElement('canvas')];
  const [lc, tc] = BUST_LAYERS[key], l = hiDpi(lc, w, h), tx = hiDpi(tc, w, h);
  l.clearRect(0, 0, w, h); l.save();
  if (crop === 'face') { const k = w / 150; l.translate(w / 2 - 152 * k, h / 2 - 124 * k); l.scale(k, k); }
  else { const tall = crop === 'full' ? 400 : 340, k = Math.min(w / 300, h / tall); l.translate((w - 300 * k) / 2, h - tall * k); l.scale(k, k); }
  drawBust(l, sp, t);
  l.restore();
  c.drawImage(lc, 0, 0, w, h);
  // edge light: the sprite's upper-left rim, tinted by the rings behind it
  const d = Math.max(1.2, w / 120);
  tx.save(); tx.globalCompositeOperation = 'copy'; tx.drawImage(lc, 0, 0, w, h);
  tx.globalCompositeOperation = 'source-in'; tx.fillStyle = bg === '#9a3aff' ? '#c88aff' : '#ff4a5e'; tx.fillRect(0, 0, w, h);
  tx.globalCompositeOperation = 'destination-out'; tx.drawImage(lc, d, d * 0.8, w, h); tx.restore();
  c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.75; c.drawImage(tc, 0, 0, w, h); c.restore();
}
