#!/bin/sh
# Ciclos de andar novos dos inimigos (Gemini, fundo verde): recorta, fecha frestas da grelha e troca a animação
# 'move' nas folhas (repõe primeiro as folhas do último commit para não acumular quadros). Uso: sh tools/art/apply_walks.sh
set -e
cd "$(dirname "$0")/../.."
D=tools/art/poses/walk
# nome:fps:passo[:folhas extra][:poses a espelhar][:poses a tirar]
for spec in husk:8:26:en_husk_big sexton:7:28 sentinel:7:28 crossbow:8:28 crawler:10:30::r1_0,r1_1,r1_2 hound:12:40:en_hound_big thrall:6:30:en_thrall_big smelter:7:28::r1_1:r1_2 drowned:6:28:en_drowned_big acolyte:6:26 penitent:9:30:en_penitent_big::r1_1 royalguard:6:30:en_royalguard_big torch:12:34 \
            $EXTRA; do
  n=$(echo $spec | cut -d: -f1); fps=$(echo $spec | cut -d: -f2); st=$(echo $spec | cut -d: -f3)
  extra=$(echo $spec | cut -d: -f4); flip=$(echo $spec | cut -d: -f5); drop=$(echo $spec | cut -d: -f6)
  [ -f tools/art/gemini/walk_$n.webp ] || continue
  python3 tools/split_sheet.py tools/art/gemini/walk_$n.webp $D $n 4,4 --green >/dev/null
  python3 tools/fix_grid_lines.py $D/${n}_r*.png >/dev/null
  for f in $(echo $drop | tr ',' ' '); do rm -f $D/${n}_$f.png; done
  for f in $(echo $flip | tr ',' ' '); do python3 -c "from PIL import Image, ImageOps; p='$D/${n}_$f.png'; ImageOps.mirror(Image.open(p)).save(p)"; done
  for sh in en_$n $extra; do
    git checkout -q HEAD -- assets/sprites/$sh.png assets/sprites/$sh.js
    python3 tools/replace_anim.py $sh move $fps $(ls $D/${n}_r*.png | sort) --stride=$st
  done
done
python3 tools/art/build.py --bundle | tail -1
python3 tools/sync_godot_sprites.py
