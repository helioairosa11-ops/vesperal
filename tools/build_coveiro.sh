#!/bin/sh
# folhas do Coveiro para o Godot: limpeza + quadros redesenhados (Gemini) no golpe de cima
set -e
cd "$(dirname "$0")/.."
python3 tools/fix_coveiro.py
python3 tools/import_gemini_frame.py tools/art/gemini/coveiro_f1_levantar.webp en_b_coveiro 16 160
python3 tools/import_gemini_frame.py tools/art/gemini/coveiro_f2_levantar.webp en_b_coveiro_p2 16 160
