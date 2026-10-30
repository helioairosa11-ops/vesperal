// Vesperal — fundos pintados das regiões, no espírito barroco e penitente da referência: catedrais de cúpula, torres
// sineiras, casario caiado, procissões de capirotes com círios, estátuas colossais (a Mãe das Dores com as sete
// espadas, o Vigia de armadura, a Mãe das Águas, a Virgem da lua, reis ajoelhados), braços de pedra com círios, sinos,
// sóis negros. Tudo desenho original, gerado uma vez por região e guardado em cache.
// Técnica: cada grupo de formas vira uma máscara; a máscara é pintada com um degradê (a base mergulha na névoa), um
// fio de luz do lado da luz e manchas de pincel; nuvens com a barriga acesa; névoa entre planos. Cada plano é uma
// faixa de 960×360 que emenda nas pontas (as formas desenham-se também uma faixa à esquerda e outra à direita).
'use strict';
(function (VS) {
  const U = VS.U, BG = VS.BG;
  if (!BG || !BG.STYLES) return;
  const LW = BG.LW, LH = BG.LH, S = BG.STYLES, TAU = Math.PI * 2;
  const HAS_FILTER = (() => { try { const x = document.createElement('canvas').getContext('2d'); return !!x && typeof x.filter === 'string'; } catch (e) { return false; } })();

  // ======================================================================= telas de rascunho
  // três telas reaproveitadas durante a construção e libertadas no fim (no telemóvel não convém criar dezenas de
  // telas grandes de uma vez)
  const pool = [];
  function scratch(i, c) {
    const W = c.canvas.width, H = c.canvas.height;
    let can = pool[i]; if (!can) can = pool[i] = document.createElement('canvas');
    if (can.width !== W || can.height !== H) { can.width = W; can.height = H; }
    const o = can.getContext('2d');
    o.setTransform(1, 0, 0, 1, 0, 0); o.globalCompositeOperation = 'source-over'; o.globalAlpha = 1; if (HAS_FILTER) o.filter = 'none';
    o.clearRect(0, 0, W, H); const k = W / LW; o.setTransform(k, 0, 0, k, 0, 0);
    return o;
  }
  function freePool() { for (const can of pool) if (can) { can.width = 1; can.height = 1; } sprites.clear(); }
  // um estilo de região: no fim do último plano, liberta as telas de rascunho
  function style(fn) {
    return function (R, layers) {
      fn(R, layers);
      // o céu (quase parado) vai na mesma tela do plano longínquo: menos uma camada inteira a compor em cada imagem
      if (layers.length > 2 && layers[0].p <= 0.03) {
        const a = layers.shift(), b = layers[0];
        const anim = a.anim || b.anim ? function (c, t, cam) { if (a.anim) a.anim(c, t, cam); if (b.anim) b.anim(c, t, cam); } : null;
        layers[0] = { p: b.p * 0.8, draw(c, rnd) { a.draw.call(this, c, rnd); b.draw.call(this, c, rnd); }, anim };
      }
      const last = layers[layers.length - 1];
      if (last) { const d = last.draw; last.draw = function (c, rnd) { d.call(this, c, rnd); freePool(); }; }
    };
  }
  // repete um desenho uma faixa à esquerda e outra à direita (o desenho tem de ser determinístico)
  function rep(c, fn) { for (const dx of [-LW, 0, LW]) { c.save(); c.translate(dx, 0); fn(c); c.restore(); } }

  // ======================================================================= formas
  const P = () => new Path2D();
  const rect = (x, y, w, h) => { const p = P(); p.rect(x, y, w, h); return p; };
  const poly = (pts) => { const p = P(); p.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) p.lineTo(pts[i][0], pts[i][1]); p.closePath(); return p; };
  const circ = (x, y, r) => { const p = P(); p.arc(x, y, r, 0, TAU); return p; };
  const ell = (x, y, rx, ry, rot) => { const p = P(); p.ellipse(x, y, rx, ry, rot || 0, 0, TAU); return p; };
  const line = (pts, w) => { const p = P(); p.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) p.lineTo(pts[i][0], pts[i][1]); p.line = w; return p; };
  const cut = (p) => { p.cut = true; return p; };      // apaga (vão por onde se vê o que está atrás)
  const after = (p) => { p.after = true; return p; };  // desenha depois dos vãos (um sino dentro de um vão)
  function archP(p, cx, by, w, h) { const r = w / 2; p.moveTo(cx - r, by); p.lineTo(cx - r, by - h + r); p.arc(cx, by - h + r, r, Math.PI, 0); p.lineTo(cx + r, by); p.closePath(); return p; }
  const archHole = (cx, by, w, h) => cut(archP(P(), cx, by, w, h));
  // crista periódica (emenda em LW)
  function ridge(base, amp, cyc, seed, jag) {
    const p = P(); p.moveTo(-2, LH + 2);
    for (let x = 0; x <= LW; x += 4) {
      const t = x / LW * TAU;
      let y = base - amp * (0.55 * Math.sin(t * cyc[0] + seed) + 0.3 * Math.sin(t * cyc[1] + seed * 2.3) + 0.15 * Math.sin(t * cyc[2] + seed * 4.1));
      if (jag) y += Math.sin(t * 37 + seed) * jag * 0.6 + Math.sin(t * 83 + seed * 3) * jag * 0.4;
      p.lineTo(x, y);
    }
    p.lineTo(LW + 2, LH + 2); p.closePath(); return p;
  }

  // ======================================================================= pintura
  function mask(c, shapes, flipY) {
    const m = scratch(0, c);
    m.fillStyle = '#000'; m.strokeStyle = '#000'; m.lineCap = 'round'; m.lineJoin = 'round';
    if (flipY !== undefined) { m.translate(0, flipY * 2); m.scale(1, -1); }
    const pass = (test) => { for (const dx of [-LW, 0, LW]) { m.save(); m.translate(dx, 0); for (const p of shapes) if (test(p)) { if (p.line) { m.lineWidth = p.line; m.stroke(p); } else m.fill(p); } m.restore(); } };
    pass((p) => !p.cut && !p.after);
    m.globalCompositeOperation = 'destination-out'; pass((p) => p.cut);
    m.globalCompositeOperation = 'source-over'; pass((p) => p.after);
    return m;
  }
  // pinta um grupo de formas como uma só silhueta
  // o: { col, bot, y0, y1 (degradê vertical), rim, rx, ry, rimA (fio de luz), shade(t) (pinta por cima, só dentro),
  //      alpha, blur, flipY (reflexo à volta desta linha) }
  function paint(c, shapes, o) {
    const k = c.canvas.width / LW, W = c.canvas.width, H = c.canvas.height, m = mask(c, shapes, o.flipY), t = scratch(1, c);
    const tinted = (fill, extra) => {
      t.setTransform(1, 0, 0, 1, 0, 0); t.globalCompositeOperation = 'source-over'; t.clearRect(0, 0, W, H); t.drawImage(m.canvas, 0, 0);
      t.setTransform(k, 0, 0, k, 0, 0); t.globalCompositeOperation = 'source-in'; t.fillStyle = fill; t.fillRect(-2, -2, LW + 4, LH + 4);
      if (extra) { t.globalCompositeOperation = 'source-atop'; rep(t, extra); }
      t.globalCompositeOperation = 'source-over'; return t.canvas;
    };
    const put = (can, dx, dy, a) => {
      c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = a;
      if (o.blur && HAS_FILTER) c.filter = 'blur(' + (o.blur * k).toFixed(2) + 'px)';
      c.drawImage(can, dx * k, dy * k); c.restore();
    };
    if (o.rim) put(tinted(o.rim), -(o.rx === undefined ? 0.35 : o.rx), -(o.ry === undefined ? 0.9 : o.ry), o.rimA === undefined ? 1 : o.rimA);
    let fill = o.col;
    if (o.bot) { const g = t.createLinearGradient(0, o.y0, 0, o.y1); g.addColorStop(0, o.col); g.addColorStop(1, o.bot); fill = g; }
    put(tinted(fill, o.shade), 0, 0, o.alpha === undefined ? 1 : o.alpha);
  }
  // brilho: um degradê radial pré-desenhado por cor e esticado (muito mais barato do que criar um degradê por luz)
  const sprites = new Map();
  function glowSprite(col) {
    let sp = sprites.get(col); if (sp) return sp;
    sp = document.createElement('canvas'); sp.width = sp.height = 128;
    const x = sp.getContext('2d'), g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, U.rgba(col, 1)); g.addColorStop(0.3, U.rgba(col, 0.5)); g.addColorStop(1, U.rgba(col, 0));
    x.fillStyle = g; x.fillRect(0, 0, 128, 128); sprites.set(col, sp); return sp;
  }
  function glow(c, x, y, r, col, a, op) {
    c.save(); if (op) c.globalCompositeOperation = op; c.globalAlpha *= Math.min(1, a);
    c.drawImage(glowSprite(col), x - r, y - r, r * 2, r * 2); c.restore();
  }
  const glows = (list, r, col, a, op) => (c) => { for (const [x, y, rr] of list) glow(c, x, y, rr || r, col, a, op); };
  // luz pintada por dentro de uma silhueta (do lado de uma fonte de luz)
  const lightIn = (x, y, r, col, a) => (t) => glow(t, x, y, r, col, a);
  // manchas de pincel: variação de tom dentro das silhuetas
  function mottle(rnd, n, y0, y1, cols, a) {
    const b = []; for (let i = 0; i < n; i++) b.push([rnd() * LW, y0 + rnd() * (y1 - y0), 8 + rnd() * 34, cols[i % cols.length]]);
    return (t) => { for (const [x, y, r, col] of b) glow(t, x, y, r, col, a); };
  }
  function horizon(c, y0, y1, col, a) { const g = c.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, U.rgba(col, 0)); g.addColorStop(1, U.rgba(col, a)); c.fillStyle = g; c.fillRect(0, y0, LW, y1 - y0); }

  // curva suave (Catmull-Rom) por uma lista de pontos; fechada, ou aberta com o fundo em linha recta
  function smooth(pts, closed) {
    const p = P(), n = pts.length, at = (i) => pts[closed ? (i + n) % n : Math.max(0, Math.min(n - 1, i))];
    p.moveTo(pts[0][0], pts[0][1]);
    for (let i = 0; i < (closed ? n : n - 1); i++) {
      const p0 = at(i - 1), p1 = at(i), p2 = at(i + 1), p3 = at(i + 2);
      p.bezierCurveTo(p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6, p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6, p2[0], p2[1]);
    }
    p.closePath(); return p;
  }
  // cúmulos: cada nuvem é um monte de bolhas (maiores ao meio) de base plana; a borda virada à luz acende-se (de
  // baixo ao pôr do sol, ou de cima com from:'top'), o lado oposto fica na sombra; bordas suaves.
  // floor: true enche tudo por baixo (mar de nuvens)
  function cumulus(c, rnd, o) {
    const k = c.canvas.width / LW, puffs = [], x0 = o.x0 === undefined ? 0 : o.x0, x1 = o.x1 === undefined ? LW : o.x1;
    const sy = o.sy || 0.8, lw = o.litW === undefined ? 0.2 : o.litW, top = o.from === 'top';
    for (let i = 0; i < o.n; i++) {
      const cx = x0 + rnd() * (x1 - x0), cy = o.y + (rnd() - 0.5) * o.dy, w = o.w0 + rnd() * (o.w1 - o.w0);
      if (o.avoid && Math.abs(cx - o.avoid[0]) < o.avoid[1] + w * 0.3) continue;
      const m = 4 + Math.floor(w / 16);
      for (let j = 0; j < m; j++) {
        const t = (j + 0.5) / m, prof = Math.sin(t * Math.PI), r = w * (0.07 + 0.13 * prof) * (0.75 + rnd() * 0.5) * (o.tall || 1);
        puffs.push([cx - w / 2 + t * w + (rnd() - 0.5) * w / m * 0.8, cy - r * sy * (0.35 + prof * 0.5), r, cy]);
      }
    }
    const shape = (x, y, r, base) => {
      const p = P(), ry = r * sy, d = base - y;
      if (top || d >= ry) { p.ellipse(x, y, r, ry, 0, 0, TAU); return p; }
      const a = Math.asin(Math.max(-1, d / ry)); p.ellipse(x, y, r, ry, 0, Math.PI - a, TAU + a); p.closePath(); return p;
    };
    const sgn = top ? 1 : -1, lit = puffs.map(([x, y, r, b]) => shape(x, y, r, b));
    const body = puffs.map(([x, y, r, b]) => shape(x, y + sgn * r * lw, r, b + sgn * r * lw * 0.6));
    if (o.floor) { lit.push(rect(-2, o.y, LW + 4, LH - o.y + 4)); body.push(rect(-2, o.y + 6, LW + 4, LH - o.y)); }
    const m = mask(c, lit), t = scratch(1, c);
    t.setTransform(1, 0, 0, 1, 0, 0); t.drawImage(m.canvas, 0, 0); t.setTransform(k, 0, 0, k, 0, 0);
    t.globalCompositeOperation = 'source-in'; t.fillStyle = o.lit; t.fillRect(-2, -2, LW + 4, LH + 4);
    t.globalCompositeOperation = 'source-atop'; t.fillStyle = o.body;
    rep(t, (q) => { for (const p of body) q.fill(p); });
    if (o.shadeCol) {
      const ya = o.y - o.dy / 2 - o.w1 * 0.3, yb = o.y + o.dy / 2, g = t.createLinearGradient(0, ya, 0, yb);
      const a0 = U.rgba(o.shadeCol, o.shadeA || 0.5), a1 = U.rgba(o.shadeCol, 0);
      if (top) { g.addColorStop(0, a1); g.addColorStop(1, a0); } else { g.addColorStop(0, a0); g.addColorStop(1, a1); }
      t.fillStyle = g; t.fillRect(-2, top ? o.y : ya, LW + 4, top ? LH - o.y + 4 : yb - ya);
    }
    if (o.shade) rep(t, o.shade);
    t.globalCompositeOperation = 'source-over';
    c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = o.alpha === undefined ? 1 : o.alpha;
    if (o.blur && HAS_FILTER) c.filter = 'blur(' + (o.blur * k).toFixed(2) + 'px)';
    c.drawImage(t.canvas, 0, 0); c.restore();
  }
  const both = (...fs) => (t) => { for (const f of fs) if (f) f(t); };
  // banco de nuvens: bolhas unidas; cada bolha tem a borda acesa do lado da luz (de baixo, ou de cima com from:'top')
  function clouds(c, rnd, o) {
    const k = c.canvas.width / LW, sx = o.sx || 1.7, sy = o.sy || 0.7, lw = o.litW === undefined ? 0.24 : o.litW, puffs = [];
    const x0 = o.x0 === undefined ? 0 : o.x0, x1 = o.x1 === undefined ? LW : o.x1;
    for (let i = 0; i < o.n; i++) {
      const x = x0 + rnd() * (x1 - x0), r = o.r0 + rnd() * (o.r1 - o.r0), y = o.y + (rnd() - 0.5) * o.dy;
      if (o.avoid && Math.abs(x - o.avoid[0]) < o.avoid[1]) continue;
      puffs.push([x, y, r]);
    }
    const m = mask(c, puffs.map(([x, y, r]) => ell(x, y, r * sx, r * sy))), t = scratch(1, c);
    t.setTransform(1, 0, 0, 1, 0, 0); t.drawImage(m.canvas, 0, 0); t.setTransform(k, 0, 0, k, 0, 0);
    t.globalCompositeOperation = 'source-in'; t.fillStyle = o.lit; t.fillRect(-2, -2, LW + 4, LH + 4);
    t.globalCompositeOperation = 'source-atop'; t.fillStyle = o.body;
    const dir = o.from === 'top' ? 1 : -1;
    rep(t, (q) => { for (const [x, y, r] of puffs) { q.beginPath(); q.ellipse(x, y + dir * r * lw, r * sx, r * sy, 0, 0, TAU); q.fill(); } });
    if (o.shadeCol) { // escurece do lado oposto à luz
      const ya = o.y - o.dy / 2 - o.r1 * sy, yb = o.y + o.dy / 2 + o.r1 * sy, g = t.createLinearGradient(0, ya, 0, yb);
      const a0 = U.rgba(o.shadeCol, o.shadeA || 0.5), a1 = U.rgba(o.shadeCol, 0);
      if (o.from === 'top') { g.addColorStop(0, a1); g.addColorStop(1, a0); } else { g.addColorStop(0, a0); g.addColorStop(1, a1); }
      t.fillStyle = g; t.fillRect(-2, ya, LW + 4, yb - ya);
    }
    if (o.shade) rep(t, o.shade);
    t.globalCompositeOperation = 'source-over';
    c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = o.alpha === undefined ? 1 : o.alpha;
    if (o.blur && HAS_FILTER) c.filter = 'blur(' + (o.blur * k).toFixed(2) + 'px)';
    c.drawImage(t.canvas, 0, 0); c.restore();
  }
  // feixes de luz em leque a partir de (x, y)
  function rays(c, rnd, x, y, n, len, col, a, dir, spread) {
    const list = []; for (let i = 0; i < n; i++) list.push([dir + (rnd() - 0.5) * spread, 0.012 + rnd() * 0.04, len * (0.55 + rnd() * 0.45), a * (0.5 + rnd() * 0.5)]);
    rep(c, (q) => {
      q.globalCompositeOperation = 'lighter';
      for (const [ang, w, L, aa] of list) {
        const g = q.createRadialGradient(x, y, 0, x, y, L); g.addColorStop(0, U.rgba(col, aa)); g.addColorStop(1, U.rgba(col, 0));
        q.fillStyle = g; q.beginPath(); q.moveTo(x, y); q.lineTo(x + Math.cos(ang - w) * L, y + Math.sin(ang - w) * L); q.lineTo(x + Math.cos(ang + w) * L, y + Math.sin(ang + w) * L); q.closePath(); q.fill();
      }
      q.globalCompositeOperation = 'source-over';
    });
  }
  function stars(c, rnd, n, y1, col) { const l = []; for (let i = 0; i < n; i++) l.push([rnd() * LW, rnd() * y1, rnd() < 0.15 ? 1.4 : 0.8, 0.25 + rnd() * 0.6]); c.fillStyle = col; for (const [x, y, s, a] of l) { c.globalAlpha = a; c.fillRect(x, y, s, s); } c.globalAlpha = 1; }
  function streaks(c, rnd, n, col, a, ang, len, y0, y1) { // chuva, cinza levada pelo vento
    const l = []; for (let i = 0; i < n; i++) l.push([rnd() * LW, y0 + rnd() * (y1 - y0), len * (0.5 + rnd()), a * (0.4 + rnd() * 0.6)]);
    rep(c, (q) => { q.lineWidth = 0.7; q.lineCap = 'round'; for (const [x, y, L, aa] of l) { q.strokeStyle = U.rgba(col, aa); q.beginPath(); q.moveTo(x, y); q.lineTo(x + Math.cos(ang) * L, y + Math.sin(ang) * L); q.stroke(); } });
  }

  // ======================================================================= arquitetura
  function cross(sh, x, base, h, w) { w = w || Math.max(1, h * 0.1); sh.push(rect(x - w / 2, base - h, w, h)); sh.push(rect(x - h * 0.3, base - h * 0.76, h * 0.6, w)); }
  function finial(sh, x, base, h) { sh.push(poly([[x - h * 0.17, base], [x, base - h * 0.82], [x + h * 0.17, base]])); sh.push(circ(x, base - h * 0.88, h * 0.12)); }
  function bell(sh, x, y, s, aft) { // y = ponto de onde pende
    const p = P(); p.moveTo(x - s * 0.22, y + s * 0.1); p.quadraticCurveTo(x - s * 0.26, y + s * 0.52, x - s * 0.47, y + s * 0.86); p.lineTo(x + s * 0.47, y + s * 0.86); p.quadraticCurveTo(x + s * 0.26, y + s * 0.52, x + s * 0.22, y + s * 0.1); p.quadraticCurveTo(x, y - s * 0.04, x - s * 0.22, y + s * 0.1); p.closePath();
    const yoke = rect(x - s * 0.36, y - s * 0.06, s * 0.72, s * 0.09);
    if (aft) { after(p); after(yoke); }
    sh.push(p, yoke);
  }
  // cúpula barroca: tambor, cornija, calota, lanterna, cruz
  function dome(sh, x, base, w, h) {
    const r = w / 2, dh = h * 0.26, ch = h * 0.46;
    sh.push(rect(x - r, base - dh, w, dh + 1), rect(x - r - 2, base - dh - 2.5, w + 4, 2.6));
    const cap = P(); cap.moveTo(x - r, base - dh - 2); cap.bezierCurveTo(x - r, base - dh - ch * 1.05, x + r, base - dh - ch * 1.05, x + r, base - dh - 2); cap.closePath(); sh.push(cap);
    const top = base - dh - ch * 0.78, lw = Math.max(3, w * 0.13), lh = h * 0.12;
    sh.push(rect(x - lw / 2, top - lh, lw, lh + 2));
    const lc = P(); lc.moveTo(x - lw / 2 - 1, top - lh); lc.quadraticCurveTo(x, top - lh - h * 0.08, x + lw / 2 + 1, top - lh); lc.closePath(); sh.push(lc);
    cross(sh, x, top - lh - h * 0.05, Math.max(5, h * 0.11));
    const wins = []; const n = Math.max(2, Math.round(w / 12));
    for (let i = 0; i < n; i++) wins.push([x - r + (i + 0.5) * w / n, base - dh * 0.75, Math.min(4, w / n * 0.4), dh * 0.5]);
    return { wins, top: top - lh - h * 0.16 };
  }
  // torre sineira: fuste, cornijas, corpo de sinos com vãos vazados, pináculos de bola, remate, cruz
  function belfry(sh, x, base, w, h, o) {
    o = o || {};
    const shaft = h * 0.58, bw = w * 0.86, bh = h * 0.17, top = base - shaft - bh;
    sh.push(rect(x - w / 2, base - shaft, w, shaft + 1), rect(x - w / 2 - 1.2, base - shaft - 2, w + 2.4, 2.3));
    sh.push(rect(x - bw / 2, top, bw, bh + 1), rect(x - bw / 2 - 1.2, top - 2, bw + 2.4, 2.3));
    for (const s of [-1, 1]) finial(sh, x + s * (bw / 2 - 0.4), top - 1.6, Math.max(4.5, h * 0.07));
    let peak; const roof = o.roof || 'spire';
    if (roof === 'dome') { const cw = bw * 0.72, d0 = top - 1.6, dh = h * 0.05; sh.push(rect(x - cw / 2, d0 - dh, cw, dh + 1)); const p = P(); p.moveTo(x - cw / 2, d0 - dh); p.bezierCurveTo(x - cw / 2, d0 - dh - cw * 0.95, x + cw / 2, d0 - dh - cw * 0.95, x + cw / 2, d0 - dh); p.closePath(); sh.push(p); peak = d0 - dh - cw * 0.71; }
    else if (roof === 'bulb') { const cw = bw * 0.66, d0 = top - 1.6; const p = P(); p.moveTo(x - cw / 2, d0); p.bezierCurveTo(x - cw * 0.85, d0 - cw * 0.55, x - cw * 0.08, d0 - cw * 0.75, x, d0 - cw * 1.35); p.bezierCurveTo(x + cw * 0.08, d0 - cw * 0.75, x + cw * 0.85, d0 - cw * 0.55, x + cw / 2, d0); p.closePath(); sh.push(p); peak = d0 - cw * 1.35; }
    else { const sw = bw * 0.86; sh.push(poly([[x - sw / 2, top - 1.6], [x, top - 1.6 - h * 0.25], [x + sw / 2, top - 1.6]])); peak = top - 1.6 - h * 0.25; }
    sh.push(circ(x, peak - 0.5, Math.max(0.8, h * 0.012)));
    cross(sh, x, peak - 1, Math.max(5, h * 0.075));
    const n = o.n || (bw > 22 ? 2 : 1), ow = Math.min(bw / n * 0.56, 15), holes = [];
    for (let i = 0; i < n; i++) {
      const ox = x - bw / 2 + (i + 0.5) * bw / n, hb = top + bh - 1.6, hh = bh * 0.74;
      sh.push(archHole(ox, hb, ow, hh)); holes.push([ox, hb, ow, hh]);
      if (o.bells) bell(sh, ox, hb - hh + ow * 0.42, Math.min(ow * 0.86, hh * 0.62), true);
    }
    return { holes, top, peak, shaftTop: base - shaft };
  }
  // espadanha: parede de sinos de remate curvo, com vãos em arco e os sinos lá dentro
  function espadana(sh, x, base, w, h, n) {
    const t = base - h * 0.78, p = P();
    p.moveTo(x - w / 2, base); p.lineTo(x - w / 2, t); p.quadraticCurveTo(x - w * 0.42, t - h * 0.03, x - w * 0.22, t - h * 0.07);
    p.quadraticCurveTo(x, t - h * 0.3, x + w * 0.22, t - h * 0.07); p.quadraticCurveTo(x + w * 0.42, t - h * 0.03, x + w / 2, t); p.lineTo(x + w / 2, base); p.closePath(); sh.push(p);
    for (const s of [-1, 1]) finial(sh, x + s * (w / 2 - 0.5), t, h * 0.16);
    cross(sh, x, t - h * 0.2, h * 0.16);
    const ow = w / n * 0.5, oh = h * 0.32, holes = [];
    for (let i = 0; i < n; i++) { const ox = x - w / 2 + (i + 0.5) * w / n, hb = t + h * 0.4; sh.push(archHole(ox, hb, ow, oh)); bell(sh, ox, hb - oh + ow * 0.5, ow * 0.8, true); holes.push([ox, hb, ow, oh]); }
    return holes;
  }
  // fachada barroca com remate curvo de volutas, pináculos e santos nas pontas
  function facade(sh, x, base, w, h) {
    const bh = h * 0.6, tb = base - bh;
    sh.push(rect(x - w / 2, tb, w, bh + 1));
    const g = P(); g.moveTo(x - w / 2, tb + 1); g.lineTo(x - w / 2, tb - 2);
    g.quadraticCurveTo(x - w * 0.42, tb - h * 0.04, x - w * 0.3, tb - h * 0.06);
    g.bezierCurveTo(x - w * 0.17, tb - h * 0.08, x - w * 0.24, tb - h * 0.2, x - w * 0.12, tb - h * 0.22);
    g.lineTo(x - w * 0.12, tb - h * 0.3); g.quadraticCurveTo(x, tb - h * 0.37, x + w * 0.12, tb - h * 0.3); g.lineTo(x + w * 0.12, tb - h * 0.22);
    g.bezierCurveTo(x + w * 0.24, tb - h * 0.2, x + w * 0.17, tb - h * 0.08, x + w * 0.3, tb - h * 0.06);
    g.quadraticCurveTo(x + w * 0.42, tb - h * 0.04, x + w / 2, tb - 2); g.lineTo(x + w / 2, tb + 1); g.closePath(); sh.push(g);
    cross(sh, x, tb - h * 0.345, h * 0.11);
    for (const s of [-1, 1]) { finial(sh, x + s * (w / 2 - 1), tb - 1.5, h * 0.09); saint(sh, x + s * w * 0.3, tb - h * 0.065, h * 0.085, s < 0 ? 2 : 1); }
    return { rose: [x, tb + bh * 0.22, Math.max(3, w * 0.09)], portal: [x, base, w * 0.16, bh * 0.4], niche: [x, tb - h * 0.15] };
  }
  function saint(sh, x, base, h, pose) {
    sh.push(poly([[x - h * 0.16, base], [x - h * 0.13, base - h * 0.5], [x - h * 0.1, base - h * 0.74], [x - h * 0.05, base - h * 0.8], [x + h * 0.05, base - h * 0.8], [x + h * 0.1, base - h * 0.74], [x + h * 0.13, base - h * 0.5], [x + h * 0.16, base]]));
    sh.push(circ(x, base - h * 0.87, h * 0.085));
    if (pose === 1) sh.push(poly([[x + h * 0.07, base - h * 0.72], [x + h * 0.25, base - h * 1.02], [x + h * 0.3, base - h * 0.99], [x + h * 0.13, base - h * 0.62]]));
    if (pose === 2) sh.push(poly([[x - h * 0.07, base - h * 0.72], [x - h * 0.25, base - h * 1.02], [x - h * 0.3, base - h * 0.99], [x - h * 0.13, base - h * 0.62]]));
    sh.push(rect(x - h * 0.2, base - 0.5, h * 0.4, Math.max(1.2, h * 0.07)));
  }
  // casa: paredes (uma lista), telhado (outra lista), chaminé; as janelas ficam numa lista para se pintarem depois
  function house(walls, roofs, x, base, w, h, rnd, wins) {
    walls.push(rect(x, base - h, w, h + 1));
    const rh = Math.min(10, w * 0.22), kind = rnd();
    if (kind < 0.55) roofs.push(poly([[x - 1.6, base - h + 0.6], [x + w / 2, base - h - rh], [x + w + 1.6, base - h + 0.6]]));
    else if (kind < 0.8) roofs.push(poly([[x - 1.6, base - h + 0.6], [x - 1.6, base - h - 0.8], [x + w + 1.6, base - h - rh * 0.75], [x + w + 1.6, base - h + 0.6]]));
    else { walls.push(rect(x - 0.6, base - h - 3, w + 1.2, 3.2)); for (let k = x + 1; k < x + w - 2; k += 5) walls.push(rect(k, base - h - 5.4, 2.6, 2.6)); }
    if (rnd() < 0.45) roofs.push(rect(x + w * (0.15 + rnd() * 0.6), base - h - rh * 0.7 - 4, 3.2, rh * 0.7 + 4));
    const cols = Math.max(1, Math.round(w / 12)), rows = Math.max(1, Math.floor((h - 6) / 14));
    for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) { if (rnd() < 0.38) continue; wins.push([x + (i + 0.5) * w / cols, base - h + 7 + j * 14, rnd() < 0.45, j === 0 && rnd() < 0.35]); }
  }
  function drawWins(c, wins, lit, dark, s) {
    s = s || 1;
    rep(c, (q) => {
      for (const [x, y, on, balc] of wins) {
        q.fillStyle = on ? lit : dark;
        q.beginPath(); q.moveTo(x - 2 * s, y + 7 * s); q.lineTo(x - 2 * s, y + 2 * s); q.quadraticCurveTo(x, y - 0.6 * s, x + 2 * s, y + 2 * s); q.lineTo(x + 2 * s, y + 7 * s); q.closePath(); q.fill();
        if (balc) { q.fillStyle = dark; q.fillRect(x - 3.4 * s, y + 6.6 * s, 6.8 * s, 0.9 * s); q.fillRect(x - 3.4 * s, y + 4.4 * s, 0.6 * s, 2.4 * s); q.fillRect(x + 2.8 * s, y + 4.4 * s, 0.6 * s, 2.4 * s); }
        if (on) glow(q, x, y + 4 * s, 9 * s, lit, 0.22);
      }
    });
  }
  function cypress(sh, x, base, w, h, rnd) {
    const L = [], Rr = [], n = 16;
    for (let i = 0; i <= n; i++) {
      const t = i / n, y = base - t * h, prof = t < 0.05 ? 0.22 : Math.pow(Math.sin(Math.PI * Math.pow(t, 0.72)), 0.85);
      const ww = w / 2 * prof; L.push([x - ww * (0.85 + rnd() * 0.3), y]); Rr.push([x + ww * (0.85 + rnd() * 0.3), y]);
    }
    sh.push(poly(L.concat(Rr.reverse())));
  }
  function olive(sh, x, base, h, rnd) {
    const lean = (rnd() - 0.5) * h * 0.3, tw = h * 0.07;
    sh.push(poly([[x - tw * 1.5, base], [x - tw * 0.7, base - h * 0.18], [x - tw * 1.3 + lean * 0.5, base - h * 0.4], [x - tw * 0.3 + lean, base - h * 0.58], [x + tw * 0.7 + lean, base - h * 0.55], [x + tw * 0.3 + lean * 0.5, base - h * 0.38], [x + tw, base - h * 0.2], [x + tw * 1.8, base]]));
    sh.push(line([[x + lean * 0.5, base - h * 0.42], [x + h * 0.2 + lean * 0.7, base - h * 0.64]], tw * 0.6), line([[x + lean * 0.5, base - h * 0.45], [x - h * 0.22 + lean * 0.5, base - h * 0.66]], tw * 0.55), line([[x + lean * 0.8, base - h * 0.55], [x + lean, base - h * 0.78]], tw * 0.5));
    const cx = x + lean, cy = base - h * 0.74;
    for (let i = 0; i < 22; i++) { const a = rnd() * TAU, d = Math.sqrt(rnd()); sh.push(ell(cx + Math.cos(a) * d * h * 0.27, cy + Math.sin(a) * d * h * 0.19, h * (0.06 + rnd() * 0.05), h * (0.04 + rnd() * 0.035), (rnd() - 0.5) * 0.6)); }
    for (let i = 0; i < 34; i++) { const a = rnd() * TAU; sh.push(ell(cx + Math.cos(a) * h * 0.31 * (0.85 + rnd() * 0.3), cy + Math.sin(a) * h * 0.23 * (0.85 + rnd() * 0.3), h * 0.022, h * 0.009, a)); } // folhas soltas na borda
  }
  function brambles(sh, x, base, h, rnd) { for (let i = 0; i < 4; i++) bramble(sh, x + (rnd() - 0.5) * h * 0.3, base, h * (0.55 + rnd() * 0.5), i % 2 ? -1 : 1, rnd); }
  function pine(sh, x, base, h, rnd) { // pinheiro-manso: tronco alto, copa em guarda-chuva
    const lean = (rnd() - 0.5) * h * 0.2;
    sh.push(line([[x, base], [x + lean * 0.5, base - h * 0.5], [x + lean, base - h * 0.8]], h * 0.035));
    for (let i = 0; i < 9; i++) sh.push(ell(x + lean + (rnd() - 0.5) * h * 0.55, base - h * (0.82 + rnd() * 0.1), h * (0.1 + rnd() * 0.08), h * (0.04 + rnd() * 0.03)));
  }
  function bramble(sh, x, base, h, dir, rnd) { // silvas: haste curva e afunilada, com espinhos
    const n = 12, pts = [];
    const cx = x + dir * h * (0.25 + rnd() * 0.3), cy = base - h * (0.75 + rnd() * 0.3), ex = x + dir * h * (0.55 + rnd() * 0.5), ey = base - h * (0.15 + rnd() * 0.5);
    for (let i = 0; i <= n; i++) { const t = i / n, a = (1 - t) * (1 - t), b = 2 * t * (1 - t), d = t * t; pts.push([a * x + b * cx + d * ex, a * base + b * cy + d * ey]); }
    const L = [], Rr = [];
    for (let i = 0; i <= n; i++) {
      const [px, py] = pts[i], [qx, qy] = pts[Math.min(n, i + 1)], [ox, oy] = pts[Math.max(0, i - 1)];
      let tx = qx - ox, ty = qy - oy; const l = Math.hypot(tx, ty) || 1; tx /= l; ty /= l;
      const w = Math.max(0.4, h * 0.042 * (1 - i / n * 0.85)); L.push([px - ty * w, py + tx * w]); Rr.push([px + ty * w, py - tx * w]);
      if (i > 0 && i < n) { const s = i % 2 ? 1 : -1, tl = h * 0.07 * (1 - i / n * 0.45), bx = px - s * ty * w, by = py + s * tx * w;
        sh.push(poly([[bx - tx * tl * 0.3, by - ty * tl * 0.3], [bx - s * ty * tl + tx * tl * 0.55, by + s * tx * tl + ty * tl * 0.55], [bx + tx * tl * 0.3, by + ty * tl * 0.3]])); }
    }
    sh.push(poly(L.concat(Rr.reverse())));
  }
  function grass(sh, x0, x1, base, h, rnd, step) {
    for (let x = x0; x < x1; x += (step || 2.5) + rnd() * 3) { const hh = h * (0.4 + rnd() * 0.6), lean = (rnd() - 0.5) * hh * 0.6; sh.push(poly([[x - 0.9, base + 1], [x + lean, base - hh], [x + 0.9, base + 1]])); }
  }

  // ======================================================================= figuras
  // a Mãe das Dores: manto largo em sino, véu, coroa, resplendor de raios com estrelas, as sete espadas no peito;
  // a cabeça inclina-se para o lado (chora). Devolve os pontos para os pormenores (rosto em renda, mãos, lágrimas)
  function dolorosa(sh, x, base, h, small) {
    const Q = (u, v) => [x + u * h, base - v * h];
    if (!small) sh.push(poly([Q(-0.33, -0.001), Q(-0.33, 0.05), Q(-0.3, 0.06), Q(-0.3, 0.1), Q(0.3, 0.1), Q(0.3, 0.06), Q(0.33, 0.05), Q(0.33, -0.001)]));
    const b0 = small ? 0 : 0.1;
    const mantle = smooth([Q(-0.26, b0), Q(-0.22, 0.3), Q(-0.15, 0.55), Q(-0.105, 0.7), Q(-0.09, 0.79), Q(-0.06, 0.87), Q(-0.02, 0.915), Q(0.03, 0.92), Q(0.07, 0.885), Q(0.09, 0.8), Q(0.11, 0.7), Q(0.16, 0.55), Q(0.23, 0.3), Q(0.27, b0)], false);
    sh.push(mantle);
    const cxu = 0.015, cyv = 0.915;
    const crown = poly([Q(cxu - 0.045, cyv - 0.012), Q(cxu - 0.052, cyv + 0.04), Q(cxu - 0.03, cyv + 0.022), Q(cxu - 0.015, cyv + 0.055), Q(cxu, cyv + 0.028), Q(cxu + 0.015, cyv + 0.055), Q(cxu + 0.03, cyv + 0.022), Q(cxu + 0.052, cyv + 0.04), Q(cxu + 0.045, cyv - 0.012)]);
    sh.push(crown);
    const hc = Q(0.015, 0.862), tips = [], rays = [];
    if (!small) {
      const n = 30;
      for (let i = 0; i < n; i++) {
        const a = -Math.PI / 2 + (i / n - 0.5) * Math.PI * 1.45, r0 = h * 0.085, r1 = h * (i % 2 ? 0.15 : 0.2), wd = h * 0.008;
        const ca = Math.cos(a), sa = Math.sin(a);
        const ray = poly([[hc[0] + ca * r0 - sa * wd, hc[1] + sa * r0 + ca * wd], [hc[0] + ca * r1, hc[1] + sa * r1], [hc[0] + ca * r0 + sa * wd, hc[1] + sa * r0 - ca * wd]]);
        sh.push(ray); rays.push(ray);
        if (i % 2 === 0) { const tp = [hc[0] + ca * (r1 + h * 0.012), hc[1] + sa * (r1 + h * 0.012)]; sh.push(circ(tp[0], tp[1], h * 0.009)); tips.push(tp); }
      }
      const ring = P(); ring.arc(hc[0], hc[1], h * 0.1, Math.PI * 0.82, Math.PI * 2.18); ring.line = Math.max(0.8, h * 0.006); sh.push(ring);
    }
    // as sete espadas, em leque, cravadas no coração
    const H = Q(0.03, 0.655);
    for (let i = 0; i < 7; i++) {
      const a = -0.95 + i * 0.3, ca = Math.cos(a), sa = Math.sin(a), px = -sa, py = ca;
      const at = (d, o) => [H[0] + ca * d * h + px * o * h, H[1] + sa * d * h + py * o * h];
      sh.push(poly([at(0.03, 0), at(0.16, -0.007), at(0.16, 0.007)]));
      sh.push(poly([at(0.158, -0.022), at(0.168, -0.022), at(0.168, 0.022), at(0.158, 0.022)]));
      sh.push(line([at(0.168, 0), at(0.2, 0)], Math.max(0.7, h * 0.008)));
      sh.push(circ(...at(0.205, 0), Math.max(0.6, h * 0.008)));
    }
    return { face: hc, halo: hc, tips, rays, crown, mantle, heart: H, hands: Q(-0.035, 0.62), feet: Q(0, 0.1), h };
  }
  // rosto em renda (rostrilho), mãos postas com o lenço, lágrimas a ouro, bordado do manto, resplendor e coroa a ouro
  function dolorosaDetails(q, dl, rnd0) {
    const s = dl.h, [fx, fy] = dl.face;
    q.fillStyle = 'rgba(226,184,110,0.42)'; for (const r of dl.rays) q.fill(r);
    q.fillStyle = 'rgba(240,200,120,0.85)'; q.fill(dl.crown);
    q.save(); q.clip(dl.mantle);
    q.strokeStyle = 'rgba(210,160,90,0.34)'; q.lineWidth = s * 0.022; q.stroke(dl.mantle);
    q.strokeStyle = 'rgba(220,170,100,0.24)'; q.lineWidth = Math.max(0.7, s * 0.004);
    for (const v of [0.22, 0.36, 0.5]) {
      const y = dl.feet[1] - (v - 0.1) * s, x0 = dl.feet[0] - 0.3 * s, x1 = dl.feet[0] + 0.3 * s, k = s * 0.012;
      q.beginPath(); q.moveTo(x0, y); for (let x = x0; x <= x1; x += 1.5) q.lineTo(x, y + Math.sin((x - x0) / k) * k * 0.7); q.stroke();
      q.fillStyle = 'rgba(230,180,110,0.35)'; let up = 1; for (let x = x0 + k; x <= x1; x += k * Math.PI) { q.beginPath(); q.arc(x, y + k * 1.4 * up, Math.max(0.6, s * 0.004), 0, TAU); q.fill(); up = -up; }
    }
    q.restore();
    q.fillStyle = 'rgba(228,216,202,0.92)'; q.beginPath(); q.ellipse(fx, fy, s * 0.048, s * 0.058, 0, 0, TAU); q.fill();
    for (let i = 0; i < 16; i++) { const a = i / 16 * TAU; q.beginPath(); q.arc(fx + Math.cos(a) * s * 0.048, fy + Math.sin(a) * s * 0.058, s * 0.007, 0, TAU); q.fill(); }
    q.fillStyle = '#8a6a5e'; q.beginPath(); q.ellipse(fx, fy + s * 0.004, s * 0.029, s * 0.039, 0, 0, TAU); q.fill();
    q.strokeStyle = '#2a1a18'; q.lineWidth = Math.max(0.7, s * 0.0035); for (const dx of [-0.011, 0.011]) { q.beginPath(); q.arc(fx + dx * s, fy - s * 0.006, s * 0.007, 0.15 * Math.PI, 0.85 * Math.PI); q.stroke(); }
    q.strokeStyle = 'rgba(255,214,140,0.9)'; q.lineWidth = Math.max(0.6, s * 0.003); for (const dx of [-0.012, 0.012]) { q.beginPath(); q.moveTo(fx + dx * s, fy); q.lineTo(fx + dx * s * 1.1, fy + s * 0.02); q.stroke(); q.fillStyle = '#ffe0a0'; q.beginPath(); q.arc(fx + dx * s * 1.1, fy + s * 0.023, Math.max(0.7, s * 0.004), 0, TAU); q.fill(); }
    glow(q, fx, fy, s * 0.1, '#ffd8a0', 0.25);
    const [hx, hy] = dl.hands;
    q.fillStyle = 'rgba(200,180,164,0.85)'; q.beginPath(); q.ellipse(hx - s * 0.008, hy, s * 0.011, s * 0.019, 0.35, 0, TAU); q.fill(); q.beginPath(); q.ellipse(hx + s * 0.008, hy, s * 0.011, s * 0.019, -0.35, 0, TAU); q.fill();
    glows(dl.tips, s * 0.018, '#ffd8a0', 0.7)(q);
  }
  // braço de pedra colossal a sair das nuvens, com o punho fechado à volta de um círio aceso
  function fistCandle(sh, x, base, h) {
    const Q = (u, v) => [x + u * h, base - v * h];
    sh.push(smooth([Q(-0.15, -0.04), Q(-0.125, 0.25), Q(-0.1, 0.45), Q(-0.085, 0.53), Q(0.085, 0.55), Q(0.1, 0.45), Q(0.125, 0.25), Q(0.16, -0.04)], false));
    sh.push(smooth([Q(-0.1, 0.5), Q(-0.14, 0.6), Q(-0.125, 0.7), Q(-0.04, 0.74), Q(0.07, 0.725), Q(0.11, 0.62), Q(0.1, 0.52)], false));
    for (let i = 0; i < 4; i++) sh.push(ell(...Q(0.105, 0.55 + i * 0.047), h * 0.036, h * 0.027));
    sh.push(ell(...Q(-0.02, 0.735), h * 0.08, h * 0.028, -0.15));
    const cx = x + h * 0.025, cw = h * 0.065, top = base - h * 1.12;
    sh.push(rect(cx - cw / 2, top, cw, h * 0.4));
    for (const [dx, dl] of [[-0.42, 0.24], [0.3, 0.36], [0.46, 0.15]]) sh.push(ell(cx + dx * cw, top + h * dl * 0.25, cw * 0.17, h * dl * 0.25));
    return [cx, top - 6];
  }
  // cabeça colossal de uma santa velada, afundada na água até ao queixo, de olhos fechados, a chorar
  function sunkenHead(sh, x, base, h) {
    const Q = (u, v) => [x + u * h, base - v * h];
    const prof = [Q(-0.045, 0.8), Q(-0.07, 0.72), Q(-0.085, 0.645), Q(-0.066, 0.6), Q(-0.1, 0.5), Q(-0.165, 0.41), Q(-0.112, 0.372), Q(-0.118, 0.322), Q(-0.096, 0.293), Q(-0.112, 0.255), Q(-0.09, 0.205), Q(-0.106, 0.145), Q(-0.04, 0.04)];
    sh.push(smooth([Q(0.56, -0.14), Q(0.6, 0.25), Q(0.56, 0.55), Q(0.46, 0.8), Q(0.3, 0.95), Q(0.12, 0.99), Q(0.0, 0.95), Q(-0.05, 0.88), Q(-0.058, 0.83)].concat(prof, [Q(0.05, -0.14)]), true));
    const face = smooth(prof.concat([Q(0.03, 0.1), Q(0.07, 0.32), Q(0.085, 0.55), Q(0.06, 0.74), Q(0.02, 0.81)]), true);
    return { face, eye: Q(-0.052, 0.585), brow: Q(-0.06, 0.64), veil: [Q(0.02, 0.81), Q(0.06, 0.74), Q(0.085, 0.55), Q(0.07, 0.32), Q(0.03, 0.1)], top: Q(0.3, 0.99) };
  }
  // a Virgem da lua: figura esguia de mãos postas, manto ao vento, de pé sobre um crescente, coroa de doze estrelas
  function inmaculada(sh, x, base, h) {
    const Q = (u, v) => [x + u * h, base - v * h];
    const mo = P(); mo.moveTo(...Q(-0.24, 0.16)); mo.quadraticCurveTo(...Q(0, -0.1), ...Q(0.24, 0.16)); mo.quadraticCurveTo(...Q(0, 0.02), ...Q(-0.24, 0.16)); mo.closePath(); sh.push(mo);
    sh.push(smooth([Q(-0.07, 0.07), Q(-0.085, 0.4), Q(-0.075, 0.62), Q(-0.065, 0.75), Q(-0.05, 0.835), Q(-0.022, 0.895), Q(0.02, 0.9), Q(0.05, 0.86), Q(0.062, 0.78), Q(0.075, 0.62), Q(0.08, 0.4), Q(0.07, 0.07)], true));
    sh.push(poly([Q(-0.065, 0.6), Q(-0.125, 0.7), Q(-0.105, 0.715), Q(-0.055, 0.665)]));
    sh.push(smooth([Q(0.03, 0.82), Q(0.12, 0.72), Q(0.2, 0.56), Q(0.3, 0.38), Q(0.37, 0.2), Q(0.26, 0.23), Q(0.19, 0.14), Q(0.09, 0.1), Q(0.06, 0.32), Q(0.055, 0.62)], true));
    const hc = Q(0.0, 0.84), st = [];
    for (let i = 0; i < 12; i++) { const a = -Math.PI * 1.05 + i / 11 * Math.PI * 1.1, sx = hc[0] + Math.cos(a) * h * 0.11, sy = hc[1] + Math.sin(a) * h * 0.11; sh.push(circ(sx, sy, Math.max(0.8, h * 0.009))); st.push([sx, sy]); }
    return { halo: hc, stars: st, moon: Q(0, 0.06) };
  }
  // salgueiro-chorão: tronco torto, copa em arco de tufos, cortinas de ramos a cair quase até à água
  function willow(sh, x, base, h, rnd) {
    const lean = (rnd() - 0.5) * h * 0.15;
    sh.push(poly([[x - h * 0.06, base + 1], [x - h * 0.03 + lean * 0.5, base - h * 0.35], [x - h * 0.02 + lean, base - h * 0.66], [x + h * 0.03 + lean, base - h * 0.66], [x + h * 0.035 + lean * 0.5, base - h * 0.35], [x + h * 0.075, base + 1]]));
    const cx = x + lean, cy = base - h * 0.74, Rx = h * 0.4;
    sh.push(ell(cx, cy, Rx * 0.42, h * 0.1));
    for (let i = 0; i < 7; i++) sh.push(ell(cx + (rnd() - 0.5) * Rx * 0.9, cy - h * 0.02 + (rnd() - 0.5) * h * 0.08, h * (0.07 + rnd() * 0.05), h * (0.04 + rnd() * 0.03)));
    for (let i = 0; i < 96; i++) {
      const u = rnd() * 2 - 1, sx = cx + u * Rx * 0.35, sy = cy - h * 0.08 * Math.sqrt(1 - u * u) + rnd() * h * 0.06;
      const ex = cx + u * Rx * (0.9 + rnd() * 0.25), ey = base - h * (0.04 + rnd() * 0.3);
      const p = P(); p.moveTo(sx, sy); p.quadraticCurveTo(cx + u * Rx * 0.85, sy - h * (0.1 + rnd() * 0.06), ex, ey); p.line = 1 + rnd() * 1.6; sh.push(p);
    }
  }
  function furnace(sh, x, base, w, h) {
    sh.push(poly([[x - w / 2, base + 1], [x - w * 0.32, base - h], [x + w * 0.32, base - h], [x + w / 2, base + 1]]));
    sh.push(rect(x - w * 0.36, base - h - 6, w * 0.72, 7), rect(x - w * 0.12, base - h - 46, w * 0.24, 42), rect(x - w * 0.16, base - h - 50, w * 0.32, 6));
    for (let i = 1; i < 4; i++) { const t = i / 4, hw = w * (0.5 - 0.18 * t); sh.push(rect(x - hw - 2.5, base - h * t - 2, hw * 2 + 5, 4.4)); }
    return { mouth: [x, base, w * 0.24, h * 0.3], top: [x, base - h - 50] };
  }
  function nazareno(sh, x, base, h) { sh.push(poly([[x - h * 0.22, base], [x - h * 0.14, base - h * 0.55], [x - h * 0.08, base - h * 0.62], [x, base - h], [x + h * 0.08, base - h * 0.62], [x + h * 0.14, base - h * 0.55], [x + h * 0.22, base]])); }
  // andor com pálio: faldões, varas, pálio com franja, a imagem e a candelária acesa
  function paso(sh, x, base, w, lights) {
    const h = w * 0.66;
    sh.push(rect(x - w / 2, base - h * 0.24, w, h * 0.24 + 0.5));
    for (let i = 0; i < 6; i++) sh.push(rect(x - w / 2 + 0.6 + i * (w - 2) / 5, base - h * 0.96, 0.9, h * 0.74));
    sh.push(rect(x - w / 2 - 1.2, base - h, w + 2.4, h * 0.09));
    for (let k = x - w / 2 - 1; k < x + w / 2 + 1; k += 2.2) sh.push(rect(k, base - h * 0.92, 1, 2.2));
    dolorosa(sh, x, base - h * 0.23, h * 0.62, true);
    for (let i = 0; i < 9; i++) lights.push([x - w * 0.4 + i * w * 0.1, base - h * 0.28 - (i % 2) * 1.6]);
  }
  function knight(sh, x, base, h) {
    const Q = (u, v) => [x + u * h, base - v * h];
    sh.push(poly([Q(-0.3, -0.001), Q(-0.3, 0.06), Q(0.3, 0.06), Q(0.3, -0.001)]));
    sh.push(poly([Q(-0.1, 0.7), Q(-0.2, 0.52), Q(-0.3, 0.26), Q(-0.36, 0.08), Q(-0.06, 0.06), Q(-0.03, 0.68)])); // capa
    sh.push(poly([Q(-0.1, 0.06), Q(-0.09, 0.36), Q(-0.02, 0.36), Q(-0.02, 0.06)]), poly([Q(0.02, 0.06), Q(0.02, 0.36), Q(0.09, 0.36), Q(0.11, 0.06)]));
    sh.push(poly([Q(-0.12, 0.33), Q(-0.1, 0.46), Q(0.1, 0.46), Q(0.12, 0.33)]));
    sh.push(poly([Q(-0.1, 0.45), Q(-0.12, 0.62), Q(-0.08, 0.7), Q(0.08, 0.7), Q(0.12, 0.62), Q(0.1, 0.45)]));
    sh.push(ell(...Q(-0.115, 0.675), h * 0.06, h * 0.04), ell(...Q(0.115, 0.675), h * 0.06, h * 0.04));
    sh.push(smooth([Q(-0.048, 0.7), Q(-0.052, 0.78), Q(-0.035, 0.83), Q(0, 0.845), Q(0.035, 0.83), Q(0.052, 0.78), Q(0.048, 0.7)], true));
    sh.push(smooth([Q(0, 0.84), Q(-0.04, 0.875), Q(-0.1, 0.865), Q(-0.15, 0.8), Q(-0.17, 0.72), Q(-0.13, 0.765), Q(-0.08, 0.81), Q(-0.03, 0.83)], true));
    sh.push(line([Q(0.12, 0.66), Q(0.2, 0.8), Q(0.2, 0.96)], h * 0.042), line([Q(0.2, 0.97), Q(0.2, 1.0)], Math.max(0.7, h * 0.007)));
    sh.push(poly([Q(0.17, 1.0), Q(0.23, 1.0), Q(0.245, 1.055), Q(0.225, 1.1), Q(0.175, 1.1), Q(0.155, 1.055)]), poly([Q(0.185, 1.1), Q(0.2, 1.13), Q(0.215, 1.1)]));
    sh.push(line([Q(-0.12, 0.66), Q(-0.16, 0.54), Q(-0.15, 0.45)], h * 0.036));
    sh.push(rect(...Q(-0.21, 0.437), h * 0.12, h * 0.016), rect(...Q(-0.158, 0.43), h * 0.016, h * 0.37), rect(...Q(-0.157, 0.5), h * 0.014, h * 0.06), circ(...Q(-0.15, 0.505), h * 0.012));
    return { lamp: Q(0.2, 1.05) };
  }
  // forca de vigia com gaiola pendurada
  function gibbet(sh, x, base, h) {
    sh.push(rect(x - 1.6, base - h, 3.2, h + 1), rect(x - 1.6, base - h, h * 0.44, 2.8), line([[x + 1.6, base - h * 0.74], [x + h * 0.18, base - h + 2.6]], 1.6));
    const cx = x + h * 0.36, cw = h * 0.13, ch = h * 0.2, cy = base - h * 0.8;
    sh.push(line([[cx, base - h + 2.6], [cx, cy - ch * 0.15]], 0.7));
    const top = P(); top.ellipse(cx, cy, cw / 2, ch * 0.22, 0, Math.PI, TAU); top.closePath(); sh.push(top);
    for (let i = 0; i <= 4; i++) sh.push(line([[cx - cw / 2 + i * cw / 4, cy], [cx - cw / 2 + i * cw / 4 + (i - 2) * 0.3, cy + ch]], 0.7));
    sh.push(rect(cx - cw / 2 - 0.5, cy + ch - 1, cw + 1, 1.8), rect(cx - cw / 2, cy + ch * 0.45, cw, 0.8));
  }
  function keep(sh, x, base, w, h, cone) {
    sh.push(rect(x - w / 2, base - h, w, h + 1), rect(x - w / 2 - 2, base - h - 3, w + 4, 3.6));
    if (cone) { const ph = w * 1.15; sh.push(poly([[x - w / 2 - 2.5, base - h - 3], [x, base - h - 3 - ph], [x + w / 2 + 2.5, base - h - 3]])); sh.push(rect(x - 0.5, base - h - 3 - ph - 7, 1, 7)); sh.push(poly([[x + 0.5, base - h - ph - 10], [x + 7, base - h - ph - 8.4], [x + 0.5, base - h - ph - 6.6]])); }
    else { const n = 2 * Math.max(2, Math.round(w / 10)) + 1, mw = (w + 4) / n; for (let i = 0; i < n; i += 2) sh.push(rect(x - w / 2 - 2 + i * mw, base - h - 7.4, mw, 4.6)); }
  }
  function rampart(sh, x0, x1, base, h) { sh.push(rect(x0, base - h, x1 - x0, h + 1)); for (let x = x0; x < x1 - 3; x += 8) sh.push(rect(x, base - h - 4.6, 4.6, 4.8)); }
  function king(sh, x, base, h, dir) {
    const Q = (u, v) => [x + dir * u * h, base - v * h];
    sh.push(poly([Q(-0.36, -0.001), Q(-0.36, 0.07), Q(0.3, 0.07), Q(0.3, -0.001)]));
    sh.push(poly([Q(-0.1, 0.72), Q(-0.34, 0.07), Q(0.04, 0.07), Q(0.08, 0.62)])); // capa
    sh.push(poly([Q(-0.22, 0.07), Q(-0.22, 0.14), Q(0.02, 0.15), Q(0.02, 0.07)])); // perna de joelho no chão
    sh.push(poly([Q(0.0, 0.26), Q(0.0, 0.34), Q(0.2, 0.34), Q(0.21, 0.07), Q(0.14, 0.07), Q(0.14, 0.26)])); // a outra perna
    sh.push(poly([Q(-0.08, 0.3), Q(-0.09, 0.66), Q(0.08, 0.66), Q(0.08, 0.3)])); // tronco
    sh.push(circ(...Q(0.0, 0.74), h * 0.065));
    sh.push(poly([Q(-0.06, 0.78), Q(-0.065, 0.86), Q(-0.035, 0.82), Q(-0.015, 0.88), Q(0.005, 0.82), Q(0.025, 0.88), Q(0.045, 0.82), Q(0.07, 0.86), Q(0.065, 0.78)])); // coroa
    sh.push(line([Q(0.06, 0.62), Q(0.19, 0.55), Q(0.2, 0.62)], h * 0.04));
    sh.push(rect(...Q(dir > 0 ? 0.13 : 0.27, 0.65), h * 0.14, h * 0.018), rect(...Q(dir > 0 ? 0.192 : 0.208, 1.12), h * 0.016, h * 0.47), poly([Q(0.192, 1.12), Q(0.2, 1.17), Q(0.208, 1.12)]));
  }
  function nave(sh, x0, x1, base, h) { // corpo de igreja comprido com telhado
    sh.push(rect(x0, base - h, x1 - x0, h + 1), poly([[x0 - 2, base - h + 0.5], [x0 + 6, base - h - 9], [x1 - 6, base - h - 9], [x1 + 2, base - h + 0.5]]));
  }
  function buttress(sh, x, base, h, span, dir, sh2) {
    sh.push(rect(x - 6, base - h, 12, h + 1), rect(x - 8, base - h - 2, 16, 3));
    finial(sh, x, base - h - 1.5, 22);
    saint(sh2 || sh, x, base - h - 24, 15, dir > 0 ? 1 : 2);
    const p = P(), y0 = base - h * 0.62;
    p.moveTo(x + dir * 6, y0); p.quadraticCurveTo(x + dir * span * 0.55, y0 - h * 0.05, x + dir * span, y0 + h * 0.2); p.lineTo(x + dir * span, y0 + h * 0.29); p.quadraticCurveTo(x + dir * span * 0.5, y0 + h * 0.08, x + dir * 6, y0 + h * 0.12); p.closePath(); sh.push(p);
  }
  function chimney(sh, x, base, w, h) { sh.push(poly([[x - w / 2, base + 1], [x - w * 0.36, base - h], [x + w * 0.36, base - h], [x + w / 2, base + 1]]), rect(x - w * 0.45, base - h - 6, w * 0.9, 7), rect(x - w * 0.5, base - h * 0.55, w, 4)); }
  function reeds(sh, x0, x1, base, h, rnd) {
    for (let x = x0; x < x1; x += 3 + rnd() * 6) {
      const hh = h * (0.5 + rnd() * 0.5), lean = (rnd() - 0.5) * hh * 0.4;
      sh.push(line([[x, base + 1], [x + lean * 0.5, base - hh * 0.6], [x + lean, base - hh]], 1));
      if (rnd() < 0.35) sh.push(ell(x + lean * 0.95, base - hh * 0.9, 1.4, 4.2, lean * 0.02));
      if (rnd() < 0.5) sh.push(poly([[x, base + 1], [x - lean * 0.6 - 4, base - hh * 0.55], [x + 1.4, base - 2]]));
    }
  }


  // ======================================================================= vida no fundo (desenhada a cada imagem)
  // Cada plano pode ter anim(c, t, cam): desenha por cima da faixa, nas coordenadas dela (0..960 × 0..360), coisas que
  // mexem — a procissão a andar, círios a tremeluzir, aves, relâmpagos, metal a escorrer, pirilampos, estrelas. Tem de
  // ser barato: brilhos são imagens em cache (VS.Gfx.glowSprite), formas são caminhos feitos uma vez.
  function aglow(c, x, y, r, col, a) {
    if (a <= 0.01) return;
    const G = VS.Gfx; c.globalAlpha = Math.min(1, a);
    if (G && G.glowSprite) c.drawImage(G.glowSprite(col), x - r, y - r, r * 2, r * 2);
    c.globalAlpha = 1;
  }
  // um pássaro (asas em "m") e um bando a atravessar o céu de tempos a tempos
  function bird(c, x, y, s, w) { c.beginPath(); c.moveTo(x - 2 * s, y - w * s * 0.9); c.quadraticCurveTo(x - s, y - s * 0.35, x, y); c.quadraticCurveTo(x + s, y - s * 0.35, x + 2 * s, y - w * s * 0.9); c.stroke(); }
  function flock(c, t, o) {
    const cross = (LW + 120) / o.speed, k = (t + (o.phase || 0)) % o.period;
    if (k > cross) return;
    c.strokeStyle = o.col; c.lineWidth = 0.9; c.lineCap = 'round';
    for (let i = 0; i < o.n; i++) {
      const lead = o.dir > 0 ? -60 + k * o.speed : LW + 60 - k * o.speed;
      const x = lead - o.dir * (i * 8 + (i % 2) * 5), y = o.y + (i % 3) * 5 + Math.sin(k * 0.7 + i * 1.3) * 3;
      bird(c, x, y, o.size * (0.8 + (i % 3) * 0.15), Math.sin(t * 9 + i * 1.7));
    }
  }
  // penitente de capirote e andor, à escala 1 (desenhados com translate/scale)
  const NAZ = (() => { const p = new Path2D(); p.moveTo(-0.22, 0); p.lineTo(-0.14, -0.55); p.lineTo(-0.08, -0.62); p.lineTo(0, -1); p.lineTo(0.08, -0.62); p.lineTo(0.14, -0.55); p.lineTo(0.22, 0); p.closePath(); return p; })();
  const PASO = (() => {
    const p = new Path2D(), w = 1, h = 0.66;
    p.rect(-w / 2, -h * 0.24, w, h * 0.24); for (let i = 0; i < 6; i++) p.rect(-w / 2 + 0.02 + i * (w - 0.06) / 5, -h * 0.96, 0.026, h * 0.74);
    p.rect(-w / 2 - 0.035, -h, w + 0.07, h * 0.09);
    for (let k = -w / 2 - 0.03; k < w / 2 + 0.03; k += 0.065) p.rect(k, -h * 0.92, 0.03, 0.065);
    // a imagem sob o pálio: manto em sino e coroa
    p.moveTo(-0.13, -h * 0.24); p.quadraticCurveTo(-0.1, -h * 0.55, -0.04, -h * 0.72); p.quadraticCurveTo(0, -h * 0.8, 0.04, -h * 0.72); p.quadraticCurveTo(0.1, -h * 0.55, 0.13, -h * 0.24); p.closePath();
    return p;
  })();
  function procession(c, t, o) {
    // a fila anda devagar pela ponte; aparece e desaparece aos poucos nas pontas; o andor vai a meio, com a candelária
    const span = o.x1 - o.x0, n = o.n, gap = span / n, v = o.speed;
    for (let i = 0; i < n; i++) {
      if (i === o.paso - 1 || i === o.paso + 1) continue;
      const u = ((i * gap + t * v) % span + span) % span, x = o.x0 + u, fade = Math.min(1, u / 18, (span - u) / 18);
      if (fade <= 0.02) continue;
      const bob = Math.sin(t * 3.1 + i * 1.3) * 0.35, y = o.y + (i === o.paso ? 0 : bob);
      c.globalAlpha = fade;
      if (i === o.paso) {
        c.save(); c.translate(x, y); c.scale(34, 34); c.fillStyle = o.rim; c.translate(-0.012, -0.02); c.fill(PASO); c.translate(0.012, 0.02); c.fillStyle = o.col; c.fill(PASO); c.restore();
        for (let k = 0; k < 9; k++) { const cx = x - 13.6 + k * 3.4, cy = y - 9.5 - (k % 2) * 1.6, f = 0.5 + 0.2 * Math.sin(t * 11 + k * 2.3); c.globalAlpha = fade; c.fillStyle = '#fff2c8'; c.fillRect(cx - 0.4, cy - 1, 0.8, 1.8); aglow(c, cx, cy - 0.6, 6, '#ffb060', f * fade); }
        aglow(c, x, y - 14, 26, '#ffb060', (0.22 + 0.05 * Math.sin(t * 5)) * fade);
        continue;
      }
      const h = 13 + (i % 3) * 0.6;
      c.save(); c.translate(x, y); c.scale(h, h); c.fillStyle = o.rim; c.translate(-0.035, -0.06); c.fill(NAZ); c.translate(0.035, 0.06); c.fillStyle = o.col; c.fill(NAZ); c.restore();
      const cy = y - h * 0.8, f = 0.45 + 0.18 * Math.sin(t * 12 + i * 2.1) + 0.08 * Math.sin(t * 23 + i);
      c.globalAlpha = fade; c.fillStyle = '#fff2c8'; c.fillRect(x + 2.6, cy, 0.9, 2.2);
      aglow(c, x + 3, cy, 7, '#ffb060', f * fade);
    }
    c.globalAlpha = 1;
  }
  // relâmpago: um raio em ziguezague, sempre o mesmo durante um clarão
  function bolt(c, seed, x, y0, y1, a) {
    const r = U.rng(seed); c.save(); c.globalAlpha = Math.min(1, a); c.strokeStyle = '#e8f0ff'; c.lineWidth = 1.6; c.lineJoin = 'round';
    c.beginPath(); let px = x, py = y0; c.moveTo(px, py);
    while (py < y1) { py += 8 + r() * 14; px += (r() - 0.5) * 26; c.lineTo(px, py); if (r() < 0.18) { const bx = px + (r() - 0.5) * 40; c.moveTo(px, py); c.lineTo(bx, py + 14 + r() * 16); c.moveTo(px, py); } }
    c.stroke(); c.restore(); aglow(c, x, (y0 + y1) / 2, 120, '#c8d8ff', a * 0.35);
  }

  // ======================================================================= CIDADE DE CINZA
  // poente de brasa atrás da catedral da cidade alta; a Mãe das Dores colossal a chorar; o casario caiado em socalcos;
  // a ponte por onde passa a procissão; calvário e oliveiras no primeiro plano
  S.city = style(function (R, layers) {
    const sun = [575, 214], gold = '#ffc488', haze = '#9a5a40', live = {};
    layers.push({ p: 0.02, draw(c, rnd) {
      horizon(c, 120, 300, haze, 0.62); horizon(c, 230, 300, '#d07850', 0.35);
      glow(c, sun[0], sun[1], 330, '#ff6a2a', 0.32); glow(c, sun[0], sun[1], 120, '#ffb070', 0.55);
      c.fillStyle = 'rgba(255,214,170,0.95)'; c.beginPath(); c.arc(sun[0], sun[1], 21, 0, TAU); c.fill(); glow(c, sun[0], sun[1], 40, '#fff0d0', 0.6, 'lighter');
      rays(c, rnd, sun[0], sun[1], 18, 300, '#ffb070', 0.1, -Math.PI / 2, 2.7);
      cumulus(c, rnd, { n: 10, y: 112, dy: 36, w0: 90, w1: 180, litW: 0.28, body: '#33263a', lit: '#c87058', shadeCol: '#0a0810', shadeA: 0.55, alpha: 0.95, blur: 1.2, avoid: [sun[0], 30] });
      clouds(c, rnd, { y: 164, dy: 20, n: 16, r0: 7, r1: 14, sx: 3, sy: 0.4, body: '#4a3236', lit: '#ff9a60', shadeCol: '#1a1018', shadeA: 0.4, alpha: 0.7, blur: 1.2 });
      clouds(c, rnd, { y: 206, dy: 8, n: 12, r0: 6, r1: 12, sx: 3, sy: 0.45, x0: 380, x1: 820, body: '#6a4038', lit: '#ffc890', alpha: 0.75, blur: 0.8 });
      streaks(c, rnd, 70, '#d8b0a0', 0.18, 0.5, 6, 0, 300);
    } });
    // longe: a cidade alta com a catedral (fachada, duas torres, cúpula) a tapar o sol; torres soltas; a Mãe das Dores
    layers.push({ p: 0.05, draw(c, rnd) {
      paint(c, [ridge(282, 26, [2, 5, 9], 1.3)], { col: '#3a2a2e', bot: '#6a4436', y0: 250, y1: 340, rim: '#e08858', rimA: 0.7 });
      const D = [], dl = dolorosa(D, 190, 292, 214), curls = []; live.face = dl.face;
      for (let i = 0; i < 16; i++) curls.push([(rnd() - 0.5) * 0.4, 0.14 + rnd() * 0.4, 0.012 + rnd() * 0.01]);
      glow(c, dl.halo[0], dl.halo[1], 100, '#ffb070', 0.22);
      paint(c, D, { col: '#2a1e26', bot: '#4e3430', y0: 60, y1: 300, rim: gold, rx: -0.5, ry: 0.8, shade: lightIn(dl.halo[0], dl.halo[1], 60, '#8a5a40', 0.35) });
      rep(c, (q) => {
        dolorosaDetails(q, dl, curls);
        for (let i = 0; i < 13; i++) { const x = dl.feet[0] - 66 + i * 11, y = dl.feet[1] + 2 + (i % 2) * 2; q.fillStyle = '#fff0c0'; q.fillRect(x, y - 2.6, 1.1, 2.6); glow(q, x + 0.5, y - 3, 8, '#ffb060', 0.5); }
      });
      // a catedral da cidade alta
      const C = [], d = dome(C, 575, 236, 66, 150);
      const L = belfry(C, 520, 270, 22, 156, { roof: 'bulb', bells: true }), Rr = belfry(C, 630, 270, 22, 156, { roof: 'bulb', bells: true });
      const f = facade(C, 575, 272, 84, 118);
      nave(C, 490, 660, 274, 34);
      for (const [x, w, h] of [[455, 26, 34], [690, 30, 30], [430, 18, 24], [722, 20, 26]]) C.push(rect(x - w / 2, 278 - h, w, h + 1));
      const T = [];
      for (const [x, w, h, r] of [[64, 13, 104, 'spire'], [338, 15, 118, 'dome'], [812, 14, 96, 'bulb'], [902, 12, 84, 'spire']]) belfry(T, x, 286, w, h, { roof: r });
      dome(T, 372, 284, 30, 64); dome(T, 862, 286, 26, 58);
      paint(c, T, { col: '#3c2c30', bot: '#6a4436', y0: 160, y1: 290, rim: '#e89060', rimA: 0.8 });
      paint(c, C, { col: '#241a20', bot: '#4a3230', y0: 90, y1: 280, rim: '#ffc890', rx: 0.3, ry: 1, shade: lightIn(sun[0], sun[1], 90, '#7a4a3a', 0.5) });
      rep(c, (q) => {
        for (const hh of [L, Rr]) for (const [x, b, w, h] of hh.holes) glow(q, x, b - h * 0.4, 9, '#ffa860', 0.45);
        const [rx, ry, rr] = f.rose; q.fillStyle = 'rgba(255,170,100,0.85)'; q.beginPath(); q.arc(rx, ry, rr * 0.8, 0, TAU); q.fill();
        q.strokeStyle = 'rgba(40,20,20,0.9)'; q.lineWidth = 0.8; q.beginPath(); for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI; q.moveTo(rx - Math.cos(a) * rr * 0.8, ry - Math.sin(a) * rr * 0.8); q.lineTo(rx + Math.cos(a) * rr * 0.8, ry + Math.sin(a) * rr * 0.8); } q.stroke(); glow(q, rx, ry, 12, '#ffa860', 0.45);
        const [px, pb, pw, ph] = f.portal; q.fillStyle = 'rgba(255,150,80,0.55)'; q.beginPath(); archP(q, px, pb, pw * 0.6, ph * 0.7); q.fill(); glow(q, px, pb - ph * 0.3, 10, '#ff9a50', 0.35);
        for (const [x, y, w, h] of d.wins) { q.fillStyle = 'rgba(255,180,110,0.7)'; q.beginPath(); archP(q, x, y + h, Math.max(2.2, w * 0.7), h * 0.9); q.fill(); }
      });
      horizon(c, 230, 360, haze, 0.5);
    } });
    // meio: o casario caiado em socalcos, ciprestes, uma igreja com espadanha
    layers.push({ p: 0.13, draw(c, rnd) {
      const wallsA = [], roofsA = [], winsA = [], wallsB = [], roofsB = [], winsB = [], trees = [];
      let x = -24; while (x < LW + 4) { const w = 24 + rnd() * 26, h = 24 + rnd() * 26; house(wallsA, roofsA, x, 300 + rnd() * 6, w, h, rnd, winsA); x += w + 1 + rnd() * 7; if (rnd() < 0.22) { cypress(trees, x + 5, 304, 13, 50 + rnd() * 26, rnd); x += 8; } }
      x = -10; while (x < LW + 4) { const w = 26 + rnd() * 30, h = 20 + rnd() * 22; if (rnd() < 0.82) house(wallsB, roofsB, x, 328 + rnd() * 4, w, h, rnd, winsB); x += w + 3 + rnd() * 16; if (rnd() < 0.25) { cypress(trees, x + 4, 330, 12, 44 + rnd() * 22, rnd); x += 8; } }
      const ch = []; const eh = espadana(ch, 404, 292, 30, 66, 2); nave(ch, 418, 470, 296, 32); belfry(ch, 772, 300, 16, 88, { roof: 'dome', bells: true });
      paint(c, [ridge(312, 9, [1, 3, 7], 4.2)], { col: '#2a1e20', bot: '#4a3230', y0: 290, y1: 360, rim: '#c87850' });
      paint(c, ch, { col: '#5a4a4c', bot: '#6a5048', y0: 220, y1: 300, rim: '#ffc890' });
      paint(c, roofsA, { col: '#4a2c28', rim: '#e08860' });
      paint(c, wallsA, { col: '#7a6c6c', bot: '#5a4642', y0: 260, y1: 306, rim: '#ffd0a8', shade: mottle(rnd, 40, 250, 310, ['#8a7a78', '#5a4a4a'], 0.35) });
      drawWins(c, winsA, '#ffb060', 'rgba(20,12,14,0.7)');
      rep(c, (q) => { for (const [x, b, w, h] of eh) glow(q, x, b - h * 0.5, 8, '#ffa860', 0.3); });
      horizon(c, 280, 336, '#6a4038', 0.45);
      paint(c, roofsB, { col: '#3a2220', rim: '#e08860' });
      paint(c, wallsB, { col: '#8a7a78', bot: '#4a3a38', y0: 296, y1: 334, rim: '#ffd8b0', shade: mottle(rnd, 40, 290, 334, ['#9a8a86', '#5a4a48'], 0.35) });
      drawWins(c, winsB, '#ffb868', 'rgba(20,12,14,0.75)');
      paint(c, trees, { col: '#1a1814', bot: '#2a2420', y0: 260, y1: 330, rim: '#c88a60', rimA: 0.8 });
      horizon(c, 316, 360, '#3a2626', 0.7);
    } });
    // a ponte de arcos com a procissão: penitentes de capirote com círios e o andor sob o pálio
    layers.push({ p: 0.22, draw(c, rnd) {
      const B = [], x0 = 200, x1 = 760, deck = 286, base = 372;
      B.push(rect(x0 - 10, deck, x1 - x0 + 20, base - deck));
      const n = 7, aw = (x1 - x0) / n;
      for (let i = 0; i < n; i++) B.push(archHole(x0 + (i + 0.5) * aw, base, aw * 0.68, base - deck - 12));
      B.push(rect(x0 - 14, deck - 3, x1 - x0 + 28, 3.4));
      for (let px = x0 - 10; px < x1 + 10; px += 5) B.push(rect(px, deck - 9, 1.6, 6.5));
      B.push(rect(x0 - 14, deck - 10.5, x1 - x0 + 28, 2));
      for (const px of [x0 - 10, x1 + 10]) { B.push(rect(px - 5, deck - 24, 10, base - deck + 24)); finial(B, px, deck - 24, 16); }
      paint(c, B, { col: '#2a2022', bot: '#1a1214', y0: 280, y1: 360, rim: '#e89868', shade: mottle(rnd, 30, 280, 360, ['#3a2a2a', '#1a1214'], 0.4) });
    } });
    // perto: calvário, oliveiras e silvas (só em baixo, para não tapar o jogo)
    layers.push({ p: 0.36, draw(c, rnd) {
      const G = [];
      const hill = P(); hill.moveTo(-2, 362); for (let x = 0; x <= LW; x += 6) hill.lineTo(x, 340 - (x > 330 && x < 490 ? Math.sin((x - 330) / 160 * Math.PI) * 16 : 0) - Math.sin(x / LW * TAU * 3) * 3); hill.lineTo(LW + 2, 362); hill.closePath(); G.push(hill);
      for (const [x, h] of [[380, 66], [410, 84], [440, 66]]) cross(G, x, 334 - (x === 410 ? 4 : 0), h, 4.4);
      olive(G, 120, 346, 118, rnd); olive(G, 690, 348, 100, rnd);
      for (const x of [40, 250, 540, 840, 920]) brambles(G, x, 346, 34 + rnd() * 18, rnd);
      grass(G, 0, LW, 346, 10, rnd, 4);
      paint(c, G, { col: '#120c0e', bot: '#0a0708', y0: 300, y1: 360, rim: '#a85a40', rx: 0.25, ry: 0.7, rimA: 0.9 });
      rep(c, (q) => { for (const x of [392, 404, 418, 428]) { q.fillStyle = '#fff0c0'; q.fillRect(x, 333, 1.2, 3); glow(q, x + 0.6, 332, 8, '#ffb060', 0.55); } });
    } });
    layers[1].anim = (c, t) => {
      flock(c, t, { period: 52, speed: 24, y: 118, n: 7, dir: -1, col: 'rgba(28,18,22,0.9)', size: 2.1 });
      flock(c, t, { period: 71, phase: 30, speed: 30, y: 168, n: 4, dir: 1, col: 'rgba(40,26,28,0.8)', size: 1.6 });
      aglow(c, sun[0], sun[1], 120, '#ffb070', 0.1 + 0.05 * Math.sin(t * 0.5));
      // de tempos a tempos, uma lágrima de cera brilha no rosto da Mãe das Dores
      const k = (t % 7) / 7; if (live.face && k < 0.16) { const a = Math.sin(k / 0.16 * Math.PI); aglow(c, live.face[0] + 2.6, live.face[1] + 4 + k * 22, 7, '#fff0c0', a); }
    };
    layers[3].anim = (c, t) => procession(c, t, { x0: 196, x1: 764, y: 275.5, n: 30, paso: 15, speed: 3.2, col: '#140e12', rim: '#9a5838' });
    layers[4].anim = (c, t) => { for (const [i, x] of [392, 404, 418, 428].entries()) aglow(c, x + 0.6, 332, 9, '#ffb060', 0.35 + 0.2 * Math.sin(t * 9 + i * 2.2) + 0.08 * Math.sin(t * 21 + i)); };
  });

  // ======================================================================= BASTIÃO DAS VIGÍLIAS
  // noite de tempestade, lua entre as nuvens; o Vigia colossal de lanterna erguida no penhasco; a fortaleza; muralhas,
  // forcas com gaiolas e archotes; estacas no primeiro plano
  S.ramparts = style(function (R, layers) {
    const moon = [318, 92], live = {};
    layers.push({ p: 0.02, draw(c, rnd) {
      horizon(c, 140, 320, '#3a5070', 0.55);
      glow(c, moon[0], moon[1], 200, '#8aa8e0', 0.2); glow(c, moon[0], moon[1], 50, '#e0ecff', 0.45);
      c.fillStyle = 'rgba(228,236,255,0.92)'; c.beginPath(); c.arc(moon[0], moon[1], 16, 0, TAU); c.fill();
      c.fillStyle = 'rgba(160,176,210,0.4)'; for (const [dx, dy, r] of [[-5, -3, 4], [4, 5, 3], [6, -6, 2]]) { c.beginPath(); c.arc(moon[0] + dx, moon[1] + dy, r, 0, TAU); c.fill(); }
      cumulus(c, rnd, { n: 12, y: 122, dy: 44, w0: 120, w1: 220, tall: 1.1, litW: 0.3, body: '#151e2c', lit: '#5a78a8', shadeCol: '#05070c', shadeA: 0.6, alpha: 0.97, blur: 1.3, avoid: [moon[0], 40] });
      clouds(c, rnd, { y: 188, dy: 26, n: 20, r0: 10, r1: 22, sx: 2.6, sy: 0.45, body: '#1c2636', lit: '#4a6080', shadeCol: '#0a0e16', shadeA: 0.5, alpha: 0.8, blur: 1.4 });
      streaks(c, rnd, 260, '#a8c0e0', 0.16, 1.85, 14, 0, 360);
    } });
    layers.push({ p: 0.05, draw(c, rnd) {
      paint(c, [ridge(250, 50, [1, 4, 11], 2.2, 5)], { col: '#26323f', bot: '#3c5068', y0: 190, y1: 340, rim: '#90aad8', rimA: 0.8 });
      const F = [];
      rampart(F, 560, 900, 222, 34);
      for (const [x, w, h, cone] of [[578, 22, 70, true], [650, 30, 96, false], [726, 26, 120, true], [800, 34, 84, false], [882, 22, 66, true]]) keep(F, x, 224, w, h, cone);
      paint(c, F, { col: '#222c3a', bot: '#384a60', y0: 100, y1: 240, rim: '#9ab4e0' });
      rep(c, (q) => { for (const [x, y] of [[650, 150], [726, 128], [800, 160], [660, 196], [760, 200]]) { q.fillStyle = 'rgba(255,190,110,0.85)'; q.fillRect(x - 1, y, 2, 4.5); glow(q, x, y + 2, 7, '#ffb060', 0.45); } });
      const K = [], kn = knight(K, 170, 270, 210); live.lamp = kn.lamp;
      paint(c, K, { col: '#141c28', bot: '#28364a', y0: 30, y1: 270, rim: '#b0c8f4', rx: 0.5, ry: 0.9, shade: lightIn(kn.lamp[0], kn.lamp[1], 70, '#6a5030', 0.5) });
      rep(c, (q) => { glow(q, kn.lamp[0], kn.lamp[1], 70, '#ffb860', 0.4); glow(q, kn.lamp[0], kn.lamp[1], 16, '#fff0c0', 0.9); });
      horizon(c, 200, 360, '#34485e', 0.55);
    } });
    layers.push({ p: 0.15, draw(c, rnd) {
      const W = [];
      rampart(W, -10, LW + 10, 322, 52); W.push(rect(-4, 320, LW + 8, 50));
      for (const x of [110, 470, 830]) keep(W, x, 300, 44, 118, false);
      for (const x of [290, 650]) keep(W, x, 300, 26, 84, true);
      const G = []; for (const x of [200, 380, 560, 720]) gibbet(G, x, 270, 70);
      const ban = []; for (const x of [110, 470, 830]) { ban.push(rect(x + 14, 160, 1.6, 30)); const p = P(); p.moveTo(x + 15, 162); p.lineTo(x + 34, 164); p.lineTo(x + 31, 172); p.lineTo(x + 36, 182); p.lineTo(x + 15, 180); p.closePath(); ban.push(p); }
      paint(c, G, { col: '#0e121a', rim: '#6a84b0', rimA: 0.8 });
      paint(c, W, { col: '#141a24', bot: '#0c1016', y0: 180, y1: 340, rim: '#7a94c0', shade: mottle(rnd, 50, 170, 340, ['#1e2632', '#0a0d12'], 0.4) });
      paint(c, ban, { col: '#4a1418', rim: '#c05050', rimA: 0.6 });
      rep(c, (q) => {
        for (const x of [110, 470, 830]) for (const y of [206, 236]) { q.fillStyle = 'rgba(6,8,12,0.9)'; q.fillRect(x - 2, y, 4, 11); }
        for (const x of [40, 250, 400, 560, 700, 910]) { q.fillStyle = '#3a2a1e'; q.fillRect(x - 0.8, 262, 1.6, 8); q.fillStyle = '#ffd090'; q.fillRect(x - 1, 258, 2, 4); glow(q, x, 259, 22, '#ff9a40', 0.5); }
      });
      horizon(c, 300, 360, '#141a24', 0.6);
    } });
    layers.push({ p: 0.34, draw(c, rnd) {
      const N = [];
      N.push(rect(-2, 346, LW + 4, 16));
      for (let x = 0; x < LW; x += 9 + rnd() * 10) { const h = 18 + rnd() * 26, lean = (rnd() - 0.5) * 8; N.push(poly([[x - 2.8, 348], [x + lean, 348 - h], [x + 2.8, 348]])); }
      for (const x of [260, 690]) { N.push(line([[x, 348], [x + 2, 266]], 2.4)); N.push(poly([[x + 0.5, 266], [x + 2, 254], [x + 3.5, 266]])); }
      for (const [x, y] of [[300, 336], [640, 330], [820, 338]]) { N.push(ell(x, y, 4, 2.6), circ(x + 3.6, y - 2, 1.8), poly([[x + 5, y - 2.4], [x + 8.5, y - 1.6], [x + 5, y - 1]]), poly([[x - 3, y], [x - 8, y - 1.5], [x - 3.6, y + 1.4]])); }
      paint(c, N, { col: '#07090d', rim: '#1e2a3c', rx: 0.15, ry: 0.45, rimA: 0.8 });
    } });
    layers[1].anim = (c, t, cam) => {
      if (live.lamp) aglow(c, live.lamp[0], live.lamp[1], 46, '#ffb860', 0.22 + 0.1 * Math.sin(t * 7.3) + 0.06 * Math.sin(t * 19));
      if (cam && cam.flash > 0.15) { const seed = Math.floor(t / 1.5) + 7; bolt(c, seed, 60 + (seed * 137) % 840, -10, 170 + (seed * 53) % 60, cam.flash); }
    };
    layers[2].anim = (c, t) => { for (const [i, x] of [40, 250, 400, 560, 700, 910].entries()) aglow(c, x, 258, 20, '#ff9a40', 0.32 + 0.16 * Math.sin(t * 10 + i * 1.9) + 0.07 * Math.sin(t * 27 + i)); };
  });

  // ======================================================================= FORJAS AFUNDADAS (vê-se pelas grades)
  // um céu de fumo aceso por baixo; chaminés de tijolo a cuspir fogo; altos-fornos de boca acesa; um caldeirão
  // colossal suspenso a verter metal; arcaria de tijolo com braseiros pendurados
  S.forge = style(function (R, layers) {
    const live = {};
    layers.push({ p: 0.03, draw(c, rnd) {
      horizon(c, 100, 360, '#c03a10', 0.6);
      glow(c, 480, 340, 460, '#ff5a1a', 0.35); glow(c, 200, 330, 220, '#ffa040', 0.25); glow(c, 790, 320, 240, '#ffa040', 0.22);
      cumulus(c, rnd, { n: 14, y: 150, dy: 70, w0: 110, w1: 220, tall: 1.1, body: '#1a0a06', lit: '#b0441a', shadeCol: '#060201', shadeA: 0.6, alpha: 0.92, blur: 2.2 });
      streaks(c, rnd, 90, '#ffb060', 0.35, -1.45, 5, 60, 360);
    } });
    layers.push({ p: 0.07, draw(c, rnd) {
      const Ch = [], chs = [[70, 30, 250], [330, 38, 300], [610, 26, 230], [880, 34, 280]];
      for (const [x, w, h] of chs) { Ch.push(rect(x - w / 2, 362 - h, w, h + 2), rect(x - w / 2 - 3, 362 - h - 6, w + 6, 7)); for (let y = 362 - h + 30; y < 340; y += 46) Ch.push(rect(x - w / 2 - 1.5, y, w + 3, 3)); }
      const Fu = [], f1 = furnace(Fu, 200, 362, 150, 170), f2 = furnace(Fu, 740, 362, 130, 150);
      Fu.push(rect(110, 196, 520, 5)); for (const x of [260, 470]) Fu.push(rect(x - 3, 196, 6, 166)); // ponte de carga entre os fornos
      const Cr = [], cx = 470, cy = 118;
      const ang = -0.22, R2 = (px, py) => [cx + px * Math.cos(ang) - py * Math.sin(ang), cy + px * Math.sin(ang) + py * Math.cos(ang)];
      const bw = []; for (let i = 0; i <= 18; i++) { const t = Math.PI * i / 18; bw.push(R2(-52 * Math.cos(t), 46 * Math.sin(t))); }
      Cr.push(poly(bw), poly([R2(-57, -7), R2(57, -7), R2(57, 2), R2(-57, 2)]), poly([R2(52, -7), R2(78, -16), R2(57, 3)]), poly([R2(-40, 40), R2(40, 40), R2(30, 50), R2(-30, 50)]));
      for (const px of [-48, 0, 48]) Cr.push(line([R2(px, -7), [cx + px * 0.4, -10]], 1.8));
      const spout = R2(78, -16); live.spout = spout; live.chs = chs;
      paint(c, Ch, { col: '#1e100c', bot: '#3a1a10', y0: 60, y1: 360, rim: '#ff8a40', rimA: 0.8 });
      paint(c, Fu, { col: '#1a0c08', bot: '#2e140c', y0: 150, y1: 362, rim: '#ffa050', shade: mottle(rnd, 30, 150, 362, ['#2a140c', '#0e0604'], 0.4) });
      paint(c, Cr, { col: '#140a08', rim: '#ffb060' });
      rep(c, (q) => {
        for (const [x, , h] of chs) { glow(q, x, 362 - h - 8, 36, '#ffb050', 0.6); glow(q, x, 362 - h - 40, 70, '#ff6a20', 0.22); }
        for (const f of [f1, f2]) { const [mx, mb, mw, mh] = f.mouth; q.fillStyle = 'rgba(255,170,70,0.95)'; q.beginPath(); archP(q, mx, mb, mw, mh); q.fill(); glow(q, mx, mb - mh * 0.4, mw * 1.4, '#ff8a30', 0.5); glow(q, f.top[0], f.top[1], 34, '#ffb050', 0.55); }
        const g = q.createLinearGradient(0, cy - 30, 0, 362); g.addColorStop(0, 'rgba(255,236,150,0.95)'); g.addColorStop(1, 'rgba(255,90,20,0.75)');
        q.strokeStyle = g; q.lineWidth = 5; q.lineCap = 'round'; q.beginPath(); q.moveTo(spout[0], spout[1]); q.quadraticCurveTo(spout[0] + 16, spout[1] + 20, spout[0] + 14, 362); q.stroke();
        glow(q, spout[0] + 14, 340, 60, '#ff8030', 0.5); glow(q, spout[0], spout[1], 18, '#fff0b0', 0.7);
        q.strokeStyle = 'rgba(255,150,60,0.9)'; q.lineWidth = 2; q.beginPath(); q.moveTo(0, 356); q.lineTo(LW, 356); q.stroke();
      });
      horizon(c, 230, 362, '#5a1a08', 0.4);
    } });
    layers.push({ p: 0.22, draw(c, rnd) {
      const A = [];
      A.push(rect(-4, 0, LW + 8, 364));
      for (let i = 0; i < 3; i++) A.push(archHole(160 + i * 320, 364, 236, 300));
      const hang = [];
      for (const x of [160, 480, 800]) { A.push(after(line([[x, 64], [x, 196]], 1.6))); for (let y = 66; y < 196; y += 6) A.push(after(ell(x, y, 1.6, 2.7))); const k = P(); k.moveTo(x - 15, 198); k.lineTo(x + 15, 198); k.quadraticCurveTo(x + 13, 220, x, 222); k.quadraticCurveTo(x - 13, 220, x - 15, 198); k.closePath(); A.push(after(k)); hang.push(x); }
      const joints = (q) => { q.fillStyle = 'rgba(0,0,0,0.22)'; for (let y = 20; y < 360; y += 14) { q.fillRect(0, y, LW, 1); for (let x = (y / 14) % 2 ? 0 : 14; x < LW; x += 28) q.fillRect(x, y, 1, 14); } };
      paint(c, A, { col: '#1a0e0c', bot: '#0e0806', y0: 0, y1: 360, rim: '#ff7a30', rx: 0.6, ry: -0.8, shade: both(mottle(rnd, 60, 0, 360, ['#2a1610', '#0a0504'], 0.4), joints) });
      rep(c, (q) => {
        for (const x of hang) { q.fillStyle = 'rgba(255,160,60,0.95)'; q.fillRect(x - 13, 197, 26, 2.4); glow(q, x, 196, 26, '#ff8a30', 0.45); }
      });
    } });
    layers[1].anim = (c, t) => {
      if (!live.spout) return;
      const [sx, sy] = live.spout;
      // gotas de metal a descer pelo fio
      c.fillStyle = 'rgba(255,240,170,0.9)';
      for (let i = 0; i < 7; i++) { const k = ((t * 0.8 + i / 7) % 1), y = sy + k * (362 - sy), x = sx + 16 * Math.sin(Math.min(1, k * 3) * Math.PI / 2) - 2 * k; c.fillRect(x - 1.2, y, 2.4, 6); }
      aglow(c, sx + 14, 345, 50, '#ff8030', 0.3 + 0.12 * Math.sin(t * 6));
      for (const [i, [x, , h]] of live.chs.entries()) {
        aglow(c, x, 362 - h - 8, 30, '#ffb050', 0.35 + 0.15 * Math.sin(t * 5 + i * 1.7) + 0.08 * Math.sin(t * 13 + i));
        for (let k = 0; k < 4; k++) { const ph = ((t * 0.35 + k / 4 + i * 0.13) % 1); c.globalAlpha = (1 - ph) * 0.9; c.fillStyle = '#ffd080'; c.fillRect(x + Math.sin(ph * 9 + k * 2 + i) * 9, 362 - h - 12 - ph * 60, 1.4, 1.4); }
        c.globalAlpha = 1;
      }
    };
  });

  // ======================================================================= JARDINS AFOGADOS
  // névoa verde-água ao luar; estufas de ferro e vidro; a cabeça colossal de uma santa afundada até ao queixo, de
  // olhos fechados, a chorar, com velas a flutuar à volta; arcadas inundadas, salgueiros-chorões, juncos
  S.garden = style(function (R, layers) {
    const moon = [300, 86], water = 296, live = {};
    layers.push({ p: 0.02, draw(c, rnd) {
      horizon(c, 120, 320, '#3a7a6a', 0.45);
      glow(c, moon[0], moon[1], 220, '#b8ffe8', 0.16); glow(c, moon[0], moon[1], 48, '#e8fff4', 0.4);
      c.fillStyle = 'rgba(230,255,244,0.85)'; c.beginPath(); c.arc(moon[0], moon[1], 18, 0, TAU); c.fill();
      c.strokeStyle = 'rgba(200,255,230,0.18)'; c.lineWidth = 1.5; c.beginPath(); c.arc(moon[0], moon[1], 58, 0, TAU); c.stroke();
      stars(c, rnd, 60, 160, '#d8fff0');
      cumulus(c, rnd, { n: 9, y: 150, dy: 40, w0: 110, w1: 230, sy: 0.6, body: '#1a3634', lit: '#5a9c8c', shadeCol: '#08141a', shadeA: 0.4, alpha: 0.6, blur: 2.6, avoid: [moon[0], 30] });
    } });
    layers.push({ p: 0.05, draw(c, rnd) {
      const T = []; for (let x = -10; x < LW + 10; x += 16 + rnd() * 24) { if (rnd() < 0.3) willow(T, x, water - 4, 70 + rnd() * 30, rnd); else cypress(T, x, water - 4, 12, 40 + rnd() * 34, rnd); }
      paint(c, T, { col: '#183030', bot: '#28483f', y0: 200, y1: water, rim: '#7ac8b0', rimA: 0.5, blur: 0.6 });
      for (const [x, w, h] of [[160, 200, 140], [880, 150, 110]]) {
        const p = P(); p.moveTo(x - w / 2, water); p.lineTo(x - w / 2, water - h * 0.42); p.bezierCurveTo(x - w / 2, water - h * 1.15, x + w / 2, water - h * 1.15, x + w / 2, water - h * 0.42); p.lineTo(x + w / 2, water); p.closePath();
        rep(c, (q) => {
          const g = q.createLinearGradient(0, water - h, 0, water); g.addColorStop(0, 'rgba(160,240,210,0.1)'); g.addColorStop(1, 'rgba(160,255,210,0.24)'); q.fillStyle = g; q.fill(p);
          glow(q, x, water - h * 0.3, w * 0.4, '#a0ffc8', 0.18);
          q.save(); q.clip(p); q.strokeStyle = 'rgba(26,52,48,0.9)'; q.lineWidth = 1.2;
          for (let i = -7; i <= 7; i++) { q.beginPath(); q.moveTo(x + i * w / 14, water); q.lineTo(x + i * w / 14, water - h * 0.42); q.quadraticCurveTo(x + i * w / 15, water - h * 1.02, x, water - h * 0.86); q.stroke(); }
          for (let y = water - h; y < water; y += 16) { q.beginPath(); q.moveTo(x - w / 2, y); q.lineTo(x + w / 2, y); q.stroke(); }
          q.restore(); q.lineWidth = 2; q.strokeStyle = 'rgba(26,52,48,0.95)'; q.stroke(p);
          q.fillStyle = 'rgba(26,52,48,0.95)'; q.fillRect(x - 1, water - h * 0.86 - 14, 2, 14); q.beginPath(); q.arc(x, water - h * 0.86 - 15, 2.4, 0, TAU); q.fill();
        });
      }
      // a cabeça afundada: o véu escuro, o rosto de pedra mais claro (virado para a lua), a lágrima acesa
      const Hd = [], hd = sunkenHead(Hd, 600, water + 0.17 * 230, 230);
      glow(c, hd.top[0] - 60, hd.top[1] + 40, 140, '#a8f0d8', 0.12);
      paint(c, Hd, { col: '#14282a', bot: '#1e3c38', y0: 60, y1: water, rim: '#c8ffe8', rx: 0.6, ry: 0.8, shade: mottle(rnd, 24, 60, water, ['#1e3634', '#0c1a1a'], 0.45) });
      paint(c, [hd.face], { col: '#5a7a72', bot: '#34544c', y0: 100, y1: water, rim: '#e0fff2', rx: 0.7, ry: 0.4, shade: lightIn(moon[0], moon[1], 380, '#8aaea4', 0.5) });
      rep(c, (q) => {
        q.strokeStyle = 'rgba(14,30,30,0.9)'; q.lineWidth = 1.4; q.beginPath(); q.moveTo(...hd.veil[0]); for (const pt of hd.veil.slice(1)) q.lineTo(...pt); q.stroke();
        const [ex, ey] = hd.eye; q.lineWidth = 1.2; q.beginPath(); q.moveTo(ex - 7, ey - 1); q.quadraticCurveTo(ex, ey + 3.5, ex + 7, ey); q.stroke();
        q.beginPath(); q.moveTo(ex - 8, ey - 9); q.quadraticCurveTo(ex, ey - 12, ex + 8, ey - 8); q.stroke();
        q.strokeStyle = 'rgba(210,255,236,0.9)'; q.lineWidth = 1.1; q.beginPath(); q.moveTo(ex + 1, ey + 3); q.quadraticCurveTo(ex + 3, ey + 30, ex - 2, ey + 64); q.stroke();
        glow(q, ex, ey + 30, 16, '#c8ffe8', 0.3);
      });
      // a água: tapa a base; reflexo invertido e esbatido; brilhos da lua; velas a flutuar à volta da cabeça
      const wg = c.createLinearGradient(0, water, 0, 362); wg.addColorStop(0, '#1e4a44'); wg.addColorStop(1, '#0e2624'); c.fillStyle = wg; c.fillRect(0, water, LW, 362 - water);
      paint(c, Hd.concat(T), { col: '#3a6a60', alpha: 0.32, flipY: water, blur: 1.6 });
      c.fillStyle = 'rgba(200,255,235,0.3)'; for (let i = 0; i < 40; i++) { const y = water + 4 + rnd() * 60, w = 6 + rnd() * 26; c.fillRect(moon[0] - w / 2 + (rnd() - 0.5) * 50 * (y - water) / 60, y, w, 0.8); }
      const cand = []; for (let i = 0; i < 14; i++) cand.push([470 + rnd() * 300, water + 3 + rnd() * 16]); live.cand = cand;
      rep(c, (q) => { for (const [x, y] of cand) { q.fillStyle = 'rgba(30,70,50,0.95)'; q.beginPath(); q.ellipse(x, y + 1.5, 5, 1.4, 0, 0, TAU); q.fill(); q.fillStyle = '#f0f0e0'; q.fillRect(x - 0.7, y - 3, 1.4, 3.5); glow(q, x, y - 4, 9, '#ffe0a0', 0.6); } });
      horizon(c, 236, 300, '#3a7a6a', 0.3);
    } });
    layers.push({ p: 0.15, draw(c, rnd) {
      const A = [], wl = 318;
      A.push(rect(160, 240, 520, wl - 240 + 1));
      for (let i = 0; i < 6; i++) A.push(archHole(160 + (i + 0.5) * 520 / 6, wl + 30, 56, 100));
      A.push(rect(150, 236, 540, 6));
      for (const x of [160, 680]) { A.push(rect(x - 7, 210, 14, wl - 210)); finial(A, x, 210, 20); }
      const Wl = []; willow(Wl, 70, wl + 4, 150, rnd); willow(Wl, 790, wl + 4, 170, rnd); willow(Wl, 920, wl + 4, 120, rnd);
      paint(c, A, { col: '#1a2e2a', bot: '#24443c', y0: 236, y1: wl, rim: '#9ae0c8', shade: mottle(rnd, 30, 236, wl, ['#2e4a40', '#10201c'], 0.45) });
      rep(c, (q) => { q.strokeStyle = 'rgba(60,110,70,0.75)'; q.lineWidth = 1.1; for (let x = 168; x < 684; x += 13) { q.beginPath(); q.moveTo(x, 242); q.quadraticCurveTo(x + 5, 262, x - 1, 278 + (x % 23)); q.stroke(); } });
      paint(c, Wl, { col: '#12241c', bot: '#1c362c', y0: 160, y1: wl, rim: '#8adcb0', rimA: 0.7 });
      const wg = c.createLinearGradient(0, wl, 0, 362); wg.addColorStop(0, 'rgba(30,80,70,0.92)'); wg.addColorStop(1, 'rgba(10,30,26,0.96)'); c.fillStyle = wg; c.fillRect(0, wl, LW, 362 - wl);
      paint(c, A.concat(Wl), { col: '#3a6a5a', alpha: 0.26, flipY: wl, blur: 1.2 });
      rep(c, (q) => { for (let i = 0; i < 14; i++) { const x = (i * 71.3) % LW, y = wl + 6 + (i * 13) % 30; q.fillStyle = 'rgba(40,90,50,0.9)'; q.beginPath(); q.ellipse(x, y, 7, 2, 0, 0.3, TAU - 0.3); q.lineTo(x, y); q.fill(); if (i % 3 === 0) { q.fillStyle = '#f0e0f0'; q.beginPath(); q.arc(x + 1, y - 1.5, 1.6, 0, TAU); q.fill(); glow(q, x + 1, y - 1.5, 6, '#ffe8ff', 0.4); } } });
    } });
    layers.push({ p: 0.34, draw(c, rnd) {
      const N = [];
      reeds(N, 0, LW, 352, 56, rnd);
      for (const x of [140, 520, 860]) brambles(N, x, 352, 40, rnd);
      paint(c, N, { col: '#08120e', rim: '#4a8a76', rx: 0.2, ry: 0.5, rimA: 0.8 });
      rep(c, (q) => { for (const [x, y] of [[150, 318], [530, 314], [866, 320], [500, 330]]) { q.fillStyle = '#7a1424'; q.beginPath(); q.arc(x, y, 2.4, 0, TAU); q.fill(); } });
    } });
    const flies = []; { const r = U.rng(4471); for (let i = 0; i < 26; i++) flies.push([r() * LW, 150 + r() * 180, r() * 6.28, 0.3 + r() * 0.5]); }
    layers[1].anim = (c, t) => {
      if (live.cand) for (const [i, [x, y]] of live.cand.entries()) aglow(c, x, y - 4 + Math.sin(t * 1.3 + i) * 0.6, 8, '#ffe0a0', 0.35 + 0.18 * Math.sin(t * 9 + i * 1.7));
      c.fillStyle = 'rgba(220,255,240,0.5)';
      for (let i = 0; i < 9; i++) { const k = Math.sin(t * 1.7 + i * 2.3); if (k < 0.2) continue; c.globalAlpha = (k - 0.2) * 0.8; c.fillRect(moon[0] - 20 + ((i * 37) % 44) + Math.sin(t * 0.7 + i) * 4, water + 6 + i * 5, 6 + (i % 3) * 4, 0.8); }
      c.globalAlpha = 1;
    };
    layers[3].anim = (c, t) => { for (const [x0, y0, ph, sp] of flies) { const x = x0 + Math.sin(t * sp + ph) * 18, y = y0 + Math.sin(t * sp * 1.3 + ph * 2) * 10, a = 0.25 + 0.45 * Math.max(0, Math.sin(t * 2.2 + ph * 3)); aglow(c, x, y, 5, '#d0ffb0', a); } };
  });

  // ======================================================================= TORRE DOS SINOS (acima das nuvens)
  // o sol a pôr-se num mar de nuvens; torres sineiras a romper; o braço de pedra com o círio aceso; correntes com
  // flâmulas entre as torres; corvos
  S.tower = style(function (R, layers) {
    const sun = [470, 268], live = {};
    layers.push({ p: 0.02, draw(c, rnd) {
      horizon(c, 100, 300, '#c08868', 0.55); horizon(c, 220, 300, '#ffc890', 0.4);
      glow(c, sun[0], sun[1], 340, '#ffb080', 0.3); glow(c, sun[0], sun[1], 90, '#ffe0b0', 0.55);
      c.fillStyle = 'rgba(255,232,190,0.95)'; c.beginPath(); c.arc(sun[0], sun[1], 34, 0, TAU); c.fill();
      rays(c, rnd, sun[0], sun[1], 16, 320, '#ffd0a0', 0.1, -Math.PI / 2, 2.8);
      clouds(c, rnd, { y: 60, dy: 40, n: 22, r0: 8, r1: 18, sx: 3.4, sy: 0.32, body: '#3a2e50', lit: '#e8a080', shadeCol: '#140e24', shadeA: 0.4, alpha: 0.85, blur: 1.2 });
      clouds(c, rnd, { y: 150, dy: 30, n: 14, r0: 6, r1: 12, sx: 4, sy: 0.3, body: '#6a5070', lit: '#ffc8a0', alpha: 0.6, blur: 1 });
    } });
    layers.push({ p: 0.05, draw(c, rnd) {
      const T = [], hs = [];
      for (const [x, w, h, r] of [[60, 22, 186, 'spire'], [210, 16, 132, 'bulb'], [325, 26, 216, 'dome'], [800, 20, 166, 'spire'], [905, 14, 118, 'bulb']]) hs.push(belfry(T, x, 320, w, h, { roof: r, bells: true }));
      const H = [], fl = fistCandle(H, 610, 330, 236); live.flame = fl;
      paint(c, T, { col: '#3a2e48', bot: '#5a4868', y0: 100, y1: 320, rim: '#ffd8b0', shade: lightIn(sun[0], sun[1], 200, '#7a5a60', 0.4) });
      paint(c, H, { col: '#30263e', bot: '#544462', y0: 50, y1: 320, rim: '#ffe0b8', rx: 0.8, ry: 0.7, shade: both(lightIn(fl[0], fl[1], 110, '#b08060', 0.5), mottle(rnd, 20, 60, 320, ['#3a2e48', '#241c30'], 0.4)) });
      rep(c, (q) => {
        for (const h of hs) for (const [x, b, w, hh] of h.holes) glow(q, x, b - hh * 0.4, 8, '#ffd090', 0.25);
        glow(q, fl[0], fl[1], 90, '#ffc070', 0.4); glow(q, fl[0], fl[1], 24, '#fff2c8', 0.9);
        q.fillStyle = '#fff6d8'; q.beginPath(); q.moveTo(fl[0], fl[1] - 13); q.quadraticCurveTo(fl[0] + 4.6, fl[1] - 2, fl[0], fl[1] + 4); q.quadraticCurveTo(fl[0] - 4.6, fl[1] - 2, fl[0], fl[1] - 13); q.fill();
      });
      cumulus(c, rnd, { n: 16, y: 318, dy: 14, w0: 90, w1: 190, from: 'top', floor: true, litW: 0.16, body: '#6a5470', lit: '#ffd8b8', shadeCol: '#3a2e48', shadeA: 0.6, blur: 1.2 });
      horizon(c, 300, 362, '#5a4868', 0.5);
    } });
    layers.push({ p: 0.15, draw(c, rnd) {
      const T = [], hs = [belfry(T, 120, 392, 46, 320, { roof: 'bulb', bells: true, n: 2 }), belfry(T, 830, 392, 54, 340, { roof: 'dome', bells: true, n: 2 })];
      paint(c, T, { col: '#262032', bot: '#3a2e48', y0: 60, y1: 360, rim: '#ffd8b0', shade: mottle(rnd, 40, 60, 360, ['#342a44', '#1a1424'], 0.4) });
      const chainPts = []; for (let i = 0; i <= 40; i++) { const t = i / 40; chainPts.push([142 + t * 662, 168 + Math.sin(t * Math.PI) * 56 + t * 4]); }
      const fl = []; for (let i = 1; i < 40; i += 2) { const [x, y] = chainPts[i]; fl.push([x, y, i % 4 === 1 ? '#7a2a2a' : '#d8b060']); }
      rep(c, (q) => {
        q.strokeStyle = '#1a1424'; q.lineWidth = 1.3; q.beginPath(); chainPts.forEach(([x, y], i) => (i ? q.lineTo(x, y) : q.moveTo(x, y))); q.stroke();
        for (const [x, y, col] of fl) { q.fillStyle = col; q.beginPath(); q.moveTo(x - 3.4, y); q.lineTo(x + 3.4, y); q.lineTo(x, y + 9); q.closePath(); q.fill(); }
        for (const h of hs) for (const [x, b, w, hh] of h.holes) glow(q, x, b - hh * 0.3, 12, '#ffd8a0', 0.18);
      });
      const birds = []; for (let i = 0; i < 7; i++) birds.push([300 + rnd() * 300, 60 + rnd() * 90, 2 + rnd() * 2]);
      rep(c, (q) => { q.strokeStyle = '#1a1424'; q.lineWidth = 1; for (const [x, y, s] of birds) { q.beginPath(); q.moveTo(x - s * 2, y - s * 0.6); q.quadraticCurveTo(x - s, y - s * 0.9, x, y); q.quadraticCurveTo(x + s, y - s * 0.9, x + s * 2, y - s * 0.6); q.stroke(); } });
      cumulus(c, rnd, { n: 14, y: 344, dy: 10, w0: 120, w1: 240, from: 'top', floor: true, litW: 0.14, body: '#4a3a58', lit: '#ffc8a8', shadeCol: '#241c32', shadeA: 0.6, blur: 1 });
    } });
    layers.push({ p: 0.3, draw(c, rnd) {
      cumulus(c, rnd, { n: 9, y: 368, dy: 6, w0: 110, w1: 200, from: 'top', floor: true, litW: 0.12, body: '#2e2440', lit: '#d8a090', shadeCol: '#181224', shadeA: 0.5, alpha: 0.85, blur: 1.6 });
    } });
    layers[1].anim = (c, t) => {
      flock(c, t, { period: 44, speed: 22, y: 150, n: 6, dir: 1, col: 'rgba(40,30,56,0.85)', size: 2 });
      if (live.flame) { const [x, y] = live.flame, f = 0.85 + 0.12 * Math.sin(t * 11) + 0.06 * Math.sin(t * 27); aglow(c, x, y, 34 * f, '#ffc070', 0.4 * f); c.fillStyle = '#fff6d8'; c.beginPath(); c.moveTo(x + Math.sin(t * 7) * 1.2, y - 13 * f); c.quadraticCurveTo(x + 4.6, y - 2, x, y + 4); c.quadraticCurveTo(x - 4.6, y - 2, x + Math.sin(t * 7) * 1.2, y - 13 * f); c.fill(); }
    };
  });

  // ======================================================================= CATEDRAL DO CREPÚSCULO (vê-se pelas janelas)
  // noite violeta e lua crescente; uma cidade de cúpulas e agulhas; a Virgem da lua ao longe; perto, o telhado da
  // catedral: balaustrada, pináculos, santos e gárgulas
  S.cathedral = style(function (R, layers) {
    const moon = [250, 96], live = {};
    layers.push({ p: 0.02, draw(c, rnd) {
      horizon(c, 140, 330, '#4a3070', 0.5);
      stars(c, rnd, 140, 260, '#f0e8ff');
      glow(c, moon[0], moon[1], 200, '#d8c0ff', 0.2); glow(c, moon[0], moon[1], 46, '#f4eeff', 0.45);
      c.fillStyle = 'rgba(244,238,255,0.92)'; c.beginPath(); c.arc(moon[0], moon[1], 22, 0, TAU); c.fill();
      c.fillStyle = 'rgba(40,24,70,0.95)'; c.beginPath(); c.arc(moon[0] + 9, moon[1] - 4, 19, 0, TAU); c.fill();
      c.strokeStyle = 'rgba(255,224,170,0.35)'; c.lineWidth = 1.6; c.beginPath(); c.arc(moon[0], moon[1], 44, 0, TAU); c.stroke();
      clouds(c, rnd, { y: 196, dy: 40, n: 16, r0: 8, r1: 18, sx: 3, sy: 0.4, body: '#2a1c44', lit: '#9a80d0', shadeCol: '#0e0818', shadeA: 0.4, alpha: 0.75, blur: 1.3 });
    } });
    layers.push({ p: 0.06, draw(c, rnd) {
      const C = [], ws = [];
      for (const [x, w, h] of [[110, 52, 120], [470, 80, 170], [860, 50, 110]]) { ws.push(dome(C, x, 300, w, h)); C.push(rect(x - w * 0.95, 268, w * 1.9, 34)); }
      for (const [x, w, h, r] of [[40, 14, 150, 'spire'], [196, 13, 130, 'bulb'], [370, 18, 186, 'spire'], [572, 16, 170, 'spire'], [930, 15, 160, 'bulb']]) belfry(C, x, 302, w, h, { roof: r });
      paint(c, C, { col: '#241a38', bot: '#3e2c5a', y0: 110, y1: 300, rim: '#d8c8ff', shade: lightIn(moon[0], moon[1], 260, '#4a3a70', 0.4) });
      rep(c, (q) => { for (const d of ws) for (const [x, y, w, h] of d.wins) { q.fillStyle = 'rgba(255,214,150,0.75)'; q.beginPath(); archP(q, x, y + h, Math.max(2.2, w * 0.7), h * 0.9); q.fill(); glow(q, x, y + h / 2, 7, '#ffd090', 0.35); } });
      const V = [], vi = inmaculada(V, 720, 286, 176); live.stars = vi.stars;
      glow(c, vi.halo[0], vi.halo[1], 70, '#ffe8b0', 0.25);
      paint(c, V, { col: '#2a2040', bot: '#3e2c5a', y0: 110, y1: 286, rim: '#ffe8c0', rx: -0.4, ry: 0.9 });
      rep(c, (q) => { glows(vi.stars, 4, '#fff0c0', 0.85)(q); glow(q, vi.moon[0], vi.moon[1], 30, '#e8d8ff', 0.25); });
      horizon(c, 200, 360, '#3a2a50', 0.55);
    } });
    layers.push({ p: 0.2, draw(c, rnd) {
      const B = [], St = [], G = [];
      B.push(rect(-4, 318, LW + 8, 50), rect(-4, 300, LW + 8, 5), rect(-4, 314, LW + 8, 5));
      for (let x = -2; x < LW + 2; x += 7) B.push(rect(x, 304, 2.8, 10));
      for (let x = 80; x < LW; x += 200) {
        B.push(rect(x - 11, 236, 22, 70), rect(x - 13, 232, 26, 5));
        B.push(poly([[x - 9, 232], [x, 120], [x + 9, 232]]));
        for (let y = 140; y < 228; y += 12) { const w = 9 * (y - 120) / 112; B.push(poly([[x - w, y], [x - w - 4.5, y - 3], [x - w + 0.6, y - 5]]), poly([[x + w, y], [x + w + 4.5, y - 3], [x + w - 0.6, y - 5]])); }
        B.push(circ(x, 118, 3)); cross(B, x, 114, 12, 1.6);
        saint(St, x + 100, 300, 46, (x / 200) % 2 ? 1 : 2);
        const gx = x + 44; G.push(smooth([[gx - 8, 326], [gx + 20, 322], [gx + 36, 314], [gx + 50, 312], [gx + 56, 320], [gx + 48, 324], [gx + 54, 330], [gx + 40, 330], [gx + 26, 336], [gx - 8, 340]], true), poly([[gx + 44, 313], [gx + 47, 302], [gx + 51, 312]]), poly([[gx + 12, 324], [gx + 4, 312], [gx + 18, 322]]));
      }
      paint(c, B, { col: '#1a1228', bot: '#120c1c', y0: 110, y1: 362, rim: '#c8b0ff', shade: mottle(rnd, 40, 110, 362, ['#261a38', '#0e0816'], 0.45) });
      paint(c, St, { col: '#221a34', rim: '#ffe8c0' });
      paint(c, G, { col: '#140e20', rim: '#b8a0f0' });
      rep(c, (q) => { for (let x = 30; x < LW; x += 100) { q.fillStyle = 'rgba(255,200,130,0.5)'; q.beginPath(); archP(q, x, 362, 10, 30); q.fill(); glow(q, x, 348, 16, '#ffc080', 0.3); } });
    } });
    const tw = []; { const r = U.rng(9911); for (let i = 0; i < 30; i++) tw.push([r() * LW, r() * 220, r() * 6.28, 0.6 + r() * 1.4]); }
    layers[1].anim = (c, t) => {
      c.fillStyle = '#f4eeff'; for (const [x, y, ph, sp] of tw) { const a = Math.sin(t * sp + ph); if (a > 0.3) { c.globalAlpha = (a - 0.3) * 1.2; c.fillRect(x - 0.7, y - 0.7, 1.4, 1.4); } }
      c.globalAlpha = 1;
      if (live.stars) for (const [i, [x, y]] of live.stars.entries()) aglow(c, x, y, 5, '#fff0c0', 0.3 + 0.35 * Math.max(0, Math.sin(t * 1.6 + i * 0.9)));
    };
  });

  // ======================================================================= PALÁCIO REAL (vê-se pelas janelas)
  // céu carmesim e um sol negro de coroa acesa; o palácio de cúpulas douradas; colunata com estandartes; reis de pedra
  // ajoelhados de espada erguida
  S.palace = style(function (R, layers) {
    const sun = [480, 132];
    const ash = []; { const r = U.rng(5521); for (let i = 0; i < 40; i++) ash.push([r() * LW, r() * 320, 20 + r() * 40, 40 + r() * 50]); }
    layers.push({ p: 0.02, draw(c, rnd) {
      horizon(c, 80, 330, '#a02818', 0.6);
      glow(c, sun[0], sun[1], 330, '#ff4020', 0.28); glow(c, sun[0], sun[1], 80, '#ffb070', 0.5);
      c.strokeStyle = 'rgba(255,200,120,0.9)'; c.lineWidth = 3; c.beginPath(); c.arc(sun[0], sun[1], 40, 0, TAU); c.stroke();
      rays(c, rnd, sun[0], sun[1], 22, 200, '#ff9a60', 0.12, 0, TAU);
      c.fillStyle = '#0a0204'; c.beginPath(); c.arc(sun[0], sun[1], 38.5, 0, TAU); c.fill();
      cumulus(c, rnd, { n: 8, y: 236, dy: 50, w0: 100, w1: 200, sy: 0.6, body: '#3a0a0e', lit: '#d05038', shadeCol: '#140204', shadeA: 0.5, alpha: 0.8, blur: 1.8, avoid: [sun[0], 60] });
      streaks(c, rnd, 120, '#ffb090', 0.2, 0.18, 40, 0, 330);
    } });
    layers.push({ p: 0.06, draw(c, rnd) {
      const Pz = [];
      Pz.push(rect(120, 226, 720, 80));
      for (let x = 124; x < 836; x += 8) Pz.push(rect(x, 219, 4.2, 7));
      for (const x of [180, 300, 660, 780]) saint(Pz, x, 219, 22, x < 480 ? 1 : 2);
      const ds = []; for (const [x, w, h] of [[310, 74, 160], [480, 110, 220], [650, 74, 160]]) ds.push([x, w, h, dome(Pz, x, 226, w, h)]);
      for (const x of [150, 400, 560, 810]) belfry(Pz, x, 228, 22, 134, { roof: 'bulb' });
      paint(c, Pz, { col: '#2a0e10', bot: '#4a1a18', y0: 40, y1: 300, rim: '#ffc070', rx: 0.2, ry: 1.1, shade: lightIn(sun[0], sun[1], 240, '#7a3a20', 0.4) });
      rep(c, (q) => {
        for (const [x, w, h, d] of ds) {
          const dh = h * 0.26, b = 226 - dh - 2; q.strokeStyle = 'rgba(230,170,80,0.5)'; q.lineWidth = 1;
          for (let i = -2; i <= 2; i++) { q.beginPath(); q.moveTo(x + i * w * 0.2, b); q.quadraticCurveTo(x + i * w * 0.16, b - h * 0.36, x, b - h * 0.36); q.stroke(); }
          for (const [wx, wy, ww, wh] of d.wins) { q.fillStyle = 'rgba(255,170,80,0.8)'; q.beginPath(); archP(q, wx, wy + wh, Math.max(2.4, ww * 0.7), wh * 0.9); q.fill(); }
        }
        for (let x = 140; x < 830; x += 26) { q.fillStyle = 'rgba(255,150,70,0.7)'; q.beginPath(); archP(q, x, 290, 7, 16); q.fill(); }
      });
      horizon(c, 220, 360, '#6a1812', 0.5);
    } });
    layers.push({ p: 0.2, draw(c, rnd) {
      const A = [];
      A.push(rect(-4, 200, LW + 8, 170), rect(-4, 192, LW + 8, 10));
      for (let i = 0; i < 8; i++) A.push(archHole((i + 0.5) * LW / 8, 370, 74, 150));
      const K = []; king(K, 240, 196, 110, 1); king(K, 720, 196, 110, -1);
      const Bn = []; for (let i = 0; i < 8; i++) { const x = (i + 0.5) * LW / 8, p = P(); p.moveTo(x - 12, 212); p.lineTo(x + 12, 212); p.lineTo(x + 12, 268); p.lineTo(x, 258); p.lineTo(x - 12, 268); p.closePath(); if (i % 2) Bn.push(p); }
      paint(c, A, { col: '#200a0c', bot: '#140608', y0: 190, y1: 362, rim: '#ffa060', shade: mottle(rnd, 40, 190, 362, ['#301214', '#0e0406'], 0.45) });
      paint(c, Bn, { col: '#5a1014', rim: '#ff8060', rimA: 0.6 });
      rep(c, (q) => { for (let i = 1; i < 8; i += 2) { const x = (i + 0.5) * LW / 8; q.fillStyle = '#c89040'; q.beginPath(); q.arc(x, 232, 4, 0, TAU); q.fill(); } });
      paint(c, K, { col: '#2a1612', bot: '#1a0c0a', y0: 60, y1: 200, rim: '#ffc080' });
    } });
    layers[1].anim = (c, t) => {
      aglow(c, sun[0], sun[1], 90, '#ffb070', 0.18 + 0.08 * Math.sin(t * 0.9));
      c.strokeStyle = 'rgba(255,180,140,0.22)'; c.lineWidth = 0.8; c.beginPath();
      for (const [x0, y0, len, sp] of ash) { const x = ((x0 + t * sp) % (LW + 80)) - 40, y = y0 + ((t * sp * 0.18) % 40); c.moveTo(x, y); c.lineTo(x + len, y + len * 0.18); }
      c.stroke();
    };
  });
})(window.VS);
