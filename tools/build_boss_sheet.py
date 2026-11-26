"""Monta a folha de sprites nova de um chefe (jogo web) a partir das poses recortadas (tools/split_sheet.py).
Mantém as animações do jogo (nomes, número de quadros, fps, fases) e os pontos (mão, olho, boca...) dos quadros antigos;
cada animação recebe as suas poses-chave, repetidas ao longo dos quadros antigos.
Escala: a figura parada nova fica da mesma altura que a antiga. Posição: o centro da base (pés/raízes) fica onde estava.
Uso: python3 tools/build_boss_sheet.py <chefe> <plano.json>
plano.json: {"idle": ["pose1.png", ...], "move": [...], ...}  (animações em falta ficam com as poses de "idle")
  "_scale": {"prefixo_": 0.66}  (opcional) corrige o tamanho das poses de uma folha do Gemini desenhada maior ou menor"""
import json, re, sys, pathlib
import numpy as np
from PIL import Image
ROOT = pathlib.Path(__file__).resolve().parents[1]

def load_meta(name):
    p = ROOT / 'assets' / 'sprites' / f'{name}.js'
    src = p.read_text(encoding='utf-8')
    m = re.search(r'(VS\.SPRITE_META\[".*?"\] = )(\{.*\});', src)
    return p, src, m, json.loads(m.group(2))

def bbox(a):
    ys, xs = np.where(a[..., 3] > 0)
    return xs.min(), ys.min(), xs.max() + 1, ys.max() + 1

def base_cx(a):
    """centro horizontal da base da figura (os 18% de baixo): pés, raízes, saia"""
    al = a[..., 3] > 0
    rows = np.where(al.any(1))[0]; top, bot = rows.min(), rows.max()
    band = al[max(top, bot - int((bot - top) * 0.18)):bot + 1]
    xs = np.where(band.any(0))[0]
    w = band.sum(0).astype(float)
    return float((np.arange(len(w)) * w).sum() / max(1, w.sum())) if len(xs) else al.shape[1] / 2

def main():
    name = 'en_b_' + sys.argv[1]
    plan = json.load(open(sys.argv[2], encoding='utf-8'))
    p, src, m, meta = load_meta(name)
    sh_old = Image.open(ROOT / 'assets' / 'sprites' / f'{name}.png').convert('RGBA')
    S = meta['scale']
    old = meta['frames']
    # referência: primeiro quadro parado antigo
    f0 = old[meta['anims']['idle']['frames'][0]]
    s0 = f0.get('s', S)
    a0 = np.asarray(sh_old.crop((f0['x'], f0['y'], f0['x'] + f0['w'], f0['y'] + f0['h'])))
    x0, y0, x1, y1 = bbox(a0)
    old_h_units = (y1 - y0) / s0
    foot_y = f0['oy'] + y1 / s0                    # linha do chão (unidades, relativa à âncora)
    foot_x = f0['ox'] + base_cx(a0) / s0           # centro da base
    # escala das poses novas: a pose parada nova com a mesma altura (em unidades) que a antiga
    idle0 = np.asarray(Image.open(plan['idle'][0]).convert('RGBA'))
    k = (old_h_units * S) / (bbox(idle0)[3] - bbox(idle0)[1])
    poses = {}
    def get(path):
        if path not in poses:
            im = Image.open(path).convert('RGBA')
            kk = k * next((v for pre, v in plan.get('_scale', {}).items() if pathlib.Path(path).name.startswith(pre)), 1.0)
            im = im.resize((max(1, round(im.width * kk)), max(1, round(im.height * kk))), Image.LANCZOS)
            a = np.asarray(im).copy(); a[..., 3] = np.where(a[..., 3] > 110, 255, 0)
            bx = bbox(a); a = a[bx[1]:bx[3], bx[0]:bx[2]]
            poses[path] = a
        return poses[path]
    # empacota
    order = []
    for an, A in meta['anims'].items():
        for pth in plan.get(an, plan['idle']):
            if pth not in order: order.append(pth)
    W = 2048; x = y = rowh = 0; place = {}
    for pth in order:
        a = get(pth)
        if x + a.shape[1] > W: x = 0; y += rowh + 2; rowh = 0
        place[pth] = (x, y); x += a.shape[1] + 2; rowh = max(rowh, a.shape[0])
    sheet = Image.new('RGBA', (W, y + rowh + 2), (0, 0, 0, 0))
    for pth in order: sheet.paste(Image.fromarray(poses[pth]), place[pth])
    # quadros novos: um por (animação, quadro antigo), apontando para a pose certa
    frames, anims = [], {}
    for an, A in meta['anims'].items():
        ps = plan.get(an, plan['idle']); n = len(A['frames']); idx = []
        for j, ofi in enumerate(A['frames']):
            pth = ps[min(len(ps) - 1, j * len(ps) // n)]
            a = poses[pth]; px, py = place[pth]
            fr = {'ox': round(foot_x - base_cx(a) / S, 3), 'oy': round(foot_y - a.shape[0] / S, 3),
                  'pts': old[ofi].get('pts'), 'dur': old[ofi].get('dur'), 'x': px, 'y': py, 'w': int(a.shape[1]), 'h': int(a.shape[0])}
            frames.append(fr); idx.append(len(frames) - 1)
        anims[an] = dict(A, frames=idx)
    meta['frames'] = frames; meta['anims'] = anims
    sheet.save(ROOT / 'assets' / 'sprites' / f'{name}.png', optimize=True)
    p.write_text(src[:m.start(2)] + json.dumps(meta, ensure_ascii=False, separators=(',', ':')) + src[m.end(2):], encoding='utf-8')
    print(name, len(order), 'poses,', len(frames), 'quadros, folha', sheet.size, 'escala', round(k, 3))

if __name__ == '__main__':
    main()
