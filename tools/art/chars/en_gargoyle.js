// Vesperal — Gárgula (gargoyle): demónio de pedra da Torre dos Sinos, lascado e coberto de líquen, com uma asa
// partida. Fica agachada no beiral como estátua (invulnerável) e acorda para mergulhar sobre quem passa.
// → assets/sprites/en_gargoyle.png
'use strict';
(function (A) {
  const S = 4, K = A.kit(S);
  const M = {
    stone: A.mat('#76727a', { shadow: '#3e3b44', light: '#aaa6ae', deep: '#1c1a20' }),
    stoneB: A.mat('#5a5660', { shadow: '#302d36', light: '#7e7a84', deep: '#16141a' }),
    lichen: '#6a7a4a', moss: '#4a5a34',
  };
  const rig = new A.Rig([{ n: 'root', len: 1, a: 0 }]);
  const P = (x) => A.pose({}, x, [0, 0]);
  // asa de morcego em pedra: x.wing (–1 baixo … 1 cima), a de perto está partida a meio
  function wing(ctx, up, m, broken, ox, oy) {
    const f = Math.sign(up || 1) * Math.max(0.2, Math.abs(up));
    const Q = (u, v) => [ox - u * 9, oy - v * 8 * f];
    const ribs = broken ? [[0.05, 0.1], [0.35, 0.75], [0.55, 0.6]] : [[0.05, 0.1], [0.4, 1.0], [0.8, 0.85], [1.0, 0.45]];
    const outline = broken ? [[0, 0], [0.1, 0.5], [0.35, 0.75], [0.42, 0.62], [0.55, 0.6], [0.5, 0.35], [0.3, 0.12]] : [[0, 0], [0.1, 0.55], [0.4, 1.0], [0.6, 0.8], [0.8, 0.85], [0.9, 0.6], [1.0, 0.45], [0.75, 0.3], [0.5, 0.12]];
    const path = K.polyPath(outline.map(([u, v]) => Q(u, v)));
    K.paint(ctx, path, m, { depth: S * 0.4, hlw: S * 0.2 });
    for (const [u, v] of ribs) K.line(ctx, [Q(0, 0), Q(u, v)], 0.4, m.shadow);
    if (broken) { const c = Q(0.42, 0.62); K.line(ctx, [c, [c[0] - 0.6, c[1] + 0.8 * f]], 0.2, '#1a181e'); }
  }
  function body(ctx, x) {
    const crouch = x.crouch || 0, tilt = (x.tilt || 0) * A.D2R, mo = x.mouth || 0;
    ctx.save(); ctx.rotate(tilt);
    // asa de longe
    wing(ctx, x.wing === undefined ? 0.6 : x.wing, K.dim(M.stoneB, 0.75), false, -1.6, -5.6);
    // pernas traseiras dobradas (garras)
    const legs = (dx, m) => { K.tube(ctx, [[-3.4 + dx, -3.0], [-1.8 + dx, -0.2 - crouch * 0.4], [-3.0 + dx, 2.4 - crouch * 1.2]], [1.5, 1.0, 0.6], m, { depth: S * 0.4 }); for (let i = 0; i < 3; i++) K.line(ctx, [[-3.0 + dx + i * 0.5, 2.4 - crouch * 1.2], [-2.6 + dx + i * 0.6, 3.4 - crouch * 1.2]], 0.3, '#1c1a20'); };
    legs(0.8, M.stoneB);
    // tronco curvado de pedra
    const tr = K.blob(ctx, [[-5.4, -2.4], [-4.4, -6.4], [-0.8, -8.0], [2.6, -7.0], [4.0, -4.4], [3.2, -1.4], [0.0, 0.2], [-3.8, 0.0]], M.stone, { depth: S * 0.9, hlw: S * 0.4 });
    ctx.save(); ctx.clip(tr);
    // lascas, fissuras e líquen
    for (const [a, b] of [[[-2.0, -7.2], [-1.0, -4.6]], [[1.2, -6.6], [2.0, -3.8]], [[-4.0, -3.6], [-2.6, -1.0]]]) K.line(ctx, [a, b, [b[0] + 0.6, b[1] + 0.8]], 0.18, '#1c1a20');
    for (const [lx, ly, r] of [[-3.0, -5.6, 1.2], [1.6, -2.2, 0.9]]) { const g = ctx.createRadialGradient(lx * S, ly * S, 0, lx * S, ly * S, r * S); g.addColorStop(0, A.rgba(M.lichen, 0.8)); g.addColorStop(1, A.rgba(M.lichen, 0)); ctx.fillStyle = g; ctx.fillRect((lx - 2) * S, (ly - 2) * S, 4 * S, 4 * S); }
    ctx.restore();
    // espigão das costas
    for (let i = 0; i < 4; i++) { const sx = -4.2 + i * 1.6, sy = -6.6 - Math.sin(i / 3 * Math.PI) * 1.2; K.poly(ctx, [[sx - 0.5, sy + 0.4], [sx - 0.1, sy - 1.2], [sx + 0.5, sy + 0.3]], M.stone, { depth: S * 0.2 }); }
    legs(-0.4, M.stone);
    // braço com garras grandes (x.claw: 0 recolhido … 1 estendido)
    const cl = x.claw || 0;
    const sh = [2.0, -5.0], el = [3.0 + cl * 2.6, -2.4 - cl * 1.8], wr = [4.2 + cl * 5.0, 0.2 - cl * 2.4];
    K.limb(ctx, sh, el, wr, 1.2, 0.85, 0.7, M.stone, { depth: S * 0.4 });
    for (let i = 0; i < 3; i++) { const a = (-0.5 + i * 0.5) + cl * 0.4; K.tube(ctx, [wr, [wr[0] + Math.cos(a) * 1.4, wr[1] + Math.sin(a) * 1.4 + 0.4], [wr[0] + Math.cos(a) * 2.2, wr[1] + Math.sin(a) * 2.2 + 1.2]], [0.35, 0.25, 0.08], M.stoneB, { depth: S * 0.15 }); }
    // cabeça de cão-demónio: cornos, focinho, boca aberta
    ctx.save(); ctx.translate(3.2 * S, -7.6 * S); ctx.rotate((x.head || 0) * A.D2R);
    K.poly(ctx, [[-0.8, -1.6], [-2.4, -4.0], [-0.2, -2.0]], M.stoneB, { depth: S * 0.2 }); // corno
    const jaw = K.polyPath([[0.2, 0.6], [3.6, 0.8 + mo * 1.2], [3.2, 1.6 + mo * 1.6], [0.4, 1.6]]);
    K.paint(ctx, jaw, M.stoneB, { depth: S * 0.25 });
    const hd = K.polyPath([[-1.4, -1.4], [0.6, -2.2], [2.4, -1.6], [4.2, -0.6], [4.0, 0.6], [2.6, 0.7 + mo * 0.3], [0.4, 0.9], [-1.4, 0.4]]);
    K.paint(ctx, hd, M.stone, { depth: S * 0.45, hlw: S * 0.25 });
    for (let i = 0; i < 3; i++) K.poly(ctx, [[1.6 + i * 0.8, 0.6], [1.9 + i * 0.8, 1.3], [2.2 + i * 0.8, 0.6]], { base: '#cfc6b0', shadow: '#8a8270', light: '#efe6d0', ink: K.INK }, { depth: S * 0.1, inkW: K.IW * 0.5 });
    K.poly(ctx, [[0.0, -1.6], [0.6, -3.6], [1.0, -1.8]], M.stone, { depth: S * 0.2 }); // corno da frente
    const eo = K.polyPath([[1.4, -1.2], [2.4, -1.2], [2.2, -0.5], [1.5, -0.6]]); ctx.fillStyle = '#100e12'; ctx.fill(eo);
    if ((x.eye || 0) > 0) K.ember(ctx, 1.9, -0.85, 0.3, x.eye, '#ff5a30');
    ctx.restore();
    // asa de perto (partida)
    wing(ctx, (x.wing === undefined ? 0.6 : x.wing) * 0.92, M.stone, true, -0.6, -5.4);
    ctx.restore();
  }
  function draw(ctx, W, x) { body(ctx, x); }
  function points(W, x) { const c = x.claw || 0; return { eye: [5.1, -8.4], tip: [9.0 + c * 3, -1.2 - c * 2] }; }
  function anims() {
    const R = {};
    // estátua: agachada e imóvel (os olhos apagados)
    R.perch = { n: 1, fps: 1, poseFn: () => P({ crouch: 1, wing: 0.35, eye: 0, head: 10 }) };
    R.idle = { n: 6, fps: 9, loop: true, poseFn: (t) => P({ wing: Math.cos(t * A.TAU), eye: 1, head: Math.sin(t * A.TAU) * 4, tilt: -4 }) };
    R.move = { n: 6, fps: 11, loop: true, poseFn: (t) => P({ wing: Math.cos(t * A.TAU), eye: 1, tilt: 10 }) };
    // mergulho (sinal vermelho): asas em cima, boca aberta; depois cai a pique com as garras à frente
    R.atk_dive = { n: 8, fps: 10, phases: [3, 3], poseFn: (t, i) => P([{ wing: 1, mouth: 0.3, eye: 1.4, tilt: -14 }, { wing: 1, mouth: 0.7, eye: 1.8, tilt: -20 }, { wing: 0.9, mouth: 1, eye: 2, tilt: -24 }, { wing: 0.3, mouth: 1, claw: 1, eye: 2, tilt: 34 }, { wing: 0.25, mouth: 1, claw: 1, eye: 2, tilt: 40 }, { wing: 0.3, mouth: 0.8, claw: 0.9, eye: 1.8, tilt: 34 }, { wing: -0.6, mouth: 0.3, claw: 0.4, eye: 1.2, tilt: 8 }, { wing: 0.6, eye: 1, tilt: 0 }][i]) };
    // unhada (sinal branco)
    R.atk_claw = { n: 7, fps: 13, phases: [3, 2], poseFn: (t, i) => P([{ wing: 0.6, eye: 1 }, { wing: 0.9, claw: -0.4, eye: 1.4, tilt: -10, head: -6 }, { wing: 1, claw: -0.6, eye: 1.6, tilt: -14, head: -8, mouth: 0.6 }, { wing: -0.2, claw: 1, eye: 1.8, tilt: 16, mouth: 1 }, { wing: -0.4, claw: 1, eye: 1.6, tilt: 18, mouth: 0.8 }, { wing: 0.3, claw: 0.4, eye: 1.2, tilt: 6 }, { wing: 0.6, eye: 1 }][i]) };
    R.hurt = { n: 3, fps: 14, poseFn: (t, i) => P({ wing: [1, 0.2, 0.6][i], tilt: [-22, -8, -2][i], mouth: 0.8, eye: 1.6 }) };
    R.stagger = { n: 4, fps: 8, loop: true, poseFn: (t) => P({ wing: Math.cos(t * A.TAU) * 0.6 - 0.2, tilt: 20 + Math.sin(t * A.TAU) * 10, head: 20, eye: 0.4 }) };
    // morte: a pedra racha e cai
    R.death = { n: 7, fps: 10, poseFn: (t, i) => P({ wing: 0.4 - i * 0.15, tilt: 10 + i * 18, eye: Math.max(0, 1 - i * 0.3), crouch: i / 6, mouth: 0.6 }) };
    return R;
  }
  A.register('en_gargoyle', () => A.creature({ name: 'en_gargoyle', S, box: [40, 36], anchor: [18, 22], rig, draw, points, anims: anims(), post: K.post('#b8b4c8', 0.32, 0.06) }));
  (A.previewCell = A.previewCell || {}).en_gargoyle = [36, 34];
})(window.ART);
