// Vesperal — o Desperto desenhado a partir das folhas de sprites (assets/sprites/hero*.png):
// escolha da animação pelo estado, arma desenhada na pega de cada fotograma, rastos curvos que seguem a lâmina.
'use strict';
(function (VS) {
  const U = VS.U, G = VS.Gfx, D2R = Math.PI / 180;
  const H = {};
  const RUN_CYCLE = 68; // unidades percorridas por ciclo de corrida (passada)

  const cls = (p) => (VS.state ? VS.state.weaponDef.cls : 'espada');
  const wid = () => (VS.state ? VS.state.weaponId : 'desperto');
  H.sheetFor = (name) => VS.Assets.sheet(name);

  // ------------------------------------------------------------ escolha da animação
  // devolve { sheet, anim, f (fotograma) }
  H.select = function (p) {
    const suf = VS.state && VS.state.look === 'sino' ? '_sino' : '';
    const a = p.action, base = 'hero' + suf, wc = 'hero_' + cls(p) + suf;
    const S = (sheet, anim, idx) => ({ sheet, anim, idx });
    const P = (sheet, anim, phase, k) => ({ sheet, anim, phase, k });
    const A = p.anim;
    if (a && a.type === 'dead') return S(base, 'death', Math.min(9, a.t * 10));
    if (a && a.type === 'wake') return S(base, 'wake', Math.min(15.99, Math.max(0, (a.t - (a.hold || 0)) / (a.dur - (a.hold || 0))) * 16));
    if (a && (a.type === 'attack' || a.type === 'heavy')) {
      const dur = a.phase === 'wind' ? a.wind : a.phase === 'act' ? a.act : a.rec;
      return P(wc, a.name, a.phase, a.t / Math.max(0.001, dur));
    }
    if (a && a.type === 'parry') return a.guard ? S(wc, 'guard', A.t * 6) : P(wc, 'parry', a.t < a.window * 0.5 ? 'wind' : a.t < a.window ? 'act' : 'rec', a.t < a.window * 0.5 ? a.t / (a.window * 0.5) : a.t < a.window ? (a.t - a.window * 0.5) / (a.window * 0.5) : (a.t - a.window) / 0.22);
    if (a && a.type === 'plunge') return a.hover ? P(wc, 'plunge', 'wind', a.t / 0.12) : P(wc, 'plunge', 'act', (A.t * 8) % 1);
    if (a && a.type === 'dodge') return S(base, a.air ? 'airdash' : 'dodge', (a.t / a.dur) * (a.air ? 3 : 6));
    if (a && a.type === 'heal') return S(base, 'heal', (a.t / a.dur) * 6);
    if (a && a.type === 'spell') return S(base, 'spell', (a.t / 0.42) * 5);
    if (a && a.type === 'hurt') return S(base, 'hurt', (a.t / 0.3) * 4);
    if (a && a.type === 'rest') return S(base, 'rest', A.t * 4);
    if (a && a.type === 'impulse') return S(base, 'impulse', Math.min(5, (a.t / (a.dur || 0.45)) * 6));
    if (a && a.type === 'pickup') return S(base, 'pickup', (a.t / 0.5) * 5);
    if (p.climbing) return Math.abs(p.vy) > 5 || Math.abs(p.vx) > 5 ? S(base, 'climb', p.climbPhase * 6) : S(base, 'climbIdle', A.t * 4);
    if (p.wallDir) return S(base, 'wall', A.t * 8);
    if (!p.onGround) {
      if (p.wingT > 0) return S(base, 'double', (0.35 - p.wingT) / 0.35 * 4);
      if (p.vy < -160) return S(base, 'jump', Math.min(2, p.airT * 14));
      if (p.vy < 140) return S(base, 'apex', p.vy < 0 ? 0 : 1);
      return S(base, 'fall', A.t * 10);
    }
    if (p.landT > 0) return S(base, 'land', (1 - p.landT / 0.22) * 4);
    if (p.crouch) {
      if (Math.abs(p.vx) > 10) return S(base, 'crawl', (p.runPhase / U.TAU) * 6 * 2);
      return p.crouchT < 0.14 ? S(base, 'crouch', (p.crouchT / 0.14) * 3) : S(base, 'crouchIdle', A.t * 6);
    }
    if (Math.abs(p.vx) > 95) return S(base, 'run', (p.runPhase / U.TAU) * 8);
    if (Math.abs(p.vx) > 12) return S(base, 'walk', (p.runPhase / U.TAU) * 8);
    if (p.turnT > 0) return S(base, 'turn', (1 - p.turnT / 0.14) * 3);
    return S(base, 'idle', A.t * 7);
  };
  H.frameOf = function (sel) {
    const sh = H.sheetFor(sel.sheet);
    if (!sh) return null;
    let f = sel.phase ? VS.Assets.phaseFrame(sh, sel.anim, sel.phase, sel.k) : VS.Assets.frame(sh, sel.anim, sel.idx);
    const fb = sel.sheet.endsWith('_sino') ? 'hero_espada_sino' : 'hero_espada';
    if (!f && sel.sheet !== fb && sel.sheet.startsWith('hero_')) { // conjunto de golpes desta classe ainda não exportado: usa o da espada
      const s2 = H.sheetFor(fb); f = sel.phase ? VS.Assets.phaseFrame(s2, sel.anim, sel.phase, sel.k) : VS.Assets.frame(s2, sel.anim, sel.idx);
      return f ? { f, sh: s2 } : null;
    }
    return f ? { f, sh } : null;
  };
  // atualiza o relógio da animação (reinicia quando muda)
  H.update = function (p, dt) {
    const sel = H.select(p);
    const key = sel.sheet + ':' + sel.anim;
    if (p.anim.key !== key) { p.anim.key = key; p.anim.t = 0; } else p.anim.t += dt;
    p.anim.sel = H.select(p);
    p.anim.cur = H.frameOf(p.anim.sel);
  };

  // ------------------------------------------------------------ geometria da arma (mundo)
  // pega no mundo: [x, y, ânguloRad] a partir do fotograma atual
  H.grip = function (p, which) {
    const cur = p.anim && p.anim.cur; if (!cur || !cur.f.pts) return null;
    const g = cur.f.pts[which || 'grip']; if (!g) return null;
    const x = p.cx + p.dir * g[0], y = p.bottom + g[1];
    let a = g[2] * D2R; if (p.dir < 0) a = Math.PI - a;
    return [x, y, a, g[3]];
  };
  H.blade = function (p) {
    const g = H.grip(p); if (!g) return null;
    const meta = VS.WEAPON_META && VS.WEAPON_META[wid()]; if (!meta) return null;
    const c = Math.cos(g[2]), s = Math.sin(g[2]);
    const b0 = 1.2;
    return { x: g[0], y: g[1], a: g[2], x0: g[0] + c * b0, y0: g[1] + s * b0, x1: g[0] + c * meta.len, y1: g[1] + s * meta.len, len: meta.len };
  };

  // ------------------------------------------------------------ desenho
  function drawWeapon(ctx, p, g, glow) {
    const id = wid(), meta = VS.WEAPON_META && VS.WEAPON_META[id];
    const im = VS.Assets.img('weapons/w_' + id + '.png');
    if (!meta || !VS.Assets.ok(im)) return;
    ctx.save();
    ctx.translate(g[0], g[1]); ctx.rotate(g[2] * D2R);
    ctx.drawImage(im, -meta.ox / meta.scale, -meta.oy / meta.scale, im.width / meta.scale, im.height / meta.scale);
    if (glow) {
      ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = glow;
      const gr = ctx.createLinearGradient(0, 0, meta.len, 0); gr.addColorStop(0, 'rgba(255,160,60,0)'); gr.addColorStop(0.5, 'rgba(255,170,70,0.9)'); gr.addColorStop(1, 'rgba(255,230,160,0.9)');
      ctx.fillStyle = gr; ctx.beginPath(); ctx.ellipse(meta.len * 0.55, 0, meta.len * 0.5, 1.6, 0, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }
  H.scarf = function (ctx, p) {
    const pts = p.cloak, n = pts.length, t = p.t || 0;
    // contorno suave (curvas pelos pontos médios) de uma fita que afina; ponta desfiada
    const ribbon = (C, w0, w1) => {
      const L = [], R2 = [];
      for (let i = 0; i < C.length; i++) {
        const a = C[Math.max(0, i - 1)], b = C[Math.min(C.length - 1, i + 1)];
        const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l;
        const w = (w0 + (w1 - w0) * (i / (C.length - 1))) * 0.5;
        L.push([C[i][0] + nx * w, C[i][1] + ny * w]); R2.push([C[i][0] - nx * w, C[i][1] - ny * w]);
      }
      const path = new Path2D(); path.moveTo(L[0][0], L[0][1]);
      for (let i = 1; i < L.length - 1; i++) path.quadraticCurveTo(L[i][0], L[i][1], (L[i][0] + L[i + 1][0]) / 2, (L[i][1] + L[i + 1][1]) / 2);
      const e = L.length - 1, tip = C[e], prev = C[e - 1], ux = tip[0] - prev[0], uy = tip[1] - prev[1], ul = Math.hypot(ux, uy) || 1;
      path.lineTo(L[e][0], L[e][1]); path.lineTo(tip[0] + ux / ul * 2.2 + (L[e][0] - tip[0]) * 0.4, tip[1] + uy / ul * 2.2 + (L[e][1] - tip[1]) * 0.4);
      path.lineTo(tip[0] + ux / ul * 0.8, tip[1] + uy / ul * 0.8); path.lineTo(tip[0] + ux / ul * 1.8 + (R2[e][0] - tip[0]) * 0.4, tip[1] + uy / ul * 1.8 + (R2[e][1] - tip[1]) * 0.4);
      path.lineTo(R2[e][0], R2[e][1]);
      for (let i = R2.length - 2; i > 0; i--) path.quadraticCurveTo(R2[i][0], R2[i][1], (R2[i][0] + R2[i - 1][0]) / 2, (R2[i][1] + R2[i - 1][1]) / 2);
      path.lineTo(R2[0][0], R2[0][1]); path.closePath();
      return { path, L, R: R2 };
    };
    const C = pts.map((q, i) => [q.x, q.y + Math.sin(t * 7 + i * 1.1) * 0.25 * (i / n)]);
    // a ponta de trás: a mesma corrente, mais curta e ligeiramente desviada
    const C2 = C.slice(0, n - 1).map(([x, y], i) => [x - p.dir * 0.8 * (i / n), y + 0.9 * (i / n)]);
    for (const [cc, base, edge, w0, w1] of [[C2, '#2e0c14', '#4a1620', 2.6, 1.4], [C, '#5c1826', '#93364a', 3.2, 1.7]]) {
      const r = ribbon(cc, w0, w1);
      ctx.fillStyle = base; ctx.fill(r.path);
      ctx.save(); ctx.clip(r.path);
      ctx.strokeStyle = edge; ctx.lineWidth = 0.9; ctx.beginPath(); r.L.forEach((q, i) => (i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]))); ctx.stroke();
      ctx.restore();
      ctx.strokeStyle = 'rgba(8,4,6,0.7)'; ctx.lineWidth = 0.55; ctx.stroke(r.path);
    }
  };
  H.draw = function (ctx, p, game) {
    const cur = p.anim && p.anim.cur;
    if (!cur || !VS.Assets.ok(cur.sh.img)) return false;
    const f = cur.f;
    const a = p.action;
    // imagens residuais (esquiva)
    for (const g of p.afterimages) {
      if (!g.f) continue;
      ctx.save(); ctx.globalAlpha = g.a * 0.45; ctx.translate(g.x, g.y); ctx.scale(g.dir, 1);
      VS.Assets.drawTinted(ctx, g.sh, g.f, '#3a5aa0'); ctx.restore();
    }
    // cachecol cor de vinho preso ao pescoço: segue a corrente de pontos de p.cloak (verlet) e ondula com o movimento
    if (!(a && (a.type === 'dead' || a.type === 'wake')) && p.cloak && p.cloak.length > 2) H.scarf(ctx, p);
    ctx.save();
    if (p.iframes > 0 && p.iframes < 0.9 && !(a && a.type === 'dead') && Math.floor(p.t * 20) % 2 === 0) ctx.globalAlpha = 0.5;
    ctx.translate(p.cx, p.bottom);
    let sx = 1, sy = 1;
    if (p.landSquash > 0) { sx = 1 + p.landSquash * 0.12; sy = 1 - p.landSquash * 0.1; }
    ctx.scale(p.dir * sx, sy);
    const glow = a && a.type === 'heavy' && a.charged ? 0.55 + Math.sin(p.t * 30) * 0.2 : 0;
    const g = f.pts && f.pts.grip;
    const gb = f.pts && f.pts.gripB;
    const wd = VS.state && VS.state.weaponDef;
    if (gb && wd && wd.dual) drawWeapon(ctx, p, gb, glow);
    if (g && g[3] === 0) drawWeapon(ctx, p, g, glow);
    VS.Assets.drawFrame(ctx, cur.sh, f);
    if (p.flash > 0) { VS.Assets.drawFlash(ctx, cur.sh, f, 1); VS.Assets.drawFlash(ctx, cur.sh, f, 0.6); }
    if (g && g[3] !== 0 && !(a && a.type === 'dead' && a.t > 1.2)) drawWeapon(ctx, p, g, glow);
    ctx.restore();
    // fôlego de escalada: arco fino junto ao ombro enquanto trepa (fica vermelho quando está a acabar)
    if ((p.climbing || p.wallDir) && !p.onGround) {
      const k = Math.max(0, p.climbStam / p.climbMax()), x = p.cx - p.dir * 9, y = p.y + 2;
      ctx.save(); ctx.lineCap = 'round';
      ctx.lineWidth = 2.2; ctx.strokeStyle = 'rgba(10,8,10,0.6)'; ctx.beginPath(); ctx.arc(x, y, 4.5, -Math.PI / 2, Math.PI * 1.5); ctx.stroke();
      ctx.lineWidth = 1.3; ctx.strokeStyle = k < 0.3 ? '#e05040' : '#e8d8b0'; ctx.beginPath(); ctx.arc(x, y, 4.5, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * k); ctx.stroke();
      ctx.restore();
    }
    // asas de mariposa no salto duplo
    if (p.wingT > 0) {
      ctx.save(); ctx.globalAlpha = Math.min(1, p.wingT * 3); ctx.globalCompositeOperation = 'lighter';
      for (const s of [-1, 1]) { const gr = ctx.createRadialGradient(p.cx + s * 8, p.y + 6, 0, p.cx + s * 8, p.y + 6, 12); gr.addColorStop(0, 'rgba(240,226,200,0.6)'); gr.addColorStop(1, 'rgba(240,226,200,0)'); ctx.fillStyle = gr; ctx.beginPath(); ctx.ellipse(p.cx + s * 9, p.y + 6, 11, 5, s * 0.5, 0, Math.PI * 2); ctx.fill(); }
      ctx.restore();
    }
    return true;
  };

  // ------------------------------------------------------------ rastos curvos da lâmina
  const TRAILS = {
    steel: { inner: 0.45, col: [228, 232, 246], a: 0.5, edge: 'rgba(255,255,255,0.75)', life: 0.13, add: true },
    quick: { inner: 0.55, col: [200, 236, 236], a: 0.42, edge: 'rgba(230,255,255,0.7)', life: 0.09, add: true },
    heavy: { inner: 0.62, col: [210, 150, 90], a: 0.5, edge: 'rgba(255,200,130,0.65)', life: 0.18, add: false, ember: true },
    long: { inner: 0.7, col: [230, 226, 210], a: 0.45, edge: 'rgba(255,250,235,0.7)', life: 0.13, add: true },
    spirit: { inner: 0.3, col: [190, 160, 255], a: 0.6, edge: 'rgba(235,220,255,0.9)', life: 0.22, add: true, motes: true },
    royal: { inner: 0.45, col: [255, 140, 60], a: 0.55, edge: 'rgba(255,220,150,0.85)', life: 0.2, add: true, ember: true },
  };
  H.pushTrail = function (p, active) {
    const b = H.blade(p);
    const now = p.t;
    if (b && active) {
      const last = p.trail[p.trail.length - 1];
      if (!last || Math.hypot(last.x1 - b.x1, last.y1 - b.y1) > 0.6) p.trail.push({ x: b.x, y: b.y, a: b.a, len: b.len, x1: b.x1, y1: b.y1, t: now });
    }
    const style = TRAILS[(VS.state && VS.state.weaponDef.trail) || 'steel'];
    while (p.trail.length && now - p.trail[0].t > style.life) p.trail.shift();
    if (p.trail.length > 40) p.trail.splice(0, p.trail.length - 40);
  };
  // amostras interpoladas: roda à volta da pega para desenhar um arco suave entre fotogramas
  function densify(tr) {
    const out = [];
    for (let i = 0; i < tr.length; i++) {
      if (i === 0) { out.push(tr[0]); continue; }
      const A0 = tr[i - 1], A1 = tr[i];
      let da = A1.a - A0.a; while (da > Math.PI) da -= Math.PI * 2; while (da < -Math.PI) da += Math.PI * 2;
      const n = Math.min(8, Math.max(1, Math.ceil(Math.abs(da) / 0.12)));
      for (let k = 1; k <= n; k++) { const t = k / n; out.push({ x: U.lerp(A0.x, A1.x, t), y: U.lerp(A0.y, A1.y, t), a: A0.a + da * t, len: U.lerp(A0.len, A1.len, t), t: U.lerp(A0.t, A1.t, t) }); }
    }
    return out;
  }
  H.drawTrail = function (ctx, p) {
    if (p.trail.length < 2) return;
    const style = TRAILS[(VS.state && VS.state.weaponDef.trail) || 'steel'];
    const pts = densify(p.trail);
    const now = p.t;
    ctx.save();
    if (style.add) ctx.globalCompositeOperation = 'lighter';
    for (let i = 1; i < pts.length; i++) {
      const A0 = pts[i - 1], A1 = pts[i];
      const age = Math.min(1, (now - A1.t) / style.life), k = (1 - age) * (i / pts.length);
      if (k <= 0.01) continue;
      const o0 = [A0.x + Math.cos(A0.a) * A0.len, A0.y + Math.sin(A0.a) * A0.len], o1 = [A1.x + Math.cos(A1.a) * A1.len, A1.y + Math.sin(A1.a) * A1.len];
      const r0 = A0.len * style.inner, r1 = A1.len * style.inner;
      const i0 = [A0.x + Math.cos(A0.a) * r0, A0.y + Math.sin(A0.a) * r0], i1 = [A1.x + Math.cos(A1.a) * r1, A1.y + Math.sin(A1.a) * r1];
      const gr = ctx.createLinearGradient((i0[0] + i1[0]) / 2, (i0[1] + i1[1]) / 2, (o0[0] + o1[0]) / 2, (o0[1] + o1[1]) / 2);
      const [r, g, b] = style.col;
      gr.addColorStop(0, `rgba(${r},${g},${b},0)`); gr.addColorStop(0.75, `rgba(${r},${g},${b},${style.a * k * 0.7})`); gr.addColorStop(1, `rgba(${r},${g},${b},${style.a * k})`);
      ctx.fillStyle = gr;
      ctx.beginPath(); ctx.moveTo(i0[0], i0[1]); ctx.lineTo(o0[0], o0[1]); ctx.lineTo(o1[0], o1[1]); ctx.lineTo(i1[0], i1[1]); ctx.closePath(); ctx.fill();
    }
    // fio luminoso a acompanhar a ponta
    ctx.strokeStyle = style.edge; ctx.lineCap = 'round';
    for (let i = 1; i < pts.length; i++) {
      const A0 = pts[i - 1], A1 = pts[i];
      const age = Math.min(1, (now - A1.t) / style.life), k = (1 - age) * (i / pts.length);
      if (k <= 0.02) continue;
      ctx.globalAlpha = k; ctx.lineWidth = 0.4 + k * 1.1;
      ctx.beginPath(); ctx.moveTo(A0.x + Math.cos(A0.a) * A0.len, A0.y + Math.sin(A0.a) * A0.len); ctx.lineTo(A1.x + Math.cos(A1.a) * A1.len, A1.y + Math.sin(A1.a) * A1.len); ctx.stroke();
    }
    ctx.restore();
    // partículas próprias de cada arma
    const last = pts[pts.length - 1];
    if (now - last.t < 0.03) {
      const tx = last.x + Math.cos(last.a) * last.len, ty = last.y + Math.sin(last.a) * last.len;
      if (style.ember && Math.random() < 0.6) G.emit({ x: tx, y: ty, vx: U.rand(-40, 40), vy: U.rand(-60, -10), life: 0.5, size: U.rand(0.8, 1.6), color: U.pick(['#ffb050', '#ff7a30', '#ffe0a0']), add: true, shrink: true });
      if (style.motes && Math.random() < 0.7) G.emit({ x: tx + U.rand(-3, 3), y: ty + U.rand(-3, 3), vx: U.rand(-15, 15), vy: U.rand(-25, 5), life: 0.6, size: U.rand(1, 2), color: U.pick(['#c8b0ff', '#e8dcff', '#9ad0f0']), add: true, shrink: true });
    }
  };
  VS.HeroRender = H;
})(window.VS);
