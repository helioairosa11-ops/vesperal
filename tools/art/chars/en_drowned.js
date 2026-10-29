// Vesperal — Afogado (drowned): corpo pálido e inchado de quem ficou meses no tanque do claustro, cabelo colado
// à cara, nenúfares e limos agarrados aos ombros. Espera debaixo de água, levanta-se a escorrer e agarra.
// → assets/sprites/en_drowned.png
'use strict';
(function (A) {
  const S = 4, K = A.kit(S), D2R = A.D2R;
  const H = A.humanoid({ spine: 4.6, chest: 4.6, neck: 1.2, head: 4.2, thigh: 6.2, shin: 6.2, foot: 2.7, uarm: 4.9, farm: 4.6, hand: 1.9 });
  const rig = H.rig;
  const M = {
    skin: A.mat('#9aa8a2', { shadow: '#5a6a66', light: '#c8d6d0', deep: '#26302e' }),
    skinB: A.mat('#7a8884', { shadow: '#46524e', light: '#a2b0aa', deep: '#1c2422' }),
    rag: A.mat('#4a5a54', { shadow: '#283430', light: '#6e807a' }),
    weed: A.mat('#3e5a3a', { shadow: '#22341e', light: '#6a8a58' }),
    pad: A.mat('#4a6a3a', { shadow: '#2a3e20', light: '#7a9a5a' }),
    hair: '#1a2220',
  };
  const BACK = 0.66;
  function solve(pose) {
    const x = pose.extra, r = pose.root;
    if (x.fF) H.leg(pose, 'F', [r[0] + x.fF[0], x.fF[1] - 0.85], x.faF || 0);
    if (x.fB) H.leg(pose, 'B', [r[0] + x.fB[0], x.fB[1] - 0.85], x.faB || 0);
    const W = rig.solve(pose);
    if (x.hF) H.arm(pose, 'F', [W.uarmF.x + x.hF[0], W.uarmF.y + x.hF[1]], x.haF === undefined ? 70 : x.haF, x.bF || 1);
    if (x.hB) H.arm(pose, 'B', [W.uarmB.x + x.hB[0], W.uarmB.y + x.hB[1]], x.haB === undefined ? 75 : x.haB, x.bB || 1);
  }
  function arm(ctx, W, side, back) {
    const U = W['uarm' + side], F = W['farm' + side], Hd = W['hand' + side];
    const m = back ? M.skinB : M.skin;
    K.limb(ctx, [U.x, U.y], [F.x, F.y], [F.ex, F.ey], 1.45, 1.2, 1.0, m, { depth: S * 0.55, hlw: S * 0.35 });
    // limos pendurados no braço
    const [wx, wy] = K.along(U, 0.6);
    A.stroke(ctx, [[wx, wy], [wx - 0.4, wy + 1.6], [wx + 0.2, wy + 3.0]], S * 0.35, M.weed.shadow, S);
    ctx.save(); A.boneT(ctx, Hd, S);
    K.blob(ctx, [[-0.4, -1.0], [1.4, -1.0], [2.1, -0.2], [1.6, 0.9], [-0.4, 0.8]], m, { depth: S * 0.3 });
    for (let i = 0; i < 3; i++) K.tube(ctx, [[1.5, -0.6 + i * 0.55], [2.5, -0.5 + i * 0.6], [3.0, -0.1 + i * 0.6]], [0.25, 0.2, 0.1], m, { depth: S * 0.1 });
    ctx.restore();
  }
  function leg(ctx, W, side, back) {
    const T = W['thigh' + side], N = W['shin' + side], F = W['foot' + side];
    const m = back ? M.skinB : M.skin;
    K.limb(ctx, [T.x, T.y], [N.x, N.y], [N.ex, N.ey], 1.7, 1.25, 0.9, m, { depth: S * 0.55 });
    ctx.save(); A.boneT(ctx, F, S);
    K.blob(ctx, [[-0.9, -0.9], [1.3, -0.8], [2.8, -0.2], [2.8, 0.7], [-1.0, 0.75]], m, { depth: S * 0.3 });
    ctx.restore();
  }
  // tronco inchado (barriga redonda, pele manchada), farrapos de camisa encharcada
  function torso(ctx, W, x) {
    const path = H.torsoPath(W, [['pelvis', 0.2, 2.8, 2.6], ['spine', 0.2, 3.6, 2.6], ['spine', 0.7, 3.8, 2.8], ['chest', 0.5, 3.4, 3.0], ['chest', 1, 2.6, 2.7]], S);
    K.paint(ctx, path, M.skin, { depth: S * 1.0, hlw: S * 0.5 });
    ctx.save(); ctx.clip(path);
    const Sp = W.spine, [snx, sny] = K.perp(Sp);
    for (const [t, w, r] of [[0.4, 1.4, 1.2], [0.8, -0.6, 0.9], [0.2, -1.6, 1.0]]) { const [bx, by] = K.along(Sp, t); const cx = bx + snx * w, cy = by + sny * w; const g = ctx.createRadialGradient(cx * S, cy * S, 0, cx * S, cy * S, r * S); g.addColorStop(0, 'rgba(70,90,70,0.6)'); g.addColorStop(1, 'rgba(70,90,70,0)'); ctx.fillStyle = g; ctx.fillRect((cx - 2) * S, (cy - 2) * S, 4 * S, 4 * S); }
    ctx.restore();
    // farrapos encharcados à cinta
    const P = W.pelvis, [hx, hy] = K.along(P, 0.2);
    K.rags(ctx, [hx - 2.8, hy - 0.4], [hx + 2.8, hy - 0.2], 5.0, 4, M.rag, 7, x.sway || 0);
  }
  // cabeça: cara inchada e pálida meio tapada por cabelo colado; nenúfar e limos no ombro e na cabeça
  function head(ctx, W, x) {
    const Hd = W.head;
    ctx.save(); A.boneT(ctx, Hd, S); ctx.rotate(Math.PI / 2);
    const face = K.blob(ctx, [[-1.8, 0.4], [-1.9, -2.2], [-0.6, -3.6], [1.2, -3.5], [2.2, -2.4], [2.6, -1.0], [2.4, 0.4], [1.6, 1.6], [0.2, 1.8], [-1.2, 1.2]], M.skin, { depth: S * 0.6, hlw: S * 0.35, light: [0.6, -1] });
    ctx.save(); ctx.clip(face);
    const eo = [1.5, -1.5];
    ctx.fillStyle = '#1a2422'; ctx.beginPath(); ctx.ellipse(eo[0] * S, eo[1] * S, 0.5 * S, 0.32 * S, 0, 0, A.TAU); ctx.fill();
    K.line(ctx, [[1.0, 0.6], [2.1, 0.4]], 0.32, '#2a3432'); // boca entreaberta
    ctx.restore();
    K.ember(ctx, 1.5, -1.5, 0.22, x.eye === undefined ? 0.8 : x.eye, '#a0f0e0');
    // cabelo comprido colado (por cima da cara)
    const r = A.rng(5);
    for (let i = 0; i < 7; i++) { const sx = -1.6 + i * 0.55, len = 3.6 + r() * 2.4; A.stroke(ctx, [[sx, -3.3 + Math.abs(i - 3) * 0.12], [sx + 0.5 + (i > 3 ? 0.4 : 0), -1.2], [sx + (r() - 0.5) * 0.6 + (x.sway || 0) * 0.3, -1.2 + len]], S * 0.3, M.hair, S); }
    // nenúfar na cabeça
    const pad = A.path((q) => { q.M(-0.6, -3.4); q.Q(-2.6, -4.6, -1.0, -5.2); q.Q(1.4, -5.6, 1.6, -4.0); q.L(0.4, -4.0); q.Z(); }, S);
    K.paint(ctx, pad, M.pad, { depth: S * 0.3, hlw: S * 0.2 });
    ctx.fillStyle = '#e8d8e0'; ctx.beginPath(); ctx.ellipse(0.2 * S, -4.9 * S, 0.5 * S, 0.35 * S, 0, 0, A.TAU); ctx.fill();
    ctx.restore();
    // limos pelos ombros
    const C = W.chest, [sx, sy] = K.along(C, 0.95), [cnx, cny] = K.perp(C);
    for (let i = 0; i < 3; i++) A.stroke(ctx, [[sx - cnx * (i - 1) * 1.2, sy - cny * (i - 1) * 1.2], [sx - cnx * (i - 1) * 1.4 - 0.4, sy + 2.4], [sx - cnx * (i - 1) * 1.3 + 0.2 + (x.sway || 0) * 0.3, sy + 4.6 + i * 0.6]], S * 0.4, M.weed.base, S);
  }
  function draw(ctx, W, x) {
    arm(ctx, W, 'B', true);
    leg(ctx, W, 'B', true);
    torso(ctx, W, x);
    leg(ctx, W, 'F', false);
    head(ctx, W, x);
    arm(ctx, W, 'F', false);
  }
  // água a escorrer (por cima do contorno)
  function overlay(ctx, W, x) {
    const wet = x.wet === undefined ? 0.4 : x.wet; if (wet <= 0) return;
    const r = A.rng(Math.round((x.drip || 0) * 10) + 3);
    ctx.save();
    for (let i = 0; i < 8; i++) { const B = [W.chest, W.spine, W.uarmF, W.farmF, W.head][i % 5]; const [bx, by] = K.along(B, r()); const len = 0.8 + r() * 2.5 * wet; ctx.strokeStyle = A.rgba('#c8f0f0', 0.5 * wet); ctx.lineWidth = S * 0.16; ctx.beginPath(); ctx.moveTo(bx * S, by * S); ctx.lineTo(bx * S, (by + len) * S); ctx.stroke(); }
    ctx.restore();
  }
  function points(W, x) { const Hd = W.handF, Hh = W.head, ca = Math.cos(Hh.a * D2R), sa = Math.sin(Hh.a * D2R); return { tip: [Hd.ex, Hd.ey], eye: [Hh.x + ca * 1.5 - sa * 1.5, Hh.y + sa * 1.5 + ca * 1.5] }; }

  const SLUMP = { pelvis: 0, spine: 10, chest: 8, neck: 10, head: -12 };
  const P = (a, x, root) => A.pose(A.addA(SLUMP, a || {}), x, root || [0, -12.2]);
  const base = (o = {}) => Object.assign({ fF: [2.6, 0], fB: [-2.6, 0], hF: [1.8, 7.6], hB: [0.4, 7.8], sway: 0, wet: 0.4 }, o);
  function anims() {
    const R = {};
    // erguer-se da água: começa encolhido e levanta-se a escorrer
    R.rise = { n: 6, fps: 8, poseFn: (t, i) => { const k = i / 5; return P({ spine: 40 - k * 30, chest: 20 - k * 12, neck: 20 - k * 10, head: 6 - k * 18 }, base({ fF: [2.4, 0], fB: [-2.2, 0], hF: [3.4 - k * 1.6, 8.4 - k * 0.8], hB: [2.4 - k * 2, 8.6 - k * 0.8], wet: 1.2, drip: i, sway: (1 - k) }), [0, -6.0 - k * 6.2]); } };
    R.idle = { n: 6, fps: 6, loop: true, keys: [[0, P({}, base({ drip: 0 }))], [0.5, P({ spine: 2, chest: 2 }, base({ hF: [2.0, 7.4], sway: 0.5, drip: 3 }), [0, -12.0])], [1, P({}, base({ drip: 6 }))]] };
    R.move = { n: 8, fps: 8, loop: true, stride: 10, poseFn: (t) => { const f = A.stepFeet(t, { stride: 2.6, lift: 1.2, drag: 0.3 }); const s = Math.sin(t * A.TAU), c = Math.cos(t * A.TAU); return P({ spine: 2 + c * 2, chest: s * 3, head: -s * 3 }, base({ fF: f.F, fB: f.B, faF: f.F[1] < 0 ? 10 : 0, faB: f.B[1] < 0 ? 10 : 0, hF: [2.0 + c * 1.2, 7.6], hB: [0.4 - c * 1.2, 7.8], sway: -c, drip: t * 6 }), [0.2, -12.2 + Math.abs(s) * 0.4]); } };
    // agarrar (sinal vermelho): abre os braços e lança-se com o peso todo
    const GW = P({ spine: -10, chest: -10, neck: -6, head: -6 }, base({ hF: [-1.0, -5.4], haF: -100, hB: [-2.6, -4.6], haB: -110, fF: [3.0, 0], fB: [-3.0, 0], sway: 0.6, eye: 1.6 }), [-0.6, -12.4]);
    const GA = P({ spine: 26, chest: 12, neck: -10, head: -6 }, base({ hF: [8.4, 1.4], haF: 10, hB: [7.4, 2.4], haB: 14, fF: [4.6, 0], fB: [-3.6, 0], sway: -1, eye: 2 }), [1.8, -11.6]);
    R.atk_grab = { n: 9, fps: 12, phases: [4, 2], keys: [[0, P({}, base())], [0.35, GW], [0.48, GW], [0.6, GA], [0.75, GA], [1, P({}, base())]] };
    // unhada curta
    const CW = P({ spine: -4, chest: -8 }, base({ hF: [-2.0, -3.6], haF: -90, fF: [3.0, 0], fB: [-2.8, 0] }), [-0.4, -12.2]);
    const CA = P({ spine: 16, chest: 14 }, base({ hF: [6.4, 4.2], haF: 60, fF: [3.8, 0], fB: [-2.8, 0] }), [1.0, -11.8]);
    R.atk_claw = { n: 7, fps: 14, phases: [2, 2], keys: [[0, P({}, base())], [0.3, CW], [0.5, CA], [0.65, CA], [1, P({}, base())]] };
    R.hurt = { n: 3, fps: 14, keys: [[0, P({ spine: -12, chest: -12, neck: -8, head: 6 }, base({ hF: [-1.6, 7], hB: [-2.4, 7], eye: 1.6, wet: 0.9 }), [-0.8, -12.4])], [1, P({}, base())]] };
    R.stagger = { n: 4, fps: 7, loop: true, poseFn: (t) => { const s = Math.sin(t * A.TAU); return P({ spine: 24 + s * 3, chest: 18, neck: 18, head: 6 }, base({ hF: [2.6, 9.4], hB: [1.6, 9.6], sway: s, eye: 0.4 }), [0.2, -11.4]); } };
    R.death = { n: 7, fps: 9, keys: [[0, P({ spine: -14, chest: -10 }, base({ hF: [-2, 7], hB: [-3, 7], eye: 1.6 }), [-0.8, -12.4])], [0.45, P({ spine: 32, chest: 16, neck: 16 }, base({ hF: [4, 9], hB: [3, 9], fF: [3.4, 0], fB: [-1.4, 0], eye: 0.4, wet: 1 }), [0.6, -7.4])], [1, P({ spine: 84, chest: 6, neck: 8 }, base({ hF: [7, 3], hB: [6, 4], fF: [3.8, 0], fB: [-1.6, 0], eye: 0, wet: 1.2 }), [1.2, -4.6])]] };
    return R;
  }
  A.register('en_drowned', () => A.creature({ name: 'en_drowned', S, box: [50, 48], anchor: [22, 44], rig, solve, draw, overlay, points, anims: anims(), post: K.post('#a0d0d0', 0.3, 0.04) }));
  (A.previewCell = A.previewCell || {}).en_drowned = [46, 46];
})(window.ART);
