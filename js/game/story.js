// Vesperal — história: introdução, Ione, recompensas dos chefes, falas finais, Última Chama, escolha final
'use strict';
(function (VS) {
  const U = VS.U, T = U.TILE, G = VS.Gfx, A = VS.Audio;
  const S = {};

  S.REWARDS = {
    coveiro: { ability: 'dash', ash: 300 },
    matilheira: { items: [['ash_heart', 1], ['w_navalhas', 1]], ash: 400 },
    caedmon: { items: [['ember_1', 1], ['r_captain', 1]], ability: 'wall', ash: 800 },
    automato: { items: [['relic_slot', 1], ['ash_steel', 2], ['w_malho', 1]], ash: 600 },
    hilde: { items: [['ember_2', 1], ['hilde_hammer', 1]], ability: 'forge', ash: 1000 },
    mariposa: { ability: 'double', ash: 600 },
    elowen: { items: [['ember_3', 1], ['candle_fragment', 1], ['elowen_lullaby', 1]], ash: 1100 },
    sineiro: { items: [['ash_heart', 1], ['helm_sino', 1]], ash: 800 },
    corvin: { items: [['ember_4', 1]], ability: 'veil', ash: 1300 },
    vael: { items: [['candle_fragment', 1], ['r_ember', 1]], ash: 1000 },
    ozias: { items: [['ember_5', 1]], ash: 1500 },
    gemeos: { items: [['ash_heart', 1], ['palace_seal', 1]], ash: 1200 },
    aldric: { items: [['ember_6', 1], ['w_montante', 1]] },
    seraphine: {},
    carpideira: { items: [['ash_heart', 1], ['candle_fragment', 1]], ash: 1600 },
  };

  // ---------- introdução (curta: a história revela-se aos poucos) ----------
  S.intro = function (g) {
    g.fade = 1; g.fadeTarget = 1; g.hideHUD = true;
    g.play([
      { music: 'intro' },
      { wait: 0.6 },
      { say: ['intro_1', 'intro_2', 'intro_3'] },
      // despertar: a imagem clareia sobre a protagonista caída; a brasa reacende e ela levanta-se
      { fn: (gg) => { gg.player.startWake(gg, 3.6, 1.2); gg.fadeTarget = 0; gg.wakeLight = 1; } },
      { wait: 3.6 },
      { fn: (gg) => { gg.hideHUD = false; gg.wakeLight = 0; } },
      { wait: 0.4 },
      { fn: (gg) => { gg.setRegionAudio(); VS.UI.toast(VS.t(VS.I18N.dev('hint_move')), 5); } },
    ]);
  };

  // ---------- Ione: primeiro encontro ----------
  S.meetIone = function (g) {
    if (VS.state.flags.met_ione) return;
    g.play([
      { wait: 0.3 },
      { music: 'event' },
      { say: [{ s: 'npc_ione', k: 'ione_meet1' }, { s: 'npc_ione', k: 'ione_meet2' }, { s: 'npc_ione', k: 'ione_meet3' }, { s: 'npc_ione', k: 'ione_meet4' }, { s: 'npc_ione', k: 'ione_meet5' }] },
      { fn: (gg) => { VS.state.flags.met_ione = true; gg.setRegionAudio(); VS.UI.toast(VS.t('hint_rest'), 5); gg.save(); } },
    ]);
  };

  // ---------- falas dos chefes depois do combate ----------
  const POST = {
    coveiro: null, matilheira: null, automato: null, mariposa: null, sineiro: null, vael: ['vael_post'], gemeos: ['gemeos_post'],
    caedmon: ['caedmon_post1', 'caedmon_post2'], hilde: ['hilde_post1', 'hilde_post2'], elowen: ['elowen_post1', 'elowen_post2'],
    corvin: ['corvin_post1', 'corvin_post2'], ozias: ['ozias_post1', 'ozias_post2'], aldric: ['aldric_post1', 'aldric_post2', 'aldric_post3'], seraphine: ['seraphine_post'], carpideira: ['carpideira_post'],
  };
  S.postLines = function (id) {
    const l = POST[id]; if (!l) return null;
    const sp = { gemeos: 'boss_gemeos', vael: 'boss_vael' }[id] || ('boss_' + id);
    return l.map((k) => ({ s: sp, k }));
  };

  // ---------- consequências após cada chefe ----------
  S.afterBoss = function (id, g) {
    const st = VS.state;
    if (id === 'ozias') {
      // a escolha do cálice
      setTimeout(() => {
        g.cutscene = true;
        VS.UI.dialogue([{ k: 'chalice_found' }], ['chalice_keep', 'chalice_shatter'], (c) => {
          g.cutscene = false;
          if (c === 0) { st.flags.chalice_choice = 'keep'; st.give('chalice'); VS.UI.itemGet('chalice'); }
          else { st.flags.chalice_choice = 'shatter'; st.give('r_chalice_shard'); VS.UI.itemGet('r_chalice_shard'); A.sfx('glass'); }
          g.save();
        });
      }, 3600);
    }
    if (id === 'aldric') setTimeout(() => S.finalScene(g), 3600);
    if (id === 'seraphine') setTimeout(() => VS.Endings.play('end3', g), 2500);
  };

  // ---------- a escolha final (sala do trono) ----------
  S.finalScene = function (g) {
    const st = VS.state;
    st.finalSave = true; g.save();
    g.play([
      { music: 'event' },
      { fn: (gg) => { if (!gg.ents.some((e) => e.nid === 'ione')) { const n = VS.Obj.make({ t: 'npc', id: 'ione', x: Math.floor(gg.player.cx / T) - 4, y: Math.floor((gg.player.bottom - 2) / T) }, 'final', gg); n.facing = 1; n.interactable = false; gg.spawn(n); } } },
      { wait: 1.2 },
      { say: [{ s: 'npc_ione', k: 'final_ione1' }, { s: 'npc_ione', k: 'final_ione2' }, { s: 'npc_ione', k: 'final_wait' }] },
    ], (gg) => {
      // a escolha fica nas mãos do jogador: pode sair com o Montante do Rei e voltar quando quiser
      const n = gg.ents.find((e) => e.nid === 'ione'); if (n) n.interactable = true;
      VS.UI.toast(VS.t('msg_final_ready'), 7); gg.save();
    });
  };
  // falar com Ione no trono depois de Aldric
  S.finalTalk = function (g) {
    g.cutscene = true;
    VS.UI.dialogue([{ s: 'npc_ione', k: 'final_ready_ask' }], ['opt_ready', 'opt_not_yet'], (c) => {
      g.cutscene = false;
      if (c === 0) S.finalChoice(g);
    });
  };
  S.finalChoice = function (g) {
    const st = VS.state;
    const opts = ['final_opt1'], map = ['end1'];
    if (st.has('chalice_mended')) { opts.push('final_opt2'); map.push('end2'); }
    if (st.flags.ione_letters && st.letters >= 3) { opts.push('final_opt3'); map.push('end3'); }
    g.cutscene = true;
    VS.UI.dialogue([{ s: 'npc_ione', k: 'final_ask' }], opts, (c) => {
      const e = map[Math.max(0, c)];
      g.cutscene = false;
      if (e === 'end3') S.awakenSeraphine(g);
      else VS.Endings.play(e, g);
    });
  };
  S.awakenSeraphine = function (g) {
    g.play([
      { say: [{ s: 'npc_ione', k: 'final_letters1' }, { s: 'npc_ione', k: 'final_letters2' }] },
      { flash: '#ffffff', shake: 0.6 },
      { fn: (gg) => { A.sfx('choir_hit'); } },
      { wait: 0.8 },
    ], (gg) => {
      const p = gg.player;
      VS.Bosses.spawn({ boss: 'seraphine', x: Math.floor(p.cx / T) + 6, y: Math.floor((p.bottom - 1) / T) - 3 }, gg);
    });
  };

  // ---------- a Última Chama (Santuário): cresce com cada brasa entregue ----------
  class LastFlame extends VS.Entity {
    constructor(d) { super(d.x * T - 20, d.y * T, 60, 100); this.z = -2; this.cur = 0; }
    get level() { let n = 0; for (let i = 1; i <= 6; i++) if (VS.state.flags['ember_given_' + i]) n++; return n; }
    update(dt) { super.update(dt); this.cur = U.approach(this.cur, this.level, dt * 0.8); if (Math.random() < 0.2 + this.cur * 0.15) G.emit({ x: this.cx + U.rand(-10, 10), y: this.y + 40, vx: U.rand(-15, 15), vy: U.rand(-80, -30), life: 1.4, size: U.rand(1, 2.2), color: U.pick(['#ffb040', '#ff7020', '#ffe0a0']), add: true, shrink: true }); }
    emitLight() { G.light(this.cx, this.y + 40, 70 + this.cur * 30, '#ffa040', 0.6 + this.cur * 0.07, 2); }
    draw(ctx) {
      const x = this.cx, base = this.y + 70, t = this.t, k = this.cur;
      // braseiro suspenso: três correntes juntam-se numa argola e uma só sobe até ao teto
      const top = this.y - 24, ring = base - 34, link = (x0, y0, x1, y1) => { const n = Math.max(2, Math.round(Math.hypot(x1 - x0, y1 - y0) / 3.2)); ctx.strokeStyle = '#3a3032'; ctx.lineWidth = 0.9; for (let i = 0; i < n; i++) { const u = (i + 0.5) / n; ctx.beginPath(); ctx.ellipse(x0 + (x1 - x0) * u, y0 + (y1 - y0) * u, i % 2 ? 0.7 : 1.3, 1.7, Math.atan2(y1 - y0, x1 - x0) + Math.PI / 2, 0, U.TAU); ctx.stroke(); } };
      for (const dx of [-20, 0, 20]) link(x + dx, base - 2, x, ring);
      link(x, ring, x, top);
      ctx.strokeStyle = '#6a5640'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(x, ring, 2.4, 0, U.TAU); ctx.stroke();
      ctx.fillStyle = '#1a1412'; ctx.beginPath(); ctx.moveTo(x - 22, base); ctx.lineTo(x + 22, base); ctx.lineTo(x + 14, base + 10); ctx.lineTo(x - 14, base + 10); ctx.fill();
      ctx.beginPath(); ctx.moveTo(x - 5, base + 10); ctx.lineTo(x + 5, base + 10); ctx.lineTo(x, base + 19); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#4a3a2a'; ctx.fillRect(x - 22, base - 2, 44, 3);
      const h = 10 + k * 7;
      for (let i = 0; i < 7; i++) {
        const fx = x - 15 + i * 5, hh = h * (0.6 + 0.4 * Math.sin(i * 1.7)) + Math.sin(t * 8 + i * 1.3) * 3 + (i === 3 ? h * 0.4 : 0);
        ctx.fillStyle = i % 2 ? '#ff7020' : '#ffb040';
        ctx.beginPath(); ctx.moveTo(fx - 3, base); ctx.quadraticCurveTo(fx - 2, base - hh * 0.6, fx + Math.sin(t * 6 + i) * 2, base - hh); ctx.quadraticCurveTo(fx + 3, base - hh * 0.6, fx + 3, base); ctx.fill();
      }
      VS.Sprites.glow(ctx, x, base - h * 0.5, 30 + k * 10, '#ff9030', 0.5);
      // seis encaixes das brasas
      for (let i = 1; i <= 6; i++) { const on = VS.state.flags['ember_given_' + i]; const ex = x - 25 + (i - 1) * 10; ctx.fillStyle = on ? '#ffb040' : '#2a2220'; ctx.beginPath(); ctx.arc(ex, base + 6, 2.2, 0, U.TAU); ctx.fill(); }
    }
  }
  VS.Obj.custom.lastflame = (d) => new LastFlame(d);

  VS.Story = S;
})(window.VS);
