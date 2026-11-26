"""Copia folhas de sprites do jogo web (assets/sprites/<nome>.png + metadados do .js) para o Godot
(godot/art/sprites/<nome>.png e godot/data/sprites.json), para o Godot usar a mesma arte que o browser.
Uso: python3 tools/sync_godot_sprites.py [nome ...]   (sem nomes: todas as folhas en_* e npc_*)"""
import json, re, shutil, sys, pathlib
ROOT = pathlib.Path(__file__).resolve().parents[1]
SP = ROOT / 'assets' / 'sprites'
GJ = ROOT / 'godot' / 'data' / 'sprites.json'
names = sys.argv[1:] or sorted(p.stem for p in SP.glob('*.png') if p.stem.startswith(('en_', 'npc_')))
meta = json.load(open(GJ, encoding='utf-8'))
for n in names:
    js = SP / f'{n}.js'
    if not js.exists():
        print('sem metadados:', n); continue
    m = json.loads(re.search(r'= (\{.*\});', js.read_text(encoding='utf-8')).group(1))
    meta[n] = m
    shutil.copy(SP / f'{n}.png', ROOT / 'godot' / 'art' / 'sprites' / f'{n}.png')
import math
def fix(o):   # o Godot não lê NaN (vem de pontos por calcular nalgumas folhas): passa a null
    if isinstance(o, float) and math.isnan(o): return None
    if isinstance(o, dict): return {k: fix(v) for k, v in o.items()}
    if isinstance(o, list): return [fix(v) for v in o]
    return o
json.dump(fix(meta), open(GJ, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'), allow_nan=False)
print(len(names), 'folhas copiadas para o Godot')
