"""Ícones dos trajes: busto do Desperto recortado do primeiro fotograma de 'idle' de cada folha (capuz / sino)."""
import json, pathlib, re
from PIL import Image, ImageDraw, ImageFilter

ROOT = pathlib.Path(__file__).resolve().parents[2]
SP = ROOT / 'assets' / 'sprites'


def meta(name):
    txt = (SP / f'{name}.js').read_text()
    return json.loads(re.search(r'= (\{.*\});', txt).group(1))


def bust(name, out):
    m = meta(name); s = m['scale']
    f = m['frames'][m['anims']['idle']['frames'][0]]
    hx, hy = f['pts']['head']
    px, py = (hx - f['ox']) * s, (hy - f['oy']) * s
    sheet = Image.open(SP / f'{name}.png').convert('RGBA')
    fr = sheet.crop((f['x'], f['y'], f['x'] + f['w'], f['y'] + f['h']))
    half = 9.5 * s
    box = (int(px - half), int(py - half * 0.8), int(px + half), int(py + half * 1.2))
    canvas = Image.new('RGBA', (box[2] - box[0], box[3] - box[1]), (0, 0, 0, 0))
    canvas.paste(fr, (-box[0], -box[1]))
    icon = Image.new('RGBA', (128, 128), (0, 0, 0, 0))
    glow = Image.new('RGBA', (128, 128), (0, 0, 0, 0))
    ImageDraw.Draw(glow).ellipse((14, 14, 114, 114), fill=(10, 8, 14, 170))
    icon.alpha_composite(glow.filter(ImageFilter.GaussianBlur(12)))
    c = canvas.resize((118, int(118 * canvas.height / canvas.width)), Image.LANCZOS)
    icon.alpha_composite(c, ((128 - c.width) // 2, max(0, 128 - c.height) // 2 + 4))
    icon.save(ROOT / 'assets' / 'icons' / out)
    print(out, icon.size)


bust('hero', 'look_capuz.png')
bust('hero_sino', 'look_sino.png')
