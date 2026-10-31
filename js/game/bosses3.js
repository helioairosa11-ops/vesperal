// Vesperal — A Carpideira: chefe errante. Aparece em salas ao acaso (ouve-se o choro antes de a ver), grita de
// sofrimento — e o grito é o ataque dela: ondas em anel que só se atravessam com a esquiva.
'use strict';
(function (VS) {
  const U = VS.U, T = U.TILE, G = VS.Gfx, A = VS.Audio, Bs = VS.Bosses;
  const P = (o) => new VS.Projectile(o);
  const front = (e, dx, dy, w, h) => ({ x: e.facing > 0 ? e.cx + dx : e.cx - dx - w, y: e.bottom - dy - h, w, h });

  // ---------- onda do grito: anel que cresce a partir da boca; fere quem o anel apanhar (a esquiva passa por dentro)
  class WailRing extends VS.Entity {
    constructor(x, y, speed, max, dmg, col) {
      super(x - 2, y - 2, 4, 4); this.ox = x; this.oy = y; this.r = 12; this.speed = speed; this.max = max; this.dmg = dmg; this.col = col || null;
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
      const c = this.col || [255, 120, 110], c2 = this.col ? this.col.map((v) => Math.min(255, v + 50)) : [255, 210, 200];
      ctx.strokeStyle = `rgba(${c[0]},${c[1]},${c[2]},${(0.3 * k).toFixed(3)})`; ctx.lineWidth = 9; ctx.beginPath(); ctx.arc(this.ox, this.oy, Math.max(1, this.r - 5), 0, U.TAU); ctx.stroke();
      ctx.strokeStyle = `rgba(${c2[0]},${c2[1]},${c2[2]},${(0.6 * k).toFixed(3)})`; ctx.lineWidth = 2.6; ctx.beginPath(); ctx.arc(this.ox, this.oy, this.r, 0, U.TAU); ctx.stroke();
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


  // ======================================================================
  // O CUSTÓDIO DE OURO — chefe opcional da Cúpula (por cima da nave): todo ele luz — só o parry o fere (ver abaixo)
  // ======================================================================
  // raio de sol a girar à volta do Custódio (aviso fino primeiro, depois a luz que fere)
  class SunBeam extends VS.Entity {
    constructor(boss, ang, speed, warn, life) {
      super(boss.cx, boss.cy, 2, 2); this.b = boss; this.ang = ang; this.speed = speed; this.warn = warn; this.life = life; this.t0 = 0;
      this.z = 6; this.attackHBs = []; this.aid = VS.Entity.newAttackId(); this.drawAlways = true;
    }
    update(dt, game) {
      super.update(dt, game);
      this.t0 += dt; this.attackHBs = [];
      if (this.b.remove || this.b.defeated || this.t0 > this.warn + this.life) { this.remove = true; return; }
      this.x = this.b.cx; this.y = this.b.cy;
      if (this.t0 < this.warn) return;
      this.ang += this.speed * dt;
      const c = Math.cos(this.ang), s = Math.sin(this.ang);
      for (let d = 26; d < 640; d += 12) {
        const x = this.x + c * d, y = this.y + s * d;
        if (game.room.solidAtPoint(x, y)) break;
        this.attackHBs.push({ x: x - 6, y: y - 6, w: 12, h: 12, dmg: 20, id: this.aid, unblockable: true, parryable: false, src: { cx: this.x } });
      }
      if (Math.random() < 0.5) { const d = U.rand(30, 400); G.emit({ x: this.x + c * d, y: this.y + s * d, vx: U.rand(-20, 20), vy: U.rand(-30, 10), life: 0.5, size: U.rand(1, 2), color: '#fff0c0', add: true }); }
    }
    // o raio aceso ilumina o caminho dele (vê-se em salas escuras)
    emitLight(game) {
      if (this.t0 < this.warn) return;
      const c = Math.cos(this.ang), s = Math.sin(this.ang);
      for (let d = 40; d < 400; d += 72) { const x = this.x + c * d, y = this.y + s * d; if (game && game.room.solidAtPoint(x, y)) break; G.light(x, y, 46, '#ffe8b0', 0.7); }
    }
    draw(ctx) {
      const c = Math.cos(this.ang), s = Math.sin(this.ang), L = 640;
      ctx.save(); ctx.translate(this.x, this.y); ctx.rotate(this.ang); ctx.globalCompositeOperation = 'lighter';
      if (this.t0 < this.warn) {
        const k = this.t0 / this.warn;
        ctx.strokeStyle = `rgba(255,236,170,${(0.2 + k * 0.4).toFixed(3)})`; ctx.lineWidth = 1; ctx.setLineDash([6, 6]); ctx.beginPath(); ctx.moveTo(26, 0); ctx.lineTo(L, 0); ctx.stroke(); ctx.setLineDash([]);
      } else {
        const k = Math.min(1, (this.t0 - this.warn) / 0.12) * Math.min(1, (this.warn + this.life - this.t0) / 0.2);
        const g = ctx.createLinearGradient(0, -10, 0, 10); g.addColorStop(0, 'rgba(255,200,90,0)'); g.addColorStop(0.5, `rgba(255,248,220,${(0.95 * k).toFixed(3)})`); g.addColorStop(1, 'rgba(255,200,90,0)');
        ctx.fillStyle = g; ctx.fillRect(22, -10, L, 20);
        ctx.fillStyle = `rgba(255,255,255,${(0.9 * k).toFixed(3)})`; ctx.fillRect(22, -1.5, L, 3);
      }
      ctx.restore(); void c; void s;
    }
  }
  // coluna de luz que desce do teto: um círculo no chão avisa onde cai
  class LightPillar extends VS.Entity {
    constructor(x, floor, delay) {
      super(x - 16, 0, 32, floor); this.fx = x; this.floor = floor; this.delay = delay; this.t0 = 0; this.z = 6; this.attackHBs = []; this.aid = VS.Entity.newAttackId(); this.drawAlways = true;
    }
    update(dt, game) {
      super.update(dt, game);
      this.t0 += dt; this.attackHBs = [];
      const w = this.delay, f = w + 0.45;
      if (this.t0 > f + 0.4) { this.remove = true; return; }
      if (this.t0 >= w && this.t0 < f) {
        if (!this.boom) { this.boom = true; A.sfx('light', { vol: 0.8 }); G.addShake(0.25); G.burst(this.fx, this.floor - 2, 18, { color: '#fff0c0', speed: 160, angle: -Math.PI / 2, spread: 1.4, g: 300, life: 0.6, size: 1.8, add: true }); }
        this.attackHBs.push({ x: this.fx - 15, y: 0, w: 30, h: this.floor, dmg: 22, id: this.aid, unblockable: true, parryable: false, src: { cx: this.fx } });
      }
    }
    emitLight() { if (this.t0 >= this.delay) G.light(this.fx, this.floor - 60, 120, '#ffe8a0', 0.9); }
    draw(ctx) {
      const w = this.delay, t = this.t0;
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      if (t < w) {
        const k = t / w;
        ctx.strokeStyle = `rgba(255,230,160,${(0.3 + 0.5 * k).toFixed(3)})`; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.ellipse(this.fx, this.floor - 1, 16 * (1.4 - k * 0.4), 3.4, 0, 0, U.TAU); ctx.stroke();
        ctx.fillStyle = `rgba(255,240,200,${(0.08 + 0.12 * k).toFixed(3)})`; ctx.fillRect(this.fx - 12, 0, 24, this.floor);
      } else {
        const k = t < w + 0.45 ? 1 : Math.max(0, 1 - (t - w - 0.45) / 0.4);
        const g = ctx.createLinearGradient(this.fx - 18, 0, this.fx + 18, 0); g.addColorStop(0, 'rgba(255,210,110,0)'); g.addColorStop(0.5, `rgba(255,250,230,${(0.95 * k).toFixed(3)})`); g.addColorStop(1, 'rgba(255,210,110,0)');
        ctx.fillStyle = g; ctx.fillRect(this.fx - 18, 0, 36, this.floor);
      }
      ctx.restore();
    }
  }
  VS.SunBeam = SunBeam; VS.LightPillar = LightPillar;

  function custBlades(e, g, n, spread) {
    const p = g.player, base = Math.atan2(p.cy - e.cy, p.cx - e.cx);
    for (let i = 0; i < n; i++) {
      const a = base + (i - (n - 1) / 2) * (spread || 0.16), sp = 210 + i % 2 * 30 + e.phase * 20;
      g.spawn(P({ x: e.cx + Math.cos(a) * 30 - 6, y: e.cy + Math.sin(a) * 30 - 6, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, w: 12, h: 12, dmg: 16, kind: 'goldblade', color: '#ffd870', life: 4, solid: false, reflectable: true, homing: 0.6 }));
    }
    A.sfx('chime', { vol: 0.5 });
  }
  function custHome(e, g) { // um ponto no alto da cúpula, longe da protagonista
    const p = g.player, x0 = e.arena.x0 + 60, x1 = e.arena.x1 - 60;
    let x = U.rand(x0, x1); if (Math.abs(x - p.cx) < 140) x = p.cx < (x0 + x1) / 2 ? x1 - U.rand(0, 80) : x0 + U.rand(0, 80);
    return { x, y: e.arena.floor - U.rand(120, 170) };
  }
  // aparece ao lado da protagonista (alternando os lados) com a lâmina de luz erguida
  function custBeside(e, g) {
    const p = g.player, x0 = e.arena.x0 + 4, x1 = e.arena.x1 - e.w - 4, at = (s) => p.cx + s * 54 - e.w / 2;
    let side = e.smiteSide = e.smiteSide ? -e.smiteSide : (Math.random() < 0.5 ? -1 : 1);
    // encostada a uma parede: aparece do lado onde há espaço (nunca em cima dela)
    if (at(side) < x0 || at(side) > x1) side = e.smiteSide = -side;
    G.burst(e.cx, e.cy, 18, { color: '#ffe8a0', speed: 120, life: 0.45, size: 1.6, add: true });
    e.x = U.clamp(at(side), x0, x1); e.y = p.bottom - e.h - 4; e.vx = 0; e.vy = 0;
    e.facing = p.cx > e.cx ? 1 : -1; e.blinkT = 0.22;
    G.burst(e.cx, e.cy, 18, { color: '#ffe8a0', speed: 120, life: 0.45, size: 1.6, add: true }); A.sfx('chime', { vol: 0.55 });
  }
  const custTip = (e) => ({ x: e.cx + e.facing * 40, y: e.cy - 10 });

  Bs.def('custodio', {
    cfg: { w: 44, h: 44, hp: 1500, music: 'b_custodio', flying: true, heavy: true, phases: [0.66, 0.33], introTime: 3.0, ash: 0, ashCol: '#ffe0a0', parryStagger: 0 },
    sheetAnchor: 'center',
    noRepel: true,
    aggr: [1.5, 1.85, 2.2],
    light(e) {
      if (e.dead) return;
      G.light(e.cx, e.cy, (e.eclipse > 0 ? 50 : 150) + (e.glowK || 0) * 80, '#ffe4a0', e.eclipse > 0 ? 0.5 : 0.85, 2);
      // a lâmina de luz ilumina-se a si própria (às escuras do eclipse é ela o aviso)
      const a = e.atk; if (a && a.name === 'smite' && a.phase !== 'rec') { const t = custTip(e); G.light(t.x, t.y, 64, '#fff0c0', 0.95); }
    },
    attacks: {
      // RAIOS DE SOL (vermelho): linhas finas avisam, depois os raios rodam à volta dele — corre à frente deles ou esquiva-te através
      rays: { wind: 0.5, act: 3.2, rec: 0.7, tell: 'red', sfx: false,
        onAct(e, g) { const n = 4 + e.phase * 2, dir = Math.random() < 0.5 ? 1 : -1, sp = (0.6 + e.phase * 0.14) * dir, off = Math.random() * U.TAU;
          for (let i = 0; i < n; i++) g.spawn(new SunBeam(e, off + i / n * U.TAU, sp, 0.85, 2.2)); A.sfx('choir_hit', { vol: 0.6 }); e.vx = 0; e.vy = 0;
          if (!e.rayHint) { e.rayHint = true; VS.UI.toast(VS.t('tip_custodio_rays'), 4); } },
        during(e, g) { e.vx *= 0.9; e.vy *= 0.9; e.glowK = 1; if (e.phase >= 2 && !e.atk.bl && e.atk.t > 1.2) { e.atk.bl = true; custBlades(e, g, 3, 0.2); } }, onEnd(e) { e.glowK = 0; } },
      // LÂMINAS DE OURO (branco): voam para ti — apara-as: voltam contra ele e ferem-no
      blades: { wind: 0.65, act: 0.9, rec: 0.55, tell: 'white', sfx: false,
        during(e, g) { const a = e.atk, k = Math.floor(a.t / 0.28); if (k !== a.k && k < 3) { a.k = k; custBlades(e, g, 3 + e.phase, 0.18); } },
        onEnd(e) { if (!e.bladeHint) { e.bladeHint = true; VS.UI.toast(VS.t('tip_custodio_blades'), 4); } } },
      // GOLPE DE LUZ (branco): aparece ao teu lado com uma lâmina de luz — apara no instante do brilho (é assim que se lhe faz dano);
      // nas fases seguintes encadeia dois ou três, de lados alternados
      smite: { wind: 0.62, act: 0.14, rec: 0.4, dmg: 20, tell: 'white', sfx: 'swing_royal',
        onWind(e, g) { custBeside(e, g); e.glintDone = false; },
        windTick(e, g) { const a = e.atk; if (!e.glintDone && a.s.wind - a.t <= 0.42) { e.glintDone = true; const t = custTip(e); VS.FX.flare(t.x, t.y, 24, [255, 250, 230], 0.3); } },
        hb: (e) => front(e, 0, -12, 66, 58),
        onEnd(e) { if (e.combo > 0) { e.combo--; e.attack('smite'); } } },
      // COLUNAS DE LUZ (sem sinal): círculos no chão marcam onde a luz cai, uma atrás da outra, a seguir-te
      pillars: { wind: 0.55, act: 1.6, rec: 0.6, tell: null, sfx: 'light',
        onAct(e, g) { const p = g.player, n = 3 + e.phase; for (let i = 0; i < n; i++) { const x = U.clamp(p.cx + (i - 0.5) * p.dir * 46 + U.rand(-10, 10), e.arena.x0 + 20, e.arena.x1 - 20); g.spawn(new LightPillar(x, e.arena.floor, 0.7 + i * 0.3)); } } },
      // ERUPÇÃO (vermelho): enche-se de luz e rebenta num anel de esferas (as esferas aparadas também o ferem)
      burst: { wind: 1.0, act: 0.3, rec: 0.8, tell: 'red', sfx: false,
        windTick(e) { e.glowK = Math.min(2, (e.glowK || 0) + 0.03); if (Math.random() < 0.6) G.emit({ x: e.cx + U.rand(-60, 60), y: e.cy + U.rand(-60, 60), vx: 0, vy: 0, life: 0.4, size: U.rand(1, 2), color: '#fff0c0', add: true }); },
        onAct(e, g) { const n = 18 + e.phase * 6, off = Math.random(); for (let i = 0; i < n; i++) { const a = (i + off) / n * U.TAU; g.spawn(P({ x: e.cx - 6, y: e.cy - 6, vx: Math.cos(a) * 150, vy: Math.sin(a) * 150, w: 12, h: 12, dmg: 15, kind: 'light', color: '#fff0c0', life: 5, solid: true, reflectable: true, isLight: true })); }
          A.sfx('choir_hit', { vol: 0.8 }); G.flash('#fff4d0', 0.25); G.addShake(0.4); VS.FX.flare(e.cx, e.cy, 70, [255, 236, 190], 0.6); e.glowK = 0; } },
      // ECLIPSE: a cúpula apaga-se; só o brilho da lâmina dele avisa de onde vem o golpe — apara-o às escuras
      eclipse: { wind: 0.85, act: 0.2, rec: 0.25, tell: null, sfx: false,
        onWind(e) { A.sfx('eclipse'); e.glowK = 1.5; },
        onAct(e) { e.eclipse = e.phase >= 2 ? 5.2 : 4.2; e.combo = e.phase >= 2 ? 3 : 2; e.glowK = 0; if (!e.eclipseHint) { e.eclipseHint = true; VS.UI.toast(VS.t('tip_custodio_eclipse'), 4.5); } },
        onEnd(e) { e.attack('smite'); } },
      // PISCAR: apaga-se e reaparece noutro sítio da cúpula
      blink: { wind: 0.35, act: 0.45, rec: 0.25, tell: null, sfx: false,
        onAct(e, g) { const h = custHome(e, g); G.burst(e.cx, e.cy, 24, { color: '#ffe8a0', speed: 120, life: 0.5, size: 1.8, add: true }); e.x = h.x - e.w / 2; e.y = h.y - e.h / 2; e.vx = 0; e.vy = 0; e.blinkT = 0.5; A.sfx('chime', { vol: 0.6 }); G.burst(e.cx, e.cy, 24, { color: '#ffe8a0', speed: 120, life: 0.5, size: 1.8, add: true }); } },
    },
    animMap: { rays: 'atk_charge', burst: 'atk_charge', blink: 'atk_blink', blades: 'atk_cast', pillars: 'atk_cast', smite: 'atk_cast', eclipse: 'atk_charge' },
    alpha: (e) => (e.blinkT > 0 ? Math.max(0, 1 - e.blinkT * 1.6) : 1),
    // todo luz: as armas e os feitiços atravessam-no; só a luz devolvida o fere (lâminas e esferas aparadas)
    onHitBoss(e, hb, g) {
      if (hb.proj && (hb.proj.kind === 'goldblade' || hb.proj.isLight)) {
        hb = Object.assign({}, hb, { dmg: Math.round(hb.dmg * 2.2) }); A.sfx('choir_hit', { vol: 0.6 });
        return VS.Enemies.Enemy.prototype.onHit.call(e, hb, g);
      }
      const x = hb.tipX !== undefined ? U.clamp(hb.tipX, e.x, e.x + e.w) : e.cx, y = hb.tipY !== undefined ? U.clamp(hb.tipY, e.y, e.y + e.h) : e.cy;
      A.sfx('light', { vol: 0.35 }); VS.FX.flare(x, y, 12, [255, 240, 200], 0.1); G.burst(x, y, 6, { color: '#fff0c0', speed: 70, life: 0.35, size: 1.2, add: true });
      if (!e.passHint || g.time - e.passHint > 9) { e.passHint = g.time; VS.UI.toast(VS.t('tip_custodio_parry'), 5); }
      return 'blocked';
    },
    // o PARRY é o que o fere: a luz do golpe volta-se contra ele (não fica atordoado — o combate não para)
    onParried(e, g) {
      const dmg = Math.round(e.maxHp * (e.phase >= 2 ? 0.045 : 0.05));
      e.hp -= dmg; e.flash = 0.22; e.lastHitT = 0; e.vx = -e.facing * 140;
      A.sfx('choir_hit'); A.sfx('boss_hit', { vol: 0.7 }); G.flash('#fff6e0', 0.28); G.addShake(0.35);
      VS.FX.flare(e.cx, e.cy, 74, [255, 244, 210], 0.4);
      for (let i = 0; i < 22; i++) { const a = Math.random() * U.TAU, sp = U.rand(120, 280); G.emit({ x: e.cx, y: e.cy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, drag: 3, life: U.rand(0.35, 0.7), size: U.rand(1.2, 2.4), color: U.pick(['#fff8e0', '#ffd870', '#ffffff']), add: true, shrink: true, layer: 2 }); }
      if (e.hp <= 0) e.die(g);
    },
    damageMult: () => 1,
    introStart(e, g) { e.glowK = 2; A.sfx('choir_hit', { vol: 0.9 }); G.flash('#fff4d0', 0.35); },
    introUpdate(e, g) { e.glowK = Math.max(0, (e.glowK || 0) - 0.01); if (Math.random() < 0.7) G.emit({ x: e.cx + U.rand(-50, 50), y: e.cy + U.rand(-50, 50), vx: U.rand(-20, 20), vy: U.rand(-40, -10), life: 1, size: U.rand(1, 2.4), color: U.pick(['#fff0c0', '#ffd870', '#ffffff']), add: true }); },
    onPhase(e, g) { A.sfx('choir_hit', { vol: 1 }); G.flash('#fff4d0', 0.3); e.atk = null; e.attack(e.phase >= 2 ? 'eclipse' : 'burst'); },
    // a lâmina de luz (sobe na preparação, brilha antes do golpe, corta em arco)
    drawFront(ctx, e) {
      const a = e.atk; if (!a || a.name !== 'smite') return;
      const t = custTip(e), k = a.phase === 'wind' ? Math.min(1, a.t / a.s.wind) : a.phase === 'act' ? 1 : Math.max(0, 1 - a.t / a.s.rec);
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      if (a.phase === 'wind') {
        const ang = -Math.PI / 2 + e.facing * (0.3 + 0.9 * k), L = 18 + 30 * k, bx = e.cx + Math.cos(ang) * 8, by = e.cy + Math.sin(ang) * 8;
        ctx.strokeStyle = `rgba(255,236,170,${(0.5 + 0.4 * k).toFixed(3)})`; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx + Math.cos(ang) * L, by + Math.sin(ang) * L); ctx.stroke();
        ctx.strokeStyle = 'rgba(255,255,250,0.9)'; ctx.lineWidth = 1.4; ctx.stroke();
      } else {
        const a0 = e.facing > 0 ? -1.4 : Math.PI + 1.4, a1 = e.facing > 0 ? 0.9 : Math.PI - 0.9;
        ctx.strokeStyle = `rgba(255,240,190,${(0.8 * k).toFixed(3)})`; ctx.lineWidth = 9 * k; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.arc(e.cx, e.cy, 40, Math.min(a0, a1), Math.max(a0, a1)); ctx.stroke();
        ctx.strokeStyle = `rgba(255,255,255,${(0.9 * k).toFixed(3)})`; ctx.lineWidth = 2.5 * k; ctx.stroke();
      }
      ctx.restore(); void t;
    },
    think(e, dt, g) {
      if (e.blinkT > 0) e.blinkT -= dt;
      if (e.eclipse > 0) e.eclipse -= dt;
      // eclipse: a cúpula escurece (o jogo junta esta escuridão à da sala)
      e.darkBoost = U.approach(e.darkBoost || 0, e.eclipse > 0 ? 0.82 : 0, dt * 2.2);
      if (e.atk) return;
      const p = g.player;
      e.face();
      // paira no alto, a seguir a protagonista de longe, com um balanço lento
      const tx = U.clamp(p.cx + Math.sin(e.anim * 0.7) * 90, e.arena.x0 + 40, e.arena.x1 - 40), ty = e.arena.floor - 140 + Math.sin(e.anim * 1.3) * 18;
      e.fly(tx, ty, 100 + e.phase * 30, dt, 0.05);
      if (Math.random() < 0.6) G.emit({ x: e.cx + U.rand(-24, 24), y: e.cy + U.rand(-24, 24), vx: U.rand(-10, 10), vy: U.rand(-20, 0), life: 0.8, size: U.rand(0.8, 1.6), color: '#ffe8a0', add: true });
      if (e.cool > 0) return;
      const seq = e.seq || (e.seq = []);
      if (!seq.length) {
        const a = e.phase >= 2 ? ['smite', 'rays', 'blades', 'smite', 'eclipse', 'burst', 'pillars', 'smite']
          : e.phase ? ['smite', 'rays', 'blades', 'pillars', 'smite', 'eclipse', 'burst', 'blink']
            : ['smite', 'blades', 'rays', 'pillars', 'smite', 'burst', 'blink'];
        for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
        seq.push(...a);
      }
      let nx = seq.shift();
      // às escuras só ataca com o que brilha (a lâmina, as lâminas de ouro, as esferas): raios e colunas ficam para depois
      if (e.eclipse > 0 && (nx === 'rays' || nx === 'pillars' || nx === 'blink')) { seq.push(nx); nx = Math.random() < 0.6 ? 'smite' : 'blades'; }
      if (nx === 'smite') e.combo = e.phase >= 2 ? 2 : e.phase ? 1 : 0;
      e.attack(nx);
    },
  });

  // enquanto a folha de sprites ainda não carregou, não se desenha nada (aparece envolta em fumo)
  VS.SpritesBoss = VS.SpritesBoss || {};
  if (!VS.SpritesBoss.carpideira) VS.SpritesBoss.carpideira = function () {};
  if (!VS.SpritesBoss.custodio) VS.SpritesBoss.custodio = function () {};
  VS.Carpideira = { wail, WailRing };
})(window.VS);
