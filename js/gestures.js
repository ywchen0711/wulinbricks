// Small actions for the films, laid over a figure at rest: each a pose (or a pose over time) and maybe a face.
// f.gest('point'); f.gest('raise', { hold: true })
export const GESTURES = {
  point: { len: 1.4, pose: { armR: -1.6, outR: 0.1, armL: -0.2, head: 0 }, face: { browIn: 0.8, mouth: { open: 0.3, smile: -0.2 } } },
  hips: { len: 2, pose: { armR: 0.2, outR: 0.75, armL: 0.2, outL: 0.75, tilt: -0.05 }, face: { mouth: { smile: 0.6 }, browIn: 0.5 } }, // hands on hips, a sneer
  raise: { len: 1.5, pose: { armR: -3.0, outR: 0.05, armL: -0.9, tilt: -0.12 }, face: { browIn: 1, mouth: { open: 0.5, wide: 0.8, smile: 0.4 } } }, // a weapon up over the head
  cower: { len: 1.5, pose: { armR: -1.9, outR: -0.4, armL: -1.9, outL: -0.4, tilt: 0.25, y: -0.05, hipR: -0.3, hipL: 0.3, head: 0.3 }, face: { blink: 1, browIn: -0.6, brow: 0.5, mouth: { open: 0.3, round: 1, smile: -0.5 } } },
  cheer: { len: 1.6, pose: (t) => ({ armR: -2.9, outR: 0.4, armL: -2.9, outL: 0.4, y: Math.max(0, Math.sin(t * 9)) * 0.06 }), face: { happy: 1, mouth: { open: 0.6, smile: 1 } } },
  fist: { len: 1.6, pose: { armR: -1.15, outR: -0.35, armL: -1.15, outL: -0.35, wristR: 0.4, tilt: 0.12 } }, // 抱拳: fist in palm, a bow
  shrug: { len: 1.2, pose: { armR: -0.5, outR: 0.9, armL: -0.5, outL: 0.9, head: 0.2 }, face: { mouth: { smile: 0.2 }, brow: 0.6 } },
  guard: { len: 2, pose: { armR: -1.2, outR: 0.2, armL: -1.0, outL: -0.2, hipR: -0.35, hipL: 0.3, tilt: 0.08 }, face: { browIn: 1, mouth: { smile: -0.2 } } },
  scared: { len: 1.4, pose: (t) => ({ armR: -2.6, outR: 0.6, armL: -2.6, outL: 0.6, tilt: -0.15, y: Math.abs(Math.sin(t * 14)) * 0.03 }), face: { eyes: 1.4, brow: 0.8, mouth: { open: 0.9, round: 1 } } },
  laugh: { len: 1.6, pose: (t) => ({ tilt: -0.15 + Math.sin(t * 12) * 0.05, armR: 0.25, outR: 0.7, armL: 0.25, outL: 0.7 }), face: { happy: 1, mouth: { open: 0.7, wide: 0.9, smile: 1 } } },
};
