// Vesperal — inimigos desenhados a partir das folhas de sprites do ateliê (assets/sprites/en_<tipo>.png):
// escolha da animação pelo estado (parado, andar, ataque por fases, ferido, atordoado, morte),
// passada ligada à distância percorrida (sem pés a deslizar) e sinais de ataque na ponta da arma.
'use strict';
(function (VS) {
  const U = VS.U;
  const ER = {};
  const name = (e) => 'en_' + ((e.K && e.K.sheet) || e.kind);
  ER.sheet = (e) => VS.Assets.sheet(name(e));
  ER.has = (e) => { const sh = ER.sheet(e); return !!(sh && VS.Assets.ok(sh.img)); };

  // escolhe { anim, f } para o estado atual
  ER.select = function (e, sh) {
    const A = sh.meta.anims, has = (n) => !!A[n];
    const r = e._r || (e._r = { dist: 0, lastX: e.x, lastY: e.y, key: '', t: 0, lastT: e.anim });
    const dt = Math.max(0, e.anim - r.lastT); r.lastT = e.anim;
    r.dist += Math.hypot(e.x - r.lastX, e.flying ? e.y - r.lastY : 0); r.lastX = e.x; r.lastY = e.y;
    const frameAt = (an, k) => VS.Assets.frame(sh, an, k);
    const timed = (an) => { if (r.key !== an) { r.key = an; r.t = 0; } else r.t += dt; return frameAt(an, r.t * A[an].fps); };
    if (e.dead || e.defeated) return { anim: 'death', f: has('death') ? frameAt('death', (e.defeated ? e.defT || 0 : e.deadT || 0) * A.death.fps) : frameAt('idle', 0) };
    if (e.K.animState) { const s = e.K.animState(e, sh); if (s) { if (s.phase) return { anim: s.anim, f: VS.Assets.phaseFrame(sh, s.anim, s.phase, s.k) }; return { anim: s.anim, f: s.idx !== undefined ? frameAt(s.anim, s.idx) : timed(s.anim) }; } }
    if (e.stagger > 0 && has('stagger')) return { anim: 'stagger', f: timed('stagger') };
    if (e.atk) {
      const mapped = e.K.animMap && e.K.animMap[e.atk.name];
      const an = has('atk_' + e.atk.name) ? 'atk_' + e.atk.name : mapped && has(mapped) ? mapped : has('attack') ? 'attack' : null;
      if (an) {
        const s = e.atk.s, d = e.atk.phase === 'wind' ? s.wind : e.atk.phase === 'act' ? s.act : s.rec;
        r.key = an;
        return { anim: an, f: VS.Assets.phaseFrame(sh, an, e.atk.phase, e.atk.t / Math.max(0.001, d)) };
      }
    }
    if (e.lastHitT < 0.22 && has('hurt')) return { anim: 'hurt', f: frameAt('hurt', (e.lastHitT / 0.22) * A.hurt.frames.length) };
    const moving = e.flying ? true : Math.abs(e.vx) > 6;
    if (moving && has('move')) {
      const m = A.move;
      if (m.stride && !e.flying) { r.key = 'move'; return { anim: 'move', f: frameAt('move', (r.dist / m.stride) * m.frames.length) }; }
      return { anim: 'move', f: timed('move') };
    }
    return { anim: 'idle', f: timed('idle') };
  };
  // ponto de um fotograma (unidades relativas à âncora) → mundo
  ER.point = function (e, f, which) {
    const p = f && f.pts && f.pts[which]; if (!p) return null;
    const ay = e.K.sheetAnchor === 'center' ? e.cy : e.bottom;
    return { x: e.cx + e.facing * p[0], y: ay + p[1] };
  };
  ER.draw = function (ctx, e) {
    const sh = ER.sheet(e);
    if (!sh || !VS.Assets.ok(sh.img)) return false;
    const sel = ER.select(e, sh);
    if (!sel.f) return false;
    e._f = sel.f;
    ctx.save();
    ctx.translate(e.cx, e.K.sheetAnchor === 'center' ? e.cy : e.bottom);
    const sc = e.K.drawScale ? e.K.drawScale(e) : 1;
    ctx.scale(e.facing * sc, sc);
    if (e.K.alpha) ctx.globalAlpha *= e.K.alpha(e);
    VS.Assets.drawFrame(ctx, sh, sel.f);
    if (e.flash > 0) VS.Assets.drawFlash(ctx, sh, sel.f, 0.75);
    ctx.restore();
    return true;
  };

  // silhueta tingida (eco/espectro): o fotograma atual pintado numa cor, em modo aditivo, um pouco maior
  // (duas cópias ligeiramente desfasadas fazem o "desfoque" sem ctx.filter)
  ER.ghost = function (ctx, e, col, alpha, dx, dy) {
    const sh = ER.sheet(e), f = e._f; if (!sh || !f || !VS.Assets.ok(sh.img) || alpha <= 0.01) return;
    const s = sh.meta.scale, c = VS.Assets.tinted(sh, f, col);
    const sc = (e.K.drawScale ? e.K.drawScale(e) : 1) * 1.06;
    ctx.save(); ctx.translate(e.cx + (dx || 0), (e.K.sheetAnchor === 'center' ? e.cy : e.bottom) + (dy || 0)); ctx.scale(e.facing * sc, sc);
    ctx.globalAlpha *= alpha * 0.55; ctx.globalCompositeOperation = 'lighter';
    for (const [ox, oy] of [[-0.8, 0], [0.8, -0.6]]) ctx.drawImage(c, 0, 0, c.width, c.height, f.ox + ox, f.oy + oy, c.width / s, c.height / s);
    ctx.restore();
  };
  // rasto da arma durante o golpe: crescente curvo à volta do punho, do ângulo do fotograma anterior ao atual
  ER.smear = function (ctx, e, col) {
    const a = e.atk, f = e._f;
    if (!a || a.phase !== 'act' || !f || !f.pts || !f.pts.grip || !f.pts.tip || e.dead || e.defeated) { e._sm = null; return; }
    const g = ER.point(e, f, 'grip'), t = ER.point(e, f, 'tip');
    const ang = Math.atan2(t.y - g.y, t.x - g.x), r = Math.hypot(t.x - g.x, t.y - g.y);
    const sm = e._sm || (e._sm = { f, a0: ang, a1: ang, id: a.id, life: 0 });
    if (sm.id !== a.id) { sm.id = a.id; sm.a0 = ang; sm.a1 = ang; }
    if (sm.f !== f) { sm.a0 = sm.a1; sm.a1 = ang; sm.f = f; sm.life = 1; }
    let d = sm.a1 - sm.a0; while (d > Math.PI) d -= U.TAU; while (d < -Math.PI) d += U.TAU;
    if (Math.abs(d) < 0.25 || r < 12) return;
    const n = 14, r0 = r * 0.7, cc = col || [255, 236, 200];
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    ctx.beginPath();
    for (let i = 0; i <= n; i++) { const k = i / n, aa = sm.a0 + d * k, rr = r * (0.94 + 0.06 * k); const x = g.x + Math.cos(aa) * rr, y = g.y + Math.sin(aa) * rr; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
    for (let i = n; i >= 0; i--) { const k = i / n, aa = sm.a0 + d * k, ri = r - (r - r0) * k * k; ctx.lineTo(g.x + Math.cos(aa) * ri, g.y + Math.sin(aa) * ri); }
    ctx.closePath();
    const gr = ctx.createRadialGradient(g.x, g.y, r0, g.x, g.y, r);
    gr.addColorStop(0, `rgba(${cc[0]},${cc[1]},${cc[2]},0)`); gr.addColorStop(0.55, `rgba(${cc[0]},${cc[1]},${cc[2]},0.1)`); gr.addColorStop(0.9, 'rgba(255,246,228,0.6)'); gr.addColorStop(1, 'rgba(255,255,255,0.12)');
    ctx.fillStyle = gr; ctx.fill();
    ctx.restore();
  };
  // luz própria (olhos de brasa, chamas) a partir do ponto 'eye' ou 'light' do fotograma
  ER.light = function (e) {
    const L = e.K.eyeLight; if (!L || e.dead || (L.when && !L.when(e))) return;
    const p = ER.point(e, e._f, L.pt || 'eye'); if (!p) return;
    VS.Gfx.light(p.x, p.y, L.r || 26, L.color || '#ff8a30', L.i || 0.55, L.flicker || 1);
  };
  // sinais de ataque: brilho branco na ponta (aparável) ou brasa vermelha a pulsar (esquivar)
  ER.tell = function (ctx, e, tell) {
    const pt = ER.point(e, e._f, 'tip') || { x: e.cx + e.facing * e.w * 0.6, y: e.y + 6 };
    const k = tell.k;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    if (tell.kind === 'white') {
      // aparece 0,42 s antes do golpe, no máximo a ~0,2 s e ainda visível no impacto: reagir ao brilho dá tempo
      const left = tell.left === undefined ? (1 - k) * 0.6 : tell.left;
      if (left < 0.42) {
        const q = 1 - left / 0.42, a = (q < 0.5 ? q / 0.5 : 1 - (q - 0.5) * 1.2) * 0.95, r = 4 + q * 9;
        const g = ctx.createRadialGradient(pt.x, pt.y, 0, pt.x, pt.y, r * 1.6);
        g.addColorStop(0, `rgba(255,255,250,${a})`); g.addColorStop(0.3, `rgba(255,236,200,${a * 0.45})`); g.addColorStop(1, 'rgba(255,220,180,0)');
        ctx.fillStyle = g; ctx.fillRect(pt.x - r * 1.6, pt.y - r * 1.6, r * 3.2, r * 3.2);
        // reflexo de metal: raios finos e afunilados, desiguais (não é uma cruz)
        ctx.translate(pt.x, pt.y); ctx.rotate(-0.12 + q * 0.2);
        const ray = (len, w) => { ctx.beginPath(); ctx.moveTo(-len, 0); ctx.quadraticCurveTo(0, -w, len, 0); ctx.quadraticCurveTo(0, w, -len, 0); ctx.fill(); };
        ctx.fillStyle = `rgba(255,255,255,${a})`; ray(r * 1.7, 0.8); ctx.rotate(Math.PI / 2); ctx.fillStyle = `rgba(255,250,235,${a * 0.6})`; ray(r * 0.35, 0.5);
      }
    } else if (tell.kind === 'red') {
      const pulse = 0.55 + 0.45 * Math.sin(e.t * 26);
      const g = ctx.createRadialGradient(e.cx, e.cy, 2, e.cx, e.cy, e.w + 16);
      g.addColorStop(0, `rgba(255,40,20,${0.22 * k})`); g.addColorStop(1, 'rgba(255,0,0,0)');
      ctx.fillStyle = g; ctx.fillRect(e.cx - e.w - 16, e.cy - e.w - 16, (e.w + 16) * 2, (e.w + 16) * 2);
      const eye = ER.point(e, e._f, 'eye') || pt;
      const g2 = ctx.createRadialGradient(eye.x, eye.y, 0, eye.x, eye.y, 8 + 6 * k);
      g2.addColorStop(0, `rgba(255,220,200,${0.9 * pulse})`); g2.addColorStop(0.35, `rgba(255,50,30,${0.7 * pulse})`); g2.addColorStop(1, 'rgba(255,0,0,0)');
      ctx.fillStyle = g2; ctx.fillRect(eye.x - 14, eye.y - 14, 28, 28);
    }
    ctx.restore();
  };
  // ---------------------------------------------------------------- projéteis pintados (folha fx_proj)
  // tipo do jogo → animação; 'dir' roda pela velocidade, 'flip' só espelha, 'spin' usa pr.rot
  const PROJ = {
    bolt: ['bolt', 'dir', 12], orb: ['orb', 0, 9], spark: ['spark', 'dir', 12], molten: ['molten', 'spin', 10], ingot: ['ingot', 'spin', 10],
    clod: ['clod', 'spin', 10], note: ['note', 0, 9], light: ['light', 0, 10], holy: ['light', 0, 10], seed: ['seed', 'spin', 8],
    thorn: ['thorn', 'dir', 10], moth: ['moth', 'flip', 8], feather: ['feather', 'dir', 12], wave: ['wave', 'flip', 22], fire: ['fire', 0, 16],
    incense: ['incense', 0, 12], spiritwave: ['spiritwave', 'flip', 18], orbFire: ['orb', 0, 9],
  };
  ER.projectile = function (ctx, pr) {
    const sh = VS.Assets.sheet('fx_proj');
    if (!sh || !VS.Assets.ok(sh.img)) return false;
    let k = pr.kind, def = PROJ[k];
    if (k === 'glass') { const c = (pr.color || '').toLowerCase(); def = [c.includes('60ff') || c.includes('80ff') || c.startsWith('#60') ? 'glassB' : c.startsWith('#ffd') || c.startsWith('#e0b') ? 'glassY' : 'glassR', 'dir', 7]; }
    if (k === 'shockwave') { const c = (pr.color || '#c0b0a0').toLowerCase(); def = [c.startsWith('#ff') ? 'shockwave' : 'dust', 'flip', 14]; }
    if (!def) return false;
    const [anim, mode, nom] = def;
    const f = VS.Assets.frame(sh, anim, (pr.t || 0) * 12);
    if (!f) return false;
    const sc = U.clamp(Math.max(pr.w, pr.h) / nom, 0.6, 2.4);
    ctx.save(); ctx.translate(pr.cx, pr.cy);
    if (mode === 'dir') ctx.rotate(Math.atan2(pr.vy, pr.vx));
    else if (mode === 'flip') ctx.scale(pr.vx < 0 ? -1 : 1, 1);
    else if (mode === 'spin') ctx.rotate(pr.rot || (pr.t || 0) * 6);
    ctx.scale(sc, sc);
    VS.Assets.drawFrame(ctx, sh, f);
    ctx.restore();
    if (pr.unblockable) VS.Sprites.glow(ctx, pr.cx, pr.cy, pr.w * 2, '#ff2020', 0.35);
    return true;
  };
  VS.EnemyRender = ER;
})(window.VS);
