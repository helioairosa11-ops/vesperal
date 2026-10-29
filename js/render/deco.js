// Vesperal — decoração automática das salas (adereços, paredes de fundo, silhuetas em primeiro plano, luzes)
'use strict';
(function (VS) {
  const U = VS.U, T = U.TILE, G = VS.Gfx;
  const D = {};

  // conjuntos de adereços por região: superfície -> [tipo, probabilidade]
  const SETS = {
    r1: { floor: [['rubble', 0.05], ['grave', 0.03], ['lamppost', 0.018], ['barrel', 0.02], ['candles', 0.012]], ceil: [['chain', 0.04], ['sign', 0.012]], wall: [['window', 0.03], ['sconce', 0.02]] },
    sanct: { floor: [['candles', 0.12], ['statue', 0.02]], ceil: [['banner', 0.05]], wall: [['sconce', 0.04]] },
    r2: { floor: [['crate', 0.03], ['stakes', 0.03], ['brazier', 0.015]], ceil: [['chain', 0.02]], wall: [['sconce', 0.03], ['banner_w', 0.02]] },
    r3: { floor: [['anvil', 0.03], ['crucible', 0.025], ['pipe', 0.03]], ceil: [['chain', 0.06], ['hook', 0.03]], wall: [['vent', 0.04]] },
    r4: { floor: [['reeds', 0.12], ['glowflower', 0.04], ['pot', 0.02]], ceil: [['vine', 0.12], ['lantern', 0.015]], wall: [['glasspane', 0.03]] },
    r5: { floor: [['smallbell', 0.03], ['rope', 0.03], ['candles', 0.01]], ceil: [['rope_h', 0.06], ['smallbell_h', 0.02]], wall: [['sconce', 0.03]] },
    r6: { floor: [['candelabra', 0.03], ['pew', 0.03], ['statue', 0.012], ['candles', 0.04]], ceil: [['censer', 0.02], ['chain', 0.02]], wall: [['stained', 0.04], ['sconce', 0.02]] },
    r7: { floor: [['candelabra', 0.035], ['chair', 0.02], ['rubble', 0.03]], ceil: [['chandelier', 0.015], ['chain', 0.02]], wall: [['sconce', 0.035], ['portrait', 0.02]] },
    crypt: { floor: [['skulls', 0.07], ['coffin', 0.02], ['candles', 0.03]], ceil: [['chain', 0.04], ['roots', 0.05]], wall: [['niche', 0.04]] },
  };
  const LIGHT = { lamppost: ['#ffa050', 90, -26], candles: ['#ffb060', 55, -6], window: ['#ff9040', 45, 0], sconce: ['#ffa050', 75, -2], brazier: ['#ff9040', 100, -12], crucible: ['#ff6010', 90, -8], vent: ['#ff5010', 60, 0], glowflower: ['#a0ffd0', 40, -6], lantern: ['#c8ffb0', 70, 14], candelabra: ['#ffd080', 75, -22], stained: ['#c080ff', 70, 0], chandelier: ['#ffb060', 120, 22] };

  function build(room) {
    const R = room.R, set = SETS[R.key] || SETS.r1;
    const rnd = U.rng(U.hash(room.id + 'deco'));
    const props = [];
    const free = (x, y) => { const c = room.tile(x, y); return c === ' ' || c === '.' || (c >= 'a' && c <= 'z') || c === 'P' || c === 'R'; };
    const solid = (x, y) => { const c = room.tile(x, y); return c === '#' || c === 'C' || c === 'F'; };
    const taken = {};
    const near = (x, y) => { for (let dx = -2; dx <= 2; dx++) if (taken[(x + dx) + ',' + y]) return true; return false; };
    for (let ty = 1; ty < room.h - 1; ty++) for (let tx = 1; tx < room.w - 1; tx++) {
      if (!free(tx, ty)) continue;
      const pickFrom = (list) => { for (const [k, p] of list) if (rnd() < p) return k; return null; };
      if (solid(tx, ty + 1) && free(tx, ty - 1) && !near(tx, ty)) { const k = pickFrom(set.floor); if (k) { props.push({ k, x: tx * T + T / 2, y: (ty + 1) * T, s: rnd() }); taken[tx + ',' + ty] = 1; } }
      else if (solid(tx, ty - 1) && free(tx, ty + 1) && free(tx, ty + 2) && !near(tx, ty)) { const k = pickFrom(set.ceil); if (k) { props.push({ k, x: tx * T + T / 2, y: ty * T, s: rnd(), ceil: true }); taken[tx + ',' + ty] = 1; } }
      else if ((solid(tx - 1, ty) || solid(tx + 1, ty)) && free(tx, ty + 1) && rnd() < 0.5) { const k = pickFrom(set.wall); if (k) { props.push({ k, x: tx * T + T / 2, y: ty * T + T / 2, s: rnd(), side: solid(tx - 1, ty) ? -1 : 1 }); taken[tx + ',' + ty] = 1; } }
    }
    (room.def.props || []).forEach((p) => props.push({ k: p.k, x: p.x * T + T / 2, y: (p.y + 1) * T, s: 0.5, big: true }));
    // silhuetas de primeiro plano
    const front = [];
    const arena = (room.def.ents || []).some((e) => e.t === 'boss');
    const nF = Math.floor(room.w / 18);
    for (let i = 0; i < nF; i++) { const f = { x: rnd() * room.pw, s: rnd(), top: rnd() < 0.35 }; f.arena = arena; front.push(f); }
    // pilares de fundo (interiores)
    const pillars = [];
    for (let x = 60 + rnd() * 80; x < room.pw; x += 140 + rnd() * 120) pillars.push({ x, w: 26 + rnd() * 20 });
    return { props, front, pillars };
  }
  D.get = (room) => room.deco || (room.deco = build(room));

  D.drawBackdrop = function (ctx, room, R, cam) {
    const d = D.get(room);
    const x0 = cam.x - 20, y0 = cam.y - 20, w = U.VIEW_W + 40, h = U.VIEW_H + 40;
    ctx.fillStyle = U.mix(R.stoneDark, R.fog, 0.18); ctx.fillRect(x0, y0, w, h);
    // grandes blocos de pedra
    ctx.strokeStyle = U.rgba('#000000', 0.35); ctx.lineWidth = 1;
    const bh = 30;
    for (let y = Math.floor(y0 / bh) * bh; y < y0 + h; y += bh) {
      ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x0 + w, y); ctx.stroke();
      const off = (Math.floor(y / bh) % 2) * 35;
      for (let x = Math.floor((x0 - off) / 70) * 70 + off; x < x0 + w; x += 70) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + bh); ctx.stroke(); }
    }
    // pilares e arcos de fundo
    for (const p of d.pillars) {
      if (p.x < x0 - 60 || p.x > x0 + w + 60) continue;
      ctx.fillStyle = U.mix(R.stoneDark, '#000000', 0.25); ctx.fillRect(p.x - p.w / 2, y0, p.w, h);
      ctx.fillStyle = U.rgba(R.stoneLight, 0.08); ctx.fillRect(p.x - p.w / 2, y0, 3, h);
    }
    const g = ctx.createLinearGradient(0, cam.y, 0, cam.y + U.VIEW_H);
    g.addColorStop(0, U.rgba(R.fog, 0.12)); g.addColorStop(1, U.rgba('#000000', 0.25));
    ctx.fillStyle = g; ctx.fillRect(x0, y0, w, h);
  };

  D.drawBack = function (ctx, room, R, time) {
    const d = D.get(room);
    for (const p of d.props) {
      if (!G.inView(p.x - 30, p.y - 60, 60, 120, 20)) continue;
      drawProp(ctx, p, R, time);
    }
  };
  D.lights = function (room, R, time) {
    const d = D.get(room);
    for (const p of d.props) {
      const L = LIGHT[p.k]; if (!L) continue;
      G.light(p.x, p.y + L[2], L[1], L[0], 0.85, 1);
    }
  };
  D.drawFront = function (ctx, room, R, cam) {
    const d = D.get(room), par = 1.25;
    const s = G.scale;
    ctx.setTransform(s, 0, 0, s, Math.round((-cam.x * par - cam.sx) * s), Math.round((-cam.y - cam.sy) * s));
    ctx.fillStyle = '#030204';
    for (const f of d.front) {
      const x = f.x * 1.25;
      if (x < cam.x * par - 80 || x > cam.x * par + U.VIEW_W + 80) continue;
      const k = R.key;
      if (f.top) {
        const y = cam.y - 4;
        if (k === 'r4') { ctx.beginPath(); ctx.moveTo(x - 30, y); ctx.quadraticCurveTo(x, y + 50 + f.s * 40, x + 30, y); ctx.fill(); }
        else if (k === 'r3' || k === 'r6' || k === 'crypt') { for (let yy = y; yy < y + 40 + f.s * 60; yy += 6) { ctx.beginPath(); ctx.ellipse(x, yy, 2.5, 3.6, 0, 0, U.TAU); ctx.fill(); } }
      } else {
        const y = Math.min(room.ph, cam.y + U.VIEW_H) + 6;
        if (k === 'r4' || k === 'r1') { for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.moveTo(x + i * 5, y); ctx.quadraticCurveTo(x + i * 5 + 6, y - 30 - f.s * 30, x + i * 5 + 12 + f.s * 6, y - 40 - f.s * 30); ctx.lineTo(x + i * 5 + 4, y); ctx.fill(); } }
        else if (k === 'r6' || k === 'r7' || k === 'sanct') {
          // colunas de primeiro plano: finas, translúcidas e ausentes nas arenas, para nunca esconder a ação
          if (f.arena) continue;
          const w = 12 + f.s * 8;
          ctx.globalAlpha = 0.62; ctx.fillRect(x, cam.y - 10, w, U.VIEW_H + 20);
          ctx.globalAlpha = 0.35; ctx.fillRect(x - 3, cam.y - 10, 3, U.VIEW_H + 20); ctx.fillRect(x + w, cam.y - 10, 3, U.VIEW_H + 20);
          ctx.globalAlpha = 1;
        }
        else if (k === 'r2' || k === 'r5') { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 10, y - 50 - f.s * 30); ctx.lineTo(x + 16, y); ctx.fill(); }
      }
    }
  };

  // ---------- adereços ----------
  function drawProp(ctx, p, R, time) {
    const x = p.x, y = p.y, s = p.s;
    switch (p.k) {
      case 'rubble': ctx.fillStyle = R.stoneDark; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.arc(x - 8 + i * 5 + s * 3, y - 2, 2.5 + ((i * 7 + s * 10) % 3), Math.PI, 0); ctx.fill(); } ctx.fillStyle = U.rgba(R.top, 0.6); ctx.fillRect(x - 9, y - 4, 4, 1); break;
      case 'grave': ctx.fillStyle = U.mix(R.stoneDark, R.stone, 0.6); ctx.beginPath(); ctx.moveTo(x - 6, y); ctx.lineTo(x - 6, y - 14); ctx.quadraticCurveTo(x, y - 20, x + 6, y - 14); ctx.lineTo(x + 6, y); ctx.fill(); ctx.strokeStyle = U.rgba(R.stoneLight, 0.5); ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(x, y - 15); ctx.lineTo(x, y - 7); ctx.moveTo(x - 3, y - 12); ctx.lineTo(x + 3, y - 12); ctx.stroke(); break;
      case 'lamppost': ctx.fillStyle = '#16141a'; ctx.fillRect(x - 1, y - 30, 2, 30); ctx.fillRect(x - 4, y - 2, 8, 2); ctx.fillRect(x - 4, y - 34, 8, 4); ctx.fillStyle = '#ffb060'; ctx.fillRect(x - 2.5, y - 30, 5, 5); break;
      case 'barrel': ctx.fillStyle = '#2a1e16'; ctx.beginPath(); ctx.ellipse(x, y - 7, 5.5, 7, 0, 0, U.TAU); ctx.fill(); ctx.strokeStyle = '#4a3a2a'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(x - 5, y - 10); ctx.lineTo(x + 5, y - 10); ctx.moveTo(x - 5, y - 4); ctx.lineTo(x + 5, y - 4); ctx.stroke(); break;
      case 'candles': for (let i = 0; i < 3; i++) { const cx = x - 5 + i * 4 + s * 2, h = 3 + ((i + Math.floor(s * 5)) % 3) * 2; ctx.fillStyle = '#d8c8a8'; ctx.fillRect(cx, y - h, 2, h); const fl = Math.sin(time * 12 + i * 2 + s * 5) * 0.4; ctx.fillStyle = '#ffd080'; ctx.beginPath(); ctx.ellipse(cx + 1, y - h - 2, 1 + fl * 0.2, 2.2 + fl, 0, 0, U.TAU); ctx.fill(); } break;
      case 'chain': { const len = 20 + s * 40; ctx.strokeStyle = '#141218'; ctx.lineWidth = 1.1; for (let yy = y; yy < y + len; yy += 4.5) { ctx.beginPath(); ctx.ellipse(x + Math.sin(time * 0.8 + s * 6) * (yy - y) * 0.03, yy, 1.4, 2.3, 0, 0, U.TAU); ctx.stroke(); } if (s > 0.6) { ctx.fillStyle = '#141218'; ctx.beginPath(); ctx.arc(x, y + len + 3, 3, 0, U.TAU); ctx.fill(); } break; }
      case 'sign': ctx.strokeStyle = '#141218'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(x - 5, y); ctx.lineTo(x - 5, y + 8); ctx.moveTo(x + 5, y); ctx.lineTo(x + 5, y + 8); ctx.stroke(); ctx.fillStyle = '#2a1e16'; ctx.fillRect(x - 8, y + 8, 16, 9); break;
      case 'window': { const side = p.side; ctx.fillStyle = '#ff9040'; ctx.globalAlpha = 0.55 + Math.sin(time * 3 + s * 9) * 0.1; ctx.beginPath(); ctx.moveTo(x - 4, y + 7); ctx.lineTo(x - 4, y - 3); ctx.quadraticCurveTo(x, y - 9, x + 4, y - 3); ctx.lineTo(x + 4, y + 7); ctx.fill(); ctx.globalAlpha = 1; ctx.strokeStyle = '#141218'; ctx.lineWidth = 1; ctx.stroke(); ctx.beginPath(); ctx.moveTo(x, y - 6); ctx.lineTo(x, y + 7); ctx.moveTo(x - 4, y + 1); ctx.lineTo(x + 4, y + 1); ctx.stroke(); break; }
      case 'sconce': { const sd = p.side || 1; ctx.fillStyle = '#16141a'; ctx.fillRect(x - sd * 8, y, sd * 6, 2); ctx.fillRect(x - sd * 3 - 2, y - 4, 4, 5); const fl = Math.sin(time * 14 + s * 7); ctx.fillStyle = '#ffb050'; ctx.beginPath(); ctx.ellipse(x - sd * 3, y - 7, 1.6, 3.5 + fl * 0.6, 0, 0, U.TAU); ctx.fill(); ctx.fillStyle = '#fff0b0'; ctx.beginPath(); ctx.ellipse(x - sd * 3, y - 6, 0.7, 1.6, 0, 0, U.TAU); ctx.fill(); break; }
      case 'statue': ctx.fillStyle = U.mix(R.stoneDark, R.stone, 0.5); ctx.fillRect(x - 8, y - 6, 16, 6); ctx.beginPath(); ctx.moveTo(x - 5, y - 6); ctx.lineTo(x - 6, y - 30); ctx.quadraticCurveTo(x, y - 44, x + 6, y - 30); ctx.lineTo(x + 5, y - 6); ctx.fill(); ctx.beginPath(); ctx.arc(x, y - 36, 4.5, 0, U.TAU); ctx.fill(); ctx.fillStyle = U.rgba(R.stoneLight, 0.2); ctx.fillRect(x - 5, y - 30, 2, 22); break;
      case 'banner': { ctx.fillStyle = '#4a1418'; const w = 10, h = 26 + s * 14; ctx.beginPath(); ctx.moveTo(x - w / 2, y); ctx.lineTo(x + w / 2, y); ctx.lineTo(x + w / 2 + Math.sin(time + s) * 1, y + h); ctx.lineTo(x, y + h - 5); ctx.lineTo(x - w / 2 + Math.sin(time + s) * 1, y + h); ctx.fill(); ctx.fillStyle = '#c09040'; ctx.beginPath(); ctx.arc(x, y + 10, 2.5, 0, U.TAU); ctx.fill(); break; }
      case 'banner_w': ctx.fillStyle = '#2a1418'; ctx.fillRect(x - 5, y - 10, 10, 22); ctx.fillStyle = '#6a5a3a'; ctx.fillRect(x - 6, y - 11, 12, 2); break;
      case 'crate': ctx.fillStyle = '#2a2018'; ctx.fillRect(x - 7, y - 12, 14, 12); ctx.strokeStyle = '#4a3828'; ctx.lineWidth = 0.8; ctx.strokeRect(x - 7, y - 12, 14, 12); ctx.beginPath(); ctx.moveTo(x - 7, y - 12); ctx.lineTo(x + 7, y); ctx.stroke(); break;
      case 'stakes': ctx.fillStyle = '#2a2018'; for (let i = 0; i < 3; i++) { ctx.save(); ctx.translate(x - 6 + i * 6, y); ctx.rotate(-0.3 + i * 0.3); ctx.beginPath(); ctx.moveTo(-1.5, 0); ctx.lineTo(0, -14); ctx.lineTo(1.5, 0); ctx.fill(); ctx.restore(); } break;
      case 'brazier': ctx.fillStyle = '#16141a'; ctx.beginPath(); ctx.moveTo(x - 8, y - 12); ctx.lineTo(x + 8, y - 12); ctx.lineTo(x + 4, y - 6); ctx.lineTo(x - 4, y - 6); ctx.fill(); ctx.fillRect(x - 1, y - 6, 2, 6); ctx.fillRect(x - 5, y - 1, 10, 1.5); for (let i = 0; i < 3; i++) { ctx.fillStyle = i ? '#ffb040' : '#ff6020'; ctx.beginPath(); ctx.ellipse(x - 3 + i * 3, y - 15 - Math.sin(time * 10 + i) * 1.5, 2, 4, 0, 0, U.TAU); ctx.fill(); } break;
      case 'anvil': ctx.fillStyle = '#1a1416'; ctx.fillRect(x - 3, y - 6, 6, 6); ctx.beginPath(); ctx.moveTo(x - 10, y - 6); ctx.lineTo(x + 8, y - 6); ctx.lineTo(x + 10, y - 10); ctx.lineTo(x - 6, y - 10); ctx.quadraticCurveTo(x - 12, y - 9, x - 10, y - 6); ctx.fill(); break;
      case 'crucible': ctx.fillStyle = '#1a1210'; ctx.beginPath(); ctx.moveTo(x - 8, y - 12); ctx.lineTo(x + 8, y - 12); ctx.lineTo(x + 6, y); ctx.lineTo(x - 6, y); ctx.fill(); ctx.fillStyle = '#ff7020'; ctx.fillRect(x - 7, y - 12, 14, 2.5); ctx.fillStyle = '#ffd060'; ctx.fillRect(x - 4, y - 12, 6, 1); break;
      case 'pipe': ctx.fillStyle = '#2a2220'; ctx.fillRect(x - 3, y - 40, 6, 40); ctx.fillStyle = '#3e322c'; ctx.fillRect(x - 4.5, y - 20, 9, 3); ctx.fillRect(x - 4.5, y - 40, 9, 3); break;
      case 'hook': ctx.strokeStyle = '#16100e'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + 25); ctx.arc(x + 3, y + 25, 3, Math.PI, Math.PI * 0.2, true); ctx.stroke(); break;
      case 'vent': ctx.fillStyle = '#1a1210'; ctx.fillRect(x - 6, y - 5, 12, 10); ctx.fillStyle = '#ff5010'; ctx.globalAlpha = 0.6 + Math.sin(time * 4 + s * 8) * 0.3; for (let i = 0; i < 3; i++) ctx.fillRect(x - 4, y - 3 + i * 3, 8, 1.2); ctx.globalAlpha = 1; break;
      case 'reeds': ctx.strokeStyle = '#1e3a24'; ctx.lineWidth = 0.9; for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.moveTo(x - 6 + i * 3, y); ctx.quadraticCurveTo(x - 6 + i * 3 + Math.sin(time * 1.5 + i + s * 6) * 2, y - 8, x - 6 + i * 3 + Math.sin(time * 1.5 + i + s * 6) * 4, y - 12 - (i % 3) * 3); ctx.stroke(); } break;
      case 'glowflower': ctx.strokeStyle = '#1e3a24'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + 2, y - 6, x, y - 10); ctx.stroke(); ctx.fillStyle = '#b0ffd8'; ctx.beginPath(); ctx.arc(x, y - 11, 2.2 + Math.sin(time * 2 + s * 4) * 0.3, 0, U.TAU); ctx.fill(); break;
      case 'pot': ctx.fillStyle = '#3a2a22'; ctx.beginPath(); ctx.moveTo(x - 4, y); ctx.quadraticCurveTo(x - 8, y - 6, x - 3, y - 10); ctx.lineTo(x + 3, y - 10); ctx.quadraticCurveTo(x + 8, y - 6, x + 4, y); ctx.fill(); break;
      case 'vine': { const len = 20 + s * 50; ctx.strokeStyle = '#1e3a26'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(x, y); ctx.bezierCurveTo(x + Math.sin(time + s * 5) * 4, y + len * 0.3, x - 4, y + len * 0.7, x + Math.sin(time * 0.7 + s * 5) * 3, y + len); ctx.stroke(); ctx.fillStyle = '#2e5a36'; for (let k = 0.2; k < 1; k += 0.25) { ctx.beginPath(); ctx.ellipse(x + 2, y + len * k, 2.5, 1.2, 0.6, 0, U.TAU); ctx.fill(); } break; }
      case 'lantern': ctx.strokeStyle = '#141218'; ctx.lineWidth = 0.7; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + 10); ctx.stroke(); ctx.fillStyle = '#1a2018'; ctx.fillRect(x - 3, y + 10, 6, 7); ctx.fillStyle = '#c8ffb0'; ctx.fillRect(x - 2, y + 11, 4, 5); break;
      case 'glasspane': ctx.strokeStyle = U.rgba('#a0d0c0', 0.25); ctx.lineWidth = 0.8; ctx.strokeRect(x - 6, y - 10, 12, 20); ctx.fillStyle = U.rgba('#a0e0d0', 0.06); ctx.fillRect(x - 6, y - 10, 12, 20); break;
      case 'smallbell': ctx.fillStyle = '#6a5428'; ctx.beginPath(); ctx.moveTo(x - 2, y - 9); ctx.quadraticCurveTo(x - 3, y - 4, x - 5, y); ctx.lineTo(x + 5, y); ctx.quadraticCurveTo(x + 3, y - 4, x + 2, y - 9); ctx.fill(); break;
      case 'smallbell_h': { const sw = Math.sin(time * 1.4 + s * 5) * 0.2; ctx.save(); ctx.translate(x, y); ctx.rotate(sw); ctx.strokeStyle = '#2a2018'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 14); ctx.stroke(); ctx.fillStyle = '#8a6a30'; ctx.beginPath(); ctx.moveTo(-2, 14); ctx.quadraticCurveTo(-3, 19, -5, 23); ctx.lineTo(5, 23); ctx.quadraticCurveTo(3, 19, 2, 14); ctx.fill(); ctx.restore(); break; }
      case 'rope': ctx.strokeStyle = '#4a3a24'; ctx.lineWidth = 1; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.ellipse(x, y - 2 - i * 1.5, 6 - i, 2, 0, 0, U.TAU); ctx.stroke(); } break;
      case 'rope_h': { const len = 30 + s * 60; ctx.strokeStyle = '#3a2c1c'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + Math.sin(time * 0.9 + s * 6) * 5, y + len / 2, x + Math.sin(time * 0.9 + s * 6) * 3, y + len); ctx.stroke(); break; }
      case 'candelabra': ctx.fillStyle = '#2a2018'; ctx.fillRect(x - 1, y - 22, 2, 22); ctx.fillRect(x - 6, y - 2, 12, 2); ctx.fillRect(x - 8, y - 22, 16, 1.6); for (let i = -1; i <= 1; i++) { ctx.fillStyle = '#e8dcc0'; ctx.fillRect(x + i * 7 - 1, y - 27, 2, 5); ctx.fillStyle = '#ffd080'; ctx.beginPath(); ctx.ellipse(x + i * 7, y - 29, 1.1, 2.2 + Math.sin(time * 13 + i) * 0.4, 0, 0, U.TAU); ctx.fill(); } break;
      case 'pew': ctx.fillStyle = '#1e1416'; ctx.fillRect(x - 14, y - 7, 28, 3); ctx.fillRect(x - 14, y - 14, 2.5, 14); ctx.fillRect(x + 11, y - 9, 2.5, 9); break;
      case 'censer': { const sw = Math.sin(time * 1.3 + s * 4) * 0.25; ctx.save(); ctx.translate(x, y); ctx.rotate(sw); ctx.strokeStyle = '#2a2018'; ctx.lineWidth = 0.7; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 28); ctx.stroke(); ctx.fillStyle = '#6a5428'; ctx.beginPath(); ctx.arc(0, 31, 4, 0, U.TAU); ctx.fill(); ctx.restore(); if (Math.random() < 0.05) G.emit({ x: x + Math.sin(sw) * -28, y: y + 32, vx: U.rand(-3, 3), vy: -10, life: 4, size: 6, color: 'rgba(180,160,200,0.08)', kind: 'glow', color2: '#000000' }); break; }
      case 'stained': { const cols = ['#c04060', '#4060c0', '#c0a040', '#8040c0']; ctx.globalAlpha = 0.7; for (let i = 0; i < 4; i++) { ctx.fillStyle = cols[(i + Math.floor(s * 4)) % 4]; ctx.fillRect(x - 5 + (i % 2) * 5, y - 10 + Math.floor(i / 2) * 9, 5, 9); } ctx.globalAlpha = 1; ctx.strokeStyle = '#120a14'; ctx.lineWidth = 1; ctx.strokeRect(x - 5, y - 10, 10, 18); break; }
      case 'chandelier': { ctx.strokeStyle = '#1a1010'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + 16); ctx.stroke(); ctx.fillStyle = '#3a2618'; ctx.beginPath(); ctx.ellipse(x, y + 20, 16, 3, 0, 0, U.TAU); ctx.fill(); for (let i = -2; i <= 2; i++) { ctx.fillStyle = '#ffd080'; ctx.beginPath(); ctx.ellipse(x + i * 7, y + 14, 1.2, 2.4, 0, 0, U.TAU); ctx.fill(); } break; }
      case 'chair': ctx.fillStyle = '#2a1414'; ctx.save(); ctx.translate(x, y); ctx.rotate(s > 0.5 ? 1.2 : 0); ctx.fillRect(-5, -8, 10, 2); ctx.fillRect(-5, -18, 2, 18); ctx.fillRect(3, -8, 2, 8); ctx.restore(); break;
      case 'portrait': ctx.fillStyle = '#5a4020'; ctx.fillRect(x - 8, y - 11, 16, 20); ctx.fillStyle = '#1a0a0c'; ctx.fillRect(x - 6, y - 9, 12, 16); ctx.fillStyle = '#3a1a18'; ctx.beginPath(); ctx.ellipse(x, y - 3, 3, 4, 0, 0, U.TAU); ctx.fill(); ctx.strokeStyle = '#0a0406'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(x - 6, y - 9); ctx.lineTo(x + 3, y + 7); ctx.stroke(); break;
      case 'skulls': ctx.fillStyle = '#8a8270'; for (let i = 0; i < 3; i++) { const sx = x - 5 + i * 5, sy = y - 3 - (i === 1 ? 4 : 0); ctx.beginPath(); ctx.arc(sx, sy, 2.6, 0, U.TAU); ctx.fill(); ctx.fillStyle = '#1a1814'; ctx.fillRect(sx - 1.5, sy - 0.5, 1, 1); ctx.fillRect(sx + 0.5, sy - 0.5, 1, 1); ctx.fillStyle = '#8a8270'; } break;
      case 'coffin': ctx.fillStyle = '#1e1612'; ctx.beginPath(); ctx.moveTo(x - 12, y); ctx.lineTo(x - 14, y - 5); ctx.lineTo(x - 8, y - 8); ctx.lineTo(x + 14, y - 7); ctx.lineTo(x + 14, y); ctx.fill(); break;
      case 'roots': ctx.strokeStyle = '#1a1410'; ctx.lineWidth = 1; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(x - 4 + i * 4, y); ctx.quadraticCurveTo(x + i * 3, y + 8, x - 2 + i * 5, y + 14 + s * 10); ctx.stroke(); } break;
      case 'niche': ctx.fillStyle = '#06060a'; ctx.beginPath(); ctx.moveTo(x - 6, y + 6); ctx.lineTo(x - 6, y - 3); ctx.quadraticCurveTo(x, y - 10, x + 6, y - 3); ctx.lineTo(x + 6, y + 6); ctx.fill(); ctx.fillStyle = '#7a7464'; ctx.beginPath(); ctx.arc(x, y + 2, 3, 0, U.TAU); ctx.fill(); break;
      default: break;
    }
  }
  D.drawProp = drawProp;

  VS.Deco = D;
})(window.VS);
