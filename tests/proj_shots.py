"""Projéteis pintados dentro do jogo: um de cada tipo parado no ar à frente do herói. → tests/out/audit/projectiles.png"""
import sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).parent))
from gameplay import *
OUTA = ROOT / 'tests' / 'out' / 'audit'
KINDS = [('bolt', '#c0b090', 12, 4), ('orb', '#ff9040', 9, 9), ('spark', '#ffb040', 12, 10), ('molten', '#ff7020', 10, 10), ('ingot', '#ff8030', 10, 6), ('clod', '#5a4a3a', 10, 10), ('note', '#d0a0ff', 9, 9), ('light', '#ffe8a0', 10, 10), ('glass', '#ff6080', 7, 7), ('glass', '#6080ff', 7, 7), ('seed', '#5a7a30', 8, 8), ('thorn', '#4a5a2a', 10, 4), ('moth', '#d8c8a0', 8, 8), ('feather', '#1a1820', 12, 4), ('wave', '#e8d090', 10, 26), ('fire', '#ff6010', 20, 8), ('shockwave', '#ff8040', 14, 10), ('shockwave', '#a08060', 16, 12), ('incense', '#a090b0', 12, 12), ('spiritwave', '#c8b0ff', 14, 22)]
with sync_playwright() as pw:
    b = pw.chromium.launch(args=ARGS); pg = b.new_page(viewport={'width': 1920, 'height': 1080}); errs = []; page_errors(pg, errs)
    boot(pg); new_game(pg); pg.evaluate('VSDebug.god(true); VS.App.game.hideHUD = true')
    warp(pg, 'r1_bridge', 12, 12); frames(pg, 40)
    pg.evaluate('T.g().ents.filter((e) => e.isEnemy).forEach((e) => e.remove = true)')
    js = '(() => { const p = T.p(); const K = ' + str([list(k) for k in KINDS]).replace("'", '"') + '; K.forEach(([k, c, w, h], i) => { const pr = new VS.Projectile({ x: p.cx + 30 + (i % 10) * 26, y: p.cy - 50 + Math.floor(i / 10) * 40, vx: (i % 3 === 2 ? -1 : 1) * 0.001, vy: (i % 4 === 1 ? 0.0005 : 0), w, h, kind: k, color: c, life: 99, solid: false, team: "none" }); pr.update = function (dt) { this.t = (this.t || 0) + dt; }; T.g().spawn(pr); }); })()'
    pg.evaluate(js); frames(pg, 20)
    pg.evaluate('VS.App.paused = true'); pg.wait_for_timeout(60)
    x, y, s = pg.evaluate('''() => { const p = T.p(), G = VS.Gfx, r = document.getElementById('game').getBoundingClientRect(), d = window.devicePixelRatio || 1; return [r.left + (p.cx - G.cam.x) * G.scale / d, r.top + (p.cy - G.cam.y) * G.scale / d, G.scale / d]; }''')
    pg.screenshot(path=str(OUTA / 'projectiles.png'), clip={'x': x + 10 * s, 'y': y - 80 * s, 'width': 280 * s, 'height': 100 * s})
    print(errs[:3]); b.close()
