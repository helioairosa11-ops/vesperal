// Vesperal — padrões de esquiva dos chefes (ao estilo dos "bullet hells"): chuva por colunas com uma falha, muros com
// uma abertura, espirais, anéis com uma falha a rodar e grelhas no chão que rebentam à vez. Não se aparam: leem-se e
// esquivam-se. Cada chefe tem o seu (com as suas cores e projéteis) e fica mais denso nas fases seguintes.
'use strict';
(function (VS) {
  const U = VS.U, G = VS.Gfx, A = VS.Audio, B = VS.Bosses;
  const P = (o) => new VS.Projectile(Object.assign({ parryable: false, reflectable: false, solid: false, life: 4 }, o));

  // ---------- anel com uma falha (a falha roda de anel para anel) ----------
  class GapRing extends VS.Entity {
    constructor(x, y, speed, max, dmg, col, gapA, gapW) {
      super(x - 2, y - 2, 4, 4); this.ox = x; this.oy = y; this.r = 14; this.speed = speed; this.max = max; this.dmg = dmg;
      this.col = col; this.gapA = gapA; this.gapW = gapW; this.z = 6; this.attackHBs = []; this.aid = VS.Entity.newAttackId(); this.drawAlways = true;
    }
    inGap(a) { return Math.abs(Math.atan2(Math.sin(a - this.gapA), Math.cos(a - this.gapA))) < this.gapW / 2; }
    update(dt, game) {
      super.update(dt, game);
      this.r += this.speed * dt; this.attackHBs = [];
      if (this.r > this.max) { this.remove = true; return; }
      const n = Math.max(16, Math.round(this.r / 7));
      for (let i = 0; i < n; i++) {
        const a = i / n * U.TAU; if (this.inGap(a)) continue;
        const x = this.ox + Math.cos(a) * this.r, y = this.oy + Math.sin(a) * this.r;
        if (y < 0 || y > game.room.ph) continue;
        this.attackHBs.push({ x: x - 5, y: y - 5, w: 10, h: 10, dmg: this.dmg, id: this.aid, unblockable: true, parryable: false, src: { cx: this.ox } });
      }
    }
    draw(ctx) {
      const k = 1 - this.r / this.max, c = this.col, a0 = this.gapA + this.gapW / 2, a1 = this.gapA - this.gapW / 2 + U.TAU;
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = `rgba(${c[0]},${c[1]},${c[2]},${(0.32 * k).toFixed(3)})`; ctx.lineWidth = 9; ctx.beginPath(); ctx.arc(this.ox, this.oy, Math.max(1, this.r - 5), a0, a1); ctx.stroke();
      ctx.strokeStyle = `rgba(${Math.min(255, c[0] + 40)},${Math.min(255, c[1] + 40)},${Math.min(255, c[2] + 40)},${(0.7 * k).toFixed(3)})`; ctx.lineWidth = 2.6; ctx.beginPath(); ctx.arc(this.ox, this.oy, this.r, a0, a1); ctx.stroke();
      ctx.restore();
    }
  }

  // ---------- desenho das grelhas a rebentar (colunas de chama/luz/espinhos) ----------
  class PatternFx extends VS.Entity {
    constructor(boss, run) { super(boss.x, boss.y, 2, 2); this.b = boss; this.run = run; this.z = 6; this.drawAlways = true; }
    update(dt, game) { super.update(dt, game); if (this.b.remove || this.b.defeated || this.b.patRun !== this.run) this.remove = true; }
    draw(ctx) {
      const r = this.run, f = r.fire; if (!f) return;
      const fl = this.b.arena.floor, k = f.k, h = 96 * Math.min(1, k * 5) * (k > 0.7 ? Math.max(0, 1 - (k - 0.7) / 0.3) : 1), col = r.spec.color || '#ff8030', t = this.b.anim || 0;
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (const x of f.xs) {
        const gr = ctx.createLinearGradient(0, fl, 0, fl - h); gr.addColorStop(0, U.rgba('#ffffff', 0.85)); gr.addColorStop(0.25, U.rgba(col, 0.75)); gr.addColorStop(1, U.rgba(col, 0));
        ctx.fillStyle = gr; const w = 13 + Math.sin(t * 30 + x) * 2;
        if (r.spec.thorn) { // espinhos: três pontas
          for (const dx of [-8, 0, 8]) { ctx.beginPath(); ctx.moveTo(x + dx - 5, fl); ctx.lineTo(x + dx, fl - h * (dx ? 0.75 : 1)); ctx.lineTo(x + dx + 5, fl); ctx.closePath(); ctx.fill(); }
        } else {
          ctx.beginPath(); ctx.moveTo(x - w, fl); ctx.quadraticCurveTo(x - w * 0.6, fl - h * 0.5, x + Math.sin(t * 20 + x) * 4, fl - h); ctx.quadraticCurveTo(x + w * 0.6, fl - h * 0.5, x + w, fl); ctx.closePath(); ctx.fill();
        }
      }
      ctx.restore();
    }
  }

  const P_ = {};
  // começa um padrão: devolve o estado (com a duração total)
  P_.start = function (e, g, spec) {
    if (Array.isArray(spec)) spec = U.pick(spec.filter((q) => (q.phaseMin || 0) <= (e.phase || 0))) || spec[0];
    const ph = Math.min(2, e.phase || 0), r = { spec, t: 0, ph, done: {}, dur: 3 };
    const p = g.player;
    if (spec.type === 'rain') {
      const n = (spec.waves || 3) + ph, iv = 0.95 - ph * 0.12, warn = 0.55;
      r.waves = [];
      for (let i = 0; i < n; i++) r.waves.push({ t0: i * iv, warn, xs: null });
      r.dur = (n - 1) * iv + warn + 1.0;
    } else if (spec.type === 'wall') {
      const n = (spec.walls || 2) + ph, iv = 1.35 - ph * 0.15;
      r.walls = []; for (let i = 0; i < n; i++) r.walls.push({ t0: 0.2 + i * iv });
      r.dur = 0.2 + (n - 1) * iv + 1.6;
    } else if (spec.type === 'spiral') {
      r.arms = (spec.arms || 3) + (ph >= 2 ? 1 : 0); r.w = (Math.random() < 0.5 ? 1 : -1) * (2.0 + ph * 0.3); r.a = Math.random() * U.TAU; r.next = 0;
      r.dur = 2.6 + ph * 0.4;
    } else if (spec.type === 'rings') {
      const n = (spec.rings || 3) + ph, iv = 0.85 - ph * 0.1;
      r.rings = []; let ga = Math.atan2(p.cy - e.cy, p.cx - e.cx) + (Math.random() < 0.5 ? 1 : -1) * 0.9;
      for (let i = 0; i < n; i++) { r.rings.push({ t0: i * iv, gapA: ga }); ga += (Math.random() < 0.5 ? 1 : -1) * U.rand(0.8, 1.3); }
      r.dur = (n - 1) * iv + 2.4;
    } else if (spec.type === 'grid') {
      const n = (spec.cycles || 3) + ph, warn = 0.62 - ph * 0.07, fire = 0.36;
      r.secs = []; for (let k = -6; k <= 6; k++) { const x = Math.round(p.cx + k * 44); if (x > e.arena.x0 + 10 && x < e.arena.x1 - 10) r.secs.push({ x, k }); }
      r.cycles = []; for (let i = 0; i < n; i++) r.cycles.push({ t0: i * (warn + fire), warn, fire, set: i % 2 });
      r.dur = n * (warn + fire) + 0.3;
      g.spawn(new PatternFx(e, r));
    }
    return r;
  };
  P_.tick = function (e, g, dt, r) {
    if (!r) return;
    r.t += dt; const s = r.spec, p = g.player, dmg = Math.round((s.dmg || 14) * (e.dmgScale || 1)), V = { x0: G.cam.x, x1: G.cam.x + U.VIEW_W, y0: G.cam.y };
    if (s.type === 'rain') {
      e.colXs = null;
      for (const w of r.waves) {
        if (r.t < w.t0) continue;
        if (!w.xs) { // colunas de 30 px por toda a vista, com uma falha de ~70 px perto de onde estás
          const gx = U.clamp(p.cx + U.rand(-80, 80), V.x0 + 50, V.x1 - 50); w.xs = [];
          for (let x = V.x0 + 12; x < V.x1 - 6; x += 30) if (Math.abs(x - gx) > 36) w.xs.push(Math.round(x));
          A.sfx('danger_tell', { vol: 0.35 });
        }
        if (r.t < w.t0 + w.warn) { e.colXs = w.xs; e.colWarnCol = s.warnCol || s.color; continue; }
        if (!w.fell) {
          w.fell = true;
          for (const x of w.xs) g.spawn(P({ x: x - 5, y: Math.max(0, V.y0 - 14) + U.rand(-10, 0), vx: 0, vy: 430, w: 10, h: 14, dmg, kind: s.kind || 'clod', color: s.color, solid: true, light: !!s.light, hue: Math.random() * 360, rot: Math.PI / 2 }));
          A.sfx('whip', { vol: 0.35 });
        }
      }
    } else if (s.type === 'wall') {
      for (const w of r.walls) {
        if (r.t < w.t0 || w.go) continue;
        w.go = true; const fromL = (r.walls.indexOf(w) + (p.cx > (V.x0 + V.x1) / 2 ? 0 : 1)) % 2 === 0, fl = e.arena.floor, low = Math.random() < 0.5;
        const gap0 = low ? fl - 46 : fl - 104, gap1 = low ? fl : fl - 52, sp = 200 + r.ph * 20;
        for (let y = fl - 6; y > fl - 196; y -= 13) { if (y > gap0 - 4 && y < gap1 + 4) continue; g.spawn(P({ x: fromL ? V.x0 - 14 : V.x1 + 4, y: y - 5, vx: (fromL ? 1 : -1) * sp, w: 10, h: 10, dmg, kind: s.kind || 'fire', color: s.color, life: (U.VIEW_W + 40) / sp, light: false })); }
        A.sfx('wind', { vol: 0.5 });
      }
    } else if (s.type === 'spiral') {
      r.a += r.w * dt; r.next -= dt;
      if (r.t > 1.4 && !r.flip && r.ph >= 1) { r.flip = true; r.w = -r.w; }
      if (r.next <= 0) {
        r.next = 0.12 - r.ph * 0.015;
        for (let i = 0; i < r.arms; i++) { const a = r.a + i * U.TAU / r.arms; g.spawn(P({ x: e.cx - 4, y: e.cy - 4, vx: Math.cos(a) * 125, vy: Math.sin(a) * 125, w: 8, h: 8, dmg, kind: s.kind || 'scale', color: s.color, hue: (r.t * 160 + i * 90) % 360, life: 3.6, light: false })); }
      }
    } else if (s.type === 'rings') {
      for (const rg of r.rings) {
        if (r.t < rg.t0 || rg.go) continue;
        rg.go = true; g.spawn(new GapRing(e.cx, e.cy, 165 + r.ph * 15, 460, dmg, s.color || [255, 214, 120], rg.gapA, 1.05 - r.ph * 0.1));
        A.sfx(s.sfx || 'bell_small', { vol: 0.5 });
      }
    } else if (s.type === 'grid') {
      e.colXs = null; r.fire = null;
      for (const c of r.cycles) {
        const t = r.t - c.t0; if (t < 0 || t > c.warn + c.fire) continue;
        const xs = r.secs.filter((q) => Math.abs(q.k) % 2 === c.set).map((q) => q.x);
        if (t < c.warn) { e.colXs = xs; e.colWarnCol = s.color; continue; }
        if (!c.boom) { c.boom = true; A.sfx(s.light ? 'light' : 'fire', { vol: 0.6 }); G.addShake(0.2); c.id = VS.Entity.newAttackId(); }
        r.fire = { xs, k: (t - c.warn) / c.fire };
        for (const x of xs) e.attackHBs.push({ x: x - 16, y: e.arena.floor - 92, w: 32, h: 92, dmg, id: c.id, unblockable: true, parryable: false, src: { cx: x } });
      }
    }
  };

  // ---------- o golpe "padrão" que os chefes ganham (dura o que o padrão durar; o chefe fica a conjurar) ----------
  const PATTERN = { wind: 0.65, act: 3, rec: 0.55, tell: 'red', sfx: false, armor: true,
    onWind(e) { e.vx = 0; VS.FX.flare(e.cx, e.cy, 30, [255, 220, 170], 0.35); },
    onAct(e, g) { e.patRun = P_.start(e, g, e.K.pattern); e.atk.s = Object.assign({}, e.atk.s, { act: e.patRun.dur }); if (!VS.state.flags.tip_pattern) { VS.state.flags.tip_pattern = 1; VS.UI.toast(VS.t('tip_pattern'), 4.5); } },
    during(e, g, dt) { if (e.flying) { e.vx *= 0.9; e.vy *= 0.9; } else e.vx = 0; P_.tick(e, g, dt, e.patRun); },
    onEnd(e) { e.patRun = null; e.colXs = null; },
  };
  // que padrão tem cada chefe (os extremos — Custódio, Seraphine e o rei — têm os seus próprios poderes)
  const SPEC = {
    coveiro: { type: 'rings', color: [200, 40, 50], rings: 2, dmg: 13, every: [13, 17] }, // círculos de sangue que se abrem no chão
    matilheira: { type: 'wall', kind: 'fire', color: '#ff7a30', walls: 2, dmg: 13, every: [12, 16] },
    caedmon: { type: 'rings', color: [170, 205, 255], rings: 3, dmg: 14, every: [12, 15] }, // sem chuva do céu: ondas de luz no chão
    automato: { type: 'grid', color: '#ff8030', cycles: 3, dmg: 15, every: [11, 14] },
    hilde: { type: 'rain', kind: 'molten', color: '#ff7020', warnCol: '#ff8030', waves: 3, dmg: 15, light: true, every: [11, 14] },
    mariposa: { type: 'spiral', kind: 'scale', color: '#f0e0ff', arms: 3, dmg: 12, every: [10, 13] },
    elowen: { type: 'grid', color: '#9fffd0', cycles: 3, thorn: true, dmg: 15, every: [12, 15] },
    sineiro: { type: 'rings', color: [255, 214, 120], rings: 3, dmg: 15, every: [10, 13] },
    corvin: { type: 'rings', color: [255, 208, 112], rings: 3, dmg: 13, sfx: 'note', every: [11, 14] }, // ondas do alaúde (as notas dele seguem o compasso)
    vael: { type: 'wall', kind: 'fire', color: '#ff5020', walls: 3, dmg: 16, every: [10, 13] },
    ozias: { type: 'grid', color: '#fff0c0', cycles: 4, light: true, dmg: 16, every: [10, 13] },
    gemeo_a: { type: 'rain', kind: 'ingot', color: '#c0c8d8', warnCol: '#d0d8e8', waves: 3, dmg: 15, every: [14, 18] },
    carpideira: { type: 'rings', color: [255, 120, 110], rings: 3, dmg: 16, sfx: 'sob', every: [12, 15] },
    // o rei (barras 2 e 3): chuva de fogo, muros de chama, o chão a arder à vez, anéis do juízo e a espiral de brasas
    aldric: [
      { type: 'rain', kind: 'fire', color: '#ff4020', warnCol: '#ff3020', waves: 3, dmg: 18, phaseMin: 1, every: [9, 12] },
      { type: 'wall', kind: 'fire', color: '#ff3a20', walls: 2, dmg: 18, phaseMin: 1 },
      { type: 'grid', color: '#ff3020', cycles: 3, dmg: 20, phaseMin: 1 },
      { type: 'rings', color: [255, 70, 50], rings: 3, dmg: 18, sfx: 'judgement_slam', phaseMin: 2 },
      { type: 'spiral', kind: 'fire', color: '#ff6020', arms: 4, dmg: 16, phaseMin: 2 },
    ],
  };
  for (const id in SPEC) { const D = B && B.DEFS[id]; if (!D) continue; D.pattern = SPEC[id]; D.attacks._pattern = PATTERN; }
  P_.SPEC = SPEC; P_.PATTERN = PATTERN; P_.GapRing = GapRing;
  VS.Patterns = P_;
})(window.VS);
