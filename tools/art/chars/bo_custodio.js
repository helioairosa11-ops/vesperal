// Vesperal — O Custódio de Ouro (chefe opcional, sem pontos fracos): uma custódia viva, o sol de ouro onde se
// mostrava a hóstia, que acordou com um olho no lugar dela. Paira; raios alternados (lanças rectas e chamas
// onduladas), anel de pedras, a luneta de vidro com o olho, cruz no alto e a haste com o nó a terminar em ponta.
// Exportada a ×1.6, ancorada ao centro. → assets/sprites/en_b_custodio.png
'use strict';
(function (A) {
  const S = 5, K = A.kit(S), D2R = A.D2R;
  const M = {
    gold: A.mat('#b8924a', { shadow: '#6a5024', light: '#f4dc9c', deep: '#2a1e0c' }),
    goldD: A.mat('#8a6a30', { shadow: '#4a3618', light: '#d0aa62', deep: '#1c140a' }),
    ruby: A.mat('#a0182a', { shadow: '#500810', light: '#ff6070' }),
    sapph: A.mat('#1e3a8a', { shadow: '#0c1a48', light: '#6a8aff' }),
    glass: A.mat('#e8e0c8', { shadow: '#a89a78', light: '#ffffff' }),
  };
  const rig = new A.Rig([{ n: 'root', len: 1, a: 0 }]);
  const P = (x) => A.pose({}, x, [0, 0]);

  function draw(ctx, W, x) {
    const spin = (x.spin || 0) * D2R, fl = x.flare === undefined ? 1 : x.flare, tilt = (x.tilt || 0) * D2R, broken = x.broken || 0;
    ctx.save(); ctx.rotate(tilt);
    // haste com o nó e a ponta (por baixo de tudo)
    K.tube(ctx, [[0, 11], [0, 18], [0, 24]], [1.6, 1.1, 1.4], M.goldD, { depth: S * 0.4, flat: true });
    K.blob(ctx, [[-4.2, 23.4], [0, 21.4], [4.2, 23.4], [3.4, 27.4], [0, 28.4], [-3.4, 27.4]], M.gold, { depth: S * 0.5, hlw: S * 0.3 });
    for (const s of [-1, 1]) K.dot(ctx, s * 2.2, 25.2, 0.55, s < 0 ? M.ruby.base : M.sapph.base);
    K.tube(ctx, [[0, 28], [0, 33], [0, 38]], [1.6, 0.9, 0.05], M.goldD, { depth: S * 0.3, flat: true });
    // raios: lanças rectas compridas alternadas com chamas onduladas
    const n = 24;
    for (let i = 0; i < n; i++) {
      if (broken > 0 && (i * 7) % 10 < broken * 10) continue;
      const a = spin + i / n * A.TAU, long = i % 2 === 0, L = (long ? 25 : 17) * fl, r0 = 12.4;
      const c = Math.cos(a), s = Math.sin(a), px = -s, py = c;
      if (long) {
        K.poly(ctx, [[c * r0 + px * 1.5, s * r0 + py * 1.5], [c * L, s * L], [c * r0 - px * 1.5, s * r0 - py * 1.5]], i % 4 === 0 ? M.gold : M.goldD, { depth: S * 0.15, hlw: S * 0.1 });
        K.line(ctx, [[c * (r0 + 1), s * (r0 + 1)], [c * (L - 2), s * (L - 2)]], 0.14, A.rgba(M.gold.light, 0.8));
      } else {
        const pts = []; for (let k = 0; k <= 6; k++) { const t = k / 6, w = Math.sin(t * Math.PI * 2.5) * 1.2 * (1 - t); pts.push([c * (r0 + (L - r0) * t) + px * w, s * (r0 + (L - r0) * t) + py * w]); }
        K.tube(ctx, pts, [1.2, 1.1, 0.9, 0.7, 0.5, 0.3, 0.05], M.gold, { depth: S * 0.15, flat: true });
      }
    }
    // cruz no alto, presa ao anel por uma haste
    K.tube(ctx, [[0, -13], [0, -19], [0, -25.4]], [1.0, 0.85, 0.9], M.goldD, { depth: S * 0.3, flat: true });
    K.blob(ctx, [[-1.6, -21], [0, -22.6], [1.6, -21], [0, -19.4]], M.gold, { depth: S * 0.2 });
    ctx.save();
    K.poly(ctx, [[-0.8, -25], [0.8, -25], [0.8, -29.4], [2.8, -29.4], [2.8, -31], [0.8, -31], [0.8, -34], [-0.8, -34], [-0.8, -31], [-2.8, -31], [-2.8, -29.4], [-0.8, -29.4]], M.gold, { depth: S * 0.2 });
    ctx.restore();
    // anel de pedras
    const ring = A.path((q) => { q.M(13.4, 0); for (let k = 1; k <= 40; k++) { const a = k / 40 * A.TAU; q.L(Math.cos(a) * 13.4, Math.sin(a) * 13.4); } q.Z(); q.M(9.8, 0); for (let k = 40; k >= 0; k--) { const a = k / 40 * A.TAU; q.L(Math.cos(a) * 9.8, Math.sin(a) * 9.8); } q.Z(); }, S);
    K.paint(ctx, ring, M.gold, { depth: S * 0.5, hlw: S * 0.3 });
    for (let i = 0; i < 8; i++) { const a = i / 8 * A.TAU + Math.PI / 8; K.blob(ctx, [[Math.cos(a) * 11.6 - 1, Math.sin(a) * 11.6], [Math.cos(a) * 11.6, Math.sin(a) * 11.6 - 1], [Math.cos(a) * 11.6 + 1, Math.sin(a) * 11.6], [Math.cos(a) * 11.6, Math.sin(a) * 11.6 + 1]], i % 2 ? M.ruby : M.sapph, { depth: S * 0.2, hlw: S * 0.15 }); }
    // luneta de vidro com o olho
    const lens = A.path((q) => { q.M(9.6, 0); for (let k = 1; k <= 40; k++) { const a = k / 40 * A.TAU; q.L(Math.cos(a) * 9.6, Math.sin(a) * 9.6); } q.Z(); }, S);
    ctx.save(); ctx.clip(lens);
    const gl = ctx.createRadialGradient(0, 0, 0, 0, 0, 9.6 * S); gl.addColorStop(0, '#fffbe8'); gl.addColorStop(0.55, '#f0d890'); gl.addColorStop(1, '#a8823a'); ctx.fillStyle = gl; ctx.fill(lens);
    const ey = x.eye === undefined ? 1 : x.eye, lk = x.look || 0;
    if (ey > 0.05) {
      const ew = 6.6, eh = 3.2 * ey;
      const eye = A.path((q) => { q.M(-ew, 0); q.Q(0, -eh * 1.6, ew, 0); q.Q(0, eh * 1.6, -ew, 0); q.Z(); }, S);
      ctx.fillStyle = '#fff8ec'; ctx.fill(eye); ctx.save(); ctx.clip(eye);
      const ix = lk * 2.4; const ig = ctx.createRadialGradient(ix * S, 0, 0, ix * S, 0, 3.4 * S); ig.addColorStop(0, '#2a1404'); ig.addColorStop(0.45, '#8a4a10'); ig.addColorStop(0.8, '#e0a040'); ig.addColorStop(1, '#f8e0a0');
      ctx.fillStyle = ig; ctx.beginPath(); ctx.arc(ix * S, 0, 3.4 * S, 0, A.TAU); ctx.fill();
      ctx.fillStyle = '#0a0604'; ctx.beginPath(); ctx.ellipse(ix * S, 0, 0.9 * S, 2.2 * S * Math.min(1, ey + 0.2), 0, 0, A.TAU); ctx.fill();
      ctx.restore();
      ctx.lineWidth = S * 0.35; ctx.strokeStyle = '#3a2a10'; ctx.stroke(eye);
    } else { K.line(ctx, [[-6.4, 0], [6.4, 0]], 0.4, '#3a2a10'); }
    if (broken > 0) for (const [a, b] of [[[-8, -4], [-2, 1]], [[3, -8], [5, -1]], [[1, 4], [7, 6]]]) K.line(ctx, [a, [(a[0] + b[0]) / 2 + 1, (a[1] + b[1]) / 2], b], 0.25, A.rgba('#2a1a08', 0.85 * broken));
    ctx.restore();
    ctx.restore();
  }
  function overlay(ctx, W, x) {
    const k = x.glow === undefined ? 1 : x.glow;
    A.glow(ctx, 0, 0, (14 + k * 10) * S, '#ffe8a0', 0.18 + k * 0.22);
  }
  function points(W, x) { return { eye: [(x.look || 0) * 2.4, 0], tip: [0, 0], core: [0, 0] }; }
  function anims() {
    const R = {};
    // parado: os raios rodam um passo (15°) por volta, o núcleo pulsa
    R.idle = { n: 8, fps: 10, loop: true, poseFn: (t) => P({ spin: t * 15, flare: 1 + Math.sin(t * A.TAU) * 0.04, glow: 0.8 + Math.sin(t * A.TAU) * 0.2, eye: 1 }) };
    R.move = { n: 8, fps: 12, loop: true, poseFn: (t) => P({ spin: t * 15, flare: 0.96, glow: 0.8, eye: 1, tilt: 6 }) };
    // carregar: os raios crescem e o olho abre-se de todo
    R.atk_charge = { n: 8, fps: 10, phases: [5, 2], poseFn: (t) => P({ spin: t * 30, flare: 1 + t * 0.35, glow: 0.8 + t * 1.2, eye: 1 + t * 0.2 }) };
    // disparar: os raios encolhem de repente e voltam
    R.atk_cast = { n: 8, fps: 14, phases: [3, 2], poseFn: (t) => P({ spin: t * 20, flare: t < 0.4 ? 1 - t * 0.6 : 0.76 + (t - 0.4) * 0.4, glow: t < 0.4 ? 1 + t * 2 : 1.8 - t, eye: 1.1 }) };
    // fechar o olho (antes de desaparecer e reaparecer noutro sítio)
    R.atk_blink = { n: 6, fps: 12, phases: [3, 2], poseFn: (t) => P({ spin: t * 10, flare: 1 - t * 0.2, glow: 1 - t * 0.6, eye: 1 - t }) };
    R.hurt = { n: 3, fps: 14, keys: [[0, P({ spin: 0, flare: 0.92, glow: 1.6, eye: 0.6, tilt: -8 })], [1, P({ spin: 4, flare: 1, glow: 0.8, eye: 1 })]] };
    R.stagger = { n: 4, fps: 6, loop: true, poseFn: (t) => P({ spin: t * 15, flare: 0.9, glow: 0.5, eye: 0.4, tilt: Math.sin(t * A.TAU) * 6 }) };
    R.death = { n: 10, fps: 6, poseFn: (t) => P({ spin: t * 40, flare: 1 - t * 0.3, glow: 1.4 - t * 1.3, eye: Math.max(0, 1 - t * 1.4), tilt: t * 30, broken: t }) };
    return R;
  }
  A.register('en_b_custodio', () => A.creature({ name: 'en_b_custodio', S, unit: 1.6, box: [80, 90], anchor: [40, 46], rig, draw, overlay, points, anims: anims(), post: K.post('#fff0c0', 0.25, 0.03) }));
  (A.previewCell = A.previewCell || {}).en_b_custodio = [90, 90];
})(window.ART);
