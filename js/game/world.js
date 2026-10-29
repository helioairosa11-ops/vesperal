// Vesperal — mundo: salas em células, colisões por tiles, transições contínuas
'use strict';
(function (VS) {
  const U = VS.U, T = U.TILE, CW = U.CELL_W, CH = U.CELL_H;
  VS.ROOMS = VS.ROOMS || {};

  const SOLID = { '#': 1, 'C': 1, 'F': 1, 'X': 1 };

  class Room {
    constructor(id, def) {
      this.id = id; this.def = def;
      this.region = def.region; this.R = VS.REGIONS[def.region];
      this.cx = def.x; this.cy = def.y;
      const lines = def.map;
      this.h = lines.length;
      this.w = Math.max(...lines.map((l) => l.length));
      this.cellsW = Math.round(this.w / CW); this.cellsH = Math.round(this.h / CH);
      this.grid = lines.map((l) => l.padEnd(this.w, '#'));
      this.pw = this.w * T; this.ph = this.h * T;
      this.gx = this.cx * CW * T; this.gy = this.cy * CH * T; // origem global em unidades
      this.broken = {}; this.crumble = {}; this.dyn = {};
      this.allowVeil = false;
    }
    tile(tx, ty) {
      if (tx < 0 || ty < 0 || tx >= this.w || ty >= this.h) return null;
      return this.grid[ty][tx];
    }
    setTile(tx, ty, ch) { const row = this.grid[ty]; this.grid[ty] = row.substring(0, tx) + ch + row.substring(tx + 1); }
    // sólido para efeitos de autotile: limites da sala contam como sólidos
    solidForMask(tx, ty) {
      const ch = this.tile(tx, ty);
      if (ch === null) return true;
      if (this.broken[tx + ',' + ty]) return false;
      return !!SOLID[ch];
    }
    isSolidTile(tx, ty, who) {
      const ch = this.tile(tx, ty);
      if (ch === null) return this.outsideSolid(tx, ty, who);
      if (this.dyn[tx + ',' + ty]) return true;
      if (SOLID[ch]) {
        if (this.broken[tx + ',' + ty]) return false;
        if (ch === 'X') { const c = this.crumble[tx + ',' + ty]; if (c && c.gone) return false; }
        return true;
      }
      if (ch === 'V') return !(who && who.isPlayer && VS.state && VS.state.abilities.veil);
      return false;
    }
    // fora dos limites: passável apenas se existir sala vizinha com espaço livre nesse ponto
    outsideSolid(tx, ty, who) {
      const gtx = this.cx * CW + tx, gty = this.cy * CH + ty;
      const nb = World.roomAtTile(gtx, gty);
      if (!nb || nb === this.def) return true;
      const r = World.peek(nb.id);
      const lx = gtx - nb.x * CW, ly = gty - nb.y * CH;
      const ch = r.tile(lx, ly);
      if (ch === null) return true;
      if (SOLID[ch]) { const st = VS.state && VS.state.broken[nb.id]; return !(st && st.includes(lx + ',' + ly)); }
      if (ch === 'V') return !(who && who.isPlayer && VS.state && VS.state.abilities.veil);
      return false;
    }
    isPlatform(tx, ty) { return this.tile(tx, ty) === '='; }
    isHazard(tx, ty) { const ch = this.tile(tx, ty); return ch === '^' || ch === 'L'; }
    isWater(tx, ty) { return this.tile(tx, ty) === '~'; }
    solidAtPoint(x, y, who) { return this.isSolidTile(Math.floor(x / T), Math.floor(y / T), who); }

    // quebra um grupo contíguo de tiles do mesmo tipo (paredes falsas / pedra rachada)
    breakGroup(tx, ty) {
      const ch = this.tile(tx, ty); if (!ch) return [];
      const out = [], seen = {}, stack = [[tx, ty]];
      while (stack.length && out.length < 60) {
        const [x, y] = stack.pop(); const k = x + ',' + y;
        if (seen[k]) continue; seen[k] = 1;
        if (this.tile(x, y) !== ch || this.broken[k]) continue;
        this.broken[k] = true; out.push(k);
        stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
      }
      return out;
    }
  }

  const World = { cellIndex: {}, rooms: {}, loaded: {} };
  World.Room = Room;

  World.build = function () {
    World.cellIndex = {};
    for (const id in VS.ROOMS) {
      const d = VS.ROOMS[id]; d.id = id;
      const h = d.map.length, w = Math.max(...d.map.map((l) => l.length));
      d.cw = Math.round(w / CW); d.ch = Math.round(h / CH);
      for (let i = 0; i < d.cw; i++) for (let j = 0; j < d.ch; j++) {
        const k = (d.x + i) + ',' + (d.y + j);
        if (World.cellIndex[k]) console.error('células sobrepostas', id, World.cellIndex[k].id, k);
        World.cellIndex[k] = d;
      }
    }
  };
  World.roomAtCell = (cx, cy) => World.cellIndex[cx + ',' + cy] || null;
  World.roomAtTile = (gtx, gty) => World.roomAtCell(Math.floor(gtx / CW), Math.floor(gty / CH));
  // instância "espreitada" (sem entidades) para consultas de colisão nas fronteiras
  World.peek = function (id) {
    if (!World.loaded[id]) World.loaded[id] = new Room(id, VS.ROOMS[id]);
    return World.loaded[id];
  };
  World.fresh = function (id) { const r = new Room(id, VS.ROOMS[id]); World.loaded[id] = r; return r; };

  // ---------- física de AABB contra tiles ----------
  // corpo: {x,y,w,h,vx,vy,onGround,...}; x,y = canto superior esquerdo
  World.moveBody = function (room, b, dt, opts) {
    opts = opts || {};
    const res = { hitX: 0, hitY: 0, landed: false, ceiling: false };
    // eixo X
    let dx = b.vx * dt;
    const stepX = Math.sign(dx);
    while (Math.abs(dx) > 0) {
      const step = Math.abs(dx) > 4 ? stepX * 4 : dx;
      b.x += step;
      if (World.rectSolid(room, b)) {
        b.x -= step;
        let s = step; // aproximação binária ao limite exato
        for (let i = 0; i < 6; i++) { s /= 2; b.x += s; if (World.rectSolid(room, b)) b.x -= s; }
        res.hitX = stepX; b.vx = 0; break;
      }
      dx -= step;
    }
    // eixo Y
    let dy = b.vy * dt;
    const stepY = Math.sign(dy);
    const wasBottom = b.y + b.h;
    b.onGround = false;
    while (Math.abs(dy) > 0) {
      const step = Math.abs(dy) > 4 ? stepY * 4 : dy;
      b.y += step;
      let blocked = World.rectSolid(room, b);
      // plataformas de sentido único
      if (!blocked && stepY > 0 && !b.dropThrough) {
        const bottom = b.y + b.h;
        const ty = Math.floor(bottom / T);
        if (bottom - ty * T <= Math.abs(step) + 0.5 && wasBottom <= ty * T + 0.5) {
          for (let tx = Math.floor(b.x / T); tx <= Math.floor((b.x + b.w - 0.01) / T); tx++) if (room.isPlatform(tx, ty)) { blocked = 'plat'; break; }
        }
        if (blocked === 'plat') { b.y = ty * T - b.h; res.landed = true; b.onGround = true; b.vy = 0; b.onPlatform = true; break; }
      }
      if (blocked) {
        b.y -= step;
        let s = step;
        for (let i = 0; i < 6; i++) { s /= 2; b.y += s; if (World.rectSolid(room, b)) b.y -= s; }
        if (stepY > 0) { res.landed = true; b.onGround = true; b.onPlatform = false; }
        else res.ceiling = true;
        res.hitY = stepY; b.vy = 0; break;
      }
      dy -= step;
    }
    // verificar chão quando parado
    if (!b.onGround && b.vy >= 0) {
      b.y += 1;
      if (World.rectSolid(room, b)) { b.onGround = true; b.onPlatform = false; }
      else if (!b.dropThrough) {
        const bottom = b.y + b.h, ty = Math.floor(bottom / T);
        if (bottom - ty * T < 1.2) for (let tx = Math.floor(b.x / T); tx <= Math.floor((b.x + b.w - 0.01) / T); tx++) if (room.isPlatform(tx, ty)) { b.onGround = true; b.onPlatform = true; break; }
      }
      b.y -= 1;
    }
    return res;
  };
  World.rectSolid = function (room, b) {
    const x0 = Math.floor(b.x / T), x1 = Math.floor((b.x + b.w - 0.001) / T);
    const y0 = Math.floor(b.y / T), y1 = Math.floor((b.y + b.h - 0.001) / T);
    for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) if (room.isSolidTile(tx, ty, b)) return true;
    return false;
  };
  World.rectTouches = function (room, b, fn) {
    const x0 = Math.floor(b.x / T), x1 = Math.floor((b.x + b.w - 0.001) / T);
    const y0 = Math.floor(b.y / T), y1 = Math.floor((b.y + b.h - 0.001) / T);
    for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) if (fn(tx, ty)) return { tx, ty };
    return null;
  };
  // linha de visão simples entre dois pontos
  World.lineClear = function (room, x0, y0, x1, y1) {
    const d = Math.hypot(x1 - x0, y1 - y0), n = Math.ceil(d / 8);
    for (let i = 1; i < n; i++) { const t = i / n; if (room.solidAtPoint(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t)) return false; }
    return true;
  };
  // procura o chão abaixo de (x,y)
  World.groundBelow = function (room, x, y, maxD) {
    for (let d = 0; d < (maxD || 400); d += 4) { if (room.solidAtPoint(x, y + d) || room.isPlatform(Math.floor(x / T), Math.floor((y + d) / T))) return Math.floor((y + d) / T) * T; }
    return null;
  };

  VS.World = World;
})(window.VS);
