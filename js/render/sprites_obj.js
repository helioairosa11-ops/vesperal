// Vesperal — desenho de objetos do mundo
'use strict';
(function (VS) {
  const U = VS.U, T = U.TILE;
  const SO = {};
  const glow = (...a) => VS.Sprites.glow(...a);

  SO.altar = function (ctx, a) {
    const x = a.cx, y = a.bottom, lit = a.lit, t = a.t;
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
    ctx.fillStyle = U.mix(R.stoneDark, '#4a3a2e', 0.6);
    ctx.beginPath(); ctx.moveTo(x - 4, y); ctx.quadraticCurveTo(x - 9, y - 8, x - 4, y - 13); ctx.lineTo(x - 3, y - 16); ctx.lineTo(x + 3, y - 16); ctx.lineTo(x + 4, y - 13); ctx.quadraticCurveTo(x + 9, y - 8, x + 4, y); ctx.fill();
    ctx.strokeStyle = U.rgba(R.topAccent, 0.4); ctx.lineWidth = 0.6; ctx.beginPath(); ctx.moveTo(x - 6, y - 8); ctx.lineTo(x + 6, y - 8); ctx.stroke();
  };
  SO.inscription = function (ctx, ins, R, read) {
    const x = ins.cx, y = ins.bottom;
    ctx.fillStyle = U.mix(R.stoneDark, R.stone, 0.7);
    ctx.beginPath(); ctx.moveTo(x - 10, y); ctx.lineTo(x - 9, y - 16); ctx.quadraticCurveTo(x, y - 24, x + 9, y - 16); ctx.lineTo(x + 10, y); ctx.fill();
    ctx.strokeStyle = U.rgba(R.stoneLight, 0.5); ctx.lineWidth = 0.6; ctx.stroke();
    ctx.strokeStyle = read ? U.rgba('#c0c8e0', 0.35) : U.rgba('#b0c8ff', 0.8 + Math.sin(ins.t * 2) * 0.2); ctx.lineWidth = 0.7;
    for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(x - 6, y - 15 + i * 3.5); ctx.lineTo(x + 6 - (i % 2) * 3, y - 15 + i * 3.5); ctx.stroke(); }
  };
  SO.door = function (ctx, d, R) {
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
    ctx.fillStyle = '#1e1a1c'; ctx.fillRect(x - 6, y - 5, 12, 5);
    const a = U.lerp(-0.7, 0.7, l.ang);
    ctx.save(); ctx.translate(x, y - 4); ctx.rotate(a);
    ctx.fillStyle = '#3a3034'; ctx.fillRect(-1.2, -14, 2.4, 14);
    ctx.fillStyle = l.pulled ? '#6a5a4a' : '#c0a060'; ctx.beginPath(); ctx.arc(0, -14, 2.6, 0, U.TAU); ctx.fill();
    ctx.restore();
    if (!l.pulled) glow(ctx, x, y - 16, 10, '#ffd080', 0.3);
  };
  SO.platform = function (ctx, p, R) {
    const x = p.x, y = p.y, w = p.w;
    if (R.key === 'r3') { ctx.fillStyle = '#2e2420'; ctx.fillRect(x, y, w, 8); ctx.fillStyle = '#8a6a50'; ctx.fillRect(x, y, w, 1.5); ctx.strokeStyle = '#141010'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x + 6, y); ctx.lineTo(x + 6, y - 400); ctx.moveTo(x + w - 6, y); ctx.lineTo(x + w - 6, y - 400); ctx.stroke(); }
    else { ctx.fillStyle = R.stone; ctx.fillRect(x, y, w, 8); ctx.fillStyle = R.topAccent; ctx.fillRect(x, y, w, 1.5); ctx.fillStyle = R.stoneDark; ctx.beginPath(); ctx.moveTo(x + 4, y + 8); ctx.lineTo(x + w / 2, y + 16); ctx.lineTo(x + w - 4, y + 8); ctx.fill(); }
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
