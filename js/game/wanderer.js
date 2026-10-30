// Vesperal — a Carpideira errante: escolhe salas ao acaso para aparecer. Umas salas antes ouve-se o choro ao longe;
// depois, ao entrar numa sala larga e sem altar, o choro aproxima-se e ela levanta-se do chão, longe da protagonista.
// Não fecha portas: pode-se fugir — e ela volta mais tarde, com a vida que tinha.
'use strict';
(function (VS) {
  const U = VS.U, T = U.TILE, A = VS.Audio;
  const W = {};
  // só depois de quatro guardiões vencidos (o começo do jogo fica em paz)
  W.unlocked = (st) => Object.keys(st.bosses || {}).filter((k) => st.bosses[k] && k !== 'carpideira').length >= 4;
  W.eligible = function (def) {
    if (!def || def.noWanderer || def.interiorSmall) return false;
    if (!def.map || def.map[0].length < 64) return false; // só salas largas (dois ecrãs ou mais)
    return !(def.ents || []).some((e) => e.t === 'boss' || e.t === 'altar' || e.t === 'npc' || e.t === 'shrine');
  };
  // sítio no chão, com espaço por cima, longe da protagonista (de preferência ao nível dela)
  W.findSpot = function (game) {
    const room = game.room, p = game.player, ptx = Math.floor(p.cx / T), pty = Math.floor((p.bottom - 2) / T);
    let best = null;
    for (let ty = 2; ty < room.h - 1; ty++) for (let tx = 3; tx < room.w - 3; tx++) {
      if (!room.isSolidTile(tx, ty + 1)) continue;
      let free = true;
      for (let dx = -1; dx <= 1 && free; dx++) for (let dy = 0; dy < 6 && free; dy++) if (room.isSolidTile(tx + dx, ty - dy) || room.isHazard(tx + dx, ty - dy)) free = false;
      if (!free || room.isHazard(tx, ty + 1)) continue;
      const dist = Math.abs(tx - ptx), lvl = Math.abs(ty - pty);
      if (dist < 9) continue;
      const score = -lvl * 6 - Math.abs(dist - 14);
      if (!best || score > best.score) best = { tx, ty, score };
    }
    return best;
  };
  W.onEnter = function (game) {
    const st = VS.state; game.wanderT = 0;
    if (!st || (st.bosses && st.bosses.carpideira) || !W.unlocked(st) || game.script) return;
    const f = st.flags;
    f.carp_steps = (f.carp_steps || 0) + 1;
    if (!f.carp_due) f.carp_due = 5 + Math.floor(Math.random() * 4);
    const left = f.carp_due - f.carp_steps;
    // nas salas antes de ela aparecer, o choro ouve-se ao longe (cada vez mais perto)
    if (left <= 3) VS.Assets.sheet('en_b_carpideira');
    if (left > 0) {
      if (left === 1 || (left <= 3 && Math.random() < 0.8)) {
        setTimeout(() => { if (game.room) A.sfx('wail_far', { vol: 0.35 + (3 - left) * 0.15 }); }, 700 + Math.random() * 1500);
        if (!f.carp_heard) { f.carp_heard = 1; setTimeout(() => VS.UI.toast(VS.t('msg_wail_far'), 4), 2400); }
      }
      return;
    }
    if (!W.eligible(VS.ROOMS[game.room.id])) return;
    const spot = W.findSpot(game);
    if (!spot) return;
    f.carp_steps = 0; f.carp_due = 6 + Math.floor(Math.random() * 5);
    game.wanderSpot = { room: game.room.id, x: spot.tx, y: spot.ty }; game.wanderT = 2.4;
    A.sfx('wail_far', { vol: 0.9 });
    VS.UI.toast(VS.t('msg_wail_near'), 3);
  };
  W.update = function (game, dt) {
    const b = game.boss; if (b && b.bossId === 'carpideira' && !b.defeated) VS.state.flags.carp_hp = b.hp;
    if (!(game.wanderT > 0)) return;
    game.wanderT -= dt;
    if (game.wanderT > 0) return;
    const s = game.wanderSpot;
    if (!s || s.room !== game.room.id || game.boss || game.cutscene) return;
    W.spawn(game, s.x, s.y);
  };
  W.spawn = function (game, tx, ty) {
    const b = VS.Bosses.spawn({ boss: 'carpideira', x: tx, y: ty, floor: ty + 1 }, game);
    const hp = VS.state.flags.carp_hp; if (hp > 0 && hp < b.maxHp) b.hp = hp;
    b.wanderer = true;
    return b;
  };
  VS.Wanderer = W;
})(window.VS);
