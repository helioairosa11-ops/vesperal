// Vesperal — utilitários partilhados
'use strict';
window.VS = window.VS || {};
(function (VS) {
  const U = {};
  U.TILE = 20;            // unidades lógicas por tile
  U.CELL_W = 32;          // tiles por célula do mapa (largura)
  U.CELL_H = 18;          // tiles por célula do mapa (altura)
  U.SCREEN_W = 640;       // resolução lógica do ecrã (HUD, menus, finais)
  U.SCREEN_H = 360;
  U.VIEW_W = 640;         // área do mundo à vista (menor = câmara mais perto)
  U.VIEW_H = 360;
  U.ZOOM = 1;
  U.setZoom = function (z) { U.ZOOM = z || 1; U.VIEW_W = Math.round(U.SCREEN_W / U.ZOOM); U.VIEW_H = Math.round(U.SCREEN_H / U.ZOOM); };
  U.DT = 1 / 60;

  U.clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  U.lerp = (a, b, t) => a + (b - a) * t;
  U.sign = (v) => (v > 0 ? 1 : v < 0 ? -1 : 0);
  U.approach = (v, target, step) => (v < target ? Math.min(v + step, target) : Math.max(v - step, target));
  U.dist = (ax, ay, bx, by) => Math.hypot(bx - ax, by - ay);
  U.rand = (a, b) => a + Math.random() * (b - a);
  U.randi = (a, b) => Math.floor(U.rand(a, b + 1));
  U.pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  U.chance = (p) => Math.random() < p;
  U.TAU = Math.PI * 2;

  // Easing
  U.ease = {
    inQuad: (t) => t * t,
    outQuad: (t) => 1 - (1 - t) * (1 - t),
    inOutQuad: (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2),
    outCubic: (t) => 1 - Math.pow(1 - t, 3),
    inCubic: (t) => t * t * t,
    outBack: (t) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); },
    inBack: (t) => { const c1 = 1.70158, c3 = c1 + 1; return c3 * t * t * t - c1 * t * t; },
    outExpo: (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)),
  };

  // RNG determinístico (mulberry32) — para arte procedimental estável
  U.rng = function (seed) {
    let a = seed >>> 0;
    const f = function () {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    f.range = (lo, hi) => lo + f() * (hi - lo);
    f.int = (lo, hi) => Math.floor(lo + f() * (hi - lo + 1));
    f.pick = (arr) => arr[Math.floor(f() * arr.length)];
    return f;
  };
  U.hash = function (str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  };

  // AABB
  U.overlap = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  U.rect = (x, y, w, h) => ({ x, y, w, h });
  U.pointIn = (px, py, r) => px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h;

  // Cores
  U.hexToRgb = function (hex) {
    const h = hex.replace('#', '');
    const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  };
  U.rgba = function (hex, a) { const [r, g, b] = U.hexToRgb(hex); return `rgba(${r},${g},${b},${a})`; };
  U.mix = function (h1, h2, t) {
    const a = U.hexToRgb(h1), b = U.hexToRgb(h2);
    const c = a.map((v, i) => Math.round(U.lerp(v, b[i], t)));
    return '#' + c.map((v) => v.toString(16).padStart(2, '0')).join('');
  };

  U.fmtTime = function (sec) {
    sec = Math.floor(sec);
    const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
    return (h > 0 ? h + ':' + String(m).padStart(2, '0') : m) + ':' + String(s).padStart(2, '0');
  };

  // Pequeno emissor de eventos
  U.Emitter = class {
    constructor() { this.h = {}; }
    on(ev, fn) { (this.h[ev] = this.h[ev] || []).push(fn); return () => this.off(ev, fn); }
    off(ev, fn) { if (this.h[ev]) this.h[ev] = this.h[ev].filter((f) => f !== fn); }
    emit(ev, ...args) { (this.h[ev] || []).slice().forEach((f) => f(...args)); }
  };

  U.deepClone = (o) => JSON.parse(JSON.stringify(o));

  VS.U = U;
})(window.VS);
