// Vesperal — ecrãs: menu principal, ranhuras, pausa, inventário, mapa, Diário, definições, descanso, morte, loja, ferreiro
'use strict';
(function (VS) {
  const U = VS.U, UI = VS.UI, h = UI.h, esc = UI.esc, t = (k, p) => VS.t(k, p), A = VS.Audio, In = VS.Input;
  const M = {};

  // ================= MENU PRINCIPAL =================
  M.main = function () {
    UI.closeAll();
    const el = h('div', 'panel mainmenu');
    el.innerHTML = `<div class="logo"><div class="logo-title">VESPERAL</div><div class="logo-orn"><i></i><b></b><i></i></div><div class="logo-sub">${esc(t('subtitle'))}</div></div><div class="menu-list"></div><div class="mm-credit">Lourence Manuel</div><div class="mm-foot">${esc(t('mm_hint'))}</div>`;
    const list = el.querySelector('.menu-list');
    const prof = VS.Save.loadProfile();
    const add = (label, fn, dis) => { const b = h('button', 'btn', esc(label)); b.dataset.nav = 1; if (dis) { b.disabled = true; b.classList.add('disabled'); } b.onclick = () => { A.init(); fn(); }; list.appendChild(b); };
    const last = VS.Save.meta(prof.lastSlot) ? prof.lastSlot : [0, 1, 2].find((i) => VS.Save.meta(i));
    if (last !== undefined) add(t('mm_continue'), () => VS.App.loadSlot(last));
    add(t('mm_play'), () => M.slots());
    add(t('mm_settings'), () => M.settings());
    add(t('mm_credits'), () => M.credits(false));
    if (window.vesperalDesktop) add(t('mm_quit'), () => window.vesperalDesktop.quit());
    if (prof.endings && prof.endings.length) { const s = h('div', 'mm-endings', esc(t('mm_endings', { n: prof.endings.length }))); el.appendChild(s); }
    // o idioma escolhe-se só nas Definições (não no menu principal)
    UI.open({ el, onBack: () => { }, noX: true });
    A.playMusic('menu');
    A.setAmbience('sanct');
  };

  M.slots = function () {
    const el = h('div', 'panel slots');
    el.appendChild(h('h2', 'panel-title', esc(t('slots_title'))));
    const list = h('div', 'slot-list'); el.appendChild(list);
    const panel = { el, onBack: () => UI.close(panel) };
    for (let i = 0; i < VS.Save.SLOTS; i++) {
      const meta = VS.Save.meta(i);
      const b = h('button', 'slot'); b.dataset.nav = 1;
      if (meta) {
        const d = meta.data, reg = VS.ROOMS[d.room] ? VS.ROOMS[d.room].region : 'r1';
        const st = new VS.GameState(); st.load(d);
        b.innerHTML = `<div class="slot-n">${i + 1}</div><div class="slot-body"><div class="slot-region">${esc(t('reg_' + reg))}</div><div class="slot-info">${esc(t('slot_info', { time: U.fmtTime(d.playTime), embers: st.embers, pct: st.completion() }))}</div></div>`;
        b.onclick = () => M.slotActions(i, panel);
      } else {
        b.innerHTML = `<div class="slot-n">${i + 1}</div><div class="slot-body"><div class="slot-region empty">${esc(t('slot_empty'))}</div></div>`;
        b.onclick = () => { UI.closeAll(); VS.App.newGame(i); };
      }
      list.appendChild(b);
    }
    UI.open(panel);
  };
  M.slotActions = function (i, parent) {
    const p = UI.menu({ title: t('slot_n', { n: i + 1 }), items: [
      { label: t('slot_load'), action: () => { UI.closeAll(); VS.App.loadSlot(i); } },
      { label: t('slot_new'), action: () => UI.confirm(t('confirm_overwrite'), () => { UI.closeAll(); VS.Save.erase(i); VS.App.newGame(i); }) },
      { label: t('slot_erase'), action: () => UI.confirm(t('confirm_erase'), () => { VS.Save.erase(i); UI.close(p); UI.close(parent); M.slots(); }) },
      { label: t('back'), action: () => UI.close(p) },
    ], onBack: () => UI.close(p) });
  };

  // ================= PAUSA =================
  M.pause = function () {
    const g = VS.App.game; if (!g) return;
    VS.App.paused = true;
    const p = UI.menu({ cls: 'pause', title: t('pause_title'), items: [
      { label: t('pause_resume'), action: () => UI.close(p) },
      { label: t('pause_map'), action: () => M.map() },
      { label: t('pause_journal'), action: () => M.journal() },
      { label: t('pause_inventory'), action: () => M.inventory() },
      { label: t('pause_settings'), action: () => M.settings() },
      { label: t('pause_quit'), action: () => UI.confirm(t('confirm_quit'), () => { g.save(); VS.App.toMenu(); }) },
    ], onBack: () => UI.close(p), onClose: () => { VS.App.paused = false; } });
    const info = h('div', 'pause-info', esc(t('pause_info', { time: U.fmtTime(g.state.playTime), pct: g.state.completion(), deaths: g.state.deaths })));
    p.el.appendChild(info);
    A.sfx('ui_open');
  };

  // ================= INVENTÁRIO (independente da pausa) =================
  const INV_TABS = ['weapons', 'relics', 'consumables', 'key', 'quest'];
  M.inventory = function (tab) {
    const g = VS.App.game; if (!g) return;
    const st = g.state;
    VS.App.paused = true;
    const el = h('div', 'panel inventory');
    el.innerHTML = `<h2 class="panel-title">${esc(t('inv_title'))}</h2><div class="tabs"></div><div class="inv-body"><div class="inv-list"></div><div class="inv-desc"></div></div><div class="inv-foot"></div>`;
    const panel = { el, tab: INV_TABS.indexOf(tab || 'weapons'), onBack: () => UI.close(panel), onClose: () => { if (!UI.isOpen()) VS.App.paused = false; } };
    const tabs = el.querySelector('.tabs'), list = el.querySelector('.inv-list'), desc = el.querySelector('.inv-desc'), foot = el.querySelector('.inv-foot');
    INV_TABS.forEach((k, i) => { const b = h('button', 'tab', esc(t('inv_' + k))); b.onclick = () => { panel.tab = i; render(); A.sfx('ui_tab'); }; tabs.appendChild(b); });
    const showDesc = (id, extra) => {
      if (!id) { desc.innerHTML = `<div class="empty">${esc(t('inv_empty'))}</div>`; return; }
      const it = VS.ITEMS[id];
      desc.innerHTML = `<div class="desc-icon">${VS.Icons.svg(id)}</div><h3>${esc(t('item_' + id + '_name'))}</h3>` + (extra || '') + `<div class="desc-text">${UI.rich(t('item_' + id + '_desc'))}</div>`;
    };
    function render() {
      tabs.querySelectorAll('.tab').forEach((b, i) => b.classList.toggle('active', i === panel.tab));
      list.innerHTML = ''; foot.textContent = '';
      const k = INV_TABS[panel.tab];
      const entries = [];
      if (k === 'weapons') {
        // arsenal: cada arma com ícone pintado, números e traços; equipar com um toque
        st.weapons.forEach((wid) => entries.push({ id: 'w_' + wid, label: weaponLabel(st, wid), icon: VS.Icons.svg('w_' + wid), equipped: st.weaponId === wid, desc: () => M.weaponDesc(st, wid),
          act: () => { if (st.weaponId !== wid) { M.equipWeapon(g, wid); render(); } } }));
        // trajes
        const looks = ['capuz', 'sino'].filter((l) => st.hasLook(l));
        if (looks.length > 1) {
          entries.push({ header: t('inv_outfit') });
          looks.forEach((l) => { const id = l === 'sino' ? 'helm_sino' : 'look_capuz'; entries.push({ id, label: t('item_' + id + '_name'), icon: VS.Icons.svg(id), equipped: st.look === l, act: () => { if (st.look !== l) { M.setLook(g, l); render(); } } }); });
        }
        entries.push({ header: t('inv_tools') });
        if (st.abilities.spell) entries.push({ id: '__spell', label: t('item_ab_spell_name'), icon: VS.Icons.svg('ab_spell'), desc: () => `<div class="desc-icon">${VS.Icons.svg('ab_spell')}</div><h3>${esc(t('item_ab_spell_name'))}</h3><div class="stats">${esc(t('stat_spell', { n: st.spellDamage() }))}</div><div class="desc-text">${UI.rich(t('item_ab_spell_desc'))}</div>` });
        entries.push({ id: '__flask', label: t('flask_name', { n: st.flasksMax }), icon: VS.Icons.raw('candle'), desc: () => `<div class="desc-icon">${VS.Icons.raw('candle')}</div><h3>${esc(t('flask_name', { n: st.flasksMax }))}</h3><div class="desc-text">${UI.rich(t('flask_desc'))}</div>` });
      } else if (k === 'relics') {
        foot.textContent = t('inv_relic_slots', { n: st.equipped.length, m: st.relicSlots });
        st.relics.forEach((id) => entries.push({ id, label: t('item_' + id + '_name'), icon: VS.Icons.svg(id), equipped: st.equipped.includes(id), act: () => { if (st.equipped.includes(id)) st.unequip(id); else if (!st.equip(id)) { UI.toast(t('msg_no_slots')); A.sfx('ui_back'); return; } A.sfx('ui_ok'); render(); } }));
      } else if (k === 'consumables') {
        Object.keys(st.items).filter((id) => VS.ITEMS[id] && VS.ITEMS[id].cat === 'consumable').forEach((id) => entries.push({ id, label: t('item_' + id + '_name') + ' ×' + st.count(id), icon: VS.Icons.svg(id), act: () => M.useConsumable(id, render) }));
      } else if (k === 'key') {
        const ab = { dash: 'ab_dash', spell: 'ab_spell', wall: 'ab_wall', forge: 'ab_forge', double: 'ab_double', veil: 'ab_veil' };
        for (const a in ab) if (st.abilities[a]) entries.push({ id: ab[a], label: t('item_' + ab[a] + '_name'), icon: VS.Icons.svg(ab[a]) });
        Object.keys(st.items).filter((id) => VS.ITEMS[id] && VS.ITEMS[id].cat === 'key').forEach((id) => entries.push({ id, label: t('item_' + id + '_name'), icon: VS.Icons.svg(id), act: VS.ITEMS[id].letter ? () => VS.UI.letter(id) : null }));
        if (st.count('ash_steel')) entries.push({ id: 'ash_steel', label: t('item_ash_steel_name') + ' ×' + st.count('ash_steel'), icon: VS.Icons.svg('ash_steel') });
      } else if (k === 'quest') {
        Object.keys(st.items).filter((id) => VS.ITEMS[id] && VS.ITEMS[id].cat === 'quest').forEach((id) => entries.push({ id, label: t('item_' + id + '_name'), icon: VS.Icons.svg(id) }));
      }
      // grelha de casas ornamentadas: ícone, número e marca de equipado; o nome e a descrição aparecem ao lado
      list.className = 'inv-list inv-grid';
      const COLS = 5; let inRow = 0;
      const fill = () => { while (inRow % COLS) { list.appendChild(h('div', 'inv-slot empty')); inRow++; } };
      entries.forEach((en) => {
        if (en.header) { fill(); list.appendChild(h('div', 'inv-header', esc(en.header))); inRow = 0; return; }
        const b = h('button', 'inv-slot' + (en.equipped ? ' equipped' : '') + (en.act ? '' : ' passive')); b.dataset.nav = 1;
        const cnt = /×(\d+)$/.exec(en.label) || /\((\d+)\)$/.exec(en.label);
        b.innerHTML = `<span class="is-icon">${en.icon}</span>` + (cnt ? `<span class="is-count">${cnt[1]}</span>` : '') + (en.equipped ? '<span class="is-eq"></span>' : '');
        b.title = en.label; b.setAttribute('aria-label', en.label);
        b._en = en; b.onclick = () => { if (en.act) en.act(); };
        list.appendChild(b); inRow++;
      });
      const minSlots = 15; let total = list.querySelectorAll('.inv-slot').length;
      fill(); while (total < minSlots || list.querySelectorAll('.inv-slot').length % COLS) { list.appendChild(h('div', 'inv-slot empty')); total++; if (total > 60) break; }
      if (!entries.length) showDesc(null);
      UI.refreshNav(panel);
    }
    panel.onFocus = (b) => { const en = b._en; if (!en) return; if (en.desc) desc.innerHTML = en.desc(); else showDesc(en.id, en.equipped ? `<div class="tag">${esc(t('equipped'))}</div>` : ''); if (en.act) desc.insertAdjacentHTML('beforeend', `<div class="desc-hint">${esc(t(en.equipped ? 'inv_hint_unequip' : 'inv_hint_use'))}</div>`); };
    panel.onTab = (d) => { panel.tab = (panel.tab + d + INV_TABS.length) % INV_TABS.length; panel.index = 0; A.sfx('ui_tab'); render(); };
    panel.grid = true;
    panel.onKey = (a) => { if (a === 'ui_back') return false; return false; };
    UI.open(panel); render();
    A.sfx('ui_open');
  };
  // ---------- arsenal ----------
  const weaponLabel = (st, wid) => t('item_w_' + wid + '_name') + (st.weapon ? ' +' + st.weapon : '');
  const pips = (n) => '<span class="pips">' + '<i class="on"></i>'.repeat(n) + '<i></i>'.repeat(5 - n) + '</span>';
  M.weaponRatings = function (wid) {
    const W = VS.WEAPONS[wid], mv = VS.WEAPON_MOVES[W.cls].l1, tot = (mv.wind + mv.act + mv.rec) / (W.speed || 1);
    const speed = tot < 0.26 ? 5 : tot < 0.36 ? 4 : tot < 0.44 ? 3 : tot < 0.6 ? 2 : 1;
    const len = (VS.WEAPON_META && VS.WEAPON_META[wid] && VS.WEAPON_META[wid].len) || 13;
    const reach = len < 9 ? 1 : len < 15 ? 3 : len < 20.2 ? 4 : 5;
    const traits = [];
    if (W.armorBreak) traits.push('armor'); if (W.guardBreak) traits.push('guard'); if (W.spirit) traits.push('spirit');
    if (W.cls === 'facas') traits.push('agile', 'weak_armor'); if (W.long) traits.push('flying');
    if (W.spirit) traits.push('weak_armor_spirit');
    return { speed, reach, traits };
  };
  M.weaponDesc = function (st, wid) {
    const R = M.weaponRatings(wid);
    const rows = [
      [t('w_stat_damage'), st.weaponDamage(wid, 'light')], [t('w_stat_heavy'), st.weaponDamage(wid, 'heavy')],
      [t('w_stat_speed'), pips(R.speed) + ' ' + esc(t('w_speed_' + R.speed))], [t('w_stat_reach'), pips(R.reach) + ' ' + esc(t('w_reach_' + R.reach))],
    ].map(([a, b]) => `<div class="wrow"><span>${esc(a)}</span><b>${b}</b></div>`).join('');
    const traits = R.traits.map((k) => `<span class="trait ${k.startsWith('weak') ? 'bad' : 'good'}">${esc(t('w_trait_' + k))}</span>`).join('');
    return `<div class="desc-icon big">${VS.Icons.svg('w_' + wid)}</div><h3>${esc(weaponLabel(st, wid))}</h3>` + (st.weaponId === wid ? `<div class="tag">${esc(t('equipped'))}</div>` : '') +
      `<div class="wstats">${rows}</div><div class="traits">${traits}</div><div class="desc-text">${UI.rich(t('item_w_' + wid + '_desc'))}</div>`;
  };
  // carrega já as imagens da arma/traje para não haver um fotograma sem desenho
  const preloadHero = (st) => {
    const suf = st.look === 'sino' ? '_sino' : '', cls = st.weaponDef.cls;
    ['hero' + suf, 'hero_' + cls + suf].forEach((n) => { if (VS.SPRITE_META[n]) VS.Assets.img('sprites/' + n + '.png'); });
    VS.Assets.img('weapons/w_' + st.weaponId + '.png');
  };
  M.equipWeapon = function (g, wid) {
    const st = g.state; if (!st.weapons.includes(wid)) return;
    st.weaponId = wid; preloadHero(st);
    const p = g.player; if (p.action && (p.action.type === 'attack' || p.action.type === 'heavy')) p.action = null; p.trail.length = 0;
    A.sfx('equip'); UI.toast(t('msg_equip', { name: t('item_w_' + wid + '_name') }));
  };
  M.setLook = function (g, look) {
    const st = g.state; if (!st.hasLook(look)) return;
    st.look = look; preloadHero(st); A.sfx('equip');
  };
  M.useConsumable = function (id, cb) {
    const g = VS.App.game, st = g.state;
    if (!st.has(id)) return;
    if (id === 'salt') { if (st.hp >= st.hpMax) { UI.toast(t('msg_full_hp')); return; } st.hp = Math.min(st.hpMax, st.hp + 40); A.sfx('heal'); }
    else if (id === 'oil') { st.buffs.oil = 60; A.sfx('fire'); }
    else if (id === 'incense') { st.buffs.incense = 60; A.sfx('chime'); }
    else if (id === 'feather') { if (g.boss) { UI.toast(t('msg_cant_now')); return; } st.take(id); UI.closeAll(); VS.App.paused = false; g.travel(st.restId && st.altars[st.restId] ? st.restId : Object.keys(st.altars)[0]); return; }
    st.take(id); UI.toast(t('msg_used', { item: t('item_' + id + '_name') }));
    if (cb) cb();
  };

  // ================= MAPA =================
  const REG_COL = { r1: '#8a7a70', sanct: '#c09060', r2: '#6a8aa8', r3: '#c06a40', r4: '#5a9a7a', r5: '#a090c0', r6: '#b08ac0', r7: '#c05050', crypt: '#7a7a90' };
  M.map = function () {
    const g = VS.App.game; if (!g) return;
    VS.App.paused = true;
    const el = h('div', 'panel mapview');
    el.innerHTML = `<h2 class="panel-title">${esc(t('map_title'))}</h2><canvas class="map-canvas"></canvas><div class="map-legend">${esc(t('map_legend'))}</div><button class="btn small" data-nav="1">${esc(t('back'))}</button>`;
    const cv = el.querySelector('canvas');
    const cur = VS.ROOMS[g.room.id];
    const view = { x: (cur.x + cur.cw / 2), y: (cur.y + cur.ch / 2), z: 26 };
    const panel = { el, onBack: () => UI.close(panel), onClose: () => { if (!UI.isOpen()) VS.App.paused = false; } };
    el.querySelector('button').onclick = () => UI.close(panel);
    panel.update = (dt) => {
      const sp = 8 * dt;
      if (In.down('ui_left')) view.x -= sp; if (In.down('ui_right')) view.x += sp; if (In.down('ui_up')) view.y -= sp; if (In.down('ui_down')) view.y += sp;
      if (In.down('ui_tabL')) view.z = Math.max(10, view.z - 30 * dt); if (In.down('ui_tabR')) view.z = Math.min(60, view.z + 30 * dt);
      draw();
    };
    panel.onKey = (a) => ['ui_left', 'ui_right', 'ui_up', 'ui_down'].includes(a);
    let drag = null;
    cv.addEventListener('pointerdown', (e) => { drag = { x: e.clientX, y: e.clientY, vx: view.x, vy: view.y }; cv.setPointerCapture(e.pointerId); });
    cv.addEventListener('pointermove', (e) => { if (!drag) return; view.x = drag.vx - (e.clientX - drag.x) / view.z; view.y = drag.vy - (e.clientY - drag.y) / view.z; });
    cv.addEventListener('pointerup', () => { drag = null; });
    cv.addEventListener('wheel', (e) => { view.z = U.clamp(view.z * (e.deltaY < 0 ? 1.1 : 0.9), 10, 60); e.preventDefault(); }, { passive: false });
    function draw() {
      const r = cv.getBoundingClientRect(); const dpr = Math.min(2, window.devicePixelRatio || 1);
      if (cv.width !== Math.round(r.width * dpr)) { cv.width = Math.round(r.width * dpr); cv.height = Math.round(r.height * dpr); }
      const c = cv.getContext('2d'); c.setTransform(dpr, 0, 0, dpr, 0, 0);
      const W = r.width, H = r.height, z = view.z;
      c.fillStyle = '#0c0a0e'; c.fillRect(0, 0, W, H);
      const sx = (cx) => W / 2 + (cx - view.x) * z, sy = (cy) => H / 2 + (cy - view.y) * z;
      const st = g.state;
      const known = {};
      for (const id in VS.ROOMS) {
        if (!st.visited[id]) continue;
        const d = VS.ROOMS[id];
        // vizinhas por explorar
        for (let i = -1; i <= d.cw; i++) for (let j = -1; j <= d.ch; j++) { const nd = VS.World.roomAtCell(d.x + i, d.y + j); if (nd && !st.visited[nd.id]) known[nd.id] = nd; }
      }
      for (const id in known) { const d = known[id]; c.setLineDash([3, 3]); c.strokeStyle = 'rgba(200,190,170,0.35)'; c.lineWidth = 1; c.strokeRect(sx(d.x) + 2, sy(d.y) + 2, d.cw * z - 4, d.ch * z - 4); c.setLineDash([]); }
      for (const id in VS.ROOMS) {
        if (!st.visited[id]) continue;
        const d = VS.ROOMS[id];
        const x = sx(d.x), y = sy(d.y), w = d.cw * z, hh = d.ch * z;
        c.fillStyle = U.rgba(REG_COL[d.region] || '#888', 0.28); c.fillRect(x + 1, y + 1, w - 2, hh - 2);
        c.strokeStyle = REG_COL[d.region] || '#888'; c.lineWidth = 1.5; c.strokeRect(x + 1, y + 1, w - 2, hh - 2);
        // miniatura da sala
        if (z >= 20) { const R = VS.World.peek(id); const tw = w / R.w, th = hh / R.h; c.fillStyle = U.rgba(REG_COL[d.region] || '#888', 0.55); for (let ty = 0; ty < R.h; ty += 1) for (let tx = 0; tx < R.w; tx += 1) { const ch = R.grid[ty][tx]; if (ch === '#' || (ch === 'C') || (ch === 'F' && !(st.broken[id] || []).includes(tx + ',' + ty))) c.fillRect(x + tx * tw, y + ty * th, tw + 0.3, th + 0.3); } }
        (d.ents || []).forEach((e) => {
          if (e.t === 'altar' && st.altars[e.id]) { c.fillStyle = '#ffb050'; c.beginPath(); c.arc(x + (e.x / (d.cw * U.CELL_W)) * w, y + (e.y / (d.ch * U.CELL_H)) * hh, 3.5, 0, U.TAU); c.fill(); }
          if (e.t === 'boss' && st.bosses[e.boss]) { c.fillStyle = '#c04040'; c.font = '10px serif'; c.fillText('✝', x + (e.x / (d.cw * U.CELL_W)) * w - 3, y + hh / 2); }
        });
      }
      // jogador
      const pr = g.room, p = g.player;
      const px = sx(pr.cx + p.cx / (U.CELL_W * U.TILE)), py = sy(pr.cy + p.cy / (U.CELL_H * U.TILE));
      c.fillStyle = '#fff'; c.beginPath(); c.arc(px, py, 3.5 + Math.sin(performance.now() / 200), 0, U.TAU); c.fill();
      c.strokeStyle = '#ffb050'; c.lineWidth = 1.5; c.beginPath(); c.arc(px, py, 7, 0, U.TAU); c.stroke();
      c.fillStyle = 'rgba(230,220,200,0.8)'; c.font = '12px ' + VS.FONT_TITLE; c.textAlign = 'left';
      c.fillText(t('reg_' + pr.region), 12, 20);
    }
    UI.open(panel);
    A.sfx('ui_open');
  };

  // ================= DIÁRIO =================
  const J_TABS = ['chronicles', 'inscriptions', 'letters', 'bosses', 'bestiary'];
  M.journal = function () {
    const g = VS.App.game; if (!g) return;
    const st = g.state;
    VS.App.paused = true;
    const el = h('div', 'panel journal');
    el.innerHTML = `<h2 class="panel-title">${esc(t('journal_title'))}</h2><div class="tabs"></div><div class="inv-body"><div class="inv-list"></div><div class="inv-desc journal-text"></div></div>`;
    const panel = { el, tab: 0, onBack: () => UI.close(panel), onClose: () => { if (!UI.isOpen()) VS.App.paused = false; } };
    const tabs = el.querySelector('.tabs'), list = el.querySelector('.inv-list'), desc = el.querySelector('.inv-desc');
    J_TABS.forEach((k, i) => { const b = h('button', 'tab', esc(t('j_' + k))); b.onclick = () => { panel.tab = i; render(); }; tabs.appendChild(b); });
    function render() {
      tabs.querySelectorAll('.tab').forEach((b, i) => b.classList.toggle('active', i === panel.tab));
      list.innerHTML = ''; desc.innerHTML = '';
      const k = J_TABS[panel.tab], entries = [];
      if (k === 'chronicles') VS.LORE.chronicles.forEach((c) => { if (c.cond(st)) entries.push({ title: t(c.key + '_t'), text: t(c.key) }); });
      if (k === 'inscriptions') VS.LORE.inscriptions.forEach((id, i) => { if (st.inscriptions[id]) entries.push({ title: t('ins_label', { n: i + 1 }) + ' — ' + t('ins_' + id + '_t'), text: t('ins_' + id) }); });
      if (k === 'letters') ['letter_1', 'letter_2', 'letter_3'].forEach((id) => { if (st.has(id)) entries.push({ title: t('item_' + id + '_name'), text: t(id + '_text') }); });
      if (k === 'bosses') VS.LORE.bosses.forEach((b) => { if (st.bosses[b]) entries.push({ title: t('boss_' + b), text: t('bossj_' + b) }); });
      if (k === 'bestiary') Object.keys(VS.Enemies.KINDS).filter((kd) => !kd.startsWith('b_')).forEach((kind) => { if (st.bestiary[kind]) entries.push({ title: t('en_' + kind), text: t('enj_' + kind) + '\n\n' + t('j_kills', { n: st.bestiary[kind] }) }); });
      const totals = { inscriptions: VS.LORE.inscriptions.length, letters: 3, bosses: VS.LORE.bosses.length, bestiary: Object.keys(VS.Enemies.KINDS).filter((kd) => !kd.startsWith('b_')).length };
      if (totals[k]) list.appendChild(h('div', 'j-count', esc(t('j_found', { n: entries.length, m: totals[k] }))));
      if (!entries.length) list.appendChild(h('div', 'empty', esc(t('j_empty'))));
      entries.forEach((en) => { const b = h('button', 'inv-item', `<span class="ii-label">${esc(en.title)}</span>`); b.dataset.nav = 1; b._en = en; list.appendChild(b); });
      UI.refreshNav(panel);
    }
    panel.onFocus = (b) => { if (b._en) desc.innerHTML = `<h3>${esc(b._en.title)}</h3>${UI.rich(b._en.text)}`; };
    panel.onTab = (d) => { panel.tab = (panel.tab + d + J_TABS.length) % J_TABS.length; A.sfx('ui_tab'); render(); };
    panel.onLeft = () => panel.onTab(-1); panel.onRight = () => panel.onTab(1);
    UI.open(panel); render();
    A.sfx('ui_open');
  };

  // ================= DEFINIÇÕES =================
  const S_TABS = ['general', 'video', 'audio', 'controls', 'touch', 'access', 'data'];
  // ao mudar de idioma, todos os painéis abertos são reconstruídos já traduzidos
  M.rebuildAfterLang = function () {
    const tab = 0;
    if (VS.App.mode === 'game' && VS.App.game) { UI.closeAll(); VS.App.paused = false; M.pause(); }
    else if (VS.App.mode === 'menu') M.main();
    M.settings(tab);
  };
  // ecrã inteiro: a janela da versão de computador, ou a API do navegador (o pedido só vale com um clique ou tecla)
  let fsWant = null;
  const fsGet = () => (window.vesperalDesktop ? window.vesperalDesktop.isFullscreen() : fsWant !== null ? fsWant : !!document.fullscreenElement);
  function fsSet(v) {
    if (window.vesperalDesktop) { window.vesperalDesktop.setFullscreen(v); return; }
    fsWant = v; const done = () => { fsWant = null; };
    try { const p = v ? document.documentElement.requestFullscreen() : document.exitFullscreen(); if (p && p.then) p.then(done, done); else done(); } catch (e) { done(); }
  }
  M.settings = function () {
    const s = VS.settings;
    const el = h('div', 'panel settings');
    el.innerHTML = `<h2 class="panel-title">${esc(t('set_title'))}</h2><div class="tabs"></div><div class="set-body"></div>`;
    const panel = { el, tab: 0, onBack: () => { VS.App.applySettings(); UI.close(panel); } };
    const tabs = el.querySelector('.tabs'), body = el.querySelector('.set-body');
    S_TABS.forEach((k, i) => { const b = h('button', 'tab', esc(t('set_' + k))); b.onclick = () => { panel.tab = i; render(); }; tabs.appendChild(b); });
    const row = (label, ctrl) => { const r = h('div', 'set-row'); r.dataset.nav = 1; r.appendChild(h('span', 'set-label', esc(label))); r.appendChild(ctrl); return r; };
    const slider = (label, get, set, min, max, step) => {
      const inp = h('input'); inp.type = 'range'; inp.min = min; inp.max = max; inp.step = step; inp.value = get();
      const val = h('span', 'set-val', Math.round(get() * 100) + '%');
      inp.oninput = () => { set(parseFloat(inp.value)); val.textContent = Math.round(parseFloat(inp.value) * 100) + '%'; VS.App.applySettings(); };
      const wrap = h('span', 'set-ctrl'); wrap.appendChild(inp); wrap.appendChild(val);
      const r = row(label, wrap); r.dataset.slider = 1; return r;
    };
    const toggle = (label, get, set) => {
      const b = h('span', 'set-toggle', esc(get() ? t('on') : t('off')));
      const r = row(label, b); r.onclick = () => { set(!get()); b.textContent = get() ? t('on') : t('off'); VS.App.applySettings(); A.sfx('ui_tab'); };
      return r;
    };
    const choice = (label, opts, get, set) => {
      const b = h('span', 'set-toggle', '');
      const upd = () => { const o = opts.find((x) => x[0] === get()); b.textContent = o ? o[1] : ''; };
      upd();
      const r = row(label, b);
      const cyc = (d) => { const i = opts.findIndex((x) => x[0] === get()); set(opts[(i + d + opts.length) % opts.length][0]); upd(); VS.App.applySettings(); A.sfx('ui_tab'); };
      r.onclick = () => cyc(1); r._cycle = cyc;
      return r;
    };
    function render() {
      tabs.querySelectorAll('.tab').forEach((b, i) => b.classList.toggle('active', i === panel.tab));
      body.innerHTML = '';
      const k = S_TABS[panel.tab];
      if (k === 'general') {
        body.appendChild(choice(t('set_lang'), VS.I18N.SUPPORTED.map((l) => [l, VS.I18N.NAMES[l]]), () => s.lang, (v) => { s.lang = v; VS.I18N.set(v); VS.App.applySettings(); setTimeout(() => { M.rebuildAfterLang(); }, 0); }));
        body.appendChild(choice(t('set_zoom'), [[1, t('zoom_far')], [1.2, t('zoom_normal')], [1.4, t('zoom_near')], [1.6, t('zoom_closest')]], () => s.zoom || 1.4, (v) => { s.zoom = v; }));
        body.appendChild(slider(t('set_textspeed'), () => s.textSpeed, (v) => { s.textSpeed = v; }, 0.5, 2, 0.1));
        body.appendChild(toggle(t('set_timer'), () => s.showTimer, (v) => { s.showTimer = v; }));
      } else if (k === 'video') {
        body.appendChild(choice(t('set_quality'), [['auto', t('q_auto')], ['high', t('q_high')], ['medium', t('q_medium')], ['low', t('q_low')]], () => s.quality || 'auto', (v) => { s.quality = v; }));
        body.appendChild(choice(t('set_fpscap'), [[0, t('fps_display')], [60, '60'], [30, '30']], () => s.fpsCap || 0, (v) => { s.fpsCap = v; }));
        body.appendChild(toggle(t('set_showfps'), () => !!s.showFps, (v) => { s.showFps = v; }));
        if (window.vesperalDesktop || document.fullscreenEnabled) body.appendChild(toggle(t('set_fullscreen'), fsGet, fsSet));
        body.appendChild(toggle(t('set_particles'), () => s.particles !== false, (v) => { s.particles = v; }));
        body.appendChild(h('div', 'set-note', esc(t('set_video_note'))));
      } else if (k === 'audio') {
        body.appendChild(slider(t('set_master'), () => s.vol.master, (v) => { s.vol.master = v; }, 0, 1, 0.05));
        body.appendChild(slider(t('set_music'), () => s.vol.music, (v) => { s.vol.music = v; }, 0, 1, 0.05));
        body.appendChild(toggle(t('set_mute_music'), () => s.mute.music, (v) => { s.mute.music = v; }));
        body.appendChild(slider(t('set_sfx'), () => s.vol.sfx, (v) => { s.vol.sfx = v; }, 0, 1, 0.05));
        body.appendChild(toggle(t('set_mute_sfx'), () => s.mute.sfx, (v) => { s.mute.sfx = v; }));
        body.appendChild(slider(t('set_amb'), () => s.vol.amb, (v) => { s.vol.amb = v; }, 0, 1, 0.05));
        body.appendChild(toggle(t('set_mute_amb'), () => s.mute.amb, (v) => { s.mute.amb = v; }));
      } else if (k === 'controls') {
        body.appendChild(h('div', 'set-note', esc(t('set_remap_note'))));
        In.REMAPPABLE.forEach((a) => {
          const keys = In.keys[a] || [];
          const b = h('span', 'set-toggle', esc(keys.map(In.keyLabel).join(' / ')));
          const r = row(t('act_' + a), b);
          r.onclick = () => { b.textContent = t('set_press_key'); panel.rebinding = true; In.startRebind(a, (code) => { panel.rebinding = false; if (code) { const cur = In.keys[a].slice(); cur[0] = code; In.keys[a] = cur; s.keys = U.deepClone(In.keys); VS.App.applySettings(); } render(); }); };
          body.appendChild(r);
        });
        const rb = h('button', 'btn small', esc(t('set_reset_keys'))); rb.dataset.nav = 1; rb.onclick = () => { s.keys = null; In.setKeys(null); VS.App.applySettings(); render(); }; body.appendChild(rb);
        body.appendChild(h('div', 'set-note', esc(t('set_pad_layout'))));
      } else if (k === 'touch') {
        body.appendChild(choice(t('set_touch_show'), [['auto', t('auto')], ['on', t('on')], ['off', t('off')]], () => s.touch.show, (v) => { s.touch.show = v; }));
        body.appendChild(slider(t('set_touch_size'), () => s.touch.size, (v) => { s.touch.size = v; }, 0.7, 1.5, 0.05));
        body.appendChild(slider(t('set_touch_opacity'), () => s.touch.opacity, (v) => { s.touch.opacity = v; }, 0.2, 1, 0.05));
      } else if (k === 'access') {
        body.appendChild(slider(t('set_shake'), () => s.shake, (v) => { s.shake = v; }, 0, 1, 0.1));
        body.appendChild(toggle(t('set_flashes'), () => s.flashes, (v) => { s.flashes = v; }));
        body.appendChild(toggle(t('set_telegraphs'), () => s.telegraphs, (v) => { s.telegraphs = v; }));
      } else if (k === 'data') {
        body.appendChild(h('div', 'set-note', esc(t('set_data_note'))));
        for (let i = 0; i < VS.Save.SLOTS; i++) {
          const ex = h('button', 'btn small', esc(t('set_export', { n: i + 1 }))); ex.dataset.nav = 1;
          ex.onclick = () => { const code = VS.Save.exportSlot(i); if (!code) { UI.toast(t('slot_empty')); return; } M.textBox(t('set_export', { n: i + 1 }), code, true); };
          const im = h('button', 'btn small', esc(t('set_import', { n: i + 1 }))); im.dataset.nav = 1;
          im.onclick = () => M.textBox(t('set_import', { n: i + 1 }), '', false, (txt) => { if (VS.Save.importSlot(i, txt)) UI.toast(t('msg_imported')); else UI.toast(t('msg_import_fail')); });
          body.appendChild(ex); body.appendChild(im);
        }
      }
      UI.refreshNav(panel);
    }
    panel.onTab = (d) => { panel.tab = (panel.tab + d + S_TABS.length) % S_TABS.length; A.sfx('ui_tab'); render(); };
    panel.onKey = (a, cur) => {
      if ((a === 'ui_left' || a === 'ui_right') && cur && cur._cycle) { cur._cycle(a === 'ui_left' ? -1 : 1); return true; }
      if ((a === 'ui_left' || a === 'ui_right') && cur && cur.dataset.slider === undefined) { panel.onTab(a === 'ui_left' ? -1 : 1); return true; }
      return false;
    };
    UI.open(panel); render();
  };
  M.textBox = function (title, value, readonly, onOk) {
    const el = h('div', 'panel textbox');
    el.innerHTML = `<h2 class="panel-title">${esc(title)}</h2><textarea spellcheck="false"></textarea><div class="menu-list row"></div>`;
    const ta = el.querySelector('textarea'); ta.value = value; ta.readOnly = !!readonly;
    const panel = { el, onBack: () => UI.close(panel) };
    const row = el.querySelector('.menu-list');
    if (readonly) { const c = h('button', 'btn small', esc(t('copy'))); c.dataset.nav = 1; c.onclick = () => { ta.select(); try { navigator.clipboard.writeText(ta.value); } catch (e) { document.execCommand('copy'); } UI.toast(t('copied')); }; row.appendChild(c); }
    else { const o = h('button', 'btn small', esc(t('ok'))); o.dataset.nav = 1; o.onclick = () => { onOk(ta.value); UI.close(panel); }; row.appendChild(o); }
    const b = h('button', 'btn small', esc(t('back'))); b.dataset.nav = 1; b.onclick = () => UI.close(panel); row.appendChild(b);
    UI.open(panel);
  };

  // ================= DESCANSO =================
  M.rest = function (game, altar) {
    VS.App.paused = true;
    const p = UI.menu({ cls: 'rest', title: t(altar.nameKey), text: t('rest_text'), items: [
      { label: t('rest_travel'), action: () => M.travel(game), disabled: Object.keys(game.state.altars).length < 2 },
      { label: t('rest_relics'), action: () => M.inventory('relics') },
      { label: t('rest_leave'), action: () => UI.close(p) },
    ], onBack: () => UI.close(p), onClose: () => { VS.App.paused = false; game.endRest(true); } });
  };
  M.travel = function (game) {
    const st = game.state;
    const items = Object.keys(st.altars).filter((id) => id !== st.restId).map((id) => ({ label: t(st.altars[id].name), sub: t('reg_' + VS.ROOMS[st.altars[id].room].region), action: () => { UI.closeAll(); VS.App.paused = false; game.travel(id); } }));
    items.push({ label: t('back'), action: () => UI.close(p) });
    const p = UI.menu({ cls: 'travel', title: t('rest_travel'), items, onBack: () => UI.close(p) });
  };

  // ================= MORTE =================
  M.death = function (cb) {
    const el = h('div', 'panel death');
    el.innerHTML = `<div class="death-title">${esc(t('death_title'))}</div><div class="death-sub">${esc(t(VS.state.shade ? 'death_sub_ash' : 'death_sub'))}</div><button class="btn" data-nav="1">${esc(t('death_continue'))}</button>`;
    const panel = { el, onBack: () => { }, noX: true };
    el.querySelector('button').onclick = () => { UI.close(panel); cb(); };
    setTimeout(() => el.classList.add('show'), 30);
    UI.open(panel);
  };

  // ================= INSCRIÇÕES E CARTAS =================
  M.inscription = function (id, first) {
    VS.App.paused = true;
    const n = VS.LORE.inscriptions.indexOf(id) + 1;
    const p = UI.menu({ cls: 'inscription', title: t('ins_label', { n }) + ' — ' + t('ins_' + id + '_t'), text: t('ins_' + id), items: [{ label: t('close'), action: () => UI.close(p) }], onBack: () => UI.close(p), onClose: () => { if (!UI.isOpen()) VS.App.paused = false; } });
    if (first) { const c = Object.keys(VS.state.inscriptions).length; UI.toast(t('msg_inscriptions', { n: c, m: VS.LORE.inscriptions.length })); }
  };
  M.letter = function (id) {
    VS.App.paused = true;
    const p = UI.menu({ cls: 'letter', title: t('item_' + id + '_name'), text: t(id + '_text'), items: [{ label: t('close'), action: () => UI.close(p) }], onBack: () => UI.close(p), onClose: () => { if (!UI.isOpen()) VS.App.paused = false; } });
  };

  // ================= LOJA (Maren) =================
  M.shop = function (game, stock) {
    const st = game.state;
    VS.App.paused = true;
    const el = h('div', 'panel inventory shop');
    el.innerHTML = `<h2 class="panel-title">${esc(t('shop_title'))}</h2><div class="shop-ash"></div><div class="inv-body"><div class="inv-list"></div><div class="inv-desc"></div></div>`;
    const panel = { el, onBack: () => UI.close(panel), onClose: () => { if (!UI.isOpen()) VS.App.paused = false; } };
    const list = el.querySelector('.inv-list'), desc = el.querySelector('.inv-desc'), ash = el.querySelector('.shop-ash');
    function render() {
      ash.textContent = t('shop_ash', { n: st.ash });
      list.innerHTML = '';
      stock().forEach((s) => {
        const owned = s.unique && (st.relics.includes(s.id) || st.flags['bought_' + s.id]);
        const b = h('button', 'inv-item' + (owned ? ' disabled' : '')); b.dataset.nav = 1;
        b.innerHTML = `<span class="ii-icon">${VS.Icons.svg(s.id)}</span><span class="ii-label">${esc(t('item_' + s.id + '_name'))}</span><span class="ii-tag">${owned ? esc(t('sold')) : s.price}</span>`;
        b._s = s;
        b.onclick = () => {
          if (owned) return;
          if (st.ash < s.price) { A.sfx('ui_back'); UI.toast(t('msg_no_ash')); return; }
          const it = VS.ITEMS[s.id];
          if (it.max && st.count(s.id) >= it.max) { UI.toast(t('msg_full')); return; }
          st.ash -= s.price; st.give(s.id); if (s.unique) st.flags['bought_' + s.id] = true;
          A.sfx('pickup'); render(); game.save();
        };
        list.appendChild(b);
      });
      UI.refreshNav(panel);
    }
    panel.onFocus = (b) => { if (b._s) desc.innerHTML = `<div class="desc-icon">${VS.Icons.svg(b._s.id)}</div><h3>${esc(t('item_' + b._s.id + '_name'))}</h3><div class="desc-text">${UI.rich(t('item_' + b._s.id + '_desc'))}</div><div class="stats">${esc(t('shop_owned', { n: st.count(b._s.id) }))}</div>`; };
    UI.open(panel); render();
  };

  // ================= FERREIRO (Hrolf) =================
  M.smith = function (game, maxLevel) {
    const st = game.state;
    VS.App.paused = true;
    const lvl = st.weapon;
    const can = lvl < maxLevel && lvl < VS.UPGRADE_COST.length;
    const cost = can ? VS.UPGRADE_COST[lvl] : null;
    const text = can ? t('smith_text', { lvl: lvl, next: lvl + 1, steel: cost[0], ash: cost[1], have: st.count('ash_steel'), hash: st.ash }) : t(lvl >= VS.UPGRADE_COST.length ? 'smith_max' : 'smith_cap');
    const p = UI.menu({ cls: 'smith', title: t('smith_title'), text, items: [
      can ? { label: t('smith_upgrade'), action: () => {
        if (st.count('ash_steel') < cost[0] || st.ash < cost[1]) { A.sfx('ui_back'); UI.toast(t('msg_no_materials')); return; }
        st.take('ash_steel', cost[0]); st.ash -= cost[1]; st.weapon++; A.sfx('crush'); A.sfx('pickup_big');
        UI.toast(t('msg_upgraded', { n: st.weapon })); game.save(); UI.close(p); M.smith(game, maxLevel);
      } } : null,
      { label: t('back'), action: () => UI.close(p) },
    ], onBack: () => UI.close(p), onClose: () => { if (!UI.isOpen()) VS.App.paused = false; } });
  };

  // ================= CRÉDITOS =================
  M.credits = function (fromEnding, done) {
    const el = h('div', 'panel credits');
    el.innerHTML = `<div class="credits-roll">${t('credits_html')}</div><button class="btn small" data-nav="1">${esc(t('back'))}</button>`;
    const panel = { el, onBack: () => { UI.close(panel); if (done) done(); } };
    el.querySelector('button').onclick = panel.onBack;
    UI.open(panel);
    A.playMusic('credits');
  };

  VS.Menus = M;
  // ligações usadas pelo jogo
  UI.openRest = (g, a) => M.rest(g, a);
  UI.showDeath = (cb) => M.death(cb);
  UI.inscription = (id, first) => M.inscription(id, first);
  UI.letter = (id) => M.letter(id);
})(window.VS);
