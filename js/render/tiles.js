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


  // ---------- materiais: padrão de alvenaria por região (sem emendas, 4×4 tiles), visível junto às faces
  // expostas e a desaparecer no escuro para dentro da massa
  const MAT_OF = { r1: 'brick', crypt: 'brick', sanct: 'ashlar', r2: 'ashlar', r3: 'plates', r4: 'cobble', r5: 'timber', r6: 'marble', r7: 'marble' };
  const matCache = {};
  const P = 4 * T;
  function wrap(fn) { for (let ox = -P; ox <= P; ox += P) for (let oy = -P; oy <= P; oy += P) fn(ox, oy); }
  function materialCanvas(R, s) {
    const key = R.key + ':' + s.toFixed(2);
    if (matCache[key]) return matCache[key];
    const cv = document.createElement('canvas'); cv.width = cv.height = Math.round(P * s);
    const c = cv.getContext('2d'); c.scale(s, s);
    const rnd = U.rng(U.hash(R.key + 'mat'));
    const kind = MAT_OF[R.key] || 'brick';
    const mortar = U.mix(R.stoneDark, R.stone, 0.25);
    c.fillStyle = mortar; c.fillRect(0, 0, P, P);
    const tone = () => { const r = rnd(); return r < 0.5 ? U.mix(R.stone, R.stoneLight, r * 0.5) : U.mix(R.stone, R.stoneDark, (r - 0.5) * 0.9); };
    const speck = (x, y, w, h, n, col, a) => { for (let i = 0; i < n; i++) { c.fillStyle = U.rgba(col, a * (0.5 + rnd() * 0.5)); c.fillRect(x + rnd() * w, y + rnd() * h, 0.4 + rnd() * 1.2, 0.4 + rnd() * 0.8); } };
    const crack = (x, y, len) => { c.strokeStyle = U.rgba('#000000', 0.55); c.lineWidth = 0.45; c.beginPath(); c.moveTo(x, y); let cx = x, cy = y; for (let i = 0; i < 4; i++) { cx += (rnd() - 0.5) * len * 0.6; cy += len * 0.25 + rnd() * len * 0.2; c.lineTo(cx, cy); } c.stroke(); };
    // pedra cortada com bisel: luz em cima/esquerda, sombra em baixo/direita
    const block = (x, y, w, h, col, bev, ox, oy) => {
      x += ox; y += oy;
      c.fillStyle = col; c.fillRect(x, y, w, h);
      const g = c.createLinearGradient(x, y, x + w * 0.35, y + h); g.addColorStop(0, U.rgba(R.stoneLight, 0.22)); g.addColorStop(0.5, U.rgba(R.stoneLight, 0)); g.addColorStop(1, U.rgba('#000000', 0.22));
      c.fillStyle = g; c.fillRect(x, y, w, h);
      c.fillStyle = U.rgba(R.stoneLight, 0.35); c.fillRect(x, y, w, bev * 0.5); c.fillRect(x, y, bev * 0.45, h);
      c.fillStyle = U.rgba('#000000', 0.42); c.fillRect(x, y + h - bev * 0.6, w, bev * 0.6); c.fillRect(x + w - bev * 0.5, y, bev * 0.5, h);
    };
    if (kind === 'brick') {
      const bh = 10;
      for (let row = 0; row < P / bh; row++) {
        const off = (row % 2) * 10;
        for (let bx = -20; bx < P; bx += 20) {
          const x = bx + off, y = row * bh, col = tone(), chip = rnd(), cr = rnd();
          wrap((ox, oy) => { block(x + 0.6, y + 0.6, 18.8, bh - 1.2, col, 1.1, ox, oy); });
          const sx = x + 1 + rnd() * 16, sy = y + 1 + rnd() * 6;
          wrap((ox, oy) => {
            if (chip < 0.3) { c.fillStyle = U.rgba('#000000', 0.5); c.beginPath(); c.moveTo(x + 0.6 + ox, y + 0.6 + oy); c.lineTo(x + 3.5 + ox, y + 0.6 + oy); c.lineTo(x + 0.6 + ox, y + 3 + oy); c.fill(); }
            if (cr < 0.12) { c.save(); c.translate(ox, oy); crack(sx, y + 1, 6); c.restore(); }
          });
          speck(((x % P) + P) % P, y, 19, bh, 6, '#000000', 0.25); speck(((x % P) + P) % P, y, 19, bh, 3, R.stoneLight, 0.18);
        }
      }
    } else if (kind === 'ashlar' || kind === 'timber') {
      const bh = 20;
      for (let row = 0; row < P / bh; row++) {
        let bx = (row % 2) ? -20 : 0;
        while (bx < P) {
          const w = rnd() < 0.3 ? 20 : 40, x = bx, y = row * bh, col = tone(), cr = rnd(), sx = rnd() * w;
          wrap((ox, oy) => { block(x + 0.8, y + 0.8, w - 1.6, bh - 1.6, col, 1.6, ox, oy); if (cr < 0.2) { c.save(); c.translate(ox, oy); crack(x + sx, y + 2, 9); c.restore(); } });
          speck(((x % P) + P) % P, y, w, bh, 14, '#000000', 0.22); speck(((x % P) + P) % P, y, w, bh, 6, R.stoneLight, 0.15);
          if (R.key === 'r2' && rnd() < 0.5) { c.fillStyle = 'rgba(70,110,80,0.25)'; for (let i = 0; i < 5; i++) { c.beginPath(); c.arc(((x % P) + P) % P + rnd() * w, y + bh - 1 - rnd() * 3, 0.8 + rnd() * 1.6, 0, U.TAU); c.fill(); } }
          bx += w;
        }
      }
      if (kind === 'timber') {
        // vigas de madeira escura a atravessar a pedra
        for (const by of [0, 40]) {
          const g = c.createLinearGradient(0, by, 0, by + 7); g.addColorStop(0, '#6a4c30'); g.addColorStop(0.5, '#3e2a1a'); g.addColorStop(1, '#1e140c');
          c.fillStyle = g; c.fillRect(0, by, P, 7);
          c.strokeStyle = 'rgba(20,12,6,0.7)'; c.lineWidth = 0.4; for (let i = 0; i < 6; i++) { const yy = by + 1 + rnd() * 5; c.beginPath(); c.moveTo(0, yy); c.bezierCurveTo(P * 0.3, yy + (rnd() - 0.5), P * 0.6, yy + (rnd() - 0.5), P, yy); c.stroke(); }
          for (let x = 8; x < P; x += 40) { c.fillStyle = '#16100a'; c.beginPath(); c.arc(x, by + 3.5, 1.1, 0, U.TAU); c.fill(); c.fillStyle = 'rgba(200,160,110,0.4)'; c.fillRect(x - 0.6, by + 2.6, 0.6, 0.6); }
        }
      }
    } else if (kind === 'plates') {
      for (let py = 0; py < P; py += 40) for (let px = 0; px < P; px += 40) {
        const col = U.mix(tone(), '#3a2a26', 0.35);
        const g = c.createLinearGradient(px, py, px + 40, py + 40); g.addColorStop(0, U.mix(col, R.stoneLight, 0.25)); g.addColorStop(1, U.mix(col, '#000000', 0.35));
        c.fillStyle = g; c.fillRect(px + 0.7, py + 0.7, 38.6, 38.6);
        c.fillStyle = U.rgba('#ffd0a0', 0.12); c.fillRect(px + 0.7, py + 0.7, 38.6, 0.8);
        c.fillStyle = 'rgba(0,0,0,0.5)'; c.fillRect(px + 0.7, py + 38.5, 38.6, 0.8);
        for (let i = 0; i < 4; i++) for (const [rx, ry] of [[px + 3 + i * 11.3, py + 3], [px + 3 + i * 11.3, py + 37], [px + 3, py + 3 + i * 11.3], [px + 37, py + 3 + i * 11.3]]) {
          c.fillStyle = '#1a1210'; c.beginPath(); c.arc(rx, ry, 1.15, 0, U.TAU); c.fill(); c.fillStyle = 'rgba(230,180,140,0.45)'; c.beginPath(); c.arc(rx - 0.35, ry - 0.35, 0.45, 0, U.TAU); c.fill();
        }
        // ferrugem e fuligem a escorrer
        for (let i = 0; i < 3; i++) { const sx = px + 5 + rnd() * 30, sy = py + 4 + rnd() * 10, sh = 10 + rnd() * 22; const rg = c.createLinearGradient(0, sy, 0, sy + sh); rg.addColorStop(0, 'rgba(150,70,30,0.35)'); rg.addColorStop(1, 'rgba(150,70,30,0)'); c.fillStyle = rg; c.fillRect(sx, sy, 1 + rnd() * 2.5, sh); }
        speck(px, py, 40, 40, 22, '#000000', 0.25);
      }
      // costura de brasa entre placas
      c.fillStyle = 'rgba(255,90,20,0.10)'; c.fillRect(0, 39.4, P, 1.2); c.fillRect(39.4, 0, 1.2, P);
    } else if (kind === 'cobble') {
      // pedras arredondadas de rio com musgo
      const pts = [];
      for (let gy = 0; gy < 6; gy++) for (let gx = 0; gx < 6; gx++) pts.push([gx * P / 6 + rnd() * 6, gy * P / 6 + rnd() * 6, 5 + rnd() * 3.5, 3.6 + rnd() * 2.6, rnd() * 0.6 - 0.3, tone(), rnd()]);
      for (const [x, y, rx, ry, a, col, m] of pts) wrap((ox, oy) => {
        c.save(); c.translate(x + ox, y + oy); c.rotate(a);
        const g = c.createRadialGradient(-rx * 0.3, -ry * 0.4, 0.5, 0, 0, rx * 1.2); g.addColorStop(0, U.mix(col, R.stoneLight, 0.35)); g.addColorStop(1, U.mix(col, '#000000', 0.4));
        c.fillStyle = g; c.beginPath(); c.ellipse(0, 0, rx, ry, 0, 0, U.TAU); c.fill();
        c.strokeStyle = 'rgba(0,0,0,0.55)'; c.lineWidth = 0.5; c.stroke();
        if (m < 0.55) { c.fillStyle = 'rgba(90,150,80,0.45)'; c.beginPath(); c.ellipse(-rx * 0.2, -ry * 0.55, rx * 0.7, ry * 0.35, 0, 0, U.TAU); c.fill(); c.fillStyle = 'rgba(150,210,120,0.25)'; c.beginPath(); c.ellipse(-rx * 0.3, -ry * 0.65, rx * 0.35, ry * 0.15, 0, 0, U.TAU); c.fill(); }
        c.restore();
      });
      // raízes finas
      c.strokeStyle = 'rgba(20,30,16,0.6)'; c.lineWidth = 0.6;
      for (let i = 0; i < 4; i++) { const x = rnd() * P; wrap((ox, oy) => { c.beginPath(); c.moveTo(x + ox, oy); c.bezierCurveTo(x + 6 + ox, P * 0.3 + oy, x - 6 + ox, P * 0.6 + oy, x + 3 + ox, P + oy); c.stroke(); }); }
    } else if (kind === 'marble') {
      const red = R.key === 'r7';
      for (let py = 0; py < P; py += 40) for (let px = 0; px < P; px += 40) {
        const col = U.mix(tone(), red ? '#3a1416' : '#2e2640', 0.3);
        const g = c.createLinearGradient(px, py, px + 40, py + 40); g.addColorStop(0, U.mix(col, R.stoneLight, 0.3)); g.addColorStop(1, U.mix(col, '#000000', 0.3));
        c.fillStyle = g; c.fillRect(px + 0.5, py + 0.5, 39, 39);
        // veios (recortados à laje)
        c.save(); c.beginPath(); c.rect(px + 0.5, py + 0.5, 39, 39); c.clip();
        for (let i = 0; i < 3; i++) {
          c.strokeStyle = U.rgba(red ? '#e0a090' : '#d8d0f0', 0.12 + rnd() * 0.12); c.lineWidth = 0.3 + rnd() * 0.5;
          c.beginPath(); let vx = px + rnd() * 40, vy = py; c.moveTo(vx, vy);
          for (let k = 0; k < 5; k++) { const nx = vx + (rnd() - 0.4) * 14, ny = vy + 8 + rnd() * 4; c.quadraticCurveTo(vx + (rnd() - 0.5) * 10, (vy + ny) / 2, nx, ny); vx = nx; vy = ny; }
          c.stroke();
        }
        c.restore();
        c.fillStyle = U.rgba('#ffffff', 0.08); c.fillRect(px + 0.5, py + 0.5, 39, 0.7);
      }
      // filete dourado nas juntas
      c.fillStyle = U.rgba(R.topAccent, 0.38); for (const q of [0, 40]) { c.fillRect(0, q, P, 0.7); c.fillRect(q, 0, 0.7, P); }
      c.fillStyle = U.rgba(R.topAccent, 0.6); for (const [x, y] of [[0, 0], [40, 0], [0, 40], [40, 40]]) wrap((ox, oy) => { c.save(); c.translate(x + ox, y + oy); c.rotate(Math.PI / 4); c.fillRect(-1.6, -1.6, 3.2, 3.2); c.restore(); });
    }
    // grão fino por cima de tudo
    speck(0, 0, P, P, 180, '#000000', 0.18); speck(0, 0, P, P, 60, R.stoneLight, 0.1);
    matCache[key] = cv;
    return cv;
  }
  // profundidade: distância (em tiles) de cada tile sólido até ao ar mais próximo
  function depthField(room, S) {
    const W = room.w, H = room.h, d = new Int16Array(W * H).fill(99), q = [];
    for (let ty = 0; ty < H; ty++) for (let tx = 0; tx < W; tx++) if (!S(tx, ty)) { d[ty * W + tx] = 0; q.push(tx, ty); }
    for (let i = 0; i < q.length; i += 2) {
      const x = q[i], y = q[i + 1], v = d[y * W + x];
      if (v >= 6) continue;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue; const k = ny * W + nx; if (d[k] > v + 1) { d[k] = v + 1; q.push(nx, ny); } }
    }
    return d;
  }
  const DEPTH_A = [0, 0.08, 0.42, 0.68, 0.84, 0.92, 0.96];
  function paintMaterial(c, room, R, S, s) {
    const W = room.w, H = room.h;
    // máscara dos sólidos (os mesmos retângulos da massa escura)
    const clip = new Path2D();
    for (let ty = 0; ty < H; ty++) { let run = -1; for (let tx = 0; tx <= W; tx++) { const sol = tx < W && S(tx, ty) && room.tile(tx, ty) !== null; if (sol && run < 0) run = tx; if (!sol && run >= 0) { clip.rect(run * T, ty * T, (tx - run) * T + 0.5, T + 0.5); run = -1; } } }
    c.save(); c.clip(clip);
    const pat = c.createPattern(materialCanvas(R, s), 'repeat');
    if (pat.setTransform) pat.setTransform(new DOMMatrix().scale(1 / s));
    c.fillStyle = pat; c.fillRect(0, 0, room.pw, room.ph);
    // escurecer com a profundidade: campo pequeno ampliado com suavização (gradiente contínuo)
    const d = depthField(room, S);
    const dc = document.createElement('canvas'); dc.width = W; dc.height = H;
    const dx = dc.getContext('2d'), img = dx.createImageData(W, H);
    const [dr, dg, db] = U.hexToRgb(U.mix(R.stoneDark, R.darkColor || '#000000', 0.5));
    for (let i = 0; i < W * H; i++) { const v = d[i] === 0 ? 1 : Math.min(d[i], 6); img.data[i * 4] = dr; img.data[i * 4 + 1] = dg; img.data[i * 4 + 2] = db; img.data[i * 4 + 3] = Math.round(DEPTH_A[v] * 255); }
    dx.putImageData(img, 0, 0);
    c.imageSmoothingEnabled = true; c.imageSmoothingQuality = 'high';
    c.drawImage(dc, -T / 2, -T / 2, room.pw + T, room.ph + T);
    c.restore();
  }

  // padrão do material para outros desenhos (parede de fundo dos interiores)
  Tiles.materialPattern = function (ctx, R, s) {
    s = Math.max(1, Math.min(2.5, Math.round(s * 4) / 4));
    const pat = ctx.createPattern(materialCanvas(R, s), 'repeat');
    if (pat.setTransform) pat.setTransform(new DOMMatrix().scale(1 / s));
    return pat;
  };
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
    // 2) alvenaria da região, a desaparecer no escuro para dentro da massa
    const rnd = U.rng(U.hash(room.id + 'tex'));
    paintMaterial(c, room, R, S, s);
    // 3) faces expostas: bandas iluminadas, blocos, contorno irregular
    for (let ty = 0; ty < H; ty++) for (let tx = 0; tx < W; tx++) {
      if (!S(tx, ty)) continue;
      const up = !S(tx, ty - 1), down = !S(tx, ty + 1), left = !S(tx - 1, ty), right = !S(tx + 1, ty);
      if (!(up || down || left || right)) continue;
      const x = tx * T, y = ty * T;
      const ch = room.tile(tx, ty);
      // luz da face superior (vem de cima) e sombra por baixo das saliências
      if (up) { const g = c.createLinearGradient(0, y, 0, y + 12); g.addColorStop(0, U.rgba(R.stoneLight, 0.32)); g.addColorStop(1, U.rgba(R.stoneLight, 0)); c.fillStyle = g; c.fillRect(x, y, T, 12); }
      if (left) { const g = c.createLinearGradient(x, 0, x + 6, 0); g.addColorStop(0, U.rgba(R.stoneLight, 0.14)); g.addColorStop(1, U.rgba(R.stoneLight, 0)); c.fillStyle = g; c.fillRect(x, y, 6, T); }
      if (right) { const g = c.createLinearGradient(x + T, 0, x + T - 6, 0); g.addColorStop(0, U.rgba('#000000', 0.3)); g.addColorStop(1, U.rgba('#000000', 0)); c.fillStyle = g; c.fillRect(x + T - 6, y, 6, T); }
      if (down) { const g = c.createLinearGradient(0, y + T, 0, y + T - 8); g.addColorStop(0, U.rgba('#000000', 0.55)); g.addColorStop(1, U.rgba('#000000', 0)); c.fillStyle = g; c.fillRect(x, y + T - 8, T, 8); }
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

  // plataformas finas: cada plataforma (segmento contínuo de '=') escolhe um de três estilos da sua região,
  // desenhados por segmento (pontas, meio, apoios) — nada de uma só tábua repetida pelo mundo inteiro
  const PLAT_STYLES = {
    r1: ['planks', 'balcony', 'sign'], crypt: ['slab', 'coffin', 'planks'], r2: ['timber', 'corbel', 'scaffold'],
    r3: ['grate', 'girder', 'chaingrate'], r4: ['log', 'lily', 'fungus'], r5: ['bellbeam', 'gallery', 'ropeplank'],
    r6: ['ledge', 'trefoil', 'loft'], r7: ['marble', 'carpet', 'gilt'], sanct: ['ledge', 'trefoil', 'ledge'],
  };
  function platSeg(room, tx, ty) {
    let x0 = tx, x1 = tx;
    while (room.tile(x0 - 1, ty) === '=') x0--;
    while (room.tile(x1 + 1, ty) === '=') x1++;
    return [x0, x1];
  }
  function drawPlatform(c, room, R, tx, ty) {
    const x = tx * T, y = ty * T, k = R.key;
    const [x0, x1] = platSeg(room, tx, ty), lEnd = tx === x0, rEnd = tx === x1, i = tx - x0, n = x1 - x0 + 1;
    const list = PLAT_STYLES[k] || PLAT_STYLES.r1;
    const h = (U.hash(room.id + ':' + x0 + ':' + ty) >>> 0);
    const st = list[h % list.length];
    const line = (x1_, y1_, x2_, y2_, w, col) => { c.strokeStyle = col; c.lineWidth = w; c.beginPath(); c.moveTo(x1_, y1_); c.lineTo(x2_, y2_); c.stroke(); };
    switch (st) {
      case 'planks': { // tábuas de madeira com mãos-francesas nas pontas
        c.fillStyle = '#3e2c1e'; c.fillRect(x, y, T, 4.5); c.fillStyle = '#7a5a3a'; c.fillRect(x, y, T, 1.1);
        line(x + ((tx * 7) % 13) + 3, y + 1, x + ((tx * 7) % 13) + 3, y + 4.5, 0.6, '#1e140c');
        c.fillStyle = '#2a1e14'; c.fillRect(x + 2, y + 1.5, 1, 1); c.fillRect(x + T - 3, y + 1.5, 1, 1);
        if (lEnd || rEnd) line(lEnd ? x + 3 : x + T - 3, y + 4, (lEnd ? x + 3 : x + T - 3) + (lEnd ? 5 : -5), y + 11, 1.5, '#2a1e14');
        break;
      }
      case 'balcony': { // laje de pedra com grade de ferro
        c.fillStyle = R.stone; c.fillRect(x, y, T, 5); c.fillStyle = R.topAccent; c.fillRect(x, y, T, 1); c.fillStyle = 'rgba(0,0,0,0.35)'; c.fillRect(x, y + 4, T, 1.2);
        line(x, y - 9, x + T, y - 9, 0.9, '#1c1a20');
        for (const px of [x + 3, x + 13]) line(px, y, px, y - 9, 0.7, '#1c1a20');
        if (lEnd || rEnd) { c.fillStyle = R.stone; c.beginPath(); const ex = lEnd ? x : x + T; c.moveTo(ex, y + 5); c.lineTo(ex + (lEnd ? 8 : -8), y + 5); c.lineTo(ex + (lEnd ? 2 : -2), y + 12); c.closePath(); c.fill(); }
        break;
      }
      case 'sign': { // tábua de tabuleta suspensa por cordas
        c.fillStyle = '#4a3422'; c.fillRect(x, y, T, 4); c.fillStyle = '#8a6a44'; c.fillRect(x, y, T, 1);
        if (i % 2 === 0) { c.fillStyle = '#2a1c12'; c.fillRect(x + 6, y + 1.4, 8, 1.2); }
        if (lEnd || rEnd) line(lEnd ? x + 2 : x + T - 2, y, lEnd ? x + 4 : x + T - 4, y - 60, 0.8, '#5a4a3a');
        break;
      }
      case 'slab': { // laje de ossário com crânios nos nichos
        c.fillStyle = '#4a4440'; c.fillRect(x, y, T, 5); c.fillStyle = '#8a8070'; c.fillRect(x, y, T, 1);
        if ((tx + ty) % 3 === 0) { c.fillStyle = '#1a1614'; c.beginPath(); c.arc(x + T / 2, y + 3, 1.8, 0, U.TAU); c.fill(); c.fillStyle = '#c8bca0'; c.beginPath(); c.arc(x + T / 2, y + 2.8, 1.2, 0, U.TAU); c.fill(); }
        break;
      }
      case 'coffin': { // tampa de caixão de madeira escura com pregos
        c.fillStyle = '#2e2018'; c.fillRect(x, y, T, 4.5); c.fillStyle = '#5a3e2a'; c.fillRect(x, y, T, 1);
        c.fillStyle = '#9a8a6a'; c.fillRect(x + 4, y + 2, 1, 1); c.fillRect(x + 15, y + 2, 1, 1);
        if (lEnd || rEnd) { c.fillStyle = '#2e2018'; c.fillRect(lEnd ? x : x + T - 3, y - 1.5, 3, 6); }
        break;
      }
      case 'timber': { // viga grossa com cintas de ferro
        c.fillStyle = '#3a2a1c'; c.fillRect(x, y, T, 5); c.fillStyle = '#6e5236'; c.fillRect(x, y, T, 1.2);
        if (i % 2 === 1 || n === 1) { c.fillStyle = '#2a2a30'; c.fillRect(x + 8, y, 3, 5); c.fillStyle = '#6a6a74'; c.fillRect(x + 8, y, 3, 0.8); }
        line(x, y + 3.2, x + T, y + 3.4, 0.4, 'rgba(0,0,0,0.4)');
        break;
      }
      case 'corbel': { // laje de pedra sobre mísulas
        c.fillStyle = R.stone; c.fillRect(x, y, T, 4.5); c.fillStyle = R.topAccent; c.fillRect(x, y, T, 1);
        if (i % 2 === 0) { c.fillStyle = R.stoneDark; c.beginPath(); c.moveTo(x + 4, y + 4.5); c.lineTo(x + 14, y + 4.5); c.lineTo(x + 9, y + 12); c.closePath(); c.fill(); }
        break;
      }
      case 'scaffold': { // andaime de tábuas com escoras em diagonal
        c.fillStyle = '#4a3624'; c.fillRect(x, y, T, 3.5); c.fillStyle = '#86663e'; c.fillRect(x, y, T, 1);
        line(x + 2, y + 3.5, x + T - 2, y + 16, 1, '#3a2a1a'); line(x + T - 2, y + 3.5, x + 2, y + 16, 1, '#3a2a1a');
        break;
      }
      case 'grate': { // grelha de ferro (Forjas)
        c.fillStyle = '#3a2c26'; c.fillRect(x, y, T, 4); c.fillStyle = '#8a6a50'; c.fillRect(x, y, T, 1);
        c.strokeStyle = '#1a1210'; c.lineWidth = 0.8; for (let j = 2; j < T; j += 4) { c.beginPath(); c.moveTo(x + j, y + 1); c.lineTo(x + j, y + 4); c.stroke(); }
        if (lEnd || rEnd) line(lEnd ? x + 3 : x + T - 3, y, lEnd ? x + 3 : x + T - 3, y - 40, 1, '#1a1210');
        break;
      }
      case 'girder': { // viga de ferro rebitada
        c.fillStyle = '#3c3a40'; c.fillRect(x, y, T, 5); c.fillStyle = '#7a7884'; c.fillRect(x, y, T, 1);
        c.fillStyle = '#1e1c22'; c.fillRect(x, y + 4, T, 1);
        c.fillStyle = '#9a98a4'; for (const rx of [x + 3, x + 10, x + 17]) { c.beginPath(); c.arc(rx, y + 2.6, 0.7, 0, U.TAU); c.fill(); }
        break;
      }
      case 'chaingrate': { // grelha pendurada de correntes, brasa por baixo
        c.fillStyle = '#2e2420'; c.fillRect(x, y, T, 3.5); c.fillStyle = '#a07050'; c.fillRect(x, y, T, 0.8);
        c.fillStyle = 'rgba(255,110,40,0.25)'; c.fillRect(x + 1, y + 3.5, T - 2, 1);
        if (lEnd || rEnd) for (let j = 0; j < 8; j++) { c.strokeStyle = '#4a4048'; c.lineWidth = 0.7; c.beginPath(); c.ellipse(lEnd ? x + 3 : x + T - 3, y - 3 - j * 5, 1.2, 2.4, 0, 0, U.TAU); c.stroke(); }
        break;
      }
      case 'log': { // tronco tombado com musgo
        c.fillStyle = '#3a3020'; c.beginPath(); c.ellipse(x + T / 2, y + 2.5, T * 0.58, 2.8, 0, 0, U.TAU); c.fill();
        c.fillStyle = '#5a7a40'; c.fillRect(x + 1, y - 0.5, T - 2, 1.3);
        if (rEnd) { c.fillStyle = '#4e7a46'; c.beginPath(); c.ellipse(x + T + 2, y + 1, 4, 2, 0.5, 0, U.TAU); c.fill(); }
        break;
      }
      case 'lily': { // folhas de nenúfar gigantes, uma por tile, ligeiramente desencontradas
        const o = ((tx * 13) % 5) - 2;
        c.fillStyle = '#2e5a32'; c.beginPath(); c.ellipse(x + T / 2 + o, y + 1.8, T * 0.6, 2.6, 0, 0, U.TAU); c.fill();
        c.fillStyle = '#5e9a54'; c.beginPath(); c.ellipse(x + T / 2 + o, y + 1.2, T * 0.56, 1.8, 0, 0, U.TAU); c.fill();
        c.strokeStyle = '#2e5a32'; c.lineWidth = 0.6; c.beginPath(); c.moveTo(x + T / 2 + o, y + 1.2); c.lineTo(x + T / 2 + o + 6, y + 0.4); c.stroke();
        if (i === Math.floor(n / 2)) { c.fillStyle = '#e8d8f0'; c.beginPath(); c.ellipse(x + 6, y - 0.6, 2, 1.4, 0, 0, U.TAU); c.fill(); }
        break;
      }
      case 'fungus': { // prateleira de cogumelos (chapéus sobrepostos)
        c.fillStyle = '#6a4a3a'; c.beginPath(); c.ellipse(x + T / 2, y + 2, T * 0.62, 3, 0, Math.PI, 0); c.fill();
        c.fillStyle = '#a07a5a'; c.fillRect(x + 1, y, T - 2, 1);
        c.fillStyle = 'rgba(230,220,180,0.7)'; for (const fx of [x + 5, x + 13]) { c.beginPath(); c.arc(fx, y + 1.2, 0.8, 0, U.TAU); c.fill(); }
        c.fillStyle = 'rgba(150,240,170,0.15)'; c.fillRect(x, y + 2, T, 2);
        break;
      }
      case 'bellbeam': { // viga de carvalho do sinal dos sinos, parafusos de bronze
        c.fillStyle = '#4a3420'; c.fillRect(x, y, T, 5); c.fillStyle = '#86603a'; c.fillRect(x, y, T, 1.2);
        c.fillStyle = '#b08a48'; c.beginPath(); c.arc(x + T / 2, y + 2.8, 1.1, 0, U.TAU); c.fill();
        if (lEnd || rEnd) { c.fillStyle = '#3a2818'; c.fillRect(lEnd ? x : x + T - 4, y + 5, 4, 8); }
        break;
      }
      case 'gallery': { // galeria de madeira com balaústres
        c.fillStyle = '#3e2a1a'; c.fillRect(x, y, T, 4); c.fillStyle = '#7e5a38'; c.fillRect(x, y, T, 1);
        line(x, y - 10, x + T, y - 10, 1.2, '#5a3e26');
        for (const bx of [x + 4, x + 10, x + 16]) { c.fillStyle = '#4e3420'; c.fillRect(bx - 0.8, y - 10, 1.6, 10); }
        break;
      }
      case 'ropeplank': { // tábua pendurada de cordas grossas
        c.fillStyle = '#5a4026'; c.fillRect(x, y, T, 3.5); c.fillStyle = '#9a7448'; c.fillRect(x, y, T, 0.9);
        if (lEnd || rEnd) { const rx = lEnd ? x + 2 : x + T - 2; line(rx, y, rx + (lEnd ? 1 : -1), y - 70, 1.3, '#7a6a50'); line(rx, y, rx + (lEnd ? 1 : -1), y - 70, 0.5, '#a8987a'); }
        break;
      }
      case 'ledge': { // saliência de pedra (catedral / santuário)
        c.fillStyle = R.stone; c.fillRect(x, y, T, 5); c.fillStyle = R.topAccent; c.fillRect(x, y, T, 1);
        c.fillStyle = U.rgba('#000', 0.3); c.fillRect(x, y + 4, T, 1);
        if (lEnd) { c.fillStyle = R.stone; c.beginPath(); c.moveTo(x, y + 5); c.lineTo(x + 7, y + 5); c.lineTo(x + 2, y + 10); c.closePath(); c.fill(); }
        if (rEnd) { c.fillStyle = R.stone; c.beginPath(); c.moveTo(x + T, y + 5); c.lineTo(x + T - 7, y + 5); c.lineTo(x + T - 2, y + 10); c.closePath(); c.fill(); }
        break;
      }
      case 'trefoil': { // saliência com arquinhos góticos (trevos) por baixo e friso dourado
        c.fillStyle = R.stone; c.fillRect(x, y, T, 4.5); c.fillStyle = '#c8a860'; c.fillRect(x, y, T, 0.9);
        c.fillStyle = R.stoneDark; c.beginPath(); c.arc(x + T / 2, y + 4.5, 4, 0, Math.PI); c.fill();
        c.fillStyle = 'rgba(0,0,0,0.5)'; c.beginPath(); c.arc(x + T / 2, y + 4.5, 2.2, 0, Math.PI); c.fill();
        break;
      }
      case 'loft': { // coro de madeira com corrimão
        c.fillStyle = '#3a2618'; c.fillRect(x, y, T, 4.5); c.fillStyle = '#7a5434'; c.fillRect(x, y, T, 1);
        line(x, y - 8, x + T, y - 8, 1.4, '#6a4428'); if (i % 2 === 0) line(x + T / 2, y, x + T / 2, y - 8, 1.2, '#4e3220');
        break;
      }
      case 'marble': { // mármore claro com orla de ouro (palácio)
        c.fillStyle = '#6a6070'; c.fillRect(x, y, T, 5); c.fillStyle = '#d8d0d8'; c.fillRect(x, y, T, 1.2); c.fillStyle = '#c8a050'; c.fillRect(x, y + 4, T, 1);
        line(x + (tx * 5) % 15 + 2, y + 1.5, x + (tx * 5) % 15 + 6, y + 3.6, 0.4, 'rgba(255,255,255,0.35)');
        break;
      }
      case 'carpet': { // varanda de madeira com passadeira vermelha
        c.fillStyle = '#3a2416'; c.fillRect(x, y, T, 5); c.fillStyle = '#8a1a24'; c.fillRect(x, y - 0.5, T, 2); c.fillStyle = '#d0a040'; c.fillRect(x, y + 1.3, T, 0.5);
        break;
      }
      case 'gilt': { // prateleira de pedra com mísula dourada
        c.fillStyle = R.stone; c.fillRect(x, y, T, 4); c.fillStyle = R.topAccent; c.fillRect(x, y, T, 1);
        if (i % 3 === 1 || n < 3) { c.fillStyle = '#b08a40'; c.beginPath(); c.moveTo(x + 6, y + 4); c.quadraticCurveTo(x + 6, y + 11, x + 12, y + 12); c.lineTo(x + 14, y + 4); c.closePath(); c.fill(); }
        break;
      }
      default: { c.fillStyle = R.stone; c.fillRect(x, y, T, 5); c.fillStyle = R.topAccent; c.fillRect(x, y, T, 1); }
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
