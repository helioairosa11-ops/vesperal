#!/bin/sh
# folhas do Coveiro para o Godot: limpeza + quadros redesenhados (Gemini) no golpe de cima
set -e
cd "$(dirname "$0")/.."
python3 tools/fix_coveiro.py
python3 tools/import_gemini_frame.py tools/art/gemini/coveiro_f1_levantar.webp en_b_coveiro 16 160
python3 tools/import_gemini_frame.py tools/art/gemini/coveiro_f2_levantar.webp en_b_coveiro_p2 16 160
python3 tools/import_gemini_match.py tools/art/gemini/coveiro_f1_golpe.webp en_b_coveiro 19 0.221
python3 tools/import_gemini_match.py tools/art/gemini/coveiro_f2_golpe.webp en_b_coveiro_p2 19 0.221
python3 - <<'PY'
import json
p='godot/data/sprites.json'; d=json.load(open(p,encoding='utf-8'))
for n in ('en_b_coveiro','en_b_coveiro_p2'):
    d[n]['anims']['atk_slam']['frames']=[14,15,16,17,18,19,20]
json.dump(d,open(p,'w',encoding='utf-8'),ensure_ascii=False)
PY
