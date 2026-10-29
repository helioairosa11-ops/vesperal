// Vesperal — Mestra Hilde, a Ferreira (chefe das Forjas): mulher larga e de braços nus enegrecidos de fuligem
// e cicatrizes de queimadura, trança grossa cor de cobre presa atrás, viseira de forja em ferro levantada sobre a
// testa, olhos que já guardam brasa. Túnica de linho escuro, avental de couro grosso até aos joelhos com furos
// de faúlha, luvas de couro, botas de biqueira de ferro, tenaz pendurada no cinto. Empunha um malho de forja com
// a cabeça em brasa (x.hot); depois de três marteladas o cabo queima-lhe as mãos e ela larga-o (o ponto fraco).
// Exportada a ×1.75 (≈2× a protagonista). → assets/sprites/en_b_hilde.png
'use strict';
(function (A) {
  const S = 5, K = A.kit(S), D2R = A.D2R;
  const H = A.humanoid({ pelvis: 3.0, spine: 5.6, chest: 7.0, neck: 2.0, head: 4.4, thigh: 8.0, shin: 7.4, foot: 3.6, uarm: 7.2, farm: 6.8, hand: 2.6, shoulder: 0.8 });
  const rig = H.rig;
  const M = {
    skin: A.mat('#b8806a', { shadow: '#6e4434', light: '#e0aa8c', deep: '#2a1812' }),
    hair: A.mat('#8a3a1c', { shadow: '#4a1c0c', light: '#c8683a', deep: '#200a04' }),
    tunic: A.mat('#34383e', { shadow: '#1a1c20', light: '#5a6068', deep: '#0b0c0e' }),
    apron: A.mat('#6e3e20', { shadow: '#3a1e0e', light: '#a46a40', deep: '#160a04' }),
    glove: A.mat('#4a3020', { shadow: '#26180e', light: '#7a5438' }),
    trous: A.mat('#2e2a2a', { shadow: '#161414', light: '#4e4848' }),
    boot: A.mat('#2a201a', { shadow: '#140e0a', light: '#4a3a2e' }),
    iron: A.mat('#55565e', { shadow: '#2a2a30', light: '#a8acb6', deep: '#101014' }),
    wood: A.mat('#5e4228', { shadow: '#33220f', light: '#8e6a46', deep: '#160d05' }),
    leather: A.mat('#3a2618', { shadow: '#1c120a', light: '#5e422c' }),
  };
  const BACK = 0.62;
  const HAM = { tip: 15.2, gap: 6.4, minGap: 3.0 };
  function solve(pose) {
    const x = pose.extra, r = pose.root;
    if (x.fF) H.leg(pose, 'F', [r[0] + x.fF[0], x.fF[1] - 1.1], x.faF || 0);
    if (x.fB) H.leg(pose, 'B', [r[0] + x.fB[0], x.fB[1] - 1.1], x.faB || 0);
    if (!(x.drop >= 0.5)) { A.twoHand(H, pose, x, HAM); return; }
    // malho largado (cravado de cabeça no chão): as mãos ficam livres
    const W = rig.solve(pose);
    const g = [W.uarmF.x + x.g[0], W.uarmF.y + x.g[1]], wa = x.wa;
    x._g = g; x._d = [Math.cos(wa * D2R), Math.sin(wa * D2R)]; x._wa = wa;
    H.arm(pose, 'F', [W.uarmF.x + x.hF[0], W.uarmF.y + x.hF[1]], x.haF || 0, 1);
    H.arm(pose, 'B', [W.uarmB.x + x.hB[0], W.uarmB.y + x.hB[1]], x.haB || 0, 1);
  }
  const pt = (B, t, w) => { const [x, y] = K.along(B, t), [nx, ny] = K.perp(B); return [x + nx * w, y + ny * w]; };

  // malho de forja: cabo de freixo cintado, empunhadura de couro, cabeça de ferro (face larga + pena) em brasa
  function hammer(ctx, x) {
    const g = x._g, d = x._d, n = [-d[1], d[0]];
    const at = (t, w = 0) => [g[0] + d[0] * t + n[0] * w, g[1] + d[1] * t + n[1] * w];
    K.tube(ctx, [at(-7.6), at(2), at(12.6)], [0.78, 0.74, 0.7], M.wood, { depth: S * 0.3, hlw: S * 0.14, flat: true });
    K.line(ctx, [at(-5, -0.2), at(10, -0.25)], 0.1, A.rgba(M.wood.deep, 0.5));
    const wrap = K.tubePath([at(-7.4), at(-1.6)], [0.86, 0.86], false);
    K.paint(ctx, wrap, M.leather, { depth: S * 0.2 });
    K.bands(ctx, wrap, at(-7.4), at(-1.6), 0.9, 0, 1, 6, M.leather);
    K.blob(ctx, [at(-8.6, -1.0), at(-7.4, -1.1), at(-7.4, 1.1), at(-8.6, 1.0), at(-9.0, 0)], M.iron, { depth: S * 0.2 }); // pomo
    for (const t of [9.6, 11.2]) K.poly(ctx, [at(t - 0.5, -0.95), at(t + 0.5, -0.95), at(t + 0.5, 0.95), at(t - 0.5, 0.95)], M.iron, { depth: S * 0.12 });
    // cabeça: bloco cruzado — face (+n, larga) e pena (−n, afilada)
    const head = K.polyPath([at(12.0, -2.6), at(12.6, -4.8), at(13.4, -5.6), at(15.6, -5.6), at(16.4, -4.8), at(17.0, -2.6),
      at(17.2, 2.2), at(17.6, 3.2), at(17.6, 4.6), at(11.6, 4.6), at(11.6, 3.2), at(12.0, 2.2)]);
    K.paint(ctx, head, M.iron, { depth: S * 0.7, hlw: S * 0.35 });
    const hot = x.hot === undefined ? 0.5 : x.hot;
    ctx.save(); ctx.clip(head);
    // calor: degradê a partir da face
    const f0 = at(14.6, 4.6), f1 = at(14.6, -1.0);
    const hg = ctx.createLinearGradient(f0[0] * S, f0[1] * S, f1[0] * S, f1[1] * S);
    hg.addColorStop(0, A.rgba(hot > 1 ? '#fff0c0' : '#ffb040', Math.min(1, 0.55 + hot * 0.35))); hg.addColorStop(0.35, A.rgba('#ff5a10', Math.min(0.85, 0.25 + hot * 0.4))); hg.addColorStop(1, 'rgba(120,20,0,0)');
    ctx.fillStyle = hg; ctx.fill(head);
    K.line(ctx, [at(12.4, -2.2), at(16.6, -2.2)], 0.2, A.rgba(M.iron.deep, 0.6));
    K.line(ctx, [at(12.4, 2.4), at(17.0, 2.4)], 0.25, A.rgba(M.iron.light, 0.4));
    ctx.restore();
    x._tip = at(14.6, 4.8); x._head = at(14.6, 1.0);
  }
  function arm(ctx, W, side, back) {
    const U = W['uarm' + side], F = W['farm' + side], Hd = W['hand' + side];
    const dm = (m) => (back ? K.dim(m, BACK) : m);
    const lim = K.limb(ctx, [U.x, U.y], [F.x, F.y], [F.ex, F.ey], 2.6, 2.4, 1.9, dm(M.skin), { depth: S * 0.6, hlw: S * 0.3 });
    // fuligem que escurece para as mãos + cicatrizes de queimadura
    ctx.save(); ctx.clip(lim);
    const sg = ctx.createLinearGradient(U.x * S, U.y * S, F.ex * S, F.ey * S); sg.addColorStop(0, 'rgba(20,12,10,0)'); sg.addColorStop(1, 'rgba(20,12,10,0.55)');
    ctx.fillStyle = sg; ctx.fill(lim);
    if (!back) { const sc = K.along(U, 0.55); K.line(ctx, [[sc[0] - 1.0, sc[1] - 0.4], [sc[0] + 0.6, sc[1] + 0.8]], 0.4, A.rgba('#d08a70', 0.6)); }
    ctx.restore();
    // braçadeira de couro no antebraço
    const p1 = [F.x, F.y], p2 = [F.ex, F.ey], dd = K.norm(p2[0] - p1[0], p2[1] - p1[1]), nn = [-dd[1], dd[0]], L = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]);
    const at = (t, w) => [p1[0] + dd[0] * L * t + nn[0] * w, p1[1] + dd[1] * L * t + nn[1] * w];
    K.poly(ctx, [at(0.5, 2.5), at(1.02, 2.2), at(1.02, -2.2), at(0.5, -2.5)], dm(M.leather), { depth: S * 0.3, hlw: S * 0.15 });
    for (const t of [0.62, 0.86]) K.line(ctx, [at(t, 2.4), at(t, -2.4)], 0.2, dm(M.iron).base);
    // manga curta da túnica sobre o ombro
    const sl = K.tube(ctx, [K.along(U, -0.06), K.along(U, 0.42)], [2.9, 2.7], dm(M.tunic), { depth: S * 0.45, hlw: S * 0.25, flat: true });
    K.line(ctx, [pt(U, 0.4, 2.7), pt(U, 0.4, -2.7)], 0.3, dm(M.tunic).shadow); void sl;
    ctx.save(); A.boneT(ctx, Hd, S); // luva de couro grosso
    K.blob(ctx, [[-1.2, -2.2], [2.4, -2.2], [3.6, -0.6], [3.0, 1.8], [-1.2, 1.8]], dm(M.glove), { depth: S * 0.45 });
    K.line(ctx, [[-1.0, -2.0], [-1.0, 1.6]], 0.4, dm(M.glove).shadow);
    ctx.restore();
  }
  function leg(ctx, W, side, back) {
    const T = W['thigh' + side], N = W['shin' + side], F = W['foot' + side];
    const dm = (m) => (back ? K.dim(m, BACK) : m);
    K.limb(ctx, [T.x, T.y], [N.x, N.y], [N.ex, N.ey], 3.4, 2.6, 2.1, dm(M.trous), { depth: S * 0.6 });
    const p1 = [N.x, N.y], p2 = [N.ex, N.ey], dd = K.norm(p2[0] - p1[0], p2[1] - p1[1]), nn = [-dd[1], dd[0]], L = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]);
    const at = (t, w) => [p1[0] + dd[0] * L * t + nn[0] * w, p1[1] + dd[1] * L * t + nn[1] * w];
    K.poly(ctx, [at(0.36, 2.6), at(1.05, 2.2), at(1.05, -2.2), at(0.36, -2.6)], dm(M.boot), { depth: S * 0.45, hlw: S * 0.2 });
    K.line(ctx, [at(0.4, 2.6), at(0.4, -2.6)], 0.5, dm(M.leather).shadow);
    ctx.save(); A.boneT(ctx, F, S);
    K.blob(ctx, [[-1.8, -1.7], [2.0, -1.5], [4.4, -0.4], [4.4, 1.2], [-1.9, 1.2]], dm(M.boot), { depth: S * 0.5 });
    K.poly(ctx, [[2.6, -1.2], [4.4, -0.4], [4.4, 1.2], [2.6, 1.2]], dm(M.iron), { depth: S * 0.2 }); // biqueira
    K.line(ctx, [[-1.9, 1.15], [4.4, 1.1]], 0.5, '#0e0a09');
    ctx.restore();
  }
  function torso(ctx, W, x) {
    const Sp = W.spine, C = W.chest, Pv = W.pelvis, sw = x.sway || 0;
    const [px, py] = K.along(Pv, 0.15), [snx, sny] = K.perp(Sp);
    const body = H.torsoPath(W, [['pelvis', 0.15, 4.6, 4.6], ['spine', 0.3, 4.8, 4.8], ['spine', 0.85, 5.4, 5.6], ['chest', 0.4, 6.0, 6.2], ['chest', 0.85, 5.6, 5.8], ['chest', 1.06, 3.2, 3.8]], S);
    K.paint(ctx, body, M.tunic, { depth: S * 1.2, hlw: S * 0.5 });
    ctx.save(); ctx.clip(body); for (const t of [0.35, 0.7]) K.line(ctx, [pt(C, t, -5.0), pt(C, t + 0.1, -1.0)], 0.2, A.rgba(M.tunic.deep, 0.6)); ctx.restore();
    // avental de couro grosso: peitilho + saia até ao joelho
    const a0 = pt(C, 0.82, 1.4), a1 = pt(C, 0.82, 5.0), b1 = [px + snx * 6.0 + 1.2 + sw * 0.3, py + 11.2], b0 = [px - snx * 3.4 + sw * 0.4, py + 11.6];
    const apron = A.path((q) => { q.M(a0[0], a0[1]); q.L(a1[0], a1[1]); q.Q(...pt(C, 0.3, 6.6), ...pt(Sp, 0.3, 6.0)); q.Q(px + snx * 6.6, py + 4, b1[0], b1[1]); q.L(...[A.lerp(b0[0], b1[0], 0.5), A.lerp(b0[1], b1[1], 0.5) + 0.5]); q.L(b0[0], b0[1]); q.Q(px - snx * 3.0, py + 3, ...pt(Sp, 0.1, -1.0)); q.Q(...pt(C, 0.4, 0.6), a0[0], a0[1]); q.Z(); }, S);
    K.paint(ctx, apron, M.apron, { depth: S * 0.9, hlw: S * 0.4 });
    ctx.save(); ctx.clip(apron);
    const ag = ctx.createLinearGradient(0, (py - 6) * S, 0, (py + 12) * S); ag.addColorStop(0, 'rgba(30,18,10,0)'); ag.addColorStop(1, 'rgba(30,18,10,0.6)'); ctx.fillStyle = ag; ctx.fill(apron);
    // furos de faúlha (brasas a apagar) e pesponto
    for (const [t, w, r] of [[0.5, 3.6, 0.35], [0.2, 2.4, 0.28]]) { const q = pt(C, t, w); K.ember(ctx, q[0], q[1], r, 0.6, '#ff8a30'); }
    for (const [dx, dy] of [[2.0, 6.0], [-0.4, 8.6], [3.4, 9.4]]) K.ember(ctx, px + snx * dx + sw * 0.2, py + dy, 0.26, 0.5, '#ff8a30');
    K.line(ctx, [pt(C, 0.8, 1.8), pt(Sp, 0.1, 1.4), [b0[0] + 1.2, b0[1] - 0.6]], 0.12, A.rgba(M.apron.light, 0.6));
    ctx.restore();
    // alça do avental ao pescoço e cinto com tenaz
    K.line(ctx, [pt(C, 0.82, 1.6), pt(C, 1.06, -1.0)], 0.45, M.leather.shadow);
    const bl = pt(Sp, 0.05, -4.6), br = pt(Sp, 0.05, 5.2);
    K.line(ctx, [bl, br], 1.0, '#1a120c');
    K.poly(ctx, [[br[0] - 2.6, br[1] - 0.8], [br[0] - 1.2, br[1] - 0.8], [br[0] - 1.2, br[1] + 0.6], [br[0] - 2.6, br[1] + 0.6]], M.iron, { depth: S * 0.12 });
    const tg = [bl[0] + 0.8, bl[1] + 0.4];
    K.line(ctx, [tg, [tg[0] - 0.6 + sw * 0.3, tg[1] + 7.0]], 0.35, M.iron.shadow); K.line(ctx, [tg, [tg[0] + 0.5 + sw * 0.3, tg[1] + 7.2]], 0.35, M.iron.base);
    K.dot(ctx, tg[0], tg[1] + 0.4, 0.5, M.iron.light);
  }
  // cabeça: rosto largo e curtido, sobrancelha franzida, olho em brasa, trança de cobre, viseira levantada
  function head(ctx, W, x) {
    const Hd = W.head, sw = x.sway || 0;
    ctx.save(); A.boneT(ctx, Hd, S); ctx.rotate(Math.PI / 2); ctx.scale(1.08, 1.08);
    // trança grossa atrás (por baixo da cabeça)
    const br = [[-2.6, -2.4], [-4.0 + sw * 0.2, 0.6], [-4.6 + sw * 0.6, 3.6], [-4.8 + sw, 6.6]];
    K.tube(ctx, br, [1.3, 1.2, 1.0, 0.7], M.hair, { depth: S * 0.3, hlw: S * 0.15 });
    for (let i = 0; i < 6; i++) { const k = (i + 0.5) / 6, a = br[Math.floor(k * 3)], b = br[Math.floor(k * 3) + 1], u = k * 3 - Math.floor(k * 3); const p = [A.lerp(a[0], b[0], u), A.lerp(a[1], b[1], u)]; K.line(ctx, [[p[0] - 0.9, p[1] - 0.3], [p[0] + 0.9, p[1] + 0.4]], 0.16, M.hair.shadow); }
    K.dot(ctx, br[3][0], br[3][1] + 0.4, 0.7, M.leather.base);
    // pescoço/lenço
    K.blob(ctx, [[-2.4, 0.6], [2.4, 0.8], [2.6, 2.6], [-2.6, 2.6]], M.leather, { depth: S * 0.3 });
    const face = K.blob(ctx, [[-2.8, 0.8], [-3.2, -2.4], [-2.2, -4.8], [0.4, -5.6], [2.6, -4.8], [3.4, -3.0], [3.8, -1.8], [3.3, -1.3], [3.4, -0.2], [2.6, 1.0], [0.4, 1.4]], M.skin, { depth: S * 0.7, hlw: S * 0.35, light: [0.6, -1] });
    ctx.save(); ctx.clip(face);
    // cabelo puxado para trás
    K.blob(ctx, [[-3.6, -0.6], [-3.4, -3.6], [-2.2, -5.6], [1.2, -6.0], [1.0, -4.2], [-0.8, -3.0], [-1.6, -0.8]], M.hair, { depth: S * 0.4 });
    for (let i = 0; i < 4; i++) K.line(ctx, [[0.8 - i * 0.6, -5.2], [-2.0 - i * 0.3, -1.0]], 0.12, A.rgba(M.hair.deep, 0.6));
    // fuligem na face
    const sm = ctx.createRadialGradient(1.8 * S, -1.0 * S, 0, 1.8 * S, -1.0 * S, 1.6 * S); sm.addColorStop(0, 'rgba(20,12,10,0.45)'); sm.addColorStop(1, 'rgba(20,12,10,0)'); ctx.fillStyle = sm; ctx.fillRect(0, -3 * S, 4 * S, 4 * S);
    ctx.restore();
    // olho, sobrolho, boca cerrada
    const eo = K.blobPath([[1.9, -2.9], [3.0, -3.1], [3.1, -2.5], [2.0, -2.4]]); ctx.fillStyle = '#1a0c08'; ctx.fill(eo);
    K.ember(ctx, 2.6, -2.75, 0.36, x.eye === undefined ? 1 : x.eye, '#ffa040');
    K.line(ctx, [[1.6, -3.5], [3.3, -3.4]], 0.32, M.hair.deep);
    const mo = x.mouth || 0;
    K.line(ctx, [[2.3, -0.2 + mo * 0.1], [3.2, -0.3 + mo * 0.3]], 0.18 + mo * 0.12, '#3a1a12');
    K.line(ctx, [[3.4, -1.9], [3.9, -1.7], [3.4, -1.3]], 0.14, M.skin.shadow); // nariz
    // viseira de forja levantada sobre a testa, com a correia
    K.line(ctx, [[-2.8, -3.6], [0.4, -4.4]], 0.4, M.leather.shadow);
    K.poly(ctx, [[0.0, -5.2], [2.8, -5.6], [4.2, -4.4], [3.9, -3.6], [1.0, -3.8]], M.iron, { depth: S * 0.35, hlw: S * 0.2 });
    K.line(ctx, [[1.4, -4.6], [3.6, -4.6]], 0.24, '#100c0a');
    K.dot(ctx, 0.5, -4.4, 0.4, M.iron.light);
    ctx.restore();
  }
  function draw(ctx, W, x) {
    arm(ctx, W, 'B', true);
    leg(ctx, W, 'B', true);
    torso(ctx, W, x);
    leg(ctx, W, 'F', false);
    head(ctx, W, x);
    hammer(ctx, x);
    arm(ctx, W, 'F', false);
  }
  function overlay(ctx, W, x) {
    const h = x._head; if (!h) return; const k = x.hot === undefined ? 0.5 : x.hot;
    A.glow(ctx, h[0] * S, h[1] * S, 6 * S, '#ff7020', 0.25 * k);
    if (k > 1) A.glow(ctx, x._tip[0] * S, x._tip[1] * S, 3 * S, '#fff0c0', 0.5 * (k - 1));
  }
  function points(W, x) {
    const Hh = W.head, ca = Math.cos(Hh.a * D2R), sa = Math.sin(Hh.a * D2R);
    const hand = (s) => { const Hd = W['hand' + s]; return [Hd.x + Math.cos(Hd.a * D2R) * 1.4, Hd.y + Math.sin(Hd.a * D2R) * 1.4]; };
    return { tip: x._tip, grip: x._g, eye: [Hh.x + ca * 2.75 - sa * 2.6, Hh.y + sa * 2.75 + ca * 2.6], light: x._head, handF: hand('F'), handB: hand('B') };
  }

  const STANCE = { pelvis: 0, spine: 4, chest: 4, neck: 10, head: -14 };
  const RY = -14.0;
  const P = (a, x, root) => A.pose(A.addA(STANCE, a || {}), x, root || [0, RY]);
  // em guarda: o malho apoiado de cabeça no chão à frente, cabo na diagonal até às mãos
  const base = (o = {}) => Object.assign({ fF: [5.0, 0], fB: [-4.6, 0], g: [6.6, 11.2], wa: 52, tgK: 0.9, tgY: -3.8, gap: 6.2, hot: 0.5, eye: 1, mouth: 0, sway: 0, drop: 0, hF: [4.0, 8.0], haF: 0, hB: [3.0, 8.0], haB: 0 }, o);
  function anims() {
    const R = {};
    R.idle = { n: 6, fps: 5, loop: true, keys: [[0, P({}, base())], [0.5, P({ spine: 1.5, chest: 2, neck: 1 }, base({ g: [6.0, 10.6], sway: 0.5, hot: 0.6 }), [0, RY + 0.3])], [1, P({}, base())]] };
    R.move = { n: 8, fps: 8, loop: true, stride: 16, poseFn: (t) => { const f = A.stepFeet(t, { stride: 4.8, lift: 2.0 }); const s = Math.sin(t * A.TAU), c = Math.cos(t * A.TAU); return P({ spine: 4 + c * 1.5, chest: s * 1.5, head: -s }, base({ fF: f.F, fB: f.B, faF: f.F[1] < 0 ? 10 : 0, faB: f.B[1] < 0 ? 10 : 0, g: [6.4, 9.4 + s * 0.5], wa: 46, tgK: 0, sway: -c }), [0.4, RY + Math.abs(s) * 0.7]); } };

    // MARTELADA (branco): o malho sobe por trás do ombro e cai a pique à frente (poça de fogo)
    const LIFT = P({ spine: -2, chest: -2 }, base({ g: [4.2, 3.0], wa: -30, tgK: 0 }), [-0.4, RY]);
    const COCK = P({ spine: -9, chest: -12, neck: 2, head: -8 }, base({ g: [-2.4, -7.6], wa: -170, tgK: 0, fF: [6.0, 0], fB: [-5.4, 0], mouth: 0.6, eye: 1.5, hot: 0.8 }), [-1.4, RY + 0.8]);
    const TOP = P({ spine: -5, chest: -6, head: -10 }, base({ g: [2.4, -12.4], wa: -94, tgK: 0, fF: [6.2, 0], fB: [-5.4, 0], mouth: 0.9, eye: 1.6, hot: 0.9 }), [-0.2, RY + 0.2]);
    const DOWN = P({ spine: 4, chest: 0, head: -12 }, base({ g: [8.4, -4.6], wa: -24, tgK: 0, fF: [6.6, 0], fB: [-5.6, 0], mouth: 1, eye: 1.7, hot: 1 }), [1.0, RY + 1.4]);
    const HIT = P({ spine: 14, chest: 8, neck: 4, head: -12 }, base({ g: [10.8, 9.6], wa: 40, tgK: 1, tgY: -4.2, gap: 6, fF: [7.0, 0], fB: [-6.0, 0], mouth: 1, eye: 1.8, hot: 1.1 }), [2.4, RY + 3.0]);
    const HOLD = P({ spine: 15, chest: 10, neck: 6, head: -14 }, base({ g: [10.4, 10.0], wa: 40, tgK: 1, tgY: -4.2, gap: 6, fF: [7.0, 0], fB: [-6.0, 0], mouth: 0.4, eye: 1.2, hot: 1 }), [2.0, RY + 3.2]);
    R.atk_hammer = { n: 12, fps: 10, phases: [5, 2], keys: [[0, P({}, base())], [0.1, LIFT], [0.2, COCK], [0.28, COCK], [0.36, TOP], [0.44, DOWN], [0.52, HIT], [0.7, HOLD], [1, P({}, base())]] };

    // VARRIDA (branco): balanço baixo de trás para a frente, rente ao chão, e o malho acaba ao alto à frente
    const SW_W = P({ spine: -6, chest: -12, neck: 4, head: -14 }, base({ g: [-6.4, 8.0], wa: 196, tgK: 0, fF: [6.0, 0], fB: [-5.4, 0], mouth: 0.4, hot: 0.7 }), [-1.6, RY + 0.8]);
    const SW_M = P({ spine: 6, chest: 4 }, base({ g: [3.0, 12.0], wa: 100, tgK: 1, tgY: -2.0, fF: [6.4, 0], fB: [-5.6, 0], mouth: 0.8, hot: 0.8 }), [0.4, RY + 1.8]);
    const SW_A = P({ spine: 12, chest: 6, neck: 2 }, base({ g: [11.0, 6.0], wa: 16, tgK: 0, fF: [7.0, 0], fB: [-5.8, 0], mouth: 1, hot: 0.9 }), [2.2, RY + 2.2]);
    const SW_F = P({ spine: 6, chest: -2, head: -14 }, base({ g: [8.6, -2.4], wa: -50, tgK: 0, fF: [7.0, 0], fB: [-5.8, 0], mouth: 0.6, hot: 0.8 }), [1.6, RY + 1.4]);
    R.atk_sweep = { n: 10, fps: 12, phases: [4, 2], keys: [[0, P({}, base())], [0.3, SW_W], [0.38, SW_W], [0.46, SW_M], [0.56, SW_A], [0.72, SW_F], [1, P({}, base())]] };

    // LINGOTES (sem sinal): golpe de baixo para cima que arremessa lingotes em brasa
    const IN_W = P({ spine: 10, chest: 8, head: -10 }, base({ g: [4.0, 12.4], wa: 120, tgK: 0.7, tgY: -2.6, fF: [6.0, 0], fB: [-5.4, 0], hot: 0.8 }), [0.6, RY + 2.6]);
    const IN_A = P({ spine: -6, chest: -10, head: -16 }, base({ g: [6.4, -8.0], wa: -70, tgK: 0, fF: [6.4, 0], fB: [-5.4, 0], mouth: 1, hot: 1 }), [0.6, RY]);
    R.atk_ingots = { n: 8, fps: 10, phases: [3, 2], keys: [[0, P({}, base())], [0.3, IN_W], [0.38, IN_W], [0.55, IN_A], [0.7, IN_A], [1, P({}, base())]] };

    // BIGORNA (sem sinal): ergue o malho ao alto, a cabeça para cima, e chama a bigorna que cai do teto
    const AN_T = P({ spine: -8, chest: -10, neck: -4, head: -22 }, base({ g: [2.0, -12.6], wa: -90, tgK: 0, fF: [5.4, 0], fB: [-5.0, 0], mouth: 1, eye: 1.8, hot: 1 }), [-0.4, RY + 0.4]);
    R.atk_anvil = { n: 8, fps: 8, phases: [3, 4], keys: [[0, P({}, base())], [0.3, AN_T], [0.5, P({ spine: -9, chest: -11, neck: -4, head: -24 }, base({ g: [2.2, -13.2], wa: -90, tgK: 0, fF: [5.4, 0], fB: [-5.0, 0], mouth: 0.6, eye: 1.8, hot: 1.1 }), [-0.4, RY + 0.2])], [0.8, AN_T], [1, P({}, base())]] };

    // ERUPÇÃO (sem sinal, fase 2): crava o malho a pique no chão e mantém-no lá enquanto a forja rebenta
    const ER_U = P({ spine: -10, chest: -12, head: -18 }, base({ g: [3.0, -12.0], wa: -90, tgK: 0, fF: [6.0, 0], fB: [-5.6, 0], mouth: 1.2, eye: 2, hot: 1.1 }), [-0.6, RY + 0.4]);
    const ER_D = P({ spine: 18, chest: 12, neck: 6, head: -12 }, base({ g: [7.4, 10.4], wa: 88, tgK: 1, tgY: -1.0, fF: [6.6, 0], fB: [-6.0, 0], mouth: 1.2, eye: 2, hot: 1.2 }), [1.0, RY + 4.0]);
    R.atk_eruption = { n: 10, fps: 10, phases: [3, 5], keys: [[0, P({}, base())], [0.25, ER_U], [0.36, ER_D], [0.6, P({ spine: 19, chest: 13, neck: 6, head: -10 }, base({ g: [7.4, 10.8], wa: 88, tgK: 1, tgY: -1.0, fF: [6.6, 0], fB: [-6.0, 0], mouth: 1.4, eye: 2, hot: 1.3 }), [1.0, RY + 4.2])], [0.8, ER_D], [1, P({}, base())]] };

    // SOBREAQUECIMENTO (ponto fraco): o cabo queima — larga o malho (cravado de cabeça) e sacode as mãos
    const OH = (k) => P({ spine: 10 + k * 2, chest: 8, neck: 8, head: 6 }, base({ drop: 1, g: [9.4, 13.0], wa: 104, tgK: 0, hF: [3.4 + k, 5.8 - k * 1.4], haF: -70, hB: [4.6 - k, 6.6 + k * 1.4], haB: -70, fF: [5.0, 0], fB: [-4.8, 0], mouth: 0.8, eye: 1.4, hot: 1.6 }), [0, RY + 1.4]);
    R.atk_overheat = { n: 12, fps: 10, phases: [2, 8], keys: [[0, P({}, base({ hot: 1.4 }))], [0.14, OH(0)], [0.3, OH(1)], [0.45, OH(-0.6)], [0.6, OH(1)], [0.75, OH(-0.6)], [0.86, OH(0.4)], [1, P({}, base({ hot: 1 }))]] };

    R.hurt = { n: 3, fps: 12, keys: [[0, P({ spine: -10, chest: -8, neck: -4, head: -12 }, base({ g: [4.6, 8.6], wa: 64, tgK: 0.5, mouth: 1, eye: 1.8 }), [-1.2, RY])], [1, P({}, base())]] };
    R.stagger = { n: 4, fps: 6, loop: true, poseFn: (t) => { const s = Math.sin(t * A.TAU); return P({ spine: 16 + s * 2, chest: 12, neck: 14, head: -2 + s * 4 }, base({ g: [7.6, 6.0], wa: 88, tgK: 1, tgY: -0.6, gap: 5, fF: [6.0, 0], fB: [-4.8, 0], faB: 40, mouth: 1, eye: 0.5, sway: s }), [0.8, RY + 4.4]); } };
    R.death = { n: 10, fps: 6, keys: [
      [0, P({ spine: -12, chest: -10, neck: -6, head: -18 }, base({ g: [5.0, 4.0], wa: 80, tgK: 1, tgY: -0.8, mouth: 1.4, eye: 2 }), [-0.8, RY])],
      [0.4, P({ spine: 14, chest: 10, neck: 10 }, base({ g: [7.6, 2.0], wa: 88, tgK: 1, tgY: -0.8, gap: 5, fF: [6.0, -0.2], fB: [-4.0, 0], faB: 60, mouth: 1, eye: 1.0, hot: 0.6 }), [0.8, RY + 6.4])],
      [1, P({ spine: 64, chest: 16, neck: 10, head: -4 }, base({ drop: 1, g: [11.0, -2.0], wa: 14, tgK: 0, hF: [6.0, 8.0], haF: 30, hB: [7.0, 9.0], haB: 30, fF: [6.4, 0], fB: [-3.0, 0], faB: 70, mouth: 0.4, eye: 0, hot: 0.2 }), [2.4, RY + 9.6])]] };
    return R;
  }
  A.register('en_b_hilde', () => A.creature({ name: 'en_b_hilde', S, unit: 1.75, box: [124, 96], anchor: [56, 86], rig, solve, draw, overlay, points, anims: anims(), post: K.post('#ffb080', 0.3, 0.04) }));
  (A.previewCell = A.previewCell || {}).en_b_hilde = [130, 130];
})(window.ART);
