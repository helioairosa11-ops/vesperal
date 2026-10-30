// Vesperal — desenho de objetos do mundo
'use strict';
(function (VS) {
  const U = VS.U, T = U.TILE;
  const SO = {};
  const glow = (...a) => VS.Sprites.glow(...a);

  const atlas = (...a) => VS.Deco && VS.Deco.atlas(...a);
  SO.altar = function (ctx, a) {
    const x = a.cx, y = a.bottom, lit = a.lit, t = a.t;
    if (atlas(ctx, 'altar', 0, x, y, { time: t, seed: 0.3, unlit: !lit, flameK: lit ? 1 : 0 })) {
      if (lit) { ctx.fillStyle = '#fff0c0'; ctx.beginPath(); ctx.ellipse(x, y - 27, 2.2, 3.6 + Math.sin(t * 9) * 0.5, 0, 0, U.TAU); ctx.fill(); glow(ctx, x, y - 28, 30, '#ff9030', 0.55); }
      else { ctx.fillStyle = '#ff6020'; ctx.globalAlpha = 0.45 + Math.sin(t * 2) * 0.2; ctx.beginPath(); ctx.arc(x, y - 24.6, 1.3, 0, U.TAU); ctx.fill(); ctx.globalAlpha = 1; }
      return;
    }
    // degraus e pedestal
    ctx.fillStyle = '#1c1816'; ctx.fillRect(x - 16, y - 4, 32, 4); ctx.fillRect(x - 12, y - 8, 24, 4);
    ctx.fillStyle = '#2c2622'; ctx.beginPath(); ctx.moveTo(x - 7, y - 8); ctx.lineTo(x - 5, y - 20); ctx.lineTo(x + 5, y - 20); ctx.lineTo(x + 7, y - 8); ctx.fill();
    ctx.fillStyle = '#4a3e34'; ctx.fillRect(x - 5, y - 20, 1, 12);
    // taça
    ctx.fillStyle = '#3a2e26'; ctx.beginPath(); ctx.moveTo(x - 10, y - 22); ctx.quadraticCurveTo(x, y - 16, x + 10, y - 22); ctx.lineTo(x + 8, y - 24); ctx.lineTo(x - 8, y - 24); ctx.fill();
    ctx.fillStyle = '#6a5240'; ctx.fillRect(x - 10, y - 24, 20, 1.2);
    if (lit) {
      for (let i = 0; i < 5; i++) {
        const fx = x - 6 + i * 3, h = 9 + Math.sin(t * 9 + i * 1.7) * 3 + (i === 2 ? 5 : 0);
        ctx.fillStyle = i % 2 ? '#ff7020' : '#ffb040';
        ctx.beginPath(); ctx.moveTo(fx - 2.5, y - 24); ctx.quadraticCurveTo(fx - 2, y - 24 - h * 0.6, fx + Math.sin(t * 7 + i) * 1.5, y - 24 - h); ctx.quadraticCurveTo(fx + 2, y - 24 - h * 0.6, fx + 2.5, y - 24); ctx.fill();
      }
      ctx.fillStyle = '#fff0c0'; ctx.beginPath(); ctx.ellipse(x, y - 27, 2.5, 4, 0, 0, U.TAU); ctx.fill();
      glow(ctx, x, y - 28, 30, '#ff9030', 0.6);
    } else {
      ctx.fillStyle = '#2a2420'; ctx.fillRect(x - 7, y - 25, 14, 2);
      ctx.fillStyle = '#ff6020'; ctx.globalAlpha = 0.4 + Math.sin(t * 2) * 0.2; ctx.beginPath(); ctx.arc(x, y - 25, 1.4, 0, U.TAU); ctx.fill(); ctx.globalAlpha = 1;
    }
  };
  SO.shade = function (ctx, s) {
    const x = s.cx, y = s.bottom, t = s.t;
    ctx.globalAlpha = 0.55 + Math.sin(t * 3) * 0.1;
    ctx.fillStyle = '#5a50a0';
    ctx.beginPath(); ctx.moveTo(x - 7, y); ctx.quadraticCurveTo(x - 9, y - 16, x - 4, y - 24); ctx.quadraticCurveTo(x, y - 30, x + 4, y - 24); ctx.quadraticCurveTo(x + 9, y - 16, x + 7, y);
    for (let i = 0; i < 4; i++) ctx.lineTo(x + 7 - i * 4.6, y - 3 + Math.sin(t * 5 + i) * 2);
    ctx.fill();
    ctx.fillStyle = '#e8e0ff'; ctx.beginPath(); ctx.ellipse(x + 1, y - 22, 2.5, 3.2, 0, 0, U.TAU); ctx.fill();
    ctx.globalAlpha = 1;
    glow(ctx, x, y - 14, 22, '#8070ff', 0.4);
  };
  SO.pickup = function (ctx, p) {
    const x = p.cx, y = p.cy + Math.sin(p.t * 2.5) * 2;
    glow(ctx, x, y, 16, p.letter ? '#ffe0b0' : '#ffd8a0', 0.7);
    if (p.letter) { ctx.save(); ctx.translate(x, y); ctx.rotate(Math.sin(p.t) * 0.1); ctx.fillStyle = '#e8dcc0'; ctx.fillRect(-5, -3.5, 10, 7); ctx.strokeStyle = '#8a6a50'; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.moveTo(-5, -3.5); ctx.lineTo(0, 0.5); ctx.lineTo(5, -3.5); ctx.stroke(); ctx.fillStyle = '#8a1a1a'; ctx.beginPath(); ctx.arc(0, 0.5, 1.4, 0, U.TAU); ctx.fill(); ctx.restore(); }
    else { ctx.fillStyle = '#fff6e0'; ctx.beginPath(); ctx.arc(x, y, 2.4, 0, U.TAU); ctx.fill(); for (let i = 0; i < 4; i++) { const a = p.t * 1.5 + i * Math.PI / 2; ctx.fillRect(x + Math.cos(a) * 5 - 0.5, y + Math.sin(a) * 5 - 0.5, 1, 1); } }
  };
  SO.urn = function (ctx, u, R) {
    const x = u.cx, y = u.bottom;
    if (atlas(ctx, 'urn', 0, x, y, { still: true, flip: (u.x | 0) % 2 === 1 })) return;
    ctx.fillStyle = U.mix(R.stoneDark, '#4a3a2e', 0.6);
    ctx.beginPath(); ctx.moveTo(x - 4, y); ctx.quadraticCurveTo(x - 9, y - 8, x - 4, y - 13); ctx.lineTo(x - 3, y - 16); ctx.lineTo(x + 3, y - 16); ctx.lineTo(x + 4, y - 13); ctx.quadraticCurveTo(x + 9, y - 8, x + 4, y); ctx.fill();
    ctx.strokeStyle = U.rgba(R.topAccent, 0.4); ctx.lineWidth = 0.6; ctx.beginPath(); ctx.moveTo(x - 6, y - 8); ctx.lineTo(x + 6, y - 8); ctx.stroke();
  };
  SO.inscription = function (ctx, ins, R, read) {
    const x = ins.cx, y = ins.bottom;
    if (atlas(ctx, 'inscription', 0, x, y, { still: true })) {
      // runas gravadas: brilham enquanto não foram lidas
      const a = read ? 0.3 : 0.75 + Math.sin(ins.t * 2) * 0.2;
      ctx.save(); ctx.strokeStyle = read ? U.rgba('#9aa4c0', a) : U.rgba('#b8ccff', a); ctx.lineWidth = 0.65; ctx.lineCap = 'round';
      const seed = (ins.iid || 'x').charCodeAt((ins.iid || 'x').length - 1);
      for (let r = 0; r < 4; r++) { const yy = y - 18.4 + r * 3.1; let xx = x - 4.2; ctx.beginPath(); for (let g = 0; g < 4; g++) { const k = (seed * 7 + r * 5 + g * 3) % 4, w = 1.6; if (k === 0) { ctx.moveTo(xx, yy - 1); ctx.lineTo(xx + w, yy + 1); } else if (k === 1) { ctx.moveTo(xx, yy + 1); ctx.lineTo(xx + w / 2, yy - 1); ctx.lineTo(xx + w, yy + 1); } else if (k === 2) { ctx.moveTo(xx + w / 2, yy - 1); ctx.lineTo(xx + w / 2, yy + 1); ctx.moveTo(xx, yy); ctx.lineTo(xx + w, yy); } else { ctx.moveTo(xx, yy - 1); ctx.lineTo(xx, yy + 1); ctx.lineTo(xx + w, yy + 1); } xx += 2.2; } ctx.stroke(); }
      ctx.restore();
      if (!read) glow(ctx, x, y - 14, 16, '#8aa8ff', 0.22 + Math.sin(ins.t * 2) * 0.06);
      return;
    }
    ctx.fillStyle = U.mix(R.stoneDark, R.stone, 0.7);
    ctx.beginPath(); ctx.moveTo(x - 10, y); ctx.lineTo(x - 9, y - 16); ctx.quadraticCurveTo(x, y - 24, x + 9, y - 16); ctx.lineTo(x + 10, y); ctx.fill();
    ctx.strokeStyle = U.rgba(R.stoneLight, 0.5); ctx.lineWidth = 0.6; ctx.stroke();
    ctx.strokeStyle = read ? U.rgba('#c0c8e0', 0.35) : U.rgba('#b0c8ff', 0.8 + Math.sin(ins.t * 2) * 0.2); ctx.lineWidth = 0.7;
    for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(x - 6, y - 15 + i * 3.5); ctx.lineTo(x + 6 - (i % 2) * 3, y - 15 + i * 3.5); ctx.stroke(); }
  };
  // PORTÃO DO PALÁCIO (a entrada da área final): arco ogival alto entre duas colunas, portas duplas de ébano com ouro
  // e um sol em chama ao centro, cinco engastes de brasa à volta do arco (acendem-se com as brasas que já tens),
  // a coroa na pedra de fecho e dois braseiros. Abre-se a deslizar para os lados.
  SO.palaceGate = function (ctx, d, R) {
    const t = d.t || 0, k = d.anim, gx0 = d.x - T, gx1 = d.x + T, cx = (gx0 + gx1) / 2, fl = d.y + d.h;
    const ys = fl - 92, ya = fl - 138, embers = Math.min(5, (VS.state && VS.state.embers) || 0), full = embers >= 5;
    const arch = (q, x0, x1, y0, yA) => { const m = (x0 + x1) / 2; q.moveTo(x0, fl); q.lineTo(x0, y0); q.quadraticCurveTo(x0, yA + (y0 - yA) * 0.25, m, yA); q.quadraticCurveTo(x1, yA + (y0 - yA) * 0.25, x1, y0); q.lineTo(x1, fl); q.closePath(); };
    ctx.save();
    // recesso escuro dentro do arco
    let p = new Path2D(); arch(p, gx0, gx1, ys, ya);
    const rg = ctx.createLinearGradient(0, ya, 0, fl); rg.addColorStop(0, '#07050a'); rg.addColorStop(1, '#140c10');
    ctx.fillStyle = rg; ctx.fill(p);
    // portas duplas: deslizam para os lados (recortadas pelo arco)
    ctx.save(); ctx.clip(p);
    const off = k * (T + 2);
    for (const [lx, sgn] of [[gx0 - off, -1], [cx + off, 1]]) {
      const w = T, x = lx;
      const wg = ctx.createLinearGradient(x, 0, x + w, 0); wg.addColorStop(0, '#24161a'); wg.addColorStop(0.5, '#33202a'); wg.addColorStop(1, '#1a1014');
      ctx.fillStyle = wg; ctx.fillRect(x, ya, w, fl - ya);
      ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = 0.7; for (let i = 1; i < 4; i++) { ctx.beginPath(); ctx.moveTo(x + i * w / 4, ya); ctx.lineTo(x + i * w / 4, fl); ctx.stroke(); }
      // cintas e cravos de ouro
      for (const by of [fl - 18, fl - 52, ys + 4]) { ctx.fillStyle = '#7a5a28'; ctx.fillRect(x, by, w, 3); ctx.fillStyle = '#e8c070'; ctx.fillRect(x, by, w, 0.8); for (let i = 2; i < w; i += 6) { ctx.fillStyle = '#f0d898'; ctx.beginPath(); ctx.arc(x + i + 1, by + 1.6, 0.8, 0, U.TAU); ctx.fill(); } }
      // meia-lua do sol em chama, partida ao meio entre as duas folhas
      const ex = sgn < 0 ? x + w : x, ey = fl - 70;
      ctx.save(); ctx.beginPath(); ctx.rect(x, ey - 16, w, 32); ctx.clip();
      ctx.fillStyle = '#5a3c18'; ctx.beginPath(); ctx.arc(ex, ey, 11, 0, U.TAU); ctx.fill();
      ctx.fillStyle = full ? '#ffcf70' : '#c8983a'; ctx.beginPath(); ctx.arc(ex, ey, 8.5, 0, U.TAU); ctx.fill();
      for (let i = 0; i < 12; i++) { const a = i / 12 * U.TAU; ctx.strokeStyle = '#e8c070'; ctx.lineWidth = 1.1; ctx.beginPath(); ctx.moveTo(ex + Math.cos(a) * 9.5, ey + Math.sin(a) * 9.5); ctx.lineTo(ex + Math.cos(a) * 14, ey + Math.sin(a) * 14); ctx.stroke(); }
      ctx.fillStyle = '#7a2a14'; ctx.beginPath(); ctx.moveTo(ex - 3.4, ey + 4); ctx.quadraticCurveTo(ex - 4, ey - 2, ex, ey - 7); ctx.quadraticCurveTo(ex + 4, ey - 2, ex + 3.4, ey + 4); ctx.closePath(); ctx.fill();
      ctx.restore();
      // argola
      ctx.strokeStyle = '#d0a850'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(sgn < 0 ? x + w - 5 : x + 5, fl - 38, 3, 0, U.TAU); ctx.stroke();
    }
    if (k > 0.02) { ctx.fillStyle = `rgba(255,200,120,${0.12 * k})`; ctx.fillRect(cx - off, ya, off * 2, fl - ya); }
    ctx.restore();
    // aduelas do arco (anel entre o arco de fora e o de dentro) com friso de ouro
    const inner = new Path2D(); arch(inner, gx0, gx1, ys, ya);
    const ring = new Path2D(); arch(ring, gx0 - 8, gx1 + 8, ys - 2, ya - 14); arch(ring, gx0, gx1, ys, ya);
    const fg = ctx.createLinearGradient(gx0 - 8, 0, gx1 + 8, 0); fg.addColorStop(0, '#2a2430'); fg.addColorStop(0.5, '#4a4252'); fg.addColorStop(1, '#2a2430');
    ctx.fillStyle = fg; ctx.fill(ring, 'evenodd');
    ctx.strokeStyle = '#c8a050'; ctx.lineWidth = 1.4; ctx.stroke(inner);
    ctx.strokeStyle = 'rgba(255,230,170,0.5)'; ctx.lineWidth = 0.6; const outer = new Path2D(); arch(outer, gx0 - 7.5, gx1 + 7.5, ys - 2, ya - 13); ctx.stroke(outer);
    // juntas das aduelas
    ctx.strokeStyle = 'rgba(10,8,12,0.6)'; ctx.lineWidth = 0.6;
    for (let i = 1; i < 10; i++) { const u = i / 10, a = Math.PI * (1 - u); const rx = (gx1 - gx0) / 2 + 4, ry = (ys - ya) + 6; ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * (rx - 4), ys - Math.sin(a) * (ry - 6)); ctx.lineTo(cx + Math.cos(a) * (rx + 4), ys - Math.sin(a) * (ry + 4)); ctx.stroke(); }
    // colunas com capitel e base, anéis de ouro
    for (const px of [gx0 - 18, gx1 + 6]) {
      const cg = ctx.createLinearGradient(px, 0, px + 12, 0); cg.addColorStop(0, '#2a2430'); cg.addColorStop(0.45, '#57505e'); cg.addColorStop(1, '#221c26');
      ctx.fillStyle = cg; ctx.fillRect(px, ys - 30, 12, fl - (ys - 30));
      ctx.fillStyle = '#3a3440'; ctx.fillRect(px - 3, ys - 36, 18, 7); ctx.fillRect(px - 3, fl - 8, 18, 8);
      ctx.fillStyle = '#c8a050'; ctx.fillRect(px - 3, ys - 36, 18, 1.2); ctx.fillRect(px, ys - 12, 12, 1.6); ctx.fillRect(px, fl - 40, 12, 1.6);
      ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 0.6; for (let i = 3; i < 12; i += 3) { ctx.beginPath(); ctx.moveTo(px + i, ys - 29); ctx.lineTo(px + i, fl - 8); ctx.stroke(); }
      // braseiro aos pés da coluna
      const bx = px + 6 + (px < cx ? -16 : 16), by = fl;
      ctx.fillStyle = '#1e1a1e'; ctx.beginPath(); ctx.moveTo(bx - 5, by); ctx.lineTo(bx - 2, by - 9); ctx.lineTo(bx + 2, by - 9); ctx.lineTo(bx + 5, by); ctx.fill();
      ctx.fillStyle = '#3a3036'; ctx.beginPath(); ctx.ellipse(bx, by - 10, 7, 2.6, 0, 0, U.TAU); ctx.fill();
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 4; i++) { const ph = t * 9 + i * 1.7 + bx, h = 9 + 5 * Math.abs(Math.sin(ph)); ctx.fillStyle = i === 0 ? 'rgba(255,240,200,0.9)' : 'rgba(255,140,50,0.7)'; ctx.beginPath(); ctx.moveTo(bx - 4 + i, by - 11); ctx.quadraticCurveTo(bx - 3 + i + Math.sin(ph) * 2, by - 11 - h * 0.6, bx - 1 + i * 0.6, by - 11 - h); ctx.quadraticCurveTo(bx + 2, by - 11 - h * 0.5, bx + 4 - i, by - 11); ctx.closePath(); ctx.fill(); }
      glow(ctx, bx, by - 16, 22, '#ff8030', 0.5);
      ctx.restore();
    }
    // engastes de brasa à volta do arco (acendem-se com as brasas recolhidas)
    for (let i = 0; i < 5; i++) {
      const a = Math.PI * (0.88 - i * 0.19), rx = (gx1 - gx0) / 2 + 4, ry = (ys - ya) + 7;
      const ex = cx + Math.cos(a) * rx, ey = ys - Math.sin(a) * ry, lit = i < embers;
      ctx.fillStyle = '#1a1216'; ctx.beginPath(); ctx.arc(ex, ey, 3.4, 0, U.TAU); ctx.fill();
      ctx.fillStyle = '#c8a050'; ctx.lineWidth = 0.8; ctx.strokeStyle = '#c8a050'; ctx.stroke();
      ctx.fillStyle = lit ? '#ffb050' : '#4a1c18'; ctx.beginPath(); ctx.arc(ex, ey, 2.3, 0, U.TAU); ctx.fill();
      if (lit) glow(ctx, ex, ey, 9 + Math.sin(t * 4 + i) * 1.2, '#ff9030', 0.7);
    }
    // pedra de fecho com a coroa (arde quando as cinco brasas estão no lugar)
    const kx = cx, ky = ya - 14;
    ctx.fillStyle = '#3a3440'; ctx.beginPath(); ctx.moveTo(kx - 6, ky + 10); ctx.lineTo(kx - 8, ky - 4); ctx.lineTo(kx + 8, ky - 4); ctx.lineTo(kx + 6, ky + 10); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#d8b060'; ctx.beginPath(); ctx.moveTo(kx - 7, ky - 4); ctx.lineTo(kx - 7, ky - 11); ctx.lineTo(kx - 3.5, ky - 7); ctx.lineTo(kx, ky - 13); ctx.lineTo(kx + 3.5, ky - 7); ctx.lineTo(kx + 7, ky - 11); ctx.lineTo(kx + 7, ky - 4); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#fff0c0'; for (const q of [-7, 0, 7]) { ctx.beginPath(); ctx.arc(kx + q, ky + (q ? -11 : -13), 1, 0, U.TAU); ctx.fill(); }
    if (full) { glow(ctx, kx, ky - 8, 24 + Math.sin(t * 3) * 3, '#ffc060', 0.7); }
    ctx.restore();
  };
  SO.door = function (ctx, d, R) {
    if (d.style === 'palace') return SO.palaceGate(ctx, d, R);
    if (d.horizontal) { // alçapão horizontal: desliza para o lado
      const k = d.anim, w = d.w, off = k * (w - 4);
      ctx.save(); ctx.beginPath(); ctx.rect(d.x, d.y - 2, w, d.h + 4); ctx.clip();
      ctx.fillStyle = '#1a1618'; ctx.fillRect(d.x + off, d.y, w, 6);
      ctx.fillStyle = U.rgba(R.rim, 0.5); for (let i = 2; i < w; i += 5) ctx.fillRect(d.x + off + i, d.y, 1.4, 6);
      ctx.restore(); return;
    }
    const x = d.x, y = d.y, h = d.h, k = d.anim;
    const off = k * (h - 6);
    ctx.save(); ctx.beginPath(); ctx.rect(x - 4, y, T + 8, h); ctx.clip();
    if (d.style === 'veil') {
      if (k < 1) { ctx.globalAlpha = 1 - k; ctx.fillStyle = 'rgba(150,100,255,0.5)'; ctx.fillRect(x + 2, y, T - 4, h); ctx.globalAlpha = 1; }
    } else {
      const yy = y - off;
      // grade de ferro
      ctx.fillStyle = '#1a1618';
      for (let i = 0; i < 4; i++) { ctx.fillRect(x + 2 + i * 5, yy, 2.4, h); ctx.beginPath(); ctx.moveTo(x + 1 + i * 5, yy + h); ctx.lineTo(x + 3.2 + i * 5, yy + h + 4); ctx.lineTo(x + 5.4 + i * 5, yy + h); ctx.fill(); }
      ctx.fillRect(x, yy + 6, T, 2.5); ctx.fillRect(x, yy + h / 2, T, 2.5);
      ctx.fillStyle = U.rgba(R.rim, 0.4); for (let i = 0; i < 4; i++) ctx.fillRect(x + 2 + i * 5, yy, 0.8, h);
      if (/^embers/.test(d.open) && k < 0.5) { for (let i = 0; i < 6; i++) { const lit = i < VS.state.embers; ctx.fillStyle = lit ? '#ffa040' : '#3a2a2a'; ctx.beginPath(); ctx.arc(x + T / 2, yy + 12 + i * (h - 20) / 6, 2.2, 0, U.TAU); ctx.fill(); if (lit) glow(ctx, x + T / 2, yy + 12 + i * (h - 20) / 6, 8, '#ff9030', 0.6); } }
      if (/^key:/.test(d.open) && k < 0.5) { ctx.fillStyle = '#8a7040'; ctx.fillRect(x + T / 2 - 3, yy + h / 2 + 4, 6, 7); ctx.fillStyle = '#000'; ctx.fillRect(x + T / 2 - 0.7, yy + h / 2 + 6, 1.4, 3); }
    }
    ctx.restore();
    // ombreiras
    ctx.fillStyle = R.stoneDark; ctx.fillRect(x - 3, y - 4, T + 6, 5);
  };
  SO.lever = function (ctx, l, R) {
    const x = l.cx, y = l.bottom;
    if (VS.PROP_META && VS.Assets.ok(VS.Assets.img('props/props.png'))) {
      ctx.save(); ctx.translate(x, y - 4); ctx.rotate(U.lerp(-0.7, 0.7, l.ang)); atlas(ctx, 'lever_arm', 0, 0, 0, { still: true }); ctx.restore();
      atlas(ctx, 'lever', 0, x, y, { still: true });
      if (!l.pulled) glow(ctx, x, y - 16, 10, '#ffd080', 0.3);
      return;
    }
    ctx.fillStyle = '#1e1a1c'; ctx.fillRect(x - 6, y - 5, 12, 5);
    const a = U.lerp(-0.7, 0.7, l.ang);
    ctx.save(); ctx.translate(x, y - 4); ctx.rotate(a);
    ctx.fillStyle = '#3a3034'; ctx.fillRect(-1.2, -14, 2.4, 14);
    ctx.fillStyle = l.pulled ? '#6a5a4a' : '#c0a060'; ctx.beginPath(); ctx.arc(0, -14, 2.6, 0, U.TAU); ctx.fill();
    ctx.restore();
    if (!l.pulled) glow(ctx, x, y - 16, 10, '#ffd080', 0.3);
  };
  // plataforma móvel: corre num carril preso ao teto, pendurada de duas correntes (nunca solta no ar)
  function platformRail(p, room) {
    const x0 = Math.min(p.ax, p.bx), x1 = Math.max(p.ax, p.bx) + p.w, yTop = Math.min(p.ay, p.by);
    const cols = []; let lowest = -Infinity;
    for (let x = x0 + 4; x <= x1 - 4; x += T) {
      let y = yTop - 2, n = 0;
      while (n < 50 && !room.solidAtPoint(x, y)) { y -= T / 2; n++; }
      if (n >= 50) continue;
      const cy = (Math.floor(y / T) + 1) * T;
      cols.push({ x, cy }); lowest = Math.max(lowest, cy);
    }
    if (!cols.length) return null;
    const ry = lowest + 1, rods = [];
    cols.forEach((c, i) => { if (i % 3 === 0 && c.cy < ry - 1) rods.push({ x: c.x, y0: c.cy }); });
    return { x0: x0 - 6, x1: x1 + 6, y: ry, rods };
  }
  function chainV(ctx, x, y0, y1) {
    const n = Math.max(1, Math.floor((y1 - y0) / 4));
    ctx.lineWidth = 1;
    for (let j = 0; j < n; j++) {
      const yy = y1 - 2.2 - j * 4;
      ctx.strokeStyle = '#3a3238'; ctx.beginPath(); ctx.ellipse(x, yy, j % 2 ? 0.55 : 1.5, 2.4, 0, 0, U.TAU); ctx.stroke();
    }
  }
  SO.platform = function (ctx, p, R, room) {
    const x = p.x, y = p.y, w = p.w;
    if (p.rail === undefined) p.rail = room ? platformRail(p, room) : null;
    const rl = p.rail;
    if (rl) {
      ctx.fillStyle = '#1e1a1c'; ctx.fillRect(rl.x0, rl.y, rl.x1 - rl.x0, 3.2); ctx.fillStyle = '#5a5058'; ctx.fillRect(rl.x0, rl.y, rl.x1 - rl.x0, 0.8);
      ctx.fillStyle = '#1e1a1c'; for (const r of rl.rods) ctx.fillRect(r.x - 0.9, r.y0, 1.8, rl.y - r.y0);
      for (const cx of [x + 6, x + w - 6]) {
        ctx.fillStyle = '#2a2426'; ctx.fillRect(cx - 4.5, rl.y + 2.6, 9, 3.2);
        ctx.fillStyle = '#4e464c'; ctx.beginPath(); ctx.arc(cx - 2.6, rl.y + 1.6, 1.7, 0, U.TAU); ctx.arc(cx + 2.6, rl.y + 1.6, 1.7, 0, U.TAU); ctx.fill();
        chainV(ctx, cx, rl.y + 5.8, y + 1);
      }
    }
    if (R.key === 'r3') {
      ctx.fillStyle = '#2e2420'; ctx.fillRect(x, y, w, 8); ctx.fillStyle = '#8a6a50'; ctx.fillRect(x, y, w, 1.5);
      ctx.strokeStyle = '#141010'; ctx.lineWidth = 0.8; for (let j = x + 3; j < x + w - 1; j += 4) { ctx.beginPath(); ctx.moveTo(j, y + 1.5); ctx.lineTo(j, y + 7); ctx.stroke(); }
      ctx.fillStyle = 'rgba(255,110,40,0.3)'; ctx.fillRect(x + 1, y + 8, w - 2, 1.2);
    } else { ctx.fillStyle = R.stone; ctx.fillRect(x, y, w, 8); ctx.fillStyle = R.topAccent; ctx.fillRect(x, y, w, 1.5); ctx.fillStyle = R.stoneDark; ctx.fillRect(x, y + 6.5, w, 1.5); }
  };
  SO.trap = function (ctx, t, R) {
    if (t.k === 'blade') {
      ctx.strokeStyle = '#1a1416'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(t.px, t.py); ctx.lineTo(t.bx, t.by); ctx.stroke();
      ctx.fillStyle = '#1a1416'; ctx.fillRect(t.px - 5, t.py - 3, 10, 5);
      ctx.save(); ctx.translate(t.bx, t.by); ctx.rotate(-t.ang);
      ctx.fillStyle = '#b8b0b8'; ctx.beginPath(); ctx.moveTo(-15, -2); ctx.quadraticCurveTo(0, 10, 15, -2); ctx.lineTo(0, -4); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 0.5; ctx.beginPath(); ctx.moveTo(-14, 0); ctx.quadraticCurveTo(0, 10, 14, 0); ctx.stroke();
      ctx.restore();
      glow(ctx, t.bx, t.by, 14, '#ff3030', 0.15);
    } else if (t.k === 'vent') {
      ctx.fillStyle = '#1a1210'; ctx.fillRect(t.x + 1, t.y + T - 5, T - 2, 5);
      ctx.fillStyle = t.state === 'idle' ? '#3a1a10' : t.state === 'warn' ? '#ff6020' : '#ffd060';
      for (let i = 0; i < 3; i++) ctx.fillRect(t.x + 4 + i * 5, t.y + T - 4, 2.4, 2);
    } else if (t.k === 'crusher') {
      const hy = t.headY;
      ctx.fillStyle = '#1e1816'; ctx.fillRect(t.cx - 3, t.d.y * T - 400, 6, hy - t.d.y * T + 400);
      ctx.fillStyle = '#2e2622'; ctx.fillRect(t.x - 8, hy, T + 16, 16);
      ctx.fillStyle = '#5a4a40'; ctx.fillRect(t.x - 8, hy, T + 16, 2);
      ctx.fillStyle = '#1a1210'; for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.moveTo(t.x - 8 + i * 7.2, hy + 16); ctx.lineTo(t.x - 4.4 + i * 7.2, hy + 21); ctx.lineTo(t.x - 0.8 + i * 7.2, hy + 16); ctx.fill(); }
      if (t.k2 === 0) glow(ctx, t.cx, hy + 18, 12, '#ff3020', 0.15);
    } else if (t.k === 'dart') {
      ctx.fillStyle = '#2a2426'; ctx.fillRect(t.x + (t.dir > 0 ? 10 : 0), t.y + 4, 10, 12);
      ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(t.cx + t.dir * 8, t.cy, 2, 0, U.TAU); ctx.fill();
    } else if (t.k === 'beam') {
      const h = t.len * T;
      ctx.fillStyle = '#3a2a40'; ctx.fillRect(t.x, t.y - 4, T, 6);
      if (t.state === 'warn') { ctx.strokeStyle = 'rgba(255,230,160,0.5)'; ctx.setLineDash([3, 4]); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(t.cx, t.y); ctx.lineTo(t.cx, t.y + h); ctx.stroke(); ctx.setLineDash([]); }
      if (t.state === 'fire') { const g = ctx.createLinearGradient(t.x, 0, t.x + T, 0); g.addColorStop(0, 'rgba(255,230,160,0)'); g.addColorStop(0.5, 'rgba(255,250,220,0.9)'); g.addColorStop(1, 'rgba(255,230,160,0)'); ctx.fillStyle = g; ctx.fillRect(t.x, t.y, T, h); }
    }
  };

  VS.SpritesObj = SO;
})(window.VS);
