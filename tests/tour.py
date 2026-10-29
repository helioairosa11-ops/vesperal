"""Visita todas as salas (ou as indicadas) e tira capturas — revisão visual e deteção de erros por sala."""
import sys, pathlib
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parents[1]
OUT = ROOT / 'tests' / 'out' / 'rooms'
OUT.mkdir(parents=True, exist_ok=True)
URL = (ROOT / 'index.html').as_uri() + '?debug=1'

def main(only=None):
    errors = []
    with sync_playwright() as p:
        b = p.chromium.launch()
        pg = b.new_page(viewport={'width': 1280, 'height': 720})
        pg.on('pageerror', lambda e: errors.append(f'[pageerror] {e}'))
        pg.on('console', lambda m: errors.append(f'[{m.type}] {m.text}') if m.type == 'error' and 'ERR_TUNNEL' not in m.text and 'Failed to load resource' not in m.text else None)
        pg.goto(URL); pg.wait_for_timeout(800)
        pg.evaluate("localStorage.clear()")
        pg.evaluate("VS.App.newGame(2)")
        pg.wait_for_timeout(300)
        pg.evaluate("VS.UI.dlg && VS.UI.dlgEnd(-1); VSDebug.game().script=null; VSDebug.game().cutscene=false; VSDebug.game().fade=0; VSDebug.game().fadeTarget=0; VSDebug.game().hideHUD=false; VSDebug.god(true)")
        rooms = pg.evaluate("Object.keys(VS.ROOMS)")
        if only: rooms = [r for r in rooms if any(r.startswith(o) for o in only)]
        for r in rooms:
            pg.evaluate(f"VSDebug.warp('{r}')")
            pg.wait_for_timeout(700)
            pg.screenshot(path=str(OUT / f'{r}.png'))
            n = pg.evaluate("VSDebug.ents().length")
            print(r, 'entidades', n)
        b.close()
    print('\n'.join(errors[:40]) or 'sem erros')

if __name__ == '__main__':
    main(sys.argv[1:] or None)
