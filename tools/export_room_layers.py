"""Grava, a partir do próprio jogo web, as camadas de cada sala para o Godot — o cenário fica igual ao do browser:
  rooms/<id>_tiles.png  (a cache de tiles da sala: Tiles.build)
  rooms/<id>_back.png   (parede de fundo dos interiores + construções + adereços: Deco.drawBackdrop/drawBack, sem chamas)
  rooms/<id>.json       (escala, chamas a animar, luzes, primeiro plano)
  bg/<regiao>_L<n>.png  + bg/<regiao>.json (os planos de paralaxe do fundo: BG.get(R).layers)
Uso: python3 tools/export_room_layers.py [prefixo das salas, por omissão r1_]"""
import base64, json, pathlib, sys
from playwright.sync_api import sync_playwright
ROOT = pathlib.Path(__file__).resolve().parents[1]
OUT = ROOT / 'godot' / 'art' / 'rooms'; OUT.mkdir(parents=True, exist_ok=True)
BGO = ROOT / 'godot' / 'art' / 'bglayers'; BGO.mkdir(parents=True, exist_ok=True)
PREFIX = sys.argv[1] if len(sys.argv) > 1 else 'r1_'

# as chamas dos adereços animam-se no Godot: aqui só se regista onde ficam (posição já transformada no mundo)
PATCH = r"""(src) => {
  const rec = `if (window.__rec) { const m = ctx.getTransform(); const k = window.__recK || 1;
      window.__rec.push({ t: 'flame', x: (m.a * x + m.c * y + m.e) / k, y: (m.b * x + m.d * y + m.f) / k, s: s * Math.hypot(m.a, m.b) / k, flip: m.a < 0, seed }); return; }`;
  const rec2 = `if (window.__rec) { const m = ctx.getTransform(); const k = window.__recK || 1;
      window.__rec.push({ t: 'fire', flames: flames.map((q) => [(m.a * q[0] + m.c * q[1] + m.e) / k, (m.b * q[0] + m.d * q[1] + m.f) / k, q[2] * Math.hypot(m.a, m.b) / k]), hk, seed }); return true; }`;
  let s2 = src.replace('function flame(ctx, x, y, s, time, seed) {', 'function flame(ctx, x, y, s, time, seed) {' + rec);
  s2 = s2.replace('function fireArt(ctx, flames, hk, time, seed) {', 'function fireArt(ctx, flames, hk, time, seed) {' + rec2);
  (0, eval)(s2);
  return s2 !== src;
}"""

JS = r"""async ([id, S]) => {
  const g = VS.App.game, U = VS.U, G = VS.Gfx;
  g.loadRoom(id, null);
  const room = g.room, R = room.R;
  const out = { id, pw: room.pw, ph: room.ph, S, region: R.key, interior: !!(R.interior || VS.ROOMS[id].interior) };
  // ---- tiles: a cache que o jogo usa
  VS.Tiles.invalidate(room);
  const tc = VS.Tiles.build(room) || room.tileCache;
  out.tiles = room.tileCache.canvas.toDataURL('image/png'); out.tileS = room.tileCache.s;
  // ---- fundo + adereços, à escala S, com a câmara a cobrir a sala inteira
  const vw = U.VIEW_W, vh = U.VIEW_H, cam0 = Object.assign({}, G.cam);
  U.VIEW_W = room.pw; U.VIEW_H = room.ph;
  Object.assign(G.cam, { x: 0, y: 0, sx: 0, sy: 0 });
  const cv = document.createElement('canvas'); cv.width = Math.ceil(room.pw * S); cv.height = Math.ceil(room.ph * S);
  const c = cv.getContext('2d'); c.imageSmoothingEnabled = true; c.setTransform(S, 0, 0, S, 0, 0);
  window.__rec = []; window.__recK = S;
  if (out.interior && !(VS.BG.hasRoomArt && VS.BG.hasRoomArt(id))) VS.Deco.drawBackdrop(c, room, R, G.cam);
  VS.Deco.drawBack(c, room, R, 0);
  out.back = cv.toDataURL('image/png');
  out.flames = window.__rec; window.__rec = null;
  // ---- luzes dos adereços
  G.beginLights(0.5, R.darkColor); VS.Deco.lights(room, R, 0); out.lights = G.lights.map((L) => ({ x: L.x, y: L.y, r: L.r, c: L.color, i: L.i, f: L.f }));
  // ---- primeiro plano (silhuetas em paralaxe 1.25)
  const d = VS.Deco.get(room); out.front = d.front || [];
  U.VIEW_W = vw; U.VIEW_H = vh; Object.assign(G.cam, cam0);
  out.dark = VS.ROOMS[id].dark !== undefined ? VS.ROOMS[id].dark : R.dark;
  return out;
}"""

BGJS = r"""(key) => {
  const R = VS.REGIONS[key]; const set = VS.BG.get(R);
  VS.BG.room = null; const art = VS.BG.artFor(R);
  return { key, LW: VS.BG.LW, LH: VS.BG.LH, art: art ? art.src.split('/').pop() : null, sky: R.sky, haze: R.haze, stoneDark: R.stoneDark,
    layers: set.layers.map((L) => ({ p: L.p, topRow: !!L.topRow, anim: !!L.anim, png: L.canvas.toDataURL('image/png'), w: L.canvas.width, h: L.canvas.height })) };
}"""

def png(path, data):
    path.write_bytes(base64.b64decode(data.split(',', 1)[1]))

import http.server, threading, functools
srv = http.server.ThreadingHTTPServer(('127.0.0.1', 8765), functools.partial(http.server.SimpleHTTPRequestHandler, directory=str(ROOT)))
srv.RequestHandlerClass.log_message = lambda *a: None
threading.Thread(target=srv.serve_forever, daemon=True).start()
with sync_playwright() as p:
    b = p.chromium.launch(args=['--autoplay-policy=no-user-gesture-required'])
    pg = b.new_page(viewport={'width': 1600, 'height': 900})
    pg.goto('http://127.0.0.1:8765/index.html?debug=1'); pg.wait_for_timeout(3000)
    print('deco corrigido:', pg.evaluate(PATCH, (ROOT / 'js/render/deco.js').read_text(encoding='utf-8')))
    pg.evaluate("() => { VS.App.newGame(0); }"); pg.wait_for_timeout(2500)
    pg.evaluate("() => { if (VS.UI.dlg) VS.UI.dlgEnd(-1); VS.App.game.cutscene = false; VS.App.game.script = null; }")
    ids = [k for k in pg.evaluate("() => Object.keys(VS.ROOMS)") if k.startswith(PREFIX)]
    regions = set()
    for rid in ids:
        o = pg.evaluate(JS, [rid, 4])
        png(OUT / f'{rid}_tiles.png', o.pop('tiles')); png(OUT / f'{rid}_back.png', o.pop('back'))
        (OUT / f'{rid}.json').write_text(json.dumps(o, ensure_ascii=False), encoding='utf-8')
        regions.add(o['region'])
        print(rid, o['pw'], o['ph'], 'chamas', len(o['flames']), 'luzes', len(o['lights']), 'frente', len(o['front']))
    for key in sorted(regions):
        o = pg.evaluate(BGJS, key)
        for i, L in enumerate(o['layers']):
            png(BGO / f'{key}_L{i}.png', L.pop('png'))
        (BGO / f'{key}.json').write_text(json.dumps(o, ensure_ascii=False), encoding='utf-8')
        print('fundo', key, o['art'], [(L['p'], L['topRow'], L['anim']) for L in o['layers']])
    b.close()
