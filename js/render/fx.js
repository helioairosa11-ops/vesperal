// Vesperal — efeitos de combate: cortes curvos, impactos por material, carga do golpe pesado, parry e guarda.
// Substitui os antigos riscos brancos retos e a cruz geométrica do golpe carregado.
// Cada efeito vive em coordenadas do mundo; os brilhos são desenhados por cima da escuridão (depois das luzes).
'use strict';
(function (VS) {
  const U = VS.U, G = VS.Gfx;
  const FX = { list: [] };

  // materiais dos alvos: cor da "carne", do brilho e o que salta do golpe
  const MAT = {
    flesh: { tint: [255, 168, 104], drops: ['#2c1a1e', '#3e2026', '#1e1216'], flakes: ['#5a5058', '#3a3238'], embers: 3, sparks: 0 },
    ash: { tint: [255, 176, 96], drops: ['#3a3234', '#56484a', '#2a2426'], flakes: ['#7a6e70', '#4a4044'], embers: 6, sparks: 0 },
    armor: { tint: [255, 222, 150], drops: [], flakes: ['#6a6670'], embers: 0, sparks: 12 },
    stone: { tint: [236, 220, 196], drops: [], flakes: ['#8a7e70', '#6a6058', '#a89a88'], embers: 0, sparks: 4, dust: '#8a7e70' },
    spirit: { tint: [196, 168, 255], drops: [], flakes: [], embers: 0, sparks: 0, wisps: 8 },
    glass: { tint: [230, 210, 255], drops: [], flakes: [], embers: 0, sparks: 2, shards: ['#d04050', '#3a70c0', '#e0b040', '#40a070'] },
    wax: { tint: [255, 214, 140], drops: ['#e8dcb8', '#cfc09a', '#f4ecd0'], flakes: [], embers: 4, sparks: 0 },
    wood: { tint: [240, 200, 150], drops: [], flakes: ['#6a4a30', '#4a3420', '#8a6440'], embers: 0, sparks: 0, dust: '#5a4a3a' },
    molten: { tint: [255, 150, 60], drops: ['#ff9030', '#ffd060', '#c04010'], flakes: [], embers: 10, sparks: 6 },
    plant: { tint: [210, 240, 170], drops: ['#3a5a30', '#2a4022', '#6a8a40'], flakes: ['#4a6a34'], embers: 0, sparks: 0 },
    water: { tint: [190, 230, 230], drops: ['#80b0b0', '#a0d0d0', '#5a8a8a'], flakes: [], embers: 0, sparks: 0 },
  };
  // marcas das armas: cor do corte e forma
  const WEAPON_MARK = {
    blade: { core: [255, 250, 236], edge: [255, 196, 140], len: 30, wid: 4.2 },
    quick: { core: [244, 255, 255], edge: [170, 230, 230], len: 22, wid: 2.8 },
    long: { core: [255, 250, 232], edge: [240, 210, 160], len: 36, wid: 3.6 },
    spirit: { core: [248, 240, 255], edge: [176, 140, 255], len: 34, wid: 5 },
    royal: { core: [255, 240, 200], edge: [255, 120, 40], len: 40, wid: 5.6 },
  };
  const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
  const add = (o) => { if (FX.list.length < 120) FX.list.push(Object.assign({ t: 0, life: 0.2 }, o)); };
  FX.clear = () => { FX.list.length = 0; };

  // ---------------------------------------------------------------- primitivas
  // corte: crescente fina ao longo da direção do golpe (ang), curvada para o lado de 'bend'
  FX.cut = (x, y, ang, o = {}) => add({ type: 'cut', x, y, ang, life: o.life || 0.16, len: o.len || 30, wid: o.wid || 4, bend: o.bend !== undefined ? o.bend : 5, core: o.core || [255, 250, 236], edge: o.edge || [255, 196, 140] });
  // clarão suave (sem raios): núcleo branco quente e halo da cor do material
  FX.flare = (x, y, r, col, life) => add({ type: 'flare', x, y, r, col: col || [255, 220, 170], life: life || 0.12 });
  // anel elíptico (choque no chão, sino do parry)
  FX.ring = (x, y, rx, ry, col, life, width) => add({ type: 'ring', x, y, rx, ry, col: col || [255, 230, 190], life: life || 0.3, width: width || 2 });
  // fagulhas de metal: riscos curtos que caem
  FX.sparks = (x, y, n, dir, o = {}) => {
    for (let i = 0; i < n; i++) {
      const a = (dir > 0 ? 0 : Math.PI) + U.rand(-1, 1) * (o.spread || 1.1) - (o.up || 0.5);
      const sp = U.rand(120, o.speed || 320);
      G.emit({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, g: 620, drag: 1.5, life: U.rand(0.18, 0.42), size: U.rand(1.6, 2.6), color: U.pick(o.cols || ['#fff4d0', '#ffd27a', '#ffae48']), add: true, kind: 'line', layer: 2 });
    }
  };
  // poeira: baforadas que crescem e se dissipam
  FX.dust = (x, y, n, col, o = {}) => {
    for (let i = 0; i < n; i++) G.emit({ x: x + U.rand(-(o.jx || 6), o.jx || 6), y: y + U.rand(-3, 2), vx: U.rand(-1, 1) * (o.speed || 50), vy: U.rand(-30, -6), drag: 3, life: U.rand(0.4, 0.8), size: U.rand(2.5, 4.5), grow: o.grow || 2.4, color: col || '#8a7e70', alpha: o.alpha || 0.5, kind: 'puff' });
  };

  // ---------------------------------------------------------------- impacto de um golpe
  // o = { x, y, mat (alvo), wmat (arma: blade|blunt|spirit), mark (estilo do corte), ang (direção do golpe), dir, power, heavy }
  FX.hit = function (o) {
    const m = MAT[o.mat] || MAT.flesh, p = o.power || 1, dir = o.dir || 1;
    const x = o.x, y = o.y;
    const ang = o.ang !== undefined ? o.ang : (dir > 0 ? 0 : Math.PI);
    if (o.wmat === 'blunt') {
      // malho: esmaga — clarão largo, anel achatado e lascas, sem corte
      FX.flare(x, y, 18 + 8 * p, m.tint, 0.16);
      // estilhaços em leque, curtos e pesados (sem anéis geométricos)
      for (let i = 0; i < 6 + Math.round(4 * p); i++) { const a = U.rand(0, U.TAU), sp = U.rand(80, 200); G.emit({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 40, g: 700, drag: 2, life: U.rand(0.25, 0.45), size: U.rand(1.2, 2.2), color: rgba(m.tint, 0.9), add: true, kind: 'line', layer: 2 }); }
      FX.dust(x, y + 4, 4 + Math.round(3 * p), m.dust || '#6a5e58', { speed: 70 });
    } else {
      const wm = WEAPON_MARK[o.mark] || WEAPON_MARK.blade;
      const sc = (o.heavy ? 1.3 : 1) * (0.85 + 0.15 * p);
      FX.cut(x, y, ang, { len: wm.len * sc, wid: wm.wid * sc, core: wm.core, edge: wm.edge, bend: (o.bend || 1) * 6 * sc, life: o.heavy ? 0.2 : 0.15 });
      FX.flare(x, y, 9 + 5 * p, wm.edge, 0.09);
    }
    // resposta do material
    // os salpicos seguem a direção do golpe
    const vx = Math.cos(ang), vy = Math.sin(ang);
    if (m.drops.length) for (let i = 0; i < Math.round((o.heavy ? 12 : 7) * p); i++) {
      const sp = U.rand(60, 220), a = Math.atan2(vy, vx) + U.rand(-0.7, 0.7);
      G.emit({ x: x + U.rand(-3, 3), y: y + U.rand(-3, 3), vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 60, g: 520, life: U.rand(0.35, 0.7), size: U.rand(0.9, 2), color: U.pick(m.drops), collide: true });
    }
    if (m.flakes.length) for (let i = 0; i < Math.round(4 * p); i++) G.emit({ x, y, vx: vx * U.rand(20, 90) + U.rand(-40, 40), vy: U.rand(-90, -20), g: 160, drag: 1, life: U.rand(0.6, 1.1), size: U.rand(1, 2), color: U.pick(m.flakes), kind: 'flake', vr: U.rand(-6, 6) });
    for (let i = 0; i < Math.round(m.embers * p); i++) G.emit({ x: x + U.rand(-4, 4), y: y + U.rand(-4, 4), vx: vx * U.rand(10, 60) + U.rand(-30, 30), vy: U.rand(-80, -20), drag: 1.2, life: U.rand(0.4, 0.9), size: U.rand(0.8, 1.5), color: U.pick(['#ffb040', '#ff7a20', '#ffe0a0']), add: true, shrink: true, layer: 2 });
    if (m.sparks) FX.sparks(x, y, Math.round(m.sparks * p * (o.wmat === 'blunt' ? 0.6 : 1)), Math.sign(vx) || dir, { speed: 300 + 60 * p });
    if (m.dust) FX.dust(x, y, Math.round(3 * p), m.dust);
    if (m.wisps) for (let i = 0; i < Math.round(m.wisps * p); i++) G.emit({ x: x + U.rand(-6, 6), y: y + U.rand(-8, 8), vx: vx * U.rand(10, 50) + U.rand(-25, 25), vy: U.rand(-50, -10), wobble: U.rand(3, 6), drag: 1.4, life: U.rand(0.5, 1), size: U.rand(1.2, 2.4), color: U.pick(['#c8b0ff', '#e8dcff', '#9a7ae0']), add: true, kind: 'glow', layer: 2 });
    if (m.shards) for (let i = 0; i < Math.round(6 * p); i++) G.emit({ x, y, vx: vx * U.rand(40, 160) + U.rand(-60, 60), vy: U.rand(-160, -40), g: 600, life: U.rand(0.5, 0.9), size: U.rand(1.2, 2.2), color: U.pick(m.shards), kind: 'shard', vr: U.rand(-10, 10), collide: true });
    if (o.wmat === 'spirit' && o.mat !== 'spirit') for (let i = 0; i < 4; i++) G.emit({ x, y, vx: U.rand(-40, 40), vy: U.rand(-60, -10), wobble: 4, drag: 1, life: 0.7, size: 1.6, color: '#d8c8ff', add: true, kind: 'glow', layer: 2 });
  };

  // golpe bloqueado por um escudo/guarda (do inimigo ou do herói)
  FX.block = function (x, y, dir, big) {
    FX.flare(x, y, big ? 16 : 11, [255, 226, 170], 0.1);
    FX.sparks(x, y, big ? 10 : 6, -dir, { speed: 260, up: 0.7 });
    FX.cut(x, y, -Math.PI / 2, { len: big ? 20 : 14, wid: 2.4, bend: dir * 6, core: [255, 248, 230], edge: [255, 200, 120], life: 0.12 });
  };

  // parry: o metal canta — clarão branco-dourado, arco de deflexão, anel de sino e fagulhas em leque
  FX.parry = function (x, y, dir) {
    FX.flare(x, y, 34, [255, 236, 190], 0.24);
    FX.cut(x, y, -Math.PI / 2 + dir * 0.25, { len: 34, wid: 5, bend: dir * 12, core: [255, 255, 245], edge: [255, 210, 120], life: 0.22 });
    // estrias de luz que se abrem a partir do ponto do parry (curtas, desiguais, sem simetria)
    for (let i = 0; i < 9; i++) { const a = (dir > 0 ? 0 : Math.PI) + U.rand(-1.4, 1.4), sp = U.rand(260, 520); G.emit({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, drag: 9, life: U.rand(0.12, 0.22), size: U.rand(2.4, 3.6), color: '#fffaf0', add: true, kind: 'line', layer: 2 }); }
    FX.sparks(x, y, 18, -dir, { speed: 380, spread: 1.6, up: 0.6 });
    FX.sparks(x, y, 8, dir, { speed: 200, spread: 1.2, up: 0.9, cols: ['#ffffff', '#fff0c0'] });
  };

  // herói ferido: sangue escuro e fagulhas do relicário
  FX.hurt = function (x, y, dir) {
    for (let i = 0; i < 12; i++) { const a = (dir > 0 ? 0 : Math.PI) + U.rand(-0.9, 0.9) - 0.4; const sp = U.rand(60, 200); G.emit({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, g: 520, life: U.rand(0.4, 0.8), size: U.rand(1, 2.2), color: U.pick(['#5a1018', '#3a0a10', '#7a1820']), collide: true }); }
    for (let i = 0; i < 5; i++) G.emit({ x, y, vx: U.rand(-60, 60), vy: U.rand(-110, -30), drag: 1, life: 0.7, size: 1.2, color: U.pick(['#ffb040', '#ff7020']), add: true, shrink: true, layer: 2 });
    FX.flare(x, y, 14, [255, 120, 90], 0.1);
  };

  // posição da pega da arma (meio da lâmina quando há folha de sprites; senão, à frente do peito)
  function gripPos(p) {
    const b = VS.HeroRender && VS.HeroRender.blade && VS.HeroRender.blade(p);
    if (b) return { x: (b.x + b.x1) / 2, y: (b.y + b.y1) / 2 };
    return { x: p.cx + p.dir * 8, y: p.cy - 4 };
  }
  // pancada sem alvo vivo (lâmina na parede, malho no chão): fagulhas/pó do material, sem corte
  FX.impact = function (x, y, mat, dir, power) {
    const m = MAT[mat] || MAT.stone, p = power || 1;
    FX.flare(x, y, 8 + 6 * p, m.tint, 0.1);
    if (m.sparks) FX.sparks(x, y, Math.round(m.sparks * p), -(dir || 1), { speed: 260, up: 0.6 });
    if (m.dust) FX.dust(x, y, Math.round(3 * p), m.dust);
    // impacto forte: poeira a rasar o chão para os dois lados (sem anéis geométricos)
    if (p > 1) for (const s of [-1, 1]) for (let i = 0; i < 3; i++) G.emit({ x: x + s * U.rand(2, 8), y: y - 2, vx: s * U.rand(60, 150), vy: U.rand(-24, -4), drag: 3.2, life: U.rand(0.45, 0.8), size: U.rand(3, 5), grow: 2.2, color: m.dust || '#8a7e70', alpha: 0.45, kind: 'puff' });
    for (let i = 0; i < Math.round(3 * p); i++) G.emit({ x, y, vx: U.rand(-60, 60), vy: U.rand(-140, -40), g: 600, life: U.rand(0.4, 0.7), size: U.rand(1, 1.8), color: U.pick(m.flakes.length ? m.flakes : ['#8a7e70']), kind: 'shard', vr: U.rand(-10, 10), collide: true });
  };
  // golpe pesado a carregar: brasas convergem para a pega; quando pronto, um clarão e um anel (nunca uma cruz)
  FX.charging = function (p, k, col) {
    const g = gripPos(p);
    if (Math.random() < 0.35 + k * 0.5) {
      const a = U.rand(0, U.TAU), r = U.rand(14, 24);
      G.emit({ x: g.x + Math.cos(a) * r, y: g.y + Math.sin(a) * r, vx: -Math.cos(a) * r * 4, vy: -Math.sin(a) * r * 4, life: 0.24, size: U.rand(0.8, 1.4), color: col || U.pick(['#ffb040', '#ffd890']), add: true, shrink: true, layer: 2 });
    }
  };
  FX.chargeReady = function (p, col) {
    const g = gripPos(p);
    const c = col || [255, 190, 90];
    FX.flare(g.x, g.y, 24, c, 0.26);
    for (let i = 0; i < 12; i++) { const a = (i / 12) * U.TAU + U.rand(-0.2, 0.2); G.emit({ x: g.x, y: g.y, vx: Math.cos(a) * 90, vy: Math.sin(a) * 90, drag: 4, life: 0.4, size: 1.2, color: rgba(c, 1), add: true, shrink: true, layer: 2 }); }
  };

  // atordoado (parry/postura): fagulhas que sobem à volta da cabeça e um clarão curto — sem anéis
  FX.stun = function (e) {
    const x = e.cx, y = e.y + 2;
    FX.flare(x, y, 16, [255, 236, 190], 0.18);
    for (let i = 0; i < 10; i++) { const a = U.rand(0, U.TAU); G.emit({ x: x + Math.cos(a) * 6, y: y + Math.sin(a) * 3, vx: Math.cos(a) * 40, vy: -U.rand(30, 70), drag: 2.5, life: U.rand(0.5, 0.9), size: U.rand(0.8, 1.4), color: U.pick(['#fff4d0', '#ffd890']), add: true, shrink: true, layer: 2 }); }
  };
  // um morto de cinza desfaz-se: poeira cinzenta que sobe e brasas pequenas
  FX.dissolve = function (e, ember) {
    if (Math.random() < 0.8) G.emit({ x: e.cx + U.rand(-e.w / 2, e.w / 2), y: e.y + U.rand(e.h * 0.2, e.h), vx: U.rand(-12, 12), vy: U.rand(-40, -12), drag: 1, life: U.rand(0.7, 1.2), size: U.rand(1.2, 2.4), grow: 1.4, color: U.pick(['#5a5458', '#6c6468', '#4a4446']), alpha: 0.3, kind: 'puff' });
    if (Math.random() < 0.5) G.emit({ x: e.cx + U.rand(-e.w / 2, e.w / 2), y: e.y + U.rand(0, e.h), vx: U.rand(-15, 15), vy: U.rand(-55, -20), drag: 0.8, life: U.rand(0.6, 1.1), size: U.rand(0.6, 1.1), color: U.pick([ember || '#ff9040', '#ffd080']), add: true, shrink: true, layer: 2 });
  };
  // ---------------------------------------------------------------- ciclo
  FX.update = function (dt) {
    const L = FX.list;
    for (let i = L.length - 1; i >= 0; i--) { L[i].t += dt; if (L[i].t >= L[i].life) L.splice(i, 1); }
  };
  function drawCut(ctx, e, k) {
    // entra depressa (0..30%), depois afina e desvanece
    const grow = Math.min(1, k / 0.3), fade = k < 0.3 ? 1 : 1 - (k - 0.3) / 0.7;
    const len = e.len * (0.55 + 0.45 * grow), wid = e.wid * (0.4 + 0.6 * fade), bend = e.bend;
    ctx.save(); ctx.translate(e.x, e.y); ctx.rotate(e.ang);
    const shape = (L, W, B) => { ctx.beginPath(); ctx.moveTo(-L / 2, 0); ctx.quadraticCurveTo(0, -B - W, L / 2, 0); ctx.quadraticCurveTo(0, -B + W * 0.35, -L / 2, 0); ctx.closePath(); };
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = rgba(e.edge, 0.45 * fade); shape(len * 1.12, wid * 2.1, bend); ctx.fill();
    ctx.fillStyle = rgba(e.core, 0.95 * fade); shape(len, wid, bend); ctx.fill();
    ctx.restore();
  }
  FX.draw = function (ctx) {
    if (!FX.list.length) return;
    ctx.save();
    for (const e of FX.list) {
      const k = e.t / e.life;
      if (e.type === 'cut') drawCut(ctx, e, k);
      else if (e.type === 'flare') {
        const r = e.r * (0.7 + 0.5 * k), a = (1 - k) * (1 - k);
        ctx.globalCompositeOperation = 'lighter';
        const gr = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, r);
        gr.addColorStop(0, `rgba(255,255,250,${0.9 * a})`); gr.addColorStop(0.25, rgba(e.col, 0.55 * a)); gr.addColorStop(1, rgba(e.col, 0));
        ctx.fillStyle = gr; ctx.fillRect(e.x - r, e.y - r, r * 2, r * 2);
      } else if (e.type === 'ring') {
        const s = 1 + k * 2.6, a = 1 - k;
        ctx.globalCompositeOperation = 'lighter';
        ctx.strokeStyle = rgba(e.col, 0.8 * a); ctx.lineWidth = e.width * (1 - k * 0.7);
        ctx.beginPath(); ctx.ellipse(e.x, e.y, e.rx * s, e.ry * s, 0, 0, U.TAU); ctx.stroke();
      }
    }
    ctx.restore();
    ctx.globalCompositeOperation = 'source-over';
  };
  // luz dos clarões (para a passagem de iluminação)
  FX.lights = function () {
    for (const e of FX.list) if (e.type === 'flare' && e.r > 12) G.light(e.x, e.y, e.r * 4, '#' + e.col.map((v) => v.toString(16).padStart(2, '0')).join(''), 0.6 * (1 - e.t / e.life), 0);
  };
  FX.MAT = MAT;
  VS.FX = FX;
})(window.VS);
