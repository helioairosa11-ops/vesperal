// Vesperal — Besteiro (crossbow): morto da guarda com chapéu de ferro de abas largas, gibão acolchoado,
// aljava de virotões à cinta e um pavês estreito às costas. Besta pesada com armadilha de manivela:
// aponta (brilho branco no virote), dispara com coice e volta a armar. → assets/sprites/en_crossbow.png
'use strict';
(function (A) {
  const S = 4, K = A.kit(S), D2R = A.D2R;
  const H = A.humanoid({ spine: 4.6, chest: 4.6, neck: 1.3, head: 4.1, thigh: 6.4, shin: 6.4, foot: 2.7, uarm: 4.7, farm: 4.4, hand: 1.6 });
  const rig = H.rig;
  const M = {
    skin: A.mat('#8a868c', { shadow: '#4a464e', light: '#b6b0b4', deep: '#24212a' }),
    gambeson: A.mat('#7a6a4e', { shadow: '#4a3e2c', light: '#a8946e', deep: '#251f15' }),
    steel: A.mat('#5d5f6a', { shadow: '#2e2f37', light: '#a8acba' }),
    leather: A.mat('#3e3029', { shadow: '#231a16', light: '#5e4a40' }),
    wood: A.mat('#5e452e', { shadow: '#34261a', light: '#8c6c4a' }),
    hose: A.mat('#3a3440', { shadow: '#1e1a22', light: '#5a5262' }),
    paint: A.mat('#5c2a2e', { shadow: '#341618', light: '#7e4046' }),
  };
  const BACK = 0.66;

  function solve(pose) {
    const x = pose.extra, r = pose.root;
    if (x.fF) H.leg(pose, 'F', [r[0] + x.fF[0], x.fF[1] - 0.85], x.faF || 0);
    if (x.fB) H.leg(pose, 'B', [r[0] + x.fB[0], x.fB[1] - 0.85], x.faB || 0);
    const W = rig.solve(pose);
    // besta: x.cb = posição da coronha (relativa ao ombro de perto), x.ca = ângulo; mãos no punho e no arco
    const c = [W.uarmF.x + x.cb[0], W.uarmF.y + x.cb[1]], a = x.ca * D2R, d = [Math.cos(a), Math.sin(a)];
    x._c = c; x._d = d;
    H.arm(pose, 'F', [c[0] + d[0] * 3.0, c[1] + d[1] * 3.0 + 0.6], x.ca + 70, 1);
    const hb = x.crank ? [c[0] - d[0] * 1.2 + Math.cos(x.crank * D2R) * 1.6, c[1] - d[1] * 1.2 + Math.sin(x.crank * D2R) * 1.6] : [c[0] + d[0] * 7.6, c[1] + d[1] * 7.6 + 0.5];
    H.arm(pose, 'B', hb, x.ca + 80, 1);
  }
  function crossbow(ctx, x) {
    const c = x._c, d = x._d, n = [-d[1], d[0]];
    const at = (t, w = 0) => [c[0] + d[0] * t + n[0] * w, c[1] + d[1] * t + n[1] * w];
    // coronha/tiller
    K.poly(ctx, [at(-2.6, -0.5), at(9.4, -0.45), at(9.4, 0.45), at(1.0, 0.7), at(-2.4, 1.1)], M.wood, { depth: S * 0.25, hlw: S * 0.15 });
    // arco de aço (visto de lado, curva para trás) e corda
    const draw = x.drawn === undefined ? 1 : x.drawn;
    const b0 = at(8.2, -3.0 + (1 - draw) * 0.4), b1 = at(9.4, 0), b2 = at(8.2, 3.0 - (1 - draw) * 0.4);
    K.line(ctx, [b0, at(9.3, -1.5), b1, at(9.3, 1.5), b2], 0.42, M.steel.shadow);
    K.line(ctx, [b0, at(9.3, -1.5), b1], 0.16, M.steel.light);
    const nut = at(A.lerp(9.0, 3.0, draw), 0);
    K.line(ctx, [b0, nut, b2], 0.1, '#d8ceb8');
    // virote armado
    if (x.bolt !== false && draw > 0.6) { K.line(ctx, [at(3.0, -0.6), at(10.6, -0.6)], 0.22, '#6a5038'); K.poly(ctx, [at(10.4, -1.0), at(11.6, -0.6), at(10.4, -0.2)], M.steel, { depth: S * 0.1 }); }
    // armadilha (manivela) atrás da coronha
    const ck = at(-2.0, -0.4), cr = (x.crank || 0) * D2R;
    K.dot(ctx, ck[0], ck[1], 0.55, M.steel.base);
    K.line(ctx, [ck, [ck[0] + Math.cos(cr) * 1.6, ck[1] + Math.sin(cr) * 1.6]], 0.26, M.steel.light);
    x._tip = at(11.6, -0.6);
  }
  function arm(ctx, W, side, back) {
    const U = W['uarm' + side], F = W['farm' + side], Hd = W['hand' + side];
    K.limb(ctx, [U.x, U.y], [F.x, F.y], [F.ex, F.ey], 1.15, 0.95, 0.75, back ? K.dim(M.gambeson, BACK) : M.gambeson, { depth: S * 0.45 });
    ctx.save(); A.boneT(ctx, Hd, S);
    K.blob(ctx, [[-0.3, -0.75], [1.0, -0.75], [1.5, -0.1], [1.1, 0.65], [-0.3, 0.55]], back ? K.dim(M.leather, BACK) : M.leather, { depth: S * 0.25 });
    ctx.restore();
  }
  function leg(ctx, W, side, back) {
    const T = W['thigh' + side], N = W['shin' + side], F = W['foot' + side];
    K.limb(ctx, [T.x, T.y], [N.x, N.y], [N.ex, N.ey], 1.35, 1.0, 0.75, back ? K.dim(M.hose, BACK) : M.hose, { depth: S * 0.5 });
    ctx.save(); A.boneT(ctx, F, S);
    K.blob(ctx, [[-0.9, -0.9], [1.3, -0.8], [2.7, -0.2], [2.7, 0.7], [-1.0, 0.75]], back ? K.dim(M.leather, BACK) : M.leather, { depth: S * 0.35 });
    ctx.restore();
  }
  // gibão acolchoado (pespontos em losango), cinto com aljava; pavês estreito às costas
  function torso(ctx, W, x) {
    const P = W.pelvis, Sp = W.spine, C = W.chest;
    // pavês às costas
    const [bx, by] = K.along(C, 0.4), [cnx, cny] = K.perp(C);
    const pv = K.polyPath([[bx - cnx * 2.4 - 1.6, by - 5.2], [bx - cnx * 2.4 + 0.4, by - 5.6], [bx - cnx * 2.4 + 0.8, by + 7.4], [bx - cnx * 2.4 - 1.4, by + 7.6]]);
    K.paint(ctx, pv, M.paint, { depth: S * 0.5, hlw: S * 0.25 });
    K.line(ctx, [[bx - cnx * 2.4 - 0.5, by - 4.8], [bx - cnx * 2.4 - 0.3, by + 7.0]], 0.3, A.rgba('#d8b060', 0.6));
    const path = H.torsoPath(W, [['pelvis', 0.3, 3.0, 2.8], ['spine', 0.1, 2.7, 2.6], ['spine', 0.7, 2.9, 2.7], ['chest', 0.5, 3.1, 2.9], ['chest', 1, 2.4, 2.6]], S);
    K.paint(ctx, path, M.gambeson, { depth: S * 0.9, hlw: S * 0.4 });
    ctx.save(); ctx.clip(path);
    for (let i = -4; i <= 4; i++) { K.line(ctx, [[P.x + i * 1.4 - 4, P.y + 3], [P.x + i * 1.4 + 6, P.y - 10]], 0.12, A.rgba(M.gambeson.deep, 0.5)); K.line(ctx, [[P.x + i * 1.4 + 4, P.y + 3], [P.x + i * 1.4 - 6, P.y - 10]], 0.12, A.rgba(M.gambeson.deep, 0.5)); }
    ctx.restore();
    // cinto e aljava com virotões
    const [wx, wy] = K.along(Sp, 0.05), [snx, sny] = K.perp(Sp);
    K.line(ctx, [[wx - snx * 2.8, wy - sny * 2.8], [wx + snx * 3.0, wy + sny * 3.0]], 0.5, '#1c1410');
    const q0 = [wx - snx * 1.6, wy - sny * 1.6 + 0.4];
    K.poly(ctx, [[q0[0] - 1.0, q0[1] - 0.6], [q0[0] + 0.6, q0[1] - 0.8], [q0[0] + 0.2, q0[1] + 4.6], [q0[0] - 1.3, q0[1] + 4.4]], M.leather, { depth: S * 0.3 });
    for (let i = 0; i < 3; i++) { K.line(ctx, [[q0[0] - 0.7 + i * 0.4, q0[1] - 0.6], [q0[0] - 0.9 + i * 0.4, q0[1] - 2.0]], 0.16, '#6a5038'); K.dot(ctx, q0[0] - 0.9 + i * 0.4, q0[1] - 2.1, 0.2, '#c8c0b0'); }
  }
  // cabeça: chapéu de ferro de abas largas (sombra sobre a cara), cara magra, olho de brasa
  function head(ctx, W, x) {
    const Hd = W.head;
    ctx.save(); A.boneT(ctx, W.neck, S);
    K.tube(ctx, [[-0.2, 0], [W.neck.len + 0.4, 0]], [0.95, 0.8], M.skin, { depth: S * 0.3, flat: true });
    ctx.restore();
    ctx.save(); A.boneT(ctx, Hd, S); ctx.rotate(Math.PI / 2);
    const face = K.blob(ctx, [[-1.6, -0.4], [-1.6, -2.3], [0.2, -2.8], [1.8, -2.5], [2.1, -1.6], [2.5, -0.9], [2.0, -0.6], [2.1, 0.3], [1.5, 1.3], [0.3, 1.5], [-0.8, 0.9]], M.skin, { depth: S * 0.55, hlw: S * 0.3, light: [0.6, -1] });
    ctx.save(); ctx.clip(face); const sh = ctx.createLinearGradient(0, -2.8 * S, 0, -0.2 * S); sh.addColorStop(0, 'rgba(8,6,10,0.8)'); sh.addColorStop(1, 'rgba(8,6,10,0)'); ctx.fillStyle = sh; ctx.fillRect(-2 * S, -3 * S, 5 * S, 3 * S); ctx.restore();
    const eo = K.blobPath([[1.0, -1.75], [1.85, -1.8], [1.9, -1.25], [1.15, -1.15]]); ctx.fillStyle = '#0c090c'; ctx.fill(eo);
    K.ember(ctx, 1.45, -1.5, 0.26, x.eye === undefined ? 1 : x.eye);
    K.line(ctx, [[1.2, 0.7], [2.0, 0.55]], 0.2, '#2a1c20');
    // chapéu de ferro (kettle hat)
    const crown = A.path((q) => { q.M(-1.8, -2.5); q.Q(-1.9, -4.9, 0.2, -5.1); q.Q(2.2, -4.9, 2.1, -2.5); q.Z(); }, S);
    const brim = A.path((q) => { q.M(-3.7, -1.6); q.Q(-2.4, -2.7, 0.2, -2.7); q.Q(2.8, -2.7, 4.2, -1.5); q.Q(2.6, -2.1, 0.2, -2.1); q.Q(-2.2, -2.1, -3.7, -1.6); q.Z(); }, S);
    K.paint(ctx, crown, M.steel, { depth: S * 0.5, hlw: S * 0.3, light: [0.6, -1] });
    K.paint(ctx, brim, M.steel, { depth: S * 0.3, hlw: S * 0.2, light: [0.6, -1] });
    K.line(ctx, [[0.2, -5.0], [0.2, -2.6]], 0.16, A.rgba(M.steel.light, 0.5));
    ctx.restore();
  }
  function draw(ctx, W, x) {
    arm(ctx, W, 'B', true);
    leg(ctx, W, 'B', true);
    torso(ctx, W, x);
    leg(ctx, W, 'F', false);
    head(ctx, W, x);
    crossbow(ctx, x);
    arm(ctx, W, 'F', false);
  }
  function points(W, x) {
    const Hh = W.head, ca = Math.cos(Hh.a * D2R), sa = Math.sin(Hh.a * D2R);
    return { tip: x._tip, eye: [Hh.x + ca * 1.5 - sa * 1.45, Hh.y + sa * 1.5 + ca * 1.45] };
  }

  const STANCE = { pelvis: 0, spine: 4, chest: 2, neck: 0, head: -2 };
  const P = (a, x, root) => A.pose(A.addA(STANCE, a || {}), x, root || [0, -12.8]);
  const rest = (o = {}) => Object.assign({ fF: [2.8, 0], fB: [-2.8, 0], cb: [-0.4, 5.6], ca: -24, drawn: 1, sway: 0 }, o);
  const aim = (o = {}) => Object.assign({ fF: [3.6, 0], fB: [-3.8, 0], cb: [-1.4, 1.4], ca: 0, drawn: 1 }, o);
  function anims() {
    const R = {};
    R.idle = { n: 6, fps: 6, loop: true, keys: [[0, P({}, rest())], [0.5, P({ spine: 1, chest: 1 }, rest({ cb: [-0.4, 5.8] }), [0, -12.65])], [1, P({}, rest())]] };
    R.move = { n: 8, fps: 10, loop: true, stride: 12, poseFn: (t) => { const f = A.stepFeet(t, { stride: 3.2, lift: 1.6 }); const s = Math.sin(t * A.TAU); return P({ spine: 6, head: -s }, rest({ fF: f.F, fB: f.B, faF: f.F[1] < 0 ? 12 : 0, faB: f.B[1] < 0 ? 12 : 0, cb: [-0.2, 5.4 + s * 0.3], ca: -26 + s * 3 }), [0.3, -12.8 + Math.abs(s) * 0.4]); } };
    // disparo: ergue a besta à cara e aponta (brilho no virote), coice, depois rodar a manivela para armar
    const AW = P({ spine: -2, chest: -2, neck: -4, head: 4 }, aim());
    R.atk_shoot = {
      n: 10, fps: 10, phases: [4, 1],
      poseFn: (t, i) => [
        P({}, rest()), P({ spine: 0 }, aim({ cb: [-1.0, 3.6], ca: -12 })), AW, P({ spine: -3, chest: -3, neck: -4, head: 4 }, aim({ cb: [-1.5, 1.3] })),
        P({ spine: -10, chest: -8, neck: -6, head: 6 }, aim({ cb: [-2.6, 0.6], ca: -10, drawn: 0, bolt: false }), [-0.8, -12.8]),
        P({ spine: -4, chest: -2 }, aim({ cb: [-1.6, 1.8], ca: -6, drawn: 0, bolt: false })),
        P({ spine: 10, chest: 6 }, rest({ cb: [0.6, 4.2], ca: 70, drawn: 0.1, bolt: false, crank: 1 })),
        P({ spine: 10, chest: 6 }, rest({ cb: [0.6, 4.2], ca: 70, drawn: 0.4, bolt: false, crank: 120 })),
        P({ spine: 10, chest: 6 }, rest({ cb: [0.6, 4.2], ca: 70, drawn: 0.8, bolt: false, crank: 240 })),
        P({}, rest()),
      ][i],
    };
    R.hurt = { n: 3, fps: 14, keys: [[0, P({ spine: -14, chest: -10, neck: -6, head: 8 }, rest({ cb: [-1.4, 4.4], ca: -50, eye: 1.8 }), [-1, -13])], [1, P({}, rest())]] };
    R.stagger = { n: 4, fps: 7, loop: true, poseFn: (t) => { const s = Math.sin(t * A.TAU); return P({ spine: 18 + s * 2, chest: 10, neck: 14, head: 10 }, rest({ cb: [0.4, 8.4], ca: 60, eye: 0.4 }), [0.2, -12.0]); } };
    R.death = { n: 7, fps: 10, keys: [[0, P({ spine: -16, chest: -10, neck: -8 }, rest({ cb: [-1, 4], ca: -60, eye: 1.6 }), [-1, -13])], [0.45, P({ spine: 30, chest: 14, neck: 16 }, rest({ cb: [1, 8], ca: 50, fF: [3.4, 0], fB: [-1.6, 0], eye: 0.5 }), [0.8, -8.4])], [1, P({ spine: 82, chest: 6, neck: 8 }, rest({ cb: [3, 5], ca: 10, fF: [3.6, 0], fB: [-1.8, 0], eye: 0 }), [1.2, -5.0])]] };
    return R;
  }
  A.register('en_crossbow', () => A.creature({ name: 'en_crossbow', S, box: [50, 48], anchor: [22, 44], rig, solve, draw, points, anims: anims(), post: K.post('#a8b0c8', 0.32, 0.04) }));
  (A.previewCell = A.previewCell || {}).en_crossbow = [46, 44];
})(window.ART);
