// 奕碩 Yi Shuo, the whirlwind kid: Yi Rui's younger brother, a minifig on short legs. A vermilion jacket crossed over
// white with gold trim, tied with his brother's indigo sash; indigo trousers bound with white wraps below the knee,
// white cloth shoes; a mole above the right corner of his mouth; spiky black hair under a red headband whose ties fly like his brother's. No blade: his weapon is
// a football, which never leaves him. At rest he keeps it up off his foot, three touches, then lets it rest.
import * as THREE from '../../lib/three.module.min.js';
import { makeFig, plastic, rbox } from '../brick/minifig.js';
import { ballStep } from '../physics.js';

export const BALL_R = 0.16;
export const YISHUO = {
  id: 'yishuo',
  name: { zh: '奕碩', en: 'Yi Shuo' },
  title: { zh: '旋風少俠', en: 'The Whirlwind Kid' },
  bio: {
    zh: '奕叡的弟弟。從小不愛拿刀，只愛踢球：哥哥在院子裡練刀，他就在一旁把石子、木球、什麼都踢得飛起來。後來他發現，腳下的氣也能踢成一陣旋風。',
    en: 'Yi Rui’s younger brother. He never cared for blades, only for kicking a ball: while his brother practised in the yard, he kicked pebbles, wooden balls, anything at all into the air. Then he found that the qi in his feet could be kicked into a whirlwind.',
  },
  spec: {
    age: 'kid', cheeks: true,
    mole: { side: 1, x: 72, y: 160, r: 7 }, // a mole above the right corner of his mouth
    colors: { top: '#d8462a', bottom: '#26335e', shoes: '#f2eee4' },
    outfit: { top: 'robe', bottom: 'pants' },
    robe: { inner: '#f4f0e6', trim: '#f2c23a', belt: '#26335e', tassel: '#3ab08a', ink: 'rgba(255,220,180,0.16)' },
    hair: { style: 'spiky', color: '#15100d' },
  },
  poem: { zh: ['腳下生風不讓人，', '一球踢散滿天雲；', '江湖莫笑年紀小，', '旋風起處見真心。'], en: ['Wind at his feet, he yields to no one;', 'one kick scatters a sky of clouds;', 'laugh not at his years, rivers and lakes —', 'where the whirlwind rises, his true heart shows.'] },
  moves: ['xuanfeng', 'kick'],
  brother: 'yirui',
  build: (scene) => buildYiShuo(scene),
  // at rest: keepy-uppy, three touches off the right foot, then the ball rests in front of it
  idle(c) {
    const cyc = c % 5.4, k = cyc < 2.7 ? cyc / 0.9 : -1, ph = k >= 0 ? k % 1 : 0, lift = k >= 0 ? Math.max(0, 1 - Math.min(ph, 1 - ph) / 0.14) : 0;
    return {
      pose: { armR: 0.1, outR: 0.28 + lift * 0.1, armL: -0.1, outL: 0.28 + lift * 0.1, hipR: -0.15 - lift * 0.55, hipL: 0.1, tilt: -lift * 0.05, yaw: 0.15, head: Math.sin(c * 0.5) * 0.1, y: Math.sin(c * 2.4) * 0.005 },
      face: { happy: k >= 0 ? 0 : 0.6, eyes: 1.1, look: [0, k >= 0 ? -0.6 : 0], mouth: { smile: 0.7 }, blink: (c % 3.7) < 0.1 ? 1 : 0 },
      ball: k >= 0 ? { up: 4 * 0.42 * ph * (1 - ph) } : { rest: true },
    };
  },
  // the ball at rest: on his instep, or in front of his toe
  idleTick(c, r) {
    const h = c.hero, me = c.me;
    if (h.loose) { // the ball got away: once it has stopped, go and fetch it, then dribble it home
      if (h.loose.rest && !me.walk) { const b = h.ball.position, here = me.pos.setY(0), d = b.clone().setY(0).sub(here), L = d.length();
        if (L < 0.42) { h.loose = null; h.fetching = false; const H = h.home || { x: 0, z: 0, yaw: 0 }; me.walkTo(H.x, H.z, { speed: 1.4, face: H.yaw }); }
        else { h.fetching = true; d.normalize(); me.walkTo(b.x - d.x * 0.3, b.z - d.z * 0.3, { speed: 2.2 }); } }
      return;
    }
    const want = r.ball.rest ? h.toe(0.2) : h.instep().add(c.V(0, BALL_R + r.ball.up, 0)); h.ballAt(h.ball.position.distanceTo(want) > 0.6 ? want : h.ball.position.clone().lerp(want, 1 - Math.exp(-c.dt * 20))); h.spinBall(c.dt * (r.ball.rest ? 0 : 6), c.V(1, 0, 0)); },
};

function ballTexture() { // white, with black pentagons where the twelve corners of an icosahedron fall, and seams
  const W = 1024, H = 512, c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d');
  g.fillStyle = '#f6f4ee'; g.fillRect(0, 0, W, H);
  const t = (1 + Math.sqrt(5)) / 2, V = [[-1, t, 0], [1, t, 0], [-1, -t, 0], [1, -t, 0], [0, -1, t], [0, 1, t], [0, -1, -t], [0, 1, -t], [t, 0, -1], [t, 0, 1], [-t, 0, -1], [-t, 0, 1]];
  g.fillStyle = '#16141a';
  for (const [x, y, z] of V) {
    const l = Math.hypot(x, y, z), lat = Math.asin(y / l), lon = Math.atan2(x, z);
    for (const dx of [-W, 0, W]) { g.beginPath(); for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2 + 0.3, r = 0.21, la = lat + Math.sin(a) * r, lo = lon + Math.cos(a) * r / Math.max(0.25, Math.cos(la)); g.lineTo((lo / (Math.PI * 2) + 0.5) * W + dx, (0.5 - la / Math.PI) * H); } g.closePath(); g.fill(); }
  }
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8; return tex;
}

export function buildYiShuo(scene) {
  const F = makeFig(YISHUO.spec), H = F.headP;
  const mesh = (g, m, p) => { const o = new THREE.Mesh(g, m); o.castShadow = true; o.receiveShadow = true; p.add(o); return o; };
  const band = plastic('#d82a2a'), wrap = plastic('#f2eee4'), gold = plastic('#f2c23a');
  // the red headband and its ties
  const hb = mesh(new THREE.CylinderGeometry(5.95, 5.95, 1.3, 40, 1, true), band, H); hb.position.y = 7.8; band.side = THREE.DoubleSide;
  const ties = []; for (const s of [-1, 1]) { const p = new THREE.Group(); p.position.set(s * 0.9, 7.8, -5.7); H.add(p); mesh(rbox(1.3, 8, 0.35, 0.15), band, p).position.y = -4; ties.push(p); }
  // the trouser wraps and a gold bead on the sash
  for (const L of F.legs) for (const y of [-5.2, -6.6]) { const w = mesh(rbox(7.8, 1.0, 6.8, 0.4), wrap, L); w.position.set(0, y, -0.4); }
  const bead = mesh(new THREE.SphereGeometry(1.0, 12, 10), gold, F.body); bead.position.set(-5, 11.6, 4.3);
  // the ball: in the world, not in a hand
  const ball = new THREE.Group(), bm = new THREE.Mesh(new THREE.SphereGeometry(BALL_R, 40, 24), new THREE.MeshPhysicalMaterial({ map: ballTexture(), roughness: 0.32, clearcoat: 0.7, clearcoatRoughness: 0.2 }));
  bm.castShadow = true; ball.add(bm); scene?.add(F.root, ball);
  const V = (x, y, z) => new THREE.Vector3(x, y, z), hipY = 9.0;
  const H2 = {
    F, ball, ties, remove() { F.root.parent?.remove(F.root); ball.parent?.remove(ball); },
    // where his right foot is: the top of the instep, or a point in front of the toe on the floor
    instep: () => F.legs[0].localToWorld(V(0, -hipY + 3.4, 3.2)),
    toe(ahead = 0) { const p = F.legs[0].localToWorld(V(0, -hipY + 1.6, 5.4)), f = V(Math.sin(F.root.rotation.y), 0, Math.cos(F.root.rotation.y)); p.addScaledVector(f, ahead + BALL_R * 0.6); p.y = BALL_R; return p; },
    ballAt(p, k = 1) { ball.position.copy(p); ball.position.y = Math.max(BALL_R, ball.position.y); },
    spinBall(a, axis) { bm.rotateOnWorldAxis(axis.clone().normalize(), a); },
    sway(t, speed = 0) { ties.forEach((p, i) => { p.rotation.x = -0.35 - speed * 0.9 + Math.sin(t * 5.6 + i * 1.7) * 0.14; p.rotation.z = (i ? 1 : -1) * (0.14 + Math.sin(t * 3.3 + i) * 0.05); }); },
    setGlow() {},
    // the ball split along a seam (a dark gash in it)
    crack() { if (H2.cracked) return; H2.cracked = true; const g = new THREE.Mesh(new THREE.TorusGeometry(BALL_R * 1.0, BALL_R * 0.12, 6, 24, Math.PI * 0.9), new THREE.MeshBasicMaterial({ color: '#1a0e08' })); g.rotation.set(0.3, 0.2, 0); bm.add(g); },
    // a loose ball runs under its own physics, whatever he is doing
    physics(dt, W, f) { if (!H2.loose) return; H2.loose.owner ||= f; ballStep(ball, H2.loose, dt, W, BALL_R); const v = H2.loose.v; if (v.lengthSq() > 1e-4) H2.spinBall(H2.loose.spin * dt, V(v.z, 0, -v.x)); },
  };
  return H2;
}
