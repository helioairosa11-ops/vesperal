// Vesperal — A Velha Matilheira (subchefe do Bastião), redesenhada como monstro: loba-mãe enorme de pelo quase
// negro, ombros altos e cintura chupada, costelas à mostra e vértebras de osso a romper o lombo, juba de espinhos,
// focinho comprido com o crânio exposto, presas compridas e um olho em brasa. Coleira de espigões com a corrente
// partida. Fraqueza: quando se ergue sobre as patas de trás para uivar, mostra a barriga.
// Exportado a ×1.75 (≈2× a protagonista ao garrote). → assets/sprites/en_b_matilheira.png
'use strict';
(function (A) {
  const S = 5, K = A.kit(S), D2R = A.D2R;
  const M = {
    fur: A.mat('#2a2528', { shadow: '#141114', light: '#5c5660', deep: '#08060a' }),
    furB: A.mat('#1e1a1e', { shadow: '#0e0c0e', light: '#3e3a42', deep: '#050405' }),
    mane: A.mat('#333038', { shadow: '#18161c', light: '#6e6a78', deep: '#08070a' }),
    muzzle: A.mat('#1e1a1c', { shadow: '#0c0a0b', light: '#3e3438' }),
    belly: A.mat('#4a4048', { shadow: '#2a2228', light: '#6e6270' }),
    iron: A.mat('#4a4650', { shadow: '#24222a', light: '#8e8898', deep: '#101014' }),
    leather: A.mat('#3a2620', { shadow: '#1e130f', light: '#5e3e30' }),
    bone: A.mat('#d8ccb0', { shadow: '#8a7e66', light: '#f4ead4', deep: '#3a3226' }),
    gum: A.mat('#5a1a20', { shadow: '#2e0a0e', light: '#8a3038' }),
  };
  const rig = new A.Rig([
    { n: 'hips', len: 4.0, a: 0 },
    { n: 'spine', p: 'hips', len: 11.0, a: -4 },
    { n: 'chest', p: 'spine', len: 10.0, a: 2 },
    { n: 'neck', p: 'chest', len: 7.0, a: -30 },
    { n: 'head', p: 'neck', len: 8.8, a: 40 },
    { n: 'jaw', p: 'head', at: 0.18, len: 7.2, a: 8, off: [0, 1.8] },
    { n: 'tail', p: 'hips', at: 0, len: 10.0, a: 160 },
    { n: 'fB1', p: 'chest', at: 0.72, len: 9.6, a: 100, off: [0, -0.4] }, { n: 'fB2', p: 'fB1', len: 9.0, a: 0 }, { n: 'fB3', p: 'fB2', len: 3.8, a: 0 },
    { n: 'fF1', p: 'chest', at: 0.72, len: 9.6, a: 100, off: [0, 0.6] }, { n: 'fF2', p: 'fF1', len: 9.0, a: 0 }, { n: 'fF3', p: 'fF2', len: 3.8, a: 0 },
    { n: 'hB1', p: 'hips', at: 0.2, len: 10.0, a: 70, off: [0, -0.4] }, { n: 'hB2', p: 'hB1', len: 9.0, a: 0 }, { n: 'hB3', p: 'hB2', len: 6.4, a: 0 }, { n: 'hB4', p: 'hB3', len: 3.8, a: 0 },
    { n: 'hF1', p: 'hips', at: 0.2, len: 10.0, a: 70, off: [0, 0.6] }, { n: 'hF2', p: 'hF1', len: 9.0, a: 0 }, { n: 'hF3', p: 'hF2', len: 6.4, a: 0 }, { n: 'hF4', p: 'hF3', len: 3.8, a: 0 },
  ]);
  const nrm = (a) => { while (a > 180) a -= 360; while (a < -180) a += 360; return a; };
  // patas por IK: x.pF/x.pB (dianteiras) e x.qF/x.qB (traseiras) relativas à raiz
  function solve(pose) {
    const x = pose.extra, r = pose.root;
    for (const sd of ['F', 'B']) {
      const p = x['p' + sd];
      if (p) A.ik(rig, pose, 'f' + sd + '1', 'f' + sd + '2', [r[0] + p[0], p[1] - 3.4], 1, 'f' + sd + '3', p[1] < -0.6 ? 60 : 4);
      const q = x['q' + sd];
      if (q) {
        const hock = [r[0] + q[0] - 2.4, q[1] - 6.0];
        A.ik(rig, pose, 'h' + sd + '1', 'h' + sd + '2', hock, -1);
        const W = rig.solve(pose), K2 = W['h' + sd + '2'];
        const ang = Math.atan2(q[1] - 1.2 - hock[1], r[0] + q[0] - hock[0]) / D2R;
        pose.angles['h' + sd + '3'] = nrm(ang - K2.a);
        pose.angles['h' + sd + '4'] = nrm((q[1] < -0.6 ? 50 : 0) - ang);
      }
    }
    if (x.tailA !== undefined) pose.angles.tail = x.tailA;
  }
  function paw(ctx, B, m) {
    ctx.save(); A.boneT(ctx, B, S);
    K.blob(ctx, [[-0.6, -0.9], [2.6, -0.9], [3.8, 0.2], [3.0, 1.0], [-0.6, 0.8]], m, { depth: S * 0.3 });
    for (let i = 0; i < 3; i++) { const y = -0.6 + i * 0.7; K.poly(ctx, [[3.0, y - 0.25], [5.0, y + 0.35], [3.0, y + 0.35]], M.bone, { depth: S * 0.05, inkW: K.IW * 0.6 }); } // garras
    ctx.restore();
  }
  // patas magras e nervudas: tendão à vista, articulações salientes
  function frontLeg(ctx, W, sd, back) {
    const a = W['f' + sd + '1'], b = W['f' + sd + '2'], m = back ? M.furB : M.fur;
    const lg = K.limb(ctx, [a.x, a.y], [b.x, b.y], [b.ex, b.ey], 3.2, 1.5, 1.1, m, { depth: S * 0.55 });
    ctx.save(); ctx.clip(lg); K.line(ctx, [[b.x + 0.4, b.y], [b.ex + 0.3, b.ey - 0.6]], 0.2, A.rgba(m.light, 0.5)); ctx.restore();
    K.dot(ctx, b.x, b.y, 1.3, m.base); // cotovelo
    for (let i = 0; i < 3; i++) K.poly(ctx, [[b.x - 0.8, b.y - 0.4 + i * 0.6], [b.x - 3.0 - i * 0.4, b.y + 0.6 + i * 0.9], [b.x - 0.4, b.y + 0.8 + i * 0.6]], m, { depth: S * 0.1, inkW: K.IW * 0.6 }); // tufos
    paw(ctx, W['f' + sd + '3'], m);
  }
  function hindLeg(ctx, W, sd, back) {
    const a = W['h' + sd + '1'], b = W['h' + sd + '2'], c = W['h' + sd + '3'], m = back ? M.furB : M.fur;
    const leg = K.tube(ctx, [[a.x - 0.6, a.y - 0.8], [b.x, b.y], [c.x, c.y], [c.ex, c.ey]], [4.4, 1.9, 1.1, 0.9], m, { depth: S * 0.55, hlw: S * 0.25 });
    ctx.save(); ctx.clip(leg); K.line(ctx, [[b.x, b.y], [c.x - 0.3, c.y]], 0.24, A.rgba(m.light, 0.45)); ctx.restore();
    K.dot(ctx, c.x, c.y, 0.9, m.base); // jarrete
    paw(ctx, W['h' + sd + '4'], m);
  }
  // corpo de hiena-lobo: ombros altos e peito fundo, cintura chupada, ancas magras; costelas à mostra,
  // vértebras de osso a romper o pelo ao longo do lombo
  function body(ctx, W, x) {
    const h = W.hips, sp = W.spine, c = W.chest;
    const pts = [[h.x - 1.4, h.y + 0.2], [h.x + 1.8, h.y], [sp.x + 5.6, sp.y + 0.6], [c.x, c.y + 0.6], [c.x + 5.0, c.y + 0.2], [c.ex, c.ey - 0.4], [W.neck.x + 3.2, W.neck.y - 2.4]];
    const ws = [4.2, 4.0, 3.2, 5.6, 7.8, 7.6, 4.8];
    const path = K.tubePath(pts.map((p, i) => [p[0], p[1] + (i >= 3 && i <= 5 ? 2.2 : i === 2 ? 1.2 : 0)]), ws);
    K.paint(ctx, path, M.fur, { depth: S * 1.0, hlw: S * 0.4, light: [0.3, -1] });
    ctx.save(); ctx.clip(path);
    const up = [Math.sin(sp.a * D2R), -Math.cos(sp.a * D2R)], mid = [(h.x + c.ex) / 2, (h.y + c.ey) / 2];
    const dg = ctx.createLinearGradient((mid[0] + up[0] * 6) * S, (mid[1] + up[1] * 6) * S, (mid[0] - up[0] * 9) * S, (mid[1] - up[1] * 9) * S);
    dg.addColorStop(0, 'rgba(4,3,5,0.6)'); dg.addColorStop(0.5, 'rgba(4,3,5,0)'); dg.addColorStop(0.8, A.rgba(M.belly.base, 0)); dg.addColorStop(1, A.rgba(M.belly.base, 0.7));
    ctx.fillStyle = dg; ctx.fillRect((mid[0] - 40) * S, (mid[1] - 40) * S, 80 * S, 80 * S);
    // costelas
    for (let i = 0; i < 7; i++) { const t = i / 7; const bx = A.lerp(sp.x + 5, c.ex - 2.0, t), by = A.lerp(sp.y + 1, c.ey, t); K.line(ctx, [[bx - 0.4, by - 1.6], [bx + 1.0 - t, by + 2.8], [bx - 0.8, by + 6.0]], 0.42, A.rgba(M.fur.deep, 0.55)); K.line(ctx, [[bx + 0.4, by - 1.2], [bx + 1.6 - t, by + 2.8]], 0.2, A.rgba(M.fur.light, 0.35)); }
    // pelagem
    const rr = A.rng(11);
    for (let i = 0; i < 80; i++) { const t = rr(), px = A.lerp(h.x - 4, c.ex + 2, t) + (rr() - 0.5) * 2, py = A.lerp(h.y, c.ey, t) - 4 + rr() * 10; K.line(ctx, [[px, py], [px - 1.6, py + 1.0]], 0.13, A.rgba(rr() < 0.5 ? M.fur.light : M.fur.deep, 0.35)); }
    // cicatrizes e pele sem pelo
    K.line(ctx, [[sp.x + 2, sp.y - 1.6], [sp.x + 6, sp.y + 1.6]], 0.34, A.rgba('#8a6a6a', 0.6));
    K.line(ctx, [[sp.x + 3.4, sp.y - 2.2], [sp.x + 7.4, sp.y + 0.8]], 0.26, A.rgba('#8a6a6a', 0.5));
    ctx.restore();
    // vértebras de osso ao longo do lombo
    for (let i = 0; i < 7; i++) { const t = i / 7; const bx = A.lerp(h.x + 0.4, sp.ex + 2, t), by = A.lerp(h.y, sp.ey, t) - 4.4 - Math.sin(t * Math.PI) * 0.8, L = 1.2 + Math.sin(t * Math.PI) * 1.4; K.poly(ctx, [[bx - 0.6, by + 0.6], [bx - 0.5 - L * 0.4, by - L], [bx + 0.6, by + 0.4]], M.bone, { depth: S * 0.1, hlw: S * 0.08, inkW: K.IW * 0.7 }); }
    // osso da anca saliente
    K.blob(ctx, [[h.x - 2.6, h.y - 2.8], [h.x + 1.4, h.y - 3.8], [h.x + 2.6, h.y - 1.2], [h.x - 0.6, h.y + 1.0]], M.fur, { depth: S * 0.4, hlw: S * 0.25 });
    x._belly = [c.x + 1.0, c.y + 7.4];
  }
  function tail(ctx, W, x) {
    const T = W.tail, sw = x.tailSw || 0;
    const p0 = [T.x, T.y], p1 = [T.x + Math.cos(T.a * D2R) * 5.0, T.y + Math.sin(T.a * D2R) * 5.0], p2 = [T.ex + sw * 1.2, T.ey + 2.4 + sw * 0.8];
    K.tube(ctx, [p0, p1, p2], [1.6, 1.2, 0.4], M.furB, { depth: S * 0.35 });
    // pelos desgrenhados no fim
    for (let i = 0; i < 4; i++) K.poly(ctx, [[p2[0] + 0.2, p2[1]], [p2[0] - 1.6 + i * 0.8 + sw, p2[1] + 1.6 + i * 0.3], [p2[0] + 0.8, p2[1] - 0.2]], M.furB, { depth: S * 0.05, inkW: K.IW * 0.5 });
  }
  // pelo eriçado: massa com orla de espinhos compridos (juba no cachaço e crista ao longo do lombo)
  function shag(ctx, line, thick, m, lean, seed, bristle) {
    const r = A.rng(seed), n = line.length, top = [], bot = [];
    for (let i = 0; i < n; i++) {
      const a = line[Math.max(0, i - 1)], b = line[Math.min(n - 1, i + 1)], d = K.norm(b[0] - a[0], b[1] - a[1]), up = [d[1], -d[0]];
      const th = thick[i] * (1 + bristle * 0.4) * (0.85 + r() * 0.3);
      top.push([line[i][0] + up[0] * th - d[0] * lean, line[i][1] + up[1] * th - d[1] * lean]);
      if (i < n - 1) { const mid = [(line[i][0] + line[i + 1][0]) / 2, (line[i][1] + line[i + 1][1]) / 2]; const k = 0.3 + r() * 0.2; top.push([mid[0] + up[0] * th * k, mid[1] + up[1] * th * k]); }
      bot.push([line[i][0] - up[0] * 1.6, line[i][1] - up[1] * 1.6]);
    }
    const path = A.path((q) => { q.M(bot[0][0], bot[0][1]); top.forEach((p) => q.L(p[0], p[1])); for (let i = bot.length - 1; i >= 0; i--) q.L(bot[i][0], bot[i][1]); q.Z(); }, S);
    K.paint(ctx, path, m, { depth: S * 0.5, hlw: S * 0.2, light: [0.2, -1] });
    ctx.save(); ctx.clip(path);
    for (let i = 0; i < top.length; i += 2) { const t = top[i], bb = bot[Math.min(bot.length - 1, i >> 1)]; K.line(ctx, [[bb[0], bb[1]], [t[0] * 0.75 + bb[0] * 0.25, t[1] * 0.75 + bb[1] * 0.25]], 0.16, A.rgba(m.light, 0.5)); K.line(ctx, [[bb[0] + 0.8, bb[1]], [t[0] * 0.6 + bb[0] * 0.4 + 0.8, t[1] * 0.6 + bb[1] * 0.4]], 0.14, A.rgba(m.deep, 0.6)); }
    ctx.restore();
  }
  function mane(ctx, W, x) {
    const N = W.neck, C = W.chest, sp = W.spine, h = W.hips, br = x.bristle || 0;
    const back = [], bt = [];
    for (let i = 0; i <= 8; i++) { const t = i / 8; back.push([A.lerp(sp.x + 2, sp.ex, t), A.lerp(sp.y, sp.ey, t) - 4.2 - Math.sin(t * Math.PI) * 0.6]); bt.push(1.0 + t * 1.6); }
    shag(ctx, back, bt, K.dim(M.mane, 0.85), 0.9, 3, br * 0.7);
    const line = [], th = [];
    for (let i = 0; i <= 10; i++) { const t = i / 10; line.push([A.lerp(C.x - 1, N.ex - 0.5, t), A.lerp(C.y - 3.8, N.ey - 2.6, t)]); th.push(3.0 + Math.sin(t * Math.PI) * 4.6); }
    shag(ctx, line, th, M.mane, 2.0, 7, br);
    void h;
  }
  function collar(ctx, W, x) {
    const N = W.neck, [cx, cy] = K.along(N, 0.4), [nx, ny] = K.perp(N), d = [Math.cos(N.a * D2R), Math.sin(N.a * D2R)];
    const at = (u, v) => [cx + nx * u + d[0] * v, cy + ny * u + d[1] * v];
    K.poly(ctx, [at(-4.2, -1.2), at(4.2, -1.2), at(4.2, 1.2), at(-4.2, 1.2)], M.iron, { depth: S * 0.3 });
    for (const sg of [-1, 1]) K.poly(ctx, [at(sg * 3.6, -0.9), at(sg * 6.6, 0), at(sg * 3.6, 0.9)], M.iron, { depth: S * 0.15, inkW: K.IW * 0.7 });
    for (let i = -2; i <= 2; i++) { const p = at(i * 1.5, 0); K.poly(ctx, [[p[0] - d[0] * 0.7, p[1] - d[1] * 0.7], [p[0] + nx * 1.1, p[1] + ny * 1.1], [p[0] + d[0] * 0.7, p[1] + d[1] * 0.7], [p[0] - nx * 0.6, p[1] - ny * 0.6]], M.iron, { depth: S * 0.12, inkW: K.IW * 0.6 }); }
    const sw = (x.chainSw || 0) * D2R, r0 = at(3.8, 0);
    for (let i = 1; i <= 6; i++) { const lx = r0[0] + Math.sin(sw) * i * 1.8 - i * 0.3, ly = r0[1] + Math.cos(sw) * i * 1.8; ctx.strokeStyle = M.iron.light; ctx.lineWidth = S * 0.32; ctx.beginPath(); ctx.ellipse(lx * S, ly * S, (i % 2 ? 0.6 : 1.0) * S, 1.0 * S, sw, 0, A.TAU); ctx.stroke(); ctx.strokeStyle = M.iron.deep; ctx.lineWidth = S * 0.12; ctx.stroke(); }
  }
  // cabeça: focinho comprido de loba, com o osso do crânio à mostra no focinho e à volta do olho em brasa;
  // gengivas arreganhadas e presas compridas; orelhas rasgadas para trás
  function head(ctx, W, x) {
    const Hd = W.head, J = W.jaw;
    // mandíbula com presas
    ctx.save(); A.boneT(ctx, J, S); ctx.scale(1.18, 1.18);
    K.blob(ctx, [[-0.6, -0.9], [3.4, -0.9], [7.4, -0.5], [7.6, 0.6], [3.6, 1.6], [-0.4, 1.3]], M.muzzle, { depth: S * 0.35 });
    K.blob(ctx, [[0.6, -1.0], [7.2, -0.7], [7.0, -0.1], [0.8, -0.3]], M.gum, { depth: S * 0.05, inkW: 0 });
    for (let i = 0; i < 5; i++) { const tx = 2.4 + i * 1.1, L = i === 4 ? 2.6 : i === 1 ? 1.8 : 1.2; const t = A.path((q) => { q.M(tx - 0.32, -0.8); q.L(tx + 0.1, -0.8 - L); q.L(tx + 0.32, -0.8); q.Z(); }, S); ctx.fillStyle = M.bone.base; ctx.fill(t); ctx.lineWidth = S * 0.1; ctx.strokeStyle = M.bone.deep; ctx.stroke(t); }
    ctx.restore();
    ctx.save(); A.boneT(ctx, Hd, S); ctx.scale(1.18, 1.18);
    for (const [ox, oy] of [[0, 0], [1.2, 0.4]]) { const ear = K.blobPath([[-1.2 + ox, -2.6 + oy], [-4.6 + ox, -5.0 + oy], [-5.2 + ox, -4.0 + oy], [-3.8 + ox, -3.6 + oy], [-4.4 + ox, -2.8 + oy], [0.6 + ox, -1.8 + oy]]); K.paint(ctx, ear, ox ? M.fur : M.furB, { depth: S * 0.3 }); }
    const sk = K.blob(ctx, [[-2.2, -0.6], [-1.4, -3.2], [1.6, -3.8], [5.0, -2.8], [10.0, -1.4], [10.6, -0.2], [10.2, 1.0], [6.4, 2.0], [3.0, 3.0], [0.0, 3.4], [-2.0, 1.8]], M.fur, { depth: S * 0.7, hlw: S * 0.4, light: [0.3, -1] });
    ctx.save(); ctx.clip(sk);
    // osso à mostra no focinho
    const bn = K.blobPath([[3.2, -3.2], [6.0, -2.6], [10.4, -1.4], [10.6, -0.4], [7.0, -0.6], [4.4, -1.0], [2.4, -1.6]]);
    K.paint(ctx, bn, M.bone, { depth: S * 0.2, hlw: S * 0.15, inkW: K.IW * 0.6 });
    ctx.save(); ctx.clip(bn); for (let i = 0; i < 4; i++) K.line(ctx, [[4.4 + i * 1.4, -2.8 + i * 0.3], [4.8 + i * 1.4, -0.9]], 0.12, A.rgba(M.bone.deep, 0.6)); ctx.restore();
    const mz = K.blobPath([[5.0, -0.4], [10.6, -0.4], [10.2, 1.4], [6.0, 2.6], [4.2, 1.2]]); ctx.fillStyle = M.muzzle.base; ctx.fill(mz);
    ctx.restore();
    // beiço arreganhado com presas de cima
    K.blob(ctx, [[5.0, 1.2], [10.0, 0.6], [10.2, 1.8], [7.0, 2.8], [5.2, 2.6]], M.gum, { depth: S * 0.2 });
    for (let i = 0; i < 4; i++) { const tx = 5.6 + i * 1.2, L = i === 0 ? 2.8 : 1.4; const t = A.path((q) => { q.M(tx - 0.32, 1.6); q.L(tx + 0.1, 1.6 + L); q.L(tx + 0.32, 1.6); q.Z(); }, S); ctx.fillStyle = M.bone.base; ctx.fill(t); ctx.lineWidth = S * 0.1; ctx.strokeStyle = M.bone.deep; ctx.stroke(t); }
    // órbita de osso e olho em brasa
    K.blob(ctx, [[1.0, -2.8], [3.8, -3.0], [4.2, -1.0], [1.4, -0.8]], M.bone, { depth: S * 0.15, inkW: K.IW * 0.6 });
    const eo = K.blobPath([[1.6, -2.4], [3.4, -2.6], [3.6, -1.3], [1.8, -1.2]]); ctx.fillStyle = '#080406'; ctx.fill(eo);
    K.ember(ctx, 2.6, -1.9, 0.6, x.eye === undefined ? 1 : x.eye, '#ff6a30');
    K.dot(ctx, 10.4, -0.8, 0.6, '#0a0608'); // trufa
    ctx.restore();
  }
  function draw(ctx, W, x) {
    frontLeg(ctx, W, 'B', true);
    hindLeg(ctx, W, 'B', true);
    tail(ctx, W, x);
    body(ctx, W, x);
    hindLeg(ctx, W, 'F', false);
    mane(ctx, W, x);
    collar(ctx, W, x);
    head(ctx, W, x);
    frontLeg(ctx, W, 'F', false);
  }
  function overlay(ctx, W, x) {
    const Hd = W.head, ca = Math.cos(Hd.a * D2R), sa = Math.sin(Hd.a * D2R), e = [Hd.x + (ca * 2.6 + sa * 1.9) * 1.18, Hd.y + (sa * 2.6 - ca * 1.9) * 1.18];
    A.glow(ctx, e[0] * S, e[1] * S, 3.2 * S, '#ff6a30', 0.35 * Math.min(1.5, x.eye === undefined ? 1 : x.eye));
  }
  function points(W, x) {
    const J = W.jaw, Hd = W.head, ca = Math.cos(Hd.a * D2R), sa = Math.sin(Hd.a * D2R);
    return { tip: [J.x + (J.ex - J.x) * 1.18, J.y + (J.ey - J.y) * 1.18], eye: [Hd.x + (ca * 2.6 + sa * 1.9) * 1.18, Hd.y + (sa * 2.6 - ca * 1.9) * 1.18], belly: x._belly, mouth: [(J.x + J.ex) / 2, (J.y + J.ey) / 2] };
  }

  // ---------------------------------------------------------------- poses
  const ROOT = [-11.0, -22.4];
  const P = (a, x, root, rootA) => A.pose(a || {}, x, root || ROOT, rootA || 0);
  const STAND = { pF: [23.0, 0], pB: [21.0, 0], qF: [-1.4, 0], qB: [1.2, 0], tailA: 6, tailSw: 0, chainSw: 0, bristle: 0, eye: 1 };
  const st = (o = {}) => Object.assign({}, STAND, o);
  function anims() {
    const R = {};
    R.idle = { n: 6, fps: 6, loop: true, poseFn: (t) => { const s = Math.sin(t * A.TAU * 2); return P({ spine: s * 0.6, chest: -s * 0.8, neck: s, jaw: 12 + s * 6 }, st({ tailA: 6 + Math.sin(t * A.TAU) * 6, tailSw: Math.sin(t * A.TAU), chainSw: Math.sin(t * A.TAU) * 12, eye: 1 + s * 0.1 }), [ROOT[0], ROOT[1] + s * 0.35]); } };
    // galope pesado de cadela velha
    const gal = (u, base, reach, lift) => { if (u < 0.5) return [A.lerp(base + reach, base - reach, u / 0.5), 0]; const k = (u - 0.5) / 0.5; return [A.lerp(base - reach, base + reach, A.ease.io(k)), -Math.sin(k * Math.PI) * lift]; };
    R.move = { n: 8, fps: 11, loop: true, stride: 30,
      poseFn: (t) => { const ph = t * A.TAU, flex = Math.sin(ph);
        return P({ spine: flex * 5, chest: -flex * 4, neck: -flex * 4 - 4, head: flex * 3, jaw: 16 }, st({ pF: gal(t, 23.4, 6.0, 5.0), pB: gal((t + 0.12) % 1, 22.0, 6.0, 5.0), qF: gal((t + 0.5) % 1, -1.0, 5.6, 4.6), qB: gal((t + 0.62) % 1, 1.0, 5.6, 4.6), tailA: -4 + flex * 8, tailSw: -1.2, chainSw: -24 + flex * 18, eye: 1.2 }), [ROOT[0] + flex * 1.2, ROOT[1] - Math.abs(Math.cos(ph)) * 1.8 + 0.8], flex * 3); } };
    // dentada (branco): mergulha a cabeça e fecha as mandíbulas, em série
    const BW = P({ spine: 4, chest: -4, neck: 10, head: -8, jaw: 6 }, st({ pF: [21.4, 0], pB: [20.0, 0], qF: [0.6, 0], qB: [2.2, 0], tailA: -10, chainSw: 10, bristle: 0.5, eye: 1.6 }), [-11.6, -20.6], 3);
    const BO = P({ spine: -2, chest: 2, neck: -10, head: -4, jaw: 44 }, st({ pF: [24.6, 0], pB: [23.0, 0], qF: [-2.6, 0], qB: [-0.6, 0], tailA: 10, chainSw: -30, bristle: 1, eye: 1.8 }), [-9.4, -22.0], -3);
    const BC = P({ spine: 2, chest: 4, neck: 4, head: 6, jaw: 4 }, st({ pF: [24.0, 0], pB: [22.6, 0], qF: [-1.8, 0], qB: [0.2, 0], tailA: 4, chainSw: -10, bristle: 1, eye: 1.6 }), [-9.8, -21.6], 1);
    R.atk_bite = { n: 7, fps: 14, phases: [3, 2], keys: [[0, P({}, st())], [0.3, BW], [0.42, BO], [0.62, BC], [1, P({}, st())]] };
    // investida rasteira (sem sinal): estica-se rente ao chão de boca aberta
    const LW = P({ spine: 6, chest: -6, neck: 14, head: -10, jaw: 8 }, st({ pF: [19.6, 0], pB: [18.4, 0], qF: [2.6, 0], qB: [3.8, 0], tailA: -24, chainSw: 16, bristle: 0.6, eye: 1.6 }), [-11.4, -18.6], 6);
    const LA = P({ spine: -8, chest: 4, neck: -14, head: -6, jaw: 42 }, st({ pF: [30.0, -6.0], pB: [28.6, -5.0], qF: [-8.0, -2.6], qB: [-6.6, -2.0], tailA: 20, tailSw: -2, chainSw: -50, bristle: 1, eye: 2, air: true }), [-9.0, -22.4], -6);
    R.atk_lunge = { n: 8, fps: 12, phases: [3, 3], keys: [[0, P({}, st())], [0.3, LW], [0.45, LA], [0.7, LA], [0.86, BC], [1, P({}, st())]] };
    // salto (vermelho): agacha-se, voa sobre a presa e aterra com as patas da frente
    const CR = P({ spine: 8, chest: -8, neck: 16, head: -12, jaw: 10 }, st({ pF: [19.0, 0], pB: [17.6, 0], qF: [3.2, 0], qB: [4.6, 0], tailA: -30, chainSw: 12, bristle: 1, eye: 2 }), [-11.6, -16.6], 8);
    const AIR = P({ spine: -10, chest: 6, neck: -20, head: -8, jaw: 40 }, st({ pF: [31.0, -11.0], pB: [29.0, -9.6], qF: [-9.4, -5.0], qB: [-7.8, -4.0], tailA: 24, tailSw: -2, chainSw: -50, bristle: 1, eye: 2, air: true }), [-8.4, -25.0], -10);
    const LND = P({ spine: 10, chest: -6, neck: 12, head: 8, jaw: 12 }, st({ pF: [25.2, 0], pB: [24.0, 0], qF: [0.8, 0], qB: [2.4, 0], tailA: -8, chainSw: 30, bristle: 0.6, eye: 1.4 }), [-9.2, -18.6], 6);
    R.atk_leap = { n: 9, fps: 10, phases: [3, 3], keys: [[0, P({}, st())], [0.25, CR], [0.4, AIR], [0.62, AIR], [0.78, LND], [1, P({}, st())]] };
    // UIVO: ergue-se sobre as patas de trás de cabeça ao alto (barriga exposta) e chama a matilha
    const R1 = P({ spine: -10, chest: -10, neck: -30, head: -26, jaw: 18 }, st({ pF: [12.0, -14.0], pB: [10.6, -12.6], qF: [-1.0, 0], qB: [1.6, 0], tailA: 40, chainSw: 30, bristle: 1, eye: 1.4 }), [-12.0, -24.6], -34);
    const R2 = P({ spine: -12, chest: -12, neck: -38, head: -34, jaw: 48 }, st({ pF: [11.0, -17.0], pB: [9.6, -15.0], qF: [-1.0, 0], qB: [1.6, 0], tailA: 46, tailSw: 1, chainSw: 40, bristle: 1.4, eye: 2 }), [-12.4, -25.6], -40);
    R.atk_howl = { n: 10, fps: 8, phases: [6, 2], keys: [[0, P({}, st())], [0.3, R1], [0.5, R2], [0.64, R2], [0.76, P({ spine: -12, chest: -12, neck: -40, head: -36, jaw: 52 }, st({ pF: [11.0, -17.4], pB: [9.6, -15.4], qF: [-1.0, 0], qB: [1.6, 0], tailA: 48, chainSw: 44, bristle: 1.6, eye: 2.2 }), [-12.4, -25.8], -40)], [1, P({}, st())]] };
    R.hurt = { n: 3, fps: 14, keys: [[0, P({ spine: -6, chest: -8, neck: -20, head: -12, jaw: 34 }, st({ pF: [21.0, 0], pB: [19.6, 0], qF: [-3.0, 0], qB: [-1.6, 0], tailA: 24, chainSw: 40, eye: 2 }), [-12.0, -22.6], -4)], [1, P({}, st())]] };
    R.stagger = { n: 4, fps: 7, loop: true, poseFn: (t) => { const s = Math.sin(t * A.TAU); return P({ spine: 8, chest: 4, neck: 28 + s * 6, head: 10, jaw: 22 }, st({ pF: [21.4 + s * 1.2, 0], pB: [18.6, 0], qF: [-2.0, 0], qB: [0.6, 0], tailA: -30, chainSw: s * 30, eye: 0.5 }), [-11.2, -18.0], 4); } };
    R.death = { n: 8, fps: 8, keys: [[0, P({ spine: -6, neck: -24, head: -10, jaw: 40 }, st({ tailA: 30, chainSw: 40, eye: 2 }), [-11.6, -22.8])], [0.4, P({ spine: 10, chest: 6, neck: 26, head: 16, jaw: 30 }, st({ pF: [25.6, 0], pB: [15.0, 0], qF: [2.8, 0], qB: [-2.8, 0], tailA: -20, chainSw: -20, eye: 0.6 }), [-11.2, -13.0], 4)], [1, P({ spine: 6, chest: 4, neck: 40, head: 24, jaw: 34 }, st({ pF: [27.6, 0], pB: [17.4, 0], qF: [6.8, 0], qB: [-5.2, 0], tailA: -40, chainSw: 0, eye: 0 }), [-10.6, -7.0], 2)]] };
    return R;
  }
  A.register('en_b_matilheira', () => A.creature({ name: 'en_b_matilheira', S, unit: 1.75, box: [110, 76], anchor: [44, 66], rig, solve, draw, overlay, points, anims: anims(), post: K.post('#8a86a8', 0.26, 0.045) }));
  (A.previewCell = A.previewCell || {}).en_b_matilheira = [130, 100];
})(window.ART);
