// Vesperal — Mariposa (moth): traça do tamanho de um gato, corpo felpudo cor de cinza, antenas de pena e asas
// com olhos pintados (ocelos) que assustam; larga pó ao bater as asas. Paira em círculos e mergulha.
// → assets/sprites/en_moth.png
'use strict';
(function (A) {
  const S = 4, K = A.kit(S);
  const M = {
    fur: A.mat('#8a7e6a', { shadow: '#4e4636', light: '#bcae92', deep: '#221e16' }),
    wing: A.mat('#a8987a', { shadow: '#6a5e48', light: '#d8c8a4', deep: '#2e281e' }),
    wingB: A.mat('#7a6e58', { shadow: '#4a4234', light: '#9e9076' }),
    ocher: '#c08a3a', dark: '#2a1e14',
  };
  const rig = new A.Rig([{ n: 'root', len: 1, a: 0 }]);
  // asa em vista lateral: abre-se para cima (sy = 1) ou para baixo (sy = -1) a partir do tórax; ocelo pintado
  function wing(ctx, fore, m, k, near, sy, ox) {
    const L = fore ? 8.4 : 6.2, Hh = fore ? 9.0 : 6.4, f = Math.sign(sy || 1) * Math.max(0.16, Math.abs(sy));
    const P = (u, v) => [ox - u * L, -0.8 - v * Hh * f];
    const pts = fore ? [[0, 0], [-0.15, 0.55], [0.1, 1.0], [0.55, 1.08], [0.92, 0.72], [0.95, 0.3], [0.62, 0.12], [0.25, 0.02]] : [[0.1, 0], [0.2, 0.5], [0.6, 0.85], [1.0, 0.6], [1.05, 0.18], [0.6, 0.0]];
    const path = K.blobPath(pts.map(([u, v]) => P(u, v)));
    K.paint(ctx, path, m, { depth: S * 0.35, hlw: S * 0.2, inkW: K.IW * 0.8 });
    ctx.save(); ctx.clip(path);
    for (let i = 0; i < 4; i++) A.stroke(ctx, [P(0.05, 0.05), P(0.25 + i * 0.22, 0.95 - i * 0.18)], S * 0.1, A.rgba(M.dark, 0.45 * k), S);
    A.stroke(ctx, [P(0.2, 0.92), P(0.85, 0.78), P(0.95, 0.35)], S * 0.45, A.rgba(M.dark, 0.3 * k), S); // banda escura da orla
    if (fore && Math.abs(f) > 0.3) {
      const [cx, cy] = P(0.48, 0.58), ry = 1.5 * Math.abs(f);
      ctx.fillStyle = A.rgba(M.dark, k); ctx.beginPath(); ctx.ellipse(cx * S, cy * S, 1.7 * S, ry * 1.05 * S, 0, 0, A.TAU); ctx.fill();
      ctx.fillStyle = A.rgba(M.ocher, k); ctx.beginPath(); ctx.ellipse(cx * S, cy * S, 1.25 * S, ry * 0.78 * S, 0, 0, A.TAU); ctx.fill();
      ctx.fillStyle = A.rgba('#140c08', k); ctx.beginPath(); ctx.ellipse(cx * S, cy * S, 0.7 * S, ry * 0.45 * S, 0, 0, A.TAU); ctx.fill();
      ctx.fillStyle = A.rgba('#f4e8d0', k * (near ? 1 : 0.6)); ctx.beginPath(); ctx.arc((cx - 0.25) * S, (cy - 0.25 * f) * S, 0.22 * S, 0, A.TAU); ctx.fill();
    }
    ctx.restore();
  }
  function draw(ctx, W, x) {
    const flap = x.flap || 0, tilt = (x.tilt || 0) * A.D2R, k = 1;
    ctx.save(); ctx.rotate(tilt);
    // asas de longe (escuras), atrás do corpo
    const sy = x.sy === undefined ? Math.cos(flap * A.D2R) : x.sy;
    wing(ctx, false, K.dim(M.wingB, 0.7), k * 0.7, false, sy * 0.9, -1.2); wing(ctx, true, K.dim(M.wing, 0.62), k * 0.7, false, sy, -0.2);
    // patas penduradas
    for (let i = 0; i < 3; i++) A.stroke(ctx, [[-0.6 + i * 1.0, 0.8], [-0.9 + i * 1.0 + (x.legs || 0), 2.4], [-1.4 + i * 1.0 + (x.legs || 0) * 1.4, 3.4]], S * 0.18, M.dark, S);
    // abdómen felpudo e tórax
    const ab = K.tube(ctx, [[-1.0, -0.4], [-3.2, 0.2], [-5.6, 1.2]], [1.6, 1.4, 0.7], M.fur, { depth: S * 0.5, hlw: S * 0.25 });
    ctx.save(); ctx.clip(ab); for (let i = 0; i < 4; i++) K.line(ctx, [[-1.6 - i * 1.1, -1.4], [-1.9 - i * 1.1, 1.6]], 0.22, A.rgba(M.fur.deep, 0.5)); ctx.restore();
    K.blob(ctx, [[-1.6, -1.4], [0.4, -2.0], [2.0, -1.2], [2.2, 0.6], [0.4, 1.4], [-1.4, 1.0]], M.fur, { depth: S * 0.5, hlw: S * 0.3 });
    // cabeça, olho e antenas de pena
    K.blob(ctx, [[1.6, -1.2], [2.8, -1.4], [3.4, -0.4], [2.9, 0.6], [1.8, 0.5]], M.fur, { depth: S * 0.3 });
    ctx.fillStyle = '#100a08'; ctx.beginPath(); ctx.ellipse(2.75 * S, -0.5 * S, 0.55 * S, 0.6 * S, 0, 0, A.TAU); ctx.fill();
    ctx.fillStyle = 'rgba(255,230,190,0.7)'; ctx.beginPath(); ctx.arc(2.6 * S, -0.75 * S, 0.16 * S, 0, A.TAU); ctx.fill();
    for (const s of [0, 1]) { const ax = 2.4 + s * 0.4, ay = -1.3; const ex = ax + 2.6 - s * 0.6, ey = ay - 3.2 + (x.ant || 0) * 0.4; A.stroke(ctx, [[ax, ay], [(ax + ex) / 2 + 0.6, (ay + ey) / 2], [ex, ey]], S * 0.14, M.dark, S); for (let i = 1; i < 6; i++) { const t = i / 6, px = A.lerp(ax, ex, t) + Math.sin(t * Math.PI) * 0.6, py = A.lerp(ay, ey, t); A.stroke(ctx, [[px, py], [px + 0.5, py + 0.3]], S * 0.08, M.dark, S); A.stroke(ctx, [[px, py], [px - 0.4, py - 0.1]], S * 0.08, M.dark, S); } }
    // asas de perto
    wing(ctx, false, M.wingB, k, true, sy * 0.85, -0.6); wing(ctx, true, M.wing, k, true, sy * 0.95, 0.4);
    ctx.restore();
  }
  function points(W, x) { return { eye: [2.7, -0.5], tip: [3.4, 0] }; }
  const P = (x) => A.pose({}, x, [0, 0]);
  function anims() {
    const R = {};
    const flap = (t) => t * 360;
    R.idle = { n: 6, fps: 14, loop: true, poseFn: (t) => P({ flap: flap(t), tilt: -6 + Math.sin(t * A.TAU) * 3, legs: Math.sin(t * A.TAU) * 0.3, ant: Math.sin(t * A.TAU) }) };
    R.move = { n: 6, fps: 16, loop: true, poseFn: (t) => P({ flap: flap(t), tilt: 8, legs: -0.4, ant: -1 }) };
    // mergulho: ergue as asas (abre os olhos pintados), recolhe-as e cai a pique
    R.atk_dive = { n: 8, fps: 12, phases: [3, 3], poseFn: (t, i) => P([{ sy: 0.6, tilt: -12 }, { sy: 1, tilt: -20, ant: 1 }, { sy: 1, tilt: -24, ant: 1.4 }, { sy: 0.25, tilt: 30, legs: -0.8 }, { sy: 0.2, tilt: 34, legs: -0.8 }, { sy: 0.25, tilt: 30, legs: -0.6 }, { sy: -0.6, tilt: 6 }, { sy: 0.4, tilt: 0 }][i]) };
    R.hurt = { n: 3, fps: 14, poseFn: (t, i) => P({ sy: [-0.8, 0.7, 0.2][i], tilt: [-30, -10, -4][i], legs: 0.6 }) };
    R.stagger = { n: 4, fps: 10, loop: true, poseFn: (t) => P({ sy: Math.cos(t * A.TAU * 2) * 0.7, tilt: Math.sin(t * A.TAU) * 35, legs: 0.8 }) };
    // morte: as asas fecham-se e a traça cai a rodopiar
    R.death = { n: 7, fps: 10, poseFn: (t, i) => P({ sy: 0.9 - i * 0.12, tilt: 30 + i * 22, legs: 1 }) };
    return R;
  }
  A.register('en_moth', () => A.creature({ name: 'en_moth', S, box: [32, 32], anchor: [16, 16], rig, draw, points, anims: anims(), post: K.post('#e0d0a8', 0.3, 0.05) }));
  (A.previewCell = A.previewCell || {}).en_moth = [32, 30];
})(window.ART);
