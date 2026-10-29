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
  lie: { len: 99, pose: { tilt: -1.57, y: 0.15, armR: -0.4, outR: 0.9, armL: -0.4, outL: 0.9, hipR: -0.2, hipL: 0.1, head: 0.4 }, face: { blink: 1, mouth: { open: 0.15, smile: -0.2 } } }, // lying dead (or as if)
  bound: { len: 99, pose: { armR: 0.75, outR: -0.25, armL: 0.75, outL: -0.25, tilt: 0.12, head: 0.0 }, face: { browIn: 1, mouth: { smile: -0.3 } } }, // hands bound behind him
  sit: { len: 99, pose: (t) => ({ hipR: -1.55, hipL: -1.55, y: -0.15, tilt: -0.04, armR: -0.7, outR: 0.05, armL: -0.7, outL: 0.05, head: Math.sin(t * 0.7) * 0.15 }) },
  sitlaugh: { len: 99, pose: (t) => ({ hipR: -1.55, hipL: -1.55, y: -0.15 + Math.abs(Math.sin(t * 10)) * 0.01, tilt: -0.12 + Math.sin(t * 10) * 0.04, armR: -0.9, outR: 0.3, armL: -0.9, outL: 0.3 }), face: { happy: 1, mouth: { open: 0.6, smile: 1 } } },
  sitshock: { len: 99, pose: { hipR: -1.55, hipL: -1.55, y: -0.15, tilt: -0.16, armR: -1.7, outR: 0.4, armL: -1.2, outL: 0.3 }, face: { eyes: 1.4, brow: 0.8, mouth: { open: 0.7, round: 1 } } },
  pick: { len: 1.2, pose: (t) => { const k = Math.sin(Math.min(1, t / 1.2) * Math.PI); return { tilt: 0.75 * k, y: -0.12 * k, armR: -0.4 - 0.9 * k, outR: 0.05, hipR: -0.6 * k, hipL: 0.5 * k }; } }, // bending to pick something up
  look: { len: 2.5, pose: { armR: -1.25, outR: -0.25, armL: -0.3, tilt: 0.12, head: 0 }, face: { eyes: 1.25, brow: 0.5, mouth: { open: 0.2, round: 0.8 } } }, // something held up before his eyes
  tap: { len: 0.9, pose: (t) => { const k = t < 0.35 ? t / 0.35 : Math.max(0, 1 - (t - 0.35) / 0.2); return { armL: -1.0 - 1.4 * k, outL: -0.2, armR: -0.9, outR: -0.2, tilt: -0.05 * k }; } }, // the clapper brought down on the desk
  tell: { len: 99, pose: (t) => ({ armR: -1.2 + Math.sin(t * 2.4) * 0.25, outR: -0.15 + Math.sin(t * 1.3) * 0.2, wristR: Math.sin(t * 2.4) * 0.5, armL: -0.9, outL: -0.15, head: Math.sin(t * 0.6) * 0.35, tilt: Math.sin(t * 0.9) * 0.04 }) }, // telling the tale, fan going
  kneel: { len: 99, pose: { hipR: -1.4, hipL: 0.2, y: -0.2, tilt: 0.1, armR: -0.6, armL: -0.6 } },
  grab: { len: 99, pose: { armR: -1.3, outR: -0.3, armL: -1.3, outL: -0.3, tilt: 0.12 } }, // holding someone
  bow: { len: 1.6, pose: (t) => ({ armR: -1.15, outR: -0.35, armL: -1.15, outL: -0.35, wristR: 0.4, tilt: 0.28 * Math.sin(Math.min(1, t / 1.6) * Math.PI) }) }, // a fist in a palm, bowed
  laugh: { len: 1.6, pose: (t) => ({ tilt: -0.15 + Math.sin(t * 12) * 0.05, armR: 0.25, outR: 0.7, armL: 0.25, outL: 0.7 }), face: { happy: 1, mouth: { open: 0.7, wide: 0.9, smile: 1 } } },
  // ---- for the quiz show
  buzz: { len: 0.7, pose: (t) => { const k = t < 0.18 ? t / 0.18 : t < 0.3 ? 1 - (t - 0.18) / 0.12 * 1.6 : Math.max(0, -0.6 + (t - 0.3) / 0.4 * 0.6); return { armR: -1.0 - 1.6 * Math.max(0, k), outR: 0.05, armL: -0.3, tilt: 0.1 + 0.08 * Math.max(0, -k) }; }, face: { eyes: 1.2, mouth: { open: 0.5, smile: 0.6 } } }, // a hand up and slammed down on the buzzer
  clap: { len: 2, pose: (t) => { const k = Math.abs(Math.sin(t * 11)); return { armR: -1.3, outR: -0.15 - 0.3 * k, armL: -1.3, outL: -0.15 - 0.3 * k }; }, face: { happy: 0.8, mouth: { open: 0.4, smile: 1 } } },
  write: { len: 99, pose: (t) => ({ armR: -1.05 + Math.sin(t * 9) * 0.06, outR: -0.25, wristR: 0.3 + Math.sin(t * 13) * 0.2, armL: -1.0, outL: -0.3, tilt: 0.22, head: Math.sin(t * 1.3) * 0.08 }), face: { browIn: 0.7, look: [0, -0.5], mouth: { smile: 0.1 } } }, // writing on a board held before him
  show: { len: 99, pose: { armR: -1.75, outR: -0.18, armL: -1.75, outL: -0.18, tilt: -0.05 }, face: { mouth: { open: 0.4, smile: 0.8 }, eyes: 1.1 } }, // a board held up in both hands
  cry: { len: 99, pose: (t) => ({ armR: -2.1 + Math.sin(t * 3) * 0.08, outR: -0.45, wristR: 0.3, armL: -0.5, outL: 0.1, tilt: 0.12, head: Math.sin(t * 2.2) * 0.1, y: Math.sin(t * 9) * 0.006 }), face: { blink: 1, brow: 0.6, browIn: -0.9, mouth: { open: 0.3, smile: -0.6 } } }, // wiping his eyes
  think: { len: 2.2, pose: { armR: -1.9, outR: -0.5, wristR: 0.6, armL: -0.9, outL: -0.4, head: 0.25, tilt: 0.04 }, face: { look: [0.4, 0.4], browIn: 0.5, mouth: { smile: 0, round: 0.5 } } }, // a finger to his chin
  facepalm: { len: 1.8, pose: { armR: -2.3, outR: -0.55, wristR: 0.4, armL: -0.2, tilt: 0.2, head: -0.1 }, face: { blink: 1, mouth: { smile: -0.3 } } },
  jump: { len: 1.2, pose: (t) => { const k = Math.max(0, Math.sin(t / 1.2 * Math.PI * 2)); return { armR: -2.9, outR: 0.4, armL: -2.9, outL: 0.4, y: 0.22 * k, hipR: -0.5 * k, hipL: -0.5 * k }; }, face: { happy: 1, mouth: { open: 0.7, smile: 1 } } },
  wave: { len: 2, pose: (t) => ({ armR: -2.7, outR: 0.35 + Math.sin(t * 9) * 0.3, armL: -0.3 }), face: { happy: 0.8, mouth: { open: 0.4, smile: 1 } } },
  present: { len: 1.6, pose: { armR: -0.8, outR: 0.85, wristR: -0.3, armL: -0.7, outL: -0.05 }, face: { mouth: { open: 0.4, smile: 0.9 } } }, // the host's open hand toward someone
  mic: { len: 99, pose: (t) => ({ armR: -1.55, outR: -0.35, wristR: 0.2, armL: -0.7, outL: -0.05, tilt: 0.06 + Math.sin(t * 1.1) * 0.02 }) }, // holding the microphone out to someone
  kneelmic: { len: 99, pose: { hipR: -1.4, hipL: 0.2, y: -0.22, tilt: 0.12, armR: -1.45, outR: -0.35, wristR: 0.2, armL: -0.6 } }, // down on one knee, the microphone held out
  eat: { len: 1.6, pose: (t) => ({ armL: -1.9 - Math.sin(t * 8) * 0.12, outL: -0.5, wristL: 0.5, armR: -0.3, head: 0.08 }), face: { happy: 0.6, mouth: { open: 0.55, smile: 0.6 } } }, // a bite of the drumstick
  laughbig: { len: 2.2, pose: (t) => ({ tilt: -0.22 + Math.sin(t * 13) * 0.07, armR: -0.6, outR: 0.5, armL: -0.9, outL: -0.3, wristL: 0.4, y: Math.abs(Math.sin(t * 13)) * 0.01 }), face: { happy: 1, mouth: { open: 0.8, wide: 1, smile: 1 } } },
  catch: { len: 99, pose: { armR: -1.3, outR: -0.2, armL: -1.5, outL: -0.35, tilt: -0.05 } }, // holding something caught against his chest
  hug: { len: 99, pose: { armR: -1.35, outR: -0.55, armL: -1.35, outL: -0.55, tilt: 0.1 }, face: { happy: 1, mouth: { smile: 1 } } },
};
