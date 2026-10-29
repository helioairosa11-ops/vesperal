// Vesperal — Cão de Cinza (hound): cão de caça esquelético, pele de cinza colada às costelas, açaime de ferro
// em gaiola e coleira partida com elos a balouçar. Corre a galope, rodeia e salta à presa. → assets/sprites/en_hound.png
'use strict';
(function (A) {
  const S = 4, K = A.kit(S), D2R = A.D2R;
  const M = {
    skin: A.mat('#6d6466', { shadow: '#3a3336', light: '#9f9592', deep: '#1c171a' }),
    skinB: A.mat('#4e4749', { shadow: '#2a2427', light: '#716868', deep: '#141012' }),
    iron: A.mat('#4f4c56', { shadow: '#26242b', light: '#958f9e', deep: '#121116' }),
    leather: A.mat('#3e2b22', { shadow: '#22160f', light: '#6a4a38' }),
    bone: A.mat('#d4c8ae', { shadow: '#8a7e66', light: '#f0e6d0' }),
  };
  const rig = new A.Rig([
    { n: 'hips', len: 2.0, a: 0 },
    { n: 'spine', p: 'hips', len: 5.4, a: -4 },
    { n: 'chest', p: 'spine', len: 4.8, a: 2 },
    { n: 'neck', p: 'chest', len: 3.4, a: -34 },
    { n: 'head', p: 'neck', len: 4.6, a: 42 },
    { n: 'jaw', p: 'head', at: 0.15, len: 3.8, a: 8, off: [0, 0.9] },
    { n: 'tail', p: 'hips', at: 0, len: 5.0, a: 160 },
    { n: 'fB1', p: 'chest', at: 0.7, len: 4.6, a: 100, off: [0, -0.2] }, { n: 'fB2', p: 'fB1', len: 4.4, a: 0 }, { n: 'fB3', p: 'fB2', len: 1.8, a: 0 },
    { n: 'fF1', p: 'chest', at: 0.7, len: 4.6, a: 100, off: [0, 0.3] }, { n: 'fF2', p: 'fF1', len: 4.4, a: 0 }, { n: 'fF3', p: 'fF2', len: 1.8, a: 0 },
    { n: 'hB1', p: 'hips', at: 0.2, len: 4.8, a: 70, off: [0, -0.2] }, { n: 'hB2', p: 'hB1', len: 4.4, a: 0 }, { n: 'hB3', p: 'hB2', len: 3.2, a: 0 }, { n: 'hB4', p: 'hB3', len: 1.8, a: 0 },
    { n: 'hF1', p: 'hips', at: 0.2, len: 4.8, a: 70, off: [0, 0.3] }, { n: 'hF2', p: 'hF1', len: 4.4, a: 0 }, { n: 'hF3', p: 'hF2', len: 3.2, a: 0 }, { n: 'hF4', p: 'hF3', len: 1.8, a: 0 },
  ]);
  const nrm = (a) => { while (a > 180) a -= 360; while (a < -180) a += 360; return a; };
  // patas por IK: x.pF/x.pB (dianteiras) e x.qF/x.qB (traseiras) = posição da pata no chão (relativa à raiz)
  function solve(pose) {
    const x = pose.extra, r = pose.root;
    for (const sd of ['F', 'B']) {
      const p = x['p' + sd];
      if (p) A.ik(rig, pose, 'f' + sd + '1', 'f' + sd + '2', [r[0] + p[0], p[1] - 1.7], 1, 'f' + sd + '3', p[1] < -0.3 ? 60 : 4);
      const q = x['q' + sd];
      if (q) {
        const hock = [r[0] + q[0] - 1.2, q[1] - 3.0];
        A.ik(rig, pose, 'h' + sd + '1', 'h' + sd + '2', hock, -1);
        const W = rig.solve(pose), K2 = W['h' + sd + '2'];
        const ang = Math.atan2(q[1] - 0.6 - hock[1], r[0] + q[0] - hock[0]) / D2R;
        pose.angles['h' + sd + '3'] = nrm(ang - K2.a);
        pose.angles['h' + sd + '4'] = nrm((q[1] < -0.3 ? 50 : 0) - ang);
      }
    }
    if (x.tailA !== undefined) pose.angles.tail = x.tailA;
  }
  function paw(ctx, B, m) {
    ctx.save(); A.boneT(ctx, B, S);
    K.blob(ctx, [[-0.4, -0.55], [1.4, -0.5], [2.1, 0.1], [1.7, 0.6], [-0.4, 0.5]], m, { depth: S * 0.25 });
    for (let i = 0; i < 3; i++) K.line(ctx, [[1.7, -0.35 + i * 0.35], [2.4, -0.25 + i * 0.4]], 0.12, '#141012');
    ctx.restore();
  }
  function frontLeg(ctx, W, sd, back) {
    const a = W['f' + sd + '1'], b = W['f' + sd + '2'], m = back ? M.skinB : M.skin;
    K.limb(ctx, [a.x, a.y], [b.x, b.y], [b.ex, b.ey], 1.25, 0.6, 0.45, m, { depth: S * 0.45 });
    paw(ctx, W['f' + sd + '3'], m);
  }
  function hindLeg(ctx, W, sd, back) {
    const a = W['h' + sd + '1'], b = W['h' + sd + '2'], c = W['h' + sd + '3'], m = back ? M.skinB : M.skin;
    K.limb(ctx, [a.x - 0.4, a.y - 0.4], [b.x, b.y], [b.ex, b.ey], 1.9, 0.75, 0.5, m, { depth: S * 0.5 });
    K.tube(ctx, [[c.x, c.y], [c.ex, c.ey]], [0.45, 0.35], m, { depth: S * 0.25 });
    K.dot(ctx, c.x, c.y, 0.38, back ? M.skinB.light : M.skin.light); // jarrete ossudo
    paw(ctx, W['h' + sd + '4'], m);
  }
  // corpo: peito fundo, cintura estreita (costelas e vértebras à vista), anca ossuda
  function body(ctx, W, x) {
    const h = W.hips, sp = W.spine, c = W.chest;
    const pts = [[h.x - 0.8, h.y + 0.2], [h.x + 0.8, h.y], [sp.x + 2.5, sp.y - 0.1], [c.x, c.y], [c.x + 2.6, c.y + 0.2], [c.ex, c.ey], [W.neck.x + 1.6, W.neck.y - 1.2]];
    const ws = [2.4, 2.3, 1.6, 2.3, 3.0, 2.6, 1.6];
    // bojo do peito para baixo
    const path = K.tubePath(pts.map((p, i) => [p[0], p[1] + (i >= 3 && i <= 5 ? 0.9 : 0)]), ws);
    K.paint(ctx, path, M.skin, { depth: S * 0.8, hlw: S * 0.35, light: [0.3, -1] });
    ctx.save(); ctx.clip(path);
    for (let i = 0; i < 6; i++) { const t = i / 6; const bx = A.lerp(c.x - 2.2, c.ex - 0.6, t), by = A.lerp(c.y, c.ey, t); K.line(ctx, [[bx - 0.3, by - 1.4], [bx + 0.4 - t * 0.6, by + 1.2], [bx - 0.4, by + 3.0]], 0.26, A.rgba(M.skin.deep, 0.65)); K.line(ctx, [[bx - 0.55, by - 1.3], [bx + 0.15 - t * 0.6, by + 1.1]], 0.1, A.rgba(M.skin.light, 0.45)); }
    const g = ctx.createLinearGradient(0, (h.y - 2) * S, 0, (h.y + 4) * S); g.addColorStop(0, 'rgba(20,16,18,0)'); g.addColorStop(1, 'rgba(20,16,18,0.55)'); ctx.fillStyle = g; ctx.fillRect((h.x - 4) * S, (h.y - 3) * S, 24 * S, 8 * S);
    ctx.restore();
    // vértebras
    for (let i = 0; i < 8; i++) { const t = i / 7; const vx = A.lerp(h.x, c.ex, t), vy = A.lerp(h.y, c.ey, t) - (i > 2 && i < 6 ? 1.6 : 2.1) - Math.sin(t * Math.PI) * 0.2; const v = K.blobPath([[vx - 0.35, vy + 0.45], [vx, vy - 0.35], [vx + 0.35, vy + 0.45]]); ctx.fillStyle = M.skin.light; ctx.fill(v); ctx.lineWidth = K.IW * 0.6; ctx.strokeStyle = K.INK; ctx.stroke(v); }
    // osso da anca
    K.blob(ctx, [[h.x - 1.6, h.y - 1.6], [h.x + 0.8, h.y - 2.2], [h.x + 1.6, h.y - 0.6], [h.x - 0.4, h.y + 0.6]], M.skin, { depth: S * 0.3, hlw: S * 0.2 });
  }
  function tail(ctx, W, x) {
    const T = W.tail, sw = x.tailSw || 0;
    const p0 = [T.x, T.y], p1 = [T.x + Math.cos(T.a * D2R) * 2.6, T.y + Math.sin(T.a * D2R) * 2.6], p2 = [T.ex + sw * 0.6, T.ey + 1.2 + sw * 0.4];
    K.tube(ctx, [p0, p1, p2], [0.6, 0.4, 0.16], M.skinB, { depth: S * 0.25 });
  }
  // coleira partida com dois elos a balouçar
  function collar(ctx, W, x) {
    const N = W.neck, [cx, cy] = K.along(N, 0.35), [nx, ny] = K.perp(N);
    K.line(ctx, [[cx - nx * 1.9, cy - ny * 1.9], [cx + nx * 1.9, cy + ny * 1.9]], 0.8, M.leather.shadow);
    K.line(ctx, [[cx - nx * 1.9, cy - ny * 1.9], [cx + nx * 1.9, cy + ny * 1.9]], 0.3, M.leather.light);
    for (const t of [-0.9, 0.9]) K.dot(ctx, cx + nx * t, cy + ny * t, 0.22, M.iron.light);
    const sw = (x.chainSw || 0) * D2R, r0 = [cx + nx * 1.8, cy + ny * 1.8];
    for (let i = 1; i <= 3; i++) { const lx = r0[0] + Math.sin(sw) * i * 0.9, ly = r0[1] + Math.cos(sw) * i * 0.9; ctx.strokeStyle = M.iron.light; ctx.lineWidth = S * 0.16; ctx.beginPath(); ctx.ellipse(lx * S, ly * S, 0.35 * S, 0.5 * S, sw, 0, A.TAU); ctx.stroke(); }
  }
  // cabeça: crânio comprido de galgo, orelhas rasgadas, olho de brasa, presas; açaime de ferro em gaiola
  function head(ctx, W, x) {
    const Hd = W.head, J = W.jaw;
    ctx.save(); A.boneT(ctx, J, S);
    K.blob(ctx, [[-0.3, -0.5], [2.0, -0.45], [3.8, -0.2], [3.8, 0.35], [1.8, 0.75], [-0.2, 0.55]], M.skin, { depth: S * 0.3 });
    for (let i = 0; i < 4; i++) { const tx = 1.4 + i * 0.6; const t = A.path((q) => { q.M(tx - 0.16, -0.42); q.L(tx, i === 3 ? -1.25 : -0.9); q.L(tx + 0.16, -0.42); q.Z(); }, S); ctx.fillStyle = M.bone.base; ctx.fill(t); }
    ctx.restore();
    ctx.save(); A.boneT(ctx, Hd, S);
    const ear = K.blobPath([[-0.6, -1.4], [-1.4, -3.4], [-0.2, -2.8], [0.6, -1.6]]); K.paint(ctx, ear, M.skinB, { depth: S * 0.25 });
    const sk = K.blob(ctx, [[-1.2, -0.4], [-0.6, -1.6], [1.0, -1.9], [2.6, -1.3], [4.6, -0.7], [4.8, 0.0], [4.2, 0.45], [2.0, 0.8], [0.2, 1.4], [-1.0, 0.8]], M.skin, { depth: S * 0.5, hlw: S * 0.3, light: [0.3, -1] });
    for (let i = 0; i < 4; i++) { const tx = 1.8 + i * 0.6; const t = A.path((q) => { q.M(tx - 0.15, 0.6); q.L(tx, i === 0 ? 1.5 : 1.15); q.L(tx + 0.15, 0.55); q.Z(); }, S); ctx.fillStyle = M.bone.base; ctx.fill(t); }
    const eo = K.blobPath([[0.7, -1.2], [1.5, -1.3], [1.6, -0.7], [0.9, -0.6]]); ctx.fillStyle = '#0c080a'; ctx.fill(eo);
    K.ember(ctx, 1.15, -0.95, 0.3, x.eye === undefined ? 1 : x.eye);
    K.dot(ctx, 4.7, -0.3, 0.3, '#151012'); // focinho
    ctx.restore();
    // açaime: aros de ferro à volta do focinho e da mandíbula (abre com ela)
    ctx.save(); A.boneT(ctx, Hd, S);
    for (const t of [2.4, 3.4, 4.3]) { ctx.strokeStyle = M.iron.light; ctx.lineWidth = S * 0.32; ctx.beginPath(); ctx.ellipse(t * S, -0.4 * S, 0.45 * S, 1.2 * S, 0.1, 0, A.TAU); ctx.stroke(); ctx.strokeStyle = M.iron.deep; ctx.lineWidth = S * 0.12; ctx.stroke(); }
    K.line(ctx, [[2.0, -1.5], [4.5, -0.9]], 0.34, M.iron.light); K.line(ctx, [[2.2, 0.75], [4.4, 0.3]], 0.3, M.iron.base);
    K.line(ctx, [[0.6, -1.7], [2.4, -1.45]], 0.24, M.leather.base); // correia atrás da orelha
    ctx.restore();
  }
  function draw(ctx, W, x) {
    frontLeg(ctx, W, 'B', true);
    hindLeg(ctx, W, 'B', true);
    tail(ctx, W, x);
    body(ctx, W, x);
    hindLeg(ctx, W, 'F', false);
    collar(ctx, W, x);
    head(ctx, W, x);
    frontLeg(ctx, W, 'F', false);
  }
  function points(W) {
    const J = W.jaw, Hd = W.head, ca = Math.cos(Hd.a * D2R), sa = Math.sin(Hd.a * D2R);
    return { tip: [J.ex, J.ey], eye: [Hd.x + ca * 1.15 + sa * 0.95, Hd.y + sa * 1.15 - ca * 0.95] };
  }

  // ---------------------------------------------------------------- poses
  const ROOT = [-5.2, -10.6];
  const P = (a, x, root, rootA) => A.pose(a || {}, x, root || ROOT, rootA || 0);
  const STAND = { pF: [11.2, 0], pB: [10.2, 0], qF: [-0.6, 0], qB: [0.6, 0], tailA: 0, tailSw: 0, chainSw: 0 };
  const st = (o = {}) => Object.assign({}, STAND, o);
  function anims() {
    const R = {};
    // parado: arfa de boca entreaberta, a cauda e a corrente balouçam
    R.idle = { n: 6, fps: 8, loop: true, poseFn: (t) => { const s = Math.sin(t * A.TAU * 2); return P({ spine: s * 0.6, chest: -s, neck: s, jaw: 10 + s * 6 }, st({ tailA: Math.sin(t * A.TAU) * 8, tailSw: Math.sin(t * A.TAU), chainSw: Math.sin(t * A.TAU) * 14, eye: 1 + s * 0.1 }), [ROOT[0], ROOT[1] + s * 0.2]); } };
    // galope: as patas da frente e de trás alternam em pares; o corpo dobra e estica
    const gal = (u, base, reach) => { if (u < 0.45) return [A.lerp(base + reach, base - reach, u / 0.45), 0]; const k = (u - 0.45) / 0.55; return [A.lerp(base - reach, base + reach, A.ease.io(k)), -Math.sin(k * Math.PI) * 3.4]; };
    R.move = {
      n: 6, fps: 14, loop: true, stride: 30,
      poseFn: (t) => {
        const ph = t * A.TAU, flex = Math.sin(ph);
        return P({ spine: flex * 7, chest: -flex * 5, neck: -flex * 6 - 4, head: flex * 4, jaw: 14 },
          { pF: gal(t, 11.4, 4.2), pB: gal((t + 0.1) % 1, 10.8, 4.2), qF: gal((t + 0.5) % 1, -0.4, 4.0), qB: gal((t + 0.6) % 1, 0.4, 4.0), tailA: -10 + flex * 10, tailSw: -1.4, chainSw: -30 + flex * 20, eye: 1.2 },
          [ROOT[0] + flex * 0.8, ROOT[1] - Math.abs(Math.cos(ph)) * 1.4 + 0.6], flex * 4);
      },
    };
    // salto à garganta: agacha (antecipação), voa de boca escancarada, aterra e recompõe-se
    const CR = P({ spine: 6, chest: -6, neck: 14, head: -10, jaw: 6 }, st({ pF: [9.6, 0], pB: [8.8, 0], qF: [1.6, 0], qB: [2.4, 0], tailA: -20, chainSw: 10, eye: 1.6 }), [-5.6, -8.4], 6);
    const AIR = P({ spine: -8, chest: 4, neck: -18, head: -6, jaw: 46 }, st({ pF: [15.6, -5.4], pB: [14.6, -4.8], qF: [-4.6, -2.4], qB: [-3.8, -2.0], tailA: 20, tailSw: -2, chainSw: -50, eye: 2, air: true }), [-4.2, -12.6], -8);
    const LND = P({ spine: 8, chest: -4, neck: 8, head: 6, jaw: 8 }, st({ pF: [12.6, 0], pB: [12.0, 0], qF: [0.4, 0], qB: [1.2, 0], tailA: -6, chainSw: 30, eye: 1.3 }), [-4.6, -9.4], 4);
    R.atk_bite = {
      n: 9, fps: 14, phases: [3, 3],
      keys: [[0, P({}, st())], [0.28, CR], [0.4, P({ spine: -4, chest: 0, neck: -8, jaw: 30 }, st({ pF: [13.6, -3], pB: [12.6, -2.4], qF: [-2.0, 0], qB: [-1.2, 0], tailA: 10, chainSw: -30, eye: 1.8, air: true }), [-4.6, -11.6], -4)], [0.55, AIR], [0.68, AIR], [0.82, LND], [1, P({}, st())]],
    };
    R.hurt = { n: 3, fps: 14, keys: [[0, P({ spine: -6, chest: -8, neck: -20, head: -12, jaw: 34 }, st({ pF: [10.2, 0], pB: [9.6, 0], qF: [-1.6, 0], qB: [-0.8, 0], tailA: 24, chainSw: 40, eye: 2 }), [-5.8, -10.8], -4)], [1, P({}, st())]] };
    R.stagger = { n: 4, fps: 8, loop: true, poseFn: (t) => { const s = Math.sin(t * A.TAU); return P({ spine: 10, chest: 4, neck: 30 + s * 6, head: 10, jaw: 20 }, st({ pF: [10.4 + s * 0.6, 0], pB: [9.0, 0], qF: [-1.0, 0], qB: [0.2, 0], tailA: -30, chainSw: s * 30, eye: 0.4 }), [-5.4, -8.6], 4); } };
    // morte: as patas cedem e tomba de lado; a brasa do olho apaga-se
    R.death = { n: 7, fps: 10, keys: [[0, P({ spine: -6, neck: -24, head: -10, jaw: 40 }, st({ tailA: 30, chainSw: 40, eye: 2 }), [-5.6, -11])], [0.4, P({ spine: 10, chest: 6, neck: 26, head: 16, jaw: 30 }, st({ pF: [12.6, 0], pB: [7.4, 0], qF: [1.4, 0], qB: [-1.4, 0], tailA: -20, chainSw: -20, eye: 0.6 }), [-5.4, -6.4], 4)], [1, P({ spine: 6, chest: 4, neck: 40, head: 24, jaw: 34 }, st({ pF: [13.6, 0], pB: [8.6, 0], qF: [3.4, 0], qB: [-2.6, 0], tailA: -40, chainSw: 0, eye: 0 }), [-5.2, -3.4], 2)]] };
    return R;
  }
  A.register('en_hound', () => A.creature({ name: 'en_hound', S, box: [48, 30], anchor: [22, 27], rig, solve, draw, points, anims: anims(), post: K.post('#a39ab8', 0.3, 0.045) }));
  (A.previewCell = A.previewCell || {}).en_hound = [44, 30];
})(window.ART);
