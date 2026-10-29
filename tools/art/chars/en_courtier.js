// Vesperal — Cortesão (courtier): fantasma de nobre da corte, gola de folhos engomada, gibão de mangas tufadas,
// barbicha e chapéu de pluma; das ancas para baixo desfaz-se em névoa. O leque de varetas de aço fecha-se
// e vira estilete. Aparece nas costas, ataca e volta a sumir. → assets/sprites/en_courtier.png
'use strict';
(function (A) {
  const S = 4, K = A.kit(S), D2R = A.D2R;
  const H = A.humanoid({ spine: 4.8, chest: 4.6, neck: 1.4, head: 4.2, thigh: 6.4, shin: 6.4, foot: 2.6, uarm: 4.8, farm: 4.6, hand: 1.6 });
  const rig = H.rig;
  const M = {
    silk: A.mat('#4c4f86', { shadow: '#2b2c55', light: '#7f86c4', deep: '#151633' }),
    puff: A.mat('#6c5a9a', { shadow: '#3e3262', light: '#a493d0' }),
    ruff: A.mat('#dfe0f0', { shadow: '#9a9cc0', light: '#ffffff' }),
    skin: A.mat('#b9bfd8', { shadow: '#7680a8', light: '#e8ecff', deep: '#3a4068' }),
    gold: A.mat('#b0a070', { shadow: '#6e6440', light: '#eadca8' }),
    hat: A.mat('#24233c', { shadow: '#121120', light: '#454468' }),
    mist: '#8c94d8',
  };
  const BACK = 0.62;

  function solve(pose) {
    const x = pose.extra;
    const W = rig.solve(pose);
    if (x.hF) H.arm(pose, 'F', [W.uarmF.x + x.hF[0], W.uarmF.y + x.hF[1]], x.haF === undefined ? 0 : x.haF, x.bF || 1);
    if (x.hB) H.arm(pose, 'B', [W.uarmB.x + x.hB[0], W.uarmB.y + x.hB[1]], x.haB === undefined ? 60 : x.haB, x.bB || 1);
  }
  // cauda de névoa no lugar das pernas
  function mistTail(ctx, W, x) {
    const P = W.pelvis, sw = x.sway || 0, ph = x.ph || 0;
    const pts = [], ws = [2.6, 2.4, 1.9, 1.4, 0.9, 0.45];
    for (let i = 0; i < 6; i++) { const k = i / 5; pts.push([P.x - k * 4.2 + Math.sin(ph + k * 4) * 1.0 * k + sw * k * 2, P.y + 1 + k * 10.5]); }
    const path = K.tubePath(pts, ws);
    ctx.save();
    const g = ctx.createLinearGradient(0, P.y * S, 0, (P.y + 11) * S);
    g.addColorStop(0, A.rgba(M.silk.base, 1)); g.addColorStop(0.45, A.rgba(M.mist, 0.75)); g.addColorStop(1, A.rgba(M.mist, 0));
    ctx.fillStyle = g; ctx.fill(path);
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 3; i++) K.line(ctx, [pts[0], pts[2].map((v, j) => v + (j ? 0 : (i - 1) * 0.7)), pts[4].map((v, j) => v + (j ? 0 : (i - 1) * 1.2 + sw))], 0.18, A.rgba('#c8d0ff', 0.35));
    ctx.restore();
  }
  // gibão escuro de seda, calções tufados (desvanecem), botões de ouro
  function torso(ctx, W, x) {
    const path = H.torsoPath(W, [['pelvis', 0.3, 2.9, 2.8], ['spine', 0.1, 2.2, 2.2], ['spine', 0.7, 2.4, 2.4], ['chest', 0.5, 2.8, 2.7], ['chest', 1, 2.2, 2.5]], S);
    K.paint(ctx, path, M.silk, { depth: S * 0.9, hlw: S * 0.4 });
    const Sp = W.spine, C = W.chest, [nx, ny] = K.perp(Sp);
    ctx.save(); ctx.clip(path);
    // peito acolchoado (ponta em bico, à moda espanhola) e faixas de passamanaria
    const [ax, ay] = K.along(C, 0.95), [bx, by] = K.along(Sp, 0.05);
    for (const o of [1.0, 1.8]) K.line(ctx, [[ax + nx * o, ay + ny * o], [bx + nx * (o + 0.3) + 0.6, by + ny * (o + 0.3) + 1.2]], 0.2, M.gold.shadow);
    for (let i = 0; i < 5; i++) { const t = i / 5; K.dot(ctx, A.lerp(ax, bx, t) + nx * 2.3, A.lerp(ay, by, t) + ny * 2.3, 0.2, M.gold.light); }
    ctx.restore();
    // calções tufados (a desfazer-se na névoa)
    const P = W.pelvis, [px, py] = K.along(P, 0.2);
    const hose = K.blobPath([[px - 2.8, py - 0.4], [px + 2.6, py - 0.4], [px + 3.2, py + 2.2], [px + 1.4, py + 3.6], [px - 1.6, py + 3.4], [px - 3.2, py + 2.0]]);
    K.paint(ctx, hose, M.puff, { depth: S * 0.6, hlw: S * 0.3 });
    ctx.save(); ctx.clip(hose); for (let i = 0; i < 4; i++) K.line(ctx, [[px - 2.2 + i * 1.5, py], [px - 2.0 + i * 1.4, py + 3.6]], 0.3, A.rgba(M.puff.deep || '#2a2040', 0.6)); ctx.restore();
  }
  function arm(ctx, W, side, back) {
    const U = W['uarm' + side], F = W['farm' + side], Hd = W['hand' + side];
    const ms = back ? K.dim(M.silk, BACK) : M.silk, mp = back ? K.dim(M.puff, BACK) : M.puff;
    K.limb(ctx, [U.x, U.y], [F.x, F.y], [F.ex, F.ey], 0.9, 0.75, 0.65, ms, { depth: S * 0.45 });
    // manga tufada no ombro
    const [mx, my] = K.along(U, 0.25), [nx, ny] = K.perp(U);
    const puff = K.blobPath([[mx - 1.6, my - 1.0], [mx + 1.2, my - 1.4], [mx + nx * 1.9 + 0.8, my + ny * 1.9 + 0.8], [mx - nx * 1.9 + 0.6, my - ny * 1.9 + 1.4], [mx - 1.4, my + 1.4]]);
    K.paint(ctx, puff, mp, { depth: S * 0.5, hlw: S * 0.25 });
    ctx.save(); ctx.clip(puff); for (let i = -1; i <= 1; i++) K.line(ctx, [[mx + i * 0.8 - 1, my - 1.2], [mx + i * 0.8 + 0.4, my + 1.4]], 0.26, A.rgba('#1a1430', 0.55)); ctx.restore();
    // punho de renda e mão
    const cx = F.ex, cy = F.ey, [fnx, fny] = K.perp(F);
    const cuff = K.blobPath([[cx - 0.6 + fnx * 1.1, cy + fny * 1.1], [cx + 0.6 + fnx * 1.4, cy + fny * 1.4], [cx + 0.6 - fnx * 1.4, cy - fny * 1.4], [cx - 0.6 - fnx * 1.1, cy - fny * 1.1]]);
    K.paint(ctx, cuff, back ? K.dim(M.ruff, BACK) : M.ruff, { depth: S * 0.2 });
    ctx.save(); A.boneT(ctx, Hd, S);
    K.blob(ctx, [[-0.2, -0.65], [1.1, -0.6], [1.6, 0], [1.1, 0.6], [-0.2, 0.55]], back ? K.dim(M.skin, BACK) : M.skin, { depth: S * 0.25 });
    ctx.restore();
  }
  // leque de varetas de aço: aberto (abana) ou fechado em estilete; x.fan 0..1 = abertura
  function fan(ctx, W, x) {
    const Hd = W.handF, open = x.fan === undefined ? 1 : x.fan;
    ctx.save(); A.boneT(ctx, Hd, S); ctx.translate(1.0 * S, 0);
    const spread = open * 110, n = 7, len = 5.2;
    const a0 = (x.fanA === undefined ? -20 : x.fanA) - spread / 2;
    if (open > 0.15) {
      const leaf = A.path((q) => {
        for (let i = 0; i <= n; i++) { const a = (a0 + spread * i / n) * D2R; const p = [Math.cos(a) * len, Math.sin(a) * len]; if (!i) { q.M(Math.cos(a) * 1.4, Math.sin(a) * 1.4); q.L(p[0], p[1]); } else q.Q(Math.cos(a - spread / n / 2 * D2R) * len * 1.06, Math.sin(a - spread / n / 2 * D2R) * len * 1.06, p[0], p[1]); }
        const ae = (a0 + spread) * D2R; q.L(Math.cos(ae) * 1.4, Math.sin(ae) * 1.4); q.Z();
      }, S);
      K.paint(ctx, leaf, A.mat('#2e2a48', { shadow: '#1a1830', light: '#5a5480' }), { depth: S * 0.3, hlw: S * 0.15 });
      ctx.save(); ctx.clip(leaf);
      for (let i = 0; i <= n; i++) { const a = (a0 + spread * i / n) * D2R; K.line(ctx, [[0, 0], [Math.cos(a) * len, Math.sin(a) * len]], 0.12, A.rgba('#c8ccf0', 0.55)); }
      K.line(ctx, [[Math.cos((a0 + spread * 0.2) * D2R) * 3.6, Math.sin((a0 + spread * 0.2) * D2R) * 3.6], [Math.cos((a0 + spread * 0.8) * D2R) * 3.6, Math.sin((a0 + spread * 0.8) * D2R) * 3.6]], 0.2, A.rgba(M.gold.base, 0.8));
      ctx.restore();
    }
    // varetas exteriores de aço (fechado = lâmina)
    const ac = (a0 + spread) * D2R, L2 = len + (1 - open) * 1.6;
    K.tube(ctx, [[0, 0], [Math.cos(ac) * L2, Math.sin(ac) * L2]], [0.36, 0.12], A.mat('#9ea4bc', { shadow: '#5a5e76', light: '#eef0ff' }), { depth: S * 0.15, hlw: S * 0.1 });
    K.dot(ctx, 0, 0, 0.35, M.gold.base);
    ctx.restore();
  }
  // cabeça: rosto pálido de olhos vazios, bigode e barbicha, gola de folhos, chapéu de copa com pluma
  function head(ctx, W, x) {
    const Hd = W.head, C = W.chest;
    ctx.save(); A.boneT(ctx, Hd, S); ctx.rotate(Math.PI / 2);
    const face = K.blob(ctx, [[-1.5, -0.5], [-1.5, -2.6], [-0.4, -3.7], [1.2, -3.6], [1.9, -2.7], [2.0, -1.9], [2.6, -0.9], [2.0, -0.8], [2.0, 0.1], [1.7, 1.2], [1.0, 2.0], [0.1, 1.6], [-0.6, 0.6]], M.skin, { depth: S * 0.55, hlw: S * 0.3, light: [0.6, -1] });
    ctx.save(); ctx.clip(face); K.line(ctx, [[0.4, -0.6], [1.3, 0.4]], 0.35, A.rgba(M.skin.deep, 0.5)); K.line(ctx, [[0.9, -2.6], [1.9, -2.4]], 0.3, A.rgba(M.skin.deep, 0.45)); ctx.restore();
    // olho vazio (luz fria)
    const eo = K.blobPath([[1.0, -2.1], [1.9, -2.15], [1.95, -1.6], [1.2, -1.45]]);
    ctx.fillStyle = '#0c0d1e'; ctx.fill(eo);
    K.ember(ctx, 1.5, -1.8, 0.26, x.eye === undefined ? 0.9 : x.eye, '#b8c4ff');
    // bigode retorcido e barbicha em bico
    K.line(ctx, [[2.3, -0.45], [1.6, -0.15], [0.9, -0.55]], 0.26, '#2a2c48');
    const goatee = K.blobPath([[1.4, 0.7], [2.0, 0.8], [1.5, 2.6]]); ctx.fillStyle = '#2a2c48'; ctx.fill(goatee);
    // chapéu de copa alta com pluma
    const sw = x.sway || 0;
    const plume = A.path((q) => { q.M(-0.8, -4.4); q.Q(-3.6, -6.0 + sw * 0.3, -5.0 + sw, -2.8); q.Q(-3.4, -4.4, -0.4, -3.8); q.Z(); }, S);
    K.paint(ctx, plume, A.mat('#c8cce8', { shadow: '#7a80a8', light: '#ffffff' }), { depth: S * 0.3 });
    // gorra de veludo achatada, inclinada para trás, com cordão de ouro
    const hat = K.blobPath([[-2.6, -3.0], [-1.6, -4.4], [0.6, -4.9], [2.4, -4.2], [2.6, -3.5], [0.8, -3.3]]);
    K.paint(ctx, hat, M.hat, { depth: S * 0.35, hlw: S * 0.2 });
    K.line(ctx, [[-2.2, -3.3], [0.8, -3.5], [2.4, -3.7]], 0.28, M.gold.base);
    ctx.restore();
    // gola de folhos (lechuguilla) à volta do pescoço
    const [nx0, ny0] = K.along(W.neck, 0.1);
    ctx.save(); ctx.translate(nx0 * S, ny0 * S); ctx.rotate((C.a + 90) * D2R);
    const ruff = A.path((q) => { const n = 9; for (let i = 0; i <= n; i++) { const a = Math.PI + (i / n) * Math.PI, r = i % 2 ? 2.9 : 3.4; const p = [Math.cos(a) * r + 0.3, Math.sin(a) * r * 0.42 + 0.3]; i ? q.L(p[0], p[1]) : q.M(p[0], p[1]); } for (let i = 0; i <= 9; i++) { const a = (i / 9) * Math.PI, r = i % 2 ? 2.9 : 3.4; q.L(Math.cos(a) * r + 0.3, Math.sin(a) * r * 0.42 + 0.3); } q.Z(); }, S);
    K.paint(ctx, ruff, M.ruff, { depth: S * 0.35, hlw: S * 0.2 });
    ctx.save(); ctx.clip(ruff); for (let i = -5; i <= 5; i++) K.line(ctx, [[i * 0.7, -2.0], [i * 0.7 + 0.15, 1.6]], 0.13, A.rgba(M.ruff.shadow, 0.9)); ctx.restore();
    ctx.restore();
  }
  function draw(ctx, W, x) {
    mistTail(ctx, W, x);
    arm(ctx, W, 'B', true);
    torso(ctx, W, x);
    head(ctx, W, x);
    arm(ctx, W, 'F', false);
    fan(ctx, W, x);
  }
  // aura espectral (por cima do contorno)
  function overlay(ctx, W, x) {
    const C = W.chest;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    A.glow(ctx, C.x * S, C.y * S, 9 * S, '#7080e0', 0.18 * (x.aura === undefined ? 1 : x.aura));
    ctx.restore();
  }
  function points(W, x) {
    const Hd = W.handF, a = Hd.a * D2R;
    const Hh = W.head, ca = Math.cos(Hh.a * D2R), sa = Math.sin(Hh.a * D2R);
    return { tip: [Hd.ex + Math.cos(a) * 4.5, Hd.ey + Math.sin(a) * 4.5], eye: [Hh.x + ca * 1.8 - sa * 1.5, Hh.y + sa * 1.8 + ca * 1.5] };
  }

  const POSTURE = { pelvis: 0, spine: -6, chest: -4, neck: 4, head: -6 };
  const P = (a, x, root) => A.pose(A.addA(POSTURE, a || {}), x, root || [0, -12]);
  const base = (o = {}) => Object.assign({ hF: [3.4, 4.0], haF: -40, hB: [-1.4, 5.6], haB: 70, fan: 1, fanA: -50, sway: 0, ph: 0 }, o);
  function anims() {
    const R = {};
    // pairar a abanar-se, altivo
    R.idle = { n: 8, fps: 8, loop: true, poseFn: (t) => { const s = Math.sin(t * A.TAU); return P({ spine: s, head: -s * 2 }, base({ hF: [3.2, 3.6 + s * 0.6], haF: -40 + s * 18, fanA: -50 + s * 20, sway: s * 0.6, ph: t * A.TAU }), [0, -12 - Math.sin(t * A.TAU) * 0.6]); } };
    R.move = { n: 8, fps: 8, loop: true, poseFn: (t) => { const s = Math.sin(t * A.TAU); return P({ spine: 8, chest: 2, head: -4 }, base({ hF: [2.4, 4.6], haF: -60, fanA: -60, fan: 0.6, sway: -1 + s * 0.3, ph: t * A.TAU * 2 }), [0, -12 - s * 0.6]); } };
    // estocada: fecha o leque, recolhe-o junto ao peito e lança-o como um estilete
    const W0 = P({ spine: -12, chest: -6, head: -8 }, base({ hF: [-0.6, 2.8], haF: -10, fan: 0.1, fanA: -10, sway: 0.5 }), [-1, -12.2]);
    const A0 = P({ spine: 14, chest: 8, neck: -4 }, base({ hF: [8.2, 1.6], haF: 2, fan: 0, fanA: 0, sway: -1.4, hB: [-3.0, 3.4], aura: 1.6 }), [2.2, -11.6]);
    R.atk_stab = {
      n: 8, fps: 13, phases: [3, 2],
      keys: [[0, P({}, base())], [0.25, P({ spine: -6 }, base({ hF: [2.0, 3.0], fan: 0.4, fanA: -20 }))], [0.4, W0], [0.55, A0], [0.68, A0], [1, P({}, base({ fan: 0.5 }))]],
    };
    R.hurt = { n: 3, fps: 14, keys: [[0, P({ spine: -16, chest: -12, neck: -8, head: 8 }, base({ hF: [1.2, 5.6], haF: 40, fan: 0.4, sway: 1, aura: 1.8 }), [-1.2, -12.4])], [1, P({}, base())]] };
    R.stagger = { n: 4, fps: 7, loop: true, poseFn: (t) => { const s = Math.sin(t * A.TAU); return P({ spine: 20 + s * 3, chest: 14, neck: 16, head: 8 }, base({ hF: [2.4, 7.8], haF: 70, fan: 0.2, fanA: 40, sway: s, ph: t * A.TAU, eye: 0.4 }), [0.4, -11.4]); } };
    // dissipa-se: ergue-se e desfaz-se
    R.death = { n: 7, fps: 10, poseFn: (t, i) => { const k = i / 6; return P({ spine: -10 - k * 10, chest: -8, neck: -12, head: 6 }, base({ hF: [1 + k * 2, 2 - k * 4], haF: -60, fan: 0.3, sway: k * 2, ph: k * 6, eye: 1 - k, aura: 1 + k }), [0, -12 - k * 4]); } };
    return R;
  }
  A.register('en_courtier', () => A.creature({ name: 'en_courtier', S, box: [44, 46], anchor: [20, 38], rig, solve, draw, overlay, points, anims: anims(), post: K.post('#b8c0ff', 0.4, 0.03) }));
  (A.previewCell = A.previewCell || {}).en_courtier = [40, 40];
})(window.ART);
