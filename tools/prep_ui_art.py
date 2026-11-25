"""Prepara a arte da interface para o Godot a partir das imagens de referência (tools/art/ui_src) e de assets/ui:
recorta, tira o fundo (xadrez / fundo desfocado) e grava PNG com transparência em godot/art/ui."""
import pathlib
from collections import deque
from PIL import Image, ImageFilter
import numpy as np
ROOT = pathlib.Path(__file__).resolve().parents[1]
SRC = ROOT / 'tools' / 'art' / 'ui_src'; WEB = ROOT / 'assets' / 'ui'; OUT = ROOT / 'godot' / 'art' / 'ui'
OUT.mkdir(parents=True, exist_ok=True)

def flood_alpha(im, seeds, step_tol, ok=None):
    """Enche a partir das sementes enquanto a cor muda pouco de um píxel para o seguinte (fundo liso/desfocado)."""
    a = np.asarray(im.convert('RGB')).astype(np.int32); h, w, _ = a.shape
    bg = np.zeros((h, w), bool); q = deque()
    for s in seeds:
        if not bg[s[1], s[0]]: bg[s[1], s[0]] = True; q.append(s)
    while q:
        x, y = q.popleft()
        for nx, ny in ((x+1, y), (x-1, y), (x, y+1), (x, y-1)):
            if 0 <= nx < w and 0 <= ny < h and not bg[ny, nx]:
                if np.abs(a[ny, nx] - a[y, x]).sum() <= step_tol and (ok is None or ok(a[ny, nx])):
                    bg[ny, nx] = True; q.append((nx, ny))
    return bg

def with_alpha(im, bg, feather=1):
    al = Image.fromarray(np.where(bg, 0, 255).astype(np.uint8))
    if feather:
        al = al.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(feather * 0.6))
    o = im.convert('RGBA'); o.putalpha(al); return o

def edge_seeds(w, h, top=True, bottom=True, sides=True):
    s = []
    if top: s += [(x, 0) for x in range(w)]
    if bottom: s += [(x, h - 1) for x in range(w)]
    if sides: s += [(0, y) for y in range(h)] + [(w - 1, y) for y in range(h)]
    return s

# ---- moldura das velas (painel principal dos menus)
ref = Image.open(SRC / 'candle_frame_ref.jpg').convert('RGB')
fr = ref.crop((838, 30, 1731, 1304))
w, h = fr.size
# só a faixa de cima (velas, crista) tem fundo à volta; o resto da moldura é um retângulo cheio
arr = np.asarray(fr).astype(np.int32)
bg = flood_alpha(fr.crop((0, 0, w, 105)), edge_seeds(w, 105, bottom=False, sides=True), 7)
full = np.zeros((h, w), bool); full[:105] = bg
# lados: fora dos pilares (há uma margem de fundo de 1–3 px)
sb = flood_alpha(fr, [(0, y) for y in range(105, h)] + [(w - 1, y) for y in range(105, h)] + [(x, h - 1) for x in range(w)], 7)
full |= sb
# tira as cinzas soltas à volta (fica só a peça maior)
import scipy.ndimage as ndi
lab, n = ndi.label(~full); sizes = ndi.sum(~full, lab, range(1, n + 1))
full = lab != (1 + int(np.argmax(sizes)))
# esvazia o interior (a referência traz botões desenhados): cada linha leva a cor do fundo junto ao pilar direito
fa = np.asarray(fr).astype(np.float32).copy()
rng = np.random.default_rng(7)
for (x0, x1, y0, y1) in [(84, 800, 296, 1064), (140, 752, 1130, 1224)]:
    for y in range(y0, y1):
        col = np.median(fa[min(y, 1130), 803:815], axis=0)
        fa[y, x0:x1] = col + rng.normal(0, 1.2, (x1 - x0, 1))
    # costura suave nas bordas do remendo
fr = Image.fromarray(np.clip(fa, 0, 255).astype(np.uint8))
with_alpha(fr, full).save(OUT / 'frame.png')
print('frame', fr.size)

# ---- botões, casas, anel (cortados do painel: tirar o fundo dos cantos)
for n in ['btn', 'btn_focus']:
    Image.open(WEB / f'{n}.png').convert('RGBA').save(OUT / f'{n}.png')
for n, tol in [('slot', 10), ('slot_focus', 10), ('ring', 9)]:
    im = Image.open(WEB / f'{n}.png').convert('RGB'); ww, hh = im.size
    with_alpha(im, flood_alpha(im, edge_seeds(ww, hh), tol)).save(OUT / f'{n}.png')
Image.open(WEB / 'oval.png').save(OUT / 'oval.png')
Image.open(WEB / 'panel_inv.jpg').save(OUT / 'panel_inv.png')

# ---- arcos dos separadores do inventário (ativo e apagado)
inv = Image.open(SRC / 'inventory_ref.jpg').convert('RGB')
for n, box in [('tab_on', (222, 92, 410, 296)), ('tab_off', (450, 92, 632, 296))]:
    im = inv.crop(box); ww, hh = im.size
    with_alpha(im, flood_alpha(im, edge_seeds(ww, hh, bottom=False), 9)).save(OUT / f'{n}.png')

# ---- ícones de indicação do kit (fundo em xadrez)
kit = Image.open(SRC / 'ui_kit.jpg').convert('RGB')
def checker(c):
    return abs(int(c[0]) - int(c[1])) < 10 and abs(int(c[1]) - int(c[2])) < 10 and 55 <= c[0] <= 118
for n, box in [('ic_talk', (1862, 1062, 2016, 1196)), ('ic_interact', (2080, 1058, 2246, 1196)), ('ic_examine', (2310, 1076, 2486, 1180))]:
    im = kit.crop(box); ww, hh = im.size
    with_alpha(im, flood_alpha(im, edge_seeds(ww, hh), 60, ok=checker)).save(OUT / f'{n}.png')
print('ok')

# ---- caixa larga (diálogo, avisos, leitura): a mesma moldura, com a trave de baixo espelhada em cima
frm = Image.open(OUT / 'frame.png')
fw, fh = frm.size
bot = frm.crop((0, 1060, fw, fh))
top = bot.transpose(Image.FLIP_TOP_BOTTOM)
mid = frm.crop((0, 640, fw, 740))
box = Image.new('RGBA', (fw, bot.size[1] * 2 + mid.size[1]))
box.paste(top, (0, 0)); box.paste(mid, (0, top.size[1])); box.paste(bot, (0, top.size[1] + mid.size[1]))
# interior liso: fica só o dourado dos cantos e o seu contorno; cinzas e degradês tirados
ba = np.asarray(box).astype(np.int32).copy()
H = ba.shape[0]
fill = np.median(np.asarray(frm).astype(np.int32)[1128:1134, 300:600], axis=(0, 1))
reg = ba[48:H - 48, 74:fw - 74]
r_, g_, b_ = reg[..., 0], reg[..., 1], reg[..., 2]
keep = ((r_ - b_ > 28) & (r_ > 80)) | ((r_ + g_ + b_) < 60)
keep = ndi.binary_dilation(keep, iterations=1)
yy = np.linspace(-1, 1, reg.shape[0])[:, None]
shade = (fill[None, None, :3] * (1.0 - 0.10 * yy[..., None] ** 2)).astype(np.int32)
reg[..., :3] = np.where(keep[..., None], reg[..., :3], shade + rng.integers(-1, 2, reg.shape[:2])[..., None])
ba[48:H - 48, 74:fw - 74] = reg
box = Image.fromarray(ba.astype(np.uint8), 'RGBA')
box.save(OUT / 'box.png'); print('box', box.size)

# ---- moldura oval só com o aro (o interior fica transparente para pôr o retrato por baixo)
ov = Image.open(WEB / 'oval.png').convert('RGBA'); ow, oh = ov.size
inner = flood_alpha(ov.convert('RGB'), [(ow // 2, oh // 2)], 9)
oa = np.asarray(ov).copy()
oa[..., 3] = np.where(ndi.binary_dilation(inner, iterations=1), 0, oa[..., 3])
lab2, n2 = ndi.label(oa[..., 3] > 20)
if n2 > 1:
    big = 1 + int(np.argmax(ndi.sum(oa[..., 3] > 20, lab2, range(1, n2 + 1))))
    oa[..., 3] = np.where((lab2 == big) | (lab2 == 0), oa[..., 3], 0)
Image.fromarray(oa).save(OUT / 'oval_ring.png')
print('oval inner bbox', np.argwhere(inner).min(0), np.argwhere(inner).max(0))
