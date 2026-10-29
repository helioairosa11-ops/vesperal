// Vesperal — base de dados de itens (textos em js/data/lang/*.js: item_<id>_name / item_<id>_desc)
'use strict';
(function (VS) {
  const I = {};
  const def = (id, o) => { I[id] = Object.assign({ id, cat: 'key', icon: id }, o); };

  // Habilidades (secção "Objetos importantes")
  def('ab_dash', { cat: 'ability', icon: 'feather_ash' });
  def('ab_spell', { cat: 'ability', icon: 'spark' });
  def('ab_wall', { cat: 'ability', icon: 'claw' });
  def('ab_forge', { cat: 'ability', icon: 'hammer' });
  def('ab_double', { cat: 'ability', icon: 'wings' });
  def('ab_veil', { cat: 'ability', icon: 'veil' });
  // Brasas do Lume
  for (let i = 1; i <= 6; i++) def('ember_' + i, { cat: 'key', icon: 'ember', ember: i });
  // Cartas da rainha
  def('letter_1', { cat: 'key', icon: 'letter', letter: 1 });
  def('letter_2', { cat: 'key', icon: 'letter', letter: 2 });
  def('letter_3', { cat: 'key', icon: 'letter', letter: 3 });
  // Objetos importantes
  def('chalice', { cat: 'key', icon: 'chalice' });
  def('chalice_mended', { cat: 'key', icon: 'chalice' });
  def('ossuary_key', { cat: 'key', icon: 'key' });
  def('bastion_key', { cat: 'key', icon: 'key' });
  def('palace_seal', { cat: 'key', icon: 'seal' });
  // Itens de missão
  def('hilde_hammer', { cat: 'quest', icon: 'hammer' });
  def('teodoro_medal', { cat: 'quest', icon: 'medal' });
  def('ozias_testament', { cat: 'quest', icon: 'scroll' });
  def('elowen_lullaby', { cat: 'quest', icon: 'scroll' });
  // Materiais (consumidos ao apanhar ou ao melhorar)
  def('ash_steel', { cat: 'material', icon: 'ingot' });
  def('candle_fragment', { cat: 'material', icon: 'candle', instant: true });
  def('ash_heart', { cat: 'material', icon: 'heart', instant: true });
  def('relic_slot', { cat: 'material', icon: 'socket', instant: true });
  // Consumíveis
  def('oil', { cat: 'consumable', icon: 'oil', price: 120, max: 9 });
  def('incense', { cat: 'consumable', icon: 'incense', price: 120, max: 9 });
  def('salt', { cat: 'consumable', icon: 'salt', price: 80, max: 9 });
  def('feather', { cat: 'consumable', icon: 'feather', price: 60, max: 9 });
  // Relíquias equipáveis
  const relic = (id, fx) => def(id, { cat: 'relic', icon: 'relic', fx });
  relic('r_rosary', { healSpeed: 1.6 });
  relic('r_amber', { healAmount: 1.3 });
  relic('r_raven_eye', { revealSecrets: true });
  relic('r_heron', { speed: 1.12 });
  relic('r_captain', { parryWindow: 1.6 });
  relic('r_ember', { spellDamage: 1.5 });
  relic('r_hrolf_hammer', { heavyDamage: 1.35 });
  relic('r_chalice_shard', { lowHpDamage: 1.3 });
  relic('r_ione_ribbon', { ashGain: 1.3 });
  relic('r_hairshirt', { lumeOnHurt: 20 });
  relic('r_anchor', { noKnockback: true });
  relic('r_lantern', { lightRadius: 1.6, lumeRegen: 1.5 });
  relic('r_hilde_blade', { damage: 1.1 });

  // Armas (ícones pintados no ateliê) — ao apanhar entram no arsenal (ver js/data/weapons.js)
  for (const w of ['desperto', 'navalhas', 'malho', 'alabarda', 'espirito', 'montante']) def('w_' + w, { cat: 'weapon', weapon: w, png: 'weapons/icon_w_' + w + '.png' });
  // Trajes (aparências do Desperto)
  // ícones pintados no ateliê (tools/art/icons.js → assets/icons/<id>.png) para todos os objetos
  const PAINTED = ['ab_dash', 'ab_spell', 'ab_wall', 'ab_forge', 'ab_double', 'ab_veil', 'ember_1', 'ember_2', 'ember_3', 'ember_4', 'ember_5', 'ember_6', 'letter_1', 'letter_2', 'letter_3', 'chalice', 'chalice_mended', 'ossuary_key', 'bastion_key', 'palace_seal', 'hilde_hammer', 'teodoro_medal', 'ozias_testament', 'elowen_lullaby', 'ash_steel', 'candle_fragment', 'ash_heart', 'relic_slot', 'oil', 'incense', 'salt', 'feather', 'r_rosary', 'r_amber', 'r_raven_eye', 'r_heron', 'r_captain', 'r_ember', 'r_hrolf_hammer', 'r_chalice_shard', 'r_ione_ribbon', 'r_hairshirt', 'r_anchor', 'r_lantern', 'r_hilde_blade'];
  PAINTED.forEach((id) => { if (I[id]) I[id].png = 'icons/' + id + '.png'; });
  def('look_capuz', { cat: 'outfit', look: 'capuz', png: 'icons/look_capuz.png' });
  def('helm_sino', { cat: 'outfit', look: 'sino', png: 'icons/look_sino.png' });

  VS.ITEMS = I;
  VS.RELICS = Object.keys(I).filter((k) => I[k].cat === 'relic');
  // custo de melhoria da espada por nível (Aço Cinzento, Cinza)
  VS.UPGRADE_COST = [[1, 300], [1, 600], [2, 1000], [2, 1600], [3, 2400]];
})(window.VS);
