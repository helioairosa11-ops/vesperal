// Vesperal — Acólito dos Sinos (acolyte): monge da Torre de capuz fundo e cordão de nós, pés descalços,
// uma sineta de bronze na mão. Toca-a e o som abre ondas para os dois lados; de perto, golpeia com ela.
// → assets/sprites/en_acolyte.png
'use strict';
(function (A) {
  const S = 4, K = A.kit(S), D2R = A.D2R;
  const H = A.humanoid({ spine: 4.6, chest: 4.4, neck: 1.2, head: 4.0, thigh: 6.4, shin: 6.4, foot: 2.6, uarm: 4.8, farm: 4.5, hand: 1.6 });
  const rig = H.rig;
  const M = {
    robe: A.mat('#4a3e36', { shadow: '#29211c', light: '#6e5e52', deep: '#130f0c' }),
    rope: A.mat('#a08a62', { shadow: '#6a5a3e', light: '#cdb68a' }),
    skin: A.mat('#a09088', { shadow: '#5e504a', light: '#cdbdb2', deep: '#2a2220' }),
    bronze: A.mat('#8a6a34', { shadow: '#4e3a1a', light: '#e0bc70', deep: '#241808' }),
    wood: A.mat('#4a3424', { shadow: '#2a1d14', light: '#7a5a40' }),
  };
  const BACK = 0.66;
  function solve(pose) {
    const x = pose.extra, r = pose.root;
    if (x.fF) H.leg(pose, 'F', [r[0] + x.fF[0], x.fF[1] - 0.85], x.faF || 0);
    if (x.fB) H.leg(pose, 'B', [r[0] + x.fB[0], x.fB[1] - 0.85], x.faB || 0);
    const W = rig.solve(pose);
    if (x.hF) H.arm(pose, 'F', [W.uarmF.x + x.hF[0], W.uarmF.y + x.hF[1]], x.haF === undefined ? -90 : x.haF, x.bF || 1);
    if (x.hB) H.arm(pose, 'B', [W.uarmB.x + x.hB[0], W.uarmB.y + x.hB[1]], x.haB === undefined ? 60 : x.haB, x.bB || 1);
  }
  // sineta: cabo de madeira, campânula de bronze pendurada da mão (balança com x.bell)
  function bell(ctx, W, x) {
    const Hd = W.handF, g = [Hd.x + Math.cos(Hd.a * D2R) * 0.9, Hd.y + Math.sin(Hd.a * D2R) * 0.9];
    const sw = (x.bell || 0) * D2R;
    ctx.save(); ctx.translate(g[0] * S, g[1] * S); ctx.rotate(sw);
    K.tube(ctx, [[0, -2.6], [0, 0.4]], [0.38, 0.32], M.wood, { depth: S * 0.15, flat: true });
    const b = A.path((q) => { q.M(-0.7, 0.6); q.Q(-0.9, 2.2, -2.0, 3.4); q.L(2.0, 3.4); q.Q(0.9, 2.2, 0.7, 0.6); q.Z(); }, S);
    K.paint(ctx, b, M.bronze, { depth: S * 0.4, hlw: S * 0.25, light: [-0.5, -1] });
    K.line(ctx, [[-1.6, 2.9], [1.6, 2.9]], 0.18, M.bronze.deep);
    const mouth = A.path((q) => q.E(0, 3.4, 2.0, 0.4), S); ctx.fillStyle = '#1a1006'; ctx.fill(mouth);
    K.dot(ctx, Math.sin(-sw * 2) * 0.9, 3.6, 0.38, M.bronze.shadow); // badalo
    ctx.restore();
    x._tip = [g[0] + Math.sin(-sw) * 3.4 * -1, g[1] + Math.cos(sw) * 3.4];
  }
  function arm(ctx, W, side, back) {
    const U = W['uarm' + side], F = W['farm' + side], Hd = W['hand' + side];
    K.limb(ctx, [U.x, U.y], [F.x, F.y], [F.ex, F.ey], 1.15, 1.05, 1.0, back ? K.dim(M.robe, BACK) : M.robe, { depth: S * 0.45 });
    // manga larga
    const [cx, cy] = K.along(F, 0.85), [nx, ny] = K.perp(F);
    K.blob(ctx, [[cx + nx * 1.6, cy + ny * 1.6], [F.ex + nx * 1.9 + 0.3, F.ey + ny * 1.9 + 0.6], [F.ex - nx * 1.6, F.ey - ny * 1.6 + 0.4], [cx - nx * 1.3, cy - ny * 1.3]], back ? K.dim(M.robe, BACK) : M.robe, { depth: S * 0.3 });
    ctx.save(); A.boneT(ctx, Hd, S);
    K.blob(ctx, [[-0.3, -0.7], [1.0, -0.7], [1.5, 0], [1.0, 0.6], [-0.3, 0.6]], back ? K.dim(M.skin, BACK) : M.skin, { depth: S * 0.25 });
    ctx.restore();
  }
  function robe(ctx, W, x) {
    const C = W.chest, Sp = W.spine, [sx, sy] = K.along(C, 0.95), [cnx, cny] = K.perp(C), [px, py] = K.along(Sp, 0.25), [snx, sny] = K.perp(Sp);
    const fx = Math.max(W.footF.x, W.footB.x, W.shinF.x, W.shinB.x) + 1.4, bx = Math.min(W.footF.x, W.footB.x, W.shinF.x, W.shinB.x) - 1.6, hem = Math.max(W.footF.y, W.footB.y) - 1.4, sw = x.sway || 0;
    const path = A.path((q) => {
      q.M(sx - cnx * 2.6, sy - cny * 2.6); q.Q(sx, sy - 0.4, sx + cnx * 2.6, sy + cny * 2.6);
      q.Q(px + snx * 2.8, py + sny * 2.8, fx - 0.4, (py + hem) / 2); q.Q(fx + 0.6 + sw * 0.3, hem - 2, fx + sw * 0.4, hem);
      for (let i = 1; i <= 4; i++) { const t = i / 4; q.L(A.lerp(fx, bx, t) + sw * 0.6, hem + (i % 2 ? 0.4 : 0)); }
      q.Q(bx - 0.8 + sw, (py + hem) / 2 + 2, px - snx * 2.8, py - sny * 2.8); q.Q(sx - cnx * 3.2, (sy + py) / 2, sx - cnx * 2.6, sy - cny * 2.6); q.Z();
    }, S);
    K.paint(ctx, path, M.robe, { depth: S * 1.0, hlw: S * 0.4 });
    ctx.save(); ctx.clip(path); for (let i = 0; i < 4; i++) { const t = (i + 0.5) / 4; K.line(ctx, [[A.lerp(bx + 1, fx - 1, t), py + 1], [A.lerp(bx, fx, t) + sw * 0.4, hem]], 0.32, A.rgba(M.robe.deep, 0.75)); } ctx.restore();
    // cordão de nós
    const [wx, wy] = K.along(Sp, 0.1);
    K.line(ctx, [[wx - snx * 2.8, wy - sny * 2.8], [wx + snx * 2.8, wy + sny * 2.8]], 0.4, M.rope.shadow);
    K.line(ctx, [[wx - snx * 2.8, wy - sny * 2.8 - 0.1], [wx + snx * 2.8, wy + sny * 2.8 - 0.1]], 0.16, M.rope.light);
    const k0 = [wx + snx * 1.4, wy + sny * 1.4];
    const pts = [k0, [k0[0] + 0.4 + sw * 0.3, k0[1] + 3.0], [k0[0] + 0.2 + sw * 0.6, k0[1] + 6.0]];
    A.stroke(ctx, pts, S * 0.36, M.rope.shadow, S); A.stroke(ctx, pts, S * 0.15, M.rope.light, S);
    for (const t of [0.35, 0.7, 1.0]) K.dot(ctx, A.lerp(pts[0][0], pts[2][0], t), A.lerp(pts[0][1], pts[2][1], t), 0.4, M.rope.base);
  }
  function feet(ctx, W, side, back) {
    ctx.save(); A.boneT(ctx, W['foot' + side], S);
    K.blob(ctx, [[-0.7, -0.75], [1.2, -0.55], [2.6, -0.1], [2.6, 0.55], [-0.8, 0.65]], back ? K.dim(M.skin, BACK) : M.skin, { depth: S * 0.25 });
    ctx.restore();
  }
  // capuz fundo: a cara é só sombra com dois pontos de luz baça e o queixo magro
  function hood(ctx, W, x) {
    const Hd = W.head;
    ctx.save(); A.boneT(ctx, Hd, S); ctx.rotate(Math.PI / 2);
    const back = K.blob(ctx, [[-2.8, 2.8], [-3.0, -1.6], [-1.6, -4.0], [0.8, -4.6], [2.6, -3.4], [3.2, -1.0], [3.0, 1.4], [1.6, 2.4], [-0.6, 3.6]], M.robe, { depth: S * 0.6, hlw: S * 0.3, light: [0.6, -1] });
    const open = K.blobPath([[0.4, -3.2], [2.2, -2.8], [2.8, -1.0], [2.6, 1.0], [1.4, 1.6], [0.6, 0.4]]);
    ctx.fillStyle = '#0a0809'; ctx.fill(open);
    const chin = K.blobPath([[1.2, 0.4], [2.2, 0.2], [2.4, 1.0], [1.6, 1.5]]);
    K.paint(ctx, chin, M.skin, { depth: S * 0.2, hlw: S * 0.1 });
    ctx.save(); ctx.clip(open); K.ember(ctx, 1.9, -1.3, 0.24, x.eye === undefined ? 0.8 : x.eye, '#ffd9a0'); ctx.restore();
    K.line(ctx, [[0.4, -3.2], [0.6, 0.4]], 0.3, A.rgba(M.robe.light, 0.6));
    ctx.restore();
    void back;
  }
  function draw(ctx, W, x) {
    arm(ctx, W, 'B', true);
    feet(ctx, W, 'B', true);
    robe(ctx, W, x);
    feet(ctx, W, 'F', false);
    hood(ctx, W, x);
    arm(ctx, W, 'F', false);
    bell(ctx, W, x);
  }
  // ondas do toque (só nos fotogramas do golpe)
  function overlay(ctx, W, x) {
    if (!x.ringing) return;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const c = x._tip; for (let i = 0; i < 2; i++) { ctx.strokeStyle = A.rgba('#ffe0a0', 0.5 - i * 0.2); ctx.lineWidth = S * 0.3; ctx.beginPath(); ctx.arc(c[0] * S, c[1] * S, (2 + i * 2 + x.ringing * 2) * S, -1.0, 1.0); ctx.stroke(); ctx.beginPath(); ctx.arc(c[0] * S, c[1] * S, (2 + i * 2 + x.ringing * 2) * S, Math.PI - 1.0, Math.PI + 1.0); ctx.stroke(); }
    ctx.restore();
  }
  function points(W, x) { const Hh = W.head, ca = Math.cos(Hh.a * D2R), sa = Math.sin(Hh.a * D2R); return { tip: x._tip, eye: [Hh.x + ca * 1.3 - sa * 1.9, Hh.y + sa * 1.3 + ca * 1.9] }; }

  const STANCE = { pelvis: 0, spine: 8, chest: 6, neck: 6, head: -10 };
  const P = (a, x, root) => A.pose(A.addA(STANCE, a || {}), x, root || [0, -12.8]);
  const base = (o = {}) => Object.assign({ fF: [2.4, 0], fB: [-2.4, 0], hF: [2.4, 4.6], haF: -90, hB: [1.4, 5.6], haB: 50, bell: 0, sway: 0 }, o);
  function anims() {
    const R = {};
    R.idle = { n: 6, fps: 6, loop: true, keys: [[0, P({}, base({ bell: -4 }))], [0.5, P({ spine: 1, chest: 1, neck: 2 }, base({ hF: [2.4, 4.8], bell: 4, sway: 0.4 }), [0, -12.65])], [1, P({}, base({ bell: -4 }))]] };
    R.move = { n: 8, fps: 9, loop: true, stride: 11, poseFn: (t) => { const f = A.stepFeet(t, { stride: 2.8, lift: 1.4 }); const s = Math.sin(t * A.TAU), c = Math.cos(t * A.TAU); return P({ spine: 2, head: -s * 2 }, base({ fF: f.F, fB: f.B, faF: f.F[1] < 0 ? 12 : 0, faB: f.B[1] < 0 ? 12 : 0, hF: [2.6, 4.6 + s * 0.3], bell: c * 18, sway: -c }), [0.3, -12.8 + Math.abs(s) * 0.4]); } };
    // toque: ergue a sineta acima da cabeça e sacode-a (as ondas saem no golpe)
    R.atk_ring = { n: 8, fps: 10, phases: [5, 1], poseFn: (t, i) => [P({}, base()), P({ spine: -4 }, base({ hF: [1.6, -0.6], bell: -10 })), P({ spine: -8, chest: -6, head: -16 }, base({ hF: [1.2, -6.0], haF: -100, bell: -30 })), P({ spine: -8, chest: -6, head: -16 }, base({ hF: [1.4, -6.4], haF: -100, bell: 30 })), P({ spine: -8, chest: -6, head: -16 }, base({ hF: [1.2, -6.2], haF: -100, bell: -36 })), P({ spine: -6, chest: -4, head: -14 }, base({ hF: [1.4, -6.4], haF: -100, bell: 40, ringing: 1 })), P({ spine: -2 }, base({ hF: [1.8, -2.0], bell: 20, ringing: 2 })), P({}, base({ bell: 6 }))][i] };
    // pancada com a sineta (sinal branco)
    R.atk_bash = { n: 7, fps: 13, phases: [2, 2], poseFn: (t, i) => [P({}, base()), P({ spine: -6, chest: -8 }, base({ hF: [-1.6, -3.6], haF: -120, bell: -50, fF: [3, 0], fB: [-3, 0] }), [-0.4, -12.8]), P({ spine: 14, chest: 10 }, base({ hF: [6.4, 2.4], haF: -40, bell: -70, fF: [4, 0], fB: [-3, 0] }), [1, -12.4]), P({ spine: 16, chest: 12 }, base({ hF: [6.2, 4.4], haF: -10, bell: -80, fF: [4, 0], fB: [-3, 0], ringing: 1 }), [1.1, -12.3]), P({ spine: 10 }, base({ hF: [4.4, 4.8], bell: -30 })), P({ spine: 4 }, base({ bell: 10 })), P({}, base())][i] };
    R.hurt = { n: 3, fps: 14, keys: [[0, P({ spine: -14, chest: -10, neck: -6, head: 8 }, base({ hF: [0.6, 5.4], bell: 40, eye: 1.6 }), [-1, -13])], [1, P({}, base())]] };
    R.stagger = { n: 4, fps: 7, loop: true, poseFn: (t) => { const s = Math.sin(t * A.TAU); return P({ spine: 20 + s * 2, chest: 12, neck: 16, head: 8 }, base({ hF: [2.4, 8.4], haF: 0, bell: s * 30, eye: 0.3 }), [0.2, -12.0]); } };
    R.death = { n: 7, fps: 10, keys: [[0, P({ spine: -16, chest: -10, neck: -8 }, base({ hF: [0, 4], bell: 60, eye: 1.6 }), [-1, -13])], [0.45, P({ spine: 30, chest: 14, neck: 16 }, base({ hF: [3, 9], haF: 0, bell: -40, fF: [3.4, 0], fB: [-1.6, 0], eye: 0.4 }), [0.8, -8.2])], [1, P({ spine: 82, chest: 6, neck: 8 }, base({ hF: [5, 5], haF: 0, bell: 90, fF: [3.6, 0], fB: [-1.8, 0], eye: 0 }), [1.2, -4.8])]] };
    return R;
  }
  A.register('en_acolyte', () => A.creature({ name: 'en_acolyte', S, box: [48, 50], anchor: [22, 46], rig, solve, draw, overlay, points, anims: anims(), post: K.post('#c0b0a0', 0.3, 0.04) }));
  (A.previewCell = A.previewCell || {}).en_acolyte = [44, 48];
})(window.ART);
