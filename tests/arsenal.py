"""Arsenal e efeitos de combate no jogo real: inventário (armas/trajes), equipar, impactos por material,
parry, golpe carregado e o segredo do Ossário. Capturas em tests/out/audit/arsenal_*.png

Uso: python3 tests/arsenal.py
"""
import sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).parent))
from gameplay import *
from PIL import Image

OUTA = ROOT / 'tests' / 'out' / 'audit'
OUTA.mkdir(parents=True, exist_ok=True)
POS = '''() => { const p = T.p(), G = VS.Gfx, r = document.getElementById('game').getBoundingClientRect(), d = window.devicePixelRatio || 1;
  return [r.left + (p.cx - G.cam.x) * G.scale / d, r.top + (p.cy - G.cam.y) * G.scale / d, G.scale / d]; }'''
# pausa o jogo no primeiro fotograma em que um efeito do tipo pedido existe
PAUSE_ON = '''(type) => { T.fxHit = false; T.hooks.push(() => { if (VS.FX.list.some((e) => e.type === type && e.t > 0.02)) { VS.App.paused = true; T.fxHit = true; return true; } }); }'''


def clip(pg, path, w=110, h=64, dy=-6):
    x, y, s = pg.evaluate(POS)
    pg.screenshot(path=str(path), clip={'x': x - w / 2 * s + 18 * s, 'y': y - h / 2 * s + dy * s, 'width': w * s, 'height': h * s})


def sheet(paths, out, cols=3):
    ims = [Image.open(p) for p in paths]
    w = max(i.width for i in ims); h = max(i.height for i in ims)
    rows = (len(ims) + cols - 1) // cols
    sh = Image.new('RGB', (w * cols, h * rows))
    for k, im in enumerate(ims):
        sh.paste(im, ((k % cols) * w, (k // cols) * h))
    sh.thumbnail((1900, 1900)); sh.save(out)
    for p in paths:
        pathlib.Path(p).unlink()


def main():
    R = Runner()
    with sync_playwright() as pw:
        b = pw.chromium.launch(args=ARGS)
        pg = b.new_page(viewport={'width': 1920, 'height': 1080}); errs = []; page_errors(pg, errs)
        boot(pg); new_game(pg)
        pg.evaluate('VSDebug.god(true); VSDebug.allAbilities()')
        # ---- armas como itens: dar, aparecem no arsenal, equipar
        pg.evaluate('''for (const w of ['navalhas','malho','alabarda','espirito','montante']) VS.state.give('w_' + w); VS.state.give('helm_sino');''')
        R.check('arsenal: 6 armas', pg.evaluate('VS.state.weapons.length') == 6, pg.evaluate('VS.state.weapons'))
        R.check('traje do Sineiro desbloqueado', pg.evaluate('VS.state.hasLook("sino")'))
        pg.evaluate('VS.Menus.inventory("weapons")'); frames(pg, 2)
        n = pg.evaluate('document.querySelectorAll(".inventory .inv-slot:not(.empty)").length')
        R.check('inventário lista armas + trajes + ferramentas', n >= 8, n)
        # focar a alabarda para mostrar os números
        pg.evaluate('''(() => { const b = [...document.querySelectorAll('.inventory .inv-slot:not(.empty)')][3]; b.dispatchEvent(new MouseEvent('mouseenter')); VS.UI.top() && VS.UI.top().onFocus && VS.UI.top().onFocus(b); })()''')
        frames(pg, 2)
        pg.screenshot(path=str(OUTA / 'arsenal_inventory.png'))
        R.check('descrição com estatísticas', pg.evaluate('!!document.querySelector(".inventory .wstats")'))
        # equipar o malho clicando
        pg.evaluate('''[...document.querySelectorAll('.inventory .inv-slot:not(.empty)')][2].click()''')
        R.check('equipar pelo inventário', pg.evaluate('VS.state.weaponId') == 'malho', pg.evaluate('VS.state.weaponId'))
        pg.evaluate('''[...document.querySelectorAll('.inventory .inv-slot:not(.empty)')].find((b) => (b.getAttribute('aria-label') || '').includes(VS.t('item_helm_sino_name'))).click()''')
        R.check('trocar traje pelo inventário', pg.evaluate('VS.state.look') == 'sino')
        pg.evaluate('VS.UI.closeAll(); VS.App.paused = false; VS.state.look = "capuz"'); frames(pg, 5)

        # ---- impactos por material e por arma
        warp(pg, 'r1_bridge', 12, 12); frames(pg, 40)
        shots = []
        combos = [('desperto', 'husk'), ('desperto', 'sentinel'), ('navalhas', 'crawler'), ('malho', 'sentinel'), ('alabarda', 'raven'),
                  ('espirito', 'courtier'), ('espirito', 'vitrail'), ('montante', 'gargoyle'), ('malho', 'husk')]
        for wid, kind in combos:
            pg.evaluate(f'''(() => {{ VS.state.weaponId = "{wid}"; const p = T.p(); p.facing = 1; p.action = null; p.vx = 0;
              T.g().ents.filter((e) => e.isEnemy).forEach((e) => e.remove = true); }})()''')
            frames(pg, 6)
            pg.evaluate(f'''(() => {{ const e = T.spawnEnemy("{kind}", 26); e.hp = e.maxHp = 9999; e.think = null; e.K = Object.assign({{}}, e.K, {{ think() {{}} }}); e.aggro = false;
              e.perched = false; e.fade = 1; e.hidden = false;
              const p = T.p(); e.x = p.cx + 9; e.y = e.flying ? p.cy - e.h / 2 - 4 : p.bottom - e.h; e.vx = e.vy = 0; e.gravity = e.flying ? 0 : e.gravity; }})()''')
            frames(pg, 3)
            pg.evaluate(PAUSE_ON, 'cut' if wid != 'malho' else 'flare')
            low = kind == 'crawler'  # rastejante: golpe agachado
            pg.evaluate('T.key("KeyS", true); T.tap("KeyJ", 3)' if low else 'T.tap("KeyJ", 3)')
            ok = wait(pg, 'T.fxHit', 4)
            if low:
                pg.evaluate('T.key("KeyS", false)')
            path = OUTA / f'_a_{len(shots)}.png'
            clip(pg, path); shots.append(path)
            R.check(f'impacto {wid} → {kind}', ok, pg.evaluate('VS.FX.list.map((e) => e.type).join(",")'))
            pg.evaluate('VS.App.paused = false'); frames(pg, 30)
        # ---- parry
        pg.evaluate('VS.state.weaponId = "desperto"; T.g().ents.filter((e) => e.isEnemy).forEach((e) => e.remove = true)'); frames(pg, 10)
        pg.evaluate('T.hits = []; T.p().iframes = 0; T.p().facing = 1'); pg.evaluate(PAUSE_ON, 'cut')
        pg.evaluate('''() => { const pr = T.shoot(90, 260); T.hooks.push(() => { if (Math.abs(pr.cx - T.p().cx) < 26) { T.tap("KeyI", 4); return true; } }); }''')
        ok = wait(pg, 'T.fxHit', 3); path = OUTA / f'_a_{len(shots)}.png'; clip(pg, path); shots.append(path)
        R.check('parry com efeito', ok and 'parry' in pg.evaluate('T.hits'), pg.evaluate('T.hits'))
        pg.evaluate('VS.App.paused = false'); frames(pg, 40)
        # ---- golpe carregado (Golpe de Forja)
        for wid in ['desperto', 'espirito', 'montante']:
            pg.evaluate(f'VS.state.weaponId = "{wid}"; T.p().facing = 1'); frames(pg, 5)
            pg.evaluate('T.key("KeyK", true)'); frames(pg, 52)
            pg.evaluate('VS.App.paused = true'); path = OUTA / f'_a_{len(shots)}.png'; clip(pg, path); shots.append(path)
            R.check(f'carga pronta ({wid})', pg.evaluate('!!(T.p().action && T.p().action.charged)'))
            pg.evaluate('VS.App.paused = false; T.key("KeyK", false)'); frames(pg, 50)
        sheet(shots, OUTA / 'arsenal_fx.png', cols=3)

        # ---- segredo do Ossário: Lâmina do Espírito
        pg.evaluate('VS.state.weapons = ["desperto"]; VS.state.weaponId = "desperto"')
        warp(pg, 'r1_crypt', 11, 14); frames(pg, 30)
        has = pg.evaluate('T.g().ents.some((e) => e.wid === "espirito")')
        R.check('relicário da Lâmina do Espírito no Ossário', has)
        pg.evaluate('(() => { const s = T.g().ents.find((e) => e.wid === "espirito"); const p = T.p(); p.x = s.cx - p.w / 2 + 24; p.facing = -1; })()'); frames(pg, 20)
        x, y, s = pg.evaluate(POS)
        pg.screenshot(path=str(OUTA / 'arsenal_shrine.png'), clip={'x': x - 80 * s, 'y': y - 50 * s, 'width': 140 * s, 'height': 70 * s})
        pg.evaluate('T.tap("KeyE", 3)'); frames(pg, 20)
        R.check('apanhar a Lâmina do Espírito', 'espirito' in pg.evaluate('VS.state.weapons'), pg.evaluate('VS.state.weapons'))

        # ---- recompensas e loja
        R.check('Matilheira dá as Navalhas', ['w_navalhas', 1] in pg.evaluate('VS.Story.REWARDS.matilheira.items'))
        R.check('Autómato dá o Malho', ['w_malho', 1] in pg.evaluate('VS.Story.REWARDS.automato.items'))
        R.check('Sineiro dá o Elmo', ['helm_sino', 1] in pg.evaluate('VS.Story.REWARDS.sineiro.items'))
        R.check('Aldric dá o Montante', ['w_montante', 1] in pg.evaluate('VS.Story.REWARDS.aldric.items'))
        pg.evaluate('VS.state.quests.maren = 2')
        R.check('Maren vende a Alabarda', pg.evaluate('VS.NPCS.maren.stock().some((s) => s.id === "w_alabarda")'))
        R.check('sem erros na página', not errs, errs[:5])
        b.close()
    bad = [r for r in R.results if not r['ok']]
    print(f'\n{len(R.results) - len(bad)}/{len(R.results)} OK')


if __name__ == '__main__':
    main()
