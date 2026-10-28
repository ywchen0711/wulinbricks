// The acting layer: what keeps a figure alive between the keyed poses. Laid over the resting, walking or gesturing
// pose (never over a move or a blow), it adds
//   breath and weight: a slow rise and fall, the weight shifting from foot to foot, small restless movements of the head
//   attention: the head (and, past what a neck can do, the shoulders) turned to whoever he is listening or talking to,
//              the eyes going there first
//   speech: while his voice sounds, beats of the hands, nods, a lean in, as strong as the feeling of the line
//   feeling: the face of the line's feeling (angry, sad, surprised...), fading after it
//   blinks at uneven times, sometimes two together; a start when someone near him shouts
// and then every channel of the pose eases to where it is going through a spring, so nothing ever snaps into place.
const DEFAULT_KEYS = ['armR', 'armL', 'outR', 'outL', 'hipR', 'hipL', 'tilt', 'roll', 'yaw', 'head', 'fwd', 'y', 'wristR', 'wristL'];
const angWrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
// smooth noise, -1..1, from a few sines that never quite repeat
export const wobble = (t, s = 0) => (Math.sin(t * 1.13 + s * 7.1) * 0.5 + Math.sin(t * 0.71 + s * 3.3 + 1.7) * 0.3 + Math.sin(t * 2.31 + s * 1.9 + 0.4) * 0.2);

export const FEELS = {
  angry: { browIn: 1, brow: -0.35, eyes: 0.9, mouth: { smile: -0.45 } }, shout: { browIn: 0.9, brow: -0.2, eyes: 1.05, mouth: { smile: -0.15, wide: 0.9 } },
  surprised: { eyes: 1.38, brow: 0.85, browIn: -0.6, mouth: { round: 0.8, smile: 0 } }, scared: { eyes: 1.3, brow: 0.7, browIn: -0.7, mouth: { smile: -0.5, round: 0.5 } },
  sad: { eyes: 0.85, brow: 0.35, browIn: -0.8, mouth: { smile: -0.55 }, look: [0, -0.35] }, worried: { brow: 0.25, browIn: -0.5, mouth: { smile: -0.25 } },
  thinking: { eyes: 0.82, look: [0.35, 0.3], mouth: { smile: 0.0 }, browIn: 0.3 }, happy: { mouth: { smile: 0.95 }, eyes: 1.0, brow: 0.15 },
  laugh: { happy: 0.7, mouth: { smile: 1, wide: 0.9 } }, proud: { mouth: { smile: 0.65 }, eyes: 0.85, brow: 0.1 }, calm: { mouth: { smile: 0.2 }, eyes: 0.95 },
  shy: { blush: 0.7, look: [0, -0.45], mouth: { smile: 0.45 }, eyes: 0.9 }, excited: { eyes: 1.2, brow: 0.35, mouth: { smile: 0.85, wide: 0.7 } },
};
const STRENGTH = { angry: 1.4, shout: 1.6, excited: 1.3, surprised: 1.1, scared: 1.0, laugh: 1.2, happy: 1.0, proud: 0.9, worried: 0.7, thinking: 0.55, calm: 0.55, sad: 0.4, shy: 0.45 };

export function actor(f) {
  const A = f.act ||= { sp: {}, look: 0, twist: 0, eyes: [0, 0], blinkAt: 1 + (f.phase % 3), blink: 0, beat: 0, beatSide: 1, nextBeat: 0.6, energy: 0, startle: 0, speed: 0 };
  return A;
}
// the attention point of a figure: someone (a fighter) or somewhere (a vector), or where he walks
function attendPoint(f) { const a = f.attend; if (!a) return f.walk ? f.walk.to : null; return a.pos ? a.headPos?.() ?? a.pos : a; }

// lay the acting over a pose p and a face, for a figure not in a move or a blow
export function act(f, p, face, dt, clock, { hands = true } = {}) {
  const A = actor(f), s = f.phase * 3.7 + 1;
  // ---- breath and weight
  const breath = Math.sin(clock * 1.7 + s);
  p.y += breath * 0.004; p.tilt += breath * 0.008 + wobble(clock * 0.35, s) * 0.012;
  if (!f.walk) { const w = wobble(clock * 0.23, s + 2); p.roll += w * 0.03; p.hipR += w * 0.06; p.hipL -= w * 0.06; }
  p.head += wobble(clock * 0.6, s + 5) * 0.07;
  // ---- attention: head first, then the shoulders, the eyes ahead of both
  const target = attendPoint(f);
  if (target) {
    const fp = f.F.root.position, want = Math.atan2(target.x - fp.x, target.z - fp.z), rel = angWrap(want - (f.mark.yaw + (p.yaw || 0)));
    const headTurn = clamp(rel, -0.95, 0.95), twist = clamp(rel - headTurn, -0.45, 0.45) * 0.8;
    A.look += (headTurn - A.look) * Math.min(1, dt * 6); A.twist += (twist - A.twist) * Math.min(1, dt * 3);
    A.eyes[0] += (clamp((rel - A.look) * 1.6, -1, 1) - A.eyes[0]) * Math.min(1, dt * 14);
  } else { A.look *= 1 - Math.min(1, dt * 2); A.twist *= 1 - Math.min(1, dt * 2); A.eyes[0] *= 1 - Math.min(1, dt * 6); }
  p.head += A.look; p.yaw += A.twist;
  // ---- speech: energy from the voice, beats of the hands, nods
  const talking = (f.talk || 0) > 0.05, k = STRENGTH[f.feel] ?? 0.8;
  A.energy += ((talking ? Math.min(1, f.talk * 1.4) : 0) - A.energy) * Math.min(1, dt * (talking ? 10 : 3));
  if (talking) {
    A.nextBeat -= dt;
    if (A.nextBeat <= 0) { A.beat = 1; A.beatSide = -A.beatSide; A.nextBeat = 0.9 + ((Math.sin(clock * 12.9898 + s) * 43758.5453) % 1 + 1) % 1 * 1.1 / Math.max(0.5, k); }
  }
  A.beat = Math.max(0, A.beat - dt * 1.4);
  const b = Math.sin(Math.min(1, 1 - A.beat) * Math.PI) * (A.beat > 0 ? 1 : 0) * k;
  if (hands && b > 0) { const arm = A.beatSide > 0 ? 'armR' : 'armL', out = A.beatSide > 0 ? 'outR' : 'outL'; p[arm] -= 0.55 * b; p[out] += 0.12 * b; if (A.beatSide > 0) p.wristR += 0.3 * b; }
  p.tilt += A.energy * 0.04 * k + Math.sin(clock * 6.3) * A.energy * 0.012 * k; // lean in, small nods
  p.head += Math.sin(clock * 3.1 + s) * A.energy * 0.05 * k;
  // ---- a start, when someone near shouts
  if (A.startle > 0) { A.startle = Math.max(0, A.startle - dt * 2.5); const st = Math.sin(A.startle * Math.PI); p.tilt -= 0.07 * st; p.armR -= 0.15 * st; p.armL -= 0.15 * st; }
  // ---- the face: the line's feeling (fading after it), eyes to the attention, blinks
  if (f.feel && FEELS[f.feel]) { const F0 = FEELS[f.feel]; for (const key in F0) { if (key === 'mouth') face.mouth = { ...(face.mouth || {}), ...F0.mouth, open: face.mouth?.open }; else if (face[key] === undefined || key !== 'blink') face[key] = F0[key]; } }
  if (A.startle > 0.3) { face.eyes = 1.35; face.brow = 0.7; }
  const lk = face.look || [0, 0]; face.look = [clamp(lk[0] + A.eyes[0], -1, 1), lk[1]];
  A.blinkAt -= dt; if (A.blinkAt <= 0) { A.blink = 0.14; A.blinkAt = Math.random() < 0.2 ? 0.25 : 2 + Math.random() * 3.5; }
  if (A.blink > 0) { A.blink -= dt; face.blink = 1; } else if (face.blink && face.blink < 1) face.blink = 0;
  return p;
}

// every channel through a spring toward its target; a move or a blow passes straight through (and resets the springs)
export function settle(f, p, dt, through) {
  const A = actor(f), w = 13, d = Math.exp(-w * dt);
  for (const key of DEFAULT_KEYS) {
    const target = p[key] ?? 0, st = A.sp[key] ||= { x: target, v: 0 };
    if (through) { st.x = target; st.v = 0; continue; }
    // critically damped: x(t) eases to the target without overshoot
    const x0 = st.x - target, v0 = st.v, x1 = (x0 + (v0 + w * x0) * dt) * d, v1 = (v0 - w * (v0 + w * x0) * dt) * d;
    st.x = target + x1; st.v = v1; p[key] = st.x;
  }
  return p;
}
