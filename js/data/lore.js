// Vesperal — índices da narrativa: inscrições, crónicas do Diário, chefes, e critérios de conclusão (100 %)
'use strict';
(function (VS) {
  const L = {};
  // 35 inscrições por ordem de região + pistas de fraquezas de chefes (i36…)
  L.inscriptions = [];
  for (let i = 1; i <= 44; i++) L.inscriptions.push('i' + String(i).padStart(2, '0'));
  // crónicas: aparecem no Diário quando a condição se cumpre
  L.chronicles = [
    { key: 'chr_awake', cond: () => true },
    { key: 'chr_ione', cond: (s) => s.flags.met_ione },
    { key: 'chr_ember1', cond: (s) => s.bosses.caedmon },
    { key: 'chr_ember2', cond: (s) => s.bosses.hilde },
    { key: 'chr_hrolf', cond: (s) => s.flags.hrolf_told !== undefined },
    { key: 'chr_ember3', cond: (s) => s.bosses.elowen },
    { key: 'chr_teodoro', cond: (s) => s.flags.teodoro_choice !== undefined },
    { key: 'chr_ember4', cond: (s) => s.bosses.corvin },
    { key: 'chr_ember5', cond: (s) => s.bosses.ozias },
    { key: 'chr_chalice', cond: (s) => s.flags.chalice_choice !== undefined },
    { key: 'chr_letters', cond: (s) => s.letters >= 3 },
    { key: 'chr_ember6', cond: (s) => s.bosses.aldric },
    { key: 'chr_end1', cond: (s) => (VS.Save.loadProfile().endings || []).includes('end1') },
    { key: 'chr_end2', cond: (s) => (VS.Save.loadProfile().endings || []).includes('end2') },
    { key: 'chr_end3', cond: (s) => (VS.Save.loadProfile().endings || []).includes('end3') },
  ];
  L.bosses = ['coveiro', 'matilheira', 'caedmon', 'automato', 'hilde', 'mariposa', 'elowen', 'sineiro', 'corvin', 'vael', 'ozias', 'gemeos', 'aldric', 'seraphine', 'carpideira'];

  // critérios para a percentagem de conclusão
  const C = [];
  L.inscriptions.forEach((id) => C.push((s) => !!s.inscriptions[id]));
  ['letter_1', 'letter_2', 'letter_3'].forEach((id) => C.push((s) => s.has(id)));
  L.bosses.forEach((b) => C.push((s) => !!s.bosses[b]));
  ['dash', 'spell', 'wall', 'forge', 'double', 'veil'].forEach((a) => C.push((s) => !!s.abilities[a]));
  for (let i = 1; i <= 5; i++) C.push((s) => s.hearts >= i);
  for (let i = 1; i <= 4; i++) C.push((s) => s.fragments >= i);
  for (let i = 1; i <= 5; i++) C.push((s) => s.weapon >= i);
  for (let i = 1; i <= 10; i++) C.push((s) => s.relics.length >= i);
  C.push((s) => s.quests.hrolf >= 50);
  C.push((s) => s.quests.maren >= 50);
  C.push((s) => s.quests.teodoro >= 50);
  ['end1', 'end2', 'end3'].forEach((e) => C.push(() => (VS.Save.loadProfile().endings || []).includes(e)));
  VS.COMPLETION = { keys: C };
  VS.LORE = L;
})(window.VS);
