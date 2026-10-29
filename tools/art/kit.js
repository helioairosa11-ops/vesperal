// Vesperal — ateliê: utensílios partilhados para criaturas (membros contínuos, tubos afunilados, farrapos,
// olhos de brasa, esqueletos de criaturas e folhas de animação com fases). Tudo em unidades lógicas × S.
'use strict';
(function (A) {
  const D2R = A.D2R, TAU = A.TAU;

  A.kit = function (S, o = {}) {
    const K = { S, IW: S * 0.2, INK: o.ink || '#0a080d', LIGHT: o.light || [0.65, -1] };
    const IW = K.IW, INK = K.INK;
    K.norm = (x, y) => { const l = Math.hypot(x, y) || 1; return [x / l, y / l]; };
    K.perp = (B) => [-Math.sin(B.a * D2R), Math.cos(B.a * D2R)];
    K.along = (B, t) => [B.x + Math.cos(B.a * D2R) * B.len * t, B.y + Math.sin(B.a * D2R) * B.len * t];
    K.dim = (m, k) => ({ ...m, base: A.mix(m.base, '#07050a', 1 - k), shadow: A.mix(m.shadow, '#050307', 1 - k), light: A.mix(m.light, '#07050a', 1 - k), deep: m.deep });
    K.paint = (ctx, path, m, opt = {}) => A.paint(ctx, path, m, Object.assign({ light: K.LIGHT, depth: S * 0.6, inkW: IW, hlw: S * 0.3 }, opt));
    K.line = (ctx, pts, w, col) => A.stroke(ctx, pts, w * S, col, S);
    K.dot = (ctx, x, y, r, col) => { ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x * S, y * S, r * S, 0, TAU); ctx.fill(); };

    // membro de dois segmentos sem junta visível (ombro→cotovelo→pulso)
    K.chainPath = function (p0, p1, p2, w0, w1, w2) {
      const d1 = K.norm(p1[0] - p0[0], p1[1] - p0[1]), d2 = K.norm(p2[0] - p1[0], p2[1] - p1[1]);
      const n1 = [-d1[1], d1[0]], n2 = [-d2[1], d2[0]];
      const nb = K.norm(n1[0] + n2[0], n1[1] + n2[1]);
      const cosh = Math.max(0.45, n1[0] * nb[0] + n1[1] * nb[1]), wb = w1 / cosh;
      const L0 = [p0[0] + n1[0] * w0, p0[1] + n1[1] * w0], L1 = [p1[0] + nb[0] * wb, p1[1] + nb[1] * wb], L2 = [p2[0] + n2[0] * w2, p2[1] + n2[1] * w2];
      const R0 = [p0[0] - n1[0] * w0, p0[1] - n1[1] * w0], R1 = [p1[0] - nb[0] * wb, p1[1] - nb[1] * wb], R2 = [p2[0] - n2[0] * w2, p2[1] - n2[1] * w2];
      const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
      const mL0 = mid(L0, L1), mL1 = mid(L1, L2), mR0 = mid(R0, R1), mR1 = mid(R1, R2);
      return A.path((q) => {
        q.M(L0[0], L0[1]); q.L(mL0[0], mL0[1]); q.Q(L1[0], L1[1], mL1[0], mL1[1]); q.L(L2[0], L2[1]);
        q.Q(p2[0] + d2[0] * w2 * 1.2, p2[1] + d2[1] * w2 * 1.2, R2[0], R2[1]);
        q.L(mR1[0], mR1[1]); q.Q(R1[0], R1[1], mR0[0], mR0[1]); q.L(R0[0], R0[1]);
        q.Q(p0[0] - d1[0] * w0 * 1.1, p0[1] - d1[1] * w0 * 1.1, L0[0], L0[1]); q.Z();
      }, S);
    };
    K.limb = function (ctx, p0, p1, p2, w0, w1, w2, m, opt) { const path = K.chainPath(p0, p1, p2, w0, w1, w2); K.paint(ctx, path, m, opt); return path; };

    // tubo afunilado ao longo de uma polilinha (colunas, caudas, raízes, correntes de carne); ws = larguras (meias)
    K.tubePath = function (pts, ws, capEnd = true) {
      const n = pts.length, L = [], R = [];
      for (let i = 0; i < n; i++) {
        const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)];
        const [dx, dy] = K.norm(b[0] - a[0], b[1] - a[1]); const w = ws[i];
        L.push([pts[i][0] - dy * w, pts[i][1] + dx * w]); R.push([pts[i][0] + dy * w, pts[i][1] - dx * w]);
      }
      const sm = (q, arr) => { for (let i = 1; i < arr.length - 1; i++) { const a = arr[i], b = arr[i + 1]; q.Q(a[0], a[1], (a[0] + b[0]) / 2, (a[1] + b[1]) / 2); } q.L(arr[arr.length - 1][0], arr[arr.length - 1][1]); };
      return A.path((q) => {
        q.M(L[0][0], L[0][1]); sm(q, L);
        const e = pts[n - 1], d = K.norm(e[0] - pts[n - 2][0], e[1] - pts[n - 2][1]);
        if (capEnd) q.Q(e[0] + d[0] * ws[n - 1] * 1.4, e[1] + d[1] * ws[n - 1] * 1.4, R[n - 1][0], R[n - 1][1]); else q.L(R[n - 1][0], R[n - 1][1]);
        const Rr = R.slice().reverse(); sm(q, Rr);
        const s0 = pts[0], d0 = K.norm(pts[1][0] - s0[0], pts[1][1] - s0[1]);
        q.Q(s0[0] - d0[0] * ws[0] * 1.3, s0[1] - d0[1] * ws[0] * 1.3, L[0][0], L[0][1]); q.Z();
      }, S);
    };
    K.tube = function (ctx, pts, ws, m, opt) { const p = K.tubePath(pts, ws, !(opt && opt.flat)); K.paint(ctx, p, m, opt); return p; };
    // forma fechada suave a partir de pontos (contorno arredondado)
    K.blobPath = function (pts) {
      const n = pts.length;
      return A.path((q) => {
        const m0 = [(pts[n - 1][0] + pts[0][0]) / 2, (pts[n - 1][1] + pts[0][1]) / 2]; q.M(m0[0], m0[1]);
        for (let i = 0; i < n; i++) { const a = pts[i], b = pts[(i + 1) % n]; q.Q(a[0], a[1], (a[0] + b[0]) / 2, (a[1] + b[1]) / 2); }
        q.Z();
      }, S);
    };
    K.blob = function (ctx, pts, m, opt) { const p = K.blobPath(pts); K.paint(ctx, p, m, opt); return p; };
    // polígono com cantos vivos (pedra, metal, vidro)
    K.polyPath = (pts) => A.path((q) => { pts.forEach((p, i) => (i ? q.L(p[0], p[1]) : q.M(p[0], p[1]))); q.Z(); }, S);
    K.poly = function (ctx, pts, m, opt) { const p = K.polyPath(pts); K.paint(ctx, p, m, opt); return p; };

    // faixas transversais (ligaduras, cintas) entre t0..t1 do segmento p1→p2
    K.bands = function (ctx, path, p1, p2, w, t0, t1, n, wm) {
      const d = K.norm(p2[0] - p1[0], p2[1] - p1[1]), nn = [-d[1], d[0]], L = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]);
      ctx.save(); ctx.clip(path);
      for (let i = 0; i < n; i++) {
        const ta = t0 + (t1 - t0) * (i / n), tb = ta + (t1 - t0) / n * 0.78;
        const a = [p1[0] + d[0] * L * ta, p1[1] + d[1] * L * ta], b = [p1[0] + d[0] * L * tb, p1[1] + d[1] * L * tb];
        ctx.beginPath();
        ctx.moveTo((a[0] + nn[0] * w + d[0] * 0.5) * S, (a[1] + nn[1] * w + d[1] * 0.5) * S); ctx.lineTo((b[0] + nn[0] * w + d[0] * 0.5) * S, (b[1] + nn[1] * w + d[1] * 0.5) * S);
        ctx.lineTo((b[0] - nn[0] * w) * S, (b[1] - nn[1] * w) * S); ctx.lineTo((a[0] - nn[0] * w) * S, (a[1] - nn[1] * w) * S); ctx.closePath();
        ctx.fillStyle = i % 2 ? wm.shadow : wm.base; ctx.fill(); ctx.strokeStyle = A.rgba('#000000', 0.45); ctx.lineWidth = IW * 0.8; ctx.stroke();
      }
      ctx.restore();
    };
    // farrapos pendurados ao longo de uma linha (topo → comprimento, com balanço)
    K.rags = function (ctx, a, b, len, n, m, seed, sway = 0, opt = {}) {
      const r = A.rng(seed);
      for (let i = 0; i < n; i++) {
        const t = (i + 0.5) / n, x = A.lerp(a[0], b[0], t), y = A.lerp(a[1], b[1], t);
        const L = len * (0.6 + r() * 0.6), w = (Math.hypot(b[0] - a[0], b[1] - a[1]) / n) * (0.55 + r() * 0.3);
        const sw = sway * (0.6 + r() * 0.8) + (r() - 0.5) * 0.8;
        const p = A.path((q) => { q.M(x - w, y); q.Q(x - w * 0.8 + sw * 0.4, y + L * 0.5, x + sw - w * 0.2, y + L); q.L(x + sw + w * 0.3, y + L * 0.86); q.Q(x + w * 0.9 + sw * 0.4, y + L * 0.45, x + w, y); q.Z(); }, S);
        K.paint(ctx, p, i % 2 ? m : K.dim(m, 0.82), Object.assign({ depth: S * 0.35, hlw: S * 0.18 }, opt));
      }
    };
    // olho de brasa (órbitas acesas dos mortos de cinza)
    K.ember = function (ctx, x, y, r, k = 1, col = '#ff9a40') {
      A.glow(ctx, x * S, y * S, r * S * 4, col, 0.55 * k);
      const g = ctx.createRadialGradient(x * S, y * S, 0, x * S, y * S, r * S);
      g.addColorStop(0, '#fff4c8'); g.addColorStop(0.45, col); g.addColorStop(1, A.rgba(col, 0));
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x * S, y * S, r * S, 0, TAU); ctx.fill();
    };
    // costelas / sulcos: linhas curvas paralelas dentro de um caminho
    K.ribs = function (ctx, clip, pts, col, w) {
      ctx.save(); ctx.clip(clip);
      for (const seg of pts) A.stroke(ctx, seg, (w || 0.22) * S, col, S);
      ctx.restore();
    };
    // pós-processamento comum: grão, orla de luz fria e contorno a tinta
    K.post = (rimCol = '#a098c8', rimA = 0.32, grain = 0.04) => (cv) => {
      if (grain) A.grain(cv, grain, 11);
      A.rim(cv, -S * 0.4, -S * 0.45, rimCol, rimA);
      return A.outline(cv, S * 0.3, INK);
    };
    return K;
  };

  // ---------------------------------------------------------------- folhas de criaturas
  // Animações com poses-chave interpoladas; ataques com fases (wind/act/rec) como o protagonista.
  // spec: { name, S, box, anchor, rig (A.Rig), draw(ctx, W, x, t, ctxState), ground(W)->dy?, post, anims: {
  //   nome: { n, fps, loop, keys: [[t, pose]...] | poseFn(t,i), phases?: [wind, act] (n.º de fotogramas), points?(W,x) } } }
  A.creature = function (spec) {
    const anims = {};
    for (const [name, a] of Object.entries(spec.anims)) {
      const n = a.n;
      anims[name] = {
        n, fps: a.fps || 10, loop: !!a.loop, warm: a.loop ? 2 : 1, stride: a.stride,
        phases: a.phases ? { wind: [0, a.phases[0]], act: [a.phases[0], a.phases[0] + a.phases[1]], rec: [a.phases[0] + a.phases[1], n] } : undefined,
        frame(t, i, state, warm, ctx) {
          const pose = a.poseFn ? a.poseFn(t, i) : A.interp(a.keys, t, a.ease || (a.loop ? A.ease.sine : undefined));
          pose.extra = Object.assign({}, a.extra || {}, pose.extra || {});
          pose.root = pose.root || [0, 0];
          if (spec.solve) spec.solve(pose);
          const W = spec.rig.solve(pose);
          if (spec.ground && a.ground !== false && !pose.extra.air) { const dy = spec.ground(W, pose); if (dy) { pose.root = [pose.root[0], pose.root[1] - dy]; } }
          const W2 = spec.rig.solve(pose);
          if (state.sim === undefined) state.sim = {};
          const sim = spec.simulate ? spec.simulate(W2, pose.extra, state.sim, a, t) : null;
          if (warm) return null;
          spec.draw(ctx, W2, pose.extra, t, sim, name);
          const pts = spec.points ? spec.points(W2, pose.extra, name) : {};
          return { points: pts, overlay: spec.overlay ? (c) => spec.overlay(c, W2, pose.extra, t, name, i) : null };
        },
      };
    }
    return A.buildSheet({ name: spec.name, scale: spec.S, unit: spec.unit, box: spec.box, anchor: spec.anchor, anims, post: spec.post });
  };
  // cinemática inversa de dois ossos: põe a ponta de 'lo' em target (unidades); bend = +1/-1 escolhe o lado do cotovelo/joelho
  // endA (graus, mundo) orienta opcionalmente o osso 'end' (mão/pé) que se segue a 'lo'
  A.ik = function (rig, pose, up, lo, target, bend = 1, end, endA) {
    const nrm = (a) => { while (a > 180) a -= 360; while (a < -180) a += 360; return a; };
    const W = rig.solve(pose), U = W[up], bu = rig.by[up], bl = rig.by[lo];
    const parentA = bu.p ? W[bu.p].a : (pose.rootA || 0);
    const L1 = U.len, L2 = W[lo].len;
    const dx = target[0] - U.x, dy = target[1] - U.y;
    const d = A.clamp(Math.hypot(dx, dy), Math.abs(L1 - L2) + 0.05, L1 + L2 - 0.05);
    const th = Math.atan2(dy, dx), a1 = Math.acos(A.clamp((L1 * L1 + d * d - L2 * L2) / (2 * L1 * d), -1, 1));
    const u = th + bend * a1;
    const ex = U.x + Math.cos(u) * L1, ey = U.y + Math.sin(u) * L1;
    const tx = U.x + Math.cos(th) * d, ty = U.y + Math.sin(th) * d;
    const f = Math.atan2(ty - ey, tx - ex);
    pose.angles[up] = nrm(u / D2R - parentA - (bu.a || 0));
    pose.angles[lo] = nrm(f / D2R - u / D2R - (bl.a || 0));
    if (end && endA !== undefined) pose.angles[end] = nrm(endA - f / D2R - (rig.by[end].a || 0));
  };
  // ---------------------------------------------------------------- figura humana (inimigos e NPC)
  // mesmo esqueleto do protagonista com proporções próprias; pés assentes por cinemática inversa
  A.humanoid = function (L = {}) {
    const l = Object.assign({ pelvis: 2, spine: 5, chest: 4.7, neck: 1.2, head: 4.6, thigh: 6.7, shin: 6.5, foot: 2.9, uarm: 4.8, farm: 4.4, hand: 1.7, shoulder: 0.84 }, L);
    const rig = new A.Rig([
      { n: 'pelvis', len: l.pelvis, a: -90 },
      { n: 'spine', p: 'pelvis', len: l.spine, a: 0 },
      { n: 'chest', p: 'spine', len: l.chest, a: 0 },
      { n: 'neck', p: 'chest', len: l.neck, a: 0 },
      { n: 'head', p: 'neck', len: l.head, a: 0 },
      { n: 'thighB', p: 'pelvis', at: 0, len: l.thigh, a: 180, off: [0, 0.3] },
      { n: 'shinB', p: 'thighB', len: l.shin, a: 0 },
      { n: 'footB', p: 'shinB', len: l.foot, a: -90 },
      { n: 'thighF', p: 'pelvis', at: 0, len: l.thigh, a: 180, off: [0, -0.3] },
      { n: 'shinF', p: 'thighF', len: l.shin, a: 0 },
      { n: 'footF', p: 'shinF', len: l.foot, a: -90 },
      { n: 'uarmB', p: 'chest', at: l.shoulder, len: l.uarm, a: 180, off: [0, 0.2] },
      { n: 'farmB', p: 'uarmB', len: l.farm, a: 0 },
      { n: 'handB', p: 'farmB', len: l.hand, a: 0 },
      { n: 'uarmF', p: 'chest', at: l.shoulder, len: l.uarm, a: 180, off: [0, -0.4] },
      { n: 'farmF', p: 'uarmF', len: l.farm, a: 0 },
      { n: 'handF', p: 'farmF', len: l.hand, a: 0 },
    ]);
    const H = { rig, L: l };
    // quanto descer a figura para os pés tocarem o chão (y = 0)
    H.groundDy = (W) => { let m = -1e9; for (const f of ['footF', 'footB']) { const B = W[f]; m = Math.max(m, B.y + 0.85, B.ey + 0.75); } return m; };
    H.arm = (pose, side, target, endA, bend = 1) => A.ik(rig, pose, 'uarm' + side, 'farm' + side, target, bend, 'hand' + side, endA);
    H.leg = (pose, side, target, footA = 0, bend = -1) => A.ik(rig, pose, 'thigh' + side, 'shin' + side, target, bend, 'foot' + side, footA);
    // contorno do tronco a partir de [osso, t, largura da frente, largura de trás]
    H.torsoPath = function (W, spec, S) {
      const front = [], back = [];
      for (const [b, t, wf, wb] of spec) { const B = W[b]; const ca = Math.cos(B.a * D2R), sa = Math.sin(B.a * D2R); const px = B.x + ca * B.len * t, py = B.y + sa * B.len * t; const nx = -sa, ny = ca; front.push([px + nx * wf, py + ny * wf]); back.push([px - nx * wb, py - ny * wb]); }
      const smooth = (q, arr) => { for (let i = 1; i < arr.length; i++) { const a = arr[i - 1], b = arr[i]; q.Q(a[0], a[1], (a[0] + b[0]) / 2, (a[1] + b[1]) / 2); } q.L(arr[arr.length - 1][0], arr[arr.length - 1][1]); };
      return A.path((q) => { q.M(front[0][0], front[0][1]); smooth(q, front); q.L(back[back.length - 1][0], back[back.length - 1][1]); smooth(q, back.slice().reverse()); q.Z(); }, S);
    };
    return H;
  };
  // arma de duas mãos (pá, malho, glaive, montante). x.g = punho da mão da frente relativo ao ombro da frente;
  // x.wa = ângulo da arma (graus); x.tgK (0..1) puxa a ponta para o chão (y = x.tgY, por omissão 0) com o ângulo
  // calculado — a cabeça da arma assenta no chão em vez de o atravessar ou flutuar. A mão de trás fica no cabo
  // tão afastada quanto 'gap' permitir dentro do alcance (nunca há mãos soltas da arma).
  //   o: { tip (distância punho→ponta), gap, minGap, handA }
  A.twoHand = function (H, pose, x, o) {
    const W = H.rig.solve(pose), reach = (H.L.uarm + H.L.farm) * 0.96;
    const sF = [W.uarmF.x, W.uarmF.y], sB = [W.uarmB.x, W.uarmB.y];
    let g = [sF[0] + x.g[0], sF[1] + x.g[1]];
    const dF = Math.hypot(g[0] - sF[0], g[1] - sF[1]);
    if (dF > reach) g = [sF[0] + (g[0] - sF[0]) * reach / dF, sF[1] + (g[1] - sF[1]) * reach / dF];
    const wa = A.groundAngle(g, x, o.tip);
    const d = [Math.cos(wa * D2R), Math.sin(wa * D2R)];
    let gap = x.gap !== undefined ? x.gap : o.gap, b = null;
    for (; gap >= (o.minGap || 2.5); gap -= 0.4) { b = [g[0] - d[0] * gap, g[1] - d[1] * gap]; if (Math.hypot(b[0] - sB[0], b[1] - sB[1]) <= reach) break; }
    x._g = g; x._d = d; x._wa = wa; x._gB = b;
    H.arm(pose, 'F', g, wa + 90 + (o.handA || 0), x.bF || 1);
    H.arm(pose, 'B', b, wa + 90 + (o.handA || 0), x.bB || 1);
  };
  // ângulo da arma com a ponta puxada para o chão (x.tgK 0..1, chão em y = x.tgY) a partir do punho g
  A.groundAngle = function (g, x, tip) {
    let wa = x.wa;
    if (x.tgK > 0) {
      const sn = A.clamp(((x.tgY || 0) - g[1]) / tip, -1, 1), ga = Math.asin(sn) / D2R;
      const want = Math.cos(wa * D2R) >= 0 ? ga : 180 - ga;
      let dv = want - wa; while (dv > 180) dv -= 360; while (dv < -180) dv += 360;
      wa += dv * A.clamp(x.tgK, 0, 1);
    }
    return wa;
  };
  // ciclo de passo genérico (pés por IK): devolve alvos dos pés relativos à anca para a fase t
  //   o: { stride (meio passo à frente/atrás), lift, drag (0..1: arrastar), hipY (altura da anca acima do chão) }
  A.stepFeet = function (t, o) {
    const foot = (u) => { // u: 0..1 — apoio (0..0.55) recua no chão; balanço (0.55..1) avança no ar
      const st = 0.55;
      if (u < st) return [A.lerp(o.stride, -o.stride, u / st), 0];
      const k = (u - st) / (1 - st); return [A.lerp(-o.stride, o.stride, A.ease.io(k)), -Math.sin(k * Math.PI) * o.lift * (1 - (o.drag || 0) * 0.7)];
    };
    return { F: foot(t), B: foot((t + 0.5) % 1) };
  };

  // prancha de pré-visualização genérica: cada animação numa linha, à escala do jogo (×zoom), fases coloridas
  A.previewSheet = function (r, zoom = 3, cell = [60, 40]) {
    const meta = r.meta, img = r.canvas, k = zoom / meta.scale, cw = cell[0] * zoom, ch = cell[1] * zoom;
    const names = Object.keys(meta.anims), cols = Math.max(...names.map((n) => meta.anims[n].frames.length));
    const cv = A.mk(cols * cw + 130, names.length * ch), c = cv.getContext('2d');
    c.fillStyle = '#3a3242'; c.fillRect(0, 0, cv.width, cv.height); c.font = '14px monospace';
    names.forEach((n, row) => {
      c.fillStyle = '#ddd'; c.fillText(n, 6, row * ch + 20);
      const ph = meta.anims[n].phases;
      meta.anims[n].frames.forEach((fi, col) => {
        const f = meta.frames[fi], x0 = 130 + col * cw + cw / 2, y0 = row * ch + ch - 14;
        if (ph) { c.fillStyle = col < ph.wind[1] ? '#3a3a52' : col < ph.act[1] ? '#523a3a' : '#3a4a3a'; c.fillRect(130 + col * cw, row * ch, cw - 2, ch - 2); }
        c.strokeStyle = '#5a5060'; c.beginPath(); c.moveTo(130 + col * cw, y0); c.lineTo(130 + (col + 1) * cw, y0); c.stroke();
        c.imageSmoothingQuality = 'high';
        c.drawImage(img, f.x, f.y, f.w, f.h, x0 + f.ox * zoom, y0 + f.oy * zoom, f.w * k, f.h * k);
        for (const [pn, pv] of Object.entries(f.pts || {})) { c.fillStyle = pn === 'tip' ? '#ff4040' : '#40ff90'; c.fillRect(x0 + pv[0] * zoom - 2, y0 + pv[1] * zoom - 2, 4, 4); }
      });
    });
    return cv.toDataURL('image/png');
  };
  // pose: { root:[x,y], rootA, angles, extra }
  A.pose = (a, x, root, rootA) => ({ root: root || [0, 0], rootA: rootA || 0, angles: a || {}, extra: x || {} });
  A.addA = (base, d) => { const o = { ...base }; for (const k in d) o[k] = (o[k] || 0) + d[k]; return o; };
})(window.ART);
