// The practice ground, in bricks, at dusk: a baseplate of moss, a paved way of stone tiles running out ahead of him,
// stone lanterns lit along it, brick pines and rocks, mountains of stacked slopes far off, a dusk sky, warm light from
// the setting sun low behind the wall, cool light from the sky.
import * as THREE from '../lib/three.module.min.js';
import { kit, P, BH, PH } from './brick/bricks.js';

const rng = (s) => () => ((s = (s * 16807) % 2147483647) / 2147483647);
function sky(scene) {
  const g = new THREE.SphereGeometry(80, 32, 16), m = new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { top: { value: new THREE.Color('#141c34') }, mid: { value: new THREE.Color('#4a4a78') }, hor: { value: new THREE.Color('#f09a62') }, sun: { value: new THREE.Vector3(0.1, 0.06, 1).normalize() } },
    vertexShader: 'varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: `uniform vec3 top, mid, hor, sun; varying vec3 vD; void main(){ float y = vD.y; vec3 c = y > 0.18 ? mix(mid, top, smoothstep(0.18, 0.7, y)) : mix(hor, mid, smoothstep(-0.02, 0.18, y));
      float s = max(0.0, dot(vD, sun)); c += vec3(1.0, 0.6, 0.3) * (pow(s, 40.0) * 1.6 + pow(s, 6.0) * 0.35); gl_FragColor = vec4(c, 1.0); }` });
  const s = new THREE.Mesh(g, m); s.renderOrder = -1; scene.add(s); return s;
}
export function buildStage(scene) {
  scene.fog = new THREE.Fog('#5a4a62', 18, 60);
  const sk = sky(scene);
  const hemi = new THREE.HemisphereLight('#9aa8e0', '#4a3a30', 1.3); scene.add(hemi);
  const sun = new THREE.DirectionalLight('#ffb07a', 2.6); sun.position.set(-6, 7, 14); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -9, right: 9, top: 12, bottom: -6, near: 1, far: 40 }); sun.shadow.bias = -0.0004; sun.target.position.set(0, 0, 4); scene.add(sun, sun.target);
  const fill = new THREE.DirectionalLight('#7a8ad8', 0.7); fill.position.set(5, 4, -6); scene.add(fill);
  const G = new THREE.Group(); scene.add(G); const K = kit(G), R = rng(7);
  K.baseplate(0, 3, 120, 110, '#3e4a2e');
  for (let x = -1.8; x <= 1.81; x += 4 * P) for (let z = -3; z <= 11.5; z += 4 * P) K.brick(x, 0, z, 4, 4, 'tile', ((Math.round(x / P) + Math.round(z / P)) / 4) % 2 ? '#7a746a' : '#6e685e'); // the paved way
  for (let i = -6; i <= 6; i++) for (let j = -4; j <= 4; j++) { const x = i * 4 * P, z = j * 4 * P; if (Math.abs(x) > 2 && Math.hypot(x, z) < 4.2) K.brick(x, 0, z, 4, 4, 'tile', '#655f56'); } // the round where he stands
  for (const [x, z] of [[-3.4, 0.5], [3.4, -1.5], [-3.4, 6.0], [4.2, 10.5]]) { // stone lanterns
    K.brick(x, 0, z, 2, 2, 'plate', '#7a7a76'); K.round(x, PH, z, 1, 'brick', '#7a7a76'); K.round(x, PH + BH, z, 1, 'brick', '#7a7a76'); K.brick(x, PH + 2 * BH, z, 2, 2, 'plate', '#7a7a76');
    K.brick(x, 2 * PH + 2 * BH, z, 1, 1, 'brick', '#ffd27a', 0, 'glow'); K.brick(x, 2 * PH + 3 * BH, z, 2, 2, 'plate', '#5a5a56'); K.round(x, 3 * PH + 3 * BH, z, 1, 'plate', '#5a5a56');
    const l = new THREE.PointLight('#ffb060', 1.6, 6, 2); l.position.set(x, 0.95, z); G.add(l);
  }
  for (let k = 0; k < 26; k++) { // pines
    const a = R() * 6.28, r = 7 + R() * 12, x = Math.cos(a) * r, z = 3 + Math.sin(a) * r; if (Math.abs(x) < 4 && z > -4 && z < 14) continue;
    let y = 0; for (let j = 0; j < 4 + (k % 3); j++) y = K.round(x, y, z, 1, 'brick', '#5a3a24'); for (let w = 8; w >= 2; w -= 2) { y = K.round(x, y, z, w, 'brick', R() < 0.5 ? '#1e4a2a' : '#24563a'); y = K.round(x, y, z, Math.max(2, w - 2), 'plate', '#1a3e24'); }
  }
  for (let k = 0; k < 22; k++) { const x = (R() - 0.5) * 18, z = -4 + R() * 18; if (Math.abs(x) < 2.4) continue; K.slope(x, 0, z, 2, 2, '#6a6a64', R() * 6.3); if (R() < 0.5) K.brick(x + 0.3, 0, z + 0.2, 2, 2, 'brick', '#5a5a56'); }
  // far mountains: stacked slopes and bricks, dark against the dusk
  for (let k = 0; k < 9; k++) { const x = -30 + k * 7.5 + (R() - 0.5) * 3, z = 34 + R() * 8, h = 6 + R() * 7; for (let y = 0, w = 16; y < h && w >= 2; y += BH * 3, w -= 2) for (let i = -w / 2; i < w / 2; i += 2) K.brick(x + i * P * 3, y, z, 6, 6, 'tall', '#3a3550'); }
  K.done();
  return { sky: sk, sun };
}
