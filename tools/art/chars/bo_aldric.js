// Vesperal — Rei Aldric, o Rei de Cinza (chefe final). Alto e magro, de armadura de placas enegrecida com
// filigrana de sóis dourados; manto real cor de vinho, comprido e queimado na bainha, com gola de arminho
// cinzento; coroa de ferro com raios de sol meio derretidos, fundida ao cabelo comprido e branco; rosto
// macilento de barba longa. A couraça está rachada sobre o coração: lá dentro arde a Sexta Brasa. Empunha o
// Montante do Rei (a mesma arma que a protagonista recebe ao vencê-lo).
// Exportado a ×1.75 (≈2× a altura da protagonista). → assets/sprites/en_b_aldric.png
'use strict';
(function (A) {
  const S = 5, K = A.kit(S), D2R = A.D2R;
  const H = A.humanoid({ pelvis: 2.6, spine: 6.6, chest: 7.0, neck: 1.9, head: 4.8, thigh: 9.0, shin: 8.6, foot: 3.6, uarm: 6.8, farm: 6.4, hand: 2.2, shoulder: 0.8 });
  const rig = H.rig;
  const M = {
    steel: A.mat('#2c2c34', { shadow: '#15151a', light: '#6e7080', deep: '#08080b' }),
    steelB: A.mat('#202026', { shadow: '#0e0e12', light: '#4a4c58', deep: '#060608' }),
    gold: A.mat('#a8843e', { shadow: '#5e4820', light: '#ecd08a', deep: '#2a1e0c' }),
    wine: A.mat('#5a1420', { shadow: '#320a12', light: '#8a2a36', deep: '#14040a' }),
    lining: A.mat('#2a0c12', { shadow: '#14060a', light: '#4a1a22' }),
    ermine: A.mat('#cfc8bc', { shadow: '#8a8478', light: '#f4eee2' }),
    skin: A.mat('#8a7a72', { shadow: '#4a3e3a', light: '#b4a498', deep: '#1c1412' }),
    hair: A.mat('#b4b0aa', { shadow: '#6a6660', light: '#e2ded6', deep: '#2a2826' }),
    leather: A.mat('#2a1c18', { shadow: '#140c0a', light: '#4a3428' }),
  };
  const BACK = 0.6;
  const SWORD = { tip: 27, gap: 3.4, minGap: 2.2 };
  const SC = 1.35; // o montante à escala do rei

  function solve(pose) {
    const x = pose.extra, r = pose.root;
    if (x.fF) H.leg(pose, 'F', [r[0] + x.fF[0], x.fF[1] - 1.0], x.faF || 0);
    if (x.fB) H.leg(pose, 'B', [r[0] + x.fB[0], x.fB[1] - 1.0], x.faB || 0);
    if ((x.mode || 0) < 0.5) { A.twoHand(H, pose, x, SWORD); return; }
    // uma mão: o montante na mão de trás; a mão da frente fica livre (agarrar, evocar)
    const W = rig.solve(pose), reach = (H.L.uarm + H.L.farm) * 0.96;
    const sB = [W.uarmB.x, W.uarmB.y], sF = [W.uarmF.x, W.uarmF.y];
    let g = [sB[0] + x.gB[0], sB[1] + x.gB[1]];
    const dl = Math.hypot(g[0] - sB[0], g[1] - sB[1]); if (dl > reach) g = [sB[0] + (g[0] - sB[0]) * reach / dl, sB[1] + (g[1] - sB[1]) * reach / dl];
    const wa = A.groundAngle(g, x, SWORD.tip);
    x._g = g; x._d = [Math.cos(wa * D2R), Math.sin(wa * D2R)]; x._wa = wa;
    H.arm(pose, 'B', g, wa + 90, x.bB || 1);
    H.arm(pose, 'F', [sF[0] + x.hF[0], sF[1] + x.hF[1]], x.haF || 0, x.bF || 1);
  }
  const pt = (B, t, w) => { const [x, y] = K.along(B, t), [nx, ny] = K.perp(B); return [x + nx * w, y + ny * w]; };
  const plate = (ctx, p1, p2, w1, w2, m, o = {}) => { const dd = K.norm(p2[0] - p1[0], p2[1] - p1[1]), nn = [-dd[1], dd[0]]; return K.poly(ctx, [[p1[0] + nn[0] * w1, p1[1] + nn[1] * w1], [p2[0] + nn[0] * w2, p2[1] + nn[1] * w2], [p2[0] - nn[0] * w2, p2[1] - nn[1] * w2], [p1[0] - nn[0] * w1, p1[1] - nn[1] * w1]], m, Object.assign({ depth: S * 0.4, hlw: S * 0.22 }, o)); };

  // o Montante do Rei (imagem do arsenal), com encurtamento x.wl quando aponta para quem olha
  // cópia da imagem do arsenal sem o halo suave (o contorno do rei transformá-lo-ia num disco escuro)
  let clean = null;
  function swordImage() {
    if (clean) return clean;
    const wi = A.weaponImage && A.weaponImage('montante'); if (!wi) return null;
    const cv = A.mk(wi.cv.width, wi.cv.height), c = cv.getContext('2d'); c.drawImage(wi.cv, 0, 0);
    const im = c.getImageData(0, 0, cv.width, cv.height), d = im.data;
    for (let i = 3; i < d.length; i += 4) if (d[i] < 150) d[i] = 0; else d[i] = 255;
    c.putImageData(im, 0, 0);
    return (clean = { cv, ox: wi.ox, oy: wi.oy });
  }
  function sword(ctx, x) {
    const wi = swordImage(); const g = x._g, d = x._d, wl = x.wl === undefined ? 1 : x.wl;
    if (wi) { ctx.save(); ctx.translate(g[0] * S, g[1] * S); ctx.rotate(x._wa * D2R); ctx.scale((S / 4) * SC * wl, (S / 4) * SC); ctx.drawImage(wi.cv, -wi.ox, -wi.oy); ctx.restore(); }
    x._tip = [g[0] + d[0] * SWORD.tip * wl, g[1] + d[1] * SWORD.tip * wl];
  }
  // manto real: preso aos ombros, cai atrás até ao chão; bainha queimada e esfarrapada
  function mantle(ctx, W, x) {
    const C = W.chest, cp = x.cape || 0, cy = x.capeY || 0, sw = x.sway || 0;
    const a = pt(C, 1.0, -2.2), b = pt(C, 0.55, -5.6), lowY = Math.min(-1.2, -1.2 + cy);
    const hb = [b[0] - 7.4 + cp * 1.0 + sw, lowY], hf = [a[0] + 1.6 + cp * 0.4 + sw * 0.6, lowY + 1.4 - cy * 0.3];
    const hem = []; const N = 9;
    for (let i = 0; i <= N; i++) { const k = i / N; hem.push([A.lerp(hb[0], hf[0], k), A.lerp(hb[1], hf[1], k) + (i % 2 ? -1.6 : 0) + Math.sin(i * 1.7) * 0.5]); }
    const path = A.path((q) => { q.M(a[0], a[1]); q.Q(b[0] - 1.5, b[1], b[0] - 4.0 + cp * 0.4, (b[1] + lowY) / 2); q.Q(hb[0] - 0.8, lowY - 4, hb[0], hb[1]); hem.forEach((p) => q.L(p[0], p[1])); q.Q(a[0] + 1.2, (a[1] + lowY) / 2, a[0], a[1]); q.Z(); }, S);
    K.paint(ctx, path, M.wine, { depth: S * 1.1, hlw: S * 0.45, light: [0.4, -1] });
    ctx.save(); ctx.clip(path);
    for (let i = 0; i < 5; i++) K.line(ctx, [[a[0] - 1 - i * 1.1, a[1] + 2], [hem[1 + i * 2][0], hem[1 + i * 2][1] - 1]], 0.4, A.rgba(M.wine.deep, 0.55));
    // bainha chamuscada
    const burn = ctx.createLinearGradient(0, (lowY - 5) * S, 0, lowY * S); burn.addColorStop(0, 'rgba(20,6,6,0)'); burn.addColorStop(1, 'rgba(20,6,6,0.85)'); ctx.fillStyle = burn; ctx.fill(path);
    ctx.restore();
    x._hem = hem;
  }
  function gauntlet(ctx, Hd, back, open) {
    ctx.save(); A.boneT(ctx, Hd, S);
    const m = back ? M.steelB : M.steel;
    if (open > 0.5) { // mão aberta, dedos em garra
      K.blob(ctx, [[-0.4, -1.1], [1.4, -1.2], [1.8, 0], [1.2, 1.1], [-0.4, 1.0]], m, { depth: S * 0.3 });
      for (let i = 0; i < 4; i++) K.tube(ctx, [[1.4, -1.0 + i * 0.65], [2.6, -1.3 + i * 0.75], [3.4, -0.9 + i * 0.7]], [0.32, 0.28, 0.2], m, { depth: S * 0.1 });
    } else K.blob(ctx, [[-0.4, -1.2], [1.6, -1.2], [2.3, -0.2], [1.8, 1.1], [-0.4, 1.0]], m, { depth: S * 0.35 });
    K.line(ctx, [[-0.3, -1.0], [-0.3, 1.0]], 0.3, back ? M.gold.shadow : M.gold.base);
    ctx.restore();
  }
  function arm(ctx, W, side, back, x) {
    const U = W['uarm' + side], F = W['farm' + side], Hd = W['hand' + side];
    const m = back ? M.steelB : M.steel;
    K.limb(ctx, [U.x, U.y], [F.x, F.y], [F.ex, F.ey], 1.5, 1.2, 1.0, back ? K.dim(M.leather, BACK) : M.leather, { depth: S * 0.4 });
    plate(ctx, [U.x, U.y], [F.x, F.y], 1.7, 1.35, m);
    plate(ctx, [F.x, F.y], [F.ex, F.ey], 1.4, 1.1, m);
    K.blob(ctx, [[F.x - 1.3, F.y - 0.8], [F.x + 0.5, F.y - 1.4], [F.x + 1.6, F.y + 0.3], [F.x + 0.2, F.y + 1.3], [F.x - 1.2, F.y + 0.9]], m, { depth: S * 0.3, hlw: S * 0.2 });
    // manopla com punho alto
    const fd = K.norm(F.ex - F.x, F.ey - F.y), fn = [-fd[1], fd[0]], c0 = [F.ex - fd[0] * 1.6, F.ey - fd[1] * 1.6];
    K.poly(ctx, [[c0[0] + fn[0] * 1.6, c0[1] + fn[1] * 1.6], [F.ex + fn[0] * 1.3, F.ey + fn[1] * 1.3], [F.ex - fn[0] * 1.3, F.ey - fn[1] * 1.3], [c0[0] - fn[0] * 1.6, c0[1] - fn[1] * 1.6]], m, { depth: S * 0.25 });
    K.line(ctx, [[c0[0] + fn[0] * 1.5, c0[1] + fn[1] * 1.5], [c0[0] - fn[0] * 1.5, c0[1] - fn[1] * 1.5]], 0.22, back ? M.gold.shadow : M.gold.base);
    gauntlet(ctx, Hd, back, side === 'F' ? x.open || 0 : 0);
  }
  // espaldar em lâminas sobrepostas, com orla dourada e um sol no topo
  function pauldron(ctx, W, side, back) {
    const U = W['uarm' + side], [sx, sy] = K.along(U, 0.05), d = [Math.cos(U.a * D2R), Math.sin(U.a * D2R)], n = [-d[1], d[0]];
    const m = back ? M.steelB : M.steel, gm = back ? K.dim(M.gold, 0.7) : M.gold;
    for (let i = 2; i >= 0; i--) {
      const c = [sx + d[0] * (1.0 + i * 1.5), sy + d[1] * (1.0 + i * 1.5)], w = 3.9 - i * 0.45;
      const lame = A.path((q) => { q.M(c[0] + n[0] * w - d[0] * 1.6, c[1] + n[1] * w - d[1] * 1.6); q.Q(c[0] + n[0] * (w + 0.6) + d[0] * 0.8, c[1] + n[1] * (w + 0.6) + d[1] * 0.8, c[0] + d[0] * 1.5, c[1] + d[1] * 1.5); q.Q(c[0] - n[0] * (w + 0.6) + d[0] * 0.8, c[1] - n[1] * (w + 0.6) + d[1] * 0.8, c[0] - n[0] * w - d[0] * 1.6, c[1] - n[1] * w - d[1] * 1.6); q.Z(); }, S);
      K.paint(ctx, lame, m, { depth: S * 0.4, hlw: S * 0.25 });
      ctx.save(); ctx.clip(lame); K.line(ctx, [[c[0] + n[0] * w + d[0] * 0.2, c[1] + n[1] * w + d[1] * 0.2], [c[0] + d[0] * 1.3, c[1] + d[1] * 1.3], [c[0] - n[0] * w + d[0] * 0.2, c[1] - n[1] * w + d[1] * 0.2]], 0.35, gm.base); ctx.restore();
    }
    const top = K.blob(ctx, [[sx - d[0] * 1.4 + n[0] * 3.4, sy - d[1] * 1.4 + n[1] * 3.4], [sx - d[0] * 3.0, sy - d[1] * 3.0], [sx - d[0] * 1.4 - n[0] * 3.4, sy - d[1] * 1.4 - n[1] * 3.4], [sx + d[0] * 1.2 - n[0] * 3.6, sy + d[1] * 1.2 - n[1] * 3.6], [sx + d[0] * 1.6, sy + d[1] * 1.6], [sx + d[0] * 1.2 + n[0] * 3.6, sy + d[1] * 1.2 + n[1] * 3.6]], m, { depth: S * 0.5, hlw: S * 0.3 });
    void top;
    const sc = [sx - d[0] * 0.8, sy - d[1] * 0.8];
    for (let i = 0; i < 8; i++) { const a = i / 8 * A.TAU; K.line(ctx, [[sc[0] + Math.cos(a) * 0.6, sc[1] + Math.sin(a) * 0.6], [sc[0] + Math.cos(a) * (i % 2 ? 1.1 : 1.5), sc[1] + Math.sin(a) * (i % 2 ? 1.1 : 1.5)]], 0.22, gm.base); }
    K.dot(ctx, sc[0], sc[1], 0.55, gm.light);
  }
  function leg(ctx, W, side, back) {
    const T = W['thigh' + side], N = W['shin' + side], F = W['foot' + side];
    const m = back ? M.steelB : M.steel, gm = back ? K.dim(M.gold, 0.7) : M.gold;
    K.limb(ctx, [T.x, T.y], [N.x, N.y], [N.ex, N.ey], 1.9, 1.4, 1.1, back ? K.dim(M.leather, BACK) : M.leather, { depth: S * 0.5 });
    plate(ctx, [T.x, T.y], [N.x, N.y], 2.1, 1.6, m);
    plate(ctx, [N.x, N.y], [N.ex, N.ey], 1.7, 1.25, m);
    // joelheira com asa e sol
    K.blob(ctx, [[N.x - 1.4, N.y - 1.0], [N.x + 0.6, N.y - 1.6], [N.x + 2.0, N.y + 0.2], [N.x + 0.4, N.y + 1.5], [N.x - 1.3, N.y + 1.0]], m, { depth: S * 0.35, hlw: S * 0.22 });
    K.dot(ctx, N.x + 0.3, N.y - 0.1, 0.45, gm.base);
    const sd = K.norm(N.ex - N.x, N.ey - N.y), sn = [-sd[1], sd[0]];
    K.line(ctx, [[N.x + sd[0] * 2 + sn[0] * 1.5, N.y + sd[1] * 2 + sn[1] * 1.5], [N.ex - sd[0] * 0.6 + sn[0] * 1.15, N.ey - sd[1] * 0.6 + sn[1] * 1.15]], 0.22, gm.base);
    ctx.save(); A.boneT(ctx, F, S);
    K.poly(ctx, [[-1.3, -1.3], [1.6, -1.2], [4.0, -0.3], [4.2, 0.9], [-1.4, 1.0]], m, { depth: S * 0.35 });
    for (const xx of [0.8, 2.0]) K.line(ctx, [[xx, -1.1], [xx + 0.3, 0.9]], 0.16, A.rgba(M.steel.deep, 0.8));
    ctx.restore();
  }
  // couraça negra com um sol dourado rachado sobre o coração (a brasa brilha na sobreposição); faldas em lâminas
  // e um tabardo cor de vinho que cai até aos joelhos
  function torso(ctx, W, x) {
    const Sp = W.spine, C = W.chest, Pv = W.pelvis, sw = x.sway || 0;
    const [px, py] = K.along(Pv, 0.2), [snx, sny] = K.perp(Sp);
    // tabardo (atrás das faldas da frente)
    const t0 = pt(Sp, 0.1, 1.2), t1 = pt(Sp, 0.1, 4.2);
    const tab = A.path((q) => { q.M(t0[0], t0[1]); q.L(t1[0], t1[1]); q.Q(t1[0] + 0.8 + sw * 0.3, t1[1] + 5, t1[0] + 0.4 + sw, t1[1] + 10.4); q.L(t0[0] - 0.6 + sw, t0[1] + 10.8); q.Q(t0[0] - 0.4, t0[1] + 5, t0[0], t0[1]); q.Z(); }, S);
    K.paint(ctx, tab, M.wine, { depth: S * 0.6, hlw: S * 0.3 });
    ctx.save(); ctx.clip(tab); const tc = [(t0[0] + t1[0]) / 2 + sw * 0.5, t0[1] + 6.4]; for (let i = 0; i < 8; i++) { const a = i / 8 * A.TAU; K.line(ctx, [[tc[0] + Math.cos(a) * 0.5, tc[1] + Math.sin(a) * 0.5], [tc[0] + Math.cos(a) * 1.2, tc[1] + Math.sin(a) * 1.2]], 0.18, M.gold.base); } K.dot(ctx, tc[0], tc[1], 0.45, M.gold.light); K.line(ctx, [[t1[0] - 0.4, t1[1] + 0.6], [t1[0] + 0.2 + sw, t1[1] + 10]], 0.25, M.gold.shadow); ctx.restore();
    const body = H.torsoPath(W, [['pelvis', 0.2, 3.8, 3.6], ['spine', 0.2, 3.6, 3.6], ['spine', 0.8, 4.4, 4.2], ['chest', 0.5, 5.2, 4.8], ['chest', 0.95, 4.2, 4.6]], S);
    K.paint(ctx, body, M.steel, { depth: S * 1.1, hlw: S * 0.5, light: [0.45, -1] });
    ctx.save(); ctx.clip(body);
    const sc = pt(C, 0.24, 3.0); x._heart = sc;
    for (let i = 0; i < 12; i++) { const a = i / 12 * A.TAU; K.line(ctx, [[sc[0] + Math.cos(a) * 1.0, sc[1] + Math.sin(a) * 1.0], [sc[0] + Math.cos(a) * (i % 2 ? 1.8 : 2.5), sc[1] + Math.sin(a) * (i % 2 ? 1.8 : 2.5)]], 0.22, M.gold.base); }
    K.dot(ctx, sc[0], sc[1], 0.95, '#1a0806');
    K.line(ctx, [pt(C, 0.05, 3.2), pt(C, 0.95, 3.0)], 0.22, A.rgba(M.steel.light, 0.5)); // aresta da couraça
    K.line(ctx, [pt(Sp, 0.75, -3.6), pt(Sp, 0.75, 3.8)], 0.18, A.rgba(M.gold.shadow, 0.9)); // ventral
    ctx.restore();
    // faldas
    for (let i = 0; i < 3; i++) { const [ax, ay] = K.along(Sp, 0.2 - i * 0.2); const [nx, ny] = K.perp(Sp); const fl = K.poly(ctx, [[ax + nx * 3.6, ay + ny * 3.6], [ax - nx * 3.4, ay - ny * 3.4], [ax - nx * 3.6, ay - ny * 3.6 + 1.6], [ax + nx * 3.8, ay + ny * 3.8 + 1.6]], M.steel, { depth: S * 0.3, hlw: S * 0.15 }); ctx.save(); ctx.clip(fl); K.line(ctx, [[ax - nx * 3.6, ay - ny * 3.6 + 1.4], [ax + nx * 3.8, ay + ny * 3.8 + 1.4]], 0.2, M.gold.base); ctx.restore(); }
    void px; void py; void snx; void sny;
  }
  // gola de arminho cinzento (por cima do manto)
  function collar(ctx, W) {
    const C = W.chest, a = pt(C, 1.05, 3.0), b = pt(C, 1.05, -3.8), c = pt(C, 0.78, -4.4), d = pt(C, 0.8, 3.2);
    const col = K.blob(ctx, [a, [a[0] - 1.0, a[1] - 1.6], [b[0] + 0.4, b[1] - 1.4], b, c, [(c[0] + d[0]) / 2, (c[1] + d[1]) / 2 + 1.0], d], M.ermine, { depth: S * 0.5, hlw: S * 0.3 });
    ctx.save(); ctx.clip(col);
    for (let i = 0; i < 6; i++) { const k = i / 5, p = [A.lerp(c[0], d[0], k), A.lerp(c[1], d[1], k) - 0.6]; K.line(ctx, [p, [p[0] + 0.1, p[1] + 1.0]], 0.28, '#151214'); }
    ctx.restore();
  }
  // cabeça: rosto macilento de perfil, barba e cabelo compridos brancos, coroa de raios meio derretidos
  function head(ctx, W, x) {
    const Hd = W.head, sw = x.sway || 0;
    ctx.save(); A.boneT(ctx, Hd, S); ctx.rotate(Math.PI / 2); ctx.scale(1.15, 1.15);
    K.blob(ctx, [[-1.0, -4.4], [-3.4, -3.6], [-4.4, -0.6], [-4.6 - sw * 0.3, 2.8], [-4.0 - sw * 0.5, 5.6], [-2.6 - sw * 0.3, 5.0], [-1.6, 1.6], [-0.6, -1.0]], M.hair, { depth: S * 0.5, hlw: S * 0.2 });
    const face = K.blob(ctx, [[-2.0, 0.6], [-2.4, -2.6], [-1.4, -4.4], [1.0, -4.6], [2.2, -3.8], [2.4, -2.8], [3.3, -1.6], [2.5, -1.2], [2.7, -0.4], [2.0, 0.4], [0.6, 1.0]], M.skin, { depth: S * 0.6, hlw: S * 0.3, light: [0.6, -1] });
    ctx.save(); ctx.clip(face);
    K.line(ctx, [[0.6, -0.6], [1.6, 0.2]], 0.35, A.rgba(M.skin.deep, 0.45)); // maçã funda
    K.line(ctx, [[0.4, -3.5], [2.2, -3.4]], 0.3, A.rgba(M.skin.deep, 0.4)); // sobrolho
    ctx.restore();
    const eo = K.blobPath([[0.8, -3.1], [2.0, -3.2], [2.2, -2.4], [1.2, -2.2]]); ctx.fillStyle = '#120a08'; ctx.fill(eo);
    K.ember(ctx, 1.6, -2.7, 0.42, x.eye === undefined ? 1 : x.eye, '#ffb070');
    // barba comprida
    const brd = K.blob(ctx, [[0.2, -0.4], [2.2, -1.0], [2.8, 0.6], [2.4 + sw * 0.2, 3.0], [1.6 + sw * 0.4, 5.6], [0.6 + sw * 0.3, 4.6], [-0.6, 1.8]], M.hair, { depth: S * 0.45, hlw: S * 0.25 });
    ctx.save(); ctx.clip(brd); for (let i = 0; i < 5; i++) K.line(ctx, [[0.2 + i * 0.5, -0.4], [0.6 + i * 0.4 + sw * 0.3, 5.2]], 0.1, A.rgba(M.hair.shadow, 0.8)); ctx.restore();
    K.line(ctx, [[2.1, -0.9], [2.6, -0.6]], 0.2, M.hair.light); // bigode
    // coroa: aro de ferro com raios de sol dourados, alguns tortos e escorridos
    K.poly(ctx, [[-2.6, -3.9], [2.4, -4.1], [2.5, -5.2], [-2.6, -5.0]], M.steelB, { depth: S * 0.25 });
    K.line(ctx, [[-2.6, -4.0], [2.4, -4.2]], 0.24, M.gold.base);
    const rays = [[-2.0, -5.0, -3.4, -8.6], [-0.8, -5.1, -1.0, -9.8], [0.4, -5.2, 0.9, -10.4], [1.6, -5.2, 2.4, -9.2], [2.4, -5.1, 3.6, -7.6]];
    rays.forEach(([bx, by, tx, ty], i) => { const melt = i === 1 ? 1.2 : i === 3 ? -0.8 : 0; K.poly(ctx, [[bx - 0.42, by], [tx + melt * 0.3, ty + Math.abs(melt)], [bx + 0.42, by]], M.gold, { depth: S * 0.18, inkW: K.IW * 0.7 }); });
    K.line(ctx, [[-1.0, -5.0], [-1.1, -3.9]], 0.2, M.gold.shadow); // ouro escorrido
    ctx.restore();
  }
  function draw(ctx, W, x) {
    const one = (x.mode || 0) >= 0.5;
    mantle(ctx, W, x);
    if (one) sword(ctx, x);
    arm(ctx, W, 'B', true, x);
    if (!one) pauldron(ctx, W, 'B', true);
    leg(ctx, W, 'B', true);
    torso(ctx, W, x);
    leg(ctx, W, 'F', false);
    collar(ctx, W);
    head(ctx, W, x);
    if (!one) sword(ctx, x);
    arm(ctx, W, 'F', false, x);
    pauldron(ctx, W, 'F', false);
  }
  // brasa no peito (fendas acesas) e brilho dos olhos: por cima do contorno, sem tinta
  function overlay(ctx, W, x) {
    // veio de brasa do montante (o halo da arma foi retirado antes do contorno)
    if (x._g && x._d) { const g = x._g, d = x._d, wl = x.wl === undefined ? 1 : x.wl; ctx.save(); ctx.globalCompositeOperation = 'lighter'; for (let i = 0; i < 4; i++) { const t = (8 + i * 4.4) * SC * 0.8 * wl; A.glow(ctx, (g[0] + d[0] * t) * S, (g[1] + d[1] * t) * S, 3.2 * S, '#ff7a30', 0.12); } ctx.restore(); }
    const h = x._heart, k = x.ember === undefined ? 1 : x.ember; if (!h || k <= 0.02) return;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    A.glow(ctx, h[0] * S, h[1] * S, (4 + k * 3) * S, '#ff6a20', 0.35 * k);
    const C = W.chest, d = [Math.cos(C.a * D2R), Math.sin(C.a * D2R)], n = K.perp(C);
    const cracks = [[[0, 0], [0.9, -1.2], [1.4, -2.6]], [[0, 0], [-1.0, 0.9], [-1.4, 2.2]], [[0, 0], [1.2, 0.8], [2.6, 0.9]]];
    for (const c of cracks) { const pts = c.map(([u, v]) => [h[0] + d[0] * u + n[0] * v, h[1] + d[1] * u + n[1] * v]); A.stroke(ctx, pts, S * 0.36, A.rgba('#ff6a20', 0.7 * k), S); A.stroke(ctx, pts, S * 0.14, A.rgba('#ffe0a0', 0.9 * k), S); }
    A.glow(ctx, h[0] * S, h[1] * S, 1.2 * S, '#fff2c8', 0.9 * k);
    ctx.restore();
  }
  function points(W, x) {
    const Hh = W.head, ca = Math.cos(Hh.a * D2R), sa = Math.sin(Hh.a * D2R);
    return { tip: x._tip, eye: [Hh.x + ca * 3.1 - sa * 1.84, Hh.y + sa * 3.1 + ca * 1.84], heart: x._heart, light: x._heart, grip: x._g, hand: [W.handF.ex, W.handF.ey] };
  }

  // ---------------------------------------------------------------- poses
  const STANCE = { pelvis: 0, spine: 2, chest: 0, neck: -2, head: -2 };
  const RY = -16.9;
  const P = (a, x, root, rootA) => A.pose(A.addA(STANCE, a || {}), x, root || [0, RY], rootA || 0);
  const base = (o = {}) => Object.assign({ fF: [4.2, 0], fB: [-4.0, 0], g: [5.4, 9.8], wa: 50, tgK: 0.45, tgY: -1.4, gap: 3.4, wl: 1, mode: 0, gB: [2.0, 10.0], hF: [3.0, 10.0], haF: 80, open: 0, cape: 0, capeY: 0, sway: 0, eye: 1, ember: 1 }, o);
  const READY = (o) => P({}, base(o));
  function anims() {
    const R = {};
    R.idle = { n: 6, fps: 5, loop: true, keys: [[0, READY({ cape: -0.4 })], [0.5, P({ spine: 1, chest: 2, neck: 1 }, base({ g: [5.4, 10.2], cape: 0.6, sway: 0.4, ember: 1.25 }), [0, RY + 0.3])], [1, READY({ cape: -0.4 })]] };
    R.move = { n: 8, fps: 7, loop: true, stride: 15, poseFn: (t) => { const f = A.stepFeet(t, { stride: 4.2, lift: 1.6 }); const s = Math.sin(t * A.TAU), c = Math.cos(t * A.TAU); return P({ spine: 3, chest: s, head: -s }, base({ fF: f.F, fB: f.B, faF: f.F[1] < 0 ? 10 : 0, faB: f.B[1] < 0 ? 10 : 0, g: [5.6, 9.6 + s * 0.3], tgK: 0.55, cape: -1 - c * 0.8, sway: -c * 0.8 }), [0.3, RY + Math.abs(s) * 0.5]); } };

    // VARRIDA (branco): o montante sobe por cima do ombro para trás e corta na horizontal à frente;
    // a meio aponta para quem olha (encurtado)
    const LIFT = P({ spine: -2 }, base({ g: [2.6, 0.6], wa: -40, tgK: 0 }), [-0.2, RY]);
    const BACK1 = P({ spine: -4, chest: -10, head: -4 }, base({ g: [-3.4, -1.4], wa: -180, tgK: 0, fF: [4.8, 0], fB: [-4.6, 0], cape: 1.6, eye: 1.4 }), [-0.9, RY + 0.7]);
    const MID = P({ spine: 2, chest: -2 }, base({ g: [3.0, 3.0], wa: -270, tgK: 0, wl: 0.3, fF: [5.2, 0], fB: [-4.6, 0], cape: 0.6 }), [0.4, RY + 1.0]);
    const CUT = P({ spine: 8, chest: 6 }, base({ g: [9.6, 2.6], wa: -358, tgK: 0, fF: [5.8, 0], fB: [-4.8, 0], cape: -2.4, sway: -1 }), [1.6, RY + 1.2]);
    const FOL = P({ spine: 8, chest: 10 }, base({ g: [8.2, 4.2], wa: -336, tgK: 0, wl: 0.85, fF: [5.8, 0], fB: [-4.8, 0], cape: -2.0, sway: -0.6 }), [1.6, RY + 1.2]);
    R.atk_sweep = { n: 10, fps: 12, phases: [4, 2], keys: [[0, READY()], [0.14, LIFT], [0.28, BACK1], [0.36, BACK1], [0.47, MID], [0.56, CUT], [0.7, FOL], [1, READY({ wa: -310 })]] };
    // CORTE ASCENDENTE (branco, combo): baixa o montante à frente e corta para cima
    const LOW = P({ spine: 8, chest: 6 }, base({ g: [5.8, 11.6], wa: 70, tgK: 0.8, tgY: -0.6, fF: [5.0, 0], fB: [-4.6, 0], cape: 0.8 }), [0.6, RY + 1.6]);
    const UPC = P({ spine: -6, chest: -8, head: -6 }, base({ g: [6.4, -6.0], wa: -64, tgK: 0, fF: [6.0, 0], fB: [-4.6, 0], cape: -2.2, sway: -1 }), [1.6, RY + 0.2]);
    R.atk_sweep2 = { n: 8, fps: 12, phases: [3, 2], keys: [[0, READY()], [0.28, LOW], [0.38, LOW], [0.52, P({ spine: 2 }, base({ g: [7.2, 3.0], wa: 0, tgK: 0, fF: [5.6, 0], fB: [-4.6, 0] }), [1.0, RY + 0.8])], [0.62, UPC], [0.8, UPC], [1, READY({ wa: 50 })]] };

    // GOLPE DE CIMA (vermelho, com armadura): o montante vai para trás do ombro com os joelhos a fletir,
    // passa por cima da cabeça e crava-se à frente com as ancas em baixo (ondas de choque)
    const OLIFT = P({ spine: -2 }, base({ g: [3.4, 1.0], wa: -30, tgK: 0, ember: 1.3 }), [-0.2, RY]);
    const COCK = P({ spine: -6, chest: -10, neck: 2, head: -6 }, base({ g: [-1.8, -6.2], wa: -192, tgK: 0, fF: [5.0, 0], fB: [-4.8, 0], cape: 2.0, eye: 1.6, ember: 1.6 }), [-1.0, RY + 0.9]);
    const COCK2 = P({ spine: -7, chest: -11, neck: 2, head: -8 }, base({ g: [-2.0, -6.4], wa: -198, tgK: 0, fF: [5.0, 0], fB: [-4.8, 0], cape: 2.2, eye: 1.8, ember: 1.8 }), [-1.1, RY + 1.1]);
    const TOP = P({ spine: -4, chest: -6, head: -8 }, base({ g: [1.6, -10.0], wa: -90, tgK: 0, fF: [5.2, 0], fB: [-4.8, 0], cape: 1.0, eye: 1.8, ember: 1.8 }), [-0.2, RY + 0.4]);
    const DOWN = P({ spine: 4, chest: 2 }, base({ g: [6.6, -3.4], wa: -20, tgK: 0, fF: [5.8, 0], fB: [-4.8, 0], cape: -0.8, ember: 1.8 }), [0.8, RY + 1.2]);
    const HIT = P({ spine: 12, chest: 8, neck: 2, head: -6 }, base({ g: [8.4, 8.8], wa: 30, tgK: 1, tgY: 0.4, fF: [6.4, 0], fB: [-5.2, 0], cape: -2.4, sway: -1, ember: 2 }), [2.0, RY + 3.2]);
    const HOLD = P({ spine: 13, chest: 9, neck: 2, head: -6 }, base({ g: [8.0, 9.2], wa: 30, tgK: 1, tgY: 0.4, fF: [6.4, 0], fB: [-5.2, 0], cape: -1.0, sway: -0.4, ember: 1.6 }), [1.9, RY + 3.4]);
    R.atk_overhead = { n: 12, fps: 10, phases: [5, 2], keys: [[0, READY()], [0.1, OLIFT], [0.22, COCK], [0.34, COCK2], [0.42, TOP], [0.5, DOWN], [0.56, HIT], [0.7, HOLD], [0.85, HOLD], [1, READY({ wa: 50 })]] };

    // AGARRAR (vermelho): solta a mão da frente, recolhe-a e investe com a manopla aberta; o montante fica atrás
    const G0 = P({ spine: -4, chest: -6 }, base({ mode: 1, gB: [-1.0, 10.0], wa: 150, tgK: 0.7, hF: [-2.0, 6.0], haF: 120, open: 0, fF: [4.8, 0], fB: [-4.8, 0], cape: 1.4, eye: 1.6, ember: 1.5 }), [-0.8, RY + 1.0]);
    const G1 = P({ spine: -6, chest: -8, head: -4 }, base({ mode: 1, gB: [-1.4, 10.0], wa: 155, tgK: 0.8, hF: [-3.4, 4.0], haF: 140, open: 1, fF: [5.0, 0], fB: [-5.0, 0], cape: 1.8, eye: 2, ember: 1.8 }), [-1.1, RY + 1.4]);
    const G2 = P({ spine: 16, chest: 6, neck: -2, head: -10 }, base({ mode: 1, gB: [-2.6, 9.0], wa: 160, tgK: 0.8, hF: [11.4, -1.2], haF: -6, open: 1, fF: [7.0, 0], fB: [-5.6, 0], cape: -3.4, capeY: -1, sway: -1.2, eye: 2, ember: 1.8 }), [2.6, RY + 1.8]);
    const G3 = P({ spine: 12, chest: 4, head: -6 }, base({ mode: 1, gB: [-2.2, 9.4], wa: 158, tgK: 0.8, hF: [9.6, 0.4], haF: 10, open: 0, fF: [7.0, 0], fB: [-5.6, 0], cape: -2, sway: -0.6, ember: 1.4 }), [2.2, RY + 1.8]);
    R.atk_grab = { n: 9, fps: 11, phases: [4, 2], keys: [[0, READY()], [0.14, G0], [0.32, G1], [0.42, G1], [0.55, G2], [0.68, G2], [0.82, G3], [1, READY()]] };

    // SALTO (vermelho): agacha-se com o montante às costas, salta e cai a cravá-lo no chão
    const CR = P({ spine: 12, chest: 4, head: -6 }, base({ g: [-1.6, -4.0], wa: -190, tgK: 0, fF: [5.0, 0], fB: [-5.0, 0], cape: 1.6, eye: 1.8, ember: 1.6 }), [-0.4, RY + 4.4]);
    const CR2 = P({ spine: 14, chest: 6, head: -8 }, base({ g: [-1.8, -4.4], wa: -196, tgK: 0, fF: [5.0, 0], fB: [-5.0, 0], cape: 1.8, eye: 2, ember: 1.8 }), [-0.5, RY + 5.0]);
    const AIR1 = P({ spine: -6, chest: -8, head: -10 }, base({ g: [1.0, -10.0], wa: -100, tgK: 0, fF: [3.4, -5.0], fB: [-3.6, -3.4], faF: 20, faB: 30, cape: 2.4, capeY: -6, eye: 2, ember: 1.8 }), [0, RY - 0.4]);
    const AIR2 = P({ spine: -2, chest: -4, head: -10 }, base({ g: [2.6, -9.4], wa: -80, tgK: 0, fF: [3.8, -4.4], fB: [-3.0, -3.0], faF: 20, faB: 30, cape: 2.8, capeY: -7, eye: 2, ember: 1.8 }), [0.2, RY - 0.2]);
    R.atk_leap = { n: 10, fps: 10, phases: [4, 3], keys: [[0, READY()], [0.18, CR], [0.33, CR2], [0.44, AIR1], [0.6, AIR2], [0.67, AIR2], [0.78, HIT], [0.9, HOLD], [1, READY({ wa: 50 })]] };

    // INVESTIDA (vermelho): prepara-se como um touro — ombro à frente, montante a raspar o chão atrás —,
    // corre (charge_run) e, se acerta, derruba com o ombro e derrapa até parar
    const CH0 = P({ spine: 14, chest: 8, neck: -6, head: -10 }, base({ g: [-1.0, 9.4], wa: 168, tgK: 0.85, tgY: 0.2, fF: [5.6, 0], fB: [-5.8, 0], cape: 1.6, eye: 1.8, ember: 1.6 }), [-0.6, RY + 2.6]);
    const CH1 = P({ spine: 20, chest: 10, neck: -8, head: -12 }, base({ g: [-1.6, 9.0], wa: 170, tgK: 0.9, tgY: 0.2, fF: [6.2, 0], fB: [-6.4, 0], faB: 20, cape: 2.2, eye: 2, ember: 2 }), [-1.0, RY + 3.4]);
    const CH2 = P({ spine: 20, chest: 10, neck: -8, head: -12 }, base({ g: [-1.4, 9.2], wa: 170, tgK: 0.9, tgY: 0.2, fF: [5.0, -1.6], fB: [-6.4, 0], faF: 20, faB: 20, cape: 2.0, eye: 2, ember: 2 }), [-0.8, RY + 3.2]);
    const RUN0 = (f, s) => P({ spine: 22, chest: 10, neck: -8, head: -12 }, base({ fF: f.F, fB: f.B, faF: f.F[1] < 0 ? 20 : 0, faB: f.B[1] < 0 ? 20 : 0, g: [-1.6, 9.0], wa: 170, tgK: 0.9, tgY: 0.2, cape: -6 + s * 0.8, capeY: -3.4, sway: s, eye: 2, ember: 2 }), [0.8, RY + 2.2 + Math.abs(s) * 0.8]);
    const RAM = P({ spine: 26, chest: 14, neck: -6, head: -12 }, base({ g: [1.0, 7.4], wa: 150, tgK: 0.6, fF: [7.2, 0], fB: [-5.8, 0], cape: -6, capeY: -2, eye: 2, ember: 2 }), [2.4, RY + 2.6]);
    const SKID = P({ spine: -4, chest: -6, head: -4 }, base({ g: [4.6, 6.0], wa: 40, tgK: 0.7, fF: [7.6, 0], fB: [-3.6, 0], faF: -16, cape: -3, eye: 1.4, ember: 1.4 }), [0.4, RY + 1.6]);
    R.atk_charge = { n: 11, fps: 10, phases: [6, 1], keys: [[0, READY()], [0.2, CH0], [0.36, CH1], [0.44, CH2], [0.5, CH1], [0.56, RUN0(A.stepFeet(0, { stride: 5.6, lift: 3 }), 0)], [0.66, RAM], [0.8, SKID], [1, READY()]] };
    R.charge_run = { n: 6, fps: 12, loop: true, stride: 22, poseFn: (t) => { const f = A.stepFeet(t, { stride: 5.6, lift: 3.0 }); return RUN0(f, Math.sin(t * A.TAU)); } };

    // DERRUBADO: embate na parede, recua, cai de costas, fica estendido e levanta-se apoiado no montante
    const RECOIL = P({ spine: -16, chest: -14, neck: -10, head: -10 }, base({ g: [2.4, -2.0], wa: -60, tgK: 0, fF: [4.8, 0], fB: [-5.2, 0], cape: 3, eye: 2.2, ember: 2.2 }), [-1.4, RY + 0.6]);
    const STUMB = P({ spine: -10, chest: -8, neck: -6 }, base({ g: [1.6, -1.0], wa: -80, tgK: 0, fF: [2.6, 0], fB: [-6.4, 0], cape: 3.6, eye: 1.6, ember: 1.6 }), [-3.0, RY + 2.2], -18);
    const FALL = P({ spine: -6, chest: -4, neck: 4 }, base({ g: [3.0, 0.0], wa: -40, tgK: 0, fF: [4.6, -2.0], fB: [1.4, -1.0], cape: 3.6, capeY: -2, eye: 1.2, ember: 1.2 }), [-5.6, -9.0], -55);
    const LIE = (k) => P({ spine: 2 + k, chest: 2 + k * 0.6, neck: 8, head: 4 - k * 2 }, base({ g: [4.0, 3.6], wa: 8, tgK: 1, tgY: 0, fF: [4.6, 0], fB: [2.2, 0], faF: 40, faB: 30, cape: 3.0, eye: 0.6, ember: 0.9 + k * 0.1 }), [-7.0, -3.4], -84);
    R.knock_fall = { n: 7, fps: 10, keys: [[0, RECOIL], [0.35, STUMB], [0.7, FALL], [1, LIE(0)]] };
    R.knock_down = { n: 4, fps: 4, loop: true, poseFn: (t) => LIE(Math.sin(t * A.TAU) * 2) };
    const SIT = P({ spine: 14, chest: 8, neck: 4 }, base({ g: [6.0, 3.0], wa: 60, tgK: 1, fF: [5.0, 0], fB: [3.0, 0], faF: 40, faB: 40, cape: 2.0, eye: 1.2, ember: 1.2 }), [-4.6, -6.0], -40);
    const KNEEL = (hd) => P({ spine: 6, chest: 4, neck: hd, head: hd * 0.6 }, base({ g: [5.6, -0.6], wa: 90, tgK: 0, gap: 2.6, fF: [5.0, 0], fB: [-3.4, 0], faB: 70, cape: 0.8, eye: 1.2, ember: 1.2 }), [0.2, RY + 7.4]);
    R.knock_getup = { n: 8, fps: 9, keys: [[0, LIE(0)], [0.3, SIT], [0.6, KNEEL(6)], [0.8, KNEEL(0)], [1, READY()]] };
    // entrada: ajoelhado diante do trono, ergue-se
    R.kneel_rise = { n: 6, fps: 6, keys: [[0, KNEEL(26)], [0.45, KNEEL(4)], [1, READY()]] };

    // EVOCAR (fase 2+): crava o montante ao lado e ergue a mão livre; a brasa do peito incendeia-se
    const E0 = P({ spine: -4, chest: -6, head: -10 }, base({ mode: 1, gB: [2.4, 10.4], wa: 92, tgK: 1, tgY: 0.6, hF: [2.4, -11.0], haF: -96, open: 1, cape: 2.4, capeY: -1.5, eye: 2, ember: 2.6 }), [-0.4, RY + 0.4]);
    const E1 = P({ spine: -6, chest: -8, head: -14 }, base({ mode: 1, gB: [2.4, 10.4], wa: 92, tgK: 1, tgY: 0.6, hF: [3.2, -11.6], haF: -100, open: 1, cape: 3.0, capeY: -2.5, sway: 0.8, eye: 2.4, ember: 3 }), [-0.6, RY + 0.4]);
    const E2 = P({ spine: 8, chest: 2, head: -8 }, base({ mode: 1, gB: [2.4, 10.4], wa: 92, tgK: 1, tgY: 0.6, hF: [10.6, -4.4], haF: -20, open: 1, cape: -1.6, capeY: -1, sway: -0.8, eye: 2, ember: 2.4 }), [0.8, RY + 0.8]);
    R.atk_echo = { n: 8, fps: 10, phases: [5, 1], keys: [[0, READY()], [0.15, P({}, base({ mode: 1, gB: [2.4, 10.4], wa: 92, tgK: 1, hF: [3.0, 2.0], haF: 60 }))], [0.4, E0], [0.62, E1], [0.72, E2], [0.86, E2], [1, READY()]] };
    // ESTOCADA (eco de Caedmon, branco): recolhe o montante à altura do peito e investe a fundo
    const TH0 = P({ spine: -4, chest: -6 }, base({ g: [-2.6, 2.4], wa: -2, tgK: 0, fF: [4.6, 0], fB: [-5.0, 0], cape: 1.6, eye: 1.6 }), [-1.2, RY + 1.0]);
    const TH1 = P({ spine: 16, chest: 6, neck: -4 }, base({ g: [10.8, 2.6], wa: 0, tgK: 0, fF: [7.6, 0], fB: [-6.0, 0], cape: -4, capeY: -1.5, sway: -1, eye: 2 }), [3.2, RY + 2.4]);
    R.atk_thrust = { n: 8, fps: 12, phases: [3, 2], keys: [[0, READY()], [0.3, TH0], [0.4, TH0], [0.55, TH1], [0.72, TH1], [1, READY()]] };

    R.hurt = { n: 3, fps: 12, keys: [[0, P({ spine: -10, chest: -8, neck: -6, head: -6 }, base({ g: [3.4, 6.0], wa: 30, tgK: 0.4, cape: 1.6, eye: 2, ember: 1.6 }), [-1.4, RY])], [1, READY()]] };
    R.stagger = { n: 4, fps: 6, loop: true, poseFn: (t) => { const s = Math.sin(t * A.TAU); return P({ spine: 12 + s * 2, chest: 10, neck: 16, head: 4 + s * 3 }, base({ g: [6.4, 6.0], wa: 88, tgK: 1, tgY: 0.3, gap: 2.6, fF: [4.6, 0], fB: [-4.6, 0], cape: s * 0.6, sway: s * 0.5, eye: 0.6, ember: 0.8 + s * 0.2 }), [0.6, RY + 2.0]); } };
    // MORTE: cai de joelhos apoiado no montante, a cabeça tomba, a brasa apaga-se
    R.death = { n: 10, fps: 7, keys: [[0, RECOIL], [0.3, KNEEL(4)], [0.6, P({ spine: 10, chest: 10, neck: 22, head: 12 }, base({ g: [5.6, 0.2], wa: 90, tgK: 0, gap: 2.6, fF: [5.0, 0], fB: [-3.4, 0], faB: 70, cape: 0.4, eye: 0.6, ember: 0.6 }), [0.2, RY + 7.8])], [1, P({ spine: 18, chest: 16, neck: 26, head: 14 }, base({ g: [5.4, 1.4], wa: 90, tgK: 0, gap: 2.4, fF: [5.0, 0], fB: [-3.4, 0], faB: 70, cape: 0, eye: 0, ember: 0.15 }), [0.4, RY + 8.4])]] };
    return R;
  }
  A.register('en_b_aldric', () => A.creature({ name: 'en_b_aldric', S, unit: 1.75, box: [140, 104], anchor: [62, 92], rig, solve, draw, overlay, points, anims: anims(), post: K.post('#ffd8a0', 0.28, 0.035) }));
  (A.previewCell = A.previewCell || {}).en_b_aldric = [150, 150];
})(window.ART);
