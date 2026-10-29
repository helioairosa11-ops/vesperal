// Vesperal — identidade de cada região: paleta, luz, clima, música, fundo, inimigos por letra
'use strict';
(function (VS) {
  VS.REGIONS = {
    r1: {
      key: 'r1', music: 'r1', amb: 'r1', bg: 'city', weather: 'ash',
      sky: ['#0d0e16', '#2a2630', '#5a4038'], fog: '#5c4f52', haze: 'rgba(255,140,80,0.05)',
      stone: '#2f2e36', stoneLight: '#5d5762', stoneDark: '#121117', rim: '#8d7f80', top: '#9a8f8a', topAccent: '#b8aba3',
      accent: '#ff8a3a', light: '#ffa060', dark: 0.5, darkColor: '#07060c', tint: 'rgba(255,120,70,0.07)', surface: 'stone',
      enemies: { a: 'husk', b: 'crawler', c: 'wisp', d: 'sexton' },
    },
    sanct: {
      key: 'sanct', music: 'sanct', amb: 'sanct', bg: 'sanct', weather: 'embers', interior: true,
      sky: ['#100a0a', '#2a1a14', '#4a2a18'], fog: '#3a2618', haze: 'rgba(255,170,90,0.07)',
      stone: '#2e2622', stoneLight: '#6a5446', stoneDark: '#120d0b', rim: '#9a7a5e', top: '#a88a6a', topAccent: '#e0b070',
      accent: '#ffb050', light: '#ffb060', dark: 0.42, darkColor: '#0a0604', tint: 'rgba(255,160,80,0.08)', surface: 'stone',
      enemies: {},
    },
    r2: {
      key: 'r2', music: 'r2', amb: 'r2', bg: 'ramparts', weather: 'rain',
      sky: ['#05080e', '#121c28', '#22303c'], fog: '#2c3a46', haze: 'rgba(120,170,220,0.05)',
      stone: '#2a3038', stoneLight: '#566270', stoneDark: '#0e1116', rim: '#7d8c99', top: '#6f7c86', topAccent: '#9fb0bc',
      accent: '#8fc4ff', light: '#c8d8ff', dark: 0.55, darkColor: '#03060a', tint: 'rgba(90,140,200,0.08)', surface: 'stone',
      enemies: { a: 'sentinel', b: 'crossbow', c: 'hound', d: 'husk' },
    },
    r3: {
      key: 'r3', music: 'r3', amb: 'r3', bg: 'forge', weather: 'sparks', interior: true,
      sky: ['#0a0303', '#2a0b06', '#5a1a08'], fog: '#5a2210', haze: 'rgba(255,90,30,0.08)',
      stone: '#2c2220', stoneLight: '#5e4436', stoneDark: '#0f0908', rim: '#a0603a', top: '#7a5a48', topAccent: '#ff7a30',
      accent: '#ff5a1a', light: '#ff7a30', dark: 0.5, darkColor: '#0a0302', tint: 'rgba(255,80,20,0.1)', surface: 'metal', liquid: '#ff5a10',
      enemies: { a: 'thrall', b: 'slag', c: 'smelter', d: 'crawler' },
    },
    r4: {
      key: 'r4', music: 'r4', amb: 'r4', bg: 'garden', weather: 'fireflies',
      sky: ['#03090a', '#0b2224', '#1c3c38'], fog: '#2c524a', haze: 'rgba(120,255,200,0.04)',
      stone: '#22302c', stoneLight: '#4c6656', stoneDark: '#0a1210', rim: '#6e8f72', top: '#4e7a46', topAccent: '#8fc070',
      accent: '#9fffd0', light: '#b0ffd8', dark: 0.55, darkColor: '#020806', tint: 'rgba(80,200,160,0.07)', surface: 'grass', liquid: '#2a7a70', water: true,
      enemies: { a: 'thornmaid', b: 'drowned', c: 'moth', d: 'crawler' },
    },
    r5: {
      key: 'r5', music: 'r5', amb: 'r5', bg: 'tower', weather: 'wind',
      sky: ['#0c0a18', '#2a2440', '#6a5a70'], fog: '#5a5070', haze: 'rgba(200,180,255,0.05)',
      stone: '#2e2a38', stoneLight: '#625a72', stoneDark: '#100e16', rim: '#a092b0', top: '#7a6e5a', topAccent: '#d8c090',
      accent: '#e8d090', light: '#ffe8b0', dark: 0.45, darkColor: '#06050c', tint: 'rgba(200,170,255,0.06)', surface: 'wood',
      enemies: { a: 'gargoyle', b: 'acolyte', c: 'raven', d: 'sentinel' },
    },
    r6: {
      key: 'r6', music: 'r6', amb: 'r6', bg: 'cathedral', weather: 'incense', interior: true,
      sky: ['#07040e', '#1c1030', '#3a2050'], fog: '#3a2a50', haze: 'rgba(220,180,255,0.05)',
      stone: '#2a2234', stoneLight: '#5c4a6e', stoneDark: '#0e0a14', rim: '#b09060', top: '#6e5a7a', topAccent: '#e0c070',
      accent: '#ffd070', light: '#ffe0a0', dark: 0.5, darkColor: '#05030a', tint: 'rgba(180,120,255,0.07)', surface: 'stone',
      enemies: { a: 'penitent', b: 'vitrail', c: 'choir', d: 'acolyte' },
    },
    r7: {
      key: 'r7', music: 'r7', amb: 'r7', bg: 'palace', weather: 'ashstorm', interior: true,
      sky: ['#080204', '#24060c', '#4a0e10'], fog: '#4a1618', haze: 'rgba(255,60,40,0.06)',
      stone: '#2a1c20', stoneLight: '#5e3e40', stoneDark: '#0e0608', rim: '#c09050', top: '#6a4a40', topAccent: '#e0b060',
      accent: '#ff4a30', light: '#ff8a50', dark: 0.5, darkColor: '#080204', tint: 'rgba(255,60,40,0.08)', surface: 'stone',
      enemies: { a: 'royalguard', b: 'courtier', c: 'torch', d: 'penitent' },
    },
    crypt: {
      key: 'crypt', music: 'intro', amb: 'crypt', bg: 'crypt', weather: 'dust', interior: true,
      sky: ['#050508', '#101018', '#1a1a24'], fog: '#26262e', haze: 'rgba(160,160,200,0.04)',
      stone: '#26262c', stoneLight: '#4e4e58', stoneDark: '#0c0c10', rim: '#7a7a88', top: '#5a5a62', topAccent: '#8a8a98',
      accent: '#a0b0ff', light: '#c0c8ff', dark: 0.62, darkColor: '#030306', tint: 'rgba(140,150,220,0.06)', surface: 'stone',
      enemies: { a: 'husk', b: 'crawler', c: 'wisp', d: 'courtier' },
    },
  };
})(window.VS);
