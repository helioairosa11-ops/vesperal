"""Último retoque: píxeis que ainda faltam num entalhe rodeado de máscara clara são pintados pela média
dos vizinhos claros (como o conta-gotas + lápis de um editor de pixel art), repetido até fechar."""
import json, sys, numpy as np, pathlib
from PIL import Image
from scipy import ndimage
meta = json.load(open(sys.argv[1])); folder = pathlib.Path(sys.argv[2])
for nm in sys.argv[3:]:
    p = folder / f'{nm}.png'; im = np.array(Image.open(p).convert('RGBA')).astype(int); total = 0
    for f in meta[nm]['frames']:
        y0, x0, h, w = f['y'], f['x'], f['h'], f['w']; sub = im[y0:y0+h, x0:x0+w]
        for it in range(6):
            a = sub[..., 3] > 40
            lum = sub[..., :3] @ np.array([0.3, 0.59, 0.11])
            bright = a & (lum > 105)
            nb_b = ndimage.convolve(bright.astype(int), np.ones((3, 3), int), mode='constant')
            nb_a = ndimage.convolve(a.astype(int), np.ones((3, 3), int), mode='constant')
            cand = ~a & (nb_b >= 4) & (nb_a >= 6)
            if not cand.any(): break
            for y, x in zip(*np.where(cand)):
                y1, y2, x1, x2 = max(0, y-1), min(h, y+2), max(0, x-1), min(w, x+2)
                m = bright[y1:y2, x1:x2]
                sub[y, x, :3] = sub[y1:y2, x1:x2, :3][m].mean(0); sub[y, x, 3] = 255; total += 1
    Image.fromarray(im.astype(np.uint8)).save(p); print(nm, 'retocados:', total)
