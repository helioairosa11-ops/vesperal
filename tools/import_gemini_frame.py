"""Traz um quadro redesenhado no Gemini (fundo magenta) para a folha do Coveiro no Godot:
recorta o fundo, reduz à escala da personagem, passa as cores para a paleta da própria folha, põe o contorno
escuro e assenta os pés na mesma âncora do quadro que substitui, com a terra desse quadro por baixo.
Uso: python3 tools/import_gemini_frame.py <imagem> <folha> <quadro> <altura_da_figura_px> [espelhar]"""
import json, sys, pathlib
import numpy as np
from PIL import Image
import scipy.ndimage as ndi
ROOT = pathlib.Path(__file__).resolve().parents[1]
src, name, idx, H = sys.argv[1], sys.argv[2], int(sys.argv[3]), int(sys.argv[4])
flip = len(sys.argv) > 5 and sys.argv[5] == 'espelhar'
g = np.asarray(Image.open(src).convert('RGB')).astype(int)
r, gg, b = g[..., 0], g[..., 1], g[..., 2]
fg = ~((r > 140) & (b > 140) & (gg < 130) & (r - gg > 60))
lab, n = ndi.label(fg)
sizes = ndi.sum(fg, lab, range(1, n + 1))
fg = lab == 1 + int(np.argmax(sizes))
fg = ndi.binary_fill_holes(fg) & ~((r > 160) & (b > 160) & (gg < 110))
ys, xs = np.where(fg)
crop = np.zeros((ys.max() - ys.min() + 1, xs.max() - xs.min() + 1, 4), np.uint8)
crop[..., :3] = g[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
crop[..., 3] = np.where(fg[ys.min():ys.max() + 1, xs.min():xs.max() + 1], 255, 0)
# altura da figura (das botas ao cimo da cabeça, sem a pá) — o maior bloco de linhas cheias a partir de baixo
im = Image.fromarray(crop)
k = H / float(crop.shape[0])
w2, h2 = max(1, round(crop.shape[1] * k)), max(1, round(crop.shape[0] * k))
small = np.asarray(im.resize((w2, h2), Image.BOX)).astype(int)
alpha = small[..., 3] > 110
# paleta da própria folha (cores mais usadas da personagem)
data = json.load(open(ROOT / 'godot/data/sprites.json', encoding='utf-8'))
sheet = np.asarray(Image.open(ROOT / f'godot/art/sprites/{name}.png').convert('RGBA'))
pal = []
for i in (14, 15, 17):
    f = data[name]['frames'][i]
    a = sheet[f['y']:f['y'] + f['h'], f['x']:f['x'] + f['w']].reshape(-1, 4)
    pal.append(a[a[:, 3] > 250][:, :3])
pal = np.concatenate(pal)
q = (pal // 6) * 6
uniq, cnt = np.unique(q, axis=0, return_counts=True)
pal = uniq[np.argsort(-cnt)[:64]].astype(int)
flat = small[..., :3].reshape(-1, 3)
d = ((flat[:, None, :] - pal[None, :, :]) ** 2).sum(-1)
out = np.zeros_like(small, dtype=np.uint8)
out[..., :3] = pal[d.argmin(1)].reshape(small.shape[0], small.shape[1], 3)
out[..., 3] = np.where(alpha, 255, 0)
# brasas, olhos e lâmina incandescente: ficam com a cor viva original (a paleta escura apagava-as)
sc = small[..., :3]
sat = sc.max(-1) - sc.min(-1)
hot = (sat > 70) & (sc[..., 0] > 120)
out[..., :3][hot] = np.clip(sc[hot] * 1.08, 0, 255).astype(np.uint8)
# contorno escuro de 1 px por fora
edge = ndi.binary_dilation(alpha) & ~alpha
out[edge] = (20, 14, 20, 255)
if flip:
    out = out[:, ::-1]
# assenta na âncora do quadro e põe a terra do quadro 15 por baixo
f = data[name]['frames'][idx]
s = data[name]['meta']['scale'] if 'meta' in data[name] else data[name]['scale']
f15 = data[name]['frames'][15]
dirt = sheet[f15['y']:f15['y'] + f15['h'], f15['x']:f15['x'] + f15['w']].copy()
c3 = dirt[..., :3].astype(int)
is_dirt = (dirt[..., 3] > 0) & (np.arange(dirt.shape[0])[:, None] > dirt.shape[0] - 26) & ((c3[..., 0] - c3[..., 2] > 5) | (c3.mean(-1) < 40)) & (c3.max(-1) - c3.min(-1) < 60) & (c3.mean(-1) < 110)
dirt[~is_dirt] = 0
# âncora (pés) do quadro 15 em px do quadro
ax15, ay15 = -f15['ox'] * s, -f15['oy'] * s
W = max(out.shape[1], dirt.shape[1]) + 40
Hc = out.shape[0] + 30
canvas = np.zeros((Hc, W, 4), np.uint8)
# pés da figura: linha de baixo da figura; centro dos pés: meio das colunas opacas nas últimas 6 linhas
fy = out.shape[0] - 1
cols = np.where(out[-6:, :, 3].max(0) > 0)[0]
fx = (cols.min() + cols.max()) / 2.0
AX, AY = W / 2.0, Hc - 12
dx0 = int(round(AX - ax15)); dy0 = int(round(AY - ay15))
dd = canvas[dy0:dy0 + dirt.shape[0], dx0:dx0 + dirt.shape[1]]
m = dirt[..., 3] > 0
dd[m] = dirt[:dd.shape[0], :dd.shape[1]][m]
px0 = int(round(AX - fx)); py0 = int(round(AY - fy - 2))
reg = canvas[py0:py0 + out.shape[0], px0:px0 + out.shape[1]]
m2 = out[..., 3] > 0
reg[m2] = out[m2]
ys, xs = np.where(canvas[..., 3] > 0)
x0, y0, x1, y1 = xs.min(), ys.min(), xs.max() + 1, ys.max() + 1
frame = canvas[y0:y1, x0:x1]
# grava na folha (no fim) e atualiza o quadro
SH = Image.open(ROOT / f'godot/art/sprites/{name}.png').convert('RGBA')
nh = SH.size[1] + frame.shape[0] + 2
big = Image.new('RGBA', (max(SH.size[0], frame.shape[1]), nh))
big.paste(SH, (0, 0)); big.paste(Image.fromarray(frame), (0, SH.size[1] + 2))
big.save(ROOT / f'godot/art/sprites/{name}.png', optimize=True)
fr = dict(f)
fr.update({'x': 0, 'y': SH.size[1] + 2, 'w': int(frame.shape[1]), 'h': int(frame.shape[0]),
           'ox': -(AX - x0) / s, 'oy': -(AY - y0) / s})
data[name]['frames'][idx] = fr
json.dump(data, open(ROOT / 'godot/data/sprites.json', 'w', encoding='utf-8'), ensure_ascii=False)
Image.fromarray(frame).save(f'/tmp/claude-0/-home-claude/a21aaede-e844-5e51-91a8-553226649381/scratchpad/gemframe_{name}_{idx}.png')
print('ok', frame.shape, 'escala', round(k, 3))
