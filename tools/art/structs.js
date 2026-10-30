// Vesperal — construções: peças grandes de arquitetura pintadas com o mesmo traço dos adereços (casas, calvário,
// túmulos, torre, trabuquete, fornalha, grua, fonte, pérgula, armação de sino, engrenagens, retábulo, órgão,
// arcada e estátua do rei). Ficam no plano do meio, atrás da ação, assentes no chão. Atlas próprio:
// assets/props/structs.png + assets/props/structs.js (VS.STRUCT_META). Âncora: centro da base (y negativo para cima).
'use strict';
(function (A) {
  const S = 3, K = A.kit(S), INK = '#0a080d';
  const M = {
    stone: A.mat('#5e5952', { shadow: '#34312d', light: '#928a80', deep: '#181614' }),
    stoneD: A.mat('#45413d', { shadow: '#262422', light: '#6e6862', deep: '#100f0e' }),
    stoneL: A.mat('#7a746a', { shadow: '#4a4640', light: '#b0a89c' }),
    brick: A.mat('#5a3a2e', { shadow: '#2e1e18', light: '#8a5c48', deep: '#140c0a' }),
    plaster: A.mat('#6a6258', { shadow: '#3a352f', light: '#958b7e' }),
    marble: A.mat('#a8a2a8', { shadow: '#5e5a62', light: '#e2dee4', deep: '#2a282c' }),
    wood: A.mat('#4e3826', { shadow: '#2a1e14', light: '#7a5a3e', deep: '#120c08' }),
    woodD: A.mat('#36261a', { shadow: '#1c140e', light: '#5a4232', deep: '#0c0806' }),
    roof: A.mat('#3a2a2a', { shadow: '#1e1616', light: '#5e4644', deep: '#0e0a0a' }),
    iron: A.mat('#36343c', { shadow: '#1a191e', light: '#6e6c78', deep: '#0a0a0c' }),
    bronze: A.mat('#7a5a2c', { shadow: '#40301a', light: '#c09858', deep: '#1c140a' }),
    gold: A.mat('#a8843e', { shadow: '#5e4820', light: '#ecd08a', deep: '#2a1e0c' }),
    cloth: A.mat('#5e1820', { shadow: '#320a10', light: '#8e2e36' }),
    clothW: A.mat('#b8ae98', { shadow: '#76705e', light: '#e2dac6' }),
    moss: A.mat('#3e5a32', { shadow: '#22341c', light: '#6a8a52' }),
    leaf: A.mat('#2e4a2a', { shadow: '#18281a', light: '#5a7a46' }),
    bone: A.mat('#c2b69c', { shadow: '#7a6e5a', light: '#e8dec8', deep: '#2a241a' }),
    water: A.mat('#3a6a78', { shadow: '#1e3a44', light: '#8ac0c8' }),
    wax: A.mat('#ddd2ba', { shadow: '#9a8e76', light: '#fff6e6' }),
  };
  const P = (c, pts, m, o) => K.poly(c, pts, m, o);
  const B = (c, pts, m, o) => K.blob(c, pts, m, o);
  const Tb = (c, pts, ws, m, o) => K.tube(c, pts, ws, m, o);
  const L = (c, pts, w, col) => K.line(c, pts, w, col);
  const D = (c, x, y, r, col) => K.dot(c, x, y, r, col);
  const R = (c, x, y, w, h, m, o) => P(c, [[x, y], [x + w, y], [x + w, y + h], [x, y + h]], m, o);
  const E = (c, x, y, rx, ry, m, o, n = 16) => B(c, Array.from({ length: n }, (_, i) => [x + Math.cos(i / n * A.TAU) * rx, y + Math.sin(i / n * A.TAU) * ry]), m, o);
  const crack = (c, pts, a = 0.7) => L(c, pts, 0.3, A.rgba('#0a0808', a));
  const thin = { depth: S * 0.25, hlw: S * 0.15 };
  const flat = { depth: S * 0.15, hl: false };
  // vão escuro (janela, porta, nicho) com luz quente opcional
  const opening = (c, path, lit) => {
    c.save(); c.fillStyle = lit ? '#2a1408' : '#0c0a0c'; c.fill(path);
    if (lit) { c.clip(path); const b = lit; const g = c.createRadialGradient(b[0] * S, b[1] * S, 0, b[0] * S, b[1] * S, b[2] * S); g.addColorStop(0, 'rgba(255,190,110,0.95)'); g.addColorStop(0.5, 'rgba(230,120,50,0.55)'); g.addColorStop(1, 'rgba(120,40,10,0.1)'); c.fillStyle = g; c.fill(path); }
    c.lineWidth = S * 0.4; c.strokeStyle = INK; c.stroke(path); c.restore();
  };
  const arch = (x0, y0, w, h) => A.path((q) => { q.M(x0, y0); q.L(x0, y0 - h + w / 2); q.Q(x0, y0 - h, x0 + w / 2, y0 - h); q.Q(x0 + w, y0 - h, x0 + w, y0 - h + w / 2); q.L(x0 + w, y0); q.Z(); }, S);
  const rectP = (x, y, w, h) => A.path((q) => { q.M(x, y); q.L(x + w, y); q.L(x + w, y + h); q.L(x, y + h); q.Z(); }, S);
  const bricks = (c, path, x0, y0, x1, y1, rowH, col) => { c.save(); c.clip(path); c.strokeStyle = col || A.rgba('#0a0808', 0.35); c.lineWidth = S * 0.22; c.beginPath();
    for (let y = y0, r = 0; y < y1; y += rowH, r++) { c.moveTo(x0 * S, y * S); c.lineTo(x1 * S, y * S); for (let x = x0 + (r % 2 ? rowH : 0); x < x1; x += rowH * 2) { c.moveTo(x * S, y * S); c.lineTo(x * S, (y + rowH) * S); } }
    c.stroke(); c.restore(); };

  const DEF = {};
  const def = (k, box, draw, extra) => { (DEF[k] = DEF[k] || []).push(Object.assign({ box, draw }, extra || {})); };

  // ===================================================================== r1 — Cidade de Cinza
  // casa de dois pisos: rés-do-chão de pedra, piso de cima em enxaimel, telhado de duas águas, varanda e tabuleta
  def('house', [-62, -158, 62, 1], (c) => {
    const ground = rectP(-56, -64, 112, 64); K.paint(c, ground, M.stone, { depth: S * 0.8 });
    bricks(c, ground, -56, -64, 56, 0, 8);
    const upper = rectP(-58, -118, 116, 54); K.paint(c, upper, M.plaster, { depth: S * 0.8 });
    // vigas do enxaimel
    c.save(); c.clip(upper);
    for (const x of [-58, -30, 0, 30, 57]) L(c, [[x, -118], [x, -64]], 2.2, M.woodD.base);
    for (const [a, b] of [[[-58, -64], [-30, -118]], [[-30, -64], [-58, -118]], [[30, -64], [57, -118]], [[57, -64], [30, -118]]]) L(c, [a, b], 1.6, M.woodD.base);
    c.restore();
    R(c, -60, -66, 120, 4, M.woodD, thin); R(c, -60, -120, 120, 3.6, M.woodD, thin);
    // telhado
    const roof = A.path((q) => { q.M(-68, -118); q.L(0, -156); q.L(68, -118); q.L(62, -116); q.L(0, -150); q.L(-62, -116); q.Z(); }, S);
    const roofIn = A.path((q) => { q.M(-62, -118); q.L(0, -152); q.L(62, -118); q.Z(); }, S);
    K.paint(c, roofIn, M.roof, { depth: S * 0.6 }); K.paint(c, roof, M.woodD, { depth: S * 0.4 });
    c.save(); c.clip(roofIn); for (let y = -148; y < -118; y += 5) L(c, [[-70, y], [70, y]], 0.25, A.rgba('#000', 0.4)); c.restore();
    opening(c, arch(-6, -128, 12, 14), [0, -134, 9]);
    // janelas: duas acesas, uma com a portada partida
    opening(c, arch(-44, -76, 16, 26), [-36, -86, 14]); opening(c, arch(28, -76, 16, 26), null);
    P(c, [[44, -100], [52, -98], [52, -78], [44, -76]], M.woodD, thin); // portada solta
    opening(c, arch(-10, -76, 20, 28), [0, -88, 16]);
    for (const x of [-36, 0, 36]) R(c, x - 11, -75, 22, 2.4, M.stoneD, thin);
    // varanda de madeira
    R(c, -16, -72, 32, 3, M.wood, thin); for (let x = -14; x <= 14; x += 4) L(c, [[x, -72], [x, -66]], 0.7, M.woodD.base);
    // porta e degrau
    opening(c, arch(-12, -2, 24, 40), null);
    c.save(); c.clip(arch(-12, -2, 24, 40)); R(c, -11, -40, 22, 38, M.woodD, flat); for (const x of [-6, 0, 6]) L(c, [[x, -38], [x, -3]], 0.3, A.rgba('#000', 0.5)); c.restore();
    D(c, 6, -20, 0.9, M.bronze.light);
    R(c, -16, -2, 32, 2.4, M.stoneD, thin);
    // tabuleta pendurada
    L(c, [[30, -60], [44, -60]], 0.8, M.iron.base); L(c, [[38, -60], [38, -56]], 0.4, M.iron.base); L(c, [[44, -60], [44, -56]], 0.4, M.iron.base);
    R(c, 34, -56, 14, 9, M.wood, thin); E(c, 41, -51.5, 2.4, 2.4, M.bronze, thin, 10);
    // fuligem e fissuras
    crack(c, [[-50, -30], [-46, -24], [-48, -16]]); crack(c, [[44, -40], [40, -34]]);
    B(c, [[-56, -2], [-50, -7], [-40, -4], [-30, -8], [-22, -2]], M.moss, thin);
  }, { lights: [[-36, -86, 60, '#ff9a40'], [0, -88, 70, '#ffa850'], [0, -134, 40, '#ff9a40']] });
  // casa estreita e alta com torreão
  def('house', [-40, -190, 40, 1], (c) => {
    const body = rectP(-34, -128, 68, 128); K.paint(c, body, M.plaster, { depth: S * 0.8 });
    c.save(); c.clip(body); for (const y of [-128, -86, -44]) L(c, [[-34, y], [34, y]], 2.4, M.woodD.base); for (const x of [-34, 33]) L(c, [[x, -128], [x, 0]], 2.4, M.woodD.base); c.restore();
    bricks(c, rectP(-34, -40, 68, 40), -34, -40, 34, 0, 7);
    const tower = A.path((q) => { q.M(-40, -126); q.L(0, -188); q.L(40, -126); q.Z(); }, S); K.paint(c, tower, M.roof, { depth: S * 0.7 });
    c.save(); c.clip(tower); for (let i = -6; i <= 6; i++) L(c, [[0, -188], [i * 7, -126]], 0.25, A.rgba('#000', 0.35)); c.restore();
    L(c, [[0, -188], [0, -196]], 0.8, M.iron.base); P(c, [[0, -196], [6, -193], [0, -191]], M.iron, thin); // cata-vento
    opening(c, arch(-9, -96, 18, 26), [0, -106, 14]); opening(c, arch(-9, -52, 18, 24), null);
    c.save(); c.clip(arch(-9, -52, 18, 24)); for (const x of [-6, 0, 6]) L(c, [[x, -76], [x, -52]], 0.9, M.iron.base); c.restore();
    opening(c, arch(-10, -2, 20, 34), null); R(c, -14, -2, 28, 2.2, M.stoneD, thin);
    crack(c, [[22, -110], [26, -100], [22, -92]]);
  }, { lights: [[0, -106, 55, '#ff9a40']] });
  // calvário: cruz de madeira sobre degraus de pedra, pano branco, velas
  def('calvary', [-34, -112, 34, 1], (c) => {
    R(c, -32, -6, 64, 6, M.stoneD, { depth: S * 0.5 }); R(c, -24, -12, 48, 6, M.stone, { depth: S * 0.5 }); R(c, -14, -18, 28, 6, M.stoneL, { depth: S * 0.5 });
    Tb(c, [[0, -18], [0, -108]], [2.6, 2.4], M.wood, { flat: true, depth: S * 0.4 });
    Tb(c, [[-24, -84], [24, -84]], [2.2, 2.2], M.wood, { flat: true, depth: S * 0.4 });
    for (const y of [-100, -70, -40]) crack(c, [[-1, y], [1.4, y + 6]], 0.5);
    // pano a cair dos braços
    const cloth = A.path((q) => { q.M(-20, -86); q.Q(-12, -78, 0, -82); q.Q(12, -78, 20, -86); q.L(22, -70); q.Q(18, -62, 21, -50); q.L(16, -54); q.Q(10, -66, 0, -72); q.Q(-10, -66, -16, -54); q.L(-21, -50); q.Q(-18, -62, -22, -70); q.Z(); }, S);
    K.paint(c, cloth, M.clothW, { depth: S * 0.6 });
    c.save(); c.clip(cloth); for (const x of [-14, -6, 6, 14]) L(c, [[x, -84], [x * 1.2, -56]], 0.35, A.rgba('#4a4436', 0.45)); c.restore();
    // coroa de espinhos pendurada
    c.save(); c.lineWidth = S * 0.7; c.strokeStyle = '#2a1e14'; c.beginPath(); c.ellipse(0, -92 * S, 5 * S, 2.4 * S, 0, 0, A.TAU); c.stroke(); c.restore();
    for (let i = 0; i < 8; i++) { const a = i / 8 * A.TAU; L(c, [[Math.cos(a) * 5, -92 + Math.sin(a) * 2.4], [Math.cos(a) * 7, -92 + Math.sin(a) * 3.4 - 1]], 0.3, '#2a1e14'); }
    // velas nos degraus
    for (const [x, y, h] of [[-26, -6, 7], [-20, -6, 5], [21, -6, 8], [27, -6, 5], [-10, -18, 6], [11, -18, 4]]) { R(c, x - 1.2, y - h, 2.4, h, M.wax, thin); }
  }, { flames: [[-26, -13.6, 1], [-20, -11.6, 0.9], [21, -14.6, 1], [27, -11.6, 0.9], [-10, -24.6, 0.9], [11, -22.6, 0.8]] });

  // ===================================================================== crypt — Ossário
  // túmulo com jacente (cavaleiro de mãos postas)
  def('tomb', [-40, -44, 40, 1], (c) => {
    R(c, -38, -26, 76, 26, M.stoneD, { depth: S * 0.7 });
    for (const x of [-26, 0, 26]) { const n = arch(x - 8, -4, 16, 18); opening(c, n, null); }
    R(c, -40, -30, 80, 4, M.stone, thin);
    // jacente
    const body = A.path((q) => { q.M(-30, -30); q.Q(-30, -36, -22, -37); q.L(18, -37); q.Q(26, -36, 27, -30); q.Z(); }, S); K.paint(c, body, M.stoneL, { depth: S * 0.5 });
    E(c, -30, -34, 4, 3.6, M.stoneL, thin); // cabeça na almofada
    R(c, -36, -33, 6, 3, M.stone, thin);
    P(c, [[-8, -37], [-4, -44], [0, -37]], M.stoneL, thin); // mãos postas
    Tb(c, [[-20, -37.6], [22, -37.6]], [0.6, 0.6], M.stoneD, { flat: true }); // espada sobre o corpo
    crack(c, [[10, -24], [14, -14], [11, -6]]); B(c, [[-38, -1], [-30, -5], [-20, -2], [-10, -4], [0, -1]], M.moss, thin);
  });
  // arco de ossadas: crânios empilhados em fiadas, tíbias cruzadas na chave
  def('bonearch', [-46, -116, 46, 1], (c) => {
    const outer = arch(-44, 0, 88, 112), inner = arch(-28, 0, 56, 88);
    c.save(); c.fillStyle = '#0c0a0c'; c.fill(inner); c.restore();
    const ring = new Path2D(); ring.addPath(outer); ring.addPath(inner);
    c.save(); c.clip(ring, 'evenodd');
    c.fillStyle = M.bone.shadow; c.fillRect(-46 * S, -116 * S, 92 * S, 118 * S);
    for (let y = -6, r = 0; y > -116; y -= 7, r++) for (let x = -44 + (r % 2) * 4; x < 46; x += 8) {
      E(c, x, y, 3.6, 3.2, M.bone, { depth: S * 0.3, hlw: S * 0.15 }, 10);
      D(c, x - 1.2, y - 0.4, 0.8, '#1a1612'); D(c, x + 1.2, y - 0.4, 0.8, '#1a1612'); D(c, x, y + 1.6, 0.4, '#1a1612');
    }
    c.restore();
    c.save(); c.lineWidth = S * 0.5; c.strokeStyle = INK; c.stroke(outer); c.stroke(inner); c.restore();
    for (const s of [-1, 1]) Tb(c, [[-12 * s, -96], [12 * s, -108]], [1.2, 1.2], M.bone, thin);
    E(c, 0, -104, 5, 4.6, M.bone, { depth: S * 0.4 }, 12); D(c, -1.8, -104.6, 1.1, '#1a1612'); D(c, 1.8, -104.6, 1.1, '#1a1612');
  });

  // ===================================================================== r2 — Bastião das Vigílias
  // torre de vigia: pedra, seteiras, ameias, guarita de madeira e estandarte rasgado
  def('watchtower', [-42, -232, 42, 1], (c) => {
    const body = A.path((q) => { q.M(-34, 0); q.L(-30, -190); q.L(30, -190); q.L(34, 0); q.Z(); }, S);
    K.paint(c, body, M.stone, { depth: S * 0.9 }); bricks(c, body, -36, -190, 36, 0, 9);
    for (const y of [-40, -90, -140]) { opening(c, rectP(-2, y - 16, 4, 16), null); R(c, -5, y, 10, 2, M.stoneD, thin); }
    R(c, -38, -196, 76, 8, M.stoneD, { depth: S * 0.5 });
    for (let x = -38; x < 38; x += 14) R(c, x, -212, 8, 16, M.stone, { depth: S * 0.5 });
    // guarita de madeira a sair da torre
    R(c, 30, -172, 12, 26, M.wood, thin); for (let y = -168; y < -146; y += 5) L(c, [[30, y], [42, y]], 0.25, A.rgba('#000', 0.45));
    for (const y of [-146]) L(c, [[30, y], [42, y + 10]], 1, M.woodD.base);
    // mastro e estandarte
    Tb(c, [[-20, -212], [-20, -232]], [0.6, 0.5], M.wood, { flat: true });
    const flag = A.path((q) => { q.M(-20, -230); q.L(-2, -228); q.L(-6, -223); q.L(-1, -218); q.L(-20, -217); q.Z(); }, S); K.paint(c, flag, M.cloth, thin);
    // porta reforçada
    opening(c, arch(-10, -1, 20, 32), null); c.save(); c.clip(arch(-10, -1, 20, 32)); for (let y = -30; y < 0; y += 6) L(c, [[-10, y], [10, y]], 0.6, M.iron.base); c.restore();
    crack(c, [[22, -120], [26, -108], [22, -96]]); crack(c, [[-24, -60], [-20, -50]]);
    B(c, [[-34, -1], [-24, -6], [-14, -2], [0, -5], [12, -1]], M.moss, thin);
  }, { lights: [] });
  // trabuquete: armação de madeira, braço com contrapeso e funda
  def('trebuchet', [-58, -128, 58, 1], (c) => {
    for (const s of [-1, 1]) { Tb(c, [[s * 40, -2], [0, -88]], [2.4, 2], M.wood, { flat: true, depth: S * 0.4 }); }
    Tb(c, [[-52, -2], [52, -2]], [2.6, 2.6], M.woodD, { flat: true });
    Tb(c, [[-26, -44], [26, -44]], [1.4, 1.4], M.wood, { flat: true });
    for (const x of [-48, 48]) E(c, x, -4, 6, 6, M.woodD, { depth: S * 0.4 }, 12);
    // braço inclinado e contrapeso
    Tb(c, [[-46, -118], [34, -64]], [1.8, 2.4], M.wood, { flat: true, depth: S * 0.5 });
    E(c, 0, -88, 3, 3, M.iron, thin, 10);
    R(c, 26, -70, 18, 20, M.woodD, { depth: S * 0.5 }); for (const y of [-64, -56]) L(c, [[26, y], [44, y]], 0.6, M.iron.base);
    L(c, [[-46, -118], [-50, -86]], 0.4, M.wood.light); L(c, [[-46, -118], [-40, -88]], 0.4, M.wood.light);
    E(c, -45, -86, 4, 2.4, M.cloth, thin, 10); // funda
  });

  // ===================================================================== r3 — Forjas Afundadas
  // fornalha de tijolo: boca em arco a arder e chaminé alta
  def('furnace', [-50, -236, 50, 1], (c) => {
    const chimney = rectP(-14, -232, 28, 140); K.paint(c, chimney, M.brick, { depth: S * 0.8 }); bricks(c, chimney, -14, -232, 14, -92, 6);
    R(c, -17, -236, 34, 6, M.iron, thin); for (const y of [-200, -150]) R(c, -15, y, 30, 3, M.iron, thin);
    const body = A.path((q) => { q.M(-46, 0); q.L(-44, -82); q.Q(-40, -100, 0, -104); q.Q(40, -100, 44, -82); q.L(46, 0); q.Z(); }, S);
    K.paint(c, body, M.brick, { depth: S * 0.9 }); bricks(c, body, -48, -104, 48, 0, 7);
    // boca a arder
    const mouth = arch(-22, -6, 44, 46);
    c.save(); c.fillStyle = '#3a0e04'; c.fill(mouth); c.clip(mouth);
    const g = c.createRadialGradient(0, -14 * S, 2 * S, 0, -14 * S, 30 * S); g.addColorStop(0, '#fff2b0'); g.addColorStop(0.3, '#ffb040'); g.addColorStop(0.7, '#d04a10'); g.addColorStop(1, '#3a0c04'); c.fillStyle = g; c.fill(mouth);
    c.restore(); c.save(); c.lineWidth = S * 0.5; c.strokeStyle = INK; c.stroke(mouth); c.restore();
    // aduelas da boca e porta de ferro aberta
    for (let i = 0; i <= 8; i++) { const a = Math.PI + i / 8 * Math.PI; L(c, [[Math.cos(a) * 22, -28 + Math.sin(a) * 22], [Math.cos(a) * 28, -28 + Math.sin(a) * 28]], 0.4, A.rgba('#0a0808', 0.6)); }
    P(c, [[24, -2], [36, 2], [36, -40], [24, -46]], M.iron, { depth: S * 0.4 }); for (const y of [-36, -18]) D(c, 30, y, 0.9, M.iron.light);
    R(c, -48, -6, 96, 6, M.stoneD, thin);
    // fole encostado
    P(c, [[-46, -10], [-62, -22], [-62, -28], [-46, -24]], M.wood, thin);
  }, { flames: [[-10, -8, 3.4], [0, -8, 4.4], [10, -8, 3.4], [-4, -10, 3], [5, -10, 3]], lights: [[0, -20, 120, '#ff7a20']] });
  // grua de madeira: poste, lança, corrente com gancho e um lingote pendurado
  def('crane', [-30, -196, 74, 1], (c) => {
    R(c, -26, -8, 52, 8, M.stoneD, { depth: S * 0.5 });
    Tb(c, [[0, -8], [0, -186]], [3.2, 2.8], M.wood, { flat: true, depth: S * 0.5 });
    Tb(c, [[0, -170], [68, -186]], [2.2, 1.8], M.wood, { flat: true, depth: S * 0.5 });
    Tb(c, [[0, -120], [42, -178]], [1.4, 1.2], M.wood, { flat: true });
    for (const y of [-60, -110, -160]) R(c, -4, y, 8, 3, M.iron, thin);
    E(c, 0, -170, 4, 4, M.iron, thin, 12);
    // corrente e gancho com lingote
    for (let i = 0; i < 18; i++) { const y = -184 + i * 4.4; c.save(); c.lineWidth = S * 0.5; c.strokeStyle = M.iron.base; c.beginPath(); c.ellipse(64 * S, y * S, (i % 2 ? 0.5 : 1.4) * S, 2.2 * S, 0, 0, A.TAU); c.stroke(); c.restore(); }
    Tb(c, [[64, -104], [64, -98], [60, -94], [56, -98]], [0.9, 0.9, 0.8, 0.6], M.iron, { flat: true });
    P(c, [[50, -92], [70, -92], [74, -84], [46, -84]], A.mat('#8a4a24', { shadow: '#4a2210', light: '#ff9a40' }), { depth: S * 0.4 });
  }, { lights: [[60, -88, 40, '#ff7020']] });

  // ===================================================================== r4 — Jardins Afogados
  // fonte de três taças, com musgo e água a correr
  def('fountain', [-44, -104, 44, 1], (c) => {
    const basin = A.path((q) => { q.M(-42, 0); q.L(-40, -18); q.L(40, -18); q.L(42, 0); q.Z(); }, S); K.paint(c, basin, M.stone, { depth: S * 0.7 });
    R(c, -44, -21, 88, 4, M.stoneL, thin);
    R(c, -36, -17, 72, 3, M.water, flat);
    Tb(c, [[0, -18], [0, -60]], [4, 3], M.stone, { flat: true, depth: S * 0.5 });
    const t1 = A.path((q) => { q.M(-26, -58); q.Q(0, -48, 26, -58); q.L(24, -62); q.L(-24, -62); q.Z(); }, S); K.paint(c, t1, M.stone, { depth: S * 0.6 });
    Tb(c, [[0, -62], [0, -86]], [2.4, 2], M.stone, { flat: true, depth: S * 0.5 });
    const t2 = A.path((q) => { q.M(-14, -84); q.Q(0, -78, 14, -84); q.L(13, -87); q.L(-13, -87); q.Z(); }, S); K.paint(c, t2, M.stone, { depth: S * 0.6 });
    E(c, 0, -94, 4, 6, M.stoneL, { depth: S * 0.5 }, 12); // pinha no topo
    // água a cair das taças
    for (const [x0, y0, y1] of [[-22, -60, -20], [22, -60, -20], [-12, -86, -64], [12, -86, -64], [0, -100, -88]]) {
      c.save(); const g = c.createLinearGradient(0, y0 * S, 0, y1 * S); g.addColorStop(0, 'rgba(150,210,220,0.75)'); g.addColorStop(1, 'rgba(120,190,200,0.25)');
      c.strokeStyle = g; c.lineWidth = S * 1.1; c.beginPath(); c.moveTo(x0 * S, y0 * S); c.quadraticCurveTo((x0 * 1.15) * S, (y0 + 4) * S, (x0 * 1.2) * S, y1 * S); c.stroke(); c.restore();
    }
    for (const p of [[[-42, -2], [-30, -8], [-18, -4], [-8, -10], [4, -6]], [[-26, -60], [-16, -63], [-8, -61]], [[8, -86], [14, -88], [13, -84]]]) B(c, p, M.moss, thin);
  });
  // pérgula de ferro com trepadeiras e lanternas verdes
  def('pergola', [-58, -112, 58, 1], (c) => {
    for (const x of [-50, 50]) { Tb(c, [[x, 0], [x, -86]], [1.6, 1.4], M.iron, { flat: true }); R(c, x - 4, -4, 8, 4, M.stoneD, thin); }
    c.save(); c.lineWidth = S * 1.6; c.strokeStyle = M.iron.base; c.beginPath(); c.moveTo(-50 * S, -86 * S); c.quadraticCurveTo(0, -128 * S, 50 * S, -86 * S); c.stroke();
    c.lineWidth = S * 0.7; c.beginPath(); c.moveTo(-50 * S, -76 * S); c.quadraticCurveTo(0, -112 * S, 50 * S, -76 * S); c.stroke(); c.restore();
    for (let i = 0; i <= 8; i++) { const t = i / 8, x = -50 + t * 100, y = -86 - Math.sin(t * Math.PI) * 21; L(c, [[x, y], [x, y + 10]], 0.4, M.iron.base); }
    // trepadeiras a subir e a pender
    const r = A.rng(5);
    for (const x0 of [-50, 50]) for (let y = -6; y > -88; y -= 6) { const s = r() > 0.5 ? 1 : -1; E(c, x0 + s * 2.6, y, 2.6, 1.2, r() > 0.5 ? M.leaf : M.moss, flat, 8); }
    for (let i = 0; i < 26; i++) { const t = r(), x = -50 + t * 100, y = -86 - Math.sin(t * Math.PI) * 21 + 2; E(c, x, y + r() * 4, 2.8, 1.3, r() > 0.4 ? M.leaf : M.moss, flat, 8); }
    for (const x of [-30, 8, 34]) { const y = -86 - Math.sin(((x + 50) / 100) * Math.PI) * 21; L(c, [[x, y], [x + 1, y + 18 + (x % 7)]], 0.5, M.leaf.base); }
    // lanternas
    for (const x of [-18, 22]) { const y = -86 - Math.sin(((x + 50) / 100) * Math.PI) * 21 + 4; L(c, [[x, y], [x, y + 8]], 0.4, M.iron.base); P(c, [[x - 3, y + 8], [x + 3, y + 8], [x + 2.4, y + 15], [x - 2.4, y + 15]], A.mat('#6aa070', { light: '#c8ffb0', shadow: '#2a4a30' }), thin); }
  }, { lights: [[-18, -116 + 30, 50, '#c8ffb0'], [22, -116 + 30, 50, '#c8ffb0']] });

  // ===================================================================== r5 — Torre dos Sinos
  // armação de madeira com um sino grande de bronze
  def('bellframe', [-50, -132, 50, 1], (c) => {
    for (const s of [-1, 1]) { Tb(c, [[s * 46, 0], [s * 34, -124]], [2.6, 2.2], M.wood, { flat: true, depth: S * 0.5 }); Tb(c, [[s * 46, -4], [s * 20, -50]], [1.2, 1], M.woodD, { flat: true }); }
    Tb(c, [[-44, -122], [44, -122]], [3, 3], M.wood, { flat: true, depth: S * 0.5 });
    for (const x of [-10, 10]) Tb(c, [[x, -120], [x, -110]], [1, 1], M.iron, { flat: true });
    const bell = A.path((q) => { q.M(-8, -108); q.Q(-10, -96, -14, -80); q.Q(-18, -66, -28, -60); q.L(28, -60); q.Q(18, -66, 14, -80); q.Q(10, -96, 8, -108); q.Q(0, -112, -8, -108); q.Z(); }, S);
    K.paint(c, bell, M.bronze, { depth: S * 1.0, hlw: S * 0.5 });
    c.save(); c.clip(bell); for (const y of [-100, -72, -66]) L(c, [[-30, y], [30, y]], 0.6, A.rgba(M.bronze.deep, 0.6)); L(c, [[-6, -104], [-12, -62]], 0.8, A.rgba(M.bronze.light, 0.5)); c.restore();
    E(c, 0, -58, 4, 3, M.bronze, thin, 10); // badalo
    L(c, [[22, -84], [26, -10]], 0.6, M.wood.light); // corda
    R(c, -50, -4, 100, 4, M.woodD, thin);
  });
  // engrenagens do relógio dos sinos
  def('gears', [-54, -118, 54, 1], (c) => {
    R(c, -50, -8, 100, 8, M.woodD, thin); for (const x of [-44, 44]) Tb(c, [[x, -8], [x, -112]], [2.4, 2.2], M.wood, { flat: true });
    Tb(c, [[-46, -110], [46, -110]], [2, 2], M.wood, { flat: true });
    const gear = (cx, cy, r, n, m) => {
      const pts = []; for (let i = 0; i < n * 2; i++) { const a = i / (n * 2) * A.TAU, rr = i % 2 ? r : r + 3.4; pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]); }
      P(c, pts, m, { depth: S * 0.5 });
      E(c, cx, cy, r * 0.62, r * 0.62, A.mat('#14100c', {}), { ink: false, hl: false }, 18);
      for (let i = 0; i < 4; i++) { const a = i / 4 * A.TAU + 0.4; Tb(c, [[cx + Math.cos(a) * r * 0.2, cy + Math.sin(a) * r * 0.2], [cx + Math.cos(a) * r * 0.66, cy + Math.sin(a) * r * 0.66]], [1.2, 1], m, { flat: true }); }
      E(c, cx, cy, r * 0.22, r * 0.22, m, thin, 12);
    };
    gear(-14, -60, 26, 14, M.bronze); gear(26, -86, 15, 9, M.iron); gear(28, -40, 11, 7, M.bronze);
  });

  // ===================================================================== r6 — Catedral do Crepúsculo
  // retábulo barroco dourado: três calles com nichos e santos, colunas torsas, sol de chamas no topo, altar com toalha
  def('retablo', [-70, -206, 70, 1], (c) => {
    const back = A.path((q) => { q.M(-64, -28); q.L(-64, -150); q.Q(-64, -176, -30, -182); q.Q(0, -206, 30, -182); q.Q(64, -176, 64, -150); q.L(64, -28); q.Z(); }, S);
    K.paint(c, back, M.woodD, { depth: S * 0.8 });
    c.save(); c.clip(back); c.fillStyle = A.rgba(M.gold.base, 0.18); for (let y = -200; y < -28; y += 6) c.fillRect(-64 * S, y * S, 128 * S, S * 0.6); c.restore();
    // nichos com santos
    const saint = (x, y, h, m) => {
      const robe = A.path((q) => { q.M(x - 6, y); q.Q(x - 7, y - h * 0.5, x - 4, y - h * 0.82); q.L(x + 4, y - h * 0.82); q.Q(x + 7, y - h * 0.5, x + 6, y); q.Z(); }, S);
      K.paint(c, robe, m, { depth: S * 0.5 }); E(c, x, y - h * 0.9, 3, 3.4, M.wax, thin, 10);
      c.save(); c.lineWidth = S * 0.6; c.strokeStyle = M.gold.light; c.beginPath(); c.arc(x * S, (y - h * 0.92) * S, 5 * S, Math.PI * 1.05, Math.PI * 1.95); c.stroke(); c.restore();
    };
    for (const [x, w, h, m] of [[-42, 22, 56, M.cloth], [0, 28, 74, A.mat('#2a3a6a', { shadow: '#141e3a', light: '#4a5a9a' })], [42, 22, 56, M.cloth]]) {
      const n = arch(x - w / 2, -40, w, h); opening(c, n, null);
      c.save(); c.clip(n); const g = c.createLinearGradient(0, (-40 - h) * S, 0, -40 * S); g.addColorStop(0, 'rgba(255,200,120,0.25)'); g.addColorStop(1, 'rgba(60,20,10,0.1)'); c.fillStyle = g; c.fill(n); c.restore();
      saint(x, -42, h - 8, m);
      c.save(); c.lineWidth = S * 1.4; c.strokeStyle = M.gold.base; c.stroke(n); c.lineWidth = S * 0.4; c.strokeStyle = M.gold.light; c.stroke(n); c.restore();
    }
    // segundo corpo: nichos pequenos
    for (const x of [-30, 30]) { const n = arch(x - 8, -112, 16, 30); opening(c, n, null); saint(x, -114, 22, M.clothW); c.save(); c.lineWidth = S; c.strokeStyle = M.gold.base; c.stroke(n); c.restore(); }
    // colunas torsas douradas
    for (const x of [-60, -22, 22, 60]) {
      Tb(c, [[x, -36], [x, -132]], [2.6, 2.4], M.gold, { flat: true, depth: S * 0.4 });
      for (let y = -134; y < -36; y += 7) L(c, [[x - 2.6, y], [x + 2.6, y + 5]], 0.5, A.rgba(M.gold.deep, 0.7));
      R(c, x - 4, -138, 8, 4, M.gold, thin); R(c, x - 4, -38, 8, 4, M.gold, thin);
    }
    R(c, -66, -140, 132, 5, M.gold, { depth: S * 0.4 });
    // sol de chamas no topo
    for (let i = 0; i < 16; i++) { const a = i / 16 * A.TAU, r0 = 9, r1 = i % 2 ? 18 : 24; P(c, [[Math.cos(a - 0.12) * r0, -166 + Math.sin(a - 0.12) * r0], [Math.cos(a) * r1, -166 + Math.sin(a) * r1], [Math.cos(a + 0.12) * r0, -166 + Math.sin(a + 0.12) * r0]], M.gold, thin); }
    E(c, 0, -166, 9, 9, M.gold, { depth: S * 0.5 }, 18); E(c, 0, -166, 4, 4, A.mat('#ffe8a0', { light: '#fffbe8', shadow: '#c09040' }), thin, 12);
    // altar com toalha e castiçais
    R(c, -50, -28, 100, 28, M.stoneD, { depth: S * 0.6 });
    const cloth = A.path((q) => { q.M(-52, -30); q.L(52, -30); q.L(52, -12); q.L(40, -16); q.L(28, -12); q.L(14, -16); q.L(0, -12); q.L(-14, -16); q.L(-28, -12); q.L(-40, -16); q.L(-52, -12); q.Z(); }, S);
    K.paint(c, cloth, M.clothW, { depth: S * 0.5 }); L(c, [[-52, -28], [52, -28]], 1, M.cloth.base);
    for (const x of [-38, -18, 18, 38]) { R(c, x - 1.6, -40, 3.2, 10, M.gold, thin); R(c, x - 1.1, -48, 2.2, 8, M.wax, thin); }
  }, { flames: [[-38, -49.6, 1], [-18, -49.6, 1], [18, -49.6, 1], [38, -49.6, 1]], lights: [[0, -60, 110, '#ffc070'], [0, -166, 70, '#ffd890']] });
  // órgão de tubos: caixa de madeira entalhada, tubos de estanho em três torres
  def('organ', [-60, -196, 60, 1], (c) => {
    R(c, -54, -46, 108, 46, M.woodD, { depth: S * 0.7 }); R(c, -56, -50, 112, 5, M.wood, thin);
    for (const x of [-40, -14, 14, 40]) { const n = arch(x - 9, -6, 18, 30); opening(c, n, null); c.save(); c.lineWidth = S * 0.6; c.strokeStyle = M.gold.base; c.stroke(n); c.restore(); }
    const pipe = (x, top, w, m) => { const p = A.path((q) => { q.M(x - w / 2, -50); q.L(x - w / 2, top); q.Q(x, top - w * 0.5, x + w / 2, top); q.L(x + w / 2, -50); q.Z(); }, S); K.paint(c, p, m, { depth: S * 0.5, hlw: S * 0.3 });
      const mo = A.path((q) => { q.M(x - w / 2 + 0.6, -60); q.L(x, -64); q.L(x + w / 2 - 0.6, -60); q.L(x + w / 2 - 0.6, -57); q.L(x - w / 2 + 0.6, -57); q.Z(); }, S); c.save(); c.fillStyle = '#0c0a0c'; c.fill(mo); c.restore(); };
    const tin = A.mat('#8a8a94', { shadow: '#4a4a54', light: '#d0d0dc', deep: '#1a1a20' });
    for (let i = -6; i <= 6; i++) { const x = i * 8, h = 132 - Math.abs(i) * 12 + (i % 2 ? -8 : 0); pipe(x, -50 - h, 6.4, Math.abs(i) % 3 === 1 ? K.dim(tin, 0.8) : tin); }
    // cornija dourada e pináculos assentes nos cantos da caixa
    R(c, -56, -54, 112, 4, M.gold, thin);
    for (const x of [-52, 52]) { P(c, [[x - 3, -54], [x + 3, -54], [x, -66]], M.gold, thin); E(c, x, -67, 1.6, 1.6, M.gold, thin, 10); }
  });

  // ===================================================================== r7 — Palácio Real
  // arcada: duas colunas de mármore com capitéis de ouro, arco e cortinas carmesim
  def('colonnade', [-62, -186, 62, 1], (c) => {
    for (const x of [-48, 48]) {
      R(c, x - 10, -10, 20, 10, M.marble, { depth: S * 0.5 }); R(c, x - 8, -14, 16, 4, M.marble, thin);
      const sh = rectP(x - 6, -150, 12, 136); K.paint(c, sh, M.marble, { depth: S * 0.7 });
      c.save(); c.clip(sh); for (const dx of [-3, 0, 3]) L(c, [[x + dx, -150], [x + dx, -14]], 0.35, A.rgba('#3a363c', 0.45)); c.restore();
      P(c, [[x - 10, -150], [x + 10, -150], [x + 7, -158], [x - 7, -158]], M.gold, { depth: S * 0.4 });
      for (const s of [-1, 1]) E(c, x + s * 7, -155, 2.6, 2.6, M.gold, thin, 10);
    }
    const a = A.path((q) => { q.M(-58, -158); q.L(-58, -168); q.Q(0, -214, 58, -168); q.L(58, -158); q.Q(0, -196, -58, -158); q.Z(); }, S);
    K.paint(c, a, M.marble, { depth: S * 0.6 }); E(c, 0, -186, 6, 7, M.gold, { depth: S * 0.5 }, 12);
    // cortinas presas às colunas
    for (const s of [-1, 1]) {
      const cu = A.path((q) => { q.M(s * 40, -162); q.Q(s * 22, -150, s * 12, -150); q.Q(s * 22, -110, s * 38, -80); q.Q(s * 30, -50, s * 36, -16); q.L(s * 42, -16); q.Q(s * 42, -90, s * 42, -162); q.Z(); }, S);
      K.paint(c, cu, M.cloth, { depth: S * 0.7 });
      c.save(); c.clip(cu); for (const k of [0.3, 0.6]) L(c, [[s * (40 - k * 20), -160], [s * (40 - k * 8), -20]], 0.4, A.rgba('#1a0408', 0.5)); c.restore();
      Tb(c, [[s * 34, -84], [s * 42, -82]], [1, 1], M.gold, { flat: true });
    }
  });
  // estátua do rei: coroado, manto, montante apoiado à frente, em pedestal alto
  def('kingstatue', [-34, -198, 34, 1], (c) => {
    R(c, -30, -12, 60, 12, M.stoneD, { depth: S * 0.6 }); R(c, -24, -70, 48, 58, M.stone, { depth: S * 0.7 }); R(c, -28, -74, 56, 5, M.stoneL, thin);
    R(c, -12, -54, 24, 22, M.stoneD, flat); for (const y of [-48, -42, -36]) L(c, [[-9, y], [9, y]], 0.4, A.rgba('#c8b080', 0.35)); // placa com nome apagado
    const robe = A.path((q) => { q.M(-18, -74); q.Q(-20, -120, -12, -150); q.L(12, -150); q.Q(20, -120, 18, -74); q.Z(); }, S);
    K.paint(c, robe, A.mat('#3e3a36', { shadow: '#1e1c1a', light: '#6e6862', deep: '#0e0c0a' }), { depth: S * 0.9 });
    c.save(); c.clip(robe); for (const x of [-10, -4, 4, 10]) L(c, [[x * 0.6, -148], [x * 1.4, -76]], 0.5, A.rgba('#0e0c0a', 0.55)); c.restore();
    E(c, 0, -160, 7, 8.4, A.mat('#4a4642', { shadow: '#24221f', light: '#7a746e' }), { depth: S * 0.6 }, 16);
    P(c, [[-8, -166], [-8, -176], [-4, -171], [0, -180], [4, -171], [8, -176], [8, -166]], M.gold, thin); // coroa
    // montante apoiado, mãos no punho
    Tb(c, [[0, -74], [0, -132]], [1.6, 1.4], M.iron, { flat: true }); R(c, -10, -134, 20, 3, M.iron, thin); E(c, 0, -138, 3, 3, M.iron, thin, 10);
    E(c, -3, -131, 3, 2.4, A.mat('#4a4642', { light: '#7a746e' }), thin, 10); E(c, 3, -131, 3, 2.4, A.mat('#4a4642', { light: '#7a746e' }), thin, 10);
    crack(c, [[10, -120], [14, -108], [10, -96]]); crack(c, [[-16, -60], [-12, -50]]);
  });

  // ---------------------------------------------------------------- render + atlas
  function render(d, seed) {
    const [x0, y0, x1, y1] = d.box, pad = 2;
    const w = (x1 - x0 + pad * 2) * S, h = (y1 - y0 + pad * 2) * S;
    const cv = A.mk(w, h), c = cv.getContext('2d');
    c.translate((-x0 + pad) * S, (-y0 + pad) * S);
    d.draw(c);
    const out = A.outline(cv, S * 0.3, INK);
    A.grain(out, 0.05, seed);
    return { cv: out, ox: (-x0 + pad) * S, oy: (-y0 + pad) * S };
  }
  function crop(r) {
    const c = r.cv.getContext('2d'), { width: w, height: h } = r.cv, d = c.getImageData(0, 0, w, h).data;
    let minX = w, minY = h, maxX = -1, maxY = -1;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (d[(y * w + x) * 4 + 3] > 4) { if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y; }
    if (maxX < 0) return r;
    minX = Math.max(0, minX - 2); minY = Math.max(0, minY - 2); maxX = Math.min(w - 1, maxX + 2); maxY = Math.min(h - 1, maxY + 2);
    const o = A.mk(maxX - minX + 1, maxY - minY + 1); o.getContext('2d').drawImage(r.cv, -minX, -minY);
    return { cv: o, ox: r.ox - minX, oy: r.oy - minY };
  }
  A.register('structs', () => {
    const items = [];
    let seed = 41;
    for (const k of Object.keys(DEF)) DEF[k].forEach((d, v) => { const r = crop(render(d, seed++)); items.push({ k, v, d, r }); });
    const W = 2048; items.sort((a, b) => b.r.cv.height - a.r.cv.height);
    let x = 0, y = 0, rowH = 0;
    for (const it of items) { const iw = it.r.cv.width, ih = it.r.cv.height; if (x + iw > W) { x = 0; y += rowH + 2; rowH = 0; } it.sx = x; it.sy = y; x += iw + 2; rowH = Math.max(rowH, ih); }
    const H = y + rowH;
    const atlas = A.mk(W, H), ac = atlas.getContext('2d');
    const meta = { S, items: {} };
    for (const it of items) {
      ac.drawImage(it.r.cv, it.sx, it.sy);
      const e = [it.sx, it.sy, it.r.cv.width, it.r.cv.height, it.r.ox, it.r.oy, it.d.box];
      const o = {}; for (const f of ['flames', 'lights']) if (it.d[f] !== undefined) o[f] = it.d[f];
      e.push(o);
      (meta.items[it.k] = meta.items[it.k] || [])[it.v] = e;
    }
    const js = "'use strict';\n(window.VS = window.VS || {}).STRUCT_META = " + JSON.stringify(meta) + ";\n";
    return { images: { structs: atlas }, meta: { dir: 'props', js }, kind: 'images' };
  });
  A.STRUCT_DEF = DEF;
})(window.ART);
