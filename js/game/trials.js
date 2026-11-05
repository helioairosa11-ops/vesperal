// Vesperal — Torre das Provações: provas de esquiva (padrões a aguentar até ao fim), ecos dos guardiões (os chefes outra
// vez, mais duros, nas salas deles) e a missão dos Sinos Perdidos. Também a Nova Partida+.
'use strict';
(function (VS) {
  const U = VS.U, T = U.TILE, G = VS.Gfx, A = VS.Audio;
  const TR = {};
  TR.ROOM = 'r1_trials';
  TR.HOME = 'r1_sanct';
  const t = (k, o) => VS.t(k, o);
  const data = () => { const st = VS.state; return st.flags.trials || (st.flags.trials = { dodge: {}, echoes: {}, bells: 0 }); };

  // ---------- provas de esquiva: sequências de padrões dos chefes (a voz da torre lança-os) ----------
  const S = (VS.Patterns && VS.Patterns.SPEC) || {};
  const AL = (S.aldric || []);
  TR.DODGE = [
    { id: 1, phase: 0, seq: ['coveiro', 'matilheira', 'mariposa', 'caedmon', 'sineiro', 'automato'] },
    { id: 2, phase: 1, seq: ['hilde', 'vael', 'corvin', 'elowen', 'carpideira', 'gemeo_a', 'ozias', 'mariposa'] },
    { id: 3, phase: 2, seq: ['ozias', 'vael', 'sineiro', 'aldric:0', 'corvin', 'aldric:1', 'hilde', 'aldric:2', 'carpideira', 'aldric:4'] },
  ];
  TR.DODGE_REWARD = { 1: { ash: 1000, items: [['oil', 2]] }, 2: { ash: 1500, items: [['candle_fragment', 1]] }, 3: { ash: 2500, items: [['ash_heart', 1]] } };
  const specOf = (k) => { if (k.startsWith('aldric:')) return AL[+k.split(':')[1]] || AL[0]; return S[k]; };

  // a Voz da torre: um olho de luz no alto que lança os padrões, um atrás do outro
  class TrialVoice extends VS.Entity {
    constructor(game, tier) {
      const fl = TR.floor(game);
      super(game.room.pw / 2 - 10, fl - 170, 20, 20);
      this.tier = tier; this.idx = -1; this.wait = 1.6; this.patRun = null; this.attackHBs = []; this.colXs = null; this.z = 6; this.drawAlways = true;
      this.arena = { x0: T * 2, x1: game.room.pw - T * 2, floor: fl };
      this.phase = tier.phase; this.dmgScale = 1 + tier.phase * 0.1; this.flying = true; this.anim = 0; this.hits = 0; this.lastHp = VS.state.hp; this.isVoice = true;
    }
    update(dt, game) {
      super.update(dt, game);
      this.anim += dt; this.attackHBs = [];
      const st = VS.state; if (st.hp < this.lastHp) this.hits++; this.lastHp = st.hp;
      if (this.patRun) {
        VS.Patterns.tick(this, game, dt, this.patRun);
        if (this.patRun.t >= this.patRun.dur) { this.patRun = null; this.colXs = null; this.wait = 0.9 - this.tier.phase * 0.2; }
        return;
      }
      this.wait -= dt; if (this.wait > 0) return;
      this.idx++;
      if (this.idx >= this.tier.seq.length) { this.remove = true; TR.dodgeWon(game, this.tier, this.hits); return; }
      const spec = specOf(this.tier.seq[this.idx]);
      A.sfx('danger_tell', { vol: 0.6 }); VS.FX.flare(this.cx, this.cy, 30, [200, 220, 255], 0.35);
      this.patRun = VS.Patterns.start(this, game, spec);
    }
    emitLight() { G.light(this.cx, this.cy, 90, '#c8d8ff', 0.8, 1); }
    draw(ctx) {
      const x = this.cx, y = this.cy + Math.sin(this.anim * 2) * 4, k = this.patRun ? 1 : 0.6;
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      VS.Sprites.glow(ctx, x, y, 26, '#a8c0ff', 0.6 * k);
      ctx.strokeStyle = `rgba(220,230,255,${0.7 * k})`; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.ellipse(x, y, 12, 6, 0, 0, U.TAU); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.95)'; ctx.beginPath(); ctx.arc(x, y, 3, 0, U.TAU); ctx.fill();
      for (let i = 0; i < 8; i++) { const a = this.anim * 0.8 + i / 8 * U.TAU; ctx.fillStyle = 'rgba(200,215,255,0.5)'; ctx.fillRect(x + Math.cos(a) * 20 - 1, y + Math.sin(a) * 12 - 1, 2, 2); }
      ctx.restore();
      if (VS.SpritesBoss && VS.SpritesBoss.overlays) VS.SpritesBoss.overlays(ctx, this);
    }
  }
  TR.floor = function (game) {
    const r = game.room, x = Math.floor(game.room.pw / 2 / T);
    for (let y = 4; y < r.h - 1; y++) if (!r.isSolidTile(x, y) && r.isSolidTile(x, y + 1)) return (y + 1) * T;
    return (r.h - 3) * T;
  };

  // ---------- ecos: os chefes outra vez, mais duros (vida ×1,5, mais agressivos), nas salas deles ----------
  TR.bossRoom = function (id) {
    for (const rid in VS.ROOMS) { const d = (VS.ROOMS[rid].ents || []).find((e) => e.t === 'boss' && e.boss === id); if (d) return { room: rid, d }; }
    return null;
  };
  TR.ECHO_MILESTONES = { 4: [['relic_slot', 1]], 8: [['r_echo_crown', 1]], 12: [['ash_heart', 1]], 16: [['candle_fragment', 1]] };
  TR.startEcho = function (game, id) {
    VS.UI.closeAll(); VS.App.paused = false;
    game.trial = { kind: 'echo', boss: id };
    const br = TR.bossRoom(id);
    game.fade = 1; game.fadeTarget = 0;
    if (br) {
      const d = br.d; game.loadRoom(br.room);
      const r = game.room, trig = d.trigger !== undefined ? d.trigger : d.x, tx = d.fromRight ? trig - 3 : trig + 3;
      let ty = 4; for (let y = 4; y < r.h - 1; y++) if (!r.isSolidTile(tx, y) && !r.isSolidTile(tx, y - 1) && (r.isSolidTile(tx, y + 1) || r.tile(tx, y + 1) === '=')) { ty = y; if (d.floor === undefined || y + 1 >= d.floor) break; }
      const p = game.player; p.x = tx * T + T / 2 - p.w / 2; p.y = (ty + 1) * T - p.h - 1; p.vx = 0; p.vy = 0; p.facing = d.fromRight ? -1 : 1;
      game.ents = game.ents.filter((e) => !e.isEnemy || e.isBoss);
      VS.Bosses.spawn(d, game);
    } else {
      // sem sala própria (o Eco de Seraphine, a Carpideira): a arena da torre
      game.loadRoom(TR.ROOM, { x: 6 * T, y: TR.floor(game) - 40 });
      const p = game.player, fl = TR.floor(game);
      VS.Bosses.spawn({ boss: id, x: Math.floor(p.cx / T) + 9, y: Math.floor(fl / T) - (id === 'seraphine' ? 4 : 1), floor: Math.floor(fl / T) }, game);
    }
    VS.UI.toast(t('echo_start', { name: t('boss_' + id) }), 3.5);
  };
  // vencido um eco: recompensa da primeira vez e regresso à torre (sem as recompensas nem a história do combate original)
  TR.echoWon = function (game, id) {
    const D = data(), first = !D.echoes[id];
    D.echoes[id] = true;
    const n = Object.keys(D.echoes).length, st = VS.state;
    if (first) { st.ash += 700; VS.UI.toast(t('echo_won_first', { name: t('boss_' + id), n, m: VS.LORE.bosses.length }), 5); }
    else VS.UI.toast(t('echo_won', { name: t('boss_' + id) }), 4);
    if (first && TR.ECHO_MILESTONES[n]) TR.give(TR.ECHO_MILESTONES[n]);
    game.save();
    setTimeout(() => TR.back(game), 3200);
  };
  TR.back = function (game) {
    game.trial = null;
    if (VS.App.game !== game) return;
    game.fade = 1; game.fadeTarget = 0;
    game.loadRoom(TR.ROOM, { x: 9 * T, y: TR.floor(game) - 40 });
    const st = VS.state; st.hp = st.hpMax; st.flasks = st.flasksMax;
    game.setRegionAudio && game.setRegionAudio();
    game.save();
  };
  TR.give = function (list) {
    const st = VS.state;
    list.forEach(([id, n], i) => setTimeout(() => { st.give(id, n); VS.UI.itemGet(id, n || 1); A.sfx('pickup_big'); }, 600 + i * 1500));
  };

  // ---------- provas de esquiva ----------
  TR.startDodge = function (game, tier) {
    VS.UI.closeAll(); VS.App.paused = false;
    game.trial = { kind: 'dodge', tier: tier.id };
    game.ents.filter((e) => e.isVoice).forEach((e) => { e.remove = true; });
    const p = game.player; p.x = game.room.pw / 2 - 60; p.vx = 0;
    game.spawn(new TrialVoice(game, tier));
    VS.UI.toast(t('trial_start', { name: t('trials_dodge_' + tier.id) }), 4);
    A.playMusic('b_custodio', { fade: 0.6, restart: true });
  };
  TR.dodgeWon = function (game, tier, hits) {
    const D = data(), first = !D.dodge[tier.id], st = VS.state;
    D.dodge[tier.id] = true; game.trial = null;
    A.sfx('pickup_big'); G.flash('#e0e8ff', 0.3);
    if (first) { const R = TR.DODGE_REWARD[tier.id]; st.ash += R.ash; TR.give(R.items); VS.UI.toast(t('trial_won_first', { name: t('trials_dodge_' + tier.id), n: hits }), 5); }
    else { st.ash += 200; VS.UI.toast(t('trial_won', { name: t('trials_dodge_' + tier.id), n: hits }), 4); }
    st.hp = st.hpMax; st.flasks = st.flasksMax;
    game.setRegionAudio && game.setRegionAudio();
    game.save();
  };
  // morrer numa prova não custa cinza: volta-se à torre
  TR.onDeath = function (game) {
    game.trial = null;
    VS.UI.showDeath(() => {
      const st = VS.state; st.hp = st.hpMax; st.flasks = st.flasksMax;
      game.player = null; game.musicLock = false;
      game.loadRoom(TR.ROOM, { x: 9 * T, y: TR.floor(game) - 40 });
      game.fade = 1; game.fadeTarget = 0; game.save();
    });
  };

  // ---------- os Sinos Perdidos: seis sinos escondidos em salas secretas; devolvê-los à torre ----------
  TR.BELLS = 6;
  TR.BELL_REWARDS = { 3: [['r_tower_bell', 1]], 6: [['ash_heart', 1], ['relic_slot', 1]] };
  TR.returnBells = function (game) {
    const st = VS.state, D = data(), n = st.count('lost_bell');
    if (!n) return;
    st.take('lost_bell', n);
    const before = D.bells; D.bells += n; st.ash += 300 * n;
    A.sfx('bell'); VS.UI.toast(t('msg_bells_returned', { n: D.bells, m: TR.BELLS }), 4.5);
    for (const k in TR.BELL_REWARDS) if (before < +k && D.bells >= +k) TR.give(TR.BELL_REWARDS[k]);
    game.save();
  };

  // ---------- o Sino das Provações (menu da torre) ----------
  TR.menu = function (game) {
    const st = VS.state, D = data(), UI = VS.UI;
    VS.App.paused = true;
    const close = (p) => () => { UI.close(p); if (!UI.isOpen()) VS.App.paused = false; };
    const items = [
      { label: t('trials_dodge'), action: () => TR.menuDodge(game) },
      { label: t('trials_echoes', { n: Object.keys(D.echoes).length, m: VS.LORE.bosses.length }), action: () => TR.menuEchoes(game) },
      { label: t('trials_bells', { n: D.bells, m: TR.BELLS, have: st.count('lost_bell') }), action: () => { TR.returnBells(game); UI.closeAll(); VS.App.paused = false; } },
    ];
    const p = UI.menu({ cls: 'smith', title: t('trials_title'), text: t('trials_text'), items: items.concat([{ label: t('back'), action: () => close(p)() }]), onBack: () => close(p)(), onClose: () => { if (!UI.isOpen()) VS.App.paused = false; } });
  };
  TR.menuDodge = function (game) {
    const D = data(), UI = VS.UI;
    const p = UI.menu({ cls: 'smith', title: t('trials_dodge'), text: t('trials_dodge_text'), items: TR.DODGE.map((tier) => ({ label: t('trials_dodge_' + tier.id) + (D.dodge[tier.id] ? ' ✓' : ''), action: () => TR.startDodge(game, tier) })).concat([{ label: t('back'), action: () => UI.close(p) }]), onBack: () => UI.close(p) });
  };
  TR.menuEchoes = function (game) {
    const st = VS.state, D = data(), UI = VS.UI;
    const won = VS.LORE.bosses.filter((b) => st.bosses[b]);
    const items = won.length ? won.map((b) => ({ label: t('boss_' + b) + (D.echoes[b] ? ' ✓' : ''), action: () => TR.startEcho(game, b) })) : [{ label: t('trials_echo_none'), action: () => {} }];
    const p = UI.menu({ cls: 'smith', title: t('trials_echoes_title'), text: t('trials_echo_text'), items: items.concat([{ label: t('back'), action: () => UI.close(p) }]), onBack: () => UI.close(p) });
  };

  // ---------- objetos: o portal (Santuário ↔ Torre) e o Sino das Provações ----------
  class TrialGate extends VS.Entity {
    constructor(d) { super(d.x * T - 14, (d.y + 1) * T - 46, 28, 46); this.to = d.to; this.interactable = true; this.range = 30; this.z = -1; this.t0 = Math.random() * 10; }
    promptKey() { return this.to === TR.ROOM ? 'act_enter_trials' : 'act_leave_trials'; }
    interact(game) {
      A.sfx('door'); game.fade = 1; game.fadeTarget = 0;
      if (this.to === TR.ROOM) { game.loadRoom(TR.ROOM, { x: 5 * T, y: TR.floor(game) - 40 }); if (!VS.state.flags.trials_seen) { VS.state.flags.trials_seen = 1; VS.UI.toast(t('trials_welcome'), 6); } }
      else { const R = VS.ROOMS[this.to], gd = (R.ents || []).find((e) => e.t === 'trialgate'); game.loadRoom(this.to, gd ? { x: (gd.x + 2) * T, y: gd.y * T } : undefined); }
      game.save();
    }
    update(dt) { super.update(dt); this.t0 += dt; if (Math.random() < 0.3) G.emit({ x: this.cx + U.rand(-10, 10), y: this.y + U.rand(10, 40), vx: 0, vy: U.rand(-20, -5), life: 1, size: U.rand(0.6, 1.4), color: '#c8d8ff', add: true, shrink: true }); }
    emitLight() { G.light(this.cx, this.y + 22, 60, '#b8c8ff', 0.7, 1); }
    draw(ctx) {
      const x = this.cx, b = this.bottom, top = this.y, k = 0.75 + 0.25 * Math.sin(this.t0 * 2);
      ctx.save();
      ctx.fillStyle = '#2a2630'; ctx.fillRect(x - 15, top + 8, 5, b - top - 8); ctx.fillRect(x + 10, top + 8, 5, b - top - 8);
      ctx.beginPath(); ctx.moveTo(x - 15, top + 10); ctx.quadraticCurveTo(x, top - 8, x + 15, top + 10); ctx.lineTo(x + 10, top + 12); ctx.quadraticCurveTo(x, top - 1, x - 10, top + 12); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#4a4452'; ctx.fillRect(x - 16, b - 3, 32, 3);
      ctx.globalCompositeOperation = 'lighter';
      const g = ctx.createLinearGradient(0, top + 10, 0, b); g.addColorStop(0, `rgba(180,200,255,${0.55 * k})`); g.addColorStop(1, `rgba(120,140,255,${0.15 * k})`);
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x - 10, b - 3); ctx.lineTo(x - 10, top + 12); ctx.quadraticCurveTo(x, top - 1, x + 10, top + 12); ctx.lineTo(x + 10, b - 3); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = `rgba(230,236,255,${0.7 * k})`; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.arc(x, top + 24, 5 + Math.sin(this.t0 * 3), 0, U.TAU); ctx.stroke();
      ctx.restore();
    }
  }
  class TrialBell extends VS.Entity {
    constructor(d) { super(d.x * T - 16, (d.y + 1) * T - 56, 32, 56); this.interactable = true; this.range = 34; this.z = -1; this.sw = 0; this.t0 = 0; }
    promptKey() { return 'act_trial_bell'; }
    interact(game) { A.sfx('bell'); this.sw = 1; TR.menu(game); }
    update(dt) { super.update(dt); this.t0 += dt; this.sw = Math.max(0, this.sw - dt * 0.6); }
    emitLight() { G.light(this.cx, this.y + 20, 70, '#ffd890', 0.6, 1); }
    draw(ctx) {
      const x = this.cx, top = this.y, b = this.bottom, a = Math.sin(this.t0 * 6) * 0.25 * this.sw;
      ctx.save();
      ctx.fillStyle = '#3a2a22'; ctx.fillRect(x - 16, top, 4, b - top); ctx.fillRect(x + 12, top, 4, b - top); ctx.fillRect(x - 18, top, 36, 4);
      ctx.translate(x, top + 4); ctx.rotate(a);
      const g = ctx.createLinearGradient(-12, 0, 12, 0); g.addColorStop(0, '#6a4a22'); g.addColorStop(0.45, '#d8a850'); g.addColorStop(1, '#5a3a18');
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(-4, 2); ctx.quadraticCurveTo(-10, 6, -10, 18); ctx.quadraticCurveTo(-11, 26, -14, 30); ctx.lineTo(14, 30); ctx.quadraticCurveTo(11, 26, 10, 18); ctx.quadraticCurveTo(10, 6, 4, 2); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#2a1a0c'; ctx.lineWidth = 0.8; ctx.stroke();
      ctx.fillStyle = '#f0d090'; ctx.fillRect(-12, 26, 24, 1.5);
      ctx.fillStyle = '#2a1a0c'; ctx.beginPath(); ctx.arc(0, 31, 2.4, 0, U.TAU); ctx.fill();
      ctx.restore();
      // os sinos devolvidos, pendurados na trave
      const n = (VS.state.flags.trials && VS.state.flags.trials.bells) || 0;
      for (let i = 0; i < TR.BELLS; i++) { const bx = x - 15 + i * 6, by = top + 8; ctx.fillStyle = i < n ? '#e8c070' : 'rgba(60,50,40,0.6)'; ctx.beginPath(); ctx.moveTo(bx - 2, by + 5); ctx.quadraticCurveTo(bx, by - 1, bx + 2, by + 5); ctx.closePath(); ctx.fill(); }
    }
  }
  VS.Obj.custom.trialgate = (d) => new TrialGate(d);
  VS.Obj.custom.trialbell = (d) => new TrialBell(d);

  // ---------- Nova Partida+: recomeça a história com o que se ganhou; inimigos e chefes mais fortes ----------
  TR.newGamePlus = function (slot) {
    const d = VS.Save.read(slot); if (!d) return;
    const old = new VS.GameState(); old.load(d);
    const st = new VS.GameState();
    const keep = ['weapon', 'weaponId', 'weapons', 'relics', 'equipped', 'relicSlots', 'hearts', 'fragments', 'ash', 'look'];
    keep.forEach((k) => { st[k] = U.deepClone(old[k]); });
    st.abilities = Object.assign({}, old.abilities);
    for (const id in old.items) { const it = VS.ITEMS[id]; if (it && (it.cat === 'consumable' || id === 'ash_steel')) st.items[id] = old.items[id]; }
    for (const k in old.flags) if (k.startsWith('look_') || k === 'trials' || k === 'trials_seen' || k.startsWith('tip_')) st.flags[k] = U.deepClone(old.flags[k]);
    st.ngp = (old.ngp || 0) + 1;
    st.hp = st.hpMax; st.flasks = st.flasksMax;
    VS.slot = slot;
    VS.App.startGame(st, true);
  };
  TR.hasEnding = (d) => !!(d && d.flags && (d.flags.ending_end1 || d.flags.ending_end2 || d.flags.ending_end3));

  VS.Trials = TR;
})(window.VS);
