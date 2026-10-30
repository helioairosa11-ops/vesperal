// Vesperal — os três finais: sequências próprias, ecrã de vitória e créditos
'use strict';
(function (VS) {
  const U = VS.U, G = VS.Gfx, A = VS.Audio;
  // tamanho lógico do ecrã (muda com a forma do ecrã: ver U.fitScreen); lido a cada imagem
  let W = U.SCREEN_W, H = U.SCREEN_H;
  const LINES = {
    end1: ['end1_l1', 'end1_l2', 'end1_l3', 'end1_l4', 'end1_l5', 'end1_l6'],
    end2: ['end2_l1', 'end2_l2', 'end2_l3', 'end2_l4', 'end2_l5', 'end2_l6'],
    end3: ['end3_l1', 'end3_l2', 'end3_l3', 'end3_l4', 'end3_l5', 'end3_l6', 'end3_l7'],
  };
  const LINE_T = 6.2;

  class Scene {
    constructor(id, game) {
      this.id = id; this.game = game; this.t = 0; this.lines = LINES[id]; this.li = -1; this.done = false;
      this.el = document.createElement('div'); this.el.className = 'ending-text'; document.getElementById('ui').appendChild(this.el);
      this.parts = [];
      this.rnd = U.rng(U.hash(id));
      A.playMusic(id, { fade: 2 }); A.setAmbience(null);
    }
    update(dt) {
      this.t += dt;
      if (VS.Input.pressed('ui_ok') && this.t > 2) this.t = Math.max(this.t, (this.li + 1) * LINE_T + 1.5); // avançar
      const li = Math.floor((this.t - 1.5) / LINE_T);
      if (li !== this.li && li >= 0) {
        this.li = li;
        if (li < this.lines.length) { this.el.style.opacity = 0; setTimeout(() => { this.el.textContent = VS.t(this.lines[li]); this.el.style.opacity = 1; }, 600); }
        else if (!this.done) { this.done = true; this.el.style.opacity = 0; setTimeout(() => this.finish(), 1800); }
      }
      if (this.li >= 0 && this.li < this.lines.length && (this.t - 1.5) % LINE_T > LINE_T - 1) this.el.style.opacity = 0;
      G.updateParticles(dt);
    }
    finish() {
      this.el.remove();
      const st = VS.state;
      const prof = VS.Save.loadProfile();
      if (!prof.endings.includes(this.id)) prof.endings.push(this.id);
      VS.Save.saveProfile(prof);
      st.flags['ending_' + this.id] = true;
      if (this.game) this.game.save();
      // ecrã de vitória
      const UI = VS.UI;
      const el = UI.h('div', 'panel victory');
      el.innerHTML = `<div class="panel-title">${UI.esc(VS.t('victory_title'))}</div><div class="v-name">${UI.esc(VS.t(this.id + '_name'))}</div>
        <div class="v-stats">${UI.esc(VS.t('victory_time', { t: U.fmtTime(st.playTime) }))}<br>${UI.esc(VS.t('victory_deaths', { n: st.deaths }))}<br>${UI.esc(VS.t('victory_pct', { n: st.completion() }))}<br>${UI.esc(VS.t('victory_endings', { n: prof.endings.length }))}</div>
        <div class="panel-text">${UI.rich(VS.t(prof.endings.length < 3 ? 'victory_more' : 'victory_all'))}</div><button class="btn" data-nav="1">${UI.esc(VS.t('death_continue'))}</button>`;
      const panel = { el, onBack: () => { }, noX: true };
      el.querySelector('button').onclick = () => { UI.close(panel); VS.Menus.credits(true, () => VS.App.toMenu()); };
      UI.open(panel);
    }
    draw(ctx) {
      W = U.SCREEN_W; H = U.SCREEN_H;
      G.hudTransform(ctx);
      const t = this.t, k = Math.min(1, t / 40);
      if (this.id === 'end1') this.drawEnd1(ctx, t, k);
      else if (this.id === 'end2') this.drawEnd2(ctx, t, k);
      else this.drawEnd3(ctx, t, k);
      G.drawParticles(ctx, 0);
      G.vignette(0.6);
      const fin = Math.min(1, t / 2); if (fin < 1) { ctx.fillStyle = `rgba(0,0,0,${1 - fin})`; ctx.fillRect(0, 0, W, H); }
    }
    figure(ctx, x, y, s, col, opts) { // silhueta humana simples e elegante
      opts = opts || {};
      ctx.fillStyle = col;
      ctx.beginPath(); ctx.moveTo(x - 7 * s, y); ctx.quadraticCurveTo(x - 8 * s, y - 20 * s, x - 4 * s, y - 28 * s); ctx.lineTo(x + 4 * s, y - 28 * s); ctx.quadraticCurveTo(x + 8 * s, y - 20 * s, x + 7 * s, y); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.ellipse(x, y - 32 * s, 4 * s, 4.8 * s, 0, 0, U.TAU); ctx.fill();
      if (opts.hood) { ctx.beginPath(); ctx.moveTo(x - 5 * s, y - 30 * s); ctx.quadraticCurveTo(x - 12 * s, y - 32 * s, x - 10 * s, y - 24 * s); ctx.lineTo(x - 4 * s, y - 28 * s); ctx.fill(); }
      if (opts.crown) { ctx.fillStyle = opts.crown; for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(x + i * 2 * s - s, y - 36 * s); ctx.lineTo(x + i * 2 * s, y - 40 * s); ctx.lineTo(x + i * 2 * s + s, y - 36 * s); ctx.fill(); } }
    }
    // ---------- Final 1: A Nova Chama ----------
    drawEnd1(ctx, t, k) {
      const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#120806'); g.addColorStop(1, U.mix('#3a1a0a', '#7a3a10', k)); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#0c0606'; for (let x = 40 + ((W - 640) / 2) % 110; x < W; x += 110) ctx.fillRect(x, 0, 26, H);
      ctx.fillStyle = '#080404'; ctx.fillRect(0, H - 50, W, 50);
      // mortos que finalmente descansam
      for (let i = 0; i < 9; i++) { const x = 60 + i * (W - 128) / 8 + Math.sin(i) * 10, rise = Math.max(0, t - 6 - i * 1.2) * 6; const a = Math.max(0, 0.5 - rise / 200); if (a <= 0) continue; ctx.globalAlpha = a; this.figure(ctx, x, H - 50 - rise, 0.8, '#7a90c0'); ctx.globalAlpha = 1; if (Math.random() < 0.05) G.emit({ x, y: H - 60 - rise, vy: -20, life: 2, size: 1, color: '#a0b8ff', add: true }); }
      // Ione recebe as brasas
      const ix = W / 2 + 30, iy = H - 50;
      const glowK = Math.min(1, Math.max(0, (t - 10) / 14));
      VS.Sprites.glow(ctx, ix, iy - 30, 40 + glowK * 120, '#ff9a40', 0.3 + glowK * 0.5);
      this.figure(ctx, ix, iy, 1.3, U.mix('#1a1012', '#ffd8a0', glowK * 0.8));
      for (let i = 0; i < 6; i++) { const a = t * 0.8 + i * U.TAU / 6, r = Math.max(0, 60 - Math.max(0, t - 8) * 3); if (r <= 0) continue; const ex = ix + Math.cos(a) * r, ey = iy - 40 + Math.sin(a) * r * 0.5; VS.Sprites.glow(ctx, ex, ey, 12, '#ffb040', 0.9); ctx.fillStyle = '#fff0c0'; ctx.beginPath(); ctx.arc(ex, ey, 2, 0, U.TAU); ctx.fill(); }
      // o Desperto ajoelha e desfaz-se em cinza
      const px = W / 2 - 80, fade = Math.max(0, 1 - Math.max(0, t - 22) / 10);
      ctx.globalAlpha = fade; this.figure(ctx, px, iy, 1.0, '#141218', { hood: true }); ctx.globalAlpha = 1;
      if (t > 22 && t < 34 && Math.random() < 0.6) G.emit({ x: px + U.rand(-8, 8), y: iy - U.rand(0, 36), vx: U.rand(-10, 20), vy: U.rand(-40, -10), life: 3, size: 1.4, color: U.pick(['#6a6068', '#ffb040']), kind: 'flake', vr: 3 });
    }
    // ---------- Final 2: O Cálice de Cinza ----------
    drawEnd2(ctx, t, k) {
      const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#0a0610'); g.addColorStop(1, '#2a0a14'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      // janelas com crepúsculo eterno
      const nw = Math.max(4, Math.floor((W - 40) / 150)), w0 = (W - (nw - 1) * 150 - 60) / 2;
      for (let i = 0; i < nw; i++) { const x = w0 + i * 150; const wg = ctx.createLinearGradient(0, 40, 0, 220); wg.addColorStop(0, '#3a2050'); wg.addColorStop(1, '#8a4060'); ctx.fillStyle = wg; ctx.beginPath(); ctx.moveTo(x, 220); ctx.lineTo(x, 80); ctx.quadraticCurveTo(x + 30, 40, x + 60, 80); ctx.lineTo(x + 60, 220); ctx.fill(); }
      ctx.fillStyle = '#060306'; ctx.fillRect(0, H - 60, W, 60);
      // trono
      const tx = W / 2, ty = H - 60;
      ctx.fillStyle = '#140a0c'; ctx.fillRect(tx - 34, ty - 110, 68, 110); ctx.beginPath(); ctx.moveTo(tx - 40, ty - 110); ctx.lineTo(tx, ty - 150); ctx.lineTo(tx + 40, ty - 110); ctx.fill();
      ctx.fillStyle = '#c09050'; ctx.fillRect(tx - 36, ty - 112, 72, 3);
      const burn = Math.min(1, Math.max(0, (t - 8) / 10));
      this.figure(ctx, tx, ty - 20, 1.3, U.mix('#141218', '#3a1010', burn), { hood: true, crown: burn > 0.4 ? '#ff6020' : null });
      VS.Sprites.glow(ctx, tx, ty - 60, 30 + burn * 60, '#ff4010', 0.3 + burn * 0.4);
      if (Math.random() < 0.3 * burn) G.emit({ x: tx + U.rand(-14, 14), y: ty - U.rand(20, 70), vy: U.rand(-60, -20), life: 1.5, size: 1.4, color: U.pick(['#ff6010', '#ffb040']), add: true, shrink: true });
      // cálice
      ctx.fillStyle = '#c8a050'; ctx.beginPath(); ctx.moveTo(tx + 14, ty - 56); ctx.lineTo(tx + 26, ty - 56); ctx.quadraticCurveTo(tx + 26, ty - 46, tx + 20, ty - 44); ctx.quadraticCurveTo(tx + 14, ty - 46, tx + 14, ty - 56); ctx.fill();
      // Ione afasta-se
      const ix = Math.min(W + 40, W / 2 + 120 + Math.max(0, t - 18) * 9);
      this.figure(ctx, ix, ty, 1.1, '#2a1a22');
    }
    // ---------- Final 3: Aurora ----------
    drawEnd3(ctx, t, k) {
      const dawn = Math.min(1, Math.max(0, (t - 6) / 26));
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, U.mix('#0a0a18', '#5a7ab8', dawn)); g.addColorStop(0.6, U.mix('#1a1020', '#f0a070', dawn)); g.addColorStop(1, U.mix('#2a1410', '#ffe0a0', dawn));
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      // o sol: o Lume devolvido ao céu
      const sy = H - 90 - dawn * 120;
      VS.Sprites.glow(ctx, W / 2, sy, 80 + dawn * 160, '#ffd890', 0.5 + dawn * 0.4);
      ctx.fillStyle = U.rgba('#fff4d8', 0.6 + dawn * 0.4); ctx.beginPath(); ctx.arc(W / 2, sy, 18 + dawn * 10, 0, U.TAU); ctx.fill();
      // cidade em silhueta
      ctx.fillStyle = U.mix('#05040a', '#3a2830', dawn * 0.5);
      const r = U.rng(7);
      for (let x = 0; x < W; x += 24) { const h = 30 + r() * 60; ctx.fillRect(x, H - 70 - h, 22, h + 70); ctx.beginPath(); ctx.moveTo(x - 2, H - 70 - h); ctx.lineTo(x + 11, H - 90 - h); ctx.lineTo(x + 24, H - 70 - h); ctx.fill(); }
      ctx.fillStyle = '#05040a'; ctx.fillRect(0, H - 40, W, 40);
      // aves
      ctx.strokeStyle = 'rgba(20,10,20,0.7)'; ctx.lineWidth = 1;
      for (let i = 0; i < 6; i++) { const bx = (t * 18 + i * W / 7) % (W + 40) - 20, by = 80 + Math.sin(t + i) * 10 + i * 8; const f = Math.sin(t * 8 + i) * 3; ctx.beginPath(); ctx.moveTo(bx - 5, by - f); ctx.lineTo(bx, by); ctx.lineTo(bx + 5, by - f); ctx.stroke(); }
      // Ione sente o calor; o Desperto torna-se luz
      this.figure(ctx, W / 2 + 40, H - 40, 1.2, '#140c10');
      const fade = Math.max(0, 1 - Math.max(0, t - 26) / 10);
      ctx.globalAlpha = fade; this.figure(ctx, W / 2 - 40, H - 40, 1.1, '#100c12', { hood: true }); ctx.globalAlpha = 1;
      if (t > 26 && t < 38 && Math.random() < 0.7) G.emit({ x: W / 2 - 40 + U.rand(-8, 8), y: H - 40 - U.rand(0, 36), vx: U.rand(-5, 15), vy: U.rand(-50, -20), life: 3, size: 1.2, color: '#fff0c0', add: true });
    }
  }

  const End = {};
  End.play = function (id, game) {
    VS.UI.closeAll();
    VS.App.mode = 'ending';
    VS.App.ending = new Scene(id, game);
    G.particles.length = 0;
  };
  VS.Endings = End;
})(window.VS);
