// Vesperal — HUD pintado: medalhão-relicário do Lume, moldura de ferro forjado da barra de vida (com remates
// de flor-de-lis), círios votivos da cura (aceso / gasto), urna de cinza e moldura da barra dos chefes.
// Unidades: 1 = 1 px lógico do HUD (640×360); pintado a ×6. → assets/ui/hud_*.png + assets/ui/hud.js
'use strict';
(function (A) {
  const S = 6, INK = '#0a080d', D2R = A.D2R;
  const iron = A.mat('#3a3640', { shadow: '#1c1a20', light: '#8a8494', deep: '#0c0b0f' });
  const ironD = A.mat('#2a272e', { shadow: '#141217', light: '#5c5866', deep: '#08070a' });
  const gold = A.mat('#b08a40', { shadow: '#5e4820', light: '#f0d896', deep: '#2a1e0c' });
  const wax = A.mat('#e6dcc4', { shadow: '#a89a7c', light: '#fffaf0' });
  const ash = A.mat('#8a8480', { shadow: '#4c4744', light: '#c8c0b8' });
  const P = (c, path, m, o) => A.paint(c, path, m, Object.assign({ light: [0.5, -1], depth: S * 0.5, inkW: S * 0.18, hlw: S * 0.25 }, o || {}));
  const circ = (cx, cy, r) => A.path((q) => { const n = 28; for (let i = 0; i <= n; i++) { const a = i / n * A.TAU; const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r; i ? q.L(x, y) : q.M(x, y); } q.Z(); }, S);
  const ring = (c, cx, cy, r0, r1, m, o) => { const p = new Path2D(); p.addPath(circ(cx, cy, r1)); const inner = circ(cx, cy, r0); p.addPath(inner); c.save(); c.fillStyle = m.base; c.fill(p, 'evenodd'); c.restore(); const g = c.createLinearGradient((cx - r1) * S, (cy - r1) * S, (cx + r1) * S, (cy + r1) * S); g.addColorStop(0, A.rgba(m.light, 0.9)); g.addColorStop(0.5, A.rgba(m.base, 0)); g.addColorStop(1, A.rgba(m.deep, 0.8)); c.fillStyle = g; c.fill(p, 'evenodd'); c.lineWidth = S * 0.18; c.strokeStyle = INK; c.stroke(circ(cx, cy, r1)); c.stroke(inner); void o; };
  const img = (w, h, fn) => { const cv = A.mk(Math.round(w * S), Math.round(h * S)); const c = cv.getContext('2d'); fn(c); return A.outline(cv, S * 0.22, INK); };

  // medalhão: relicário redondo de ferro com raios de sol dourados; poço escuro onde arde a chama (no jogo)
  function medallion() {
    const W = 52, C = 26;
    return img(W, W, (c) => {
      // raios de sol (8 compridos + 8 curtos)
      for (let i = 0; i < 16; i++) {
        const a = i / 16 * A.TAU - Math.PI / 2, L = i % 2 ? 23.5 : 25.5, w = i % 2 ? 0.07 : 0.1;
        P(c, A.path((q) => { q.M(C + Math.cos(a - w) * 19, C + Math.sin(a - w) * 19); q.L(C + Math.cos(a) * L, C + Math.sin(a) * L); q.L(C + Math.cos(a + w) * 19, C + Math.sin(a + w) * 19); q.Z(); }, S), gold, { depth: S * 0.2, hlw: S * 0.12 });
      }
      ring(c, C, C, 16.5, 20.5, iron);
      // filigrana: pequenas pérolas douradas no aro
      for (let i = 0; i < 12; i++) { const a = i / 12 * A.TAU; c.fillStyle = gold.light; c.beginPath(); c.arc((C + Math.cos(a) * 18.5) * S, (C + Math.sin(a) * 18.5) * S, 0.65 * S, 0, A.TAU); c.fill(); c.lineWidth = S * 0.12; c.strokeStyle = gold.deep; c.stroke(); }
      ring(c, C, C, 15.0, 16.5, gold);
      // poço de vidro escuro
      const g = c.createRadialGradient(C * S, (C - 3) * S, 0, C * S, C * S, 15 * S); g.addColorStop(0, '#2a1a16'); g.addColorStop(0.7, '#120c0c'); g.addColorStop(1, '#060406');
      c.fillStyle = g; c.fill(circ(C, C, 15));
      c.save(); c.clip(circ(C, C, 15)); c.fillStyle = 'rgba(255,255,255,0.06)'; c.beginPath(); c.ellipse((C - 4) * S, (C - 7) * S, 7 * S, 3.4 * S, -0.5, 0, A.TAU); c.fill(); c.restore();
      // engaste à direita, onde nasce a barra
      P(c, A.path((q) => { q.M(C + 19.6, C - 3.4); q.L(W, C - 2.6); q.L(W, C + 2.6); q.L(C + 19.6, C + 3.4); q.Z(); }, S), iron);
    });
  }
  // moldura da barra de vida: carris de ferro com rebites; remate esquerdo (gancho ao medalhão) e direito (flor-de-lis)
  const BH = 14, IN0 = 4.0, IN1 = 10.0; // altura total; interior da barra (y 4..10)
  function rails(c, w, m) {
    P(c, A.path((q) => { q.M(0, IN0 - 2.6); q.L(w, IN0 - 2.6); q.L(w, IN0); q.L(0, IN0); q.Z(); }, S), m, { depth: S * 0.25 });
    P(c, A.path((q) => { q.M(0, IN1); q.L(w, IN1); q.L(w, IN1 + 2.8); q.L(0, IN1 + 2.8); q.Z(); }, S), m, { depth: S * 0.25 });
    c.fillStyle = A.rgba(gold.base, 0.9); c.fillRect(0, (IN0 - 0.5) * S, w * S, 0.5 * S); c.fillRect(0, IN1 * S, w * S, 0.5 * S);
  }
  function barMid() { const w = 16; return img(w, BH, (c) => { rails(c, w, iron); for (const x of [4, 12]) { for (const y of [IN0 - 1.4, IN1 + 1.5]) { c.fillStyle = iron.light; c.beginPath(); c.arc(x * S, y * S, 0.45 * S, 0, A.TAU); c.fill(); } } }); }
  function barL() { const w = 8; return img(w, BH, (c) => { rails(c, w, iron); P(c, A.path((q) => { q.M(0, 0.6); q.L(4.2, 0.6); q.L(5.0, BH / 2); q.L(4.2, BH - 0.6); q.L(0, BH - 0.6); q.Z(); }, S), iron); c.fillStyle = gold.base; c.beginPath(); c.arc(2.4 * S, (BH / 2) * S, 1.3 * S, 0, A.TAU); c.fill(); c.lineWidth = S * 0.2; c.strokeStyle = INK; c.stroke(); }); }
  function barR() {
    const w = 16;
    return img(w, BH + 6, (c) => {
      c.translate(0, 3 * S); rails(c, 4, iron);
      // flor-de-lis de ferro com o miolo dourado
      const cy = BH / 2;
      P(c, A.path((q) => { q.M(2, IN0 - 2.6); q.Q(7, cy - 6, 9.6, cy - 8.4); q.Q(9.4, cy - 3.6, 6.4, cy - 0.8); q.L(6.4, cy + 0.8); q.Q(9.4, cy + 3.6, 9.6, cy + 8.4); q.Q(7, cy + 6, 2, IN1 + 2.8); q.Z(); }, S), iron);
      P(c, A.path((q) => { q.M(5.6, cy - 1.6); q.Q(11, cy - 2.6, 15.6, cy); q.Q(11, cy + 2.6, 5.6, cy + 1.6); q.Z(); }, S), iron);
      P(c, A.path((q) => { q.M(4.6, cy - 1.2); q.L(8.6, cy); q.L(4.6, cy + 1.2); q.Z(); }, S), gold, { depth: S * 0.2 });
    });
  }
  // círio votivo num copo de ferro (a chama acende-se no jogo); o gasto é um coto derretido com o pavio negro
  function candle(lit) {
    return img(10, 18, (c) => {
      const cx = 5;
      if (lit) {
        P(c, A.path((q) => { q.M(cx - 2.0, 4.0); q.Q(cx - 2.2, 9, cx - 2.0, 13); q.L(cx + 2.0, 13); q.Q(cx + 2.2, 9, cx + 2.0, 4.0); q.Q(cx, 3.2, cx - 2.0, 4.0); q.Z(); }, S), wax, { depth: S * 0.5 });
        P(c, A.path((q) => { q.M(cx + 0.8, 4.0); q.Q(cx + 1.6, 6, cx + 1.2, 8.2); q.Q(cx + 0.6, 8.6, cx + 0.6, 6.4); q.Z(); }, S), wax, { depth: S * 0.2 }); // pingo
        c.strokeStyle = '#2a1e14'; c.lineWidth = S * 0.35; c.beginPath(); c.moveTo(cx * S, 3.8 * S); c.lineTo(cx * S, 2.6 * S); c.stroke();
      } else {
        P(c, A.path((q) => { q.M(cx - 2.2, 10.0); q.Q(cx - 2.6, 11.5, cx - 2.0, 13); q.L(cx + 2.0, 13); q.Q(cx + 2.8, 11.6, cx + 2.2, 10.4); q.Q(cx + 0.6, 9.2, cx - 2.2, 10.0); q.Z(); }, S), A.mat('#a89c86', { shadow: '#6a5e4c', light: '#d4c8b0' }), { depth: S * 0.4 });
        c.strokeStyle = '#120c0a'; c.lineWidth = S * 0.35; c.beginPath(); c.moveTo(cx * S, 10.0 * S); c.quadraticCurveTo((cx + 0.4) * S, 9.0 * S, (cx + 0.2) * S, 8.4 * S); c.stroke();
      }
      // copo de ferro com aro dourado
      P(c, A.path((q) => { q.M(cx - 3.4, 12.4); q.L(cx + 3.4, 12.4); q.L(cx + 2.6, 16.2); q.Q(cx, 17.0, cx - 2.6, 16.2); q.Z(); }, S), iron, { depth: S * 0.3 });
      c.fillStyle = gold.base; c.fillRect((cx - 3.4) * S, 12.3 * S, 6.8 * S, 0.6 * S);
    });
  }
  // urna da cinza: pequeno relicário com a tampa entreaberta e cinza a escorrer
  function urn() {
    return img(14, 14, (c) => {
      P(c, A.path((q) => { q.M(3.0, 4.6); q.Q(1.4, 8.6, 4.2, 12.2); q.L(9.8, 12.2); q.Q(12.6, 8.6, 11.0, 4.6); q.Z(); }, S), iron);
      c.fillStyle = gold.base; c.fillRect(3.0 * S, 7.2 * S, 8.0 * S, 0.6 * S);
      P(c, A.path((q) => { q.M(4.0, 12.0); q.L(10.0, 12.0); q.L(11.0, 13.4); q.L(3.0, 13.4); q.Z(); }, S), iron, { depth: S * 0.2 });
      P(c, A.path((q) => { q.M(2.4, 4.8); q.Q(7, 1.6, 11.6, 4.8); q.Z(); }, S), ash, { depth: S * 0.3 }); // cinza a transbordar
      P(c, A.path((q) => { q.M(5.0, 3.0); q.L(9.0, 3.0); q.L(8.4, 1.4); q.L(5.6, 1.4); q.Z(); }, S), gold, { depth: S * 0.2 }); // pega
    });
  }
  // moldura da barra dos chefes (mais fina, carris escuros com cravos)
  const BBH = 10;
  function bossRails(c, w) {
    P(c, A.path((q) => { q.M(0, 1.4); q.L(w, 1.4); q.L(w, 3.4); q.L(0, 3.4); q.Z(); }, S), ironD, { depth: S * 0.2 });
    P(c, A.path((q) => { q.M(0, 7.4); q.L(w, 7.4); q.L(w, 9.2); q.L(0, 9.2); q.Z(); }, S), ironD, { depth: S * 0.2 });
    c.fillStyle = A.rgba(gold.shadow, 0.9); c.fillRect(0, 3.0 * S, w * S, 0.4 * S); c.fillRect(0, 7.4 * S, w * S, 0.4 * S);
  }
  function bossMid() { return img(16, BBH, (c) => { bossRails(c, 16); for (const x of [8]) for (const y of [2.4, 8.3]) { c.fillStyle = ironD.light; c.beginPath(); c.arc(x * S, y * S, 0.4 * S, 0, A.TAU); c.fill(); } }); }
  function bossCap(flip) {
    return img(14, BBH + 8, (c) => {
      if (flip) { c.translate(14 * S, 0); c.scale(-1, 1); }
      c.translate(0, 4 * S); bossRails(c, 6);
      const cy = BBH / 2 + 0.3;
      P(c, A.path((q) => { q.M(6, 1.4); q.Q(9.4, cy - 4, 13.4, cy - 6.6); q.Q(11.0, cy - 1.6, 9.0, cy); q.Q(11.0, cy + 1.6, 13.4, cy + 6.6); q.Q(9.4, cy + 4, 6, 9.2); q.Z(); }, S), ironD);
      P(c, A.path((q) => { q.M(7.0, cy - 1.0); q.L(10.6, cy); q.L(7.0, cy + 1.0); q.Z(); }, S), A.mat('#8a2a22', { light: '#d06050', shadow: '#4a1410' }), { depth: S * 0.2 });
    });
  }
  A.register('hud', () => {
    const images = { hud_medallion: medallion(), hud_bar_l: barL(), hud_bar_m: barMid(), hud_bar_r: barR(), hud_candle_lit: candle(true), hud_candle_out: candle(false), hud_ash: urn(), hud_boss_m: bossMid(), hud_boss_l: bossCap(true), hud_boss_r: bossCap(false) };
    const meta = { scale: S }; for (const [k, cv] of Object.entries(images)) meta[k] = [cv.width / S, cv.height / S];
    const js = "'use strict';\n(window.VS = window.VS || {}).HUD_META = " + JSON.stringify(meta) + ";\n";
    return { images, meta: { dir: 'ui', js }, kind: 'images' };
  });
})(window.ART);
