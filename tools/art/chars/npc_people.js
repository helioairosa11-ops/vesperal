// Vesperal — as pessoas que ainda respiram: Ione (a guardiã cega da Última Chama), Hrolf (aprendiz da ferreira),
// Maren (peregrina e mercadora) e Teodoro (o acólito que carregou o cálice). Mesmo esqueleto e traço do
// protagonista. Cada um tem: parado (respiração), a falar (gesto), e caído (para as consequências).
// Também gera os retratos do diálogo (busto em alta resolução). → assets/sprites/npc_<id>.png, assets/portraits/<id>.png
'use strict';
(function (A) {
  const D2R = A.D2R;

  function make(S) {
    const K = A.kit(S), BACK = 0.62;
    const pt = (B, t, w) => { const [x, y] = K.along(B, t), [nx, ny] = K.perp(B); return [x + nx * w, y + ny * w]; };
    const P = (H, stance, a, x, root) => A.pose(A.addA(stance, a || {}), x, root);
    const ink = (c, p, w, col) => { c.save(); c.lineWidth = S * w; c.strokeStyle = col; c.lineCap = 'round'; c.stroke(p); c.restore(); };

    // ---------------------------------------------------------------- partes partilhadas
    function solveArms(H, pose) {
      const x = pose.extra, r = pose.root;
      if (x.fF) H.leg(pose, 'F', [r[0] + x.fF[0], x.fF[1] - 1.0], x.faF || 0);
      if (x.fB) H.leg(pose, 'B', [r[0] + x.fB[0], x.fB[1] - 1.0], x.faB || 0);
      const W = H.rig.solve(pose);
      if (x.hF) H.arm(pose, 'F', [W.uarmF.x + x.hF[0], W.uarmF.y + x.hF[1]], x.haF || 0, x.bF || 1);
      if (x.hB) H.arm(pose, 'B', [W.uarmB.x + x.hB[0], W.uarmB.y + x.hB[1]], x.haB || 0, x.bB || 1);
    }
    function sleeveArm(c, W, side, back, m, skin, w0 = 1.2, w1 = 1.0, w2 = 0.85, bare = 0) {
      const U = W['uarm' + side], F = W['farm' + side], Hd = W['hand' + side];
      const dm = (q) => (back ? K.dim(q, BACK) : q);
      if (bare > 0) {
        // manga arregaçada: braço nu do cotovelo à mão
        K.limb(c, [U.x, U.y], [F.x, F.y], [F.ex, F.ey], w0, w1, w2, dm(skin), { depth: S * 0.4 });
        K.tube(c, [K.along(U, -0.05), K.along(U, 1.02)], [w0 + 0.25, w1 + 0.3], dm(m), { depth: S * 0.4, flat: true });
        K.line(c, [pt(U, 1.0, w1 + 0.3), pt(U, 1.0, -w1 - 0.3)], 0.35, dm(m).shadow);
      } else K.limb(c, [U.x, U.y], [F.x, F.y], [F.ex, F.ey], w0, w1, w2, dm(m), { depth: S * 0.45 });
      c.save(); A.boneT(c, Hd, S);
      K.blob(c, [[-0.3, -0.7], [1.0, -0.75], [1.6, -0.1], [1.2, 0.6], [-0.3, 0.6]], dm(skin), { depth: S * 0.25 });
      c.restore();
    }
    function bootLeg(c, W, side, back, mt, mb) {
      const T = W['thigh' + side], N = W['shin' + side], F = W['foot' + side];
      const dm = (q) => (back ? K.dim(q, BACK) : q);
      K.limb(c, [T.x, T.y], [N.x, N.y], [N.ex, N.ey], 1.5, 1.15, 0.95, dm(mt), { depth: S * 0.45 });
      const p1 = [N.x, N.y], p2 = [N.ex, N.ey], dd = K.norm(p2[0] - p1[0], p2[1] - p1[1]), nn = [-dd[1], dd[0]], L = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]);
      const at = (t, w) => [p1[0] + dd[0] * L * t + nn[0] * w, p1[1] + dd[1] * L * t + nn[1] * w];
      K.poly(c, [at(0.45, 1.3), at(1.04, 1.1), at(1.04, -1.1), at(0.45, -1.3)], dm(mb), { depth: S * 0.3 });
      c.save(); A.boneT(c, F, S);
      K.blob(c, [[-0.9, -0.9], [1.2, -0.8], [2.7, -0.2], [2.7, 0.7], [-1.0, 0.7]], dm(mb), { depth: S * 0.35 });
      K.line(c, [[-1.0, 0.68], [2.7, 0.66]], 0.3, '#0e0a09');
      c.restore();
    }
    // cabeça de perfil (olha para +x): rosto, cabelo e extras por cima; devolve o caminho do rosto
    function face(c, W, m, pts, scale = 1) {
      const Hd = W.head; c.save(); A.boneT(c, Hd, S); c.rotate(Math.PI / 2); c.scale(scale, scale);
      const f = K.blob(c, pts, m, { depth: S * 0.5, hlw: S * 0.28, light: [0.6, -1] });
      return f; // o chamador faz c.restore()
    }
    // olho de perfil (a olhar para +x): branco, íris, pálpebra superior marcada, pestanas e um brilho
    function eyeP(c, x, y, o = {}) {
      const w = o.w || 0.62, h = o.h || 0.34, iris = o.iris || '#2a1c16', look = o.look || 0;
      const al = A.path((q) => { q.M(x - w * 0.55, y + 0.02); q.Q(x, y - h * 1.15, x + w * 0.55, y - 0.04); q.Q(x + w * 0.1, y + h * 0.75, x - w * 0.55, y + 0.02); q.Z(); }, S);
      c.fillStyle = o.white || '#efe6da'; c.fill(al);
      c.save(); c.clip(al);
      c.fillStyle = iris; c.beginPath(); c.arc((x + w * 0.18 + look * 0.08) * S, (y - h * 0.05) * S, h * 0.78 * S, 0, A.TAU); c.fill();
      c.fillStyle = '#0a0606'; c.beginPath(); c.arc((x + w * 0.22 + look * 0.08) * S, (y - h * 0.05) * S, h * 0.36 * S, 0, A.TAU); c.fill();
      c.fillStyle = 'rgba(0,0,0,0.35)'; c.fillRect((x - w) * S, (y - h * 1.2) * S, w * 2 * S, h * 0.6 * S);
      c.restore();
      K.dot(c, x + w * 0.3 + look * 0.08, y - h * 0.32, h * 0.2, 'rgba(255,255,255,0.9)');
      K.line(c, [[x - w * 0.6, y + 0.04], [x, y - h * 1.12], [x + w * 0.62, y - 0.06]], o.lid || 0.14, o.lidCol || '#1c1210');
      if (o.lash) K.line(c, [[x + w * 0.5, y - h * 0.4], [x + w * 0.85, y - h * 0.75]], 0.08, '#1c1210');
      if (o.bag) K.line(c, [[x - w * 0.3, y + h * 0.75], [x + w * 0.35, y + h * 0.7]], 0.08, A.rgba('#5a3a3a', 0.6));
    }
    function ear(c, x, y, m) {
      K.blob(c, [[x - 0.35, y - 0.7], [x + 0.25, y - 0.75], [x + 0.45, y - 0.1], [x + 0.2, y + 0.65], [x - 0.3, y + 0.55]], m, { depth: S * 0.15 });
      K.line(c, [[x - 0.05, y - 0.4], [x + 0.15, y], [x - 0.05, y + 0.35]], 0.08, m.shadow);
    }
    // sombra por baixo do maxilar e na face (dá volume ao perfil)
    function jawShade(c, f, x, y, r, a = 0.35) {
      c.save(); c.clip(f);
      const g = c.createRadialGradient(x * S, y * S, 0, x * S, y * S, r * S); g.addColorStop(0, A.rgba('#3a2018', a)); g.addColorStop(1, 'rgba(58,32,24,0)');
      c.fillStyle = g; c.fillRect((x - r) * S, (y - r) * S, r * 2 * S, r * 2 * S); c.restore();
    }
    // vela de cera (apagada ou acesa) na mão
    function candle(c, at, len, lit) {
      const [x, y] = at;
      K.poly(c, [[x - 0.45, y], [x + 0.45, y], [x + 0.45, y - len], [x - 0.45, y - len]], A.mat('#e8dec6', { shadow: '#a89a7e', light: '#fffaf0' }), { depth: S * 0.18 });
      K.line(c, [[x + 0.15, y - len + 0.4], [x + 0.2, y - len + 1.6]], 0.2, 'rgba(255,250,240,0.8)');
      K.line(c, [[x, y - len], [x, y - len - 0.5]], 0.14, '#1a1410');
      if (lit) {
        const g = c.createLinearGradient(0, (y - len - 0.4) * S, 0, (y - len - 2.6) * S); g.addColorStop(0, '#ff7a20'); g.addColorStop(0.5, '#ffc050'); g.addColorStop(1, '#fff4c8');
        const fl = A.path((q) => { q.M(x - 0.45, y - len - 0.4); q.Q(x - 0.6, y - len - 1.4, x + 0.05, y - len - 2.6); q.Q(x + 0.6, y - len - 1.4, x + 0.45, y - len - 0.4); q.Q(x, y - len, x - 0.45, y - len - 0.4); q.Z(); }, S);
        c.fillStyle = g; c.fill(fl);
      }
    }

    // ================================================================ IONE
    const ione = (() => {
      const H = A.humanoid({ spine: 5.0, chest: 4.4, neck: 1.3, head: 4.4, thigh: 6.6, shin: 6.4, foot: 2.5, uarm: 4.6, farm: 4.3, hand: 1.5 });
      const M = {
        dress: A.mat('#b4acb6', { shadow: '#6e6878', light: '#e6e0ea', deep: '#2a2632' }),
        shawl: A.mat('#3e3048', { shadow: '#1e1626', light: '#6a5478' }),
        skin: A.mat('#dccbb8', { shadow: '#9a8472', light: '#f6eadc', deep: '#3a2a20' }),
        hair: A.mat('#3a2a26', { shadow: '#1a1210', light: '#6a5048' }),
        band: A.mat('#e8e2d4', { shadow: '#a8a090', light: '#ffffff' }),
        brass: A.mat('#b08a48', { shadow: '#6a5024', light: '#f0d49a' }),
      };
      const solve = (pose) => solveArms(H, pose);
      function dress(c, W, x) {
        const Pv = W.pelvis, C = W.chest, sw = x.sway || 0;
        const [px, py] = K.along(Pv, 0.1);
        // saia longa até ao chão, um pouco rodada
        const sk = A.path((q) => { const a = pt(W.spine, 0.2, -2.6), b = pt(W.spine, 0.2, 2.8); q.M(a[0], a[1]); q.L(b[0], b[1]); q.Q(px + 4.6, py + 6, px + 5.6 + sw * 0.4, -0.2); q.Q(px + 1, 0.6, px - 4.8 + sw * 0.6, -0.1); q.Q(px - 4.2, py + 5, a[0], a[1]); q.Z(); }, S);
        K.paint(c, sk, M.dress, { depth: S * 0.9, hlw: S * 0.4 });
        c.save(); c.clip(sk); for (const k of [-2.6, -0.6, 1.6, 3.6]) K.line(c, [[px + k * 0.5, py + 1], [px + k + sw * 0.4, -0.2]], 0.22, A.rgba(M.dress.deep, 0.35)); c.restore();
        // corpete
        const body = H.torsoPath(W, [['spine', 0.15, 2.6, 2.6], ['spine', 0.7, 2.2, 2.3], ['chest', 0.5, 2.4, 2.5], ['chest', 1, 1.8, 2.0]], S);
        K.paint(c, body, M.dress, { depth: S * 0.7, hlw: S * 0.3 });
        K.line(c, [pt(W.spine, 0.25, -2.5), pt(W.spine, 0.25, 2.6)], 0.4, M.shawl.base); // faixa à cintura
        // bordado dourado: barra na bainha e pequenas chamas ao longo dela
        c.save(); c.clip(sk);
        K.line(c, [[px - 4.6 + sw * 0.6, -0.9], [px + 0.8, -0.5], [px + 5.4 + sw * 0.4, -1.0]], 0.42, M.brass.shadow);
        K.line(c, [[px - 4.6 + sw * 0.6, -1.0], [px + 0.8, -0.6], [px + 5.4 + sw * 0.4, -1.1]], 0.14, M.brass.light);
        for (let i = 0; i < 5; i++) { const fx = px - 3.6 + i * 2.1 + sw * 0.5; K.blob(c, [[fx - 0.25, -1.3], [fx, -2.1], [fx + 0.25, -1.3]], M.brass, { depth: 0 }); }
        c.restore();
        K.line(c, [pt(W.chest, 1.0, -1.6), pt(W.chest, 0.82, 0.4), pt(W.chest, 1.0, 1.9)], 0.18, M.brass.base); // decote
      }
      function shawl(c, W, x) {
        const C = W.chest, sw = x.sway || 0;
        const s = A.path((q) => { const a = pt(C, 1.05, -2.2), b = pt(C, 1.0, 2.0); q.M(a[0], a[1]); q.Q(b[0] + 0.6, b[1] - 0.6, b[0] + 0.8, b[1] + 0.6); q.L(...pt(C, 0.35, 2.6)); q.Q(...pt(C, 0.2, 0.4), ...pt(W.spine, 0.7, -2.0)); q.L(...pt(W.spine, 0.2, -3.6 - sw * 0.3)); q.Q(...pt(C, 0.6, -3.2), a[0], a[1]); q.Z(); }, S);
        K.paint(c, s, M.shawl, { depth: S * 0.6, hlw: S * 0.25 });
        c.save(); c.clip(s); for (let i = 0; i < 3; i++) K.line(c, [pt(C, 0.9 - i * 0.2, -2.0), pt(W.spine, 0.6 - i * 0.15, -3.0)], 0.18, A.rgba('#100a14', 0.5)); c.restore();
        // franjas
        const e = pt(W.spine, 0.2, -3.6 - sw * 0.3); for (let i = 0; i < 4; i++) K.line(c, [[e[0] + i * 0.4, e[1] - i * 0.3], [e[0] + i * 0.4 - 0.2, e[1] - i * 0.3 + 1.4]], 0.12, M.shawl.shadow);
        // pendente com uma brasa pequenina
        const pd = pt(C, 0.55, 1.6); K.line(c, [pt(C, 1.0, 0.4), pd], 0.1, M.brass.shadow); K.dot(c, pd[0], pd[1], 0.55, M.brass.base); K.ember(c, pd[0], pd[1], 0.3, 0.8, '#ffb050');
      }
      function head(c, W, x) {
        const sw = x.sway || 0, tilt = x.tilt || 0;
        c.save(); A.boneT(c, W.head, S); c.rotate(Math.PI / 2 + tilt * D2R);
        // cabelo comprido atrás
        const back = A.path((q) => { q.M(-1.4, -4.4); q.Q(-3.8, -3.2, -3.4 + sw * 0.2, 1.0); q.Q(-3.6 + sw * 0.4, 4.2, -2.6 + sw * 0.6, 6.8); q.L(-1.0, 5.6); q.Q(-1.4, 2.0, -0.6, 0); q.Z(); }, S);
        K.paint(c, back, M.hair, { depth: S * 0.35 });
        const f = K.blob(c, [[-1.4, 0.8], [-1.6, -2.4], [-0.6, -4.2], [1.2, -4.4], [2.3, -3.5], [2.5, -2.3], [3.0, -1.4], [2.5, -1.0], [2.5, -0.2], [2.0, 0.8], [0.6, 1.4]], M.skin, { depth: S * 0.5, hlw: S * 0.28, light: [0.6, -1] });
        void f;
        jawShade(c, f, 1.0, 1.2, 1.6, 0.3);
        ear(c, 0.0, -1.6, M.skin);
        // cabelo por cima: risca ao meio, a cair para trás da orelha, com madeixas claras
        const hairTop = K.blob(c, [[-1.8, -0.6], [-1.8, -3.4], [-0.4, -4.8], [1.6, -4.7], [2.5, -3.6], [1.2, -3.8], [0, -3.0], [-0.6, -1.2]], M.hair, { depth: S * 0.3 });
        c.save(); c.clip(hairTop); for (const k of [0, 0.6, 1.2]) K.line(c, [[-1.2 + k, -4.2], [0.2 + k, -4.4], [1.6 + k * 0.3, -4.0]], 0.1, A.rgba(M.hair.light, 0.8)); c.restore();
        // venda de linho sobre os olhos, atada atrás com as pontas soltas (serena, sem sangue nem cicatrizes)
        const band = A.path((q) => { q.M(-1.9, -2.9); q.L(2.6, -3.1); q.Q(2.95, -2.6, 2.8, -2.0); q.L(-1.9, -1.9); q.Z(); }, S);
        K.paint(c, band, M.band, { depth: S * 0.2, hlw: S * 0.12 });
        K.line(c, [[-1.6, -2.4], [2.6, -2.5]], 0.08, A.rgba('#a89c88', 0.7));
        K.tube(c, [[-2.0, -2.4], [-3.0, -1.6 + sw * 0.2], [-3.8 + sw * 0.4, -0.2]], [0.32, 0.26, 0.18], M.band, { depth: S * 0.1, flat: true });
        K.tube(c, [[-2.0, -2.4], [-3.2, -2.2 + sw * 0.2], [-4.2 + sw * 0.4, -1.4]], [0.3, 0.24, 0.16], M.band, { depth: S * 0.1, flat: true });
        // boca serena (lábios suaves) e face corada
        const sm = x.smile || 0;
        K.line(c, [[1.7, -0.2], [2.0, -0.18 - sm * 0.05], [2.3, -0.25 - sm * 0.15]], 0.14, '#8a4a48');
        K.line(c, [[1.85, 0.05], [2.2, 0.0]], 0.1, A.rgba('#b06a64', 0.5));
        K.dot(c, 1.5, -1.2, 0.45, A.rgba('#d88a7a', 0.25));
        K.line(c, [[2.7, -1.7], [3.05, -1.45], [2.7, -1.15]], 0.1, M.skin.shadow); // nariz
        c.restore();
        // trança à frente do ombro
        const N0 = pt(W.neck, 0.4, 0.6), C = W.chest;
        const bp = [N0, pt(C, 0.75, 1.9), pt(C, 0.35, 2.3), pt(W.spine, 0.9, 2.1)];
        // trança: elos alternados ao longo do caminho, a afinar até à fita
        for (let i = 0; i < 9; i++) {
          const k = i / 8, j = Math.min(2, Math.floor(k * 3)), u = k * 3 - j, a0 = bp[j], a1 = bp[j + 1];
          const px = A.lerp(a0[0], a1[0], u), py = A.lerp(a0[1], a1[1], u), w = 0.62 - k * 0.3, s2 = i % 2 ? 1 : -1;
          K.blob(c, [[px - w, py - 0.35], [px + s2 * w * 0.4, py - 0.55], [px + w, py + 0.1], [px - s2 * w * 0.3, py + 0.5]], M.hair, { depth: S * 0.12, hlw: S * 0.08 });
        }
        const e = bp[3]; K.blob(c, [[e[0] - 0.5, e[1] - 0.2], [e[0] + 0.5, e[1] - 0.2], [e[0] + 0.4, e[1] + 0.4], [e[0] - 0.4, e[1] + 0.4]], M.band, { depth: 0 });
        K.tube(c, [[e[0], e[1] + 0.3], [e[0] + 0.3, e[1] + 1.6]], [0.3, 0.15], M.hair, { depth: 0 });
      }
      function draw(c, W, x) {
        sleeveArm(c, W, 'B', true, M.dress, M.skin, 0.85, 0.75, 0.6);
        dress(c, W, x);
        shawl(c, W, x);
        head(c, W, x);
        sleeveArm(c, W, 'F', false, M.dress, M.skin, 0.85, 0.75, 0.6);
        if (x.candle) { const Hd = W.handF; candle(c, [Hd.ex - 0.2, Hd.ey + 0.6], 4.2, false); }
      }
      const STANCE = { pelvis: 0, spine: -2, chest: -2, neck: 6, head: -4 };
      const RY = -12.6;
      const base = (o = {}) => Object.assign({ fF: [1.6, 0], fB: [-1.4, 0], hF: [2.6, 6.4], haF: -90, hB: [1.6, 6.8], haB: -80, candle: 1, sway: 0, tilt: 0, smile: 0 }, o);
      const anims = () => ({
        idle: { n: 8, fps: 6, loop: true, poseFn: (t) => { const s = Math.sin(t * A.TAU); return P(H, STANCE, { spine: s * 0.6, head: -s }, base({ sway: s * 0.5, hF: [2.6, 6.4 + s * 0.2] }), [0, RY - s * 0.15]); } },
        talk: { n: 8, fps: 7, loop: true, poseFn: (t) => { const s = Math.sin(t * A.TAU); return P(H, STANCE, { spine: -1, neck: 4, head: -8 + s * 2 }, base({ hB: [4.6 + s * 0.4, 1.6 - s * 0.6], haB: -40, bB: 1, tilt: 6 + s * 2, smile: 0.6, sway: s * 0.4 }), [0, RY]); } },
      });
      const portrait = P(H, STANCE, { spine: -1, neck: 4, head: -6 }, base({ tilt: 4, smile: 0.5, hB: [3.6, 2.4], haB: -50 }), [0, RY]);
      return { H, solve, draw, anims, portrait, box: [40, 42], anchor: [20, 38], aura: '#ffd8a0', post: ['#ffe0c0', 0.3] };
    })();

    // ================================================================ HROLF
    const hrolf = (() => {
      const H = A.humanoid({ pelvis: 2.2, spine: 5.0, chest: 5.2, neck: 1.0, head: 4.6, thigh: 6.2, shin: 6.0, foot: 2.9, uarm: 5.0, farm: 4.8, hand: 1.8, shoulder: 0.9 });
      const M = {
        tunic: A.mat('#6a4a34', { shadow: '#3a281a', light: '#9a7254' }),
        apron: A.mat('#4a3020', { shadow: '#24160c', light: '#765036' }),
        skin: A.mat('#c8a084', { shadow: '#82604a', light: '#ecc8a8', deep: '#3a2418' }),
        beard: A.mat('#b0602e', { shadow: '#62300f', light: '#e09050', deep: '#2a1004' }),
        trous: A.mat('#2e2a2a', { shadow: '#161414', light: '#4e4848' }),
        boot: A.mat('#2a201a', { shadow: '#140e0a', light: '#4a3a2e' }),
        iron: A.mat('#55565e', { shadow: '#2a2a30', light: '#a8acb6', deep: '#101014' }),
        wood: A.mat('#5e4228', { shadow: '#33220f', light: '#8e6a46' }),
      };
      const solve = (pose) => solveArms(H, pose);
      function torso(c, W, x) {
        const body = H.torsoPath(W, [['pelvis', 0.2, 3.4, 3.4], ['spine', 0.3, 3.5, 3.5], ['spine', 0.9, 3.9, 3.9], ['chest', 0.5, 4.2, 4.1], ['chest', 1.0, 3.0, 3.4]], S);
        K.paint(c, body, M.tunic, { depth: S * 0.9, hlw: S * 0.4 });
        // avental de couro
        const C = W.chest, Sp = W.spine, Pv = W.pelvis, [px, py] = K.along(Pv, 0.2), [nx] = K.perp(Sp);
        const ap = A.path((q) => { const a = pt(C, 0.85, 0.6), b = pt(C, 0.85, 3.6); q.M(a[0], a[1]); q.L(b[0], b[1]); q.Q(...pt(Sp, 0.6, 4.2), ...pt(Sp, 0.1, 4.0)); q.L(px + 4.4, py + 7.4); q.L(px - 1.6, py + 7.8); q.Q(px - 1.8, py + 2, ...pt(Sp, 0.3, -0.8)); q.Z(); }, S);
        K.paint(c, ap, M.apron, { depth: S * 0.7, hlw: S * 0.3 }); void nx;
        c.save(); c.clip(ap); for (const [dx, dy] of [[1.6, 3.4], [2.8, 5.6]]) K.ember(c, px + dx, py + dy, 0.2, 0.4, '#ff8a30'); c.restore();
        K.line(c, [pt(C, 0.85, 0.8), pt(C, 1.05, -1.2)], 0.3, M.apron.shadow);
        K.line(c, [pt(Sp, 0.1, -3.4), pt(Sp, 0.1, 4.0)], 0.6, '#1a120c');
      }
      function hammer(c, W, x) {
        // martelo ao ombro: cabo da mão da frente até atrás do ombro, cabeça atrás da cabeça
        const Hd = W.handF, g = [Hd.ex, Hd.ey], a = (x.ham === undefined ? -118 : x.ham) * D2R, d = [Math.cos(a), Math.sin(a)], n = [-d[1], d[0]];
        const at = (t, w = 0) => [g[0] + d[0] * t + n[0] * w, g[1] + d[1] * t + n[1] * w];
        K.tube(c, [at(-1.6), at(11.6)], [0.4, 0.38], M.wood, { depth: S * 0.15, flat: true });
        K.poly(c, [at(10.4, -1.4), at(13.4, -1.4), at(13.4, 2.0), at(10.4, 2.0)], M.iron, { depth: S * 0.35 });
        K.line(c, [at(10.6, -1.2), at(13.2, -1.2)], 0.2, A.rgba('#c8ccd4', 0.6));
      }
      function head(c, W, x) {
        c.save(); A.boneT(c, W.head, S); c.rotate(Math.PI / 2);
        const f = K.blob(c, [[-1.8, 0.8], [-2.2, -2.6], [-1.2, -4.6], [1.0, -4.9], [2.6, -4.0], [2.9, -2.5], [3.4, -1.6], [2.9, -1.2], [3.0, -0.2], [2.4, 1.0], [0.6, 1.4]], M.skin, { depth: S * 0.5, hlw: S * 0.28, light: [0.6, -1] });
        c.save(); c.clip(f); const sm = c.createRadialGradient(2 * S, -1.6 * S, 0, 2 * S, -1.6 * S, 1.5 * S); sm.addColorStop(0, 'rgba(30,18,12,0.4)'); sm.addColorStop(1, 'rgba(30,18,12,0)'); c.fillStyle = sm; c.fillRect(0, -4 * S, 4 * S, 4 * S); c.restore();
        // cabelo curto ruivo e barba farta
        K.blob(c, [[-2.2, -1.2], [-2.4, -3.8], [-1.0, -5.3], [1.6, -5.3], [2.8, -4.2], [1.0, -4.3], [-0.6, -3.4], [-1.0, -1.6]], M.beard, { depth: S * 0.3 });
        const bd = A.path((q) => { q.M(0.4, -1.8); q.Q(1.4, -0.4, 2.9, -0.6); q.Q(3.4, 0.6, 2.8, 2.0); q.Q(1.8, 3.4, 0.2, 2.6); q.Q(-0.8, 1.6, -0.6, -0.2); q.Z(); }, S);
        K.paint(c, bd, M.beard, { depth: S * 0.35, hlw: S * 0.2 });
        c.save(); c.clip(bd); for (let i = 0; i < 4; i++) K.line(c, [[0.4 + i * 0.6, -0.6], [0.2 + i * 0.6, 2.4]], 0.12, A.rgba(M.beard.deep, 0.5)); c.restore();
        K.line(c, [[1.6, -0.2], [2.8, -0.4]], 0.18 + (x.mouth || 0) * 0.2, '#3a1a10'); // boca
        // tranças na ponta da barba, presas com argolas de ferro
        for (const [bx, by, l] of [[1.0, 2.6, 1.6], [2.0, 2.3, 1.3]]) {
          for (let i = 0; i < 3; i++) K.blob(c, [[bx - 0.32, by + i * l / 3], [bx + 0.32, by + i * l / 3], [bx + 0.22, by + (i + 1) * l / 3], [bx - 0.22, by + (i + 1) * l / 3]], M.beard, { depth: S * 0.1 });
          K.poly(c, [[bx - 0.36, by + l * 0.45], [bx + 0.36, by + l * 0.45], [bx + 0.36, by + l * 0.62], [bx - 0.36, by + l * 0.62]], M.iron, { depth: 0 });
        }
        eyeP(c, 2.15, -2.45, { w: 0.6, h: 0.3, iris: '#3a5a6a', lid: 0.16 });
        K.blob(c, [[1.3, -3.05], [2.9, -3.25], [3.0, -2.85], [1.4, -2.75]], M.beard, { depth: 0 }); // sobrolho farto
        K.line(c, [[2.9, -2.0], [3.4, -1.6], [2.9, -1.2]], 0.12, M.skin.shadow);
        c.save(); c.clip(f); for (const [sx, sy, r] of [[2.4, -1.2, 0.5], [0.8, -2.9, 0.6]]) K.dot(c, sx, sy, r, A.rgba('#2a1a12', 0.18)); c.restore(); // fuligem
        ear(c, -0.3, -2.0, M.skin);
        // óculos de forja na testa: tira de couro e lente de latão
        K.line(c, [[-2.3, -4.3], [0.4, -4.6], [2.4, -4.3]], 0.42, '#2a1c14');
        K.blob(c, [[1.2, -4.95], [2.5, -4.95], [2.7, -4.2], [1.3, -4.1]], A.mat('#a8843e', { shadow: '#5e461c', light: '#e8c880' }), { depth: S * 0.1 });
        K.dot(c, 1.95, -4.55, 0.3, '#6a8a9a'); K.dot(c, 2.05, -4.65, 0.1, 'rgba(255,255,255,0.8)');
        c.restore();
      }
      function draw(c, W, x) {
        sleeveArm(c, W, 'B', true, M.tunic, M.skin, 1.6, 1.4, 1.2, 1);
        bootLeg(c, W, 'B', true, M.trous, M.boot);
        torso(c, W, x);
        bootLeg(c, W, 'F', false, M.trous, M.boot);
        if (!x.dead) hammer(c, W, x);
        head(c, W, x);
        sleeveArm(c, W, 'F', false, M.tunic, M.skin, 1.6, 1.4, 1.2, 1);
        if (x.dead) { // martelo caído ao lado
          K.tube(c, [[6, -0.6], [16, -0.8]], [0.4, 0.4], M.wood, { flat: true, depth: S * 0.1 }); K.poly(c, [[15.4, -2.8], [18.4, -2.8], [18.4, 0], [15.4, 0]], M.iron, { depth: S * 0.3 });
        }
      }
      const STANCE = { pelvis: 0, spine: 2, chest: 0, neck: 4, head: -6 };
      const RY = -12.2;
      const base = (o = {}) => Object.assign({ fF: [3.0, 0], fB: [-2.6, 0], hF: [2.8, 2.6], haF: -120, bF: 1, hB: [1.0, 5.4], haB: 60, ham: -142, mouth: 0 }, o);
      const anims = () => ({
        idle: { n: 8, fps: 6, loop: true, poseFn: (t) => { const s = Math.sin(t * A.TAU); return P(H, STANCE, { spine: s * 0.8 }, base({ hF: [2.8, 2.6 - s * 0.2], ham: -142 + s * 2 }), [0, RY - s * 0.2]); } },
        talk: { n: 8, fps: 7, loop: true, poseFn: (t) => { const s = Math.sin(t * A.TAU); return P(H, STANCE, { spine: 1, head: -8 + s * 3 }, base({ hB: [5.6 + s * 0.8, 1.2 - s], haB: -30 + s * 20, mouth: 0.5 + s * 0.4 }), [0, RY]); } },
        dead: { n: 1, fps: 1, poseFn: () => A.pose({ pelvis: 90, spine: 0, chest: 2, neck: 4, head: 8, thighF: -6, shinF: 10, footF: 20, thighB: 4, shinB: 4, footB: 30, uarmF: 160, farmF: 10, uarmB: 150, farmB: 30 }, base({ dead: 1, fF: null, fB: null, hF: null, hB: null }), [-6, -3.8]) },
      });
      const portrait = P(H, STANCE, { spine: 1, head: -8 }, base({ hB: [5.0, 1.4], haB: -30, mouth: 0.6 }), [0, RY]);
      return { H, solve, draw, anims, portrait, box: [48, 44], anchor: [22, 40], aura: '#ffa060', post: ['#ffc090', 0.3] };
    })();

    // ================================================================ MAREN
    const maren = (() => {
      const H = A.humanoid({ spine: 5.0, chest: 4.6, neck: 1.2, head: 4.4, thigh: 6.4, shin: 6.3, foot: 2.6, uarm: 4.7, farm: 4.4, hand: 1.6 });
      const M = {
        cloak: A.mat('#5e4c3a', { shadow: '#30261c', light: '#8e7658', deep: '#140e0a' }),
        tunic: A.mat('#7a6a50', { shadow: '#463a28', light: '#a89270' }),
        scarf: A.mat('#7a1a2a', { shadow: '#400c14', light: '#a83a48' }),
        skin: A.mat('#d4b49a', { shadow: '#8e6e58', light: '#f0d6be', deep: '#3a2618' }),
        hair: A.mat('#8a5a32', { shadow: '#4a2e18', light: '#b88050' }),
        pack: A.mat('#4a3a28', { shadow: '#261c12', light: '#76603e' }),
        blanket: A.mat('#5a6a7a', { shadow: '#2e3844', light: '#8a9aaa' }),
        trous: A.mat('#3a3028', { shadow: '#1c1612', light: '#5a4c40' }),
        boot: A.mat('#3a2a1e', { shadow: '#1c140e', light: '#5e4634' }),
        wood: A.mat('#6e5232', { shadow: '#3a2a18', light: '#9e7a50' }),
        iron: A.mat('#4a4850', { shadow: '#26252a', light: '#8a8890' }),
        brass: A.mat('#a8843e', { shadow: '#5e461c', light: '#e8c880' }),
      };
      const solve = (pose) => solveArms(H, pose);
      function pack(c, W, x) {
        const C = W.chest, a = pt(C, 0.9, -2.4), b = pt(W.spine, 0.2, -2.6);
        const bag = A.path((q) => { q.M(a[0] + 0.4, a[1] - 0.6); q.L(a[0] - 5.4, a[1] - 0.2); q.Q(b[0] - 6.4, (a[1] + b[1]) / 2, b[0] - 5.2, b[1] + 0.6); q.L(b[0] + 0.2, b[1] + 0.4); q.Z(); }, S);
        K.paint(c, bag, M.pack, { depth: S * 0.6, hlw: S * 0.25 });
        c.save(); c.clip(bag); K.line(c, [[a[0] - 5, (a[1] + b[1]) / 2], [a[0] + 0.4, (a[1] + b[1]) / 2]], 0.3, M.pack.shadow); c.restore();
        // cobertor enrolado por cima, panela e lanterna pendurada
        K.tube(c, [[a[0] - 6.0, a[1] - 1.6], [a[0] + 0.2, a[1] - 1.8]], [1.3, 1.3], M.blanket, { depth: S * 0.3, flat: true });
        for (const k of [-4.6, -1.4]) K.line(c, [[a[0] + k, a[1] - 3.0], [a[0] + k, a[1] - 0.5]], 0.25, M.pack.shadow);
        K.blob(c, [[b[0] - 5.6, b[1] - 3], [b[0] - 3.8, b[1] - 3.2], [b[0] - 3.6, b[1] - 1.4], [b[0] - 5.4, b[1] - 1.2]], M.iron, { depth: S * 0.2 });
        const lx = a[0] - 6.2, ly = a[1] + 1.4 + (x.sway || 0) * 0.3;
        K.line(c, [[a[0] - 5.4, a[1]], [lx, ly]], 0.12, '#1a1418');
        K.poly(c, [[lx - 1.1, ly + 0.6], [lx + 1.1, ly + 0.6], [lx + 0.8, ly - 0.2], [lx - 0.8, ly - 0.2]], M.iron, { depth: 0 });
        const cage = K.polyPath([[lx - 1.0, ly + 0.6], [lx + 1.0, ly + 0.6], [lx + 0.8, ly + 3.0], [lx - 0.8, ly + 3.0]]); c.fillStyle = '#ffcf80'; c.fill(cage); c.lineWidth = S * 0.2; c.strokeStyle = '#1a1418'; c.stroke(cage);
        x._lamp = [lx, ly + 1.8];
      }
      function cloak(c, W, x) {
        const C = W.chest, Sp = W.spine, Pv = W.pelvis, [px, py] = K.along(Pv, 0.1), sw = x.sway || 0;
        // túnica e calças por baixo
        const body = H.torsoPath(W, [['pelvis', 0.2, 2.9, 2.9], ['spine', 0.4, 2.6, 2.6], ['chest', 0.5, 2.8, 2.8], ['chest', 1, 2.0, 2.2]], S);
        K.paint(c, body, M.tunic, { depth: S * 0.7, hlw: S * 0.3 });
        K.line(c, [pt(Sp, 0.2, -2.6), pt(Sp, 0.2, 2.8)], 0.55, M.scarf.base); // cinto
        // capa de viagem às costas, até à barriga da perna
        const cl = A.path((q) => { const a = pt(C, 1.0, -2.0), b = pt(C, 0.9, 1.4); q.M(b[0], b[1]); q.Q(a[0], a[1] - 0.8, a[0] - 1.2, a[1] + 0.6); q.Q(px - 4.6, py, px - 5.6 + sw, -4.4); q.L(px - 2.2 + sw * 0.6, -3.6); q.Q(px - 2.6, py + 2, ...pt(C, 0.4, -1.6)); q.Q(...pt(C, 0.8, 0), b[0], b[1]); q.Z(); }, S);
        K.paint(c, cl, M.cloak, { depth: S * 0.7, hlw: S * 0.3 });
        c.save(); c.clip(cl); for (let i = 0; i < 3; i++) K.line(c, [pt(C, 0.8, -1.6 - i * 0.4), [px - 3.4 - i * 0.7 + sw, -4]], 0.18, A.rgba(M.cloak.deep, 0.45));
        // remendo cosido na capa
        const rp = [px - 3.6 + sw * 0.7, -6.6]; K.poly(c, [[rp[0] - 0.9, rp[1] - 0.8], [rp[0] + 0.9, rp[1] - 0.9], [rp[0] + 1.0, rp[1] + 0.8], [rp[0] - 0.8, rp[1] + 0.9]], M.blanket, { depth: S * 0.1 });
        for (let i = 0; i < 4; i++) K.line(c, [[rp[0] - 0.9 + i * 0.6, rp[1] - 1.1], [rp[0] - 0.9 + i * 0.6, rp[1] - 0.6]], 0.06, '#d8cfb8');
        c.restore();
        // lenço ao pescoço
        K.blob(c, [pt(C, 1.05, -1.4), pt(C, 1.05, 1.8), pt(C, 0.7, 2.4), pt(C, 0.75, -1.2)], M.scarf, { depth: S * 0.25 });
        K.tube(c, [pt(C, 0.85, 2.0), pt(C, 0.55, 2.6), pt(C, 0.35, 2.2)], [0.5, 0.4, 0.25], M.scarf, { depth: 0, flat: true });
      }
      function head(c, W, x) {
        c.save(); A.boneT(c, W.head, S); c.rotate(Math.PI / 2);
        const f = K.blob(c, [[-1.4, 0.8], [-1.6, -2.4], [-0.6, -4.2], [1.2, -4.4], [2.3, -3.5], [2.5, -2.3], [3.0, -1.4], [2.5, -1.0], [2.5, -0.2], [2.0, 0.8], [0.6, 1.4]], M.skin, { depth: S * 0.5, hlw: S * 0.28, light: [0.6, -1] });
        c.save(); c.clip(f); for (const [px, py] of [[1.6, -1.8], [2.0, -1.4], [1.3, -1.3], [2.2, -2.0]]) K.dot(c, px, py, 0.12, A.rgba('#8a5a3a', 0.6)); c.restore(); // sardas
        // madeixa a sair do capuz
        K.tube(c, [[0.6, -4.2], [1.6, -3.4], [1.9, -2.6]], [0.45, 0.35, 0.15], M.hair, { depth: 0 });
        // capuz caído para trás, aberto sobre a testa
        const hood = A.path((q) => { q.M(1.6, -4.4); q.Q(0.4, -6.0, -2.4, -4.8); q.Q(-3.6, -2.6, -2.8, 1.2); q.L(-1.2, 1.4); q.Q(-1.8, -1.6, -1.0, -3.4); q.Q(0.2, -4.6, 1.6, -4.4); q.Z(); }, S);
        K.paint(c, hood, M.cloak, { depth: S * 0.4, hlw: S * 0.2 });
        eyeP(c, 2.0, -2.45, { w: 0.6, h: 0.32, iris: '#4a6a3a', lash: 1 });
        K.line(c, [[1.45, -3.0], [2.0, -3.2], [2.45, -3.05]], 0.17, M.hair.deep);
        const mo = x.mouth || 0; K.line(c, [[1.7, -0.2], [2.0, -0.15], [2.3, -0.2 - mo * 0.2]], 0.14 + mo * 0.1, '#7a3a30');
        // alfinete de latão a prender o capuz
        K.dot(c, 1.1, -4.55, 0.32, '#a8843e'); K.dot(c, 1.05, -4.62, 0.12, '#f0d898');
        K.line(c, [[2.6, -1.8], [3.0, -1.45], [2.6, -1.1]], 0.1, M.skin.shadow);
        c.restore();
      }
      function staff(c, W, x) {
        const Hd = W.handF, g = [Hd.ex + 0.2, Hd.ey];
        K.tube(c, [[g[0] + 0.4, 0], [g[0], g[1]], [g[0] - 0.4, g[1] - 10]], [0.35, 0.35, 0.3], M.wood, { flat: true, depth: S * 0.15 });
        // trouxa de pano atada perto do topo
        const t = [g[0] - 0.35, g[1] - 8.6]; K.blob(c, [[t[0] - 1.4, t[1]], [t[0], t[1] - 1.2], [t[0] + 1.4, t[1]], [t[0], t[1] + 1.6]], M.blanket, { depth: S * 0.2 });
        K.dot(c, t[0], t[1] - 1.5, 0.3, M.brass.base);
      }
      function draw(c, W, x) {
        pack(c, W, x);
        sleeveArm(c, W, 'B', true, M.tunic, M.skin, 0.9, 0.8, 0.65);
        bootLeg(c, W, 'B', true, M.trous, M.boot);
        bootLeg(c, W, 'F', false, M.trous, M.boot);
        cloak(c, W, x);
        head(c, W, x);
        staff(c, W, x);
        sleeveArm(c, W, 'F', false, M.tunic, M.skin, 0.9, 0.8, 0.65);
      }
      function overlay(c, W, x) { if (x._lamp) A.glow(c, x._lamp[0] * S, x._lamp[1] * S, 4 * S, '#ffc060', 0.5); }
      const STANCE = { pelvis: 0, spine: 0, chest: -2, neck: 4, head: -6 };
      const RY = -12.4;
      const base = (o = {}) => Object.assign({ fF: [2.4, 0], fB: [-2.0, 0], hF: [3.6, 4.4], haF: -90, hB: [0.6, 5.6], haB: 70, sway: 0, mouth: 0 }, o);
      const anims = () => ({
        idle: { n: 8, fps: 6, loop: true, poseFn: (t) => { const s = Math.sin(t * A.TAU); return P(H, STANCE, { spine: s * 0.6, head: -s }, base({ sway: s }), [0, RY - s * 0.15]); } },
        talk: { n: 8, fps: 8, loop: true, poseFn: (t) => { const s = Math.sin(t * A.TAU); return P(H, STANCE, { spine: 2, head: -8 + s * 2 }, base({ hB: [5.4 + s * 0.6, 2.2 - s * 0.8], haB: -20 + s * 15, mouth: 0.5 + s * 0.4, sway: s * 0.6 }), [0, RY]); } },
      });
      const portrait = P(H, STANCE, { spine: 2, head: -8 }, base({ hB: [5.0, 2.4], haB: -20, mouth: 0.6 }), [0, RY]);
      return { H, solve, draw, overlay, anims, portrait, box: [44, 42], anchor: [24, 38], aura: '#ffc070', post: ['#ffd8a8', 0.3] };
    })();

    // ================================================================ TEODORO
    const teodoro = (() => {
      const H = A.humanoid({ spine: 4.8, chest: 4.2, neck: 1.3, head: 4.3, thigh: 6.4, shin: 6.2, foot: 2.5, uarm: 4.6, farm: 4.3, hand: 1.5 });
      const M = {
        cass: A.mat('#2a2434', { shadow: '#14101a', light: '#4a4058', deep: '#08060c' }),
        collar: A.mat('#ece6d8', { shadow: '#aaa294', light: '#ffffff' }),
        skin: A.mat('#d8c4b0', { shadow: '#94806e', light: '#f2e2d2', deep: '#3a2a20' }),
        hair: A.mat('#3a2a1e', { shadow: '#1a120c', light: '#5e4634' }),
        boot: A.mat('#1e1814', { shadow: '#0e0a08', light: '#3a3028' }),
      };
      const solve = (pose) => solveArms(H, pose);
      function cassock(c, W, x) {
        const Pv = W.pelvis, [px, py] = K.along(Pv, 0.1), sw = x.sway || 0;
        const body = H.torsoPath(W, [['spine', 0.1, 2.5, 2.5], ['spine', 0.7, 2.3, 2.4], ['chest', 0.5, 2.5, 2.5], ['chest', 1, 1.8, 2.0]], S);
        const sk = A.path((q) => { const a = pt(W.spine, 0.15, -2.5), b = pt(W.spine, 0.15, 2.6); q.M(a[0], a[1]); q.L(b[0], b[1]); q.Q(px + 3.8, py + 6, px + 4.4 + sw * 0.3, -0.4); q.L(px + 2.4, -1.4); q.L(px + 1.0, -0.2); q.L(px - 0.8, -1.6); q.L(px - 2.6, -0.3); q.L(px - 3.8 + sw * 0.4, -0.8); q.Q(px - 3.6, py + 5, a[0], a[1]); q.Z(); }, S); // bainha rasgada
        K.paint(c, sk, M.cass, { depth: S * 0.8, hlw: S * 0.35 });
        K.paint(c, body, M.cass, { depth: S * 0.7, hlw: S * 0.3 });
        // botões da sotaina
        const C = W.chest; for (let i = 0; i < 5; i++) { const p = pt(i < 3 ? C : W.spine, i < 3 ? 0.9 - i * 0.3 : 1.0 - (i - 2) * 0.35, 2.3); K.dot(c, p[0], p[1], 0.18, '#6a6070'); }
        // colarinho branco
        K.blob(c, [pt(C, 1.04, -1.2), pt(C, 1.04, 1.6), pt(C, 0.92, 1.8), pt(C, 0.92, -1.2)], M.collar, { depth: S * 0.15 });
        // estola cor de vinho a cair do pescoço, com cruzes douradas bordadas
        const stole = A.path((q) => { const a = pt(C, 1.0, 0.6), b = pt(C, 1.0, 1.7); q.M(a[0], a[1]); q.L(b[0], b[1]); q.L(...pt(W.spine, 0.0, 1.9)); q.L(px + 1.6, py + 5.2); q.L(px + 0.4, py + 5.0); q.L(...pt(W.spine, 0.1, 0.8)); q.Z(); }, S);
        K.paint(c, stole, A.mat('#6a1e2c', { shadow: '#3a0e16', light: '#9a3a48' }), { depth: S * 0.3, hlw: S * 0.15 });
        for (const t of [0.75, 0.15]) { const q = pt(t > 0.5 ? C : W.spine, t, 1.25); K.line(c, [[q[0] - 0.35, q[1]], [q[0] + 0.35, q[1]]], 0.12, '#e0c070'); K.line(c, [[q[0], q[1] - 0.45], [q[0], q[1] + 0.45]], 0.12, '#e0c070'); }
        // terço pendurado do cinto
        const r0 = pt(W.spine, 0.12, -1.0); for (let i = 0; i < 6; i++) K.dot(c, r0[0] - 0.3 + Math.sin(i * 0.9) * 0.3, r0[1] + i * 0.5, 0.16, '#3a2a20');
        K.line(c, [[r0[0] - 0.4, r0[1] + 3.2], [r0[0] + 0.2, r0[1] + 3.2]], 0.1, '#c0a060'); K.line(c, [[r0[0] - 0.1, r0[1] + 2.9], [r0[0] - 0.1, r0[1] + 3.7]], 0.1, '#c0a060');
      }
      function head(c, W, x) {
        c.save(); A.boneT(c, W.head, S); c.rotate(Math.PI / 2);
        K.blob(c, [[-1.4, 0.8], [-1.6, -2.4], [-0.6, -4.1], [1.1, -4.3], [2.2, -3.4], [2.4, -2.3], [2.9, -1.4], [2.4, -1.0], [2.4, -0.2], [1.9, 0.8], [0.5, 1.3]], M.skin, { depth: S * 0.5, hlw: S * 0.28, light: [0.6, -1] });
        // cabelo desalinhado
        K.blob(c, [[-1.8, -1.4], [-2.0, -3.6], [-0.8, -4.9], [1.0, -5.1], [2.4, -4.2], [2.0, -3.6], [1.2, -4.0], [0.4, -3.4], [-0.4, -3.8], [-1.0, -2.2]], M.hair, { depth: S * 0.3 });
        // olhos grandes e assustados, sobrolho erguido
        const look = x.look || 0;
        eyeP(c, 1.95, -2.35, { w: 0.7, h: 0.42, iris: '#5a4a3a', look, bag: 1, lid: 0.12 });
        K.line(c, [[1.35, -3.15], [1.9, -3.5], [2.4, -3.35]], 0.18, M.hair.deep); // sobrolho erguido (assustado)
        ear(c, -0.2, -1.8, M.skin);
        K.line(c, [[1.7, -0.3], [2.2, -0.2]], 0.12, '#7a4a40');
        K.line(c, [[2.5, -1.8], [2.9, -1.5], [2.5, -1.2]], 0.1, M.skin.shadow);
        c.restore();
      }
      function draw(c, W, x) {
        sleeveArm(c, W, 'B', true, M.cass, M.skin, 0.8, 0.7, 0.55);
        bootLeg(c, W, 'B', true, M.cass, M.boot);
        bootLeg(c, W, 'F', false, M.cass, M.boot);
        cassock(c, W, x);
        head(c, W, x);
        sleeveArm(c, W, 'F', false, M.cass, M.skin, 0.8, 0.7, 0.55);
        if (x.candle) { const Hd = W.handF; candle(c, [Hd.ex - 0.1, Hd.ey + 0.5], 2.6, !x.dead); }
      }
      function overlay(c, W, x) { if (x.candle && !x.dead) { const Hd = W.handF; A.glow(c, Hd.ex * S, (Hd.ey - 3) * S, 3.4 * S, '#ffc060', 0.45); } }
      const STANCE = { pelvis: 0, spine: 14, chest: 10, neck: 4, head: 4 }; // encolhido
      const RY = -11.2;
      const base = (o = {}) => Object.assign({ fF: [2.4, 0], fB: [-2.2, 0], hF: [3.4, 3.0], haF: -90, hB: [2.6, 3.8], haB: -60, candle: 1, look: 0, sway: 0 }, o);
      const anims = () => ({
        idle: { n: 8, fps: 8, loop: true, poseFn: (t, i) => { const s = Math.sin(t * A.TAU), tr = (i % 2 ? 0.15 : -0.15); return P(H, STANCE, { spine: s * 0.8, head: -s * 2 }, base({ look: tr * 4, sway: s * 0.3 }), [tr, RY - s * 0.15]); } },
        talk: { n: 8, fps: 7, loop: true, poseFn: (t) => { const s = Math.sin(t * A.TAU); return P(H, STANCE, { spine: -6, chest: -4, neck: 2, head: -12 + s * 2 }, base({ hB: [2.2, 2.4], haB: -100, look: 1, sway: s * 0.3 }), [0, RY - 0.6]); } },
        dead: { n: 1, fps: 1, poseFn: () => A.pose({ pelvis: 90, spine: 2, chest: 2, neck: 4, head: 8, thighF: -10, shinF: 20, footF: 20, thighB: 2, shinB: 10, footB: 30, uarmF: 150, farmF: 30, uarmB: 160, farmB: 20 }, base({ dead: 1, candle: 0, fF: null, fB: null, hF: null, hB: null }), [-5, -3.2]) },
      });
      const portrait = P(H, STANCE, { spine: -6, chest: -4, neck: 2, head: -12 }, base({ hB: [2.2, 2.4], haB: -100, look: 1 }), [0, RY - 0.6]);
      return { H, solve, draw, overlay, anims, portrait, box: [44, 40], anchor: [22, 36], aura: '#ffc060', post: ['#c8c0e0', 0.3] };
    })();

    return { K, people: { ione, hrolf, maren, teodoro } };
  }

  // ---------------------------------------------------------------- folhas de sprites (S = 4)
  const LO = make(4);
  for (const [id, p] of Object.entries(LO.people)) {
    A.register('npc_' + id, () => A.creature({ name: 'npc_' + id, S: 4, box: p.box, anchor: p.anchor, rig: p.H.rig, solve: p.solve, draw: p.draw, overlay: p.overlay, anims: p.anims(), post: LO.K.post(p.post[0], p.post[1], 0.035) }));
    (A.previewCell = A.previewCell || {})['npc_' + id] = [48, 48];
  }

  // ---------------------------------------------------------------- retratos do diálogo (busto, S = 9)
  A.register('portraits', () => {
    const HI = make(18), S = 18, SZ = 15; // busto: 15 unidades × 18 = 270 px
    const images = {};
    for (const [id, p] of Object.entries(HI.people)) {
      const pose = JSON.parse(JSON.stringify(p.portrait));
      p.solve(pose);
      const W = p.H.rig.solve(pose);
      const Hd = W.head, hc = [Hd.x + Math.cos(Hd.a * D2R) * Hd.len * 0.45, Hd.y + Math.sin(Hd.a * D2R) * Hd.len * 0.45];
      const fig = A.mk(SZ * S, SZ * S), fc = fig.getContext('2d');
      fc.translate((SZ * 0.42 - hc[0]) * S, (SZ * 0.36 - hc[1]) * S);
      p.draw(fc, W, pose.extra); if (p.overlay) { fc.save(); p.overlay(fc, W, pose.extra); fc.restore(); }
      A.grain(fig, 0.035, 5);
      A.rim(fig, -S * 0.4, -S * 0.45, p.post[0], p.post[1]);
      const out = A.outline(fig, S * 0.28, '#0a080d');
      // fundo: penumbra quente com a aura da personagem, vinheta e moldura feita pelo CSS
      const cv = A.mk(SZ * S, SZ * S), c = cv.getContext('2d');
      const g = c.createRadialGradient(cv.width * 0.45, cv.height * 0.42, 0, cv.width * 0.5, cv.height * 0.5, cv.width * 0.7);
      g.addColorStop(0, A.rgba(p.aura, 0.32)); g.addColorStop(0.55, 'rgba(26,18,22,0.95)'); g.addColorStop(1, 'rgba(8,6,10,1)');
      c.fillStyle = g; c.fillRect(0, 0, cv.width, cv.height);
      c.drawImage(out, 0, 0);
      const vg = c.createLinearGradient(0, cv.height * 0.7, 0, cv.height); vg.addColorStop(0, 'rgba(8,6,10,0)'); vg.addColorStop(1, 'rgba(8,6,10,0.95)'); c.fillStyle = vg; c.fillRect(0, 0, cv.width, cv.height);
      images[id] = cv;
    }
    return { images, meta: { dir: 'portraits' }, kind: 'images' };
  });
})(window.ART);
