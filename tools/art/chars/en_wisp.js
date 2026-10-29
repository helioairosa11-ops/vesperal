// Vesperal — Fátuo (wisp): círio errante, cera derretida em forma de rosto aflito com uma chama por cabeça.
// Flutua, cospe gotas de cera a arder e mergulha contra o intruso. → assets/sprites/en_wisp.png
'use strict';
(function (A) {
  const S = 4, K = A.kit(S);
  const M = {
    wax: A.mat('#d9cba6', { shadow: '#9a8b68', light: '#f6ecd2', deep: '#5c5038' }),
    waxOld: A.mat('#b9a77f', { shadow: '#7a6a4a', light: '#ddd0ac' }),
    iron: A.mat('#4a4650', { shadow: '#26232a', light: '#86808e' }),
  };
  const rig = new A.Rig([{ n: 'root', len: 1, a: -90 }]);

  // corpo de cera: bordo de cima derretido, escorridos, rosto cavado; x.lean inclina, x.melt derrete (morte)
  function body(ctx, x) {
    const lean = x.lean || 0, melt = x.melt || 0, squash = x.squash || 0;
    const h = 10 * (1 - melt * 0.6) * (1 - squash * 0.15), w = 4.2 * (1 + melt * 0.5 + squash * 0.12);
    ctx.save(); ctx.rotate(lean * A.D2R);
    const y0 = 5, y1 = y0 - h;
    const r = A.rng(5);
    const rim = [];
    for (let i = 0; i <= 6; i++) { const t = i / 6; rim.push([A.lerp(-w, w, t), y1 + Math.sin(t * Math.PI) * -0.6 + (i % 2 ? 0.7 : 0) + r() * 0.4]); }
    const path = A.path((q) => {
      q.M(-w * 0.86, y0); q.Q(-w * 1.1, (y0 + y1) / 2, -w, y1 + 0.6);
      for (const p of rim) q.L(p[0], p[1]);
      q.Q(w * 1.12, (y0 + y1) / 2, w * 0.86, y0); q.Q(0, y0 + 1.2, -w * 0.86, y0); q.Z();
    }, S);
    K.paint(ctx, path, M.wax, { depth: S * 0.9, hlw: S * 0.45, light: [-0.6, -1] });
    ctx.save(); ctx.clip(path);
    // cera mais escura e gasta na base
    const g = ctx.createLinearGradient(0, y1 * S, 0, y0 * S); g.addColorStop(0, 'rgba(90,70,40,0)'); g.addColorStop(1, 'rgba(90,70,40,0.45)');
    ctx.fillStyle = g; ctx.fillRect(-w * 1.3 * S, y1 * S, w * 2.6 * S, h * S + 2);
    // o rosto aflito: sobrancelhas de cera derretidas, órbitas, boca redonda
    const mo = x.mouth === undefined ? 0.4 : x.mouth, fy = y1 + h * 0.48;
    for (const ex of [-1.6, 1.4]) {
      // órbitas ocas que escorrem (cera derretida), com um fundo de brasa ténue
      const sd = ex < 0 ? -1 : 1;
      const eye = K.blobPath([[ex - 0.75, fy - 1.0 - (sd > 0 ? 0.4 : 0)], [ex + 0.75, fy - 1.0 - (sd < 0 ? 0.4 : 0)], [ex + 0.55, fy + 0.3], [ex + 0.1 * sd, fy + 1.4], [ex - 0.5, fy + 0.3]]);
      ctx.fillStyle = '#1c110a'; ctx.fill(eye);
      K.ember(ctx, ex, fy + 0.1, 0.28, 0.55 * (x.eye === undefined ? 1 : x.eye), '#ff9a40');
      K.line(ctx, [[ex - 1.0 * sd, fy - 1.4], [ex + 0.9 * sd, fy - 2.3]], 0.34, A.rgba(M.wax.shadow, 0.85));
    }
    const mouth = A.path((q) => q.E(0.1, fy + 1.6 + mo * 0.4, 0.8 + mo * 0.4, 0.5 + mo * 1.0), S);
    ctx.fillStyle = '#1e120b'; ctx.fill(mouth);
    if (mo > 0.6) K.ember(ctx, 0.1, fy + 1.7 + mo * 0.4, 0.5 + mo * 0.3, mo, '#ff9030');
    K.line(ctx, [[-0.7, fy + 2.4 + mo * 0.9], [-0.9, fy + 3.6 + mo]], 0.35, A.rgba(M.wax.light, 0.6)); // lágrima de cera
    ctx.restore();
    // escorridos de cera pelas costas e por baixo
    const dp = x.drip || 0;
    for (let i = 0; i < 4; i++) {
      const dx = -w * 0.8 + i * w * 0.55 + (r() - 0.5) * 0.4, len = 1.6 + ((dp + i * 0.37) % 1) * 3 + melt * 2;
      const d = A.path((q) => { q.M(dx - 0.45, y0 - 0.4); q.Q(dx - 0.5, y0 + len * 0.6, dx, y0 + len); q.Q(dx + 0.5, y0 + len * 0.6, dx + 0.45, y0 - 0.4); q.Z(); }, S);
      K.paint(ctx, d, i % 2 ? M.wax : M.waxOld, { depth: S * 0.25, hlw: S * 0.12, light: [-0.6, -1] });
    }
    // aro de ferro velho (resto do castiçal)
    K.poly(ctx, [[-w * 1.02, y0 - 2.6], [w * 1.02, y0 - 2.4], [w * 1.0, y0 - 1.5], [-w * 1.0, y0 - 1.7]], M.iron, { depth: S * 0.25, hlw: S * 0.12 });
    // pavio
    K.line(ctx, [[0.2, y1 + 0.4], [0.4 + (x.flick || 0) * 0.3, y1 - 1.0]], 0.3, '#1a110c');
    ctx.restore();
    return y1;
  }
  // chama (desenhada por cima do contorno): lágrima com núcleo branco, ondula
  function flame(ctx, x, t) {
    const lean = (x.lean || 0) * A.D2R, melt = x.melt || 0, squash = x.squash || 0;
    const h = 10 * (1 - melt * 0.6) * (1 - squash * 0.15);
    const k = (x.flame === undefined ? 1 : x.flame) * (1 - melt * 0.8);
    if (k <= 0.02) return;
    const fx = Math.sin(lean) * (h - 5), fy = 5 - h * Math.cos(lean);
    ctx.save(); ctx.translate((fx + 0.3) * S, (fy - 0.6) * S);
    const fl = x.flick || 0, H = 7.5 * k, W = 2.6 * Math.sqrt(k);
    const shape = (hh, ww, sway) => { ctx.beginPath(); ctx.moveTo(-ww * S, 0); ctx.quadraticCurveTo(-ww * 1.1 * S, -hh * 0.55 * S, (sway) * S, -hh * S); ctx.quadraticCurveTo(ww * 1.1 * S, -hh * 0.55 * S, ww * S, 0); ctx.quadraticCurveTo(0, ww * 0.7 * S, -ww * S, 0); ctx.fill(); };
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = 'rgba(255,110,30,0.75)'; shape(H, W, fl * 1.4 - lean * 3);
    ctx.fillStyle = 'rgba(255,190,80,0.85)'; shape(H * 0.72, W * 0.68, fl * 1.0 - lean * 2.4);
    ctx.fillStyle = 'rgba(255,248,220,0.95)'; shape(H * 0.4, W * 0.36, fl * 0.5 - lean * 1.5);
    ctx.restore();
  }
  function draw(ctx, W, x) { body(ctx, x); }
  function overlay(ctx, W, x, t) { flame(ctx, x, t); }
  function points(W, x) { return { eye: [0, -0.5], tip: [0.1, 1.6], light: [0, -9] }; }

  // ---------------------------------------------------------------- poses (só parâmetros)
  const P = (x) => A.pose({}, x, [0, 0]);
  function anims() {
    const R = {};
    const float = (t, extra = {}) => P(Object.assign({ lean: Math.sin(t * A.TAU) * 6, flick: Math.sin(t * A.TAU * 2) * 0.8, drip: t, flame: 1 + Math.sin(t * A.TAU * 3) * 0.08, eye: 1 + Math.sin(t * A.TAU * 2) * 0.15 }, extra));
    R.idle = { n: 6, fps: 8, loop: true, poseFn: (t) => float(t) };
    R.move = { n: 6, fps: 10, loop: true, poseFn: (t) => float(t, { lean: 12 + Math.sin(t * A.TAU) * 4, flame: 1.05 }) };
    // cuspir: a chama encolhe, a boca abre-se e lança uma gota de cera a arder
    R.atk_spit = {
      n: 7, fps: 12, phases: [4, 1],
      poseFn: (t, i) => [P({ lean: -4, flick: 0.4, drip: 0.1, flame: 1.1, mouth: 0.5 }), P({ lean: -10, flick: -0.6, drip: 0.2, flame: 0.8, mouth: 0.9, squash: 0.3, eye: 1.4 }), P({ lean: -14, flick: 0.8, drip: 0.3, flame: 0.7, mouth: 1.3, squash: 0.5, eye: 1.7 }), P({ lean: -16, flick: -0.4, drip: 0.4, flame: 0.65, mouth: 1.6, squash: 0.6, eye: 2 }),
        P({ lean: 14, flick: 1.4, drip: 0.5, flame: 1.4, mouth: 1.8, squash: -0.3, eye: 2 }), P({ lean: 8, flick: 0.6, drip: 0.6, flame: 1.2, mouth: 1.0, eye: 1.4 }), P({ lean: 2, flick: 0, drip: 0.7, flame: 1, mouth: 0.5 })][i],
    };
    // mergulho: incha (sinal branco), atira-se inclinado com a chama a rasgar o ar
    R.atk_dive = {
      n: 8, fps: 12, phases: [3, 3],
      poseFn: (t, i) => [P({ lean: -6, flame: 1.2, mouth: 0.8, eye: 1.5, squash: 0.3 }), P({ lean: -14, flame: 1.5, mouth: 1.2, eye: 1.9, squash: 0.5 }), P({ lean: -18, flame: 1.7, mouth: 1.4, eye: 2.2, squash: 0.6 }),
        P({ lean: 40, flame: 1.4, flick: -2.2, mouth: 1.6, eye: 2, squash: -0.2 }), P({ lean: 46, flame: 1.3, flick: -2.6, mouth: 1.6, eye: 2 }), P({ lean: 40, flame: 1.3, flick: -2.0, mouth: 1.4, eye: 1.8 }),
        P({ lean: 14, flame: 1.0, flick: 0.6, mouth: 0.8 }), P({ lean: 4, flame: 1.0, mouth: 0.5 })][i],
    };
    R.hurt = { n: 3, fps: 14, poseFn: (t, i) => [P({ lean: -24, squash: 0.6, flame: 0.5, mouth: 1.5, eye: 2.2, flick: 1.6 }), P({ lean: -12, squash: 0.3, flame: 0.75, mouth: 1, eye: 1.5 }), P({ lean: -4, flame: 0.95, mouth: 0.6 })][i] };
    R.stagger = { n: 4, fps: 8, loop: true, poseFn: (t) => P({ lean: Math.sin(t * A.TAU) * 22, flame: 0.45 + Math.sin(t * A.TAU * 2) * 0.1, mouth: 1.1, eye: 0.5, flick: Math.sin(t * A.TAU * 3) * 1.5, drip: t }) };
    // morte: a chama vacila e apaga-se, a cera derrete
    R.death = { n: 7, fps: 10, poseFn: (t, i) => P({ lean: -10 + i * 4, flame: Math.max(0, 1.3 - i * 0.24), melt: Math.min(1, i / 6), mouth: 1.4 - i * 0.15, eye: Math.max(0, 1.6 - i * 0.3), drip: i * 0.15, flick: Math.sin(i * 2.2) * 1.6 }) };
    return R;
  }
  A.register('en_wisp', () => A.creature({ name: 'en_wisp', S, box: [24, 34], anchor: [12, 22], rig, draw, overlay, points, anims: anims(), post: K.post('#ffc070', 0.3, 0.035) }));
  (A.previewCell = A.previewCell || {}).en_wisp = [30, 34];
})(window.ART);
