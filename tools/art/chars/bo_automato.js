// Vesperal — O Autómato do Fole (subchefe das Forjas): colosso de ferro rebitado feito pelos ferreiros, com um
// fole de couro no peito que bombeia (sopra quem estiver à frente), braços de pistão com punhos de malho, duas
// chaminés nos ombros e uma máscara de bronze de santo sereno com os olhos em brasa. Nas costas, a fornalha com
// uma vigia de vidro — o ponto fraco. Exportado a ×1.9 (≈2× a protagonista). → assets/sprites/en_b_automato.png
'use strict';
(function (A) {
  const S = 5, K = A.kit(S), D2R = A.D2R;
  const H = A.humanoid({ pelvis: 3.0, spine: 5.0, chest: 9.4, neck: 0.8, head: 4.8, thigh: 5.8, shin: 5.6, foot: 4.4, uarm: 8.2, farm: 8.8, hand: 3.4, shoulder: 0.9 });
  const rig = H.rig;
  const M = {
    iron: A.mat('#4a4650', { shadow: '#24222a', light: '#8e8a98', deep: '#0e0d12' }),
    ironB: A.mat('#36333c', { shadow: '#1a181e', light: '#625e6c', deep: '#0a090c' }),
    bronze: A.mat('#9a6a36', { shadow: '#54381a', light: '#e0a868', deep: '#24160a' }),
    copper: A.mat('#8a4a2e', { shadow: '#4a2414', light: '#c87a54' }),
    leather: A.mat('#5a3424', { shadow: '#2e1a10', light: '#8a5a42', deep: '#140a06' }),
    wood: A.mat('#5e4430', { shadow: '#32241a', light: '#8e6c4e' }),
    steel: A.mat('#7a7e88', { shadow: '#3e4048', light: '#c8ccd6' }),
  };
  const BACK = 0.62;
  function solve(pose) {
    const x = pose.extra, r = pose.root;
    if (x.fF) H.leg(pose, 'F', [r[0] + x.fF[0], x.fF[1] - 1.2], x.faF || 0);
    if (x.fB) H.leg(pose, 'B', [r[0] + x.fB[0], x.fB[1] - 1.2], x.faB || 0);
    const W = rig.solve(pose);
    H.arm(pose, 'F', [W.uarmF.x + x.hF[0], W.uarmF.y + x.hF[1]], x.haF === undefined ? 0 : x.haF, x.bF || 1);
    H.arm(pose, 'B', [W.uarmB.x + x.hB[0], W.uarmB.y + x.hB[1]], x.haB === undefined ? 0 : x.haB, x.bB || 1);
  }
  const pt = (B, t, w) => { const [x, y] = K.along(B, t), [nx, ny] = K.perp(B); return [x + nx * w, y + ny * w]; };
  const rivets = (c, a, b, n, col) => { for (let i = 0; i < n; i++) { const k = (i + 0.5) / n; K.dot(c, A.lerp(a[0], b[0], k), A.lerp(a[1], b[1], k), 0.32, col || M.iron.light); } };

  // braço: ombreira redonda, braço de ferro, antebraço-pistão (x.pis estende a haste), punho-malho
  function arm(ctx, W, side, back, x) {
    const U = W['uarm' + side], F = W['farm' + side], Hd = W['hand' + side];
    const m = back ? M.ironB : M.iron;
    K.tube(ctx, [[U.x, U.y], [F.x, F.y]], [2.4, 2.1], m, { depth: S * 0.5, hlw: S * 0.25 });
    K.dot(ctx, F.x, F.y, 1.9, back ? M.ironB.shadow : M.iron.shadow);
    // pistão: cilindro grosso + haste polida que se estende no golpe
    const fd = K.norm(F.ex - F.x, F.ey - F.y), L = Math.hypot(F.ex - F.x, F.ey - F.y), pis = x.pis || 0;
    const c1 = [F.x + fd[0] * L * 0.62, F.y + fd[1] * L * 0.62];
    K.tube(ctx, [[F.x, F.y], c1], [2.6, 2.4], back ? K.dim(M.copper, BACK) : M.copper, { depth: S * 0.5, hlw: S * 0.3, flat: true });
    K.bands(ctx, K.tubePath([[F.x, F.y], c1], [2.6, 2.4], false), [F.x, F.y], c1, 2.7, 0.1, 0.95, 3, m);
    K.tube(ctx, [c1, [F.ex + fd[0] * pis * 2.0, F.ey + fd[1] * pis * 2.0]], [1.0, 1.0], back ? K.dim(M.steel, BACK) : M.steel, { depth: S * 0.2, hlw: S * 0.15, flat: true });
    // punho-malho
    ctx.save(); A.boneT(ctx, Hd, S); ctx.translate(pis * 2.0 * S, 0);
    K.poly(ctx, [[-0.6, -2.6], [3.4, -2.8], [4.4, -1.6], [4.4, 1.8], [3.4, 2.8], [-0.6, 2.6]], m, { depth: S * 0.5, hlw: S * 0.3 });
    for (let i = 0; i < 3; i++) K.line(ctx, [[3.4, -1.8 + i * 1.8], [4.6, -1.8 + i * 1.8]], 0.25, m.deep);
    K.line(ctx, [[-0.4, -2.4], [-0.4, 2.4]], 0.4, back ? K.dim(M.bronze, BACK).base : M.bronze.base);
    ctx.restore();
    // ombreira
    const [sx, sy] = K.along(U, 0.04);
    K.blob(ctx, [[sx - 3.2, sy + 0.6], [sx - 2.2, sy - 2.8], [sx + 1.2, sy - 3.4], [sx + 3.4, sy - 1.2], [sx + 3.0, sy + 2.4], [sx - 1.0, sy + 3.0]], m, { depth: S * 0.6, hlw: S * 0.35 });
    rivets(ctx, [sx - 2.4, sy - 1.4], [sx + 2.6, sy - 1.8], 4, back ? M.ironB.light : M.iron.light);
  }
  function leg(ctx, W, side, back) {
    const T = W['thigh' + side], N = W['shin' + side], F = W['foot' + side];
    const m = back ? M.ironB : M.iron;
    K.tube(ctx, [[T.x, T.y], [N.x, N.y]], [2.8, 2.4], m, { depth: S * 0.5, hlw: S * 0.25 });
    K.dot(ctx, N.x, N.y, 2.2, m.shadow); K.dot(ctx, N.x, N.y, 1.0, back ? K.dim(M.bronze, BACK).base : M.bronze.base);
    K.tube(ctx, [[N.x, N.y], [N.ex, N.ey]], [2.6, 2.9], m, { depth: S * 0.5, hlw: S * 0.25, flat: true });
    ctx.save(); A.boneT(ctx, F, S);
    K.poly(ctx, [[-2.2, -2.0], [2.4, -1.8], [5.4, -0.6], [5.8, 1.4], [-2.4, 1.4]], m, { depth: S * 0.5 });
    for (const y of [-0.6, 0.6]) K.poly(ctx, [[5.4, y - 0.4], [7.0, y + 0.2], [5.4, y + 0.6]], M.steel, { depth: S * 0.1 }); // garras
    ctx.restore();
  }
  // tronco: barril de chapas rebitadas; à frente o fole de couro entre duas tábuas (x.bel 0..1 = cheio)
  function torso(ctx, W, x) {
    const Sp = W.spine, C = W.chest;
    const body = H.torsoPath(W, [['pelvis', 0.1, 4.4, 4.2], ['spine', 0.3, 5.0, 4.8], ['chest', 0.1, 6.4, 6.0], ['chest', 0.55, 6.8, 6.4], ['chest', 0.95, 5.6, 5.6], ['chest', 1.08, 3.6, 4.4]], S);
    K.paint(ctx, body, M.iron, { depth: S * 1.2, hlw: S * 0.5 });
    ctx.save(); ctx.clip(body);
    for (const t of [0.2, 0.6]) { const a = pt(C, t, -7), b = pt(C, t, 7); K.line(ctx, [a, b], 0.3, M.iron.deep); rivets(ctx, pt(C, t + 0.04, -6), pt(C, t + 0.04, 6), 7); }
    K.line(ctx, [pt(Sp, 0.5, -6), pt(Sp, 0.5, 6)], 0.3, M.iron.deep);
    // escorrências de ferrugem e fuligem
    for (const [t, w, l, c] of [[0.92, 2.0, 0.5, '#7a3a1a'], [0.7, -3.4, 0.45, '#7a3a1a'], [0.95, -1.0, 0.7, '#0a0808'], [0.5, 4.0, 0.35, '#6a3216']]) {
      const a = pt(C, t, w), b = pt(C, Math.max(0, t - l), w + 0.3);
      ctx.save(); ctx.globalAlpha = 0.45; K.line(ctx, [a, b], 0.6, c); ctx.restore();
    }
    ctx.restore();
    // cinta de bronze
    K.poly(ctx, [pt(Sp, 0.0, -4.6), pt(Sp, 0.0, 4.8), pt(Sp, 0.18, 5.0), pt(Sp, 0.18, -4.8)], M.bronze, { depth: S * 0.3 });
    // fole
    const bel = x.bel === undefined ? 0.5 : x.bel, b0 = pt(C, 0.15, 4.6), b1 = pt(C, 0.85, 4.6), d = K.perp(C);
    const out = 1.6 + bel * 2.8;
    const f0 = [b0[0] + d[0] * out, b0[1] + d[1] * out], f1 = [b1[0] + d[0] * out, b1[1] + d[1] * out];
    const folds = A.path((q) => { q.M(b0[0], b0[1]); const n = 5; for (let i = 0; i <= n; i++) { const k = i / n; const p = [A.lerp(b0[0], f0[0], k), A.lerp(b0[1], f0[1], k)]; const z = i % 2 ? -1.0 : 0; q.L(p[0] - Math.cos(C.a * D2R) * z, p[1] - Math.sin(C.a * D2R) * z); } q.L(f1[0], f1[1]); for (let i = n; i >= 0; i--) { const k = i / n; const p = [A.lerp(b1[0], f1[0], k), A.lerp(b1[1], f1[1], k)]; const z = i % 2 ? 1.0 : 0; q.L(p[0] - Math.cos(C.a * D2R) * z, p[1] - Math.sin(C.a * D2R) * z); } q.Z(); }, S);
    K.paint(ctx, folds, M.leather, { depth: S * 0.6, hlw: S * 0.3 });
    ctx.save(); ctx.clip(folds); for (let i = 1; i < 5; i++) { const k = i / 5; K.line(ctx, [[A.lerp(b0[0], f0[0], k), A.lerp(b0[1], f0[1], k)], [A.lerp(b1[0], f1[0], k), A.lerp(b1[1], f1[1], k)]], 0.25, A.rgba(M.leather.deep, 0.8)); } ctx.restore();
    K.poly(ctx, [[f0[0] - d[0] * 0.2 - Math.cos(C.a * D2R) * 1.0, f0[1] - d[1] * 0.2 - Math.sin(C.a * D2R) * 1.0], [f1[0] - d[0] * 0.2 + Math.cos(C.a * D2R) * 1.0, f1[1] - d[1] * 0.2 + Math.sin(C.a * D2R) * 1.0], [f1[0] + d[0] * 1.2 + Math.cos(C.a * D2R) * 1.0, f1[1] + d[1] * 1.2 + Math.sin(C.a * D2R) * 1.0], [f0[0] + d[0] * 1.2 - Math.cos(C.a * D2R) * 1.0, f0[1] + d[1] * 1.2 - Math.sin(C.a * D2R) * 1.0]], M.wood, { depth: S * 0.3 });
    // bocal do fole
    const nz = [(f0[0] + f1[0]) / 2 + d[0] * 1.2, (f0[1] + f1[1]) / 2 + d[1] * 1.2];
    K.poly(ctx, [[nz[0] - Math.cos(C.a * D2R) * 1.0, nz[1] - Math.sin(C.a * D2R) * 1.0], [nz[0] + d[0] * 2.4 - Math.cos(C.a * D2R) * 0.5, nz[1] + d[1] * 2.4 - Math.sin(C.a * D2R) * 0.5], [nz[0] + d[0] * 2.4 + Math.cos(C.a * D2R) * 0.5, nz[1] + d[1] * 2.4 + Math.sin(C.a * D2R) * 0.5], [nz[0] + Math.cos(C.a * D2R) * 1.0, nz[1] + Math.sin(C.a * D2R) * 1.0]], M.bronze, { depth: S * 0.2 });
    x._nozzle = [nz[0] + d[0] * 2.6, nz[1] + d[1] * 2.6];
  }
  // fornalha nas costas (ponto fraco): caixa de ferro com vigia de vidro e grelha; chaminés nos ombros
  function furnace(ctx, W, x) {
    const C = W.chest, Sp = W.spine, d = K.perp(C);
    const c = pt(C, 0.4, -7.0);
    const box = K.poly(ctx, [pt(C, 0.05, -5.2), pt(C, 0.05, -9.0), pt(C, 0.8, -9.2), pt(C, 0.8, -5.2)], M.ironB, { depth: S * 0.6 });
    void box; void Sp;
    const r = 2.0, port = K.blobPath(Array.from({ length: 10 }, (_, i) => [c[0] + Math.cos(i / 10 * A.TAU) * r, c[1] + Math.sin(i / 10 * A.TAU) * r]));
    ctx.fillStyle = '#ff9a30'; ctx.fill(port); const g = ctx.createRadialGradient(c[0] * S, c[1] * S, 0, c[0] * S, c[1] * S, r * S); g.addColorStop(0, A.rgba('#fff2c0', x.heat === undefined ? 1 : x.heat)); g.addColorStop(1, 'rgba(255,120,30,0.2)'); ctx.fillStyle = g; ctx.fill(port);
    ctx.lineWidth = S * 0.7; ctx.strokeStyle = M.bronze.base; ctx.stroke(port); ctx.lineWidth = S * 0.2; ctx.strokeStyle = '#120c08'; ctx.stroke(port);
    for (let i = -1; i <= 1; i++) K.line(ctx, [[c[0] + i * 0.8 - d[0] * 1.8, c[1] - 1.8], [c[0] + i * 0.8 + d[0] * 1.8, c[1] + 1.8]], 0.15, A.rgba('#3a1a08', 0.6));
    const gr = pt(C, 0.08, -7.2); for (let i = 0; i < 4; i++) K.line(ctx, [[gr[0] - 1.6 + i * 1.0, gr[1] - 0.6], [gr[0] - 1.6 + i * 1.0, gr[1] + 0.6]], 0.3, '#ff6a20');
    x._furnace = c;
    // chaminés
    for (const [t, w, h] of [[0.98, -4.6, 7.0], [0.9, -6.6, 5.4]]) {
      const b0 = pt(C, t, w), up = [Math.cos(C.a * D2R), Math.sin(C.a * D2R)];
      const top = [b0[0] + up[0] * h - d[0] * 1.2, b0[1] + up[1] * h - d[1] * 1.2];
      K.tube(ctx, [b0, top], [1.2, 1.0], M.iron, { depth: S * 0.3, flat: true });
      K.poly(ctx, [[top[0] - 1.6, top[1] - 0.2], [top[0] + 1.6, top[1] - 0.2], [top[0] + 1.2, top[1] + 0.9], [top[0] - 1.2, top[1] + 0.9]], M.bronze, { depth: S * 0.2 });
      x['_pipe' + (h > 6 ? 'A' : 'B')] = [top[0], top[1] - 0.6];
    }
  }
  // cabeça: elmo-cúpula com máscara de bronze de um santo sereno, olhos em brasa
  // coroa-relicário de ferro (auréola de espigões) atrás da cabeça
  function crown(ctx, W, x) {
    const Hd = W.head, c = K.along(Hd, 0.45), R = 5.6;
    ctx.save(); ctx.translate(c[0] * S, c[1] * S);
    const ring = A.path((q) => { q.E(0, 0, R, R); q.E(0, 0, R - 1.0, R - 1.0); }, S);
    ctx.fillStyle = M.ironB.base; ctx.fill(ring, 'evenodd'); ctx.lineWidth = S * 0.25; ctx.strokeStyle = '#0b0910'; ctx.stroke(ring);
    for (let i = 0; i < 9; i++) {
      const a = (-170 + i * 20) * D2R, ca = Math.cos(a), sa = Math.sin(a), L = i % 2 ? 1.8 : 2.8;
      K.poly(ctx, [[ca * (R - 0.4) - sa * 0.5, sa * (R - 0.4) + ca * 0.5], [ca * (R + L), sa * (R + L)], [ca * (R - 0.4) + sa * 0.5, sa * (R - 0.4) - ca * 0.5]], M.ironB, { depth: S * 0.1, hlw: S * 0.1 });
    }
    ctx.restore();
    x._crown = c; void x;
  }
  function head(ctx, W, x) {
    const Hd = W.head;
    ctx.save(); A.boneT(ctx, Hd, S); ctx.rotate(Math.PI / 2);
    K.blob(ctx, [[-3.0, 1.2], [-3.2, -2.4], [-1.6, -4.6], [1.4, -4.8], [3.0, -3.2], [3.2, 0.6], [1.6, 1.6]], M.iron, { depth: S * 0.6, hlw: S * 0.3 });
    const mask = K.blob(ctx, [[0.2, -3.6], [2.4, -3.8], [3.4, -2.6], [3.6, -1.0], [3.0, 0.6], [1.6, 1.2], [0.4, 0.6]], M.bronze, { depth: S * 0.5, hlw: S * 0.3, light: [0.6, -1] });
    ctx.save(); ctx.clip(mask); K.line(ctx, [[2.2, -1.0], [3.4, -1.1]], 0.2, A.rgba(M.bronze.deep, 0.6)); K.line(ctx, [[2.4, 0.0], [3.2, 0.0]], 0.24, A.rgba(M.bronze.deep, 0.8)); ctx.restore();
    const eo = K.blobPath([[1.8, -2.6], [3.2, -2.6], [3.2, -2.0], [1.8, -2.0]]); ctx.fillStyle = '#100806'; ctx.fill(eo);
    K.ember(ctx, 2.6, -2.3, 0.4, x.eye === undefined ? 1 : x.eye, '#ff9a40');
    for (let i = 0; i < 4; i++) K.dot(ctx, -2.4 + i * 1.2, -3.8 + Math.abs(i - 1.5) * 0.3, 0.3, M.iron.light);
    ctx.restore();
  }
  function draw(ctx, W, x) {
    crown(ctx, W, x);
    furnace(ctx, W, x);
    arm(ctx, W, 'B', true, x);
    leg(ctx, W, 'B', true);
    torso(ctx, W, x);
    leg(ctx, W, 'F', false);
    head(ctx, W, x);
    arm(ctx, W, 'F', false, x);
  }
  function overlay(ctx, W, x) {
    const c = x._furnace, k = x.heat === undefined ? 1 : x.heat; if (!c) return;
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; A.glow(ctx, c[0] * S, c[1] * S, 5.5 * S, '#ff8a30', 0.35 * k); A.glow(ctx, c[0] * S, c[1] * S, 1.6 * S, '#fff2c0', 0.6 * k); ctx.restore();
  }
  function points(W, x) {
    const Hh = W.head, ca = Math.cos(Hh.a * D2R), sa = Math.sin(Hh.a * D2R);
    const fist = (s) => { const Hd = W['hand' + s], p = x.pis || 0; return [Hd.x + Math.cos(Hd.a * D2R) * (3 + p * 2), Hd.y + Math.sin(Hd.a * D2R) * (3 + p * 2)]; };
    return { tip: fist('F'), fistB: fist('B'), eye: [Hh.x + ca * 2.3 - sa * 2.6, Hh.y + sa * 2.3 + ca * 2.6], light: x._furnace, back: x._furnace, nozzle: x._nozzle, pipeA: x._pipeA, pipeB: x._pipeB };
  }

  // ---------------------------------------------------------------- poses
  const STANCE = { pelvis: 0, spine: 8, chest: 16, neck: 26, head: -40 };
  const RY = -10.4;
  const P = (a, x, root) => A.pose(A.addA(STANCE, a || {}), x, root || [0, RY]);
  const base = (o = {}) => Object.assign({ fF: [4.6, 0], fB: [-4.4, 0], hF: [5.0, 14.4], haF: 80, hB: [3.4, 14.8], haB: 80, bel: 0.5, pis: 0, heat: 1, eye: 1 }, o);
  function anims() {
    const R = {};
    R.idle = { n: 6, fps: 5, loop: true, poseFn: (t) => { const s = Math.sin(t * A.TAU); return P({ spine: s * 0.8, chest: s * 0.8 }, base({ bel: 0.5 + s * 0.4, hF: [5.0, 14.4 + s * 0.4], hB: [3.4, 14.8 + s * 0.4], heat: 0.85 + s * 0.15 }), [0, RY + s * 0.2]); } };
    R.move = { n: 8, fps: 6, loop: true, stride: 14, poseFn: (t) => { const f = A.stepFeet(t, { stride: 4.4, lift: 2.2 }); const s = Math.sin(t * A.TAU), c = Math.cos(t * A.TAU); return P({ spine: c * 1.5, chest: s * 1.5 }, base({ fF: f.F, fB: f.B, faF: f.F[1] < 0 ? 12 : 0, faB: f.B[1] < 0 ? 12 : 0, hF: [5.4 + c * 2.2, 14.0], hB: [2.8 - c * 2.2, 14.4], bel: 0.5 + c * 0.3 }), [0.2, RY + Math.abs(s) * 0.9]); } };
    // SOCO DE PISTÃO (branco): recolhe o braço e dispara o pistão à frente
    const PW = P({ spine: -6, chest: -8 }, base({ hF: [-6.0, 7.0], haF: 10, hB: [5.0, 10.0], fF: [5.0, 0], fB: [-5.0, 0], bel: 0.9, eye: 1.6 }), [-1.0, RY + 0.4]);
    const PA = P({ spine: 12, chest: 6 }, base({ hF: [15.6, 4.0], haF: 10, hB: [0.4, 12.0], fF: [6.4, 0], fB: [-5.0, 0], pis: 1, bel: 0.2, eye: 1.8 }), [1.6, RY + 0.8]);
    R.atk_punch = { n: 8, fps: 12, phases: [3, 2], keys: [[0, P({}, base())], [0.3, PW], [0.4, PW], [0.52, PA], [0.7, PA], [1, P({}, base())]] };
    // ESMAGAR (vermelho, com armadura): ergue os dois punhos e bate no chão à frente (ondas de choque)
    const CU = P({ spine: -10, chest: -12, head: -8 }, base({ hF: [1.8, -12.0], haF: -90, hB: [-0.6, -12.4], haB: -90, fF: [5.2, 0], fB: [-5.0, 0], bel: 1, eye: 2, heat: 1.3 }), [-0.6, RY + 0.6]);
    const CD = P({ spine: 30, chest: 18, neck: -6 }, base({ hF: [11.0, 15.4], haF: 90, hB: [9.0, 15.8], haB: 90, fF: [6.8, 0], fB: [-5.6, 0], faB: 30, bel: 0, eye: 2, heat: 1.3 }), [2.4, RY + 3.4]);
    R.atk_crush = { n: 10, fps: 10, phases: [5, 2], keys: [[0, P({}, base())], [0.25, P({ spine: -4 }, base({ hF: [4, -4], haF: -60, hB: [2, -4], haB: -60, bel: 0.8 }))], [0.42, CU], [0.48, CU], [0.6, CD], [0.8, CD], [1, P({}, base())]] };
    // FOLE (sem sinal): enche o fole (inclina-se para trás) e sopra à frente, a empurrar
    const BI = P({ spine: -8, chest: -8, head: -6 }, base({ hF: [1.0, 8.0], hB: [-1.0, 8.0], bel: 1, eye: 1.4 }), [-0.8, RY + 0.4]);
    const BO = P({ spine: 10, chest: 8 }, base({ hF: [7.0, 4.0], haF: 20, hB: [5.0, 4.6], haB: 20, bel: 0, fF: [5.6, 0], fB: [-5.4, 0], eye: 1.6 }), [1.0, RY + 0.6]);
    R.atk_bellows = { n: 8, fps: 8, phases: [3, 3], keys: [[0, P({}, base())], [0.3, BI], [0.4, BI], [0.55, BO], [0.66, P({ spine: 8, chest: 6 }, base({ hF: [7.0, 4.4], haF: 20, hB: [5.0, 5.0], haB: 20, bel: 0.3, fF: [5.6, 0], fB: [-5.4, 0] }), [1.0, RY + 0.6])], [0.78, BO], [1, P({}, base())]] };
    // RESPIRADOUROS (sem sinal): planta-se, abre os braços e as chaminés rugem; o fogo sobe do chão
    const VW = P({ spine: -12, chest: -10, head: -14 }, base({ hF: [7.0, -2.0], haF: -30, hB: [-6.0, -2.0], haB: -150, fF: [6.0, 0], fB: [-6.0, 0], bel: 1, heat: 1.5, eye: 2 }), [0, RY + 1.6]);
    R.atk_vents = { n: 8, fps: 8, phases: [3, 3], keys: [[0, P({}, base())], [0.3, VW], [0.5, P({ spine: -10, chest: -8, head: -12 }, base({ hF: [7.4, -2.6], haF: -30, hB: [-6.4, -2.6], haB: -150, fF: [6.0, 0], fB: [-6.0, 0], bel: 0.6, heat: 1.6, eye: 2 }), [0, RY + 1.4])], [0.75, VW], [1, P({}, base())]] };
    R.hurt = { n: 3, fps: 12, keys: [[0, P({ spine: -8, chest: -8, head: -8 }, base({ hF: [3.0, 7.0], hB: [1.0, 7.4], bel: 0.9, eye: 2 }), [-1.0, RY])], [1, P({}, base())]] };
    R.stagger = { n: 4, fps: 6, loop: true, poseFn: (t) => { const s = Math.sin(t * A.TAU); return P({ spine: 20 + s * 2, chest: 12, neck: 16, head: 10 }, base({ hF: [7.0, 13.0], haF: 90, hB: [5.0, 13.4], haB: 90, fF: [5.0, 0], fB: [-4.6, 0], faB: 50, bel: 0.2, eye: 0.4 + Math.abs(s) * 0.6, heat: 0.6 }), [0.4, RY + 4.6]); } };
    R.death = { n: 10, fps: 7, keys: [[0, P({ spine: -12, chest: -10, head: -14 }, base({ hF: [4, -2], hB: [-2, -2], bel: 1, eye: 2, heat: 1.6 }), [-1, RY])], [0.4, P({ spine: 20, chest: 14, neck: 16, head: 10 }, base({ hF: [7.0, 13.0], haF: 90, hB: [5.0, 13.4], haB: 90, fF: [5.0, 0], fB: [-4.6, 0], faB: 50, bel: 0.2, eye: 0.6, heat: 0.8 }), [0.4, RY + 4.6])], [1, P({ spine: 60, chest: 20, neck: 10, head: 4 }, base({ hF: [11.0, 8.0], haF: 40, hB: [9.0, 9.0], haB: 40, fF: [6.0, 0], fB: [-3.0, 0], faB: 60, bel: 0, eye: 0, heat: 0.15 }), [1.6, RY + 7.6])]] };
    return R;
  }
  A.register('en_b_automato', () => A.creature({ name: 'en_b_automato', S, unit: 1.9, box: [100, 76], anchor: [48, 68], rig, solve, draw, overlay, points, anims: anims(), post: K.post('#ffb080', 0.28, 0.04) }));
  (A.previewCell = A.previewCell || {}).en_b_automato = [110, 110];
})(window.ART);
