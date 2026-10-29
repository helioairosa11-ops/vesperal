// Vesperal — Inquisidora Vael (subchefe da Catedral): alta e magra, rosto severo cor de cinza emoldurado por uma
// touca branca e um véu negro, chapéu de abas largas com borlas vermelhas. Hábito carmim com escapulário negro e
// orla dourada, capa negra esfarrapada, correntes ao peito com um medalhão do olho em chamas. Na mão da frente um
// mangual (cabo cintado, corrente, bola de ferro com espigões); na de trás um turíbulo de brasas.
// Ponto fraco: depois da varrida baixa a bola crava-se no chão e ela tem de a arrancar (atk_stuck).
// Exportada a ×1.75 (≈2× a protagonista). → assets/sprites/en_b_vael.png
'use strict';
(function (A) {
  const S = 5, K = A.kit(S), D2R = A.D2R;
  const H = A.humanoid({ pelvis: 2.6, spine: 6.0, chest: 6.0, neck: 2.0, head: 4.2, thigh: 8.4, shin: 8.0, foot: 2.8, uarm: 6.6, farm: 6.2, hand: 2.2, shoulder: 0.8 });
  const rig = H.rig;
  const M = {
    habit: A.mat('#5e1a1e', { shadow: '#30080c', light: '#8e3a36', deep: '#120204' }),
    scap: A.mat('#1a161e', { shadow: '#0a080c', light: '#3a3442' }),
    cape: A.mat('#141118', { shadow: '#08060a', light: '#2e2836', deep: '#040306' }),
    wimple: A.mat('#e6e0d2', { shadow: '#a49c8c', light: '#ffffff' }),
    skin: A.mat('#a8a09a', { shadow: '#64605c', light: '#d4ccc4', deep: '#26221f' }),
    hat: A.mat('#18141a', { shadow: '#0a080c', light: '#3a3240' }),
    gold: A.mat('#b0904a', { shadow: '#6a5024', light: '#f0d49a' }),
    iron: A.mat('#4e4e56', { shadow: '#26262c', light: '#9a9aa6', deep: '#0e0e12' }),
    wood: A.mat('#4a3420', { shadow: '#26180c', light: '#765438' }),
    bronze: A.mat('#8a6a34', { shadow: '#4a3618', light: '#d0aa62' }),
    red: A.mat('#a01e22', { shadow: '#5a0a0e', light: '#d84a40' }),
  };
  const BACK = 0.6;
  const pt = (B, t, w) => { const [x, y] = K.along(B, t), [nx, ny] = K.perp(B); return [x + nx * w, y + ny * w]; };

  function solve(pose) {
    const x = pose.extra, r = pose.root;
    if (x.fF) H.leg(pose, 'F', [r[0] + x.fF[0], x.fF[1] - 1.0], x.faF || 0);
    if (x.fB) H.leg(pose, 'B', [r[0] + x.fB[0], x.fB[1] - 1.0], x.faB || 0);
    let W = rig.solve(pose);
    H.arm(pose, 'F', [W.uarmF.x + x.hF[0], W.uarmF.y + x.hF[1]], x.fa, x.bF || 1);
    W = rig.solve(pose);
    // mangual: cabo a partir da mão da frente, no ângulo x.fa; com as duas mãos (x.both) a de trás agarra o cabo
    const Hd = W.handF, g = [Hd.ex, Hd.ey], d = [Math.cos(x.fa * D2R), Math.sin(x.fa * D2R)];
    x._g = g; x._d = d; x._tip = [g[0] + d[0] * 5.6, g[1] + d[1] * 5.6];
    if (x.both > 0.5) H.arm(pose, 'B', [g[0] - d[0] * 1.8, g[1] - d[1] * 1.8], x.fa, x.bB || 1);
    else H.arm(pose, 'B', [W.uarmB.x + x.hB[0], W.uarmB.y + x.hB[1]], x.haB || 80, x.bB || 1);
  }

  function flail(ctx, W, x) {
    const g = x._g, d = x._d, n = [-d[1], d[0]], t = x._tip;
    const at = (u, w = 0) => [g[0] + d[0] * u + n[0] * w, g[1] + d[1] * u + n[1] * w];
    // bola: relativa à ponta do cabo, ou cravada no chão (x.floor)
    let b = [t[0] + x.bRel[0], t[1] + x.bRel[1]];
    if (x.floor > 0) b = [b[0], A.lerp(b[1], 0.6, x.floor)];
    x._ball = b;
    // corrente com uma ligeira catenária
    const L = Math.hypot(b[0] - t[0], b[1] - t[1]), sag = Math.max(0, 6.6 - L) * 0.6 + 0.4;
    const mid = [(t[0] + b[0]) / 2, (t[1] + b[1]) / 2 + sag];
    const n2 = 8;
    for (let i = 0; i <= n2; i++) {
      const k = i / n2, q = [(1 - k) * (1 - k) * t[0] + 2 * (1 - k) * k * mid[0] + k * k * b[0], (1 - k) * (1 - k) * t[1] + 2 * (1 - k) * k * mid[1] + k * k * b[1]];
      ctx.save(); ctx.translate(q[0] * S, q[1] * S); ctx.rotate(i % 2 ? Math.atan2(b[1] - t[1], b[0] - t[0]) : Math.atan2(b[1] - t[1], b[0] - t[0]) + Math.PI / 2);
      ctx.lineWidth = S * 0.22; ctx.strokeStyle = M.iron.light; ctx.beginPath(); ctx.ellipse(0, 0, S * 0.55, S * 0.32, 0, 0, A.TAU); ctx.stroke();
      ctx.lineWidth = S * 0.1; ctx.strokeStyle = '#0a080c'; ctx.stroke(); ctx.restore();
    }
    // cabo cintado
    K.tube(ctx, [at(-1.6), at(5.8)], [0.55, 0.5], M.wood, { depth: S * 0.2, flat: true });
    for (const u of [0.6, 3.0, 5.4]) K.poly(ctx, [at(u - 0.35, -0.62), at(u + 0.35, -0.62), at(u + 0.35, 0.62), at(u - 0.35, 0.62)], M.iron, { depth: 0 });
    K.dot(ctx, at(-1.7)[0], at(-1.7)[1], 0.6, M.iron.base);
    // bola de ferro com espigões
    const R = 2.2;
    for (let i = 0; i < 9; i++) { const a = i / 9 * A.TAU + 0.3; K.poly(ctx, [[b[0] + Math.cos(a - 0.22) * R * 0.85, b[1] + Math.sin(a - 0.22) * R * 0.85], [b[0] + Math.cos(a) * (R + 1.3), b[1] + Math.sin(a) * (R + 1.3)], [b[0] + Math.cos(a + 0.22) * R * 0.85, b[1] + Math.sin(a + 0.22) * R * 0.85]], M.iron, { depth: S * 0.1, hlw: S * 0.06 }); }
    const ball = K.blobPath(Array.from({ length: 12 }, (_, i) => [b[0] + Math.cos(i / 12 * A.TAU) * R, b[1] + Math.sin(i / 12 * A.TAU) * R]));
    K.paint(ctx, ball, M.iron, { depth: S * 0.6, hlw: S * 0.3 });
    if (x.floor > 0.5) { // terra e lajes partidas à volta da bola cravada
      for (const [dx, a] of [[-3.2, -0.5], [3.0, 0.6], [-1.4, -0.2], [1.8, 0.3]]) { ctx.save(); ctx.translate((b[0] + dx) * S, -0.4 * S); ctx.rotate(a); K.poly(ctx, [[-1.0, -0.4], [1.0, -0.6], [1.2, 0.3], [-1.1, 0.4]], A.mat('#5a5048', { light: '#8a8078' }), { depth: 0 }); ctx.restore(); }
    }
  }
  function censer(ctx, W, x, back) {
    const Hd = W.handB, h = [Hd.ex, Hd.ey], sw = x.cSw || 0;
    const c = [h[0] + Math.sin(sw) * 5.4, h[1] + Math.cos(sw) * 5.4];
    x._censer = c;
    const dm = (m) => (back ? K.dim(m, 0.85) : m);
    for (const o of [-0.7, 0.7]) K.line(ctx, [h, [c[0] + o, c[1] - 0.6]], 0.14, '#2a2018');
    const body = K.blobPath([[c[0] - 1.8, c[1] - 0.4], [c[0] + 1.8, c[1] - 0.4], [c[0] + 1.5, c[1] + 1.4], [c[0], c[1] + 2.2], [c[0] - 1.5, c[1] + 1.4]]);
    K.paint(ctx, body, dm(M.bronze), { depth: S * 0.35 });
    K.poly(ctx, [[c[0] - 1.6, c[1] - 0.4], [c[0] + 1.6, c[1] - 0.4], [c[0] + 0.9, c[1] - 1.6], [c[0] - 0.9, c[1] - 1.6]], dm(M.gold), { depth: 0 });
    for (let i = -1; i <= 1; i++) K.ember(ctx, c[0] + i * 0.8, c[1] + 0.6, 0.25, 0.6 + (x.heat || 0), '#ff7a30');
  }
  function arm(ctx, W, side, back) {
    const U = W['uarm' + side], F = W['farm' + side], Hd = W['hand' + side];
    const dm = (m) => (back ? K.dim(m, BACK) : m);
    K.limb(ctx, [U.x, U.y], [F.x, F.y], [F.ex, F.ey], 1.9, 1.6, 1.3, dm(M.habit), { depth: S * 0.5, hlw: S * 0.25 });
    // manga larga com orla dourada no punho
    const p1 = [F.x, F.y], p2 = [F.ex, F.ey], dd = K.norm(p2[0] - p1[0], p2[1] - p1[1]), nn = [-dd[1], dd[0]], L = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]);
    const at = (t, w) => [p1[0] + dd[0] * L * t + nn[0] * w, p1[1] + dd[1] * L * t + nn[1] * w];
    K.poly(ctx, [at(0.45, 1.8), at(1.0, 2.6), at(1.0, -2.4), at(0.45, -1.7)], dm(M.habit), { depth: S * 0.35, hlw: S * 0.18 });
    K.line(ctx, [at(0.98, 2.5), at(0.98, -2.3)], 0.35, dm(M.gold).base);
    ctx.save(); A.boneT(ctx, Hd, S);
    K.blob(ctx, [[-0.6, -1.0], [1.6, -1.0], [2.4, -0.2], [1.8, 0.9], [-0.6, 0.8]], dm(M.skin), { depth: S * 0.3 });
    ctx.restore();
  }
  function robe(ctx, W, x) {
    const Pv = W.pelvis, Sp = W.spine, C = W.chest, sw = x.sway || 0, fl = x.flare || 0;
    const [px, py] = K.along(Pv, 0.1);
    // capa por trás, até à barriga da perna, esfarrapada
    const sh0 = pt(C, 1.0, -3.6), sh1 = pt(C, 0.95, 3.2);
    const cape = A.path((q) => { q.M(sh1[0], sh1[1]); q.Q(sh0[0] + 1, sh0[1] - 1.4, sh0[0] - 1.6, sh0[1] + 1); q.Q(px - 8.6 - fl, py - 2, px - 9.6 + sw * 1.4 - fl * 1.6, -2.6); for (let i = 0; i < 6; i++) { const k = (i + 1) / 6; q.L(A.lerp(px - 9.6 + sw * 1.4 - fl * 1.6, px - 1.0 + sw * 0.4, k), -2.6 + (i % 2 ? -2.2 : 0.4)); } q.Q(px - 1.4, py + 2, ...pt(C, 0.5, -1)); q.Z(); }, S);
    K.paint(ctx, cape, M.cape, { depth: S * 0.9, hlw: S * 0.35 });
    ctx.save(); ctx.clip(cape); for (let i = 0; i < 4; i++) K.line(ctx, [pt(C, 0.9, -2.6 + i * 0.6), [px - 8 + i * 1.8 + sw, -3]], 0.25, A.rgba('#000000', 0.5)); ctx.restore();
    // hábito carmim até ao chão
    const sk = A.path((q) => { const a = pt(Sp, 0.25, -3.2), b = pt(Sp, 0.25, 3.4); q.M(a[0], a[1]); q.L(b[0], b[1]); q.Q(px + 5.6, py + 7, px + 6.6 + sw * 0.6 + fl, -0.2); q.Q(px + 0.6, 0.6, px - 5.8 + sw * 0.8 - fl, -0.2); q.Q(px - 5.0, py + 7, a[0], a[1]); q.Z(); }, S);
    K.paint(ctx, sk, M.habit, { depth: S * 1.0, hlw: S * 0.45 });
    ctx.save(); ctx.clip(sk); for (const k of [-3.2, -1.0, 1.4, 3.6]) K.line(ctx, [[px + k * 0.5, py + 2], [px + k * 1.3 + sw * 0.6, -0.2]], 0.3, A.rgba(M.habit.deep, 0.45)); ctx.restore();
    K.line(ctx, [[px - 5.6 + sw * 0.8 - fl, -0.5], [px + 0.6, 0.2], [px + 6.4 + sw * 0.6 + fl, -0.5]], 0.45, M.gold.base); // orla
    // corpete
    const body = H.torsoPath(W, [['spine', 0.15, 3.2, 3.2], ['spine', 0.75, 2.9, 3.0], ['chest', 0.45, 3.4, 3.4], ['chest', 0.9, 3.0, 3.2], ['chest', 1.05, 2.0, 2.4]], S);
    K.paint(ctx, body, M.habit, { depth: S * 0.8, hlw: S * 0.35 });
    // escapulário negro a descer pela frente, com orla dourada
    const s0 = pt(C, 1.0, 0.2), s1 = pt(C, 1.0, 2.4);
    const sc = A.path((q) => { q.M(s0[0], s0[1]); q.L(s1[0], s1[1]); q.L(px + 3.6 + sw * 0.4, py + 9.6); q.L(px + 1.4 + sw * 0.4, py + 10.6); q.L(px - 0.2 + sw * 0.4, py + 9.4); q.Z(); }, S);
    K.paint(ctx, sc, M.scap, { depth: S * 0.5, hlw: S * 0.2 });
    ctx.save(); ctx.lineWidth = S * 0.25; ctx.strokeStyle = M.gold.base; ctx.stroke(sc); ctx.restore();
    // correntes ao peito com o medalhão do olho em chamas
    const m0 = pt(C, 0.55, 1.6);
    for (const [a, b] of [[pt(C, 1.0, -2.6), m0], [pt(C, 0.95, 3.0), m0]]) K.line(ctx, [a, [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2 + 0.6], b], 0.2, M.iron.light);
    K.blob(ctx, [[m0[0] - 1.1, m0[1]], [m0[0], m0[1] - 1.3], [m0[0] + 1.1, m0[1]], [m0[0], m0[1] + 1.4]], M.bronze, { depth: S * 0.25 });
    K.blob(ctx, [[m0[0] - 0.6, m0[1]], [m0[0], m0[1] - 0.35], [m0[0] + 0.6, m0[1]], [m0[0], m0[1] + 0.35]], A.mat('#1a0a06', {}), { depth: 0, hl: false });
    K.ember(ctx, m0[0], m0[1], 0.25, 0.9, '#ff8030');
    // sapatos a espreitar por baixo do hábito
    for (const s of ['F', 'B']) { const F = W['foot' + s]; if (!F) continue; ctx.save(); A.boneT(ctx, F, S); K.blob(ctx, [[0.2, -0.7], [2.4, -0.4], [2.8, 0.6], [0.2, 0.6]], s === 'B' ? K.dim(M.scap, 0.7) : M.scap, { depth: S * 0.2 }); ctx.restore(); }
  }
  function head(ctx, W, x) {
    const Hd = W.head, sw = x.sway || 0;
    ctx.save(); A.boneT(ctx, Hd, S); ctx.rotate(Math.PI / 2);
    // véu negro por trás, a cair sobre os ombros
    const veil = A.path((q) => { q.M(1.0, -4.8); q.Q(-3.8, -4.6, -4.4 + sw * 0.4, 1.0); q.Q(-4.6 + sw * 0.6, 4.6, -3.2 + sw * 0.8, 6.8); q.L(0.8, 3.4); q.Z(); }, S);
    K.paint(ctx, veil, M.cape, { depth: S * 0.4 });
    // touca branca a emoldurar o rosto
    K.blob(ctx, [[-1.8, 2.0], [-2.4, -2.0], [-1.0, -4.6], [1.8, -4.8], [3.2, -3.4], [3.3, -0.4], [2.6, 1.8], [0.4, 2.8]], M.wimple, { depth: S * 0.35, hlw: S * 0.2 });
    // rosto severo, cor de cinza
    const face = K.blob(ctx, [[0.2, 1.2], [0.0, -2.6], [1.0, -3.8], [2.4, -3.6], [2.9, -2.4], [3.4, -1.6], [2.9, -1.2], [2.9, -0.4], [2.4, 0.8], [1.2, 1.4]], M.skin, { depth: S * 0.5, hlw: S * 0.25, light: [0.6, -1] });
    ctx.save(); ctx.clip(face); K.line(ctx, [[1.4, -0.6], [2.2, 0.6]], 0.2, A.rgba(M.skin.deep, 0.5)); ctx.restore();
    const eo = K.blobPath([[1.7, -2.4], [2.7, -2.6], [2.8, -2.1], [1.8, -2.0]]); ctx.fillStyle = '#100808'; ctx.fill(eo);
    K.ember(ctx, 2.3, -2.3, 0.3, x.eye === undefined ? 1 : x.eye, '#ff7030');
    K.line(ctx, [[1.5, -2.95], [2.9, -2.75]], 0.26, '#2a2224');
    const mo = x.mouth || 0; K.line(ctx, [[2.0, -0.2], [2.8, -0.35 + mo * 0.25]], 0.14 + mo * 0.12, '#3a1a1a');
    K.line(ctx, [[2.9, -1.9], [3.4, -1.6], [2.9, -1.2]], 0.1, M.skin.shadow);
    // chapéu de abas largas (de lado) com a copa baixa e borlas vermelhas
    const brim = A.path((q) => { q.M(-5.4, -4.2); q.Q(0.6, -6.0, 6.6, -4.6); q.Q(6.9, -4.1, 6.4, -3.9); q.Q(0.6, -5.0, -5.2, -3.6); q.Z(); }, S);
    K.paint(ctx, brim, M.hat, { depth: S * 0.25, hlw: S * 0.15 });
    K.blob(ctx, [[-2.4, -5.0], [-1.8, -7.0], [1.6, -7.4], [3.0, -6.2], [3.0, -5.2]], M.hat, { depth: S * 0.3 });
    K.line(ctx, [[-2.2, -5.4], [2.9, -5.6]], 0.3, M.red.base);
    const tas = [-4.8 + sw * 0.6, -1.0]; K.line(ctx, [[-4.2, -4.0], [tas[0], tas[1]]], 0.12, M.red.shadow); K.blob(ctx, [[tas[0] - 0.5, tas[1]], [tas[0] + 0.5, tas[1]], [tas[0] + 0.3, tas[1] + 1.4], [tas[0] - 0.3, tas[1] + 1.4]], M.red, { depth: 0 });
    ctx.restore();
  }
  function draw(ctx, W, x) {
    arm(ctx, W, 'B', true);
    censer(ctx, W, x, true);
    robe(ctx, W, x);
    head(ctx, W, x);
    flail(ctx, W, x);
    arm(ctx, W, 'F', false);
  }
  function overlay(ctx, W, x) {
    if (x._censer) A.glow(ctx, x._censer[0] * S, (x._censer[1] + 0.6) * S, 4 * S, '#ff7020', 0.25 + (x.heat || 0) * 0.3);
    if (x.floor > 0.5 && x._ball) A.glow(ctx, x._ball[0] * S, x._ball[1] * S, 5 * S, '#ffd0a0', 0.18);
  }
  function points(W, x) {
    const Hh = W.head, ca = Math.cos(Hh.a * D2R), sa = Math.sin(Hh.a * D2R);
    return { tip: x._ball, ball: x._ball, grip: x._g, censer: x._censer, eye: [Hh.x + ca * 2.3 - sa * 2.3, Hh.y + sa * 2.3 + ca * 2.3] };
  }

  const STANCE = { pelvis: 0, spine: -2, chest: -3, neck: 8, head: -8 };
  const RY = -15.6;
  const P = (a, x, root) => A.pose(A.addA(STANCE, a || {}), x, root || [0, RY]);
  const base = (o = {}) => Object.assign({ fF: [3.4, 0], fB: [-3.0, 0], hF: [4.4, 8.0], fa: 70, bRel: [0.6, 6.2], floor: 0, both: 0, hB: [-1.6, 9.0], haB: 80, cSw: 0, heat: 0, sway: 0, flare: 0, eye: 1, mouth: 0 }, o);
  function anims() {
    const R = {};
    R.idle = { n: 8, fps: 6, loop: true, poseFn: (t) => { const s = Math.sin(t * A.TAU), c = Math.cos(t * A.TAU); return P({ spine: s * 0.8, head: -s }, base({ bRel: [0.6 + s * 0.6, 6.2], cSw: c * 0.12, sway: s * 0.5 }), [0, RY - s * 0.2]); } };
    R.move = { n: 8, fps: 8, loop: true, poseFn: (t) => { const s = Math.sin(t * A.TAU), c = Math.cos(t * A.TAU); const f = A.stepFeet(t, { stride: 3.4, lift: 1.0 }); return P({ spine: 4 + c, chest: s }, base({ fF: [3.4 + f.F[0] * 0.6, f.F[1]], fB: [-3.0 + f.B[0] * 0.6, f.B[1]], bRel: [-1.2 + s * 0.8, 6.0], cSw: -0.25 + c * 0.15, sway: -1 + c * 0.4, flare: 0.6 }), [0.3, RY + Math.abs(s) * 0.4]); } };
    // MANGUAL (branco): a bola gira por cima do ombro para trás e cai a pique à frente
    const F_UP = P({ spine: -6, chest: -8, head: -12 }, base({ hF: [-0.6, -7.6], fa: -110, bRel: [-6.0, 2.0], bF: -1, mouth: 0.6, eye: 1.4, flare: 0.4 }), [-0.8, RY + 0.2]);
    const F_TOP = P({ spine: -8, chest: -10, head: -14 }, base({ hF: [2.0, -8.6], fa: -80, bRel: [-2.4, -5.8], mouth: 0.8, eye: 1.6, flare: 0.6 }), [-0.6, RY]);
    const F_HIT = P({ spine: 18, chest: 12, neck: 4, head: -14 }, base({ fF: [5.4, 0], hF: [8.4, 6.0], fa: 40, bRel: [6.6, 8.0], floor: 0.9, mouth: 1, eye: 1.8, flare: 1, sway: 1 }), [1.8, RY + 2.8]);
    const F_HOLD = P({ spine: 16, chest: 10, head: -12 }, base({ fF: [5.4, 0], hF: [8.0, 6.6], fa: 50, bRel: [5.4, 8.0], floor: 0.8, mouth: 0.4, eye: 1.2, flare: 0.6 }), [1.6, RY + 2.6]);
    R.atk_flail = { n: 11, fps: 11, phases: [5, 2], keys: [[0, P({}, base())], [0.18, P({ spine: -2 }, base({ hF: [1.4, 2.0], fa: -40, bRel: [-5.4, 3.6] }))], [0.32, F_UP], [0.45, F_TOP], [0.55, F_HIT], [0.72, F_HOLD], [1, P({}, base())]] };
    // VARRIDA BAIXA (branco): a bola rasa o chão de trás para a frente e crava-se no chão à frente dela
    const S_W = P({ spine: -4, chest: -14, head: -10 }, base({ hF: [-3.6, 6.6], fa: 160, bRel: [-6.4, 2.6], bF: -1, mouth: 0.4, eye: 1.4, flare: 0.2 }), [-1.2, RY + 1]);
    const S_M = P({ spine: 8, chest: 2 }, base({ fF: [5.0, 0], hF: [4.2, 9.2], fa: 70, bRel: [1.0, 5.4], floor: 0.6, mouth: 0.8, eye: 1.6, flare: 0.6 }), [0.6, RY + 1.8]);
    const S_A = P({ spine: 18, chest: 10, head: -12 }, base({ fF: [6.0, 0], hF: [9.4, 5.6], fa: 24, bRel: [7.0, 3.6], floor: 1, mouth: 1, eye: 1.8, flare: 1, sway: 1 }), [2.4, RY + 2.8]);
    R.atk_flail2 = { n: 10, fps: 12, phases: [4, 2], keys: [[0, P({}, base())], [0.3, S_W], [0.4, S_W], [0.5, S_M], [0.62, S_A], [0.8, S_A], [1, S_A]] };
    // CRAVADA (ponto fraco): agarra o cabo com as duas mãos e puxa, inclinada para trás, aos solavancos
    const PULL = (k) => P({ spine: -10 - k * 4, chest: -6, neck: 4, head: 2 + k * 4 }, base({ fF: [6.4, 0], fB: [-2.4, 0], hF: [6.6, 6.2 - k], fa: 18 + k * 6, bRel: [9.6 - k * 1.2, 4.4], floor: 1, both: 1, bB: 1, mouth: 1, eye: 1.2, flare: 0.3, sway: -0.6 + k }), [-1.6 - k * 0.6, RY + 1.6]);
    R.atk_stuck = { n: 12, fps: 10, phases: [1, 9], keys: [[0, S_A], [0.1, PULL(0)], [0.3, PULL(1)], [0.42, PULL(0.2)], [0.58, PULL(1)], [0.7, PULL(0.3)], [0.86, PULL(1)], [1, P({}, base())]] };
    // PILARES (sem sinal): ergue o turíbulo ao alto e reza; o mangual pende
    const PR = (k) => P({ spine: -6, chest: -6, neck: -6, head: -16 + k * 2 }, base({ hB: [2.4, -9.8 - k * 0.4], haB: -90, cSw: Math.PI + 0.3 * (k - 0.5), heat: 1, hF: [2.6, 8.4], fa: 84, bRel: [0.2, 6.2], mouth: 0.6 + k * 0.4, eye: 1.8 }), [0, RY - 0.6]);
    R.atk_pillars = { n: 9, fps: 8, phases: [3, 4], keys: [[0, P({}, base())], [0.3, PR(0)], [0.5, PR(1)], [0.7, PR(0)], [0.85, PR(1)], [1, P({}, base())]] };
    // FUMO (sem sinal): envolve-se na capa e agacha-se; o fumo esconde-a
    const SM = P({ spine: 24, chest: 18, neck: 10, head: 6 }, base({ fF: [3.4, 0], fB: [-3.6, 0], hF: [1.6, 4.0], fa: 100, bRel: [0.2, 4.0], hB: [3.4, 3.0], haB: -40, flare: 2.4, sway: 1.6, eye: 0.6 }), [0, RY + 4.4]);
    R.atk_smoke = { n: 8, fps: 10, phases: [3, 3], keys: [[0, P({}, base())], [0.35, SM], [0.75, SM], [1, P({}, base())]] };
    // TURÍBULO (sem sinal): balança o turíbulo de trás para a frente e lança brasas
    const C_W = P({ spine: -6, chest: -8 }, base({ hB: [-5.4, 4.4], haB: 150, cSw: -1.6, heat: 0.8 }), [-0.6, RY]);
    const C_A = P({ spine: 10, chest: 6, head: -12 }, base({ hB: [5.4, -4.4], haB: -40, cSw: 2.2, heat: 1.2, mouth: 1, eye: 1.6, fF: [5.0, 0] }), [1.2, RY + 1]);
    R.atk_censer = { n: 8, fps: 10, phases: [4, 1], keys: [[0, P({}, base())], [0.4, C_W], [0.55, C_A], [0.75, C_A], [1, P({}, base())]] };
    R.hurt = { n: 3, fps: 12, keys: [[0, P({ spine: -12, chest: -8, neck: -4, head: -10 }, base({ hF: [3.0, 6.0], fa: 90, bRel: [-1.4, 5.8], mouth: 1, eye: 1.8, sway: -1 }), [-1.2, RY])], [1, P({}, base())]] };
    R.stagger = { n: 4, fps: 6, loop: true, poseFn: (t) => { const s = Math.sin(t * A.TAU); return P({ spine: 22 + s * 2, chest: 14, neck: 14, head: 2 + s * 4 }, base({ fF: [4.4, 0], fB: [-3.8, 0], hF: [3.0, 10.4], fa: 90, bRel: [0.4, 3.0], floor: 0.6, hB: [2.0, 9.0], eye: 0.4, mouth: 1, sway: s }), [0.4, RY + 4.8]); } };
    R.death = { n: 10, fps: 6, keys: [
      [0, P({ spine: -14, chest: -10, neck: -8, head: -16 }, base({ hF: [2.0, 4.0], fa: 100, bRel: [0, 6], mouth: 1.4, eye: 2 }), [-0.8, RY])],
      [0.45, P({ spine: 20, chest: 14, neck: 12, head: 4 }, base({ fF: [4.4, 0], fB: [-3.0, 0], hF: [4.0, 10.0], fa: 90, bRel: [2.0, 2.0], floor: 1, hB: [3.0, 10.0], eye: 0.8, mouth: 0.6, flare: 1.4 }), [0.4, RY + 7.4])],
      [1, P({ spine: 60, chest: 18, neck: 14, head: 6 }, base({ fF: [5.2, 0], fB: [-2.0, 0], faB: 60, hF: [5.0, 9.0], fa: 10, bRel: [4.0, 1.0], floor: 1, hB: [4.6, 9.4], eye: 0, mouth: 0.2, flare: 2 }), [1.6, RY + 11.4])]] };
    return R;
  }
  A.register('en_b_vael', () => A.creature({ name: 'en_b_vael', S, unit: 1.75, box: [104, 88], anchor: [46, 80], rig, solve, draw, overlay, points, anims: anims(), post: K.post('#ffa080', 0.28, 0.04) }));
  (A.previewCell = A.previewCell || {}).en_b_vael = [120, 120];
})(window.ART);
