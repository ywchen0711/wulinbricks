// The people of 龍門雙奕 episode 1 beyond the brothers and the bandits:
//   奕長風 the brothers' father, master of the Longmen Saber Manor: a deep teal robe with the family's indigo sash,
//          a grey-streaked beard, a small gold crown on his topknot, a saber at his hip
//   鐵無私 the deputy chief of the alliance, head of its Law Hall: black and iron robes, a black official's hat with
//          wings, a stern brow and moustache, an iron ruler in his hand
//   司徒鎮岳 the alliance chief: a wine-purple robe worked with gold, a gold crown with a gem, a long grey beard, a kind
//          smile (and, hidden by his sleeve, an old burn scar on his wrist)
//   白先生 the storyteller of the Listening-to-Rain teahouse: a pale blue-grey scholar's robe, a square black cap, a
//          thin moustache, a folding fan in his right hand and the wooden clapper (醒木) in his left
//   執法堂弟子 two Law Hall guards: black with red sashes, a dark cap, a spear
//   茶客 three listeners at the teahouse: an old man, an auntie with her hair in a bun, a young pedlar
import * as THREE from '../../lib/three.module.min.js';
import { makeFig, plastic, rbox } from '../brick/minifig.js';

const mk = (F) => (g, m, p) => { const o = new THREE.Mesh(g, m); o.castShadow = true; o.receiveShadow = true; p.add(o); return o; };
const behind = (lean = -0.04) => (c) => ({ pose: { armR: 0.5, outR: -0.05, armL: 0.5, outL: -0.05, hipR: -0.08, hipL: 0.08, tilt: lean, yaw: 0.1, head: Math.sin(c * 0.4) * 0.2, y: Math.sin(c * 1.4) * 0.004 }, face: { mouth: { smile: 0.25 }, browIn: 0.3, blink: (c % 4.6) < 0.1 ? 1 : 0 } });
const plain = (face = {}) => (c) => ({ pose: { armR: -0.15 + Math.sin(c * 1.3) * 0.03, outR: 0.12, armL: -0.15, outL: 0.12, hipR: -0.06, hipL: 0.06, head: Math.sin(c * 0.5) * 0.25, y: Math.sin(c * 1.7) * 0.004 }, face: { mouth: { smile: 0.4 }, ...face, blink: (c % 3.9) < 0.1 ? 1 : 0 } });
function base(spec, dress) { return (scene) => { const F = makeFig(spec), mesh = mk(F), extra = dress?.(F, mesh) || {}; scene?.add(F.root); return { F, grips: F.grips || [], tip: F.tipObj || null, remove() { F.root.parent?.remove(F.root); }, sway() {}, setGlow() {}, ...extra }; }; }
const gripOf = (F, side = 0, carry = null) => { const g = new THREE.Group(); g.rotation.x = Math.PI / 2 - 1.05; g.userData.fight = g.rotation.x; if (carry) { g.userData.carry = carry; (F.grips ||= []).push(g); } F.hands[side].add(g); return g; };
const topknot = (H, mesh, hairM, crownC) => { mesh(new THREE.CylinderGeometry(1.9, 2.3, 2.8, 16), hairM, H).position.set(0, 12.0, -1.0); if (crownC) { const c = mesh(new THREE.CylinderGeometry(2.6, 2.9, 1.8, 18, 1, true), plastic(crownC, { metalness: 0.5, roughness: 0.3 }), H); c.position.set(0, 12.2, -1.0); c.material.side = THREE.DoubleSide; } };

export const CHANGFENG = {
  id: 'changfeng', name: { zh: '奕長風', en: 'Yi Changfeng' }, title: { zh: '龍門刀莊莊主', en: 'Master of the Longmen Manor' },
  bio: { zh: '奕叡與奕碩的父親。半生磨刀，從不輕易出刀。', en: 'Father of Yi Rui and Yi Shuo. Half a life spent honing a blade he seldom draws.' },
  poem: { zh: ['半生磨刀未染塵，', '一身清白託兒孫；', '天牢縱鎖英雄骨，', '鎖不住龍門一片心。'], en: ['Half a life honing a blade unstained,', 'a clean name left to his sons;', 'a prison may chain a hero’s bones,', 'it cannot chain the heart of Longmen.'] },
  spec: { age: 'adult', swordBrows: true, beard: '#4a4440', colors: { top: '#2a4a52', bottom: '#1c2a30', shoes: '#141012' }, outfit: { top: 'robe', bottom: 'pants' }, robe: { inner: '#e8e4d8', trim: '#c8a040', belt: '#26335e', tassel: '#3ab08a', ink: 'rgba(200,220,220,0.14)' }, hair: { style: 'short', color: '#3a3430' } },
  moves: [], idle: behind(-0.03),
  build: base(null, null),
};
CHANGFENG.build = base(CHANGFENG.spec, (F, mesh) => {
  topknot(F.headP, mesh, plastic('#3a3430', { roughness: 0.4 }), '#d8a838');
  const sc = new THREE.Group(); sc.position.set(8.4, 14.5, -1.5); sc.rotation.set(0.75, 0, 0.12); F.body.add(sc); mesh(rbox(3.2, 21, 1.5, 0.6), plastic('#22181a'), sc).position.y = -10.5;
});

export const TIEWUSI = {
  id: 'tiewusi', name: { zh: '鐵無私', en: 'Tie Wusi' }, title: { zh: '副盟主・執法堂主', en: 'Deputy Chief, Head of the Law Hall' },
  bio: { zh: '執法如山，只認證據不認人。', en: 'He keeps the law like a mountain: he believes evidence, not people.' },
  poem: { zh: ['鐵面一張不認親，', '律條兩字重千鈞；', '是非黑白憑真證，', '天下無人敢欺心。'], en: ['An iron face that knows no kin,', 'two words of law that weigh a thousand;', 'right and wrong by proof alone,', 'none under heaven dares deceive him.'] },
  spec: { age: 'adult', swordBrows: true, mustache: '#1a1414', colors: { top: '#24262e', bottom: '#18191e', shoes: '#0e0e12' }, outfit: { top: 'robe', bottom: 'pants' }, robe: { inner: '#5a1a1a', trim: '#9aa0aa', belt: '#9aa0aa', tassel: '#5a1a1a', ink: 'rgba(160,170,180,0.14)' }, hair: { style: 'short', color: '#1a1414' } },
  moves: [], idle: (c) => ({ pose: { armR: -0.3, outR: 0.1, armL: 0.4, outL: -0.05, hipR: -0.1, hipL: 0.1, tilt: 0.02, head: Math.sin(c * 0.3) * 0.15 }, face: { browIn: 1, mouth: { smile: -0.3 }, blink: (c % 5.2) < 0.1 ? 1 : 0 } }),
};
TIEWUSI.build = base(TIEWUSI.spec, (F, mesh) => {
  const hat = plastic('#141418', { roughness: 0.4 }), H = F.headP;
  const cap = mesh(new THREE.CylinderGeometry(5.4, 5.9, 5.0, 28), hat, H); cap.position.y = 9.2;
  mesh(rbox(6, 4, 3, 1), hat, H).position.set(0, 10.4, -3.6);
  for (const s of [-1, 1]) { const w = mesh(rbox(7.5, 1.4, 0.5, 0.3), hat, H); w.position.set(s * 8.6, 10.6, -3.6); }
  const g = gripOf(F, 0, 'down'); mesh(rbox(1.6, 18, 1.6, 0.4), plastic('#5a5e66', { metalness: 0.7, roughness: 0.35 }), g).position.y = 6; // the iron ruler
});

export const SITU = {
  id: 'situ', name: { zh: '司徒鎮岳', en: 'Situ Zhenyue' }, title: { zh: '武林盟主', en: 'Chief of the Martial Alliance' },
  bio: { zh: '執掌武林盟二十年的盟主，人人敬重。', en: 'Chief of the Martial Alliance for twenty years, and honoured by all.' },
  poem: { zh: ['天機在手萬象收，', '江湖本是一盤謀；', '世人皆在棋中走，', '唯我執子笑白頭。'], en: ['With heaven’s stratagem in hand, all things are mine;', 'the rivers and lakes are one long game;', 'the world all walks upon my board,', 'and I alone move the pieces, smiling.'] },
  spec: { age: 'adult', beard: '#8a8a88', colors: { top: '#5a1a3a', bottom: '#2a1020', shoes: '#140a10' }, outfit: { top: 'robe', bottom: 'pants' }, robe: { inner: '#d8a838', trim: '#d8a838', belt: '#d8a838', tassel: '#8a1a3a', ink: 'rgba(216,168,56,0.22)' }, hair: { style: 'short', color: '#8a8a88' } },
  moves: [], idle: (c) => ({ pose: { armR: -0.5, outR: -0.15, armL: -0.5, outL: -0.15, hipR: -0.06, hipL: 0.06, tilt: 0.0, head: Math.sin(c * 0.35) * 0.2 }, face: { mouth: { smile: 0.55 }, eyes: 0.85, blink: (c % 4.4) < 0.1 ? 1 : 0 } }),
};
SITU.build = base(SITU.spec, (F, mesh) => {
  topknot(F.headP, mesh, plastic('#8a8a88', { roughness: 0.4 }), '#d8a838');
  const gem = mesh(new THREE.OctahedronGeometry(1.1), new THREE.MeshPhysicalMaterial({ color: '#2a8a6a', emissive: '#2a8a6a', emissiveIntensity: 0.4 }), F.headP); gem.position.set(0, 12.6, 1.8);
});

export const BAIXIAN = {
  id: 'baixian', name: { zh: '白先生', en: 'Master Bai' }, title: { zh: '聽雨樓說書人', en: 'Storyteller of the Listening-to-Rain' },
  bio: { zh: '十字路口聽雨樓的說書先生，江湖大小消息，沒有他不知道的。', en: 'The storyteller of the Listening-to-Rain at the crossroads: there is no news of the rivers and lakes he has not heard.' },
  poem: { zh: ['醒木一聲說古今，', '三分真話七分音；', '台前道盡他人事，', '莫問先生是何人。'], en: ['One clap of the block, and old and new are told;', 'three parts truth, seven parts the telling;', 'all other men’s affairs he tells upon the stage —', 'ask not who the teller is.'] },
  spec: { age: 'adult', mustache: '#2a2220', colors: { top: '#8a9aac', bottom: '#4a5260', shoes: '#1a1a1e' }, outfit: { top: 'robe', bottom: 'pants' }, robe: { inner: '#eef0f4', trim: '#4a5a6c', belt: '#4a5a6c', tassel: '#d8a838', ink: 'rgba(255,255,255,0.14)' }, hair: { style: 'short', color: '#2a2220' } },
  moves: [], idle: (c) => ({ pose: { armR: -1.1 + Math.sin(c * 2.2) * 0.12, outR: -0.25, wristR: Math.sin(c * 2.2) * 0.4, armL: -0.4, outL: 0.05, hipR: -0.05, hipL: 0.05, head: Math.sin(c * 0.5) * 0.3 }, face: { mouth: { smile: 0.6 }, eyes: 0.8, blink: (c % 4.1) < 0.1 ? 1 : 0 } }),
};
BAIXIAN.build = base(BAIXIAN.spec, (F, mesh) => {
  const H = F.headP, cap = plastic('#141418');
  mesh(rbox(11.2, 4.4, 11.2, 1.2), cap, H).position.y = 9.4; for (const s of [-1, 1]) { const r = mesh(rbox(1.2, 7, 0.3, 0.2), cap, H); r.position.set(s * 2.2, 6.2, -5.8); }
  const fan = new THREE.Group(); gripOf(F, 0).add(fan); fan.position.y = 3;
  const fg = new THREE.CylinderGeometry(9, 9, 0.4, 24, 1, false, -0.85, 1.7); fg.rotateZ(Math.PI / 2); const fm = mesh(fg, plastic('#f2ead6', { roughness: 0.6 }), fan); fm.rotation.y = Math.PI / 2;
  const block = mesh(rbox(4.2, 2.2, 2.6, 0.5), plastic('#5a3a24'), gripOf(F, 1)); block.position.y = 1.2; // the clapper, in his left hand
  return { fan, block };
});

const GUARD_SPEC = { age: 'adult', swordBrows: true, colors: { top: '#22242a', bottom: '#1a1a20', shoes: '#0e0e12' }, outfit: { top: 'robe', bottom: 'pants' }, robe: { inner: '#3a3a44', trim: '#a02a2a', belt: '#a02a2a', ink: 'rgba(0,0,0,0.15)' }, hair: { style: 'short', color: '#1a1414' } };
const guard = (id, zh) => {
  const G = { id, name: { zh, en: 'Law Hall guard' }, title: { zh: '執法堂弟子', en: 'Law Hall' }, bio: { zh: '', en: '' }, spec: { ...GUARD_SPEC, stubble: id === 'guard2' }, moves: ['punch'], idle: (c) => ({ pose: { armR: -0.45, outR: 0.12, armL: -0.2, outL: 0.1, hipR: -0.05, hipL: 0.05, head: Math.sin(c * 0.6 + id.length) * 0.2 }, face: { browIn: 0.8, mouth: { smile: -0.1 } } }) };
  G.build = base(G.spec, (F, mesh) => { const c = mesh(new THREE.SphereGeometry(6.1, 26, 12, 0, Math.PI * 2, 0, Math.PI * 0.5), plastic('#1a1a20'), F.headP); c.position.y = 6.6; mesh(new THREE.CylinderGeometry(6.4, 6.4, 0.8, 26), plastic('#a02a2a'), F.headP).position.y = 6.9; const g = gripOf(F, 0, 'up'); const tipO = new THREE.Object3D(); tipO.position.y = 44; g.add(tipO); F.tipObj = tipO; mesh(new THREE.CylinderGeometry(0.6, 0.6, 52, 8), plastic('#5a3a24'), g).position.y = 14; const tip = mesh(new THREE.ConeGeometry(1.2, 6, 8), plastic('#c8ccd4', { metalness: 0.8 }), g); tip.position.y = 43; });
  return G;
};
export const GUARD1 = guard('guard1', '執法堂弟子甲'), GUARD2 = guard('guard2', '執法堂弟子乙');

export const ABO = { id: 'abo', name: { zh: '阿伯', en: 'Old man' }, title: { zh: '茶客', en: 'Listener' }, bio: { zh: '', en: '' }, spec: { age: 'elder', colors: { top: '#6a5038', bottom: '#3a2e22', shoes: '#1a1410' }, outfit: { top: 'coat', bottom: 'pants' }, hair: { style: 'bald', color: '#c8c8c4' }, beard: '#c8c8c4' }, moves: [], idle: plain({ eyes: 0.8 }) };
ABO.build = base(ABO.spec);
export const DASHEN = { id: 'dashen', name: { zh: '大嬸', en: 'Auntie' }, title: { zh: '茶客', en: 'Listener' }, bio: { zh: '', en: '' }, spec: { age: 'adult', lashes: true, cheeks: true, longSkirt: true, colors: { top: '#c86a7a', bottom: '#5a3a5a', shoes: '#2a1a1a' }, outfit: { top: 'tee', bottom: 'skirt', apron: '#f2e6d0' }, hair: { style: 'bun', color: '#2a1a14' } }, moves: [], idle: plain() };
DASHEN.build = base(DASHEN.spec);
export const XIAOFAN = { id: 'xiaofan', name: { zh: '小販', en: 'Pedlar' }, title: { zh: '茶客', en: 'Listener' }, bio: { zh: '', en: '' }, spec: { age: 'adult', colors: { top: '#4a6a3a', bottom: '#3a3a2a', shoes: '#1a1a12' }, outfit: { top: 'coat', bottom: 'pants' }, hair: { style: 'short', color: '#1a1210' }, hat: { type: 'cap', color: '#8a6a3a' } }, moves: [], idle: plain({ mouth: { smile: 0.6 } }) };
XIAOFAN.build = base(XIAOFAN.spec);
