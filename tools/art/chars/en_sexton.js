// Vesperal — Sacristão (sexton): alto e curvado, batina negra e sobrepeliz rota, molho de chaves à cinta.
// Arma: um apagador de velas comprido com uma lanterna pendurada no gancho — varre (aparável) e esmaga (esquivar).
'use strict';
(function (A) {
  const S = 4, K = A.kit(S), D2R = A.D2R;
  const H = A.humanoid({ spine: 5.2, chest: 5.0, neck: 1.7, head: 4.2, thigh: 7.0, shin: 7.2, foot: 2.7, uarm: 5.6, farm: 5.3, hand: 1.8 });
  const rig = H.rig;
  const M = {
    cassock: A.mat('#26222a', { shadow: '#141217', light: '#433d4a', deep: '#0b0a0d' }),
    surplice: A.mat('#a49c8c', { shadow: '#665f53', light: '#d2c9b6' }),
    skin: A.mat('#9b9087', { shadow: '#5b524c', light: '#cbbfb2', deep: '#2d2623' }),
    brass: A.mat('#8a6a34', { shadow: '#4e3a1a', light: '#d8b468', deep: '#2a1e0c' }),
    wood: A.mat('#4a3424', { shadow: '#2a1d14', light: '#7a5a40' }),
    iron: A.mat('#4c4852', { shadow: '#26232a', light: '#8a8492' }),
    hair: '#8f8a86',
  };
  const BACK = 0.66;

  function solve(pose) {
    const x = pose.extra, r = pose.root;
    if (x.fF) H.leg(pose, 'F', [r[0] + x.fF[0], x.fF[1] - 0.85], x.faF || 0);
    if (x.fB) H.leg(pose, 'B', [r[0] + x.fB[0], x.fB[1] - 0.85], x.faB || 0);
    const W = rig.solve(pose);
    // as duas mãos no cabo do apagador: x.g = pega da mão da frente (relativa ao ombro), x.wa = ângulo do cabo
    const g = [W.uarmF.x + x.g[0], W.uarmF.y + x.g[1]], d = [Math.cos(x.wa * D2R), Math.sin(x.wa * D2R)];
    x._g = g; x._d = d;
    H.arm(pose, 'F', g, x.wa + 90, x.bF || 1);
    const W2 = rig.solve(pose);
    const gb = [g[0] - d[0] * 4.2, g[1] - d[1] * 4.2];
    H.arm(pose, 'B', [gb[0], gb[1]], x.wa + 90, x.bB || 1);
    x._gb = gb;
  }
  // apagador: cabo de madeira, virola, cone de latão e gancho com a lanterna
  function snuffer(ctx, x) {
    const g = x._g, d = x._d, n = [-d[1], d[0]];
    const at = (t, w = 0) => [g[0] + d[0] * t + n[0] * w, g[1] + d[1] * t + n[1] * w];
    K.tube(ctx, [at(-8.5), at(0), at(13.5)], [0.42, 0.4, 0.36], M.wood, { depth: S * 0.25, hlw: S * 0.12, flat: true });
    K.poly(ctx, [at(13.0, -0.5), at(14.4, -0.45), at(14.4, 0.45), at(13.0, 0.5)], M.brass, { depth: S * 0.2 });
    // ponta: haste curva de latão que segura um pequeno sino-apagador de boca para baixo (perpendicular ao cabo)
    const tipP = at(16.2), dn = [-n[0], -n[1]].map((v) => -v); // "baixo" do cabo = lado +n
    const arm0 = at(14.4), arm1 = at(16.0, 0.2), arm2 = at(16.8, 1.0);
    K.line(ctx, [arm0, arm1, arm2], 0.36, M.brass.shadow);
    K.line(ctx, [arm0, arm1, arm2], 0.16, M.brass.light);
    const b0 = at(16.0, 1.0), bl = (t, w) => [b0[0] + n[0] * t + d[0] * w, b0[1] + n[1] * t + d[1] * w];
    const bell = A.path((q) => { const p0 = bl(0, -0.45), p1 = bl(0.2, -0.8), p2 = bl(2.0, -1.35), p3 = bl(2.0, 1.35), p4 = bl(0.2, 0.8), p5 = bl(0, 0.45); q.M(p0[0], p0[1]); q.Q(p1[0], p1[1], p2[0], p2[1]); q.L(p3[0], p3[1]); q.Q(p4[0], p4[1], p5[0], p5[1]); q.Z(); }, S);
    K.paint(ctx, bell, M.brass, { depth: S * 0.35, hlw: S * 0.2 });
    const bm = A.path((q) => q.E(bl(2.0, 0)[0], bl(2.0, 0)[1], 1.35, 0.3, Math.atan2(d[1], d[0])), S);
    ctx.fillStyle = '#120c06'; ctx.fill(bm);
    // espeto para acender (por cima)
    K.line(ctx, [at(14.4, -0.3), at(17.4, -0.9)], 0.18, M.iron.base);
    void tipP; void dn;
    // gancho e corrente
    const hk = at(13.4, 0.6);
    K.line(ctx, [at(14.2, 0.4), hk, [hk[0] + 0.5, hk[1] + 0.5]], 0.22, M.iron.shadow);
    const sw = (x.lsw || 0) * D2R, lx = hk[0] + Math.sin(sw) * 3.2, ly = hk[1] + Math.cos(sw) * 3.2;
    for (let i = 1; i <= 4; i++) K.dot(ctx, A.lerp(hk[0], lx, i / 4.5), A.lerp(hk[1], ly, i / 4.5), 0.2, M.iron.light);
    x._lantern = [lx, ly + 1.8];
    lantern(ctx, lx, ly, sw);
  }
  function lantern(ctx, lx, ly, sw) {
    ctx.save(); ctx.translate(lx * S, ly * S); ctx.rotate(sw * 0.6);
    K.poly(ctx, [[-1.1, 0], [1.1, 0], [0.7, -0.6], [-0.7, -0.6]], M.iron, { depth: S * 0.15 });
    const glass = K.polyPath([[-1.2, 0.2], [1.2, 0.2], [1.3, 3.2], [-1.3, 3.2]]);
    ctx.fillStyle = '#f2b04a'; ctx.fill(glass);
    const gg = ctx.createRadialGradient(0, 1.8 * S, 0, 0, 1.8 * S, 1.6 * S); gg.addColorStop(0, '#fff6d6'); gg.addColorStop(1, 'rgba(255,170,60,0)');
    ctx.fillStyle = gg; ctx.fill(glass);
    ctx.strokeStyle = M.iron.deep || '#151318'; ctx.lineWidth = S * 0.22;
    ctx.beginPath(); ctx.moveTo(0, 0.2 * S); ctx.lineTo(0, 3.2 * S); ctx.stroke(); ctx.stroke(glass);
    K.poly(ctx, [[-1.5, 3.1], [1.5, 3.1], [1.2, 3.8], [-1.2, 3.8]], M.iron, { depth: S * 0.15 });
    ctx.restore();
  }
  function arm(ctx, W, side, back) {
    const U = W['uarm' + side], F = W['farm' + side], Hd = W['hand' + side];
    const m = back ? K.dim(M.cassock, BACK) : M.cassock;
    K.limb(ctx, [U.x, U.y], [F.x, F.y], [F.ex, F.ey], 1.15, 1.0, 0.95, m, { depth: S * 0.5 });
    // punho da sobrepeliz (renda rota)
    const cx = A.lerp(F.x, F.ex, 0.82), cy = A.lerp(F.y, F.ey, 0.82), [nx, ny] = K.perp(F);
    const cuff = K.blobPath([[cx + nx * 1.4, cy + ny * 1.4], [F.ex + nx * 1.6 + 0.3, F.ey + ny * 1.6 + 0.6], [F.ex - nx * 1.5 + 0.3, F.ey - ny * 1.5 + 0.6], [cx - nx * 1.3, cy - ny * 1.3]]);
    K.paint(ctx, cuff, back ? K.dim(M.surplice, BACK) : M.surplice, { depth: S * 0.3 });
    ctx.save(); A.boneT(ctx, Hd, S);
    K.blob(ctx, [[-0.3, -0.75], [1.0, -0.8], [1.8, -0.2], [1.6, 0.6], [0.2, 0.8], [-0.4, 0.4]], back ? K.dim(M.skin, BACK) : M.skin, { depth: S * 0.3 });
    K.line(ctx, [[0.8, -0.7], [1.4, 0.55]], 0.12, A.rgba('#000', 0.45));
    ctx.restore();
  }
  // batina: dos ombros aos tornozelos, a bainha acompanha os pés; sobrepeliz curta por cima
  function robe(ctx, W, x) {
    const C = W.chest, Sp = W.spine, P = W.pelvis;
    const [sx, sy] = K.along(C, 0.95), [cnx, cny] = K.perp(C);
    const fF = [W.footF.x, W.footF.y], fB = [W.footB.x, W.footB.y];
    const kF = [W.shinF.x, W.shinF.y], kB = [W.shinB.x, W.shinB.y];
    const front = Math.max(fF[0], fB[0], kF[0], kB[0]) + 1.6, back = Math.min(fF[0], fB[0], kF[0], kB[0]) - 1.8;
    const hemY = Math.max(fF[1], fB[1]) - 1.2;
    const sw = x.sway || 0;
    const path = A.path((q) => {
      q.M(sx - cnx * 2.6, sy - cny * 2.6);
      q.Q(sx + cnx * 0.5, sy + cny * 0.5 - 0.5, sx + cnx * 2.7, sy + cny * 2.7);
      const [px, py] = K.along(Sp, 0.3), [snx, sny] = K.perp(Sp);
      q.Q(px + snx * 2.6, py + sny * 2.6, front - 0.6, (py + hemY) / 2);
      q.Q(front + 0.4 + sw * 0.3, hemY - 2.0, front + sw * 0.5, hemY);
      const n = 5; for (let i = 1; i <= n; i++) { const t = i / n; q.L(A.lerp(front + sw * 0.5, back + sw * 0.8, t), hemY + (i % 2 ? 0.45 : 0) - Math.sin(t * Math.PI) * 0.5); }
      q.Q(back - 0.8 + sw * 0.6, (py + hemY) / 2 + 2, px - snx * 2.8, py - sny * 2.8);
      q.Q(sx - cnx * 3.4, (sy + py) / 2, sx - cnx * 2.6, sy - cny * 2.6); q.Z();
    }, S);
    K.paint(ctx, path, M.cassock, { depth: S * 1.1, hlw: S * 0.45 });
    ctx.save(); ctx.clip(path);
    // pregas fundas (vincos verticais) e botões
    for (let i = 0; i < 4; i++) { const t = (i + 0.5) / 4, bx = A.lerp(back + 1, front - 1, t); K.line(ctx, [[bx + (i - 1.5) * 0.4, (P.y + hemY) / 2 - 2], [bx + sw * 0.4, hemY]], 0.34, A.rgba(M.cassock.deep, 0.75)); }
    for (let i = 0; i < 6; i++) { const [bx, by] = K.along(i < 3 ? C : Sp, 0.85 - (i % 3) * 0.3); K.dot(ctx, bx + K.perp(C)[0] * 2.4, by + K.perp(C)[1] * 2.4, 0.18, '#6a1c24'); }
    ctx.restore();
    // sobrepeliz curta (renda) sobre o peito, rota na bainha
    const [p2x, p2y] = K.along(Sp, 0.55);
    const r = A.rng(17), lace = [];
    for (let i = 0; i <= 6; i++) { const t = i / 6; lace.push([A.lerp(p2x + 3.0, p2x - 3.2, t), p2y + 0.6 + (i % 2 ? 1.1 : 0) + r() * 0.5]); }
    const sp = A.path((q) => { q.M(sx - cnx * 2.4, sy - cny * 2.4); q.Q(sx, sy - 0.6, sx + cnx * 2.6, sy + cny * 2.6); q.Q(p2x + 3.4, p2y - 2, lace[0][0], lace[0][1]); for (const l of lace) q.L(l[0], l[1]); q.Q(p2x - 3.8, p2y - 2, sx - cnx * 2.4, sy - cny * 2.4); q.Z(); }, S);
    K.paint(ctx, sp, M.surplice, { depth: S * 0.6, hlw: S * 0.3 });
    ctx.save(); ctx.clip(sp);
    for (let i = 0; i < 5; i++) K.line(ctx, [[sx + (i - 2) * 1.1, sy + 0.4], [lace[i + 1][0], lace[i + 1][1] - 0.8]], 0.16, A.rgba(M.surplice.shadow, 0.7));
    ctx.restore();
    // cinto, molho de chaves
    const [bx, by] = K.along(Sp, 0.05), [snx, sny] = K.perp(Sp);
    K.line(ctx, [[bx - snx * 2.8, by - sny * 2.8], [bx + snx * 2.7, by + sny * 2.7]], 0.55, '#151217');
    const ring = [bx + snx * 1.2, by + sny * 1.2 + 0.8];
    ctx.strokeStyle = M.iron.light; ctx.lineWidth = S * 0.16; ctx.beginPath(); ctx.arc(ring[0] * S, ring[1] * S, 0.6 * S, 0, A.TAU); ctx.stroke();
    for (let i = 0; i < 3; i++) { const a = (90 + (i - 1) * 25 + (x.sway || 0) * 12) * D2R; const k0 = [ring[0] + Math.cos(a) * 0.6, ring[1] + Math.sin(a) * 0.6], k1 = [ring[0] + Math.cos(a) * 2.4, ring[1] + Math.sin(a) * 2.4]; K.line(ctx, [k0, k1], 0.2, i === 1 ? M.brass.light : M.iron.light); K.dot(ctx, k1[0], k1[1], 0.28, i === 1 ? M.brass.base : M.iron.base); }
  }
  function feet(ctx, W, side, back) {
    const F = W['foot' + side];
    ctx.save(); A.boneT(ctx, F, S);
    K.blob(ctx, [[-0.8, -0.8], [1.4, -0.7], [2.8, -0.1], [2.7, 0.6], [-0.9, 0.7]], back ? K.dim(M.cassock, BACK) : A.mat('#1c1719', { shadow: '#0e0b0d', light: '#3a3236' }), { depth: S * 0.3 });
    ctx.restore();
  }
  // cabeça comprida e pálida, nariz adunco, olhos fundos com um brilho de vela, solidéu e cabelo ralo comprido
  function head(ctx, W, x) {
    const Hd = W.head;
    ctx.save(); A.boneT(ctx, W.neck, S);
    K.tube(ctx, [[-0.3, 0], [W.neck.len + 0.4, 0]], [0.9, 0.75], M.skin, { depth: S * 0.3, flat: true });
    ctx.restore();
    ctx.save(); A.boneT(ctx, Hd, S); ctx.rotate(Math.PI / 2);
    for (let i = 0; i < 5; i++) A.stroke(ctx, [[-1.2 + i * 0.3, -2.6], [-1.9 + i * 0.25 + (x.sway || 0) * 0.3, 1.6 + i * 0.4]], S * 0.2, M.hair, S); // cabelo ralo atrás
    const sk = K.blob(ctx, [[-1.6, -0.4], [-1.6, -2.8], [-0.4, -4.1], [1.2, -4.0], [2.0, -3.0], [2.2, -2.1], [2.0, -1.7], [3.0, -0.6], [2.2, -0.4], [2.2, 0.4], [1.6, 1.4], [0.6, 1.8], [-0.6, 1.0]], M.skin, { depth: S * 0.6, hlw: S * 0.35, light: [0.6, -1] });
    ctx.save(); ctx.clip(sk);
    K.line(ctx, [[0.4, 0.4], [1.6, 0.8]], 0.3, A.rgba(M.skin.deep, 0.5)); // ruga da boca
    K.line(ctx, [[0.9, -2.5], [2.0, -2.3]], 0.42, A.rgba(M.skin.deep, 0.55)); // sobrolho
    K.line(ctx, [[1.8, 0.95], [2.2, 0.75]], 0.22, '#3a2228'); // boca fina
    ctx.restore();
    const eo = K.blobPath([[1.0, -2.0], [1.85, -2.1], [1.95, -1.5], [1.3, -1.35]]);
    ctx.fillStyle = '#0e0a0c'; ctx.fill(eo);
    K.ember(ctx, 1.5, -1.72, 0.24, x.eye === undefined ? 0.8 : x.eye, '#ffcf80');
    // solidéu negro
    const cap = K.blobPath([[-1.6, -2.9], [-0.6, -4.25], [1.1, -4.2], [1.6, -3.4], [0.2, -3.2]]);
    K.paint(ctx, cap, M.cassock, { depth: S * 0.3, hlw: S * 0.2 });
    ctx.restore();
  }
  function draw(ctx, W, x) {
    arm(ctx, W, 'B', true);
    feet(ctx, W, 'B', true);
    robe(ctx, W, x);
    feet(ctx, W, 'F', false);
    head(ctx, W, x);
    snuffer(ctx, x);
    arm(ctx, W, 'F', false);
  }
  function points(W, x) {
    const g = x._g, d = x._d;
    const Hh = W.head, ca = Math.cos(Hh.a * D2R), sa = Math.sin(Hh.a * D2R);
    return { tip: [g[0] + d[0] * 16.5 - d[1] * 2, g[1] + d[1] * 16.5 + d[0] * 2], light: x._lantern, eye: [Hh.x + ca * 1.72 - sa * 1.5, Hh.y + sa * 1.72 + ca * 1.5] };
  }

  // ---------------------------------------------------------------- poses
  const BEND = { pelvis: 0, spine: 10, chest: 16, neck: 22, head: -30 };
  const P = (a, x, root) => A.pose(A.addA(BEND, a || {}), x, root || [0, -14.0]);
  const base = (o = {}) => Object.assign({ fF: [2.4, 0], fB: [-2.0, 0], g: [3.6, 6.4], wa: -20, lsw: 0, sway: 0 }, o);
  function anims() {
    const R = {};
    R.idle = {
      n: 6, fps: 6, loop: true,
      keys: [[0, P({}, base({ lsw: -8 }))], [0.5, P({ spine: 2, chest: 2, neck: 3 }, base({ g: [3.6, 6.7], wa: -18, lsw: 8, sway: 0.4 }), [0, -13.8])], [1, P({}, base({ lsw: -8 }))]],
    };
    R.move = {
      n: 8, fps: 8, loop: true, stride: 14,
      poseFn: (t) => {
        const f = A.stepFeet(t, { stride: 3.8, lift: 1.6 });
        const s = Math.sin(t * A.TAU), c = Math.cos(t * A.TAU);
        return P({ spine: 2 + c * 1.5, chest: 1, head: -s * 3 }, base({ fF: f.F, fB: f.B, faF: f.F[1] < 0 ? 14 : 0, faB: f.B[1] < 0 ? 14 : 0, g: [3.8 + c * 0.6, 6.2 + s * 0.3], wa: -22 + c * 3, lsw: -c * 14, sway: -c }), [0.2, -14.0 + Math.abs(s) * 0.35]);
      },
    };
    // varrida (sinal branco): recolhe o apagador para trás e varre rente, a lanterna a balouçar
    const SWW = P({ spine: -4, chest: -8, neck: 6, head: -20 }, base({ g: [-4.6, 3.4], wa: -164, lsw: 30, fF: [3.0, 0], fB: [-2.8, 0], sway: 0.6, bF: -1 }), [-0.6, -14.0]);
    const SWA = P({ spine: 18, chest: 14 }, base({ g: [6.6, 6.2], wa: 6, lsw: -50, fF: [4.0, 0], fB: [-3.2, 0], sway: -0.8 }), [1.0, -13.4]);
    const SWB = P({ spine: 20, chest: 16 }, base({ g: [5.6, 5.0], wa: -12, lsw: -70, fF: [4.0, 0], fB: [-3.2, 0], sway: -1 }), [1.2, -13.4]);
    R.atk_sweep = {
      n: 8, fps: 13, phases: [3, 2],
      keys: [[0, P({}, base())], [0.3, SWW], [0.4, P({ spine: 2, chest: -2 }, base({ g: [-2.6, 4.4], wa: -150, lsw: 36, fF: [3.0, 0], fB: [-2.8, 0], bF: -1 }), [-0.4, -14.0])], [0.55, SWA], [0.7, SWB], [1, P({}, base({ lsw: -20 }))]],
    };
    // esmagamento (sinal vermelho): ergue o apagador a pique sobre a cabeça e fá-lo cair no chão
    const SLW = P({ spine: -10, chest: -14, neck: 4, head: -14 }, base({ g: [0.6, -8.6], wa: -100, lsw: 6, fF: [2.8, 0], fB: [-2.6, 0], bF: -1 }), [-0.4, -14.2]);
    const SLA = P({ spine: 30, chest: 22, neck: 8 }, base({ g: [6.0, 8.6], wa: 26, lsw: -30, fF: [4.6, 0], fB: [-3.6, 0], sway: -1.2 }), [1.6, -12.4]);
    R.atk_slam = {
      n: 9, fps: 12, phases: [4, 2],
      keys: [[0, P({}, base())], [0.2, P({ spine: -4, chest: -6 }, base({ g: [1.4, -3.4], wa: -70, lsw: 10 }))], [0.42, SLW], [0.6, SLA], [0.75, P({ spine: 32, chest: 24, neck: 10 }, base({ g: [6.2, 9.4], wa: 30, lsw: 20, fF: [4.6, 0], fB: [-3.6, 0] }), [1.6, -12.2])], [1, P({ spine: 12 }, base({ lsw: -6 }))]],
    };
    R.hurt = { n: 3, fps: 14, keys: [[0, P({ spine: -12, chest: -12, neck: -6, head: 6 }, base({ g: [2.2, 5.0], wa: -40, lsw: 30, sway: 0.8 }), [-0.6, -14.2])], [1, P({}, base())]] };
    R.stagger = {
      n: 4, fps: 7, loop: true,
      keys: [[0, P({ spine: 22, chest: 18, neck: 24, head: 4 }, base({ g: [4.6, 9.4], wa: 60, lsw: 14, sway: 0.5 }), [0, -13.4])], [0.5, P({ spine: 24, chest: 22, neck: 30, head: 10 }, base({ g: [4.8, 9.8], wa: 66, lsw: -14, sway: -0.5 }), [0.2, -13.2])], [1, P({ spine: 22, chest: 18, neck: 24, head: 4 }, base({ g: [4.6, 9.4], wa: 60, lsw: 14, sway: 0.5 }), [0, -13.4])]],
    };
    R.death = {
      n: 7, fps: 10,
      keys: [[0, P({ spine: -14, chest: -12, neck: -8 }, base({ g: [2, 4], wa: -60, lsw: 40, eye: 1.4 }), [-0.6, -14.2])], [0.4, P({ spine: 28, chest: 20, neck: 20 }, base({ g: [5, 9], wa: 80, lsw: 10, fF: [3.6, 0], fB: [-1.6, 0], eye: 0.6 }), [0.6, -9.0])], [1, P({ spine: 80, chest: 10, neck: 10 }, base({ g: [7, 4], wa: 6, lsw: 0, fF: [4.0, 0], fB: [-1.8, 0], eye: 0 }), [1.2, -5.0])]],
    };
    return R;
  }
  A.register('en_sexton', () => A.creature({ name: 'en_sexton', S, box: [64, 56], anchor: [26, 52], rig, solve, draw, points, anims: anims(), post: K.post('#a39ab8', 0.3, 0.04) }));
  (A.previewCell = A.previewCell || {}).en_sexton = [56, 54];
})(window.ART);
