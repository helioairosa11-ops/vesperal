// Vesperal — adereços e objetos do cenário pintados com o mesmo traço das personagens (sombra/luz por bandas,
// contorno a tinta, grão). Tudo num só atlas: assets/props/props.png + assets/props/props.js (VS.PROP_META).
// Coordenadas em unidades do jogo (1 tile = 20) relativas à âncora: chão = base ao centro (y negativo para cima),
// teto = ponto de fixação, parede = centro. As chamas e brilhos animados são desenhados pelo jogo por cima.
'use strict';
(function (A) {
  const S = 4, K = A.kit(S), INK = '#0a080d';
  const M = {
    stone: A.mat('#6c665f', { shadow: '#3c3834', light: '#a49c92', deep: '#1c1a18' }),
    stoneD: A.mat('#4e4a46', { shadow: '#2a2826', light: '#827a72', deep: '#121110' }),
    stoneL: A.mat('#8a847a', { shadow: '#54504a', light: '#c4bcb0' }),
    marble: A.mat('#b8b2aa', { shadow: '#6e6a66', light: '#eeeae2' }),
    moss: A.mat('#4e6a3a', { shadow: '#2a3a20', light: '#82a060' }),
    iron: A.mat('#3e3c44', { shadow: '#1e1d22', light: '#7a7884', deep: '#0c0c0e' }),
    ironR: A.mat('#5a3e30', { shadow: '#2e1e16', light: '#8e6a50' }),
    bronze: A.mat('#8a6a34', { shadow: '#4a3618', light: '#d0aa62', deep: '#20160a' }),
    gold: A.mat('#b8924a', { shadow: '#6a5024', light: '#f4dc9c', deep: '#2a1e0c' }),
    wood: A.mat('#5e4430', { shadow: '#33241a', light: '#8e6c4c', deep: '#160f0a' }),
    woodD: A.mat('#3e2c20', { shadow: '#20160f', light: '#64483a' }),
    wax: A.mat('#e6dcc4', { shadow: '#a89a7e', light: '#fffaf0' }),
    bone: A.mat('#cfc4aa', { shadow: '#857a64', light: '#f2ead8', deep: '#2a241a' }),
    cloth: A.mat('#6a1c22', { shadow: '#3a0c12', light: '#9a3a3a' }),
    clothB: A.mat('#26304a', { shadow: '#121828', light: '#4a5a7a' }),
    clay: A.mat('#7a4a32', { shadow: '#42261a', light: '#b07a56' }),
    clayG: A.mat('#4a5a50', { shadow: '#26302a', light: '#7a8e80' }),
    rope: A.mat('#7a6040', { shadow: '#463620', light: '#a88a60' }),
    coal: A.mat('#2a1a14', { shadow: '#120a08', light: '#5a3020' }),
    canvasW: A.mat('#8a7a5a', { shadow: '#52462e', light: '#b8a682' }),
  };
  const P = (c, pts, m, o) => K.poly(c, pts, m, o);
  const B = (c, pts, m, o) => K.blob(c, pts, m, o);
  const Tb = (c, pts, ws, m, o) => K.tube(c, pts, ws, m, o);
  const L = (c, pts, w, col) => K.line(c, pts, w, col);
  const D = (c, x, y, r, col) => K.dot(c, x, y, r, col);
  const R = (c, x, y, w, h, m, o) => P(c, [[x, y], [x + w, y], [x + w, y + h], [x, y + h]], m, o);
  const E = (c, x, y, rx, ry, m, o, n = 14) => B(c, Array.from({ length: n }, (_, i) => [x + Math.cos(i / n * A.TAU) * rx, y + Math.sin(i / n * A.TAU) * ry]), m, o);
  const glowAt = (c, x, y, r, col, a) => A.glow(c, x * S, y * S, r * S, col, a);
  const crack = (c, pts, a = 0.75) => L(c, pts, 0.28, A.rgba('#0a0808', a));
  const thin = { depth: S * 0.25, hlw: S * 0.15 };

  // ---------------------------------------------------------------- definições
  // k: tipo; v: variantes; box: [esquerda, cima, direita, baixo] em unidades relativas à âncora
  const DEF = {};
  const def = (k, box, draw, extra) => { (DEF[k] = DEF[k] || []).push(Object.assign({ box, draw }, extra || {})); };

  // ---------- chão
  def('rubble', [-14, -14, 14, 1], (c) => {
    P(c, [[-13, 0], [-12, -6], [-7, -9], [-3, -6], [-2, 0]], M.stone);
    crack(c, [[-9, -7], [-8, -4], [-9, -1]]);
    // tambor de coluna partido, deitado
    P(c, [[-2, 0], [-1, -8], [9, -8], [10, 0]], M.stoneD);
    E(c, 9.5, -4, 1.6, 4, M.stoneL, thin);
    for (const y of [-6, -4, -2]) L(c, [[-1, y], [8.6, y]], 0.22, A.rgba('#000000', 0.35));
    B(c, [[9, 0], [10, -3], [13, -3.5], [14, 0]], M.stone, thin);
    B(c, [[-14, 0], [-14, -2], [-12, -2.4], [-11, 0]], M.stoneD, thin);
    D(c, 4, -0.6, 0.7, '#2a2624'); D(c, 6.2, -0.4, 0.5, '#2a2624');
  });
  def('rubble', [-12, -10, 12, 1], (c) => {
    // tijolos caídos
    const br = [[-11, -2.5, 6, 2.6, 0.05], [-5, -2.6, 6, 2.6, -0.04], [1, -2.4, 6, 2.4, 0.03], [-8, -5.2, 6, 2.6, -0.12], [-2, -5, 6, 2.6, 0.18], [3, -6.6, 5, 2.4, 0.5]];
    for (const [x, y, w, h, a] of br) { c.save(); c.translate((x + w / 2) * S, (y + h / 2) * S); c.rotate(a); R(c, -w / 2, -h / 2, w, h, M.clay, thin); c.restore(); }
    B(c, [[7, 0], [8, -2.5], [11, -2], [12, 0]], M.stoneD, thin);
  });
  def('grave', [-8, -26, 8, 1], (c) => {
    // lápide em cruz, gasta, com musgo na base
    P(c, [[-2, 0], [-2, -16], [-7, -16], [-7, -20], [-2, -20], [-2, -25], [2, -25], [2, -20], [7, -20], [7, -16], [2, -16], [2, 0]], M.stone, { depth: S * 0.5 });
    L(c, [[0, -23.5], [0, -10]], 0.3, A.rgba('#000000', 0.35)); L(c, [[-5.5, -18], [5.5, -18]], 0.3, A.rgba('#000000', 0.35));
    crack(c, [[1.4, -14], [0.6, -11], [1.2, -8]]);
    B(c, [[-7, 0], [-5, -2.6], [-1, -2], [3, -3], [7, -1.4], [8, 0]], M.moss, thin);
    P(c, [[-6, -16], [-7, -16.6], [-7, -16]], M.moss, { ink: false });
  });
  def('grave', [-8, -22, 8, 1], (c) => {
    // estela arredondada com relevo de vela e inscrição apagada
    const s = A.path((q) => { q.M(-6.5, 0); q.L(-6.5, -14); q.Q(-6.5, -21, 0, -21); q.Q(6.5, -21, 6.5, -14); q.L(6.5, 0); q.Z(); }, S);
    K.paint(c, s, M.stone, { depth: S * 0.6 });
    const inner = A.path((q) => { q.M(-4.6, -4); q.L(-4.6, -13.5); q.Q(-4.6, -18.6, 0, -18.6); q.Q(4.6, -18.6, 4.6, -13.5); q.L(4.6, -4); q.Z(); }, S);
    c.save(); c.lineWidth = S * 0.35; c.strokeStyle = A.rgba('#1a1816', 0.6); c.stroke(inner); c.restore();
    R(c, -0.8, -14.5, 1.6, 5, M.stoneL, thin); D(c, 0, -15.6, 0.7, A.rgba('#1a1816', 0.6));
    for (let i = 0; i < 3; i++) L(c, [[-3, -8 + i * 1.4], [3 - i * 0.8, -8 + i * 1.4]], 0.22, A.rgba('#141210', 0.55));
    crack(c, [[-3.5, -19], [-2.4, -15], [-3.2, -12]]);
    R(c, -8, -1.2, 16, 1.4, M.stoneD, thin);
    B(c, [[-8, 0], [-6, -2], [-2, -1.2], [1, -2.2], [5, -1], [8, 0]], M.moss, thin);
  });
  def('grave', [-9, -18, 9, 1], (c) => {
    // laje partida e inclinada
    c.save(); c.translate(-1 * S, 0); c.rotate(-0.16);
    P(c, [[-5.5, 0], [-5.5, -12], [-3, -15], [0, -13.6], [2, -16], [5.5, -13], [5.5, 0]], M.stoneD, { depth: S * 0.5 });
    crack(c, [[0, -13.4], [-0.6, -8], [0.6, -3]]);
    for (let i = 0; i < 2; i++) L(c, [[-3, -9 + i * 1.5], [3, -9 + i * 1.5]], 0.22, A.rgba('#141210', 0.5));
    c.restore();
    B(c, [[4, 0], [5, -2.6], [8, -3.4], [9, 0]], M.stone, thin);
    B(c, [[-9, 0], [-6, -1.8], [0, -1.2], [5, -1.6], [9, 0]], M.moss, thin);
  });
  def('lamppost', [-6, -42, 6, 1], (c) => {
    R(c, -4.5, -2, 9, 2, M.iron, thin); P(c, [[-2.6, -2], [2.6, -2], [1.6, -5], [-1.6, -5]], M.iron, thin);
    Tb(c, [[0, -5], [0, -20], [0, -33]], [0.9, 0.75, 0.7], M.iron, { flat: true });
    for (const y of [-12, -24]) R(c, -1.4, y, 2.8, 1.2, M.iron, thin);
    // braço em voluta
    Tb(c, [[0, -30], [2.4, -31.5], [3.6, -29.5], [2.4, -28]], [0.35, 0.35, 0.3, 0.25], M.iron, { flat: true });
    // lanterna de vidro
    P(c, [[-3.4, -33], [3.4, -33], [2.6, -35.5], [-2.6, -35.5]], M.iron, thin);
    const cage = K.polyPath([[-2.8, -33], [2.8, -33], [2.2, -40], [-2.2, -40]]);
    c.fillStyle = '#e09040'; c.fill(cage);
    const g = c.createRadialGradient(0, -36.5 * S, 0, 0, -36.5 * S, 4 * S); g.addColorStop(0, '#fff0c0'); g.addColorStop(1, 'rgba(255,150,60,0.2)'); c.fillStyle = g; c.fill(cage);
    c.lineWidth = S * 0.4; c.strokeStyle = INK; c.stroke(cage); L(c, [[0, -33], [0, -40]], 0.3, '#1a1418');
    P(c, [[-3, -40], [3, -40], [0, -42.5]], M.iron, thin); D(c, 0, -42.6, 0.6, '#1a1418');
  }, { flames: [[0, -35, 0.7]] });
  def('barrel', [-7, -17, 7, 1], (c) => {
    const body = A.path((q) => { q.M(-5, 0); q.Q(-7, -8, -5, -16); q.L(5, -16); q.Q(7, -8, 5, 0); q.Z(); }, S);
    K.paint(c, body, M.wood, { depth: S * 0.8 });
    c.save(); c.clip(body); for (let x = -4; x <= 4; x += 2) L(c, [[x * 0.9, -16], [x * 1.15, -8], [x * 0.9, 0]], 0.2, A.rgba('#1a100a', 0.6)); c.restore();
    for (const [y, w] of [[-13.5, 5.6], [-3, 5.8]]) { const h = A.path((q) => { q.M(-w, y - 0.8); q.Q(0, y - 1.4, w, y - 0.8); q.L(w, y + 0.8); q.Q(0, y + 0.2, -w, y + 0.8); q.Z(); }, S); K.paint(c, h, M.iron, thin); }
    E(c, 0, -16, 5, 1.1, M.woodD, thin);
  });
  def('candles', [-8, -12, 8, 1], (c) => {
    E(c, 0, -0.4, 7, 1.2, M.wax, thin);
    for (const [x, h, w] of [[-4.5, 4, 1.1], [-1.2, 8, 1.3], [2.2, 5.5, 1.2], [5, 3, 1]]) {
      const s = A.path((q) => { q.M(x - w, 0); q.L(x - w, -h + 0.6); q.Q(x, -h - 0.4, x + w, -h + 0.6); q.L(x + w, 0); q.Z(); }, S);
      K.paint(c, s, M.wax, { depth: S * 0.35 });
      L(c, [[x + w * 0.4, -h + 1], [x + w * 0.5, -h + 3]], 0.35, A.rgba('#fffaf0', 0.8));
      L(c, [[x, -h], [x, -h - 0.9]], 0.25, '#1a1410');
    }
  }, { flames: [[-4.5, -4.9, 0.8], [-1.2, -8.9, 1], [2.2, -6.4, 0.9], [5, -3.9, 0.7]] });
  def('candles', [-6, -10, 6, 1], (c) => {
    E(c, 0, -0.4, 5, 1, M.wax, thin);
    for (const [x, h, w] of [[-2.6, 6, 1.2], [1.6, 3.6, 1.1]]) {
      const s = A.path((q) => { q.M(x - w, 0); q.L(x - w, -h + 0.6); q.Q(x, -h - 0.4, x + w, -h + 0.6); q.L(x + w, 0); q.Z(); }, S);
      K.paint(c, s, M.wax, { depth: S * 0.35 }); L(c, [[x, -h], [x, -h - 0.9]], 0.25, '#1a1410');
    }
  }, { flames: [[-2.6, -6.9, 0.9], [1.6, -4.5, 0.8]] });
  def('crate', [-9, -15, 9, 1], (c) => {
    R(c, -8, -14, 16, 14, M.wood, { depth: S * 0.6 });
    for (const y of [-9.4, -4.8]) L(c, [[-7.6, y], [7.6, y]], 0.25, A.rgba('#1a100a', 0.7));
    R(c, -8, -14, 16, 2, M.woodD, thin); R(c, -8, -2, 16, 2, M.woodD, thin);
    Tb(c, [[-7, -2.2], [7, -12]], [0.9, 0.9], M.woodD, { flat: true, depth: S * 0.2 });
    for (const [x, y] of [[-7, -13], [7, -13], [-7, -1], [7, -1]]) D(c, x, y, 0.35, '#c0b0a0');
  });
  def('stakes', [-10, -18, 10, 1], (c) => {
    for (const [x, a, h] of [[-6, -0.3, 15], [-1, 0.05, 17], [4, 0.32, 14]]) {
      c.save(); c.translate(x * S, 0); c.rotate(a);
      P(c, [[-1.3, 0], [-1.3, -h + 3], [0, -h], [1.3, -h + 3], [1.3, 0]], M.wood, { depth: S * 0.3 });
      P(c, [[-1.3, -h + 3], [0, -h], [0.3, -h + 2.6]], M.woodD, { ink: false }); c.restore();
    }
    Tb(c, [[-9, -5], [9, -6]], [0.45, 0.45], M.rope, { flat: true, depth: S * 0.15 });
  });
  def('brazier', [-10, -16, 10, 1], (c) => {
    for (const [a, b] of [[[-3, -8], [-7, 0]], [[3, -8], [7, 0]], [[0, -8], [0, 0]]]) Tb(c, [a, b], [0.5, 0.45], M.iron, { flat: true, depth: S * 0.2 });
    const bowl = A.path((q) => { q.M(-8, -13); q.L(8, -13); q.Q(6.5, -7, 0, -7); q.Q(-6.5, -7, -8, -13); q.Z(); }, S);
    K.paint(c, bowl, M.iron, { depth: S * 0.6 });
    for (let i = -6; i <= 6; i += 3) D(c, i, -12.6, 0.45, '#8a8890');
    B(c, [[-6.6, -13], [-4, -15], [0, -14.2], [4, -15.4], [6.6, -13]], M.coal, thin);
    for (const [x, y] of [[-3, -14], [1.4, -14.4], [4, -13.6]]) D(c, x, y, 0.6, '#ff8030');
    glowAt(c, 0, -14, 6, '#ff7020', 0.45);
  }, { flames: [[-2.6, -14.4, 1.8], [1.2, -14.8, 2.2], [3.8, -14, 1.5]] });
  def('anvil', [-12, -16, 12, 1], (c) => {
    // cepo de madeira
    P(c, [[-5, 0], [-4.4, -7], [4.4, -7], [5, 0]], M.wood, { depth: S * 0.5 });
    for (let i = 0; i < 3; i++) L(c, [[-3.4 + i * 3, -6.6], [-3.2 + i * 3, -0.4]], 0.2, A.rgba('#1a100a', 0.55));
    E(c, 0, -7, 4.4, 0.8, M.woodD, thin);
    // bigorna
    P(c, [[-2.6, -7], [-1.8, -10], [2, -10], [2.8, -7]], M.iron, thin);
    P(c, [[-11, -10], [-6, -10.8], [7, -10.8], [9, -13], [-4, -14], [-8, -13.4]], M.iron, { depth: S * 0.6 });
    L(c, [[-6, -13.6], [8.4, -12.8]], 0.3, A.rgba('#c8c4d0', 0.75));
    // martelo pousado
    Tb(c, [[3, -14.2], [10, -15.4]], [0.4, 0.4], M.wood, { flat: true, depth: S * 0.15 }); R(c, 1.2, -16, 2.6, 2, M.iron, thin);
  });
  def('crucible', [-9, -15, 9, 1], (c) => {
    P(c, [[-8, -12], [8, -12], [6, 0], [-6, 0]], M.ironR, { depth: S * 0.7 });
    for (const y of [-9, -4]) L(c, [[-7.4, y], [7.2, y]], 0.4, A.rgba('#1a0e0a', 0.7));
    Tb(c, [[-9, -9], [-10, -6], [-8.4, -4]], [0.45, 0.45, 0.4], M.iron, { flat: true, depth: 0 });
    E(c, 0, -12, 7.6, 1.4, A.mat('#ff7020', { light: '#ffe090', shadow: '#c03a10' }), { depth: S * 0.2, ink: false });
    E(c, -1.4, -12.2, 3, 0.6, A.mat('#ffe8a0', { light: '#ffffff', shadow: '#ffb040' }), { ink: false, hl: false });
    // escorrência de metal
    Tb(c, [[6.8, -11.6], [7.4, -8], [6.9, -6]], [0.5, 0.45, 0.3], A.mat('#ff9030', { light: '#ffe0a0', shadow: '#b03a10' }), { ink: false, depth: 0 });
    glowAt(c, 0, -12.5, 9, '#ff7020', 0.5);
  });
  def('pipe', [-7, -46, 7, 1], (c) => {
    R(c, -4.6, -2.4, 9.2, 2.4, M.iron, thin);
    Tb(c, [[0, -2], [0, -24], [0, -44]], [2.6, 2.6, 2.6], M.ironR, { flat: true, depth: S * 0.8 });
    for (const y of [-12, -26, -40]) { R(c, -3.6, y, 7.2, 2, M.iron, thin); for (const x of [-2.6, 0, 2.6]) D(c, x, y + 1, 0.3, '#9a9aa6'); }
    // válvula
    E(c, 4.4, -30, 2.4, 2.4, M.iron, { depth: S * 0.3 }, 10); D(c, 4.4, -30, 0.7, '#1a1418');
    for (let i = 0; i < 4; i++) { const a = i / 4 * A.TAU + 0.4; L(c, [[4.4, -30], [4.4 + Math.cos(a) * 2, -30 + Math.sin(a) * 2]], 0.3, '#1a1418'); }
    // ferrugem a escorrer
    c.save(); c.clip(K.tubePath([[0, -2], [0, -44]], [2.6, 2.6], false)); for (const x of [-1.4, 1]) { const g = c.createLinearGradient(0, -38 * S, 0, -20 * S); g.addColorStop(0, 'rgba(160,70,30,0.6)'); g.addColorStop(1, 'rgba(160,70,30,0)'); c.fillStyle = g; c.fillRect((x - 0.5) * S, -38 * S, S * 1.1, 18 * S); } c.restore();
  });
  def('pot', [-7, -15, 7, 1], (c) => {
    const s = A.path((q) => { q.M(-3.4, 0); q.Q(-7, -4, -5, -9); q.Q(-3.6, -11.6, -2.4, -12); q.L(-2.6, -13.6); q.L(2.6, -13.6); q.L(2.4, -12); q.Q(3.6, -11.6, 5, -9); q.Q(7, -4, 3.4, 0); q.Z(); }, S);
    K.paint(c, s, M.clay, { depth: S * 0.8 });
    L(c, [[-5.4, -7.5], [5.4, -7.5]], 0.35, A.rgba('#2a160e', 0.6)); L(c, [[-5.9, -6.4], [5.9, -6.4]], 0.25, A.rgba('#e0b080', 0.4));
    Tb(c, [[-4.6, -10], [-6.6, -10.6], [-6.2, -8]], [0.4, 0.4, 0.35], M.clay, { flat: true, depth: 0 });
    Tb(c, [[4.6, -10], [6.6, -10.6], [6.2, -8]], [0.4, 0.4, 0.35], M.clay, { flat: true, depth: 0 });
    crack(c, [[1.6, -12], [2.4, -9], [1.6, -6.4]]);
  });
  def('pot', [-6, -12, 6, 1], (c) => {
    const s = A.path((q) => { q.M(-3, 0); q.Q(-6, -5, -2.4, -9); q.L(-2.4, -11); q.L(2.4, -11); q.L(2.4, -9); q.Q(6, -5, 3, 0); q.Z(); }, S);
    K.paint(c, s, M.clayG, { depth: S * 0.7 });
    for (let i = 0; i < 5; i++) L(c, [[-4 + i * 2, -6], [-3.6 + i * 2, -4.4]], 0.3, A.rgba('#d0e0c8', 0.35));
  });
  def('smallbell', [-7, -12, 7, 1], (c) => {
    c.save(); c.rotate(0.3);
    const s = A.path((q) => { q.M(-1.6, -9.4); q.Q(-2.6, -9.6, -2.8, -7); q.Q(-3.4, -3, -5.4, -0.6); q.L(5.4, -0.6); q.Q(3.4, -3, 2.8, -7); q.Q(2.6, -9.6, 1.6, -9.4); q.Z(); }, S);
    K.paint(c, s, M.bronze, { depth: S * 0.6 });
    R(c, -5.8, -1, 11.6, 1, M.bronze, thin); L(c, [[-2.6, -6], [2.6, -6]], 0.3, A.rgba('#2a1a08', 0.6));
    crack(c, [[1.6, -1], [2.2, -3.6], [1.4, -5]]);
    c.restore();
    E(c, -2, -0.6, 1.2, 1, M.iron, thin);
  });
  def('rope', [-8, -6, 8, 1], (c) => {
    for (let i = 0; i < 3; i++) E(c, 0, -1.4 - i * 1.3, 7 - i * 1.4, 1.6, M.rope, { depth: S * 0.25 });
    Tb(c, [[5, -1], [7, -0.4], [8, -0.2]], [0.5, 0.5, 0.45], M.rope, { flat: true, depth: 0 });
  });
  def('candelabra', [-10, -34, 10, 1], (c) => {
    // pé de três garras
    for (const s of [-1, 1]) Tb(c, [[0, -4], [s * 3, -2], [s * 5, 0]], [0.6, 0.5, 0.4], M.gold, { flat: true, depth: S * 0.2 });
    E(c, 0, -4, 2, 1, M.gold, thin);
    Tb(c, [[0, -4], [0, -14], [0, -24]], [0.6, 0.45, 0.5], M.gold, { flat: true, depth: S * 0.2 });
    for (const y of [-10, -18]) E(c, 0, y, 1.3, 0.8, M.gold, thin, 10);
    // braços em lira
    for (const s of [-1, 1]) Tb(c, [[0, -21], [s * 4, -21.4], [s * 7, -24], [s * 7, -26]], [0.4, 0.4, 0.35, 0.35], M.gold, { flat: true, depth: 0 });
    for (const x of [-7, 0, 7]) {
      const yy = x === 0 ? -24 : -26; E(c, x, yy, 1.8, 0.6, M.gold, thin, 10);
      const h = x === 0 ? 6 : 4.6; R(c, x - 0.8, yy - h, 1.6, h, M.wax, thin);
      L(c, [[x + 0.3, yy - h + 0.8], [x + 0.4, yy - h + 2.4]], 0.3, A.rgba('#fffaf0', 0.8));
      L(c, [[x, yy - h], [x, yy - h - 0.8]], 0.22, '#1a1410');
    }
  }, { flames: [[-7, -31.4, 0.9], [0, -30.8, 1], [7, -31.4, 0.9]] });
  def('pew', [-16, -17, 16, 1], (c) => {
    R(c, -15, -8, 30, 2.2, M.wood, { depth: S * 0.4 });
    R(c, -14, -14.4, 26, 1.6, M.woodD, thin); R(c, -14, -11.6, 26, 1.2, M.woodD, thin);
    for (const x of [-12, 10]) R(c, x, -6, 2, 6, M.woodD, thin);
    // cabeceira entalhada
    const end = A.path((q) => { q.M(12.4, 0); q.L(12.4, -13); q.Q(12.4, -16.6, 14.6, -16.6); q.Q(16.6, -16.6, 16.4, -13); q.L(16.4, 0); q.Z(); }, S);
    K.paint(c, end, M.wood, { depth: S * 0.5 }); E(c, 14.4, -12.6, 1, 1.3, M.woodD, thin, 10);
    R(c, -15.6, -15, 2.2, 15, M.wood, thin);
  });
  def('statue', [-11, -50, 11, 1], (c) => {
    // santo encapuzado em oração sobre plinto
    R(c, -9, -5, 18, 5, M.stoneD, { depth: S * 0.5 }); R(c, -10, -6.4, 20, 1.6, M.stone, thin);
    const robe = A.path((q) => { q.M(-6.6, -6.4); q.Q(-7.4, -20, -5, -30); q.Q(-4.6, -36, -3.4, -39); q.L(3.4, -39); q.Q(4.6, -36, 5, -30); q.Q(7.4, -20, 6.6, -6.4); q.Z(); }, S);
    K.paint(c, robe, M.stone, { depth: S * 0.9 });
    c.save(); c.clip(robe); for (const x of [-3.6, -1, 1.8, 4]) L(c, [[x * 0.7, -30], [x, -18], [x * 1.2, -6.6]], 0.3, A.rgba('#1a1816', 0.5)); c.restore();
    // capuz
    const hood = A.path((q) => { q.M(-4.6, -37); q.Q(-5.4, -46, 0, -47.6); q.Q(5.4, -46, 4.6, -37); q.Q(0, -35.6, -4.6, -37); q.Z(); }, S);
    K.paint(c, hood, M.stoneL, { depth: S * 0.6 });
    B(c, [[-2.6, -38.6], [0, -44], [2.6, -38.6], [0, -37.4]], M.stoneD, { depth: 0, hl: false });
    // mãos postas
    P(c, [[-1.6, -28], [0, -33], [1.6, -28], [0, -26.6]], M.stoneL, thin);
    B(c, [[-7, -7], [-4, -9.6], [0, -8.4], [3, -10], [7, -7.6], [8, -6.4], [-8, -6.4]], M.moss, thin);
    crack(c, [[3, -34], [3.8, -28], [3, -22]]);
  });
  def('statue', [-14, -50, 14, 1], (c) => {
    // anjo que chora, asas fechadas
    R(c, -9, -5, 18, 5, M.stoneD, { depth: S * 0.5 }); R(c, -10, -6.4, 20, 1.6, M.stone, thin);
    for (const s of [-1, 1]) {
      const wing = A.path((q) => { q.M(s * 2, -36); q.Q(s * 13, -44, s * 12, -30); q.Q(s * 11.6, -18, s * 7, -8); q.Q(s * 6, -18, s * 3, -26); q.Z(); }, S);
      K.paint(c, wing, M.stoneD, { depth: S * 0.6 });
      c.save(); c.clip(wing); for (let i = 0; i < 5; i++) L(c, [[s * (4 + i), -36 + i], [s * (8 + i * 0.6), -14 + i * 1.2]], 0.25, A.rgba('#141210', 0.5)); c.restore();
    }
    const body = A.path((q) => { q.M(-5, -6.4); q.Q(-6, -20, -3.6, -32); q.L(3.6, -32); q.Q(6, -20, 5, -6.4); q.Z(); }, S);
    K.paint(c, body, M.stone, { depth: S * 0.8 });
    c.save(); c.clip(body); for (const x of [-2.6, 0, 2.6]) L(c, [[x * 0.8, -30], [x * 1.3, -7]], 0.3, A.rgba('#1a1816', 0.5)); c.restore();
    E(c, 0, -35, 3, 3.4, M.stoneL, { depth: S * 0.5 });
    // braços a cobrir o rosto
    Tb(c, [[-3.4, -30], [-2.4, -34], [0.4, -36]], [1, 0.9, 0.8], M.stoneL, { depth: S * 0.3 });
    Tb(c, [[3.4, -30], [2.4, -34], [-0.4, -36.4]], [1, 0.9, 0.8], M.stone, { depth: S * 0.3 });
    L(c, [[1.4, -33], [1.8, -28], [1.4, -24]], 0.3, A.rgba('#20303a', 0.55)); // rasto de humidade como lágrima
    B(c, [[-8, -6.4], [-5, -9], [-1, -7.6], [4, -9.2], [8, -6.4]], M.moss, thin);
  });
  def('chair', [-10, -20, 10, 1], (c) => {
    // cadeira de espaldar alto, tombada
    c.save(); c.translate(1 * S, -1 * S); c.rotate(1.25);
    R(c, -5, -9, 10, 1.6, M.wood, thin); for (const x of [-4.6, 3.4]) R(c, x, -7.4, 1.2, 7.4, M.woodD, thin);
    const back = A.path((q) => { q.M(-5, -9); q.L(-5, -19); q.Q(-5, -21.6, -2.6, -21.6); q.L(-1, -21.6); q.Q(1.4, -21.6, 1.4, -19); q.L(1.4, -9); q.Z(); }, S);
    K.paint(c, back, M.cloth, { depth: S * 0.5 });
    R(c, -5.6, -21, 1.4, 12, M.wood, thin); R(c, 1, -21, 1.4, 12, M.wood, thin);
    for (const y of [-18, -14]) D(c, -1.8, y, 0.4, '#d0a050');
    c.restore();
  });
  def('skulls', [-10, -11, 10, 1], (c) => {
    Tb(c, [[-9, -1], [8, -2]], [0.7, 0.7], M.bone, { depth: S * 0.2 }); E(c, 8.4, -2, 1.2, 1.2, M.bone, thin, 10); E(c, -9.4, -1, 1.2, 1.2, M.bone, thin, 10);
    const skull = (x, y, s, f) => {
      const p = A.path((q) => { q.M(x - 3 * s, y); q.Q(x - 3.6 * s, y - 4.6 * s, x, y - 5 * s); q.Q(x + 3.6 * s, y - 4.6 * s, x + 3 * s, y); q.L(x + 2 * s, y + 1.4 * s); q.L(x - 2 * s, y + 1.4 * s); q.Z(); }, S);
      K.paint(c, p, M.bone, { depth: S * 0.45 });
      for (const ex of [-1.2, 1.2]) E(c, x + ex * s + f * 0.3, y - 1.6 * s, 0.9 * s, 1 * s, A.mat('#14100c', {}), { ink: false, hl: false }, 10);
      P(c, [[x - 0.4 * s + f * 0.3, y + 0.2 * s], [x + 0.4 * s + f * 0.3, y + 0.2 * s], [x + f * 0.3, y - 0.6 * s]], A.mat('#14100c', {}), { ink: false, hl: false });
      for (let i = -1; i <= 1; i++) L(c, [[x + i * 0.8 * s, y + 0.8 * s], [x + i * 0.8 * s, y + 1.4 * s]], 0.2, '#2a2218');
    };
    skull(-4.6, -2.4, 0.95, -1); skull(4.6, -2.4, 0.9, 1); skull(0, -6.2, 1.05, 0);
  });
  def('coffin', [-16, -11, 16, 1], (c) => {
    P(c, [[-15, 0], [-15, -5], [-11, -8], [13, -7], [15, -4], [15, 0]], M.woodD, { depth: S * 0.5 });
    // tampa entreaberta
    c.save(); c.translate(-12 * S, -8 * S); c.rotate(-0.14);
    P(c, [[0, 0], [4, -2.4], [27, -1.6], [28, 1.6], [1, 1.2]], M.wood, { depth: S * 0.4 }); c.restore();
    for (const x of [-9, 9]) P(c, [[x - 0.8, -4.6], [x + 0.8, -4.6], [x + 0.8, -2], [x - 0.8, -2]], M.iron, thin);
    P(c, [[0.4, -6.4], [0.4, -2], [-0.4, -2], [-0.4, -6.4]], M.bronze, { ink: false }); L(c, [[-1.6, -5], [2.2, -5]], 0.35, M.bronze.base);
  });

  // ---------- teto (âncora no ponto de fixação, y positivo para baixo)
  def('sign', [-10, -1, 10, 20], (c) => {
    Tb(c, [[-9, 0.6], [6, 0.6]], [0.5, 0.5], M.iron, { flat: true, depth: 0 });
    Tb(c, [[-9, 0.6], [-6, 3], [-3, 0.8]], [0.3, 0.3, 0.3], M.iron, { flat: true, depth: 0 });
    for (const x of [-5, 4]) L(c, [[x, 0.6], [x, 6]], 0.28, '#1a1418');
    const board = A.path((q) => { q.M(-7.6, 6); q.L(6.6, 6); q.L(6.6, 16); q.Q(-0.5, 18.4, -7.6, 16); q.Z(); }, S);
    K.paint(c, board, M.wood, { depth: S * 0.5 });
    // a marca da taberna: uma caneca entalhada
    R(c, -3, 8.6, 4.6, 5.4, M.bronze, thin); Tb(c, [[1.6, 9.6], [3.4, 10.6], [3.2, 12.4], [1.6, 13]], [0.4, 0.4, 0.4, 0.4], M.bronze, { flat: true, depth: 0 });
    crack(c, [[5, 7], [4, 11]]);
  }, { sway: 0.06 });
  def('banner', [-7, -1, 7, 44], (c) => {
    Tb(c, [[-6.6, 0.8], [6.6, 0.8]], [0.6, 0.6], M.wood, { depth: 0 }); for (const x of [-6.8, 6.8]) D(c, x, 0.8, 0.8, M.gold.base);
    const cl = A.path((q) => { q.M(-5.4, 1.4); q.L(5.4, 1.4); q.L(5.6, 38); q.L(3.4, 35.6); q.L(1.2, 39.6); q.L(-1, 36); q.L(-3.4, 40); q.L(-5.6, 37); q.Z(); }, S);
    K.paint(c, cl, M.cloth, { depth: S * 0.7 });
    c.save(); c.clip(cl); for (const x of [-2.6, 1.6]) L(c, [[x, 2], [x + 0.6, 38]], 0.5, A.rgba('#200608', 0.45)); c.restore();
    L(c, [[-5.2, 4], [5.2, 4]], 0.45, M.gold.base); L(c, [[-5.2, 31], [5.2, 31]], 0.4, M.gold.base);
    // sigilo da última chama
    const fl = A.path((q) => { q.M(0, 10); q.Q(-3.2, 15, -2.2, 18.6); q.Q(-1.2, 21, 0, 21.4); q.Q(1.2, 21, 2.2, 18.6); q.Q(3.2, 15, 0, 10); q.Z(); }, S);
    K.paint(c, fl, M.gold, { depth: S * 0.3 }); E(c, 0, 18.6, 1, 1.4, A.mat('#5a1418', {}), { ink: false, hl: false }, 10);
    for (const s of [-1, 1]) Tb(c, [[s * 1.4, 23], [s * 3.4, 25.6]], [0.3, 0.25], M.gold, { flat: true, depth: 0 });
  }, { sway: 0.05, skew: true });
  def('banner', [-6, -1, 6, 34], (c) => {
    Tb(c, [[-5.6, 0.8], [5.6, 0.8]], [0.5, 0.5], M.iron, { depth: 0 });
    const cl = A.path((q) => { q.M(-4.6, 1.2); q.L(4.6, 1.2); q.L(4.8, 24); q.L(2, 30); q.L(0.6, 26); q.L(-2.4, 32); q.L(-4.8, 25); q.Z(); }, S);
    K.paint(c, cl, M.clothB, { depth: S * 0.6 });
    L(c, [[-4.4, 3.4], [4.4, 3.4]], 0.4, '#a08a60');
    P(c, [[0, 7], [3, 11], [0, 17], [-3, 11]], A.mat('#a8a090', { light: '#e8e0d0' }), thin);
    for (let i = 0; i < 4; i++) D(c, -3 + i * 2.2 + (i % 2) * 0.4, 21 + (i % 2) * 2, 0.6, A.rgba('#000000', 0.5)); // buracos
  }, { sway: 0.05, skew: true });
  def('hook', [-5, -1, 5, 34], (c) => {
    for (let y = 0.6; y < 22; y += 2.6) E(c, 0, y + 1.1, 0.8, 1.3, M.iron, { depth: 0, hl: false }, 10);
    Tb(c, [[0, 23], [0, 28], [1.4, 31.4], [3.8, 30.4], [3.6, 27.6]], [0.6, 0.6, 0.55, 0.45, 0.25], M.iron, { flat: true, depth: S * 0.15 });
    P(c, [[3.6, 27.6], [4.4, 26], [3, 27]], M.iron, { ink: false });
  }, { sway: 0.08 });
  def('lantern', [-5, -1, 5, 20], (c) => {
    L(c, [[0, 0], [0, 8]], 0.3, '#1a1418');
    P(c, [[-3, 10.6], [3, 10.6], [1.6, 8], [-1.6, 8]], M.iron, thin); D(c, 0, 7.8, 0.6, M.iron.base);
    const cage = K.polyPath([[-2.8, 10.6], [2.8, 10.6], [2.4, 17], [-2.4, 17]]);
    c.fillStyle = '#7ab070'; c.fill(cage); const g = c.createRadialGradient(0, 13.6 * S, 0, 0, 13.6 * S, 3.6 * S); g.addColorStop(0, '#f0ffd8'); g.addColorStop(1, 'rgba(120,200,120,0.2)'); c.fillStyle = g; c.fill(cage);
    c.lineWidth = S * 0.4; c.strokeStyle = INK; c.stroke(cage); L(c, [[0, 10.6], [0, 17]], 0.3, '#1a1418');
    P(c, [[-3, 17], [3, 17], [2, 19], [-2, 19]], M.iron, thin);
  }, { sway: 0.07 });
  def('smallbell_h', [-6, -1, 6, 24], (c) => {
    R(c, -3, 0, 6, 1.6, M.woodD, thin); Tb(c, [[0, 1.6], [0, 12.4]], [0.3, 0.3], M.rope, { flat: true, depth: 0 });
    const s = A.path((q) => { q.M(-1.6, 12.4); q.Q(-2.6, 12.4, -2.8, 15); q.Q(-3.4, 19, -5, 21.6); q.L(5, 21.6); q.Q(3.4, 19, 2.8, 15); q.Q(2.6, 12.4, 1.6, 12.4); q.Z(); }, S);
    K.paint(c, s, M.bronze, { depth: S * 0.6 }); R(c, -5.4, 21, 10.8, 1, M.bronze, thin); E(c, 0, 22.8, 0.9, 0.9, M.iron, thin, 8);
  }, { sway: 0.12 });
  def('censer', [-6, -1, 6, 38], (c) => {
    for (const x of [-1.6, 1.6]) L(c, [[0, 0], [x, 27]], 0.25, '#2a2018');
    P(c, [[-2.6, 27.6], [2.6, 27.6], [0, 24.4]], M.bronze, thin);
    const s = A.path((q) => { q.M(-4.4, 30); q.Q(-4.6, 35.6, 0, 36); q.Q(4.6, 35.6, 4.4, 30); q.Q(0, 28.4, -4.4, 30); q.Z(); }, S);
    K.paint(c, s, M.bronze, { depth: S * 0.5 });
    for (let i = -2; i <= 2; i++) D(c, i * 1.5, 31.6, 0.4, '#1a1008');
    E(c, 0, 29.6, 4.4, 1.2, M.gold, thin, 12);
  }, { sway: 0.22, smoke: [0, 34] });
  def('chandelier', [-19, -1, 19, 26], (c) => {
    for (let y = 0.6; y < 8; y += 2.4) E(c, 0, y + 1, 0.7, 1.2, M.iron, { depth: 0, hl: false }, 10);
    for (const x of [-15, -6, 6, 15]) L(c, [[0, 9], [x, 18]], 0.28, '#1a1418');
    E(c, 0, 9.4, 1.8, 1.4, M.iron, thin, 10);
    const ring = A.path((q) => { q.M(-17, 18); q.Q(0, 23.6, 17, 18); q.L(17, 19.6); q.Q(0, 25.4, -17, 19.6); q.Z(); }, S);
    K.paint(c, ring, M.iron, { depth: S * 0.4 });
    for (let i = -2; i <= 2; i++) { const x = i * 7.6, y = 18.6 + (4 - Math.abs(i) * 1.6) * 0.5; E(c, x, y, 1.6, 0.6, M.iron, thin, 10); R(c, x - 0.7, y - 4, 1.4, 4, M.wax, thin); L(c, [[x, y - 4], [x, y - 4.7]], 0.22, '#1a1410');
      L(c, [[x - 0.3, y + 0.4], [x - 0.4, y + 2.4]], 0.4, A.rgba('#e8dcc4', 0.85)); }
    Tb(c, [[0, 21.6], [0, 24.6]], [0.9, 0.4], M.iron, { depth: 0 });
  }, { flames: [[-15.2, 15, 0.9], [-7.6, 16.2, 0.9], [0, 16.6, 0.95], [7.6, 16.2, 0.9], [15.2, 15, 0.9]], sway: 0.025 });
  def('roots', [-8, -1, 8, 26], (c) => {
    for (const [x, len, b] of [[-4, 20, 3], [0, 25, -2], [4, 16, 2], [-1.6, 12, -3]]) Tb(c, [[x, 0], [x + b * 0.4, len * 0.4], [x + b, len * 0.75], [x + b * 0.6, len]], [1, 0.75, 0.45, 0.15], M.woodD, { depth: S * 0.2 });
    for (const [x, y] of [[-3, 9], [1, 14], [3.6, 7]]) Tb(c, [[x, y], [x + 2, y + 3], [x + 2.6, y + 6]], [0.3, 0.2, 0.08], M.woodD, { depth: 0, ink: false });
  });

  // ---------- parede (âncora ao centro)
  def('window', [-7, -12, 7, 12], (c) => {
    const fr = A.path((q) => { q.M(-6, 10); q.L(-6, -4); q.Q(-6, -11, 0, -11); q.Q(6, -11, 6, -4); q.L(6, 10); q.Z(); }, S);
    K.paint(c, fr, M.stone, { depth: S * 0.4 });
    const gl = A.path((q) => { q.M(-4.2, 8.4); q.L(-4.2, -3.6); q.Q(-4.2, -9, 0, -9); q.Q(4.2, -9, 4.2, -3.6); q.L(4.2, 8.4); q.Z(); }, S);
    const g = c.createLinearGradient(0, -9 * S, 0, 8 * S); g.addColorStop(0, '#ffd890'); g.addColorStop(1, '#d06020'); c.fillStyle = g; c.fill(gl);
    c.lineWidth = S * 0.5; c.strokeStyle = '#1a1410'; c.stroke(gl);
    L(c, [[0, -9], [0, 8.4]], 0.5, '#1a1410'); L(c, [[-4.2, 0], [4.2, 0]], 0.5, '#1a1410'); L(c, [[-4.2, 4.4], [4.2, 4.4]], 0.35, '#1a1410');
    // silhueta de alguém lá dentro? não: um vaso no parapeito
    R(c, -6.6, 9.4, 13.2, 1.6, M.stoneD, thin);
    // portada partida
    c.save(); c.translate(-6 * S, -2 * S); c.rotate(0.18); R(c, -4.6, 0, 4, 11, M.wood, thin); L(c, [[-4.2, 3.6], [-0.8, 3.6]], 0.3, '#1a100a'); c.restore();
  }, { glowA: true });
  def('sconce', [-6, -10, 6, 8], (c) => {
    R(c, -2.6, -2.6, 5.2, 7.6, M.iron, { depth: S * 0.3 }); D(c, 0, -1, 0.5, '#9a98a4'); D(c, 0, 3.4, 0.5, '#9a98a4');
    Tb(c, [[0, 2], [2.6, 1], [3.6, -2]], [0.5, 0.5, 0.45], M.iron, { flat: true, depth: 0 });
    P(c, [[1.4, -2], [5.8, -2], [5, -4.4], [2.2, -4.4]], M.iron, thin);
    B(c, [[2.2, -4.4], [3.6, -5.6], [5, -4.4]], M.coal, { depth: 0 });
  }, { flames: [[3.6, -5, 1.3]], mirror: true });
  def('banner_w', [-7, -10, 7, 10], (c) => {
    // escudo de armas
    const sh = A.path((q) => { q.M(-5.4, -8); q.L(5.4, -8); q.L(5.4, -1); q.Q(5, 5, 0, 8.6); q.Q(-5, 5, -5.4, -1); q.Z(); }, S);
    K.paint(c, sh, M.clothB, { depth: S * 0.5 });
    c.save(); c.clip(sh); P(c, [[-6, -8], [0, -8], [0, 9], [-6, 9]], M.cloth, { ink: false, depth: 0 }); c.restore();
    c.lineWidth = S * 0.6; c.strokeStyle = M.iron.base; c.stroke(sh);
    for (const s of [-1, 1]) Tb(c, [[s * 6.6, -9], [s * 3, -4], [s * -3, 4], [s * -6.6, 9]], [0.5, 0.5, 0.5, 0.45], M.iron, { flat: true, depth: S * 0.2 }); // espadas cruzadas
  });
  def('vent', [-8, -7, 8, 7], (c) => {
    R(c, -7.4, -6, 14.8, 12, M.iron, { depth: S * 0.4 });
    for (const [x, y] of [[-6.2, -4.8], [6.2, -4.8], [-6.2, 4.8], [6.2, 4.8]]) D(c, x, y, 0.45, '#9a98a4');
    for (let i = 0; i < 4; i++) { const y = -3.6 + i * 2.4; R(c, -5.4, y, 10.8, 1.1, A.mat('#1a0e0a', { light: '#5a3020' }), { depth: 0, ink: false }); }
  }, { glowA: true });
  def('glasspane', [-8, -13, 8, 13], (c) => {
    const fr = K.polyPath([[-7, -12], [7, -12], [7, 12], [-7, 12]]);
    c.fillStyle = A.rgba('#a0d8c8', 0.18); c.fill(fr);
    const g = c.createLinearGradient(-7 * S, -12 * S, 7 * S, 12 * S); g.addColorStop(0, 'rgba(230,255,245,0.25)'); g.addColorStop(0.4, 'rgba(230,255,245,0)'); c.fillStyle = g; c.fill(fr);
    for (const x of [-7, 0, 7]) R(c, x - 0.6, -12, 1.2, 24, M.iron, { depth: 0 }); for (const y of [-12, 0, 12]) R(c, -7, y - 0.6, 14, 1.2, M.iron, { depth: 0 });
    for (const [a, b] of [[[1, -11], [3, -6]], [[3, -6], [6.4, -4]], [[3, -6], [2, -1]]]) L(c, [a, b], 0.2, 'rgba(240,255,250,0.7)');
    Tb(c, [[-6, 12], [-4, 4], [-6, -2], [-3, -8]], [0.4, 0.35, 0.3, 0.2], M.moss, { depth: 0 });
  });
  def('stained', [-7, -12, 7, 12], (c) => {
    const fr = A.path((q) => { q.M(-6, 11); q.L(-6, -5); q.Q(-6, -11.6, 0, -11.6); q.Q(6, -11.6, 6, -5); q.L(6, 11); q.Z(); }, S);
    K.paint(c, fr, M.stone, { depth: S * 0.3 });
    const gl = A.path((q) => { q.M(-4.4, 9.6); q.L(-4.4, -4.4); q.Q(-4.4, -9.6, 0, -9.6); q.Q(4.4, -9.6, 4.4, -4.4); q.L(4.4, 9.6); q.Z(); }, S);
    c.save(); c.clip(gl);
    const cols = ['#c03a50', '#3a5ac0', '#d0a040', '#7a3ac0', '#3a9a80', '#c06030'];
    let k = 0; for (let y = -10; y < 10; y += 3.2) for (let x = -4.4; x < 4.4; x += 2.9) { c.fillStyle = cols[(k++ * 7 + Math.floor(y)) % cols.length]; c.fillRect(x * S, y * S, 2.9 * S, 3.2 * S); }
    const g = c.createLinearGradient(0, -10 * S, 0, 10 * S); g.addColorStop(0, 'rgba(255,240,210,0.35)'); g.addColorStop(1, 'rgba(0,0,0,0.2)'); c.fillStyle = g; c.fillRect(-5 * S, -10 * S, 10 * S, 20 * S);
    c.strokeStyle = '#120a14'; c.lineWidth = S * 0.35; for (let y = -10; y < 10; y += 3.2) { c.beginPath(); c.moveTo(-5 * S, y * S); c.lineTo(5 * S, y * S); c.stroke(); }
    for (let x = -4.4; x < 4.4; x += 2.9) { c.beginPath(); c.moveTo(x * S, -10 * S); c.lineTo(x * S, 10 * S); c.stroke(); }
    c.restore(); c.lineWidth = S * 0.5; c.strokeStyle = '#120a14'; c.stroke(gl);
    E(c, 0, -5.4, 1.8, 1.8, A.mat('#ffe0a0', { light: '#ffffff' }), { depth: 0 }, 10);
  }, { glowA: true });
  def('portrait', [-10, -12, 10, 12], (c) => {
    R(c, -9, -11, 18, 22, M.gold, { depth: S * 0.4 });
    R(c, -7, -9, 14, 18, A.mat('#1e1012', { light: '#3a2020' }), { depth: 0 });
    // retrato de um nobre (busto escuro), rasgado na diagonal
    B(c, [[-4.6, 9], [-4, 2.4], [0, 0.6], [4, 2.4], [4.6, 9]], A.mat('#3a1c1a', { light: '#5a2c26' }), { depth: S * 0.3 });
    E(c, 0, -2.6, 2.6, 3.2, A.mat('#8a6a56', { light: '#b08a70', shadow: '#5a4034' }), { depth: S * 0.3 });
    R(c, -2.4, -6.6, 4.8, 1.4, M.gold, thin);
    for (const [x, y] of [[-8.6, -10.6], [8.6, -10.6], [-8.6, 10.6], [8.6, 10.6]]) D(c, x, y, 0.9, M.gold.light);
    P(c, [[-6.6, -8.4], [-5, -8.8], [5.4, 8.4], [3.4, 8.8]], A.mat('#0a0406', {}), { depth: 0, hl: false });
  });
  def('niche', [-8, -9, 8, 9], (c) => {
    const fr = A.path((q) => { q.M(-7, 8); q.L(-7, -2); q.Q(-7, -8.6, 0, -8.6); q.Q(7, -8.6, 7, -2); q.L(7, 8); q.Z(); }, S);
    K.paint(c, fr, M.stoneD, { depth: S * 0.3 });
    const hole = A.path((q) => { q.M(-5, 7); q.L(-5, -1.6); q.Q(-5, -6.6, 0, -6.6); q.Q(5, -6.6, 5, -1.6); q.L(5, 7); q.Z(); }, S);
    c.fillStyle = '#050406'; c.fill(hole);
    const p = A.path((q) => { q.M(-3, 6.8); q.Q(-3.6, 1.6, 0, 1.2); q.Q(3.6, 1.6, 3, 6.8); q.Z(); }, S); K.paint(c, p, M.bone, { depth: S * 0.35 });
    for (const ex of [-1.2, 1.2]) E(c, ex, 4, 0.8, 0.9, A.mat('#100c0a', {}), { ink: false, hl: false }, 8);
    R(c, -7.4, 7, 14.8, 1.6, M.stone, thin);
  });

  // ---------- objetos do mundo (sprites_obj): altar, urna partível, inscrição, alavanca, grade
  def('altar', [-17, -30, 17, 1], (c) => {
    R(c, -16, -4, 32, 4, M.stoneD, { depth: S * 0.5 }); R(c, -12.4, -8, 24.8, 4, M.stone, { depth: S * 0.5 });
    for (const x of [-10, 0, 10]) crack(c, [[x, -3.6], [x + 0.6, -1.4]], 0.5);
    const ped = A.path((q) => { q.M(-6.6, -8); q.L(-4.6, -19); q.L(4.6, -19); q.L(6.6, -8); q.Z(); }, S);
    K.paint(c, ped, M.stoneD, { depth: S * 0.6 });
    for (const y of [-12, -16]) L(c, [[-5.6, y], [5.6, y]], 0.3, A.rgba('#000000', 0.45));
    // relevo da chama no pedestal
    P(c, [[0, -17.4], [1.4, -14.4], [0, -11], [-1.4, -14.4]], A.mat('#8a5a30', { light: '#d09050' }), thin);
    // taça de ferro com rebites
    const bowl = A.path((q) => { q.M(-10.6, -23.6); q.L(10.6, -23.6); q.Q(8.6, -18.4, 0, -18.4); q.Q(-8.6, -18.4, -10.6, -23.6); q.Z(); }, S);
    K.paint(c, bowl, M.iron, { depth: S * 0.6 });
    E(c, 0, -23.6, 10.6, 1.3, M.iron, thin, 16);
    for (let i = -8; i <= 8; i += 4) D(c, i, -22, 0.45, '#9a98a4');
    B(c, [[-8.4, -23.6], [-5, -25.4], [0, -24.6], [5, -25.6], [8.4, -23.6]], M.coal, { depth: 0 });
    for (const [x, y] of [[-4, -24.4], [0.6, -24.8], [4.4, -24.2]]) D(c, x, y, 0.55, '#6a2a14');
  }, { flames: [[-4.8, -24.6, 1.8], [-1.6, -24.8, 2.2], [1.6, -25, 2.6], [4.8, -24.6, 1.8], [0, -25, 3]] });
  def('urn', [-7, -18, 7, 1], (c) => {
    const s = A.path((q) => { q.M(-3.6, 0); q.Q(-8, -5, -5.6, -10.6); q.Q(-4, -13, -3, -13.4); q.L(-3, -15.4); q.L(3, -15.4); q.L(3, -13.4); q.Q(4, -13, 5.6, -10.6); q.Q(8, -5, 3.6, 0); q.Z(); }, S);
    K.paint(c, s, A.mat('#5a4a3e', { light: '#8a7462', shadow: '#2e2620' }), { depth: S * 0.8 });
    E(c, 0, -15.4, 3.4, 0.9, M.stoneD, thin, 12);
    L(c, [[-6.4, -8], [6.4, -8]], 0.45, A.rgba('#c8a060', 0.7)); L(c, [[-6, -6.6], [6, -6.6]], 0.25, A.rgba('#c8a060', 0.5));
    for (let i = 0; i < 5; i++) D(c, -4 + i * 2, -10.4, 0.35, A.rgba('#c8a060', 0.7));
    R(c, -4, -1, 8, 1.2, M.stoneD, thin);
  });
  def('inscription', [-12, -27, 12, 1], (c) => {
    // estela gótica com moldura, capitel pontiagudo e base escalonada
    R(c, -11, -3, 22, 3, M.stoneD, { depth: S * 0.4 }); R(c, -9.6, -5, 19.2, 2, M.stone, thin);
    const st = A.path((q) => { q.M(-8, -5); q.L(-8, -18); q.Q(-8, -23.6, 0, -26.4); q.Q(8, -23.6, 8, -18); q.L(8, -5); q.Z(); }, S);
    K.paint(c, st, M.stone, { depth: S * 0.7 });
    const inner = A.path((q) => { q.M(-6, -6.6); q.L(-6, -17.4); q.Q(-6, -21.4, 0, -23.6); q.Q(6, -21.4, 6, -17.4); q.L(6, -6.6); q.Z(); }, S);
    c.save(); c.fillStyle = A.rgba('#1a1816', 0.35); c.fill(inner); c.lineWidth = S * 0.3; c.strokeStyle = A.rgba('#0a0808', 0.6); c.stroke(inner); c.restore();
    crack(c, [[6.6, -16], [5.4, -12], [6.2, -8]]);
    B(c, [[-11, -2.6], [-8, -4.6], [-3, -3.4], [2, -4.8], [7, -3], [11, -2.6]], M.moss, thin);
  }, { glyphs: true });
  def('lever', [-8, -8, 8, 1], (c) => {
    R(c, -7, -5, 14, 5, M.iron, { depth: S * 0.4 }); for (const x of [-5.6, 5.6]) D(c, x, -2.6, 0.5, '#9a98a4');
    E(c, 0, -5, 3, 1.6, M.iron, thin, 12);
  });
  def('lever_arm', [-3, -17, 3, 1], (c) => {
    Tb(c, [[0, 0], [0, -13]], [0.8, 0.6], M.iron, { flat: true, depth: S * 0.2 });
    E(c, 0, -14.4, 2.4, 2.4, M.bronze, { depth: S * 0.35 }, 12);
  });

  // ---------------------------------------------------------------- render + atlas
  function render(d, seed) {
    const [x0, y0, x1, y1] = d.box, pad = 2;
    const w = (x1 - x0 + pad * 2) * S, h = (y1 - y0 + pad * 2) * S;
    const cv = A.mk(w, h), c = cv.getContext('2d');
    c.translate((-x0 + pad) * S, (-y0 + pad) * S);
    d.draw(c);
    const out = A.outline(cv, S * 0.25, INK);
    A.grain(out, 0.05, seed);
    return { cv: out, ox: (-x0 + pad) * S, oy: (-y0 + pad) * S };
  }
  // corta as margens vazias (mantém a âncora)
  function crop(r) {
    const c = r.cv.getContext('2d'), { width: w, height: h } = r.cv, d = c.getImageData(0, 0, w, h).data;
    let minX = w, minY = h, maxX = -1, maxY = -1;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (d[(y * w + x) * 4 + 3] > 4) { if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y; }
    if (maxX < 0) return r;
    minX = Math.max(0, minX - 2); minY = Math.max(0, minY - 2); maxX = Math.min(w - 1, maxX + 2); maxY = Math.min(h - 1, maxY + 2);
    const o = A.mk(maxX - minX + 1, maxY - minY + 1); o.getContext('2d').drawImage(r.cv, -minX, -minY);
    return { cv: o, ox: r.ox - minX, oy: r.oy - minY };
  }
  A.register('props', () => {
    const items = [];
    let seed = 7;
    for (const k of Object.keys(DEF)) DEF[k].forEach((d, v) => { const r = crop(render(d, seed++)); items.push({ k, v, d, r }); });
    // empacotamento em prateleiras (mais altos primeiro)
    const W = 1024; items.sort((a, b) => b.r.cv.height - a.r.cv.height);
    let x = 0, y = 0, rowH = 0;
    for (const it of items) { const iw = it.r.cv.width, ih = it.r.cv.height; if (x + iw > W) { x = 0; y += rowH + 2; rowH = 0; } it.sx = x; it.sy = y; x += iw + 2; rowH = Math.max(rowH, ih); }
    const H = y + rowH;
    const atlas = A.mk(W, H), ac = atlas.getContext('2d');
    const meta = { S, items: {} };
    for (const it of items) {
      ac.drawImage(it.r.cv, it.sx, it.sy);
      const e = [it.sx, it.sy, it.r.cv.width, it.r.cv.height, it.r.ox, it.r.oy];
      const o = {}; for (const f of ['flames', 'sway', 'skew', 'glowA', 'mirror', 'smoke', 'glyphs']) if (it.d[f] !== undefined) o[f] = it.d[f];
      if (Object.keys(o).length) e.push(o);
      (meta.items[it.k] = meta.items[it.k] || [])[it.v] = e;
    }
    const js = "'use strict';\n(window.VS = window.VS || {}).PROP_META = " + JSON.stringify(meta) + ";\n";
    return { images: { props: atlas }, meta: { dir: 'props', js }, kind: 'images' };
  });
  A.PROP_DEF = DEF;
})(window.ART);
