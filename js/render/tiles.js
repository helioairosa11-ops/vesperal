// Vesperal — tiles procedimentais: contornos orgânicos coerentes no mundo, rasterizados numa cache por sala
'use strict';
(function (VS) {
  const U = VS.U, T = U.TILE;
  const Tiles = {};

  // ruído 1D suave (valor) — coerente entre tiles vizinhos
  function noise1(x, seed) {
    const i = Math.floor(x), f = x - i;
    const h = (n) => { let v = Math.imul((n + seed * 7919) | 0, 2654435761) ^ (seed * 374761393); v = Math.imul(v ^ (v >>> 13), 1274126177); return ((v ^ (v >>> 16)) >>> 0) / 4294967296; };
    const a = h(i), b = h(i + 1), t = f * f * (3 - 2 * f);
    return a + (b - a) * t;
  }
  const edgeN = (pos, line, kind) => noise1(pos / 6, line * 31 + kind * 977) * 0.65 + noise1(pos / 2.2, line * 17 + kind * 131) * 0.35;

  const STATIC_SOLID = { '#': 1, 'C': 1, 'F': 1 };

  function isSolidStatic(room, tx, ty) {
    const ch = room.tile(tx, ty);
    if (ch === null) return true;
    if (room.broken[tx + ',' + ty]) return false;
    return !!STATIC_SOLID[ch];
  }

  Tiles.invalidate = function (room) { room.tileCache = null; };

  Tiles.build = function (room) {
    const R = room.R;
    let s = Math.min(2.5, Math.max(1, VS.Gfx.scale));
    s = Math.min(s, 4096 / room.pw, 4096 / room.ph);
    const can = document.createElement('canvas');
    can.width = Math.ceil(room.pw * s); can.height = Math.ceil(room.ph * s);
    const c = can.getContext('2d');
    c.scale(s, s);
    const W = room.w, H = room.h;
    const S = (x, y) => isSolidStatic(room, x, y);
    // 1) massa escura
    c.fillStyle = R.stoneDark;
    for (let ty = 0; ty < H; ty++) {
      let run = -1;
      for (let tx = 0; tx <= W; tx++) {
        const sol = tx < W && S(tx, ty) && room.tile(tx, ty) !== null;
        if (sol && run < 0) run = tx;
        if (!sol && run >= 0) { c.fillRect(run * T, ty * T, (tx - run) * T + 0.5, T + 0.5); run = -1; }
      }
    }
    // 2) textura interior subtil
    const rnd = U.rng(U.hash(room.id + 'tex'));
    for (let ty = 0; ty < H; ty++) for (let tx = 0; tx < W; tx++) {
      if (!S(tx, ty)) continue;
      if (rnd() < 0.5) { c.fillStyle = U.rgba(R.stone, 0.12 + rnd() * 0.12); c.fillRect(tx * T + rnd() * T, ty * T + rnd() * T, 1 + rnd() * 3, 0.6 + rnd()); }
    }
    // 3) faces expostas: bandas iluminadas, blocos, contorno irregular
    for (let ty = 0; ty < H; ty++) for (let tx = 0; tx < W; tx++) {
      if (!S(tx, ty)) continue;
      const up = !S(tx, ty - 1), down = !S(tx, ty + 1), left = !S(tx - 1, ty), right = !S(tx + 1, ty);
      if (!(up || down || left || right)) continue;
      const x = tx * T, y = ty * T;
      const ch = room.tile(tx, ty);
      if (up) { const g = c.createLinearGradient(0, y, 0, y + 13); g.addColorStop(0, R.stone); g.addColorStop(1, U.rgba(R.stone, 0)); c.fillStyle = g; c.fillRect(x, y, T, 13); }
      if (left) { const g = c.createLinearGradient(x, 0, x + 8, 0); g.addColorStop(0, U.mix(R.stone, R.stoneDark, 0.3)); g.addColorStop(1, U.rgba(R.stone, 0)); c.fillStyle = g; c.fillRect(x, y, 8, T); }
      if (right) { const g = c.createLinearGradient(x + T, 0, x + T - 8, 0); g.addColorStop(0, U.mix(R.stone, R.stoneDark, 0.45)); g.addColorStop(1, U.rgba(R.stone, 0)); c.fillStyle = g; c.fillRect(x + T - 8, y, 8, T); }
      if (down) { const g = c.createLinearGradient(0, y + T, 0, y + T - 7); g.addColorStop(0, U.mix(R.stone, '#000000', 0.5)); g.addColorStop(1, U.rgba(R.stone, 0)); c.fillStyle = g; c.fillRect(x, y + T - 7, T, 7); }
      // blocos de pedra (coerentes no mundo: 2 tiles de largura, alternados por fiada)
      c.strokeStyle = U.rgba(R.stoneDark, 0.85); c.lineWidth = 0.7;
      const rows = up ? [y + 9] : [];
      if (left || right || up) {
        const off = (ty % 2) * T;
        for (let bx = Math.floor((x - off) / (2 * T)) * 2 * T + off; bx < x + T; bx += 2 * T) if (bx > x && bx < x + T && (up || left || right)) { c.beginPath(); c.moveTo(bx, y + (up ? 2 : 0)); c.lineTo(bx, y + T); c.stroke(); }
      }
      rows.forEach((ry) => { c.beginPath(); c.moveTo(x, ry); c.lineTo(x + T, ry); c.stroke(); });
      // fissuras ocasionais
      if (rnd() < 0.25) { c.strokeStyle = U.rgba('#000000', 0.45); c.lineWidth = 0.5; c.beginPath(); let fx = x + rnd() * T, fy = y + 2 + rnd() * 6; c.moveTo(fx, fy); for (let i = 0; i < 3; i++) { fx += (rnd() - 0.5) * 7; fy += 2 + rnd() * 4; c.lineTo(fx, fy); } c.stroke(); }
      if (ch === 'C') crackGlow(c, R, x, y, rnd);
      if (ch === 'F') { c.strokeStyle = U.rgba(R.stoneLight, 0.1); c.lineWidth = 0.4; c.beginPath(); c.moveTo(x + 4, y + 6); c.lineTo(x + 9, y + 11); c.lineTo(x + 7, y + 16); c.stroke(); }
    }
    // 4) contornos orgânicos por cima das bandas
    for (let ty = 0; ty < H; ty++) for (let tx = 0; tx < W; tx++) {
      if (!S(tx, ty)) continue;
      const x = tx * T, y = ty * T;
      const up = !S(tx, ty - 1) && room.tile(tx, ty - 1) !== null, down = !S(tx, ty + 1) && room.tile(tx, ty + 1) !== null;
      const left = !S(tx - 1, ty) && room.tile(tx - 1, ty) !== null, right = !S(tx + 1, ty) && room.tile(tx + 1, ty) !== null;
      if (up) topEdge(c, R, x, y, ty, left, right);
      if (left) sideEdge(c, R, x, y, tx, -1, up, down);
      if (right) sideEdge(c, R, x + T, y, tx + 1, 1, up, down);
      if (down) bottomEdge(c, R, x, y + T, ty, rnd);
    }
    // 5) plataformas e picos (estáticos)
    for (let ty = 0; ty < H; ty++) for (let tx = 0; tx < W; tx++) {
      const ch = room.tile(tx, ty);
      if (ch === '=') drawPlatform(c, room, R, tx, ty);
      else if (ch === '^') drawSpike(c, room, R, tx, ty);
    }
    room.tileCache = { canvas: can, s };
    return room.tileCache;
  };

  function topEdge(c, R, x, y, ty, openL, openR) {
    // linha superior irregular (saliente até 2,5 unidades), coerente com os vizinhos
    const pts = [];
    for (let i = 0; i <= 5; i++) { const px = x + i * T / 5; let off = edgeN(px, ty, 1) * 2.6; if (openL && i === 0) off = -1; if (openR && i === 5) off = -1; pts.push([px, y - off]); }
    c.fillStyle = R.stone;
    c.beginPath(); c.moveTo(x, y + 3); pts.forEach((p) => c.lineTo(p[0], p[1])); c.lineTo(x + T, y + 3); c.closePath(); c.fill();
    c.strokeStyle = R.rim; c.lineWidth = 1.2; c.lineJoin = 'round';
    c.beginPath(); pts.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.stroke();
    c.strokeStyle = U.rgba(R.stoneLight, 0.55); c.lineWidth = 0.8;
    c.beginPath(); pts.forEach((p, i) => (i ? c.lineTo(p[0], p[1] + 1.6) : c.moveTo(p[0], p[1] + 1.6))); c.stroke();
    topping(c, R, pts, x, y);
  }
  function sideEdge(c, R, x, y, tx, dir, up, down) {
    const pts = [];
    for (let i = 0; i <= 5; i++) { const py = y + i * T / 5; let off = edgeN(py, tx, 2 + (dir > 0 ? 1 : 0)) * 1.8; if (up && i === 0) off = 0; if (down && i === 5) off = 0; pts.push([x + dir * off, py]); }
    c.fillStyle = U.mix(R.stone, R.stoneDark, dir > 0 ? 0.45 : 0.25);
    c.beginPath(); c.moveTo(x - dir * 2, y); pts.forEach((p) => c.lineTo(p[0], p[1])); c.lineTo(x - dir * 2, y + T); c.closePath(); c.fill();
    c.strokeStyle = U.rgba(R.stoneLight, dir > 0 ? 0.3 : 0.5); c.lineWidth = 0.8;
    c.beginPath(); pts.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.stroke();
  }
  function bottomEdge(c, R, x, y, ty, rnd) {
    const pts = [];
    for (let i = 0; i <= 5; i++) { const px = x + i * T / 5; pts.push([px, y + edgeN(px, ty, 5) * 2.2]); }
    c.fillStyle = U.mix(R.stone, '#000000', 0.55);
    c.beginPath(); c.moveTo(x, y - 2); pts.forEach((p) => c.lineTo(p[0], p[1])); c.lineTo(x + T, y - 2); c.closePath(); c.fill();
    const k = R.key;
    if (k === 'r4' && rnd() < 0.5) { c.strokeStyle = '#2e4a30'; c.lineWidth = 0.8; for (let i = 0; i < 2; i++) { const rx = x + rnd() * T; c.beginPath(); c.moveTo(rx, y); c.quadraticCurveTo(rx + 2, y + 4, rx - 1, y + 5 + rnd() * 8); c.stroke(); } }
    else if ((k === 'r3' || k === 'crypt' || k === 'r1' || k === 'r6') && rnd() < 0.35) { c.fillStyle = U.mix(R.stone, '#000000', 0.55); const sx = x + 4 + rnd() * 12; c.beginPath(); c.moveTo(sx - 2, y); c.lineTo(sx + 2, y); c.lineTo(sx, y + 4 + rnd() * 5); c.closePath(); c.fill(); }
  }
  function topping(c, R, pts, x, y) {
    const k = R.key;
    const along = (fn) => { for (let i = 0; i < pts.length - 1; i++) fn(pts[i], pts[i + 1], i); };
    if (k === 'r1' || k === 'crypt') {
      c.fillStyle = U.rgba(R.top, 0.9);
      c.beginPath(); c.moveTo(pts[0][0], pts[0][1] + 0.5); along((a, b) => c.quadraticCurveTo((a[0] + b[0]) / 2, Math.min(a[1], b[1]) - 1.4, b[0], b[1] + 0.5)); c.lineTo(x + T, y + 1); c.lineTo(x, y + 1); c.closePath(); c.fill();
      c.fillStyle = U.rgba(R.topAccent, 0.45); along((a) => { c.fillRect(a[0] + 1, a[1] - 0.8, 1.6, 0.6); });
    } else if (k === 'r4') {
      c.fillStyle = R.top; c.beginPath(); c.moveTo(pts[0][0], pts[0][1] + 1); along((a, b) => c.quadraticCurveTo((a[0] + b[0]) / 2, Math.min(a[1], b[1]) - 2, b[0], b[1] + 1)); c.lineTo(x + T, y + 3); c.lineTo(x, y + 3); c.closePath(); c.fill();
      c.strokeStyle = R.topAccent; c.lineWidth = 0.6;
      along((a, b, i) => { const gx = (a[0] + b[0]) / 2; c.beginPath(); c.moveTo(gx, a[1]); c.quadraticCurveTo(gx + (i % 2 ? 1.5 : -1.5), a[1] - 3, gx + (i % 2 ? 2 : -2.5), a[1] - 4.5 - (i % 3)); c.stroke(); });
    } else if (k === 'r3') {
      c.fillStyle = '#4a3a34'; c.fillRect(x, y - 0.5, T, 3.4); c.fillStyle = R.rim; c.fillRect(x, y - 0.5, T, 0.9);
      c.fillStyle = '#8a7060'; [3, 10, 17].forEach((rx) => { c.beginPath(); c.arc(x + rx, y + 1.5, 0.7, 0, U.TAU); c.fill(); });
    } else if (k === 'r5') {
      c.fillStyle = '#5a4430'; c.fillRect(x, y - 0.5, T, 3.6); c.fillStyle = '#8a6a48'; c.fillRect(x, y - 0.5, T, 1);
      c.strokeStyle = '#2a1e14'; c.lineWidth = 0.5; c.beginPath(); c.moveTo(x + ((x * 7) % 17), y); c.lineTo(x + ((x * 7) % 17), y + 3); c.stroke();
    } else if (k === 'r6') {
      c.fillStyle = R.top; c.fillRect(x, y - 0.3, T, 2.8); c.fillStyle = R.topAccent; c.fillRect(x, y + 2.5, T, 0.6); c.fillStyle = U.rgba('#ffffff', 0.15); c.fillRect(x, y + 0.2, T, 0.5);
    } else if (k === 'r7') {
      c.fillStyle = '#5a1418'; c.fillRect(x, y - 0.3, T, 2.6); c.fillStyle = '#c09050'; c.fillRect(x, y + 2.3, T, 0.6); c.fillStyle = U.rgba('#ff8060', 0.15); c.fillRect(x, y + 0.1, T, 0.5);
    } else if (k === 'r2') {
      c.fillStyle = U.rgba(R.topAccent, 0.5); along((a, b) => c.fillRect(a[0], a[1] - 0.2, b[0] - a[0], 0.8));
      c.fillStyle = U.rgba('#ffffff', 0.25); along((a, b, i) => { if (i % 2) c.fillRect(a[0], a[1], 2.5, 0.4); });
    } else if (k === 'sanct') {
      c.fillStyle = U.rgba(R.topAccent, 0.4); along((a, b) => c.fillRect(a[0], a[1], b[0] - a[0], 0.7));
    }
  }
  function crackGlow(c, R, x, y, rnd) {
    c.save(); c.strokeStyle = R.accent; c.lineWidth = 0.9; c.shadowColor = R.accent; c.shadowBlur = 3;
    for (let k = 0; k < 2; k++) { c.beginPath(); let px = x + 3 + rnd() * 14, py = y + 1; c.moveTo(px, py); for (let i = 0; i < 5; i++) { px += (rnd() - 0.5) * 9; py += 3 + rnd() * 2; c.lineTo(U.clamp(px, x + 1, x + T - 1), Math.min(py, y + T)); } c.stroke(); }
    c.restore();
    c.strokeStyle = U.rgba('#000000', 0.6); c.lineWidth = 1.2; c.strokeRect(x + 1.5, y + 1.5, T - 3, T - 3);
  }

  // desenho por frame: cache + elementos dinâmicos
  Tiles.drawRoom = function (ctx, room, R, cam, time) {
    let tc = room.tileCache;
    if (!tc || Math.abs(tc.s - Math.min(2.5, Math.max(1, VS.Gfx.scale), 4096 / room.pw, 4096 / room.ph)) > 0.6) tc = Tiles.build(room);
    const sx = Math.max(0, cam.x - 4), sy = Math.max(0, cam.y - 4);
    const sw = Math.min(room.pw - sx, U.VIEW_W + 8), sh = Math.min(room.ph - sy, U.VIEW_H + 8);
    if (sw > 0 && sh > 0) ctx.drawImage(tc.canvas, sx * tc.s, sy * tc.s, sw * tc.s, sh * tc.s, sx, sy, sw, sh);
    // dinâmicos: blocos que se desfazem e véus
    const x0 = Math.max(0, Math.floor(cam.x / T) - 1), y0 = Math.max(0, Math.floor(cam.y / T) - 1);
    const x1 = Math.min(room.w - 1, Math.ceil((cam.x + U.VIEW_W) / T) + 1), y1 = Math.min(room.h - 1, Math.ceil((cam.y + U.VIEW_H) / T) + 1);
    for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) {
      const ch = room.tile(tx, ty);
      if (ch === 'X') drawCrumble(ctx, room, R, tx, ty);
      else if (ch === 'V' && !(VS.state && VS.state.abilities.veil && false)) drawVeil(ctx, R, tx, ty, time, VS.state && VS.state.abilities.veil);
    }
    // olho de corvo: revela paredes falsas
    if (VS.state && VS.state.fx('revealSecrets', false)) for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) if (room.tile(tx, ty) === 'F' && !room.broken[tx + ',' + ty]) { ctx.fillStyle = `rgba(120,160,255,${0.12 + Math.sin(time * 3 + tx) * 0.06})`; ctx.fillRect(tx * T, ty * T, T, T); }
  };
  function drawCrumble(ctx, room, R, tx, ty) {
    const cr = room.crumble[tx + ',' + ty];
    if (cr && cr.gone) return;
    let ox = 0, oy = 0; if (cr && cr.t > 0) { ox = (Math.random() - 0.5) * 1.6; oy = (Math.random() - 0.5) * 1.2; }
    const x = tx * T + ox, y = ty * T + oy;
    ctx.fillStyle = U.mix(R.stone, R.stoneDark, 0.3); ctx.fillRect(x + 0.5, y, T - 1, T * 0.6);
    ctx.fillStyle = R.rim; ctx.fillRect(x + 0.5, y, T - 1, 1.2);
    ctx.strokeStyle = U.rgba('#000000', 0.8); ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.moveTo(x + T * 0.35, y); ctx.lineTo(x + T * 0.45, y + T * 0.35); ctx.lineTo(x + T * 0.3, y + T * 0.6); ctx.moveTo(x + T * 0.72, y); ctx.lineTo(x + T * 0.62, y + T * 0.6); ctx.stroke();
    ctx.fillStyle = U.mix(R.stone, '#000', 0.5); ctx.beginPath(); ctx.moveTo(x + 2, y + T * 0.6); ctx.lineTo(x + T / 2, y + T * 0.9); ctx.lineTo(x + T - 2, y + T * 0.6); ctx.fill();
  }

  // líquidos desenhados por cima das entidades (semi-transparentes)
  Tiles.drawLiquids = function (ctx, room, R, cam, time) {
    const x0 = Math.max(0, Math.floor(cam.x / T) - 1), y0 = Math.max(0, Math.floor(cam.y / T) - 1);
    const x1 = Math.min(room.w - 1, Math.ceil((cam.x + U.VIEW_W) / T) + 1), y1 = Math.min(room.h - 1, Math.ceil((cam.y + U.VIEW_H) / T) + 1);
    for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) {
      const ch = room.tile(tx, ty);
      if (ch !== '~' && ch !== 'L') continue;
      const lava = ch === 'L';
      const surface = room.tile(tx, ty - 1) !== ch;
      const col = lava ? (R.liquid || '#ff5010') : (R.water ? R.liquid : '#2a5a70');
      ctx.fillStyle = U.rgba(col, lava ? 0.85 : 0.45);
      if (surface) {
        const x = tx * T, y = ty * T;
        ctx.beginPath(); ctx.moveTo(x, y + T);
        for (let i = 0; i <= 4; i++) { const xx = x + i * T / 4; ctx.lineTo(xx, y + 3 + Math.sin(time * 2.5 + xx * 0.15) * 1.6); }
        ctx.lineTo(x + T, y + T); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = lava ? '#ffd080' : 'rgba(200,240,255,0.5)'; ctx.lineWidth = 0.8; ctx.beginPath();
        for (let i = 0; i <= 4; i++) { const xx = x + i * T / 4; const yy = y + 3 + Math.sin(time * 2.5 + xx * 0.15) * 1.6; i ? ctx.lineTo(xx, yy) : ctx.moveTo(xx, yy); }
        ctx.stroke();
        if (lava && Math.random() < 0.02) VS.Gfx.emit({ x: x + Math.random() * T, y: y + 3, vy: -60, g: 200, life: 0.8, size: 1.4, color: '#ffb040', add: true });
      } else ctx.fillRect(tx * T, ty * T, T, T + 0.5);
    }
  };

  function drawPlatform(c, room, R, tx, ty) {
    const x = tx * T, y = ty * T, k = R.key;
    const lEnd = room.tile(tx - 1, ty) !== '=', rEnd = room.tile(tx + 1, ty) !== '=';
    if (k === 'r3') {
      c.fillStyle = '#3a2c26'; c.fillRect(x, y, T, 4); c.fillStyle = '#8a6a50'; c.fillRect(x, y, T, 1);
      c.strokeStyle = '#1a1210'; c.lineWidth = 0.8; for (let i = 2; i < T; i += 4) { c.beginPath(); c.moveTo(x + i, y + 1); c.lineTo(x + i, y + 4); c.stroke(); }
      if (lEnd || rEnd) { c.strokeStyle = '#1a1210'; c.lineWidth = 1; c.beginPath(); const sx = lEnd ? x + 3 : x + T - 3; c.moveTo(sx, y); c.lineTo(sx, y - 40); c.stroke(); }
    } else if (k === 'r4') {
      c.fillStyle = '#3a3020'; c.beginPath(); c.ellipse(x + T / 2, y + 2.5, T * 0.58, 2.8, 0, 0, U.TAU); c.fill();
      c.fillStyle = '#5a7a40'; c.fillRect(x + 1, y - 0.5, T - 2, 1.3);
      if (rEnd) { c.fillStyle = '#4e7a46'; c.beginPath(); c.ellipse(x + T + 2, y + 1, 4, 2, 0.5, 0, U.TAU); c.fill(); }
    } else if (k === 'r6' || k === 'r7' || k === 'sanct') {
      c.fillStyle = R.stone; c.fillRect(x, y, T, 5); c.fillStyle = R.topAccent; c.fillRect(x, y, T, 1);
      c.fillStyle = U.rgba('#000', 0.3); c.fillRect(x, y + 4, T, 1);
      if (lEnd) { c.fillStyle = R.stone; c.beginPath(); c.moveTo(x, y + 5); c.lineTo(x + 7, y + 5); c.lineTo(x + 2, y + 10); c.closePath(); c.fill(); }
      if (rEnd) { c.fillStyle = R.stone; c.beginPath(); c.moveTo(x + T, y + 5); c.lineTo(x + T - 7, y + 5); c.lineTo(x + T - 2, y + 10); c.closePath(); c.fill(); }
    } else {
      c.fillStyle = '#3e2c1e'; c.fillRect(x, y, T, 4.5); c.fillStyle = '#7a5a3a'; c.fillRect(x, y, T, 1.1);
      c.strokeStyle = '#1e140c'; c.lineWidth = 0.6; c.beginPath(); c.moveTo(x + ((tx * 7) % 13) + 3, y + 1); c.lineTo(x + ((tx * 7) % 13) + 3, y + 4.5); c.stroke();
      c.fillStyle = '#2a1e14'; c.fillRect(x + 2, y + 1.5, 1, 1); c.fillRect(x + T - 3, y + 1.5, 1, 1);
      if (lEnd || rEnd) { c.strokeStyle = '#2a1e14'; c.lineWidth = 1.5; c.beginPath(); const sx = lEnd ? x + 3 : x + T - 3; c.moveTo(sx, y + 4); c.lineTo(sx + (lEnd ? 5 : -5), y + 11); c.stroke(); }
    }
  }
  function drawSpike(c, room, R, tx, ty) {
    const x = tx * T, y = ty * T;
    const sol = (a, b) => isSolidStatic(room, a, b);
    let dir = 'up';
    if (sol(tx, ty + 1)) dir = 'up'; else if (sol(tx - 1, ty)) dir = 'right'; else if (sol(tx + 1, ty)) dir = 'left'; else if (sol(tx, ty - 1)) dir = 'down';
    const thorn = R.key === 'r4';
    c.save(); c.translate(x + T / 2, y + T / 2);
    c.rotate({ up: 0, down: Math.PI, right: Math.PI / 2, left: -Math.PI / 2 }[dir]);
    c.fillStyle = R.stoneDark; c.fillRect(-T / 2, T / 2 - 3, T, 3);
    c.strokeStyle = thorn ? '#1a2a12' : '#1a1820'; c.lineWidth = 0.6;
    for (let i = 0; i < 4; i++) {
      const sx = -T / 2 + i * 5 + 2.5, h = 9 + ((tx + ty + i) % 3) * 2;
      const gr = c.createLinearGradient(0, T / 2, 0, T / 2 - h);
      gr.addColorStop(0, thorn ? '#2a3a1a' : '#3a3640'); gr.addColorStop(1, thorn ? '#8a9a5a' : '#c8c0c8');
      c.fillStyle = gr;
      c.beginPath(); c.moveTo(sx - 2.4, T / 2 - 2); c.lineTo(sx, T / 2 - 2 - h); c.lineTo(sx + 2.4, T / 2 - 2); c.closePath(); c.fill(); c.stroke();
    }
    c.restore();
  }
  function drawVeil(ctx, R, tx, ty, time, open) {
    const x = tx * T, y = ty * T;
    const a = (open ? 0.12 : 0.35) + Math.sin(time * 3 + ty * 0.7) * 0.1;
    ctx.fillStyle = `rgba(150,100,255,${a})`; ctx.fillRect(x + 2, y, T - 4, T);
    ctx.strokeStyle = `rgba(220,200,255,${a + 0.2})`; ctx.lineWidth = 0.8;
    ctx.beginPath();
    for (let i = 0; i <= 5; i++) { const yy = y + i * 4; const xx = x + T / 2 + Math.sin(time * 4 + yy * 0.3) * 4; i ? ctx.lineTo(xx, yy) : ctx.moveTo(xx, yy); }
    ctx.stroke();
  }

  VS.Tiles = Tiles;
})(window.VS);
