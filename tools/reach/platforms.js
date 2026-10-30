// Plataformas com defeito: sem espaço por cima para a protagonista se pôr de pé, coladas ao teto,
// empilhadas umas sobre as outras ou enterradas em paredes. Uso: node tools/reach/platforms.js
'use strict';
const R = require('./reach.js');
const VS = R.loadVS();
const WALL = new Set(['#', 'C', 'F', 'X']);
let n = 0;
const out = (id, msg) => { console.log(`${id.padEnd(14)} ${msg}`); n++; };
for (const id in VS.ROOMS) {
  const d = VS.ROOMS[id], m = d.map, H = m.length, W = m[0].length;
  const at = (x, y) => (y < 0 ? ' ' : m[y] && m[y][x] !== undefined ? m[y][x] : '#');
  for (let y = 0; y < H; y++) {
    let x = 0;
    while (x < W) {
      if (at(x, y) !== '=') { x++; continue; }
      const x0 = x; while (x < W && at(x, y) === '=') x++;
      const x1 = x - 1, seg = `plataforma ${x0}-${x1} na linha ${y}`;
      // espaço para estar de pé (30 unidades = 1,5 tiles → duas linhas livres por cima)
      const tight = [];
      for (let c = x0; c <= x1; c++) {
        if (WALL.has(at(c, y - 1))) tight.push(c + ':teto');
        else if (y >= 2 && WALL.has(at(c, y - 2))) tight.push(c + ':baixo');
      }
      if (tight.length) out(id, `${seg} sem altura por cima (${tight.join(' ')})`);
      for (let c = x0; c <= x1; c++) if (at(c, y - 1) === '=') { out(id, `${seg} tem outra plataforma colada por cima (${c})`); break; }
      // plataforma de 1 tile encostada a nada e sem nada por baixo perto: costuma ser lixo
      if (x1 === x0 && !WALL.has(at(x0 - 1, y)) && !WALL.has(at(x1 + 1, y))) out(id, `${seg} tem só 1 tile e está solta`);
    }
  }
}
console.log(n ? `${n} problemas em plataformas` : 'plataformas sem problemas');
