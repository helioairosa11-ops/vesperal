// Vesperal — estado persistente da partida e regras derivadas (vida, dano, relíquias)
'use strict';
(function (VS) {
  const U = VS.U;

  class GameState {
    constructor() {
      Object.assign(this, GameState.fresh());
    }
    static fresh() {
      return {
        version: 1,
        playTime: 0,
        room: 'r1_wake', x: null, y: null, facing: 1,
        restRoom: 'r1_wake', restId: null,
        hp: 100, flasks: 3, lume: 0, ash: 0,
        shade: null,
        abilities: { dash: false, spell: false, wall: false, forge: false, double: false, veil: false, impulse: false, climb: false },
        weapon: 0, weaponId: 'desperto', weapons: ['desperto'], look: 'capuz',
        items: {},
        relics: [], equipped: [], relicSlots: 2,
        hearts: 0, fragments: 0,
        flags: {},
        broken: {}, collected: {}, inscriptions: {}, bestiary: {}, bosses: {},
        visited: {}, altars: {}, shortcuts: {},
        quests: { hrolf: 0, maren: 0, teodoro: 0 },
        buffs: {},
        deaths: 0, ending: null, finalSave: false,
      };
    }
    serialize() {
      const o = {};
      for (const k of Object.keys(GameState.fresh())) o[k] = this[k];
      return U.deepClone(o);
    }
    load(o) {
      const f = GameState.fresh();
      for (const k of Object.keys(f)) this[k] = o[k] !== undefined ? o[k] : f[k];
      this.abilities = Object.assign(f.abilities, o.abilities || {});
      this.quests = Object.assign(f.quests, o.quests || {});
      if (!this.weapons || !this.weapons.length) this.weapons = ['desperto'];
      if (!VS.WEAPONS || !VS.WEAPONS[this.weaponId]) this.weaponId = 'desperto';
    }
    get weaponDef() { return VS.WEAPONS[this.weaponId] || VS.WEAPONS.desperto; }
    giveWeapon(id) { if (VS.WEAPONS[id] && !this.weapons.includes(id)) this.weapons.push(id); }
    hasLook(look) { return look === 'capuz' || !!this.flags['look_' + look]; }
    // dano de uma arma qualquer (para comparar no inventário), sem mudar a equipada
    weaponDamage(id, kind) { const cur = this.weaponId; this.weaponId = id; const d = this.damage(kind); this.weaponId = cur; return d; }

    // ---------- itens ----------
    count(id) { return this.items[id] || 0; }
    has(id) { return this.count(id) > 0 || (this.relics || []).includes(id); }
    give(id, n) {
      n = n === undefined ? 1 : n;
      const it = VS.ITEMS[id];
      if (!it) { console.warn('item desconhecido', id); return; }
      if (it.cat === 'weapon') { this.giveWeapon(it.weapon); return; }
      if (it.cat === 'outfit') { this.flags['look_' + it.look] = true; return; }
      if (it.cat === 'relic') { if (!this.relics.includes(id)) this.relics.push(id); if (this.equipped.length < this.relicSlots && !this.equipped.includes(id)) this.equipped.push(id); return; }
      if (id === 'candle_fragment') { this.fragments += n; this.flasks = this.flasksMax; return; }
      if (id === 'ash_heart') { this.hearts += n; this.hp = this.hpMax; return; }
      if (id === 'relic_slot') { this.relicSlots = Math.min(5, this.relicSlots + n); return; }
      const max = it.max || 99;
      this.items[id] = Math.min(max, this.count(id) + n);
    }
    take(id, n) { n = n === undefined ? 1 : n; this.items[id] = Math.max(0, this.count(id) - n); if (!this.items[id]) delete this.items[id]; }

    // ---------- relíquias ----------
    equip(id) { if (!this.relics.includes(id) || this.equipped.includes(id)) return false; if (this.equipped.length >= this.relicSlots) return false; this.equipped.push(id); return true; }
    unequip(id) { this.equipped = this.equipped.filter((r) => r !== id); }
    fx(key, def) {
      let v = def;
      for (const r of this.equipped) { const f = VS.ITEMS[r] && VS.ITEMS[r].fx; if (f && f[key] !== undefined) v = typeof f[key] === 'number' && typeof v === 'number' ? v * f[key] : f[key]; }
      return v;
    }

    // ---------- valores derivados ----------
    get hpMax() { return 100 + this.hearts * 15; }
    get flasksMax() { return 3 + this.fragments; }
    get embers() { let n = 0; for (let i = 1; i <= 6; i++) if (this.has('ember_' + i) || this.flags['ember_given_' + i]) n++; return n; }
    get letters() { return ['letter_1', 'letter_2', 'letter_3'].filter((l) => this.has(l)).length; }
    damage(kind) {
      let d = 12 + this.weapon * 4;
      d *= this.fx('damage', 1) * this.weaponDef.dmg;
      if (kind === 'heavy') d = d * 2.1 * this.fx('heavyDamage', 1);
      if (kind === 'riposte') d *= 2.8;
      if (this.buffs.oil > 0) d *= 1.3;
      if (this.hp < this.hpMax * 0.3) d *= this.fx('lowHpDamage', 1);
      return Math.round(d);
    }
    spellDamage() { return Math.round((22 + this.weapon * 3) * this.fx('spellDamage', 1)); }

    flag(k) { return this.flags[k]; }
    set(k, v) { this.flags[k] = v === undefined ? true : v; }

    // percentagem de conclusão (para o ecrã de vitória e menu)
    completion() {
      const C = VS.COMPLETION || { total: 1, keys: [] };
      let got = 0;
      for (const k of C.keys) if (k(this)) got++;
      return Math.round((got / C.keys.length) * 100);
    }
  }

  VS.GameState = GameState;
})(window.VS);
