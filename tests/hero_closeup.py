"""Grandes planos do protagonista dentro do jogo real (para rever animações à escala): tests/out/audit/hero_closeup.png"""
import sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).parent))
from gameplay import *
from PIL import Image

OUTA = ROOT / 'tests' / 'out' / 'audit'
SNAP = '''() => { const p = T.p(), G = VS.Gfx; G.cameraFollow(p.cx, p.cy, 1, true); G.cam.sx = 0; G.cam.sy = 0; }'''
POS = '''() => { const p = T.p(), G = VS.Gfx, r = document.getElementById('game').getBoundingClientRect(), d = window.devicePixelRatio || 1;
  return [r.left + (p.cx - G.cam.x) * G.scale / d, r.top + (p.cy - G.cam.y) * G.scale / d, G.scale / d]; }'''


def grab(pg, shots, name, lock=True):
    pg.evaluate('VS.App.paused = true')
    if lock:
        pg.evaluate(SNAP); pg.wait_for_timeout(60)
    x, y, s = pg.evaluate(POS)
    path = OUTA / f'_cl_{len(shots)}.png'
    pg.screenshot(path=str(path), clip={'x': x - 32 * s, 'y': y - 30 * s, 'width': 64 * s, 'height': 48 * s})
    pg.evaluate('VS.App.paused = false')
    shots.append((name, path))


def main(look='capuz', weapon='desperto'):
    with sync_playwright() as pw:
        b = pw.chromium.launch(args=ARGS)
        pg = b.new_page(viewport={'width': 1920, 'height': 1080}); errs = []; page_errors(pg, errs)
        boot(pg); new_game(pg)
        pg.evaluate(f'VSDebug.god(true); VSDebug.allAbilities(); VS.state.look = "{look}"; VS.state.giveWeapon("{weapon}"); VS.state.weaponId = "{weapon}"')
        frames(pg, 30)
        warp(pg, 'r1_bridge', 12, 12); frames(pg, 40)
        pg.evaluate('T.p().facing = 1'); frames(pg, 10)
        shots = []
        grab(pg, shots, 'idle')
        pg.evaluate('T.key("KeyD", true)'); frames(pg, 18); grab(pg, shots, 'run'); frames(pg, 4); grab(pg, shots, 'run2'); pg.evaluate('T.key("KeyD", false)'); frames(pg, 25)
        pg.evaluate('T.tap("Space", 14)'); frames(pg, 5); grab(pg, shots, 'jump'); frames(pg, 18); grab(pg, shots, 'apex'); frames(pg, 12); grab(pg, shots, 'fall'); frames(pg, 40)
        for k in range(3):
            pg.evaluate('T.tap("KeyJ", 3)'); frames(pg, 6 + k); grab(pg, shots, f'l{k + 1}'); frames(pg, 6)
        frames(pg, 30)
        pg.evaluate('T.key("KeyK", true)'); frames(pg, 45); grab(pg, shots, 'charge'); pg.evaluate('T.key("KeyK", false)'); frames(pg, 3); grab(pg, shots, 'heavy'); frames(pg, 40)
        pg.evaluate('T.tap("KeyL", 3)'); frames(pg, 6); grab(pg, shots, 'dodge'); frames(pg, 40)
        pg.evaluate('T.key("KeyI", true)'); frames(pg, 20); grab(pg, shots, 'guard'); pg.evaluate('T.key("KeyI", false)'); frames(pg, 30)
        pg.evaluate('T.key("KeyS", true)'); frames(pg, 14); grab(pg, shots, 'crouch'); pg.evaluate('T.key("KeyS", false)'); frames(pg, 20)
        pg.evaluate('T.key("KeyW", true); T.tap("KeyJ", 3)'); frames(pg, 9); grab(pg, shots, 'up'); pg.evaluate('T.key("KeyW", false)'); frames(pg, 30)
        pg.evaluate('VS.state.hp = 50; T.tap("KeyF", 3)'); frames(pg, 30); grab(pg, shots, 'heal'); frames(pg, 60)
        pg.evaluate('VS.state.lume = 100; T.tap("KeyQ", 3)'); frames(pg, 8); grab(pg, shots, 'spell'); frames(pg, 40)
        ims = [Image.open(p) for _, p in shots]
        w = max(i.width for i in ims); h = max(i.height for i in ims)
        cols = 6; rows = (len(ims) + cols - 1) // cols
        sheet = Image.new('RGB', (w * cols, h * rows), (0, 0, 0))
        for k, im in enumerate(ims):
            sheet.paste(im, ((k % cols) * w, (k // cols) * h))
        sheet.thumbnail((1900, 1900))
        sheet.save(OUTA / f'hero_closeup_{look}_{weapon}.png')
        for _, p in shots:
            p.unlink()
        print([n for n, _ in shots], errs[:3])
        b.close()


if __name__ == '__main__':
    main(*(sys.argv[1:] or []))
