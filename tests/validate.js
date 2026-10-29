// Validação estática dos dados do mundo e da localização (Node, sem browser)
// Uso: node tests/validate.js
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = path.resolve(__dirname, '..');
const ctx = { window: {}, console, navigator: { language: 'pt' }, document: { documentElement: {} } };
ctx.window = ctx; vm.createContext(ctx);
const load = (f) => vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), ctx, { filename: f });
['js/core/util.js', 'js/core/i18n.js', 'js/data/regions.js', 'js/data/items.js', 'js/data/builder.js',
  'js/data/rooms_r1.js', 'js/data/rooms_r2.js', 'js/data/rooms_r3.js', 'js/data/rooms_r4.js', 'js/data/rooms_r5.js', 'js/data/rooms_r6.js', 'js/data/rooms_r7.js',
  'js/data/lang/en.js', 'js/data/lang/pt.js', 'js/data/lang/es.js', 'js/data/lang/fr.js'].forEach((f) => { if (fs.existsSync(path.join(ROOT, f))) load(f); });
for (const f of ['en_story', 'pt_story', 'es_story', 'fr_story', 'en_lore', 'pt_lore', 'es_lore', 'fr_lore', 'en_arsenal', 'pt_arsenal', 'es_arsenal', 'fr_arsenal', 'en_bosses', 'pt_bosses', 'es_bosses', 'fr_bosses']) { const p = `js/data/lang/${f}.js`; if (fs.existsSync(path.join(ROOT, p))) load(p); }
const VS = ctx.VS, U = VS.U, CW = U.CELL_W, CH = U.CELL_H;
let errors = 0, warns = 0;
const err = (m) => { errors++; console.log('ERRO  ' + m); };
const warn = (m) => { warns++; console.log('aviso ' + m); };

const rooms = VS.ROOMS;
const cell = {};
const SOLID = new Set(['#', 'C', 'F', 'X', 'V']);
for (const id in rooms) {
  const d = rooms[id];
  const h = d.map.length, w = d.map[0].length;
  if (w % CW || h % CH) err(`${id}: dimensões ${w}x${h} não são múltiplos de ${CW}x${CH}`);
  d.map.forEach((row, i) => { if (row.length !== w) err(`${id}: linha ${i} com ${row.length} colunas`); });
  d.cw = w / CW; d.ch = h / CH;
  for (let i = 0; i < d.cw; i++) for (let j = 0; j < d.ch; j++) { const k = (d.x + i) + ',' + (d.y + j); if (cell[k]) err(`células sobrepostas: ${id} e ${cell[k]} em ${k}`); cell[k] = id; }
  if (!VS.REGIONS[d.region]) err(`${id}: região desconhecida ${d.region}`);
}
const tileAt = (gx, gy) => { const k = Math.floor(gx / CW) + ',' + Math.floor(gy / CH); const id = cell[k]; if (!id) return null; const d = rooms[id]; return d.map[gy - d.y * CH][gx - d.x * CW]; };
// aberturas coincidentes entre salas vizinhas
let openings = 0;
for (const id in rooms) {
  const d = rooms[id], W = d.cw * CW, H = d.ch * CH, gx0 = d.x * CW, gy0 = d.y * CH;
  const check = (lx, ly, nx, ny, side) => {
    const a = d.map[ly][lx];
    const b = tileAt(nx, ny);
    if (b === null) { return; }
    const aOpen = !SOLID.has(a), bOpen = !SOLID.has(b);
    if (aOpen && bOpen) openings++;
    if (false && aOpen !== bOpen && a !== 'V' && b !== 'V') warn(`${id}: borda ${side} em ${lx},${ly} (${JSON.stringify(a)}) não coincide com vizinha (${JSON.stringify(b)})`);
  };
  for (let y = 0; y < H; y++) { check(0, y, gx0 - 1, gy0 + y, 'L'); check(W - 1, y, gx0 + W, gy0 + y, 'R'); }
  for (let x = 0; x < W; x++) { check(x, 0, gx0 + x, gy0 - 1, 'U'); check(x, H - 1, gx0 + x, gy0 + H, 'D'); }
}
// entidades fora das paredes
const inscriptions = {}, altars = {};
for (const id in rooms) {
  const d = rooms[id];
  for (const e of d.ents || []) {
    const ch = d.map[e.y] && d.map[e.y][e.x];
    if (ch === undefined) { err(`${id}: entidade ${e.t} fora da sala em ${e.x},${e.y}`); continue; }
    if (['enemy', 'item', 'altar', 'npc', 'inscription', 'urn', 'lever', 'boss'].includes(e.t) && SOLID.has(ch)) err(`${id}: ${e.t}${e.id ? ' ' + e.id : ''}${e.k ? ' ' + e.k : ''} dentro de parede em ${e.x},${e.y}`);
    if (e.t === 'inscription') { if (inscriptions[e.id]) err(`inscrição repetida ${e.id}`); inscriptions[e.id] = id; }
    if (e.t === 'altar') { if (altars[e.id]) err(`altar repetido ${e.id}`); altars[e.id] = id; }
    if (e.t === 'item' && !VS.ITEMS[e.item]) err(`${id}: item desconhecido ${e.item}`);
  }
}
for (let i = 1; i <= 35; i++) { const k = 'i' + String(i).padStart(2, '0'); if (!inscriptions[k]) err(`inscrição ${k} não colocada`); }
// localização
const langs = ['en', 'pt', 'es', 'fr'];
const keys = new Set(); langs.forEach((l) => Object.keys(VS.LANG[l] || {}).forEach((k) => keys.add(k)));
langs.forEach((l) => { const L = VS.LANG[l] || {}; const miss = [...keys].filter((k) => L[k] === undefined); if (miss.length) err(`[${l}] faltam ${miss.length} chaves, p.ex.: ${miss.slice(0, 8).join(', ')}`); });
// chaves usadas no código que não existem em inglês
const src = [];
const walk = (dir) => fs.readdirSync(dir).forEach((f) => { const p = path.join(dir, f); if (fs.statSync(p).isDirectory()) walk(p); else if (p.endsWith('.js') && !p.includes(path.join('data', 'lang')) && !p.endsWith('i18n.js')) src.push(fs.readFileSync(p, 'utf8')); });
walk(path.join(ROOT, 'js'));
const used = new Set();
src.forEach((s) => {
  for (const m of s.matchAll(/(?:VS\.t|[\s(\[,{!]t)\('([a-z0-9_]+)'\s*[,)]/g)) used.add(m[1]);
  for (const m of s.matchAll(/\{ ?s: '([a-z0-9_]+)', ?k: '([a-z0-9_]+)'/g)) { used.add(m[1]); used.add(m[2]); }
  for (const m of s.matchAll(/\bL\('([a-z0-9_]+)', ?'([a-z0-9_]+)'/g)) { used.add(m[1]); used.add(m[2]); }
  for (const m of s.matchAll(/\b(?:hint|toast|msg|tip|title): '([a-z0-9_]+)'/g)) used.add(m[1]);
});
const EN = VS.LANG.en || {};
const missingUsed = [...used].filter((k) => EN[k] === undefined && !/^[A-Z]/.test(k));
if (missingUsed.length) err(`chaves usadas sem texto em inglês (${missingUsed.length}): ${missingUsed.slice(0, 40).join(', ')}`);
// itens, chefes, inimigos, inscrições
const need = [];
for (const id in VS.ITEMS) need.push('item_' + id + '_name', 'item_' + id + '_desc');
for (const id in altars) need.push(rooms[altars[id]].ents.find((e) => e.id === id).name || 'altar_' + id);
for (let i = 1; i <= 35; i++) { const k = 'i' + String(i).padStart(2, '0'); need.push('ins_' + k, 'ins_' + k + '_t'); }
const nm = need.filter((k) => EN[k] === undefined);
if (nm.length) err(`textos de dados em falta (${nm.length}): ${nm.slice(0, 30).join(', ')}`);
// grafo de ligações (pares de salas com aberturas partilhadas)
const links = {};
for (const id in rooms) {
  const d = rooms[id], W = d.cw * CW, H = d.ch * CH, gx0 = d.x * CW, gy0 = d.y * CH;
  const add = (nid, side) => { const k = id + ' ' + side + ' ' + nid; links[k] = (links[k] || 0) + 1; };
  for (let y = 0; y < H; y++) {
    if (!SOLID.has(d.map[y][0])) { const b = tileAt(gx0 - 1, gy0 + y); if (b !== null && !SOLID.has(b) || b === 'V') add(cell[Math.floor((gx0 - 1) / CW) + ',' + Math.floor((gy0 + y) / CH)], 'L'); }
    if (!SOLID.has(d.map[y][W - 1])) { const b = tileAt(gx0 + W, gy0 + y); if (b !== null && !SOLID.has(b) || b === 'V') add(cell[Math.floor((gx0 + W) / CW) + ',' + Math.floor((gy0 + y) / CH)], 'R'); }
  }
  for (let x = 0; x < W; x++) {
    if (!SOLID.has(d.map[0][x])) { const b = tileAt(gx0 + x, gy0 - 1); if (b !== null && !SOLID.has(b)) add(cell[Math.floor((gx0 + x) / CW) + ',' + Math.floor((gy0 - 1) / CH)], 'U'); }
    if (!SOLID.has(d.map[H - 1][x])) { const b = tileAt(gx0 + x, gy0 + H); if (b !== null && !SOLID.has(b)) add(cell[Math.floor((gx0 + x) / CW) + ',' + Math.floor((gy0 + H) / CH)], 'D'); }
  }
}
if (process.argv.includes('--links')) Object.keys(links).sort().forEach((k) => console.log('  ' + k + ' (' + links[k] + ')'));
console.log(`\nSalas: ${Object.keys(rooms).length} · células: ${Object.keys(cell).length} · ligações abertas: ${openings} · inscrições: ${Object.keys(inscriptions).length} · altares: ${Object.keys(altars).length}`);
console.log(`Erros: ${errors} · avisos: ${warns}`);
process.exit(errors ? 1 : 0);
