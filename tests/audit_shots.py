"""Capturas de auditoria: protagonista em várias ações, ícones do inventário, efeitos e chuva."""
import sys, pathlib, time
sys.path.insert(0, str(pathlib.Path(__file__).parent))
from gameplay import *

OUTA = ROOT / 'tests' / 'out' / 'audit'
OUTA.mkdir(parents=True, exist_ok=True)

def clip_player(pg, name, pad=70):
    box = pg.evaluate('''() => { const p = T.p(), G = VS.Gfx; const s = G.scale; const cam = G.cam;
      const r = document.getElementById('game').getBoundingClientRect();
      const x = r.left + (p.cx - cam.x - (cam.sx||0)) * s / (window.devicePixelRatio||1), y = r.top + (p.cy - cam.y - (cam.sy||0)) * s / (window.devicePixelRatio||1);
      return [x, y, s / (window.devicePixelRatio||1)]; }''')
    x, y, s = box
    pg.screenshot(path=str(OUTA / f'{name}.png'), clip={'x': max(0, x - pad * s), 'y': max(0, y - pad * s * 0.8), 'width': pad * 2 * s, 'height': pad * 1.6 * s})

with sync_playwright() as pw:
    b = pw.chromium.launch(args=ARGS)
    pg = b.new_page(viewport={'width': 1920, 'height': 1080}); errs = []; page_errors(pg, errs)
    boot(pg); new_game(pg)
    pg.evaluate('VSDebug.god(true); VSDebug.allAbilities()')
    warp(pg, 'r1_bridge', 10, 12); frames(pg, 40)
    pg.evaluate('T.p().dir = 1; T.p().facing = 1'); frames(pg, 5)
    clip_player(pg, 'p_idle_right')
    pg.evaluate('T.key("KeyA", true)'); frames(pg, 12); clip_player(pg, 'p_run_left'); pg.evaluate('T.key("KeyA", false)'); frames(pg, 20)
    pg.evaluate('T.key("KeyD", true)'); frames(pg, 12); clip_player(pg, 'p_run_right'); pg.evaluate('T.key("KeyD", false)'); frames(pg, 20)
    pg.evaluate('T.tap("Space", 12)'); frames(pg, 8); clip_player(pg, 'p_jump'); frames(pg, 40)
    pg.evaluate('T.tap("KeyJ", 3)'); frames(pg, 9); clip_player(pg, 'p_attack1'); frames(pg, 30)
    pg.evaluate('T.key("KeyK", true)'); frames(pg, 50); clip_player(pg, 'p_heavy_charge'); pg.evaluate('T.key("KeyK", false)'); frames(pg, 6); clip_player(pg, 'p_heavy_release'); frames(pg, 40)
    pg.evaluate('T.tap("KeyL", 3)'); frames(pg, 6); clip_player(pg, 'p_dodge'); frames(pg, 40)
    pg.evaluate('T.key("KeyI", true)'); frames(pg, 20); clip_player(pg, 'p_guard'); pg.evaluate('T.key("KeyI", false)'); frames(pg, 30)
    pg.evaluate('T.key("KeyS", true)'); frames(pg, 10); clip_player(pg, 'p_crouch'); pg.evaluate('T.key("KeyS", false)'); frames(pg, 20)
    pg.screenshot(path=str(OUTA / 'scene_bridge.png'))
    # inventário (ícones)
    pg.evaluate('["salt","oil","incense","feather","ash_steel","r_heron","r_amber","r_rosary","ember_1","letter_1","chalice","hilde_hammer"].forEach((i) => VS.state.give(i))')
    pg.keyboard.press('Tab'); frames(pg, 5); pg.screenshot(path=str(OUTA / 'inv_weapons.png'))
    pg.click('.inventory .tab:nth-child(2)'); frames(pg, 3); pg.screenshot(path=str(OUTA / 'inv_relics.png'))
    pg.click('.inventory .tab:nth-child(4)'); frames(pg, 3); pg.screenshot(path=str(OUTA / 'inv_key.png'))
    pg.keyboard.press('Escape'); frames(pg, 5)
    # chuva (Bastião)
    warp(pg, 'r2_wall', 20, 12); frames(pg, 60); pg.screenshot(path=str(OUTA / 'rain.png'))
    # inimigos de perto
    for kind in ['crawler', 'husk', 'sentinel', 'hound']:
        pg.evaluate(f'T.e = T.spawnEnemy("{kind}", 50)'); frames(pg, 20)
        pg.evaluate('T.p().x = T.e.cx - 120'); frames(pg, 2)
        clip_player(pg, 'enemy_' + kind, pad=90)
        pg.evaluate('T.e.remove = true'); frames(pg, 2)
    print(errs[:5])
    b.close()
