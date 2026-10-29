// Vesperal — Guarda Real (royalguard): guarda do Paço numa armadura dourada gravada com sóis, gola de folhos
// por cima do gorjal, elmo fechado com crista de sol. Empunha uma glaive comprida: varre e golpeia de cima
// (aparáveis) e estoca a fundo (esquivar). → assets/sprites/en_royalguard.png
'use strict';
(function (A) {
  const S = 4, K = A.kit(S), D2R = A.D2R;
  const H = A.humanoid({ spine: 5.0, chest: 5.2, neck: 1.2, head: 4.4, thigh: 7.0, shin: 6.9, foot: 3.0, uarm: 5.2, farm: 4.8, hand: 1.8 });
  const rig = H.rig;
  const M = {
    gold: A.mat('#a8843e', { shadow: '#5e4820', light: '#ecd08a', deep: '#2a1e0c' }),
    goldB: A.mat('#7a5e2c', { shadow: '#423216', light: '#a8884e', deep: '#1e1608' }),
    steel: A.mat('#5d5f6a', { shadow: '#2e2f37', light: '#a8acba', deep: '#16171c' }),
    wine: A.mat('#5a1a26', { shadow: '#340e16', light: '#82303e' }),
    ruff: A.mat('#dcd6c8', { shadow: '#98917e', light: '#fbf6ea' }),
    wood: A.mat('#3a2a1e', { shadow: '#20160f', light: '#5e4634' }),
  };
  const BACK = 0.66;
  function solve(pose) {
    const x = pose.extra, r = pose.root;
    if (x.fF) H.leg(pose, 'F', [r[0] + x.fF[0], x.fF[1] - 0.85], x.faF || 0);
    if (x.fB) H.leg(pose, 'B', [r[0] + x.fB[0], x.fB[1] - 0.85], x.faB || 0);
    A.twoHand(H, pose, x, { tip: 22.6, gap: 4.6, minGap: 2.6 });
  }
  // glaive: haste com borla de vinho, lâmina curva comprida com um esporão, gravada com um sol
  function glaive(ctx, x) {
    const g = x._g, d = x._d, n = [-d[1], d[0]];
    const at = (t, w = 0) => [g[0] + d[0] * t + n[0] * w, g[1] + d[1] * t + n[1] * w];
    K.tube(ctx, [at(-10), at(0), at(13)], [0.4, 0.4, 0.36], M.wood, { depth: S * 0.2, hlw: S * 0.1, flat: true });
    for (const t of [-9.4, 12.4]) K.line(ctx, [at(t, -0.5), at(t, 0.5)], 0.5, M.gold.shadow);
    const blade = A.path((q) => { const p0 = at(12.6, -0.6), p1 = at(15.6, -2.6), p2 = at(20.8, -1.4), p3 = at(22.6, 0.2), p4 = at(17.4, 1.0), p5 = at(13.2, 1.2), sp = at(14.4, 2.6); q.M(p0[0], p0[1]); q.Q(p1[0], p1[1], p2[0], p2[1]); q.Q(at(22.2, -0.8)[0], at(22.2, -0.8)[1], p3[0], p3[1]); q.Q(p4[0], p4[1], at(15.4, 1.2)[0], at(15.4, 1.2)[1]); q.L(sp[0], sp[1]); q.L(p5[0], p5[1]); q.Z(); }, S);
    K.paint(ctx, blade, M.steel, { depth: S * 0.35, hlw: S * 0.22 });
    K.line(ctx, [at(14.0, -0.6), at(19.6, -0.9)], 0.14, A.rgba(M.steel.deep, 0.6));
    K.dot(ctx, at(16.0, -0.4)[0], at(16.0, -0.4)[1], 0.45, M.gold.base); // sol gravado
    const sw = x.sway || 0, t0 = at(12.0, 0.6);
    const tassel = A.path((q) => { q.M(t0[0], t0[1]); q.Q(t0[0] - 0.4, t0[1] + 1.8, t0[0] - 0.9 + sw, t0[1] + 3.2); q.L(t0[0] + 0.4 + sw, t0[1] + 3.0); q.Q(t0[0] + 0.5, t0[1] + 1.6, t0[0] + 0.4, t0[1]); q.Z(); }, S);
    K.paint(ctx, tassel, M.wine, { depth: S * 0.2 });
    x._tip = at(22.6, 0.2);
  }
  function plate(ctx, p1, p2, w1, w2, m) {
    const dd = K.norm(p2[0] - p1[0], p2[1] - p1[1]), nn = [-dd[1], dd[0]];
    return K.poly(ctx, [[p1[0] + nn[0] * w1, p1[1] + nn[1] * w1], [p2[0] + nn[0] * w2, p2[1] + nn[1] * w2], [p2[0] - nn[0] * w2, p2[1] - nn[1] * w2], [p1[0] - nn[0] * w1, p1[1] - nn[1] * w1]], m, { depth: S * 0.35, hlw: S * 0.2 });
  }
  function arm(ctx, W, side, back) {
    const U = W['uarm' + side], F = W['farm' + side], Hd = W['hand' + side];
    const m = back ? M.goldB : M.gold;
    K.limb(ctx, [U.x, U.y], [F.x, F.y], [F.ex, F.ey], 1.1, 0.9, 0.75, back ? K.dim(M.wine, BACK) : M.wine, { depth: S * 0.4 });
    plate(ctx, [U.x, U.y], [F.x, F.y], 1.3, 1.0, m);
    plate(ctx, [F.x, F.y], [F.ex, F.ey], 1.05, 0.85, m);
    K.blob(ctx, [[F.x - 1.0, F.y - 0.6], [F.x + 0.4, F.y - 1.0], [F.x + 1.1, F.y + 0.3], [F.x, F.y + 1.0]], m, { depth: S * 0.25 });
    const [sx, sy] = K.along(U, 0.05);
    K.blob(ctx, [[sx - 2.0, sy - 0.2], [sx - 0.2, sy - 2.0], [sx + 2.0, sy - 0.6], [sx + 1.6, sy + 1.6], [sx - 1.6, sy + 1.4]], m, { depth: S * 0.4, hlw: S * 0.25 });
    ctx.save(); A.boneT(ctx, Hd, S);
    K.blob(ctx, [[-0.3, -0.85], [1.1, -0.85], [1.7, -0.1], [1.2, 0.75], [-0.3, 0.65]], m, { depth: S * 0.3 });
    ctx.restore();
  }
  function leg(ctx, W, side, back) {
    const T = W['thigh' + side], N = W['shin' + side], F = W['foot' + side];
    const m = back ? M.goldB : M.gold;
    K.limb(ctx, [T.x, T.y], [N.x, N.y], [N.ex, N.ey], 1.5, 1.1, 0.85, back ? K.dim(M.wine, BACK) : M.wine, { depth: S * 0.5 });
    plate(ctx, [T.x, T.y], [N.x, N.y], 1.6, 1.2, m);
    plate(ctx, [N.x, N.y], [N.ex, N.ey], 1.25, 0.95, m);
    K.blob(ctx, [[N.x - 1.1, N.y - 0.7], [N.x + 0.4, N.y - 1.2], [N.x + 1.4, N.y + 0.2], [N.x + 0.2, N.y + 1.1], [N.x - 1.0, N.y + 0.7]], m, { depth: S * 0.3, hlw: S * 0.2 });
    ctx.save(); A.boneT(ctx, F, S);
    K.poly(ctx, [[-1.0, -1.0], [1.4, -0.9], [3.2, -0.2], [3.2, 0.8], [-1.1, 0.85]], m, { depth: S * 0.3 });
    ctx.restore();
  }
  // couraça dourada com um sol gravado, faldão de lâminas, faixa cor de vinho
  function torso(ctx, W, x) {
    const cui = H.torsoPath(W, [['pelvis', 0.3, 2.8, 2.8], ['spine', 0.2, 2.6, 2.6], ['spine', 0.75, 3.0, 2.8], ['chest', 0.5, 3.5, 3.1], ['chest', 0.98, 2.7, 2.9]], S);
    K.paint(ctx, cui, M.gold, { depth: S * 1.0, hlw: S * 0.5, light: [0.4, -1] });
    const C = W.chest, [cnx, cny] = K.perp(C), [sx, sy] = K.along(C, 0.45);
    const sc = [sx + cnx * 1.4, sy + cny * 1.4];
    ctx.save(); ctx.clip(cui);
    for (let i = 0; i < 10; i++) { const a = i / 10 * A.TAU; K.line(ctx, [[sc[0] + Math.cos(a) * 0.9, sc[1] + Math.sin(a) * 0.9], [sc[0] + Math.cos(a) * (i % 2 ? 1.6 : 2.1), sc[1] + Math.sin(a) * (i % 2 ? 1.6 : 2.1)]], 0.18, M.gold.shadow); }
    K.dot(ctx, sc[0], sc[1], 0.8, M.gold.light);
    K.line(ctx, [[C.x + cnx * 3.0, C.y + cny * 3.0], [C.ex + cnx * 2.4, C.ey + cny * 2.4]], 0.2, A.rgba(M.gold.light, 0.8));
    ctx.restore();
    const Sp = W.spine;
    for (let i = 0; i < 3; i++) { const [ax, ay] = K.along(Sp, 0.3 - i * 0.18), [nx, ny] = K.perp(Sp); K.poly(ctx, [[ax + nx * 3.0, ay + ny * 3.0], [ax - nx * 2.9, ay - ny * 2.9], [ax - nx * 3.1, ay - ny * 3.1 + 1.4], [ax + nx * 3.2, ay + ny * 3.2 + 1.4]], M.gold, { depth: S * 0.3, hlw: S * 0.15 }); }
    const [bx, by] = K.along(Sp, 0.52), [nx, ny] = K.perp(Sp);
    K.line(ctx, [[bx - nx * 2.8, by - ny * 2.8], [bx + nx * 3.0, by + ny * 3.0 + 0.6]], 0.75, M.wine.base);
    A.stroke(ctx, [[bx - nx * 2.2, by - ny * 2.2], [bx - nx * 2.6 + (x.sway || 0) * 0.4, by + 4.0]], S * 0.55, M.wine.shadow, S);
  }
  // elmo fechado (borgonhota) com crista de sol, viseira de fendas; gola de folhos branca
  function head(ctx, W, x) {
    const Hd = W.head, C = W.chest;
    ctx.save(); A.boneT(ctx, Hd, S); ctx.rotate(Math.PI / 2);
    // crista: raios de sol em leque
    for (let i = 0; i < 7; i++) { const a = Math.PI + 0.35 + i * 0.4; K.poly(ctx, [[0.2 + Math.cos(a - 0.16) * 1.6, -2.2 + Math.sin(a - 0.16) * 1.6], [0.2 + Math.cos(a) * 4.4, -2.2 + Math.sin(a) * 3.4], [0.2 + Math.cos(a + 0.16) * 1.6, -2.2 + Math.sin(a + 0.16) * 1.6]], M.gold, { depth: S * 0.15, inkW: K.IW * 0.6 }); }
    const helm = K.blob(ctx, [[-2.4, 1.2], [-2.6, -2.0], [-1.2, -4.0], [1.0, -4.4], [2.6, -3.2], [3.0, -1.4], [3.0, 0.8], [2.2, 1.8], [-1.2, 2.0]], M.gold, { depth: S * 0.6, hlw: S * 0.35, light: [0.6, -1] });
    ctx.save(); ctx.clip(helm);
    for (const y of [-1.8, -1.2]) K.line(ctx, [[0.8, y], [3.2, y]], 0.24, '#140e06');
    K.line(ctx, [[0.4, -3.0], [3.0, -2.4]], 0.2, A.rgba(M.gold.deep, 0.7));
    ctx.restore();
    if ((x.eye || 0) > 0) { ctx.save(); ctx.clip(helm); K.ember(ctx, 2.2, -1.5, 0.3, x.eye || 1, '#ffd070'); ctx.restore(); }
    ctx.restore();
    // gola de folhos
    const [nx0, ny0] = K.along(W.neck, 0.2);
    ctx.save(); ctx.translate(nx0 * S, ny0 * S); ctx.rotate((C.a + 90) * D2R);
    const ruff = A.path((q) => { for (let i = 0; i <= 16; i++) { const a = (i / 16) * A.TAU, r = i % 2 ? 3.0 : 3.5; const p = [Math.cos(a) * r + 0.3, Math.sin(a) * r * 0.4 + 0.2]; i ? q.L(p[0], p[1]) : q.M(p[0], p[1]); } q.Z(); }, S);
    K.paint(ctx, ruff, M.ruff, { depth: S * 0.3, hlw: S * 0.2 });
    ctx.save(); ctx.clip(ruff); for (let i = -4; i <= 4; i++) K.line(ctx, [[i * 0.75 + 0.3, -1.6], [i * 0.75 + 0.45, 1.6]], 0.12, A.rgba(M.ruff.shadow, 0.9)); ctx.restore();
    ctx.restore();
  }
  function draw(ctx, W, x) {
    arm(ctx, W, 'B', true);
    leg(ctx, W, 'B', true);
    torso(ctx, W, x);
    leg(ctx, W, 'F', false);
    head(ctx, W, x);
    glaive(ctx, x);
    arm(ctx, W, 'F', false);
  }
  function points(W, x) { const Hh = W.head, ca = Math.cos(Hh.a * D2R), sa = Math.sin(Hh.a * D2R); return { tip: x._tip, eye: [Hh.x + ca * 1.5 - sa * 2.2, Hh.y + sa * 1.5 + ca * 2.2] }; }

  const STANCE = { pelvis: 0, spine: 4, chest: 2, neck: -2, head: -2 };
  const P = (a, x, root) => A.pose(A.addA(STANCE, a || {}), x, root || [0, -14.0]);
  const base = (o = {}) => Object.assign({ fF: [3.2, 0], fB: [-3.2, 0], g: [3.4, 4.6], wa: -60, sway: 0, eye: 1 }, o);
  function anims() {
    const R = {};
    R.idle = { n: 6, fps: 5, loop: true, keys: [[0, P({}, base())], [0.5, P({ spine: 1, chest: 1 }, base({ g: [3.4, 4.8], sway: 0.5 }), [0, -13.85])], [1, P({}, base())]] };
    R.move = { n: 8, fps: 8, loop: true, stride: 13, poseFn: (t) => { const f = A.stepFeet(t, { stride: 3.4, lift: 1.4 }); const s = Math.sin(t * A.TAU), c = Math.cos(t * A.TAU); return P({ spine: 2, head: -s }, base({ fF: f.F, fB: f.B, faF: f.F[1] < 0 ? 10 : 0, faB: f.B[1] < 0 ? 10 : 0, g: [3.4, 4.6 + s * 0.3], wa: -60 + c * 3, sway: -c }), [0.3, -14.0 + Math.abs(s) * 0.4]); } };
    // varrida baixa (branco): a glaive passa por cima do ombro para trás e raspa o chão de trás para a frente
    const SW = P({ spine: -2, chest: -10 }, base({ g: [-4.4, 4.4], wa: -188, tgK: 0.3, fF: [3.8, 0], fB: [-3.8, 0], sway: 1, eye: 1.5 }), [-0.8, -13.7]);
    const SM = P({ spine: 6, chest: 0 }, base({ g: [1.0, 7.0], wa: -268, tgK: 0.9, tgY: -0.4, fF: [4.4, 0], fB: [-3.8, 0], eye: 1.6 }), [0.2, -13.3]);
    const SA = P({ spine: 10, chest: 6 }, base({ g: [7.0, 5.0], wa: -352, tgK: 0.25, tgY: -3.0, fF: [5.0, 0], fB: [-3.8, 0], sway: -1 }), [1.2, -13.0]);
    const SF = P({ spine: 8, chest: 2 }, base({ g: [6.2, 0.6], wa: -390, fF: [5.0, 0], fB: [-3.8, 0], sway: -0.6 }), [1.0, -13.2]);
    R.atk_sweep = { n: 8, fps: 12, phases: [3, 2], keys: [[0, P({}, base())], [0.24, SW], [0.36, SW], [0.46, SM], [0.58, SA], [0.72, SF], [1, P({}, base({ wa: -420 }))]] };
    // estocada a fundo (vermelho)
    R.atk_thrust = { n: 9, fps: 12, phases: [4, 2], keys: [[0, P({}, base())], [0.35, P({ spine: -6, chest: -6 }, base({ g: [-2.6, 2.2], wa: -4, fF: [3.6, 0], fB: [-4.0, 0], eye: 1.8 }), [-1.2, -13.6])], [0.45, P({ spine: -6, chest: -6 }, base({ g: [-3.0, 2.2], wa: -2, fF: [3.6, 0], fB: [-4.0, 0], eye: 2 }), [-1.4, -13.6])], [0.58, P({ spine: 18, chest: 8, neck: -6 }, base({ g: [9.6, 2.0], wa: 0, fF: [6.0, 0], fB: [-4.4, 0], eye: 2 }), [2.6, -12.6])], [0.72, P({ spine: 18, chest: 8 }, base({ g: [9.4, 2.2], wa: 0, fF: [6.0, 0], fB: [-4.4, 0] }), [2.6, -12.6])], [1, P({}, base())]] };
    // golpe de cima (branco, com armadura): a glaive vai para trás do ombro, passa por cima da cabeça e
    // cai à frente com as ancas em baixo; a lâmina assenta no chão
    const LIFT = P({ spine: -2, chest: -2 }, base({ g: [3.0, 0.0], wa: -78, eye: 1.3 }), [-0.2, -14.0]);
    const COCK = P({ spine: -6, chest: -8, head: -6 }, base({ g: [-1.0, -6.0], wa: -166, fF: [3.8, 0], fB: [-3.8, 0], sway: 1, eye: 1.6 }), [-0.8, -13.6]);
    const TOP = P({ spine: -4, chest: -6, head: -8 }, base({ g: [1.6, -8.6], wa: -92, fF: [4.0, 0], fB: [-3.8, 0], eye: 1.7 }), [-0.2, -13.8]);
    const DOWN = P({ spine: 4, chest: 0 }, base({ g: [6.0, -3.0], wa: -26, fF: [4.6, 0], fB: [-3.8, 0], eye: 1.7 }), [0.6, -13.4]);
    const HIT = P({ spine: 12, chest: 8 }, base({ g: [7.0, 6.0], wa: 30, tgK: 1, tgY: 0.2, fF: [5.2, 0], fB: [-4.0, 0], sway: -1.2 }), [1.6, -12.2]);
    const HOLD = P({ spine: 13, chest: 9 }, base({ g: [6.8, 6.4], wa: 30, tgK: 1, tgY: 0.2, fF: [5.2, 0], fB: [-4.0, 0], sway: -0.4 }), [1.6, -12.0]);
    R.atk_overhead = { n: 9, fps: 11, phases: [4, 2], keys: [[0, P({}, base())], [0.12, LIFT], [0.24, COCK], [0.34, COCK], [0.43, TOP], [0.52, DOWN], [0.62, HIT], [0.8, HOLD], [1, P({}, base())]] };
    R.hurt = { n: 3, fps: 14, keys: [[0, P({ spine: -12, chest: -10, neck: -6, head: 6 }, base({ g: [1.6, 4.2], wa: -80, eye: 1.6 }), [-1, -14.2])], [1, P({}, base())]] };
    R.stagger = { n: 4, fps: 6, loop: true, poseFn: (t) => { const s = Math.sin(t * A.TAU); return P({ spine: 22 + s * 2, chest: 12, neck: 14, head: 8 }, base({ g: [3.6, 9.6], wa: 70, eye: 0.4, sway: s }), [0.2, -13.0]); } };
    R.death = { n: 7, fps: 9, keys: [[0, P({ spine: -14, chest: -10 }, base({ g: [1, 4], wa: -90, eye: 1.6 }), [-1, -14.2])], [0.45, P({ spine: 30, chest: 16, neck: 14 }, base({ g: [4, 9], wa: 70, fF: [3.6, 0], fB: [-1.6, 0], eye: 0.4 }), [0.8, -9.0])], [1, P({ spine: 82, chest: 6, neck: 8 }, base({ g: [7, 4], wa: 10, fF: [4.0, 0], fB: [-1.8, 0], eye: 0 }), [1.2, -5.0])]] };
    return R;
  }
  A.register('en_royalguard', () => A.creature({ name: 'en_royalguard', S, box: [70, 60], anchor: [30, 54], rig, solve, draw, points, anims: anims(), post: K.post('#ffe0a0', 0.25, 0.04) }));
  (A.previewCell = A.previewCell || {}).en_royalguard = [62, 56];
})(window.ART);
