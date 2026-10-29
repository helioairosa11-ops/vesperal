// Vesperal — armas: imagem na mão (aponta para +x, pega na origem) + ícone ilustrado 128×128
// Inspiração: armaria espanhola histórica e objetos de procissão — desenhos originais de Vesperal.
'use strict';
(function (A) {
  let S = 4; const INK = '#0a080d', D2R = A.D2R;

  // ------------------------------------------------------------ peças reutilizáveis
  // lâmina: do ponto x0 até à ponta em x1; larguras w0→w1; fio (gume) claro; sulco central
  function blade(c, x0, x1, w0, w1, o) {
    const steel = o.steel || ['#3c3f48', '#6e727e', '#b8bcc8', '#e8ecf4'];
    const tip = o.tip === undefined ? 1.6 : o.tip;
    const wav = o.wave || 0;
    const top = [], bot = [];
    const N = 24;
    for (let i = 0; i <= N; i++) {
      const t = i / N, x = A.lerp(x0, x1 - tip, t), w = A.lerp(w0, w1, Math.pow(t, o.taper || 1)) / 2;
      const wv = wav ? Math.sin(t * Math.PI * (o.waves || 6)) * wav * (1 - t * 0.6) : 0;
      top.push([x, -w + wv]); bot.push([x, w + wv]);
    }
    const path = A.path((q) => { q.M(top[0][0], top[0][1]); top.forEach((p) => q.L(p[0], p[1])); q.Q(x1 - tip * 0.3, -w1 * 0.25, x1, o.tipY || 0); q.Q(x1 - tip * 0.3, w1 * 0.25, bot[N][0], bot[N][1]); for (let i = N; i >= 0; i--) q.L(bot[i][0], bot[i][1]); q.Z(); }, S);
    const g = c.createLinearGradient(0, -w0 / 2 * S, 0, w0 / 2 * S);
    g.addColorStop(0, steel[3]); g.addColorStop(0.18, steel[2]); g.addColorStop(0.5, steel[1]); g.addColorStop(0.82, steel[0]); g.addColorStop(1, steel[2]);
    c.fillStyle = g; c.fill(path);
    c.save(); c.clip(path);
    if (o.fuller) { // sulco
      const [f0, f1, fw] = o.fuller;
      c.fillStyle = A.rgba('#14161c', 0.55); c.beginPath(); c.moveTo(f0 * S, -fw / 2 * S); c.lineTo(f1 * S, -fw * 0.3 * S); c.lineTo(f1 * S, fw * 0.3 * S); c.lineTo(f0 * S, fw / 2 * S); c.closePath(); c.fill();
      A.stroke(c, [[f0, fw / 2 + 0.05], [f1, fw * 0.3 + 0.05]], S * 0.12, A.rgba('#ffffff', 0.3), S);
    }
    // desgaste: picadas, ferrugem, mossas
    const r = A.rng(o.seed || 3);
    for (let i = 0; i < (o.wear || 0); i++) { const x = A.lerp(x0, x1 - tip, r()), y = (r() - 0.5) * w0 * 0.8; c.fillStyle = r() < 0.4 ? A.rgba('#7a4424', 0.5) : A.rgba('#1a1c22', 0.5); c.beginPath(); c.ellipse(x * S, y * S, (0.1 + r() * 0.3) * S, (0.06 + r() * 0.15) * S, r() * 3, 0, A.TAU); c.fill(); }
    if (o.glow) { const gg = c.createLinearGradient(0, -w0 / 2 * S, 0, w0 / 2 * S); gg.addColorStop(0, A.rgba(o.glow, 0)); gg.addColorStop(0.5, A.rgba(o.glow, 0.55)); gg.addColorStop(1, A.rgba(o.glow, 0)); c.fillStyle = gg; c.fillRect(x0 * S, -w0 * S, (x1 - x0) * S, w0 * 2 * S); }
    if (o.engrave) { c.fillStyle = A.rgba(o.engrave, 0.75); for (let i = 0; i < 9; i++) { const x = x0 + 0.8 + i * 0.55; c.fillRect(x * S, (-0.12 + (i % 3) * 0.05) * S, 0.28 * S, 0.24 * S); } }
    c.restore();
    // gume superior brilhante e mossas
    c.strokeStyle = A.rgba(steel[3], 0.95); c.lineWidth = S * 0.14; c.beginPath(); top.forEach(([x, y], i) => (i ? c.lineTo(x * S, (y + 0.08) * S) : c.moveTo(x * S, (y + 0.08) * S))); c.lineTo(x1 * S, (o.tipY || 0) * S); c.stroke();
    for (let i = 0; i < (o.nicks || 0); i++) { const t = 0.2 + r() * 0.6, p = top[Math.floor(t * N)]; c.fillStyle = A.rgba('#1a1c22', 0.9); c.beginPath(); c.moveTo((p[0] - 0.2) * S, p[1] * S); c.lineTo(p[0] * S, (p[1] + 0.3) * S); c.lineTo((p[0] + 0.25) * S, p[1] * S); c.fill(); }
    c.lineWidth = (S * 0.2); c.strokeStyle = INK; c.lineJoin = 'round'; c.stroke(path);
    return path;
  }
  function grip(c, x0, x1, w, o = {}) { // punho envolvido em couro/cordão
    const p = A.path((q) => { q.M(x0, -w / 2); q.L(x1, -w / 2 * 0.9); q.L(x1, w / 2 * 0.9); q.L(x0, w / 2); q.Z(); }, S);
    A.paint(c, p, A.mat(o.col || '#3a2a24'), { light: [0, -1], depth: S * 0.25, inkW: (S * 0.2) });
    c.save(); c.clip(p);
    for (let x = x0; x < x1; x += 0.55) { c.strokeStyle = A.rgba('#000000', 0.5); c.lineWidth = S * 0.1; c.beginPath(); c.moveTo(x * S, -w * S); c.lineTo((x + 0.5) * S, w * S); c.stroke(); }
    c.restore();
  }
  function metal(c, path, base, o = {}) { A.paint(c, path, A.mat(base, o), { light: [0.2, -1], depth: S * (o.depth || 0.35), inkW: (S * 0.2), hlw: S * 0.18, hlAlpha: 0.9 }); }
  function gem(c, x, y, r, col) {
    const g = c.createRadialGradient((x - r * 0.3) * S, (y - r * 0.3) * S, 0, x * S, y * S, r * S); g.addColorStop(0, '#ffffff'); g.addColorStop(0.3, col); g.addColorStop(1, A.mix(col, '#000000', 0.6));
    c.fillStyle = g; c.beginPath(); c.arc(x * S, y * S, r * S, 0, A.TAU); c.fill(); c.lineWidth = (S * 0.2); c.strokeStyle = INK; c.stroke();
  }

  // ------------------------------------------------------------ as seis armas
  // cada def: draw(c) em unidades (origem = pega da mão da frente); len (ponta), back (pomo), w (meia-altura)
  const W = {};
  // 1. Lâmina do Desperto — espada de ferro velho, guarda com quilhões caídos, pomo em anel
  W.desperto = { len: 13.6, back: 3.6, h: 2.6, draw(c) {
    grip(c, -2.4, 1.0, 0.8, { col: '#3b2a22' });
    const pommel = A.path((q) => { q.E(-3.0, 0, 0.75, 0.75); }, S); metal(c, pommel, '#5a5e68');
    c.fillStyle = '#0d0e12'; c.beginPath(); c.arc(-3.0 * S, 0, 0.32 * S, 0, A.TAU); c.fill();
    const guard = A.path((q) => { q.M(1.0, -0.4); q.L(1.1, -2.3); q.Q(1.6, -2.6, 1.9, -2.3); q.L(1.6, -0.5); q.L(1.6, 0.5); q.L(1.9, 2.3); q.Q(1.6, 2.6, 1.1, 2.3); q.L(1.0, 0.4); q.Z(); }, S);
    metal(c, guard, '#585c66');
    blade(c, 1.6, 13.6, 1.45, 0.9, { fuller: [2.0, 9.5, 0.5], wear: 26, nicks: 4, seed: 11, steel: ['#30333b', '#5d616c', '#9da2ae', '#d6dae4'], engrave: '#a08860' });
  } };
  // 2. Navalhas da Matilha — par de navalhas espanholas curvas, cabo de chifre com virolas de latão
  W.navalhas = { len: 7.2, back: 2.8, h: 1.8, dual: true, draw(c) {
    const handle = A.path((q) => { q.M(-2.7, -0.55); q.Q(-1, -0.8, 0.8, -0.55); q.L(0.9, 0.6); q.Q(-1, 0.85, -2.6, 0.6); q.Q(-3.1, 0, -2.7, -0.55); q.Z(); }, S);
    A.paint(c, handle, A.mat('#c8b48a', { shadow: '#7a6440', light: '#efe0bc' }), { light: [0, -1], depth: S * 0.3, inkW: (S * 0.2) });
    c.save(); c.clip(handle); for (let i = 0; i < 5; i++) A.stroke(c, [[-2.4 + i * 0.6, -0.6], [-2.2 + i * 0.6, 0.6]], S * 0.08, A.rgba('#6a5030', 0.5), S); c.restore();
    for (const x of [-2.75, 0.75]) { const b = A.path((q) => { q.M(x - 0.18, -0.7); q.L(x + 0.32, -0.7); q.L(x + 0.32, 0.7); q.L(x - 0.18, 0.7); q.Z(); }, S); metal(c, b, '#b08a40'); }
    // lâmina curva (bico de papagaio)
    const bl = A.path((q) => { q.M(1.0, -0.45); q.Q(4.0, -0.9, 6.4, -0.6); q.Q(7.4, -0.4, 7.2, 0.5); q.Q(5.5, 0.3, 4.0, 0.55); q.Q(2.2, 0.75, 1.0, 0.5); q.Z(); }, S);
    const g = c.createLinearGradient(0, -0.9 * S, 0, 0.6 * S); g.addColorStop(0, '#e8ecf2'); g.addColorStop(0.4, '#9aa0ac'); g.addColorStop(1, '#3a3e48');
    c.fillStyle = g; c.fill(bl); c.lineWidth = (S * 0.2); c.strokeStyle = INK; c.stroke(bl);
    A.stroke(c, [[1.2, 0.35], [3.6, 0.42], [6.6, 0.3], [7.1, 0.45]], S * 0.12, A.rgba('#ffffff', 0.9), S);
    A.stroke(c, [[1.4, -0.2], [4, -0.45]], S * 0.08, A.rgba('#20242c', 0.6), S);
  } };
  // 3. Malho da Forja — martelo de forja a duas mãos, cabeça com veio de brasa
  W.malho = { len: 14.4, back: 3.4, h: 3.6, two: 2.2, heavy: true, draw(c) {
    const haft = A.path((q) => { q.M(-3.4, -0.5); q.L(11.4, -0.42); q.L(11.4, 0.42); q.L(-3.4, 0.5); q.Z(); }, S);
    A.paint(c, haft, A.mat('#4a3424', { shadow: '#2a1c14', light: '#6c5038' }), { light: [0, -1], depth: S * 0.3, inkW: (S * 0.2) });
    c.save(); c.clip(haft); const r = A.rng(5); for (let i = 0; i < 18; i++) A.stroke(c, [[-3 + r() * 14, -0.3 + r() * 0.6], [-2 + r() * 14, -0.3 + r() * 0.6]], S * 0.06, A.rgba('#1a100a', 0.6), S); c.restore();
    for (const x of [-1.6, 4.0, 9.6]) { const b = A.path((q) => { q.M(x, -0.6); q.L(x + 0.6, -0.6); q.L(x + 0.6, 0.6); q.L(x, 0.6); q.Z(); }, S); metal(c, b, '#8a6a34'); }
    const head = A.path((q) => { q.M(10.4, -3.2); q.L(14.4, -3.0); q.Q(14.8, 0, 14.4, 3.0); q.L(10.4, 3.2); q.Q(9.9, 0, 10.4, -3.2); q.Z(); }, S);
    metal(c, head, '#4a4a52', { depth: 0.8 });
    c.save(); c.clip(head);
    A.stroke(c, [[11.2, -2.6], [12.0, -1.0], [11.6, 0.4], [12.6, 1.6], [12.2, 2.8]], S * 0.42, '#5a1c08', S);
    A.stroke(c, [[11.2, -2.6], [12.0, -1.0], [11.6, 0.4], [12.6, 1.6], [12.2, 2.8]], S * 0.2, '#ffb050', S);
    A.stroke(c, [[10.8, -3.1], [10.6, 3.1]], S * 0.3, A.rgba('#000000', 0.35), S);
    A.stroke(c, [[14.3, -2.8], [14.5, 2.8]], S * 0.18, A.rgba('#d8d8e0', 0.5), S);
    c.restore();
    A.glow(c, 12.0 * S, 0, S * 3.2, '#ff8a30', 0.35);
  } };
  // 4. Alabarda da Guarda — haste longa, lâmina de machado, ponta, gancho; borla vermelha; sol gravado
  W.alabarda = { len: 20.5, back: 4.5, h: 3.4, two: 2.6, long: true, draw(c) {
    const shaft = A.path((q) => { q.M(-4.5, -0.38); q.L(16, -0.34); q.L(16, 0.34); q.L(-4.5, 0.38); q.Z(); }, S);
    A.paint(c, shaft, A.mat('#3a2a20', { shadow: '#20160f', light: '#5a4232' }), { light: [0, -1], depth: S * 0.25, inkW: (S * 0.2) });
    for (const x of [-4.4, 6, 15]) { const b = A.path((q) => { q.M(x, -0.5); q.L(x + 0.5, -0.5); q.L(x + 0.5, 0.5); q.L(x, 0.5); q.Z(); }, S); metal(c, b, '#8a6a34'); }
    // borla
    for (let i = 0; i < 6; i++) A.stroke(c, [[15.2, 0.4], [14.6 + i * 0.15, 2.6 + (i % 2) * 0.4]], S * 0.2, i % 2 ? '#8a1c20' : '#b02a2a', S);
    const axe = A.path((q) => { q.M(15.8, -0.4); q.L(16.2, -3.0); q.Q(18.0, -3.6, 19.0, -2.8); q.Q(18.0, -1.6, 18.2, -0.4); q.Z(); }, S);
    metal(c, axe, '#5c606a', { depth: 0.4 });
    c.save(); c.clip(axe); A.stroke(c, [[16.6, -2.6], [18.6, -2.7]], S * 0.14, A.rgba('#e8ecf4', 0.9), S); c.fillStyle = A.rgba('#c8a050', 0.8); c.beginPath(); c.arc(17.2 * S, -1.6 * S, 0.45 * S, 0, A.TAU); c.fill(); c.restore();
    const hook = A.path((q) => { q.M(16.0, 0.4); q.L(16.6, 0.4); q.Q(17.6, 1.4, 17.8, 2.8); q.Q(17.0, 1.8, 16.0, 1.4); q.Z(); }, S);
    metal(c, hook, '#55585f');
    blade(c, 18.0, 20.5, 0.9, 0.5, { tip: 1.0, steel: ['#30333b', '#5d616c', '#9da2ae', '#d6dae4'] });
  } };
  // 5. Lâmina do Espírito — lâmina de vitral unida a chumbo, que brilha com luz própria; pomo-círio
  W.espirito = { len: 13.8, back: 3.2, h: 2.6, spirit: true, draw(c) {
    grip(c, -2.2, 1.0, 0.75, { col: '#2a2440' });
    const pom = A.path((q) => { q.M(-3.2, -0.5); q.L(-2.2, -0.6); q.L(-2.2, 0.6); q.L(-3.2, 0.5); q.Z(); }, S); metal(c, pom, '#b0a070');
    // chama do pomo
    A.glow(c, -3.6 * S, 0, S * 1.8, '#c8b0ff', 0.7);
    const guard = A.path((q) => { q.M(1.0, -0.4); q.Q(1.4, -2.4, 2.2, -2.6); q.Q(1.9, -1.2, 1.7, 0); q.Q(1.9, 1.2, 2.2, 2.6); q.Q(1.4, 2.4, 1.0, 0.4); q.Z(); }, S);
    metal(c, guard, '#a89060');
    // lâmina de vitral: fragmentos coloridos com chumbo
    const outline = A.path((q) => { q.M(1.8, -0.8); q.L(12.4, -0.5); q.L(13.8, 0); q.L(12.4, 0.5); q.L(1.8, 0.8); q.Z(); }, S);
    A.glow(c, 7 * S, 0, S * 7, '#b8a0ff', 0.35);
    c.save(); c.clip(outline);
    const cols = ['#7a6ad8', '#c8b8ff', '#5ab0c8', '#e8d0ff', '#9a80e8', '#80c8e0'];
    let x = 1.8; let k = 0;
    while (x < 13.8) { const w = 1.2 + (k % 3) * 0.5; c.fillStyle = cols[k % cols.length]; c.globalAlpha = 0.85; c.beginPath(); c.moveTo(x * S, -1 * S); c.lineTo((x + w + 0.4) * S, -1 * S); c.lineTo((x + w - 0.3) * S, 1 * S); c.lineTo((x - 0.5) * S, 1 * S); c.closePath(); c.fill(); x += w; k++; }
    c.globalAlpha = 1;
    const lg = c.createLinearGradient(0, -0.8 * S, 0, 0.8 * S); lg.addColorStop(0, 'rgba(255,255,255,0.7)'); lg.addColorStop(0.35, 'rgba(255,255,255,0)'); lg.addColorStop(1, 'rgba(40,20,80,0.4)'); c.fillStyle = lg; c.fillRect(0, -S, 15 * S, 2 * S);
    x = 1.8; k = 0; c.strokeStyle = '#2a2430'; c.lineWidth = S * 0.16;
    while (x < 13.8) { const w = 1.2 + (k % 3) * 0.5; c.beginPath(); c.moveTo((x + w + 0.4) * S, -1 * S); c.lineTo((x + w - 0.3) * S, 1 * S); c.stroke(); x += w; k++; }
    A.stroke(c, [[1.8, 0], [13.6, 0]], S * 0.12, '#2a2430', S);
    c.restore();
    c.lineWidth = (S * 0.2) * 1.2; c.strokeStyle = '#2a2430'; c.stroke(outline);
  } };
  // 6. Montante do Rei — espadão real a duas mãos, lâmina negra com veio de brasa, guarda dourada com sóis
  W.montante = { len: 20.0, back: 4.2, h: 4.0, two: 2.6, heavy: true, royal: true, draw(c) {
    grip(c, -3.4, 1.2, 0.95, { col: '#2a1416' });
    const pommel = A.path((q) => { q.M(-4.4, -0.9); q.Q(-5.0, 0, -4.4, 0.9); q.L(-3.4, 0.7); q.L(-3.4, -0.7); q.Z(); }, S); metal(c, pommel, '#b08a40');
    gem(c, -4.3, 0, 0.42, '#c02020');
    const guard = A.path((q) => { q.M(1.2, -0.5); q.L(1.0, -3.2); q.Q(1.4, -4.0, 2.2, -3.6); q.Q(1.9, -2.2, 2.0, -0.6); q.L(2.0, 0.6); q.Q(1.9, 2.2, 2.2, 3.6); q.Q(1.4, 4.0, 1.0, 3.2); q.L(1.2, 0.5); q.Z(); }, S);
    metal(c, guard, '#b08a40');
    // sóis da guarda
    for (const y of [-2.9, 2.9]) { c.fillStyle = '#ffe0a0'; c.beginPath(); c.arc(1.6 * S, y * S, 0.35 * S, 0, A.TAU); c.fill(); }
    // ricasso + ganchos de aparo
    const ric = A.path((q) => { q.M(2.0, -0.75); q.L(4.0, -0.75); q.L(4.6, -1.6); q.L(5.0, -1.3); q.L(4.6, -0.8); q.L(4.6, 0.8); q.L(5.0, 1.3); q.L(4.6, 1.6); q.L(4.0, 0.75); q.L(2.0, 0.75); q.Z(); }, S);
    metal(c, ric, '#3a3c44');
    blade(c, 4.6, 20.0, 1.9, 1.1, { tip: 2.0, wave: 0.12, waves: 9, steel: ['#121318', '#24262e', '#4a4e5a', '#9ea4b4'], fuller: [5.0, 15.5, 0.55], seed: 21, wear: 8 });
    c.save(); const p = A.path((q) => { q.M(5.2, -0.1); q.L(17, -0.06); q.L(17, 0.06); q.L(5.2, 0.1); q.Z(); }, S);
    c.fillStyle = '#ff9a40'; c.fill(p); c.restore();
    A.glow(c, 11 * S, 0, S * 4, '#ff7a30', 0.25);
  } };

  // ------------------------------------------------------------ exportação
  function inHand(id) {
    const d = W[id];
    const pad = 1.5, w = (d.len + d.back + pad * 2) * S, h = (d.h * 2 + pad * 2) * S;
    const cv = A.mk(w, h), c = cv.getContext('2d');
    const ox = (d.back + pad) * S, oy = (d.h + pad) * S;
    c.translate(ox, oy); d.draw(c);
    return { cv: A.outline(cv, S * 0.25, INK), ox, oy };
  }
  function icon(id, size) {
    const d = W[id];
    const cv = A.mk(size, size), c = cv.getContext('2d');
    const total = d.len + d.back;
    const diag = size * 1.2;
    const S0 = S; S = Math.min(d.dual ? 11 : 16, diag / total);
    const aura = d.spirit ? '#9a80ff' : d.royal ? '#ff8a30' : d.heavy ? '#ff7030' : '#c8b8a0';
    const g = c.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size * 0.55); g.addColorStop(0, A.rgba(aura, 0.2)); g.addColorStop(1, A.rgba(aura, 0));
    c.fillStyle = g; c.fillRect(0, 0, size, size);
    const ih = inHand(id);
    S = S0;
    const place = (dx, dy, rot) => {
      c.save(); c.translate(size / 2 + dx, size / 2 + dy); c.rotate(rot);
      c.translate(-((d.len - d.back) / 2) * (ih.cv.width / (d.len + d.back + 3)), 0);
      c.save(); c.globalAlpha = 0.55; c.filter = 'blur(5px)'; c.drawImage(ih.cv, -ih.ox + 5, -ih.oy + 8); c.restore();
      c.drawImage(ih.cv, -ih.ox, -ih.oy);
      c.restore();
    };
    if (d.dual) { place(-10, 8, -60 * D2R); place(10, 8, -120 * D2R + Math.PI); }
    else place(0, 0, -45 * D2R);
    return cv;
  }
  A.WEAPON_ART = W;
  const cache = {};
  A.weaponImage = (id) => cache[id] || (cache[id] = inHand(id));
  A.register('weapons', () => {
    const images = {}, meta = {};
    for (const id of Object.keys(W)) {
      const ih = inHand(id);
      images['w_' + id] = ih.cv;
      images['icon_w_' + id] = icon(id, 128);
      const d = W[id];
      meta[id] = { ox: ih.ox, oy: ih.oy, scale: S, len: d.len, back: d.back, dual: !!d.dual, two: d.two || 0 };
    }
    const js = "'use strict';\n(window.VS = window.VS || {}).WEAPON_META = " + JSON.stringify(meta) + ";\n";
    return { images, meta: { dir: 'weapons', js }, kind: 'images' };
  });
})(window.ART);
