"""Assenta os pés no chão: mede onde acaba a figura nos quadros 'idle' e sobe (ou desce) TODOS os quadros da folha
pela mesma quantidade, para que os pés fiquem na linha do chão (sem ficarem tapados pelo chão = pé cortado).
Uso: python3 tools/ground_fix.py <folha> [...]"""
import json, re, sys, pathlib
import numpy as np
from PIL import Image
ROOT = pathlib.Path(__file__).resolve().parents[1]
for name in sys.argv[1:]:
    p = ROOT / 'assets' / 'sprites' / f'{name}.js'
    js = p.read_text(encoding='utf-8'); m = re.search(r'= (\{.*\});', js); d = json.loads(m.group(1))
    sh = np.asarray(Image.open(p.with_suffix('.png')).convert('RGBA'))
    bs = []
    for fi in d['anims']['idle']['frames']:
        f = d['frames'][fi]; s = f.get('s', d['scale'])
        a = sh[f['y']:f['y'] + f['h'], f['x']:f['x'] + f['w'], 3] > 0
        bs.append(f['oy'] + (np.where(a.any(1))[0].max() + 1) / s)
    dy = float(np.median(bs)) - 0.5
    for f in d['frames']:
        f['oy'] = round(f['oy'] - dy, 3)
        for k, v in (f.get('pts') or {}).items():
            if v: v[1] = round(v[1] - dy, 3)
    p.write_text(js[:m.start(1)] + json.dumps(d, separators=(',', ':')) + js[m.end(1):], encoding='utf-8')
    print(name, 'subiu', round(dy, 2))
