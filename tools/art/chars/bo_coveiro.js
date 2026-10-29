// Vesperal — O Coveiro (subchefe da Cidade Cinzenta), redesenhado: um gigante de ombros largos e braços compridos,
// cabeça metida num saco de serapilheira cosido (um só olho de brasa, boca de pontos em cruz) atado com uma corda
// de enforcado; sobretudo de oleado negro-azulado com as mangas arregaçadas, avental de couro cor de sangue seco,
// botas enlameadas. Às costas, um cajado de pastor em ferro sobe acima da cabeça com uma lanterna-gaiola pendurada
// (a fraqueza: quando crava a pá no chão, as costas — e a lanterna — ficam expostas). Pá enorme com punho em D.
// Desenhado em unidades próprias e exportado a ×1.75 (cerca do dobro da altura da protagonista).
// → assets/sprites/en_b_coveiro.png
'use strict';
(function (A) {
  const S = 5, K = A.kit(S), D2R = A.D2R;
  const H = A.humanoid({ pelvis: 2.8, spine: 6.0, chest: 7.8, neck: 2.2, head: 5.0, thigh: 8.0, shin: 7.6, foot: 3.8, uarm: 7.8, farm: 7.6, hand: 2.8, shoulder: 0.74 });
  const rig = H.rig;
  const M = {
    coat: A.mat('#262a33', { shadow: '#14161c', light: '#4a5466', deep: '#08090c' }),
    trous: A.mat('#3a3028', { shadow: '#1e1814', light: '#5a4a3e' }),
    sack: A.mat('#b09a72', { shadow: '#6e5c40', light: '#e0cca0', deep: '#2e2416' }),
    apron: A.mat('#5c2620', { shadow: '#341410', light: '#86443a', deep: '#180806' }),
    skin: A.mat('#6c6660', { shadow: '#3a3632', light: '#948e84', deep: '#1c1a1a' }),
    wrap: A.mat('#574a3a', { shadow: '#33291e', light: '#7a6a54' }),
    wood: A.mat('#6e5236', { shadow: '#3c2c1c', light: '#a07c56', deep: '#1a120a' }),
    iron: A.mat('#5c5e66', { shadow: '#2c2d34', light: '#b8bcc6', deep: '#121318' }),
    boot: A.mat('#2a221e', { shadow: '#14100e', light: '#4a3e36' }),
    mud: A.mat('#4a3e2e', { shadow: '#2a2218', light: '#6a5a44' }),
    rope: A.mat('#9a8458', { shadow: '#5c4c30', light: '#c8b07c' }),
    leather: A.mat('#3e2a1e', { shadow: '#20140c', light: '#5e4430' }),
  };
  const BACK = 0.62;
  const SPADE = { tip: 26.6, gap: 12, minGap: 4 };
  function solve(pose) {
    const x = pose.extra, r = pose.root, sk = x.sink || 0;
    if (x.fF) H.leg(pose, 'F', [r[0] + x.fF[0], x.fF[1] + sk - 1.1], x.faF || 0);
    if (x.fB) H.leg(pose, 'B', [r[0] + x.fB[0], x.fB[1] + sk - 1.1], x.faB || 0);
    A.twoHand(H, pose, x, SPADE);
  }
  const pt = (B, t, w) => { const [x, y] = K.along(B, t), [nx, ny] = K.perp(B); return [x + nx * w, y + ny * w]; };

  // pá de coveiro: cabo grosso de freixo com punho em D cintado a ferro; lâmina larga com pisadeiras dobradas,
  // rebites e o gume gasto a brilhar; terra agarrada (x.load = pá cheia)
  function spade(ctx, x) {
    const g = x._g, d = x._d, n = [-d[1], d[0]];
    const at = (t, w = 0) => [g[0] + d[0] * t + n[0] * w, g[1] + d[1] * t + n[1] * w];
    // punho em D
    const dh = A.path((q) => { const a = at(-12.4, -0.9), b = at(-15.0, -2.2), c = at(-15.8, -2.2), e = at(-15.8, 2.2), f = at(-15.0, 2.2), h = at(-12.4, 0.9); q.M(a[0], a[1]); q.Q(at(-14.0, -2.4)[0], at(-14.0, -2.4)[1], b[0], b[1]); q.L(c[0], c[1]); q.L(e[0], e[1]); q.L(f[0], f[1]); q.Q(at(-14.0, 2.4)[0], at(-14.0, 2.4)[1], h[0], h[1]); q.L(at(-12.6, 0.5)[0], at(-12.6, 0.5)[1]); q.Q(at(-14.2, 1.6)[0], at(-14.2, 1.6)[1], at(-14.9, 1.5)[0], at(-14.9, 1.5)[1]); q.L(at(-14.9, -1.5)[0], at(-14.9, -1.5)[1]); q.Q(at(-14.2, -1.6)[0], at(-14.2, -1.6)[1], at(-12.6, -0.5)[0], at(-12.6, -0.5)[1]); q.Z(); }, S);
    K.paint(ctx, dh, M.wood, { depth: S * 0.25, hlw: S * 0.14 });
    K.tube(ctx, [at(-12.6), at(0), at(15.4)], [0.82, 0.78, 0.72], M.wood, { depth: S * 0.3, hlw: S * 0.14, flat: true });
    K.line(ctx, [at(-8, -0.2), at(10, -0.25)], 0.12, A.rgba(M.wood.deep, 0.5)); // veio
    for (const t of [-12.4, 14.2]) K.poly(ctx, [at(t - 0.7, -0.95), at(t + 0.7, -0.95), at(t + 0.7, 0.95), at(t - 0.7, 0.95)], M.iron, { depth: S * 0.15 });
    // alvado (frog) e lâmina
    K.poly(ctx, [at(14.8, -1.0), at(17.4, -1.6), at(21.4, -0.4), at(21.4, 0.4), at(17.4, 1.6), at(14.8, 1.0)], M.iron, { depth: S * 0.3, hlw: S * 0.15 });
    const blade = K.polyPath([at(16.2, -4.0), at(16.9, -4.5), at(24.6, -4.1), at(26.2, -2.8), at(26.8, -0.6), at(26.6, 1.4), at(25.8, 3.2), at(24.6, 4.1), at(16.9, 4.5), at(16.2, 4.0)]);
    K.paint(ctx, blade, M.iron, { depth: S * 0.55, hlw: S * 0.3 });
    ctx.save(); ctx.clip(blade);
    K.line(ctx, [at(16.6, -4.3), at(16.6, 4.3)], 0.55, A.rgba(M.iron.light, 0.6)); // pisadeira dobrada
    K.line(ctx, [at(17.2, -4.3), at(17.2, 4.3)], 0.18, A.rgba(M.iron.deep, 0.7));
    const dirt = ctx.createLinearGradient(at(19)[0] * S, at(19)[1] * S, at(27)[0] * S, at(27)[1] * S);
    dirt.addColorStop(0, 'rgba(58,44,30,0)'); dirt.addColorStop(0.7, 'rgba(58,44,30,0.6)'); dirt.addColorStop(1, 'rgba(58,44,30,0.2)');
    ctx.fillStyle = dirt; ctx.fill(blade);
    K.line(ctx, [at(26.0, -2.8), at(26.6, -0.6), at(26.4, 1.4), at(25.6, 3.2)], 0.3, A.rgba('#e8ecf2', 0.75)); // gume gasto
    for (const w of [-2.4, 2.4]) { K.dot(ctx, ...at(17.9, w), 0.32, M.iron.deep); K.dot(ctx, ...at(17.8, w - 0.1), 0.16, M.iron.light); }
    ctx.restore();
    if ((x.load || 0) > 0.05) { // terra na pá
      const k = x.load, b0 = at(20.5, -3.4 * k), b1 = at(25.0, -3.0 * k);
      K.blob(ctx, [at(18.0, -0.4), b0, at(22.6, -4.4 * k), b1, at(26.0, -0.6), at(22.0, 0.2)], M.mud, { depth: S * 0.4, hlw: S * 0.2 });
      for (const [t, w] of [[20, -2.6], [23, -3.4], [24.4, -1.8]]) K.dot(ctx, ...at(t, w * k), 0.4, M.mud.light);
    }
    x._tip = at(26.6, 0);
  }

  // cajado de pastor em ferro preso às costas; a lanterna-gaiola pendura do gancho, acima e atrás da cabeça
  function crook(ctx, W, x) {
    const C = W.chest, Sp = W.spine, back = (B, t, w) => pt(B, t, -w);
    const base = back(Sp, 0.05, 4.8), mid = back(C, 0.55, 6.6), sh = back(C, 1.05, 5.4);
    const ud = K.norm(sh[0] - mid[0], sh[1] - mid[1]);
    const top = [sh[0] + ud[0] * 13.0, sh[1] + ud[1] * 13.0], bd = K.perp(C), bk = [-bd[0], -bd[1]];
    const hk = [top[0] + bk[0] * 4.6 + ud[0] * 2.2, top[1] + bk[1] * 4.6 + ud[1] * 2.2], hend = [hk[0] + bk[0] * 2.8 - ud[0] * 1.2, hk[1] + bk[1] * 2.8 - ud[1] * 1.2];
    K.tube(ctx, [base, mid, sh, top, hk, hend], [0.6, 0.58, 0.55, 0.5, 0.46, 0.4], M.iron, { depth: S * 0.2, hlw: S * 0.12 });
    // correias de couro que o prendem
    for (const p of [mid, sh]) K.poly(ctx, [[p[0] - 1.0, p[1] - 0.6], [p[0] + 1.0, p[1] - 0.6], [p[0] + 1.0, p[1] + 0.6], [p[0] - 1.0, p[1] + 0.6]], M.leather, { depth: S * 0.15 });
    // lanterna
    const sw = (x.lsw || 0) * D2R, ch = 2.4;
    const lx = hend[0] + Math.sin(sw) * ch, ly = hend[1] + Math.cos(sw) * ch;
    K.line(ctx, [hend, [lx, ly]], 0.16, M.iron.light);
    ctx.save(); ctx.translate(lx * S, ly * S); ctx.rotate(-sw * 0.6);
    K.dot(ctx, 0, 0.3, 0.45, M.iron.shadow);
    K.poly(ctx, [[-1.9, 1.9], [1.9, 1.9], [0.9, 0.6], [-0.9, 0.6]], M.iron, { depth: S * 0.2 }); // tecto
    const cage = K.polyPath([[-1.8, 1.9], [1.8, 1.9], [1.9, 6.6], [-1.9, 6.6]]);
    ctx.fillStyle = (x.lit === undefined ? 1 : x.lit) > 0.2 ? '#e8a040' : '#3a2a20'; ctx.fill(cage);
    const gg = ctx.createRadialGradient(0, 4.4 * S, 0, 0, 4.4 * S, 2.6 * S); gg.addColorStop(0, A.rgba('#fff4d0', x.lit === undefined ? 1 : x.lit)); gg.addColorStop(1, 'rgba(255,160,60,0)'); ctx.fillStyle = gg; ctx.fill(cage);
    ctx.fillStyle = '#efe4c8'; ctx.fillRect(-0.45 * S, 4.2 * S, 0.9 * S, 2.2 * S); // vela
    ctx.lineWidth = S * 0.26; ctx.strokeStyle = '#121014'; ctx.stroke(cage);
    for (const bx of [-0.6, 0.6]) { ctx.beginPath(); ctx.moveTo(bx * S, 1.9 * S); ctx.lineTo(bx * 1.05 * S, 6.6 * S); ctx.stroke(); }
    K.poly(ctx, [[-2.2, 6.5], [2.2, 6.5], [1.7, 7.4], [-1.7, 7.4]], M.iron, { depth: S * 0.15 });
    ctx.restore();
    x._lantern = [lx, ly + 4.4];
  }
  function arm(ctx, W, side, back) {
    const U = W['uarm' + side], F = W['farm' + side], Hd = W['hand' + side];
    const dm = (m) => (back ? K.dim(m, BACK) : m);
    // antebraço nu (pele cinzenta, suja), braço dentro da manga arregaçada
    const fa = K.limb(ctx, [U.x, U.y], [F.x, F.y], [F.ex, F.ey], 3.0, 2.7, 2.2, dm(M.skin), { depth: S * 0.6, hlw: S * 0.3 });
    const p1 = [F.x, F.y], p2 = [F.ex, F.ey], dd = K.norm(p2[0] - p1[0], p2[1] - p1[1]);
    K.bands(ctx, fa, p1, p2, 2.9, 0.45, 0.95, 4, dm(M.wrap)); // ligaduras sujas no antebraço
    K.tube(ctx, [[U.x, U.y], K.along(U, 0.55), [F.x + dd[0] * 0.6, F.y + dd[1] * 0.6]], [3.6, 3.4, 3.0], dm(M.coat), { depth: S * 0.6, hlw: S * 0.3 });
    // manga enrolada no cotovelo
    const e = [F.x + dd[0] * 0.9, F.y + dd[1] * 0.9], en = [-dd[1], dd[0]];
    K.blob(ctx, [[e[0] + en[0] * 3.4, e[1] + en[1] * 3.4], [e[0] + dd[0] * 1.3 + en[0] * 2.8, e[1] + dd[1] * 1.3 + en[1] * 2.8], [e[0] + dd[0] * 1.4 - en[0] * 2.8, e[1] + dd[1] * 1.4 - en[1] * 2.8], [e[0] - en[0] * 3.4, e[1] - en[1] * 3.4], [e[0] - dd[0] * 0.6, e[1] - dd[1] * 0.6]], dm(M.coat), { depth: S * 0.3, hlw: S * 0.2 });
    // mão grande, nós dos dedos
    ctx.save(); A.boneT(ctx, Hd, S);
    K.blob(ctx, [[-1.0, -2.3], [2.6, -2.3], [3.9, -0.5], [3.1, 2.0], [-1.0, 1.9]], dm(M.skin), { depth: S * 0.5 });
    for (let i = 0; i < 3; i++) K.line(ctx, [[1.6 + i * 0.75, -2.0], [2.0 + i * 0.75, 1.7]], 0.14, A.rgba('#000', 0.4));
    ctx.restore();
  }
  function leg(ctx, W, side, back) {
    const T = W['thigh' + side], N = W['shin' + side], F = W['foot' + side];
    const dm = (m) => (back ? K.dim(m, BACK) : m);
    K.limb(ctx, [T.x, T.y], [N.x, N.y], [N.ex, N.ey], 3.5, 2.7, 2.2, dm(M.trous), { depth: S * 0.6 });
    const p1 = [N.x, N.y], p2 = [N.ex, N.ey], dd = K.norm(p2[0] - p1[0], p2[1] - p1[1]), nn = [-dd[1], dd[0]], L = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]);
    const at = (t, w) => [p1[0] + dd[0] * L * t + nn[0] * w, p1[1] + dd[1] * L * t + nn[1] * w];
    // bota alta enlameada com tiras de pano
    const boot = K.poly(ctx, [at(0.3, 2.7), at(1.06, 2.3), at(1.06, -2.3), at(0.3, -2.7)], dm(M.boot), { depth: S * 0.45, hlw: S * 0.2 });
    K.bands(ctx, boot, at(0.3, 0), at(1.0, 0), 2.6, 0.08, 0.5, 3, dm(M.mud));
    ctx.save(); A.boneT(ctx, F, S);
    K.blob(ctx, [[-2.0, -1.8], [2.2, -1.6], [4.8, -0.4], [4.8, 1.2], [-2.1, 1.3]], dm(M.boot), { depth: S * 0.5 });
    K.line(ctx, [[-2.1, 1.2], [4.8, 1.1]], 0.55, '#0e0a09');
    const md = K.blobPath([[-1.6, 0.0], [2.4, -0.6], [4.6, 0.4], [4.4, 1.2], [-1.8, 1.2]]); ctx.fillStyle = A.rgba(M.mud.base, 0.75); ctx.fill(md);
    ctx.restore();
  }
  // tronco: sobretudo de oleado (corcunda de ombros largos), abas compridas, avental de couro, correias e cinto
  function torso(ctx, W, x) {
    const Sp = W.spine, C = W.chest, Pv = W.pelvis;
    const [snx, sny] = K.perp(Sp), sw = x.sway || 0;
    const [px, py] = K.along(Pv, 0.15);
    // aba de trás do sobretudo
    const tail = A.path((q) => { const a = [px - snx * 4.6, py - sny * 4.6 - 2]; q.M(a[0], a[1]); q.Q(a[0] - 2.4 + sw * 0.4, a[1] + 6, a[0] - 3.0 + sw, a[1] + 12.4); q.L(a[0] + 1.0 + sw * 0.8, a[1] + 12.0); q.L(a[0] + 2.6 + sw * 0.6, a[1] + 11.0); q.Q(a[0] + 3.4, a[1] + 6, a[0] + 4.4, a[1] - 0.4); q.Z(); }, S);
    K.paint(ctx, tail, M.coat, { depth: S * 0.8, hlw: S * 0.3 });
    ctx.save(); ctx.clip(tail); for (let i = 0; i < 3; i++) K.line(ctx, [[px - snx * 4.6 + i * 1.2, py - 1], [px - snx * 4.6 - 1.8 + i * 1.4 + sw, py + 10]], 0.3, A.rgba(M.coat.deep, 0.6)); ctx.restore();
    const body = H.torsoPath(W, [['pelvis', 0.15, 5.0, 4.8], ['spine', 0.2, 5.2, 5.4], ['spine', 0.75, 6.2, 6.8], ['chest', 0.45, 7.0, 7.8], ['chest', 0.85, 6.2, 7.8], ['chest', 1.08, 3.6, 6.2]], S);
    K.paint(ctx, body, M.coat, { depth: S * 1.3, hlw: S * 0.55 });
    ctx.save(); ctx.clip(body);
    // brilho de oleado nas costas e vincos
    K.line(ctx, [pt(C, 0.2, -5.0), pt(C, 0.9, -5.4)], 0.6, A.rgba(M.coat.light, 0.35));
    for (const t of [0.3, 0.7]) K.line(ctx, [pt(Sp, t, -4.6), pt(Sp, t + 0.15, 1.0)], 0.2, A.rgba(M.coat.deep, 0.6));
    ctx.restore();
    // aba da frente do sobretudo
    const front = A.path((q) => { const a = [px + snx * 4.6, py + sny * 4.6 - 1.4]; q.M(a[0], a[1]); q.Q(a[0] + 1.6, a[1] + 5, a[0] + 1.0 + sw * 0.4, a[1] + 10.4); q.L(a[0] - 3.0 + sw * 0.6, a[1] + 10.8); q.L(a[0] - 4.8, a[1] + 1.0); q.Z(); }, S);
    K.paint(ctx, front, M.coat, { depth: S * 0.7, hlw: S * 0.3 });
    // avental de couro
    const a0 = pt(C, 0.75, 2.6), a1 = pt(C, 0.75, 5.4), b1 = [px + snx * 6.0 + 0.6 + sw * 0.3, py + 9.4], b0 = [px + snx * 0.6 + sw * 0.3, py + 9.8];
    const apron = A.path((q) => { q.M(a0[0], a0[1]); q.L(a1[0], a1[1]); q.Q(...pt(Sp, 0.5, 6.4), ...pt(Sp, 0.05, 5.6)); q.Q(px + snx * 6.4, py + 4, b1[0], b1[1]); q.L(b0[0], b0[1]); q.Q(px + snx * 0.6, py, ...pt(Sp, 0.5, 2.0)); q.Z(); }, S);
    K.paint(ctx, apron, M.apron, { depth: S * 0.8, hlw: S * 0.35 });
    ctx.save(); ctx.clip(apron);
    const ag = ctx.createLinearGradient(0, (py - 4) * S, 0, (py + 10) * S); ag.addColorStop(0, 'rgba(40,28,18,0)'); ag.addColorStop(1, 'rgba(40,28,18,0.55)'); ctx.fillStyle = ag; ctx.fill(apron);
    K.line(ctx, [pt(Sp, 0.35, 5.6), pt(Sp, 0.35, 3.0)], 0.22, A.rgba(M.apron.deep, 0.8)); // bolso
    for (let i = 0; i < 5; i++) K.dot(ctx, ...pt(Sp, 0.35 - i * 0.0, 3.4 + i * 0.5), 0.12, A.rgba(M.apron.light, 0.7));
    ctx.restore();
    // correias cruzadas (prendem o cajado)
    K.line(ctx, [pt(C, 1.0, -4.6), pt(C, 0.35, 5.4)], 0.75, M.leather.shadow);
    K.line(ctx, [pt(C, 1.0, -4.6), pt(C, 0.35, 5.4)], 0.35, M.leather.light);
    K.poly(ctx, [pt(C, 0.62, 1.2), pt(C, 0.62, 2.6), pt(C, 0.5, 2.6), pt(C, 0.5, 1.2)], M.iron, { depth: S * 0.12 });
    // cinto largo com chapas de sepultura a tilintar
    const bl = pt(Sp, 0.05, -5.0), br = pt(Sp, 0.05, 5.6);
    K.line(ctx, [bl, br], 1.1, '#17110e');
    K.poly(ctx, [[br[0] - 2.6, br[1] - 0.9], [br[0] - 1.2, br[1] - 0.9], [br[0] - 1.2, br[1] + 0.7], [br[0] - 2.6, br[1] + 0.7]], M.iron, { depth: S * 0.15 });
    for (let i = 0; i < 3; i++) { const p = [A.lerp(bl[0], br[0], 0.25 + i * 0.12), A.lerp(bl[1], br[1], 0.25 + i * 0.12) + 0.4]; K.line(ctx, [p, [p[0] + sw * 0.3, p[1] + 1.4]], 0.12, M.iron.light); K.poly(ctx, [[p[0] - 0.5 + sw * 0.3, p[1] + 1.4], [p[0] + 0.5 + sw * 0.3, p[1] + 1.4], [p[0] + 0.5 + sw * 0.3, p[1] + 2.6], [p[0] - 0.5 + sw * 0.3, p[1] + 2.6]], M.iron, { depth: S * 0.1 }); }
  }
  // capelo de oleado sobre os ombros (alarga a silhueta: ombros de gigante), bainha esfarrapada
  function capelet(ctx, W, x) {
    const C = W.chest, sw = x.sway || 0;
    const top = pt(C, 1.12, -0.6), f1 = pt(C, 0.95, 6.8), f2 = pt(C, 0.42, 7.6), b2 = pt(C, 0.36, -8.6), b1 = pt(C, 0.95, -8.2);
    const hem = [];
    for (let i = 0; i <= 6; i++) { const k = i / 6; const p = [A.lerp(f2[0], b2[0], k), A.lerp(f2[1], b2[1], k)]; hem.push([p[0] + sw * 0.25 * k, p[1] + (i % 2 ? -0.9 : 0.6)]); }
    const cap = A.path((q) => { q.M(top[0], top[1]); q.Q(f1[0] + 0.6, f1[1] - 0.6, f2[0], f2[1]); hem.forEach((p) => q.L(p[0], p[1])); q.Q(b1[0] - 0.6, b1[1] - 0.8, top[0], top[1]); q.Z(); }, S);
    K.paint(ctx, cap, M.coat, { depth: S * 1.0, hlw: S * 0.5, light: [0.5, -1] });
    ctx.save(); ctx.clip(cap);
    for (let i = 1; i < 6; i++) K.line(ctx, [pt(C, 1.05, -6 + i * 2.2), [hem[i][0], hem[i][1]]], 0.22, A.rgba(M.coat.deep, 0.55));
    K.line(ctx, [pt(C, 0.95, -6.8), pt(C, 1.08, 2.0)], 0.7, A.rgba(M.coat.light, 0.3));
    ctx.restore();
  }
  // cabeça: saco de serapilheira cosido, um olho rasgado com brasa, boca de pontos em cruz; corda de enforcado
  function head(ctx, W, x) {
    const Hd = W.head;
    ctx.save(); A.boneT(ctx, Hd, S); ctx.rotate(Math.PI / 2); ctx.translate(0.6 * S, 0.8 * S); ctx.scale(0.86, 0.86);
    // ponta atada do saco
    K.blob(ctx, [[-2.0, -6.0], [-1.2, -6.4], [-1.6, -8.0], [-2.6, -8.6], [-3.0, -7.6], [-2.6, -6.4]], M.sack, { depth: S * 0.3 });
    K.line(ctx, [[-2.6, -6.6], [-1.2, -6.8]], 0.32, M.rope.shadow);
    for (const [a, b] of [[[-2.4, -8.4], [-2.9, -9.6]], [[-2.0, -8.5], [-1.7, -9.7]], [[-2.8, -8.0], [-3.8, -8.6]]]) K.line(ctx, [a, b], 0.14, M.sack.shadow);
    const sack = K.blob(ctx, [[-3.4, 1.4], [-3.9, -2.2], [-3.0, -5.4], [-1.2, -6.8], [1.4, -6.8], [3.4, -5.4], [4.5, -2.8], [4.6, -0.2], [3.4, 1.6], [-0.8, 2.0]], M.sack, { depth: S * 0.8, hlw: S * 0.4, light: [0.6, -1] });
    ctx.save(); ctx.clip(sack);
    for (let i = -10; i <= 10; i++) { K.line(ctx, [[i * 0.6, -7], [i * 0.6 + 0.4, 2.2]], 0.06, A.rgba(M.sack.deep, 0.22)); K.line(ctx, [[-4, -6.6 + (i + 10) * 0.45], [5, -6.4 + (i + 10) * 0.45]], 0.05, A.rgba(M.sack.deep, 0.16)); }
    for (const [sx, sy, sr] of [[-1.8, -1.0, 1.6], [3.2, 0.6, 1.0], [0.4, -5.6, 0.9]]) { const st = ctx.createRadialGradient(sx * S, sy * S, 0, sx * S, sy * S, sr * S); st.addColorStop(0, 'rgba(60,44,28,0.55)'); st.addColorStop(1, 'rgba(60,44,28,0)'); ctx.fillStyle = st; ctx.fillRect((sx - sr) * S, (sy - sr) * S, sr * 2 * S, sr * 2 * S); }
    // costura de trás
    K.line(ctx, [[-1.0, -6.6], [-1.6, 1.8]], 0.16, A.rgba(M.sack.deep, 0.7));
    for (let i = 0; i < 7; i++) { const y = -6.0 + i * 1.1, xx = -1.05 - i * 0.08; K.line(ctx, [[xx - 0.4, y - 0.3], [xx + 0.4, y + 0.3]], 0.12, A.rgba(M.sack.deep, 0.8)); }
    // olho rasgado com brasa
    const eo = K.blobPath([[1.6, -3.9], [2.7, -4.3], [3.6, -3.7], [3.4, -2.6], [2.2, -2.5], [1.5, -3.0]]); ctx.fillStyle = '#0c0808'; ctx.fill(eo);
    K.ember(ctx, 2.6, -3.3, 0.55, x.eye === undefined ? 1 : x.eye, '#ffb84a');
    for (const [a, b] of [[[1.6, -3.9], [1.2, -4.4]], [[3.6, -3.7], [4.1, -4.1]], [[3.4, -2.6], [3.8, -2.2]]]) K.line(ctx, [a, b], 0.1, A.rgba(M.sack.deep, 0.8));
    // boca cosida em cruz
    const mo = x.mouth || 0;
    K.line(ctx, [[1.4, -0.6 + mo * 0.2], [2.6, -0.3 + mo * 0.5], [4.0, -0.8 + mo * 0.2]], 0.16, A.rgba(M.sack.deep, 0.9));
    for (let i = 0; i < 4; i++) { const xx = 1.7 + i * 0.7, y = -0.55 + (i === 1 || i === 2 ? mo * 0.45 : mo * 0.2); K.line(ctx, [[xx - 0.3, y - 0.45], [xx + 0.3, y + 0.45]], 0.12, '#2a2014'); K.line(ctx, [[xx + 0.3, y - 0.45], [xx - 0.3, y + 0.45]], 0.12, '#2a2014'); }
    ctx.restore();
    // corda de enforcado: voltas ao pescoço, nó atrás e a ponta pendurada
    const sw = x.sway || 0;
    for (let i = 0; i < 3; i++) { const y = 0.6 + i * 0.6; K.line(ctx, [[-3.6, y + 0.1], [0.4, y + 0.4], [4.0, y - 0.1]], 0.42, M.rope.shadow); K.line(ctx, [[-3.6, y], [0.4, y + 0.3], [4.0, y - 0.2]], 0.2, M.rope.light); }
    K.blob(ctx, [[-4.6, 0.4], [-3.4, 0.2], [-3.2, 2.2], [-4.4, 2.6], [-5.0, 1.6]], M.rope, { depth: S * 0.3 });
    K.tube(ctx, [[-4.4, 2.2], [-4.9 + sw * 0.3, 4.4], [-5.2 + sw * 0.8, 6.6]], [0.32, 0.3, 0.26], M.rope, { depth: S * 0.15 });
    ctx.restore();
  }
  function draw(ctx, W, x) {
    const clip = (x.sink || 0) > 0.01;
    if (clip) { ctx.save(); ctx.beginPath(); ctx.rect(-500 * S, -500 * S, 1000 * S, 500.4 * S); ctx.clip(); }
    crook(ctx, W, x);
    arm(ctx, W, 'B', true);
    leg(ctx, W, 'B', true);
    torso(ctx, W, x);
    leg(ctx, W, 'F', false);
    capelet(ctx, W, x);
    head(ctx, W, x);
    spade(ctx, x);
    arm(ctx, W, 'F', false);
    if (clip) ctx.restore();
  }
  // brilho da lanterna sem tinta por cima
  function overlay(ctx, W, x) {
    const L = x._lantern; if (!L || (x.sink || 0) > 14) return;
    const k = x.lit === undefined ? 1 : x.lit; if (k <= 0.05) return;
    A.glow(ctx, L[0] * S, L[1] * S, 7 * S, '#ffb050', 0.35 * k);
    A.glow(ctx, L[0] * S, L[1] * S, 2.2 * S, '#fff2c8', 0.7 * k);
  }
  function points(W, x) {
    const Hh = W.head, ca = Math.cos(Hh.a * D2R), sa = Math.sin(Hh.a * D2R);
    const sk = x.sink || 0;
    return { tip: x._tip, eye: [Hh.x + ca * 2.04 - sa * 2.84, Hh.y + sa * 2.04 + ca * 2.84], light: x._lantern, grip: x._g, sink: [sk, 0] };
  }

  // postura: tronco largo inclinado para a frente, sem se dobrar ao meio
  const STANCE = { pelvis: 0, spine: 8, chest: 10, neck: 34, head: -46 };
  const RY = -14.4;
  const P = (a, x, root) => A.pose(A.addA(STANCE, a || {}), x, root || [0, RY]);
  // pronto: pá na diagonal à frente, com a lâmina rente ao chão
  const base = (o = {}) => Object.assign({ fF: [5.2, 0], fB: [-5.0, 0], g: [8.0, 14.2], wa: 40, tgK: 0.9, tgY: -0.6, gap: 9, sway: 0, lsw: 0, eye: 1, mouth: 0, load: 0, sink: 0 }, o);
  function anims() {
    const R = {};
    R.idle = { n: 6, fps: 5, loop: true, keys: [[0, P({}, base({ lsw: -8 }))], [0.5, P({ spine: 2, chest: 3, neck: 1 }, base({ g: [6.0, 12.8], lsw: 8, sway: 0.5, mouth: 0.25 }), [0, RY + 0.35])], [1, P({}, base({ lsw: -8 }))]] };
    R.move = { n: 8, fps: 7, loop: true, stride: 15, poseFn: (t) => { const f = A.stepFeet(t, { stride: 4.6, lift: 1.9 }); const s = Math.sin(t * A.TAU), c = Math.cos(t * A.TAU); return P({ spine: 2 + c * 1.5, chest: s * 1.5, head: -s * 1.5 }, base({ fF: f.F, fB: f.B, faF: f.F[1] < 0 ? 10 : 0, faB: f.B[1] < 0 ? 10 : 0, g: [6.2, 12.0 + s * 0.4], tgK: 0.75, tgY: -1.4, lsw: -c * 16, sway: -c }), [0.4, RY + Math.abs(s) * 0.6]); } };

    // GOLPE DE CIMA (branco): a pá vai para trás do ombro com os joelhos a fletir; passa por cima da cabeça
    // e crava-se no chão à frente com as ancas em baixo — fica presa (costas e lanterna expostas)
    const LIFT = P({ spine: -2, chest: -2 }, base({ g: [4.0, 3.0], wa: -30, tgK: 0, lsw: 8 }), [-0.4, RY]);
    const COCK = P({ spine: -9, chest: -11, neck: 2, head: -8 }, base({ g: [-2.4, -8.0], wa: -166, tgK: 0, fF: [6.2, 0], fB: [-5.6, 0], bF: 1, lsw: 22, mouth: 0.6, eye: 1.5 }), [-1.4, RY + 0.8]);
    const TOP = P({ spine: -5, chest: -6, head: -10 }, base({ g: [2.6, -13.0], wa: -90, tgK: 0, fF: [6.4, 0], fB: [-5.6, 0], lsw: 10, mouth: 0.9, eye: 1.6 }), [-0.2, RY + 0.2]);
    const HIT = P({ spine: 12, chest: 8, neck: 4, head: -10 }, base({ g: [11.0, 9.4], wa: 30, tgK: 1, tgY: 0.4, gap: 9, fF: [7.2, 0], fB: [-6.2, 0], lsw: -26, mouth: 1, eye: 1.8 }), [2.4, RY + 3.0]);
    const STUCK = P({ spine: 14, chest: 10, neck: 6, head: -12 }, base({ g: [10.2, 9.8], wa: 30, tgK: 1, tgY: 0.6, gap: 9, fF: [7.2, 0], fB: [-6.2, 0], lsw: -6, mouth: 0.6, eye: 0.8, sway: -0.6 }), [1.6, RY + 3.2]);
    const TUG = P({ spine: 6, chest: 2, neck: 6, head: -16 }, base({ g: [8.6, 9.0], wa: 30, tgK: 1, tgY: 0.6, gap: 9, fF: [7.0, 0], fB: [-6.2, 0], lsw: 12, mouth: 1, eye: 1.2, sway: 0.6 }), [0.2, RY + 2.6]);
    const BACKR = P({}, base({ wa: 40 }));
    const DOWN = P({ spine: 4, chest: 0, head: -12 }, base({ g: [8.4, -5.0], wa: -24, tgK: 0, fF: [6.8, 0], fB: [-5.8, 0], lsw: -6, mouth: 1, eye: 1.7 }), [1.0, RY + 1.4]);
    // fotogramas 0–4 antecipação (até ao topo), 5–6 golpe (a descer e a cravar), 7–12 preso e recuperação
    R.atk_slam = { n: 13, fps: 10, phases: [5, 2], keys: [[0, P({}, base())], [0.1, LIFT], [0.2, COCK], [0.27, COCK], [0.34, TOP], [0.417, DOWN], [0.5, HIT], [0.6, STUCK], [0.72, TUG], [0.84, STUCK], [1, BACKR]] };

    // VARRIDA RENTE (sem sinal): torce-se para trás com a pá baixa e raspa o chão de trás para a frente
    const SW_W = P({ spine: -6, chest: -12, neck: 4, head: -14 }, base({ g: [-7.0, 9.4], wa: 170, tgK: 0.5, tgY: -2.0, fF: [6.0, 0], fB: [-5.4, 0], lsw: 18, mouth: 0.4 }), [-1.6, RY + 0.8]);
    const SW_M = P({ spine: 4, chest: 2 }, base({ g: [3.0, 11.0], wa: 100, tgK: 1, tgY: -0.4, fF: [6.4, 0], fB: [-5.6, 0], lsw: 0, mouth: 0.8 }), [0.4, RY + 1.6]);
    const SW_A = P({ spine: 12, chest: 8, neck: 2 }, base({ g: [11.0, 6.4], wa: 14, tgK: 0.25, tgY: -3.0, fF: [7.0, 0], fB: [-5.8, 0], lsw: -26, mouth: 1 }), [2.2, RY + 2.2]);
    const SW_F = P({ spine: 8, chest: 2 }, base({ g: [9.6, 1.0], wa: -24, tgK: 0, fF: [7.0, 0], fB: [-5.8, 0], lsw: -14, mouth: 0.6 }), [1.8, RY + 1.6]);
    R.atk_sweep = { n: 10, fps: 12, phases: [4, 2], keys: [[0, P({}, base())], [0.3, SW_W], [0.38, SW_W], [0.46, SW_M], [0.56, SW_A], [0.7, SW_F], [1, P({}, base({ wa: 40 }))]] };

    // TERRA: crava a pá, enche-a e atira a terra por cima, para a frente
    const DIG = P({ spine: 12, chest: 8, neck: 4 }, base({ g: [9.4, 8.0], wa: 64, tgK: 1, tgY: 1.6, fF: [6.4, 0], fB: [-5.4, 0], lsw: -14, mouth: 0.6 }), [1.8, RY + 2.4]);
    const LOAD = P({ spine: 6, chest: 2 }, base({ g: [7.0, 5.6], wa: 22, tgK: 0, load: 1, fF: [6.4, 0], fB: [-5.4, 0], lsw: 4 }), [0.8, RY + 1.6]);
    const BACKL = P({ spine: -4, chest: -8 }, base({ g: [1.6, 3.0], wa: 30, tgK: 0, load: 1, fF: [6.4, 0], fB: [-5.4, 0], lsw: 16, mouth: 0.6 }), [-0.8, RY + 1.0]);
    const FLING = P({ spine: 2, chest: -10, head: -14 }, base({ g: [6.4, -8.4], wa: -58, tgK: 0, load: 0, fF: [6.6, 0], fB: [-5.4, 0], lsw: -18, mouth: 1 }), [1.0, RY]);
    R.atk_clods = { n: 10, fps: 10, phases: [5, 1], keys: [[0, P({}, base())], [0.2, DIG], [0.34, LOAD], [0.46, BACKL], [0.56, FLING], [0.7, FLING], [1, P({}, base({ wa: 40 }))]] };

    // ENTERRAR-SE (vermelho): ergue a pá de lâmina para baixo, crava-a a pique e afunda-se na terra
    const RAISE = P({ spine: -4, chest: -6 }, base({ g: [5.0, -9.0], wa: 90, tgK: 0, fF: [5.4, 0], fB: [-5.0, 0], lsw: 16, mouth: 1, eye: 1.8 }), [-0.4, RY + 0.4]);
    const STAB = P({ spine: 14, chest: 8 }, base({ g: [7.4, 6.0], wa: 88, tgK: 1, tgY: 3.0, fF: [5.8, 0], fB: [-5.0, 0], lsw: -10, mouth: 1.2, eye: 2 }), [1.2, RY + 4.0]);
    const SINK1 = P({ spine: 16, chest: 10 }, base({ g: [7.0, 2.0], wa: 88, tgK: 0, fF: [5.4, 0], fB: [-4.6, 0], sink: 12, lsw: 20, eye: 2 }), [1.2, RY + 4.0 + 12]);
    const SINK2 = P({ spine: 18, chest: 10 }, base({ g: [6.0, -2.0], wa: 90, tgK: 0, fF: [5.0, 0], fB: [-4.6, 0], sink: 30, lsw: 30, eye: 2 }), [1.2, RY + 4.0 + 30]);
    R.atk_burrow = { n: 10, fps: 10, phases: [7, 1], keys: [[0, P({}, base())], [0.25, RAISE], [0.42, STAB], [0.7, SINK1], [1, SINK2]] };
    // SAIR DA TERRA: irrompe com a pá erguida
    const UP0 = P({ spine: -6, chest: -10, head: -16 }, base({ g: [3.0, -12.0], wa: 266, tgK: 0, sink: 26, lsw: -20, mouth: 1.2, eye: 2 }), [0, RY + 26]);
    const UP1 = P({ spine: -8, chest: -12, head: -14 }, base({ g: [3.0, -12.0], wa: 266, tgK: 0, sink: 6, lsw: 24, mouth: 1.2, eye: 2 }), [0, RY + 6]);
    R.emerge = { n: 6, fps: 10, keys: [[0, UP0], [0.45, UP1], [0.7, P({ spine: -4 }, base({ g: [4.0, -4.0], wa: 300, tgK: 0, lsw: -10, mouth: 0.8 }), [0, RY + 1.2])], [1, P({}, base({ wa: 400 }))]] };

    R.hurt = { n: 3, fps: 12, keys: [[0, P({ spine: -10, chest: -8, neck: -4, head: -10 }, base({ g: [4.4, 8.0], wa: 58, tgK: 0.6, lsw: 30, mouth: 1, eye: 1.8 }), [-1.2, RY])], [1, P({}, base())]] };
    R.stagger = { n: 4, fps: 6, loop: true, poseFn: (t) => { const s = Math.sin(t * A.TAU); return P({ spine: 14 + s * 2, chest: 12, neck: 14, head: -4 + s * 4 }, base({ g: [7.6, 4.6], wa: 84, tgK: 1, tgY: 0.2, gap: 6, lsw: s * 22, mouth: 1, eye: 0.5, sway: s }), [0.8, RY + 2.2]); } };
    R.death = { n: 10, fps: 6, keys: [
      [0, P({ spine: -12, chest: -10, neck: -6, head: -18 }, base({ g: [5.0, 4.0], wa: 74, tgK: 1, mouth: 1.4, eye: 2 }), [-0.8, RY])],
      [0.35, P({ spine: 10, chest: 10, neck: 10 }, base({ g: [7.6, 0.0], wa: 88, tgK: 1, tgY: 0.4, gap: 6, fF: [6.2, -0.2], fB: [-4.0, 0], faB: 60, mouth: 1, eye: 1.2, lsw: 20 }), [0.8, RY + 6.4])],
      [0.6, P({ spine: 20, chest: 20, neck: 20, head: 0 }, base({ g: [8.0, 2.0], wa: 88, tgK: 1, tgY: 0.4, gap: 5, fF: [6.2, -0.2], fB: [-4.0, 0], faB: 60, mouth: 0.6, eye: 0.6, lsw: -20, lit: 0.8 }), [0.8, RY + 7.0])],
      [1, P({ spine: 70, chest: 14, neck: 10, head: -6 }, base({ g: [10.0, 4.0], wa: 10, tgK: 1, tgY: 0.2, gap: 5, fF: [6.4, 0], fB: [-3.0, 0], faB: 70, mouth: 0.4, eye: 0, lsw: 50, lit: 0.3 }), [2.4, RY + 9.4])]] };
    return R;
  }
  A.register('en_b_coveiro', () => A.creature({ name: 'en_b_coveiro', S, unit: 1.75, box: [140, 98], anchor: [64, 88], rig, solve, draw, overlay, points, anims: anims(), post: K.post('#a8b8d4', 0.32, 0.04) }));
  (A.previewCell = A.previewCell || {}).en_b_coveiro = [150, 140];
})(window.ART);
