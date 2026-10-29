// Vesperal — Escória (slag): poça viva de metal fundido com ossos a boiar (um crânio, costelas, um fémur),
// crosta escura a estalar por cima. Salta aos pulos; morta, parte-se em duas escórias pequenas. → assets/sprites/en_slag.png
'use strict';
(function (A) {
  const S = 4, K = A.kit(S);
  const M = {
    crust: A.mat('#3a3032', { shadow: '#1c1618', light: '#6a5a58', deep: '#0e0a0b' }),
    bone: A.mat('#cfc2a6', { shadow: '#857862', light: '#efe4cc' }),
  };
  const rig = new A.Rig([{ n: 'root', len: 1, a: -90 }]);
  // corpo: gota de metal (x.sx/x.sy = esticar/achatar, x.w = ondulação), crosta, ossos
  function shape(x) {
    const sx = x.sx || 1, sy = x.sy || 1, w = x.w || 0, cool = x.cool || 0;
    const pts = [];
    for (let i = 0; i < 14; i++) {
      const a = Math.PI + (i / 13) * Math.PI; // metade de cima
      const r = 1 + Math.sin(a * 3 + w) * 0.07 + Math.sin(a * 5 - w * 1.3) * 0.04;
      pts.push([Math.cos(a) * 8.5 * sx * r, Math.sin(a) * 6.6 * sy * r * (1 - cool * 0.35)]);
    }
    pts.push([8.6 * sx, 0.2], [5.5 * sx, 0.9], [0, 1.1], [-5.5 * sx, 0.9], [-8.6 * sx, 0.2]);
    return pts;
  }
  function draw(ctx, W, x) {
    const pts = shape(x), path = K.blobPath(pts);
    ctx.save();
    // metal incandescente por baixo
    const g = ctx.createLinearGradient(0, -7 * S, 0, 1 * S);
    const cool = x.cool || 0;
    g.addColorStop(0, A.mix('#c03810', '#3a2826', cool)); g.addColorStop(0.55, A.mix('#ff7a1e', '#4a3430', cool)); g.addColorStop(1, A.mix('#ffd060', '#5a403a', cool));
    ctx.fillStyle = g; ctx.fill(path);
    ctx.clip(path);
    // ossos a boiar (meio submersos)
    const bob = Math.sin((x.w || 0) * 1.3) * 0.4;
    ctx.save(); ctx.translate((2.8 * (x.sx || 1)) * S, (-3.2 * (x.sy || 1) + bob) * S); ctx.rotate(-0.25);
    const skull = K.blob(ctx, [[-1.6, 0.6], [-1.8, -0.9], [-0.6, -2.0], [1.0, -1.8], [1.8, -0.8], [1.9, 0.4], [1.2, 1.2], [-0.8, 1.3]], M.bone, { depth: S * 0.35, hlw: S * 0.2 });
    ctx.fillStyle = '#2a1206'; for (const ex of [-0.3, 1.0]) { ctx.beginPath(); ctx.ellipse(ex * S, -0.4 * S, 0.45 * S, 0.5 * S, 0, 0, A.TAU); ctx.fill(); }
    ctx.restore();
    ctx.save(); ctx.translate(-3.6 * (x.sx || 1) * S, (-2.4 * (x.sy || 1) - bob * 0.6) * S); ctx.rotate(0.5);
    for (let i = 0; i < 3; i++) { ctx.strokeStyle = M.bone.shadow; ctx.lineWidth = S * 0.42; ctx.beginPath(); ctx.arc(0, i * 0.9 * S, 2.0 * S, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke(); ctx.strokeStyle = M.bone.base; ctx.lineWidth = S * 0.2; ctx.stroke(); }
    ctx.restore();
    // crosta escura a flutuar em placas
    const r = A.rng(7);
    for (let i = 0; i < 6; i++) {
      const cx = (-6 + i * 2.4 + Math.sin((x.w || 0) + i) * 0.5) * (x.sx || 1), cy = (-5.4 + Math.abs(i - 2.5) * 0.6) * (x.sy || 1) + (r() - 0.5) * 0.6;
      const pl = K.polyPath([[cx - 1.1, cy - 0.3], [cx + 0.2, cy - 0.9], [cx + 1.3, cy - 0.2], [cx + 0.8, cy + 0.8], [cx - 0.9, cy + 0.7]]);
      K.paint(ctx, pl, M.crust, { depth: S * 0.25, hlw: S * 0.15, inkW: K.IW * 0.6 });
    }
    if (cool > 0) { ctx.fillStyle = A.rgba('#2a2022', cool * 0.85); ctx.fill(path); }
    ctx.restore();
    ctx.lineWidth = K.IW * 1.2; ctx.strokeStyle = K.INK; ctx.stroke(path);
    // fémur espetado para fora
    ctx.save(); ctx.translate(-1.0 * S, (-5.6 * (x.sy || 1)) * S); ctx.rotate(-0.9 + Math.sin(x.w || 0) * 0.06);
    K.tube(ctx, [[0, 0], [2.4, 0], [4.2, 0.1]], [0.45, 0.32, 0.42], M.bone, { depth: S * 0.25, hlw: S * 0.15 });
    ctx.restore();
  }
  // brilho do metal (sem contorno): núcleo e salpicos
  function overlay(ctx, W, x) {
    const cool = x.cool || 0; if (cool > 0.95) return;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    A.glow(ctx, 0, -2.4 * S * (x.sy || 1), 7 * S, '#ff7a20', 0.35 * (1 - cool));
    const r = A.rng(13 + Math.round((x.w || 0) * 3));
    for (let i = 0; i < 5; i++) { const px = (r() - 0.5) * 14 * (x.sx || 1), py = -r() * 5 * (x.sy || 1); ctx.fillStyle = A.rgba('#ffe090', 0.6 * (1 - cool)); ctx.beginPath(); ctx.arc(px * S, py * S, (0.25 + r() * 0.3) * S, 0, A.TAU); ctx.fill(); }
    ctx.restore();
  }
  function points(W, x) { return { eye: [2.8, -3.6 * (x.sy || 1)], tip: [8, -3] }; }

  const P = (x) => A.pose({}, x, [0, 0]);
  function anims() {
    const R = {};
    R.idle = { n: 6, fps: 8, loop: true, poseFn: (t) => P({ sx: 1 + Math.sin(t * A.TAU) * 0.04, sy: 1 - Math.sin(t * A.TAU) * 0.05, w: t * A.TAU }) };
    R.jump = { n: 2, fps: 10, poseFn: (t, i) => P({ sx: 0.8 - i * 0.06, sy: 1.3 + i * 0.08, w: 1 + i }) };
    R.fall = { n: 2, fps: 10, loop: true, poseFn: (t, i) => P({ sx: 0.94 + i * 0.03, sy: 1.08 - i * 0.03, w: 2 + i }) };
    R.land = { n: 4, fps: 16, poseFn: (t, i) => P({ sx: [1.35, 1.2, 0.95, 1.02][i], sy: [0.6, 0.78, 1.08, 0.98][i], w: 3 + i }) };
    R.hurt = { n: 3, fps: 14, poseFn: (t, i) => P({ sx: [1.25, 0.9, 1.0][i], sy: [0.75, 1.15, 1.0][i], w: 5 + i * 2 }) };
    R.stagger = { n: 4, fps: 8, loop: true, poseFn: (t) => P({ sx: 1.1 + Math.sin(t * A.TAU) * 0.1, sy: 0.85 - Math.sin(t * A.TAU) * 0.1, w: t * A.TAU * 2, cool: 0.25 }) };
    // morte: arrefece, a crosta toma conta e abate-se
    R.death = { n: 7, fps: 10, poseFn: (t, i) => P({ sx: 1 + i * 0.07, sy: 1 - i * 0.09, w: i * 0.6, cool: Math.min(1, i / 5) }) };
    return R;
  }
  A.register('en_slag', () => A.creature({ name: 'en_slag', S, box: [44, 28], anchor: [22, 22], rig, draw, overlay, points, anims: anims(), post: K.post('#ff9050', 0.25, 0.03) }));
  (A.previewCell = A.previewCell || {}).en_slag = [40, 26];
})(window.ART);
