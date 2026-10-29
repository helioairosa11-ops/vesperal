// Vesperal — Sir Caedmon, o Escudo da Rainha (chefe do Bastião): cavaleiro alto de armadura prateada com
// faixas de esmalte azul, elmo fechado de balde com um penacho branco comprido, tabardo azul-claro com a chama
// da rainha, e um pavês enorme (quase da altura dele) com a chama dentro de um crescente. Espada de armas na
// outra mão. A guarda só abre com parries no tempo certo (postura quebrada).
// Redesenhado: aço enegrecido com orlas de ouro, sobreveste carmesim, capa esfarrapada, véu de luto, pavês de
// carvalho pintado com setas cravadas. Exportado a ×1.75 (≈2× a protagonista). → assets/sprites/en_b_caedmon.png
'use strict';
(function (A) {
  const S = 5, K = A.kit(S), D2R = A.D2R;
  const H = A.humanoid({ pelvis: 2.6, spine: 6.4, chest: 6.8, neck: 1.6, head: 4.6, thigh: 8.8, shin: 8.4, foot: 3.6, uarm: 6.6, farm: 6.2, hand: 2.2, shoulder: 0.8 });
  const rig = H.rig;
  const M = {
    steel: A.mat('#4a4e5a', { shadow: '#24262e', light: '#a0a6b6', deep: '#0c0d11' }),
    steelB: A.mat('#3e424c', { shadow: '#202228', light: '#727886', deep: '#0a0b0e' }),
    gold: A.mat('#a8843c', { shadow: '#5e461c', light: '#e8c878', deep: '#241a08' }),
    crimson: A.mat('#6e1820', { shadow: '#3a0a10', light: '#a8343c', deep: '#16040a' }),
    cloak: A.mat('#2a1418', { shadow: '#14080a', light: '#4a262c', deep: '#080304' }),
    crest: A.mat('#7a1a22', { shadow: '#3e0a10', light: '#b23a42' }),
    veil: A.mat('#18161c', { shadow: '#0a090c', light: '#2e2a34' }),
    leather: A.mat('#3a2a22', { shadow: '#1e1511', light: '#5e4636' }),
    wood: A.mat('#4a3626', { shadow: '#261a10', light: '#76583e', deep: '#120b06' }),
    paint: A.mat('#5e141c', { shadow: '#30080c', light: '#8e2a30' }),
    shaft: A.mat('#6a5a40', { shadow: '#3a3020', light: '#9a8a66' }),
  };
  const BACK = 0.62;
  function solve(pose) {
    const x = pose.extra, r = pose.root;
    if (x.fF) H.leg(pose, 'F', [r[0] + x.fF[0], x.fF[1] - 1.0], x.faF || 0);
    if (x.fB) H.leg(pose, 'B', [r[0] + x.fB[0], x.fB[1] - 1.0], x.faB || 0);
    const W = rig.solve(pose);
    // pavês na mão da frente (braço de perto); espada na de trás
    H.arm(pose, 'F', [W.uarmF.x + x.sh[0], W.uarmF.y + x.sh[1]], (x.shA || 0) - 90, x.bF || 1);
    H.arm(pose, 'B', [W.uarmB.x + x.sw[0], W.uarmB.y + x.sw[1]], x.wa + 90, x.bB || 1);
  }
  const pt = (B, t, w) => { const [x, y] = K.along(B, t), [nx, ny] = K.perp(B); return [x + nx * w, y + ny * w]; };
  // placa articulada com orla dourada e canelura
  const plate = (ctx, p1, p2, w1, w2, m, trim) => {
    const dd = K.norm(p2[0] - p1[0], p2[1] - p1[1]), nn = [-dd[1], dd[0]];
    const path = K.poly(ctx, [[p1[0] + nn[0] * w1, p1[1] + nn[1] * w1], [p2[0] + nn[0] * w2, p2[1] + nn[1] * w2], [p2[0] - nn[0] * w2, p2[1] - nn[1] * w2], [p1[0] - nn[0] * w1, p1[1] - nn[1] * w1]], m, { depth: S * 0.45, hlw: S * 0.26 });
    ctx.save(); ctx.clip(path);
    K.line(ctx, [[p1[0] + nn[0] * w1 * 0.2, p1[1] + nn[1] * w1 * 0.2], [p2[0] + nn[0] * w2 * 0.2, p2[1] + nn[1] * w2 * 0.2]], 0.22, A.rgba(m.light, 0.55));
    if (trim !== false) { K.line(ctx, [[p1[0] + nn[0] * w1, p1[1] + nn[1] * w1], [p2[0] + nn[0] * w2, p2[1] + nn[1] * w2]], 0.32, A.rgba(M.gold.base, 0.85)); }
    ctx.restore();
    return path;
  };

  // espada de armas: lâmina larga e direita, guarda reta com braços curvos, pomo de disco
  function sword(ctx, W, x) {
    const Hd = W.handB, g = [Hd.x + Math.cos(Hd.a * D2R) * 1.0, Hd.y + Math.sin(Hd.a * D2R) * 1.0];
    const d = [Math.cos(x.wa * D2R), Math.sin(x.wa * D2R)], n = [-d[1], d[0]], wl = x.wl === undefined ? 1 : x.wl;
    const at = (t, w = 0) => [g[0] + d[0] * t * wl + n[0] * w, g[1] + d[1] * t * wl + n[1] * w];
    K.tube(ctx, [at(-2.6), at(1.2)], [0.42, 0.4], M.leather, { depth: S * 0.15, flat: true });
    K.bands(ctx, K.tubePath([at(-2.6), at(1.2)], [0.42, 0.4], false), at(-2.6), at(1.2), 0.45, 0, 1, 4, M.leather);
    K.dot(ctx, ...at(-3.0), 0.8, M.gold.base); K.dot(ctx, ...at(-3.1, -0.2), 0.3, M.gold.light);
    K.blob(ctx, [at(1.1, -3.0), at(1.4, -3.2), at(1.9, -1.0), at(1.9, 1.0), at(1.4, 3.2), at(1.1, 3.0), at(1.4, 0.8), at(1.4, -0.8)], M.gold, { depth: S * 0.15 });
    const blade = K.polyPath([at(1.9, -1.0), at(14.6, -0.75), at(16.8, 0), at(14.6, 0.75), at(1.9, 1.0)]);
    K.paint(ctx, blade, M.steel, { depth: S * 0.3, hlw: S * 0.2 });
    ctx.save(); ctx.clip(blade); K.line(ctx, [at(2.4, 0), at(12.0, 0)], 0.3, A.rgba(M.steel.deep, 0.7)); K.line(ctx, [at(2.4, -0.62), at(15.0, -0.5)], 0.18, A.rgba('#ffffff', 0.75)); ctx.restore();
    x._tip = at(16.8, 0); x._grip = g;
  }
  // pavês: tábuas de carvalho escuro com moldura de ferro, a chama da rainha pintada num crescente (vermelho
  // gasto e ouro), lascas de golpes e três setas partidas cravadas
  function shield(ctx, W, x) {
    const Hd = W.handF, c = [Hd.x + Math.cos(Hd.a * D2R) * 0.6, Hd.y + Math.sin(Hd.a * D2R) * 0.6];
    const a = (x.shA || 0) * D2R, ca = Math.cos(a), sa = Math.sin(a);
    const at = (u, v) => [c[0] + u * ca - v * sa, c[1] + u * sa + v * ca];
    const top = -12.6, bot = 9.4, th = x.shTh === undefined ? 1.6 : x.shTh;
    K.poly(ctx, [at(th, top + 1.4), at(th + 1.0, top + 1.8), at(th + 1.0, bot - 0.8), at(th, bot)], M.steelB, { depth: S * 0.2 });
    const w = x.shW === undefined ? 6.6 : x.shW;
    const F = (u, v) => at(th - u, v);
    const body = A.path((q) => { let s2 = F(0, top + 1.6); q.M(s2[0], s2[1]); const k1 = F(w * 0.5, top - 1.8), k2 = F(w, top + 0.8); q.Q(k1[0], k1[1], k2[0], k2[1]); s2 = F(w * 1.02, bot - 1.2); q.L(s2[0], s2[1]); const k3 = F(w * 0.55, bot + 2.0); s2 = F(0, bot); q.Q(k3[0], k3[1], s2[0], s2[1]); q.Z(); }, S);
    K.paint(ctx, body, M.wood, { depth: S * 0.7, hlw: S * 0.3, light: [0.5, -1] });
    ctx.save(); ctx.clip(body);
    // tábuas
    for (let i = 1; i < 4; i++) K.line(ctx, [F(w * i / 4, top - 2), F(w * i / 4, bot + 2)], 0.2, A.rgba(M.wood.deep, 0.8));
    for (let i = 0; i < 9; i++) K.line(ctx, [F(w * (0.1 + (i % 4) * 0.25), top + 1 + i * 2.2), F(w * (0.18 + (i % 4) * 0.25), top + 2.2 + i * 2.2)], 0.1, A.rgba(M.wood.light, 0.35));
    // campo pintado (vermelho gasto) e emblema
    const field = A.path((q) => { let s2 = F(w * 0.12, top + 2.2); q.M(s2[0], s2[1]); const k1 = F(w * 0.5, top + 0.2), k2 = F(w * 0.88, top + 2.4); q.Q(k1[0], k1[1], k2[0], k2[1]); s2 = F(w * 0.9, bot - 2.2); q.L(s2[0], s2[1]); const k3 = F(w * 0.5, bot + 0.8); s2 = F(w * 0.1, bot - 2.2); q.Q(k3[0], k3[1], s2[0], s2[1]); q.Z(); }, S);
    ctx.fillStyle = A.rgba(M.paint.base, 0.9); ctx.fill(field);
    const ec = F(w * 0.5, -2.2);
    const moon = A.path((q) => { q.M(ec[0] - 2.4, ec[1] - 1.6); q.Q(ec[0] - 3.0, ec[1] + 2.6, ec[0], ec[1] + 3.0); q.Q(ec[0] + 3.0, ec[1] + 2.6, ec[0] + 2.4, ec[1] - 1.6); q.Q(ec[0] + 1.6, ec[1] + 1.8, ec[0], ec[1] + 2.0); q.Q(ec[0] - 1.6, ec[1] + 1.8, ec[0] - 2.4, ec[1] - 1.6); q.Z(); }, S);
    K.paint(ctx, moon, M.gold, { depth: S * 0.2, hlw: S * 0.15 });
    const fl = A.path((q) => { q.M(ec[0], ec[1] - 3.6); q.Q(ec[0] + 1.7, ec[1] - 0.8, ec[0] + 0.9, ec[1] + 1.0); q.Q(ec[0], ec[1] + 1.6, ec[0] - 0.9, ec[1] + 1.0); q.Q(ec[0] - 1.7, ec[1] - 0.8, ec[0], ec[1] - 3.6); q.Z(); }, S);
    K.paint(ctx, fl, M.gold, { depth: S * 0.2, hlw: S * 0.15 });
    // tinta lascada e golpes
    for (const [u, v, r] of [[0.2, 4.0, 0.8], [0.75, -7.0, 0.6], [0.6, 5.6, 0.5], [0.3, -9.0, 0.5]]) { const q2 = F(w * u, v); ctx.fillStyle = A.rgba(M.wood.base, 0.95); ctx.beginPath(); ctx.ellipse(q2[0] * S, q2[1] * S, r * S * 1.3, r * S, 0.4, 0, A.TAU); ctx.fill(); }
    K.line(ctx, [F(w * 0.15, 2.6), F(w * 0.45, 4.6)], 0.2, A.rgba('#000', 0.6)); K.line(ctx, [F(w * 0.6, -9.6), F(w * 0.85, -7.8)], 0.2, A.rgba('#000', 0.6));
    ctx.restore();
    // moldura de ferro com rebites
    ctx.lineWidth = S * 1.0; ctx.strokeStyle = M.steelB.base; ctx.stroke(body);
    ctx.lineWidth = S * 0.25; ctx.strokeStyle = M.steel.light; ctx.stroke(body);
    for (const v of [top + 1.6, -2, bot - 1.6]) for (const u of [w * 0.15, w * 0.85]) { K.dot(ctx, ...F(u, v), 0.42, M.steelB.deep); K.dot(ctx, ...F(u, v), 0.24, M.steel.light); }
    K.line(ctx, [F(0, -3.2), F(w * 1.02, -3.0)], 0.45, M.steelB.base); // travessa
    // setas partidas cravadas
    for (const [u, v, ang, L] of [[0.3, -6.0, 200, 3.4], [0.62, 1.4, 160, 2.6], [0.45, 6.8, 210, 2.2]]) {
      const b0 = F(w * u, v), dd = [Math.cos(ang * D2R), Math.sin(ang * D2R)], b1 = [b0[0] - dd[0] * L * (x.facingSh || 1), b0[1] + dd[1] * L];
      K.line(ctx, [b0, b1], 0.24, M.shaft.base); K.line(ctx, [b1, [b1[0] - 0.4, b1[1] - 0.6]], 0.16, M.shaft.shadow);
      K.dot(ctx, b0[0], b0[1], 0.28, M.steelB.deep);
    }
    x._shield = F(w * 0.5, -2.0); x._edge = F(0, -2.0);
  }
  function arm(ctx, W, side, back) {
    const U = W['uarm' + side], F = W['farm' + side], Hd = W['hand' + side];
    const m = back ? M.steelB : M.steel;
    K.limb(ctx, [U.x, U.y], [F.x, F.y], [F.ex, F.ey], 1.5, 1.2, 1.0, back ? K.dim(M.leather, BACK) : M.leather, { depth: S * 0.4 });
    plate(ctx, [U.x, U.y], [F.x, F.y], 1.7, 1.4, m);
    plate(ctx, [F.x, F.y], [F.ex, F.ey], 1.5, 1.15, m);
    // cotoveleira em leque
    K.blob(ctx, [[F.x - 1.5, F.y - 1.0], [F.x + 0.6, F.y - 1.7], [F.x + 2.0, F.y + 0.4], [F.x + 0.3, F.y + 1.6], [F.x - 1.4, F.y + 1.0]], m, { depth: S * 0.3, hlw: S * 0.2 });
    K.dot(ctx, F.x + 0.2, F.y, 0.4, M.gold.base);
    // espaldar grande em três lâminas sobrepostas, orla dourada
    const [sx, sy] = K.along(U, 0.06);
    for (let i = 2; i >= 0; i--) {
      const o = i * 1.5;
      const lame = K.blob(ctx, [[sx - 3.6, sy - 0.6 + o], [sx - 1.6, sy - 3.4 + o * 0.9], [sx + 2.4, sy - 2.8 + o * 0.9], [sx + 3.8, sy + 0.6 + o], [sx + 2.4, sy + 2.0 + o], [sx - 3.0, sy + 1.6 + o]], m, { depth: S * 0.45, hlw: S * 0.3 });
      ctx.save(); ctx.clip(lame); K.line(ctx, [[sx - 3.4, sy + 1.4 + o], [sx + 3.6, sy + 1.6 + o]], 0.4, back ? K.dim(M.gold, 0.7).base : M.gold.base); ctx.restore();
    }
    ctx.save(); A.boneT(ctx, Hd, S); // manopla
    K.blob(ctx, [[-0.6, -1.3], [1.6, -1.3], [2.4, -0.2], [1.8, 1.2], [-0.6, 1.1]], m, { depth: S * 0.3 });
    for (let i = 0; i < 3; i++) K.line(ctx, [[0.8 + i * 0.5, -1.2], [0.9 + i * 0.5, 1.1]], 0.12, A.rgba('#000', 0.5));
    ctx.restore();
  }
  function leg(ctx, W, side, back) {
    const T = W['thigh' + side], N = W['shin' + side], F = W['foot' + side];
    const m = back ? M.steelB : M.steel;
    K.limb(ctx, [T.x, T.y], [N.x, N.y], [N.ex, N.ey], 1.9, 1.4, 1.1, back ? K.dim(M.leather, BACK) : M.leather, { depth: S * 0.5 });
    plate(ctx, [T.x, T.y], [N.x, N.y], 2.3, 1.7, m);
    plate(ctx, [N.x, N.y], [N.ex, N.ey], 1.8, 1.3, m);
    // joelheira com asa
    K.blob(ctx, [[N.x - 1.6, N.y - 1.2], [N.x + 0.8, N.y - 1.9], [N.x + 2.6, N.y - 0.2], [N.x + 1.6, N.y + 1.4], [N.x - 1.4, N.y + 1.2]], m, { depth: S * 0.35, hlw: S * 0.22 });
    K.dot(ctx, N.x + 0.4, N.y - 0.2, 0.45, M.gold.base);
    ctx.save(); A.boneT(ctx, F, S); // solerete articulado
    K.poly(ctx, [[-1.4, -1.4], [1.6, -1.3], [4.2, -0.3], [4.4, 1.0], [-1.5, 1.1]], m, { depth: S * 0.35 });
    for (let i = 0; i < 3; i++) K.line(ctx, [[1.0 + i * 1.0, -1.2 + i * 0.3], [1.0 + i * 1.0, 1.0]], 0.14, A.rgba('#000', 0.5));
    ctx.restore();
  }
  // capa esfarrapada (atrás), couraça com nervura e orla dourada, sobreveste carmesim com a chama
  function cloak(ctx, W, x) {
    const C = W.chest, sw = x.sway || 0;
    const sh = pt(C, 1.0, -3.6), sh2 = pt(C, 1.0, 1.8);
    const hem = []; for (let i = 0; i <= 7; i++) { const k = i / 7; hem.push([sh[0] - 4.6 - k * 3.4 + sw * (1.6 + k), 1.2 - (i % 2 ? 1.6 : 0) - k * 2.2]); }
    const path = A.path((q) => { q.M(sh2[0], sh2[1]); q.Q(sh[0] - 1.0, sh[1] - 1.6, sh[0] - 3.4, sh[1] + 1.0); q.Q(sh[0] - 6.0 + sw, sh[1] + 10, hem[7][0], hem[7][1]); for (let i = 7; i >= 0; i--) q.L(hem[i][0], hem[i][1]); q.Q(sh[0] + 0.6, sh[1] + 10, sh2[0], sh2[1] + 2); q.Z(); }, S);
    K.paint(ctx, path, M.cloak, { depth: S * 0.9, hlw: S * 0.35 });
    ctx.save(); ctx.clip(path); for (let i = 0; i < 4; i++) K.line(ctx, [[sh[0] - 1 - i * 0.8, sh[1] + 2], [hem[i * 2][0] + 0.4, hem[i * 2][1] - 0.6]], 0.3, A.rgba(M.cloak.deep, 0.7)); ctx.restore();
  }
  function torso(ctx, W, x) {
    const Sp = W.spine, C = W.chest, sw = x.sway || 0;
    const body = H.torsoPath(W, [['pelvis', 0.2, 3.8, 3.6], ['spine', 0.2, 3.6, 3.6], ['spine', 0.8, 4.4, 4.2], ['chest', 0.5, 5.0, 4.8], ['chest', 0.95, 4.0, 4.4]], S);
    K.paint(ctx, body, M.steel, { depth: S * 1.0, hlw: S * 0.5, light: [0.45, -1] });
    ctx.save(); ctx.clip(body);
    K.line(ctx, [pt(C, 0.95, 2.2), pt(Sp, 0.3, 2.6)], 0.3, A.rgba(M.steel.light, 0.6)); // nervura
    for (const t of [0.2, 0.5]) K.line(ctx, [pt(Sp, t, -3.8), pt(Sp, t, 4.0)], 0.22, A.rgba(M.steel.deep, 0.7)); // lâminas da barriga
    ctx.restore();
    // sobreveste carmesim (frente) com bainha esfarrapada até aos joelhos
    const t0 = pt(C, 0.9, 1.0), t1 = pt(C, 0.9, 4.4), b0 = pt(Sp, -0.1, 0.6), b1 = pt(Sp, -0.1, 4.6);
    const hem = []; for (let i = 0; i <= 5; i++) { const k = i / 5; hem.push([A.lerp(b1[0] + 0.4 + sw, b0[0] - 0.6 + sw, k), A.lerp(b1[1] + 9.6, b0[1] + 10.0, k) - (i % 2 ? 1.2 : 0)]); }
    const tab = A.path((q) => { q.M(t0[0], t0[1]); q.L(t1[0], t1[1]); q.L(b1[0], b1[1]); q.Q(b1[0] + 0.8 + sw * 0.3, b1[1] + 5, hem[0][0], hem[0][1]); hem.forEach((h) => q.L(h[0], h[1])); q.Q(b0[0] - 0.4, b0[1] + 5, b0[0], b0[1]); q.Z(); }, S);
    K.paint(ctx, tab, M.crimson, { depth: S * 0.6, hlw: S * 0.3 });
    ctx.save(); ctx.clip(tab);
    const ec = pt(C, 0.4, 2.7);
    const fl = A.path((q) => { q.M(ec[0], ec[1] - 2.4); q.Q(ec[0] + 1.3, ec[1] - 0.4, ec[0] + 0.7, ec[1] + 1.0); q.Q(ec[0], ec[1] + 1.4, ec[0] - 0.7, ec[1] + 1.0); q.Q(ec[0] - 1.3, ec[1] - 0.4, ec[0], ec[1] - 2.4); q.Z(); }, S);
    K.paint(ctx, fl, M.gold, { depth: S * 0.1, hlw: S * 0.1 });
    K.line(ctx, [t0, b0], 0.3, A.rgba(M.gold.base, 0.7)); K.line(ctx, [t1, b1], 0.3, A.rgba(M.gold.base, 0.7)); // galão
    const gr = ctx.createLinearGradient(0, (b0[1] + 2) * S, 0, (b0[1] + 10) * S); gr.addColorStop(0, 'rgba(10,4,6,0)'); gr.addColorStop(1, 'rgba(10,4,6,0.55)'); ctx.fillStyle = gr; ctx.fill(tab);
    ctx.restore();
    // cinto de armas com fivela
    const bl = pt(Sp, 0.12, 0.4), br = pt(Sp, 0.12, 4.8); K.line(ctx, [bl, br], 0.9, M.leather.shadow); K.line(ctx, [bl, br], 0.4, M.leather.base);
    K.poly(ctx, [[br[0] - 2.4, br[1] - 0.7], [br[0] - 1.0, br[1] - 0.7], [br[0] - 1.0, br[1] + 0.7], [br[0] - 2.4, br[1] + 0.7]], M.gold, { depth: S * 0.12 });
    // gorjal
    const nk = pt(C, 1.0, 0.4); K.blob(ctx, [[nk[0] - 2.6, nk[1] + 0.6], [nk[0] - 2.2, nk[1] - 1.0], [nk[0] + 2.4, nk[1] - 1.2], [nk[0] + 2.8, nk[1] + 0.6], [nk[0], nk[1] + 1.4]], M.steel, { depth: S * 0.3, hlw: S * 0.2 });
  }
  // grande elmo com fenda em cruz, diadema de ouro, crista carmesim e véu de luto negro pelas costas
  function head(ctx, W, x) {
    const Hd = W.head, sw = x.sway || 0, pl = x.plume || 0;
    ctx.save(); A.boneT(ctx, Hd, S); ctx.rotate(Math.PI / 2);
    // véu de luto
    const veil = A.path((q) => { q.M(-2.4, -3.0); q.Q(-5.2 + pl * 0.4, -1.0, -6.0 + sw + pl, 5.4); q.L(-4.0 + sw * 0.8 + pl * 0.6, 6.4); q.L(-3.0 + sw * 0.6, 4.6); q.Q(-2.6, 1.0, -1.0, 1.8); q.Z(); }, S);
    K.paint(ctx, veil, M.veil, { depth: S * 0.5, hlw: S * 0.2 });
    // crista de crina carmesim
    const crest = A.path((q) => { q.M(1.6, -5.4); q.Q(-0.4, -8.2, -4.6 + pl * 0.6, -7.6 - pl * 0.3); q.Q(-7.6 + pl, -6.4 + sw * 0.3, -9.2 + pl * 1.3, -3.4 + sw); q.Q(-6.0 + pl * 0.5, -5.0, -3.6, -4.6); q.Q(-1.6, -4.6, -0.6, -4.8); q.Z(); }, S);
    K.paint(ctx, crest, M.crest, { depth: S * 0.5, hlw: S * 0.3, light: [0.4, -1] });
    ctx.save(); ctx.clip(crest); for (let i = 0; i < 7; i++) K.line(ctx, [[0.4 - i * 0.7, -6.4], [-3.0 - i * 1.0 + pl * 0.8, -4.0 - i * 0.3 + sw * 0.5]], 0.14, A.rgba(M.crest.shadow, 0.9)); ctx.restore();
    const helm = K.blob(ctx, [[-2.6, 1.8], [-3.0, -2.2], [-2.2, -4.8], [0.6, -5.6], [2.8, -4.8], [3.4, -2.2], [3.4, 1.0], [2.4, 2.2], [-1.0, 2.4]], M.steel, { depth: S * 0.6, hlw: S * 0.35, light: [0.6, -1] });
    ctx.save(); ctx.clip(helm);
    K.line(ctx, [[0.6, -2.2], [3.6, -2.2]], 0.46, '#08090c'); // fenda
    K.line(ctx, [[2.5, -3.4], [2.5, 0.8]], 0.38, '#08090c');
    for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) K.dot(ctx, 1.4 + j * 0.7, 0.4 + i * 0.5, 0.14, '#08090c'); // respiros
    K.line(ctx, [[-0.2, -5.6], [0.2, 2.2]], 0.26, A.rgba(M.steel.light, 0.7));
    // diadema de ouro com pontas em chama
    K.line(ctx, [[-3.0, -3.6], [3.4, -3.8]], 0.6, M.gold.base); K.line(ctx, [[-3.0, -3.8], [3.4, -4.0]], 0.2, M.gold.light);
    ctx.restore();
    for (const xx of [-1.4, 0.6, 2.4]) K.poly(ctx, [[xx - 0.5, -4.0], [xx, -5.6], [xx + 0.5, -4.0]], M.gold, { depth: S * 0.1, hlw: S * 0.08 });
    if ((x.eye || 0) > 0) { ctx.save(); ctx.clip(helm); K.ember(ctx, 2.6, -2.2, 0.34, x.eye, '#bcd8ff'); ctx.restore(); }
    ctx.restore();
  }
  function draw(ctx, W, x) {
    const front = (x.swFront || 0) >= 0.5;
    cloak(ctx, W, x);
    arm(ctx, W, 'B', true);
    if (!front) sword(ctx, W, x);
    leg(ctx, W, 'B', true);
    torso(ctx, W, x);
    leg(ctx, W, 'F', false);
    head(ctx, W, x);
    arm(ctx, W, 'F', false);
    shield(ctx, W, x);
    if (front) sword(ctx, W, x);
  }
  function points(W, x) {
    const Hh = W.head, ca = Math.cos(Hh.a * D2R), sa = Math.sin(Hh.a * D2R);
    return { tip: x._tip, grip: x._grip, eye: [Hh.x + ca * 2.2 - sa * 2.6, Hh.y + sa * 2.2 + ca * 2.6], shield: x._shield, edge: x._edge };
  }

  // ---------------------------------------------------------------- poses
  const STANCE = { pelvis: 0, spine: 4, chest: 2, neck: -2, head: -2 };
  const RY = -16.4;
  const P = (a, x, root) => A.pose(A.addA(STANCE, a || {}), x, root || [0, RY]);
  // guarda: pavês à frente, espada erguida por trás, por cima do ombro
  const base = (o = {}) => Object.assign({ fF: [4.0, 0], fB: [-4.2, 0], sh: [6.6, 8.6], shA: 0, sw: [-0.6, -7.0], wa: -140, swFront: 0, wl: 1, sway: 0, plume: 0, eye: 1 }, o);
  const GUARD = (o) => P({}, base(o));
  function anims() {
    const R = {};
    R.idle = { n: 6, fps: 5, loop: true, keys: [[0, GUARD()], [0.5, P({ spine: 1, chest: 1 }, base({ sh: [6.6, 9.0], sw: [-0.6, -6.6], wa: -136, sway: 0.4, plume: 0.4 }), [0, RY + 0.25])], [1, GUARD()]] };
    R.move = { n: 8, fps: 8, loop: true, stride: 15, poseFn: (t) => { const f = A.stepFeet(t, { stride: 4.0, lift: 1.5 }); const s = Math.sin(t * A.TAU), c = Math.cos(t * A.TAU); return P({ spine: 3, chest: s, head: -s }, base({ fF: f.F, fB: f.B, faF: f.F[1] < 0 ? 10 : 0, faB: f.B[1] < 0 ? 10 : 0, sh: [6.6, 8.6 + s * 0.3], sw: [-0.6, -7.0 + c * 0.3], sway: -c, plume: 0.8 + c * 0.4 }), [0.3, RY + Math.abs(s) * 0.5]); } };
    // CORTE (branco): a espada vai para trás da cabeça e cai por cima do pavês
    const CK = (o = {}) => P({ spine: -4, chest: -8 }, base(Object.assign({ sw: [-2.6, -8.6], wa: -200, fF: [4.6, 0], fB: [-4.6, 0], sh: [4.6, 7.8], plume: 0.6, eye: 1.5 }, o)), [-0.8, RY + 0.6]);
    const HIT = (o = {}) => P({ spine: 12, chest: 6 }, base(Object.assign({ sw: [7.6, -1.0], wa: 36, swFront: 1, fF: [6.2, 0], fB: [-4.8, 0], sh: [5.6, 9.2], shA: 6, plume: -0.8, sway: -1 }, o)), [1.8, RY + 1.6]);
    const MIDC = P({ spine: 2, chest: -2 }, base({ sw: [2.6, -9.6], wa: -80, swFront: 1, fF: [5.4, 0], fB: [-4.6, 0], plume: 0.2 }), [0.4, RY + 0.8]);
    R.atk_cut = { n: 9, fps: 12, phases: [4, 2], keys: [[0, GUARD()], [0.2, CK({ sw: [-1.8, -8.0], wa: -170 })], [0.34, CK()], [0.42, CK()], [0.5, MIDC], [0.62, HIT()], [0.78, HIT({ sw: [7.0, 0.0], wa: 44 })], [1, GUARD({ wa: -140 })]] };
    // CORTE DE REVÉS (branco): de baixo para cima, por cima do pavês
    const LOWC = P({ spine: 8, chest: 4 }, base({ sw: [6.0, 5.0], wa: 70, swFront: 1, fF: [5.4, 0], fB: [-4.6, 0], sh: [4.4, 8.0], shA: -6, plume: 0.4 }), [1.0, RY + 1.6]);
    const UPC = P({ spine: -4, chest: -6, head: -6 }, base({ sw: [5.6, -8.6], wa: -58, swFront: 1, fF: [6.0, 0], fB: [-4.6, 0], sh: [5.0, 8.2], plume: -0.8, sway: -1 }), [1.4, RY + 0.8]);
    R.atk_cut2b = { n: 8, fps: 13, phases: [3, 2], keys: [[0, HIT()], [0.3, LOWC], [0.4, LOWC], [0.55, P({ spine: 2 }, base({ sw: [7.6, 0.6], wa: 4, swFront: 1, fF: [6.0, 0], fB: [-4.6, 0] }), [1.2, RY + 1.0])], [0.66, UPC], [0.82, UPC], [1, GUARD({ wa: -140 })]] };
    // FINTA (branco): arma o golpe, ameaça descer, volta a armar — e então corta
    const TW = P({ spine: 6, chest: 2 }, base({ sw: [1.6, -8.4], wa: -100, swFront: 1, fF: [5.0, 0], fB: [-4.6, 0], plume: 0.2, eye: 1.6 }), [0.8, RY + 0.8]);
    R.atk_feint = { n: 12, fps: 10, phases: [7, 2], keys: [[0, GUARD()], [0.14, CK({ sw: [-1.8, -8.0], wa: -170 })], [0.26, CK()], [0.36, TW], [0.46, CK({ eye: 2 })], [0.54, CK({ eye: 2 })], [0.6, MIDC], [0.68, HIT()], [0.82, HIT({ sw: [7.0, 0.0], wa: 44 })], [1, GUARD()]] };
    // ESTOCADA (vermelho): recolhe a espada à altura da anca e investe a fundo, por baixo do pavês
    const TH0 = P({ spine: -4, chest: -4 }, base({ sw: [-5.0, 3.0], wa: 0, fF: [4.6, 0], fB: [-5.0, 0], sh: [4.0, 7.4], plume: 1, eye: 2 }), [-1.4, RY + 1.2]);
    const TH1 = P({ spine: 16, chest: 6, neck: -4 }, base({ sw: [10.0, 2.6], wa: 2, swFront: 1, fF: [7.6, 0], fB: [-6.0, 0], sh: [2.4, 6.4], shA: -24, plume: -1.6, sway: -1.2, eye: 2 }), [3.4, RY + 2.4]);
    R.atk_thrust = { n: 8, fps: 12, phases: [3, 2], keys: [[0, GUARD()], [0.3, TH0], [0.4, TH0], [0.55, TH1], [0.74, TH1], [1, GUARD()]] };
    // EMPURRÃO DE ESCUDO: recua o pavês e atira-o à frente
    const BA0 = P({ spine: -6, chest: -6 }, base({ sh: [1.8, 8.2], shA: -8, fF: [4.4, 0], fB: [-4.8, 0], plume: 0.8 }), [-1.0, RY + 0.8]);
    const BA1 = P({ spine: 14, chest: 8 }, base({ sh: [9.6, 7.2], shA: 4, fF: [7.0, 0], fB: [-5.0, 0], plume: -1.2, sway: -1 }), [2.6, RY + 1.6]);
    R.atk_bash = { n: 7, fps: 12, phases: [2, 2], keys: [[0, GUARD()], [0.28, BA0], [0.5, BA1], [0.66, BA1], [1, GUARD()]] };
    // aparar um golpe com o pavês (reação curta)
    R.block = { n: 3, fps: 14, keys: [[0, P({ spine: -6, chest: -6 }, base({ sh: [3.6, 8.0], shA: -10, plume: 1.2, eye: 1.4 }), [-1.2, RY + 0.4])], [1, GUARD()]] };
    // POSTURA QUEBRADA: o pavês cai para o lado, ajoelha-se de um joelho, exposto
    const BR = (k) => P({ spine: 14 + k, chest: 10, neck: 14, head: 8 }, base({ sh: [3.0, 14.4], shA: 40, shW: 4.8, sw: [2.4, 10.0], wa: 80, fF: [5.0, 0], fB: [-3.4, 0], faB: 70, plume: 1.4, sway: 0.6, eye: 0.6 }), [0.4, RY + 6.8]);
    R.broken = { n: 4, fps: 5, loop: true, poseFn: (t) => BR(Math.sin(t * A.TAU) * 2) };
    // AO ALTO ESCUDOS: ergue o pavês por cima da cabeça, deitado, e chama a saraivada dos archeiros mortos
    const VO = (k) => P({ spine: -4, chest: -6, neck: -6, head: -12 }, base({ sh: [3.0, -11.6 + k * 0.3], shA: -90, shW: 5.6, sw: [-1.0, 3.0], wa: 60, fF: [5.0, 0], fB: [-5.0, 0], plume: 0.6 + k * 0.2, eye: 1.8 }), [0, RY + 1.0]);
    R.atk_volley = { n: 8, fps: 8, phases: [3, 4], keys: [[0, GUARD()], [0.3, VO(0)], [0.5, VO(1)], [0.65, VO(0)], [0.8, VO(1)], [1, GUARD()]] };
    R.hurt = { n: 3, fps: 12, keys: [[0, P({ spine: -10, chest: -8, neck: -6 }, base({ sh: [3.6, 7.8], shA: -10, sw: [-1.6, -6.0], wa: -120, plume: 1.4, eye: 1.8 }), [-1.4, RY])], [1, GUARD()]] };
    R.stagger = { n: 4, fps: 6, loop: true, poseFn: (t) => { const s = Math.sin(t * A.TAU); return P({ spine: 12 + s * 2, chest: 8, neck: 12, head: 6 }, base({ sh: [3.6, 11.8], shA: 20, sw: [1.4, 8.0], wa: 70, plume: s, sway: s * 0.5, eye: 0.6 }), [0.4, RY + 2.0]); } };
    R.death = { n: 9, fps: 7, keys: [[0, P({ spine: -14, chest: -10, neck: -8 }, base({ sh: [3, 5.8], shA: -20, sw: [-2, -5], wa: -100, eye: 2 }), [-1.4, RY])], [0.35, BR(0)], [0.7, P({ spine: 30, chest: 20, neck: 20, head: 10 }, base({ sh: [4.6, 14.8], shA: 70, shW: 4.0, sw: [3.4, 10.4], wa: 86, fF: [5.0, 0], fB: [-3.4, 0], faB: 70, eye: 0.3 }), [0.8, RY + 8.0])], [1, P({ spine: 70, chest: 14, neck: 10, head: 0 }, base({ sh: [7.0, 13.8], shA: 86, shW: 3.6, sw: [5.0, 10.0], wa: 30, fF: [6.0, 0], fB: [-2.4, 0], faB: 70, eye: 0 }), [2.0, RY + 10.6])]] };
    return R;
  }
  A.register('en_b_caedmon', () => A.creature({ name: 'en_b_caedmon', S, unit: 1.75, box: [110, 96], anchor: [48, 86], rig, solve, draw, points, anims: anims(), post: K.post('#c8d8ff', 0.3, 0.035) }));
  (A.previewCell = A.previewCell || {}).en_b_caedmon = [120, 130];
})(window.ART);
