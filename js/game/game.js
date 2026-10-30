// Vesperal — cena de jogo: salas, entidades, resolução de golpes, transições, descanso, morte, guiões
'use strict';
(function (VS) {
  const U = VS.U, T = U.TILE, G = VS.Gfx, A = VS.Audio;

  class Game {
    constructor(state) {
      this.state = state; VS.state = state;
      this.room = null; this.player = null; this.ents = []; this.hitboxes = [];
      this.time = 0; this.stop = 0; this.fade = 0; this.fadeTarget = 0; this.transition = null;
      this.cutscene = false; this.script = null; this.boss = null; this.paused = false;
      this.weatherT = 0; this.lightning = 0; this.areaShown = null; this.toastQ = [];
      this.prompt = null; this.interactTarget = null;
      VS.events.on('lightning', () => { this.lightning = 1; });
    }

    // ---------- arranque ----------
    start() {
      const st = this.state;
      let id = st.room, x = st.x, y = st.y;
      if (!VS.ROOMS[id]) { id = 'r1_wake'; x = null; }
      this.loadRoom(id, x !== null && x !== undefined ? { x, y } : { rest: st.restId });
      this.fade = 1; this.fadeTarget = 0;
    }

    loadRoom(id, entry) {
      // segurança: sair de uma sala a meio de um combate/introdução nunca deixa o jogo preso
      if (this.boss) { this.boss = null; G.cam.lock = null; this.musicLock = false; VS.UI.bossBar(null); }
      if (!this.script) this.cutscene = false;
      VS.FX.clear();
      const st = this.state;
      const def = VS.ROOMS[id];
      VS.Assets.preloadRoom(def);
      // e as das salas vizinhas (a próxima sala já está a carregar quando se chega à porta)
      { const w = def.w || 1, hh = def.h || 1, seen = {}; for (let i = -1; i <= w; i++) for (let j = -1; j <= hh; j++) { const nb = VS.World.roomAtCell(def.x + i, def.y + j); if (nb && nb !== def && !seen[nb.id]) { seen[nb.id] = 1; VS.Assets.preloadRoom(nb); } } }
      const room = VS.World.fresh(id);
      this.room = room;
      (st.broken[id] || []).forEach((k) => { room.broken[k] = true; });
      this.ents = []; this.hitboxes = []; G.particles.length = 0; this.entsSig = (this.entsSig || 0) + 1;
      this.boss = null; G.cam.lock = null; VS.UI.bossBar(null); this.floodY = 0;
      // entidades declaradas
      (def.ents || []).forEach((e, i) => this.spawnFromDef(e, i));
      // inimigos marcados por letras no mapa
      const legend = Object.assign({}, room.R.enemies, def.legend || {});
      for (let ty = 0; ty < room.h; ty++) for (let tx = 0; tx < room.w; tx++) {
        const ch = room.grid[ty][tx];
        if (ch >= 'a' && ch <= 'z' && legend[ch]) {
          room.setTile(tx, ty, ' ');
          if (!def.noEnemies) this.spawnFromDef({ t: 'enemy', k: legend[ch], x: tx, y: ty }, 'm' + tx + '_' + ty);
        } else if (ch >= 'a' && ch <= 'z') room.setTile(tx, ty, ' ');
        if (ch === 'P' || ch === 'R') room.setTile(tx, ty, ' ');
      }
      // carrega já as folhas dos inimigos desta sala (evita um fotograma sem desenho)
      for (const e of this.ents) if (e.isEnemy) { const n = 'en_' + ((e.K && e.K.sheet) || e.kind); if (VS.SPRITE_META[n]) VS.Assets.img('sprites/' + n + '.png'); }
      // eco (sombra) do jogador deixado na morte
      if (st.shade && st.shade.room === id) this.spawn(new VS.Obj.Shade(st.shade.x, st.shade.y, st.shade.ash));
      // jogador
      let px, py;
      if (entry && entry.rest) {
        const alt = this.ents.find((e) => e.isAltar && e.altarId === entry.rest);
        if (alt) { px = alt.cx - 6; py = alt.bottom - 30; }
      }
      if (px === undefined && entry && entry.x !== undefined && entry.x !== null) { px = entry.x; py = entry.y; }
      if (px === undefined) {
        const sp = this.findSpawn(def);
        px = sp.x; py = sp.y;
      }
      if (!this.player) this.player = new VS.Player(px, py);
      else { this.player.x = px; this.player.y = py; }
      if (entry && entry.vx !== undefined) { this.player.vx = entry.vx; this.player.vy = entry.vy; }
      this.player.lastSafe = { x: this.player.x, y: this.player.y };
      if (entry && entry.facing) this.player.facing = entry.facing;
      G.setCameraBounds(room.pw, room.ph);
      G.cameraFollow(this.player.cx, this.player.cy, 1, true);
      st.room = id; st.visited[id] = true;
      // música e ambiente
      if (!this.musicLock) this.setRegionAudio();
      // título da região ao entrar numa região nova
      const regionName = def.area || ('reg_' + room.region);
      if (this.areaShown !== regionName) { this.areaShown = regionName; VS.UI.areaTitle(VS.t(regionName)); }
      if (def.onEnter) def.onEnter(this);
      VS.events.emit('room', id);
      if (VS.Wanderer) VS.Wanderer.onEnter(this);
    }
    setRegionAudio() {
      const def = VS.ROOMS[this.room.id];
      A.playMusic(def.music || this.room.R.music);
      A.setAmbience(def.amb || this.room.R.amb);
    }
    findSpawn(def) {
      const room = this.room;
      for (let ty = 0; ty < room.h; ty++) for (let tx = 0; tx < room.w; tx++) if (VS.ROOMS[room.id].map[ty][tx] === 'P') return { x: tx * T + 4, y: ty * T - 10 };
      const alt = this.ents.find((e) => e.isAltar);
      if (alt) return { x: alt.cx - 6, y: alt.bottom - 30 };
      return { x: room.pw / 2, y: 40 };
    }
    spawnFromDef(e, i) {
      const st = this.state;
      const key = this.room.id + ':' + (e.id || e.t + i);
      const make = VS.Obj.make(e, key, this);
      if (make) { make.defKey = key; this.spawn(make); }
    }
    spawn(e) { this.ents.push(e); this.entsSig = (this.entsSig || 0) + 1; if (e.onSpawn) e.onSpawn(this); return e; }
    addHitbox(hb) { this.hitboxes.push(hb); }

    // ---------- ciclo ----------
    update(dt) {
      const st = this.state;
      this.time += dt; G.time += dt;
      if (!this.cutscene) st.playTime += dt;
      for (const b in st.buffs) { st.buffs[b] -= dt; if (st.buffs[b] <= 0) delete st.buffs[b]; }
      if (this.script) this.runScript(dt);
      // transição entre salas (escurecimento curto)
      if (this.transition) { this.updateTransition(dt); return; }
      if (this.stop > 0) { this.stop -= dt; G.updateParticles(dt * 0.2); VS.FX.update(dt * 0.35); return; }
      const p = this.player;
      p.update(dt, this);
      for (const e of this.ents) if (!e.remove) e.update(dt, this);
      if (VS.Wanderer) VS.Wanderer.update(this, dt);
      this.resolveHits();
      if (this.ents.some((e) => e.remove)) { this.ents = this.ents.filter((e) => !e.remove); this.entsSig = (this.entsSig || 0) + 1; }
      this.hitboxes.length = 0;
      this.updateInteract();
      this.checkExit();
      // câmara com antecipação na direção do olhar
      const look = p.facing * 30 + p.vx * 0.12;
      this.camLook = U.lerp(this.camLook || 0, look, 1 - Math.exp(-dt * 2));
      let lookY = 0; if (VS.Input.down('down') && p.onGround && Math.abs(p.vx) < 5 && p.idleT > 0.4) lookY = 70; if (VS.Input.down('up') && p.onGround && Math.abs(p.vx) < 5 && p.idleT > 0.4) lookY = -70;
      this.camLookY = U.lerp(this.camLookY || 0, lookY, 1 - Math.exp(-dt * 3));
      // arenas altas: a câmara puxa um pouco para o chefe (sem perder a jogadora de vista)
      let bias = 0; const bo = this.boss;
      if (bo && bo.K && bo.K.camBias && !bo.defeated) bias = U.clamp((bo.cy - p.cy) * bo.K.camBias, -U.VIEW_H * 0.34, U.VIEW_H * 0.34);
      this.camBiasY = U.lerp(this.camBiasY || 0, bias, 1 - Math.exp(-dt * 2.5));
      G.cameraFollow(p.cx + this.camLook, p.cy - 20 + this.camLookY + this.camBiasY, dt);
      this.updateWeather(dt);
      G.updateParticles(dt, (x, y) => this.room.solidAtPoint(x, y));
      VS.FX.update(dt);
      if (this.lightning > 0) this.lightning -= dt * 2.5;
      // crumble
      for (const k in this.room.crumble) {
        const c = this.room.crumble[k];
        if (c.t > 0 && !c.gone) { c.t -= dt; if (c.t <= 0) { c.gone = true; c.back = 3; VS.Audio.sfx('break', { vol: 0.5 }); const [tx, ty] = k.split(',').map(Number); G.burst(tx * T + 10, ty * T + 10, 10, { color: this.room.R.stone, speed: 60, g: 400, life: 0.8, size: 2.5, kind: 'flake', vr: 5 }); } }
        else if (c.gone) { c.back -= dt; if (c.back <= 0) { const [tx, ty] = k.split(',').map(Number); const r = { x: tx * T, y: ty * T, w: T, h: T }; if (!U.overlap(r, p)) delete this.room.crumble[k]; } }
      }
      if (p.onGround) {
        const tx0 = Math.floor((p.x + 1) / T), tx1 = Math.floor((p.x + p.w - 1) / T), ty = Math.floor((p.bottom + 2) / T);
        for (let tx = tx0; tx <= tx1; tx++) if (this.room.tile(tx, ty) === 'X') { const k = tx + ',' + ty; if (!this.room.crumble[k]) this.room.crumble[k] = { t: 0.55, gone: false }; }
      }
      VS.UI.hudUpdate && VS.UI.hudUpdate(dt, this);
    }

    resolveHits() {
      const p = this.player, st = this.state;
      const playerHBs = [];
      if (p.attackHB) playerHBs.push(Object.assign({ owner: p }, p.attackHB));
      for (const hb of this.hitboxes) if (hb.owner === p) playerHBs.push(hb);
      // projéteis do jogador
      for (const e of this.ents) if (e instanceof VS.Projectile && e.team === 'player' && !e.remove) playerHBs.push(Object.assign(e.hitbox(), { owner: p, kind: e.kind === 'spark' ? 'spell' : 'reflect', poise: e.poise || 20, kx: Math.sign(e.vx), proj: e }));
      // golpes do jogador sobre inimigos e objetos
      for (const hb of playerHBs) {
        for (const e of this.ents) {
          if (e.remove || !e.hittable || e.dead) continue;
          if (!U.overlap(hb, e.hurtbox())) continue;
          if (e.alreadyHit(hb.id)) continue;
          const r = e.onHit(hb, this);
          if (r === false) continue;
          if (hb.proj) { if (!hb.proj.pierce) hb.proj.remove = true; else hb.proj.pierce--; hb.proj.onDestroy(this); }
          if (hb.pogo && hb.name !== 'heavy') p.pogo();
          if (hb.pogo && p.action && p.action.type === 'plunge') { p.vy = -330; p.action = null; }
          if (r !== 'blocked' && e.isEnemy) { st.lume = Math.min(100, st.lume + (hb.kind === 'spell' ? 0 : 7)); }
          if (r !== 'blocked' && hb.owner === p && p.action && p.action.d && !hb.proj) {
            // pequeno recuo do jogador ao acertar
            if (p.onGround && hb.kind !== 'heavy') p.vx -= p.dir * 50;
          }
        }
      }
      // golpes inimigos sobre o jogador
      if (p.action && p.action.type === 'dead') return;
      const ph = p.hurtbox();
      for (const e of this.ents) {
        if (e.remove) continue;
        const hbs = e.attackHBs;
        if (hbs) for (const hb of hbs) {
          if (!U.overlap(hb, ph)) continue;
          if (p.alreadyHit(hb.id)) continue;
          hb.src = hb.src || e;
          const res = p.receiveHit(hb, this);
          if (res === 'immune' || res === 'dodge') p.hitIds.delete(hb.id);
          if (res === 'block' && e.onBlocked) e.onBlocked(this);
          if (res === 'hit' && e.K && e.K.onHitPlayer) e.K.onHitPlayer(e, hb, this);
        }
        if (e instanceof VS.Projectile && e.team === 'enemy' && U.overlap(e, ph)) {
          const hb = e.hitbox();
          if (p.alreadyHit(hb.id)) continue;
          const res = p.receiveHit(hb, this);
          if (res === 'parry') {
            if (e.reflectable) { e.team = 'player'; e.vx = -e.vx * 1.3; e.vy = -e.vy * 0.5 - 40; e.dmg = Math.round(e.dmg * 2); e.life = 2; e.id = VS.Entity.newAttackId(); e.homing = 0; }
            else e.remove = true;
          } else if (res === 'block' || res === 'hit') { if (res === 'hit' && e.onHitPlayer) e.onHitPlayer(p, this); if (!e.persist) { e.remove = true; e.onDestroy(this); } }
          else if (res === 'immune' || res === 'dodge') p.hitIds.delete(hb.id);
        }
        if (e.contactDmg && !e.dead && e.contactActive !== false && U.overlap(e.hurtbox(), ph)) {
          const id = 'c' + (e.uid || (e.uid = VS.Entity.newAttackId()));
          if (p.iframes <= 0 && !(p.action && p.action.type === 'dodge' && p.action.inv)) {
            p.receiveHit({ dmg: e.contactDmg, id, parryable: false, src: e, x: e.x, y: e.y, w: e.w, h: e.h }, this);
          }
        }
      }
    }

    onParry(hb, p) {
      const src = hb.src || hb.owner;
      VS.Audio.sfx('parry'); this.hitstop(0.14); G.addShake(0.25); G.flash('#ffffff', 0.35);
      const s = p.shoulder();
      VS.FX.parry(s.x + p.dir * 14, s.y, p.dir);
      if (src && src.onParried && !hb.projectile) src.onParried(this, hb);
      this.state.flags.parries = (this.state.flags.parries || 0) + 1;
    }
    hitstop(t) { this.stop = Math.max(this.stop, t); }

    // ---------- interação ----------
    updateInteract() {
      const p = this.player;
      let best = null, bd = 1e9;
      if (!p.action && p.onGround) for (const e of this.ents) {
        if (!e.interactable || e.remove || (e.canInteract && !e.canInteract(this))) continue;
        // entre dois alvos perto, prefere aquele para quem se está a olhar
        const d = Math.abs(e.cx - p.cx) + Math.abs(e.bottom - p.bottom) * 0.5 + ((e.cx - p.cx) * p.facing < -4 ? 14 : 0);
        if (d < (e.range || 28) && d < bd) { best = e; bd = d; }
      }
      this.interactTarget = best;
    }
    tryInteract(p) {
      const e = this.interactTarget;
      if (!e) return false;
      e.interact(this);
      return true;
    }

    // ---------- saída de sala ----------
    checkExit() {
      const p = this.player, room = this.room;
      if (p.action && p.action.type === 'dead') return;
      const cx = p.cx, cy = p.cy;
      let side = null;
      if (cx < 0) side = 'L'; else if (cx > room.pw) side = 'R'; else if (cy < 0) side = 'U'; else if (cy > room.ph) side = 'D';
      if (!side) return;
      const gx = room.gx + cx, gy = room.gy + cy;
      const nd = VS.World.roomAtTile(Math.floor(gx / T), Math.floor(gy / T));
      if (!nd || this.boss) {
        // sem sala: devolver para dentro (não deveria acontecer em salas bem desenhadas)
        p.x = U.clamp(p.x, 0, room.pw - p.w); if (cy > room.ph) { p.hazardHit(this); } else p.y = U.clamp(p.y, 0, room.ph - p.h);
        return;
      }
      const ngx = nd.x * U.CELL_W * T, ngy = nd.y * U.CELL_H * T;
      const entry = { x: room.gx + p.x - ngx, y: room.gy + p.y - ngy, vx: p.vx, vy: p.vy, facing: p.facing };
      if (side === 'U') { entry.vy = Math.min(p.vy, -500); entry.y -= 4; }
      if (side === 'D') entry.y += 2;
      if (side === 'L') entry.x -= 2; if (side === 'R') entry.x += 2;
      this.transition = { t: 0, phase: 'out', to: nd.id, entry };
    }
    updateTransition(dt) {
      const tr = this.transition; tr.t += dt;
      if (tr.phase === 'out') {
        this.fade = Math.min(1, tr.t / 0.07);
        if (tr.t >= 0.07) {
          const p = this.player;
          const keep = { action: p.action && (p.action.type === 'dodge' || p.action.type === 'attack') ? null : p.action };
          this.loadRoom(tr.to, tr.entry);
          p.action = keep.action;
          tr.phase = 'in'; tr.t = 0;
          this.autosave();
        }
      } else {
        this.fade = Math.max(0, 1 - tr.t / 0.12);
        this.player.update(dt, this);
        G.cameraFollow(this.player.cx + (this.camLook || 0), this.player.cy - 20, dt);
        if (tr.t >= 0.12) { this.transition = null; this.fade = 0; }
      }
    }

    // ---------- paredes, segredos ----------
    breakWall(tx, ty) {
      const room = this.room, ch = room.tile(tx, ty);
      const keys = room.breakGroup(tx, ty);
      if (!keys.length) return;
      const st = this.state;
      st.broken[room.id] = (st.broken[room.id] || []).concat(keys);
      VS.Tiles.invalidate(room);
      VS.Audio.sfx('break'); G.addShake(0.3);
      keys.forEach((k) => { const [x, y] = k.split(',').map(Number); G.burst(x * T + 10, y * T + 10, 8, { color: room.R.stone, speed: 120, g: 500, life: 0.9, size: 2.6, kind: 'flake', vr: 6, collide: true }); });
      if (ch === 'F') { VS.Audio.sfx('secret', { delay: 0.2 }); st.flags.secrets = (st.flags.secrets || 0) + 1; this.toast(VS.t('msg_secret')); }
      this.autosave();
    }
    respawnAtSafe(p) {
      this.stop = 0.25; this.fade = 0.7;
      p.x = p.lastSafe.x; p.y = p.lastSafe.y; p.vx = 0; p.vy = 0; p.action = { type: 'hurt', t: 0 };
      setTimeout(() => { this.fade = 0; }, 180);
    }

    // ---------- descanso, morte ----------
    rest(altar) {
      const st = this.state, p = this.player;
      st.hp = st.hpMax; st.flasks = st.flasksMax;
      st.restRoom = this.room.id; st.restId = altar.altarId;
      if (!st.altars[altar.altarId]) { st.altars[altar.altarId] = { room: this.room.id, name: altar.nameKey }; this.toast(VS.t('msg_altar_lit')); }
      p.action = { type: 'rest', t: 0, dur: 99 };
      VS.Audio.sfx('rest');
      G.burst(altar.cx, altar.y + 6, 30, { color: '#ffb050', speed: 80, life: 1, size: 2, add: true, g: -40 });
      this.save();
      VS.UI.openRest(this, altar);
    }
    endRest(reload) {
      const p = this.player;
      p.action = null;
      if (reload) { // os inimigos regressam
        const pos = { x: p.x, y: p.y, facing: p.facing };
        this.loadRoom(this.room.id, pos);
      }
    }
    onPlayerDeath() {
      const st = this.state, p = this.player;
      st.deaths++;
      // eco: a cinza fica onde caíste (o eco anterior perde-se)
      if (st.ash > 0) st.shade = { room: this.room.id, x: p.lastSafe.x, y: p.lastSafe.y, ash: st.ash };
      else st.shade = null;
      st.ash = 0;
      this.save();
      VS.UI.showDeath(() => this.respawn());
    }
    respawn() {
      const st = this.state;
      st.hp = st.hpMax; st.flasks = st.flasksMax; st.lume = Math.min(st.lume, 30);
      this.player = null; this.musicLock = false;
      this.loadRoom(st.restRoom, { rest: st.restId });
      this.player.action = { type: 'rest', t: 0.4, dur: 1.2 };
      this.fade = 1; this.fadeTarget = 0;
      this.save();
    }
    travel(altarId) {
      const a = this.state.altars[altarId]; if (!a) return;
      this.fade = 1;
      this.loadRoom(a.room, { rest: altarId });
      this.state.restRoom = a.room; this.state.restId = altarId;
      this.player.action = { type: 'rest', t: 0.4, dur: 1.0 };
      this.save();
    }

    // ---------- chefes ----------
    startBoss(boss) {
      this.boss = boss;
      if (boss.arena) G.cam.lock = boss.camLock || null;
      this.musicLock = true;
      A.playMusic(boss.music, { fade: 0.6, restart: true });
      A.setIntensity(0);
      VS.UI.bossBar(boss);
      this.ents.forEach((e) => { if (e.isBossGate) e.close(this); });
    }
    endBoss(boss) {
      this.boss = null; G.cam.lock = null; this.musicLock = false;
      VS.UI.bossBar(null);
      this.ents.forEach((e) => { if (e.isBossGate) e.setOpen(this, true); });
      A.stopMusic(2.5);
      setTimeout(() => { if (!this.boss && this.room) this.setRegionAudio(); }, 5000);
      this.save();
    }

    // ---------- mensagens ----------
    toast(text) { VS.UI.toast(text); }
    hint(key) { const st = this.state; if (st.flags['h_' + key]) return; st.flags['h_' + key] = 1; VS.UI.toast(VS.t(VS.I18N.dev(key)), 4); }

    // ---------- guiões (cutscenes simples) ----------
    play(steps, done) { this.script = { steps: steps.slice(), t: 0, waiting: false, done }; this.cutscene = true; }
    runScript(dt) {
      const s = this.script;
      if (s.waiting) return;
      if (s.t > 0) { s.t -= dt; return; }
      const step = s.steps.shift();
      if (!step) { this.script = null; this.cutscene = false; if (s.done) s.done(this); return; }
      if (step.wait) s.t = step.wait;
      if (step.fn) step.fn(this);
      if (step.say) { s.waiting = true; VS.UI.dialogue(step.say, step.choices, (ch) => { s.waiting = false; if (step.then) step.then(this, ch); }); }
      if (step.fade !== undefined) this.fadeTarget = step.fade;
      if (step.music) A.playMusic(step.music);
      if (step.shake) G.addShake(step.shake);
      if (step.flash) G.flash(step.flash, 0.8);
    }

    // ---------- gravação ----------
    snapshotPos() {
      const st = this.state, p = this.player;
      if (p && !(p.action && p.action.type === 'dead')) { st.x = p.lastSafe.x; st.y = p.lastSafe.y; st.room = this.room.id; st.facing = p.facing; }
    }
    save() { this.snapshotPos(); VS.Save.write(VS.slot, this.state.serialize()); }
    autosave() { if (this.boss) return; this.save(); }

    // ---------- clima ----------
    updateWeather(dt) {
      const R = this.room.R, w = R.weather, cam = G.cam;
      const X = () => cam.x + U.rand(-20, U.VIEW_W + 20), Y = () => cam.y + U.rand(-20, U.VIEW_H + 20);
      this.weatherT += dt;
      if (w === 'ash' || w === 'ashstorm') {
        const n = w === 'ashstorm' ? 3 : 1;
        for (let i = 0; i < n; i++) if (Math.random() < 0.6) G.emit({ x: X(), y: cam.y - 10, vx: U.rand(-20, 10) + (w === 'ashstorm' ? -60 : 0), vy: U.rand(15, 40), life: 9, size: U.rand(0.6, 1.6), color: U.pick(['#9a9090', '#7a7070', '#c0b4ac']), kind: 'flake', vr: U.rand(-2, 2), wobble: 1.3, fade: false, alpha: 0.7, layer: 1 });
        if (Math.random() < 0.06) G.emit({ x: X(), y: cam.y + U.VIEW_H + 5, vx: U.rand(-10, 10), vy: U.rand(-40, -20), life: 6, size: 1.1, color: '#ff8a3a', add: true, wobble: 2, layer: 1 });
      } else if (w === 'rain') {
        for (let i = 0; i < 4; i++) G.emit({ x: X() + 40, y: cam.y - 10, vx: -70, vy: 620, life: 0.75, size: 2.6, color: 'rgba(170,200,230,0.55)', kind: 'line', fade: false, layer: 1 });
      } else if (w === 'sparks' || w === 'embers') {
        if (Math.random() < (w === 'sparks' ? 0.5 : 0.2)) G.emit({ x: X(), y: cam.y + U.VIEW_H + 5, vx: U.rand(-15, 15), vy: U.rand(-60, -25), life: 6, size: U.rand(0.8, 1.6), color: U.pick(['#ffb040', '#ff7020', '#ffe080']), add: true, wobble: 2.4, layer: 1 });
      } else if (w === 'fireflies') {
        if (Math.random() < 0.08) G.emit({ x: X(), y: Y(), vx: U.rand(-10, 10), vy: U.rand(-8, 8), life: 5, size: 1.4, color: '#c8ffa0', add: true, kind: 'glow', wobble: 1.5, layer: 1 });
        if (Math.random() < 0.15) G.emit({ x: X() + 40, y: cam.y - 10, vx: -20, vy: 380, life: 1, size: 2, color: 'rgba(170,220,210,0.35)', kind: 'line', fade: false, layer: 1 });
      } else if (w === 'wind') {
        if (Math.random() < 0.25) G.emit({ x: cam.x + U.VIEW_W + 10, y: Y(), vx: U.rand(-260, -160), vy: U.rand(-10, 10), life: 4, size: U.rand(3, 6), color: 'rgba(220,210,240,0.18)', kind: 'line', layer: 1 });
        if (Math.random() < 0.02) G.emit({ x: cam.x + U.VIEW_W + 10, y: Y(), vx: -120, vy: 10, life: 6, size: 1.5, color: '#2a2430', kind: 'leaf', vr: 4, wobble: 3, layer: 1 });
      } else if (w === 'incense') {
        if (Math.random() < 0.06) G.emit({ x: X(), y: cam.y + U.VIEW_H, vx: U.rand(-5, 5), vy: U.rand(-15, -6), life: 9, size: U.rand(10, 22), color: 'rgba(170,150,200,0.06)', kind: 'glow', color2: '#000000', layer: 1 });
        if (Math.random() < 0.08) G.emit({ x: X(), y: Y(), vx: 0, vy: 6, life: 4, size: 0.8, color: '#ffe0a0', add: true, layer: 1 });
      } else if (w === 'dust') {
        if (Math.random() < 0.15) G.emit({ x: X(), y: Y(), vx: U.rand(-4, 4), vy: U.rand(-3, 6), life: 6, size: 0.7, color: '#a0a0b0', alpha: 0.5, layer: 1 });
      }
    }

    // ---------- desenho ----------
    // desenho interpolado: põe câmara, jogadora e entidades na posição entre o passo anterior e o atual
    // (alpha 0..1), desenha e repõe. Saltos grandes (teletransporte, mudança de sala) não se interpolam.
    drawInterp(alpha, dt) {
      const c = G.cam, list = this.ents, p = this.player, saved = this._saved || (this._saved = []);
      const ia = (1 - alpha) * U.DT; G.ia = this.stop > 0 ? 0 : ia;
      let n = 0;
      const lerp = (e) => {
        if (e._px === undefined) return;
        const dx = e.x - e._px, dy = e.y - e._py;
        if (dx === 0 && dy === 0) return;
        if (dx * dx + dy * dy > 64 * 64) return;
        saved[n++] = e; saved[n++] = e.x; saved[n++] = e.y;
        e.x = e._px + dx * alpha; e.y = e._py + dy * alpha;
      };
      let cx = c.x, cy = c.y;
      if (c.px !== undefined && Math.abs(c.x - c.px) < 80 && Math.abs(c.y - c.py) < 80) { c.x = c.px + (c.x - c.px) * alpha; c.y = c.py + (c.y - c.py) * alpha; }
      if (p) lerp(p);
      for (let i = 0; i < list.length; i++) lerp(list[i]);
      try { this.draw(dt); } finally {
        for (let i = 0; i < n; i += 3) { saved[i].x = saved[i + 1]; saved[i].y = saved[i + 2]; saved[i] = null; }
        c.x = cx; c.y = cy; G.ia = 0;
      }
    }
    // seta na borda do ecrã a apontar para o chefe quando ele está fora de vista
    drawBossPointer(ctx) {
      const b = this.boss; if (!b || b.defeated || this.cutscene) return;
      const sx = b.cx - G.cam.x, sy = b.cy - G.cam.y, m = 16;
      if (sx > -4 && sx < U.VIEW_W + 4 && sy > -4 && sy < U.VIEW_H + 4) return;
      const x = U.clamp(sx, m, U.VIEW_W - m), y = U.clamp(sy, m + 10, U.VIEW_H - m), a = Math.atan2(sy - y, sx - x);
      const pulse = 0.7 + 0.3 * Math.sin(this.time * 6);
      ctx.save(); ctx.translate(x, y);
      ctx.globalAlpha = 0.85 * pulse; ctx.globalCompositeOperation = 'lighter';
      ctx.drawImage(G.glowSprite('#ffc070'), -12, -12, 24, 24);
      ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 0.95;
      ctx.rotate(a); ctx.fillStyle = '#f0e0c0'; ctx.strokeStyle = '#1a1014'; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(8, 0); ctx.lineTo(-3, -5); ctx.lineTo(-1, 0); ctx.lineTo(-3, 5); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.restore();
    }
    draw(dt) {
      dt = dt || 1 / 60;
      const ctx = G.ctx, room = this.room, R = room.R, cam = G.cam;
      // céu + paralaxe + névoa numa imagem de resolução reduzida (são planos distantes e suaves): uma só
      // passagem de ecrã inteiro no canvas principal em vez de seis
      const bc = G.bgLayer();
      bc.setTransform(G.bgScale, 0, 0, G.bgScale, 0, 0);
      VS.BG.drawSky(bc, R, this.time);
      if (this.lightning > 0) { bc.fillStyle = `rgba(200,220,255,${this.lightning * 0.35})`; bc.fillRect(0, 0, U.VIEW_W, U.VIEW_H); }
      VS.BG.draw(bc, R, cam, room.ph, G.bgScale);
      bc.fillStyle = R.haze; bc.fillRect(0, 0, U.VIEW_W, U.VIEW_H);
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.imageSmoothingEnabled = true;
      ctx.drawImage(G.bgCanvas, 0, 0, G.bgCanvas.width, G.bgCanvas.height, 0, 0, G.canvas.width, G.canvas.height);
      G.screenTransform(ctx);
      G.worldTransform(ctx);
      if (R.interior || VS.ROOMS[room.id].interior) VS.Deco.drawBackdrop(ctx, room, R, cam);
      VS.Deco.drawBack(ctx, room, R, this.time);
      // entidades atrás
      // ordem de desenho por camada (z): reaproveita o vetor e só reordena quando a lista muda
      const list = this._drawList || (this._drawList = []);
      if (this._drawN !== this.ents.length || this._drawSig !== this.entsSig) { list.length = 0; for (const e of this.ents) list.push(e); list.sort((a, b) => (a.z || 0) - (b.z || 0)); this._drawN = this.ents.length; this._drawSig = this.entsSig; }
      for (const e of list) if ((e.z || 0) < 0 && G.inView(e.x, e.y, e.w, e.h, 120)) e.draw(ctx, this);
      G.drawParticles(ctx, 1);
      VS.Tiles.drawRoom(ctx, room, R, cam, this.time);
      G.drawParticles(ctx, 0);
      // os chefes desenham-se sempre: os avisos deles (auréolas, colunas, muros de fogo) podem estar longe do corpo
      for (const e of list) if ((e.z || 0) >= 0 && (e.z || 0) < 10 && (e.isBoss || e.drawAlways || G.inView(e.x, e.y, e.w, e.h, 160))) e.draw(ctx, this);
      this.player.draw(ctx, this);
      for (const e of list) if ((e.z || 0) >= 10 && G.inView(e.x, e.y, e.w, e.h, 160)) e.draw(ctx, this);
      VS.Tiles.drawLiquids(ctx, room, R, cam, this.time);
      if (this.floodY) { // cheia (Ama Elowen)
        const y0 = this.floodY;
        ctx.fillStyle = 'rgba(40,110,100,0.45)'; ctx.beginPath(); ctx.moveTo(cam.x - 10, room.ph);
        for (let x = cam.x - 10; x <= cam.x + U.VIEW_W + 10; x += 10) ctx.lineTo(x, y0 + Math.sin(this.time * 2 + x * 0.05) * 2);
        ctx.lineTo(cam.x + U.VIEW_W + 10, room.ph); ctx.fill();
        ctx.strokeStyle = 'rgba(190,240,230,0.5)'; ctx.lineWidth = 1; ctx.beginPath();
        for (let x = cam.x - 10; x <= cam.x + U.VIEW_W + 10; x += 10) { const yy = y0 + Math.sin(this.time * 2 + x * 0.05) * 2; x === cam.x - 10 ? ctx.moveTo(x, yy) : ctx.lineTo(x, yy); }
        ctx.stroke();
      }
      // luz
      G.beginLights(VS.ROOMS[room.id].dark !== undefined ? VS.ROOMS[room.id].dark : R.dark, R.darkColor);
      if (this.lightning > 0.3) G.ambientDark *= 0.4;
      this.player.emitLight(this);
      for (const e of this.ents) if (e.emitLight) e.emitLight(this);
      VS.Deco.lights(room, R, this.time);
      VS.FX.lights();
      G.drawLights();
      G.worldTransform(ctx);
      // efeitos de combate por cima da escuridão (cortes, clarões, fagulhas)
      VS.FX.draw(ctx);
      G.drawParticles(ctx, 2);
      VS.Deco.drawFront(ctx, room, R, cam);
      // indicador de interação
      if (this.interactTarget && !this.cutscene) VS.UI.drawPrompt(ctx, this.interactTarget, this);
      G.screenTransform(ctx);
      G.vignette(0.55, R.tint);
      this.drawBossPointer(ctx);
      G.drawDread(dt);
      G.drawFlash(dt);
      VS.UI.drawHUD(ctx, this);
      G.screenTransform(ctx);
      if (this.fade > 0.001 || this.fadeTarget) {
        if (!this.transition) this.fade = U.approach(this.fade, this.fadeTarget, dt * 1.6);
        ctx.fillStyle = `rgba(0,0,0,${this.fade})`; ctx.fillRect(0, 0, U.VIEW_W, U.VIEW_H);
      }
    }
  }

  VS.Game = Game;
})(window.VS);
