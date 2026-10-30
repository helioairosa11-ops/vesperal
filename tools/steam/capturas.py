"""Capturas de ecrã para a página da Steam (1920×1080, qualidade alta, sem contador de imagens nem avisos de tutorial).
Uso: python3 tools/steam/capturas.py PASTA_DE_SAÍDA"""
import sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[2] / 'tests'))
from gameplay import sync_playwright, ARGS, boot, new_game, warp, frames, wait

SHOTS = [
    # (nome, sala, x, y, preparação, passos a esperar, teclas a carregar antes da captura)
    ('01_cidade_de_cinza', 'r1_bridge', 34, 13, '', 40, ['KeyJ']),
    ('02_bastiao_tempestade', 'r2_battlement', 20, 12, '', 40, []),
    ('03_jardins_afogados', 'r4_greenhouse', 30, 13, '', 40, []),
    ('04_torre_dos_sinos', 'r5_eaves', 20, 12, '', 40, []),
    ('05_custodio_de_ouro', 'r6_dome', 54, 13, 'custodio', 0, []),
    ('06_a_carpideira', 'r1_market', 20, 13, 'carpideira', 0, []),
]


def main(out):
    out = pathlib.Path(out); out.mkdir(parents=True, exist_ok=True)
    with sync_playwright() as pw:
        b = pw.chromium.launch(args=ARGS)
        pg = b.new_page(viewport={'width': 1920, 'height': 1080})
        boot(pg); new_game(pg)
        pg.evaluate('VSDebug.god(true); VSDebug.allAbilities(); VS.App.showFps = false; VS.settings.showFps = false')
        pg.add_style_tag(content='#area-title, #toast { visibility: hidden !important; }')  # sem títulos de área nem avisos
        for name, room, x, y, prep, n, keys in SHOTS:
            warp(pg, room, x, y)
            pg.evaluate('VS.App.showFps = false; T.clean && T.clean()')
            if prep == 'custodio':
                pg.evaluate('T.g().ents.filter((e) => e.isEnemy).forEach((e) => e.remove = true)')
                pg.evaluate('T.key("KeyA", true)'); frames(pg, 60); pg.evaluate('T.key("KeyA", false)')
                wait(pg, 'T.bossEnts().length && !T.bossEnts()[0].intro', 12)
                # a protagonista perto dele, no chão; o Custódio solta os raios
                pg.evaluate("(() => { const p = T.p(); p.x = 29 * 20; p.y = 15 * 20 - p.h - 1; p.vx = 0; p.vy = 0; p.facing = -1; p.dir = -1; const e = T.bossEnts()[0]; e.K = Object.assign({}, e.K, { think() {} }); e.atk = null; e.cool = 99; e.attack('rays'); })()")
                frames(pg, 55)
            elif prep == 'carpideira':
                pg.evaluate('T.g().ents.filter((e) => e.isEnemy).forEach((e) => e.remove = true); VSDebug.wanderer()')
                wait(pg, "T.bossEnts().some((e) => e.bossId === 'carpideira') && !T.bossEnts()[0].intro", 12); frames(pg, 30)
                pg.evaluate("(() => { const e = T.bossEnts()[0], p = T.p(); p.x = e.cx + 130; p.y = e.y + e.h - p.h; p.vx = 0; p.vy = 0; p.facing = -1; p.dir = -1; e.K = Object.assign({}, e.K, { think() {} }); e.atk = null; e.cool = 99; e.attack('scream'); })()")
                frames(pg, 40)
            else:
                frames(pg, n)
            for k in keys:
                pg.evaluate(f'T.tap("{k}", 3)'); frames(pg, 7)
            pg.wait_for_timeout(300)
            pg.screenshot(path=str(out / f'{name}.png')); print(name, flush=True)
        b.close()


if __name__ == '__main__':
    main(sys.argv[1] if len(sys.argv) > 1 else 'tests/out/steam/capturas')
