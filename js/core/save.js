// Vesperal — gravação (3 ranhuras + cópia de segurança), definições e perfil global
'use strict';
(function (VS) {
  const U = VS.U;
  const PREFIX = 'vesperal_';
  const SCHEMA = 1;

  function store() {
    try { const k = '__vs_test'; localStorage.setItem(k, '1'); localStorage.removeItem(k); return localStorage; } catch (e) { return null; }
  }
  const mem = {}; // alternativa se localStorage estiver indisponível
  const LS = {
    get(k) { const s = store(); return s ? s.getItem(k) : (k in mem ? mem[k] : null); },
    set(k, v) { const s = store(); try { if (s) s.setItem(k, v); else mem[k] = v; return true; } catch (e) { console.error('save failed', e); return false; } },
    del(k) { const s = store(); if (s) s.removeItem(k); else delete mem[k]; },
  };

  function checksum(str) { return U.hash(str).toString(36); }

  const Save = {
    available: !!store(),
    SLOTS: 3,
  };

  // ---------- Definições ----------
  Save.defaultSettings = function () {
    return {
      lang: VS.I18N.detect(),
      vol: { master: 0.8, music: 0.7, sfx: 0.8, amb: 0.6 },
      mute: { music: false, sfx: false, amb: false },
      keys: null,
      touch: { show: 'auto', size: 1, opacity: 0.55 },
      shake: 1, flashes: true, textSpeed: 1, telegraphs: true, showTimer: false, zoom: 1.4, quality: 'auto', fpsCap: 0, showFps: false, particles: true,
    };
  };
  Save.loadSettings = function () {
    const d = Save.defaultSettings();
    try {
      const s = JSON.parse(LS.get(PREFIX + 'settings') || 'null');
      if (s) {
        Object.assign(d, s);
        d.vol = Object.assign(Save.defaultSettings().vol, s.vol || {});
        d.mute = Object.assign(Save.defaultSettings().mute, s.mute || {});
        d.touch = Object.assign(Save.defaultSettings().touch, s.touch || {});
      }
    } catch (e) { console.warn('settings corrupt', e); }
    return d;
  };
  Save.saveSettings = (s) => LS.set(PREFIX + 'settings', JSON.stringify(s));

  // ---------- Perfil (persistente entre partidas) ----------
  Save.loadProfile = function () {
    try { return Object.assign({ endings: [], lastSlot: 0 }, JSON.parse(LS.get(PREFIX + 'profile') || '{}')); } catch (e) { return { endings: [], lastSlot: 0 }; }
  };
  Save.saveProfile = (p) => LS.set(PREFIX + 'profile', JSON.stringify(p));

  // ---------- Partidas ----------
  function pack(slot, data) {
    const body = JSON.stringify(data);
    return JSON.stringify({ v: SCHEMA, slot, at: Date.now(), sum: checksum(body), body });
  }
  function unpack(str) {
    if (!str) return null;
    try {
      const o = JSON.parse(str);
      if (!o || o.v !== SCHEMA || typeof o.body !== 'string') return null;
      if (checksum(o.body) !== o.sum) return null;
      return { at: o.at, data: JSON.parse(o.body) };
    } catch (e) { return null; }
  }
  Save.write = function (slot, data) {
    const key = PREFIX + 'slot' + slot;
    const prev = LS.get(key);
    if (prev && unpack(prev)) LS.set(key + '_bak', prev);
    const ok = LS.set(key, pack(slot, data));
    const p = Save.loadProfile(); p.lastSlot = slot; Save.saveProfile(p);
    return ok;
  };
  Save.read = function (slot) {
    const key = PREFIX + 'slot' + slot;
    let r = unpack(LS.get(key));
    if (!r) { r = unpack(LS.get(key + '_bak')); if (r) console.warn('main save corrupt, using backup'); }
    return r ? r.data : null;
  };
  Save.meta = function (slot) {
    const key = PREFIX + 'slot' + slot;
    const r = unpack(LS.get(key)) || unpack(LS.get(key + '_bak'));
    return r ? { at: r.at, data: r.data } : null;
  };
  Save.erase = function (slot) { LS.del(PREFIX + 'slot' + slot); LS.del(PREFIX + 'slot' + slot + '_bak'); };
  Save.exportSlot = function (slot) {
    const s = LS.get(PREFIX + 'slot' + slot);
    return s ? btoa(unescape(encodeURIComponent(s))) : '';
  };
  Save.importSlot = function (slot, text) {
    try {
      const s = decodeURIComponent(escape(atob(text.trim())));
      if (!unpack(s)) return false;
      const o = JSON.parse(s); o.slot = slot;
      return LS.set(PREFIX + 'slot' + slot, JSON.stringify(o));
    } catch (e) { return false; }
  };
  Save.anySave = function () { for (let i = 0; i < Save.SLOTS; i++) if (Save.meta(i)) return true; return false; };

  VS.Save = Save;
})(window.VS);
