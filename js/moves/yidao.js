// 一刀啟程 One Cut to Set Out: he draws back and gathers his qi along the blade (the steel lights up, the wind turns
// round his feet), lifts the saber high over his head, and with a step forward brings it down in one cut. The cut
// leaves the blade as a crescent of sword qi (劍氣), standing upright, that runs on along the ground, splitting
// whatever stands in its way, a post and then a wall, and fades on the far side.
//   key poses (minifig angles; fwd = a step along his facing), how to ease into each, the moments things happen,
//   his face, and a camera to watch it with.
export const YIDAO = {
  id: 'yidao',
  name: { zh: '一刀啟程', en: 'One Cut to Set Out' },
  desc: {
    zh: '收刀蓄氣，刀身漸亮；舉刀過頂，踏步一劈，刀勢化成一道直立的半月劍氣貼地飛出，劈開前方的木樁與石牆。',
    en: 'He gathers his qi until the blade shines, lifts it over his head and, stepping in, cuts down once: the cut flies on as an upright crescent of sword qi that splits the post and the wall ahead.',
  },
  len: 3.6,
  launch: 1.17, // the moment the qi leaves the blade
  hitstop: 1.17,
  // what happens, and when (ctx: fx, sfx, targets, hero, p the pose, rate)
  events: [
    { t: 0.3, run: (c) => c.sfx.gather(c.rate) },
    { t: 1.04, run: (c) => c.sfx.cut(c.rate) },
    { t: 1.17, run: (c) => { c.sfx.launch(c.rate); c.fx.launch(c.toWorld(c.V(0, 0.95, c.p.fwd + 0.95)), c.dirWorld(c.V(0, 0, 1))); c.fx.S.wave.hitList = []; c.fx.S.wave.power = c.me.power ?? 0.8 + Math.random() * 0.4; c.fx.S.wave.id = 'qi' + Math.random(); } },
  ],
  // every frame: the crescent splits what it runs through
  tick(c) {
    const W = c.fx.S.wave; if (!W || W.age >= 1.5) return;
    // it is a thing in the world: it can meet what others send against it
    c.projectile({ id: W.id, kind: 'qi', owner: c.me, name: YIDAO.name, pos: W.p.clone(), vel: W.d.clone().multiplyScalar(10.5), r: 0.3, h: 0.5 * (1.1 + W.age * 0.9), power: W.power ?? 1,
      cancel: () => c.fx.breakWave(), weaken: (k) => { W.power = Math.max(0.2, (W.power ?? 1) - k); W.shrink = (W.shrink || 1) * 0.75; } });
    if (c.targets) c.targets.cut(W.p.x, W.p.z, W.d, 99, () => { c.sfx.hit(); c.fx.hitSparks(W.p, W.d); });
    // anyone standing in its path is struck and thrown down, one after another as it reaches them
    const w = c.toLocal(W.p); for (const f of c.foes) { if (W.hitList?.includes(f)) continue; const l = c.toLocal(f.pos); if (w.z >= l.z - 0.2 && w.z < l.z + 0.6 && Math.abs(w.x - l.x) < 0.6) { (W.hitList ||= []).push(f); f.hit({ power: W.power ?? 1, dir: W.d, at: f.pos.add(c.V(0, 0.85, 0)) }); c.sfx.hit(0.6); } }
  },
  keys: [
    { t: 0.00, p: { armR: -0.55, outR: 0.12, armL: -0.95, outL: -0.25, hipR: -0.3, hipL: 0.25, tilt: 0.04, yaw: 0.35, head: -0.3 } },
    { t: 0.38, p: { armR: 0.15, outR: 0.3, armL: -1.35, outL: -0.6, hipR: -0.2, hipL: 0.35, tilt: -0.04, yaw: 0.65, head: -0.6, fwd: -0.18, y: -0.04, wristR: 0.3 } },
    { t: 0.78, p: { armR: 0.32, outR: 0.28, armL: -0.95, outL: -0.15, hipR: -0.2, hipL: 0.35, tilt: -0.02, yaw: 0.62, head: -0.6, fwd: -0.2, y: -0.06, wristR: 0.3 } },
    { t: 0.98, ease: 'out', p: { armR: -3.0, outR: 0.06, armL: -1.5, outL: 0.0, hipR: -0.1, hipL: 0.12, tilt: -0.18, yaw: 0.12, head: -0.1, fwd: -0.1, y: 0.03 } },
    { t: 1.08, p: { armR: -3.12, outR: 0.04, armL: -1.55, outL: 0.0, hipR: -0.12, hipL: 0.14, tilt: -0.21, yaw: 0.1, head: -0.08, fwd: -0.08, y: 0.03 } },
    { t: 1.20, ease: 'in', p: { armR: 0.05, outR: -0.04, armL: 0.75, outL: 0.3, hipR: -0.9, hipL: 0.6, tilt: 0.4, yaw: 0.0, head: 0.0, fwd: 0.48, y: -0.11 } },
    { t: 1.45, ease: 'out', p: { armR: 0.28, outR: -0.04, armL: 0.6, outL: 0.35, hipR: -0.85, hipL: 0.55, tilt: 0.33, yaw: 0.0, head: 0.0, fwd: 0.5, y: -0.1 } },
    { t: 2.45, p: { armR: 0.22, outR: -0.02, armL: 0.5, outL: 0.3, hipR: -0.8, hipL: 0.52, tilt: 0.3, yaw: 0.02, head: 0.0, fwd: 0.5, y: -0.1 } },
    { t: 2.95, p: { armR: -0.4, outR: 0.12, armL: -0.9, outL: -0.2, hipR: -0.4, hipL: 0.3, tilt: 0.08, yaw: 0.3, head: -0.25, fwd: 0.3, y: -0.02, wristR: -0.6 } },
    { t: 3.60, p: { armR: -0.55, outR: 0.12, armL: -0.95, outL: -0.25, hipR: -0.3, hipL: 0.25, tilt: 0.04, yaw: 0.35, head: -0.3, fwd: 0.0 } },
  ],
  glow: [[0, 0], [0.35, 0.05], [1.0, 0.9], [1.16, 1.4], [1.3, 0.35], [2.2, 0.12], [3.0, 0]],
  gather: [0.3, 1.05], // the qi drawn in
  trail: [0.98, 1.34], // the blade's light through the cut
  face(t) {
    if (t < 0.3) return { browIn: 0.6, mouth: { smile: 0.1 } };
    if (t < 1.08) return { browIn: 1, brow: -0.2, mouth: { smile: -0.15 }, eyes: 0.85 };
    if (t < 1.42) return { browIn: 1, brow: -0.3, mouth: { open: 0.9, wide: 0.7, smile: -0.2 } }; // the shout
    if (t < 2.9) return { browIn: 0.8, mouth: { smile: -0.05 } };
    return { browIn: 0.5, mouth: { smile: 0.25 } };
  },
  // a camera, in his frame (he faces +z): from the front three-quarters, down low beside him for the cut, then along
  // with the crescent to the wall, and back
  cam: [
    { t: 0.0, pos: [2.2, 1.25, 2.8], look: [0, 0.9, 0.4], fov: 40 },
    { t: 0.9, pos: [1.55, 1.05, 2.0], look: [0, 1.0, 0.3], fov: 36 },
    { t: 1.06, pos: [2.5, 0.6, 1.2], look: [0, 1.1, 1.2], fov: 46 },
    { t: 1.4, pos: [2.6, 0.95, 1.6], look: [0, 0.9, 4.0], fov: 50 },
    { t: 1.95, pos: [2.4, 1.5, 4.8], look: [0, 1.1, 8.2], fov: 52 },
    { t: 2.7, pos: [2.8, 2.2, 3.4], look: [0, 0.8, 5.5], fov: 52 },
    { t: 3.6, pos: [2.2, 1.25, 2.8], look: [0, 0.9, 0.4], fov: 40 },
  ],
};
