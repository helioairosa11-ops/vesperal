// Objetos a flutuar: urnas, inscrições, altares, NPC, alavancas, santuários e adereços de chão que não têm chão
// por baixo (ou que estão enterrados numa parede). Uso: node tools/reach/floating.js
'use strict';
const R = require('./reach.js');
const VS = R.loadVS();
const SOLID = new Set(['#', 'C', 'F', 'X', '=']);
const FLOOR_PROPS = new Set(['statue', 'lamppost', 'candelabra', 'altar', 'grave', 'brazier', 'barrel', 'pew', 'urn', 'anvil', 'crucible', 'crate', 'pot', 'chair', 'coffin', 'skulls', 'candles', 'rubble', 'stakes', 'censer', 'glowflower', 'reeds', 'statue2']);
let n = 0;
for (const id in VS.ROOMS) {
  const d = VS.ROOMS[id], m = d.map, at = (x, y) => (m[y] && m[y][x] !== undefined ? m[y][x] : '#');
  const check = (kind, name, x, y) => {
    const here = at(x, y), below = at(x, y + 1);
    if (SOLID.has(here) && here !== '=') { console.log(`${id.padEnd(14)} ${kind} ${name} (${x},${y}) dentro de parede`); n++; }
    else if (!SOLID.has(below)) { console.log(`${id.padEnd(14)} ${kind} ${name} (${x},${y}) a flutuar (por baixo: ${JSON.stringify(below)})`); n++; }
  };
  for (const e of d.ents || []) if (['urn', 'inscription', 'altar', 'npc', 'lever', 'shrine'].includes(e.t)) check(e.t, e.id || '', e.x, e.y);
  for (const p of d.props || []) if (FLOOR_PROPS.has(p.k)) check('adereço', p.k, p.x, p.y);
  // armadilhas: respiradouros no chão; esmagadores e lâminas presos ao teto
  for (const e of d.ents || []) if (e.t === 'trap') {
    if (['vent', 'thorns', 'bones'].includes(e.k) && !SOLID.has(at(e.x, e.y + 1))) { console.log(`${id.padEnd(14)} armadilha ${e.k} (${e.x},${e.y}) sem chão`); n++; }
    if (['crusher', 'grate', 'blade', 'bell', 'censer', 'beam'].includes(e.k) && !SOLID.has(at(e.x, e.y - 1)) && e.y > 0) { console.log(`${id.padEnd(14)} armadilha ${e.k} (${e.x},${e.y}) sem teto por cima (por cima: ${JSON.stringify(at(e.x, e.y - 1))})`); n++; }
    if ((e.k === 'spear' || e.k === 'dart') && !SOLID.has(at(e.x - (e.dir || 1), e.y))) { console.log(`${id.padEnd(14)} armadilha ${e.k} (${e.x},${e.y}) sem parede atrás`); n++; }
    if (SOLID.has(at(e.x, e.y)) && at(e.x, e.y) !== '=') { console.log(`${id.padEnd(14)} armadilha ${e.k} (${e.x},${e.y}) dentro de parede`); n++; }
  }
}
console.log(n ? `${n} objetos sem chão` : 'nenhum objeto a flutuar');
