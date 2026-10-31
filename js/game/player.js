// Vesperal — o Desperto: movimento, combate por fases, esquiva, parry/guarda, cura, feitiço, morte
'use strict';
(function (VS) {
  const U = VS.U, T = U.TILE, In = VS.Input, D2R = Math.PI / 180;
  const A_ = (a, b, k) => a + (b - a) * k;
  // marca do corte e cor da carga por estilo de arma (ver js/render/fx.js)
  const MARK = { steel: 'blade', quick: 'quick', long: 'long', spirit: 'spirit', royal: 'royal', heavy: 'blade' };
  const CHARGE_COL = { steel: [255, 200, 120], quick: [190, 240, 240], heavy: [255, 150, 60], long: [255, 220, 150], spirit: [200, 170, 255], royal: [255, 120, 40] };

  const C = {
    W: 12, H: 30, CH: 18,
    RUN: 160, CRAWL: 58, ACC_G: 1700, ACC_A: 1350, FRIC: 2100,
    // a descer pesa mais (FALL_MUL): salto menos "flutuante"; o impulso sobe um pouco para o alcance ficar igual
    GRAV: 1350, FALL_MUL: 1.2, MAXFALL: 480, JUMP: -452, JUMP_CUT: 0.42, DOUBLE: -412,
    COYOTE: 0.12, JUMP_BUF: 0.15,
    WALL_SLIDE: 70, WALL_JVX: 240, WALL_JVY: -430, WALL_LOCK: 0.16,
    CLIMB_UP: 58, CLIMB_UP_G: 80, CLIMB_DOWN: 150, CLIMB_STAM: 1.4, CLIMB_STAM_G: 3.0, CLIMB_HOP: -300,
    PARRY: 0.2, PARRY_LATE: 0.07, PARRY_BUF: 0.18, IFRAMES: 0.9,
  };
  // golpes: tempos (s), arco (graus, 0 = em frente, negativo = para cima), multiplicadores
  const ATK = {
    l1: { wind: 0.07, act: 0.09, rec: 0.2, a0: -150, a1: 35, mult: 1, poise: 12, lunge: 120, knock: 150, next: 'l2' },
    l2: { wind: 0.06, act: 0.09, rec: 0.22, a0: 45, a1: -120, mult: 1, poise: 12, lunge: 110, knock: 150, next: 'l3' },
    l3: { wind: 0.13, act: 0.1, rec: 0.32, a0: -175, a1: 65, mult: 1.35, poise: 26, lunge: 170, knock: 260, hitstop: 0.075 },
    air: { wind: 0.05, act: 0.09, rec: 0.15, a0: -140, a1: 40, mult: 1, poise: 10, knock: 120, next: 'air2' },
    air2: { wind: 0.05, act: 0.09, rec: 0.2, a0: 40, a1: -115, mult: 1, poise: 10, knock: 120 },
    up: { wind: 0.06, act: 0.1, rec: 0.2, a0: -10, a1: -170, mult: 1, poise: 12, knock: 100 },
    down: { wind: 0.04, act: 0.13, rec: 0.15, a0: 25, a1: 155, mult: 1, poise: 12, knock: 80, pogo: true },
    crouch: { wind: 0.05, act: 0.08, rec: 0.2, a0: 20, a1: 20, thrust: true, mult: 0.9, poise: 8, knock: 120 },
    riposte: { wind: 0.05, act: 0.11, rec: 0.3, a0: -2, a1: -2, thrust: true, kind: 'riposte', mult: 1, poise: 80, knock: 320, hitstop: 0.16, lunge: 260 },
    heavy: { wind: 0.36, act: 0.12, rec: 0.38, a0: -178, a1: 80, kind: 'heavy', mult: 1, poise: 45, lunge: 190, knock: 340, hitstop: 0.1 },
  };
  const REST_ANGLE = 70 * D2R, RUN_ANGLE = 140 * D2R;

  class Player extends VS.Entity {
    constructor(x, y) {
      super(x, y, C.W, C.H);
      this.isPlayer = true; this.team = 'player'; this.z = 10;
      this.gravity = C.GRAV; this.maxFall = C.MAXFALL;
      this.coyote = 0; this.airDash = false; this.doubleUsed = false;
      this.action = null; this.iframes = 0; this.dodgeCd = 0; this.riposteT = 0; this.combo = null; this.comboT = 0;
      this.wallDir = 0; this.wallLock = 0; this.crouch = false; this.inWater = false; this.climbStam = C.CLIMB_STAM_G; this.climbSide = 1;
      this.lastSafe = { x, y }; this.safeT = 0; this.stepT = 0; this.landSquash = 0; this.runPhase = 0;
      this.swordAngle = REST_ANGLE; this.swordReach = 0; this.smear = []; this.attackHB = null;
      this.cloak = []; for (let i = 0; i < 6; i++) this.cloak.push({ x: x, y: y + i * 4, px: x, py: y + i * 4 });
      this.afterimages = []; this.chargeT = 0; this.hurtT = 0; this.healGlow = 0; this.parryFlash = 0;
      this.idleT = 0;
      this.anim = { key: '', t: 0 }; this.trail = []; this.airT = 0; this.landT = 0; this.crouchT = 0; this.turnT = 0; this.climbing = false; this.climbPhase = 0;
    }
    // golpes da arma equipada (classe desenhada no ateliê) e ritmo
    moves() { const w = this.st.weaponDef; return (VS.WEAPON_MOVES && VS.WEAPON_MOVES[w.cls]) || ATK; }
    weaponSpeed() { return this.st.weaponDef.speed * this.st.fx('attackSpeed', 1); }
    get st() { return VS.state; }
    get dir() { return this.facing; }
    get busy() { return !!this.action; }
    get canAct() { const a = this.action; return !a || (a.phase === 'rec' && a.t > a.rec * 0.2) || (a.type === 'attack' && a.phase === 'wind'); }

    // ---------- ciclo ----------
    update(dt, game) {
      super.update(dt, game);
      const st = this.st;
      this.iframes = Math.max(0, this.iframes - dt);
      this.dodgeCd = Math.max(0, this.dodgeCd - dt);
      this.riposteT = Math.max(0, this.riposteT - dt);
      this.comboT = Math.max(0, this.comboT - dt);
      this.wallLock = Math.max(0, this.wallLock - dt);
      this.landSquash = Math.max(0, this.landSquash - dt * 4);
      this.parryFlash = Math.max(0, this.parryFlash - dt * 3);
      this.healGlow = Math.max(0, this.healGlow - dt);
      if (this.dropT > 0) { this.dropT -= dt; if (this.dropT <= 0) this.dropThrough = false; }
      this.attackHB = null;
      if (this.pendingHit) {
        this.pendingHit.t -= dt;
        if (In.pressed('parry') && !(this.action && this.action.type === 'dead')) { In.consume('parry'); this.action = null; this.startParry(game); }
        else if (this.pendingHit && (this.pendingHit.t <= 0 || (this.action && this.action.type === 'dodge' && this.action.inv))) {
          if (this.action && this.action.type === 'dodge' && this.action.inv) { this.pendingHit = null; this.perfectDodge(game); }
          else this.resolvePending(game, false);
        }
      }

      if (this.action && this.action.type === 'dead') { this.updateDead(dt, game); this.physics(dt, game); this.updateCloak(dt); return; }
      if (this.action && this.action.type === 'wake') this.updateWake(dt, game);
      if (game.cutscene) { this.vx = U.approach(this.vx, 0, C.FRIC * dt); this.physics(dt, game); this.animate(dt, game); this.updateCloak(dt); return; }

      const ax = In.axisX();
      const down = In.down('down'), up = In.down('up');
      this.inWater = game.room.isWater(Math.floor(this.cx / T), Math.floor(this.cy / T)) || (game.floodY && this.cy > game.floodY);
      this.slowT = Math.max(0, (this.slowT || 0) - dt);

      // ---------- ações ----------
      if (this.action) this.updateAction(dt, game, ax);

      if (!this.action || this.action.free) {
        // agachar
        const wantCrouch = down && this.onGround && !this.inWater;
        if (wantCrouch && !this.crouch) this.setCrouch(true, game);
        else if (!wantCrouch && this.crouch) this.setCrouch(false, game);
        // virar
        if (ax !== 0 && this.wallLock <= 0 && (!this.action || this.action.canTurn)) this.facing = ax > 0 ? 1 : -1;
      }

      // ---------- iniciar ações ----------
      if (!this.tryParry(game) && (!this.action || this.canAct)) this.tryStartActions(dt, game, ax, up, down);

      // ---------- movimento horizontal ----------
      let speed = (this.crouch ? C.CRAWL : C.RUN) * st.fx('speed', 1);
      if (this.inWater) speed *= 0.6;
      if (this.slowT > 0) speed *= 0.55;
      let target = ax * speed;
      let acc = this.onGround ? C.ACC_G : C.ACC_A;
      const a = this.action;
      if (a) {
        if (a.type === 'dodge') { target = this.vx; acc = 0; }
        else if (a.type === 'attack' || a.type === 'heavy') {
          if (this.onGround) {
            const late = a.phase === 'rec' && a.t > a.rec * 0.3, free = late ? 0.8 : a.type === 'heavy' ? 0.12 : 0.3;
            target = (a.lungeV || 0) + ax * speed * free; acc = late ? C.ACC_G : C.FRIC * 1.2;
          }
          else target = ax * speed * 0.9;
        }
        else if (a.type === 'heal') { target = ax * speed * 0.25; }
        else if (a.type === 'parry') { target = this.onGround ? 0 : this.vx; acc = C.FRIC; }
        else if (a.type === 'hurt' || a.type === 'rest' || a.type === 'plunge' || a.type === 'spell') { target = this.vx; acc = a.type === 'hurt' ? 500 : C.FRIC; if (a.type === 'spell') target = 0; }
      }
      if (this.wallLock > 0) { target = this.vx; acc = 0; }
      if (acc > 0) this.vx = U.approach(this.vx, target, (ax === 0 && this.onGround && !a ? C.FRIC : acc) * dt);

      // ---------- gravidade / parede ----------
      let grav = this.inWater ? C.GRAV * 0.35 : C.GRAV;
      let maxFall = this.inWater ? 110 : C.MAXFALL;
      if (a && a.type === 'dodge' && a.air) grav = a.short ? grav * 0.3 : 0;
      if (a && a.type === 'plunge' && a.hover) grav = 0;
      if (a && a.type === 'plunge' && !a.hover) maxFall = 720;
      // parede: desde o início agarra-se e trepa — cima sobe, baixo desliza, nada fica agarrado — com fôlego
      // limitado (renova-se no chão); no topo sobe por cima do rebordo. A Garra do Sentinela dá mais fôlego,
      // subida mais rápida, o impulso pela parede acima e o salto de parede.
      this.wallDir = 0; let climbing = false;
      const garra = !!st.abilities.wall;
      // no chão, contra uma parede, com cima premido: começa a trepar sem precisar de saltar
      if (this.onGround && up && ax !== 0 && !a && !this.crouch && !this.inWater && this.touchingWall(game, ax > 0 ? 1 : -1)) { this.onGround = false; this.y -= 1; this.vy = -30; this.climbing = true; this.climbSide = ax > 0 ? 1 : -1; }
      if (!this.onGround && !this.inWater && (!a || a.type === 'attack')) {
        const wd = ax > 0 ? 1 : ax < 0 ? -1 : (this.climbing && (up || down) ? this.climbSide : 0);
        if (wd && this.touchingWall(game, wd) && (this.vy > -40 || this.climbing)) {
          this.wallDir = wd; this.airDash = false; this.doubleUsed = false;
          if (!a && this.climbStam > 0) {
            climbing = true; this.climbSide = wd; this.facing = wd;
            this.vy = up ? -(garra ? C.CLIMB_UP_G : C.CLIMB_UP) : down ? C.CLIMB_DOWN : 0; grav = 0;
            if (!st.flags.climbHint) { st.flags.climbHint = 1; VS.UI.toast(VS.t(VS.I18N.dev('hint_climb')), 5); }
            this.climbStam -= dt * (up ? 1 : down ? 0 : 0.32);
            if (up || down) this.climbPhase = (this.climbPhase + dt * (up ? 1.8 : 2.6)) % 1;
            if (this.climbStam < 0.3 && Math.random() < 0.25) VS.Gfx.emit({ x: this.cx + wd * 5, y: this.y + 6, vx: -wd * 20, vy: 10, life: 0.3, size: 1, color: '#c0b0a0' });
            // topo da parede: a cabeça já passa o rebordo → sobe por cima
            // (também sem cima: empurrar contra um rebordo baixo sobe-o logo, para não ficar pendurada sem querer)
            if ((up || ax === wd) && !down && !VS.World.rectSolid(game.room, { x: this.x + wd * 2, y: this.y - 4, w: this.w, h: 10 })) {
              this.vy = -250; this.vx = wd * 110; this.wallLock = 0.2; climbing = false; VS.Audio.sfx('jump', { vol: 0.3 });
            }
          } else { maxFall = C.WALL_SLIDE; if (Math.random() < 0.3) VS.Gfx.emit({ x: this.cx + wd * 6, y: this.y + 8, vx: -wd * 10, vy: -20, life: 0.4, size: 1.2, color: '#a09080' }); }
        }
      }
      this.climbing = climbing;
      if (this.vy > 0 && !this.inWater && !climbing && maxFall !== C.WALL_SLIDE && !(a && (a.type === 'dodge' || a.type === 'plunge'))) grav *= C.FALL_MUL;
      this.vy = Math.min(maxFall, this.vy + grav * dt);
      if (this.vy > maxFall) this.vy = maxFall;

      // ---------- mover ----------
      const wasGround = this.onGround || !!this.standOn, prevVy = this.vy;
      // transportado por plataforma móvel
      if (this.standOn) { this.x += this.standOn.dx; this.y += this.standOn.dy; if (VS.World.rectSolid(game.room, this)) { this.x -= this.standOn.dx; this.y -= this.standOn.dy; } }
      const prevBottom = this.bottom;
      const res = VS.World.moveBody(game.room, this, dt);
      // aterrar em plataformas móveis
      this.standOn = null;
      if (this.vy >= 0 && !this.dropThrough) for (const e of game.ents) {
        if (!e.isPlatform) continue;
        if (this.x + this.w > e.x + 1 && this.x < e.x + e.w - 1 && prevBottom <= e.y + 2 + Math.max(0, e.dy) && this.bottom >= e.y - 1) {
          this.y = e.y - this.h; this.vy = 0; this.onGround = true; this.standOn = e; res.landed = true; break;
        }
      }
      if (res.landed && !wasGround) this.onLand(prevVy, game);
      if (this.onGround) { this.coyote = C.COYOTE; this.airDash = false; this.doubleUsed = false; this.climbStam = this.climbMax(); this.climbing = false; } else this.coyote -= dt;
      if (res.ceiling && this.vy < 0) this.vy = 0;

      // ---------- perigos ----------
      this.checkHazards(dt, game);
      // posição segura (para regressar após picos)
      if (this.onGround && !this.action) {
        this.safeT += dt;
        if (this.safeT > 0.25 && !this.nearHazard(game)) { this.lastSafe = { x: this.x, y: this.y }; }
      } else this.safeT = 0;
      // água: salpicos
      if (this.inWater !== this.wasInWater) { VS.Audio.sfx('splash', { vol: 0.6 }); VS.Gfx.burst(this.cx, this.cy, 14, { color: '#a0d8e0', speed: 140, angle: -Math.PI / 2, spread: 1.6, g: 500, life: 0.6, size: 1.6 }); }
      this.wasInWater = this.inWater;

      this.animate(dt, game);
      this.updateCloak(dt);
      if (st.lume < 100) st.lume = Math.min(100, st.lume + dt * 0.6 * st.fx('lumeRegen', 1));
    }

    // despertar: deitada, a brasa reacende no peito e levanta-se (início do jogo)
    startWake(game, dur, hold) { this.action = { type: 'wake', t: 0, dur: dur || 3.4, hold: hold || 1.0 }; this.vx = 0; }
    updateWake(dt, game) {
      const a = this.action; a.t += dt;
      const k = (a.t - a.hold) / (a.dur - a.hold);
      if (a.t < a.hold) { if (Math.random() < 0.2) VS.Gfx.emit({ x: this.cx + U.rand(-6, 6), y: this.bottom - 6, vy: -14, life: 1.0, size: 0.9, color: '#ff9040', add: true, shrink: true }); }
      else if (!a.lit) { a.lit = true; VS.Audio.sfx('rest'); VS.Gfx.burst(this.cx, this.bottom - 10, 18, { color: '#ffb050', speed: 70, life: 0.8, size: 1.4, add: true }); }
      if (k > 0.55 && !a.stood) { a.stood = true; VS.Audio.sfx('step_stone', { vol: 0.6 }); }
      if (a.t >= a.dur) { this.action = null; this.idleT = 0; }
    }
    climbMax() { return this.st.abilities.wall ? C.CLIMB_STAM_G : C.CLIMB_STAM; }
    touchingWall(game, d) {
      const probe = { x: this.x + d * 2, y: this.y + 4, w: this.w, h: this.h - 10 };
      return VS.World.rectSolid(game.room, probe);
    }
    setCrouch(on, game) {
      if (on) { this.y += C.H - C.CH; this.h = C.CH; this.crouch = true; }
      else {
        const probe = { x: this.x, y: this.y - (C.H - C.CH), w: this.w, h: C.H };
        if (VS.World.rectSolid(game.room, probe)) return; // sem espaço para levantar
        this.y -= C.H - C.CH; this.h = C.H; this.crouch = false;
      }
    }
    onLand(vy, game) {
      if (vy > 120 && !this.action) this.landT = 0.22;
      if (vy > 200) { this.landSquash = Math.min(1, vy / 600); VS.Audio.sfx('land', { vol: Math.min(1, vy / 500) }); VS.Gfx.burst(this.cx, this.bottom, 6, { color: '#8a8078', speed: 60, angle: -Math.PI / 2, spread: 2.6, life: 0.4, size: 1.4, g: 200 }); }
      if (this.action && this.action.type === 'plunge') this.plungeImpact(game);
      if (this.action && this.action.type === 'attack' && this.action.name === 'down') this.action = null;
    }

    // parry: lido do buffer (premir um pouco antes conta) e pode cancelar a antecipação ou a recuperação de um
    // golpe e o fim de uma esquiva — responde logo, sem esperar que a ação anterior acabe
    tryParry(game) {
      const a = this.action;
      if (a && (a.type === 'dead' || a.type === 'hurt' || a.type === 'heal' || a.type === 'rest' || a.type === 'spell' || a.type === 'plunge')) return false;
      const can = !a || ((a.type === 'attack' || a.type === 'heavy') && a.phase !== 'act')
        || (a.type === 'dodge' && !a.inv && a.t > 0.12) || (a.type === 'parry' && !a.guard && (a.success || a.t > a.window));
      if (!can || !In.buffered('parry', C.PARRY_BUF)) return false;
      In.consume('parry'); this.startParry(game); return true;
    }
    // ---------- iniciar ações ----------
    tryStartActions(dt, game, ax, up, down) {
      const st = this.st, a = this.action;
      // salto
      if (In.buffered('jump', C.JUMP_BUF) && (!a || a.phase === 'rec' || a.type === 'parry' && !a.guard && a.t > 0.12)) {
        if (this.onGround && down && this.onPlatform) { this.dropThrough = true; this.dropT = 0.25; In.consume('jump'); this.onGround = false; this.action = null; return; }
        if (this.inWater) { this.vy = -300; In.consume('jump'); this.action = null; VS.Audio.sfx('splash', { vol: 0.4 }); return; }
        if (this.coyote > 0) { this.jump(C.JUMP, game); return; }
        // a trepar, com cima premido: pequeno impulso pela parede acima (gasta fôlego)
        if (this.climbing && up && st.abilities.wall && this.climbStam > 0.2) { this.vy = C.CLIMB_HOP; this.climbStam -= 0.4; In.consume('jump'); VS.Audio.sfx('jump', { vol: 0.35 }); return; }
        if (st.abilities.wall && (this.wallDir || this.touchingWall(game, 1) || this.touchingWall(game, -1))) {
          const wd = this.wallDir || (this.touchingWall(game, 1) ? 1 : -1); this.climbing = false;
          this.vx = -wd * C.WALL_JVX; this.vy = C.WALL_JVY; this.facing = -wd; this.wallLock = C.WALL_LOCK; this.action = null;
          In.consume('jump'); VS.Audio.sfx('jump'); VS.Gfx.burst(this.cx + wd * 6, this.cy, 8, { color: '#c0b0a0', speed: 80, life: 0.35, size: 1.4 }); return;
        }
        if (st.abilities.double && !this.doubleUsed) { this.doubleUsed = true; this.jump(C.DOUBLE, game, true); return; }
      }
      // corte do salto
      if (!In.down('jump') && this.vy < 0 && this.jumping && !this.inWater) { this.vy *= C.JUMP_CUT; this.jumping = false; }
      if (this.vy >= 0) this.jumping = false;

      if (a && a.type !== 'attack' && a.type !== 'heavy' && !(a.type === 'parry' && !a.guard)) return;
      // esquiva
      if (In.buffered('dodge', 0.1) && this.dodgeCd <= 0) {
        // no ar há sempre uma esquiva curta; o Passo de Cinza torna-a uma investida longa (atravessa abismos)
        if (this.onGround || !this.airDash) { In.consume('dodge'); this.startDodge(game, ax); return; }
      }
      if (a && a.phase !== 'rec') return;
      // ataque
      if (In.buffered('attack', 0.12)) {
        In.consume('attack');
        this.turnToInput(ax);
        let name;
        if (this.riposteT > 0) name = 'riposte';
        else if (!this.onGround && down) name = 'down';
        else if (up) name = 'up';
        else if (this.crouch) name = 'crouch';
        else if (!this.onGround) name = (a && a.name === 'air' && this.comboT > 0) ? 'air2' : 'air';
        else { const mv = this.moves(); name = (this.combo && this.comboT > 0 && mv[this.combo] && mv[this.combo].next) ? mv[this.combo].next : 'l1'; }
        this.startAttack(name, game);
        return;
      }
      if (In.buffered('heavy', 0.1)) {
        In.consume('heavy');
        this.turnToInput(ax);
        if (!this.onGround) this.startPlunge(game);
        else this.startAttack('heavy', game);
        return;
      }
      if (a) return;
      if (In.pressed('heal') && this.onGround && !this.crouch) { this.startHeal(game); return; }
      if (In.pressed('spell')) { this.startSpell(game); return; }
      if ((In.pressed('interact') || (In.pressed('up') && this.onGround)) && game.tryInteract(this)) return;
    }

    jump(v, game, dbl) {
      this.vy = v; this.coyote = 0; this.onGround = false; this.jumping = true; this.action = null;
      In.consume('jump');
      if (this.crouch) this.setCrouch(false, game);
      VS.Audio.sfx('jump', { vol: dbl ? 0.8 : 0.5 });
      if (dbl) { VS.Gfx.burst(this.cx, this.bottom, 12, { color: '#d8c8b0', speed: 90, angle: Math.PI / 2, spread: 2.2, life: 0.45, size: 1.6 }); this.wingT = 0.35; VS.Audio.sfx('moth', { vol: 0.5 }); }
      else VS.Gfx.burst(this.cx, this.bottom, 5, { color: '#8a8078', speed: 50, angle: -Math.PI / 2, spread: 2.8, life: 0.3, size: 1.2 });
    }

    turnToInput(ax) { if (ax !== 0 && this.wallLock <= 0 && !this.climbing) this.facing = ax > 0 ? 1 : -1; }
    startAttack(name, game) {
      const mv = this.moves();
      const d = mv[name] || ATK[name] || mv.l1;
      if (!mv[name] && ATK[name]) name = name; // golpe genérico
      if (this.crouch && name !== 'crouch') this.setCrouch(false, game);
      const sp = this.weaponSpeed();
      this.action = { type: name === 'heavy' ? 'heavy' : 'attack', name, d, t: 0, phase: 'wind', wind: d.wind / sp, act: d.act / sp, rec: d.rec / sp, id: VS.Entity.newAttackId(), lungeV: 0, hitSomething: false, charge: 0, hits: 0 };
      this.combo = name; this.comboT = (d.wind + d.act + d.rec) / sp + 0.25;
      this.smear = []; this.trail.length = 0;
      if (name === 'riposte') this.riposteT = 0;
      if (name === 'heavy') { VS.Audio.sfx('charge', { vol: 0.5 }); }
    }
    startPlunge(game) {
      this.action = { type: 'plunge', t: 0, hover: true, id: VS.Entity.newAttackId(), phase: 'act' };
      this.vy = -60; this.vx *= 0.3;
      VS.Audio.sfx('swing_heavy');
    }
    startDodge(game, ax) {
      const air = !this.onGround;
      if (ax) this.facing = ax > 0 ? 1 : -1;
      if (this.crouch) this.setCrouch(false, game);
      const short = air && !this.st.abilities.dash;
      this.action = { type: 'dodge', t: 0, dur: air ? (short ? 0.13 : 0.2) : 0.34, air, short, dir: this.facing };
      if (air) { this.airDash = true; this.vy = 0; this.climbing = false; }
      this.dodgeCd = air ? 0.3 : 0.32;
      VS.Audio.sfx('dodge');
      VS.Gfx.burst(this.cx, this.bottom - 2, 8, { color: air ? '#c8b8a8' : '#7a7068', speed: 70, angle: this.facing > 0 ? Math.PI : 0, spread: 1, life: 0.4, size: 1.6 });
    }
    startParry(game) {
      this.action = { type: 'parry', t: 0, window: C.PARRY * this.st.fx('parryWindow', 1), guard: false, phase: 'act', success: false, canTurn: true };
      this.parryFlash = 0.6; this.swordAngle = -70 * D2R;
      VS.Audio.sfx('swing', { vol: 0.4 });
      // golpe que acabou de chegar (tolerância de atraso): ainda vai a tempo
      if (this.pendingHit) this.resolvePending(game, true);
    }
    // tolerância de atraso do parry: um golpe aparável que chega sem parry fica pendente PARRY_LATE s;
    // se o parry for premido nesse intervalo conta como parry perfeito, senão o dano aplica-se normalmente
    resolvePending(game, parried) {
      const ph = this.pendingHit; this.pendingHit = null; if (!ph) return;
      const hb = ph.hb, src = hb.src || hb.owner;
      if (parried) {
        const a = this.action; if (a) a.success = true;
        this.riposteT = 1.1; this.parryFlash = 1; this.st.lume = Math.min(100, this.st.lume + 25);
        game.onParry(hb, this);
        return;
      }
      this.takeDamage(hb.dmg, src ? Math.sign(this.cx - (src.cx !== undefined ? src.cx : hb.x)) || -this.dir : -this.dir, game, hb);
      if (src && src.K && src.K.onHitPlayer) src.K.onHitPlayer(src, hb, game);
    }
    startHeal(game) {
      const st = this.st;
      if (st.flasks <= 0) { VS.Audio.sfx('ui_back'); game.toast(VS.t('msg_no_flasks')); return; }
      if (st.hp >= st.hpMax) { game.toast(VS.t('msg_full_hp')); return; }
      this.action = { type: 'heal', t: 0, dur: 0.85 / st.fx('healSpeed', 1) };
      VS.Audio.sfx('charge', { vol: 0.4 });
    }
    startSpell(game) {
      const st = this.st;
      if (!st.abilities.spell) return;
      if (st.lume < 33) { game.toast(VS.t('msg_no_lume')); VS.Audio.sfx('ui_back'); return; }
      this.action = { type: 'spell', t: 0, fired: false };
    }

    // ---------- atualizar ação corrente ----------
    updateAction(dt, game, ax) {
      const a = this.action; a.t += dt;
      const st = this.st;
      if (a.type === 'attack' || a.type === 'heavy') {
        const d = a.d;
        // virar: na antecipação e no fim da recuperação vira-se para onde se carrega (sem isto, a bater e a carregar
        // para trás, continuava a bater para a frente, porque cada golpe novo começava ainda dentro do anterior)
        if (a.phase === 'wind' || (a.phase === 'rec' && a.t > a.rec * 0.3)) this.turnToInput(ax);
        // carregar o golpe pesado (Golpe de Forja)
        if (a.type === 'heavy' && a.phase === 'wind' && st.abilities.forge && In.down('heavy')) {
          a.charge += dt;
          const ccol = CHARGE_COL[st.weaponDef.trail] || CHARGE_COL.steel;
          if (a.t >= a.wind) { a.t = a.wind - 0.001; if (a.charge > 0.65 && !a.charged) { a.charged = true; VS.Audio.sfx('charge_ready'); VS.FX.chargeReady(this, ccol); } }
          if (a.charge > 2.2) a.charge = 2.2;
          VS.FX.charging(this, Math.min(1, a.charge / 0.65), 'rgb(' + ccol.join(',') + ')');
        }
        if (a.phase === 'wind' && a.t >= a.wind) {
          // o primeiro golpe varre desde a pose da antecipação (só a parte à frente do corpo)
          const wb = VS.HeroRender && VS.HeroRender.blade(this);
          if (wb) { const fx = (x) => (this.dir > 0 ? Math.max(this.cx, x) : Math.min(this.cx, x)); a.prevBlade = [fx(wb.x0), wb.y0, fx(wb.x1), wb.y1]; }
          a.phase = 'act'; a.t = 0; a.lungeV = (d.lunge || 0) * this.dir * (this.onGround ? 1 : 0);
          const wsfx = this.st.weaponDef.sfx || ['swing', 'swing_heavy'];
          VS.Audio.sfx(a.type === 'heavy' || d.kind === 'riposte' || d.mult >= 1.3 ? wsfx[1] : wsfx[0], { vol: 0.8 });
          a.prevAngle = this.swordAngle; a.prevBlade = null;
          if (d.wave) this.spiritWave(game, a);
        } else if (a.phase === 'act') {
          if (d.multi && a.t > (a.act / d.multi) * (a.hits + 1)) { a.hits++; a.id = VS.Entity.newAttackId(); }
          this.buildAttackHitbox(a, game);
          if (a.t >= a.act) { a.phase = 'rec'; a.t = 0; a.lungeV = 0; if (d.shock && this.onGround) this.shockwave(game, a); }
        } else if (a.phase === 'rec' && a.t >= a.rec) { this.action = null; }
        if (a.phase === 'act' && a.name === 'down' && this.onGround) { this.action = null; }
      } else if (a.type === 'plunge') {
        if (a.hover && a.t > 0.12) { a.hover = false; this.vy = 520; }
        if (!a.hover) {
          const hb = { x: this.cx - 9, y: this.bottom - 6, w: 18, h: 18, dmg: Math.round(st.damage('heavy') * 0.7), id: a.id, kind: 'heavy', poise: 30, knock: 200, kx: 0, ky: 1, pogo: true };
          this.attackHB = hb;
          if (Math.random() < 0.6) VS.Gfx.emit({ x: this.cx + U.rand(-4, 4), y: this.y, vy: -60, life: 0.3, size: 2, color: '#e0d0c0', shrink: true });
        }
        if (a.t > 1.6) this.action = null;
      } else if (a.type === 'dodge') {
        const k = a.t / a.dur;
        const sp = a.air ? (a.short ? 240 : 330) : U.lerp(300, 110, U.ease.inQuad(k));
        this.vx = a.dir * sp;
        if (a.air && !a.short) this.vy = 0;
        // invulnerabilidade limitada ao centro do movimento
        a.inv = a.air ? (a.short ? a.t > 0.02 && a.t < 0.09 : a.t > 0.02 && a.t < 0.15) : (a.t > 0.04 && a.t < 0.26);
        if (Math.random() < 0.7 || a.inv) { const cur = this.anim.cur; this.afterimages.push({ x: this.cx, y: this.bottom, dir: this.facing, a: a.inv ? 0.6 : 0.4, f: cur && cur.f, sh: cur && cur.sh, crouch: !a.air, inv: a.inv }); }
        // invulnerável: riscos de luz para trás (vê-se bem a janela da esquiva)
        if (a.inv && Math.random() < 0.9) VS.Gfx.emit({ x: this.cx - a.dir * U.rand(4, 12), y: this.y + U.rand(4, this.h - 2), vx: -a.dir * U.rand(160, 260), vy: 0, drag: 6, life: U.rand(0.12, 0.22), size: U.rand(2, 3.2), color: U.pick(['#d8ccff', '#a898f0', '#ffffff']), add: true, kind: 'line', layer: 2 });
        if (a.t >= a.dur) { this.action = null; if (!a.air) this.vx *= 0.5; }
      } else if (a.type === 'parry') {
        if (!a.guard && a.t >= a.window) {
          if (In.down('parry') && !a.success) { a.guard = true; a.free = false; }
          else if (a.t >= a.window + 0.22 || a.success) this.action = null;
        }
        if (a.guard && !In.down('parry')) this.action = null;
      } else if (a.type === 'heal') {
        if (Math.random() < 0.5) VS.Gfx.emit({ x: this.cx + U.rand(-8, 8), y: this.bottom - U.rand(0, 20), vy: -40, life: 0.6, size: 1.4, color: '#ffd080', add: true, shrink: true });
        if (a.t >= a.dur) {
          st.flasks--; const amt = Math.round(st.hpMax * 0.45 * st.fx('healAmount', 1));
          st.hp = Math.min(st.hpMax, st.hp + amt); this.healGlow = 0.8;
          VS.Audio.sfx('heal'); VS.Gfx.burst(this.cx, this.cy, 20, { color: '#ffd890', speed: 90, life: 0.7, size: 1.8, add: true });
          this.action = null;
        }
      } else if (a.type === 'spell') {
        if (!a.fired && a.t > 0.14) {
          a.fired = true; st.lume -= 33;
          game.spawn(new VS.Projectile({ x: this.cx + this.dir * 12, y: this.cy - 4, vx: this.dir * 380, vy: 0, w: 12, h: 10, team: 'player', dmg: st.spellDamage(), kind: 'spark', color: '#ffb040', life: 1.4, trail: true, pierce: 1, poise: 25, knock: 200, breaksSwitch: true }));
          VS.Audio.sfx('spell'); this.vx = -this.dir * 60;
        }
        if (a.t > 0.42) this.action = null;
      } else if (a.type === 'hurt') {
        if (a.t > 0.28) this.action = null;
      } else if (a.type === 'rest') {
        if (a.t > (a.dur || 1.2)) this.action = null;
      } else if (a.type === 'pickup') {
        if (a.t > 0.5) this.action = null;
      }
    }

    // posição do ombro e lâmina (em coordenadas do mundo)
    shoulder() { return { x: this.cx + this.dir * 1, y: this.bottom - (this.crouch ? 15 : 23) }; }
    bladePoints(angle, reach) {
      const s = this.shoulder();
      const ca = Math.cos(angle), sa = Math.sin(angle);
      const r0 = 6 + (reach || 0), r1 = 33 + (reach || 0);
      return { x0: s.x + this.dir * ca * r0, y0: s.y + sa * r0, x1: s.x + this.dir * ca * r1, y1: s.y + sa * r1 };
    }
    buildAttackHitbox(a, game) {
      const d = a.d, st = this.st, w = st.weaponDef;
      const HR = VS.HeroRender;
      if (HR) HR.update(this, 0);
      const b = HR && HR.blade(this);
      let pts = [];
      let tip, mid;
      if (b) {
        const cur = [b.x0, b.y0, b.x1, b.y1];
        const segs = [cur]; if (a.prevBlade) segs.push(a.prevBlade);
        a.prevBlade = cur; a.bladeSegs = segs;
        for (const [x0, y0, x1, y1] of segs) pts.push([x0, y0], [x1, y1], [(x0 + x1) / 2, (y0 + y1) / 2]);
        tip = { x: b.x1, y: b.y1 }; mid = { x: (b.x0 + b.x1) / 2, y: (b.y0 + b.y1) / 2 };
        // direção do corte = movimento da ponta; a crescente curva-se para fora (lado oposto à pega)
        const pt = a.prevTip || [b.x1 - this.dir * 6, b.y1 + 4];
        let mx = b.x1 - pt[0], my = b.y1 - pt[1];
        if (Math.hypot(mx, my) < 0.5) { mx = -Math.sin(b.a) * this.dir; my = Math.cos(b.a) * this.dir; }
        a.cutA = Math.atan2(my, mx);
        const rx = b.x1 - b.x0, ry = b.y1 - b.y0;
        a.cutBend = rx * Math.sin(a.cutA) - ry * Math.cos(a.cutA) > 0 ? 1 : -1;
        a.prevTip = [b.x1, b.y1];
      } else { // reserva: geometria antiga (sem folhas de sprites)
        const prev = a.prevAngle !== undefined ? a.prevAngle : this.swordAngle, curA = this.swordAngle;
        for (let i = 0; i <= 4; i++) { const bb = this.bladePoints(U.lerp(prev, curA, i / 4), this.swordReach); pts.push([bb.x0, bb.y0], [bb.x1, bb.y1]); }
        a.prevAngle = curA;
        const bb = this.bladePoints(curA, this.swordReach); tip = { x: bb.x1, y: bb.y1 }; mid = { x: (bb.x0 + bb.x1) / 2, y: (bb.y0 + bb.y1) / 2 };
      }
      let minX = 1e9, minY = 1e9, maxX = -1e9, maxY = -1e9;
      for (const [px, py] of pts) { minX = Math.min(minX, px); maxX = Math.max(maxX, px); minY = Math.min(minY, py); maxY = Math.max(maxY, py); }
      const pad = w.cls === 'malho' || w.cls === 'montante' ? 4 : 3;
      if (a.type === 'attack' && /^(l\d|air2?)$/.test(a.name)) minY -= 9;
      const kind = d.kind || (a.type === 'heavy' ? 'heavy' : 'light');
      let dmg = st.damage(kind === 'riposte' ? 'riposte' : kind) * (d.mult || 1);
      if (a.charged) dmg *= 1.5;
      this.attackHB = { x: minX - pad, y: minY - pad, w: maxX - minX + pad * 2, h: maxY - minY + pad * 2, dmg: Math.round(dmg), id: a.id, kind, poise: (d.poise || 10) * (a.charged ? 1.6 : 1), knock: d.knock || 150, kx: this.dir, ky: a.name === 'up' ? -1 : a.name === 'down' ? 1 : 0, pogo: d.pogo, hitstop: d.hitstop, breaksCracked: a.charged && st.abilities.forge, name: a.name,
        weapon: w, spirit: !!w.spirit, armorBreak: !!w.armorBreak, guardBreak: !!w.guardBreak, mat: w.mat, tipX: tip.x, tipY: tip.y,
        cutA: a.cutA, cutBend: a.cutBend, mark: MARK[w.trail] || 'blade' };
      // a lâmina toca na parede: faíscas, quebrar paredes falsas/rachadas (amostras ao longo de toda a lâmina e do arco)
      const cells = [[Math.floor(tip.x / T), Math.floor(tip.y / T)], [Math.floor(mid.x / T), Math.floor(mid.y / T)]];
      for (const [x0, y0, x1, y1] of (a.bladeSegs || [])) for (const k of [0.45, 0.7]) cells.push([Math.floor(A_(x0, x1, k) / T), Math.floor(A_(y0, y1, k) / T)]);
      // primeiro o que se pode partir; depois o tinido na pedra
      cells.sort((p, q) => { const r = (c) => { const ch = game.room.tile(c[0], c[1]); return ch === 'F' || ch === 'C' ? 0 : 1; }; return r(p) - r(q); });
      for (const [cx, cy] of cells) {
        const ch = game.room.tile(cx, cy);
        if (!ch || game.room.broken[cx + ',' + cy]) continue;
        if (ch === 'F' || (ch === 'C' && this.attackHB.breaksCracked)) { game.breakWall(cx, cy); a.hitSomething = true; break; }
        if ((ch === '#' || ch === 'C' || ch === 'X') && !a.clanged) {
          a.clanged = true;
          VS.Audio.sfx('block', { vol: 0.5 });
          VS.FX && VS.FX.impact(tip.x, tip.y, 'stone', this.dir, 0.6);
          if (ch === 'C' && !st.abilities.forge) game.hint('hint_cracked');
          else if (ch === 'C' && st.abilities.forge && !a.charged) game.hint('hint_charge');
          if (a.name === 'down') this.pogo();
        }
      }
    }
    // Lâmina do Espírito: liberta uma onda espiritual no golpe final e no carregado
    spiritWave(game, a) {
      const st = this.st;
      game.spawn(new VS.Projectile({ x: this.cx + this.dir * 14, y: this.cy - 4, vx: this.dir * 300, vy: 0, w: 14, h: 22, team: 'player', dmg: Math.round(st.damage('light') * 0.7 * (a.charged ? 1.6 : 1)), kind: 'spiritwave', color: '#c8b0ff', life: 0.55, pierce: 3, poise: 18, knock: 160, spirit: true, solid: false }));
      VS.Audio.sfx('spirit_swing', { vol: 0.6 });
    }
    // Malho: o golpe carregado abre ondas de choque no chão
    shockwave(game, a) {
      const st = this.st;
      for (const sd of [-1, 1]) game.spawn(new VS.Projectile({ x: this.cx + sd * 10, y: this.bottom - 6, vx: sd * 230, vy: 0, w: 16, h: 10, team: 'player', dmg: Math.round(st.damage('heavy') * 0.45), kind: 'shockwave', color: '#d0a070', life: 0.5, solid: false, poise: 30, knock: 220 }));
      VS.Gfx.addShake(0.35); VS.Audio.sfx('crush');
      VS.FX && VS.FX.impact(this.cx + this.dir * 16, this.bottom, 'stone', this.dir, 1.4);
    }
    pogo() { this.vy = -390; this.airDash = false; this.doubleUsed = false; if (this.action && this.action.name === 'down') this.action.phase = 'rec'; }
    plungeImpact(game) {
      const a = this.action; if (!a) return;
      game.addHitbox({ x: this.cx - 32, y: this.bottom - 14, w: 64, h: 16, dmg: Math.round(this.st.damage('heavy') * 0.6), id: VS.Entity.newAttackId(), kind: 'heavy', poise: 30, knock: 220, kx: 0, ky: -1, owner: this });
      VS.Gfx.addShake(0.35); VS.Audio.sfx('crush');
      VS.Gfx.burst(this.cx, this.bottom, 22, { color: '#c0b0a0', speed: 160, angle: -Math.PI / 2, spread: 2.6, life: 0.5, size: 2, g: 300 });
      VS.FX.impact(this.cx, this.bottom - 1, 'stone', this.dir, 1.6);
      a.type = 'hurt'; a.t = 0.1; // pequena recuperação
    }

    // ---------- golpes recebidos ----------
    // devolve: 'parry' | 'block' | 'dodge' | 'hit' | 'immune'
    receiveHit(hb, game) {
      const st = this.st;
      if (this.action && this.action.type === 'dead') return 'immune';
      const a = this.action;
      if (a && a.type === 'dodge' && a.inv) { this.perfectDodge(game); return 'dodge'; }
      if (this.iframes > 0) return 'immune';
      const src = hb.src || hb.owner;
      const fromFront = this.facesHit(hb, src);
      if (a && a.type === 'parry' && !hb.unblockable && hb.parryable !== false) {
        // o parry só conta de frente: de costas para o golpe a lâmina não o apanha
        if (!a.guard && a.t <= a.window + 0.02 && fromFront) {
          // PARRY
          a.success = true; this.riposteT = 1.1; this.parryFlash = 1;
          st.lume = Math.min(100, st.lume + 25);
          game.onParry(hb, this);
          return 'parry';
        }
        if (a.guard && fromFront) {
          const chip = Math.max(1, Math.round(hb.dmg * 0.25 * (st.buffs.incense > 0 ? 0.7 : 1)));
          st.hp -= chip; this.vx = -this.dir * 140; VS.Audio.sfx('block'); VS.Gfx.addShake(0.12);
          VS.FX.block(this.cx + this.dir * 10, this.cy - 4, -this.dir);
          if (st.hp <= 0) { st.hp = 0; this.die(game); }
          return 'block';
        }
      }
      const lateOk = !hb.unblockable && hb.parryable !== false && !hb.projectile && !this.pendingHit && fromFront && !(a && (a.type === 'hurt' || a.type === 'heal' || a.type === 'parry' && a.guard));
      if (lateOk) { this.pendingHit = { hb, t: C.PARRY_LATE }; return 'pending'; }
      this.takeDamage(hb.dmg, src ? Math.sign(this.cx - (src.cx !== undefined ? src.cx : hb.x)) || -this.dir : -this.dir, game, hb);
      return 'hit';
    }
    // o golpe vem da frente? corpo a corpo: posição de quem ataca; projétil: posição e sentido do voo
    facesHit(hb, src) {
      const d = this.dir;
      if (hb.projectile && src) {
        const ahead = (src.cx - this.cx) * d >= -8;
        const towardFace = !((src.vx || 0) * d > 30); // a voar no mesmo sentido para onde olho = vem pelas costas
        return ahead && towardFace;
      }
      if (!src) return true;
      const sx = src.cx !== undefined ? src.cx : hb.x + hb.w / 2;
      const tol = Math.min(16, Math.max(6, (src.w || 0) * 0.2));
      return (sx - this.cx) * d >= -tol;
    }
    perfectDodge(game) {
      if (this.action.perfect) return; this.action.perfect = true;
      VS.Gfx.burst(this.cx, this.cy, 10, { color: '#d0c0ff', speed: 60, life: 0.4, size: 1.4, add: true });
    }
    takeDamage(dmg, kdir, game, hb) {
      const st = this.st;
      if (game.god) dmg = 0;
      if (st.buffs.incense > 0) dmg *= 0.7;
      dmg = Math.max(1, Math.round(dmg));
      st.hp -= dmg;
      this.flash = 0.25; this.iframes = C.IFRAMES;
      VS.Audio.sfx('hurt'); VS.Gfx.addShake(0.45); VS.Gfx.flash('#a01010', 0.24); VS.Gfx.hurt = 1;
      game.hitstop(0.08);
      st.lume = Math.min(100, st.lume + st.fx('lumeOnHurt', 0));
      VS.FX.hurt(this.cx, this.cy - 4, kdir);
      if (this.crouch) this.setCrouch(false, game);
      // recuo mais claro (os golpes que empurram — investida, onda de choque — trazem a força no 'knock')
      if (!st.fx('noKnockback', false)) { this.vx = kdir * (hb && !hb.projectile && hb.knock > 230 ? hb.knock : 230); this.vy = -235; }
      this.action = { type: 'hurt', t: 0 };
      if (st.hp <= 0) { st.hp = 0; this.die(game); }
    }
    hazardHit(game) {
      const st = this.st;
      if (this.action && this.action.type === 'dead') return;
      st.hp -= 20; VS.Audio.sfx('spike'); VS.Audio.sfx('hurt'); VS.Gfx.addShake(0.4); VS.Gfx.flash('#a01010', 0.3);
      if (st.hp <= 0) { st.hp = 0; this.die(game); return; }
      this.iframes = 1.0; this.flash = 0.3;
      game.respawnAtSafe(this);
    }
    checkHazards(dt, game) {
      if (this.iframes > 0.5 || (this.action && this.action.type === 'dead')) return;
      const box = { x: this.x + 2, y: this.y + 4, w: this.w - 4, h: this.h - 4 };
      const hit = VS.World.rectTouches(game.room, box, (tx, ty) => game.room.isHazard(tx, ty));
      if (hit) {
        // golpe descendente nos picos: ricochete em vez de dano
        if (this.action && this.action.name === 'down' && this.action.phase === 'act' && game.room.tile(hit.tx, hit.ty) === '^' && hit.ty * T > this.cy) { this.pogo(); VS.Audio.sfx('block', { vol: 0.5 }); return; }
        this.hazardHit(game);
      }
    }
    nearHazard(game) {
      const box = { x: this.x - 24, y: this.y - 4, w: this.w + 48, h: this.h + 24 };
      return !!VS.World.rectTouches(game.room, box, (tx, ty) => game.room.isHazard(tx, ty) || game.room.tile(tx, ty) === 'X');
    }
    die(game) {
      if (this.action && this.action.type === 'dead') return;
      this.action = { type: 'dead', t: 0 };
      this.vx = 0; this.iframes = 99;
      VS.Audio.sfx('death'); VS.Gfx.addShake(0.6); game.hitstop(0.25); VS.Gfx.flash('#200000', 0.5);
    }
    updateDead(dt, game) {
      const a = this.action; a.t += dt;
      if (a.t > 0.5 && a.t < 1.6 && Math.random() < 0.8) VS.Gfx.emit({ x: this.cx + U.rand(-8, 8), y: this.y + U.rand(0, this.h), vx: U.rand(-20, 20), vy: U.rand(-60, -20), life: 1.2, size: U.rand(1, 2.5), color: U.pick(['#6a6068', '#3a3438', '#ff9040']), kind: 'flake', vr: U.rand(-5, 5) });
      if (a.t > 2.0 && !a.done) { a.done = true; game.onPlayerDeath(); }
    }

    // ---------- animação ----------
    animate(dt, game) {
      const a = this.action;
      let target = this.onGround && Math.abs(this.vx) > 20 ? RUN_ANGLE : REST_ANGLE;
      if (!this.onGround) target = this.vy < 0 ? 120 * D2R : 100 * D2R;
      if (this.wallDir) target = 150 * D2R;
      this.swordReach = U.approach(this.swordReach, 0, dt * 120);
      if (a && (a.type === 'attack' || a.type === 'heavy')) {
        const d = a.d, a0 = d.a0 * D2R, a1 = d.a1 * D2R;
        if (a.phase === 'wind') {
          const k = U.ease.outCubic(Math.min(1, a.t / a.wind));
          this.swordAngle = U.lerp(this.swordAngle, a0, Math.min(1, k * 0.9 + 0.1));
          if (d.thrust) this.swordReach = -8 * k;
        } else if (a.phase === 'act') {
          const k = U.ease.outCubic(Math.min(1, a.t / a.act));
          this.swordAngle = U.lerp(a0, a1, k);
          if (d.thrust) this.swordReach = U.lerp(-8, 12, k);
          this.smear.push(this.swordAngle);
        } else {
          const k = U.ease.inOutQuad(Math.min(1, a.t / a.rec));
          this.swordAngle = U.lerp(a1, target, k * 0.85);
          if (d.thrust) this.swordReach = U.lerp(12, 0, k);
        }
      } else if (a && a.type === 'plunge') this.swordAngle = U.approach(this.swordAngle, 90 * D2R, dt * 20);
      else if (a && a.type === 'parry') this.swordAngle = U.approach(this.swordAngle, (a.guard ? -55 : -70) * D2R, dt * 40);
      else if (a && a.type === 'heal') this.swordAngle = U.approach(this.swordAngle, 95 * D2R, dt * 10);
      else if (a && a.type === 'spell') this.swordAngle = U.approach(this.swordAngle, -30 * D2R, dt * 30);
      else {
        // espada com inércia: segue o alvo com atraso (não "colada" à mão)
        const lag = 1 - Math.exp(-dt * 14);
        this.swordAngle += (target + Math.sin(this.t * 2) * 0.04 - this.swordAngle) * lag;
      }
      if (!a || (a.type !== 'attack' && a.type !== 'heavy')) this.smear.length = 0;
      if (this.smear.length > 14) this.smear.shift();
      // ciclo de corrida e passos (passada do sprite: sem deslizar os pés)
      if (this.onGround && Math.abs(this.vx) > 15) {
        const prev = this.runPhase;
        const cyc = this.crouch ? 30 : Math.abs(this.vx) > 95 ? 68 : 40;
        this.runPhase += dt * Math.abs(this.vx) / cyc * U.TAU;
        if (Math.floor(prev / Math.PI) !== Math.floor(this.runPhase / Math.PI)) this.footstep(game);
      }
      // temporizadores de estado para as animações
      this.airT = this.onGround ? 0 : this.airT + dt;
      this.landT = Math.max(0, this.landT - dt);
      this.turnT = Math.max(0, this.turnT - dt);
      this.crouchT = this.crouch ? this.crouchT + dt : 0;
      if (this.facing !== this.lastFacing && this.onGround && !a) this.turnT = 0.14;
      this.lastFacing = this.facing;
      if (VS.HeroRender) {
        VS.HeroRender.update(this, dt);
        VS.HeroRender.pushTrail(this, a && (a.type === 'attack' || a.type === 'heavy' || a.type === 'plunge') && (a.phase === 'act' || (a.phase === 'rec' && a.t < 0.04)));
      }
      this.afterimages.forEach((g) => (g.a -= dt * 2.2));
      this.afterimages = this.afterimages.filter((g) => g.a > 0);
      if (this.wingT > 0) this.wingT -= dt;
      if (!a && this.onGround && Math.abs(this.vx) < 5) this.idleT += dt; else this.idleT = 0;
    }
    footstep(game) {
      const tx = Math.floor(this.cx / T), ty = Math.floor((this.bottom + 2) / T);
      const ch = game.room.tile(tx, ty);
      let s = game.room.R.surface || 'stone';
      if (ch === '=') s = game.room.R.key === 'r3' ? 'metal' : 'wood';
      if (this.inWater || game.room.isWater(tx, ty - 1)) s = 'water';
      VS.Audio.sfx('step_' + (s === 'grass' ? 'soft' : s), { vol: 0.35 });
      if (Math.random() < 0.5) VS.Gfx.emit({ x: this.cx - this.dir * 4, y: this.bottom, vx: -this.dir * 20, vy: -15, life: 0.35, size: 1.2, color: game.room.R.top || '#888' });
    }
    updateCloak(dt) {
      // corrente de pontos com verlet ancorada aos ombros
      const s = { x: this.cx - this.dir * 2.5, y: this.bottom - (this.crouch ? 15 : 25) };
      const pts = this.cloak, seg = this.crouch ? 2.6 : 3.8;
      pts[0].x = s.x; pts[0].y = s.y;
      for (let i = 1; i < pts.length; i++) {
        const p = pts[i];
        const vx = (p.x - p.px) * 0.86, vy = (p.y - p.py) * 0.86;
        p.px = p.x; p.py = p.y;
        p.x += vx - this.vx * dt * 0.06 + Math.sin(this.t * 3 + i) * 0.06;
        p.y += vy + 26 * dt * dt * 60;
      }
      for (let k = 0; k < 3; k++) for (let i = 1; i < pts.length; i++) {
        const a = pts[i - 1], b = pts[i];
        const dx = b.x - a.x, dy = b.y - a.y, dd = Math.hypot(dx, dy) || 1;
        const diff = (dd - seg) / dd;
        b.x -= dx * diff; b.y -= dy * diff;
      }
      // um cachecol não sobe a direito por cima da cabeça (a cair depressa esvoaça só um pouco acima do pescoço)
      for (let i = 1; i < pts.length; i++) { const q = pts[i]; const lim = s.y - 3 - i * 0.6; if (q.y < lim) { q.y = lim; q.py = Math.min(q.py, lim + 0.5); } }
    }
    hurtbox() { return { x: this.x + 1, y: this.y + 2, w: this.w - 2, h: this.h - 2 }; }
    emitLight() {
      // luz própria (brasa no peito)
      const a = this.action;
      let lk = a && a.type === 'dead' ? Math.max(0, 1 - a.t / 2) : 1;
      // ao despertar a luz nasce da brasa: quase apagada, acende e cresce
      if (a && a.type === 'wake') lk = a.t < a.hold ? 0.18 + 0.06 * Math.sin(a.t * 9) : Math.min(1.25, 0.25 + (a.t - a.hold) * 0.9);
      const lr = 95 * this.st.fx('lightRadius', 1) * lk;
      VS.Gfx.light(this.cx, this.cy - 4, lr, '#ffb070', 0.9, 1);
      if (this.action && this.action.type === 'heal') VS.Gfx.light(this.cx + this.dir * 6, this.cy, 70, '#ffc070', 0.8, 2);
    }
    draw(ctx, game) {
      if (VS.HeroRender) { VS.HeroRender.drawTrail(ctx, this); if (VS.HeroRender.draw(ctx, this, game)) return; }
      VS.Sprites.player(ctx, this, game);
    }
  }
  Player.C = C; Player.ATK = ATK;
  VS.Player = Player;
})(window.VS);
