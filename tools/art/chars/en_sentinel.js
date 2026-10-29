// Vesperal — Sentinela (sentinel): soldado morto da guarda do Bastião, morrião de crista, peitoral amolgado sobre
// gibão cor de vinho desbotado. Pavês alto pintado com o sol da rainha (mão de perto) e lança curta (mão de longe).
// Guarda-se atrás do pavês; estoca por cima dele (aparável) e empurra com o escudo. → assets/sprites/en_sentinel.png
'use strict';
(function (A) {
  const S = 4, K = A.kit(S), D2R = A.D2R;
  const H = A.humanoid({ spine: 4.8, chest: 4.8, neck: 1.3, head: 4.2, thigh: 6.6, shin: 6.5, foot: 2.8, uarm: 4.8, farm: 4.5, hand: 1.7 });
  const rig = H.rig;
  const M = {
    skin: A.mat('#8e8a90', { shadow: '#4e4a52', light: '#bab4b8', deep: '#26232a' }),
    steel: A.mat('#5d5f6a', { shadow: '#2e2f37', light: '#a8acba', deep: '#16171c' }),
    rust: '#6a3c22',
    wine: A.mat('#5a2c32', { shadow: '#341a1e', light: '#7e4249' }),
    leather: A.mat('#3e3029', { shadow: '#231a16', light: '#5e4a40' }),
    wood: A.mat('#5a4430', { shadow: '#33261a', light: '#866a4c' }),
    paint: A.mat('#7a6a46', { shadow: '#4a3e28', light: '#a8946a' }),
    sun: A.mat('#c09040', { shadow: '#7a5a22', light: '#ecc878' }),
  };
  const BACK = 0.66;

  function solve(pose) {
    const x = pose.extra, r = pose.root;
    if (x.fF) H.leg(pose, 'F', [r[0] + x.fF[0], x.fF[1] - 0.85], x.faF || 0);
    if (x.fB) H.leg(pose, 'B', [r[0] + x.fB[0], x.fB[1] - 0.85], x.faB || 0);
    const W = rig.solve(pose);
    if (x.sh) H.arm(pose, 'F', [W.uarmF.x + x.sh[0], W.uarmF.y + x.sh[1]], x.shA === undefined ? -90 : x.shA, x.bF || 1);
    if (x.sp) H.arm(pose, 'B', [W.uarmB.x + x.sp[0], W.uarmB.y + x.sp[1]], x.spA === undefined ? 0 : x.spA, x.bB || 1);
  }
  function pt(B, t, w) { const [x, y] = K.along(B, t), [nx, ny] = K.perp(B); return [x + nx * w, y + ny * w]; }

  // lança curta: haste de freixo, ponta de folha, borla gasta
  function spear(ctx, W, x) {
    const Hd = W.handB, a = (x.spA || 0) * D2R, d = [Math.cos(a), Math.sin(a)], n = [-d[1], d[0]];
    const g = [Hd.x + Math.cos(Hd.a * D2R) * 0.9, Hd.y + Math.sin(Hd.a * D2R) * 0.9];
    const at = (t, w = 0) => [g[0] + d[0] * t + n[0] * w, g[1] + d[1] * t + n[1] * w];
    K.tube(ctx, [at(-9), at(0), at(13)], [0.34, 0.34, 0.3], K.dim(M.wood, 0.85), { depth: S * 0.2, hlw: S * 0.1, flat: true });
    const head = K.polyPath([at(12.6, -0.5), at(14.6, -1.0), at(18.2, 0), at(14.6, 1.0), at(12.6, 0.5)]);
    K.paint(ctx, head, M.steel, { depth: S * 0.3, hlw: S * 0.2 });
    K.line(ctx, [at(13.2), at(17.4)], 0.12, A.rgba('#16171c', 0.7));
    const ts = (x.sway || 0) * 0.8;
    const tassel = A.path((q) => { const t0 = at(12.4, -0.2); q.M(t0[0], t0[1]); q.Q(t0[0] - 0.4, t0[1] + 1.6, t0[0] - 0.8 + ts, t0[1] + 2.8); q.L(t0[0] + 0.3 + ts, t0[1] + 2.6); q.Q(t0[0] + 0.5, t0[1] + 1.4, t0[0] + 0.4, t0[1]); q.Z(); }, S);
    K.paint(ctx, tassel, M.wine, { depth: S * 0.2 });
    x._tip = at(18.2);
  }
  function arm(ctx, W, side, back) {
    const U = W['uarm' + side], F = W['farm' + side], Hd = W['hand' + side];
    K.limb(ctx, [U.x, U.y], [F.x, F.y], [F.ex, F.ey], 1.05, 0.85, 0.7, back ? K.dim(M.wine, BACK) : M.wine, { depth: S * 0.45 });
    // braçal de ferro
    const p1 = [F.x, F.y], p2 = [F.ex, F.ey], dd = K.norm(p2[0] - p1[0], p2[1] - p1[1]), nn = [-dd[1], dd[0]], L = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]);
    const at = (t, w) => [p1[0] + dd[0] * L * t + nn[0] * w, p1[1] + dd[1] * L * t + nn[1] * w];
    K.poly(ctx, [at(0.35, 1.0), at(1.0, 0.9), at(1.0, -0.9), at(0.35, -1.0)], back ? K.dim(M.steel, BACK) : M.steel, { depth: S * 0.3, hlw: S * 0.15 });
    // espaldar redondo no ombro
    const [sx, sy] = K.along(U, 0.12);
    K.blob(ctx, [[sx - 1.6, sy - 0.6], [sx, sy - 1.6], [sx + 1.6, sy - 0.5], [sx + 1.3, sy + 1.3], [sx - 1.3, sy + 1.2]], back ? K.dim(M.steel, BACK) : M.steel, { depth: S * 0.35, hlw: S * 0.2 });
    ctx.save(); A.boneT(ctx, Hd, S);
    K.blob(ctx, [[-0.3, -0.8], [1.0, -0.8], [1.6, -0.1], [1.2, 0.7], [-0.3, 0.6]], back ? K.dim(M.leather, BACK) : M.leather, { depth: S * 0.25 });
    ctx.restore();
  }
  function leg(ctx, W, side, back) {
    const T = W['thigh' + side], N = W['shin' + side], F = W['foot' + side];
    K.limb(ctx, [T.x, T.y], [N.x, N.y], [N.ex, N.ey], 1.45, 1.05, 0.8, back ? K.dim(M.wine, BACK) : M.wine, { depth: S * 0.5 });
    // botas altas de couro e joelheira
    const p1 = [N.x, N.y], p2 = [N.ex, N.ey], dd = K.norm(p2[0] - p1[0], p2[1] - p1[1]), nn = [-dd[1], dd[0]], L = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]);
    const at = (t, w) => [p1[0] + dd[0] * L * t + nn[0] * w, p1[1] + dd[1] * L * t + nn[1] * w];
    K.poly(ctx, [at(0.25, 1.25), at(1.05, 1.0), at(1.05, -1.0), at(0.25, -1.3)], back ? K.dim(M.leather, BACK) : M.leather, { depth: S * 0.4, hlw: S * 0.2 });
    K.blob(ctx, [[N.x - 0.9, N.y - 0.6], [N.x + 0.4, N.y - 1.0], [N.x + 1.2, N.y + 0.2], [N.x + 0.2, N.y + 1.0], [N.x - 0.8, N.y + 0.6]], back ? K.dim(M.steel, BACK) : M.steel, { depth: S * 0.3 });
    ctx.save(); A.boneT(ctx, F, S);
    K.blob(ctx, [[-1.0, -1.0], [1.4, -0.9], [2.9, -0.2], [2.9, 0.7], [-1.1, 0.8]], back ? K.dim(M.leather, BACK) : M.leather, { depth: S * 0.35 });
    K.line(ctx, [[-1.1, 0.7], [2.9, 0.6]], 0.3, '#120d0b');
    ctx.restore();
  }
  // peitoral de aço amolgado com ferrugem; faldas de lâminas sobre o gibão
  function torso(ctx, W, x) {
    const gib = H.torsoPath(W, [['pelvis', 0.2, 2.6, 2.6], ['spine', 0.1, 2.3, 2.4], ['spine', 0.7, 2.5, 2.5], ['chest', 0.5, 2.8, 2.7], ['chest', 1, 2.2, 2.5]], S);
    K.paint(ctx, gib, M.wine, { depth: S * 0.8, hlw: S * 0.35 });
    const cui = H.torsoPath(W, [['spine', 0.45, 2.5, 2.4], ['spine', 0.8, 2.9, 2.5], ['chest', 0.45, 3.3, 2.8], ['chest', 0.95, 2.6, 2.6]], S);
    K.paint(ctx, cui, M.steel, { depth: S * 0.9, hlw: S * 0.45, light: [0.4, -1] });
    ctx.save(); ctx.clip(cui);
    const C = W.chest;
    K.line(ctx, [pt(C, 0.0, 2.6), pt(C, 0.9, 2.2)], 0.22, A.rgba(M.steel.light, 0.7)); // aresta do peito
    for (const [t, w] of [[0.3, 1.0], [0.55, -0.6], [0.1, -1.6]]) { const [rx, ry] = pt(C, t, w); const g = ctx.createRadialGradient(rx * S, ry * S, 0, rx * S, ry * S, 1.4 * S); g.addColorStop(0, A.rgba(M.rust, 0.7)); g.addColorStop(1, A.rgba(M.rust, 0)); ctx.fillStyle = g; ctx.fillRect((rx - 2) * S, (ry - 2) * S, 4 * S, 4 * S); }
    K.line(ctx, [pt(C, 0.62, 1.4), pt(C, 0.5, 0.2)], 0.2, A.rgba('#101014', 0.6)); // amolgadela
    ctx.restore();
    // faldas (3 lâminas sobrepostas)
    const Sp = W.spine;
    for (let i = 0; i < 3; i++) {
      const t = 0.3 - i * 0.16, [ax, ay] = pt(Sp, t, 2.7), [bx, by] = pt(Sp, t, -2.6);
      K.poly(ctx, [[ax, ay], [bx, by], [bx - 0.2, by + 1.2], [ax + 0.3, ay + 1.3]], M.steel, { depth: S * 0.3, hlw: S * 0.15 });
    }
    // cinturão
    const [b0x, b0y] = pt(Sp, 0.0, 2.7), [b1x, b1y] = pt(Sp, 0.0, -2.6);
    K.line(ctx, [[b0x, b0y + 1.2], [b1x, b1y + 1.2]], 0.5, '#1a1310');
  }
  // cabeça: morrião de crista e abas em bico; rosto morto na sombra da aba, barbicha rala, olho de brasa
  function head(ctx, W, x) {
    const Hd = W.head;
    ctx.save(); A.boneT(ctx, W.neck, S);
    K.tube(ctx, [[-0.2, 0], [W.neck.len + 0.4, 0]], [1.0, 0.85], M.skin, { depth: S * 0.3, flat: true });
    ctx.restore();
    ctx.save(); A.boneT(ctx, Hd, S); ctx.rotate(Math.PI / 2);
    const face = K.blob(ctx, [[-1.7, -0.4], [-1.7, -2.4], [0.2, -3.0], [1.9, -2.6], [2.2, -1.6], [2.6, -0.9], [2.1, -0.6], [2.2, 0.3], [1.6, 1.4], [0.4, 1.6], [-0.8, 0.9]], M.skin, { depth: S * 0.55, hlw: S * 0.3, light: [0.6, -1] });
    ctx.save(); ctx.clip(face);
    const sh = ctx.createLinearGradient(0, -3 * S, 0, -0.6 * S); sh.addColorStop(0, 'rgba(10,8,12,0.75)'); sh.addColorStop(1, 'rgba(10,8,12,0)');
    ctx.fillStyle = sh; ctx.fillRect(-2 * S, -3.2 * S, 5 * S, 3 * S);
    K.line(ctx, [[0.6, -0.2], [1.6, 0.5]], 0.28, A.rgba(M.skin.deep, 0.5));
    ctx.restore();
    const beard = K.blobPath([[0.4, 0.9], [2.0, 0.7], [1.5, 2.1], [0.6, 1.9]]); ctx.fillStyle = '#3a3438'; ctx.fill(beard);
    const eo = K.blobPath([[1.0, -1.9], [1.9, -1.95], [1.95, -1.4], [1.2, -1.3]]); ctx.fillStyle = '#0c090c'; ctx.fill(eo);
    K.ember(ctx, 1.5, -1.62, 0.28, x.eye === undefined ? 1 : x.eye);
    // morrião: copa redonda, crista alta, aba em barco
    const brim = A.path((q) => { q.M(-3.6, -1.9); q.Q(-2.6, -2.6, -1.2, -2.8); q.L(1.8, -2.9); q.Q(3.3, -2.8, 4.0, -3.9); q.Q(3.6, -2.0, 1.8, -2.1); q.L(-1.4, -2.0); q.Q(-2.6, -1.8, -3.6, -1.9); q.Z(); }, S);
    const dome = A.path((q) => { q.M(-1.9, -2.6); q.Q(-2.0, -5.0, 0.2, -5.4); q.Q(2.3, -5.2, 2.2, -2.7); q.Z(); }, S);
    const comb = A.path((q) => { q.M(-1.4, -4.5); q.Q(-1.2, -7.0, 0.4, -7.0); q.Q(1.8, -6.9, 1.8, -4.6); q.Q(0.2, -5.4, -1.4, -4.5); q.Z(); }, S);
    K.paint(ctx, comb, M.steel, { depth: S * 0.35, hlw: S * 0.25, light: [0.6, -1] });
    K.paint(ctx, dome, M.steel, { depth: S * 0.55, hlw: S * 0.3, light: [0.6, -1] });
    K.paint(ctx, brim, M.steel, { depth: S * 0.3, hlw: S * 0.2, light: [0.6, -1] });
    K.line(ctx, [[-1.2, -2.8], [1.9, -2.9]], 0.18, A.rgba(M.steel.light, 0.6));
    for (const rx of [-1.2, 0.2, 1.6]) K.dot(ctx, rx, -2.95, 0.16, M.steel.light);
    ctx.restore();
  }
  // pavês alto em três quartos, de madeira pintada, sol da rainha esbatido, aros de ferro, lascas
  function pavise(ctx, W, x) {
    const Hd = W.handF;
    const c = [Hd.x + Math.cos(Hd.a * D2R) * 0.8 + 1.4, Hd.y + Math.sin(Hd.a * D2R) * 0.8];
    const tilt = (x.tilt || 0) * D2R;
    ctx.save(); ctx.translate(c[0] * S, c[1] * S); ctx.rotate(tilt);
    const w0 = 2.6, w1 = 3.0, h0 = -8.2, h1 = 5.6; // face visível (estreita à frente, perspetiva)
    const face = K.polyPath([[-w0, h0 + 0.6], [0, h0], [w1, h0 + 0.5], [w1 - 0.2, h1], [0, h1 + 0.8], [-w0 + 0.2, h1 + 0.2]]);
    const edge = K.polyPath([[w1, h0 + 0.5], [w1 + 1.0, h0 + 0.9], [w1 + 0.8, h1 + 0.3], [w1 - 0.2, h1]]);
    K.paint(ctx, edge, K.dim(M.wood, 0.7), { depth: S * 0.2 });
    K.paint(ctx, face, M.paint, { depth: S * 0.6, hlw: S * 0.3, light: [-0.4, -1] });
    ctx.save(); ctx.clip(face);
    // nervura central e sol de raios ondulados
    K.line(ctx, [[0, h0], [0, h1 + 0.8]], 0.45, A.rgba(M.paint.deep || '#2a2418', 0.5));
    const sc = [0.2, -1.8];
    for (let i = 0; i < 12; i++) { const a = (i / 12) * A.TAU; const r0 = 1.3, r1 = i % 2 ? 2.4 : 3.0; K.line(ctx, [[sc[0] + Math.cos(a) * r0, sc[1] + Math.sin(a) * r0 * 1.15], [sc[0] + Math.cos(a + 0.12) * r1, sc[1] + Math.sin(a + 0.12) * r1 * 1.15]], 0.32, A.rgba(M.sun.base, 0.85)); }
    const disc = A.path((q) => q.E(sc[0], sc[1], 1.25, 1.45), S); K.paint(ctx, disc, M.sun, { depth: S * 0.3 });
    // tinta estalada e marcas de golpes
    for (const [ax, ay, bx, by] of [[-1.8, 2.0, -0.6, 3.6], [1.2, -6.0, 2.4, -4.8], [-2.0, -5.0, -1.0, -6.4], [1.4, 2.6, 2.6, 1.4]]) K.line(ctx, [[ax, ay], [bx, by]], 0.2, A.rgba('#1a140c', 0.7));
    const dk = ctx.createLinearGradient(0, h0 * S, 0, h1 * S); dk.addColorStop(0, 'rgba(20,16,10,0)'); dk.addColorStop(1, 'rgba(20,16,10,0.45)'); ctx.fillStyle = dk; ctx.fillRect(-4 * S, h0 * S, 8 * S, (h1 - h0 + 1) * S);
    ctx.restore();
    // aros de ferro
    for (const y of [h0 + 1.0, h1 - 0.6]) K.line(ctx, [[-w0 + 0.1, y + 0.1], [w1 - 0.1, y]], 0.32, M.steel.shadow);
    for (const y of [h0 + 1.0, h1 - 0.6]) for (const xx of [-1.6, 1.8]) K.dot(ctx, xx, y, 0.2, M.steel.light);
    ctx.restore();
  }
  function draw(ctx, W, x) {
    spear(ctx, W, x);
    arm(ctx, W, 'B', true);
    leg(ctx, W, 'B', true);
    torso(ctx, W, x);
    leg(ctx, W, 'F', false);
    head(ctx, W, x);
    arm(ctx, W, 'F', false);
    pavise(ctx, W, x);
  }
  function points(W, x) {
    const Hh = W.head, ca = Math.cos(Hh.a * D2R), sa = Math.sin(Hh.a * D2R);
    return { tip: x._tip, eye: [Hh.x + ca * 1.62 - sa * 1.5, Hh.y + sa * 1.62 + ca * 1.5] };
  }

  const STANCE = { pelvis: 0, spine: 6, chest: 4, neck: -2, head: -2 };
  const P = (a, x, root) => A.pose(A.addA(STANCE, a || {}), x, root || [0, -13.0]);
  // guarda: pavês à frente do corpo, lança deitada por cima
  const guard = (o = {}) => Object.assign({ fF: [3.0, 0], fB: [-3.2, 0], sh: [3.2, 3.4], shA: -80, sp: [3.0, 1.2], spA: -4, sway: 0, tilt: 0 }, o);
  function anims() {
    const R = {};
    R.idle = { n: 6, fps: 6, loop: true, keys: [[0, P({}, guard())], [0.5, P({ spine: 1, chest: 1 }, guard({ sh: [3.2, 3.6], sp: [3.0, 1.4], sway: 0.6 }), [0, -12.85])], [1, P({}, guard())]] };
    // avança de lado, em guarda, passo pesado
    R.move = {
      n: 8, fps: 9, loop: true, stride: 12,
      poseFn: (t) => { const f = A.stepFeet(t, { stride: 3.2, lift: 1.5 }); const s = Math.sin(t * A.TAU); return P({ spine: 2, head: -s }, guard({ fF: f.F, fB: f.B, faF: f.F[1] < 0 ? 12 : 0, faB: f.B[1] < 0 ? 12 : 0, sh: [3.2, 3.4 + s * 0.3], sp: [3.0, 1.2 + s * 0.3], sway: -Math.cos(t * A.TAU) }), [0.3, -13.0 + Math.abs(s) * 0.4]); },
    };
    // estocada por cima do pavês (sinal branco na ponta)
    const TW = P({ spine: -4, chest: -6 }, guard({ sp: [-1.4, -0.4], spA: -6, fF: [3.4, 0], fB: [-3.6, 0], sway: 0.6 }), [-0.6, -12.8]);
    const TA = P({ spine: 14, chest: 10, neck: -6 }, guard({ sp: [8.8, 0.2], spA: 2, fF: [5.0, 0], fB: [-3.8, 0], sh: [3.6, 3.8], sway: -1 }), [1.8, -12.2]);
    R.atk_thrust = { n: 8, fps: 13, phases: [3, 2], keys: [[0, P({}, guard())], [0.3, TW], [0.42, TW], [0.56, TA], [0.7, TA], [1, P({}, guard())]] };
    // empurrão de escudo
    const BW = P({ spine: -6, chest: -8 }, guard({ sh: [1.4, 3.2], tilt: -8, sp: [1.6, 1.0], fF: [3.0, 0], fB: [-3.4, 0] }), [-0.8, -12.8]);
    const BA = P({ spine: 16, chest: 10 }, guard({ sh: [6.0, 3.0], tilt: 10, sp: [3.4, 1.6], fF: [5.2, 0], fB: [-3.0, 0] }), [2.0, -12.2]);
    R.atk_bash = { n: 7, fps: 13, phases: [2, 2], keys: [[0, P({}, guard())], [0.25, BW], [0.45, BA], [0.6, BA], [1, P({}, guard())]] };
    R.hurt = { n: 3, fps: 14, keys: [[0, P({ spine: -14, chest: -10, neck: -6, head: 6 }, guard({ sh: [1.6, 4.4], tilt: -14, sp: [0.4, 2.4], spA: -30, eye: 1.8 }), [-1, -13.2])], [1, P({}, guard())]] };
    R.stagger = { n: 4, fps: 7, loop: true, poseFn: (t) => { const s = Math.sin(t * A.TAU); return P({ spine: 18 + s * 2, chest: 10, neck: 14, head: 10 }, guard({ sh: [2.2, 7.4], shA: -40, tilt: 30 + s * 6, sp: [2.0, 6.4], spA: 40, eye: 0.4, sway: s }), [0.2, -12.0]); } };
    R.death = { n: 7, fps: 10, keys: [[0, P({ spine: -16, chest: -10, neck: -8 }, guard({ sh: [1.4, 5], tilt: -20, sp: [0, 3], spA: -50, eye: 1.6 }), [-1, -13.2])], [0.45, P({ spine: 30, chest: 14, neck: 16 }, guard({ sh: [3, 8], tilt: 50, sp: [3, 7], spA: 60, fF: [3.6, 0], fB: [-1.6, 0], eye: 0.5 }), [0.8, -8.4])], [1, P({ spine: 82, chest: 6, neck: 8 }, guard({ sh: [6, 4], tilt: 84, sp: [6, 3], spA: 10, fF: [3.8, 0], fB: [-1.8, 0], eye: 0 }), [1.2, -5.0])]] };
    return R;
  }
  A.register('en_sentinel', () => A.creature({ name: 'en_sentinel', S, box: [60, 50], anchor: [24, 45], rig, solve, draw, points, anims: anims(), post: K.post('#a8b0c8', 0.32, 0.04) }));
  (A.previewCell = A.previewCell || {}).en_sentinel = [50, 46];
})(window.ART);
