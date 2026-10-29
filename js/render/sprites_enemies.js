// Vesperal — desenho procedimental dos inimigos (silhuetas animadas, sem formas de protótipo)
'use strict';
(function (VS) {
  const U = VS.U, S = VS.Sprites;
  const E = {};
  const glow = (...a) => S.glow(...a);
  // pose do ataque: {ph:'none'|'wind'|'act'|'rec', k:0..1}
  function pose(e) { const a = e.atk; if (!a) return { ph: 'none', k: 0 }; const d = a.phase === 'wind' ? a.s.wind : a.phase === 'act' ? a.s.act : a.s.rec; return { ph: a.phase, k: Math.min(1, a.t / (d || 1)), name: a.name }; }
  function F(e) { return e.flash > 0 ? () => '#f4ece4' : (c) => c; }
  function begin(ctx, e, sy) { ctx.save(); ctx.translate(e.cx, e.bottom); ctx.scale(e.facing, sy || 1); }
  function walkPhase(e) { return e.anim * (4 + Math.abs(e.vx) * 0.06); }
  function eyes(ctx, x, y, col, n, gap) { for (let i = 0; i < (n || 1); i++) { ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x + i * (gap || 3), y, 1.2, 0, U.TAU); ctx.fill(); } glow(ctx, x, y, 6, col, 0.6); }
  function weaponSwing(p, rest, windA, actA0, actA1, recA) {
    if (p.ph === 'wind') return U.lerp(rest, windA, U.ease.outCubic(p.k));
    if (p.ph === 'act') return U.lerp(actA0, actA1, U.ease.outCubic(p.k));
    if (p.ph === 'rec') return U.lerp(actA1, recA === undefined ? rest : recA, U.ease.inOutQuad(p.k));
    return rest;
  }

  // sinal de ataque: brilho branco (aparável) ou aura vermelha (inaparável)
  E.tell = function (ctx, e, tell) {
    const x = e.cx + e.facing * (e.w * 0.6), y = e.y + 6;
    if (tell.kind === 'white') {
      if (tell.k > 0.35) {
        const k = (tell.k - 0.35) / 0.65;
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        ctx.strokeStyle = `rgba(255,255,255,${0.9 * (1 - Math.abs(k - 0.6))})`; ctx.lineWidth = 1.2;
        const r = 3 + k * 7;
        ctx.beginPath(); ctx.moveTo(x - r, y); ctx.lineTo(x + r, y); ctx.moveTo(x, y - r); ctx.lineTo(x, y + r); ctx.stroke();
        ctx.restore(); glow(ctx, x, y, 12, '#ffffff', 0.6 * k);
      }
    } else if (tell.kind === 'red') {
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      const k = tell.k;
      const g = ctx.createRadialGradient(e.cx, e.cy, 2, e.cx, e.cy, e.w + 14);
      g.addColorStop(0, `rgba(255,30,20,${0.25 * k})`); g.addColorStop(1, 'rgba(255,0,0,0)');
      ctx.fillStyle = g; ctx.fillRect(e.cx - e.w - 14, e.cy - e.w - 14, (e.w + 14) * 2, (e.w + 14) * 2);
      ctx.restore();
      ctx.fillStyle = `rgba(255,60,40,${0.5 + 0.5 * Math.sin(e.t * 30)})`; ctx.beginPath(); ctx.moveTo(e.cx, e.y - 14); ctx.lineTo(e.cx - 3, e.y - 8); ctx.lineTo(e.cx + 3, e.y - 8); ctx.closePath(); ctx.fill();
    }
  };

  // ---------- Cinzento ----------
  E.husk = function (ctx, e) {
    const f = F(e), p = pose(e), wp = walkPhase(e), mv = Math.abs(e.vx) > 5;
    begin(ctx, e);
    const hunch = p.ph === 'wind' ? -0.25 : p.ph === 'act' ? 0.35 : 0.15;
    // pernas
    const l1 = mv ? Math.sin(wp) * 5 : -2, l2 = mv ? -Math.sin(wp) * 5 : 3;
    S.leg(ctx, -1, -12, l2, 0, 7, -1, 2, f('#1c1a1e'));
    ctx.rotate(hunch * 0.5);
    // tronco curvado e farrapos
    ctx.fillStyle = f('#2a272c');
    ctx.beginPath(); ctx.moveTo(-6, -11); ctx.quadraticCurveTo(-8, -24, -1, -28); ctx.quadraticCurveTo(7, -27, 6, -18); ctx.lineTo(5, -10);
    for (let i = 0; i < 4; i++) ctx.lineTo(4 - i * 3.3, -8 + (i % 2) * 3);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = f('#4a4248'); ctx.fillRect(-5, -22, 1, 8); ctx.fillRect(-3, -24, 1, 9);
    // cabeça baixa
    ctx.fillStyle = f('#3a3438'); ctx.beginPath(); ctx.ellipse(5, -27, 4, 4.5, 0.3, 0, U.TAU); ctx.fill();
    eyes(ctx, 7, -27, '#ff8a30');
    // braço com cutelo
    const ang = weaponSwing(p, 0.9, -2.2, -2.2, 1.3, 0.9);
    ctx.save(); ctx.translate(3, -22); ctx.rotate(ang);
    S.limb(ctx, 0, 0, 12, 0, 1.8, 1.5, f('#2a272c'));
    ctx.fillStyle = f('#5a5050'); ctx.beginPath(); ctx.moveTo(12, -2); ctx.lineTo(24, -4); ctx.lineTo(25, 2); ctx.lineTo(12, 2); ctx.closePath(); ctx.fill();
    ctx.restore();
    ctx.restore();
    S.leg(ctx, e.cx - e.facing * 1, e.bottom - 12, e.cx + e.facing * l1, e.bottom, 7, -1, 2.1, f('#242126'));
  };
  // ---------- Rastejante ----------
  E.crawler = function (ctx, e) {
    const f = F(e), wp = walkPhase(e) * 1.6, p = pose(e);
    begin(ctx, e);
    const lift = p.ph === 'wind' ? -3 * p.k : 0;
    ctx.fillStyle = f('#2c282c');
    ctx.beginPath(); ctx.ellipse(0, -6 + lift, 11, 5, -0.1, 0, U.TAU); ctx.fill();
    // espinha dorsal
    ctx.fillStyle = f('#4a4044'); for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.moveTo(-8 + i * 4, -10 + lift); ctx.lineTo(-6 + i * 4, -14 + lift - (i % 2)); ctx.lineTo(-4 + i * 4, -10 + lift); ctx.fill(); }
    // patas
    ctx.strokeStyle = f('#1a181c'); ctx.lineWidth = 1.4;
    for (let i = 0; i < 4; i++) { const ph = wp + i * 1.6; const x = -8 + i * 5; ctx.beginPath(); ctx.moveTo(x, -5); ctx.lineTo(x + Math.sin(ph) * 3 - 2, -9); ctx.lineTo(x + Math.sin(ph) * 4, 0); ctx.stroke(); }
    // cabeça
    ctx.fillStyle = f('#3a3236'); ctx.beginPath(); ctx.ellipse(10, -6 + lift, 4, 3.5, 0, 0, U.TAU); ctx.fill();
    eyes(ctx, 12, -7 + lift, '#ffb050');
    ctx.restore();
  };
  // ---------- Fátuo ----------
  E.wisp = function (ctx, e) {
    const x = e.cx, y = e.cy, t = e.anim, p = pose(e);
    for (let i = 0; i < 5; i++) { const k = i / 5; ctx.fillStyle = `rgba(255,${120 + i * 20},40,${0.5 - k * 0.4})`; ctx.beginPath(); ctx.arc(x - e.vx * 0.04 * i + Math.sin(t * 6 + i) * 1.5, y + i * 3 - e.vy * 0.03 * i, 5 - i * 0.7, 0, U.TAU); ctx.fill(); }
    glow(ctx, x, y, 18 + (p.ph === 'wind' ? p.k * 10 : 0), '#ff8a30', 0.8);
    ctx.fillStyle = e.flash > 0 ? '#fff' : '#ffe8c0'; ctx.beginPath(); ctx.arc(x, y, 4.5, 0, U.TAU); ctx.fill();
    ctx.fillStyle = '#5a2010'; ctx.fillRect(x - 2.5, y - 1.5, 1.6, 2); ctx.fillRect(x + 1, y - 1.5, 1.6, 2); ctx.fillRect(x - 1, y + 1.5, 2, 1);
  };
  // ---------- Sacristão ----------
  E.sexton = function (ctx, e) {
    const f = F(e), p = pose(e), wp = walkPhase(e), mv = Math.abs(e.vx) > 5;
    begin(ctx, e);
    // manto longo
    ctx.fillStyle = f('#201c22');
    ctx.beginPath(); ctx.moveTo(-8, 0); ctx.lineTo(-6, -26); ctx.quadraticCurveTo(0, -32, 6, -26); ctx.lineTo(9, 0);
    for (let i = 0; i < 5; i++) ctx.lineTo(9 - i * 4.2, -2 + (i % 2) * 2 + (mv ? Math.sin(wp + i) : 0));
    ctx.closePath(); ctx.fill();
    // chapéu largo
    ctx.fillStyle = f('#121014'); ctx.beginPath(); ctx.ellipse(1, -32, 10, 2.2, 0, 0, U.TAU); ctx.fill(); ctx.fillRect(-4, -38, 9, 6);
    ctx.fillStyle = f('#d8cfc0'); ctx.beginPath(); ctx.ellipse(3, -28.5, 2.6, 3, 0, 0, U.TAU); ctx.fill();
    ctx.fillStyle = '#000'; ctx.fillRect(3.5, -29.5, 1.2, 1.4);
    // vara com lanterna em corrente
    const ang = weaponSwing(p, 0.5, -2.4, -2.4, 0.9, 0.5);
    ctx.save(); ctx.translate(2, -22); ctx.rotate(ang);
    ctx.strokeStyle = f('#3a2e24'); ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(22, 0); ctx.stroke();
    ctx.strokeStyle = f('#1a1618'); ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(22, 0); ctx.lineTo(30, 4); ctx.stroke();
    ctx.fillStyle = f('#2a2220'); ctx.fillRect(28, 3, 7, 8); ctx.fillStyle = '#ffc070'; ctx.fillRect(29.2, 4.5, 4.6, 5);
    ctx.restore();
    ctx.restore();
    const lx = e.cx + e.facing * 26, ly = e.cy + 2; glow(ctx, lx, ly - 10, 18, '#ffb060', 0.5);
  };
  // ---------- Sentinela ----------
  E.sentinel = function (ctx, e) {
    const f = F(e), p = pose(e), wp = walkPhase(e), mv = Math.abs(e.vx) > 5;
    begin(ctx, e);
    const l1 = mv ? Math.sin(wp) * 5 : 3, l2 = mv ? -Math.sin(wp) * 5 : -4;
    S.leg(ctx, -2, -13, l2, 0, 7, -1, 2.4, f('#1e2228'));
    ctx.fillStyle = f('#2e343c'); ctx.beginPath(); ctx.moveTo(-6, -12); ctx.lineTo(-6, -26); ctx.lineTo(6, -26); ctx.lineTo(7, -12); ctx.closePath(); ctx.fill();
    ctx.fillStyle = f('#46505c'); ctx.fillRect(-6, -26, 13, 2);
    // elmo com penacho
    ctx.fillStyle = f('#3a424c'); ctx.beginPath(); ctx.moveTo(-4, -26); ctx.lineTo(-4, -33); ctx.quadraticCurveTo(1, -37, 6, -33); ctx.lineTo(6, -26); ctx.fill();
    ctx.fillStyle = '#0a0c10'; ctx.fillRect(1, -31, 5, 1.4);
    ctx.fillStyle = f('#6a1a1a'); ctx.beginPath(); ctx.moveTo(0, -35); ctx.quadraticCurveTo(-8, -38 + Math.sin(e.anim * 4), -11, -30); ctx.lineTo(-3, -33); ctx.fill();
    S.leg(ctx, 2, -13, l1, 0, 7, -1, 2.5, f('#262a32'));
    // lança
    const thr = p.name === 'thrust' ? (p.ph === 'wind' ? -6 * p.k : p.ph === 'act' ? -6 + 18 * U.ease.outCubic(p.k) : 12 * (1 - p.k)) : 0;
    ctx.strokeStyle = f('#4a3a2a'); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(-6 + thr, -20); ctx.lineTo(28 + thr, -20); ctx.stroke();
    ctx.fillStyle = f('#c0c4cc'); ctx.beginPath(); ctx.moveTo(28 + thr, -22); ctx.lineTo(36 + thr, -20); ctx.lineTo(28 + thr, -18); ctx.fill();
    // escudo
    const sx = e.guarding ? 8 : 4;
    ctx.fillStyle = f('#38404a'); ctx.beginPath(); ctx.moveTo(sx, -30); ctx.lineTo(sx + 5, -28); ctx.lineTo(sx + 5, -10); ctx.quadraticCurveTo(sx + 3, -4, sx, -3); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = f('#8a96a4'); ctx.lineWidth = 0.8; ctx.stroke();
    ctx.fillStyle = f('#a08040'); ctx.beginPath(); ctx.arc(sx + 2.6, -17, 1.6, 0, U.TAU); ctx.fill();
    ctx.restore();
  };
  // ---------- Besteiro ----------
  E.crossbow = function (ctx, e) {
    const f = F(e), p = pose(e), wp = walkPhase(e), mv = Math.abs(e.vx) > 5;
    begin(ctx, e);
    S.leg(ctx, -1, -12, mv ? -Math.sin(wp) * 5 : -3, 0, 7, -1, 2, f('#1e2228'));
    ctx.fillStyle = f('#2a2e2a'); ctx.beginPath(); ctx.moveTo(-6, -10); ctx.lineTo(-5, -24); ctx.quadraticCurveTo(0, -28, 5, -24); ctx.lineTo(6, -10); ctx.closePath(); ctx.fill();
    ctx.fillStyle = f('#1a1e1a'); ctx.beginPath(); ctx.moveTo(-5, -24); ctx.quadraticCurveTo(-4, -33, 2, -32); ctx.quadraticCurveTo(7, -30, 5, -24); ctx.fill();
    ctx.fillStyle = '#000'; ctx.fillRect(1, -28, 4, 2); eyes(ctx, 4, -27, '#c0d0ff');
    S.leg(ctx, 1, -12, mv ? Math.sin(wp) * 5 : 3, 0, 7, -1, 2.1, f('#22262a'));
    // besta
    ctx.save(); ctx.translate(6, -18);
    ctx.fillStyle = f('#3a2a1e'); ctx.fillRect(-4, -1, 16, 2.4);
    ctx.strokeStyle = f('#2a2018'); ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(10, -6); ctx.quadraticCurveTo(13, 0, 10, 6); ctx.stroke();
    ctx.strokeStyle = '#a0a0a0'; ctx.lineWidth = 0.4; ctx.beginPath(); ctx.moveTo(10, -6); ctx.lineTo(p.ph === 'wind' ? 2 : 6, 0); ctx.lineTo(10, 6); ctx.stroke();
    ctx.restore();
    ctx.restore();
    if (p.ph === 'wind') { ctx.strokeStyle = `rgba(255,255,255,${0.15 + p.k * 0.25})`; ctx.setLineDash([2, 5]); ctx.lineWidth = 0.6; ctx.beginPath(); ctx.moveTo(e.cx + e.facing * 18, e.y + 12); ctx.lineTo(e.cx + e.facing * 300, e.y + 12); ctx.stroke(); ctx.setLineDash([]); }
  };
  // ---------- Cão de Cinza ----------
  E.hound = function (ctx, e) {
    const f = F(e), p = pose(e), wp = walkPhase(e) * 1.4, mv = Math.abs(e.vx) > 5;
    begin(ctx, e);
    const crouch = p.ph === 'wind' ? 3 * p.k : 0;
    ctx.fillStyle = f('#2a2628');
    ctx.beginPath(); ctx.moveTo(-12, -8 + crouch); ctx.quadraticCurveTo(-4, -16 + crouch, 6, -13 + crouch); ctx.lineTo(9, -8 + crouch); ctx.quadraticCurveTo(0, -5 + crouch, -12, -6 + crouch); ctx.fill();
    // costelas
    ctx.strokeStyle = f('#4a4044'); ctx.lineWidth = 0.6; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(-6 + i * 3, -12 + crouch); ctx.lineTo(-5 + i * 3, -7 + crouch); ctx.stroke(); }
    // cabeça
    ctx.fillStyle = f('#322c2e'); ctx.beginPath(); ctx.moveTo(5, -14 + crouch); ctx.lineTo(15, -11 + crouch); ctx.lineTo(14, -8 + crouch); ctx.lineTo(6, -8 + crouch); ctx.fill();
    ctx.beginPath(); ctx.moveTo(6, -14 + crouch); ctx.lineTo(7, -18 + crouch); ctx.lineTo(9, -14 + crouch); ctx.fill();
    eyes(ctx, 10, -12 + crouch, '#ff6030');
    if (p.ph === 'act') { ctx.fillStyle = '#d8d0c0'; ctx.fillRect(12, -9 + crouch, 1, 2); ctx.fillRect(14, -9 + crouch, 1, 2); }
    // patas
    ctx.strokeStyle = f('#1e1a1c'); ctx.lineWidth = 1.8; ctx.lineCap = 'round';
    for (const [x, o] of [[-9, 0], [-6, 1.6], [4, 3.1], [7, 4.7]]) { const ph = wp + o; ctx.beginPath(); ctx.moveTo(x, -8 + crouch); ctx.lineTo(x + (mv ? Math.sin(ph) * 4 : 0), 0); ctx.stroke(); }
    // cauda
    ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(-12, -8 + crouch); ctx.quadraticCurveTo(-17, -12, -18 + Math.sin(e.anim * 6) * 2, -16); ctx.stroke();
    ctx.restore();
  };
  // ---------- Escravo da Forja ----------
  E.thrall = function (ctx, e) {
    const f = F(e), p = pose(e), wp = walkPhase(e), mv = Math.abs(e.vx) > 5;
    begin(ctx, e);
    S.leg(ctx, -3, -14, mv ? -Math.sin(wp) * 5 : -4, 0, 8, -1, 3.2, f('#1e1614'));
    ctx.fillStyle = f('#3a2a24'); ctx.beginPath(); ctx.moveTo(-10, -12); ctx.quadraticCurveTo(-13, -30, -2, -34); ctx.quadraticCurveTo(11, -33, 9, -14); ctx.closePath(); ctx.fill();
    // veias incandescentes
    ctx.strokeStyle = '#ff7020'; ctx.lineWidth = 0.8; ctx.globalAlpha = 0.7 + Math.sin(e.anim * 4) * 0.3; ctx.beginPath(); ctx.moveTo(-6, -28); ctx.lineTo(-3, -20); ctx.lineTo(-6, -14); ctx.moveTo(2, -30); ctx.lineTo(4, -22); ctx.stroke(); ctx.globalAlpha = 1;
    // grilheta e corrente
    ctx.strokeStyle = f('#1a1416'); ctx.lineWidth = 1; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.ellipse(-12 - i * 3, -6 + i * 1.5, 1.4, 2, 0.5, 0, U.TAU); ctx.stroke(); }
    // cabeça com capuz de couro
    ctx.fillStyle = f('#24181a'); ctx.beginPath(); ctx.ellipse(2, -36, 5, 5.5, 0, 0, U.TAU); ctx.fill();
    eyes(ctx, 4, -36, '#ffb040', 2, 2.6);
    S.leg(ctx, 3, -14, mv ? Math.sin(wp) * 5 : 4, 0, 8, -1, 3.4, f('#261c1a'));
    // martelo
    const ang = weaponSwing(p, 0.6, -2.7, -2.7, 1.5, 0.6);
    ctx.save(); ctx.translate(2, -26); ctx.rotate(ang);
    S.limb(ctx, 0, 0, 10, 0, 3, 2.6, f('#3a2a24'));
    ctx.strokeStyle = f('#3a2a1e'); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(10, 0); ctx.lineTo(26, 0); ctx.stroke();
    ctx.fillStyle = f('#2a2422'); ctx.fillRect(24, -7, 9, 14); ctx.fillStyle = '#ff8030'; ctx.fillRect(32, -6, 1.5, 12);
    ctx.restore();
    ctx.restore();
  };
  // ---------- Escória ----------
  E.slag = function (ctx, e) {
    const x = e.cx, y = e.bottom, s = e.small ? 0.6 : 1, t = e.anim;
    const sq = e.onGround ? 1 + Math.sin(t * 8) * 0.06 : 0.85;
    ctx.save(); ctx.translate(x, y); ctx.scale(s / sq, s * sq);
    ctx.fillStyle = e.flash > 0 ? '#fff' : '#ff6a10';
    ctx.beginPath(); ctx.moveTo(-11, 0); ctx.quadraticCurveTo(-12, -12, 0, -14); ctx.quadraticCurveTo(12, -12, 11, 0); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#3a1a10'; for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.ellipse(-7 + i * 3.5, -8 - (i % 2) * 3, 2.6, 1.6, i, 0, U.TAU); ctx.fill(); }
    ctx.fillStyle = '#ffe080'; ctx.beginPath(); ctx.arc(3, -7, 1.4, 0, U.TAU); ctx.arc(-2, -7, 1.4, 0, U.TAU); ctx.fill();
    ctx.restore();
    glow(ctx, x, y - 6, 16 * s, '#ff6010', 0.5);
  };
  // ---------- Fundidor ----------
  E.smelter = function (ctx, e) {
    const f = F(e), p = pose(e), wp = walkPhase(e), mv = Math.abs(e.vx) > 5;
    begin(ctx, e);
    S.leg(ctx, -1, -12, mv ? -Math.sin(wp) * 5 : -3, 0, 7, -1, 2.2, f('#1e1614'));
    ctx.fillStyle = f('#3e2e26'); ctx.beginPath(); ctx.moveTo(-6, -10); ctx.lineTo(-5, -24); ctx.lineTo(6, -24); ctx.lineTo(7, -10); ctx.closePath(); ctx.fill();
    ctx.fillStyle = f('#5a4a3a'); ctx.fillRect(-5, -18, 12, 8); // avental
    ctx.fillStyle = f('#2a2224'); ctx.beginPath(); ctx.ellipse(1, -28, 4.5, 5, 0, 0, U.TAU); ctx.fill();
    ctx.fillStyle = f('#8a8070'); ctx.fillRect(1, -30, 4, 3); ctx.fillStyle = '#ffa040'; ctx.fillRect(1.6, -29.2, 1, 1); ctx.fillRect(3.4, -29.2, 1, 1);
    S.leg(ctx, 1, -12, mv ? Math.sin(wp) * 5 : 3, 0, 7, -1, 2.3, f('#241a18'));
    const ang = weaponSwing(p, 0.8, 2.4, 2.4, -1.4, 0.8);
    ctx.save(); ctx.translate(2, -20); ctx.rotate(ang);
    S.limb(ctx, 0, 0, 9, 0, 1.8, 1.5, f('#3e2e26'));
    ctx.strokeStyle = f('#2a2018'); ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(9, 0); ctx.lineTo(16, 0); ctx.stroke();
    ctx.fillStyle = f('#2a2220'); ctx.beginPath(); ctx.arc(18, 1, 3.4, 0, Math.PI); ctx.fill(); ctx.fillStyle = '#ff8030'; ctx.fillRect(15, 0, 6, 1.2);
    ctx.restore();
    ctx.restore();
  };
  // ---------- Espinheira ----------
  E.thornmaid = function (ctx, e) {
    const f = F(e), p = pose(e), t = e.anim;
    begin(ctx, e);
    // raízes
    ctx.strokeStyle = f('#2a2418'); ctx.lineWidth = 1.6; for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(i * 2, -6); ctx.quadraticCurveTo(i * 5, -2, i * 8, 0); ctx.stroke(); }
    // corpo de casca
    ctx.fillStyle = f('#2e3a24'); ctx.beginPath(); ctx.moveTo(-5, -4); ctx.quadraticCurveTo(-8 + Math.sin(t) * 0.6, -20, -3, -27); ctx.quadraticCurveTo(3, -30, 5, -24); ctx.quadraticCurveTo(6, -12, 5, -4); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = f('#1a2412'); ctx.lineWidth = 0.6; ctx.beginPath(); ctx.moveTo(-3, -8); ctx.lineTo(-1, -20); ctx.moveTo(2, -10); ctx.lineTo(1, -22); ctx.stroke();
    // cabeça-flor
    const open = e.open ? 1 : 0.3;
    for (let i = 0; i < 6; i++) { const a = i / 6 * U.TAU + t * 0.3; ctx.fillStyle = f(i % 2 ? '#8a2a4a' : '#a03a5a'); ctx.beginPath(); ctx.ellipse(1 + Math.cos(a) * 4 * open, -30 + Math.sin(a) * 4 * open, 3.5 * open + 1, 1.8, a, 0, U.TAU); ctx.fill(); }
    ctx.fillStyle = '#f0d070'; ctx.beginPath(); ctx.arc(1, -30, 2, 0, U.TAU); ctx.fill();
    // braço-vinha
    const reach = p.name === 'whip' ? (p.ph === 'act' ? 60 * U.ease.outCubic(p.k) : p.ph === 'rec' ? 60 * (1 - p.k) : 0) : 0;
    ctx.strokeStyle = f('#3a4a24'); ctx.lineWidth = 1.8; ctx.beginPath(); ctx.moveTo(3, -20);
    ctx.quadraticCurveTo(10 + reach * 0.4, -26 + Math.sin(t * 3) * 2, 10 + reach, -18 + Math.sin(t * 2) * 3); ctx.stroke();
    if (reach > 4) { ctx.fillStyle = f('#6a7a3a'); for (let k = 0.3; k < 1; k += 0.2) { ctx.beginPath(); ctx.moveTo(10 + reach * k, -19); ctx.lineTo(11 + reach * k, -23); ctx.lineTo(12 + reach * k, -19); ctx.fill(); } }
    if (p.name === 'burst' && p.ph === 'act') { ctx.fillStyle = f('#4a5a2a'); for (let i = -4; i <= 4; i++) { ctx.beginPath(); ctx.moveTo(i * 8 - 3, 0); ctx.lineTo(i * 8, -16 * U.ease.outBack(p.k)); ctx.lineTo(i * 8 + 3, 0); ctx.fill(); } }
    ctx.restore();
  };
  // ---------- Afogado ----------
  E.drowned = function (ctx, e) {
    const f = F(e), p = pose(e), wp = walkPhase(e), mv = Math.abs(e.vx) > 5;
    const r = e.rise === undefined ? 1 : e.rise;
    ctx.save(); ctx.beginPath(); ctx.rect(e.x - 30, e.y - 40, e.w + 60, e.h + 40); ctx.clip();
    ctx.translate(e.cx, e.bottom + (1 - r) * 32); ctx.scale(e.facing, 1);
    S.leg(ctx, -1, -12, mv ? -Math.sin(wp) * 4 : -3, 0, 7, -1, 2.4, f('#3a4a48'));
    ctx.fillStyle = f('#5a6e6a'); ctx.beginPath(); ctx.moveTo(-7, -10); ctx.quadraticCurveTo(-9, -24, -2, -27); ctx.quadraticCurveTo(7, -26, 7, -10); ctx.closePath(); ctx.fill();
    ctx.fillStyle = f('#2e4a3a'); for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(-6 + i * 4, -22); ctx.quadraticCurveTo(-7 + i * 4, -14, -5 + i * 4, -8 + Math.sin(e.anim * 2 + i) * 1.5); ctx.lineTo(-4 + i * 4, -22); ctx.fill(); }
    ctx.fillStyle = f('#6a807a'); ctx.beginPath(); ctx.ellipse(2, -30, 4.6, 5, 0, 0, U.TAU); ctx.fill();
    ctx.fillStyle = '#0a1414'; ctx.beginPath(); ctx.arc(3.5, -31, 1.4, 0, U.TAU); ctx.arc(0.5, -31, 1.2, 0, U.TAU); ctx.fill();
    ctx.fillStyle = '#0a1414'; ctx.beginPath(); ctx.ellipse(2, -27, 1.6, 1 + (p.ph === 'act' ? 1.4 : 0), 0, 0, U.TAU); ctx.fill();
    S.leg(ctx, 1, -12, mv ? Math.sin(wp) * 4 : 3, 0, 7, -1, 2.5, f('#46585a'));
    const reach = p.ph === 'wind' ? -4 * p.k : p.ph === 'act' ? 14 * U.ease.outCubic(p.k) : p.ph === 'rec' ? 14 * (1 - p.k) : 0;
    for (const dy of [-22, -18]) S.limb(ctx, 3, dy, 13 + reach, dy + 3, 1.8, 1.4, f('#5a6e6a'));
    ctx.restore();
    if (e.rise < 1) VS.Gfx.emit({ x: e.cx + U.rand(-8, 8), y: e.bottom - 2, vy: -40, life: 0.4, size: 1.2, color: '#a0c8c8' });
  };
  // ---------- Mariposa ----------
  E.moth = function (ctx, e) {
    const x = e.cx, y = e.cy, t = e.anim, fl = Math.sin(t * 22);
    const c1 = e.flash > 0 ? '#fff' : '#b8a888', c2 = '#6a5a40';
    ctx.save(); ctx.translate(x, y); ctx.scale(e.facing, 1);
    for (const s of [-1, 1]) {
      ctx.save(); ctx.scale(1, s * (0.4 + Math.abs(fl) * 0.6));
      ctx.fillStyle = c1; ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(-4, -12, -12, -9); ctx.quadraticCurveTo(-10, -2, 0, 0); ctx.fill();
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(4, -11, 11, -8); ctx.quadraticCurveTo(9, -2, 0, 0); ctx.fill();
      ctx.fillStyle = c2; ctx.beginPath(); ctx.arc(-7, -7, 2, 0, U.TAU); ctx.arc(7, -6, 1.8, 0, U.TAU); ctx.fill();
      ctx.restore();
    }
    ctx.fillStyle = '#3a3020'; ctx.beginPath(); ctx.ellipse(0, 1, 2, 5, 0, 0, U.TAU); ctx.fill();
    ctx.strokeStyle = '#3a3020'; ctx.lineWidth = 0.5; ctx.beginPath(); ctx.moveTo(1, -3); ctx.quadraticCurveTo(4, -8, 7, -8); ctx.moveTo(1, -3); ctx.quadraticCurveTo(5, -6, 8, -5); ctx.stroke();
    ctx.restore();
  };
  // ---------- Gárgula ----------
  E.gargoyle = function (ctx, e) {
    const f = F(e), p = pose(e), t = e.anim, perched = e.perched;
    begin(ctx, e);
    const wing = perched ? 0.2 : 0.6 + Math.sin(t * 10) * 0.5;
    ctx.fillStyle = f(perched ? '#4a4652' : '#3a3644');
    for (const s of [-1, 1]) { ctx.save(); ctx.translate(-2, -14); ctx.rotate(s * 0.2 - wing * s * 0.6); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-14, -10 * s - 4); ctx.lineTo(-18, -2 * s); ctx.lineTo(-12, 2 * s); ctx.lineTo(-7, 0); ctx.closePath(); ctx.fill(); ctx.restore(); }
    ctx.beginPath(); ctx.moveTo(-7, -2); ctx.quadraticCurveTo(-9, -16, -1, -18); ctx.quadraticCurveTo(7, -17, 6, -4); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.ellipse(5, -18, 4.5, 4, 0, 0, U.TAU); ctx.fill();
    ctx.beginPath(); ctx.moveTo(3, -21); ctx.lineTo(1, -27); ctx.lineTo(5, -22); ctx.fill(); ctx.beginPath(); ctx.moveTo(6, -21); ctx.lineTo(7, -26); ctx.lineTo(8, -21); ctx.fill();
    if (!perched) eyes(ctx, 7, -18, '#ff5030'); else { ctx.fillStyle = '#1a181e'; ctx.fillRect(6, -19, 2, 1); }
    ctx.strokeStyle = f('#2a2632'); ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(-1, -2); ctx.lineTo(-2, 0); ctx.moveTo(3, -2); ctx.lineTo(4, 0); ctx.stroke();
    ctx.restore();
  };
  // ---------- Acólito dos Sinos ----------
  E.acolyte = function (ctx, e) {
    const f = F(e), p = pose(e), wp = walkPhase(e), mv = Math.abs(e.vx) > 5;
    begin(ctx, e);
    ctx.fillStyle = f('#3a3246'); ctx.beginPath(); ctx.moveTo(-7, 0); ctx.lineTo(-5, -24); ctx.quadraticCurveTo(0, -30, 5, -24); ctx.lineTo(8, 0);
    for (let i = 0; i < 4; i++) ctx.lineTo(8 - i * 5, -1 + (mv ? Math.sin(wp + i) : 0)); ctx.closePath(); ctx.fill();
    ctx.fillStyle = f('#2a2234'); ctx.beginPath(); ctx.moveTo(-5, -24); ctx.quadraticCurveTo(-3, -33, 2, -32); ctx.quadraticCurveTo(7, -29, 5, -23); ctx.fill();
    ctx.fillStyle = f('#d8cfc0'); ctx.beginPath(); ctx.ellipse(3, -27, 2, 2.6, 0, 0, U.TAU); ctx.fill();
    ctx.fillStyle = f('#c0a060'); ctx.fillRect(-1, -20, 1.2, 10);
    const ring = p.name === 'ring' && p.ph === 'wind' ? Math.sin(e.t * 40) * 0.5 : 0;
    const ang = p.name === 'bash' ? weaponSwing(p, 0.6, -2, -2, 1, 0.6) : -0.6 + ring;
    ctx.save(); ctx.translate(3, -19); ctx.rotate(ang);
    S.limb(ctx, 0, 0, 8, 0, 1.6, 1.4, f('#3a3246'));
    ctx.fillStyle = f('#a08040'); ctx.beginPath(); ctx.moveTo(8, -2); ctx.lineTo(14, -4); ctx.lineTo(14, 4); ctx.lineTo(8, 2); ctx.fill();
    ctx.restore();
    ctx.restore();
  };
  // ---------- Corvo ----------
  E.raven = function (ctx, e) {
    const x = e.cx, y = e.cy, fl = Math.sin(e.anim * 18 + e.home.x);
    ctx.save(); ctx.translate(x, y); ctx.scale(e.facing, 1);
    ctx.fillStyle = e.flash > 0 ? '#fff' : '#121016';
    ctx.beginPath(); ctx.ellipse(0, 0, 6, 3, 0, 0, U.TAU); ctx.fill();
    ctx.beginPath(); ctx.moveTo(5, -1); ctx.lineTo(10, 0); ctx.lineTo(5, 1.5); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-5, 0); ctx.lineTo(-10, -2); ctx.lineTo(-10, 2); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-2, 0); ctx.quadraticCurveTo(0, -10 * fl, 4, -9 * fl); ctx.lineTo(2, 0); ctx.fill();
    ctx.fillStyle = '#ff4030'; ctx.fillRect(4, -1, 1, 1);
    ctx.restore();
  };
  // ---------- Penitente ----------
  E.penitent = function (ctx, e) {
    const f = F(e), p = pose(e), wp = walkPhase(e), mv = Math.abs(e.vx) > 5;
    begin(ctx, e);
    S.leg(ctx, -1, -12, mv ? -Math.sin(wp) * 6 : -3, 0, 7, -1, 2.2, f('#2a2024'));
    ctx.fillStyle = f('#4a3a3a'); ctx.beginPath(); ctx.moveTo(-6, -12); ctx.quadraticCurveTo(-7, -24, -1, -27); ctx.quadraticCurveTo(6, -26, 6, -12); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = f('#8a2a2a'); ctx.lineWidth = 0.6; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(-5, -22 + i * 3); ctx.lineTo(-1, -20 + i * 3); ctx.stroke(); }
    ctx.fillStyle = f('#1e1418'); ctx.fillRect(-6, -14, 12, 4); // tanga
    // coroa de espinhos e capuz
    ctx.fillStyle = f('#24181c'); ctx.beginPath(); ctx.ellipse(1, -30, 4.5, 4.8, 0, 0, U.TAU); ctx.fill();
    ctx.strokeStyle = f('#3a3020'); ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(1, -33, 5, 1.5, 0, 0, U.TAU); ctx.stroke();
    for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.moveTo(-3 + i * 2, -34); ctx.lineTo(-3.5 + i * 2, -37); ctx.stroke(); }
    eyes(ctx, 3, -30, '#ff3030');
    S.leg(ctx, 1, -12, mv ? Math.sin(wp) * 6 : 3, 0, 7, -1, 2.3, f('#30242a'));
    // mangual
    const ang = p.name === 'c2' ? weaponSwing(p, 0.8, 1.6, 1.6, -1.6) : weaponSwing(p, 0.8, -2.4, -2.4, 1.2);
    ctx.save(); ctx.translate(2, -22); ctx.rotate(ang);
    S.limb(ctx, 0, 0, 9, 0, 1.6, 1.4, f('#4a3a3a'));
    ctx.strokeStyle = f('#2a2226'); ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(9, 0); ctx.quadraticCurveTo(18, 3, 26, 0); ctx.stroke();
    ctx.fillStyle = f('#3a3238'); ctx.beginPath(); ctx.arc(27, 0, 3, 0, U.TAU); ctx.fill();
    ctx.restore();
    ctx.restore();
  };
  // ---------- Vitral ----------
  E.vitrail = function (ctx, e) {
    const x = e.cx, y = e.cy, t = e.anim;
    ctx.save(); ctx.translate(x, y + Math.sin(t * 2) * 2);
    const cols = ['#c04060', '#4060c0', '#d0a040', '#8040c0', '#40a080'];
    ctx.globalAlpha = 0.85;
    for (let i = 0; i < 5; i++) { const a = i / 5 * U.TAU + t * 0.4; ctx.fillStyle = e.flash > 0 ? '#fff' : cols[i]; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a) * 12, Math.sin(a) * 14); ctx.lineTo(Math.cos(a + 1.25) * 12, Math.sin(a + 1.25) * 14); ctx.closePath(); ctx.fill(); }
    ctx.globalAlpha = 1;
    ctx.strokeStyle = '#140a18'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(0, -15); ctx.lineTo(12, 0); ctx.lineTo(0, 15); ctx.lineTo(-12, 0); ctx.closePath(); ctx.stroke();
    ctx.fillStyle = '#fff8e0'; ctx.beginPath(); ctx.ellipse(0, 0, 4, 2.4, 0, 0, U.TAU); ctx.fill();
    ctx.fillStyle = '#2a1030'; ctx.beginPath(); ctx.arc(e.facing * 1.2, 0, 1.6, 0, U.TAU); ctx.fill();
    ctx.restore();
  };
  // ---------- Coro ----------
  E.choir = function (ctx, e) {
    const x = e.cx, y = e.cy, t = e.anim, p = pose(e);
    ctx.strokeStyle = 'rgba(255,230,160,0.5)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(x, y - 4, 14, 4, 0, 0, U.TAU); ctx.stroke();
    for (let i = 0; i < 3; i++) {
      const a = i / 3 * U.TAU + t * 0.8;
      const hx = x + Math.cos(a) * 10, hy = y + Math.sin(a) * 4;
      ctx.fillStyle = e.flash > 0 ? '#fff' : '#b8b0a8'; ctx.beginPath(); ctx.ellipse(hx, hy, 4, 5, 0, 0, U.TAU); ctx.fill();
      ctx.fillStyle = '#1a1418'; ctx.fillRect(hx - 2, hy - 1.5, 1.3, 1.3); ctx.fillRect(hx + 0.7, hy - 1.5, 1.3, 1.3);
      ctx.beginPath(); ctx.ellipse(hx, hy + 2, 1, p.ph === 'wind' ? 1.8 : 1, 0, 0, U.TAU); ctx.fill();
    }
  };
  // ---------- Guarda Real ----------
  E.royalguard = function (ctx, e) {
    const f = F(e), p = pose(e), wp = walkPhase(e), mv = Math.abs(e.vx) > 5;
    begin(ctx, e);
    S.leg(ctx, -2, -15, mv ? -Math.sin(wp) * 5 : -4, 0, 8, -1, 2.8, f('#1e1618'));
    ctx.fillStyle = f('#2a2226'); ctx.beginPath(); ctx.moveTo(-7, -14); ctx.lineTo(-7, -30); ctx.lineTo(7, -30); ctx.lineTo(8, -14); ctx.closePath(); ctx.fill();
    ctx.fillStyle = f('#6a1418'); ctx.beginPath(); ctx.moveTo(-5, -28); ctx.lineTo(5, -28); ctx.lineTo(6, -6); ctx.lineTo(0, -9); ctx.lineTo(-4, -6); ctx.closePath(); ctx.fill();
    ctx.fillStyle = f('#c09050'); ctx.beginPath(); ctx.arc(0, -20, 1.8, 0, U.TAU); ctx.fill();
    ctx.fillStyle = f('#3a3034'); ctx.beginPath(); ctx.moveTo(-5, -30); ctx.lineTo(-5, -38); ctx.quadraticCurveTo(1, -42, 6, -38); ctx.lineTo(6, -30); ctx.fill();
    ctx.fillStyle = f('#c09050'); for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(-4 + i * 3, -40); ctx.lineTo(-3 + i * 3, -44); ctx.lineTo(-2 + i * 3, -40); ctx.fill(); }
    ctx.fillStyle = '#000'; ctx.fillRect(1, -36, 5, 1.4); eyes(ctx, 4, -35.3, '#ff6040');
    S.leg(ctx, 2, -15, mv ? Math.sin(wp) * 5 : 4, 0, 8, -1, 3, f('#261c20'));
    // alabarda
    let ang = -1.3, ext = 0;
    if (p.name === 'sweep') ang = weaponSwing(p, -1.3, -2.4, -2.4, 0.9);
    if (p.name === 'overhead') ang = weaponSwing(p, -1.3, -2.9, -2.9, 0.6);
    if (p.name === 'thrust') { ang = 0; ext = p.ph === 'wind' ? -8 * p.k : p.ph === 'act' ? -8 + 26 * U.ease.outCubic(p.k) : 18 * (1 - p.k); }
    ctx.save(); ctx.translate(4 + ext, -22); ctx.rotate(ang);
    ctx.strokeStyle = f('#3a2a1e'); ctx.lineWidth = 1.8; ctx.beginPath(); ctx.moveTo(-10, 0); ctx.lineTo(34, 0); ctx.stroke();
    ctx.fillStyle = f('#b8b4bc'); ctx.beginPath(); ctx.moveTo(30, -1); ctx.quadraticCurveTo(34, -10, 38, -8); ctx.lineTo(36, 0); ctx.lineTo(42, 0); ctx.lineTo(36, 2); ctx.closePath(); ctx.fill();
    ctx.restore();
    if (e.guarding && !e.atk) { ctx.strokeStyle = 'rgba(200,180,140,0.25)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(8, -22, 12, -1.2, 1.2); ctx.stroke(); }
    ctx.restore();
  };
  // ---------- Cortesão ----------
  E.courtier = function (ctx, e) {
    const a = e.fade === undefined ? 1 : e.fade;
    ctx.globalAlpha *= 0.15 + a * 0.75;
    const f = F(e), p = pose(e);
    begin(ctx, e);
    ctx.fillStyle = f('#6a6a8a'); ctx.beginPath(); ctx.moveTo(-7, -2); ctx.lineTo(-5, -24); ctx.lineTo(5, -24); ctx.lineTo(8, -2);
    for (let i = 0; i < 4; i++) ctx.lineTo(8 - i * 5, 2 + Math.sin(e.anim * 4 + i) * 2); ctx.closePath(); ctx.fill();
    ctx.fillStyle = f('#d8d8e8'); for (let i = 0; i < 7; i++) { ctx.beginPath(); ctx.ellipse(-5 + i * 1.8, -25, 1.6, 2.2, 0, 0, U.TAU); ctx.fill(); }
    ctx.fillStyle = f('#b8b8d0'); ctx.beginPath(); ctx.ellipse(1, -30, 3.8, 4.4, 0, 0, U.TAU); ctx.fill();
    ctx.fillStyle = '#20203a'; ctx.fillRect(2, -31, 1.4, 1.4); ctx.fillRect(-0.5, -31, 1.4, 1.4);
    ctx.fillStyle = f('#8a8aa0'); ctx.fillRect(-4, -38, 9, 4);
    const ext = p.ph === 'act' ? 10 * U.ease.outCubic(p.k) : p.ph === 'rec' ? 10 * (1 - p.k) : p.ph === 'wind' ? -4 * p.k : 0;
    S.limb(ctx, 2, -18, 10 + ext, -16, 1.4, 1.2, f('#6a6a8a'));
    ctx.fillStyle = '#e0e0f0'; ctx.beginPath(); ctx.moveTo(10 + ext, -17); ctx.lineTo(19 + ext, -16); ctx.lineTo(10 + ext, -15); ctx.fill();
    ctx.restore();
    ctx.globalAlpha = 1;
  };
  // ---------- Archote Vivo ----------
  E.torch = function (ctx, e) {
    const f = F(e), p = pose(e), wp = walkPhase(e), mv = Math.abs(e.vx) > 5;
    begin(ctx, e);
    S.leg(ctx, -1, -11, mv ? -Math.sin(wp) * 6 : -3, 0, 6.5, -1, 2, f('#1a1010'));
    ctx.fillStyle = f('#2a1814'); ctx.beginPath(); ctx.moveTo(-5, -10); ctx.lineTo(-4, -22); ctx.quadraticCurveTo(0, -25, 5, -22); ctx.lineTo(6, -10); ctx.closePath(); ctx.fill();
    S.leg(ctx, 1, -11, mv ? Math.sin(wp) * 6 : 3, 0, 6.5, -1, 2, f('#201412'));
    ctx.fillStyle = f('#1a0e0c'); ctx.beginPath(); ctx.ellipse(1, -25, 3.6, 4, 0, 0, U.TAU); ctx.fill();
    const k = p.ph === 'wind' ? 1 + p.k * 0.8 : 1;
    for (let i = 0; i < 6; i++) { ctx.fillStyle = i % 2 ? '#ff6010' : '#ffb040'; ctx.beginPath(); const fx = -4 + i * 1.8; ctx.moveTo(fx - 2, -22); ctx.quadraticCurveTo(fx, -30 * k - Math.sin(e.anim * 14 + i) * 3, fx + 2, -22); ctx.fill(); }
    ctx.restore();
  };

  VS.SpritesEnemy = E;
})(window.VS);
