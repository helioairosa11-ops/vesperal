"""Plataformas (=) a partir da folha gerada (fundo verde): uma tira por material, à densidade do jogo
(3 px por unidade do mundo), com a linha onde se pisa marcada. Sai em godot/art/tiles/plat_<material>.png
e godot/data/platforms.json.
Uso: python3 tools/make_platforms.py tools/art/gemini/plat_set1.webp"""
import json, sys, pathlib
import numpy as np
from PIL import Image
ROOT = pathlib.Path(__file__).resolve().parents[1]
NAMES = ['wood', 'stone', 'grate', 'cathedral', 'swamp', 'marble']
# espessura (unidades do mundo) da parte de cima onde se pisa, para dar a escala de cada tira
THICK = {'wood': 8.0, 'stone': 9.0, 'grate': 7.0, 'cathedral': 9.5, 'swamp': 8.0, 'marble': 8.5}
DENS = 3.0

def key_green(im):
    a = np.asarray(im.convert('RGB')).astype(np.int16)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    m = np.maximum(r, b)
    alpha = np.where(g - m > 40, 0, 255).astype(np.uint8)
    # tira o verde que fica nas bordas
    g2 = np.where(g > m + 8, m + 8, g)
    out = np.dstack([r, g2, b, alpha]).astype(np.uint8)
    return Image.fromarray(out, 'RGBA')

def bands(alpha):
    rows = (alpha > 0).sum(1) > alpha.shape[1] * 0.02
    out = []; start = None
    for y, v in enumerate(rows):
        if v and start is None: start = y
        if not v and start is not None:
            if y - start > 12: out.append((start, y))
            start = None
    if start is not None: out.append((start, len(rows)))
    return out

def main(src):
    im = key_green(Image.open(src))
    A = np.asarray(im)[..., 3]
    bs = bands(A)
    # as raízes e trepadeiras penduradas às vezes ficam num bando à parte: junta-as ao de cima
    merged = []
    for b in bs:
        if merged and b[0] - merged[-1][1] < 14 and (b[1] - b[0]) < 70 and len(merged) < len(NAMES) + 0:
            merged[-1] = (merged[-1][0], b[1])
        else:
            merged.append(b)
    assert len(merged) == len(NAMES), merged
    meta = {}
    out_dir = ROOT / 'godot' / 'art' / 'tiles'
    for name, (y0, y1) in zip(NAMES, merged):
        strip = im.crop((0, y0, im.width, y1))
        sa = np.asarray(strip)[..., 3] > 0
        cols = np.where(sa.any(0))[0]
        strip = strip.crop((cols.min(), 0, cols.max() + 1, strip.height))
        sa = np.asarray(strip)[..., 3] > 0
        # corpo principal: linhas onde a tira ocupa a maior parte da largura
        full = sa.mean(1) > 0.6
        rows = np.where(full)[0]
        top, body_bot = int(rows.min()), int(rows.max())
        scale = (body_bot - top + 1) / (THICK[name] * DENS)
        w = round(strip.width / scale); h = round(strip.height / scale)
        small = strip.resize((w, h), Image.LANCZOS)
        # alfa limpo (sem meias-transparências do redimensionamento)
        arr = np.asarray(small).copy(); arr[..., 3] = np.where(arr[..., 3] > 110, 255, 0)
        small = Image.fromarray(arr, 'RGBA')
        small.save(out_dir / f'plat_{name}.png')
        meta[name] = {'w': w, 'h': h, 'top': round(top / scale), 'cap': round(w * 0.07), 'dens': DENS}
        print(name, meta[name])
    (ROOT / 'godot' / 'data' / 'platforms.json').write_text(json.dumps(meta, indent=1))

if __name__ == '__main__':
    main(sys.argv[1])
