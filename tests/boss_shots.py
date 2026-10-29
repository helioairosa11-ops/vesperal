"""Chefes dentro do jogo real, à escala do jogo: parado, a andar, cada ataque (antecipação/golpe/recuperação),
ferido, atordoado e derrota. Uso: python3 tests/boss_shots.py coveiro aldric ...  → tests/out/audit/boss_<id>.png
"""
import sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).parent))
from gameplay import *
from PIL import Image, ImageDraw, ImageFont
FONT = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 15)

OUTA = ROOT / 'tests' / 'out' / 'audit'
ROOMS = dict(BOSSES)
POS = '''() => { const e = T.B, G = VS.Gfx, r = document.getElementById('game').getBoundingClientRect(), d = window.devicePixelRatio || 1;
  return [r.left + (e.cx - G.cam.x) * G.scale / d, r.top + (e.cy - G.cam.y) * G.scale / d, G.scale / d]; }'''


def grab(pg, shots, label, w=None, h=None):
    pg.evaluate('VS.App.paused = true'); pg.wait_for_timeout(50)
    bw, bh = pg.evaluate('[T.B.w, T.B.h]')
    w = w or max(170, bh * 3.6); h = h or max(104, bh * 2.0)
    x, y, s = pg.evaluate(POS)
    path = OUTA / f'_b_{len(shots)}.png'
    vw, vh = pg.viewport_size['width'], pg.viewport_size['height']
    cx = min(max(0, x - w / 2 * s), vw - w * s); cy = min(max(0, y - h * 0.62 * s), vh - h * s)
    pg.screenshot(path=str(path), clip={'x': max(0, cx), 'y': max(0, cy), 'width': min(vw, w * s), 'height': min(vh, h * s)})
    pg.evaluate('VS.App.paused = false')
    shots.append((label, path))


def run(pg, bid):
    new_game(pg)
    pg.evaluate('VSDebug.allAbilities(); VSDebug.god(true); VS.App.game.hideHUD = true')
    warp(pg, ROOMS[bid]); place_for_boss(pg, ROOMS[bid])
    wait(pg, 'T.bossEnts().length > 0 && !T.bossEnts()[0].intro', 14)
    pg.evaluate('''(() => { const b = T.bossEnts()[0]; T.B = b; b.hp = b.maxHp = 99999; b.K = Object.assign({}, b.K, { think() {} }); b.cool = 99; const p = T.p();
      if (b.perches) { const P = b.perches[b.perchI]; p.x = P.x0 + 1; p.y = P.y - p.h - 1; p.vy = 0; b.x = (P.x0 + P.x1) / 2 - b.w / 2; b.facing = -1; return; }
      b.facing = p.cx < b.cx ? -1 : 1; b.x = p.cx + (p.cx < b.cx ? 70 : -70) - b.w / 2; })()''')
    frames(pg, 20)
    shots = []
    grab(pg, shots, 'parado')
    pg.evaluate('T.hooks.push(() => { const e = T.B; if (e.defeated || e.perches) return true; e.vx = e.facing * 50; if (T.B.__w++ > 30) { e.vx = 0; return true; } }); T.B.__w = 0')
    frames(pg, 16); grab(pg, shots, 'andar'); frames(pg, 30)
    names = pg.evaluate('Object.keys(T.B.K.attacks || {})')
    for n in names:
        pg.evaluate(f'(() => {{ const b = T.B; const p = T.p(); b.facing = p.cx < b.cx ? -1 : 1; b.vx = 0; b.attack("{n}"); }})()')
        w = pg.evaluate(f'T.B.K.attacks["{n}"].wind')
        frames(pg, max(2, int(w * 60 * 0.8))); grab(pg, shots, f'{n} (antecipação)')
        wait(pg, '!T.B.atk || T.B.atk.phase !== "wind"', 4); frames(pg, 3); grab(pg, shots, f'{n} (golpe)')
        wait(pg, '!T.B.atk || T.B.atk.phase === "rec"', 4); frames(pg, 6); grab(pg, shots, f'{n} (recuperação)')
        wait(pg, '!T.B.atk', 6); frames(pg, 20)
        pg.evaluate('(() => { const b = T.B, p = T.p(); b.underground = false; b.hittable = true; if (!b.perches) b.x = p.cx + (p.cx < b.cx ? 70 : -70) - b.w / 2; else { const P = b.perches[b.perchI]; b.x = (P.x0 + P.x1) / 2 - b.w / 2; b.y = P.y - b.h; } b.vx = 0; b.vy = 0; b.attackHBs = []; })()'); frames(pg, 12)
    if bid == 'aldric':
        # fraqueza: embate na parede → cai de costas, fica estendido e levanta-se
        pg.evaluate('(() => { const b = T.B, p = T.p(); b.atk = null; b.vx = 0; b.knock = { t: 0, ph: "fall" }; b.K = Object.assign({}, b.K, { think: VS.Bosses.DEFS.aldric.think }); })()')
        frames(pg, 20); grab(pg, shots, 'derrubado (a cair)')
        wait(pg, 'T.B.knock && T.B.knock.ph === "down"', 3); frames(pg, 20); grab(pg, shots, 'derrubado (no chão)')
        wait(pg, 'T.B.knock && T.B.knock.ph === "getup"', 4); frames(pg, 30); grab(pg, shots, 'a levantar-se')
        wait(pg, '!T.B.knock', 3); pg.evaluate('T.B.K = Object.assign({}, T.B.K, { think() {} }); T.B.cool = 99'); frames(pg, 10)
    if bid == 'mariposa':
        # fraqueza: depois do pó pousa e descansa de asas fechadas
        pg.evaluate('(() => { const b = T.B; b.atk = null; b.cool = 99; b.wantRest = true; b.K = Object.assign({}, b.K, { think: VS.Bosses.DEFS.mariposa.think }); })()')
        wait(pg, 'T.B.resting > 0', 4); frames(pg, 4); grab(pg, shots, 'a pousar')
        frames(pg, 40); grab(pg, shots, 'pousada (ponto fraco)')
        wait(pg, '!(T.B.resting > 0)', 5); pg.evaluate('T.B.K = Object.assign({}, T.B.K, { think() {} }); T.B.cool = 99; T.B.vy = 0; T.B.y -= 40'); frames(pg, 10)
    pg.evaluate('T.B.lastHitT = 0.04; T.B.flash = 0'); frames(pg, 1); grab(pg, shots, 'ferido'); frames(pg, 20)
    pg.evaluate('T.B.doStagger(2, T.g(), true)'); frames(pg, 10); grab(pg, shots, 'atordoado')
    pg.evaluate('T.B.stagger = 0; T.B.hp = 0; T.B.die(T.g())'); frames(pg, 40); grab(pg, shots, 'derrota'); frames(pg, 40); grab(pg, shots, 'derrota 2')
    ims = [(lab, Image.open(p)) for lab, p in shots]
    W = max(i.width for _, i in ims); H = max(i.height for _, i in ims)
    cols = 4; rows = (len(ims) + cols - 1) // cols
    sh = Image.new('RGB', (W * cols, (H + 22) * rows), (16, 14, 18)); d = ImageDraw.Draw(sh)
    for k, (lab, im) in enumerate(ims):
        x, y = (k % cols) * W, (k // cols) * (H + 22)
        sh.paste(im, (x, y + 22)); d.text((x + 6, y + 4), f'{bid}: {lab}', fill=(230, 220, 200), font=FONT)
    sh.thumbnail((2000, 2600)); sh.save(OUTA / f'boss_{bid}.png')
    for _, p in shots:
        p.unlink()


def main(ids):
    with sync_playwright() as pw:
        b = pw.chromium.launch(args=ARGS)
        pg = b.new_page(viewport={'width': 1920, 'height': 1080}); errs = []; page_errors(pg, errs)
        boot(pg)
        for i in ids:
            run(pg, i); print(i, 'ok')
            pg.evaluate('VS.UI.closeAll && VS.UI.closeAll(); if (VS.App.mode !== "game") VS.App.toMenu()')
        print('erros:', errs[:5])
        b.close()


if __name__ == '__main__':
    main(sys.argv[1:] or ['coveiro'])
