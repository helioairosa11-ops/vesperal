// Vesperal — desenho dos chefes e subchefes (silhuetas grandes, animação por pose de ataque)
'use strict';
(function (VS) {
  const U = VS.U, S = VS.Sprites;
  const B = {};
  const glow = (...a) => S.glow(...a);
  function pose(e) { const a = e.atk; if (!a) return { ph: 'none', k: 0 }; const d = a.phase === 'wind' ? a.s.wind : a.phase === 'act' ? a.s.act : a.s.rec; return { ph: a.phase, k: Math.min(1, a.t / (d || 1)), name: a.name }; }
  const F = (e) => (e.flash > 0 ? () => '#f6eee6' : (c) => c);
  const swing = (p, rest, wind, a0, a1) => p.ph === 'wind' ? U.lerp(rest, wind, U.ease.outCubic(p.k)) : p.ph === 'act' ? U.lerp(a0, a1, U.ease.outCubic(p.k)) : p.ph === 'rec' ? U.lerp(a1, rest, U.ease.inOutQuad(p.k)) : rest;
  const begin = (ctx, e) => { ctx.save(); ctx.translate(e.cx, e.bottom); ctx.scale(e.facing, 1); };
  const wp = (e) => e.anim * (3 + Math.abs(e.vx) * 0.05);
  function eye(ctx, x, y, col, r) { ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, y, r || 1.5, 0, U.TAU); ctx.fill(); glow(ctx, x, y, (r || 1.5) * 5, col, 0.7); }

  // sobreposições de aviso (colunas, bigorna, varrimento, anel) — luz e poeira suaves, nunca formas duras
  B.overlays = function (ctx, e) {
    const t = e.t || 0;
    if (e.K && e.K.drawOver && !e.defeated) e.K.drawOver(ctx, e);
    if (e.colXs) for (const x of e.colXs) {
      const col = e.colWarnCol || '#ff8030', fl = e.arena.floor, p = 0.7 + 0.3 * Math.sin(t * 18);
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      const gh = ctx.createLinearGradient(0, fl, 0, fl - 80); gh.addColorStop(0, U.rgba(col, 0.3 * p)); gh.addColorStop(1, U.rgba(col, 0));
      ctx.fillStyle = gh; ctx.beginPath(); ctx.moveTo(x - 14, fl); ctx.quadraticCurveTo(x - 5, fl - 40, x - 1.5, fl - 80); ctx.lineTo(x + 1.5, fl - 80); ctx.quadraticCurveTo(x + 5, fl - 40, x + 14, fl); ctx.closePath(); ctx.fill();
      ctx.translate(x, fl); ctx.scale(1, 0.32);
      const gg = ctx.createRadialGradient(0, 0, 0, 0, 0, 20); gg.addColorStop(0, U.rgba(col, 0.7 * p)); gg.addColorStop(1, U.rgba(col, 0));
      ctx.fillStyle = gg; ctx.fillRect(-20, -20, 40, 40);
      ctx.restore();
    }
    if (e.anvilShadow) {
      const x = e.anvilShadow, fl = e.arena.floor;
      ctx.save(); ctx.translate(x, fl - 1); ctx.scale(1, 0.28);
      const sg = ctx.createRadialGradient(0, 0, 0, 0, 0, 24); sg.addColorStop(0, 'rgba(0,0,0,0.6)'); sg.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = sg; ctx.fillRect(-24, -24, 48, 48);
      ctx.globalCompositeOperation = 'lighter'; const wg = ctx.createRadialGradient(0, 0, 0, 0, 0, 16); wg.addColorStop(0, `rgba(255,90,40,${0.25 + 0.15 * Math.sin(t * 20)})`); wg.addColorStop(1, 'rgba(255,60,20,0)');
      ctx.fillStyle = wg; ctx.fillRect(-16, -16, 32, 32); ctx.restore();
    }
    if (e.sweepLine) {
      const y = e.sweepLine.y, x = e.sweepLine.x;
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.translate(x, y); ctx.scale(1, 0.16);
      const lg = ctx.createRadialGradient(0, 0, 0, 0, 0, 56); lg.addColorStop(0, 'rgba(255,250,235,0.95)'); lg.addColorStop(0.35, 'rgba(255,230,180,0.5)'); lg.addColorStop(1, 'rgba(255,220,160,0)');
      ctx.fillStyle = lg; ctx.fillRect(-56, -56, 112, 112); ctx.restore();
    } else if (e.atk && e.atk.name === 'sweep' && e.atk.phase === 'wind' && e.sweepLow !== undefined) {
      // aviso: poeira de luz a cintilar à altura do varrimento
      const y = e.sweepLow ? e.arena.floor - 14 : e.arena.floor - 34, W = e.game.room.pw;
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (let x = 0; x < W; x += 22) { const k = 0.5 + 0.5 * Math.sin(t * 9 + x * 0.13); const gx = x + ((t * 30 + x) % 22); const g2 = ctx.createRadialGradient(gx, y, 0, gx, y, 5); g2.addColorStop(0, `rgba(255,240,200,${0.35 * k})`); g2.addColorStop(1, 'rgba(255,240,200,0)'); ctx.fillStyle = g2; ctx.fillRect(gx - 5, y - 5, 10, 10); }
      ctx.restore();
    }
    if (e.ringOn) {
      const R = e.ringR, cx = e.cx, cy = e.cy;
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      const rg = ctx.createRadialGradient(cx, cy, Math.max(0, R - 16), cx, cy, R + 6);
      rg.addColorStop(0, 'rgba(200,180,255,0)'); rg.addColorStop(0.72, 'rgba(210,190,255,0.32)'); rg.addColorStop(0.86, 'rgba(255,250,255,0.4)'); rg.addColorStop(1, 'rgba(200,180,255,0)');
      ctx.fillStyle = rg; ctx.fillRect(cx - R - 8, cy - R - 8, (R + 8) * 2, (R + 8) * 2); ctx.restore();
    }
  };

  // ---------- O Coveiro ----------
  B.coveiro = function (ctx, e) {
    const f = F(e), p = pose(e), w = wp(e), mv = Math.abs(e.vx) > 5;
    if (e.underground) { ctx.fillStyle = '#3a2e24'; ctx.beginPath(); ctx.ellipse(e.targetX || e.cx, e.arena.floor, 18, 5, 0, Math.PI, 0); ctx.fill(); return; }
    begin(ctx, e);
    S.leg(ctx, -6, -18, mv ? -Math.sin(w) * 6 : -7, 0, 11, -1, 4, f('#1e1a18'));
    // corpo enorme e corcunda
    ctx.fillStyle = f('#3a3230');
    ctx.beginPath(); ctx.moveTo(-16, -14); ctx.quadraticCurveTo(-22, -40, -6, -46); ctx.quadraticCurveTo(14, -48, 16, -30); ctx.lineTo(14, -14); ctx.closePath(); ctx.fill();
    ctx.fillStyle = f('#2a2422'); for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.moveTo(-15 + i * 6, -16); ctx.lineTo(-13 + i * 6, -8 + (i % 2) * 3); ctx.lineTo(-10 + i * 6, -16); ctx.fill(); }
    // cabeça com saco e lanterna
    ctx.fillStyle = f('#5a4e40'); ctx.beginPath(); ctx.ellipse(10, -44, 7, 8, 0.2, 0, U.TAU); ctx.fill();
    ctx.strokeStyle = '#2a2018'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(5, -38); ctx.lineTo(15, -38); ctx.stroke();
    eye(ctx, 13, -45, '#ffb050', 1.8);
    ctx.fillStyle = f('#1a1614'); ctx.fillRect(-14, -40, 5, 9); ctx.fillStyle = '#ffc070'; ctx.fillRect(-13, -38.5, 3, 6);
    S.leg(ctx, 6, -18, mv ? Math.sin(w) * 6 : 7, 0, 11, -1, 4.2, f('#24201e'));
    // pá
    const ang = p.name === 'clods' ? swing(p, 0.6, 2.2, 2.2, -1.6) : p.name === 'sweep' ? swing(p, 0.6, -0.5, -0.5, 1.8) : swing(p, 0.6, -2.6, -2.6, 1.3);
    ctx.save(); ctx.translate(8, -32); ctx.rotate(ang);
    S.limb(ctx, 0, 0, 14, 0, 4, 3.4, f('#3a3230'));
    ctx.strokeStyle = f('#4a3a28'); ctx.lineWidth = 2.6; ctx.beginPath(); ctx.moveTo(10, 0); ctx.lineTo(42, 0); ctx.stroke();
    ctx.fillStyle = f('#6a6a6e'); ctx.beginPath(); ctx.moveTo(40, -7); ctx.lineTo(56, -6); ctx.quadraticCurveTo(60, 0, 56, 6); ctx.lineTo(40, 7); ctx.closePath(); ctx.fill();
    ctx.restore();
    ctx.restore();
  };

  // ---------- A Velha Matilheira ----------
  B.matilheira = function (ctx, e) {
    const f = F(e), p = pose(e), w = wp(e) * 1.3, mv = Math.abs(e.vx) > 5;
    begin(ctx, e);
    const cr = p.ph === 'wind' ? 4 * p.k : 0;
    ctx.fillStyle = f('#2e2a2c');
    ctx.beginPath(); ctx.moveTo(-26, -14 + cr); ctx.quadraticCurveTo(-10, -32 + cr, 12, -26 + cr); ctx.lineTo(18, -16 + cr); ctx.quadraticCurveTo(0, -10 + cr, -26, -10 + cr); ctx.fill();
    // juba de cinza
    ctx.fillStyle = f('#4a4448'); for (let i = 0; i < 7; i++) { ctx.beginPath(); ctx.moveTo(-6 + i * 3, -26 + cr); ctx.lineTo(-8 + i * 3 + Math.sin(e.anim * 5 + i), -36 + cr - (i % 2) * 3); ctx.lineTo(-3 + i * 3, -26 + cr); ctx.fill(); }
    ctx.strokeStyle = f('#5a5054'); ctx.lineWidth = 0.8; for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.moveTo(-18 + i * 4, -24 + cr); ctx.lineTo(-17 + i * 4, -14 + cr); ctx.stroke(); }
    ctx.fillStyle = f('#363034'); ctx.beginPath(); ctx.moveTo(10, -28 + cr); ctx.lineTo(28, -22 + cr); ctx.lineTo(27, -15 + cr); ctx.lineTo(12, -16 + cr); ctx.fill();
    ctx.beginPath(); ctx.moveTo(12, -28 + cr); ctx.lineTo(14, -36 + cr); ctx.lineTo(18, -27 + cr); ctx.fill();
    eye(ctx, 20, -24 + cr, '#ff4020', 1.6);
    if (p.ph === 'act') { ctx.fillStyle = '#e0d8c8'; for (let i = 0; i < 4; i++) ctx.fillRect(18 + i * 2.4, -17 + cr, 1, 3); }
    ctx.strokeStyle = f('#1e1a1c'); ctx.lineWidth = 3.4; ctx.lineCap = 'round';
    for (const [x, o] of [[-20, 0], [-14, 1.6], [6, 3.1], [12, 4.7]]) { ctx.beginPath(); ctx.moveTo(x, -12 + cr); ctx.lineTo(x + (mv ? Math.sin(w + o) * 7 : 0), 0); ctx.stroke(); }
    ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(-26, -14 + cr); ctx.quadraticCurveTo(-34, -20, -36 + Math.sin(e.anim * 6) * 3, -28); ctx.stroke();
    ctx.restore();
  };

  // ---------- Sir Caedmon ----------
  B.caedmon = function (ctx, e) {
    const f = F(e), p = pose(e), w = wp(e), mv = Math.abs(e.vx) > 5;
    const kneel = e.broken > 0;
    begin(ctx, e);
    if (kneel) ctx.translate(0, 8);
    S.leg(ctx, -3, -18, kneel ? -8 : mv ? -Math.sin(w) * 6 : -6, kneel ? -2 : 0, 9, -1, 3.2, f('#2a2e36'));
    // armadura
    ctx.fillStyle = f('#4a525e'); ctx.beginPath(); ctx.moveTo(-9, -16); ctx.lineTo(-9, -34); ctx.quadraticCurveTo(0, -38, 9, -34); ctx.lineTo(10, -16); ctx.closePath(); ctx.fill();
    ctx.fillStyle = f('#6a7480'); ctx.fillRect(-9, -34, 19, 2); ctx.fillRect(-1, -32, 2, 14);
    ctx.fillStyle = f('#2a3040'); ctx.beginPath(); ctx.moveTo(-9, -18); ctx.lineTo(10, -18); ctx.lineTo(12, -8); ctx.lineTo(-11, -8); ctx.fill(); // fraldão
    // capa azul da rainha
    ctx.fillStyle = f('#1e2a4a'); ctx.beginPath(); ctx.moveTo(-8, -34); ctx.quadraticCurveTo(-16 - Math.abs(e.vx) * 0.03, -20, -14 + Math.sin(e.anim * 2) * 1.5, -4); ctx.lineTo(-7, -10); ctx.closePath(); ctx.fill();
    // elmo
    ctx.fillStyle = f('#5a6470'); ctx.beginPath(); ctx.moveTo(-5, -34); ctx.lineTo(-5, -44); ctx.quadraticCurveTo(1, -49, 7, -44); ctx.lineTo(7, -34); ctx.fill();
    ctx.fillStyle = '#05070a'; ctx.fillRect(2, -41, 5, 1.6);
    eye(ctx, 5, -40.3, kneel ? '#8090a0' : '#a0c8ff', 0.9);
    ctx.fillStyle = f('#c0c4d0'); ctx.beginPath(); ctx.moveTo(1, -48); ctx.quadraticCurveTo(-6, -54, -12, -50); ctx.lineTo(-4, -46); ctx.fill();
    S.leg(ctx, 3, -18, kneel ? 6 : mv ? Math.sin(w) * 6 : 6, kneel ? 0 : 0, 9, -1, 3.4, f('#323844'));
    // espada longa
    let ang = -0.4, ext = 0;
    if (p.name && p.name.startsWith('cut') || p.name === 'feint' || (p.name && p.name.startsWith('combo3'))) ang = swing(p, -0.4, -2.5, -2.5, 1.0);
    if (p.name === 'cut2b' || p.name === 'combo3b') ang = swing(p, 0.9, 1.6, 1.6, -1.8);
    if (p.name === 'thrust') { ang = 0; ext = p.ph === 'wind' ? -10 * p.k : p.ph === 'act' ? -10 + 26 * U.ease.outCubic(p.k) : 16 * (1 - p.k); }
    if (kneel) ang = 1.2;
    ctx.save(); ctx.translate(6 + ext, -28); ctx.rotate(ang);
    S.limb(ctx, 0, 0, 9, 0, 2.2, 2, f('#4a525e'));
    ctx.fillStyle = f('#8a7a5a'); ctx.fillRect(8, -4, 2, 8);
    ctx.fillStyle = f('#d8dce4'); ctx.beginPath(); ctx.moveTo(10, -1.6); ctx.lineTo(42, -0.8); ctx.lineTo(46, 0); ctx.lineTo(42, 0.8); ctx.lineTo(10, 1.6); ctx.fill();
    ctx.restore();
    // escudo (torre, com o brasão da chama)
    if (!kneel) {
      ctx.fillStyle = f('#3a4252'); ctx.beginPath(); ctx.moveTo(10, -38); ctx.lineTo(18, -36); ctx.lineTo(18, -14); ctx.quadraticCurveTo(14, -6, 10, -5); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = f('#b0bccc'); ctx.lineWidth = 1; ctx.stroke();
      ctx.fillStyle = '#ffb050'; ctx.beginPath(); ctx.moveTo(14, -28); ctx.quadraticCurveTo(17, -23, 14, -18); ctx.quadraticCurveTo(11, -23, 14, -28); ctx.fill();
    } else { ctx.fillStyle = f('#3a4252'); ctx.save(); ctx.translate(-18, -4); ctx.rotate(-1.3); ctx.fillRect(-4, -12, 8, 22); ctx.restore(); }
    ctx.restore();
    if (kneel) { glow(ctx, e.cx, e.y + 10, 24, '#ffffff', 0.35); VS.Gfx.ctx && 0; }
  };

  // ---------- O Autómato do Fole ----------
  B.automato = function (ctx, e) {
    const f = F(e), p = pose(e), w = wp(e) * 0.6, mv = Math.abs(e.vx) > 5;
    begin(ctx, e);
    // pernas de pistão
    for (const s of [-1, 1]) { const off = mv ? Math.sin(w + (s > 0 ? Math.PI : 0)) * 4 : 0; ctx.fillStyle = f('#2a2422'); ctx.fillRect(s * 10 - 4 + off, -18, 8, 18); ctx.fillStyle = f('#4a3a30'); ctx.fillRect(s * 10 - 6 + off, -3, 12, 3); }
    // tronco: caldeira
    ctx.fillStyle = f('#3e322c'); ctx.beginPath(); ctx.moveTo(-20, -18); ctx.lineTo(-22, -46); ctx.quadraticCurveTo(0, -60, 22, -46); ctx.lineTo(20, -18); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = f('#6a5240'); ctx.lineWidth = 1.2; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(-20, -26 - i * 8); ctx.lineTo(20, -26 - i * 8); ctx.stroke(); }
    ctx.fillStyle = '#8a7060'; for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.arc(-16 + i * 6.4, -22, 0.9, 0, U.TAU); ctx.fill(); }
    // fornalha nas costas (ponto fraco)
    ctx.fillStyle = '#1a0e0a'; ctx.fillRect(-24, -42, 8, 18);
    ctx.fillStyle = `rgba(255,${120 + Math.sin(e.anim * 6) * 40},30,0.95)`; ctx.fillRect(-23, -40, 6, 14);
    // cabeça: grelha com olho
    ctx.fillStyle = f('#2a2220'); ctx.fillRect(-8, -58, 18, 12);
    eye(ctx, 6, -52, '#ffb040', 2.2);
    ctx.fillStyle = f('#4a3a30'); ctx.fillRect(-4, -64, 3, 7); // chaminé
    if (Math.random() < 0.3) VS.Gfx.emit({ x: e.cx - e.facing * 3, y: e.y - 6, vx: U.rand(-10, 10), vy: -40, life: 1.5, size: U.rand(3, 6), color: 'rgba(120,110,110,0.3)', kind: 'glow', color2: '#000000' });
    // braço
    const ang = p.name === 'crush' ? swing(p, 0.4, -2.4, -2.4, 1.4) : p.name === 'punch' ? 0 : 0.4;
    const ext = p.name === 'punch' ? (p.ph === 'wind' ? -8 * p.k : p.ph === 'act' ? -8 + 26 * U.ease.outCubic(p.k) : 18 * (1 - p.k)) : 0;
    ctx.save(); ctx.translate(14 + ext, -40); ctx.rotate(ang);
    S.limb(ctx, 0, 0, 16, 0, 4, 3.5, f('#4a3e36'));
    ctx.fillStyle = f('#2a2422'); ctx.fillRect(14, -8, 14, 16); ctx.fillStyle = f('#6a5a4a'); ctx.fillRect(26, -8, 2, 16);
    ctx.restore();
    // fole na frente
    if (p.name === 'bellows') { ctx.fillStyle = f('#5a4030'); ctx.beginPath(); ctx.moveTo(20, -36); ctx.lineTo(30 + Math.sin(e.t * 30) * 2, -40); ctx.lineTo(30 + Math.sin(e.t * 30) * 2, -24); ctx.lineTo(20, -28); ctx.fill(); }
    ctx.restore();
  };

  // ---------- Mestra Hilde ----------
  B.hilde = function (ctx, e) {
    const f = F(e), p = pose(e), w = wp(e), mv = Math.abs(e.vx) > 5;
    begin(ctx, e);
    S.leg(ctx, -5, -18, mv ? -Math.sin(w) * 6 : -6, 0, 10, -1, 4, f('#241a18'));
    // avental de couro e ombros largos
    ctx.fillStyle = f('#4a3428'); ctx.beginPath(); ctx.moveTo(-14, -16); ctx.lineTo(-16, -40); ctx.quadraticCurveTo(0, -48, 15, -40); ctx.lineTo(13, -16); ctx.closePath(); ctx.fill();
    ctx.fillStyle = f('#6a4a34'); ctx.beginPath(); ctx.moveTo(-9, -36); ctx.lineTo(9, -36); ctx.lineTo(11, -8); ctx.lineTo(-11, -8); ctx.closePath(); ctx.fill();
    // fissuras incandescentes (a brasa nela)
    ctx.strokeStyle = '#ff7020'; ctx.lineWidth = 1; ctx.globalAlpha = 0.6 + Math.sin(e.anim * 3) * 0.3;
    ctx.beginPath(); ctx.moveTo(-10, -38); ctx.lineTo(-6, -30); ctx.lineTo(-9, -22); ctx.moveTo(8, -40); ctx.lineTo(5, -32); ctx.lineTo(9, -26); ctx.stroke(); ctx.globalAlpha = 1;
    glow(ctx, 0, -30, 10, '#ff8030', 0.6);
    // cabeça: cabelo em trança, óculos de forja
    ctx.fillStyle = f('#3a2a24'); ctx.beginPath(); ctx.ellipse(2, -48, 6.5, 7, 0, 0, U.TAU); ctx.fill();
    ctx.fillStyle = f('#8a8a8a'); ctx.beginPath(); ctx.moveTo(-5, -50); ctx.quadraticCurveTo(-14, -44, -12, -34); ctx.lineTo(-9, -36); ctx.quadraticCurveTo(-10, -44, -3, -48); ctx.fill();
    ctx.fillStyle = '#1a1210'; ctx.fillRect(1, -51, 8, 3.4); eye(ctx, 6, -49.5, '#ffb040', 1.4);
    S.leg(ctx, 5, -18, mv ? Math.sin(w) * 6 : 6, 0, 10, -1, 4.2, f('#2c2220'));
    // martelo enorme
    const ang = p.name === 'sweep' ? swing(p, 0.7, -0.6, -0.6, 2.0) : p.name === 'ingots' ? swing(p, 0.7, 2.4, 2.4, -1.2) : swing(p, 0.7, -2.8, -2.8, 1.5);
    ctx.save(); ctx.translate(8, -36); ctx.rotate(ang);
    S.limb(ctx, 0, 0, 12, 0, 3.6, 3.2, f('#4a3428'));
    ctx.strokeStyle = f('#3a2a1e'); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(10, 0); ctx.lineTo(36, 0); ctx.stroke();
    ctx.fillStyle = f('#2e2826'); ctx.fillRect(32, -11, 14, 22);
    ctx.fillStyle = '#ff7a30'; ctx.fillRect(44, -10, 2.4, 20); glow(ctx, 45, 0, 12, '#ff6020', 0.6);
    ctx.restore();
    ctx.restore();
  };

  // ---------- A Mãe-Mariposa ----------
  B.mariposa = function (ctx, e) {
    const x = e.cx, y = e.cy, t = e.anim, fl = Math.sin(t * (e.atk && e.atk.name === 'gust' ? 30 : 12));
    const c1 = e.flash > 0 ? '#fff' : '#c8b890', c2 = '#7a6440';
    ctx.save(); ctx.translate(x, y); ctx.scale(e.facing, 1);
    for (const s of [-1, 1]) {
      ctx.save(); ctx.scale(1, s * (0.35 + Math.abs(fl) * 0.65));
      ctx.fillStyle = c1;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(-10, -34, -40, -26); ctx.quadraticCurveTo(-34, -6, 0, 0); ctx.fill();
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(10, -30, 36, -22); ctx.quadraticCurveTo(30, -6, 0, 0); ctx.fill();
      ctx.fillStyle = c2; ctx.beginPath(); ctx.arc(-24, -20, 6, 0, U.TAU); ctx.arc(22, -16, 5, 0, U.TAU); ctx.fill();
      ctx.fillStyle = '#1a1208'; ctx.beginPath(); ctx.arc(-24, -20, 2.6, 0, U.TAU); ctx.arc(22, -16, 2.2, 0, U.TAU); ctx.fill();
      ctx.restore();
    }
    ctx.fillStyle = '#4a3a24'; ctx.beginPath(); ctx.ellipse(0, 4, 6, 14, 0, 0, U.TAU); ctx.fill();
    ctx.fillStyle = '#6a5434'; for (let i = 0; i < 4; i++) ctx.fillRect(-5, -2 + i * 5, 10, 1.4);
    ctx.fillStyle = '#5a4a30'; ctx.beginPath(); ctx.arc(3, -10, 5, 0, U.TAU); ctx.fill();
    eye(ctx, 6, -11, '#ffe8a0', 1.6);
    ctx.strokeStyle = '#4a3a24'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(4, -14); ctx.quadraticCurveTo(10, -24, 18, -24); ctx.moveTo(4, -14); ctx.quadraticCurveTo(12, -20, 20, -18); ctx.stroke();
    ctx.restore();
    if (Math.random() < 0.4) VS.Gfx.emit({ x: x + U.rand(-30, 30), y: y + U.rand(-10, 10), vy: 20, life: 1.5, size: 1, color: '#e0d0a0' });
  };

  // ---------- Ama Elowen ----------
  B.elowen = function (ctx, e) {
    const f = F(e), p = pose(e), t = e.anim;
    begin(ctx, e);
    // raízes (fase 1) ou pés de raiz a andar (fase 2)
    ctx.strokeStyle = f('#2a2418'); ctx.lineWidth = 3;
    for (let i = -3; i <= 3; i++) { ctx.beginPath(); ctx.moveTo(i * 3, -10); ctx.quadraticCurveTo(i * 8, -2, i * (e.rooted ? 14 : 6) + (e.rooted ? 0 : Math.sin(t * 6 + i) * 3), 0); ctx.stroke(); }
    // vestido de casca e folhas
    ctx.fillStyle = f('#2e3e28'); ctx.beginPath(); ctx.moveTo(-16, -6); ctx.quadraticCurveTo(-18, -34, -8, -44); ctx.quadraticCurveTo(0, -48, 8, -44); ctx.quadraticCurveTo(18, -34, 16, -6); ctx.closePath(); ctx.fill();
    ctx.fillStyle = f('#3e5a32'); for (let i = 0; i < 9; i++) { ctx.beginPath(); ctx.ellipse(-12 + (i % 5) * 6, -12 - Math.floor(i / 5) * 12 - (i % 2) * 4, 4, 2, i, 0, U.TAU); ctx.fill(); }
    // braços: um embala um berço de vime
    ctx.fillStyle = f('#4a3a28'); ctx.beginPath(); ctx.ellipse(10, -26, 8, 5, 0, 0, Math.PI); ctx.fill();
    ctx.strokeStyle = f('#6a5a3a'); ctx.lineWidth = 0.6; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(3 + i * 4, -26); ctx.lineTo(4 + i * 4, -22); ctx.stroke(); }
    glow(ctx, 10, -28, 10, '#ffd0a0', 0.5); // a brasa dorme no berço
    // rosto: máscara de madeira serena
    ctx.fillStyle = f('#8a7a5a'); ctx.beginPath(); ctx.ellipse(1, -52, 6, 7.5, 0, 0, U.TAU); ctx.fill();
    ctx.fillStyle = '#1a1408'; ctx.beginPath(); ctx.ellipse(3, -53, 1.2, 0.7, 0, 0, U.TAU); ctx.ellipse(-1.5, -53, 1.2, 0.7, 0, 0, U.TAU); ctx.fill();
    ctx.strokeStyle = '#1a1408'; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.arc(1, -49, 2, 0.2, Math.PI - 0.2); ctx.stroke();
    // coroa de flores
    for (let i = 0; i < 7; i++) { const a = -Math.PI + i * Math.PI / 6; ctx.fillStyle = i % 2 ? '#c04a6a' : '#e0d070'; ctx.beginPath(); ctx.arc(1 + Math.cos(a) * 7, -56 + Math.sin(a) * 5, 1.8, 0, U.TAU); ctx.fill(); }
    // chicote de vinha
    const reach = p.name === 'whip' ? (p.ph === 'act' ? 130 * U.ease.outCubic(p.k) : p.ph === 'rec' ? 130 * (1 - p.k) : 0) : 0;
    ctx.strokeStyle = f('#3a5a2a'); ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(-6, -34);
    ctx.quadraticCurveTo(-14 + reach * 0.3, -44 + Math.sin(t * 2) * 3, 4 + reach, -18 + Math.sin(t * 1.5) * 4); ctx.stroke();
    if (reach > 10) { ctx.fillStyle = f('#6a8a3a'); for (let k = 0.2; k < 1; k += 0.12) { ctx.beginPath(); ctx.moveTo(reach * k, -20); ctx.lineTo(reach * k + 2, -25); ctx.lineTo(reach * k + 4, -20); ctx.fill(); } }
    ctx.restore();
    B.overlays(ctx, e);
  };

  // ---------- O Sineiro ----------
  B.sineiro = function (ctx, e) {
    const f = F(e), p = pose(e), w = wp(e), mv = Math.abs(e.vx) > 5;
    begin(ctx, e);
    S.leg(ctx, -4, -16, mv ? -Math.sin(w) * 6 : -5, 0, 9, -1, 3.6, f('#1e1a20'));
    ctx.fillStyle = f('#3a3040'); ctx.beginPath(); ctx.moveTo(-13, -14); ctx.quadraticCurveTo(-16, -38, -4, -44); ctx.quadraticCurveTo(12, -44, 13, -30); ctx.lineTo(12, -14); ctx.closePath(); ctx.fill();
    ctx.fillStyle = f('#2a2230'); ctx.beginPath(); ctx.moveTo(-6, -44); ctx.quadraticCurveTo(-2, -56, 6, -52); ctx.quadraticCurveTo(10, -46, 6, -42); ctx.fill();
    eye(ctx, 6, -48, '#ffe0a0', 1.4);
    // cordas enroladas
    ctx.strokeStyle = f('#6a5034'); ctx.lineWidth = 1.2; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.ellipse(0, -28 + i * 4, 12, 3, 0.2, 0, U.TAU); ctx.stroke(); }
    S.leg(ctx, 4, -16, mv ? Math.sin(w) * 6 : 5, 0, 9, -1, 3.8, f('#262028'));
    ctx.restore();
    // sino na corrente (coordenadas do mundo)
    const bp = e.bellPos || { x: e.cx + e.facing * 26, y: e.y + 36 + Math.sin(e.anim * 2) * 2 };
    ctx.strokeStyle = '#2a2018'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(e.cx + e.facing * 6, e.y + 14); ctx.lineTo(bp.x, bp.y - 12); ctx.stroke();
    ctx.fillStyle = e.flash > 0 ? '#fff' : '#8a6a30';
    ctx.beginPath(); ctx.moveTo(bp.x - 6, bp.y - 14); ctx.quadraticCurveTo(bp.x - 8, bp.y - 2, bp.x - 16, bp.y + 10); ctx.lineTo(bp.x + 16, bp.y + 10); ctx.quadraticCurveTo(bp.x + 8, bp.y - 2, bp.x + 6, bp.y - 14); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#c0a050'; ctx.fillRect(bp.x - 16, bp.y + 8, 32, 2.5);
    // destroços: sombras de aviso
    (e.debris || []).forEach((d) => { ctx.fillStyle = `rgba(0,0,0,${0.5 - d.t * 0.3})`; ctx.beginPath(); ctx.ellipse(d.x, e.arena.floor - 1, 9, 2.5, 0, 0, U.TAU); ctx.fill(); });
  };

  // ---------- Corvin, o Menestrel ----------
  B.corvin = function (ctx, e) {
    const f = F(e), p = pose(e), w = wp(e), mv = Math.abs(e.vx) > 5, st = e.strum || 0;
    begin(ctx, e);
    S.leg(ctx, -2, -15, mv ? -Math.sin(w) * 6 : -4, 0, 8, -1, 2.4, f('#1a1420'));
    // gibão de bobo da corte, desbotado
    ctx.fillStyle = f('#4a2440'); ctx.beginPath(); ctx.moveTo(-7, -14); ctx.lineTo(-8, -30); ctx.quadraticCurveTo(0, -34, 8, -30); ctx.lineTo(7, -14); ctx.closePath(); ctx.fill();
    ctx.fillStyle = f('#c0a050'); ctx.beginPath(); ctx.moveTo(-8, -30); ctx.lineTo(0, -22); ctx.lineTo(8, -30); ctx.lineTo(0, -26); ctx.fill();
    ctx.fillStyle = f('#2a1830'); ctx.beginPath(); ctx.moveTo(-7, -16); ctx.lineTo(8, -16); ctx.lineTo(10, -8); ctx.lineTo(-9, -8); ctx.fill();
    // máscara sorridente rachada e chapéu de penas
    ctx.fillStyle = f('#e8e0d0'); ctx.beginPath(); ctx.ellipse(1, -37, 4.5, 5.5, 0, 0, U.TAU); ctx.fill();
    ctx.strokeStyle = '#1a1018'; ctx.lineWidth = 0.7; ctx.beginPath(); ctx.arc(1.5, -36, 2.4, 0.3, Math.PI - 0.3); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-1, -42); ctx.lineTo(2, -35); ctx.stroke();
    eye(ctx, 3, -38.5, '#ffe0a0', 0.9);
    ctx.fillStyle = f('#2a1830'); ctx.beginPath(); ctx.ellipse(0, -42, 8, 2.5, -0.1, 0, U.TAU); ctx.fill(); ctx.fillRect(-4, -46, 8, 4);
    ctx.strokeStyle = f('#c04060'); ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(-4, -45); ctx.quadraticCurveTo(-14, -52, -16 + Math.sin(e.anim * 3) * 2, -44); ctx.stroke();
    S.leg(ctx, 2, -15, mv ? Math.sin(w) * 6 : 4, 0, 8, -1, 2.5, f('#22182a'));
    // alaúde
    ctx.save(); ctx.translate(2, -22); ctx.rotate(-0.5 + (p.name === 'strike' ? swing(p, 0, -1.5, -1.5, 1.2) : 0));
    ctx.fillStyle = f('#7a4a28'); ctx.beginPath(); ctx.ellipse(8, 0, 8, 6, 0, 0, U.TAU); ctx.fill();
    ctx.fillStyle = '#2a1408'; ctx.beginPath(); ctx.arc(8, 0, 2, 0, U.TAU); ctx.fill();
    ctx.fillStyle = f('#4a2a14'); ctx.fillRect(15, -1.4, 14, 2.8); ctx.fillRect(28, -3, 4, 6);
    ctx.strokeStyle = `rgba(255,240,200,${0.4 + st * 0.6})`; ctx.lineWidth = 0.4; for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(4, i * 0.8); ctx.lineTo(30, i * 0.8); ctx.stroke(); }
    ctx.restore();
    ctx.restore();
    if (st > 0.5) VS.Gfx.emit({ x: e.cx + e.facing * 10, y: e.cy - 4, vx: U.rand(-20, 20), vy: -30, life: 0.8, size: 1.4, color: '#ffe0a0', kind: 'note', add: true });
  };

  // ---------- Inquisidora Vael ----------
  B.vael = function (ctx, e) {
    const f = F(e), p = pose(e), w = wp(e), mv = Math.abs(e.vx) > 5;
    begin(ctx, e);
    ctx.fillStyle = f('#2a1418'); ctx.beginPath(); ctx.moveTo(-10, 0); ctx.lineTo(-7, -30); ctx.quadraticCurveTo(0, -36, 7, -30); ctx.lineTo(11, 0);
    for (let i = 0; i < 5; i++) ctx.lineTo(11 - i * 5.3, -2 + (mv ? Math.sin(w + i) * 1.5 : 0)); ctx.closePath(); ctx.fill();
    ctx.fillStyle = f('#6a1a22'); ctx.fillRect(-2, -30, 4, 26); // estola
    ctx.fillStyle = f('#d8c8b0'); ctx.beginPath(); ctx.moveTo(-6, -30); ctx.lineTo(6, -30); ctx.lineTo(3, -26); ctx.lineTo(-3, -26); ctx.fill();
    // mitra pontiaguda e véu
    ctx.fillStyle = f('#1a0c10'); ctx.beginPath(); ctx.moveTo(-5, -32); ctx.lineTo(0, -48); ctx.lineTo(6, -32); ctx.fill();
    ctx.fillStyle = f('#c09050'); ctx.fillRect(-5, -33, 11, 1.4);
    ctx.fillStyle = '#000'; ctx.fillRect(1, -37, 4, 2); eye(ctx, 3, -36, '#ff5030', 1);
    // incensório no mangual
    const ang = p.name && p.name.startsWith('flail') ? swing(p, 0.9, -2.6, -2.6, 1.6) : 0.9 + Math.sin(e.anim * 2) * 0.3;
    ctx.save(); ctx.translate(4, -22); ctx.rotate(ang);
    S.limb(ctx, 0, 0, 8, 0, 1.6, 1.4, f('#2a1418'));
    ctx.strokeStyle = f('#4a3a28'); ctx.lineWidth = 0.9; ctx.beginPath(); ctx.moveTo(8, 0); ctx.lineTo(30, 0); ctx.stroke();
    ctx.fillStyle = f('#8a6a30'); ctx.beginPath(); ctx.arc(33, 0, 5, 0, U.TAU); ctx.fill();
    glow(ctx, 33, 0, 12, '#ff8040', 0.7);
    ctx.restore();
    ctx.restore();
    if (Math.random() < 0.4) VS.Gfx.emit({ x: e.cx + e.facing * 20, y: e.cy, vx: U.rand(-5, 5), vy: -15, life: 2, size: 5, color: 'rgba(170,150,190,0.12)', kind: 'glow', color2: '#000000' });
  };

  // ---------- Bispo Ozias ----------
  B.ozias = function (ctx, e) {
    const f = F(e), p = pose(e), t = e.anim, wing = e.phase >= 1;
    ctx.save(); ctx.translate(e.cx, e.bottom); ctx.scale(e.facing, 1);
    if (wing) { // asas de luz
      ctx.globalCompositeOperation = 'lighter';
      for (const s of [-1, 1]) for (let i = 0; i < 5; i++) { ctx.fillStyle = `rgba(255,230,170,${0.15 - i * 0.02})`; ctx.save(); ctx.translate(0, -32); ctx.rotate(s * (0.5 + i * 0.25) + Math.sin(t * 2) * 0.05); ctx.beginPath(); ctx.ellipse(s * 26, 0, 30 - i * 3, 6, 0, 0, U.TAU); ctx.fill(); ctx.restore(); }
      ctx.globalCompositeOperation = 'source-over';
    }
    // vestes episcopais
    ctx.fillStyle = f('#e8dcc8'); ctx.beginPath(); ctx.moveTo(-12, 0); ctx.lineTo(-8, -34); ctx.quadraticCurveTo(0, -38, 8, -34); ctx.lineTo(12, 0); ctx.closePath(); ctx.fill();
    ctx.fillStyle = f('#6a1a8a'); ctx.beginPath(); ctx.moveTo(-6, -34); ctx.lineTo(6, -34); ctx.lineTo(9, 0); ctx.lineTo(-9, 0); ctx.closePath(); ctx.fill();
    ctx.fillStyle = f('#d0a040'); ctx.fillRect(-1, -32, 2, 30); ctx.fillRect(-5, -24, 10, 2);
    // mitra
    ctx.fillStyle = f('#f0e6d0'); ctx.beginPath(); ctx.moveTo(-5, -36); ctx.quadraticCurveTo(-6, -48, 0, -54); ctx.quadraticCurveTo(6, -48, 5, -36); ctx.fill();
    ctx.fillStyle = f('#d0a040'); ctx.fillRect(-0.7, -52, 1.4, 14);
    // rosto: velho, olhos de ouro derretido
    ctx.fillStyle = f('#b8a890'); ctx.beginPath(); ctx.ellipse(1, -39, 3.6, 4.2, 0, 0, U.TAU); ctx.fill();
    eye(ctx, 2.5, -40, '#ffd060', 1);
    // cálice erguido
    const raise = p.name === 'orb' ? (p.ph === 'wind' ? p.k : p.ph === 'act' ? 1 : 1 - p.k) : 0;
    ctx.save(); ctx.translate(8, -26 - raise * 12);
    ctx.fillStyle = '#c8a050'; ctx.beginPath(); ctx.moveTo(-4, -6); ctx.lineTo(4, -6); ctx.quadraticCurveTo(4, 0, 0, 1); ctx.quadraticCurveTo(-4, 0, -4, -6); ctx.fill(); ctx.fillRect(-0.6, 1, 1.2, 4); ctx.fillRect(-2.5, 4.5, 5, 1.2);
    glow(ctx, 0, -6, 10 + raise * 14, '#ffe8a0', 0.7);
    ctx.restore();
    ctx.restore();
    B.overlays(ctx, e);
  };

  // ---------- Os Gémeos da Guarda ----------
  function guard(ctx, e, heavy) {
    const f = F(e), p = pose(e), w = wp(e), mv = Math.abs(e.vx) > 5;
    begin(ctx, e);
    if (e.enraged) glow(ctx, 0, -24, 30, '#ff3020', 0.35);
    S.leg(ctx, -3, -17, mv ? -Math.sin(w) * 6 : -5, 0, 9, -1, heavy ? 4 : 3, f('#1e1416'));
    ctx.fillStyle = f(heavy ? '#3a2a2e' : '#2e2a34'); ctx.beginPath(); ctx.moveTo(heavy ? -12 : -9, -16); ctx.lineTo(heavy ? -12 : -9, -34); ctx.lineTo(heavy ? 12 : 9, -34); ctx.lineTo(heavy ? 13 : 10, -16); ctx.closePath(); ctx.fill();
    ctx.fillStyle = f('#6a1418'); ctx.beginPath(); ctx.moveTo(-6, -32); ctx.lineTo(6, -32); ctx.lineTo(7, -6); ctx.lineTo(0, -10); ctx.lineTo(-6, -6); ctx.closePath(); ctx.fill();
    ctx.fillStyle = f('#c09050'); ctx.beginPath(); ctx.arc(0, -22, 2.2, 0, U.TAU); ctx.fill();
    ctx.fillStyle = f('#3a3034'); ctx.beginPath(); ctx.moveTo(-5, -34); ctx.lineTo(-5, -44); ctx.quadraticCurveTo(1, -48, 6, -44); ctx.lineTo(6, -34); ctx.fill();
    ctx.fillStyle = '#000'; ctx.fillRect(1, -41, 5, 1.6); eye(ctx, 4, -40.2, e.enraged ? '#ff3020' : '#ff8050', 0.9);
    ctx.fillStyle = f('#c09050'); ctx.fillRect(heavy ? -6 : 4, -48, 2, 5);
    S.leg(ctx, 3, -17, mv ? Math.sin(w) * 6 : 5, 0, 9, -1, heavy ? 4.2 : 3.2, f('#261a1e'));
    if (heavy) {
      const ang = p.name === 'sweep' ? swing(p, 0.8, -0.4, -0.4, 2) : swing(p, 0.8, -2.8, -2.8, 1.5);
      ctx.save(); ctx.translate(6, -30); ctx.rotate(ang);
      S.limb(ctx, 0, 0, 10, 0, 3, 2.6, f('#3a2a2e'));
      ctx.strokeStyle = f('#3a2a1e'); ctx.lineWidth = 2.6; ctx.beginPath(); ctx.moveTo(8, 0); ctx.lineTo(34, 0); ctx.stroke();
      ctx.fillStyle = f('#4a4448'); ctx.fillRect(30, -9, 12, 18); ctx.fillStyle = f('#6a6468'); for (let i = 0; i < 3; i++) ctx.fillRect(42, -8 + i * 6, 3, 3);
      ctx.restore();
    } else {
      const ang = p.name === 'cut2' ? swing(p, 0.9, 1.6, 1.6, -1.8) : p.name === 'dash' ? 0 : swing(p, -0.3, -2.4, -2.4, 1.0);
      ctx.save(); ctx.translate(6, -28); ctx.rotate(ang);
      S.limb(ctx, 0, 0, 9, 0, 2, 1.8, f('#2e2a34'));
      ctx.fillStyle = f('#d0d0d8'); ctx.beginPath(); ctx.moveTo(10, -1.4); ctx.lineTo(34, -0.6); ctx.lineTo(38, 0); ctx.lineTo(34, 0.6); ctx.lineTo(10, 1.4); ctx.fill();
      ctx.restore();
      ctx.fillStyle = f('#4a1418'); ctx.beginPath(); ctx.moveTo(-10, -32); ctx.lineTo(-16, -30); ctx.lineTo(-16, -14); ctx.quadraticCurveTo(-13, -8, -10, -8); ctx.fill();
    }
    ctx.restore();
  }
  B.gemeo_a = (ctx, e) => guard(ctx, e, false);
  B.gemeo_b = (ctx, e) => guard(ctx, e, true);

  // ---------- Rei Aldric ----------
  B.aldric = function (ctx, e) {
    const f = F(e), p = pose(e), w = wp(e), mv = Math.abs(e.vx) > 5, fire = e.phase >= 1;
    begin(ctx, e);
    if (fire) { glow(ctx, 0, -30, 50, '#ff5010', 0.35 + Math.sin(e.anim * 5) * 0.08); if (Math.random() < 0.7) VS.Gfx.emit({ x: e.cx + U.rand(-14, 14), y: e.y + U.rand(0, 30), vx: U.rand(-10, 10), vy: U.rand(-90, -40), life: 0.8, size: U.rand(1, 2.5), color: U.pick(['#ff6010', '#ffb040']), add: true, shrink: true }); }
    S.leg(ctx, -4, -20, mv ? -Math.sin(w) * 7 : -6, 0, 11, -1, 4, f('#1a1012'));
    // manto real rasgado
    ctx.fillStyle = f('#4a0e14'); ctx.beginPath(); ctx.moveTo(-10, -42); ctx.quadraticCurveTo(-26, -20, -22 + Math.sin(e.anim * 1.5) * 2, 0); for (let i = 0; i < 4; i++) ctx.lineTo(-22 + i * 4, -3 + (i % 2) * 4); ctx.lineTo(-8, -18); ctx.closePath(); ctx.fill();
    ctx.fillStyle = f('#e0d8c8'); ctx.beginPath(); ctx.moveTo(-12, -42); ctx.quadraticCurveTo(-4, -46, 4, -44); ctx.lineTo(0, -38); ctx.closePath(); ctx.fill(); // arminho
    // armadura negra e dourada
    ctx.fillStyle = f('#221a1e'); ctx.beginPath(); ctx.moveTo(-11, -18); ctx.lineTo(-12, -42); ctx.quadraticCurveTo(0, -48, 12, -42); ctx.lineTo(12, -18); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = f('#c09050'); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-10, -40); ctx.lineTo(10, -40); ctx.moveTo(0, -40); ctx.lineTo(0, -20); ctx.stroke();
    if (fire) { ctx.strokeStyle = '#ff7020'; ctx.lineWidth = 0.9; ctx.beginPath(); ctx.moveTo(-8, -36); ctx.lineTo(-4, -28); ctx.lineTo(-8, -22); ctx.moveTo(6, -38); ctx.lineTo(3, -30); ctx.stroke(); }
    // cabeça e coroa
    ctx.fillStyle = f('#2a2024'); ctx.beginPath(); ctx.ellipse(2, -50, 6, 7, 0, 0, U.TAU); ctx.fill();
    ctx.fillStyle = f('#8a8080'); ctx.beginPath(); ctx.moveTo(-4, -46); ctx.quadraticCurveTo(2, -40, 8, -46); ctx.lineTo(6, -42); ctx.quadraticCurveTo(2, -38, -2, -42); ctx.fill(); // barba
    eye(ctx, 5, -51, fire ? '#ff6020' : '#c0b0a0', 1.2);
    ctx.fillStyle = fire ? '#ffb040' : '#c09050';
    for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(2 + i * 3 - 1.4, -56); ctx.lineTo(2 + i * 3, -61 - (i === 0 ? 2 : 0)); ctx.lineTo(2 + i * 3 + 1.4, -56); ctx.fill(); }
    ctx.fillRect(-5, -57, 14, 2);
    S.leg(ctx, 4, -20, mv ? Math.sin(w) * 7 : 6, 0, 11, -1, 4.2, f('#20161a'));
    // montante
    let ang = 0.6;
    if (p.name === 'sweep' || p.name === 'echo_caedmon') ang = swing(p, 0.6, -2.2, -2.2, 1.4);
    if (p.name === 'sweep2') ang = swing(p, 1.4, 2.0, 2.0, -1.6);
    if (p.name === 'overhead' || p.name === 'leap') ang = swing(p, 0.6, -2.9, -2.9, 1.6);
    if (p.name === 'grab') ang = -0.2;
    ctx.save(); ctx.translate(8, -38); ctx.rotate(ang);
    S.limb(ctx, 0, 0, 12, 0, 3.4, 3, f('#221a1e'));
    ctx.fillStyle = f('#c09050'); ctx.fillRect(11, -6, 3, 12);
    ctx.fillStyle = f(fire ? '#ffc890' : '#b8b4bc'); ctx.beginPath(); ctx.moveTo(14, -2.6); ctx.lineTo(54, -1.6); ctx.lineTo(60, 0); ctx.lineTo(54, 1.6); ctx.lineTo(14, 2.6); ctx.closePath(); ctx.fill();
    if (fire) glow(ctx, 40, 0, 18, '#ff6020', 0.6);
    ctx.restore();
    if (p.name === 'grab' && p.ph !== 'none') { ctx.fillStyle = f('#221a1e'); S.limb(ctx, 6, -30, 18 + (p.ph === 'act' ? 10 : 0), -26, 3, 2.6, f('#221a1e')); }
    ctx.restore();
    // eco do guardião evocado
    if (e.echo && e.atk && e.atk.phase === 'wind') { const col = { caedmon: '#a0c8ff', hilde: '#ff8030', elowen: '#9fffd0', corvin: '#ffe0a0', ozias: '#fff0c0' }[e.echo]; ctx.globalAlpha = 0.35; ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(e.cx - e.facing * 20, e.cy - 6, 12, 26, 0, 0, U.TAU); ctx.fill(); ctx.globalAlpha = 1; glow(ctx, e.cx - e.facing * 20, e.cy - 6, 30, col, 0.5); }
    B.overlays(ctx, e);
  };

  // ---------- O Eco de Seraphine ----------
  B.seraphine = function (ctx, e) {
    const t = e.anim, dim = e.dim > 0;
    const x = e.cx, y = e.bottom;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    // halo de seis raios (as brasas)
    for (let i = 0; i < 6; i++) { const a = t * 0.4 + i * U.TAU / 6; ctx.strokeStyle = `rgba(255,230,180,${dim ? 0.1 : 0.35})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, y - 34); ctx.lineTo(x + Math.cos(a) * 46, y - 34 + Math.sin(a) * 46); ctx.stroke(); }
    ctx.globalCompositeOperation = 'source-over';
    // vestido de chama
    const col = e.flash > 0 ? '#ffffff' : dim ? '#8a7a90' : '#fff0d0';
    ctx.fillStyle = col; ctx.globalAlpha = dim ? 0.7 : 0.92;
    ctx.beginPath(); ctx.moveTo(x - 4, y - 40);
    for (let i = 0; i <= 8; i++) { const k = i / 8; ctx.lineTo(x - 4 - k * 14 + Math.sin(t * 4 + i) * 2, y - 40 + k * 40 + Math.sin(t * 6 + i) * 2); }
    for (let i = 8; i >= 0; i--) { const k = i / 8; ctx.lineTo(x + 4 + k * 14 + Math.sin(t * 5 + i) * 2, y - 40 + k * 40 + Math.cos(t * 6 + i) * 2); }
    ctx.closePath(); ctx.fill();
    // rosto e coroa
    ctx.beginPath(); ctx.ellipse(x, y - 46, 5, 6, 0, 0, U.TAU); ctx.fill();
    ctx.fillStyle = dim ? '#5a4a60' : '#ffd070'; for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(x + i * 2.4 - 1, y - 51); ctx.lineTo(x + i * 2.4, y - 56); ctx.lineTo(x + i * 2.4 + 1, y - 51); ctx.fill(); }
    ctx.fillStyle = dim ? '#2a2030' : '#c08040'; ctx.beginPath(); ctx.ellipse(x - 1.6, y - 46, 0.9, 1.4, 0, 0, U.TAU); ctx.ellipse(x + 1.6, y - 46, 0.9, 1.4, 0, 0, U.TAU); ctx.fill();
    ctx.globalAlpha = 1;
    ctx.restore();
    glow(ctx, x, y - 30, dim ? 30 : 70, '#fff0c0', dim ? 0.3 : 0.7);
    B.overlays(ctx, e);
  };

  // sobreposições também para quem não as chama no próprio desenho
  ['hilde', 'coveiro', 'vael', 'automato', 'corvin'].forEach((k) => { const orig = B[k]; B[k] = (ctx, e, g) => { orig(ctx, e, g); B.overlays(ctx, e); }; });
  VS.SpritesBoss = B;
})(window.VS);
