// Vesperal — A Mãe-Mariposa (subchefe dos Jardins): traça gigante e velha, de pelo cor de cinza e umbra, com a
// marca de uma caveira pálida no dorso do tórax, gola de penugem branca, antenas de pluma como uma coroa e olhos
// compostos de ouro baço. Asas anteriores cor de marfim sujo com ocelos enormes (olhos pintados) e franja escura;
// as posteriores, cor de rosa-velho e ocre. Nas patas da frente aninha um casulo — a sua cria — que brilha.
// Depois de largar o pó, pousa para descansar com as asas fechadas em tenda (o ponto fraco).
// Âncora ao centro (voa). Exportada a ×1.75. → assets/sprites/en_b_mariposa.png
'use strict';
(function (A) {
  const S = 5, K = A.kit(S), D2R = A.D2R;
  const M = {
    fur: A.mat('#5e5246', { shadow: '#322a22', light: '#8e8070', deep: '#140f0b' }),
    ruff: A.mat('#d8d0c0', { shadow: '#948a78', light: '#f6f0e4', deep: '#3a342a' }),
    wing: A.mat('#a09278', { shadow: '#625844', light: '#d2c4a4', deep: '#241e16' }),
    wingB: A.mat('#8e5e50', { shadow: '#56342a', light: '#b8826e', deep: '#1e0e0a' }),
    cocoon: A.mat('#d8c8a0', { shadow: '#9a8a64', light: '#f8ecd0' }),
    leg: '#22180f', dark: '#2a1e14', ocher: '#c0883a', bone: '#e8e0cc',
  };
  const rig = new A.Rig([{ n: 'root', len: 1, a: 0 }]);
  const lerp = A.lerp;
  // asa em vista lateral; sy = abertura (1 = para cima, −1 = para baixo); ox,oy = raiz no tórax;
  // rot = rotação em graus à volta da raiz (asas fechadas em tenda); eyes = mostrar os ocelos
  let seed = 1; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  function wing(ctx, fore, m, k, near, sy, ox, oy, rot, eyes) {
    const L = fore ? 20 : 14.5, Hh = fore ? 21 : 14, f = Math.sign(sy || 1) * Math.max(0.14, Math.abs(sy));
    const P = (u, v) => [-u * L, -v * Hh * f];
    const pts = fore
      ? [[0, 0], [-0.06, 0.4], [0.02, 0.78], [0.16, 1.04], [0.3, 1.14], [0.42, 1.02], [0.52, 0.96], [0.62, 0.86], [0.72, 0.8], [0.82, 0.66], [0.9, 0.58], [0.98, 0.42], [0.86, 0.26], [0.6, 0.12], [0.3, 0.03]]
      : [[0.06, 0], [0.08, 0.4], [0.24, 0.74], [0.4, 0.9], [0.52, 0.84], [0.64, 0.9], [0.78, 0.76], [0.9, 0.7], [1.0, 0.5], [0.98, 0.26], [0.7, 0.04]];
    ctx.save(); ctx.translate(ox * S, oy * S); if (rot) ctx.rotate(rot * D2R);
    const path = K.blobPath(pts.map(([u, v]) => P(u, v)));
    K.paint(ctx, path, m, { depth: S * 0.5, hlw: S * 0.3 });
    ctx.save(); ctx.clip(path);
    seed = fore ? 7 : 13;
    // manchas (escamas) — textura críptica
    for (let i = 0; i < 46; i++) { const u = rnd(), v = rnd() * 1.1, q = P(u, v); K.dot(ctx, q[0], q[1], 0.3 + rnd() * 0.7, A.rgba(rnd() < 0.5 ? m.deep : m.light, (0.12 + rnd() * 0.16) * k)); }
    // nervuras
    for (let i = 0; i < 6; i++) A.stroke(ctx, [P(0.03, 0.03), P(0.22 + i * 0.12, 0.5 + 0.08 * Math.sin(i)), P(0.12 + i * 0.16, 1.12 - i * 0.14)], S * 0.1, A.rgba(m.deep, 0.35 * k), S);
    if (fore) { // linhas onduladas transversais e orla escura
      for (const [v0, w] of [[0.36, 0.5], [0.72, 0.7]]) { const line = []; for (let j = 0; j <= 8; j++) { const u = j / 8; line.push(P(u * 0.95, v0 - u * 0.2 * w + Math.sin(j * 1.9) * 0.04)); } A.stroke(ctx, line, S * 0.3, A.rgba(m.deep, 0.55 * k), S); }
      A.stroke(ctx, [P(0.12, 1.08), P(0.32, 1.12), P(0.6, 0.88), P(0.86, 0.64), P(0.98, 0.42)], S * 1.8, A.rgba(m.deep, 0.5 * k), S);
    } else {
      A.stroke(ctx, [P(0.16, 0.5), P(0.46, 0.66), P(0.86, 0.6)], S * 1.6, A.rgba(M.ocher, 0.6 * k), S);
      A.stroke(ctx, [P(0.24, 0.8), P(0.6, 0.86), P(0.96, 0.5)], S * 1.0, A.rgba(m.deep, 0.6 * k), S);
    }
    // ocelo (olho pintado) nas asas da frente — só quando abertas e a ameaçar
    if (fore && eyes && Math.abs(f) > 0.28) {
      const [cx, cy] = P(0.46, 0.6), ry = 3.4 * Math.abs(f);
      const el = (rx, rr, col) => { ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(cx * S, cy * S, rx * S, rr * S, 0, 0, A.TAU); ctx.fill(); };
      el(3.9, ry * 1.12, A.rgba('#1a120c', k)); el(3.2, ry * 0.92, A.rgba('#8a4a22', k)); el(2.3, ry * 0.66, A.rgba('#c0883a', k)); el(1.3, ry * 0.4, A.rgba('#0a0605', k));
      ctx.save(); ctx.beginPath(); ctx.ellipse(cx * S, cy * S, 1.3 * S, ry * 0.4 * S, 0, 0, A.TAU); ctx.clip();
      ctx.fillStyle = A.rgba('#c8d8e8', k * (near ? 0.9 : 0.5)); ctx.beginPath(); ctx.ellipse((cx - 0.5) * S, (cy - 0.4 * f) * S, 0.9 * S, 0.7 * Math.abs(f) * S + 0.5, -0.5, 0, A.TAU); ctx.fill(); ctx.restore();
    }
    ctx.restore();
    ctx.restore();
  }
  // perna fina de inseto (três segmentos) do ponto a para o alvo b, com o joelho para cima
  function leg(ctx, a, b, kn, col) {
    const m = [(a[0] + b[0]) / 2 + kn[0], (a[1] + b[1]) / 2 + kn[1]];
    A.stroke(ctx, [a, m, b], S * 0.34, col, S);
    A.stroke(ctx, [b, [b[0] + 0.6, b[1] + 0.8]], S * 0.24, col, S);
  }
  function draw(ctx, W, x) {
    const tilt = (x.tilt || 0) * D2R, sy = x.sy === undefined ? 1 : x.sy, rest = x.rest || 0, br = x.breath || 0;
    const dy = rest > 0.5 ? 5.0 : 0;
    ctx.save(); ctx.translate(0, dy * S); ctx.rotate(tilt);
    // asas de longe (escuras), atrás do corpo
    const fold = x.fold || 0, eyes = !fold && (x.eyes === undefined ? 1 : x.eyes);
    if (!fold) wing(ctx, false, K.dim(M.wingB, 0.62), 0.7, false, sy * 0.9, -2.0, -2.2, 0, eyes);
    wing(ctx, true, K.dim(M.wing, 0.6), 0.7, false, fold ? 0.9 : sy, -0.4, -3.0, fold * -78, eyes);
    // patas: em voo penduradas, em repouso apoiadas no chão (y = +13)
    const gy = 13.2 - dy;
    const legs = [[[1.4, 2.0], [4.4, 6.0]], [[-0.4, 2.4], [0.6, 7.2]], [[-2.2, 2.2], [-3.6, 6.6]]];
    legs.forEach(([a, b], i) => {
      const tb = rest > 0.5 ? [[6.8, gy], [0.8, gy], [-6.4, gy]][i] : [b[0] + (x.legs || 0) * (1 + i * 0.4), b[1] + Math.abs(x.legs || 0) * 0.6];
      leg(ctx, a, tb, rest > 0.5 ? [[2.4, -3.6], [1.0, -4.0], [-2.2, -3.6]][i] : [1.2, -0.6], A.mix(M.leg, '#000', 0.3));
    });
    // abdómen felpudo segmentado (desce para trás) — respira
    const ab = K.tube(ctx, [[-1.4, 0.6], [-4.6, 3.6 + br * 0.3], [-7.4, 7.4 + br * 0.4], [-8.8, 10.0 + br * 0.5]], [3.8, 3.6 + br * 0.3, 2.8, 1.2], M.fur, { depth: S * 0.8, hlw: S * 0.35 });
    ctx.save(); ctx.clip(ab);
    for (let i = 0; i < 6; i++) { const k = i / 6; const c = [lerp(-2.2, -8.6, k), lerp(1.2, 9.6, k)]; K.line(ctx, [[c[0] - 3.6, c[1] - 2.0], [c[0] + 3.2, c[1] + 2.6]], 0.4, A.rgba(M.fur.deep, 0.55)); K.line(ctx, [[c[0] - 3.0, c[1] - 1.4], [c[0] + 2.8, c[1] + 2.8]], 0.18, A.rgba(M.fur.light, 0.35)); }
    ctx.restore();
    // tórax grande com a marca da caveira
    const th = K.blob(ctx, [[-4.4, -1.6], [-2.6, -5.4], [1.4, -6.2], [4.6, -4.0], [5.4, -0.4], [4.0, 3.0], [0.2, 4.0], [-3.6, 2.6]], M.fur, { depth: S * 0.9, hlw: S * 0.45 });
    ctx.save(); ctx.clip(th);
    for (let i = 0; i < 18; i++) { const a = i / 18 * A.TAU; K.line(ctx, [[0.4 + Math.cos(a) * 2, -1.2 + Math.sin(a) * 2], [0.4 + Math.cos(a) * 5.4, -1.2 + Math.sin(a) * 4.6]], 0.14, A.rgba(M.fur.light, 0.25)); }
    // caveira pálida no dorso
    const sk = K.blobPath([[-2.6, -3.2], [-1.6, -5.0], [0.6, -5.4], [2.0, -4.4], [2.2, -2.6], [1.2, -1.4], [0.6, -0.4], [-0.8, -0.4], [-1.4, -1.4], [-2.4, -2.0]]);
    ctx.fillStyle = A.rgba(M.bone, 0.85); ctx.fill(sk);
    ctx.fillStyle = '#2a1e14'; for (const [ex, ey] of [[-1.2, -3.0], [0.9, -3.2]]) { ctx.beginPath(); ctx.ellipse(ex * S, ey * S, 0.6 * S, 0.7 * S, 0, 0, A.TAU); ctx.fill(); }
    K.line(ctx, [[-0.6, -1.0], [0.4, -1.0]], 0.2, '#2a1e14'); K.line(ctx, [[-0.2, -1.6], [-0.1, -0.5]], 0.14, '#2a1e14');
    ctx.restore();
    // gola de penugem branca
    const ruff = []; for (let i = 0; i <= 10; i++) { const a = (-150 + i * 22) * D2R, r = i % 2 ? 4.6 : 6.0; ruff.push([4.0 + Math.cos(a) * r * 0.55, -1.2 + Math.sin(a) * r]); }
    K.blob(ctx, ruff, M.ruff, { depth: S * 0.5, hlw: S * 0.3, light: [0.4, -1] });
    // cabeça: olhos compostos, peças da boca, antenas de pluma
    const hd = [6.2, -1.6];
    K.blob(ctx, [[hd[0] - 2.0, hd[1] - 2.0], [hd[0] + 0.8, hd[1] - 2.8], [hd[0] + 2.8, hd[1] - 1.2], [hd[0] + 2.6, hd[1] + 1.6], [hd[0] + 0.4, hd[1] + 2.6], [hd[0] - 1.8, hd[1] + 1.6]], M.fur, { depth: S * 0.4 });
    const eg = ctx.createRadialGradient((hd[0] + 1.2) * S, (hd[1] - 0.5) * S, 0, (hd[0] + 1.2) * S, (hd[1] - 0.5) * S, 1.7 * S);
    eg.addColorStop(0, A.rgba('#f8e4a0', x.eye === undefined ? 1 : Math.min(1, x.eye))); eg.addColorStop(0.5, '#a07a30'); eg.addColorStop(1, '#2a1a08');
    ctx.fillStyle = eg; ctx.beginPath(); ctx.ellipse((hd[0] + 1.2) * S, (hd[1] - 0.5) * S, 1.6 * S, 1.8 * S, 0, 0, A.TAU); ctx.fill();
    ctx.lineWidth = S * 0.2; ctx.strokeStyle = '#120c06'; ctx.stroke();
    for (let i = 0; i < 5; i++) for (let j = 0; j < 5; j++) K.dot(ctx, hd[0] + 0.2 + i * 0.5, hd[1] - 1.6 + j * 0.55, 0.1, 'rgba(40,24,8,0.45)');
    A.stroke(ctx, [[hd[0] + 2.2, hd[1] + 1.2], [hd[0] + 3.0, hd[1] + 2.6], [hd[0] + 2.6, hd[1] + 3.6]], S * 0.2, M.dark, S); // probóscide enrolada
    for (const s of [0, 1]) {
      const ax = hd[0] + 0.6 + s * 0.6, ay = hd[1] - 2.4, sw = x.ant || 0;
      const ex = ax + 6.4 - s * 1.6, ey = ay - 8.4 + sw * 0.8 + s * 0.8;
      const mid = [(ax + ex) / 2 - 1.6, (ay + ey) / 2 - 0.4];
      A.stroke(ctx, [[ax, ay], mid, [ex, ey]], S * 0.24, M.dark, S);
      for (let i = 1; i < 12; i++) { const t = i / 12, u = 1 - t; const px = u * u * ax + 2 * u * t * mid[0] + t * t * ex, py = u * u * ay + 2 * u * t * mid[1] + t * t * ey; const l = Math.sin(t * Math.PI) * 1.8 + 0.4; A.stroke(ctx, [[px, py], [px + l, py + l * 0.5]], S * 0.1, A.rgba(s ? '#5a4a36' : '#3a2e22', 1), S); A.stroke(ctx, [[px, py], [px - l * 0.8, py - l * 0.1]], S * 0.1, A.rgba(s ? '#5a4a36' : '#3a2e22', 1), S); }
    }
    // casulo aninhado nas patas da frente (em voo)
    if (rest < 0.5 && !(x.noCocoon)) {
      const cc = [3.6 + (x.legs || 0) * 0.6, 7.6], sw = (x.csw || 0) * D2R;
      ctx.save(); ctx.translate(cc[0] * S, cc[1] * S); ctx.rotate(0.3 + sw);
      const co = K.blob(ctx, [[0, -3.0], [1.6, -1.8], [1.8, 1.6], [0.6, 3.4], [-0.8, 3.2], [-1.8, 1.2], [-1.4, -2.0]], M.cocoon, { depth: S * 0.4, hlw: S * 0.25 });
      ctx.save(); ctx.clip(co); for (let i = 0; i < 6; i++) K.line(ctx, [[-2, -2.6 + i * 1.1], [2, -2.0 + i * 1.1]], 0.16, A.rgba(M.cocoon.shadow, 0.7)); ctx.restore();
      ctx.restore();
      x._cocoon = cc;
      for (const [a, b] of [[[2.4, 3.0], [cc[0] - 0.8, cc[1] - 2.0]], [[1.4, 3.2], [cc[0] - 1.4, cc[1] + 0.6]]]) leg(ctx, a, b, [0.6, -0.4], M.leg);
    } else x._cocoon = null;
    // asas de perto
    if (!fold) wing(ctx, false, M.wingB, 1, true, sy * 0.86, -1.2, -2.0, 0, eyes);
    wing(ctx, true, M.wing, 1, true, fold ? 0.92 : sy * 0.96, 0.6, -2.8, fold * -72, eyes);
    ctx.restore();
    const c = Math.cos(tilt), s = Math.sin(tilt), R = (p) => [p[0] * c - p[1] * s, p[0] * s + p[1] * c + dy];
    x._eye = R([hd[0] + 1.2, hd[1] - 0.5]); x._head = R([hd[0] + 2.4, hd[1] + 0.4]);
    if (x._cocoon) x._cocoonW = R(x._cocoon);
  }
  function overlay(ctx, W, x) {
    if (x._cocoonW) { A.glow(ctx, x._cocoonW[0] * S, x._cocoonW[1] * S, 5 * S, '#ffe8b0', 0.28); }
    if (x._eye) A.glow(ctx, x._eye[0] * S, x._eye[1] * S, 2.4 * S, '#ffe8a0', 0.35 * Math.min(1, x.eye === undefined ? 1 : x.eye));
  }
  function points(W, x) { return { eye: x._eye, tip: x._head, light: x._cocoonW || x._eye }; }
  const P = (x) => A.pose({}, x, [0, 0]);
  function anims() {
    const R = {};
    R.idle = { n: 8, fps: 12, loop: true, poseFn: (t) => P({ sy: Math.cos(t * A.TAU), tilt: -4 + Math.sin(t * A.TAU) * 3, legs: Math.sin(t * A.TAU) * 0.4, ant: Math.sin(t * A.TAU), csw: Math.sin(t * A.TAU) * 8, breath: Math.sin(t * A.TAU) }) };
    R.move = { n: 8, fps: 14, loop: true, poseFn: (t) => P({ sy: Math.cos(t * A.TAU), tilt: 10, legs: -0.5, ant: -1, csw: -10 + Math.sin(t * A.TAU) * 4 }) };
    // MERGULHO (vermelho): ergue as asas (abre os olhos pintados), recolhe-as e cai a pique
    R.atk_dive = { n: 8, fps: 12, phases: [3, 3], poseFn: (t, i) => P([{ sy: 0.6, tilt: -12 }, { sy: 1, tilt: -18, ant: 1, eye: 1.4 }, { sy: 1, tilt: -22, ant: 1.4, eye: 1.6 }, { sy: 0.22, tilt: 32, legs: -1, eye: 1.6 }, { sy: 0.18, tilt: 36, legs: -1, eye: 1.6 }, { sy: 0.22, tilt: 32, legs: -0.8, eye: 1.4 }, { sy: -0.6, tilt: 6 }, { sy: 0.4, tilt: 0 }][i]) };
    // ENXAME: asas abertas a tremer e batida para baixo que solta as filhas
    R.atk_swarm = { n: 8, fps: 12, phases: [4, 2], poseFn: (t, i) => P([{ sy: 0.8, tilt: -6 }, { sy: 1, tilt: -10, ant: 1 }, { sy: 0.94, tilt: -10, ant: 1.2, eye: 1.4 }, { sy: 1, tilt: -12, ant: 1.2, eye: 1.6 }, { sy: -0.9, tilt: 4, legs: 0.6, eye: 1.6 }, { sy: -0.7, tilt: 2, legs: 0.4 }, { sy: 0.2, tilt: -2 }, { sy: 0.8, tilt: -4 }][i]) };
    // PÓ: abre tudo e sacode as asas em vibração rápida (o pó cai)
    R.atk_dust = { n: 8, fps: 14, phases: [3, 3], poseFn: (t, i) => P([{ sy: 0.8, tilt: -4 }, { sy: 1, tilt: -8 }, { sy: 1, tilt: -8, ant: 1 }, { sy: 0.86, tilt: -6, ant: -1 }, { sy: 1, tilt: -8, ant: 1 }, { sy: 0.86, tilt: -6, ant: -1 }, { sy: 0.4, tilt: 0 }, { sy: 0.8, tilt: -4 }][i]) };
    // RAJADA: batidas enormes de asa
    R.atk_gust = { n: 8, fps: 16, phases: [2, 5], poseFn: (t, i) => P([{ sy: 1, tilt: -14 }, { sy: 1, tilt: -16, ant: 1 }, { sy: -1, tilt: 6, legs: 0.6 }, { sy: 1, tilt: -16 }, { sy: -1, tilt: 6, legs: 0.6 }, { sy: 1, tilt: -16 }, { sy: -1, tilt: 6, legs: 0.6 }, { sy: 0.5, tilt: -4 }][i]) };
    // POUSO E DESCANSO (ponto fraco): asas fechadas em tenda sobre o dorso, patas no chão, a respirar
    R.land = { n: 4, fps: 10, poseFn: (t, i) => P([{ sy: -0.8, tilt: 0, legs: 0.6 }, { sy: 0.6, tilt: -4, legs: 1, rest: 0 }, { sy: 0.3, tilt: -6, rest: 1, noCocoon: 1, fold: 0.6 }, { sy: 0.2, tilt: -8, rest: 1, noCocoon: 1, fold: 1 }][i]) };
    R.rest = { n: 6, fps: 5, loop: true, poseFn: (t) => P({ sy: 0.18, fold: 1, tilt: -6 + Math.sin(t * A.TAU) * 0.6, rest: 1, breath: Math.sin(t * A.TAU), ant: Math.sin(t * A.TAU) * 0.5 - 0.5, eye: 0.5, noCocoon: 1 }) };
    R.hurt = { n: 3, fps: 14, poseFn: (t, i) => P({ sy: [-0.8, 0.7, 0.2][i], tilt: [-28, -10, -4][i], legs: 0.6, eye: 1.6 }) };
    R.stagger = { n: 4, fps: 8, loop: true, poseFn: (t) => P({ sy: 0.4 + Math.sin(t * A.TAU) * 0.3, tilt: 10 + Math.sin(t * A.TAU) * 4, rest: 1, breath: 1, eye: 0.3, ant: -1, noCocoon: 1 }) };
    R.death = { n: 8, fps: 8, poseFn: (t, i) => P({ sy: 0.9 - i * 0.1, tilt: 20 + i * 14, legs: 1, eye: 1 - i / 7, noCocoon: i > 3 ? 1 : 0 }) };
    return R;
  }
  A.register('en_b_mariposa', () => A.creature({ name: 'en_b_mariposa', S, unit: 1.75, box: [70, 70], anchor: [35, 34], rig, draw, overlay, points, anims: anims(), post: K.post('#f0e0b8', 0.3, 0.05) }));
  (A.previewCell = A.previewCell || {}).en_b_mariposa = [80, 80];
})(window.ART);
