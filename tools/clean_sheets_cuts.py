"""Limpeza das folhas de inimigos e chefes (jogo web e Godot):
1) orla clara deixada pelo fundo quando foi recortado (píxeis claros e sem cor na borda da figura, mais claros
   do que o que está logo por dentro) — tirada em 1–2 passagens;
2) quadros com a figura cortada pelo recorte (cabeça, costas, asas a acabar a direito no topo ou nos lados):
   nas animações passam a usar o quadro completo mais próximo da mesma animação (o tempo e as fases ficam iguais).
Uso: python3 tools/clean_sheets_cuts.py [--dry] [nomes...]"""
import json, re, sys, pathlib
import numpy as np
from PIL import Image
import scipy.ndimage as ndi
ROOT = pathlib.Path(__file__).resolve().parents[1]
WEB = ROOT / 'assets' / 'sprites'
GD = ROOT / 'godot'
GJSON = GD / 'data' / 'sprites.json'
NO_PURPLE = {'en_b_coveiro', 'en_b_coveiro_p2', 'en_b_mariposa', 'en_moth', 'en_vitrail', 'en_b_seraphine', 'en_b_custodio'}
FORCE_CUT = {'en_b_coveiro': [16, 19], 'en_b_coveiro_p2': [16, 19]}

def defringe(a, passes=2):
    a = a.copy()
    for _ in range(passes):
        empty = a[..., 3] < 20
        edge = (~empty) & ndi.binary_dilation(empty)
        rgb = a[..., :3].astype(int)
        lum = rgb.mean(-1); sat = rgb.max(-1) - rgb.min(-1)
        solid = (~empty) & ~edge
        # luminância média dos vizinhos interiores (janela 5x5)
        k = np.ones((5, 5))
        s = ndi.convolve(np.where(solid, lum, 0.0), k, mode='constant')
        c = ndi.convolve(solid.astype(float), k, mode='constant')
        inner = np.where(c > 0, s / np.maximum(c, 1), lum)
        bad = edge & (lum > inner + 45) & (sat < 45) & (c > 2)
        if not bad.any():
            break
        a[bad] = 0
    return a

def depurple(a, max_size=260):
    """manchas soltas que sobraram do fundo roxo-escuro do recorte: peças separadas da figura, pequenas,
    escuras e com a cor média roxa (as faíscas, a poeira e o fumo são claros ou não são roxos e ficam)"""
    a = a.copy()
    op = a[..., 3] > 40
    lab, n = ndi.label(op, structure=np.ones((3, 3)))
    if n < 2:
        return a, 0
    sizes = ndi.sum(op, lab, range(1, n + 1))
    main = 1 + int(np.argmax(sizes))
    rgb = a[..., :3].astype(int)
    removed = 0
    for k in range(1, n + 1):
        if k == main or sizes[k - 1] > max_size:
            continue
        m = lab == k
        r, g, b = (rgb[..., c][m].mean() for c in range(3))
        if b - g >= 9 and r - g >= 7 and (r + g + b) / 3 < 90:
            mm = ndi.binary_dilation(m, iterations=1) & (a[..., 3] < 255) & ~(lab == main) | m
            a[mm] = 0
            removed += int(m.sum())
    return a, removed

def run(v):
    best = cur = 0
    for x in v:
        cur = cur + 1 if x else 0
        best = max(best, cur)
    return best

def cut_frames(sh, frames, name):
    runs = {}
    for i, f in enumerate(frames):
        if not f or f.get('w') is None or f['w'] < 4 or f['h'] < 4:
            continue
        al = sh[f['y']:f['y'] + f['h'], f['x']:f['x'] + f['w'], 3] > 100
        if al.shape[0] < 4 or al.shape[1] < 4:
            continue
        runs[i] = (run(al[0]), run(al[:, 0]), run(al[:, -1]), f['w'], f['h'])
    if not runs:
        return set()
    tops = np.array([r[0] for r in runs.values()])
    med = float(np.median(tops))
    cut = set(FORCE_CUT.get(name, []))
    for i, (t, l, r, w, h) in runs.items():
        # corte a direito: bem mais comprido do que o normal desta personagem
        if t >= max(18, med * 1.8 + 6):
            cut.add(i)
    return cut

def remap(meta, cut):
    changed = 0
    for an, A in meta['anims'].items():
        fr = A['frames']
        good = [x for x in fr if x not in cut]
        if not good:
            continue
        new = []
        for k, x in enumerate(fr):
            if x not in cut:
                new.append(x); continue
            # o quadro completo mais próximo na mesma animação (antes, depois)
            cand = None
            for dk in range(1, len(fr)):
                for kk in (k - dk, k + dk):
                    if 0 <= kk < len(fr) and fr[kk] not in cut:
                        cand = fr[kk]; break
                if cand is not None:
                    break
            new.append(cand); changed += 1
        A['frames'] = new
    return changed

def main(argv):
    dry = '--dry' in argv
    names = [a for a in argv if not a.startswith('--')]
    gj = json.load(open(GJSON, encoding='utf-8'))
    for js in sorted(WEB.glob('en_*.js')):
        name = js.stem
        if names and name not in names:
            continue
        src = js.read_text(encoding='utf-8')
        m = re.search(r'(VS\.SPRITE_META\[".*?"\] = )(\{.*\});', src)
        meta = json.loads(m.group(2))
        png = WEB / f'{name}.png'
        sh = np.asarray(Image.open(png).convert('RGBA'))
        frames = meta.get('frames') or gj.get(name, {}).get('frames', [])
        # 1) orla do fundo
        out = sh.copy()
        removed = 0
        for f in frames:
            if not f or f.get('w') is None:
                continue
            reg = out[f['y']:f['y'] + f['h'], f['x']:f['x'] + f['w']]
            cl, _ = depurple(reg) if name not in NO_PURPLE else (reg, 0)
            cl = defringe(cl)
            removed += int(((reg[..., 3] > 0) & (cl[..., 3] == 0)).sum())
            out[f['y']:f['y'] + f['h'], f['x']:f['x'] + f['w']] = cl
        # 2) quadros cortados
        cut = cut_frames(out, frames, name)
        ch = remap(meta['anims'] and meta, cut)
        print(f'{name:22s} orla tirada {removed:6d} px · quadros cortados {sorted(cut)} · trocas {ch}')
        if dry:
            continue
        Image.fromarray(out).save(png, optimize=True)
        js.write_text(src[:m.start(2)] + json.dumps(meta, ensure_ascii=False, separators=(',', ':')) + src[m.end(2):], encoding='utf-8')
        if name in gj:
            gj[name]['anims'] = meta['anims'] if name not in ('en_b_coveiro', 'en_b_coveiro_p2') else gj[name]['anims']
            gp = GD / 'art' / 'sprites' / f'{name}.png'
            if gp.exists() and name not in ('en_b_coveiro', 'en_b_coveiro_p2'):
                g = np.asarray(Image.open(gp).convert('RGBA')).copy()
                for f in gj[name]['frames']:
                    if not f or f.get('w') is None:
                        continue
                    reg = g[f['y']:f['y'] + f['h'], f['x']:f['x'] + f['w']]
                    cl2 = depurple(reg)[0] if name not in NO_PURPLE else reg
                    g[f['y']:f['y'] + f['h'], f['x']:f['x'] + f['w']] = defringe(cl2)
                Image.fromarray(g).save(gp, optimize=True)
    # Coveiro no Godot (folhas próprias, com margem): só a troca dos quadros cortados
    for name in ('en_b_coveiro', 'en_b_coveiro_p2'):
        if names and name not in names:
            continue
        ch = remap(gj[name], set(FORCE_CUT[name]))
        print(name, '(Godot) trocas', ch)
    if not dry:
        json.dump(gj, open(GJSON, 'w', encoding='utf-8'), ensure_ascii=False)

if __name__ == '__main__':
    main(sys.argv[1:])
