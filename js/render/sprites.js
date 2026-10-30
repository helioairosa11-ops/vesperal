// Vesperal — desenho procedimental do Desperto, projéteis e ícones de itens
'use strict';
(function (VS) {
  const U = VS.U, D2R = Math.PI / 180;
  const S = {};

  // ---------- ajudantes ----------
  S.limb = function (ctx, x0, y0, x1, y1, w0, w1, col) {
    const a = Math.atan2(y1 - y0, x1 - x0), n = a + Math.PI / 2;
    ctx.fillStyle = col; ctx.beginPath();
    ctx.moveTo(x0 + Math.cos(n) * w0, y0 + Math.sin(n) * w0); ctx.lineTo(x1 + Math.cos(n) * w1, y1 + Math.sin(n) * w1);
    ctx.lineTo(x1 - Math.cos(n) * w1, y1 - Math.sin(n) * w1); ctx.lineTo(x0 - Math.cos(n) * w0, y0 - Math.sin(n) * w0); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.arc(x1, y1, w1, 0, U.TAU); ctx.fill();
  };
  // perna com joelho (IK simples de 2 segmentos)
  S.leg = function (ctx, hx, hy, fx, fy, len, bend, w, col) {
    const dx = fx - hx, dy = fy - hy, d = Math.min(Math.hypot(dx, dy), len * 2 - 0.01);
    const a = Math.atan2(dy, dx);
    const k = Math.acos(U.clamp(d / (2 * len), -1, 1)) * bend;
    const kx = hx + Math.cos(a - k) * len, ky = hy + Math.sin(a - k) * len;
    const ex = hx + Math.cos(a) * d, ey = hy + Math.sin(a) * d;
    S.limb(ctx, hx, hy, kx, ky, w, w * 0.85, col);
    S.limb(ctx, kx, ky, ex, ey, w * 0.85, w * 0.7, col);
    return { kx, ky, ex, ey };
  };
  S.glow = function (ctx, x, y, r, col, a) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, U.rgba(col, a === undefined ? 0.8 : a)); g.addColorStop(1, U.rgba(col, 0));
    ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2); ctx.globalCompositeOperation = 'source-over';
  };
  S.eyeGlint = function (ctx, x, y, col, s) { ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(x, y, (s || 1) * 1.3, (s || 1) * 0.7, 0, 0, U.TAU); ctx.fill(); };

  // ---------- o Desperto ----------
  const BODY = '#16151b', CLOAK = '#25232d', CLOAK_EDGE = '#3b3746', MASK = '#e6ddcc', BLADE = '#cfd2da', BLADE_EDGE = '#ffffff';

  S.player = function (ctx, p, game) {
    const st = VS.state;
    const a = p.action;
    // imagens residuais da esquiva
    for (const g of p.afterimages) {
      ctx.globalAlpha = g.a * 0.5; ctx.fillStyle = '#7a70a0';
      ctx.beginPath(); ctx.ellipse(g.x + 6, g.y + (g.crouch ? 22 : 15), 7, g.crouch ? 8 : 14, 0, 0, U.TAU); ctx.fill();
    }
    ctx.globalAlpha = 1;
    if (p.iframes > 0 && p.iframes < 0.9 && !(a && a.type === 'dead') && Math.floor(p.t * 20) % 2 === 0) ctx.globalAlpha = 0.45;
    const dead = a && a.type === 'dead';
    const fx = p.cx, fy = p.bottom, dir = p.dir;
    let sx = 1, sy = 1;
    if (p.landSquash > 0) { sx = 1 + p.landSquash * 0.25; sy = 1 - p.landSquash * 0.2; }
    if (!p.onGround && p.vy < -100) { sx = 0.92; sy = 1.08; }
    // parâmetros da pose
    const run = p.onGround && Math.abs(p.vx) > 15 && !p.crouch;
    const ph = p.runPhase;
    let lean = run ? 0.16 : 0, bob = run ? Math.abs(Math.sin(ph)) * -1.6 : Math.sin(p.t * 2.2) * 0.5;
    let hipY = -14, crouchK = p.crouch ? 1 : 0;
    if (a && a.type === 'dodge') { lean = a.air ? 0.5 : 0.75; crouchK = a.air ? 0.2 : 0.7; }
    if (a && (a.type === 'heal' || a.type === 'rest')) crouchK = 0.85;
    if (a && a.type === 'hurt') lean = -0.3;
    if (a && (a.type === 'attack' || a.type === 'heavy')) {
      if (a.phase === 'wind') lean = a.type === 'heavy' ? -0.18 : -0.06; else if (a.phase === 'act') lean = 0.22; else lean = 0.08;
      if (a.name === 'up') lean = -0.1;
    }
    if (dead) { crouchK = Math.min(1, a.t * 2); lean = Math.min(1.2, a.t * 1.4); }
    hipY = -14 + crouchK * 6;
    const torsoH = 11 - crouchK * 2;

    ctx.save();
    ctx.translate(fx, fy);
    ctx.scale(dir * sx, sy);
    if (dead) ctx.globalAlpha = Math.max(0, 1 - Math.max(0, a.t - 0.6) / 1.2);

    // capa (pontos em coordenadas locais)
    const cl = p.cloak.map((q) => ({ x: (q.x - fx) * dir / sx, y: (q.y - fy) / sy }));
    ctx.fillStyle = CLOAK;
    ctx.beginPath();
    ctx.moveTo(1, hipY - torsoH + 1 + bob);
    for (let i = 1; i < cl.length; i++) ctx.lineTo(cl[i].x - 2 - i * 0.6, cl[i].y);
    const last = cl[cl.length - 1];
    // orla rasgada
    ctx.lineTo(last.x - 6, last.y + 2); ctx.lineTo(last.x - 3, last.y - 1); ctx.lineTo(last.x - 1, last.y + 3); ctx.lineTo(last.x + 2, last.y);
    for (let i = cl.length - 1; i >= 1; i--) ctx.lineTo(cl[i].x + 3 + i * 0.3, cl[i].y);
    ctx.lineTo(4, hipY - torsoH + 2 + bob);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = CLOAK_EDGE; ctx.lineWidth = 0.8; ctx.stroke();

    ctx.rotate(lean * 0.35);
    // pernas
    let lf = { x: -3, y: 0 }, rf = { x: 3, y: 0 };
    if (run) { lf = { x: Math.sin(ph) * 7, y: Math.min(0, Math.cos(ph) * 4) }; rf = { x: -Math.sin(ph) * 7, y: Math.min(0, -Math.cos(ph) * 4) }; }
    if (!p.onGround && !(a && a.type === 'dodge')) { if (p.vy < 0) { lf = { x: 3, y: -6 }; rf = { x: -4, y: -3 }; } else { lf = { x: 2, y: 1 }; rf = { x: -3, y: -1 }; } }
    if (p.crouch || crouchK > 0.5) { lf = { x: 6, y: 0 }; rf = { x: -5, y: 0 }; }
    if (a && a.type === 'dodge' && !a.air) { lf = { x: 8, y: 0 }; rf = { x: -9, y: -1 }; }
    if (a && a.type === 'dodge' && a.air) { lf = { x: -6, y: -4 }; rf = { x: -10, y: -6 }; }
    if (a && a.type === 'attack' && a.phase !== 'wind' && p.onGround && !p.crouch) { lf = { x: 7, y: 0 }; rf = { x: -6, y: 0 }; }
    if (a && a.type === 'heavy') { lf = { x: 8, y: 0 }; rf = { x: -7, y: 0 }; }
    if (p.wallDir) { lf = { x: 5, y: -4 }; rf = { x: 3, y: 0 }; }
    const hip = { x: 0, y: hipY + bob };
    S.leg(ctx, hip.x - 1, hip.y, rf.x, rf.y, 7.5, -1, 2.2, '#101015');
    // torso
    ctx.fillStyle = BODY;
    ctx.beginPath();
    ctx.moveTo(-4.5, hip.y + 1); ctx.lineTo(-4, hip.y - torsoH); ctx.quadraticCurveTo(0, hip.y - torsoH - 2.5, 4.5, hip.y - torsoH);
    ctx.lineTo(5, hip.y + 1); ctx.quadraticCurveTo(0, hip.y + 4, -4.5, hip.y + 1); ctx.fill();
    ctx.fillStyle = '#3a3040'; ctx.fillRect(-4.6, hip.y - 1.5, 9.4, 1.6); // cinto
    S.leg(ctx, hip.x + 1, hip.y, lf.x, lf.y, 7.5, -1, 2.3, BODY);
    // brasa no peito
    const emb = 0.7 + Math.sin(p.t * 4) * 0.15 + p.healGlow;
    ctx.fillStyle = '#ffb060'; ctx.beginPath(); ctx.arc(1.5, hip.y - torsoH + 4, 1.3, 0, U.TAU); ctx.fill();
    // cabeça: capuz + máscara
    const hx = 1.5 + (lean > 0.3 ? 2 : 0), hy = hip.y - torsoH - 5.5;
    ctx.fillStyle = CLOAK;
    ctx.beginPath(); ctx.moveTo(hx - 6, hy + 5); ctx.quadraticCurveTo(hx - 7, hy - 6, hx, hy - 7.5); ctx.quadraticCurveTo(hx + 6.5, hy - 6, hx + 5.5, hy + 4);
    ctx.lineTo(hx - 2, hy + 6); ctx.closePath(); ctx.fill();
    // ponta do capuz caída para trás
    ctx.beginPath(); ctx.moveTo(hx - 4, hy - 5); ctx.quadraticCurveTo(hx - 11, hy - 3 + Math.sin(p.t * 3) * 0.6, hx - 10, hy + 3); ctx.lineTo(hx - 5, hy + 1); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = CLOAK_EDGE; ctx.lineWidth = 0.6; ctx.stroke();
    // máscara
    ctx.fillStyle = MASK; ctx.beginPath(); ctx.ellipse(hx + 1.8, hy + 0.5, 3.4, 4.3, 0.1, 0, U.TAU); ctx.fill();
    ctx.fillStyle = '#1a1418'; ctx.beginPath(); ctx.ellipse(hx + 3.2, hy - 0.3, 0.9, 1.6, 0.2, 0, U.TAU); ctx.fill();
    ctx.beginPath(); ctx.moveTo(hx + 2.6, hy + 2.5); ctx.lineTo(hx + 3.8, hy + 4); ctx.lineWidth = 0.5; ctx.strokeStyle = '#8a7a70'; ctx.stroke();
    // braço traseiro (sombra) quando a curar/descansar: segura um círio
    if (a && a.type === 'heal') {
      ctx.fillStyle = '#e8dcc0'; ctx.fillRect(5, hip.y - 8, 2, 5);
      ctx.restore();
      S.glow(ctx, fx + dir * 6, fy + hip.y - 9, 14 + Math.sin(p.t * 20) * 2, '#ffc070', 0.7);
      ctx.save(); ctx.translate(fx, fy); ctx.scale(dir * sx, sy);
    }
    ctx.restore();
    // asas de mariposa (salto duplo)
    if (p.wingT > 0) {
      ctx.globalAlpha = p.wingT * 2;
      ctx.fillStyle = '#d8ccb8';
      for (const s of [-1, 1]) { ctx.beginPath(); ctx.ellipse(fx + s * 9, fy - 20, 9, 5, s * 0.6, 0, U.TAU); ctx.fill(); }
      ctx.globalAlpha = 1;
    }
    if (!dead) S.playerSword(ctx, p);
    S.glow(ctx, fx + dir * 1.5, fy - 21, 7 * emb, '#ff9a40', 0.55);
    ctx.globalAlpha = 1;
  };

  S.playerSword = function (ctx, p) {
    const a = p.action, dir = p.dir;
    const s = p.shoulder();
    const ang = p.swordAngle, reach = p.swordReach;
    const b = p.bladePoints(ang, reach);
    // rasto (smear) do golpe
    if (p.smear.length > 1) {
      const heavy = a && a.type === 'heavy';
      const col = heavy ? (a.charged ? '255,170,60' : '255,230,200') : (a.d && a.d.kind === 'riposte' ? '255,240,200' : '220,225,255');
      ctx.save();
      for (let i = 1; i < p.smear.length; i++) {
        const k = i / p.smear.length;
        const a0 = p.smear[i - 1], a1 = p.smear[i];
        const r0 = 12, r1 = 35 + reach;
        ctx.fillStyle = `rgba(${col},${0.55 * k})`;
        ctx.beginPath();
        ctx.moveTo(s.x + dir * Math.cos(a0) * r1, s.y + Math.sin(a0) * r1);
        ctx.lineTo(s.x + dir * Math.cos(a1) * r1, s.y + Math.sin(a1) * r1);
        ctx.lineTo(s.x + dir * Math.cos(a1) * (r1 - 6 - 10 * k), s.y + Math.sin(a1) * (r1 - 6 - 10 * k));
        ctx.lineTo(s.x + dir * Math.cos(a0) * (r1 - 6 - 10 * (k - 0.1)), s.y + Math.sin(a0) * (r1 - 6 - 10 * (k - 0.1)));
        ctx.closePath(); ctx.fill();
      }
      ctx.restore();
    }
    // braço
    const hx = s.x + dir * Math.cos(ang) * (6 + reach), hy = s.y + Math.sin(ang) * (6 + reach);
    S.limb(ctx, s.x, s.y, hx, hy, 1.8, 1.6, '#121116');
    // guarda e punho
    const ca = Math.cos(ang), sa = Math.sin(ang), nx = -sa, ny = ca;
    ctx.strokeStyle = '#4a4050'; ctx.lineWidth = 1.6; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(hx - dir * ca * 3, hy - sa * 3); ctx.lineTo(hx, hy); ctx.stroke();
    ctx.strokeStyle = '#8a7a60'; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(b.x0 + dir * nx * 3, b.y0 + ny * 3); ctx.lineTo(b.x0 - dir * nx * 3, b.y0 - ny * 3); ctx.stroke();
    // lâmina (afunila até à ponta)
    const charged = a && a.type === 'heavy' && a.charged;
    ctx.fillStyle = charged ? '#ffd090' : BLADE;
    ctx.beginPath();
    ctx.moveTo(b.x0 + dir * nx * 1.3, b.y0 + ny * 1.3);
    ctx.lineTo(b.x1 - dir * ca * 3 + dir * nx * 0.8, b.y1 - sa * 3 + ny * 0.8);
    ctx.lineTo(b.x1, b.y1);
    ctx.lineTo(b.x1 - dir * ca * 3 - dir * nx * 0.8, b.y1 - sa * 3 - ny * 0.8);
    ctx.lineTo(b.x0 - dir * nx * 1.3, b.y0 - ny * 1.3);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = BLADE_EDGE; ctx.lineWidth = 0.4; ctx.beginPath(); ctx.moveTo(b.x0, b.y0); ctx.lineTo(b.x1, b.y1); ctx.stroke();
    if (VS.state && VS.state.buffs.oil > 0) S.glow(ctx, (b.x0 + b.x1) / 2, (b.y0 + b.y1) / 2, 18, '#ff8030', 0.5);
    if (charged) S.glow(ctx, b.x1, b.y1, 14, '#ffb040', 0.8);
    // brilho do parry
    if (p.parryFlash > 0) {
      const k = p.parryFlash;
      S.glow(ctx, (b.x0 + b.x1) / 2, (b.y0 + b.y1) / 2, 16 + (a && a.success ? 20 : 0), a && a.success ? '#ffffff' : '#c8d0ff', 0.6 * k);
    }
    if (a && a.type === 'parry' && a.guard) S.glow(ctx, p.cx + dir * 10, p.cy - 6, 14, '#a0b0ff', 0.25);
  };

  // ---------- projéteis ----------
  S.projectile = function (ctx, pr) {
    const x = pr.cx, y = pr.cy;
    const k = pr.kind;
    if (k === 'spark') {
      S.glow(ctx, x, y, 16, '#ff9030', 0.9);
      ctx.fillStyle = '#fff0c0'; ctx.beginPath(); ctx.ellipse(x, y, 5, 3, 0, 0, U.TAU); ctx.fill();
    } else if (k === 'bolt') {
      ctx.save(); ctx.translate(x, y); ctx.rotate(Math.atan2(pr.vy, pr.vx));
      ctx.strokeStyle = '#a89070'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(-9, 0); ctx.lineTo(6, 0); ctx.stroke();
      ctx.fillStyle = '#d0d0d8'; ctx.beginPath(); ctx.moveTo(9, 0); ctx.lineTo(5, -2); ctx.lineTo(5, 2); ctx.fill();
      ctx.fillStyle = '#6a4030'; ctx.fillRect(-10, -2, 3, 4); ctx.restore();
      if (pr.parryable) S.glow(ctx, x, y, 8, '#ffffff', 0.25);
    } else if (k === 'clod') {
      ctx.fillStyle = '#4a3a2e'; ctx.beginPath(); ctx.arc(x, y, pr.w / 2, 0, U.TAU); ctx.fill();
      ctx.fillStyle = '#6a5848'; ctx.beginPath(); ctx.arc(x - 1, y - 1, pr.w / 4, 0, U.TAU); ctx.fill();
    } else if (k === 'ingot' || k === 'molten') {
      S.glow(ctx, x, y, 14, '#ff6010', 0.8);
      ctx.save(); ctx.translate(x, y); ctx.rotate(pr.rot || 0); ctx.fillStyle = '#ffb040'; ctx.fillRect(-pr.w / 2, -pr.h / 2, pr.w, pr.h); ctx.fillStyle = '#fff0a0'; ctx.fillRect(-pr.w / 2 + 1, -pr.h / 2 + 1, pr.w - 2, 1.5); ctx.restore();
    } else if (k === 'note') {
      S.glow(ctx, x, y, 14, pr.color, 0.6);
      ctx.fillStyle = '#fff6d8'; ctx.beginPath(); ctx.ellipse(x - 1, y + 2, 3.2, 2.4, -0.4, 0, U.TAU); ctx.fill();
      ctx.fillRect(x + 1.5, y - 7, 1.2, 9); ctx.beginPath(); ctx.moveTo(x + 2.7, y - 7); ctx.quadraticCurveTo(x + 7, y - 5, x + 5, y - 1); ctx.lineWidth = 1; ctx.strokeStyle = '#fff6d8'; ctx.stroke();
    } else if (k === 'light' || k === 'holy') {
      S.glow(ctx, x, y, pr.w * 1.6, '#ffe8a0', 0.9);
      ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(x, y, pr.w * 0.3, 0, U.TAU); ctx.fill();
    } else if (k === 'glass') {
      ctx.save(); ctx.translate(x, y); ctx.rotate(Math.atan2(pr.vy, pr.vx) + Math.PI / 2);
      ctx.fillStyle = pr.color; ctx.globalAlpha = 0.85; ctx.beginPath(); ctx.moveTo(0, -7); ctx.lineTo(3, 4); ctx.lineTo(-3, 3); ctx.closePath(); ctx.fill(); ctx.globalAlpha = 1; ctx.restore();
    } else if (k === 'seed') {
      ctx.fillStyle = '#5a7a30'; ctx.beginPath(); ctx.ellipse(x, y, pr.w / 2, pr.h / 2 * 0.8, pr.rot || 0, 0, U.TAU); ctx.fill();
      ctx.fillStyle = '#a0d060'; ctx.beginPath(); ctx.arc(x, y, 1.5, 0, U.TAU); ctx.fill();
    } else if (k === 'thorn') {
      ctx.save(); ctx.translate(x, y); ctx.rotate(Math.atan2(pr.vy, pr.vx)); ctx.fillStyle = '#4a5a2a'; ctx.beginPath(); ctx.moveTo(8, 0); ctx.lineTo(-6, -2.5); ctx.lineTo(-6, 2.5); ctx.fill(); ctx.restore();
    } else if (k === 'moth') {
      ctx.fillStyle = '#d8c8a0'; const f = Math.sin(pr.t * 30) * 3;
      ctx.beginPath(); ctx.ellipse(x - 2, y, 3, 1.5 + Math.abs(f) * 0.5, 0.4, 0, U.TAU); ctx.ellipse(x + 2, y, 3, 1.5 + Math.abs(f) * 0.5, -0.4, 0, U.TAU); ctx.fill();
      S.glow(ctx, x, y, 8, '#f0e0a0', 0.4);
    } else if (k === 'wave') {
      ctx.strokeStyle = U.rgba(pr.color, 0.8); ctx.lineWidth = 2.2;
      ctx.beginPath(); ctx.arc(x - Math.sign(pr.vx) * 6, y, pr.h / 2, -0.9, 0.9); if (pr.vx < 0) { ctx.beginPath(); ctx.arc(x + 6, y, pr.h / 2, Math.PI - 0.9, Math.PI + 0.9); } ctx.stroke();
      S.glow(ctx, x, y, pr.h * 0.6, pr.color, 0.3);
    } else if (k === 'fire') {
      S.glow(ctx, x, y, pr.w * 1.4, '#ff5010', 0.9);
      ctx.fillStyle = '#ffd060'; ctx.beginPath(); ctx.arc(x, y, pr.w * 0.35, 0, U.TAU); ctx.fill();
    } else if (k === 'shockwave') {
      ctx.fillStyle = U.rgba(pr.color || '#c0b0a0', 0.75);
      ctx.beginPath(); ctx.moveTo(pr.x, pr.y + pr.h); ctx.quadraticCurveTo(pr.cx, pr.y - 4, pr.x + pr.w, pr.y + pr.h); ctx.fill();
      S.glow(ctx, x, pr.y + pr.h, pr.w, pr.color || '#c0b0a0', 0.35);
    } else if (k === 'judgement') {
      // o Juízo do Rei: um crescente de chama carmesim que corre rente ao chão (núcleo branco na frente, rasto em brasa)
      const dir = Math.sign(pr.vx) || 1, b = pr.y + pr.h, t = pr.t || 0, H = pr.h * 1.45, fx = pr.cx + dir * 8;
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      S.glow(ctx, fx - dir * 6, b - 16, 64, '#ff1020', 0.55);
      // rasto: o chão fica a arder atrás da onda
      const lg = ctx.createLinearGradient(fx, 0, fx - dir * 120, 0); lg.addColorStop(0, 'rgba(255,50,60,0.75)'); lg.addColorStop(0.4, 'rgba(200,10,30,0.35)'); lg.addColorStop(1, 'rgba(90,0,10,0)');
      ctx.fillStyle = lg; ctx.fillRect(dir > 0 ? fx - 120 : fx, b - 3, 120, 3);
      const cres = (h, back, lean, col) => {
        ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(fx - dir * back, b);
        ctx.quadraticCurveTo(fx - dir * back * 0.35, b - h * 0.35, fx + dir * lean, b - h);
        ctx.quadraticCurveTo(fx + dir * 7, b - h * 0.45, fx + dir * 5, b); ctx.closePath(); ctx.fill();
      };
      const fl = Math.sin(t * 31) * 0.06;
      cres(H * (1 + fl), 40, -2, 'rgba(150,0,20,0.55)');
      cres(H * (0.9 - fl), 30, 1, 'rgba(255,30,45,0.75)');
      cres(H * 0.72, 20, 3, 'rgba(255,120,120,0.8)');
      cres(H * 0.5, 12, 4, 'rgba(255,245,240,0.95)');
      // línguas de chama a soltar-se da crista
      for (let i = 0; i < 4; i++) {
        const ph = t * 17 + i * 2.3, ox = fx - dir * (6 + i * 9), hh = H * (0.35 + 0.3 * Math.abs(Math.sin(ph))) * (1 - i * 0.18), w = 4.5 - i * 0.6;
        ctx.fillStyle = `rgba(255,${60 + i * 20},${70 + i * 10},${0.7 - i * 0.12})`;
        ctx.beginPath(); ctx.moveTo(ox - w, b - H * 0.2 * (1 - i * 0.2)); ctx.quadraticCurveTo(ox + Math.sin(ph) * 3, b - H * 0.5 - hh * 0.4, ox - dir * 3 + Math.sin(ph * 1.4) * 4, b - H * 0.3 - hh); ctx.quadraticCurveTo(ox + w, b - H * 0.4, ox + w, b - H * 0.15); ctx.closePath(); ctx.fill();
      }
      ctx.restore();
      return;
    } else if (k === 'scale') {
      // escama iridescente da Mãe-Mariposa: losango que muda de cor e cintila
      const hue = ((pr.hue || 0) + (pr.t || 0) * 220) % 360, rot = (pr.t || 0) * 7 + (pr.hue || 0);
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      S.glow(ctx, x, y, 11, `hsl(${hue},90%,62%)`, 0.55);
      ctx.translate(x, y); ctx.rotate(rot);
      ctx.fillStyle = `hsla(${hue},95%,72%,0.95)`; ctx.beginPath(); ctx.moveTo(0, -4.6); ctx.lineTo(2.6, 0); ctx.lineTo(0, 4.6); ctx.lineTo(-2.6, 0); ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.beginPath(); ctx.moveTo(0, -2.4); ctx.lineTo(1, 0); ctx.lineTo(0, 1.2); ctx.lineTo(-1, 0); ctx.closePath(); ctx.fill();
      ctx.restore();
      return;
    } else if (k === 'tongs') {
      // tenaz em brasa da Mestra Hilde: duas mandíbulas de ferro que abrem a ir e fecham a voltar
      const dir = Math.sign(pr.vx) || 1, open = pr.back ? 0.1 : 0.55 + 0.15 * Math.sin((pr.t || 0) * 30);
      ctx.save(); ctx.translate(x, y); ctx.scale(pr.back ? -dir : dir, 1);
      S.glow(ctx, 6, 0, 16, '#ff7020', 0.55);
      ctx.lineCap = 'round';
      for (const sgn of [-1, 1]) {
        ctx.strokeStyle = '#1e1a18'; ctx.lineWidth = 3.4; ctx.beginPath(); ctx.moveTo(-7, 0); ctx.quadraticCurveTo(0, sgn * 5 * open, 8, sgn * 1.6 * open); ctx.stroke();
        ctx.strokeStyle = '#5a4c44'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(-6, sgn * 0.4); ctx.quadraticCurveTo(0, sgn * 4.2 * open, 7, sgn * 1.4 * open); ctx.stroke();
        ctx.fillStyle = '#ffb050'; ctx.beginPath(); ctx.arc(8.4, sgn * 1.6 * open, 1.5, 0, U.TAU); ctx.fill();
      }
      ctx.fillStyle = '#2a2420'; ctx.beginPath(); ctx.arc(-6.5, 0, 2.2, 0, U.TAU); ctx.fill();
      ctx.fillStyle = '#ffd890'; ctx.beginPath(); ctx.arc(-6.5, 0, 0.8, 0, U.TAU); ctx.fill();
      ctx.restore();
      return;
    } else if (k === 'plume') {
      // pena de luz da Seraphine: lâmina de pena dourada com a ráquis clara, a ondular
      const dir = Math.sign(pr.vx) || 1, fl = Math.sin((pr.t || 0) * 18 + pr.y * 0.3) * 0.18;
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      S.glow(ctx, x, y, 13, '#ffe8b0', 0.5);
      ctx.translate(x, y); ctx.scale(dir, 1); ctx.rotate(fl);
      const g = ctx.createLinearGradient(-8, 0, 8, 0); g.addColorStop(0, 'rgba(255,220,150,0.15)'); g.addColorStop(0.6, 'rgba(255,240,205,0.85)'); g.addColorStop(1, 'rgba(255,255,250,0.95)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(-8, 0.6); ctx.quadraticCurveTo(-1, -4.2, 8, -0.4); ctx.quadraticCurveTo(-1, 3.2, -8, 0.6); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = 0.7; ctx.beginPath(); ctx.moveTo(-9, 0.7); ctx.lineTo(8, -0.4); ctx.stroke();
      ctx.restore();
      return;
    } else if (k === 'blast') {
      // rebentamento de chamas do montante cravado (curto): línguas de fogo a subir e a apagar
      const k2 = U.clamp((pr.t || 0) / 0.22, 0, 1), b2 = pr.y + pr.h;
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      S.glow(ctx, x, b2 - 18, 50, '#ff5010', 0.7 * (1 - k2));
      for (let i = 0; i < 7; i++) {
        const ox = x + (i - 3) * 6.5, h = pr.h * (0.55 + 0.45 * Math.sin(i * 1.7 + 1)) * (0.6 + k2 * 0.6), a = (1 - k2) * (i % 3 === 1 ? 0.95 : 0.7);
        ctx.fillStyle = i === 3 ? `rgba(255,245,215,${a})` : `rgba(255,${120 + i * 12},40,${a})`;
        ctx.beginPath(); ctx.moveTo(ox - 6, b2); ctx.quadraticCurveTo(ox - 4, b2 - h * 0.55, ox + Math.sin(i * 2.1) * 3, b2 - h); ctx.quadraticCurveTo(ox + 4, b2 - h * 0.5, ox + 6, b2); ctx.closePath(); ctx.fill();
      }
      ctx.restore();
      return;
    } else if (k === 'feather') {
      ctx.save(); ctx.translate(x, y); ctx.rotate(Math.atan2(pr.vy, pr.vx)); ctx.fillStyle = '#1a1820'; ctx.beginPath(); ctx.ellipse(0, 0, 7, 2, 0, 0, U.TAU); ctx.fill(); ctx.restore();
    } else if (k === 'incense') {
      ctx.fillStyle = 'rgba(160,140,180,0.5)'; ctx.beginPath(); ctx.arc(x, y, pr.w / 2, 0, U.TAU); ctx.fill(); S.glow(ctx, x, y, pr.w, '#ff8040', 0.3);
    } else {
      S.glow(ctx, x, y, pr.w * 1.5, pr.color, 0.8);
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x, y, pr.w * 0.3, 0, U.TAU); ctx.fill();
    }
    if (pr.unblockable) S.glow(ctx, x, y, pr.w * 2, '#ff2020', 0.35);
  };

  VS.Sprites = S;
})(window.VS);
