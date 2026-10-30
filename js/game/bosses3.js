// Vesperal — A Carpideira: chefe errante. Aparece em salas ao acaso (ouve-se o choro antes de a ver), grita de
// sofrimento — e o grito é o ataque dela: ondas em anel que só se atravessam com a esquiva.
'use strict';
(function (VS) {
  const U = VS.U, T = U.TILE, G = VS.Gfx, A = VS.Audio, Bs = VS.Bosses;
  const P = (o) => new VS.Projectile(o);
  const front = (e, dx, dy, w, h) => ({ x: e.facing > 0 ? e.cx + dx : e.cx - dx - w, y: e.bottom - dy - h, w, h });

  // ---------- onda do grito: anel que cresce a partir da boca; fere quem o anel apanhar (a esquiva passa por dentro)
  class WailRing extends VS.Entity {
    constructor(x, y, speed, max, dmg) {
      super(x - 2, y - 2, 4, 4); this.ox = x; this.oy = y; this.r = 12; this.speed = speed; this.max = max; this.dmg = dmg;
      this.z = 6; this.attackHBs = []; this.aid = VS.Entity.newAttackId(); this.drawAlways = true;
    }
    update(dt, game) {
      super.update(dt, game);
      this.r += this.speed * dt; this.attackHBs = [];
      if (this.r > this.max) { this.remove = true; return; }
      const n = Math.max(16, Math.round(this.r / 7));
      for (let i = 0; i < n; i++) {
        const a = i / n * U.TAU, x = this.ox + Math.cos(a) * this.r, y = this.oy + Math.sin(a) * this.r;
        if (y < 0 || y > game.room.ph) continue;
        this.attackHBs.push({ x: x - 5, y: y - 5, w: 10, h: 10, dmg: this.dmg, id: this.aid, unblockable: true, parryable: false, src: { cx: this.ox } });
      }
    }
    draw(ctx) {
      const k = 1 - this.r / this.max;
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = `rgba(255,120,110,${(0.3 * k).toFixed(3)})`; ctx.lineWidth = 9; ctx.beginPath(); ctx.arc(this.ox, this.oy, this.r - 5, 0, U.TAU); ctx.stroke();
      ctx.strokeStyle = `rgba(255,210,200,${(0.6 * k).toFixed(3)})`; ctx.lineWidth = 2.6; ctx.beginPath(); ctx.arc(this.ox, this.oy, this.r, 0, U.TAU); ctx.stroke();
      ctx.strokeStyle = `rgba(255,255,255,${(0.35 * k).toFixed(3)})`; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(this.ox, this.oy, this.r + 3.5, 0, U.TAU); ctx.stroke();
      ctx.restore();
    }
  }
  VS.WailRing = WailRing;

  function mouth(e) { const p = e._f && VS.EnemyRender && VS.EnemyRender.point(e, e._f, 'mouth'); return p || { x: e.cx + e.facing * 10, y: e.y + 16 }; }
  function wail(e, g, big) {
    const m = mouth(e);
    A.sfx('wail', { vol: big ? 1 : 0.85 }); G.addShake(big ? 0.7 : 0.5); G.flash('#3a0a10', 0.22);
    G.dread = Math.min(1, (G.dread || 0) + 0.45);
    g.spawn(new WailRing(m.x, m.y, 215, 430, 22));
    for (let i = 0; i < 14; i++) G.emit({ x: m.x, y: m.y, vx: U.rand(-140, 140), vy: U.rand(-140, 60), drag: 2, life: 0.6, size: U.rand(1, 2.2), color: U.pick(['#ffd0c0', '#ff8070', '#ffffff']), add: true });
  }
  // lágrimas de cera: pingos a cair do alto por cima da protagonista; deixam poças que queimam um pouco
  function waxRain(e, g) {
    const p = g.player, n = e.phase >= 1 ? 9 : 7, top = Math.max(0, G.cam.y - 10);
    for (let i = 0; i < n; i++) {
      const x = p.cx + (i - (n - 1) / 2) * 34 + U.rand(-8, 8);
      g.spawn(P({ x: x - 4, y: top - i * 14, vx: 0, vy: 60, g: 900, w: 8, h: 10, dmg: 12, kind: 'wax', color: '#f0e2c8', life: 3, parryable: false, reflectable: false,
        onDestroy(g2) { G.burst(this.cx, this.cy, 6, { color: '#e8d8b8', speed: 60, angle: -Math.PI / 2, spread: 1.6, g: 400, life: 0.4, size: 1.4 });
          const fy = Math.floor(this.cy / T) * T;
          g2.spawn(P({ x: this.cx - 11, y: fy - 6, w: 22, h: 6, dmg: 7, kind: 'waxpool', color: '#d8c8a8', life: 2.2, solid: false, parryable: false, reflectable: false, persist: true })); } }));
    }
    A.sfx('sob', { vol: 0.5 });
  }

  Bs.def('carpideira', {
    cfg: { w: 34, h: 72, hp: 1100, music: 'b_carpideira', heavy: true, phases: [0.5], introTime: 2.8, ash: 0, ashCol: '#2a2228' },
    eyeLight: { r: 26, i: 0.5, color: '#ff4a3a' },
    attacks: {
      // GRITO (vermelho): a cabeça cai para trás e o grito sai em anéis — não se apara nem se salta: atravessa-se com a esquiva
      scream: { wind: 1.0, act: 0.95, rec: 0.9, tell: 'red', sfx: false, armor: true,
        onWind(e) { A.sfx('sob', { vol: 0.7 }); },
        onAct(e, g) { wail(e, g, false); e.screams = (e.screams || 0) + 1; if (!e.screamHint) { e.screamHint = true; VS.UI.toast(VS.t('tip_carpideira_scream'), 4); } },
        during(e, g) { const a = e.atk; if (e.phase >= 1 && !a.second && a.t > 0.5) { a.second = true; wail(e, g, true); } },
        onEnd(e) { if (e.phase >= 1) { e.tired = 2.6; e.cool = 0.2; if (!e.tiredHint) { e.tiredHint = true; VS.UI.toast(VS.t('tip_carpideira_tired'), 4); } } } },
      // LÁGRIMAS DE CERA (sem sinal): chove cera por cima de quem lá estiver
      tears: { wind: 0.7, act: 0.8, rec: 0.7, tell: null, sfx: false, onAct(e, g) { waxRain(e, g); } },
      // ABRAÇO (branco, aparável): atira-se de braços abertos para agarrar
      grab: { wind: 0.75, act: 0.24, rec: 0.95, dmg: 26, tell: 'white', sfx: 'swing_heavy', lunge: 300, hb: (e) => front(e, 0, 18, 66, 46) },
      // ROSÁRIO (sem sinal, rente ao chão): a cruz pesada varre o chão — salta-a
      rosary: { wind: 0.62, act: 0.22, rec: 0.75, dmg: 20, tell: null, sfx: 'whip', hb: (e) => front(e, -16, 0, 106, 20),
        onAct(e) { G.addShake(0.2); } },
    },
    // depois do grito duplo (fase 2) fica exausta, de joelhos a tossir cera: é aí que se lhe bate (dano ×1.8)
    animState: (e) => (e.tired > 0 && !e.atk && !e.defeated ? { anim: 'stagger' } : null),
    damageMult: (e) => (e.tired > 0 ? 1.8 : 1),
    alpha: (e) => (e.intro ? U.clamp(e.introT / 1.6, 0, 1) : 1),
    introStart(e, g) { A.sfx('wail', { vol: 0.8 }); G.dread = 0.6; },
    introUpdate(e, g) { if (Math.random() < 0.5) G.emit({ x: e.cx + U.rand(-18, 18), y: e.bottom - U.rand(0, 8), vx: U.rand(-10, 10), vy: U.rand(-60, -20), life: 1, size: U.rand(1, 2), color: U.pick(['#2a2228', '#e8d8b8', '#5a4048']) }); },
    think(e, dt, g) {
      if (e.tired > 0) { e.tired -= dt; e.vx = U.approach(e.vx, 0, 600 * dt); if (Math.random() < 0.06) G.emit({ x: e.cx + e.facing * 10, y: e.y + 30, vx: e.facing * 30, vy: 20, g: 300, life: 0.8, size: 1.6, color: '#e8d8b8' }); return; }
      if (e.atk) return;
      const p = g.player, d = Math.abs(p.cx - e.cx);
      e.face();
      e.screamCd = (e.screamCd === undefined ? 3.5 : e.screamCd) - dt;
      if (e.cool > 0) { e.walk(d > 100 ? e.facing : 0, 42, dt); return; }
      if (e.screamCd <= 0) { e.screamCd = e.phase >= 1 ? 7.5 : 9.5; e.attack('scream'); return; }
      if (d < 84) { e.attack(Math.random() < 0.55 ? 'grab' : 'rosary'); return; }
      if (d < 150 && Math.random() < 0.45) { e.attack('rosary'); return; }
      if (Math.random() < 0.35) { e.attack('tears'); return; }
      e.walk(e.facing, 48, dt);
    },
    onPhase(e, g) { A.sfx('wail', { vol: 1 }); G.addShake(0.6); e.screamCd = 1.2; },
  });

  // enquanto a folha de sprites ainda não carregou, não se desenha nada (aparece envolta em fumo)
  VS.SpritesBoss = VS.SpritesBoss || {};
  if (!VS.SpritesBoss.carpideira) VS.SpritesBoss.carpideira = function () {};
  VS.Carpideira = { wail, WailRing };
})(window.VS);
