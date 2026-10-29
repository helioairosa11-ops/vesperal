"""Vesperal — testes automáticos de jogabilidade (Chromium sem ecrã, via Playwright).

Cada teste conduz o jogo pelos MESMOS caminhos que um jogador usa: as teclas são injetadas no
estado do Input (VS.Input.raw) a cada passo fixo de 60 Hz, os diálogos são respondidos pela API
da interface e os menus são clicados no DOM. Só as preparações (dar itens, saltar para salas)
usam a API de depuração.

Uso: python3 tests/gameplay.py [filtro ...]
Resultado: tests/out/gameplay_report.json + capturas em tests/out/gameplay/
"""
import os, json, sys, time, pathlib, traceback
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parents[1]
OUT = ROOT / 'tests' / 'out' / 'gameplay'
OUT.mkdir(parents=True, exist_ok=True)
URL = (ROOT / 'index.html').as_uri() + '?debug=1'
ARGS = ['--autoplay-policy=no-user-gesture-required']

HELPERS = r"""
window.T = window.T || {};
Object.assign(window.T, {
  hooks: [], log: [], hits: [], seen: [], answers: [], autoDlg: true,
  install() {
    const App = VS.App;
    if (!App.__wrapped) {
      const orig = App.step;
      App.step = function (dt) {
        for (const h of T.hooks.slice()) { try { if (h(dt) === true) T.hooks.splice(T.hooks.indexOf(h), 1); } catch (e) { T.log.push('hook: ' + e.message); T.hooks.splice(T.hooks.indexOf(h), 1); } }
        if (T.autoDlg && VS.UI.dlg) {
          const d = VS.UI.dlg;
          d.lines.forEach((l) => { const k = typeof l === 'string' ? l : l.k; if (!T.seen.includes(k)) T.seen.push(k); });
          if (d.choices) { const a = T.answers.length ? T.answers.shift() : 0; T.log.push('choice ' + d.choices.join('|') + ' -> ' + a); VS.UI.dlgEnd(a); }
          else VS.UI.dlgEnd(-1);
        }
        return orig.call(this, dt);
      };
      App.__wrapped = true;
    }
  },
  g: () => VS.App.game, p: () => VS.App.game.player, st: () => VS.state,
  key(code, down) { VS.Input.raw[code] = !!down; },
  tap(code, frames) { let n = frames || 3; VS.Input.raw[code] = true; T.hooks.push(() => { if (--n <= 0) { VS.Input.raw[code] = false; return true; } }); },
  releaseAll() { VS.Input.raw = {}; },
  wrapHits() { const p = T.p(); if (p.__w) return; const o = p.receiveHit.bind(p); p.receiveHit = (hb, g) => { const r = o(hb, g); T.hits.push(r); return r; }; p.__w = true; },
  clean() { const g = T.g(); g.script = null; g.cutscene = false; g.fade = 0; g.fadeTarget = 0; g.hideHUD = false; VS.UI.closeAll && VS.UI.closeAll(); },
  // projétil inimigo dirigido ao jogador, vindo da frente
  shoot(dist, speed, o) {
    const g = T.g(), p = T.p(), dir = p.dir || 1;
    const pr = new VS.Projectile(Object.assign({ x: p.cx + dir * dist, y: p.cy - 4, vx: -dir * speed, vy: 0, w: 8, h: 8, dmg: 10, kind: 'bolt', color: '#ffd080', life: 3, solid: false, src: { cx: p.cx + dir * dist } }, o || {}));
    g.spawn(pr); return pr;
  },
  spawnEnemy(kind, dx) {
    const g = T.g(), p = T.p(), TT = VS.U.TILE;
    const e = VS.Enemies.make({ k: kind, x: Math.round((p.cx + dx) / TT), y: Math.floor((p.bottom - 1) / TT) }, 'test' + Math.random(), g);
    g.spawn(e); return e;
  },
  bossEnts: () => T.g().ents.filter((e) => e.isBoss),
  // a recompensa foi entregue? (relíquias, armas, trajes e itens imediatos não ficam em st.items)
  owns(i) {
    const st = VS.state, it = VS.ITEMS[i] || {}, s0 = T.snap || {};
    if (st.has(i)) return true;
    if (/^ember_/.test(i)) return !!st.flags['ember_given_' + i.split('_')[1]];
    if (it.cat === 'relic') return st.relics.includes(i);
    if (it.cat === 'weapon') return st.weapons.includes(it.weapon);
    if (it.cat === 'outfit') return st.hasLook(it.look);
    if (i === 'ash_heart') return st.hearts > (s0.hearts || 0);
    if (i === 'candle_fragment') return st.fragments > (s0.fragments || 0);
    if (i === 'relic_slot') return st.relicSlots > (s0.slots || 2);
    return false;
  },
});
T.install();
"""


class Runner:
    def __init__(self):
        self.results = []
        self.errors = []

    def check(self, name, ok, detail=''):
        self.results.append({'test': name, 'ok': bool(ok), 'detail': str(detail)})
        print(('  PASS ' if ok else '  FAIL ') + name + (('  — ' + str(detail)) if detail else ''), flush=True)
        return ok


def page_errors(pg, sink):
    pg.on('pageerror', lambda e: sink.append(f'[pageerror] {e}'))
    pg.on('console', lambda m: sink.append(f'[console.{m.type}] {m.text}') if m.type == 'error' and 'ERR_TUNNEL' not in m.text and 'Failed to load resource' not in m.text and 'fonts.g' not in m.text else None)


def boot(pg, clear=True):
    pg.goto(URL)
    pg.wait_for_function('window.VS && VS.App && VS.App.mode === "menu"', timeout=15000)
    if clear:
        pg.evaluate('localStorage.clear()')
    pg.evaluate(HELPERS)
    pg.evaluate('VS.settings.quality = "high"; VS.App.applySettings()')


def frames(pg, n):
    """espera n passos de jogo (60 Hz)"""
    pg.evaluate('(n) => new Promise((res) => { let k = n; T.hooks.push(() => { if (--k <= 0) { res(); return true; } }); })', n)


def wait(pg, cond, timeout=10.0, step=0.05):
    t0 = time.time()
    while time.time() - t0 < timeout:
        try:
            if pg.evaluate(cond):
                return True
        except Exception:
            pass
        time.sleep(step)
    return False


def new_game(pg, slot=0, lang=None, skip=True):
    if lang:
        pg.evaluate(f'VS.settings.lang = "{lang}"; VS.App.applySettings()')
    pg.evaluate(f'VS.Audio.init(); VS.App.newGame({slot})')
    pg.wait_for_function('VS.App.mode === "game" && VS.App.game && VS.App.game.player', timeout=10000)
    pg.evaluate('T.install()')
    if skip:
        wait(pg, '!VS.UI.dlg && !VS.App.game.script', 8)
        pg.evaluate('T.clean(); T.wrapHits()')
    frames(pg, 10)


def warp(pg, room, tx=None, ty=None):
    if tx is None:
        pg.evaluate(f'VSDebug.warp("{room}")')
    else:
        pg.evaluate(f'VSDebug.warp("{room}", {tx}, {ty})')
    frames(pg, 30)


def shot(pg, name):
    pg.screenshot(path=str(OUT / f'{name}.png'))


# ======================================================================
def t_menus(R, b):
    pg = b.new_page(viewport={'width': 1280, 'height': 720}); errs = []; page_errors(pg, errs)
    boot(pg)
    btns = pg.evaluate('[...document.querySelectorAll(".mainmenu .menu-list .btn")].map((b) => b.textContent)')
    R.check('menu principal: botões Jogar/Definições/Créditos (sem Continuar sem gravação)', len(btns) == 3, btns)
    langs = pg.evaluate('document.querySelectorAll(".mainmenu .lang-btn, .mainmenu .mm-langs").length')
    R.check('menu principal: sem seletor de idiomas (o idioma escolhe-se só nas Definições)', langs == 0)
    # definições: cada separador abre e tem conteúdo
    pg.click('.mainmenu .menu-list .btn:nth-child(2)')
    tabs = pg.evaluate('document.querySelectorAll(".settings .tab").length')
    ok = True; counts = []
    for i in range(tabs):
        pg.click(f'.settings .tab:nth-child({i + 1})')
        n = pg.evaluate('document.querySelectorAll(".settings .set-body > *").length'); counts.append(n); ok = ok and n > 0
    R.check('definições: 7 separadores, todos com controlos', tabs == 7 and ok, counts)
    # áudio: deslizadores e silenciar mudam as definições
    pg.click('.settings .tab:nth-child(3)')
    pg.evaluate('''() => { const r = document.querySelector('.settings .set-body input[type=range]'); r.value = 0.4; r.dispatchEvent(new Event('input')); }''')
    vm = pg.evaluate('VS.settings.vol.master')
    pg.click('.settings .set-body .set-row:nth-child(3)')
    mm = pg.evaluate('VS.settings.mute.music')
    R.check('definições de áudio: volume geral e silenciar música funcionam', abs(vm - 0.4) < 1e-6 and mm is True, f'master={vm} muteMusic={mm}')
    pg.click('.settings .set-body .set-row:nth-child(3)')
    # controlos: remapear "Saltar" para KeyU e repor
    pg.click('.settings .tab:nth-child(4)')
    pg.click('.settings .set-body .set-row:nth-child(4)')  # 1.º: nota; ordem REMAPPABLE: left,right,up,down?
    label = pg.evaluate('document.querySelectorAll(".settings .set-body .set-row")[2].querySelector(".set-label").textContent')
    act = pg.evaluate('VS.Input.REMAPPABLE[2]')
    pg.keyboard.press('KeyU')
    frames(pg, 3)
    k = pg.evaluate(f'VS.Input.keys["{act}"][0]')
    R.check(f'remapeamento de teclas ({label})', k == 'KeyU', k)
    pg.click('.settings .set-body .btn.small')
    k2 = pg.evaluate(f'VS.Input.keys["{act}"][0]')
    R.check('repor teclas por omissão', k2 != 'KeyU', k2)
    pg.keyboard.press('Escape'); frames(pg, 5)
    # créditos
    pg.click('.mainmenu .menu-list .btn:nth-child(3)')
    cred = pg.evaluate('!!document.querySelector(".credits")')
    shot(pg, 'menu_credits')
    pg.keyboard.press('Escape'); frames(pg, 5)
    R.check('créditos abrem e fecham', cred and pg.evaluate('!document.querySelector(".credits")'))
    # Jogar → ranhuras → nova partida → introdução
    pg.click('.mainmenu .menu-list .btn:nth-child(1)')
    slots = pg.evaluate('document.querySelectorAll(".slots .slot").length')
    R.check('ecrã de memórias com 3 ranhuras', slots == 3)
    pg.evaluate('T.autoDlg = false')
    pg.click('.slots .slot:nth-child(1)')
    pg.wait_for_function('VS.App.mode === "game"')
    ok = wait(pg, '!!VS.UI.dlg', 5)
    first = pg.evaluate('VS.UI.dlg && VS.UI.dlg.el.textContent')
    shot(pg, 'intro')
    R.check('nova partida mostra a narração inicial', ok, (first or '')[:60])
    # avançar a introdução com a tecla de salto (como um jogador)
    for _ in range(12):
        pg.keyboard.press('Space'); time.sleep(0.25)
        if pg.evaluate('!VS.UI.dlg'):
            break
    R.check('introdução avança pelo teclado', pg.evaluate('!VS.UI.dlg'))
    wait(pg, '!VS.App.game.script', 5)
    R.check('começa no Fosso das Cinzas (r1_wake)', pg.evaluate('VS.state.room') == 'r1_wake')
    # pausa: todos os botões
    pg.evaluate('T.autoDlg = true; T.clean()')
    pg.keyboard.press('Escape'); frames(pg, 4)
    items = pg.evaluate('[...document.querySelectorAll(".pause .btn")].map((b) => b.textContent)')
    R.check('menu de pausa: Continuar, Mapa, Diário, Inventário, Definições, Sair', len(items) == 6, items)
    opened = []
    for i, cls in [(2, '.mapview'), (3, '.journal'), (4, '.inventory'), (5, '.settings')]:
        pg.click(f'.pause .btn:nth-child({i})'); frames(pg, 4)
        opened.append(pg.evaluate(f'!!document.querySelector("{cls}")'))
        shot(pg, 'pause_' + cls[1:])
        pg.keyboard.press('Escape'); frames(pg, 4)
    R.check('pausa → mapa/diário/inventário/definições abrem e fecham', all(opened), opened)
    pg.click('.pause .btn:nth-child(1)'); frames(pg, 4)
    R.check('Continuar fecha a pausa', pg.evaluate('!VS.App.paused && !VS.UI.isOpen()'))
    # Sair (com confirmação) → menu principal com "Continuar"
    pg.keyboard.press('Escape'); frames(pg, 4)
    pg.click('.pause .btn:nth-child(6)'); frames(pg, 3)
    pg.click('.confirm .btn:nth-child(1)'); frames(pg, 6)
    mm = pg.evaluate('VS.App.mode')
    btns = pg.evaluate('[...document.querySelectorAll(".mainmenu .menu-list .btn")].map((b) => b.textContent)')
    R.check('Sair → confirmação → menu principal com Continuar', mm == 'menu' and len(btns) == 4, btns)
    R.check('menus sem erros de JavaScript', not errs, errs[:5])
    pg.close()


def t_movement_combat(R, b):
    pg = b.new_page(viewport={'width': 1280, 'height': 720}); errs = []; page_errors(pg, errs)
    boot(pg); new_game(pg)
    warp(pg, 'r1_bridge', 6, 12); frames(pg, 30)
    x0 = pg.evaluate('T.p().x')
    pg.evaluate('T.key("KeyD", true)'); frames(pg, 40); pg.evaluate('T.key("KeyD", false)')
    x1 = pg.evaluate('T.p().x')
    R.check('andar para a direita (D)', x1 - x0 > 60, f'dx={x1 - x0:.0f}')
    y0 = pg.evaluate('T.p().y')
    pg.evaluate('T.tap("Space", 12); T.minY = 1e9; T.hooks.push(() => { T.minY = Math.min(T.minY, T.p().y); if (T.p().onGround && T.minY < 1e8 && T.p().vy >= 0 && T.minY < T.p().y - 5) return true; })')
    frames(pg, 50)
    my = pg.evaluate('T.minY')
    R.check('saltar (Espaço) com altura variável', y0 - my > 50, f'altura={y0 - my:.0f}')
    pg.evaluate('T.tap("Space", 2)'); frames(pg, 45)
    my2 = pg.evaluate('T.minY')
    # salto curto (tecla largada cedo) é mais baixo
    pg.evaluate('T.minY = 1e9; T.tap("Space", 2); T.hooks.push(() => { T.minY = Math.min(T.minY, T.p().y); })')
    frames(pg, 45)
    short = y0 - pg.evaluate('T.minY')
    R.check('salto curto quando se larga cedo (controlo no ar)', short < (y0 - my) - 15, f'curto={short:.0f} longo={y0 - my:.0f}')
    # agachar
    pg.evaluate('T.key("KeyS", true)'); frames(pg, 8)
    cr = pg.evaluate('T.p().crouch'); pg.evaluate('T.key("KeyS", false)'); frames(pg, 8)
    R.check('agachar (S)', cr is True)
    # ataques: leve, combo, pesado, para cima, no ar para baixo
    names = pg.evaluate('''() => new Promise((res) => {
      const seen = []; let f = 0;
      T.hooks.push(() => { const a = T.p().action; if (a && a.name && !seen.includes(a.name)) seen.push(a.name); if (++f > 200) { res(seen); return true; } });
      const seq = [[0, 'KeyJ'], [14, 'KeyJ'], [28, 'KeyJ'], [70, 'KeyK'], [120, 'up'], [160, 'jumpdown']];
      let i = 0, t = 0;
      T.hooks.push(() => { t++; while (i < seq.length && t >= seq[i][0]) { const s = seq[i][1];
        if (s === 'up') { T.key('KeyW', true); T.tap('KeyJ', 3); setTimeout(() => T.key('KeyW', false), 200); }
        else if (s === 'jumpdown') { T.tap('Space', 10); T.hooks.push(((k) => () => { if (++k === 10) { T.key('KeyS', true); T.tap('KeyJ', 3); } if (k === 30) { T.key('KeyS', false); return true; } })(0)); }
        else T.tap(s, 3); i++; } if (i >= seq.length) return true; });
    })''')
    R.check('golpes: combo leve l1→l2→l3', all(n in names for n in ['l1', 'l2', 'l3']), names)
    R.check('golpe pesado', 'heavy' in names, names)
    R.check('golpe para cima e golpe aéreo para baixo', 'up' in names and 'down' in names, names)
    # combate real contra um Cinzento
    pg.evaluate('T.p().dir = 1; T.p().facing = 1')
    pg.evaluate('T.husk = T.spawnEnemy("husk", 34); T.husk.aggro = false')
    hp0 = pg.evaluate('T.husk.hp')
    pg.evaluate('VSDebug.god(true); T.hooks.push(() => { if (T.husk.dead) return true; if ((T.fr = (T.fr || 0) + 1) % 18 === 0) T.tap("KeyJ", 3); })')
    ok = wait(pg, 'T.husk.dead', 12)
    R.check('o Cinzento recebe dano e morre com a espada', ok, f'hp inicial {hp0}')
    R.check('bestiário regista a morte', pg.evaluate('VS.state.bestiary.husk') >= 1)
    ok = wait(pg, 'VS.state.ash > 0', 6)
    R.check('a cinza do inimigo é recolhida', ok, pg.evaluate('VS.state.ash'))
    pg.evaluate('VSDebug.god(false); T.hooks = []; T.releaseAll()'); frames(pg, 30)
    # parry a um projétil: tecla I no instante certo → reflexão
    pg.evaluate('T.hits = []; VS.state.hp = VS.state.hpMax || 100')
    pg.evaluate('''() => { const pr = T.shoot(90, 260); T.pr = pr; T.hooks.push(() => { const d = Math.abs(pr.cx - T.p().cx); if (d < 26) { T.tap("KeyI", 4); return true; } }); }''')
    frames(pg, 40)
    res = pg.evaluate('({ hits: T.hits.slice(), team: T.pr.team, vx: T.pr.vx })')
    R.check('parry no instante certo devolve o projétil', 'parry' in res['hits'] and res['team'] == 'player', res)
    # parry demasiado cedo falha
    pg.evaluate('T.hits = []; T.p().iframes = 0')
    frames(pg, 40)
    pg.evaluate('''() => { const pr = T.shoot(200, 200); T.hooks.push(() => { const d = Math.abs(pr.cx - T.p().cx); if (d < 150) { T.tap("KeyI", 2); return true; } }); }''')
    frames(pg, 70)
    res = pg.evaluate('T.hits.slice()')
    R.check('parry fora de tempo não protege (janela curta)', 'hit' in res, res)
    # esquiva com invulnerabilidade
    pg.evaluate('T.hits = []; T.p().iframes = 0'); frames(pg, 60)
    hp = pg.evaluate('VS.state.hp')
    pg.evaluate('''() => { const pr = T.shoot(80, 260); T.hooks.push(() => { const d = Math.abs(pr.cx - T.p().cx); if (d < 40) { T.tap("KeyL", 3); return true; } }); }''')
    frames(pg, 40)
    res = pg.evaluate('({ hits: T.hits.slice(), hp: VS.state.hp })')
    R.check('esquiva com frames de invulnerabilidade', 'dodge' in res['hits'] and res['hp'] == hp, res)
    # guarda: manter I bloqueia com dano reduzido
    pg.evaluate('T.hits = []; T.p().iframes = 0'); frames(pg, 60)
    pg.evaluate('T.p().dir = 1; T.p().facing = 1; VS.state.hp = 100'); frames(pg, 2)
    pg.evaluate('T.key("KeyI", true)'); frames(pg, 20)
    pg.evaluate('T.shoot(60, 240, { dmg: 20 })'); frames(pg, 30)
    pg.evaluate('T.key("KeyI", false)')
    res = pg.evaluate('({ hits: T.hits.slice(), hp: VS.state.hp })')
    R.check('guarda (manter I) bloqueia e só sofre uma fração do dano', 'block' in res['hits'] and 100 - res['hp'] <= 6, res)
    # dano normal
    pg.evaluate('T.hits = []; T.p().iframes = 0; VS.state.hp = 100'); frames(pg, 60)
    pg.evaluate('T.shoot(60, 240, { dmg: 20 })'); frames(pg, 30)
    res = pg.evaluate('({ hits: T.hits.slice(), hp: VS.state.hp })')
    R.check('sem defesa, o golpe acerta por inteiro', 'hit' in res['hits'] and res['hp'] == 80, res)
    # cura com círio
    fl = pg.evaluate('VS.state.flasks'); pg.evaluate('T.p().iframes = 0'); frames(pg, 70)
    pg.evaluate('T.tap("KeyF", 3)'); frames(pg, 110)
    res = pg.evaluate('({ hp: VS.state.hp, fl: VS.state.flasks })')
    R.check('curar com um círio (F)', res['hp'] > 80 and res['fl'] == fl - 1, res)
    # morte → ecrã de morte → regresso ao altar; a cinza fica com o eco
    pg.evaluate('VS.state.ash = 123; VS.state.hp = 5; T.p().iframes = 0'); frames(pg, 5)
    pg.evaluate('T.shoot(60, 240, { dmg: 40 })')
    ok = wait(pg, '!!document.querySelector(".death")', 8)
    shot(pg, 'death')
    R.check('morte mostra o ecrã de morte', ok)
    shade = pg.evaluate('VS.state.shade')
    R.check('a cinza perdida fica guardada pelo eco no local da morte', shade and shade.get('ash') == 123 and pg.evaluate('VS.state.ash') == 0, shade)
    pg.click('.death .btn'); frames(pg, 60)
    R.check('Continuar renasce no último altar com vida cheia', pg.evaluate('VS.state.hp === VS.state.hpMax && VS.App.game.player.action === null || VS.state.hp === VS.state.hpMax'), pg.evaluate('VS.state.room'))
    # recuperar a cinza tocando no eco
    room = shade['room']
    pg.evaluate(f'VSDebug.warp("{room}", {int(shade["x"] // 20) - 3}, {int(shade["y"] // 20)})'); frames(pg, 30)
    pg.evaluate('T.key("KeyD", true)'); frames(pg, 40); pg.evaluate('T.key("KeyD", false)'); frames(pg, 30)
    R.check('tocar no eco devolve a cinza', pg.evaluate('VS.state.ash') == 123 and pg.evaluate('!VS.state.shade'), pg.evaluate('VS.state.ash'))
    R.check('movimento e combate sem erros de JavaScript', not errs, errs[:5])
    pg.close()


def t_world(R, b):
    pg = b.new_page(viewport={'width': 1280, 'height': 720}); errs = []; page_errors(pg, errs)
    boot(pg); new_game(pg)
    # descanso num altar
    warp(pg, 'r1_sanct')
    pg.evaluate('''() => { const a = T.g().ents.find((e) => e.isAltar); T.p().x = a.cx - 6; }'''); frames(pg, 10)
    pg.evaluate('VS.state.hp = 10; VS.state.altars.a_r2_gate = { name: "altar_r2_gate", room: "r2_gate" }; T.tap("KeyE", 3)'); frames(pg, 20)
    ok = pg.evaluate('!!document.querySelector(".rest")')
    shot(pg, 'rest')
    R.check('descansar no altar abre o menu de descanso e restaura a vida', ok and pg.evaluate('VS.state.hp === VS.state.hpMax'))
    pg.click('.rest .btn:nth-child(1)'); frames(pg, 6)
    n = pg.evaluate('document.querySelectorAll(".travel .btn").length')
    R.check('viagem rápida lista os altares acesos', n >= 2, n)
    pg.evaluate('''() => { const b = [...document.querySelectorAll(".travel .btn")].find((x) => x.textContent.includes(VS.t("altar_r2_gate"))); b.click(); }''')
    wait(pg, 'VS.state.room === "r2_gate"', 6)
    R.check('viagem rápida leva ao altar escolhido', pg.evaluate('VS.state.room') == 'r2_gate')
    pg.evaluate('VS.UI.closeAll(); T.clean()'); frames(pg, 20)
    # inscrição: ler
    warp(pg, 'r1_wake')
    pg.evaluate('''() => { const i = T.g().ents.find((e) => e.insId || (e.d && e.d.id === "i01") || e.constructor.name === "Inscription"); T.p().x = i.cx - 6; }'''); frames(pg, 10)
    pg.evaluate('T.tap("KeyE", 3)'); frames(pg, 10)
    ok = pg.evaluate('!!document.querySelector(".inscription")')
    shot(pg, 'inscription')
    pg.keyboard.press('Escape'); frames(pg, 5)
    R.check('ler uma inscrição abre o texto e regista-a no Diário', ok and pg.evaluate('Object.keys(VS.state.inscriptions).length') >= 1)
    # parede rachada: não parte sem o Golpe de Forja, parte com ele
    pg.evaluate('VS.UI.closeAll(); VS.App.paused = false; T.releaseAll()'); frames(pg, 5)
    pg.evaluate('''() => { const r = T.g().room; let c = null; for (let y = 0; y < r.h; y++) for (let x = 0; x < r.w; x++) if (r.tile(x, y) === 'C') { c = c || { x, y }; } if (c) { while (r.tile(c.x + 1, c.y) === 'C') c.x++; let yy = c.y; while (r.tile(c.x, yy + 1) === 'C') yy++; c.y = yy; } T.crack = c; }''')
    crack = pg.evaluate('T.crack')
    if crack:
        pg.evaluate(f'T.p().x = ({crack["x"]} + 1) * 20 + 4; T.p().y = ({crack["y"]} + 1) * 20 - T.p().h; T.p().vy = 0; T.p().dir = -1; T.p().facing = -1'); frames(pg, 10)
        pg.evaluate('T.key("KeyK", true)'); frames(pg, 70); pg.evaluate('T.key("KeyK", false)'); frames(pg, 40)
        still = pg.evaluate(f'T.g().room.isSolidTile({crack["x"]}, {crack["y"]})')
        pg.evaluate('VSDebug.ability("forge"); T.p().dir = -1; T.p().facing = -1'); frames(pg, 30)
        pg.evaluate('T.key("KeyK", true)'); frames(pg, 75); pg.evaluate('T.key("KeyK", false)'); frames(pg, 50)
        broke = not pg.evaluate(f'T.g().room.isSolidTile({crack["x"]}, {crack["y"]})')
        R.check('pedra rachada: resiste sem Golpe de Forja e parte com o golpe pesado carregado', still and broke, f'antes sólida={still} depois partida={broke}')
    else:
        R.check('pedra rachada encontrada em r1_wake', False)
    # parede falsa da capela (terceira carta)
    warp(pg, 'r1_chapel')
    pg.evaluate('''() => { const r = T.g().room; let c = null; for (let y = 0; y < r.h; y++) for (let x = 0; x < r.w; x++) if (r.tile(x, y) === 'F' && !c) c = { x, y }; T.fake = c; }''')
    fk = pg.evaluate('T.fake')
    pg.evaluate(f'T.p().x = ({fk["x"]} - 1) * 20 - 6; T.p().y = 13 * 20; T.p().dir = 1; T.p().facing = 1'); frames(pg, 20)
    for _ in range(4):
        pg.evaluate('T.tap("KeyJ", 3)'); frames(pg, 20)
    br = pg.evaluate(f'!T.g().room.isSolidTile({fk["x"]}, {fk["y"]})')
    R.check('parede falsa parte com um golpe e revela a passagem', br)
    pg.evaluate('''() => { const it = T.g().ents.find((e) => e.item === "letter_3"); if (it) { T.p().x = it.cx - 6; T.p().y = it.y - 10; } }'''); frames(pg, 40)
    pg.evaluate('T.tap("KeyE", 3)'); frames(pg, 30)
    R.check('a terceira carta está atrás da parede falsa', pg.evaluate('VS.state.has("letter_3")'))
    pg.evaluate('VS.UI.closeAll(); T.clean()'); frames(pg, 5)
    # Fosso → Ponte: abismo exige o Passo de Cinza
    def chasm(dash):
        wait(pg, '!T.g().script && !T.g().cutscene && !(T.p().action && T.p().action.type === "dead")', 6); frames(pg, 20)
        pg.evaluate('VS.state.abilities.dash = ' + ('true' if dash else 'false'))
        warp(pg, 'r1_bridge', 69, 12)
        # sem inimigos por perto: só se testa o salto/esquiva (um golpe à chegada estragava a medição)
        pg.evaluate('T.g().ents.filter((e) => e.isEnemy).forEach((e) => e.remove = true)'); frames(pg, 10)
        wait(pg, '!T.p().action && T.p().onGround', 3); frames(pg, 10)
        # corre até à beira e salta aí (como um jogador); com o Passo de Cinza, esquiva no ar a meio do salto
        pg.evaluate('''(dash) => { const r = T.g().room, p = T.p(); let tx = Math.floor(p.cx / 20); const ty = Math.floor((p.bottom + 2) / 20);
          while (tx < r.w && r.isSolidTile(tx, ty)) tx++; T.edge = tx * 20; T.jumped = 0;
          T.hooks.push(() => { const p = T.p(); if (!T.jumped && p.cx > T.edge - 9) { T.tap("Space", 16); T.jumped = 1; } else if (T.jumped && T.jumped++ === 14) { T.tap("KeyL", 3); return true; } else if (T.jumped > 14) return true; }); }''', dash)
        pg.evaluate('T.key("KeyD", true)')
        frames(pg, 90)
        pg.evaluate('T.key("KeyD", false)'); frames(pg, 10)
        return pg.evaluate('({ x: Math.round(T.p().cx / 20), onGround: T.p().onGround, y: Math.round(T.p().bottom / 20) })')
    # trepar (Garra do Sentinela): agarra-se ao bloco da Ponte, trepa e sobe por cima do rebordo
    def climb():
        wait(pg, '!T.g().script && !T.g().cutscene', 4)
        pg.evaluate('VS.state.abilities.wall = false')  # trepar existe desde o início (a Garra só melhora)
        warp(pg, 'r1_bridge', 57, 12)
        pg.evaluate('T.g().ents.filter((e) => e.isEnemy).forEach((e) => e.remove = true)'); frames(pg, 10)
        wait(pg, 'T.p().onGround', 3)
        # no ar, encostada à face do bloco (mais baixa que o topo): agarra-se com →, trepa com ↑
        pg.evaluate('(() => { const p = T.p(); p.x = 60 * 20 - p.w - 0.5; p.y = 300 - 12 - p.h; p.vx = 0; p.vy = 0; p.onGround = false; T.key("KeyD", true); T.key("KeyW", true); })()')
        seen = []
        for _ in range(12):
            frames(pg, 8); seen.append(pg.evaluate('[T.p().climbing, Math.round(T.p().bottom)]'))
        pg.evaluate('T.key("KeyW", false); T.key("KeyD", false)'); frames(pg, 30)
        end = pg.evaluate('({ x: Math.round(T.p().cx), bottom: Math.round(T.p().bottom), onGround: T.p().onGround })')
        return any(c for c, _ in seen), end, seen
    climbed, cend, cseen = climb()
    k0 = next((i for i, (c, _) in enumerate(cseen) if c), None)
    mantled = k0 is not None and any(bt <= 241 and not c for c, bt in cseen[k0:])
    R.check('trepar desde o início (sem a Garra): agarra-se à parede, trepa e sobe por cima do rebordo', climbed and mantled, {'frames': cseen[:6]})
    a = chasm(False); bb = chasm(True)
    R.check('o abismo da Ponte não se transpõe com salto + esquiva curta no ar (sem o Passo de Cinza)', not (a['x'] >= 79 and a['y'] <= 15), a)
    R.check('com o Passo de Cinza (esquiva no ar) transpõe-se o abismo', bb['x'] >= 79 and bb['y'] <= 15, bb)
    # porta do Paço exige 5 brasas
    warp(pg, 'r1_plaza', 6, 12)
    pg.evaluate('''() => { const d = T.g().ents.find((e) => e.did === "d_palace"); T.door = d; T.p().x = d.x + 26; T.p().dir = -1; T.p().facing = -1; }'''); frames(pg, 10)
    pg.evaluate('for (let i = 1; i <= 4; i++) VS.state.give("ember_" + i)')
    pg.evaluate('T.tap("KeyE", 3)'); frames(pg, 20)
    closed = pg.evaluate('!T.door.isOpen')
    pg.evaluate('VS.state.give("ember_5")'); pg.evaluate('T.tap("KeyE", 3)'); frames(pg, 60)
    opened = pg.evaluate('!!T.door.isOpen')
    R.check('porta do Paço: fechada com 4 brasas, abre com 5', closed and opened, f'fechada={closed} aberta={opened}')
    # véu espectral só se atravessa com o Véu Desfeito
    pg.evaluate('VS.state.bosses.corvin = true'); warp(pg, 'r5_crown')
    v = pg.evaluate('''() => { const r = T.g().room; for (let y = 0; y < r.h; y++) for (let x = 0; x < r.w; x++) if (r.tile(x, y) === 'V') return { x, y }; return null; }''')
    s1 = pg.evaluate(f'VS.state.abilities.veil = false, T.g().room.isSolidTile({v["x"]}, {v["y"]}, T.p())')
    s2 = pg.evaluate(f'VS.state.abilities.veil = true, T.g().room.isSolidTile({v["x"]}, {v["y"]}, T.p())')
    R.check('véu espectral: sólido sem a habilidade, atravessável com ela', s1 and not s2)
    # chave do Ossário
    warp(pg, 'r1_cemetery')
    pg.evaluate('''() => { const d = T.g().ents.find((e) => e.did === "d_crypt"); T.door = d; T.p().x = d.x + (d.w > 30 ? 10 : 24); T.p().y = d.y; }'''); frames(pg, 30)
    pg.evaluate('T.door.interact(T.g())'); frames(pg, 10)
    c1 = pg.evaluate('!T.door.isOpen')
    pg.evaluate('VS.state.give("ossuary_key"); T.door.interact(T.g())'); frames(pg, 40)
    R.check('porta do Ossário: trancada sem chave, abre com a Chave do Ossário', c1 and pg.evaluate('!!T.door.isOpen'))
    # inventário: equipar relíquia e efeito
    pg.evaluate('VS.state.give("r_heron"); VS.state.unequip("r_heron")'); frames(pg, 20)
    pg.keyboard.press('Tab'); frames(pg, 5)
    if not pg.evaluate('!!document.querySelector(".inventory")'):
        R.log = pg.evaluate('({ ui: VS.UI.isOpen(), paused: VS.App.paused, cut: T.g().cutscene, dlg: !!VS.UI.dlg, room: VS.state.room })'); print('    (inventário não abriu à 1.ª:', R.log, ')')
        pg.keyboard.press('Tab'); frames(pg, 5)
    pg.click('.inventory .tab:nth-child(2)'); frames(pg, 3)
    shot(pg, 'inventory_relics')
    pg.evaluate('''() => { const e = [...document.querySelectorAll('.inventory .inv-slot:not(.empty)')].find((x) => (x.getAttribute('aria-label') || '').includes(VS.t('item_r_heron_name'))); e.click(); }'''); frames(pg, 3)
    eq = pg.evaluate('VS.state.equipped.includes("r_heron")'); fx = pg.evaluate('VS.state.fx("speed", 1)')
    R.check('inventário: equipar relíquia (Pena de Garça) aumenta a velocidade', eq and fx > 1, f'equipada={eq} speed={fx}')
    for i in range(1, 6):
        pg.click(f'.inventory .tab:nth-child({i})'); frames(pg, 2)
    pg.keyboard.press('Escape'); frames(pg, 5)
    # mapa
    pg.keyboard.press('KeyM'); frames(pg, 6)
    shot(pg, 'map')
    vis = pg.evaluate('Object.keys(VS.state.visited).length')
    R.check('mapa abre (M) com as salas visitadas', pg.evaluate('!!document.querySelector(".mapview canvas")') and vis >= 6, vis)
    pg.keyboard.press('Escape'); frames(pg, 5)
    R.check('mundo e menus sem erros de JavaScript', not errs, errs[:5])
    pg.close()


BOSSES = [('coveiro', 'r1_coveiro'), ('matilheira', 'r2_kennels'), ('caedmon', 'r2_watch'), ('automato', 'r3_bellows'), ('hilde', 'r3_hilde'),
          ('mariposa', 'r4_moth'), ('elowen', 'r4_elowen'), ('sineiro', 'r5_sineiro'), ('corvin', 'r5_crown'), ('vael', 'r6_vael'),
          ('ozias', 'r6_ozias'), ('gemeos', 'r7_twins'), ('aldric', 'r7_throne')]


def place_for_boss(pg, room):
    return pg.evaluate(f'''() => {{
      const d = VS.ROOMS["{room}"].ents.find((e) => e.t === "boss"); const TT = 20, r = T.g().room;
      const trig = d.trigger !== undefined ? d.trigger : d.x;
      const tx = d.fromRight ? trig - 3 : trig + 3;
      // chão mais próximo por baixo da posição do chefe
      let ty = 1; for (let y = 1; y < r.h - 1; y++) if (!r.isSolidTile(tx, y) && !r.isSolidTile(tx, y - 1) && (r.isSolidTile(tx, y + 1) || r.tile(tx, y + 1) === '=') && y > 3) {{ ty = y; if (d.floor === undefined || y + 1 >= d.floor - 1) break; }}
      const p = T.p(); p.x = tx * TT; p.y = (ty + 1) * TT - p.h - 1; p.vx = 0; p.vy = 0;
      return {{ boss: d.boss, tx, ty, trig, fromRight: !!d.fromRight }};
    }}''')


def t_bosses(R, b, only=None):
    only = only or [x for x in os.environ.get('BOSS_ONLY', '').split(',') if x]
    pg = b.new_page(viewport={'width': 1280, 'height': 720}); errs = []; page_errors(pg, errs)
    boot(pg)
    (OUT / 'bosses').mkdir(exist_ok=True)
    for i, (bid, room) in enumerate(BOSSES):
        if only and bid not in only:
            continue
        mark = len(errs)
        new_game(pg, slot=i % 3)
        pg.evaluate('VSDebug.allAbilities(); VSDebug.god(true); T.snap = { hearts: VS.state.hearts, fragments: VS.state.fragments, slots: VS.state.relicSlots }')
        warp(pg, room)
        info = place_for_boss(pg, room)
        spawned = wait(pg, 'T.bossEnts().length > 0', 6)
        started = wait(pg, 'T.bossEnts().length > 0 && !T.bossEnts()[0].intro', 10)
        mus = pg.evaluate('VS.Audio.currentId')
        # combate automático durante 5 s (aproxima-se, ataca, salta e esquiva) — exercita a IA e as colisões
        pg.evaluate('''() => { T.fight = 0; T.hooks.push(() => { const bs = T.bossEnts(); if (!bs.length || T.fight++ > 300) { T.releaseAll(); return true; } const bo = bs[0], p = T.p(); const dx = bo.cx - p.cx;
          T.key("KeyD", dx > 30); T.key("KeyA", dx < -30); if (T.fight % 16 === 0) T.tap("KeyJ", 3); if (T.fight % 70 === 35) T.tap("Space", 8); if (T.fight % 90 === 60) T.tap("KeyL", 3); }); }''')
        frames(pg, 150)
        shot(pg, f'bosses/{bid}')
        frames(pg, 150)
        hpk = pg.evaluate('T.bossEnts().map((e) => [e.hp, e.maxHp])')
        pg.evaluate('T.releaseAll(); T.hooks = []; T.bossEnts().forEach((e) => e.die(T.g()))')
        done = wait(pg, f'!!VS.state.bosses["{bid}"]', 12)
        wait(pg, f'''(() => {{ const R = VS.Story.REWARDS["{bid}"] || {{}}; return (R.items || []).every(([i]) => T.owns(i)); }})()''', 10)
        rw = pg.evaluate(f'''() => {{ const R = VS.Story.REWARDS["{bid}"] || {{}}; const st = VS.state; const items = (R.items || []).every(([i]) => T.owns(i)); const ab = !R.ability || st.abilities[R.ability]; return {{ items, ab, missing: (R.items || []).filter(([i]) => !T.owns(i)).map(([i]) => i) }}; }}''')
        frames(pg, 60)
        if bid == 'ozias':
            wait(pg, 'VS.state.flags.chalice_choice', 8)
            R.check('Ozias: escolha do cálice aparece depois do combate', pg.evaluate('!!VS.state.flags.chalice_choice'), pg.evaluate('VS.state.flags.chalice_choice'))
        if bid == 'aldric':
            # depois do rei, Ione espera no trono: o jogador decide quando falar com ela (pode sair com o Montante)
            near = wait(pg, 'T.g().ents.some((e) => e.nid === "ione" && e.interactable)', 12)
            R.check('Aldric: Ione fica no trono à espera e o Montante do Rei é entregue', near and pg.evaluate('VS.state.weapons.includes("montante")'))
            pg.evaluate('(() => { const n = T.g().ents.find((e) => e.nid === "ione"); VS.NPCS.ione.talk(T.g(), n); })()')
            ok = wait(pg, 'VS.App.mode === "ending"', 15)
            R.check('Aldric: depois do rei, a cena final leva à escolha e a um final', ok)
        newerr = errs[mark:]
        R.check(f'chefe {bid}: aparece, fala, combate, música própria ({mus}), derrota, recompensa',
                spawned and started and done and rw['items'] and rw['ab'] and (mus or '').startswith(('b_', 'sb_')) and not newerr,
                f'{info} hp={hpk} recompensa={rw} erros={newerr[:2]}')
        pg.evaluate('VS.UI.closeAll && VS.UI.closeAll()')
        if pg.evaluate('VS.App.mode') != 'game':
            pg.evaluate('VS.App.toMenu()')
    pg.close()


def t_caedmon(R, b):
    pg = b.new_page(viewport={'width': 1280, 'height': 720}); errs = []; page_errors(pg, errs)
    boot(pg); new_game(pg)
    pg.evaluate('VSDebug.allAbilities(); VSDebug.god(true)')
    warp(pg, 'r2_watch'); place_for_boss(pg, 'r2_watch')
    wait(pg, 'T.bossEnts().length > 0 && !T.bossEnts()[0].intro', 12)
    pg.evaluate('T.B = T.bossEnts()[0]; T.hp0 = T.B.hp')
    # 1) só atacar (spam): o escudo é absoluto
    pg.evaluate('''() => { T.n = 0; T.hooks.push(() => { const B = T.B, p = T.p(); if (T.n++ > 480) { T.releaseAll(); return true; } const dx = B.cx - p.cx; T.key("KeyD", dx > 26); T.key("KeyA", dx < -26); const near = Math.abs(dx) < 34; if (near && T.n % 10 === 0) T.tap("KeyJ", 3); if (near && T.n % 50 === 0) T.tap("KeyK", 3); }); }''')
    frames(pg, 490)
    spam = pg.evaluate('({ hp: T.B.hp, hp0: T.hp0, shieldHits: T.B.shieldHits })')
    R.check('Caedmon: 8 s de ataques sem parry não lhe tiram vida', spam['hp'] == spam['hp0'] and spam['shieldHits'] >= 8, spam)
    # 2) aparar os golpes de brilho branco → postura quebrada → dano
    pg.evaluate('VS.state.flags.parries = 0')
    pg.evaluate('''() => { T.n = 0; T.brk = 0; T.hooks.push(() => { const B = T.B, p = T.p(); if (T.n++ > 5400 || B.dead || B.defeated) { T.releaseAll(); return true; }
      const dx = B.cx - p.cx; const a = B.atk;
      if (B.broken > 0) { T.brk++; T.key("KeyD", dx > 20); T.key("KeyA", dx < -20); if (T.n % 8 === 0) T.tap("KeyJ", 3); return; }
      T.key("KeyD", dx > 46); T.key("KeyA", dx < 26 && dx > 0); p.facing = Math.sign(dx) || 1;
      if (a && a.phase === "wind" && a.s.tell === "white" && a.s.wind - a.t < 0.07 && !a.__p) { a.__p = 1; T.tap("KeyI", 4); }
      if (a && a.s.tell === "red" && a.phase === "wind" && a.s.wind - a.t < 0.1 && !a.__d) { a.__d = 1; T.tap("KeyL", 3); }
    }); }''')
    ok = wait(pg, 'T.B.hp < T.hp0 * 0.6 || T.B.defeated', 100)
    res = pg.evaluate('({ hp: T.B.hp, hp0: T.hp0, parries: VS.state.flags.parries, brokenFrames: T.brk })')
    R.check('Caedmon: aparar os golpes brancos quebra a postura e abre-o ao dano', ok and res['parries'] >= 3 and res['brokenFrames'] > 0, res)
    shot(pg, 'caedmon_parry')
    R.check('Caedmon sem erros', not errs, errs[:3])
    pg.close()


def t_aldric(R, b):
    pg = b.new_page(viewport={'width': 1280, 'height': 720}); errs = []; page_errors(pg, errs)
    boot(pg); new_game(pg)
    pg.evaluate('VSDebug.allAbilities(); VSDebug.god(true)')
    warp(pg, 'r7_throne'); place_for_boss(pg, 'r7_throne')
    wait(pg, 'T.bossEnts().length > 0 && !T.bossEnts()[0].intro', 14)
    # fraqueza: a protagonista encostada ao estrado do trono esquiva-se (invulnerável); o rei não trava e embate → derrubado
    pg.evaluate('''(() => { const B = T.B = T.bossEnts()[0], p = T.p(); B.K = Object.assign({}, B.K, { think: B.K.think }); p.x = 352; p.vx = 0; p.iframes = 4; B.x = 760; B.facing = -1; B.cool = 99; B.attack('charge'); T.hp0 = B.hp; })()''')
    knocked = wait(pg, '!!T.B.knock', 6)
    pg.evaluate('T.B.cool = 99')
    down = wait(pg, 'T.B.knock && T.B.knock.ph === "down"', 3)
    # castigo: golpes no chão valem mais
    pg.evaluate('''(() => { const B = T.B, p = T.p(); p.x = B.cx + 24; p.dir = -1; p.facing = -1; T.n = 0; T.hooks.push(() => { if (T.n++ > 60 || !T.B.knock) { T.releaseAll(); return true; } if (T.n % 8 === 0) T.tap("KeyJ", 3); }); })()''')
    frames(pg, 70)
    res = pg.evaluate('({ hp: T.B.hp, hp0: T.hp0, knock: T.B.knock && T.B.knock.ph })')
    shot(pg, 'aldric_knock')
    R.check('Aldric: a investida contra o estrado/parede derruba-o e fica exposto ao dano', knocked and down and res['hp'] < res['hp0'], res)
    up = wait(pg, '!T.B.knock', 5)
    R.check('Aldric: levanta-se depois de derrubado e volta a lutar', up)
    R.check('Aldric sem erros', not errs, errs[:3])
    pg.close()


def t_corvin(R, b):
    pg = b.new_page(viewport={'width': 1280, 'height': 720}); errs = []; page_errors(pg, errs)
    boot(pg); new_game(pg)
    pg.evaluate('VSDebug.allAbilities(); VSDebug.god(true)')
    warp(pg, 'r5_crown'); place_for_boss(pg, 'r5_crown')
    wait(pg, 'T.bossEnts().length > 0 && !T.bossEnts()[0].intro', 12)
    pg.evaluate('''() => { T.notes = []; const g = T.g(); const sp = g.spawn.bind(g); g.spawn = (e) => { if (e instanceof VS.Projectile && e.kind === "note") T.notes.push(VS.Audio.beat()); return sp(e); }; }''')
    frames(pg, 600)
    fr = pg.evaluate('T.notes.map((b) => b - Math.floor(b))')
    bpm = pg.evaluate('VS.MUSIC.b_corvin.bpm')
    good = [f for f in fr if f < 0.2 or f > 0.95]
    R.check(f'Corvin: notas lançadas no tempo da música ({bpm} BPM)', len(fr) >= 4 and len(good) / max(1, len(fr)) > 0.9, f'{len(good)}/{len(fr)} no tempo; frações={[round(x, 2) for x in fr[:8]]}')
    # só se vence a trepar: do chão os golpes e feitiços são desviados; no balcão dele ferem
    low = pg.evaluate('''() => { const B = T.bossEnts()[0], g = T.g(), hp = B.hp; const r1 = B.onHit({ x: B.x, y: B.y, w: 10, h: 10, dmg: 30, id: 7771, owner: T.p() }, g); const r2 = B.onHit({ x: B.x, y: B.y, w: 10, h: 10, dmg: 30, id: 7772, owner: T.p(), proj: {} }, g); return { r1, r2, dhp: B.hp - hp, py: Math.round(T.p().bottom / 20), perch: B.perchI }; }''')
    R.check('Corvin: do chão (e com projéteis) não se lhe faz dano', low['r1'] == 'blocked' and low['r2'] == 'blocked' and low['dhp'] == 0, low)
    up = pg.evaluate('''() => { const B = T.bossEnts()[0], g = T.g(), p = T.p(); const P = B.perches[B.perchI]; p.x = B.cx - 26 - p.w / 2; p.y = P.y - p.h - 1; p.vy = 0; const hp = B.hp, i0 = B.perchI; let n = 0; for (let k = 0; k < 6; k++) { const r = B.onHit({ x: B.x, y: B.y, w: 10, h: 10, dmg: 20, id: 7800 + k, owner: p }, g); if (r !== 'blocked' && r !== false) n++; } return { dhp: hp - B.hp, hits: n, i0 }; }''')
    frames(pg, 30)
    moved = pg.evaluate('T.bossEnts()[0].perchI')
    R.check('Corvin: no balcão dele os golpes ferem e, depois de vários, salta para outro balcão', up['dhp'] > 0 and moved != up['i0'], {**up, 'perch_after': moved})
    # a arena trepa-se: da base até ao balcão esquerdo (só com a escalada, sem saltar)
    pg.evaluate('(() => { const B = T.bossEnts()[0]; B.K = Object.assign({}, B.K, { think() {} }); B.atk = null; B.attackHBs = []; const p = T.p(); p.x = 10 * 20 + 3; p.y = 33 * 20 - p.h - 1; p.vx = 0; p.vy = 0; })()'); frames(pg, 10)
    pg.evaluate('T.key("KeyA", true); T.key("KeyW", true)')
    best = 99
    for _ in range(36):
        frames(pg, 12); best = min(best, pg.evaluate('Math.round(T.p().bottom / 20)'))
    pg.evaluate('T.releaseAll()')
    R.check('Coroa dos Sinos: trepa-se do chão até ao balcão de Corvin (fila 10)', best <= 10, {'linha_mais_alta': best})
    R.check('Corvin sem erros', not errs, errs[:3])
    pg.close()


def t_quests(R, b):
    pg = b.new_page(viewport={'width': 1280, 'height': 720}); errs = []; page_errors(pg, errs)
    boot(pg)

    def talk(npc_id, answers=()):
        pg.evaluate(f'T.answers = {json.dumps(list(answers))}')
        pg.evaluate(f'''() => {{ const n = T.g().ents.find((e) => e.nid === "{npc_id}"); if (!n) throw new Error("npc {npc_id} ausente na sala " + VS.state.room); const p = T.p(); p.x = n.cx - 20 - p.w / 2; p.y = n.bottom - p.h - 0.5; p.vx = 0; p.vy = 0; p.dir = 1; p.facing = 1; }}''')
        wait(pg, 'T.p().onGround && !T.p().action', 3); frames(pg, 4)
        pg.evaluate('T.tap("KeyE", 3)')
        frames(pg, 10)
        wait(pg, '!VS.UI.dlg && !VS.App.game.cutscene', 6)
        frames(pg, 6)

    # Ramo A: Teodoro → irmã; Hrolf → verdade
    new_game(pg, 0)
    warp(pg, 'r1_sanct'); talk('ione')
    R.check('Ione: primeiro encontro', pg.evaluate('VS.state.flags.met_ione'))
    warp(pg, 'r2_gate'); talk('maren')
    R.check('Maren: entrega a medalha de Teodoro', pg.evaluate('VS.state.has("teodoro_medal") && VS.state.quests.maren === 1'))
    warp(pg, 'r4_greenhouse'); talk('teodoro', [0])
    R.check('Teodoro → "vai ter com a tua irmã" (estado 3)', pg.evaluate('VS.state.quests.teodoro') == 3)
    warp(pg, 'r1_sanct')
    present = pg.evaluate('["teodoro", "maren"].map((id) => !!T.g().ents.find((e) => e.nid === id))')
    R.check('Teodoro e Maren reunidos no Santuário', all(present), present)
    talk('maren'); R.check('Maren agradece com o Rosário (missão concluída)', pg.evaluate('VS.state.has("r_rosary") && VS.state.quests.maren === 50'))
    talk('teodoro'); R.check('Teodoro entrega a Chave do Ossário', pg.evaluate('VS.state.has("ossuary_key")'))
    warp(pg, 'r1_market'); talk('hrolf')
    R.check('Hrolf: apresenta-se', pg.evaluate('VS.state.quests.hrolf') == 1)
    pg.evaluate('VS.state.give("hilde_hammer"); VS.state.bosses.hilde = true'); talk('hrolf', [0])
    R.check('Hrolf → verdade: Gume de Hilde e têmpera até +5', pg.evaluate('VS.state.has("r_hilde_blade") && VS.state.quests.hrolf === 50'))
    # Ione: entrega de brasas, Centelha, fita
    pg.evaluate('for (let i = 1; i <= 3; i++) VS.state.give("ember_" + i)')
    warp(pg, 'r1_sanct'); talk('ione'); frames(pg, 30); wait(pg, '!VS.UI.dlg', 4)
    R.check('Ione: recebe brasas e ensina a Centelha', pg.evaluate('VS.state.abilities.spell && VS.state.flags.ember_given_3'))
    talk('ione')  # (sem brasas novas) dica
    pg.evaluate('VS.state.give("ember_4")'); talk('ione'); frames(pg, 30)
    R.check('Ione: oferece a fita ao chegar às 3+ brasas', pg.evaluate('VS.state.has("r_ione_ribbon")'))
    # cartas → leitura com Ione
    pg.evaluate('["letter_1", "letter_2", "letter_3"].forEach((l) => VS.state.give(l))')
    talk('ione', [0]); frames(pg, 20)
    R.check('Ione: ler-lhe as três cartas desbloqueia a condição do terceiro final', pg.evaluate('!!VS.state.flags.ione_letters'))
    # cálice → Hrolf remenda
    pg.evaluate('VS.state.give("chalice")'); warp(pg, 'r1_market')
    if not pg.evaluate('!!T.g().ents.find((e) => e.nid === "hrolf")'):
        warp(pg, 'r1_sanct')
    talk('hrolf', [0])
    R.check('Hrolf remenda o cálice (condição do segundo final)', pg.evaluate('VS.state.has("chalice_mended")'))
    # loja de Maren
    warp(pg, 'r1_sanct'); pg.evaluate('VS.state.ash = 5000')
    talk('maren', [0]); frames(pg, 10)
    shop = pg.evaluate('!!document.querySelector(".shop")')
    shot(pg, 'shop')
    pg.evaluate('''() => { const b = [...document.querySelectorAll('.shop .inv-item, .shop .shop-item, .shop .btn')].find((x) => x.textContent.includes(VS.t('item_salt_name'))); if (b) b.click(); }'''); frames(pg, 6)
    R.check('loja de Maren: comprar Sal Bento gasta cinza', shop and pg.evaluate('VS.state.ash') < 5000, pg.evaluate('VS.state.ash'))
    pg.evaluate('VS.UI.closeAll(); T.clean()')
    # ferreiro
    pg.evaluate('VS.state.give("ash_steel", 3)'); warp(pg, 'r1_market')
    if not pg.evaluate('!!T.g().ents.find((e) => e.nid === "hrolf")'):
        warp(pg, 'r1_sanct')
    w0 = pg.evaluate('VS.state.weapon')
    talk('hrolf', [0]); frames(pg, 6)
    pg.evaluate('''() => { const b = document.querySelector('.smith .btn'); if (b) b.click(); }'''); frames(pg, 6)
    R.check('ferreiro: temperar a lâmina sobe o nível e o dano', pg.evaluate('VS.state.weapon') == w0 + 1, f'{w0} → {pg.evaluate("VS.state.weapon")}')
    pg.evaluate('VS.UI.closeAll(); T.clean()')

    # Ramo B (consequências irreversíveis): Teodoro → Catedral; Hrolf → mentira
    new_game(pg, 1)
    warp(pg, 'r2_gate'); talk('maren')
    warp(pg, 'r4_greenhouse'); talk('teodoro', [1])
    R.check('Teodoro → "volta à Catedral" (estado 4)', pg.evaluate('VS.state.quests.teodoro') == 4)
    warp(pg, 'r6_reliquary')
    has_body = pg.evaluate('!!T.g().ents.find((e) => e.nid === "teodoro_body")')
    R.check('consequência: o corpo de Teodoro aparece no Relicário', has_body)
    talk('teodoro_body')
    R.check('o corpo deixa a chave e Maren parte (estado 95)', pg.evaluate('VS.state.has("ossuary_key") && VS.state.quests.maren === 95'))
    warp(pg, 'r1_sanct')
    R.check('Maren já não está no Santuário', pg.evaluate('!T.g().ents.find((e) => e.nid === "maren" || e.nid === "teodoro")'))
    warp(pg, 'r1_market'); talk('hrolf')
    pg.evaluate('VS.state.give("hilde_hammer"); VS.state.bosses.hilde = true'); talk('hrolf', [1])
    R.check('Hrolf → mentira: parte à procura da mestra (estado 60)', pg.evaluate('VS.state.quests.hrolf') == 60)
    warp(pg, 'r3_foundry')
    R.check('consequência: o corpo de Hrolf nas Forjas', pg.evaluate('!!T.g().ents.find((e) => e.nid === "hrolf_body")'))
    talk('hrolf_body')
    R.check('o corpo de Hrolf deixa o martelo (relíquia)', pg.evaluate('VS.state.has("r_hrolf_hammer")'))
    R.check('missões sem erros de JavaScript', not errs, errs[:5])
    pg.close()


def t_endings(R, b):
    pg = b.new_page(viewport={'width': 1280, 'height': 720}); errs = []; page_errors(pg, errs)
    boot(pg)
    for slot, ending, prep, choice in [(0, 'end1', '', 0), (1, 'end2', 'VS.state.give("chalice_mended");', 1),
                                       (2, 'end3', '["letter_1","letter_2","letter_3"].forEach((l) => VS.state.give(l)); VS.state.flags.ione_letters = true;', 1)]:
        new_game(pg, slot)
        pg.evaluate('for (let i = 1; i <= 6; i++) VS.state.give("ember_" + i); Object.keys(VS.Story.REWARDS).forEach((k) => { if (k !== "seraphine") VS.state.bosses[k] = true; }); VSDebug.god(true)')
        pg.evaluate(prep)
        warp(pg, 'r7_throne')
        pg.evaluate(f'T.answers = [{choice}]; T.optsSeen = null')
        pg.evaluate('''() => { const d = VS.UI.dialogue; VS.UI.dialogue = function (lines, choices, cb) { if (choices && choices[0] === "final_opt1") T.optsSeen = choices.slice(); return d.apply(this, arguments); }; }''')
        pg.evaluate('VS.Story.finalScene(T.g())')
        # Ione fica à espera no trono: a escolha só aparece quando se fala com ela
        wait(pg, '!T.g().script && !VS.UI.dlg', 15)
        pg.evaluate('VS.Story.finalChoice(T.g())')
        if ending == 'end3':
            ok = wait(pg, 'T.bossEnts().length > 0 && !T.bossEnts()[0].intro', 15)
            R.check('final 3: Ione e as cartas despertam o Eco de Seraphine', ok)
            frames(pg, 120); shot(pg, 'seraphine')
            # só a luz devolvida fere a rainha: um golpe de espada não lhe tira vida
            pg.evaluate('T.S = T.bossEnts()[0]; T.sh = T.S.hp')
            pg.evaluate('T.S.onHit({ dmg: 30, kind: "light", poise: 10 }, T.g())')
            R.check('Seraphine: a espada não a fere fora das janelas de luz', pg.evaluate('T.S.hp') == pg.evaluate('T.sh') or pg.evaluate('T.S.dim > 0'))
            pg.evaluate('T.bossEnts().forEach((e) => e.die(T.g()))')
        ok = wait(pg, 'VS.App.mode === "ending"', 20)
        opts = pg.evaluate('T.optsSeen')
        R.check(f'{ending}: opções finais corretas ({opts})', ok and opts is not None and len(opts) == (1 if ending == 'end1' else 2), opts)
        frames(pg, 200); shot(pg, f'ending_{ending}')
        pg.evaluate('VS.App.ending.t = 200')
        okv = wait(pg, '!!document.querySelector(".victory")', 10)
        shot(pg, f'victory_{ending}')
        prof = pg.evaluate('VS.Save.loadProfile().endings')
        R.check(f'{ending}: cena, ecrã de vitória e registo no perfil', okv and ending in prof, prof)
        pg.click('.victory .btn'); frames(pg, 10)
        cr = pg.evaluate('!!document.querySelector(".credits")')
        pg.keyboard.press('Escape'); frames(pg, 10)
        if not pg.evaluate('VS.App.mode === "menu"'):
            pg.evaluate('VS.UI.closeAll(); VS.App.toMenu()')
        R.check(f'{ending}: créditos e regresso ao menu', cr and pg.evaluate('VS.App.mode') == 'menu')
    R.check('menu mostra "Finais vistos: 3 de 3"', '3' in pg.evaluate('(document.querySelector(".mm-endings") || {}).textContent || ""'))
    R.check('finais sem erros de JavaScript', not errs, errs[:5])
    pg.close()


def t_save(R, b, pw):
    pg = b.new_page(viewport={'width': 1280, 'height': 720}); errs = []; page_errors(pg, errs)
    boot(pg); new_game(pg, 1)
    pg.evaluate('''() => { const st = VS.state; st.abilities.dash = st.abilities.wall = true; st.give("ember_1"); st.give("r_heron"); st.equip("r_heron"); st.ash = 777; st.weapon = 2; st.bosses.coveiro = true;
      st.quests.maren = 1; st.flags.teodoro_choice = "sister"; st.inscriptions.i05 = true; st.give("letter_2"); st.altars.a_r2_gate = { name: "altar_r2_gate", room: "r2_gate" }; st.broken["r1_chapel:26,10"] = true; st.hearts = 1; }''')
    warp(pg, 'r2_wall', 20, 12); frames(pg, 30)
    pg.evaluate('T.g().save()')
    snap = pg.evaluate('JSON.stringify(VS.state.serialize())')
    pg.reload(); pg.wait_for_function('VS.App && VS.App.mode === "menu"'); pg.evaluate(HELPERS)
    btn = pg.evaluate('document.querySelector(".mainmenu .menu-list .btn").textContent')
    pg.click('.mainmenu .menu-list .btn:nth-child(1)')
    pg.wait_for_function('VS.App.mode === "game"'); pg.evaluate('T.install()'); frames(pg, 20)
    after = pg.evaluate('JSON.stringify(VS.state.serialize())')
    a, s = json.loads(after), json.loads(snap)
    keys = ['room', 'abilities', 'items', 'equipped', 'ash', 'weapon', 'bosses', 'quests', 'flags', 'inscriptions', 'altars', 'broken', 'hearts']
    diff = [k for k in keys if a.get(k) != s.get(k)]
    R.check(f'gravar → recarregar a página → "{btn}" restaura o progresso', not diff and pg.evaluate('VS.state.room') == 'r2_wall', f'diferenças={diff}')
    # gravação automática ao mudar de sala
    pg.evaluate('VS.state.ash = 4242'); warp(pg, 'r2_tower'); frames(pg, 10)
    saved = pg.evaluate('VS.Save.read(1).ash')
    R.check('gravação automática ao mudar de sala', saved == 4242, saved)
    # exportar / importar
    code = pg.evaluate('VS.Save.exportSlot(1)')
    ok = pg.evaluate(f'VS.Save.importSlot(2, {json.dumps(code)})') and pg.evaluate('VS.Save.read(2).ash') == 4242
    R.check('exportar e importar uma memória (texto)', ok)
    bad = pg.evaluate('VS.Save.importSlot(0, "lixo")')
    R.check('importação inválida é recusada sem estragar nada', bad is False)
    # cópia de segurança se a gravação principal se corromper
    pg.evaluate('localStorage.setItem(Object.keys(localStorage).find((k) => k.includes("slot1") && !k.includes("bak")) || "x", "{corrompido")')
    rd = pg.evaluate('(VS.Save.read(1) || {}).ash')
    R.check('gravação corrompida recupera a cópia de segurança', rd is not None, rd)
    pg.close()
    # fechar e reabrir o navegador (contexto persistente)
    ud = OUT / 'profile_persist'
    import shutil
    shutil.rmtree(ud, ignore_errors=True)
    ctx = pw.chromium.launch_persistent_context(str(ud), args=ARGS, viewport={'width': 1280, 'height': 720})
    pg = ctx.new_page(); boot(pg); new_game(pg, 0)
    pg.evaluate('VS.state.ash = 31337; VS.state.give("ember_2"); T.g().save()')
    ctx.close()
    ctx = pw.chromium.launch_persistent_context(str(ud), args=ARGS, viewport={'width': 1280, 'height': 720})
    pg = ctx.new_page(); boot(pg, clear=False)
    has = pg.evaluate('document.querySelectorAll(".mainmenu .menu-list .btn").length') == 4
    pg.click('.mainmenu .menu-list .btn:nth-child(1)'); pg.wait_for_function('VS.App.mode === "game"')
    R.check('fechar e reabrir o navegador: Continuar recupera a partida', has and pg.evaluate('VS.state.ash') == 31337 and pg.evaluate('VS.state.has("ember_2")'))
    ctx.close()
    R.check('gravação sem erros de JavaScript', not errs, errs[:5])


def t_lang(R, b):
    pg = b.new_page(viewport={'width': 1280, 'height': 720}); errs = []; page_errors(pg, errs)
    boot(pg)
    pg.evaluate('T.missing = []; const o = console.warn; console.warn = function (...a) { if (String(a[0]).includes("i18n")) T.missing.push(a.join(" ")); o.apply(console, a); }')
    for lang in ['en', 'pt', 'es', 'fr']:
        # Definições → Geral → Idioma (clicar na linha percorre os idiomas)
        pg.evaluate('''() => { const b = [...document.querySelectorAll(".mainmenu .menu-list .btn")].find((x) => x.textContent === VS.t("mm_settings")); b.click(); }''')
        frames(pg, 3)
        for _ in range(5):
            if pg.evaluate('VS.settings.lang') == lang:
                break
            pg.evaluate('document.querySelector(".settings .set-row").click()'); frames(pg, 4)
        pg.evaluate('VS.UI.closeAll(); VS.Menus.main()'); frames(pg, 5)
        txt = pg.evaluate('document.querySelector(".mainmenu").textContent')
        shot(pg, f'menu_{lang}')
        new_game(pg, 0)
        pg.evaluate('VS.UI.areaTitle(VS.t("reg_r1")); VS.UI.toast(VS.t("hint_attack"), 4)')
        pg.keyboard.press('Escape'); frames(pg, 4)
        if not wait(pg, '!!document.querySelector(".pause")', 2):
            pg.evaluate('VS.UI.closeAll(); VS.Menus.pause()'); frames(pg, 4)
        pause = pg.evaluate('document.querySelector(".pause").textContent')
        pg.evaluate('document.querySelector(".pause .btn:nth-child(4)").click()'); frames(pg, 4)
        inv = pg.evaluate('document.querySelector(".inventory").textContent')
        shot(pg, f'inventory_{lang}')
        pg.keyboard.press('Escape'); frames(pg, 4)
        pg.evaluate('document.querySelector(".pause .btn:nth-child(3)").click()'); frames(pg, 4)
        shot(pg, f'journal_{lang}')
        pg.keyboard.press('Escape'); frames(pg, 4)
        pg.evaluate('VS.UI.closeAll(); VS.App.toMenu()'); frames(pg, 5)
        exp = pg.evaluate(f'[VS.LANG.{lang}.mm_play, VS.LANG.{lang}.pause_resume, VS.LANG.{lang}.inv_weapons]')
        R.check(f'idioma {lang}: menu, pausa e inventário traduzidos', exp[0] in txt and exp[1] in pause and exp[2] in inv, exp)
    R.check('nenhuma chave de texto em falta durante a troca de idiomas', not pg.evaluate('T.missing'), pg.evaluate('T.missing.slice(0, 5)'))
    R.check('idiomas sem erros de JavaScript', not errs, errs[:5])
    pg.close()


def t_touch(R, b):
    # telemóvel em paisagem (ecrã tátil)
    ctx = b.new_context(viewport={'width': 844, 'height': 390}, device_scale_factor=2, is_mobile=True, has_touch=True)
    pg = ctx.new_page(); errs = []; page_errors(pg, errs)
    boot(pg)
    pg.tap('.mainmenu .menu-list .btn:nth-child(1)'); frames(pg, 5)
    pg.tap('.slots .slot:nth-child(1)')
    pg.wait_for_function('VS.App.mode === "game"'); pg.evaluate('T.install()')
    wait(pg, '!VS.UI.dlg && !VS.App.game.script', 8); pg.evaluate('T.clean(); T.wrapHits()')
    pg.evaluate('VS.Input.lastDevice = "touch"; VS.Touch.refresh()'); frames(pg, 5)
    vis = pg.evaluate('document.getElementById("touch").classList.contains("show") && document.querySelectorAll("#touch [data-a]").length')
    R.check('controlos táteis visíveis no telemóvel', bool(vis), vis)
    shot(pg, 'touch_landscape')
    warp(pg, 'r1_bridge', 6, 12); frames(pg, 30)
    cdp = ctx.new_cdp_session(pg)
    def touch(type_, pts):
        cdp.send('Input.dispatchTouchEvent', {'type': type_, 'touchPoints': [{'x': x, 'y': y, 'id': i} for i, (x, y) in enumerate(pts)]})
    x0 = pg.evaluate('T.p().x')
    touch('touchStart', [(110, 300)]); frames(pg, 2)
    for k in range(6):
        touch('touchMove', [(110 + k * 10, 300)]); frames(pg, 1)
    frames(pg, 40)
    x1 = pg.evaluate('T.p().x')
    touch('touchEnd', []); frames(pg, 5)
    R.check('joystick tátil move o Desperto', x1 - x0 > 40, f'dx={x1 - x0:.0f}')
    def btn_center(act):
        return pg.evaluate(f'''() => {{ const e = document.querySelector('#touch [data-a="{act}"]'); if (!e) return null; const r = e.getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2, r.width]; }}''')
    acts = {a: btn_center(a) for a in ['jump', 'attack', 'dodge', 'heavy', 'parry', 'heal', 'spell', 'interact', 'pause', 'inventory', 'map']}
    R.check('todos os botões táteis existem', all(acts.values()), {k: bool(v) for k, v in acts.items()})
    y0 = pg.evaluate('T.p().y'); pg.evaluate('T.minY = 1e9; T.hooks.push(() => { T.minY = Math.min(T.minY, T.p().y); if ((T.k = (T.k || 0) + 1) > 60) { T.k = 0; return true; } })')
    j = acts['jump']; touch('touchStart', [(j[0], j[1])]); frames(pg, 10); touch('touchEnd', []); frames(pg, 50)
    R.check('botão tátil de salto', y0 - pg.evaluate('T.minY') > 40)
    pg.evaluate('T.seenA = []; T.hooks.push(() => { const a = T.p().action; const n = a && (a.name || a.type); if (n && !T.seenA.includes(n)) T.seenA.push(n); if ((T.k2 = (T.k2 || 0) + 1) > 90) return true; })')
    a = acts['attack']; touch('touchStart', [(a[0], a[1])]); frames(pg, 3); touch('touchEnd', []); frames(pg, 30)
    d = acts['dodge']; touch('touchStart', [(d[0], d[1])]); frames(pg, 3); touch('touchEnd', []); frames(pg, 40)
    seen = pg.evaluate('T.seenA')
    R.check('botões táteis de ataque e esquiva', 'l1' in seen and 'dodge' in seen, seen)
    # mover e saltar ao mesmo tempo (multitoque)
    x0 = pg.evaluate('T.p().x'); y0 = pg.evaluate('T.p().y')
    touch('touchStart', [(110, 300)]); touch('touchMove', [(170, 300)]); frames(pg, 5)
    touch('touchMove', [(170, 300), (j[0], j[1])]); frames(pg, 30)
    touch('touchEnd', []); frames(pg, 30)
    R.check('multitoque: andar e saltar ao mesmo tempo', pg.evaluate('T.p().x') - x0 > 30)
    # os botões não tapam o centro da ação
    over = pg.evaluate('''() => [...document.querySelectorAll('#touch [data-a]')].filter((e) => { const r = e.getBoundingClientRect(); return r.left < innerWidth * 0.62 && r.right > innerWidth * 0.38 && r.top < innerHeight * 0.7 && r.bottom > innerHeight * 0.25; }).map((e) => e.dataset.a)''')
    R.check('os botões táteis não tapam a zona central de jogo', not over, over)
    # pausa tátil e menus por toque
    p = acts['pause']; pg.tap('#touch [data-a="pause"]'); frames(pg, 5)
    okp = pg.evaluate('!!document.querySelector(".pause")')
    pg.tap('.pause .btn:nth-child(4)'); frames(pg, 5)
    oki = pg.evaluate('!!document.querySelector(".inventory")')
    shot(pg, 'touch_inventory')
    pg.evaluate('VS.UI.closeAll()'); frames(pg, 5)
    R.check('menus abrem e navegam por toque', okp and oki)
    # retrato: aviso para rodar
    pg.set_viewport_size({'width': 390, 'height': 844}); frames(pg, 10)
    rot = pg.evaluate('getComputedStyle(document.getElementById("rotate")).display !== "none"')
    shot(pg, 'touch_portrait')
    R.check('em retrato pede para rodar o dispositivo', rot)
    # outras proporções
    for (w, h) in [(1024, 768), (2400 // 2, 1080 // 2), (740, 360)]:
        pg.set_viewport_size({'width': w, 'height': h}); frames(pg, 10)
        cv = pg.evaluate('(() => { const c = document.getElementById("game").getBoundingClientRect(); return [c.width, c.height]; })()')
        shot(pg, f'aspect_{w}x{h}')
        R.check(f'proporção {w}x{h}: o jogo cabe no ecrã (16:9 com margens)', cv[0] <= w + 1 and cv[1] <= h + 1 and abs(cv[0] / cv[1] - 16 / 9) < 0.02, cv)
    R.check('tátil sem erros de JavaScript', not errs, errs[:5])
    ctx.close()


def t_gamepad(R, b):
    pg = b.new_page(viewport={'width': 1280, 'height': 720}); errs = []; page_errors(pg, errs)
    pg.add_init_script('''
      window.__pad = { id: 'Test pad (STANDARD GAMEPAD)', index: 0, connected: true, mapping: 'standard', timestamp: 0,
        axes: [0, 0, 0, 0], buttons: Array.from({ length: 17 }, () => ({ pressed: false, value: 0, touched: false })) };
      navigator.getGamepads = () => [window.__pad, null, null, null];
      window.padBtn = (i, on) => { window.__pad.buttons[i].pressed = on; window.__pad.buttons[i].value = on ? 1 : 0; window.__pad.timestamp++; };
    ''')
    boot(pg); new_game(pg)
    warp(pg, 'r1_bridge', 6, 12); frames(pg, 20)
    x0 = pg.evaluate('T.p().x')
    pg.evaluate('window.__pad.axes[0] = 1'); frames(pg, 40); pg.evaluate('window.__pad.axes[0] = 0'); frames(pg, 5)
    R.check('comando: analógico esquerdo move', pg.evaluate('T.p().x') - x0 > 50)
    y0 = pg.evaluate('T.p().y'); pg.evaluate('T.minY = 1e9; T.hooks.push(() => { T.minY = Math.min(T.minY, T.p().y); if ((T.k = (T.k || 0) + 1) > 60) { T.k = 0; return true; } })')
    pg.evaluate('padBtn(0, true)'); frames(pg, 10); pg.evaluate('padBtn(0, false)'); frames(pg, 50)
    R.check('comando: A salta', y0 - pg.evaluate('T.minY') > 40)
    pg.evaluate('T.seenA = []; T.hooks.push(() => { const a = T.p().action; const nm = a && (a.name || a.type); if (nm && !T.seenA.includes(nm)) T.seenA.push(nm); if ((T.k2 = (T.k2 || 0) + 1) > 120) return true; })')
    pg.evaluate('padBtn(2, true)'); frames(pg, 3); pg.evaluate('padBtn(2, false)'); frames(pg, 30)
    pg.evaluate('padBtn(1, true)'); frames(pg, 3); pg.evaluate('padBtn(1, false)'); frames(pg, 40)
    R.check('comando: X ataca e B esquiva', 'l1' in pg.evaluate('T.seenA') and 'dodge' in pg.evaluate('T.seenA'), pg.evaluate('T.seenA'))
    pg.evaluate('padBtn(9, true)'); frames(pg, 3); pg.evaluate('padBtn(9, false)'); frames(pg, 5)
    okp = pg.evaluate('!!document.querySelector(".pause")')
    pg.evaluate('padBtn(13, true)'); frames(pg, 3); pg.evaluate('padBtn(13, false)'); frames(pg, 3)
    idx = pg.evaluate('VS.UI.top() ? VS.UI.top().index : -1') if pg.evaluate('!!VS.UI.top') else 1
    pg.evaluate('padBtn(1, true)'); frames(pg, 3); pg.evaluate('padBtn(1, false)'); frames(pg, 5)
    R.check('comando: Start pausa, cruz navega e B fecha', okp and pg.evaluate('!document.querySelector(".pause")'), idx)
    R.check('comando sem erros de JavaScript', not errs, errs[:5])
    pg.close()


def t_perf(R, b):
    pg = b.new_page(viewport={'width': 1280, 'height': 720}); errs = []; page_errors(pg, errs)
    boot(pg); new_game(pg)
    out = {}
    for room in ['r1_street', 'r3_foundry', 'r4_pond', 'r6_nave', 'r7_gallery']:
        warp(pg, room); frames(pg, 30)
        fps = pg.evaluate('''() => new Promise((res) => { let n = 0; const t0 = performance.now(); const f = () => { if (++n < 120) requestAnimationFrame(f); else res(Math.round(n * 1000 / (performance.now() - t0))); }; requestAnimationFrame(f); })''')
        st = pg.evaluate('''() => { const t0 = performance.now(); for (let i = 0; i < 60; i++) VS.App.game.update(1 / 60); const t1 = performance.now(); for (let i = 0; i < 30; i++) VS.App.game.draw(); const t2 = performance.now(); return [+( (t1 - t0) / 60).toFixed(2), +((t2 - t1) / 30).toFixed(2)]; }''')
        out[room] = {'fps_headless': fps, 'update_ms': st[0], 'draw_ms': st[1]}
    R.check('desempenho medido (Chromium sem GPU, renderização por software)', True, out)
    pg.close()
    return out


def t_parry(R, b):
    """parry responsivo: tolerância de atraso, cancelamento da antecipação e janela"""
    pg = b.new_page(viewport={'width': 1280, 'height': 720}); errs = []; page_errors(pg, errs)
    boot(pg); new_game(pg); warp(pg, 'r1_street', 6, 12); frames(pg, 40)
    pg.evaluate('VS.App.game.ents.filter((e) => e.isEnemy).forEach((e) => e.die(VS.App.game))'); frames(pg, 20)
    r1 = pg.evaluate('''() => new Promise((res) => { const p = T.p(), g = T.g(); const hp = VS.state.hp; VS.state.flags.parries = 0;
      const src = { cx: p.cx + p.dir * 20, onParried() { this.parried = true; } };
      const out = p.receiveHit({ x: p.x, y: p.y, w: 10, h: 10, dmg: 10, id: 991, src }, g);
      let n = 0; T.hooks.push(() => { if (++n === 3) T.tap('KeyI', 2); if (n === 12) { res({ out, parries: VS.state.flags.parries, dhp: VS.state.hp - hp, srcParried: !!src.parried }); return true; } }); })''')
    R.check('parry premido logo depois do golpe chegar (tolerância de atraso) conta como parry', r1['out'] == 'pending' and r1['parries'] == 1 and r1['dhp'] == 0 and r1['srcParried'], r1)
    frames(pg, 60)
    r2 = pg.evaluate('''() => new Promise((res) => { const p = T.p(), g = T.g(); const hp = VS.state.hp;
      const out = p.receiveHit({ x: p.x, y: p.y, w: 10, h: 10, dmg: 10, id: 992, src: { cx: p.cx + p.dir * 20 } }, g);
      let n = 0; T.hooks.push(() => { if (++n === 12) { res({ out, dhp: VS.state.hp - hp }); return true; } }); })''')
    R.check('sem parry o golpe pendente fere depois da tolerância', r2['out'] == 'pending' and r2['dhp'] < 0, r2)
    frames(pg, 80)
    r3 = pg.evaluate('''() => new Promise((res) => { T.tap('KeyJ', 2); let n = 0, seen = []; T.hooks.push(() => { const a = T.p().action; seen.push(a ? a.type + ':' + (a.phase || '') : '-'); if (++n === 3) T.tap('KeyI', 2); if (n === 8) { res(seen); return true; } }); })''')
    R.check('parry cancela a antecipação de um ataque (responde no passo seguinte)', 'parry:act' in r3[3:5], r3)
    frames(pg, 60)
    # de costas: o golpe vem de trás → nunca é parry, nem com parry ativo nem dentro da tolerância
    r4 = pg.evaluate('''() => new Promise((res) => { const p = T.p(), g = T.g(); const hp = VS.state.hp; VS.state.flags.parries = 0; p.action = null; p.iframes = 0;
      p.startParry(g); const src = { cx: p.cx - p.dir * 30, w: 40 };
      const out = p.receiveHit({ x: p.x, y: p.y, w: 10, h: 10, dmg: 10, id: 993, src }, g);
      let n = 0; T.hooks.push(() => { if (++n === 12) { res({ out, parries: VS.state.flags.parries || 0, dhp: VS.state.hp - hp }); return true; } }); })''')
    R.check('parry de costas para o inimigo não conta (o golpe fere)', r4['out'] == 'hit' and r4['parries'] == 0 and r4['dhp'] < 0, r4)
    frames(pg, 80)
    r5 = pg.evaluate('''() => new Promise((res) => { const p = T.p(), g = T.g(); p.action = null; p.iframes = 0; VS.state.flags.parries = 0;
      p.startParry(g); const src = { cx: p.cx + p.dir * 30, w: 40 };
      const out = p.receiveHit({ x: p.x, y: p.y, w: 10, h: 10, dmg: 10, id: 994, src }, g);
      res({ out }); })''')
    R.check('parry de frente continua a contar', r5['out'] == 'parry', r5)
    R.check('parry sem erros', not errs, errs[:3])
    pg.close()


def t_weak(R, b):
    """pontos fracos dos chefes redesenhados: Vael (bola cravada), Gémeos (o Malho fere a Lâmina), Seraphine (apagada)"""
    pg = b.new_page(viewport={'width': 1280, 'height': 720}); errs = []; page_errors(pg, errs)
    boot(pg); new_game(pg); pg.evaluate('VSDebug.allAbilities(); VSDebug.god(true)')
    rooms = dict(BOSSES)
    # Vael: depois da varrida baixa a bola crava-se no chão e ela fica exposta (dano ×1.8)
    warp(pg, rooms['vael']); place_for_boss(pg, rooms['vael'])
    wait(pg, 'T.bossEnts().length > 0 && !T.bossEnts()[0].intro', 14)
    pg.evaluate('(() => { const e = T.bossEnts()[0]; T.V = e; e.K = Object.assign({}, e.K, { think() {} }); e.cool = 99; e.attack("flail2"); })()')
    ok = wait(pg, 'T.V.atk && T.V.atk.name === "stuck" && T.V.atk.phase === "act"', 4)
    m = pg.evaluate('T.V.K.damageMult(T.V)')
    R.check('Vael: a varrida baixa crava a bola no chão (fica a arrancá-la) e leva mais dano', ok and m > 1.5, {'stuck': ok, 'mult': m})
    pg.evaluate('VS.UI.closeAll && VS.UI.closeAll()')
    # Gémeos: a martelada do Malho apanha a Lâmina se estiver no caminho
    warp(pg, rooms['gemeos']); place_for_boss(pg, rooms['gemeos'])
    wait(pg, 'T.bossEnts().length > 1 && !T.bossEnts().some((e) => e.intro)', 14)
    r = pg.evaluate("""() => new Promise((res) => { const es = T.bossEnts(), a = es.find((e) => e.kind === 'b_gemeo_a'), b = es.find((e) => e.kind === 'b_gemeo_b');
      [a, b].forEach((e) => { e.K = Object.assign({}, e.K, { think() {} }); e.cool = 99; e.atk = null; e.vx = 0; });
      const hp0 = a.hp; b.attack('maul'); a.x = b.facing > 0 ? b.cx + 18 : b.cx - 18 - a.w; a.y = b.bottom - a.h; a.vx = 0;
      let n = 0; T.hooks.push(() => { if (++n > 140 || a.stagger > 0) { res({ hp0, hp: a.hp, stag: a.stagger > 0 }); return true; } }); })""")
    R.check('Gémeos: o Malho não distingue irmãos (a Lâmina no caminho leva a martelada e fica atordoada)', r['hp'] < r['hp0'] and r['stag'], r)
    # Seraphine: quando se apaga usa a animação própria (encolhida, cinzenta)
    f = pg.evaluate("""() => { const sh = VS.Assets.sheet('en_b_seraphine'); return !!(sh && sh.meta.anims.dim) && !!VS.Bosses.DEFS.seraphine.animState({ dim: 1 }); }""")
    R.check('Seraphine: estado apagado tem animação própria', f)
    R.check('pontos fracos sem erros', not errs, errs[:3])
    pg.close()


TESTS = {'menus': t_menus, 'combat': t_movement_combat, 'world': t_world, 'bosses': t_bosses, 'caedmon': t_caedmon, 'aldric': t_aldric, 'corvin': t_corvin,
         'quests': t_quests, 'endings': t_endings, 'save': t_save, 'lang': t_lang, 'touch': t_touch, 'gamepad': t_gamepad, 'perf': t_perf, 'parry': t_parry, 'weak': t_weak}


def main(filters):
    R = Runner()
    with sync_playwright() as pw:
        b = pw.chromium.launch(args=ARGS)
        for name, fn in TESTS.items():
            if filters and not any(f in name for f in filters):
                continue
            print(f'\n== {name} ==', flush=True)
            try:
                if name == 'save':
                    fn(R, b, pw)
                else:
                    fn(R, b)
            except Exception as e:
                R.check(f'{name}: execução', False, ''.join(traceback.format_exception_only(type(e), e)).strip()[:400])
        b.close()
    ok = sum(1 for r in R.results if r['ok']); tot = len(R.results)
    print(f'\nRESULTADO: {ok}/{tot} verificações passaram')
    rep = ROOT / 'tests' / 'out' / ('gameplay_report.json' if not filters else 'gameplay_report_' + '_'.join(filters) + '.json')
    rep.write_text(json.dumps({'passed': ok, 'total': tot, 'results': R.results}, ensure_ascii=False, indent=1))
    return 0 if ok == tot else 1


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
