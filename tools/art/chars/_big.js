// Vesperal — ateliê: peças das variantes grandes dos inimigos (grilhetas, fendas de brasa, penacho, capa, cornos,
// coroa de espinhos, cracas e algas). Servem qualquer esqueleto com ossos { x, y, a, len, ex, ey }.
// Convenção dos humanoides de perfil (a olhar para a direita): +perp de um osso vertical aponta para a frente.
'use strict';
(function (A) {
  const D2R = A.D2R, TAU = A.TAU;
  A.bigParts = function (K, S) {
    const P = {};
    const dir = (B) => [Math.cos(B.a * D2R), Math.sin(B.a * D2R)];
    const end = (B) => K.along(B, 1);
    // grilheta no pulso, com um troço de corrente partida a pender (sway: balanço da animação)
    P.shackle = function (ctx, F, iron, sway) {
      const [wx, wy] = K.along(F, 0.8), [nx, ny] = K.perp(F), [dx, dy] = dir(F);
      K.line(ctx, [[wx - nx * 0.82 - dx * 0.3, wy - ny * 0.82 - dy * 0.3], [wx + nx * 0.82 - dx * 0.3, wy + ny * 0.82 - dy * 0.3]], 0.7, iron.deep || '#121116');
      K.line(ctx, [[wx - nx * 0.76, wy - ny * 0.76], [wx + nx * 0.76, wy + ny * 0.76]], 0.6, iron.base);
      K.line(ctx, [[wx - nx * 0.62 + dx * 0.16, wy - ny * 0.62 + dy * 0.16], [wx + nx * 0.62 + dx * 0.16, wy + ny * 0.62 + dy * 0.16]], 0.14, iron.light);
      const sw = (sway || 0) * 0.35;
      for (let i = 0; i < 4; i++) {
        const lx = wx + Math.sin(sw) * 0.7 * (i + 1), ly = wy + 0.7 + i * 0.95;
        ctx.strokeStyle = iron.deep || '#121116'; ctx.lineWidth = S * 0.3;
        ctx.beginPath(); ctx.ellipse(lx * S, ly * S, (i % 2 ? 0.2 : 0.45) * S, 0.56 * S, sw * 0.5, 0, TAU); ctx.stroke();
        ctx.strokeStyle = iron.light; ctx.lineWidth = S * 0.1; ctx.stroke();
      }
    };
    // fendas de brasa ao longo de um osso do tronco (a cinza por dentro ainda arde)
    P.cracks = function (ctx, B, k, seed, spread) {
      const r = A.rng(seed || 7), [nx, ny] = K.perp(B), sp = spread || 1;
      for (let j = 0; j < 2; j++) {
        const pts = [], off = j ? -0.5 * sp : 0.7 * sp;
        for (let i = 0; i <= 4; i++) { const [bx, by] = K.along(B, 0.1 + i * 0.2); const o = off + (r() - 0.5) * 0.9 * sp; pts.push([bx + nx * o, by + ny * o]); }
        K.line(ctx, pts, 0.46, '#2a0c04');
        K.line(ctx, pts, 0.24, '#ff7020');
        K.line(ctx, pts, 0.09, '#ffe2a8');
        K.ember(ctx, pts[2][0], pts[2][1], 0.3, k === undefined ? 1 : k);
      }
    };
    // penacho no alto do elmo, a cair para trás
    P.plume = function (ctx, Hd, m, sway) {
      const [cx, cy] = end(Hd), [ux, uy] = dir(Hd), [nx, ny] = K.perp(Hd), s = (sway || 0) * 0.4;
      const pt = (u, b) => [cx + ux * u - nx * b, cy + uy * u - ny * b];
      const pts = [pt(-0.2, 0), pt(1.6, 0.6), pt(1.9 + s * 0.3, 2.6), pt(0.6 + s, 4.6), pt(-1.4 + s * 1.5, 5.4)];
      K.tube(ctx, pts, [0.55, 1.15, 1.25, 0.85, 0.15], m, { depth: S * 0.4, hlw: S * 0.25 });
      for (let i = 0; i < 4; i++) { const q = 0.25 + i * 0.18; K.line(ctx, [pt(1.4 - i * 0.3, 0.9 + i * 0.5), pt(0.6 + s - i * 0.5, 3.0 + i * 0.7 + q)], 0.1, A.rgba(m.light, 0.7)); }
    };
    // capa presa aos ombros, a cair pelas costas até abaixo dos joelhos (desenhada antes do corpo)
    P.cape = function (ctx, W, m, sway) {
      const C = W.chest, Sp = W.spine, [nx, ny] = K.perp(C), s = (sway || 0);
      const [sx, sy] = K.along(C, 0.92), [mx, my] = K.along(Sp, 0.3);
      const knee = W.shinB || W.shinF, ky = knee ? knee.y + 1.6 : my + 8;
      const top = [sx - nx * 1.4, sy - ny * 1.4], hemY = ky + 1.0;
      const hx = mx - 3.6 + s * 0.8, r = A.rng(17);
      const path = A.path((q) => {
        q.M(top[0] + 1.0, top[1] - 0.2);
        q.Q(top[0] - 2.6, top[1] + 0.6, hx - 0.6, (top[1] + hemY) * 0.5);
        q.Q(hx - 1.2 + s * 0.4, hemY - 1.5, hx - 0.8 + s, hemY);
        for (let i = 1; i <= 5; i++) q.L(hx - 0.8 + s + i * 1.05, hemY + (i % 2 ? 0.7 : 0) + r() * 0.4);
        q.L(mx + 1.2, my + 2.0); q.L(sx + 0.2, sy + 0.6); q.Z();
      }, S);
      K.paint(ctx, path, m, { depth: S * 0.9, hlw: S * 0.3 });
      ctx.save(); ctx.clip(path);
      for (let i = 0; i < 3; i++) K.line(ctx, [[top[0] - 0.6 - i * 0.8, top[1] + 1.2], [hx + 0.4 + i * 1.3 + s * 0.6, hemY - 0.2]], 0.3, A.rgba(m.deep || m.shadow, 0.55));
      ctx.restore();
    };
    // cornos a sair do alto da cabeça, curvados para trás (o de longe mais escuro)
    P.horns = function (ctx, Hd, m, len) {
      const [ux, uy] = dir(Hd), [nx, ny] = K.perp(Hd), L = len || 1;
      const base = K.along(Hd, 0.82);
      const horn = (off, mm) => {
        const b = [base[0] + nx * off, base[1] + ny * off];
        const pts = [b, [b[0] + ux * 1.4 * L - nx * 0.7 * L, b[1] + uy * 1.4 * L - ny * 0.7 * L], [b[0] + ux * 2.3 * L - nx * 2.0 * L, b[1] + uy * 2.3 * L - ny * 2.0 * L], [b[0] + ux * 2.0 * L - nx * 3.2 * L, b[1] + uy * 2.0 * L - ny * 3.2 * L]];
        K.tube(ctx, pts, [0.62, 0.48, 0.3, 0.05], mm, { depth: S * 0.25, hlw: S * 0.15 });
        for (let i = 1; i < 3; i++) K.line(ctx, [[pts[i][0] - nx * 0.3, pts[i][1] - ny * 0.3], [pts[i][0] + ux * 0.3, pts[i][1] + uy * 0.3]], 0.08, A.rgba(mm.deep || '#000', 0.6));
      };
      horn(-0.5, K.dim(m, 0.7));
      horn(0.6, m);
    };
    // coroa de espinhos à volta da cabeça
    P.thorns = function (ctx, Hd, m) {
      const [cx, cy] = K.along(Hd, 0.55), [ux, uy] = dir(Hd);
      for (let i = 0; i < 7; i++) {
        const th = (-75 + i * 25) * D2R, vx = ux * Math.cos(th) - uy * Math.sin(th), vy = ux * Math.sin(th) + uy * Math.cos(th);
        const b = [cx + vx * 1.9, cy + vy * 1.9], t = [cx + vx * 3.0, cy + vy * 3.0], px = -vy * 0.28, py = vx * 0.28;
        K.poly(ctx, [[b[0] - px, b[1] - py], t, [b[0] + px, b[1] + py]], m, { depth: S * 0.1 });
      }
      const [nx, ny] = K.perp(Hd);
      K.line(ctx, [[cx - nx * 2.0 + ux * 0.6, cy - ny * 2.0 + uy * 0.6], [cx + nx * 2.0 + ux * 0.9, cy + ny * 2.0 + uy * 0.9]], 0.34, m.base);
    };
    // cracas agarradas à pele (pontos de um esqueleto: [osso, t, desvio])
    P.barnacles = function (ctx, spots, seed) {
      const r = A.rng(seed || 5);
      for (const [B, t, o] of spots) {
        const [bx, by] = K.along(B, t), [nx, ny] = K.perp(B);
        for (let i = 0; i < 4; i++) {
          const x = bx + nx * o + (r() - 0.5) * 1.2, y = by + ny * o + (r() - 0.5) * 1.2, rr = 0.22 + r() * 0.24;
          K.dot(ctx, x, y, rr + 0.08, '#3a3832'); K.dot(ctx, x, y, rr, '#c8c2b0'); K.dot(ctx, x - rr * 0.25, y - rr * 0.3, rr * 0.35, '#efe9d8'); K.dot(ctx, x + rr * 0.1, y + rr * 0.1, rr * 0.32, '#2a2622');
        }
      }
    };
    // algas a pender de um osso (antebraço, ombro)
    P.kelp = function (ctx, B, t, col, len, sway) {
      const [bx, by] = K.along(B, t), s = (sway || 0) * 0.5;
      for (let i = 0; i < 3; i++) {
        const x0 = bx + (i - 1) * 0.35, L = (len || 3) * (0.7 + i * 0.2), pts = [];
        for (let j = 0; j <= 5; j++) { const k = j / 5; pts.push([x0 + Math.sin(k * 5 + i) * 0.35 + s * k * 1.5, by + 0.3 + k * L]); }
        K.line(ctx, pts, 0.24 - i * 0.04, col);
      }
    };
    return P;
  };
})(window.ART);
