"""Limpa restos de recorte nas folhas de sprites (fundos cinzentos colados, píxeis azul/ciano/magenta da chave).
Só apaga píxeis ligados à transparência (por inundação a partir das margens), nunca o interior das figuras.
Uso: python3 tools/art/clean_sheets.py <sprites.json> <pasta> nome1 nome2 ...  (escreve por cima; guarda .orig.png)"""
import json, sys, numpy as np, pathlib
from PIL import Image
from scipy import ndimage

meta = json.load(open(sys.argv[1])); folder = pathlib.Path(sys.argv[2])

def keyjunk(rgb):
    r, g, b = rgb[..., 0].astype(int), rgb[..., 1].astype(int), rgb[..., 2].astype(int)
    mx = np.maximum(np.maximum(r, g), b); mn = np.minimum(np.minimum(r, g), b)
    sat = mx - mn
    blue = (b > 150) & (r < 90) & (g < 90)
    cyan = (g > 180) & (b > 150) & (r < 90)
    mag = (r > 180) & (b > 150) & (g < 90)
    green = (g > 170) & (r < 110) & (b < 110)
    return (sat > 120) & (blue | cyan | mag | green)

EXTRA = {'en_sexton': [(133, 127, 113)]}
for nm in sys.argv[3:]:
    p = folder / f'{nm}.png'
    orig = pathlib.Path(__file__).parent / 'orig' / f'{nm}.png'
    src = Image.open(orig if orig.exists() else p).convert('RGBA')
    if not orig.exists(): src.save(orig)
    im = np.array(src)
    a = im[..., 3] > 0
    rgb = im[..., :3].astype(int)
    # cor de fundo colada: a cor opaca mais comum junto à transparência (pouco saturada e clara)
    edge = a & ndimage.binary_dilation(~a, iterations=2)
    cols = (rgb[edge] // 6) * 6
    vals, cnt = np.unique(cols, axis=0, return_counts=True)
    order = np.argsort(-cnt)
    bgs = []
    for i in order[:6]:
        c = vals[i]; s = c.max() - c.min()
        if s < 30 and c.mean() > 95 and cnt[i] > 150: bgs.append(c + 3)
    bgs += [np.array(c) for c in EXTRA.get(nm, [])]
    junk = keyjunk(rgb) & a
    cand = junk.copy()
    for c in bgs:
        cand |= a & (np.abs(rgb - c).max(axis=2) <= (26 if nm in EXTRA else 14))
    removed = np.zeros_like(a)
    for f in meta[nm]['frames']:
        y0, x0, h, w = f['y'], f['x'], f['h'], f['w']
        fa = a[y0:y0+h, x0:x0+w]; fc = cand[y0:y0+h, x0:x0+w]
        # semente: transparência + moldura do fotograma; cresce só por candidatos
        seed = ~fa.copy(); seed[0, :] = True; seed[-1, :] = True; seed[:, 0] = True; seed[:, -1] = True
        grow = ndimage.binary_propagation(seed & (fc | ~fa), mask=(fc | ~fa))
        kill = grow & fc & fa
        removed[y0:y0+h, x0:x0+w] |= kill
    # também os píxeis da chave isolados (ilhas de 1–3 px)
    removed |= junk
    out = im.copy(); out[removed, 3] = 0
    Image.fromarray(out).save(p)
    print(nm, 'fundo:', [tuple(int(v) for v in c) for c in bgs], 'apagados:', int(removed.sum()))
