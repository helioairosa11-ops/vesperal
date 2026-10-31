// Vesperal — analisador de alcance.
// Simula os saltos da protagonista com a MESMA física do jogo (js/game/player.js e js/game/world.js) por todo o
// mundo, etapa a etapa (as habilidades chegam com os chefes), e diz o que não se alcança a saltar normalmente.
//
//   modo "normal": correr, saltar (com corte do salto), tempo de coiote, cair, descer por plataformas finas, nadar,
//                  salto duplo / investida quando já se têm, e o "subir o rebordo" automático (empurrar contra uma
//                  parede baixa quando a cabeça já passa o topo). NÃO trepa paredes.
//   modo "trepar": o mesmo mais trepar paredes (com fôlego), como o jogo permite desde o início.
//
// Uso: node tools/reach/reach.js [--json saida.json] [--quiet]
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = path.resolve(__dirname, '..', '..');

// ---------------------------------------------------------------- dados do jogo
function loadVS() {
  const ctx = { window: {}, console, navigator: { language: 'pt' }, document: { documentElement: {} } };
  ctx.window = ctx; vm.createContext(ctx);
  const load = (f) => vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), ctx, { filename: f });
  ['js/core/util.js', 'js/core/i18n.js', 'js/data/regions.js', 'js/data/items.js', 'js/data/builder.js',
    'js/data/rooms_r1.js', 'js/data/rooms_r2.js', 'js/data/rooms_r3.js', 'js/data/rooms_r4.js', 'js/data/rooms_r5.js', 'js/data/rooms_r6.js', 'js/data/rooms_r7.js'].forEach(load);
  return ctx.VS;
}

const T = 20, CW = 32, CH = 18, DT = 1 / 60;
const PW = 12, PH = 30, PCH = 18;
let TOPROW = [];
// constantes do jogo (js/game/player.js) com uma pequena folga: um salto que só dá por um pixel não conta como "normal"
const SLACK = 0.985;
const C = { RUN: 160 * SLACK, ACC_G: 1700, ACC_A: 1350, FRIC: 2100, GRAV: 1350, FALL_MUL: 1.2, MAXFALL: 480, JUMP: -452 * SLACK, CUT: 0.42, DOUBLE: -412 * SLACK, COYOTE: 0.1,
  CLIMB_UP: 58, CLIMB_UP_G: 80, STAM: 1.4, STAM_G: 3.0, HOP: -300, WJX: 240, WJY: -430 };
// códigos de tile
const EMPTY = 0, SOL = 1, PLAT = 2, SPIKE = 3, LAVA = 4, WATER = 5, CRACK = 6, FAKE = 7, CRUMB = 8, VEIL = 9, DOOR = 10;
const CODE = { '#': SOL, '=': PLAT, '^': SPIKE, 'L': LAVA, '~': WATER, 'C': CRACK, 'F': FAKE, 'X': CRUMB, 'V': VEIL };

function buildWorld(VS) {
  const rooms = VS.ROOMS, ids = Object.keys(rooms);
  let minX = 1e9, minY = 1e9, maxX = -1e9, maxY = -1e9;
  for (const id of ids) { const d = rooms[id], cw = d.map[0].length / CW, ch = d.map.length / CH; minX = Math.min(minX, d.x); minY = Math.min(minY, d.y); maxX = Math.max(maxX, d.x + cw); maxY = Math.max(maxY, d.y + ch); }
  const GW = (maxX - minX) * CW, GH = (maxY - minY) * CH;
  const grid = new Uint8Array(GW * GH).fill(SOL), roomOf = new Int16Array(GW * GH).fill(-1), doorOf = new Int16Array(GW * GH).fill(-1);
  const W = { VS, rooms, ids, minX, minY, GW, GH, grid, roomOf, doorOf, doors: [], ents: [], movers: [] };
  TOPROW = [];
  ids.forEach((id, ri) => {
    const d = rooms[id], ox = (d.x - minX) * CW, oy = (d.y - minY) * CH;
    d._ox = ox; d._oy = oy; d._ri = ri; TOPROW[ri] = oy;
    d.map.forEach((row, ly) => { for (let lx = 0; lx < row.length; lx++) { const i = (oy + ly) * GW + ox + lx; grid[i] = CODE[row[lx]] !== undefined ? CODE[row[lx]] : EMPTY; roomOf[i] = ri; } });
    for (const e of d.ents || []) {
      const ge = Object.assign({}, e, { room: id, gx: ox + e.x, gy: oy + e.y });
      if (e.t === 'door') {
        const di = W.doors.length; W.doors.push(ge);
        for (let j = 0; j < (e.h || 3); j++) for (let k = 0; k < (e.w || 1); k++) doorOf[(oy + e.y + j) * GW + ox + e.x + k] = di;
      } else if (e.t === 'platform') {
        // plataforma móvel horizontal: conta como uma passadeira fina ao longo de todo o percurso
        const x0 = Math.min(e.x, e.tx !== undefined ? e.tx : e.x), x1 = Math.max(e.x, e.tx !== undefined ? e.tx : e.x) + (e.w || 3) - 1, y = e.y;
        for (let x = x0; x <= x1; x++) { const i = (oy + y) * GW + ox + x; if (grid[i] === EMPTY) grid[i] = PLAT; }
        W.movers.push(ge);
      } else W.ents.push(ge);
    }
  });
  return W;
}

// ---------------------------------------------------------------- física
function makePhysics(W, cond) {
  const { GW, GH, grid, doorOf } = W;
  // cond: { veil, forge, fake, doorOpen: Uint8Array }
  function solidT(tx, ty) {
    if (tx < 0 || ty < 0 || tx >= GW || ty >= GH) return true;
    const i = ty * GW + tx, c = grid[i];
    const di = doorOf[i];
    if (di >= 0 && !cond.doorOpen[di]) return true;
    if (c === SOL || c === CRUMB) return true;
    if (c === CRACK) return !cond.forge;
    if (c === FAKE) return !cond.fake;
    if (c === VEIL) return !cond.veil;
    return false;
  }
  function code(tx, ty) { if (tx < 0 || ty < 0 || tx >= GW || ty >= GH) return SOL; return grid[ty * GW + tx]; }
  function rectSolid(x, y, w, h) {
    const x0 = Math.floor(x / T), x1 = Math.floor((x + w - 0.001) / T), y0 = Math.floor(y / T), y1 = Math.floor((y + h - 0.001) / T);
    for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) if (solidT(tx, ty)) return true;
    return false;
  }
  function hazard(x, y, w, h) {
    const x0 = Math.floor((x + 2) / T), x1 = Math.floor((x + w - 2 - 0.001) / T), y0 = Math.floor((y + 4) / T), y1 = Math.floor((y + h - 0.001) / T);
    for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) { const c = code(tx, ty); if (c === SPIKE || c === LAVA) return true; }
    return false;
  }
  const roomAtPx = (x, y) => { const tx = Math.floor(x / T), ty = Math.floor(y / T); if (tx < 0 || ty < 0 || tx >= GW || ty >= GH) return -1; return W.roomOf[ty * GW + tx]; };
  const platIn = (tx, ty, ri) => code(tx, ty) === PLAT && W.roomOf[ty * GW + tx] === ri;
  // World.moveBody
  function moveBody(b) {
    let landed = false, ceiling = false;
    const ri = roomAtPx(b.x + b.w / 2, b.y + b.h / 2);
    let dx = b.vx * DT; const sx = Math.sign(dx);
    while (Math.abs(dx) > 0) {
      const step = Math.abs(dx) > 4 ? sx * 4 : dx;
      b.x += step;
      if (rectSolid(b.x, b.y, b.w, b.h)) { b.x -= step; let s = step; for (let i = 0; i < 6; i++) { s /= 2; b.x += s; if (rectSolid(b.x, b.y, b.w, b.h)) b.x -= s; } b.vx = 0; b.hitX = sx; break; }
      dx -= step;
    }
    let dy = b.vy * DT; const sy = Math.sign(dy); const wasBottom = b.y + b.h;
    b.onGround = false;
    while (Math.abs(dy) > 0) {
      const step = Math.abs(dy) > 4 ? sy * 4 : dy;
      b.y += step;
      let blocked = rectSolid(b.x, b.y, b.w, b.h);
      if (!blocked && sy > 0 && !b.drop) {
        const bottom = b.y + b.h, ty = Math.floor(bottom / T);
        if (bottom - ty * T <= Math.abs(step) + 0.5 && wasBottom <= ty * T + 0.5) {
          for (let tx = Math.floor(b.x / T); tx <= Math.floor((b.x + b.w - 0.01) / T); tx++) if (platIn(tx, ty, ri)) { b.y = ty * T - b.h; b.onGround = true; b.vy = 0; return { landed: true, ceiling }; }
        }
      }
      if (blocked) {
        b.y -= step; let s = step; for (let i = 0; i < 6; i++) { s /= 2; b.y += s; if (rectSolid(b.x, b.y, b.w, b.h)) b.y -= s; }
        if (sy > 0) { landed = true; b.onGround = true; } else ceiling = true;
        b.vy = 0; break;
      }
      dy -= step;
    }
    if (!b.onGround && b.vy >= 0) {
      b.y += 1;
      if (rectSolid(b.x, b.y, b.w, b.h)) b.onGround = true;
      else if (!b.drop) { const bottom = b.y + b.h, ty = Math.floor(bottom / T); if (bottom - ty * T < 1.2) for (let tx = Math.floor(b.x / T); tx <= Math.floor((b.x + b.w - 0.01) / T); tx++) if (platIn(tx, ty, ri)) { b.onGround = true; break; } }
      b.y -= 1;
    }
    return { landed, ceiling };
  }
  return { solidT, code, rectSolid, hazard, moveBody, roomAtPx };
}

// simula um plano de comandos a partir de um estado; devolve o sítio onde aterra (ou null)
// plano: { d1, sw, d2, up, jumpF, holdF, dblF, dashF, dashDir, climb }
function simulate(P, abil, s0, plan, touch, GW) {
  const b = { x: s0.x, y: s0.y, w: PW, h: PH, vx: s0.vx, vy: s0.vy || 0, onGround: s0.onGround, drop: !!s0.drop };
  let coyote = s0.onGround ? C.COYOTE : (s0.coyote || 0), jumping = false, doubleUsed = false, airDash = false, dodge = null, dodgeCd = 0, wallLock = 0;
  let climbing = false, climbSide = 0, stam = abil.wall ? C.STAM_G : C.STAM, dropT = s0.drop ? 0.25 : 0, airborne = !s0.onGround;
  const garra = !!abil.wall, climbMode = !!plan.climb;
  for (let f = 0; f < 260; f++) {
    const t = f * DT;
    const ax = f < plan.sw ? plan.d1 : plan.d2, up = !!plan.up;
    const cx = b.x + b.w / 2, cy = b.y + b.h / 2;
    const inWater = P.code(Math.floor(cx / T), Math.floor(cy / T)) === WATER;
    wallLock = Math.max(0, wallLock - DT); dodgeCd = Math.max(0, dodgeCd - DT);
    if (dropT > 0) { dropT -= DT; if (dropT <= 0) b.drop = false; }
    // trepar a partir do chão (só no modo trepar)
    if (climbMode && f === 0 && b.onGround && up && ax && touching(P, b, ax)) { b.onGround = false; b.y -= 1; b.vy = -30; climbing = true; climbSide = ax; airborne = true; }
    // esquiva em curso
    if (dodge) {
      dodge.t += DT; const k = dodge.t / dodge.dur;
      const sp = dodge.air ? (dodge.short ? 240 : 330) : 300 + (110 - 300) * k * k;
      b.vx = dodge.dir * sp; if (dodge.air && !dodge.short) b.vy = 0;
      if (dodge.t >= dodge.dur) dodge = null;
    }
    // salto (premido neste fotograma?)
    const swim = inWater && plan.swim !== false && f % 14 === 0;
    const press = (plan.jumpF === f) || (plan.dblF === f) || swim;
    const held = (f < plan.holdF && !(plan.dblF !== undefined && f === plan.dblF - 1)) || (plan.dblF !== undefined && f >= plan.dblF) || inWater;
    if (press && !dodge) {
      if (inWater) { b.vy = -300; }
      else if (coyote > 0) { b.vy = C.JUMP; coyote = 0; b.onGround = false; jumping = true; airborne = true; }
      else if (climbMode && climbing && up && garra && stam > 0.2) { b.vy = C.HOP; stam -= 0.4; }
      else if (climbMode && garra && (touching(P, b, 1) || touching(P, b, -1))) { const wd = touching(P, b, 1) ? 1 : -1; climbing = false; b.vx = -wd * C.WJX; b.vy = C.WJY; wallLock = 0.16; }
      else if (abil.double && !doubleUsed) { doubleUsed = true; b.vy = C.DOUBLE; jumping = true; }
    }
    if (!held && b.vy < 0 && jumping && !inWater) { b.vy *= C.CUT; jumping = false; }
    if (b.vy >= 0) jumping = false;
    if (plan.dashF === f && !dodge && dodgeCd <= 0 && (b.onGround || !airDash)) {
      const air = !b.onGround, short = air && !abil.dash;
      dodge = { t: 0, dur: air ? (short ? 0.13 : 0.2) : 0.34, air, short, dir: plan.dashDir };
      if (air) { airDash = true; b.vy = 0; climbing = false; }
      dodgeCd = air ? 0.35 : 0.42;
    }
    // movimento horizontal
    const speed = C.RUN * (inWater ? 0.6 : 1);
    let target = ax * speed, acc = b.onGround ? C.ACC_G : C.ACC_A;
    if (dodge) { target = b.vx; acc = 0; }
    if (wallLock > 0) { target = b.vx; acc = 0; }
    if (acc > 0) b.vx = approach(b.vx, target, (ax === 0 && b.onGround && !dodge ? C.FRIC : acc) * DT);
    // gravidade / parede
    let grav = inWater ? C.GRAV * 0.35 : C.GRAV, maxFall = inWater ? 110 : C.MAXFALL;
    if (dodge && dodge.air) grav = dodge.short ? grav * 0.3 : 0;
    let climbNow = false;
    if (!b.onGround && !inWater && !dodge) {
      const wd = ax > 0 ? 1 : ax < 0 ? -1 : (climbing && up ? climbSide : 0);
      if (wd && touching(P, b, wd) && (b.vy > -40 || climbing)) {
        if (climbMode) { airDash = false; doubleUsed = false; }
        if (stam > 0) {
          if (climbMode) { climbNow = true; climbSide = wd; b.vy = up ? -(garra ? C.CLIMB_UP_G : C.CLIMB_UP) : 0; grav = 0; stam -= DT * (up ? 1 : 0.32); }
          // subir o rebordo: a cabeça já passa o topo da parede → salta por cima (também acontece só a empurrar)
          if ((up || ax === wd) && !P.rectSolid(b.x + wd * 2, b.y - 4, b.w, 10)) { b.vy = -250; b.vx = wd * 110; wallLock = 0.2; climbNow = false; }
        } else if (climbMode) maxFall = 70;
      }
    }
    climbing = climbNow;
    if (b.vy > 0 && !inWater && !climbNow && maxFall !== 70 && !dodge) grav *= C.FALL_MUL;
    b.vy = Math.min(maxFall, b.vy + grav * DT);
    const riBefore = P.roomAtPx(b.x + b.w / 2, b.y + b.h / 2);
    const res = P.moveBody(b);
    if (res.ceiling && b.vy < 0) b.vy = 0;
    const riAfter = P.roomAtPx(b.x + b.w / 2, b.y + b.h / 2);
    if (riAfter !== riBefore && riAfter >= 0 && riBefore >= 0 && Math.floor((b.y + b.h / 2) / T) < TOPROW[riBefore]) { b.vy = Math.min(b.vy, -500); b.y -= 4; }
    if (!b.onGround) airborne = true;
    if (b.onGround) { coyote = C.COYOTE; airDash = false; doubleUsed = false; stam = garra ? C.STAM_G : C.STAM; climbing = false; } else coyote -= DT;
    // tiles tocados (apanhar objetos, falar, alavancas)
    if (touch) {
      const x0 = Math.floor(b.x / T), x1 = Math.floor((b.x + b.w - 0.001) / T), y0 = Math.floor(b.y / T), y1 = Math.floor((b.y + b.h - 0.001) / T);
      for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) touch[ty * GW + tx] = 1;
    }
    if (P.hazard(b.x, b.y, b.w, b.h)) return null;
    if (b.onGround && airborne && f > 0) {
      if (dodge && !dodge.air) continue; // ainda a rolar
      // coluna de apoio: a do centro se tiver chão; senão a da borda do corpo que está apoiada
      const fy = Math.round((b.y + b.h) / T), cxT = Math.floor((b.x + b.w / 2) / T), lT = Math.floor(b.x / T), rT = Math.floor((b.x + b.w - 0.01) / T);
      const sup = (tx) => P.solidT(tx, fy) || P.code(tx, fy) === PLAT;
      return { x: b.x, y: b.y, tx: sup(cxT) ? cxT : sup(lT) ? lT : rT, fy };
    }
    if (f > 40 && !airborne) return null;
  }
  return null;
}
function approach(v, t, d) { return v < t ? Math.min(t, v + d) : Math.max(t, v - d); }
function touching(P, b, d) { return P.rectSolid(b.x + d * 2, b.y + 4, b.w, b.h - 10); }

// planos de comandos (gerados uma vez por conjunto de habilidades)
function makePlans(abil, climbMode) {
  const plans = [], INF = 1e9;
  const add = (p) => plans.push(Object.assign({ d1: 0, sw: INF, d2: 0, jumpF: 0, holdF: INF }, p));
  add({}); add({ holdF: 6 }); add({ holdF: 12 });
  for (const d of [-1, 1]) {
    for (const holdF of [INF, 5, 11]) {
      add({ d1: d, holdF }); add({ d1: 0, sw: 9, d2: d, holdF }); add({ d1: 0, sw: 18, d2: d, holdF });
      add({ d1: d, sw: 6, d2: 0, holdF }); add({ d1: d, sw: 15, d2: 0, holdF }); add({ d1: d, sw: 12, d2: -d, holdF }); add({ d1: d, sw: 22, d2: -d, holdF });
    }
    if (abil.double) for (const dblF of [12, 20, 28, 36]) { add({ d1: d, dblF }); add({ d1: d, dblF, sw: dblF, d2: 0 }); add({ d1: d, dblF, sw: dblF, d2: -d }); add({ d1: 0, dblF, sw: dblF, d2: d }); add({ d1: 0, dblF }); add({ d1: d, sw: 8, d2: 0, dblF }); }
    for (const dashF of [8, 16, 24, 32]) { add({ d1: d, dashF, dashDir: d }); add({ d1: 0, sw: dashF, d2: d, dashF, dashDir: d }); }
    if (abil.double) { add({ d1: d, dblF: 22, dashF: 34, dashDir: d }); add({ d1: d, dashF: 18, dashDir: d, dblF: 34 }); }
    if (climbMode) { add({ d1: d, up: true, climb: true }); add({ d1: d, up: true, climb: true, jumpF: -1 }); add({ d1: d, sw: 30, d2: -d, up: true, climb: true }); }
  }
  return plans;
}
// planos para sair por uma borda (a cair, com ou sem salto de coiote)
function makeFallPlans(abil, d) {
  const plans = [], INF = 1e9;
  const add = (p) => plans.push(Object.assign({ d1: d, sw: INF, d2: d, jumpF: -1, holdF: INF }, p));
  add({}); add({ sw: 6, d2: 0 }); add({ sw: 14, d2: 0 }); add({ sw: 8, d2: -d }); add({ sw: 20, d2: -d });
  // deixar-se afundar na água (sem nadar) — para cair por buracos no fundo de um lago
  add({ swim: false }); add({ sw: 10, d2: 0, swim: false });
  add({ jumpF: 3 }); add({ jumpF: 5, holdF: 12 });
  if (abil.double) for (const dblF of [10, 20, 30]) { add({ dblF }); add({ dblF, sw: dblF, d2: -d }); add({ jumpF: 4, dblF: dblF + 14 }); }
  for (const dashF of [6, 14, 24]) add({ dashF, dashDir: d });
  return plans;
}

// ---------------------------------------------------------------- busca
function explore(W, cond, abil, climbMode, starts, parents) {
  const { GW, GH } = W;
  const P = makePhysics(W, cond);
  const isFloor = (tx, ty) => { const c = P.code(tx, ty); return (P.solidT(tx, ty) || c === PLAT) && c !== SPIKE && c !== LAVA; };
  const visited = new Uint8Array(GW * GH), touch = new Uint8Array(GW * GH);
  const plans = makePlans(abil, climbMode), fallL = makeFallPlans(abil, -1), fallR = makeFallPlans(abil, 1);
  const queue = [];
  const fits = (tx, fy, h) => !P.rectSolid(tx * T + T / 2 - PW / 2, fy * T - h, PW, h);
  const push = (tx, fy, why) => {
    if (tx < 0 || fy < 1 || tx >= GW || fy >= GH) return;
    const i = fy * GW + tx; if (visited[i]) return;
    if (!isFloor(tx, fy)) return;
    if (!fits(tx, fy, PCH)) return;
    visited[i] = 1; queue.push(i);
    if (parents && why) parents.set(i, why);
  };
  for (const s of starts) push(s.tx, s.fy);
  let sims = 0;
  while (queue.length) {
    const i = queue.pop(), tx = i % GW, fy = (i - tx) / GW;
    touch[(fy - 1) * GW + tx] = 1; if (fy > 1) touch[(fy - 2) * GW + tx] = 1;
    const standing = fits(tx, fy, PH);
    // andar para os lados (de pé ou agachada)
    for (const d of [-1, 1]) {
      const nx = tx + d;
      if (P.solidT(nx, fy - 1)) continue;
      if (isFloor(nx, fy)) { if (fits(nx, fy, PCH)) push(nx, fy, { walk: true, from: i }); }
      else {
        // borda: cai (e pode saltar no tempo de coiote)
        const x0 = d > 0 ? (tx + 1) * T - 1 : tx * T + 1 - PW;
        if (!standing || P.rectSolid(x0, fy * T - PH, PW, PH)) continue;
        for (const pl of d > 0 ? fallR : fallL) { sims++; const s0 = { x: x0, y: fy * T - PH, vx: d * C.RUN, vy: 0, onGround: true }; const r = simulate(P, abil, s0, pl, touch, GW); if (r) push(r.tx, r.fy, { s0, pl, from: i }); }
      }
    }
    // descer por uma plataforma fina
    if (P.code(tx, fy) === PLAT && standing) for (const pl of [fallL[0], fallR[0], { d1: 0, sw: 1e9, d2: 0, jumpF: -1, holdF: 1e9 }]) { sims++; const s0 = { x: tx * T + T / 2 - PW / 2, y: fy * T - PH, vx: 0, vy: 0, onGround: false, drop: true }; const r = simulate(P, abil, s0, pl, touch, GW); if (r) push(r.tx, r.fy, { s0, pl, from: i }); }
    if (!standing) continue;
    // saltos (parada, a correr) a partir do centro da coluna
    for (const pl of plans) {
      for (const v0 of pl.d1 ? [0, pl.d1 * C.RUN] : [0]) {
        sims++;
        const s0 = { x: tx * T + T / 2 - PW / 2, y: fy * T - PH, vx: v0, vy: 0, onGround: true };
        const r = simulate(P, abil, s0, pl, touch, GW);
        if (r) push(r.tx, r.fy, { s0, pl, from: i });
      }
    }
  }
  return { visited, touch, sims };
}

// ---------------------------------------------------------------- progressão
function analyze(W, opts) {
  opts = opts || {};
  const { VS, rooms, GW } = W;
  const REW = { coveiro: 'dash', caedmon: 'wall', hilde: 'forge', mariposa: 'double', corvin: 'veil' };
  const EMBER = { caedmon: 1, hilde: 1, elowen: 1, corvin: 1, ozias: 1, aldric: 1 };
  const abil = { dash: false, double: false, wall: false, forge: false, veil: false };
  const doorOpen = new Uint8Array(W.doors.length);
  const state = { bosses: {}, levers: {}, key: false, embers: 0 };
  const updateDoors = () => W.doors.forEach((d, i) => {
    const [k, v] = (d.open || '').split(':');
    let o = false;
    if (d.open === 'bossgate') o = true;
    else if (k === 'boss') o = !!state.bosses[v];
    else if (k === 'ability') o = !!abil[v];
    else if (k === 'key') o = state.key;
    else if (k === 'embers') o = state.embers >= +v;
    if (Object.values(state.levers).includes(d.id)) o = true;
    doorOpen[i] = o ? 1 : 0;
  });
  const wake = rooms.r1_wake, start = (() => { const ly = wake.map.findIndex((r) => r.includes('P')), lx = wake.map[ly].indexOf('P'); let fy = ly; while (wake.map[fy][lx] !== '#') fy++; return { tx: wake._ox + lx, fy: wake._oy + fy }; })();
  const stages = [];
  let res;
  for (let it = 0; it < 12; it++) {
    updateDoors();
    const cond = { veil: abil.veil, forge: abil.forge, fake: !!opts.fake, doorOpen };
    res = explore(W, cond, abil, !!opts.climb, [start]);
    let changed = false;
    const got = [];
    for (const e of W.ents) {
      if (e.t === 'boss' && !state.bosses[e.boss]) {
        const d = rooms[e.room], trig = (e.trigger !== undefined ? e.trigger : e.x);
        // passa a linha do gatilho de pé
        let ok = false;
        for (let ly = 0; ly < d.map.length && !ok; ly++) for (let lx = 0; lx < d.map[0].length && !ok; lx++) {
          const i = (d._oy + ly) * GW + d._ox + lx;
          if (res.visited[i] && (e.fromRight ? lx < trig : lx > trig)) ok = true;
        }
        if (ok) { state.bosses[e.boss] = true; changed = true; got.push('chefe ' + e.boss); if (REW[e.boss]) { abil[REW[e.boss]] = true; got.push('habilidade ' + REW[e.boss]); } if (EMBER[e.boss]) state.embers++; }
      }
      if (e.t === 'lever' && !state.levers[e.id] && near(res.touch, GW, e.gx, e.gy, 1)) { state.levers[e.id] = e.door; changed = true; got.push('alavanca ' + e.id); }
      if (e.t === 'npc' && (e.id === 'teodoro' || e.id === 'maren') && !state.key && near(res.touch, GW, e.gx, e.gy, 1)) { state.key = true; changed = true; got.push('chave do ossário'); }
    }
    // a câmara do trono (Ione) e Seraphine vêm depois do rei: não contam para a progressão
    stages.push({ abil: Object.assign({}, abil), got, sims: res.sims });
    if (!changed) break;
  }
  return { res, stages, abil, state, doorOpen };
}
function near(touch, GW, gx, gy, r) {
  for (let y = gy - r; y <= gy + r; y++) for (let x = gx - r; x <= gx + r; x++) if (y >= 0 && x >= 0 && touch[y * GW + x]) return true;
  return false;
}

// ---------------------------------------------------------------- relatório
function report(W, normal, climb, secret) {
  const { rooms, GW, grid } = W;
  const out = { rooms: {}, ents: [], plats: [] };
  const P = makePhysics(W, { veil: true, forge: true, fake: true, doorOpen: new Uint8Array(W.doors.length).fill(1) });
  for (const id of W.ids) {
    const d = rooms[id], H = d.map.length, Wd = d.map[0].length;
    const segs = [];
    // superfícies onde se pode estar de pé (chão com espaço livre por cima)
    for (let ly = 1; ly < H; ly++) {
      let run = null;
      for (let lx = 0; lx <= Wd; lx++) {
        const gx = d._ox + lx, gy = d._oy + ly, i = gy * GW + gx;
        const c = lx < Wd ? grid[i] : -1;
        const above = gy > 0 ? grid[(gy - 1) * GW + gx] : SOL;
        const floor = lx < Wd && (c === SOL || c === PLAT || c === CRUMB) && above !== SPIKE && above !== LAVA && above !== CRACK && !P.solidT(gx, gy - 1) && !P.solidT(gx, gy - 2) && W.roomOf[(gy - 1) * GW + gx] >= 0;
        if (floor) {
          const st = normal.res.visited[i] ? 'ok' : climb.res.visited[i] ? 'climb' : secret.res.visited[i] ? 'secret' : 'no';
          if (run && run.st === st && run.plat === (c === PLAT)) run.x1 = lx; else { if (run) segs.push(run); run = { y: ly, x0: lx, x1: lx, st, plat: c === PLAT }; }
        } else if (run) { segs.push(run); run = null; }
      }
    }
    out.rooms[id] = { segs, ox: d._ox, oy: d._oy, w: Wd, h: H, map: d.map, region: d.region };
  }
  for (const e of W.ents) {
    if (!['item', 'urn', 'inscription', 'npc', 'altar', 'lever', 'shrine', 'boss'].includes(e.t)) continue;
    const r = e.t === 'item' || e.t === 'shrine' ? 0 : 1;
    const st = e.t === 'boss' ? (normal.state.bosses[e.boss] ? 'ok' : climb.state.bosses[e.boss] ? 'climb' : 'no')
      : near(normal.res.touch, GW, e.gx, e.gy, r) ? 'ok' : near(climb.res.touch, GW, e.gx, e.gy, r) ? 'climb' : near(secret.res.touch, GW, e.gx, e.gy, r) ? 'secret' : 'no';
    out.ents.push({ room: e.room, t: e.t, id: e.id || e.item || e.boss || e.k || '', x: e.x, y: e.y, st });
  }
  return out;
}

if (require.main === module) {
  const t0 = Date.now();
  const VS = loadVS(), W = buildWorld(VS);
  const fast = process.argv.includes('--fast');
  const normal = analyze(W, {}), secret = analyze(W, { fake: true }), climb = fast ? { res: { visited: new Uint8Array(W.GW * W.GH), touch: new Uint8Array(W.GW * W.GH) }, state: { bosses: {} } } : analyze(W, { climb: true });
  const rep = report(W, normal, climb, secret);
  const quiet = process.argv.includes('--quiet');
  console.log('Etapas (modo normal):');
  normal.stages.forEach((s, i) => console.log(`  ${i}: ${s.got.join(', ') || '—'}  [${Object.keys(s.abil).filter((k) => s.abil[k]).join(' ') || 'sem habilidades'}] (${s.sims} simulações)`));
  const bad = rep.ents.filter((e) => e.st !== 'ok');
  console.log(`\nObjetos/pessoas fora de alcance a saltar normalmente: ${bad.length}`);
  if (!quiet) bad.forEach((e) => console.log(`  ${e.st.padEnd(6)} ${e.room.padEnd(14)} ${e.t} ${e.id} (${e.x},${e.y})`));
  let platNo = 0, platClimb = 0, solNo = 0;
  const lines = [];
  for (const id of W.ids) for (const s of rep.rooms[id].segs) {
    if (s.st === 'ok' || s.st === 'secret') continue;
    const len = s.x1 - s.x0 + 1;
    if (s.plat) { if (s.st === 'climb') platClimb++; else platNo++; lines.push(`  ${s.st.padEnd(6)} ${id.padEnd(14)} plataforma x${s.x0}-${s.x1} y${s.y}`); }
    else if (len >= 2) { solNo++; lines.push(`  ${s.st.padEnd(6)} ${id.padEnd(14)} chão x${s.x0}-${s.x1} y${s.y}`); }
  }
  console.log(`\nSuperfícies fora de alcance: plataformas ${platNo} (só a trepar: ${platClimb}), chão ${solNo}`);
  if (!quiet) lines.forEach((l) => console.log(l));
  const j = process.argv.indexOf('--json');
  if (j > 0) fs.writeFileSync(process.argv[j + 1], JSON.stringify(rep));
  console.log(`\n(${((Date.now() - t0) / 1000).toFixed(1)} s)`);
}
module.exports = { loadVS, buildWorld, analyze, report, makePhysics, simulate, explore };
