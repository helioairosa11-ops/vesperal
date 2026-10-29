// Vesperal — Cinzento (husk): defunto coberto de cinza, mortalha rasgada, brasas nas órbitas, arrasta os pés.
// Ataca com as unhas (golpe de cima) e com um abraço em salto (aparável). → assets/sprites/en_husk.png
'use strict';
(function (A) {
  const S = 4, K = A.kit(S), D2R = A.D2R;
  const H = A.humanoid({ spine: 4.6, chest: 4.4, neck: 1.5, head: 3.9, thigh: 6.3, shin: 6.3, foot: 2.6, uarm: 5.3, farm: 5.0, hand: 2.0 });
  const rig = H.rig;
  const M = {
    skin: A.mat('#6f6668', { shadow: '#3a3336', light: '#a59b96', deep: '#1e191c' }),
    soot: '#2a2427',
    shroud: A.mat('#9b9381', { shadow: '#605a4e', light: '#c8bfab', deep: '#2b2822' }),
    rope: A.mat('#3b2f26', { shadow: '#211a15', light: '#665343' }),
    bone: A.mat('#d4c9b0', { shadow: '#8b7f68', light: '#f1e8d4' }),
  };
  const BACK = 0.68;

  // pés e mãos por IK. x.fF/x.fB = [dx, alturaDoChão] relativo à anca; x.hF/x.hB = [dx, dy] relativo ao ombro
  function solve(pose) {
    const x = pose.extra, r = pose.root;
    if (x.fF) H.leg(pose, 'F', [r[0] + x.fF[0], x.fF[1] - 0.85], x.faF || 0);
    if (x.fB) H.leg(pose, 'B', [r[0] + x.fB[0], x.fB[1] - 0.85], x.faB || 0);
    const W = rig.solve(pose);
    if (x.hF) H.arm(pose, 'F', [W.uarmF.x + x.hF[0], W.uarmF.y + x.hF[1]], x.haF === undefined ? 80 : x.haF, x.bF || 1);
    if (x.hB) H.arm(pose, 'B', [W.uarmB.x + x.hB[0], W.uarmB.y + x.hB[1]], x.haB === undefined ? 85 : x.haB, x.bB || 1);
  }

  function claw(ctx, Hd, m, spread) {
    ctx.save(); A.boneT(ctx, Hd, S);
    K.blob(ctx, [[-0.3, -0.7], [1.1, -0.65], [1.5, 0.05], [1.0, 0.7], [-0.3, 0.6]], m, { depth: S * 0.3 });
    for (let i = 0; i < 3; i++) {
      const oy = -0.45 + i * 0.45, sp = (spread || 0) * (i - 1) * 0.5;
      const pts = [[1.1, oy], [2.1, oy + 0.15 + sp], [2.9, oy + 0.55 + sp * 1.6]];
      K.tube(ctx, pts, [0.22, 0.18, 0.1], m, { depth: S * 0.2, hlw: S * 0.1 });
      K.line(ctx, [pts[1], pts[2]], 0.13, '#140f12');
    }
    ctx.restore();
  }
  function arm(ctx, W, side, back, x) {
    const U = W['uarm' + side], F = W['farm' + side], Hd = W['hand' + side];
    const m = back ? K.dim(M.skin, BACK) : M.skin;
    K.limb(ctx, [U.x, U.y], [F.x, F.y], [F.ex, F.ey], 0.85, 0.6, 0.5, m, { depth: S * 0.5 });
    // farrapo atado ao pulso
    const wx = A.lerp(F.x, F.ex, 0.75), wy = A.lerp(F.y, F.ey, 0.75);
    const sw = (x.sway || 0) * 0.6;
    const rag = A.path((q) => { q.M(wx - 0.5, wy - 0.3); q.Q(wx - 0.8 + sw, wy + 1.6, wx - 1.2 + sw, wy + 3.0); q.L(wx - 0.4 + sw, wy + 2.6); q.Q(wx + 0.1, wy + 1.2, wx + 0.5, wy + 0.2); q.Z(); }, S);
    K.paint(ctx, rag, back ? K.dim(M.shroud, BACK) : M.shroud, { depth: S * 0.3, hlw: S * 0.15 });
    claw(ctx, Hd, m, x.spread);
  }
  function leg(ctx, W, side, back) {
    const T = W['thigh' + side], N = W['shin' + side], F = W['foot' + side];
    const m = back ? K.dim(M.skin, BACK) : M.skin;
    const path = K.limb(ctx, [T.x, T.y], [N.x, N.y], [N.ex, N.ey], 1.25, 0.85, 0.6, m, { depth: S * 0.55 });
    // joelho e canela sujos de cinza
    ctx.save(); ctx.clip(path);
    const g = ctx.createLinearGradient(0, N.y * S, 0, N.ey * S); g.addColorStop(0, 'rgba(34,28,31,0)'); g.addColorStop(1, 'rgba(34,28,31,0.6)');
    ctx.fillStyle = g; ctx.fillRect((Math.min(N.x, N.ex) - 2) * S, N.y * S, 5 * S, (N.ey - N.y + 1) * S);
    ctx.restore();
    // pé descalço
    ctx.save(); A.boneT(ctx, F, S);
    K.blob(ctx, [[-0.7, -0.75], [1.2, -0.55], [2.6, -0.1], [2.7, 0.55], [-0.8, 0.7]], m, { depth: S * 0.3 });
    for (let i = 0; i < 3; i++) K.line(ctx, [[2.0 + i * 0.22, 0.6], [2.2 + i * 0.22, 0.15]], 0.1, '#161013');
    ctx.restore();
  }
  // tronco descarnado: costelas, ventre encovado, cinza escura a subir das pernas
  function torso(ctx, W, x) {
    const path = H.torsoPath(W, [['pelvis', 0.2, 1.8, 1.9], ['spine', 0.1, 1.45, 1.9], ['spine', 0.7, 2.0, 2.2], ['chest', 0.45, 2.45, 2.5], ['chest', 1, 1.7, 2.2]], S);
    K.paint(ctx, path, M.skin, { depth: S * 0.9, hlw: S * 0.4 });
    const C = W.chest, [cnx, cny] = K.perp(C);
    const ribs = [];
    for (let i = 0; i < 5; i++) { const [bx, by] = K.along(C, 0.05 + i * 0.19); ribs.push([[bx - cnx * 0.6, by - cny * 0.6], [bx + cnx * 1.3 - 0.2, by + cny * 1.3 + 0.35], [bx + cnx * 2.4 - 0.7, by + cny * 2.4 + 0.9]]); }
    K.ribs(ctx, path, ribs, A.rgba(M.skin.deep, 0.65), 0.3);
    K.ribs(ctx, path, ribs.map((r) => r.map(([u, v]) => [u - 0.2, v - 0.25])), A.rgba(M.skin.light, 0.45), 0.12);
    ctx.save(); ctx.clip(path);
    const P = W.pelvis, [hx, hy] = K.along(P, 0.2);
    const g = ctx.createLinearGradient(0, (hy - 5) * S, 0, (hy + 1) * S); g.addColorStop(0, 'rgba(30,25,28,0)'); g.addColorStop(1, 'rgba(30,25,28,0.65)');
    ctx.fillStyle = g; ctx.fillRect((hx - 5) * S, (hy - 6) * S, 10 * S, 8 * S);
    ctx.restore();
  }
  // mortalha: capuz rasgado sobre a cabeça e os ombros, a cair pelas costas até às coxas
  function cowl(ctx, W, x, front) {
    const C = W.chest, Hd = W.head, P = W.pelvis, [cnx, cny] = K.perp(C);
    const [sx, sy] = K.along(C, 0.95), [hx, hy] = K.along(P, 0.1);
    const ca = Math.cos(Hd.a * D2R), sa = Math.sin(Hd.a * D2R);
    const hp = (u, v) => [Hd.x + ca * -v + -sa * u * -1, Hd.y + sa * -v + ca * u * -1]; // (u frente, v baixo) no referencial da cabeça
    const top = [Hd.x + ca * 4.4, Hd.y + sa * 4.4];
    const sw = x.sway || 0, r = A.rng(31);
    if (!front) {
      // aba de trás: do alto da cabeça às costas, bainha em farrapos
      const hem = [];
      for (let i = 0; i <= 5; i++) { const t = i / 5; hem.push([A.lerp(hx - 3.2, hx + 0.6, t) + sw * 0.6 * (1 - t) + (r() - 0.5) * 0.5, hy + 4.4 + (i % 2 ? 1.6 : 0) + r() * 1.3]); }
      const path = A.path((q) => {
        q.M(top[0] - 0.4, top[1] - 0.3); q.Q(top[0] - 4.2, top[1] + 0.5, sx - cnx * 3.6, sy - cny * 3.6 + 1.5);
        q.Q(hx - 3.8 + sw * 0.4, (sy + hy) / 2 + 1, hem[0][0], hem[0][1]);
        for (const h of hem) q.L(h[0], h[1]);
        q.L(hx + 0.8, hy + 1.0); q.L(sx - cnx * 0.4, sy - cny * 0.4); q.Z();
      }, S);
      K.paint(ctx, path, M.shroud, { depth: S * 0.9, hlw: S * 0.35 });
      ctx.save(); ctx.clip(path);
      for (let i = 0; i < 4; i++) K.line(ctx, [[sx - cnx * (1 + i * 0.7), sy - cny * (1 + i * 0.7)], [hx - 0.8 - i * 0.8 + sw * 0.3, hy + 4 + i * 0.4]], 0.3, A.rgba(M.shroud.deep, 0.5));
      const g = ctx.createLinearGradient(0, (hy - 1) * S, 0, (hy + 6) * S); g.addColorStop(0, 'rgba(28,24,22,0)'); g.addColorStop(1, 'rgba(28,24,22,0.55)');
      ctx.fillStyle = g; ctx.fillRect((hx - 6) * S, (hy - 2) * S, 10 * S, 9 * S);
      ctx.restore();
    } else {
      // orla do capuz à volta da cara
      const rim = A.path((q) => {
        const a0 = hp(-1.4, -4.2), a1 = hp(1.4, -4.6), a2 = hp(2.7, -3.5), a3 = hp(0.9, -3.4), a4 = hp(-0.6, -0.6), a5 = hp(-1.8, 0.6);
        q.M(a5[0], a5[1]); q.Q(a0[0] - 0.6, a0[1], a1[0], a1[1]); q.Q(a2[0] + 0.3, a2[1] - 0.2, a2[0], a2[1] + 0.4); q.Q(a3[0], a3[1], a4[0], a4[1]); q.Q(a4[0] - 0.4, a4[1] + 0.8, a5[0] + 0.6, a5[1] + 0.2); q.Z();
      }, S);
      K.paint(ctx, rim, M.shroud, { depth: S * 0.5, hlw: S * 0.3 });
    }
  }
  // cabeça de perfil: testa fugidia, órbita funda acesa, nariz roído, dentes sem lábios, mandíbula caída
  function head(ctx, W, x) {
    const Hd = W.head;
    ctx.save(); A.boneT(ctx, W.neck, S);
    K.tube(ctx, [[-0.2, 0], [W.neck.len + 0.4, 0]], [0.95, 0.75], M.skin, { depth: S * 0.3, flat: true });
    ctx.restore();
    ctx.save(); A.boneT(ctx, Hd, S); ctx.rotate(Math.PI / 2);
    const mo = x.mouth === undefined ? 0.5 : x.mouth;
    // mandíbula
    const jaw = K.blob(ctx, [[-0.2, -0.2], [1.2, 0.2 + mo * 0.5], [2.4, 0.8 + mo * 1.0], [2.3, 1.5 + mo * 1.0], [1.0, 1.4 + mo * 0.6], [-0.4, 0.8]], M.skin, { depth: S * 0.4, light: [0.6, -1] });
    for (let i = 0; i < 3; i++) K.dot(ctx, 1.5 + i * 0.32, 0.75 + mo * 0.85 - i * 0.04, 0.13, M.bone.base);
    // crânio
    const sk = K.blob(ctx, [[-2.1, -0.6], [-1.9, -2.6], [-0.6, -3.9], [1.0, -4.1], [2.1, -3.2], [2.6, -2.1], [2.3, -1.6], [2.8, -0.9], [2.6, -0.3], [2.4, 0.15], [1.2, 0.35], [-0.6, 0.6]], M.skin, { depth: S * 0.65, hlw: S * 0.35, light: [0.6, -1] });
    ctx.save(); ctx.clip(sk);
    const sg = ctx.createLinearGradient(-2 * S, -4 * S, 2 * S, 0.5 * S); sg.addColorStop(0, 'rgba(26,22,25,0.6)'); sg.addColorStop(0.6, 'rgba(26,22,25,0)');
    ctx.fillStyle = sg; ctx.fillRect(-3 * S, -5 * S, 7 * S, 6 * S);
    K.line(ctx, [[0.9, -0.5], [2.0, -0.3]], 0.35, A.rgba(M.skin.deep, 0.6)); // face encovada
    K.line(ctx, [[-0.4, -2.2], [0.2, -0.8]], 0.3, A.rgba('#000000', 0.25)); // têmpora
    ctx.restore();
    // dentes de cima
    for (let i = 0; i < 4; i++) { const tx = 1.35 + i * 0.3; const t = A.path((q) => { q.M(tx - 0.13, 0.15); q.L(tx, 0.55); q.L(tx + 0.13, 0.15); q.Z(); }, S); ctx.fillStyle = M.bone.base; ctx.fill(t); }
    // órbita e brasa
    const eo = K.blobPath([[1.2, -2.25], [2.1, -2.35], [2.3, -1.6], [1.7, -1.25], [1.2, -1.55]]);
    ctx.fillStyle = '#0d080b'; ctx.fill(eo);
    K.ember(ctx, 1.75, -1.8, 0.38, x.eye === undefined ? 1 : x.eye);
    K.line(ctx, [[2.55, -0.95], [2.75, -0.45]], 0.2, '#140d10'); // nariz roído
    ctx.restore();
  }
  function draw(ctx, W, x) {
    cowl(ctx, W, x, false);
    arm(ctx, W, 'B', true, x);
    leg(ctx, W, 'B', true);
    torso(ctx, W, x);
    leg(ctx, W, 'F', false);
    // farrapos da frente por cima das coxas
    const P = W.pelvis, [hx, hy] = K.along(P, 0.1), [pnx] = K.perp(W.spine);
    K.rags(ctx, [hx - 1.4, hy + 0.2], [hx + 2.2, hy + 0.6], 4.6, 3, M.shroud, 4, (x.sway || 0) * 0.8);
    K.line(ctx, [[hx - 1.9, hy - 0.2], [hx + 2.4, hy + 0.3]], 0.42, M.rope.shadow);
    K.line(ctx, [[hx - 1.9, hy - 0.32], [hx + 2.4, hy + 0.18]], 0.15, M.rope.light);
    head(ctx, W, x);
    cowl(ctx, W, x, true);
    arm(ctx, W, 'F', false, x);
  }
  function points(W, x) {
    const Hd = W.handF, Hh = W.head;
    const ca = Math.cos(Hh.a * D2R), sa = Math.sin(Hh.a * D2R);
    // olho: no referencial da cabeça (rodado +90°): (1.65, -1.2) → osso: x' = -y, y' = x
    const ex = Hh.x + ca * 1.8 - sa * 1.75, ey = Hh.y + sa * 1.8 + ca * 1.75;
    return { tip: [Hd.ex + Math.cos(Hd.a * D2R) * 1.2, Hd.ey + Math.sin(Hd.a * D2R) * 1.2], eye: [ex, ey] };
  }

  // ---------------------------------------------------------------- poses
  const HUNCH = { pelvis: 0, spine: 22, chest: 20, neck: 30, head: -44 };
  const P = (a, x, root, rootA) => A.pose(A.addA(HUNCH, a || {}), x, root || [0, -12.2], rootA || 0);
  const FEET = { fF: [2.2, 0], fB: [-2.0, 0] };
  const stand = (o = {}) => Object.assign({ hF: [1.6, 8.2], hB: [0.4, 8.6], sway: 0 }, FEET, o);

  function anims() {
    const R = {};
    R.idle = {
      n: 6, fps: 6, loop: true,
      keys: [
        [0, P({}, stand({ eye: 1 }))],
        [0.5, P({ spine: 2, chest: 3, neck: 4, head: 6 }, stand({ hF: [1.9, 8.0], hB: [0.7, 8.5], eye: 1.25, sway: 0.5, mouth: 0.7 }), [0, -11.9])],
        [1, P({}, stand({ eye: 1 }))],
      ],
    };
    // arrastar os pés: passo curto, o pé de trás raspa o chão, braços pendurados a balouçar com atraso
    R.move = {
      n: 8, fps: 9, loop: true, stride: 11.5,
      poseFn: (t) => {
        const f = A.stepFeet(t, { stride: 3.0, lift: 1.4, drag: 0.6 });
        const s = Math.sin(t * A.TAU), c = Math.cos(t * A.TAU);
        return P({ spine: 2 + c * 2, chest: 1 + s * 2, neck: 2, head: -s * 4 }, { fF: f.F, fB: f.B, faF: f.F[1] < 0 ? 18 : 0, faB: f.B[1] < 0 ? 18 : 0, hF: [1.4 + c * 1.6, 8.3], hB: [0.4 - c * 1.6, 8.5], sway: -c, eye: 1, mouth: 0.55 }, [0.2, -12.0 + Math.abs(s) * 0.35]);
      },
    };
    // golpe de unhas: ergue o braço por trás da cabeça e rasga para baixo
    const SW0 = P({ spine: -6, chest: -10, neck: 0, head: -10 }, stand({ hF: [-3.2, -6.6], haF: -110, hB: [-1.2, 7.6], fF: [2.6, 0], fB: [-2.4, 0], sway: 0.4, eye: 1.4, mouth: 0.8, spread: 0.6 }), [-0.6, -12.3]);
    const SW1 = P({ spine: 18, chest: 18, neck: 6, head: -16 }, stand({ hF: [7.2, 3.6], haF: 60, hB: [-2, 6.8], fF: [4.0, 0], fB: [-2.8, 0], sway: -0.8, eye: 1.6, mouth: 1, spread: 0.8 }), [1.4, -11.4]);
    const SW2 = P({ spine: 24, chest: 22, neck: 8, head: -18 }, stand({ hF: [5.4, 8.6], haF: 100, hB: [-1.6, 7.4], fF: [4.0, 0], fB: [-2.8, 0], sway: -0.4, eye: 1.2, mouth: 0.8 }), [1.6, -11.0]);
    R.atk_swing = {
      n: 8, fps: 14, phases: [3, 2],
      keys: [[0, P({}, stand())], [0.32, SW0], [0.45, P({ spine: 6, chest: 4 }, stand({ hF: [3.4, -4.6], haF: -40, fF: [3.2, 0], fB: [-2.6, 0], eye: 1.6, mouth: 1, spread: 0.8 }), [0.6, -11.9])], [0.58, SW1], [0.75, SW2], [1, P({}, stand())]],
    };
    // abraço em salto (sinal branco): encolhe-se, atira-se com os dois braços estendidos, tropeça
    const LG0 = P({ spine: 30, chest: 12, neck: -4, head: -12 }, stand({ hF: [-2.4, 5.6], hB: [-3.2, 5.2], fF: [3.0, 0], fB: [-3.4, 0], eye: 1.6, mouth: 0.6 }), [-0.8, -10.0]);
    const LG1 = P({ spine: 34, chest: 8, neck: -16, head: -6 }, stand({ hF: [8.4, 0.6], haF: 6, hB: [7.6, 1.6], haB: 10, fF: [3.6, -1.0], fB: [-5.4, 0], faF: 20, eye: 2, mouth: 1.2, spread: 1 }), [2.4, -10.8]);
    R.atk_lunge = {
      n: 9, fps: 14, phases: [3, 3],
      keys: [[0, P({}, stand())], [0.3, LG0], [0.4, P({ spine: 30, chest: 10, neck: -10 }, stand({ hF: [4, 3], hB: [3, 3.4], fF: [3.4, -0.6], fB: [-4.4, 0], eye: 1.8, mouth: 1 }), [0.6, -10.6])], [0.6, LG1], [0.72, LG1], [1, P({ spine: 8 }, stand({ hF: [2.4, 8.0], fF: [3.0, 0], fB: [-2.4, 0] }))]],
    };
    R.hurt = {
      n: 3, fps: 14,
      keys: [[0, P({ spine: -12, chest: -14, neck: -10, head: 4 }, stand({ hF: [-2.4, 7.4], hB: [-3.4, 7.2], fF: [2.8, 0], fB: [-2.6, 0], eye: 2, mouth: 1.2 }), [-0.8, -12.4])], [1, P({}, stand())]],
    };
    R.stagger = {
      n: 4, fps: 7, loop: true,
      keys: [
        [0, P({ spine: 28, chest: 20, neck: 20, head: 6 }, stand({ hF: [3.0, 9.2], hB: [2.0, 9.6], fF: [2.8, 0], fB: [-2.6, 0], eye: 0.5, mouth: 1.1, sway: 0.6 }), [0, -11.4])],
        [0.5, P({ spine: 30, chest: 22, neck: 26, head: 12 }, stand({ hF: [3.6, 9.4], hB: [2.6, 9.6], fF: [2.8, 0], fB: [-2.6, 0], eye: 0.35, mouth: 1.2, sway: -0.6 }), [0.3, -11.2])],
        [1, P({ spine: 28, chest: 20, neck: 20, head: 6 }, stand({ hF: [3.0, 9.2], hB: [2.0, 9.6], fF: [2.8, 0], fB: [-2.6, 0], eye: 0.5, mouth: 1.1, sway: 0.6 }), [0, -11.4])],
      ],
    };
    // morte: os joelhos cedem e tomba para a frente
    R.death = {
      n: 7, fps: 10,
      keys: [
        [0, P({ spine: -14, chest: -12, neck: -12, head: 6 }, stand({ hF: [-2, 7], hB: [-3, 7], eye: 2.2, mouth: 1.3 }), [-0.6, -12.4])],
        [0.35, P({ spine: 30, chest: 20, neck: 16, head: 10 }, stand({ hF: [4, 9], hB: [3, 9], fF: [3.4, 0], fB: [-1.4, 0], eye: 0.9, mouth: 1 }), [0.6, -7.6])],
        [0.7, P({ spine: 60, chest: 20, neck: 14, head: 12 }, stand({ hF: [6, 6], hB: [5, 7], fF: [3.4, 0], fB: [-1.0, 0], eye: 0.3, mouth: 0.8 }), [1.0, -6.0])],
        [1, P({ spine: 84, chest: 8, neck: 6, head: 6 }, stand({ hF: [8, 2.4], hB: [7.4, 3.4], haF: 10, fF: [3.8, 0], fB: [-1.6, 0], eye: 0, mouth: 0.6 }), [1.2, -4.2])],
      ],
    };
    return R;
  }
  A.register('en_husk', () => A.creature({ name: 'en_husk', S, box: [44, 44], anchor: [20, 41], rig, solve, draw, points, anims: anims(), post: K.post('#a39ab8', 0.3, 0.045) }));
  (A.previewCell = A.previewCell || {}).en_husk = [40, 40];
})(window.ART);
