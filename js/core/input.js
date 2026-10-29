// Vesperal — entrada: teclado (remapeável), rato, comando e toque, unificados por ações
'use strict';
(function (VS) {
  const U = VS.U;
  const ACTIONS = ['left', 'right', 'up', 'down', 'jump', 'attack', 'heavy', 'dodge', 'parry', 'heal', 'spell', 'interact', 'inventory', 'map', 'pause'];
  const UI_ACTIONS = ['ui_up', 'ui_down', 'ui_left', 'ui_right', 'ui_ok', 'ui_back', 'ui_tabL', 'ui_tabR'];
  // Ações remapeáveis no menu de controlos
  const REMAPPABLE = ['left', 'right', 'up', 'down', 'jump', 'attack', 'heavy', 'dodge', 'parry', 'heal', 'spell', 'interact', 'inventory', 'map', 'pause'];

  const DEFAULT_KEYS = {
    left: ['KeyA', 'ArrowLeft'], right: ['KeyD', 'ArrowRight'], up: ['KeyW', 'ArrowUp'], down: ['KeyS', 'ArrowDown'],
    jump: ['Space', 'KeyZ'], attack: ['KeyJ', 'KeyX', 'Mouse0'], heavy: ['KeyK', 'KeyV'], dodge: ['KeyL', 'ShiftLeft', 'KeyC'],
    parry: ['KeyI', 'KeyB', 'Mouse2'], heal: ['KeyF'], spell: ['KeyQ'], interact: ['KeyE'],
    inventory: ['Tab'], map: ['KeyM'], pause: ['Escape', 'KeyP'],
  };
  const UI_KEYS = {
    ui_up: ['ArrowUp', 'KeyW'], ui_down: ['ArrowDown', 'KeyS'], ui_left: ['ArrowLeft', 'KeyA'], ui_right: ['ArrowRight', 'KeyD'],
    ui_ok: ['Enter', 'Space', 'KeyJ', 'NumpadEnter'], ui_back: ['Escape', 'Backspace', 'KeyL'], ui_tabL: ['KeyQ', 'PageUp'], ui_tabR: ['KeyE', 'PageDown'],
  };
  // Comando (mapeamento "standard")
  const PAD = {
    jump: [0], attack: [2], heavy: [3], dodge: [1], parry: [5, 6], heal: [4], spell: [7], interact: [],
    inventory: [8], map: [11], pause: [9], up: [12], down: [13], left: [14], right: [15],
    ui_ok: [0], ui_back: [1], ui_tabL: [4], ui_tabR: [5], ui_up: [12], ui_down: [13], ui_left: [14], ui_right: [15],
  };

  const In = {
    ACTIONS, UI_ACTIONS, REMAPPABLE, DEFAULT_KEYS,
    keys: U.deepClone(DEFAULT_KEYS),
    raw: {},          // código -> pressionado
    latch: {},        // código -> premido desde o último passo (um toque mais curto que um passo lógico não se perde)
    touchTap: {},     // toques rápidos (premido e largado no mesmo frame): contam como um frame premido
    touch: {},        // ação -> pressionado (controlos táteis)
    touchAxis: { x: 0, y: 0 },
    padAxis: { x: 0, y: 0 },
    padConnected: false,
    padButtons: [],
    state: {},        // ação -> {down, pressed, released}
    buffer: {},       // ação -> tempo desde o último premir
    time: 0,
    lastDevice: 'keyboard',
    rebinding: null,  // {action, cb}
    mouseOverCanvas: false,
  };
  [...ACTIONS, ...UI_ACTIONS].forEach((a) => { In.state[a] = { down: false, pressed: false, released: false }; In.buffer[a] = 99; });

  In.setKeys = function (keys) {
    In.keys = U.deepClone(DEFAULT_KEYS);
    if (keys) for (const a in keys) if (In.keys[a] && Array.isArray(keys[a])) In.keys[a] = keys[a].slice();
  };

  function isTyping(e) { const t = e.target; return t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA'); }

  In.init = function (canvas) {
    window.addEventListener('keydown', (e) => {
      if (isTyping(e)) return;
      if (In.rebinding) {
        e.preventDefault();
        const rb = In.rebinding; In.rebinding = null;
        if (e.code !== 'Escape') rb.cb(e.code); else rb.cb(null);
        return;
      }
      In.raw[e.code] = true; if (!e.repeat) In.latch[e.code] = true; In.lastDevice = 'keyboard';
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.code)) e.preventDefault();
    });
    window.addEventListener('keyup', (e) => { In.raw[e.code] = false; });
    window.addEventListener('blur', () => { In.raw = {}; In.latch = {}; In.touch = {}; });
    if (canvas) {
      canvas.addEventListener('mousedown', (e) => { if (In.rebinding) { const rb = In.rebinding; In.rebinding = null; rb.cb('Mouse' + e.button); return; } In.raw['Mouse' + e.button] = true; In.latch['Mouse' + e.button] = true; In.lastDevice = 'keyboard'; });
      window.addEventListener('mouseup', (e) => { In.raw['Mouse' + e.button] = false; });
      canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    }
    window.addEventListener('gamepadconnected', () => { In.padConnected = true; if (VS.events) VS.events.emit('pad', true); });
    window.addEventListener('gamepaddisconnected', () => { In.padConnected = !!In.getPad(); if (VS.events) VS.events.emit('pad', In.padConnected); });
  };

  In.getPad = function () {
    if (!navigator.getGamepads) return null;
    const pads = navigator.getGamepads();
    for (const p of pads) if (p && p.connected) return p;
    return null;
  };

  function keyDown(action) {
    const codes = In.keys[action] || UI_KEYS[action] || [];
    for (const c of codes) if (In.raw[c] || In.latch[c]) return true;
    if (action.startsWith('ui_')) return false;
    return false;
  }

  // Chamado uma vez por frame lógico
  In.update = function (dt) {
    In.time += dt;
    const pad = In.getPad();
    In.padButtons = [];
    In.padAxis.x = 0; In.padAxis.y = 0;
    if (pad) {
      In.padConnected = true;
      for (let i = 0; i < pad.buttons.length; i++) In.padButtons[i] = pad.buttons[i].pressed || pad.buttons[i].value > 0.5;
      const ax = pad.axes[0] || 0, ay = pad.axes[1] || 0;
      In.padAxis.x = Math.abs(ax) > 0.25 ? ax : 0;
      In.padAxis.y = Math.abs(ay) > 0.35 ? ay : 0;
      if (In.padButtons.some((b) => b) || In.padAxis.x || In.padAxis.y) In.lastDevice = 'pad';
    }
    const all = [...ACTIONS, ...UI_ACTIONS];
    for (const a of all) {
      let down = keyDown(a);
      if (!down && (In.touch[a] || In.touchTap[a])) down = true;
      if (!down && pad && PAD[a]) for (const b of PAD[a]) if (In.padButtons[b]) down = true;
      // eixos analógicos
      if (!down) {
        if ((a === 'left' || a === 'ui_left') && (In.padAxis.x < -0.5 || In.touchAxis.x < -0.35)) down = true;
        if ((a === 'right' || a === 'ui_right') && (In.padAxis.x > 0.5 || In.touchAxis.x > 0.35)) down = true;
        if ((a === 'up' || a === 'ui_up') && (In.padAxis.y < -0.55 || In.touchAxis.y < -0.55)) down = true;
        if ((a === 'down' || a === 'ui_down') && (In.padAxis.y > 0.55 || In.touchAxis.y > 0.55)) down = true;
      }
      // Na UI, as teclas de movimento do jogo também navegam
      if (!down && a === 'ui_up' && keyDown('up')) down = true;
      if (!down && a === 'ui_down' && keyDown('down')) down = true;
      if (!down && a === 'ui_left' && keyDown('left')) down = true;
      if (!down && a === 'ui_right' && keyDown('right')) down = true;
      if (!down && a === 'ui_ok' && (keyDown('jump') || keyDown('attack'))) down = true;
      const s = In.state[a];
      s.pressed = down && !s.down;
      s.released = !down && s.down;
      s.down = down;
      if (s.pressed) In.buffer[a] = 0; else In.buffer[a] += dt;
    }
    In.touchTap = {};
    In.latch = {};
  };

  In.down = (a) => In.state[a].down;
  In.pressed = (a) => In.state[a].pressed;
  In.released = (a) => In.state[a].released;
  In.buffered = (a, win) => In.buffer[a] <= win;
  In.consume = (a) => { In.buffer[a] = 99; In.state[a].pressed = false; };
  In.axisX = function () {
    if (In.touchAxis.x && Math.abs(In.touchAxis.x) > 0.2) return U.clamp(In.touchAxis.x * 1.4, -1, 1);
    if (In.padAxis.x) return U.clamp(In.padAxis.x * 1.15, -1, 1);
    return (In.down('right') ? 1 : 0) - (In.down('left') ? 1 : 0);
  };
  In.clearAll = function () {
    for (const a in In.state) { In.state[a].pressed = false; In.buffer[a] = 99; }
    In.latch = {};
  };
  In.startRebind = function (action, cb) { In.rebinding = { action, cb }; };
  In.keyLabel = function (code) {
    if (!code) return '—';
    if (code.startsWith('Key')) return code.slice(3);
    if (code.startsWith('Digit')) return code.slice(5);
    const map = { Space: '␣', ArrowLeft: '←', ArrowRight: '→', ArrowUp: '↑', ArrowDown: '↓', ShiftLeft: 'Shift', ShiftRight: 'Shift', Escape: 'Esc', Enter: 'Enter', Tab: 'Tab', Mouse0: 'LMB', Mouse1: 'MMB', Mouse2: 'RMB', ControlLeft: 'Ctrl', Backspace: '⌫' };
    return map[code] || code;
  };
  In.padLabel = function (action) {
    const names = ['A', 'B', 'X', 'Y', 'LB', 'RB', 'LT', 'RT', 'Back', 'Start', 'LS', 'RS', '↑', '↓', '←', '→'];
    const b = PAD[action];
    return b && b.length ? names[b[0]] : '';
  };
  In.label = function (action) {
    if (In.lastDevice === 'pad' && In.padConnected) return In.padLabel(action) || In.keyLabel((In.keys[action] || [])[0]);
    if (In.lastDevice === 'touch') return '';
    return In.keyLabel((In.keys[action] || [])[0]);
  };

  VS.Input = In;
})(window.VS);
