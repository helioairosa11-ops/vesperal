// Vesperal — O Eco de Seraphine (chefe secreto, final 3): a rainha feita de luz. Mulher esguia de vestido luminoso
// que se desfaz em faixas de luz (sem pés), cabelo comprido a flutuar, véu, coroa de seis chamas pequenas (as seis
// brasas) e um halo atrás da cabeça. Só a luz devolvida com parry a fere; quando se apaga (x.dim) fica cinzenta,
// encolhida e de coroa apagada — é a janela para lhe bater. Âncora ao centro (voa). ×1.75 → assets/sprites/en_b_seraphine.png
'use strict';
(function (A) {
  const S = 5, K = A.kit(S), D2R = A.D2R;
  const H = A.humanoid({ pelvis: 2.4, spine: 6.0, chest: 5.4, neck: 2.2, head: 4.4, thigh: 8.0, shin: 7.6, foot: 2.6, uarm: 6.4, farm: 6.0, hand: 2.0, shoulder: 0.8 });
  const rig = H.rig;
  const LIT = {
    gown: A.mat('#f4e8cc', { shadow: '#c8b088', light: '#ffffff', deep: '#8a7450' }),
    skin: A.mat('#f8eee0', { shadow: '#d0bca4', light: '#ffffff', deep: '#8a7462' }),
    hair: A.mat('#f0d890', { shadow: '#c09a50', light: '#fff4c8' }),
    gold: A.mat('#e8c870', { shadow: '#a88a3a', light: '#fff4c0' }),
    veil: A.mat('#fff8ea', { shadow: '#d8c8a8', light: '#ffffff' }),
    glow: '#fff0c0', flame: '#ffd070',
  };
  const DIM = {
    gown: A.mat('#7a8096', { shadow: '#4a4e62', light: '#a8aec2', deep: '#262a38' }),
    skin: A.mat('#9aa0b2', { shadow: '#646a7e', light: '#c4c8d6', deep: '#2a2e3c' }),
    hair: A.mat('#6a7088', { shadow: '#3e4256', light: '#9096ae' }),
    gold: A.mat('#7a7462', { shadow: '#4a4638', light: '#a8a28c' }),
    veil: A.mat('#8a90a4', { shadow: '#5a6074', light: '#b8bccc' }),
    glow: '#8890b8', flame: '#3a3a48',
  };
  const BACK = 0.75;
  const pt = (B, t, w) => { const [x, y] = K.along(B, t), [nx, ny] = K.perp(B); return [x + nx * w, y + ny * w]; };
  const mats = (x) => (x.dim > 0.5 ? DIM : LIT);

  function solve(pose) {
    const x = pose.extra;
    const W = rig.solve(pose);
    H.arm(pose, 'F', [W.uarmF.x + x.hF[0], W.uarmF.y + x.hF[1]], x.haF || 0, x.bF || 1);
    H.arm(pose, 'B', [W.uarmB.x + x.hB[0], W.uarmB.y + x.hB[1]], x.haB || 0, x.bB || 1);
  }
  function halo(ctx, W, x) {
    const M = mats(x), Hd = W.head, c = K.along(Hd, 0.5), r = 6.4 + (x.flare || 0) * 0.6;
    ctx.save(); ctx.globalAlpha = x.dim > 0.5 ? 0.25 : 0.85;
    ctx.lineWidth = S * 0.5; ctx.strokeStyle = M.gold.light; ctx.beginPath(); ctx.arc((c[0] - 1.6) * S, c[1] * S, r * S, 0, A.TAU); ctx.stroke();
    ctx.lineWidth = S * 0.18; ctx.strokeStyle = M.gold.base; ctx.beginPath(); ctx.arc((c[0] - 1.6) * S, c[1] * S, (r - 0.9) * S, 0, A.TAU); ctx.stroke();
    for (let i = 0; i < 12; i++) { const a = i / 12 * A.TAU; K.line(ctx, [[c[0] - 1.6 + Math.cos(a) * (r + 0.4), c[1] + Math.sin(a) * (r + 0.4)], [c[0] - 1.6 + Math.cos(a) * (r + 1.6), c[1] + Math.sin(a) * (r + 1.6)]], 0.16, M.gold.light); }
    ctx.restore();
  }
  // vestido de luz: corpete e saia comprida que se desfaz em faixas
  function gown(ctx, W, x) {
    const M = mats(x), Pv = W.pelvis, C = W.chest, sw = x.sway || 0, fl = x.flare || 0;
    const [px, py] = K.along(Pv, 0.2), hemY = py + 14 + fl * 1.6;
    const sk = A.path((q) => {
      const a = pt(W.spine, 0.2, -3.0), b = pt(W.spine, 0.2, 3.2);
      q.M(a[0], a[1]); q.L(b[0], b[1]); q.Q(px + 6.0 + fl * 2, py + 6, px + 7.2 + sw * 1.2 + fl * 3, hemY - 2);
      for (let i = 0; i < 8; i++) { const k = (i + 1) / 8; q.L(A.lerp(px + 7.2 + sw * 1.2 + fl * 3, px - 6.6 + sw * 1.6 - fl * 3, k), hemY + (i % 2 ? -3.4 : 1.2) + Math.sin(k * 9 + sw * 2) * 0.8); }
      q.Q(px - 6.0 - fl * 2, py + 6, a[0], a[1]); q.Z();
    }, S);
    K.paint(ctx, sk, M.gown, { depth: S * 0.9, hlw: S * 0.4 });
    // a saia dissolve-se: degradê para transparente em baixo
    ctx.save(); ctx.globalCompositeOperation = 'destination-out';
    const g = ctx.createLinearGradient(0, (py + 6) * S, 0, (hemY + 1.5) * S); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.85)');
    ctx.fillStyle = g; ctx.fill(sk); ctx.restore();
    ctx.save(); ctx.clip(sk); for (const k of [-3.6, -1.2, 1.2, 3.6]) K.line(ctx, [[px + k * 0.5, py + 1.6], [px + k * 1.5 + sw, hemY]], 0.3, A.rgba(M.gown.deep, 0.35)); ctx.restore();
    const body = H.torsoPath(W, [['spine', 0.15, 2.8, 2.8], ['spine', 0.75, 2.3, 2.4], ['chest', 0.45, 2.8, 2.8], ['chest', 0.95, 2.3, 2.5], ['chest', 1.05, 1.7, 2.0]], S);
    K.paint(ctx, body, M.gown, { depth: S * 0.6, hlw: S * 0.3 });
    // cinto de ouro e decote
    K.line(ctx, [pt(W.spine, 0.25, -2.8), pt(W.spine, 0.25, 3.0)], 0.5, M.gold.base);
    K.line(ctx, [pt(C, 0.95, 0.2), pt(C, 0.75, 1.6), pt(C, 0.95, 2.4)], 0.22, M.gold.base);
  }
  function veilBack(ctx, W, x) {
    const M = mats(x), Hd = W.head, sw = x.sway || 0, fl = x.flare || 0, top = K.along(Hd, 0.9), sh = pt(W.chest, 0.6, -3.6);
    const p = A.path((q) => { q.M(top[0] + 1, top[1]); q.Q(top[0] - 6 - fl, top[1] + 4, sh[0] - 7 + sw * 1.4 - fl * 2, sh[1] + 10); q.L(sh[0] - 3 + sw, sh[1] + 12); q.Q(sh[0] - 2, sh[1] + 2, top[0] - 1, top[1] + 4); q.Z(); }, S);
    ctx.save(); ctx.globalAlpha = 0.6; K.paint(ctx, p, M.veil, { depth: S * 0.3, hl: false, ink: false }); ctx.restore();
  }
  function arm(ctx, W, side, back, x) {
    const M = mats(x), U = W['uarm' + side], F = W['farm' + side], Hd = W['hand' + side];
    const dm = (m) => (back ? K.dim(m, BACK) : m);
    K.limb(ctx, [U.x, U.y], [F.x, F.y], [F.ex, F.ey], 1.2, 1.0, 0.85, dm(M.skin), { depth: S * 0.35 });
    // manga de véu a cair do braço
    const p1 = [U.x, U.y], p2 = [F.x, F.y];
    ctx.save(); ctx.globalAlpha = 0.55; K.tube(ctx, [p1, p2, [p2[0] - 1.0, p2[1] + 3.6]], [1.6, 2.2, 0.6], dm(M.veil), { depth: 0, ink: false, hl: false }); ctx.restore();
    ctx.save(); A.boneT(ctx, Hd, S);
    K.blob(ctx, [[-0.3, -0.7], [1.2, -0.75], [2.0, -0.1], [1.4, 0.6], [-0.3, 0.6]], dm(M.skin), { depth: S * 0.2 });
    ctx.restore();
  }
  function head(ctx, W, x) {
    const M = mats(x), Hd = W.head, sw = x.sway || 0, fl = x.flare || 0;
    ctx.save(); A.boneT(ctx, Hd, S); ctx.rotate(Math.PI / 2);
    // cabelo comprido a flutuar para trás (para cima, como debaixo de água)
    const hb = A.path((q) => { q.M(1.0, -4.4); q.Q(-3.6, -5.6 - fl, -6.6 + sw, -3.4 - fl * 1.4); q.Q(-8.4 + sw * 1.4, -0.8, -7.2 + sw * 1.8, 2.8); q.Q(-4.4, 0.4, -1.4, 1.0); q.Z(); }, S);
    K.paint(ctx, hb, M.hair, { depth: S * 0.4, hlw: S * 0.2 });
    ctx.save(); ctx.clip(hb); for (let i = 0; i < 5; i++) K.line(ctx, [[0, -4 + i * 0.6], [-7 + sw + i * 0.3, -2.6 + i * 1.2]], 0.14, A.rgba(M.hair.shadow, 0.7)); ctx.restore();
    const face = K.blob(ctx, [[-1.4, 0.8], [-1.6, -2.4], [-0.6, -4.1], [1.2, -4.3], [2.3, -3.4], [2.5, -2.3], [3.0, -1.4], [2.5, -1.0], [2.5, -0.2], [2.0, 0.8], [0.6, 1.4]], M.skin, { depth: S * 0.4, hlw: S * 0.25, light: [0.6, -1] });
    void face;
    // olhos de luz (apagados quando se escurece), boca triste
    const ek = x.dim > 0.5 ? 0.15 : (x.eye === undefined ? 1 : x.eye);
    K.line(ctx, [[1.5, -2.5], [2.4, -2.5]], 0.14, M.skin.deep);
    K.ember(ctx, 1.95, -2.3, 0.28, ek, x.dim > 0.5 ? '#a0a8c8' : '#fff4d0');
    K.line(ctx, [[1.7, -0.2], [2.3, -0.1 - (x.mouth || 0) * 0.2]], 0.12 + (x.mouth || 0) * 0.1, M.skin.deep);
    // madeixa por cima da testa
    K.blob(ctx, [[-1.8, -1.0], [-1.6, -3.8], [0.0, -4.9], [2.2, -4.4], [1.0, -3.8], [-0.4, -2.6]], M.hair, { depth: S * 0.25 });
    // coroa de seis chamas pequenas
    for (let i = 0; i < 6; i++) {
      const bx = -1.2 + i * 0.75, by = -4.6 - Math.sin(i / 5 * Math.PI) * 0.5;
      K.poly(ctx, [[bx - 0.32, by + 0.2], [bx + 0.32, by + 0.2], [bx + 0.2, by - 0.4], [bx - 0.2, by - 0.4]], M.gold, { depth: 0 });
      if (x.dim > 0.5) K.dot(ctx, bx, by - 0.6, 0.16, '#2a2a34');
      else { const h = 1.2 + (i % 2) * 0.3 + Math.sin((x.ph || 0) + i) * 0.2; const fp = A.path((q) => { q.M(bx - 0.28, by - 0.4); q.Q(bx - 0.34, by - 0.4 - h * 0.5, bx, by - 0.4 - h); q.Q(bx + 0.34, by - 0.4 - h * 0.5, bx + 0.28, by - 0.4); q.Z(); }, S); ctx.fillStyle = M.flame; ctx.fill(fp); }
    }
    ctx.restore();
  }
  function draw(ctx, W, x) {
    halo(ctx, W, x);
    veilBack(ctx, W, x);
    arm(ctx, W, 'B', true, x);
    gown(ctx, W, x);
    head(ctx, W, x);
    arm(ctx, W, 'F', false, x);
  }
  function overlay(ctx, W, x) {
    if (x.dim > 0.5) return;
    const C = W.chest, k = 1 + (x.flare || 0) * 0.4;
    A.glow(ctx, C.x * S, C.y * S, 14 * S * k, '#fff0c0', 0.22 + (x.light || 0) * 0.2);
    const Hd = W.handF; A.glow(ctx, Hd.ex * S, Hd.ey * S, 3 * S, '#ffffff', 0.25 + (x.light || 0) * 0.4);
  }
  function points(W, x) {
    const Hh = W.head, ca = Math.cos(Hh.a * D2R), sa = Math.sin(Hh.a * D2R), Hd = W.handF;
    return { tip: [Hd.ex, Hd.ey], hand: [Hd.ex, Hd.ey], light: [W.chest.x, W.chest.y], eye: [Hh.x + ca * 2.3 - sa * 1.95, Hh.y + sa * 2.3 + ca * 1.95] };
  }

  const STANCE = { pelvis: 0, spine: 0, chest: -2, neck: 6, head: -6 };
  const RY = 7.0;
  const P = (a, x, root) => A.pose(A.addA(STANCE, a || {}), x, root || [0, RY]);
  const base = (o = {}) => Object.assign({ hF: [3.4, 6.6], haF: -40, hB: [-1.6, 6.8], haB: 100, sway: 0, flare: 0, light: 0, eye: 1, mouth: 0, dim: 0, ph: 0 }, o);
  function anims() {
    const R = {};
    R.idle = { n: 8, fps: 6, loop: true, poseFn: (t) => { const s = Math.sin(t * A.TAU), c = Math.cos(t * A.TAU); return P({ spine: s * 1.2, head: -s * 2 }, base({ sway: c * 0.8, hF: [3.4, 6.6 + s * 0.4], ph: t * A.TAU }), [0, RY - s * 0.8]); } };
    R.move = { n: 8, fps: 8, loop: true, poseFn: (t) => { const s = Math.sin(t * A.TAU), c = Math.cos(t * A.TAU); return P({ spine: 12, chest: 4 }, base({ sway: -1.6 + c * 0.5, flare: 0.4, hB: [-4.4, 4.4], haB: 150, ph: t * A.TAU }), [0.4, RY - s * 0.6]); } };
    // EXPLOSÃO de luz: abre os braços e atira a cabeça para trás
    const BU = P({ spine: -10, chest: -10, neck: -6, head: -18 }, base({ hF: [7.6, -2.4], haF: -40, hB: [-6.6, -2.0], haB: -140, flare: 2.4, light: 1.4, mouth: 0.8 }), [0, RY - 1]);
    R.atk_burst = { n: 8, fps: 10, phases: [4, 1], keys: [[0, P({}, base())], [0.3, P({ spine: 8, chest: 10, head: 6 }, base({ hF: [2.0, 4.0], hB: [1.4, 4.0], haB: -60, light: 0.6 }))], [0.5, BU], [0.75, BU], [1, P({}, base())]] };
    // LANÇA: aponta o braço da frente e dispara três raios
    const LA = P({ spine: 6, chest: 4, head: -10 }, base({ hF: [9.6, 1.4], haF: -4, hB: [-3.6, 5.0], haB: 140, light: 1.2, sway: 0.6 }), [0.6, RY]);
    R.atk_lance = { n: 8, fps: 10, phases: [3, 3], keys: [[0, P({}, base())], [0.3, P({ spine: -4 }, base({ hF: [2.0, 2.6], haF: -60, light: 0.6 }))], [0.45, LA], [0.85, LA], [1, P({}, base())]] };
    // ABRAÇO (vermelho): estende os dois braços e lança-se
    const EM = P({ spine: 24, chest: 10, neck: -4, head: -14 }, base({ hF: [9.0, 3.6], haF: 10, hB: [8.0, 4.6], haB: 10, flare: -0.6, sway: -2, light: 0.8, mouth: 1 }), [1.6, RY]);
    R.atk_embrace = { n: 8, fps: 10, phases: [4, 3], keys: [[0, P({}, base())], [0.35, P({ spine: -8, chest: -6 }, base({ hF: [2.6, 1.4], hB: [1.4, 1.6], haB: -40, flare: 1 }))], [0.5, EM], [0.85, EM], [1, P({}, base())]] };
    // FEIXES: ergue os dois braços ao céu
    const BE = P({ spine: -6, chest: -6, neck: -8, head: -20 }, base({ hF: [2.4, -10.0], haF: -90, hB: [0.4, -10.0], haB: -90, light: 1.6, flare: 1, mouth: 0.6 }), [0, RY - 1.4]);
    R.atk_beams = { n: 8, fps: 8, phases: [2, 5], keys: [[0, P({}, base())], [0.25, BE], [0.85, BE], [1, P({}, base())]] };
    // APAGADA (janela para lhe bater): encolhida, cinzenta, de coroa apagada
    R.dim = { n: 6, fps: 5, loop: true, poseFn: (t) => { const s = Math.sin(t * A.TAU); return P({ spine: 30 + s * 2, chest: 20, neck: 16, head: 10 }, base({ dim: 1, hF: [2.6, 5.0], haF: -120, hB: [2.0, 4.4], haB: -100, flare: -0.8, sway: s * 0.4, eye: 0.2 }), [0, RY + 3]); } };
    R.hurt = { n: 3, fps: 12, keys: [[0, P({ spine: -14, chest: -10, neck: -8, head: -12 }, base({ hF: [3.0, 4.0], mouth: 1, sway: -1.4, light: 1 }), [-1.2, RY])], [1, P({}, base())]] };
    R.stagger = R.dim;
    R.death = { n: 10, fps: 6, keys: [
      [0, P({ spine: -16, chest: -12, neck: -8, head: -20 }, base({ hF: [6.0, -4.0], hB: [-5.0, -4.0], haB: -140, mouth: 1, light: 1.8, flare: 2 }), [0, RY - 1])],
      [0.5, P({ spine: 20, chest: 14, neck: 12, head: 8 }, base({ hF: [3.6, 6.0], hB: [2.4, 6.0], haB: -60, light: 0.6, flare: 0.4, eye: 0.6 }), [0, RY + 2])],
      [1, P({ spine: 34, chest: 22, neck: 18, head: 14 }, base({ hF: [2.4, 4.6], haF: -120, hB: [2.0, 4.0], haB: -100, light: 0, flare: -1, eye: 0, mouth: 0 }), [0, RY + 6])]] };
    return R;
  }
  A.register('en_b_seraphine', () => A.creature({ name: 'en_b_seraphine', S, unit: 1.75, box: [104, 96], anchor: [50, 54], rig, solve, draw, overlay, points, anims: anims(), post: K.post('#fff4d0', 0.4, 0.025) }));
  (A.previewCell = A.previewCell || {}).en_b_seraphine = [120, 120];
})(window.ART);
