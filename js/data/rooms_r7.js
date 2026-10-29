// Vesperal — Região 7: Paço Real (tempestade de cinza, tapeçarias a arder, o trono)
'use strict';
(function (VS) {
  const R = VS.room;

  // Ponte do Paço — para lá do portão das brasas
  R('r7_bridge', { region: 'r7', x: -3, y: 0, w: 2, interior: false }, (b) => {
    b.fill(); b.carve(0, 0, 61, 14);
    b.exitR(10, 14);
    b.solid(0, 15, 1, 17);
    b.carve(22, 15, 25, 16); b.spikes(22, 25, 16);
    b.carve(40, 15, 43, 16); b.spikes(40, 43, 16);
    b.carve(10, 0, 13, 1);
    b.plat(8, 15, 12); b.plat(10, 13, 9); b.plat(8, 15, 6); b.plat(10, 13, 3);
    b.enemy('torch', 32, 14); b.enemy('royalguard', 50, 14);
    b.e('trap', 32, 0, { k: 'blade', len: 13, period: 2.8 });
    b.e('inscription', 56, 14, { id: 'i32' });
  });

  // Grande Salão
  R('r7_hall', { region: 'r7', x: -4, y: -1, w: 3 }, (b) => {
    b.fill(); b.carve(2, 3, 93, 14);
    b.carve(42, 15, 45, 17); b.plat(42, 45, 15);
    b.exitL(10, 14);
    b.carve(80, 0, 83, 3); b.plat(78, 85, 12); b.plat(80, 83, 9); b.plat(78, 85, 6); b.plat(80, 83, 3);
    b.e('altar', 50, 14, { id: 'a_r7_hall', name: 'altar_r7_hall' });
    b.e('trap', 24, 13, { k: 'vent', len: 5, period: 2.8 }); b.e('trap', 64, 13, { k: 'vent', len: 5, period: 2.8, off: 1.4 });
    b.solid(24, 14, 24, 14); b.solid(64, 14, 64, 14);
    b.enemy('royalguard', 30, 14); b.enemy('courtier', 60, 9); b.enemy('torch', 72, 14); b.enemy('royalguard', 14, 14);
    b.prop('chandelier', 36, 3); b.prop('chandelier', 58, 3);
  });

  // Aposentos Reais (opcional) — a segunda carta, atrás de um véu
  R('r7_chambers', { region: 'r7', x: -5, y: -2, h: 2, dark: 0.66 }, (b) => {
    b.fill(); b.carve(2, 3, 29, 32);
    b.exitR(28, 32);
    b.plat(18, 24, 30); b.plat(8, 14, 27); b.plat(18, 24, 24); b.plat(8, 14, 21); b.plat(18, 24, 18); b.plat(8, 14, 15); b.plat(18, 24, 12);
    b.solid(2, 9, 16, 10); b.veil(16, 4, 17, 8);
    b.item('letter_2', 6, 8);
    b.e('inscription', 26, 32, { id: 'i33' });
    b.enemy('courtier', 16, 20); b.enemy('torch', 6, 32);
    b.prop('portrait', 10, 6);
  });

  // Galeria dos Retratos
  R('r7_gallery', { region: 'r7', x: -4, y: -2, w: 4 }, (b) => {
    b.fill(); b.carve(2, 3, 125, 14);
    b.carve(80, 15, 83, 17); b.plat(80, 83, 15);
    b.carve(40, 0, 43, 3); b.plat(38, 45, 12); b.plat(40, 43, 9); b.plat(38, 45, 6); b.plat(40, 43, 3);
    b.carve(108, 0, 111, 3); b.plat(106, 113, 12); b.plat(108, 111, 9); b.plat(106, 113, 6); b.plat(108, 111, 3);
    b.e('altar', 100, 14, { id: 'a_r7_gallery', name: 'altar_r7_gallery' });
    b.e('trap', 20, 3, { k: 'blade', len: 10, period: 2.6 }); b.e('trap', 60, 3, { k: 'blade', len: 10, period: 2.6, off: 1.3 });
    b.e('trap', 92, 3, { k: 'crusher', len: 10.4, period: 3 });
    b.item('ash_steel', 120, 14);
    b.enemy('courtier', 30, 9); b.enemy('torch', 50, 14); b.enemy('royalguard', 70, 14); b.enemy('courtier', 118, 9); b.enemy('penitent', 10, 14);
    b.e('inscription', 86, 14, { id: 'i34' });
    b.e('urn', 4, 14); b.e('urn', 124, 14);
    b.prop('portrait', 24, 7); b.prop('portrait', 44, 7); b.prop('portrait', 64, 7); b.prop('portrait', 104, 7);
  });

  // Sala de Armas — Os Gémeos da Guarda
  R('r7_twins', { region: 'r7', x: -3, y: -3, w: 2 }, (b) => {
    b.fill(); b.carve(2, 3, 61, 14);
    b.carve(8, 15, 11, 17); b.plat(8, 11, 15);
    b.e('boss', 40, 14, { boss: 'gemeos', trigger: 16 });
    b.prop('banner', 20, 3); b.prop('banner', 44, 3);
  });

  // Escada do Trono
  R('r7_stair', { region: 'r7', x: -1, y: -3 }, (b) => {
    b.fill(); b.carve(2, 2, 29, 15);
    b.carve(12, 16, 15, 17); b.plat(12, 15, 15);
    b.carve(12, 0, 15, 1);
    b.plat(6, 11, 12); b.plat(16, 21, 9); b.plat(8, 13, 6); b.plat(12, 15, 3);
    b.enemy('torch', 22, 15);
    b.e('inscription', 25, 15, { id: 'i36' });
  });

  // O Trono de Cinza — Rei Aldric
  R('r7_throne', { region: 'r7', x: -3, y: -4, w: 3, music: 'r7' }, (b) => {
    b.fill(); b.carve(2, 2, 93, 14);
    b.carve(76, 15, 79, 17); b.plat(76, 79, 15);
    b.solid(8, 12, 16, 14);
    b.e('boss', 30, 14, { boss: 'aldric', trigger: 72, fromRight: true });
    b.e('npc', 26, 14, { id: 'ione', face: 1, cond: (s) => !!s.bosses.aldric && !s.ending });
    b.e('inscription', 88, 14, { id: 'i35' });
    b.prop('chandelier', 30, 2); b.prop('chandelier', 60, 2);
  });
})(window.VS);
