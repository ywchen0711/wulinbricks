// The people of the quiz show 《一字千金》 (the 龍門雙奕 special): the host and four of the six children who play
// (the other two are 奕叡 and 奕碩 themselves).
//   曾國城 the host: a dark navy suit, a gold tie and a pocket square, black hair neatly combed, a big ready grin; a
//          microphone in his right hand, his question cards in the left
//   陳小雷 Chen Xiaolei, who presses the buzzer before he has heard the question: spiky hair, a yellow hoodie
//   林書涵 Lin Shuhan, who reads the dictionary for fun: glasses, a ponytail, a sailor-collar school uniform
//   王大寶 Wang Dabao, whose head is full of food: a round face, an orange tee with a drumstick on it
//   張圓圓 Zhang Yuanyuan, who speaks so softly the host must kneel to hear her, and is never wrong: hair in a bun with
//          a clip, a pink dress
import * as THREE from '../../lib/three.module.min.js';
import { makeFig, plastic, rbox } from '../brick/minifig.js';

const mk = (g, m, p) => { const o = new THREE.Mesh(g, m); o.castShadow = true; o.receiveShadow = true; p.add(o); return o; };
const gripOf = (F, side = 0) => { const g = new THREE.Group(); g.rotation.x = Math.PI / 2 - 1.05; g.userData.fight = g.rotation.x; F.hands[side].add(g); return g; };
const build = (spec, dress) => (scene) => { const F = makeFig(spec), extra = dress?.(F) || {}; scene?.add(F.root); return { F, grips: [], tip: null, remove() { F.root.parent?.remove(F.root); }, sway() {}, setGlow() {}, ...extra }; };
// at rest: hands easy, a little bounce for the children who cannot keep still
const rest = (face = {}, fidget = 0) => (c) => ({ pose: { armR: -0.2 + Math.sin(c * 1.3) * 0.03, outR: 0.12, armL: -0.2, outL: 0.12, hipR: -0.06, hipL: 0.06, head: Math.sin(c * 0.5) * 0.25, y: Math.abs(Math.sin(c * 4)) * 0.015 * fidget + Math.sin(c * 1.7) * 0.004 }, face: { mouth: { smile: 0.45 }, ...face } });

export const HOST = {
  id: 'host', name: { zh: '曾國城', en: 'Tseng Kuo-cheng' }, title: { zh: '《一字千金》主持人', en: 'Host of “A Word Worth Gold”' },
  bio: { zh: '國字比賽節目的主持人。嘴快、心軟，最怕小朋友比他還會說話。', en: 'Host of the Chinese-character quiz show. Quick of tongue, soft of heart, and afraid only of children who talk better than he does.' },
  poem: { zh: ['一支麥克走天涯，', '笑談國字逗娃娃；', '千金難買童言妙，', '字字都是好人家。'], en: ['One microphone, all over the land,', 'joking with children over characters;', 'gold cannot buy what children say,', 'and every word comes from a good home.'] },
  spec: { age: 'adult', colors: { top: '#22283e', bottom: '#22283e', shoes: '#121212' }, outfit: { top: 'suit', bottom: 'pants', tie: '#d8a838', tieStripe: '#a8781e', shirt: '#f6f6f2', pocket: '#f0c858' }, hair: { style: 'short', color: '#141012' } },
  moves: [], idle: (c) => ({ pose: { armR: -0.85 + Math.sin(c * 1.1) * 0.04, outR: -0.1, wristR: 0.2, armL: -0.7, outL: -0.05, hipR: -0.06, hipL: 0.06, head: Math.sin(c * 0.5) * 0.25, y: Math.sin(c * 1.7) * 0.004 }, face: { mouth: { smile: 0.75 }, brow: 0.15 } }),
  build: build(HOST_SPEC(), (F) => {
    const g = gripOf(F, 0), dark = plastic('#1a1a1e', { roughness: 0.3 }); // the microphone
    mk(new THREE.CylinderGeometry(0.9, 0.7, 7, 14), dark, g).position.y = 2.4; const head = mk(new THREE.SphereGeometry(1.7, 18, 14), plastic('#8a8e96', { metalness: 0.6, roughness: 0.35 }), g); head.position.y = 6.6;
    mk(new THREE.CylinderGeometry(1.15, 1.15, 0.7, 14), plastic('#d8a838', { metalness: 0.6 }), g).position.y = 5.4;
    const cards = mk(rbox(5.2, 7.4, 0.5, 0.2), plastic('#f4ecd4'), F.hands[1]); cards.position.set(0, -1.2, 2.4); cards.rotation.x = -0.6; // the question cards
    return { mic: g, cards };
  }),
};
function HOST_SPEC() { return { age: 'adult', colors: { top: '#22283e', bottom: '#22283e', shoes: '#121212' }, outfit: { top: 'suit', bottom: 'pants', tie: '#d8a838', tieStripe: '#a8781e', shirt: '#f6f6f2', pocket: '#f0c858' }, hair: { style: 'short', color: '#141012' } }; }

export const XIAOLEI = {
  id: 'xiaolei', name: { zh: '陳小雷', en: 'Chen Xiaolei' }, title: { zh: '搶答小快手', en: 'Fastest finger on the buzzer' },
  bio: { zh: '按鈴永遠第一，想答案永遠最後。', en: 'Always first to the buzzer, always last to the answer.' },
  spec: { age: 'kid', cheeks: true, colors: { top: '#f2c21a', bottom: '#2a3a5a', shoes: '#e8402a' }, outfit: { top: 'hoodie', bottom: 'pants' }, hair: { style: 'spiky', color: '#2a1a10' } },
  moves: [], idle: rest({ mouth: { smile: 0.8 }, eyes: 1.1 }, 1.6), build: null,
};
XIAOLEI.build = build(XIAOLEI.spec);
export const SHUHAN = {
  id: 'shuhan', name: { zh: '林書涵', en: 'Lin Shuhan' }, title: { zh: '辭典小博士', en: 'The little doctor of the dictionary' },
  bio: { zh: '讀過兩百本書，最喜歡的是成語辭典。', en: 'Has read two hundred books; her favourite is the dictionary of idioms.' },
  spec: { age: 'kid', lashes: true, glasses: '#2a1a1a', colors: { top: '#f4f4f0', bottom: '#26335e', shoes: '#1a1a1a' }, outfit: { top: 'uniform', bottom: 'skirt', collar: '#26335e', scarf: '#c8282a' }, hair: { style: 'ponytail', color: '#1a1210', clip: '#3a7ad8' } },
  moves: [], idle: rest({ mouth: { smile: 0.3 }, brow: 0.2 }), build: null,
};
SHUHAN.build = build(SHUHAN.spec);
export const DABAO = {
  id: 'dabao', name: { zh: '王大寶', en: 'Wang Dabao' }, title: { zh: '美食小專家', en: 'The little food expert' },
  bio: { zh: '專長是吃很多，而且吃很快。緊張的時候會想吃東西。', en: 'Good at eating a lot, and fast. Gets hungry when nervous.' },
  spec: { age: 'kid', cheeks: true, colors: { top: '#f08a2a', bottom: '#5a3a24', shoes: '#f2eee4' }, outfit: { top: 'print', bottom: 'pants', pic: '🍗', size: 92 }, hair: { style: 'short', color: '#2a1a10' } },
  moves: [], idle: rest({ mouth: { smile: 0.7 }, happy: 0.3 }), build: null,
};
DABAO.build = build(DABAO.spec, (F) => { // a fatter middle, and a drumstick he keeps in his left hand
  const torso = F.body.children.find((m) => Array.isArray(m.material) && m.material[0]?.map); torso?.scale.set(1.16, 1, 1.25); // a rounder middle
  const leg = new THREE.Group(); F.hands[1].add(leg); leg.position.set(0, -0.5, 1.6); leg.rotation.x = -1.2;
  mk(new THREE.SphereGeometry(2.0, 14, 10), plastic('#b8642a', { roughness: 0.5 }), leg).scale.set(1, 1.4, 1); const bone = mk(new THREE.CylinderGeometry(0.5, 0.5, 3.6, 8), plastic('#f4eee0'), leg); bone.position.y = -3.2;
  return { drumstick: leg };
});
export const YUANYUAN = {
  id: 'yuanyuan', name: { zh: '張圓圓', en: 'Zhang Yuanyuan' }, title: { zh: '小聲小天才', en: 'The quiet little genius' },
  bio: { zh: '說話小聲到主持人要蹲下來聽，但是從來不答錯。', en: 'Speaks so softly the host has to kneel to hear her, and is never wrong.' },
  spec: { age: 'kid', cheeks: true, lashes: true, colors: { top: '#f2a0c0', bottom: '#f2a0c0', shoes: '#f4f4f4' }, outfit: { top: 'print', bottom: 'skirt', pic: '♥', size: 70, ink: '#e8507a' }, hair: { style: 'bun', color: '#2a1a12' } },
  moves: [], idle: rest({ mouth: { smile: 0.35 }, look: [0, -0.3], blush: 0.4 }), build: null,
};
YUANYUAN.build = build(YUANYUAN.spec, (F) => { const clip = mk(rbox(3.0, 1.6, 1.2, 0.4), plastic('#ffd84a'), F.headP); clip.position.set(3.6, 10.4, 2.6); clip.rotation.z = -0.5; });
