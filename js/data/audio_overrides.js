// Vesperal — substituição opcional de faixas sintetizadas por ficheiros de áudio licenciados.
// Exemplo:  r1: 'assets/audio/cidade_cinzenta.ogg',
// Ids disponíveis: menu, intro, rest, sanct, r1..r7, sb_coveiro, sb_matilheira, sb_automato, sb_mariposa,
// sb_sineiro, sb_vael, sb_gemeos, b_caedmon, b_hilde, b_elowen, b_corvin, b_ozias, b_aldric, b_seraphine,
// event, end1, end2, end3, credits.
// Nota: o chefe Corvin sincroniza ataques com o andamento (120 BPM) — um ficheiro para b_corvin deve manter esse andamento.
'use strict';
window.VS = window.VS || {};
window.VS.AUDIO_OVERRIDES = {
  // Coveiro: "Arcanos, Sorcerer of the Old Banished Woods" — Philémon Weber (Helmet), CC-BY 4.0
  sb_coveiro: 'assets/audio/music/sb_coveiro.ogg',
  // Caedmon: "Chapel of Hate" — FoxSynergy, CC-BY 3.0
  b_caedmon: 'assets/audio/music/b_caedmon.ogg',
  // Hilde: "Demon Lord" — Scott Elliott (Scrabbit), CC-BY 4.0
  b_hilde: 'assets/audio/music/b_hilde.ogg',
};
