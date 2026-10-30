// Vesperal — Região 6: Catedral do Crepúsculo (vitrais, incenso, pilares de luz)
'use strict';
(function (VS) {
  const R = VS.room;

  // Nártex — para lá do véu
  R('r6_narthex', { region: 'r6', x: 4, y: -4 }, (b) => {
    b.fill(); b.carve(2, 3, 29, 14);
    b.exitL(10, 14); b.exitR(10, 14);
    b.e('altar', 16, 14, { id: 'a_r6_narthex', name: 'altar_r6_narthex' });
    b.e('inscription', 7, 14, { id: 'i27' });
    b.prop('statue', 25, 14); b.prop('candelabra', 11, 14);
  });

  // Grande Nave
  R('r6_nave', { region: 'r6', x: 5, y: -4, w: 3 }, (b) => {
    b.fill(); b.carve(2, 2, 93, 14);
    b.exitL(10, 14);
    b.carve(28, 15, 31, 17);
    b.plat(40, 46, 10); b.plat(60, 66, 10); b.plat(74, 78, 11); b.plat(80, 86, 8);
    b.e('trap', 50, 2, { k: 'beam', len: 13, period: 3.2 });
    b.e('trap', 72, 2, { k: 'beam', len: 13, period: 3.2, off: 1.6 });
    b.enemy('penitent', 20, 14); b.enemy('vitrail', 44, 7); b.enemy('penitent_big', 56, 14); b.enemy('choir', 70, 6); b.enemy('vitrail', 88, 5);
    b.item('incense', 83, 7);
    b.e('inscription', 90, 14, { id: 'i28' });
    b.prop('pew', 36, 14); b.prop('pew', 54, 14); b.prop('pew', 66, 14);
  });

  // Claustro
  R('r6_cloister', { region: 'r6', x: 5, y: -3, w: 2 }, (b) => {
    b.fill(); b.carve(2, 3, 61, 14);
    b.carve(28, 0, 31, 3); b.plat(26, 33, 12); b.plat(28, 31, 9); b.plat(26, 33, 6); b.plat(28, 31, 3);
    b.exitR(10, 14); b.exitL(10, 14);
    b.enemy('penitent', 14, 14); b.enemy('choir', 46, 6); b.enemy('penitent', 52, 14);
    b.prop('statue', 8, 14); b.prop('statue', 56, 14);
  });

  // Capela da Inquisição — Inquisidora Vael
  R('r6_vael', { region: 'r6', x: 7, y: -3, w: 2 }, (b) => {
    b.fill(); b.carve(2, 3, 61, 14); b.exitL(10, 14);
    b.e('door', 2, 10, { id: 'g_vael', h: 5, open: 'bossgate' });
    b.carve(10, 15, 13, 17);
    b.e('door', 10, 15, { id: 'h_vael', w: 4, h: 1, open: 'boss:vael' });
    b.e('boss', 44, 14, { boss: 'vael', trigger: 14 });
    b.prop('candelabra', 30, 14);
  });

  // Relicário (opcional) — o corpo de Teodoro, se o mandaste para aqui
  R('r6_reliquary', { region: 'r6', x: 4, y: -3, h: 2, dark: 0.6 }, (b) => {
    b.fill(); b.carve(2, 3, 29, 32);
    b.exitR(10, 14); b.exitR(28, 32);
    b.solid(14, 15, 29, 16);
    b.plat(4, 9, 30); b.plat(9, 13, 27); b.plat(4, 9, 24); b.plat(9, 13, 21); b.plat(4, 9, 18); b.plat(9, 13, 18);
    b.plat(16, 21, 9); b.item('ash_heart', 18, 8);
    b.fake(2, 10, 3, 14); b.carve(0, 10, 1, 14); b.item('feather', 0, 14, { n: 3 });
    b.e('npc', 12, 32, { id: 'teodoro_body', cond: (s) => s.quests.teodoro === 4 && !s.flags.teo_body_found });
    b.e('inscription', 22, 32, { id: 'i29' });
    b.enemy('vitrail', 16, 22); b.enemy('penitent', 22, 14);
  });

  // Coro
  R('r6_choir', { region: 'r6', x: 5, y: -2, w: 3 }, (b) => {
    b.fill(); b.carve(2, 3, 93, 14);
    b.exitL(10, 14);
    b.carve(74, 0, 77, 3); b.plat(72, 79, 12); b.plat(74, 77, 9); b.plat(72, 79, 6); b.plat(74, 77, 3);
    b.carve(46, 15, 49, 17);
    b.e('altar', 38, 14, { id: 'a_r6_choir', name: 'altar_r6_choir' });
    b.item('ash_steel', 62, 9); b.plat(59, 65, 10);
    b.e('trap', 24, 2, { k: 'beam', len: 13, period: 3 });
    b.enemy('vitrail', 20, 7); b.enemy('choir', 56, 5); b.enemy('penitent', 66, 14); b.enemy('penitent', 86, 14);
    b.e('inscription', 30, 14, { id: 'i30' });
    b.prop('pew', 12, 14); b.prop('pew', 26, 14);
  });

  // O Altar-Mor — Bispo Ozias
  R('r6_ozias', { region: 'r6', x: 5, y: -1, w: 3 }, (b) => {
    b.fill(); b.carve(2, 2, 93, 14);
    b.carve(46, 0, 49, 1);
    b.e('door', 46, 1, { id: 'g_ozias', w: 4, h: 1, open: 'bossgate' });
    b.plat(44, 51, 12); b.plat(46, 49, 9); b.plat(44, 51, 6); b.plat(46, 49, 3);
    b.solid(12, 12, 18, 14); b.solid(76, 12, 82, 14);
    b.e('boss', 70, 9, { boss: 'ozias', trigger: 20, floor: 15 });
    b.e('inscription', 88, 14, { id: 'i31' });
    b.prop('candelabra', 24, 14); b.prop('candelabra', 66, 14);
  });
})(window.VS);
