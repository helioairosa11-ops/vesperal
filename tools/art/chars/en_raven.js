// Vesperal — Corvo (raven): corvo grande da Torre dos Sinos com cera de vela pingada nas penas, olho de brasa.
// Rodeia no ar e cai em voo picado de garras abertas. → assets/sprites/en_raven.png
'use strict';
(function (A) {
  const S = 4, K = A.kit(S);
  const M = {
    feather: A.mat('#24222c', { shadow: '#121118', light: '#4c4a5e', deep: '#08070c' }),
    wax: A.mat('#d8cba8', { shadow: '#988a68', light: '#f4ead0' }),
    beak: A.mat('#3a3434', { shadow: '#1a1616', light: '#6a605e' }),
    foot: '#2a2420',
  };
  const rig = new A.Rig([{ n: 'root', len: 1, a: 0 }]);
  const P = (x) => A.pose({}, x, [0, 0]);
  // asa: abre para cima (sy=1) ou para baixo (sy=-1); penas primárias em dedos
  function wing(ctx, sy, m, ox, near) {
    const f = Math.sign(sy || 1) * Math.max(0.18, Math.abs(sy));
    const Q = (u, v) => [ox - u * 7.5, -0.6 - v * 7.0 * f];
    const outline = [[0, 0], [-0.1, 0.4], [0.2, 0.8], [0.5, 1.0], [0.62, 0.86], [0.74, 0.92], [0.84, 0.74], [0.95, 0.72], [1.0, 0.5], [0.8, 0.32], [0.45, 0.12]];
    const path = K.blobPath(outline.map(([u, v]) => Q(u, v)));
    K.paint(ctx, path, m, { depth: S * 0.35, hlw: S * 0.2, inkW: K.IW * 0.8 });
    ctx.save(); ctx.clip(path);
    for (let i = 0; i < 5; i++) A.stroke(ctx, [Q(0.15 + i * 0.12, 0.2), Q(0.4 + i * 0.13, 0.95 - i * 0.07)], S * 0.12, A.rgba('#000000', 0.45), S);
    if (near) for (const [u, v, r] of [[0.3, 0.45, 0.6], [0.55, 0.3, 0.45]]) { const [cx, cy] = Q(u, v); const wx = K.blobPath([[cx - r, cy], [cx, cy - r * 0.6], [cx + r, cy], [cx + r * 0.2, cy + r * 1.6]]); ctx.fillStyle = M.wax.base; ctx.fill(wx); }
    ctx.restore();
  }
  function draw(ctx, W, x) {
    const sy = x.sy === undefined ? 0.6 : x.sy, tilt = (x.tilt || 0) * A.D2R, talon = x.talon || 0;
    ctx.save(); ctx.rotate(tilt);
    wing(ctx, sy * 0.95, K.dim(M.feather, 0.7), -0.4, false);
    // patas (garras abrem no ataque)
    for (const dx of [0, 0.7]) { const p0 = [-0.4 + dx, 1.0], p1 = [0.2 + dx + talon * 1.4, 2.6 - talon * 0.4]; A.stroke(ctx, [p0, p1], S * 0.22, M.foot, S); for (let i = 0; i < 3; i++) A.stroke(ctx, [p1, [p1[0] + 0.6 + talon * 0.4 - i * 0.4, p1[1] + 0.6 + talon * 0.3 * (i - 1)]], S * 0.14, M.foot, S); }
    // cauda
    const tail = K.polyPath([[-3.0, -0.6], [-6.6, -0.4], [-6.9, 0.6], [-6.4, 1.2], [-3.0, 0.8]]);
    K.paint(ctx, tail, M.feather, { depth: S * 0.25, hlw: S * 0.12 });
    // corpo
    K.blob(ctx, [[-3.6, -0.6], [-1.6, -2.2], [1.2, -2.4], [3.0, -1.4], [3.2, 0.4], [1.4, 1.6], [-1.6, 1.4]], M.feather, { depth: S * 0.5, hlw: S * 0.3 });
    // cabeça e bico
    ctx.save(); ctx.translate(3.0 * S, -2.0 * S); ctx.rotate((x.head || 0) * A.D2R);
    K.blob(ctx, [[-1.2, -0.6], [0.0, -1.6], [1.4, -1.2], [1.6, 0.4], [0.2, 1.0], [-1.0, 0.6]], M.feather, { depth: S * 0.3, hlw: S * 0.2 });
    const op = x.beak || 0;
    K.poly(ctx, [[1.2, -0.6], [4.0, 0.0 + op * 0.2], [1.4, 0.2]], M.beak, { depth: S * 0.15, inkW: K.IW * 0.7 });
    K.poly(ctx, [[1.3, 0.2], [3.6, 0.3 + op * 0.9], [1.2, 0.7]], M.beak, { depth: S * 0.15, inkW: K.IW * 0.7 });
    K.ember(ctx, 0.6, -0.5, 0.28, x.eye === undefined ? 1 : x.eye, '#ff9a40');
    // pingo de cera na cabeça
    const wx = K.blobPath([[-0.8, -1.2], [0.2, -1.6], [0.6, -1.0], [0.0, -0.2]]); ctx.fillStyle = M.wax.base; ctx.fill(wx);
    ctx.restore();
    wing(ctx, sy, M.feather, 0.4, true);
    ctx.restore();
  }
  function points(W, x) { return { eye: [3.6, -2.5], tip: [1.0 + (x.talon || 0) * 1.4, 3.0] }; }
  function anims() {
    const R = {};
    R.idle = { n: 6, fps: 12, loop: true, poseFn: (t) => P({ sy: Math.cos(t * A.TAU), tilt: -4, head: Math.sin(t * A.TAU) * 4 }) };
    R.move = { n: 6, fps: 14, loop: true, poseFn: (t) => P({ sy: Math.cos(t * A.TAU), tilt: 6 }) };
    // voo picado: asas fechadas, garras à frente, bico aberto
    R.atk_swoop = { n: 7, fps: 12, phases: [2, 3], poseFn: (t, i) => P([{ sy: 1, tilt: -16, beak: 0.6 }, { sy: 1, tilt: -20, beak: 1, eye: 1.6 }, { sy: 0.25, tilt: 34, talon: 1, beak: 1, eye: 1.8 }, { sy: 0.2, tilt: 38, talon: 1, beak: 0.8, eye: 1.8 }, { sy: 0.3, tilt: 30, talon: 1, beak: 0.6 }, { sy: -0.8, tilt: 0, talon: 0.5 }, { sy: 0.5, tilt: -6 }][i]) };
    R.hurt = { n: 3, fps: 14, poseFn: (t, i) => P({ sy: [-0.9, 0.8, 0.3][i], tilt: [-30, -10, -4][i], beak: 1, eye: 1.6 }) };
    R.stagger = { n: 4, fps: 10, loop: true, poseFn: (t) => P({ sy: Math.cos(t * A.TAU * 2) * 0.8, tilt: Math.sin(t * A.TAU) * 30, beak: 0.6, eye: 0.5 }) };
    R.death = { n: 7, fps: 10, poseFn: (t, i) => P({ sy: 0.7 - i * 0.25, tilt: 20 + i * 25, beak: 0.8, eye: Math.max(0, 1 - i * 0.3), talon: 0.3 }) };
    return R;
  }
  A.register('en_raven', () => A.creature({ name: 'en_raven', S, box: [30, 30], anchor: [14, 16], rig, draw, points, anims: anims(), post: K.post('#9890c0', 0.4, 0.05) }));
  (A.previewCell = A.previewCell || {}).en_raven = [30, 30];
})(window.ART);
