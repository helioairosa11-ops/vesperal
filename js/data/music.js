// Vesperal — banda sonora original, composta nota a nota e sintetizada em tempo real.
// Notação: "NOTA:duração" (duração em tempos), "r" = pausa, "A+B" = acorde, "!" = acento.
'use strict';
(function (VS) {
  const R = (s, n) => Array(n).fill(s).join(' ');
  // arpejo: lista de acordes "D3 A3 D4 F4", padrão de índices, duração de cada nota
  const arp = (chords, pat, d) => chords.map((ch) => { const n = ch.split(' '); return pat.map((i) => n[i] + ':' + d).join(' '); }).join(' ');
  // valsa: baixo não incluído; acorde nos tempos 2 e 3
  const waltz = (chords) => chords.map((ch) => 'r:1 ' + ch + ':1 ' + ch + ':1').join(' ');
  const chords = (list, d) => list.map((c) => c + ':' + d).join(' ');

  const M = {};

  // ---------------- Menu principal: "Vesperal" ----------------
  M.menu = {
    // A: o tema ao piano sobre a harpa; B: a flauta leva uma melodia mais esperançosa (Sib → Fá → Dó → Rém),
    // o piano passa a contracanto, o coro e os tímpanos crescem; um sino fecha cada secção
    bpm: 66, fadeIn: 3,
    parts: [
      { inst: 'piano', vol: 0.9, notes:
        'A4:1.5 D5:0.5 F5:1 E5:1 D5:2 F5:1 D5:1 C5:1.5 A4:0.5 F4:1 A4:1 G4:3 r:1 ' +
        'A4:1.5 D5:0.5 F5:1 A5:1 G5:2 F5:1 D5:1 F5:1.5 E5:0.5 D5:1 E5:1 C#5:3 r:1 ' +
        'D5:1 A4:1 F5:1.5 E5:0.5 D5:2 Bb4:2 C5:1 A4:1 C5:1 F5:1 E5:3 r:1 ' +
        'F5:1 E5:1 D5:1 A4:1 Bb4:2 D5:1 G5:1 F5:1.5 E5:0.5 D5:1 C#5:1 D5:4 ' +
        'Bb3:1 D4:1 F4:1 D4:1 A3:1 C4:1 F4:1 C4:1 G3:1 C4:1 E4:1 C4:1 A3:1 D4:1 F4:1 D4:1 ' +
        'Bb3:1 D4:1 G4:1 D4:1 Bb3:1 D4:1 F4:1 D4:1 A3:1 C#4:1 E4:1 C#4:1 E4:1 C#4:1 A3:1 E3:1 ' +
        'Bb3:1 D4:1 F4:1 D4:1 A3:1 C4:1 F4:1 C4:1 G3:1 C4:1 E4:1 C4:1 A3:1 C4:1 E4:1 C4:1 ' +
        'Bb3:1 D4:1 G4:1 D4:1 A3:1 C#4:1 E4:1 C#4:1 A3:1 D4:1 F4:1 D4:1 D4:2 A3:2' },
      { inst: 'flute', vol: 0.62, notes: 'r:64 ' +
        'D5:2 F5:1 Bb5:1 A5:3 F5:1 G5:2 E5:1 C5:1 D5:3 A4:1 Bb4:1 D5:1 G5:2 F5:2 D5:1 Bb4:1 C#5:2 E5:2 A4:4 ' +
        'D5:1 F5:1 Bb5:2 A5:2 C6:2 G5:1 E5:1 G5:1 C6:1 A5:3 E5:1 Bb5:2 G5:1 D5:1 C#5:1 E5:1 A5:2 F5:2 E5:1 C#5:1 D5:4' },
      { inst: 'harp', vol: 0.55, notes: arp(['D3 A3 D4 F4', 'Bb2 F3 Bb3 D4', 'F2 C3 F3 A3', 'C3 G3 C4 E4', 'D3 A3 D4 F4', 'G2 D3 G3 Bb3', 'Bb2 F3 Bb3 D4', 'A2 E3 A3 C#4',
        'D3 A3 D4 F4', 'Bb2 F3 Bb3 D4', 'F2 C3 F3 A3', 'E2 C3 E3 G3', 'D3 A3 D4 F4', 'G2 D3 G3 Bb3', 'A2 E3 A3 C#4', 'D3 A3 D4 F4'], [0, 1, 2, 3, 2, 1, 2, 1], 0.5) + ' ' +
        arp(['Bb2 F3 Bb3 D4', 'F2 C3 F3 A3', 'C3 G3 C4 E4', 'D3 A3 D4 F4', 'G2 D3 G3 Bb3', 'Bb2 F3 Bb3 D4', 'A2 E3 A3 C#4', 'A2 E3 A3 C#4',
        'Bb2 F3 Bb3 D4', 'F2 C3 F3 A3', 'C3 G3 C4 E4', 'A2 E3 A3 C4', 'G2 D3 G3 Bb3', 'A2 E3 A3 C#4', 'D3 A3 D4 F4', 'D3 A3 D4 F4'], [0, 2, 1, 3, 2, 1, 3, 2], 0.5) },
      { inst: 'strings', vol: 0.6, notes: chords(['D3+F3+A3', 'Bb2+D3+F3', 'F3+A3+C4', 'C3+E3+G3', 'D3+F3+A3', 'G2+Bb2+D3', 'Bb2+D3+F3', 'A2+C#3+E3',
        'D3+F3+A3', 'Bb2+D3+F3', 'F3+A3+C4', 'E3+G3+C4', 'D3+F3+A3', 'G2+Bb2+D3', 'A2+C#3+E3', 'D3+F3+A3',
        'Bb2+D3+F3', 'F2+A2+C3', 'C3+E3+G3', 'D3+F3+A3', 'G2+Bb2+D3', 'Bb2+D3+F3', 'A2+C#3+E3', 'A2+C#3+E3',
        'Bb2+D3+F3', 'F3+A3+C4', 'C3+E3+G3', 'A2+C3+E3', 'G2+Bb2+D3', 'A2+C#3+E3', 'D3+F3+A3', 'D3+F3+A3'], 4) },
      { inst: 'cello', vol: 0.8, notes: 'D2:4 Bb1:4 F2:4 C2:4 D2:4 G1:4 Bb1:4 A1:4 D2:4 Bb1:4 F2:4 E2:4 D2:4 G1:4 A1:4 D2:4 ' +
        'Bb1:4 F2:4 C2:4 D2:4 G1:4 Bb1:4 A1:4 A1:4 Bb1:4 F2:4 C2:4 A1:4 G1:4 A1:4 D2:4 D2:4' },
      { inst: 'choir', vol: 0.45, notes: 'r:32 A3:8 F3:8 A3:4 G3:4 E3:8 ' +
        'D4+F4:8 C4+E4:8 Bb3+D4:8 A3+C#4:8 D4+F4:8 C4+E4:8 Bb3+D4:4 A3+C#4:4 A3+D4:8' },
      { inst: 'timp', vol: 0.4, notes: 'r:64 Bb1:1 r:15 G1:1 r:15 Bb1:1 r:15 A1:1 r:11 A1:1 A1:1 D2:2' },
      { inst: 'bell', vol: 0.22, notes: 'r:60 D6:4 r:60 A5:4' },
    ],
  };

  M.intro = {
    bpm: 60, fadeIn: 2,
    parts: [
      { inst: 'drone', vol: 0.9, notes: 'D2+A2:16 D2+A2:16' },
      { inst: 'glass', vol: 0.8, notes: 'A5:2 F5:1 E5:1 D5:2 r:2 C5:2 D5:1 E5:1 F5:3 r:1 A5:2 Bb5:1 A5:1 G5:2 F5:2 E5:3 D5:1 D5:4' },
      { inst: 'choir', vol: 0.4, notes: 'r:8 D4:8 r:8 A3:8' },
    ],
  };

  M.rest = {
    bpm: 70, fadeIn: 2,
    parts: [
      { inst: 'harp', vol: 0.7, notes: arp(['F3 C4 F4 A4', 'A2 E3 A3 C4', 'Bb2 F3 Bb3 D4', 'C3 G3 C4 E4', 'D3 A3 D4 F4', 'Bb2 F3 Bb3 D4', 'F3 C4 F4 A4', 'C3 G3 C4 E4'], [0, 1, 2, 3, 2, 3, 2, 1], 0.5) },
      { inst: 'flute', vol: 0.7, notes: 'r:4 C5:2 A4:1 Bb4:1 C5:2 D5:1 C5:1 Bb4:3 r:1 A4:2 F4:1 G4:1 A4:2 C5:2 D5:3 C5:1 A4:4' },
      { inst: 'choir', vol: 0.35, notes: chords(['F3+A3+C4', 'A2+C3+E3', 'Bb2+D3+F3', 'C3+E3+G3', 'D3+F3+A3', 'Bb2+D3+F3', 'F3+A3+C4', 'C3+E3+G3'], 4) },
    ],
  };

  // ---------------- Regiões ----------------
  M.r1 = { // Cidade Cinzenta
    bpm: 72,
    parts: [
      { inst: 'cello', vol: 0.8, notes: 'D2:8 C2:8 Bb1:8 A1:8' },
      { inst: 'strings', vol: 0.5, notes: 'D3+F3+A3:8 C3+E3+G3:8 Bb2+D3+F3:8 A2+C#3+E3:8' },
      { inst: 'flute', vol: 0.65, notes: 'A4:3 G4:1 F4:2 E4:2 D4:3 E4:1 F4:2 G4:2 A4:2 Bb4:2 A4:2 G4:2 F4:2 E4:2 D4:4 F4:3 G4:1 A4:2 C5:2 Bb4:2 A4:2 G4:4 F4:2 E4:2 D4:2 C#4:2 D4:6 r:2' },
      { inst: 'harp', vol: 0.45, notes: 'D3:1 A3:1 D4:1 F4:1 r:4 C3:1 G3:1 C4:1 E4:1 r:4 Bb2:1 F3:1 Bb3:1 D4:1 r:4 A2:1 E3:1 A3:1 C#4:1 r:4' },
      { inst: 'bell', vol: 0.25, notes: 'D5:8 r:24' },
    ],
  };
  M.sanct = { // Santuário da Última Chama
    bpm: 58, fadeIn: 2,
    parts: [
      { inst: 'organ', vol: 0.45, notes: 'D3+A3:8 F3+C4:8 G3+D4:8 A3+E4:8' },
      { inst: 'glass', vol: 0.55, notes: 'A5:4 G5:2 F5:2 E5:6 r:2 D5:4 E5:2 F5:2 E5:8' },
      { inst: 'choir', vol: 0.35, notes: 'D4:16 C4:8 C#4:8' },
    ],
  };
  M.r2 = { // Bastião das Vigias
    bpm: 92,
    parts: [
      { inst: 'snare', vol: 0.7, notes: R('C4:0.5! C4:0.25 C4:0.25 C4:0.5 C4:0.5 C4:1 C4:0.5 C4:0.5', 8) },
      { inst: 'timp', vol: 0.8, notes: R('C2:2! G1:2', 8) },
      { inst: 'brass', vol: 0.75, notes: 'C4:1.5 Eb4:0.5 G4:2 F4:1 Eb4:1 D4:2 Eb4:1.5 F4:0.5 G4:1 Ab4:1 G4:4 C5:1.5 Bb4:0.5 Ab4:2 G4:1 F4:1 Eb4:2 D4:1 Eb4:1 F4:1 D4:1 C4:4' },
      { inst: 'strings', vol: 0.5, notes: chords(['C3+Eb3+G3', 'Bb2+D3+F3', 'Ab2+C3+Eb3', 'G2+B2+D3', 'C3+Eb3+G3', 'Eb3+G3+Bb3', 'F3+Ab3+C4', 'G2+B2+D3'], 4) },
      { inst: 'cello', vol: 0.6, notes: R('C2:0.5 C2:0.5 C3:0.5 C2:0.5 G1:0.5 G1:0.5 G2:0.5 G1:0.5', 8) },
    ],
  };
  M.r3 = { // Forjas Submersas
    bpm: 100,
    parts: [
      { inst: 'bell', vol: 0.18, notes: R('E6:1! r:0.5 E6:0.5 r:1 E6:0.5 E6:0.5', 8) },
      { inst: 'taiko', vol: 0.8, notes: R('E1:1! r:1 E1:0.5 E1:0.5 r:1', 8) },
      { inst: 'bass', vol: 0.8, notes: R('E2:0.5 E2:0.5 F2:0.5 E2:0.5 G2:0.5 E2:0.5 F2:0.5 E2:0.5', 8) },
      { inst: 'choirlow', vol: 0.45, notes: 'E3:4 F3:4 E3:4 D3:2 F3:2 E3:4 F3:4 G3:4 F3:4' },
      { inst: 'drone', vol: 0.6, notes: 'E1+B1:32' },
      { inst: 'brass', vol: 0.4, notes: 'r:16 E3:2 F3:2 G3:2 F3:2 E3:6 r:2' },
    ],
  };
  M.r4 = { // Jardins Afogados
    bpm: 80,
    parts: [
      { inst: 'harp', vol: 0.6, notes: arp(['A2 E3 B3 C4', 'F2 C3 E3 A3', 'C3 G3 C4 E4', 'G2 D3 G3 B3', 'D3 A3 D4 F4', 'A2 E3 B3 C4', 'E2 B2 E3 G#3', 'A2 E3 A3 C4'], [0, 1, 2, 3, 2, 3, 2, 1], 0.5) },
      { inst: 'flute', vol: 0.6, notes: 'E5:3 D5:1 C5:2 B4:2 A4:3 C5:1 E5:4 G5:2 F5:1 E5:1 D5:2 C5:2 B4:4 G4:4 F5:3 E5:1 D5:2 C5:2 B4:2 C5:2 E5:4 D5:2 C5:1 B4:1 G#4:2 B4:2 A4:8' },
      { inst: 'pad', vol: 0.6, notes: chords(['A2+C3+E3', 'F2+A2+C3', 'C3+E3+G3', 'G2+B2+D3', 'D3+F3+A3', 'A2+C3+E3', 'E2+G#2+B2', 'A2+C3+E3'], 4) },
      { inst: 'glass', vol: 0.35, notes: 'r:12 E6:2 r:14 A6:2 r:2' },
    ],
  };
  M.r5 = { // Torre dos Sinos
    bpm: 76,
    parts: [
      { inst: 'bigbell', vol: 0.5, notes: 'G2:8 r:8 D3:8 r:8' },
      { inst: 'strings', vol: 0.55, notes: 'G3+Bb3+D4:8 Eb3+G3+Bb3:8 C3+Eb3+G3:8 D3+F#3+A3:8' },
      { inst: 'cello', vol: 0.6, notes: R('G2:0.5 D3:0.5 Bb2:0.5 D3:0.5', 4) + ' ' + R('Eb2:0.5 Bb2:0.5 G2:0.5 Bb2:0.5', 4) + ' ' + R('C2:0.5 G2:0.5 Eb2:0.5 G2:0.5', 4) + ' ' + R('D2:0.5 A2:0.5 F#2:0.5 A2:0.5', 4) },
      { inst: 'bell', vol: 0.35, notes: 'D5:2 G5:2 F5:1 Eb5:1 D5:2 C5:2 Eb5:2 D5:2 Bb4:2 Eb5:2 D5:2 C5:2 Bb4:2 A4:4 F#4:4' },
    ],
  };
  M.r6 = { // Catedral do Crepúsculo
    bpm: 60,
    parts: [
      { inst: 'organ', vol: 0.6, notes: 'B2+D3+F#3:4 G2+B2+D3:4 D3+F#3+A3:4 A2+C#3+E3:4 B2+D3+F#3:4 E3+G3+B3:4 F#2+A#2+C#3:8' },
      { inst: 'organ', vol: 0.5, oct: -1, notes: 'B2:4 G2:4 D3:4 A2:4 B2:4 E3:4 F#2:8' },
      { inst: 'choir', vol: 0.55, notes: 'F#4:4 G4:2 F#4:2 A4:4 E4:4 F#4:2 D4:2 E4:2 G4:2 F#4:6 E4:2' },
      { inst: 'choirlow', vol: 0.45, notes: 'B2:8 D3:8 B2:8 C#3:8' },
      { inst: 'bell', vol: 0.25, notes: 'r:30 F#5:2' },
    ],
  };
  M.r7 = { // Paço Real — valsa sombria
    bpm: 96,
    parts: [
      { inst: 'cello', vol: 0.7, notes: 'C#2:3 C#2:3 F#2:3 F#2:3 G#1:3 G#1:3 C#2:3 C#2:3 A1:3 A1:3 F#1:3 F#1:3 D2:3 D2:3 G#1:3 G#1:3' },
      { inst: 'lute', vol: 0.5, notes: waltz(['C#3+E3+G#3', 'C#3+E3+G#3', 'F#3+A3+C#4', 'F#3+A3+C#4', 'G#2+B#2+D#3+F#3', 'G#2+B#2+D#3+F#3', 'C#3+E3+G#3', 'C#3+E3+G#3', 'A2+C#3+E3', 'A2+C#3+E3', 'F#2+A2+C#3', 'F#2+A2+C#3', 'D3+F#3+A3', 'D3+F#3+A3', 'G#2+B#2+D#3', 'G#2+B#2+D#3']) },
      { inst: 'strings', vol: 0.7, notes: 'G#4:2 A4:1 G#4:2 E4:1 F#4:2 G#4:1 A4:3 B4:2 A4:1 G#4:2 F#4:1 E4:3 C#4:3 C#5:2 B4:1 A4:2 G#4:1 F#4:2 E4:1 D#4:3 D5:2 C#5:1 B4:3 G#4:2 B#4:1 C#5:3' },
      { inst: 'choirlow', vol: 0.4, notes: 'C#3:6 F#3:6 G#3:6 C#3:6 A3:6 F#3:6 D3:6 G#3:6' },
    ],
  };

  // ---------------- Subchefes ----------------
  M.sb_coveiro = {
    bpm: 120, fadeIn: 0.4,
    parts: [
      { inst: 'taiko', vol: 0.9, notes: R('D1:1! r:0.5 D1:0.5 D1:1 r:1', 4) },
      { inst: 'snare', vol: 0.5, minInt: 1, notes: R('r:1 C4:1 r:1 C4:0.5 C4:0.5', 4) },
      { inst: 'cello', vol: 0.75, notes: R('D2:0.5 D2:0.5 F2:0.5 D2:0.5 E2:0.5 D2:0.5 C#2:0.5 D2:0.5', 2) + ' ' + R('Bb1:0.5 Bb1:0.5 D2:0.5 Bb1:0.5 A1:0.5 A1:0.5 C#2:0.5 A1:0.5', 2) },
      { inst: 'brass', vol: 0.7, notes: 'D3:2 F3:1 E3:1 D3:2 A2:2 Bb2:2 D3:1 C3:1 A2:4' },
      { inst: 'strings', vol: 0.5, notes: 'D4+F4:4 E4+G4:4 F4+Bb4:4 E4+A4:4' },
    ],
  };
  M.sb_matilheira = {
    bpm: 144, fadeIn: 0.4,
    parts: [
      { inst: 'strings', vol: 0.55, notes: R('A3:0.25 A3:0.25 E4:0.25 A3:0.25 C4:0.25 A3:0.25 E4:0.25 A3:0.25', 4) + ' ' + R('F3:0.25 F3:0.25 C4:0.25 F3:0.25 A3:0.25 F3:0.25 C4:0.25 F3:0.25', 2) + ' ' + R('G#3:0.25 G#3:0.25 E4:0.25 G#3:0.25 B3:0.25 G#3:0.25 E4:0.25 G#3:0.25', 2) },
      { inst: 'taiko', vol: 0.8, notes: R('A1:0.5! r:0.5 A1:0.5 A1:0.5', 8) },
      { inst: 'hat', vol: 0.6, notes: R('C6:0.5', 32) },
      { inst: 'brass', vol: 0.65, notes: 'A3:3 G3:1 F3:2 E3:2 A3:2 C4:2 B3:2 G#3:2' },
      { inst: 'bass', vol: 0.7, notes: R('A1:1', 8) + ' ' + R('F1:1', 4) + ' ' + R('E1:1', 4) },
    ],
  };
  M.sb_automato = {
    bpm: 128, fadeIn: 0.4,
    parts: [
      { inst: 'taiko', vol: 0.85, notes: R('E1:0.5! E1:0.5 r:0.5 E1:0.5', 8) },
      { inst: 'snare', vol: 0.6, notes: R('r:1 C4:1!', 8) },
      { inst: 'bell', vol: 0.15, notes: R('B5:0.75 B5:0.25 r:1', 8) },
      { inst: 'bass', vol: 0.75, notes: R('E2:0.25 E2:0.25 E3:0.25 E2:0.25 G2:0.25 E2:0.25 D3:0.25 E2:0.25', 8) },
      { inst: 'brass', vol: 0.55, minInt: 1, notes: 'E3:2 G3:2 F#3:2 D3:2 E3:4 B2:4' },
      { inst: 'drone', vol: 0.5, notes: 'E1:16' },
    ],
  };
  M.sb_mariposa = {
    bpm: 108, fadeIn: 0.4,
    parts: [
      { inst: 'glass', vol: 0.7, notes: 'C#6:2 D6:1 C#6:2 A5:1 B5:2 C#6:1 F#5:3 A5:2 B5:1 A5:2 F#5:1 E#5:3 F#5:3' },
      { inst: 'strings', vol: 0.55, notes: waltz(['F#3+A3+C#4', 'F#3+A3+C#4', 'B3+D4+F#4', 'F#3+A3+C#4', 'D3+F#3+A3', 'B2+D3+F#3', 'C#3+E#3+G#3', 'F#3+A3+C#4']) },
      { inst: 'cello', vol: 0.7, notes: 'F#2:3 F#2:3 B1:3 F#2:3 D2:3 B1:3 C#2:3 F#2:3' },
      { inst: 'hat', vol: 0.4, notes: R('r:0.5 C6:0.25 C6:0.25 r:1 C6:0.5 r:0.5', 8) },
      { inst: 'choir', vol: 0.35, minInt: 1, notes: 'F#4:6 D4:6 E#4:6 F#4:6' },
    ],
  };
  M.sb_sineiro = {
    bpm: 112, fadeIn: 0.4,
    parts: [
      { inst: 'bigbell', vol: 0.45, notes: 'C3:4 G2:4 Ab2:4 G2:4' },
      { inst: 'timp', vol: 0.8, notes: R('C2:1! C2:0.5 C2:0.5 G1:1 G1:1', 4) },
      { inst: 'strings', vol: 0.5, notes: 'C4+Eb4+G4:4 Bb3+D4+F4:4 Ab3+C4+Eb4:4 G3+B3+D4:4' },
      { inst: 'cello', vol: 0.65, notes: R('C2:0.5 G2:0.5 C3:0.5 G2:0.5', 8) },
      { inst: 'brass', vol: 0.6, minInt: 1, notes: 'G3:2 Ab3:1 G3:1 F3:2 Eb3:2 D3:2 Eb3:1 F3:1 G3:4' },
    ],
  };
  M.sb_vael = {
    bpm: 126, fadeIn: 0.4,
    parts: [
      { inst: 'choir', vol: 0.5, notes: 'Bb3:4 Ab3:4 Gb3:4 F3:4' },
      { inst: 'choirlow', vol: 0.5, notes: 'Bb2:4 Ab2:4 Gb2:4 F2:4' },
      { inst: 'taiko', vol: 0.85, notes: R('Bb1:0.5! r:0.5 Bb1:0.5 r:0.5 Bb1:1 Bb1:1', 4) },
      { inst: 'strings', vol: 0.55, notes: R('Bb3:0.5 Db4:0.5 F4:0.5 Db4:0.5', 2) + ' ' + R('Ab3:0.5 C4:0.5 Eb4:0.5 C4:0.5', 2) + ' ' + R('Gb3:0.5 Bb3:0.5 Db4:0.5 Bb3:0.5', 2) + ' ' + R('F3:0.5 A3:0.5 C4:0.5 A3:0.5', 2) },
      { inst: 'gong', vol: 0.5, notes: 'Bb1:16' },
    ],
  };
  M.sb_gemeos = {
    bpm: 132, fadeIn: 0.4,
    parts: [
      { inst: 'brass', vol: 0.6, notes: 'G3:1 Bb3:1 D4:1 G4:1 F4:1 D4:1 Bb3:1 C4:1 Eb4:1 D4:1 C4:1 Bb3:1 A3:2 D4:2' },
      { inst: 'brass', vol: 0.5, oct: -1, delay: 2, notes: 'G3:1 Bb3:1 D4:1 G4:1 F4:1 D4:1 Bb3:1 C4:1 Eb4:1 D4:1 C4:1 Bb3:1 A3:2 D4:2' },
      { inst: 'snare', vol: 0.6, notes: R('C4:0.5! C4:0.25 C4:0.25 r:0.5 C4:0.5', 8) },
      { inst: 'timp', vol: 0.7, notes: R('G1:1! D2:1', 8) },
      { inst: 'strings', vol: 0.45, notes: 'G3+Bb3+D4:4 F3+Bb3+D4:4 Eb3+G3+C4:4 D3+F#3+A3:4' },
    ],
  };

  // ---------------- Chefes ----------------
  M.b_caedmon = {
    bpm: 104, fadeIn: 0.5,
    parts: [
      { inst: 'strings', vol: 0.55, notes: chords(['D3+F3+A3', 'C3+E3+G3', 'Bb2+D3+F3', 'A2+C#3+E3', 'D3+F3+A3', 'G2+Bb2+D3', 'E2+G2+Bb2', 'A2+C#3+E3'], 4) },
      { inst: 'brass', vol: 0.7, notes: 'D4:2 A4:2 G4:1 F4:1 E4:2 F4:1.5 E4:0.5 D4:1 C4:1 E4:4 D4:2 A4:2 Bb4:2 A4:1 G4:1 G4:1 F4:1 E4:1 D4:1 C#4:4' },
      { inst: 'timp', vol: 0.8, notes: R('D2:1! r:1 D2:0.5 D2:0.5 A1:1', 8) },
      { inst: 'snare', vol: 0.55, minInt: 1, notes: R('C4:0.5 C4:0.5 r:1 C4:0.25 C4:0.25 C4:0.5 r:1', 8) },
      { inst: 'choir', vol: 0.5, minInt: 2, notes: 'D4:8 C4:8 D4:8 E4:8' },
      { inst: 'cello', vol: 0.65, notes: R(R('D2:0.5 D3:0.5', 8) + ' ' + R('Bb1:0.5 Bb2:0.5', 4) + ' ' + R('A1:0.5 A2:0.5', 4), 2) },
    ],
  };
  M.b_hilde = {
    bpm: 116, fadeIn: 0.5,
    parts: [
      { inst: 'bell', vol: 0.18, notes: R('F6:1! r:0.5 F6:0.5 r:0.5 F6:0.5 F6:1', 4) },
      { inst: 'taiko', vol: 0.9, notes: R('F1:1! F1:1 r:0.5 F1:0.5 F1:1', 4) },
      { inst: 'choirlow', vol: 0.55, notes: 'F3:4 Db3:4 Eb3:4 C3:4' },
      { inst: 'brass', vol: 0.7, notes: 'F3:2 Ab3:1 G3:1 F3:2 C3:2 Db3:2 F3:1 Eb3:1 C3:4' },
      { inst: 'bass', vol: 0.75, notes: R('F1:0.5 F2:0.5 F1:0.5 Ab1:0.5', 2) + ' ' + R('Db2:0.5 Db1:0.5 Db2:0.5 F2:0.5', 2) + ' ' + R('Eb2:0.5 Eb1:0.5 Eb2:0.5 G2:0.5', 2) + ' ' + R('C2:0.5 C1:0.5 C2:0.5 E2:0.5', 2) },
      { inst: 'strings', vol: 0.5, minInt: 1, notes: 'F4+Ab4+C5:4 Db4+F4+Ab4:4 Eb4+G4+Bb4:4 C4+E4+G4:4' },
    ],
  };
  M.b_elowen = {
    bpm: 96, fadeIn: 0.5,
    parts: [
      { inst: 'glass', vol: 0.75, notes: 'E5:2 E5:1 A5:2 E5:1 D5:2 C5:1 B4:3 C5:2 D5:1 E5:2 A4:1 B4:2 G#4:1 A4:3 E5:2 E5:1 C6:2 B5:1 A5:2 G5:1 F5:3 E5:2 D5:1 C5:2 B4:1 A4:2 G#4:1 A4:3' },
      { inst: 'strings', vol: 0.55, notes: waltz(['A3+C4+E4', 'A3+C4+E4', 'D3+F3+A3', 'E3+G#3+B3', 'A3+C4+E4', 'A3+C4+E4', 'E3+G#3+B3', 'A3+C4+E4', 'A3+C4+E4', 'A3+C4+E4', 'F3+A3+C4', 'F3+A3+C4', 'D3+F3+A3', 'A3+C4+E4', 'E3+G#3+B3', 'A3+C4+E4']) },
      { inst: 'cello', vol: 0.65, notes: 'A1:3 A1:3 D2:3 E2:3 A1:3 A1:3 E2:3 A1:3 A1:3 A1:3 F1:3 F1:3 D2:3 A1:3 E1:3 A1:3' },
      { inst: 'choir', vol: 0.45, minInt: 1, notes: 'A3:12 D4:12 F3:12 E3:12' },
      { inst: 'timp', vol: 0.55, minInt: 1, notes: R('A1:3', 16) },
    ],
  };
  M.b_corvin = { // pulsação clara: os ataques de Corvin seguem estes tempos
    bpm: 120, fadeIn: 0.3,
    parts: [
      { inst: 'hat', vol: 0.55, notes: R('C6:0.5', 32) },
      { inst: 'taiko', vol: 0.85, notes: R('E1:1! r:1 E1:1 r:1', 4) },
      { inst: 'snare', vol: 0.5, notes: R('r:1 C4:1 r:1 C4:1', 4) },
      { inst: 'lute', vol: 0.8, notes: 'E4:0.5 G4:0.5 B4:0.5 E5:0.5 D5:0.5 B4:0.5 G4:0.5 B4:0.5 C5:0.5 E5:0.5 G5:0.5 E5:0.5 D5:0.5 C5:0.5 B4:0.5 A4:0.5 G4:0.5 B4:0.5 D5:0.5 G5:0.5 F#5:0.5 D5:0.5 B4:0.5 D5:0.5 E5:1 B4:1 F#5:1 D#5:1' },
      { inst: 'bass', vol: 0.75, notes: 'E2:2 E2:2 C2:2 C2:2 G1:2 G1:2 B1:2 B1:2' },
      { inst: 'strings', vol: 0.45, minInt: 1, notes: 'E3+G3+B3:4 C3+E3+G3:4 G3+B3+D4:4 B2+D#3+F#3:4' },
      { inst: 'brass', vol: 0.5, minInt: 2, notes: 'E4:2 B3:2 C4:2 A3:2 B3:2 D4:2 D#4:4' },
    ],
  };
  M.b_ozias = {
    bpm: 100, fadeIn: 0.5,
    parts: [
      { inst: 'organ', vol: 0.6, notes: chords(['B2+D3+F#3', 'E3+G3+B3', 'C#3+E3+G3', 'F#2+A#2+C#3', 'B2+D3+F#3', 'G2+B2+D3', 'A2+C#3+E3', 'F#2+A#2+C#3'], 4) },
      { inst: 'organ', vol: 0.5, oct: -1, notes: 'B2:4 E3:4 C#3:4 F#2:4 B2:4 G2:4 A2:4 F#2:4' },
      { inst: 'choir', vol: 0.6, notes: 'F#4:2 F#4:1 G4:1 B4:2 A4:1 G4:1 G4:2 F#4:1 E4:1 F#4:4 D5:2 C#5:1 B4:1 B4:2 A4:1 G4:1 A4:1 G4:1 F#4:1 E4:1 F#4:4' },
      { inst: 'taiko', vol: 0.75, minInt: 1, notes: R('B1:2! B1:1 B1:1', 8) },
      { inst: 'brass', vol: 0.55, minInt: 2, notes: 'B3:4 E4:4 G4:4 F#4:4 B4:4 G4:4 E4:4 F#4:4' },
    ],
  };
  M.b_aldric = {
    bpm: 112, fadeIn: 0.5,
    parts: [
      { inst: 'choir', vol: 0.6, notes: 'A4:1.5 D5:0.5 F5:1 E5:1 D5:2 F5:1 D5:1 C5:1.5 A4:0.5 F4:1 A4:1 G4:4 A4:1.5 D5:0.5 F5:1 A5:1 G5:2 F5:1 D5:1 F5:1.5 E5:0.5 D5:1 E5:1 C#5:4', oct: -1 },
      { inst: 'brass', vol: 0.55, notes: chords(['D3+F3+A3', 'Bb2+D3+F3', 'F3+A3+C4', 'C3+E3+G3', 'D3+F3+A3', 'G2+Bb2+D3', 'Bb2+D3+F3', 'A2+C#3+E3'], 4) },
      { inst: 'strings', vol: 0.5, notes: arp(['D3 A3 D4 A3', 'Bb2 F3 Bb3 F3', 'F3 C4 F4 C4', 'C3 G3 C4 G3', 'D3 A3 D4 A3', 'G2 D3 G3 D3', 'Bb2 F3 Bb3 F3', 'A2 E3 A3 E3'], [0, 1, 2, 3, 0, 1, 2, 3], 0.5) },
      { inst: 'taiko', vol: 0.9, notes: R('D1:1! D1:0.5 D1:0.5 r:1 D1:0.5 D1:0.5', 8) },
      { inst: 'snare', vol: 0.55, minInt: 1, notes: R('r:0.5 C4:0.5 C4:0.5 r:0.5 C4:0.25 C4:0.25 C4:0.5 r:1', 8) },
      { inst: 'gong', vol: 0.5, minInt: 2, notes: 'D2:16 D2:16' },
    ],
  };
  M.b_seraphine = {
    bpm: 84, fadeIn: 1,
    parts: [
      { inst: 'harp', vol: 0.6, notes: arp(['D3 A3 D4 F#4', 'B2 F#3 B3 D4', 'G2 D3 G3 B3', 'A2 E3 A3 C#4', 'D3 A3 D4 F#4', 'F#2 C#3 F#3 A3', 'G2 D3 G3 B3', 'A2 E3 A3 C#4'], [0, 1, 2, 3, 2, 3, 2, 1], 0.5) },
      { inst: 'glass', vol: 0.75, notes: 'F#5:3 E5:1 D5:2 A4:2 B4:3 C#5:1 D5:4 G5:2 F#5:1 E5:1 D5:2 B4:2 C#5:6 r:2' },
      { inst: 'choir', vol: 0.5, notes: 'D4:8 B3:8 G3:8 A3:8' },
      { inst: 'strings', vol: 0.45, minInt: 1, notes: chords(['D3+F#3+A3', 'B2+D3+F#3', 'G2+B2+D3', 'A2+C#3+E3', 'D3+F#3+A3', 'F#2+A2+C#3', 'G2+B2+D3', 'A2+C#3+E3'], 4) },
      { inst: 'timp', vol: 0.5, minInt: 2, notes: R('D2:2! A1:2', 8) },
    ],
  };

  // ---------------- Eventos e finais ----------------
  M.event = {
    bpm: 66, fadeIn: 1.5,
    parts: [
      { inst: 'choir', vol: 0.55, notes: 'D4+F4+A4:8 Bb3+D4+F4:8 C4+E4+G4:8 A3+C#4+E4:8' },
      { inst: 'strings', vol: 0.45, notes: 'D3:8 Bb2:8 C3:8 A2:8' },
      { inst: 'bell', vol: 0.3, notes: 'A5:8 F5:8 G5:8 E5:8' },
    ],
  };
  M.end1 = { // A Nova Chama
    bpm: 68, fadeIn: 2,
    parts: [
      { inst: 'piano', vol: 0.85, notes: 'A4:1.5 D5:0.5 F5:1 E5:1 D5:2 F5:1 D5:1 C5:1.5 A4:0.5 F4:1 A4:1 G4:3 r:1 A4:1.5 C5:0.5 F5:1 A5:1 G5:2 F5:1 C5:1 F5:1.5 E5:0.5 C5:1 E5:1 F5:4' },
      { inst: 'strings', vol: 0.55, notes: chords(['D3+F3+A3', 'Bb2+D3+F3', 'F3+A3+C4', 'C3+E3+G3', 'F3+A3+C4', 'Bb2+D3+F3', 'C3+E3+G3', 'F3+A3+C4'], 4) },
      { inst: 'choir', vol: 0.4, notes: 'A3:8 A3:8 F3:8 F3:8' },
      { inst: 'harp', vol: 0.45, notes: arp(['D3 A3 D4 F4', 'Bb2 F3 Bb3 D4', 'F2 C3 F3 A3', 'C3 G3 C4 E4', 'F2 C3 F3 A3', 'Bb2 F3 Bb3 D4', 'C3 G3 C4 E4', 'F2 C3 F3 A3'], [0, 1, 2, 3], 1) },
    ],
  };
  M.end2 = { // O Cálice
    bpm: 56, fadeIn: 2,
    parts: [
      { inst: 'organ', vol: 0.55, notes: 'D3+A3:8 Eb3+Bb3:8 D3+A3:8 C3+G3:4 Eb3+Bb3:4' },
      { inst: 'choirlow', vol: 0.55, notes: 'D3:4 Eb3:4 F3:4 Eb3:4 D3:4 C3:4 Bb2:4 D3:4' },
      { inst: 'drone', vol: 0.7, notes: 'D1+A1:32' },
      { inst: 'bell', vol: 0.3, notes: 'D5:8 Eb5:8 D5:8 A4:8' },
    ],
  };
  M.end3 = { // Aurora — o tema do menu em modo maior
    bpm: 76, fadeIn: 2,
    parts: [
      { inst: 'flute', vol: 0.7, notes: 'A4:1.5 D5:0.5 F#5:1 E5:1 D5:2 F#5:1 D5:1 C#5:1.5 A4:0.5 F#4:1 A4:1 G4:3 r:1 A4:1.5 D5:0.5 F#5:1 A5:1 G5:2 F#5:1 D5:1 E5:1.5 D5:0.5 C#5:1 E5:1 D5:4' },
      { inst: 'harp', vol: 0.6, notes: arp(['D3 A3 D4 F#4', 'G2 D3 G3 B3', 'F#2 C#3 F#3 A3', 'G2 D3 G3 B3', 'D3 A3 D4 F#4', 'E3 B3 E4 G4', 'A2 E3 A3 C#4', 'D3 A3 D4 F#4'], [0, 1, 2, 3, 2, 3, 2, 1], 0.5) },
      { inst: 'strings', vol: 0.5, notes: chords(['D3+F#3+A3', 'G3+B3+D4', 'F#3+A3+C#4', 'G3+B3+D4', 'D3+F#3+A3', 'E3+G3+B3', 'A2+C#3+E3', 'D3+F#3+A3'], 4) },
      { inst: 'choir', vol: 0.45, notes: 'D4:8 C#4:8 D4:8 D4:8' },
    ],
  };
  M.credits = {
    bpm: 72, fadeIn: 2,
    parts: [
      { inst: 'strings', vol: 0.75, notes: 'A4:1.5 D5:0.5 F5:1 E5:1 D5:2 F5:1 D5:1 C5:1.5 A4:0.5 F4:1 A4:1 G4:3 r:1 A4:1.5 D5:0.5 F5:1 A5:1 G5:2 F5:1 D5:1 F5:1.5 E5:0.5 D5:1 E5:1 D5:4' },
      { inst: 'harp', vol: 0.6, notes: arp(['D3 A3 D4 F4', 'Bb2 F3 Bb3 D4', 'F2 C3 F3 A3', 'C3 G3 C4 E4', 'D3 A3 D4 F4', 'G2 D3 G3 Bb3', 'A2 E3 A3 C#4', 'D3 A3 D4 F4'], [0, 1, 2, 3, 2, 3, 2, 1], 0.5) },
      { inst: 'cello', vol: 0.7, notes: 'D2:4 Bb1:4 F2:4 C2:4 D2:4 G1:4 A1:4 D2:4' },
      { inst: 'choir', vol: 0.4, notes: 'D4:8 F3:8 D4:8 A3:4 D4:4' },
    ],
  };
  VS.MUSIC = M;

  // ---------------- Ambientes por região ----------------
  VS.AMBIENCE = {
    r1: { wind: 0.5, gusts: 1, fire: 1, bells: 1 },
    sanct: { hum: 0.12, fire: 1, humNotes: ['D3', 'A3'] },
    r2: { rain: 1, wind: 0.7, thunder: 1, gusts: 1 },
    r3: { rumble: 1, fire: 1 },
    r4: { water: 1, drips: 1, rain: 0.35 },
    r5: { wind: 1, gusts: 1, birds: 1, bells: 1 },
    r6: { hum: 0.2, choir: 1, humNotes: ['B2', 'F#3'], drips: 1 },
    r7: { wind: 0.8, fire: 1, rumble: 0.4, gusts: 1 },
    crypt: { drips: 1, hum: 0.1, humNotes: ['D2', 'A2'] },
  };
})(window.VS);
