// 奕叡 Yi Rui, the departing blade: a young swordsman as a minifigure. An indigo robe crossed over a white one, silver
// trim, a black sash with a jade tassel; long black hair with a high tail through a silver ring; a blue headband whose
// ties fly behind him; robe panels over the legs; a scabbard at the left hip; and in his right hand a saber (刀), a
// broad single-edged blade with a ring pommel, whose steel lights up as he gathers his qi.
import * as THREE from '../../lib/three.module.min.js';
import { makeFig, plastic, rbox } from '../brick/minifig.js';

export const YIRUI = {
  id: 'yirui',
  name: { zh: '奕叡', en: 'Yi Rui' },
  title: { zh: '啟程刀客', en: 'The Departing Blade' },
  bio: {
    zh: '背著一把舊刀離開家門的少年刀客。話不多，眉眼總是往前看。他相信再遠的路，都是從第一刀開始的。',
    en: 'A young swordsman who left home with an old saber on his back. He says little and always looks ahead: however long the road, he believes it begins with the first cut.',
  },
  spec: {
    age: 'adult', swordBrows: true,
    colors: { top: '#26335e', bottom: '#1c2444', shoes: '#16121a' },
    outfit: { top: 'robe', bottom: 'pants' },
    robe: { inner: '#eef0f4', trim: '#c8d4ea', belt: '#18181f', tassel: '#3ab08a', ink: 'rgba(200,215,240,0.16)' },
    hair: { style: 'short', color: '#15100d' },
  },
  poem: { zh: ['孤刀一柄出龍門，', '不問前程問本心；', '縱使天下皆疑我，', '一刀啟程萬里新。'], en: ['One lone blade goes out of Longmen,', 'asking not the road ahead but his own heart;', 'though all the world should doubt him,', 'one cut, and ten thousand miles begin anew.'] },
  moves: ['yidao'],
  brother: 'yishuo',
  build: (scene) => buildYiRui(scene),
  // at rest: on guard, breathing, glancing about
  idle(c) {
    return {
      pose: { armR: -0.55 + Math.sin(c * 1.3) * 0.02, outR: 0.12, armL: -0.95 + Math.sin(c * 2.1) * 0.03, outL: -0.25, hipR: -0.3, hipL: 0.25, tilt: 0.04, yaw: 0.35, head: -0.3 + Math.sin(c * 0.4) * 0.15, y: Math.sin(c * 2.1) * 0.006 },
      face: { browIn: 0.6, mouth: { smile: 0.15 }, blink: (c % 4.3) < 0.12 ? 1 : 0 },
    };
  },
};

const steel = () => new THREE.MeshPhysicalMaterial({ color: '#dfe6ee', metalness: 0.9, roughness: 0.16, clearcoat: 1, emissive: '#5ad8ff', emissiveIntensity: 0 });
function bladeGeo() { // the saber's blade, in millimetres: the spine nearly straight, the edge swelling toward a clipped tip
  const s = new THREE.Shape();
  s.moveTo(-1.25, 0); s.lineTo(1.5, 0); s.quadraticCurveTo(1.9, 12, 2.5, 21); s.quadraticCurveTo(2.6, 24.5, 1.2, 27.2); s.lineTo(-0.6, 26.4); s.quadraticCurveTo(-1.2, 18, -1.25, 0);
  const g = new THREE.ExtrudeGeometry(s, { depth: 0.3, bevelEnabled: true, bevelThickness: 0.18, bevelSize: 0.3, bevelSegments: 2, curveSegments: 16 }); g.translate(0, 0, -0.15); g.computeVertexNormals(); return g;
}

export function buildYiRui(scene) {
  const F = makeFig(YIRUI.spec), H = F.headP, B = F.body;
  const mesh = (g, m, p) => { const o = new THREE.Mesh(g, m); o.castShadow = true; o.receiveShadow = true; p.add(o); return o; };
  const hair = plastic('#15100d', { roughness: 0.42 }), silver = plastic('#c8ccd4', { metalness: 0.7, roughness: 0.25 }), band = plastic('#2f6fd0'), robe = plastic('#26335e'), dark = plastic('#22181a');
  // hair: long down the back, a knot on top with a silver ring, the tail falling behind it
  const back = mesh(new THREE.CylinderGeometry(5.7, 6.6, 12, 28, 1, true, Math.PI * 0.62, Math.PI * 0.76), hair, H); back.position.set(0, 2.2, -0.4); hair.side = THREE.DoubleSide; // long hair falling behind
  mesh(new THREE.CylinderGeometry(2.0, 2.4, 3.0, 18), hair, H).position.set(0, 12.0, -1.2);
  const ring = mesh(new THREE.TorusGeometry(2.35, 0.45, 10, 24), silver, H); ring.position.set(0, 12.4, -1.2); ring.rotation.x = Math.PI / 2;
  const tail = new THREE.Group(); tail.position.set(0, 12.6, -2.6); H.add(tail);
  mesh(new THREE.CapsuleGeometry(1.7, 9, 6, 12), hair, tail).position.set(0, -4.6, -0.6);
  // the headband, and its two ties
  const hb = mesh(new THREE.CylinderGeometry(5.95, 5.95, 1.3, 40, 1, true), band, H); hb.position.y = 8.0; band.side = THREE.DoubleSide;
  const ties = [];
  for (const s of [-1, 1]) { const p = new THREE.Group(); p.position.set(s * 0.9, 8.0, -5.7); H.add(p); const t = mesh(rbox(1.3, 10, 0.35, 0.15), band, p); t.position.y = -5; ties.push(p); }
  // robe panels over the legs (they swing with the legs), one behind
  for (let i = 0; i < 2; i++) { const pn = mesh(rbox(7.0, 9.0, 0.8, 0.4), robe, F.legs[i]); pn.position.set(0, -6.2, 3.7); const tr = mesh(rbox(7.2, 0.9, 0.9, 0.3), plastic('#c8d4ea'), F.legs[i]); tr.position.set(0, -10.6, 3.7); }
  const bp = mesh(rbox(15.0, 10.0, 0.8, 0.4), robe, B); bp.position.set(0, 7.6, -4.3);
  // the scabbard, slung at the left hip, pointing down and back
  const sc = new THREE.Group(); sc.position.set(8.4, 14.5, -1.5); sc.rotation.set(0.75, 0, 0.12); B.add(sc);
  mesh(rbox(3.2, 21, 1.5, 0.6), dark, sc).position.y = -10.5; for (const y of [-1, -10, -20.5]) mesh(rbox(3.7, 1.1, 1.8, 0.4), silver, sc).position.y = y;
  // the saber, through the grip of the right hand
  const hand = F.hands[0], grip = new THREE.Group(); grip.rotation.x = Math.PI / 2 - 1.05; grip.userData.fight = grip.rotation.x; grip.userData.carry = 'down'; hand.add(grip); // the blade straight ahead with the arm hanging; raising the arm raises it
  mesh(new THREE.CylinderGeometry(0.75, 0.8, 7, 12), plastic('#2a1a16'), grip);
  for (let i = 0; i < 4; i++) { const w = mesh(new THREE.TorusGeometry(0.82, 0.18, 6, 14), plastic('#a8302a'), grip); w.rotation.x = Math.PI / 2; w.position.y = -2.4 + i * 1.6; }
  const pom = mesh(new THREE.TorusGeometry(1.4, 0.42, 10, 20), silver, grip); pom.position.y = -4.9;
  const guard = mesh(new THREE.CylinderGeometry(2.6, 2.6, 0.9, 20), plastic('#c8a040', { metalness: 0.6, roughness: 0.3 }), grip); guard.position.y = 3.9; guard.scale.set(1, 1, 0.55);
  const blade = new THREE.Group(); blade.position.y = 4.3; blade.rotation.y = Math.PI / 2; grip.add(blade); // the blade's flat faces sideways, its edge leading the cut
  const bm = steel(), bmesh = mesh(bladeGeo(), bm, blade);
  const halo = new THREE.Mesh(bladeGeo(), new THREE.MeshBasicMaterial({ color: '#7ae4ff', transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false })); halo.scale.set(1.12, 1.02, 1.8); halo.position.x = 0.05; blade.add(halo);
  const tip = new THREE.Object3D(); tip.position.set(1.0, 26.5, 0); blade.add(tip);
  const base = new THREE.Object3D(); base.position.set(0.2, 3, 0); blade.add(base);
  void bmesh;
  scene?.add(F.root);
  return {
    F, tip, base, ties, tail, grips: [grip], remove() { F.root.parent?.remove(F.root); },
    setGlow(k) { bm.emissiveIntensity = k * 2.2; halo.material.opacity = Math.min(0.6, k * 0.4); },
    // the loose things: ties and tail swing with time, and fly back when he moves fast
    sway(t, speed = 0) { ties.forEach((p, i) => { p.rotation.x = -0.35 - speed * 0.9 + Math.sin(t * 5.2 + i * 1.7) * 0.12; p.rotation.z = (i ? 1 : -1) * (0.12 + Math.sin(t * 3.1 + i) * 0.05); }); tail.rotation.x = -0.25 - speed * 0.6 + Math.sin(t * 3.4) * 0.06; },
  };
}
