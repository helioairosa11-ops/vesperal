// Vesperal — Archote Vivo (torch): criado do Paço que ardeu sem se consumir — libré carbonizada, peruca em
// chamas, um candelabro de três braços erguido como uma tocha. Corre para o intruso e rebenta em fogo.
// → assets/sprites/en_torch.png
'use strict';
(function (A) {
  const S = 4, K = A.kit(S), D2R = A.D2R;
  const H = A.humanoid({ spine: 4.4, chest: 4.4, neck: 1.2, head: 3.8, thigh: 6.0, shin: 6.0, foot: 2.6, uarm: 4.6, farm: 4.4, hand: 1.6 });
  const rig = H.rig;
  const M = {
    char: A.mat('#2e2624', { shadow: '#161210', light: '#4e403a', deep: '#0a0807' }),
    livery: A.mat('#4a1e1a', { shadow: '#2a100e', light: '#6e3028' }),
    brass: A.mat('#8a6a34', { shadow: '#4e3a1a', light: '#d8b468', deep: '#241808' }),
    wax: A.mat('#e0d4b0', { shadow: '#a0926e', light: '#f6eed8' }),
  };
  const BACK = 0.66;
  function solve(pose) {
    const x = pose.extra, r = pose.root;
    if (x.fF) H.leg(pose, 'F', [r[0] + x.fF[0], x.fF[1] - 0.85], x.faF || 0);
    if (x.fB) H.leg(pose, 'B', [r[0] + x.fB[0], x.fB[1] - 0.85], x.faB || 0);
    const W = rig.solve(pose);
    if (x.hF) H.arm(pose, 'F', [W.uarmF.x + x.hF[0], W.uarmF.y + x.hF[1]], x.haF === undefined ? -90 : x.haF, x.bF || 1);
    if (x.hB) H.arm(pose, 'B', [W.uarmB.x + x.hB[0], W.uarmB.y + x.hB[1]], x.haB === undefined ? 60 : x.haB, x.bB || 1);
  }
  const flames = [];
  // candelabro de três braços na mão de perto (as chamas vão na sobreposição)
  function candelabra(ctx, W, x) {
    const Hd = W.handF, g = [Hd.x + Math.cos(Hd.a * D2R) * 0.8, Hd.y + Math.sin(Hd.a * D2R) * 0.8];
    const tilt = (x.ctilt || 0) * D2R;
    ctx.save(); ctx.translate(g[0] * S, g[1] * S); ctx.rotate(tilt);
    K.tube(ctx, [[0, 1.6], [0, -4.4]], [0.35, 0.3], M.brass, { depth: S * 0.15, flat: true });
    for (const s of [-1, 1]) { A.stroke(ctx, [[0, -3.0], [s * 1.8, -3.4], [s * 2.6, -4.6]], S * 0.5, M.brass.shadow, S); A.stroke(ctx, [[0, -3.0], [s * 1.8, -3.4], [s * 2.6, -4.6]], S * 0.2, M.brass.light, S); }
    for (const cx of [-2.6, 0, 2.6]) { const cy = cx ? -4.6 : -4.4; K.poly(ctx, [[cx - 0.7, cy + 0.2], [cx + 0.7, cy + 0.2], [cx + 0.5, cy - 0.3], [cx - 0.5, cy - 0.3]], M.brass, { depth: S * 0.1 }); K.tube(ctx, [[cx, cy - 0.2], [cx, cy - 2.2]], [0.42, 0.38], M.wax, { depth: S * 0.15, flat: true }); }
    ctx.restore();
    const ca = Math.cos(tilt - Math.PI / 2), sa = Math.sin(tilt - Math.PI / 2), pa = [Math.cos(tilt), Math.sin(tilt)];
    for (const cx of [-2.6, 0, 2.6]) { const h = (cx ? 6.8 : 6.6); flames.push([g[0] + pa[0] * cx + ca * h, g[1] + pa[1] * cx + sa * h, 0.8]); }
  }
  function arm(ctx, W, side, back) {
    const U = W['uarm' + side], F = W['farm' + side], Hd = W['hand' + side];
    K.limb(ctx, [U.x, U.y], [F.x, F.y], [F.ex, F.ey], 1.0, 0.85, 0.7, back ? K.dim(M.livery, BACK) : M.livery, { depth: S * 0.4 });
    ctx.save(); A.boneT(ctx, Hd, S); K.blob(ctx, [[-0.3, -0.7], [1.0, -0.7], [1.5, 0], [1.0, 0.6], [-0.3, 0.6]], back ? K.dim(M.char, BACK) : M.char, { depth: S * 0.25 }); ctx.restore();
    flames.push([A.lerp(U.x, F.x, 0.5), A.lerp(U.y, F.y, 0.5) - 0.6, 0.5]);
  }
  function leg(ctx, W, side, back) {
    const T = W['thigh' + side], N = W['shin' + side], F = W['foot' + side];
    K.limb(ctx, [T.x, T.y], [N.x, N.y], [N.ex, N.ey], 1.3, 0.95, 0.7, back ? K.dim(M.char, BACK) : M.char, { depth: S * 0.45 });
    ctx.save(); A.boneT(ctx, F, S); K.blob(ctx, [[-0.8, -0.85], [1.3, -0.75], [2.7, -0.1], [2.6, 0.65], [-0.9, 0.7]], back ? K.dim(M.char, BACK) : M.char, { depth: S * 0.3 }); ctx.restore();
  }
  // libré de criado carbonizada (abas de casaca, botões de latão), brasas nas costuras
  function torso(ctx, W, x) {
    const path = H.torsoPath(W, [['pelvis', 0.3, 2.5, 2.4], ['spine', 0.1, 2.3, 2.3], ['spine', 0.7, 2.5, 2.4], ['chest', 0.5, 2.8, 2.6], ['chest', 1, 2.1, 2.4]], S);
    K.paint(ctx, path, M.livery, { depth: S * 0.8, hlw: S * 0.35 });
    ctx.save(); ctx.clip(path);
    const g = ctx.createLinearGradient(0, (W.pelvis.y - 2) * S, 0, (W.chest.ey) * S); g.addColorStop(0, 'rgba(10,6,4,0.75)'); g.addColorStop(1, 'rgba(10,6,4,0.1)'); ctx.fillStyle = g; ctx.fillRect((W.pelvis.x - 5) * S, (W.chest.ey - 2) * S, 10 * S, 16 * S);
    ctx.restore();
    const Sp = W.spine, [nx, ny] = K.perp(Sp);
    for (let i = 0; i < 4; i++) { const [bx, by] = K.along(i < 2 ? W.chest : Sp, i < 2 ? 0.7 - i * 0.35 : 0.9 - (i - 2) * 0.4); K.dot(ctx, bx + nx * 2.2, by + ny * 2.2, 0.22, M.brass.light); }
    // abas da casaca a esvoaçar para trás
    const [px, py] = K.along(W.pelvis, 0.2), sw = x.sway || 0;
    const tail = A.path((q) => { q.M(px - nx * 2.2, py - 1.0); q.Q(px - nx * 3.6 - 1 + sw, py + 2.6, px - nx * 4.4 - 2 + sw * 1.4, py + 5.6); q.L(px - nx * 1.4 + sw * 0.6, py + 4.6); q.Q(px - nx * 0.8, py + 2.0, px, py); q.Z(); }, S);
    K.paint(ctx, tail, M.livery, { depth: S * 0.4, hlw: S * 0.2 });
    flames.push([W.chest.x - nx * 1.6, W.chest.y - 0.8, 0.7], [px - nx * 2.8 - 1 + sw, py + 3.0, 0.5]);
  }
  // cabeça: cara negra de carvão com olhos a arder, peruca empoada que é uma fogueira
  function head(ctx, W, x) {
    const Hd = W.head;
    ctx.save(); A.boneT(ctx, Hd, S); ctx.rotate(Math.PI / 2);
    const face = K.blob(ctx, [[-1.6, 0.2], [-1.7, -2.2], [-0.4, -3.4], [1.2, -3.2], [2.0, -2.2], [2.4, -1.2], [2.0, -0.6], [2.0, 0.4], [1.4, 1.4], [0.2, 1.6], [-1.0, 1.0]], M.char, { depth: S * 0.5, hlw: S * 0.25, light: [0.6, -1] });
    ctx.save(); ctx.clip(face); for (const [a, b] of [[[0.2, -2.6], [0.8, -0.8]], [[1.2, 0.2], [1.8, 1.0]]]) K.line(ctx, [a, b], 0.16, A.rgba('#ff7a20', 0.55)); ctx.restore();
    const eo = K.blobPath([[0.9, -1.8], [1.8, -1.85], [1.85, -1.3], [1.0, -1.25]]); ctx.fillStyle = '#ff9a30'; ctx.fill(eo);
    // laço de rabicho da peruca
    K.blob(ctx, [[-2.2, -0.6], [-3.0, -1.0], [-3.2, 0.2], [-2.4, 0.4]], M.livery, { depth: S * 0.2 });
    ctx.restore();
    const ca = Math.cos(Hd.a * D2R), sa = Math.sin(Hd.a * D2R);
    flames.push([Hd.x + ca * 3.4, Hd.y + sa * 3.4, 1.5], [Hd.x + ca * 2.2 + sa * 1.4, Hd.y + sa * 2.2 - ca * 1.4, 1.0]);
  }
  function draw(ctx, W, x) {
    flames.length = 0;
    arm(ctx, W, 'B', true);
    leg(ctx, W, 'B', true);
    torso(ctx, W, x);
    leg(ctx, W, 'F', false);
    head(ctx, W, x);
    arm(ctx, W, 'F', false);
    candelabra(ctx, W, x);
    x._flames = flames.slice();
  }
  // chamas por cima de tudo (sem contorno): lágrimas animadas pela fase x.ph
  function overlay(ctx, W, x) {
    const k = x.fire === undefined ? 1 : x.fire, ph = x.ph || 0;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    (x._flames || []).forEach(([fx, fy, sz], i) => {
      const s = sz * k * (0.85 + 0.25 * Math.sin(ph * 3 + i * 1.7)), sw = Math.sin(ph * 2 + i) * 0.5 - (x.lean || 0) * 0.8;
      ctx.save(); ctx.translate(fx * S, fy * S);
      const shape = (h, w, a) => { ctx.fillStyle = a; ctx.beginPath(); ctx.moveTo(-w * S, 0); ctx.quadraticCurveTo(-w * 1.1 * S, -h * 0.55 * S, sw * S, -h * S); ctx.quadraticCurveTo(w * 1.1 * S, -h * 0.55 * S, w * S, 0); ctx.quadraticCurveTo(0, w * 0.8 * S, -w * S, 0); ctx.fill(); };
      shape(4.2 * s, 1.4 * s, 'rgba(255,100,30,0.7)'); shape(2.8 * s, 0.9 * s, 'rgba(255,190,80,0.85)'); shape(1.4 * s, 0.45 * s, 'rgba(255,248,220,0.9)');
      ctx.restore();
    });
    ctx.restore();
  }
  function points(W, x) { const Hh = W.head, ca = Math.cos(Hh.a * D2R), sa = Math.sin(Hh.a * D2R); const f = (x._flames || [])[0]; return { eye: [Hh.x + ca * 1.5 - sa * 1.4, Hh.y + sa * 1.5 + ca * 1.4], tip: f ? [f[0], f[1]] : [0, -24], light: f ? [f[0], f[1]] : [0, -24] }; }

  const STANCE = { pelvis: 0, spine: 6, chest: 4, neck: 0, head: -4 };
  const P = (a, x, root) => A.pose(A.addA(STANCE, a || {}), x, root || [0, -12.0]);
  const base = (o = {}) => Object.assign({ fF: [2.4, 0], fB: [-2.4, 0], hF: [1.6, -3.4], haF: -90, hB: [0.6, 6.0], sway: 0, ph: 0 }, o);
  function anims() {
    const R = {};
    R.idle = { n: 6, fps: 8, loop: true, poseFn: (t) => P({ spine: Math.sin(t * A.TAU) }, base({ ph: t * A.TAU, sway: Math.sin(t * A.TAU) * 0.4 })) };
    // corrida desatada com o candelabro erguido
    R.move = { n: 8, fps: 13, loop: true, stride: 18, poseFn: (t) => { const f = A.stepFeet(t, { stride: 4.4, lift: 2.6 }); const s = Math.sin(t * A.TAU), c = Math.cos(t * A.TAU); return P({ spine: 16, chest: 4, head: -6 }, base({ fF: f.F, fB: f.B, faF: f.F[1] < 0 ? 20 : 0, faB: f.B[1] < 0 ? 20 : 0, hF: [2.6, -3.0 + s * 0.6], hB: [-1.6 - c * 2, 5.0], ctilt: 14, sway: -1.6, lean: 1.2, ph: t * A.TAU * 2 }), [0.6, -11.6 + Math.abs(s) * 0.8]); } };
    // rebentar (vermelho): incha de fogo, ergue o candelabro e explode
    R.atk_burst = { n: 8, fps: 10, phases: [6, 1], poseFn: (t, i) => { const k = i / 6; return P({ spine: -6 * k, chest: -10 * k, neck: -6 * k, head: -10 * k }, base({ hF: [1.0, -5.6], haF: -90, hB: [-2.0 - k, 2.0 - k * 4], haB: -100, fire: 1 + k * 1.6, sway: (i % 2 ? 1 : -1) * 0.6, ph: i * 1.3 })); } };
    R.hurt = { n: 3, fps: 14, poseFn: (t, i) => P({ spine: [-14, -6, 0][i], chest: [-10, -4, 0][i] }, base({ fire: [0.6, 0.8, 1][i], ph: i })) };
    R.stagger = { n: 4, fps: 8, loop: true, poseFn: (t) => P({ spine: 20, chest: 14, neck: 14, head: 6 }, base({ hF: [2.6, 3.0], haF: -40, ctilt: 50, fire: 0.6, ph: t * A.TAU })) };
    R.death = { n: 7, fps: 10, poseFn: (t, i) => { const k = i / 6; return P({ spine: 6 + k * 70, chest: 4, neck: 6 }, base({ hF: [3 + k * 3, -2 + k * 8], haF: -90 + k * 80, fire: Math.max(0, 1.4 - k * 1.4), fF: [3.4, 0], fB: [-1.6, 0], ph: i }), [k, -12 + k * 7]); } };
    return R;
  }
  A.register('en_torch', () => A.creature({ name: 'en_torch', S, box: [48, 58], anchor: [22, 50], rig, solve, draw, overlay, points, anims: anims(), post: K.post('#ff9050', 0.35, 0.04) }));
  (A.previewCell = A.previewCell || {}).en_torch = [44, 54];
})(window.ART);
