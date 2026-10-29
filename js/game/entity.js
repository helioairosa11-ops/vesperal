// Vesperal — entidade base e sistema de golpes (hitboxes, hurtboxes, projéteis)
'use strict';
(function (VS) {
  const U = VS.U;
  let attackSeq = 1;

  class Entity {
    constructor(x, y, w, h) {
      this.x = x; this.y = y; this.w = w; this.h = h;
      this.vx = 0; this.vy = 0; this.onGround = false;
      this.facing = 1; this.dead = false; this.remove = false;
      this.hp = 1; this.maxHp = 1; this.flash = 0; this.t = 0;
      this.team = 'neutral'; this.z = 0; this.gravity = 1350; this.maxFall = 520;
      this.hitIds = new Map();
    }
    get cx() { return this.x + this.w / 2; }
    get cy() { return this.y + this.h / 2; }
    get bottom() { return this.y + this.h; }
    hurtbox() { return { x: this.x, y: this.y, w: this.w, h: this.h }; }
    physics(dt, game, noGravity) {
      if (!noGravity) { this.vy = Math.min(this.maxFall, this.vy + this.gravity * dt); }
      return VS.World.moveBody(game.room, this, dt);
    }
    // golpe já recebido deste ataque?
    alreadyHit(id) { if (this.hitIds.has(id)) return true; this.hitIds.set(id, this.t); if (this.hitIds.size > 30) { const k = this.hitIds.keys().next().value; this.hitIds.delete(k); } return false; }
    update(dt, game) { this.t += dt; if (this.flash > 0) this.flash -= dt; }
    draw(ctx, game) { }
    distTo(e) { return Math.hypot(e.cx - this.cx, e.cy - this.cy); }
  }
  Entity.newAttackId = () => attackSeq++;

  // Projétil genérico (inimigo ou jogador)
  class Projectile extends Entity {
    constructor(o) {
      super(o.x - (o.w || 8) / 2, o.y - (o.h || 8) / 2, o.w || 8, o.h || 8);
      Object.assign(this, { dmg: 10, life: 4, team: 'enemy', kind: 'orb', gravityOn: false, parryable: true, reflectable: true, pierce: false, color: '#ffb060', solid: true, light: true }, o);
      this.id = Entity.newAttackId();
      this.gravity = o.g || 0;
      this.z = 5;
    }
    update(dt, game) {
      super.update(dt, game);
      this.life -= dt;
      if (this.life <= 0) { this.remove = true; return; }
      if (this.homing && game.player && this.team === 'enemy') {
        const p = game.player; const a = Math.atan2(p.cy - this.cy, p.cx - this.cx); const cur = Math.atan2(this.vy, this.vx);
        let d = a - cur; while (d > Math.PI) d -= U.TAU; while (d < -Math.PI) d += U.TAU;
        const sp = Math.hypot(this.vx, this.vy); const na = cur + U.clamp(d, -this.homing * dt, this.homing * dt);
        this.vx = Math.cos(na) * sp; this.vy = Math.sin(na) * sp;
      }
      if (this.gravity) this.vy += this.gravity * dt;
      this.x += this.vx * dt; this.y += this.vy * dt;
      if (this.spin) this.rot = (this.rot || 0) + this.spin * dt;
      if (this.solid && game.room.solidAtPoint(this.cx, this.cy)) {
        if (this.bounce && this.bounces > 0) { this.bounces--; this.vy = -Math.abs(this.vy) * 0.7; this.y -= 3; }
        else { this.onDestroy(game); this.remove = true; return; }
      }
      if (this.trail && Math.random() < 0.6) VS.Gfx.emit({ x: this.cx, y: this.cy, vx: U.rand(-10, 10), vy: U.rand(-10, 10), life: 0.35, size: this.w * 0.35, color: this.color, add: true, shrink: true });
      if (this.update2) this.update2(dt, game);
    }
    emitLight() { if (this.light) VS.Gfx.light(this.cx, this.cy, 40 + this.w * 2, this.color, 0.6); }
    onDestroy(game) {
      VS.Gfx.burst(this.cx, this.cy, 8, { color: this.color, speed: 90, life: 0.4, size: 2, add: true });
      if (this.onHitWall) this.onHitWall(game);
    }
    hitbox() { return { x: this.x, y: this.y, w: this.w, h: this.h, dmg: this.dmg, id: this.id, parryable: this.parryable, unblockable: this.unblockable, knock: this.knock || 160, src: this, projectile: true }; }
    draw(ctx) { if (!(VS.EnemyRender && VS.EnemyRender.projectile(ctx, this))) VS.Sprites.projectile(ctx, this); }
  }

  VS.Entity = Entity;
  VS.Projectile = Projectile;
})(window.VS);
