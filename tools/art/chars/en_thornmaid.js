// Vesperal — Espinheira (thornmaid): jardineira do claustro de hábito verde-musgo, toucado de linho, raízes no lugar
// dos pés. Das costas cresce uma roseira-brava cujas rosas abrem quando alguém se aproxima. Chicote de silva
// comprido (aparável) e espinhos que rebentam do chão à volta dela (esquivar). → assets/sprites/en_thornmaid.png
'use strict';
(function (A) {
  const S = 4, K = A.kit(S), D2R = A.D2R;
  const H = A.humanoid({ spine: 4.8, chest: 4.4, neck: 1.3, head: 3.9, thigh: 6.4, shin: 6.2, foot: 2.4, uarm: 4.8, farm: 4.6, hand: 1.6 });
  const rig = H.rig;
  const M = {
    habit: A.mat('#3e4632', { shadow: '#222818', light: '#5e6a4a', deep: '#10140c' }),
    wimple: A.mat('#b8b29a', { shadow: '#76705e', light: '#e2dcc4' }),
    skin: A.mat('#8a9078', { shadow: '#4e5442', light: '#b6bca2', deep: '#262a1e' }),
    bark: A.mat('#4a3a28', { shadow: '#271e14', light: '#74603e', deep: '#120d08' }),
    vine: A.mat('#3e5a2a', { shadow: '#22341a', light: '#6a8a40' }),
    rose: A.mat('#7a1a24', { shadow: '#4a0c14', light: '#b8384a' }),
    leaf: A.mat('#2e4a24', { shadow: '#182a12', light: '#4e7036' }),
  };
  const BACK = 0.66;
  function solve(pose) {
    const x = pose.extra;
    const W = rig.solve(pose);
    if (x.hF) H.arm(pose, 'F', [W.uarmF.x + x.hF[0], W.uarmF.y + x.hF[1]], x.haF === undefined ? 40 : x.haF, x.bF || 1);
    if (x.hB) H.arm(pose, 'B', [W.uarmB.x + x.hB[0], W.uarmB.y + x.hB[1]], x.haB === undefined ? 70 : x.haB, x.bB || 1);
  }
  // espinho pequeno ao longo de uma linha
  function thorns(ctx, pts, n, col, seed) {
    const r = A.rng(seed || 3);
    for (let i = 1; i < n; i++) {
      const t = i / n, k = Math.min(pts.length - 2, Math.floor(t * (pts.length - 1))), u = t * (pts.length - 1) - k;
      const a = pts[k], b = pts[k + 1], x = A.lerp(a[0], b[0], u), y = A.lerp(a[1], b[1], u);
      const [dx, dy] = K.norm(b[0] - a[0], b[1] - a[1]), s = r() < 0.5 ? 1 : -1;
      const tp = A.path((q) => { q.M(x - dx * 0.25, y - dy * 0.25); q.L(x - dy * 0.7 * s + dx * 0.25, y + dx * 0.7 * s + dy * 0.25); q.L(x + dx * 0.25, y + dy * 0.25); q.Z(); }, S);
      ctx.fillStyle = col; ctx.fill(tp);
    }
  }
  // rosa: aberta (x.bloom) ou em botão
  function rose(ctx, x0, y0, k, r0) {
    const R = (0.6 + k * 0.9) * (r0 || 1);
    ctx.save(); ctx.translate(x0 * S, y0 * S);
    for (let i = 0; i < 5; i++) { const a = (i / 5) * A.TAU + k; const p = A.path((q) => q.E(Math.cos(a) * R * 0.45, Math.sin(a) * R * 0.45, R * 0.6, R * 0.42, a), S); K.paint(ctx, p, M.rose, { depth: S * 0.15, hlw: S * 0.1, inkW: K.IW * 0.6 }); }
    const c = A.path((q) => q.E(0, 0, R * 0.38, R * 0.32), S); ctx.fillStyle = M.rose.shadow; ctx.fill(c);
    ctx.restore();
  }
  // roseira das costas: ramos que saem dos ombros e das costas, com folhas e rosas
  function bush(ctx, W, x) {
    const C = W.chest, [cnx, cny] = K.perp(C), sw = x.sway || 0, bl = x.bloom === undefined ? 1 : x.bloom;
    const base = [K.along(C, 0.3)[0] - cnx * 2.2, K.along(C, 0.3)[1] - cny * 2.2];
    const branches = [[-6.4, -8.2], [-3.2, -10.6], [-8.6, -3.6], [0.4, -9.6], [-7.0, 1.4]];
    const tips = [];
    branches.forEach(([dx, dy], i) => {
      const e = [base[0] + dx + sw * (0.6 + i * 0.15), base[1] + dy * (0.75 + bl * 0.25)];
      const m = [A.lerp(base[0], e[0], 0.5) + (i % 2 ? 0.8 : -0.8), A.lerp(base[1], e[1], 0.5)];
      const pts = [base, m, e];
      K.tube(ctx, pts, [0.55, 0.4, 0.2], M.bark, { depth: S * 0.2, hlw: S * 0.1 });
      thorns(ctx, pts, 6, '#1a120a', i + 5);
      tips.push(e, m);
    });
    // folhas
    const r = A.rng(23);
    for (let i = 0; i < tips.length; i++) { const [lx, ly] = tips[i]; for (let j = 0; j < 2; j++) { const a = r() * A.TAU; const lf = A.path((q) => q.E(lx + Math.cos(a) * 0.9, ly + Math.sin(a) * 0.9, 0.9, 0.42, a), S); K.paint(ctx, lf, M.leaf, { depth: S * 0.15, inkW: K.IW * 0.5 }); } }
    // rosas nas pontas (abrem com x.bloom)
    for (let i = 0; i < tips.length; i += 2) rose(ctx, tips[i][0], tips[i][1], bl, i === 2 ? 1.3 : 1);
    rose(ctx, tips[1][0], tips[1][1], bl * 0.6, 0.8);
  }
  function arm(ctx, W, side, back) {
    const U = W['uarm' + side], F = W['farm' + side], Hd = W['hand' + side];
    K.limb(ctx, [U.x, U.y], [F.x, F.y], [F.ex, F.ey], 1.15, 0.95, 0.9, back ? K.dim(M.habit, BACK) : M.habit, { depth: S * 0.45 });
    // mão de dedos de raiz
    ctx.save(); A.boneT(ctx, Hd, S);
    const m = back ? K.dim(M.skin, BACK) : M.skin;
    K.blob(ctx, [[-0.3, -0.7], [1.0, -0.7], [1.4, 0], [1.0, 0.6], [-0.3, 0.6]], m, { depth: S * 0.25 });
    for (let i = 0; i < 3; i++) K.tube(ctx, [[1.0, -0.4 + i * 0.4], [2.0, -0.2 + i * 0.5], [2.6, 0.4 + i * 0.5]], [0.2, 0.15, 0.08], back ? K.dim(M.bark, BACK) : M.bark, { depth: S * 0.1 });
    ctx.restore();
  }
  // chicote de silva: polilinha que segue a mão com atraso (x.whip = pontos relativos à mão, já em forma)
  function whip(ctx, W, x) {
    const Hd = W.handF, h = [Hd.ex, Hd.ey];
    const pts = [h];
    for (const [dx, dy] of x.whip || [[1.4, 2.2], [2.0, 4.6], [1.4, 7.0], [0.6, 9.2], [0.2, 11.0]]) pts.push([h[0] + dx, h[1] + dy]);
    K.tube(ctx, pts, pts.map((_, i) => 0.42 - i * 0.06), M.vine, { depth: S * 0.15, hlw: S * 0.08 });
    thorns(ctx, pts, 14, '#2a1a0c', 11);
    x._tip = pts[pts.length - 1];
  }
  // hábito comprido que acaba em raízes cravadas no chão
  function robe(ctx, W, x) {
    const C = W.chest, Sp = W.spine, [sx, sy] = K.along(C, 0.95), [cnx, cny] = K.perp(C), [px, py] = K.along(Sp, 0.2), [snx, sny] = K.perp(Sp);
    const hemY = -1.2, sw = x.sway || 0;
    const path = A.path((q) => {
      q.M(sx - cnx * 2.4, sy - cny * 2.4); q.Q(sx, sy - 0.5, sx + cnx * 2.6, sy + cny * 2.6);
      q.Q(px + snx * 2.8, py + sny * 2.8, px + snx * 3.6 + 0.6, hemY - 4);
      q.Q(px + snx * 4.6 + sw * 0.3, hemY - 1, px + snx * 4.2, hemY);
      q.L(px - snx * 4.4, hemY); q.Q(px - snx * 4.4, hemY - 3, px - snx * 2.8, py - sny * 2.8);
      q.Q(sx - cnx * 3.2, (sy + py) / 2, sx - cnx * 2.4, sy - cny * 2.4); q.Z();
    }, S);
    K.paint(ctx, path, M.habit, { depth: S * 1.0, hlw: S * 0.4 });
    ctx.save(); ctx.clip(path);
    for (let i = 0; i < 4; i++) K.line(ctx, [[px - 2 + i * 1.3, py + 1], [px - 3.4 + i * 2.1, hemY]], 0.3, A.rgba(M.habit.deep, 0.7));
    // musgo e terra a subir pela bainha
    const g = ctx.createLinearGradient(0, (hemY - 6) * S, 0, hemY * S); g.addColorStop(0, 'rgba(40,30,18,0)'); g.addColorStop(1, 'rgba(40,30,18,0.7)'); ctx.fillStyle = g; ctx.fillRect((px - 6) * S, (hemY - 7) * S, 12 * S, 8 * S);
    ctx.restore();
    // cordão
    const [bx, by] = K.along(Sp, 0.1);
    K.line(ctx, [[bx - snx * 2.7, by - sny * 2.7], [bx + snx * 2.8, by + sny * 2.8]], 0.36, M.bark.light);
    A.stroke(ctx, [[bx + snx * 1.6, by + sny * 1.6], [bx + snx * 1.8 + sw * 0.4, by + 4.6]], S * 0.3, M.bark.light, S);
    // raízes cravadas no chão
    const r = A.rng(31);
    for (let i = 0; i < 6; i++) {
      const x0 = px - 3.8 + i * 1.5, x1 = x0 + (r() - 0.5) * 5 + (i - 2.5) * 0.8;
      const pts = [[x0, hemY - 0.4], [A.lerp(x0, x1, 0.5), 0.1], [x1, 0.8]];
      K.tube(ctx, pts, [0.6, 0.4, 0.15], M.bark, { depth: S * 0.2, hlw: S * 0.1 });
    }
  }
  // cabeça: toucado de linho com véu, rosto de casca com olhos verdes muito fundos
  function head(ctx, W, x) {
    const Hd = W.head;
    ctx.save(); A.boneT(ctx, Hd, S); ctx.rotate(Math.PI / 2);
    const veil = K.blob(ctx, [[-3.2, 3.4], [-2.8, -2.4], [-1.2, -4.0], [1.4, -3.8], [2.4, -2.6], [2.0, 1.6], [0.8, 2.6], [-1.0, 4.6]], M.habit, { depth: S * 0.5, hlw: S * 0.25, light: [0.6, -1] });
    const wim = K.blob(ctx, [[-1.0, 2.4], [-1.4, -1.6], [-0.4, -3.2], [1.4, -3.2], [2.2, -2.2], [2.2, 1.2], [1.0, 2.6]], M.wimple, { depth: S * 0.4, hlw: S * 0.25 });
    const face = K.blob(ctx, [[0.0, -2.4], [1.3, -2.6], [2.0, -1.8], [2.4, -0.9], [2.0, -0.6], [2.0, 0.4], [1.4, 1.2], [0.2, 1.0]], M.skin, { depth: S * 0.45, hlw: S * 0.25, light: [0.6, -1] });
    ctx.save(); ctx.clip(face);
    for (const [a, b] of [[[0.6, -2.4], [0.9, -0.2]], [[1.3, 0.2], [1.9, 1.0]]]) K.line(ctx, [a, b], 0.14, A.rgba(M.bark.base, 0.7)); // fendas de casca
    ctx.restore();
    const eo = K.blobPath([[0.9, -1.8], [1.8, -1.85], [1.85, -1.3], [1.0, -1.25]]); ctx.fillStyle = '#0a0c06'; ctx.fill(eo);
    K.ember(ctx, 1.4, -1.55, 0.26, x.eye === undefined ? 1 : x.eye, '#b8ff70');
    ctx.restore();
    void veil; void wim;
  }
  function draw(ctx, W, x) {
    bush(ctx, W, x);
    arm(ctx, W, 'B', true);
    robe(ctx, W, x);
    head(ctx, W, x);
    arm(ctx, W, 'F', false);
    whip(ctx, W, x);
  }
  function points(W, x) { const Hh = W.head, ca = Math.cos(Hh.a * D2R), sa = Math.sin(Hh.a * D2R); return { tip: x._tip, eye: [Hh.x + ca * 1.55 - sa * 1.4, Hh.y + sa * 1.55 + ca * 1.4] }; }

  const STANCE = { pelvis: 0, spine: 8, chest: 10, neck: 6, head: -14 };
  const P = (a, x) => A.pose(A.addA(STANCE, a || {}), x, [0, -12.4]);
  const base = (o = {}) => Object.assign({ hF: [2.4, 6.4], haF: 70, hB: [0.6, 6.8], bloom: 1, sway: 0 }, o);
  function anims() {
    const R = {};
    // adormecida: encolhida, rosas em botão
    R.dormant = { n: 4, fps: 4, loop: true, poseFn: (t) => { const s = Math.sin(t * A.TAU); return P({ spine: 20, chest: 16, neck: 14, head: 6 }, base({ hF: [1.6, 7.6], hB: [0.4, 7.8], bloom: 0.05, sway: s * 0.3, eye: 0.3, whip: [[0.4, 1.8], [0.2, 3.8], [-0.6, 5.6], [-1.6, 6.6], [-2.6, 7.0]] })); } };
    R.idle = { n: 6, fps: 6, loop: true, poseFn: (t) => { const s = Math.sin(t * A.TAU); return P({ spine: s, chest: s }, base({ sway: s * 0.8, hF: [2.6 + s * 0.3, 6.2], whip: [[1.4 + s * 0.4, 2.2], [2.0 + s * 0.6, 4.6], [1.4 + s * 0.9, 7.0], [0.6 + s * 1.2, 9.2], [0.2 + s * 1.4, 11.0]] })); } };
    // chicotada (sinal branco na ponta): ergue o chicote atrás e estala-o em frente, comprido e rente
    R.atk_whip = {
      n: 8, fps: 13, phases: [3, 2],
      poseFn: (t, i) => [
        P({}, base()),
        P({ spine: -6, chest: -8 }, base({ hF: [-1.6, -4.6], haF: -120, whip: [[-1.4, -1.6], [-3.4, -2.4], [-5.6, -2.2], [-7.8, -1.0], [-9.2, 0.8]], sway: 0.6 })),
        P({ spine: -10, chest: -12 }, base({ hF: [-2.4, -6.0], haF: -140, whip: [[-1.2, -1.8], [-3.0, -3.4], [-5.4, -4.4], [-8.0, -4.6], [-10.2, -3.8]], sway: 1 })),
        P({ spine: 10, chest: 8 }, base({ hF: [5.4, -1.0], haF: -10, whip: [[2.6, -0.6], [6.0, -0.6], [10.0, 0.0], [14.0, 0.6], [17.6, 1.2]], sway: -1 })),
        P({ spine: 14, chest: 10 }, base({ hF: [6.0, 1.6], haF: 10, whip: [[3.0, 0.2], [7.0, 0.6], [11.0, 1.2], [15.2, 1.8], [19.0, 2.4]], sway: -1.2 })),
        P({ spine: 12, chest: 10 }, base({ hF: [5.0, 3.6], haF: 40, whip: [[2.6, 1.4], [5.6, 2.8], [8.4, 4.4], [11.0, 6.0], [13.2, 7.8]] })),
        P({ spine: 6 }, base({ hF: [3.4, 5.2], whip: [[1.8, 2.0], [3.0, 4.4], [3.4, 6.8], [3.0, 9.0], [2.4, 10.6]] })),
        P({}, base()),
      ][i],
    };
    // espinhos do chão (sinal vermelho): crava as mãos na terra e a roseira encrespa-se
    R.atk_burst = {
      n: 8, fps: 11, phases: [4, 2],
      poseFn: (t, i) => { const k = [0, 0.3, 0.6, 0.9, 1, 1, 0.6, 0.2][i]; return P({ spine: 20 * k, chest: 16 * k, neck: 10 * k, head: 4 * k }, base({ hF: [2.4 + k * 2, 6.4 + k * 4], haF: 90, hB: [0.6 + k * 2, 6.8 + k * 4], bloom: 1 + k * 0.3, sway: (i % 2 ? 1 : -1) * k * 1.4, eye: 1 + k, whip: [[0.6, 1.8], [1.4, 3.6], [2.4, 4.8], [3.8, 5.4], [5.4, 5.6]] })); },
    };
    R.hurt = { n: 3, fps: 14, poseFn: (t, i) => P({ spine: [-12, -6, 0][i], chest: [-10, -4, 0][i] }, base({ bloom: 0.6, sway: [1.4, 0.6, 0][i], eye: 1.8 })) };
    R.stagger = { n: 4, fps: 7, loop: true, poseFn: (t) => { const s = Math.sin(t * A.TAU); return P({ spine: 22, chest: 18, neck: 16, head: 10 }, base({ hF: [2.0, 9.4], hB: [1.0, 9.6], bloom: 0.3, sway: s, eye: 0.4, whip: [[0.4, 1.8], [0.2, 3.8], [-0.6, 5.6], [-1.6, 6.6], [-2.6, 7.0]] })); } };
    // morte: seca — curva-se, as rosas murcham, a roseira encolhe
    R.death = { n: 7, fps: 9, poseFn: (t, i) => { const k = i / 6; return P({ spine: 10 + k * 30, chest: 10 + k * 16, neck: 6 + k * 16, head: k * 10 }, base({ hF: [2 + k, 7 + k * 3], hB: [1, 7 + k * 3], bloom: Math.max(0, 1 - k * 1.4), sway: -k, eye: 1 - k, whip: [[0.4, 1.8], [0.2, 3.8], [-0.6, 5.6], [-1.6, 6.6], [-2.6, 7.0]] })); } };
    return R;
  }
  A.register('en_thornmaid', () => A.creature({ name: 'en_thornmaid', S, box: [64, 54], anchor: [30, 48], rig, solve, draw, points, anims: anims(), post: K.post('#b0d090', 0.25, 0.04) }));
  (A.previewCell = A.previewCell || {}).en_thornmaid = [58, 50];
})(window.ART);
