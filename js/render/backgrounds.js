// Vesperal — fundos em paralaxe gerados proceduralmente, um estilo por região
'use strict';
(function (VS) {
  const U = VS.U;
  const LW = 960, LH = 360, BS = 1.5; // largura lógica do padrão, altura, escala de rasterização
  const cache = {}, skyG = {};

  // ---------- primitivas arquitetónicas ----------
  function spire(c, x, base, w, h, col) {
    c.fillStyle = col; c.beginPath();
    c.moveTo(x - w / 2, base); c.lineTo(x - w / 2, base - h * 0.55); c.lineTo(x - w * 0.3, base - h * 0.6);
    c.lineTo(x, base - h); c.lineTo(x + w * 0.3, base - h * 0.6); c.lineTo(x + w / 2, base - h * 0.55); c.lineTo(x + w / 2, base); c.closePath(); c.fill();
    c.fillRect(x - 0.6, base - h - 8, 1.2, 8); c.fillRect(x - 3, base - h - 5, 6, 1.2); // cruz
  }
  function house(c, x, base, w, h, col, win, rnd, roofH) {
    roofH = roofH || w * 0.6;
    c.fillStyle = col; c.fillRect(x, base - h, w, h);
    c.beginPath(); c.moveTo(x - 3, base - h); c.lineTo(x + w / 2, base - h - roofH); c.lineTo(x + w + 3, base - h); c.closePath(); c.fill();
    if (rnd() < 0.6) { const cx = x + w * (0.2 + rnd() * 0.5); c.fillRect(cx, base - h - roofH * 0.8, 5, roofH * 0.6); }
    if (rnd() < 0.25) { // telhado partido
      c.globalCompositeOperation = 'destination-out'; c.beginPath(); c.moveTo(x + w * 0.5, base - h - roofH); c.lineTo(x + w * 0.75, base - h - roofH * 0.3); c.lineTo(x + w * 0.55, base - h - roofH * 0.45); c.closePath(); c.fill(); c.globalCompositeOperation = 'source-over';
    }
    if (win) {
      const cols = Math.max(1, Math.floor(w / 14)), rows = Math.max(1, Math.floor(h / 22));
      for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
        if (rnd() < 0.55) continue;
        const wx = x + 5 + i * (w - 8) / cols, wy = base - h + 8 + j * 22;
        const lit = rnd() < 0.45;
        c.fillStyle = lit ? win : U.rgba('#000000', 0.5);
        c.beginPath(); c.moveTo(wx, wy + 10); c.lineTo(wx, wy + 3); c.quadraticCurveTo(wx + 2.5, wy - 1, wx + 5, wy + 3); c.lineTo(wx + 5, wy + 10); c.closePath(); c.fill();
        if (lit) { c.fillStyle = U.rgba(win, 0.15); c.fillRect(wx - 4, wy - 4, 13, 18); }
      }
    }
  }
  function arch(c, x, base, w, h, thick, col) {
    c.fillStyle = col; c.beginPath();
    c.moveTo(x, base); c.lineTo(x, base - h + w / 2); c.quadraticCurveTo(x, base - h - w * 0.15, x + w / 2, base - h - w * 0.25);
    c.quadraticCurveTo(x + w, base - h - w * 0.15, x + w, base - h + w / 2); c.lineTo(x + w, base);
    c.lineTo(x + w - thick, base); c.lineTo(x + w - thick, base - h + w / 2); c.quadraticCurveTo(x + w - thick, base - h + thick * 0.2, x + w / 2, base - h + thick * 0.3 - w * 0.12);
    c.quadraticCurveTo(x + thick, base - h + thick * 0.2, x + thick, base - h + w / 2); c.lineTo(x + thick, base); c.closePath(); c.fill();
  }
  function column(c, x, top, base, w, col, capCol) {
    c.fillStyle = col; c.fillRect(x - w / 2, top, w, base - top);
    c.fillStyle = capCol || col; c.fillRect(x - w / 2 - 3, top, w + 6, 4); c.fillRect(x - w / 2 - 3, base - 5, w + 6, 5);
    c.fillStyle = U.rgba('#000000', 0.25); c.fillRect(x + w / 6, top + 4, w / 3, base - top - 9);
  }
  function lancetWindow(c, x, y, w, h, glass, frame) {
    c.fillStyle = glass; c.beginPath(); c.moveTo(x, y + h); c.lineTo(x, y + w * 0.6); c.quadraticCurveTo(x, y, x + w / 2, y - w * 0.2); c.quadraticCurveTo(x + w, y, x + w, y + w * 0.6); c.lineTo(x + w, y + h); c.closePath(); c.fill();
    c.strokeStyle = frame; c.lineWidth = 1.2; c.stroke();
    c.beginPath(); c.moveTo(x + w / 2, y - w * 0.15); c.lineTo(x + w / 2, y + h); for (let yy = y + w * 0.6; yy < y + h; yy += 10) { c.moveTo(x, yy); c.lineTo(x + w, yy); } c.stroke();
  }
  function fogGrad(c, col, y0, y1, a) {
    const g = c.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, U.rgba(col, 0)); g.addColorStop(1, U.rgba(col, a));
    c.fillStyle = g; c.fillRect(0, y0, LW, y1 - y0);
  }
  function chain(c, x, y0, y1, col) {
    c.strokeStyle = col; c.lineWidth = 1.3;
    for (let y = y0; y < y1; y += 5) { c.beginPath(); c.ellipse(x, y, 1.6, 2.6, 0, 0, U.TAU); c.stroke(); }
  }
  function bellShape(c, x, y, s, col) {
    c.fillStyle = col; c.beginPath();
    c.moveTo(x - s * 0.25, y); c.quadraticCurveTo(x - s * 0.3, y + s * 0.5, x - s * 0.5, y + s * 0.85); c.lineTo(x + s * 0.5, y + s * 0.85);
    c.quadraticCurveTo(x + s * 0.3, y + s * 0.5, x + s * 0.25, y); c.quadraticCurveTo(x, y - s * 0.12, x - s * 0.25, y); c.fill();
    c.fillRect(x - s * 0.55, y + s * 0.82, s * 1.1, s * 0.07);
  }
  function tree(c, x, base, h, col, rnd) {
    c.strokeStyle = col; c.lineCap = 'round';
    const branch = (x0, y0, ang, len, wd, depth) => {
      const x1 = x0 + Math.cos(ang) * len, y1 = y0 + Math.sin(ang) * len;
      c.lineWidth = wd; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke();
      if (depth > 0) { branch(x1, y1, ang - 0.4 - rnd() * 0.3, len * 0.72, wd * 0.65, depth - 1); branch(x1, y1, ang + 0.35 + rnd() * 0.3, len * 0.7, wd * 0.65, depth - 1); }
    };
    branch(x, base, -Math.PI / 2 + (rnd() - 0.5) * 0.2, h * 0.38, h * 0.06, 5);
  }

  // ---------- estilos ----------
  const STYLES = {};
  STYLES.city = function (R, layers) {
    layers.push({ p: 0.08, draw(c, rnd) {
      for (let i = 0; i < 9; i++) spire(c, rnd() * LW, 300, 18 + rnd() * 20, 90 + rnd() * 120, U.mix(R.fog, R.sky[1], 0.55));
      spire(c, LW * 0.6, 300, 50, 230, U.mix(R.fog, R.sky[1], 0.45)); // catedral distante
      c.fillStyle = U.mix(R.fog, R.sky[1], 0.5); c.fillRect(0, 290, LW, 70);
      fogGrad(c, R.fog, 150, 360, 0.6);
    } });
    layers.push({ p: 0.25, draw(c, rnd) {
      let x = -10; while (x < LW) { const w = 30 + rnd() * 40; house(c, x, 330, w, 60 + rnd() * 80, U.mix(R.stoneDark, R.fog, 0.35), '#ff9040', rnd); x += w + rnd() * 6; }
      c.fillStyle = U.mix(R.stoneDark, R.fog, 0.35); c.fillRect(0, 328, LW, 40);
      fogGrad(c, R.fog, 250, 360, 0.45);
    } });
    layers.push({ p: 0.5, draw(c, rnd) {
      let x = 0; while (x < LW) { const w = 50 + rnd() * 60; if (rnd() < 0.7) house(c, x, 360, w, 90 + rnd() * 90, U.mix(R.stoneDark, '#000000', 0.2), '#ffaa50', rnd, w * 0.8); else arch(c, x, 360, w, 120, 8, R.stoneDark); x += w + 20 + rnd() * 50; }
      fogGrad(c, R.fog, 300, 360, 0.25);
    } });
  };
  STYLES.sanct = function (R, layers) {
    layers.push({ p: 0.1, draw(c, rnd) {
      c.fillStyle = U.mix(R.stoneDark, R.fog, 0.5);
      for (let i = 0; i < 6; i++) arch(c, i * 160 + 10, 360, 140, 260, 20, c.fillStyle);
      const g = c.createRadialGradient(LW * 0.5, 230, 10, LW * 0.5, 230, 260); g.addColorStop(0, 'rgba(255,170,80,0.35)'); g.addColorStop(1, 'rgba(255,120,40,0)'); c.fillStyle = g; c.fillRect(0, 0, LW, LH);
      fogGrad(c, R.fog, 200, 360, 0.5);
    } });
    layers.push({ p: 0.35, draw(c, rnd) {
      for (let i = 0; i < 7; i++) column(c, i * 140 + 40, 40, 360, 22, U.mix(R.stoneDark, '#000000', 0.1), R.stone);
      for (let i = 0; i < 20; i++) { const x = rnd() * LW, y = 300 + rnd() * 50; c.fillStyle = '#e8d8b0'; c.fillRect(x, y, 2, 6); c.fillStyle = 'rgba(255,200,100,0.5)'; c.beginPath(); c.arc(x + 1, y - 1, 2, 0, U.TAU); c.fill(); }
    } });
  };
  STYLES.ramparts = function (R, layers) {
    layers.push({ p: 0.06, draw(c, rnd) {
      c.fillStyle = U.mix(R.fog, R.sky[1], 0.6); c.beginPath(); c.moveTo(0, 360);
      for (let x = 0; x <= LW; x += 40) c.lineTo(x, 200 + Math.sin(x * 0.011) * 40 + rnd() * 30);
      c.lineTo(LW, 360); c.fill();
      for (let i = 0; i < 4; i++) { const x = rnd() * LW; c.fillRect(x, 160, 14, 80); c.beginPath(); c.moveTo(x - 3, 160); c.lineTo(x + 7, 135); c.lineTo(x + 17, 160); c.fill(); }
      fogGrad(c, R.fog, 160, 360, 0.6);
    } });
    layers.push({ p: 0.3, draw(c, rnd) {
      const col = U.mix(R.stoneDark, R.fog, 0.3); c.fillStyle = col;
      c.fillRect(0, 250, LW, 110);
      for (let x = 0; x < LW; x += 18) c.fillRect(x, 238, 10, 14);
      for (let i = 0; i < 3; i++) { const x = 100 + i * 320 + rnd() * 60; c.fillRect(x, 140, 50, 120); for (let k = 0; k < 4; k++) c.fillRect(x + k * 14, 128, 9, 14);
        c.fillStyle = '#2a1012'; c.beginPath(); c.moveTo(x + 25, 140); c.lineTo(x + 25, 175); c.lineTo(x + 40, 168); c.lineTo(x + 25, 160); c.fill(); c.fillStyle = col;
        c.fillStyle = 'rgba(255,200,120,0.6)'; c.fillRect(x + 22, 190, 6, 10); c.fillStyle = col; }
      fogGrad(c, R.fog, 230, 360, 0.4);
    } });
    layers.push({ p: 0.55, draw(c, rnd) {
      for (let i = 0; i < 4; i++) arch(c, i * 250 + rnd() * 60, 360, 110, 160, 16, R.stoneDark);
      fogGrad(c, R.fog, 300, 360, 0.25);
    } });
  };
  STYLES.forge = function (R, layers) {
    layers.push({ p: 0.08, draw(c, rnd) {
      const g = c.createLinearGradient(0, 200, 0, 360); g.addColorStop(0, 'rgba(255,80,10,0)'); g.addColorStop(1, 'rgba(255,90,20,0.55)'); c.fillStyle = g; c.fillRect(0, 200, LW, 160);
      c.fillStyle = U.mix(R.stoneDark, R.fog, 0.4);
      for (let i = 0; i < 18; i++) { const x = rnd() * LW, w = 10 + rnd() * 30, h = 30 + rnd() * 110; c.beginPath(); c.moveTo(x - w, 0); c.lineTo(x, h); c.lineTo(x + w, 0); c.fill(); }
      for (let i = 0; i < 5; i++) chain(c, rnd() * LW, 0, 120 + rnd() * 140, U.mix(R.stoneDark, R.fog, 0.5));
    } });
    layers.push({ p: 0.3, draw(c, rnd) {
      for (let i = 0; i < 5; i++) {
        const x = i * 200 + rnd() * 60, base = 360, w = 90, h = 150 + rnd() * 60;
        c.fillStyle = U.mix(R.stoneDark, '#000000', 0.2); c.fillRect(x, base - h, w, h); c.beginPath(); c.moveTo(x - 10, base - h); c.lineTo(x + w / 2, base - h - 40); c.lineTo(x + w + 10, base - h); c.fill();
        c.fillRect(x + w / 2 - 8, base - h - 120, 16, 90);
        const mg = c.createRadialGradient(x + w / 2, base - 40, 4, x + w / 2, base - 40, 50); mg.addColorStop(0, 'rgba(255,200,80,0.95)'); mg.addColorStop(0.4, 'rgba(255,90,20,0.6)'); mg.addColorStop(1, 'rgba(255,60,0,0)');
        c.fillStyle = mg; c.fillRect(x - 20, base - 100, w + 40, 100);
        c.fillStyle = '#ffb040'; c.beginPath(); c.moveTo(x + w / 2 - 18, base - 20); c.lineTo(x + w / 2 - 18, base - 50); c.quadraticCurveTo(x + w / 2, base - 70, x + w / 2 + 18, base - 50); c.lineTo(x + w / 2 + 18, base - 20); c.fill();
      }
      // engrenagens
      for (let i = 0; i < 3; i++) { const gx = rnd() * LW, gy = 80 + rnd() * 100, r = 25 + rnd() * 20; c.fillStyle = U.mix(R.stoneDark, R.fog, 0.25); c.beginPath(); for (let k = 0; k < 24; k++) { const a = k / 24 * U.TAU, rr = k % 2 ? r : r + 6; c.lineTo(gx + Math.cos(a) * rr, gy + Math.sin(a) * rr); } c.fill(); c.fillStyle = R.stoneDark; c.beginPath(); c.arc(gx, gy, r * 0.35, 0, U.TAU); c.fill(); }
    } });
    layers.push({ p: 0.6, draw(c, rnd) {
      for (let i = 0; i < 4; i++) chain(c, rnd() * LW, 0, 200 + rnd() * 120, '#1a0e0a');
      for (let i = 0; i < 3; i++) { const x = rnd() * LW; c.fillStyle = '#140a08'; c.fillRect(x, 0, 18, 360); c.fillStyle = '#2a1610'; for (let y = 20; y < 360; y += 60) c.fillRect(x - 3, y, 24, 5); }
    } });
  };
  STYLES.garden = function (R, layers) {
    layers.push({ p: 0.07, draw(c, rnd) {
      c.strokeStyle = U.mix(R.fog, R.sky[1], 0.4); c.lineWidth = 2;
      for (let i = 0; i < 3; i++) { const cx = 150 + i * 320 + rnd() * 50, r = 120 + rnd() * 40; c.beginPath(); c.arc(cx, 300, r, Math.PI, 0); c.stroke(); for (let k = 1; k < 8; k++) { const a = Math.PI + k / 8 * Math.PI; c.beginPath(); c.moveTo(cx, 300); c.lineTo(cx + Math.cos(a) * r, 300 + Math.sin(a) * r); c.stroke(); } c.beginPath(); c.arc(cx, 300, r * 0.6, Math.PI, 0); c.stroke(); }
      for (let i = 0; i < 6; i++) tree(c, rnd() * LW, 330, 140 + rnd() * 80, U.mix(R.fog, R.sky[1], 0.5), rnd);
      fogGrad(c, R.fog, 150, 360, 0.6);
    } });
    layers.push({ p: 0.3, draw(c, rnd) {
      c.fillStyle = U.mix(R.stoneDark, R.fog, 0.3);
      for (let i = 0; i < 5; i++) arch(c, i * 200 + rnd() * 40, 340, 120, 180, 14, c.fillStyle);
      c.strokeStyle = '#1c3a26'; c.lineWidth = 1.5;
      for (let i = 0; i < 30; i++) { const x = rnd() * LW, y = rnd() * 100; c.beginPath(); c.moveTo(x, y); c.bezierCurveTo(x + 10, y + 60, x - 10, y + 100, x + rnd() * 10, y + 120 + rnd() * 100); c.stroke(); }
      c.fillStyle = 'rgba(80,160,140,0.18)'; c.fillRect(0, 330, LW, 30);
      fogGrad(c, R.fog, 240, 360, 0.4);
    } });
    layers.push({ p: 0.6, draw(c, rnd) {
      c.fillStyle = '#0a1a12';
      for (let i = 0; i < 14; i++) { const x = rnd() * LW, h = 60 + rnd() * 90; c.beginPath(); c.moveTo(x, 360); c.quadraticCurveTo(x + 20 + rnd() * 30, 360 - h, x + 50 + rnd() * 40, 360 - h * 1.1); c.quadraticCurveTo(x + 20, 360 - h * 0.6, x + 12, 360); c.fill(); }
    } });
  };
  STYLES.tower = function (R, layers) {
    layers.push({ p: 0.04, draw(c, rnd) {
      c.fillStyle = U.mix(R.fog, '#ffffff', 0.08);
      for (let i = 0; i < 14; i++) { const x = rnd() * LW, y = 250 + rnd() * 80, w = 80 + rnd() * 120; c.beginPath(); c.ellipse(x, y, w, 16 + rnd() * 12, 0, 0, U.TAU); c.fill(); }
      for (let i = 0; i < 5; i++) spire(c, rnd() * LW, 330, 14 + rnd() * 10, 80 + rnd() * 80, U.mix(R.fog, R.sky[1], 0.5));
      fogGrad(c, R.fog, 200, 360, 0.5);
    } });
    layers.push({ p: 0.25, draw(c, rnd) {
      const col = U.mix(R.stoneDark, R.fog, 0.25); c.fillStyle = col;
      for (let i = 0; i < 3; i++) { const x = 80 + i * 320 + rnd() * 50; c.fillRect(x, 60, 130, 300); c.fillStyle = '#1a140e'; c.fillRect(x - 10, 60, 150, 8); c.fillRect(x - 10, 180, 150, 6); c.fillStyle = col;
        bellShape(c, x + 65, 80, 70, U.mix('#6a5030', R.fog, 0.3)); c.fillStyle = col; }
    } });
    layers.push({ p: 0.55, draw(c, rnd) {
      c.strokeStyle = '#1a1208'; c.lineWidth = 6;
      for (let i = 0; i < 4; i++) { const x = rnd() * LW; c.beginPath(); c.moveTo(x, 0); c.lineTo(x + (rnd() - 0.5) * 200, 360); c.stroke(); }
      c.lineWidth = 1.2; c.strokeStyle = '#3a2a18';
      for (let i = 0; i < 6; i++) { const x = rnd() * LW; c.beginPath(); c.moveTo(x, 0); c.quadraticCurveTo(x + 10, 180, x - 5, 360); c.stroke(); }
    } });
  };
  STYLES.cathedral = function (R, layers) {
    layers.push({ p: 0.08, draw(c, rnd) {
      c.fillStyle = U.mix(R.stoneDark, R.fog, 0.45);
      for (let i = 0; i < 8; i++) column(c, i * 130 + 30, 0, 360, 26, c.fillStyle, c.fillStyle);
      // rosácea
      const cx = LW * 0.5, cy = 110, r = 70;
      const g = c.createRadialGradient(cx, cy, 5, cx, cy, r); g.addColorStop(0, 'rgba(255,220,140,0.9)'); g.addColorStop(0.5, 'rgba(200,80,180,0.6)'); g.addColorStop(1, 'rgba(60,40,160,0.5)');
      c.fillStyle = g; c.beginPath(); c.arc(cx, cy, r, 0, U.TAU); c.fill();
      c.strokeStyle = U.mix(R.stoneDark, R.fog, 0.3); c.lineWidth = 3;
      for (let k = 0; k < 12; k++) { const a = k / 12 * U.TAU; c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); c.stroke(); }
      c.beginPath(); c.arc(cx, cy, r * 0.45, 0, U.TAU); c.stroke(); c.beginPath(); c.arc(cx, cy, r, 0, U.TAU); c.stroke();
      fogGrad(c, R.fog, 160, 360, 0.55);
    } });
    layers.push({ p: 0.3, draw(c, rnd) {
      const glassCols = ['rgba(220,60,80,0.55)', 'rgba(60,90,220,0.55)', 'rgba(230,180,60,0.55)', 'rgba(120,60,200,0.55)'];
      for (let i = 0; i < 6; i++) { const x = i * 165 + 40; lancetWindow(c, x, 60, 40, 150, rnd.pick(glassCols), '#120a18'); }
      c.fillStyle = U.mix(R.stoneDark, '#000000', 0.2);
      for (let i = 0; i < 7; i++) arch(c, i * 165 - 40, 360, 160, 300, 18, c.fillStyle);
    } });
    layers.push({ p: 0.6, draw(c, rnd) {
      for (let i = 0; i < 5; i++) { const x = rnd() * LW; chain(c, x, 0, 120 + rnd() * 80, '#0e0816'); c.fillStyle = '#100a18'; c.beginPath(); c.ellipse(x, 210, 10, 14, 0, 0, U.TAU); c.fill(); }
    } });
  };
  STYLES.palace = function (R, layers) {
    layers.push({ p: 0.08, draw(c, rnd) {
      for (let i = 0; i < 5; i++) { const x = i * 200 + 40; const g = c.createLinearGradient(0, 40, 0, 300); g.addColorStop(0, 'rgba(255,90,40,0.5)'); g.addColorStop(1, 'rgba(120,20,10,0.3)'); c.fillStyle = g; lancetWindow(c, x, 50, 70, 240, g, '#1a0606'); }
      fogGrad(c, R.fog, 160, 360, 0.55);
    } });
    layers.push({ p: 0.3, draw(c, rnd) {
      for (let i = 0; i < 6; i++) column(c, i * 170 + 70, 20, 360, 30, U.mix(R.stoneDark, '#000000', 0.1), '#5a4020');
      for (let i = 0; i < 5; i++) { // tapeçarias rasgadas
        const x = i * 170 + 120, w = 60, h = 140 + rnd() * 60;
        c.fillStyle = '#4a0e12'; c.beginPath(); c.moveTo(x, 40); c.lineTo(x + w, 40); for (let k = 0; k <= 6; k++) c.lineTo(x + w - k * w / 6, 40 + h - (k % 2) * 18 - rnd() * 20); c.closePath(); c.fill();
        c.fillStyle = '#c09040'; c.fillRect(x, 40, w, 4); c.beginPath(); c.arc(x + w / 2, 90, 10, 0, U.TAU); c.fill();
      }
    } });
    layers.push({ p: 0.6, draw(c, rnd) {
      for (let i = 0; i < 3; i++) { const x = rnd() * LW; chain(c, x, 0, 90, '#120406'); c.fillStyle = '#1a0a08'; c.beginPath(); c.ellipse(x, 100, 40, 8, 0, 0, U.TAU); c.fill(); for (let k = -3; k <= 3; k++) { c.fillRect(x + k * 11 - 1, 86, 2, 12); } }
    } });
  };
  STYLES.crypt = function (R, layers) {
    layers.push({ p: 0.1, draw(c, rnd) {
      c.fillStyle = U.mix(R.stoneDark, R.fog, 0.4); c.fillRect(0, 0, LW, LH);
      for (let y = 30; y < 340; y += 45) for (let x = 10; x < LW; x += 50) { c.fillStyle = '#08080c'; c.beginPath(); c.moveTo(x, y + 30); c.lineTo(x, y + 8); c.quadraticCurveTo(x + 17, y - 6, x + 34, y + 8); c.lineTo(x + 34, y + 30); c.fill();
        if (rnd() < 0.6) { c.fillStyle = '#6a6458'; c.beginPath(); c.arc(x + 17, y + 20, 7, 0, U.TAU); c.fill(); c.fillStyle = '#08080c'; c.fillRect(x + 12, y + 18, 3, 3); c.fillRect(x + 19, y + 18, 3, 3); } }
      fogGrad(c, R.fog, 100, 360, 0.5);
    } });
    layers.push({ p: 0.4, draw(c, rnd) { for (let i = 0; i < 6; i++) arch(c, 5 + i * 160, 360, 150, 250, 20, U.mix(R.stoneDark, '#000000', 0.2)); } });
  };

  function buildRegion(R) {
    const layers = [];
    (STYLES[R.bg] || STYLES.city)(R, layers);
    const rnd = U.rng(U.hash(R.key + 'bg'));
    // resolução das faixas: a da camada de fundo no ecrã (mais nítida num monitor grande), entre 1,5 e 2,25
    const bs = Math.max(BS, Math.min(2.25, (VS.Gfx && VS.Gfx.bgScale) || BS));
    layers.forEach((L) => {
      const can = document.createElement('canvas'); can.width = Math.round(LW * bs); can.height = Math.round(LH * bs);
      const c = can.getContext('2d'); c.scale(can.width / LW, can.height / LH);
      L.draw(c, rnd);
      // ponta-a-ponta: duplicar a borda para emendar
      L.canvas = can;
    });
    return { layers };
  }

  const BG = {};
  // só se guardam os fundos das últimas regiões visitadas (cada uma ocupa várias telas grandes — no telemóvel conta)
  const recent = [];
  BG.get = function (R) {
    if (!cache[R.key]) {
      cache[R.key] = buildRegion(R); recent.push(R.key);
      while (recent.length > 3) { const old = recent.shift(), set = cache[old]; if (set) for (const L of set.layers) { L.canvas.width = 1; L.canvas.height = 1; } delete cache[old]; }
    }
    return cache[R.key];
  };
  BG.drawSky = function (ctx, R, time, vw, vh) {
    vw = vw || U.VIEW_W; vh = vh || U.VIEW_H;
    const k = R.key + vh; let g = skyG[k];
    if (!g) { g = skyG[k] = ctx.createLinearGradient(0, 0, 0, vh); g.addColorStop(0, R.sky[0]); g.addColorStop(0.6, R.sky[1]); g.addColorStop(1, R.sky[2]); }
    ctx.fillStyle = g; ctx.fillRect(0, 0, vw, vh);
  };
  BG.draw = function (ctx, R, cam, roomH, scale, vw, vh) {
    vw = vw || U.VIEW_W; vh = vh || U.VIEW_H;
    const set = BG.get(R);
    for (const L of set.layers) {
      const ox = -((cam.x * L.p) % LW);
      // vertical: alinhar a base do padrão com a base da sala, com paralaxe reduzida
      const maxY = Math.max(0, roomH - vh);
      const oy = maxY > 0 ? (maxY - cam.y) * L.p * 0.5 : 0;
      for (let x = ox - LW; x < vw + LW; x += LW) {
        if (x + LW < 0 || x > vw) continue;
        ctx.drawImage(L.canvas, Math.floor(x), Math.floor(oy), LW + 0.5, LH);
      }
      if (oy > 0) { ctx.fillStyle = R.stoneDark; ctx.fillRect(0, oy + LH - 1, vw, vh); }
    }
  };
  BG.clear = () => { for (const k in cache) delete cache[k]; recent.length = 0; };

  // as regiões podem ser redesenhadas noutro ficheiro (bg_art.js) — expõe o essencial
  BG.STYLES = STYLES; BG.LW = LW; BG.LH = LH; BG.fogGrad = fogGrad;
  VS.BG = BG;
})(window.VS);
