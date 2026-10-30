"""Panorama de cada sala inteira (várias capturas com a câmara fixa, coladas) — revisão visual de plataformas e objetos.
Uso: python3 tests/panorama.py [prefixo_de_sala ...]  → tests/out/pano/<sala>.png (metade da resolução)"""
import sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).parent))
from gameplay import *
from PIL import Image

OUTP = ROOT / 'tests' / 'out' / 'pano'
OUTP.mkdir(parents=True, exist_ok=True)


def main(only):
    with sync_playwright() as pw:
        b = pw.chromium.launch(args=ARGS)
        pg = b.new_page(viewport={'width': 1280, 'height': 720}); errs = []; page_errors(pg, errs)
        boot(pg); new_game(pg)
        pg.evaluate('VSDebug.god(true); VSDebug.allAbilities(); VS.App.game.hideHUD = true; VS.HeroRender.draw = () => true')
        rooms = pg.evaluate('Object.keys(VS.ROOMS)')
        if only: rooms = [r for r in rooms if any(r.startswith(o) for o in only)]
        for r in rooms:
            warp(pg, r); frames(pg, 20)
            pw_, ph_ = pg.evaluate('[T.g().room.pw, T.g().room.ph]')
            nx, ny = max(1, round(pw_ / 640)), max(1, round(ph_ / 360))
            sheet = Image.new('RGB', (nx * 640, ny * 360))
            for j in range(ny):
                for i in range(nx):
                    pg.evaluate(f'(() => {{ const G = VS.Gfx; G.cam.lock = {{ x: {i * 640 + 320}, y: {j * 360 + 180} }}; G.cameraFollow(0, 0, 1, true); G.cam.shake = 0; }})()')
                    frames(pg, 3)
                    pg.evaluate('VS.App.paused = true'); pg.wait_for_timeout(50)
                    p = OUTP / '_tmp.png'; pg.screenshot(path=str(p)); pg.evaluate('VS.App.paused = false')
                    im = Image.open(p).resize((640, 360))
                    sheet.paste(im, (i * 640, j * 360))
            pg.evaluate('VS.Gfx.cam.lock = null')
            sheet.save(OUTP / f'{r}.png'); print(r, nx, ny, flush=True)
        print('erros', errs[:5])
        b.close()


if __name__ == '__main__':
    main(sys.argv[1:])
