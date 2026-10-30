// Copia o jogo (index.html, css, js, assets, LICENSE) da pasta de cima para ./game antes de abrir ou compilar.
// No pacote já pronto o jogo já vem em ./game: se a pasta de cima não tiver o jogo, não faz nada.
'use strict';
const fs = require('fs'), path = require('path');
const SRC = path.resolve(__dirname, '..', '..'), DST = path.resolve(__dirname, '..', 'game');
if (!fs.existsSync(path.join(SRC, 'index.html')) || !fs.existsSync(path.join(SRC, 'js'))) {
  if (!fs.existsSync(path.join(DST, 'index.html'))) { console.error('Não encontrei o jogo: falta a pasta game/ com o index.html.'); process.exit(1); }
  console.log('O jogo já está em game/.'); process.exit(0);
}
fs.rmSync(DST, { recursive: true, force: true });
for (const f of ['index.html', 'LICENSE', 'css', 'js', 'assets']) {
  const s = path.join(SRC, f); if (fs.existsSync(s)) fs.cpSync(s, path.join(DST, f), { recursive: true });
}
console.log('Jogo copiado para game/.');
