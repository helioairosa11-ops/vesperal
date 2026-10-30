// Vesperal — Região 5: Torre dos Sinos (subida vertical, vento, sinos)
'use strict';
(function (VS) {
  const R = VS.room;

  // Escadaria do Campanário (3 células de altura)
  R('r5_stairs', { region: 'r5', x: 3, y: -3, h: 3, interior: true }, (b) => {
    b.fill(); b.carve(2, 2, 29, 50);
    // entrada por baixo (vinda do Campanário Baixo): chão de sentido único sobre o poço
    b.solid(2, 51, 29, 53); b.carve(12, 51, 19, 53); b.plat(12, 19, 51);
    b.e('altar', 5, 50, { id: 'a_r5_stairs', name: 'altar_r5_stairs' });
    b.exitL(46, 50);
    // patamar para o Salão dos Sineiros (meio) e para a arena do Sineiro (topo)
    b.solid(2, 33, 8, 34); b.exitL(28, 32);
    b.solid(2, 15, 8, 16); b.exitL(10, 14);
    b.solid(22, 15, 29, 16);
    b.e('altar', 26, 14, { id: 'a_r5_top', name: 'altar_r5_top' });
    b.carve(12, 0, 19, 2);
    // ziguezague de plataformas
    const rows = [48, 45, 42, 39, 36, 33, 30, 27, 24, 21, 18, 15, 12, 9, 6, 3];
    rows.forEach((r, i) => { if (r === 15) { b.plat(12, 18, r); return; } if (r === 3) return; /* o topo é a plataforma larga por baixo da saída */ const left = i % 2 === 0; b.plat(left ? 9 : 17, left ? 15 : 24, r); });
    b.plat(12, 19, 3);
    b.enemy('gargoyle', 26, 40); b.enemy('gargoyle', 4, 22); b.enemy('raven', 20, 30); b.enemy('raven', 12, 26); b.enemy('acolyte', 5, 32); b.enemy('raven', 18, 8);
    b.e('trap', 24, 2, { k: 'bell', len: 5, period: 2.6 });
    b.e('inscription', 25, 50, { id: 'i23' });
  });

  // Beirais — telhados exteriores (opcional)
  R('r5_eaves', { region: 'r5', x: 1, y: -1, w: 2 }, (b) => {
    b.fill(); b.carve(0, 0, 61, 14); b.exitR(10, 14);
    b.solid(0, 15, 1, 17);
    b.carve(14, 15, 18, 16); b.spikes(14, 18, 16);
    b.carve(36, 15, 39, 16); b.spikes(36, 39, 16); b.crumble(36, 39, 15);
    b.plat(22, 27, 11); b.plat(6, 10, 9);
    b.item('ash_steel', 8, 8);
    b.e('trap', 46, 0, { k: 'bell', len: 13, period: 2.6 });
    b.enemy('raven', 20, 6); b.enemy('raven', 30, 4); b.enemy('gargoyle_big', 25, 6);
    b.e('inscription', 54, 14, { id: 'i24' });
  });

  // Salão dos Sineiros (opcional)
  R('r5_ringers', { region: 'r5', x: 1, y: -2, w: 2, interior: true }, (b) => {
    b.fill(); b.carve(2, 3, 61, 14); b.ragged(2, 61, 3, 2); b.exitR(10, 14);
    b.plat(14, 20, 11); b.plat(28, 34, 8); b.plat(42, 48, 11);
    b.item('oil', 31, 7, { n: 2 }); b.item('feather', 4, 14, { n: 2 });
    b.enemy('acolyte', 18, 14); b.enemy('acolyte', 38, 14); b.enemy('acolyte', 52, 14); b.enemy('raven', 30, 6);
    b.e('inscription', 10, 14, { id: 'i25' });
    b.prop('smallbell', 24, 14); b.prop('smallbell', 46, 14);
  });

  // Sala do Grande Sino — O Sineiro
  R('r5_sineiro', { region: 'r5', x: 1, y: -3, w: 2, interior: true }, (b) => {
    b.fill(); b.carve(2, 3, 61, 14); b.exitR(10, 14);
    b.e('door', 61, 10, { id: 'g_sineiro', h: 5, open: 'bossgate' });
    b.e('boss', 20, 14, { boss: 'sineiro', trigger: 50, fromRight: true });
    b.prop('smallbell', 8, 14);
    b.e('inscription', 56, 14, { id: 'i43' });
  });

  // A Coroa dos Sinos — Corvin, o Menestrel: arena alta (2 células) feita para trepar. Corvin toca do alto de
  // três torres escalonadas (esquerda, coluna central, direita); do chão não se lhe chega. Cada degrau tem uma face
  // de 5–6 blocos para trepar e um patamar no topo onde o fôlego se renova. Véu para a Catedral em baixo à direita.
  R('r5_crown', { region: 'r5', x: 2, y: -5, w: 2, h: 2 }, (b) => {
    b.fill(); b.carve(2, 2, 61, 32);
    // entrada por baixo (vinda da Escadaria do Campanário)
    b.carve(44, 33, 51, 35); b.plat(44, 51, 33);
    b.exitR(28, 32); b.veil(62, 28, 63, 32);
    b.solid(2, 2, 61, 3); // vigas do teto
    // torre esquerda (encostada à parede), em degraus que recuam
    b.solid(2, 27, 9, 32); b.solid(2, 21, 7, 26); b.solid(2, 15, 5, 20); b.solid(2, 10, 4, 14);
    // coluna central: arco por baixo (passa-se no chão), estrados ao lado para começar a trepar
    b.solid(27, 22, 36, 26); b.solid(28, 15, 35, 21); b.solid(29, 8, 34, 14);
    b.plat(22, 25, 29); b.plat(38, 41, 29);
    // torre direita: começa alta (por baixo passa o corredor para o véu); estrado para lhe chegar
    b.solid(53, 22, 61, 26); b.solid(56, 15, 61, 21); b.solid(58, 10, 61, 14);
    b.plat(48, 51, 29);
    b.prop('smallbell', 14, 32); b.prop('smallbell', 46, 32);
    b.e('boss', 31, 7, { boss: 'corvin', trigger: 54, fromRight: true, floor: 33, perches: [[2, 4, 10], [29, 34, 8], [58, 61, 10]] });
    b.e('inscription', 12, 32, { id: 'i26' });
    b.e('inscription', 42, 32, { id: 'i44' });
    b.e('trigger', 56, 27, { h: 6, hint: 'hint_veil' });
  });
})(window.VS);
