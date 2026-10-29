// Vesperal — Ama Elowen (chefe dos Jardins): a ama do berçário real que ficou a embalar até criar raízes.
// Alta e magra, pele de casca clara de salgueiro, rosto encovado com olhos de seiva verde; touca e véu de ama em
// linho cinzento-esverdeado de onde caem cabelos-ramos de salgueiro-chorão; corpete de casca com nós, avental de
// ama rasgado e uma saia comprida de casca e musgo que acaba em raízes (cravadas no chão na fase 1, a rastejar
// como pés na fase 2). No braço de trás embala uma trouxa de folhas vazia, com uma luz fraca; o braço da frente
// é um ramo com dedos de espinho (o chicote de silvas é desenhado no jogo). Exportada a ×1.75.
// → assets/sprites/en_b_elowen.png
'use strict';
(function (A) {
  const S = 5, K = A.kit(S), D2R = A.D2R;
  const H = A.humanoid({ pelvis: 3.0, spine: 6.2, chest: 7.0, neck: 2.6, head: 4.4, thigh: 9.0, shin: 8.4, foot: 3.0, uarm: 7.6, farm: 7.6, hand: 3.0, shoulder: 0.7 });
  const rig = H.rig;
  const M = {
    bark: A.mat('#8a8470', { shadow: '#4e4a3c', light: '#bab49c', deep: '#1c1a14' }),
    barkD: A.mat('#4e4632', { shadow: '#2a2618', light: '#766c50', deep: '#0e0c08' }),
    moss: A.mat('#4e6a34', { shadow: '#2a3a1a', light: '#7a9a50', deep: '#101a08' }),
    linen: A.mat('#9aa490', { shadow: '#5a6454', light: '#c8d0bc', deep: '#1e221c' }),
    apron: A.mat('#8a8e7c', { shadow: '#545848', light: '#b4b8a4' }),
    leaf: A.mat('#5e7a3a', { shadow: '#34481e', light: '#8eaa5a' }),
    willow: A.mat('#6a7e44', { shadow: '#3a4a22', light: '#9ab064' }),
    root: A.mat('#5a4a34', { shadow: '#30261a', light: '#86704e', deep: '#120e08' }),
    thorn: '#d8d0b0',
  };
  const BACK = 0.62;
  function solve(pose) {
    const x = pose.extra, r = pose.root;
    H.leg(pose, 'F', [r[0] + 2.4, -1.0], 0); H.leg(pose, 'B', [r[0] - 2.4, -1.0], 0);
    const W = rig.solve(pose);
    H.arm(pose, 'F', [W.uarmF.x + x.hF[0], W.uarmF.y + x.hF[1]], x.haF || 0, x.bF || 1);
    H.arm(pose, 'B', [W.uarmB.x + x.hB[0], W.uarmB.y + x.hB[1]], x.haB || 0, x.bB || 1);
  }
  const pt = (B, t, w) => { const [x, y] = K.along(B, t), [nx, ny] = K.perp(B); return [x + nx * w, y + ny * w]; };
  let seed = 1; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

  // braço-ramo (frente) ou braço que embala (trás)
  function arm(ctx, W, side, back, x) {
    const U = W['uarm' + side], F = W['farm' + side], Hd = W['hand' + side];
    const dm = (m) => (back ? K.dim(m, BACK) : m);
    const lim = K.limb(ctx, [U.x, U.y], [F.x, F.y], [F.ex, F.ey], 1.8, 1.5, 1.2, dm(M.bark), { depth: S * 0.5, hlw: S * 0.25 });
    ctx.save(); ctx.clip(lim); for (let i = 0; i < 5; i++) { const a = K.along(U, 0.2 + i * 0.18), b = K.along(F, 0.1 + i * 0.18); K.line(ctx, [[a[0] - 0.6, a[1]], [b[0] - 0.4, b[1]]], 0.12, A.rgba(M.bark.deep, 0.45)); } ctx.restore();
    // manga de linho rasgada até ao cotovelo
    K.tube(ctx, [K.along(U, -0.05), K.along(U, 0.5), K.along(U, 0.92)], [1.9, 2.0, 2.4], dm(M.linen), { depth: S * 0.4, hlw: S * 0.2, flat: true });
    const e = K.along(U, 0.92), d = K.norm(U.ex - U.x, U.ey - U.y), n = [-d[1], d[0]];
    for (let i = -2; i <= 2; i++) K.poly(ctx, [[e[0] + n[0] * i * 1.1, e[1] + n[1] * i * 1.1], [e[0] + n[0] * (i + 0.6) * 1.1, e[1] + n[1] * (i + 0.6) * 1.1], [e[0] + n[0] * (i + 0.3) * 1.1 + d[0] * (1.4 + (i & 1)), e[1] + n[1] * (i + 0.3) * 1.1 + d[1] * (1.4 + (i & 1))]], dm(M.linen), { depth: S * 0.1 });
    ctx.save(); A.boneT(ctx, Hd, S);
    if (side === 'F') { // dedos compridos de espinho
      for (const [a, l] of [[-28, 4.6], [-8, 5.4], [12, 5.0], [32, 3.8]]) { const c = Math.cos(a * D2R), s = Math.sin(a * D2R); K.tube(ctx, [[0, 0], [c * l * 0.55, s * l * 0.55], [c * l, s * l + 0.4]], [0.55, 0.45, 0.14], dm(M.bark), { depth: S * 0.15 }); K.poly(ctx, [[c * l * 0.5, s * l * 0.5 - 0.3], [c * l * 0.5 + 0.4, s * l * 0.5 - 1.1], [c * l * 0.5 + 0.6, s * l * 0.5 - 0.2]], { base: M.thorn, shadow: '#8a8468', light: '#fff', deep: '#222' }, { depth: S * 0.05 }); }
    } else K.blob(ctx, [[-0.8, -1.2], [2.0, -1.4], [2.8, 0], [2.0, 1.2], [-0.8, 1.1]], dm(M.bark), { depth: S * 0.3 });
    ctx.restore();
  }
  // trouxa de folhas embalada no braço de trás (vazia, com uma luz fraca)
  function bundle(ctx, W, x) {
    const Hd = W.handB, c = [Hd.x + Math.cos(Hd.a * D2R) * 0.6 + 1.4, Hd.y + Math.sin(Hd.a * D2R) * 0.6 - 1.6], sw = (x.rock || 0) * 6 * D2R;
    ctx.save(); ctx.translate(c[0] * S, c[1] * S); ctx.rotate(-0.4 + sw);
    const b = K.blob(ctx, [[-3.6, -1.0], [-2.0, -2.8], [1.4, -3.0], [3.8, -1.2], [3.6, 1.6], [0.6, 2.8], [-2.8, 2.2]], K.dim(M.linen, 0.8), { depth: S * 0.5, hlw: S * 0.3 });
    ctx.save(); ctx.clip(b); seed = 21;
    for (let i = 0; i < 4; i++) K.line(ctx, [[-3.6, -2.0 + i * 1.4], [3.6, -2.8 + i * 1.6]], 0.2, A.rgba(M.linen.deep, 0.5));
    for (let i = 0; i < 6; i++) { const lx = -3.4 + rnd() * 2.4, ly = -2.6 + rnd() * 5, a = rnd() * A.TAU; ctx.save(); ctx.translate(lx * S, ly * S); ctx.rotate(a); K.blob(ctx, [[-1.4, 0], [0, -0.6], [1.4, 0], [0, 0.6]], rnd() < 0.5 ? K.dim(M.leaf, 0.8) : K.dim(M.moss, 0.9), { depth: S * 0.1, inkW: K.IW * 0.5 }); ctx.restore(); }
    ctx.restore();
    // abertura escura onde devia estar um rosto
    const hole = K.blobPath([[1.0, -1.6], [2.8, -1.4], [3.0, 0.2], [1.4, 0.4]]); ctx.fillStyle = '#0e140a'; ctx.fill(hole);
    ctx.restore();
    x._bundle = [c[0] + 1.6, c[1] - 0.6];
  }
  // saia de casca e musgo até ao chão, que acaba em raízes
  function skirt(ctx, W, x) {
    const Pv = W.pelvis, Sp = W.spine, r = x._root, sw = x.sway || 0, rooted = x.rooted === undefined ? 1 : x.rooted;
    const [px, py] = K.along(Pv, 0.2), [snx] = K.perp(Sp);
    const hemY = -1.0, L = [px - 4.6 + sw * 0.4, hemY], R = [px + 5.4 + sw * 0.6, hemY];
    // raízes
    const roots = [[-8.6, 1.0, -1], [-5.0, 1.6, -1], [-1.2, 1.8, 0], [3.0, 1.6, 1], [7.4, 1.2, 1], [10.0, 0.6, 1]];
    for (const [dx, dep, s] of roots) {
      const a = [px + dx * 0.45 + sw * 0.3, hemY - 0.4];
      let pts;
      if (rooted > 0.5) pts = [a, [px + dx * 0.8, 0.4], [px + dx * 1.15 + s * 1.4, dep + 0.6]];
      else { const st = Math.sin((x.walk || 0) * A.TAU + dx) * 1.4; pts = [a, [px + dx * 0.75 + st * 0.4, -0.2 - Math.max(0, st) * 0.6], [px + dx * 1.0 + s * 1.2 + st, -0.1]]; }
      K.tube(ctx, pts, [1.1, 0.8, 0.25], M.root, { depth: S * 0.3, hlw: S * 0.15 });
    }
    const top0 = pt(Sp, 0.05, -4.0), top1 = pt(Sp, 0.05, 4.4);
    const hem = []; for (let i = 0; i <= 9; i++) { const k = i / 9; hem.push([A.lerp(R[0], L[0], k) + Math.sin(i * 2.1) * 0.3, hemY + (i % 2 ? -0.9 : 0.2) + Math.sin(k * Math.PI) * 0.3]); }
    const path = A.path((q) => { q.M(top0[0], top0[1]); q.L(top1[0], top1[1]); q.Q(px + snx * 5.2 + 1.2, py + 6, R[0], R[1]); hem.forEach((p) => q.L(p[0], p[1])); q.Q(px - 5.4 + sw * 0.2, py + 6, top0[0], top0[1]); q.Z(); }, S);
    K.paint(ctx, path, M.barkD, { depth: S * 1.0, hlw: S * 0.4 });
    ctx.save(); ctx.clip(path);
    for (let i = 0; i < 7; i++) { const xx = px - 4 + i * 1.5; K.line(ctx, [[xx, py], [xx + sw * 0.3 + (i - 3) * 0.5, hemY]], 0.3, A.rgba(M.barkD.deep, 0.5)); K.line(ctx, [[xx + 0.4, py + 2], [xx + 0.5 + sw * 0.3 + (i - 3) * 0.5, hemY]], 0.14, A.rgba(M.barkD.light, 0.3)); }
    const mg = ctx.createLinearGradient(0, (hemY - 8) * S, 0, hemY * S); mg.addColorStop(0, 'rgba(60,80,40,0)'); mg.addColorStop(1, 'rgba(60,80,40,0.45)'); ctx.fillStyle = mg; ctx.fill(path);
    ctx.restore();
    // farrapos de musgo pendurados
    for (const dx of [-3.4, 0.6, 4.2]) K.tube(ctx, [[px + dx, py + 2.4], [px + dx + sw * 0.4, py + 6], [px + dx + sw * 0.8 - 0.4, py + 8.6]], [0.7, 0.5, 0.2], M.moss, { depth: S * 0.15 });
    void r;
  }
  function torso(ctx, W, x) {
    const Sp = W.spine, C = W.chest, sw = x.sway || 0;
    const body = H.torsoPath(W, [['pelvis', 0.3, 3.8, 4.0], ['spine', 0.4, 3.2, 3.4], ['spine', 0.9, 3.6, 3.8], ['chest', 0.45, 4.4, 4.4], ['chest', 0.85, 4.2, 4.2], ['chest', 1.06, 2.2, 2.6]], S);
    K.paint(ctx, body, M.bark, { depth: S * 0.9, hlw: S * 0.4 });
    ctx.save(); ctx.clip(body);
    for (let i = 0; i < 6; i++) K.line(ctx, [pt(Sp, 0.0, -3 + i * 1.3), pt(C, 0.9, -2.6 + i * 1.0)], 0.16, A.rgba(M.bark.deep, 0.45));
    const kn = pt(C, 0.4, 1.4); ctx.fillStyle = A.rgba(M.bark.deep, 0.7); ctx.beginPath(); ctx.ellipse(kn[0] * S, kn[1] * S, 0.8 * S, 1.1 * S, 0.3, 0, A.TAU); ctx.fill();
    ctx.restore();
    // avental de ama rasgado
    const a0 = pt(C, 0.05, 0.6), a1 = pt(C, 0.05, 3.6), b0 = pt(Sp, -0.4, 0.2), b1 = pt(Sp, -0.4, 5.6);
    const ap = A.path((q) => { q.M(a0[0], a0[1]); q.L(a1[0], a1[1]); q.Q(...pt(Sp, 0.4, 4.6), b1[0] + sw * 0.3, b1[1] + 4.0); q.L(b1[0] - 1.4 + sw * 0.3, b1[1] + 2.8); q.L(b1[0] - 2.4 + sw * 0.3, b1[1] + 4.6); q.L(b0[0] + sw * 0.2, b0[1] + 3.2); q.Q(...pt(Sp, 0.5, 0.0), a0[0], a0[1]); q.Z(); }, S);
    K.paint(ctx, ap, M.apron, { depth: S * 0.5, hlw: S * 0.25 });
    ctx.save(); ctx.clip(ap); const ag = ctx.createLinearGradient(0, a0[1] * S, 0, (b1[1] + 4) * S); ag.addColorStop(0, 'rgba(40,50,30,0)'); ag.addColorStop(1, 'rgba(40,50,30,0.5)'); ctx.fillStyle = ag; ctx.fill(ap); ctx.restore();
    K.line(ctx, [pt(Sp, 0.1, -3.8), pt(Sp, 0.1, 4.0)], 0.5, M.root.shadow); // cordão
  }
  // cabeça: rosto encovado de casca, olhos de seiva, touca e véu; cabelos de salgueiro a cair
  function head(ctx, W, x) {
    const Hd = W.head, sw = x.sway || 0, mo = x.mouth || 0;
    ctx.save(); A.boneT(ctx, Hd, S); ctx.rotate(Math.PI / 2);
    // véu atrás e ramos de salgueiro
    K.blob(ctx, [[-1.0, -5.4], [-4.2, -3.6], [-5.4, 1.0], [-5.0 + sw * 0.5, 6.0], [-2.0 + sw * 0.4, 5.0], [-0.6, 0.4]], M.linen, { depth: S * 0.5 });
    seed = 5;
    for (let i = 0; i < 7; i++) { const x0 = -3.6 + i * 0.9, l = 8 + rnd() * 6; const pts = [[x0, -2.0], [x0 - 0.6 + sw * 0.4, l * 0.5], [x0 - 1.0 + sw * (0.8 + i * 0.1), l]]; K.tube(ctx, pts, [0.32, 0.26, 0.12], M.willow, { depth: S * 0.1, inkW: K.IW * 0.6 }); for (let j = 1; j < 5; j++) { const k = j / 5, q = [A.lerp(pts[0][0], pts[2][0], k), A.lerp(pts[0][1], pts[2][1], k)]; K.blob(ctx, [[q[0], q[1]], [q[0] + 0.5, q[1] + 0.6], [q[0], q[1] + 1.4], [q[0] - 0.5, q[1] + 0.6]], M.willow, { depth: S * 0.05, inkW: K.IW * 0.5 }); } }
    const face = K.blob(ctx, [[-2.0, 0.6], [-2.6, -2.4], [-1.4, -4.6], [0.8, -5.0], [2.4, -4.0], [3.0, -2.4], [3.2, -1.2], [2.6, -0.8], [2.8, 0.4], [1.6, 1.6], [0, 1.8]], M.bark, { depth: S * 0.7, hlw: S * 0.35, light: [0.6, -1] });
    ctx.save(); ctx.clip(face);
    const cg = ctx.createRadialGradient(1.4 * S, -0.6 * S, 0, 1.4 * S, -0.6 * S, 1.6 * S); cg.addColorStop(0, 'rgba(30,28,20,0.45)'); cg.addColorStop(1, 'rgba(30,28,20,0)'); ctx.fillStyle = cg; ctx.fillRect(-1 * S, -3 * S, 5 * S, 5 * S);
    for (let i = 0; i < 4; i++) K.line(ctx, [[-1.6 + i * 0.6, -4.4], [-1.0 + i * 0.7, 1.2]], 0.08, A.rgba(M.bark.deep, 0.35));
    ctx.restore();
    const eo = K.blobPath([[1.2, -2.9], [2.5, -3.1], [2.7, -2.3], [1.4, -2.2]]); ctx.fillStyle = '#0c1208'; ctx.fill(eo);
    K.ember(ctx, 2.0, -2.65, 0.4, x.eye === undefined ? 1 : x.eye, '#a8f0a0');
    // lágrima de seiva
    K.line(ctx, [[1.8, -2.2], [1.7, -1.0], [1.9, 0.0]], 0.16, A.rgba('#a8e090', 0.6));
    // boca (canta na canção de embalar)
    const mp = K.blobPath([[2.0, 0.0 - mo * 0.2], [2.8, -0.1 - mo * 0.2], [2.9, 0.2 + mo * 0.6], [2.1, 0.3 + mo * 0.6]]); ctx.fillStyle = '#140e08'; ctx.fill(mp);
    // touca de ama
    K.blob(ctx, [[-2.6, -1.6], [-2.4, -4.4], [-0.6, -5.8], [1.8, -5.8], [3.2, -4.6], [3.0, -3.8], [0.6, -4.4], [-1.0, -3.4], [-1.6, -0.8]], M.linen, { depth: S * 0.5, hlw: S * 0.3 });
    K.line(ctx, [[3.0, -3.9], [0.4, -4.5], [-1.2, -3.0]], 0.2, M.linen.shadow);
    ctx.restore();
  }
  function draw(ctx, W, x) {
    x._root = [0, 0];
    arm(ctx, W, 'B', true, x);
    skirt(ctx, W, x);
    torso(ctx, W, x);
    bundle(ctx, W, x);
    head(ctx, W, x);
    arm(ctx, W, 'F', false, x);
  }
  function overlay(ctx, W, x) {
    const b = x._bundle; if (b) A.glow(ctx, b[0] * S, b[1] * S, (3 + (x.song || 0) * 3) * S, '#c8f0b0', 0.25 + (x.song || 0) * 0.3);
  }
  function points(W, x) {
    const Hh = W.head, ca = Math.cos(Hh.a * D2R), sa = Math.sin(Hh.a * D2R), Hd = W.handF;
    return { tip: [Hd.x + Math.cos(Hd.a * D2R) * 4.6, Hd.y + Math.sin(Hd.a * D2R) * 4.6], hand: [Hd.x + Math.cos(Hd.a * D2R) * 1.6, Hd.y + Math.sin(Hd.a * D2R) * 1.6], eye: [Hh.x + ca * 2.65 - sa * 2.0, Hh.y + sa * 2.65 + ca * 2.0], light: x._bundle, mouth: [Hh.x + ca * 0.1 - sa * 2.6, Hh.y + sa * 0.1 + ca * 2.6] };
  }

  const STANCE = { pelvis: 0, spine: 2, chest: 4, neck: 10, head: -8 };
  const RY = -16.4;
  const P = (a, x, root) => A.pose(A.addA(STANCE, a || {}), x, root || [0, RY]);
  // braço de trás embala a trouxa ao peito; braço-ramo da frente pendurado
  const base = (o = {}) => Object.assign({ hF: [3.0, 12.6], haF: 80, hB: [5.4, 5.6], haB: -10, bB: 1, rooted: 1, sway: 0, rock: 0, eye: 1, mouth: 0, song: 0 }, o);
  function anims() {
    const R = {};
    R.idle = { n: 8, fps: 6, loop: true, poseFn: (t) => { const s = Math.sin(t * A.TAU); return P({ spine: s * 1.2, chest: s * 1.2, neck: -s, head: s * 2 }, base({ sway: s, rock: s * 0.6, hF: [3.0 + s * 0.4, 12.6] }), [s * 0.3, RY]); } };
    R.move = { n: 8, fps: 7, loop: true, poseFn: (t) => { const s = Math.sin(t * A.TAU); return P({ spine: 4 + s * 1.5, chest: 2, head: -s * 2 }, base({ rooted: 0, walk: t, sway: -1 + s * 0.6, rock: s * 0.5, hF: [4.0, 11.6] }), [0.4, RY + Math.abs(s) * 0.6]); } };
    // ESPINHOS (sem sinal): ergue o braço-ramo ao alto e crava-o; as silvas rompem do chão
    const TH_U = P({ spine: -4, chest: -6, head: -10 }, base({ hF: [3.4, -12.0], haF: -90, mouth: 0.6, eye: 1.5 }), [-0.4, RY]);
    const TH_D = P({ spine: 12, chest: 10, neck: 4 }, base({ hF: [9.0, 12.0], haF: 80, mouth: 0.8, eye: 1.6, sway: 1 }), [1.0, RY + 1.0]);
    R.atk_thorns = { n: 8, fps: 10, phases: [3, 3], keys: [[0, P({}, base())], [0.3, TH_U], [0.4, TH_D], [0.7, TH_D], [1, P({}, base())]] };
    // CHICOTE (branco): o braço-ramo recua por trás e chicoteia em frente, à altura do peito
    const WH_W = P({ spine: -6, chest: -10, head: -6 }, base({ hF: [-8.0, 2.0], haF: 190, eye: 1.4, sway: -0.6 }), [-1.0, RY]);
    const WH_A = P({ spine: 8, chest: 6 }, base({ hF: [14.4, 2.4], haF: 0, eye: 1.6, sway: 0.8, mouth: 0.4 }), [1.2, RY + 0.4]);
    R.atk_whip = { n: 8, fps: 12, phases: [3, 2], keys: [[0, P({}, base())], [0.3, WH_W], [0.38, WH_W], [0.5, WH_A], [0.7, WH_A], [1, P({}, base())]] };
    // SEMENTES: atira por cima do ombro
    const SE_W = P({ spine: -6, chest: -10, head: -4 }, base({ hF: [-5.0, -6.0], haF: -140 }), [-0.6, RY]);
    const SE_A = P({ spine: 8, chest: 6 }, base({ hF: [10.0, -2.0], haF: -20, mouth: 0.3 }), [0.8, RY + 0.3]);
    R.atk_seeds = { n: 8, fps: 10, phases: [3, 2], keys: [[0, P({}, base())], [0.3, SE_W], [0.4, SE_W], [0.55, SE_A], [0.7, SE_A], [1, P({}, base())]] };
    // CANÇÃO DE EMBALAR (ponto fraco): embala a trouxa a cantar, de olhos fechados — longa e indefesa
    R.atk_lullaby = { n: 12, fps: 8, phases: [9, 1], poseFn: (t, i) => { const s = Math.sin(i / 9 * A.TAU * 2); const sing = i < 9; return P({ spine: -2 + s, chest: -4, neck: 6, head: 14 + s * 3 }, base({ rock: s * 2, hB: [5.0 + s * 0.4, 5.0], hF: sing ? [6.4, 4.4] : [9.0, 2.0], haF: sing ? -40 : -10, mouth: sing ? 0.6 + Math.abs(s) * 0.4 : 1, eye: sing ? 0.25 : 1.6, song: sing ? 0.6 + Math.abs(s) * 0.4 : 1, sway: s * 0.6 }), [s * 0.3, RY]); } };
    R.hurt = { n: 3, fps: 12, keys: [[0, P({ spine: -8, chest: -8, neck: -4, head: -12 }, base({ hF: [1.0, 10.0], eye: 1.8, mouth: 0.8, sway: -1 }), [-0.8, RY])], [1, P({}, base())]] };
    // canção interrompida / atordoada: dobra-se sobre a trouxa, a mão-ramo na cara
    R.stagger = { n: 4, fps: 5, loop: true, poseFn: (t) => { const s = Math.sin(t * A.TAU); return P({ spine: 18 + s * 2, chest: 14, neck: 14, head: 10 }, base({ hF: [7.0, 0.4], haF: -100, hB: [5.0, 7.0], rock: s, eye: 0.4, mouth: 0.5, sway: 1 + s * 0.4 }), [0.8, RY + 1.6]); } };
    R.death = { n: 10, fps: 6, keys: [[0, P({ spine: -10, chest: -10, head: -16 }, base({ hF: [2, 4], eye: 2, mouth: 1 }), [-0.6, RY])], [0.5, P({ spine: 24, chest: 18, neck: 12, head: 12 }, base({ hF: [8, 10], hB: [5, 7], eye: 0.6, mouth: 0.4, sway: 1.4 }), [0.8, RY + 4])], [1, P({ spine: 40, chest: 24, neck: 14, head: 14 }, base({ hF: [9, 12], hB: [6, 8], eye: 0, mouth: 0, sway: 1.8 }), [1.4, RY + 6.4])]] };
    return R;
  }
  A.register('en_b_elowen', () => A.creature({ name: 'en_b_elowen', S, unit: 1.75, box: [110, 104], anchor: [50, 92], rig, solve, draw, overlay, points, anims: anims(), post: K.post('#c8f0b8', 0.3, 0.04) }));
  (A.previewCell = A.previewCell || {}).en_b_elowen = [120, 130];
})(window.ART);
