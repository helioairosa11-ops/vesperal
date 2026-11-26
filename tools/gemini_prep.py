"""Prepara uma imagem do Gemini (fundo magenta) para import_gemini_match.py: separa as figuras (colunas vazias),
tapa os pontinhos magenta dentro da figura com a cor vizinha e escurece um pouco (gama).
Uso: python3 tools/gemini_prep.py <imagem> <pasta_saida> <prefixo> [gama]"""
import sys, pathlib
import numpy as np
from PIL import Image
import scipy.ndimage as ndi
src, out, pre = sys.argv[1], pathlib.Path(sys.argv[2]), sys.argv[3]
gam = float(sys.argv[4]) if len(sys.argv) > 4 else 1.1
g = np.asarray(Image.open(src).convert('RGB')).astype(float)
r, gg, b = g[..., 0], g[..., 1], g[..., 2]
mag = (r > 140) & (b > 140) & (gg < 130) & (r - gg > 60)
# buracos: zonas magenta que não tocam a borda e são pequenas, ou rodeadas quase só de figura
lab, n = ndi.label(mag)
border = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]])))
sizes = ndi.sum(mag, lab, range(1, n + 1))
hole = np.isin(lab, [i + 1 for i in range(n) if (i + 1) not in border and sizes[i] < 4000])
# pontinhos colados à orla: magenta com >=5 de 8 vizinhos de figura
fg = ~mag
nb = ndi.convolve(fg.astype(int), np.ones((3, 3), int), mode='constant') - fg
hole |= mag & (nb >= 5)
# pontos roxos (magenta escurecido pela compressão) dentro da figura
purple = fg & (r - gg > 35) & (b - gg > 35) & (b > 70)
hole |= ndi.binary_dilation(purple)& ~mag | purple
fgm = fg & ~hole
idx = ndi.distance_transform_edt(~fgm, return_distances=False, return_indices=True)
g2 = g.copy(); g2[hole] = g[idx[0][hole], idx[1][hole]]
o = 255 * (g2 / 255) ** gam
o[~(fgm | hole)] = (255, 0, 255)
cols = (fgm | hole)[20:-20].sum(0); cols[:20] = 0; cols[-20:] = 0
on = cols > 0
runs = []; x = 0
while x < len(on):
    if on[x]:
        s = x
        while x < len(on) and on[x]: x += 1
        runs.append([s, x])
    x += 1
# junta pedaços separados por poucas colunas
mr = []
for a, b2 in runs:
    if mr and a - mr[-1][1] < 25: mr[-1][1] = b2
    else: mr.append([a, b2])
mr = [m for m in mr if m[1] - m[0] > 60]
out.mkdir(parents=True, exist_ok=True)
for i, (a, b2) in enumerate(mr):
    p = out / f'{pre}_{i}.png'
    Image.fromarray(o[:, max(0, a - 10):b2 + 10].clip(0, 255).astype(np.uint8)).save(p); print(p, b2 - a)
