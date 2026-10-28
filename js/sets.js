// The places of 龍門雙奕, in bricks, each at its own spot far along x (out of each other's sight):
//   manor    龍門刀莊 the Longmen Saber Manor: a walled courtyard of white walls and dark tiles, a red gate with its
//            name board, the main hall at the back, a guest pavilion on the east side, a weapon rack, a pine and a
//            plum tree, red lanterns under the eaves
//   teahouse 聽雨樓 the Listening-to-Rain teahouse: a wooden hall, the storyteller's dais and desk at the back under the
//            house's name board, tables and benches for the listeners, lanterns, rain falling past the windows
// SETS[name] = { x, z } is where each stands; a set may answer time(tod) to light its lamps for the hour.
import * as THREE from '../lib/three.module.min.js';
import { kit, P, BH, PH } from './brick/bricks.js';
import { decorateManor, decorateTeahouse } from './decor.js';

export const SETS = { road: { x: 0, z: 0 }, manor: { x: 200, z: 0 }, teahouse: { x: 400, z: 0 } };

function board(text, w, h, { size = 64, bg = '#1a0c08', fg = '#f0c858', vertical = false } = {}) { // a name board, painted
  const c = document.createElement('canvas'); c.width = Math.round(w * 160); c.height = Math.round(h * 160); const g = c.getContext('2d');
  g.fillStyle = bg; g.fillRect(0, 0, c.width, c.height); g.strokeStyle = fg; g.lineWidth = 6; g.strokeRect(8, 8, c.width - 16, c.height - 16);
  g.fillStyle = fg; g.font = `900 ${size}px "Noto Serif TC", "Songti TC", serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
  if (vertical) [...text].forEach((ch, i) => g.fillText(ch, c.width / 2, c.height * (i + 0.5) / text.length)); else g.fillText(text, c.width / 2, c.height / 2 + 4);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.06), [null, null, null, null, new THREE.MeshPhysicalMaterial({ map: t, roughness: 0.35, clearcoat: 0.5 }), new THREE.MeshPhysicalMaterial({ color: bg })].map((m) => m || new THREE.MeshPhysicalMaterial({ color: bg })));
  mesh.userData.setPiece = true; return mesh;
}
// a run of wall along x (rot 0) or along z (rot 1), n bricks high, with a coping of dark tiles and slopes
function wall(K, x0, z0, len, n, along, color = '#d0c8b8', cap = '#3a3e48') {
  const steps = Math.round(len / (4 * P));
  for (let r = 0; r < n; r++) for (let i = 0; i < steps; i++) { const off = (r % 2) * 2 * P, d = i * 4 * P + off; if (d + 4 * P > len + 1e-3 && r % 2) continue; const x = along ? x0 : x0 + d + 2 * P, z = along ? z0 + d + 2 * P : z0; K.brick(x, r * BH, z, along ? 1 : 4, along ? 4 : 1, 'brick', color); }
  for (let i = 0; i < steps; i++) { const d = i * 4 * P + 2 * P, x = along ? x0 : x0 + d, z = along ? z0 + d : z0; K.brick(x, n * BH, z, along ? 2 : 4, along ? 4 : 2, 'plate', cap); K.slope(along ? x - 0.15 : x, n * BH + PH, along ? z : z - 0.15, along ? 4 : 4, 1, cap, along ? -Math.PI / 2 : 0); K.slope(along ? x + 0.15 : x, n * BH + PH, along ? z : z + 0.15, 4, 1, cap, along ? Math.PI / 2 : Math.PI); }
}
const pillar = (K, x, z, h, c = '#a8281e') => { let y = 0; K.round(x, y, z, 2, 'plate', '#6a6a66'); y += PH; for (let i = 0; i < h; i++) y = K.round(x, y, z, 2, 'brick', c); return y; };
function roof(K, cx, y, cz, w, d, color = '#2e323c') { // a deck of plates and slopes all round, a ridge on top
  for (let x = -w / 2 + 2 * P; x < w / 2; x += 4 * P) for (let z = -d / 2 + 2 * P; z < d / 2; z += 4 * P) K.brick(cx + x, y, cz + z, 4, 4, 'plate', color);
  for (let x = -w / 2 + P; x < w / 2; x += 2 * P) { K.slope(cx + x, y + PH, cz - d / 2 - 0.15, 2, 2, color, 0); K.slope(cx + x, y + PH, cz + d / 2 + 0.15, 2, 2, color, Math.PI); }
  for (let x = -w / 2 + 2 * P; x < w / 2; x += 4 * P) K.brick(cx + x, y + PH, cz, 4, 2, 'brick', '#23262e');
}
function lantern(G, K, x, y, z, lights) { K.round(x, y, z, 2, 'brick', '#ff5a32', 'glow'); K.round(x, y + BH, z, 1, 'plate', '#d8a838'); const l = new THREE.PointLight('#ff8a50', 1.5, 7, 2); l.position.set(x, y + 0.1, z); G.add(l); lights.push(l); }

function manor(scene) {
  const O = SETS.manor, G = new THREE.Group(); G.position.set(O.x, -PH, O.z); scene.add(G); const K = kit(G), lamps = [];
  K.baseplate(0, 0, 90, 90, '#4a4c46');
  for (let x = -6 + 2 * P; x < 6; x += 4 * P) for (let z = -6 + 2 * P; z < 6; z += 4 * P) K.brick(x, 0, z, 4, 4, 'tile', (Math.round(x / P + z / P) / 4) % 2 ? '#9a968e' : '#8e8a82'); // the yard
  for (let z = 6.2; z < 16; z += 4 * P) for (const x of [-0.6, 0.6]) K.brick(x, 0, z, 4, 4, 'tile', '#7e7a72'); // the way out of the gate
  // the walls, the gate in the front (+z) one
  wall(K, -6.6, -6.6, 13.2, 6, false); wall(K, -6.6, -6.6, 13.2, 6, true); wall(K, 6.6, -6.6, 13.2, 6, true);
  wall(K, -6.6, 6.6, 5.2, 6, false); wall(K, 1.4, 6.6, 5.2, 6, false);
  for (const s of [-1, 1]) pillar(K, s * 1.45, 6.6, 8);
  K.brick(0, 8 * BH + PH, 6.6, 12, 2, 'brick', '#a8281e'); roof(K, 0, 9 * BH + PH, 6.6, 4.4, 1.2);
  const sign = board('龍門刀莊', 2.2, 0.6, { size: 70 }); sign.position.set(O.x, 7.2 * BH, O.z + 6.95); scene.add(sign);
  // the main hall at the back: a raised floor, red pillars, a dark roof, its name
  for (let x = -4 + 2 * P; x < 4; x += 4 * P) for (let z = -6.2 + 2 * P; z < -3.4; z += 4 * P) { K.brick(x, 0, z, 4, 4, 'brick', '#7a7670'); K.brick(x, BH, z, 4, 4, 'tile', '#6a4a34'); }
  for (const x of [-3.6, -1.2, 1.2, 3.6]) pillar(K, x, -3.7, 8);
  for (let x = -4 + 2 * P; x < 4; x += 4 * P) for (let r = 1; r < 8; r++) K.brick(x, r * BH, -6.3, 4, 1, 'brick', r > 5 ? '#c8c0b0' : '#8a2a1e'); // its back wall
  roof(K, 0, 8 * BH + PH * 2, -5.0, 9.2, 3.8);
  const hall = board('龍門', 1.4, 0.55, { size: 80 }); hall.position.set(O.x, 7.2 * BH, O.z - 3.45); scene.add(hall);
  for (const x of [-2.4, 2.4]) lantern(G, K, x, 7 * BH, -3.4, lamps);
  // the guest pavilion on the east side: where the 盟主 sleeps the night before the gathering
  const px = 4.0, pz = 0.6; for (let x = -1.2; x <= 1.21; x += 4 * P) for (let z = -1.2; z <= 1.21; z += 4 * P) K.brick(px + x, 0, pz + z, 4, 4, 'brick', '#7a7670');
  for (const [x, z] of [[-1.3, -1.3], [1.3, -1.3], [-1.3, 1.3], [1.3, 1.3]]) { let y = BH; for (let i = 0; i < 7; i++) y = K.round(px + x, y, pz + z, 1, 'brick', '#8a2a1e'); }
  roof(K, px, 8 * BH, pz, 3.4, 3.4); lantern(G, K, px, 6.4 * BH, pz + 1.5, lamps);
  K.brick(px, BH, pz - 0.5, 4, 2, 'brick', '#5a3a24'); K.brick(px, 2 * BH, pz - 0.5, 4, 3, 'plate', '#6a4228'); K.round(px + 0.3, 2 * BH + PH, pz - 0.5, 1, 'plate', '#f0ece0'); // a low table, a cup
  // the weapon rack on the west side, sabers and spears
  for (const z of [-1.0, 1.0]) { let y = 0; for (let i = 0; i < 5; i++) y = K.brick(-5.6, y, z, 1, 1, 'brick', '#5a3a24'); }
  K.brick(-5.6, 5 * BH, 0, 1, 8, 'plate', '#5a3a24'); K.brick(-5.6, 2 * BH, 0, 1, 8, 'plate', '#5a3a24');
  for (let i = 0; i < 5; i++) { const z = -0.8 + i * 0.4; K.brick(-5.45, 2 * BH + PH, z, 1, 1, 'tall', '#c8ccd4'); K.brick(-5.45, 5 * BH + PH, z, 1, 1, 'plate', '#a8281e'); }
  // trees: a pine in the north-west corner, a plum in bloom by the pavilion
  { let y = 0; for (let j = 0; j < 6; j++) y = K.round(-5.4, y, -5.4, 2, 'brick', '#5a3a24'); for (let w = 10; w >= 2; w -= 2) { y = K.round(-5.4, y, -5.4, w, 'brick', '#1e4a2a'); y = K.round(-5.4, y, -5.4, Math.max(2, w - 2), 'plate', '#1a3e24'); } }
  { let y = 0; for (let j = 0; j < 5; j++) y = K.round(5.4, y, -5.2, 1, 'brick', '#4a2a1a'); for (const [dx, dz, dy] of [[0, 0, 0], [0.4, 0.2, -0.3], [-0.4, -0.2, -0.2], [0.2, -0.4, 0.2], [-0.2, 0.4, 0.3]]) K.round(5.4 + dx, y + dy, -5.2 + dz, 4, 'brick', dx > 0 ? '#f2a8c0' : '#e88aa8'); }
  // stone lanterns in the yard
  for (const [x, z] of [[-3, 3.4], [3, 3.4]]) { K.brick(x, 0, z, 2, 2, 'plate', '#7a7a76'); K.round(x, PH, z, 1, 'brick', '#7a7a76'); K.round(x, PH + BH, z, 1, 'brick', '#7a7a76'); K.brick(x, PH + 2 * BH, z, 2, 2, 'plate', '#7a7a76'); K.brick(x, 2 * PH + 2 * BH, z, 1, 1, 'brick', '#ffd27a', 0, 'glow'); K.brick(x, 2 * PH + 3 * BH, z, 2, 2, 'plate', '#5a5a56'); const l = new THREE.PointLight('#ffb060', 1.2, 6, 2); l.position.set(x, 0.95, z); G.add(l); lamps.push(l); }
  // pines outside the walls
  for (let k = 0; k < 14; k++) { const a = k / 14 * 6.28 + 0.2, r = 10 + (k % 3) * 2.5, x = Math.cos(a) * r, z = Math.sin(a) * r; if (z > 6 && Math.abs(x) < 3) continue; let y = 0; for (let j = 0; j < 5; j++) y = K.round(x, y, z, 1, 'brick', '#5a3a24'); for (let w = 8; w >= 2; w -= 2) { y = K.round(x, y, z, w, 'brick', '#24563a'); y = K.round(x, y, z, Math.max(2, w - 2), 'plate', '#1a3e24'); } }
  decorateManor(scene, K, G, O, lamps);
  K.done();
  return { lamps, time(t) { const k = t === 'night' ? 2.6 : t === 'dusk' || t === 'dawn' ? 1.4 : 0.5; lamps.forEach((l) => (l.intensity = k)); } };
}

function teahouse(scene) {
  const O = SETS.teahouse, G = new THREE.Group(); G.position.set(O.x, -PH, O.z); scene.add(G); const K = kit(G), lamps = [];
  K.baseplate(0, 0, 60, 60, '#2a2420');
  for (let x = -4.4 + 2 * P; x < 4.4; x += 4 * P) for (let z = -3.4 + 2 * P; z < 3.6; z += 4 * P) K.brick(x, 0, z, 4, 4, 'tile', (Math.round(x / P + z / P) / 4) % 2 ? '#7a5034' : '#6e472e'); // the boards
  // walls behind and at the sides, windows in the sides, open toward us like a stage
  for (let x = -4.4 + 2 * P; x < 4.4; x += 4 * P) for (let r = 0; r < 9; r++) K.brick(x, r * BH, -3.6, 4, 1, 'brick', r === 0 || r === 8 ? '#4a2e1c' : '#8a6a48');
  for (const s of [-1, 1]) for (let z = -3.4 + 2 * P; z < 3.6; z += 4 * P) for (let r = 0; r < 9; r++) { const win = r >= 3 && r <= 6 && Math.abs(z) < 2.2; if (win) continue; K.brick(s * 4.5, r * BH, z, 1, 4, 'brick', r === 0 || r === 8 ? '#4a2e1c' : '#8a6a48'); }
  for (let x = -4.4 + 2 * P; x < 4.4; x += 4 * P) for (let z = -3.4 + 2 * P; z < 1.2; z += 4 * P) K.brick(x, 9 * BH, z, 4, 4, 'plate', '#3a2418'); // the ceiling, half way out
  for (const x of [-3, 0, 3]) K.brick(x, 9 * BH - BH, 1.0, 2, 12, 'brick', '#4a2e1c'); // a beam
  // the storyteller's dais and desk, the name board and a scroll behind
  for (let x = -1.6 + 2 * P; x < 1.6; x += 4 * P) for (let z = -3.3 + 2 * P; z < -1.8; z += 4 * P) K.brick(x, 0, z, 4, 4, 'brick', '#5a3a24');
  K.brick(0, BH, -2.2, 2, 2, 'brick', '#4a2e1c'); K.brick(0.9, BH, -2.2, 1, 2, 'brick', '#4a2e1c'); K.brick(-0.9, BH, -2.2, 1, 2, 'brick', '#4a2e1c');
  K.brick(0, 2 * BH, -2.2, 8, 3, 'plate', '#a8281e'); K.brick(0, 2 * BH + PH, -2.2, 8, 3, 'tile', '#6a4228'); // the desk with its red cloth
  K.round(0.6, 2 * BH + 2 * PH, -2.3, 1, 'plate', '#f0ece0');
  const nb = board('聽雨樓', 1.8, 0.6, { size: 74 }); nb.position.set(O.x, 2.6, O.z - 3.55); scene.add(nb);
  for (const s of [-1, 1]) { const sc = board(s < 0 ? '說古論今' : '醒木驚堂', 0.42, 1.5, { size: 54, bg: '#efe6cc', fg: '#2a1a12', vertical: true }); sc.position.set(O.x + s * 2.4, 1.7, O.z - 3.55); scene.add(sc); }
  // tables and benches for the listeners, cups and pots on them
  for (const [tx, tz] of [[-2.2, 0.6], [2.2, 0.6], [0, 2.2]]) {
    for (const [dx, dz] of [[-0.3, -0.3], [0.3, -0.3], [-0.3, 0.3], [0.3, 0.3]]) { K.brick(tx + dx, 0, tz + dz, 1, 1, 'brick', '#4a2e1c'); K.brick(tx + dx, BH, tz + dz, 1, 1, 'brick', '#4a2e1c'); }
    K.brick(tx, 2 * BH, tz, 4, 4, 'plate', '#6a4228'); K.round(tx - 0.2, 2 * BH + PH, tz, 1, 'plate', '#f0ece0'); K.round(tx + 0.25, 2 * BH + PH, tz + 0.1, 2, 'brick', '#3a5a6a');
    for (const s of [-1, 1]) { K.brick(tx + s * 0.95, 0, tz, 1, 1, 'brick', '#4a2e1c'); K.brick(tx + s * 0.95, BH, tz, 2, 6, 'plate', '#6a4228'); }
  }
  for (const [x, z] of [[-2.2, 0.2], [2.2, 0.2], [0, -1.0]]) lantern(G, K, x, 2.7, z, lamps);
  decorateTeahouse(scene, K, G, O, lamps);
  K.done();
  // rain past the windows
  const n = 500, pos = new Float32Array(n * 3); for (let i = 0; i < n; i++) { const s = i % 2 ? 1 : -1; pos.set([s * (4.9 + Math.random() * 1.6), Math.random() * 3.4, (Math.random() - 0.5) * 4.4], i * 3); }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const rain = new THREE.Points(geo, new THREE.PointsMaterial({ color: '#9ab8d8', size: 0.03, transparent: true, opacity: 0.7 })); rain.position.set(O.x, 0, O.z); scene.add(rain);
  const tick = () => { const p = geo.attributes.position.array; for (let i = 0; i < n; i++) { p[i * 3 + 1] -= 0.12; if (p[i * 3 + 1] < 0) p[i * 3 + 1] += 3.4; } geo.attributes.position.needsUpdate = true; };
  return { lamps, tick, time() { lamps.forEach((l) => (l.intensity = 2.4)); } };
}

export function buildSets(scene) { return { manor: manor(scene), teahouse: teahouse(scene) }; }
