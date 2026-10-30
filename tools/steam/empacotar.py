"""Faz os pacotes para distribuir o jogo:
  Vesperal-web-<versão>.zip    — o jogo como página (abre-se o index.html; também serve para o itch.io)
  Vesperal-Steam-<versão>.zip  — o projeto da versão de computador (Electron) com o jogo dentro e as imagens da Steam
Uso: python3 tools/steam/empacotar.py VERSÃO PASTA_DE_SAÍDA [PASTA_DAS_IMAGENS_DA_STEAM]"""
import sys, zipfile, pathlib

ROOT = pathlib.Path(__file__).resolve().parents[2]
GAME = ['index.html', 'LICENSE', 'css', 'js', 'assets']
SKIP = {'__pycache__', '.DS_Store', 'node_modules', 'dist'}


def add(z, src, arc):
    src = pathlib.Path(src)
    if src.is_dir():
        for p in sorted(src.rglob('*')):
            if p.is_file() and not any(part in SKIP for part in p.parts):
                z.write(p, f'{arc}/{p.relative_to(src).as_posix()}')
    elif src.exists():
        z.write(src, arc)


def main(ver, out, imgs=None):
    out = pathlib.Path(out); out.mkdir(parents=True, exist_ok=True)
    web = out / f'Vesperal-web-{ver}.zip'
    with zipfile.ZipFile(web, 'w', zipfile.ZIP_DEFLATED, compresslevel=9) as z:
        for f in GAME: add(z, ROOT / f, f)  # na raiz do zip: o itch.io procura o index.html aí
        z.writestr('JOGAR.txt', 'Vesperal: A Última Chama\n\nAbre o ficheiro index.html num navegador (Chrome, Edge, Firefox ou Safari) para jogar.\n'
                   'Funciona sem internet. As gravações ficam no navegador.\nTambém serve tal como está para publicar no itch.io (jogo HTML: envia este zip).\n')
    steam = out / f'Vesperal-Steam-{ver}.zip'
    D = ROOT / 'desktop'
    with zipfile.ZipFile(steam, 'w', zipfile.ZIP_DEFLATED, compresslevel=9) as z:
        for f in ['package.json', 'main.js', 'preload.js', 'LEIA-ME-STEAM.md', 'build', 'scripts', 'steam']: add(z, D / f, f'Vesperal-Steam/{f}')
        for f in GAME: add(z, ROOT / f, f'Vesperal-Steam/game/{f}')
        if imgs: add(z, imgs, 'Vesperal-Steam/imagens-steam')
    for p in (web, steam): print(p.name, round(p.stat().st_size / 1e6, 2), 'MB')


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2], sys.argv[3] if len(sys.argv) > 3 else None)
