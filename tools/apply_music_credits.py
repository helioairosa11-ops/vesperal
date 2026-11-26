"""Aplica tools/music_credits.json a tudo o que depende dele: substituições de música do jogo web, lista de faixas
licenciadas do Godot, créditos no jogo (4 idiomas, web e Godot), README e LICENSE.
Só entram as faixas cujo ficheiro existe em assets/audio/music/. Uso: python3 tools/apply_music_credits.py"""
import json, re, pathlib
ROOT = pathlib.Path(__file__).resolve().parents[1]
ALL = json.load(open(ROOT / 'tools/music_credits.json', encoding='utf-8'))
T = [t for t in ALL if (ROOT / 'assets/audio/music' / f"{t['id']}.ogg").exists()]

def sub_between(s, a, b, new):
    i = s.index(a) + len(a); j = s.index(b, i)
    return s[:i] + new + s[j:]

def short_author(t):
    return t['author'].split(' (vozes')[0]

# 1) jogo web: substituições
body = ''.join(f"  // {t['boss']}: \"{t['title']}\" — {t['author']}, {t['license']}\n  {t['id']}: 'assets/audio/music/{t['id']}.ogg',\n" for t in T)
p = ROOT / 'js/data/audio_overrides.js'; s = p.read_text(encoding='utf-8')
s = re.sub(r'window\.VS\.AUDIO_OVERRIDES = \{.*?\};', lambda m: 'window.VS.AUDIO_OVERRIDES = {\n' + body + '};', s, flags=re.S)
p.write_text(s, encoding='utf-8')

# 2) Godot: lista de faixas licenciadas (sem versões mais intensas)
p = ROOT / 'godot/scripts/audio.gd'; s = p.read_text(encoding='utf-8')
s = re.sub(r'const LICENSED := \[.*?\]', 'const LICENSED := [' + ', '.join(f'"{t["id"]}"' for t in T) + ']', s)
p.write_text(s, encoding='utf-8')

# 3) créditos no jogo
html = ''.join(f"<div>“{t['title']}” — {t['author']} · {t['license']}</div>" for t in T) + '<div>(OpenGameArt.org)</div>'
heads = {'pt': 'Música dos chefes e do menu', 'en': 'Boss and menu music', 'es': 'Música de los jefes y del menú', 'fr': 'Musique des boss et du menu'}
for lang, h in heads.items():
    for p in (ROOT / f'js/data/lang/{lang}.js', ROOT / f'godot/data/lang_{lang}.json'):
        s = p.read_text(encoding='utf-8')
        s = sub_between(s, f'<h3>{h}</h3>', '<h3>', html)
        p.write_text(s, encoding='utf-8')
gd = ' · '.join(f"“{t['title']}” — {short_author(t)} ({t['license']})" for t in T) + ' · OpenGameArt.org'
p = ROOT / 'godot/scripts/ui.gd'; s = p.read_text(encoding='utf-8')
s = re.sub(r'const BOSS_MUSIC := ".*?"\n', lambda m: f'const BOSS_MUSIC := "{gd}"\n', s)
p.write_text(s, encoding='utf-8')

# 4) README e LICENSE
lic_url = {'CC0': 'https://creativecommons.org/publicdomain/zero/1.0/', 'CC-BY 3.0': 'https://creativecommons.org/licenses/by/3.0/',
           'CC-BY 4.0': 'https://creativecommons.org/licenses/by/4.0/'}
md = 'Música dos chefes e do menu (ficheiros em `assets/audio/music/` e `godot/audio/music/`, de OpenGameArt.org):\n' + \
     ''.join(f"- {t['boss']} — “{t['title']}”, de {t['author']}, [{t['license']}]({lic_url[t['license']]}) — {t['url']}\n" for t in T) + \
     '\nAs faixas foram cortadas no início e no fim e o volume foi ajustado para o jogo.\n'
p = ROOT / 'README.md'; s = p.read_text(encoding='utf-8')
s = re.sub(r'Música dos chefes(?: e do menu)? \(ficheiros em.*?ajustado para o jogo\.\n', lambda m: md, s, flags=re.S)
p.write_text(s, encoding='utf-8')
files = ', '.join(f"{t['id']}.ogg" for t in T)
txt = ('A música dos chefes e do menu (assets/audio/music/ e godot/audio/music/: ' + files + ')\n'
       'também não está sob esta licença: é de outros autores e mantém a sua:\n' +
       ''.join(f"- \"{t['title']}\" — {t['author']}, {t['license']} ({t['url']})\n" for t in T) +
       '(obtidas em OpenGameArt.org; cortadas no início e no fim e com o volume ajustado)\n')
p = ROOT / 'LICENSE'; s = p.read_text(encoding='utf-8')
s = re.sub(r'A música dos chefes (?:e do menu )?.*?com o volume ajustado\)\n', lambda m: txt, s, flags=re.S)
p.write_text(s, encoding='utf-8')
for lang in heads:
    json.loads((ROOT / f'godot/data/lang_{lang}.json').read_text(encoding='utf-8'))
print(len(T), 'faixas:', ', '.join(t['id'] for t in T))
