"""Ateliê de Vesperal — exporta a arte desenhada em tools/art/ para assets/ (PNG + metadados .js).

Uso: python3 tools/art/build.py [nome ...]      (sem nomes: tudo)
     python3 tools/art/build.py --preview hero   (também gera uma prancha de pré-visualização)

Cada personagem/arma regista-se com ART.register(nome, fn). Folhas de sprites vão para
assets/sprites/<nome>.png e os metadados para assets/sprites/<nome>.js (VS.SPRITE_META[nome] = {...}),
porque o jogo tem de abrir a partir de file:// (sem fetch de JSON).
"""
import base64, json, pathlib, sys
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parents[2]
ART = pathlib.Path(__file__).resolve().parent
OUT = ROOT / 'assets'


def save_png(path, data_url):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(base64.b64decode(data_url.split(',', 1)[1]))


def main(argv):
    names = [a for a in argv if not a.startswith('--')]
    preview = '--preview' in argv
    with sync_playwright() as pw:
        b = pw.chromium.launch()
        pg = b.new_page(viewport={'width': 800, 'height': 600})
        errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' else None)
        pg.goto((ART / 'atelier.html').as_uri())
        pg.wait_for_function('document.title === "ready"', timeout=20000)
        all_names = pg.evaluate('ART.list()')
        todo = names or all_names
        for n in todo:
            if n not in all_names:
                print('desconhecido:', n); continue
            r = pg.evaluate(f'ART.run({json.dumps(n)})')
            if not r:
                print('sem resultado:', n); continue
            if r['kind'] == 'images':
                sub = OUT / (r['meta'] or {}).get('dir', 'icons')
                for k, url in r['images'].items():
                    save_png(sub / f'{k}.png', url)
                if r.get('meta') and r['meta'].get('js'):
                    (sub / f'{n}.js').write_text(r['meta']['js'])
                print(f'{n}: {len(r["images"])} imagens → {sub.relative_to(ROOT)}')
            else:
                save_png(OUT / 'sprites' / f'{n}.png', r['png'])
                meta = r['meta']
                js = "'use strict';\n(window.VS = window.VS || {}).SPRITE_META = window.VS.SPRITE_META || {};\nVS.SPRITE_META[" + json.dumps(n) + "] = " + json.dumps(meta, separators=(',', ':')) + ";\n"
                (OUT / 'sprites' / f'{n}.js').write_text(js)
                print(f'{n}: {len(meta["frames"])} fotogramas, {len(meta["anims"])} animações')
            if preview:
                pv = pg.evaluate(f'ART.previewAny({json.dumps(n)})')
                if pv:
                    save_png(ROOT / 'tests' / 'out' / 'art' / f'{n}_preview.png', pv)
        if errs:
            print('ERROS:', *errs[:10], sep='\n  ')
        b.close()
    bundle()


def bundle():
    """Junta os metadados de todas as folhas num só ficheiro (uma única etiqueta <script> no index.html)."""
    d = OUT / 'sprites'
    parts = ["'use strict';\n(window.VS = window.VS || {}).SPRITE_META = window.VS.SPRITE_META || {};\n"]
    for f in sorted(d.glob('*.js')):
        if f.name.startswith('_'):
            continue
        for line in f.read_text().splitlines():
            if line.startswith('VS.SPRITE_META['):
                parts.append(line + '\n')
    (d / '_index.js').write_text(''.join(parts))
    print('índice:', len(parts) - 1, 'folhas → assets/sprites/_index.js')


if __name__ == '__main__':
    if sys.argv[1:] == ['--bundle']:
        bundle()
    else:
        main(sys.argv[1:])
