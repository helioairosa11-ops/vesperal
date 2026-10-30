// Exemplos reproduzíveis: para cada plataforma das salas pedidas, o salto (estado inicial + comandos) que lá chega,
// em coordenadas da sala de partida — para o teste 'reach' os repetir dentro do jogo e confirmar a física.
// Uso: node tools/reach/examples.js saida.json sala [sala ...]
'use strict';
const fs = require('fs');
const R = require('./reach.js');
const VS = R.loadVS(), W = R.buildWorld(VS), T = 20;
const out = process.argv[2], want = new Set(process.argv.slice(3));
const abil = { dash: true, double: true, wall: false, forge: true, veil: true };
const doorOpen = new Uint8Array(W.doors.length).fill(1);
const wake = W.rooms.r1_wake, ly = wake.map.findIndex((r) => r.includes('P')), lx = wake.map[ly].indexOf('P'); let fy = ly; while (wake.map[fy][lx] !== '#') fy++;
const parents = new Map();
const res = R.explore(W, { veil: true, forge: true, fake: false, doorOpen }, abil, false, [{ tx: wake._ox + lx, fy: wake._oy + fy }], parents);
const GW = W.GW, ex = [];
for (const id of want) {
  const d = W.rooms[id], H = d.map.length, Wd = d.map[0].length;
  const seen = new Set();
  for (let y = 1; y < H; y++) for (let x = 0; x < Wd; x++) {
    if (d.map[y][x] !== '=') continue;
    const i = (d._oy + y) * GW + d._ox + x;
    if (!res.visited[i] || seen.has(y + ':' + Math.floor(x / 4))) continue;
    // sobe pela cadeia de pais até a um salto (não a um passo a andar)
    let j = i, why = parents.get(j);
    while (why && why.walk) { j = why.from; why = parents.get(j); }
    if (!why || !why.pl) continue;
    seen.add(y + ':' + Math.floor(x / 4));
    const fromI = why.from, ftx = fromI % GW, ffy = (fromI - ftx) / GW, ri = W.roomOf[(ffy - 1) * GW + ftx];
    const fr = W.rooms[W.ids[ri]];
    const tx = j % GW, ty = (j - tx) / GW, tri = W.roomOf[(ty - 1) * GW + tx], tr = W.rooms[W.ids[tri]];
    ex.push({ room: W.ids[ri], x: why.s0.x - fr._ox * T, y: why.s0.y - fr._oy * T, vx: why.s0.vx, onGround: why.s0.onGround, drop: !!why.s0.drop, plan: why.pl,
      target: { room: W.ids[tri], tx: tx - tr._ox, fy: ty - tr._oy }, note: `${id} plataforma linha ${y}` });
  }
}
fs.writeFileSync(out, JSON.stringify(ex, null, 1));
console.log(ex.length + ' exemplos');
