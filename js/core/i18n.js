// Vesperal — localização (exclusivamente EN, PT, ES, FR)
'use strict';
(function (VS) {
  VS.LANG = VS.LANG || {};
  const SUPPORTED = ['en', 'pt', 'es', 'fr'];
  const NAMES = { en: 'English', pt: 'Português', es: 'Español', fr: 'Français' };
  const I = { lang: 'en', SUPPORTED, NAMES, missing: new Set() };

  I.detect = function () {
    const nav = (navigator.languages && navigator.languages[0]) || navigator.language || 'en';
    const code = nav.slice(0, 2).toLowerCase();
    return SUPPORTED.includes(code) ? code : 'en';
  };

  I.set = function (lang) {
    if (!SUPPORTED.includes(lang)) lang = 'en';
    I.lang = lang;
    document.documentElement.lang = lang;
    if (VS.events) VS.events.emit('lang', lang);
  };

  // t('key', {n: 3}) -> texto com {n} substituído
  I.t = function (key, params) {
    let s = VS.LANG[I.lang] && VS.LANG[I.lang][key];
    if (s === undefined) {
      if (!I.missing.has(I.lang + ':' + key)) { I.missing.add(I.lang + ':' + key); console.warn('[i18n] falta', I.lang, key); }
      s = (VS.LANG.en && VS.LANG.en[key]) !== undefined ? VS.LANG.en[key] : key;
    }
    if (Array.isArray(s)) s = s.join('\n');
    if (params) s = s.replace(/\{(\w+)\}/g, (m, k) => (params[k] !== undefined ? params[k] : m));
    return s;
  };
  I.has = (key) => !!(VS.LANG[I.lang] && VS.LANG[I.lang][key] !== undefined);
  // dicas de controlos conforme o aparelho em uso (toque / comando), se houver texto próprio
  I.dev = function (key) { const d = VS.Input && VS.Input.lastDevice; const alt = key + (d === 'touch' ? '_touch' : d === 'pad' ? '_pad' : ''); return alt !== key && I.has(alt) ? alt : key; };

  VS.I18N = I;
  VS.t = I.t;
})(window.VS);
