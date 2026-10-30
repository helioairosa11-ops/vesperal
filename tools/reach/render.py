"""Desenha o resultado do analisador de alcance: o mundo inteiro (ou uma sala) com as superfícies coloridas.
verde = alcança-se a saltar · amarelo = só a trepar paredes · azul = só por passagem secreta · vermelho = não se alcança
Uso: python3 tools/reach/render.py reach.json saida.png [sala ...] [--scale N]
"""
import json, sys
from PIL import Image, ImageDraw, ImageFont

COL = {'ok': (90, 200, 110), 'climb': (240, 200, 60), 'secret': (90, 150, 255), 'no': (240, 60, 60)}
TILE = {'#': (58, 54, 60), '=': (150, 130, 100), '^': (200, 80, 200), 'L': (255, 110, 30), '~': (50, 90, 170), 'C': (110, 90, 70),
        'F': (90, 70, 110), 'X': (130, 110, 80), 'V': (120, 80, 160)}
ENT = {'item': (255, 255, 255), 'urn': (200, 170, 120), 'inscription': (170, 200, 255), 'npc': (255, 150, 220), 'altar': (255, 220, 120),
       'lever': (120, 255, 255), 'shrine': (255, 255, 255), 'boss': (255, 40, 40)}


def main():
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    scale = 4
    if '--scale' in sys.argv:
        scale = int(sys.argv[sys.argv.index('--scale') + 1]); args = [a for a in args if a != str(scale)]
    rep = json.load(open(args[0])); out = args[1]; only = set(args[2:])
    rooms = {k: v for k, v in rep['rooms'].items() if not only or k in only}
    x0 = min(r['ox'] for r in rooms.values()); y0 = min(r['oy'] for r in rooms.values())
    x1 = max(r['ox'] + r['w'] for r in rooms.values()); y1 = max(r['oy'] + r['h'] for r in rooms.values())
    S = scale
    im = Image.new('RGB', ((x1 - x0) * S, (y1 - y0) * S), (16, 14, 18)); d = ImageDraw.Draw(im)
    try:
        font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', max(9, S * 3))
    except Exception:
        font = None
    for rid, r in rooms.items():
        ox, oy = r['ox'] - x0, r['oy'] - y0
        d.rectangle([ox * S, oy * S, (ox + r['w']) * S - 1, (oy + r['h']) * S - 1], fill=(30, 28, 34))
        for ly, row in enumerate(r['map']):
            for lx, ch in enumerate(row):
                c = TILE.get(ch)
                if c:
                    d.rectangle([(ox + lx) * S, (oy + ly) * S, (ox + lx + 1) * S - 1, (oy + ly + 1) * S - 1], fill=c)
        for s in r['segs']:
            c = COL[s['st']]
            d.rectangle([(ox + s['x0']) * S, (oy + s['y']) * S - max(1, S // 2), (ox + s['x1'] + 1) * S - 1, (oy + s['y']) * S + max(0, S // 3)], fill=c)
        d.rectangle([ox * S, oy * S, (ox + r['w']) * S - 1, (oy + r['h']) * S - 1], outline=(90, 90, 100))
        if font:
            d.text((ox * S + 3, oy * S + 2), rid, fill=(220, 220, 230), font=font)
    for e in rep['ents']:
        if e['room'] not in rooms:
            continue
        r = rooms[e['room']]; ox, oy = r['ox'] - x0, r['oy'] - y0
        cx, cy = (ox + e['x'] + 0.5) * S, (oy + e['y'] + 0.5) * S
        rr = max(2, S * 0.7)
        d.ellipse([cx - rr, cy - rr, cx + rr, cy + rr], fill=ENT.get(e['t'], (255, 255, 255)), outline=COL[e['st']] if e['st'] != 'ok' else None, width=max(1, S // 3))
    im.save(out)


if __name__ == '__main__':
    main()
