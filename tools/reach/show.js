// Mostra uma sala em texto com régua e o estado de alcance de cada superfície (do JSON do analisador).
// Uso: node tools/reach/show.js reach.json sala [sala ...]
'use strict';
const fs = require('fs');
const rep = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const MARK = { ok: 'g', climb: 'Y', secret: 'b', no: 'R' };
for (const id of process.argv.slice(3)) {
  const r = rep.rooms[id]; if (!r) { console.log('sem sala', id); continue; }
  const rows = r.map.map((l) => l.split(''));
  // marca por cima de cada superfície (linha y-1) o estado: g/Y/R
  for (const s of r.segs) for (let x = s.x0; x <= s.x1; x++) if (s.y - 1 >= 0 && rows[s.y - 1][x] === ' ') rows[s.y - 1][x] = s.st === 'ok' ? '.' : MARK[s.st];
  for (const e of rep.ents.filter((e) => e.room === id)) if (rows[e.y] && rows[e.y][e.x] !== undefined) rows[e.y][e.x] = { item: 'i', urn: 'u', inscription: 'n', npc: 'p', altar: 'A', lever: 'l', shrine: 's', boss: 'B' }[e.t] || '?';
  const W = r.w;
  let ruler1 = '    ', ruler2 = '    ';
  for (let x = 0; x < W; x++) { ruler1 += x % 10 === 0 ? String(Math.floor(x / 10) % 10) : ' '; ruler2 += String(x % 10); }
  console.log(`\n== ${id} (${r.region}) ${W}x${r.h}`); console.log(ruler1); console.log(ruler2);
  rows.forEach((row, y) => console.log(String(y).padStart(3) + ' ' + row.join('')));
  const ents = rep.ents.filter((e) => e.room === id && e.st !== 'ok');
  if (ents.length) console.log('   fora: ' + ents.map((e) => `${e.t}:${e.id}@${e.x},${e.y}[${e.st}]`).join('  '));
}
