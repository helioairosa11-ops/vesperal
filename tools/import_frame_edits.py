"""Volta a pôr na folha do Godot os quadros do Coveiro redesenhados no Pixelorama.
Os quadros saem em 'Vesperal Arte/coveiro_fase1|2/NN_anim_k.png' (um PNG por quadro, do tamanho exato do quadro).
Depois de editados, copia-os para tools/art/edits/<fase>/ e corre:  python3 tools/import_frame_edits.py
Cada PNG tem de manter o tamanho; o número NN no início do nome é o índice do quadro."""
import json, pathlib, re
from PIL import Image
ROOT = pathlib.Path(__file__).resolve().parents[1]
EDITS = ROOT / 'tools' / 'art' / 'edits'
SHEETS = {'coveiro_fase1': 'en_b_coveiro', 'coveiro_fase2': 'en_b_coveiro_p2'}
data = json.load(open(ROOT / 'godot' / 'data' / 'sprites.json', encoding='utf-8'))
for folder, name in SHEETS.items():
    d = EDITS / folder
    if not d.exists():
        continue
    path = ROOT / 'godot' / 'art' / 'sprites' / f'{name}.png'
    sheet = Image.open(path).convert('RGBA')
    n = 0
    for f in sorted(d.glob('*.png')):
        m = re.match(r'(\d+)_', f.name)
        if not m:
            continue
        fr = data[name]['frames'][int(m.group(1))]
        im = Image.open(f).convert('RGBA')
        dy = 0
        if im.size != (fr['w'], fr['h']):
            # mesma largura e mais baixo (a folha ganhou margem por cima): encosta pelo corpo e pela terra
            if im.size[0] != fr['w'] or im.size[1] > fr['h']:
                print('tamanho diferente, ignorado:', f.name, im.size, (fr['w'], fr['h']))
                continue
            import numpy as np
            cur = np.asarray(sheet.crop((fr['x'], fr['y'], fr['x'] + fr['w'], fr['y'] + fr['h'])))[..., 3].astype(int)
            ed = np.asarray(im)[..., 3].astype(int)
            h2 = im.size[1] // 2
            dy = min(range(fr['h'] - im.size[1] + 1), key=lambda k: np.abs(cur[k + h2:k + im.size[1]] - ed[h2:]).sum())
        sheet.paste(Image.new('RGBA', (fr['w'], fr['h']), (0, 0, 0, 0)), (fr['x'], fr['y']))
        sheet.paste(im, (fr['x'], fr['y'] + dy))
        n += 1
    sheet.save(path, optimize=True)
    print(name, 'quadros importados:', n)
