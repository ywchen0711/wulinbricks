// What happens when things meet, each frame after everyone has moved.
//   Projectiles (a crescent of sword qi, a whirlwind ball...) are reported by the moves that own them; two from
//   different owners that touch clash: if their power is close they cancel each other out in a burst (a ball is not
//   destroyed, it is knocked away and goes on under its own physics); otherwise the stronger breaks through, weakened
//   by what it overcame, and the weaker is broken or knocked aside.
//   Bodies are upright cylinders that cannot pass through each other: standing figures shove apart; a figure thrown
//   back by a blow crashes into whoever is behind him and knocks him on in turn.
// A projectile: { kind, owner, pos, vel, r (across), h (half its height), power, name, cancel(other, at), weaken(k) }
import * as THREE from '../lib/three.module.min.js';

const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
export const bodyR = (f) => (f.CH.spec.age === 'kid' ? 0.22 : 0.28);
const lying = (f) => f.react?.kind === 'down' && f.react.t > 0.55 && f.react.t < 2.0;

export function resolve(W, list) {
  // projectiles against each other
  for (let i = 0; i < list.length; i++) for (let j = i + 1; j < list.length; j++) {
    const a = list[i], b = list[j]; if (a.owner === b.owner || a.dead || b.dead) continue;
    const key = [a.id, b.id].sort().join('|'); if (W._clashed.has(key)) continue;
    const dx = a.pos.x - b.pos.x, dz = a.pos.z - b.pos.z, horiz = Math.hypot(dx, dz), vert = Math.abs(a.pos.y - b.pos.y);
    // swept: they may pass each other inside one frame, so also catch them closing past each other
    const rel = a.vel.clone().sub(b.vel), step = rel.length() * (W._dt || 1 / 60);
    if (horiz > a.r + b.r + step || vert > (a.h || a.r) + (b.h || b.r)) continue;
    W._clashed.add(key); clash(W, a, b);
  }
  // bodies against each other
  const F = W.fighters;
  for (let i = 0; i < F.length; i++) for (let j = i + 1; j < F.length; j++) {
    const a = F[i], b = F[j]; if (lying(a) || lying(b) || a.hidden || b.hidden || a.gesture?.G.len === 99 || b.gesture?.G.len === 99) continue;
    const pa = a.F.root.position, pb = b.F.root.position, d = V(pb.x - pa.x, 0, pb.z - pa.z), L = d.length(), min = bodyR(a) + bodyR(b);
    if (L >= min || L < 1e-5) continue;
    const n = d.divideScalar(L), over = min - L;
    // one thrown into the other: the other is knocked on, the way the first was going
    const flyer = [a, b].find((f) => f.react && f.react.kind !== 'light' && f.react.t < 0.7 && !f.react.domino?.includes(f === a ? b : a));
    if (flyer) { const other = flyer === a ? b : a, dir = flyer.react.dir; (flyer.react.domino ||= []).push(other); if (!other.react || other.react.kind === 'light') { other.hit({ kind: flyer.react.kind === 'down' ? 'heavy' : 'light', dir, at: other.pos.add(V(0, 0.7, 0)), fx: 'bump' }); W.note?.('bump', other.pos.add(V(0, 1.2, 0))); } continue; }
    // otherwise shoved apart: those standing give way by moving their marks, those reeling by their push
    const share = (f, s) => { const off = n.clone().multiplyScalar(s * over * 0.5); if (f.react) f.react.from.add(off); else { f.mark.x += off.x; f.mark.z += off.z; } };
    share(a, -1); share(b, 1);
  }
}

function clash(W, a, b) {
  const at = a.pos.clone().lerp(b.pos, 0.5), diff = a.power - b.power;
  W.fx.clashBurst(at, Math.max(a.power, b.power)); W.sfx.clash(Math.min(1.2, a.power + b.power) / 1.2); W.freeze = Math.max(W.freeze, 0.18); W.fx.S.shake = Math.max(W.fx.S.shake, 0.45);
  if (Math.abs(diff) < 0.18) { a.cancel(b, at); b.cancel(a, at); W.note?.('cancel', at, { a, b }); return; }
  const [win, lose] = diff > 0 ? [a, b] : [b, a];
  lose.cancel(win, at); win.weaken(lose.power * 0.6); W.note?.('win', at, { win, lose });
}

// a loose ball, under gravity: bouncing off the floor, rolling to a stop, glancing off anyone it runs into
export function ballStep(ball, st, dt, W, R) {
  const p = ball.position, v = st.v;
  v.y -= 9.8 * dt; p.addScaledVector(v, dt);
  if (p.y < R) { p.y = R; if (v.y < -0.8) { v.y = -v.y * 0.55; W.sfx.bounce?.(); } else v.y = 0; v.x *= 1 - Math.min(1, 1.4 * dt); v.z *= 1 - Math.min(1, 1.4 * dt); }
  for (const f of W.fighters) {
    if (lying(f) || f.hidden) continue; const fp = f.F.root.position, d = V(p.x - fp.x, 0, p.z - fp.z), L = d.length(), min = bodyR(f) + R;
    if (L >= min || p.y > f.F.height * 0.9 || L < 1e-5) continue;
    const n = d.divideScalar(L), vn = v.x * n.x + v.z * n.z; p.x = fp.x + n.x * min; p.z = fp.z + n.z * min;
    if (vn < 0) { const speed = Math.hypot(v.x, v.z); v.x -= 1.5 * vn * n.x; v.z -= 1.5 * vn * n.z; v.multiplyScalar(0.6); if (speed > 5 && f !== st.owner && !f.react) f.hit({ kind: 'light', dir: n.clone().multiplyScalar(-1), at: p.clone(), fx: 'bump' }); }
  }
  const sp = v.length(); st.spin = sp / R; st.rest = sp < 0.05 && p.y <= R + 1e-3;
  return st;
}
