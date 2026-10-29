// Vesperal — Região 3: Forjas Submersas (metal fundido, respiros, esmagadores, plataformas sobre lava)
'use strict';
(function (VS) {
  const R = VS.room;

  // Poço do Fole — desce da Cisterna
  R('r3_shaft', { region: 'r3', x: 11, y: 3, h: 2 }, (b) => {
    b.fill(); b.carve(2, 0, 29, 32);
    b.carve(12, 0, 15, 2);
    b.exitL(28, 32);
    for (let i = 0; i < 10; i++) { const row = 30 - i * 3; const left = i % 2 === 0; if (row < 3) break; b.plat(left ? 6 : 16, left ? 12 : 23, row); }
    b.plat(11, 16, 3);
    b.e('altar', 22, 32, { id: 'a_r3_shaft', name: 'altar_r3_shaft' });
    b.e('trap', 26, 32, { k: 'vent', len: 5, period: 3, off: 1 });
    b.enemy('smelter', 19, 20); b.enemy('slag', 10, 32);
    b.e('urn', 4, 32);
  });

  // Grande Fundição
  R('r3_foundry', { region: 'r3', x: 8, y: 4, w: 3 }, (b) => {
    b.fill(); b.carve(2, 3, 93, 14); b.ragged(2, 93, 3, 2);
    b.exitR(10, 14); b.exitL(10, 14);
    b.carve(60, 15, 63, 17);
    b.carve(28, 15, 31, 16); b.lava(28, 15, 31, 16);
    b.carve(74, 15, 77, 16); b.lava(74, 15, 77, 16);
    b.plat(46, 52, 11); b.plat(36, 40, 8);
    b.e('trap', 44, 14, { k: 'vent', len: 5, period: 2.6 });
    b.e('trap', 56, 3, { k: 'crusher', len: 10.4, period: 3.2 });
    b.e('trap', 84, 3, { k: 'crusher', len: 10.4, period: 3.2, off: 1.6 });
    b.enemy('thrall', 20, 14); b.enemy('smelter', 49, 10); b.enemy('slag', 38, 14); b.enemy('thrall', 82, 14); b.enemy('slag', 68, 14);
    b.e('npc', 89, 14, { id: 'hrolf_body', cond: (s) => s.quests.hrolf === 60 && !s.flags.hrolf_body_found });
    b.e('inscription', 10, 14, { id: 'i13' });
    b.item('oil', 38, 7);
    b.e('urn', 6, 14); b.e('urn', 91, 14);
  });

  // Câmara do Fole — O Autómato
  R('r3_bellows', { region: 'r3', x: 6, y: 4, w: 2 }, (b) => {
    b.fill(); b.carve(2, 3, 61, 14); b.exitR(10, 14);
    b.e('door', 61, 10, { id: 'g_automato', h: 5, open: 'bossgate' });
    b.e('boss', 22, 14, { boss: 'automato', trigger: 52, fromRight: true });
    b.e('inscription', 5, 14, { id: 'i14' });
    b.e('inscription', 57, 14, { id: 'i39' });
  });

  // Fossos de Escória — ilhas e plataformas móveis sobre a lava
  R('r3_pits', { region: 'r3', x: 8, y: 5, w: 3 }, (b) => {
    b.fill(); b.carve(2, 3, 93, 14); b.ragged(2, 93, 3, 2);
    b.carve(60, 0, 63, 5);
    b.carve(11, 15, 93, 16); b.lava(11, 15, 93, 16);
    b.solid(2, 15, 10, 17);
    b.exitL(10, 14);
    b.solid(56, 13, 67, 14);
    b.solid(36, 13, 42, 14);
    b.solid(18, 14, 26, 14); b.solid(13, 14, 14, 14);
    b.solid(80, 14, 93, 14); b.solid(78, 15, 93, 16);
    b.exitR(10, 13); b.cracked(94, 10, 95, 13);
    b.e('platform', 44, 12, { w: 3, tx: 51, ty: 12, period: 4 });
    b.e('platform', 27, 12, { w: 3, tx: 32, ty: 12, period: 3.4, phase: 0.5 });
    b.e('platform', 69, 12, { w: 3, tx: 76, ty: 12, period: 3.6, phase: 0.25 });
    b.e('altar', 6, 14, { id: 'a_r3_pits', name: 'altar_r3_pits' });
    b.item('ash_steel', 22, 13);
    b.e('lever', 90, 13, { id: 'r3', door: 'd_r3_short' });
    b.e('door', 2, 10, { id: 'd_r3_short', h: 5, open: 'flag:never' });
    b.enemy('slag', 60, 12); b.enemy('smelter', 39, 12); b.enemy('slag', 85, 13);
    b.e('trap', 64, 12, { k: 'vent', len: 5, period: 2.4 });
    b.e('inscription', 8, 14, { id: 'i15' });
  });

  // A Grande Bigorna — Mestra Hilde
  R('r3_hilde', { region: 'r3', x: 6, y: 5, w: 2 }, (b) => {
    b.fill(); b.carve(2, 3, 61, 14); b.exitR(10, 14);
    b.e('door', 61, 10, { id: 'g_hilde', h: 5, open: 'bossgate' });
    b.e('boss', 18, 14, { boss: 'hilde', trigger: 50, fromRight: true });
    b.e('inscription', 6, 14, { id: 'i16' });
    b.e('inscription', 56, 14, { id: 'i40' });
    b.prop('anvil', 30, 14); b.prop('crucible', 10, 14); b.prop('crucible', 50, 14);
  });

  // Cofre da Têmpera (opcional; pedra rachada)
  R('r3_vault', { region: 'r3', x: 11, y: 5, interior: true, dark: 0.65 }, (b) => {
    b.fill(); b.carve(2, 4, 29, 13); b.exitL(10, 13);
    b.item('candle_fragment', 22, 13);
    b.e('inscription', 8, 13, { id: 'i17' });
    b.e('urn', 14, 13); b.e('urn', 26, 13);
  });
})(window.VS);
