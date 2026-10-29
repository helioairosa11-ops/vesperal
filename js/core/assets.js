// Vesperal — recursos gráficos reais (PNG): carregamento por pedido, folhas de sprites e desenho de fotogramas
'use strict';
(function (VS) {
  const Assets = { imgs: {}, failed: {}, loaded: 0, requested: 0 };
  const ROOT = 'assets/';

  // imagem (com cache); começa a carregar à primeira chamada
  Assets.img = function (path) {
    let im = Assets.imgs[path];
    if (im) return im;
    im = new Image();
    im.decoding = 'async';
    Assets.requested++;
    // só fica "pronta" depois de descodificada fora do fio principal — desenhá-la pela primeira vez não engasga o jogo
    im.onload = () => { const done = () => { Assets.loaded++; im.ok = true; }; if (im.decode) im.decode().then(done, done); else done(); };
    im.onerror = () => { Assets.loaded++; Assets.failed[path] = true; console.warn('recurso em falta', path); };
    im.src = ROOT + path;
    Assets.imgs[path] = im;
    return im;
  };
  Assets.ok = (im) => im && im.ok && im.naturalWidth > 0;
  // pré-carrega as folhas das entidades de uma sala (chefes e inimigos), para estarem prontas quando aparecem
  Assets.preloadRoom = function (def) {
    if (!def || !def.ents) return;
    for (const e of def.ents) {
      if (e.t === 'boss' && e.boss) { Assets.sheet('en_b_' + e.boss); if (e.boss === 'gemeos') { Assets.sheet('en_b_gemeo_a'); Assets.sheet('en_b_gemeo_b'); } }
      else if (e.t === 'enemy' && e.k) Assets.sheet('en_' + e.k);
    }
  };
  // folha de sprites: imagem + metadados (VS.SPRITE_META, gerados pelo ateliê)
  Assets.sheet = function (name) {
    const meta = VS.SPRITE_META && VS.SPRITE_META[name];
    if (!meta) return null;
    return { img: Assets.img('sprites/' + name + '.png'), meta };
  };
  // espera que uma lista de caminhos esteja pronta (para o ecrã de carregamento)
  Assets.ready = function (paths, timeout = 15000) {
    const ims = paths.map((p) => Assets.img(p));
    return new Promise((res) => {
      const t0 = performance.now();
      const check = () => { if (ims.every((im) => im.complete) || performance.now() - t0 > timeout) res(ims.every((im) => Assets.ok(im))); else setTimeout(check, 30); };
      check();
    });
  };
  // desenha o fotograma f de uma folha; a origem (0,0) do ctx é a âncora (pés) da personagem
  Assets.drawFrame = function (ctx, sh, f) {
    if (!sh || !Assets.ok(sh.img) || !f) return false;
    const s = sh.meta.scale;
    ctx.drawImage(sh.img, f.x, f.y, f.w, f.h, f.ox, f.oy, f.w / s, f.h / s);
    return true;
  };
  // fotograma tingido de uma cor (silhueta), guardado numa cache pequena (LRU) — substitui ctx.filter,
  // que em muitos PCs obriga o canvas a desenhar por software
  const tintCache = new Map();
  Assets.tinted = function (sh, f, col) {
    const key = sh.img.src + '|' + f.x + ',' + f.y + '|' + col;
    let c = tintCache.get(key);
    if (c) { tintCache.delete(key); tintCache.set(key, c); return c; }
    c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(f.w)); c.height = Math.max(1, Math.ceil(f.h));
    const x = c.getContext('2d');
    x.drawImage(sh.img, f.x, f.y, f.w, f.h, 0, 0, f.w, f.h);
    x.globalCompositeOperation = 'source-in'; x.fillStyle = col; x.fillRect(0, 0, c.width, c.height);
    tintCache.set(key, c);
    if (tintCache.size > 48) tintCache.delete(tintCache.keys().next().value);
    return c;
  };
  Assets.drawTinted = function (ctx, sh, f, col) {
    if (!sh || !Assets.ok(sh.img) || !f) return false;
    const s = sh.meta.scale, c = Assets.tinted(sh, f, col);
    ctx.drawImage(c, 0, 0, c.width, c.height, f.ox, f.oy, c.width / s, c.height / s);
    return true;
  };
  // clarão de dano: o mesmo fotograma por cima em modo aditivo (barato, sem filtros)
  Assets.drawFlash = function (ctx, sh, f, k) {
    if (!sh || !Assets.ok(sh.img) || !f) return false;
    const s = sh.meta.scale, a = ctx.globalAlpha, op = ctx.globalCompositeOperation;
    ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = a * Math.min(1, k);
    ctx.drawImage(sh.img, f.x, f.y, f.w, f.h, f.ox, f.oy, f.w / s, f.h / s);
    ctx.globalCompositeOperation = op; ctx.globalAlpha = a;
    return true;
  };
  // procura o fotograma de uma animação: k em [0,1) para ciclos, ou índice direto
  Assets.frame = function (sh, anim, idx) {
    if (!sh) return null;
    const a = sh.meta.anims[anim];
    if (!a) return null;
    const n = a.frames.length;
    const i = a.loop ? ((Math.floor(idx) % n) + n) % n : Math.max(0, Math.min(n - 1, Math.floor(idx)));
    return sh.meta.frames[a.frames[i]];
  };
  // fotograma por fase de ataque (wind/act/rec) e progresso 0..1 dentro da fase
  Assets.phaseFrame = function (sh, anim, phase, k) {
    if (!sh) return null;
    const a = sh.meta.anims[anim];
    if (!a) return null;
    const ph = a.phases && a.phases[phase];
    if (!ph) return Assets.frame(sh, anim, k * a.frames.length);
    const [i0, i1] = ph;
    const i = Math.min(i1 - 1, i0 + Math.floor(Math.max(0, Math.min(0.999, k)) * (i1 - i0)));
    return sh.meta.frames[a.frames[i]];
  };
  VS.Assets = Assets;
})(window.VS);
