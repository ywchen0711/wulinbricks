// 笑盡天下 Laugh Down the World: Leng Xiaotian laughs three cold laughs, shoulders shaking, chin up; draws his palms
// back to his hips in a low stance while crimson qi gathers in them and the dust turns round his feet; then drives
// both palms forward with a shout. A wind of the palms goes out: a great glowing palm print, crimson and gold, swelling
// as it goes, with a cone of roaring wind behind it and dust torn up from the floor. It is wide, not sharp: it does not
// cut, it sweeps away. Bricks in its path are blown off the post and a whole stretch of the wall; anyone in front of it
// is thrown down. It is a thing in the world, and can meet other blows (js/physics.js).
import * as THREE from '../../lib/three.module.min.js';

const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const LAUNCH = 1.62, SPEED = 8.5, LIFE = 1.5;

function palmTexture() { // a palm print: the palm, five fingers, glowing at the edges
  const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d');
  const shape = () => { g.beginPath(); g.ellipse(128, 160, 58, 66, 0, 0, Math.PI * 2); for (const [x, y, l, a] of [[78, 108, 58, -0.38], [104, 92, 76, -0.12], [132, 88, 80, 0.04], [160, 96, 70, 0.2], [190, 150, 52, 0.95]]) { g.save(); g.translate(x, y); g.rotate(a); g.roundRect(-14, -l, 28, l + 14, 14); g.restore(); } };
  g.filter = 'blur(10px)'; g.fillStyle = 'rgba(255,255,255,0.8)'; shape(); g.fill(); g.filter = 'none';
  g.fillStyle = 'rgba(255,255,255,0.55)'; shape(); g.fill();
  g.globalCompositeOperation = 'destination-out'; g.strokeStyle = 'rgba(0,0,0,0.5)'; g.lineWidth = 5; for (const [a, b, c2, d] of [[88, 150, 170, 140], [92, 172, 160, 178], [120, 210, 150, 120]]) { g.beginPath(); g.moveTo(a, b); g.quadraticCurveTo((a + c2) / 2, (b + d) / 2 - 12, c2, d); g.stroke(); } // the lines of the palm
  const t = new THREE.CanvasTexture(c); return t;
}
function windCone() { // an open cone of streaming wind, narrow behind, opening toward the palm (+z)
  const g = new THREE.CylinderGeometry(1, 0.15, 1, 40, 1, true); g.rotateX(Math.PI / 2); g.translate(0, 0, -0.5);
  const m = new THREE.ShaderMaterial({ uniforms: { uA: { value: 0 }, uT: { value: 0 } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: `uniform float uA, uT; varying vec2 vUv; void main(){ float s = sin(vUv.x * 50.0 + vUv.y * 6.0 - uT * 22.0) * 0.5 + 0.5; float a = uA * pow(s, 3.0) * smoothstep(0.0, 0.5, vUv.y) * (0.5 + 0.5 * vUv.y);
      vec3 c = mix(vec3(1.3, 0.35, 0.3), vec3(1.4, 1.05, 0.55), vUv.y); gl_FragColor = vec4(c * a, a); }` });
  const o = new THREE.Mesh(g, m); o.renderOrder = 10; o.frustumCulled = false; return o;
}

export const XIAOJIN = {
  id: 'xiaojin',
  name: { zh: '笑盡天下', en: 'Laugh Down the World' },
  desc: {
    zh: '冷笑三聲，雙掌收於腰間蓄起赤紅真氣，再雙掌齊推——一道巨大的掌印掌風狂捲而出，橫掃前方一大片。',
    en: 'Three cold laughs; palms drawn back to his hips fill with crimson qi; then both palms driven forward, and a great palm print of wind roars out, sweeping away everything in a wide stretch ahead.',
  },
  len: 3.8,
  hitstop: LAUNCH,
  tint: [1.4, 0.3, 0.35],
  keys: [
    { t: 0.00, p: { armR: 0.55, outR: -0.05, armL: 0.55, outL: -0.05, hipR: -0.1, hipL: 0.1, tilt: -0.06, yaw: 0.2 } },
    { t: 0.2, p: { armR: 0.6, outR: -0.05, armL: 0.6, outL: -0.05, hipR: -0.1, hipL: 0.1, tilt: -0.16, yaw: 0.2, head: 0.1 } },
    { t: 0.4, p: { armR: 0.55, outR: -0.05, armL: 0.55, outL: -0.05, hipR: -0.1, hipL: 0.1, tilt: -0.08, yaw: 0.2, head: -0.1 } },
    { t: 0.6, p: { armR: 0.6, outR: -0.05, armL: 0.6, outL: -0.05, hipR: -0.1, hipL: 0.1, tilt: -0.18, yaw: 0.2, head: 0.1 } },
    { t: 0.85, p: { armR: 0.5, outR: 0.0, armL: 0.5, outL: 0.0, hipR: -0.1, hipL: 0.1, tilt: -0.2, yaw: 0.15 } },
    { t: 1.15, p: { armR: -0.9, outR: 0.9, armL: -0.9, outL: 0.9, hipR: -0.3, hipL: 0.35, tilt: -0.05, yaw: 0.0, y: -0.03 } },
    { t: 1.48, ease: 'out', p: { armR: 0.75, outR: 0.25, armL: 0.75, outL: 0.25, hipR: -0.6, hipL: 0.55, tilt: 0.05, yaw: 0.0, y: -0.09, fwd: -0.1 } },
    { t: 1.62, ease: 'in', p: { armR: -1.62, outR: -0.22, armL: -1.62, outL: -0.22, hipR: -0.95, hipL: 0.6, tilt: 0.28, yaw: 0.0, y: -0.11, fwd: 0.42 } },
    { t: 2.6, p: { armR: -1.55, outR: -0.2, armL: -1.55, outL: -0.2, hipR: -0.9, hipL: 0.58, tilt: 0.25, yaw: 0.0, y: -0.1, fwd: 0.42 } },
    { t: 3.2, p: { armR: 0.3, outR: 0.1, armL: 0.3, outL: 0.1, hipR: -0.3, hipL: 0.25, tilt: 0.0, yaw: 0.1, y: -0.02, fwd: 0.2 } },
    { t: 3.8, p: { armR: 0.55, outR: -0.05, armL: 0.55, outL: -0.05, hipR: -0.1, hipL: 0.1, tilt: -0.06, yaw: 0.2, fwd: 0 } },
  ],
  glow: [[0, 0], [0.9, 0], [1.45, 1], [1.62, 1.5], [1.8, 0.5], [2.6, 0.2], [3.3, 0]],
  gather: [0.95, 1.6],
  face(t) {
    if (t < 0.9) return { eyes: 0.6, browIn: 0.6, mouth: { open: 0.55 + 0.25 * Math.sin(t * 31), wide: 1, smile: 0.9 } }; // the laugh
    if (t < 1.55) return { eyes: 0.55, browIn: 1, smirk: 1 };
    if (t < 2.4) return { eyes: 1, browIn: 1, brow: -0.3, mouth: { open: 0.85, wide: 0.9, smile: 0.2 } }; // the shout
    return { eyes: 0.65, browIn: 0.7, smirk: 0.9 };
  },
  cam: [
    { t: 0.0, pos: [1.2, 1.25, 2.3], look: [0, 1.15, 0.2], fov: 38 },
    { t: 0.9, pos: [1.0, 1.0, 1.9], look: [0, 1.15, 0.2], fov: 36 },
    { t: 1.3, pos: [1.0, 0.45, 1.9], look: [0, 0.95, 0.1], fov: 42 },
    { t: 1.7, pos: [3.0, 1.0, 0.6], look: [0, 0.95, 2.6], fov: 50 },
    { t: 2.25, pos: [3.6, 1.6, 4.2], look: [0, 1.0, 8.0], fov: 52 },
    { t: 3.0, pos: [3.2, 2.0, 3.5], look: [0, 0.8, 5.0], fov: 52 },
    { t: 3.8, pos: [1.2, 1.25, 2.3], look: [0, 1.15, 0.2], fov: 38 },
  ],
  events: [
    { t: 0.05, run: (c) => c.sfx.laugh(c.rate) },
    { t: 0.95, run: (c) => c.sfx.gather(c.rate) },
    { t: LAUNCH, run: (c) => XIAOJIN.launch(c) },
  ],
  init(scene) {
    const G = new THREE.Group(); G.visible = false; scene.add(G); const tex = palmTexture();
    const prints = [0, 1, 2].map((i) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: tex, color: ['#e8203a', '#ff8a30', '#ffd890'][i], transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })); m.renderOrder = 11; m.position.z = -i * 0.12; G.add(m); return m; });
    const cone = windCone(); G.add(cone);
    const light = new THREE.PointLight('#ff5a3a', 0, 8, 1.6); G.add(light);
    this._g = { G, prints, cone, light }; this._p = null;
  },
  reset() { if (this._g) this._g.G.visible = false; this._p = null; },
  launch(c) {
    c.sfx.palm(c.rate); const from = c.toWorld(V(0, 0.95, c.p.fwd + 0.75)), d = c.dirWorld(V(0, 0, 1));
    this._p = { p: from, from: from.clone(), d, age: 0, power: c.me.power ?? 1.0 + Math.random() * 0.4, size: 1, id: 'palm' + Math.random(), hit: [], owner: c.me, dead: false, shrink: 1 };
    c.fx.ringAt(c.toWorld(V(0, 0, c.p.fwd + 0.4)), 1.4); c.fx.S.shake = Math.max(c.fx.S.shake, 0.4);
  },
  tick(c) {
    const P = this._p, g = this._g; if (!P || P.owner !== c.me) return;
    P.age += c.dt; const k = Math.min(1, P.age / 0.08) * Math.max(0, 1 - Math.max(0, P.age - (LIFE - 0.45)) / 0.45);
    if (P.dead || P.age > LIFE) { g.G.visible = false; if (P.age > LIFE) this._p = null; return; }
    P.p.addScaledVector(P.d, SPEED * c.dt * (1 - P.age * 0.25)); P.size = (1.0 + P.age * 1.6) * P.shrink;
    g.G.visible = true; g.G.position.copy(P.p); g.G.lookAt(P.p.clone().add(P.d));
    g.prints.forEach((m, i) => { m.scale.setScalar(P.size * (1.15 - i * 0.12)); m.material.opacity = k * [0.55, 0.42, 0.3][i]; });
    const len = Math.min(2.6, P.p.distanceTo(P.from)); g.cone.scale.set(P.size * 0.55, P.size * 0.55, Math.max(0.01, len)); g.cone.material.uniforms.uA.value = k * 0.45; g.cone.material.uniforms.uT.value = c.clock; g.light.intensity = 6 * k;
    // dust torn up off the floor under it, embers off its edges
    for (let i = 0; i < 3; i++) c.fx.puff(V(P.p.x + (Math.random() - 0.5) * P.size, 0.05, P.p.z + (Math.random() - 0.5) * 0.3), V((Math.random() - 0.5) * 3, 1 + Math.random() * 2, 0).addScaledVector(P.d, 2), 0.6, [0.6, 0.5, 0.42], 1.4, 2);
    for (let i = 0; i < 2; i++) { const a = Math.random() * 6.28; c.fx.puff(P.p.clone().add(V(Math.cos(a) * P.size * 0.45, Math.sin(a) * P.size * 0.45, 0)), V(Math.cos(a), Math.sin(a), -1).multiplyScalar(2), 0.4, [1.4, 0.45, 0.3], 1.5, 0); }
    // it sweeps: the bricks across its width are blown away, whoever stands in front of it is thrown down
    if (c.targets && k > 0.2) if (c.targets.blast(P.p.clone().add(V(0, 0, 0)).setY(0.9), 0.45 + P.size * 0.5, P.d, { swirl: 0.5 })) { if (!P.boom || c.clock - P.boom > 0.25) { c.sfx.blast(0.8); P.boom = c.clock; } }
    const w = c.toLocal(P.p);
    for (const f of c.foes) { if (P.hit.includes(f)) continue; const l = c.toLocal(f.pos); if (w.z >= l.z - 0.35 && w.z < l.z + 0.8 && Math.abs(w.x - l.x) < 0.35 + P.size * 0.45) { P.hit.push(f); f.hit({ power: Math.min(1, P.power), dir: P.d, at: f.pos.add(V(0, 0.85, 0)), fx: 'palm' }); } }
    c.projectile({ id: P.id, kind: 'palm', owner: c.me, name: XIAOJIN.name, pos: P.p.clone(), vel: P.d.clone().multiplyScalar(SPEED), r: 0.3 + P.size * 0.4, h: P.size * 0.5, power: P.power,
      cancel: () => { P.dead = true; for (let i = 0; i < 60; i++) c.fx.puff(P.p.clone().add(V((Math.random() - 0.5) * P.size, (Math.random() - 0.5) * P.size, 0)), V((Math.random() - 0.5) * 5, Math.random() * 3, (Math.random() - 0.5) * 5), 0.6, [1.4, 0.5, 0.35], 2, 1); },
      weaken: (k2) => { P.power = Math.max(0.2, P.power - k2); P.shrink *= 0.7; } });
  },
};
