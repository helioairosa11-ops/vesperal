// Vesperal — Vitral (vitrail): santo de vidro que se soltou da janela da catedral — painéis de cor presos por chumbo,
// auréola de vidro amarelo, mãos em bênção; faltam-lhe cacos. Some-se num clarão e reaparece; lança cacos.
// → assets/sprites/en_vitrail.png
'use strict';
(function (A) {
  const S = 4, K = A.kit(S);
  const G = { red: '#b02a3a', blue: '#2a4aa0', gold: '#d8a838', green: '#2a7a4a', violet: '#6a3a9a', skin: '#e8c8a0', white: '#e0e4f0' };
  const LEAD = '#1a1820';
  const rig = new A.Rig([{ n: 'root', len: 1, a: 0 }]);
  const P = (x) => A.pose({}, x, [0, 0]);
  // painel de vidro: cor com luz a atravessar (gradiente) e moldura de chumbo
  function pane(ctx, pts, col, k = 1) {
    const path = K.polyPath(pts);
    const ys = pts.map((p) => p[1]), y0 = Math.min(...ys), y1 = Math.max(...ys);
    const g = ctx.createLinearGradient(0, y0 * S, 0, y1 * S);
    g.addColorStop(0, A.mix(col, '#ffffff', 0.25 * k)); g.addColorStop(1, A.mix(col, '#000000', 0.25));
    ctx.fillStyle = g; ctx.fill(path);
    ctx.lineWidth = S * 0.32; ctx.strokeStyle = LEAD; ctx.lineJoin = 'round'; ctx.stroke(path);
    return path;
  }
  function draw(ctx, W, x) {
    const sway = x.sway || 0, arms = x.arms || 0, crack = x.crack || 0, sh = x.shatter || 0;
    ctx.save(); ctx.rotate(sway * A.D2R);
    const off = (i) => (sh > 0 ? [Math.cos(i * 1.7) * sh * 6, Math.sin(i * 2.3) * sh * 4 + sh * sh * 6] : [0, 0]);
    const T = (pts, i) => { const o = off(i); return pts.map(([a, b]) => [a + o[0], b + o[1]]); };
    // auréola
    const ha = T([[-3.4, -15.4], [-1.6, -17.6], [1.6, -17.6], [3.4, -15.4], [3.0, -13.0], [-3.0, -13.0]], 0);
    pane(ctx, ha, G.gold, 1.4);
    for (let i = 0; i < 5; i++) { const a = Math.PI + (i + 0.5) / 5 * Math.PI; K.line(ctx, [[0, -14.4], [Math.cos(a) * 3.2, -14.4 + Math.sin(a) * 2.8]].map(([a2, b]) => [a2 + off(0)[0], b + off(0)[1]]), 0.14, LEAD); }
    // manto (azul) dos lados e túnica (vermelha) ao meio, em painéis
    pane(ctx, T([[-5.4, -9.6], [-2.4, -10.6], [-2.6, 2.0], [-4.4, 6.0], [-6.2, 5.0]], 1), G.blue);
    pane(ctx, T([[2.4, -10.6], [5.2, -9.4], [6.0, 5.0], [4.2, 6.2], [2.6, 2.0]], 2), G.blue);
    pane(ctx, T([[-2.4, -10.6], [2.4, -10.6], [2.0, -4.0], [-2.0, -4.0]], 3), G.red);
    pane(ctx, T([[-2.0, -4.0], [2.0, -4.0], [2.6, 2.0], [-2.6, 2.0]], 4), G.violet);
    pane(ctx, T([[-2.6, 2.0], [2.6, 2.0], [4.2, 6.2], [0, 7.0], [-4.4, 6.0]], 5), G.green);
    // mãos em bênção (sobem no ataque)
    const ay = -6.2 - arms * 4.0, ax = 1.0 + arms * 1.2;
    pane(ctx, T([[ax - 1.4, ay + 1.0], [ax - 0.4, ay - 1.6], [ax + 0.8, ay - 1.4], [ax + 1.2, ay + 0.8]], 6), G.skin);
    pane(ctx, T([[-ax - 1.0, ay + 1.4], [-ax - 0.2, ay - 1.0], [-ax + 0.8, ay - 0.6], [-ax + 0.8, ay + 1.4]], 7), G.skin);
    // cabeça (perfil sereno), olhos de luz
    const hd = T([[-1.6, -12.6], [-1.2, -14.6], [0.6, -15.2], [2.0, -14.2], [2.2, -12.6], [1.4, -11.0], [-0.8, -10.8]], 8);
    pane(ctx, hd, G.skin, 1.2);
    pane(ctx, T([[-1.8, -14.2], [-0.6, -15.4], [0.8, -15.4], [-0.4, -14.2], [-1.4, -11.4], [-2.0, -12.2]], 9), '#7a4a2a'); // cabelo
    // fendas (quando ferido) e buracos de cacos em falta
    if (crack > 0) for (const [a, b, c] of [[[-1.0, -8.0], [0.6, -5.6], [-0.4, -3.0]], [[3.6, -4.0], [4.4, -1.0], [3.2, 2.0]], [[-4.0, 0.0], [-3.0, 3.0], [-4.4, 4.4]]]) K.line(ctx, [a, b, c].map(([p, q]) => [p + off(3)[0], q + off(3)[1]]), 0.18 * crack + 0.04, A.rgba('#ffffff', 0.8 * crack));
    const hole = K.polyPath(T([[3.0, -2.0], [4.4, -1.4], [4.0, 0.4], [3.2, 0.0]], 2)); ctx.save(); ctx.globalCompositeOperation = 'destination-out'; ctx.fill(hole); ctx.restore();
    ctx.lineWidth = S * 0.25; ctx.strokeStyle = LEAD; ctx.stroke(hole);
    ctx.restore();
  }
  // luz que atravessa o vidro (por cima do contorno)
  function overlay(ctx, W, x) {
    const k = (x.glow === undefined ? 1 : x.glow) * (1 - (x.shatter || 0));
    if (k <= 0) return;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    A.glow(ctx, 0, -14.4 * S, 4 * S, '#ffe080', 0.45 * k);
    A.glow(ctx, 0, -4 * S, 7 * S, '#a080ff', 0.18 * k);
    ctx.fillStyle = A.rgba('#fff8e0', 0.9 * k); for (const ex of [1.2]) { ctx.beginPath(); ctx.ellipse(ex * S, -13.2 * S, 0.35 * S, 0.22 * S, 0, 0, A.TAU); ctx.fill(); }
    ctx.restore();
  }
  function points(W, x) { return { eye: [1.2, -13.2], tip: [1.0 + (x.arms || 0) * 1.2, -6.2 - (x.arms || 0) * 4] }; }
  function anims() {
    const R = {};
    R.idle = { n: 6, fps: 6, loop: true, poseFn: (t) => P({ sway: Math.sin(t * A.TAU) * 3, glow: 1 + Math.sin(t * A.TAU) * 0.2 }) };
    R.move = { n: 6, fps: 6, loop: true, poseFn: (t) => P({ sway: 6 + Math.sin(t * A.TAU) * 2 }) };
    // cacos: ergue as mãos e a luz intensifica-se; os cacos partem no golpe
    R.atk_shards = { n: 8, fps: 10, phases: [5, 1], poseFn: (t, i) => P({ arms: [0, 0.3, 0.6, 0.9, 1, 1, 0.6, 0.2][i], glow: [1, 1.3, 1.6, 1.9, 2.2, 2.6, 1.6, 1.2][i], sway: [0, -2, -4, -5, -6, 4, 2, 0][i] }) };
    R.hurt = { n: 3, fps: 14, poseFn: (t, i) => P({ sway: [-12, -6, -2][i], crack: [1, 0.7, 0.3][i], glow: [2, 1.4, 1][i] }) };
    R.stagger = { n: 4, fps: 8, loop: true, poseFn: (t) => P({ sway: Math.sin(t * A.TAU) * 14, crack: 0.6, glow: 0.6 }) };
    // morte: estala e parte-se em cacos que caem
    R.death = { n: 7, fps: 10, poseFn: (t, i) => P({ crack: 1, shatter: i / 6, glow: 1 - i / 6, sway: i * 2 }) };
    return R;
  }
  A.register('en_vitrail', () => A.creature({ name: 'en_vitrail', S, box: [34, 50], anchor: [16, 32], rig, draw, overlay, points, anims: anims(), post: K.post('#e0d0ff', 0.25, 0.02) }));
  (A.previewCell = A.previewCell || {}).en_vitrail = [30, 44];
})(window.ART);
