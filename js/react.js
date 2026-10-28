// How a figure takes a blow, laid over whatever it was doing. Three weights:
//   light  (a flinch: rocked back on his heels, eyes screwed shut, hands up, a half step back)
//   heavy  (knocked back: thrown off his feet a moment, arms flung out, staggering back a few steps, then walking
//           back to his mark)
//   down   (knocked down: lifted and thrown back through the air, flat on his back, a moment dazed, then up in one
//           spring like a carp leaping (鯉魚打挺), and back to his mark)
// reactAt(kind, t) -> { push: how far along the blow he has been driven, the pose changes, a face, done }.
const sm = (u) => { u = Math.max(0, Math.min(1, u)); return u * u * (3 - 2 * u); };
const out = (u) => 1 - (1 - Math.max(0, Math.min(1, u))) ** 3;
const seg = (t, a, b) => Math.max(0, Math.min(1, (t - a) / (b - a)));
export const REACT = { light: 0.75, heavy: 2.3, down: 4.0 };
export const weightOf = (power) => (power >= 0.85 ? 'down' : power >= 0.45 ? 'heavy' : 'light');
const walk = (dist, k = 1) => { const ph = dist / 0.32 * Math.PI; return { hipR: Math.sin(ph) * 0.5 * k, hipL: -Math.sin(ph) * 0.5 * k, armR: -Math.sin(ph) * 0.3 * k, armL: Math.sin(ph) * 0.3 * k }; };
const PAIN = { blink: 1, brow: 0.2, browIn: 1, mouth: { open: 0.6, round: 0.7, wide: 0.3, smile: -0.4 } };
const DAZED = { blink: 1, mouth: { open: 0.25, round: 1, smile: -0.2 } };
const GRIT = { browIn: 1, brow: -0.2, mouth: { smile: -0.3 } };

export function reactAt(kind, t) {
  const d = { tilt: 0, roll: 0, y: 0, hipR: 0, hipL: 0, armR: 0, armL: 0, outR: 0, outL: 0, head: 0 };
  if (kind === 'light') {
    const e = t < 0.08 ? t / 0.08 : Math.max(0, 1 - (t - 0.08) / 0.6), push = 0.2 * out(t / 0.15) * (1 - sm(seg(t, 0.35, 0.75)));
    Object.assign(d, { tilt: -0.35 * e, head: 0.35 * e, armR: -0.7 * e, armL: -0.7 * e, outR: 0.25 * e, outL: 0.25 * e, hipL: 0.25 * e, hipR: -0.15 * e });
    return { push, d, face: t < 0.45 ? PAIN : GRIT, done: t >= REACT.light, over: true };
  }
  if (kind === 'heavy') {
    const hit = Math.min(1, t / 0.1), back = out(seg(t, 0, 0.7)) * 1.1, ret = sm(seg(t, 1.15, 2.3)), push = back * (1 - ret);
    const fling = hit * (1 - sm(seg(t, 0.3, 1.0)));
    Object.assign(d, { tilt: -0.6 * fling - 0.1 * (1 - fling) * (t < 1.1 ? 1 : 0) + 0.12 * sm(seg(t, 0.75, 1.05)) * (1 - ret), y: 0.06 * Math.sin(Math.PI * seg(t, 0, 0.35)), outR: 1.0 * fling, outL: 1.0 * fling, armR: 0.6 * fling, armL: 0.6 * fling, head: 0.4 * fling, roll: 0.08 * Math.sin(t * 9) * fling });
    if (t > 0.15 && t < 0.9) { const w = walk(back * 1.4, 1 - seg(t, 0.6, 0.9)); for (const k in w) d[k] += w[k]; }
    if (t > 1.15) { const w = walk((1.1 - push) * 1.0, Math.sin(Math.PI * ret)); for (const k in w) d[k] += w[k]; }
    return { push, d, face: t < 0.9 ? PAIN : GRIT, done: t >= REACT.heavy, over: true };
  }
  // knocked down
  const fly = out(seg(t, 0.05, 0.6)), lie = seg(t, 0.55, 0.7), up = seg(t, 1.7, 2.15), ret = sm(seg(t, 2.45, 4.0));
  const push = (0.2 + 1.5 * fly) * (1 - ret);
  const tilt = t < 0.55 ? -0.35 - 0.85 * fly : t < 1.7 ? -1.2 - 0.37 * out(lie) : -1.57 * (1 - out(up));
  const y = (t < 0.6 ? 0.38 * Math.sin(Math.PI * fly) : 0) + (t >= 0.55 && t < 1.7 ? 0.15 * out(lie) + Math.max(0, 0.06 * Math.sin(Math.PI * seg(t, 0.7, 0.9))) : 0) + (t >= 1.7 ? 0.15 * (1 - out(up)) + 0.3 * Math.sin(Math.PI * up) : 0);
  const sprawl = t < 1.7 ? Math.min(1, t / 0.12) : 1 - up;
  Object.assign(d, { tilt, y, outR: 1.1 * sprawl, outL: 1.1 * sprawl, armR: -0.8 * sprawl, armL: -0.8 * sprawl, hipR: -0.5 * sprawl * (t < 0.6 ? 1 : 0.4), hipL: -0.2 * sprawl, head: t > 0.75 && t < 1.7 ? Math.sin(t * 5) * 0.5 : 0 });
  if (t > 1.7 && t < 2.3) { d.hipR += -1.2 * Math.sin(Math.PI * up); d.hipL += -1.2 * Math.sin(Math.PI * up); } // the legs kick up to spring him
  if (t > 2.45) { const w = walk((1.7 - push) * 1.0, Math.sin(Math.PI * ret)); for (const k in w) d[k] += w[k]; }
  return { push, d, face: t < 0.7 ? PAIN : t < 1.7 ? DAZED : GRIT, done: t >= REACT.down, over: t < 2.3 };
}
