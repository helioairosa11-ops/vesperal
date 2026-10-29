"""Teste de fumo: arranque, menu, novo jogo, movimento e combate básicos no browser real (Chromium)."""
import sys, time, pathlib
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parents[1]
OUT = ROOT / 'tests' / 'out'
OUT.mkdir(exist_ok=True)
URL = (ROOT / 'index.html').as_uri() + '?debug=1'

def main():
    errors = []
    with sync_playwright() as p:
        b = p.chromium.launch(args=['--autoplay-policy=no-user-gesture-required'])
        pg = b.new_page(viewport={'width': 1280, 'height': 720})
        pg.on('console', lambda m: errors.append(f'[{m.type}] {m.text}') if m.type in ('error', 'warning') else None)
        pg.on('pageerror', lambda e: errors.append(f'[pageerror] {e}'))
        pg.goto(URL)
        pg.wait_for_timeout(1500)
        pg.screenshot(path=str(OUT / '01_menu.png'))
        pg.click('text=Jogar') if pg.locator('text=Jogar').count() else pg.click('text=Play')
        pg.wait_for_timeout(400)
        pg.locator('.slot').first.click()
        pg.wait_for_timeout(1200)
        for _ in range(8):
            pg.keyboard.press('Enter'); pg.wait_for_timeout(250)
        pg.wait_for_timeout(1500)
        pg.screenshot(path=str(OUT / '02_wake.png'))
        # andar, saltar, atacar
        pg.keyboard.down('KeyD'); pg.wait_for_timeout(300); pg.keyboard.press('Space'); pg.wait_for_timeout(900); pg.keyboard.up('KeyD')
        pg.keyboard.press('KeyJ'); pg.wait_for_timeout(80); pg.screenshot(path=str(OUT / '03_attack.png'))
        pg.wait_for_timeout(500)
        st = pg.evaluate('VSDebug.state() && {room: VSDebug.state().room, hp: VSDebug.state().hp}')
        pos = pg.evaluate('({x: VSDebug.game().player.x, y: VSDebug.game().player.y, ground: VSDebug.game().player.onGround})')
        print('state', st, 'player', pos)
        b.close()
    print('\n'.join(errors[:60]) or 'sem erros')

if __name__ == '__main__':
    main()
