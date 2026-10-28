// The furnishing of the sets: what makes a room look lived in. Each function adds to a set's brick kit (K, laid in its
// group G, in the set's own coordinates) and puts painted boards into the scene at the set's origin O.
import * as THREE from '../lib/three.module.min.js';
import { P, BH, PH } from './brick/bricks.js';

const tex = (w, h, draw) => { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; };
const panel = (w, h, map, back = '#3a2418', o = {}) => { const front = new THREE.MeshPhysicalMaterial({ map, roughness: 0.55, clearcoat: 0.25, transparent: !!o.transparent, side: o.double ? THREE.DoubleSide : THREE.FrontSide }), b = new THREE.MeshPhysicalMaterial({ color: back, roughness: 0.6 }); const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, o.depth ?? 0.04), [b, b, b, b, front, o.double ? front : b]); m.castShadow = !o.transparent; m.receiveShadow = true; return m; };
const placeAt = (scene, O, m, x, y, z, ry = 0) => { m.position.set(O.x + x, y, O.z + z); m.rotation.y = ry; m.userData.setPiece = true; scene.add(m); return m; };
// an ink-wash landscape: far mountains in grey washes, a near peak, a pine, a boat, mist
function inkLandscape(g, w, h, seed = 1) {
  g.fillStyle = '#efe6cc'; g.fillRect(0, 0, w, h); let s = seed; const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  for (const [base, amp, a] of [[0.55, 0.22, 0.18], [0.68, 0.18, 0.32], [0.82, 0.12, 0.55]]) { g.fillStyle = `rgba(40,40,44,${a})`; g.beginPath(); g.moveTo(0, h); for (let x = 0; x <= w; x += 4) g.lineTo(x, h * (base - amp * Math.abs(Math.sin(x / w * 7 + r() * 0.2 + base * 9)) * (0.6 + 0.4 * Math.sin(x / w * 3 + base)))); g.lineTo(w, h); g.fill(); }
  g.fillStyle = 'rgba(239,230,204,0.6)'; g.fillRect(0, h * 0.6, w, h * 0.05);
  g.strokeStyle = 'rgba(30,30,34,0.8)'; g.lineWidth = 3; const px = w * 0.2, py = h * 0.7; g.beginPath(); g.moveTo(px, py); g.lineTo(px + 6, py - h * 0.25); g.stroke(); for (let i = 0; i < 5; i++) { g.beginPath(); g.ellipse(px + 4 + (i % 2 ? 14 : -14), py - h * 0.08 - i * h * 0.035, 22 - i * 3, 6, 0, 0, Math.PI * 2); g.fillStyle = 'rgba(30,40,34,0.75)'; g.fill(); }
  g.fillStyle = 'rgba(30,30,34,0.85)'; g.beginPath(); g.moveTo(w * 0.62, h * 0.86); g.lineTo(w * 0.7, h * 0.86); g.lineTo(w * 0.68, h * 0.88); g.lineTo(w * 0.64, h * 0.88); g.fill();
  g.fillStyle = '#a8281e'; g.fillRect(w * 0.86, h * 0.08, 16, 22); // a seal
}
// a lattice of window or door: a dark red frame, a pattern of bars, rice paper glowing a little behind
function lattice(g, w, h, kind = 'grid') {
  g.fillStyle = '#efe2c0'; g.fillRect(0, 0, w, h); g.strokeStyle = '#6a1a12'; g.lineWidth = 9; g.strokeRect(5, 5, w - 10, h - 10); g.lineWidth = 5;
  if (kind === 'grid') { for (let x = w / 6; x < w; x += w / 6) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); } for (let y = h / 8; y < h; y += h / 8) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); } }
  else { for (let i = -h; i < w; i += 36) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i + h, h); g.stroke(); g.beginPath(); g.moveTo(i + h, 0); g.lineTo(i, h); g.stroke(); } }
  g.fillStyle = '#6a1a12'; g.fillRect(0, h * 0.62, w, h * 0.38); g.strokeStyle = '#d8a838'; g.lineWidth = 3; g.strokeRect(w * 0.15, h * 0.68, w * 0.7, h * 0.26); // the panel below
}
const couplet = (text, w = 0.32, h = 1.5) => panel(w, h, tex(64, 300, (g, W, H) => { g.fillStyle = '#a8201a'; g.fillRect(0, 0, W, H); g.fillStyle = '#f0c858'; g.font = `900 ${Math.floor(W * 0.72)}px "Noto Serif TC", serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; [...text].forEach((ch, i) => g.fillText(ch, W / 2, H * (i + 0.5) / text.length)); }), '#6a1010');
const scroll = (text, w = 0.4, h = 1.3) => panel(w, h, tex(80, 260, (g, W, H) => { g.fillStyle = '#e8dcbc'; g.fillRect(0, 0, W, H); g.fillStyle = '#3a2a1a'; g.fillRect(0, 0, W, 10); g.fillRect(0, H - 10, W, 10); g.font = `900 ${Math.floor(W * 0.62)}px "Noto Serif TC", serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; [...text].forEach((ch, i) => g.fillText(ch, W / 2, 20 + (H - 40) * (i + 0.5) / text.length)); }), '#3a2a1a');
const flag = (ch) => panel(0.6, 0.9, tex(120, 180, (g, W, H) => { g.fillStyle = '#26335e'; g.fillRect(0, 0, W, H); g.fillStyle = '#d8a838'; g.fillRect(0, 0, W, 10); for (let x = 0; x < W; x += 20) { g.beginPath(); g.moveTo(x, H); g.lineTo(x + 10, H - 16); g.lineTo(x + 20, H); g.fill(); } g.fillStyle = '#f0e6c8'; g.font = `900 ${W * 0.7}px "Noto Serif TC", serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(ch, W / 2, H * 0.46); }), '#1a2240', { double: true, depth: 0.01 });

export function decorateTeahouse(scene, K, G, O, lamps) {
  // a painted folding screen behind the storyteller, three leaves, each turned a little
  const ink = tex(512, 640, (g, w, h) => inkLandscape(g, w, h, 7));
  [-1, 0, 1].forEach((i) => { const t = ink.clone(); t.needsUpdate = true; t.repeat.set(1 / 3, 1); t.offset.set((i + 1) / 3, 0); const m = panel(0.74, 1.7, t, '#4a2e1c', { depth: 0.05 }); placeAt(scene, O, m, i * 0.72, 0.36 + 0.85 + 0.05, -3.42 + Math.abs(i) * 0.06, -i * 0.16); });
  for (const x of [-1.1, -0.36, 0.36, 1.1]) K.brick(x, BH, -3.38, 1, 1, 'tall', '#4a2e1c');
  // the counter at the back right, with its tea jars and teapots; shelves behind
  for (let z = -3.0; z <= -1.79; z += 2 * P) { K.brick(3.6, 0, z, 4, 2, 'brick', '#5a3a24'); K.brick(3.6, BH, z, 4, 2, 'brick', '#5a3a24'); K.brick(3.6, 2 * BH, z, 4, 2, 'brick', '#4a2e1c'); }
  K.brick(3.6, 3 * BH, -2.4, 5, 6, 'plate', '#6a4228');
  for (const [dx, dz, c] of [[-0.3, -0.25, '#3a5a6a'], [0.0, 0.2, '#8a5a3a'], [0.35, -0.4, '#3a5a6a']]) { K.round(3.6 + dx, 3 * BH + PH, -2.4 + dz, 2, 'brick', c); K.round(3.6 + dx, 4 * BH + PH, -2.4 + dz, 1, 'plate', '#2a1a12'); }
  for (const y of [1.55, 2.2]) { K.brick(3.6, y, -3.42, 8, 2, 'plate', '#4a2e1c'); for (let i = 0; i < 5; i++) { const x = 3.0 + i * 0.3; K.round(x, y + PH, -3.4, i % 2 ? 1 : 2, 'brick', ['#8ab0a0', '#3a5a8a', '#a86a3a', '#d8c8a0', '#6a8a5a'][i]); } }
  // lattice in the windows, and bamboo blinds half drawn
  for (const s of [-1, 1]) for (let z = -2.0; z <= 2.01; z += 0.5) for (let r = 3; r <= 6; r++) K.brick(s * 4.5, r * BH, z, 1, 1, 'plate', '#4a2e1c');
  for (const s of [-1, 1]) { for (const y of [1.6, 2.15]) K.brick(s * 4.5, y, 0, 1, 14, 'plate', '#4a2e1c'); K.brick(s * 4.42, 2.35, 0, 1, 14, 'brick', '#b8a070'); }
  // a red rug before the dais, its gold border
  for (let x = -1.4; x <= 1.41; x += 4 * P) for (let z = -1.55; z <= -0.55; z += 4 * P) K.brick(x, 0, z, 4, 4, 'tile', '#8a1a1a');
  for (let x = -1.65; x <= 1.66; x += 2 * P) { K.brick(x, 0, -1.75, 2, 1, 'tile', '#c8a040'); K.brick(x, 0, -0.35, 2, 1, 'tile', '#c8a040'); }
  // columns at the front corners, a beam and fretwork across the front; a string of little lanterns
  for (const x of [-4.2, 4.2]) { let y = 0; for (let i = 0; i < 9; i++) y = K.round(x, y, 3.4, 2, 'brick', '#7a2018'); }
  for (let x = -4.4 + 2 * P; x < 4.4; x += 4 * P) { K.brick(x, 9 * BH - BH, 3.4, 4, 1, 'brick', '#4a2e1c'); K.brick(x, 9 * BH - BH - PH, 3.4, 4, 1, 'plate', '#c8a040'); }
  for (let x = -3.6; x <= 3.61; x += 0.6) { K.round(x, 2.55, 1.0, 1, 'brick', x % 1.2 ? '#ff7a3a' : '#ffc860', 'glow'); }
  for (const [x, z] of [[-2.2, 0.2], [2.2, 0.2], [0, -1.0]]) { K.brick(x, 2.7 - PH, z, 1, 1, 'plate', '#d8a838'); K.brick(x, 2.4, z, 1, 1, 'tall', '#c8281e'); }
  // food on the tables: buns on a plate, a wine jar
  for (const [tx, tz] of [[-2.2, 0.6], [2.2, 0.6], [0, 2.2]]) { K.round(tx + 0.1, 2 * BH + PH, tz - 0.25, 2, 'plate', '#f0ece0'); K.round(tx + 0.05, 2 * BH + 2 * PH, tz - 0.25, 1, 'plate', '#f4eee0'); K.round(tx + 0.18, 2 * BH + 2 * PH, tz - 0.2, 1, 'plate', '#f4eee0'); }
  K.round(-3.9, 0, -2.9, 2, 'brick', '#6a4a2a'); K.round(-3.9, BH, -2.9, 2, 'brick', '#6a4a2a'); K.round(-3.9, 2 * BH, -2.9, 1, 'plate', '#a8281e'); // a big wine jar
  // potted bamboo in the corner, scrolls on the side walls
  K.round(-3.9, 0, -1.9, 2, 'brick', '#3a3a44'); for (let i = 0; i < 3; i++) { let y = BH; const x = -3.95 + i * 0.12, z = -1.9 + (i - 1) * 0.1; for (let j = 0; j < 7 + i; j++) y = K.round(x, y, z, 1, 'brick', '#5a9a3a'); K.round(x, y, z, 2, 'plate', '#3a8a2a'); }
  for (const [s, t] of [[-1, '茶香'], [1, '雨聲']]) { const m = scroll(t, 0.36, 1.0); placeAt(scene, O, m, s * 4.38, 1.75, -2.6, -s * Math.PI / 2); }
  // the front wall: a doorway in the middle, lattice windows either side, the street seen through them
  for (let x = -4.4 + 2 * P; x < 4.4; x += 4 * P) for (let r = 0; r < 9; r++) { const door = Math.abs(x) < 0.8 && r < 7, win = Math.abs(Math.abs(x) - 2.6) < 0.9 && r >= 3 && r <= 6; if (door || win) continue; K.brick(x, r * BH, 3.62, 4, 1, 'brick', r === 0 || r === 8 ? '#4a2e1c' : '#8a6a48'); }
  for (const s of [-1, 1]) for (let x = 1.9; x <= 3.31; x += 0.3) K.brick(s * x, 3 * BH, 3.62, 1, 1, 'tall', '#4a2e1c');
  const lt = tex(256, 320, (g, w, h) => lattice(g, w, h, 'grid')); for (const s of [-1, 1]) { const m = panel(1.5, 1.2, lt, '#4a2e1c', { depth: 0.02 }); placeAt(scene, O, m, s * 2.6, 1.6, 3.58, Math.PI); m.material[4].transparent = true; m.material[4].opacity = 0.55; }
  for (let x = -6 + 2 * P; x < 6; x += 4 * P) for (let z = 4.2; z < 9; z += 4 * P) K.brick(x, 0, z, 4, 4, 'tile', '#5a5a56'); // the wet street
  for (const [x, z, w] of [[-3.5, 8.8, 4], [2.5, 9.0, 5]]) for (let r = 0; r < 7; r++) for (let i = 0; i < w; i++) K.brick(x - w * 0.6 + i * 1.2 + 0.6, r * BH, z, 4, 2, 'brick', r === 6 ? '#3a3e48' : '#c8c0b0'); // houses across the street
    const warm = new THREE.PointLight('#ffb070', 1.6, 6, 2); warm.position.set(3.4, 2.0, -2.2); G.add(warm); lamps.push(warm);
  const cool = new THREE.PointLight('#8aa8d8', 0.9, 6, 2); cool.position.set(-4.0, 1.8, 0); G.add(cool);
}

export function decorateManor(scene, K, G, O, lamps) {
  // the hall's front: lattice doors between its pillars (the middle pair open), steps up to it, couplets on the pillars
  const lt = tex(256, 320, (g, w, h) => lattice(g, w, h, 'grid')), lt2 = tex(256, 320, (g, w, h) => lattice(g, w, h, 'diamond'));
  for (const [x, w, map] of [[-2.4, 2.2, lt2], [2.4, 2.2, lt2]]) placeAt(scene, O, panel(w, 2.3, map, '#5a1410'), x, 0.48 + 1.15, -3.95);
  for (const s of [-1, 1]) { const d = panel(1.05, 2.3, lt, '#5a1410'); d.geometry.translate(s * 0.52, 0, 0); placeAt(scene, O, d, s * -1.15, 0.48 + 1.15, -3.95, s * 0.9); }
  for (let x = -3.8 + 2 * P; x < 3.8; x += 4 * P) K.brick(x, 0, -3.25, 4, 2, 'plate', '#8a8680');
  for (const [x, t] of [[-1.2, '一刀定乾坤'], [1.2, '千秋護龍門']]) placeAt(scene, O, couplet(t, 0.26, 1.6), x, 1.65, -3.45);
  for (const [x, t] of [[-1.45, '龍騰四海'], [1.45, '門納百川']]) { placeAt(scene, O, couplet(t, 0.3, 1.4), x, 1.6, 6.92); placeAt(scene, O, couplet(t, 0.3, 1.4), x, 1.6, 6.28, Math.PI); }
  // gold ornaments curling up at the ends of the hall's and the gate's ridges
  for (const [x, y, z] of [[-4.5, 8 * BH + 3 * PH + BH, -5.0], [4.5, 8 * BH + 3 * PH + BH, -5.0], [-2.1, 9 * BH + 2 * PH + BH, 6.6], [2.1, 9 * BH + 2 * PH + BH, 6.6]]) { K.slope(x, y, z, 2, 2, '#d8a838', x < 0 ? -Math.PI / 2 : Math.PI / 2); K.brick(x + (x < 0 ? -0.15 : 0.15), y + BH, z, 1, 1, 'brick', '#d8a838'); }
  // the yard: a bronze water vat, flower pots by the steps, a war drum, a training dummy, bamboo, a rock garden, a stone table
  K.round(2.4, 0, -2.5, 4, 'brick', '#6a5a3a'); K.round(2.4, BH, -2.5, 4, 'brick', '#5a4a2e'); K.round(2.4, 2 * BH, -2.5, 4, 'plate', '#3a6a8a'); K.round(2.4, 2 * BH + PH, -2.5, 2, 'plate', '#5aa04a');
  for (const x of [-3.2, 3.2]) { K.round(x, 0, -2.9, 2, 'brick', '#8a4a2a'); for (const [dx, dz, c] of [[0, 0, '#e8304a'], [0.12, 0.1, '#f2c23a'], [-0.1, 0.08, '#e8304a']]) K.round(x + dx, BH, -2.9 + dz, 1, 'plate', c); K.round(x, BH, -2.9, 2, 'plate', '#3a8a2a'); }
  { const x = -4.8, z = -2.4; for (const dx of [-0.35, 0.35]) { let y = 0; for (let i = 0; i < 3; i++) y = K.brick(x + dx, y, z, 1, 1, 'brick', '#5a3a24'); } const drum = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.55, 28), [new THREE.MeshPhysicalMaterial({ color: '#a8281e', roughness: 0.35, clearcoat: 0.6 }), new THREE.MeshPhysicalMaterial({ color: '#e8d8b0', roughness: 0.7 }), new THREE.MeshPhysicalMaterial({ color: '#e8d8b0', roughness: 0.7 })]); drum.rotation.z = Math.PI / 2; drum.castShadow = true; placeAt(scene, O, drum, x, 1.4, z); }
  { const x = -4.6, z = 4.0; let y = 0; for (let i = 0; i < 6; i++) y = K.round(x, y, z, 2, 'brick', '#7a4a2a'); for (const [dy, dx] of [[1.2, 0.35], [1.6, -0.35], [0.8, 0.3]]) K.brick(x + dx, dy, z + 0.05, 2, 1, 'brick', '#6a3a20'); K.round(x, y, z, 2, 'plate', '#5a3a24'); }
  for (let i = 0; i < 9; i++) { const x = 5.3 + (i % 3) * 0.28, z = 5.0 + Math.floor(i / 3) * 0.28; let y = 0; for (let j = 0; j < 9 + (i % 4); j++) y = K.round(x, y, z, 1, 'brick', j % 4 === 3 ? '#3a7a2a' : '#5a9a3a'); K.round(x, y, z, 2, 'plate', '#3a8a2a'); }
  for (const [x, z, r] of [[-5.4, 5.4, 0.3], [-5.0, 5.7, 1.4], [-5.6, 4.9, 2.6], [-5.2, 5.2, 4]]) { K.slope(x, 0, z, 2, 3, '#7a7a76', r); K.brick(x, BH, z, 2, 2, 'plate', '#8a8a86'); }
  { const x = 4.5, z = -3.2; K.round(x, 0, z, 2, 'brick', '#8a8680'); K.round(x, BH, z, 4, 'plate', '#9a968e'); for (const [dx, dz] of [[0.6, 0], [-0.6, 0], [0, 0.6], [0, -0.6]]) K.round(x + dx, 0, z + dz, 1, 'brick', '#8a8680'); K.round(x + 0.1, BH + PH, z, 1, 'plate', '#f0ece0'); }
  // banners on poles inside the gate
  for (const s of [-1, 1]) { const x = s * 2.7, z = 5.6; let y = 0; for (let i = 0; i < 9; i++) y = K.round(x, y, z, 1, 'brick', '#3a2418'); K.round(x, y, z, 1, 'plate', '#d8a838'); placeAt(scene, O, flag('龍'), x + s * 0.32, y - 0.6, z); }
  // the guest pavilion: a folding screen behind the low table
  const ink = tex(384, 320, (g, w, h) => inkLandscape(g, w, h, 3)); placeAt(scene, O, panel(1.8, 1.2, ink, '#4a2e1c'), 4.0, 0.36 + 0.6, -0.55);
}

export function decorateRoad(K, G) {
  // a signpost by the way: 龍門 ten li
  { let y = 0; for (let i = 0; i < 4; i++) y = K.round(2.7, y, -2.4, 1, 'brick', '#6a4a2a'); K.brick(2.55, y - 0.2, -2.4, 4, 1, 'brick', '#8a6a3a'); }
  // a farmer's cart left by the road
  { const x = -3.8, z = -3.4; K.brick(x, 0.3, z, 4, 6, 'plate', '#7a5a34'); for (const s of [-1, 1]) { K.brick(x + s * 0.55, 0.42, z, 1, 6, 'brick', '#6a4a2a'); K.round(x + s * 0.75, 0, z, 4, 'plate', '#4a3020'); } K.brick(x, 0.42, z + 1.2, 1, 6, 'plate', '#6a4a2a'); for (const [dx, dz] of [[-0.2, -0.3], [0.2, 0.2]]) K.round(x + dx, 0.42, z + dz, 2, 'brick', '#c8a060'); }
  // fences along the far fields
  for (const s of [-1, 1]) for (let z = 1; z < 12; z += 1.2) { const x = s * 5.2; K.brick(x, 0, z, 1, 1, 'tall', '#6a4a2a'); K.brick(x, 0.5, z + 0.6, 1, 4, 'plate', '#7a5a34'); K.brick(x, 0.9, z + 0.6, 1, 4, 'plate', '#7a5a34'); }
  // a field of rice in rows
  for (let x = 6.4; x < 13; x += 0.6) for (let z = -1; z < 10; z += 1.2) K.brick(x, 0, z, 1, 4, 'plate', (Math.round(x * 3) % 2) ? '#6aa04a' : '#5a9040');
  // the village behind: low houses of white walls and dark roofs
  for (const [x, z, w] of [[-8, -15, 4], [-2, -17, 5], [4, -16, 4], [10, -15, 3]]) { for (let r = 0; r < 5; r++) for (let i = 0; i < w; i++) K.brick(x - w * 0.6 + i * 1.2 + 0.6, r * BH, z, 4, 4, 'brick', r === 4 ? '#3a3e48' : '#d0c8b8'); for (let i = 0; i < w; i++) { K.slope(x - w * 0.6 + i * 1.2 + 0.6, 5 * BH, z - 0.6, 4, 2, '#2e323c', 0); K.slope(x - w * 0.6 + i * 1.2 + 0.6, 5 * BH, z + 0.6, 4, 2, '#2e323c', Math.PI); } }
}
