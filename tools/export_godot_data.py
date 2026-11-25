"""Exporta os dados do jogo web (salas, folhas de sprites, textos, regiões, itens) para JSON lido pelo projeto Godot.
Uso: python3 tools/export_godot_data.py   → godot/data/*.json"""
import json, pathlib
from playwright.sync_api import sync_playwright
ROOT = pathlib.Path(__file__).resolve().parents[1]
OUT = ROOT / 'godot' / 'data'; OUT.mkdir(parents=True, exist_ok=True)
JS = r"""() => {
  const fnText = (k, v) => typeof v === 'function' ? ('fn:' + v.toString().slice(0, 300)) : v;
  const clean = (o) => JSON.parse(JSON.stringify(o, fnText));
  return {
    rooms: clean(VS.ROOMS), sprites: clean(VS.SPRITE_META), regions: clean(VS.REGIONS || {}), items: clean(VS.ITEMS || {}),
    lang_pt: clean(VS.LANG.pt || {}), lang_en: clean(VS.LANG.en || {}), lang_es: clean(VS.LANG.es || {}), lang_fr: clean(VS.LANG.fr || {}),
    props: clean(VS.PROP_META || {}), structs: clean(VS.STRUCT_META || {}),
    consts: { TILE: VS.U.TILE, CELL_W: VS.U.CELL_W, CELL_H: VS.U.CELL_H },
  };
}"""
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page()
    pg.goto((ROOT / 'index.html').as_uri() + '?debug=1'); pg.wait_for_timeout(2500)
    d = pg.evaluate(JS); b.close()
for k, v in d.items():
    (OUT / f'{k}.json').write_text(json.dumps(v, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
    print(k, len(v) if hasattr(v, '__len__') else '')
