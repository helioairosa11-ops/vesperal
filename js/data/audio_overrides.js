// Vesperal — substituição opcional de faixas sintetizadas por ficheiros de áudio licenciados.
// Exemplo:  r1: 'assets/audio/cidade_cinzenta.ogg',
// Ids disponíveis: menu, intro, rest, sanct, r1..r7, sb_coveiro, sb_matilheira, sb_automato, sb_mariposa,
// sb_sineiro, sb_vael, sb_gemeos, b_caedmon, b_hilde, b_elowen, b_corvin, b_ozias, b_aldric, b_seraphine,
// event, end1, end2, end3, credits.
// Nota: o chefe Corvin sincroniza ataques com o andamento (120 BPM) — um ficheiro para b_corvin deve manter esse andamento.
'use strict';
window.VS = window.VS || {};
window.VS.AUDIO_OVERRIDES = {
  // Menu principal: "Leap Into Eternity (Live Orchestra)" — Matthew Pablo, CC-BY 3.0
  menu: 'assets/audio/music/menu.ogg',
  // Coveiro: "Arcanos, Sorcerer of the Old Banished Woods" — Philémon Weber (Helmet), CC-BY 4.0
  sb_coveiro: 'assets/audio/music/sb_coveiro.ogg',
  // Velha Matilheira: "Epic Boss Battle" — Juhani Junkala (SubspaceAudio), CC0
  sb_matilheira: 'assets/audio/music/sb_matilheira.ogg',
  // Sir Caedmon: "Heroic Demise" — Matthew Pablo, CC-BY 3.0
  b_caedmon: 'assets/audio/music/b_caedmon.ogg',
  // Autómato do Fole: "The Machine Has Become Self Aware" — HitCtrl, CC-BY 3.0
  sb_automato: 'assets/audio/music/sb_automato.ogg',
  // Mestra Hilde: "Demon Lord" — Scott Elliott (Scrabbit), CC-BY 4.0
  b_hilde: 'assets/audio/music/b_hilde.ogg',
  // Mãe-Mariposa: "Dark Descent" — Matthew Pablo, CC-BY 3.0
  sb_mariposa: 'assets/audio/music/sb_mariposa.ogg',
  // Ama Elowen: "Evil Approach" — nene, CC0
  b_elowen: 'assets/audio/music/b_elowen.ogg',
  // Sineiro: "Fall of Nightmares" — nene, Helena Kesti & Matias Lindgren, CC0
  sb_sineiro: 'assets/audio/music/sb_sineiro.ogg',
  // Inquisidora Vael: "Church Combat" — Centurion_of_war, CC-BY 4.0
  sb_vael: 'assets/audio/music/sb_vael.ogg',
  // Bispo Ozias: "Chapel of Hate" — FoxSynergy, CC-BY 3.0
  b_ozias: 'assets/audio/music/b_ozias.ogg',
  // Gémeos da Guarda: "Battle Theme A" — cynicmusic, CC0
  sb_gemeos: 'assets/audio/music/sb_gemeos.ogg',
  // Rei Aldric: "Wasteland Showdown" — Matthew Pablo, CC-BY 3.0
  b_aldric: 'assets/audio/music/b_aldric.ogg',
  // Eco de Seraphine: "New Sunrise" — nene, CC0
  b_seraphine: 'assets/audio/music/b_seraphine.ogg',
  // Carpideira: "Solemn March" — Yubatake, CC-BY 4.0
  b_carpideira: 'assets/audio/music/b_carpideira.ogg',
  // Custódio de Ouro: "Sigil" — Kistol, CC0
  b_custodio: 'assets/audio/music/b_custodio.ogg',
};
