// Vesperal — A Carpideira (chefe errante): a mulher que chorava os mortos da cidade por ofício e que nunca mais
// conseguiu parar. Altíssima e curvada, luto negro dos pés à cabeça, mantilha comprida presa a um pente alto,
// máscara de porcelana rachada com lágrimas de cera negra, um coração em brasa trespassado por sete punhais no
// peito, velas fundidas nos ombros e um rosário de contas pesadas na mão de trás. Quando grita, a cabeça cai
// para trás e a boca da máscara abre-se até ao queixo. Exportada a ×1.75. → assets/sprites/en_b_carpideira.png
'use strict';
(function (A) {
  const S = 5, K = A.kit(S), D2R = A.D2R;
  const H = A.humanoid({ pelvis: 3.0, spine: 6.6, chest: 7.0, neck: 3.0, head: 4.4, thigh: 9.4, shin: 8.8, foot: 3.0, uarm: 8.4, farm: 8.4, hand: 3.2, shoulder: 0.7 });
  const rig = H.rig;
  const M = {
    black: A.mat('#26222a', { shadow: '#121016', light: '#4a4452', deep: '#060508' }),
    blackL: A.mat('#34303a', { shadow: '#1a181e', light: '#5e5868', deep: '#08070a' }),
    veil: A.mat('#1c1a22', { shadow: '#0c0b10', light: '#3e3a48', deep: '#040306' }),
    skin: A.mat('#b8aca4', { shadow: '#6e625e', light: '#e2d8d0', deep: '#2a2220' }),
    porcelain: A.mat('#dcd6d0', { shadow: '#948c88', light: '#fbf8f4', deep: '#3a3634' }),
    wax: A.mat('#e2d6be', { shadow: '#a0947a', light: '#fff8e8' }),
    waxB: A.mat('#1e1a1a', { shadow: '#0c0a0a', light: '#4a4040' }),
    heart: A.mat('#9a1e1a', { shadow: '#4a0a08', light: '#ff7050', deep: '#1a0404' }),
    steel: A.mat('#8e8a96', { shadow: '#4a4652', light: '#e0dce8', deep: '#16151a' }),
    gold: A.mat('#a8843e', { shadow: '#5e4820', light: '#ecd08a', deep: '#2a1e0c' }),
    bead: A.mat('#3a2a22', { shadow: '#1c1410', light: '#6e5444' }),
  };
  const BACK = 0.6;
  function solve(pose) {
    const x = pose.extra, r = pose.root;
    H.leg(pose, 'F', [r[0] + (x.fF || 2.6), -1.0], 0); H.leg(pose, 'B', [r[0] + (x.fB || -2.6), -1.0], 0);
    const W = rig.solve(pose);
    H.arm(pose, 'F', [W.uarmF.x + x.hF[0], W.uarmF.y + x.hF[1]], x.haF || 0, x.bF || 1);
    H.arm(pose, 'B', [W.uarmB.x + x.hB[0], W.uarmB.y + x.hB[1]], x.haB || 0, x.bB || 1);
  }
  const pt = (B, t, w) => { const [x, y] = K.along(B, t), [nx, ny] = K.perp(B); return [x + nx * w, y + ny * w]; };
  let seed = 1; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

  // mantilha: do alto do pente às costas e ao chão, com renda rasgada na orla
  function veilBack(ctx, W, x) {
    const Hd = W.head, ca = Math.cos(Hd.a * D2R), sa = Math.sin(Hd.a * D2R), sw = x.sway || 0;
    const top = [Hd.x + ca * 6.2, Hd.y + sa * 6.2], back = pt(W.chest, 0.6, -5.4), hip = pt(W.pelvis, 0.2, -6.4);
    seed = 9; const hem = [];
    for (let i = 0; i <= 8; i++) { const k = i / 8; hem.push([A.lerp(hip[0] - 4 + sw * 1.4, hip[0] + 5, k), -0.4 - (i % 2 ? 1.2 : 0) - rnd() * 0.8]); }
    const path = A.path((q) => {
      q.M(top[0], top[1]); q.Q(top[0] - 6 + sw, top[1] + 4, back[0] - 1.4 + sw * 0.6, back[1]);
      q.Q(hip[0] - 3.6 + sw, hip[1], hem[0][0], hem[0][1]); hem.forEach((p) => q.L(p[0], p[1]));
      q.L(hip[0] + 4, hip[1] + 2); q.L(back[0] + 3, back[1]); q.Z();
    }, S);
    K.paint(ctx, path, M.veil, { depth: S * 0.9, hlw: S * 0.3 });
    ctx.save(); ctx.clip(path);
    for (let i = 0; i < 6; i++) K.line(ctx, [[top[0] - 1 - i * 0.8, top[1] + 2], [hem[0][0] + 1 + i * 1.6 + sw * 0.6, -1]], 0.25, A.rgba('#000000', 0.45));
    ctx.restore();
  }
  // velas fundidas no ombro de trás (as chamas são desenhadas por cima, no overlay)
  function candles(ctx, W, x) {
    const s0 = pt(W.chest, 0.95, -2.0);
    seed = 31;
    const cs = [[-1.6, 0, 4.2], [0.2, -0.6, 5.6], [1.8, 0.2, 3.4]];
    x._flames = [];
    for (const [dx, dy, h] of cs) {
      const bx = s0[0] + dx, by = s0[1] + dy;
      K.poly(ctx, [[bx - 0.55, by], [bx + 0.55, by], [bx + 0.5, by - h], [bx - 0.5, by - h]], M.wax, { depth: S * 0.2, hlw: S * 0.12 });
      K.line(ctx, [[bx + 0.4, by - h + 0.6], [bx + 0.6, by - h + 2.2], [bx + 0.5, by - h + 3]], 0.18, M.wax.light);
      x._flames.push([bx, by - h - 0.2]);
    }
    K.blob(ctx, [[s0[0] - 3, s0[1] + 0.6], [s0[0] - 1, s0[1] - 0.8], [s0[0] + 2.6, s0[1] - 0.4], [s0[0] + 3.2, s0[1] + 1], [s0[0], s0[1] + 1.6]], M.wax, { depth: S * 0.25 });
  }
  // rosário de contas grossas na mão de trás, com uma cruz pesada a pender
  function rosary(ctx, W, x) {
    const Hd = W.handB, h = [Hd.x + Math.cos(Hd.a * D2R) * 1.4, Hd.y + Math.sin(Hd.a * D2R) * 1.4];
    const swing = x.rosary || 0, len = 9 + swing * 6, a0 = (x.rosaryA === undefined ? 90 : x.rosaryA) * D2R;
    const end = [h[0] + Math.cos(a0) * len, h[1] + Math.sin(a0) * len];
    const mid = [(h[0] + end[0]) / 2 - Math.sin(a0) * (1.2 - swing), (h[1] + end[1]) / 2 + Math.cos(a0) * 0.6];
    for (let i = 0; i <= 10; i++) { const k = i / 10, u = 1 - k; const bx = u * u * h[0] + 2 * u * k * mid[0] + k * k * end[0], by = u * u * h[1] + 2 * u * k * mid[1] + k * k * end[1]; K.dot(ctx, bx, by, 0.5, M.bead.shadow); K.dot(ctx, bx - 0.15, by - 0.15, 0.32, M.bead.light); }
    ctx.save(); ctx.translate(end[0] * S, end[1] * S); ctx.rotate(a0 - Math.PI / 2);
    K.poly(ctx, [[-0.5, 0], [0.5, 0], [0.5, 2], [1.8, 2], [1.8, 3], [0.5, 3], [0.5, 6.4], [-0.5, 6.4], [-0.5, 3], [-1.8, 3], [-1.8, 2], [-0.5, 2]], M.gold, { depth: S * 0.2 });
    ctx.restore();
    x._cross = [end[0] + Math.cos(a0) * 4, end[1] + Math.sin(a0) * 4];
  }
  function arm(ctx, W, side, back, x) {
    const U = W['uarm' + side], F = W['farm' + side], Hd = W['hand' + side];
    const dm = (m) => (back ? K.dim(m, BACK) : m);
    // manga negra larga, a abrir no pulso
    K.limb(ctx, [U.x, U.y], [F.x, F.y], [F.ex, F.ey], 2.0, 1.7, 1.9, dm(M.black), { depth: S * 0.5, hlw: S * 0.25 });
    const w = K.along(F, 0.86), d = K.norm(F.ex - F.x, F.ey - F.y), n = [-d[1], d[0]];
    K.poly(ctx, [[w[0] + n[0] * 2.4, w[1] + n[1] * 2.4], [w[0] - n[0] * 2.4, w[1] - n[1] * 2.4], [w[0] - n[0] * 1.2 + d[0] * 2.4, w[1] - n[1] * 1.2 + d[1] * 2.4], [w[0] + n[0] * 1.6 + d[0] * 2.8, w[1] + n[1] * 1.6 + d[1] * 2.8]], dm(M.blackL), { depth: S * 0.3 });
    // mão ossuda de dedos compridos
    ctx.save(); A.boneT(ctx, Hd, S);
    K.blob(ctx, [[-0.6, -1.0], [1.8, -1.1], [2.4, 0], [1.8, 1.0], [-0.6, 1.0]], dm(M.skin), { depth: S * 0.3 });
    const sp = x.spread || 0;
    for (const [a, l] of [[-24, 4.4], [-8, 5.2], [8, 5.0], [24, 4.0]]) {
      const aa = (a * (1 + sp * 0.8)) * D2R, c = Math.cos(aa), s = Math.sin(aa);
      K.tube(ctx, [[1.6, s * 0.6], [1.6 + c * l * 0.55, s * l * 0.5], [1.6 + c * l, s * l * 0.7 + 0.5]], [0.34, 0.28, 0.12], dm(M.skin), { depth: S * 0.15, flat: true });
    }
    K.tube(ctx, [[0.6, -0.9], [1.4, -2.2], [2.6, -2.6]], [0.34, 0.28, 0.14], dm(M.skin), { depth: S * 0.15, flat: true }); // polegar
    ctx.restore();
  }
  // vestido de luto até ao chão, orla rasgada com pingos de cera
  function robe(ctx, W, x) {
    const Pv = W.pelvis, Sp = W.spine, sw = x.sway || 0, wk = x.walk || 0;
    const [px, py] = K.along(Pv, 0.2);
    const top0 = pt(Sp, 0.1, -4.2), top1 = pt(Sp, 0.1, 4.4);
    const hemY = -0.2, L = [px - 6.4 + sw * 0.6, hemY], R = [px + 7.2 + sw * 0.8 + Math.sin(wk * A.TAU) * 0.6, hemY];
    seed = 7; const hem = [];
    for (let i = 0; i <= 11; i++) { const k = i / 11; hem.push([A.lerp(R[0], L[0], k) + (rnd() - 0.5) * 0.6, hemY + (i % 2 ? -1.1 : 0.2)]); }
    const path = A.path((q) => { q.M(top0[0], top0[1]); q.L(top1[0], top1[1]); q.Q(px + 6.4, py + 6, R[0], R[1]); hem.forEach((p) => q.L(p[0], p[1])); q.Q(px - 6.6 + sw * 0.3, py + 6, top0[0], top0[1]); q.Z(); }, S);
    K.paint(ctx, path, M.black, { depth: S * 1.0, hlw: S * 0.35 });
    ctx.save(); ctx.clip(path);
    for (let i = 0; i < 8; i++) { const xx = px - 5 + i * 1.5; K.line(ctx, [[xx, py + 1], [xx + sw * 0.4 + (i - 4) * 0.5, hemY]], 0.32, A.rgba('#000000', 0.5)); }
    ctx.restore();
    for (const dx of [-4.2, -1.0, 2.6, 5.4]) { const bx = px + dx + sw * 0.4; K.tube(ctx, [[bx, hemY - 1.4], [bx + 0.1, hemY + 0.2], [bx, hemY + 1.0]], [0.4, 0.34, 0.16], M.wax, { depth: S * 0.1, flat: true }); }
  }
  // tronco: corpete negro com um coração em brasa trespassado por sete punhais
  function torso(ctx, W, x) {
    const C = W.chest;
    const body = H.torsoPath(W, [['pelvis', 0.3, 3.6, 3.8], ['spine', 0.4, 3.0, 3.2], ['spine', 0.9, 3.4, 3.6], ['chest', 0.45, 4.0, 4.2], ['chest', 0.85, 3.8, 4.0], ['chest', 1.06, 2.0, 2.4]], S);
    K.paint(ctx, body, M.blackL, { depth: S * 0.9, hlw: S * 0.35 });
    ctx.save(); ctx.clip(body); for (let i = 0; i < 5; i++) K.line(ctx, [pt(W.spine, 0.2, -2 + i), pt(C, 0.8, -2 + i * 0.9)], 0.14, A.rgba('#000000', 0.4)); ctx.restore();
    const hc = pt(C, 0.45, 2.2), k = x.heart === undefined ? 1 : x.heart;
    x._heart = hc;
    for (let i = 0; i < 7; i++) {
      const a = (-150 + i * 30) * D2R, c = Math.cos(a), s = Math.sin(a);
      K.tube(ctx, [[hc[0] + c * 0.8, hc[1] + s * 0.8], [hc[0] + c * 5.2, hc[1] + s * 5.2]], [0.2, 0.12], M.steel, { depth: S * 0.1, flat: true });
      K.line(ctx, [[hc[0] + c * 4.6 - s * 0.7, hc[1] + s * 4.6 + c * 0.7], [hc[0] + c * 4.6 + s * 0.7, hc[1] + s * 4.6 - c * 0.7]], 0.22, M.gold.base);
      K.dot(ctx, hc[0] + c * 5.4, hc[1] + s * 5.4, 0.3, M.gold.light);
    }
    const hp = A.path((q) => { q.M(hc[0], hc[1] + 1.8); q.Q(hc[0] - 2.2, hc[1] + 0.2, hc[0] - 1.6, hc[1] - 1.0); q.Q(hc[0] - 0.8, hc[1] - 1.8, hc[0], hc[1] - 0.8); q.Q(hc[0] + 0.8, hc[1] - 1.8, hc[0] + 1.6, hc[1] - 1.0); q.Q(hc[0] + 2.2, hc[1] + 0.2, hc[0], hc[1] + 1.8); q.Z(); }, S);
    K.paint(ctx, hp, M.heart, { depth: S * 0.3, hlw: S * 0.2 });
    ctx.save(); ctx.clip(hp); ctx.fillStyle = A.rgba('#ffb070', 0.3 + k * 0.3); ctx.fillRect((hc[0] - 2) * S, (hc[1] - 2) * S, 2 * S, 2 * S); ctx.restore();
  }
  // cabeça: pente alto debaixo da mantilha e máscara de porcelana rachada (a boca abre-se no grito)
  function head(ctx, W, x) {
    const Hd = W.head, mo = x.mouth || 0;
    ctx.save(); A.boneT(ctx, W.neck, S); K.tube(ctx, [[-0.2, 0], [W.neck.len + 0.4, 0]], [1.0, 0.8], M.skin, { depth: S * 0.3, flat: true }); ctx.restore();
    ctx.save(); A.boneT(ctx, Hd, S); ctx.rotate(Math.PI / 2);
    // pente alto (peineta) e mantilha por cima da cabeça
    K.blob(ctx, [[-2.8, -3.8], [-3.6, -7.4], [-1.6, -10.0], [1.2, -10.4], [3.0, -8.6], [3.2, -5.2], [2.4, -3.6]], M.veil, { depth: S * 0.6, hlw: S * 0.25 });
    for (let i = 0; i < 4; i++) K.line(ctx, [[-2.4 + i * 1.4, -9.2 + Math.abs(i - 1.5) * 0.4], [-2.0 + i * 1.2, -4.6]], 0.14, A.rgba('#5a5262', 0.5));
    // máscara
    const face = K.blob(ctx, [[-1.6, 0.8], [-2.2, -2.2], [-1.2, -4.6], [0.8, -5.0], [2.4, -4.0], [3.0, -2.2], [3.2, -0.6], [2.8, 0.8 + mo * 1.8], [1.4, 1.8 + mo * 2.2], [-0.2, 1.6 + mo * 1.2]], M.porcelain, { depth: S * 0.6, hlw: S * 0.35, light: [0.6, -1] });
    ctx.save(); ctx.clip(face);
    K.line(ctx, [[0.6, -4.8], [1.0, -3.4], [0.6, -2.6], [1.2, -1.4]], 0.12, A.rgba('#2a2220', 0.75)); // racha
    K.line(ctx, [[2.6, -3.6], [2.0, -2.8]], 0.1, A.rgba('#2a2220', 0.6));
    ctx.restore();
    // olhos vazios e lágrimas de cera negra
    for (const [ex, ey] of [[1.6, -2.6]]) { const eo = K.blobPath([[ex - 0.8, ey - 0.3], [ex + 0.8, ey - 0.6], [ex + 0.9, ey + 0.4], [ex - 0.6, ey + 0.5]]); ctx.fillStyle = '#0a0808'; ctx.fill(eo); }
    K.ember(ctx, 1.7, -2.5, 0.26, x.eye === undefined ? 0.7 : x.eye, '#ff4a3a');
    K.tube(ctx, [[1.4, -2.0], [1.5, -0.6], [1.3, 0.8 + mo]], [0.3, 0.26, 0.2], M.waxB, { depth: S * 0.05, flat: true });
    K.tube(ctx, [[2.4, -2.0], [2.6, -1.0], [2.5, 0.2]], [0.24, 0.2, 0.16], M.waxB, { depth: S * 0.05, flat: true });
    // boca: fenda a soluçar, ou aberta até ao queixo no grito
    const mp = K.blobPath([[1.8, 0.2], [2.9, 0.0], [3.0, 0.4 + mo * 2.2], [2.2, 0.6 + mo * 2.6], [1.6, 0.5 + mo * 1.8]]); ctx.fillStyle = '#0a0606'; ctx.fill(mp);
    if (mo > 0.4) { ctx.save(); ctx.clip(mp); ctx.fillStyle = A.rgba('#5a1010', 0.6); ctx.fillRect(1.8 * S, (0.8 + mo) * S, 1.2 * S, 1.2 * S); ctx.restore(); }
    ctx.restore();
  }
  function draw(ctx, W, x) {
    veilBack(ctx, W, x);
    candles(ctx, W, x);
    arm(ctx, W, 'B', true, x);
    rosary(ctx, W, x);
    robe(ctx, W, x);
    torso(ctx, W, x);
    head(ctx, W, x);
    arm(ctx, W, 'F', false, x);
  }
  // chamas das velas e brilho do coração (por cima, sem contorno)
  function overlay(ctx, W, x, t, name, i) {
    for (const [fx, fy] of x._flames || []) {
      const f = Math.sin(i * 2.1 + fx) * 0.25;
      ctx.fillStyle = 'rgba(255,150,60,0.9)'; ctx.beginPath(); ctx.moveTo((fx - 0.5) * S, fy * S); ctx.quadraticCurveTo((fx - 0.6) * S, (fy - 1.2) * S, (fx + f) * S, (fy - 2.4) * S); ctx.quadraticCurveTo((fx + 0.6) * S, (fy - 1.2) * S, (fx + 0.5) * S, fy * S); ctx.fill();
      ctx.fillStyle = '#fff0c0'; ctx.beginPath(); ctx.ellipse(fx * S, (fy - 0.6) * S, 0.25 * S, 0.6 * S, 0, 0, A.TAU); ctx.fill();
      A.glow(ctx, fx * S, (fy - 1) * S, 3 * S, '#ffb050', 0.35);
    }
    if (x._heart) A.glow(ctx, x._heart[0] * S, x._heart[1] * S, (2.6 + (x.heart || 1) * 1.4) * S, '#ff5030', 0.3 + (x.heart || 1) * 0.15);
  }
  function points(W, x) {
    const Hh = W.head, ca = Math.cos(Hh.a * D2R), sa = Math.sin(Hh.a * D2R), Hd = W.handF;
    const at = (u, v) => [Hh.x + ca * -v - sa * u * -1, Hh.y + sa * -v + ca * u * -1];
    return { tip: [Hd.x + Math.cos(Hd.a * D2R) * 5.4, Hd.y + Math.sin(Hd.a * D2R) * 5.4], eye: [Hh.x + ca * 2.5 - sa * 1.7, Hh.y + sa * 2.5 + ca * 1.7],
      mouth: [Hh.x + ca * -0.6 - sa * 2.4, Hh.y + sa * -0.6 + ca * 2.4], heart: x._heart || [0, -20], cross: x._cross || [0, -10], _unused: at(0, 0) };
  }

  const STANCE = { pelvis: 0, spine: 8, chest: 14, neck: 24, head: -6 };
  const RY = -17.6;
  const P = (a, x, root) => A.pose(A.addA(STANCE, a || {}), x, root || [0, RY]);
  const base = (o = {}) => Object.assign({ hF: [4.0, 14.6], haF: 86, hB: [3.0, 13.0], haB: 90, sway: 0, eye: 0.7, mouth: 0, heart: 1, rosary: 0, rosaryA: 90, spread: 0 }, o);
  function anims() {
    const R = {};
    // soluça: os ombros tremem em sacões curtos, cabeça descaída
    R.idle = { n: 10, fps: 9, loop: true, poseFn: (t) => { const s = Math.sin(t * A.TAU), sob = Math.max(0, Math.sin(t * A.TAU * 3)) * 2.2; return P({ spine: s, chest: -sob, neck: sob * 0.6, head: 4 + sob * 1.6 }, base({ sway: s * 0.6, hF: [4.4 + s * 0.3, 14.0 - sob * 0.3], heart: 0.8 + sob * 0.2, mouth: sob * 0.06 }), [s * 0.2, RY + sob * 0.12]); } };
    // arrasta-se: curvada para a frente, o vestido varre o chão
    R.move = { n: 8, fps: 7, loop: true, poseFn: (t) => { const s = Math.sin(t * A.TAU); return P({ spine: 14 + s, chest: 6, neck: 6, head: -2 }, base({ walk: t, sway: -1 + s * 0.5, fF: 2.6 + s * 2.2, fB: -2.6 - s * 2.2, hF: [6.0, 12.0], hB: [1.0, 13.6] }), [0.6, RY + Math.abs(s) * 0.2]); } };
    // GRITO (vermelho): mãos à cara, depois a cabeça cai para trás e grita de braços abertos
    const SC_W = P({ spine: 20, chest: 18, neck: 18, head: 18 }, base({ hF: [5.0, -2.0], haF: -120, hB: [4.0, -1.4], haB: -110, spread: 0.6, mouth: 0.2, heart: 1.2, eye: 0.3 }), [0.6, RY + 1.4]);
    const SC_A = P({ spine: -10, chest: -16, neck: -26, head: -30 }, base({ hF: [10.0, -6.0], haF: -40, hB: [-8.0, -5.0], haB: -150, spread: 1, mouth: 1, heart: 2, eye: 2, sway: 1 }), [-0.6, RY - 0.4]);
    R.atk_scream = { n: 10, fps: 10, phases: [4, 4], keys: [[0, P({}, base())], [0.2, SC_W], [0.38, SC_W], [0.45, SC_A], [0.8, SC_A], [1, P({}, base())]] };
    // LÁGRIMAS DE CERA (sem sinal): ergue a máscara ao alto e sacode a cabeça; a cera chove
    const TE_A = P({ spine: -6, chest: -10, neck: -18, head: -20 }, base({ hF: [7.0, 2.0], haF: -20, hB: [-3.0, 3.0], haB: -160, spread: 0.8, mouth: 0.5, eye: 1.4 }), [0, RY - 0.2]);
    R.atk_tears = { n: 8, fps: 10, phases: [3, 3], keys: [[0, P({}, base())], [0.3, TE_A], [0.5, P({ spine: -6, chest: -8, neck: -10, head: -6 }, base({ hF: [7.0, 2.0], haF: -20, hB: [-3, 3], haB: -160, spread: 0.8, mouth: 0.6, eye: 1.4 }))], [0.7, TE_A], [1, P({}, base())]] };
    // ABRAÇO (branco): recolhe os braços e atira-se em frente para agarrar
    const GR_W = P({ spine: 2, chest: -4, neck: 4 }, base({ hF: [-2.0, 6.0], haF: 120, hB: [-3.0, 7.0], haB: 130, eye: 1.6, mouth: 0.3 }), [-0.8, RY]);
    const GR_A = P({ spine: 24, chest: 16, neck: 2, head: -8 }, base({ hF: [16.0, 2.0], haF: 6, hB: [14.6, 3.0], haB: 10, spread: 1, eye: 2, mouth: 0.6, sway: 1, fF: 5.4, fB: -4 }), [2.4, RY + 0.8]);
    R.atk_grab = { n: 8, fps: 12, phases: [3, 2], keys: [[0, P({}, base())], [0.3, GR_W], [0.38, GR_W], [0.5, GR_A], [0.72, GR_A], [1, P({}, base())]] };
    // ROSÁRIO (sem sinal, baixo): ergue o rosário e varre o chão com a cruz pesada — salta-o
    const RO_W = P({ spine: -4, chest: -8 }, base({ hB: [-4.0, -9.0], haB: -120, rosary: 0.2, rosaryA: -90, eye: 1.2 }), [-0.4, RY]);
    const RO_A = P({ spine: 16, chest: 10 }, base({ hB: [12.0, 8.0], haB: 30, rosary: 1, rosaryA: 10, eye: 1.6, sway: 0.8 }), [1.2, RY + 0.6]);
    R.atk_rosary = { n: 8, fps: 12, phases: [3, 2], keys: [[0, P({}, base())], [0.3, RO_W], [0.4, RO_W], [0.55, RO_A], [0.75, RO_A], [1, P({}, base())]] };
    R.hurt = { n: 3, fps: 12, keys: [[0, P({ spine: -8, chest: -10, neck: -6, head: -14 }, base({ hF: [2.0, 10.0], eye: 1.6, mouth: 0.5, sway: -1 }), [-0.8, RY])], [1, P({}, base())]] };
    // exausta depois do grito duplo: de joelhos, a tossir cera (ponto fraco)
    R.stagger = { n: 6, fps: 6, loop: true, poseFn: (t) => { const s = Math.sin(t * A.TAU); return P({ spine: 30 + s * 3, chest: 20, neck: 16, head: 12 + s * 4 }, base({ hF: [6.0, 16.6], haF: 90, hB: [4.0, 16.6], eye: 0.3, mouth: 0.4 + s * 0.2, heart: 0.5, fF: 4.0, fB: -1.0 }), [0.8, RY + 5.0]); } };
    R.death = { n: 10, fps: 6, keys: [[0, P({ spine: -10, chest: -12, neck: -20, head: -24 }, base({ hF: [10, -6], haF: -40, hB: [-8, -5], haB: -150, spread: 1, mouth: 1, heart: 2, eye: 2 }), [-0.6, RY])],
      [0.5, P({ spine: 30, chest: 20, neck: 16, head: 14 }, base({ hF: [7, 16], hB: [5, 16], eye: 0.5, mouth: 0.6, heart: 0.6, fF: 4, fB: -1 }), [0.8, RY + 5.6])],
      [1, P({ spine: 70, chest: 24, neck: 10, head: 10 }, base({ hF: [12, 6], hB: [11, 7], eye: 0, mouth: 0.2, heart: 0, fF: 5, fB: -1 }), [1.6, RY + 11.4])]] };
    return R;
  }
  A.register('en_b_carpideira', () => A.creature({ name: 'en_b_carpideira', S, unit: 1.75, box: [120, 112], anchor: [54, 100], rig, solve, draw, overlay, points, anims: anims(), post: K.post('#ffb0a0', 0.3, 0.04) }));
  (A.previewCell = A.previewCell || {}).en_b_carpideira = [120, 130];
})(window.ART);
