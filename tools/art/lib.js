// Vesperal — ateliê de arte: biblioteca de desenho (contorno a tinta, sombreamento por bandas, texturas),
// esqueleto 2D com cinemática direta, capa simulada e exportação de spritesheets recortadas e empacotadas.
// Corre no Chromium (tools/art/build.py) e produz PNG reais + metadados para o jogo.
'use strict';
(function () {
  const A = window.ART = {};
  const TAU = Math.PI * 2, D2R = Math.PI / 180;
  A.TAU = TAU; A.D2R = D2R;

  // ------------------------------------------------------------ utilitários
  A.mk = (w, h) => { const c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h)); return c; };
  A.rng = (seed) => { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
  A.lerp = (a, b, t) => a + (b - a) * t;
  A.clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  A.ease = { io: (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2), out: (t) => 1 - Math.pow(1 - t, 3), in: (t) => t * t * t, sine: (t) => -(Math.cos(Math.PI * t) - 1) / 2, back: (t) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); } };
  A.hex = (h) => { const n = parseInt(h.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
  A.rgba = (h, a) => { const [r, g, b] = A.hex(h); return `rgba(${r},${g},${b},${a})`; };
  A.mix = (h1, h2, t) => { const a = A.hex(h1), b = A.hex(h2); return '#' + a.map((v, i) => Math.round(A.lerp(v, b[i], t)).toString(16).padStart(2, '0')).join(''); };
  // gera uma rampa de material a partir de uma cor base
  A.mat = (base, o = {}) => ({ base, shadow: o.shadow || A.mix(base, '#08060c', 0.45), deep: o.deep || A.mix(base, '#050308', 0.7), light: o.light || A.mix(base, '#fff4e0', 0.28), spec: o.spec || null, ink: o.ink || '#0b0910', tex: o.tex || 0 });

  // ------------------------------------------------------------ caminhos
  // A.path((p) => { p.M(x,y); p.L(..); p.Q(..); p.C(..); p.Z(); }) em unidades lógicas; s = escala
  A.path = function (fn, s = 1) {
    const P = new Path2D();
    const api = {
      M: (x, y) => P.moveTo(x * s, y * s), L: (x, y) => P.lineTo(x * s, y * s),
      Q: (cx, cy, x, y) => P.quadraticCurveTo(cx * s, cy * s, x * s, y * s),
      C: (a, b, c, d, x, y) => P.bezierCurveTo(a * s, b * s, c * s, d * s, x * s, y * s),
      E: (x, y, rx, ry, rot = 0) => { P.moveTo((x + rx * Math.cos(rot)) * s, (y + rx * Math.sin(rot)) * s); P.ellipse(x * s, y * s, rx * s, ry * s, rot, 0, TAU); },
      Z: () => P.closePath(),
    };
    fn(api);
    return P;
  };
  // forma de membro afunilado entre (0,0) e (len,0): larguras w0 → w1, extremos arredondados
  A.limbPath = function (len, w0, w1, s = 1, bulge = 0) {
    return A.path((p) => {
      p.M(0, -w0 / 2);
      p.C(len * 0.35, -w0 / 2 - bulge, len * 0.7, -w1 / 2 - bulge * 0.5, len, -w1 / 2);
      p.C(len + w1 * 0.55, -w1 / 2, len + w1 * 0.55, w1 / 2, len, w1 / 2);
      p.C(len * 0.7, w1 / 2 + bulge * 0.3, len * 0.35, w0 / 2 + bulge * 0.4, 0, w0 / 2);
      p.C(-w0 * 0.55, w0 / 2, -w0 * 0.55, -w0 / 2, 0, -w0 / 2);
      p.Z();
    }, s);
  };

  // ------------------------------------------------------------ pintura de uma peça
  // sombreamento por bandas: base; sombra no lado oposto à luz; meia-luz; brilho fino no lado da luz
  // L = direção da luz em px (vetor que aponta PARA a luz, no espaço do canvas atual)
  A.paint = function (ctx, path, m, o = {}) {
    const L = o.light || [-1, -1.2];
    const k = o.depth === undefined ? 2.4 : o.depth; // largura da banda de sombra (px do canvas)
    const len = Math.hypot(L[0], L[1]) || 1, lx = L[0] / len, ly = L[1] / len;
    ctx.save();
    ctx.clip(path);
    ctx.fillStyle = m.shadow; ctx.fill(path);
    ctx.save(); ctx.translate(lx * k, ly * k); ctx.fillStyle = m.base; ctx.fill(path); ctx.restore();
    if (o.deep !== false) { ctx.save(); ctx.translate(-lx * k * 0.6, -ly * k * 0.6); ctx.globalCompositeOperation = 'destination-over'; ctx.restore(); }
    // oclusão profunda junto ao contorno oposto
    ctx.save(); ctx.globalCompositeOperation = 'source-atop';
    ctx.translate(lx * k * 2.2, ly * k * 2.2); ctx.globalAlpha = 0.0; ctx.restore();
    if (m.light && o.hl !== false) {
      // faixa de luz: forma menos a forma deslocada para longe da luz
      const hc = A.mk(ctx.canvas.width, ctx.canvas.height), hx = hc.getContext('2d');
      hx.setTransform(ctx.getTransform());
      hx.fillStyle = m.light; hx.fill(path);
      hx.globalCompositeOperation = 'destination-out';
      const hk = o.hlw === undefined ? k * 0.55 : o.hlw;
      hx.translate(-lx * hk, -ly * hk); hx.fill(path);
      ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = o.hlAlpha === undefined ? 0.85 : o.hlAlpha; ctx.drawImage(hc, 0, 0); ctx.restore();
    }
    if (o.after) o.after(ctx);
    ctx.restore();
    if (o.ink !== false) { ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.strokeStyle = o.inkColor || m.ink; ctx.lineWidth = o.inkW || 1.6; ctx.stroke(path); }
  };
  A.stroke = function (ctx, pts, w, col, s = 1, close = false) {
    ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x * s, y * s) : ctx.moveTo(x * s, y * s))); if (close) ctx.closePath();
    ctx.strokeStyle = col; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke();
  };
  A.glow = function (ctx, x, y, r, col, a = 1) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, A.rgba(col, a)); g.addColorStop(0.4, A.rgba(col, a * 0.35)); g.addColorStop(1, A.rgba(col, 0));
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); ctx.restore();
  };

  // ------------------------------------------------------------ pós-processamento
  // contorno exterior (dilatação) atrás da figura
  A.outline = function (src, px, color) {
    const c = A.mk(src.width, src.height), x = c.getContext('2d');
    const t = A.mk(src.width, src.height), tx = t.getContext('2d');
    tx.drawImage(src, 0, 0); tx.globalCompositeOperation = 'source-in'; tx.fillStyle = color; tx.fillRect(0, 0, t.width, t.height);
    const n = Math.max(8, Math.round(px * 6));
    for (let i = 0; i < n; i++) { const a = i / n * TAU; x.drawImage(t, Math.cos(a) * px, Math.sin(a) * px); }
    x.drawImage(src, 0, 0);
    return c;
  };
  // luz de contorno (orla) no lado indicado
  A.rim = function (src, dx, dy, color, alpha) {
    const t = A.mk(src.width, src.height), tx = t.getContext('2d');
    tx.drawImage(src, 0, 0); tx.globalCompositeOperation = 'source-in'; tx.fillStyle = color; tx.fillRect(0, 0, t.width, t.height);
    tx.globalCompositeOperation = 'destination-out'; tx.drawImage(src, -dx, -dy);
    const c = src.getContext('2d'); c.save(); c.globalAlpha = alpha; c.globalCompositeOperation = 'source-atop'; c.drawImage(t, 0, 0); c.restore();
    return src;
  };
  // grão/textura dentro da silhueta
  A.grain = function (src, amount, seed = 1, scale = 1) {
    const c = src.getContext('2d'), w = src.width, h = src.height;
    const img = c.getImageData(0, 0, w, h), d = img.data, r = A.rng(seed);
    for (let i = 0; i < d.length; i += 4) {
      if (d[i + 3] === 0) continue;
      const n = (r() - 0.5) * amount * 255;
      d[i] = A.clamp(d[i] + n, 0, 255); d[i + 1] = A.clamp(d[i + 1] + n, 0, 255); d[i + 2] = A.clamp(d[i + 2] + n, 0, 255);
    }
    c.putImageData(img, 0, 0);
    return src;
  };
  // tracejado de gravura nas zonas escuras (identidade "gravura a tinta")
  A.hatch = function (ctx, path, ang, gap, w, col, alpha, bounds) {
    ctx.save(); ctx.clip(path); ctx.globalAlpha = alpha; ctx.strokeStyle = col; ctx.lineWidth = w;
    const [x0, y0, x1, y1] = bounds; const ca = Math.cos(ang), sa = Math.sin(ang), diag = Math.hypot(x1 - x0, y1 - y0);
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
    ctx.beginPath();
    for (let d = -diag; d < diag; d += gap) { ctx.moveTo(cx + -sa * d - ca * diag, cy + ca * d - sa * diag); ctx.lineTo(cx + -sa * d + ca * diag, cy + ca * d + sa * diag); }
    ctx.stroke(); ctx.restore();
  };

  // ------------------------------------------------------------ esqueleto
  // bones: [{ n, p (pai), len, a (ângulo base, graus, relativo ao pai), at (0..1 ao longo do pai) , off:[x,y] }]
  A.Rig = class {
    constructor(bones) { this.bones = bones; this.by = {}; bones.forEach((b) => (this.by[b.n] = b)); }
    // pose: { root:[x,y], rootA, angles:{bone: graus}, scale:{bone: k} } → transformações no mundo
    solve(pose) {
      const W = {};
      for (const b of this.bones) {
        const ang = (b.a || 0) + ((pose.angles && pose.angles[b.n]) || 0);
        const len = b.len * ((pose.scale && pose.scale[b.n]) || 1);
        let x, y, a;
        if (!b.p) { x = pose.root[0]; y = pose.root[1]; a = ang + (pose.rootA || 0); }
        else {
          const P = W[b.p], t = b.at === undefined ? 1 : b.at;
          const off = b.off || [0, 0];
          const ca = Math.cos(P.a * D2R), sa = Math.sin(P.a * D2R);
          x = P.x + ca * P.len * t + ca * off[0] - sa * off[1];
          y = P.y + sa * P.len * t + sa * off[0] + ca * off[1];
          a = P.a + ang;
        }
        const ca = Math.cos(a * D2R), sa = Math.sin(a * D2R);
        W[b.n] = { x, y, a, len, ex: x + ca * len, ey: y + sa * len };
      }
      return W;
    }
  };
  // aplica a transformação do osso ao ctx (x ao longo do osso)
  A.boneT = function (ctx, B, s) { ctx.translate(B.x * s, B.y * s); ctx.rotate(B.a * D2R); };
  // interpolação de poses por fotogramas-chave: keys = [[t, pose], ...] (t em 0..1)
  A.interp = function (keys, t, easeFn) {
    let i = 0; while (i < keys.length - 2 && t > keys[i + 1][0]) i++;
    const [t0, p0] = keys[i], [t1, p1] = keys[Math.min(i + 1, keys.length - 1)];
    let k = t1 > t0 ? A.clamp((t - t0) / (t1 - t0), 0, 1) : 0;
    const ef = (p1._ease && A.ease[p1._ease]) || easeFn || A.ease.io; k = ef(k);
    const out = { angles: {}, scale: {}, extra: {} };
    out.root = [A.lerp(p0.root[0], p1.root[0], k), A.lerp(p0.root[1], p1.root[1], k)];
    out.rootA = A.lerp(p0.rootA || 0, p1.rootA || 0, k);
    const names = new Set([...Object.keys(p0.angles || {}), ...Object.keys(p1.angles || {})]);
    for (const n of names) out.angles[n] = A.lerp((p0.angles || {})[n] || 0, (p1.angles || {})[n] || 0, k);
    const sn = new Set([...Object.keys(p0.scale || {}), ...Object.keys(p1.scale || {})]);
    for (const n of sn) out.scale[n] = A.lerp((p0.scale || {})[n] === undefined ? 1 : p0.scale[n], (p1.scale || {})[n] === undefined ? 1 : p1.scale[n], k);
    const en = new Set([...Object.keys(p0.extra || {}), ...Object.keys(p1.extra || {})]);
    // números e vetores (mão, pés, alvos) interpolam; o resto muda a meio
    const vec = (v) => Array.isArray(v) && v.every((q) => typeof q === 'number');
    for (const n of en) {
      const a = (p0.extra || {})[n], b = (p1.extra || {})[n];
      if (vec(a) && vec(b) && a.length === b.length) out.extra[n] = a.map((q, j) => A.lerp(q, b[j], k));
      else out.extra[n] = typeof a === 'number' || typeof b === 'number' ? A.lerp(a || 0, b || 0, k) : (k < 0.5 ? a : b);
    }
    return out;
  };

  // ------------------------------------------------------------ pano simulado (capa, fitas)
  // simula uma corrente presa a uma âncora ao longo de uma sequência de poses (com aquecimento para ciclos)
  A.Cloth = class {
    constructor(n, seg, o = {}) { this.n = n; this.seg = seg; this.g = o.g || 30; this.damp = o.damp || 0.9; this.stiff = o.stiff || 0.0; this.pts = null; this.wind = o.wind || 0; }
    reset(ax, ay, dir) { this.pts = []; for (let i = 0; i < this.n; i++) this.pts.push({ x: ax - dir * i * this.seg * 0.3, y: ay + i * this.seg * 0.95, px: ax - dir * i * this.seg * 0.3, py: ay + i * this.seg * 0.95 }); }
    step(ax, ay, vx, vy, dt, extraWind = 0, rest) {
      const P = this.pts; P[0].x = ax; P[0].y = ay;
      for (let i = 1; i < P.length; i++) {
        const p = P[i];
        const nx = (p.x - p.px) * this.damp, ny = (p.y - p.py) * this.damp;
        p.px = p.x; p.py = p.y;
        p.x += nx - vx * dt * 0.9 * (i / P.length) + (this.wind + extraWind) * dt * dt * 60;
        p.y += ny + this.g * dt * dt * 60 - vy * dt * 0.5 * (i / P.length);
      }
      for (let k = 0; k < 4; k++) for (let i = 1; i < P.length; i++) {
        const a = P[i - 1], b = P[i]; const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1; const df = (d - this.seg) / d;
        if (i === 1) { b.x -= dx * df; b.y -= dy * df; } else { a.x += dx * df * 0.5; a.y += dy * df * 0.5; b.x -= dx * df * 0.5; b.y -= dy * df * 0.5; }
        if (rest) { const r = rest(i, b); if (r) { b.x = r[0]; b.y = r[1]; } }
      }
      P[0].x = ax; P[0].y = ay;
      return P.map((p) => [p.x, p.y]);
    }
  };

  // ------------------------------------------------------------ fotogramas e folhas
  // recorta o canvas ao conteúdo (alfa > 0) com margem
  A.trim = function (cv, pad = 2) {
    const c = cv.getContext('2d'), { width: w, height: h } = cv;
    const d = c.getImageData(0, 0, w, h).data;
    let x0 = w, y0 = h, x1 = -1, y1 = -1;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (d[(y * w + x) * 4 + 3] > 2) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    if (x1 < 0) return { cv: A.mk(1, 1), ox: 0, oy: 0 };
    x0 = Math.max(0, x0 - pad); y0 = Math.max(0, y0 - pad); x1 = Math.min(w - 1, x1 + pad); y1 = Math.min(h - 1, y1 + pad);
    const out = A.mk(x1 - x0 + 1, y1 - y0 + 1); out.getContext('2d').drawImage(cv, -x0, -y0);
    return { cv: out, ox: x0, oy: y0 };
  };
  // empacota fotogramas em prateleiras; devolve { canvas, rects }
  A.pack = function (frames, maxW = 2048) {
    const order = frames.map((f, i) => i).sort((a, b) => frames[b].cv.height - frames[a].cv.height);
    let x = 0, y = 0, rowH = 0, W = 0;
    const rects = [];
    for (const i of order) {
      const f = frames[i].cv;
      if (x + f.width > maxW) { x = 0; y += rowH + 1; rowH = 0; }
      rects[i] = { x, y, w: f.width, h: f.height };
      x += f.width + 1; rowH = Math.max(rowH, f.height); W = Math.max(W, x);
    }
    const H = y + rowH;
    const cv = A.mk(W, H), c = cv.getContext('2d');
    frames.forEach((f, i) => c.drawImage(f.cv, rects[i].x, rects[i].y));
    return { cv, rects };
  };

  // Construtor de spritesheet de personagem.
  // spec = { name, scale (px por unidade lógica), box:[w,h] lógica, anchor:[ax,ay] lógico dentro da caixa,
  //          anims: { nome: { n, fps, loop, phases?, pose(t,i,ctx) -> {draw(ctx,s) , points:{...}} } } }
  A.buildSheet = function (spec) {
    // unit: unidades do jogo por unidade do desenho (chefes grandes desenhados com o mesmo detalhe)
    const s = spec.scale, u = spec.unit || 1, [bw, bh] = spec.box, [ax, ay] = spec.anchor;
    const frames = [], meta = { name: spec.name, scale: +(s / u).toFixed(4), anims: {}, frames: [] };
    for (const [an, A0] of Object.entries(spec.anims)) {
      const list = [];
      const state = {};
      if (A0.warm) for (let w = 0; w < A0.warm; w++) for (let i = 0; i < A0.n; i++) A0.frame(i / A0.n, i, state, true);
      for (let i = 0; i < A0.n; i++) {
        const cv = A.mk(bw * s, bh * s), c = cv.getContext('2d');
        c.translate(ax * s, ay * s);
        const res = A0.frame(A0.loop ? i / A0.n : (A0.n > 1 ? i / (A0.n - 1) : 0), i, state, false, c) || {};
        let out = cv;
        if (spec.post) out = spec.post(out, an, i) || out;
        // camada por cima do contorno (chamas, brilhos): não leva tinta nem grão
        if (res.overlay) { const oc = out.getContext('2d'); oc.save(); oc.translate(ax * s, ay * s); res.overlay(oc); oc.restore(); }
        const tr = A.trim(out, 2);
        const fi = frames.length;
        frames.push(tr);
        const pts = {};
        for (const [k, v] of Object.entries(res.points || {})) pts[k] = v.map((q, j) => (j < 2 ? +(q * u).toFixed(2) : +q.toFixed(3)));
        meta.frames.push({ ox: +((tr.ox / s - ax) * u).toFixed(3), oy: +((tr.oy / s - ay) * u).toFixed(3), pts, dur: res.dur });
        list.push(fi);
      }
      meta.anims[an] = { frames: list, fps: A0.fps, loop: !!A0.loop, phases: A0.phases || null };
      if (A0.stride) meta.anims[an].stride = A0.stride * u; // distância percorrida por ciclo (para os pés não deslizarem)
    }
    const packed = A.pack(frames, spec.maxW || 2048);
    packed.rects.forEach((r, i) => Object.assign(meta.frames[i], { x: r.x, y: r.y, w: r.w, h: r.h }));
    return { canvas: packed.cv, meta };
  };

  // ícones / imagens estáticas
  A.buildImage = function (w, h, fn) { const cv = A.mk(w, h); fn(cv.getContext('2d'), w, h); return cv; };

  A.registry = {};
  A.register = (name, fn) => { A.registry[name] = fn; };
})();
