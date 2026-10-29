// Vesperal — Corvin, o Menestrel (chefe da Torre): bardo da corte alto e desengonçado, de membros compridos,
// gibão cor de ameixa desbotada com losangos de ouro baço, mangas tufadas e golpeadas, gola de folhos, fraque
// esfarrapado, meias às riscas e sapatos bicudos com guizos. Máscara de porcelana sorridente e rachada (um olho
// de âmbar espreita pela racha), chapéu largo com uma pluma vermelha comprida. Toca um alaúde — e usa-o como
// maça. Tudo o que faz vai no compasso (120 BPM); golpes dados no tempo ferem-no mais. Exportado a ×1.75.
// → assets/sprites/en_b_corvin.png
'use strict';
(function (A) {
  const S = 5, K = A.kit(S), D2R = A.D2R;
  const H = A.humanoid({ pelvis: 2.6, spine: 5.6, chest: 6.2, neck: 2.4, head: 4.0, thigh: 9.0, shin: 8.6, foot: 3.6, uarm: 7.4, farm: 7.2, hand: 2.6, shoulder: 0.62 });
  const rig = H.rig;
  const M = {
    plum: A.mat('#5a2a4e', { shadow: '#30142a', light: '#86507a', deep: '#12060e' }),
    plumD: A.mat('#3a1c36', { shadow: '#1e0e1c', light: '#5e3858' }),
    gold: A.mat('#a8863e', { shadow: '#5e481c', light: '#e0c070', deep: '#221a08' }),
    ruff: A.mat('#d8d0c0', { shadow: '#948a78', light: '#f6f0e4' }),
    mask: A.mat('#e6e0d4', { shadow: '#a8a090', light: '#ffffff', deep: '#3a3630' }),
    hat: A.mat('#2a1a2c', { shadow: '#140c16', light: '#4e3650' }),
    plume: A.mat('#b0283a', { shadow: '#5e1018', light: '#e05060' }),
    hoseA: A.mat('#4a2440', { shadow: '#26101e', light: '#6e4062' }), hoseB: A.mat('#1a1418', { shadow: '#0c080a', light: '#342a30' }),
    shoe: A.mat('#2a1a20', { shadow: '#140a0e', light: '#4a3038' }),
    wood: A.mat('#8a5a2e', { shadow: '#4a2e14', light: '#c08850', deep: '#1e1006' }),
    woodD: A.mat('#4a2a14', { shadow: '#26140a', light: '#704424' }),
    skin: A.mat('#c8b8b0', { shadow: '#867670', light: '#ece0d8' }),
  };
  const BACK = 0.62, NECK = 10.8;
  function solve(pose) {
    const x = pose.extra, r = pose.root;
    if (x.fF) H.leg(pose, 'F', [r[0] + x.fF[0], x.fF[1] - 1.0], x.faF || 0);
    if (x.fB) H.leg(pose, 'B', [r[0] + x.fB[0], x.fB[1] - 1.0], x.faB || 0);
    const W = rig.solve(pose);
    const hf = [W.uarmF.x + x.hF[0], W.uarmF.y + x.hF[1]], la = x.la, d = [Math.cos(la * D2R), Math.sin(la * D2R)], n = [-d[1], d[0]];
    H.arm(pose, 'F', hf, la + (x.club ? 90 : -20), 1);
    let c, hb;
    if (x.club) { c = [hf[0] + d[0] * (NECK - 1), hf[1] + d[1] * (NECK - 1)]; hb = [hf[0] - d[0] * 2.4, hf[1] - d[1] * 2.4]; }
    else { c = [hf[0] - d[0] * NECK, hf[1] - d[1] * NECK]; const st = x.strum || 0; hb = [c[0] + d[0] * 3.4 + n[0] * (st * 2.4 - 1.0), c[1] + d[1] * 3.4 + n[1] * (st * 2.4 - 1.0)]; }
    if (x.hB) hb = [W.uarmB.x + x.hB[0], W.uarmB.y + x.hB[1]];
    H.arm(pose, 'B', hb, x.haB === undefined ? la + 90 : x.haB, 1);
    x._lc = c; x._ld = d; x._hf = hf;
  }
  const pt = (B, t, w) => { const [x, y] = K.along(B, t), [nx, ny] = K.perp(B); return [x + nx * w, y + ny * w]; };

  // alaúde: caixa em pera com roseta, braço com trastes, cravelhal dobrado para trás
  function lute(ctx, x) {
    const c = x._lc, d = x.club ? [-x._ld[0], -x._ld[1]] : x._ld, n = [-d[1], d[0]];
    const at = (t, w = 0) => [c[0] + d[0] * t + n[0] * w, c[1] + d[1] * t + n[1] * w];
    const body = K.blobPath([at(-5.4, 0), at(-4.8, -3.0), at(-2.6, -4.6), at(0.6, -4.4), at(3.0, -3.0), at(4.4, -1.4), at(4.8, 0), at(4.4, 1.4), at(3.0, 3.0), at(0.6, 4.4), at(-2.6, 4.6), at(-4.8, 3.0)]);
    K.paint(ctx, body, M.wood, { depth: S * 0.7, hlw: S * 0.35 });
    ctx.save(); ctx.clip(body); for (let i = -3; i <= 3; i++) K.line(ctx, [at(-6, i * 1.3), at(5, i * 1.1)], 0.14, A.rgba(M.wood.deep, 0.5)); ctx.restore();
    const rs = at(0.6, 0); ctx.fillStyle = '#1a0c04'; ctx.beginPath(); ctx.arc(rs[0] * S, rs[1] * S, 1.3 * S, 0, A.TAU); ctx.fill();
    ctx.lineWidth = S * 0.2; ctx.strokeStyle = M.gold.base; ctx.stroke();
    K.poly(ctx, [at(-3.8, -1.2), at(-3.2, -1.2), at(-3.2, 1.2), at(-3.8, 1.2)], M.woodD, { depth: S * 0.1 }); // cavalete
    K.tube(ctx, [at(4.2), at(NECK + 0.6)], [0.75, 0.6], M.woodD, { depth: S * 0.2, flat: true });
    for (let i = 0; i < 6; i++) K.line(ctx, [at(5 + i * 1.4, -0.7), at(5 + i * 1.4, 0.7)], 0.1, M.gold.light);
    // cravelhal dobrado e cravelhas
    const pb0 = at(NECK + 0.4), pb1 = [pb0[0] + d[0] * 2.4 - n[0] * 1.8, pb0[1] + d[1] * 2.4 - n[1] * 1.8];
    K.tube(ctx, [pb0, pb1], [0.7, 0.55], M.woodD, { depth: S * 0.15 });
    for (let i = 0; i < 3; i++) { const q = [A.lerp(pb0[0], pb1[0], 0.3 + i * 0.3), A.lerp(pb0[1], pb1[1], 0.3 + i * 0.3)]; K.dot(ctx, q[0] + n[0] * 0.9, q[1] + n[1] * 0.9, 0.35, M.gold.base); }
    for (let i = -1; i <= 1; i++) K.line(ctx, [at(-3.6, i * 0.4), at(NECK + 0.4, i * 0.2)], 0.06, A.rgba('#f0e8d0', 0.6)); // cordas
    x._lute = at(0, 0); x._lend = at(NECK + 1.6, 0);
  }
  function arm(ctx, W, side, back) {
    const U = W['uarm' + side], F = W['farm' + side], Hd = W['hand' + side];
    const dm = (m) => (back ? K.dim(m, BACK) : m);
    K.limb(ctx, [U.x, U.y], [F.x, F.y], [F.ex, F.ey], 1.4, 1.2, 1.0, dm(M.plumD), { depth: S * 0.4 });
    // manga tufada e golpeada (mostra o forro dourado)
    const pf = K.blob(ctx, [pt(U, -0.05, 2.6), pt(U, 0.3, 3.2), pt(U, 0.6, 2.4), pt(U, 0.62, -2.4), pt(U, 0.3, -3.2), pt(U, -0.05, -2.6)], dm(M.plum), { depth: S * 0.5, hlw: S * 0.3 });
    ctx.save(); ctx.clip(pf); for (const w of [-1.4, 0.2, 1.8]) K.line(ctx, [pt(U, 0.0, w), pt(U, 0.6, w * 0.8)], 0.5, dm(M.gold).base); ctx.restore();
    // punho de folhos
    const cf = K.along(F, 0.92); K.dot(ctx, cf[0], cf[1], 1.3, dm(M.ruff).base);
    ctx.save(); A.boneT(ctx, Hd, S); // mão de dedos compridos
    K.blob(ctx, [[-0.6, -1.0], [1.6, -1.0], [2.4, -0.2], [1.6, 0.9], [-0.6, 0.8]], dm(M.skin), { depth: S * 0.25 });
    for (let i = 0; i < 3; i++) K.line(ctx, [[1.6, -0.6 + i * 0.6], [3.4, -0.4 + i * 0.7]], 0.22, dm(M.skin).shadow);
    ctx.restore();
  }
  function leg(ctx, W, side, back) {
    const T = W['thigh' + side], N = W['shin' + side], F = W['foot' + side];
    const dm = (m) => (back ? K.dim(m, BACK) : m);
    const lg = K.limb(ctx, [T.x, T.y], [N.x, N.y], [N.ex, N.ey], 1.8, 1.3, 1.0, dm(M.hoseA), { depth: S * 0.4 });
    ctx.save(); ctx.clip(lg); // meias às riscas
    const d = K.norm(N.ex - T.x, N.ey - T.y); for (let i = 0; i < 12; i += 2) { const a = [T.x + (N.ex - T.x) * i / 12, T.y + (N.ey - T.y) * i / 12]; K.line(ctx, [[a[0] - d[1] * 3, a[1] + d[0] * 3 + 0.3], [a[0] + d[1] * 3, a[1] - d[0] * 3 + 0.3]], 0.7, dm(M.hoseB).base); }
    ctx.restore();
    ctx.save(); A.boneT(ctx, F, S); // sapato bicudo com guizo
    K.blob(ctx, [[-1.4, -1.2], [1.6, -1.0], [4.4, -0.2], [6.2, -1.6], [5.6, 0.4], [4.0, 1.0], [-1.4, 1.0]], dm(M.shoe), { depth: S * 0.3 });
    K.dot(ctx, 6.3, -1.7, 0.55, dm(M.gold).base); K.dot(ctx, 6.2, -1.9, 0.2, dm(M.gold).light);
    ctx.restore();
  }
  function torso(ctx, W, x) {
    const Sp = W.spine, C = W.chest, Pv = W.pelvis, sw = x.sway || 0;
    const [px, py] = K.along(Pv, 0.15), [snx, sny] = K.perp(Sp);
    // abas do fraque esfarrapado (atrás)
    const tail = A.path((q) => { const a = [px - snx * 3.0, py - sny * 3.0 - 1]; q.M(a[0], a[1]); q.Q(a[0] - 2.4 + sw * 0.6, a[1] + 6, a[0] - 3.6 + sw * 1.4, a[1] + 12.4); q.L(a[0] - 2.0 + sw * 1.2, a[1] + 10.6); q.L(a[0] - 1.0 + sw, a[1] + 12.8); q.L(a[0] + 0.6 + sw * 0.8, a[1] + 10.4); q.Q(a[0] + 2.0, a[1] + 5, a[0] + 3.2, a[1] - 0.4); q.Z(); }, S);
    K.paint(ctx, tail, M.plumD, { depth: S * 0.7, hlw: S * 0.3 });
    const body = H.torsoPath(W, [['pelvis', 0.1, 3.4, 3.6], ['spine', 0.4, 2.8, 3.0], ['spine', 0.9, 3.2, 3.6], ['chest', 0.5, 3.8, 4.2], ['chest', 0.9, 3.6, 3.8], ['chest', 1.06, 2.0, 2.2]], S);
    K.paint(ctx, body, M.plum, { depth: S * 0.9, hlw: S * 0.4 });
    ctx.save(); ctx.clip(body);
    // losangos de arlequim em ouro baço
    for (let i = -2; i <= 3; i++) for (let j = -1; j <= 1; j++) { if ((i + j) & 1) continue; const c = pt(Sp, 0.25 + i * 0.32, j * 2.6); K.poly(ctx, [[c[0], c[1] - 1.3], [c[0] + 1.3, c[1]], [c[0], c[1] + 1.3], [c[0] - 1.3, c[1]]], { base: A.mix(M.gold.base, M.plum.base, 0.35), shadow: M.gold.shadow, light: M.gold.light, deep: M.gold.deep }, { depth: S * 0.05, inkW: K.IW * 0.4 }); }
    ctx.restore();
    // cinto e bolsa
    const bl = pt(Sp, 0.0, -3.4), br = pt(Sp, 0.0, 3.8); K.line(ctx, [bl, br], 0.8, '#1a0e14');
    K.dot(ctx, br[0] - 0.8, br[1], 0.5, M.gold.base);
  }
  // cabeça: gola de folhos, máscara sorridente rachada, chapéu largo com pluma
  function head(ctx, W, x) {
    const Hd = W.head, C = W.chest, sw = x.sway || 0;
    // gola de folhos
    const nc = K.along(C, 1.02), ru = []; for (let i = 0; i < 14; i++) { const a = i / 14 * A.TAU, r = i % 2 ? 2.4 : 3.0; ru.push([nc[0] + Math.cos(a) * r, nc[1] + Math.sin(a) * r * 0.6]); }
    K.blob(ctx, ru, M.ruff, { depth: S * 0.4, hlw: S * 0.2 });
    ctx.save(); A.boneT(ctx, Hd, S); ctx.rotate(Math.PI / 2);
    K.blob(ctx, [[-2.4, 0.6], [-2.8, -2.4], [-1.6, -4.4], [0.6, -4.8], [2.2, -3.8], [2.6, -1.6], [2.2, 0.8], [0.4, 1.6]], M.hat, { depth: S * 0.4 }); // cabelo/capuz escuro
    const mk = K.blob(ctx, [[0.0, -4.2], [2.0, -4.0], [3.0, -2.6], [3.4, -1.0], [3.0, 0.8], [1.8, 1.8], [0.2, 1.4], [-0.4, -1.4]], M.mask, { depth: S * 0.5, hlw: S * 0.3, light: [0.6, -1] });
    ctx.save(); ctx.clip(mk);
    K.line(ctx, [[1.0, -4.4], [1.6, -2.6], [1.2, -1.4], [1.8, 0.2]], 0.16, A.rgba(M.mask.deep, 0.8)); // racha
    ctx.restore();
    // olhos: um pintado, outro de âmbar na racha; sorriso pintado
    K.line(ctx, [[2.2, -2.6], [2.9, -2.9], [3.2, -2.4]], 0.24, '#1a1018');
    K.ember(ctx, 1.6, -2.4, 0.34, x.eye === undefined ? 1 : x.eye, '#ffd070');
    K.line(ctx, [[1.4, 0.0], [2.2, 0.6], [3.0, 0.2], [3.2, -0.4]], 0.26, '#1a1018');
    K.dot(ctx, 3.0, -1.0, 0.5, A.rgba('#c04060', 0.6)); // rubor pintado
    // chapéu de abas largas e pluma
    K.blob(ctx, [[-4.6, -3.8], [-1.0, -5.0], [3.2, -4.8], [5.6, -4.2], [5.0, -3.6], [1.6, -3.8], [-2.4, -3.0]], M.hat, { depth: S * 0.3, hlw: S * 0.2 });
    K.blob(ctx, [[-2.2, -4.4], [-1.8, -7.4], [0.6, -8.2], [2.4, -7.2], [2.2, -4.6]], M.hat, { depth: S * 0.4 });
    K.line(ctx, [[-2.0, -5.0], [2.3, -5.2]], 0.5, M.gold.base);
    const pl = [[-1.6, -6.6], [-5.4, -9.0 + sw * 0.3], [-9.0 + sw, -7.4 + sw * 0.6], [-11.0 + sw * 1.4, -4.2 + sw]];
    K.tube(ctx, pl, [0.9, 1.3, 0.9, 0.2], M.plume, { depth: S * 0.3, hlw: S * 0.2 });
    for (let i = 1; i < 8; i++) { const k = i / 8, a = pl[Math.min(2, Math.floor(k * 3))], b = pl[Math.min(3, Math.floor(k * 3) + 1)], u = k * 3 - Math.floor(k * 3); const q = [A.lerp(a[0], b[0], u), A.lerp(a[1], b[1], u)]; K.line(ctx, [q, [q[0] - 0.8, q[1] + 1.4]], 0.14, M.plume.shadow); }
    ctx.restore();
  }
  function draw(ctx, W, x) {
    arm(ctx, W, 'B', true);
    leg(ctx, W, 'B', true);
    torso(ctx, W, x);
    leg(ctx, W, 'F', false);
    head(ctx, W, x);
    lute(ctx, x);
    arm(ctx, W, 'F', false);
  }
  function points(W, x) {
    const Hh = W.head, ca = Math.cos(Hh.a * D2R), sa = Math.sin(Hh.a * D2R);
    return { tip: x.club ? x._lute : x._lend, grip: x._hf, lute: x._lute, eye: [Hh.x + ca * 1.6 - sa * 2.4, Hh.y + sa * 1.6 + ca * 2.4], light: x._lute };
  }

  const STANCE = { pelvis: 0, spine: 0, chest: -2, neck: 6, head: -6 };
  const RY = -17.2;
  const P = (a, x, root) => A.pose(A.addA(STANCE, a || {}), x, root || [0, RY]);
  const base = (o = {}) => Object.assign({ fF: [3.6, 0], fB: [-3.4, 0], hF: [12.0, 1.6], la: -26, strum: 0, sway: 0, eye: 1 }, o);
  function anims() {
    const R = {};
    // TOCAR: um tempo — o braço de trás desce pelas cordas no início e volta; o corpo marca o compasso
    R.play = { n: 6, fps: 12, loop: true, poseFn: (t, i) => { const k = i / 6, s = Math.cos(k * A.TAU); return P({ spine: -1 + s * 2, chest: s * 2, neck: -s * 3, head: s * 4 }, base({ strum: k < 0.34 ? 1 - k * 3 : (k - 0.34) * 1.5, sway: s, hF: [12.0, 1.6 + s * 0.4] }), [0, RY + (1 - Math.abs(s)) * 0.6 - 0.6 + s * 0.6]); } };
    R.idle = R.play;
    // passos de dança, saltitantes
    R.move = { n: 8, fps: 10, loop: true, stride: 16, poseFn: (t) => { const f = A.stepFeet(t, { stride: 4.4, lift: 3.0 }); const s = Math.sin(t * A.TAU * 2); return P({ spine: 4, chest: -2 + s * 2, head: -s * 3 }, base({ fF: f.F, fB: f.B, faF: f.F[1] < 0 ? -16 : 0, faB: f.B[1] < 0 ? -16 : 0, strum: (s + 1) / 2, sway: -1 }), [0.6, RY + Math.abs(s) * 1.0]); } };
    // GOLPE DE ALAÚDE (branco): agarra o alaúde pelo braço, ergue-o e desce-o como uma maça, a avançar
    const ST_W = P({ spine: -8, chest: -10, head: -8 }, base({ club: 1, hF: [-1.0, -10.4], la: -120, fF: [5.0, 0], fB: [-4.4, 0], eye: 1.6, sway: 0.6 }), [-1.0, RY + 0.6]);
    const ST_A = P({ spine: 16, chest: 10, neck: 4 }, base({ club: 1, hF: [10.6, 4.0], la: 20, fF: [7.6, 0], fB: [-5.0, 0], faB: 20, eye: 1.8, sway: -1 }), [2.6, RY + 2.4]);
    R.atk_strike = { n: 8, fps: 12, phases: [3, 2], keys: [[0, P({}, base())], [0.3, ST_W], [0.4, ST_W], [0.52, ST_A], [0.72, ST_A], [1, P({}, base())]] };
    // ONDA: bate o calcanhar no chão (guizos) — sai uma onda rasteira
    R.heel = { n: 5, fps: 14, poseFn: (t, i) => { const k = [0, 0.6, 1, 0.6, 0][i]; return P({ spine: -4 * k, chest: -4 * k, head: -8 * k }, base({ fF: [4.4 + k * 1.6, -3.4 * k * (i < 2 ? 1 : 0)], faF: -30 * k, strum: k, sway: k }), [0, RY + k * 1.0]); } };
    // CHUVA DE NOTAS: ergue o alaúde para o céu
    R.flourish = { n: 5, fps: 12, poseFn: (t, i) => { const k = [0.5, 1, 1, 0.8, 0.3][i]; return P({ spine: -10 * k, chest: -12 * k, neck: -6 * k, head: -20 * k }, base({ hF: [10.0, -1.6 - k * 7], la: -26 - k * 40, strum: 1 - k, sway: k }), [-0.4 * k, RY]); } };
    // VÉNIA: curva-se antes de desaparecer
    R.bow = { n: 5, fps: 12, poseFn: (t, i) => { const k = [0.4, 1, 1, 0.6, 0][i]; return P({ spine: 30 * k, chest: 14 * k, neck: 10 * k, head: 10 * k }, base({ fF: [3.6 + k * 2, 0], fB: [-3.4 - k * 2, 0], hF: [12.0, 1.6 + k * 5], la: -26 + k * 20, hB: [-4 * k + 2, 6 + 2 * k], haB: 120, sway: -1.4 * k }), [-0.6 * k, RY + 1.4 * k]); } };
    R.hurt = { n: 3, fps: 12, keys: [[0, P({ spine: -10, chest: -8, neck: -4, head: -14 }, base({ hF: [6.0, 0], la: -50, eye: 1.8, sway: 1 }), [-1.0, RY])], [1, P({}, base())]] };
    R.stagger = { n: 6, fps: 6, loop: true, poseFn: (t) => { const s = Math.sin(t * A.TAU); return P({ spine: 12 + s * 6, chest: 8, neck: 10, head: 14 + s * 10 }, base({ hF: [7.0, 4.0], la: 60, strum: 0, eye: 0.4, sway: s, fF: [4.4 + s, 0], fB: [-3.6, 0] }), [s * 1.2, RY + 2.4]); } };
    R.death = { n: 10, fps: 7, keys: [[0, P({ spine: -12, chest: -12, head: -18 }, base({ hF: [5, -3], la: -60, eye: 2 }), [-1, RY])], [0.4, P({ spine: 30, chest: 14, neck: 10, head: 10 }, base({ hF: [8, 6], la: 30, fF: [5.0, -0.2], fB: [-3.0, 0], faB: 60, eye: 1 }), [0.6, RY + 7.0])], [1, P({ spine: 76, chest: 12, neck: 6, head: -4 }, base({ hF: [10, 6], la: 0, fF: [6.0, 0], fB: [-2.0, 0], faB: 70, eye: 0 }), [2.4, RY + 12.6])]] };
    return R;
  }
  A.register('en_b_corvin', () => A.creature({ name: 'en_b_corvin', S, unit: 1.75, box: [110, 100], anchor: [52, 90], rig, solve, draw, points, anims: anims(), post: K.post('#e8c8e0', 0.3, 0.04) }));
  (A.previewCell = A.previewCell || {}).en_b_corvin = [120, 130];
})(window.ART);
