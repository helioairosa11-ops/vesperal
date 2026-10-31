// Vesperal — chefes principais: Mestra Hilde, Ama Elowen, Corvin (rítmico), Bispo Ozias, Rei Aldric, Eco de Seraphine
'use strict';
(function (VS) {
  const U = VS.U, T = U.TILE, G = VS.Gfx, A = VS.Audio, E = VS.Enemies, B = VS.Bosses;
  const front = (e, dx, dy, w, h) => ({ x: e.facing > 0 ? e.cx + dx : e.cx - dx - w, y: e.bottom - dy - h, w, h });
  const P = (o) => new VS.Projectile(o), P2 = P;
  const firePool = (g, x, y, w, life) => g.spawn(P({ x, y: y - 5, w: w || 30, h: 10, dmg: 9, kind: 'fire', color: '#ff6010', life: life || 3, solid: false, parryable: false, reflectable: false, persist: true }));
  // coluna de perigo telegrafada (espinhos, pilares de luz, erupções)
  function columns(e, g, xs, opts) {
    const a = e.atk; const warn = opts.warn || 0.7;
    for (const x of xs) {
      if (a.t < warn) { if (Math.random() < 0.35) G.emit({ x: x + U.rand(-8, 8), y: e.arena.floor - 2, vy: -40, life: 0.4, size: 1.6, color: opts.warnCol || '#ff8030', add: true }); }
      else {
        if (Math.random() < 0.7) G.emit({ x: x + U.rand(-8, 8), y: e.arena.floor, vx: U.rand(-15, 15), vy: U.rand(-460, -300), life: 0.45, size: U.rand(2, 4), color: U.pick(opts.cols || ['#ffb040', '#ff6010']), add: true, shrink: true });
        e.attackHBs.push({ x: x - (opts.w || 12), y: e.arena.floor - (opts.h || 140), w: (opts.w || 12) * 2, h: opts.h || 140, dmg: opts.dmg || 18, id: a.id * 1000 + Math.round(x), unblockable: true, parryable: false, src: { cx: x } });
      }
    }
    if (a.t >= warn && !a.fired) { a.fired = true; A.sfx(opts.sfx || 'fire'); }
    e.colXs = a.t < warn ? xs : null; e.colWarnCol = opts.warnCol;
  }

  // AURÉOLA: um círculo de luz desenha-se à volta de um ponto e, ao fechar-se, fere quem estiver dentro — sai dele
  function haloCast(e, xs, y, opts) { e.halos = xs.map((x) => ({ x, y, r: opts.r || 46, t: 0, warn: opts.warn || 0.9, dmg: opts.dmg || 20, id: VS.Entity.newAttackId(), col: opts.col || '#ffe8a0' })); }
  function haloTick(e, g, dt) {
    if (!e.halos) return;
    for (const h of e.halos) {
      h.t += dt;
      if (h.t >= h.warn && !h.fired) { h.fired = true; A.sfx('light'); G.flash('#fff6e0', 0.12); VS.FX.flare(h.x, h.y, h.r * 1.4, [255, 240, 200], 0.35); }
      if (h.fired && h.t < h.warn + 0.22) { const r = h.r * 0.86; e.attackHBs.push({ x: h.x - r, y: h.y - r, w: r * 2, h: r * 2, dmg: h.dmg, id: h.id, unblockable: true, parryable: false, src: { cx: h.x } }); }
      else if (!h.fired && Math.random() < 0.5) { const a = Math.random() * U.TAU; G.emit({ x: h.x + Math.cos(a) * h.r, y: h.y + Math.sin(a) * h.r, vx: -Math.cos(a) * 30, vy: -Math.sin(a) * 30, life: 0.4, size: 1.2, color: h.col, add: true, shrink: true, layer: 2 }); }
    }
    e.halos = e.halos.filter((h) => h.t < h.warn + 0.4); if (!e.halos.length) e.halos = null;
  }

  // ======================================================================
  // MESTRA HILDE, A FERREIRA
  // ======================================================================
  const HEAT_MAX = 3;
  const hildeHeat = (e) => { e.heat = (e.heat || 0) + 1; if (e.heat >= HEAT_MAX) e.mustCool = true; };
  B.def('hilde', {
    cfg: { w: 30, h: 62, hp: 1050, music: 'b_hilde', heavy: true, phases: [0.5], introTime: 1.6 },
    aggr: [1.65, 2.0, 2.2], repelCol: [255, 140, 60],
    attacks: {
      hammer: { wind: 0.7, act: 0.14, rec: 0.7, dmg: 24, tell: 'white', sfx: 'swing_heavy', hb: (e) => front(e, 12, 0, 44, 58), onAct(e, g) { G.addShake(0.45); A.sfx('crush'); VS.FX.impact(e.cx + e.facing * 40, e.bottom - 2, 'metal', e.facing, 1.3); firePool(g, e.cx + e.facing * 40, e.arena.floor, 40, 3.5); hildeHeat(e); } },
      sweep: { wind: 0.55, act: 0.2, rec: 0.55, dmg: 20, tell: 'white', sfx: 'swing_heavy', hb: (e) => front(e, -14, 0, 72, 32), lunge: 80, onAct(e) { hildeHeat(e); } },
      // TENAZ: lança a tenaz em brasa presa a uma corrente, à altura da cabeça da protagonista; se a apanha, puxa-a para
      // junto dela e segue-se a martelada. Salta-lhe por cima, agacha-te, ou apara-a (branco) para a fazer ressaltar.
      ingots: { wind: 0.55, act: 0.12, rec: 0.75, tell: 'white', sfx: 'whip', onAct(e, g) {
        const h = (VS.EnemyRender.point(e, e._f, 'handF')) || { x: e.cx + e.facing * 20, y: e.bottom - 40 }, dir = e.facing, owner = e;
        const tg = P({ x: h.x - 6, y: e.bottom - 30, vx: dir * 430, w: 12, h: 10, dmg: 10, kind: 'tongs', color: '#ff8030', life: 1.6, solid: true, reflectable: false, persist: false, light: false, tongs: true, owner,
          update2(dt) { this.age = (this.age || 0) + dt; if (this.age > 0.42 && !this.back) { this.back = true; this.vx = -this.vx * 1.15; } if (this.back && (this.cx - owner.cx) * Math.sign(this.vx) > -10) this.remove = true; },
          onHitPlayer(p, gm) { p.vx = -dir * 520; p.vy = -150; owner.pullHammer = 0.35; A.sfx('hit_metal'); VS.FX.sparks(p.cx, p.cy, 10, -dir, { speed: 200 }); } });
        g.spawn(tg); e.tongsProj = tg;
      } },
      anvil: { wind: 0.4, act: 1.2, rec: 0.5, tell: null, sfx: 'chime', onAct(e, g) { e.anvilX = g.player.cx; },
        during(e, g) { const a = e.atk; if (a.t < 0.8) { e.anvilShadow = e.anvilX; } else if (!a.dropped) { a.dropped = true; e.anvilShadow = null; g.spawn(P({ x: e.anvilX, y: 10, vx: 0, vy: 500, g: 1400, w: 30, h: 20, dmg: 30, kind: 'ingot', color: '#ff7020', life: 2, parryable: false, reflectable: false, onHitWall(g2) { G.addShake(0.5); A.sfx('crush'); G.burst(this.cx, this.cy, 20, { color: '#ffb040', speed: 160, life: 0.5, size: 2, add: true }); } })); } } },
      eruption: { wind: 0.5, act: 2.4, rec: 0.7, tell: null, sfx: 'roar', onAct(e, g) { e.eruptX = 40; e.eruptDir = g.player.cx > g.room.pw / 2 ? 1 : -1; if (e.eruptDir < 0) e.eruptX = g.room.pw - 40; G.addShake(0.4); A.sfx('crush'); hildeHeat(e); },
        during(e, g, dt) { const a = e.atk; const k = Math.floor(a.t / 0.28); if (k !== a.lastK) { a.lastK = k; const x = e.eruptDir > 0 ? 40 + k * 90 : g.room.pw - 40 - k * 90; a.cols = a.cols || []; a.cols.push({ x, t: 0 }); } (a.cols || []).forEach((c) => { c.t += dt; if (c.t < 0.5) { if (Math.random() < 0.4) G.emit({ x: c.x + U.rand(-10, 10), y: e.arena.floor - 2, vy: -40, life: 0.3, size: 1.6, color: '#ff8030', add: true }); } else if (c.t < 0.9) { if (Math.random() < 0.8) G.emit({ x: c.x + U.rand(-10, 10), y: e.arena.floor, vy: U.rand(-500, -320), life: 0.45, size: U.rand(2, 4), color: U.pick(['#ffb040', '#ff6010']), add: true, shrink: true }); e.attackHBs.push({ x: c.x - 16, y: e.arena.floor - 150, w: 32, h: 150, dmg: 18, id: a.id * 1000 + c.x, unblockable: true, parryable: false, src: { cx: c.x } }); if (!c.s) { c.s = 1; A.sfx('fire', { vol: 0.5 }); } } }); } },
      // ponto fraco: depois de três golpes o cabo em brasa queima-lhe as mãos — larga o malho e fica exposta
      overheat: { wind: 0.25, act: 1.9, rec: 0.45, tell: null, sfx: 'crackle', onAct(e, g) { e.heat = 0; e.mustCool = false; A.sfx('fire', { vol: 0.6 }); G.burst(e.cx + e.facing * 22, e.bottom - 4, 18, { color: '#ffd080', speed: 120, life: 0.5, size: 1.8, add: true }); if (!e.heatHint) { e.heatHint = true; VS.UI.toast(VS.t('tip_hilde_heat'), 5); } },
        during(e, g) { if (Math.random() < 0.5) for (const k of ['handF', 'handB']) { const q = VS.EnemyRender.point(e, e._f, k); if (q) G.emit({ x: q.x + U.rand(-2, 2), y: q.y, vx: U.rand(-10, 10), vy: U.rand(-50, -30), life: 0.8, size: U.rand(2, 4), color: 'rgba(200,190,180,0.35)', kind: 'glow', color2: '#000000' }); } } },
    },
    think(e, dt, g) {
      if (e.atk) return;
      e.face(); const d = Math.abs(e.dx());
      if (e.pullHammer > 0) { e.pullHammer -= dt; if (e.pullHammer <= 0) { e.face(); e.attack('hammer'); } return; }
      if (e.mustCool) { e.attack('overheat'); return; }
      if (e.cool > 0) { e.walk(d > 80 ? e.facing : d < 40 ? -e.facing : 0, e.phase ? 78 : 62, dt); return; }
      const r = Math.random();
      if (e.phase && r < 0.18) { e.attack('eruption'); return; }
      if (d < 70) e.attack(r < 0.5 ? 'hammer' : 'sweep');
      else if (d < 220) e.attack(r < 0.5 ? 'ingots' : 'anvil');
      else e.attack(r < 0.6 ? 'ingots' : 'anvil');
    },
    damageMult(e, hb) { const a = e.atk; if (a && a.name === 'overheat' && a.phase !== 'wind') { const q = VS.EnemyRender.point(e, e._f, 'handF'); if (q) VS.FX.flare(q.x, q.y, 18, [255, 200, 140], 0.15); return 1.8; } return 1; },
    onPhase(e, g) { A.sfx('roar'); G.addShake(0.5); e.cool = 0; VS.UI.bark('boss_hilde', 'hilde_mid'); },
    preLines: () => [{ s: 'boss_hilde', k: 'hilde_pre1' }, { s: 'boss_hilde', k: 'hilde_pre2' }],
    eyeLight: { r: 14, i: 0.35, color: '#ffa040' },
    smearCol: [255, 170, 90],
    // a cabeça do malho aquece a cada golpe: laranja → amarelo → branco (sinal do ponto fraco)
    drawOver(ctx, e) {
      const tg = e.tongsProj;
      if (tg && !tg.remove) {
        const h = VS.EnemyRender.point(e, e._f, 'handF') || { x: e.cx + e.facing * 20, y: e.bottom - 40 }, n = 14, sag = Math.min(10, Math.abs(tg.cx - h.x) * 0.06);
        ctx.save(); ctx.lineWidth = 1.3; ctx.strokeStyle = '#2a2420';
        for (let i = 0; i < n; i++) { const k = (i + 0.5) / n, x = U.lerp(h.x, tg.cx, k), y = U.lerp(h.y, tg.cy, k) + Math.sin(k * Math.PI) * sag; ctx.beginPath(); ctx.ellipse(x, y, 1.8, 1.1, i % 2 ? 0 : Math.PI / 2, 0, U.TAU); ctx.stroke(); }
        ctx.restore();
      } else if (tg) e.tongsProj = null;
      const L = e._f && VS.EnemyRender.point(e, e._f, 'light'); if (!L) return;
      const hot = e.atk && e.atk.name === 'overheat', k = hot ? 1.2 : (e.heat || 0) / HEAT_MAX; if (k <= 0.05) return;
      const p = 0.85 + 0.15 * Math.sin((e.t || 0) * (8 + k * 10)), r = 10 + k * 8;
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      const gg = ctx.createRadialGradient(L.x, L.y, 0, L.x, L.y, r); gg.addColorStop(0, `rgba(255,${200 + k * 40 | 0},${120 + k * 100 | 0},${0.55 * k * p})`); gg.addColorStop(1, 'rgba(255,120,40,0)');
      ctx.fillStyle = gg; ctx.fillRect(L.x - r, L.y - r, r * 2, r * 2); ctx.restore();
    },
    light(e) { const L = e._f && VS.EnemyRender.point(e, e._f, 'light'); const k = (e.heat || 0) / HEAT_MAX, hot = e.atk && e.atk.name === 'overheat'; if (L) G.light(L.x, L.y, 80 + k * 50 + (hot ? 40 : 0), hot || k > 0.6 ? '#ffd890' : '#ff7020', 0.7 + k * 0.4, 2); if (e.anvilShadow) G.light(e.anvilShadow, e.arena.floor - 10, 40, '#ff3020', 0.8); },
  });

  // ======================================================================
  // AMA ELOWEN — a ama das silvas. Rápida: nunca fica plantada, enterra-se e corre por baixo do chão atrás de quem a
  // caça para irromper debaixo dela; raízes em onda pelo chão, anel de espinhos, chicote de silvas, nuvens de esporos.
  // Ponto fraco: a canção de embalar (um golpe enquanto canta cala-a). Na fase 2 a água sobe e ela ainda acelera.
  // ======================================================================
  const ER = () => VS.EnemyRender;
  // anel de espinhos: cresce a partir dela e fere quem o anel apanhar — atravessa-se com a esquiva, ou foge-se para longe
  class ThornRing extends VS.Entity {
    constructor(x, y, speed, max, dmg) {
      super(x - 2, y - 2, 4, 4); this.ox = x; this.oy = y; this.r = 14; this.speed = speed; this.max = max; this.dmg = dmg;
      this.z = 6; this.attackHBs = []; this.aid = VS.Entity.newAttackId(); this.drawAlways = true; this.rot = Math.random() * U.TAU;
    }
    update(dt, game) {
      super.update(dt, game);
      this.r += this.speed * dt; this.attackHBs = [];
      if (this.r > this.max) { this.remove = true; return; }
      const n = Math.max(14, Math.round(this.r / 7));
      for (let i = 0; i < n; i++) {
        const a = i / n * U.TAU, x = this.ox + Math.cos(a) * this.r, y = this.oy + Math.sin(a) * this.r;
        if (y > game.room.ph || game.room.solidAtPoint(x, y)) continue;
        this.attackHBs.push({ x: x - 6, y: y - 6, w: 12, h: 12, dmg: this.dmg, id: this.aid, unblockable: true, parryable: false, src: { cx: this.ox } });
      }
    }
    draw(ctx) {
      const k = 1 - this.r / this.max, n = Math.max(16, Math.round(this.r / 6));
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = `rgba(150,220,110,${(0.42 * k + 0.08).toFixed(3)})`; ctx.lineWidth = 9; ctx.beginPath(); ctx.arc(this.ox, this.oy, Math.max(1, this.r - 3), 0, U.TAU); ctx.stroke();
      ctx.globalCompositeOperation = 'source-over';
      for (let i = 0; i < n; i++) {
        const a = i / n * U.TAU + this.rot, c = Math.cos(a), s = Math.sin(a), r0 = this.r - 5, L = 12 + (i % 3) * 4;
        ctx.fillStyle = `rgba(30,42,18,${(0.8 * k + 0.2).toFixed(3)})`;
        ctx.beginPath(); ctx.moveTo(this.ox + c * r0 - s * 3.2, this.oy + s * r0 + c * 3.2); ctx.lineTo(this.ox + c * (r0 + L), this.oy + s * (r0 + L)); ctx.lineTo(this.ox + c * r0 + s * 3.2, this.oy + s * r0 - c * 3.2); ctx.fill();
        ctx.fillStyle = `rgba(226,240,190,${(0.75 * k + 0.1).toFixed(3)})`;
        ctx.beginPath(); ctx.moveTo(this.ox + c * (r0 + L * 0.4), this.oy + s * (r0 + L * 0.4)); ctx.lineTo(this.ox + c * (r0 + L), this.oy + s * (r0 + L)); ctx.lineTo(this.ox + c * (r0 + L * 0.4) + s * 1.4, this.oy + s * (r0 + L * 0.4) - c * 1.4); ctx.fill();
      }
      ctx.strokeStyle = `rgba(220,240,180,${(0.7 * k).toFixed(3)})`; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.arc(this.ox, this.oy, Math.max(1, this.r - 5), 0, U.TAU); ctx.stroke();
      ctx.restore();
    }
  }
  VS.ThornRing = ThornRing;
  // silvas que rompem do chão (onda de raízes, erupção): três espigões curvos com espinhos claros
  function rootSpikes(ctx, x, fl, h, seed, pal) {
    if (h <= 1) return;
    const C = pal || ['#18200e', '#4e6428', '#d8d0b0'];
    const r = (k) => { const v = Math.sin(seed * 12.9898 + k * 78.233) * 43758.5453; return v - Math.floor(v); };
    for (let i = 0; i < 3; i++) {
      const bx = x + (i - 1) * 7 + (r(i) - 0.5) * 4, hh = h * (0.62 + r(i + 3) * 0.45), lean = (r(i + 6) - 0.5) * 12, w = 4 + r(i + 9) * 3;
      ctx.fillStyle = C[0]; ctx.beginPath(); ctx.moveTo(bx - w, fl); ctx.quadraticCurveTo(bx - w * 0.3 + lean * 0.3, fl - hh * 0.6, bx + lean, fl - hh); ctx.quadraticCurveTo(bx + w * 0.4 + lean * 0.4, fl - hh * 0.55, bx + w, fl); ctx.fill();
      ctx.fillStyle = C[1]; ctx.beginPath(); ctx.moveTo(bx - w * 0.35, fl); ctx.quadraticCurveTo(bx + lean * 0.25, fl - hh * 0.6, bx + lean, fl - hh); ctx.lineTo(bx + w * 0.1, fl); ctx.fill();
      ctx.fillStyle = C[2];
      for (let q = 1; q < 4; q++) { const y = fl - hh * q / 4.2, xx = bx + lean * q / 4.2, s = q % 2 ? 1 : -1; ctx.beginPath(); ctx.moveTo(xx, y); ctx.lineTo(xx + s * 4.5, y - 2.6); ctx.lineTo(xx, y - 2.4); ctx.fill(); }
    }
  }
  const elowenHand = (e) => (ER().point(e, e._f, 'hand') || { x: e.cx + e.facing * 14, y: e.y + 26 });
  B.def('elowen', {
    cfg: { w: 32, h: 68, hp: 1100, music: 'b_elowen', heavy: true, phases: [0.5], introTime: 1.8, blood: '#2a3a1a' },
    aggr: [1.6, 2.0, 2.2],
    repelCol: [170, 230, 140],
    attacks: {
      // ENTERRAR (vermelho): crava as mãos-raiz na terra e afunda-se; corre por baixo do chão atrás de ti (vê-se o monte de terra
      // a mexer) e irrompe onde estás — o chão racha e brilha um instante antes: sai dali ou atravessa com a esquiva
      burrow: { wind: 0.48, act: 3.2, rec: 0.4, tell: 'red', sfx: false,
        onWind(e) { e.bur = null; A.sfx('burrow', { vol: 0.85 }); },
        windTick(e, g) { e.sink = Math.min(1, e.atk.t / e.atk.s.wind); if (Math.random() < 0.8) G.emit({ x: e.cx + U.rand(-18, 18), y: e.arena.floor - 2, vx: U.rand(-70, 70), vy: U.rand(-150, -40), g: 520, life: 0.6, size: U.rand(1.2, 2.6), color: U.pick(['#3a3020', '#4a5a2a', '#2a2014']) }); },
        onAct(e) { e.sink = 1; e.bur = { ph: 'travel', t: 0 }; },
        during(e, g, dt) {
          const b = e.bur, a = e.atk; if (!b) return; b.t += dt;
          if (b.ph === 'travel') {
            const dx = g.player.cx - e.cx, sp = e.phase ? 340 : 280;
            e.vx = Math.sign(dx) * Math.min(Math.abs(dx) * 9, sp);
            if (Math.random() < 0.7) G.emit({ x: e.cx + U.rand(-14, 14), y: e.arena.floor - 2, vx: -e.vx * 0.2 + U.rand(-30, 30), vy: U.rand(-120, -40), g: 500, life: 0.5, size: U.rand(1, 2.2), color: U.pick(['#3a3020', '#4a5a2a']) });
            if (Math.random() < 0.06) A.sfx('rumble', { vol: 0.3 });
            if ((Math.abs(dx) < 6 && b.t > 0.25) || b.t > (e.phase ? 0.95 : 1.2)) { b.ph = 'warn'; b.t = 0; e.vx = 0; A.sfx('rumble', { vol: 0.75 }); }
          } else if (b.ph === 'warn') {
            e.vx = 0;
            if (Math.random() < 0.6) G.emit({ x: e.cx + U.rand(-30, 30), y: e.arena.floor - 2, vx: U.rand(-20, 20), vy: U.rand(-90, -30), g: 400, life: 0.4, size: U.rand(1, 2), color: '#c8e090', add: true });
            if (b.t > (e.phase ? 0.34 : 0.44)) {
              b.ph = 'erupt'; b.t = 0; b.id = VS.Entity.newAttackId(); A.sfx('root_burst'); G.addShake(0.55);
              VS.FX.impact(e.cx, e.arena.floor - 2, 'stone', e.facing, 1.6);
              G.burst(e.cx, e.arena.floor - 4, 26, { color: '#4a3a24', speed: 240, angle: -Math.PI / 2, spread: 1.3, g: 600, life: 0.8, size: 2.6 });
            }
          } else {
            e.sink = Math.max(0, 1 - b.t / 0.26);
            if (b.t < 0.28) e.attackHBs.push({ x: e.cx - 48, y: e.arena.floor - 84, w: 96, h: 84, dmg: 22, id: b.id, unblockable: true, parryable: false, knock: 300, src: e });
            if (b.t > 0.32) { e.sink = 0; a.t = a.s.act; }
          }
        },
        onEnd(e) { e.bur = null; e.sink = 0; if (e.phase && !e.burChain && Math.random() < 0.45) { e.burChain = true; e.attack('burrow'); } else e.burChain = false; } },
      // ONDA DE RAÍZES: bate com as mãos no chão e as silvas rompem em fila, a correr para os dois lados — salta-as
      rootwave: { wind: 0.55, act: 1.6, rec: 0.45, tell: null, sfx: false,
        onAct(e) { e.rw = { x0: e.cx, k: 0, t: 0, cols: [] }; A.sfx('root_burst', { vol: 0.6 }); G.addShake(0.3); VS.FX.impact(e.cx + e.facing * 16, e.arena.floor - 2, 'stone', e.facing, 1.1); },
        during(e, g, dt) {
          const w = e.rw; if (!w) return; w.t += dt;
          const step = e.phase ? 0.055 : 0.07, gap = 34;
          while (w.t > (w.k + 1) * step && w.k < 24) { w.k++; for (const s of [-1, 1]) { const x = w.x0 + s * w.k * gap; if (x > e.arena.x0 - 12 && x < e.arena.x1 + 12) w.cols.push({ x, t: 0, id: VS.Entity.newAttackId(), seed: Math.random() * 100 }); } }
          for (const c of w.cols) {
            c.t += dt;
            if (c.t < 0.2) { if (Math.random() < 0.3) G.emit({ x: c.x + U.rand(-8, 8), y: e.arena.floor - 2, vx: U.rand(-20, 20), vy: U.rand(-80, -30), g: 400, life: 0.35, size: U.rand(1, 1.8), color: '#5a4a30' }); }
            else if (c.t < 0.44) {
              e.attackHBs.push({ x: c.x - 11, y: e.arena.floor - 48, w: 22, h: 48, dmg: 16, id: c.id, unblockable: true, parryable: false, src: { cx: c.x } });
              if (!c.s) { c.s = 1; G.burst(c.x, e.arena.floor - 4, 6, { color: '#3a2c1c', speed: 120, angle: -Math.PI / 2, spread: 1.2, g: 500, life: 0.5, size: 1.8 }); if (Math.random() < 0.35) A.sfx('crackle', { vol: 0.6 }); }
            }
          }
          e.rootCols = w.cols;
        },
        onEnd(e) { e.rw = null; e.rootCols = null; } },
      // ANEL DE ESPINHOS (vermelho): roda sobre si e os espinhos saltam em anel — esquiva-te através dele ou sai de perto
      thornring: { wind: 0.52, act: 0.3, rec: 0.55, tell: 'red', sfx: false,
        onAct(e, g) { g.spawn(new ThornRing(e.cx, e.cy + 8, e.phase ? 310 : 260, e.phase ? 150 : 128, 18)); A.sfx('thorn_ring'); G.addShake(0.35); } },
      // chicote de silvas (branco: aparável); na fase 2 volta com um revés
      whip: { wind: 0.46, act: 0.18, rec: 0.42, dmg: 18, tell: 'white', sfx: 'whip', hb: (e) => front(e, 26, 38, 112, 18), onEnd(e) { if (e.phase && Math.random() < 0.6) e.attack('whip2'); } },
      whip2: { wind: 0.3, act: 0.18, rec: 0.5, dmg: 18, tell: 'white', sfx: 'whip', hb: (e) => front(e, 22, 14, 104, 20) },
      // CHICOTADA AO LONGE (vermelho): prende uma silva à parede do fundo e atira-se pela sala a direito — salta-lhe por cima
      vinedash: { wind: 0.55, act: 0.8, rec: 0.45, tell: 'red', sfx: 'whip',
        onAct(e) { e.dashDir = e.facing; A.sfx('wind', { vol: 0.6 }); },
        during(e, g) {
          const a = e.atk; e.vx = e.dashDir * (e.phase ? 470 : 420); e.facing = e.dashDir;
          e.attackHBs.push({ x: e.x - 4, y: e.y + 10, w: e.w + 8, h: e.h - 10, dmg: 20, id: a.id, unblockable: true, parryable: false, src: e });
          if (Math.random() < 0.8) G.emit({ x: e.cx - e.dashDir * 14, y: e.y + U.rand(10, e.h), vx: -e.dashDir * U.rand(40, 120), vy: U.rand(-40, 20), life: 0.6, size: U.rand(1.2, 2.2), color: U.pick(['#4a6a2a', '#7a9a4a', '#2a3a18']), kind: 'leaf', vr: 6 });
          if (e.wallAhead(e.dashDir) || (e.dashDir > 0 ? e.x + e.w >= e.arena.x1 - 4 : e.x <= e.arena.x0 + 4)) a.t = a.s.act;
        },
        onEnd(e) { e.vx = 0; } },
      // esporos: três vagens que rebentam no chão em nuvens que abrandam (e queimam um pouco)
      spores: { wind: 0.5, act: 0.1, rec: 0.55, tell: null, sfx: 'swing',
        onAct(e, g) {
          const h = elowenHand(e), p = g.player, n = e.phase ? 4 : 3;
          for (let i = 0; i < n; i++) {
            const tx = U.clamp(p.cx + (i - (n - 1) / 2) * 56 + U.rand(-10, 10), e.arena.x0 + 10, e.arena.x1 - 10), T2 = 0.85;
            g.spawn(P({ x: h.x, y: h.y, vx: (tx - h.x) / T2, vy: -320, g: 720, w: 10, h: 10, dmg: 10, kind: 'seed', color: '#a0c060', life: 3, reflectable: true, breakable: true, light: false,
              onHitWall(g2) { g2.spawn(P({ x: this.cx, y: this.cy - 14, w: 46, h: 34, dmg: 6, kind: 'incense', color: '#9ab060', life: 2.6, solid: false, persist: true, parryable: false, reflectable: false, light: false, onHitPlayer(pl) { pl.slowT = Math.max(pl.slowT || 0, 1.2); } })); A.sfx('splash', { vol: 0.3 }); } }));
          }
        } },
      thorns: { wind: 0.4, act: 1.2, rec: 0.5, tell: null, sfx: 'whip', onAct(e, g) { const p = g.player; e.thX = [p.cx - 40, p.cx, p.cx + 40].map((x) => U.clamp(x, 30, g.room.pw - 30)); }, during(e, g) { columns(e, g, e.thX, { warn: 0.62, h: 60, w: 14, dmg: 18, sfx: 'whip', warnCol: '#8aa050', cols: ['#4a5a2a', '#6a7a3a'] }); } },
      // ponto fraco: a canção é longa — um golpe enquanto canta cala-a e deixa-a vergada sobre a trouxa
      lullaby: { wind: 1.35, act: 0.1, rec: 0.6, tell: null, sfx: 'choir_hit', onWind(e) { A.sfx('chime', { vol: 0.5 }); }, onAct(e) { e.ringR = 10; e.ringOn = true; } },
    },
    animMap: { burrow: 'atk_thorns', rootwave: 'atk_thorns', thornring: 'atk_lullaby', whip2: 'atk_whip', spores: 'atk_seeds', vinedash: 'atk_whip' },
    animState(e) { const a = e.atk; if (a && a.name === 'vinedash' && a.phase === 'act') return { anim: 'move', idx: (e.anim * 18) % 8 }; return null; },
    init(e) { e.ringR = 0; e.ringOn = false; e.sink = 0; },
    think(e, dt, g) {
      // anel da canção de embalar: abranda quem estiver na onda
      if (e.ringOn) { e.ringR += 160 * dt; const p = g.player; const d = Math.hypot(p.cx - e.cx, p.cy - e.cy); if (Math.abs(d - e.ringR) < 14 && !(p.action && p.action.type === 'dodge')) p.slowT = 2.2; if (e.ringR > 420) e.ringOn = false; }
      if (e.phase && g.floodY > e.floodTarget) g.floodY -= dt * 6;
      // notas da canção a sair da boca enquanto embala
      if (e.atk && e.atk.name === 'lullaby' && e.atk.phase === 'wind' && Math.random() < 0.12) { const m = ER().point(e, e._f, 'mouth'); if (m) G.emit({ x: m.x, y: m.y, vx: e.facing * U.rand(10, 30), vy: U.rand(-40, -20), life: 1.4, size: 1.8, color: '#c8f0b0', add: true }); if (!e.songHint && e.atk.t > 0.5) { e.songHint = true; VS.UI.toast(VS.t('tip_elowen_song'), 4); } }
      e.underground = e.sink > 0.001; e.hittable = e.sink < 0.6;
      if (e.atk) { if (e.atk.name === 'lullaby') e.vx = 0; return; }
      if (e.sink > 0) e.sink = Math.max(0, e.sink - dt * 4);
      e.face(); const d = Math.abs(e.dx()), ph = e.phase;
      if (e.cool > 0) {
        // nunca fica plantada: aproxima-se ou recua para a sua distância, a deslizar sobre as raízes
        const dir = d < 90 ? -e.facing : d > 170 ? e.facing : (Math.sin(e.anim * 1.7) > 0.55 ? e.facing : 0);
        e.walk(dir, ph ? 150 : 125, dt); return;
      }
      const r = Math.random();
      if (d > 210) e.attack(r < 0.42 ? 'burrow' : r < 0.66 ? 'vinedash' : r < 0.84 ? 'spores' : 'rootwave');
      else if (d < 80) e.attack(r < 0.36 ? 'whip' : r < 0.6 ? 'thornring' : r < 0.84 ? 'burrow' : r < 0.93 ? 'rootwave' : 'lullaby');
      else e.attack(r < 0.22 ? 'rootwave' : r < 0.42 ? 'burrow' : r < 0.56 ? 'whip' : r < 0.68 ? 'thorns' : r < 0.8 ? 'spores' : r < 0.9 ? 'vinedash' : 'lullaby');
    },
    damageMult(e) {
      const a = e.atk;
      if (a && a.name === 'lullaby' && a.phase === 'wind') {
        e.atk = null; e.stagger = 1.6; e.cool = 0.6; A.sfx('stagger'); A.sfx('glass', { vol: 0.5 });
        const L = ER().point(e, e._f, 'light'); if (L) { VS.FX.flare(L.x, L.y, 26, [200, 240, 180], 0.2); G.burst(L.x, L.y, 16, { color: '#c8f0b0', speed: 120, life: 0.6, size: 1.6, add: true }); }
        VS.UI.toast(VS.t('tip_elowen_broken'), 3); return 1.6;
      }
      return e.stagger > 0 ? 1.3 : 1;
    },
    // debaixo do chão: um monte de terra e raízes a correr; a afundar ou a sair, o corpo cortado pela linha do chão
    drawSpecial(ctx, e) {
      if (!(e.sink > 0.001)) return false;
      const fl = e.arena.floor, b = e.bur, t = e.t || 0;
      if (e.sink < 0.999) { ctx.save(); ctx.beginPath(); ctx.rect(e.cx - 140, fl - 420, 280, 420); ctx.clip(); ctx.translate(0, e.sink * (e.h + 16)); ER().draw(ctx, e); ctx.restore(); }
      const x = e.cx, wob = Math.sin(t * 18) * 1.4, mk = e.sink;
      for (let i = 0; i < 3; i++) { ctx.fillStyle = ['#211a10', '#33291a', '#46562a'][i]; ctx.beginPath(); ctx.ellipse(x + wob * (i - 1), fl, (30 - i * 8) * mk, (8 - i * 2 + Math.sin(t * 14 + i) * 0.8) * mk, 0, Math.PI, 0); ctx.fill(); }
      ctx.strokeStyle = '#1a2410'; ctx.lineWidth = 1.6;
      for (let i = 0; i < 4; i++) { const ox = x + (i - 1.5) * 9 + Math.sin(t * 6 + i) * 2, hh = (6 + (i % 2) * 5) * mk; ctx.beginPath(); ctx.moveTo(ox, fl - 2); ctx.quadraticCurveTo(ox + 4, fl - hh * 0.6, ox + Math.sin(t * 9 + i) * 3, fl - hh); ctx.stroke(); }
      if (b && b.ph === 'warn') {
        const k = Math.min(1, b.t / 0.4);
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        const gr = ctx.createRadialGradient(x, fl, 0, x, fl, 56); gr.addColorStop(0, `rgba(210,255,170,${(0.6 * k).toFixed(3)})`); gr.addColorStop(1, 'rgba(120,200,90,0)');
        ctx.fillStyle = gr; ctx.fillRect(x - 56, fl - 34, 112, 38);
        ctx.strokeStyle = `rgba(232,255,204,${(0.85 * k).toFixed(3)})`; ctx.lineWidth = 1.2;
        for (let i = 0; i < 7; i++) { const s = i % 2 ? 1 : -1, L = (12 + 34 * k) * (0.6 + 0.4 * ((i * 37) % 10) / 10); ctx.beginPath(); ctx.moveTo(x, fl - 1); ctx.lineTo(x + s * L * 0.5, fl - 2); ctx.lineTo(x + s * L, fl - 1); ctx.stroke(); }
        ctx.restore();
      }
      if (b && b.ph === 'erupt') { const hh = 64 * Math.min(1, b.t / 0.08) * Math.max(0, 1 - Math.max(0, b.t - 0.2) / 0.2); for (let i = -2; i <= 2; i++) rootSpikes(ctx, x + i * 18, fl, hh * (1 - Math.abs(i) * 0.18), i + 7); }
      return true;
    },
    // a silva do chicote e as raízes da onda (espigões que sobem e voltam a entrar)
    drawOver(ctx, e) {
      const cols = e.rootCols; if (cols) for (const c of cols) { if (c.t < 0.2 || c.t > 0.62) continue; const k = c.t < 0.26 ? (c.t - 0.2) / 0.06 : c.t > 0.44 ? Math.max(0, 1 - (c.t - 0.44) / 0.18) : 1; rootSpikes(ctx, c.x, e.arena.floor, 46 * k, c.seed); }
      const a = e.atk; if (!a || (a.name !== 'whip' && a.name !== 'whip2') || a.phase === 'wind') return;
      const h = ER().point(e, e._f, 'hand'); if (!h) return;
      const ext = a.phase === 'act' ? Math.min(1, 0.4 + a.t / 0.1) : Math.max(0, 1 - a.t / 0.3); if (ext <= 0.02) return;
      const L = 112 * ext, n = 18, pts = [], dy = a.name === 'whip2' ? 18 : 4;
      for (let i = 0; i <= n; i++) { const k = i / n; pts.push([h.x + e.facing * L * k, h.y + Math.sin(k * 9 + (e.t || 0) * 30) * 3 * k * (1 - k * 0.5) + k * dy]); }
      ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      for (const [w, c] of [[4.2, '#0e140a'], [2.8, '#3e5228'], [1.0, '#6e8a46']]) { ctx.lineWidth = w * 0.7; ctx.strokeStyle = c; ctx.beginPath(); pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.stroke(); }
      ctx.fillStyle = '#d8d0b0';
      for (let i = 2; i < n; i += 2) { const p = pts[i], s = i % 4 ? -1 : 1; ctx.beginPath(); ctx.moveTo(p[0] - 1.2, p[1]); ctx.lineTo(p[0] + e.facing * 1.6, p[1] + s * 3.2); ctx.lineTo(p[0] + 1.2, p[1]); ctx.fill(); }
      ctx.restore();
    },
    // a chicotada ao longe deixa um rasto (a silhueta dela, verde, atrás)
    drawBehind(ctx, e) { const a = e.atk; if (a && a.name === 'vinedash' && a.phase === 'act') ER().ghost(ctx, e, '#9fd080', 0.5, -e.dashDir * 18, 0); },
    onPhase(e, g) {
      A.sfx('roar'); G.addShake(0.5); A.sfx('splash'); e.cool = 0;
      g.floodY = e.arena.floor + 2; e.floodTarget = e.arena.floor - T * 2.2;
      VS.UI.bark('boss_elowen', 'elowen_mid');
    },
    preLines: () => [{ s: 'boss_elowen', k: 'elowen_pre1' }, { s: 'boss_elowen', k: 'elowen_pre2' }],
    eyeLight: { r: 16, i: 0.4, color: '#a8f0a0', when: (e) => !(e.sink > 0.5) },
    light(e) { if (e.sink > 0.9) { G.light(e.cx, e.arena.floor - 6, 60, '#b0ffd0', 0.5, 1); return; } const L = e._f && ER().point(e, e._f, 'light'); const sing = e.atk && e.atk.name === 'lullaby'; G.light(L ? L.x : e.cx, L ? L.y : e.y + 10, sing ? 130 : 100, '#b0ffd0', sing ? 0.85 : 0.6, 1); },
  });

  // ======================================================================
  // CORVIN, O MENESTREL — toca do alto dos balcões, com os ataques no compasso da música (120 BPM); de tempos a tempos
  // salta lá de cima e crava o alaúde no chão (onda de choque) e fica tonto um instante; luta então cá em baixo com o
  // alaúde até voltar a subir. As notas apontadas devolvem-se com o parry (e ferem-no) ou cortam-se com a arma.
  // ======================================================================
  // padrões por fase (16 tempos): n = nota apontada, w = onda no chão, r = chuva de notas, d = golpe (se a protagonista
  // estiver no balcão), j = muda de balcão
  const CORVIN_PATTERNS = [
    'n.......w...n...',
    'n...n...w...r...',
    'n.n.w...n.r...j.',
  ];
  const corvinPerch = (e) => e.perches[e.perchI];
  const corvinOnPerch = (e, who) => { const P = corvinPerch(e); return who.bottom <= P.y + 6 && who.bottom >= P.y - 60 && who.cx >= P.x0 - 24 && who.cx <= P.x1 + 24; };
  const corvinNote = (o) => P2(Object.assign({ w: 10, h: 10, dmg: 13, kind: 'note', color: U.pick(['#ffd070', '#ff9070', '#c0a0ff']), life: 5, solid: false, breakable: true }, o));
  function corvinLeap(e, g, avoid) {
    const p = g.player; let best = -1, bd = -1;
    e.perches.forEach((P, i) => { if (i === e.perchI && e.mode === 'perch') return; const d = Math.abs((P.x0 + P.x1) / 2 - p.cx) + (avoid && i === avoid ? -999 : 0); if (d > bd) { bd = d; best = i; } });
    if (best < 0) return;
    G.burst(e.cx, e.cy, 18, { color: '#ffe0a0', speed: 110, life: 0.5, size: 1.5, add: true }); A.sfx('chime', { vol: 0.6 });
    e.perchI = best; const P = e.perches[best];
    e.x = (P.x0 + P.x1) / 2 - e.w / 2; e.y = P.y - e.h; e.vx = 0; e.vy = 0; e.hitsHere = 0; e.nearT = 0; e.mode = 'perch'; e.perchT = 0;
    G.burst(e.cx, e.cy, 18, { color: '#ffe0a0', speed: 110, life: 0.5, size: 1.5, add: true });
    e.beatAnim = { anim: 'bow', t: 0, d: 0.35 };
  }
  // cá em baixo: golpes de alaúde, rodopio, leque de notas; volta a subir ao fim de algum tempo
  function corvinGround(e, dt, g) {
    e.groundT += dt;
    if (e.atk) return;
    e.face(); const d = Math.abs(e.dx());
    if (e.groundT > (e.phase >= 2 ? 5.2 : 6.5)) { corvinLeap(e, g); return; }
    if (e.cool > 0) { e.walk(d > 62 ? e.facing : d < 30 ? -e.facing : 0, 100, dt); return; }
    const r = Math.random();
    if (d < 64) e.attack(r < 0.55 ? 'strike' : r < 0.8 ? 'spin' : 'fan');
    else if (d < 170) e.attack(r < 0.45 ? 'fan' : r < 0.7 ? 'spin' : 'strike');
    else { e.walk(e.facing, 120, dt); if (r < 0.025) e.attack('fan'); }
  }
  B.def('corvin', {
    cfg: { w: 22, h: 62, hp: 1000, music: 'b_corvin', phases: [0.6, 0.3], introTime: 1.6, heavy: true },
    camBias: 0.45,
    aggr: [1.5, 1.8, 2.1],
    repelCol: [255, 224, 160], repelAt: 7,
    attacks: {
      strike: { wind: 0.3, act: 0.14, rec: 0.35, dmg: 18, tell: 'white', hb: (e) => front(e, 2, 8, 46, 44), lunge: 90, sfx: 'whip', onEnd(e) { if (e.mode === 'ground' && Math.random() < (e.phase ? 0.7 : 0.45)) e.attack('strike2'); } },
      strike2: { wind: 0.26, act: 0.14, rec: 0.45, dmg: 18, tell: 'white', hb: (e) => front(e, 0, 20, 52, 30), lunge: 120, sfx: 'whip' },
      // QUEDA DO MENESTREL (vermelho): salta do balcão e crava o alaúde no chão — ondas de choque rente ao chão (salta-as);
      // fica tonto um instante: é a janela para o castigar
      dive: { wind: 0.55, act: 0.62, rec: 0.2, tell: 'red', sfx: 'wind',
        onAct(e, g) { const p = g.player; e.mode = 'dive'; e.dv = { x0: e.x, y0: e.y, x1: U.clamp(p.cx - e.w / 2 + U.rand(-30, 30), e.arena.x0 + 10, e.arena.x1 - e.w - 10), y1: e.arena.floor - e.h, t: 0 }; },
        during(e, g, dt) {
          const v = e.dv; if (!v) return; v.t += dt; const k = Math.min(1, v.t / 0.55);
          e.x = U.lerp(v.x0, v.x1, k); e.y = U.lerp(v.y0, v.y1, k * k) - Math.sin(k * Math.PI) * 40; e.vx = 0; e.vy = 0;
          e.attackHBs.push({ x: e.x - 4, y: e.y, w: e.w + 8, h: e.h, dmg: 22, id: e.atk.id, unblockable: true, parryable: false, src: e });
          if (k >= 1 && !v.landed) {
            v.landed = true; e.y = v.y1;
            for (const s of [-1, 1]) g.spawn(P2({ x: e.cx + s * 14, y: e.arena.floor - 12, vx: s * 250, w: 12, h: 22, dmg: 16, kind: 'wave', color: '#ffe0a0', life: 2.2, solid: true, reflectable: false, parryable: false }));
            G.addShake(0.6); A.sfx('crush'); A.sfx('bell_small'); VS.FX.impact(e.cx, e.arena.floor - 2, 'stone', e.facing, 1.6); VS.FX.flare(e.cx, e.arena.floor - 10, 40, [255, 224, 160], 0.3);
            e.atk.t = e.atk.s.act;
          }
        },
        onEnd(e) { e.dv = null; e.mode = 'ground'; e.groundT = 0; e.groggy = e.phase >= 2 ? 1.0 : 1.4; e.cool = 0.3; A.sfx('stagger'); VS.FX.stun(e); if (!e.groggyHint) { e.groggyHint = true; VS.UI.toast(VS.t('tip_corvin_groggy'), 4); } } },
      // RODOPIO (vermelho): gira com o alaúde a soar e solta um anel de notas — afasta-te ou esquiva-te através
      spin: { wind: 0.5, act: 0.55, rec: 0.5, tell: 'red', sfx: 'whip',
        onAct(e, g) { const n = e.phase ? 12 : 9, off = Math.random(); for (let i = 0; i < n; i++) { const a = (i + off) / n * U.TAU; g.spawn(corvinNote({ x: e.cx, y: e.cy - 6, vx: Math.cos(a) * 170, vy: Math.sin(a) * 170, life: 2.2, solid: true })); } A.sfx('note', { note: 'E5' }); },
        during(e) { e.attackHBs.push({ x: e.cx - 30, y: e.y + 6, w: 60, h: e.h - 6, dmg: 16, id: e.atk.id, unblockable: true, parryable: false, src: e }); } },
      // LEQUE: recua num salto e dispara um leque de notas
      fan: { wind: 0.4, act: 0.12, rec: 0.5, tell: null, sfx: false, windMove: -150,
        onWind(e) { e.vy = -200; },
        onAct(e, g) { const p = g.player, a0 = Math.atan2(p.cy - e.cy, p.cx - e.cx), n = e.phase ? 5 : 3; for (let i = 0; i < n; i++) { const a = a0 + (i - (n - 1) / 2) * 0.2; g.spawn(corvinNote({ x: e.cx, y: e.cy - 6, vx: Math.cos(a) * 210, vy: Math.sin(a) * 210, life: 4 })); } A.sfx('note', { note: U.pick(['E5', 'G5', 'B5']) }); } },
    },
    init(e) {
      e.lastBeat = -1; e.strum = 0; e.hitsHere = 0; e.nearT = 0; e.mode = 'perch'; e.perchT = 0; e.groundT = 0; e.groggy = 0;
      const T2 = U.TILE, pr = (e.spawn && e.spawn.perches) || [[2, 8, 10], [28, 35, 8], [55, 61, 10]];
      e.perches = pr.map(([x0, x1, y]) => ({ x0: x0 * T2, x1: (x1 + 1) * T2, y: y * T2 }));
      e.perchI = 1;
    },
    think(e, dt, g) {
      const p = g.player;
      e.strum = Math.max(0, e.strum - dt * 4);
      if (e.beatAnim) { e.beatAnim.t += dt; if (e.beatAnim.t > e.beatAnim.d) e.beatAnim = null; }
      if (e.groggy > 0) { e.groggy -= dt; e.vx = U.approach(e.vx, 0, 600 * dt); return; }
      if (e.mode === 'dive') return;
      if (e.mode === 'ground') { corvinGround(e, dt, g); return; }
      // ---- no balcão ----
      const beat = Math.floor(A.beat()), P = corvinPerch(e);
      if (e.cx < P.x0 + 6) e.x = P.x0 + 6 - e.w / 2; if (e.cx > P.x1 - 6) e.x = P.x1 - 6 - e.w / 2;
      if (e.bottom > P.y + 30) { e.x = (P.x0 + P.x1) / 2 - e.w / 2; e.y = P.y - e.h; e.vy = 0; }
      const near = corvinOnPerch(e, p);
      e.nearT = near ? e.nearT + dt : Math.max(0, e.nearT - dt * 0.5);
      e.perchT += dt;
      // não fica lá em cima muito tempo: salta e vem lutar cá abaixo
      if (!e.atk && !near && e.perchT > (e.phase >= 2 ? 5 : e.phase ? 6 : 7)) { e.attack('dive'); return; }
      if (beat !== e.lastBeat && beat >= 0) {
        e.lastBeat = beat;
        const pat = CORVIN_PATTERNS[Math.min(e.phase, 2)];
        let c = pat[beat % 16];
        // com a jogadora no balcão dele: golpeia no compasso em vez de cantar para baixo
        if (near && (c === 'n' || c === 'r') && beat % 2 === 0) c = 'd';
        e.strum = 1;
        e.face();
        if (c === 'n') { // nota apontada: devolve-se com o parry (e fere-o) ou corta-se com a arma
          const a = Math.atan2(p.cy - e.cy + 4, p.cx - e.cx);
          const L = VS.EnemyRender.point(e, e._f, 'lute') || { x: e.cx + e.facing * 10, y: e.cy - 6 };
          g.spawn(corvinNote({ x: L.x, y: L.y, vx: Math.cos(a) * 190, vy: Math.sin(a) * 190 }));
          A.sfx('note', { note: U.pick(['E5', 'G5', 'B5']) });
        } else if (c === 'w') { // onda pelo chão da torre (trepar livra dela)
          for (const sx of [-1, 1]) g.spawn(P2({ x: g.room.pw / 2, y: e.arena.floor - 10, vx: sx * 220, w: 12, h: 22, dmg: 14, kind: 'wave', color: '#ffe0a0', life: 3, solid: true, reflectable: false }));
          A.sfx('bell_small'); e.beatAnim = { anim: 'heel', t: 0, d: 0.3 };
        } else if (c === 'r') { // chuva de notas
          for (let i = 0; i < 4; i++) g.spawn(corvinNote({ x: U.clamp(p.cx + (i - 1.5) * 60 + U.rand(-10, 10), 30, g.room.pw - 30), y: 40, vx: 0, vy: 150, color: '#c0a0ff' }));
          e.beatAnim = { anim: 'flourish', t: 0, d: 0.35 };
        } else if (c === 'd') { if (!e.atk && near) e.attack('strike'); }
        else if (c === 'j' && !e.atk) corvinLeap(e, g);
      }
      if (e.atk) return;
      // muda de balcão quando a jogadora o alcança há tempo ou depois de vários golpes
      if (e.hitsHere >= (e.phase ? 4 : 5) || e.nearT > (e.phase ? 3.0 : 4.0)) { corvinLeap(e, g); return; }
      e.vx = U.approach(e.vx, 0, 600 * dt);
      if (near && Math.abs(e.dx()) < 50 && e.cool <= 0) e.attack('strike');
    },
    // fere-se cá em baixo (e tonto ainda mais), no balcão ao pé dele, ou com as notas devolvidas; do chão, a canção desvia o resto
    onHitBoss(e, hb, g) {
      const p = g.player, reflected = hb.proj && hb.proj.kind === 'note';
      if (e.mode !== 'perch' || (corvinOnPerch(e, p) && !hb.proj) || reflected) {
        if (reflected) hb = Object.assign({}, hb, { dmg: Math.round(hb.dmg * 1.4) });
        const ph = A.beat() % 1, onBeat = ph < 0.16 || ph > 0.9;
        if (onBeat && !hb.proj) { hb = Object.assign({}, hb, { dmg: Math.round(hb.dmg * 1.4) }); VS.FX.flare(e.cx, e.cy - 14, 18, [255, 230, 160], 0.14); if (!e.beatHint) { e.beatHint = true; VS.UI.toast(VS.t('tip_corvin_beat'), 4); } }
        if (e.mode === 'perch') e.hitsHere++;
        return E.Enemy.prototype.onHit.call(e, hb, g);
      }
      A.sfx('note', { note: 'B5' }); G.burst(e.cx, e.cy - 10, 8, { color: '#ffe0a0', speed: 80, life: 0.35, size: 1.2, add: true });
      if (!e.climbHint || g.time - e.climbHint > 8) { e.climbHint = g.time; VS.UI.toast(VS.t('tip_corvin_climb'), 4); }
      return 'blocked';
    },
    damageMult(e) { return e.groggy > 0 ? 1.4 : 1; },
    animMap: { strike2: 'atk_strike' },
    animState(e) {
      if (e.groggy > 0) return { anim: 'stagger' };
      const a = e.atk;
      if (a && a.name === 'dive') return a.phase === 'wind' ? { anim: 'flourish', idx: Math.min(4.99, a.t / a.s.wind * 5) } : { anim: 'heel', idx: Math.min(4.99, (e.dv ? e.dv.t / 0.55 : 1) * 5) };
      if (a && a.name === 'spin') return { anim: 'flourish', idx: (a.t * 12) % 5 };
      if (a && a.name === 'fan') return a.phase === 'wind' ? { anim: 'bow', idx: Math.min(4.99, a.t / a.s.wind * 5) } : { anim: 'flourish', idx: Math.min(4.99, a.t / 0.3 * 5) };
      if (e.mode !== 'perch') return null;
      if (e.beatAnim && !a) return { anim: e.beatAnim.anim, idx: Math.min(4.99, e.beatAnim.t / e.beatAnim.d * 5) };
      if (!a && Math.abs(e.vx) < 6) return { anim: 'play', idx: Math.min(5.99, (1 - e.strum) * 6) };
      return null;
    },
    onPhase(e, g) { A.sfx('chime'); VS.UI.bark('boss_corvin', e.phase === 1 ? 'corvin_mid1' : 'corvin_mid2'); if (e.mode === 'perch') corvinLeap(e, g); },
    preLines: () => [{ s: 'boss_corvin', k: 'corvin_pre1' }, { s: 'boss_corvin', k: 'corvin_pre2' }],
    eyeLight: { r: 14, i: 0.35, color: '#ffd070' },
    smearCol: [255, 220, 180],
    light(e) { const L = e._f && VS.EnemyRender.point(e, e._f, 'lute'); G.light(L ? L.x : e.cx, L ? L.y : e.cy, 70 + e.strum * 40, '#ffe0a0', 0.6 + e.strum * 0.3); for (const P of e.perches) G.light((P.x0 + P.x1) / 2, P.y - 10, 60, '#ffd890', 0.35, 1); },
  });

  // ======================================================================
  // BISPO OZIAS — pilares de luz, vidro, orbe do cálice (reflete com parry), varrimento (agachar ou saltar)
  // ======================================================================
  B.def('ozias', {
    cfg: { w: 30, h: 64, hp: 1200, music: 'b_ozias', flying: true, phases: [0.6, 0.3], introTime: 1.8, heavy: true },
    sheetAnchor: 'center',
    attacks: {
      // AURÉOLAS: desenha um círculo de luz à volta da protagonista (e, nas fases seguintes, outro onde ela fugiria); ao fechar-se, queima quem lá estiver
      pillars: { wind: 0.3, act: 1.35, rec: 0.4, tell: null, sfx: 'chime', onAct(e, g) { const p = g.player, d = p.vx ? Math.sign(p.vx) : (p.cx < g.room.pw / 2 ? 1 : -1); const xs = [p.cx]; if (e.phase >= 1) xs.push(U.clamp(p.cx + d * 104, 40, g.room.pw - 40)); if (e.phase >= 2) xs.push(U.clamp(p.cx - d * 104, 40, g.room.pw - 40)); haloCast(e, xs, p.cy - 4, { r: 46, warn: 0.85, dmg: 20 }); },
        during(e, g, dt) { haloTick(e, g, dt); }, onEnd(e) { e.halos = null; } },
      // vitral estilhaçado: um leque de cacos coloridos apontado à protagonista
      shards: { wind: 0.5, act: 0.1, rec: 0.7, tell: null, sfx: 'glass', onAct(e, g) { const p = g.player, n = 5 + e.phase * 2, a0 = Math.atan2(p.cy - e.cy, p.cx - e.cx), sp = 0.16; for (let i = 0; i < n; i++) { const a = a0 + (i - (n - 1) / 2) * sp; g.spawn(P({ x: e.cx, y: e.cy, vx: Math.cos(a) * 215, vy: Math.sin(a) * 215, w: 7, h: 7, dmg: 11, kind: 'glass', color: U.pick(['#ff6080', '#6080ff', '#ffd060', '#a060ff']), life: 4, solid: true })); } G.burst(e.cx, e.cy, 16, { color: '#c0d0ff', speed: 140, life: 0.4, size: 1.4, add: true }); } },
      orb: { wind: 0.7, act: 0.1, rec: 0.6, tell: 'white', sfx: 'light', onAct(e, g) { if (!e.orbHint) { e.orbHint = true; VS.UI.toast(VS.t('tip_ozias_orb'), 5); } const p = g.player; const a = Math.atan2(p.cy - e.cy, p.cx - e.cx); g.spawn(P({ x: e.cx, y: e.cy, vx: Math.cos(a) * 140, vy: Math.sin(a) * 140, w: 18, h: 18, dmg: 18, kind: 'holy', color: '#ffe8a0', life: 6, solid: false, homing: 0.9, reflectable: true, isChaliceOrb: true })); } },
      sweep: { wind: 0.9, act: 0.9, rec: 0.6, tell: null, sfx: 'light', onWind(e, g) { e.sweepLow = Math.random() < 0.5; VS.UI.toast(VS.t(e.sweepLow ? 'tip_jump' : 'tip_crouch'), 1.4); }, during(e, g) { const a = e.atk; const k = a.t / 0.9; const fromLeft = e.cx > g.room.pw / 2; const x = fromLeft ? k * g.room.pw : g.room.pw * (1 - k); const y = e.sweepLow ? e.arena.floor - 14 : e.arena.floor - 34; e.sweepLine = { y, x }; e.attackHBs.push({ x: x - 30, y: y - 6, w: 60, h: 12, dmg: 20, id: a.id, unblockable: true, parryable: false, src: { cx: x } }); }, onEnd(e) { e.sweepLine = null; } },
      blink: { wind: 0.3, act: 0.3, rec: 0.2, tell: null, sfx: 'light', onAct(e, g) { G.burst(e.cx, e.cy, 20, { color: '#fff0c0', speed: 120, life: 0.5, size: 1.6, add: true }); const spots = [g.room.pw * 0.2, g.room.pw * 0.5, g.room.pw * 0.8]; let best = spots[0], bd = 0; spots.forEach((s) => { const d = Math.abs(s - g.player.cx); if (d > bd) { bd = d; best = s; } }); e.x = best - e.w / 2; e.y = e.arena.floor - 120; G.burst(e.cx, e.cy, 20, { color: '#fff0c0', speed: 120, life: 0.5, size: 1.6, add: true }); } },
    },
    think(e, dt, g) {
      e.vy = Math.sin(e.anim * 1.5) * 12; e.vx *= 0.9;
      e.y = U.clamp(e.y, 40, e.arena.floor - e.h - 40);
      if (e.atk) return;
      e.face();
      if (e.cool > 0) return;
      const r = Math.random(), ph = e.phase;
      const list = ph === 0 ? ['pillars', 'shards', 'orb', 'blink'] : ph === 1 ? ['pillars', 'sweep', 'orb', 'shards', 'blink'] : ['sweep', 'pillars', 'orb', 'sweep', 'shards'];
      e.attack(list[Math.floor(r * list.length)]);
      e.cool = Math.max(0.3, 0.9 - ph * 0.25);
    },
    // o orbe do cálice refletido fere-o gravemente
    onHitBoss(e, hb, g) { if (hb.proj && hb.proj.isChaliceOrb) { hb = Object.assign({}, hb, { dmg: hb.dmg * 3 }); A.sfx('choir_hit'); e.doStagger(1.2, g, true); } return E.Enemy.prototype.onHit.call(e, hb, g); },
    onPhase(e, g) { A.sfx('choir_hit'); G.flash('#fff6e0', 0.4); VS.UI.bark('boss_ozias', e.phase === 1 ? 'ozias_mid1' : 'ozias_mid2'); },
    preLines: () => [{ s: 'boss_ozias', k: 'ozias_pre1' }, { s: 'boss_ozias', k: 'ozias_pre2' }, { s: 'boss_ozias', k: 'ozias_pre3' }],
    light(e) { G.light(e.cx, e.cy, 140, '#fff0c0', 0.9); },
  });

  // ======================================================================
  // REI ALDRIC — chefe final (3 fases). ≈2× a protagonista. Fraqueza: a investida não sabe parar —
  // atraído contra uma parede (ou o estrado do trono), embate, cai de costas e fica exposto.
  // Fase 2: ecos dos guardiões caídos; fase 3: desespero (as bordas da sala ardem, investidas seguidas).
  // ======================================================================
  const ECHO_COL = { caedmon: '#a0c8ff', hilde: '#ff8030', elowen: '#9fffd0', corvin: '#ffe0a0', ozias: '#fff0c0', coveiro: '#c8a878', matilheira: '#ff7a40', automato: '#ff9a40',
    mariposa: '#f0e0a0', sineiro: '#ffe0a0', vael: '#ff6020', gemeos: '#c0c8d8', carpideira: '#ff6070', custodio: '#fff0c0', seraphine: '#fff8e0' };
  // na fase 1 o rei usa os ecos dos primeiros guardiões; na última, os de todos (e encadeia logo um golpe a seguir)
  const ECHOS_1 = ['echo_caedmon', 'echo_hilde', 'echo_elowen', 'echo_corvin', 'echo_ozias', 'echo_coveiro', 'echo_matilheira', 'echo_automato', 'echo_sineiro', 'echo_vael'];
  const ECHOS_ALL = ECHOS_1.concat(['echo_mariposa', 'echo_gemeos', 'echo_carpideira', 'echo_custodio', 'echo_seraphine']);
  const aldricChain = (e) => { if (e.phase >= 2 && Math.random() < 0.55) e.cool = 0; };
  const tipOf = (e) => (e._f && VS.EnemyRender.point(e, e._f, 'tip')) || { x: e.cx + e.facing * 50, y: e.bottom - 4 };
  // as ondas do Juízo: uma parede baixa de chama carmesim que corre rente ao chão, para os dois lados, até às paredes da arena
  // (fase final: cada onda bate na parede e volta para trás, mais devagar — vê-se a chegar de longe)
  // (o Projectile guarda x/y tal como os recebe: aqui são o canto superior esquerdo da parede de chama)
  function aldricJudgeWave(e, g, x, back) {
    const x0 = e.arena.x0, x1 = e.arena.x1;
    for (const s of [-1, 1]) {
      g.spawn(P({ x: x + s * 14 - 11, y: e.arena.floor - 34, vx: s * 500, w: 22, h: 34, dmg: 9999, kind: 'judgement', color: '#ff2030', life: 3, solid: false, light: false,
        parryable: false, reflectable: false, unblockable: true, persist: true, judge: true, back: back || 0,
        update2(dt, gm) {
          if ((this.cx < x0 + 6 && this.vx < 0) || (this.cx > x1 - 6 && this.vx > 0)) {
            VS.FX.impact(U.clamp(this.cx, x0, x1), this.bottom - 2, 'stone', -Math.sign(this.vx), 1.2);
            if (this.back > 0) { this.back--; this.vx = -Math.sign(this.vx) * 400; this.id = VS.Entity.newAttackId(); this.life = 3.5; G.addShake(0.35); VS.Audio.sfx('judgement_slam', { vol: 0.45 }); VS.FX.flare(this.cx, this.cy, 50, [255, 30, 40], 0.4); }
            else { this.remove = true; return; }
          }
          if (Math.random() < 0.9) G.emit({ x: this.x + Math.random() * this.w, y: this.bottom - Math.random() * 8, vx: -this.vx * 0.12 + U.rand(-20, 20), vy: U.rand(-160, -60), life: U.rand(0.3, 0.6), size: U.rand(1, 2.4), color: U.pick(['#ff2030', '#ff6040', '#ffd0c0']), add: true, shrink: true, layer: 2 });
        },
        emitLight() { G.light(this.cx, this.bottom - 14, 120, '#ff2030', 0.9, 2); } }));
    }
  }

  // o montante cravado rebenta em chamas no ponto do impacto (curto alcance) e deixa o chão a arder
  function aldricBurst(e, g, x) {
    const id = VS.Entity.newAttackId(); let t = 0;
    e.burstFx = { x, t: 0 };
    VS.FX.flare(x, e.arena.floor - 16, 50, [255, 130, 50], 0.4); G.burst(x, e.arena.floor - 6, 26, { color: '#ff7020', speed: 200, angle: -Math.PI / 2, spread: 1.3, life: 0.5, size: 2.2, add: true });
    g.spawn(P({ x: x - 26, y: e.arena.floor - 54, w: 52, h: 54, dmg: e.phase ? 18 : 15, kind: 'blast', color: '#ff6020', life: 0.22, solid: false, parryable: false, reflectable: false, unblockable: true, persist: true, light: false }));
    if (e.phase) firePool(g, x, e.arena.floor, 40, 1.8);
  }
  function aldricKnock(e, g) {
    e.atk = null; e.attackHBs = []; e.vx = -e.facing * 140; e.knock = { t: 0, ph: 'fall' };
    G.addShake(0.9); A.sfx('crush'); A.sfx('hit_metal'); g.hitstop(0.12);
    VS.FX.impact(e.cx + e.facing * (e.w / 2 + 4), e.cy - 10, 'stone', -e.facing, 1.6);
    VS.FX.sparks(e.cx + e.facing * (e.w / 2), e.cy - 16, 16, -e.facing, { speed: 340 });
    if (!VS.state.flags.tip_aldric_wall) { VS.state.flags.tip_aldric_wall = 1; VS.UI.toast(VS.t('tip_aldric_wall'), 5); }
  }
  B.def('aldric', {
    cfg: { w: 32, h: 68, hp: 2600, music: 'b_aldric', heavy: true, phases: [0.66, 0.33], introTime: 2.4, ashCol: '#6a5a50' },
    aggr: [1.55, 1.95, 2.35], repelCol: [255, 120, 60], repelDmg: 18,
    attacks: {
      // varrida horizontal à altura do peito (branco: aparável); na fase 2 encadeia com o corte ascendente
      sweep: { wind: 0.65, act: 0.2, rec: 0.55, dmg: 24, tell: 'white', sfx: 'swing_heavy', hb: (e) => front(e, -6, 16, 84, 48), lunge: 90, onEnd(e) { if (e.phase && Math.random() < 0.55) { e.attack('sweep2'); } } },
      sweep2: { wind: 0.42, act: 0.2, rec: 0.6, dmg: 24, tell: 'white', sfx: 'swing_royal', hb: (e) => front(e, 0, 8, 64, 92), lunge: 120 },
      // golpe de cima (vermelho, com armadura): crava o montante e solta ondas de choque/fogo
      overhead: { wind: 0.95, act: 0.16, rec: 0.85, dmg: 32, tell: 'red', sfx: 'swing_heavy', armor: true, hb: (e) => front(e, 6, 0, 58, 100),
        onAct(e, g) { G.addShake(0.7); A.sfx('crush'); const x = e.cx + e.facing * 56; VS.FX.impact(x, e.arena.floor - 2, 'stone', e.facing, 1.6); aldricBurst(e, g, x); } },
      // agarrar (vermelho): investe com a manopla aberta
      grab: { wind: 0.6, act: 0.25, rec: 0.8, dmg: 34, tell: 'red', hb: (e) => front(e, 0, 26, 50, 40), lunge: 250, sfx: 'whip' },
      // salto (vermelho): cai a cravar o montante
      leap: { wind: 0.55, act: 1.0, rec: 0.7, dmg: 28, tell: 'red', sfx: 'wind',
        onAct(e, g) { const p = g.player; e.vx = (p.cx - e.cx) / 0.8; e.vy = -580; },
        during(e, g) { e.attackHBs.push({ x: e.x - 6, y: e.y, w: e.w + 12, h: e.h, dmg: 28, id: e.atk.id, unblockable: true, parryable: false, src: e }); if (e.onGround && e.atk.t > 0.25) { e.atk.t = 99; e.vx = 0; G.addShake(0.7); A.sfx('crush'); const x = e.cx + e.facing * 56; VS.FX.impact(x, e.arena.floor - 2, 'stone', e.facing, 1.6); firePool(g, e.cx - 46, e.arena.floor, 34, 2.2); firePool(g, e.cx + 46, e.arena.floor, 34, 2.2); } } },
      // INVESTIDA (vermelho): prepara-se (o montante raspa o chão, faíscas), acelera e não sabe parar
      charge: { wind: 1.05, act: 2.6, rec: 0.7, dmg: 30, tell: 'red', sfx: 'roar',
        onWind(e) { e.chargeHit = false; },
        onAct(e, g) { e.chargeX0 = e.cx; e.chargeTarget = g.player.cx + e.facing * 200; A.sfx('wind'); },
        during(e, g, dt) {
          const a = e.atk;
          e.vx = e.facing * Math.min(e.phase >= 2 ? 520 : 470, 140 + a.t * 1000);
          const T2 = tipOf(e); if (Math.random() < 0.8) VS.FX.sparks(T2.x, e.arena.floor - 2, 1, -e.facing, { speed: 200, up: 0.8 });
          if (Math.random() < 0.6) VS.FX.dust(e.cx - e.facing * 8, e.bottom - 2, 1, '#6a5a50', { speed: 60 });
          e.attackHBs.push({ x: e.facing > 0 ? e.x : e.x - 16, y: e.y + 12, w: e.w + 16, h: e.h - 12, dmg: 30, id: a.id, unblockable: true, parryable: false, knock: 420, src: e });
          // embate na parede (ou no estrado do trono): derrubado
          const ax = e.facing > 0 ? e.x + e.w >= e.arena.x1 - 2 : e.x <= e.arena.x0 + 2;
          if (e.wallAhead(e.facing) || ax) { aldricKnock(e, g); return; }
          // passou do alvo sem acertar, ou acertou: trava (derrapagem)
          // acertou: ainda avança um instante (se houver parede logo ali, embate nela); passou do alvo: trava
          if (e.chargeHit) { a.hitT = (a.hitT || 0) + dt; if (a.hitT > 0.14) a.t = a.s.act; return; }
          if ((e.cx - e.chargeTarget) * e.facing > 0) a.t = a.s.act;
        } },
      // O JUÍZO DO REI (fase 1+): ergue o montante e reúne a chama roubada (1,7 s, com o ecrã a tingir-se de carmesim);
      // ao cravá-lo, ondas carmesim correm rente ao chão e MATAM DE UM GOLPE. Não se aparam nem se bloqueiam:
      // salta por cima delas ou esquiva-te através delas. Na última fase as ondas batem nas paredes e voltam para trás.
      judgement: { wind: 1.7, act: 1.0, rec: 1.0, tell: 'red', sfx: 'judgement_slam', armor: true,
        onWind(e, g) { A.sfx('judgement'); e.judgeCd = e.phase >= 2 ? 13 : 17; if (!e.judgeTip) { e.judgeTip = true; VS.UI.toast(VS.t('tip_aldric_judgement'), 4.5); } },
        windTick(e, g, dt) {
          const k = Math.min(1, e.atk.t / e.atk.s.wind), T2 = tipOf(e); G.dread = Math.max(G.dread, 0.25 + 0.75 * k);
          for (let i = 0; i < 3; i++) { const an = Math.random() * U.TAU, rr = U.rand(50, 110) * (1.1 - k * 0.5), life = U.rand(0.35, 0.55); G.emit({ x: T2.x + Math.cos(an) * rr, y: T2.y + Math.sin(an) * rr, vx: -Math.cos(an) * rr / life, vy: -Math.sin(an) * rr / life, life, size: U.rand(0.8, 1.8), color: U.pick(['#ff2030', '#ff5040', '#ffc0b0']), add: true, shrink: true, layer: 2 }); }
          if (k > 0.5 && Math.random() < 0.25) G.addShake(0.05);
        },
        onAct(e, g) {
          G.addShake(1); G.flash('#ff1020', 0.45); G.dread = 1;
          const x = e.cx + e.facing * 30; VS.FX.impact(x, e.arena.floor - 2, 'stone', e.facing, 2.2); VS.FX.flare(x, e.arena.floor - 10, 90, [255, 30, 40], 0.6);
          aldricJudgeWave(e, g, x, e.phase >= 2 ? 1 : 0);
        } },
      // ecos dos guardiões caídos (fase 2+): ergue a mão livre; a sombra do guardião surge atrás dele
      echo_caedmon: { wind: 0.7, act: 0.22, rec: 0.7, dmg: 24, tell: 'white', hb: (e) => front(e, 6, 36, 80, 20), lunge: 440, onWind(e) { e.echo = 'caedmon'; }, onEnd(e) { e.echo = null; aldricChain(e); } },
      echo_hilde: { wind: 0.6, act: 0.9, rec: 0.5, tell: null, sfx: 'chime', onWind(e) { e.echo = 'hilde'; }, onAct(e, g) { e.anvilX = g.player.cx; },
        during(e, g) { const a = e.atk; if (a.t < 0.7) e.anvilShadow = e.anvilX; else if (!a.dropped) { a.dropped = true; e.anvilShadow = null; g.spawn(P({ x: e.anvilX - 15, y: G.cam.y - 30, vx: 0, vy: 520, g: 1400, w: 30, h: 20, dmg: 26, kind: 'ingot', color: '#ff7020', life: 2, parryable: false, reflectable: false, onHitWall(g2) { G.addShake(0.5); A.sfx('crush'); firePool(g2, this.cx, e.arena.floor, 40, 2); } })); } },
        onEnd(e) { e.echo = null; e.anvilShadow = null; aldricChain(e); } },
      echo_elowen: { wind: 0.5, act: 1.1, rec: 0.5, tell: null, sfx: 'whip', onWind(e) { e.echo = 'elowen'; }, onAct(e, g) { const p = g.player; e.thX = [p.cx - 50, p.cx, p.cx + 50]; }, during(e, g) { columns(e, g, e.thX, { warn: 0.65, h: 60, w: 14, dmg: 18, sfx: 'whip', warnCol: '#8aa050', cols: ['#4a5a2a', '#6a7a3a'] }); }, onEnd(e) { e.echo = null; aldricChain(e); } },
      echo_corvin: { wind: 0.6, act: 0.1, rec: 0.6, tell: null, sfx: 'note', onWind(e) { e.echo = 'corvin'; }, onAct(e, g) { const h = VS.EnemyRender.point(e, e._f, 'hand') || { x: e.cx, y: e.cy - 20 }; for (let i = 0; i < 10; i++) { const a = i / 10 * U.TAU; g.spawn(P({ x: h.x, y: h.y, vx: Math.cos(a) * 150, vy: Math.sin(a) * 150, w: 10, h: 10, dmg: 13, kind: 'note', color: '#ffd070', life: 4, solid: false, breakable: true })); } }, onEnd(e) { e.echo = null; aldricChain(e); } },
      echo_ozias: { wind: 0.5, act: 1.2, rec: 0.5, tell: null, sfx: 'chime', onWind(e) { e.echo = 'ozias'; }, onAct(e, g) { const p = g.player; haloCast(e, [p.cx, U.clamp(p.cx + (Math.random() < 0.5 ? -1 : 1) * 100, 40, g.room.pw - 40)], p.cy - 4, { r: 44, warn: 0.8, dmg: 20 }); }, during(e, g, dt) { haloTick(e, g, dt); }, onEnd(e) { e.echo = null; e.halos = null; aldricChain(e); } },
      // ---- ecos de todos os guardiões (o rei roubou-lhes a chama): cada um com a cor do dono, atrás dele ----
      // COVEIRO: a terra dos mortos rebenta em três covas, uma atrás da outra, onde estás
      echo_coveiro: { wind: 0.5, act: 1.55, rec: 0.4, tell: null, sfx: 'crush', onWind(e) { e.echo = 'coveiro'; },
        onAct(e, g) { const p = g.player, s = Math.random() < 0.5 ? 1 : -1; e.graves = [0, 1, 2].map((i) => ({ x: U.clamp(p.cx + (i - 1) * 64 * s, 40, g.room.pw - 40), t: -i * 0.3, id: VS.Entity.newAttackId(), seed: Math.random() * 50 })); },
        during(e, g, dt) {
          for (const c of e.graves || []) {
            c.t += dt;
            if (c.t > 0 && c.t < 0.48) { if (Math.random() < 0.5) G.emit({ x: c.x + U.rand(-16, 16), y: e.arena.floor - 2, vx: U.rand(-30, 30), vy: U.rand(-110, -40), g: 500, life: 0.45, size: U.rand(1, 2), color: U.pick(['#3a2c1e', '#5a4632']) }); }
            else if (c.t >= 0.48 && c.t < 0.72) {
              if (!c.s) { c.s = 1; A.sfx('root_burst', { vol: 0.6 }); G.addShake(0.35); G.burst(c.x, e.arena.floor - 4, 16, { color: '#4a3826', speed: 220, angle: -Math.PI / 2, spread: 1.2, g: 600, life: 0.7, size: 2.4 }); }
              e.attackHBs.push({ x: c.x - 24, y: e.arena.floor - 72, w: 48, h: 72, dmg: 22, id: c.id, unblockable: true, parryable: false, src: { cx: c.x } });
            }
          }
        },
        onEnd(e) { e.echo = null; e.graves = null; aldricChain(e); } },
      // MATILHEIRA: mastins de chama correm a direito pelo salão — salta-lhes por cima
      echo_matilheira: { wind: 0.6, act: 2.0, rec: 0.35, tell: 'red', sfx: false, onWind(e) { e.echo = 'matilheira'; A.sfx('howl', { vol: 0.7 }); },
        // os mastins saem de pouco fora da vista (vêm de onde há mais sala) e cruzam o salão a direito
        onAct(e, g) {
          const p = g.player, fromL = p.cx > (e.arena.x0 + e.arena.x1) / 2, far = U.VIEW_W / 2 + 50;
          const start = (dir) => (dir > 0 ? Math.max(e.arena.x0 - 30, p.cx - far) : Math.min(e.arena.x1 + 30, p.cx + far));
          e.hounds = [{ x: start(fromL ? 1 : -1), dir: fromL ? 1 : -1, t: 0, id: VS.Entity.newAttackId() }];
          if (e.phase >= 2) e.hounds.push({ x: start(fromL ? -1 : 1), dir: fromL ? -1 : 1, t: -0.55, id: VS.Entity.newAttackId() });
        },
        during(e, g, dt) {
          for (const h of e.hounds || []) {
            h.t += dt; if (h.t < 0) continue; h.x += h.dir * 440 * dt;
            if (h.x > e.arena.x0 - 60 && h.x < e.arena.x1 + 60) e.attackHBs.push({ x: h.x - 24, y: e.arena.floor - 30, w: 48, h: 30, dmg: 20, id: h.id, unblockable: true, parryable: false, src: { cx: h.x } });
            if (Math.random() < 0.9) G.emit({ x: h.x - h.dir * U.rand(0, 24), y: e.arena.floor - U.rand(4, 28), vx: -h.dir * U.rand(30, 90), vy: U.rand(-80, -20), life: 0.45, size: U.rand(1.2, 2.6), color: U.pick(['#ff6020', '#ffb040', '#ff3010']), add: true, shrink: true, layer: 2 });
            if (!h.snd && h.x > e.arena.x0 && h.x < e.arena.x1) { h.snd = 1; A.sfx('roar', { vol: 0.35 }); }
          }
        },
        onEnd(e) { e.echo = null; e.hounds = null; aldricChain(e); } },
      // AUTÓMATO: as lajes do salão sopram fogo à vez (ímpares, depois pares)
      echo_automato: { wind: 0.45, act: 1.8, rec: 0.4, tell: null, sfx: 'charge', onWind(e) { e.echo = 'automato'; },
        // grelhas a 40 px umas das outras à volta da protagonista: primeiro sopram as pares (uma delas debaixo dela),
        // depois as ímpares — é uma dança de um passo para cada lado
        onAct(e, g) { const p = g.player; e.vents = []; for (let k = -5; k <= 5; k++) { const x = Math.round(p.cx + k * 40); if (x > e.arena.x0 + 10 && x < e.arena.x1 - 10) e.vents.push({ x, k }); } },
        during(e) {
          const a = e.atk; e.colXs = null; e.ventFire = null;
          [[0, 0.55], [0.8, 1.35]].forEach(([t0, t1], wi) => {
            const sel = (e.vents || []).filter((v) => Math.abs(v.k) % 2 === wi);
            if (a.t >= t0 && a.t < t1) { e.colXs = sel.map((v) => v.x); e.colWarnCol = '#ff8030'; }
            else if (a.t >= t1 && a.t < t1 + 0.4) {
              if (!a['f' + wi]) { a['f' + wi] = 1; A.sfx('fire'); G.addShake(0.2); }
              e.ventFire = sel.map((v) => v.x); e.ventK = (a.t - t1) / 0.4;
              for (const v of sel) {
                if (Math.random() < 0.85) G.emit({ x: v.x + U.rand(-6, 6), y: e.arena.floor, vx: U.rand(-10, 10), vy: U.rand(-430, -300), life: 0.45, size: U.rand(2, 4), color: U.pick(['#ffb040', '#ff6010', '#ffe0a0']), add: true, shrink: true, layer: 2 });
                e.attackHBs.push({ x: v.x - 11, y: e.arena.floor - 140, w: 22, h: 140, dmg: 18, id: a.id * 100 + wi * 30 + v.k + 10, unblockable: true, parryable: false, src: { cx: v.x } });
              }
            }
          });
        },
        onEnd(e) { e.echo = null; e.colXs = null; e.vents = null; e.ventFire = null; aldricChain(e); } },
      // MÃE-MARIPOSA: espiral de escamas a girar da mão do rei — passa entre os braços
      echo_mariposa: { wind: 0.5, act: 1.5, rec: 0.4, tell: null, sfx: 'moth', onWind(e) { e.echo = 'mariposa'; },
        onAct(e) { e.spinA = Math.random() * U.TAU; e.spinT = 0; },
        during(e, g, dt) {
          const h = VS.EnemyRender.point(e, e._f, 'hand') || { x: e.cx, y: e.cy - 20 };
          e.spinA += 2.6 * dt; e.spinT -= dt; if (e.spinT > 0) return; e.spinT = 0.085;
          for (let i = 0; i < 3; i++) { const a = e.spinA + i * U.TAU / 3; g.spawn(P({ x: h.x, y: h.y, vx: Math.cos(a) * 120, vy: Math.sin(a) * 120, w: 8, h: 8, dmg: 10, kind: 'scale', hue: (e.t * 140 + i * 120) % 360, color: '#f0e0ff', life: 4, solid: false, reflectable: false, light: false })); }
        },
        onEnd(e) { e.echo = null; aldricChain(e); } },
      // SINEIRO: o toque do sino — anéis de choque dourados (atravessa-os com a esquiva)
      echo_sineiro: { wind: 0.7, act: 0.6, rec: 0.45, tell: 'red', sfx: false, armor: true, onWind(e) { e.echo = 'sineiro'; },
        onAct(e, g) { A.sfx('bell'); G.addShake(0.5); if (VS.WailRing) g.spawn(new VS.WailRing(e.cx, e.arena.floor - 22, 235, 400, 20, [255, 214, 120])); },
        during(e, g) { const a = e.atk; if (!a.second && a.t > 0.36 && e.phase >= 2 && VS.WailRing) { a.second = true; g.spawn(new VS.WailRing(e.cx, e.arena.floor - 22, 200, 400, 20, [255, 214, 120])); A.sfx('bell_small'); } },
        onEnd(e) { e.echo = null; aldricChain(e); } },
      // INQUISIDORA VAEL: dois muros de fogo fecham-se sobre ti — salta um deles antes que se toquem
      echo_vael: { wind: 0.45, act: 1.75, rec: 0.45, tell: null, sfx: 'charge', onWind(e) { e.echo = 'vael'; },
        onAct(e, g) { const p = g.player, x0 = e.arena.x0 + 14, x1 = e.arena.x1 - 14, c = U.clamp(p.cx, x0 + 60, x1 - 60); e.pyre = { l: Math.max(x0, c - 125), r: Math.min(x1, c + 125), boom: 0 }; },
        during(e, g, dt) {
          const a = e.atk, P2 = e.pyre; if (!P2) return;
          if (a.t < 0.45) { e.colXs = [P2.l, P2.r]; e.colWarnCol = '#ff6020'; return; }
          e.colXs = null; if (!P2.lit) { P2.lit = true; A.sfx('fire'); }
          const mid = (P2.l + P2.r) / 2, sp = 150;
          if (P2.r - P2.l > 6) { P2.l = Math.min(mid, P2.l + sp * dt); P2.r = Math.max(mid, P2.r - sp * dt); }
          else if (!P2.boom) { P2.boom = 1; G.addShake(0.45); A.sfx('explode', { vol: 0.6 }); VS.FX.flare(mid, e.arena.floor - 20, 60, [255, 120, 40], 0.45); G.burst(mid, e.arena.floor - 10, 30, { color: '#ff8030', speed: 220, life: 0.6, size: 2.4, add: true }); }
          if (P2.boom) { P2.boom += dt; if (P2.boom < 0.3) e.attackHBs.push({ x: mid - 34, y: e.arena.floor - 60, w: 68, h: 60, dmg: 22, id: a.id * 10 + 3, unblockable: true, parryable: false, src: { cx: mid } }); return; }
          for (const [x, k] of [[P2.l, 1], [P2.r, 2]]) { e.attackHBs.push({ x: x - 8, y: e.arena.floor - 30, w: 16, h: 30, dmg: 18, id: a.id * 10 + k, unblockable: true, parryable: false, src: { cx: x } }); if (Math.random() < 0.7) G.emit({ x: x + U.rand(-6, 6), y: e.arena.floor - U.rand(2, 20), vx: U.rand(-20, 20), vy: U.rand(-120, -50), life: 0.5, size: U.rand(1.4, 3), color: U.pick(['#ffb040', '#ff5010', '#ffe0a0']), add: true, shrink: true, layer: 2 }); }
        },
        onEnd(e) { e.echo = null; e.pyre = null; e.colXs = null; aldricChain(e); } },
      // GÉMEOS: remoinho do malho — gira o montante e avança em rodopio (afasta-te ou atravessa-o)
      echo_gemeos: { wind: 0.55, act: 1.2, rec: 0.55, tell: 'red', sfx: 'swing_heavy', armor: true, onWind(e) { e.echo = 'gemeos'; },
        onAct(e) { e.whirlDir = e.facing; e.whirlN = -1; },
        during(e, g) { const a = e.atk, n = Math.floor(a.t / 0.3); e.vx = e.whirlDir * 200; const box = { x: e.cx - 52, y: e.bottom - 52, w: 104, h: 48 }; e.attackHBs.push(Object.assign({ dmg: 20, id: a.id * 10 + n, unblockable: true, parryable: false, src: e }, box)); if (n !== e.whirlN) { e.whirlN = n; A.sfx('swing_heavy', { vol: 0.6 }); } if (Math.random() < 0.6) G.emit({ x: e.cx + U.rand(-46, 46), y: e.bottom - 2, vx: U.rand(-60, 60), vy: U.rand(-60, -10), life: 0.4, size: U.rand(1.4, 2.6), color: 'rgba(120,100,90,0.5)' }); if (e.wallAhead(e.whirlDir)) a.t = a.s.act; },
        onEnd(e) { e.echo = null; e.facing = e.whirlDir || e.facing; aldricChain(e); } },
      // CARPIDEIRA: o grito em anel — não se apara nem se salta: atravessa-se com a esquiva
      echo_carpideira: { wind: 0.85, act: 0.5, rec: 0.5, tell: 'red', sfx: false, armor: true, onWind(e) { e.echo = 'carpideira'; A.sfx('sob', { vol: 0.6 }); },
        onAct(e, g) { const m = VS.EnemyRender.point(e, e._f, 'eye') || { x: e.cx, y: e.y + 14 }; A.sfx('wail', { vol: 0.85 }); G.addShake(0.55); G.dread = Math.min(1, (G.dread || 0) + 0.4); if (VS.WailRing) g.spawn(new VS.WailRing(m.x, m.y, 220, 420, 22)); },
        onEnd(e) { e.echo = null; aldricChain(e); } },
      // CUSTÓDIO: raios de sol a girar à volta do rei — corre à frente deles ou atravessa-os
      echo_custodio: { wind: 0.6, act: 2.2, rec: 0.5, tell: 'red', sfx: false, onWind(e) { e.echo = 'custodio'; },
        onAct(e, g) { if (VS.SunBeam) { const n = 3 + Math.min(1, e.phase - 1), dir = Math.random() < 0.5 ? 1 : -1, off = Math.random() * U.TAU; for (let i = 0; i < n; i++) g.spawn(new VS.SunBeam(e, off + i / n * U.TAU, 0.55 * dir, 0.85, 1.5)); } A.sfx('choir_hit', { vol: 0.6 }); },
        during(e) { e.vx = 0; },
        onEnd(e) { e.echo = null; aldricChain(e); } },
      // ECO DE SERAPHINE: parede de penas de luz com uma abertura (no chão ou à altura de um salto)
      echo_seraphine: { wind: 0.45, act: 0.1, rec: 0.45, tell: null, sfx: 'wind', onWind(e) { e.echo = 'seraphine'; },
        onAct(e, g) {
          const W = g.room.pw, fl = e.arena.floor, fromL = g.player.cx > W / 2, low = Math.random() < 0.5, gap0 = low ? fl - 50 : fl - 104, gap1 = low ? fl : fl - 50;
          for (let y = fl - 6; y > fl - 190; y -= 13) { if (y > gap0 - 4 && y < gap1 + 4) continue; g.spawn(P({ x: fromL ? 18 : W - 28, y: y - 5, vx: (fromL ? 1 : -1) * 180, w: 10, h: 10, dmg: 16, kind: 'plume', color: '#fff4d8', life: W / 180 + 0.4, solid: false, reflectable: false, parryable: false, light: false })); }
          A.sfx('choir_hit', { vol: 0.5 });
        },
        onEnd(e) { e.echo = null; aldricChain(e); } },
    },
    think(e, dt, g) {
      e.judgeCd = Math.max(0, (e.judgeCd === undefined ? 4 : e.judgeCd) - dt);
      if (!e.atk && e.echo) { e.echo = null; e.colXs = null; e.graves = null; e.hounds = null; e.pyre = null; e.vents = null; e.anvilShadow = null; e.halos = null; }
      // derrubado: cai, fica estendido (exposto) e levanta-se apoiado no montante
      const kn = e.knock;
      if (kn) {
        kn.t += dt; e.vx = U.approach(e.vx, 0, 500 * dt); e.atk = null;
        const DOWN = e.phase >= 2 ? 1.3 : 1.8;
        if (kn.ph === 'fall' && kn.t > 0.7) { kn.ph = 'down'; kn.t = 0; VS.FX.stun(e); A.sfx('stagger'); }
        else if (kn.ph === 'down' && kn.t > DOWN) { kn.ph = 'getup'; kn.t = 0; }
        else if (kn.ph === 'getup' && kn.t > 0.9) { e.knock = null; e.cool = 0.35; e.face(); }
        return;
      }
      if (e.atk) {
        // a preparar a investida: o montante raspa o chão e solta faíscas
        if (e.atk.name === 'charge' && e.atk.phase === 'wind' && Math.random() < 0.55) { const T2 = tipOf(e); VS.FX.sparks(T2.x, e.arena.floor - 2, 1, e.facing, { speed: 160, up: 0.9 }); }
        return;
      }
      e.face(); const d = Math.abs(e.dx());
      if (e.cool > 0) { e.walk(d > 100 ? e.facing : d < 50 ? -e.facing : 0, e.phase >= 2 ? 80 : 55, dt); return; }
      const r = Math.random();
      if (e.phase >= 1 && e.judgeCd <= 0 && Math.random() < 0.5) { e.attack('judgement'); return; }
      if (e.phase >= 1 && r < (e.phase >= 2 ? 0.42 : 0.32)) {
        const pool = e.phase >= 2 ? ECHOS_ALL : ECHOS_1; let nm = U.pick(pool); if (nm === e.lastEcho) nm = U.pick(pool);
        e.lastEcho = nm; e.attack(nm); return;
      }
      // a investida aparece mais quando a protagonista se afasta (ou está encostada a uma parede)
      if (d > 150 && r < (e.phase ? 0.6 : 0.45)) { e.attack('charge'); return; }
      if (d < 90) e.attack(r < 0.5 ? 'sweep' : r < 0.78 ? 'overhead' : 'grab');
      else if (d < 230) e.attack(r < 0.45 ? 'leap' : r < 0.75 ? 'grab' : 'charge');
      else e.attack(r < 0.5 ? 'charge' : 'leap');
      if (e.phase >= 2) e.cool = 0.12;
    },
    onHitPlayer(e, hb, g) { if (e.atk && e.atk.name === 'charge') e.chargeHit = true; },
    // derrubado é o momento de castigar
    damageMult(e) { return e.knock && e.knock.ph !== 'getup' ? 1.6 : 1; },
    // poses especiais: entrada (ajoelhado diante do trono), investida a correr, derrubado, ecos
    animState(e, sh) {
      if (e.intro) return { anim: 'kneel_rise', idx: Math.min(5, Math.max(0, (e.introT - 0.6) / 1.6) * 6) };
      const kn = e.knock;
      if (kn) return kn.ph === 'fall' ? { anim: 'knock_fall', idx: Math.min(6, kn.t / 0.7 * 7) } : kn.ph === 'down' ? { anim: 'knock_down' } : { anim: 'knock_getup', idx: Math.min(7, kn.t / 0.9 * 8) };
      const a = e.atk; if (!a) return null;
      if (a.name === 'judgement') { const tr = a.phase === 'wind' ? Math.min(1, a.t / 0.75) : Math.min(1, a.t / (a.phase === 'act' ? 0.16 : a.s.rec)); return { anim: 'atk_overhead', phase: a.phase === 'act' && a.t > 0.16 ? 'rec' : a.phase, k: a.phase === 'act' && a.t > 0.16 ? 0 : tr }; }
      if (a.name === 'charge' && a.phase === 'act') { const st = sh.meta.anims.charge_run.stride || 38; return { anim: 'charge_run', idx: ((e._r.dist / st) % 1) * 6 }; }
      if (a.name === 'echo_gemeos' && a.phase === 'act') return { anim: 'atk_sweep', phase: 'act', k: (a.t / 0.15) % 1 };
      if (a.name.startsWith('echo_') && a.name !== 'echo_caedmon') { const d = a.phase === 'wind' ? a.s.wind : a.phase === 'act' ? a.s.act : a.s.rec; return { anim: 'atk_echo', phase: a.phase, k: a.t / d }; }
      if (a.name === 'echo_caedmon') { const d = a.phase === 'wind' ? a.s.wind : a.phase === 'act' ? a.s.act : a.s.rec; return { anim: 'atk_thrust', phase: a.phase, k: a.t / d }; }
      return null;
    },
    drawFront(ctx, e) {
      const a = e.atk; if (!a || a.name !== 'judgement' || a.phase !== 'wind') return;
      const k = Math.min(1, a.t / a.s.wind), T2 = tipOf(e), fl = 0.85 + 0.15 * Math.sin(e.t * 40);
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      const r = 10 + 26 * k, gr = ctx.createRadialGradient(T2.x, T2.y, 0, T2.x, T2.y, r);
      gr.addColorStop(0, `rgba(255,240,235,${0.95 * fl})`); gr.addColorStop(0.25, `rgba(255,60,60,${0.75 * fl})`); gr.addColorStop(1, 'rgba(160,0,10,0)');
      ctx.fillStyle = gr; ctx.fillRect(T2.x - r, T2.y - r, r * 2, r * 2);
      // o chão por onde as ondas vão correr: brasa que se acende a partir dos pés do rei
      const fy = e.arena.floor, reach = (e.arena.x1 - e.arena.x0) * Math.min(1, k * 1.3);
      for (const s of [-1, 1]) { const lg = ctx.createLinearGradient(e.cx, 0, e.cx + s * reach, 0); lg.addColorStop(0, `rgba(255,40,40,${0.55 * k})`); lg.addColorStop(1, 'rgba(255,0,0,0)'); ctx.fillStyle = lg; ctx.fillRect(s > 0 ? e.cx : e.cx - reach, fy - 3, reach, 3); }
      ctx.restore();
    },
    // o que os ecos deixam no chão: a terra das covas a rebentar, os mastins de chama, os muros de fogo do auto-da-fé
    drawOver(ctx, e) {
      const a0 = e.atk, an = a0 ? a0.name : '';
      if (an === 'echo_gemeos' && a0.phase === 'act') { // o remoinho do montante
        const cx = e.cx, cy = e.bottom - 34, r = 50, t = e.t || 0;
        ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round';
        for (let i = 0; i < 3; i++) { const st = t * 15 * e.whirlDir + i * U.TAU / 3; ctx.strokeStyle = `rgba(220,226,240,${0.42 - i * 0.1})`; ctx.lineWidth = 5 - i; ctx.beginPath(); ctx.ellipse(cx, cy, r, r * 0.45, 0, st, st + 1.7); ctx.stroke(); }
        ctx.restore();
      }
      if (an === 'echo_automato' && e.ventFire) { // as grelhas a soprar: colunas de chama
        const k = e.ventK || 0, h = 140 * Math.min(1, k * 5) * (k > 0.75 ? Math.max(0, 1 - (k - 0.75) / 0.25) : 1), fl = e.arena.floor, t = e.t || 0;
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        for (const x of e.ventFire) {
          const gr = ctx.createLinearGradient(0, fl, 0, fl - h); gr.addColorStop(0, 'rgba(255,220,150,0.9)'); gr.addColorStop(0.35, 'rgba(255,120,30,0.7)'); gr.addColorStop(1, 'rgba(255,60,10,0)');
          ctx.fillStyle = gr; const w = 9 + Math.sin(t * 30 + x) * 2;
          ctx.beginPath(); ctx.moveTo(x - w, fl); ctx.quadraticCurveTo(x - w * 0.6, fl - h * 0.5, x + Math.sin(t * 20 + x) * 4, fl - h); ctx.quadraticCurveTo(x + w * 0.6, fl - h * 0.5, x + w, fl); ctx.closePath(); ctx.fill();
          ctx.fillStyle = 'rgba(255,250,220,0.8)'; ctx.fillRect(x - 2, fl - h * 0.6, 4, h * 0.6);
          ctx.fillStyle = 'rgba(80,40,20,0.9)'; ctx.globalCompositeOperation = 'source-over'; ctx.fillRect(x - 12, fl - 2, 24, 3); ctx.globalCompositeOperation = 'lighter';
        }
        ctx.restore();
      }
      if (an === 'echo_coveiro') for (const c of e.graves || []) { if (c.t < 0.48 || c.t > 0.9) continue; const k = c.t < 0.54 ? (c.t - 0.48) / 0.06 : c.t > 0.72 ? Math.max(0, 1 - (c.t - 0.72) / 0.18) : 1; for (let i = -1; i <= 1; i++) rootSpikes(ctx, c.x + i * 14, e.arena.floor, 66 * k * (1 - Math.abs(i) * 0.2), c.seed + i, ['#1e140c', '#5a4632', '#e0d4bc']); }
      if (an === 'echo_matilheira') for (const h of e.hounds || []) {
        if (h.t < 0) continue; const x = h.x, fl = e.arena.floor, run = Math.sin(e.t * 22 + h.id) * 3, d = h.dir;
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        const gr = ctx.createRadialGradient(x, fl - 16, 0, x, fl - 16, 40); gr.addColorStop(0, 'rgba(255,120,40,0.55)'); gr.addColorStop(1, 'rgba(255,60,20,0)'); ctx.fillStyle = gr; ctx.fillRect(x - 40, fl - 56, 80, 64);
        ctx.fillStyle = 'rgba(255,110,50,0.75)';
        ctx.beginPath(); ctx.ellipse(x - d * 4, fl - 18, 20, 8.5, 0, 0, U.TAU); ctx.fill();
        ctx.beginPath(); ctx.moveTo(x + d * 12, fl - 22); ctx.lineTo(x + d * 30, fl - 20 + run * 0.3); ctx.lineTo(x + d * 24, fl - 12); ctx.lineTo(x + d * 10, fl - 13); ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.moveTo(x + d * 18, fl - 25); ctx.lineTo(x + d * 16, fl - 33); ctx.lineTo(x + d * 22, fl - 25); ctx.fill();
        for (const [lx, ph] of [[10, 0], [4, 1.6], [-10, 3.1], [-16, 4.4]]) { const sw = Math.sin(e.t * 22 + ph) * 6; ctx.beginPath(); ctx.moveTo(x + d * lx - 1.8, fl - 14); ctx.lineTo(x + d * (lx + sw) - 1.2, fl - 1); ctx.lineTo(x + d * (lx + sw) + 1.2, fl - 1); ctx.lineTo(x + d * lx + 1.8, fl - 14); ctx.fill(); }
        ctx.beginPath(); ctx.moveTo(x - d * 22, fl - 20); ctx.quadraticCurveTo(x - d * 34, fl - 28 + run, x - d * 40, fl - 24); ctx.lineTo(x - d * 22, fl - 16); ctx.fill();
        ctx.fillStyle = 'rgba(255,240,200,0.9)'; ctx.beginPath(); ctx.arc(x + d * 22, fl - 22, 1.4, 0, U.TAU); ctx.fill();
        ctx.restore();
      }
      const P2 = e.pyre, a = e.atk;
      if (P2 && a && a.name === 'echo_vael' && a.t >= 0.45 && !P2.boom) {
        const fl = e.arena.floor, t = e.t || 0;
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        for (const x of [P2.l, P2.r]) {
          VS.Sprites.glow(ctx, x, fl - 14, 34, '#ff5010', 0.55);
          for (let i = 0; i < 5; i++) { const ph = t * 16 + i * 1.7 + x * 0.05, h = 22 + 12 * Math.abs(Math.sin(ph)), ox = x + (i - 2) * 3.2;
            ctx.fillStyle = i === 2 ? 'rgba(255,240,200,0.9)' : `rgba(255,${110 + i * 20},40,0.6)`;
            ctx.beginPath(); ctx.moveTo(ox - 4.5, fl); ctx.quadraticCurveTo(ox - 3 + Math.sin(ph) * 2, fl - h * 0.6, ox + Math.sin(ph * 1.3) * 2.5, fl - h); ctx.quadraticCurveTo(ox + 3.5, fl - h * 0.5, ox + 4.5, fl); ctx.closePath(); ctx.fill(); }
        }
        ctx.restore();
      }
    },
    // a sombra do guardião evocado: a silhueta do próprio rei tingida com a cor do eco, atrás dele
    drawBehind(ctx, e) {
      if (!e.echo || !e.atk || e.atk.phase === 'rec') return;
      const k = e.atk.phase === 'wind' ? Math.min(1, e.atk.t / e.atk.s.wind) : 1;
      VS.EnemyRender.ghost(ctx, e, ECHO_COL[e.echo], (e.echo === 'corvin' || e.echo === 'ozias' ? 0.2 : 0.3) * k, -e.facing * (10 + 14 * k), -4 * k);
    },
    onPhase(e, g) {
      A.sfx('roar'); G.addShake(0.6); e.cool = 0.3; e.atkSpeed = [1, 1.1, 1.2][Math.min(2, e.phase)];
      const h = VS.EnemyRender.point(e, e._f, 'heart') || { x: e.cx, y: e.cy - 10 };
      VS.FX.flare(h.x, h.y, 60, [255, 120, 40], 0.5); G.flash('#ff6020', 0.35);
      if (e.phase === 2) { firePool(g, 50, e.arena.floor, 60, 999); firePool(g, g.room.pw - 50, e.arena.floor, 60, 999); }
      VS.UI.bark('boss_aldric', e.phase === 1 ? 'aldric_mid1' : 'aldric_mid2');
    },
    preLines: () => [{ s: 'boss_aldric', k: 'aldric_pre1' }, { s: 'boss_aldric', k: 'aldric_pre2' }, { s: 'boss_aldric', k: 'aldric_pre3' }],
    smearCol: [255, 170, 90],
    eyeLight: { r: 22, i: 0.5, color: '#ffb070' },
    light(e) {
      const h = (e._f && VS.EnemyRender.point(e, e._f, 'heart')) || { x: e.cx, y: e.cy - 10 };
      G.light(h.x, h.y, e.phase ? 150 : 100, e.phase ? '#ff6020' : '#ffa060', e.phase ? 0.95 : 0.75, 2);
      if (e.phase && !e.defeated && Math.random() < 0.5) { const T2 = tipOf(e); G.emit({ x: U.lerp(e.cx, T2.x, Math.random()), y: U.lerp(e.cy, T2.y, Math.random()), vx: U.rand(-10, 10), vy: U.rand(-80, -30), life: 0.7, size: U.rand(0.8, 1.6), color: U.pick(['#ff6010', '#ffb040']), add: true, shrink: true, layer: 2 }); }
    },
  });

  // ======================================================================
  // O ECO DE SERAPHINE — chefe secreto (final 3): só a luz devolvida (parry) ou os golpes enquanto se apaga a ferem.
  // Poderes que mais ninguém tem: PARA O TEMPO (a luz dela fica suspensa no ar e solta-se toda de uma vez) e DESFAZ O
  // TEMPO (a luz que já passou volta para trás e ela regressa ao sítio onde estava).
  // ======================================================================
  const seraLight = (o) => P(Object.assign({ w: 14, h: 14, dmg: 16, kind: 'light', color: '#fff8e0', life: 5, solid: false, reflectable: true, isLight: true }, o));
  function seraFreeze(e, g, on) {
    for (const pr of g.ents) {
      if (!(pr instanceof VS.Projectile) || pr.team !== 'enemy' || pr.remove) continue;
      if (on && !pr._fv) { pr._fv = [pr.vx, pr.vy]; pr.vx = 0; pr.vy = 0; pr._fh = pr.homing; pr.homing = 0; }
      else if (!on && pr._fv) { pr.vx = pr._fv[0]; pr.vy = pr._fv[1]; pr.homing = pr._fh || 0; pr._fv = null; }
    }
  }
  B.def('seraphine', {
    cfg: { w: 30, h: 64, hp: 1350, music: 'b_seraphine', flying: true, phases: [0.6, 0.3], introTime: 2.4, heavy: true },
    aggr: [1.4, 1.75, 2.1],
    noRepel: true,
    attacks: {
      burst: { wind: 0.75, act: 0.1, rec: 0.6, tell: null, sfx: 'light', onAct(e, g) { const n = 10 + e.phase * 4; const off = Math.random(); for (let i = 0; i < n; i++) { const a = (i + off) / n * U.TAU; g.spawn(seraLight({ x: e.cx, y: e.cy, vx: Math.cos(a) * 120, vy: Math.sin(a) * 120, w: 12, h: 12, dmg: 14, color: '#fff0c0' })); } e.count++; } },
      lance: { wind: 0.55, act: 0.6, rec: 0.45, tell: 'white', sfx: 'light', during(e, g) { const a = e.atk; const k = Math.floor(a.t / 0.2); if (k !== a.k && k < 3) { a.k = k; const p = g.player; const ang = Math.atan2(p.cy - e.cy, p.cx - e.cx); g.spawn(seraLight({ x: e.cx, y: e.cy, vx: Math.cos(ang) * 240, vy: Math.sin(ang) * 240, life: 4, kind: 'lance' })); A.sfx('chime'); } }, onEnd(e) { e.count++; } },
      embrace: { wind: 0.75, act: 0.9, rec: 0.55, tell: 'red', sfx: 'wind', onAct(e, g) { const p = g.player; const a = Math.atan2(p.cy - e.cy, p.cx - e.cx); e.vx = Math.cos(a) * 380; e.vy = Math.sin(a) * 380; }, during(e) { e.attackHBs.push({ x: e.x, y: e.y, w: e.w, h: e.h, dmg: 26, id: e.atk.id, unblockable: true, parryable: false, src: e }); }, onEnd(e) { e.vx *= 0.2; e.vy *= 0.2; e.count++; } },
      // ASAS: parede de penas de luz com uma abertura (no chão ou à altura de um salto) — mete-te na abertura ou esquiva-te
      beams: { wind: 0.55, act: 0.1, rec: 0.55, tell: null, sfx: 'wind', onAct(e, g) {
        const W = g.room.pw, fl = e.arena.floor, fromL = g.player.cx > W / 2, low = Math.random() < 0.5, gap0 = low ? fl - 50 : fl - 104, gap1 = low ? fl : fl - 50;
        for (let y = fl - 6; y > fl - 190; y -= 13) { if (y > gap0 - 4 && y < gap1 + 4) continue; g.spawn(P({ x: fromL ? 18 : W - 28, y: y - 5, vx: (fromL ? 1 : -1) * 175, w: 10, h: 10, dmg: 16, kind: 'plume', color: '#fff4d8', life: W / 175 + 0.4, solid: false, reflectable: false, parryable: false, light: false })); }
        A.sfx('choir_hit', { vol: 0.5 }); e.count++; if (!e.wingHint) { e.wingHint = true; VS.UI.toast(VS.t('tip_seraphine_wings'), 4); } } },
      // O TEMPO PARADO (vermelho): o mundo perde a cor; a luz dela fica suspensa no ar e ela semeia uma cúpula de lanças à
      // tua volta, com uma falha num dos lados, rente ao chão. Tu continuas a mexer-te: sai pela falha antes que o tempo
      // volte (ou atravessa as lanças com a esquiva) — aí tudo voa de uma vez para o sítio onde estavas.
      stoptime: { wind: 0.7, act: 1.9, rec: 0.5, tell: 'red', sfx: false,
        onWind(e) { A.sfx('timestop'); },
        onAct(e, g) {
          G.timeTint = 1; seraFreeze(e, g, true);
          const p = g.player, n = 16 + e.phase * 4, R = 118, sp = 260, fl = e.arena.floor;
          // a falha abre para o lado com mais sala (encostada a uma parede, nunca fica virada para ela)
          const side = p.cx - e.arena.x0 < 170 ? 1 : e.arena.x1 - p.cx < 170 ? -1 : (Math.random() < 0.5 ? -1 : 1);
          const gapA = side > 0 ? -0.22 : Math.PI + 0.22, rot = Math.random() * 0.3;
          for (let i = 0; i < n; i++) {
            const a = i / n * U.TAU + rot;
            if (Math.abs(Math.atan2(Math.sin(a - gapA), Math.cos(a - gapA))) < 0.46) continue;
            const x = p.cx + Math.cos(a) * R, y = p.cy + Math.sin(a) * R;
            if (y > fl - 6 || x < e.arena.x0 - 8 || x > e.arena.x1 + 8) continue; // nada dentro do chão nem das paredes
            // vida curta: param pouco depois de passarem pelo centro (quem saiu pela falha fica a salvo)
            const pr = seraLight({ x: x - 7, y: y - 7, vx: 0, vy: 0, life: R / sp + 0.2, kind: 'lance', ang: Math.atan2(-Math.sin(a), -Math.cos(a)) });
            pr._fv = [-Math.cos(a) * sp, -Math.sin(a) * sp]; g.spawn(pr);
          }
          e.count++; if (!e.timeHint) { e.timeHint = true; VS.UI.toast(VS.t('tip_seraphine_time'), 4.5); }
        },
        during(e, g, dt) {
          const a = e.atk;
          if (!a.go) G.timeTint = 1;
          for (const pr of g.ents) if (pr._fv) { pr.vx = 0; pr.vy = 0; pr.life += dt; }
          if (a.t > 1.5 && !a.go) { a.go = true; seraFreeze(e, g, false); G.timeTint = 0; A.sfx('timeresume'); G.addShake(0.3); }
        },
        onEnd(e, g) { seraFreeze(e, g || e.game, false); G.timeTint = 0; } },
      // O TEMPO DESFEITO: tudo o que ela lançou volta para trás pelo mesmo caminho e ela regressa ao sítio onde estava
      rewind: { wind: 0.5, act: 0.5, rec: 0.4, tell: null, sfx: false,
        onWind(e) { A.sfx('rewind'); G.rewindTint = 1; },
        onAct(e, g) {
          let n = 0; for (const pr of g.ents) if (pr instanceof VS.Projectile && pr.team === 'enemy' && !pr.remove && pr.isLight) { pr.vx = -pr.vx * 1.15; pr.vy = -pr.vy * 1.15; pr.homing = 0; pr.life = Math.max(pr.life, 2.5); n++; }
          const h = e.hist && e.hist.length ? e.hist[0] : null;
          G.burst(e.cx, e.cy, 20, { color: '#c8b0ff', speed: 120, life: 0.5, size: 1.6, add: true });
          if (h) { e.x = h[0]; e.y = h[1]; }
          G.burst(e.cx, e.cy, 20, { color: '#c8b0ff', speed: 120, life: 0.5, size: 1.6, add: true });
          if (!n) { const p = g.player; for (let i = 0; i < 6; i++) { const a = i / 6 * U.TAU; g.spawn(seraLight({ x: p.cx + Math.cos(a) * 200, y: p.cy + Math.sin(a) * 200, vx: -Math.cos(a) * 160, vy: -Math.sin(a) * 160, life: 3, kind: 'lance' })); } }
          e.count++; if (!e.rewindHint) { e.rewindHint = true; VS.UI.toast(VS.t('tip_seraphine_rewind'), 4); }
        },
        onEnd() { G.rewindTint = 0; } },
    },
    sheetAnchor: 'center',
    animMap: { stoptime: 'atk_burst', rewind: 'atk_beams' },
    // apagada: animação própria (encolhida, cinzenta) enquanto dura a janela para lhe bater
    animState(e) { return e.dim > 0 && !e.defeated ? { anim: 'dim' } : null; },
    // a desfazer o tempo: as imagens dela pelo caminho de volta, cada vez mais nítidas até ao sítio de onde vai reaparecer
    drawBehind(ctx, e) {
      const a = e.atk; if (!a || a.name !== 'rewind' || a.phase !== 'wind' || !e.hist || e.hist.length < 10) return;
      const k = Math.min(1, a.t / a.s.wind), n = 4;
      for (let i = 1; i <= n; i++) { const h = e.hist[Math.floor((e.hist.length - 1) * (1 - i / n))]; VS.EnemyRender.ghost(ctx, e, '#b49aff', (0.18 + 0.12 * i) * k, h[0] - e.x, h[1] - e.y); }
    },
    init(e) { e.count = 0; e.dim = 0; e.hist = []; },
    think(e, dt, g) {
      const p = g.player;
      // nada fica suspenso fora do tempo parado (se o ataque for interrompido, a luz solta-se)
      if ((!e.atk || e.atk.name !== 'stoptime') && g.ents.some((x) => x._fv)) seraFreeze(e, g, false);
      // memória de onde esteve (para desfazer o tempo): ~2,5 s
      e.hist.push([e.x, e.y]); if (e.hist.length > 150) e.hist.shift();
      if (e.dim > 0) { e.dim -= dt; e.vx *= 0.9; e.vy = U.approach(e.vy, 30, 100 * dt); e.y = Math.min(e.y, e.arena.floor - e.h - 4); return; }
      if (e.atk) { if (e.atk.phase === 'wind') { e.vx *= 0.9; e.vy *= 0.9; } return; }
      e.face();
      e.fly(g.room.pw / 2 + Math.sin(e.anim * 0.6) * 170, e.arena.floor - 150 + Math.sin(e.anim) * 30, 140, dt, 0.05);
      if (e.count >= 4 - Math.min(1, e.phase)) { e.count = 0; e.dim = e.phase >= 2 ? 2.2 : 2.7; A.sfx('choir_hit'); VS.UI.toast(VS.t('tip_seraphine_dim'), 2); return; }
      if (e.cool <= 0) {
        const r = Math.random(), ph = e.phase;
        const pick = ph === 0 ? (r < 0.3 ? 'burst' : r < 0.6 ? 'lance' : r < 0.8 ? 'beams' : 'embrace')
          : ph === 1 ? (r < 0.2 ? 'burst' : r < 0.4 ? 'lance' : r < 0.55 ? 'beams' : r < 0.7 ? 'embrace' : r < 0.88 ? 'stoptime' : 'rewind')
            : (r < 0.15 ? 'burst' : r < 0.3 ? 'lance' : r < 0.42 ? 'beams' : r < 0.55 ? 'embrace' : r < 0.78 ? 'stoptime' : 'rewind');
        e.attack(pick); e.cool = 0.6 - e.phase * 0.15;
      }
    },
    // só a luz devolvida (ou golpes enquanto se apaga) a ferem
    onHitBoss(e, hb, g) {
      if (hb.proj && hb.proj.isLight) { hb = Object.assign({}, hb, { dmg: 40 }); A.sfx('choir_hit'); return E.Enemy.prototype.onHit.call(e, hb, g); }
      if (e.dim > 0) return E.Enemy.prototype.onHit.call(e, hb, g);
      A.sfx('light', { vol: 0.5 }); if (!e.tip) { e.tip = true; VS.UI.toast(VS.t('tip_seraphine'), 4); }
      return 'blocked';
    },
    onPhase(e, g) { VS.UI.bark('boss_seraphine', e.phase === 1 ? 'seraphine_mid1' : 'seraphine_mid2'); },
    preLines: () => [{ s: 'boss_seraphine', k: 'seraphine_pre1' }, { s: 'boss_seraphine', k: 'seraphine_pre2' }],
    light(e) { G.light(e.cx, e.cy, e.dim > 0 ? 70 : 200, '#fff0d0', 1); },
  });
})(window.VS);
