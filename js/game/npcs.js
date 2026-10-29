// Vesperal — personagens: Ione, Hrolf, Maren, Teodoro (diálogos que evoluem, escolhas com consequências)
'use strict';
(function (VS) {
  const U = VS.U, A = VS.Audio, UI = () => VS.UI;
  const N = {};
  const L = (s, k, p) => ({ s, k, p });
  const say = (g, lines, choices, cb) => { g.cutscene = true; VS.UI.dialogue(lines, choices, (c) => { g.cutscene = false; if (cb) cb(c); }); };

  // ======================================================================
  // IONE — a filha cega da rainha, no Santuário
  // ======================================================================
  N.ione = {
    light: ['#ffd8a0', 70],
    talk(g, npc) {
      const st = VS.state, I = (k, p) => L('npc_ione', k, p);
      if (st.bosses.aldric && !st.ending && g.room.id === 'r7_throne') { VS.Story.finalTalk(g); return; }
      if (!st.flags.met_ione) { VS.Story.meetIone(g); return; }
      // entregar brasas novas
      const newEmbers = [];
      for (let i = 1; i <= 6; i++) if (st.has('ember_' + i) && !st.flags['ember_given_' + i]) newEmbers.push(i);
      if (newEmbers.length) {
        const lines = [];
        newEmbers.forEach((i) => { lines.push(I('ione_ember' + i)); });
        say(g, lines, null, () => {
          newEmbers.forEach((i) => { st.flags['ember_given_' + i] = true; });
          A.sfx('choir_hit'); VS.Gfx.flash('#ffc070', 0.3);
          let given = 0; for (let i = 1; i <= 6; i++) if (st.flags['ember_given_' + i]) given++;
          if (!st.abilities.spell) {
            say(g, [I('ione_spell1'), I('ione_spell2')], null, () => { st.abilities.spell = true; st.lume = 100; VS.UI.itemGet('ab_spell'); A.sfx('pickup_big'); VS.UI.toast(VS.t('tut_spell'), 6); g.save(); });
          } else if (given >= 3 && !st.flags.ione_ribbon) {
            say(g, [I('ione_ribbon')], null, () => { st.flags.ione_ribbon = true; st.give('r_ione_ribbon'); VS.UI.itemGet('r_ione_ribbon'); A.sfx('pickup_big'); g.save(); });
          } else g.save();
        });
        return;
      }
      // as três cartas: condição do terceiro final
      if (st.letters >= 3 && !st.flags.ione_letters) {
        say(g, [I('ione_letters_ask')], ['opt_read_letters', 'opt_not_now'], (c) => {
          if (c === 0) say(g, [I('ione_letters1'), I('ione_letters2'), I('ione_letters3'), I('ione_letters4')], null, () => { st.flags.ione_letters = true; g.save(); A.sfx('secret'); });
        });
        return;
      }
      // orientação conforme o progresso (nunca repete o mesmo despejo de história)
      let k;
      if (!st.abilities.dash) k = 'ione_hint_dash';
      else if (!st.bosses.caedmon) k = 'ione_hint_r2';
      else if (!st.bosses.hilde) k = 'ione_hint_r3';
      else if (!st.bosses.elowen) k = 'ione_hint_r4';
      else if (!st.bosses.corvin) k = 'ione_hint_r5';
      else if (!st.bosses.ozias) k = 'ione_hint_r6';
      else if (!st.bosses.aldric) k = st.flags.ione_letters ? 'ione_hint_r7b' : 'ione_hint_r7';
      else k = 'ione_hint_end';
      const extra = st.letters > 0 && st.letters < 3 ? [I('ione_letters_some', { n: st.letters })] : [];
      say(g, [I(k)].concat(extra));
    },
  };

  // ======================================================================
  // HROLF — aprendiz de Hilde, ferreiro; verdade ou mentira sobre a mestra
  // ======================================================================
  N.hrolf = {
    light: ['#ff9040', 60],
    talk(g, npc) {
      const st = VS.state, H = (k, p) => L('npc_hrolf', k, p);
      const q = st.quests;
      if (q.hrolf === 0) { say(g, [H('hrolf_meet1'), H('hrolf_meet2'), H('hrolf_meet3')], null, () => { q.hrolf = 1; g.save(); }); return; }
      // a decisão: o que dizer sobre Hilde
      if (st.has('hilde_hammer') && q.hrolf < 50) {
        say(g, [H('hrolf_hammer1'), H('hrolf_hammer2')], ['opt_truth', 'opt_lie'], (c) => {
          st.take('hilde_hammer');
          if (c === 0) { q.hrolf = 50; st.flags.hrolf_told = 'truth'; say(g, [H('hrolf_truth1'), H('hrolf_truth2'), H('hrolf_truth3')], null, () => { st.give('r_hilde_blade'); VS.UI.itemGet('r_hilde_blade'); g.save(); }); }
          else { q.hrolf = 60; st.flags.hrolf_told = 'lie'; say(g, [H('hrolf_lie1'), H('hrolf_lie2')], null, () => { npc.remove = true; g.save(); }); }
        });
        return;
      }
      // remendar o cálice (condição do segundo final)
      if (q.hrolf === 50 && st.has('chalice') && !st.has('chalice_mended')) {
        say(g, [H('hrolf_chalice1'), H('hrolf_chalice2')], ['opt_mend', 'opt_not_now'], (c) => {
          if (c === 0) { st.take('chalice'); st.give('chalice_mended'); VS.UI.itemGet('chalice_mended'); A.sfx('crush'); g.save(); }
        });
        return;
      }
      const maxLevel = q.hrolf === 50 ? 5 : 3;
      const greet = q.hrolf === 50 ? 'hrolf_greet_after' : (st.bosses.hilde ? 'hrolf_greet_wait' : 'hrolf_greet');
      say(g, [H(greet)], ['opt_upgrade', 'opt_talk', 'opt_leave'], (c) => {
        if (c === 0) VS.Menus.smith(g, maxLevel);
        else if (c === 1) say(g, [H(q.hrolf === 50 ? 'hrolf_lore_after' : st.bosses.caedmon ? 'hrolf_lore2' : 'hrolf_lore1')]);
      });
    },
  };

  // ======================================================================
  // MAREN — peregrina e mercadora; procura o irmão Teodoro
  // ======================================================================
  N.maren = {
    light: ['#ffd090', 60],
    stock() {
      const st = VS.state;
      const s = [{ id: 'salt', price: 80 }, { id: 'oil', price: 140 }, { id: 'incense', price: 140 }, { id: 'feather', price: 60 },
        { id: 'r_heron', price: 1500, unique: true }, { id: 'r_anchor', price: 1800, unique: true }, { id: 'r_amber', price: 1400, unique: true }];
      if (!st.flags.bought_ash_steel) s.push({ id: 'ash_steel', price: 900, unique: true });
      if (st.quests.maren >= 2) s.push({ id: 'w_alabarda', price: 2200, unique: true });
      if (st.quests.maren >= 50) { s.push({ id: 'relic_slot', price: 2500, unique: true }); s.push({ id: 'r_hairshirt', price: 2000, unique: true }); }
      return s;
    },
    talk(g, npc) {
      const st = VS.state, M = (k, p) => L('npc_maren', k, p), q = st.quests;
      if (q.maren === 0) {
        say(g, [M('maren_meet1'), M('maren_meet2'), M('maren_meet3')], null, () => { q.maren = 1; st.give('teodoro_medal'); VS.UI.itemGet('teodoro_medal'); g.save(); });
        return;
      }
      if (q.teodoro === 3 && q.maren < 50) {
        say(g, [M('maren_reunited1'), M('maren_reunited2')], null, () => { q.maren = 50; st.give('r_rosary'); VS.UI.itemGet('r_rosary'); g.save(); });
        return;
      }
      if (q.maren < 2 && st.embers >= 1) q.maren = 2;
      const greet = q.maren >= 50 ? 'maren_greet_after' : 'maren_greet';
      say(g, [M(greet)], ['opt_buy', 'opt_talk', 'opt_leave'], (c) => {
        if (c === 0) { VS.Menus.shop(g, () => N.maren.stock()); }
        else if (c === 1) say(g, [M(q.maren >= 50 ? 'maren_lore_after' : q.teodoro === 0 ? 'maren_lore1' : 'maren_lore2')]);
      });
    },
  };

  // ======================================================================
  // TEODORO — acólito de Ozias, escondido nos Jardins; escolha irreversível
  // ======================================================================
  N.teodoro = {
    light: ['#c0d8ff', 50],
    talk(g, npc) {
      const st = VS.state, D = (k, p) => L('npc_teodoro', k, p), q = st.quests;
      if (q.teodoro === 3) { // reunido no Santuário
        if (!st.has('ossuary_key') && !st.flags.got_ossuary_key) { say(g, [D('teo_key1'), D('teo_key2')], null, () => { st.give('ossuary_key'); st.flags.got_ossuary_key = true; VS.UI.itemGet('ossuary_key'); g.save(); }); return; }
        if (st.bosses.ozias && q.teodoro < 50) { say(g, [D('teo_truth1'), D('teo_truth2'), D('teo_truth3')], null, () => { q.teodoro = 50; g.save(); }); return; }
        say(g, [D(st.bosses.ozias ? 'teo_after' : 'teo_wait')]);
        return;
      }
      if (q.teodoro === 0) { q.teodoro = 1; }
      if (!st.has('teodoro_medal')) { say(g, [D('teo_meet1'), D('teo_meet2'), D('teo_nomedal')], null, () => g.save()); return; }
      say(g, [D('teo_meet1'), D('teo_medal1'), D('teo_medal2'), D('teo_medal3')], ['opt_teo_sister', 'opt_teo_cathedral', 'opt_teo_stay'], (c) => {
        if (c === 0) { q.teodoro = 3; st.flags.teodoro_choice = 'sister'; st.take('teodoro_medal'); say(g, [D('teo_go_sister')], null, () => { npc.remove = true; g.save(); }); }
        else if (c === 1) { q.teodoro = 4; st.flags.teodoro_choice = 'cathedral'; st.take('teodoro_medal'); say(g, [D('teo_go_cathedral')], null, () => { npc.remove = true; g.save(); }); }
        else say(g, [D('teo_stay')]);
      });
    },
  };

  // ======================================================================
  // Corpos (consequências irreversíveis)
  // ======================================================================
  N.hrolf_body = {
    talk(g, npc) {
      const st = VS.state;
      say(g, [L(null, 'hrolf_body1'), L(null, 'hrolf_body2')], null, () => { st.flags.hrolf_body_found = true; st.give('r_hrolf_hammer'); VS.UI.itemGet('r_hrolf_hammer'); npc.interactable = false; g.save(); });
    },
  };
  N.teodoro_body = {
    talk(g, npc) {
      const st = VS.state;
      say(g, [L(null, 'teo_body1'), L(null, 'teo_body2'), L(null, 'teo_body3')], null, () => {
        st.flags.teo_body_found = true; st.quests.teodoro = 60; if (st.quests.maren < 90) st.quests.maren = 95;
        st.give('ossuary_key'); VS.UI.itemGet('ossuary_key'); npc.interactable = false; VS.UI.toast(VS.t('msg_maren_left'), 5); g.save();
      });
    },
  };

  VS.NPCS = N;
})(window.VS);
