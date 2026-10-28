// The places, in bricks, and the light over them. The practice ground (also the road outside the village) is at the
// origin; the other sets (js/sets.js) stand far off along x, out of each other's sight in the haze. The sky follows the
// camera; the time of day sets the sky, the sun (or moon), the light from the sky and the haze:
//   const st = buildStage(scene); st.time('night'); st.focus(x, z)   (where the sun's shadows are drawn)
import * as THREE from '../lib/three.module.min.js';
import { kit, P, BH, PH } from './brick/bricks.js';
import { buildSets } from './sets.js';
import { decorateRoad } from './decor.js';

const rng = (s) => () => ((s = (s * 16807) % 2147483647) / 2147483647);
export const TIMES = {
  dusk: { top: '#141c34', mid: '#4a4a78', hor: '#f09a62', sun: [0.1, 0.06, 1], glow: '#ffa050', sunC: '#ffb07a', sunI: 2.6, sunP: [-6, 7, 14], sky: '#9aa8e0', ground: '#4a3a30', hemiI: 1.3, fog: '#5a4a62', fill: 0.7, exp: 1.05 },
  day: { top: '#2a64b8', mid: '#6ea4dc', hor: '#cfe2ee', sun: [0.35, 0.7, 0.55], glow: '#fff4d8', sunC: '#fff0d8', sunI: 3.0, sunP: [6, 14, 9], sky: '#c4d8f0', ground: '#6a5a48', hemiI: 1.35, fog: '#a8c0d6', fill: 0.5, exp: 1.0 },
  night: { top: '#03050c', mid: '#0a1228', hor: '#1a2848', sun: [-0.35, 0.45, 0.7], glow: '#c8d8ff', sunC: '#8aa4e8', sunI: 0.7, sunP: [-7, 10, 12], sky: '#3a4a80', ground: '#141018', hemiI: 0.42, fog: '#0a1022', fill: 0.15, exp: 1.15 },
  dawn: { top: '#26345e', mid: '#8a82ae', hor: '#f6b48e', sun: [-0.7, 0.07, 0.7], glow: '#ffb080', sunC: '#ffc49a', sunI: 2.1, sunP: [-12, 5, 10], sky: '#b0b6e0', ground: '#5a4a40', hemiI: 1.2, fog: '#8a7a8e', fill: 0.6, exp: 1.05 },
};
function sky(scene) {
  const g = new THREE.SphereGeometry(80, 32, 16), m = new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { top: { value: new THREE.Color('#141c34') }, mid: { value: new THREE.Color('#4a4a78') }, hor: { value: new THREE.Color('#f09a62') }, sun: { value: new THREE.Vector3(0.1, 0.06, 1).normalize() }, glow: { value: new THREE.Color('#ffa050') }, stars: { value: 0 } },
    vertexShader: 'varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: `uniform vec3 top, mid, hor, sun, glow; uniform float stars; varying vec3 vD;
      float h(vec3 p){ return fract(sin(dot(p, vec3(12.9898, 78.233, 37.719))) * 43758.5453); }
      void main(){ float y = vD.y; vec3 c = y > 0.18 ? mix(mid, top, smoothstep(0.18, 0.7, y)) : mix(hor, mid, smoothstep(-0.02, 0.18, y));
      float s = max(0.0, dot(vD, sun)); c += glow * (pow(s, 40.0) * 1.6 + pow(s, 6.0) * 0.35);
      if (stars > 0.0) { vec3 q = floor(vD * 260.0); float st = step(0.9965, h(q)); c += vec3(st) * stars * smoothstep(0.05, 0.4, y); }
      gl_FragColor = vec4(c, 1.0); }` });
  const s = new THREE.Mesh(g, m); s.renderOrder = -1; scene.add(s); return s;
}
export function buildStage(scene, R) {
  scene.fog = new THREE.Fog('#5a4a62', 18, 60);
  const sk = sky(scene);
  const hemi = new THREE.HemisphereLight('#9aa8e0', '#4a3a30', 1.3); scene.add(hemi);
  const sun = new THREE.DirectionalLight('#ffb07a', 2.6); sun.position.set(-6, 7, 14); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -10, right: 10, top: 12, bottom: -8, near: 1, far: 50 }); sun.shadow.bias = -0.0004; sun.target.position.set(0, 0, 4); scene.add(sun, sun.target);
  const fill = new THREE.DirectionalLight('#7a8ad8', 0.7); fill.position.set(5, 4, -6); scene.add(fill, fill.target);
  const G = new THREE.Group(); G.position.y = -PH; scene.add(G); const K = kit(G), Rn = rng(7); // lowered a tile, so the paving's top is the floor (y = 0)
  K.baseplate(0, 3, 120, 110, '#3e4a2e');
  for (let x = -1.8; x <= 1.81; x += 4 * P) for (let z = -3; z <= 11.5; z += 4 * P) K.brick(x, 0, z, 4, 4, 'tile', ((Math.round(x / P) + Math.round(z / P)) / 4) % 2 ? '#7a746a' : '#6e685e'); // the paved way
  for (let i = -6; i <= 6; i++) for (let j = -4; j <= 4; j++) { const x = i * 4 * P, z = j * 4 * P; if (Math.abs(x) > 2 && Math.hypot(x, z) < 4.2) K.brick(x, 0, z, 4, 4, 'tile', '#655f56'); } // the round where he stands
  for (const [x, z] of [[-3.4, 0.5], [3.4, -1.5], [-3.4, 6.0], [4.2, 10.5]]) { // stone lanterns
    K.brick(x, 0, z, 2, 2, 'plate', '#7a7a76'); K.round(x, PH, z, 1, 'brick', '#7a7a76'); K.round(x, PH + BH, z, 1, 'brick', '#7a7a76'); K.brick(x, PH + 2 * BH, z, 2, 2, 'plate', '#7a7a76');
    K.brick(x, 2 * PH + 2 * BH, z, 1, 1, 'brick', '#ffd27a', 0, 'glow'); K.brick(x, 2 * PH + 3 * BH, z, 2, 2, 'plate', '#5a5a56'); K.round(x, 3 * PH + 3 * BH, z, 1, 'plate', '#5a5a56');
    const l = new THREE.PointLight('#ffb060', 1.6, 6, 2); l.position.set(x, 0.95, z); G.add(l);
  }
  for (let k = 0; k < 26; k++) { // pines
    const a = Rn() * 6.28, r = 7 + Rn() * 12, x = Math.cos(a) * r, z = 3 + Math.sin(a) * r; if (Math.abs(x) < 4 && z > -4 && z < 14) continue;
    let y = 0; for (let j = 0; j < 4 + (k % 3); j++) y = K.round(x, y, z, 1, 'brick', '#5a3a24'); for (let w = 8; w >= 2; w -= 2) { y = K.round(x, y, z, w, 'brick', Rn() < 0.5 ? '#1e4a2a' : '#24563a'); y = K.round(x, y, z, Math.max(2, w - 2), 'plate', '#1a3e24'); }
  }
  for (let k = 0; k < 22; k++) { const x = (Rn() - 0.5) * 18, z = -4 + Rn() * 18; if (Math.abs(x) < 2.4) continue; K.slope(x, 0, z, 2, 2, '#6a6a64', Rn() * 6.3); if (Rn() < 0.5) K.brick(x + 0.3, 0, z + 0.2, 2, 2, 'brick', '#5a5a56'); }
  // far mountains: stacked slopes and bricks, dark against the dusk
  for (let k = 0; k < 9; k++) { const x = -30 + k * 7.5 + (Rn() - 0.5) * 3, z = 34 + Rn() * 8, h = 6 + Rn() * 7; for (let y = 0, w = 16; y < h && w >= 2; y += BH * 3, w -= 2) for (let i = -w / 2; i < w / 2; i += 2) K.brick(x + i * P * 3, y, z, 6, 6, 'tall', '#3a3550'); }
  decorateRoad(K, G);
  K.done();
  const sets = buildSets(scene);
  const st = { sky: sk, sun, hemi, fill, sets, tod: 'dusk', at: new THREE.Vector3(0, 0, 4),
    // where the shadows are drawn: around a point of the set in use
    focus(x, z) { st.at.set(x, 0, z); sun.target.position.copy(st.at); const p = TIMES[st.tod].sunP; sun.position.set(x + p[0], p[1], z + p[2]); fill.target.position.copy(st.at); fill.position.set(x + 5, 4, z - 6); },
    time(name) {
      const T = TIMES[name] || TIMES.dusk, U = sk.material.uniforms; st.tod = name;
      U.top.value.set(T.top); U.mid.value.set(T.mid); U.hor.value.set(T.hor); U.sun.value.set(...T.sun).normalize(); U.glow.value.set(T.glow); U.stars.value = name === 'night' ? 1 : 0;
      sun.color.set(T.sunC); sun.intensity = T.sunI; hemi.color.set(T.sky); hemi.groundColor.set(T.ground); hemi.intensity = T.hemiI; fill.intensity = T.fill; scene.fog.color.set(T.fog);
      if (R) R.toneMappingExposure = T.exp; for (const s of Object.values(sets)) s.time?.(name);
      st.focus(st.at.x, st.at.z);
    },
  };
  return st;
}
