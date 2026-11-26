"""Quadro redesenhado no Gemini (fundo magenta) que substitui um quadro existente da folha do Godot, encaixado por
cima do original (procura o deslocamento que melhor sobrepõe a parte de baixo dos dois). Guarda todas as peças
(terra, pedras), passa para a paleta da folha (as cores vivas ficam) e põe o contorno escuro.
Uso: python3 tools/import_gemini_match.py <imagem> <folha> <quadro> <escala>"""
import json, sys, pathlib
import numpy as np
from PIL import Image
import scipy.ndimage as ndi
ROOT = pathlib.Path(__file__).resolve().parents[1]
src, name, idx, k = sys.argv[1], sys.argv[2], int(sys.argv[3]), float(sys.argv[4])
g = np.asarray(Image.open(src).convert('RGB')).astype(int)
r, gg, b = g[..., 0], g[..., 1], g[..., 2]
mag = (r > 140) & (b > 140) & (gg < 130) & (r - gg > 60)
fg = ~mag
# tira a moldura arredondada/margem: só peças com tamanho
lab, n = ndi.label(fg)
sizes = ndi.sum(fg, lab, range(1, n + 1))
keep = np.isin(lab, [i + 1 for i, s in enumerate(sizes) if s >= 40])
ys, xs = np.where(keep)
crop = np.zeros((ys.max() - ys.min() + 1, xs.max() - xs.min() + 1, 4), np.uint8)
crop[..., :3] = g[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
crop[..., 3] = np.where(keep[ys.min():ys.max() + 1, xs.min():xs.max() + 1], 255, 0)
w2, h2 = round(crop.shape[1] * k), round(crop.shape[0] * k)
small = np.asarray(Image.fromarray(crop).resize((w2, h2), Image.BOX)).astype(int)
alpha = small[..., 3] > 110
data = json.load(open(ROOT / 'godot/data/sprites.json', encoding='utf-8'))
sheet = np.asarray(Image.open(ROOT / f'godot/art/sprites/{name}.png').convert('RGBA'))
pal = []
for i in (14, 15, 17, 18):
    f = data[name]['frames'][i]
    a = sheet[f['y']:f['y'] + f['h'], f['x']:f['x'] + f['w']].reshape(-1, 4)
    pal.append(a[a[:, 3] > 250][:, :3])
pal = np.concatenate(pal)
uniq, cnt = np.unique((pal // 6) * 6, axis=0, return_counts=True)
pal = uniq[np.argsort(-cnt)[:64]].astype(int)
flat = small[..., :3].reshape(-1, 3)
d = ((flat[:, None, :] - pal[None, :, :]) ** 2).sum(-1)
out = np.zeros_like(small, dtype=np.uint8)
out[..., :3] = pal[d.argmin(1)].reshape(small.shape[0], small.shape[1], 3)
out[..., 3] = np.where(alpha, 255, 0)
sc = small[..., :3]; sat = sc.max(-1) - sc.min(-1)
hot = (sat > 70) & (sc[..., 0] > 120)
out[..., :3][hot] = np.clip(sc[hot] * 1.08, 0, 255).astype(np.uint8)
edge = ndi.binary_dilation(alpha) & ~alpha
out[edge] = (20, 14, 20, 255)
# encaixe sobre o quadro original (metade de baixo)
f = data[name]['frames'][idx]
orig = sheet[f['y']:f['y'] + f['h'], f['x']:f['x'] + f['w'], 3] > 100
oh, ow = orig.shape; nh, nw = out.shape[:2]
na = out[..., 3] > 0
best = None
for dy in range(-nh, oh):
    for dx in range(-nw, ow):
        pass
# procura grossa e depois fina por correlação (FFT)
from numpy.fft import fft2, ifft2
H = oh + nh; W = ow + nw
A = np.zeros((H, W)); A[:oh, :ow] = orig.astype(float)
A[:oh // 2, :] = 0
B = np.zeros((H, W)); B[:nh, :nw] = na.astype(float)
corr = np.real(ifft2(fft2(A) * np.conj(fft2(B))))
iy, ix = np.unravel_index(np.argmax(corr), corr.shape)
dy = iy if iy < H - nh else iy - H
dx = ix if ix < W - nw else ix - W
s = data[name]['scale']
SH = Image.open(ROOT / f'godot/art/sprites/{name}.png').convert('RGBA')
big = Image.new('RGBA', (max(SH.size[0], nw), SH.size[1] + nh + 2))
big.paste(SH, (0, 0)); big.paste(Image.fromarray(out), (0, SH.size[1] + 2))
big.save(ROOT / f'godot/art/sprites/{name}.png', optimize=True)
fr = dict(f)
fr.update({'x': 0, 'y': SH.size[1] + 2, 'w': int(nw), 'h': int(nh), 'ox': f['ox'] + dx / s, 'oy': f['oy'] + dy / s})
data[name]['frames'][idx] = fr
json.dump(data, open(ROOT / 'godot/data/sprites.json', 'w', encoding='utf-8'), ensure_ascii=False)
print('ok', out.shape, 'deslocamento', dx, dy)
