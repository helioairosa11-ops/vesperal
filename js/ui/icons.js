// Vesperal — ícones vetoriais (SVG) para itens, habilidades e menus
'use strict';
(function (VS) {
  const P = {
    feather_ash: '<path d="M8 28 C14 18 20 10 28 4 C26 14 20 22 10 27 Z" fill="#b8aca0"/><path d="M9 27 L26 6" stroke="#4a4040" stroke-width="1"/>',
    spark: '<circle cx="16" cy="16" r="9" fill="#ff8a30" opacity=".35"/><path d="M16 5 Q20 14 16 27 Q12 14 16 5Z" fill="#ffd080"/><circle cx="16" cy="17" r="3" fill="#fff4d0"/>',
    claw: '<path d="M8 26 Q10 12 14 6 M14 26 Q16 13 19 6 M20 26 Q22 14 25 8" stroke="#c8c0b8" stroke-width="2.4" fill="none" stroke-linecap="round"/><rect x="6" y="24" width="20" height="4" rx="1" fill="#5a5058"/>',
    hammer: '<rect x="14" y="10" width="3" height="18" fill="#6a4a30"/><rect x="7" y="5" width="18" height="8" rx="1" fill="#8a8088"/><rect x="22" y="6" width="3" height="6" fill="#ff8a30"/>',
    wings: '<path d="M16 16 Q6 4 3 10 Q4 18 16 17Z M16 16 Q26 4 29 10 Q28 18 16 17Z" fill="#d8ccb4"/><circle cx="9" cy="11" r="2" fill="#6a5a40"/><circle cx="23" cy="11" r="2" fill="#6a5a40"/><rect x="15" y="12" width="2" height="12" rx="1" fill="#3a3020"/>',
    veil: '<path d="M6 4 Q16 9 26 4 L24 28 Q16 24 8 28 Z" fill="#9a70ff" opacity=".6"/><path d="M10 8 Q14 16 11 26 M16 8 Q19 16 16 26 M22 8 Q24 16 21 26" stroke="#e0d0ff" stroke-width="1" fill="none"/>',
    ember: '<circle cx="16" cy="16" r="11" fill="#ff6a20" opacity=".3"/><path d="M16 4 Q24 14 20 22 Q16 28 12 22 Q8 14 16 4Z" fill="#ff9030"/><path d="M16 11 Q19 17 16 22 Q13 17 16 11Z" fill="#fff0b0"/>',
    letter: '<rect x="5" y="9" width="22" height="15" rx="1" fill="#e8dcc0"/><path d="M5 9 L16 18 L27 9" stroke="#8a6a50" fill="none"/><circle cx="16" cy="18" r="2.6" fill="#8a1a1a"/>',
    chalice: '<path d="M9 6 H23 Q23 16 16 18 Q9 16 9 6Z" fill="#c8a050"/><rect x="15" y="18" width="2" height="6" fill="#a08040"/><rect x="10" y="24" width="12" height="3" rx="1" fill="#a08040"/><path d="M14 8 L17 14" stroke="#3a2010" stroke-width="1"/>',
    key: '<circle cx="10" cy="16" r="5" fill="none" stroke="#c0a060" stroke-width="2.4"/><path d="M15 16 H28 M24 16 V21 M27 16 V20" stroke="#c0a060" stroke-width="2.4"/>',
    seal: '<circle cx="16" cy="16" r="10" fill="#8a1a1a"/><path d="M11 18 L13 11 L16 15 L19 11 L21 18 Z" fill="#e0b060"/>',
    medal: '<path d="M11 4 L16 12 L21 4" stroke="#6a1a2a" stroke-width="3" fill="none"/><circle cx="16" cy="19" r="7" fill="#b8a070"/><path d="M16 14 V24 M12 19 H20" stroke="#5a4020" stroke-width="1.6"/>',
    scroll: '<rect x="8" y="6" width="16" height="20" fill="#d8cca8"/><rect x="6" y="4" width="20" height="4" rx="2" fill="#a08a60"/><rect x="6" y="24" width="20" height="4" rx="2" fill="#a08a60"/><path d="M11 12 H21 M11 16 H21 M11 20 H18" stroke="#6a5a40"/>',
    ingot: '<path d="M5 22 L9 12 H25 L27 22 Z" fill="#7a7488"/><path d="M9 12 H25 L23 15 H11 Z" fill="#a8a2b8"/><path d="M12 18 H20" stroke="#ff8a30" stroke-width="1.2"/>',
    candle: '<rect x="13" y="12" width="6" height="15" fill="#e8dcc0"/><path d="M16 4 Q20 9 16 12 Q12 9 16 4Z" fill="#ffc060"/>',
    heart: '<path d="M16 27 Q4 18 6 11 Q8 5 16 10 Q24 5 26 11 Q28 18 16 27Z" fill="#7a2028"/><path d="M16 22 Q11 17 12 13" stroke="#ff8070" fill="none"/>',
    socket: '<circle cx="16" cy="16" r="10" fill="none" stroke="#c0a060" stroke-width="2.4"/><circle cx="16" cy="16" r="4" fill="#3a3040"/>',
    oil: '<path d="M11 10 H21 L23 26 H9 Z" fill="#5a3a20"/><rect x="13" y="5" width="6" height="5" fill="#3a2a18"/><path d="M12 18 Q16 14 20 18" stroke="#ff8030" stroke-width="2" fill="none"/>',
    incense: '<rect x="14" y="10" width="4" height="16" fill="#6a5a7a"/><path d="M16 9 Q12 5 16 2 Q20 5 16 9" fill="#c0b0d0" opacity=".7"/><circle cx="16" cy="10" r="1.6" fill="#ff8040"/>',
    salt: '<path d="M8 12 H24 L22 27 H10 Z" fill="#c8c0b0"/><circle cx="12" cy="9" r="2" fill="#f0f0f0"/><circle cx="17" cy="7" r="2.4" fill="#f0f0f0"/><circle cx="21" cy="10" r="1.8" fill="#f0f0f0"/>',
    feather: '<path d="M6 27 C12 20 20 10 27 5 C25 13 18 21 8 26 Z" fill="#3a3640"/><path d="M7 26 L25 7" stroke="#8a8098" stroke-width="1"/>',
    relic: '<path d="M16 4 L26 14 L16 28 L6 14 Z" fill="#6a4a8a"/><path d="M16 4 L26 14 L16 16 Z" fill="#9a7ac0"/><circle cx="16" cy="14" r="3" fill="#ffe0a0"/>',
    sword: '<path d="M16 3 L18.5 7 L18.5 22 L13.5 22 L13.5 7 Z" fill="#cfd2da"/><rect x="9" y="22" width="14" height="2.6" fill="#8a7a60"/><rect x="14.6" y="24.5" width="2.8" height="5" fill="#4a4050"/>',
  };
  const RELIC_COL = { r_rosary: '#c08090', r_amber: '#e0a040', r_raven_eye: '#4060a0', r_heron: '#a0c0d0', r_captain: '#c0c0d0', r_ember: '#ff7030', r_hrolf_hammer: '#8a8088', r_chalice_shard: '#c8a050', r_ione_ribbon: '#e0d0f0', r_hairshirt: '#8a4a3a', r_anchor: '#5a6070', r_lantern: '#ffd080', r_hilde_blade: '#ff9040' };
  const RAW_PNG = { candle: 'icons/flask.png' };
  const Icons = {
    svg(id) {
      const it = VS.ITEMS[id];
      if (it && it.png) return Icons.png(it.png);
      let icon = it ? it.icon : id;
      let body = P[icon] || P.relic;
      if (it && it.cat === 'relic') body = P.relic.replace('#6a4a8a', RELIC_COL[id] || '#6a4a8a');
      return '<svg viewBox="0 0 32 32" width="100%" height="100%" aria-hidden="true">' + body + '</svg>';
    },
    // ícone pintado (PNG do ateliê)
    png(path) { return '<img class="icon-png" src="assets/' + path + '" alt="" draggable="false">'; },
    // ícones soltos (não são objetos): o círio da cura usa o ícone pintado
    raw(name) { if (RAW_PNG[name]) return Icons.png(RAW_PNG[name]); return '<svg viewBox="0 0 32 32" width="100%" height="100%" aria-hidden="true">' + (P[name] || '') + '</svg>'; },
  };
  VS.Icons = Icons;
})(window.VS);
