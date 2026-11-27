"""Muda campos da metadata de uma animação numa folha (web e Godot): python3 tools/set_meta.py <folha> <anim> campo=valor ...
ex.: python3 tools/set_meta.py en_b_caedmon idle frames=0,3,4,5   |   ... move stride=85"""
import json, re, sys, pathlib
ROOT = pathlib.Path(__file__).resolve().parents[1]
name, anim = sys.argv[1], sys.argv[2]
p = ROOT / 'assets' / 'sprites' / f'{name}.js'
js = p.read_text(encoding='utf-8')
m = re.search(r'= (\{.*\});', js)
meta = json.loads(m.group(1))
A = meta['anims'][anim]
for kv in sys.argv[3:]:
    k, v = kv.split('=', 1)
    A[k] = [int(x) for x in v.split(',')] if k == 'frames' else float(v)
p.write_text(js[:m.start(1)] + json.dumps(meta, separators=(',', ':')) + js[m.end(1):], encoding='utf-8')
print(name, anim, {k: A[k] for k in A if k != 'phases'})
