// Vesperal — ecrã, câmara, luz, partículas, tremor e efeitos de ecrã
'use strict';
(function (VS) {
  const U = VS.U;
  const G = {
    canvas: null, ctx: null, scale: 1, dpr: 1, w: U.VIEW_W, h: U.VIEW_H,
    cam: { x: 0, y: 0, tx: 0, ty: 0, shake: 0, sx: 0, sy: 0, lock: null, zoom: 1 },
    lights: [], particles: [], flashA: 0, flashColor: '#fff', time: 0,
    lightCanvas: null, lctx: null, lightScale: 0.25, ambientDark: 0.6, darkColor: '#05040a',
    settings: { shake: 1, flashes: true },
  };

  G.init = function (canvas) {
    G.canvas = canvas; G.ctx = canvas.getContext('2d', { alpha: false });
    G.lightCanvas = document.createElement('canvas'); G.lctx = G.lightCanvas.getContext('2d');
    window.addEventListener('resize', G.resize);
    window.addEventListener('orientationchange', () => setTimeout(G.resize, 200));
    G.resize();
  };

  G.resize = function () {
    const wrap = G.canvas.parentElement;
    const W = wrap.clientWidth, H = wrap.clientHeight;
    if (W > 0 && H > 0) U.fitScreen(W / H);
    const ar = U.SCREEN_W / U.SCREEN_H;
    let cw = W, ch = W / ar;
    if (ch > H) { ch = H; cw = H * ar; }
    cw = Math.floor(cw); ch = Math.floor(ch);
    // a forma lógica é arredondada: o píxel ou dois que sobram não ficam como uma risca preta na borda
    if (W - cw <= 2) cw = W; if (H - ch <= 2) ch = H;
    const mobile = matchMedia('(pointer: coarse)').matches; G.mobile = mobile;
    G.dpr = Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 2);
    G.canvas.style.width = cw + 'px'; G.canvas.style.height = ch + 'px';
    G.canvas.style.left = Math.floor((W - cw) / 2) + 'px'; G.canvas.style.top = Math.floor((H - ch) / 2) + 'px';
    // resolução interna limitada pela qualidade (o navegador amplia para o tamanho do ecrã)
    const cap = G.maxRenderH(mobile), k = Math.min(1, cap / (ch * G.dpr));
    G.renderK = k;
    G.canvas.width = Math.max(320, Math.round(cw * G.dpr * k)); G.canvas.height = Math.max(180, Math.round(ch * G.dpr * k));
    G.scale = G.canvas.width / U.VIEW_W;
    G.hudScale = G.canvas.width / U.SCREEN_W;
    G.lightCanvas.width = Math.ceil(G.canvas.width * G.lightScale); G.lightCanvas.height = Math.ceil(G.canvas.height * G.lightScale);
    G.cssRect = { x: (W - cw) / 2, y: (H - ch) / 2, w: cw, h: ch };
    if (VS.events) VS.events.emit('resize', G.cssRect);
  };

  // ---------- qualidade ----------
  // níveis: altura máxima da imagem interna. 'auto' começa no nível 0 e desce se o jogo não aguentar a taxa do ecrã
  G.LEVELS = [1080, 900, 720, 540];
  G.quality = 'auto'; G.autoLevel = 0;
  G.maxRenderH = function (mobile) {
    const q = G.quality;
    if (q === 'high') return 1440;
    if (q === 'medium') return 900;
    if (q === 'low') return 600;
    return G.LEVELS[Math.min(G.LEVELS.length - 1, G.autoLevel + (mobile ? 1 : 0))];
  };
  G.setQuality = function (q) { if (G.quality === q) return; G.quality = q; G.autoLevel = 0; G.perf.reset(); if (G.canvas) G.resize(); };
  // monitor de desempenho: tempo de CPU por imagem e atraso face ao ecrã; desce a qualidade automática se preciso
  G.perf = {
    n: 0, slow: 0, cpu: 0, gap: 0, cool: 3,
    reset() { this.n = 0; this.slow = 0; this.cpu = 0; this.gap = 0; this.cool = 3; },
    frame(gapMs, cpuMs, dt) {
      if (this.cool > 0) { this.cool -= dt; return; }
      this.n++; this.cpu += cpuMs; this.gap = Math.max(this.gap, gapMs);
      // imagem lenta: o desenho ocupou mais do que 75 % de um ecrã a 60 Hz, ou falhou dois ecrãs seguidos
      if (cpuMs > 12.5 || gapMs > 34) this.slow++;
      if (this.n >= 120) {
        if (G.quality === 'auto' && this.slow > 40 && G.autoLevel < G.LEVELS.length - 1) { G.autoLevel++; G.resize(); this.cool = 2; }
        this.n = 0; this.slow = 0; this.cpu = 0; this.gap = 0;
      }
    },
  };

  // camada de fundo a resolução reduzida (céu, paralaxe e névoa)
  G.bgLayer = function () {
    // no computador o fundo vai a 75 % (os fundos pintados pedem nitidez); no telemóvel a 60 %; baixa sozinha se o jogo pesar
    const k = G.quality === 'high' ? 0.75 : G.quality === 'low' ? 0.45 : G.autoLevel >= 2 ? 0.45 : G.mobile ? 0.6 : 0.75;
    const w = Math.max(64, Math.round(G.canvas.width * k)), h = Math.max(36, Math.round(G.canvas.height * k));
    if (!G.bgCanvas) { G.bgCanvas = document.createElement('canvas'); G.bgCtx = G.bgCanvas.getContext('2d', { alpha: false }); }
    if (G.bgCanvas.width !== w || G.bgCanvas.height !== h) { G.bgCanvas.width = w; G.bgCanvas.height = h; }
    G.bgScale = w / U.VIEW_W;
    return G.bgCtx;
  };

  // ---------- câmara ----------
  G.setCameraBounds = function (w, h) { G.cam.bw = w; G.cam.bh = h; };
  G.cameraFollow = function (tx, ty, dt, snap) {
    const c = G.cam;
    if (c.lock) { tx = c.lock.x; ty = c.lock.y; }
    let x = tx - U.VIEW_W / 2, y = ty - U.VIEW_H / 2;
    const bw = c.bw || U.VIEW_W, bh = c.bh || U.VIEW_H;
    x = bw <= U.VIEW_W ? (bw - U.VIEW_W) / 2 : U.clamp(x, 0, bw - U.VIEW_W);
    y = bh <= U.VIEW_H ? (bh - U.VIEW_H) / 2 : U.clamp(y, 0, bh - U.VIEW_H);
    if (snap) { c.x = x; c.y = y; }
    else { const k = 1 - Math.exp(-dt * 7); c.x += (x - c.x) * k; c.y += (y - c.y) * (1 - Math.exp(-dt * 5)); }
    // tremor (modelo de "trauma")
    c.shake = Math.max(0, c.shake - dt * 1.6);
    const s = c.shake * c.shake * 9 * G.settings.shake;
    c.sx = (Math.random() * 2 - 1) * s; c.sy = (Math.random() * 2 - 1) * s;
  };
  G.addShake = (v) => { G.cam.shake = Math.min(1, G.cam.shake + v); };
  G.flash = (color, a) => { if (!G.settings.flashes) a = Math.min(a, 0.15); G.flashColor = color; G.flashA = Math.max(G.flashA, a); };

  // transforma para coordenadas do mundo
  G.worldTransform = function (ctx, parallax) {
    const p = parallax === undefined ? 1 : parallax;
    const s = G.scale;
    ctx.setTransform(s, 0, 0, s, Math.round((-G.cam.x * p - G.cam.sx) * s), Math.round((-G.cam.y * p - G.cam.sy) * s));
  };
  G.screenTransform = function (ctx) { ctx.setTransform(G.scale, 0, 0, G.scale, 0, 0); };
  // HUD, menus e finais: em unidades lógicas do ecrã (360 de altura, ou 640 de largura), seja qual for o zoom da câmara
  G.hudTransform = function (ctx) { ctx.setTransform(G.hudScale || G.scale, 0, 0, G.hudScale || G.scale, 0, 0); };
  G.inView = function (x, y, w, h, m) {
    m = m || 40;
    return x + w > G.cam.x - m && x < G.cam.x + U.VIEW_W + m && y + h > G.cam.y - m && y < G.cam.y + U.VIEW_H + m;
  };

  // ---------- luz ----------
  G.beginLights = function (ambient, color) { G.lights.length = 0; G.ambientDark = ambient; G.darkColor = color || '#05040a'; };
  G.light = function (x, y, r, color, intensity, flicker) {
    if (!G.inView(x - r, y - r, r * 2, r * 2, 0)) return;
    G.lights.push({ x, y, r, color: color || '#ffb060', i: intensity === undefined ? 1 : intensity, f: flicker || 0 });
  };
  // sprites de luz pré-desenhados (um gradiente por cor, uma vez) em vez de gradientes novos em cada imagem
  const spriteCache = new Map();
  G.glowSprite = function (color, stops) {
    const key = color + '|' + (stops || 'g');
    let c = spriteCache.get(key);
    if (c) return c;
    if (spriteCache.size > 240) spriteCache.clear();
    c = document.createElement('canvas'); c.width = c.height = 64;
    const x = c.getContext('2d'), g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
    if (stops === 'mask') { g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(0.5, 'rgba(0,0,0,0.55)'); g.addColorStop(1, 'rgba(0,0,0,0)'); }
    else if (stops === 'raw') { g.addColorStop(0, color); g.addColorStop(1, 'rgba(0,0,0,0)'); }
    else { g.addColorStop(0, U.rgba(color, 1)); g.addColorStop(1, U.rgba(color, 0)); }
    x.fillStyle = g; x.fillRect(0, 0, 64, 64);
    spriteCache.set(key, c); return c;
  };
  G.drawLights = function () {
    const ctx = G.ctx, l = G.lctx, ls = G.scale * G.lightScale;
    const W = G.lightCanvas.width, H = G.lightCanvas.height;
    l.setTransform(1, 0, 0, 1, 0, 0);
    l.globalCompositeOperation = 'source-over';
    l.clearRect(0, 0, W, H);
    l.fillStyle = U.rgba(G.darkColor, G.ambientDark);
    l.fillRect(0, 0, W, H);
    l.globalCompositeOperation = 'destination-out';
    const mask = G.glowSprite('#000', 'mask');
    const ox = -G.cam.x - G.cam.sx, oy = -G.cam.y - G.cam.sy;
    for (const L of G.lights) {
      const fl = L.f ? 1 + Math.sin(G.time * 13 + L.x) * 0.04 * L.f + Math.sin(G.time * 7.3 + L.y) * 0.05 * L.f : 1;
      const r = L.r * fl;
      const x = (L.x + ox) * ls, y = (L.y + oy) * ls;
      l.globalAlpha = Math.min(1, L.i);
      l.drawImage(mask, x - r * ls, y - r * ls, r * 2 * ls, r * 2 * ls);
    }
    l.globalAlpha = 1;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(G.lightCanvas, 0, 0, G.canvas.width, G.canvas.height);
    // brilho aditivo colorido
    ctx.globalCompositeOperation = 'lighter';
    G.worldTransform(ctx);
    for (const L of G.lights) {
      if (L.i < 0.2) continue;
      const fl = L.f ? 1 + Math.sin(G.time * 11 + L.x) * 0.06 * L.f : 1;
      const r = L.r * 0.6 * fl;
      ctx.globalAlpha = Math.min(1, 0.22 * L.i);
      ctx.drawImage(G.glowSprite(L.color), L.x - r, L.y - r, r * 2, r * 2);
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  };

  // ---------- partículas ----------
  // tipos: 'ash','ember','spark','dust','smoke','blood'(cinza escura),'glow','leaf','drop','moth','note','feather','glass'
  G.partMul = 1;
  G.emit = function (o) {
    if (G.particles.length > 900) return;
    const pm = G.partMul * (G.autoLevel >= 2 && G.quality === 'auto' ? 0.6 : 1);
    if (pm < 1 && !o.keep && Math.random() > pm) return;
    G.particles.push(Object.assign({ x: 0, y: 0, vx: 0, vy: 0, g: 0, drag: 0, life: 1, max: 1, size: 2, color: '#fff', add: false, rot: 0, vr: 0, kind: 'dot', fade: true, shrink: false }, o, { max: o.life || 1 }));
  };
  G.burst = function (x, y, n, o) {
    for (let i = 0; i < n; i++) {
      const a = (o.angle !== undefined ? o.angle : 0) + (Math.random() - 0.5) * (o.spread !== undefined ? o.spread : U.TAU);
      const sp = U.rand(o.speedMin || 20, o.speed || 120);
      G.emit(Object.assign({}, o, { x: x + U.rand(-(o.jx || 0), o.jx || 0), y: y + U.rand(-(o.jy || 0), o.jy || 0), vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: U.rand((o.life || 0.6) * 0.6, o.life || 0.6), size: U.rand((o.size || 2) * 0.6, o.size || 2) }));
    }
  };
  G.updateParticles = function (dt, solidAt) {
    const P = G.particles;
    for (let i = P.length - 1; i >= 0; i--) {
      const p = P[i];
      p.life -= dt;
      if (p.life <= 0) { P.splice(i, 1); continue; }
      p.vy += p.g * dt;
      if (p.drag) { const k = Math.exp(-p.drag * dt); p.vx *= k; p.vy *= k; }
      if (p.wobble) p.vx += Math.sin(G.time * p.wobble + p.y * 0.05) * 30 * dt;
      p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt;
      if (p.collide && solidAt && solidAt(p.x, p.y)) { p.vy *= -0.3; p.vx *= 0.6; p.y -= 2; if (Math.abs(p.vy) < 10) p.life = Math.min(p.life, 0.3); }
    }
  };
  G.ia = 0; // atraso de interpolação (s): as partículas desenham-se onde estavam entre os dois últimos passos
  G.drawParticles = function (ctx, layer) {
    const ia = G.ia;
    for (const q of G.particles) {
      if ((q.layer || 0) !== layer) continue;
      if (!G.inView(q.x - 10, q.y - 10, 20, 20, 10)) continue;
      const p = PV; p.q = q; p.x = q.x - q.vx * ia; p.y = q.y - q.vy * ia;
      p.life = q.life; p.max = q.max; p.fade = q.fade; p.alpha = q.alpha; p.shrink = q.shrink; p.size = q.size; p.add = q.add; p.color = q.color; p.color2 = q.color2; p.kind = q.kind; p.vx = q.vx; p.vy = q.vy; p.rot = q.rot; p.grow = q.grow;
      const t = p.life / p.max;
      const a = p.fade ? Math.min(1, t * 2) * (p.alpha || 1) : (p.alpha || 1);
      const sz = p.shrink ? p.size * t : p.size;
      ctx.globalAlpha = a;
      if (p.add) ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = p.color;
      if (p.kind === 'dot') { ctx.beginPath(); ctx.arc(p.x, p.y, sz, 0, U.TAU); ctx.fill(); }
      else if (p.kind === 'glow') {
        const sp = G.glowSprite(p.color, 'raw');
        ctx.drawImage(sp, p.x - sz * 3, p.y - sz * 3, sz * 6, sz * 6);
      } else if (p.kind === 'line') {
        ctx.strokeStyle = p.color; ctx.lineWidth = sz * 0.5; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - p.vx * 0.04, p.y - p.vy * 0.04); ctx.stroke();
      } else if (p.kind === 'flake') {
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.fillRect(-sz, -sz * 0.4, sz * 2, sz * 0.8); ctx.restore();
      } else if (p.kind === 'leaf') {
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.beginPath(); ctx.ellipse(0, 0, sz * 1.6, sz * 0.7, 0, 0, U.TAU); ctx.fill(); ctx.restore();
      } else if (p.kind === 'ring') {
        ctx.strokeStyle = p.color; ctx.lineWidth = 2 * t + 0.5; ctx.beginPath(); ctx.arc(p.x, p.y, p.size + (1 - t) * (p.grow || 40), 0, U.TAU); ctx.stroke();
      } else if (p.kind === 'note') { // colcheia desenhada (sem caracteres de texto)
        const s2 = sz * 0.9; ctx.beginPath(); ctx.ellipse(p.x, p.y, s2 * 1.1, s2 * 0.8, -0.4, 0, U.TAU); ctx.fill();
        ctx.fillRect(p.x + s2 * 0.8, p.y - s2 * 3.6, s2 * 0.4, s2 * 3.6);
        ctx.beginPath(); ctx.moveTo(p.x + s2 * 1.2, p.y - s2 * 3.6); ctx.quadraticCurveTo(p.x + s2 * 2.6, p.y - s2 * 2.8, p.x + s2 * 2.2, p.y - s2 * 1.6); ctx.lineTo(p.x + s2 * 1.2, p.y - s2 * 2.6); ctx.fill();
      } else if (p.kind === 'puff') {
        const r = p.size * (1 + (1 - t) * (p.grow || 2));
        ctx.globalAlpha = a * t; ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, U.TAU); ctx.fill();
      } else if (p.kind === 'shard') {
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.beginPath(); ctx.moveTo(0, -sz * 1.5); ctx.lineTo(sz * 0.7, sz); ctx.lineTo(-sz * 0.7, sz * 0.6); ctx.closePath(); ctx.fill(); ctx.restore();
      }
      ctx.globalCompositeOperation = 'source-over';
    }
    ctx.globalAlpha = 1;
  };

  const PV = {};

  // ---------- pós-processamento ----------
  // vinheta pré-desenhada (pequena, ampliada com suavização) + tom da região em sobreposição simples
  // (o modo 'soft-light' obrigava a GPU a copiar o ecrã inteiro em cada imagem)
  let vig = null, vigKey = '';
  G.vignette = function (strength, tint) {
    const ctx = G.ctx; G.screenTransform(ctx);
    const key = strength + '|' + (tint || '') + '|' + U.VIEW_W + 'x' + U.VIEW_H;
    if (key !== vigKey) {
      vig = vig || document.createElement('canvas'); vig.width = 160; vig.height = Math.round(160 * U.VIEW_H / U.VIEW_W);
      const c = vig.getContext('2d'), W = vig.width, Hh = vig.height;
      c.clearRect(0, 0, W, Hh);
      if (tint) { c.globalAlpha = 0.1; c.fillStyle = tint; c.fillRect(0, 0, W, Hh); c.globalAlpha = 1; }
      const g = c.createRadialGradient(W / 2, Hh / 2, Hh * 0.35, W / 2, Hh / 2, W * 0.62);
      g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(0,0,0,${strength})`);
      c.fillStyle = g; c.fillRect(0, 0, W, Hh); vigKey = key;
    }
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(vig, 0, 0, U.VIEW_W, U.VIEW_H);
  };
  // pavor: as margens do ecrã tingem-se de carmesim (um golpe mortal a preparar-se); quem o causa renova G.dread a cada passo
  G.dread = 0;
  let dreadC = null;
  const redEdges = () => {
    if (!dreadC) {
      dreadC = document.createElement('canvas'); dreadC.width = 160; dreadC.height = 90;
      const c = dreadC.getContext('2d'), g = c.createRadialGradient(80, 45, 26, 80, 45, 98);
      g.addColorStop(0, 'rgba(120,0,0,0)'); g.addColorStop(0.6, 'rgba(150,6,10,0.35)'); g.addColorStop(1, 'rgba(190,10,20,0.95)');
      c.fillStyle = g; c.fillRect(0, 0, 160, 90);
    }
    return dreadC;
  };
  G.drawDread = function (dt) {
    if (G.dread <= 0.01) { G.dread = 0; return; }
    const ctx = G.ctx; G.screenTransform(ctx);
    redEdges();
    ctx.globalAlpha = U.clamp(G.dread, 0, 1) * (0.82 + 0.18 * Math.sin(performance.now() / 70));
    ctx.imageSmoothingEnabled = true; ctx.drawImage(dreadC, 0, 0, U.VIEW_W, U.VIEW_H); ctx.globalAlpha = 1;
    G.dread = Math.max(0, G.dread - dt * 2.5);
  };
  // ferida: as margens do ecrã ficam vermelhas e apagam-se em meio segundo
  G.hurt = 0;
  G.drawHurt = function (dt) {
    if (G.hurt <= 0.01) { G.hurt = 0; return; }
    const ctx = G.ctx; G.screenTransform(ctx);
    redEdges();
    ctx.globalAlpha = Math.min(1, G.hurt) * 0.75; ctx.imageSmoothingEnabled = true; ctx.drawImage(dreadC, 0, 0, U.VIEW_W, U.VIEW_H); ctx.globalAlpha = 1;
    G.hurt = Math.max(0, G.hurt - dt * 2.2);
  };
  G.drawFlash = function (dt) {
    if (G.flashA <= 0.01) { G.flashA = 0; return; }
    const ctx = G.ctx; G.screenTransform(ctx);
    ctx.globalAlpha = G.flashA; ctx.fillStyle = G.flashColor; ctx.fillRect(0, 0, U.VIEW_W, U.VIEW_H); ctx.globalAlpha = 1;
    G.flashA *= Math.exp(-dt * 9);
  };

  VS.Gfx = G;
})(window.VS);
