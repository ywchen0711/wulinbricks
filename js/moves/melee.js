// Plain blows, for anyone: 重拳 a heavy punch, and 掄棍 a club swung down over the head. Whoever stands within reach in
// front at the moment of contact takes it.
const hitFront = (c, { reach, width = 0.65, power }) => {
  for (const f of c.foes) { const l = c.toLocal(f.pos); if (l.z > 0.1 && l.z < reach && Math.abs(l.x) < width) { f.hit({ power, dir: c.dirWorld(c.V(0, 0, 1)), at: f.pos.add(c.V(0, f.CH.spec.age === 'kid' ? 0.6 : 0.95, 0)) }); return true; } }
  return false;
};
const REST = { armR: 0.15, outR: 0.5, armL: 0.15, outL: 0.5, hipR: -0.12, hipL: 0.12 };
export const PUNCH = {
  id: 'punch', name: { zh: '重拳', en: 'Heavy Punch' }, desc: { zh: '後拉一拳，踏步打出。', en: 'A fist drawn back, then thrown with a step.' }, len: 1.0,
  keys: [
    { t: 0.0, p: REST },
    { t: 0.3, p: { armR: 0.7, outR: 0.4, armL: -1.2, outL: 0.1, hipR: 0.2, hipL: -0.1, tilt: -0.08, yaw: 0.45 } },
    { t: 0.42, ease: 'in', p: { armR: -1.6, outR: 0.0, armL: 0.5, outL: 0.3, hipR: -0.6, hipL: 0.4, tilt: 0.25, yaw: -0.25, fwd: 0.32 } },
    { t: 0.6, p: { armR: -1.5, outR: 0.0, armL: 0.4, outL: 0.3, hipR: -0.55, hipL: 0.4, tilt: 0.2, yaw: -0.2, fwd: 0.32 } },
    { t: 1.0, p: { ...REST, fwd: 0 } },
  ],
  face: (t) => (t < 0.3 ? { browIn: 1, mouth: { smile: 0.4 } } : t < 0.7 ? { browIn: 1, mouth: { open: 0.8, wide: 0.8, smile: -0.1 } } : { mouth: { smile: 0.5 } }),
  cam: [{ t: 0, pos: [1.6, 1.2, 2.0], look: [0, 0.9, 0.8], fov: 40 }, { t: 1, pos: [1.6, 1.2, 2.0], look: [0, 0.9, 0.8], fov: 40 }],
  events: [{ t: 0.33, run: (c) => c.sfx.swing(0.7) }, { t: 0.42, run: (c) => hitFront(c, { reach: 1.05, power: 0.35 }) }],
};
export const CLUB = {
  id: 'club', name: { zh: '掄棍', en: 'Club Swing' }, desc: { zh: '木棍高舉過頭，狠狠砸下。', en: 'The club raised high over the head and brought down hard.' }, len: 1.5,
  keys: [
    { t: 0.0, p: REST },
    { t: 0.5, ease: 'out', p: { armR: -3.0, outR: 0.1, armL: -1.0, outL: 0.2, hipR: 0.1, hipL: 0.0, tilt: -0.2, yaw: 0.15 } },
    { t: 0.66, ease: 'in', p: { armR: -0.5, outR: 0.0, armL: 0.4, outL: 0.3, hipR: -0.7, hipL: 0.45, tilt: 0.35, yaw: 0.0, fwd: 0.35, y: -0.05 } },
    { t: 0.95, p: { armR: -0.4, outR: 0.0, armL: 0.35, outL: 0.3, hipR: -0.65, hipL: 0.45, tilt: 0.3, fwd: 0.35, y: -0.05 } },
    { t: 1.5, p: { ...REST, fwd: 0 } },
  ],
  face: (t) => (t < 0.5 ? { browIn: 1, mouth: { open: 0.4, wide: 0.9, smile: 0.5 } } : t < 1 ? { browIn: 1, mouth: { open: 0.9, wide: 0.8 } } : { mouth: { smile: 0.6 } }),
  cam: [{ t: 0, pos: [1.8, 1.3, 2.2], look: [0, 0.9, 0.8], fov: 42 }, { t: 1.5, pos: [1.8, 1.3, 2.2], look: [0, 0.9, 0.8], fov: 42 }],
  events: [{ t: 0.55, run: (c) => c.sfx.swing(1) }, { t: 0.66, run: (c) => hitFront(c, { reach: 1.55, power: 0.95, width: 0.8 }) }],
};
export const KICK = {
  id: 'kick', name: { zh: '踢球', en: 'A kick' }, desc: { zh: '隨腳一踢。', en: 'Just a kick.' }, len: 0.9,
  keys: [
    { t: 0.0, p: { armR: 0.1, outR: 0.28, armL: -0.1, outL: 0.28, hipR: -0.15, hipL: 0.1, yaw: 0.15 } },
    { t: 0.25, p: { armR: 0.3, outR: 0.4, armL: -0.4, outL: 0.4, hipR: 0.7, hipL: 0.0, tilt: 0.08, yaw: 0.1 } },
    { t: 0.38, ease: 'in', p: { armR: -0.3, outR: 0.4, armL: 0.3, outL: 0.4, hipR: -1.2, hipL: 0.15, tilt: -0.12, yaw: 0.0, fwd: 0.08 } },
    { t: 0.9, p: { armR: 0.1, outR: 0.28, armL: -0.1, outL: 0.28, hipR: -0.15, hipL: 0.1, yaw: 0.15, fwd: 0 } },
  ],
  face: (t) => (t < 0.3 ? { mouth: { smile: 0.6 }, browIn: 0.5 } : { happy: 1, mouth: { open: 0.5, smile: 1 } }),
  cam: [{ t: 0, pos: [1.6, 0.8, 2.0], look: [0, 0.4, 1.0], fov: 42 }, { t: 0.9, pos: [1.6, 0.8, 2.0], look: [0, 0.4, 1.5], fov: 42 }],
  start(c) { const h = c.hero; if (h.loose) { h.loose = null; } },
  events: [{ t: 0.38, run: (c) => { const h = c.hero; if (!h.ball) return; c.sfx.bounce(); h.home = { ...c.me.mark }; const up = c.me.kickUp ?? 3.2, sp = c.me.kickSpeed ?? 5.5; h.loose = { v: c.dirWorld(c.V(0, 0, 1)).multiplyScalar(sp).add(c.V(0, up, 0)), owner: c.me, spin: 0 }; } }],
  tick(c) { const h = c.hero; if (c.t < 0.38 && h.ball && !h.loose) h.ballAt(h.toe(0.2)); },
};
