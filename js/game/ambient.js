// Vesperal — vida no mundo: corvos que levantam voo quando a protagonista se aproxima, pombas na catedral, ratos que
// fogem pelo chão, morcegos que se soltam do teto, peixes que saltam da água. É só enfeite: não tocam em nada, não
// contam para nada e não guardam estado; nascem ao entrar numa sala, conforme a região e os lugares livres.
'use strict';
(function (VS) {
  const U = VS.U, T = U.TILE, TAU = Math.PI * 2;
  const Amb = { list: [], ripples: [] };
  // quantos de cada, por região (no máximo; só se houver sítio para eles)
  const CFG = {
    r1: { crow: 4, rat: 3 }, crypt: { rat: 4, bat: 4 }, sanct: { rat: 1 },
    r2: { crow: 5, rat: 2 }, r3: { rat: 3, bat: 3 }, r4: { fish: 4, crow: 2 },
    r5: { crow: 4, bat: 2 }, r6: { dove: 3, bat: 2 }, r7: { rat: 2, bat: 2 },
  };
  const SOLID = { '#': 1, 'C': 1, 'F': 1, 'X': 1 };
  const air = (r, tx, ty) => { const ch = r.tile(tx, ty); return ch !== null && !SOLID[ch] && ch !== '~' && ch !== '^' && ch !== 'L' && ch !== '='; };
  const solid = (r, tx, ty) => !!SOLID[r.tile(tx, ty)];

  function spots(r, test, max, gap) {
    const all = [];
    for (let ty = 1; ty < r.h - 1; ty++) for (let tx = 1; tx < r.w - 1; tx++) if (test(tx, ty)) all.push([tx, ty]);
    for (let i = all.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [all[i], all[j]] = [all[j], all[i]]; }
    const out = [];
    for (const s of all) { if (out.length >= max) break; if (out.every((o) => Math.abs(o[0] - s[0]) + Math.abs(o[1] - s[1]) >= gap)) out.push(s); }
    return out;
  }

  Amb.onEnter = function (g) {
    Amb.list.length = 0; Amb.ripples.length = 0;
    const room = g.room, def = VS.ROOMS[room.id] || {}, cfg = CFG[room.R && room.R.key] || {};
    if (def.noAmbient) return;
    const r = room, boss = g.ents.some((e) => e.isBoss || (e.constructor && e.constructor.name === 'BossSpawner'));
    const k = boss ? 0.5 : 1;
    const n = (kind) => Math.round((cfg[kind] || 0) * k * (0.6 + Math.random() * 0.4));
    // pássaros pousados: chão firme com ar por cima
    for (const kind of ['crow', 'dove']) {
      for (const [tx, ty] of spots(r, (x, y) => solid(r, x, y) && air(r, x, y - 1) && air(r, x, y - 2) && air(r, x - 1, y - 1) && air(r, x + 1, y - 1), n(kind), 6)) {
        Amb.list.push({ kind, x: tx * T + 4 + Math.random() * (T - 8), y: ty * T, dir: Math.random() < 0.5 ? -1 : 1, st: 'idle', t: Math.random() * 3, peck: 0, hop: 0, vx: 0, vy: 0 });
      }
    }
    // ratos: chão com pelo menos três tiles seguidos
    for (const [tx, ty] of spots(r, (x, y) => solid(r, x, y) && air(r, x, y - 1) && solid(r, x - 1, y) && solid(r, x + 1, y) && air(r, x - 1, y - 1) && air(r, x + 1, y - 1), n('rat'), 8)) {
      Amb.list.push({ kind: 'rat', x: tx * T + T / 2, y: ty * T, dir: Math.random() < 0.5 ? -1 : 1, st: 'idle', t: Math.random() * 2, goal: null, vx: 0, a: 1 });
    }
    // morcegos: pendurados num teto com ar por baixo
    for (const [tx, ty] of spots(r, (x, y) => solid(r, x, y) && air(r, x, y + 1) && air(r, x, y + 2) && air(r, x, y + 3), n('bat'), 5)) {
      Amb.list.push({ kind: 'bat', x: tx * T + T / 2, y: (ty + 1) * T, st: 'hang', t: Math.random() * 4, vx: 0, vy: 0, ph: Math.random() * TAU });
    }
    // peixes: à superfície da água
    for (const [tx, ty] of spots(r, (x, y) => r.tile(x, y) === '~' && r.tile(x, y + 1) === '~' && !solid(r, x, y - 1) && r.tile(x, y - 1) !== '~', n('fish'), 6)) {
      Amb.list.push({ kind: 'fish', x: tx * T + T / 2, y: ty * T, st: 'wait', t: 0, wait: 1 + Math.random() * 6, dir: 1 });
    }
  };

  function scare(a, p) { // quão perto está a protagonista (e se está a atacar ali ao lado)
    const dx = Math.abs(p.cx - a.x), dy = Math.abs(p.cy - a.y), atk = p.action && (p.action.type === 'attack' || p.action.type === 'heavy');
    return dx < 74 && dy < 70 || atk && dx < 140 && dy < 90 || Math.abs(p.vx) > 120 && dx < 110 && dy < 60;
  }
  function sfx(g, name, x, vol) {
    const cam = VS.Gfx.cam, d = Math.abs(x - (cam.x + U.VIEW_W / 2));
    if (d > U.VIEW_W * 0.75) return;
    VS.Audio.sfx(name, { vol: vol * (1 - d / (U.VIEW_W * 0.9)), pan: U.clamp((x - cam.x - U.VIEW_W / 2) / (U.VIEW_W / 2), -1, 1) * 0.6 });
  }

  Amb.update = function (g, dt) {
    const p = g.player, r = g.room; if (!p || !r) return;
    for (const a of Amb.list) {
      a.t += dt;
      if (a.kind === 'crow' || a.kind === 'dove') {
        if (a.st === 'idle') {
          a.peck = Math.max(0, a.peck - dt); a.hop = Math.max(0, a.hop - dt);
          if (a.t > 1.2 + Math.random() * 2) { a.t = 0; const k = Math.random(); if (k < 0.45) a.peck = 0.35; else if (k < 0.7) { a.dir = -a.dir; } else { const nx = a.x + a.dir * 5; if (solid(r, Math.floor(nx / T), Math.floor(a.y / T)) && air(r, Math.floor(nx / T), Math.floor(a.y / T) - 1)) { a.x = nx; a.hop = 0.25; } } }
          if (scare(a, p)) {
            a.st = 'fly'; a.t = 0; const away = p.cx < a.x ? 1 : -1; a.dir = away;
            a.vx = away * (70 + Math.random() * 60); a.vy = -140 - Math.random() * 60;
            if (a.kind === 'crow' && Math.random() < 0.6) sfx(g, 'caw', a.x, 0.32); sfx(g, 'flap', a.x, 0.4);
          }
        } else {
          a.vy = Math.max(-190, a.vy - 30 * dt); a.vx += a.dir * 40 * dt;
          a.x += a.vx * dt; a.y += a.vy * dt;
          if (a.t > 4 || a.y < -40) a.gone = true;
        }
      } else if (a.kind === 'rat') {
        const fwd = (dir) => { const tx = Math.floor((a.x + dir * 6) / T), ty = Math.floor(a.y / T); return solid(r, tx, ty) && air(r, tx, ty - 1); };
        if (a.st === 'flee') {
          a.x += a.vx * dt;
          if (!fwd(Math.sign(a.vx))) { a.a -= dt * 4; a.vx *= 0.9; } // chegou à beira ou a uma parede: some-se numa fresta
          if (a.a <= 0 || a.t > 4) a.gone = true;
        } else {
          if (scare(a, p)) { a.st = 'flee'; a.t = 0; a.dir = p.cx < a.x ? 1 : -1; a.vx = a.dir * (150 + Math.random() * 40); sfx(g, 'squeak', a.x, 0.25); continue; }
          if (a.st === 'idle' && a.t > 0.8 + Math.random() * 2.5) { a.t = 0; a.st = 'walk'; a.dir = Math.random() < 0.5 ? -1 : 1; a.goal = 10 + Math.random() * 40; }
          if (a.st === 'walk') {
            if (!fwd(a.dir)) { a.dir = -a.dir; }
            const s = 34 * dt; a.x += a.dir * s; a.goal -= s;
            if (a.goal <= 0) { a.st = 'idle'; a.t = 0; }
          }
        }
      } else if (a.kind === 'bat') {
        if (a.st === 'hang') { if (scare(a, p)) { a.st = 'fly'; a.t = 0; const away = p.cx < a.x ? 1 : -1; a.vx = away * (90 + Math.random() * 50); a.vy = 40; sfx(g, 'flap', a.x, 0.3); } }
        else {
          a.vy += (-90 + Math.sin(a.t * 7 + a.ph) * 260) * dt; a.vy = U.clamp(a.vy, -160, 120);
          a.x += (a.vx + Math.sin(a.t * 5 + a.ph) * 60) * dt; a.y += a.vy * dt;
          if (a.t > 4 || a.y < -40) a.gone = true;
        }
      } else if (a.kind === 'fish') {
        // de tempos a tempos salta em arco e volta a cair, com salpicos e anéis na água
        if (a.st === 'wait') {
          a.wait -= dt;
          if (a.wait <= 0) { a.st = 'jump'; a.dir = Math.random() < 0.5 ? -1 : 1; a.vx = a.dir * (30 + Math.random() * 25); a.vy = -150 - Math.random() * 60; a.jx = a.x; a.jy = a.y; ripple(a.x, a.y); splash(a.x, a.y); sfx(g, 'splash', a.x, 0.18); }
        } else {
          a.jx += a.vx * dt; a.vy += 420 * dt; a.jy += a.vy * dt;
          if (a.vy > 0 && a.jy >= a.y) {
            const tx = Math.floor(a.jx / T), ty = Math.floor(a.y / T);
            if (r.tile(tx, ty) === '~') a.x = a.jx; // só muda de sítio se cair na água
            a.st = 'wait'; a.wait = 5 + Math.random() * 8; ripple(a.jx, a.y); splash(a.jx, a.y); sfx(g, 'splash', a.jx, 0.14);
          }
        }
      }
    }
    for (const w of Amb.ripples) w.t += dt;
    if (Amb.ripples.length && Amb.ripples[0].t > 1.2) Amb.ripples.shift();
    if (Amb.list.some((a) => a.gone)) Amb.list = Amb.list.filter((a) => !a.gone);
  };
  function ripple(x, y) { Amb.ripples.push({ x, y, t: 0 }); if (Amb.ripples.length > 12) Amb.ripples.shift(); }
  function splash(x, y) { for (let i = 0; i < 6; i++) VS.Gfx.emit({ x: x + U.rand(-3, 3), y: y - 1, vx: U.rand(-40, 40), vy: U.rand(-110, -50), life: 0.5, size: 1.2, color: 'rgba(190,240,225,0.8)', kind: 'drop', g: 400, layer: 1 }); }

  // ---------------------------------------------------------------- desenho (silhuetas escuras com um fio de luz)
  function crow(ctx, a, rim, body, white) {
    const s = white ? 1.1 : 1.25, x = a.x, y = a.y;
    ctx.save(); ctx.translate(x, y); ctx.scale(a.dir * s, s);
    if (a.st === 'idle') {
      const peck = a.peck > 0 ? Math.sin(a.peck / 0.35 * Math.PI) : 0, hop = a.hop > 0 ? Math.sin(a.hop / 0.25 * Math.PI) * 2 : 0;
      ctx.translate(0, -hop);
      ctx.strokeStyle = body; ctx.lineWidth = 0.7; ctx.beginPath(); ctx.moveTo(-0.6, -2.2); ctx.lineTo(-1, 0); ctx.moveTo(0.8, -2.2); ctx.lineTo(1, 0); ctx.stroke();
      for (const [col, ox, oy] of [[rim, -0.35, -0.5], [body, 0, 0]]) {
        ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(ox, -4 + oy, 4, 2.4, -0.15, 0, TAU); ctx.fill();
        ctx.beginPath(); ctx.moveTo(-3 + ox, -4 + oy); ctx.lineTo(-7.5 + ox, -3 + oy); ctx.lineTo(-3 + ox, -2.6 + oy); ctx.fill(); // cauda
        ctx.beginPath(); ctx.arc(3.3 + ox, -6.2 + peck * 2.2 + oy, 1.7, 0, TAU); ctx.fill(); // cabeça
        ctx.beginPath(); ctx.moveTo(4.6 + ox, -6.6 + peck * 2.4 + oy); ctx.lineTo(7.4 + ox, -5.7 + peck * 3 + oy); ctx.lineTo(4.7 + ox, -5.6 + peck * 2.4 + oy); ctx.fill(); // bico
      }
    } else {
      const w = Math.sin(a.t * 22);
      for (const [col, ox, oy] of [[rim, -0.35, -0.5], [body, 0, 0]]) {
        ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(ox, oy, 4, 1.8, -0.3, 0, TAU); ctx.fill();
        ctx.beginPath(); ctx.moveTo(-1 + ox, -0.5 + oy); ctx.lineTo(-4 + ox, -1 + oy - w * 6); ctx.lineTo(2 + ox, -0.8 + oy); ctx.fill();
        ctx.beginPath(); ctx.moveTo(-3 + ox, oy); ctx.lineTo(-7 + ox, 1.5 + oy); ctx.lineTo(-3 + ox, 1 + oy); ctx.fill();
        ctx.beginPath(); ctx.arc(3.6 + ox, -1.4 + oy, 1.5, 0, TAU); ctx.fill();
      }
    }
    ctx.restore();
  }
  function rat(ctx, a, rim, body) {
    ctx.save(); ctx.globalAlpha = Math.max(0, a.a); ctx.translate(a.x, a.y); ctx.scale(a.dir * 1.2, 1.2);
    const run = a.st !== 'idle', b = run ? Math.sin(a.t * (a.st === 'flee' ? 40 : 22)) * 0.6 : 0, sniff = a.st === 'idle' ? Math.sin(a.t * 14) * 0.4 : 0;
    ctx.strokeStyle = body; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.moveTo(-3.6, -1.2); ctx.quadraticCurveTo(-7, -0.4 + b, -9.5, -2.2 - b); ctx.stroke(); // cauda
    for (const [col, ox, oy] of [[rim, -0.3, -0.4], [body, 0, 0]]) {
      ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(ox, -1.8 + b * 0.3 + oy, 4, 1.9, 0, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.ellipse(3.6 + ox + sniff, -1.8 + oy, 2, 1.2, 0.2, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.arc(2.6 + ox, -3 + oy, 0.8, 0, TAU); ctx.fill(); // orelha
    }
    ctx.restore();
  }
  function bat(ctx, a, rim, body) {
    ctx.save(); ctx.translate(a.x, a.y);
    if (a.st === 'hang') {
      const sw = Math.sin(a.t * 1.3 + a.ph) * 0.08;
      ctx.rotate(sw);
      for (const [col, ox] of [[rim, -0.3], [body, 0]]) { ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(ox - 2.2, 1); ctx.quadraticCurveTo(ox - 2.8, 5, ox, 8); ctx.quadraticCurveTo(ox + 2.8, 5, ox + 2.2, 1); ctx.closePath(); ctx.fill(); }
    } else {
      const w = Math.sin(a.t * 30);
      for (const [col, ox, oy] of [[rim, -0.3, -0.4], [body, 0, 0]]) {
        ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(ox, oy, 1.6, 2.2, 0, 0, TAU); ctx.fill();
        for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(ox + s * 1.2, oy - 1); ctx.lineTo(ox + s * 7, oy - 3 - w * 4); ctx.lineTo(ox + s * 5, oy + 1); ctx.lineTo(ox + s * 3, oy); ctx.closePath(); ctx.fill(); }
      }
    }
    ctx.restore();
  }
  function fish(ctx, a, col) {
    if (a.st !== 'jump') return;
    ctx.save(); ctx.translate(a.jx, a.jy); ctx.rotate(Math.atan2(a.vy, a.vx));
    ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(0, 0, 4.2, 1.5, 0, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-3.5, 0); ctx.lineTo(-6.5, -2); ctx.lineTo(-6.5, 2); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(230,255,245,0.6)'; ctx.fillRect(-1.5, -0.9, 3.5, 0.6);
    ctx.restore();
  }

  Amb.draw = function (ctx, g) {
    if (!Amb.list.length && !Amb.ripples.length) return;
    const R = g.room.R || {}, rim = U.rgba(U.mix(R.light || '#ffb060', '#ffffff', 0.2), 0.55), body = '#100c10';
    for (const a of Amb.list) {
      const jumping = a.kind === 'fish' && a.st === 'jump', x = jumping ? a.jx : a.x, y = jumping ? a.jy : a.y;
      if (!VS.Gfx.inView(x - 12, y - 12, 24, 24, 20)) continue;
      if (a.kind === 'crow') crow(ctx, a, rim, body, false);
      else if (a.kind === 'dove') crow(ctx, a, 'rgba(255,250,240,0.95)', '#c8c0b8', true);
      else if (a.kind === 'rat') rat(ctx, a, rim, '#1a1414');
      else if (a.kind === 'bat') bat(ctx, a, rim, body);
      else if (a.kind === 'fish') fish(ctx, a, '#5a8a80');
    }
    ctx.lineWidth = 0.8;
    for (const w of Amb.ripples) { const k = w.t / 1.2; ctx.strokeStyle = `rgba(200,250,235,${0.5 * (1 - k)})`; ctx.beginPath(); ctx.ellipse(w.x, w.y + 1, 3 + k * 16, 1 + k * 3, 0, 0, TAU); ctx.stroke(); }
  };

  VS.Ambient = Amb;
})(window.VS);
