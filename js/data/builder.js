// Vesperal — construtor de salas por coordenadas (evita erros de contagem em mapas ASCII)
// Uso: VS.room('id', {region, x, y, w, h, ...}, (b) => { b.fill(); b.carve(...); ... });
'use strict';
(function (VS) {
  const U = VS.U;
  VS.ROOMS = VS.ROOMS || {};
  class B {
    constructor(w, h, seed) { this.W = w; this.H = h; this.g = []; for (let y = 0; y < h; y++) this.g.push(new Array(w).fill('#')); this.ents = []; this.props = []; this.rnd = U.rng(seed || 1); }
    in(x, y) { return x >= 0 && y >= 0 && x < this.W && y < this.H; }
    put(x, y, ch) { if (this.in(x, y)) this.g[y][x] = ch; return this; }
    get(x, y) { return this.in(x, y) ? this.g[y][x] : '#'; }
    rect(x0, y0, x1, y1, ch) { for (let y = Math.min(y0, y1); y <= Math.max(y0, y1); y++) for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++) this.put(x, y, ch); return this; }
    fill(ch) { return this.rect(0, 0, this.W - 1, this.H - 1, ch || '#'); }
    carve(x0, y0, x1, y1) { return this.rect(x0, y0, x1, y1, ' '); }
    solid(x0, y0, x1, y1) { return this.rect(x0, y0, x1, y1, '#'); }
    plat(x0, x1, y) { return this.rect(x0, y, x1, y, '='); }
    spikes(x0, x1, y) { return this.rect(x0, y, x1, y, '^'); }
    water(x0, y0, x1, y1) { return this.rect(x0, y0, x1, y1, '~'); }
    lava(x0, y0, x1, y1) { return this.rect(x0, y0, x1, y1, 'L'); }
    cracked(x0, y0, x1, y1) { return this.rect(x0, y0, x1, y1, 'C'); }
    fake(x0, y0, x1, y1) { return this.rect(x0, y0, x1, y1, 'F'); }
    veil(x0, y0, x1, y1) { return this.rect(x0, y0, x1, y1, 'V'); }
    crumble(x0, x1, y) { return this.rect(x0, y, x1, y, 'X'); }
    // aberturas nas bordas
    exitL(y0, y1) { return this.carve(0, y0, 1, y1); }
    exitR(y0, y1) { return this.carve(this.W - 2, y0, this.W - 1, y1); }
    exitU(x0, x1) { return this.carve(x0, 0, x1, 1); }
    exitD(x0, x1) { return this.carve(x0, this.H - 2, x1, this.H - 1); }
    // tecto irregular (estético, acima de yLimit)
    ragged(x0, x1, yTop, depth) {
      // passeio aleatório suave: sem colunas isoladas de um tile
      let d = Math.floor(this.rnd() * (depth + 1)), run = 0;
      for (let x = x0; x <= x1; x++) {
        if (run <= 0) { d = U.clamp(d + (this.rnd() < 0.5 ? -1 : 1), 0, depth); run = 2 + Math.floor(this.rnd() * 4); }
        run--;
        for (let k = 0; k < d; k++) if (this.get(x, yTop + k) === ' ') this.put(x, yTop + k, '#');
      }
      return this;
    }
    // escadaria de blocos
    stairs(x, y, n, dir, ch) { for (let i = 0; i < n; i++) this.rect(x + i * dir, y - i, x + i * dir, y, ch || '#'); return this; }
    e(t, x, y, o) { this.ents.push(Object.assign({ t, x, y }, o || {})); return this; }
    enemy(k, x, y, o) { return this.e('enemy', x, y, Object.assign({ k }, o || {})); }
    item(item, x, y, o) { return this.e('item', x, y, Object.assign({ item }, o || {})); }
    prop(k, x, y) { this.props.push({ k, x, y }); return this; }
    toMap() { return this.g.map((r) => r.join('')); }
  }
  VS.RoomBuilder = B;
  VS.room = function (id, opts, fn) {
    const w = (opts.w || 1) * U.CELL_W, h = (opts.h || 1) * U.CELL_H;
    const b = new B(w, h, U.hash(id));
    fn(b);
    const def = Object.assign({}, opts, { map: b.toMap(), ents: b.ents, props: b.props });
    delete def.w; delete def.h;
    VS.ROOMS[id] = def;
    return def;
  };
})(window.VS);
