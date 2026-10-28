// What the move is tried on: a training post of round brown bricks and, behind it, a stone wall, every brick its own
// piece so the crescent can split them. A brick in the crescent's path comes apart into two halves, their cut faces
// glowing, thrown aside and forward, tumbling to the floor; the others stay where they are.
import * as THREE from '../lib/three.module.min.js';
import { mergeGeometries } from '../lib/addons/BufferGeometryUtils.js';
import { rbox } from './brick/minifig.js';

const P = 0.3, BH = 0.36, SR = 0.09, SH = 0.052;
const cache = {};
function block(w, d, h = BH, round = false, half = 0) { // half: -1 or 1, the left or right half of a cut piece, no studs
  const k = [w, d, h, round, half].join(); if (cache[k]) return cache[k];
  const parts = [];
  if (round) { const r = w * P / 2 - 0.006, g = half ? new THREE.CylinderGeometry(r, r, h - 0.004, 28, 1, false, half > 0 ? 0 : Math.PI, Math.PI) : new THREE.CylinderGeometry(r, r, h - 0.004, 28); g.translate(0, h / 2, 0); parts.push(g); if (half) { const cap = new THREE.PlaneGeometry(r * 2, h - 0.004); cap.rotateY(Math.PI / 2 * (half > 0 ? -1 : 1)); cap.translate(0, h / 2, 0); parts.push(cap); } }
  else { const W = half ? w * P / 2 - 0.004 : w * P - 0.008, g = rbox(W * 100, (h - 0.004) * 100, (d * P - 0.008) * 100, 1.8); g.scale(0.01, 0.01, 0.01); g.translate(half ? half * W / 2 : 0, h / 2, 0); parts.push(g); }
  if (!half) for (let i = 0; i < w; i++) for (let j = 0; j < d; j++) { if (round && w > 1 && Math.hypot(i - (w - 1) / 2, j - (d - 1) / 2) > w / 2 - 0.4) continue; const s = new THREE.CylinderGeometry(SR, SR, SH, 16); s.translate((i - (w - 1) / 2) * P, h + SH / 2, (j - (d - 1) / 2) * P); parts.push(s); }
  const m = mergeGeometries(parts.map((g) => (g.index ? g.toNonIndexed() : g)).map((g) => { for (const n of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(n)) g.deleteAttribute(n); return g; }), false); m.computeVertexNormals(); return (cache[k] = m);
}
const mat = (c) => new THREE.MeshPhysicalMaterial({ color: c, roughness: 0.32, clearcoat: 0.5, clearcoatRoughness: 0.25 });

export function makeTargets(scene) {
  const G = new THREE.Group(); scene.add(G);
  let pieces = [], flying = [];
  function build() {
    for (const p of [...pieces, ...flying]) G.remove(p.m); pieces = []; flying = [];
    const put = (geo, color, x, y, z, info) => { const m = new THREE.Mesh(geo, mat(color)); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; G.add(m); pieces.push({ m, color, ...info }); };
    // the post: a plate foot, round bricks, a cap
    put(block(4, 4, 0.12), '#5a4a3a', 0, 0, 4.5, { w: 4, d: 4, h: 0.12, solid: false });
    let y = 0.12; for (let i = 0; i < 6; i++) { put(block(2, 2, BH, true), i % 3 === 2 ? '#6a4228' : '#8a5a34', 0, y, 4.5, { w: 2, d: 2, h: BH, round: true }); y += BH; }
    put(block(2, 2, 0.12, true), '#c8a040', 0, y, 4.5, { w: 2, d: 2, h: 0.12, round: true });
    // the wall: grey stone, staggered, eight rows, with a cap of dark plates
    const Wd = 14, rows = 8;
    for (let r = 0; r < rows; r++) { const off = r % 2 ? 1 : 0; for (let i = -off; i < Wd; i += 2) { const a = Math.max(0, i), b = Math.min(Wd, i + 2), w = b - a; if (w <= 0) continue; const x = (a + w / 2 - Wd / 2) * P; put(block(w, 2), ['#8a8a86', '#7c7c78', '#96948e'][(r * 7 + i) % 3], x, r * BH, 8.2, { w, d: 2, h: BH }); } }
    for (let i = 0; i < Wd; i += 2) put(block(2, 2, 0.12), '#4a4c52', (i + 1 - Wd / 2) * P, rows * BH, 8.2, { w: 2, d: 2, h: 0.12 });
  }
  build();
  // the crescent goes by: at (x, z) along dir, h tall; split what it passes through
  function cut(wx, wz, dir, h, onHit) {
    let any = false;
    for (let i = pieces.length - 1; i >= 0; i--) {
      const p = pieces[i], m = p.m, half = p.w * P / 2;
      if (p.solid === false) continue;
      if (Math.abs(m.position.z - wz) > 0.25 || Math.abs(m.position.x - wx) > half + 0.02 || m.position.y > h) continue;
      pieces.splice(i, 1); G.remove(m); any = true;
      for (const s of [-1, 1]) {
        const g = block(p.w, p.d, p.h, !!p.round, s), mm = mat(p.color); mm.emissive = new THREE.Color('#5ad0ff'); mm.emissiveIntensity = 0.5;
        const q = new THREE.Mesh(g, mm); q.position.copy(m.position); q.castShadow = true; G.add(q);
        const k = 0.6 + Math.random() * 0.8;
        flying.push({ m: q, v: new THREE.Vector3(s * (1.2 + Math.random() * 2.2) * k, 0.8 + Math.random() * 2.2, 0).addScaledVector(dir, 1.5 + Math.random() * 2.5), w: new THREE.Vector3((Math.random() - 0.5) * 8, (Math.random() - 0.5) * 6, s * (2 + Math.random() * 5)), half: p.w * P / 4, rest: false, age: 0 });
      }
    }
    if (any) onHit?.();
    return any;
  }
  // a blow: whole bricks near a point thrown off it, along dir, and round it if swirl (column: only how far across counts)
  function blast(c, r, dir, { column = false, swirl = 0 } = {}) {
    let any = false;
    for (let i = pieces.length - 1; i >= 0; i--) {
      const p = pieces[i], m = p.m, mid = m.position.clone().add(new THREE.Vector3(0, p.h / 2, 0)), off = mid.clone().sub(c); if (column) off.y = 0;
      if (off.length() > r) continue;
      pieces.splice(i, 1); any = true; m.material = m.material.clone(); m.material.emissive = new THREE.Color('#6affc0'); m.material.emissiveIntensity = 0.35;
      const out = mid.clone().sub(c).setZ(0); if (out.lengthSq() < 1e-4) out.set(Math.random() - 0.5, 0.5, 0); out.normalize();
      const tan = new THREE.Vector3().crossVectors(dir, out).normalize(), k = 1 - off.length() / r * 0.5;
      const v = out.multiplyScalar(2 + Math.random() * 2.5).addScaledVector(dir, (4 + Math.random() * 4) * k).addScaledVector(tan, swirl * (0.6 + Math.random() * 0.8)); v.y += 1.5 + Math.random() * 2.5 + (column ? mid.y * 1.2 : 0);
      flying.push({ m, v, w: new THREE.Vector3((Math.random() - 0.5) * 12, (Math.random() - 0.5) * 12, (Math.random() - 0.5) * 12), rest: false, age: 0 });
    }
    return any;
  }
  function update(dt) {
    for (const f of flying) {
      f.age += dt; if (f.m.material.emissiveIntensity > 0) f.m.material.emissiveIntensity = Math.max(0, 0.5 - f.age * 0.6);
      if (f.rest) continue;
      f.v.y -= 9.8 * dt; f.m.position.addScaledVector(f.v, dt);
      f.m.rotation.x += f.w.x * dt; f.m.rotation.y += f.w.y * dt; f.m.rotation.z += f.w.z * dt;
      if (f.m.position.y < 0.02) { f.m.position.y = 0.02; f.v.y = Math.abs(f.v.y) * 0.28; f.v.x *= 0.6; f.v.z *= 0.6; f.w.multiplyScalar(0.55); if (Math.abs(f.v.y) < 0.4 && f.v.length() < 0.5) { f.rest = true; f.m.rotation.x = Math.round(f.m.rotation.x / (Math.PI / 2)) * Math.PI / 2; f.m.rotation.z = Math.round(f.m.rotation.z / (Math.PI / 2)) * Math.PI / 2; } }
    }
  }
  return { build, cut, blast, update, show(b) { G.visible = b; if (!b) { for (const p of flying) G.remove(p.m); flying = []; } }, get broken() { return flying.length > 0; } };
}
