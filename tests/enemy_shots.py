"""Inimigos dentro do jogo real, à escala do jogo: parado, a andar, ataque (antecipação/golpe), ferido, atordoado, morte.
Uso: python3 tests/enemy_shots.py crawler husk ...   → tests/out/audit/enemy_<tipo>.png
"""
import sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).parent))
from gameplay import *
from PIL import Image, ImageDraw, ImageFont
FONT = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 15)

OUTA = ROOT / 'tests' / 'out' / 'audit'
OUTA.mkdir(parents=True, exist_ok=True)
POS = '''() => { const e = T.E, G = VS.Gfx, r = document.getElementById('game').getBoundingClientRect(), d = window.devicePixelRatio || 1;
  return [r.left + (e.cx - G.cam.x) * G.scale / d, r.top + (e.cy - G.cam.y) * G.scale / d, G.scale / d]; }'''


def grab(pg, shots, label, w=90, h=56):
    pg.evaluate('VS.App.paused = true'); pg.wait_for_timeout(40)
    x, y, s = pg.evaluate(POS)
    path = OUTA / f'_e_{len(shots)}.png'
    pg.screenshot(path=str(path), clip={'x': x - w / 2 * s, 'y': y - h * 0.62 * s, 'width': w * s, 'height': h * s})
    pg.evaluate('VS.App.paused = false')
    shots.append((label, path))


def run(pg, kind, room='r1_bridge', tx=12, ty=12):
    warp(pg, room, tx, ty); frames(pg, 30)
    pg.evaluate('T.g().ents.filter((e) => e.isEnemy).forEach((e) => e.remove = true); T.p().facing = 1'); frames(pg, 5)
    pg.evaluate(f'''() => {{ const e = T.spawnEnemy("{kind}", 70); e.hp = e.maxHp = 9999; e.facing = -1; e.aggro = false; e.cool = 99; T.E = e;
      T.think = e.K.think; e.K = Object.assign({{}}, e.K, {{ think() {{}} }}); e.perched = false; e.fade = 1; e.hidden = false; e.hittable = true; e.rise = 1; e.open = true; }}''')
    frames(pg, 30)
    shots = []
    grab(pg, shots, 'parado'); frames(pg, 9); grab(pg, shots, 'parado 2')
    # andar em direção ao herói
    pg.evaluate('T.hooks.push(() => { const e = T.E; if (e.dead) return true; e.vx = -60; if (e.flying) { e.vx = -40; } if (T.E.__w++ > 40) { e.vx = 0; return true; } }); T.E.__w = 0')
    frames(pg, 14); grab(pg, shots, 'andar'); frames(pg, 6); grab(pg, shots, 'andar 2'); frames(pg, 30)
    # cada ataque: antecipação e golpe
    names = pg.evaluate('Object.keys(T.E.K.attacks || {})')
    for n in names[:3]:
        pg.evaluate(f'T.E.vx = 0; T.E.attack("{n}"); T.E.facing = -1')
        w = pg.evaluate(f'T.E.K.attacks["{n}"].wind')
        frames(pg, max(2, int(w * 60 * 0.75))); grab(pg, shots, f'{n} (antecipação)')
        pg.evaluate('''(() => { const e = T.E; T.hooks.push(() => { if (!e.atk || e.atk.phase !== 'wind') return true; }); })()''')
        wait(pg, '!T.E.atk || T.E.atk.phase !== "wind"', 3); frames(pg, 2); grab(pg, shots, f'{n} (golpe)')
        wait(pg, '!T.E.atk', 4); frames(pg, 20)
        pg.evaluate('T.E.x = T.p().cx + 70 - T.E.w / 2; T.E.vx = 0; T.E.facing = -1'); frames(pg, 10)
    # ferido, atordoado, morte
    pg.evaluate('T.E.lastHitT = 0.04; T.E.flash = 0'); frames(pg, 1); grab(pg, shots, 'ferido')
    frames(pg, 20)
    pg.evaluate('T.E.doStagger(2, T.g(), true)'); frames(pg, 10); grab(pg, shots, 'atordoado')
    pg.evaluate('T.E.stagger = 0; T.E.hp = 0; T.E.die(T.g(), true)'); frames(pg, 8); grab(pg, shots, 'morte'); frames(pg, 12); grab(pg, shots, 'morte 2')
    ims = [(lab, Image.open(p)) for lab, p in shots]
    W = max(i.width for _, i in ims); H = max(i.height for _, i in ims)
    cols = 4; rows = (len(ims) + cols - 1) // cols
    sh = Image.new('RGB', (W * cols, (H + 22) * rows), (16, 14, 18)); d = ImageDraw.Draw(sh)
    for k, (lab, im) in enumerate(ims):
        x, y = (k % cols) * W, (k // cols) * (H + 22)
        sh.paste(im, (x, y + 22)); d.text((x + 6, y + 4), f'{kind}: {lab}', fill=(230, 220, 200), font=FONT)
    sh.thumbnail((1900, 1900)); sh.save(OUTA / f'enemy_{kind}.png')
    for _, p in shots:
        p.unlink()


def main(kinds):
    with sync_playwright() as pw:
        b = pw.chromium.launch(args=ARGS)
        pg = b.new_page(viewport={'width': 1920, 'height': 1080}); errs = []; page_errors(pg, errs)
        boot(pg); new_game(pg)
        pg.evaluate('VSDebug.god(true); VS.App.game.hideHUD = true')
        for k in kinds:
            run(pg, k)
            print(k, 'ok')
        print('erros:', errs[:5])
        b.close()


if __name__ == '__main__':
    main(sys.argv[1:] or ['crawler'])
