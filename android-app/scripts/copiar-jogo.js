// Copia o jogo (index.html, css, js, assets, LICENSE) da raiz do repositório para ./www antes de criar a app Android.
'use strict';
const fs = require('fs'), path = require('path');
const SRC = path.resolve(__dirname, '..', '..'), DST = path.resolve(__dirname, '..', 'www');
if (!fs.existsSync(path.join(SRC, 'index.html'))) { console.error('Não encontrei o jogo (index.html) na raiz do repositório.'); process.exit(1); }
fs.rmSync(DST, { recursive: true, force: true });
for (const f of ['index.html', 'LICENSE', 'css', 'js', 'assets']) {
  const s = path.join(SRC, f); if (fs.existsSync(s)) fs.cpSync(s, path.join(DST, f), { recursive: true });
}
console.log('Jogo copiado para www/.');
