"""Troca uma animação de uma folha de sprites (jogo web) por poses novas recortadas, mantendo as outras.
As poses ficam com a mesma altura do quadro parado e assentes no mesmo chão/centro; são acrescentadas por baixo
da folha. Uso: python3 tools/replace_anim.py <folha ex. en_husk> <anim ex. move> <fps> <pose.png> [...]
  --stride=<unidades>   distância de um ciclo inteiro (andar ligado ao passo)"""
import json, re, sys, pathlib
import numpy as np
from PIL import Image
ROOT = pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'tools'))
from build_boss_sheet import bbox, base_cx

args = [a for a in sys.argv[1:] if not a.startswith('--')]
opts = dict(a[2:].split('=') for a in sys.argv[1:] if a.startswith('--'))
name, anim, fps, poses = args[0], args[1], float(args[2]), args[3:]
jp = ROOT / 'assets' / 'sprites' / f'{name}.js'; pp = ROOT / 'assets' / 'sprites' / f'{name}.png'
src = jp.read_text(encoding='utf-8'); m = re.search(r'(VS\.SPRITE_META\[".*?"\] = )(\{.*\});', src)
meta = json.loads(m.group(2)); S = meta['scale']
sheet = Image.open(pp).convert('RGBA')
f0 = meta['frames'][meta['anims']['idle']['frames'][0]]; s0 = f0.get('s', S)
a0 = np.asarray(sheet.crop((f0['x'], f0['y'], f0['x'] + f0['w'], f0['y'] + f0['h'])))
x0, y0, x1, y1 = bbox(a0)
old_h = (y1 - y0) / s0; foot_y = f0['oy'] + y1 / s0; foot_x = f0['ox'] + base_cx(a0) / s0
ims = [np.asarray(Image.open(p).convert('RGBA')) for p in poses]
k = old_h * S / (bbox(ims[0])[3] - bbox(ims[0])[1])
cut = []
for a in ims:
    im = Image.fromarray(a); im = im.resize((max(1, round(im.width * k)), max(1, round(im.height * k))), Image.LANCZOS)
    b = np.asarray(im).copy(); b[..., 3] = np.where(b[..., 3] > 110, 255, 0)
    bx = bbox(b); cut.append(b[bx[1]:bx[3], bx[0]:bx[2]])
W = sheet.width; x = 0; y = sheet.height + 2; rowh = 0; place = []
for c in cut:
    if x + c.shape[1] > W: x = 0; y += rowh + 2; rowh = 0
    place.append((x, y)); x += c.shape[1] + 2; rowh = max(rowh, c.shape[0])
big = Image.new('RGBA', (max(W, max(p[0] + c.shape[1] for p, c in zip(place, cut))), y + rowh + 2), (0, 0, 0, 0))
big.paste(sheet, (0, 0))
old_pts = [meta['frames'][i].get('pts') for i in meta['anims'].get(anim, {}).get('frames', [])] or [None]
idx = []
for j, (c, (px, py)) in enumerate(zip(cut, place)):
    big.paste(Image.fromarray(c), (px, py))
    meta['frames'].append({'ox': round(foot_x - base_cx(c) / S, 3), 'oy': round(foot_y - c.shape[0] / S, 3), 'x': px, 'y': py,
                           'w': int(c.shape[1]), 'h': int(c.shape[0]), 'pts': old_pts[min(len(old_pts) - 1, j * len(old_pts) // len(cut))]})
    idx.append(len(meta['frames']) - 1)
A = dict(meta['anims'].get(anim, {'loop': True, 'phases': None}))
A['frames'] = idx; A['fps'] = fps
if 'stride' in opts: A['stride'] = float(opts['stride'])
meta['anims'][anim] = A
big.save(pp, optimize=True)
jp.write_text(src[:m.start(2)] + json.dumps(meta, ensure_ascii=False, separators=(',', ':')) + src[m.end(2):], encoding='utf-8')
print(name, anim, len(idx), 'quadros novos; folha', big.size)
