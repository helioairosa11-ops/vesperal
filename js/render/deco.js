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
    // só paredes que nunca se partem seguram adereços (numa parede rachada o adereço ficava a flutuar depois de a partir)
    const solid = (x, y) => { const c = room.tile(x, y); return c === '#' || c === 'F'; };
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
    // parede de fundo dos interiores: tramos com pilastras e uma abertura (janela, arco, seteira, grade ou nicho)
    const bays = [], bw = BACK_W[BACK_OF[R.key] || 'arch'];
    const kind = BACK_OF[R.key] || 'arch', ow = BACK_OW[kind];
    const blocks = (ch) => ch === null || ch === '#' || ch === 'C' || ch === 'F' || ch === '=';
    for (let x = 20 + rnd() * 40; x < room.pw + 200; x += bw + rnd() * 30) {
      // as aberturas cabem nos vãos livres da coluna do tramo: nunca atravessam chão, teto ou paredes
      const ww = bw * (kind === 'niche' ? 0.36 : ow), cx = x + bw / 2, rows = [];
      const tx0 = Math.floor((cx - ww / 2 - 6) / T), tx1 = Math.floor((cx + ww / 2 + 6) / T);
      let run = -1;
      for (let ty = 0; ty <= room.h; ty++) {
        let free = ty < room.h; if (free) for (let tx = tx0; tx <= tx1; tx++) if (blocks(room.tile(tx, ty))) { free = false; break; }
        if (free && run < 0) run = ty;
        if (!free && run >= 0) {
          const top = (run + 1) * T + ww * 0.45, bot = ty * T - T * 0.75, avail = bot - top;
          const want = kind === 'slit' ? 70 : kind === 'niche' ? 140 : 150;
          if (avail >= Math.min(want, kind === 'slit' ? 50 : 90)) {
            const n = Math.max(1, Math.floor((avail + 50) / (want + 50)));
            const hh = Math.min(want + 20, (avail - (n - 1) * 50) / n);
            for (let i = 0; i < n; i++) rows.push({ y: top + i * (hh + 50), h: kind === 'slit' ? hh / 0.55 : hh, v: rnd() });
          }
          run = -1;
        }
      }
      bays.push({ x, w: bw, rows, v: rnd() });
    }
    return { props, front, bays };
  }
  D.get = (room) => room.deco || (room.deco = build(room));

  // estilo da parede de fundo por região
  const BACK_OF = { sanct: 'arch', r1: 'arch', r2: 'slit', r3: 'grate', r4: 'glass', r5: 'slit', r6: 'lancet', r7: 'lancet', crypt: 'niche' };
  const BACK_W = { arch: 150, slit: 110, grate: 170, glass: 150, lancet: 130, niche: 90 };
  const GLASS = ['#c03a50', '#3a5ac0', '#d0a040', '#7a3ac0', '#3a9a80'];
  const BACK_P = 1; // presa ao mundo: as aberturas ficam sempre entre o chão e o teto
  const BACK_OW = { arch: 0.5, slit: 0.12, grate: 0.42, glass: 0.56, lancet: 0.36, niche: 0.5 };
  function openingPath(path, kind, cx, y, w, h) {
    const x0 = cx - w / 2, x1 = cx + w / 2;
    if (kind === 'grate' || kind === 'slit') { path.rect(x0, y, w, h); return; }
    if (kind === 'lancet') { path.moveTo(x0, y + h); path.lineTo(x0, y + w * 0.7); path.quadraticCurveTo(x0, y, cx, y - w * 0.35); path.quadraticCurveTo(x1, y, x1, y + w * 0.7); path.lineTo(x1, y + h); path.closePath(); return; }
    // arco de volta perfeita
    path.moveTo(x0, y + h); path.lineTo(x0, y + w / 2); path.arc(cx, y + w / 2, w / 2, Math.PI, 0); path.lineTo(x1, y + h); path.closePath();
  }
  D.drawBackdrop = function (ctx, room, R, cam) {
    const d = D.get(room), kind = BACK_OF[R.key] || 'arch';
    const sh = cam.x * (1 - BACK_P), sv = cam.y * (1 - BACK_P);
    ctx.save(); ctx.translate(sh, sv);
    const x0 = cam.x - sh - 30, y0 = cam.y - sv - 30, w = U.VIEW_W + 60, h = U.VIEW_H + 60;
    const vis = d.bays.filter((b) => b.x + b.w > x0 && b.x < x0 + w);
    // aberturas (mostram os planos distantes por trás)
    const holes = new Path2D(), ow = BACK_OW[kind];
    if (kind !== 'niche') for (const b of vis) for (const r of b.rows) { if (r.y + r.h < y0 || r.y - 40 > y0 + h) continue; openingPath(holes, kind, b.x + b.w / 2, r.y, b.w * ow, kind === 'slit' ? r.h * 0.55 : r.h); }
    const wall = new Path2D(); wall.rect(x0, y0, w, h); wall.addPath(holes);
    // a pedra da parede: o material da região, mais escuro e mais baço
    ctx.fillStyle = VS.Tiles.materialPattern(ctx, R, Math.min(2.5, G.scale)); ctx.fill(wall, 'evenodd');
    ctx.fillStyle = U.rgba(U.mix(R.stoneDark, R.darkColor || '#000000', 0.4), 0.62); ctx.fill(wall, 'evenodd');
    // vitrais / grades / caixilhos dentro das aberturas
    for (const b of vis) for (const r of b.rows) {
      if (r.y + r.h < y0 || r.y - 40 > y0 + h) continue;
      const cx = b.x + b.w / 2, ww = b.w * ow, hh = kind === 'slit' ? r.h * 0.55 : r.h;
      const one = new Path2D(); if (kind !== 'niche') openingPath(one, kind, cx, r.y, ww, hh);
      if (kind === 'lancet' || kind === 'glass') {
        ctx.save(); ctx.clip(one);
        const tint = R.key === 'r7' ? ['#a02018', '#d06020', '#601018'] : R.key === 'r4' ? ['#3a8a70', '#6ab090', '#2a5a50'] : GLASS;
        const cell = 9;
        for (let yy = r.y - ww * 0.4; yy < r.y + hh; yy += cell) for (let xx = cx - ww / 2; xx < cx + ww / 2; xx += cell * 0.8) {
          const k = Math.abs(Math.floor(xx * 7 + yy * 3 + r.v * 50)) % tint.length;
          ctx.fillStyle = U.rgba(tint[k], R.key === 'r4' ? 0.18 : 0.34); ctx.fillRect(xx, yy, cell * 0.8, cell);
        }
        const gl = ctx.createLinearGradient(0, r.y, 0, r.y + hh); gl.addColorStop(0, U.rgba(R.light, 0.22)); gl.addColorStop(1, U.rgba(R.light, 0.02)); ctx.fillStyle = gl; ctx.fillRect(cx - ww / 2, r.y - ww * 0.5, ww, hh + ww * 0.5);
        // chumbo e montantes
        ctx.strokeStyle = 'rgba(10,6,14,0.85)'; ctx.lineWidth = 0.7; ctx.beginPath();
        for (let yy = r.y; yy < r.y + hh; yy += cell) { ctx.moveTo(cx - ww / 2, yy); ctx.lineTo(cx + ww / 2, yy); }
        ctx.stroke(); ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(cx, r.y - ww * 0.35); ctx.lineTo(cx, r.y + hh);
        if (ww > 24) { ctx.moveTo(cx - ww / 4, r.y + ww * 0.3); ctx.lineTo(cx - ww / 4, r.y + hh); ctx.moveTo(cx + ww / 4, r.y + ww * 0.3); ctx.lineTo(cx + ww / 4, r.y + hh); }
        ctx.stroke();
        // rosácea no topo
        ctx.strokeStyle = 'rgba(10,6,14,0.85)'; ctx.lineWidth = 1.1; ctx.beginPath(); ctx.arc(cx, r.y + ww * 0.15, ww * 0.22, 0, U.TAU); ctx.stroke();
        ctx.restore();
      } else if (kind === 'grate') {
        ctx.save(); ctx.clip(one);
        const gl = ctx.createLinearGradient(0, r.y, 0, r.y + hh); gl.addColorStop(0, 'rgba(255,90,20,0.05)'); gl.addColorStop(1, 'rgba(255,110,30,0.28)'); ctx.fillStyle = gl; ctx.fillRect(cx - ww / 2, r.y, ww, hh);
        ctx.fillStyle = '#140c0a'; for (let xx = cx - ww / 2 + 4; xx < cx + ww / 2; xx += 8) ctx.fillRect(xx, r.y, 2.4, hh);
        for (let yy = r.y + 20; yy < r.y + hh; yy += 34) ctx.fillRect(cx - ww / 2, yy, ww, 3);
        ctx.restore();
      } else if (kind === 'slit') {
        ctx.save(); ctx.clip(one); ctx.fillStyle = U.rgba(R.light, 0.08); ctx.fillRect(cx - ww, r.y, ww * 2, hh); ctx.restore();
      } else if (kind === 'niche') {
        // nichos cegos com ossadas (catacumbas)
        const nw = b.w * 0.36, nh = 34;
        for (let k = 0, nk = Math.max(1, Math.floor((r.h + 12) / (nh + 12))); k < nk; k++) {
          const ny = r.y + k * (nh + 12), np = new Path2D(); openingPath(np, 'arch', cx, ny, nw, nh);
          ctx.fillStyle = 'rgba(2,2,4,0.85)'; ctx.fill(np);
          ctx.strokeStyle = U.rgba(R.stoneLight, 0.22); ctx.lineWidth = 1.6; ctx.stroke(np);
          const sk = (r.v * 10 + k * 3.7) % 1;
          if (sk < 0.7) { ctx.fillStyle = 'rgba(150,142,120,0.55)'; ctx.beginPath(); ctx.arc(cx - nw * 0.18, ny + nh - 6, 4, 0, U.TAU); ctx.fill(); ctx.fillStyle = 'rgba(10,8,8,0.9)'; ctx.fillRect(cx - nw * 0.18 - 2.2, ny + nh - 7, 1.6, 1.6); ctx.fillRect(cx - nw * 0.18 + 0.6, ny + nh - 7, 1.6, 1.6); }
          if (sk > 0.3) { ctx.fillStyle = 'rgba(140,130,110,0.45)'; ctx.save(); ctx.translate(cx + nw * 0.12, ny + nh - 3); ctx.rotate(-0.2); ctx.fillRect(-8, -1.4, 16, 2.8); ctx.restore(); }
        }
      }
      // moldura de pedra à volta da abertura
      if (kind !== 'niche') { ctx.strokeStyle = U.rgba(R.stoneLight, 0.28); ctx.lineWidth = 3; ctx.stroke(one); ctx.strokeStyle = 'rgba(0,0,0,0.6)'; ctx.lineWidth = 1; ctx.stroke(one); }
      // peitoril
      if (kind !== 'niche') { ctx.fillStyle = U.mix(R.stone, R.stoneDark, 0.3); ctx.fillRect(cx - ww / 2 - 5, r.y + hh, ww + 10, 4); ctx.fillStyle = U.rgba(R.stoneLight, 0.3); ctx.fillRect(cx - ww / 2 - 5, r.y + hh, ww + 10, 1); }
    }
    // pilastras entre os tramos: fuste com aresta iluminada, capitel e base
    for (const b of vis) {
      const px = b.x, pw = kind === 'niche' ? 12 : 20;
      const g = ctx.createLinearGradient(px - pw / 2, 0, px + pw / 2, 0);
      g.addColorStop(0, U.mix(R.stone, R.stoneLight, 0.25)); g.addColorStop(0.35, U.mix(R.stone, R.stoneDark, 0.2)); g.addColorStop(1, U.mix(R.stoneDark, '#000000', 0.35));
      ctx.fillStyle = g; ctx.fillRect(px - pw / 2, y0, pw, h);
      ctx.fillStyle = U.rgba('#000000', 0.35); ctx.fillRect(px - pw / 2 + 4, y0, 1.2, h); ctx.fillRect(px + pw / 2 - 5, y0, 1.2, h);
      for (const r of b.rows) {
        if (r.y < y0 - 40 || r.y > y0 + h + 40) continue;
        ctx.fillStyle = U.mix(R.stone, R.stoneLight, 0.2); ctx.fillRect(px - pw / 2 - 4, r.y - 8, pw + 8, 5);
        ctx.fillStyle = U.rgba('#000000', 0.4); ctx.fillRect(px - pw / 2 - 4, r.y - 3, pw + 8, 1.5);
        if (R.key === 'r6' || R.key === 'r7') { ctx.fillStyle = U.rgba(R.topAccent, 0.5); ctx.fillRect(px - pw / 2 - 4, r.y - 8, pw + 8, 0.8); }
      }
    }
    // tapeçarias no palácio, estandartes no santuário
    if (R.key === 'r7' || R.key === 'sanct') for (const b of vis) {
      if (b.v > 0.55) continue;
      for (const r of b.rows) {
        if (r.y + r.h < y0 || r.y > y0 + h) continue;
        const tx = b.x + (b.v < 0.27 ? 18 : -18) - 9, ty = r.y + 6, tw = 18, th = 60 + b.v * 50;
        ctx.fillStyle = R.key === 'r7' ? '#3a0a10' : '#4a1c14';
        ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(tx + tw, ty); ctx.lineTo(tx + tw, ty + th); ctx.lineTo(tx + tw / 2, ty + th - 8); ctx.lineTo(tx, ty + th); ctx.closePath(); ctx.fill();
        ctx.fillStyle = U.rgba(R.topAccent, 0.55); ctx.fillRect(tx, ty, tw, 2); ctx.fillRect(tx + 2, ty + 2, 1, th - 8); ctx.fillRect(tx + tw - 3, ty + 2, 1, th - 8);
        ctx.beginPath(); ctx.arc(tx + tw / 2, ty + 22, 4.5, 0, U.TAU); ctx.fill();
      }
    }
    ctx.restore();
    // escurecer em cima e em baixo (profundidade da nave)
    const g = ctx.createLinearGradient(0, cam.y, 0, cam.y + U.VIEW_H);
    g.addColorStop(0, U.rgba('#000000', 0.35)); g.addColorStop(0.45, U.rgba('#000000', 0)); g.addColorStop(1, U.rgba('#000000', 0.3));
    ctx.fillStyle = g; ctx.fillRect(cam.x - 20, cam.y - 20, U.VIEW_W + 40, U.VIEW_H + 40);
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
        // presas ao topo da sala (não ao ecrã): nas salas altas não ficam a pairar a meio do caminho
        const y = -4;
        if (cam.y > 130) continue;
        if (k === 'r4') { ctx.beginPath(); ctx.moveTo(x - 30, y); ctx.quadraticCurveTo(x, y + 50 + f.s * 40, x + 30, y); ctx.fill(); }
        else if (k === 'r3' || k === 'r6' || k === 'crypt') { for (let yy = y; yy < y + 40 + f.s * 60; yy += 6) { ctx.beginPath(); ctx.ellipse(x, yy, 2.5, 3.6, 0, 0, U.TAU); ctx.fill(); } }
      } else {
        // assentes no fundo da sala (não no fundo do ecrã)
        const y = room.ph + 6;
        if (cam.y + U.VIEW_H < room.ph - 110) continue;
        const h = (q) => { const v = Math.sin(q * 127.1 + f.s * 311.7 + f.x * 0.013) * 43758.5453; return v - Math.floor(v); };
        if (k === 'r4' || k === 'r1') { // tufo de erva e cardos: folhas de alturas e inclinações diferentes, e hastes com sementes
          const n = 7 + Math.floor(f.s * 5);
          for (let i = 0; i < n; i++) {
            const bx = x + (h(i) - 0.5) * 46, hh = 16 + h(i + 0.31) * (26 + f.s * 34), lean = (h(i + 0.67) - 0.5) * 26, w = 2.6 + h(i + 0.93) * 3.4;
            ctx.beginPath(); ctx.moveTo(bx - w / 2, y); ctx.quadraticCurveTo(bx + lean * 0.2 - w * 0.3, y - hh * 0.62, bx + lean, y - hh); ctx.quadraticCurveTo(bx + lean * 0.35 + w * 0.4, y - hh * 0.5, bx + w / 2, y); ctx.fill();
          }
          ctx.strokeStyle = '#030204'; ctx.lineWidth = 1.1;
          for (let i = 0; i < 2; i++) { const sx = x + (h(i + 5.1) - 0.5) * 30, sh = 40 + h(i + 5.5) * 36, sl = (h(i + 5.9) - 0.5) * 18; ctx.beginPath(); ctx.moveTo(sx, y); ctx.quadraticCurveTo(sx + sl * 0.2, y - sh * 0.6, sx + sl, y - sh); ctx.stroke(); ctx.beginPath(); ctx.ellipse(sx + sl, y - sh - 2.5, 2, 3.4, sl * 0.03, 0, U.TAU); ctx.fill(); }
        }
        else if (k === 'r6' || k === 'r7' || k === 'sanct') {
          // colunas de primeiro plano: finas, translúcidas e ausentes nas arenas, para nunca esconder a ação
          if (f.arena) continue;
          const w = 12 + f.s * 8;
          ctx.globalAlpha = 0.62; ctx.fillRect(x, cam.y - 10, w, U.VIEW_H + 20);
          ctx.globalAlpha = 0.35; ctx.fillRect(x - 3, cam.y - 10, 3, U.VIEW_H + 20); ctx.fillRect(x + w, cam.y - 10, 3, U.VIEW_H + 20);
          ctx.globalAlpha = 1;
        }
        else if (k === 'r2' || k === 'r5') { // estacas partidas atadas por uma travessa
          const xs = [0, 11, 21].map((o, i) => [x + o + (h(i + 2.2) - 0.5) * 4, 34 + h(i + 2.7) * (30 + f.s * 26), (h(i + 3.1) - 0.5) * 8]);
          for (const [sx, sh, sl] of xs) { ctx.beginPath(); ctx.moveTo(sx - 3, y); ctx.lineTo(sx - 2 + sl, y - sh + 6); ctx.lineTo(sx + sl, y - sh); ctx.lineTo(sx + 2 + sl, y - sh + 7); ctx.lineTo(sx + 3, y); ctx.fill(); }
          ctx.fillRect(x - 4, y - 24 - f.s * 6, 30, 3.4);
        }
      }
    }
  };

  // ---------- adereços pintados (atlas do ateliê) ----------
  // chama viva: gota com núcleo claro, a tremeluzir; o brilho e a luz vêm do sistema de luzes
  function flame(ctx, x, y, s, time, seed) {
    const f = Math.sin(time * 13 + seed * 7.1) * 0.5 + Math.sin(time * 21 + seed * 3.3) * 0.5;
    const h = (2.6 + f * 0.5) * s, w = 1.05 * s, lean = Math.sin(time * 5 + seed) * 0.35 * s;
    ctx.fillStyle = 'rgba(255,120,40,0.9)';
    ctx.beginPath(); ctx.moveTo(x - w, y); ctx.quadraticCurveTo(x - w * 1.1, y - h * 0.5, x + lean, y - h); ctx.quadraticCurveTo(x + w * 1.1, y - h * 0.5, x + w, y); ctx.quadraticCurveTo(x, y + w * 0.6, x - w, y); ctx.fill();
    ctx.fillStyle = '#ffe9a8';
    ctx.beginPath(); ctx.moveTo(x - w * 0.45, y); ctx.quadraticCurveTo(x - w * 0.5, y - h * 0.4, x + lean * 0.6, y - h * 0.68); ctx.quadraticCurveTo(x + w * 0.5, y - h * 0.4, x + w * 0.45, y); ctx.closePath(); ctx.fill();
  }
  D.flame = flame;
  // desenha a variante v do adereço k com a âncora em (x, y); devolve false se o atlas ainda não está pronto
  D.atlas = function (ctx, k, v, x, y, o) {
    const meta = VS.PROP_META, list = meta && meta.items[k];
    if (!list) return false;
    const im = VS.Assets.img('props/props.png');
    if (!VS.Assets.ok(im)) return false;
    const e = list[((v % list.length) + list.length) % list.length], S = meta.S, f = e[6] || {};
    const time = (o && o.time) || 0, seed = (o && o.seed) || 0, flip = o && o.flip;
    ctx.save(); ctx.translate(x, y);
    if (flip) ctx.scale(-1, 1);
    if (f.sway && !(o && o.still)) { const a = Math.sin(time * (1.1 + seed * 0.6) + seed * 9) * f.sway; ctx.rotate(a); }
    if (f.skew && !(o && o.still)) ctx.transform(1, 0, Math.sin(time * 1.6 + seed * 5) * 0.06, 1, 0, 0);
    ctx.drawImage(im, e[0], e[1], e[2], e[3], -e[4] / S, -e[5] / S, e[2] / S, e[3] / S);
    if (f.flames && !(o && o.unlit)) { const k2 = (o && o.flameK) || 1; f.flames.forEach((q, i) => flame(ctx, q[0], q[1], q[2] * k2, time, seed * 10 + i)); }
    ctx.restore();
    return f;
  };

  // ---------- adereços ----------
  const PROP_ATLAS = { rubble: 1, grave: 1, lamppost: 1, barrel: 1, candles: 1, crate: 1, stakes: 1, brazier: 1, anvil: 1, crucible: 1, pipe: 1, pot: 1, smallbell: 1, rope: 1, candelabra: 1, pew: 1, statue: 1, chair: 1, skulls: 1, coffin: 1,
    sign: 1, banner: 1, hook: 1, lantern: 1, smallbell_h: 1, censer: 1, chandelier: 1, roots: 1, window: 1, sconce: 1, banner_w: 1, vent: 1, glasspane: 1, stained: 1, portrait: 1, niche: 1 };
  function drawProp(ctx, p, R, time) {
    const x = p.x, y = p.y, s = p.s;
    if (PROP_ATLAS[p.k]) {
      const list = VS.PROP_META && VS.PROP_META.items[p.k];
      const v = list ? Math.floor(s * list.length * 0.999) : 0;
      // apliques encostam à parede (o braço sai para o lado aberto); o resto espelha ao acaso para variar
      const mir = list && list[0] && list[0][6] && list[0][6].mirror;
      const ax = mir && p.side ? x + p.side * 7 : x;
      const flip = mir && p.side ? p.side > 0 : !p.ceil && ((s * 997) | 0) % 2 === 1;
      const f = D.atlas(ctx, p.k, v, ax, y, { time, seed: s, flip });
      if (f) {
        if (f.glowA) { const a = 0.32 + Math.sin(time * 3 + s * 9) * 0.08 + Math.sin(time * 11 + s * 4) * 0.04; ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = a; const col = p.k === 'vent' ? '#ff5010' : p.k === 'stained' ? '#c080ff' : '#ff9040'; ctx.drawImage(G.glowSprite(col), x - 14, y - 14, 28, 28); ctx.restore(); }
        if (f.smoke && Math.random() < 0.04) { const a = Math.sin(time * (1.1 + s * 0.6) + s * 9) * f.sway; G.emit({ x: x - Math.sin(a) * f.smoke[1], y: y + Math.cos(a) * f.smoke[1], vx: U.rand(-3, 3), vy: -10, life: 4, size: 6, color: 'rgba(180,160,200,0.08)', kind: 'glow', color2: '#000000' }); }
        return;
      }
    }
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
