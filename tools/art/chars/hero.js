// Vesperal — o Desperto: esqueleto, peças desenhadas, animações → assets/sprites/hero.png
'use strict';
(function (A) {
  const S = 4; // px por unidade lógica (o jogo usa 640×360 unidades)
  const D2R = A.D2R;

  // ---------------------------------------------------------------- paleta
  const M = {
    cloak: A.mat('#2b2632', { shadow: '#18151d', light: '#463f50', deep: '#0f0d13' }),
    robe: A.mat('#9a9080', { shadow: '#655d51', light: '#c9bea8', deep: '#3d3730' }),
    gold: A.mat('#a8874e', { shadow: '#6d5530', light: '#e6c886' }),
    wine: A.mat('#55202a', { shadow: '#33121a', light: '#7c3340', deep: '#1e0a0f' }),
    leather: A.mat('#3d2f2a', { shadow: '#251b19', light: '#5c493f', deep: '#160f0d' }),
    cloth: A.mat('#2c2629', { shadow: '#191416', light: '#40383b' }),
    linen: A.mat('#8e8370', { shadow: '#5f5646', light: '#b3a78f' }),
    boot: A.mat('#2c2225', { shadow: '#171113', light: '#4a3b3e' }),
    iron: A.mat('#55545c', { shadow: '#2c2b31', light: '#9a98a4', deep: '#16151a' }),
    bronze: A.mat('#5a4a36', { shadow: '#2d241a', light: '#9c8460', deep: '#17110b' }),
    glove: A.mat('#2b2327', { shadow: '#18131a', light: '#43393d' }),
    mask: A.mat('#e9e1cf', { shadow: '#a39580', light: '#fffaf0' }),
    wrap: A.mat('#c9bea6', { shadow: '#6f6656', light: '#e8dfca' }),
  };
  const INK = '#0a080d';
  const BACKDIM = 0.7; // membros de trás mais escuros
  let LOOK = 'capuz'; // 'capuz' (aparência inicial) | 'sino' (Elmo do Sineiro, recompensa do chefe Sineiro)
  const LIGHT = [0.65, -1]; // luz de cima e da frente
  const IW = S * 0.2; // espessura das linhas interiores

  // ---------------------------------------------------------------- esqueleto (unidades; ângulos em graus)
  const rig = new A.Rig([
    { n: 'pelvis', len: 2.0, a: -90 },
    { n: 'spine', p: 'pelvis', len: 5.0, a: 0 },
    { n: 'chest', p: 'spine', len: 4.7, a: 0 },
    { n: 'neck', p: 'chest', len: 1.2, a: 0 },
    { n: 'head', p: 'neck', len: 4.6, a: 0 },
    { n: 'thighB', p: 'pelvis', at: 0, len: 6.7, a: 180, off: [0, 0.3] },
    { n: 'shinB', p: 'thighB', len: 6.5, a: 0 },
    { n: 'footB', p: 'shinB', len: 2.9, a: -90 },
    { n: 'thighF', p: 'pelvis', at: 0, len: 6.7, a: 180, off: [0, -0.3] },
    { n: 'shinF', p: 'thighF', len: 6.5, a: 0 },
    { n: 'footF', p: 'shinF', len: 2.9, a: -90 },
    { n: 'uarmB', p: 'chest', at: 0.84, len: 4.8, a: 180, off: [0, 0.2] },
    { n: 'farmB', p: 'uarmB', len: 4.4, a: 0 },
    { n: 'handB', p: 'farmB', len: 1.7, a: 0 },
    { n: 'uarmF', p: 'chest', at: 0.84, len: 4.8, a: 180, off: [0, -0.4] },
    { n: 'farmF', p: 'uarmF', len: 4.4, a: 0 },
    { n: 'handF', p: 'farmF', len: 1.7, a: 0 },
  ]);
  const perp = (B) => [-Math.sin(B.a * D2R), Math.cos(B.a * D2R)];
  const along = (B, t) => [B.x + Math.cos(B.a * D2R) * B.len * t, B.y + Math.sin(B.a * D2R) * B.len * t];
  const norm = (x, y) => { const l = Math.hypot(x, y) || 1; return [x / l, y / l]; };
  function dimMat(m, k) { return { ...m, base: A.mix(m.base, '#07050a', 1 - k), shadow: A.mix(m.shadow, '#050307', 1 - k), light: A.mix(m.light, '#07050a', 1 - k), deep: m.deep }; }

  // ---------------------------------------------------------------- membro contínuo (ombro→cotovelo→pulso / anca→joelho→tornozelo)
  // sem juntas visíveis: um só contorno suave com o cotovelo/joelho arredondado
  function chainPath(p0, p1, p2, w0, w1, w2) {
    const d1 = norm(p1[0] - p0[0], p1[1] - p0[1]), d2 = norm(p2[0] - p1[0], p2[1] - p1[1]);
    const n1 = [-d1[1], d1[0]], n2 = [-d2[1], d2[0]];
    let nb = norm(n1[0] + n2[0], n1[1] + n2[1]);
    const cosh = Math.max(0.45, n1[0] * nb[0] + n1[1] * nb[1]);
    const wb = w1 / cosh;
    const L0 = [p0[0] + n1[0] * w0, p0[1] + n1[1] * w0], L1 = [p1[0] + nb[0] * wb, p1[1] + nb[1] * wb], L2 = [p2[0] + n2[0] * w2, p2[1] + n2[1] * w2];
    const R0 = [p0[0] - n1[0] * w0, p0[1] - n1[1] * w0], R1 = [p1[0] - nb[0] * wb, p1[1] - nb[1] * wb], R2 = [p2[0] - n2[0] * w2, p2[1] - n2[1] * w2];
    // pontos médios para curvas suaves
    const mL0 = [(L0[0] + L1[0]) / 2, (L0[1] + L1[1]) / 2], mL1 = [(L1[0] + L2[0]) / 2, (L1[1] + L2[1]) / 2];
    const mR0 = [(R0[0] + R1[0]) / 2, (R0[1] + R1[1]) / 2], mR1 = [(R1[0] + R2[0]) / 2, (R1[1] + R2[1]) / 2];
    return A.path((q) => {
      q.M(L0[0], L0[1]); q.L(mL0[0], mL0[1]); q.Q(L1[0], L1[1], mL1[0], mL1[1]); q.L(L2[0], L2[1]);
      q.Q(p2[0] + d2[0] * w2 * 1.2, p2[1] + d2[1] * w2 * 1.2, R2[0], R2[1]);
      q.L(mR1[0], mR1[1]); q.Q(R1[0], R1[1], mR0[0], mR0[1]); q.L(R0[0], R0[1]);
      q.Q(p0[0] - d1[0] * w0 * 1.1, p0[1] - d1[1] * w0 * 1.1, L0[0], L0[1]); q.Z();
    }, S);
  }
  // ligaduras: faixas transversais entre t0 e t1 do segmento p1→p2
  function wraps(ctx, path, p1, p2, w, t0, t1, n, wm) {
    const d = norm(p2[0] - p1[0], p2[1] - p1[1]), nn = [-d[1], d[0]], L = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]);
    ctx.save(); ctx.clip(path);
    for (let i = 0; i < n; i++) {
      const ta = t0 + (t1 - t0) * (i / n), tb = ta + (t1 - t0) / n * 0.78;
      const a = [p1[0] + d[0] * L * ta, p1[1] + d[1] * L * ta], b = [p1[0] + d[0] * L * tb, p1[1] + d[1] * L * tb];
      const sk = 0.5;
      ctx.beginPath();
      ctx.moveTo((a[0] + nn[0] * w + d[0] * sk) * S, (a[1] + nn[1] * w + d[1] * sk) * S); ctx.lineTo((b[0] + nn[0] * w + d[0] * sk) * S, (b[1] + nn[1] * w + d[1] * sk) * S);
      ctx.lineTo((b[0] - nn[0] * w) * S, (b[1] - nn[1] * w) * S); ctx.lineTo((a[0] - nn[0] * w) * S, (a[1] - nn[1] * w) * S); ctx.closePath();
      ctx.fillStyle = i % 2 ? wm.shadow : wm.base; ctx.fill();
      ctx.strokeStyle = A.rgba('#000000', 0.45); ctx.lineWidth = IW * 0.8; ctx.stroke();
    }
    ctx.restore();
  }
  function arm(ctx, W, side, m, back) {
    const U = W['uarm' + side], F = W['farm' + side], H = W['hand' + side];
    const p0 = [U.x, U.y], p1 = [F.x, F.y], p2 = [F.ex, F.ey];
    const path = chainPath(p0, p1, p2, 1.15, 0.95, 0.82);
    const sm = back ? dimMat(M.cloth, BACKDIM) : M.cloth;
    A.paint(ctx, path, sm, { light: LIGHT, depth: S * 0.6, inkW: IW, hlw: S * 0.3 });
    A.stroke(ctx, [[p1[0] + (p0[0] - p1[0]) * 0.28, p1[1] + (p0[1] - p1[1]) * 0.28], [p1[0], p1[1]]], IW * 1.3, A.rgba('#000000', 0.4), S);
    if (LOOK === 'sino') {
      // manga curta da túnica (trás) ou espaldeira de ferro (frente)
      const d = norm(p1[0] - p0[0], p1[1] - p0[1]), n = [-d[1], d[0]], L = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]);
      const at = (t, w) => [p0[0] + d[0] * L * t + n[0] * w, p0[1] + d[1] * L * t + n[1] * w];
      if (back) {
        const c0 = at(-0.25, 1.5), c1 = at(0.62, 1.7), c2 = at(0.7, 0.4), c3 = at(0.6, -1.6), c4 = at(-0.25, -1.4);
        const sl = A.path((q) => { q.M(c0[0], c0[1]); q.Q(at(0.3, 1.9)[0], at(0.3, 1.9)[1], c1[0], c1[1]); q.L(c2[0], c2[1]); q.L(at(0.66, -0.6)[0], at(0.66, -0.6)[1]); q.L(c3[0], c3[1]); q.Q(at(0.3, -1.8)[0], at(0.3, -1.8)[1], c4[0], c4[1]); q.Z(); }, S);
        A.paint(ctx, sl, dimMat(M.robe, BACKDIM), { light: LIGHT, depth: S * 0.6, inkW: IW, hlw: S * 0.3 });
      } else {
        const pl = A.path((q) => { q.M(at(-0.35, 1.3)[0], at(-0.35, 1.3)[1]); q.Q(at(-0.5, 0)[0], at(-0.5, 0)[1], at(-0.35, -1.5)[0], at(-0.35, -1.5)[1]); q.L(at(0.5, -1.8)[0], at(0.5, -1.8)[1]); q.Q(at(0.62, 0)[0], at(0.62, 0)[1], at(0.45, 1.6)[0], at(0.45, 1.6)[1]); q.Z(); }, S);
        A.paint(ctx, pl, M.iron, { light: LIGHT, depth: S * 0.5, inkW: IW, hlw: S * 0.3 });
        A.stroke(ctx, [at(0.12, 1.55), at(0.18, -1.7)], S * 0.2, M.iron.shadow, S);
        A.stroke(ctx, [at(0.33, 1.6), at(0.38, -1.75)], S * 0.2, M.iron.shadow, S);
        A.stroke(ctx, [at(-0.32, 0.9), at(-0.32, -1.0)], S * 0.12, A.rgba(M.iron.light, 0.8), S);
        for (const t of [-0.15, 0.25]) { const [rx, ry] = at(t, 1.0); ctx.fillStyle = M.gold.base; ctx.beginPath(); ctx.arc(rx * S, ry * S, S * 0.14, 0, A.TAU); ctx.fill(); }
      }
      ctx.lineWidth = IW; ctx.strokeStyle = INK; ctx.stroke(path);
      if (!back) vambrace(ctx, p1, p2, M.iron);
      hand(ctx, H, back ? dimMat(M.glove, BACKDIM) : M.iron);
    } else {
      // aparência inicial: ligaduras de linho no antebraço, luva escura
      wraps(ctx, path, p1, p2, 1.1, 0.32, 0.98, 4, back ? dimMat(M.wrap, BACKDIM) : M.wrap);
      ctx.lineWidth = IW; ctx.strokeStyle = INK; ctx.stroke(path);
      hand(ctx, H, back ? dimMat(M.glove, BACKDIM) : M.glove);
    }
  }
  // braçal de ferro no antebraço da espada
  function vambrace(ctx, p1, p2, vm) {
    const d = norm(p2[0] - p1[0], p2[1] - p1[1]), n = [-d[1], d[0]], L = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]);
    const at = (t, w) => [p1[0] + d[0] * L * t + n[0] * w, p1[1] + d[1] * L * t + n[1] * w];
    const a0 = at(0.32, 1.15), a1 = at(1.0, 1.0), b1 = at(1.0, -1.0), b0 = at(0.32, -1.15), m0 = at(0.28, 0);
    const path = A.path((q) => { q.M(a0[0], a0[1]); q.L(a1[0], a1[1]); q.L(b1[0], b1[1]); q.L(b0[0], b0[1]); q.Q(m0[0] - d[0] * 0.6, m0[1] - d[1] * 0.6, a0[0], a0[1]); q.Z(); }, S);
    A.paint(ctx, path, vm, { light: LIGHT, depth: S * 0.45, inkW: IW, hlw: S * 0.3 });
    const r0 = at(0.6, 1.1), r1 = at(0.6, -1.1);
    A.stroke(ctx, [r0, r1], S * 0.22, vm.shadow, S);
    A.stroke(ctx, [at(0.36, 0.2), at(0.95, 0.2)], S * 0.12, A.rgba(vm.light, 0.7), S);
    for (const t of [0.42, 0.85]) { const [rx, ry] = at(t, -0.7); ctx.fillStyle = M.gold.base; ctx.beginPath(); ctx.arc(rx * S, ry * S, S * 0.13, 0, A.TAU); ctx.fill(); }
  }
  function leg(ctx, W, side, m, back) {
    const T = W['thigh' + side], N = W['shin' + side], F = W['foot' + side];
    const p0 = [T.x, T.y], p1 = [N.x, N.y], p2 = [N.ex, N.ey];
    const path = chainPath(p0, p1, p2, 1.5, 1.1, 0.82);
    A.paint(ctx, path, m, { light: LIGHT, depth: S * 0.6, inkW: IW, hlw: S * 0.3 });
    ctx.lineWidth = IW; ctx.strokeStyle = INK; ctx.stroke(path);
    if (LOOK !== 'sino') { wraps(ctx, path, p1, p2, 1.25, 0.38, 0.98, 4, back ? dimMat(M.wrap, BACKDIM) : M.wrap); ctx.lineWidth = IW; ctx.strokeStyle = INK; ctx.stroke(path); }
    boot(ctx, F, back ? dimMat(M.boot, BACKDIM) : M.boot);
    if (LOOK === 'sino') greave(ctx, p1, p2, back);
  }
  // cano alto da bota de couro gasto (aparência inicial)
  function bootShaft(ctx, p1, p2, back) {
    const d = norm(p2[0] - p1[0], p2[1] - p1[1]), n = [-d[1], d[0]], L = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]);
    const at = (t, w) => [p1[0] + d[0] * L * t + n[0] * w, p1[1] + d[1] * L * t + n[1] * w];
    const m = back ? dimMat(M.boot, BACKDIM) : M.boot;
    const a0 = at(0.28, -1.3), a1 = at(1.02, -1.0), b1 = at(1.02, 1.0), b0 = at(0.32, 1.25);
    const path = A.path((q) => { q.M(a0[0], a0[1]); q.L(a1[0], a1[1]); q.L(b1[0], b1[1]); q.L(b0[0], b0[1]); q.Q(at(0.22, 0)[0], at(0.22, 0)[1], a0[0], a0[1]); q.Z(); }, S);
    A.paint(ctx, path, m, { light: LIGHT, depth: S * 0.5, inkW: IW, hlw: S * 0.3 });
    A.stroke(ctx, [at(0.3, -1.25), at(0.36, 1.2)], S * 0.3, A.rgba('#000000', 0.35), S); // dobra do cano
    A.stroke(ctx, [at(0.62, -1.15), at(0.62, 1.1)], S * 0.22, back ? M.leather.deep : M.leather.shadow, S); // correia
    const bk = at(0.62, -0.9); ctx.fillStyle = back ? A.mix(M.gold.shadow, '#000', 0.4) : M.gold.shadow; ctx.fillRect((bk[0] - 0.22) * S, (bk[1] - 0.22) * S, 0.44 * S, 0.44 * S);
  }
  // caneleira de ferro gasto por cima da bota
  function greave(ctx, p1, p2, back) {
    const d = norm(p2[0] - p1[0], p2[1] - p1[1]), n = [-d[1], d[0]], L = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]);
    const at = (t, w) => [p1[0] + d[0] * L * t + n[0] * w, p1[1] + d[1] * L * t + n[1] * w];
    // a frente da perna é o lado -n (a perna aponta para baixo, a frente fica à direita)
    const a0 = at(0.12, -1.35), a1 = at(1.02, -1.05), b1 = at(1.02, 0.95), b0 = at(0.4, 1.1);
    const m = back ? dimMat(M.iron, BACKDIM) : M.iron;
    const path = A.path((q) => { q.M(a0[0], a0[1]); q.Q(at(0.55, -1.55)[0], at(0.55, -1.55)[1], a1[0], a1[1]); q.L(b1[0], b1[1]); q.L(b0[0], b0[1]); q.Q(at(0.15, 0.4)[0], at(0.15, 0.4)[1], a0[0], a0[1]); q.Z(); }, S);
    A.paint(ctx, path, m, { light: LIGHT, depth: S * 0.45, inkW: IW, hlw: S * 0.3 });
    A.stroke(ctx, [at(0.2, -1.0), at(0.95, -0.8)], S * 0.12, A.rgba(m.light, 0.7), S);
    const k = at(0.1, -0.6);
    const knee = A.path((q) => q.E(k[0], k[1], 0.95, 0.8), S);
    A.paint(ctx, knee, m, { light: LIGHT, depth: S * 0.3, inkW: IW });
  }
  function boot(ctx, B, m) {
    ctx.save(); A.boneT(ctx, B, S);
    const p = A.path((q) => { q.M(-1.0, -1.15); q.C(0.4, -1.3, 1.7, -1.0, 2.5, -0.35); q.Q(3.35, 0.05, 3.2, 0.85); q.L(-1.25, 1.0); q.Q(-1.7, -0.1, -1.0, -1.15); q.Z(); }, S);
    const a = -B.a * D2R, lx = LIGHT[0] * Math.cos(a) - LIGHT[1] * Math.sin(a), ly = LIGHT[0] * Math.sin(a) + LIGHT[1] * Math.cos(a);
    A.paint(ctx, p, m, { light: [lx, ly], depth: S * 0.5, inkW: IW });
    A.stroke(ctx, [[-1.35, 0.78], [3.2, 0.66]], S * 0.36, '#0d090b', S); // sola
    A.stroke(ctx, [[-1.0, -0.3], [0.7, -0.45]], IW, A.rgba('#000000', 0.5), S); // dobra do cano
    A.stroke(ctx, [[1.7, -0.85], [2.6, -0.25]], S * 0.16, A.rgba('#d0c4b8', 0.35), S);
    ctx.restore();
  }
  function hand(ctx, B, m) {
    ctx.save(); A.boneT(ctx, B, S);
    const p = A.path((q) => { q.M(-0.4, -0.85); q.C(0.7, -1.05, 1.6, -0.75, 1.75, 0); q.C(1.6, 0.8, 0.7, 0.95, -0.4, 0.8); q.Q(-0.8, 0, -0.4, -0.85); q.Z(); }, S);
    A.paint(ctx, p, m, { light: [0, -1], depth: S * 0.4, inkW: IW });
    A.stroke(ctx, [[0.65, -0.65], [0.75, 0.55]], IW * 0.8, A.rgba('#000000', 0.5), S);
    ctx.restore();
  }

  // ---------------------------------------------------------------- aparência inicial: gibão de couro, tabardo cor de vinho, capelete, capuz justo
  function leatherTorso(ctx, W, x) {
    const P = W.pelvis, Sp = W.spine, C = W.chest;
    const pts = [[P, 0.1, 2.7, 2.8], [Sp, 0, 2.5, 2.6], [Sp, 0.6, 2.9, 2.85], [C, 0.45, 3.3, 3.1], [C, 1, 2.5, 2.8]];
    const front = [], back = [];
    for (const [B, t, wf, wb] of pts) { const [px, py] = along(B, t), [nx, ny] = perp(B); front.push([px + nx * wf, py + ny * wf]); back.push([px - nx * wb, py - ny * wb]); }
    const smooth = (q, arr) => { for (let i = 1; i < arr.length; i++) { const a = arr[i - 1], b = arr[i]; q.Q(a[0], a[1], (a[0] + b[0]) / 2, (a[1] + b[1]) / 2); } };
    const path = A.path((q) => {
      q.M(front[0][0], front[0][1]); smooth(q, front); q.L(front[front.length - 1][0], front[front.length - 1][1]);
      q.L(back[back.length - 1][0], back[back.length - 1][1]);
      const br = back.slice().reverse(); smooth(q, br); q.L(back[0][0], back[0][1]); q.Z();
    }, S);
    A.paint(ctx, path, M.leather, { light: LIGHT, depth: S * 1.0, inkW: IW, hlw: S * 0.35 });
    const [nx, ny] = perp(Sp), [cnx, cny] = perp(C);
    ctx.save(); ctx.clip(path);
    const [wx, wy] = along(Sp, 0.05), [cx, cy] = along(C, 0.95);
    A.stroke(ctx, [[wx + nx * 1.2, wy + ny * 1.2], [cx + cnx * 1.0, cy + cny * 1.0]], IW, A.rgba('#000000', 0.5), S);
    A.stroke(ctx, [[wx + nx * 2.9, wy + ny * 2.9 + 0.2], [cx - cnx * 2.4, cy - cny * 2.4]], S * 0.6, M.leather.deep, S);
    A.stroke(ctx, [[wx + nx * 2.9, wy + ny * 2.9 - 0.1], [cx - cnx * 2.4, cy - cny * 2.4 - 0.3]], S * 0.14, A.rgba('#8a7262', 0.7), S);
    for (let i = 0; i < 3; i++) { const t = 0.3 + i * 0.22; const px = A.lerp(wx + nx * 2.9, cx - cnx * 2.4, t), py = A.lerp(wy + ny * 2.9, cy - cny * 2.4, t); ctx.fillStyle = M.iron.light; ctx.beginPath(); ctx.arc(px * S, py * S, S * 0.14, 0, A.TAU); ctx.fill(); }
    ctx.restore();
    const [bx, by] = along(Sp, 0.0);
    A.stroke(ctx, [[bx - nx * 3.0, by - ny * 3.0], [bx + nx * 2.9, by + ny * 2.9]], S * 0.95, '#1d1416', S);
    A.stroke(ctx, [[bx - nx * 3.0, by - ny * 3.0 - 0.35], [bx + nx * 2.9, by + ny * 2.9 - 0.35]], S * 0.14, A.rgba('#6f5646', 0.8), S);
    ctx.save(); ctx.translate((bx + nx * 2.2) * S, (by + ny * 2.2) * S); ctx.rotate(Sp.a * D2R + Math.PI / 2);
    const buck = A.path((q) => { q.M(-0.6, -0.55); q.L(0.6, -0.55); q.L(0.6, 0.55); q.L(-0.6, 0.55); q.Z(); }, S);
    A.paint(ctx, buck, M.gold, { light: [0.5, -1], depth: S * 0.25, inkW: IW });
    ctx.fillStyle = '#1d1416'; ctx.fillRect(-0.25 * S, -0.22 * S, 0.5 * S, 0.44 * S);
    ctx.restore();
    const pb = [bx - nx * 2.4, by - ny * 2.4];
    const pouch = A.path((q) => { q.M(pb[0] - 0.9, pb[1] + 0.3); q.L(pb[0] + 0.8, pb[1] + 0.3); q.Q(pb[0] + 1.0, pb[1] + 2.4, pb[0], pb[1] + 2.6); q.Q(pb[0] - 1.1, pb[1] + 2.4, pb[0] - 0.9, pb[1] + 0.3); q.Z(); }, S);
    A.paint(ctx, pouch, M.leather, { light: LIGHT, depth: S * 0.4, inkW: IW });
    reliquary(ctx, C, x, 2.75);
    return path;
  }
  // relicário de ferro no peito com a brasa
  function reliquary(ctx, C, x, off) {
    const [rx, ry] = along(C, 0.3), [cnx, cny] = perp(C);
    const ex = rx + cnx * off, ey = ry + cny * off;
    ctx.save(); ctx.translate(ex * S, ey * S); ctx.rotate((C.a + 90) * D2R); ctx.scale(1.2, 1.2);
    const glowK = x.ember === undefined ? 1 : x.ember;
    A.glow(ctx, 0.3 * S, 0, S * 4.5, '#ff9a40', 0.6 * glowK);
    const cage = A.path((q) => { q.M(-0.95, 1.25); q.L(-1.05, -0.5); q.Q(-1.05, -1.6, 0, -1.95); q.Q(1.05, -1.6, 1.05, -0.5); q.L(0.95, 1.25); q.Z(); }, S);
    ctx.fillStyle = '#2a0e08'; ctx.fill(cage);
    const eg = ctx.createRadialGradient(0, 0.1 * S, 0, 0, 0, S * 1.3); eg.addColorStop(0, '#fff6d0'); eg.addColorStop(0.3, '#ffbe58'); eg.addColorStop(0.75, '#d0501a'); eg.addColorStop(1, '#601808');
    ctx.fillStyle = eg; ctx.beginPath(); ctx.ellipse(0, 0.15 * S, 0.72 * S, 0.98 * S, 0, 0, A.TAU); ctx.fill();
    ctx.strokeStyle = M.iron.base; ctx.lineWidth = S * 0.22;
    for (const gx of [-0.42, 0.42]) { ctx.beginPath(); ctx.moveTo(gx * S, -1.6 * S); ctx.lineTo(gx * S, 1.25 * S); ctx.stroke(); }
    ctx.beginPath(); ctx.moveTo(-1.0 * S, 0.15 * S); ctx.lineTo(1.0 * S, 0.15 * S); ctx.stroke();
    ctx.lineWidth = IW * 1.2; ctx.strokeStyle = INK; ctx.stroke(cage);
    ctx.strokeStyle = M.iron.light; ctx.lineWidth = S * 0.12; ctx.beginPath(); ctx.moveTo(-0.85 * S, -0.7 * S); ctx.quadraticCurveTo(-0.85 * S, -1.5 * S, 0, -1.78 * S); ctx.stroke();
    ctx.fillStyle = M.gold.base; ctx.beginPath(); ctx.arc(0, -2.05 * S, 0.3 * S, 0, A.TAU); ctx.fill(); ctx.lineWidth = IW; ctx.strokeStyle = INK; ctx.stroke();
    ctx.restore();
  }
  // tabardo cor de vinho: painel da frente e de trás, a acompanhar cada coxa, com bainha dourada
  function tabard(ctx, W, front) {
    const Sp = W.spine, T = front ? W.thighF : W.thighB;
    const [wx, wy] = along(Sp, 0.02), [nx, ny] = perp(Sp);
    const side = front ? 1 : -1;
    const top0 = [wx + nx * 2.7 * side, wy + ny * 2.7 * side], top1 = [wx + nx * 0.3 * side, wy + ny * 0.3 * side];
    const knee = along(T, 0.98), [tnx, tny] = perp(T);
    const bot0 = [knee[0] - tnx * 1.7 * side, knee[1] - tny * 1.7 * side + 0.4], bot1 = [knee[0] + tnx * 0.8 * side, knee[1] + tny * 0.8 * side + 0.6];
    const m = front ? M.wine : dimMat(M.wine, 0.7);
    const path = A.path((q) => {
      q.M(top0[0], top0[1]); q.L(top1[0], top1[1]);
      q.Q((top1[0] + bot1[0]) / 2 + 0.3 * side, (top1[1] + bot1[1]) / 2, bot1[0], bot1[1]);
      const n = 4;
      for (let i = 1; i <= n; i++) { const t = i / n; q.L(A.lerp(bot1[0], bot0[0], t), A.lerp(bot1[1], bot0[1], t) + (i % 2 ? 0.7 : 0)); }
      q.Q((top0[0] + bot0[0]) / 2 - 0.2 * side, (top0[1] + bot0[1]) / 2, top0[0], top0[1]); q.Z();
    }, S);
    A.paint(ctx, path, m, { light: LIGHT, depth: S * 0.7, inkW: IW });
    ctx.save(); ctx.clip(path);
    A.stroke(ctx, [[bot1[0], bot1[1] - 0.7], [bot0[0], bot0[1] - 0.7]], S * 0.42, front ? M.gold.shadow : A.mix(M.gold.shadow, '#000', 0.4), S);
    A.stroke(ctx, [[bot1[0], bot1[1] - 0.82], [bot0[0], bot0[1] - 0.82]], S * 0.12, front ? M.gold.light : M.gold.shadow, S);
    A.stroke(ctx, [[(top0[0] + top1[0]) / 2, (top0[1] + top1[1]) / 2 + 0.6], [(bot0[0] + bot1[0]) / 2, (bot0[1] + bot1[1]) / 2 - 1.2]], IW * 1.4, A.rgba('#000000', 0.4), S);
    ctx.restore();
  }
  // capelete escuro sobre os ombros, com orla dourada
  function capelet(ctx, W, x) {
    const C = W.chest;
    const [cx, cy] = along(C, 0.92), [nx, ny] = perp(C);
    const top = [cx + nx * 0.4, cy + ny * 0.4 - 0.7];
    const fr = [cx + nx * 3.0, cy + ny * 3.0 + 0.5];
    const bk = [cx - nx * 3.2, cy - ny * 3.2 + 0.1];
    const [mx, my] = along(C, 0.3);
    const low = [mx + nx * 0.4, my + ny * 0.4];
    const teeth = [[fr[0] - 0.1, fr[1] + 1.6], [low[0] + 1.9, low[1] + 0.5], [low[0] + 1.0, low[1] + 1.7], [low[0] - 0.1, low[1] + 0.6], [low[0] - 1.1, low[1] + 1.8], [low[0] - 2.0, low[1] + 0.7], [bk[0] + 0.2, bk[1] + 2.2]];
    const path = A.path((q) => {
      q.M(bk[0], bk[1]); q.Q(top[0] - 1.8, top[1] - 1.3, top[0], top[1]); q.Q(fr[0] + 0.3, fr[1] - 1.8, fr[0] + 0.5, fr[1]);
      for (const p of teeth) q.L(p[0], p[1]);
      q.Q(bk[0] - 0.7, bk[1] + 0.9, bk[0], bk[1]); q.Z();
    }, S);
    A.paint(ctx, path, M.cloak, { light: LIGHT, depth: S * 0.9, inkW: IW, hlw: S * 0.4 });
    ctx.save(); ctx.clip(path);
    A.stroke(ctx, [[top[0] - 0.2, top[1] + 0.6], [low[0] - 0.1, low[1] + 1.2]], S * 0.45, A.rgba(M.cloak.deep, 0.75), S);
    A.stroke(ctx, [[top[0] + 1.4, top[1] + 0.6], [low[0] + 1.6, low[1] + 1.0]], S * 0.35, A.rgba(M.cloak.deep, 0.6), S);
    A.stroke(ctx, teeth.map(([a, b]) => [a, b - 0.9]), S * 0.42, M.gold.shadow, S);
    ctx.restore();
    ctx.save(); ctx.translate((cx + nx * 1.9) * S, (cy + ny * 1.9 + 0.2) * S);
    const clasp = A.path((q) => q.E(0, 0, 0.5, 0.5), S);
    A.paint(ctx, clasp, M.gold, { light: [0.5, -1], depth: S * 0.2, inkW: IW });
    ctx.restore();
  }
  // capuz justo com a ponta caída e máscara de porcelana com fissura dourada
  function hoodHead(ctx, W, x) {
    const N = W.neck, H = W.head;
    ctx.save();
    ctx.translate(N.ex * S, N.ey * S); ctx.rotate((H.a + 90) * D2R); ctx.scale(1.12, 1.12);
    const sway = x.hoodSway || 0;
    const tail = A.path((q) => { q.M(-0.6, -6.5); q.C(-3.0, -7.3, -5.4, -5.6 + sway * 0.4, -5.8 + sway * 0.3, -2.2 + sway); q.Q(-5.0, -2.9 + sway * 0.5, -4.4, -3.0); q.Q(-3.4, -4.2, -2.4, -3.4); q.Z(); }, S);
    A.paint(ctx, tail, M.cloak, { light: [0.4, -1], depth: S * 0.6, inkW: IW });
    A.stroke(ctx, [[-1.4, -6.2], [-3.6, -5.6], [-5.2, -3.0 + sway * 0.7]], IW * 1.3, A.rgba(M.cloak.deep, 0.8), S);
    const hood = A.path((q) => { q.M(-3.0, 0.9); q.C(-4.0, -2.6, -3.2, -6.6, 0.2, -6.9); q.C(3.2, -7.1, 4.7, -5.0, 4.7, -2.6); q.Q(4.7, -0.4, 3.5, 0.9); q.Q(0.2, 1.7, -3.0, 0.9); q.Z(); }, S);
    A.paint(ctx, hood, M.cloak, { light: [0.6, -1], depth: S * 1.0, inkW: IW * 1.2, hlw: S * 0.5 });
    ctx.save(); ctx.clip(hood);
    A.stroke(ctx, [[-2.6, -4.6], [-1.6, -1.4], [-2.2, 0.8]], S * 0.45, A.rgba(M.cloak.deep, 0.7), S);
    A.stroke(ctx, [[-0.8, -6.2], [0.4, -3.8]], S * 0.3, A.rgba(M.cloak.deep, 0.6), S);
    ctx.restore();
    const open = A.path((q) => { q.M(1.0, -5.9); q.C(2.9, -6.3, 4.4, -4.9, 4.3, -2.6); q.Q(4.2, -0.4, 2.9, 0.45); q.Q(1.0, 0.6, 0.6, -1.8); q.Q(0.4, -4.5, 1.0, -5.9); q.Z(); }, S);
    ctx.fillStyle = '#050407'; ctx.fill(open);
    const mask = A.path((q) => {
      q.M(1.4, -5.15); q.Q(3.0, -5.5, 3.6, -4.4); q.Q(3.78, -3.9, 3.55, -3.55); q.L(4.4, -2.3); q.Q(4.5, -2.0, 4.0, -1.95);
      q.Q(3.95, -1.45, 3.75, -1.2); q.Q(3.9, -0.5, 3.3, 0.06); q.Q(2.3, 0.25, 1.7, -0.5); q.Q(1.05, -2.8, 1.4, -5.15); q.Z();
    }, S);
    A.paint(ctx, mask, M.mask, { light: [0.9, -0.5], depth: S * 0.65, inkW: IW, hlw: S * 0.35, hlAlpha: 0.95 });
    A.stroke(ctx, [[3.55, -2.9], [3.1, -2.2], [3.2, -1.5]], IW * 0.9, A.rgba('#6d604e', 0.55), S);
    const eye = A.path((q) => { q.M(2.3, -3.15); q.Q(2.85, -3.62, 3.4, -3.25); q.Q(2.85, -2.92, 2.3, -3.15); q.Z(); }, S);
    ctx.fillStyle = '#0d080b'; ctx.fill(eye);
    if (x.eyeGlow) { ctx.fillStyle = A.rgba('#ffb060', 0.6 * x.eyeGlow); ctx.fill(eye); }
    const crack = [[2.0, -5.2], [2.3, -4.45], [2.1, -3.85], [2.7, -2.95], [2.4, -2.15], [2.8, -1.35], [2.5, -0.6]];
    A.stroke(ctx, crack, S * 0.32, '#4e3c28', S);
    A.stroke(ctx, crack, S * 0.15, '#f0cc7a', S);
    ctx.save(); ctx.clip(mask);
    const sh = ctx.createLinearGradient(0, -5.4 * S, 0, -3.2 * S); sh.addColorStop(0, 'rgba(0,0,0,0.6)'); sh.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = sh; ctx.fillRect(0, -6 * S, 5 * S, 3.5 * S);
    const sh2 = ctx.createLinearGradient(1.2 * S, 0, 2.6 * S, 0); sh2.addColorStop(0, 'rgba(0,0,0,0.55)'); sh2.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = sh2; ctx.fillRect(0, -6 * S, 3 * S, 7 * S);
    ctx.restore();
    const brim = A.path((q) => { q.M(0.3, -6.4); q.C(2.4, -6.9, 4.3, -5.9, 4.75, -4.3); q.Q(4.1, -5.0, 2.7, -5.4); q.Q(1.5, -5.6, 0.6, -5.2); q.Z(); }, S);
    A.paint(ctx, brim, M.cloak, { light: [0.4, -1], depth: S * 0.45, inkW: IW, hlw: S * 0.25 });
    ctx.restore();
  }
  // ---------------------------------------------------------------- tronco: túnica de linho de mortalha, escapulário, relicário
  function robeTorso(ctx, W, x) {
    const P = W.pelvis, Sp = W.spine, C = W.chest;
    const pts = [[P, 0.2, 2.9, 3.0], [Sp, 0, 2.7, 2.8], [Sp, 0.6, 3.1, 3.0], [C, 0.45, 3.5, 3.3], [C, 1, 2.7, 3.0]];
    const front = [], back = [];
    for (const [B, t, wf, wb] of pts) { const [px, py] = along(B, t), [nx, ny] = perp(B); front.push([px + nx * wf, py + ny * wf]); back.push([px - nx * wb, py - ny * wb]); }
    const smooth = (q, arr) => { for (let i = 1; i < arr.length; i++) { const a = arr[i - 1], b = arr[i]; q.Q(a[0], a[1], (a[0] + b[0]) / 2, (a[1] + b[1]) / 2); } };
    const path = A.path((q) => {
      q.M(front[0][0], front[0][1]); smooth(q, front); q.L(front[front.length - 1][0], front[front.length - 1][1]);
      q.L(back[back.length - 1][0], back[back.length - 1][1]);
      const br = back.slice().reverse(); smooth(q, br); q.L(back[0][0], back[0][1]); q.Z();
    }, S);
    A.paint(ctx, path, M.robe, { light: LIGHT, depth: S * 1.1, inkW: IW, hlw: S * 0.4 });
    const [nx, ny] = perp(Sp), [cnx, cny] = perp(C);
    const [wx, wy] = along(Sp, 0.05), [cx, cy] = along(C, 0.95);
    ctx.save(); ctx.clip(path);
    // pregas do linho
    for (let k = 0; k < 3; k++) { const o = -1.6 + k * 1.3; A.stroke(ctx, [[wx + nx * o, wy + ny * o], [cx + cnx * (o * 0.8), cy + cny * (o * 0.8)]], IW * 1.3, A.rgba(M.robe.deep, 0.35), S); }
    // escapulário cor de vinho com sol bordado (frente)
    const s0 = [wx + nx * 1.0, wy + ny * 1.0], s1 = [wx + nx * 3.3, wy + ny * 3.3], s2 = [cx + cnx * 3.0, cy + cny * 3.0], s3 = [cx + cnx * 0.9, cy + cny * 0.9];
    const scap = A.path((q) => { q.M(s0[0], s0[1]); q.L(s1[0], s1[1]); q.L(s2[0], s2[1]); q.L(s3[0], s3[1]); q.Z(); }, S);
    A.paint(ctx, scap, M.wine, { light: LIGHT, depth: S * 0.6, inkW: IW, hl: true });
    ctx.restore();
    // correia do boldrié (diagonal) com tachas
    ctx.save(); ctx.clip(path);
    A.stroke(ctx, [[wx - nx * 2.6, wy - ny * 2.6 + 0.4], [cx + cnx * 2.4, cy + cny * 2.4]], S * 0.62, M.leather.base, S);
    A.stroke(ctx, [[wx - nx * 2.6, wy - ny * 2.6 + 0.1], [cx + cnx * 2.4, cy + cny * 2.4 - 0.3]], S * 0.13, A.rgba('#8a7262', 0.7), S);
    for (let i = 0; i < 3; i++) { const t = 0.25 + i * 0.22; const px = A.lerp(wx - nx * 2.6, cx + cnx * 2.4, t), py = A.lerp(wy - ny * 2.6, cy + cny * 2.4, t); ctx.fillStyle = M.iron.light; ctx.beginPath(); ctx.arc(px * S, py * S, S * 0.13, 0, A.TAU); ctx.fill(); }
    ctx.restore();
    // cinto de couro com fivela e cordão de contas
    const [bx, by] = along(Sp, 0.0);
    A.stroke(ctx, [[bx - nx * 3.1, by - ny * 3.1], [bx + nx * 3.0, by + ny * 3.0]], S * 1.0, M.leather.deep, S);
    A.stroke(ctx, [[bx - nx * 3.1, by - ny * 3.1 - 0.35], [bx + nx * 3.0, by + ny * 3.0 - 0.35]], S * 0.14, A.rgba('#7a5f4e', 0.9), S);
    ctx.save(); ctx.translate((bx + nx * 2.1) * S, (by + ny * 2.1) * S); ctx.rotate(Sp.a * D2R + Math.PI / 2);
    const buck = A.path((q) => { q.M(-0.6, -0.6); q.L(0.6, -0.6); q.L(0.6, 0.6); q.L(-0.6, 0.6); q.Z(); }, S);
    A.paint(ctx, buck, M.gold, { light: [0.5, -1], depth: S * 0.25, inkW: IW });
    ctx.fillStyle = M.leather.deep; ctx.fillRect(-0.26 * S, -0.24 * S, 0.52 * S, 0.48 * S);
    ctx.restore();
    // rosário pendurado do cinto
    const rs = [bx + nx * 1.2, by + ny * 1.2 + 0.4];
    for (let i = 0; i < 6; i++) { ctx.fillStyle = i === 5 ? M.gold.base : '#2a1e1a'; ctx.beginPath(); ctx.arc((rs[0] + Math.sin(i * 0.5) * 0.4 + (x.rosarySway || 0) * i * 0.08) * S, (rs[1] + i * 0.55) * S, S * (i === 5 ? 0.3 : 0.2), 0, A.TAU); ctx.fill(); }
    reliquary(ctx, C, x, 2.9);
    return path;
  }
  // saia da túnica: painéis que acompanham as coxas (abertura à frente), bainha suja de cinza
  function skirt(ctx, W, front) {
    const Sp = W.spine, T = front ? W.thighF : W.thighB;
    const [wx, wy] = along(Sp, 0.0), [nx, ny] = perp(Sp);
    const knee = along(T, 1.0), td = norm(Math.cos(T.a * D2R), Math.sin(T.a * D2R));
    const len = 8.4;
    const hip = along(T, 0);
    const hemC = [hip[0] + td[0] * len, hip[1] + td[1] * len];
    const tn = [-td[1], td[0]];
    const side = front ? 1 : -1;
    const w0a = front ? 0.6 : -3.1, w0b = front ? 3.0 : 0.3; // cintura: de dentro para fora
    const hA = [hemC[0] - tn[0] * 2.4 - 0.6, hemC[1] - tn[1] * 2.4 + 0.2]; // frente da bainha (a coxa aponta para baixo: -tn = frente)
    const hB = [hemC[0] + tn[0] * 2.6 - 0.2, hemC[1] + tn[1] * 2.6 + 0.6];
    const top0 = [wx + nx * w0b, wy + ny * w0b], top1 = [wx + nx * w0a, wy + ny * w0a];
    const m = front ? M.robe : dimMat(M.robe, 0.78);
    const path = A.path((q) => {
      q.M(top1[0], top1[1]); q.L(top0[0], top0[1]);
      q.Q(top0[0] + 0.4, (top0[1] + hA[1]) / 2, hA[0], hA[1]);
      const n = 6;
      for (let i = 1; i <= n; i++) { const t = i / n; q.L(A.lerp(hA[0], hB[0], t) + (i % 2 ? 0.2 : -0.2), A.lerp(hA[1], hB[1], t) + (i % 2 ? 0.9 : 0)); }
      q.Q(top1[0] - 0.6, (top1[1] + hB[1]) / 2, top1[0], top1[1]); q.Z();
    }, S);
    A.paint(ctx, path, m, { light: LIGHT, depth: S * 0.9, inkW: IW, hlw: S * 0.35 });
    ctx.save(); ctx.clip(path);
    // sujidade de cinza a subir da bainha
    const g = ctx.createLinearGradient(0, (hemC[1] - 4) * S, 0, (hemC[1] + 1) * S); g.addColorStop(0, 'rgba(30,24,22,0)'); g.addColorStop(1, 'rgba(30,24,22,0.7)');
    ctx.fillStyle = g; ctx.fillRect((hemC[0] - 6) * S, (hemC[1] - 6) * S, 12 * S, 8 * S);
    // pregas verticais
    for (let k = 0; k < 3; k++) { const t = 0.25 + k * 0.25; A.stroke(ctx, [[A.lerp(top1[0], top0[0], t), A.lerp(top1[1], top0[1], t) + 0.5], [A.lerp(hB[0], hA[0], t), A.lerp(hB[1], hA[1], t) - 0.4]], IW * 1.4, A.rgba(M.robe.deep, 0.4), S); }
    ctx.restore();
  }
  // murça curta cor de vinho sobre os ombros, com galão dourado
  function mozzetta(ctx, W, x) {
    const C = W.chest;
    const [cx, cy] = along(C, 0.93), [nx, ny] = perp(C);
    const top = [cx + nx * 0.4, cy + ny * 0.4 - 0.6];
    const fr = [cx + nx * 3.2, cy + ny * 3.2 + 0.6];
    const bk = [cx - nx * 3.4, cy - ny * 3.4 + 0.2];
    const [mx, my] = along(C, 0.32);
    const low = [mx + nx * 0.3, my + ny * 0.3];
    const edge = [[fr[0] - 0.1, fr[1] + 1.4], [low[0] + 1.7, low[1] + 0.9], [low[0], low[1] + 1.3], [low[0] - 1.8, low[1] + 0.9], [bk[0] + 0.1, bk[1] + 1.9]];
    const path = A.path((q) => {
      q.M(bk[0], bk[1]); q.Q(top[0] - 1.9, top[1] - 1.4, top[0], top[1]); q.Q(fr[0] + 0.3, fr[1] - 1.9, fr[0] + 0.5, fr[1]);
      q.Q(edge[0][0] + 0.3, edge[0][1] + 0.2, edge[1][0], edge[1][1]);
      q.Q(edge[2][0] + 0.8, edge[2][1] + 0.4, edge[2][0], edge[2][1]);
      q.Q(edge[2][0] - 0.8, edge[2][1] + 0.4, edge[3][0], edge[3][1]);
      q.Q(edge[4][0] + 0.6, edge[4][1] + 0.3, edge[4][0], edge[4][1]);
      q.Q(bk[0] - 0.8, bk[1] + 0.9, bk[0], bk[1]); q.Z();
    }, S);
    A.paint(ctx, path, M.wine, { light: LIGHT, depth: S * 0.9, inkW: IW, hlw: S * 0.45 });
    ctx.save(); ctx.clip(path);
    A.stroke(ctx, [[top[0] - 0.4, top[1] + 0.8], [low[0] - 0.2, low[1] + 0.9]], S * 0.42, A.rgba(M.wine.deep, 0.7), S);
    A.stroke(ctx, [[top[0] + 1.4, top[1] + 0.8], [low[0] + 1.5, low[1] + 0.6]], S * 0.3, A.rgba(M.wine.deep, 0.55), S);
    A.stroke(ctx, edge.map(([a, b]) => [a, b - 0.35]), S * 0.42, M.gold.base, S);
    A.stroke(ctx, edge.map(([a, b]) => [a, b - 0.5]), S * 0.12, M.gold.light, S);
    ctx.restore();
  }

  // ---------------------------------------------------------------- manto (borda exterior simulada)
  function mantle(ctx, W, cloth, x) {
    const C = W.chest, Sp = W.spine, P = W.pelvis;
    const [cx, cy] = along(C, 0.95), [nx, ny] = perp(C);
    const sb = [cx - nx * 2.6, cy - ny * 2.6];
    const [wx, wy] = along(Sp, 0.3), [snx, sny] = perp(Sp);
    const wb = [wx - snx * 3.1, wy - sny * 3.1];
    const [hx, hy] = along(P, 0), [pnx, pny] = perp(P);
    const hb = [hx - pnx * 3.1, hy - pny * 3.1];
    const chain = cloth, end = chain[chain.length - 1];
    const inner = [hb[0] + 0.8, Math.max(hb[1] + 3.5, end[1] - 1.4 + (x.mantleLift || 0))];
    const hemPts = [];
    const n = 8;
    for (let i = 0; i <= n; i++) { const t = i / n; hemPts.push([A.lerp(end[0], inner[0], t), A.lerp(end[1], inner[1], t)]); }
    const path = A.path((q) => {
      q.M(sb[0] + nx * 1.6, sb[1] + ny * 1.6 - 0.4);
      q.Q(sb[0] - 0.8, sb[1] - 0.6, chain[1][0], chain[1][1]);
      for (let i = 2; i < chain.length; i++) { const a = chain[i - 1], b = chain[i]; q.Q(a[0], a[1], (a[0] + b[0]) / 2, (a[1] + b[1]) / 2); }
      q.L(end[0], end[1]);
      hemPts.forEach(([hx2, hy2], i) => { if (!i) return; const tooth = i % 2 ? 1.3 : -0.1; q.L(hx2 + (i % 2 ? -0.35 : 0.2), hy2 + tooth); });
      q.Q(hb[0] - 0.3, hb[1] + 2.4, hb[0], hb[1]);
      q.L(wb[0], wb[1]); q.Z();
    }, S);
    A.paint(ctx, path, M.cloak, { light: LIGHT, depth: S * 1.6, inkW: IW * 1.2, hlw: S * 0.55 });
    ctx.save(); ctx.clip(path);
    A.stroke(ctx, chain.slice(2), S * 0.9, A.rgba(M.wine.shadow, 0.65), S);
    for (let k = 0; k < 5; k++) {
      const hp = hemPts[Math.min(n, 1 + k * 2)];
      const top = [sb[0] - 0.4 - k * 0.35, sb[1] + 1.2 + k * 0.3];
      const mid = [(top[0] + hp[0]) / 2 - 0.6 + (k % 2) * 0.8, (top[1] + hp[1]) / 2];
      A.stroke(ctx, [top, mid, [hp[0], hp[1] - 0.6]], S * 0.7, A.rgba(M.cloak.deep, 0.7), S);
      A.stroke(ctx, [[top[0] + 0.55, top[1]], [mid[0] + 0.55, mid[1]], [hp[0] + 0.55, hp[1] - 0.6]], S * 0.18, A.rgba(M.cloak.light, 0.45), S);
    }
    const emb = hemPts.map(([a, b]) => [a, b - 1.4]);
    A.stroke(ctx, emb, S * 0.6, M.gold.shadow, S);
    A.stroke(ctx, emb.map(([a, b]) => [a, b - 0.25]), S * 0.12, A.rgba(M.gold.light, 0.7), S);
    for (let i = 0; i < emb.length; i += 2) { ctx.fillStyle = M.gold.base; ctx.beginPath(); ctx.arc(emb[i][0] * S, (emb[i][1] + 0.55) * S, S * 0.22, 0, A.TAU); ctx.fill(); }
    ctx.restore();
  }

  function head(ctx, W, x) { if (LOOK === 'sino') bellHead(ctx, W, x); else hoodHead(ctx, W, x); }
  // ---------------------------------------------------------------- cabeça: elmo-sino de bronze com fenda em cruz e fita de linho
  function bellHead(ctx, W, x) {
    const N = W.neck, H = W.head;
    ctx.save();
    ctx.translate(N.ex * S, N.ey * S); ctx.rotate((H.a + 90) * D2R); ctx.translate(0.5 * S, 1.0 * S); ctx.scale(0.86, 0.86);
    const sway = x.hoodSway || 0;
    // fita de linho presa à coroa do sino, a esvoaçar para trás
    const rb = [[-0.2, -7.4], [-1.8, -7.3 + sway * 0.2], [-3.2, -6.0 + sway * 0.5], [-4.2, -3.8 + sway], [-4.6, -1.2 + sway * 1.3]];
    const ribbon = A.path((q) => {
      q.M(rb[0][0], rb[0][1] - 0.4);
      for (let i = 1; i < rb.length; i++) q.Q(rb[i - 1][0] - 0.3, rb[i - 1][1] - 0.6, rb[i][0] - 0.5, rb[i][1] - 0.2);
      q.L(rb[rb.length - 1][0] - 0.9, rb[rb.length - 1][1] + 1.2); q.L(rb[rb.length - 1][0] - 0.1, rb[rb.length - 1][1] + 0.5); q.L(rb[rb.length - 1][0] + 0.6, rb[rb.length - 1][1] + 1.1);
      for (let i = rb.length - 2; i >= 0; i--) q.Q(rb[i + 1][0] + 0.6, rb[i + 1][1] + 0.4, rb[i][0] + 0.5, rb[i][1] + 0.6);
      q.Z();
    }, S);
    A.paint(ctx, ribbon, M.linen, { light: [0.3, -1], depth: S * 0.35, inkW: IW });
    // corpo do sino
    const bell = A.path((q) => {
      q.M(-3.6, 1.0); q.C(-3.3, -0.4, -2.6, -1.0, -2.5, -2.6); q.C(-2.4, -4.6, -2.3, -6.3, -1.1, -7.0); q.Q(0, -7.5, 1.1, -7.0);
      q.C(2.3, -6.3, 2.4, -4.6, 2.5, -2.6); q.C(2.6, -1.0, 3.3, -0.4, 3.7, 1.0); q.Q(0, 1.75, -3.6, 1.0); q.Z();
    }, S);
    A.paint(ctx, bell, M.bronze, { light: [0.6, -1], depth: S * 1.1, inkW: IW * 1.2, hlw: S * 0.45, hlAlpha: 0.9 });
    ctx.save(); ctx.clip(bell);
    // reflexo vertical do metal e manchas de verdete
    const rg = ctx.createLinearGradient(-2.5 * S, 0, 2.6 * S, 0); rg.addColorStop(0, 'rgba(0,0,0,0.25)'); rg.addColorStop(0.62, 'rgba(255,230,190,0.0)'); rg.addColorStop(0.75, 'rgba(255,230,190,0.22)'); rg.addColorStop(0.86, 'rgba(255,230,190,0.0)');
    ctx.fillStyle = rg; ctx.fillRect(-4 * S, -8 * S, 8 * S, 10 * S);
    const vr = A.rng(31);
    for (let i = 0; i < 7; i++) { ctx.fillStyle = A.rgba('#4d7a6a', 0.25 + vr() * 0.2); ctx.beginPath(); ctx.ellipse((-2 + vr() * 3) * S, (-6 + vr() * 6) * S, (0.3 + vr() * 0.5) * S, (0.2 + vr() * 0.3) * S, vr() * 3, 0, A.TAU); ctx.fill(); }
    // faixas gravadas a ouro
    const band = (y, w) => { ctx.beginPath(); ctx.moveTo(-3.6 * S, (y + 0.45) * S); ctx.quadraticCurveTo(0, (y + 1.15) * S, 3.7 * S, (y + 0.45) * S); ctx.lineWidth = w * S; ctx.strokeStyle = M.gold.shadow; ctx.stroke(); ctx.lineWidth = w * 0.35 * S; ctx.strokeStyle = M.gold.light; ctx.stroke(); };
    band(-0.3, 0.55); band(-4.0, 0.42);
    for (let i = 0; i < 7; i++) { const xx = -2.2 + i * 0.7; ctx.fillStyle = A.rgba(M.gold.base, 0.8); ctx.fillRect((xx - 0.1) * S, (-2.6 + Math.abs(xx) * 0.04) * S, 0.2 * S, 0.5 * S); } // letras gastas
    ctx.restore();
    // fenda em cruz (ligeiramente voltada para a câmara) com a brasa por dentro
    const vx = 1.25;
    const slit = A.path((q) => { q.M(vx - 0.22, -5.0); q.L(vx + 0.22, -5.0); q.L(vx + 0.22, -1.4); q.L(vx - 0.22, -1.4); q.Z(); q.M(vx - 1.1, -3.85); q.L(vx + 1.1, -3.85); q.L(vx + 1.1, -3.4); q.L(vx - 1.1, -3.4); q.Z(); }, S);
    ctx.fillStyle = '#0b0507'; ctx.fill(slit);
    ctx.save(); ctx.clip(slit);
    const eg = ctx.createRadialGradient(vx * S, -3.6 * S, 0, vx * S, -3.6 * S, 1.6 * S); eg.addColorStop(0, A.rgba('#ffd890', 0.95 * (x.eyeGlow === undefined ? 1 : x.eyeGlow))); eg.addColorStop(1, 'rgba(255,120,40,0.15)');
    ctx.fillStyle = eg; ctx.fillRect(-1 * S, -6 * S, 5 * S, 6 * S); ctx.restore();
    A.glow(ctx, vx * S, -3.6 * S, S * 1.8, '#ff9a40', 0.35 * (x.eyeGlow === undefined ? 1 : x.eyeGlow));
    // coroa (asa) do sino
    const crown = A.path((q) => { q.M(-0.75, -7.05); q.Q(-0.85, -8.5, 0, -8.6); q.Q(0.85, -8.5, 0.75, -7.05); q.L(0.35, -7.1); q.Q(0.4, -8.0, 0, -8.05); q.Q(-0.4, -8.0, -0.35, -7.1); q.Z(); }, S);
    A.paint(ctx, crown, M.bronze, { light: [0.6, -1], depth: S * 0.3, inkW: IW });
    // aba inferior (interior escuro do sino sobre o pescoço)
    const lip = A.path((q) => { q.M(-3.4, 0.95); q.Q(0, 1.55, 3.5, 0.95); q.Q(0, 2.1, -3.4, 0.95); q.Z(); }, S);
    ctx.fillStyle = '#0c0907'; ctx.fill(lip);
    ctx.restore();
  }

  // ---------------------------------------------------------------- composição de um fotograma
  function drawFigure(ctx, pose, cloth, opts = {}) {
    const W = rig.solve(pose);
    const x = pose.extra || {};
    if (cloth) mantle(ctx, W, cloth, x);
    if (LOOK === 'sino') {
      arm(ctx, W, 'B', dimMat(M.cloth, BACKDIM), true);
      skirt(ctx, W, false);
      leg(ctx, W, 'B', dimMat(M.cloth, BACKDIM), true);
      robeTorso(ctx, W, x);
      leg(ctx, W, 'F', M.cloth, false);
      skirt(ctx, W, true);
      mozzetta(ctx, W, x);
    } else {
      arm(ctx, W, 'B', dimMat(M.cloth, BACKDIM), true);
      leg(ctx, W, 'B', dimMat(M.cloth, BACKDIM), true);
      tabard(ctx, W, false);
      leatherTorso(ctx, W, x);
      leg(ctx, W, 'F', M.cloth, false);
      tabard(ctx, W, true);
      capelet(ctx, W, x);
    }
    head(ctx, W, x);
    if (!opts.noFrontArm) arm(ctx, W, 'F', M.cloth, false);
    return W;
  }

  // pós-processo: grão, orla fria de recorte, contorno exterior
  function post(cv) {
    A.grain(cv, 0.045, 7);
    A.rim(cv, -S * 0.4, -S * 0.45, '#a098c8', 0.35);
    return A.outline(cv, S * 0.32, INK);
  }

  // ---------------------------------------------------------------- poses
  const P = (o) => ({ root: o.root || [0, -13.4], rootA: o.rootA || 0, angles: o.a || {}, extra: o.x || {} });
  // ângulos: pernas — coxa negativa = joelho à frente; canela positiva = pé atrás. braços — negativo = para a frente
  const STAND = { pelvis: 0, spine: 3, chest: 2, neck: -1, head: 0, thighF: -8, shinF: 10, footF: -2, thighB: 9, shinB: 6, footB: -15, uarmF: -10, farmF: -34, uarmB: 10, farmB: -22 };
  const add = (base, d) => { const o = { ...base }; for (const k in d) o[k] = (o[k] || 0) + d[k]; return o; };
  const nrm = (a) => { while (a > 180) a -= 360; while (a < -180) a += 360; return a; };

  function ground(pose) {
    const W = rig.solve(pose);
    let maxY = -1e9;
    for (const f of ['footF', 'footB']) { const B = W[f]; maxY = Math.max(maxY, B.y + 1.0, B.ey + 0.9); }
    pose.root = [pose.root[0], pose.root[1] - maxY];
    return pose;
  }
  // cinemática inversa de dois ossos para os braços (pega da arma num alvo, com ângulo da lâmina)
  function ikArm(pose, side, target, handA, bend) {
    const W = rig.solve(pose);
    const U = W['uarm' + side], C = W.chest, Hd = rig.by['hand' + side];
    const L1 = rig.by['uarm' + side].len, L2 = rig.by['farm' + side].len;
    const ha = handA * D2R;
    const wx = target[0] - Math.cos(ha) * Hd.len * 0.5, wy = target[1] - Math.sin(ha) * Hd.len * 0.5;
    let dx = wx - U.x, dy = wy - U.y; let d = Math.hypot(dx, dy);
    d = A.clamp(d, Math.abs(L1 - L2) + 0.05, L1 + L2 - 0.05);
    const th = Math.atan2(dy, dx);
    const a1 = Math.acos(A.clamp((L1 * L1 + d * d - L2 * L2) / (2 * L1 * d), -1, 1));
    const sol = (sg) => { const u = th + sg * a1; const ex = U.x + Math.cos(u) * L1, ey = U.y + Math.sin(u) * L1; const f = Math.atan2(U.y + Math.sin(th) * d - ey, U.x + Math.cos(th) * d - ex); return { u: u / D2R, f: f / D2R }; };
    let s1 = sol(1), s2 = sol(-1);
    const r1 = nrm(s1.f - s1.u), r2 = nrm(s2.f - s2.u);
    let pick = bend ? (bend > 0 ? (r1 > 0 ? s1 : s2) : (r1 < 0 ? s1 : s2)) : (r1 < 0 ? s1 : s2);
    pose.angles['uarm' + side] = nrm(pick.u - C.a - 180);
    pose.angles['farm' + side] = nrm(pick.f - pick.u);
    pose.angles['hand' + side] = nrm(handA - pick.f);
  }
  // aplica alvos de pega: x.g = [dx,dy] relativo ao ombro da frente; x.wa = ângulo da lâmina; x.two = pega a duas mãos
  function applyIK(pose) {
    const x = pose.extra;
    if (!x.g) return;
    const W = rig.solve(pose);
    const U = W.uarmF;
    const tgt = [U.x + x.g[0], U.y + x.g[1]];
    ikArm(pose, 'F', tgt, x.wa, x.bendF);
    x.w = 0;
    if (x.two) {
      const d = [Math.cos(x.wa * D2R), Math.sin(x.wa * D2R)];
      const tb = [tgt[0] - d[0] * x.two, tgt[1] - d[1] * x.two];
      ikArm(pose, 'B', tb, x.wa, x.bendB);
    } else if (x.gB) {
      const UB = rig.solve(pose).uarmB;
      ikArm(pose, 'B', [UB.x + x.gB[0], UB.y + x.gB[1]], x.waB === undefined ? 90 : x.waB, x.bendB);
    }
  }
  function grip(W, x) {
    const H = W.handF;
    const gx = H.x + Math.cos(H.a * D2R) * H.len * 0.5, gy = H.y + Math.sin(H.a * D2R) * H.len * 0.5;
    return [gx, gy, nrm(H.a + (x.w === undefined ? -70 : x.w)), x.wl === undefined ? 1 : x.wl];
  }
  function gripB(W) { const H = W.handB; return [H.x + Math.cos(H.a * D2R) * H.len * 0.5, H.y + Math.sin(H.a * D2R) * H.len * 0.5, nrm(H.a)]; }

  // fotograma: pose → desenho + pontos (pega, brasa, cabeça); a capa é simulada ao longo da animação
  function frameOf(pose, o, t, state, warm, ctx) {
    if (o.mod) o.mod(pose, t);
    if (o.ground !== false && pose.extra.air !== true) ground(pose);
    if (o.lift) pose.root[1] -= o.lift(t);
    applyIK(pose);
    const W = rig.solve(pose);
    const [cx, cy] = along(W.chest, 0.95), [nx, ny] = perp(W.chest);
    const ax = cx - nx * 2.6, ay = cy - ny * 2.6;
    if (!state.cloth) { state.cloth = new A.Cloth(7, 2.15, { g: 26, damp: 0.86 }); state.cloth.reset(ax, ay, 1); }
    const vel = typeof o.vel === 'function' ? o.vel(t) : (o.vel || [0, 0]);
    const sub = 4, dt = 1 / (o.fps || 12) / sub;
    let chain;
    const flare = o.flare === undefined ? 0.7 : o.flare;
    for (let k = 0; k < sub; k++) chain = state.cloth.step(ax, ay, vel[0], vel[1], dt, (o.wind || 0) + Math.sin((t + k / sub / (o.n || 4)) * A.TAU) * (o.flutter === undefined ? 0.6 : o.flutter), (j, b) => {
      const lim = ax + 0.2 - j * flare; if (b.x > lim) return [lim, b.y]; return null;
    });
    if (warm) return null;
    drawFigure(ctx, pose, chain);
    const ember = along(W.chest, 0.32), en = perp(W.chest);
    const pts = { grip: grip(W, pose.extra), ember: [ember[0] + en[0] * 2.9, ember[1] + en[1] * 2.9], head: [W.head.x, W.head.y] };
    if (pose.extra.dual) pts.gripB = gripB(W);
    return { points: pts };
  }
  function keyAnim(keys, o = {}) {
    return {
      n: o.n, fps: o.fps || 12, loop: !!o.loop, phases: o.phases, warm: o.loop ? 3 : 1,
      frame(t, i, state, warm, ctx) {
        const pose = o.poseFn ? o.poseFn(t, i) : A.interp(keys, t, o.ease);
        pose.extra = Object.assign({}, pose.extra);
        return frameOf(pose, o, t, state, warm, ctx);
      },
    };
  }
  // animação de ataque: lista explícita de poses por fotograma + fases (antecipação, golpe, recuperação)
  function atk(frames, ph, o = {}) {
    const n = frames.length;
    return {
      n, fps: o.fps || 16, loop: false, warm: 1,
      phases: { wind: [0, ph[0]], act: [ph[0], ph[0] + ph[1]], rec: [ph[0] + ph[1], n] },
      frame(t, i, state, warm, ctx) {
        const f = frames[i];
        const pose = P({ a: f.a, x: Object.assign({}, f.x), root: f.root });
        return frameOf(pose, Object.assign({ n, vel: f.vel || o.vel || [0, 0], ground: !(f.x && f.x.air) }, o), i / n, state, warm, ctx);
      },
    };
  }
  // ajuda: fotograma com corpo (ângulos), pega [dx,dy] e ângulo da lâmina
  const F = (a, g, wa, x = {}) => ({ a, x: Object.assign({ g, wa }, x) });

  // ---------------------------------------------------------------- corpos de referência
  const B = {
    ready: add(STAND, { spine: 6, chest: 2, thighF: -16, shinF: 16, thighB: 18, shinB: 10, footB: -18, uarmB: -10, farmB: -40 }),
    lunge: add(STAND, { spine: 16, chest: 6, neck: -6, thighF: -44, shinF: 40, footF: 4, thighB: 34, shinB: 18, footB: -22, uarmB: 24, farmB: -30 }),
    coil: add(STAND, { spine: -4, chest: -10, neck: 4, thighF: -14, shinF: 22, thighB: 22, shinB: 22, footB: -20, uarmB: -30, farmB: -50 }),
    deep: add(STAND, { spine: 24, chest: 10, neck: -12, thighF: -58, shinF: 58, footF: 4, thighB: 40, shinB: 20, footB: -24, uarmB: 34, farmB: -24 }),
    air: { spine: 8, chest: 4, neck: -4, thighF: -54, shinF: 70, footF: 10, thighB: -6, shinB: 60, footB: 18, uarmB: -40, farmB: -40 },
    crouch: { spine: 24, chest: 8, neck: -16, head: -4, thighF: -82, shinF: 124, footF: -44, thighB: -42, shinB: 120, footB: -72, uarmB: -22, farmB: -32 },
  };
  const AIR = { air: true };
  const rootAir = [0, -16];

  // ---------------------------------------------------------------- folha base (movimento, esquiva, dano, morte, parede, escalada, cura, feitiço, descanso, impulso)
  function baseAnims() {
    const R = {};
    R.idle = keyAnim([
      [0, P({ a: STAND, x: { w: -80, hoodSway: 0 } })],
      [0.5, P({ a: add(STAND, { spine: 1.5, chest: 2, neck: -1, uarmF: -2, farmF: -3, uarmB: 2, thighF: -1, shinF: 2, thighB: 1, shinB: 2 }), x: { w: -78, hoodSway: 0.3, ember: 1.15 } })],
      [1, P({ a: STAND, x: { w: -80, hoodSway: 0 } })],
    ], { n: 8, fps: 7, loop: true, ease: A.ease.sine, flutter: 0.5 });
    const runPose = (t) => {
      const ph = t * A.TAU, s = Math.sin(ph), c = Math.cos(ph);
      const a = {
        pelvis: 0, spine: 16, chest: 3 + c * 2, neck: -8, head: -4,
        thighF: -40 * s - 6, shinF: 16 + Math.max(0, -c) * 48 + (s < 0 ? 24 : 0), footF: -6 + (s > 0.4 ? 14 : 0),
        thighB: 40 * s - 6, shinB: 16 + Math.max(0, c) * 48 + (s > 0 ? 24 : 0), footB: -6 + (s < -0.4 ? 14 : 0),
        uarmB: -38 * s + 6, farmB: -46 - Math.max(0, -s) * 30,
        uarmF: 20 * s + 34, farmF: -30 + s * 12,
      };
      return { root: [0, -13.4], rootA: 0, angles: a, extra: { w: -132 + s * 6, wl: 1, hoodSway: 1.4 + s * 0.4 } };
    };
    R.run = keyAnim(null, { n: 8, fps: 13, loop: true, poseFn: runPose, vel: [10, 0], wind: -0.5, flutter: 0.9, flare: 1.0, lift: (t) => Math.abs(Math.sin(t * A.TAU * 2 + 0.6)) * 0.7 });
    const walkPose = (t) => {
      const ph = t * A.TAU, s = Math.sin(ph), c = Math.cos(ph);
      return { root: [0, -13.4], angles: { spine: 6, chest: 2, neck: -3, thighF: -24 * s - 3, shinF: 8 + Math.max(0, -c) * 28, footF: -4, thighB: 24 * s - 3, shinB: 8 + Math.max(0, c) * 28, footB: -4, uarmB: -18 * s + 8, farmB: -24, uarmF: 12 * s + 6, farmF: -36 }, extra: { w: -92, hoodSway: 0.6 } };
    };
    R.walk = keyAnim(null, { n: 8, fps: 9, loop: true, poseFn: walkPose, vel: [4.5, 0], flutter: 0.6, lift: (t) => Math.abs(Math.sin(t * A.TAU)) * 0.35 });
    R.turn = keyAnim([[0, P({ a: add(STAND, { spine: 10, chest: -6, thighF: -20, shinF: 30, thighB: 20, shinB: 10 }), x: { w: -100 } })], [1, P({ a: STAND, x: { w: -80 } })]], { n: 3, fps: 16 });
    const JUMP = { spine: 8, chest: 4, neck: -4, thighF: -64, shinF: 74, footF: 10, thighB: -12, shinB: 56, footB: 18, uarmF: -22, farmF: -44, uarmB: -46, farmB: -34 };
    R.jump = keyAnim([[0, P({ a: add(STAND, { thighF: -22, shinF: 34, thighB: -12, shinB: 34, spine: 12 }), x: { w: -100 } })], [1, P({ a: JUMP, x: { w: -112, hoodSway: -1.5 } })]], { n: 3, fps: 14, ground: false, vel: [0, -16] });
    R.apex = keyAnim([[0, P({ a: JUMP, x: { w: -112, hoodSway: -1 } })], [1, P({ a: add(JUMP, { thighF: 14, shinF: -20, thighB: 10, shinB: -10, uarmB: 20, uarmF: 10 }), x: { w: -100, hoodSway: 0 } })]], { n: 2, fps: 10, ground: false });
    const FALL = { spine: 4, chest: 2, neck: 4, head: 4, thighF: -32, shinF: 42, footF: 16, thighB: 12, shinB: 32, footB: 20, uarmF: -64, farmF: -42, uarmB: -100, farmB: -32 };
    R.fall = keyAnim([[0, P({ a: FALL, x: { w: -92, hoodSway: 1.5 } })], [0.5, P({ a: add(FALL, { uarmB: -10, uarmF: -6, thighF: 4, shinB: 6 }), x: { w: -88, hoodSway: 1.8 } })], [1, P({ a: FALL, x: { w: -92, hoodSway: 1.5 } })]], { n: 4, fps: 10, loop: true, ground: false, vel: [0, 16] });
    R.land = keyAnim([[0, P({ a: add(STAND, { spine: 20, chest: 6, neck: -9, thighF: -54, shinF: 86, footF: -24, thighB: -22, shinB: 74, footB: -44, uarmF: -32, farmF: -42, uarmB: -44 }), x: { w: -100 } })], [1, P({ a: STAND, x: { w: -80 } })]], { n: 4, fps: 14, vel: [0, 8] });
    // salto duplo (com as asas da mariposa): cambalhota curta
    R.double = keyAnim([[0, P({ a: add(JUMP, { spine: 20, chest: 10, thighF: -30, shinF: 40 }), rootA: 0, x: { w: -110 } })], [0.5, P({ a: add(JUMP, { spine: 30, chest: 16, thighF: -80, shinF: 110, thighB: -60, shinB: 110 }), rootA: 0, x: { w: -130, hoodSway: -2 } })], [1, P({ a: JUMP, x: { w: -112 } })]], { n: 4, fps: 14, ground: false, vel: [0, -14] });
    R.crouch = keyAnim([[0, P({ a: STAND, x: { w: -80 } })], [1, P({ a: add(B.crouch, { uarmF: -26, farmF: -44 }), x: { w: -90, mantleLift: -3 } })]], { n: 3, fps: 18 });
    R.crouchIdle = keyAnim([[0, P({ a: add(B.crouch, { uarmF: -26, farmF: -44 }), x: { w: -90, mantleLift: -3 } })], [0.5, P({ a: add(B.crouch, { spine: 2, chest: 1, uarmF: -26, farmF: -44 }), x: { w: -88, mantleLift: -3 } })], [1, P({ a: add(B.crouch, { uarmF: -26, farmF: -44 }), x: { w: -90, mantleLift: -3 } })]], { n: 4, fps: 6, loop: true });
    R.crawl = keyAnim(null, { n: 6, fps: 9, loop: true, poseFn: (t) => { const s = Math.sin(t * A.TAU); return P({ a: add(B.crouch, { thighF: -10 * s, thighB: 10 * s, shinF: 6 * s, uarmF: -26, farmF: -44 + 8 * s }), x: { w: -95, mantleLift: -3 } }); }, vel: [3, 0] });
    // esquiva no chão: avanço baixo e rasante, com o manto a arrastar; esquiva no ar (Passo de Cinza)
    R.dodge = keyAnim([
      [0, P({ a: add(B.lunge, { spine: 10, uarmF: -20, farmF: -30 }), x: { w: -140 } })],
      [0.25, P({ a: add(B.deep, { spine: 14, chest: 10, uarmF: 30, farmF: -20, uarmB: 50 }), x: { w: -160, hoodSway: 2, mantleLift: -2 } })],
      [0.7, P({ a: add(B.deep, { spine: 8, uarmF: 20, farmF: -24, uarmB: 40 }), x: { w: -150, hoodSway: 1.5 } })],
      [1, P({ a: B.ready, x: { w: -110 } })],
    ], { n: 6, fps: 18, vel: [22, 0], wind: -1.4, flare: 1.3 });
    R.airdash = keyAnim([
      [0, P({ a: add(B.air, { spine: 30, chest: 10, thighF: -20, shinF: 50, thighB: 40, shinB: 60, uarmF: 40, farmF: -20, uarmB: 60 }), x: { w: -170, hoodSway: 2.5 } })],
      [1, P({ a: add(B.air, { spine: 34, chest: 12, thighF: -10, shinF: 40, thighB: 50, shinB: 50, uarmF: 50, farmF: -16, uarmB: 70 }), x: { w: -175, hoodSway: 3 } })],
    ], { n: 3, fps: 18, ground: false, vel: [30, 0], wind: -2, flare: 1.6 });
    R.hurt = keyAnim([
      [0, P({ a: add(STAND, { spine: -16, chest: -12, neck: 12, head: 10, thighF: -20, shinF: 30, thighB: 30, shinB: 20, uarmF: -60, farmF: -30, uarmB: -70, farmB: -30 }), x: { w: -40, eyeGlow: 0.2 } })],
      [0.5, P({ a: add(STAND, { spine: -10, chest: -8, neck: 8, thighF: -16, shinF: 24, thighB: 24, shinB: 16, uarmF: -40, uarmB: -50 }), x: { w: -60, eyeGlow: 0.6 } })],
      [1, P({ a: B.ready, x: { w: -90 } })],
    ], { n: 4, fps: 14, vel: [-8, 0] });
    // morte: cai de joelhos, apoia-se na arma, tomba e a brasa apaga-se
    R.death = keyAnim([
      [0, P({ a: add(STAND, { spine: -14, chest: -10, neck: 10, uarmF: -50, uarmB: -60 }), x: { w: -50 } })],
      [0.25, P({ a: { spine: 20, chest: 10, neck: 10, head: 6, thighF: -90, shinF: 150, footF: -60, thighB: -40, shinB: 140, footB: -80, uarmF: -20, farmF: -40, uarmB: 20, farmB: -20 }, x: { w: 20, ember: 0.8, eyeGlow: 0.6 } })],
      [0.55, P({ a: { spine: 40, chest: 20, neck: 20, head: 14, thighF: -90, shinF: 150, footF: -60, thighB: -40, shinB: 140, footB: -80, uarmF: 10, farmF: -20, uarmB: 40, farmB: -10 }, x: { w: 40, ember: 0.5, eyeGlow: 0.3 } })],
      [1, P({ a: { spine: 80, chest: 20, neck: 10, head: 10, thighF: -70, shinF: 120, footF: -40, thighB: -10, shinB: 90, footB: -40, uarmF: 60, farmF: -10, uarmB: 70, farmB: -10 }, x: { w: 60, ember: 0.05, eyeGlow: 0 } })],
    ], { n: 10, fps: 10, vel: [0, 4] });
    // parede: deslizar agarrado (a figura vira-se para a parede à frente)
    R.wall = keyAnim([[0, P({ a: add(STAND, { spine: -6, thighF: -50, shinF: 70, thighB: -10, shinB: 50, uarmF: -150, farmF: -10, uarmB: -130, farmB: -30 }), x: { w: -170, hoodSway: -1 } })], [1, P({ a: add(STAND, { spine: -4, thighF: -46, shinF: 66, thighB: -14, shinB: 54, uarmF: -146, farmF: -14, uarmB: -126, farmB: -34 }), x: { w: -170, hoodSway: -0.5 } })]], { n: 2, fps: 8, loop: true, ground: false, vel: [0, 6] });
    // escalada (heras/correntes): mãos alternadas, pés a empurrar
    R.climb = keyAnim(null, { n: 6, fps: 9, loop: true, ground: false, poseFn: (t) => { const s = Math.sin(t * A.TAU); return P({ root: [0, -15], a: { spine: -2, chest: 0, neck: -6, thighF: -40 + s * 30, shinF: 60 - s * 30, footF: -10, thighB: -40 - s * 30, shinB: 60 + s * 30, footB: -10, uarmF: -160 + s * 25, farmF: 10 - s * 10, uarmB: -160 - s * 25, farmB: 10 + s * 10 }, x: { w: -150, wl: 0 } }); }, vel: [0, -4] });
    R.climbIdle = keyAnim([[0, P({ root: [0, -15], a: { spine: -2, neck: -6, thighF: -40, shinF: 60, footF: -10, thighB: -40, shinB: 60, footB: -10, uarmF: -160, farmF: 10, uarmB: -150, farmB: 0 }, x: { w: -150, wl: 0 } })], [1, P({ root: [0, -15.2], a: { spine: -2, neck: -6, thighF: -40, shinF: 60, footF: -10, thighB: -40, shinB: 60, footB: -10, uarmF: -158, farmF: 8, uarmB: -150, farmB: 0 }, x: { w: -150, wl: 0 } })]], { n: 2, fps: 4, loop: true, ground: false });
    // cura: ajoelha, acende o círio diante da máscara
    R.heal = keyAnim([
      [0, P({ a: B.ready, x: { w: -90 } })],
      [0.4, P({ a: { spine: 18, chest: 8, neck: 6, head: 6, thighF: -86, shinF: 110, footF: -24, thighB: -30, shinB: 130, footB: -80, uarmF: 20, farmF: -60, uarmB: -60, farmB: -90 }, x: { w: 60, ember: 1.3 } })],
      [1, P({ a: { spine: 16, chest: 6, neck: 8, head: 8, thighF: -86, shinF: 110, footF: -24, thighB: -30, shinB: 130, footB: -80, uarmF: 20, farmF: -60, uarmB: -66, farmB: -96 }, x: { w: 60, ember: 1.6, eyeGlow: 1.4 } })],
    ], { n: 6, fps: 10 });
    // Centelha: mão de trás projeta a brasa
    R.spell = keyAnim([
      [0, P({ a: add(B.coil, { uarmB: -70, farmB: -80 }), x: { w: -100, ember: 1.6 } })],
      [0.4, P({ a: add(B.lunge, { uarmB: -96, farmB: 6 }), x: { w: -110, ember: 0.7 } })],
      [1, P({ a: add(B.ready, { uarmB: -40, farmB: -40 }), x: { w: -100 } })],
    ], { n: 5, fps: 14, vel: [-4, 0] });
    // descanso no altar: ajoelhado, espada no chão
    R.rest = keyAnim([
      [0, P({ a: { spine: 12, chest: 6, neck: 14, head: 10, thighF: -86, shinF: 100, footF: -16, thighB: -26, shinB: 136, footB: -84, uarmF: -6, farmF: -50, uarmB: 10, farmB: -40 }, x: { w: 90, ember: 1.2 } })],
      [1, P({ a: { spine: 13, chest: 7, neck: 16, head: 12, thighF: -86, shinF: 100, footF: -16, thighB: -26, shinB: 136, footB: -84, uarmF: -4, farmF: -52, uarmB: 10, farmB: -40 }, x: { w: 90, ember: 1.5 } })],
    ], { n: 4, fps: 4, loop: true, ease: A.ease.sine });
    // Impulso do Peregrino: agacha a concentrar a brasa e dispara na vertical
    R.impulse = keyAnim([
      [0, P({ a: add(B.crouch, { spine: 14, uarmF: -40, farmF: -60, uarmB: -40 }), x: { w: -100, ember: 1.4, mantleLift: -3 } })],
      [0.5, P({ a: add(B.crouch, { spine: 24, uarmF: -20, farmF: -80, uarmB: -20 }), x: { w: -100, ember: 2.0, eyeGlow: 1.6, mantleLift: -3 } })],
      [0.6, P({ a: { spine: -4, chest: -6, neck: -10, thighF: 6, shinF: 10, footF: 30, thighB: 14, shinB: 20, footB: 30, uarmF: -170, farmF: -10, uarmB: 20, farmB: -10 }, x: { w: -180, ember: 2.0, eyeGlow: 1.6, air: true, hoodSway: 3 } })],
      [1, P({ a: { spine: -2, chest: -4, neck: -6, thighF: 0, shinF: 14, footF: 26, thighB: 10, shinB: 26, footB: 26, uarmF: -165, farmF: -14, uarmB: 30, farmB: -16 }, x: { w: -180, ember: 1.6, air: true, hoodSway: 3.5 } })],
    ], { n: 6, fps: 14, ground: true, vel: (t) => (t > 0.55 ? [0, -26] : [0, 0]), flare: 0.2 });
    // despertar (início do jogo): caída como na morte, a brasa reacende no peito, ergue a cabeça, apoia-se,
    // fica de joelhos e levanta-se — o Desperto volta a acordar
    const LYING = { spine: 84, chest: 16, neck: 14, head: 14, thighF: -60, shinF: 120, footF: -40, thighB: -14, shinB: 96, footB: -40, uarmF: -10, farmF: -30, uarmB: -20, farmB: -40 };
    const KNEEL = { spine: 12, chest: 6, neck: 14, head: 10, thighF: -86, shinF: 100, footF: -16, thighB: -26, shinB: 136, footB: -84, uarmF: -6, farmF: -50, uarmB: 10, farmB: -40 };
    R.wake = keyAnim([
      [0, P({ a: LYING, x: { w: 60, ember: 0.02, eyeGlow: 0 } })],
      [0.22, P({ a: LYING, x: { w: 60, ember: 0.35, eyeGlow: 0 } })],
      [0.36, P({ a: add(LYING, { spine: -10, neck: -24, head: -16, uarmF: -30, farmF: -40, uarmB: -40, farmB: -30 }), x: { w: 60, ember: 0.6, eyeGlow: 0.5 } })],
      [0.52, P({ a: { spine: 42, chest: 18, neck: 4, head: -4, thighF: -90, shinF: 150, footF: -60, thighB: -40, shinB: 140, footB: -80, uarmF: 20, farmF: -40, uarmB: 40, farmB: -30 }, x: { w: 40, ember: 0.9, eyeGlow: 0.8 } })],
      [0.68, P({ a: KNEEL, x: { w: 90, ember: 1.4, eyeGlow: 1.2 } })],
      [0.8, P({ a: add(KNEEL, { neck: -14, head: -12 }), x: { w: 90, ember: 1.7, eyeGlow: 1.5 } })],
      [0.9, P({ a: { spine: 14, chest: 4, neck: 2, head: 0, thighF: -64, shinF: 70, footF: -6, thighB: -6, shinB: 50, footB: -40, uarmF: -20, farmF: -40, uarmB: 20, farmB: -30 }, x: { w: -20, ember: 1.4, eyeGlow: 1.2 } })],
      [1, P({ a: STAND, x: { w: -80, ember: 1.0, eyeGlow: 1 } })],
    ], { n: 16, fps: 8, vel: [0, 2] });
    R.pickup = keyAnim([[0, P({ a: STAND, x: { w: -80 } })], [0.5, P({ a: { spine: 30, chest: 10, neck: 10, thighF: -50, shinF: 70, thighB: -10, shinB: 60, uarmF: 10, farmF: -20, uarmB: -30, farmB: -40 }, x: { w: -60 } })], [1, P({ a: STAND, x: { w: -80 } })]], { n: 5, fps: 12 });
    return R;
  }

  // ---------------------------------------------------------------- movesets por classe de arma (alvos de pega + ângulo da lâmina)
  const MOVES = {};
  // ESPADA: equilibrada (Lâmina do Desperto)
  MOVES.espada = () => {
    const R = {};
    R.l1 = atk([
      F(B.coil, [-2, -6.2], -130), F(B.coil, [-3, -5.6], -158),
      F(B.ready, [2.6, -5], -70), F(B.lunge, [7, -0.6], 4), F(B.lunge, [6, 4], 56),
      F(B.lunge, [5, 5], 70), F(B.ready, [4, 5.5], 72), F(B.ready, [3, 6.2], 62),
    ], [2, 3]);
    R.l2 = atk([
      F(B.lunge, [4.5, 6.4], 108), F(B.lunge, [3.5, 7], 125),
      F(B.lunge, [6.5, 2], 22), F(B.lunge, [6.2, -3.4], -48), F(B.ready, [4, -6.2], -100),
      F(B.ready, [3, -5.4], -112), F(B.ready, [2.6, -3], -116), F(B.ready, [3, 1.5], -70),
    ], [2, 3]);
    R.l3 = atk([
      F(B.coil, [-0.5, -7.5], -108), F(B.coil, [-2.2, -8], -150), F(B.coil, [-3, -7.2], -172),
      F(B.lunge, [3, -6.2], -80), F(B.deep, [7.5, 0.2], 10), F(B.deep, [6.4, 4.6], 64),
      F(B.deep, [5.6, 5.4], 74), F(B.lunge, [5, 5.6], 74), F(B.ready, [4, 6], 70), F(B.ready, [3, 6.2], 62),
    ], [3, 3], { vel: [6, 0] });
    R.air = atk([F(B.air, [-2.5, -5.6], -150, AIR), F(B.air, [2.5, -5], -70, AIR), F(B.air, [7, -0.5], 6, AIR), F(B.air, [6, 4], 58, AIR), F(B.air, [5, 4.6], 66, AIR), F(B.air, [4, 5], 66, AIR)], [1, 3], { ground: false });
    R.air2 = atk([F(B.air, [4.5, 5.4], 110, AIR), F(B.air, [6.5, 2], 20, AIR), F(B.air, [6, -3.4], -48, AIR), F(B.air, [3.8, -6], -102, AIR), F(B.air, [3, -5], -112, AIR), F(B.air, [3, -2], -110, AIR)], [1, 3], { ground: false });
    R.up = atk([F(B.ready, [5, 2.5], 34), F(add(B.ready, { spine: -4, chest: -6 }), [6, -2.5], -38), F(add(B.ready, { spine: -8, chest: -10 }), [3, -7.5], -86), F(add(B.ready, { spine: -10, chest: -10 }), [-1.6, -7.6], -140), F(B.ready, [-1, -6.5], -140), F(B.ready, [1, -4], -118)], [1, 3]);
    R.down = atk([F(B.air, [3, -2.5], -40, AIR), F(add(B.air, { spine: 20 }), [5.6, 2.6], 44, AIR), F(add(B.air, { spine: 26 }), [3.4, 6.6], 88, AIR), F(add(B.air, { spine: 26 }), [0.6, 8], 108, AIR), F(B.air, [1.5, 6.5], 100, AIR), F(B.air, [2.5, 5], 92, AIR)], [1, 3], { ground: false });
    R.crouch = atk([F(add(B.crouch, {}), [1.5, 3.2], 8), F(add(B.crouch, { spine: 6 }), [8.2, 3.4], 4), F(add(B.crouch, { spine: 8 }), [8.6, 3.4], 4), F(B.crouch, [6, 3.8], 12), F(B.crouch, [3, 4], 20)], [1, 2]);
    R.riposte = atk([F(B.coil, [0, -0.5], 0), F(B.deep, [8.6, -0.8], -4), F(B.deep, [9, -0.8], -4), F(B.deep, [8.8, -0.6], -4), F(B.lunge, [6, 2], 20), F(B.ready, [4, 4], 50), F(B.ready, [3, 5.5], 60)], [1, 3], { vel: [10, 0] });
    R.heavy = atk([
      F(B.coil, [-1.5, -5.5], -150, { ember: 1.3 }), F(add(B.coil, { spine: -8, chest: -14 }), [-3.6, -4.2], -176, { ember: 1.6 }), F(add(B.coil, { spine: -10, chest: -16 }), [-3.8, -4], -178, { ember: 1.9, eyeGlow: 1.4 }),
      F(B.lunge, [3, -3.4], -60), F(B.deep, [8.4, 0], 0), F(B.deep, [6.6, 3.6], 46),
      F(B.deep, [6, 4.6], 60), F(B.lunge, [5, 5.2], 66), F(B.ready, [4, 5.8], 66),
    ], [3, 3], { vel: [8, 0] });
    R.parry = atk([F(B.ready, [4.6, -2.6], -64), F(add(B.ready, { spine: -6, chest: -6 }), [5.4, -4.2], -84), F(add(B.ready, { spine: -4 }), [4.8, -3.4], -78), F(B.ready, [4, -1], -60)], [1, 2], { fps: 18 });
    R.guard = keyAnim([[0, P({ a: add(B.ready, { spine: -2 }), x: { g: [4.4, -3], wa: -80 } })], [1, P({ a: add(B.ready, { spine: -1 }), x: { g: [4.4, -3.1], wa: -80 } })]], { n: 2, fps: 6, loop: true });
    R.plunge = atk([F(add(B.air, { spine: -6 }), [1, -7], -92, AIR), F(add(B.air, { spine: 18, thighF: -80, shinF: 110 }), [2.4, 5.6], 90, AIR), F(add(B.air, { spine: 18, thighF: -80, shinF: 110 }), [2.4, 5.8], 90, AIR), F(add(B.deep, { spine: 30 }), [3, 7], 90), F(add(B.deep, { spine: 20 }), [3.5, 6.5], 80), F(B.ready, [3, 6], 66)], [1, 2], { ground: false });
    return R;
  };

  // ---------------------------------------------------------------- gerador de golpes interpolados
  // keys: [{ b: corpo, g: [dx,dy], wa, x: {...}, two, gB, waB }], counts: fotogramas entre chaves; ph: [antecipação, golpe]
  const K = (b, g, wa, x) => ({ b, g, wa, x: x || {} });
  function seq(keys, counts, ph, o = {}) {
    const frames = [];
    const mk = (A0, B0, t) => {
      const b = {}; const names = new Set([...Object.keys(A0.b), ...Object.keys(B0.b)]);
      for (const n of names) b[n] = A.lerp(A0.b[n] || 0, B0.b[n] || 0, t);
      const x = Object.assign({}, t < 0.5 ? A0.x : B0.x);
      for (const k of ['gB', 'waB']) if (A0.x[k] !== undefined && B0.x[k] !== undefined) x[k] = Array.isArray(A0.x[k]) ? [A.lerp(A0.x[k][0], B0.x[k][0], t), A.lerp(A0.x[k][1], B0.x[k][1], t)] : A.lerp(A0.x[k], B0.x[k], t);
      for (const k of ['ember', 'eyeGlow', 'two']) if (A0.x[k] !== undefined || B0.x[k] !== undefined) x[k] = A.lerp(A0.x[k] || 0, B0.x[k] || 0, t);
      return F(b, [A.lerp(A0.g[0], B0.g[0], t), A.lerp(A0.g[1], B0.g[1], t)], A.lerp(A0.wa, B0.wa, t), x);
    };
    frames.push(mk(keys[0], keys[0], 0));
    for (let i = 1; i < keys.length; i++) { const c = counts[i - 1]; for (let k = 1; k <= c; k++) frames.push(mk(keys[i - 1], keys[i], A.ease.io(k / c))); }
    return atk(frames, ph, o);
  }
  const DUAL = (gB, waB) => ({ dual: true, gB, waB });
  const TWO = (d) => ({ two: d });

  // NAVALHAS — par de navalhas: golpes curtos e rápidos, alternando mãos
  MOVES.facas = () => {
    const R = {};
    const rd = B.ready, ln = B.lunge;
    R.l1 = seq([K(rd, [1, -2], -100, DUAL([-1, 2], 140)), K(ln, [6.5, 1], 30, DUAL([-1.5, 1.5], 150)), K(rd, [4, 3.5], 60, DUAL([-1, 2], 140))], [1, 2], [1, 1], { fps: 20 });
    R.l2 = seq([K(rd, [3, 3], 60, DUAL([-2, -1], -120)), K(ln, [1, 2], 80, DUAL([6.8, 0], 10)), K(rd, [2, 3], 70, DUAL([3, 3], 60))], [1, 2], [1, 1], { fps: 20 });
    R.l3 = seq([K(B.coil, [-0.5, 0], 0, DUAL([2, 2], 40)), K(B.deep, [8.2, -0.3], -2, DUAL([0, 2], 60)), K(rd, [4, 2.5], 30, DUAL([1, 2.5], 50))], [1, 2], [1, 1], { fps: 20 });
    R.l4 = seq([K(add(B.coil, { spine: -10 }), [-2, -5], -150, DUAL([-3, -4], -160)), K(B.deep, [7, 1], 30, DUAL([6, 3], 60)), K(B.deep, [6, 4], 70, DUAL([7, -1], -20)), K(rd, [3, 4], 70, DUAL([1, 3], 60))], [1, 2, 2], [1, 3], { fps: 18, vel: [6, 0] });
    R.air = seq([K(B.air, [0, -4], -110, Object.assign(DUAL([-1, 1], 120), AIR)), K(B.air, [6.5, 1], 30, Object.assign(DUAL([-1, 2], 130), AIR)), K(B.air, [4, 3], 60, Object.assign(DUAL([-1, 2], 130), AIR))], [1, 2], [1, 1], { fps: 20, ground: false });
    R.air2 = seq([K(B.air, [3, 2], 60, Object.assign(DUAL([-2, -2], -120), AIR)), K(B.air, [1, 2], 80, Object.assign(DUAL([6.5, -1], 0), AIR)), K(B.air, [2, 3], 70, Object.assign(DUAL([3, 2], 50), AIR))], [1, 2], [1, 1], { fps: 20, ground: false });
    R.up = seq([K(rd, [4, 3], 40, DUAL([2, 3], 50)), K(add(rd, { spine: -8 }), [4, -6], -80, DUAL([2, -6], -100)), K(rd, [3, -3], -60, DUAL([1, 1], 60))], [1, 2], [1, 1], { fps: 20 });
    R.down = seq([K(B.air, [2, -3], -60, Object.assign(DUAL([0, -2], -80), AIR)), K(add(B.air, { spine: 24 }), [2, 7], 92, Object.assign(DUAL([1, 7], 95), AIR)), K(B.air, [3, 5], 80, Object.assign(DUAL([1, 4], 80), AIR))], [1, 2], [1, 1], { fps: 20, ground: false });
    R.crouch = seq([K(B.crouch, [1, 3], 20, DUAL([0, 3], 30)), K(add(B.crouch, { spine: 6 }), [7, 3.5], 5, DUAL([1, 3], 40)), K(B.crouch, [3, 4], 20, DUAL([0, 3], 30))], [1, 2], [1, 1], { fps: 20 });
    R.riposte = seq([K(B.coil, [0, 0], 0, DUAL([0, 2], 20)), K(B.deep, [8, -0.5], -2, DUAL([0, 2], 30)), K(B.deep, [3, 1], 10, DUAL([8, 0.5], 0)), K(B.deep, [8.2, -0.5], -2, DUAL([2, 2], 20)), K(rd, [3, 3], 50, DUAL([0, 2], 40))], [1, 1, 1, 2], [1, 3], { fps: 18, vel: [10, 0] });
    R.heavy = seq([K(add(B.coil, { spine: -10, chest: -10 }), [-3, -1], -170, Object.assign(DUAL([-3, 1], 170), { ember: 1.5 })), K(add(B.coil, { spine: -12, chest: -14 }), [-3.5, -1.5], -175, Object.assign(DUAL([-3.5, 0.5], 175), { ember: 1.9 })), K(B.deep, [8.5, -0.5], -4, DUAL([8, 1], 2)), K(B.deep, [8.5, 0.5], 4, DUAL([8, -0.5], -4)), K(rd, [3, 3], 50, DUAL([1, 3], 50))], [2, 1, 2, 3], [3, 3], { fps: 18, vel: [16, 0] });
    R.parry = seq([K(rd, [4, -2], -60, DUAL([4, -1.5], -120)), K(add(rd, { spine: -6 }), [5, -3.5], -70, DUAL([5, -3], -110)), K(rd, [3, 0], -30, DUAL([1, 2], 60))], [1, 2], [1, 2], { fps: 18 });
    R.guard = keyAnim([[0, P({ a: B.ready, x: Object.assign({ g: [4.5, -2.5], wa: -64 }, DUAL([4.5, -2], -116)) })], [1, P({ a: add(B.ready, { spine: -1 }), x: Object.assign({ g: [4.5, -2.6], wa: -64 }, DUAL([4.5, -2.1], -116)) })]], { n: 2, fps: 6, loop: true });
    R.plunge = seq([K(add(B.air, { spine: -6 }), [1, -6], -90, Object.assign(DUAL([0, -6], -90), AIR)), K(add(B.air, { spine: 18, thighF: -80, shinF: 110 }), [2, 6], 90, Object.assign(DUAL([1, 6], 90), AIR)), K(add(B.air, { spine: 18, thighF: -80, shinF: 110 }), [2, 6.2], 90, Object.assign(DUAL([1, 6.2], 90), AIR)), K(add(B.deep, { spine: 30 }), [3, 7], 90, DUAL([2, 7], 90)), K(rd, [3, 4], 60, DUAL([1, 3], 60))], [1, 1, 1, 2], [1, 2], { ground: false });
    return R;
  };

  // MALHO — malho de forja a duas mãos: preparação longa, peso no impacto
  MOVES.malho = () => {
    const R = {}, T2 = TWO(3.0), rd = B.ready;
    const ov = add(B.coil, { spine: -14, chest: -16, neck: 6 });
    R.l1 = seq([K(rd, [2, 2], 40, T2), K(ov, [-2.5, -6], -150, T2), K(B.lunge, [3, -5], -60, T2), K(B.deep, [7.5, 1.5], 30, T2), K(B.deep, [6, 5], 80, T2), K(rd, [3, 5], 80, T2)], [2, 1, 2, 2, 3], [3, 4], { fps: 15, vel: [4, 0] });
    R.l2 = seq([K(B.deep, [5, 5.5], 100, T2), K(B.deep, [3, 6.5], 130, T2), K(B.lunge, [6.5, 0], 10, T2), K(add(rd, { spine: -10 }), [3, -7], -95, T2), K(rd, [2, -4], -110, T2), K(rd, [2, 2], 40, T2)], [2, 1, 2, 2, 3], [3, 4], { fps: 15 });
    R.air = seq([K(add(B.air, { spine: -10 }), [-1, -7], -120, Object.assign({}, T2, AIR)), K(add(B.air, { spine: 20 }), [6, 0], 20, Object.assign({}, T2, AIR)), K(add(B.air, { spine: 28 }), [4, 6], 90, Object.assign({}, T2, AIR)), K(B.air, [3, 5], 80, Object.assign({}, T2, AIR))], [1, 2, 2], [1, 4], { fps: 15, ground: false });
    R.up = seq([K(rd, [4, 5], 70, T2), K(B.deep, [3, 6], 100, T2), K(add(rd, { spine: -12 }), [5, -3], -60, T2), K(add(rd, { spine: -14 }), [0, -8], -110, T2), K(rd, [1, -5], -120, T2)], [1, 2, 2, 3], [2, 4], { fps: 15 });
    R.down = seq([K(add(B.air, { spine: -8 }), [0, -6], -100, Object.assign({}, T2, AIR)), K(add(B.air, { spine: 26 }), [3, 7], 85, Object.assign({}, T2, AIR)), K(B.air, [3, 6], 85, Object.assign({}, T2, AIR))], [1, 3, 2], [1, 3], { fps: 15, ground: false });
    R.crouch = seq([K(B.crouch, [-1, 2], 170, T2), K(add(B.crouch, { spine: 8 }), [7, 3], 10, T2), K(B.crouch, [5, 4], 30, T2)], [2, 2, 3], [2, 2], { fps: 15 });
    R.riposte = seq([K(ov, [-2, -6.5], -140, T2), K(B.deep, [6, 0], 30, T2), K(B.deep, [5.5, 5.5], 80, T2), K(rd, [3, 5], 80, T2)], [1, 2, 3], [1, 2], { fps: 15, vel: [6, 0] });
    R.heavy = seq([K(rd, [2, 2], 40, T2), K(add(ov, { thighF: -20, shinF: 30 }), [-2, -7.5], -120, Object.assign({ ember: 1.4 }, T2)), K(add(ov, { thighF: -24, shinF: 34, spine: -18 }), [-3, -7.5], -150, Object.assign({ ember: 2.0, eyeGlow: 1.4 }, T2)), K(B.deep, [5, -3], -40, T2), K(B.deep, [7, 5], 70, T2), K(add(B.deep, { spine: 30 }), [6, 7], 85, T2), K(rd, [3, 6], 80, T2)], [2, 2, 1, 1, 1, 4], [5, 3], { fps: 14 });
    R.parry = seq([K(rd, [3, -3], -10, TWO(4.2)), K(add(rd, { spine: -6 }), [3.5, -4.5], -15, TWO(4.2)), K(rd, [2, 1], 30, T2)], [1, 2], [1, 2], { fps: 16 });
    R.guard = keyAnim([[0, P({ a: B.ready, x: Object.assign({ g: [3.2, -3.4], wa: -12 }, TWO(4.2)) })], [1, P({ a: add(B.ready, { spine: -1 }), x: Object.assign({ g: [3.2, -3.5], wa: -12 }, TWO(4.2)) })]], { n: 2, fps: 6, loop: true });
    R.plunge = seq([K(add(B.air, { spine: -10 }), [0, -7], -100, Object.assign({}, T2, AIR)), K(add(B.air, { spine: 18, thighF: -80, shinF: 110 }), [2, 6], 90, Object.assign({}, T2, AIR)), K(add(B.air, { spine: 18, thighF: -80, shinF: 110 }), [2, 6.2], 90, Object.assign({}, T2, AIR)), K(add(B.deep, { spine: 30 }), [3, 7], 90, T2), K(rd, [3, 5], 70, T2)], [1, 1, 1, 2], [1, 2], { ground: false });
    return R;
  };

  // ALABARDA — haste longa a duas mãos: estocada, varrimento, golpe de cima, roda
  MOVES.haste = () => {
    const R = {}, T2 = TWO(3.6), rd = B.ready;
    R.l1 = seq([K(rd, [1, 1], 5, T2), K(B.coil, [-1.5, 0.5], 0, T2), K(B.deep, [7.5, -0.5], -2, T2), K(B.deep, [7.6, -0.5], -2, T2), K(rd, [2, 1], 10, T2)], [1, 1, 1, 3], [2, 2], { fps: 16, vel: [6, 0] });
    R.l2 = seq([K(rd, [1, 0], -20, T2), K(add(B.coil, { spine: -8 }), [-1, -4], -130, T2), K(B.lunge, [5, -2], -30, T2), K(B.deep, [5, 3], 45, T2), K(rd, [3, 3], 40, T2)], [1, 2, 2, 3], [3, 2], { fps: 16 });
    R.l3 = seq([K(rd, [1, 0], -20, T2), K(add(B.coil, { spine: -14 }), [0, -7], -100, T2), K(add(B.coil, { spine: -16 }), [-1, -7.5], -125, T2), K(B.deep, [6, 0], 10, T2), K(B.deep, [5, 4], 45, T2), K(rd, [3, 3], 30, T2)], [1, 1, 1, 2, 4], [3, 3], { fps: 15, vel: [6, 0] });
    R.air = seq([K(B.air, [0, -1], -20, Object.assign({}, T2, AIR)), K(add(B.air, { spine: 20 }), [6, 3], 35, Object.assign({}, T2, AIR)), K(B.air, [4, 3], 35, Object.assign({}, T2, AIR))], [1, 2, 2], [2, 2], { fps: 16, ground: false });
    R.up = seq([K(rd, [2, 1], 10, T2), K(add(rd, { spine: -6 }), [2.5, -1], -60, T2), K(add(rd, { spine: -10 }), [2.5, -6], -88, T2), K(rd, [2, -3], -80, T2)], [1, 2, 3], [2, 2], { fps: 16 });
    R.down = seq([K(B.air, [2, -2], -40, Object.assign({}, T2, AIR)), K(add(B.air, { spine: 22 }), [2.5, 6], 88, Object.assign({}, T2, AIR)), K(B.air, [2.5, 5], 85, Object.assign({}, T2, AIR))], [1, 2, 2], [1, 3], { fps: 16, ground: false });
    R.crouch = seq([K(B.crouch, [0, 3], 5, T2), K(add(B.crouch, { spine: 6 }), [7, 3.5], 3, T2), K(B.crouch, [3, 3.5], 8, T2)], [1, 2, 3], [1, 2], { fps: 16 });
    R.riposte = seq([K(B.coil, [-2, 0], 0, T2), K(B.deep, [8.5, -0.5], -2, T2), K(B.deep, [8.6, -0.4], -2, T2), K(rd, [2, 1], 10, T2)], [1, 2, 3], [1, 3], { fps: 16, vel: [12, 0] });
    // roda: a lâmina dá a volta ao corpo (atinge os dois lados)
    R.heavy = seq([K(rd, [1, 0], -20, T2), K(add(B.coil, { spine: -10 }), [-2, -2], -170, Object.assign({ ember: 1.5 }, T2)), K(add(B.coil, { spine: -12 }), [-2.5, -2], -175, Object.assign({ ember: 2 }, T2)), K(B.lunge, [3, -5], -90, T2), K(B.lunge, [6, 0], 0, T2), K(B.lunge, [3, 5], 90, T2), K(add(B.lunge, { spine: 4 }), [-2, 2], 180, T2), K(add(B.lunge, { spine: 0 }), [-1, -4], 250, T2), K(rd, [2, 0], 340, T2)], [1, 2, 1, 1, 1, 1, 1, 3], [4, 5], { fps: 14 });
    R.parry = seq([K(rd, [3, -2], -70, TWO(4)), K(add(rd, { spine: -6 }), [3.5, -3.5], -80, TWO(4)), K(rd, [2, 0], -30, T2)], [1, 2], [1, 2], { fps: 16 });
    R.guard = keyAnim([[0, P({ a: B.ready, x: Object.assign({ g: [3.4, -2.6], wa: -78 }, TWO(4)) })], [1, P({ a: add(B.ready, { spine: -1 }), x: Object.assign({ g: [3.4, -2.7], wa: -78 }, TWO(4)) })]], { n: 2, fps: 6, loop: true });
    R.plunge = seq([K(add(B.air, { spine: -6 }), [1, -6], -90, Object.assign({}, T2, AIR)), K(add(B.air, { spine: 18, thighF: -80, shinF: 110 }), [2, 6], 90, Object.assign({}, T2, AIR)), K(add(B.air, { spine: 18, thighF: -80, shinF: 110 }), [2, 6.2], 90, Object.assign({}, T2, AIR)), K(add(B.deep, { spine: 30 }), [3, 7], 90, T2), K(rd, [2, 2], 20, T2)], [1, 1, 1, 2], [1, 2], { ground: false });
    return R;
  };

  // LÂMINA DO ESPÍRITO — gestos amplos, a mão livre em bênção; o corpo flutua levemente
  MOVES.espirito = () => {
    const R = {}, rd = B.ready;
    const BL = (x) => Object.assign({ gB: [-1.5, -5.5], waB: -100, ember: 1.3 }, x || {});
    R.l1 = seq([K(add(B.deep, { spine: 10 }), [3, 6], 120, BL()), K(add(B.deep, { spine: 14 }), [1, 7], 140, BL()), K(B.lunge, [7, 1], 20, BL()), K(add(B.lunge, { spine: -4 }), [5, -5], -70, BL()), K(rd, [3, -4], -90, BL()), K(rd, [3, 2], 40, BL({ ember: 1 }))], [1, 1, 2, 2, 2], [2, 4], { fps: 16 });
    R.l2 = seq([K(rd, [3, -4], -90, BL()), K(add(B.coil, { spine: -8 }), [-2, -4], -170, BL()), K(B.lunge, [6, -1], -10, BL()), K(B.deep, [5, 4], 60, BL()), K(rd, [3, 4], 60, BL())], [1, 2, 2, 3], [2, 4], { fps: 16 });
    R.l3 = seq([K(B.coil, [0, -1], -10, BL({ ember: 1.8, eyeGlow: 1.2 })), K(B.coil, [-1, -1], -5, BL({ ember: 2, eyeGlow: 1.4 })), K(B.deep, [8.6, -1], -4, BL({ ember: 1.4 })), K(B.deep, [8.8, -1], -4, BL()), K(rd, [3, 3], 50, BL())], [1, 1, 1, 3], [2, 2], { fps: 16, vel: [6, 0] });
    R.air = seq([K(B.air, [2, 6], 120, Object.assign(BL(), AIR)), K(B.air, [7, 1], 20, Object.assign(BL(), AIR)), K(B.air, [5, -5], -70, Object.assign(BL(), AIR)), K(B.air, [3, -2], -60, Object.assign(BL(), AIR))], [1, 2, 2], [1, 3], { fps: 16, ground: false });
    R.air2 = seq([K(B.air, [5, -5], -70, Object.assign(BL(), AIR)), K(B.air, [7, 0], 10, Object.assign(BL(), AIR)), K(B.air, [4, 5], 70, Object.assign(BL(), AIR)), K(B.air, [3, 4], 70, Object.assign(BL(), AIR))], [1, 2, 2], [1, 3], { fps: 16, ground: false });
    R.up = seq([K(rd, [5, 2], 30, BL()), K(add(rd, { spine: -8 }), [5, -3], -45, BL()), K(add(rd, { spine: -12 }), [1, -8], -95, BL()), K(rd, [-1, -6], -140, BL())], [1, 2, 3], [1, 3], { fps: 16 });
    R.down = seq([K(B.air, [3, -3], -40, Object.assign(BL(), AIR)), K(add(B.air, { spine: 24 }), [5, 3], 50, Object.assign(BL(), AIR)), K(add(B.air, { spine: 26 }), [1, 8], 105, Object.assign(BL(), AIR)), K(B.air, [2, 6], 95, Object.assign(BL(), AIR))], [1, 2, 2], [1, 3], { fps: 16, ground: false });
    R.crouch = seq([K(B.crouch, [1, 3], 10, BL({ gB: [0, -2] })), K(add(B.crouch, { spine: 6 }), [8, 3], 2, BL({ gB: [0, -2] })), K(B.crouch, [4, 4], 15, BL({ gB: [0, -2] }))], [1, 2, 2], [1, 2], { fps: 16 });
    R.riposte = seq([K(B.coil, [0, 0], 0, BL()), K(B.deep, [8.8, -0.8], -4, BL({ ember: 1.8 })), K(B.deep, [9, -0.6], -4, BL()), K(rd, [3, 4], 50, BL())], [1, 2, 3], [1, 3], { fps: 16, vel: [10, 0] });
    R.heavy = seq([K(rd, [3, 2], 40, BL()), K(add(B.coil, { spine: -12 }), [-1, -7], -120, BL({ ember: 1.8, eyeGlow: 1.2 })), K(add(B.coil, { spine: -14 }), [-2, -7.5], -140, BL({ ember: 2.2, eyeGlow: 1.6 })), K(B.deep, [6, -2], -30, BL()), K(B.deep, [7, 3], 40, BL()), K(B.deep, [5, 6], 80, BL()), K(rd, [3, 4], 60, BL())], [1, 1, 1, 1, 1, 3], [3, 3], { fps: 15, vel: [6, 0] });
    R.parry = seq([K(rd, [4.6, -2.6], -64, BL()), K(add(rd, { spine: -6 }), [5.4, -4.2], -84, BL({ ember: 1.8 })), K(rd, [4, -1], -60, BL())], [1, 2], [1, 2], { fps: 18 });
    R.guard = keyAnim([[0, P({ a: B.ready, x: Object.assign({ g: [4.4, -3], wa: -80 }, BL()) })], [1, P({ a: add(B.ready, { spine: -1 }), x: Object.assign({ g: [4.4, -3.1], wa: -80 }, BL()) })]], { n: 2, fps: 6, loop: true });
    R.plunge = seq([K(add(B.air, { spine: -6 }), [1, -7], -92, Object.assign(BL(), AIR)), K(add(B.air, { spine: 18, thighF: -80, shinF: 110 }), [2.4, 5.6], 90, Object.assign(BL(), AIR)), K(add(B.air, { spine: 18, thighF: -80, shinF: 110 }), [2.4, 5.8], 90, Object.assign(BL(), AIR)), K(add(B.deep, { spine: 30 }), [3, 7], 90, BL()), K(rd, [3, 4], 60, BL())], [1, 1, 1, 2], [1, 2], { ground: false });
    return R;
  };

  // MONTANTE — espadão real a duas mãos: arcos enormes por cima do ombro
  MOVES.montante = () => {
    const R = {}, T2 = TWO(3.2), rd = B.ready;
    const sh = add(B.coil, { spine: -12, chest: -14, neck: 6 });
    R.l1 = seq([K(rd, [3, 3], 50, T2), K(sh, [-2, -6], -140, T2), K(sh, [-3, -5.5], -165, T2), K(B.lunge, [3, -5], -70, T2), K(B.deep, [7.5, 0.5], 10, T2), K(B.deep, [6, 5], 70, T2), K(rd, [3, 5], 75, T2)], [1, 1, 1, 1, 1, 4], [3, 3], { fps: 15, vel: [5, 0] });
    R.l2 = seq([K(B.deep, [5, 5], 80, T2), K(B.deep, [3, 6.5], 120, T2), K(B.lunge, [7, 1], 15, T2), K(add(rd, { spine: -10 }), [4, -6], -85, T2), K(rd, [2, -5], -110, T2), K(rd, [3, 2], 40, T2)], [1, 1, 1, 1, 4], [2, 3], { fps: 15 });
    R.l3 = seq([K(rd, [3, 2], 40, T2), K(add(sh, { spine: -16 }), [0, -8], -100, T2), K(add(sh, { spine: -18 }), [-1.5, -8], -130, Object.assign({ ember: 1.4 }, T2)), K(B.deep, [5, -3], -40, T2), K(B.deep, [7, 4], 60, T2), K(add(B.deep, { spine: 30 }), [6, 7], 85, T2), K(rd, [3, 6], 80, T2)], [1, 1, 1, 1, 1, 5], [3, 3], { fps: 14, vel: [8, 0] });
    R.air = seq([K(add(B.air, { spine: -10 }), [-1, -7], -120, Object.assign({}, T2, AIR)), K(B.air, [6, 0], 15, Object.assign({}, T2, AIR)), K(add(B.air, { spine: 24 }), [4, 6], 85, Object.assign({}, T2, AIR)), K(B.air, [3, 5], 80, Object.assign({}, T2, AIR))], [1, 2, 3], [1, 3], { fps: 15, ground: false });
    R.up = seq([K(rd, [4, 5], 70, T2), K(B.deep, [5, 3], 40, T2), K(add(rd, { spine: -12 }), [4, -5], -70, T2), K(add(rd, { spine: -14 }), [0, -8], -110, T2), K(rd, [1, -5], -120, T2)], [1, 1, 2, 3], [2, 3], { fps: 15 });
    R.down = seq([K(add(B.air, { spine: -8 }), [0, -6], -100, Object.assign({}, T2, AIR)), K(add(B.air, { spine: 26 }), [3, 7], 88, Object.assign({}, T2, AIR)), K(B.air, [3, 6], 85, Object.assign({}, T2, AIR))], [1, 3, 2], [1, 3], { fps: 15, ground: false });
    R.crouch = seq([K(B.crouch, [-1, 2], 170, T2), K(add(B.crouch, { spine: 8 }), [7.5, 3], 5, T2), K(B.crouch, [5, 4], 25, T2)], [2, 2, 3], [2, 2], { fps: 15 });
    R.riposte = seq([K(B.coil, [-1, 0], 0, T2), K(B.deep, [8, -0.5], -3, T2), K(B.deep, [8.2, -0.4], -3, T2), K(rd, [3, 4], 50, T2)], [1, 2, 3], [1, 3], { fps: 15, vel: [10, 0] });
    R.heavy = seq([K(rd, [3, 2], 40, T2), K(add(sh, { spine: -14 }), [-3, -3], -170, Object.assign({ ember: 1.6 }, T2)), K(add(sh, { spine: -16 }), [-3.5, -2.5], -178, Object.assign({ ember: 2.2, eyeGlow: 1.5 }, T2)), K(B.lunge, [3, -5], -90, T2), K(B.lunge, [7, 0], 0, T2), K(B.lunge, [3, 5], 90, T2), K(add(B.lunge, { spine: 6 }), [-2, 2], 180, T2), K(rd, [2, -3], 260, T2), K(rd, [3, 3], 410, T2)], [1, 2, 1, 1, 1, 1, 1, 3], [4, 4], { fps: 14 });
    R.parry = seq([K(rd, [3.5, -3], -80, TWO(3.6)), K(add(rd, { spine: -6 }), [4, -4.5], -88, TWO(3.6)), K(rd, [3, 1], -40, T2)], [1, 2], [1, 2], { fps: 16 });
    R.guard = keyAnim([[0, P({ a: B.ready, x: Object.assign({ g: [3.6, -2.8], wa: -82 }, TWO(3.6)) })], [1, P({ a: add(B.ready, { spine: -1 }), x: Object.assign({ g: [3.6, -2.9], wa: -82 }, TWO(3.6)) })]], { n: 2, fps: 6, loop: true });
    R.plunge = seq([K(add(B.air, { spine: -10 }), [0, -7], -100, Object.assign({}, T2, AIR)), K(add(B.air, { spine: 18, thighF: -80, shinF: 110 }), [2, 6], 90, Object.assign({}, T2, AIR)), K(add(B.air, { spine: 18, thighF: -80, shinF: 110 }), [2, 6.2], 90, Object.assign({}, T2, AIR)), K(add(B.deep, { spine: 30 }), [3, 7], 90, T2), K(rd, [3, 5], 70, T2)], [1, 1, 1, 2], [1, 2], { ground: false });
    return R;
  };

  // ---------------------------------------------------------------- registo
  for (const look of ['capuz', 'sino']) {
    const suf = look === 'sino' ? '_sino' : '';
    A.register('hero' + suf, () => { LOOK = look; return A.buildSheet({ name: 'hero' + suf, scale: S, box: [60, 46], anchor: [30, 42], anims: baseAnims(), post }); });
    for (const cls of Object.keys(MOVES)) A.register('hero_' + cls + suf, () => { LOOK = look; return A.buildSheet({ name: 'hero_' + cls + suf, scale: S, box: [70, 52], anchor: [35, 46], anims: MOVES[cls](), post }); });
  }

  // pré-visualização: todas as animações em grelha, à escala do jogo (×3), com a arma de referência a vermelho
  A.preview = function (name) {
    const r = A.registry[name]();
    const meta = r.meta, img = r.canvas;
    const scale = 3 / meta.scale, cellW = 60 * 3, cellH = 50 * 3;
    const names = Object.keys(meta.anims);
    const cols = Math.max(...names.map((n) => meta.anims[n].frames.length));
    const cv = A.mk(cols * cellW + 120, names.length * cellH), c = cv.getContext('2d');
    c.fillStyle = '#3a3242'; c.fillRect(0, 0, cv.width, cv.height);
    c.font = '14px monospace'; c.fillStyle = '#ddd';
    names.forEach((n, row) => {
      c.fillStyle = '#ddd'; c.fillText(n, 6, row * cellH + 20);
      const ph = meta.anims[n].phases;
      meta.anims[n].frames.forEach((fi, col) => {
        const f = meta.frames[fi], x0 = 120 + col * cellW + cellW / 2, y0 = row * cellH + cellH - 16;
        if (ph) { c.fillStyle = col < ph.wind[1] ? '#3a3a52' : col < ph.act[1] ? '#523a3a' : '#3a4a3a'; c.fillRect(120 + col * cellW, row * cellH, cellW - 2, cellH - 2); }
        c.strokeStyle = '#5a5060'; c.beginPath(); c.moveTo(120 + col * cellW, y0); c.lineTo(120 + (col + 1) * cellW, y0); c.stroke();
        c.imageSmoothingQuality = 'high';
        c.drawImage(img, f.x, f.y, f.w, f.h, x0 + f.ox * 3, y0 + f.oy * 3, f.w * scale, f.h * scale);
        const wid = { espada: 'desperto', facas: 'navalhas', malho: 'malho', haste: 'alabarda', espirito: 'espirito', montante: 'montante' }[(name.split('_')[1] || 'espada')] || 'desperto';
        const wi = A.weaponImage && A.weaponImage(wid);
        const dw = (g) => { if (!wi) return; const [gx, gy, ga] = g; c.save(); c.translate(x0 + gx * 3, y0 + gy * 3); c.rotate(ga * D2R); c.scale(3 / 4, 3 / 4); c.drawImage(wi.cv, -wi.ox, -wi.oy); c.restore(); };
        if (f.pts && f.pts.gripB && wid === 'navalhas') dw(f.pts.gripB);
        if (f.pts && f.pts.grip) dw(f.pts.grip);
      });
    });
    return cv.toDataURL('image/png');
  };
})(window.ART);
