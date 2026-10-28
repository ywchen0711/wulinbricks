// 黑風寨 the Black Wind gang: three bandits who prey on the road. 黑熊 Black Bear, the chief: big, bearded, a vest
// over a dark coat, a heavy wooden club. 刀疤 Scar: a scar across his eye, a grey coat and head wrap, a chipped
// broadsword. 瘦猴 Skinny Monkey: thin and quick, in patched brown, nothing in his hands but his fists. All of them
// swagger at rest.
import * as THREE from '../../lib/three.module.min.js';
import { makeFig, plastic, rbox } from '../brick/minifig.js';

const idleSwagger = (lean) => (c) => ({
  pose: { armR: 0.15 + Math.sin(c * 1.6) * 0.04, outR: 0.5, armL: 0.15, outL: 0.5, hipR: -0.12, hipL: 0.12, tilt: lean + Math.sin(c * 1.6) * 0.02, yaw: 0.1, head: Math.sin(c * 0.7) * 0.25, y: Math.sin(c * 3.2) * 0.004 },
  face: { mouth: { smile: 0.55 }, browIn: 0.8, blink: (c % 3.9) < 0.11 ? 1 : 0 },
});
function bandit(spec, gear) {
  return (scene) => {
    const F = makeFig(spec), mesh = (g, m, p) => { const o = new THREE.Mesh(g, m); o.castShadow = true; o.receiveShadow = true; p.add(o); return o; };
    const grip = new THREE.Group(); grip.rotation.x = Math.PI / 2 - 1.05; grip.userData.fight = grip.rotation.x; grip.userData.carry = gear.club ? 'shoulder' : 'down'; F.hands[0].add(grip);
    let tip = null;
    if (gear.club) { mesh(new THREE.CylinderGeometry(1.0, 1.8, 30, 12), plastic('#6a4428', { roughness: 0.6 }), grip).position.y = 12; for (const y of [8, 16, 22]) { const n = mesh(new THREE.SphereGeometry(1.4, 8, 6), plastic('#4a2e1a'), grip); n.position.set(1.2, y, 0); } tip = new THREE.Object3D(); tip.position.y = 26; grip.add(tip); }
    if (gear.sword) { mesh(new THREE.CylinderGeometry(0.75, 0.75, 6, 10), plastic('#2a1a14'), grip); const gd = mesh(rbox(5, 1, 1.6, 0.4), plastic('#6a6a64', { metalness: 0.6 }), grip); gd.position.y = 3.4; const b = mesh(rbox(3.2, 20, 0.6, 0.3), new THREE.MeshPhysicalMaterial({ color: '#a8aeb4', metalness: 0.8, roughness: 0.4 }), grip); b.position.y = 14; tip = new THREE.Object3D(); tip.position.y = 24; grip.add(tip); }
    if (gear.headwrap) { const w = mesh(new THREE.SphereGeometry(6.1, 30, 14, 0, Math.PI * 2, 0, Math.PI * 0.5), plastic(gear.headwrap), F.headP); w.position.y = 6.6; w.scale.set(1, 0.85, 1); const k = mesh(new THREE.SphereGeometry(1.8, 10, 8), plastic(gear.headwrap), F.headP); k.position.set(-4, 9, -3.5); }
    if (gear.vest) { const v = mesh(rbox(16.4, 12.4, 1.0, 0.4), plastic(gear.vest), F.body); v.position.set(0, 21.6, -4.2); }
    scene?.add(F.root);
    return { F, tip, grips: tip ? [grip] : [], remove() { F.root.parent?.remove(F.root); }, sway() {}, setGlow() {} };
  };
}
const gang = (id, zh, en, title, bio, spec, gear, lean, moves) => ({ id, name: { zh, en }, title, bio, spec, moves, gang: 'heifeng', build: bandit(spec, gear), idle: idleSwagger(lean) });

export const HEIXIONG = gang('heixiong', '黑熊', 'Black Bear', { zh: '黑風寨寨主', en: 'Chief of the Black Wind' },
  { zh: '黑風寨的寨主，人高馬大，一根大木棍打遍附近的山路。', en: 'Chief of the Black Wind gang, a great hulk who rules the mountain roads round about with his wooden club.' },
  { age: 'adult', beard: '#1a1210', swordBrows: true, colors: { top: '#3a2a22', bottom: '#2a2420', shoes: '#1a1412' }, outfit: { top: 'robe', bottom: 'pants' }, robe: { inner: '#5a4030', trim: '#8a6a3a', belt: '#a02a1a', tassel: '#d8a838', ink: 'rgba(0,0,0,0.2)' }, hair: { style: 'short', color: '#1a1210' } },
  { club: true, vest: '#5a3a24' }, -0.06, ['club', 'punch']);
export const DAOBA = gang('daoba', '刀疤', 'Scar', { zh: '黑風寨二當家', en: 'Second of the Black Wind' },
  { zh: '眼上一道刀疤的二當家，一把缺了口的大刀，說話總是陰陰的。', en: 'The gang’s second, with a scar across his eye and a chipped broadsword, and a voice that is always sly.' },
  { age: 'adult', scar: true, stubble: true, swordBrows: true, colors: { top: '#5a5e66', bottom: '#2a2c32', shoes: '#1a1a1e' }, outfit: { top: 'robe', bottom: 'pants' }, robe: { inner: '#2a2a2e', trim: '#8a8e96', belt: '#1a1a1e', ink: 'rgba(0,0,0,0.18)' }, hair: { style: 'short', color: '#2a2220' } },
  { sword: true, headwrap: '#2a2c32' }, 0.0, ['punch']);
export const SHOUHOU = gang('shouhou', '瘦猴', 'Skinny Monkey', { zh: '黑風寨嘍囉', en: 'A Black Wind lackey' },
  { zh: '又瘦又快的小嘍囉，嘴巴比拳頭還快。', en: 'A thin, quick lackey whose mouth is quicker than his fists.' },
  { age: 'adult', stubble: true, colors: { top: '#8a6a4a', bottom: '#5a4a3a', shoes: '#3a2a20' }, outfit: { top: 'robe', bottom: 'pants' }, robe: { inner: '#c8b08a', trim: '#6a5038', belt: '#3a2a1a', ink: 'rgba(60,40,20,0.3)' }, hair: { style: 'spiky', color: '#2a1a12' } },
  {}, 0.08, ['punch']);
