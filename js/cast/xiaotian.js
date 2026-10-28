// 冷笑天 Leng Xiaotian, known as 暴龍 the Tyrant Dragon: a tall, cold master. A black robe printed with gold dragon
// scales over crimson, a gold sash; a crimson cape from the shoulders; long silver hair falling down his back and two
// locks beside his face; a gold band with two dragon horns swept back; shadowed eyes and a sneer at one corner of the
// mouth. No weapon: he fights with his palms, which burn crimson as he gathers his qi. At rest he stands with his hands
// behind his back and his chin up.
import * as THREE from '../../lib/three.module.min.js';
import { makeFig, plastic, rbox } from '../brick/minifig.js';

export const XIAOTIAN = {
  id: 'xiaotian',
  name: { zh: '冷笑天', en: 'Leng Xiaotian' },
  title: { zh: '暴龍', en: 'The Tyrant Dragon' },
  bio: {
    zh: '江湖人稱「暴龍」。出手之前總要先冷笑三聲——聽過他笑聲的人，多半已經躺在地上了。',
    en: 'Known on the rivers and lakes as the Tyrant Dragon. Before he strikes he always laughs three cold laughs, and most who have heard them are already lying on the ground.',
  },
  spec: {
    age: 'adult', swordBrows: true, eyeShadow: 'rgba(120,20,40,0.35)', browColor: '#c8ccd4',
    colors: { top: '#1a1418', bottom: '#141014', shoes: '#0e0a0c' },
    outfit: { top: 'robe', bottom: 'pants' },
    robe: { inner: '#8a1020', trim: '#d8a838', belt: '#d8a838', tassel: '#8a1020', ink: 'rgba(216,168,56,0.28)' },
    hair: { style: 'short', color: '#d8dce4' },
  },
  poem: { zh: ['冷笑三聲天下寒，', '暴龍一怒海波翻；', '世人笑我狂且傲，', '我笑世人看不穿。'], en: ['Three cold laughs, and all the world goes cold;', 'the Tyrant Dragon’s rage turns the seas;', 'the world laughs that I am mad and proud —', 'I laugh that the world cannot see through.'] },
  moves: ['xiaojin'],
  build: (scene) => buildXiaoTian(scene),
  // at rest: hands behind his back, chin up, a slow look round, the sneer
  idle(c) {
    return {
      pose: { armR: 0.55, outR: -0.05, armL: 0.55, outL: -0.05, hipR: -0.1, hipL: 0.1, tilt: -0.06 + Math.sin(c * 1.1) * 0.01, yaw: 0.2, head: Math.sin(c * 0.35) * 0.35, y: Math.sin(c * 1.1) * 0.004 },
      face: { smirk: 0.8, eyes: 0.7, browIn: 0.7, blink: (c % 5.1) < 0.1 ? 1 : 0 },
    };
  },
};

export function buildXiaoTian(scene) {
  const F = makeFig(XIAOTIAN.spec), H = F.headP, B = F.body;
  const mesh = (g, m, p) => { const o = new THREE.Mesh(g, m); o.castShadow = true; o.receiveShadow = true; p.add(o); return o; };
  const hair = plastic('#d8dce4', { roughness: 0.35 }), gold = plastic('#d8a838', { metalness: 0.6, roughness: 0.28 }), crimson = plastic('#8a1020');
  hair.side = THREE.DoubleSide;
  // long silver hair down the back, two locks before the ears
  const back = mesh(new THREE.CylinderGeometry(5.9, 7.2, 18, 28, 1, true, Math.PI * 0.74, Math.PI * 0.52), hair, H); back.position.set(0, -0.6, -0.4);
  for (const s of [-1, 1]) { const l = mesh(rbox(1.4, 8, 1.2, 0.5), hair, H); l.position.set(s * 5.4, 3.0, 1.4); l.rotation.z = s * 0.06; }
  // the gold band and its two dragon horns, swept back
  const band = mesh(new THREE.CylinderGeometry(6.0, 6.0, 1.2, 40, 1, true), gold, H); band.position.y = 8.2; gold.side = THREE.DoubleSide;
  for (const s of [-1, 1]) {
    const horn = new THREE.Group(); horn.position.set(s * 3.6, 9.4, 1.6); horn.rotation.set(-0.55, 0, -s * 0.55); horn.scale.setScalar(1.45); H.add(horn);
    const path = new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 3, -0.6), new THREE.Vector3(0, 5.6, -2.4), new THREE.Vector3(0, 7.2, -5)]);
    const tube = new THREE.TubeGeometry(path, 16, 1.25, 10, false), p = tube.attributes.position; // tapering to a point
    for (let i = 0; i < p.count; i++) { const k = 1 - Math.floor(i / 11) / 16 * 0.85, c = path.getPointAt(Math.min(1, Math.floor(i / 11) / 16)); p.setXYZ(i, c.x + (p.getX(i) - c.x) * k, c.y + (p.getY(i) - c.y) * k, c.z + (p.getZ(i) - c.z) * k); }
    tube.computeVertexNormals(); mesh(tube, gold, horn);
  }
  const gem = mesh(new THREE.OctahedronGeometry(1.2), new THREE.MeshPhysicalMaterial({ color: '#c81030', emissive: '#c81030', emissiveIntensity: 0.6, roughness: 0.1 }), H); gem.position.set(0, 8.2, 6.0);
  // the crimson cape, hung from the shoulders, swinging
  const cape = new THREE.Group(); cape.position.set(0, 26.5, -4.6); B.add(cape);
  const cm = mesh(rbox(17, 22, 0.8, 0.4), crimson, cape); cm.position.y = -11;
  const ct = mesh(rbox(17.4, 1.6, 1.2, 0.4), gold, cape); ct.position.y = -0.4;
  // the palms, burning as he gathers: a glow round each hand
  const glows = F.hands.map((h) => { const g = new THREE.Mesh(new THREE.SphereGeometry(2.6, 18, 12), new THREE.MeshBasicMaterial({ color: '#ff3a4a', transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false })); g.position.y = -0.6; h.add(g); return g; });
  scene?.add(F.root);
  return {
    F, glows, cape, tip: F.hands[0], base: F.hands[1],
    remove() { F.root.parent?.remove(F.root); },
    setGlow(k) { glows.forEach((g, i) => { g.material.opacity = Math.min(0.9, k * 0.8); g.scale.setScalar(1 + k * 0.6 + Math.sin(performance.now() * 0.02 + i) * 0.08 * k); }); },
    sway(t, speed = 0) { cape.rotation.x = -0.08 - speed * 0.7 + Math.sin(t * 2.3) * 0.05; },
  };
}
