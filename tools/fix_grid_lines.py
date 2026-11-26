"""Fecha as frestas finas (até 10 píxeis) que a remoção da grelha do gerador abre a atravessar a figura:
um píxel transparente com figura dos dois lados (na horizontal ou na vertical, a até 4 píxeis) leva a cor do
vizinho. Uso: python3 tools/fix_grid_lines.py <png> [...]"""
import sys
import numpy as np
from PIL import Image

def fix(p, gap=10):
    a = np.asarray(Image.open(p).convert('RGBA')).copy()
    n = 0
    for axis in (1, 0):
        img = a if axis == 1 else a.transpose(1, 0, 2)
        al = img[..., 3] > 0
        H, W = al.shape
        for y in range(H):
            row = al[y]; xs = np.where(row)[0]
            if len(xs) < 2: continue
            x = xs[0]
            while x < xs[-1]:
                if not row[x]:
                    e = x
                    while e < W and not row[e]: e += 1
                    if e - x <= gap and e < W and row[x - 1]:
                        for k in range(x, e):
                            img[y, k] = img[y, x - 1] if (k - x) < (e - x) / 2 else img[y, e]
                            n += 1
                    x = e
                else:
                    x += 1
        al = a[..., 3] > 0
    Image.fromarray(a).save(p)
    return n

if __name__ == '__main__':
    for p in sys.argv[1:]:
        print(p.split('/')[-1], fix(p))
