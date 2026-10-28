// 旋風球 Whirlwind Ball: he flicks the ball up off his foot; it hangs in the air while the wind gathers round it into
// a little whirlwind, the ball spinning faster and faster; he winds right round, leg far back, and kicks it with
// everything. The ball goes off in a drill of wind, curling a little, and tears through the training post (the
// whirlwind takes its bricks up and away), then punches a round hole in the stone wall, pops up off it, flies back
// in a high arc, and he traps it under his foot.
import * as THREE from '../../lib/three.module.min.js';
import { BALL_R } from '../cast/yishuo.js';

const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const sm = (u) => { u = Math.max(0, Math.min(1, u)); return u * u * (3 - 2 * u); };
const KICK = 1.12, LAND = 2.95, TRAP = 3.15, SPEED = 12, WALL = 7.85, POST = 4.5;

// the whirlwind: strands of wind wound round an axis, narrow at the ball and opening out behind it (along -z)
function funnel() {
  const G = new THREE.Group(), strands = 5, n = 90, pos = [], uv = [], idx = [];
  for (let k = 0; k < strands; k++) {
    const base = pos.length / 3;
    for (let i = 0; i <= n; i++) {
      const s = i / n, a = k / strands * Math.PI * 2 + s * Math.PI * 7, r = 0.14 + s * s * 0.75, z = -s * 2.4, w = 0.02 + s * 0.07;
      const c = Math.cos(a), sn = Math.sin(a);
      pos.push(c * (r - w), sn * (r - w), z, c * (r + w), sn * (r + w), z - w * 0.6); uv.push(s, 0, s, 1);
      if (i < n) { const a0 = base + i * 2; idx.push(a0, a0 + 1, a0 + 2, a0 + 1, a0 + 3, a0 + 2); }
    }
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx);
  const m = new THREE.ShaderMaterial({
    uniforms: { uA: { value: 0 }, uT: { value: 0 } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: `uniform float uA, uT; varying vec2 vUv; void main(){ float s = vUv.x, edge = sin(3.14159 * vUv.y);
      float streak = 0.55 + 0.45 * sin(s * 38.0 - uT * 26.0); float a = uA * pow(1.0 - s, 1.3) * edge * streak * smoothstep(0.0, 0.06, s);
      vec3 c = mix(vec3(1.3, 1.45, 1.4), vec3(0.45, 1.1, 0.8), s); gl_FragColor = vec4(c * a, a); }`,
  });
  const mesh = new THREE.Mesh(g, m); mesh.renderOrder = 10; mesh.frustumCulled = false; G.add(mesh);
  const halo = new THREE.Mesh(new THREE.SphereGeometry(BALL_R * 1.7, 24, 16), new THREE.MeshBasicMaterial({ color: '#9affd8', transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false })); G.add(halo);
  return { G, mesh, m, halo };
}

export const XUANFENG = {
  id: 'xuanfeng',
  name: { zh: '旋風球', en: 'Whirlwind Ball' },
  desc: {
    zh: '挑球上空，風繞著球捲成小旋風；轉身蓄勢，一腳大力踢出——旋風足球貫穿木樁、在石牆上轟出圓洞，再彈回腳下。',
    en: 'He flicks the ball up and the wind winds round it into a little whirlwind; turning right round, he kicks it with everything: the whirlwind ball tears through the post, punches a hole in the wall, and comes back to his foot.',
  },
  len: 3.6,
  hitstop: KICK,
  keys: [
    { t: 0.00, p: { armR: 0.1, outR: 0.28, armL: -0.1, outL: 0.28, hipR: -0.15, hipL: 0.1, yaw: 0.15 } },
    { t: 0.18, p: { armR: 0.15, outR: 0.35, armL: -0.15, outL: 0.35, hipR: 0.45, hipL: 0.05, tilt: 0.06, yaw: 0.15 } },
    { t: 0.32, ease: 'out', p: { armR: -0.2, outR: 0.4, armL: 0.1, outL: 0.4, hipR: -0.95, hipL: 0.1, tilt: -0.08, yaw: 0.1, y: 0.02 } },
    { t: 0.6, p: { armR: 0.5, outR: 0.7, armL: -1.2, outL: 0.6, hipR: 0.3, hipL: -0.1, tilt: -0.1, yaw: 0.7, head: -0.6 } },
    { t: 0.98, p: { armR: 0.35, outR: 1.15, armL: -0.7, outL: 1.1, hipR: 1.35, hipL: -0.05, tilt: 0.22, yaw: 0.95, head: -0.85, y: -0.01 } },
    { t: 1.12, ease: 'in', p: { armR: -0.4, outR: 0.9, armL: 0.6, outL: 0.95, hipR: -1.85, hipL: 0.2, tilt: -0.28, yaw: -0.3, head: 0.25, fwd: 0.12, y: 0.03 } },
    { t: 1.32, ease: 'out', p: { armR: -0.5, outR: 0.8, armL: 0.7, outL: 0.9, hipR: -2.1, hipL: 0.25, tilt: -0.32, yaw: -0.55, head: 0.5, fwd: 0.24, y: 0.04 } },
    { t: 1.7, p: { armR: 0.0, outR: 0.4, armL: 0.0, outL: 0.4, hipR: -0.35, hipL: 0.3, tilt: 0.06, yaw: -0.15, head: 0.1, fwd: 0.34, y: -0.03 } },
    { t: 2.4, p: { armR: 0.25, outR: 0.55, armL: 0.25, outL: 0.55, hipR: -0.15, hipL: 0.15, tilt: -0.04, yaw: 0.0, head: 0.0, fwd: 0.34 } },
    { t: 2.85, p: { armR: 0.1, outR: 0.45, armL: -0.2, outL: 0.45, hipR: -0.55, hipL: 0.1, tilt: -0.06, yaw: 0.05, fwd: 0.34 } },
    { t: 3.1, p: { armR: 0.1, outR: 0.3, armL: -0.1, outL: 0.3, hipR: -0.25, hipL: 0.1, tilt: 0.02, yaw: 0.12, fwd: 0.3 } },
    { t: 3.6, p: { armR: 0.1, outR: 0.28, armL: -0.1, outL: 0.28, hipR: -0.15, hipL: 0.1, yaw: 0.15, fwd: 0.0 } },
  ],
  face(t) {
    if (t < 0.45) return { happy: 0.7, mouth: { smile: 0.8 } };
    if (t < 1.08) return { browIn: 1, brow: -0.2, eyes: 1.1, look: [0.3, 0.3], mouth: { smile: 0.1 } };
    if (t < 1.4) return { browIn: 1, brow: -0.3, mouth: { open: 1, wide: 0.6, smile: 0.1 } }; // the yell
    if (t < 2.7) return { eyes: 1.2, look: [0, 0.1], mouth: { open: 0.35, round: 1, smile: 0.2 } };
    return { happy: 1, mouth: { smile: 1 } };
  },
  cam: [
    { t: 0.0, pos: [1.7, 0.85, 2.1], look: [0, 0.5, 0.4], fov: 40 },
    { t: 0.75, pos: [1.45, 0.8, 1.8], look: [0, 0.7, 0.45], fov: 40 },
    { t: 1.05, pos: [1.75, 0.38, 0.85], look: [0, 0.48, 0.6], fov: 46 },
    { t: 1.4, pos: [1.9, 0.75, 2.2], look: [0, 0.6, 4.5], fov: 50 },
    { t: 1.85, pos: [2.2, 1.3, 5.0], look: [0, 0.9, 8.2], fov: 52 },
    { t: 2.35, pos: [0.6, 1.2, -1.8], look: [0, 1.0, 3.5], fov: 50 },
    { t: 3.0, pos: [1.9, 1.05, -1.3], look: [0, 0.35, 0.7], fov: 46 },
    { t: 3.6, pos: [1.7, 0.85, 2.1], look: [0, 0.5, 0.4], fov: 40 },
  ],
  init(scene) { const f = funnel(); f.G.visible = false; scene.add(f.G); this._f = f; },
  reset() { if (this._f) this._f.G.visible = false; },
  // at the start: where the ball will be met (posing him at the moment of the kick), and whom it is kicked at
  start(c) {
    const h = c.hero; c.peek(KICK); this._C = c.toLocal(h.instep()).add(V(0, BALL_R * 0.9, BALL_R * 0.9)); c.peek(0); this._from = h.toe(0.2);
    let foe = null, best = 1e9; for (const f of c.foes) { const l = c.toLocal(f.pos); if (l.z > 0.8 && Math.abs(l.x) < 1.0 && l.z < best) { best = l.z; foe = f; } }
    h.loose = null; if (!h.fetching) h.home = { ...c.me.mark }; this._s = { power: c.me.power ?? 0.8 + Math.random() * 0.4, id: 'ball' + Math.random(), loose: false, post: false, wall: false, wallAt: null, foe, end: foe ? best - 0.28 : WALL, endY: foe ? (foe.CH.spec.age === 'kid' ? 0.55 : 0.8) : 0.85 };
  },
  events: [
    { t: 0.3, run: (c) => c.sfx.flick() },
    { t: 0.45, run: (c) => c.sfx.windup(c.rate) },
    { t: KICK, run: (c) => { c.sfx.kick(); c.sfx.whirl(c.rate); c.fx.ringAt(c.hero.ball.position, 0.6); c.fx.S.shake = 0.25; } },
    { t: LAND, run: (c) => { if (!XUANFENG._s.loose) c.sfx.bounce(); } },
    { t: TRAP, run: (c) => { if (!XUANFENG._s.loose) c.sfx.trap(); } },
  ],
  tick(c) {
    const t = c.t, h = c.hero, f = this._f, Cl = this._C, S = this._s, W2 = (v) => c.toWorld(v); let p, spin = 0, axis = V(1, 0, 0), wind = 0, along = false;
    const tW = KICK + (S.end - Cl.z) / SPEED, topL = Cl.clone().add(V(0, 0.6, -0.05));
    if (S.loose) { f.G.visible = false; return; } // knocked away: the ball is on its own now
    if (t < 0.3) { p = h.toe(0.2); }
    else if (t < 0.72) { const u = sm((t - 0.3) / 0.42), a = this._from, top = W2(topL); p = a.clone().lerp(top, u); p.y = a.y + (top.y - a.y) * (1 - (1 - u) ** 2); spin = 8; }
    else if (t < KICK) { const u = sm((t - 0.72) / (KICK - 0.72)); p = W2(topL.clone().lerp(Cl, u)); p.x += Math.sin(t * 20) * 0.008; spin = 10 + 50 * u; wind = Math.min(1, (t - 0.45) / 0.5); }
    else if (t < tW) { // off along the ground in a drill of wind, curling out and back
      const u = (t - KICK) / (tW - KICK), pl = V(Cl.x + 0.28 * Math.sin(Math.PI * u), Cl.y + (S.endY - Cl.y) * u, Cl.z + (S.end - Cl.z) * u); p = W2(pl); spin = 70; axis = c.dirWorld(V(0, 0, 1)); wind = 1; along = true;
      if (c.targets && !S.post && pl.z > POST - 0.35) { S.post = true; if (c.targets.blast(W2(V(pl.x, pl.y, POST)), 0.62, c.dirWorld(V(0, 0, 1)), { column: true, swirl: 3.5 })) { c.sfx.blast(0.7); c.fx.hitSparks(p, c.dirWorld(V(0, 0, 1)), 'wind'); } }
      c.fx.puff(W2(V(pl.x + (Math.random() - 0.5) * 0.2, 0.05, pl.z - 0.2)), c.dirWorld(V((Math.random() - 0.5) * 2, 0.6 + Math.random(), -1.5)), 0.6, [0.55, 0.5, 0.42], 1.5, 2);
    } else if (t < LAND) { // off whatever it struck, up and back in a high arc
      if (!S.wall) {
        S.wall = true; S.wallAt = V(Cl.x, S.endY, S.end);
        if (S.foe) S.foe.hit({ power: S.power, dir: c.dirWorld(V(0, 0, 1)), at: W2(S.wallAt), fx: 'wind' });
        else if (c.targets) { c.targets.blast(W2(V(Cl.x, 0.9, 8.2)), 0.95, c.dirWorld(V(0, 0, 1)), { swirl: 2.5 }); c.sfx.blast(1); c.fx.hitSparks(W2(S.wallAt), c.dirWorld(V(0, 0, -1)), 'wind'); c.fx.ringAt(W2(V(Cl.x, 0, WALL)), 1.2); }
      }
      const L = V(0.12, BALL_R, 0.34 + 0.42), u = (t - tW) / (LAND - tW), a = S.wallAt, pl = a.clone().lerp(L, u); pl.y = a.y + (L.y - a.y) * u + 4 * 2.6 * u * (1 - u); p = W2(pl); spin = 20 * (1 - u) + 6; axis = c.dirWorld(V(1, 0, 0)); wind = Math.max(0, 1 - (t - tW) / 0.35);
    } else if (t < TRAP) { const u = (t - LAND) / (TRAP - LAND), L = W2(V(0.12, BALL_R, 0.76)), to = h.toe(0.05); p = L.lerp(to, u); p.y = BALL_R + 0.18 * Math.sin(Math.PI * u); spin = 5; }
    else { p = h.toe(0.2); spin = Math.max(0, 3 * (1 - (t - TRAP) / 0.3)); }
    const prev = h.ball.position.clone(); h.ballAt(p); h.spinBall(spin * c.dt, axis);
    if (t >= KICK && t < tW) { const vel = h.ball.position.clone().sub(prev).divideScalar(Math.max(1e-4, c.dt)); // in flight, it can be met
      c.projectile({ id: S.id, kind: 'ball', owner: c.me, name: XUANFENG.name, pos: h.ball.position.clone(), vel, r: 0.3, h: 0.3, power: S.power,
        cancel: (o) => { S.loose = true; const away = o.vel.clone().setY(0).normalize(); h.loose = { v: away.multiplyScalar(o.kind === 'qi' ? 3.2 : 2.2).add(V((Math.random() - 0.5) * 2.2, 4.0 + Math.random() * 1.2, 0)), owner: c.me, spin: 0 }; },
        weaken: (k) => { S.power = Math.max(0.2, S.power - k); } }); }
    // the whirlwind round the ball: upright while it gathers, laid along the flight after the kick
    f.G.visible = wind > 0.01; f.G.position.copy(h.ball.position);
    const yaw = new THREE.Quaternion().setFromAxisAngle(V(0, 1, 0), c.me.mark.yaw), qUp = new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0));
    f.G.quaternion.copy(along ? yaw : yaw.multiply(qUp)); f.mesh.rotation.z += c.dt * (along ? 30 : 14); f.m.uniforms.uT.value = c.clock; f.m.uniforms.uA.value = wind;
    f.G.scale.setScalar(along ? 1 : 0.85 + 0.45 * wind); f.halo.material.opacity = wind * 0.35;
    if (wind > 0 && !along) for (let i = 0; i < 2; i++) { const a = Math.random() * 6.28, r = 0.9 + Math.random() * 0.6, q = V(p.x + Math.cos(a) * r, 0.05 + Math.random() * 0.5, p.z + Math.sin(a) * r); c.fx.puff(q, V(-Math.sin(a) * 2.5, 0.8, Math.cos(a) * 2.5).add(p.clone().sub(q).multiplyScalar(1.2)), 0.6, Math.random() < 0.5 ? [0.35, 0.8, 0.4] : [0.8, 1.0, 0.9], 0.5, 0); }
  },
};
