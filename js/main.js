// Vesperal — arranque, ciclo principal, modos (menu / jogo / final), atalhos e API de depuração
'use strict';
(function (VS) {
  const U = VS.U, In = VS.Input, UI = VS.UI, A = VS.Audio, G = VS.Gfx;
  VS.FONT_TITLE = "'Cinzel', 'Trajan Pro', 'Palatino Linotype', 'Book Antiqua', Georgia, serif";
  VS.events = new U.Emitter();

  const App = { mode: 'boot', game: null, paused: false, acc: 0, last: 0, menuT: 0, fps: 60 };

  App.applySettings = function () {
    const s = VS.settings;
    VS.I18N.set(s.lang);
    if (U.ZOOM !== (s.zoom || 1.4)) { U.setZoom(s.zoom || 1.4); if (G.canvas) G.resize(); }
    G.setQuality(s.quality || 'auto'); G.partMul = s.particles === false ? 0.4 : 1;
    A.setSettings(s);
    G.settings.shake = s.shake; G.settings.flashes = s.flashes;
    In.setKeys(s.keys);
    VS.Save.saveSettings(s);
    if (VS.Touch) VS.Touch.refresh();
    document.querySelectorAll('[data-i18n]').forEach((e) => { e.textContent = VS.t(e.dataset.i18n); });
  };

  App.boot = function () {
    VS.settings = VS.Save.loadSettings();
    VS.World.build();
    const canvas = document.getElementById('game');
    G.init(canvas); In.init(canvas); UI.init();
    VS.Touch.init();
    App.applySettings();
    // o áudio só pode começar após um gesto do utilizador
    const unlock = () => { A.init(); };
    ['pointerdown', 'keydown', 'touchstart'].forEach((ev) => window.addEventListener(ev, unlock, { capture: true, passive: true }));
    VS.events.on('lang', () => { if (App.mode === 'menu' && !UI.stack.some((p) => p.el.classList.contains('settings'))) VS.Menus.main(); });
    App.mode = 'menu';
    App.last = performance.now();
    requestAnimationFrame(App.frame);
    if (new URLSearchParams(location.search).has('debug')) App.enableDebug();
    // recursos essenciais (protagonista, golpes da espada, arma inicial) antes do menu
    const show = () => { const l = document.getElementById('loading'); if (l) l.remove(); VS.Menus.main(); if (!VS.Save.available) UI.toast(VS.t('msg_no_storage'), 6); };
    VS.Assets.ready(App.essentialAssets(), 6000).then(show);
  };
  // folhas necessárias para a aparência e a arma atuais
  App.essentialAssets = function (st) {
    const look = st && st.look === 'sino' ? '_sino' : '';
    const w = st ? st.weaponId : 'desperto';
    const cls = (VS.WEAPONS[w] || VS.WEAPONS.desperto).cls;
    const list = ['sprites/hero.png', 'sprites/hero' + look + '.png', 'sprites/hero_espada' + look + '.png', 'weapons/w_' + w + '.png', 'sprites/fx_proj.png', 'ui/hud_medallion.png', 'ui/hud_bar_m.png', 'ui/hud_candle_lit.png'];
    if (VS.SPRITE_META['hero_' + cls + look]) list.push('sprites/hero_' + cls + look + '.png');
    return list;
  };

  App.newGame = function (slot) {
    VS.slot = slot;
    const st = new VS.GameState();
    App.startGame(st, true);
  };
  App.loadSlot = function (slot) {
    const d = VS.Save.read(slot);
    if (!d) { UI.toast(VS.t('msg_load_fail')); return; }
    VS.slot = slot;
    const st = new VS.GameState(); st.load(d);
    App.startGame(st, false);
  };
  App.startGame = function (st, isNew) {
    UI.closeAll();
    App.mode = 'game'; App.paused = false;
    A.init();
    VS.Assets.ready(App.essentialAssets(st), 4000);
    const g = new VS.Game(st);
    App.game = g;
    g.start();
    if (isNew) VS.Story.intro(g);
    g.save();
    VS.Touch.refresh();
  };
  App.toMenu = function () {
    UI.closeAll(); if (UI.dlg) UI.dlgEnd(-1);
    App.game = null; VS.state = null; App.mode = 'menu'; App.paused = false;
    A.setIntensity(0);
    VS.Menus.main();
    VS.Touch.refresh();
  };

  // ---------- ciclo ----------
  // lógica a passo fixo (60 Hz) + desenho interpolado entre os dois últimos passos: fluido em ecrãs de 60, 75,
  // 120 ou 144 Hz sem mudar a física. Opcionalmente limitado a 60 imagens/s (definições de vídeo).
  App.frame = function (now) {
    requestAnimationFrame(App.frame);
    const gap = now - App.last;
    let dt = Math.min(0.1, gap / 1000); App.last = now;
    App.fps = U.lerp(App.fps, 1 / Math.max(dt, 0.001), 0.05);
    App.acc += dt;
    let steps = 0;
    while (App.acc >= U.DT && steps < 5) { App.snap(); App.step(U.DT); App.acc -= U.DT; steps++; }
    if (steps === 5) App.acc = 0;
    const cap = VS.settings && VS.settings.fpsCap;
    if (cap && (now - (App.lastDraw || 0)) < 1000 / cap - 2) return;
    const fdt = Math.min(0.1, (now - (App.lastDraw || now - 16.7)) / 1000); App.lastDraw = now;
    const t0 = performance.now();
    App.draw(fdt, U.clamp(App.acc / U.DT, 0, 1));
    G.perf.frame(gap, performance.now() - t0, dt);
  };
  // posição antes de cada passo (para interpolar o desenho)
  App.snap = function () {
    const g = App.game; if (!g || App.mode !== 'game') return;
    const c = G.cam; c.px = c.x; c.py = c.y;
    const p = g.player; if (p) { p._px = p.x; p._py = p.y; }
    for (const e of g.ents) { e._px = e.x; e._py = e.y; }
  };
  App.step = function (dt) {
    In.update(dt);
    App.menuT += dt;
    const g = App.game;
    if (UI.isOpen() || UI.dlg) { UI.update(dt); if (g && UI.dlg && g.script) g.runScript(0); VS.Touch.refresh(); return; }
    VS.Touch.refresh();
    if (App.mode === 'game' && g) {
      // atalhos
      const alive = !(g.player.action && g.player.action.type === 'dead');
      if (!g.cutscene && alive) {
        if (In.pressed('pause')) { VS.Menus.pause(); return; }
        if (In.pressed('inventory')) { VS.Menus.inventory(); return; }
        if (In.pressed('map')) { VS.Menus.map(); return; }
      }
      if (!App.paused) g.update(dt);
    } else if (App.mode === 'ending' && App.ending) App.ending.update(dt);
  };
  App.draw = function (dt, alpha) {
    const ctx = G.ctx;
    G.fdt = dt; G.fk = dt * 60;
    if (App.mode === 'game' && App.game) App.game.drawInterp(alpha === undefined ? 1 : alpha, dt);
    else if (App.mode === 'ending' && App.ending) App.ending.draw(ctx);
    else App.drawMenuBg(ctx, dt);
    if (App.showFps || (VS.settings && VS.settings.showFps)) { G.hudTransform(ctx); ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(2, U.SCREEN_H - 13, 74, 11); ctx.fillStyle = '#9f9'; ctx.font = '8px monospace'; ctx.fillText(Math.round(App.fps) + ' fps · ' + G.canvas.height + 'p', 5, U.SCREEN_H - 5); }
  };
  // fundo do menu principal: a cidade sob cinza e a Última Chama
  App.drawMenuBg = function (ctx, dt) {
    const R = VS.REGIONS.r1, t = App.menuT, SW = U.SCREEN_W, SH = U.SCREEN_H;
    G.time += dt;
    G.hudTransform(ctx);
    VS.BG.drawSky(ctx, R, t, SW, SH);
    const cam = { x: 120 + t * 5, y: 0 };
    VS.BG.draw(ctx, R, cam, SH, G.hudScale, SW, SH);
    // chão de pedra, entulho e campas em silhueta
    const gy = SH - 34;
    const fg = ctx.createLinearGradient(0, gy - 6, 0, SH); fg.addColorStop(0, '#15100f'); fg.addColorStop(1, '#050404');
    ctx.fillStyle = fg; ctx.beginPath(); ctx.moveTo(0, gy + 4);
    for (let x = 0; x <= SW; x += 16) ctx.lineTo(x, gy + Math.sin(x * 0.07) * 1.6 + (x % 48 === 0 ? -2 : 0));
    ctx.lineTo(SW, SH); ctx.lineTo(0, SH); ctx.fill();
    ctx.fillStyle = '#0b0808';
    for (const [x, w, h] of [[300, 10, 18], [560, 12, 22], [600, 8, 14], [210, 7, 12]]) { ctx.beginPath(); ctx.moveTo(x - w / 2, gy + 2); ctx.lineTo(x - w / 2, gy - h + w / 2); ctx.quadraticCurveTo(x, gy - h - 2, x + w / 2, gy - h + w / 2); ctx.lineTo(x + w / 2, gy + 2); ctx.fill(); }
    ctx.fillRect(578, gy - 30, 2.4, 30); ctx.fillRect(570, gy - 24, 18, 2.4); // cruz tombada
    // braseiro de ferro com a Última Chama
    const bx = 476, by = gy - 14;
    const L = ctx.createRadialGradient(bx, by - 10, 0, bx, by - 10, 170); L.addColorStop(0, 'rgba(255,140,60,0.32)'); L.addColorStop(0.5, 'rgba(255,100,40,0.10)'); L.addColorStop(1, 'rgba(255,90,30,0)');
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = L; ctx.fillRect(bx - 170, by - 180, 340, 220); ctx.restore();
    ctx.fillStyle = '#1c1614'; ctx.beginPath(); ctx.moveTo(bx - 7, gy + 2); ctx.lineTo(bx - 3, by + 6); ctx.lineTo(bx + 3, by + 6); ctx.lineTo(bx + 7, gy + 2); ctx.fill();
    ctx.fillStyle = '#2a221e'; ctx.beginPath(); ctx.moveTo(bx - 16, by - 2); ctx.quadraticCurveTo(bx, by + 10, bx + 16, by - 2); ctx.lineTo(bx + 13, by + 2); ctx.quadraticCurveTo(bx, by + 8, bx - 13, by + 2); ctx.fill();
    ctx.strokeStyle = '#6a5040'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(bx - 16, by - 2); ctx.quadraticCurveTo(bx, by + 10, bx + 16, by - 2); ctx.stroke();
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 9; i++) {
      const k = i / 8, fx = bx - 9 + k * 18, hh = (10 + 10 * Math.sin(k * Math.PI)) * (0.75 + 0.3 * Math.sin(t * 7 + i * 1.9)), sway = Math.sin(t * 3 + i) * 2.4, w = 2.6 + Math.sin(k * Math.PI) * 1.4;
      const fgd = ctx.createLinearGradient(0, by, 0, by - hh); fgd.addColorStop(0, 'rgba(255,110,30,0.7)'); fgd.addColorStop(0.45, 'rgba(255,150,50,0.5)'); fgd.addColorStop(1, 'rgba(255,200,120,0)');
      ctx.fillStyle = fgd; ctx.beginPath(); ctx.moveTo(fx - w, by); ctx.quadraticCurveTo(fx - w * 1.1, by - hh * 0.45, fx + sway, by - hh); ctx.quadraticCurveTo(fx + w * 1.1, by - hh * 0.45, fx + w, by); ctx.fill();
    }
    // núcleo branco-quente baixo, junto às brasas
    const core = ctx.createRadialGradient(bx, by - 3, 0, bx, by - 3, 9); core.addColorStop(0, 'rgba(255,240,200,0.55)'); core.addColorStop(1, 'rgba(255,180,90,0)'); ctx.fillStyle = core; ctx.fillRect(bx - 10, by - 12, 20, 14);
    VS.Sprites.glow(ctx, bx, by - 6, 54, '#ff7a30', 0.28);
    ctx.restore();
    // a protagonista, sentada a descansar junto ao fogo
    const sh = VS.Assets.sheet('hero');
    if (sh && VS.Assets.ok(sh.img)) {
      const f = VS.Assets.frame(sh, 'rest', (t * 4) % 1000);
      ctx.save(); ctx.translate(440, gy + 1); ctx.scale(2.1, 2.1); VS.Assets.drawFrame(ctx, sh, f); ctx.restore();
      // a luz do fogo pinta-lhe o lado direito
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; const rl = ctx.createRadialGradient(462, gy - 30, 0, 462, gy - 30, 46); rl.addColorStop(0, 'rgba(255,140,60,0.16)'); rl.addColorStop(1, 'rgba(255,140,60,0)'); ctx.fillStyle = rl; ctx.fillRect(410, gy - 80, 100, 90); ctx.restore();
    }
    // cinza a cair e brasas a subir
    if (Math.random() < 0.8) G.emit({ x: Math.random() * SW, y: -5, vx: U.rand(-15, 5), vy: U.rand(15, 35), life: 12, size: U.rand(0.6, 1.5), color: U.pick(['#9a9090', '#7a7070']), kind: 'flake', vr: 2, wobble: 1.2, fade: false, alpha: 0.7 });
    if (Math.random() < 0.45) G.emit({ x: bx + U.rand(-10, 10), y: by - 8, vx: U.rand(-18, 18), vy: U.rand(-70, -30), life: U.rand(2, 4), size: U.rand(0.8, 1.6), color: U.pick(['#ffb040', '#ffd080', '#ff7020']), add: true, wobble: 2.4, shrink: true });
    G.updateParticles(dt);
    G.drawParticles(ctx, 0);
    // escurece a coluna das opções para o texto ler bem
    const cg = ctx.createLinearGradient(0, 0, SW * 0.6, 0); cg.addColorStop(0, 'rgba(5,4,6,0.78)'); cg.addColorStop(0.7, 'rgba(5,4,6,0.35)'); cg.addColorStop(1, 'rgba(5,4,6,0)');
    ctx.fillStyle = cg; ctx.fillRect(0, 0, SW * 0.6, SH);
    G.vignette(0.75, 'rgba(255,120,60,0.06)');
  };

  // ---------- depuração / testes automáticos (?debug) ----------
  App.enableDebug = function () {
    App.showFps = true;
    window.VSDebug = {
      app: App,
      game: () => App.game,
      warp(room, tx, ty) { const g = App.game; g.loadRoom(room, tx !== undefined ? { x: tx * U.TILE, y: ty * U.TILE } : undefined); },
      give(id, n) { App.game.state.give(id, n); },
      ability(a) { App.game.state.abilities[a] = true; },
      allAbilities() { Object.keys(App.game.state.abilities).forEach((a) => (App.game.state.abilities[a] = true)); },
      god(on) { App.game.god = on !== false; },
      flag(k, v) { App.game.state.flags[k] = v === undefined ? true : v; },
      killBoss() { const b = App.game.boss; if (b) { b.hp = 1; } },
      state: () => App.game && App.game.state,
      ents: () => App.game.ents.map((e) => ({ kind: e.kind || e.constructor.name, x: Math.round(e.x), y: Math.round(e.y), hp: e.hp })),
    };
  };

  VS.App = App;
  window.addEventListener('load', App.boot);
})(window.VS);
