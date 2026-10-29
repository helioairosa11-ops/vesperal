// Vesperal — Rastejante (crawler): cadáver esguio que rasteja sobre braços longos, coluna arqueada,
// pernas presas na mortalha como uma cauda; avança aos solavancos e morde. → assets/sprites/en_crawler.png
'use strict';
(function (A) {
  const S = 4, K = A.kit(S), D2R = A.D2R;
  const M = {
    skin: A.mat('#948885', { shadow: '#544a4b', light: '#c9bdb4', deep: '#2a2226' }),
    skinB: A.mat('#6c6262', { shadow: '#3c3436', light: '#958a86', deep: '#1c171a' }),
    shroud: A.mat('#8c877b', { shadow: '#57534a', light: '#bdb6a6', deep: '#2f2c27' }),
    rope: A.mat('#3e3127', { shadow: '#221a14', light: '#6a5644' }),
    bone: A.mat('#d6cbb2', { shadow: '#8d8169', light: '#f3ead6' }),
    hair: '#1a161b',
  };
  const rig = new A.Rig([
    { n: 'hips', len: 2.5, a: 0 },
    { n: 'sp1', p: 'hips', len: 3.8, a: 0 },
    { n: 'sp2', p: 'sp1', len: 3.6, a: 10 },
    { n: 'chest', p: 'sp2', len: 3.4, a: 18 },
    { n: 'neck', p: 'chest', len: 2.0, a: 40 },
    { n: 'head', p: 'neck', len: 3.4, a: -40 },
    { n: 'jaw', p: 'head', at: 0.4, len: 2.2, a: 18, off: [0, 1.0] },
    { n: 'uarmB', p: 'chest', at: 0.55, len: 5.0, a: 80, off: [0, 0.2] },
    { n: 'farmB', p: 'uarmB', len: 5.4, a: 0 },
    { n: 'handB', p: 'farmB', len: 2.2, a: 0 },
    { n: 'uarmF', p: 'chest', at: 0.55, len: 5.0, a: 80, off: [0, 0.6] },
    { n: 'farmF', p: 'uarmF', len: 5.4, a: 0 },
    { n: 'handF', p: 'farmF', len: 2.2, a: 0 },
  ]);
  const ROOT = [-6, -4.0];

  // braços por cinemática inversa: x.hF / x.hB = alvo da mão; x.haF / x.haB = ângulo da mão (graus, mundo)
  function solve(pose) {
    const x = pose.extra;
    if (x.hB) A.ik(rig, pose, 'uarmB', 'farmB', x.hB, -1, 'handB', x.haB === undefined ? 8 : x.haB);
    if (x.hF) A.ik(rig, pose, 'uarmF', 'farmF', x.hF, -1, 'handF', x.haF === undefined ? 8 : x.haF);
  }

  // mão de dedos compridos com garras escuras
  function hand(ctx, H, m, curl) {
    ctx.save(); A.boneT(ctx, H, S);
    const palm = K.blob(ctx, [[-0.3, -0.75], [1.2, -0.7], [1.6, 0.05], [1.1, 0.7], [-0.3, 0.6]], m, { depth: S * 0.3 });
    for (let i = 0; i < 3; i++) {
      const oy = -0.5 + i * 0.5, c = (curl || 0) * (0.8 + i * 0.15);
      const pts = [[1.2, oy], [2.4, oy + 0.1 + c * 0.4], [3.3, oy + 0.4 + c * 1.1], [3.7, oy + 1.0 + c * 1.5]];
      K.tube(ctx, pts, [0.26, 0.22, 0.17, 0.1], m, { depth: S * 0.2, hlw: S * 0.1 });
      K.line(ctx, [pts[2], pts[3]], 0.16, '#151015');
    }
    ctx.restore();
    return palm;
  }
  function arm(ctx, W, side, back) {
    const U = W['uarm' + side], F = W['farm' + side], H = W['hand' + side];
    const m = back ? M.skinB : M.skin;
    const p = K.limb(ctx, [U.x, U.y], [F.x, F.y], [F.ex, F.ey], 0.8, 0.55, 0.45, m, { depth: S * 0.5 });
    // tendões e o cotovelo ossudo
    K.line(ctx, [[F.x, F.y], [A.lerp(F.x, F.ex, 0.6), A.lerp(F.y, F.ey, 0.6)]], 0.14, A.rgba('#000000', 0.35));
    K.dot(ctx, F.x, F.y - 0.1, 0.42, back ? M.skinB.light : M.skin.light);
    hand(ctx, H, m, W._curl || 0);
    return p;
  }
  // pernas atadas na mortalha: um fardo afunilado que se arrasta, com cordas e os dedos de um pé à mostra
  function tail(ctx, W, x) {
    const h = W.hips, wave = x.tailWave || 0, drag = x.drag || 0;
    const pts = [], ws = [2.0, 2.05, 1.85, 1.6, 1.3, 1.0, 0.7];
    for (let i = 0; i < 7; i++) {
      const k = i / 6, sm = Math.min(1, i / 2.6);
      pts.push([h.x - i * 2.45 - drag * k * k * 2, A.lerp(h.y + 0.4, -ws[i] * 0.8, sm) + Math.sin(k * 5 + wave) * 0.3 * k]);
    }
    const path = K.tube(ctx, pts, ws, M.shroud, { depth: S * 0.8, hlw: S * 0.35 });
    ctx.save(); ctx.clip(path);
    // pregas e sujidade
    for (let i = 1; i < 6; i++) K.line(ctx, [[pts[i][0] + 0.8, pts[i][1] - ws[i] * 0.9], [pts[i][0] - 0.6, pts[i][1] + ws[i] * 0.8]], 0.16, A.rgba('#2a241c', 0.45));
    const gr = ctx.createLinearGradient(0, -1 * S, 0, 1 * S); gr.addColorStop(0, 'rgba(40,32,26,0)'); gr.addColorStop(1, 'rgba(40,32,26,0.55)');
    ctx.fillStyle = gr; ctx.fillRect(pts[6][0] * S - 4 * S, -4 * S, 30 * S, 5 * S);
    ctx.restore();
    // cordas
    for (const i of [1, 3, 5]) { const [px, py] = pts[i], w = ws[i]; K.line(ctx, [[px + 0.35, py - w * 1.02], [px - 0.35, py + w * 0.98]], 0.42, M.rope.shadow); K.line(ctx, [[px + 0.3, py - w * 1.0], [px - 0.3, py + w * 0.9]], 0.18, M.rope.light); }
    // pé descalço a sair da ponta
    const e = pts[6];
    ctx.save(); ctx.translate((e[0] - 0.4) * S, (e[1] + 0.2) * S); ctx.rotate(Math.PI + 0.25);
    const foot = K.blob(ctx, [[-0.2, -0.6], [1.6, -0.55], [2.2, 0.0], [1.8, 0.55], [-0.2, 0.55]], M.skinB, { depth: S * 0.3 });
    for (let i = 0; i < 3; i++) K.line(ctx, [[1.8, -0.35 + i * 0.32], [2.25, -0.4 + i * 0.36]], 0.14, '#1a141a');
    ctx.restore();
    // farrapo solto
    return pts;
  }
  // tronco: costas arqueadas em corcova, cintura fina, caixa torácica saliente, omoplata e vértebras
  function body(ctx, W, x) {
    const pts = [[W.hips.x - 0.4, W.hips.y + 0.2], [W.sp1.x, W.sp1.y], [W.sp2.x, W.sp2.y], [W.chest.x, W.chest.y], [W.chest.ex, W.chest.ey], [W.neck.ex, W.neck.ey]];
    const ws = [1.9, 1.45, 2.2, 2.65, 1.9, 0.75];
    const path = K.tube(ctx, pts, ws, M.skin, { depth: S * 0.9, hlw: S * 0.4, light: [0.2, -1] });
    // costelas no flanco (do dorso para o ventre)
    const ribs = [];
    for (let i = 0; i < 5; i++) {
      const B = i < 2 ? W.sp2 : W.chest, t = i < 2 ? 0.4 + i * 0.3 : (i - 2) * 0.28 + 0.08;
      const [bx, by] = K.along(B, t), [nx, ny] = K.perp(B);
      ribs.push([[bx - nx * 0.6 - 0.2, by - ny * 0.6], [bx + nx * 1.2 + 0.4, by + ny * 1.2], [bx + nx * 2.3 + 1.1, by + ny * 2.2]]);
    }
    K.ribs(ctx, path, ribs, A.rgba(M.skin.deep, 0.7), 0.3);
    K.ribs(ctx, path, ribs.map((r) => r.map(([a, b]) => [a - 0.25, b - 0.22])), A.rgba(M.skin.light, 0.5), 0.12);
    // ventre encovado e sujidade de cinza
    ctx.save(); ctx.clip(path);
    const [wx, wy] = K.along(W.sp1, 0.5), [wnx, wny] = K.perp(W.sp1);
    K.line(ctx, [[wx + wnx * 1.2 - 1, wy + wny * 1.2], [wx + wnx * 1.0 + 1.4, wy + wny * 1.0]], 0.5, A.rgba(M.skin.deep, 0.5));
    const sm = ctx.createLinearGradient(0, (W.hips.y - 2) * S, 0, (W.hips.y + 2) * S); sm.addColorStop(0, 'rgba(30,24,28,0)'); sm.addColorStop(1, 'rgba(30,24,28,0.5)');
    ctx.fillStyle = sm; ctx.fillRect((W.hips.x - 3) * S, (W.hips.y - 3) * S, 8 * S, 6 * S);
    ctx.restore();
    // vértebras ao longo da corcova
    for (let i = 0; i < 8; i++) {
      const B = i < 3 ? W.sp1 : i < 6 ? W.sp2 : W.chest, t = (i % 3) * 0.33 + 0.12, wi = i < 3 ? 1.5 : i < 6 ? 2.25 : 2.6;
      const [bx, by] = K.along(B, t), [nx, ny] = K.perp(B);
      const vx = bx - nx * (wi + 0.05), vy = by - ny * (wi + 0.05);
      const v = K.blobPath([[vx - nx * 0.1 - 0.4, vy + 0.25], [vx - nx * 0.55, vy - ny * 0.55], [vx - nx * 0.1 + 0.4, vy + 0.25]]);
      ctx.fillStyle = M.skin.light; ctx.fill(v); ctx.lineWidth = K.IW * 0.7; ctx.strokeStyle = K.INK; ctx.stroke(v);
    }
    // omoplata saliente
    const [sx, sy] = K.along(W.chest, 0.3), [cnx, cny] = K.perp(W.chest);
    const sc = K.blobPath([[sx - cnx * 2.4 - 1.2, sy - cny * 2.4], [sx - cnx * 2.9 + 0.2, sy - cny * 2.9], [sx - cnx * 2.2 + 1.4, sy - cny * 2.2 + 0.2], [sx - cnx * 1.2, sy - cny * 1.2]]);
    K.paint(ctx, sc, M.skin, { depth: S * 0.35, hlw: S * 0.25, light: [0.2, -1] });
    return path;
  }
  // cabeça humana descarnada: crânio redondo, órbita acesa, nariz roído, dentes sem lábios; cabelo comprido pendurado
  function hairStrands(ctx, H, x, front) {
    ctx.save(); A.boneT(ctx, H, S); ctx.rotate(-H.a * D2R); // cabelo cai na vertical do mundo
    const sw = x.hairSway || 0, r = A.rng(front ? 3 : 4);
    const n = front ? 4 : 6;
    for (let i = 0; i < n; i++) {
      const sx = (front ? 1.0 : -1.2) + i * (front ? 0.55 : 0.5) + (r() - 0.5) * 0.3, len = 3.6 + r() * 2.2 + (front ? 0.6 : 0);
      const ox = sx * Math.cos(H.a * D2R), oy = sx * Math.sin(H.a * D2R) - 1.6;
      A.stroke(ctx, [[ox, oy], [ox + sw * 0.3 - 0.2, oy + len * 0.5], [ox + sw * 0.8 - 0.5 + (r() - 0.5) * 0.6, oy + len]], S * (front ? 0.2 : 0.26), front ? '#16121a' : '#100d12', S);
    }
    ctx.restore();
  }
  function head(ctx, W, x) {
    const H = W.head, J = W.jaw;
    hairStrands(ctx, H, x, false);
    // mandíbula (abre para morder)
    ctx.save(); A.boneT(ctx, J, S);
    K.blob(ctx, [[-0.4, -0.5], [1.3, -0.55], [2.4, -0.25], [2.4, 0.35], [1.2, 0.7], [-0.3, 0.45]], M.skin, { depth: S * 0.35 });
    for (let i = 0; i < 4; i++) { const tx = 1.0 + i * 0.4; const t = A.path((q) => { q.M(tx - 0.17, -0.48); q.L(tx, -0.98); q.L(tx + 0.17, -0.48); q.Z(); }, S); ctx.fillStyle = M.bone.base; ctx.fill(t); ctx.lineWidth = K.IW * 0.6; ctx.strokeStyle = K.INK; ctx.stroke(t); }
    ctx.restore();
    // crânio
    ctx.save(); A.boneT(ctx, H, S);
    const sk = K.blob(ctx, [[-0.9, -0.6], [-0.4, -2.0], [1.0, -2.6], [2.5, -2.1], [3.3, -1.0], [3.5, 0.0], [3.2, 0.7], [2.2, 1.15], [0.8, 1.1], [-0.4, 0.6]], M.skin, { depth: S * 0.6, hlw: S * 0.32, light: [0.5, -1] });
    ctx.save(); ctx.clip(sk);
    K.line(ctx, [[2.0, -1.25], [3.25, -1.05]], 0.4, A.rgba(M.skin.deep, 0.5)); // arcada da sobrancelha
    K.line(ctx, [[1.7, 0.55], [2.7, 0.35]], 0.3, A.rgba(M.skin.deep, 0.55)); // maçã encovada
    K.line(ctx, [[0.2, -1.6], [0.9, -0.3]], 0.25, A.rgba('#000000', 0.25)); // têmpora
    ctx.restore();
    // dentes de cima (sem lábios)
    for (let i = 0; i < 4; i++) { const tx = 2.1 + i * 0.36; const t = A.path((q) => { q.M(tx - 0.16, 0.85); q.L(tx, 1.32); q.L(tx + 0.16, 0.85); q.Z(); }, S); ctx.fillStyle = M.bone.base; ctx.fill(t); ctx.lineWidth = K.IW * 0.6; ctx.strokeStyle = K.INK; ctx.stroke(t); }
    // órbita funda com a brasa
    const so = K.blobPath([[2.2, -0.85], [2.95, -0.95], [3.2, -0.35], [2.75, 0.05], [2.2, -0.2]]);
    ctx.fillStyle = '#0c080b'; ctx.fill(so);
    K.ember(ctx, 2.75, -0.45, 0.4, x.eye === undefined ? 1 : x.eye);
    // nariz roído
    const ns = A.path((q) => { q.M(3.3, -0.15); q.L(3.55, 0.45); q.L(3.15, 0.45); q.Z(); }, S); ctx.fillStyle = '#140e12'; ctx.fill(ns);
    ctx.restore();
    hairStrands(ctx, H, x, true);
  }
  // a mortalha sobe até à cintura: bainha esfarrapada por cima das ancas
  function hipWrap(ctx, W, x) {
    const h = W.hips, [nx, ny] = K.perp(h), [ex, ey] = K.along(W.sp1, 0.25), [enx, eny] = K.perp(W.sp1);
    const top = [ex - enx * 1.6, ey - eny * 1.6], bot = [ex + enx * 1.6, ey + eny * 1.6];
    const r = A.rng(9), teeth = [];
    for (let i = 0; i <= 4; i++) { const t = i / 4; teeth.push([A.lerp(top[0], bot[0], t) + (i % 2 ? 0.7 : 0) + (r() - 0.5) * 0.3, A.lerp(top[1], bot[1], t)]); }
    const path = A.path((q) => {
      q.M(h.x - nx * 2.1 - 0.8, h.y - ny * 2.1); q.L(teeth[0][0], teeth[0][1]);
      for (const t of teeth) q.L(t[0], t[1]);
      q.L(h.x + nx * 2.1 - 0.8, h.y + ny * 2.1); q.Q(h.x - 1.6, h.y + 0.6, h.x - nx * 2.1 - 0.8, h.y - ny * 2.1); q.Z();
    }, S);
    K.paint(ctx, path, M.shroud, { depth: S * 0.5, hlw: S * 0.25 });
    K.line(ctx, [[A.lerp(h.x, ex, 0.4) - enx * 1.9, A.lerp(h.y, ey, 0.4) - eny * 1.9], [A.lerp(h.x, ex, 0.45) + enx * 1.9, A.lerp(h.y, ey, 0.45) + eny * 1.9]], 0.4, M.rope.shadow);
    K.line(ctx, [[A.lerp(h.x, ex, 0.4) - enx * 1.9, A.lerp(h.y, ey, 0.4) - eny * 1.9 - 0.12], [A.lerp(h.x, ex, 0.45) + enx * 1.9, A.lerp(h.y, ey, 0.45) + eny * 1.9 - 0.12]], 0.16, M.rope.light);
  }
  function draw(ctx, W, x) {
    W._curl = x.curl || 0;
    arm(ctx, W, 'B', true);
    tail(ctx, W, x);
    body(ctx, W, x);
    hipWrap(ctx, W, x);
    head(ctx, W, x);
    arm(ctx, W, 'F', false);
  }
  function points(W) {
    const H = W.head, [ex, ey] = [H.x + Math.cos(H.a * D2R) * 2.5 - Math.sin(H.a * D2R) * -0.42, H.y + Math.sin(H.a * D2R) * 2.5 + Math.cos(H.a * D2R) * -0.42];
    return { eye: [ex, ey], tip: [W.jaw.ex, W.jaw.ey] };
  }

  // ---------------------------------------------------------------- poses
  const BASE = { hips: 0, sp1: 0, sp2: 0, chest: 0, neck: 0, head: 0, jaw: 0 };
  const P = (a, x, root, rootA) => A.pose(A.addA(BASE, a || {}), x, root || ROOT, rootA === undefined ? -30 : rootA);

  function anims() {
    const R = {};
    // parado: respira, a cabeça estremece, a cauda mexe
    R.idle = {
      n: 6, fps: 7, loop: true,
      keys: [
        [0, P({ neck: 0, head: 0 }, { hF: [7.4, 0], hB: [4.8, 0], tailWave: 0, eye: 1 })],
        [0.4, P({ sp2: -2, chest: -2, neck: -4, head: 6, jaw: 6 }, { hF: [7.4, 0], hB: [4.8, 0], tailWave: 1.4, eye: 1.3, hairSway: 0.4 }, [-7, -5.6])],
        [0.55, P({ sp2: -2, chest: -2, neck: 6, head: -8, jaw: 2 }, { hF: [7.4, 0], hB: [4.8, 0], tailWave: 1.9, eye: 1.1, hairSway: -0.3 }, [-7, -5.6])],
        [1, P({ neck: 0, head: 0 }, { hF: [7.4, 0], hB: [4.8, 0], tailWave: Math.PI * 2, eye: 1 })],
      ],
    };
    // rastejar: os braços alternam (agarrar → puxar), o corpo avança aos solavancos, a cauda arrasta
    const reach = (u) => { // u: fase do braço 0..1 → [x, y]
      const st = 0.55;
      if (u < st) return [A.lerp(11, 0.5, u / st), 0];
      const k = (u - st) / (1 - st); return [A.lerp(0.5, 11, A.ease.io(k)), -Math.sin(k * Math.PI) * 3.4];
    };
    R.move = {
      n: 8, fps: 12, loop: true, stride: 19,
      poseFn: (t) => {
        const surge = Math.sin(t * A.TAU * 2 - 0.6);
        const hF = reach(t), hB = reach((t + 0.5) % 1);
        return P({ sp1: surge * 2, sp2: -surge * 2, chest: surge * 3, neck: -surge * 5, head: surge * 6 },
          { hF, hB, haF: hF[1] < -0.2 ? 30 : 6, haB: hB[1] < -0.2 ? 30 : 6, tailWave: t * A.TAU * 2, drag: 0.5 + surge * 0.5, curl: 0.2, hairSway: -0.6 + surge * 0.3 },
          [-7 + surge * 0.9, -5.4 - Math.abs(surge) * 0.5]);
      },
    };
    // salto com mordida: recua e encolhe-se (antecipação), lança-se rente ao chão de boca aberta, aterra a deslizar
    const W1 = P({ sp1: 8, sp2: 6, chest: -6, neck: -14, head: -10, jaw: 10 }, { hF: [5.2, 0], hB: [3.0, 0], haF: 4, tailWave: 0.5, drag: -0.4, eye: 1.4, curl: 0.5 }, [-7.4, -3.6], -36);
    const W2 = P({ sp1: 12, sp2: 10, chest: -10, neck: -22, head: -16, jaw: 26 }, { hF: [4.4, 0], hB: [2.4, 0], tailWave: 0.9, drag: -0.6, eye: 1.8, curl: 0.7 }, [-8.2, -3.2], -42);
    const ACT = P({ sp1: -6, sp2: -4, chest: 4, neck: 6, head: -4, jaw: 46 }, { hF: [17, -5], hB: [15, -3.4], haF: -10, haB: -6, tailWave: 2, drag: 1.4, eye: 2, air: true, curl: -0.2 }, [-3.5, -6.4], -14);
    const ACT2 = P({ sp1: -2, sp2: -2, chest: 4, neck: 10, head: 4, jaw: 10 }, { hF: [15.5, -1], hB: [13, 0], haF: 10, tailWave: 2.6, drag: 1.8, eye: 1.6, air: true, curl: 0.4 }, [-3.0, -6.0], -16);
    const LAND = P({ sp1: 4, sp2: 4, chest: 2, neck: 6, head: 10, jaw: 2 }, { hF: [12, 0], hB: [9.5, 0], tailWave: 3.2, drag: 1.0, eye: 1.2, curl: 0.3 }, [-5.2, -4.0], -24);
    R.atk_pounce = {
      n: 11, fps: 14, phases: [4, 3],
      poseFn: (t, i) => {
        const seq = [W1, W1, W2, W2, ACT, ACT, ACT2, LAND, LAND, P({ jaw: 0 }, { hF: [9, 0], hB: [6.4, 0], tailWave: 3.8, drag: 0.6, eye: 1 }), P({}, { hF: [7.4, 0], hB: [4.8, 0], tailWave: 4.2, eye: 1 })];
        const f = seq[i];
        if (i === 1) return A.interp([[0, W1], [1, W2]], 0.3);
        if (i === 5) return A.interp([[0, ACT], [1, ACT2]], 0.45);
        if (i === 8) return A.interp([[0, LAND], [1, seq[9]]], 0.4);
        return JSON.parse(JSON.stringify(f));
      },
    };
    // mordida curta: puxa a cabeça atrás de boca aberta e estala os dentes em frente
    const BW = P({ sp2: -4, chest: -8, neck: -24, head: -6, jaw: 34 }, { hF: [7, 0], hB: [4.4, 0], tailWave: 0.4, eye: 1.6, hairSway: 0.6 }, [-7.4, -4.2]);
    const BA = P({ sp1: -4, sp2: 2, chest: 10, neck: 30, head: -26, jaw: 2 }, { hF: [7.6, 0], hB: [5, 0], tailWave: 0.8, eye: 1.8, hairSway: -0.8 }, [-5.6, -4.0], -26);
    R.atk_bite = {
      n: 7, fps: 16, phases: [3, 2],
      keys: [[0, P({}, { hF: [7.4, 0], hB: [4.8, 0] })], [0.33, BW], [0.42, P({ sp1: -2, sp2: 0, chest: 4, neck: 10, head: -16, jaw: 40 }, { hF: [7.4, 0], hB: [5, 0], tailWave: 0.6, eye: 2 }, [-6.2, -4.1], -28)], [0.6, BA], [1, P({ jaw: 4 }, { hF: [7.4, 0], hB: [4.8, 0], tailWave: 1.2 })]],
    };
    // ferido: a cabeça salta para trás
    R.hurt = {
      n: 3, fps: 14,
      keys: [
        [0, P({ sp2: -6, chest: -10, neck: -26, head: -24, jaw: 30 }, { hF: [6.2, 0], hB: [4.2, 0], tailWave: 0.6, eye: 2.2 }, [-7.6, -5.8])],
        [1, P({ sp2: -2, chest: -3, neck: -8, head: -6, jaw: 8 }, { hF: [7, 0], hB: [4.6, 0], tailWave: 1, eye: 1.2 })],
      ],
    };
    // atordoado (após parry/postura quebrada): cabeça pendente, braços a tremer
    R.stagger = {
      n: 4, fps: 8, loop: true,
      keys: [
        [0, P({ sp1: 4, sp2: 6, chest: 10, neck: 30, head: 30, jaw: 22 }, { hF: [8.2, 0], hB: [3.8, 0], haF: -10, tailWave: 0, eye: 0.6, curl: 0.8 }, [-7, -4.2])],
        [0.5, P({ sp1: 5, sp2: 8, chest: 12, neck: 36, head: 22, jaw: 30 }, { hF: [8.6, 0], hB: [4.2, 0], haF: -16, tailWave: 1.5, eye: 0.4, curl: 0.9 }, [-7, -4.0])],
        [1, P({ sp1: 4, sp2: 6, chest: 10, neck: 30, head: 30, jaw: 22 }, { hF: [8.2, 0], hB: [3.8, 0], haF: -10, tailWave: Math.PI * 2, eye: 0.6, curl: 0.8 }, [-7, -4.2])],
      ],
    };
    // morte: os braços cedem, o corpo cai de lado no chão e a brasa apaga-se
    R.death = {
      n: 7, fps: 10,
      keys: [
        [0, P({ sp2: -8, chest: -12, neck: -30, head: -20, jaw: 40 }, { hF: [6, 0], hB: [4, 0], eye: 2.2 }, [-7.4, -6])],
        [0.35, P({ sp1: 6, sp2: 10, chest: 14, neck: 20, head: 20, jaw: 30 }, { hF: [9, 0], hB: [2.5, 0], haF: -20, eye: 0.8, curl: 1 }, [-7, -3.4])],
        [1, P({ sp1: 8, sp2: 10, chest: 14, neck: 34, head: 40, jaw: 34 }, { hF: [10.5, 0], hB: [1.5, 0], haF: -30, haB: -40, eye: 0, curl: 1.2, drag: 0.4 }, [-7, -2.4], -8)],
      ],
    };
    return R;
  }
  A.register('en_crawler', () => A.creature({ name: 'en_crawler', S, box: [48, 26], anchor: [24, 23], rig, solve, draw, points, anims: anims(), post: K.post('#a39ab8', 0.3, 0.045) }));
  (A.previewCell = A.previewCell || {}).en_crawler = [52, 26];
})(window.ART);
