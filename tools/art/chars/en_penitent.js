// Vesperal — Penitente (penitent): cargador da procissão que nunca parou de andar. Túnica de saco roxa e rota,
// pés descalços em sangue seco, um jugo de madeira pesado sobre os ombros com correntes nas pontas.
// Fustiga com as correntes (duas vezes) e remata com o jugo inteiro (aparável). → assets/sprites/en_penitent.png
'use strict';
(function (A) {
  const S = 4, K = A.kit(S), D2R = A.D2R;
  const H = A.humanoid({ spine: 4.8, chest: 4.6, neck: 1.2, head: 4.0, thigh: 6.5, shin: 6.4, foot: 2.7, uarm: 4.8, farm: 4.5, hand: 1.7 });
  const rig = H.rig;
  const M = {
    sack: A.mat('#4a2e48', { shadow: '#281828', light: '#6e4a6a', deep: '#120a12' }),
    skin: A.mat('#9a8a80', { shadow: '#5a4a44', light: '#c8b8aa', deep: '#2a201e' }),
    wood: A.mat('#5a4430', { shadow: '#33261a', light: '#8a6c4c', deep: '#1a120c' }),
    iron: A.mat('#4c4a52', { shadow: '#24232a', light: '#8e8a96', deep: '#121116' }),
    blood: '#4a1414', hair: '#1c1618',
  };
  const BACK = 0.66;
  function solve(pose) {
    const x = pose.extra, r = pose.root;
    if (x.fF) H.leg(pose, 'F', [r[0] + x.fF[0], x.fF[1] - 0.85], x.faF || 0);
    if (x.fB) H.leg(pose, 'B', [r[0] + x.fB[0], x.fB[1] - 0.85], x.faB || 0);
    // o jugo assenta nos ombros: as mãos agarram as pontas (x.ya = ângulo do jugo; x.yo = deslocamento)
    const W = rig.solve(pose);
    const [cx, cy] = [W.chest.ex, W.chest.ey], ya = (x.ya || 0) * D2R, yo = x.yo || [0, 0];
    const c = [cx + yo[0] - 1.6, cy + 0.2 + yo[1]], d = [Math.cos(ya), Math.sin(ya)];
    x._yc = c; x._yd = d;
    H.arm(pose, 'F', [c[0] + d[0] * 6.0, c[1] + d[1] * 6.0 + 0.4], x.ya - 40, -1);
    H.arm(pose, 'B', [c[0] - d[0] * 5.6, c[1] - d[1] * 5.6 + 0.4], x.ya + 200, 1);
  }
  // corrente pendurada da ponta do jugo, com uma bola de ferro na ponta (x.cF/x.cB = ângulo de balanço; x.lash = esticada)
  function chain(ctx, p0, ang, len, n) {
    const a = ang * D2R;
    for (let i = 0; i < n; i++) {
      const t = (i + 0.5) / n, x = p0[0] + Math.sin(a) * len * t, y = p0[1] + Math.cos(a) * len * t;
      ctx.strokeStyle = M.iron.light; ctx.lineWidth = S * 0.16; ctx.beginPath(); ctx.ellipse(x * S, y * S, (i % 2 ? 0.25 : 0.42) * S, 0.48 * S, -a, 0, A.TAU); ctx.stroke();
      ctx.strokeStyle = M.iron.deep; ctx.lineWidth = S * 0.07; ctx.stroke();
    }
    const e = [p0[0] + Math.sin(a) * len, p0[1] + Math.cos(a) * len];
    K.blob(ctx, [[e[0] - 0.9, e[1]], [e[0], e[1] - 0.9], [e[0] + 0.9, e[1]], [e[0], e[1] + 0.9]], M.iron, { depth: S * 0.3, hlw: S * 0.2 });
    for (let i = 0; i < 4; i++) { const sa = i * Math.PI / 2 + 0.4; K.line(ctx, [[e[0] + Math.cos(sa) * 0.8, e[1] + Math.sin(sa) * 0.8], [e[0] + Math.cos(sa) * 1.4, e[1] + Math.sin(sa) * 1.4]], 0.2, M.iron.shadow); }
    return e;
  }
  function yoke(ctx, x) {
    const c = x._yc, d = x._yd, n = [-d[1], d[0]];
    const at = (t, w = 0) => [c[0] + d[0] * t + n[0] * w, c[1] + d[1] * t + n[1] * w];
    const beam = K.polyPath([at(-7.0, -0.9), at(7.4, -0.9), at(7.8, 0.2), at(7.2, 1.0), at(-6.8, 1.0), at(-7.4, 0.0)]);
    K.paint(ctx, beam, M.wood, { depth: S * 0.45, hlw: S * 0.25 });
    ctx.save(); ctx.clip(beam); for (let i = 0; i < 4; i++) K.line(ctx, [at(-7 + i * 3.6, -0.6), at(-5 + i * 3.6, 0.5)], 0.12, A.rgba(M.wood.deep, 0.6)); ctx.restore();
    // entalhe do pescoço e cravos de ferro
    for (const t of [-6.0, 6.4]) K.dot(ctx, at(t)[0], at(t)[1], 0.35, M.iron.light);
    const lF = chain(ctx, at(7.2, 0.8), x.cF || 0, x.lash ? 9.5 : 5.4, x.lash ? 9 : 6);
    const lB = chain(ctx, at(-6.8, 0.8), x.cB || 0, 4.6, 5);
    x._tip = x.lash ? lF : at(7.8);
    void lB;
  }
  function arm(ctx, W, side, back) {
    const U = W['uarm' + side], F = W['farm' + side], Hd = W['hand' + side];
    const m = back ? K.dim(M.skin, BACK) : M.skin;
    K.limb(ctx, [U.x, U.y], [F.x, F.y], [F.ex, F.ey], 1.0, 0.8, 0.7, m, { depth: S * 0.45 });
    ctx.save(); A.boneT(ctx, Hd, S); K.blob(ctx, [[-0.3, -0.75], [1.0, -0.75], [1.5, 0], [1.0, 0.65], [-0.3, 0.6]], m, { depth: S * 0.25 }); ctx.restore();
    // corda de penitência no braço
    const [rx, ry] = K.along(U, 0.6), [nx, ny] = K.perp(U);
    K.line(ctx, [[rx + nx * 1.0, ry + ny * 1.0], [rx - nx * 1.0 + 0.3, ry - ny * 1.0 + 0.3]], 0.26, '#7a6a50');
  }
  function leg(ctx, W, side, back) {
    const T = W['thigh' + side], N = W['shin' + side], F = W['foot' + side];
    const m = back ? K.dim(M.skin, BACK) : M.skin;
    K.limb(ctx, [N.x, N.y], [A.lerp(N.x, N.ex, 0.5), A.lerp(N.y, N.ey, 0.5)], [N.ex, N.ey], 0.95, 0.85, 0.7, m, { depth: S * 0.45 });
    ctx.save(); A.boneT(ctx, F, S);
    K.blob(ctx, [[-0.7, -0.75], [1.2, -0.55], [2.6, -0.1], [2.6, 0.6], [-0.8, 0.65]], m, { depth: S * 0.25 });
    K.line(ctx, [[-0.6, 0.55], [2.4, 0.5]], 0.25, A.rgba(M.blood, 0.8)); // sangue seco
    ctx.restore();
    void T;
  }
  // túnica de saco roxa até meio da canela, rasgada; cordão grosso; costas curvadas pelo peso
  function tunic(ctx, W, x) {
    const C = W.chest, Sp = W.spine, [sx, sy] = K.along(C, 0.95), [cnx, cny] = K.perp(C), [px, py] = K.along(Sp, 0.2), [snx, sny] = K.perp(Sp);
    const kF = [W.shinF.x, W.shinF.y], kB = [W.shinB.x, W.shinB.y];
    const front = Math.max(kF[0], kB[0]) + 1.8, back = Math.min(kF[0], kB[0]) - 1.8, hem = Math.max(kF[1], kB[1]) + 2.2, sw = x.sway || 0;
    const r = A.rng(41);
    const path = A.path((q) => {
      q.M(sx - cnx * 2.6, sy - cny * 2.6); q.Q(sx, sy - 0.4, sx + cnx * 2.6, sy + cny * 2.6);
      q.Q(px + snx * 2.8, py + sny * 2.8, front, (py + hem) / 2);
      for (let i = 0; i <= 6; i++) { const t = i / 6; q.L(A.lerp(front, back, t) + sw * 0.5, hem + (i % 2 ? 1.0 : 0) + r() * 0.8); }
      q.Q(back - 0.6, (py + hem) / 2, px - snx * 2.8, py - sny * 2.8); q.Q(sx - cnx * 3.2, (sy + py) / 2, sx - cnx * 2.6, sy - cny * 2.6); q.Z();
    }, S);
    K.paint(ctx, path, M.sack, { depth: S * 0.9, hlw: S * 0.35 });
    ctx.save(); ctx.clip(path);
    for (let i = -6; i <= 6; i++) K.line(ctx, [[px + i * 0.9, sy - 2], [px + i * 0.9 + 0.4, hem + 2]], 0.08, A.rgba(M.sack.deep, 0.5)); // trama do saco
    for (let i = -8; i <= 8; i++) K.line(ctx, [[back - 2, py - 6 + i * 0.9], [front + 2, py - 6 + i * 0.9 + 0.3]], 0.06, A.rgba(M.sack.light, 0.25));
    ctx.restore();
    const [bx, by] = K.along(Sp, 0.1);
    K.line(ctx, [[bx - snx * 2.8, by - sny * 2.8], [bx + snx * 2.8, by + sny * 2.8]], 0.55, '#6a5a40');
    A.stroke(ctx, [[bx + snx * 1.2, by + sny * 1.2], [bx + snx * 1.4 + sw * 0.4, by + 4.4]], S * 0.4, '#6a5a40', S);
  }
  // cabeça curvada sob o jugo: cabelo comprido e sujo, rosto encovado, olhos fechados de quem reza
  function head(ctx, W, x) {
    const Hd = W.head;
    ctx.save(); A.boneT(ctx, Hd, S); ctx.rotate(Math.PI / 2);
    const face = K.blob(ctx, [[-1.6, 0.2], [-1.8, -2.4], [-0.4, -3.6], [1.2, -3.4], [2.0, -2.4], [2.3, -1.4], [2.6, -0.8], [2.1, -0.6], [2.1, 0.4], [1.4, 1.6], [0.2, 1.8], [-1.0, 1.2]], M.skin, { depth: S * 0.55, hlw: S * 0.3, light: [0.6, -1] });
    ctx.save(); ctx.clip(face); K.line(ctx, [[0.6, -0.4], [1.6, 0.4]], 0.3, A.rgba(M.skin.deep, 0.5)); ctx.restore();
    // olho fechado (lágrima de brasa quando ataca)
    K.line(ctx, [[1.1, -1.5], [1.9, -1.4]], 0.18, '#1c1416');
    if ((x.eye || 0) > 1.05) K.ember(ctx, 1.5, -1.45, 0.22, x.eye - 1, '#ff9a40');
    // cabelo comprido e barba
    for (let i = 0; i < 6; i++) A.stroke(ctx, [[-1.6 + i * 0.5, -3.3 + Math.abs(i - 2) * 0.1], [-2.0 + i * 0.4 + (x.sway || 0) * 0.3, 0.6], [-2.4 + i * 0.4 + (x.sway || 0) * 0.6, 2.8 + i * 0.2]], S * 0.28, M.hair, S);
    const beard = K.blobPath([[0.6, 0.6], [2.0, 0.6], [1.6, 2.6], [0.6, 2.2]]); ctx.fillStyle = M.hair; ctx.fill(beard);
    ctx.restore();
  }
  function draw(ctx, W, x) {
    arm(ctx, W, 'B', true);
    leg(ctx, W, 'B', true);
    tunic(ctx, W, x);
    leg(ctx, W, 'F', false);
    yoke(ctx, x);
    head(ctx, W, x);
    arm(ctx, W, 'F', false);
  }
  function points(W, x) { const Hh = W.head, ca = Math.cos(Hh.a * D2R), sa = Math.sin(Hh.a * D2R); return { tip: x._tip, eye: [Hh.x + ca * 1.45 - sa * 1.5, Hh.y + sa * 1.45 + ca * 1.5] }; }

  const BENT = { pelvis: 0, spine: 14, chest: 12, neck: 44, head: -26 };
  const P = (a, x, root) => A.pose(A.addA(BENT, a || {}), x, root || [0, -12.4]);
  const base = (o = {}) => Object.assign({ fF: [2.6, 0], fB: [-2.6, 0], ya: 0, cF: 0, cB: 0, sway: 0, eye: 1 }, o);
  function anims() {
    const R = {};
    R.idle = { n: 6, fps: 6, loop: true, keys: [[0, P({}, base({ cF: -6, cB: 6 }))], [0.5, P({ spine: 2, chest: 2 }, base({ ya: 2, cF: 6, cB: -6, sway: 0.4 }), [0, -12.2])], [1, P({}, base({ cF: -6, cB: 6 }))]] };
    R.move = { n: 8, fps: 9, loop: true, stride: 12, poseFn: (t) => { const f = A.stepFeet(t, { stride: 3.0, lift: 1.3, drag: 0.3 }); const s = Math.sin(t * A.TAU), c = Math.cos(t * A.TAU); return P({ spine: 2 + c * 1.5, chest: s, head: -s * 2 }, base({ fF: f.F, fB: f.B, faF: f.F[1] < 0 ? 10 : 0, faB: f.B[1] < 0 ? 10 : 0, ya: s * 4, cF: -c * 22, cB: c * 22, sway: -c }), [0.3, -12.4 + Math.abs(s) * 0.4]); } };
    // 1.ª e 2.ª chicotadas de corrente: torce o jugo e a corrente estica-se à frente
    const lashW = (k) => P({ spine: -4 * k, chest: -6 * k }, base({ ya: -22 * k, cF: -40 * k, eye: 1.5 }), [-0.3 * k, -12.4]);
    const lashA = (k) => P({ spine: 12, chest: 10 }, base({ ya: 18, cF: 92 + k * 6, lash: true, fF: [3.6, 0], fB: [-2.8, 0], eye: 1.6 }), [0.8, -12.0]);
    R.atk_c1 = { n: 6, fps: 14, phases: [2, 2], poseFn: (t, i) => [P({}, base()), lashW(1), lashA(0), lashA(1), P({ spine: 8 }, base({ ya: 8, cF: 50, eye: 1.3 })), P({}, base())][i] };
    R.atk_c2 = { n: 6, fps: 14, phases: [2, 2], poseFn: (t, i) => [P({ spine: 6 }, base({ ya: 10, cF: 40 })), lashW(1.2), lashA(1), lashA(0), P({ spine: 8 }, base({ ya: 8, cF: 50, eye: 1.3 })), P({}, base())][i] };
    // remate: ergue o jugo inteiro e deixa-o cair à frente (sinal branco)
    // golpe final (branco): ergue o jugo para trás da cabeça com os joelhos a fletir e abate-o à frente,
    // ancas em baixo e postura aberta (sem se dobrar ao meio)
    R.atk_c3 = { n: 9, fps: 11, phases: [4, 2], poseFn: (t, i) => [P({}, base()),
      P({ spine: -4, chest: -4 }, base({ ya: -12, yo: [0, -1.6], cF: -20, cB: 20, eye: 1.6 }), [-0.3, -12.2]),
      P({ spine: -8, chest: -10, head: -14 }, base({ ya: -38, yo: [-1.4, -4.4], cF: -10, cB: 30, fF: [3.4, 0], fB: [-3.2, 0], eye: 1.8 }), [-0.8, -12.0]),
      P({ spine: -9, chest: -11, head: -16 }, base({ ya: -42, yo: [-1.6, -4.8], cF: 0, cB: 34, fF: [3.4, 0], fB: [-3.2, 0], eye: 2 }), [-0.9, -11.9]),
      P({ spine: 10, chest: 8 }, base({ ya: 30, yo: [2.0, 2.6], cF: 60, cB: -30, fF: [4.4, 0], fB: [-3.4, 0], eye: 2 }), [1.4, -10.8]),
      P({ spine: 12, chest: 9 }, base({ ya: 34, yo: [2.2, 3.0], cF: 40, cB: -10, fF: [4.4, 0], fB: [-3.4, 0], eye: 1.6 }), [1.4, -10.6]),
      P({ spine: 8, chest: 6 }, base({ ya: 18, yo: [1.2, 1.8], cF: 20, fF: [3.6, 0], fB: [-3.0, 0] }), [0.8, -11.4]),
      P({ spine: 4 }, base({ ya: 6 })), P({}, base())][i] };
    R.hurt = { n: 3, fps: 14, keys: [[0, P({ spine: -10, chest: -10, neck: 4, head: 6 }, base({ ya: -14, cF: 30, cB: 30, eye: 1.8 }), [-0.8, -12.6])], [1, P({}, base())]] };
    R.stagger = { n: 4, fps: 7, loop: true, poseFn: (t) => { const s = Math.sin(t * A.TAU); return P({ spine: 26 + s * 2, chest: 18, neck: 22, head: 6 }, base({ ya: 20 + s * 8, yo: [1, 2], cF: s * 20, cB: -s * 20, eye: 1 }), [0.2, -11.2]); } };
    R.death = { n: 7, fps: 9, keys: [[0, P({ spine: -14, chest: -10 }, base({ ya: -20, cF: 40, cB: 40, eye: 2 }), [-0.8, -12.6])], [0.45, P({ spine: 34, chest: 18, neck: 20 }, base({ ya: 40, yo: [2, 4], cF: 10, cB: -10, fF: [3.4, 0], fB: [-1.4, 0], eye: 1 }), [0.6, -7.4])], [1, P({ spine: 82, chest: 8, neck: 8 }, base({ ya: 80, yo: [3, 6], cF: 0, cB: 0, fF: [3.8, 0], fB: [-1.6, 0], eye: 1 }), [1.2, -4.6])]] };
    return R;
  }
  A.register('en_penitent', () => A.creature({ name: 'en_penitent', S, box: [56, 50], anchor: [26, 46], rig, solve, draw, points, anims: anims(), post: K.post('#b8a0c8', 0.3, 0.04) }));
  (A.previewCell = A.previewCell || {}).en_penitent = [50, 48];
})(window.ART);
