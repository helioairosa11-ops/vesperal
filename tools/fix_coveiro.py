"""Corrige as folhas do Coveiro (fase 1 e 2) para o Godot: tira pedaços colados de outros quadros, completa o que
ficou cortado pela moldura do quadro (pá levantada, lâmina da pá), desfaz cortes a direito no fumo, nas chamas e
nos montes de terra, e volta a arrumar a folha com margem à volta de cada quadro para o desenho poder passar o recorte.

Entrada: tools/art/orig/godot_stage/<folha>.png + coveiro_meta.json (a folha já limpa e os quadros originais)
Saída:   godot/art/sprites/<folha>.png e os quadros novos em godot/data/sprites.json
Correr depois de tools/export_godot_data.py (que reescreve sprites.json)."""
import json, pathlib
import numpy as np
from PIL import Image, ImageFilter
import scipy.ndimage as ndi

ROOT = pathlib.Path(__file__).resolve().parents[1]
STAGE = ROOT / 'tools' / 'art' / 'orig' / 'godot_stage'
SPR = ROOT / 'godot' / 'art' / 'sprites'
DATA = ROOT / 'godot' / 'data' / 'sprites.json'
P = 64                                    # margem nova à volta de cada quadro (px da folha)
rng = np.random.default_rng(11)

def noise1d(n, scale=6.0, seed=0):
    r = np.random.default_rng(seed).random(int(n / scale) + 3)
    x = np.arange(n) / scale
    i = x.astype(int); f = x - i
    f = f * f * (3 - 2 * f)
    return r[i] * (1 - f) + r[i + 1] * f

def comp(a):
    lab, n = ndi.label(a[..., 3] > 8, structure=np.ones((3, 3)))
    sizes = ndi.sum(a[..., 3] > 8, lab, range(1, n + 1)) if n else []
    return lab, n, sizes

# ------------------------------------------------------------------ operações (coordenadas do quadro já com margem)
def drop_border_bits(a, box, max_size=450):
    """pedacinhos soltos cortados pela borda antiga do quadro (vêm dos quadros vizinhos da folha de origem)"""
    x0, y0, x1, y1 = box
    lab, n, sizes = comp(a)
    if n == 0: return
    main = 1 + int(np.argmax(sizes))
    for k in range(1, n + 1):
        if k == main or sizes[k - 1] > max_size: continue
        ys, xs = np.where(lab == k)
        if xs.min() <= x0 or ys.min() <= y0 or xs.max() >= x1 - 1 or ys.max() >= y1 - 1:
            a[lab == k] = 0

def erase(a, rect):
    x0, y0, x1, y1 = rect
    a[y0:y1, x0:x1] = 0

def keep_main_near(a, rect):
    """dentro do retângulo apaga tudo o que não estiver ligado à figura principal fora dele"""
    x0, y0, x1, y1 = rect
    outside = a.copy(); outside[y0:y1, x0:x1] = 0
    lab, n, sizes = comp(outside)
    if n == 0: return
    main = 1 + int(np.argmax(sizes))
    full, _, _ = comp(a)
    keep_ids = set(np.unique(full[(lab == main)])) - {0}
    region = full[y0:y1, x0:x1]
    m = ~np.isin(region, list(keep_ids))
    a[y0:y1, x0:x1][m] = 0

def ragged(a, side, box, depth=10, rows=None, seed=0, soft=True):
    """desfaz um corte a direito na borda antiga 'side' (L, R, T, B): rói a orla com um contorno irregular e suave"""
    x0, y0, x1, y1 = box
    h, w = a.shape[:2]
    yy, xx = np.mgrid[0:h, 0:w]
    if side == 'L': d = xx - x0; along = yy
    elif side == 'R': d = (x1 - 1) - xx; along = yy
    elif side == 'T': d = yy - y0; along = xx
    else: d = (y1 - 1) - yy; along = xx
    L = h if side in 'LR' else w
    nz = noise1d(L, 5.0, seed) * 0.65 + noise1d(L, 1.7, seed + 7) * 0.35
    thr = depth * (0.25 + 0.75 * nz[along])
    k = np.clip((d - thr) / (2.5 if soft else 0.8), 0, 1)
    if rows is not None:
        lo, hi = rows
        inside = (along >= lo) & (along < hi)
        k = np.where(inside, k, 1.0)
    a[..., 3] = (a[..., 3] * k).astype(np.uint8)

def fade_side(a, side, box, depth=16, seed=0, span=None):
    """fumo/chamas cortados: desvanecem em vez de acabar a direito (span: só neste intervalo ao longo da borda)"""
    keep = a.copy()
    ragged(a, side, box, depth=depth, seed=seed, soft=True)
    x0, y0, x1, y1 = box
    h, w = a.shape[:2]
    yy, xx = np.mgrid[0:h, 0:w]
    d = {'L': xx - x0, 'R': (x1 - 1) - xx, 'T': yy - y0, 'B': (y1 - 1) - yy}[side]
    k = np.clip(d / (depth * 1.6), 0, 1) ** 0.8
    a[..., 3] = (a[..., 3] * np.where(d < depth * 1.6, k, 1)).astype(np.uint8)
    if span is not None:
        along = xx if side in 'TB' else yy
        out = (along < span[0]) | (along >= span[1])
        a[out] = keep[out]

def paste(a, src, rect, at, flip_v=False, flip_h=False, under=True):
    """copia um pedaço (de outro quadro) para aqui; por baixo do que já existe, para não tapar a figura"""
    x0, y0, x1, y1 = rect
    piece = src[y0:y1, x0:x1].copy()
    if flip_v: piece = piece[::-1]
    if flip_h: piece = piece[:, ::-1]
    px, py = at
    ph, pw = piece.shape[:2]
    dst = a[py:py + ph, px:px + pw]
    pa = piece[..., 3:4].astype(np.float32) / 255
    da = dst[..., 3:4].astype(np.float32) / 255
    if under:
        out_a = da + pa * (1 - da)
        out_c = (dst[..., :3] * da + piece[..., :3] * pa * (1 - da)) / np.maximum(out_a, 1e-6)
    else:
        out_a = pa + da * (1 - pa)
        out_c = (piece[..., :3] * pa + dst[..., :3] * da * (1 - pa)) / np.maximum(out_a, 1e-6)
    dst[..., :3] = np.clip(out_c, 0, 255).astype(np.uint8)
    dst[..., 3:4] = np.clip(out_a * 255, 0, 255).astype(np.uint8)

def transplant(a, src, rect, shift):
    """troca uma zona pelos píxeis de outro quadro (alinhado pelo corpo): tapa o que um pedaço colado escondia"""
    x0, y0, x1, y1 = rect
    sx, sy = shift
    a[y0:y1, x0:x1] = src[y0 - sy:y1 - sy, x0 - sx:x1 - sx]

META = {}
def anchor_shift(a, frames, src_i, dst_i, rect):
    """copia uma zona de outro quadro para este, os dois alinhados pela âncora (o ponto dos pés no chão)"""
    fs, fd = META['frames'][src_i], META['frames'][dst_i]
    s = META['scale']
    # posição da âncora em px de cada quadro com margem
    ax_s, ay_s = P - fs['ox'] * s, P - fs['oy'] * s
    ax_d, ay_d = P - fd['ox'] * s, P - fd['oy'] * s
    dx, dy = int(round(ax_s - ax_d)), int(round(ay_s - ay_d))
    src = frames[src_i][0]
    x0, y0, x1, y1 = rect
    x1 = min(x1, a.shape[1], src.shape[1] - dx); y1 = min(y1, a.shape[0], src.shape[0] - dy)
    part = src[y0 + dy:y1 + dy, x0 + dx:x1 + dx]
    dst = a[y0:y1, x0:x1]
    m = dst[..., 3] < 10
    dst[m] = part[m]

def band_from(a, frames, src_i, dst_i, x_from, y_top, ref_x):
    """continua a terra com a do quadro src_i: alinhado na horizontal pela âncora e na vertical pelo fundo do
    monte numa coluna de referência, para não ficar degrau; só entra onde aqui está vazio"""
    fs, fd = META['frames'][src_i], META['frames'][dst_i]
    s = META['scale']
    src = frames[src_i][0]
    dx = int(round((P - fs['ox'] * s) - (P - fd['ox'] * s)))
    def bottom(img, x):
        ys = np.where(img[:, x, 3] > 100)[0]
        return ys.max() if len(ys) else None
    bd = bottom(a, ref_x); bs = bottom(src, ref_x + dx)
    dy = (bs - bd) if (bd is not None and bs is not None) else 0
    for x in range(x_from, a.shape[1]):
        sx = x + dx
        if not (0 <= sx < src.shape[1]):
            continue
        for y in range(y_top, a.shape[0]):
            sy = y + dy
            if 0 <= sy < src.shape[0] and a[y, x, 3] < 10 and src[sy, sx, 3] > 0:
                a[y, x] = src[sy, sx]

def remove_smear(a, rect, lum_min=105):
    """tira um rasto claro (cinza sem cor) dentro do retângulo: onde estava por cima do corpo, o buraco é tapado
    com a cor dos vizinhos escuros; onde estava por cima do fundo, fica transparente"""
    x0, y0, x1, y1 = rect
    reg = a[y0:y1, x0:x1]
    rgb = reg[..., :3].astype(int)
    light = (rgb.mean(-1) > lum_min) & (np.abs(rgb[..., 0] - rgb[..., 2]) < 14) & (reg[..., 3] > 30)
    light = ndi.binary_dilation(light, iterations=1) & (reg[..., 3] > 0)
    solid = (reg[..., 3] > 200) & ~light
    todo = light.copy()
    for _ in range(12):
        if not todo.any():
            break
        cnt = ndi.convolve(solid.astype(int), np.ones((3, 3), int), mode='constant')
        acc = np.stack([ndi.convolve(np.where(solid, rgb[..., c], 0), np.ones((3, 3), int), mode='constant') for c in range(3)], -1)
        fill = todo & (cnt >= 4)
        if not fill.any():
            break
        rgb[fill] = (acc[fill] / cnt[fill][:, None]).astype(int)
        reg[..., :3][fill] = rgb[fill].astype(np.uint8)
        reg[..., 3][fill] = 255
        solid = solid | fill
        todo = todo & ~fill
    reg[..., 3][todo] = 0

def extend_up(a, y_edge, x0, x1, slope, rows, shrink_l=0.0, shrink_r=0.0, src_rows=3):
    """continua para cima, para fora do recorte antigo, uma peça cortada no topo (braço, cabo): repete a linha de
    cima deslocada na direção da peça (slope = px para a direita por linha), estreitando se for preciso"""
    band = a[y_edge:y_edge + src_rows, x0:x1 + 1].copy()
    for k in range(1, rows + 1):
        row = band[(k - 1) % src_rows].copy()
        dx = int(round(slope * k))
        l = int(round(shrink_l * k)); r = int(round(shrink_r * k))
        if l + r >= row.shape[0] - 2:
            break
        if l: row[:l] = 0
        if r: row[row.shape[0] - r:] = 0
        y = y_edge - k
        xs = x0 + dx
        dst = a[y, xs:xs + row.shape[0]]
        m = (row[:, 3] > 0) & (dst[:, 3] < 200)
        dst[m] = row[m]
    # contorno escuro nas bordas novas
    reg = a[max(0, y_edge - rows - 2):y_edge + 1]
    mask = reg[..., 3] > 100
    edge = mask & ~ndi.binary_erosion(mask)
    reg[edge, :3] = (reg[edge, :3] * 0.45).astype(np.uint8)

def paste_piece(a, src, rect, at):
    """cola por cima um pedaço (só a parte opaca)"""
    x0, y0, x1, y1 = rect
    piece = src[y0:y1, x0:x1]
    px, py = at
    dst = a[py:py + piece.shape[0], px:px + piece.shape[1]]
    m = piece[..., 3] > 60
    dst[m] = piece[m]

RNG_SP = np.random.default_rng(5)
def draw_spade(a, cx, base_y, w, h, pal, hot=False):
    """desenha à mão (píxel a píxel) a lâmina de uma pá com o bico para cima: contorno escuro, metal com
    degradê, aresta central clara e alvado (encaixe do cabo) em baixo"""
    out, dark, mid, light, ridge = pal
    tip = int(h * 0.42)
    rows = []
    for r in range(h):
        if r < tip:
            half = 1.0 + (w / 2.0 - 1.0) * (r / tip) ** 0.85
        elif r > h - 4:
            half = w / 2.0 - (r - (h - 4)) * 1.2
        else:
            half = w / 2.0
        rows.append(half)
    top = base_y - h - 3
    for r, half in enumerate(rows):
        y = top + r
        x0 = int(round(cx - half)); x1 = int(round(cx + half))
        for x in range(x0, x1 + 1):
            t = (x - x0) / max(1, x1 - x0)
            c = np.array(dark) * (1 - t) + np.array(light) * t if t < 0.5 else np.array(light) * (1.5 - t) + np.array(mid) * (t - 0.5)
            if hot:
                g = 1.0 - r / h
                c = c * (0.75 + 0.35 * g)
            c = c + RNG_SP.integers(-7, 8)
            if hot:
                q = RNG_SP.random()
                if q < 0.10: c = np.array([255, 236, 150])        # brasas vivas
                elif q < 0.20: c = c * 0.62                        # crosta escura
            if not hot and RNG_SP.random() < 0.06:
                c = c * 0.72           # pintas de ferrugem e terra
            a[y, x, :3] = np.clip(c, 0, 255).astype(np.uint8); a[y, x, 3] = 255
        a[y, x0, :3] = out; a[y, x1, :3] = out
        if x0 - 1 >= 0:
            a[y, x0 - 1, :3] = out; a[y, x0 - 1, 3] = 140
        if r > 2 and r < h - 2:
            a[y, int(round(cx)), :3] = ridge
    for x in range(int(round(cx - rows[0])), int(round(cx + rows[0])) + 1):
        a[top, x, :3] = out
    # fundo da lâmina e alvado
    yb = top + h
    for x in range(int(cx - w / 2.0 + 2), int(cx + w / 2.0 - 1)):
        a[yb - 1, x, :3] = out; a[yb - 1, x, 3] = 255
    for y in range(yb, base_y + 2):
        for x in range(int(cx) - 2, int(cx) + 3):
            a[y, x, :3] = out if x in (int(cx) - 2, int(cx) + 2) else mid; a[y, x, 3] = 255

def mirror_band_end(a, x0, y0, x1, y1, xs_from, min_y=0):
    """refaz o fim de um monte de terra espelhando o início do mesmo monte (mesma textura e mesma altura,
    sem degrau): o píxel (x, y) recebe o de (xs_from - (x - x0), y) se for terra (castanho)"""
    src = a.copy()
    for x in range(x0, x1):
        xs = xs_from - (x - x0)
        if xs < 0:
            continue
        for y in range(max(y0, min_y), y1):
            p = src[y, xs]
            if p[3] > 20 and int(p[0]) - int(p[2]) > 6 and a[y, x, 3] < 10:
                a[y, x] = p

def mirror_complete(a, rect, axis_x):
    """completa a metade cortada de uma peça simétrica (lâmina da pá) espelhando a outra metade"""
    x0, y0, x1, y1 = rect
    for y in range(y0, y1):
        for x in range(x0, x1):
            mx = int(round(2 * axis_x - x))
            if 0 <= mx < a.shape[1] and a[y, x, 3] < 40 and a[y, mx, 3] > 40:
                a[y, x] = a[y, mx]

def drop_specks(a, max_size=3):
    lab, n, sizes = comp(a)
    for k in range(1, n + 1):
        if sizes[k - 1] <= max_size:
            a[lab == k] = 0

# ------------------------------------------------------------------ correções por quadro
# caixa antiga do quadro dentro do quadro com margem: (P, P, P+w, P+h)
def fixes(name, i, a, box, frames):
    x0, y0, x1, y1 = box
    w, h = x1 - x0, y1 - y0
    X = lambda v: x0 + v
    Y = lambda v: y0 + v
    if name == 'en_b_coveiro':
        if i == 8:
            # a mão e o cabo do quadro seguinte colados no canto de baixo à direita: tira-se esse canto e a terra
            # volta a ser a do quadro 9 (mesmo passo), alinhada pela âncora dos pés
            erase(a, (X(142), Y(96), X(w), Y(h)))
            erase(a, (X(130), Y(147), X(w), Y(h)))
            band_from(a, frames, 7, i, X(142), Y(110), X(128))
            ragged(a, 'R', (x0, y0, X(198), y1), depth=7, rows=(Y(112), Y(h)), seed=8)
        if i == 16:
            # a pá levantada saía pelo topo: tira os restos cortados (lâmina e rasto) e põe a lâmina inteira
            # (a do quadro 0, virada para cima) no cimo do cabo
            erase(a, (X(98), Y(0), X(147), Y(10)))
            erase(a, (X(140), Y(0), X(168), Y(5)))
            remove_smear(a, (X(82), Y(0), X(101), Y(27)))
            remove_smear(a, (X(124), Y(46), X(147), Y(70)))
            # lâmina desenhada no cimo do cabo + a outra mão a agarrar o cabo (a do quadro 15, por trás da cabeça)
            erase(a, (X(140), Y(-40), X(170), Y(2)))
            # tufo cinzento à esquerda da cabeça e rasto claro à direita da cara (de um quadro vizinho): fora
            erase(a, (X(84), Y(0), X(104), Y(25)))
            erase(a, (X(104), Y(0), X(110), Y(13)))
            reg = a[Y(42):Y(74), X(132):X(149)]
            c3 = reg[..., :3].astype(int)
            reg[(reg[..., 3] > 0) & (c3.mean(-1) > 62)] = 0
            draw_spade(a, X(151), Y(4), 30, 34, ((20, 14, 18), (52, 48, 48), (74, 70, 68), (104, 98, 94), (132, 126, 120)))
        if i == 19:
            # golpe de cima: o braço levantado e o cabo saíam pelo topo; continuam para cima e fecham numa mão
            src19 = frames[19][0]
            extend_up(a, Y(0), X(116), X(124), -1.0, 16)               # cabo
            extend_up(a, Y(0), X(71), X(98), 1.8, 10, shrink_l=1.4, shrink_r=0.3)   # braço (manga até ao pulso)
            paste_piece(a, src19, (X(157), Y(30), X(176), Y(50)), (X(97), Y(-17)))  # punho (a outra mão do mesmo quadro)
            # ponta do cabo por cima do punho
            fade_side(a, 'T', box, depth=14, seed=19, span=(X(195), X(w)))
            fade_side(a, 'R', box, depth=12, seed=91, span=(Y(0), Y(90)))
        if i in (51, 52):
            fade_side(a, 'T', box, depth=8, seed=i)
    else:
        if i == 8:
            erase(a, (X(142), Y(100), X(w), Y(h)))
            erase(a, (X(130), Y(149), X(w), Y(h)))
            band_from(a, frames, 7, i, X(142), Y(110), X(128))
            ragged(a, 'R', (x0, y0, X(198), y1), depth=7, rows=(Y(112), Y(h)), seed=28)
        if i == 11:
            # pá em brasa de outro quadro colada por cima das pernas: do cinto para baixo (pernas, pá, terra) passa a ser
            # o quadro 12, alinhado pela âncora; do cinto para cima fica o 11 — o corte fica escondido no cinto
            fs, fd = META['frames'][12], META['frames'][11]
            sc = META['scale']
            dx = int(round((P - fs['ox'] * sc) - (P - fd['ox'] * sc))); dy = int(round((P - fs['oy'] * sc) - (P - fd['oy'] * sc)))
            src = frames[12][0]
            cut = Y(86)
            a[cut:] = 0
            for yy in range(cut, a.shape[0]):
                sy = yy + dy
                if 0 <= sy < src.shape[0]:
                    for_x0 = max(0, -dx); for_x1 = min(a.shape[1], src.shape[1] - dx)
                    a[yy, for_x0:for_x1] = src[sy, for_x0 + dx:for_x1 + dx]
            # o quadro 12 traz uma mancha arroxeada por baixo dos pés: fora
            low = a[Y(h - 14):, :]
            c3 = low[..., :3].astype(int)
            lil = (c3[..., 0] - c3[..., 1] > 14) & (c3[..., 2] - c3[..., 1] > 8)
            low[ndi.binary_dilation(lil, iterations=1) & (low[..., 3] < 250)] = 0
            low[lil] = 0
        # a pá/tocha erguida, o fumo e as chamas saíam pelo topo: desvanecem (só nas colunas deles, a cabeça fica)
        if i == 16:
            # pá em brasa levantada: lâmina desenhada no cimo do cabo, em brasa
            erase(a, (X(140), Y(-40), X(172), Y(4)))
            ys, xs = np.where(a[Y(4):Y(10), X(140):X(172), 3] > 100)
            cx = X(140) + (xs.min() + xs.max()) / 2.0 if len(xs) else X(155)
            # o cabo sobe até ao alvado (sem buraco entre o cabo e a lâmina)
            ys2 = np.where(a[Y(0):Y(40), int(cx) - 1, 3] > 100)[0]
            if len(ys2):
                for y in range(Y(0), Y(0) + ys2.min()):
                    a[y, int(cx) - 2:int(cx) + 3] = a[Y(0) + ys2.min() + 1, int(cx) - 2:int(cx) + 3]
            reg = a[Y(76):Y(102), X(134):X(150)]
            c3 = reg[..., :3].astype(int)
            reg[(reg[..., 3] > 0) & (np.abs(c3[..., 0] - c3[..., 2]) < 20) & (c3.mean(-1) > 90)] = 0
            draw_spade(a, cx, Y(4), 30, 34, ((60, 14, 8), (190, 60, 20), (240, 130, 40), (255, 210, 110), (255, 240, 190)), hot=True)
        if i == 19:
            src19 = frames[19][0]
            extend_up(a, Y(0), X(116), X(124), -1.0, 16)
            extend_up(a, Y(0), X(68), X(100), 1.8, 10, shrink_l=1.4, shrink_r=0.3)
            paste_piece(a, src19, (X(152), Y(24), X(174), Y(46)), (X(97), Y(-18)))
        spans = {38: (X(168), X(w)), 20: (X(150), X(w)), 19: (X(200), X(w)), 36: (X(0), X(w)), 37: (X(0), X(w)), 49: (X(0), X(w))}
        if i in spans:
            fade_side(a, 'T', box, depth=12, seed=i + 3, span=spans[i])
        if i == 19:
            fade_side(a, 'R', box, depth=12, seed=77, span=(Y(0), Y(90)))
    drop_border_bits(a, box)
    drop_specks(a)

def run(name):
    meta = json.load(open(STAGE / 'coveiro_meta.json'))[name]
    META.clear(); META.update(meta)
    sheet = np.asarray(Image.open(STAGE / f'{name}.png').convert('RGBA'))
    scale = meta['scale']
    frames_in = meta['frames']
    # 1) cada quadro numa tela com margem
    padded = {}
    for i, f in enumerate(frames_in):
        if not f or f.get('w') is None: continue
        w, h = f['w'], f['h']
        a = np.zeros((h + 2 * P, w + 2 * P, 4), np.uint8)
        a[P:P + h, P:P + w] = sheet[f['y']:f['y'] + h, f['x']:f['x'] + w]
        padded[i] = (a, (P, P))
    # 2) correções (os quadros de origem para colar são os já com margem, antes de mexer)
    src = {i: (v[0].copy(), v[1]) for i, v in padded.items()}
    for i, (a, _) in padded.items():
        f = frames_in[i]
        fixes(name, i, a, (P, P, P + f['w'], P + f['h']), src)
    # 3) recorta ao conteúdo (com 2 px) e volta a arrumar a folha em prateleiras
    crops = {}
    for i, (a, _) in padded.items():
        ys, xs = np.where(a[..., 3] > 3)
        cx0, cy0 = max(0, xs.min() - 2), max(0, ys.min() - 2)
        cx1, cy1 = min(a.shape[1], xs.max() + 3), min(a.shape[0], ys.max() + 3)
        crops[i] = (a[cy0:cy1, cx0:cx1], cx0 - P, cy0 - P)
    W = 2048; x = y = 0; row_h = 0; place = {}
    for i in sorted(crops, key=lambda k: -crops[k][0].shape[0]):
        c = crops[i][0]; ch, cw = c.shape[:2]
        if x + cw > W: x = 0; y += row_h + 2; row_h = 0
        place[i] = (x, y); x += cw + 2; row_h = max(row_h, ch)
    H = y + row_h
    out = np.zeros((H, W, 4), np.uint8)
    frames_out = []
    for i, f in enumerate(frames_in):
        if i not in crops:
            frames_out.append(f); continue
        c, dx, dy = crops[i]; px, py = place[i]
        out[py:py + c.shape[0], px:px + c.shape[1]] = c
        s = f.get('s') or scale
        g = dict(f)
        g.update({'x': px, 'y': py, 'w': int(c.shape[1]), 'h': int(c.shape[0]), 'ox': f['ox'] + dx / s, 'oy': f['oy'] + dy / s})
        frames_out.append(g)
    Image.fromarray(out).save(SPR / f'{name}.png', optimize=True)
    data = json.load(open(DATA, encoding='utf-8'))
    data[name]['frames'] = frames_out
    json.dump(data, open(DATA, 'w', encoding='utf-8'), ensure_ascii=False)
    print(name, 'folha', W, H)

for n in ['en_b_coveiro', 'en_b_coveiro_p2']:
    run(n)
