// Vesperal — Região 1: Cidade Cinzenta (e Santuário da Última Chama, Ossário)
'use strict';
(function (VS) {
  const R = VS.room;

  // Fossa dos Despertos — início
  R('r1_wake', { region: 'r1', x: -3, y: 1, area: 'reg_r1' }, (b) => {
    b.fill(); b.carve(2, 4, 29, 14); b.ragged(2, 29, 4, 2);
    b.carve(14, 15, 19, 16); b.put(16, 16, 'P');
    b.exitR(10, 14);
    b.cracked(0, 10, 1, 14);
    b.solid(25, 13, 27, 14);
    b.e('inscription', 6, 14, { id: 'i01' });
    b.e('urn', 22, 14); b.e('urn', 28, 12);
    b.e('trigger', 24, 9, { h: 6, hint: 'hint_attack' });
    b.e('trigger', 9, 9, { h: 6, hint: 'hint_cracked_wall' });
  });

  // Rua das Velas Apagadas
  R('r1_street', { region: 'r1', x: -2, y: 1, w: 2 }, (b) => {
    b.fill(); b.carve(2, 4, 61, 14); b.ragged(2, 61, 4, 2);
    b.exitL(10, 14); b.exitR(10, 14);
    b.carve(40, 0, 43, 5);
    b.plat(37, 46, 12); b.plat(39, 44, 9); b.plat(37, 42, 6); b.plat(40, 43, 3);
    b.solid(18, 13, 23, 14); b.solid(30, 13, 31, 14);
    b.plat(49, 54, 6); b.item('ash_steel', 51, 5);
    b.enemy('husk', 14, 14); b.enemy('husk', 21, 12); b.enemy('crawler', 34, 14); b.enemy('wisp', 52, 10);
    b.e('inscription', 27, 14, { id: 'i02' });
    b.e('urn', 9, 14); b.e('urn', 58, 14);
    b.e('trigger', 5, 9, { h: 6, hint: 'hint_heal' });
  });

  // Santuário da Última Chama
  R('r1_sanct', { region: 'sanct', x: 0, y: 1, area: 'reg_sanct', interior: true }, (b) => {
    b.fill(); b.carve(2, 3, 29, 14);
    b.exitL(10, 14); b.exitR(10, 14);
    b.solid(10, 14, 21, 14);
    b.e('altar', 15, 13, { id: 'a_sanct', name: 'altar_sanct' });
    b.e('lastflame', 15, 4);
    b.e('npc', 23, 14, { id: 'ione', cond: (s) => !s.bosses.aldric || !!s.ending });
    b.e('npc', 6, 14, { id: 'maren', cond: (s) => s.quests.maren >= 2 && s.quests.maren < 90 });
    b.e('npc', 26, 14, { id: 'hrolf', cond: (s) => s.quests.hrolf >= 2 && s.quests.hrolf < 50 });
    b.e('npc', 4, 14, { id: 'teodoro', cond: (s) => s.quests.teodoro === 3 });
    b.e('inscription', 9, 13, { id: 'i03' });
    b.e('trigger', 10, 9, { h: 6, once: 'met_ione_trigger', run: (g) => VS.Story.meetIone(g) });
    b.prop('statue', 4, 14); b.prop('statue', 27, 14);
  });

  // Praça do Paço (portão real, caminho para a Capela)
  R('r1_plaza', { region: 'r1', x: -1, y: 0, w: 2 }, (b) => {
    b.fill(); b.carve(2, 3, 61, 14); b.ragged(2, 61, 3, 2);
    b.carve(8, 15, 11, 17); b.plat(8, 11, 16);
    b.exitL(10, 14);
    b.e('door', 3, 10, { id: 'd_palace', h: 5, open: 'embers:5' });
    b.carve(62, 3, 63, 7); b.plat(54, 60, 11); b.solid(57, 8, 63, 8); b.carve(57, 3, 61, 7);
    b.solid(24, 12, 27, 14); b.plat(28, 34, 10);
    b.enemy('wisp', 20, 8); b.enemy('wisp', 44, 7); b.enemy('husk', 40, 14); b.enemy('sexton', 49, 14);
    b.e('inscription', 33, 14, { id: 'i04' });
    b.item('salt', 31, 9, { n: 2 });
    b.e('urn', 16, 14); b.e('urn', 52, 14);
    b.prop('statue', 18, 14);
    b.e('trigger', 6, 9, { h: 6, hint: 'hint_palace' });
  });

  // Capela da Rainha (parede falsa com a terceira carta)
  R('r1_chapel', { region: 'sanct', x: 1, y: 0, area: 'reg_sanct', interior: true, dark: 0.6 }, (b) => {
    b.fill(); b.carve(2, 3, 25, 14); b.carve(0, 3, 1, 7);
    b.solid(0, 8, 8, 17); b.carve(2, 3, 8, 7);
    b.plat(13, 17, 12); b.plat(9, 12, 9);
    b.fake(26, 10, 27, 14); b.carve(28, 10, 29, 14);
    b.item('letter_3', 28, 14);
    b.e('inscription', 18, 14, { id: 'i05' });
    b.prop('candelabra', 14, 14); b.prop('candelabra', 22, 14);
  });

  // Mercado Queimado (forja de Hrolf)
  R('r1_market', { region: 'r1', x: 1, y: 1, w: 2 }, (b) => {
    b.fill(); b.carve(2, 4, 61, 14); b.ragged(2, 61, 4, 2);
    b.exitL(10, 14); b.exitR(10, 14);
    b.carve(50, 15, 53, 17);
    b.plat(20, 26, 11); b.plat(34, 40, 10);
    b.solid(4, 13, 5, 14);
    b.item('ash_steel', 37, 9);
    b.e('npc', 9, 14, { id: 'hrolf', cond: (s) => s.quests.hrolf < 2 });
    b.enemy('husk', 16, 14); b.enemy('husk', 30, 14); b.enemy('crawler', 44, 14); b.enemy('wisp', 57, 8);
    b.e('urn', 24, 14); b.e('urn', 46, 14); b.e('urn', 60, 14);
    b.prop('anvil', 6, 14); b.prop('crucible', 3, 12);
  });

  // Cemitério dos Sinos Mudos
  R('r1_cemetery', { region: 'r1', x: 1, y: 2, w: 2 }, (b) => {
    b.fill(); b.carve(2, 3, 61, 14); b.ragged(2, 61, 3, 2);
    b.exitU(50, 53); b.carve(50, 0, 53, 5);
    b.plat(48, 55, 12); b.plat(50, 53, 9); b.plat(48, 55, 6); b.plat(50, 53, 3);
    b.exitR(10, 14); b.exitL(10, 14);
    b.e('door', 2, 10, { id: 'd_crypt', h: 5, open: 'key:ossuary_key' });
    b.carve(20, 15, 29, 16); b.spikes(20, 29, 16); b.crumble(20, 29, 15);
    b.e('altar', 40, 14, { id: 'a_cemetery', name: 'altar_cemetery' });
    b.enemy('crawler', 12, 14); b.enemy('crawler', 34, 14); b.enemy('wisp', 26, 8); b.enemy('husk', 46, 14);
    b.e('trap', 15, 3, { k: 'blade', len: 10, period: 2.4 });
    b.e('inscription', 8, 14, { id: 'i06' });
    b.e('urn', 58, 14); b.e('urn', 36, 14);
    b.prop('grave', 6, 14); b.prop('grave', 33, 14); b.prop('grave', 44, 14);
  });

  // Fossa do Coveiro — subchefe
  R('r1_coveiro', { region: 'r1', x: 3, y: 2, w: 2 }, (b) => {
    b.fill(); b.carve(2, 3, 61, 14); b.ragged(2, 53, 3, 1);
    b.exitL(10, 14);
    b.e('door', 2, 10, { id: 'g_coveiro', h: 5, open: 'bossgate' });
    b.carve(56, 0, 59, 3);
    b.plat(54, 61, 12); b.plat(56, 59, 9); b.plat(54, 61, 6); b.plat(56, 59, 3);
    b.e('boss', 30, 14, { boss: 'coveiro', trigger: 10 });
    b.prop('grave', 20, 14); b.prop('grave', 40, 14);
  });

  // Campanário Baixo — sobe para a Torre dos Sinos (salto duplo)
  R('r1_belfry', { region: 'r1', x: 3, y: 0, h: 2 }, (b) => {
    b.fill(); b.carve(2, 3, 29, 32);
    b.exitL(28, 32); b.exitR(28, 32);
    b.carve(12, 0, 19, 3);
    b.rect(2, 3, 2, 19, '^'); b.rect(29, 3, 29, 19, '^');
    b.plat(5, 10, 30); b.plat(13, 18, 27); b.plat(21, 26, 24); b.plat(13, 18, 21); b.plat(5, 10, 18); b.plat(13, 18, 15);
    b.plat(13, 18, 12); b.plat(13, 18, 7); b.plat(12, 19, 4);
    b.enemy('wisp', 22, 19); b.enemy('wisp', 8, 13); b.enemy('crawler', 15, 26);
    b.e('urn', 7, 17); b.e('urn', 24, 23);
    b.e('trigger', 13, 13, { w: 6, h: 2, hint: 'hint_too_high' });
  });

  // Ponte Partida — o fosso exige a esquiva aérea
  R('r1_bridge', { region: 'r1', x: 4, y: 1, w: 3 }, (b) => {
    b.fill(); b.carve(0, 0, 95, 14);
    b.carve(72, 15, 78, 17); b.spikes(72, 78, 17);
    b.carve(24, 15, 27, 17);
    b.e('door', 24, 15, { id: 'h_coveiro', w: 4, h: 1, open: 'boss:coveiro' });
    b.solid(46, 13, 47, 14); b.solid(60, 12, 62, 14);
    b.enemy('sexton', 38, 14); b.enemy('husk', 54, 14); b.enemy('crawler', 66, 14); b.enemy('wisp', 84, 8);
    b.e('trigger', 68, 8, { h: 7, hint: 'hint_gap' });
    b.e('urn', 90, 14);
    b.prop('lamppost', 10, 14); b.prop('lamppost', 30, 14); b.prop('lamppost', 56, 14); b.prop('lamppost', 86, 14);
  });

  // Ossário (opcional, Chave do Ossário)
  R('r1_crypt', { region: 'crypt', x: -1, y: 2, w: 2, area: 'reg_crypt', dark: 0.72 }, (b) => {
    b.fill(); b.carve(2, 3, 61, 14); b.ragged(2, 61, 3, 2);
    b.exitR(10, 14);
    b.solid(2, 3, 15, 9); b.fake(14, 10, 15, 14);
    b.item('candle_fragment', 4, 14);
    b.e('shrine', 9, 14, { item: 'w_espirito' }); // segredo: a Lâmina do Espírito presa entre os ossos
    b.plat(28, 34, 10); b.item('ash_heart', 31, 9);
    b.item('r_lantern', 22, 14);
    b.e('inscription', 50, 14, { id: 'i07' });
    b.enemy('courtier', 40, 10); b.enemy('husk', 26, 14); b.enemy('husk', 45, 14); b.enemy('crawler', 36, 14);
    b.e('urn', 18, 14); b.e('urn', 56, 14);
  });
})(window.VS);
