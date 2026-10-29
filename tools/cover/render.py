"""Gera as cápsulas Steam de Vesperal a partir de cover.html (Chromium sem ecrã).
Uso: python3 tools/cover/render.py [formato ...] [--lang pt,en]
Saída: marketing/steam/<lang>/<formato>_<L>x<A>.png
"""
import base64, pathlib, sys
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parents[2]
SRC = pathlib.Path(__file__).resolve().parent / 'cover.html'
SIZES = {'main': (1232, 706), 'header': (920, 430), 'small': (462, 174), 'vertical': (748, 896), 'library': (600, 900), 'hero': (3840, 1240)}


def main(argv):
    langs = ['pt', 'en']
    fmts = []
    for a in argv:
        if a.startswith('--lang='):
            langs = a.split('=', 1)[1].split(',')
        else:
            fmts.append(a)
    fmts = fmts or ['main', 'header', 'small', 'vertical', 'library']
    with sync_playwright() as pw:
        b = pw.chromium.launch()
        for lang in langs:
            out = ROOT / 'marketing' / 'steam' / lang
            out.mkdir(parents=True, exist_ok=True)
            for f in fmts:
                W, H = SIZES[f]
                pg = b.new_page(viewport={'width': W, 'height': H})
                errs = []
                pg.on('pageerror', lambda e: errs.append(str(e)))
                pg.goto(SRC.as_uri() + f'?f={f}&lang={lang}')
                pg.wait_for_function('document.title === "ready"', timeout=60000)
                data = pg.evaluate('window.__png()')
                p = out / f'{f}_{W}x{H}.png'
                p.write_bytes(base64.b64decode(data.split(',', 1)[1]))
                print(p.relative_to(ROOT), 'erros:' if errs else '', errs or '')
                pg.close()
        b.close()


if __name__ == '__main__':
    main(sys.argv[1:])
