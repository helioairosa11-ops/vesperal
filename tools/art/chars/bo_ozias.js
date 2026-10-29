// Vesperal — Bispo Ozias (Altar-Mor da Catedral): velho e descarnado, flutua sem pés dentro de uma capa pluvial
// enorme de linho branco-dourado com sebastos bordados, que se desfaz em farrapos de luz em baixo. Mitra alta com
// ínfulas, barba branca rala, olhos fechados de onde escorre luz. Báculo de crossa enrolada (com uma luz dentro)
// na mão de trás; na da frente o cálice dourado rachado — o orbe que lança pode ser devolvido com parry.
// Folha com âncora ao centro (voa). Exportada a ×1.75. → assets/sprites/en_b_ozias.png
'use strict';
(function (A) {
  const S = 5, K = A.kit(S), D2R = A.D2R;
  const H = A.humanoid({ pelvis: 2.4, spine: 6.0, chest: 6.0, neck: 2.2, head: 4.4, thigh: 7.6, shin: 7.0, foot: 2.6, uarm: 6.4, farm: 6.0, hand: 2.2, shoulder: 0.8 });
  const rig = H.rig;
  const M = {
    cope: A.mat('#e6dcc4', { shadow: '#9e9078', light: '#fffaea', deep: '#4a4030' }),
    copeIn: A.mat('#7a1e22', { shadow: '#40080c', light: '#a8403c' }),
    alb: A.mat('#d4ccbc', { shadow: '#8a8274', light: '#f4eee2' }),
    gold: A.mat('#c09a4a', { shadow: '#705424', light: '#f8e0a0', deep: '#2a1e0c' }),
    skin: A.mat('#c4b4a4', { shadow: '#7e6e60', light: '#ece0d2', deep: '#2e241c' }),
    beard: A.mat('#e8e4dc', { shadow: '#a09a90', light: '#ffffff' }),
    wood: A.mat('#5a4028', { shadow: '#2e2010', light: '#8a6a44' }),
  };
  const BACK = 0.62;
  const pt = (B, t, w) => { const [x, y] = K.along(B, t), [nx, ny] = K.perp(B); return [x + nx * w, y + ny * w]; };

  function solve(pose) {
    const x = pose.extra;
    const W = rig.solve(pose);
    H.arm(pose, 'F', [W.uarmF.x + x.hF[0], W.uarmF.y + x.hF[1]], x.haF || -90, x.bF || 1);
    H.arm(pose, 'B', [W.uarmB.x + x.hB[0], W.uarmB.y + x.hB[1]], x.ca, x.bB || 1);
  }
  // capa pluvial: semicírculo das costas aos pés, aberta à frente, a acabar em farrapos de luz
  function cope(ctx, W, x, front) {
    const C = W.chest, Pv = W.pelvis, sw = x.sway || 0, fl = x.flare || 0;
    const [px, py] = K.along(Pv, 0.2), sh0 = pt(C, 1.0, -4.2), sh1 = pt(C, 1.0, 3.6);
    const hemY = py + 13 + fl * 1.4;
    if (!front) {
      const p = A.path((q) => {
        q.M(sh1[0], sh1[1]); q.Q(sh0[0] + 2, sh0[1] - 2.2, sh0[0] - 1.6, sh0[1] + 1);
        q.Q(px - 10 - fl * 3, py + 2, px - 11.6 + sw * 1.6 - fl * 4, hemY - 1);
        for (let i = 0; i < 9; i++) { const k = (i + 1) / 9; q.L(A.lerp(px - 11.6 + sw * 1.6 - fl * 4, px + 8.6 + sw + fl * 3, k), hemY + (i % 2 ? -2.6 : 0.6) + Math.sin(k * 7 + sw) * 0.6); }
        q.Q(px + 7.6 + fl * 2, py + 4, ...pt(C, 0.4, 4.2)); q.Z();
      }, S);
      K.paint(ctx, p, M.copeIn, { depth: S * 0.8 }); // forro carmim por dentro (visto atrás do corpo)
      return;
    }
    // aba exterior por cima do ombro da frente (parte da capa que cai pela frente)
    const p = A.path((q) => { q.M(sh0[0] + 1.6, sh0[1] - 1.0); q.Q(sh1[0] + 1.6, sh1[1] - 1.6, sh1[0] + 2.4, sh1[1] + 1.2); q.Q(px + 6.4 + fl * 2, py + 2, px + 7.4 + sw + fl * 3, hemY - 2.6); q.L(px + 4.6 + sw, hemY - 0.4); q.L(px + 3.0 + sw, hemY - 3.0); q.Q(px + 2.6, py + 2, ...pt(C, 0.6, 1.6)); q.Q(...pt(C, 0.9, -1.0), sh0[0] + 1.6, sh0[1] - 1.0); q.Z(); }, S);
    K.paint(ctx, p, M.cope, { depth: S * 0.8, hlw: S * 0.35 });
    ctx.save(); ctx.clip(p); for (let i = 0; i < 3; i++) K.line(ctx, [pt(C, 0.9, 2.0 + i * 0.6), [px + 4.6 + i * 1.0 + sw, hemY - 2]], 0.22, A.rgba(M.cope.deep, 0.35)); ctx.restore();
    // sebasto bordado (orla dourada larga com cruzes)
    const o0 = pt(C, 0.95, 2.0);
    K.tube(ctx, [o0, pt(C, 0.4, 3.0), [px + 3.6 + sw * 0.6, py + 6], [px + 4.0 + sw, hemY - 2.4]], [0.9, 0.9, 0.9, 0.85], M.gold, { depth: S * 0.2, flat: true });
    for (const [t, dy] of [[0.3, 0], [0.62, 0], [0.9, 0]]) { const q = [A.lerp(o0[0], px + 4.0 + sw, t), A.lerp(o0[1], hemY - 2.4, t) + dy]; K.line(ctx, [[q[0], q[1] - 0.6], [q[0], q[1] + 0.6]], 0.2, M.copeIn.base); K.line(ctx, [[q[0] - 0.45, q[1] - 0.1], [q[0] + 0.45, q[1] - 0.1]], 0.2, M.copeIn.base); }
    // fecho (morse) no peito
    const mo = pt(C, 0.8, 1.4); K.blob(ctx, [[mo[0] - 1.3, mo[1]], [mo[0], mo[1] - 1.3], [mo[0] + 1.3, mo[1]], [mo[0], mo[1] + 1.3]], M.gold, { depth: S * 0.25 });
    K.ember(ctx, mo[0], mo[1], 0.35, 0.7, '#ffe0a0');
  }
  function body(ctx, W, x) {
    const Pv = W.pelvis, C = W.chest, sw = x.sway || 0, fl = x.flare || 0;
    const [px, py] = K.along(Pv, 0.2), hemY = py + 12 + fl;
    // alva branca, a desfazer-se em baixo (sem pés)
    const alb = A.path((q) => { const a = pt(W.spine, 0.1, -3.0), b = pt(W.spine, 0.1, 3.2); q.M(a[0], a[1]); q.L(b[0], b[1]); q.Q(px + 4.6, py + 6, px + 4.8 + sw * 0.6, hemY - 1); for (let i = 0; i < 6; i++) { const k = (i + 1) / 6; q.L(A.lerp(px + 4.8 + sw * 0.6, px - 4.4 + sw * 0.8, k), hemY + (i % 2 ? -2.4 : 0.4)); } q.Q(px - 4.4, py + 6, a[0], a[1]); q.Z(); }, S);
    ctx.save();
    const g = ctx.createLinearGradient(0, (py + 2) * S, 0, (hemY + 1) * S); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(255,240,200,0.9)');
    K.paint(ctx, alb, M.alb, { depth: S * 0.8, hlw: S * 0.35 });
    ctx.globalCompositeOperation = 'source-atop'; ctx.fillStyle = g; ctx.fill(alb);
    ctx.restore();
    const torso = H.torsoPath(W, [['spine', 0.15, 3.0, 3.0], ['spine', 0.75, 2.6, 2.8], ['chest', 0.45, 3.0, 3.0], ['chest', 0.95, 2.6, 2.8], ['chest', 1.05, 1.8, 2.2]], S);
    K.paint(ctx, torso, M.alb, { depth: S * 0.7, hlw: S * 0.3 });
    // estola dourada
    K.tube(ctx, [pt(C, 1.0, 0.8), pt(C, 0.4, 1.6), pt(W.spine, 0.4, 1.8), [px + 1.8 + sw * 0.5, py + 9]], [0.6, 0.6, 0.6, 0.55], M.gold, { depth: S * 0.15, flat: true });
  }
  function arm(ctx, W, side, back) {
    const U = W['uarm' + side], F = W['farm' + side], Hd = W['hand' + side];
    const dm = (m) => (back ? K.dim(m, BACK) : m);
    K.limb(ctx, [U.x, U.y], [F.x, F.y], [F.ex, F.ey], 1.7, 1.5, 1.2, dm(M.alb), { depth: S * 0.45 });
    // manga larga
    const p1 = [F.x, F.y], p2 = [F.ex, F.ey], dd = K.norm(p2[0] - p1[0], p2[1] - p1[1]), nn = [-dd[1], dd[0]], L = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]);
    const at = (t, w) => [p1[0] + dd[0] * L * t + nn[0] * w, p1[1] + dd[1] * L * t + nn[1] * w];
    K.poly(ctx, [at(0.3, 1.6), at(0.96, 2.8), at(0.96, -2.6), at(0.3, -1.6)], dm(M.alb), { depth: S * 0.3 });
    K.line(ctx, [at(0.95, 2.7), at(0.95, -2.5)], 0.35, dm(M.gold).base);
    ctx.save(); A.boneT(ctx, Hd, S); // mão ossuda
    K.blob(ctx, [[-0.5, -0.9], [1.6, -0.9], [2.4, -0.2], [1.8, 0.8], [-0.5, 0.8]], dm(M.skin), { depth: S * 0.3 });
    ctx.restore();
  }
  function crosier(ctx, W, x) {
    const Hd = W.handB, g = [Hd.ex, Hd.ey], a = (x.ca - 90) * D2R, d = [Math.cos(a), Math.sin(a)];
    const at = (u) => [g[0] + d[0] * u, g[1] + d[1] * u];
    K.tube(ctx, [at(-12), at(0), at(13)], [0.42, 0.42, 0.4], K.dim(M.gold, 0.9), { depth: S * 0.15, flat: true });
    for (const u of [-6, 6]) K.dot(ctx, at(u)[0], at(u)[1], 0.6, M.gold.base);
    // crossa enrolada
    const top = at(13), n = [-d[1], d[0]];
    const cr = []; for (let i = 0; i <= 10; i++) { const k = i / 10, ang = Math.PI * 1.6 * k, r = 3.0 - k * 1.6; cr.push([top[0] + d[0] * (Math.sin(ang) * r) + n[0] * (r - Math.cos(ang) * r), top[1] + d[1] * (Math.sin(ang) * r) + n[1] * (r - Math.cos(ang) * r)]); }
    K.tube(ctx, cr, cr.map((_, i) => 0.42 - i * 0.02), M.gold, { depth: S * 0.15, flat: true });
    x._crook = [top[0] + n[0] * 2.2 + d[0] * 1.6, top[1] + n[1] * 2.2 + d[1] * 1.6];
    K.ember(ctx, x._crook[0], x._crook[1], 0.5, 0.8 + (x.light || 0), '#fff0c0');
  }
  function chalice(ctx, W, x) {
    const Hd = W.handF, c = [Hd.ex + 0.4, Hd.ey - 0.8];
    K.poly(ctx, [[c[0] - 1.6, c[1] + 2.4], [c[0] + 1.6, c[1] + 2.4], [c[0] + 0.4, c[1] + 1.6], [c[0] - 0.4, c[1] + 1.6]], M.gold, { depth: 0 });
    K.tube(ctx, [[c[0], c[1] + 1.6], [c[0], c[1] - 0.6]], [0.35, 0.35], M.gold, { depth: 0, flat: true });
    const cup = A.path((q) => { q.M(c[0] - 2.0, c[1] - 3.6); q.L(c[0] + 2.0, c[1] - 3.6); q.Q(c[0] + 2.0, c[1] - 0.4, c[0], c[1] - 0.4); q.Q(c[0] - 2.0, c[1] - 0.4, c[0] - 2.0, c[1] - 3.6); q.Z(); }, S);
    K.paint(ctx, cup, M.gold, { depth: S * 0.35, hlw: S * 0.2 });
    K.line(ctx, [[c[0] + 0.6, c[1] - 3.6], [c[0] + 0.2, c[1] - 2.2], [c[0] + 0.8, c[1] - 1.2]], 0.16, '#2a1a08'); // racha
    x._cup = [c[0], c[1] - 3.6];
  }
  function head(ctx, W, x) {
    const Hd = W.head, sw = x.sway || 0;
    ctx.save(); A.boneT(ctx, Hd, S); ctx.rotate(Math.PI / 2);
    // ínfulas da mitra a cair atrás
    for (const o of [0, 0.9]) K.tube(ctx, [[-1.0 - o, -3.8], [-2.0 - o + sw * 0.3, 0], [-2.4 - o + sw * 0.6, 3.6]], [0.5, 0.5, 0.45], M.gold, { depth: 0, flat: true });
    const face = K.blob(ctx, [[-1.4, 0.8], [-1.6, -2.4], [-0.6, -4.0], [1.4, -4.2], [2.4, -3.2], [2.6, -2.2], [3.2, -1.3], [2.6, -0.9], [2.6, -0.1], [2.0, 0.9], [0.4, 1.4]], M.skin, { depth: S * 0.5, hlw: S * 0.25, light: [0.6, -1] });
    ctx.save(); ctx.clip(face); K.line(ctx, [[0.8, -1.6], [1.8, -0.2]], 0.3, A.rgba(M.skin.deep, 0.55)); K.line(ctx, [[0.6, -2.8], [1.4, -2.6]], 0.2, A.rgba(M.skin.deep, 0.45)); ctx.restore();
    // olhos fechados de onde escorre luz
    K.line(ctx, [[1.6, -2.5], [2.5, -2.4]], 0.16, '#3a2a20');
    K.ember(ctx, 2.1, -2.3, 0.3, x.eye === undefined ? 0.9 : x.eye, '#fff0c0');
    K.line(ctx, [[2.1, -2.2], [2.2, -1.0]], 0.14, A.rgba('#fff4d0', 0.7 * (x.eye === undefined ? 0.9 : x.eye)));
    // barba branca rala
    const bd = A.path((q) => { q.M(0.4, -0.6); q.Q(1.8, 0.0, 2.6, -0.4); q.Q(2.4, 2.4, 1.0, 4.4); q.Q(0.4, 2.0, -0.6, 0.6); q.Z(); }, S);
    K.paint(ctx, bd, M.beard, { depth: S * 0.25, hlw: S * 0.15 });
    K.line(ctx, [[1.6, -0.6], [2.4, -0.7 + (x.mouth || 0) * 0.3]], 0.14 + (x.mouth || 0) * 0.12, '#2a1a14');
    // mitra alta com faixa e cruz
    const mi = A.path((q) => { q.M(-1.8, -3.4); q.L(2.6, -3.6); q.L(2.0, -6.6); q.L(0.6, -10.2); q.L(-0.8, -6.8); q.Z(); }, S);
    K.paint(ctx, mi, M.cope, { depth: S * 0.4, hlw: S * 0.25 });
    ctx.save(); ctx.clip(mi); K.poly(ctx, [[-2, -4.6], [3, -4.8], [3, -3.4], [-2, -3.2]], M.gold, { depth: 0 }); K.line(ctx, [[0.5, -9.4], [0.5, -5.0]], 0.4, M.gold.base); K.line(ctx, [[-0.4, -7.4], [1.4, -7.4]], 0.4, M.gold.base); ctx.restore();
    ctx.restore();
  }
  function draw(ctx, W, x) {
    cope(ctx, W, x, false);
    crosier(ctx, W, x);
    arm(ctx, W, 'B', true);
    body(ctx, W, x);
    head(ctx, W, x);
    cope(ctx, W, x, true);
    chalice(ctx, W, x);
    arm(ctx, W, 'F', false);
  }
  function overlay(ctx, W, x) {
    const k = x.light || 0;
    if (x._cup) A.glow(ctx, x._cup[0] * S, x._cup[1] * S, (3 + k * 3) * S, '#ffe8a0', 0.35 + k * 0.4);
    if (x._crook) A.glow(ctx, x._crook[0] * S, x._crook[1] * S, (2.5 + k * 2) * S, '#fff0c0', 0.3 + k * 0.3);
    const Pv = W.pelvis; A.glow(ctx, Pv.x * S, (Pv.y + 12) * S, 7 * S, '#fff0c0', 0.18); // luz onde deviam estar os pés
  }
  function points(W, x) {
    const Hh = W.head, ca = Math.cos(Hh.a * D2R), sa = Math.sin(Hh.a * D2R);
    return { tip: x._cup, cup: x._cup, crook: x._crook, light: x._cup, eye: [Hh.x + ca * 2.2 - sa * 2.2, Hh.y + sa * 2.2 + ca * 2.2] };
  }

  const STANCE = { pelvis: 0, spine: 2, chest: 4, neck: 10, head: -10 };
  const RY = 7.0; // âncora no centro do corpo (voa)
  const P = (a, x, root) => A.pose(A.addA(STANCE, a || {}), x, root || [0, RY]);
  const base = (o = {}) => Object.assign({ hF: [4.6, 5.6], haF: -90, hB: [-4.8, 3.0], ca: -8, sway: 0, flare: 0, light: 0, eye: 0.9, mouth: 0 }, o);
  function anims() {
    const R = {};
    R.idle = { n: 8, fps: 6, loop: true, poseFn: (t) => { const s = Math.sin(t * A.TAU), c = Math.cos(t * A.TAU); return P({ spine: s, head: -s }, base({ sway: c * 0.6, hF: [4.6, 5.6 + s * 0.3] }), [0, RY - s * 0.6]); } };
    R.move = { n: 8, fps: 8, loop: true, poseFn: (t) => { const s = Math.sin(t * A.TAU), c = Math.cos(t * A.TAU); return P({ spine: 10, chest: 4 }, base({ sway: -1.4 + c * 0.4, flare: 0.4 }), [0.4, RY - s * 0.5]); } };
    // PILARES: ergue o báculo ao alto
    const PL = (k) => P({ spine: -4, chest: -4, neck: -4, head: -18 }, base({ hB: [1.6, -9.4], ca: 4, light: 0.6 + k * 0.6, mouth: 0.6 + k * 0.4, eye: 1.5, flare: 0.4 + k * 0.4 }), [0, RY - 1]);
    R.atk_pillars = { n: 8, fps: 8, phases: [2, 5], keys: [[0, P({}, base())], [0.25, PL(0)], [0.5, PL(1)], [0.75, PL(0)], [1, P({}, base())]] };
    // ESTILHAÇOS: abre os braços, a capa enfuna-se
    const SH = P({ spine: -8, chest: -10, head: -16 }, base({ hF: [7.6, -1.6], haF: -40, hB: [-6.4, -1.4], ca: -48, flare: 2.2, light: 0.6, mouth: 1, eye: 1.6 }), [0, RY - 1.4]);
    R.atk_shards = { n: 8, fps: 10, phases: [3, 1], keys: [[0, P({}, base())], [0.35, SH], [0.6, SH], [1, P({}, base())]] };
    // ORBE: oferece o cálice para a frente
    const OR_W = P({ spine: -4, chest: -6 }, base({ hF: [2.0, 2.4], haF: -90, light: 0.6 }), [-0.6, RY]);
    const OR_A = P({ spine: 12, chest: 8, head: -14 }, base({ hF: [8.6, 1.4], haF: -80, light: 1.4, mouth: 0.8, eye: 1.6, sway: 0.8 }), [1.2, RY]);
    R.atk_orb = { n: 8, fps: 10, phases: [4, 1], keys: [[0, P({}, base())], [0.4, OR_W], [0.55, OR_A], [0.8, OR_A], [1, P({}, base())]] };
    // VARRIMENTO: o báculo varre a nave na horizontal
    const SW = (k) => P({ spine: 10, chest: 6 }, base({ hB: [6.4 + k, 4.0], ca: 92, light: 1, mouth: 0.6, eye: 1.6, flare: 1, sway: 1 }), [1.0, RY]);
    R.atk_sweep = { n: 8, fps: 8, phases: [3, 3], keys: [[0, P({}, base())], [0.3, SW(-3)], [0.6, SW(2)], [0.8, SW(1)], [1, P({}, base())]] };
    // CLARÃO (teleporte): fecha-se na capa
    const BL = P({ spine: 20, chest: 16, neck: 10, head: 4 }, base({ hF: [1.6, 3.0], hB: [2.0, 2.0], ca: 8, flare: -0.6, sway: 0, light: 1.2 }), [0, RY + 1]);
    R.atk_blink = { n: 6, fps: 10, phases: [2, 2], keys: [[0, P({}, base())], [0.4, BL], [0.7, BL], [1, P({}, base())]] };
    R.hurt = { n: 3, fps: 12, keys: [[0, P({ spine: -12, chest: -8, neck: -6, head: -10 }, base({ hF: [3.6, 6.4], mouth: 1, eye: 1.6, sway: -1 }), [-1.2, RY])], [1, P({}, base())]] };
    // atordoado (orbe devolvido): curvado, o cálice descai
    R.stagger = { n: 4, fps: 6, loop: true, poseFn: (t) => { const s = Math.sin(t * A.TAU); return P({ spine: 24 + s * 2, chest: 14, neck: 14, head: 4 + s * 3 }, base({ hF: [3.0, 9.0], haF: -10, hB: [0.4, 8.0], ca: 150, eye: 0.3, mouth: 1, sway: s, flare: -0.4 }), [0.4, RY + 2]); } };
    R.death = { n: 10, fps: 6, keys: [
      [0, P({ spine: -14, chest: -10, neck: -8, head: -18 }, base({ hF: [4.0, 2.0], mouth: 1.4, eye: 2, light: 1.4, flare: 1 }), [0, RY - 1])],
      [0.5, P({ spine: 26, chest: 16, neck: 12, head: 6 }, base({ hF: [3.0, 10.0], haF: 20, hB: [1.0, 9.0], ca: 160, eye: 0.6, light: 0.4, flare: -0.4 }), [0.4, RY + 6])],
      [1, P({ spine: 70, chest: 16, neck: 12, head: 8 }, base({ hF: [5.0, 9.0], haF: 60, hB: [3.0, 9.0], ca: 170, eye: 0, light: 0, flare: -1 }), [1.6, RY + 12])]] };
    return R;
  }
  A.register('en_b_ozias', () => A.creature({ name: 'en_b_ozias', S, unit: 1.75, box: [100, 92], anchor: [48, 52], rig, solve, draw, overlay, points, anims: anims(), post: K.post('#fff0c0', 0.35, 0.03) }));
  (A.previewCell = A.previewCell || {}).en_b_ozias = [120, 120];
})(window.ART);
