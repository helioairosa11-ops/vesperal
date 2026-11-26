"""Separa uma folha de poses do Gemini (fundo magenta) em figuras recortadas, por filas e da esquerda para a direita.
Recorte: chave do magenta com margem de cor, tira o halo rosado das orlas (despill), tapa furinhos dentro da figura,
junta peças soltas da mesma pose (trepadeiras, faíscas) por proximidade.
Uso: python3 tools/split_sheet.py <imagem> <pasta_saida> <prefixo> [poses_por_fila, ex. 4 ou 4,5] [--nopurple] [--green]
--green: fundo verde puro #00FF00 (o recorte troca os canais para usar a mesma chave e devolve as cores originais)
Saída: <prefixo>_r<fila>_<n>.png (RGBA, recortado)"""
import sys, pathlib
import numpy as np
from PIL import Image
import scipy.ndimage as ndi

def key_magenta(g, nopurple=False):
    r, gg, b = g[..., 0], g[..., 1], g[..., 2]
    # quão "magenta" é cada pixel: r e b altos, g baixo
    m = np.clip((np.minimum(r, b) - gg - 40) / 120.0, 0, 1) * np.clip((np.minimum(r, b) - 90) / 80.0, 0, 1)
    bg = m > 0.55
    # magenta escurecido/sombreado pelo Gemini (rastos, sombras roxas): também é fundo
    dark = ((r - gg) > 45) & ((b - gg) > 38) & (np.abs(r - b) < 90)
    bg |= dark
    # o fundo é o magenta ligado à borda (o que estiver dentro e for magenta forte também sai)
    lab, n = ndi.label(bg)
    edge = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
    sizes = ndi.sum(bg, lab, range(1, n + 1))
    keep_bg = np.isin(lab, [i for i in edge] + [i + 1 for i in range(n) if sizes[i] > 400])
    alpha = ~keep_bg
    # orla: pixels meio-magenta junto ao fundo ficam semi-transparentes e perdem o tom rosado
    ring = ndi.binary_dilation(keep_bg, iterations=2) & alpha
    out = g.astype(float).copy()
    a = np.where(alpha, 255.0, 0.0)
    a[ring] = 255 * (1 - m[ring])
    # despill: tira o excesso de vermelho+azul em relação ao verde nas orlas
    sp = ring | (alpha & (m > 0.15))
    lim = out[..., 1] + 25
    out[..., 0][sp] = np.minimum(out[..., 0][sp], np.maximum(lim[sp], out[..., 0][sp] * 0.6))
    out[..., 2][sp] = np.minimum(out[..., 2][sp], np.maximum(lim[sp], out[..., 2][sp] * 0.6))
    a[a < 60] = 0
    # furinhos dentro
    solid = a > 0
    filled = ndi.binary_fill_holes(solid)
    holes = filled & ~solid
    hl, hn = ndi.label(holes)
    if hn:
        hs = ndi.sum(holes, hl, range(1, hn + 1))
        small = np.isin(hl, [i + 1 for i in range(hn) if hs[i] < 60])
        idx = ndi.distance_transform_edt(~solid, return_distances=False, return_indices=True)
        out[small] = out[idx[0][small], idx[1][small]]; a[small] = 255
    # passagem final: restos rosados ténues (reflexo do fundo) apagam-se na orla e perdem o tom no interior
    pink = (a > 0) & ((out[..., 0] - out[..., 1]) > 26) & ((out[..., 2] - out[..., 1]) > 20) & (np.abs(out[..., 0] - out[..., 2]) < 80)
    near = ndi.binary_dilation(a == 0, iterations=3)
    a[pink & near] = 0
    # halo lilás (brilho por cima do magenta) na orla
    lilac = (a > 0) & ((out[..., 2] - out[..., 1]) > 22) & (out[..., 0] > out[..., 1]) & ndi.binary_dilation(a == 0, iterations=6)
    a[lilac] = 0
    if nopurple:   # chefes sem roxo no desenho: qualquer tom lilás é reflexo do fundo
        a[(a > 0) & ((out[..., 2] - out[..., 1]) > 14) & ((out[..., 0] - out[..., 1]) > 0)] = 0
    inner = pink & ~near
    out[..., 0][inner] = out[..., 1][inner] + 8; out[..., 2][inner] = out[..., 1][inner] + 4
    rgba = np.dstack([np.clip(out, 0, 255), a]).astype(np.uint8)
    return rgba

def split(rgba, rows=None, per_row=None):
    solid = rgba[..., 3] > 0
    # junta peças próximas da mesma pose
    big = ndi.binary_dilation(solid, iterations=4)
    lab, n = ndi.label(big)
    objs = ndi.find_objects(lab)
    sizes = ndi.sum(solid, lab, range(1, n + 1))
    figs = [(sl, i + 1) for i, sl in enumerate(objs) if sizes[i] > 1500]
    # filas pelo centro vertical
    cy = np.array([(sl[0].start + sl[0].stop) / 2 for sl, _ in figs])
    order = np.argsort(cy)
    rows_out, cur = [], [figs[order[0]]]
    for k in order[1:]:
        f = figs[k]; prev = cur[-1][0]
        h = prev[0].stop - prev[0].start
        if abs((f[0][0].start + f[0][0].stop) / 2 - (prev[0].start + prev[0].stop) / 2) < h * 0.5:
            cur.append(f)
        else:
            rows_out.append(cur); cur = [f]
    rows_out.append(cur)
    res = []
    for r in rows_out:
        r.sort(key=lambda f: f[0][1].start)
        res.append([(sl, lid) for sl, lid in r])
    return res, lab

def pieces_of_row(rgba, lab, r):
    out = []
    for sl, lid in r:
        m = (lab[sl] == lid)
        piece = rgba[sl].copy(); piece[..., 3] = np.where(m, piece[..., 3], 0)
        # pedacinhos soltos (de outra pose ou faíscas isoladas) saem
        sol = piece[..., 3] > 0; cl, cn = ndi.label(sol)
        if cn > 1:
            cs = ndi.sum(sol, cl, range(1, cn + 1)); big = cs.max()
            piece[..., 3][np.isin(cl, [i + 1 for i in range(cn) if cs[i] < big * 0.02])] = 0
        out.append(piece)
    return out

def cut_widest(pieces):
    # duas poses coladas (ex.: trepadeira esticada até à pose seguinte): corta onde a figura é mais fina,
    # o mais à direita possível antes de a pose seguinte começar
    k = max(range(len(pieces)), key=lambda i: pieces[i].shape[1])
    p = pieces[k]; w = p.shape[1]
    cnt = ndi.uniform_filter1d((p[..., 3] > 0).sum(0).astype(float), 5)
    lo, hi = int(w * 0.35), int(w * 0.85)
    seg = cnt[lo:hi]; mn = seg.min()
    cands = np.where(seg <= mn + max(3, mn * 0.25))[0]
    c = lo + int(cands.max())
    a, b = p[:, :c].copy(), p[:, c:].copy()
    def trim(q):
        cols = np.where((q[..., 3] > 0).any(0))[0]; rows = np.where((q[..., 3] > 0).any(1))[0]
        return q[rows.min():rows.max() + 1, cols.min():cols.max() + 1]
    return pieces[:k] + [trim(a), trim(b)] + pieces[k + 1:]

if __name__ == '__main__':
    src, out, pre = sys.argv[1], pathlib.Path(sys.argv[2]), sys.argv[3]
    args = [a for a in sys.argv if not a.startswith('--')]
    wants = [int(v) for v in args[4].split(',')] if len(args) > 4 else [0]
    out.mkdir(parents=True, exist_ok=True)
    g = np.asarray(Image.open(src).convert('RGB')).astype(int)
    if '--green' in sys.argv:
        # verde puro passa a magenta: R'=G, G'=max(R,B), B'=G; a chave dá o alfa, as cores vêm do original
        t = np.dstack([g[..., 1], np.maximum(g[..., 0], g[..., 2]), g[..., 1]])
        a = key_magenta(t)[..., 3]
        col = g.astype(float).copy()
        # despill verde nas orlas: o verde nunca passa muito do maior dos outros dois
        edge = ndi.binary_dilation(a == 0, iterations=3) & (a > 0)
        lim = np.maximum(col[..., 0], col[..., 2]) + 12
        gr = col[..., 1]; gr[edge] = np.minimum(gr[edge], lim[edge]); gr[(a > 0) & (gr > lim + 50)] = lim[(a > 0) & (gr > lim + 50)]
        a[(a > 0) & edge & (g[..., 1] - np.maximum(g[..., 0], g[..., 2]) > 90)] = 0
        # nenhum destes chefes tem verde: qualquer píxel claramente verde é resto do fundo
        a[(g[..., 1] - np.maximum(g[..., 0], g[..., 2])) > 40] = 0
        rgba = np.dstack([np.clip(col, 0, 255), a]).astype(np.uint8)
    else:
        rgba = key_magenta(g, '--nopurple' in sys.argv)
    # corta primeiro em faixas horizontais (uma por fila), pela linha com menos figura entre filas
    nb = len(wants) if len(args) > 4 else 0
    bands = [rgba]
    if nb > 1:
        cnt = ndi.uniform_filter1d((rgba[..., 3] > 0).sum(1).astype(float), 9); H = rgba.shape[0]; cuts = []
        for i in range(1, nb):
            c0 = int(H * i / nb); lo, hi = c0 - int(H * 0.15 / nb * nb), c0 + int(H * 0.15)
            lo = max(lo, c0 - int(H * 0.15)); cuts.append(lo + int(np.argmin(cnt[lo:hi])))
        edges = [0] + cuts + [H]; bands = [rgba[edges[i]:edges[i + 1]] for i in range(nb)]
    rows = []
    for band in bands:
        rr, lab = split(band)
        for r in rr: rows.append((band, lab, r))
    for ri, (band, lab, r) in enumerate(rows):
        ps = pieces_of_row(band, lab, r)
        want = wants[min(ri, len(wants) - 1)]
        while want and len(ps) < want:
            ps = cut_widest(ps)
        for ci, piece in enumerate(ps):
            Image.fromarray(piece).save(out / f'{pre}_r{ri}_{ci}.png')
        print('fila', ri, len(ps), 'poses')
