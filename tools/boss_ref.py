"""Imagens de referência para o Gemini: estilo (chefes já pintados) + desenho/poses do chefe a refazer, fundo magenta.
Uso: python3 tools/boss_ref.py design <chefe> <saida.png>
     python3 tools/boss_ref.py poses <chefe> <animação> <n_poses> <saida.png> [master.png]"""
import json, re, sys, pathlib
from PIL import Image
ROOT = pathlib.Path(__file__).resolve().parents[1]
MAG = (255, 0, 255, 255)

def sheet(n):
    s = (ROOT / f'assets/sprites/{n}.js').read_text(encoding='utf-8')
    return json.loads(re.search(r'= (\{.*\});', s).group(1)), Image.open(ROOT / f'assets/sprites/{n}.png').convert('RGBA')

def frame(n, i):
    d, sh = sheet(n); f = d['frames'][i]
    im = sh.crop((f['x'], f['y'], f['x'] + f['w'], f['y'] + f['h']))
    k = d['scale'] / f.get('s', d['scale'])
    return im.resize((round(im.width * k), round(im.height * k)), Image.NEAREST)

def row(ims, gap=40, H=None, pad=30):
    H = H or max(i.height for i in ims)
    ims = [i.resize((round(i.width * H / max(1, i.height)), H), Image.NEAREST) if i.height > H else i for i in ims]
    W = sum(i.width for i in ims) + gap * (len(ims) - 1) + pad * 2
    c = Image.new('RGBA', (W, H + pad * 2), MAG); x = pad
    for i in ims:
        c.alpha_composite(i, (x, pad + H - i.height)); x += i.width + gap
    return c

def up(c, target=900):
    s = max(1, round(target / c.height))
    return c.convert('RGB').resize((c.width * s, c.height * s), Image.NEAREST)

if __name__ == '__main__':
    mode = sys.argv[1]
    if mode == 'design':
        b, out = sys.argv[2], sys.argv[3]
        d, _ = sheet('en_b_' + b)
        style = [frame('en_b_hilde', sheet('en_b_hilde')[0]['anims']['idle']['frames'][0]),
                 frame('en_b_ozias', sheet('en_b_ozias')[0]['anims']['idle']['frames'][0])]
        me = frame('en_b_' + b, d['anims']['idle']['frames'][0])
        up(row(style + [me], gap=80)).save(out)
    else:
        b, an, n, out = sys.argv[2], sys.argv[3], int(sys.argv[4]), sys.argv[5]
        d, _ = sheet('en_b_' + b); fr = d['anims'][an]['frames']
        idx = [fr[round(j * (len(fr) - 1) / max(1, n - 1))] for j in range(n)]
        ims = [frame('en_b_' + b, i) for i in idx]
        c = row(ims)
        if len(sys.argv) > 6:
            m = Image.open(sys.argv[6]).convert('RGBA'); m.thumbnail((10000, c.height - 60))
            c2 = Image.new('RGBA', (c.width + m.width + 120, c.height), MAG); c2.alpha_composite(m, (30, 30)); c2.alpha_composite(c, (m.width + 120, 0)); c = c2
        up(c, 700).save(out)
    print(out)
