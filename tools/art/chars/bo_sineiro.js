// Vesperal — O Sineiro (subchefe da Torre): um corcunda enorme de braços compridos, ensurdecido pelos sinos
// (orelhas tapadas com cera e trapos ensanguentados por baixo do capuz), um só olho de brasa a espreitar.
// Hábito de burel cinzento-violeta rasgado, cordas de sino enroladas ao tronco, antebraços nus com marcas de
// corda. Brande um sino de bronze verdete preso a uma corrente grossa, como um mangual. Fraqueza: aparar o
// balanço do sino devolve-lho contra a cabeça — o toque deixa-o atordoado. Exportado a ×1.75.
// → assets/sprites/en_b_sineiro.png
'use strict';
(function (A) {
  const S = 5, K = A.kit(S), D2R = A.D2R;
  const H = A.humanoid({ pelvis: 3.0, spine: 5.4, chest: 8.0, neck: 1.6, head: 4.4, thigh: 7.2, shin: 6.8, foot: 3.8, uarm: 8.2, farm: 8.4, hand: 3.0, shoulder: 0.8 });
  const rig = H.rig;
  const M = {
    robe: A.mat('#4a4250', { shadow: '#26222a', light: '#726a7a', deep: '#0e0c10' }),
    robeD: A.mat('#363040', { shadow: '#1c1822', light: '#5a5266' }),
    skin: A.mat('#8a7a6c', { shadow: '#4e4238', light: '#b4a494', deep: '#1e1814' }),
    rope: A.mat('#8a6e44', { shadow: '#52401e', light: '#b8986a' }),
    bronze: A.mat('#7a5a2c', { shadow: '#3e2a10', light: '#c49a58', deep: '#1a1004' }),
    patina: '#4e8a74',
    iron: A.mat('#4e4e56', { shadow: '#26262c', light: '#9a9aa6', deep: '#0e0e12' }),
    rag: A.mat('#a89a84', { shadow: '#6a5e4c', light: '#d0c4ac' }),
    boot: A.mat('#2a2420', { shadow: '#14100e', light: '#4a4038' }),
  };
  const BACK = 0.62, BS = 1.42;
  function solve(pose) {
    const x = pose.extra, r = pose.root;
    if (x.fF) H.leg(pose, 'F', [r[0] + x.fF[0], x.fF[1] - 1.1], x.faF || 0);
    if (x.fB) H.leg(pose, 'B', [r[0] + x.fB[0], x.fB[1] - 1.1], x.faB || 0);
    const W = rig.solve(pose);
    const hF = [W.uarmF.x + x.hF[0], W.uarmF.y + x.hF[1]];
    H.arm(pose, 'F', hF, x.haF === undefined ? 90 : x.haF, 1);
    // mão de trás: na corrente, um pouco acima da da frente (ou livre)
    const hb = x.hB ? [W.uarmB.x + x.hB[0], W.uarmB.y + x.hB[1]] : [hF[0] - Math.cos(x.ba * D2R) * 2.6, hF[1] - Math.sin(x.ba * D2R) * 2.6];
    H.arm(pose, 'B', hb, x.haB === undefined ? 90 : x.haB, 1);
  }
  const pt = (B, t, w) => { const [x, y] = K.along(B, t), [nx, ny] = K.perp(B); return [x + nx * w, y + ny * w]; };

  // corrente: elos alternados (de frente e de perfil) entre a e b
  function chain(ctx, a, b) {
    const L = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(2, Math.round(L / 1.3)), d = K.norm(b[0] - a[0], b[1] - a[1]), ang = Math.atan2(d[1], d[0]);
    for (let i = 0; i < n; i++) {
      const k = (i + 0.5) / n, c = [A.lerp(a[0], b[0], k), A.lerp(a[1], b[1], k)];
      ctx.save(); ctx.translate(c[0] * S, c[1] * S); ctx.rotate(ang);
      ctx.beginPath(); ctx.ellipse(0, 0, 0.85 * S, (i % 2 ? 0.28 : 0.55) * S, 0, 0, A.TAU);
      ctx.lineWidth = S * 0.42; ctx.strokeStyle = '#0e0e12'; ctx.stroke(); ctx.lineWidth = S * 0.24; ctx.strokeStyle = i % 2 ? M.iron.base : M.iron.light; ctx.stroke();
      ctx.restore();
    }
  }
  // sino de bronze: c = coroa (onde prende a corrente), a = eixo coroa→boca (graus)
  function bell(ctx, c, a, x) {
    ctx.save(); ctx.translate(c[0] * S, c[1] * S); ctx.rotate((a - 90) * D2R); ctx.scale(BS, BS);
    // em coordenadas locais o sino aponta para +y (boca em baixo)
    K.blob(ctx, [[-1.2, -0.4], [-1.0, -1.8], [1.0, -1.8], [1.2, -0.4], [0.6, 0.4], [-0.6, 0.4]], M.bronze, { depth: S * 0.15 }); // asa da coroa
    const body = A.path((q) => { q.M(-2.8, 0.2); q.Q(-4.2, 0.4, -4.0, 3.2); q.Q(-4.0, 6.0, -5.6, 8.2); q.Q(-6.4, 9.2, -5.6, 9.6); q.L(5.6, 9.6); q.Q(6.4, 9.2, 5.6, 8.2); q.Q(4.0, 6.0, 4.0, 3.2); q.Q(4.2, 0.4, 2.8, 0.2); q.Z(); }, S);
    K.paint(ctx, body, M.bronze, { depth: S * 0.9, hlw: S * 0.5 });
    ctx.save(); ctx.clip(body);
    // verdete a escorrer
    for (const [xx, l] of [[-2.6, 5.4], [-0.6, 3.6], [1.8, 6.4], [3.4, 4.2]]) { const g = ctx.createLinearGradient(0, 1 * S, 0, (1 + l) * S); g.addColorStop(0, A.rgba(M.patina, 0.7)); g.addColorStop(1, A.rgba(M.patina, 0)); ctx.fillStyle = g; ctx.fillRect((xx - 0.5) * S, 1 * S, 1.0 * S, l * S); }
    // faixas e inscrição
    for (const y of [2.0, 7.4]) K.line(ctx, [[-6, y], [6, y]], 0.3, A.rgba(M.bronze.deep, 0.7));
    for (let i = 0; i < 7; i++) K.line(ctx, [[-3.6 + i * 1.1, 2.6], [-3.4 + i * 1.1, 3.4]], 0.18, A.rgba(M.bronze.deep, 0.6));
    K.line(ctx, [[-3.0, 1.0], [-4.4, 7.6]], 0.4, A.rgba(M.bronze.light, 0.5));
    ctx.restore();
    // boca escura e badalo
    ctx.fillStyle = '#120c06'; ctx.beginPath(); ctx.ellipse(0, 9.6 * S, 5.6 * S, 0.9 * S, 0, 0, A.TAU); ctx.fill();
    ctx.lineWidth = S * 0.2; ctx.strokeStyle = M.bronze.light; ctx.stroke();
    const cl = (x.clap || 0) * 1.2; K.dot(ctx, cl, 9.8, 1.0, M.iron.shadow); K.dot(ctx, cl - 0.3, 9.5, 0.4, M.iron.light);
    ctx.restore();
    const ca = Math.cos(a * D2R), sa = Math.sin(a * D2R);
    x._bell = [c[0] + ca * 5.6 * BS, c[1] + sa * 5.6 * BS]; x._mouth = [c[0] + ca * 9.6 * BS, c[1] + sa * 9.6 * BS];
  }
  function arm(ctx, W, side, back) {
    const U = W['uarm' + side], F = W['farm' + side], Hd = W['hand' + side];
    const dm = (m) => (back ? K.dim(m, BACK) : m);
    const lim = K.limb(ctx, [U.x, U.y], [F.x, F.y], [F.ex, F.ey], 3.0, 2.8, 2.2, dm(M.skin), { depth: S * 0.6, hlw: S * 0.3 });
    const p1 = [F.x, F.y], p2 = [F.ex, F.ey]; K.bands(ctx, lim, p1, p2, 2.9, 0.4, 0.8, 3, dm(M.rope)); // marcas de corda
    K.tube(ctx, [K.along(U, -0.05), K.along(U, 0.55), K.along(U, 0.98)], [3.0, 2.9, 3.2], dm(M.robe), { depth: S * 0.6, hlw: S * 0.3 });
    ctx.save(); A.boneT(ctx, Hd, S);
    K.blob(ctx, [[-1.0, -2.4], [2.6, -2.4], [3.8, -0.6], [3.0, 2.0], [-1.0, 2.0]], dm(M.skin), { depth: S * 0.5 });
    for (let i = 0; i < 3; i++) K.line(ctx, [[1.4 + i * 0.8, -2.1], [1.8 + i * 0.8, 1.8]], 0.14, A.rgba('#000', 0.4));
    ctx.restore();
  }
  function leg(ctx, W, side, back) {
    const T = W['thigh' + side], N = W['shin' + side], F = W['foot' + side];
    const dm = (m) => (back ? K.dim(m, BACK) : m);
    K.limb(ctx, [T.x, T.y], [N.x, N.y], [N.ex, N.ey], 3.4, 2.6, 2.1, dm(M.robeD), { depth: S * 0.6 });
    const p1 = [N.x, N.y], p2 = [N.ex, N.ey], dd = K.norm(p2[0] - p1[0], p2[1] - p1[1]), nn = [-dd[1], dd[0]], L = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]);
    const at = (t, w) => [p1[0] + dd[0] * L * t + nn[0] * w, p1[1] + dd[1] * L * t + nn[1] * w];
    const wr = K.poly(ctx, [at(0.3, 2.6), at(1.04, 2.2), at(1.04, -2.2), at(0.3, -2.6)], dm(M.rag), { depth: S * 0.4 });
    K.bands(ctx, wr, at(0.3, 0), at(1.0, 0), 2.6, 0.0, 1.0, 4, dm(M.rag));
    ctx.save(); A.boneT(ctx, F, S);
    K.blob(ctx, [[-2.0, -1.8], [2.2, -1.6], [5.0, -0.4], [5.0, 1.2], [-2.1, 1.3]], dm(M.boot), { depth: S * 0.5 });
    K.line(ctx, [[-2.1, 1.2], [5.0, 1.1]], 0.5, '#0e0a09');
    ctx.restore();
  }
  function torso(ctx, W, x) {
    const Sp = W.spine, C = W.chest, Pv = W.pelvis, sw = x.sway || 0;
    const [px, py] = K.along(Pv, 0.15), [snx, sny] = K.perp(Sp);
    // aba do hábito (atrás)
    const tail = A.path((q) => { const a = [px - snx * 4.8, py - sny * 4.8]; q.M(a[0], a[1]); q.Q(a[0] - 2.0 + sw * 0.4, a[1] + 6, a[0] - 2.4 + sw, a[1] + 11.6); q.L(a[0] + 0.6 + sw * 0.8, a[1] + 10.8); q.L(a[0] + 2.2 + sw * 0.6, a[1] + 11.8); q.Q(a[0] + 3.4, a[1] + 6, a[0] + 4.6, a[1] - 0.4); q.Z(); }, S);
    K.paint(ctx, tail, M.robeD, { depth: S * 0.8 });
    // corcunda enorme
    const body = H.torsoPath(W, [['pelvis', 0.15, 5.0, 4.6], ['spine', 0.3, 5.2, 5.0], ['spine', 0.85, 6.8, 5.6], ['chest', 0.4, 8.6, 6.4], ['chest', 0.8, 7.8, 6.0], ['chest', 1.06, 4.4, 3.8]], S);
    K.paint(ctx, body, M.robe, { depth: S * 1.4, hlw: S * 0.6 });
    ctx.save(); ctx.clip(body);
    for (const t of [0.25, 0.55, 0.85]) K.line(ctx, [pt(C, t, -7.6), pt(C, t + 0.2, -2.0)], 0.22, A.rgba(M.robe.deep, 0.55));
    K.line(ctx, [pt(C, 0.2, -6.6), pt(C, 0.9, -7.4)], 0.8, A.rgba(M.robe.light, 0.3));
    // remendos
    K.poly(ctx, [pt(C, 0.45, -5.0), pt(C, 0.45, -2.6), pt(C, 0.25, -2.4), pt(C, 0.25, -4.8)], M.robeD, { depth: S * 0.1 });
    ctx.restore();
    // cordas de sino enroladas ao tronco
    for (let i = 0; i < 2; i++) { const t = 0.2 + i * 0.3; K.line(ctx, [pt(C, t, -8.0), pt(C, t + 0.1, -2), pt(C, t + 0.2, 6.0)], 0.6, M.rope.shadow); K.line(ctx, [pt(C, t, -8.0), pt(C, t + 0.1, -2), pt(C, t + 0.2, 6.0)], 0.26, A.rgba(M.rope.light, 0.8)); }
    const bl = pt(Sp, 0.05, -5.0), br = pt(Sp, 0.05, 4.8);
    K.line(ctx, [bl, br], 1.0, M.rope.shadow); K.line(ctx, [bl, br], 0.4, M.rope.base);
    K.tube(ctx, [[br[0] - 1.0, br[1]], [br[0] - 0.6 + sw * 0.4, br[1] + 4.0], [br[0] - 0.8 + sw * 0.8, br[1] + 6.6]], [0.4, 0.36, 0.3], M.rope, { depth: S * 0.1 });
  }
  // cabeça: capuz fundo; trapos nas orelhas; um olho de brasa
  function head(ctx, W, x) {
    const Hd = W.head, mo = x.mouth || 0;
    ctx.save(); A.boneT(ctx, Hd, S); ctx.rotate(Math.PI / 2);
    const hood = K.blob(ctx, [[-3.6, 2.4], [-4.2, -1.8], [-3.0, -5.0], [-0.2, -6.4], [2.6, -5.6], [4.0, -3.4], [4.2, -0.6], [3.2, 2.0], [0.4, 2.8]], M.robe, { depth: S * 0.8, hlw: S * 0.4, light: [0.5, -1] });
    // abertura escura do capuz
    const op = K.blobPath([[0.8, -4.6], [3.2, -4.0], [3.8, -1.6], [3.2, 1.2], [1.4, 1.6], [0.6, -1.0]]); ctx.fillStyle = '#0e0b10'; ctx.fill(op);
    ctx.save(); ctx.clip(op);
    K.blob(ctx, [[1.6, -3.2], [3.6, -2.8], [3.8, -0.4], [3.0, 1.2], [1.8, 0.8]], K.dim(M.skin, 0.55), { depth: S * 0.3, inkW: 0 });
    // trapos ensanguentados na orelha (por baixo do capuz)
    K.blob(ctx, [[0.6, -2.2], [1.8, -2.4], [2.0, -0.8], [0.8, -0.6]], K.dim(M.rag, 0.7), { depth: S * 0.1, inkW: 0 });
    K.dot(ctx, 1.3, -1.4, 0.4, A.rgba('#6a1a10', 0.8));
    K.line(ctx, [[2.6, 0.4 + mo * 0.2], [3.6, 0.2 + mo * 0.4]], 0.2 + mo * 0.2, '#1a0c08');
    ctx.restore();
    K.ember(ctx, 2.9, -2.0, 0.5, x.eye === undefined ? 1 : x.eye, '#ffd080');
    ctx.restore();
  }
  function draw(ctx, W, x) {
    const Hd = W.handF, g = [Hd.x + Math.cos(Hd.a * D2R) * 1.2, Hd.y + Math.sin(Hd.a * D2R) * 1.2];
    const ba = x.ba, bl = x.bl || 8, c = x.bAt ? [x.bAt[0], x.bAt[1]] : [g[0] + Math.cos(ba * D2R) * bl, g[1] + Math.sin(ba * D2R) * bl];
    // o sino fica atrás do corpo quando passa por trás (balanço)
    const behind = !x.bAt && Math.cos(ba * D2R) < -0.2 && x.behind !== 0;
    if (behind) { chain(ctx, g, c); bell(ctx, c, (x.bAxK ? A.lerp(ba, x.bAx || 0, x.bAxK) : ba), x); }
    arm(ctx, W, 'B', true);
    leg(ctx, W, 'B', true);
    torso(ctx, W, x);
    leg(ctx, W, 'F', false);
    head(ctx, W, x);
    if (!behind) { chain(ctx, g, c); bell(ctx, c, (x.bAxK ? A.lerp(ba, x.bAx || 0, x.bAxK) : ba), x); }
    arm(ctx, W, 'F', false);
    x._g = g;
  }
  function points(W, x) {
    const Hh = W.head, ca = Math.cos(Hh.a * D2R), sa = Math.sin(Hh.a * D2R);
    return { tip: x._bell, bell: x._bell, mouth: x._mouth, grip: x._g, eye: [Hh.x + ca * 2.0 - sa * 2.9, Hh.y + sa * 2.0 + ca * 2.9] };
  }

  const STANCE = { pelvis: 0, spine: 12, chest: 22, neck: 30, head: -50 };
  const RY = -13.2;
  const P = (a, x, root) => A.pose(A.addA(STANCE, a || {}), x, root || [0, RY]);
  // pronto: punho da frente à cintura, o sino pendurado a raspar no chão à frente
  const base = (o = {}) => Object.assign({ fF: [5.0, 0], fB: [-4.8, 0], hF: [7.0, 10.6], haF: 70, ba: 84, bl: 1.0, bAx: 0, bAxK: 0, sway: 0, eye: 1, mouth: 0, clap: 0 }, o);
  function anims() {
    const R = {};
    R.idle = { n: 6, fps: 5, loop: true, poseFn: (t) => { const s = Math.sin(t * A.TAU); return P({ spine: s, chest: s * 1.2 }, base({ hF: [7.0 + s * 0.3, 10.6], ba: 84 + s * 3, sway: s * 0.5, clap: s }), [0, RY + s * 0.2]); } };
    R.move = { n: 8, fps: 7, loop: true, stride: 15, poseFn: (t) => { const f = A.stepFeet(t, { stride: 4.6, lift: 2.0 }); const s = Math.sin(t * A.TAU), c = Math.cos(t * A.TAU); return P({ spine: 2 + c * 1.5, chest: s * 2 }, base({ fF: f.F, fB: f.B, faF: f.F[1] < 0 ? 10 : 0, faB: f.B[1] < 0 ? 10 : 0, hF: [7.4, 9.8], ba: 76 + s * 12, bl: 1.6, sway: -c, clap: s }), [0.4, RY + Math.abs(s) * 0.8]); } };
    // BALANÇO DO SINO (branco, aparável): leva o sino para trás e para cima e varre um arco largo à frente
    const SW = (ba, hF, sp, root, o) => P({ spine: sp, chest: sp * 1.2 }, base(Object.assign({ hF, ba, bl: 7.0, eye: 1.5, mouth: 0.6 }, o || {})), root);
    R.atk_swing = { n: 10, fps: 10, phases: [3, 4], keys: [
      [0, P({}, base())],
      [0.22, SW(200, [-4.0, 8.0], -6, [-1.0, RY + 0.4], { clap: -1 })],
      [0.3, SW(228, [-5.0, 4.0], -10, [-1.4, RY + 0.6], { clap: -1 })],
      [0.42, SW(270, [1.0, -8.0], -8, [-0.4, RY + 0.2], { clap: 0, mouth: 1 })],
      [0.52, SW(326, [9.0, -2.0], 4, [1.0, RY + 0.6], { clap: 1, mouth: 1 })],
      [0.62, SW(382, [11.0, 6.0], 14, [2.0, RY + 1.6], { clap: 1, mouth: 1 })],
      [0.72, SW(412, [10.0, 6.0], 14, [2.0, RY + 1.6], { clap: 0.5, mouth: 0.6, bl: 4.0 })],
      [1, P({}, base({ ba: 444 }))]] };
    // TOQUE: ergue o sino ao alto com as duas mãos e bate-o de boca para baixo no chão (ondas)
    const RU = P({ spine: -14, chest: -16, neck: -6, head: -10 }, base({ hF: [2.0, -14.0], haF: -90, hB: [0.6, -14.4], haB: -90, ba: -90, bl: 3.0, bAx: -90, bAxK: 1, eye: 1.8, mouth: 1, behind: 0 }), [-0.6, RY + 0.4]);
    const RD = P({ spine: 26, chest: 20, neck: 6 }, base({ hF: [10.0, 4.0], haF: 80, hB: [8.6, 4.6], haB: 80, ba: 90, bl: 0.5, bAx: 90, bAxK: 1, eye: 2, mouth: 1, clap: 1, behind: 0 }), [1.6, RY + 3.6]);
    R.atk_ring = { n: 10, fps: 10, phases: [5, 1], keys: [[0, P({}, base())], [0.3, RU], [0.5, RU], [0.56, RD], [0.8, RD], [1, P({}, base())]] };
    // PISADA: levanta o pé, ruge e pisa — a torre estremece (caem destroços)
    const ST_U = P({ spine: -6, chest: -6, head: -16 }, base({ fF: [6.0, -6.0], faF: 20, hF: [5.0, 9.0], ba: 70, mouth: 1, eye: 1.8 }), [-0.8, RY + 0.2]);
    const ST_D = P({ spine: 16, chest: 14, head: -18 }, base({ fF: [7.0, 0], fB: [-5.4, 0], hF: [8.0, 6.0], ba: 90, bl: 1.0, mouth: 1.2, eye: 2, clap: 1 }), [0.8, RY + 2.6]);
    R.atk_stomp = { n: 8, fps: 10, phases: [4, 1], keys: [[0, P({}, base())], [0.3, ST_U], [0.48, ST_U], [0.56, ST_D], [0.8, ST_D], [1, P({}, base())]] };
    // INVESTIDA (vermelho): baixa a cabeça e carrega com o ombro, o sino a arrastar atrás
    R.atk_charge = { n: 8, fps: 10, phases: [3, 3], poseFn: (t, i) => { const run = i >= 3 && i < 7, u = (i - 3) / 4; const f = run ? A.stepFeet(u, { stride: 5.6, lift: 2.6 }) : { F: [5.6, 0], B: [-5.4, 0] }; return P({ spine: run ? 20 : 8, chest: run ? 16 : 10, neck: 6, head: run ? -12 : -20 }, base({ fF: f.F, fB: f.B, faF: f.F[1] < 0 ? 16 : 0, faB: f.B[1] < 0 ? 16 : 0, hF: run ? [-2.0, 12.0] : [5.0, 9.0], ba: run ? 160 : 110, bl: run ? 7.0 : 3.0, eye: 2, mouth: run ? 1 : 0.6 }), [run ? 1.8 : -0.6, RY + (run ? 1.6 + Math.abs(Math.sin(u * A.TAU)) * 0.8 : 0.8)]); } };
    R.hurt = { n: 3, fps: 12, keys: [[0, P({ spine: -10, chest: -10, neck: -4, head: -10 }, base({ hF: [4.0, 10.0], ba: 60, eye: 1.8, mouth: 1 }), [-1.0, RY])], [1, P({}, base())]] };
    // atordoado pelo próprio sino: larga a corrente e leva as mãos ao capuz, a cambalear
    R.stagger = { n: 6, fps: 6, loop: true, poseFn: (t) => { const s = Math.sin(t * A.TAU); return P({ spine: 6 + s * 4, chest: 10, neck: 10, head: -30 + s * 8 }, base({ hF: [5.4, -4.4 + s * 0.6], haF: -100, hB: [4.4, -4.0 - s * 0.6], haB: -100, ba: 96, bAt: [8.0, -8.6], bAx: 0, bAxK: 1, eye: 0.4 + Math.abs(s) * 0.6, mouth: 1, sway: s }), [s * 0.8, RY + 1.0]); } };
    R.death = { n: 10, fps: 6, keys: [
      [0, P({ spine: -12, chest: -12, head: -14 }, base({ hF: [4, 6], ba: 80, eye: 2, mouth: 1.4 }), [-0.8, RY])],
      [0.4, P({ spine: 20, chest: 16, neck: 10 }, base({ fF: [6.0, -0.2], fB: [-4.0, 0], faB: 60, hF: [8, 12], ba: 90, bAt: [12.0, -8.6], bAx: 0, bAxK: 1, eye: 1, mouth: 1 }), [0.8, RY + 6.0])],
      [1, P({ spine: 70, chest: 16, neck: 10, head: -10 }, base({ fF: [6.4, 0], fB: [-3.0, 0], faB: 70, hF: [10, 8], ba: 10, bAt: [13.0, -8.6], bAx: 0, bAxK: 1, eye: 0, mouth: 0.4 }), [2.4, RY + 8.8])]] };
    return R;
  }
  A.register('en_b_sineiro', () => A.creature({ name: 'en_b_sineiro', S, unit: 1.75, box: [130, 104], anchor: [62, 90], rig, solve, draw, points, anims: anims(), post: K.post('#d8c0e0', 0.3, 0.04) }));
  (A.previewCell = A.previewCell || {}).en_b_sineiro = [140, 140];
})(window.ART);
