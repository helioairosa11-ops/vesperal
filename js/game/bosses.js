// Vesperal — chefes: estrutura comum (introdução, fases, postura, derrota, recompensas) + subchefes e Sir Caedmon
'use strict';
(function (VS) {
  const U = VS.U, T = U.TILE, G = VS.Gfx, A = VS.Audio, E = VS.Enemies;
  const DEFS = {};
  const front = (e, dx, dy, w, h) => ({ x: e.facing > 0 ? e.cx + dx : e.cx - dx - w, y: e.bottom - dy - h, w, h });
  const P = (o) => new VS.Projectile(o);

  class Boss extends E.Enemy {
    constructor(id, d, game) {
      super('b_' + id, d);
      this.bossId = id; this.spriteId = id; this.isBoss = true; this.nameKey = 'boss_' + id; this.game = game;
      this.music = this.c.music; this.phase = 0; this.aggro = true; this.intro = true; this.introT = 0;
      this.postureMax = this.c.posture || 0; this.posture = 0; this.poise = this.poiseMax = this.c.poise || 9999;
      this.defeated = false; this.defT = 0; this.z = 4; this.cool = 1.2;
      this.room = game.room; this.spawn = d;
      this.arena = { x0: T * 2, x1: game.room.pw - T * 2, floor: (d.floor !== undefined ? d.floor : d.y + 1) * T };
    }
    update(dt, game) {
      this.game = game;
      if (this.intro) { this.updateIntro(dt, game); return; }
      if (this.defeated) { this.updateDefeat(dt, game); return; }
      // fases por percentagem de vida
      const th = this.c.phases || [];
      while (this.phase < th.length && this.hp / this.maxHp <= th[this.phase]) {
        this.phase++; A.setIntensity(this.phase);
        if (this.K.onPhase) this.K.onPhase(this, game, this.phase);
      }
      super.update(dt, game);
      // nunca sair da arena
      this.x = U.clamp(this.x, 0, game.room.pw - this.w);
    }
    updateIntro(dt, game) {
      const first = this.introT === 0;
      this.introT += dt;
      this.attackHBs = [];
      if (first) {
        game.cutscene = true; game.player.vx = 0;
        if (this.K.introStart) this.K.introStart(this, game);
        A.sfx('roar', { vol: 0.8 }); G.addShake(0.4);
        A.playMusic(this.music, { fade: 0.4, restart: true });
        VS.UI.areaTitle(VS.t(this.nameKey));
      }
      if (this.K.introUpdate) this.K.introUpdate(this, game, dt);
      if (!this.flying) this.physics(dt, game);
      if (this.introT > (this.c.introTime || 1.8) && !this.introDone) {
        this.introDone = true;
        const lines = this.K.preLines ? this.K.preLines(this, game) : null;
        const begin = () => { this.intro = false; game.cutscene = false; game.startBoss(this); };
        if (lines && lines.length) VS.UI.dialogue(lines, null, begin); else begin();
      }
    }
    onHit(hb, game) {
      if (this.intro || this.defeated) return false;
      if (this.K.onHitBoss) { const r = this.K.onHitBoss(this, hb, game); if (r !== undefined) return r; }
      const r = super.onHit(hb, game);
      if (r === true && !this.defeated) A.sfx('boss_hit', { vol: 0.6 });
      return r;
    }
    onParried(game, hb) {
      if (this.K.onParried) { this.K.onParried(this, game, hb); return; }
      // genérico: interrompe o ataque e abre uma janela curta
      this.doStagger(this.c.parryStagger || 0.7, game, true); this.vx = -this.facing * 80;
    }
    die(game) {
      if (this.defeated) return;
      this.defeated = true; this.defT = 0; this.atk = null; this.hittable = false; this.contactDmg = 0; this.attackHBs = [];
      this.hp = 0;
      game.ents.forEach((e) => { if (e instanceof VS.Projectile && e.team === 'enemy') e.remove = true; if (e.isEnemy && !e.isBoss && e.summoned) e.die(game); });
      A.sfx('boss_die'); G.addShake(0.8); G.flash('#ffffff', 0.6); game.hitstop(0.4);
      A.stopMusic(1.2);
      VS.UI.bossBar(null);
    }
    updateDefeat(dt, game) {
      this.defT += dt; this.attackHBs = [];
      this.vx *= 0.9; if (!this.flying) this.physics(dt, game); else { this.vy = Math.min(this.vy + 200 * dt, 120); this.y = Math.min(this.y + this.vy * dt, game.room.ph - this.h - T * 3); }
      // primeiro tomba (animação de morte); depois desfaz-se em cinza e brasas
      if (this.defT > (VS.EnemyRender && VS.EnemyRender.has(this) ? 1.2 : 0)) { VS.FX.dissolve(this, this.c.ashCol); VS.FX.dissolve(this, '#ffd080'); }
      else if (Math.random() < 0.4) G.emit({ x: this.cx + U.rand(-this.w / 3, this.w / 3), y: this.y + U.rand(0, this.h), vx: U.rand(-20, 20), vy: U.rand(-60, -20), drag: 1, life: 0.8, size: U.rand(0.6, 1.2), color: U.pick(['#ff9040', '#ffd080']), add: true, shrink: true, layer: 2 });
      if (this.defT > 2.4 && !this.finished) {
        this.finished = true; this.remove = true;
        const st = VS.state;
        st.bosses[this.bossId] = true;
        VS.FX.flare(this.cx, this.cy, 40, [255, 220, 160], 0.5);
        for (let i = 0; i < 40; i++) G.emit({ x: this.cx + U.rand(-this.w / 2, this.w / 2), y: this.cy + U.rand(-this.h / 2, this.h / 2), vx: U.rand(-80, 80), vy: U.rand(-160, -40), drag: 1.4, life: U.rand(0.8, 1.6), size: U.rand(0.8, 1.6), color: U.pick(['#ffd090', '#ff9a40', '#fff4d0']), add: true, shrink: true, layer: 2 });
        game.endBoss(this);
        VS.Bosses.reward(this.bossId, game, this);
      }
    }
    draw(ctx, game) {
      ctx.save();
      const ER = VS.EnemyRender, sheet = ER && ER.has(this) && !(this.K.drawSpecial && this.K.drawSpecial(ctx, this, game));
      // com folha nova: o corpo cai (animação de morte) e só no fim se desfaz
      if (this.defeated) ctx.globalAlpha = sheet ? U.clamp(1 - (this.defT - 1.6) / 0.8, 0, 1) : Math.max(0, 1 - this.defT / 2.4);
      if (sheet) { if (this.K.drawBehind && !this.defeated) this.K.drawBehind(ctx, this); ER.draw(ctx, this); ER.smear(ctx, this, this.K.smearCol); if (VS.SpritesBoss.overlays) VS.SpritesBoss.overlays(ctx, this); if (this.K.drawFront && !this.defeated) this.K.drawFront(ctx, this); }
      else if (!(this.K.drawSpecial && this.underground)) VS.SpritesBoss[this.spriteId](ctx, this, game);
      ctx.restore();
      const tell = this.tellState();
      if (tell && VS.settings.telegraphs !== false && !this.defeated) (sheet ? ER.tell : VS.SpritesEnemy.tell)(ctx, this, tell);
    }
    emitLightEyes() { if (this.K.eyeLight && VS.EnemyRender) VS.EnemyRender.light(this); }
    emitLight() { if (this.K.light) this.K.light(this); this.emitLightEyes(); }
  }

  const Bosses = { DEFS, Boss };
  Bosses.def = function (id, def) { def.boss = true; DEFS[id] = def; E.KINDS['b_' + id] = def; };
  Bosses.spawn = function (d, game) {
    if (DEFS[d.boss].spawn) return DEFS[d.boss].spawn(d, game);
    const b = new Boss(d.boss, d, game);
    b.facing = game.player.cx < b.cx ? -1 : 1;
    game.spawn(b);
    return b;
  };
  // recompensas e eventos pós-chefe
  Bosses.reward = function (id, game, b) {
    const st = VS.state, R = VS.Story.REWARDS[id] || {};
    const give = (item, n) => { st.give(item, n); VS.UI.itemGet(item, n || 1); A.sfx('pickup_big'); };
    if (R.ash) st.ash += R.ash;
    const after = () => {
      (R.items || []).forEach((it, i) => setTimeout(() => give(it[0], it[1]), 400 + i * 1600));
      if (R.ability) { st.abilities[R.ability] = true; setTimeout(() => { VS.UI.itemGet('ab_' + R.ability); A.sfx('pickup_big'); VS.UI.toast(VS.t('tut_' + R.ability), 6); }, 300); }
      setTimeout(() => game.save(), 500);
      if (VS.Story.afterBoss) VS.Story.afterBoss(id, game);
    };
    const lines = VS.Story.postLines && VS.Story.postLines(id, game);
    if (lines && lines.length) VS.UI.dialogue(lines, null, after); else after();
  };
  VS.Bosses = Bosses;

  // ======================================================================
  // O COVEIRO — subchefe da Cidade Cinzenta
  // ======================================================================
  Bosses.def('coveiro', {
    // gigante (≈2× a protagonista): caixa do corpo 40×64; a pá chega a ~70 px à frente
    cfg: { w: 40, h: 64, hp: 320, music: 'sb_coveiro', heavy: true, phases: [0.5], ash: 0, ashCol: '#7a6a58' },
    attacks: {
      // golpe de cima: a pá desce por cima da cabeça e crava-se à frente (aparável); fica presa — costas expostas
      slam: { wind: 0.8, act: 0.16, rec: 1.15, dmg: 22, tell: 'white', sfx: 'swing_heavy', hb: (e) => front(e, 10, 0, 64, 62),
        onAct(e, g) { G.addShake(0.45); A.sfx('crush'); const x = e.cx + e.facing * 66; VS.FX.impact(x, e.bottom - 2, 'stone', e.facing, 1.3); G.burst(x, e.bottom - 2, 22, { color: '#5a4a3a', speed: 170, angle: -Math.PI / 2, spread: 1.6, g: 600, life: 0.8, size: 2.2 }); } },
      // varrida rente (sem sinal): raspa o chão de trás para a frente — saltar
      sweep: { wind: 0.6, act: 0.18, rec: 0.6, dmg: 18, tell: null, sfx: 'swing_heavy', hb: (e) => front(e, -6, 0, 84, 26), lunge: 50,
        during(e, g) { if (Math.random() < 0.7) G.emit({ x: e.cx + e.facing * U.rand(10, 70), y: e.bottom - 1, vx: e.facing * U.rand(40, 120), vy: U.rand(-90, -20), g: 400, life: 0.5, size: U.rand(1, 2), color: U.pick(['#5a4a3a', '#6a5a48']) }); } },
      // terra: enche a pá e atira torrões em arco
      clods: { wind: 0.65, act: 0.1, rec: 0.7, tell: null, sfx: 'swing', onAct(e, g) { const n = e.phase ? 5 : 3, p = g.player, o = VS.EnemyRender.point(e, e._f, 'tip') || { x: e.cx + e.facing * 30, y: e.y }; for (let i = 0; i < n; i++) { const dx = (p.cx - o.x) * (0.55 + i * 0.25); g.spawn(P({ x: o.x - 5, y: o.y - 5, vx: dx / 1.0, vy: -300 + i * 30, g: 700, w: 10, h: 10, dmg: 12, kind: 'clod', life: 3, light: false, reflectable: false })); } } },
      // enterrar-se (vermelho): crava a pá, afunda-se e irrompe debaixo da protagonista
      burrow: { wind: 0.7, act: 1.4, rec: 0.6, dmg: 24, tell: 'red', sfx: 'crush',
        onAct(e, g) { e.underground = true; e.hittable = false; A.sfx('crush'); G.burst(e.cx, e.bottom, 20, { color: '#5a4a3a', speed: 140, angle: -Math.PI / 2, spread: 2, g: 500, life: 0.8, size: 2.4 }); },
        during(e, g, dt) {
          const a = e.atk;
          if (a.t < 1.0) { e.vx = 0; e.targetX = g.player.cx; if (Math.random() < 0.5) G.emit({ x: e.targetX + U.rand(-14, 14), y: e.arena.floor - 2, vy: -60, life: 0.5, size: 1.8, color: '#6a5a48', g: 300 }); }
          else if (!a.emerged) { a.emerged = true; e.x = U.clamp(e.targetX - e.w / 2, 40, g.room.pw - e.w - 40); e.underground = false; e.hittable = true; G.addShake(0.5); A.sfx('crush'); G.burst(e.cx, e.bottom, 30, { color: '#5a4a3a', speed: 240, angle: -Math.PI / 2, spread: 1.2, g: 600, life: 0.9, size: 2.8 }); }
          if (a.emerged && a.t < 1.2) e.attackHBs.push({ x: e.x - 8, y: e.y - 20, w: e.w + 16, h: e.h + 20, dmg: 24, id: a.id, unblockable: true, parryable: false, src: e });
        } },
    },
    think(e, dt, g) {
      if (e.atk) return;
      e.face();
      const d = Math.abs(e.dx());
      if (e.cool > 0) { e.walk(d > 80 ? e.facing : 0, 42, dt); return; }
      const r = Math.random();
      if (d < 80) e.attack(r < 0.5 ? 'sweep' : 'slam');
      else if (d < 180) e.attack(r < 0.5 ? 'slam' : (e.phase && r < 0.8 ? 'burrow' : 'clods'));
      else e.attack(e.phase && r < 0.5 ? 'burrow' : 'clods');
    },
    onPhase(e, g) { A.sfx('roar'); G.addShake(0.4); e.cool = 0.2; },
    eyeLight: { r: 30, i: 0.5, color: '#ffb84a' },
    // debaixo da terra: só um monte de terra a mexer (desenho próprio); ao sair, a animação 'emerge'
    drawSpecial(ctx, e) {
      if (!e.underground) return false;
      const x = e.targetX || e.cx, y = e.arena.floor;
      for (let i = 0; i < 3; i++) { ctx.fillStyle = ['#2e241c', '#3e3226', '#54463a'][i]; ctx.beginPath(); ctx.ellipse(x + Math.sin(e.t * 9 + i) * 1.5, y, 26 - i * 6, 7 - i * 1.6 + Math.sin(e.t * 12) * 0.6, 0, Math.PI, 0); ctx.fill(); }
      return true;
    },
    animState(e) {
      if (e.intro) return { anim: 'emerge', idx: e.rising > 0 ? Math.min(3.9, (1 - e.rising) * 4) : Math.min(5, 4 + (e.introT - 1.43) * 6) };
      const a = e.atk; if (a && a.name === 'burrow' && a.emerged) return { anim: 'emerge', idx: Math.min(5, ((a.t - 1.0) / 0.5) * 6) }; return null;
    },
    // fraqueza: com a pá cravada no chão (depois do golpe de cima) as costas e a lanterna ficam expostas
    damageMult(e, hb) {
      const a = e.atk, behind = (e.game.player.cx - e.cx) * e.facing < 0;
      if (a && a.name === 'slam' && a.phase === 'rec' && behind) {
        if (!e.backHint) { e.backHint = true; VS.UI.toast(VS.t('tip_coveiro_back'), 5); }
        const L = VS.EnemyRender.point(e, e._f, 'light') || { x: e.cx - e.facing * 10, y: e.cy - 20 };
        VS.FX.flare(L.x, L.y, 22, [255, 210, 140], 0.18); return 1.8;
      }
      return 1;
    },
    // entrada: irrompe da terra da fossa (a animação 'emerge' corta o corpo pelo chão)
    introStart(e, g) { e.rising = 1; },
    introUpdate(e, g, dt) { if (e.rising > 0) { e.rising -= dt * 0.7; if (Math.random() < 0.7) G.emit({ x: e.cx + U.rand(-20, 20), y: e.bottom - 1, vx: U.rand(-40, 40), vy: U.rand(-160, -60), life: 0.7, size: U.rand(1.4, 2.6), color: U.pick(['#5a4a3a', '#3e3226']), g: 500 }); if (e.rising <= 0) { G.addShake(0.4); A.sfx('crush'); } } },
    light(e) { const L = e._f && VS.EnemyRender.point(e, e._f, 'light'); if (L && !e.underground) G.light(L.x, L.y, 100, '#ffb060', 0.8, 2); },
  });

  // ======================================================================
  // A VELHA MATILHEIRA — subchefe do Bastião
  // ======================================================================
  Bosses.def('matilheira', {
    // mastim velho e enorme (≈92 px de comprimento); fraqueza: ao uivar ergue-se e mostra a barriga
    cfg: { w: 70, h: 46, hp: 400, music: 'sb_matilheira', heavy: true, phases: [0.5], ashCol: '#5a524c' },
    attacks: {
      lunge: { wind: 0.5, act: 0.3, rec: 0.55, dmg: 18, tell: null, sfx: 'whip', lunge: 380, hb: (e) => front(e, 18, 6, 44, 40), onAct(e) { e.vy = -140; } },
      bite: { wind: 0.32, act: 0.14, rec: 0.25, dmg: 14, tell: 'white', hb: (e) => front(e, 24, 14, 34, 32), lunge: 60, cool: 0, onEnd(e) { if (e.bites++ < (e.phase ? 2 : 1)) e.attack('bite'); else e.bites = 0; } },
      leap: { wind: 0.55, act: 0.9, rec: 0.6, dmg: 22, tell: 'red', sfx: 'wind',
        onAct(e, g) { const p = g.player; const dx = p.cx - e.cx; e.vx = dx / 0.75; e.vy = -520; e.leaping = true; },
        during(e, g) { e.attackHBs.push({ x: e.x, y: e.y, w: e.w, h: e.h, dmg: 22, id: e.atk.id, unblockable: true, parryable: false, src: e }); if (e.onGround && e.atk.t > 0.2) { e.atk.t = 99; e.vx = 0; G.addShake(0.45); A.sfx('crush'); VS.FX.impact(e.cx + e.facing * 30, e.bottom - 2, 'stone', e.facing, 1.4); } },
        onEnd(e) { e.leaping = false; } },
      // FÚRIA (fase 2, vermelho): corre a direito pelo canil, derrapa na parede e volta para trás (duas idas na última metade);
      // no fim fica sem fôlego, a arfar — é a janela para a ferir. Foge-se trepando a parede ou subindo às plataformas.
      rampage: { wind: 0.7, act: 6.0, rec: 0.4, dmg: 24, tell: 'red', sfx: 'roar', onAct(e, g) { e.rampDir = e.facing; e.rampLegs = e.hp < e.maxHp * 0.25 ? 3 : 2; e.skid = 0; },
        during(e, g, dt) {
          const a = e.atk;
          if (e.skid > 0) { e.skid -= dt; e.vx = U.approach(e.vx, 0, 1600 * dt); if (Math.random() < 0.8) G.emit({ x: e.cx + e.rampDir * 20, y: e.bottom - 2, vx: e.rampDir * U.rand(40, 120), vy: U.rand(-80, -20), life: 0.5, size: U.rand(1.5, 3), color: 'rgba(120,110,100,0.55)' }); if (e.skid <= 0) { e.rampDir *= -1; A.sfx('roar', { vol: 0.4 }); } return; }
          e.facing = e.rampDir; e.vx = e.rampDir * 430;
          e.attackHBs.push({ x: e.x + 6, y: e.y + 4, w: e.w - 12, h: e.h - 6, dmg: 24, id: a.id * 10 + e.rampLegs, unblockable: true, parryable: false, src: e });
          if (Math.random() < 0.5) G.emit({ x: e.cx - e.rampDir * 30, y: e.bottom - 2, vx: -e.rampDir * 60, vy: -30, life: 0.5, size: 2, color: 'rgba(120,110,100,0.5)' });
          if (e.wallAhead(e.rampDir) || (e.rampDir > 0 ? e.x + e.w >= g.room.pw - T * 2 - 30 : e.x <= T * 2 + 30)) {
            if (--e.rampLegs > 0) { e.skid = 0.32; A.sfx('step_stone'); return; }
            // sem fôlego: para de lado, de língua de fora — leva mais dano
            e.atk = null; e.vx = 0; e.pant = e.phase ? 2.2 : 2.6; e.cool = 0.4;
            if (!e.rampHint) { e.rampHint = true; VS.UI.toast(VS.t('tip_matilheira_wall'), 4); }
          }
        } },
      // uivo: ergue-se sobre as patas de trás e chama a matilha — a barriga fica exposta (×2, e um golpe forte interrompe)
      howl: { wind: 1.1, act: 0.35, rec: 0.6, tell: null, sfx: 'howl', onWind(e) { e.howlHurt = 0; },
        onAct(e, g) { if (e.howlBroken) return; for (const s of [-1, 1]) { const k = E.make({ k: 'hound', x: Math.floor((e.cx + s * 140) / T), y: Math.floor((e.bottom - 1) / T) }, 'summon', g); k.aggro = true; k.summoned = true; k.c = Object.assign({}, k.c, { ash: 0 }); g.spawn(k); } } },
    },
    init(e) { e.bites = 0; e.debris = []; },
    think(e, dt, g) {
      if (e.pant > 0) { e.pant -= dt; e.vx = U.approach(e.vx, 0, 600 * dt); if (Math.random() < 0.12) G.emit({ x: e.cx + e.facing * 34, y: e.y + 18, vx: e.facing * 20, vy: -20, life: 0.8, size: 2.4, color: 'rgba(220,220,230,0.25)' }); return; }
      if (e.atk) return;
      e.face(); const d = Math.abs(e.dx());
      if (e.phase && e.cool <= 0 && (e.rampCd = (e.rampCd || 0) - 1) <= 0 && Math.random() < 0.35) { e.rampCd = 4; e.attack('rampage'); return; }
      if (e.cool > 0) { e.walk(d < 110 ? -e.facing : d > 190 ? e.facing : 0, 130, dt); return; }
      const r = Math.random();
      // uiva no início de cada fase e, de vez em quando, quando a matilha já caiu
      const pack = g.ents.filter((x) => x.summoned && !x.dead).length;
      if ((e.phase && !e.howled) || (!pack && r < 0.12)) { e.howled = true; e.howlBroken = false; e.attack('howl'); return; }
      if (d < 70) e.attack('bite');
      else if (d < 200) e.attack(r < 0.6 ? 'lunge' : 'leap');
      else e.attack('leap');
    },
    damageMult(e, hb) {
      const a = e.atk;
      if (e.pant > 0) return 1.6;
      if (e.stagger > 0 && e.parried) return 1.5;
      if (a && a.name === 'howl' && a.phase !== 'rec') {
        if (!VS.state.flags.tip_matilheira) { VS.state.flags.tip_matilheira = 1; VS.UI.toast(VS.t('tip_matilheira_belly'), 5); }
        const B = VS.EnemyRender.point(e, e._f, 'belly') || { x: e.cx, y: e.cy };
        VS.FX.flare(B.x, B.y, 20, [255, 210, 160], 0.15);
        // um golpe forte (ou o segundo golpe) interrompe o uivo: cai de lado, atordoada, e não chama ninguém
        e.howlHurt = (e.howlHurt || 0) + 1;
        if (hb.kind === 'heavy' || hb.kind === 'riposte' || e.howlHurt >= 2) { e.howlBroken = true; setTimeout(() => { if (!e.defeated) e.doStagger(1.4, e.game, true); }, 0); }
        return 2;
      }
      return 1;
    },
    onPhase(e, g) { e.cool = 0; },
    introStart(e) { e.vy = -300; },
    animMap: { rampage: 'move' },
    animState(e) { if (e.pant > 0 && !e.defeated) return { anim: 'stagger' }; if (e.atk && e.atk.name === 'rampage' && e.atk.phase === 'act') return e.skid > 0 ? { anim: 'atk_lunge', phase: 'rec', k: 0.2 } : { anim: 'move', idx: (e.anim * 16) % 8 }; return null; },
    eyeLight: { r: 26, i: 0.55, color: '#ff8030' },
  });

  // ======================================================================
  // SIR CAEDMON, O ESCUDO DA RAINHA — chefe centrado no parry
  // Escudo absoluto: só sofre dano com a postura quebrada; a postura só enche com parries.
  // ======================================================================
  const CAED_RIPOSTE_WINDOW = 2.2;
  Bosses.def('caedmon', {
    // cavaleiro alto (≈2× a protagonista) com um pavês quase da altura dele
    cfg: { w: 30, h: 66, hp: 520, music: 'b_caedmon', heavy: true, phases: [0.66, 0.33], posture: 3, introTime: 1.6, ashCol: '#8a90a0' },
    attacks: {
      cut: { wind: 0.55, act: 0.13, rec: 0.45, dmg: 18, tell: 'white', hb: (e) => front(e, 2, 10, 62, 70), lunge: 120, cool: 0.6 },
      cut2a: { wind: 0.45, act: 0.12, rec: 0.12, dmg: 16, tell: 'white', hb: (e) => front(e, 2, 10, 62, 70), lunge: 110, cool: 0, onEnd(e) { e.attack('cut2b'); } },
      cut2b: { wind: 0.38, act: 0.12, rec: 0.5, dmg: 16, tell: 'white', hb: (e) => front(e, 4, 16, 60, 80), lunge: 130 },
      feint: { wind: 0.9, act: 0.13, rec: 0.45, dmg: 20, tell: 'white', hb: (e) => front(e, 2, 10, 64, 70), lunge: 160, onWind(e) { e.feintT = 0; } },
      combo3a: { wind: 0.4, act: 0.11, rec: 0.1, dmg: 15, tell: 'white', hb: (e) => front(e, 2, 10, 62, 70), lunge: 120, cool: 0, onEnd(e) { e.attack('combo3b'); } },
      combo3b: { wind: 0.3, act: 0.11, rec: 0.12, dmg: 15, tell: 'white', hb: (e) => front(e, 4, 16, 60, 80), lunge: 120, cool: 0, onEnd(e) { e.attack(e.phase >= 2 && Math.random() < 0.5 ? 'thrust' : 'combo3c'); } },
      combo3c: { wind: 0.55, act: 0.13, rec: 0.6, dmg: 20, tell: 'white', hb: (e) => front(e, 0, 0, 68, 72), lunge: 170 },
      thrust: { wind: 0.7, act: 0.22, rec: 0.9, dmg: 26, tell: 'red', hb: (e) => front(e, 10, 30, 68, 18), lunge: 420, sfx: 'swing_heavy' },
      bash: { wind: 0.35, act: 0.12, rec: 0.4, dmg: 12, tell: null, sfx: 'shield', hb: (e) => front(e, 6, 6, 30, 64), lunge: 220, onAct(e, g) { const p = g.player; if (p.action && p.action.type === 'parry' && p.action.guard) { p.action = null; p.vx = -p.dir * 220; VS.UI.toast(VS.t('tip_guardbreak')); } } },
      // AO ALTO ESCUDOS (fases 2–3): ergue o pavês e os archeiros mortos da muralha disparam uma saraivada.
      // Só debaixo do escudo dele (ou com parry às setas) se está a salvo.
      volley: { wind: 0.7, act: 2.2, rec: 0.6, tell: null, sfx: 'shield', onAct(e, g) { A.sfx('roar', { vol: 0.5 }); e.volleyT = 0; if (!e.volleyHint) { e.volleyHint = true; VS.UI.toast(VS.t('tip_caedmon_volley'), 4); } },
        during(e, g, dt) {
          e.volleyT -= dt; if (e.volleyT > 0) return; e.volleyT = e.phase >= 2 ? 0.09 : 0.12;
          const W = g.room.pw; let x = U.rand(40, W - 40); if (Math.abs(x - e.cx) < 46) x = e.cx + (x < e.cx ? -1 : 1) * U.rand(50, 90);
          g.spawn(P({ x, y: G.cam.y - 10, vx: U.rand(-20, 20), vy: 460, w: 4, h: 12, dmg: 12, kind: 'bolt', color: '#c8c0b0', life: 2.4, solid: true, reflectable: false }));
          if (Math.random() < 0.25) A.sfx('shoot', { vol: 0.3 });
        } },
    },
    think(e, dt, g) {
      if (e.atk) return;
      if (e.broken > 0) return;
      e.face(); const d = Math.abs(e.dx());
      e.guarding = true;
      if (e.cool > 0) { e.walk(d > 70 ? e.facing : d < 40 ? -e.facing : 0, 60, dt); return; }
      if (d > 110) { e.walk(e.facing, 90, dt); if (Math.random() < 0.01 && e.phase >= 2) e.attack('thrust'); return; }
      const r = Math.random();
      const ph = e.phase;
      if (ph >= 1 && (e.volleyCd = (e.volleyCd || 0) - 1) <= 0 && r < 0.3) { e.volleyCd = 5; e.attack('volley'); return; }
      if (ph === 0) e.attack(r < 0.6 ? 'cut' : 'cut2a');
      else if (ph === 1) e.attack(r < 0.35 ? 'cut2a' : r < 0.6 ? 'feint' : r < 0.85 ? 'combo3a' : 'bash');
      else e.attack(r < 0.25 ? 'combo3a' : r < 0.45 ? 'thrust' : r < 0.65 ? 'feint' : r < 0.82 ? 'cut2a' : 'bash');
    },
    init(e) { e.broken = 0; e.shieldHits = 0; },
    preLines: () => [{ s: 'boss_caedmon', k: 'caedmon_pre1' }, { s: 'boss_caedmon', k: 'caedmon_pre2' }],
    // escudo absoluto
    onHitBoss(e, hb, g) {
      if (e.broken > 0) {
        // postura quebrada: o golpe entra (os contra-ataques ainda mais)
        const mult = hb.kind === 'riposte' ? 1.6 : 1;
        e.hp -= Math.round(hb.dmg * mult); e.flash = 0.15; A.sfx('hit_heavy'); A.sfx('boss_hit'); g.hitstop(0.08);
        VS.FX.hit({ x: hb.tipX !== undefined ? U.clamp(hb.tipX, e.x, e.x + e.w) : e.cx, y: hb.tipY !== undefined ? U.clamp(hb.tipY, e.y, e.y + e.h) : e.cy, mat: 'armor', wmat: hb.mat, mark: hb.mark, ang: hb.cutA, bend: hb.cutBend, dir: g.player.dir, power: 1.4, heavy: true });
        if (e.hp <= 0) e.die(g);
        return true;
      }
      // bloqueado
      A.sfx('shield'); A.sfx('hit_metal', { vol: 0.5 }); { const S2 = VS.EnemyRender.point(e, e._f, 'edge') || { x: e.cx + e.facing * 14, y: e.cy - 6 }; VS.FX.block(S2.x, S2.y, g.player.dir, true); } e.blockT = 0.2;
      g.player.vx = -g.player.dir * 180; g.hitstop(0.03);
      e.shieldHits++;
      if (e.shieldHits === 2 || e.shieldHits % 6 === 0) VS.UI.toast(VS.t('tip_caedmon_shield'), 4);
      if (e.shieldHits % 4 === 0 && !e.atk) e.attack('bash');
      return 'blocked';
    },
    onParried(e, g) {
      e.posture++;
      e.atk = null; e.cool = 0.35; e.vx = -e.facing * 140;
      VS.FX.stun(e);
      if (e.posture >= e.postureMax) {
        e.posture = e.postureMax; e.broken = CAED_RIPOSTE_WINDOW; e.guarding = false;
        A.sfx('stagger'); A.sfx('choir_hit'); G.flash('#fff6e0', 0.4);
        VS.UI.toast(VS.t('tip_caedmon_broken'), 3);
      } else e.stagger = 0.25;
    },
    update2: null,
    // golpes curtos dos combos usam as mesmas animações; aparar com o pavês e postura quebrada têm poses próprias
    animMap: { cut2a: 'atk_cut', combo3a: 'atk_cut', combo3b: 'atk_cut2b', combo3c: 'atk_cut' },
    animState(e) { if (e.broken > 0) return { anim: 'broken' }; if (e.blockT > 0 && !e.atk) return { anim: 'block', idx: (1 - e.blockT / 0.2) * 3 }; return null; },
    eyeLight: { r: 18, i: 0.4, color: '#bcd8ff', when: (e) => e.broken <= 0 },
    light(e) { if (e.broken > 0) G.light(e.cx, e.cy, 80, '#ffffff', 0.6); },
  });
  // atualização extra de Caedmon (janela de postura quebrada)
  const caedThink = DEFS.caedmon.think;
  DEFS.caedmon.think = function (e, dt, g) {
    if (e.blockT > 0) e.blockT -= dt;
    if (e.broken > 0) {
      e.broken -= dt; e.vx = U.approach(e.vx, 0, 600 * dt); e.atk = null;
      if (e.broken <= 0) { e.broken = 0; e.posture = 0; e.guarding = true; e.cool = 0.3; A.sfx('shield'); }
      return;
    }
    caedThink(e, dt, g);
  };

  // ======================================================================
  // O AUTÓMATO DO FOLE — subchefe das Forjas
  // ======================================================================
  // grelhas da fundição: oito posições fixas, igualmente espaçadas pela arena
  const automatoGrates = (e) => e.grates || (e.grates = Array.from({ length: 8 }, (_, i) => Math.round(e.arena.x0 + (e.arena.x1 - e.arena.x0) * (i + 0.5) / 8)));
  Bosses.def('automato', {
    cfg: { w: 40, h: 60, hp: 520, music: 'sb_automato', heavy: true, phases: [0.5], parryStagger: 1.2 },
    attacks: {
      punch: { wind: 0.6, act: 0.16, rec: 0.6, dmg: 22, tell: 'white', hb: (e) => front(e, 12, 20, 52, 28), lunge: 90, sfx: 'swing_heavy' },
      crush: { wind: 0.85, act: 0.15, rec: 0.9, dmg: 28, tell: 'red', hb: (e) => front(e, 6, 0, 58, 34), sfx: 'swing_heavy', armor: true, onAct(e, g) { G.addShake(0.5); A.sfx('crush'); VS.FX.impact(e.cx + e.facing * 44, e.bottom - 2, 'metal', e.facing, 1.4); e.steam = { t: 0, id: VS.Entity.newAttackId() }; A.sfx('wind'); } },
      bellows: { wind: 0.7, act: 0.9, rec: 0.6, tell: null, sfx: 'wind', during(e, g, dt) { const p = g.player; const d = (p.cx - e.cx) * e.facing; if (d > 0 && d < 220 && Math.abs(p.cy - e.cy) < 50) { p.vx += e.facing * 900 * dt; if (d < 70) e.attackHBs.push({ x: e.facing > 0 ? e.cx : e.cx - 70, y: e.y + 10, w: 70, h: 40, dmg: 10, id: e.atk.id, src: e, parryable: false }); } const nz = (VS.EnemyRender && VS.EnemyRender.point(e, e._f, 'nozzle')) || { x: e.cx + e.facing * 34, y: e.bottom - 34 }; if (Math.random() < 0.9) G.emit({ x: nz.x, y: nz.y + U.rand(-6, 6), vx: e.facing * U.rand(250, 400), vy: U.rand(-20, 20), life: 0.5, size: U.rand(4, 9), color: 'rgba(220,200,190,0.25)', kind: 'glow', color2: '#000000' }); } },
      // respiradouros: as grelhas FIXAS do chão da fundição sopram fogo à vez (ímpares, depois pares) — aprende-se o padrão
      vents: { wind: 0.5, act: 1.7, rec: 0.6, tell: null, sfx: 'charge', onAct(e, g) { e.ventSet = e.ventSet ? 0 : 1; },
        during(e, g) {
          const a = e.atk, G2 = automatoGrates(e), waves = e.phase ? [[0, 0.55], [0.85, 1.4]] : [[0, 0.6]];
          e.colXs = null;
          waves.forEach(([t0, t1], wi) => {
            const xs = G2.filter((x, i) => i % 2 === (e.ventSet + wi) % 2);
            if (a.t >= t0 && a.t < t1) { e.colXs = xs; e.colWarnCol = '#ff8030'; for (const x of xs) if (Math.random() < 0.25) G.emit({ x: x + U.rand(-6, 6), y: e.arena.floor - 2, vy: -30, life: 0.4, size: 1.6, color: '#ff8030', add: true }); }
            else if (a.t >= t1 && a.t < t1 + 0.4) {
              if (!a['f' + wi]) { a['f' + wi] = true; A.sfx('fire'); }
              for (const x of xs) { if (Math.random() < 0.8) G.emit({ x: x + U.rand(-6, 6), y: e.arena.floor, vx: U.rand(-10, 10), vy: U.rand(-420, -300), life: 0.5, size: U.rand(2, 4), color: U.pick(['#ffb040', '#ff6010']), add: true, shrink: true }); e.attackHBs.push({ x: x - 11, y: e.arena.floor - 140, w: 22, h: 140, dmg: 16, id: a.id * 100 + wi * 10 + G2.indexOf(x), unblockable: true, parryable: false, src: { cx: x } }); }
            }
          });
        },
        // depois dos respiradouros a fornalha fica em brasa: as costas ficam expostas e muito frágeis
        onEnd(e) { e.overheat = 2.2; A.sfx('crackle'); } },
    },
    think(e, dt, g) {
      if (e.overheat > 0) e.overheat -= dt;
      // jato de vapor do esmagamento: um anel escaldante que cresce à volta dele (afasta-te!)
      const st = e.steam;
      if (st) {
        st.t += dt; const R = 18 + Math.min(1, st.t / 0.3) * 66;
        if (st.t < 0.42) e.attackHBs.push({ x: e.cx - R, y: e.bottom - 48, w: R * 2, h: 48, dmg: 16, id: st.id, unblockable: true, parryable: false, src: e });
        for (let i = 0; i < 4 && st.t < 0.5; i++) { const s2 = Math.random() < 0.5 ? -1 : 1; G.emit({ x: e.cx + s2 * R * U.rand(0.6, 1), y: e.bottom - U.rand(4, 40), vx: s2 * U.rand(60, 160), vy: U.rand(-60, 10), life: 0.6, size: U.rand(5, 10), color: 'rgba(235,225,215,0.3)', kind: 'glow', color2: '#000000' }); }
        if (st.t > 0.6) e.steam = null;
      }
      // fumo das chaminés
      const ER = VS.EnemyRender;
      if (ER && e._f && Math.random() < (e.overheat > 0 ? 0.6 : 0.18)) for (const k of ['pipeA', 'pipeB']) { const q = ER.point(e, e._f, k); if (q) G.emit({ x: q.x, y: q.y, vx: U.rand(-8, 8) - e.facing * 10, vy: U.rand(-40, -24), life: 1.4, size: U.rand(3, 6), color: e.overheat > 0 ? 'rgba(255,150,70,0.35)' : 'rgba(60,54,58,0.45)', kind: 'glow', color2: '#000000' }); }
      if (e.atk) return;
      e.face(); const d = Math.abs(e.dx());
      // em sobreaquecimento vira-se devagar (dá tempo de passar para trás dele)
      if (e.overheat > 0) { e.vx = U.approach(e.vx, 0, 400 * dt); return; }
      if (e.cool > 0) { e.walk(d > 80 ? e.facing : 0, 35, dt); return; }
      const r = Math.random();
      if (d < 70) e.attack(r < 0.5 ? 'punch' : r < 0.8 ? 'crush' : 'bellows');
      else if (d < 200) e.attack(r < 0.45 ? 'bellows' : 'vents');
      else e.attack('vents');
    },
    // ponto fraco: a fornalha nas costas (ainda mais frágil em sobreaquecimento, que o faz cambalear)
    onHitBoss(e, hb, g) {
      const back = (g.player.cx - e.cx) * e.facing < 0;
      if (back) {
        const hot = e.overheat > 0, ER = VS.EnemyRender, f = (ER && ER.point(e, e._f, 'back')) || { x: e.cx - e.facing * 8, y: e.bottom - 47 };
        hb = Object.assign({}, hb, { dmg: Math.round(hb.dmg * (hot ? 2.4 : 1.8)) });
        G.burst(f.x, f.y, hot ? 18 : 10, { color: '#ffb040', speed: 140, life: 0.4, size: 1.8, add: true });
        if (hot && !e.atk && !(e.stagger > 0)) { e.stagger = 1.1; e.overheat = 0; A.sfx('stagger'); G.flash('#ffb060', 0.25); }
        if (!e.backHint) { e.backHint = true; VS.UI.toast(VS.t('tip_automato_back')); }
      }
      return E.Enemy.prototype.onHit.call(e, hb, g);
    },
    eyeLight: { r: 16, i: 0.45, color: '#ff9a40' },
    // as grelhas fixas no chão (onde sopram os respiradouros)
    drawBehind(ctx, e) {
      const fl = e.arena.floor;
      for (const x of automatoGrates(e)) {
        ctx.fillStyle = '#16120f'; ctx.fillRect(x - 12, fl - 2, 24, 3);
        ctx.fillStyle = 'rgba(255,110,40,0.35)'; for (let i = -9; i <= 9; i += 4.5) ctx.fillRect(x + i - 0.8, fl - 1.6, 1.6, 1.4);
        ctx.fillStyle = '#4a3c32'; ctx.fillRect(x - 12, fl - 2.6, 24, 0.8);
      }
    },
    light(e) { const ER = VS.EnemyRender, f = (ER && ER.point(e, e._f, 'back')) || { x: e.cx - e.facing * 8, y: e.bottom - 47 }; G.light(f.x, f.y, e.overheat > 0 ? 150 : 110, e.overheat > 0 ? '#ffd080' : '#ff7020', e.overheat > 0 ? 1.1 : 0.85, 2); },
  });

  // ======================================================================
  // A MÃE-MARIPOSA — subchefe dos Jardins (concede o salto duplo)
  // ======================================================================
  Bosses.def('mariposa', {
    cfg: { w: 50, h: 46, hp: 440, music: 'sb_mariposa', flying: true, phases: [0.5], heavy: true, parryStagger: 0.9 },
    sheetAnchor: 'center',
    attacks: {
      dive: { wind: 0.65, act: 0.7, rec: 0.6, dmg: 20, tell: 'red', sfx: 'wind', onAct(e, g) { const p = g.player; const a = Math.atan2(p.cy - e.cy, p.cx - e.cx); e.vx = Math.cos(a) * 380; e.vy = Math.sin(a) * 380; }, during(e) { e.attackHBs.push({ x: e.x + 8, y: e.y + 6, w: e.w - 16, h: e.h - 12, dmg: 20, id: e.atk.id, unblockable: true, parryable: false, src: e }); }, onEnd(e) { e.vx *= 0.2; e.vy = -120; } },
      swarm: { wind: 0.7, act: 0.1, rec: 0.7, tell: null, sfx: 'moth', onAct(e, g) { const n = e.phase ? 6 : 4; for (let i = 0; i < n; i++) { const a = -Math.PI / 2 + (i - (n - 1) / 2) * 0.5; g.spawn(P({ x: e.cx, y: e.cy, vx: Math.cos(a) * 120, vy: Math.sin(a) * 120, w: 9, h: 9, dmg: 10, kind: 'moth', color: '#f0e0a0', life: 5, homing: 1.4, solid: false })); } } },
      // depois de largar o pó fica exausta e pousa para descansar (ponto fraco)
      dust: { wind: 0.6, act: 0.3, rec: 0.5, tell: null, sfx: 'moth', onAct(e, g) { const p = g.player; for (let i = -1; i <= 1; i++) g.spawn(P({ x: p.cx + i * 60, y: e.cy, vx: 0, vy: 60, w: 34, h: 34, dmg: 6, kind: 'incense', color: '#c8b880', life: 3.5, solid: false, persist: true, parryable: false, reflectable: false, light: false })); G.burst(e.cx, e.cy, 26, { color: 'rgba(230,215,170,0.55)', speed: 110, life: 1.1, size: 2.4 }); }, onEnd(e) { e.wantRest = true; } },
      // espiral de escamas: roda as asas e solta dois braços de escamas iridescentes que giram — passa entre eles
      gust: { wind: 0.55, act: 1.5, rec: 0.5, tell: null, sfx: 'moth', onAct(e) { e.spinA = Math.random() * U.TAU; e.spinT = 0; },
        during(e, g, dt) {
          e.vx *= 0.9; e.vy *= 0.9; e.spinA += (e.phase ? 2.9 : 2.3) * dt; e.spinT -= dt; if (e.spinT > 0) return; e.spinT = e.phase ? 0.075 : 0.095;
          const arms = e.phase ? 3 : 2;
          for (let i = 0; i < arms; i++) { const a = e.spinA + i * U.TAU / arms; g.spawn(P({ x: e.cx, y: e.cy, vx: Math.cos(a) * 115, vy: Math.sin(a) * 115, w: 8, h: 8, dmg: 9, kind: 'scale', hue: (e.t * 140 + i * 120) % 360, color: '#f0e0ff', life: 4.5, solid: false, reflectable: false, light: false })); }
          if (Math.random() < 0.3) A.sfx('chime', { vol: 0.15 });
        } },
    },
    think(e, dt, g) {
      const p = g.player, t = e.anim, fl = e.arena.floor;
      if (e.resting > 0) {
        e.resting -= dt; e.vx = 0; e.vy = 0; e.y = fl - e.h;
        if (Math.random() < 0.08) G.emit({ x: e.cx + U.rand(-20, 20), y: e.cy - 10, vy: -12, life: 1.6, size: 1, color: '#e0d0a0' });
        if (e.resting <= 0) { e.resting = 0; e.cool = 0.25; e.vy = -220; A.sfx('wind'); }
        return;
      }
      if (e.atk) { if (e.atk.phase === 'wind') { e.vx *= 0.92; e.vy *= 0.92; } return; }
      e.face();
      if (e.wantRest) {
        e.fly(e.cx, fl - e.h / 2 + 5, 240, dt, 0.12);
        if (e.bottom >= fl - 3) { e.wantRest = false; e.resting = e.phase ? 2.4 : 3.0; e.restHits = 0; e.y = fl - e.h; A.sfx('land'); G.burst(e.cx, fl - 2, 14, { color: 'rgba(200,190,160,0.5)', speed: 80, life: 0.6, size: 2 }); if (!e.restHint) { e.restHint = true; VS.UI.toast(VS.t('tip_mariposa_rest'), 5); } }
        return;
      }
      e.fly(p.cx + Math.sin(t * 0.8) * 140, p.cy - 110 + Math.sin(t * 1.7) * 30, 160, dt, 0.05);
      if (e.cool <= 0) { const r = Math.random(); e.attack(r < 0.35 ? 'dive' : r < 0.6 ? 'swarm' : r < 0.82 ? 'dust' : 'gust'); }
    },
    // pousada: dano maior; três golpes (ou um pesado) deixam-na atordoada no chão
    damageMult(e, hb) {
      if (!(e.resting > 0)) return 1;
      e.restHits = (e.restHits || 0) + (hb.kind === 'heavy' ? 3 : 1);
      if (e.restHits >= 3 && !(e.stagger > 0)) { e.stagger = 1.4; e.resting = Math.max(e.resting, 1.5); A.sfx('stagger'); }
      return 1.8;
    },
    animState(e) {
      if (e.resting > 0) { if (e.stagger > 0) return { anim: 'stagger' }; const L = e.phase ? 2.4 : 3.0, k = L - e.resting; return k < 0.4 ? { anim: 'land', idx: Math.min(3.9, k / 0.4 * 4) } : { anim: 'rest' }; }
      return null;
    },
    eyeLight: { r: 18, i: 0.4, color: '#ffe8a0' },
    light(e) { const L = e._f && VS.EnemyRender.point(e, e._f, 'light'); G.light(L ? L.x : e.cx, L ? L.y : e.cy, 90, '#f0e0a0', 0.55, 1); },
  });

  // ======================================================================
  // O SINEIRO — subchefe da Torre
  // ======================================================================
  const bellAt = (e) => (VS.EnemyRender.point(e, e._f, 'bell') || { x: e.cx + e.facing * 30, y: e.bottom - 16 });
  Bosses.def('sineiro', {
    cfg: { w: 34, h: 58, hp: 480, music: 'sb_sineiro', heavy: true, phases: [0.5] },
    attacks: {
      // balanço do sino (branco): a caixa de dano segue o sino desenhado; aparar devolve-lho à cabeça
      swing: { wind: 0.7, act: 0.4, rec: 0.6, dmg: 24, tell: 'white', sfx: 'swing_heavy', during(e, g) { const b = bellAt(e); e.attackHBs.push({ x: b.x - 15, y: b.y - 15, w: 30, h: 30, dmg: 24, id: e.atk.id, src: e }); if (!e.atk.thud && e.atk.t > 0.24) { e.atk.thud = true; G.addShake(0.3); VS.FX.impact(b.x, e.bottom - 2, 'metal', e.facing, 1.2); A.sfx('bell_small'); } } },
      ring: { wind: 0.9, act: 0.1, rec: 0.7, tell: null, sfx: 'bell', onAct(e, g) { G.addShake(0.4); const m = VS.EnemyRender.point(e, e._f, 'mouth') || { x: e.cx + e.facing * 36 }; VS.FX.impact(m.x, e.bottom - 2, 'metal', e.facing, 1.5); for (const s of [-1, 1]) for (const h of [0, 1]) g.spawn(P({ x: m.x, y: e.bottom - (h ? 46 : 14), vx: s * (h ? 150 : 210), vy: 0, w: 12, h: 26, dmg: 14, kind: 'wave', color: '#ffe0a0', life: 3, solid: true, reflectable: false })); } },
      stomp: { wind: 0.6, act: 0.1, rec: 0.6, tell: null, sfx: 'crush', onAct(e, g) { G.addShake(0.5); VS.FX.impact(e.cx + e.facing * 14, e.bottom - 2, 'stone', e.facing, 1.2); const n = e.phase ? 7 : 4; for (let i = 0; i < n; i++) { const x = U.rand(60, g.room.pw - 60); e.debris.push({ x, t: 0.8 + i * 0.15 }); } } },
      charge: { wind: 0.6, act: 0.6, rec: 0.6, dmg: 20, tell: 'red', lunge: 300, sfx: 'roar', hb: (e) => front(e, 0, 0, 34, 58) },
    },
    init(e) { e.debris = []; },
    think(e, dt, g) {
      // destroços a cair
      for (let i = e.debris.length - 1; i >= 0; i--) { const d = e.debris[i]; d.t -= dt; if (d.t <= 0) { e.debris.splice(i, 1); g.spawn(P({ x: d.x, y: 30, vx: 0, vy: 200, g: 900, w: 14, h: 14, dmg: 16, kind: 'clod', life: 3, parryable: false, reflectable: false, light: false })); } }
      if (e.atk) return;
      e.face(); const d = Math.abs(e.dx());
      if (e.cool > 0) { e.walk(d > 70 ? e.facing : 0, 45, dt); return; }
      const r = Math.random();
      if (d < 90) e.attack(r < 0.6 ? 'swing' : 'stomp');
      else e.attack(r < 0.35 ? 'ring' : r < 0.65 ? 'charge' : r < 0.8 ? 'stomp' : 'swing');
    },
    // fraqueza: aparar o balanço — o sino bate-lhe na cabeça e o toque atordoa-o (muito mais tempo)
    onParried(e, g) {
      const a = e.atk;
      if (a && a.name === 'swing') {
        e.doStagger(2.3, g, true); e.vx = -e.facing * 60;
        A.sfx('bell'); A.sfx('choir_hit', { vol: 0.5 }); G.addShake(0.5); G.flash('#fff0c0', 0.25);
        const b = bellAt(e); VS.FX.flare(b.x, b.y, 34, [255, 230, 160], 0.25);
        VS.UI.toast(VS.t(e.parryHint ? 'tip_sineiro_dazed' : 'tip_sineiro_parry'), 4); e.parryHint = true;
        return;
      }
      e.doStagger(0.7, g, true); e.vx = -e.facing * 80;
    },
    damageMult(e) { return e.stagger > 0 && e.parried ? 1.3 : 1; },
    // sombras de aviso dos destroços
    drawBehind(ctx, e) { (e.debris || []).forEach((d) => { ctx.fillStyle = `rgba(0,0,0,${Math.max(0, 0.5 - d.t * 0.3)})`; ctx.beginPath(); ctx.ellipse(d.x, e.arena.floor - 1, 9, 2.5, 0, 0, U.TAU); ctx.fill(); }); },
    eyeLight: { r: 16, i: 0.45, color: '#ffd080' },
    smearCol: [255, 220, 150],
    light(e) { const b = e._f && VS.EnemyRender.point(e, e._f, 'bell'); G.light(b ? b.x : e.cx, b ? b.y : e.y, 70, '#ffe0a0', 0.5); },
  });

  // ======================================================================
  // INQUISIDORA VAEL — subchefe da Catedral
  // ======================================================================
  Bosses.def('vael', {
    cfg: { w: 28, h: 62, hp: 560, music: 'sb_vael', phases: [0.5], heavy: true },
    attacks: {
      flail: { wind: 0.45, act: 0.16, rec: 0.3, dmg: 18, tell: 'white', sfx: 'whip', hb: (e) => front(e, 0, 6, 56, 28), cool: 0.2, onEnd(e) { if (e.phase && Math.random() < 0.6) e.attack('flail2'); } },
      flail2: { wind: 0.3, act: 0.16, rec: 0.2, dmg: 18, tell: 'white', sfx: 'whip', hb: (e) => front(e, -10, 0, 66, 22), onEnd(e) { e.attack('stuck'); } },
      // ponto fraco: a bola crava-se no chão depois da varrida baixa e ela tem de a arrancar (fica exposta)
      stuck: { wind: 0.05, act: 1.5, rec: 0.35, tell: null, sfx: 'crush', onAct(e, g) { G.addShake(0.25); VS.FX.impact(e.cx + e.facing * 34, e.bottom - 2, 'stone', e.facing, 1.2); if (!e.stuckHint) { e.stuckHint = true; VS.UI.toast(VS.t('tip_vael_stuck'), 5); } },
        during(e, g) { if (Math.random() < 0.08) G.burst(e.cx + e.facing * 34, e.bottom - 2, 2, { color: 'rgba(170,150,130,0.6)', speed: 60, life: 0.5, size: 1.6, g: 300 }); },
        onEnd(e, g) { A.sfx('break'); G.burst(e.cx + e.facing * 34, e.bottom - 4, 10, { color: '#8a8078', speed: 140, life: 0.6, size: 2, g: 500, kind: 'flake' }); } },
      // AUTO-DA-FÉ: acende dois muros de fogo baixos de cada lado da protagonista que se fecham um contra o outro;
      // quando se tocam, rebentam. Salta por cima de um deles antes que se fechem (ou atravessa-o com a esquiva).
      pillars: { wind: 0.5, act: 1.75, rec: 0.5, tell: null, sfx: 'charge',
        onAct(e, g) { const p = g.player, x0 = e.arena.x0 + 14, x1 = e.arena.x1 - 14; const c = U.clamp(p.cx, x0 + 60, x1 - 60); e.pyre = { l: Math.max(x0, c - 120), r: Math.min(x1, c + 120), c: 0, boom: 0 }; },
        during(e, g, dt) {
          const a = e.atk, P2 = e.pyre; if (!P2) return;
          if (a.t < 0.45) { e.colXs = [P2.l, P2.r]; e.colWarnCol = '#ff6020'; return; }
          e.colXs = null;
          if (!P2.lit) { P2.lit = true; A.sfx('fire'); }
          const mid = (P2.l + P2.r) / 2, sp = e.phase ? 150 : 125;
          if (P2.r - P2.l > 6) { P2.l = Math.min(mid, P2.l + sp * dt); P2.r = Math.max(mid, P2.r - sp * dt); }
          else if (!P2.boom) { P2.boom = 1; G.addShake(0.45); A.sfx('explode', { vol: 0.6 }); VS.FX.flare(mid, e.arena.floor - 20, 60, [255, 120, 40], 0.45); G.burst(mid, e.arena.floor - 10, 30, { color: '#ff8030', speed: 220, life: 0.6, size: 2.4, add: true }); }
          if (P2.boom) { P2.boom += dt; if (P2.boom < 0.3) e.attackHBs.push({ x: mid - 34, y: e.arena.floor - 60, w: 68, h: 60, dmg: 22, id: a.id * 10 + 3, unblockable: true, parryable: false, src: { cx: mid } }); return; }
          for (const [x, k] of [[P2.l, 1], [P2.r, 2]]) {
            e.attackHBs.push({ x: x - 8, y: e.arena.floor - 30, w: 16, h: 30, dmg: 18, id: a.id * 10 + k, unblockable: true, parryable: false, src: { cx: x } });
            if (Math.random() < 0.7) G.emit({ x: x + U.rand(-6, 6), y: e.arena.floor - U.rand(2, 20), vx: U.rand(-20, 20), vy: U.rand(-120, -50), life: 0.5, size: U.rand(1.4, 3), color: U.pick(['#ffb040', '#ff5010', '#ffe0a0']), add: true, shrink: true, layer: 2 });
          }
        },
        onEnd(e) { e.pyre = null; e.colXs = null; } },
      smoke: { wind: 0.4, act: 0.5, rec: 0.3, tell: null, sfx: 'wind', onAct(e, g) { G.burst(e.cx, e.cy, 30, { color: 'rgba(170,150,190,0.5)', speed: 120, life: 1, size: 6 }); const p = g.player; e.x = U.clamp(p.cx - p.facing * 70 - e.w / 2, 40, g.room.pw - 40 - e.w); G.burst(e.cx, e.cy, 30, { color: 'rgba(170,150,190,0.5)', speed: 120, life: 1, size: 6 }); e.face(); }, onEnd(e) { e.attack('flail'); } },
      censer: { wind: 0.6, act: 0.1, rec: 0.6, tell: null, sfx: 'swing', onAct(e, g) { for (let i = 0; i < 3; i++) g.spawn(P({ x: e.cx, y: e.cy - 10, vx: e.facing * (120 + i * 70), vy: -260, g: 700, w: 10, h: 10, dmg: 14, kind: 'fire', color: '#ff7020', life: 3, reflectable: false, onHitWall(g2) { g2.spawn(P({ x: this.cx, y: this.cy - 6, w: 26, h: 10, dmg: 8, kind: 'fire', color: '#ff6010', life: 1.6, solid: false, parryable: false, reflectable: false, persist: true })); } })); } },
    },
    think(e, dt, g) {
      if (e.atk) return;
      e.face(); const d = Math.abs(e.dx());
      if (e.cool > 0) { e.walk(d > 90 ? e.facing : d < 40 ? -e.facing : 0, 80, dt); return; }
      const r = Math.random();
      if (d < 70) e.attack(r < 0.38 ? 'flail2' : r < 0.75 ? 'flail' : 'smoke');
      else if (d < 200) e.attack(r < 0.3 ? 'pillars' : r < 0.55 ? 'censer' : r < 0.75 ? 'flail2' : 'smoke');
      else e.attack(r < 0.5 ? 'pillars' : 'smoke');
    },
    damageMult(e) { const a = e.atk; return a && a.name === 'stuck' && a.phase !== 'wind' ? 1.8 : 1; },
    // os muros do auto-da-fé (chama baixa e densa)
    drawOver(ctx, e) {
      const P2 = e.pyre, a = e.atk; if (!P2 || !a || a.name !== 'pillars' || a.t < 0.45 || P2.boom) return;
      const fl = e.arena.floor, t = e.t || 0;
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (const x of [P2.l, P2.r]) {
        VS.Sprites.glow(ctx, x, fl - 14, 34, '#ff5010', 0.55);
        for (let i = 0; i < 5; i++) { const ph = t * 16 + i * 1.7 + x * 0.05, h = 22 + 12 * Math.abs(Math.sin(ph)), ox = x + (i - 2) * 3.2;
          ctx.fillStyle = i === 2 ? 'rgba(255,240,200,0.9)' : `rgba(255,${110 + i * 20},40,0.6)`;
          ctx.beginPath(); ctx.moveTo(ox - 4.5, fl); ctx.quadraticCurveTo(ox - 3 + Math.sin(ph) * 2, fl - h * 0.6, ox + Math.sin(ph * 1.3) * 2.5, fl - h); ctx.quadraticCurveTo(ox + 3.5, fl - h * 0.5, ox + 4.5, fl); ctx.closePath(); ctx.fill(); }
      }
      ctx.restore();
    },
    light(e) { G.light(e.cx + e.facing * 16, e.cy, 90, '#ff8040', 0.7, 2); if (e.pyre && e.atk && e.atk.t > 0.45) for (const x of [e.pyre.l, e.pyre.r]) G.light(x, e.arena.floor - 14, 70, '#ff6020', 0.9, 2); },
  });

  // ======================================================================
  // OS GÉMEOS DA GUARDA — dois guardas coordenados (o Lâmina aparável, o Malho pesado)
  // ======================================================================
  Bosses.def('gemeo_a', {
    cfg: { w: 26, h: 60, hp: 360, music: 'sb_gemeos', heavy: true },
    attacks: {
      cut: { wind: 0.45, act: 0.12, rec: 0.15, dmg: 16, tell: 'white', hb: (e) => front(e, 4, 6, 52, 28), lunge: 140, cool: 0, onEnd(e) { if (Math.random() < 0.6 + (e.enraged ? 0.3 : 0)) e.attack('cut2'); } },
      cut2: { wind: 0.3, act: 0.12, rec: 0.5, dmg: 16, tell: 'white', hb: (e) => front(e, 4, 4, 52, 32), lunge: 140 },
      dash: { wind: 0.5, act: 0.25, rec: 0.6, dmg: 18, tell: 'white', hb: (e) => front(e, 0, 10, 48, 20), lunge: 420 },
    },
    think(e, dt, g) {
      if (e.atk) return;
      e.face(); const d = Math.abs(e.dx());
      const wait = e.partner && !e.partner.defeated && e.partner.atk && !e.enraged;
      if (e.cool > 0 || wait) { e.walk(d > 70 ? e.facing : d < 40 ? -e.facing : 0, 70, dt); return; }
      e.attack(d < 60 ? 'cut' : 'dash');
    },
  });
  // ponto fraco dos Gémeos: o malho não distingue irmãos — a Lâmina no caminho leva com a martelada
  function brotherHit(e, g, box, dmg, stag) {
    const o = e.partner;
    if (!o || o.defeated || o.dead || !U.overlap(box, o)) return;
    o.hp = Math.max(1, o.hp - dmg); o.flash = 0.2; o.lastHitT = 0; o.atk = null; o.attackHBs = [];
    o.doStagger(stag, g, true); o.vx = e.facing * 220;
    G.addShake(0.5); g.hitstop && g.hitstop(0.1); A.sfx('hit_metal'); VS.FX.sparks(o.cx, o.cy - 10, 18, e.facing, { speed: 300 });
    VS.UI.bark('boss_gemeos', 'gemeos_friendly');
  }
  Bosses.def('gemeo_b', {
    cfg: { w: 34, h: 66, hp: 420, music: 'sb_gemeos', heavy: true },
    attacks: {
      maul: { wind: 0.8, act: 0.15, rec: 0.8, dmg: 26, tell: 'red', sfx: 'swing_heavy', hb: (e) => front(e, 4, 0, 46, 40), armor: true,
        onWind(e) { if (!e.friendHint && e.partner && !e.partner.defeated) { e.friendHint = true; VS.UI.toast(VS.t('tip_gemeos_friendly'), 5); } },
        onAct(e, g) { G.addShake(0.4); A.sfx('crush'); brotherHit(e, g, front(e, 4, 0, 46, 40), 70, 2.4); VS.FX.impact(e.cx + e.facing * 40, e.bottom - 2, 'stone', e.facing, 1.3); } },
      // REMOINHO (vermelho): gira o malho pelo cabo e avança em rodopio — afasta-te ou atravessa-o com a esquiva
      sweep: { wind: 0.65, act: 1.25, rec: 0.75, tell: 'red', sfx: 'swing_heavy', armor: true,
        onAct(e) { e.whirlDir = e.facing; e.whirlN = -1; },
        during(e, g, dt) {
          const a = e.atk, n = Math.floor(a.t / 0.32);
          e.vx = e.whirlDir * (e.enraged ? 175 : 140); e.facing = (Math.floor(a.t / 0.16) % 2 ? -1 : 1) * e.whirlDir;
          const box = { x: e.cx - 44, y: e.bottom - 40, w: 88, h: 36 };
          e.attackHBs.push(Object.assign({ dmg: 16, id: a.id * 10 + n, unblockable: true, parryable: false, src: e }, box));
          if (n !== e.whirlN) { e.whirlN = n; A.sfx('swing_heavy', { vol: 0.6 }); brotherHit(e, g, box, 40, 1.6); }
          if (Math.random() < 0.6) G.emit({ x: e.cx + U.rand(-40, 40), y: e.bottom - 2, vx: U.rand(-60, 60), vy: U.rand(-60, -10), life: 0.4, size: U.rand(1.4, 2.6), color: 'rgba(120,100,90,0.5)' });
          if (e.wallAhead(e.whirlDir)) a.t = a.s.act;
        },
        onEnd(e) { e.facing = e.whirlDir; } },
    },
    think(e, dt, g) {
      if (e.atk) return;
      e.face(); const d = Math.abs(e.dx());
      const wait = e.partner && !e.partner.defeated && e.partner.atk && !e.enraged;
      if (e.cool > 0 || wait) { e.walk(d > 60 ? e.facing : 0, 40, dt); return; }
      e.attack(d < 130 && Math.random() < 0.45 ? 'sweep' : 'maul');
    },
    // remoinho: as fases do 'atk_sweep' em ciclo enquanto roda
    animState(e) { const a = e.atk; if (a && a.name === 'sweep' && a.phase === 'act') return { anim: 'atk_sweep', phase: 'act', k: (a.t / 0.16) % 1 }; return null; },
  });
  // grupo: barra de vida combinada; derrota quando ambos caem
  DEFS.gemeos = {
    spawn(d, game) {
      const a = new Boss('gemeo_a', Object.assign({}, d, { x: d.x - 3 }), game);
      const b = new Boss('gemeo_b', Object.assign({}, d, { x: d.x + 3 }), game);
      a.partner = b; b.partner = a;
      const group = { isGroup: true, nameKey: 'boss_gemeos', members: [a, b], music: 'sb_gemeos', bossId: 'gemeos',
        get hp() { return a.hp + b.hp; }, get maxHp() { return a.maxHp + b.maxHp; }, get dead() { return a.defeated && b.defeated; } };
      [a, b].forEach((m) => {
        m.nameKey = 'boss_gemeos'; m.group = group;
        const origDie = m.die.bind(m);
        m.die = function (g) {
          if (this.defeated) return;
          const other = this.partner;
          if (other.defeated) { origDie(g); }
          else { // primeiro a cair: não termina o combate
            this.defeated = true; this.defT = 0; this.atk = null; this.hittable = false; this.attackHBs = []; this.hp = 0;
            A.sfx('boss_die'); G.addShake(0.5); other.enraged = true; A.setIntensity(2); A.sfx('roar');
            this.updateDefeat = function (dt2, g2) { this.defT += dt2; this.vx *= 0.9; this.physics(dt2, g2); if (this.defT > 2) this.remove = true; };
          }
        };
        m.updateDefeat = (function (orig) { return function (dt2, g2) { if (this.partner.defeated && this.partner !== this && !this.finishedGroup) { /* último */ } return orig.call(this, dt2, g2); }; })(m.updateDefeat);
      });
      // o último a cair dá as recompensas do grupo
      b.bossId = 'gemeos'; a.bossId = 'gemeos';
      a.intro = true; b.intro = false; b.introDone = true; b.cutscene = false;
      const startA = a.updateIntro.bind(a);
      a.updateIntro = function (dt, g) { startA(dt, g); if (!this.intro) { g.boss = group; VS.UI.bossBar(group); } };
      b.update = (function (orig) { return function (dt, g) { if (a.intro) { this.attackHBs = []; this.physics(dt, g); return; } return orig.call(this, dt, g); }; })(b.update);
      game.spawn(a); game.spawn(b);
      a.facing = b.facing = game.player.cx < a.cx ? -1 : 1;
      return group;
    },
  };
  VS.SpritesBossAlias = { gemeos: 'gemeo' };
})(window.VS);
