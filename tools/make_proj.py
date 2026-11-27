"""Projéteis em pixel art (folha gerada em grelha 6x4 sobre verde) → assets/sprites/fx_proj.png/.js.
Cada animação fica com 1 quadro, com o mesmo tamanho no mundo que tinha antes.
Uso: python3 tools/make_proj.py tools/art/gemini/proj_set1.webp [seta.webp]"""
import json, re, sys, pathlib
import numpy as np
from PIL import Image
import scipy.ndimage as ndi
ROOT = pathlib.Path(__file__).resolve().parents[1]
ORDER = ['crossbow', 'orb', 'spark', 'molten', 'ingot', 'clod', 'note', 'light', 'glassR', 'glassB', 'glassY', 'seed',
         'thorn', 'moth', 'feather', 'wave', 'fire', 'shockwave', 'dust', 'incense', 'spiritwave', 'scale', 'tongs', 'anvil']

def key(im):
    a = np.asarray(im.convert('RGB')).astype(int)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    m = np.maximum(r, b)
    keep = (g - m) < 50
    keep = ndi.binary_opening(keep, iterations=1)
    g2 = np.where(g > m + 10, m + 10, g)
    return np.dstack([r, g2, b, keep * 255]).astype(np.uint8)

def cells(arr, cols, rows):
    H, W = arr.shape[:2]; out = []
    for j in range(rows):
        for i in range(cols):
            c = arr[j * H // rows:(j + 1) * H // rows, i * W // cols:(i + 1) * W // cols]
            al = c[..., 3] > 0
            lab, n = ndi.label(al)
            if n == 0: out.append(None); continue
            sizes = ndi.sum(al, lab, range(1, n + 1)); big = sizes.max()
            keep = np.isin(lab, [k + 1 for k, s in enumerate(sizes) if s > big * 0.03])
            c = c.copy(); c[..., 3] = np.where(keep, 255, 0)
            ys, xs = np.where(keep)
            out.append(Image.fromarray(c[ys.min():ys.max() + 1, xs.min():xs.max() + 1]))
    return out

old_js = (ROOT / 'assets/sprites/fx_proj.js').read_text()
m = re.search(r'= (\{.*\});', old_js); old = json.loads(m.group(1))
def world_size(anim):
    f = old['frames'][old['anims'][anim]['frames'][0]]; s = f.get('s', old['scale'])
    return f['w'] / s, f['h'] / s

pieces = dict(zip(ORDER, cells(key(Image.open(sys.argv[1])), 6, 4)))
if len(sys.argv) > 2:
    pieces['bolt'] = cells(key(Image.open(sys.argv[2])), 1, 1)[0]
anims = list(old['anims'].keys()) + ['scale', 'tongs', 'anvil']
DENS = 4.0   # píxeis da folha por unidade do mundo (nítido)
x = 0; frames = []; A = {}; strip = []
for an in anims:
    src = an if an in pieces else None
    if src is None: continue
    img = pieces[src]
    # tamanho nominal (maior lado, em unidades do mundo) — o mesmo de PROJ em projectile.gd / enemy_render.js
    NOM = {'bolt': 17, 'orb': 10, 'spark': 13, 'molten': 11, 'ingot': 11, 'clod': 11, 'note': 10, 'light': 10, 'glassR': 9, 'glassB': 9, 'glassY': 9,
           'seed': 9, 'thorn': 11, 'moth': 9, 'feather': 13, 'wave': 22, 'fire': 16, 'shockwave': 18, 'dust': 15, 'incense': 14, 'spiritwave': 20,
           'scale': 9, 'tongs': 14, 'anvil': 30}
    ww = hh = NOM[an]
    k = min(ww / img.width, hh / img.height) * DENS
    w, h = max(2, round(img.width * k)), max(2, round(img.height * k))
    small = img.resize((w, h), Image.LANCZOS)
    a = np.asarray(small).copy(); a[..., 3] = np.where(a[..., 3] > 110, 255, 0); small = Image.fromarray(a)
    strip.append((x, small))
    frames.append({'x': x, 'y': 0, 'w': w, 'h': h, 'ox': round(-w / 2 / DENS, 3), 'oy': round(-h / 2 / DENS, 3), 's': DENS})
    A[an] = {'frames': [len(frames) - 1], 'fps': 1, 'loop': True}
    x += w + 2
H = max(s.height for _, s in strip)
sheet = Image.new('RGBA', (x, H), (0, 0, 0, 0))
for xx, s in strip: sheet.paste(s, (xx, 0))
sheet.save(ROOT / 'assets/sprites/fx_proj.png', optimize=True)
old['frames'] = frames; old['anims'] = A; old['scale'] = DENS
(ROOT / 'assets/sprites/fx_proj.js').write_text(old_js[:m.start(1)] + json.dumps(old, separators=(',', ':')) + old_js[m.end(1):])
print(sheet.size, list(A))
