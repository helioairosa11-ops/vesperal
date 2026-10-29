// Vesperal — interface: HUD (canvas), notificações, diálogo, painéis navegáveis (teclado, comando, rato, toque)
'use strict';
(function (VS) {
  const U = VS.U, In = VS.Input, A = VS.Audio;
  const UI = { stack: [], toasts: [], hpGhost: 100, bossGhost: 1, boss: null };
  const $ = (s, r) => (r || document).querySelector(s);
  const h = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html !== undefined) e.innerHTML = html; return e; };
  UI.$ = $; UI.h = h;
  const esc = (s) => String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
  UI.esc = esc;
  // texto com parágrafos (\n\n) e quebras (\n)
  UI.rich = (s) => esc(s).split(/\n\n/).map((p) => '<p>' + p.replace(/\n/g, '<br>') + '</p>').join('');

  UI.init = function () {
    UI.root = $('#ui');
    UI.toastEl = $('#toast'); UI.areaEl = $('#area-title');
  };

  // ================= PAINÉIS =================
  // painel: {el, onBack, onKey(action), focus index}
  UI.open = function (panel) {
    if (UI.stack.length) UI.stack[UI.stack.length - 1].el.classList.add('under');
    UI.stack.push(panel);
    UI.root.appendChild(panel.el);
    panel.el.classList.add('panel-open');
    // botão ✕ para fechar (rato e toque); faz o mesmo que Esc / Voltar
    if (panel.onBack && !panel.noX && !panel.el.querySelector(':scope > .panel-x')) {
      const x = h('button', 'panel-x'); x.type = 'button'; x.setAttribute('aria-label', VS.t('close'));
      x.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6 L18 18 M18 6 L6 18"/></svg>';
      x.addEventListener('click', (ev) => { ev.stopPropagation(); if (UI.top() === panel) { A.sfx('ui_back'); panel.onBack(); } });
      panel.el.appendChild(x);
    }
    UI.bindNav(panel);
    UI.focus(panel, panel.index || 0);
    In.clearAll();
    return panel;
  };
  UI.close = function (panel) {
    panel = panel || UI.stack[UI.stack.length - 1];
    if (!panel) return;
    const i = UI.stack.indexOf(panel);
    if (i >= 0) UI.stack.splice(i, 1);
    panel.el.remove();
    if (panel.onClose) panel.onClose();
    const top = UI.stack[UI.stack.length - 1];
    if (top) { top.el.classList.remove('under'); UI.refreshNav(top); }
    In.clearAll();
  };
  UI.closeAll = function () { while (UI.stack.length) UI.close(); };
  UI.top = () => UI.stack[UI.stack.length - 1];
  UI.isOpen = () => UI.stack.length > 0;
  UI.navItems = (panel) => Array.from(panel.el.querySelectorAll('[data-nav]')).filter((e) => !e.disabled && e.offsetParent !== null);
  UI.bindNav = function (panel) {
    panel.el.addEventListener('click', (ev) => {
      const t = ev.target.closest('[data-nav]');
      if (t && !t.disabled) { const items = UI.navItems(panel); panel.index = items.indexOf(t); UI.highlight(panel); }
    });
    panel.el.addEventListener('mouseover', (ev) => {
      const t = ev.target.closest('[data-nav]');
      if (t && UI.top() === panel) { const items = UI.navItems(panel); const i = items.indexOf(t); if (i >= 0 && i !== panel.index) { panel.index = i; UI.highlight(panel, true); } }
    });
  };
  UI.navGeo = function (items, cur, dx, dy) {
    if (!cur) return items.length ? 0 : -1;
    const r0 = cur.getBoundingClientRect(), c0 = [r0.left + r0.width / 2, r0.top + r0.height / 2];
    let best = -1, bd = 1e9;
    items.forEach((e, i) => {
      if (e === cur) return; const r = e.getBoundingClientRect(), c = [r.left + r.width / 2, r.top + r.height / 2];
      const ax = (c[0] - c0[0]) * dx + (c[1] - c0[1]) * dy; if (ax < 4) return;
      const off = Math.abs((c[0] - c0[0]) * dy) + Math.abs((c[1] - c0[1]) * dx);
      const d = ax + off * 2.2; if (d < bd) { bd = d; best = i; }
    });
    return best;
  };
  UI.refreshNav = function (panel) { const items = UI.navItems(panel); panel.index = U.clamp(panel.index || 0, 0, Math.max(0, items.length - 1)); UI.highlight(panel, true); };
  UI.focus = function (panel, i) { panel.index = i; UI.highlight(panel, true); };
  UI.highlight = function (panel, silent) {
    const items = UI.navItems(panel);
    items.forEach((e, j) => e.classList.toggle('focus', j === panel.index));
    const cur = items[panel.index];
    if (cur) { cur.scrollIntoView({ block: 'nearest' }); if (panel.onFocus) panel.onFocus(cur); }
    if (!silent) A.sfx('ui_move');
  };
  // chamado a cada frame pelo ciclo principal
  UI.update = function (dt) {
    const p = UI.top();
    if (UI.dlg) { UI.updateDialogue(dt); return; }
    if (!p) return;
    if (p.update) p.update(dt);
    if (p.rebinding) return;
    const items = UI.navItems(p);
    const cur = items[p.index];
    const rep = (a) => { if (In.pressed(a)) { p.held = a; p.heldT = 0; return true; } if (In.down(a) && p.held === a) { p.heldT += dt; if (p.heldT > 0.35) { p.heldT = 0.27; return true; } } return false; };
    if (p.onKey && ['ui_up', 'ui_down', 'ui_left', 'ui_right', 'ui_ok', 'ui_back', 'ui_tabL', 'ui_tabR'].some((a) => In.pressed(a) && p.onKey(a, cur) === true)) return;
    // grelhas: navegação geométrica (o vizinho mais próximo na direção premida), à prova de cabeçalhos e buracos
    if (p.grid) {
      const dirs = [['ui_down', 0, 1], ['ui_up', 0, -1], ['ui_left', -1, 0], ['ui_right', 1, 0]];
      for (const [a, dx, dy] of dirs) if (rep(a)) {
        const n = UI.navGeo(items, cur, dx, dy);
        if (n >= 0) { p.index = n; UI.highlight(p); } else if (dx && p.onTab && !p.noTabEdge) p.onTab(dx);
        return;
      }
    }
    if (rep('ui_down')) { if (p.cols) p.index = Math.min(items.length - 1, p.index + p.cols); else p.index = (p.index + 1) % Math.max(1, items.length); UI.highlight(p); }
    else if (rep('ui_up')) { if (p.cols) p.index = Math.max(0, p.index - p.cols); else p.index = (p.index - 1 + items.length) % Math.max(1, items.length); UI.highlight(p); }
    else if (rep('ui_left')) { if (cur && cur.dataset.slider !== undefined) UI.slide(cur, -1); else if (p.cols) { p.index = Math.max(0, p.index - 1); UI.highlight(p); } else if (p.onLeft) p.onLeft(); }
    else if (rep('ui_right')) { if (cur && cur.dataset.slider !== undefined) UI.slide(cur, 1); else if (p.cols) { p.index = Math.min(items.length - 1, p.index + 1); UI.highlight(p); } else if (p.onRight) p.onRight(); }
    else if (In.pressed('ui_tabL') && p.onTab) p.onTab(-1);
    else if (In.pressed('ui_tabR') && p.onTab) p.onTab(1);
    else if (In.pressed('ui_ok')) { if (cur) { A.sfx('ui_ok'); cur.click(); } }
    else if (In.pressed('ui_back')) { if (p.onBack) { A.sfx('ui_back'); p.onBack(); } }
  };
  UI.slide = function (el, d) {
    const inp = el.querySelector('input[type=range]');
    if (!inp) return;
    inp.value = U.clamp(parseFloat(inp.value) + d * parseFloat(inp.step || 0.1), parseFloat(inp.min), parseFloat(inp.max));
    inp.dispatchEvent(new Event('input'));
    A.sfx('ui_tab');
  };
  // construtor de painel simples: título + lista de botões
  UI.menu = function (opts) {
    const el = h('div', 'panel ' + (opts.cls || ''));
    if (opts.title) el.appendChild(h('h2', 'panel-title', esc(opts.title)));
    if (opts.text) el.appendChild(h('div', 'panel-text', UI.rich(opts.text)));
    const list = h('div', 'menu-list');
    (opts.items || []).forEach((it) => {
      if (!it) return;
      const b = h('button', 'btn' + (it.cls ? ' ' + it.cls : ''), esc(it.label));
      b.dataset.nav = '1'; if (it.disabled) { b.disabled = true; b.classList.add('disabled'); }
      if (it.sub) b.appendChild(h('span', 'btn-sub', esc(it.sub)));
      b.addEventListener('click', () => { if (!it.disabled) it.action(); });
      list.appendChild(b);
    });
    el.appendChild(list);
    const panel = { el, onBack: opts.onBack, index: opts.index || 0, onClose: opts.onClose };
    return UI.open(panel);
  };
  UI.confirm = function (text, yes, no) {
    const p = UI.menu({ cls: 'confirm', text, items: [{ label: VS.t('yes'), action: () => { UI.close(p); yes && yes(); } }, { label: VS.t('no'), action: () => { UI.close(p); no && no(); } }], index: 1, onBack: () => { UI.close(p); no && no(); } });
    return p;
  };

  // ================= NOTIFICAÇÕES =================
  UI.toast = function (text, secs) {
    const el = h('div', 'toast-item', esc(text));
    UI.toastEl.appendChild(el);
    setTimeout(() => el.classList.add('out'), (secs || 2.6) * 1000);
    setTimeout(() => el.remove(), (secs || 2.6) * 1000 + 600);
    while (UI.toastEl.children.length > 3) UI.toastEl.firstChild.remove();
  };
  // fala curta durante o combate: não bloqueia o jogo (legenda com o nome de quem fala)
  UI.bark = function (speaker, key, secs) {
    if (!UI.barkEl) { UI.barkEl = h('div', 'bark'); UI.root.appendChild(UI.barkEl); }
    const el = UI.barkEl;
    el.innerHTML = '<div class="bark-name">' + esc(VS.t(speaker)) + '</div><div class="bark-text">' + esc(VS.t(key)) + '</div>';
    el.classList.remove('show'); void el.offsetWidth; el.classList.add('show');
    clearTimeout(UI.barkT); UI.barkT = setTimeout(() => el.classList.remove('show'), (secs || 4.2) * 1000);
    if (VS.Audio) VS.Audio.sfx('ui_tab', { vol: 0.35 });
  };
  UI.areaTitle = function (name) {
    const el = UI.areaEl; el.innerHTML = '<span class="ornament"></span><div class="area-name">' + esc(name) + '</div><span class="ornament"></span>';
    el.classList.remove('show'); void el.offsetWidth; el.classList.add('show');
  };
  UI.itemGet = function (id, n) {
    const el = h('div', 'item-get');
    el.innerHTML = `<div class="ig-icon">${VS.Icons.svg(id)}</div><div><div class="ig-label">${esc(VS.t('obtained'))}</div><div class="ig-name">${esc(VS.t('item_' + id + '_name'))}${n > 1 ? ' ×' + n : ''}</div></div>`;
    UI.root.appendChild(el);
    setTimeout(() => el.classList.add('out'), 2600); setTimeout(() => el.remove(), 3300);
  };

  // ================= DIÁLOGO =================
  // lines: [{s: speakerKey|null, k: textKey, p: params}] ou chaves de texto
  UI.dialogue = function (lines, choices, cb) {
    lines = lines.map((l) => (typeof l === 'string' ? { k: l } : l));
    const el = h('div', 'dialogue');
    el.innerHTML = '<div class="dlg-speaker"></div><div class="dlg-text"></div><div class="dlg-choices"></div><div class="dlg-next">▼</div>';
    UI.root.appendChild(el);
    UI.dlg = { el, lines, i: 0, shown: 0, choices, cb, full: '', choiceIdx: 0, waitChoice: false };
    UI.dlgShow();
    el.addEventListener('click', (ev) => { if (ev.target.closest('.dlg-choice')) return; UI.dlgAdvance(); });
    In.clearAll();
  };
  UI.dlgShow = function () {
    const d = UI.dlg, l = d.lines[d.i];
    d.full = VS.t(l.k, l.p); d.shown = 0;
    d.el.querySelector('.dlg-speaker').textContent = l.s ? VS.t(l.s) : '';
    d.el.querySelector('.dlg-speaker').style.display = l.s ? '' : 'none';
    d.el.querySelector('.dlg-text').textContent = '';
    d.el.querySelector('.dlg-choices').innerHTML = '';
    d.el.classList.toggle('narration', !l.s);
  };
  UI.updateDialogue = function (dt) {
    const d = UI.dlg;
    if (d.shown < d.full.length) {
      d.shown = Math.min(d.full.length, d.shown + dt * 55 * (VS.settings.textSpeed || 1));
      d.el.querySelector('.dlg-text').textContent = d.full.slice(0, Math.floor(d.shown));
      if (Math.random() < 0.15) A.sfx('ui_tab', { vol: 0.15 });
    } else if (d.i === d.lines.length - 1 && d.choices && !d.waitChoice) UI.dlgChoices();
    if (d.waitChoice) {
      const items = Array.from(d.el.querySelectorAll('.dlg-choice'));
      if (In.pressed('ui_down')) { d.choiceIdx = (d.choiceIdx + 1) % items.length; A.sfx('ui_move'); }
      if (In.pressed('ui_up')) { d.choiceIdx = (d.choiceIdx - 1 + items.length) % items.length; A.sfx('ui_move'); }
      items.forEach((e, j) => e.classList.toggle('focus', j === d.choiceIdx));
      if (In.pressed('ui_ok')) items[d.choiceIdx].click();
      return;
    }
    if (In.pressed('ui_ok') || In.pressed('interact') || In.pressed('ui_back')) UI.dlgAdvance();
  };
  UI.dlgChoices = function () {
    const d = UI.dlg; d.waitChoice = true;
    const box = d.el.querySelector('.dlg-choices');
    d.choices.forEach((c, j) => {
      const b = h('button', 'dlg-choice', esc(VS.t(c)));
      b.addEventListener('click', () => { A.sfx('ui_ok'); UI.dlgEnd(j); });
      box.appendChild(b);
    });
    d.el.querySelector('.dlg-next').style.display = 'none';
  };
  UI.dlgAdvance = function () {
    const d = UI.dlg; if (!d || d.waitChoice) return;
    if (d.shown < d.full.length) { d.shown = d.full.length; d.el.querySelector('.dlg-text').textContent = d.full; return; }
    if (d.i < d.lines.length - 1) { d.i++; UI.dlgShow(); A.sfx('ui_tab', { vol: 0.4 }); return; }
    if (d.choices) { UI.dlgChoices(); return; }
    UI.dlgEnd(-1);
  };
  UI.dlgEnd = function (choice) {
    const d = UI.dlg; UI.dlg = null; d.el.remove(); In.clearAll();
    if (d.cb) d.cb(choice);
  };
  UI.isDialogueOpen = () => !!UI.dlg;

  // ================= HUD (canvas) =================
  UI.font = (px, w) => `${w || ''} ${px}px ${VS.FONT_TITLE}`;
  // HUD pintado (assets/ui/hud_*.png): medalhão-relicário com o Lume e a chama, barra de vida em moldura de
  // ferro forjado, círios votivos (cura) e urna de cinza; barra dos chefes em baixo
  const HI = (n) => VS.Assets.img('ui/' + n + '.png');
  const HM = (n) => (VS.HUD_META && VS.HUD_META[n]) || [10, 10];
  const hud = (ctx, n, x, y) => { const im = HI(n); if (!VS.Assets.ok(im)) return false; const [w, h] = HM(n); ctx.drawImage(im, x, y, w, h); return true; };
  function flame(ctx, x, y, s, t, k) {
    const f1 = Math.sin(t * 9) * 0.6 + Math.sin(t * 23) * 0.3, f2 = Math.sin(t * 13 + 1);
    VS.Sprites.glow(ctx, x, y - 2 * s, 9 * s, '#ff9a40', 0.35 + 0.25 * k);
    ctx.fillStyle = '#ff7a2a'; ctx.beginPath(); ctx.moveTo(x - 2.4 * s, y); ctx.quadraticCurveTo(x - 2.8 * s, y - 3 * s, x + f1 * 0.6 * s, y - (6.4 + f2 * 0.6) * s); ctx.quadraticCurveTo(x + 2.8 * s, y - 3 * s, x + 2.4 * s, y); ctx.quadraticCurveTo(x, y + 1.2 * s, x - 2.4 * s, y); ctx.fill();
    ctx.fillStyle = '#ffe0a0'; ctx.beginPath(); ctx.moveTo(x - 1.2 * s, y); ctx.quadraticCurveTo(x - 1.4 * s, y - 2 * s, x + f1 * 0.3 * s, y - (4.2 + f2 * 0.4) * s); ctx.quadraticCurveTo(x + 1.4 * s, y - 2 * s, x + 1.2 * s, y); ctx.quadraticCurveTo(x, y + 0.6 * s, x - 1.2 * s, y); ctx.fill();
  }
  UI.drawHUD = function (ctx, game) {
    const st = game.state;
    if (game.hideHUD) return;
    VS.Gfx.hudTransform(ctx);
    const t = game.time || 0;
    const mx = 8, my = 6, C = [mx + 26, my + 26];
    const painted = VS.Assets.ok(HI('hud_medallion'));
    // ---- medalhão e Lume
    if (painted) hud(ctx, 'hud_medallion', mx, my);
    else { ctx.fillStyle = 'rgba(10,8,12,0.75)'; ctx.beginPath(); ctx.arc(C[0], C[1], 16, 0, U.TAU); ctx.fill(); }
    const lk = U.clamp(st.lume / 100, 0, 1), ready = st.lume >= 33;
    ctx.save(); ctx.lineCap = 'round';
    ctx.strokeStyle = 'rgba(90,50,30,0.55)'; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.arc(C[0], C[1], 12.6, 0, U.TAU); ctx.stroke();
    if (lk > 0.005) {
      ctx.globalCompositeOperation = 'lighter';
      const pulse = ready ? 0.75 + 0.25 * Math.sin(t * 4) : 0.55;
      ctx.strokeStyle = `rgba(255,140,50,${0.5 * pulse})`; ctx.lineWidth = 4.6; ctx.beginPath(); ctx.arc(C[0], C[1], 12.6, -Math.PI / 2, -Math.PI / 2 + U.TAU * lk); ctx.stroke();
      ctx.strokeStyle = ready ? '#ffcf80' : '#c88a50'; ctx.lineWidth = 1.8; ctx.beginPath(); ctx.arc(C[0], C[1], 12.6, -Math.PI / 2, -Math.PI / 2 + U.TAU * lk); ctx.stroke();
      ctx.globalCompositeOperation = 'source-over';
    }
    ctx.restore();
    for (let i = 0; i < 3; i++) { const a = -Math.PI / 2 + U.TAU * i / 3; ctx.fillStyle = '#1a1014'; ctx.beginPath(); ctx.arc(C[0] + Math.cos(a) * 12.6, C[1] + Math.sin(a) * 12.6, 1.1, 0, U.TAU); ctx.fill(); }
    flame(ctx, C[0], C[1] + 4, 1.15 + lk * 0.35, t, lk);
    // ---- barra de vida
    const bw = 110 + st.hearts * 16, bx = mx + 50, by = my + 26 - 7;
    const ix = bx + 4, iy = by + 4, iw = bw - 4, ih = 6;
    ctx.fillStyle = 'rgba(14,6,8,0.92)'; ctx.fillRect(ix, iy, iw, ih);
    UI.hpGhost = U.approach(UI.hpGhost, st.hp, 0.6 * (VS.Gfx.fk || 1));
    const hk = U.clamp(st.hp / st.hpMax, 0, 1), gk = U.clamp(UI.hpGhost / st.hpMax, 0, 1);
    ctx.fillStyle = '#d8c4a4'; ctx.fillRect(ix, iy, iw * gk, ih);
    const gr = ctx.createLinearGradient(0, iy, 0, iy + ih); gr.addColorStop(0, '#e0404a'); gr.addColorStop(0.45, '#a81c28'); gr.addColorStop(1, '#4e0a12');
    ctx.fillStyle = gr; ctx.fillRect(ix, iy, iw * hk, ih);
    // brilho líquido a correr e realce
    ctx.save(); ctx.beginPath(); ctx.rect(ix, iy, iw * hk, ih); ctx.clip(); ctx.globalCompositeOperation = 'lighter';
    const sx = ix + ((t * 40) % (iw + 40)) - 20; const sg = ctx.createLinearGradient(sx - 20, 0, sx + 20, 0); sg.addColorStop(0, 'rgba(255,120,120,0)'); sg.addColorStop(0.5, 'rgba(255,150,140,0.25)'); sg.addColorStop(1, 'rgba(255,120,120,0)'); ctx.fillStyle = sg; ctx.fillRect(sx - 20, iy, 40, ih);
    ctx.fillStyle = 'rgba(255,220,210,0.22)'; ctx.fillRect(ix, iy + 0.6, iw * hk, 1.0);
    if (hk < 0.3) { ctx.fillStyle = `rgba(255,40,40,${0.18 + 0.15 * Math.sin(t * 8)})`; ctx.fillRect(ix, iy, iw * hk, ih); }
    ctx.restore();
    if (painted) {
      hud(ctx, 'hud_bar_l', bx, by);
      const [mw] = HM('hud_bar_m'); let x = bx + HM('hud_bar_l')[0];
      const end = bx + bw + 2;
      while (x < end) { const w = Math.min(mw, end - x); const im = HI('hud_bar_m'); if (VS.Assets.ok(im)) ctx.drawImage(im, 0, 0, im.width * (w / mw), im.height, x, by, w, HM('hud_bar_m')[1]); x += w; }
      hud(ctx, 'hud_bar_r', end, by - 3);
    } else { ctx.strokeStyle = '#6a5a50'; ctx.lineWidth = 0.8; ctx.strokeRect(ix - 1.5, iy - 1.5, iw + 3, ih + 3); }
    // ---- círios (cura)
    for (let i = 0; i < st.flasksMax; i++) {
      const lit = i < st.flasks, cx = bx + 6 + i * 11, cy = by + 15;
      if (painted) { hud(ctx, lit ? 'hud_candle_lit' : 'hud_candle_out', cx, cy); if (lit) flame(ctx, cx + 5, cy + 2.8, 0.42, t + i * 1.7, 0.6); else if (Math.sin(t * 2 + i) > 0.6) { ctx.fillStyle = 'rgba(160,150,150,0.25)'; ctx.beginPath(); ctx.arc(cx + 5.2 + Math.sin(t * 3 + i), cy + 7 - ((t * 6 + i * 3) % 6), 1.1, 0, U.TAU); ctx.fill(); } }
      else { ctx.fillStyle = lit ? '#e8dcc0' : '#3a3438'; ctx.fillRect(cx + 3, cy + 4, 4, 7); }
    }
    // ---- cinza
    const ay = by + 34, ashTxt = String(st.ash);
    if (painted) hud(ctx, 'hud_ash', bx + 4, ay - 1);
    ctx.font = UI.font(11); ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillText(ashTxt, bx + 21, ay + 7.6);
    ctx.fillStyle = '#efe4d2'; ctx.fillText(ashTxt, bx + 20, ay + 6.8);
    // efeitos ativos
    let bxf = bx + bw - 6;
    for (const b in st.buffs) {
      const im = VS.Assets.img('icons/' + b + '.png'), k = U.clamp(st.buffs[b] / 60, 0, 1);
      if (VS.Assets.ok(im)) ctx.drawImage(im, bxf - 8, by + 14, 16, 16); else { ctx.fillStyle = b === 'oil' ? '#ff8030' : '#a090c0'; ctx.beginPath(); ctx.arc(bxf, by + 22, 3.5, 0, U.TAU); ctx.fill(); }
      ctx.strokeStyle = 'rgba(255,200,140,0.7)'; ctx.lineWidth = 1.1; ctx.beginPath(); ctx.arc(bxf, by + 22, 8.6, -Math.PI / 2, -Math.PI / 2 + U.TAU * k); ctx.stroke();
      bxf -= 18;
    }
    // relógio opcional
    if (VS.settings.showTimer) { ctx.textAlign = 'right'; ctx.fillStyle = 'rgba(230,220,210,0.7)'; ctx.font = UI.font(10); ctx.fillText(U.fmtTime(st.playTime), U.SCREEN_W - 12, 14); }
    // ---- barra do chefe
    if (UI.boss && !UI.boss.dead) {
      const b = UI.boss, w = 300, x = (U.SCREEN_W - w) / 2, y = U.SCREEN_H - 30;
      ctx.textAlign = 'center'; ctx.font = UI.font(11);
      ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillText(VS.t(b.nameKey), U.SCREEN_W / 2 + 1, y - 7);
      ctx.fillStyle = '#efe0c8'; ctx.fillText(VS.t(b.nameKey), U.SCREEN_W / 2, y - 8);
      ctx.fillStyle = 'rgba(12,6,8,0.92)'; ctx.fillRect(x, y + 3.4, w, 4);
      UI.bossGhost = U.approach(UI.bossGhost, b.hp / b.maxHp, 0.004 * (VS.Gfx.fk || 1));
      ctx.fillStyle = '#d8c4a4'; ctx.fillRect(x, y + 3.4, w * UI.bossGhost, 4);
      const g2 = ctx.createLinearGradient(0, y + 3.4, 0, y + 7.4); g2.addColorStop(0, '#c8303a'); g2.addColorStop(1, '#5a0c14');
      ctx.fillStyle = g2; ctx.fillRect(x, y + 3.4, w * Math.max(0, b.hp / b.maxHp), 4);
      if (VS.Assets.ok(HI('hud_boss_m'))) {
        const [mw, mh] = HM('hud_boss_m'), im = HI('hud_boss_m');
        for (let xx = x; xx < x + w; xx += mw) { const ww = Math.min(mw, x + w - xx); ctx.drawImage(im, 0, 0, im.width * (ww / mw), im.height, xx, y, ww, mh); }
        const [lw] = HM('hud_boss_l'); hud(ctx, 'hud_boss_l', x - lw + 1, y - 4); hud(ctx, 'hud_boss_r', x + w - 1, y - 4);
      } else { ctx.strokeStyle = '#6a5a50'; ctx.lineWidth = 0.8; ctx.strokeRect(x - 1.5, y + 1.9, w + 3, 7); }
      if (b.postureMax) { ctx.fillStyle = 'rgba(8,6,10,0.85)'; ctx.fillRect(x + w * 0.2, y + 11, w * 0.6, 2.4); ctx.fillStyle = b.posture >= b.postureMax ? '#ffffff' : '#e8c060'; ctx.fillRect(x + w * 0.2, y + 11, w * 0.6 * Math.min(1, b.posture / b.postureMax), 2.4); }
    }
    ctx.textAlign = 'left';
  };
  UI.bossBar = function (b) { UI.boss = b; UI.bossGhost = 1; };
  UI.drawPrompt = function (ctx, e, game) {
    const key = e.promptKey ? e.promptKey() : 'act_interact';
    const label = VS.t(key);
    const k = VS.Input.label('interact') || '';
    const dev = VS.Input.lastDevice;
    const txt = (dev === 'touch' ? '' : '[' + (dev === 'pad' ? '↑' : k + '/' + VS.Input.label('up')) + '] ') + label;
    ctx.font = UI.font(8); const w = ctx.measureText(txt).width + 10;
    const x = e.cx - w / 2, y = e.y - 18 + Math.sin(game.time * 3) * 1.2;
    ctx.fillStyle = 'rgba(10,8,12,0.75)'; ctx.fillRect(x, y, w, 12);
    ctx.strokeStyle = 'rgba(220,190,140,0.5)'; ctx.lineWidth = 0.6; ctx.strokeRect(x, y, w, 12);
    ctx.fillStyle = '#efe4d2'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(txt, e.cx, y + 6.5); ctx.textAlign = 'left';
  };

  VS.UI = UI;
})(window.VS);
