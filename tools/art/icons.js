// Vesperal — ícones ilustrados (128×128) de todos os objetos, relíquias, consumíveis, chaves e habilidades.
// Mesmo traço do jogo: pintura com sombra e luz, contorno a tinta, aura suave por categoria e sombra no chão.
// Unidades 0..32 (S = 4). → assets/icons/<id>.png
'use strict';
(function (A) {
  const S = 4, K = A.kit(S), INK = '#0a080d', D2R = A.D2R;
  const M = {
    iron: A.mat('#4c4a54', { shadow: '#24232a', light: '#a09ca8', deep: '#111015' }),
    steel: A.mat('#8a909c', { shadow: '#474b55', light: '#e4e8f0', deep: '#16181d' }),
    gold: A.mat('#b8924a', { shadow: '#6a5024', light: '#f4dc9c', deep: '#2a1e0c' }),
    silver: A.mat('#a8acb4', { shadow: '#5c6068', light: '#f2f4f8', deep: '#1c1e24' }),
    bone: A.mat('#d8ccb0', { shadow: '#8e8268', light: '#f6eedc', deep: '#2e271c' }),
    wood: A.mat('#6a4c32', { shadow: '#3a281a', light: '#9e7650', deep: '#1a120a' }),
    leather: A.mat('#5a3a26', { shadow: '#2e1c12', light: '#8a5e40' }),
    parch: A.mat('#d8c8a0', { shadow: '#9a8862', light: '#f4ead0', deep: '#3a2e1a' }),
    wax: A.mat('#e8dec6', { shadow: '#a89a7e', light: '#fffaf0' }),
    clay: A.mat('#8a5a3a', { shadow: '#4e3020', light: '#c08a60' }),
    ash: A.mat('#7c7672', { shadow: '#423e3c', light: '#b8b0aa', deep: '#1a1716' }),
    cloth: A.mat('#7a2a2a', { shadow: '#441414', light: '#b04a40' }),
    linen: A.mat('#cfc4ae', { shadow: '#8a806c', light: '#efe6d4' }),
    amber: A.mat('#d08a2a', { shadow: '#7a4a10', light: '#ffd27a' }),
    glass: A.mat('#6a8aa0', { shadow: '#34485a', light: '#cfe6f4' }),
    pale: A.mat('#e2dccc', { shadow: '#9e968a', light: '#ffffff' }),
    hair: A.mat('#5a4a3a', { shadow: '#2e241a', light: '#8a765e' }),
  };
  const AURA = { ability: '#ffb060', key: '#ffcf80', quest: '#d8c090', material: '#c8b8a8', consumable: '#e0a070', relic: '#b0a0e0', ember: '#ff8a40' };
  const P = (c, pts, m, o) => K.poly(c, pts, m, o);
  const B = (c, pts, m, o) => K.blob(c, pts, m, o);
  const T = (c, pts, ws, m, o) => K.tube(c, pts, ws, m, o);
  const L = (c, pts, w, col) => K.line(c, pts, w, col);
  const D = (c, x, y, r, col) => K.dot(c, x, y, r, col);
  const circle = (c, x, y, r, m, o) => B(c, Array.from({ length: 10 }, (_, i) => [x + Math.cos(i / 10 * A.TAU) * r, y + Math.sin(i / 10 * A.TAU) * r]), m, o);
  const glowAt = (c, x, y, r, col, a) => A.glow(c, x * S, y * S, r * S, col, a);
  function flame(c, x, y, h, w, k = 1) {
    const g = c.createLinearGradient(0, y * S, 0, (y - h) * S); g.addColorStop(0, '#ff6a1a'); g.addColorStop(0.45, '#ffb040'); g.addColorStop(1, '#fff0c0');
    const p = A.path((q) => { q.M(x - w, y); q.Q(x - w * 1.2, y - h * 0.45, x + w * 0.2, y - h); q.Q(x + w * 1.2, y - h * 0.5, x + w, y); q.Q(x, y + w * 0.5, x - w, y); q.Z(); }, S);
    c.fillStyle = g; c.fill(p);
    const p2 = A.path((q) => { q.M(x - w * 0.45, y); q.Q(x - w * 0.5, y - h * 0.35, x + w * 0.1, y - h * 0.62); q.Q(x + w * 0.55, y - h * 0.35, x + w * 0.45, y); q.Z(); }, S);
    c.fillStyle = A.rgba('#fff8e0', 0.9 * k); c.fill(p2);
  }
  // pergaminho dobrado com selo de lacre
  function letter(c, sealCol, mark) {
    P(c, [[6, 11], [26, 9], [27, 23], [7, 25]], M.parch, { depth: S * 0.6 });
    L(c, [[6.6, 11.2], [16.6, 18.4], [26.4, 9.4]], 0.4, A.rgba(M.parch.shadow, 0.9));
    for (let i = 0; i < 3; i++) L(c, [[9, 19.6 + i * 1.6], [17, 19.0 + i * 1.6]], 0.22, A.rgba('#4a3a26', 0.5));
    const sm = A.mat(sealCol, {}); circle(c, 17, 18.6, 3.2, sm, { depth: S * 0.5 });
    B(c, [[14.2, 20.4], [13.2, 23.4], [15.4, 22.0]], sm, { depth: S * 0.2 }); B(c, [[19.6, 20.6], [20.8, 23.2], [18.8, 22.0]], sm, { depth: S * 0.2 });
    mark(c, 17, 18.6);
  }
  function key(c, bowFn, m) {
    T(c, [[13, 13], [24, 24]], [1.2, 1.1], m, { flat: true });
    P(c, [[20.4, 22.8], [22.4, 20.8], [24.2, 22.6], [22.2, 24.6]], m); P(c, [[22.8, 25.0], [24.8, 23.0], [26.4, 24.6], [24.4, 26.6]], m);
    bowFn(c);
  }
  function relicCord(c) { T(c, [[8, 4], [12, 9], [16, 12], [20, 9], [24, 4]], [0.45, 0.45, 0.45, 0.45, 0.45], M.leather, { depth: S * 0.1, flat: true }); }
  function bead(c, x, y, r, m) { circle(c, x, y, r, m, { depth: S * 0.25, hlw: S * 0.2 }); D(c, x - r * 0.35, y - r * 0.35, r * 0.28, A.rgba('#ffffff', 0.55)); }

  const ICONS = {
    // ---------------- habilidades
    ab_dash: { cat: 'ability', draw(c) { // pena de cinza com rasto de brasas
      for (let i = 0; i < 4; i++) L(c, [[4 + i * 1.5, 20 + i * 2], [12 + i, 18 + i * 2]], 0.5, A.rgba('#ff9a50', 0.6 - i * 0.12));
      B(c, [[9, 26], [12, 18], [18, 10], [25, 5], [23, 13], [18, 20], [12, 25]], M.ash, { depth: S * 0.6, hlw: S * 0.3 });
      L(c, [[9.4, 26.4], [24.4, 5.6]], 0.45, M.ash.deep); for (let i = 0; i < 6; i++) { const t = 0.25 + i * 0.11; const x = A.lerp(9.4, 24.4, t), y = A.lerp(26.4, 5.6, t); L(c, [[x, y], [x + 2.2, y + 1.8]], 0.2, A.rgba(M.ash.deep, 0.6)); L(c, [[x, y], [x - 1.6, y - 2.0]], 0.2, A.rgba(M.ash.light, 0.6)); }
      glowAt(c, 24, 6, 4, '#ffb050', 0.6); D(c, 24, 6, 0.9, '#ffe0a0'); } },
    ab_spell: { cat: 'ability', draw(c) { // centelha: brasa viva com raios
      glowAt(c, 16, 17, 12, '#ff8a30', 0.55);
      for (let i = 0; i < 8; i++) { const a = i / 8 * A.TAU + 0.2, r = i % 2 ? 9 : 12; P(c, [[16 + Math.cos(a - 0.12) * 3.4, 17 + Math.sin(a - 0.12) * 3.4], [16 + Math.cos(a) * r, 17 + Math.sin(a) * r], [16 + Math.cos(a + 0.12) * 3.4, 17 + Math.sin(a + 0.12) * 3.4]], A.mat('#ffb040', { light: '#fff0c0', shadow: '#c05a10' }), { depth: S * 0.2, inkW: K.IW * 0.6 }); }
      flame(c, 16, 21, 10, 3.6); } },
    ab_wall: { cat: 'ability', draw(c) { // garra de ferro: manopla com três garras curvas
      B(c, [[8, 26], [8, 17], [12, 13], [18, 13], [21, 17], [20, 26]], M.iron, { depth: S * 0.7 });
      for (const x of [10, 14.5, 19]) T(c, [[x, 14], [x + 1.0, 9], [x + 3.2, 5.2]], [1.3, 1.0, 0.3], M.steel, { depth: S * 0.3 });
      L(c, [[8, 20], [20.6, 20]], 0.5, M.gold.base); D(c, 14, 23, 1.0, M.gold.light); } },
    ab_forge: { cat: 'ability', draw(c) { // martelo a bater na bigorna, faíscas
      P(c, [[6, 22], [26, 22], [24, 24], [20, 24], [21, 28], [11, 28], [12, 24], [8, 24]], M.iron, { depth: S * 0.6 });
      P(c, [[4, 21], [6, 22], [26, 22], [28, 20], [20, 19], [8, 19]], M.iron, { depth: S * 0.4 });
      T(c, [[10, 6], [19, 16]], [0.9, 0.9], M.wood, { flat: true }); P(c, [[15, 9.6], [19.6, 5.0], [24.4, 9.8], [19.8, 14.4]], M.steel, { depth: S * 0.5 });
      for (let i = 0; i < 6; i++) { const a = -Math.PI / 2 + (i - 2.5) * 0.4; L(c, [[17 + Math.cos(a) * 2, 19 + Math.sin(a) * 2], [17 + Math.cos(a) * 6, 19 + Math.sin(a) * 6]], 0.35, '#ffc060'); } glowAt(c, 17, 19, 6, '#ff9a40', 0.6); } },
    ab_double: { cat: 'ability', draw(c) { // asas pálidas de mariposa
      for (const s of [-1, 1]) {
        const w = B(c, [[16, 15], [16 + s * 6, 6], [16 + s * 13, 7], [16 + s * 12, 15], [16 + s * 7, 18]], M.pale, { depth: S * 0.6, hlw: S * 0.3 });
        B(c, [[16, 17], [16 + s * 8, 18], [16 + s * 10, 25], [16 + s * 5, 26]], K.dim(M.pale, 0.85), { depth: S * 0.4 });
        c.save(); c.clip(w); D(c, 16 + s * 8, 11, 2.0, A.rgba('#8a7a60', 0.6)); D(c, 16 + s * 8, 11, 0.9, A.rgba('#2a2018', 0.8)); c.restore();
      }
      T(c, [[16, 9], [16, 25]], [1.0, 0.6], M.hair, { depth: S * 0.2 }); } },
    ab_veil: { cat: 'ability', draw(c) { // véu rasgado com luz por trás
      glowAt(c, 16, 14, 11, '#fff0d0', 0.6);
      const v = A.path((q) => { q.M(7, 5); q.Q(16, 3, 25, 5); q.L(26, 24); q.L(22, 21); q.L(20, 27); q.L(16, 22); q.L(12, 28); q.L(10, 21); q.L(6, 25); q.Z(); }, S);
      c.save(); c.globalAlpha = 0.85; K.paint(c, v, A.mat('#c8c0d8', { light: '#ffffff', shadow: '#7a7090' }), { depth: S * 0.5 }); c.restore();
      c.save(); c.clip(v); for (let i = 0; i < 5; i++) L(c, [[9 + i * 4, 6], [8.6 + i * 4, 24]], 0.2, A.rgba('#5a5070', 0.4)); c.restore();
      const tear = A.path((q) => { q.M(14, 11); q.L(18, 10); q.L(17, 16); q.L(15, 15); q.Z(); }, S); c.save(); c.globalCompositeOperation = 'destination-out'; c.fill(tear); c.restore(); } },
    // ---------------- chaves
    chalice: { cat: 'key', draw(c) { this.cup(c, false); }, cup(c, mended) {
      P(c, [[9, 6], [23, 6], [22, 12], [18, 16], [14, 16], [10, 12]], M.silver, { depth: S * 0.7, hlw: S * 0.35 });
      T(c, [[16, 16], [16, 23]], [1.2, 1.2], M.silver, { flat: true }); P(c, [[10, 26], [22, 26], [20, 23], [12, 23]], M.silver, { depth: S * 0.4 });
      for (const x of [12.4, 16, 19.6]) D(c, x, 9.4, 0.9, ['#c02030', '#3050c0', '#c02030'][(x | 0) % 3]);
      if (mended) { L(c, [[13, 6.4], [14.4, 10], [13.4, 13], [15.2, 15.6]], 0.45, '#e8c060'); L(c, [[20, 6.4], [19.2, 9.6]], 0.4, '#e8c060'); }
      else { L(c, [[13, 6.4], [14.4, 10], [13.4, 13], [15.2, 15.6]], 0.3, '#16181d'); L(c, [[20, 6.4], [19.2, 9.6]], 0.26, '#16181d'); } } },
    chalice_mended: { cat: 'key', draw(c) { ICONS.chalice.cup(c, true); glowAt(c, 16, 10, 6, '#ffd070', 0.3); } },
    ossuary_key: { cat: 'key', draw(c) { key(c, (cc) => { circle(cc, 11, 11, 4.4, M.bone, { depth: S * 0.5 }); D(cc, 11, 11, 1.8, '#1a140e'); D(cc, 9.6, 10.0, 0.5, '#1a140e'); D(cc, 12.4, 10.0, 0.5, '#1a140e'); }, M.bone); } },
    bastion_key: { cat: 'key', draw(c) { key(c, (cc) => { P(cc, [[6.4, 15], [6.4, 7.4], [8, 7.4], [8, 9], [10, 9], [10, 7.4], [12, 7.4], [12, 9], [14, 9], [14, 7.4], [15.6, 7.4], [15.6, 15]], M.iron, { depth: S * 0.5 }); P(cc, [[10, 15], [10, 12], [12, 12], [12, 15]], A.mat('#1a1418', {}), { depth: 0 }); }, M.iron); } },
    palace_seal: { cat: 'key', draw(c) { // selo real: carimbo de ouro com o sol
      T(c, [[16, 5], [16, 15]], [2.2, 1.4], M.wood, { depth: S * 0.4 }); circle(c, 16, 5, 3, M.wood);
      P(c, [[9, 15], [23, 15], [24, 18], [8, 18]], M.gold, { depth: S * 0.4 }); B(c, [[7, 19], [25, 19], [25, 24], [16, 26], [7, 24]], M.gold, { depth: S * 0.6, hlw: S * 0.3 });
      for (let i = 0; i < 10; i++) { const a = i / 10 * A.TAU; L(c, [[16 + Math.cos(a) * 1.4, 22 + Math.sin(a) * 0.8], [16 + Math.cos(a) * (i % 2 ? 3 : 4.2), 22 + Math.sin(a) * (i % 2 ? 1.6 : 2.2)]], 0.3, M.gold.deep); } D(c, 16, 22, 1.0, M.gold.light); } },
    letter_1: { cat: 'key', draw(c) { letter(c, '#a82028', (cc, x, y) => { flame(cc, x, y + 1.6, 3.4, 1.2); }); } },
    letter_2: { cat: 'key', draw(c) { letter(c, '#6a1a3a', (cc, x, y) => { for (let i = -2; i <= 2; i++) P(cc, [[x + i * 1.0 - 0.4, y + 0.8], [x + i * 1.0, y - 1.6 - (i === 0 ? 0.6 : 0)], [x + i * 1.0 + 0.4, y + 0.8]], M.gold, { depth: 0, inkW: K.IW * 0.5 }); }); } },
    letter_3: { cat: 'key', draw(c) { letter(c, '#2a2430', (cc, x, y) => { B(cc, [[x - 2, y], [x, y - 1.2], [x + 2, y], [x, y + 1.2]], M.pale, { depth: 0, inkW: K.IW * 0.5 }); D(cc, x, y, 0.6, '#ffb050'); }); } },
    // ---------------- missões
    hilde_hammer: { cat: 'quest', draw(c) { T(c, [[8, 26], [20, 12]], [1.1, 0.9], M.wood, { flat: true }); for (const t of [0.2, 0.6]) { const x = A.lerp(8, 20, t), y = A.lerp(26, 12, t); L(c, [[x - 1, y - 1], [x + 1, y + 1]], 0.6, M.leather.base); }
      P(c, [[15, 11], [21, 5], [26, 10], [20, 16]], M.iron, { depth: S * 0.6, hlw: S * 0.3 }); P(c, [[21, 5], [23, 3], [28, 8], [26, 10]], M.steel, { depth: S * 0.3 }); glowAt(c, 24, 8, 4, '#ff8030', 0.35); } },
    teodoro_medal: { cat: 'quest', draw(c) { P(c, [[11, 3], [15, 3], [17, 13], [13, 13]], A.mat('#3a5a8a', { light: '#6a8abf', shadow: '#1e3050' }), { depth: S * 0.3 }); P(c, [[17, 3], [21, 3], [19, 13], [15, 13]], A.mat('#8a2a2a', { light: '#c05a4a', shadow: '#4a1414' }), { depth: S * 0.3 });
      circle(c, 16, 20, 6.4, M.gold, { depth: S * 0.7, hlw: S * 0.35 }); circle(c, 16, 20, 4.4, K.dim(M.gold, 0.85), { depth: S * 0.3 });
      P(c, [[16, 16.6], [17.0, 19.2], [19.6, 19.4], [17.6, 21.0], [18.4, 23.6], [16, 22.2], [13.6, 23.6], [14.4, 21.0], [12.4, 19.4], [15.0, 19.2]], M.gold, { depth: S * 0.2, inkW: K.IW * 0.6 }); } },
    ozias_testament: { cat: 'quest', draw(c) { this.scroll(c, '#e8d8a0', (cc) => { for (let i = 0; i < 4; i++) L(cc, [[10.4, 12 + i * 2.2], [21.6, 12 + i * 2.2]], 0.22, A.rgba('#4a3a26', 0.55)); circle(cc, 21, 21, 2.0, A.mat('#d8c060', {}), { depth: S * 0.2 }); }); },
      scroll(c, col, inner) { T(c, [[7, 7], [25, 7]], [1.6, 1.6], M.wood, { depth: S * 0.3 }); P(c, [[8, 8], [24, 8], [24, 25], [8, 25]], M.parch, { depth: S * 0.5 }); T(c, [[7, 25.5], [25, 25.5]], [1.6, 1.6], M.wood, { depth: S * 0.3 }); for (const x of [6, 26]) { circle(c, x, 7, 1.2, M.gold); circle(c, x, 25.5, 1.2, M.gold); } inner(c); } },
    elowen_lullaby: { cat: 'quest', draw(c) { ICONS.ozias_testament.scroll(c, '', (cc) => { for (let i = 0; i < 5; i++) L(cc, [[10, 11 + i * 1.3], [22, 11 + i * 1.3]], 0.14, A.rgba('#4a3a26', 0.55)); for (const [x, y] of [[12, 13.2], [15, 11.8], [18, 14.4], [20.6, 12.6]]) { D(cc, x, y, 0.7, '#2a2018'); L(cc, [[x + 0.6, y], [x + 0.6, y - 2.4]], 0.16, '#2a2018'); }
      for (let i = 0; i < 5; i++) { const a = i / 5 * A.TAU; circle(cc, 16 + Math.cos(a) * 1.6, 21 + Math.sin(a) * 1.6, 1.2, A.mat('#e8d0e8', { light: '#ffffff', shadow: '#a080a8' }), { depth: 0, inkW: K.IW * 0.5 }); } D(cc, 16, 21, 0.8, '#e8c040'); }); } },
    // ---------------- materiais
    ash_steel: { cat: 'material', draw(c) { P(c, [[5, 20], [9, 13], [27, 13], [23, 20]], M.iron, { depth: S * 0.5 }); P(c, [[5, 20], [23, 20], [23, 25], [5, 25]], K.dim(M.iron, 0.8), { depth: S * 0.4 }); P(c, [[23, 20], [27, 13], [27, 18], [23, 25]], K.dim(M.iron, 0.6), { depth: S * 0.3 });
      L(c, [[9, 16.6], [14, 15.4], [18, 17.0], [24, 15.0]], 0.4, '#ff8030'); glowAt(c, 16, 16, 6, '#ff7020', 0.3); } },
    candle_fragment: { cat: 'material', draw(c) { // pedaço de círio partido, ainda com o pavio aceso
      P(c, [[10, 12], [20, 10.4], [22, 24], [12, 26]], M.wax, { depth: S * 0.6 }); P(c, [[20, 10.4], [21.2, 13], [19.4, 15.8], [21.6, 18.6], [22, 24]], K.dim(M.wax, 0.9), { depth: 0 });
      B(c, [[12, 12.4], [13.4, 15], [12.6, 18], [11.6, 15]], M.wax, { depth: S * 0.2 }); L(c, [[15, 11.4], [15.2, 8.6]], 0.4, '#1a120a'); flame(c, 15.2, 8.8, 5.4, 1.7); glowAt(c, 15, 6, 6, '#ffb050', 0.4); } },
    ash_heart: { cat: 'material', draw(c) { glowAt(c, 16, 17, 10, '#ff7030', 0.4);
      const h = A.path((q) => { q.M(16, 27); q.Q(5, 19, 6, 12); q.Q(7, 6, 12, 6.4); q.Q(15, 6.8, 16, 10); q.Q(17, 6.8, 20, 6.4); q.Q(25, 6, 26, 12); q.Q(27, 19, 16, 27); q.Z(); }, S);
      K.paint(c, h, M.ash, { depth: S * 0.8, hlw: S * 0.4 }); c.save(); c.clip(h); L(c, [[11, 9], [14, 14], [12.6, 18], [16, 22]], 0.4, '#ff8a3a'); L(c, [[21, 10], [18.6, 15], [20.4, 18.4]], 0.34, '#ff8a3a'); c.restore(); } },
    relic_slot: { cat: 'material', draw(c) { // engaste vazio em filigrana dourada
      for (let i = 0; i < 8; i++) { const a = i / 8 * A.TAU; B(c, [[16 + Math.cos(a) * 8, 16 + Math.sin(a) * 8], [16 + Math.cos(a + 0.2) * 12, 16 + Math.sin(a + 0.2) * 12], [16 + Math.cos(a) * 13, 16 + Math.sin(a) * 13], [16 + Math.cos(a - 0.2) * 12, 16 + Math.sin(a - 0.2) * 12]], M.gold, { depth: S * 0.2, inkW: K.IW * 0.6 }); }
      circle(c, 16, 16, 9, M.gold, { depth: S * 0.6 }); circle(c, 16, 16, 6.4, A.mat('#1a1418', { light: '#3a3038', shadow: '#0a080a' }), { depth: S * 0.6 }); for (let i = 0; i < 4; i++) { const a = i / 4 * A.TAU + Math.PI / 4; D(c, 16 + Math.cos(a) * 6.4, 16 + Math.sin(a) * 6.4, 0.9, M.gold.light); } } },
    // ---------------- consumíveis
    oil: { cat: 'consumable', draw(c) { // frasco de barro com óleo de brasa
      B(c, [[10, 14], [9, 21], [11, 26], [21, 26], [23, 21], [22, 14], [19, 12], [13, 12]], M.clay, { depth: S * 0.8, hlw: S * 0.4 });
      P(c, [[13.6, 12], [18.4, 12], [18, 8], [14, 8]], M.clay, { depth: S * 0.3 }); P(c, [[13, 8], [19, 8], [19, 6], [13, 6]], M.wood, { depth: S * 0.2 });
      c.save(); c.clip(K.blobPath([[10, 14], [9, 21], [11, 26], [21, 26], [23, 21], [22, 14], [19, 12], [13, 12]])); const g = c.createLinearGradient(0, 18 * S, 0, 26 * S); g.addColorStop(0, 'rgba(255,120,30,0)'); g.addColorStop(1, 'rgba(255,120,30,0.5)'); c.fillStyle = g; c.fillRect(8 * S, 18 * S, 16 * S, 8 * S); c.restore();
      L(c, [[11, 17], [21, 17]], 0.5, M.leather.base); D(c, 13.4, 15, 1.4, A.rgba('#ffffff', 0.3)); glowAt(c, 16, 23, 6, '#ff8030', 0.35); } },
    incense: { cat: 'consumable', draw(c) { // incensário de ferro com fumo amargo
      for (let i = 0; i < 3; i++) { const p = A.path((q) => { q.M(14 + i * 2, 12); q.Q(10 + i * 3, 8, 15 + i * 2, 5); q.Q(19 + i, 2.5, 15 + i * 3, 0.5); }, S); c.strokeStyle = A.rgba('#c8c0b8', 0.55 - i * 0.12); c.lineWidth = S * 1.0; c.stroke(p); }
      B(c, [[8, 15], [24, 15], [22, 23], [10, 23]], M.iron, { depth: S * 0.7 }); P(c, [[10, 15], [22, 15], [20, 11], [12, 11]], M.iron, { depth: S * 0.4 }); for (let i = 0; i < 4; i++) D(c, 12 + i * 2.6, 18.6, 0.6, '#ff9040');
      P(c, [[12, 23], [20, 23], [21, 27], [11, 27]], M.iron, { depth: S * 0.3 }); L(c, [[12, 11], [16, 4], [20, 11]], 0.3, M.iron.light); } },
    salt: { cat: 'consumable', draw(c) { // saquinho de linho com sal bento
      B(c, [[8, 26], [7, 18], [10, 12], [16, 11], [22, 12], [25, 18], [24, 26]], M.linen, { depth: S * 0.7, hlw: S * 0.35 });
      P(c, [[12, 11.4], [20, 11.4], [21, 8.6], [11, 8.6]], M.linen, { depth: S * 0.3 }); L(c, [[11, 11.4], [21, 11.4]], 0.6, M.cloth.base);
      for (const [x, y] of [[13, 7.4], [16, 6.6], [19, 7.2], [17.4, 5.4], [14.6, 5.8]]) P(c, [[x - 0.8, y], [x, y - 0.9], [x + 0.8, y], [x, y + 0.9]], M.pale, { depth: 0, inkW: K.IW * 0.5 });
      P(c, [[14, 17], [18, 17], [18, 18.4], [14, 18.4]], M.cloth); P(c, [[15.3, 15.4], [16.7, 15.4], [16.7, 21], [15.3, 21]], M.cloth); } },
    feather: { cat: 'consumable', draw(c) { B(c, [[8, 27], [11, 19], [17, 11], [25, 4], [23, 12], [18, 19], [12, 25]], A.mat('#8a8a92', { light: '#d0d0d8', shadow: '#4a4a52' }), { depth: S * 0.6, hlw: S * 0.3 }); L(c, [[7.6, 27.6], [24.6, 4.6]], 0.45, '#2a2a30');
      for (let i = 0; i < 7; i++) { const t = 0.2 + i * 0.1, x = A.lerp(7.6, 24.6, t), y = A.lerp(27.6, 4.6, t); L(c, [[x, y], [x + 2.4, y + 1.6]], 0.18, A.rgba('#2a2a30', 0.6)); L(c, [[x, y], [x - 1.6, y - 2.2]], 0.18, A.rgba('#ffffff', 0.4)); } } },
    flask: { cat: 'consumable', draw(c) { // círio votivo (cura): vela grossa num copo de ferro, acesa
      P(c, [[12, 12], [20, 12], [20.4, 24], [11.6, 24]], M.wax, { depth: S * 0.6, hlw: S * 0.3 }); B(c, [[18.4, 12.4], [19.8, 15.8], [19.2, 18.8], [18.4, 15]], M.wax, { depth: S * 0.2 });
      L(c, [[16, 12], [16, 9.6]], 0.45, '#1a120a'); flame(c, 16, 9.8, 7.4, 2.2); glowAt(c, 16, 6, 8, '#ffb050', 0.45);
      P(c, [[9.6, 22.4], [22.4, 22.4], [21, 28], [11, 28]], M.iron, { depth: S * 0.4 }); L(c, [[9.6, 22.6], [22.4, 22.6]], 0.6, M.gold.base); } },
    // ---------------- relíquias
    r_rosary: { cat: 'relic', draw(c) { for (let i = 0; i < 16; i++) { const a = i / 16 * A.TAU * 0.8 - Math.PI * 1.15; bead(c, 16 + Math.cos(a) * 9, 13 + Math.sin(a) * 8, 1.2, M.wood); }
      L(c, [[16, 21], [16, 23]], 0.4, M.leather.base); P(c, [[15.3, 23], [16.7, 23], [16.7, 30], [15.3, 30]], M.silver, { depth: S * 0.2 }); P(c, [[13, 25], [19, 25], [19, 26.4], [13, 26.4]], M.silver, { depth: S * 0.2 }); } },
    r_amber: { cat: 'relic', draw(c) { relicCord(c); for (let i = 0; i < 7; i++) { const t = i / 6, x = A.lerp(8.6, 23.4, t), y = 13 + Math.sin(t * Math.PI) * 9; bead(c, x, y, 2.0 - Math.abs(t - 0.5) * 1.2, M.amber); } glowAt(c, 16, 21, 5, '#ffb040', 0.35); } },
    r_raven_eye: { cat: 'relic', draw(c) { relicCord(c); circle(c, 16, 19, 7, M.silver, { depth: S * 0.6 }); for (let i = 0; i < 6; i++) { const a = i / 6 * A.TAU; T(c, [[16 + Math.cos(a) * 6.6, 19 + Math.sin(a) * 6.6], [16 + Math.cos(a) * 9.4, 19 + Math.sin(a) * 9.4]], [0.9, 0.3], A.mat('#2a2a34', { light: '#5a5a6a' }), { depth: 0 }); }
      B(c, [[11, 19], [16, 15.4], [21, 19], [16, 22.6]], A.mat('#1a1820', {}), { depth: S * 0.2 }); circle(c, 16, 19, 2.4, A.mat('#c8a030', { light: '#ffe080', shadow: '#6a4a10' }), { depth: S * 0.3 }); D(c, 16, 19, 1.0, '#0a0808'); D(c, 15.2, 18.2, 0.4, '#ffffff'); } },
    r_heron: { cat: 'relic', draw(c) { B(c, [[9, 26], [12, 16], [18, 8], [24, 4], [22, 12], [17, 20], [11, 25]], A.mat('#d8dce0', { light: '#ffffff', shadow: '#8a9098' }), { depth: S * 0.6 }); L(c, [[8.6, 26.6], [23.4, 4.6]], 0.4, '#5a6068');
      P(c, [[6, 20], [14, 20], [14, 22], [6, 22]], M.silver, { depth: S * 0.2 }); circle(c, 6, 21, 1.4, M.silver); } },
    r_captain: { cat: 'relic', draw(c) { circle(c, 16, 20, 7.4, M.gold, { depth: S * 0.6 }); circle(c, 16, 20, 5.2, A.mat('#2a1e14', {}), { depth: 0 });
      P(c, [[11, 7], [21, 7], [21, 12], [16, 16], [11, 12]], M.gold, { depth: S * 0.5, hlw: S * 0.3 }); P(c, [[13, 8.4], [19, 8.4], [19, 11.4], [16, 13.8], [13, 11.4]], A.mat('#2e4c7c', { light: '#5a7cb0' }), { depth: S * 0.2 }); L(c, [[16, 8.6], [16, 13.4]], 0.4, M.gold.light); } },
    r_ember: { cat: 'relic', draw(c) { P(c, [[10, 18], [22, 18], [20, 25], [12, 25]], M.iron, { depth: S * 0.5 }); P(c, [[13, 25], [19, 25], [21, 28], [11, 28]], M.iron, { depth: S * 0.3 }); B(c, [[12, 18], [14, 14.6], [18, 14.6], [20, 18]], A.mat('#3a1a10', { light: '#ff7020' }), { depth: S * 0.2 });
      glowAt(c, 16, 14, 7, '#ff8030', 0.55); flame(c, 16, 16, 9, 2.8); } },
    r_hrolf_hammer: { cat: 'relic', draw(c) { relicCord(c); T(c, [[16, 12], [16, 25]], [0.8, 0.8], M.wood, { flat: true }); P(c, [[11, 11], [21, 11], [21, 16], [11, 16]], M.iron, { depth: S * 0.6, hlw: S * 0.3 }); for (const x of [12.4, 19.6]) L(c, [[x, 11.4], [x, 15.6]], 0.3, M.iron.light); } },
    r_chalice_shard: { cat: 'relic', draw(c) { P(c, [[9, 9], [21, 6], [24, 14], [17, 26], [12, 18]], M.silver, { depth: S * 0.7, hlw: S * 0.4 }); L(c, [[11, 10], [20, 7.4]], 0.6, M.gold.base); D(c, 15, 9, 1.0, '#c02030'); glowAt(c, 17, 16, 7, '#ff4040', 0.25); } },
    r_ione_ribbon: { cat: 'relic', draw(c) { const rm = A.mat('#c8a040', { light: '#f4dc8c', shadow: '#7a5a1c' });
      B(c, [[16, 15], [9, 9], [6, 13], [9, 18]], rm, { depth: S * 0.5 }); B(c, [[16, 15], [23, 9], [26, 13], [23, 18]], rm, { depth: S * 0.5 });
      P(c, [[15, 15], [17, 15], [14, 28], [11, 26]], rm, { depth: S * 0.4 }); P(c, [[15, 15], [17, 15], [21, 26], [18, 28]], rm, { depth: S * 0.4 }); circle(c, 16, 15, 2.0, rm, { depth: S * 0.3 }); } },
    r_hairshirt: { cat: 'relic', draw(c) { const hs = A.mat('#6a5a46', { light: '#9a8a70', shadow: '#3a3024' });
      P(c, [[8, 8], [13, 6], [16, 8], [19, 6], [24, 8], [26, 14], [22, 14], [22, 27], [10, 27], [10, 14], [6, 14]], hs, { depth: S * 0.6 });
      c.save(); c.clip(K.polyPath([[8, 8], [13, 6], [16, 8], [19, 6], [24, 8], [26, 14], [22, 14], [22, 27], [10, 27], [10, 14], [6, 14]])); for (let i = 0; i < 40; i++) { const x = 7 + (i * 7.3) % 19, y = 7 + (i * 4.1) % 20; L(c, [[x, y], [x + 0.8, y + 1.2]], 0.15, A.rgba('#2a2018', 0.7)); } c.restore();
      for (const y of [16, 22]) { L(c, [[10, y], [22, y]], 0.4, '#3a2a1a'); for (let i = 0; i < 4; i++) D(c, 11.6 + i * 3, y, 0.6, '#8a8078'); } } },
    r_anchor: { cat: 'relic', draw(c) { circle(c, 16, 6.4, 2.4, M.iron, { depth: S * 0.3 }); D(c, 16, 6.4, 1.0, '#0a080d'); T(c, [[16, 8.6], [16, 25]], [1.3, 1.3], M.iron, { flat: true }); P(c, [[11, 12], [21, 12], [21, 14], [11, 14]], M.iron, { depth: S * 0.3 });
      const arc = A.path((q) => { q.M(6, 19); q.Q(8, 27, 16, 27); q.Q(24, 27, 26, 19); q.L(24, 19); q.Q(22, 24.6, 16, 24.6); q.Q(10, 24.6, 8, 19); q.Z(); }, S); K.paint(c, arc, M.iron, { depth: S * 0.4 });
      P(c, [[5, 20], [7, 16.4], [9, 20]], M.iron, { depth: S * 0.2 }); P(c, [[23, 20], [25, 16.4], [27, 20]], M.iron, { depth: S * 0.2 }); } },
    r_lantern: { cat: 'relic', draw(c) { L(c, [[16, 3], [16, 6]], 0.4, M.iron.light); P(c, [[11, 9], [21, 9], [19, 6], [13, 6]], M.iron, { depth: S * 0.3 });
      const cage = K.polyPath([[11, 9], [21, 9], [22, 23], [10, 23]]); c.fillStyle = '#e8a040'; c.fill(cage); const g = c.createRadialGradient(16 * S, 16 * S, 0, 16 * S, 16 * S, 7 * S); g.addColorStop(0, '#fff4d0'); g.addColorStop(1, 'rgba(255,160,60,0)'); c.fillStyle = g; c.fill(cage);
      c.lineWidth = S * 0.5; c.strokeStyle = '#1a1418'; c.stroke(cage); for (const x of [14, 18]) { c.beginPath(); c.moveTo(x * S, 9 * S); c.lineTo(x * S, 23 * S); c.stroke(); }
      P(c, [[9, 23], [23, 23], [21, 26], [11, 26]], M.iron, { depth: S * 0.3 }); circle(c, 16, 16, 1.3, M.bone, { depth: 0 }); glowAt(c, 16, 16, 9, '#ffb050', 0.4); } },
    r_hilde_blade: { cat: 'relic', draw(c) { P(c, [[5, 24], [22, 7], [27, 5], [25, 10], [8, 27]], M.steel, { depth: S * 0.5, hlw: S * 0.3 }); L(c, [[6, 24.4], [23, 7.8]], 0.25, A.rgba('#ffffff', 0.7));
      P(c, [[3, 26], [6, 23], [9, 26], [6, 29]], M.leather, { depth: S * 0.3 }); L(c, [[12, 18], [16, 14]], 0.5, '#ff8030'); glowAt(c, 14, 16, 5, '#ff7020', 0.3); } },
  };
  // brasas dos seis guardiões: carvão vivo num pequeno relicário de ferro, com a cor de cada um
  const EMBER_COL = ['#9ac8ff', '#ff8a30', '#8aff9a', '#ffd060', '#fff0c0', '#ff3a20'];
  for (let i = 1; i <= 6; i++) ICONS['ember_' + i] = { cat: 'ember', col: EMBER_COL[i - 1], draw(c) {
    const col = this.col; glowAt(c, 16, 16, 12, col, 0.5);
    P(c, [[10, 24], [22, 24], [20, 27], [12, 27]], M.iron, { depth: S * 0.3 });
    for (const x of [11, 21]) T(c, [[x, 24], [x + (x < 16 ? 1.4 : -1.4), 14], [16, 6]], [0.7, 0.6, 0.5], M.iron, { depth: S * 0.2 });
    const g = c.createRadialGradient(16 * S, 17 * S, 0, 16 * S, 17 * S, 6 * S); g.addColorStop(0, '#fffaf0'); g.addColorStop(0.4, col); g.addColorStop(1, A.mix(col, '#200a04', 0.7));
    const em = K.polyPath([[12, 18], [14, 13], [18, 12], [21, 16], [19, 21], [14, 22]]); c.fillStyle = g; c.fill(em); c.lineWidth = S * 0.25; c.strokeStyle = INK; c.stroke(em);
    for (const [a, b] of [[[13, 16], [16, 15]], [[17, 14], [19, 18]], [[15, 20], [17, 18]]]) L(c, [a, b], 0.2, A.rgba('#2a1008', 0.6));
    T(c, [[16, 5], [16, 7]], [0.6, 0.6], M.gold, { depth: 0 }); } };

  function render(id) {
    const d = ICONS[id], SZ = 128;
    const obj = A.mk(SZ, SZ), oc = obj.getContext('2d'); d.draw.call(d, oc);
    const ink = A.outline(obj, S * 0.28, INK);
    const cv = A.mk(SZ, SZ), c = cv.getContext('2d');
    const aura = AURA[d.cat] || '#c8b8a0';
    const g = c.createRadialGradient(SZ / 2, SZ / 2, 0, SZ / 2, SZ / 2, SZ * 0.5); g.addColorStop(0, A.rgba(aura, 0.22)); g.addColorStop(1, A.rgba(aura, 0)); c.fillStyle = g; c.fillRect(0, 0, SZ, SZ);
    c.save(); c.globalAlpha = 0.5; c.filter = 'blur(4px)'; c.drawImage(ink, 3, 6); c.restore();
    c.drawImage(ink, 0, 0);
    return cv;
  }
  A.ICON_IDS = Object.keys(ICONS);
  A.register('icons', () => {
    const images = {}; for (const id of Object.keys(ICONS)) images[id] = render(id);
    return { images, meta: { dir: 'icons' }, kind: 'images' };
  });
})(window.ART);
