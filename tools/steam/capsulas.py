"""Imagens da página da Steam desenhadas com a arte do próprio jogo (fundo da Cidade de Cinza em alta resolução,
a protagonista a descansar junto ao braseiro, o título em Cinzel).
Uso: python3 tools/steam/capsulas.py PASTA_DE_SAÍDA        (precisa do Playwright com o Chromium)"""
import sys, base64, pathlib
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parents[2]


def serve():
    """servidor local (a mesma origem para a página e para as imagens: sem isto a tela fica 'manchada' e não se exporta)"""
    import http.server, threading, functools
    class Quiet(http.server.SimpleHTTPRequestHandler):
        def log_message(self, *a):
            pass
    h = functools.partial(Quiet, directory=str(ROOT))
    srv = http.server.ThreadingHTTPServer(('127.0.0.1', 0), h)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    return srv, f'http://127.0.0.1:{srv.server_address[1]}/index.html?debug=1'

JS = r"""
window.capsula = async function (W, H, o) {
  o = o || {};
  const U = VS.U, R = VS.REGIONS.r1, LW = 960, LH = 360;
  await document.fonts.load('700 40px Cinzel'); await document.fonts.load('600 20px Cinzel');
  // faixas do fundo desenhadas à escala desta imagem (nítidas mesmo a 3840 px)
  const zoom = o.zoom || 1, k = H / LH * zoom;
  const layers = []; VS.BG.STYLES[R.bg](R, layers);
  const rnd = U.rng(U.hash(R.key + 'bg'));
  const strips = layers.map((L) => { const c = document.createElement('canvas'); c.width = Math.round(LW * k); c.height = Math.round(LH * k); const x = c.getContext('2d'); x.scale(c.width / LW, c.height / LH); L.draw(x, rnd); return { c, p: L.p }; });
  const out = document.createElement('canvas'); out.width = W; out.height = H; const c = out.getContext('2d');
  if (!o.transparent) {
    const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, R.sky[0]); g.addColorStop(0.6, R.sky[1]); g.addColorStop(1, R.sky[2]); c.fillStyle = g; c.fillRect(0, 0, W, H);
    const top = H - LH * k + (o.dy || 0) * k, cam = o.cam || 0, x0 = (o.x0 || 0);
    for (const { c: s, p } of strips) { let ox = -(((cam * p + x0) % LW) + LW) % LW * k; for (let x = ox - LW * k; x < W; x += LW * k) c.drawImage(s, x, top); }
    // chão escuro, braseiro e a protagonista a descansar junto ao fogo
    if (o.hero !== false) {
      const gy = H - (o.ground || 30) * k, hx = (o.heroX !== undefined ? o.heroX : 0.62) * W, s = k * (o.heroScale || 1);
      const fg = c.createLinearGradient(0, gy - 6 * k, 0, H); fg.addColorStop(0, '#15100f'); fg.addColorStop(1, '#050404');
      c.fillStyle = fg; c.beginPath(); c.moveTo(0, gy + 4 * k); for (let x = 0; x <= W; x += 16 * k) c.lineTo(x, gy + Math.sin(x / k * 0.07) * 1.6 * k); c.lineTo(W, H); c.lineTo(0, H); c.closePath(); c.fill();
      const bx = hx + 36 * s, by = gy - 14 * s;
      const glow = (x, y, r, col, a) => { const gg = c.createRadialGradient(x, y, 0, x, y, r); gg.addColorStop(0, U.rgba(col, a)); gg.addColorStop(1, U.rgba(col, 0)); c.fillStyle = gg; c.fillRect(x - r, y - r, r * 2, r * 2); };
      c.save(); c.globalCompositeOperation = 'lighter'; glow(bx, by - 8 * s, 170 * s, '#ff8c3c', 0.42); c.restore();
      c.fillStyle = '#1c1614'; c.beginPath(); c.moveTo(bx - 7 * s, gy + 2 * s); c.lineTo(bx - 3 * s, by + 6 * s); c.lineTo(bx + 3 * s, by + 6 * s); c.lineTo(bx + 7 * s, gy + 2 * s); c.fill();
      c.fillStyle = '#2a221e'; c.beginPath(); c.moveTo(bx - 16 * s, by - 2 * s); c.quadraticCurveTo(bx, by + 10 * s, bx + 16 * s, by - 2 * s); c.lineTo(bx + 13 * s, by + 2 * s); c.quadraticCurveTo(bx, by + 8 * s, bx - 13 * s, by + 2 * s); c.fill();
      c.save(); c.globalCompositeOperation = 'lighter';
      const fgr = c.createLinearGradient(0, by, 0, by - 22 * s); fgr.addColorStop(0, 'rgba(255,110,30,0.75)'); fgr.addColorStop(0.45, 'rgba(255,150,50,0.55)'); fgr.addColorStop(1, 'rgba(255,200,120,0)'); c.fillStyle = fgr;
      for (let i = 0; i < 9; i++) { const k2 = i / 8, fx = bx + (-9 + k2 * 18) * s, hh = (10 + 10 * Math.sin(k2 * Math.PI)) * (0.85 + 0.2 * Math.sin(i * 1.9)) * s, sway = Math.sin(i) * 2.4 * s, w = (2.6 + Math.sin(k2 * Math.PI) * 1.4) * s;
        c.beginPath(); c.moveTo(fx - w, by); c.quadraticCurveTo(fx - w * 1.1, by - hh * 0.45, fx + sway, by - hh); c.quadraticCurveTo(fx + w * 1.1, by - hh * 0.45, fx + w, by); c.fill(); }
      glow(bx, by - 6 * s, 12 * s, '#fff0c8', 0.6); glow(bx, by - 6 * s, 54 * s, '#ff7a30', 0.3);
      c.restore();
      const sh = VS.Assets.sheet('hero');
      if (sh && VS.Assets.ok(sh.img)) { const f = VS.Assets.frame(sh, 'rest', 0); c.save(); c.translate(hx, gy + 1 * s); c.scale(2.1 * s, 2.1 * s); VS.Assets.drawFrame(c, sh, f); c.restore(); }
    }
    if (o.vignette !== false) { const v = c.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.3, W / 2, H / 2, Math.max(W, H) * 0.75); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.55)'); c.fillStyle = v; c.fillRect(0, 0, W, H); }
    if (o.topShade) { const tg = c.createLinearGradient(0, 0, 0, H * o.topShade); tg.addColorStop(0, 'rgba(5,4,6,0.85)'); tg.addColorStop(1, 'rgba(5,4,6,0)'); c.fillStyle = tg; c.fillRect(0, 0, W, H * o.topShade); }
    if (o.shade) { const sg = c.createLinearGradient(0, 0, W * o.shade, 0); sg.addColorStop(0, 'rgba(5,4,6,0.72)'); sg.addColorStop(1, 'rgba(5,4,6,0)'); c.fillStyle = sg; c.fillRect(0, 0, W * o.shade, H); }
  }
  // título
  if (o.title) {
    const T = o.title, y = T.y * H; let size = T.size * H, x = T.x * W;
    c.save(); c.textAlign = 'center'; c.textBaseline = 'alphabetic';
    const setF = () => { c.font = `700 ${size}px Cinzel`; c.letterSpacing = (size * 0.16) + 'px'; };
    setF(); let tw = c.measureText('VESPERAL').width;
    // cabe sempre, com margem (o espaçamento entre letras deixa um espaço a mais no fim: compensa-se)
    const maxW = W * (T.maxW || 0.88); if (tw > maxW) { size *= maxW / tw; setF(); tw = c.measureText('VESPERAL').width; }
    const m = W * 0.05; x = Math.min(W - m - tw / 2, Math.max(m + tw / 2, x)) + size * 0.08;
    const g = c.createLinearGradient(0, y - size, 0, y + size * 0.1); g.addColorStop(0, '#fffaf0'); g.addColorStop(0.38, '#f2dcae'); g.addColorStop(0.66, '#c89a52'); g.addColorStop(1, '#fbe7bf');
    c.shadowColor = 'rgba(255,120,50,0.35)'; c.shadowBlur = size * 0.25; c.fillStyle = '#000'; c.fillText('VESPERAL', x, y + size * 0.03);
    c.shadowBlur = 0; c.shadowColor = 'transparent'; c.fillStyle = g; c.fillText('VESPERAL', x, y);
    if (T.sub !== false) {
      const ss = size * 0.24; c.font = `600 ${ss}px Cinzel`; c.letterSpacing = (ss * 0.42) + 'px'; c.fillStyle = '#e4a65e';
      c.shadowColor = 'rgba(255,120,50,0.5)'; c.shadowBlur = ss * 0.6; c.fillText(T.sub || 'A ÚLTIMA CHAMA', x + ss * 0.21 - size * 0.08, y + size * 0.62);
      // ornamento ◆ entre linhas
      c.shadowBlur = 0; c.strokeStyle = 'rgba(228,166,94,0.6)'; c.lineWidth = Math.max(1, size * 0.02);
      const ow = size * 2.6, oy = y + size * 0.26, ox = x - size * 0.08;
      c.beginPath(); c.moveTo(ox - ow / 2, oy); c.lineTo(ox - size * 0.1, oy); c.moveTo(ox + size * 0.1, oy); c.lineTo(ox + ow / 2, oy); c.stroke();
      c.fillStyle = '#e4a65e'; c.beginPath(); c.moveTo(ox, oy - size * 0.06); c.lineTo(ox + size * 0.06, oy); c.lineTo(ox, oy + size * 0.06); c.lineTo(ox - size * 0.06, oy); c.closePath(); c.fill();
    }
    c.restore();
  }
  return out.toDataURL(o.jpg ? 'image/jpeg' : 'image/png', 0.92);
};
"""

# (nome, largura, altura, opções) — tamanhos pedidos pela Steam (partner.steamgames.com/doc/store/assets)
IMAGES = [
    ('capsula_cabecalho_920x430', 920, 430, {'cam': 120, 'zoom': 1.0, 'heroX': 0.7, 'shade': 0.6, 'title': {'size': 0.2, 'x': 0.31, 'y': 0.47}}),
    ('capsula_pequena_462x174', 462, 174, {'cam': 120, 'zoom': 1.0, 'hero': False, 'shade': 0.7, 'title': {'size': 0.3, 'x': 0.5, 'y': 0.52, 'sub': False}}),
    ('capsula_principal_1232x706', 1232, 706, {'cam': 120, 'zoom': 1.0, 'heroX': 0.66, 'shade': 0.55, 'title': {'size': 0.15, 'x': 0.3, 'y': 0.36}}),
    ('capsula_vertical_748x896', 748, 896, {'cam': 0, 'x0': 0, 'dy': 40, 'zoom': 1.1, 'heroX': 0.4, 'heroScale': 0.85, 'topShade': 0.42, 'title': {'size': 0.085, 'x': 0.5, 'y': 0.13}}),
    ('biblioteca_capsula_600x900', 600, 900, {'cam': 0, 'x0': 10, 'dy': 50, 'zoom': 1.15, 'heroX': 0.36, 'heroScale': 0.85, 'topShade': 0.42, 'title': {'size': 0.07, 'x': 0.5, 'y': 0.12}}),
    ('biblioteca_heroi_3840x1240', 3840, 1240, {'cam': 120, 'x0': -60, 'zoom': 1.0, 'heroX': 0.56}),
    ('biblioteca_cabecalho_920x430', 920, 430, {'cam': 120, 'zoom': 1.0, 'heroX': 0.7, 'shade': 0.6, 'title': {'size': 0.2, 'x': 0.31, 'y': 0.47}}),
    ('biblioteca_logotipo_1280x720', 1280, 720, {'transparent': True, 'title': {'size': 0.3, 'x': 0.5, 'y': 0.52}}),
    ('fundo_da_pagina_1438x810', 1438, 810, {'cam': 900, 'zoom': 1.0, 'hero': False}),
    ('capa_de_evento_800x450', 800, 450, {'cam': 120, 'zoom': 1.0, 'heroX': 0.68, 'shade': 0.55, 'title': {'size': 0.17, 'x': 0.32, 'y': 0.45}}),
]


def main(out):
    out = pathlib.Path(out); out.mkdir(parents=True, exist_ok=True)
    srv, url = serve()
    with sync_playwright() as pw:
        b = pw.chromium.launch()
        pg = b.new_page(viewport={'width': 1280, 'height': 720})
        pg.goto(url); pg.wait_for_function('window.VS && VS.App && VS.App.mode === "menu"', timeout=20000)
        pg.wait_for_function('VS.Assets.sheet("hero") && VS.Assets.ok(VS.Assets.sheet("hero").img)', timeout=20000)
        pg.add_script_tag(content=JS)  # (um evaluate chamaria a função logo, sem argumentos)
        for name, w, h, o in IMAGES:
            data = pg.evaluate('([w, h, o]) => capsula(w, h, o)', [w, h, o])
            (out / f'{name}.png').write_bytes(base64.b64decode(data.split(',', 1)[1]))
            print(name, flush=True)
        # ícone da aplicação 184×184 (jpg) e ícone do atalho 256×256 (png), a partir do ícone do jogo
        from PIL import Image
        ic = Image.open(ROOT / 'desktop' / 'build' / 'icon.png').convert('RGBA')
        ic.resize((256, 256), Image.LANCZOS).save(out / 'icone_atalho_256x256.png')
        bg = Image.new('RGB', (184, 184), (10, 8, 10)); s = ic.resize((184, 184), Image.LANCZOS); bg.paste(s, (0, 0), s); bg.save(out / 'icone_aplicacao_184x184.jpg', quality=92)
        b.close()


if __name__ == '__main__':
    main(sys.argv[1] if len(sys.argv) > 1 else str(ROOT / 'tests' / 'out' / 'steam'))
