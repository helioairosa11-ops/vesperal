"""Repõe partes da figura que a remoção do fundo apagou (a máscara e a brasa da protagonista):
os píxeis apagados guardam a cor original; só se repõem os que ficam em entalhes/buracos da silhueta
e têm cor parecida com o vizinho opaco. Uso: restore_cut.py sprites.json pasta nome..."""
import json, sys, numpy as np, pathlib
from PIL import Image
from scipy import ndimage

meta = json.load(open(sys.argv[1])); folder = pathlib.Path(sys.argv[2])
for nm in sys.argv[3:]:
    p = folder / f'{nm}.png'; orig = pathlib.Path(__file__).parent / 'orig' / f'{nm}.png'
    if not orig.exists(): Image.open(p).save(orig)
    im = np.array(Image.open(orig).convert('RGBA')).astype(int)
    total = 0
    for f in meta[nm]['frames']:
        y0, x0, h, w = f['y'], f['x'], f['h'], f['w']
        sub = im[y0:y0+h, x0:x0+w]
        a = sub[..., 3] > 40
        st = ndimage.generate_binary_structure(2, 1)
        closed = ndimage.binary_closing(np.pad(a, 10), structure=st, iterations=9)[10:-10, 10:-10]
        zone = (ndimage.binary_fill_holes(a) | closed) & ~a
        lum = sub[..., :3] @ np.array([0.3, 0.59, 0.11])
        zone &= lum > 40
        cur = a.copy(); added = np.zeros_like(a)
        for it in range(14):
            front = zone & ~cur & ndimage.binary_dilation(cur)
            if not front.any(): break
            ok = np.zeros_like(a)
            ys, xs = np.where(front)
            for y, x in zip(ys, xs):
                y1, y2, x1, x2 = max(0, y-1), min(h, y+2), max(0, x-1), min(w, x+2)
                nb = cur[y1:y2, x1:x2]
                cols = sub[y1:y2, x1:x2, :3][nb]
                if len(cols) and np.abs(cols - sub[y, x, :3]).sum(1).min() < 110: ok[y, x] = True
            if not ok.any(): break
            cur |= ok; added |= ok
        sub[added, 3] = 255
        total += int(added.sum())
    Image.fromarray(im.astype(np.uint8)).save(p)
    print(nm, 'píxeis repostos:', total)
