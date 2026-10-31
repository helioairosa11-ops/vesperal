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
    // ---------- pintura comum dos finais ----------
    // os planos pintados de uma região (como no menu), com uma "graduação" de cor por cima, e o chão em primeiro plano
    paintBG(ctx, key, camX, grade) {
      const R = VS.REGIONS[key]; if (!R || !VS.BG) return false;
      const bc = G.bgLayer(), k = G.bgScale * (U.VIEW_W / W);
      bc.setTransform(k, 0, 0, k, 0, 0);
      VS.BG.drawSky(bc, R, this.t, W, H);
      VS.BG.draw(bc, R, { x: camX, y: 0, t: this.t }, H, k, W, H, Math.max(0, H - 360));
      if (grade) grade(bc);
      ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.imageSmoothingEnabled = true;
      ctx.drawImage(G.bgCanvas, 0, 0, G.bgCanvas.width, G.bgCanvas.height, 0, 0, G.canvas.width, G.canvas.height);
      ctx.restore(); G.hudTransform(ctx);
      return true;
    }
    // personagem a partir da sua folha de sprites (pés em x,y); o = { alpha, tint, glow, add }
    sprite(ctx, name, anim, idx, x, y, s, dir, o) {
      const sh = VS.Assets.sheet(name); if (!sh || !VS.Assets.ok(sh.img)) return null;
      const f = VS.Assets.frame(sh, anim, idx); if (!f) return null;
      o = o || {};
      ctx.save(); ctx.translate(x, y); ctx.scale((dir || 1) * s, s);
      if (o.alpha !== undefined) ctx.globalAlpha *= o.alpha;
      if (o.add) ctx.globalCompositeOperation = 'lighter';
      if (o.tint) VS.Assets.drawTinted(ctx, sh, f, o.tint); else VS.Assets.drawFrame(ctx, sh, f);
      if (o.glow) VS.Assets.drawFlash(ctx, sh, f, o.glow);
      ctx.restore();
      return { top: y + f.oy * s, h: f.h / sh.meta.scale * s };
    }
    // raios de luz que descem em leque de um ponto alto
    rays(ctx, x, y, n, len, col, a, spread, t) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < n; i++) {
        const k = n > 1 ? i / (n - 1) - 0.5 : 0, ang = Math.PI / 2 + k * spread + Math.sin(t * 0.3 + i * 1.7) * 0.03, w = 10 + (i % 3) * 7;
        const ex = x + Math.cos(ang) * len, ey = y + Math.sin(ang) * len, px = -Math.sin(ang) * w, py = Math.cos(ang) * w;
        const gr = ctx.createLinearGradient(x, y, ex, ey); gr.addColorStop(0, U.rgba(col, a * (0.6 + 0.4 * Math.sin(t * 0.7 + i)))); gr.addColorStop(1, U.rgba(col, 0));
        ctx.fillStyle = gr; ctx.beginPath(); ctx.moveTo(x - px * 0.15, y - py * 0.15); ctx.lineTo(ex - px, ey - py); ctx.lineTo(ex + px, ey + py); ctx.lineTo(x + px * 0.15, y + py * 0.15); ctx.closePath(); ctx.fill();
      }
      ctx.restore();
    }
    // chão de pedra em primeiro plano, com o brilho de uma luz a refletir-se
    floor(ctx, y, col, glowX, glowCol, glowA) {
      const g = ctx.createLinearGradient(0, y - 6, 0, H); g.addColorStop(0, col[0]); g.addColorStop(1, col[1]);
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(0, y + 2); for (let x = 0; x <= W; x += 20) ctx.lineTo(x, y + Math.sin(x * 0.05) * 0.8); ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 0.6; for (let x = 12; x < W; x += 34) { ctx.beginPath(); ctx.moveTo(x, y + 4); ctx.lineTo(x - 6, H); ctx.stroke(); }
      if (glowA > 0) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.translate(glowX, y + 3); ctx.scale(1, 0.18); const r = 150, gg = ctx.createRadialGradient(0, 0, 0, 0, 0, r); gg.addColorStop(0, U.rgba(glowCol, glowA)); gg.addColorStop(1, U.rgba(glowCol, 0)); ctx.fillStyle = gg; ctx.fillRect(-r, -r, r * 2, r * 2); ctx.restore(); }
    }
    // ---------- Final 1: A Nova Chama ----------
    // o salão do trono ganha luz: a Ione recebe as brasas, os mortos da cidade sobem em paz e o Desperto ajoelha e desfaz-se em cinza
    drawEnd1(ctx, t, k) {
      const glowK = Math.min(1, Math.max(0, (t - 10) / 14)), gy = H - 46;
      this.paintBG(ctx, 'r7', 210 + t * 3, (bc) => { bc.globalCompositeOperation = 'lighter'; bc.fillStyle = `rgba(255,150,70,${(0.05 + 0.2 * glowK).toFixed(3)})`; bc.fillRect(0, 0, W, H); bc.globalCompositeOperation = 'source-over'; bc.fillStyle = `rgba(20,6,6,${(0.45 - 0.25 * glowK).toFixed(3)})`; bc.fillRect(0, 0, W, H); });
      this.rays(ctx, W / 2 + 30, -40, 7, H * 1.25, '#ffd8a0', 0.08 + 0.2 * glowK, 1.1, t);
      this.floor(ctx, gy, ['#1a0e0c', '#060304'], W / 2 + 30, '#ffaa5a', 0.25 + 0.45 * glowK);
      // os mortos que finalmente descansam: sombras azuladas que sobem e se apagam
      const ghosts = ['npc_maren', 'npc_teodoro', 'npc_hrolf', 'hero'];
      for (let i = 0; i < 7; i++) {
        const rise = Math.max(0, t - 5 - i * 1.6) * 7, a = Math.max(0, 0.42 - rise / 230); if (a <= 0 || rise <= 0) continue;
        const x = (W / 2 + 30) + (i % 2 ? 1 : -1) * (70 + i * 34), nm = ghosts[i % ghosts.length];
        if (!this.sprite(ctx, nm, 'idle', t * 4 + i, x, gy - rise, 1.7, i % 2 ? -1 : 1, { alpha: a, tint: '#8aa8e8', add: true })) { ctx.globalAlpha = a; this.figure(ctx, x, gy - rise, 0.8, '#7a90c0'); ctx.globalAlpha = 1; }
        if (Math.random() < 0.08) G.emit({ x: x + U.rand(-6, 6), y: gy - rise - 20, vy: -20, life: 2, size: 1, color: '#a0b8ff', add: true });
      }
      // Ione recebe as brasas: as seis chamas rodam à volta dela e entram-lhe no peito
      const ix = W / 2 + 30, iy = gy;
      VS.Sprites.glow(ctx, ix, iy - 34, 50 + glowK * 140, '#ff9a40', 0.25 + glowK * 0.5);
      if (!this.sprite(ctx, 'npc_ione', 'idle', t * 5, ix, iy, 2.3, -1, { glow: glowK * 0.55 })) this.figure(ctx, ix, iy, 1.3, U.mix('#1a1012', '#ffd8a0', glowK * 0.8));
      for (let i = 0; i < 6; i++) { const a = t * 0.8 + i * U.TAU / 6, r = Math.max(0, 64 - Math.max(0, t - 8) * 3); if (r <= 0) continue; const ex = ix + Math.cos(a) * r, ey = iy - 44 + Math.sin(a) * r * 0.5; VS.Sprites.glow(ctx, ex, ey, 14, '#ffb040', 0.9); ctx.fillStyle = '#fff0c0'; ctx.beginPath(); ctx.arc(ex, ey, 2.2, 0, U.TAU); ctx.fill(); }
      // o Desperto ajoelha diante dela e desfaz-se em cinza
      const px = W / 2 - 74, fade = Math.max(0, 1 - Math.max(0, t - 22) / 10);
      if (!this.sprite(ctx, 'hero', 'rest', 3, px, iy, 2.2, 1, { alpha: fade, glow: Math.max(0, t - 21) / 12 })) { ctx.globalAlpha = fade; this.figure(ctx, px, iy, 1.0, '#141218', { hood: true }); ctx.globalAlpha = 1; }
      if (t > 22 && t < 34 && Math.random() < 0.7) G.emit({ x: px + U.rand(-10, 10), y: iy - U.rand(0, 44), vx: U.rand(-10, 30), vy: U.rand(-50, -12), life: 3, size: U.rand(1, 1.8), color: U.pick(['#6a6068', '#ffb040', '#ffe0a0']), kind: 'flake', vr: 3 });
      if (Math.random() < 0.3) G.emit({ x: U.rand(0, W), y: H + 4, vx: U.rand(-8, 8), vy: U.rand(-40, -18), life: 7, size: U.rand(0.8, 1.6), color: U.pick(['#ffb040', '#ffd080']), add: true, wobble: 2 });
    }
    // ---------- Final 2: O Cálice de Cinza ----------
    // crepúsculo eterno: o Desperto sobe ao trono, a coroa acende-se em fogo, e a Ione afasta-se sem olhar para trás
    drawEnd2(ctx, t, k) {
      const burn = Math.min(1, Math.max(0, (t - 8) / 10)), gy = H - 50, tx = W / 2;
      this.paintBG(ctx, 'r7', 520 - t * 2, (bc) => { bc.fillStyle = `rgba(30,4,10,${(0.4 + 0.2 * burn).toFixed(3)})`; bc.fillRect(0, 0, W, H); bc.globalCompositeOperation = 'lighter'; bc.fillStyle = `rgba(160,20,30,${(0.08 + 0.12 * burn).toFixed(3)})`; bc.fillRect(0, 0, W, H); bc.globalCompositeOperation = 'source-over'; });
      this.rays(ctx, tx, -60, 5, H * 1.2, '#ff5040', 0.06 + 0.12 * burn, 0.8, t);
      this.floor(ctx, gy, ['#1a080a', '#050203'], tx, '#ff3c28', 0.2 + 0.4 * burn);
      // o trono: espaldar alto de pontas de ferro com fio de ouro, estrado em degraus
      ctx.fillStyle = '#0c0608';
      ctx.beginPath(); ctx.moveTo(tx - 46, gy); ctx.lineTo(tx - 46, gy - 12); ctx.lineTo(tx + 46, gy - 12); ctx.lineTo(tx + 46, gy); ctx.fill();
      ctx.fillRect(tx - 60, gy - 4, 120, 6);
      ctx.beginPath(); ctx.moveTo(tx - 34, gy - 12); ctx.lineTo(tx - 34, gy - 120); for (let i = 0; i <= 6; i++) { const x = tx - 34 + i * 68 / 6, h = i % 3 === 0 ? 150 : i % 2 ? 128 : 138; ctx.lineTo(x, gy - h); ctx.lineTo(x + 68 / 12, gy - 118); } ctx.lineTo(tx + 34, gy - 12); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#a8803e'; ctx.lineWidth = 1.1; ctx.beginPath(); ctx.moveTo(tx - 30, gy - 16); ctx.lineTo(tx - 30, gy - 112); ctx.moveTo(tx + 30, gy - 16); ctx.lineTo(tx + 30, gy - 112); ctx.moveTo(tx - 36, gy - 12); ctx.lineTo(tx + 36, gy - 12); ctx.stroke();
      VS.Sprites.glow(ctx, tx, gy - 70, 40 + burn * 80, '#ff4010', 0.25 + burn * 0.45);
      // o Desperto no trono (de frente para nós), a escurecer em brasa; a coroa de fogo
      const r = this.sprite(ctx, 'hero', 'idle', t * 3, tx, gy - 12, 2.2, 1, { tint: burn > 0.05 ? U.mix('#2a1a1c', '#5a1010', burn) : null });
      if (!r) this.figure(ctx, tx, gy - 20, 1.3, U.mix('#141218', '#3a1010', burn), { hood: true });
      if (burn > 0.3) {
        const cy = r ? r.top + 4 : gy - 66, n = 7; ctx.save(); ctx.globalCompositeOperation = 'lighter';
        for (let i = 0; i < n; i++) { const fx = tx - 9 + i * 3, fh = (6 + 5 * Math.sin(i * 1.9 + t * 9)) * burn; ctx.fillStyle = i % 2 ? 'rgba(255,120,40,0.85)' : 'rgba(255,220,140,0.9)'; ctx.beginPath(); ctx.moveTo(fx - 1.6, cy); ctx.quadraticCurveTo(fx, cy - fh * 0.6, fx + Math.sin(t * 7 + i) * 1.2, cy - fh); ctx.quadraticCurveTo(fx + 1, cy - fh * 0.5, fx + 1.6, cy); ctx.fill(); }
        ctx.restore();
      }
      if (Math.random() < 0.35 * burn) G.emit({ x: tx + U.rand(-14, 14), y: gy - U.rand(20, 80), vy: U.rand(-60, -20), life: 1.5, size: 1.4, color: U.pick(['#ff6010', '#ffb040']), add: true, shrink: true });
      // o cálice no braço do trono
      ctx.fillStyle = '#c8a050'; ctx.beginPath(); ctx.moveTo(tx + 38, gy - 30); ctx.lineTo(tx + 48, gy - 30); ctx.quadraticCurveTo(tx + 48, gy - 21, tx + 43, gy - 19); ctx.quadraticCurveTo(tx + 38, gy - 21, tx + 38, gy - 30); ctx.fill(); ctx.fillRect(tx + 42, gy - 19, 2, 7);
      // Ione afasta-se
      const ix = Math.min(W + 60, tx + 110 + Math.max(0, t - 18) * 9), ia = Math.max(0, 1 - Math.max(0, t - 30) / 6);
      if (!this.sprite(ctx, 'npc_ione', 'idle', t * 5, ix, gy, 2.2, 1, { alpha: ia, tint: '#3a2a30' })) { ctx.globalAlpha = ia; this.figure(ctx, ix, gy, 1.1, '#2a1a22'); ctx.globalAlpha = 1; }
    }
    // ---------- Final 3: Aurora ----------
    // a cidade ao amanhecer: o Lume volta ao céu como um sol, a Ione sente o calor e o Desperto torna-se luz
    drawEnd3(ctx, t, k) {
      const dawn = Math.min(1, Math.max(0, (t - 6) / 26)), gy = H - 44;
      this.paintBG(ctx, 'r1', 300 + t * 4, (bc) => {
        const g = bc.createLinearGradient(0, 0, 0, H); g.addColorStop(0, `rgba(90,120,184,${(0.35 * dawn).toFixed(3)})`); g.addColorStop(0.6, `rgba(240,160,112,${(0.25 * dawn).toFixed(3)})`); g.addColorStop(1, 'rgba(0,0,0,0)');
        bc.globalCompositeOperation = 'lighter'; bc.fillStyle = g; bc.fillRect(0, 0, W, H); bc.globalCompositeOperation = 'source-over';
        bc.fillStyle = `rgba(8,6,14,${(0.45 - 0.35 * dawn).toFixed(3)})`; bc.fillRect(0, 0, W, H);
      });
      // o sol: o Lume devolvido ao céu
      const sy = H - 70 - dawn * 150;
      VS.Sprites.glow(ctx, W / 2, sy, 90 + dawn * 190, '#ffd890', 0.45 + dawn * 0.45);
      ctx.fillStyle = U.rgba('#fff4d8', 0.6 + dawn * 0.4); ctx.beginPath(); ctx.arc(W / 2, sy, 16 + dawn * 10, 0, U.TAU); ctx.fill();
      this.rays(ctx, W / 2, sy, 9, H, '#ffe8c0', 0.05 + 0.12 * dawn, 2.6, t);
      // aves
      ctx.strokeStyle = 'rgba(20,10,20,0.7)'; ctx.lineWidth = 1;
      for (let i = 0; i < 6; i++) { const bx = (t * 18 + i * W / 7) % (W + 40) - 20, by = 70 + Math.sin(t + i) * 10 + i * 8; const f = Math.sin(t * 8 + i) * 3; ctx.beginPath(); ctx.moveTo(bx - 5, by - f); ctx.lineTo(bx, by); ctx.lineTo(bx + 5, by - f); ctx.stroke(); }
      // o terraço onde os dois esperam o sol
      const g2 = ctx.createLinearGradient(0, gy - 10, 0, H); g2.addColorStop(0, '#120c10'); g2.addColorStop(1, '#040305');
      ctx.fillStyle = g2; ctx.beginPath(); ctx.moveTo(0, gy + 6); ctx.quadraticCurveTo(W * 0.3, gy - 8, W / 2, gy); ctx.quadraticCurveTo(W * 0.72, gy + 6, W, gy - 4); ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath(); ctx.fill();
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = U.rgba('#ffd890', 0.25 + 0.4 * dawn); ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(0, gy + 6); ctx.quadraticCurveTo(W * 0.3, gy - 8, W / 2, gy); ctx.quadraticCurveTo(W * 0.72, gy + 6, W, gy - 4); ctx.stroke(); ctx.restore();
      // Ione sente o calor; o Desperto torna-se luz
      if (!this.sprite(ctx, 'npc_ione', 'idle', t * 5, W / 2 + 42, gy + 1, 2.2, -1, { glow: dawn * 0.35 })) this.figure(ctx, W / 2 + 40, gy, 1.2, '#140c10');
      const fade = Math.max(0, 1 - Math.max(0, t - 26) / 10), lit = Math.min(1, Math.max(0, (t - 22) / 6));
      if (!this.sprite(ctx, 'hero', 'idle', t * 3, W / 2 - 40, gy + 1, 2.2, 1, { alpha: fade, glow: lit })) { ctx.globalAlpha = fade; this.figure(ctx, W / 2 - 40, gy, 1.1, '#100c12', { hood: true }); ctx.globalAlpha = 1; }
      if (t > 24 && t < 38 && Math.random() < 0.8) G.emit({ x: W / 2 - 40 + U.rand(-10, 10), y: gy - U.rand(0, 46), vx: U.rand(-5, 15), vy: U.rand(-55, -20), life: 3, size: U.rand(1, 1.6), color: U.pick(['#fff0c0', '#ffffff', '#ffd890']), add: true });
    }
  }

  const End = {};
  End.play = function (id, game) {
    VS.UI.closeAll();
    // nenhuma notificação ou fala de combate por cima da cena final
    if (VS.UI.toastEl) VS.UI.toastEl.innerHTML = '';
    if (VS.UI.barkEl) VS.UI.barkEl.classList.remove('show');
    // as personagens das cenas e o fundo pintado da região (preparados já, para a primeira imagem não engasgar)
    ['hero', 'npc_ione', 'npc_maren', 'npc_teodoro', 'npc_hrolf'].forEach((n) => VS.Assets.sheet(n));
    if (VS.BG && VS.REGIONS) VS.BG.get(VS.REGIONS[id === 'end3' ? 'r1' : 'r7']);
    VS.App.mode = 'ending';
    VS.App.ending = new Scene(id, game);
    G.particles.length = 0;
  };
  VS.Endings = End;
})(window.VS);
