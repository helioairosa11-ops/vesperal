// Vesperal — Região 2: Bastião das Vigias (muralhas sob tempestade)
'use strict';
(function (VS) {
  const R = VS.room;

  // Portão do Bastião — Maren espera aqui no início
  R('r2_gate', { region: 'r2', x: 7, y: 1 }, (b) => {
    b.fill(); b.carve(0, 3, 31, 14); b.ragged(4, 27, 3, 2);
    b.carve(14, 0, 17, 2); b.plat(13, 18, 12); b.plat(14, 17, 9); b.plat(13, 18, 6); b.plat(14, 17, 3);
    b.e('altar', 6, 14, { id: 'a_r2_gate', name: 'altar_r2_gate' });
    b.e('npc', 24, 14, { id: 'maren', cond: (s) => s.embers < 1 && s.quests.maren < 2 && s.quests.teodoro !== 3 });
    b.e('inscription', 10, 14, { id: 'i08' });
    b.prop('brazier', 2, 14); b.prop('brazier', 29, 14);
  });

  // Caminho de Ronda
  R('r2_wall', { region: 'r2', x: 8, y: 1, w: 3 }, (b) => {
    b.fill(); b.carve(0, 0, 95, 14);
    b.carve(40, 15, 43, 17);
    b.solid(33, 13, 37, 14); b.solid(84, 13, 88, 14); b.solid(62, 12, 63, 14);
    b.carve(72, 15, 77, 16); b.spikes(72, 77, 16); b.crumble(72, 77, 15);
    b.enemy('sentinel', 20, 14); b.enemy('crossbow', 35, 12); b.enemy('hound_big', 54, 14); b.enemy('sentinel', 68, 14); b.enemy('crossbow', 86, 12);
    b.e('trap', 61, 12, { k: 'dart', dir: -1, period: 2.2 });
    b.e('inscription', 47, 14, { id: 'i09' });
    b.e('urn', 10, 14); b.e('urn', 80, 14);
    b.e('trigger', 38, 8, { w: 7, h: 7, hint: 'hint_parry_bolts' });
  });

  // Torre de Vigia (escada interior)
  R('r2_tower', { region: 'r2', x: 11, y: 0, h: 2, interior: true }, (b) => {
    b.fill(); b.carve(2, 3, 29, 32);
    b.exitL(28, 32); b.exitR(28, 32); b.exitL(10, 14);
    b.plat(20, 26, 30); b.plat(10, 16, 27); b.plat(20, 26, 24); b.plat(10, 16, 21); b.plat(14, 20, 18);
    b.solid(2, 15, 13, 16);
    b.plat(16, 19, 12); b.plat(22, 27, 9); b.item('salt', 25, 8, { n: 2 });
    b.e('altar', 6, 14, { id: 'a_r2_tower', name: 'altar_r2_tower' });
    b.enemy('crossbow', 23, 23); b.enemy('sentinel', 13, 26);
    b.e('urn', 4, 32); b.e('urn', 27, 32);
  });

  // Arsenal (opcional)
  R('r2_armory', { region: 'r2', x: 12, y: 1, interior: true, dark: 0.62 }, (b) => {
    b.fill(); b.carve(2, 4, 29, 14); b.exitL(10, 14);
    b.plat(9, 12, 12); b.plat(14, 18, 10); b.item('ash_steel', 16, 9);
    b.item('r_raven_eye', 25, 14);
    b.enemy('sentinel', 12, 14); b.enemy('sentinel', 22, 14);
    b.e('inscription', 6, 14, { id: 'i10' });
    b.prop('crate', 4, 14); b.prop('crate', 27, 14);
  });

  // Ameias — o caminho para a Atalaia
  R('r2_battlement', { region: 'r2', x: 8, y: 0, w: 3 }, (b) => {
    b.fill(); b.carve(0, 0, 95, 14);
    b.exitR(10, 14); b.exitL(10, 14);
    b.carve(30, 15, 33, 16); b.spikes(30, 33, 16);
    b.carve(60, 15, 63, 16); b.spikes(60, 63, 16);
    b.solid(44, 12, 47, 14); b.solid(76, 13, 79, 14);
    b.crumble(16, 19, 11); b.plat(8, 12, 9); b.item('incense', 10, 8);
    b.enemy('hound', 22, 14); b.enemy('crossbow', 45, 11); b.enemy('hound', 68, 14); b.enemy('sentinel', 86, 14); b.enemy('crossbow', 77, 12);
    b.e('trap', 52, 12, { k: 'dart', dir: 1, period: 2.6, off: 1 });
    b.e('inscription', 50, 14, { id: 'i11' });
  });

  // Atalaia da Rainha — Sir Caedmon (chefe de parry)
  R('r2_watch', { region: 'r2', x: 7, y: 0 }, (b) => {
    b.fill(); b.carve(2, 2, 29, 14); b.exitR(10, 14);
    b.carve(14, 15, 17, 17);
    b.e('door', 14, 15, { id: 'h_watch', w: 4, h: 1, open: 'boss:caedmon' });
    b.e('door', 29, 10, { id: 'g_caedmon', h: 5, open: 'bossgate' });
    b.e('boss', 9, 14, { boss: 'caedmon', trigger: 23, fromRight: true });
    b.prop('banner', 8, 2); b.prop('banner', 22, 2);
    b.e('inscription', 26, 14, { id: 'i38' });
  });

  // Canis — A Velha Matilheira
  R('r2_kennels', { region: 'r2', x: 8, y: 2, w: 2, interior: true }, (b) => {
    b.fill(); b.carve(2, 3, 61, 14); b.ragged(2, 34, 3, 2);
    b.carve(40, 0, 43, 3); b.plat(38, 45, 12); b.plat(40, 43, 9); b.plat(38, 45, 6); b.plat(40, 43, 3);
    b.exitR(10, 14);
    b.e('door', 61, 10, { id: 'g_matilheira', h: 5, open: 'bossgate' });
    b.e('boss', 12, 14, { boss: 'matilheira', trigger: 30 });
    b.prop('stakes', 6, 14); b.prop('stakes', 56, 14);
    b.e('inscription', 52, 14, { id: 'i37' });
  });

  // Cisterna — a chaminé sobe-se a saltar pelos degraus; o poço desce às Forjas
  R('r2_cistern', { region: 'r2', x: 10, y: 2, w: 2, interior: true, dark: 0.6 }, (b) => {
    b.fill(); b.carve(2, 3, 61, 14); b.ragged(2, 30, 3, 1);
    b.exitL(10, 14);
    b.water(2, 13, 30, 14);
    b.solid(34, 4, 34, 12); b.solid(38, 9, 40, 14); b.plat(35, 37, 12); b.plat(41, 43, 12);
    b.carve(44, 15, 47, 17);
    b.e('inscription', 26, 14, { id: 'i12' });
    b.enemy('husk', 14, 12); b.enemy('husk', 22, 12);
    b.e('urn', 52, 14);
  });
})(window.VS);
