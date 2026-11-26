"""Tapa os furinhos transparentes deixados pelo recorte dentro das figuras (pontos e pequenas manchas fechadas,
e entalhes de 1 px na orla), com a cor do pixel opaco mais próximo. Furos maiores (espaço entre braço e corpo)
ficam como estão.
Uso: python3 tools/fill_pinholes.py [--godot] [nomes...]   (sem nomes: todas as folhas en_*)"""
import json, re, sys, glob, pathlib
import numpy as np
from PIL import Image
import scipy.ndimage as ndi
ROOT = pathlib.Path(__file__).resolve().parents[1]
MAX_HOLE = 14
K8 = np.ones((3, 3), int)

def fix_frame(px):
    a = px[..., 3] > 100
    filled = ndi.binary_fill_holes(a)
    h = filled & ~a
    lab, k = ndi.label(h)
    if k:
        sz = ndi.sum(h, lab, range(1, k + 1))
        h = np.isin(lab, [i + 1 for i, s in enumerate(sz) if s <= MAX_HOLE])
    # entalhes: transparente com 6+ dos 8 vizinhos opacos (duas passagens)
    for _ in range(2):
        aa = a | h
        nb = ndi.convolve(aa.astype(int), K8, mode='constant') - aa
        h |= ~aa & (nb >= 6)
    # pontinhos escuros soltos fora da figura (restos do recorte): até 4 px
    lab2, k2 = ndi.label(a, structure=K8)
    loose = np.zeros_like(a)
    if k2 > 1:
        sz2 = ndi.sum(a, lab2, range(1, k2 + 1))
        lum = px[..., :3].astype(int).sum(-1) / 3
        ml = ndi.mean(lum, lab2, range(1, k2 + 1))
        loose = np.isin(lab2, [i + 1 for i in range(k2) if sz2[i] <= 4 and ml[i] < 90])
    if not h.any() and not loose.any():
        return px, 0
    src = a
    idx = ndi.distance_transform_edt(~src, return_distances=False, return_indices=True)
    out = px.copy()
    out[h, :3] = px[idx[0][h], idx[1][h], :3]
    out[h, 3] = 255
    out[loose] = 0
    return out, int(h.sum() + loose.sum())

def process(png, frames):
    sh = np.asarray(Image.open(png).convert('RGBA')).copy()
    tot = 0
    for f in frames:
        if not f or f.get('w') is None:
            continue
        y, x, hh, ww = f['y'], f['x'], f['h'], f['w']
        o, n = fix_frame(sh[y:y + hh, x:x + ww])
        sh[y:y + hh, x:x + ww] = o
        tot += n
    Image.fromarray(sh).save(png, optimize=True)
    return tot

def main(argv):
    godot = '--godot' in argv
    names = [a for a in argv if not a.startswith('--')]
    if godot:
        data = json.load(open(ROOT / 'godot/data/sprites.json', encoding='utf-8'))
        for n in names or [k for k in data if k.startswith('en_') and (ROOT / f'godot/art/sprites/{k}.png').exists()]:
            print(n, process(ROOT / f'godot/art/sprites/{n}.png', data[n]['frames']))
        return
    for js in sorted(glob.glob(str(ROOT / 'assets/sprites/en_*.js'))):
        n = pathlib.Path(js).stem
        if names and n not in names:
            continue
        s = open(js, encoding='utf-8').read()
        m = re.search(r'(VS\.SPRITE_META\[".*?"\] = )(\{.*\});', s)
        d = json.loads(m.group(2))
        print(n, process(ROOT / f'assets/sprites/{n}.png', d['frames']))

if __name__ == '__main__':
    main(sys.argv[1:])
