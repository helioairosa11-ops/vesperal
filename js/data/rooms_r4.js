// Vesperal — Região 4: Jardins Afogados (estufas inundadas, vinhas, pirilampos)
'use strict';
(function (VS) {
  const R = VS.room;

  // Estufa Partida — atrás da parede rachada da Fossa; Teodoro esconde-se aqui
  R('r4_greenhouse', { region: 'r4', x: -5, y: 1, w: 2 }, (b) => {
    b.fill(); b.carve(2, 2, 61, 14); b.ragged(14, 61, 2, 2);
    b.exitR(10, 14); b.exitL(10, 14);
    b.carve(8, 15, 11, 17);
    b.e('door', 8, 15, { id: 'h_r4', w: 4, h: 1, open: 'flag:never' });
    b.water(22, 14, 29, 14);
    b.plat(34, 40, 11); b.plat(44, 49, 8);
    b.e('altar', 52, 14, { id: 'a_r4_green', name: 'altar_r4_green' });
    b.e('npc', 16, 14, { id: 'teodoro', cond: (s) => s.quests.teodoro < 3 });
    b.enemy('thornmaid', 37, 10); b.enemy('moth', 30, 7);
    b.e('inscription', 58, 14, { id: 'i18' });
    b.item('salt', 46, 7);
    b.prop('glowflower', 26, 14); b.prop('glowflower', 42, 14);
  });

  // Lago das Ninfeias
  R('r4_pond', { region: 'r4', x: -7, y: 1, w: 2 }, (b) => {
    b.fill(); b.carve(2, 2, 61, 14);
    b.exitR(10, 14); b.exitL(10, 14);
    b.water(6, 12, 58, 14);
    b.carve(30, 15, 33, 17);
    b.plat(12, 15, 11); b.plat(20, 23, 11); b.plat(38, 41, 11); b.plat(47, 50, 11);
    b.solid(26, 11, 28, 14); b.solid(34, 11, 35, 14);
    // subida para a arena da Mãe-Mariposa
    b.carve(4, 0, 8, 2); b.plat(2, 7, 12); b.plat(9, 13, 9); b.plat(2, 7, 6); b.plat(4, 8, 3);
    b.enemy('drowned', 17, 14); b.enemy('drowned', 44, 14); b.enemy('drowned', 54, 14); b.enemy('thornmaid', 27, 10); b.enemy('moth', 40, 6);
    b.e('inscription', 60, 14, { id: 'i19' });
    b.e('urn', 3, 11);
  });

  // Copa das Mariposas — A Mãe-Mariposa (salto duplo)
  R('r4_moth', { region: 'r4', x: -7, y: 0, w: 2 }, (b) => {
    b.fill(); b.carve(2, 2, 61, 14); b.ragged(10, 61, 2, 2);
    b.carve(4, 15, 8, 17); b.plat(4, 8, 15);
    b.e('door', 4, 16, { id: 'g_mariposa', w: 5, h: 1, open: 'bossgate' });
    b.plat(20, 25, 10); b.plat(38, 43, 10);
    b.e('boss', 40, 8, { boss: 'mariposa', trigger: 13, floor: 15 });
    b.e('inscription', 58, 14, { id: 'i20' });
    b.e('inscription', 6, 14, { id: 'i41' });
  });

  // Berçário Real (opcional; salto duplo) — a primeira carta da rainha
  R('r4_nursery', { region: 'r4', x: -8, y: 0, h: 2, interior: true, dark: 0.62 }, (b) => {
    b.fill(); b.carve(2, 3, 29, 32);
    b.exitR(28, 32);
    b.plat(14, 20, 29); b.plat(5, 11, 24); b.plat(16, 22, 19); b.plat(5, 11, 14); b.plat(14, 24, 9);
    b.item('letter_1', 20, 8);
    b.e('inscription', 8, 32, { id: 'i21' });
    b.enemy('moth', 14, 16); b.enemy('moth', 20, 6);
    b.prop('candles', 23, 8); b.prop('pot', 4, 32);
  });

  // Raízes Submersas
  R('r4_roots', { region: 'r4', x: -7, y: 2, w: 3 }, (b) => {
    b.fill(); b.carve(2, 3, 93, 14); b.ragged(12, 93, 3, 2);
    b.carve(30, 0, 33, 4);
    b.plat(28, 35, 12); b.plat(30, 33, 9); b.plat(28, 35, 6);
    b.carve(72, 0, 75, 4); b.plat(70, 77, 12); b.plat(72, 75, 9); b.plat(70, 77, 6);
    // borda alta guardada por espinhos: exige o salto duplo
    b.solid(2, 8, 10, 14); b.rect(11, 10, 11, 14, '^');
    b.plat(13, 17, 11);
    b.carve(0, 3, 1, 7);
    b.water(40, 13, 60, 14);
    b.enemy('drowned', 46, 14); b.enemy('drowned_big', 56, 14); b.enemy('crawler', 66, 14); b.enemy('thornmaid', 84, 14); b.enemy('moth', 20, 6);
    b.item('ash_steel', 88, 14);
    b.e('lever', 79, 14, { id: 'r4', door: 'h_r4' });
    b.e('trigger', 18, 9, { w: 2, h: 6, hint: 'hint_too_high' });
    b.e('urn', 36, 14);
  });

  // Antecâmara do Berço
  R('r4_ante', { region: 'r4', x: -8, y: 2, interior: true }, (b) => {
    b.fill(); b.carve(2, 3, 29, 14);
    b.carve(30, 3, 31, 7); b.solid(22, 8, 31, 14);
    b.plat(16, 20, 12);
    b.carve(12, 15, 15, 17);
    b.e('altar', 7, 14, { id: 'a_r4_ante', name: 'altar_r4_ante' });
    b.e('inscription', 3, 14, { id: 'i22' });
  });

  // O Berço Afogado — Ama Elowen
  R('r4_elowen', { region: 'r4', x: -8, y: 3, w: 2 }, (b) => {
    b.fill(); b.carve(2, 3, 61, 14);
    b.carve(12, 0, 15, 2);
    b.e('door', 12, 2, { id: 'g_elowen', w: 4, h: 1, open: 'bossgate' });
    b.plat(10, 17, 12); b.plat(12, 15, 9); b.plat(10, 17, 6); b.plat(12, 15, 3);
    b.e('boss', 38, 14, { boss: 'elowen', trigger: 22 });
    b.prop('reeds', 6, 14); b.prop('reeds', 56, 14);
    b.e('inscription', 8, 14, { id: 'i42' });
  });
})(window.VS);
