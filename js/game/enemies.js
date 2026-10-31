// Vesperal — inimigos: base com ataques por fases, postura, guarda, parry; 22 tipos com IA própria
'use strict';
(function (VS) {
  // o brilho branco de parry acende-se TELL_LEAD s antes do golpe e apaga-se no impacto
  const TELL_LEAD = 0.42;
  const U = VS.U, T = U.TILE, G = VS.Gfx, A = VS.Audio;
  const KINDS = {};
  const MAT_SFX = { armor: 'hit_metal', stone: 'hit_stone', spirit: 'hit_spirit', glass: 'hit_glass', molten: 'hit_metal', wax: 'hit_soft', wood: 'hit_wood', plant: 'hit_soft', water: 'splash' };

  class Enemy extends VS.Entity {
    constructor(kind, d) {
      const K = KINDS[kind], c = K.cfg, size = d.size || K.size || 1;
      const w = Math.round(c.w * size), h = Math.round(c.h * size);
      super(d.x * T + T / 2 - w / 2, (d.y + 1) * T - h, w, h);
      this.kind = kind; this.K = K; this.c = c; this.d = d; this.size = size;
      this.hp = this.maxHp = c.hp; this.poise = this.poiseMax = c.poise || 20;
      this.isEnemy = true; this.hittable = true; this.team = 'enemy'; this.z = 5;
      this.facing = d.face || -1; this.mode = 'idle'; this.modeT = 0; this.atk = null; this.attackHBs = [];
      this.home = { x: this.x, y: this.y }; this.stagger = 0; this.lastHitT = 99; this.flying = !!c.flying;
      this.gravity = this.flying ? 0 : 1350; this.cool = U.rand(0.3, 1.2); this.aggro = false; this.anim = 0;
      this.contactDmg = c.contact || 0;
      this.nat = (VS.NATURE && (VS.NATURE[kind] || VS.NATURE[K.base])) || {};
      if (K.init) K.init(this, d);
    }
    // material do corpo (efeitos e sons dos golpes)
    get material() { return this.nat.mat || (this.nat.spectral ? 'spirit' : 'flesh'); }
    get player() { return this.game.player; }
    // ---------- utilidades de IA ----------
    dx() { return (this.player.cx - this.cx) / this.size; }
    dy() { return (this.player.cy - this.cy) / this.size; }
    face() { const d = this.dx(); if (Math.abs(d) > 2) this.facing = d > 0 ? 1 : -1; }
    sees(range, vert) {
      const p = this.player; if (p.action && p.action.type === 'dead') return false;
      if (Math.abs(this.dx()) > range || Math.abs(this.dy()) > (vert || 90)) return false;
      return VS.World.lineClear(this.game.room, this.cx, this.cy - 6, p.cx, p.cy - 6);
    }
    ledgeAhead(dir) {
      const room = this.game.room, fx = dir > 0 ? this.x + this.w + 2 : this.x - 2, fy = this.bottom + 4;
      const tx = Math.floor(fx / T), ty = Math.floor(fy / T);
      return !(room.isSolidTile(tx, ty) || room.isPlatform(tx, ty)) || room.isHazard(tx, ty) || room.isHazard(tx, ty - 1);
    }
    wallAhead(dir) { return VS.World.rectSolid(this.game.room, { x: this.x + dir * 3, y: this.y + 2, w: this.w, h: this.h - 6 }); }
    walk(dir, speed, dt) {
      if (dir === 0) { this.vx = U.approach(this.vx, 0, 900 * dt); return; }
      if ((this.onGround && this.ledgeAhead(dir) && !this.c.fearless) || this.wallAhead(dir)) { this.vx = 0; return false; }
      this.vx = U.approach(this.vx, dir * speed * (this.K.speedMult || 1), 1100 * dt); return true;
    }
    fly(tx, ty, speed, dt, k) {
      const a = Math.atan2(ty - this.cy, tx - this.cx), d = Math.hypot(tx - this.cx, ty - this.cy);
      const sp = Math.min(speed, d * 3);
      this.vx = U.lerp(this.vx, Math.cos(a) * sp, k || 0.06); this.vy = U.lerp(this.vy, Math.sin(a) * sp, k || 0.06);
    }
    // ---------- ataques ----------
    attack(name) {
      const s = this.K.attacks[name];
      this.atk = { name, s, t: 0, phase: 'wind', id: VS.Entity.newAttackId(), hitDone: false };
      this.face();
      // o "tlim" do parry toca quando o brilho aparece (pouco antes do golpe), não no início da antecipação
      if (s.tell === 'white' && s.wind <= TELL_LEAD) { A.sfx('parry_tell', { vol: 0.7 }); this.atk.tellSnd = true; }
      if (s.tell === 'red') A.sfx('danger_tell', { vol: 0.7 });
      if (s.onWind) s.onWind(this, this.game);
    }
    updateAttack(dt) {
      const a = this.atk; if (!a) return;
      const s = a.s; a.t += dt;
      if (a.phase === 'wind' && s.tell === 'white' && !a.tellSnd && s.wind - a.t <= TELL_LEAD) { a.tellSnd = true; A.sfx('parry_tell', { vol: 0.7 }); }
      if (a.phase === 'wind' && a.t >= s.wind) { a.phase = 'act'; a.t = 0; if (s.sfx !== false) A.sfx(s.sfx || 'swing', { vol: 0.7 }); if (s.onAct) s.onAct(this, this.game); }
      if (a.phase === 'act') {
        if (s.lunge !== undefined) this.vx = this.facing * s.lunge * Math.sqrt(this.size);
        if (s.hb) {
          const r = s.hb(this);
          if (r) this.attackHBs.push(Object.assign(r, { dmg: Math.round(s.dmg * (this.K.dmgMult || 1) * (this.dmgScale || 1)), id: a.id, parryable: s.parryable !== false && s.tell !== 'red', unblockable: s.tell === 'red', src: this }));
        }
        if (s.during) s.during(this, this.game, dt);
        if (a.t >= s.act) { a.phase = 'rec'; a.t = 0; }
      } else if (a.phase === 'rec') {
        if (s.lunge !== undefined) this.vx = U.approach(this.vx, 0, 1200 * dt);
        if (a.t >= s.rec) { this.atk = null; this.cool = s.cool !== undefined ? s.cool : U.rand(0.6, 1.4); if (s.onEnd) s.onEnd(this, this.game); }
      } else if (a.phase === 'wind') {
        this.vx = s.windMove !== undefined ? this.facing * s.windMove : U.approach(this.vx, 0, 900 * dt);
        if (s.windTick) s.windTick(this, this.game, dt);
      }
    }
    tellState() { const a = this.atk; if (!a || a.phase !== 'wind') return null; return a.s.tell ? { kind: a.s.tell, k: a.t / a.s.wind, left: a.s.wind - a.t } : null; }
    // ---------- ciclo ----------
    update(dt, game) {
      this.game = game;
      super.update(dt, game);
      this.attackHBs = [];
      this.anim += dt; this.lastHitT += dt;
      if (this.dead) { this.deadT += dt; this.vx *= 0.9; if (!this.flying) this.physics(dt, game); if (this.deadT > 0.7) this.remove = true; if (this.deadT > 0.3) VS.FX.dissolve(this, this.c.ashCol); return; }
      if (this.lastHitT > 2) this.poise = Math.min(this.poiseMax, this.poise + dt * this.poiseMax * 0.5);
      if (this.stagger > 0) {
        this.stagger -= dt; this.vx = U.approach(this.vx, 0, 600 * dt);
        if (this.flying) { this.vy = U.approach(this.vy, 0, 400 * dt); this.x += this.vx * dt; this.y += this.vy * dt; } else this.physics(dt, game);
        return;
      }
      this.cool -= dt;
      this.K.think(this, dt, game);
      this.updateAttack(dt);
      if (this.flying) { this.x += this.vx * dt; this.y += this.vy * dt; this.keepInRoom(game); }
      else this.physics(dt, game);
      if (!this.flying && this.bottom > game.room.ph + 40) { this.hp = 0; this.die(game, true); }
    }
    keepInRoom(game) {
      const room = game.room;
      if (VS.World.rectSolid(room, this)) { this.x -= this.vx * (1 / 60); this.y -= this.vy * (1 / 60); this.vx *= -0.5; this.vy *= -0.5; }
      this.x = U.clamp(this.x, 0, room.pw - this.w); this.y = U.clamp(this.y, 0, room.ph - this.h);
    }
    // ---------- dano ----------
    onHit(hb, game) {
      if (this.K.invulnerable && this.K.invulnerable(this)) { A.sfx('shield', { vol: 0.6 }); return 'blocked'; }
      const fromFront = (game.player.cx - this.cx) * this.facing > 0;
      if (this.guarding && fromFront && !hb.guardBreak && hb.kind !== 'heavy' && hb.kind !== 'spell' && hb.kind !== 'riposte' && this.stagger <= 0 && !this.atk) {
        A.sfx('shield'); VS.FX.block(this.cx + this.facing * 8, this.cy - 4, game.player.dir);
        game.player.vx = -game.player.dir * 170; this.guardHits = (this.guardHits || 0) + 1;
        if (this.guardHits >= 4) { this.guardHits = 0; this.attackSoon = true; }
        return 'blocked';
      }
      let dmg = hb.dmg;
      if (hb.weapon && VS.weaponVs) dmg = Math.round(dmg * VS.weaponVs(hb.weapon, this));
      if (hb.spirit && hb.kind === 'spell' && this.nat.spectral) dmg = Math.round(dmg * 1.5);
      if (this.stagger > 0 && this.parried) dmg = Math.round(dmg * 1.5);
      if (this.K.damageMult) dmg = Math.round(dmg * this.K.damageMult(this, hb));
      this.hp -= dmg; this.flash = 0.16; this.lastHitT = 0;
      this.aggro = true;
      const heavy = hb.kind === 'heavy' || hb.kind === 'riposte';
      const mat = this.material;
      A.sfx(heavy ? 'hit_heavy' : 'hit'); A.sfx(MAT_SFX[mat] || 'enemy_hurt', { vol: 0.5 });
      if (hb.mat === 'blunt') A.sfx('hit_blunt', { vol: 0.7 });
      const blunt = hb.mat === 'blunt';
      game.hitstop((hb.hitstop || (heavy ? 0.085 : 0.05)) + (blunt ? 0.02 : 0));
      G.addShake((heavy ? 0.24 : 0.1) * (blunt ? 1.6 : 1) * (this.isBoss ? 1.15 : 1));
      const kx = hb.kx || Math.sign(this.cx - game.player.cx) || 1;
      // ponto de contacto: entre a ponta da arma e o centro do alvo
      const hx = hb.tipX !== undefined ? U.clamp(hb.tipX, this.x + 2, this.x + this.w - 2) : this.cx - kx * 4;
      const hy = hb.tipY !== undefined ? U.clamp(hb.tipY, this.y + 3, this.y + this.h - 3) : this.cy - 2;
      VS.FX.hit({ x: hx, y: hy, mat, wmat: hb.mat === 'blunt' ? 'blunt' : hb.mat === 'spirit' ? 'spirit' : 'blade', mark: hb.mark, ang: hb.cutA !== undefined ? hb.cutA : (kx > 0 ? 0 : Math.PI), bend: hb.cutBend, dir: kx, power: heavy ? 1.5 : 1, heavy });
      if (this.hp <= 0) { this.die(game); return true; }
      this.poise -= hb.poise || 10;
      const armor = this.atk && this.atk.s.armor && this.atk.phase !== 'rec';
      if (!this.c.heavy || heavy) { if (!armor) { this.vx = kx * (hb.knock || 150) * (this.c.heavy ? 0.4 : 1); if (hb.ky < 0 && !this.flying) this.vy = -150; if (this.flying) this.vy = (hb.ky || 0) * 120; } }
      if (this.poise <= 0 && !armor) { this.poise = this.poiseMax; this.doStagger(0.55, game); }
      else if (!armor && !this.c.heavy && this.atk && this.atk.phase === 'wind' && hb.kind !== 'spell') { this.atk = null; this.cool = 0.4; }
      if (this.K.onHurt) this.K.onHurt(this, game, hb);
      return true;
    }
    doStagger(t, game, parried) {
      this.stagger = t; this.atk = null; this.parried = !!parried;
      if (parried) { A.sfx('stagger'); VS.FX.stun(this); }
    }
    onParried(game) { if (this.K.onParried) { this.K.onParried(this, game); return; } this.doStagger(this.c.heavy ? 1.0 : 1.3, game, true); this.vx = this.facing * -120; }
    die(game, silent) {
      if (this.dead) return;
      this.dead = true; this.deadT = 0; this.atk = null; this.hittable = false; this.contactDmg = 0;
      if (!silent) { A.sfx('enemy_die'); G.addShake(0.15); }
      const st = VS.state;
      st.bestiary[this.kind] = (st.bestiary[this.kind] || 0) + 1;
      const total = Math.round((this.c.ash || 10) * st.fx('ashGain', 1));
      const n = Math.min(6, Math.max(1, Math.ceil(total / 8)));
      if (!silent) for (let i = 0; i < n; i++) game.spawn(new VS.Obj.AshOrb(this.cx, this.cy, Math.round(total / n)));
      if (this.K.onDeath) this.K.onDeath(this, game);
    }
    hurtbox() { return this.K.hurtbox ? this.K.hurtbox(this) : { x: this.x, y: this.y, w: this.w, h: this.h }; }
    emitLight() { if (this.K.light && !this.dead) this.K.light(this); else if (this.K.eyeLight && VS.EnemyRender) VS.EnemyRender.light(this); }
    draw(ctx, game) {
      if (this.hidden) { if (this.K.drawHidden) this.K.drawHidden(ctx, this, game); return; }
      ctx.save();
      const sheet = VS.EnemyRender && VS.EnemyRender.has(this);
      // com folha de sprites: o corpo cai (animação de morte) e só depois se desfaz em cinza
      if (this.dead) ctx.globalAlpha = sheet ? U.clamp(1 - (this.deadT - 0.42) / 0.28, 0, 1) : Math.max(0, 1 - this.deadT / 0.7);
      // a folha nova manda; o desenho antigo só serve quando não existe folha para este tipo
      const hasSheet = VS.SPRITE_META && VS.SPRITE_META['en_' + ((this.K && this.K.sheet) || this.kind)];
      if (!(sheet && VS.EnemyRender.draw(ctx, this)) && !hasSheet && VS.SpritesEnemy[this.kind]) VS.SpritesEnemy[this.kind](ctx, this, game);
      else if (sheet) VS.EnemyRender.smear(ctx, this, this.K.smearCol);
      ctx.restore();
      // sinais de ataque
      const tell = this.tellState();
      if (tell && VS.settings.telegraphs !== false) (sheet ? VS.EnemyRender.tell : VS.SpritesEnemy.tell)(ctx, this, tell);
      if (this.flash > 0) { /* o flash é aplicado por cada sprite via e.flash */ }
    }
  }

  // ---------- ajudantes de hitbox ----------
  const front = (e, dx, dy, w, h) => { const s = e.size || 1; dx *= s; dy *= s; w *= s; h *= s; return { x: e.facing > 0 ? e.cx + dx : e.cx - dx - w, y: e.bottom - dy - h, w, h }; };

  // ===================== TIPOS =====================
  // --- R1: Cinzento (husk) ---
  KINDS.husk = {
    cfg: { w: 14, h: 30, hp: 32, poise: 14, ash: 12 },
    eyeLight: { r: 24, i: 0.5 },
    attacks: {
      swing: { wind: 0.5, act: 0.14, rec: 0.6, dmg: 13, hb: (e) => front(e, 2, 6, 26, 26), lunge: 70, tell: null },
      lunge: { wind: 0.65, act: 0.18, rec: 0.7, dmg: 16, hb: (e) => front(e, 0, 4, 28, 22), lunge: 200, tell: 'white' },
    },
    think(e, dt, g) {
      if (e.atk) return;
      if (e.sees(170)) e.aggro = true;
      if (e.aggro && Math.abs(e.dy()) < 100) {
        e.face();
        const d = Math.abs(e.dx());
        if (d < 34 && e.cool <= 0) e.attack(U.chance(0.3) ? 'lunge' : 'swing');
        else if (d > 26) e.walk(e.facing, 48, dt); else e.walk(0, 0, dt);
        if (Math.abs(e.dx()) > 320) e.aggro = false;
      } else { // vaguear
        e.modeT -= dt; if (e.modeT <= 0) { e.modeT = U.rand(1.5, 3.5); e.wander = U.pick([-1, 0, 1]); if (e.wander) e.facing = e.wander; }
        if (!e.walk(e.wander || 0, 22, dt)) e.wander = -(e.wander || 1);
      }
    },
  };
  // --- R1: Rastejante (crawler) — avança aos solavancos, morde de perto e salta à garganta (salto aparável) ---
  KINDS.crawler = {
    cfg: { w: 20, h: 11, hp: 18, poise: 6, ash: 8, contact: 9 },
    eyeLight: { r: 20, i: 0.45 },
    attacks: {
      pounce: { wind: 0.45, act: 0.3, rec: 0.55, dmg: 11, hb: (e) => front(e, -6, 0, 22, 12), lunge: 240, tell: 'white', sfx: 'whip' },
      bite: { wind: 0.22, act: 0.1, rec: 0.38, dmg: 8, hb: (e) => front(e, 4, 0, 15, 10), lunge: 50, tell: null, sfx: 'whip', onEnd(e) { e.vx = -e.facing * 110; e.surging = false; e.surgeT = 0.35; } },
    },
    init(e) { e.surgeT = U.rand(0, 0.4); e.surging = false; },
    think(e, dt, g) {
      if (e.atk) return;
      if (e.sees(200, 60)) e.aggro = true;
      e.surgeT -= dt;
      if (e.surgeT <= 0) { e.surging = !e.surging; e.surgeT = e.surging ? U.rand(0.28, 0.42) : U.rand(0.14, 0.3); if (e.surging && e.aggro && Math.random() < 0.5) A.sfx('step_soft', { vol: 0.25 }); }
      if (e.aggro) {
        e.face(); const d = Math.abs(e.dx());
        if (e.cool <= 0 && e.onGround) { if (d < 26) { e.attack('bite'); return; } if (d > 44 && d < 92 && Math.abs(e.dy()) < 30) { e.attack('pounce'); return; } }
        e.walk(d < 22 ? 0 : e.facing, e.surging ? 118 : 10, dt);
        if (d > 320) e.aggro = false;
      } else if (!e.walk(e.facing, e.surging ? 46 : 0, dt)) e.facing *= -1;
    },
  };
  // --- R1: Fátuo (wisp) — paira à distância e cospe cera a arder; quando se sente seguro, mergulha (aparável) ---
  KINDS.wisp = {
    cfg: { w: 12, h: 12, hp: 14, poise: 4, ash: 10, flying: true, ashCol: '#ffb040' },
    sheetAnchor: 'center',
    attacks: {
      spit: { wind: 0.6, act: 0.05, rec: 0.6, tell: null, sfx: 'shoot', onAct(e, g) { const p = e.player; const a = Math.atan2(p.cy - e.cy, p.cx - e.cx); g.spawn(new VS.Projectile({ x: e.cx + e.facing * 2, y: e.cy + 2, vx: Math.cos(a) * 150, vy: Math.sin(a) * 150, w: 9, h: 9, dmg: 12, kind: 'orb', color: '#ff9040', life: 4, trail: true })); } },
      dive: { wind: 0.5, act: 0.42, rec: 0.5, dmg: 13, tell: 'white', sfx: 'fire', hb: (e) => ({ x: e.x - 2, y: e.y - 2, w: e.w + 4, h: e.h + 4 }),
        onAct(e) { const p = e.player; const a = Math.atan2(p.cy - e.cy, p.cx - e.cx); e.vx = Math.cos(a) * 260; e.vy = Math.sin(a) * 260; },
        during(e, g, dt) { if (Math.random() < 0.6) G.emit({ x: e.cx, y: e.cy, vx: -e.vx * 0.1, vy: 20, g: 300, life: 0.6, size: 1.2, color: '#e8d8b0' }); },
        onEnd(e) { e.vx *= 0.3; e.vy *= 0.3; } },
    },
    think(e, dt, g) {
      const t = e.anim;
      if (e.sees(230, 160)) e.aggro = true;
      if (e.atk) { if (e.atk.name !== 'dive' || e.atk.phase === 'rec') { e.vx *= 0.92; e.vy *= 0.92; } return; }
      if (e.aggro) {
        const p = e.player; const side = p.cx > e.cx ? -1 : 1;
        const d = Math.hypot(p.cx - e.cx, p.cy - e.cy);
        e.fly(p.cx + side * 90, p.cy - 60 + Math.sin(t * 2) * 20, 80, dt);
        if (e.cool <= 0) e.attack(d < 120 && Math.random() < 0.45 ? 'dive' : 'spit');
        e.face();
      } else e.fly(e.home.x + Math.sin(t * 0.7) * 30, e.home.y + Math.sin(t * 1.3) * 12, 40, dt);
    },
    light(e) { G.light(e.cx, e.cy - 9, 60, '#ff9040', 0.7, 2); },
  };
  // --- R1: Sacristão (sexton) — lanterna na corrente ---
  KINDS.sexton = {
    cfg: { w: 16, h: 34, hp: 60, poise: 26, ash: 30, heavy: true },
    attacks: {
      sweep: { wind: 0.55, act: 0.2, rec: 0.55, dmg: 16, hb: (e) => front(e, 0, 4, 46, 22), tell: 'white', sfx: 'swing_heavy' },
      slam: { wind: 0.8, act: 0.15, rec: 0.8, dmg: 22, hb: (e) => front(e, 8, 0, 34, 14), tell: 'red', armor: true, sfx: 'swing_heavy', onAct(e, g) { G.addShake(0.25); A.sfx('crush', { vol: 0.6 }); G.burst(e.cx + e.facing * 26, e.bottom, 12, { color: '#ffb060', speed: 120, angle: -Math.PI / 2, spread: 2, life: 0.4, size: 1.6, add: true }); } },
    },
    // mantém o intruso à distância do cabo: recua se ele se cola, varre a meia distância, esmaga quando o vê parado
    think(e, dt, g) {
      if (e.atk) return;
      if (e.sees(200)) e.aggro = true;
      if (e.aggro) {
        e.face(); const d = Math.abs(e.dx()), p = e.player;
        if (d < 22 && e.cool < 0.6) { e.walk(-e.facing, 55, dt); e.facing = Math.sign(e.dx()) || e.facing; return; }
        if (d < 54 && e.cool <= 0) e.attack(Math.abs(p.vx) < 20 && U.chance(0.55) ? 'slam' : 'sweep');
        else if (d > 40) e.walk(e.facing, 40, dt); else e.walk(0, 0, dt);
      }
    },
    light(e) { const p = VS.EnemyRender && VS.EnemyRender.point(e, e._f, 'light'); G.light(p ? p.x : e.cx + e.facing * 14, p ? p.y : e.cy, 80, '#ffb060', 0.8, 2); },
  };

  // --- R2: Sentinela (escudo e lança) ---
  KINDS.sentinel = {
    cfg: { w: 16, h: 32, hp: 50, poise: 30, ash: 22 },
    eyeLight: { r: 22, i: 0.45 },
    init(e) { e.guarding = true; },
    attacks: {
      thrust: { wind: 0.5, act: 0.14, rec: 0.55, dmg: 16, hb: (e) => front(e, 4, 12, 40, 8), lunge: 120, tell: 'white', onWind(e) { e.guarding = false; }, onEnd(e) { e.guarding = true; } },
      bash: { wind: 0.35, act: 0.12, rec: 0.5, dmg: 10, hb: (e) => front(e, 2, 6, 18, 24), lunge: 160, tell: null, sfx: 'shield', onWind(e) { e.guarding = true; } },
    },
    think(e, dt, g) {
      if (e.atk) return;
      e.guarding = true;
      if (e.sees(200)) e.aggro = true;
      if (e.aggro) {
        e.face(); const d = Math.abs(e.dx());
        if (e.attackSoon && d < 40) { e.attackSoon = false; e.attack('bash'); }
        else if (d < 52 && e.cool <= 0) e.attack('thrust');
        else if (d > 44) e.walk(e.facing, 38, dt); else e.walk(-e.facing, 20, dt);
      }
    },
  };
  // --- R2: Besteiro ---
  KINDS.crossbow = {
    cfg: { w: 14, h: 30, hp: 26, poise: 10, ash: 18 },
    eyeLight: { r: 22, i: 0.45 },
    // dispara do virote da besta (ponto 'tip' do fotograma), sempre à altura do peito do herói se este estiver perto do mesmo nível
    attacks: { shoot: { wind: 0.85, act: 0.05, rec: 0.9, tell: 'white', sfx: 'bolt', onAct(e, g) { const t = VS.EnemyRender && VS.EnemyRender.point(e, e._f, 'tip'); g.spawn(new VS.Projectile({ x: t ? t.x - 6 : e.cx + e.facing * 10, y: t ? t.y - 2 : e.y + 12, vx: e.facing * 330, vy: 0, w: 12, h: 4, dmg: 15, kind: 'bolt', color: '#c0b090', life: 3, light: false })); } } },
    think(e, dt, g) {
      if (e.atk) { e.aimY = e.y + 12; return; }
      if (e.sees(300, 60)) e.aggro = true;
      if (e.aggro) {
        e.face(); const d = Math.abs(e.dx());
        if (d < 70) e.walk(-e.facing, 60, dt); else e.walk(0, 0, dt);
        if (e.cool <= 0 && Math.abs(e.dy()) < 40 && d < 320) e.attack('shoot');
      }
    },
  };
  // --- R2: Cão de Cinza — uiva ao ver o intruso, rodeia-o a galope e salta à garganta quando ele vira costas ou para ---
  KINDS.hound = {
    cfg: { w: 24, h: 16, hp: 28, poise: 10, ash: 16 },
    eyeLight: { r: 20, i: 0.45 },
    attacks: {
      bite: { wind: 0.32, act: 0.22, rec: 0.45, dmg: 13, hb: (e) => front(e, 4, 2, 20, 14), lunge: 280, tell: null, sfx: 'whip', onAct(e) { if (e.onGround) e.vy = -160; } },
    },
    think(e, dt, g) {
      if (e.atk) return;
      if (!e.aggro && e.sees(260, 80)) { e.aggro = true; A.sfx('howl', { vol: 0.35 }); e.circleT = U.rand(0.6, 1.2); }
      if (e.aggro) {
        const p = e.player, d = Math.abs(e.dx());
        const exposed = (p.facing > 0) === (e.cx < p.cx) || Math.abs(p.vx) < 10; // de costas para o cão ou parado
        e.circleT -= dt;
        if (d < 90 && e.cool <= 0 && e.onGround && (exposed || e.circleT <= 0)) { e.face(); e.attack('bite'); e.circleT = U.rand(1.0, 1.8); return; }
        if (d < 60) { e.facing = Math.sign(e.cx - p.cx) || 1; e.walk(e.facing, 110, dt); }
        else if (d > 120) { e.face(); e.walk(e.facing, 150, dt); }
        else { e.face(); e.walk(Math.sin(e.anim * 2.2) > 0 ? e.facing : -e.facing, 70, dt); }
      } else { e.modeT -= dt; if (e.modeT <= 0) { e.modeT = U.rand(2, 4); e.facing *= -1; } e.walk(e.facing, 25, dt); }
    },
  };

  // --- R3: Escravo da Forja ---
  KINDS.thrall = {
    cfg: { w: 20, h: 34, hp: 75, poise: 40, ash: 32, heavy: true, ashCol: '#ff7030' },
    eyeLight: { r: 40, i: 0.6, color: '#ff7a30', flicker: 2 },
    attacks: {
      slam: { wind: 0.85, act: 0.14, rec: 0.9, dmg: 24, hb: (e) => front(e, 6, 0, 30, 30), tell: 'red', armor: true, sfx: 'swing_heavy',
        onAct(e, g) { G.addShake(0.3); A.sfx('crush', { vol: 0.7 }); for (const s of [-1, 1]) g.spawn(new VS.Projectile({ x: e.cx + e.facing * 22 * e.size, y: e.bottom + 4 - 10 * e.size, vx: s * 170 * Math.sqrt(e.size), vy: 0, w: 14 * e.size, h: 10 * e.size, dmg: Math.round(12 * (e.K.dmgMult || 1)), kind: 'shockwave', color: '#ff8040', life: 1.1, solid: false, parryable: false, reflectable: false, light: true })); } },
      swipe: { wind: 0.5, act: 0.16, rec: 0.6, dmg: 16, hb: (e) => front(e, 0, 8, 36, 22), tell: 'white', lunge: 60, sfx: 'swing_heavy' },
    },
    think(e, dt, g) {
      if (e.atk) return;
      if (e.sees(220)) e.aggro = true;
      if (e.aggro) { e.face(); const d = Math.abs(e.dx()); if (d < 48 && e.cool <= 0) e.attack(U.chance(0.5) ? 'slam' : 'swipe'); else if (d > 40) e.walk(e.facing, 32, dt); else e.walk(0, 0, dt); }
    },
  };
  // --- R3: Escória ---
  KINDS.slag = {
    cfg: { w: 18, h: 14, hp: 24, poise: 6, ash: 10, contact: 11, ashCol: '#ff6010' },
    drawScale: (e) => (e.small ? 0.62 : 1),
    // salto: esticar ao subir, arredondar ao cair, achatar ao aterrar
    animState(e) {
      if (!e.onGround) { e._air = true; return e.vy < 0 ? { anim: 'jump', idx: 1 } : { anim: 'fall' }; }
      if (e._air) { e._air = false; e._landT = 0.25; }
      if (e._landT > 0) { e._landT -= (VS.Gfx.fdt || 1 / 60); return { anim: 'land', idx: (1 - e._landT / 0.25) * 4 }; }
      return null;
    },
    init(e, d) { e.small = !!d.small; if (e.small) { e.w = 11; e.h = 9; e.hp = e.maxHp = 10; e.x += 3; e.y += 5; } },
    attacks: {},
    think(e, dt, g) {
      if (e.sees(220, 100)) e.aggro = true;
      e.hopT = (e.hopT || U.rand(0.5, 1.2)) - dt;
      if (e.onGround) { e.vx = U.approach(e.vx, 0, 600 * dt); if (e.hopT <= 0) { e.hopT = U.rand(0.7, 1.3); if (e.aggro) e.face(); else e.facing = U.pick([-1, 1]); e.vy = -U.rand(240, 330); e.vx = e.facing * U.rand(80, 130); A.sfx('splash', { vol: 0.2 }); } }
      if (e.onGround && Math.random() < 0.05) G.emit({ x: e.cx, y: e.bottom - 2, vy: -20, life: 1.2, size: 1.5, color: '#ff7020', add: true });
    },
    onDeath(e, g) { if (!e.small) for (const s of [-1, 1]) { const k = new Enemy('slag', { x: Math.floor(e.cx / T), y: Math.floor((e.bottom - 1) / T), small: true }); k.vx = s * 120; k.vy = -200; k.aggro = true; g.spawn(k); } },
    light(e) { G.light(e.cx, e.cy, e.small ? 40 : 60, '#ff6010', 0.8, 2); },
  };
  // --- R3: Fundidor ---
  KINDS.smelter = {
    cfg: { w: 16, h: 30, hp: 36, poise: 14, ash: 22 },
    attacks: { lob: { wind: 0.7, act: 0.05, rec: 0.8, tell: null, sfx: 'swing', onAct(e, g) { const p = e.player; const t0 = VS.EnemyRender && VS.EnemyRender.point(e, e._f, 'tip'); const ox = t0 ? t0.x : e.cx, oy = t0 ? t0.y : e.y + 4; const dx = p.cx - ox; const tt = 0.9; g.spawn(new VS.Projectile({ x: ox - 5, y: oy - 5, vx: dx / tt, vy: -330, g: 700, w: 10, h: 10, dmg: 15, kind: 'molten', color: '#ff7020', life: 3, parryable: false, reflectable: false, onHitWall(g2) { g2.spawn(new VS.Projectile({ x: this.cx, y: this.cy - 4, vx: 0, vy: 0, w: 20, h: 8, dmg: 8, kind: 'fire', color: '#ff6010', life: 1.5, solid: false, parryable: false, reflectable: false, persist: true })); } })); } } },
    think(e, dt, g) {
      if (e.atk) return;
      if (e.sees(280, 140)) e.aggro = true;
      if (e.aggro) { e.face(); const d = Math.abs(e.dx()); if (d < 60) e.walk(-e.facing, 50, dt); else e.walk(0, 0, dt); if (e.cool <= 0 && d < 300) e.attack('lob'); }
    },
    light(e) { const p = VS.EnemyRender && VS.EnemyRender.point(e, e._f, 'light'); G.light(p ? p.x : e.cx, p ? p.y : e.y + 6, 50, '#ff7020', 0.6, 2); },
  };

  // --- R4: Espinheira (enraizada) ---
  KINDS.thornmaid = {
    cfg: { w: 16, h: 32, hp: 40, poise: 18, ash: 20, heavy: true, blood: '#2a3a1a', ashCol: '#c03040' },
    eyeLight: { r: 22, i: 0.4, color: '#a0ff70' },
    animState: (e) => (!e.open && !e.atk && !e.dead && e.stagger <= 0 && e.lastHitT > 0.3 ? { anim: 'dormant' } : null),
    attacks: { whip: { wind: 0.55, act: 0.16, rec: 0.6, dmg: 15, hb: (e) => front(e, 4, 10, 64, 10), tell: 'white', sfx: 'whip' },
      burst: { wind: 0.75, act: 0.2, rec: 0.7, dmg: 18, hb: (e) => ({ x: e.cx - 34, y: e.bottom - 18, w: 68, h: 18 }), tell: 'red', sfx: 'whip',
        onAct(e) { A.sfx('break', { vol: 0.5 }); for (let i = 0; i < 14; i++) { const sx = e.cx + U.rand(-32, 32); G.emit({ x: sx, y: e.bottom, vx: (sx - e.cx) * 0.6, vy: -U.rand(120, 260), g: 700, life: U.rand(0.4, 0.7), size: U.rand(1.6, 2.6), color: U.pick(['#3a2a1a', '#4e6a2a', '#2a3a18']), kind: 'shard', vr: U.rand(-8, 8), collide: true }); } } } },
    think(e, dt, g) {
      if (e.atk) return;
      e.vx = 0;
      if (e.sees(110, 60)) { e.face(); e.open = true; const d = Math.abs(e.dx()); if (e.cool <= 0) e.attack(d < 30 ? 'burst' : 'whip'); }
      else e.open = false;
    },
  };
  // --- R4: Afogado (emboscada) ---
  KINDS.drowned = {
    cfg: { w: 16, h: 32, hp: 42, poise: 20, ash: 24, blood: '#1a3a3a', ashCol: '#90d0c8' },
    eyeLight: { r: 20, i: 0.35, color: '#90f0e0' },
    animState: (e) => (!e.dead && e.rise < 1 ? { anim: 'rise', idx: e.rise * 6 } : null),
    init(e) { e.hidden = true; e.hittable = false; e.rise = 0; },
    attacks: { grab: { wind: 0.6, act: 0.2, rec: 0.75, dmg: 20, hb: (e) => front(e, 0, 8, 26, 22), lunge: 110, tell: 'red' },
      claw: { wind: 0.4, act: 0.12, rec: 0.5, dmg: 13, hb: (e) => front(e, 0, 10, 24, 20), lunge: 60, tell: null } },
    think(e, dt, g) {
      if (e.hidden) { if (Math.abs(e.dx()) < 70 && Math.abs(e.dy()) < 60) { e.hidden = false; e.hittable = true; e.rise = 0.01; A.sfx('splash'); G.burst(e.cx, e.bottom, 16, { color: '#80b0b0', speed: 120, angle: -Math.PI / 2, spread: 1.4, g: 500, life: 0.7, size: 1.8 }); } return; }
      if (e.rise < 1) { e.rise = Math.min(1, e.rise + dt * 1.6); return; }
      if (e.atk) return;
      e.face(); const d = Math.abs(e.dx());
      if (d < 36 && e.cool <= 0) e.attack(U.chance(0.4) ? 'grab' : 'claw'); else e.walk(e.facing, 35, dt);
    },
    drawHidden(ctx, e) { ctx.fillStyle = 'rgba(40,70,70,0.6)'; ctx.beginPath(); ctx.ellipse(e.cx, e.bottom - 1, 10 * e.size, 2 * e.size, 0, 0, U.TAU); ctx.fill(); if (Math.random() < 0.05 * e.size) G.emit({ x: e.cx + U.rand(-6, 6) * e.size, y: e.bottom - 2, vy: -15, life: 0.6, size: 1, color: '#90c0c0' }); },
  };
  // --- R4: Mariposa ---
  KINDS.moth = {
    cfg: { w: 14, h: 12, hp: 15, poise: 4, ash: 9, flying: true, blood: '#a09070' },
    attacks: { dive: { wind: 0.45, act: 0.45, rec: 0.4, dmg: 11, hb: (e) => ({ x: e.x, y: e.y, w: e.w, h: e.h }), tell: null, sfx: 'moth', onAct(e) { const p = e.player; const a = Math.atan2(p.cy - e.cy, p.cx - e.cx); e.vx = Math.cos(a) * 260; e.vy = Math.sin(a) * 260; }, during(e) {}, onEnd(e) { e.vx *= 0.3; e.vy *= 0.3; } } },
    think(e, dt, g) {
      if (e.atk) { if (e.atk.phase !== 'act') { e.vx *= 0.9; e.vy *= 0.9; } if (Math.random() < 0.4) G.emit({ x: e.cx, y: e.cy, vx: U.rand(-10, 10), vy: 10, life: 1, size: 1, color: '#d8c8a0' }); return; }
      if (e.sees(220, 160)) e.aggro = true;
      const t = e.anim;
      if (e.aggro) { const p = e.player; e.fly(p.cx + Math.sin(t * 1.7) * 70, p.cy - 50 + Math.cos(t * 2.3) * 30, 110, dt, 0.08); if (e.cool <= 0 && Math.hypot(e.dx(), e.dy()) < 140) e.attack('dive'); }
      else e.fly(e.home.x + Math.sin(t) * 40, e.home.y + Math.sin(t * 2.1) * 20, 50, dt);
      e.face();
    },
    light(e) { G.light(e.cx, e.cy, 30, '#f0e0a0', 0.4); },
  };

  // --- R5: Gárgula ---
  KINDS.gargoyle = {
    cfg: { w: 20, h: 22, hp: 46, poise: 22, ash: 26, flying: true, ashCol: '#9a96a0' },
    sheetAnchor: 'center',
    animState: (e) => (e.perched && !e.dead ? { anim: 'perch', idx: 0 } : null),
    eyeLight: { r: 26, i: 0.5, color: '#ff5030', when: (e) => !e.perched },
    init(e) { e.perched = true; e.perch = { x: e.x, y: e.y }; },
    invulnerable(e) { return e.perched; },
    attacks: { dive: { wind: 0.55, act: 0.6, rec: 0.6, dmg: 18, hb: (e) => ({ x: e.x - 2, y: e.y, w: e.w + 4, h: e.h }), tell: 'red', sfx: 'wind', onAct(e) { const p = e.player; const a = Math.atan2(p.cy - e.cy, p.cx - e.cx); e.vx = Math.cos(a) * 320; e.vy = Math.sin(a) * 320; }, onEnd(e) { e.returning = true; } },
      claw: { wind: 0.4, act: 0.14, rec: 0.5, dmg: 14, hb: (e) => front(e, 0, 0, 26, 22), tell: 'white', lunge: 90 } },
    think(e, dt, g) {
      if (e.perched) { e.vx = 0; e.vy = 0; if (Math.abs(e.dx()) < 90 && e.dy() > 0 && e.dy() < 220) { e.perched = false; A.sfx('roar', { vol: 0.4 }); e.attack('dive'); } return; }
      if (e.atk) { if (e.atk.phase === 'wind') { e.vx *= 0.9; e.vy = -30; } return; }
      if (e.returning) { e.fly(e.perch.x + e.w / 2, e.perch.y + e.h / 2, 160, dt, 0.1); if (Math.hypot(e.cx - e.perch.x - e.w / 2, e.cy - e.perch.y - e.h / 2) < 8) { e.returning = false; e.cool = 1; } if (e.cool <= 0 && Math.hypot(e.dx(), e.dy()) < 160) { e.returning = false; } return; }
      const p = e.player; e.face();
      e.fly(p.cx - e.facing * 40, p.cy - 50, 120, dt);
      if (e.cool <= 0) { if (Math.hypot(e.dx(), e.dy()) < 50) e.attack('claw'); else e.attack('dive'); }
    },
  };
  // --- R5: Acólito dos Sinos ---
  KINDS.acolyte = {
    cfg: { w: 14, h: 30, hp: 34, poise: 14, ash: 20 },
    eyeLight: { r: 18, i: 0.35, color: '#ffd9a0' },
    attacks: {
      ring: { wind: 0.7, act: 0.05, rec: 0.8, tell: null, sfx: 'bell_small', onAct(e, g) { for (const s of [-1, 1]) g.spawn(new VS.Projectile({ x: e.cx, y: e.cy, vx: s * 170, vy: 0, w: 10, h: 26, dmg: 12, kind: 'wave', color: '#e8d090', life: 2.2, solid: true, reflectable: false })); } },
      bash: { wind: 0.4, act: 0.12, rec: 0.5, dmg: 13, hb: (e) => front(e, 0, 8, 24, 20), tell: 'white', lunge: 80 },
    },
    think(e, dt, g) {
      if (e.atk) return;
      if (e.sees(240)) e.aggro = true;
      if (e.aggro) { e.face(); const d = Math.abs(e.dx()); if (e.cool <= 0) e.attack(d < 36 ? 'bash' : 'ring'); else if (d > 120) e.walk(e.facing, 40, dt); else if (d < 50) e.walk(-e.facing, 40, dt); else e.walk(0, 0, dt); }
    },
  };
  // --- R5: Corvo ---
  KINDS.raven = {
    cfg: { w: 12, h: 9, hp: 8, poise: 2, ash: 5, flying: true, blood: '#101014', ashCol: '#e8dcb8' },
    sheetAnchor: 'center',
    eyeLight: { r: 14, i: 0.35, color: '#ff9a40' },
    attacks: { swoop: { wind: 0.3, act: 0.5, rec: 0.3, dmg: 9, hb: (e) => ({ x: e.x, y: e.y, w: e.w, h: e.h }), tell: null, sfx: false, onAct(e) { const p = e.player; const a = Math.atan2(p.cy - e.cy, p.cx - e.cx); e.vx = Math.cos(a) * 240; e.vy = Math.sin(a) * 240; } } },
    think(e, dt, g) {
      if (e.atk) return;
      if (e.sees(240, 180)) e.aggro = true;
      const t = e.anim + e.home.x * 0.01;
      if (e.aggro) { const p = e.player; e.fly(p.cx + Math.cos(t * 1.4) * 80, p.cy - 70 + Math.sin(t * 2) * 20, 140, dt, 0.07); if (e.cool <= 0) e.attack('swoop'); }
      else { e.vx = 0; e.vy = 0; }
      e.facing = e.vx > 0 ? 1 : -1;
    },
  };

  // --- R6: Penitente ---
  KINDS.penitent = {
    cfg: { w: 16, h: 32, hp: 55, poise: 22, ash: 30 },
    eyeLight: { r: 14, i: 0.3, color: '#ff9a40' },
    attacks: {
      c1: { wind: 0.35, act: 0.12, rec: 0.15, dmg: 12, hb: (e) => front(e, 0, 8, 34, 22), lunge: 90, sfx: 'whip', cool: 0, onEnd(e) { e.attack('c2'); } },
      c2: { wind: 0.2, act: 0.12, rec: 0.18, dmg: 12, hb: (e) => front(e, 0, 8, 34, 22), lunge: 90, sfx: 'whip', cool: 0, onEnd(e) { e.attack('c3'); } },
      c3: { wind: 0.55, act: 0.15, rec: 0.75, dmg: 18, hb: (e) => front(e, 0, 0, 40, 30), lunge: 140, tell: 'white', sfx: 'swing_heavy' },
    },
    think(e, dt, g) {
      if (e.atk) return;
      if (e.sees(230)) e.aggro = true;
      if (e.aggro) { e.face(); const d = Math.abs(e.dx()); if (d < 50 && e.cool <= 0) e.attack('c1'); else e.walk(e.facing, 70, dt); }
    },
  };
  // --- R6: Vitral ---
  KINDS.vitrail = {
    cfg: { w: 18, h: 26, hp: 40, poise: 16, ash: 28, flying: true, blood: '#a080c0', ashCol: '#c0a0ff' },
    sheetAnchor: 'center',
    damageMult(e, hb) { return hb.kind === 'heavy' ? 1.6 : 1; },
    attacks: { shards: { wind: 0.75, act: 0.05, rec: 0.8, tell: null, sfx: 'glass', onAct(e, g) { const p = e.player; const a0 = Math.atan2(p.cy - e.cy, p.cx - e.cx); for (let i = -1; i <= 1; i++) { const a = a0 + i * 0.22; g.spawn(new VS.Projectile({ x: e.cx, y: e.cy, vx: Math.cos(a) * 230, vy: Math.sin(a) * 230, w: 7, h: 7, dmg: 11, kind: 'glass', color: U.pick(['#ff6080', '#6080ff', '#ffd060']), life: 3 })); } } } },
    think(e, dt, g) {
      if (e.sees(280, 200)) e.aggro = true;
      if (!e.aggro) { e.fly(e.home.x, e.home.y + Math.sin(e.anim) * 6, 30, dt); return; }
      e.face();
      e.blinkT = (e.blinkT || 3) - dt;
      if (e.blinkT <= 0 && !e.atk) { e.blinkT = U.rand(3, 5); A.sfx('light', { vol: 0.4 }); G.burst(e.cx, e.cy, 14, { color: '#c0a0ff', speed: 100, life: 0.5, size: 1.6, add: true }); const p = e.player; e.x = U.clamp(p.cx + U.pick([-1, 1]) * U.rand(90, 140), 20, g.room.pw - 40); e.y = U.clamp(p.cy - U.rand(50, 90), 20, g.room.ph - 60); if (VS.World.rectSolid(g.room, e)) { e.x = e.home.x; e.y = e.home.y; } G.burst(e.cx, e.cy, 14, { color: '#c0a0ff', speed: 100, life: 0.5, size: 1.6, add: true }); }
      if (!e.atk) { e.vx *= 0.9; e.vy = Math.sin(e.anim * 2) * 10; if (e.cool <= 0) e.attack('shards'); }
    },
    light(e) { G.light(e.cx, e.cy, 60, '#c0a0ff', 0.6); },
  };
  // --- R6: Coro ---
  KINDS.choir = {
    cfg: { w: 16, h: 16, hp: 30, poise: 10, ash: 20, flying: true, blood: '#c0b0d0', ashCol: '#d0c0e0' },
    sheetAnchor: 'center',
    attacks: { sing: { wind: 0.9, act: 0.05, rec: 1.0, tell: null, sfx: 'choir_hit', onAct(e, g) { for (let i = 0; i < 6; i++) { const a = i / 6 * U.TAU + e.anim; g.spawn(new VS.Projectile({ x: e.cx, y: e.cy, vx: Math.cos(a) * 110, vy: Math.sin(a) * 110, w: 9, h: 9, dmg: 10, kind: 'note', color: '#d0a0ff', life: 3, solid: false })); } } } },
    think(e, dt, g) {
      if (e.sees(260, 200)) e.aggro = true;
      const t = e.anim;
      if (e.aggro) { const p = e.player; e.fly(p.cx + Math.sin(t * 0.6) * 100, p.cy - 80, 60, dt); if (e.cool <= 0 && !e.atk) e.attack('sing'); }
      else e.fly(e.home.x, e.home.y + Math.sin(t) * 8, 30, dt);
    },
    light(e) { G.light(e.cx, e.cy, 50, '#d0a0ff', 0.5); },
  };

  // --- R7: Guarda Real ---
  KINDS.royalguard = {
    cfg: { w: 18, h: 36, hp: 95, poise: 45, ash: 45, heavy: true, ashCol: '#ffd070' },
    eyeLight: { r: 20, i: 0.4, color: '#ffd070' },
    init(e) { e.guarding = true; },
    attacks: {
      sweep: { wind: 0.6, act: 0.18, rec: 0.6, dmg: 18, hb: (e) => front(e, -6, 4, 56, 24), tell: 'white', sfx: 'swing_heavy', onWind(e) { e.guarding = false; } },
      thrust: { wind: 0.75, act: 0.16, rec: 0.7, dmg: 24, hb: (e) => front(e, 4, 14, 56, 8), lunge: 220, tell: 'red', onWind(e) { e.guarding = false; } },
      overhead: { wind: 0.7, act: 0.14, rec: 0.75, dmg: 22, hb: (e) => front(e, 6, 0, 36, 40), tell: 'white', sfx: 'swing_heavy', armor: true, onWind(e) { e.guarding = false; }, onAct(e) { G.addShake(0.2); } },
    },
    think(e, dt, g) {
      if (e.atk) return;
      e.guarding = true;
      if (e.sees(240)) e.aggro = true;
      if (e.aggro) { e.face(); const d = Math.abs(e.dx()); if ((d < 64 && e.cool <= 0) || (e.attackSoon && d < 60)) { e.attackSoon = false; e.attack(U.pick(['sweep', 'thrust', 'overhead'])); } else if (d > 50) e.walk(e.facing, 34, dt); else e.walk(0, 0, dt); }
    },
  };
  // --- R7: Cortesão (fantasma) ---
  KINDS.courtier = {
    cfg: { w: 14, h: 30, hp: 30, poise: 10, ash: 24, flying: true, blood: '#8080a0', ashCol: '#a8b4ff' },
    alpha: (e) => 0.08 + 0.82 * U.clamp(e.fade, 0, 1),
    eyeLight: { r: 34, i: 0.45, color: '#8090ff' },
    invulnerable(e) { return e.fade < 0.5; },
    attacks: { stab: { wind: 0.45, act: 0.12, rec: 0.5, dmg: 15, hb: (e) => front(e, 0, 10, 26, 12), tell: 'white', lunge: 120, onEnd(e) { e.vanishT = 0.8; } } },
    init(e) { e.fade = 0; e.vanishT = 0.5; },
    think(e, dt, g) {
      if (e.sees(260, 160)) e.aggro = true;
      if (!e.aggro) { e.fade = U.approach(e.fade, 0.4, dt); return; }
      if (e.atk) { e.fade = U.approach(e.fade, 1, dt * 4); e.vy = 0; return; }
      e.vanishT -= dt;
      if (e.vanishT > 0) { e.fade = U.approach(e.fade, 0, dt * 3); e.vx *= 0.9; e.vy *= 0.9; return; }
      if (e.fade <= 0.01 && !e.placed) { const p = e.player; e.x = p.cx - p.facing * 34 - e.w / 2; e.y = p.bottom - e.h; if (VS.World.rectSolid(g.room, e)) { e.x = p.cx + p.facing * 34 - e.w / 2; } e.placed = true; }
      e.fade = U.approach(e.fade, 1, dt * 2.5);
      if (e.fade >= 1) { e.placed = false; e.face(); e.attack('stab'); }
    },
  };
  // --- R7: Archote Vivo ---
  KINDS.torch = {
    cfg: { w: 14, h: 28, hp: 26, poise: 8, ash: 18, ashCol: '#ff6020' },
    attacks: { burst: { wind: 0.8, act: 0.15, rec: 0.2, dmg: 22, hb: (e) => ({ x: e.cx - 34, y: e.cy - 34, w: 68, h: 60 }), tell: 'red', sfx: 'explode', onAct(e, g) { G.addShake(0.35); G.burst(e.cx, e.cy, 30, { color: '#ff8030', speed: 200, life: 0.6, size: 2.4, add: true }); }, onEnd(e, g) { e.hp = 0; e.die(g); } } },
    think(e, dt, g) {
      if (e.atk) { e.vx = 0; return; }
      if (e.sees(240)) e.aggro = true;
      if (e.aggro) { e.face(); const d = Math.abs(e.dx()); if (d < 34) e.attack('burst'); else e.walk(e.facing, 95, dt); }
      if (Math.random() < 0.35) G.emit({ x: e.cx + U.rand(-6, 6), y: e.y + U.rand(-8, 10), vx: U.rand(-10, 10), vy: U.rand(-60, -30), life: 0.6, size: U.rand(0.6, 1.2), color: U.pick(['#ffb040', '#ff6010', '#ffe0a0']), add: true, shrink: true });
    },
    light(e) { const p = VS.EnemyRender && VS.EnemyRender.point(e, e._f, 'light'); G.light(p ? p.x : e.cx, p ? p.y : e.y + 6, 90, '#ff7020', 0.9, 3); },
  };

  // ---------- os de garras são um bocado maiores ----------
  KINDS.crawler.size = 1.45;
  KINDS.gargoyle.size = 1.35;
  KINDS.drowned.size = 1.3;

  // ---------- variantes grandes: o mesmo bicho, muito maior, mais lento a armar o golpe e muito mais duro ----------
  // (o golpe chega mais longe e bate com mais força; a postura aguenta muito mais; não recua com golpes leves)
  function giant(base, o) {
    const B = KINDS[base], K = Object.assign({}, B);
    K.base = base; K.big = true; K.sheet = base + '_big';
    K.size = o.size; K.dmgMult = o.dmg || 1.5; K.speedMult = o.speed || 0.75;
    K.cfg = Object.assign({}, B.cfg, { heavy: true }, o.cfg);
    const slow = o.slow || 1.15;
    K.attacks = {};
    for (const n in B.attacks) { const a = B.attacks[n]; K.attacks[n] = Object.assign({}, a, { wind: a.wind * slow, rec: a.rec * (1 + (slow - 1) * 0.6), sfx: a.sfx === 'whip' || !a.sfx ? 'swing_heavy' : a.sfx }); }
    if (B.eyeLight) K.eyeLight = Object.assign({}, B.eyeLight, { r: (B.eyeLight.r || 24) * 1.5, i: Math.min(0.9, (B.eyeLight.i || 0.5) * 1.3) });
    // ao acordar e ao cair, o chão treme
    const think = B.think;
    K.think = function (e, dt, g) {
      think(e, dt, g);
      if (e.aggro && !e._roared) { e._roared = true; if (o.roar !== false) A.sfx('roar', { vol: 0.55 }); G.addShake(0.25); }
      if (!e.flying && e.onGround && Math.abs(e.vx) > 20) { e._stepT = (e._stepT || 0) + dt; if (e._stepT > 0.42) { e._stepT = 0; G.addShake(0.05); A.sfx('step_heavy', { vol: 0.3 }); } }
    };
    const onDeath = B.onDeath;
    K.onDeath = function (e, g) { G.addShake(0.4); G.burst(e.cx, e.bottom - 4, 26, { color: e.c.ashCol || '#a09080', speed: 160, angle: -Math.PI / 2, spread: 2.4, g: 400, life: 0.9, size: 2.2 }); if (onDeath) onDeath(e, g); };
    return K;
  }
  KINDS.husk_big = giant('husk', { size: 1.85, cfg: { hp: 130, poise: 70, ash: 75 }, dmg: 1.6, speed: 0.8 });
  KINDS.hound_big = giant('hound', { size: 1.75, cfg: { hp: 115, poise: 50, ash: 80 }, dmg: 1.5, speed: 0.9, slow: 1.1, roar: false });
  KINDS.thrall_big = giant('thrall', { size: 1.55, cfg: { hp: 230, poise: 110, ash: 120 }, dmg: 1.4, speed: 0.8, slow: 1.12 });
  KINDS.drowned_big = giant('drowned', { size: 1.8, cfg: { hp: 150, poise: 70, ash: 95 }, dmg: 1.5, speed: 0.85 });
  KINDS.gargoyle_big = giant('gargoyle', { size: 1.75, cfg: { hp: 150, poise: 70, ash: 110 }, dmg: 1.45, speed: 0.85, slow: 1.1 });
  KINDS.penitent_big = giant('penitent', { size: 1.65, cfg: { hp: 190, poise: 80, ash: 120 }, dmg: 1.45, speed: 0.75 });
  KINDS.royalguard_big = giant('royalguard', { size: 1.5, cfg: { hp: 280, poise: 130, ash: 170 }, dmg: 1.35, speed: 0.85, slow: 1.1 });

  const E = {
    KINDS, Enemy,
    make(d, key, game) { if (!KINDS[d.k]) { console.warn('inimigo desconhecido', d.k); return null; } const e = new Enemy(d.k, d); e.game = game; return e; },
  };
  VS.Enemies = E;
})(window.VS);
