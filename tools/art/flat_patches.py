"""Encontra e apaga bocados de fundo colados dentro das figuras (retângulos lisos e cinzentos, como entre as pernas):
píxeis quase sem textura (desvio local baixo), pouco saturados, em manchas grandes com cantos retos.
Uso: flat_patches.py sprites.json pasta [--dry] nome..."""
import json, sys, numpy as np, pathlib
from PIL import Image
from scipy import ndimage
meta = json.load(open(sys.argv[1])); folder = pathlib.Path(sys.argv[2])
dry = '--dry' in sys.argv
names = [a for a in sys.argv[3:] if not a.startswith('--')]
for nm in names:
    p = folder / f'{nm}.png'; im = np.array(Image.open(p).convert('RGBA')).astype(float)
    death = set()
    for k, a in meta[nm]['anims'].items():
        if 'death' in k or 'dissolve' in k: death |= set(a['frames'])
    total = 0; hits = []
    for i, f in enumerate(meta[nm]['frames']):
        if i in death: continue
        y0, x0, h, w = f['y'], f['x'], f['h'], f['w']
        sub = im[y0:y0+h, x0:x0+w]
        a = sub[..., 3] > 200
        lum = sub[..., :3] @ np.array([0.3, 0.59, 0.11])
        mean = ndimage.uniform_filter(lum, 5); sq = ndimage.uniform_filter(lum * lum, 5)
        std = np.sqrt(np.maximum(0, sq - mean * mean))
        sat = sub[..., :3].max(2) - sub[..., :3].min(2)
        flat = a & (std < 3.0) & (sat < 22) & (lum > 60) & (lum < 200)
        flat = ndimage.binary_opening(flat, iterations=1)
        lab, n = ndimage.label(flat)
        for k in range(1, n + 1):
            m = lab == k; s = int(m.sum())
            if s < 45: continue
            ys, xs = np.where(m); fill = s / ((np.ptp(ys) + 1) * (np.ptp(xs) + 1))
            if fill < 0.45: continue
            grow = ndimage.binary_dilation(m, iterations=2) & a & (np.abs(lum - lum[m].mean()) < 10) & (sat < 26)
            hits.append((i, s, round(fill, 2), int(lum[m].mean())))
            if not dry: sub[grow, 3] = 0
            total += int(grow.sum())
    if not dry: Image.fromarray(im.astype(np.uint8)).save(p)
    print(nm, 'manchas:', len(hits), 'píxeis:', total, hits[:10])
