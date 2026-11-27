"""Tira pedaços soltos de outras poses que ficaram dentro do quadro de cada sprite (restos do recorte):
componentes pequenos (< 4% da figura principal) que tocam a borda do quadro.
Uso: python3 tools/drop_fragments.py <nome_folha> [...]   (ex.: en_b_caedmon; reescreve assets/sprites/<nome>.png)"""
import json, re, sys, pathlib
import numpy as np
from PIL import Image
import scipy.ndimage as ndi
ROOT = pathlib.Path(__file__).resolve().parents[1]

def run(name):
    js = (ROOT / 'assets' / 'sprites' / f'{name}.js').read_text(encoding='utf-8')
    meta = json.loads(re.search(r'= (\{.*\});', js).group(1))
    p = ROOT / 'assets' / 'sprites' / f'{name}.png'
    a = np.asarray(Image.open(p).convert('RGBA')).copy()
    n = 0
    for f in meta['frames']:
        x, y, w, h = f['x'], f['y'], f['w'], f['h']
        sub = a[y:y + h, x:x + w]
        solid = sub[..., 3] > 0
        lab, k = ndi.label(solid, structure=np.ones((3, 3)))
        if k < 2: continue
        sizes = ndi.sum(solid, lab, range(1, k + 1))
        big = sizes.max()
        for i, s in enumerate(sizes, 1):
            if s >= big * 0.04: continue
            m = lab == i
            ys, xs = np.where(m)
            if ys.min() == 0 or xs.min() == 0 or ys.max() == h - 1 or xs.max() == w - 1:
                sub[..., 3][m] = 0; n += 1
    Image.fromarray(a).save(p, optimize=True)
    print(name, n, 'pedaços soltos tirados')

if __name__ == '__main__':
    for nm in sys.argv[1:]: run(nm)
