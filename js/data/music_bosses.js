// Vesperal — trilhas dos chefes (substituem as de music.js): cada chefe tem a sua peça própria, com um tema
// reconhecível (leitmotiv), instrumentação e compasso próprios, secções A/B e camadas que entram nas fases
// seguintes (minInt). Todas as partes de uma peça têm a mesma duração (64 tempos, ou 48 nas valsas) para não se
// desalinharem. Notação igual à de music.js: "NOTA:tempos", "r" pausa, "A+B" acorde, "!" acento.
'use strict';
(function (VS) {
  const M = VS.MUSIC;
  const PC = { C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5, 'F#': 6, Gb: 6, G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11 };
  // acordes por nome → notas (fundamental primeiro)
  const CH = {
    Dm: ['D', 'F', 'A'], D: ['D', 'F#', 'A'], Gm: ['G', 'Bb', 'D'], G: ['G', 'B', 'D'], Am: ['A', 'C', 'E'], A: ['A', 'C#', 'E'], Em: ['E', 'G', 'B'], E: ['E', 'G#', 'B'],
    Bb: ['Bb', 'D', 'F'], Bbm: ['Bb', 'Db', 'F'], C: ['C', 'E', 'G'], Cm: ['C', 'Eb', 'G'], F: ['F', 'A', 'C'], Fm: ['F', 'Ab', 'C'], Eb: ['Eb', 'G', 'Bb'], Ab: ['Ab', 'C', 'Eb'],
    Bm: ['B', 'D', 'F#'], 'F#m': ['F#', 'A', 'C#'], 'F#': ['F#', 'A#', 'C#'], 'C#m': ['C#', 'E', 'G#'], 'C#': ['C#', 'F', 'G#'], B: ['B', 'D#', 'F#'], Db: ['Db', 'F', 'Ab'], Gb: ['Gb', 'Bb', 'Db'],
    'G#dim': ['G#', 'B', 'D'], 'C#dim': ['C#', 'E', 'G'], Bdim: ['B', 'D', 'F'], Gsus: ['G', 'C', 'D'], Asus: ['A', 'D', 'E'], Esus: ['E', 'A', 'B'], Dsus: ['D', 'G', 'A'],
  };
  // vozes ascendentes a partir de uma oitava
  const voice = (ch, o) => { const n = CH[ch]; let oc = o, prev = -1; return n.map((x) => { const p = PC[x]; if (prev >= 0 && p <= prev) oc++; prev = p; return x + oc; }); };
  const R = (s, n) => Array(n).fill(s).join(' ');
  // acordes sustentados (um por compasso)
  const pad = (prog, o, bar) => prog.map((c) => voice(c, o).join('+') + ':' + bar).join(' ');
  // baixo/ostinato: padrão [grau, duração, acento]; grau 0 = fundamental, 1 = terceira, 2 = quinta, 3 = oitava, 'r' = pausa
  const pat = (prog, o, p) => prog.map((c) => { const v = voice(c, o), v8 = voice(c, o + 1); return p.map(([g, d, a]) => (g === 'r' ? 'r' : g === 3 ? v8[0] : v[g]) + ':' + d + (a ? '!' : '')).join(' '); }).join(' ');
  // arpejo: índices sobre [fund., 3.ª, 5.ª, 8.ª, 10.ª]
  const arp = (prog, o, idx, d) => prog.map((c) => { const v = voice(c, o), w = voice(c, o + 1), all = v.concat(w); return idx.map((i) => all[i] + ':' + d).join(' '); }).join(' ');
  const rest = (n) => 'r:' + n;
  const bars = (...b) => b.join(' ');

  // ---------------- O Coveiro — "A Pá e a Lanterna" (ré menor, marcha fúnebre) ----------------
  {
    const P = ['Dm', 'Dm', 'Bb', 'A', 'Dm', 'Gm', 'Bb', 'A', 'Gm', 'Dm', 'Eb', 'A', 'Dm', 'Bb', 'Gm', 'A'];
    M.sb_coveiro = { bpm: 104, fadeIn: 0.4, parts: [
      { inst: 'bigbell', vol: 0.45, notes: R('D2:8!', 8) },
      { inst: 'cello', vol: 0.8, notes: pat(P, 2, [[0, 0.5, 1], [0, 0.5], ['r', 0.5], [0, 0.5], [2, 1], [0, 1]]) },
      { inst: 'taiko', vol: 0.85, notes: R('D1:1! r:0.5 D1:0.5 D1:1 r:1', 16) },
      // tema: a pá a cair — quarta descendente e regresso arrastado
      { inst: 'brass', vol: 0.62, notes: bars(
        'D4:2 A3:1 C4:1', 'D4:3 r:1', 'F4:1.5 E4:0.5 D4:1 Bb3:1', 'A3:4',
        'D4:2 A3:1 C4:1', 'D4:1 F4:1 G4:2', 'F4:1 E4:1 D4:1 Bb3:1', 'C#4:4',
        'G4:2 F4:1 E4:1', 'F4:2 D4:2', 'Eb4:1.5 D4:0.5 C4:1 Bb3:1', 'A3:2 C#4:2',
        'D4:2 F4:1 A4:1', 'Bb4:2 A4:1 G4:1', 'G4:1 F4:1 E4:1 D4:1', 'C#4:2 E4:1 A3:1') },
      { inst: 'choirlow', vol: 0.4, notes: pad(P, 3, 4) },
      { inst: 'snare', vol: 0.45, minInt: 1, notes: R('r:1 C4:0.5 C4:0.5 r:1 C4:0.25 C4:0.25 C4:0.5!', 16) },
      { inst: 'strings', vol: 0.4, minInt: 1, notes: arp(P, 4, [0, 2, 1, 2, 3, 2, 1, 2], 0.5) },
    ] };
  }
  // ---------------- A Velha Matilheira — "Trompa de Caça" (lá menor, galope a 144) ----------------
  {
    const P = ['Am', 'Am', 'F', 'G', 'Am', 'Am', 'Dm', 'E', 'F', 'G', 'Am', 'Am', 'Dm', 'F', 'E', 'E'];
    M.sb_matilheira = { bpm: 144, fadeIn: 0.4, parts: [
      { inst: 'taiko', vol: 0.8, notes: R('A1:0.5! r:0.25 A1:0.25 A1:0.5 r:0.5 A1:0.5! A1:0.5 A1:0.5 r:0.5', 16) },
      { inst: 'hat', vol: 0.5, notes: R('C6:0.5 C6:0.25 C6:0.25', 64) },
      { inst: 'strings', vol: 0.5, notes: arp(P, 3, [0, 0, 2, 0, 1, 0, 2, 0, 0, 0, 2, 0, 3, 2, 1, 2], 0.25) },
      // tema: a chamada de caça — quintas e oitavas, a resposta em escala descendente
      { inst: 'brass', vol: 0.66, notes: bars(
        'A3:0.5 E4:0.5 A4:2 r:1', 'G4:0.5 E4:0.5 C4:1 E4:2', 'F4:1 C4:1 A3:1 C4:1', 'D4:2 B3:2',
        'A3:0.5 E4:0.5 A4:2 r:1', 'C5:0.5 B4:0.5 A4:1 E4:2', 'F4:1 E4:1 D4:1 A3:1', 'G#3:2 B3:2',
        'C4:1 A3:1 F4:2', 'D4:1 B3:1 G4:2', 'E4:1 A4:1 C5:1 B4:1', 'A4:3 r:1',
        'D5:1 C5:1 A4:1 F4:1', 'C5:1 A4:1 F4:2', 'E4:1 G#4:1 B4:1 D5:1', 'E5:2 B4:1 G#4:1') },
      { inst: 'bass', vol: 0.7, notes: pat(P, 1, [[0, 1, 1], [0, 0.5], [2, 0.5], [0, 1], [3, 1]]) },
      { inst: 'choirlow', vol: 0.35, minInt: 1, notes: pad(P, 3, 4) },
    ] };
  }
  // ---------------- Sir Caedmon — "O Juramento" (mi menor, marcha heroica) ----------------
  {
    const P = ['Em', 'C', 'G', 'D', 'Em', 'C', 'Am', 'B', 'C', 'G', 'Am', 'Em', 'C', 'D', 'B', 'B'];
    M.b_caedmon = { bpm: 104, fadeIn: 0.5, parts: [
      { inst: 'timp', vol: 0.7, notes: pat(P, 2, [[0, 1, 1], [0, 0.5], [0, 0.5], [2, 1], [0, 1]]) },
      { inst: 'snare', vol: 0.5, notes: R('C4:0.5! C4:0.25 C4:0.25 C4:0.5 C4:0.5 C4:0.5! C4:0.25 C4:0.25 C4:1', 16) },
      // tema: o juramento — subida de quarta, nota longa, descida em pontuado
      { inst: 'brass', vol: 0.66, notes: bars(
        'B3:1 E4:2 F#4:1', 'G4:3 E4:1', 'D4:1.5 G4:0.5 B4:2', 'A4:3 F#4:1',
        'G4:1 F#4:1 E4:2', 'E4:1 G4:1 C5:2', 'B4:1.5 A4:0.5 G4:1 F#4:1', 'F#4:4',
        'G4:2 E4:1 C4:1', 'D4:2 G4:2', 'A4:1 C5:1 B4:1 A4:1', 'G4:2 E4:2',
        'E5:2 D5:1 C5:1', 'D5:2 A4:2', 'B4:1 D#5:1 F#5:1 B4:1', 'B4:4') },
      { inst: 'strings', vol: 0.5, notes: arp(P, 3, [0, 1, 2, 3], 1) },
      { inst: 'cello', vol: 0.65, notes: pat(P, 2, [[0, 2], [2, 2]]) },
      { inst: 'choir', vol: 0.4, minInt: 1, notes: pad(P, 3, 4) },
      { inst: 'bell', vol: 0.18, minInt: 2, notes: R('E5:2 B4:2', 16) },
    ] };
  }
  // ---------------- O Autómato do Fole — "Engrenagem" (mi frígio, máquina) ----------------
  {
    const P = ['Em', 'Em', 'F', 'Em', 'Em', 'Em', 'D', 'F', 'Em', 'Em', 'F', 'G', 'Am', 'F', 'F', 'Em'];
    M.sb_automato = { bpm: 128, fadeIn: 0.4, parts: [
      { inst: 'taiko', vol: 0.85, notes: R('E1:0.5! E1:0.5 r:0.5 E1:0.5 r:0.5 E1:0.5! r:1', 16) },
      // bigorna nos contratempos (3+3+2)
      { inst: 'bell', vol: 0.16, notes: R('B5:0.75 B5:0.75 B5:0.5 r:2', 16) },
      { inst: 'bass', vol: 0.75, notes: pat(P, 2, [[0, 0.25, 1], [0, 0.25], [3, 0.25], [0, 0.25], [2, 0.25], [0, 0.25], [1, 0.25], [0, 0.25], [0, 0.25, 1], [0, 0.25], [3, 0.25], [0, 0.25], [2, 0.25], [1, 0.25], [2, 0.25], [3, 0.25]]) },
      // tema: o fole a respirar — meio-tom frígio (mi–fá) repetido como um pistão
      { inst: 'brass', vol: 0.55, notes: bars(
        'E3:1.5 F3:0.5 E3:2', 'r:2 B3:1 G3:1', 'F3:1.5 G3:0.5 F3:2', 'E3:4',
        'E3:1.5 F3:0.5 E3:2', 'G3:1 A3:1 B3:2', 'A3:1 F#3:1 D3:2', 'F3:2 E3:2',
        'E4:1.5 F4:0.5 E4:2', 'D4:1 B3:1 G3:2', 'F4:1.5 E4:0.5 C4:2', 'D4:1 B3:1 G3:2',
        'A3:1 C4:1 E4:2', 'F4:2 C4:2', 'A3:1 F3:1 E3:1 F3:1', 'E3:4') },
      { inst: 'drone', vol: 0.45, notes: R('E1:16', 4) },
      { inst: 'snare', vol: 0.55, minInt: 1, notes: R('r:1 C4:1! r:1 C4:0.5 C4:0.5', 16) },
      { inst: 'choirlow', vol: 0.3, minInt: 1, notes: pad(P, 3, 4) },
    ] };
  }
  // ---------------- Mestra Hilde — "Canção da Bigorna" (sol menor, canto de trabalho) ----------------
  {
    const P = ['Gm', 'Gm', 'Eb', 'D', 'Gm', 'Cm', 'D', 'D', 'Eb', 'Bb', 'Cm', 'D', 'Gm', 'Eb', 'Cm', 'D'];
    M.b_hilde = { bpm: 116, fadeIn: 0.5, parts: [
      // martelo: duas pancadas fortes e uma leve, como na forja
      { inst: 'bell', vol: 0.2, notes: R('G5:1! G5:1! G5:0.5 r:1.5', 16) },
      { inst: 'taiko', vol: 0.85, notes: R('G1:1! r:1 G1:0.5 G1:0.5 r:1', 16) },
      // tema: o canto de trabalho, de pergunta e resposta
      { inst: 'choirlow', vol: 0.55, notes: bars(
        'G3:1 Bb3:1 D4:2', 'C4:1 Bb3:1 A3:2', 'G3:1 Bb3:1 Eb4:2', 'D4:4',
        'G3:1 Bb3:1 D4:2', 'Eb4:1 D4:1 C4:2', 'A3:1 C4:1 F#3:2', 'G3:2 A3:2',
        'Bb3:1 Eb4:1 G4:2', 'F4:1 D4:1 Bb3:2', 'C4:1 Eb4:1 G4:1 F4:1', 'F#4:2 D4:2',
        'G4:2 D4:1 Bb3:1', 'Eb4:2 G3:2', 'C4:1 Eb4:1 D4:1 C4:1', 'D4:4') },
      { inst: 'brass', vol: 0.55, notes: pad(P, 3, 4) },
      { inst: 'bass', vol: 0.7, notes: pat(P, 1, [[0, 1, 1], [3, 1], [2, 1], [3, 1]]) },
      { inst: 'strings', vol: 0.45, minInt: 1, notes: arp(P, 4, [0, 1, 2, 1], 1) },
      { inst: 'snare', vol: 0.45, minInt: 1, notes: R('r:0.5 C4:0.5 r:0.5 C4:0.5 r:0.5 C4:0.5 C4:0.5 C4:0.5!', 16) },
    ] };
  }
  // ---------------- A Mãe-Mariposa — "Pó das Asas" (si menor, esvoaçar) ----------------
  {
    const P = ['Bm', 'G', 'D', 'A', 'Bm', 'G', 'Em', 'F#', 'G', 'D', 'Em', 'Bm', 'G', 'A', 'F#', 'F#'];
    M.sb_mariposa = { bpm: 108, fadeIn: 0.5, parts: [
      { inst: 'glass', vol: 0.45, notes: arp(P, 4, [0, 2, 3, 2, 1, 2, 3, 4, 3, 2, 1, 2, 0, 2, 1, 2], 0.25) },
      // tema: flauta a pairar, saltos de terça como asas
      { inst: 'flute', vol: 0.6, notes: bars(
        'F#5:2 D5:1 B4:1', 'D5:1.5 B4:0.5 G4:2', 'A4:1 D5:1 F#5:2', 'E5:3 r:1',
        'F#5:2 D5:1 B4:1', 'G5:1.5 F#5:0.5 D5:2', 'E5:1 G5:1 B4:2', 'A#4:4',
        'B4:1 D5:1 G5:2', 'F#5:1 D5:1 A4:2', 'G5:1 E5:1 B4:2', 'D5:2 F#5:2',
        'G5:2 F#5:1 E5:1', 'E5:2 C#5:2', 'C#5:1 E5:1 F#5:1 A#5:1', 'F#5:4') },
      { inst: 'harp', vol: 0.45, notes: arp(P, 3, [0, 2, 3, 2], 1) },
      { inst: 'strings', vol: 0.4, notes: pad(P, 3, 4) },
      { inst: 'hat', vol: 0.35, minInt: 1, notes: R('C6:0.25 C6:0.25 C6:0.5', 64) },
      { inst: 'choir', vol: 0.35, minInt: 1, notes: pad(P, 4, 4) },
    ] };
  }
  // ---------------- A Carpideira — "Pranto" (ré menor, 3/4 lento: coro, lamento, sino de finados e um coração) ----------------
  {
    const P = ['Dm', 'Dm', 'Eb', 'Dm', 'Gm', 'Gm', 'A', 'A', 'Dm', 'Bb', 'Gm', 'Eb', 'Dm', 'Eb', 'A', 'Dm'];
    M.b_carpideira = { bpm: 78, fadeIn: 1.2, parts: [
      { inst: 'choir', vol: 0.5, notes: pad(P, 3, 3) },
      { inst: 'flute', vol: 0.62, notes: bars(
        'A4:2 Bb4:1', 'A4:3', 'G4:1 Bb4:1 Eb5:1', 'D5:3',
        'D5:2 C5:1', 'Bb4:2 A4:1', 'A4:1.5 G4:0.5 E4:1', 'A4:3',
        'F5:2 E5:1', 'D5:1.5 F5:0.5 Bb4:1', 'G4:1 Bb4:1 D5:1', 'Eb5:2 D5:1',
        'D5:1 F5:1 A5:1', 'G5:1.5 F5:0.5 Eb5:1', 'C#5:2 E5:1', 'D5:3') },
      { inst: 'cello', vol: 0.5, notes: arp(P, 2, [0, 2, 3], 1) },
      { inst: 'bigbell', vol: 0.4, notes: R('D3:3 r:3', 8) },
      { inst: 'heart', vol: 0.5, notes: R('D2:0.5 D2:0.5 r:2', 16) },
      { inst: 'strings', vol: 0.35, minInt: 1, notes: pad(P, 4, 3) },
      { inst: 'timp', vol: 0.5, minInt: 1, notes: R('D2:1 r:1 A1:1', 16) },
      { inst: 'choirlow', vol: 0.4, minInt: 1, notes: pad(P, 2, 3) },
    ] };
  }
  // ---------------- Ama Elowen — "Embala, Embala" (fá# menor, valsa de caixa de música) ----------------
  {
    const P = ['F#m', 'F#m', 'D', 'C#', 'F#m', 'Bm', 'C#', 'C#', 'D', 'A', 'Bm', 'F#m', 'D', 'Bm', 'C#', 'F#m'];
    const W = P.map((c) => { const v = voice(c, 4); return 'r:1 ' + v.join('+') + ':1 ' + v.join('+') + ':1'; }).join(' ');
    M.b_elowen = { bpm: 96, fadeIn: 0.8, parts: [
      // tema: a canção de embalar (caixa de música) — 3/4
      { inst: 'glass', vol: 0.55, notes: bars(
        'C#5:1.5 B4:0.5 A4:1', 'A4:2 F#4:1', 'F#4:1 A4:1 D5:1', 'C#5:3',
        'C#5:1.5 B4:0.5 A4:1', 'B4:1 D5:1 F#5:1', 'E#5:1.5 D5:0.5 C#5:1', 'C#5:3',
        'D5:1.5 C#5:0.5 A4:1', 'A4:1 C#5:1 E5:1', 'D5:1 B4:1 F#4:1', 'A4:2 C#5:1',
        'F#5:1.5 E5:0.5 D5:1', 'D5:1 B4:1 D5:1', 'C#5:1 B4:1 G#4:1', 'F#4:3') },
      { inst: 'harp', vol: 0.4, notes: W },
      { inst: 'cello', vol: 0.6, notes: pat(P, 2, [[0, 3]]) },
      { inst: 'strings', vol: 0.35, notes: pad(P, 3, 3) },
      { inst: 'choir', vol: 0.4, minInt: 1, notes: bars('r:12', 'A3:3 C#4:3 D4:3 C#4:3', 'r:12', 'F#4:3 D4:3 E#4:3 F#4:3') },
      { inst: 'timp', vol: 0.45, minInt: 1, notes: pat(P, 2, [[0, 1, 1], ['r', 2]]) },
    ] };
  }
  // ---------------- O Sineiro — "Dobre de Finados" (dó menor, sinos e tímpanos) ----------------
  {
    const P = ['Cm', 'Cm', 'Ab', 'G', 'Cm', 'Fm', 'G', 'G', 'Ab', 'Eb', 'Fm', 'Cm', 'Ab', 'Fm', 'G', 'G'];
    M.sb_sineiro = { bpm: 112, fadeIn: 0.4, parts: [
      { inst: 'bigbell', vol: 0.55, notes: R('C2:4! G1:4', 8) },
      { inst: 'bell', vol: 0.18, notes: R('G4:1 Eb4:1 C4:1 G3:1', 16) },
      { inst: 'timp', vol: 0.7, notes: pat(P, 2, [[0, 1, 1], ['r', 1], [0, 0.5], [0, 0.5], [2, 1]]) },
      // tema: a corda a ser puxada — nota repetida e queda de quinta
      { inst: 'brass', vol: 0.6, notes: bars(
        'C4:1 C4:1 C4:1 G3:1', 'Eb4:3 D4:1', 'C4:1 Eb4:1 Ab4:2', 'G4:4',
        'C4:1 C4:1 C4:1 G3:1', 'F4:2 Ab4:2', 'G4:1 F4:1 Eb4:1 D4:1', 'D4:4',
        'Eb4:1 Eb4:1 Eb4:1 C4:1', 'Bb4:2 G4:2', 'Ab4:1 G4:1 F4:1 Ab4:1', 'G4:2 Eb4:2',
        'C5:2 Ab4:2', 'F4:2 Ab4:1 C5:1', 'B4:1 D5:1 G4:2', 'G4:4') },
      { inst: 'cello', vol: 0.6, notes: pad(P, 2, 4) },
      { inst: 'choirlow', vol: 0.4, minInt: 1, notes: pad(P, 3, 4) },
      { inst: 'gong', vol: 0.4, minInt: 1, notes: R('C2:16!', 4) },
    ] };
  }
  // ---------------- Corvin, o Menestrel — "Tarantela da Coroa" (ré dórico, 120: os ataques vão no tempo) ----------------
  {
    const P = ['Dm', 'G', 'Dm', 'C', 'Dm', 'G', 'Am', 'Am', 'F', 'C', 'Dm', 'Am', 'Bb', 'C', 'Dm', 'Dm'];
    M.b_corvin = { bpm: 120, fadeIn: 0.4, parts: [
      { inst: 'taiko', vol: 0.8, notes: R('D1:1! D1:1 D1:1! D1:1', 16) },
      { inst: 'hat', vol: 0.45, notes: R('C6:0.5 C6:0.5', 64) },
      // tema: tarantela no alaúde — semicolcheias em roda
      { inst: 'lute', vol: 0.75, notes: bars(
        'D4:0.5 E4:0.5 F4:0.5 A4:0.5 G4:0.5 F4:0.5 E4:0.5 D4:0.5', 'B3:0.5 D4:0.5 G4:1 F4:0.5 E4:0.5 D4:1', 'D4:0.5 E4:0.5 F4:0.5 A4:0.5 D5:1 A4:1', 'G4:0.5 E4:0.5 C4:1 E4:2',
        'D4:0.5 E4:0.5 F4:0.5 A4:0.5 G4:0.5 F4:0.5 E4:0.5 D4:0.5', 'B3:0.5 D4:0.5 G4:1 B4:0.5 A4:0.5 G4:1', 'A4:0.5 C5:0.5 E5:1 D5:0.5 C5:0.5 B4:1', 'A4:4',
        'F4:0.5 A4:0.5 C5:1 A4:0.5 F4:0.5 C4:1', 'E4:0.5 G4:0.5 C5:1 G4:0.5 E4:0.5 C4:1', 'D4:0.5 F4:0.5 A4:1 D5:1 F5:1', 'E5:0.5 D5:0.5 C5:0.5 B4:0.5 A4:2',
        'Bb4:0.5 A4:0.5 G4:0.5 F4:0.5 D4:2', 'C4:0.5 E4:0.5 G4:0.5 B4:0.5 C5:2', 'D5:0.5 C5:0.5 A4:0.5 F4:0.5 E4:0.5 C#4:0.5 D4:1', 'D4:3 r:1') },
      { inst: 'bass', vol: 0.7, notes: pat(P, 2, [[0, 1, 1], [2, 1], [0, 1], [2, 1]]) },
      { inst: 'flute', vol: 0.45, minInt: 1, notes: bars(rest(32), 'A5:2 F5:2 G5:2 E5:2 F5:2 D5:2 E5:2 C#5:2', 'D5:4 E5:4 F5:4 A5:4') },
      { inst: 'strings', vol: 0.4, minInt: 1, notes: pad(P, 3, 4) },
      { inst: 'brass', vol: 0.5, minInt: 2, notes: pat(P, 3, [[0, 1, 1], ['r', 1], [2, 1, 1], ['r', 1]]) },
    ] };
  }
  // ---------------- Inquisidora Vael — "Auto de Fé" (lá frígio, coro litúrgico e gongo) ----------------
  {
    const P = ['Am', 'Bb', 'Am', 'Gm', 'Am', 'Bb', 'C', 'Bb', 'Dm', 'Bb', 'Am', 'Am', 'Dm', 'Gm', 'Bb', 'Am'];
    M.sb_vael = { bpm: 126, fadeIn: 0.4, parts: [
      // tema: o salmo da sentença, em semitom frígio (lá–sib), cantado como acusação
      { inst: 'choir', vol: 0.6, notes: bars(
        'A4:1 A4:1 Bb4:1 A4:1', 'G4:2 A4:2', 'A4:1 C5:1 Bb4:1 A4:1', 'G4:4',
        'A4:1 A4:1 Bb4:1 A4:1', 'D5:2 C5:1 Bb4:1', 'C5:1 Bb4:1 A4:1 G4:1', 'A4:4',
        'D5:1 D5:1 E5:1 F5:1', 'D5:2 Bb4:2', 'C5:1 Bb4:1 A4:2', 'A4:4',
        'F5:2 E5:1 D5:1', 'D5:1 Bb4:1 G4:2', 'Bb4:1 A4:1 G4:1 Bb4:1', 'A4:4') },
      { inst: 'choirlow', vol: 0.45, notes: pad(P, 2, 4) },
      { inst: 'taiko', vol: 0.8, notes: R('A1:1! r:0.5 A1:0.5 A1:0.5 A1:0.5 r:1', 16) },
      { inst: 'gong', vol: 0.4, notes: R('A1:16!', 4) },
      { inst: 'strings', vol: 0.45, notes: arp(P, 3, [0, 1, 2, 1, 0, 1, 2, 3], 0.5) },
      { inst: 'organ', vol: 0.3, minInt: 1, notes: pad(P, 3, 4) },
    ] };
  }
  // ---------------- Os Gémeos — "Duas Lâminas" (sol menor, cânone a duas vozes) ----------------
  {
    const P = ['Gm', 'D', 'Gm', 'F', 'Eb', 'Bb', 'Cm', 'D', 'Gm', 'D', 'Eb', 'F', 'Bb', 'Cm', 'D', 'D'];
    const theme = bars('G4:1 D4:1 Bb4:2', 'A4:1 F#4:1 D4:2', 'G4:1 Bb4:1 D5:2', 'C5:2 A4:2',
      'Bb4:1 G4:1 Eb4:2', 'F4:1 D4:1 Bb3:2', 'C4:1 Eb4:1 G4:2', 'F#4:4',
      'G4:1 D4:1 Bb4:2', 'A4:1 F#4:1 D4:2', 'Eb4:1 G4:1 C5:2', 'C5:1 A4:1 F4:2',
      'D5:2 Bb4:2', 'Eb5:1 C5:1 G4:2', 'F#4:1 A4:1 D5:2', 'D5:4');
    M.sb_gemeos = { bpm: 132, fadeIn: 0.4, parts: [
      { inst: 'brass', vol: 0.6, pan: -0.4, notes: theme },
      // a segunda voz entra um compasso depois (cânone), uma oitava abaixo
      { inst: 'brass', vol: 0.5, pan: 0.4, oct: -1, notes: 'r:4 ' + theme.split(' ').slice(0, -1).join(' ') },
      { inst: 'snare', vol: 0.5, notes: R('C4:0.5! C4:0.5 r:0.5 C4:0.5 C4:0.25 C4:0.25 C4:0.5 r:0.5 C4:0.5!', 16) },
      { inst: 'timp', vol: 0.65, notes: pat(P, 2, [[0, 1, 1], [2, 1], [0, 1, 1], [2, 1]]) },
      { inst: 'strings', vol: 0.45, notes: arp(P, 3, [0, 2, 1, 2], 1) },
      { inst: 'choirlow', vol: 0.35, minInt: 1, notes: pad(P, 3, 4) },
    ] };
  }
  // ---------------- Bispo Ozias — "Tocata do Cálice" (ré menor, órgão) ----------------
  {
    const P = ['Dm', 'A', 'Dm', 'C', 'F', 'C', 'Gm', 'A', 'Dm', 'Gm', 'C', 'F', 'Bb', 'Gm', 'A', 'A'];
    M.b_ozias = { bpm: 100, fadeIn: 0.6, parts: [
      // tocata: arpejos do órgão em semicolcheias
      { inst: 'organ', vol: 0.5, notes: arp(P, 3, [0, 2, 3, 4, 3, 2, 3, 2, 0, 2, 3, 4, 3, 2, 1, 2], 0.25) },
      // tema: o cálice erguido — subida lenta e queda de sétima
      { inst: 'organ', vol: 0.45, oct: 1, notes: bars(
        'D4:2 F4:1 A4:1', 'C#5:3 A4:1', 'D5:2 C5:1 Bb4:1', 'C5:2 E4:2',
        'F4:2 A4:1 C5:1', 'E5:2 G4:2', 'Bb4:1.5 A4:0.5 G4:1 D4:1', 'C#4:4',
        'F4:2 E4:1 D4:1', 'G4:2 Bb4:2', 'C5:1.5 Bb4:0.5 A4:1 G4:1', 'A4:4',
        'D5:2 Bb4:1 F4:1', 'G4:2 Bb4:2', 'A4:1 C#5:1 E5:2', 'A4:4') },
      { inst: 'choir', vol: 0.45, notes: pad(P, 3, 4) },
      { inst: 'bass', vol: 0.6, notes: pat(P, 1, [[0, 2], [0, 2]]) },
      { inst: 'taiko', vol: 0.6, minInt: 1, notes: R('D1:2! D1:1 D1:1', 16) },
      { inst: 'brass', vol: 0.5, minInt: 2, notes: pad(P, 3, 4) },
      { inst: 'bigbell', vol: 0.35, minInt: 2, notes: R('D2:16!', 4) },
    ] };
  }
  // ---------------- O Rei Aldric — "Coroa de Cinza" (dó menor, coral e metais régios) ----------------
  {
    const P = ['Cm', 'Ab', 'Eb', 'Bb', 'Cm', 'Fm', 'G', 'G', 'Ab', 'Eb', 'Fm', 'Cm', 'Ab', 'Bb', 'G', 'G'];
    M.b_aldric = { bpm: 112, fadeIn: 0.6, parts: [
      // tema: o hino do rei — nobre, em semínimas pontuadas, e a queda para o fim
      { inst: 'brass', vol: 0.62, notes: bars(
        'C4:1.5 Eb4:0.5 G4:2', 'Ab4:2 G4:1 F4:1', 'G4:1.5 Bb4:0.5 Eb5:2', 'D5:4',
        'C5:1.5 Bb4:0.5 G4:2', 'Ab4:1 C5:1 F4:2', 'G4:1 F4:1 Eb4:1 D4:1', 'B3:4',
        'C4:2 Eb4:1 Ab4:1', 'G4:2 Bb4:2', 'Ab4:1 G4:1 F4:1 Ab4:1', 'G4:2 C5:2',
        'Eb5:2 C5:1 Ab4:1', 'F4:2 D5:2', 'D5:1 C5:1 B4:1 D5:1', 'G4:4') },
      { inst: 'choir', vol: 0.5, notes: pad(P, 3, 4) },
      { inst: 'strings', vol: 0.45, notes: arp(P, 3, [0, 1, 2, 3, 2, 1, 2, 1], 0.5) },
      { inst: 'taiko', vol: 0.75, notes: R('C1:1! r:0.5 C1:0.5 C1:1 C1:0.5 C1:0.5', 16) },
      { inst: 'cello', vol: 0.6, notes: pat(P, 2, [[0, 2], [2, 1], [0, 1]]) },
      { inst: 'snare', vol: 0.45, minInt: 1, notes: R('C4:0.25 C4:0.25 C4:0.5! r:1 C4:0.25 C4:0.25 C4:0.5! r:1', 16) },
      { inst: 'gong', vol: 0.45, minInt: 2, notes: R('C2:16!', 4) },
    ] };
  }
  // ---------------- O Eco de Seraphine — "A Última Chama" (mi bemol, etéreo) ----------------
  {
    const P = ['Cm', 'Ab', 'Eb', 'Bb', 'Cm', 'Ab', 'Fm', 'G', 'Ab', 'Eb', 'Bb', 'Cm', 'Ab', 'Fm', 'G', 'G'];
    M.b_seraphine = { bpm: 84, fadeIn: 1.2, parts: [
      { inst: 'harp', vol: 0.5, notes: arp(P, 3, [0, 2, 3, 4, 3, 2, 3, 2], 0.5) },
      // tema: a chama a vacilar — a voz sobe e hesita
      { inst: 'glass', vol: 0.5, notes: bars(
        'G5:2 Eb5:1 C5:1', 'C5:2 Eb5:2', 'Bb4:1 Eb5:1 G5:2', 'F5:4',
        'G5:2 Eb5:1 C5:1', 'Ab5:2 C5:2', 'Ab4:1 C5:1 F5:2', 'D5:4',
        'Eb5:2 C5:1 Ab4:1', 'G4:2 Bb4:2', 'D5:1 F5:1 Bb5:2', 'G5:4',
        'Ab5:2 Eb5:2', 'F5:1 Ab5:1 C6:2', 'B5:1 D6:1 G5:2', 'G5:4') },
      { inst: 'choir', vol: 0.45, notes: pad(P, 4, 4) },
      { inst: 'strings', vol: 0.4, minInt: 1, notes: pad(P, 3, 4) },
      { inst: 'timp', vol: 0.45, minInt: 2, notes: pat(P, 2, [[0, 1, 1], ['r', 3]]) },
      { inst: 'bell', vol: 0.15, minInt: 1, notes: R('C6:4 G5:4', 8) },
    ] };
  }
})(window.VS);
