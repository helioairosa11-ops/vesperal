"""Retratos de quem fala (personagens e chefes) recortados da arte pixel art atual: a cabeça do primeiro quadro
parado, ampliada sem desfocar (vizinho mais próximo) sobre um fundo escuro com brilho quente, 270x270.
Uso: python3 tools/make_portraits.py <pasta_saida> [nome ...]
O enquadramento de cada um pode ser afinado em FRAME (centro e tamanho em fração da altura da figura)."""
import json, re, sys, pathlib
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
ROOT = pathlib.Path(__file__).resolve().parents[1]
OUT = pathlib.Path(sys.argv[1]); OUT.mkdir(parents=True, exist_ok=True)
SIZE = 270

NPCS = ['ione', 'hrolf', 'maren', 'teodoro']
BOSSES = ['coveiro', 'matilheira', 'caedmon', 'automato', 'hilde', 'mariposa', 'elowen', 'sineiro', 'corvin', 'vael',
          'ozias', 'gemeo_a', 'gemeo_b', 'aldric', 'seraphine', 'carpideira', 'custodio']
# afinação manual: (dx, dy, tamanho) em fração da altura da figura, a partir do centro da cabeça detetada
FRAME = {}
# cabeças marcadas à mão (centro x, centro y em píxeis do quadro, lado em fração da altura da figura)
HEAD_PX = {'maren': (50, 24, 0.27), 'coveiro': (114, 30, 0.34), 'matilheira': (214, 52, 0.44),
           'caedmon': (126, 36, 0.32), 'automato': (62, 60, 0.36), 'mariposa': (176, 70, 0.42),
           'seraphine': (98, 30, 0.27), 'aldric': (139, 32, 0.27)}
# chefes com arte nova pintada: o retrato sai da pose original em alta resolução (o quadro do jogo é pequeno e fica aos quadrados)
SRC_POSE = {'seraphine': ('tools/art/poses/seraphine/si_r0_0.png', (150, 70, 0.42)),
            'aldric': ('tools/art/poses/aldric/ai_r0_0.png', (190, 68, 0.40))}

def meta(name):
    s = (ROOT / 'assets' / 'sprites' / f'{name}.js').read_text(encoding='utf-8')
    return json.loads(re.search(r'= (\{.*\});', s).group(1))

def frame_img(name):
    m = meta(name)
    A = m['anims']; an = A.get('idle') or A[next(iter(A))]
    f = m['frames'][an['frames'][0]]
    sh = Image.open(ROOT / 'assets' / 'sprites' / f'{name}.png').convert('RGBA')
    return sh.crop((f['x'], f['y'], f['x'] + f['w'], f['y'] + f['h'])), f, m

def head_box(im, f, m, key):
    a = np.asarray(im)[..., 3] > 100
    rows = np.where(a.any(1))[0]; top, bot = rows.min(), rows.max()
    H = bot - top
    s = f.get('s', m['scale'])
    if key in HEAD_PX:
        cx, cy, sz = HEAD_PX[key]; side = max(24, H * sz)
        return int(cx - side / 2), int(cy - side / 2), int(side)
    eye = (f.get('pts') or {}).get('eye')
    if eye:
        ex, ey = (eye[0] - f['ox']) * s, (eye[1] - f['oy']) * s
    else:   # sem ponto do olho: o meio do topo da figura
        band = a[top:top + max(4, int(H * 0.15))]
        cols = np.where(band.any(0))[0]
        ex, ey = cols.mean(), top + H * 0.1
    dx, dy, sz = FRAME.get(key, (0.0, 0.03, 0.34))
    side = max(24, H * sz)
    cx, cy = ex + dx * H, ey + dy * H
    return int(cx - side / 2), int(cy - side / 2), int(side)

def make(name, key):
    if key in SRC_POSE:
        path, (cx, cy, sz) = SRC_POSE[key]
        im = Image.open(ROOT / path).convert('RGBA')
        side = int(im.height * sz); x, y = int(cx - side / 2), int(cy - side / 2)
    else:
        im, f, m = frame_img(name)
        x, y, side = head_box(im, f, m, key)
    # o chefe olha para a direita na folha; o retrato fica à esquerda da caixa a olhar para o texto (direita)
    crop = Image.new('RGBA', (side, side), (0, 0, 0, 0))
    crop.alpha_composite(im, (-x, -y))
    head = crop.resize((SIZE, SIZE), Image.NEAREST)
    bg = Image.new('RGBA', (SIZE, SIZE), (8, 6, 10, 255))
    glow = Image.new('L', (SIZE, SIZE), 0); ImageDraw.Draw(glow).ellipse((30, 20, 240, 230), fill=120)
    glow = glow.filter(ImageFilter.GaussianBlur(40))
    warm = Image.new('RGBA', (SIZE, SIZE), (110, 60, 50, 255)); bg = Image.composite(warm, bg, glow)
    bg.alpha_composite(head)
    # escurece por baixo, como os retratos antigos
    shade = Image.linear_gradient('L').resize((SIZE, SIZE)).point(lambda v: max(0, v - 150) * 2)
    bg = Image.composite(Image.new('RGBA', (SIZE, SIZE), (8, 6, 10, 255)), bg, shade)
    bg.convert('RGB').save(OUT / f'{key}.png')
    return OUT / f'{key}.png'

if __name__ == '__main__':
    want = sys.argv[2:]
    for n in NPCS:
        if not want or n in want: print(make(f'npc_{n}', n))
    for b in BOSSES:
        if not want or b in want: print(make(f'en_b_{b}', b))
