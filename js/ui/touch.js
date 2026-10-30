// Vesperal — controlos táteis: joystick virtual + botões (multitoque), tamanho e opacidade configuráveis
'use strict';
(function (VS) {
  const In = VS.Input, U = VS.U;
  const Touch = { el: null, active: false, stick: { id: null, bx: 0, by: 0 } };
  const BTNS = [
    // ação, rótulo (símbolo), posição relativa ao canto inferior direito (em unidades base), tamanho
    { a: 'attack', icon: 'sword', x: 92, y: 74, s: 64 },
    { a: 'jump', icon: 'jump', x: 22, y: 112, s: 62 },
    { a: 'dodge', icon: 'dodge', x: 160, y: 46, s: 50 },
    { a: 'heavy', icon: 'heavy', x: 150, y: 120, s: 48 },
    { a: 'parry', icon: 'parry', x: 92, y: 158, s: 50 },
    { a: 'heal', icon: 'heal', x: 214, y: 100, s: 42 },
    { a: 'spell', icon: 'spell', x: 214, y: 156, s: 42 },
    { a: 'interact', icon: 'interact', x: 30, y: 196, s: 42 },
  ];
  const TOP = [{ a: 'pause', icon: 'pause' }, { a: 'inventory', icon: 'bag' }, { a: 'map', icon: 'map' }];
  const ICON = {
    sword: '<path d="M6 26 L22 10 L26 6 L24 12 L10 28 Z" fill="currentColor"/><path d="M5 21 L11 27" stroke="currentColor" stroke-width="2.5"/>',
    jump: '<path d="M16 6 L26 18 H20 V26 H12 V18 H6 Z" fill="currentColor"/>',
    dodge: '<path d="M4 16 H22 M16 9 L24 16 L16 23" stroke="currentColor" stroke-width="3" fill="none"/><path d="M4 10 H10 M4 22 H10" stroke="currentColor" stroke-width="2" opacity=".6"/>',
    heavy: '<rect x="8" y="5" width="16" height="9" rx="1" fill="currentColor"/><rect x="14.5" y="13" width="3" height="15" fill="currentColor"/>',
    parry: '<path d="M16 4 L27 9 V16 Q27 25 16 29 Q5 25 5 16 V9 Z" fill="none" stroke="currentColor" stroke-width="2.6"/><path d="M11 16 L15 20 L22 12" stroke="currentColor" stroke-width="2.4" fill="none"/>',
    heal: '<rect x="13" y="12" width="6" height="15" fill="currentColor"/><path d="M16 3 Q21 9 16 12 Q11 9 16 3Z" fill="currentColor"/>',
    spell: '<path d="M16 4 Q24 14 20 22 Q16 28 12 22 Q8 14 16 4Z" fill="currentColor"/>',
    interact: '<path d="M16 6 L24 16 H19 V26 H13 V16 H8 Z" fill="none" stroke="currentColor" stroke-width="2.4"/>',
    pause: '<rect x="9" y="7" width="5" height="18" fill="currentColor"/><rect x="18" y="7" width="5" height="18" fill="currentColor"/>',
    bag: '<path d="M8 12 H24 L22 27 H10 Z" fill="none" stroke="currentColor" stroke-width="2.4"/><path d="M12 12 Q12 5 16 5 Q20 5 20 12" fill="none" stroke="currentColor" stroke-width="2.2"/>',
    map: '<path d="M5 8 L12 5 L20 8 L27 5 V24 L20 27 L12 24 L5 27 Z" fill="none" stroke="currentColor" stroke-width="2.2"/><path d="M12 5 V24 M20 8 V27" stroke="currentColor" stroke-width="1.6"/>',
  };
  const svg = (k) => `<svg viewBox="0 0 32 32" width="56%" height="56%">${ICON[k]}</svg>`;

  Touch.init = function () {
    const el = document.getElementById('touch'); Touch.el = el;
    const stickZone = document.createElement('div'); stickZone.className = 'tc-stickzone'; el.appendChild(stickZone);
    const base = document.createElement('div'); base.className = 'tc-stick'; base.innerHTML = '<div class="tc-knob"></div>'; el.appendChild(base);
    Touch.base = base; Touch.knob = base.firstChild;
    stickZone.addEventListener('pointerdown', (e) => {
      if (Touch.stick.id !== null) return;
      Touch.stick.id = e.pointerId; stickZone.setPointerCapture(e.pointerId);
      const r = el.getBoundingClientRect();
      Touch.stick.bx = e.clientX; Touch.stick.by = e.clientY;
      base.style.left = (e.clientX - r.left) + 'px'; base.style.top = (e.clientY - r.top) + 'px'; base.classList.add('on');
      In.lastDevice = 'touch'; moveStick(e); e.preventDefault();
    });
    const moveStick = (e) => {
      if (e.pointerId !== Touch.stick.id) return;
      const R = 46 * (VS.settings.touch.size || 1);
      let dx = e.clientX - Touch.stick.bx, dy = e.clientY - Touch.stick.by;
      const d = Math.hypot(dx, dy); if (d > R) { dx *= R / d; dy *= R / d; }
      In.touchAxis.x = dx / R; In.touchAxis.y = dy / R;
      Touch.knob.style.transform = `translate(${dx}px,${dy}px)`;
    };
    stickZone.addEventListener('pointermove', moveStick);
    const endStick = (e) => { if (e.pointerId !== Touch.stick.id) return; Touch.stick.id = null; In.touchAxis.x = 0; In.touchAxis.y = 0; base.classList.remove('on'); Touch.knob.style.transform = ''; };
    stickZone.addEventListener('pointerup', endStick); stickZone.addEventListener('pointercancel', endStick);

    Touch.btns = BTNS.map((b) => {
      const d = document.createElement('div'); d.className = 'tc-btn tc-' + b.a; d.innerHTML = svg(b.icon); d.dataset.a = b.a;
      el.appendChild(d); bindBtn(d, b.a); return { el: d, b };
    });
    const top = document.createElement('div'); top.className = 'tc-top'; el.appendChild(top);
    TOP.forEach((b) => { const d = document.createElement('div'); d.className = 'tc-btn tc-small tc-' + b.a; d.dataset.a = b.a; d.innerHTML = svg(b.icon); top.appendChild(d); bindBtn(d, b.a); });
    Touch.layout();
    VS.events.on('resize', Touch.layout);
    window.addEventListener('touchstart', () => { In.lastDevice = 'touch'; Touch.refresh(); }, { passive: true });
    // telemóveis e tablets sem rato: as dicas e os avisos mostram logo os controlos táteis (e não as teclas)
    try { if (matchMedia('(pointer: coarse)').matches && !matchMedia('(any-pointer: fine)').matches) In.lastDevice = 'touch'; } catch (er) { }
  };
  function bindBtn(d, a) {
    const down = (e) => { e.preventDefault(); d.setPointerCapture(e.pointerId); In.touch[a] = true; In.touchTap[a] = true; d.classList.add('down'); In.lastDevice = 'touch'; if (a === 'jump' || a === 'attack') VS.Audio.init(); if (navigator.vibrate && (a === 'attack' || a === 'parry')) try { navigator.vibrate(8); } catch (er) { } };
    const up = (e) => { In.touch[a] = false; d.classList.remove('down'); };
    d.addEventListener('pointerdown', down); d.addEventListener('pointerup', up); d.addEventListener('pointercancel', up); d.addEventListener('lostpointercapture', up);
  }
  Touch.layout = function () {
    if (!Touch.el) return;
    const s = VS.settings.touch.size || 1;
    const vw = window.innerWidth, vh = window.innerHeight;
    const k = Math.min(1.2, Math.max(0.7, Math.min(vw, vh) / 400)) * s;
    Touch.btns.forEach(({ el, b }) => {
      const size = b.s * k;
      el.style.width = el.style.height = size + 'px';
      el.style.right = (b.x * k + 14) + 'px'; el.style.bottom = (b.y * k * 0.85 + 10 - size / 2 + 20) + 'px';
    });
    Touch.base.style.width = Touch.base.style.height = (110 * k) + 'px';
    Touch.el.style.setProperty('--tc-op', VS.settings.touch.opacity);
  };
  Touch.refresh = function () {
    if (!Touch.el) return;
    const mode = VS.settings.touch.show;
    const coarse = matchMedia('(pointer: coarse)').matches || ('ontouchstart' in window && navigator.maxTouchPoints > 0);
    Touch.active = mode === 'on' || (mode === 'auto' && (coarse || In.lastDevice === 'touch'));
    const inGame = VS.App && VS.App.mode === 'game' && !VS.UI.isOpen() && !VS.UI.isDialogueOpen();
    Touch.el.classList.toggle('show', Touch.active && inGame);
    Touch.el.classList.toggle('dialogue', Touch.active && VS.UI.isDialogueOpen());
    Touch.layout();
  };
  VS.Touch = Touch;
})(window.VS);
