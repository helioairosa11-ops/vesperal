"""Tira o halo do chroma key (rosa/magenta/lilás) das orlas das folhas de sprites: só nos 2 píxeis junto ao
transparente, os tons magenta passam a cinzento escuro da mesma luminosidade (o contorno fica limpo) e os
quase transparentes saem. Uso: python3 tools/defringe.py [--all-purple] <png> [...]   (reescreve os ficheiros)"""
import sys
import numpy as np
from PIL import Image
import scipy.ndimage as ndi

def clean(path, all_purple=False):
    a = np.asarray(Image.open(path).convert('RGBA')).astype(float)
    r, g, b, al = a[..., 0], a[..., 1], a[..., 2], a[..., 3]
    solid = al > 0
    edge = solid & ndi.binary_dilation(~solid, iterations=2)
    mag = edge & ((r - g) > 35) & ((b - g) > 25) & (np.abs(r - b) < 100)
    if all_purple:   # folhas sem roxo nenhum na arte (ex.: Mãe-Mariposa): qualquer lilás/magenta é resto do fundo
        mag = solid & ((b - g) > 12) & ((r - g) > 8)
    n = int(mag.sum())
    lum = 0.3 * r + 0.59 * g + 0.11 * b
    for c in (0, 1, 2):
        a[..., c][mag] = lum[mag] * 0.85
    # pixels magenta muito ténues na orla: fora
    a[..., 3][mag & (al < 140)] = 0
    Image.fromarray(np.clip(a, 0, 255).astype(np.uint8)).save(path, optimize=True)
    return n

if __name__ == '__main__':
    allp = '--all-purple' in sys.argv
    for p in [a for a in sys.argv[1:] if not a.startswith('--')]:
        n = clean(p, allp)
        if n: print(p, n, 'píxeis limpos')
