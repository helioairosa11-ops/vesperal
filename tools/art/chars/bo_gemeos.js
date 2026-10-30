// Vesperal — Os Gémeos da Guarda (subchefes do Paço): dois irmãos em armadura de placas enegrecida com filetes de
// ouro, elmos fechados iguais (fenda em cruz a arder), tabardo carmim com as duas torres do Paço.
//   • a Lâmina (gemeo_a): esguio, espada longa numa mão, rápido; pluma azul-pálida
//   • o Malho (gemeo_b): enorme, malho de guerra a duas mãos; pluma carmim
// Ponto fraco: o malho não distingue irmãos — se a Lâmina estiver no caminho leva com a martelada.
// Exportados a ×1.75. → assets/sprites/en_b_gemeo_a.png, en_b_gemeo_b.png
'use strict';
(function (A) {
  const S = 5, K = A.kit(S), D2R = A.D2R;
  const BACK = 0.6;
  const pt = (B, t, w) => { const [x, y] = K.along(B, t), [nx, ny] = K.perp(B); return [x + nx * w, y + ny * w]; };

  function make(kind) {
    const big = kind === 'b';
    const H = A.humanoid(big
      ? { pelvis: 3.0, spine: 5.8, chest: 7.0, neck: 1.6, head: 4.8, thigh: 8.2, shin: 7.6, foot: 3.6, uarm: 7.2, farm: 6.8, hand: 2.6, shoulder: 0.8 }
      : { pelvis: 2.6, spine: 5.8, chest: 6.2, neck: 1.6, head: 4.4, thigh: 8.4, shin: 8.0, foot: 3.2, uarm: 6.6, farm: 6.4, hand: 2.2, shoulder: 0.8 });
    const rig = H.rig;
    const M = {
      steel: A.mat('#3e3e48', { shadow: '#1e1e24', light: '#8a8a9a', deep: '#0a0a0e' }),
      steelL: A.mat('#5a5a66', { shadow: '#2c2c34', light: '#b4b4c4' }),
      gold: A.mat('#b0904a', { shadow: '#6a5024', light: '#f0d49a' }),
      tabard: A.mat('#6a141a', { shadow: '#360609', light: '#9a3030', deep: '#140203' }),
      mail: A.mat('#4a4a52', { shadow: '#24242a', light: '#7a7a86' }),
      leather: A.mat('#3a2618', { shadow: '#1c120a', light: '#5e422c' }),
      plume: big ? A.mat('#a01e22', { shadow: '#5a0a0e', light: '#e04a40' }) : A.mat('#a8c4e0', { shadow: '#5a7490', light: '#eaf4ff' }),
      wood: A.mat('#4e3822', { shadow: '#281a0e', light: '#7a5a3c' }),
      blade: A.mat('#a8acb8', { shadow: '#5c606c', light: '#f2f4ff', deep: '#202228' }),
    };
    const glow = big ? '#ff8a30' : '#9ac8ff';
    const HAM = { tip: 15.6, gap: 6.6, minGap: 3.2 };
    const W0 = big ? 1.25 : 1; // espessura das placas

    function solve(pose) {
      const x = pose.extra, r = pose.root;
      if (x.fF) H.leg(pose, 'F', [r[0] + x.fF[0], x.fF[1] - 1.2], x.faF || 0);
      if (x.fB) H.leg(pose, 'B', [r[0] + x.fB[0], x.fB[1] - 1.2], x.faB || 0);
      if (big) { A.twoHand(H, pose, x, HAM); return; }
      const W = rig.solve(pose);
      H.arm(pose, 'F', [W.uarmF.x + x.hF[0], W.uarmF.y + x.hF[1]], x.sa, x.bF || 1);
      H.arm(pose, 'B', [W.uarmB.x + x.hB[0], W.uarmB.y + x.hB[1]], x.haB || 60, x.bB || 1);
    }
    // ---------- armadura
    function leg(ctx, W, side, back) {
      const T = W['thigh' + side], N = W['shin' + side], F = W['foot' + side];
      const dm = (m) => (back ? K.dim(m, BACK) : m);
      K.limb(ctx, [T.x, T.y], [N.x, N.y], [N.ex, N.ey], 2.3 * W0, 1.8 * W0, 1.5 * W0, dm(M.steel), { depth: S * 0.6, hlw: S * 0.3 });
      // joelheira com aba
      const kn = [N.x, N.y]; K.blob(ctx, [[kn[0] - 1.5 * W0, kn[1] - 0.2], [kn[0], kn[1] - 1.6 * W0], [kn[0] + 1.7 * W0, kn[1]], [kn[0], kn[1] + 1.5 * W0]], dm(M.steelL), { depth: S * 0.3 });
      K.dot(ctx, kn[0] + 0.2, kn[1], 0.35, dm(M.gold).base);
      // lâminas da coxa
      for (const t of [0.35, 0.65]) K.line(ctx, [pt(T, t, 2.1 * W0), pt(T, t, -2.1 * W0)], 0.2, A.rgba('#000000', 0.45));
      ctx.save(); A.boneT(ctx, F, S); // solerete articulado
      K.blob(ctx, [[-1.6 * W0, -1.6 * W0], [2.0, -1.4 * W0], [4.0 * W0, -0.4], [4.0 * W0, 1.2], [-1.7 * W0, 1.2]], dm(M.steel), { depth: S * 0.4 });
      for (const u of [0.8, 2.0, 3.0]) K.line(ctx, [[u * W0, -1.2 * W0], [u * W0 + 0.3, 1.1]], 0.18, A.rgba('#000000', 0.5));
      K.line(ctx, [[-1.7, 1.15], [4.0 * W0, 1.1]], 0.45, '#0a0a0c');
      ctx.restore();
    }
    function arm(ctx, W, side, back) {
      const U = W['uarm' + side], F = W['farm' + side], Hd = W['hand' + side];
      const dm = (m) => (back ? K.dim(m, BACK) : m);
      K.limb(ctx, [U.x, U.y], [F.x, F.y], [F.ex, F.ey], 1.9 * W0, 1.7 * W0, 1.5 * W0, dm(M.steel), { depth: S * 0.5, hlw: S * 0.25 });
      const el = [F.x, F.y]; K.blob(ctx, [[el[0] - 1.3 * W0, el[1]], [el[0], el[1] - 1.4 * W0], [el[0] + 1.4 * W0, el[1]], [el[0], el[1] + 1.3 * W0]], dm(M.steelL), { depth: S * 0.25 });
      // manopla
      ctx.save(); A.boneT(ctx, Hd, S);
      K.blob(ctx, [[-1.0, -1.5 * W0], [2.0 * W0, -1.5 * W0], [2.8 * W0, -0.3], [2.2 * W0, 1.3 * W0], [-1.0, 1.3 * W0]], dm(M.steel), { depth: S * 0.35 });
      K.poly(ctx, [[-1.4, -1.8 * W0], [0.4, -1.8 * W0], [0.4, 1.6 * W0], [-1.4, 1.6 * W0]], dm(M.steelL), { depth: S * 0.15 });
      ctx.restore();
      // ombreira de lâminas sobrepostas
      const sh = K.along(U, 0.05), d = K.norm(Math.cos(U.a * D2R), Math.sin(U.a * D2R)), n = [-d[1], d[0]];
      const L = big ? 5.2 : 4.2;
      for (let i = 2; i >= 0; i--) {
        const o = i * 1.2 * W0;
        K.blob(ctx, [[sh[0] - n[0] * L * 0.8 + d[0] * (o - 0.6), sh[1] - n[1] * L * 0.8 + d[1] * (o - 0.6)], [sh[0] + d[0] * (o - 2.0) , sh[1] + d[1] * (o - 2.0) - 0.6], [sh[0] + n[0] * L * 0.8 + d[0] * (o - 0.6), sh[1] + n[1] * L * 0.8 + d[1] * (o - 0.6)], [sh[0] + d[0] * (o + 1.6), sh[1] + d[1] * (o + 1.6)]], dm(i === 0 ? M.steelL : M.steel), { depth: S * 0.35, hlw: S * 0.18 });
      }
      K.line(ctx, [[sh[0] - n[0] * L * 0.7 - d[0] * 0.4, sh[1] - n[1] * L * 0.7 - d[1] * 0.4], [sh[0] + n[0] * L * 0.7 - d[0] * 0.4, sh[1] + n[1] * L * 0.7 - d[1] * 0.4]], 0.3, dm(M.gold).base);
      if (big) for (const k of [-0.5, 0.5]) { const b = [sh[0] + n[0] * L * k - d[0] * 1.6, sh[1] + n[1] * L * k - d[1] * 1.6 - 0.4]; K.poly(ctx, [[b[0] - 0.6, b[1]], [b[0] + 0.6, b[1]], [b[0], b[1] - 2.2]], dm(M.steelL), { depth: 0 }); } // espigões
    }
    function torso(ctx, W, x) {
      const Sp = W.spine, C = W.chest, Pv = W.pelvis, sw = x.sway || 0;
      const [px, py] = K.along(Pv, 0.2);
      const k = W0;
      // saia de malha
      const mail = A.path((q) => { const a = pt(Sp, 0.1, -3.6 * k), b = pt(Sp, 0.1, 3.8 * k); q.M(a[0], a[1]); q.L(b[0], b[1]); q.L(px + 4.0 * k, py + 7.0); q.L(px - 3.8 * k, py + 7.2); q.Z(); }, S);
      K.paint(ctx, mail, M.mail, { depth: S * 0.5 });
      ctx.save(); ctx.clip(mail); for (let i = 0; i < 6; i++) K.line(ctx, [[px - 4 * k, py + 1 + i * 1.1], [px + 4 * k, py + 1 + i * 1.1]], 0.12, A.rgba('#000000', 0.35)); ctx.restore();
      // peitoral com aresta central
      const body = H.torsoPath(W, [['pelvis', 0.3, 3.4 * k, 3.4 * k], ['spine', 0.3, 3.2 * k, 3.4 * k], ['spine', 0.9, 3.8 * k, 3.8 * k], ['chest', 0.45, 4.4 * k, 4.2 * k], ['chest', 0.9, 3.8 * k, 3.8 * k], ['chest', 1.06, 2.4 * k, 2.8 * k]], S);
      K.paint(ctx, body, M.steel, { depth: S * 1.0, hlw: S * 0.45 });
      ctx.save(); ctx.clip(body);
      K.line(ctx, [pt(C, 1.0, 3.0 * k), pt(C, 0.4, 4.0 * k), pt(Sp, 0.6, 3.6 * k)], 0.35, A.rgba(M.steel.light, 0.5));
      for (const t of [0.2, 0.55]) K.line(ctx, [pt(Sp, t, -3.4 * k), pt(Sp, t, 3.6 * k)], 0.24, A.rgba('#000000', 0.5)); // lâminas do fauld
      ctx.restore();
      // tabardo carmim com orla e as duas torres
      const t0 = pt(C, 0.95, -0.4), t1 = pt(C, 0.95, 3.0 * k);
      const tab = A.path((q) => { q.M(t0[0], t0[1]); q.L(t1[0], t1[1]); q.L(px + 4.2 * k + sw * 0.5, py + 10.4); q.L(px + 1.6 * k + sw * 0.5, py + 11.2); q.L(px - 0.8 + sw * 0.5, py + 10.4); q.Z(); }, S);
      K.paint(ctx, tab, M.tabard, { depth: S * 0.6, hlw: S * 0.25 });
      ctx.save(); ctx.lineWidth = S * 0.3; ctx.strokeStyle = M.gold.base; ctx.stroke(tab); ctx.restore();
      const e = pt(Sp, 0.95, 1.6 * k);
      for (const dx of [-0.9, 0.9]) { K.poly(ctx, [[e[0] + dx - 0.55, e[1] + 1.4], [e[0] + dx + 0.55, e[1] + 1.4], [e[0] + dx + 0.55, e[1] - 1.0], [e[0] + dx, e[1] - 1.8], [e[0] + dx - 0.55, e[1] - 1.0]], M.gold, { depth: 0, hlw: S * 0.08 }); }
      // cinto
      K.line(ctx, [pt(Sp, 0.05, -3.6 * k), pt(Sp, 0.05, 3.8 * k)], 0.8, '#1a120c');
      const bk = pt(Sp, 0.05, 2.4 * k); K.poly(ctx, [[bk[0] - 0.8, bk[1] - 0.7], [bk[0] + 0.8, bk[1] - 0.7], [bk[0] + 0.8, bk[1] + 0.7], [bk[0] - 0.8, bk[1] + 0.7]], M.gold, { depth: 0 });
    }
    function head(ctx, W, x) {
      const Hd = W.head, sw = x.sway || 0, k = big ? 1.15 : 1;
      ctx.save(); A.boneT(ctx, Hd, S); ctx.rotate(Math.PI / 2); ctx.scale(k, k);
      // pluma
      const pl = A.path((q) => { q.M(-0.6, -5.4); q.Q(-3.0, -8.4 + sw * 0.3, -6.6 + sw, -6.0); q.Q(-7.4 + sw * 1.4, -3.4, -6.0 + sw * 1.6, -0.6); q.Q(-4.6, -4.0, -1.2, -4.6); q.Z(); }, S);
      K.paint(ctx, pl, M.plume, { depth: S * 0.35 });
      ctx.save(); ctx.clip(pl); for (let i = 0; i < 4; i++) K.line(ctx, [[-1, -5], [-5.4 + i * 0.4 + sw, -5.6 + i * 1.4]], 0.14, A.rgba(M.plume.shadow, 0.7)); ctx.restore();
      // grande elmo de copa achatada
      const helm = K.polyPath([[-2.6, 1.6], [-2.8, -3.4], [-2.0, -5.4], [1.6, -5.6], [3.2, -4.6], [3.4, -0.4], [2.8, 1.8]]);
      K.paint(ctx, helm, M.steel, { depth: S * 0.6, hlw: S * 0.3 });
      K.line(ctx, [[0.4, -5.6], [0.6, 1.8]], 0.25, A.rgba(M.steel.light, 0.4));
      K.line(ctx, [[-2.8, -1.2], [3.4, -1.4]], 0.35, M.gold.base); // filete
      // fenda em cruz que arde por dentro
      const sl = A.path((q) => { q.M(1.2, -3.2); q.L(3.4, -3.3); q.L(3.4, -2.6); q.L(2.6, -2.6); q.L(2.6, 0.4); q.L(2.0, 0.4); q.L(2.0, -2.6); q.L(1.2, -2.6); q.Z(); }, S);
      ctx.fillStyle = '#0a0406'; ctx.fill(sl);
      K.ember(ctx, 2.6, -2.9, 0.34, x.eye === undefined ? 1 : x.eye, glow);
      for (const [hx, hy] of [[1.2, -0.6], [1.2, 0.4], [0.4, 0]]) K.dot(ctx, hx, hy, 0.18, '#0a0406');
      // gorjal
      K.blob(ctx, [[-2.2, 1.2], [2.6, 1.4], [2.8, 3.0], [-2.4, 3.0]], M.steelL, { depth: S * 0.25 });
      ctx.restore();
    }
    // ---------- armas
    function sword(ctx, W, x) {
      const Hd = W.handF, g = [Hd.ex - Math.cos(Hd.a * D2R) * 0.4, Hd.ey - Math.sin(Hd.a * D2R) * 0.4], a = x.sa * D2R, d = [Math.cos(a), Math.sin(a)], n = [-d[1], d[0]];
      const at = (u, w = 0) => [g[0] + d[0] * u + n[0] * w, g[1] + d[1] * u + n[1] * w];
      K.tube(ctx, [at(-2.6), at(1.4)], [0.5, 0.5], M.leather, { flat: true, depth: S * 0.1 }); // punho
      K.blob(ctx, [at(-3.4, -0.7), at(-2.6, -0.8), at(-2.6, 0.8), at(-3.4, 0.7)], M.gold, { depth: 0 }); // pomo
      K.poly(ctx, [at(1.4, -2.6), at(2.2, -2.6), at(2.2, 2.6), at(1.4, 2.6)], M.gold, { depth: S * 0.1 }); // guarda
      // lâmina longa e estreita (a Lâmina vive do alcance)
      const BL = 22.0;
      const bl = K.polyPath([at(2.2, -0.75), at(BL - 1.8, -0.48), at(BL, 0), at(BL - 1.8, 0.48), at(2.2, 0.75)]);
      K.paint(ctx, bl, M.blade, { depth: S * 0.25, hlw: S * 0.12 });
      K.line(ctx, [at(2.6), at(BL - 3.0)], 0.14, A.rgba('#40444e', 0.8)); // goteira
      K.line(ctx, [at(2.8, -0.42), at(BL - 1.4, -0.26)], 0.1, A.rgba('#ffffff', 0.6)); // fio
      x._tip = at(BL); x._grip = g;
    }
    function maul(ctx, x) {
      const g = x._g, d = x._d, n = [-d[1], d[0]];
      const at = (t, w = 0) => [g[0] + d[0] * t + n[0] * w, g[1] + d[1] * t + n[1] * w];
      K.tube(ctx, [at(-8.0), at(2), at(13.0)], [0.85, 0.8, 0.78], M.wood, { depth: S * 0.3, flat: true });
      for (const t of [-6.4, -4.4, 10.4, 12.0]) K.poly(ctx, [at(t - 0.4, -1.0), at(t + 0.4, -1.0), at(t + 0.4, 1.0), at(t - 0.4, 1.0)], M.steel, { depth: 0 });
      const head = K.polyPath([at(12.2, -3.4), at(13.0, -5.2), at(16.4, -5.2), at(17.2, -3.4), at(17.2, 4.4), at(16.4, 5.4), at(13.0, 5.4), at(12.2, 4.4)]);
      K.paint(ctx, head, M.steel, { depth: S * 0.7, hlw: S * 0.35 });
      ctx.save(); ctx.clip(head); K.line(ctx, [at(12.4, -1.6), at(17.0, -1.6)], 0.3, M.gold.base); K.line(ctx, [at(12.4, 2.6), at(17.0, 2.6)], 0.3, M.gold.base); ctx.restore();
      K.poly(ctx, [at(17.2, -1.0), at(19.4, 0), at(17.2, 1.0)], M.steelL, { depth: 0 }); // ponta
      x._tip = at(14.8, 5.4); x._head = at(14.8, 0);
    }
    function draw(ctx, W, x) {
      arm(ctx, W, 'B', true);
      leg(ctx, W, 'B', true);
      torso(ctx, W, x);
      leg(ctx, W, 'F', false);
      head(ctx, W, x);
      if (big) maul(ctx, x); else sword(ctx, W, x);
      arm(ctx, W, 'F', false);
    }
    function points(W, x) {
      const Hh = W.head, ca = Math.cos(Hh.a * D2R), sa = Math.sin(Hh.a * D2R), k = big ? 1.15 : 1;
      const o = { tip: x._tip, grip: x._grip || x._g, eye: [Hh.x + (ca * 2.9 - sa * 2.6) * k, Hh.y + (sa * 2.9 + ca * 2.6) * k], light: x._head };
      for (const q in o) if (!o[q]) delete o[q];
      return o;
    }

    const STANCE = big ? { pelvis: 0, spine: 4, chest: 4, neck: 8, head: -12 } : { pelvis: 0, spine: 0, chest: -2, neck: 6, head: -8 };
    const RY = big ? -15.0 : -15.6;
    const P = (a, x, root) => A.pose(A.addA(STANCE, a || {}), x, root || [0, RY]);
    const R = {};
    if (!big) {
      const base = (o = {}) => Object.assign({ fF: [4.4, 0], fB: [-4.0, 0], hF: [4.6, 5.0], sa: -42, hB: [-0.4, 7.4], haB: 70, sway: 0, eye: 1 }, o);
      R.idle = { n: 6, fps: 6, loop: true, poseFn: (t) => { const s = Math.sin(t * A.TAU); return P({ spine: s * 0.8 }, base({ hF: [4.6, 5.0 + s * 0.3], sa: -42 + s * 2, sway: s * 0.5 }), [0, RY - s * 0.2]); } };
      R.move = { n: 8, fps: 10, loop: true, stride: 18, poseFn: (t) => { const f = A.stepFeet(t, { stride: 5.0, lift: 2.0 }); const s = Math.sin(t * A.TAU), c = Math.cos(t * A.TAU); return P({ spine: 6 + c, chest: s }, base({ fF: f.F, fB: f.B, faF: f.F[1] < 0 ? 10 : 0, faB: f.B[1] < 0 ? 10 : 0, hF: [5.0, 6.0], sa: -20, sway: -c }), [0.6, RY + Math.abs(s) * 0.7]); } };
      // CORTE (branco): espada levada ao ombro de trás e talho horizontal à frente
      const C_W = P({ spine: -4, chest: -14, head: -6 }, base({ hF: [-2.0, 1.0], sa: -170, bF: -1, fF: [5.0, 0] }), [-1.0, RY + 0.6]);
      const C_A = P({ spine: 12, chest: 14, head: -10 }, base({ hF: [8.0, 4.4], sa: 4, fF: [6.4, 0], fB: [-4.6, 0], eye: 1.6, sway: 1 }), [2.4, RY + 1.6]);
      const C_R = P({ spine: 10, chest: 18 }, base({ hF: [5.6, 7.6], sa: 30, fF: [6.4, 0], fB: [-4.6, 0] }), [2.2, RY + 1.6]);
      R.atk_cut = { n: 9, fps: 12, phases: [4, 2], keys: [[0, P({}, base())], [0.3, C_W], [0.42, C_W], [0.55, C_A], [0.7, C_R], [1, P({}, base())]] };
      // REVÉS (branco): de baixo para cima no sentido contrário
      const R_W = P({ spine: 8, chest: 14 }, base({ hF: [5.0, 8.4], sa: 60, fF: [5.4, 0] }), [1.4, RY + 1.4]);
      const R_A = P({ spine: -4, chest: -6, head: -12 }, base({ hF: [6.4, -2.4], sa: -70, fF: [6.0, 0], eye: 1.6, sway: -1 }), [2.0, RY + 0.4]);
      R.atk_cut2 = { n: 8, fps: 12, phases: [3, 2], keys: [[0, C_R], [0.35, R_W], [0.55, R_A], [0.8, R_A], [1, P({}, base())]] };
      // ESTOCADA (branco): recua o braço e lança-se numa estocada longa
      const D_W = P({ spine: -6, chest: -10, head: -4 }, base({ hF: [-2.4, 4.4], sa: 0, bF: -1, fF: [4.0, 0], fB: [-6.0, 0] }), [-2.0, RY + 1.6]);
      const D_A = P({ spine: 22, chest: 8, neck: -4, head: -14 }, base({ hF: [9.6, 2.4], sa: 4, fF: [8.0, 0], fB: [-7.0, 0], eye: 1.8, sway: 1.4 }), [3.4, RY + 3.0]);
      R.atk_dash = { n: 9, fps: 10, phases: [4, 2], keys: [[0, P({}, base())], [0.35, D_W], [0.45, D_W], [0.55, D_A], [0.75, D_A], [1, P({}, base())]] };
      R.hurt = { n: 3, fps: 12, keys: [[0, P({ spine: -12, chest: -10, neck: -6, head: -8 }, base({ hF: [3.0, 6.0], sa: -10, sway: -1, eye: 1.8 }), [-1.4, RY])], [1, P({}, base())]] };
      R.stagger = { n: 4, fps: 6, loop: true, poseFn: (t) => { const s = Math.sin(t * A.TAU); return P({ spine: 20 + s * 2, chest: 12, neck: 14, head: 2 + s * 3 }, base({ fF: [5.0, 0], fB: [-4.0, 0], hF: [3.6, 11.0], sa: 80, hB: [2.0, 9.0], eye: 0.4, sway: s }), [0.6, RY + 4.4]); } };
      R.death = { n: 9, fps: 6, keys: [[0, P({ spine: -12, chest: -10, neck: -8, head: -12 }, base({ hF: [2.0, 3.0], sa: -30, eye: 2 }), [-1.0, RY])],
        [0.45, P({ spine: 22, chest: 14, neck: 12 }, base({ fF: [5.0, 0], fB: [-3.2, 0], hF: [4.0, 11.0], sa: 86, hB: [2.6, 10.0], eye: 0.8 }), [0.6, RY + 7.4])],
        [1, P({ spine: 64, chest: 16, neck: 12, head: 6 }, base({ fF: [5.4, 0], fB: [-2.0, 0], faB: 60, hF: [6.0, 9.0], sa: 6, hB: [5.0, 9.4], eye: 0 }), [1.8, RY + 11.6])]] };
    } else {
      const base = (o = {}) => Object.assign({ fF: [5.6, 0], fB: [-5.0, 0], g: [6.6, 11.4], wa: 54, tgK: 0.9, tgY: -3.6, gap: 6.4, sway: 0, eye: 1 }, o);
      R.idle = { n: 6, fps: 5, loop: true, keys: [[0, P({}, base())], [0.5, P({ spine: 1.5, chest: 2 }, base({ g: [6.0, 10.8], sway: 0.5 }), [0, RY + 0.3])], [1, P({}, base())]] };
      R.move = { n: 8, fps: 8, loop: true, stride: 16, poseFn: (t) => { const f = A.stepFeet(t, { stride: 4.8, lift: 1.8 }); const s = Math.sin(t * A.TAU), c = Math.cos(t * A.TAU); return P({ spine: 5 + c * 1.5, chest: s * 1.5 }, base({ fF: f.F, fB: f.B, faF: f.F[1] < 0 ? 10 : 0, faB: f.B[1] < 0 ? 10 : 0, g: [6.4, 9.4 + s * 0.5], wa: 46, tgK: 0, sway: -c }), [0.4, RY + Math.abs(s) * 0.7]); } };
      // MARTELADA (vermelho, imparável): ergue o malho bem alto e esmaga o chão (onda de choque)
      const LIFT = P({ spine: -2, chest: -2 }, base({ g: [4.2, 3.0], wa: -30, tgK: 0 }), [-0.4, RY]);
      const COCK = P({ spine: -10, chest: -12, neck: 2, head: -8 }, base({ g: [-2.6, -8.0], wa: -170, tgK: 0, fF: [6.0, 0], fB: [-5.6, 0], eye: 1.6 }), [-1.6, RY + 0.8]);
      const TOP = P({ spine: -6, chest: -6, head: -10 }, base({ g: [2.4, -12.8], wa: -94, tgK: 0, fF: [6.4, 0], fB: [-5.6, 0], eye: 1.7 }), [-0.2, RY + 0.2]);
      const HIT = P({ spine: 16, chest: 8, neck: 4, head: -12 }, base({ g: [11.0, 9.8], wa: 40, tgK: 1, tgY: -4.0, gap: 6, fF: [7.2, 0], fB: [-6.2, 0], eye: 2, sway: 1 }), [2.6, RY + 3.2]);
      const HOLD = P({ spine: 16, chest: 10, neck: 6, head: -14 }, base({ g: [10.6, 10.2], wa: 40, tgK: 1, tgY: -4.0, gap: 6, fF: [7.2, 0], fB: [-6.2, 0], eye: 1.2 }), [2.2, RY + 3.4]);
      R.atk_maul = { n: 12, fps: 10, phases: [5, 2], keys: [[0, P({}, base())], [0.1, LIFT], [0.22, COCK], [0.32, COCK], [0.4, TOP], [0.5, HIT], [0.7, HOLD], [1, P({}, base())]] };
      // VARRIDA (branco)
      const SW_W = P({ spine: -6, chest: -12, neck: 4, head: -14 }, base({ g: [-6.6, 8.0], wa: 196, tgK: 0, fF: [6.2, 0], fB: [-5.6, 0] }), [-1.6, RY + 0.8]);
      const SW_M = P({ spine: 6, chest: 4 }, base({ g: [3.0, 12.0], wa: 100, tgK: 1, tgY: -2.0, fF: [6.4, 0], fB: [-5.6, 0] }), [0.4, RY + 1.8]);
      const SW_A = P({ spine: 12, chest: 6, neck: 2 }, base({ g: [11.2, 6.0], wa: 16, tgK: 0, fF: [7.2, 0], fB: [-6.0, 0], eye: 1.6 }), [2.2, RY + 2.2]);
      const SW_F = P({ spine: 6, chest: -2, head: -14 }, base({ g: [8.6, -2.4], wa: -50, tgK: 0, fF: [7.2, 0], fB: [-6.0, 0] }), [1.6, RY + 1.4]);
      R.atk_sweep = { n: 10, fps: 12, phases: [4, 2], keys: [[0, P({}, base())], [0.3, SW_W], [0.38, SW_W], [0.46, SW_M], [0.56, SW_A], [0.72, SW_F], [1, P({}, base())]] };
      R.hurt = { n: 3, fps: 12, keys: [[0, P({ spine: -10, chest: -8, neck: -4, head: -12 }, base({ g: [4.6, 8.6], wa: 64, tgK: 0.5, eye: 1.8 }), [-1.2, RY])], [1, P({}, base())]] };
      R.stagger = { n: 4, fps: 6, loop: true, poseFn: (t) => { const s = Math.sin(t * A.TAU); return P({ spine: 16 + s * 2, chest: 12, neck: 14, head: -2 + s * 4 }, base({ g: [7.6, 6.0], wa: 88, tgK: 1, tgY: -0.6, gap: 5, fF: [6.0, 0], fB: [-4.8, 0], faB: 40, eye: 0.5, sway: s }), [0.8, RY + 4.4]); } };
      R.death = { n: 9, fps: 6, keys: [[0, P({ spine: -12, chest: -10, neck: -6, head: -18 }, base({ g: [5.0, 4.0], wa: 80, tgK: 1, tgY: -0.8, eye: 2 }), [-0.8, RY])],
        [0.45, P({ spine: 14, chest: 10, neck: 10 }, base({ g: [7.6, 2.0], wa: 88, tgK: 1, tgY: -0.8, gap: 5, fF: [6.0, -0.2], fB: [-4.0, 0], faB: 60, eye: 1.0 }), [0.8, RY + 6.4])],
        [1, P({ spine: 60, chest: 16, neck: 10, head: -4 }, base({ g: [10.0, 2.0], wa: 14, tgK: 0, fF: [6.4, 0], fB: [-3.0, 0], faB: 70, eye: 0 }), [2.4, RY + 9.6])]] };
    }
    return { rig, solve, draw, points, R, post: K.post(big ? '#ffb080' : '#a8c8ff', 0.28, 0.04) };
  }
  const GA = make('a'), GB = make('b');
  A.register('en_b_gemeo_a', () => A.creature({ name: 'en_b_gemeo_a', S, unit: 1.75, box: [96, 88], anchor: [40, 80], rig: GA.rig, solve: GA.solve, draw: GA.draw, points: GA.points, anims: GA.R, post: GA.post }));
  A.register('en_b_gemeo_b', () => A.creature({ name: 'en_b_gemeo_b', S, unit: 1.75, box: [120, 96], anchor: [54, 86], rig: GB.rig, solve: GB.solve, draw: GB.draw, points: GB.points, anims: GB.R, post: GB.post }));
  (A.previewCell = A.previewCell || {}).en_b_gemeo_a = [110, 110];
  A.previewCell.en_b_gemeo_b = [130, 130];
})(window.ART);
