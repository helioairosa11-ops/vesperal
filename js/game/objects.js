// Vesperal — objetos do mundo: altares, itens, inscrições, portas, alavancas, NPCs, eco, armadilhas, plataformas
'use strict';
(function (VS) {
  const U = VS.U, T = U.TILE, G = VS.Gfx, A = VS.Audio, S = () => VS.Sprites;
  const O = {};

  // ---------- Altar de Brasa (descanso, viagem) ----------
  class Altar extends VS.Entity {
    constructor(d) { super(d.x * T - 4, (d.y + 1) * T - 26, 28, 26); this.isAltar = true; this.altarId = d.id; this.nameKey = d.name || ('altar_' + d.id); this.interactable = true; this.range = 30; this.z = -1; }
    get lit() { return !!VS.state.altars[this.altarId]; }
    interact(game) { game.rest(this); }
    promptKey() { return 'act_rest'; }
    update(dt, game) { super.update(dt, game); if (this.lit && Math.random() < 0.4) G.emit({ x: this.cx + U.rand(-5, 5), y: this.y + 2, vx: U.rand(-8, 8), vy: U.rand(-50, -20), life: 0.9, size: U.rand(1, 2), color: U.pick(['#ffb040', '#ff7020', '#ffe0a0']), add: true, shrink: true }); }
    emitLight() { G.light(this.cx, this.y, this.lit ? 150 : 50, '#ffa040', this.lit ? 1 : 0.4, 2); }
    draw(ctx, game) { VS.SpritesObj.altar(ctx, this); }
  }
  // ---------- Eco (cinza perdida na morte) ----------
  class Shade extends VS.Entity {
    constructor(x, y, ash) { super(x, y, 14, 28); this.ash = ash; this.z = 4; }
    update(dt, game) {
      super.update(dt, game);
      const p = game.player;
      if (U.overlap(this, p) && !(p.action && p.action.type === 'dead')) {
        VS.state.ash += this.ash; VS.state.shade = null; this.remove = true;
        A.sfx('shade'); A.sfx('pickup'); game.toast(VS.t('msg_shade', { n: this.ash }));
        G.burst(this.cx, this.cy, 30, { color: '#b0a0ff', speed: 120, life: 0.8, size: 1.8, add: true });
        game.save();
      }
      if (Math.random() < 0.3) G.emit({ x: this.cx + U.rand(-6, 6), y: this.bottom - U.rand(0, 26), vy: -20, life: 1, size: 1.4, color: '#9080e0', add: true, shrink: true });
    }
    emitLight() { G.light(this.cx, this.cy, 60, '#9080ff', 0.6, 1); }
    draw(ctx) { VS.SpritesObj.shade(ctx, this); }
  }
  // ---------- Cinza que voa para o jogador ----------
  class AshOrb extends VS.Entity {
    constructor(x, y, v) { super(x, y, 4, 4); this.v = v; this.vx = U.rand(-120, 120); this.vy = U.rand(-200, -80); this.life = 0; this.z = 6; }
    update(dt, game) {
      this.life += dt; const p = game.player;
      if (this.life < 0.35) { this.vy += 600 * dt; this.vx *= 0.96; }
      else { const a = Math.atan2(p.cy - this.cy, p.cx - this.cx); const sp = 200 + this.life * 500; this.vx = U.lerp(this.vx, Math.cos(a) * sp, 0.15); this.vy = U.lerp(this.vy, Math.sin(a) * sp, 0.15); }
      this.x += this.vx * dt; this.y += this.vy * dt;
      if (this.life > 0.35 && Math.hypot(p.cx - this.cx, p.cy - this.cy) < 10 || this.life > 3) {
        VS.state.ash += this.v; this.remove = true; A.sfx('ash', { vol: 0.25 });
      }
    }
    draw(ctx) { VS.Sprites.glow(ctx, this.cx, this.cy, 6, '#ffd0a0', 0.8); ctx.fillStyle = '#fff0d0'; ctx.fillRect(this.cx - 1, this.cy - 1, 2, 2); }
  }
  // ---------- Item no chão ----------
  class Pickup extends VS.Entity {
    constructor(d, key) { super(d.x * T + 4, (d.y + 1) * T - 14, 12, 14); this.item = d.item; this.n = d.n || 1; this.key = key; this.interactable = true; this.range = 26; this.z = 3; this.letter = /^letter_/.test(d.item); }
    interact(game) {
      const st = VS.state;
      st.give(this.item, this.n);
      st.collected[this.key] = true;
      this.remove = true;
      const it = VS.ITEMS[this.item];
      A.sfx(it.cat === 'material' || it.cat === 'consumable' ? 'pickup' : 'pickup_big');
      game.player.action = { type: 'pickup', t: 0 };
      VS.UI.itemGet(this.item, this.n);
      if (this.letter) VS.UI.letter(this.item);
      if (this.onTake) this.onTake(game);
      game.save();
    }
    promptKey() { return 'act_take'; }
    update(dt, game) { super.update(dt, game); if (Math.random() < 0.25) G.emit({ x: this.cx + U.rand(-4, 4), y: this.cy + U.rand(-2, 4), vy: -25, life: 0.8, size: 1.2, color: this.letter ? '#ffe8c0' : '#fff0d0', add: true, shrink: true }); }
    emitLight() { G.light(this.cx, this.cy, 50, this.letter ? '#ffe0b0' : '#ffd8a0', 0.7, 1); }
    draw(ctx) { VS.SpritesObj.pickup(ctx, this); }
  }
  // ---------- Arma cravada (relicário de uma arma: ex. a Lâmina do Espírito no Ossário) ----------
  class WeaponShrine extends Pickup {
    constructor(d, key) { super(d, key); this.x = d.x * T - 2; this.y = (d.y + 1) * T - 34; this.w = 24; this.h = 34; this.wid = VS.ITEMS[d.item].weapon; this.range = 30; this.z = -1; }
    update(dt, game) {
      VS.Entity.prototype.update.call(this, dt, game);
      if (Math.random() < 0.3) G.emit({ x: this.cx + U.rand(-5, 5), y: this.y + U.rand(4, 30), vx: U.rand(-6, 6), vy: U.rand(-24, -8), wobble: 4, life: 1.4, size: U.rand(0.8, 1.6), color: U.pick(['#c8b0ff', '#e8dcff', '#9a7ae0']), add: true, kind: 'glow' });
    }
    emitLight() { G.light(this.cx, this.y + 14, 70, '#b8a0ff', 0.8 + Math.sin(this.t * 2) * 0.1, 1); }
    draw(ctx) {
      const im = VS.Assets.img('weapons/w_' + this.wid + '.png'), m = VS.WEAPON_META && VS.WEAPON_META[this.wid];
      const gx = this.cx, gy = this.bottom - 3;
      // fenda no chão onde a lâmina entrou
      ctx.fillStyle = 'rgba(10,8,12,0.75)'; ctx.beginPath(); ctx.ellipse(gx + 1, gy + 2, 7, 1.6, 0, 0, U.TAU); ctx.fill();
      if (VS.Assets.ok(im) && m) {
        // cravada de ponta para baixo, ligeiramente inclinada; respira com uma luz fria
        ctx.save(); ctx.translate(gx, gy - m.len + 2); ctx.rotate(Math.PI / 2 - 0.12);
        ctx.globalAlpha = 1; ctx.drawImage(im, -m.ox / m.scale, -m.oy / m.scale, im.naturalWidth / m.scale, im.naturalHeight / m.scale);
        ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.25 + Math.sin(this.t * 2.2) * 0.12;
        ctx.drawImage(im, -m.ox / m.scale, -m.oy / m.scale, im.naturalWidth / m.scale, im.naturalHeight / m.scale);
        ctx.restore();
      }
    }
  }
  // ---------- Urna de cinza (partível) ----------
  class Urn extends VS.Entity {
    constructor(d, key) { super(d.x * T + 3, (d.y + 1) * T - 16, 14, 16); this.key = key; this.hittable = true; this.z = -1; this.v = d.v || 25; }
    onHit(hb, game) {
      this.remove = true; VS.state.collected[this.key] = true; A.sfx('break', { vol: 0.6 });
      G.burst(this.cx, this.cy, 14, { color: '#5a4a3a', speed: 120, g: 500, life: 0.8, size: 2, kind: 'flake', vr: 6, collide: true });
      const n = Math.min(5, Math.ceil(this.v / 10)); for (let i = 0; i < n; i++) game.spawn(new AshOrb(this.cx, this.cy, Math.round(this.v / n * VS.state.fx('ashGain', 1))));
      return true;
    }
    draw(ctx, game) { VS.SpritesObj.urn(ctx, this, game.room.R); }
  }
  // ---------- Inscrição ----------
  class Inscription extends VS.Entity {
    constructor(d) { super(d.x * T - 2, (d.y + 1) * T - 22, 24, 22); this.iid = d.id; this.interactable = true; this.range = 26; this.z = -1; }
    interact(game) {
      const st = VS.state;
      const first = !st.inscriptions[this.iid];
      st.inscriptions[this.iid] = true;
      A.sfx('ui_open');
      VS.UI.inscription(this.iid, first);
      if (first) game.save();
    }
    promptKey() { return 'act_read'; }
    emitLight() { if (!VS.state.inscriptions[this.iid]) G.light(this.cx, this.y + 6, 40, '#a0c0ff', 0.5, 1); }
    draw(ctx, game) { VS.SpritesObj.inscription(ctx, this, game.room.R, !!VS.state.inscriptions[this.iid]); }
  }
  // ---------- Porta / portão ----------
  class Door extends VS.Entity {
    constructor(d) {
      super(d.x * T, d.y * T, (d.w || 1) * T, (d.h || 3) * T);
      this.did = d.id; this.open = d.open || ''; this.tx = d.x; this.ty = d.y; this.th = d.h || 3; this.tw = d.w || 1; this.z = 2;
      this.horizontal = this.tw > 1;
      this.isOpen = this.checkOpen(); this.anim = this.isOpen ? 1 : 0; this.style = d.style || 'gate';
      this.interactable = /^side:|^key:|^embers:/.test(this.open) && !this.isOpen; this.range = 34;
      this.isBossGate = this.open === 'bossgate'; if (this.isBossGate) { this.isOpen = true; this.anim = 1; }
    }
    checkOpen() {
      const st = VS.state;
      if (st.shortcuts[this.did]) return true;
      const [k, v] = this.open.split(':');
      if (k === 'boss') return !!st.bosses[v];
      if (k === 'flag') return !!st.flags[v];
      if (k === 'ability') return !!st.abilities[v];
      return false;
    }
    onSpawn(game) { this.applySolid(game); }
    applySolid(game) {
      for (let i = 0; i < this.th; i++) for (let j = 0; j < this.tw; j++) { const k = (this.tx + j) + ',' + (this.ty + i); if (this.isOpen) delete game.room.dyn[k]; else game.room.dyn[k] = 1; }
    }
    setOpen(game, open, silent) {
      if (this.isOpen === open) return;
      this.isOpen = open; this.applySolid(game);
      if (open && !this.isBossGate) VS.state.shortcuts[this.did] = true;
      if (!silent) { A.sfx('door'); G.addShake(0.2); }
      this.interactable = false;
    }
    close(game) { this.isOpen = true; this.setOpen(game, false); }
    canInteract(game) {
      if (this.isOpen) return false;
      const [k, v] = this.open.split(':');
      if (k === 'side') { const p = game.player; return v === 'L' ? p.cx < this.cx : p.cx > this.cx; }
      return true;
    }
    interact(game) {
      const st = VS.state, [k, v] = this.open.split(':');
      if (k === 'side') { this.setOpen(game, true); game.toast(VS.t('msg_shortcut')); game.save(); }
      else if (k === 'key') { if (st.has(v)) { this.setOpen(game, true); game.toast(VS.t('msg_unlocked')); game.save(); } else { A.sfx('ui_back'); game.toast(VS.t('msg_locked')); } }
      else if (k === 'embers') { const need = parseInt(v, 10); if (st.embers >= need || st.flags.embersPlaced >= need) { this.setOpen(game, true); game.toast(VS.t('msg_palace_open')); game.save(); } else { A.sfx('ui_back'); game.toast(VS.t('msg_need_embers', { n: need, have: st.embers })); } }
    }
    promptKey() { const [k] = this.open.split(':'); return k === 'side' ? 'act_open' : 'act_open'; }
    update(dt, game) {
      super.update(dt, game);
      if (!this.isOpen && this.checkOpen()) this.setOpen(game, true);
      this.anim = U.approach(this.anim, this.isOpen ? 1 : 0, dt * 2.5);
    }
    draw(ctx, game) { VS.SpritesObj.door(ctx, this, game.room.R); }
  }
  // ---------- Alavanca ----------
  class Lever extends VS.Entity {
    constructor(d) { super(d.x * T + 4, (d.y + 1) * T - 18, 12, 18); this.lid = d.id; this.door = d.door; this.hittable = true; this.interactable = true; this.range = 24; this.pulled = !!VS.state.shortcuts[d.door] || !!VS.state.flags['lever_' + d.id]; this.z = -1; this.ang = this.pulled ? 1 : 0; }
    canInteract() { return !this.pulled; }
    interact(game) { this.pull(game); }
    onHit(hb, game) { if (this.pulled) return false; this.pull(game); return true; }
    pull(game) {
      this.pulled = true; VS.state.flags['lever_' + this.lid] = true; A.sfx('lever');
      this.interactable = false; this.hittable = false;
      if (this.door) { VS.state.shortcuts[this.door] = true; const d = game.ents.find((e) => e.did === this.door); if (d) d.setOpen(game, true); }
      game.toast(VS.t('msg_lever')); game.save();
    }
    promptKey() { return 'act_pull'; }
    update(dt, game) { super.update(dt, game); this.ang = U.approach(this.ang, this.pulled ? 1 : 0, dt * 5); }
    draw(ctx, game) { VS.SpritesObj.lever(ctx, this, game.room.R); }
  }
  // ---------- NPC ----------
  class NPC extends VS.Entity {
    constructor(d) { super(d.x * T, (d.y + 1) * T - 30, 16, 30); this.nid = d.id; this.interactable = true; this.range = 34; this.z = 1; this.facing = d.face || -1; this.anim = 0; }
    interact(game) { const n = VS.NPCS[this.nid]; if (n) { this.facing = game.player.cx < this.cx ? -1 : 1; this.talking = true; n.talk(game, this); } }
    promptKey() { return 'act_talk'; }
    update(dt, game) { super.update(dt, game); if (this.talking && !VS.UI.dlg) this.talking = false; const n = VS.NPCS[this.nid]; if (n && n.update) n.update(dt, game, this); }
    emitLight() { const n = VS.NPCS[this.nid]; if (n && n.light) G.light(this.cx, this.cy, n.light[1], n.light[0], 0.8, 1); }
    draw(ctx, game) { VS.SpritesNPC.draw(ctx, this, game); }
  }
  // ---------- Gatilho de guião ----------
  class Trigger extends VS.Entity {
    constructor(d) { super(d.x * T, d.y * T, (d.w || 1) * T, (d.h || 3) * T); this.d = d; }
    update(dt, game) {
      if (this.remove) return;
      if (U.overlap(this, game.player)) {
        if (this.d.once) { if (VS.state.flags[this.d.once]) { this.remove = true; return; } VS.state.flags[this.d.once] = true; }
        this.remove = true;
        if (this.d.toast) game.toast(VS.t(this.d.toast), 5);
        if (this.d.hint) game.hint(this.d.hint);
        if (this.d.run) this.d.run(game);
      }
    }
  }
  // ---------- Plataforma móvel ----------
  class MovingPlatform extends VS.Entity {
    constructor(d) {
      super(d.x * T, d.y * T, (d.w || 3) * T, 8); this.isPlatform = true; this.z = 1;
      this.ax = this.x; this.ay = this.y; this.bx = (d.tx !== undefined ? d.tx : d.x) * T; this.by = (d.ty !== undefined ? d.ty : d.y) * T;
      this.period = d.period || 4; this.phase = d.phase || 0; this.dx = 0; this.dy = 0;
    }
    update(dt, game) {
      super.update(dt, game);
      const k = (1 - Math.cos((this.t / this.period + this.phase) * U.TAU)) / 2;
      const nx = U.lerp(this.ax, this.bx, k), ny = U.lerp(this.ay, this.by, k);
      this.dx = nx - this.x; this.dy = ny - this.y; this.x = nx; this.y = ny;
    }
    draw(ctx, game) { VS.SpritesObj.platform(ctx, this, game.room.R); }
  }
  // ---------- Armadilhas ----------
  class Trap extends VS.Entity {
    constructor(d) {
      super(d.x * T, d.y * T, T, T); this.k = d.k; this.d = d; this.period = d.period || 2.4; this.off = d.off || 0; this.z = 2; this.attackHBs = [];
      this.dir = d.dir || 1; this.len = d.len || 4;
      if (this.k === 'blade') { this.px = d.x * T + T / 2; this.py = d.y * T; }
    }
    update(dt, game) {
      super.update(dt, game);
      this.attackHBs = [];
      const ph = ((this.t + this.off) % this.period) / this.period;
      const p = game.player;
      const near = Math.abs(p.cx - this.cx) < 400 && Math.abs(p.cy - this.cy) < 260;
      if (this.k === 'blade') {
        const ang = Math.sin((this.t + this.off) / this.period * U.TAU) * 1.1;
        this.ang = ang;
        const L = this.len * T;
        const bx = this.px + Math.sin(ang) * L, by = this.py + Math.cos(ang) * L;
        this.bx = bx; this.by = by;
        this.attackHBs.push({ x: bx - 14, y: by - 6, w: 28, h: 12, dmg: 22, id: 'tb' + this.d.x + '_' + Math.floor((this.t + this.off) / (this.period / 2)), unblockable: true, parryable: false, src: { cx: bx } });
        if (near && Math.abs(ang) < 0.08 && !this.swish) { this.swish = true; A.sfx('swing_heavy', { vol: 0.35 }); } if (Math.abs(ang) > 0.5) this.swish = false;
      } else if (this.k === 'vent') {
        this.state = ph < 0.55 ? 'idle' : ph < 0.72 ? 'warn' : 'fire';
        if (this.state === 'fire') {
          const h = this.len * T;
          this.attackHBs.push({ x: this.x + 2, y: this.y + T - h, w: T - 4, h, dmg: 18, id: 'tv' + this.d.x + '_' + Math.floor((this.t + this.off) / this.period), unblockable: true, parryable: false, src: this });
          if (Math.random() < 0.9) G.emit({ x: this.cx + U.rand(-5, 5), y: this.y + T, vx: U.rand(-15, 15), vy: U.rand(-380, -260), life: h / 320, size: U.rand(2, 4), color: U.pick(['#ffb040', '#ff6010', '#ffe080']), add: true, shrink: true });
          if (near && !this.firing) { this.firing = true; A.sfx('fire', { vol: 0.5 }); }
        } else this.firing = false;
        if (this.state === 'warn' && Math.random() < 0.5) G.emit({ x: this.cx + U.rand(-5, 5), y: this.y + T - 2, vy: -40, life: 0.4, size: 1.5, color: '#ff8030', add: true });
      } else if (this.k === 'crusher') {
        // cai rápido, sobe devagar
        const drop = this.len * T;
        let k;
        if (ph < 0.45) k = 0; else if (ph < 0.55) k = U.ease.inQuad((ph - 0.45) / 0.1); else if (ph < 0.7) k = 1; else k = 1 - (ph - 0.7) / 0.3;
        this.k2 = k; this.headY = this.d.y * T + k * drop;
        this.attackHBs.push({ x: this.x - 8, y: this.headY, w: T + 16, h: 16, dmg: 30, id: 'tc' + this.d.x + '_' + Math.floor((this.t + this.off) / this.period), unblockable: true, parryable: false, src: this });
        if (k >= 1 && !this.slammed) { this.slammed = true; if (near) { A.sfx('crush', { vol: 0.7 }); G.addShake(0.15); } G.burst(this.cx, this.headY + 16, 8, { color: '#a08070', speed: 80, life: 0.4, size: 1.5 }); } if (k < 0.5) this.slammed = false;
      } else if (this.k === 'dart') {
        if (ph < this.lastPh) {
          game.spawn(new VS.Projectile({ x: this.cx + this.dir * 10, y: this.cy, vx: this.dir * 300, w: 10, h: 4, dmg: 14, kind: 'bolt', color: '#c0b090', life: 3, light: false }));
          if (near) A.sfx('bolt', { vol: 0.5 });
        }
        this.lastPh = ph;
      } else if (this.k === 'beam') {
        this.state = ph < 0.6 ? 'idle' : ph < 0.78 ? 'warn' : 'fire';
        if (this.state === 'fire') {
          this.attackHBs.push({ x: this.x + 3, y: this.y, w: T - 6, h: this.len * T, dmg: 20, id: 'tl' + this.d.x + '_' + Math.floor((this.t + this.off) / this.period), unblockable: true, parryable: false, src: this });
          if (near && !this.firing) { this.firing = true; A.sfx('light', { vol: 0.5 }); }
        } else this.firing = false;
      }
    }
    emitLight() {
      if (this.k === 'vent' && this.state !== 'idle') G.light(this.cx, this.y, this.state === 'fire' ? 120 : 50, '#ff6020', 0.9, 2);
      if (this.k === 'beam' && this.state !== 'idle') G.light(this.cx, this.y + this.len * T / 2, this.state === 'fire' ? 110 : 40, '#ffe8a0', 0.9);
    }
    draw(ctx, game) { VS.SpritesObj.trap(ctx, this, game.room.R); }
  }
  // ---------- Gatilho de chefe (arena) ----------
  class BossSpawner extends VS.Entity {
    constructor(d, key) { super(d.x * T, 0, T, 1); this.d = d; this.key = key; this.armed = true; }
    update(dt, game) {
      if (!this.armed) return;
      const st = VS.state;
      if (st.bosses[this.d.boss]) { this.remove = true; return; }
      const p = game.player;
      const trig = this.d.trigger !== undefined ? this.d.trigger * T : this.x;
      if ((this.d.fromRight ? p.cx < trig : p.cx > trig) && p.onGround) {
        this.armed = false; this.remove = true;
        VS.Bosses.spawn(this.d, game);
      }
    }
  }
  // ---------- Selo das brasas (no Santuário: coloca as brasas) ----------

  // ---------- fábrica ----------
  O.make = function (d, key, game) {
    const st = VS.state;
    if (d.cond && !d.cond(st)) return null;
    switch (d.t) {
      case 'altar': return new Altar(d);
      case 'item': if (st.collected[key]) return null; return new Pickup(d, key);
      case 'urn': if (st.collected[key]) return null; return new Urn(d, key);
      case 'shrine': if (st.collected[key]) return null; return new WeaponShrine(d, key);
      case 'inscription': return new Inscription(d);
      case 'door': return new Door(d);
      case 'lever': return new Lever(d);
      case 'npc': return new NPC(d);
      case 'trigger': if (d.once && st.flags[d.once]) return null; return new Trigger(d);
      case 'platform': return new MovingPlatform(d);
      case 'trap': return new Trap(d);
      case 'boss': if (st.bosses[d.boss]) { if (d.after) d.after(game); return null; } return new BossSpawner(d, key);
      case 'enemy': return VS.Enemies.make(d, key, game);
      default: if (O.custom[d.t]) return O.custom[d.t](d, key, game); console.warn('objeto desconhecido', d.t); return null;
    }
  };
  O.custom = {};
  Object.assign(O, { Altar, Shade, AshOrb, Pickup, Urn, Inscription, Door, Lever, NPC, Trigger, MovingPlatform, Trap, BossSpawner });
  VS.Obj = O;
})(window.VS);
