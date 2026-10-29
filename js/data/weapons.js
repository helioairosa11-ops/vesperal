// Vesperal — arsenal: cada arma tem classe (conjunto de golpes desenhado no ateliê), ritmo, alcance, dano, sons e rasto próprios.
// Tempos em segundos (antecipação / golpe / recuperação); 'next' encadeia o combo.
'use strict';
(function (VS) {
  const M = {};
  // ESPADA — equilibrada
  M.espada = {
    l1: { wind: 0.08, act: 0.1, rec: 0.2, mult: 1, poise: 12, lunge: 110, knock: 150, next: 'l2' },
    l2: { wind: 0.07, act: 0.1, rec: 0.22, mult: 1, poise: 12, lunge: 100, knock: 150, next: 'l3' },
    l3: { wind: 0.16, act: 0.12, rec: 0.32, mult: 1.4, poise: 28, lunge: 170, knock: 260, hitstop: 0.075 },
    air: { wind: 0.05, act: 0.1, rec: 0.15, mult: 1, poise: 10, knock: 120, next: 'air2' },
    air2: { wind: 0.05, act: 0.1, rec: 0.2, mult: 1, poise: 10, knock: 120 },
    up: { wind: 0.06, act: 0.11, rec: 0.2, mult: 1, poise: 12, knock: 100 },
    down: { wind: 0.04, act: 0.14, rec: 0.15, mult: 1, poise: 12, knock: 80, pogo: true },
    crouch: { wind: 0.05, act: 0.09, rec: 0.2, mult: 0.9, poise: 8, knock: 120 },
    riposte: { wind: 0.05, act: 0.12, rec: 0.3, kind: 'riposte', mult: 1, poise: 80, knock: 320, hitstop: 0.16, lunge: 260 },
    heavy: { wind: 0.36, act: 0.14, rec: 0.38, kind: 'heavy', mult: 1, poise: 45, lunge: 190, knock: 340, hitstop: 0.1 },
  };
  // NAVALHAS — muito rápidas, alcance curto, combo de quatro
  M.facas = {
    l1: { wind: 0.035, act: 0.06, rec: 0.12, mult: 0.55, poise: 6, lunge: 90, knock: 80, next: 'l2' },
    l2: { wind: 0.035, act: 0.06, rec: 0.12, mult: 0.55, poise: 6, lunge: 90, knock: 80, next: 'l3' },
    l3: { wind: 0.035, act: 0.06, rec: 0.12, mult: 0.6, poise: 6, lunge: 90, knock: 90, next: 'l4' },
    l4: { wind: 0.08, act: 0.12, rec: 0.24, mult: 0.9, poise: 18, lunge: 150, knock: 200, hitstop: 0.06, multi: 2 },
    air: { wind: 0.03, act: 0.07, rec: 0.12, mult: 0.55, poise: 6, knock: 80, next: 'air2' },
    air2: { wind: 0.03, act: 0.07, rec: 0.14, mult: 0.55, poise: 6, knock: 80 },
    up: { wind: 0.04, act: 0.08, rec: 0.16, mult: 0.6, poise: 8, knock: 80 },
    down: { wind: 0.03, act: 0.1, rec: 0.12, mult: 0.6, poise: 8, knock: 60, pogo: true },
    crouch: { wind: 0.03, act: 0.07, rec: 0.14, mult: 0.55, poise: 6, knock: 80 },
    riposte: { wind: 0.04, act: 0.14, rec: 0.26, kind: 'riposte', mult: 0.8, poise: 60, knock: 260, hitstop: 0.12, lunge: 280, multi: 3 },
    heavy: { wind: 0.24, act: 0.18, rec: 0.3, kind: 'heavy', mult: 0.7, poise: 30, lunge: 330, knock: 220, hitstop: 0.06, multi: 3 },
  };
  // MALHO — lento, enorme impacto e equilíbrio; parte guardas e armaduras
  M.malho = {
    l1: { wind: 0.26, act: 0.14, rec: 0.36, mult: 1, poise: 40, lunge: 90, knock: 300, hitstop: 0.09, next: 'l2' },
    l2: { wind: 0.22, act: 0.14, rec: 0.42, mult: 1.1, poise: 44, lunge: 90, knock: 320, hitstop: 0.1 },
    air: { wind: 0.12, act: 0.14, rec: 0.24, mult: 1, poise: 36, knock: 260 },
    up: { wind: 0.2, act: 0.14, rec: 0.32, mult: 1, poise: 36, knock: 200 },
    down: { wind: 0.1, act: 0.16, rec: 0.2, mult: 1.1, poise: 40, knock: 200, pogo: true },
    crouch: { wind: 0.18, act: 0.12, rec: 0.3, mult: 0.9, poise: 30, knock: 260 },
    riposte: { wind: 0.08, act: 0.14, rec: 0.36, kind: 'riposte', mult: 1.2, poise: 100, knock: 380, hitstop: 0.18, lunge: 160 },
    heavy: { wind: 0.5, act: 0.16, rec: 0.5, kind: 'heavy', mult: 1.25, poise: 70, lunge: 120, knock: 420, hitstop: 0.14, shock: true },
  };
  // ALABARDA — alcance longo: estocada, varrimento, golpe de cima
  M.haste = {
    l1: { wind: 0.12, act: 0.1, rec: 0.24, mult: 1, poise: 14, lunge: 120, knock: 180, next: 'l2' },
    l2: { wind: 0.14, act: 0.12, rec: 0.28, mult: 1.05, poise: 16, lunge: 80, knock: 200, next: 'l3' },
    l3: { wind: 0.2, act: 0.12, rec: 0.34, mult: 1.4, poise: 30, lunge: 140, knock: 280, hitstop: 0.08 },
    air: { wind: 0.08, act: 0.12, rec: 0.2, mult: 1, poise: 12, knock: 150 },
    up: { wind: 0.1, act: 0.12, rec: 0.24, mult: 1, poise: 12, knock: 120 },
    down: { wind: 0.06, act: 0.16, rec: 0.18, mult: 1, poise: 14, knock: 90, pogo: true },
    crouch: { wind: 0.08, act: 0.1, rec: 0.22, mult: 0.95, poise: 10, knock: 150 },
    riposte: { wind: 0.06, act: 0.14, rec: 0.32, kind: 'riposte', mult: 1.1, poise: 80, knock: 340, hitstop: 0.16, lunge: 260 },
    heavy: { wind: 0.3, act: 0.3, rec: 0.4, kind: 'heavy', mult: 1, poise: 40, lunge: 60, knock: 300, hitstop: 0.09, multi: 2, both: true },
  };
  // LÂMINA DO ESPÍRITO — golpes amplos e flutuantes; o terceiro e o carregado libertam uma onda espiritual
  M.espirito = {
    l1: { wind: 0.08, act: 0.11, rec: 0.22, mult: 0.95, poise: 10, lunge: 100, knock: 140, next: 'l2' },
    l2: { wind: 0.07, act: 0.12, rec: 0.22, mult: 0.95, poise: 10, lunge: 80, knock: 140, next: 'l3' },
    l3: { wind: 0.14, act: 0.12, rec: 0.34, mult: 1.2, poise: 20, lunge: 120, knock: 200, hitstop: 0.06, wave: true },
    air: { wind: 0.05, act: 0.11, rec: 0.16, mult: 0.95, poise: 10, knock: 120, next: 'air2' },
    air2: { wind: 0.05, act: 0.11, rec: 0.2, mult: 0.95, poise: 10, knock: 120 },
    up: { wind: 0.06, act: 0.12, rec: 0.2, mult: 1, poise: 12, knock: 100 },
    down: { wind: 0.04, act: 0.14, rec: 0.15, mult: 1, poise: 12, knock: 80, pogo: true },
    crouch: { wind: 0.05, act: 0.1, rec: 0.2, mult: 0.9, poise: 8, knock: 120 },
    riposte: { wind: 0.05, act: 0.12, rec: 0.3, kind: 'riposte', mult: 1, poise: 70, knock: 300, hitstop: 0.14, lunge: 240 },
    heavy: { wind: 0.34, act: 0.14, rec: 0.36, kind: 'heavy', mult: 1, poise: 36, lunge: 150, knock: 300, hitstop: 0.1, wave: true },
  };
  // MONTANTE — espadão real a duas mãos: arcos amplos e devastadores
  M.montante = {
    l1: { wind: 0.26, act: 0.15, rec: 0.36, mult: 1, poise: 36, lunge: 120, knock: 280, hitstop: 0.09, next: 'l2' },
    l2: { wind: 0.22, act: 0.15, rec: 0.38, mult: 1, poise: 36, lunge: 110, knock: 280, hitstop: 0.09, next: 'l3' },
    l3: { wind: 0.34, act: 0.16, rec: 0.5, mult: 1.5, poise: 60, lunge: 180, knock: 380, hitstop: 0.13 },
    air: { wind: 0.12, act: 0.15, rec: 0.24, mult: 1, poise: 30, knock: 240 },
    up: { wind: 0.18, act: 0.15, rec: 0.32, mult: 1, poise: 30, knock: 200 },
    down: { wind: 0.1, act: 0.16, rec: 0.2, mult: 1.1, poise: 36, knock: 200, pogo: true },
    crouch: { wind: 0.16, act: 0.12, rec: 0.3, mult: 0.9, poise: 28, knock: 240 },
    riposte: { wind: 0.08, act: 0.15, rec: 0.36, kind: 'riposte', mult: 1.2, poise: 100, knock: 400, hitstop: 0.18, lunge: 180 },
    heavy: { wind: 0.5, act: 0.18, rec: 0.5, kind: 'heavy', mult: 1.3, poise: 70, lunge: 160, knock: 420, hitstop: 0.14, both: true },
  };

  // armas: dmg = multiplicador sobre o dano base da lâmina temperada; speed = multiplicador de ritmo
  const W = {
    desperto: { cls: 'espada', dmg: 1.0, speed: 1.0, trail: 'steel', sfx: ['swing', 'swing_heavy'], mat: 'blade', start: true },
    navalhas: { cls: 'facas', dmg: 0.62, speed: 1.0, trail: 'quick', sfx: ['swing_light', 'swing'], mat: 'blade', dual: true },
    malho: { cls: 'malho', dmg: 2.0, speed: 1.0, trail: 'heavy', sfx: ['swing_heavy', 'swing_heavy'], mat: 'blunt', armorBreak: true, guardBreak: true },
    alabarda: { cls: 'haste', dmg: 1.15, speed: 1.0, trail: 'long', sfx: ['swing', 'swing_heavy'], mat: 'blade', long: true },
    espirito: { cls: 'espirito', dmg: 0.9, speed: 1.0, trail: 'spirit', sfx: ['spirit_swing', 'spirit_swing'], mat: 'spirit', spirit: true },
    montante: { cls: 'montante', dmg: 2.3, speed: 1.0, trail: 'royal', sfx: ['swing_heavy', 'swing_royal'], mat: 'blade', armorBreak: true },
  };
  // natureza de cada inimigo/chefe: material (efeitos e sons do golpe) e traços que mudam o dano das armas
  //   spectral: espectros e luz (Lâmina do Espírito ×1.7, restantes ×0.75)
  //   armored: armadura/pedra/metal (Malho e Montante ×1.45, Navalhas ×0.6)
  //   agile: rápidos e esquivos (Navalhas ×1.35)   flying: voadores (Alabarda ×1.2)
  VS.NATURE = {
    husk: { mat: 'ash' }, crawler: { mat: 'ash', agile: true }, wisp: { mat: 'wax', spectral: true },
    sexton: { mat: 'flesh' }, sentinel: { mat: 'armor', armored: true }, crossbow: { mat: 'wood' },
    hound: { mat: 'ash', agile: true }, thrall: { mat: 'flesh', armored: true }, slag: { mat: 'molten', armored: true },
    smelter: { mat: 'flesh' }, thornmaid: { mat: 'plant' }, drowned: { mat: 'water' },
    moth: { mat: 'flesh', agile: true, flying: true }, gargoyle: { mat: 'stone', armored: true, flying: true },
    acolyte: { mat: 'flesh' }, raven: { mat: 'flesh', agile: true, flying: true }, penitent: { mat: 'wood' },
    vitrail: { mat: 'glass', spectral: true, flying: true }, choir: { mat: 'stone', spectral: true, flying: true },
    royalguard: { mat: 'armor', armored: true }, courtier: { mat: 'spirit', spectral: true, flying: true }, torch: { mat: 'wax' },
    b_coveiro: { mat: 'flesh' }, b_matilheira: { mat: 'ash', agile: true }, b_caedmon: { mat: 'armor', armored: true },
    b_automato: { mat: 'armor', armored: true }, b_hilde: { mat: 'flesh' }, b_mariposa: { mat: 'flesh', flying: true, agile: true },
    b_elowen: { mat: 'plant', spectral: true }, b_sineiro: { mat: 'wood' }, b_corvin: { mat: 'flesh', agile: true },
    b_vael: { mat: 'spirit', spectral: true }, b_ozias: { mat: 'flesh', flying: true }, b_gemeo_a: { mat: 'armor', armored: true },
    b_gemeo_b: { mat: 'armor', armored: true }, b_aldric: { mat: 'armor', armored: true }, b_seraphine: { mat: 'spirit', spectral: true, flying: true },
  };
  // multiplicadores de dano por natureza do alvo (fraquezas e resistências)
  VS.weaponVs = function (w, target) {
    const t = (target && target.nat) || {};
    let k = 1;
    if (t.spectral) k *= w.spirit ? 1.7 : 0.75;
    if (t.armored) k *= w.armorBreak ? 1.45 : (w.cls === 'facas' ? 0.6 : w.spirit ? 0.75 : 1);
    if (t.agile && w.cls === 'facas') k *= 1.35;
    if (t.flying && w.long) k *= 1.2;
    return k;
  };
  VS.WEAPON_MOVES = M;
  VS.WEAPONS = W;
})(window.VS);
