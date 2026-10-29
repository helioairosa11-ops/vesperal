"""Amplia fotogramas escolhidos de uma folha do ateliê para inspeção (sem gravar assets)."""
import base64, json, pathlib, sys
from playwright.sync_api import sync_playwright
ART = pathlib.Path(__file__).resolve().parent
ROOT = ART.parents[1]
name = sys.argv[1]; picks = sys.argv[2:] or ['idle:0']
with sync_playwright() as pw:
    b = pw.chromium.launch(); pg = b.new_page()
    errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto((ART / 'atelier.html').as_uri()); pg.wait_for_function('document.title === "ready"')
    url = pg.evaluate('''([name, picks]) => {
      const r = ART.registry[name](); const m = r.meta, img = r.canvas;
      const fr = picks.map((p) => { const [an, fi] = p.split(':'); return m.frames[m.anims[an].frames[+fi]]; });
      // célula do tamanho do maior fotograma (âncora comum: pés/centro)
      let x0 = 0, x1 = 0, y0 = 0, y1 = 0;
      for (const f of fr) { x0 = Math.min(x0, f.ox); x1 = Math.max(x1, f.ox + f.w / m.scale); y0 = Math.min(y0, f.oy); y1 = Math.max(y1, f.oy + f.h / m.scale); }
      const k = 2, cw = (x1 - x0) * m.scale * k + 8, ch = (y1 - y0) * m.scale * k + 8;
      const cv = ART.mk(picks.length * cw, ch), c = cv.getContext('2d');
      c.fillStyle = '#3a3440'; c.fillRect(0, 0, cv.width, cv.height); c.imageSmoothingEnabled = false;
      fr.forEach((f, i) => { const ax = i * cw + 4 - x0 * m.scale * k, ay = 4 - y0 * m.scale * k; c.drawImage(img, f.x, f.y, f.w, f.h, ax + f.ox * m.scale * k, ay + f.oy * m.scale * k, f.w * k, f.h * k); });
      return cv.toDataURL(); }''', [name, picks])
    (ROOT / 'tests/out/art' / f'{name}_zoom.png').write_bytes(base64.b64decode(url.split(',')[1]))
    print(errs)
    b.close()
