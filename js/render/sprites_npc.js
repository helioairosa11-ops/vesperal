// Vesperal — desenho das personagens: Ione, Hrolf, Maren, Teodoro (e as consequências)
'use strict';
(function (VS) {
  const U = VS.U, S = VS.Sprites;
  const N = {};
  const glow = (...a) => S.glow(...a);
  const breathe = (n) => Math.sin(n.t * 1.8) * 0.6;

  N.ione = function (ctx, n) {
    const b = breathe(n);
    ctx.save(); ctx.translate(n.cx, n.bottom); ctx.scale(n.facing, 1);
    // vestido longo cinzento-pérola
    ctx.fillStyle = '#b8b0b8'; ctx.beginPath(); ctx.moveTo(-8, 0); ctx.quadraticCurveTo(-7, -14, -4, -22 + b); ctx.lineTo(4, -22 + b); ctx.quadraticCurveTo(7, -14, 8, 0); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#8a8290'; ctx.fillRect(-4, -16 + b, 8, 1.4);
    // xaile escuro
    ctx.fillStyle = '#3a3040'; ctx.beginPath(); ctx.moveTo(-5, -22 + b); ctx.quadraticCurveTo(-9, -16, -7, -10); ctx.lineTo(-3, -16); ctx.lineTo(3, -22 + b); ctx.fill();
    // cabeça; venda sobre os olhos
    ctx.fillStyle = '#e0d4c4'; ctx.beginPath(); ctx.ellipse(0.5, -26 + b, 3.4, 4, 0, 0, U.TAU); ctx.fill();
    ctx.fillStyle = '#d8d0c8'; ctx.fillRect(-3, -27.5 + b, 7, 1.8);
    ctx.fillStyle = '#2a2026'; ctx.beginPath(); ctx.moveTo(-3.5, -28 + b); ctx.quadraticCurveTo(-5, -20, -3, -14); ctx.lineTo(-1, -24); ctx.quadraticCurveTo(0, -31, 3.6, -28 + b); ctx.quadraticCurveTo(1, -32 + b, -3.5, -28 + b); ctx.fill();
    // mãos juntas com uma vela apagada
    ctx.fillStyle = '#e0d4c4'; ctx.beginPath(); ctx.arc(3, -14 + b, 1.4, 0, U.TAU); ctx.fill();
    ctx.fillStyle = '#e8dcc0'; ctx.fillRect(2.4, -19 + b, 1.4, 5);
    ctx.restore();
    glow(ctx, n.cx, n.bottom - 18, 18, '#ffd8a0', 0.25);
  };
  N.hrolf = function (ctx, n) {
    const b = breathe(n);
    ctx.save(); ctx.translate(n.cx, n.bottom); ctx.scale(n.facing, 1);
    ctx.fillStyle = '#1e1816'; ctx.fillRect(-5, -10, 4, 10); ctx.fillRect(1, -10, 4, 10);
    ctx.fillStyle = '#4a3428'; ctx.beginPath(); ctx.moveTo(-9, -9); ctx.lineTo(-10, -26 + b); ctx.quadraticCurveTo(0, -31, 10, -26 + b); ctx.lineTo(9, -9); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#6a4a34'; ctx.fillRect(-6, -24 + b, 12, 16);
    ctx.fillStyle = '#c8a888'; ctx.beginPath(); ctx.ellipse(1, -30 + b, 4.4, 4.8, 0, 0, U.TAU); ctx.fill();
    ctx.fillStyle = '#b06a3a'; ctx.beginPath(); ctx.moveTo(-3, -29 + b); ctx.quadraticCurveTo(1, -18, 5, -29 + b); ctx.lineTo(4, -26); ctx.quadraticCurveTo(1, -22, -2, -26); ctx.fill(); // barba ruiva
    ctx.fillStyle = '#b06a3a'; ctx.beginPath(); ctx.ellipse(0, -33.5 + b, 4.6, 2, 0, Math.PI, 0); ctx.fill();
    ctx.fillStyle = '#1a1010'; ctx.fillRect(2, -31 + b, 1.2, 1.2);
    // martelo ao ombro
    ctx.strokeStyle = '#3a2a1e'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(6, -14); ctx.lineTo(12, -32); ctx.stroke();
    ctx.fillStyle = '#4a4448'; ctx.fillRect(9, -36, 7, 5);
    ctx.restore();
  };
  N.maren = function (ctx, n) {
    const b = breathe(n);
    ctx.save(); ctx.translate(n.cx, n.bottom); ctx.scale(n.facing, 1);
    // mochila de peregrina com lanterna
    ctx.fillStyle = '#3a2e24'; ctx.fillRect(-11, -26 + b, 7, 14);
    ctx.fillStyle = '#2a2020'; ctx.fillRect(-12, -30 + b, 4, 4); ctx.fillStyle = '#ffd090'; ctx.fillRect(-11.4, -29.4 + b, 2.8, 2.8);
    ctx.fillStyle = '#5a4a3a'; ctx.beginPath(); ctx.moveTo(-7, 0); ctx.lineTo(-5, -22 + b); ctx.quadraticCurveTo(0, -26, 5, -22 + b); ctx.lineTo(7, 0); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#7a1a2a'; ctx.fillRect(-5, -14, 10, 2); // cinto
    ctx.fillStyle = '#4a3a2e'; ctx.beginPath(); ctx.moveTo(-5, -24 + b); ctx.quadraticCurveTo(-4, -34 + b, 1, -33 + b); ctx.quadraticCurveTo(6, -31 + b, 5, -23 + b); ctx.fill(); // capuz
    ctx.fillStyle = '#d8c4b0'; ctx.beginPath(); ctx.ellipse(2, -27 + b, 2.8, 3.4, 0, 0, U.TAU); ctx.fill();
    ctx.fillStyle = '#1a1010'; ctx.fillRect(3, -28 + b, 1, 1);
    // bordão
    ctx.strokeStyle = '#4a3a24'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(7, 0); ctx.lineTo(8, -34); ctx.stroke();
    ctx.restore();
    glow(ctx, n.cx - n.facing * 10, n.bottom - 28, 14, '#ffd090', 0.4);
  };
  N.teodoro = function (ctx, n) {
    const tremble = Math.sin(n.t * 20) * 0.3;
    ctx.save(); ctx.translate(n.cx + tremble, n.bottom); ctx.scale(n.facing, 1);
    // acólito encolhido, sotaina rasgada
    ctx.fillStyle = '#2a2232'; ctx.beginPath(); ctx.moveTo(-7, 0); ctx.lineTo(-6, -18); ctx.quadraticCurveTo(0, -24, 6, -18); ctx.lineTo(7, 0); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#e8e0d0'; ctx.fillRect(-2, -18, 4, 3); // colarinho
    ctx.fillStyle = '#d8c8b8'; ctx.beginPath(); ctx.ellipse(1, -22, 3.4, 3.8, 0.2, 0, U.TAU); ctx.fill();
    ctx.fillStyle = '#3a2a20'; ctx.beginPath(); ctx.ellipse(0, -24.5, 3.6, 1.8, 0, Math.PI, 0); ctx.fill();
    ctx.fillStyle = '#1a1010'; ctx.fillRect(2, -23, 1, 1);
    ctx.fillStyle = '#d8c8b8'; ctx.beginPath(); ctx.arc(4, -12, 1.4, 0, U.TAU); ctx.fill();
    ctx.restore();
  };
  function body(ctx, n, col) {
    ctx.save(); ctx.translate(n.cx, n.bottom);
    ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(0, -3, 12, 3.6, 0, 0, U.TAU); ctx.fill();
    ctx.fillStyle = '#c8b8a8'; ctx.beginPath(); ctx.arc(11, -4, 2.6, 0, U.TAU); ctx.fill();
    ctx.restore();
    if (n.interactable) glow(ctx, n.cx, n.bottom - 6, 12, '#ffe8c0', 0.3 + Math.sin(n.t * 3) * 0.1);
  }
  N.hrolf_body = (ctx, n) => body(ctx, n, '#4a3428');
  N.teodoro_body = (ctx, n) => body(ctx, n, '#2a2232');

  // folhas do ateliê (npc_<id>): parado, a falar (enquanto o diálogo dela está aberto) e caído (consequências)
  function sheetDraw(ctx, n) {
    const dead = /_body$/.test(n.nid), id = n.nid.replace(/_body$/, '');
    const sh = VS.Assets.sheet('npc_' + id);
    if (!sh || !VS.Assets.ok(sh.img)) return false;
    const A = sh.meta.anims, an = dead && A.dead ? 'dead' : n.talking && A.talk ? 'talk' : 'idle';
    const f = VS.Assets.frame(sh, an, (n.t || 0) * A[an].fps + (n.seed || 0));
    if (!f) return false;
    ctx.save(); ctx.translate(n.cx, n.bottom); ctx.scale(dead ? 1 : n.facing, 1);
    VS.Assets.drawFrame(ctx, sh, f);
    ctx.restore();
    if (id === 'ione' && !dead) glow(ctx, n.cx + n.facing * 1.5, n.bottom - 19, 16, '#ffd8a0', 0.22 + Math.sin((n.t || 0) * 2) * 0.04);
    if (dead && n.interactable) glow(ctx, n.cx, n.bottom - 6, 12, '#ffe8c0', 0.3 + Math.sin(n.t * 3) * 0.1);
    return true;
  }
  VS.SpritesNPC = { draw(ctx, n, g) { if (sheetDraw(ctx, n)) return; (N[n.nid] || N.teodoro)(ctx, n, g); } };
})(window.VS);
