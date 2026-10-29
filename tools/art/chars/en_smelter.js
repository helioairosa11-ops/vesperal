// Vesperal — Fundidor (smelter): operário morto das forjas, máscara de couro cosida com óculos de vidro fumado,
// avental grosso e luvas até ao cotovelo. Segura com tenazes um cadinho de metal fundido e atira-o em arco.
// → assets/sprites/en_smelter.png
'use strict';
(function (A) {
  const S = 4, K = A.kit(S), D2R = A.D2R;
  const H = A.humanoid({ spine: 4.4, chest: 4.4, neck: 1.2, head: 4.0, thigh: 6.2, shin: 6.2, foot: 2.7, uarm: 4.8, farm: 4.6, hand: 1.8 });
  const rig = H.rig;
  const M = {
    leather: A.mat('#5a3e2c', { shadow: '#33231a', light: '#8a6448', deep: '#1a110c' }),
    apron: A.mat('#3e2c22', { shadow: '#221811', light: '#644a3a' }),
    cloth: A.mat('#4a4448', { shadow: '#262226', light: '#6e6668' }),
    iron: A.mat('#4c4a52', { shadow: '#24232a', light: '#8e8a96', deep: '#121116' }),
    clay: A.mat('#6a4a3a', { shadow: '#3a2418', light: '#9a6e54' }),
    brass: A.mat('#8a6a34', { shadow: '#4e3a1a', light: '#d8b468' }),
  };
  const BACK = 0.66;
  function solve(pose) {
    const x = pose.extra, r = pose.root;
    if (x.fF) H.leg(pose, 'F', [r[0] + x.fF[0], x.fF[1] - 0.85], x.faF || 0);
    if (x.fB) H.leg(pose, 'B', [r[0] + x.fB[0], x.fB[1] - 0.85], x.faB || 0);
    const W = rig.solve(pose);
    const g = [W.uarmF.x + x.g[0], W.uarmF.y + x.g[1]], d = [Math.cos(x.ta * D2R), Math.sin(x.ta * D2R)];
    x._g = g; x._d = d;
    H.arm(pose, 'F', g, x.ta + 90, 1);
    H.arm(pose, 'B', [g[0] - d[0] * 2.6, g[1] - d[1] * 2.6 + 0.4], x.ta + 90, 1);
  }
  // tenazes compridas e o cadinho de barro cheio de metal (x.full 0..1; o brilho vai na sobreposição)
  function tongs(ctx, x) {
    const g = x._g, d = x._d, n = [-d[1], d[0]];
    const at = (t, w = 0) => [g[0] + d[0] * t + n[0] * w, g[1] + d[1] * t + n[1] * w];
    K.line(ctx, [at(-3.4, -0.4), at(0, -0.2), at(7.6, -0.6)], 0.3, M.iron.shadow);
    K.line(ctx, [at(-3.4, 0.4), at(0, 0.2), at(7.6, 0.6)], 0.3, M.iron.base);
    K.dot(ctx, at(1.2)[0], at(1.2)[1], 0.3, M.iron.light);
    if (x.full === 0) { x._pot = null; return; }
    // cadinho: sempre de boca para cima (a tenaz morde-o pelos lados)
    const c = at(8.6, 0);
    const pot = K.polyPath([[c[0] - 1.8, c[1] - 1.6], [c[0] + 1.8, c[1] - 1.6], [c[0] + 1.4, c[1] + 1.8], [c[0] - 1.4, c[1] + 1.8]]);
    K.paint(ctx, pot, M.clay, { depth: S * 0.4, hlw: S * 0.2 });
    ctx.save(); ctx.clip(pot); K.line(ctx, [[c[0] - 1.8, c[1] - 0.6], [c[0] + 1.8, c[1] - 0.6]], 0.2, A.rgba(M.clay.shadow, 0.7)); ctx.restore();
    const lip = A.path((q) => q.E(c[0], c[1] - 1.6, 1.8, 0.45), S); ctx.fillStyle = '#ff8a24'; ctx.fill(lip); ctx.lineWidth = K.IW; ctx.strokeStyle = K.INK; ctx.stroke(lip);
    x._pot = [c[0], c[1] - 1.7];
  }
  function arm(ctx, W, side, back) {
    const U = W['uarm' + side], F = W['farm' + side], Hd = W['hand' + side];
    K.limb(ctx, [U.x, U.y], [F.x, F.y], [F.ex, F.ey], 1.05, 0.9, 0.75, back ? K.dim(M.cloth, BACK) : M.cloth, { depth: S * 0.45 });
    // luva grossa até ao cotovelo
    const p1 = [F.x, F.y], p2 = [F.ex, F.ey], dd = K.norm(p2[0] - p1[0], p2[1] - p1[1]), nn = [-dd[1], dd[0]], L = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]);
    const at = (t, w) => [p1[0] + dd[0] * L * t + nn[0] * w, p1[1] + dd[1] * L * t + nn[1] * w];
    K.poly(ctx, [at(0.05, 1.5), at(1.0, 1.1), at(1.0, -1.1), at(0.05, -1.5)], back ? K.dim(M.leather, BACK) : M.leather, { depth: S * 0.4, hlw: S * 0.2 });
    ctx.save(); A.boneT(ctx, Hd, S);
    K.blob(ctx, [[-0.4, -1.0], [1.4, -1.0], [2.0, -0.1], [1.5, 0.9], [-0.4, 0.9]], back ? K.dim(M.leather, BACK) : M.leather, { depth: S * 0.3 });
    ctx.restore();
  }
  function leg(ctx, W, side, back) {
    const T = W['thigh' + side], N = W['shin' + side], F = W['foot' + side];
    K.limb(ctx, [T.x, T.y], [N.x, N.y], [N.ex, N.ey], 1.4, 1.05, 0.8, back ? K.dim(M.cloth, BACK) : M.cloth, { depth: S * 0.5 });
    ctx.save(); A.boneT(ctx, F, S);
    K.blob(ctx, [[-1.0, -1.0], [1.4, -0.9], [2.9, -0.2], [2.9, 0.7], [-1.1, 0.8]], back ? K.dim(M.leather, BACK) : M.leather, { depth: S * 0.35 });
    K.line(ctx, [[-1.1, 0.75], [2.9, 0.65]], 0.34, '#120c09');
    ctx.restore();
  }
  function torso(ctx, W, x) {
    const path = H.torsoPath(W, [['pelvis', 0.3, 2.7, 2.6], ['spine', 0.1, 2.5, 2.5], ['spine', 0.7, 2.7, 2.6], ['chest', 0.5, 3.0, 2.8], ['chest', 1, 2.3, 2.6]], S);
    K.paint(ctx, path, M.cloth, { depth: S * 0.8, hlw: S * 0.35 });
    // avental grosso, chamuscado e cheio de queimaduras
    const C = W.chest, [cnx, cny] = K.perp(C), [ax, ay] = K.along(C, 0.85), [px, py] = K.along(W.pelvis, 0.1), [snx, sny] = K.perp(W.spine);
    const apron = A.path((q) => { q.M(ax + cnx * 0.4, ay + cny * 0.4); q.L(ax + cnx * 3.0, ay + cny * 3.0); q.Q(px + snx * 3.6, py + sny * 3.6, px + snx * 3.2 + 0.6, py + 7.6); q.L(px - snx * 1.6, py + 7.8); q.Q(px - snx * 0.6, py, ax + cnx * 0.4, ay + cny * 0.4); q.Z(); }, S);
    K.paint(ctx, apron, M.apron, { depth: S * 0.7, hlw: S * 0.3 });
    ctx.save(); ctx.clip(apron);
    for (const [u, v] of [[0.5, 0.35], [0.75, 0.7], [0.3, 0.85]]) { const cx = A.lerp(ax, px, v) + cnx * (1 + u * 2), cy = A.lerp(ay, py + 6, v); const gg = ctx.createRadialGradient(cx * S, cy * S, 0, cx * S, cy * S, 1.0 * S); gg.addColorStop(0, 'rgba(6,4,3,0.85)'); gg.addColorStop(1, 'rgba(6,4,3,0)'); ctx.fillStyle = gg; ctx.fillRect((cx - 2) * S, (cy - 2) * S, 4 * S, 4 * S); }
    ctx.restore();
    K.line(ctx, [[ax + cnx * 1.0, ay + cny * 1.0], [C.x - cnx * 2.2, C.y - 4.6]], 0.36, M.apron.shadow);
  }
  // cabeça: capuz e máscara de couro cosida, óculos redondos de vidro fumado a refletir o fogo, tubo de respirar
  function head(ctx, W, x) {
    const Hd = W.head;
    ctx.save(); A.boneT(ctx, Hd, S); ctx.rotate(Math.PI / 2);
    const hood = K.blob(ctx, [[-2.4, 1.4], [-2.6, -1.8], [-1.4, -3.8], [0.8, -4.2], [2.2, -3.2], [2.7, -1.4], [2.8, 0.6], [2.0, 1.8], [-0.6, 2.0]], M.leather, { depth: S * 0.6, hlw: S * 0.3, light: [0.6, -1] });
    ctx.save(); ctx.clip(hood);
    for (const [a, b] of [[[0.2, -4.0], [0.6, 1.8]], [[-1.4, -3.6], [-1.6, 1.6]]]) { K.line(ctx, [a, b], 0.16, A.rgba(M.leather.deep, 0.8)); for (let i = 0; i < 6; i++) { const t = i / 6, sx = A.lerp(a[0], b[0], t), sy = A.lerp(a[1], b[1], t); K.line(ctx, [[sx - 0.3, sy], [sx + 0.3, sy + 0.1]], 0.1, A.rgba('#c8a880', 0.6)); } }
    ctx.restore();
    // óculos (o de perto) e o aro do de longe
    for (const [ox, oy, rr] of [[2.1, -1.7, 0.75], [1.2, -1.75, 0.62]]) { K.dot(ctx, ox, oy, rr + 0.22, M.brass.shadow); K.dot(ctx, ox, oy, rr, '#2a1a12'); }
    // tubo de respirar até ao peito
    A.stroke(ctx, [[2.4, 0.4], [2.6, 1.6], [1.8, 3.2]], S * 0.55, M.iron.shadow, S);
    for (let i = 0; i < 4; i++) K.line(ctx, [[2.5 - i * 0.12 - 0.3, 0.6 + i * 0.7], [2.5 - i * 0.12 + 0.3, 0.6 + i * 0.7]], 0.12, M.iron.light);
    ctx.restore();
  }
  function draw(ctx, W, x) {
    arm(ctx, W, 'B', true);
    leg(ctx, W, 'B', true);
    torso(ctx, W, x);
    leg(ctx, W, 'F', false);
    head(ctx, W, x);
    tongs(ctx, x);
    arm(ctx, W, 'F', false);
  }
  // fogo refletido nos óculos e o metal fundido a fumegar
  function overlay(ctx, W, x) {
    const Hd = W.head, ca = Math.cos(Hd.a * D2R), sa = Math.sin(Hd.a * D2R);
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const e = [Hd.x + ca * 1.7 - sa * 2.1, Hd.y + sa * 1.7 + ca * 2.1];
    ctx.fillStyle = A.rgba('#ff9a40', 0.75); ctx.beginPath(); ctx.arc(e[0] * S, e[1] * S, 0.55 * S, 0, A.TAU); ctx.fill();
    ctx.fillStyle = 'rgba(255,240,200,0.9)'; ctx.beginPath(); ctx.arc((e[0] - 0.2) * S, (e[1] - 0.25) * S, 0.18 * S, 0, A.TAU); ctx.fill();
    if (x._pot) { A.glow(ctx, x._pot[0] * S, x._pot[1] * S, 4 * S, '#ff8020', 0.55 * (x.full === undefined ? 1 : x.full)); }
    ctx.restore();
  }
  function points(W, x) {
    const Hd = W.head, ca = Math.cos(Hd.a * D2R), sa = Math.sin(Hd.a * D2R);
    return { eye: [Hd.x + ca * 1.7 - sa * 2.1, Hd.y + sa * 1.7 + ca * 2.1], tip: x._pot || [x._g[0] + x._d[0] * 8, x._g[1] + x._d[1] * 8], light: x._pot || [0, -14] };
  }
  const STANCE = { pelvis: 0, spine: 8, chest: 6, neck: 2, head: -6 };
  const P = (a, x, root) => A.pose(A.addA(STANCE, a || {}), x, root || [0, -12.4]);
  const base = (o = {}) => Object.assign({ fF: [2.8, 0], fB: [-2.8, 0], g: [2.2, 6.4], ta: -12, full: 1 }, o);
  function anims() {
    const R = {};
    R.idle = { n: 6, fps: 6, loop: true, keys: [[0, P({}, base())], [0.5, P({ spine: 1, chest: 1 }, base({ g: [2.2, 6.7] }), [0, -12.25])], [1, P({}, base())]] };
    R.move = { n: 8, fps: 9, loop: true, stride: 11, poseFn: (t) => { const f = A.stepFeet(t, { stride: 2.9, lift: 1.4 }); const s = Math.sin(t * A.TAU); return P({ spine: 2, head: -s }, base({ fF: f.F, fB: f.B, faF: f.F[1] < 0 ? 12 : 0, faB: f.B[1] < 0 ? 12 : 0, g: [2.2, 6.4 + s * 0.3] }), [0.3, -12.4 + Math.abs(s) * 0.4]); } };
    // arremesso: baixa as tenazes atrás, balança e atira o metal num arco (o cadinho fica vazio)
    R.atk_lob = {
      n: 9, fps: 11, phases: [4, 1],
      poseFn: (t, i) => [
        P({}, base()),
        P({ spine: -2, chest: -6 }, base({ g: [-2.0, 7.0], ta: 160, fF: [3.2, 0], fB: [-3.0, 0] }), [-0.4, -12.2]),
        P({ spine: 0, chest: -10 }, base({ g: [-4.2, 4.6], ta: 196, fF: [3.4, 0], fB: [-3.2, 0] }), [-0.6, -12.0]),
        P({ spine: 2, chest: -8 }, base({ g: [-4.4, 3.8], ta: 200, fF: [3.4, 0], fB: [-3.2, 0] }), [-0.6, -12.0]),
        P({ spine: 12, chest: 10, head: -12 }, base({ g: [5.6, -3.6], ta: -50, fF: [4.2, 0], fB: [-3.0, 0], full: 0.3 }), [0.8, -12.4]),
        P({ spine: 12, chest: 12 }, base({ g: [6.0, -1.6], ta: -36, fF: [4.2, 0], fB: [-3.0, 0], full: 0 }), [0.8, -12.3]),
        P({ spine: 8, chest: 8 }, base({ g: [4.0, 3.6], ta: -10, full: 0 })),
        P({ spine: 10, chest: 6 }, base({ g: [2.6, 6.0], ta: -14, full: 0.5 })),
        P({}, base()),
      ][i],
    };
    R.hurt = { n: 3, fps: 14, keys: [[0, P({ spine: -14, chest: -10, neck: -6, head: 8 }, base({ g: [0.8, 5.4], ta: -40 }), [-1, -12.6])], [1, P({}, base())]] };
    R.stagger = { n: 4, fps: 7, loop: true, poseFn: (t) => { const s = Math.sin(t * A.TAU); return P({ spine: 20 + s * 2, chest: 10, neck: 14, head: 8 }, base({ g: [3.0, 9.6], ta: 50, full: 0.6 }), [0.2, -11.6]); } };
    R.death = { n: 7, fps: 10, keys: [[0, P({ spine: -16, chest: -10, neck: -8 }, base({ g: [0, 4], ta: -50 }), [-1, -12.6])], [0.45, P({ spine: 30, chest: 14, neck: 16 }, base({ g: [3, 9], ta: 60, fF: [3.4, 0], fB: [-1.6, 0], full: 0.3 }), [0.8, -8.0])], [1, P({ spine: 82, chest: 6, neck: 8 }, base({ g: [5, 5], ta: 10, fF: [3.6, 0], fB: [-1.8, 0], full: 0 }), [1.2, -4.8])]] };
    return R;
  }
  A.register('en_smelter', () => A.creature({ name: 'en_smelter', S, box: [52, 50], anchor: [24, 45], rig, solve, draw, overlay, points, anims: anims(), post: K.post('#d08060', 0.3, 0.04) }));
  (A.previewCell = A.previewCell || {}).en_smelter = [46, 46];
})(window.ART);
