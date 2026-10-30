// Vesperal — Escravo da Forja (thrall): colosso de pele queimada com fendas de brasa, máscara de ferro soldada
// e grilhetas com correntes a arrastar. Empunha um malho-bigorna: varre (aparável) e esmaga o chão em ondas
// de fogo (esquivar). → assets/sprites/en_thrall.png
'use strict';
(function (A) {
  // V.big: variante grande (folha a 6× para ficar nítida quando o jogo a desenha maior)
  function make(S, V) {
  const K = A.kit(S), D2R = A.D2R;
  const BIG = V.big ? A.bigParts(K, S) : null;
  const H = A.humanoid({ pelvis: 2.4, spine: 5.4, chest: 5.6, neck: 1.2, head: 4.0, thigh: 6.6, shin: 6.4, foot: 3.2, uarm: 5.6, farm: 5.4, hand: 2.2, shoulder: 0.78 });
  const rig = H.rig;
  const M = {
    skin: A.mat('#5a4440', { shadow: '#2e2220', light: '#8a6a60', deep: '#160f0e' }),
    skinB: A.mat('#433230', { shadow: '#231918', light: '#644c46', deep: '#100b0a' }),
    iron: A.mat('#4c4a52', { shadow: '#24232a', light: '#8e8a96', deep: '#121116' }),
    hot: A.mat('#7a4a36', { shadow: '#4a2a1c', light: '#e09050' }),
    leather: A.mat('#3a2a22', { shadow: '#1e1511', light: '#5e4636' }),
    wood: A.mat('#4a3424', { shadow: '#2a1d14', light: '#7a5a40' }),
  };
  // Titã: ferro enegrecido, brasas mais vivas, cornos no elmo e grilhetas em ambos os pulsos
  if (V.big) Object.assign(M, {
    skin: A.mat('#4e3a36', { shadow: '#281c1a', light: '#7a5c52', deep: '#120c0b' }),
    iron: A.mat('#3a3840', { shadow: '#1c1b20', light: '#78747e', deep: '#0c0b0e' }),
    hot: A.mat('#8a4a2a', { shadow: '#542a16', light: '#ffb060' }),
  });
  const BACK = 0.64;

  function solve(pose) {
    const x = pose.extra, r = pose.root;
    if (x.fF) H.leg(pose, 'F', [r[0] + x.fF[0], x.fF[1] - 0.85], x.faF || 0);
    if (x.fB) H.leg(pose, 'B', [r[0] + x.fB[0], x.fB[1] - 0.85], x.faB || 0);
    A.twoHand(H, pose, x, { tip: 13.4, gap: 3.8, minGap: 2.4 });
  }
  // malho-bigorna: cabo de madeira com cintas de ferro; a cabeça é uma bigorna pequena com o bico para a frente
  function maul(ctx, x) {
    const g = x._g, d = x._d, n = [-d[1], d[0]];
    const at = (t, w = 0) => [g[0] + d[0] * t + n[0] * w, g[1] + d[1] * t + n[1] * w];
    K.tube(ctx, [at(-5.5), at(0), at(11)], [0.55, 0.55, 0.5], M.wood, { depth: S * 0.25, hlw: S * 0.12, flat: true });
    for (const t of [-4.4, 4.0, 9.4]) K.line(ctx, [at(t, -0.6), at(t, 0.6)], 0.4, M.iron.shadow);
    // bigorna (perpendicular ao cabo): face de batida, cintura, base; bico (corno) para a frente do golpe
    const B = (u, v) => at(11 + v, u); // u ao longo da bigorna (perpendicular ao cabo), v ao longo do cabo
    const anvil = K.polyPath([B(-3.8, -2.0), B(-1.8, -2.4), B(1.8, -2.4), B(2.6, -1.6), B(4.8, -1.0), B(2.4, -0.4), B(1.4, 0.4), B(1.4, 1.4), B(2.2, 2.4), B(-2.4, 2.4), B(-1.6, 1.4), B(-1.6, 0.4), B(-2.8, -0.6), B(-4.2, -1.2)]);
    K.paint(ctx, anvil, M.iron, { depth: S * 0.6, hlw: S * 0.3 });
    ctx.save(); ctx.clip(anvil);
    const hot = x.heat || 0;
    if (hot > 0) { const c = B(0.5, -1.2); const gg = ctx.createRadialGradient(c[0] * S, c[1] * S, 0, c[0] * S, c[1] * S, 4 * S); gg.addColorStop(0, A.rgba('#ffb040', 0.8 * hot)); gg.addColorStop(1, 'rgba(255,90,20,0)'); ctx.fillStyle = gg; ctx.fillRect((c[0] - 5) * S, (c[1] - 5) * S, 10 * S, 10 * S); }
    K.line(ctx, [B(-1.8, -2.1), B(1.8, -2.1)], 0.26, A.rgba(M.iron.light, 0.75)); K.line(ctx, [B(-1.5, 1.5), B(1.5, 1.5)], 0.2, A.rgba(M.iron.deep, 0.7));
    ctx.restore();
    x._tip = B(4.8, -1.0); x._face = B(0, -2.4);
  }
  function chainFrom(ctx, p0, len, sway, links) {
    for (let i = 0; i < links; i++) {
      const t = (i + 0.5) / links, x = p0[0] + Math.sin(sway * D2R) * len * t + Math.sin(t * 3 + sway * 0.1) * 0.4 * t, y = p0[1] + len * t;
      ctx.strokeStyle = M.iron.light; ctx.lineWidth = S * 0.18; ctx.beginPath(); ctx.ellipse(x * S, y * S, (i % 2 ? 0.28 : 0.5) * S, 0.55 * S, 0, 0, A.TAU); ctx.stroke();
      ctx.strokeStyle = M.iron.deep; ctx.lineWidth = S * 0.08; ctx.stroke();
    }
  }
  // fendas de brasa na pele queimada (desenhadas por cima do contorno, na sobreposição)
  const cracks = [];
  function arm(ctx, W, side, back, x) {
    const U = W['uarm' + side], F = W['farm' + side], Hd = W['hand' + side];
    const m = back ? M.skinB : M.skin;
    K.limb(ctx, [U.x, U.y], [F.x, F.y], [F.ex, F.ey], 2.0, 1.55, 1.25, m, { depth: S * 0.6 });
    // ombro enorme
    const [sx, sy] = K.along(U, 0.15);
    K.blob(ctx, [[sx - 2.4, sy - 0.4], [sx - 0.4, sy - 2.4], [sx + 2.2, sy - 1.0], [sx + 1.6, sy + 1.8], [sx - 1.4, sy + 1.8]], m, { depth: S * 0.6, hlw: S * 0.3 });
    // grilheta no pulso
    const p1 = [F.x, F.y], p2 = [F.ex, F.ey], dd = K.norm(p2[0] - p1[0], p2[1] - p1[1]), nn = [-dd[1], dd[0]], L = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]);
    const at = (t, w) => [p1[0] + dd[0] * L * t + nn[0] * w, p1[1] + dd[1] * L * t + nn[1] * w];
    K.poly(ctx, [at(0.62, 1.6), at(0.95, 1.5), at(0.95, -1.5), at(0.62, -1.6)], back ? K.dim(M.iron, BACK) : M.iron, { depth: S * 0.3, hlw: S * 0.15 });
    if (!back) chainFrom(ctx, at(0.8, 1.4), 7, x.chainSw || 0, 8);
    ctx.save(); A.boneT(ctx, Hd, S);
    K.blob(ctx, [[-0.4, -1.2], [1.6, -1.2], [2.4, -0.2], [1.8, 1.0], [-0.4, 1.0]], m, { depth: S * 0.35 });
    ctx.restore();
    cracks.push([[A.lerp(U.x, F.x, 0.3), A.lerp(U.y, F.y, 0.3)], [A.lerp(U.x, F.x, 0.55) + 0.5, A.lerp(U.y, F.y, 0.55)], [A.lerp(F.x, F.ex, 0.3), A.lerp(F.y, F.ey, 0.3) + 0.3]]);
  }
  function leg(ctx, W, side, back) {
    const T = W['thigh' + side], N = W['shin' + side], F = W['foot' + side];
    const m = back ? M.skinB : M.skin;
    K.limb(ctx, [T.x, T.y], [N.x, N.y], [N.ex, N.ey], 2.2, 1.6, 1.25, m, { depth: S * 0.6 });
    // perneira de couro gasto e grilheta no tornozelo
    const p1 = [N.x, N.y], p2 = [N.ex, N.ey], dd = K.norm(p2[0] - p1[0], p2[1] - p1[1]), nn = [-dd[1], dd[0]], L = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]);
    const at = (t, w) => [p1[0] + dd[0] * L * t + nn[0] * w, p1[1] + dd[1] * L * t + nn[1] * w];
    K.poly(ctx, [at(0.72, 1.7), at(0.96, 1.6), at(0.96, -1.6), at(0.72, -1.7)], back ? K.dim(M.iron, BACK) : M.iron, { depth: S * 0.3 });
    ctx.save(); A.boneT(ctx, F, S);
    K.blob(ctx, [[-1.2, -1.2], [1.6, -1.0], [3.4, -0.2], [3.4, 0.9], [-1.3, 0.9]], m, { depth: S * 0.4 });
    for (let i = 0; i < 3; i++) K.line(ctx, [[2.6 + i * 0.25, 0.9], [2.8 + i * 0.25, 0.2]], 0.14, '#140d0c');
    ctx.restore();
    cracks.push([[A.lerp(T.x, N.x, 0.35), A.lerp(T.y, N.y, 0.35)], [A.lerp(T.x, N.x, 0.7) - 0.4, A.lerp(T.y, N.y, 0.7)]]);
  }
  // tronco enorme e curvado; avental de couro de ferreiro queimado
  function torso(ctx, W, x) {
    const path = H.torsoPath(W, [['pelvis', 0.2, 3.4, 3.4], ['spine', 0.2, 3.6, 3.4], ['spine', 0.75, 4.2, 3.8], ['chest', 0.5, 4.6, 4.2], ['chest', 0.95, 3.8, 3.8]], S);
    K.paint(ctx, path, M.skin, { depth: S * 1.1, hlw: S * 0.5 });
    const C = W.chest, Sp = W.spine, [cnx, cny] = K.perp(C);
    ctx.save(); ctx.clip(path);
    // músculos do peito e ventre (sombras)
    K.line(ctx, [[C.x + cnx * 2.6, C.y + cny * 2.6 - 2.2], [C.x + cnx * 4.2, C.y + cny * 4.2 - 0.2]], 0.6, A.rgba(M.skin.deep, 0.5));
    ctx.restore();
    // avental
    const [ax, ay] = K.along(C, 0.4), [px, py] = K.along(W.pelvis, 0.0), [snx, sny] = K.perp(Sp);
    const apron = A.path((q) => { q.M(ax + cnx * 1.4, ay + cny * 1.4); q.L(ax + cnx * 4.4, ay + cny * 4.4); q.Q(px + snx * 4.8, py + sny * 4.8, px + snx * 4.2 + 0.8, py + 6.4); q.L(px - 0.4, py + 6.8); q.Q(px - snx * 1.0, py - 1.0, ax + cnx * 1.4, ay + cny * 1.4); q.Z(); }, S);
    K.paint(ctx, apron, M.leather, { depth: S * 0.7, hlw: S * 0.3 });
    ctx.save(); ctx.clip(apron);
    for (const [u, v] of [[0.4, 0.3], [0.7, 0.6], [0.3, 0.8]]) { const cx = A.lerp(ax, px, v) + cnx * (1.5 + u * 2.5), cy = A.lerp(ay, py + 5, v) + cny * (1.5 + u * 2.5); const gg = ctx.createRadialGradient(cx * S, cy * S, 0, cx * S, cy * S, 1.1 * S); gg.addColorStop(0, 'rgba(8,5,4,0.85)'); gg.addColorStop(1, 'rgba(8,5,4,0)'); ctx.fillStyle = gg; ctx.fillRect((cx - 2) * S, (cy - 2) * S, 4 * S, 4 * S); }
    ctx.restore();
    K.line(ctx, [[C.x + cnx * 1.0, C.y + cny * 1.0 - 4.0], [ax + cnx * 1.6, ay + cny * 1.6]], 0.4, M.leather.shadow); // correia
    cracks.push([[C.x + cnx * 0.4, C.y - 3.6], [C.x - cnx * 1.4, C.y - 1.6], [C.x - cnx * 0.6, C.y + 0.6]]);
    cracks.push([[Sp.x - 1.6, Sp.y - 2], [Sp.x - 2.4, Sp.y - 0.2]]);
  }
  // cabeça: máscara de ferro soldada (balde rebitado), fenda dos olhos acesa, colar de ferro com argola
  function head(ctx, W, x) {
    const Hd = W.head, N = W.neck;
    const [cx, cy] = K.along(N, 0.4), [nx, ny] = K.perp(N);
    ctx.save(); A.boneT(ctx, Hd, S); ctx.rotate(Math.PI / 2);
    const helm = K.polyPath([[-2.2, 0.8], [-2.4, -2.6], [-1.4, -4.0], [1.6, -4.0], [2.6, -2.6], [2.6, 0.8], [1.8, 1.6], [-1.4, 1.6]]);
    K.paint(ctx, helm, M.iron, { depth: S * 0.6, hlw: S * 0.3, light: [0.6, -1] });
    ctx.save(); ctx.clip(helm);
    K.line(ctx, [[-2.4, -2.6], [2.6, -2.6]], 0.3, A.rgba(M.iron.deep, 0.7)); // costura de solda
    for (const rx of [-1.6, -0.4, 0.8, 2.0]) K.dot(ctx, rx, -3.2, 0.2, M.iron.light);
    for (const ry of [-1.6, 0.2]) K.dot(ctx, -1.8, ry, 0.2, M.iron.light);
    const rust = ctx.createRadialGradient(1.6 * S, 0.8 * S, 0, 1.6 * S, 0.8 * S, 2 * S); rust.addColorStop(0, 'rgba(110,60,30,0.7)'); rust.addColorStop(1, 'rgba(110,60,30,0)'); ctx.fillStyle = rust; ctx.fillRect(-1 * S, -2 * S, 5 * S, 5 * S);
    ctx.restore();
    const slit = K.polyPath([[0.4, -1.75], [2.7, -1.85], [2.7, -1.2], [0.4, -1.15]]); ctx.fillStyle = '#0c0606'; ctx.fill(slit);
    ctx.restore();
    // colar de ferro com argola
    K.line(ctx, [[cx - nx * 2.4, cy - ny * 2.4], [cx + nx * 2.6, cy + ny * 2.6]], 1.1, M.iron.shadow);
    K.line(ctx, [[cx - nx * 2.4, cy - ny * 2.4 - 0.3], [cx + nx * 2.6, cy + ny * 2.6 - 0.3]], 0.3, M.iron.light);
    ctx.strokeStyle = M.iron.light; ctx.lineWidth = S * 0.25; ctx.beginPath(); ctx.arc((cx + nx * 1.6) * S, (cy + ny * 1.6 + 1.2) * S, 0.8 * S, 0, A.TAU); ctx.stroke();
    chainFrom(ctx, [cx + nx * 1.6, cy + ny * 1.6 + 2.0], 5, (x.chainSw || 0) * 0.6, 6);
  }
  function draw(ctx, W, x) {
    cracks.length = 0;
    arm(ctx, W, 'B', true, x);
    if (BIG) BIG.shackle(ctx, W.farmB, K.dim(M.iron, 0.7), x.sway);
    leg(ctx, W, 'B', true);
    torso(ctx, W, x);
    leg(ctx, W, 'F', false);
    head(ctx, W, x);
    if (BIG) BIG.horns(ctx, W.head, A.mat('#cfc6b0', { shadow: '#8a8270', light: '#efe6d0', deep: '#2a2620' }), 1.15);
    maul(ctx, x);
    arm(ctx, W, 'F', false, x);
    if (BIG) BIG.shackle(ctx, W.farmF, M.iron, x.sway);
    x._cracks = cracks.slice();
  }
  // brasa por baixo da pele e nos olhos: por cima do contorno, com mistura aditiva
  function overlay(ctx, W, x) {
    const k = x.glow === undefined ? 1 : x.glow;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (const c of x._cracks || []) { A.stroke(ctx, c, S * 0.32, A.rgba('#ff6a20', 0.55 * k), S); A.stroke(ctx, c, S * 0.12, A.rgba('#ffd27a', 0.8 * k), S); }
    const Hd = W.head, ca = Math.cos(Hd.a * D2R), sa = Math.sin(Hd.a * D2R);
    const e = [Hd.x + ca * 1.5 + sa * 1.5, Hd.y + sa * 1.5 - ca * 1.5];
    A.glow(ctx, e[0] * S, e[1] * S, 2.4 * S, '#ff8030', 0.8 * k);
    A.stroke(ctx, [[e[0] - sa * -1.0, e[1] + ca * -1.0], [e[0] + sa * -1.0, e[1] - ca * -1.0]].map((p) => p), S * 0.2, A.rgba('#ffe0a0', 0.9 * k), S);
    ctx.restore();
  }
  function points(W, x) {
    const Hd = W.head, ca = Math.cos(Hd.a * D2R), sa = Math.sin(Hd.a * D2R);
    return { tip: x._tip, eye: [Hd.x + ca * 1.5 + sa * 1.5, Hd.y + sa * 1.5 - ca * 1.5], face: x._face };
  }

  const HUNCH = { pelvis: 0, spine: 16, chest: 14, neck: 18, head: -26 };
  const P = (a, x, root) => A.pose(A.addA(HUNCH, a || {}), x, root || [0, -12.4]);
  const base = (o = {}) => Object.assign({ fF: [3.4, 0], fB: [-3.4, 0], g: [3.0, 7.0], wa: 20, chainSw: 0, heat: 0, glow: 1 }, o);
  function anims() {
    const R = {};
    R.idle = { n: 6, fps: 5, loop: true, keys: [[0, P({}, base({ chainSw: -6 }))], [0.5, P({ spine: 2, chest: 3, neck: 2 }, base({ g: [3.0, 7.4], chainSw: 6, glow: 1.3 }), [0, -12.1])], [1, P({}, base({ chainSw: -6 }))]] };
    R.move = { n: 8, fps: 7, loop: true, stride: 12, poseFn: (t) => { const f = A.stepFeet(t, { stride: 3.2, lift: 1.4 }); const s = Math.sin(t * A.TAU), c = Math.cos(t * A.TAU); return P({ spine: 2 + c * 2, chest: s * 2, head: -s * 2 }, base({ fF: f.F, fB: f.B, faF: f.F[1] < 0 ? 10 : 0, faB: f.B[1] < 0 ? 10 : 0, g: [3.2, 7.0 + s * 0.4], wa: 22 + c * 3, chainSw: -c * 16 }), [0.2, -12.4 + Math.abs(s) * 0.5]); } };
    // varrida (sinal branco): torce-se para trás com o malho baixo e raspa o chão de trás para a frente
    const SW = P({ spine: 2, chest: -10, neck: 8 }, base({ g: [-4.6, 5.0], wa: 178, tgK: 0.3, fF: [4.2, 0], fB: [-4.0, 0], chainSw: 30 }), [-0.8, -12.0]);
    const SM = P({ spine: 6, chest: -2 }, base({ g: [1.0, 7.6], wa: 96, tgK: 0.9, tgY: -0.4, fF: [4.4, 0], fB: [-4.0, 0], chainSw: 10 }), [0.2, -11.6]);
    const SA = P({ spine: 10, chest: 6 }, base({ g: [6.8, 6.0], wa: 10, tgK: 0.2, tgY: -2.0, fF: [5.2, 0], fB: [-4.2, 0], chainSw: -40 }), [1.4, -11.4]);
    const SF = P({ spine: 8, chest: 2 }, base({ g: [6.0, 1.6], wa: -30, fF: [5.2, 0], fB: [-4.2, 0], chainSw: -20 }), [1.2, -11.6]);
    R.atk_swipe = { n: 8, fps: 12, phases: [3, 2], keys: [[0, P({}, base())], [0.26, SW], [0.36, SW], [0.46, SM], [0.58, SA], [0.72, SF], [1, P({}, base())]] };
    // esmagar (sinal vermelho): o malho vai para trás do ombro (joelhos a fletir, a bigorna aquece), passa por
    // cima da cabeça e cai à frente com as ancas em baixo — a bigorna assenta no chão
    const LIFT = P({ spine: -2, chest: -4 }, base({ g: [2.2, 1.0], wa: -40, heat: 0.2 }), [-0.2, -12.4]);
    const COCK = P({ spine: -6, chest: -9, neck: 4, head: -6 }, base({ g: [-1.8, -5.6], wa: -162, fF: [4.4, 0], fB: [-4.2, 0], chainSw: 14, heat: 0.6, glow: 1.4 }), [-0.9, -12.0]);
    const TOP = P({ spine: -4, chest: -6 }, base({ g: [1.6, -8.4], wa: -92, fF: [4.6, 0], fB: [-4.2, 0], heat: 0.8, glow: 1.5 }), [-0.2, -12.2]);
    const DOWN = P({ spine: 4, chest: 0 }, base({ g: [5.6, -2.6], wa: -28, fF: [5.0, 0], fB: [-4.2, 0], heat: 0.9, glow: 1.5 }), [0.6, -11.8]);
    const HIT = P({ spine: 16, chest: 10, neck: 2 }, base({ g: [6.6, 10.6], wa: 40, tgK: 1, tgY: 0.3, fF: [5.6, 0], fB: [-4.4, 0], chainSw: -50, heat: 1, glow: 1.6 }), [1.8, -9.8]);
    const HOLD = P({ spine: 18, chest: 10, neck: 2 }, base({ g: [6.2, 10.8], wa: 40, tgK: 1, tgY: 0.3, fF: [5.6, 0], fB: [-4.4, 0], chainSw: -20, heat: 0.7, glow: 1.3 }), [1.6, -9.6]);
    R.atk_slam = { n: 10, fps: 11, phases: [5, 2], keys: [[0, P({}, base())], [0.12, LIFT], [0.26, COCK], [0.4, COCK], [0.48, TOP], [0.56, DOWN], [0.64, HIT], [0.82, HOLD], [1, P({}, base({ heat: 0.3 }))]] };
    R.hurt = { n: 3, fps: 12, keys: [[0, P({ spine: -6, chest: -10, neck: -6, head: 6 }, base({ g: [1.6, 5.6], wa: 0, chainSw: 30, glow: 1.8 }), [-0.6, -12.6])], [1, P({}, base())]] };
    R.stagger = { n: 4, fps: 6, loop: true, poseFn: (t) => { const s = Math.sin(t * A.TAU); return P({ spine: 30 + s * 2, chest: 18, neck: 18, head: 6 }, base({ g: [4.4, 11.0], wa: 80, tgK: 1, chainSw: s * 20, glow: 0.6 }), [0.4, -11.0]); } };
    R.death = { n: 8, fps: 9, keys: [[0, P({ spine: -10, chest: -10 }, base({ g: [1, 4], wa: -20, glow: 2 }), [-0.6, -12.6])], [0.4, P({ spine: 30, chest: 20, neck: 14 }, base({ g: [5, 10], wa: 80, tgK: 1, fF: [3.6, 0], fB: [-1.4, 0], glow: 1 }), [0.8, -7.6])], [1, P({ spine: 80, chest: 10, neck: 8 }, base({ g: [8, 5], wa: 10, fF: [4.0, 0], fB: [-1.6, 0], glow: 0, chainSw: 0 }), [1.2, -4.4])]] };
    return R;
  }
  return A.creature({ name: V.name, S, box: [66, 58], anchor: [28, 53], rig, solve, draw, overlay, points, anims: anims(), post: K.post('#d08060', 0.3, 0.04) });
  }
  A.register('en_thrall', () => make(4, { name: 'en_thrall' }));
  A.register('en_thrall_big', () => make(6, { name: 'en_thrall_big', big: true }));
  (A.previewCell = A.previewCell || {}).en_thrall = [58, 54];
  A.previewCell.en_thrall_big = [58, 54];
})(window.ART);
