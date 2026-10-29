// Vesperal — ateliê: projéteis pintados (virotes, cera a arder, centelha, metal fundido, cacos de vitral, notas,
// penas, espinhos, ondas de som, chamas no chão, ondas de choque, incenso, onda espiritual).
// Uma folha 'fx_proj' com uma animação por tipo; o jogo roda-a pela velocidade quando faz sentido.
'use strict';
(function (A) {
  const S = 4, K = A.kit(S);
  const TAU = A.TAU;
  const mat = (b, s, l) => A.mat(b, { shadow: s, light: l });
  const M = {
    wood: mat('#6a5038', '#3a2a1c', '#9a7a58'), iron: mat('#5a5862', '#2a2830', '#a8a4b0'), leather: mat('#5a3a2a', '#321e14', '#7e5a44'),
    wax: mat('#e2d4ae', '#a0906c', '#f8f0dc'), dirt: mat('#4a3a2c', '#261c14', '#6e5a46'), stone: mat('#6e6a70', '#3a363c', '#a29ea4'),
    bone: mat('#d4c8ae', '#8a7e66', '#f0e6d0'), gold: mat('#c09a48', '#6e5424', '#f4dc98'), feather: mat('#24222c', '#121118', '#4c4a5e'),
    thorn: mat('#4a3a24', '#261c10', '#7a6440'), pod: mat('#4e6a2a', '#2a3a16', '#7a9a48'),
  };
  // chama em lágrima (núcleo branco); dir = para onde aponta a cauda (radianos)
  function flame(ctx, x, y, h, w, sway, alpha = 1) {
    ctx.save(); ctx.translate(x * S, y * S); ctx.globalCompositeOperation = 'lighter';
    const sh = (hh, ww, col) => { ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(-ww * S, 0); ctx.quadraticCurveTo(-ww * 1.1 * S, -hh * 0.55 * S, sway * S, -hh * S); ctx.quadraticCurveTo(ww * 1.1 * S, -hh * 0.55 * S, ww * S, 0); ctx.quadraticCurveTo(0, ww * 0.8 * S, -ww * S, 0); ctx.fill(); };
    sh(h, w, `rgba(255,96,24,${0.75 * alpha})`); sh(h * 0.7, w * 0.66, `rgba(255,186,72,${0.85 * alpha})`); sh(h * 0.38, w * 0.34, `rgba(255,248,220,${0.95 * alpha})`);
    ctx.restore();
  }
  function glowDot(ctx, x, y, r, col, a) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; const g = ctx.createRadialGradient(x * S, y * S, 0, x * S, y * S, r * S); g.addColorStop(0, A.rgba(col, a)); g.addColorStop(1, A.rgba(col, 0)); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x * S, y * S, r * S, 0, TAU); ctx.fill(); ctx.restore(); }

  // ---------------- desenhos (todos apontados para +x; centro na origem)
  const D = {};
  D.bolt = (ctx) => {
    K.tube(ctx, [[-7.0, 0], [5.0, 0]], [0.32, 0.3], M.wood, { depth: S * 0.12, flat: true });
    K.poly(ctx, [[4.8, -0.6], [7.6, 0], [4.8, 0.6]], M.iron, { depth: S * 0.12 });
    for (const s of [-1, 1]) K.poly(ctx, [[-7.0, 0], [-4.4, s * 0.25], [-5.0, s * 1.4], [-7.4, s * 1.2]], M.leather, { depth: S * 0.1, inkW: K.IW * 0.6 });
  };
  D.orb = (ctx, i) => { // gota de cera a arder
    flame(ctx, -0.6, 0, 6.5 + (i % 2) * 0.8, 2.2, 0, 0.9);
    const p = K.blob(ctx, [[1.8, 0], [0.6, -1.6], [-1.6, -1.2], [-2.4, 0], [-1.6, 1.2], [0.6, 1.6]], M.wax, { depth: S * 0.3, hlw: S * 0.2 });
    glowDot(ctx, 0, 0, 3.4, '#ffb050', 0.5); void p;
  };
  D.spark = (ctx, i) => { // Centelha: brasa com cauda de fogo
    ctx.save(); ctx.rotate(-Math.PI / 2); flame(ctx, 0, 1.2, 8 + (i % 2), 2.0, (i - 1.5) * 0.3); ctx.restore();
    glowDot(ctx, 0.6, 0, 3.6, '#ffc060', 0.8);
    K.blob(ctx, [[1.6, 0], [0.4, -1.2], [-0.9, -0.7], [-0.9, 0.7], [0.4, 1.2]], mat('#ffe0a0', '#ff8a30', '#fff8e0'), { depth: S * 0.2, inkW: K.IW * 0.6 });
  };
  D.molten = (ctx, i) => {
    const w = (i % 2) * 0.3;
    const p = K.blobPath([[2.4 + w, 0], [1.2, -2.0], [-1.0, -2.2 + w], [-2.6, -0.6], [-2.2, 1.6], [0.2, 2.2 - w], [1.8, 1.4]]);
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 3 * S); g.addColorStop(0, '#fff0a0'); g.addColorStop(0.5, '#ff9a30'); g.addColorStop(1, '#a03010');
    ctx.fillStyle = g; ctx.fill(p); ctx.lineWidth = K.IW; ctx.strokeStyle = '#2a0e06'; ctx.stroke(p);
    K.poly(ctx, [[-1.4, -1.6], [0.2, -1.9], [0.4, -1.0], [-1.2, -0.8]], mat('#3a2a26', '#1a1210', '#5a4842'), { depth: S * 0.1, inkW: K.IW * 0.5 });
    glowDot(ctx, 0, 0, 4.2, '#ff7a20', 0.45);
  };
  D.ingot = (ctx) => {
    K.poly(ctx, [[-3.4, 1.4], [-2.6, -1.4], [2.6, -1.4], [3.4, 1.4]], mat('#ff9a30', '#c04a10', '#ffe090'), { depth: S * 0.3, hlw: S * 0.2 });
    K.line(ctx, [[-2.0, -0.6], [2.0, -0.6]], 0.2, 'rgba(255,250,220,0.9)');
    glowDot(ctx, 0, 0, 4.6, '#ff8030', 0.5);
  };
  D.clod = (ctx) => {
    K.blob(ctx, [[2.4, 0.4], [1.4, -2.0], [-1.0, -2.4], [-2.6, -0.4], [-1.8, 2.0], [0.8, 2.4]], M.dirt, { depth: S * 0.5, hlw: S * 0.25 });
    for (const [x, y, r] of [[-0.8, -0.8, 0.6], [1.0, 0.6, 0.5], [-0.2, 1.4, 0.4]]) K.blob(ctx, [[x - r, y], [x, y - r], [x + r, y], [x, y + r]], M.stone, { depth: S * 0.15, inkW: K.IW * 0.5 });
    K.tube(ctx, [[0.6, -1.6], [2.4, -2.6]], [0.3, 0.22], M.bone, { depth: S * 0.1 });
  };
  D.note = (ctx, i) => { // nota de ouro com brilho violeta (canto)
    glowDot(ctx, 0, 0, 4.6, '#c890ff', 0.5 + (i % 2) * 0.15);
    ctx.save(); ctx.rotate(-0.25);
    K.blob(ctx, [[-1.8, 1.6], [-0.6, 0.8], [0.6, 1.2], [0.2, 2.4], [-1.2, 2.8]], M.gold, { depth: S * 0.25, hlw: S * 0.15, inkW: K.IW * 0.7 });
    K.tube(ctx, [[0.45, 1.6], [0.45, -3.0]], [0.24, 0.22], M.gold, { depth: S * 0.1, flat: true, inkW: K.IW * 0.6 });
    const fl = A.path((q) => { q.M(0.45, -3.0); q.Q(2.6, -2.4, 2.4, -0.4); q.Q(2.0, -1.6, 0.45, -1.8); q.Z(); }, S); K.paint(ctx, fl, M.gold, { depth: S * 0.15, inkW: K.IW * 0.6 });
    ctx.restore();
  };
  D.light = (ctx, i) => { // pérola de luz com raios curtos irregulares (não é uma cruz)
    glowDot(ctx, 0, 0, 6, '#ffe8a0', 0.7);
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let k = 0; k < 7; k++) { const a = k / 7 * TAU + i * 0.3, L = 3.4 + ((k * 3 + i) % 4) * 0.6; ctx.fillStyle = 'rgba(255,240,200,0.55)'; ctx.beginPath(); ctx.moveTo(Math.cos(a - 0.12) * 1.2 * S, Math.sin(a - 0.12) * 1.2 * S); ctx.lineTo(Math.cos(a) * L * S, Math.sin(a) * L * S); ctx.lineTo(Math.cos(a + 0.12) * 1.2 * S, Math.sin(a + 0.12) * 1.2 * S); ctx.fill(); }
    ctx.restore();
    K.blob(ctx, [[1.4, 0], [0, -1.4], [-1.4, 0], [0, 1.4]], mat('#fffaf0', '#ffd890', '#ffffff'), { depth: S * 0.15, ink: false });
  };
  const glassShard = (col) => (ctx) => {
    const p = K.polyPath([[3.6, 0], [0.4, -1.6], [-2.8, -0.8], [-2.2, 1.2], [0.6, 1.4]]);
    const g = ctx.createLinearGradient(-3 * S, -2 * S, 3 * S, 2 * S); g.addColorStop(0, A.mix(col, '#ffffff', 0.4)); g.addColorStop(1, A.mix(col, '#000000', 0.2));
    ctx.fillStyle = g; ctx.fill(p); ctx.lineWidth = S * 0.35; ctx.strokeStyle = '#1a1820'; ctx.lineJoin = 'round'; ctx.stroke(p);
    K.line(ctx, [[-1.0, -0.6], [1.6, 0.2]], 0.14, 'rgba(255,255,255,0.7)');
  };
  D.glassR = glassShard('#c03040'); D.glassB = glassShard('#3050c0'); D.glassY = glassShard('#e0b040');
  D.seed = (ctx) => {
    K.blob(ctx, [[2.6, 0], [1.2, -1.8], [-1.4, -1.6], [-2.6, 0], [-1.4, 1.6], [1.2, 1.8]], M.pod, { depth: S * 0.35, hlw: S * 0.2 });
    for (let k = 0; k < 6; k++) { const a = k / 6 * TAU; K.poly(ctx, [[Math.cos(a - 0.2) * 1.9, Math.sin(a - 0.2) * 1.6], [Math.cos(a) * 3.0, Math.sin(a) * 2.6], [Math.cos(a + 0.2) * 1.9, Math.sin(a + 0.2) * 1.6]], M.thorn, { depth: S * 0.1, inkW: K.IW * 0.5 }); }
    glowDot(ctx, 0, 0, 1.6, '#b0ff70', 0.6);
  };
  D.thorn = (ctx) => {
    K.poly(ctx, [[4.6, 0], [-3.0, -1.1], [-3.6, 0], [-3.0, 1.1]], M.thorn, { depth: S * 0.2, hlw: S * 0.12 });
    K.line(ctx, [[-2.4, 0], [3.6, 0]], 0.12, 'rgba(160,140,90,0.7)');
  };
  D.moth = (ctx, i) => {
    const f = i % 2 ? 0.4 : 1;
    for (const s of [-1, 1]) K.blob(ctx, [[0, 0], [-1.2, -2.6 * f * s], [-3.0, -2.4 * f * s], [-2.4, -0.6 * s]], mat('#c8b890', '#7a6c50', '#eee0c0'), { depth: S * 0.15, inkW: K.IW * 0.6 });
    K.tube(ctx, [[1.4, 0], [-1.6, 0]], [0.6, 0.4], mat('#8a7e6a', '#4e4636', '#bcae92'), { depth: S * 0.15 });
    glowDot(ctx, 0, 0, 3, '#f0e0a0', 0.4);
  };
  D.feather = (ctx) => {
    const p = A.path((q) => { q.M(4.4, 0); q.Q(1.0, -1.6, -3.6, -0.6); q.L(-4.2, 0.2); q.Q(0.6, 1.4, 4.4, 0); q.Z(); }, S);
    K.paint(ctx, p, M.feather, { depth: S * 0.2, hlw: S * 0.12 });
    K.line(ctx, [[-4.6, 0.2], [4.4, 0]], 0.12, '#5a5870');
    K.blob(ctx, [[4.4, 0], [3.4, -0.6], [3.0, 0.4]], M.wax, { depth: S * 0.05, ink: false });
  };
  // onda de som: crescente translúcida com brilhos de bronze (sai do sino)
  D.wave = (ctx, i) => {
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let k = 0; k < 3; k++) {
      const r = 6 + k * 1.6 + i * 0.4, a = 0.85 - k * 0.12;
      const g = ctx.createRadialGradient(-r * S * 0.6, 0, (r - 1.2) * S, -r * S * 0.6, 0, (r + 0.6) * S);
      g.addColorStop(0, 'rgba(255,220,140,0)'); g.addColorStop(0.6, `rgba(255,224,150,${0.5 * a})`); g.addColorStop(1, 'rgba(255,220,140,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(-r * S * 0.6, 0, (r + 0.6) * S, -0.95, 0.95); ctx.arc(-r * S * 0.6, 0, (r - 1.2) * S, 0.95, -0.95, true); ctx.fill();
    }
    for (let k = 0; k < 5; k++) { const a = -0.8 + k * 0.4, r = 6.4 + i * 0.4; ctx.fillStyle = 'rgba(255,248,220,0.9)'; ctx.beginPath(); ctx.arc((-r * 0.6 + Math.cos(a) * r) * S, Math.sin(a) * r * S, 0.3 * S, 0, TAU); ctx.fill(); }
    ctx.restore();
  };
  D.fire = (ctx, i) => { for (let k = 0; k < 4; k++) flame(ctx, -3 + k * 2, 2, 5 + ((k + i) % 3) * 1.4, 1.4, ((k + i) % 2 ? 0.5 : -0.5)); };
  // onda de choque: lascas de terra e línguas de fogo que se erguem do chão
  D.shockwave = (ctx, i) => {
    for (let k = 0; k < 4; k++) { const x = -3.6 + k * 2.4, h = 2.6 + ((k + i) % 3) * 1.2; K.poly(ctx, [[x - 1.0, 2.4], [x - 0.2, 2.4 - h], [x + 0.9, 2.4 - h * 0.6], [x + 1.1, 2.4]], M.dirt, { depth: S * 0.2, hlw: S * 0.1, inkW: K.IW * 0.7 }); }
    for (let k = 0; k < 3; k++) flame(ctx, -2.4 + k * 2.6, 2.2, 4 + ((k + i) % 2) * 1.6, 1.2, (k - 1) * 0.6, 0.8);
  };
  D.dust = (ctx, i) => { // onda de choque sem fogo (pá, malho)
    for (let k = 0; k < 4; k++) { const x = -3.6 + k * 2.4, h = 2.4 + ((k + i) % 3) * 1.2; K.poly(ctx, [[x - 1.0, 2.4], [x - 0.2, 2.4 - h], [x + 0.9, 2.4 - h * 0.6], [x + 1.1, 2.4]], M.dirt, { depth: S * 0.2, hlw: S * 0.1, inkW: K.IW * 0.7 }); }
    ctx.save(); for (let k = 0; k < 5; k++) { ctx.fillStyle = 'rgba(150,130,110,0.45)'; ctx.beginPath(); ctx.arc((-4 + k * 2) * S, (1 - ((k + i) % 3) * 0.8) * S, (1.4 + (k % 2) * 0.4) * S, 0, TAU); ctx.fill(); } ctx.restore();
  };
  D.incense = (ctx, i) => {
    ctx.save(); for (let k = 0; k < 5; k++) { const a = k / 5 * TAU + i * 0.4; ctx.fillStyle = `rgba(150,130,170,${0.35 + (k % 2) * 0.1})`; ctx.beginPath(); ctx.arc(Math.cos(a) * 1.6 * S, Math.sin(a) * 1.4 * S, (2.2 + (k % 3) * 0.4) * S, 0, TAU); ctx.fill(); } ctx.restore();
    glowDot(ctx, 0, 0, 2.2, '#ff8040', 0.7);
  };
  D.spiritwave = (ctx, i) => {
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createLinearGradient(-6 * S, 0, 4 * S, 0); g.addColorStop(0, 'rgba(160,120,255,0)'); g.addColorStop(0.7, 'rgba(190,160,255,0.55)'); g.addColorStop(1, 'rgba(245,235,255,0.9)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(-5 * S, -7 * S); ctx.quadraticCurveTo(5 * S, -4 * S, 3.6 * S, 0); ctx.quadraticCurveTo(5 * S, 4 * S, -5 * S, 7 * S); ctx.quadraticCurveTo(1 * S, 0, -5 * S, -7 * S); ctx.fill();
    for (let k = 0; k < 4; k++) { ctx.fillStyle = A.rgba(['#ff8090', '#80a0ff', '#ffe080', '#a0ffc0'][k], 0.9); const y = -4.5 + k * 3 + (i % 2) * 0.6; ctx.beginPath(); ctx.moveTo(2.4 * S, y * S); ctx.lineTo(3.2 * S, (y + 0.8) * S); ctx.lineTo(2.2 * S, (y + 1.2) * S); ctx.fill(); }
    ctx.restore();
  };
  const ANIMS = { bolt: 1, orb: 4, spark: 4, molten: 2, ingot: 1, clod: 1, note: 2, light: 4, glassR: 1, glassB: 1, glassY: 1, seed: 1, thorn: 1, moth: 2, feather: 1, wave: 4, fire: 4, shockwave: 4, dust: 4, incense: 4, spiritwave: 2 };
  A.register('fx_proj', () => {
    const anims = {};
    for (const [k, n] of Object.entries(ANIMS)) anims[k] = { n, fps: 12, loop: true, frame(t, i, st, warm, ctx) { if (warm) return null; D[k](ctx, i); return {}; } };
    return A.buildSheet({ name: 'fx_proj', scale: S, box: [26, 26], anchor: [13, 13], anims });
  });
  (A.previewCell = A.previewCell || {}).fx_proj = [26, 26];
})(window.ART);
