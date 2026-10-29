// Vesperal — Coro (choir): cabeça de querubim arrancada ao cadeiral do coro — pedra polida, caracóis talhados,
// olhos fechados e boca aberta a cantar; duas asinhas de pedra. O canto solta notas em roda.
// → assets/sprites/en_choir.png
'use strict';
(function (A) {
  const S = 4, K = A.kit(S);
  const M = {
    stone: A.mat('#a8a0a4', { shadow: '#625a62', light: '#dcd4d6', deep: '#2a242a' }),
    wing: A.mat('#8e868c', { shadow: '#524a52', light: '#bab2b6' }),
  };
  const rig = new A.Rig([{ n: 'root', len: 1, a: 0 }]);
  const P = (x) => A.pose({}, x, [0, 0]);
  function draw(ctx, W, x) {
    const mo = x.mouth === undefined ? 0.4 : x.mouth, tilt = (x.tilt || 0) * A.D2R, wg = x.wing || 0, cr = x.crack || 0, br = x.broken || 0;
    ctx.save(); ctx.rotate(tilt);
    // asinhas de pedra (penas talhadas)
    for (const s of [-1, 1]) {
      const m = s < 0 ? K.dim(M.wing, 0.75) : M.wing;
      ctx.save(); ctx.translate(-1.6 * S, (0.6 + (s < 0 ? -0.4 : 0)) * S); ctx.rotate((-0.6 + wg * 0.5) * (s < 0 ? 1.15 : 1));
      const w = K.blob(ctx, [[0, 0], [-2.4, -2.8], [-5.4, -3.6], [-6.4, -2.0], [-5.0, -0.6], [-5.6, 0.6], [-3.4, 0.8]], m, { depth: S * 0.3, hlw: S * 0.15 });
      ctx.save(); ctx.clip(w); for (let i = 0; i < 3; i++) K.line(ctx, [[-1.2 - i * 1.4, 0.2], [-2.4 - i * 1.4, -2.6]], 0.16, A.rgba(M.wing.deep || '#2a242a', 0.6)); ctx.restore();
      ctx.restore();
    }
    // cabeça redonda de querubim
    const off = (i) => [Math.cos(i * 2.1) * br * 4, Math.sin(i * 1.3) * br * 3 + br * br * 5];
    const o0 = off(0);
    ctx.save(); ctx.translate(o0[0] * S, o0[1] * S);
    const head = K.blob(ctx, [[-4.0, 0.0], [-3.6, -3.6], [-1.0, -5.2], [2.0, -4.8], [3.8, -2.6], [4.2, 0.2], [3.4, 2.8], [1.0, 4.2], [-1.8, 3.8], [-3.6, 2.2]], M.stone, { depth: S * 0.7, hlw: S * 0.35, light: [0.5, -1] });
    ctx.save(); ctx.clip(head);
    // caracóis do cabelo talhado
    for (let i = 0; i < 6; i++) { const a = Math.PI + 0.3 + i * 0.42, cx = Math.cos(a) * 3.4, cy = Math.sin(a) * 3.6 - 0.6; ctx.strokeStyle = A.rgba(M.stone.deep, 0.6); ctx.lineWidth = S * 0.22; ctx.beginPath(); ctx.arc(cx * S, cy * S, 0.9 * S, 0, A.TAU * 0.8); ctx.stroke(); }
    // bochecha, sombra da órbita
    K.line(ctx, [[0.6, -1.2], [2.6, -1.4]], 0.5, A.rgba(M.stone.shadow, 0.5));
    for (const [a, b] of [[[-1.0, -3.6], [0.2, -1.6]], [[2.4, 0.4], [1.6, 2.4]]]) if (cr > 0) K.line(ctx, [a, b, [b[0] + 0.6, b[1] + 0.6]], 0.16, A.rgba('#141016', cr));
    ctx.restore();
    // olho fechado (pálpebra) e boca redonda aberta a cantar
    K.line(ctx, [[1.4, -1.6], [2.6, -1.4]], 0.22, '#3a3238');
    const mouth = A.path((q) => q.E(2.6, 1.4, 0.6 + mo * 0.3, 0.45 + mo * 0.75), S);
    ctx.fillStyle = '#140e12'; ctx.fill(mouth); ctx.lineWidth = K.IW; ctx.strokeStyle = K.INK; ctx.stroke(mouth);
    // nariz pequeno
    K.poly(ctx, [[3.4, -0.8], [4.4, 0.2], [3.4, 0.4]], M.stone, { depth: S * 0.1, inkW: K.IW * 0.6 });
    ctx.restore();
    // pescoço partido (base rachada)
    const base = K.polyPath([[-1.6 + o0[0], 3.4 + o0[1]], [1.6 + o0[0], 3.8 + o0[1]], [1.0 + o0[0], 5.0 + o0[1]], [0.2 + o0[0], 4.4 + o0[1]], [-0.6 + o0[0], 5.2 + o0[1]], [-1.4 + o0[0], 4.2 + o0[1]]]);
    K.paint(ctx, base, M.stone, { depth: S * 0.25 });
    ctx.restore();
  }
  // luz do canto que sai da boca (por cima do contorno)
  function overlay(ctx, W, x) {
    const k = x.sing || 0; if (k <= 0) return;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    A.glow(ctx, 2.6 * S, 1.4 * S, (2 + k * 3) * S, '#d8b0ff', 0.6 * k);
    ctx.restore();
  }
  function points(W, x) { return { eye: [2.0, -1.5], tip: [2.6, 1.4] }; }
  function anims() {
    const R = {};
    R.idle = { n: 6, fps: 6, loop: true, poseFn: (t) => P({ mouth: 0.4 + Math.sin(t * A.TAU) * 0.2, wing: Math.sin(t * A.TAU), tilt: Math.sin(t * A.TAU) * 4 }) };
    R.move = { n: 6, fps: 8, loop: true, poseFn: (t) => P({ mouth: 0.3, wing: Math.sin(t * A.TAU), tilt: 8 }) };
    // cantar: inspira (cabeça para trás), abre a boca toda e a luz sai com as notas
    R.atk_sing = { n: 8, fps: 9, phases: [5, 1], poseFn: (t, i) => P({ mouth: [0.4, 0.2, 0.1, 0.4, 0.8, 1.6, 1.4, 0.8][i], tilt: [0, -6, -12, -14, -10, 8, 6, 2][i], wing: [0, 0.6, 1, 1, 0.8, -0.6, -0.2, 0][i], sing: [0, 0, 0.2, 0.4, 0.7, 1.4, 1.0, 0.4][i] }) };
    R.hurt = { n: 3, fps: 14, poseFn: (t, i) => P({ mouth: 1, tilt: [-20, -8, -2][i], crack: [1, 0.7, 0.4][i] }) };
    R.stagger = { n: 4, fps: 8, loop: true, poseFn: (t) => P({ mouth: 0.8, tilt: Math.sin(t * A.TAU) * 20, crack: 0.6, wing: -0.5 }) };
    R.death = { n: 7, fps: 10, poseFn: (t, i) => P({ mouth: 1.2, tilt: i * 10, crack: 1, broken: i / 6, wing: -1 }) };
    return R;
  }
  A.register('en_choir', () => A.creature({ name: 'en_choir', S, box: [34, 28], anchor: [18, 14], rig, draw, overlay, points, anims: anims(), post: K.post('#e8e0f0', 0.3, 0.05) }));
  (A.previewCell = A.previewCell || {}).en_choir = [34, 28];
})(window.ART);
