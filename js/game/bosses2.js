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

  // ======================================================================
  // MESTRA HILDE, A FERREIRA
  // ======================================================================
  const HEAT_MAX = 3;
  const hildeHeat = (e) => { e.heat = (e.heat || 0) + 1; if (e.heat >= HEAT_MAX) e.mustCool = true; };
  B.def('hilde', {
    cfg: { w: 30, h: 62, hp: 760, music: 'b_hilde', heavy: true, phases: [0.5], introTime: 1.6 },
    attacks: {
      hammer: { wind: 0.7, act: 0.14, rec: 0.7, dmg: 24, tell: 'white', sfx: 'swing_heavy', hb: (e) => front(e, 12, 0, 44, 58), onAct(e, g) { G.addShake(0.45); A.sfx('crush'); VS.FX.impact(e.cx + e.facing * 40, e.bottom - 2, 'metal', e.facing, 1.3); firePool(g, e.cx + e.facing * 40, e.arena.floor, 40, 3.5); hildeHeat(e); } },
      sweep: { wind: 0.55, act: 0.2, rec: 0.55, dmg: 20, tell: 'white', sfx: 'swing_heavy', hb: (e) => front(e, -14, 0, 72, 32), lunge: 80, onAct(e) { hildeHeat(e); } },
      ingots: { wind: 0.6, act: 0.12, rec: 0.6, tell: null, sfx: 'swing', onAct(e, g) { const p = g.player; const n = e.phase ? 4 : 3; const o = { x: e.cx + e.facing * 22, y: e.bottom - 70 }; for (let i = 0; i < n; i++) { const tx = p.cx + (i - (n - 1) / 2) * 50; g.spawn(P({ x: o.x, y: o.y, vx: (tx - o.x) / 1.0, vy: -300, g: 840, w: 12, h: 7, dmg: 14, kind: 'ingot', color: '#ff8030', life: 3, spin: 8, reflectable: false, onHitWall(g2) { firePool(g2, this.cx, this.cy + 4, 24, 2); } })); } G.burst(o.x, o.y, 14, { color: '#ffb040', speed: 160, life: 0.4, size: 1.6, add: true }); } },
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
      if (e.mustCool) { e.attack('overheat'); return; }
      if (e.cool > 0) { e.walk(d > 80 ? e.facing : d < 40 ? -e.facing : 0, 50, dt); return; }
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
  // AMA ELOWEN — enraizada; na fase 2 a água sobe e ela liberta-se
  // ======================================================================
  const ER = () => VS.EnemyRender;
  B.def('elowen', {
    cfg: { w: 32, h: 68, hp: 820, music: 'b_elowen', heavy: true, phases: [0.5], introTime: 1.8, blood: '#2a3a1a' },
    attacks: {
      thorns: { wind: 0.4, act: 1.2, rec: 0.5, tell: null, sfx: 'whip', onAct(e, g) { const p = g.player; e.thX = [p.cx - 40, p.cx, p.cx + 40].map((x) => U.clamp(x, 30, g.room.pw - 30)); }, during(e, g) { columns(e, g, e.thX, { warn: 0.7, h: 60, w: 14, dmg: 18, sfx: 'whip', warnCol: '#8aa050', cols: ['#4a5a2a', '#6a7a3a'] }); } },
      // chicote de silvas: sai da mão-ramo à altura do peito (a silva é desenhada em drawOver)
      whip: { wind: 0.5, act: 0.18, rec: 0.5, dmg: 18, tell: 'white', sfx: 'whip', hb: (e) => front(e, 26, 38, 112, 18) },
      seeds: { wind: 0.6, act: 0.1, rec: 0.6, tell: null, sfx: 'swing', onAct(e, g) { const h = ER().point(e, e._f, 'hand') || { x: e.cx, y: e.y + 10 }; for (let i = 0; i < 3; i++) g.spawn(P({ x: h.x, y: h.y, vx: e.facing * (100 + i * 70), vy: -300, g: 700, w: 10, h: 10, dmg: 12, kind: 'seed', color: '#8ac050', life: 4, bounce: true, bounces: 3, reflectable: true, light: false })); } },
      // ponto fraco: a canção é longa — um golpe enquanto canta cala-a e deixa-a vergada sobre a trouxa
      lullaby: { wind: 1.35, act: 0.1, rec: 0.6, tell: null, sfx: 'choir_hit', onWind(e) { A.sfx('chime', { vol: 0.5 }); }, onAct(e, g) { e.ringR = 10; e.ringOn = true; } },
    },
    init(e) { e.rooted = true; e.ringR = 0; e.ringOn = false; },
    think(e, dt, g) {
      // anel de canção de embalar: abranda quem estiver na onda
      if (e.ringOn) { e.ringR += 160 * dt; const p = g.player; const d = Math.hypot(p.cx - e.cx, p.cy - e.cy); if (Math.abs(d - e.ringR) < 14 && !(p.action && p.action.type === 'dodge')) { p.slowT = 2.2; if (!p.hitIds.has('ring' + Math.floor(e.ringR / 1000))) { p.hitIds.set('ring' + Math.floor(e.ringR / 1000), 1); } } if (e.ringR > 420) e.ringOn = false; }
      if (e.phase && g.floodY > e.floodTarget) g.floodY -= dt * 6;
      // notas da canção a sair da boca enquanto embala
      if (e.atk && e.atk.name === 'lullaby' && e.atk.phase === 'wind' && Math.random() < 0.12) { const m = ER().point(e, e._f, 'mouth'); if (m) G.emit({ x: m.x, y: m.y, vx: e.facing * U.rand(10, 30), vy: U.rand(-40, -20), life: 1.4, size: 1.8, color: '#c8f0b0', add: true }); if (!e.songHint && e.atk.t > 0.5) { e.songHint = true; VS.UI.toast(VS.t('tip_elowen_song'), 4); } }
      if (e.atk) return;
      e.face(); const d = Math.abs(e.dx());
      if (e.rooted) e.vx = 0;
      if (e.cool > 0) { if (!e.rooted) e.walk(d > 80 ? e.facing : 0, 40, dt); return; }
      const r = Math.random();
      if (d < 130) e.attack(r < 0.45 ? 'whip' : r < 0.7 ? 'thorns' : 'lullaby');
      else e.attack(r < 0.4 ? 'thorns' : r < 0.7 ? 'seeds' : 'lullaby');
    },
    damageMult(e, hb) {
      const a = e.atk;
      if (a && a.name === 'lullaby' && a.phase === 'wind') {
        e.atk = null; e.stagger = 1.8; e.cool = 0.6; A.sfx('stagger'); A.sfx('glass', { vol: 0.5 });
        const L = ER().point(e, e._f, 'light'); if (L) { VS.FX.flare(L.x, L.y, 26, [200, 240, 180], 0.2); G.burst(L.x, L.y, 16, { color: '#c8f0b0', speed: 120, life: 0.6, size: 1.6, add: true }); }
        VS.UI.toast(VS.t('tip_elowen_broken'), 3); return 1.6;
      }
      return e.stagger > 0 ? 1.3 : 1;
    },
    // silva do chicote: sai da mão-ramo, ondula e recolhe; espinhos claros
    drawOver(ctx, e) {
      const a = e.atk; if (!a || a.name !== 'whip' || a.phase === 'wind') return;
      const h = ER().point(e, e._f, 'hand'); if (!h) return;
      const ext = a.phase === 'act' ? Math.min(1, 0.4 + a.t / 0.1) : Math.max(0, 1 - a.t / 0.3); if (ext <= 0.02) return;
      const L = 112 * ext, n = 18, pts = [];
      for (let i = 0; i <= n; i++) { const k = i / n; pts.push([h.x + e.facing * L * k, h.y + Math.sin(k * 9 + (e.t || 0) * 30) * 3 * k * (1 - k * 0.5) + k * 4]); }
      ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      for (const [w, c] of [[4.2, '#0e140a'], [2.8, '#3e5228'], [1.0, '#6e8a46']]) { ctx.lineWidth = w * (1 - 0.3); ctx.strokeStyle = c; ctx.beginPath(); pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.stroke(); }
      ctx.fillStyle = '#d8d0b0';
      for (let i = 2; i < n; i += 2) { const p = pts[i], s = i % 4 ? -1 : 1; ctx.beginPath(); ctx.moveTo(p[0] - 1.2, p[1]); ctx.lineTo(p[0] + e.facing * 1.6, p[1] + s * 3.2); ctx.lineTo(p[0] + 1.2, p[1]); ctx.fill(); }
      ctx.restore();
    },
    onPhase(e, g) {
      e.rooted = false; A.sfx('roar'); G.addShake(0.5); A.sfx('splash');
      g.floodY = e.arena.floor + 2; e.floodTarget = e.arena.floor - T * 2.2;
      VS.UI.bark('boss_elowen', 'elowen_mid');
    },
    preLines: () => [{ s: 'boss_elowen', k: 'elowen_pre1' }, { s: 'boss_elowen', k: 'elowen_pre2' }],
    eyeLight: { r: 16, i: 0.4, color: '#a8f0a0' },
    light(e) { const L = e._f && ER().point(e, e._f, 'light'); const sing = e.atk && e.atk.name === 'lullaby'; G.light(L ? L.x : e.cx, L ? L.y : e.y + 10, sing ? 130 : 100, '#b0ffd0', sing ? 0.85 : 0.6, 1); },
  });

  // ======================================================================
  // CORVIN, O MENESTREL — ataques sincronizados com a sua música (120 BPM)
  // ======================================================================
  // Corvin toca do alto dos balcões dos sinos. Do chão não se lhe toca: a canção desvia golpes e feitiços que
  // venham de baixo — é preciso trepar pelas paredes/coluna até ao balcão dele. Golpes no tempo ferem mais.
  const CORVIN_PATTERNS = [
    'n...n...w...n...',
    'n.n.w...n.n.r...',
    'nnw.r.nnw.r.d.j.',
  ];
  const corvinPerch = (e) => e.perches[e.perchI];
  const corvinOnPerch = (e, who) => { const P = corvinPerch(e); return who.bottom <= P.y + 6 && who.bottom >= P.y - 60 && who.cx >= P.x0 - 24 && who.cx <= P.x1 + 24; };
  function corvinLeap(e, g, avoid) {
    const p = g.player; let best = -1, bd = -1;
    e.perches.forEach((P, i) => { if (i === e.perchI) return; const d = Math.abs((P.x0 + P.x1) / 2 - p.cx) + (avoid && i === avoid ? -999 : 0); if (d > bd) { bd = d; best = i; } });
    if (best < 0) return;
    G.burst(e.cx, e.cy, 18, { color: '#ffe0a0', speed: 110, life: 0.5, size: 1.5, add: true }); A.sfx('chime', { vol: 0.6 });
    e.perchI = best; const P = e.perches[best];
    e.x = (P.x0 + P.x1) / 2 - e.w / 2; e.y = P.y - e.h; e.vx = 0; e.vy = 0; e.hitsHere = 0; e.nearT = 0;
    G.burst(e.cx, e.cy, 18, { color: '#ffe0a0', speed: 110, life: 0.5, size: 1.5, add: true });
    e.beatAnim = { anim: 'bow', t: 0, d: 0.35 };
  }
  B.def('corvin', {
    cfg: { w: 22, h: 62, hp: 700, music: 'b_corvin', phases: [0.6, 0.3], introTime: 1.6, heavy: true },
    camBias: 0.45,
    attacks: {
      strike: { wind: 0.3, act: 0.14, rec: 0.35, dmg: 18, tell: 'white', hb: (e) => front(e, 2, 8, 46, 44), lunge: 90, sfx: 'whip' },
    },
    init(e) {
      e.lastBeat = -1; e.strum = 0; e.hitsHere = 0; e.nearT = 0;
      const T2 = U.TILE, pr = (e.spawn && e.spawn.perches) || [[2, 8, 10], [28, 35, 8], [55, 61, 10]];
      e.perches = pr.map(([x0, x1, y]) => ({ x0: x0 * T2, x1: (x1 + 1) * T2, y: y * T2 }));
      e.perchI = 1;
    },
    think(e, dt, g) {
      const beat = Math.floor(A.beat()), p = g.player, P = corvinPerch(e);
      e.strum = Math.max(0, e.strum - dt * 4);
      if (e.beatAnim) { e.beatAnim.t += dt; if (e.beatAnim.t > e.beatAnim.d) e.beatAnim = null; }
      // fica no seu balcão
      if (e.cx < P.x0 + 6) e.x = P.x0 + 6 - e.w / 2; if (e.cx > P.x1 - 6) e.x = P.x1 - 6 - e.w / 2;
      if (e.bottom > P.y + 30) { e.x = (P.x0 + P.x1) / 2 - e.w / 2; e.y = P.y - e.h; e.vy = 0; }
      const near = corvinOnPerch(e, p);
      e.nearT = near ? e.nearT + dt : Math.max(0, e.nearT - dt * 0.5);
      if (beat !== e.lastBeat && beat >= 0) {
        e.lastBeat = beat;
        const pat = CORVIN_PATTERNS[Math.min(e.phase, 2)];
        let c = pat[beat % 16];
        // com a jogadora no balcão dele: golpeia no compasso em vez de cantar para baixo
        if (near && (c === 'n' || c === 'r') && beat % 2 === 0) c = 'd';
        e.strum = 1;
        e.face();
        if (c === 'n') { // nota apontada (aparável; ao ser devolvida perde-se no canto — não o fere)
          const a = Math.atan2(p.cy - e.cy + 4, p.cx - e.cx);
          const L = VS.EnemyRender.point(e, e._f, 'lute') || { x: e.cx + e.facing * 10, y: e.cy - 6 };
          g.spawn(P2({ x: L.x, y: L.y, vx: Math.cos(a) * 190, vy: Math.sin(a) * 190, w: 10, h: 10, dmg: 13, kind: 'note', color: U.pick(['#ffd070', '#ff9070', '#c0a0ff']), life: 5, solid: false }));
          A.sfx('note', { note: U.pick(['E5', 'G5', 'B5']) });
        } else if (c === 'w') { // onda pelo chão da torre (empurra para as paredes: trepar livra dela)
          for (const sx of [-1, 1]) g.spawn(P2({ x: g.room.pw / 2, y: e.arena.floor - 10, vx: sx * 220, w: 12, h: 22, dmg: 14, kind: 'wave', color: '#ffe0a0', life: 3, solid: true, reflectable: false }));
          A.sfx('bell_small'); e.beatAnim = { anim: 'heel', t: 0, d: 0.3 };
        } else if (c === 'r') { // chuva de notas
          for (let i = 0; i < 4; i++) g.spawn(P2({ x: U.clamp(p.cx + (i - 1.5) * 60 + U.rand(-10, 10), 30, g.room.pw - 30), y: 40, vx: 0, vy: 150, w: 10, h: 10, dmg: 12, kind: 'note', color: '#c0a0ff', life: 5, solid: false }));
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
    // só se lhe fere no balcão: a canção desvia o que vem de baixo (feitiços, notas devolvidas, golpes de salto)
    onHitBoss(e, hb, g) {
      const p = g.player;
      if (!corvinOnPerch(e, p) || hb.proj) {
        A.sfx('note', { note: 'B5' }); G.burst(e.cx, e.cy - 10, 8, { color: '#ffe0a0', speed: 80, life: 0.35, size: 1.2, add: true });
        if (!e.climbHint || g.time - e.climbHint > 8) { e.climbHint = g.time; VS.UI.toast(VS.t('tip_corvin_climb'), 4); }
        return 'blocked';
      }
      // no tempo (perto da batida) o golpe fere mais
      const ph = A.beat() % 1, onBeat = ph < 0.16 || ph > 0.9;
      if (onBeat) { hb = Object.assign({}, hb, { dmg: Math.round(hb.dmg * 1.6) }); VS.FX.flare(e.cx, e.cy - 14, 18, [255, 230, 160], 0.14); if (!e.beatHint) { e.beatHint = true; VS.UI.toast(VS.t('tip_corvin_beat'), 4); } }
      e.hitsHere++;
      return E.Enemy.prototype.onHit.call(e, hb, g);
    },
    animState(e) { if (e.beatAnim && !e.atk) return { anim: e.beatAnim.anim, idx: Math.min(4.99, e.beatAnim.t / e.beatAnim.d * 5) }; if (!e.atk && Math.abs(e.vx) < 6) return { anim: 'play', idx: Math.min(5.99, (1 - e.strum) * 6) }; return null; },
    onPhase(e, g) { A.sfx('chime'); VS.UI.bark('boss_corvin', e.phase === 1 ? 'corvin_mid1' : 'corvin_mid2'); corvinLeap(e, g); },
    preLines: () => [{ s: 'boss_corvin', k: 'corvin_pre1' }, { s: 'boss_corvin', k: 'corvin_pre2' }],
    eyeLight: { r: 14, i: 0.35, color: '#ffd070' },
    smearCol: [255, 220, 180],
    light(e) { const L = e._f && VS.EnemyRender.point(e, e._f, 'lute'); G.light(L ? L.x : e.cx, L ? L.y : e.cy, 70 + e.strum * 40, '#ffe0a0', 0.6 + e.strum * 0.3); for (const P of e.perches) G.light((P.x0 + P.x1) / 2, P.y - 10, 60, '#ffd890', 0.35, 1); },
  });

  // ======================================================================
  // BISPO OZIAS — pilares de luz, vidro, orbe do cálice (reflete com parry), varrimento (agachar ou saltar)
  // ======================================================================
  B.def('ozias', {
    cfg: { w: 30, h: 64, hp: 900, music: 'b_ozias', flying: true, phases: [0.6, 0.3], introTime: 1.8, heavy: true },
    sheetAnchor: 'center',
    attacks: {
      pillars: { wind: 0.3, act: 1.3, rec: 0.4, tell: null, sfx: 'chime', onAct(e, g) { const p = g.player; const n = 3 + e.phase; e.plX = []; for (let i = 0; i < n; i++) e.plX.push(U.clamp(p.cx + (i - (n - 1) / 2) * 70, 30, g.room.pw - 30)); }, during(e, g) { columns(e, g, e.plX, { warn: 0.75, h: 300, w: 13, dmg: 20, sfx: 'light', warnCol: '#ffe8a0', cols: ['#fff8e0', '#ffe0a0'] }); } },
      shards: { wind: 0.5, act: 0.1, rec: 0.7, tell: null, sfx: 'glass', onAct(e, g) { const n = 7 + e.phase * 3; for (let i = 0; i < n; i++) g.spawn(P({ x: U.rand(30, g.room.pw - 30), y: U.rand(-60, 0), vx: U.rand(-20, 20), vy: U.rand(160, 230), w: 7, h: 7, dmg: 11, kind: 'glass', color: U.pick(['#ff6080', '#6080ff', '#ffd060', '#a060ff']), life: 4, solid: true })); } },
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
  const ECHO_COL = { caedmon: '#a0c8ff', hilde: '#ff8030', elowen: '#9fffd0', corvin: '#ffe0a0', ozias: '#fff0c0' };
  const tipOf = (e) => (e._f && VS.EnemyRender.point(e, e._f, 'tip')) || { x: e.cx + e.facing * 50, y: e.bottom - 4 };
  function aldricShock(e, g, x, n) {
    for (const s of [-1, 1]) g.spawn(P({ x: x - 10, y: e.arena.floor - 16, vx: s * (e.phase ? 250 : 220), w: 20, h: 16, dmg: e.phase ? 16 : 14, kind: e.phase ? 'fire' : 'shockwave', color: e.phase ? '#ff5010' : '#c0a080', life: n || 1.5, solid: false, parryable: false, reflectable: false }));
  }
  function aldricKnock(e, g) {
    e.atk = null; e.attackHBs = []; e.vx = -e.facing * 140; e.knock = { t: 0, ph: 'fall' };
    G.addShake(0.9); A.sfx('crush'); A.sfx('hit_metal'); g.hitstop(0.12);
    VS.FX.impact(e.cx + e.facing * (e.w / 2 + 4), e.cy - 10, 'stone', -e.facing, 1.6);
    VS.FX.sparks(e.cx + e.facing * (e.w / 2), e.cy - 16, 16, -e.facing, { speed: 340 });
    if (!VS.state.flags.tip_aldric_wall) { VS.state.flags.tip_aldric_wall = 1; VS.UI.toast(VS.t('tip_aldric_wall'), 5); }
  }
  B.def('aldric', {
    cfg: { w: 32, h: 68, hp: 1400, music: 'b_aldric', heavy: true, phases: [0.55, 0.2], introTime: 2.4, ashCol: '#6a5a50' },
    attacks: {
      // varrida horizontal à altura do peito (branco: aparável); na fase 2 encadeia com o corte ascendente
      sweep: { wind: 0.65, act: 0.2, rec: 0.55, dmg: 24, tell: 'white', sfx: 'swing_heavy', hb: (e) => front(e, -6, 16, 84, 48), lunge: 90, onEnd(e) { if (e.phase && Math.random() < 0.55) { e.attack('sweep2'); } } },
      sweep2: { wind: 0.42, act: 0.2, rec: 0.6, dmg: 24, tell: 'white', sfx: 'swing_royal', hb: (e) => front(e, 0, 8, 64, 92), lunge: 120 },
      // golpe de cima (vermelho, com armadura): crava o montante e solta ondas de choque/fogo
      overhead: { wind: 0.95, act: 0.16, rec: 0.85, dmg: 32, tell: 'red', sfx: 'swing_heavy', armor: true, hb: (e) => front(e, 6, 0, 58, 100),
        onAct(e, g) { G.addShake(0.7); A.sfx('crush'); const x = e.cx + e.facing * 56; VS.FX.impact(x, e.arena.floor - 2, 'stone', e.facing, 1.6); aldricShock(e, g, x); } },
      // agarrar (vermelho): investe com a manopla aberta
      grab: { wind: 0.6, act: 0.25, rec: 0.8, dmg: 34, tell: 'red', hb: (e) => front(e, 0, 26, 50, 40), lunge: 250, sfx: 'whip' },
      // salto (vermelho): cai a cravar o montante
      leap: { wind: 0.55, act: 1.0, rec: 0.7, dmg: 28, tell: 'red', sfx: 'wind',
        onAct(e, g) { const p = g.player; e.vx = (p.cx - e.cx) / 0.8; e.vy = -580; },
        during(e, g) { e.attackHBs.push({ x: e.x - 6, y: e.y, w: e.w + 12, h: e.h, dmg: 28, id: e.atk.id, unblockable: true, parryable: false, src: e }); if (e.onGround && e.atk.t > 0.25) { e.atk.t = 99; e.vx = 0; G.addShake(0.7); A.sfx('crush'); const x = e.cx + e.facing * 56; VS.FX.impact(x, e.arena.floor - 2, 'stone', e.facing, 1.6); aldricShock(e, g, x, 1.2); } } },
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
      // ecos dos guardiões caídos (fase 2+): ergue a mão livre; a sombra do guardião surge atrás dele
      echo_caedmon: { wind: 0.7, act: 0.22, rec: 0.7, dmg: 24, tell: 'white', hb: (e) => front(e, 6, 36, 80, 20), lunge: 440, onWind(e) { e.echo = 'caedmon'; }, onEnd(e) { e.echo = null; } },
      echo_hilde: { wind: 0.6, act: 0.1, rec: 0.6, tell: null, sfx: 'swing', onWind(e) { e.echo = 'hilde'; }, onAct(e, g) { const p = g.player; const h = VS.EnemyRender.point(e, e._f, 'hand') || { x: e.cx, y: e.y }; for (let i = 0; i < 4; i++) { const tx = p.cx + (i - 1.5) * 55; g.spawn(P({ x: h.x, y: h.y, vx: (tx - h.x), vy: -440, g: 880, w: 12, h: 7, dmg: 15, kind: 'ingot', color: '#ff8030', life: 3, spin: 8, reflectable: false })); } }, onEnd(e) { e.echo = null; } },
      echo_elowen: { wind: 0.5, act: 1.1, rec: 0.5, tell: null, sfx: 'whip', onWind(e) { e.echo = 'elowen'; }, onAct(e, g) { const p = g.player; e.thX = [p.cx - 50, p.cx, p.cx + 50]; }, during(e, g) { columns(e, g, e.thX, { warn: 0.65, h: 60, w: 14, dmg: 18, sfx: 'whip', warnCol: '#8aa050', cols: ['#4a5a2a', '#6a7a3a'] }); }, onEnd(e) { e.echo = null; } },
      echo_corvin: { wind: 0.6, act: 0.1, rec: 0.6, tell: null, sfx: 'note', onWind(e) { e.echo = 'corvin'; }, onAct(e, g) { const h = VS.EnemyRender.point(e, e._f, 'hand') || { x: e.cx, y: e.cy - 20 }; for (let i = 0; i < 10; i++) { const a = i / 10 * U.TAU; g.spawn(P({ x: h.x, y: h.y, vx: Math.cos(a) * 150, vy: Math.sin(a) * 150, w: 10, h: 10, dmg: 13, kind: 'note', color: '#ffd070', life: 4, solid: false })); } }, onEnd(e) { e.echo = null; } },
      echo_ozias: { wind: 0.5, act: 1.2, rec: 0.5, tell: null, sfx: 'chime', onWind(e) { e.echo = 'ozias'; }, onAct(e, g) { const p = g.player; e.plX = [p.cx - 80, p.cx, p.cx + 80, p.cx + 160 * (Math.random() < 0.5 ? -1 : 1)]; }, during(e, g) { columns(e, g, e.plX, { warn: 0.7, h: 300, w: 13, dmg: 20, sfx: 'light', warnCol: '#ffe8a0', cols: ['#fff8e0', '#ffe0a0'] }); }, onEnd(e) { e.echo = null; } },
    },
    think(e, dt, g) {
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
      if (e.phase >= 1 && r < 0.3) { e.attack(U.pick(['echo_caedmon', 'echo_hilde', 'echo_elowen', 'echo_corvin', 'echo_ozias'])); return; }
      // a investida aparece mais quando a protagonista se afasta (ou está encostada a uma parede)
      if (d > 150 && r < (e.phase ? 0.6 : 0.45)) { e.attack('charge'); return; }
      if (d < 90) e.attack(r < 0.5 ? 'sweep' : r < 0.78 ? 'overhead' : 'grab');
      else if (d < 230) e.attack(r < 0.45 ? 'leap' : r < 0.75 ? 'grab' : 'charge');
      else e.attack(r < 0.5 ? 'charge' : 'leap');
      if (e.phase >= 2) e.cool = 0.15;
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
      if (a.name === 'charge' && a.phase === 'act') { const st = sh.meta.anims.charge_run.stride || 38; return { anim: 'charge_run', idx: ((e._r.dist / st) % 1) * 6 }; }
      if (a.name.startsWith('echo_') && a.name !== 'echo_caedmon') { const d = a.phase === 'wind' ? a.s.wind : a.phase === 'act' ? a.s.act : a.s.rec; return { anim: 'atk_echo', phase: a.phase, k: a.t / d }; }
      if (a.name === 'echo_caedmon') { const d = a.phase === 'wind' ? a.s.wind : a.phase === 'act' ? a.s.act : a.s.rec; return { anim: 'atk_thrust', phase: a.phase, k: a.t / d }; }
      return null;
    },
    // a sombra do guardião evocado: a silhueta do próprio rei tingida com a cor do eco, atrás dele
    drawBehind(ctx, e) {
      if (!e.echo || !e.atk || e.atk.phase === 'rec') return;
      const k = e.atk.phase === 'wind' ? Math.min(1, e.atk.t / e.atk.s.wind) : 1;
      VS.EnemyRender.ghost(ctx, e, ECHO_COL[e.echo], (e.echo === 'corvin' || e.echo === 'ozias' ? 0.2 : 0.3) * k, -e.facing * (10 + 14 * k), -4 * k);
    },
    onPhase(e, g) {
      A.sfx('roar'); G.addShake(0.6); e.cool = 0.3;
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
  // O ECO DE SERAPHINE — chefe secreto (final 3): devolve a luz com parries
  // ======================================================================
  B.def('seraphine', {
    cfg: { w: 30, h: 64, hp: 1000, music: 'b_seraphine', flying: true, phases: [0.6, 0.3], introTime: 2.4, heavy: true },
    attacks: {
      burst: { wind: 0.8, act: 0.1, rec: 0.7, tell: null, sfx: 'light', onAct(e, g) { const n = 10 + e.phase * 4; const off = Math.random(); for (let i = 0; i < n; i++) { const a = (i + off) / n * U.TAU; g.spawn(P({ x: e.cx, y: e.cy, vx: Math.cos(a) * 120, vy: Math.sin(a) * 120, w: 12, h: 12, dmg: 14, kind: 'light', color: '#fff0c0', life: 5, solid: false, reflectable: true, isLight: true })); } e.count++; } },
      lance: { wind: 0.6, act: 0.6, rec: 0.5, tell: 'white', sfx: 'light', during(e, g) { const a = e.atk; const k = Math.floor(a.t / 0.2); if (k !== a.k && k < 3) { a.k = k; const p = g.player; const ang = Math.atan2(p.cy - e.cy, p.cx - e.cx); g.spawn(P({ x: e.cx, y: e.cy, vx: Math.cos(ang) * 230, vy: Math.sin(ang) * 230, w: 14, h: 14, dmg: 16, kind: 'light', color: '#fff8e0', life: 4, solid: false, reflectable: true, isLight: true })); A.sfx('chime'); } }, onEnd(e) { e.count++; } },
      embrace: { wind: 0.8, act: 0.9, rec: 0.6, tell: 'red', sfx: 'wind', onAct(e, g) { const p = g.player; const a = Math.atan2(p.cy - e.cy, p.cx - e.cx); e.vx = Math.cos(a) * 360; e.vy = Math.sin(a) * 360; }, during(e) { e.attackHBs.push({ x: e.x, y: e.y, w: e.w, h: e.h, dmg: 26, id: e.atk.id, unblockable: true, parryable: false, src: e }); }, onEnd(e) { e.vx *= 0.2; e.vy *= 0.2; e.count++; } },
      beams: { wind: 0.3, act: 1.3, rec: 0.5, tell: null, sfx: 'chime', onAct(e, g) { const p = g.player; e.plX = [p.cx, p.cx - 90, p.cx + 90]; }, during(e, g) { columns(e, g, e.plX, { warn: 0.8, h: 300, w: 12, dmg: 18, sfx: 'light', warnCol: '#ffffff', cols: ['#ffffff', '#fff0c0'] }); }, onEnd(e) { e.count++; } },
    },
    sheetAnchor: 'center',
    // apagada: animação própria (encolhida, cinzenta) enquanto dura a janela para lhe bater
    animState(e) { return e.dim > 0 && !e.defeated ? { anim: 'dim' } : null; },
    init(e) { e.count = 0; e.dim = 0; },
    think(e, dt, g) {
      const p = g.player;
      if (e.dim > 0) { e.dim -= dt; e.vx *= 0.9; e.vy = U.approach(e.vy, 30, 100 * dt); e.y = Math.min(e.y, e.arena.floor - e.h - 4); return; }
      if (e.atk) { if (e.atk.phase === 'wind') { e.vx *= 0.9; e.vy *= 0.9; } return; }
      e.face();
      e.fly(g.room.pw / 2 + Math.sin(e.anim * 0.5) * 160, e.arena.floor - 150 + Math.sin(e.anim) * 30, 120, dt, 0.04);
      if (e.count >= 4 - Math.min(1, e.phase)) { e.count = 0; e.dim = 3.2; A.sfx('choir_hit'); VS.UI.toast(VS.t('tip_seraphine_dim'), 2); return; }
      if (e.cool <= 0) { const r = Math.random(); e.attack(r < 0.3 ? 'burst' : r < 0.6 ? 'lance' : r < 0.8 ? 'beams' : 'embrace'); e.cool = 0.6 - e.phase * 0.15; }
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
