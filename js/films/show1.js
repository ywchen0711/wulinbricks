// 《龍門雙奕》番外篇　一字千金 — a special: the brothers on a children's quiz show of Chinese characters, hosted by 曾國城.
// Six children: 陳小雷 who presses the buzzer before he has heard the question, 林書涵 who reads the dictionary for
// fun, 奕叡 with his saber (and his "在下"), 奕碩 with his ball (which the host takes off him), 王大寶 whose head is
// full of food, and 張圓圓 who whispers and is never wrong. Round one, readings (龜裂, 莘莘學子, 一曝十寒); round two,
// the wrong character (再接再厲, 迫不及待, 一鼓作氣, 走投無路); round three, the missing one (畫蛇添足, 對牛彈琴,
// 狼吞虎嚥, 先發制人, 一箭雙鵰). The brothers go through level, and in the final, A Word Worth Gold, they write the same
// answers (龘, 龜) until the last question — one character for the person who matters most — and the elder writes
// 弟, the younger 哥. The host can't judge it: a draw. Then he gives the ball back.
//   Timed by the recordings: each scene is a run of lines, waits and cues (sc.L / sc.W / sc.C), its moments counted
//   from the lengths in show1.durs.js (written by tools/voices.py), so nothing needs retiming when a line is re-recorded.
import { DURS } from './show1.durs.js';
import { STUDIO } from '../studio.js';

const PI = Math.PI;
const ORDER = ['lei', 'han', 'rui', 'shuo', 'bao', 'yuan'], NAMES = ['陳小雷', '林書涵', '奕　叡', '奕　碩', '王大寶', '張圓圓'], POD = Object.fromEntries(ORDER.map((n, i) => [n, i]));
const pod = (n) => STUDIO.podium(POD[n]);
const HX = STUDIO.host[0], HZ = STUDIO.host[1], HYAW = Math.atan2(0 - HX, -1.6 - HZ);
const est = (s) => Math.max(1.0, [...s].length * 0.21);
// ---------------------------------------------------------------- the shots used again and again
const MASTER = { kind: 'at', pos: [0, 3.0, 9.2], look: [0, 1.1, -2.2], fov: 46 };
const KIDS = { kind: 'at', pos: [0, 1.45, 4.2], look: [0, 0.95, -2.0], fov: 54 };
const HOSTW = { kind: 'at', pos: [-1.6, 1.45, 3.6], look: [-5.0, 1.15, 0.6], fov: 34 };
const AUD = { kind: 'at', pos: [0.6, 1.5, 2.6], look: [0, 1.2, 8], fov: 50 };
const SCREEN = { kind: 'at', pos: [0, 2.3, 1.6], look: [0, 2.55, -5.4], fov: 44 };
const SIDE = { kind: 'at', pos: [-7.6, 1.6, 3.6], look: [0, 1.0, -1.6], fov: 40 };
const BROS = { kind: 'two', on: ['rui', 'shuo'], side: -1, dist: 3.0 };
const close = (on, o = {}) => ({ kind: 'close', on, side: o.side ?? (on === 'host' ? -1 : 1), dist: o.dist ?? (on === 'host' ? 1.9 : 1.55), ...o });

// ---------------------------------------------------------------- a scene, written as it runs
let LI = 0; const SCENES = [];
function scene(o, write) {
  const lines = [], cues = [], shots = [], say = []; let t = o.lead ?? 0.8, last = t, lastWho = null, side = 1;
  const sc = {
    // a line: who, the words, the English, the feeling; x.gap before it, x.say what the voice reads (when it must read it
    // otherwise), x.shot to cut to as it begins (else a close on whoever speaks, when the speaker changes), x.keep to stay
    L(who, zh, en, feel = '', x = {}) {
      t += x.gap ?? 0.3; lines.push([t, who, zh, en, feel]); say.push(x.say || null);
      if (x.shot) shots.push([t - 0.12, x.shot]); else if (!x.keep && who !== lastWho) { side = -side; shots.push([t - 0.12, close(who, { side: who === 'host' ? -1 : side })]); }
      if (x.cue) cues.push([t + (x.at ?? 0), x.cue]);
      lastWho = who; last = t; t += DURS[LI] ?? est(x.say || zh); LI++; return sc;
    },
    W(s) { t += s; return sc; }, // a pause
    C(fn, off = 0) { cues.push([t + off, fn]); return sc; }, // something done now (after the last line and any pause)
    A(fn, off = 0) { cues.push([last + off, fn]); return sc; }, // something done during the last line, off seconds into it
    S(shot, off = 0) { shots.push([t + off, shot]); lastWho = null; return sc; }, // a cut, now
    get t() { return t; },
  };
  write(sc);
  SCENES.push({ ...o, len: t + (o.tail ?? 1.2), lines, cues, shots: shots.sort((a, b) => a[0] - b[0]), say });
}
// ---------------------------------------------------------------- what happens on the floor, often
const set = (F) => F.set();
const buzz = (n) => (A, F) => { A[n].gest('buzz'); set(F).buzz(POD[n]); F.sfx('buzzer'); };
const right = (n, score) => (A, F) => { F.sfx('ding'); set(F).score(POD[n], score, 'good'); set(F).crowd('clap', 2.4); F.sfx('sample', pick(F, 'applause'), 0.55); A[n].gest(n === 'rui' ? 'fist' : 'cheer'); };
const wrong = (n) => (A, F) => { F.sfx('wrong'); set(F).flash(POD[n], 'bad'); };
// the audience's sounds are real recordings in a few takes each (tools/crowd_real.py); which take, by the moment, so
// that no two laughs in a row are the same one and a seek hears what playing would
const TAKES = { laugh_s: 4, laugh_m: 6, laugh_b: 4, aww: 2, ooh: 4, cheer: 2, applause: 4 };
const pick = (F, base) => base + (1 + Math.floor(F.now() * 7.31) % TAKES[base]);
const laugh = (k = 1, who = []) => (A, F) => { F.sfx('sample', pick(F, k > 1.5 ? 'laugh_b' : k < 0.8 ? 'laugh_s' : 'laugh_m'), 0.75 + 0.15 * k); set(F).crowd('laugh', 1.8 + k); for (const n of who) A[n]?.gest(n === 'host' ? 'laughbig' : 'laugh'); };
const clap = (len = 3) => (A, F) => { F.sfx('sample', len > 4 ? 'applause_long' : pick(F, 'applause'), 0.7); set(F).crowd('clap', len); };
const screen = (mode, d) => (A, F) => { set(F).screen(mode, d); F.sfx('swoosh'); };
const SCORES = (list) => (A, F) => { set(F).names(NAMES); set(F).scores(list); };
// everyone in their places: the host at his mark, the children behind their podiums
const placeAll = (o = {}) => { const p = { host: { x: o.host?.[0] ?? HX, z: o.host?.[1] ?? HZ, yaw: o.hostYaw ?? HYAW } }; ORDER.forEach((n) => { const L = STUDIO.podium(POD[n]); p[n] = { x: L.stand[0], z: L.stand[1], yaw: L.yaw }; }); return p; };
const still = (A) => { A.shuo.still = true; };
// a thing thrown or kicked: from where it is to where it goes, in an arc, over dur seconds; then it stays (or bounces)
const fly = (F, name, from, to, dur, h = 1, after) => { const t0 = F.now(); F.prop(name).held = null; F.every((t) => { const k = Math.min(1, (t - t0) / dur), G = F.prop(name).G; G.position.set(from.x + (to.x - from.x) * k, from.y + (to.y - from.y) * k + Math.sin(k * PI) * h, from.z + (to.z - from.z) * k); G.rotation.x += 0.3; if (k >= 1) { after?.(); return false; } }); };
const P3 = (F, x, y, z) => { const p = F.P(x, z); p.y = y; return p; };

// ================================================================ 1 開場 the lights come up; the host comes on
scene({ set: 'studio', tod: 'night', focus: [0, 0], caption: { zh: '《龍門雙奕》番外篇', en: 'The Longmen Brothers — a special' }, lead: 0.5,
  place: { ...placeAll({ host: [-9.0, 1.2], hostYaw: PI / 2 }) },
  setup: (A, F) => { set(F).names(NAMES); set(F).lights('dim'); set(F).screen('off'); still(A); },
}, (sc) => {
  sc.S({ kind: 'at', pos: [0, 4.6, 9.4], look: [0, 2.2, -4.5], fov: 50, drift: [0, -0.1, -0.22] })
    .C((A, F) => F.sfx('drumroll', 2.6)).W(2.6)
    .C((A, F) => { set(F).lights('party'); set(F).screen('logo', {}); F.sfx('jingle'); F.sfx('sample', pick(F, 'cheer'), 0.8); set(F).crowd('cheer', 4); }).W(0.6)
    .C((A, F) => F.title(6)).W(5.6)
    .C((A, F) => { set(F).lights('show'); F.walk('host', HX, HZ, { speed: 1.5 }); A.host.gest('wave'); F.sfx('sample', 'applause_long', 0.7); set(F).crowd('clap', 5); })
    .S({ kind: 'at', pos: [-3.2, 1.5, 4.2], look: [-7.5, 1.2, 1.0], fov: 36, follow: 'host' }).W(3.2)
    .C((A, F) => { F.face('host', [0, 7]); F.intro('host', { dur: 6 }); }).S(close('host', { dist: 2.4, side: -1 })).W(6.2)
    .L('host', '各位觀眾朋友，大家好！歡迎收看《一字千金》，我是主持人曾國城！', 'Good evening, everyone! Welcome to “A Word Worth Gold” — I’m your host, Tseng Kuo-cheng!', 'excited', { say: '各位觀眾朋友，大家好！歡迎收看一字千金，我是主持人，增國城！', shot: MASTER, cue: clap(3), at: 3.2 })
    .L('host', '今天是兒童特別節目！六位小朋友要來挑戰國字、成語……還有我的耐心。', 'Tonight is our children’s special! Six kids are here to take on characters, idioms… and my patience.', 'happy', { shot: HOSTW })
    .C(laugh(1)).W(1.1)
    .L('host', '我們先來認識一下今天的小朋友！', 'Let’s meet tonight’s contestants!', 'excited', { shot: KIDS, cue: (A) => A.host.gest('present') })
    .C(clap(3)).W(1.6);
});

// ================================================================ 2 自我介紹 six children, one at a time
scene({ set: 'studio', tod: 'night', focus: [0, 0], place: placeAll(), setup: (A, F) => { set(F).names(NAMES); set(F).screen('logo', { sub: '參賽者介紹' }); } }, (sc) => {
  const visit = (n, dz = 1.05) => (A, F) => { const L = pod(n); F.walk('host', L.x + 0.15, L.z + dz, { speed: 1.6 }); };
  const mic = (n) => (A, F) => { F.face('host', n); A.host.gest('mic', { hold: true }); };
  // 陳小雷
  sc.S(MASTER).C(visit('lei')).W(2.4).C(mic('lei'))
    .L('host', '第一位小朋友，你好，請自我介紹！', 'Our first contestant — hello! Tell us about yourself!', 'happy', { shot: { kind: 'two', on: ['host', 'lei'], side: -1, dist: 2.2 } })
    .L('lei', '我叫陳小雷！我最快！我今天一定第一個按鈴！', 'I’m Chen Xiaolei! I’m the fastest! I’m gonna buzz first every time!', 'excited')
    .C(buzz('lei')).W(0.4)
    .L('host', '我還沒出題，你就按了。這樣很浪費電耶。', 'I haven’t asked anything yet and you’ve already buzzed. That’s a waste of electricity.', 'surprised', { shot: { kind: 'two', on: ['host', 'lei'], side: -1, dist: 2.2 } })
    .C(laugh(1, ['han'])).W(1.0)
    .L('lei', '沒關係！我先按，再想！', 'That’s okay! I buzz first, then I think!', 'proud')
    .L('host', '很好，很有個性……很有個性。下一位！', 'Very good. Very… individual. Next!', 'thinking', { cue: (A) => A.host.gest('facepalm') })
    .C(laugh(0.7)).C(visit('han')).W(1.6).C(mic('han'))
  // 林書涵
    .L('han', '大家好，我是林書涵，十歲。我讀過兩百本書，最喜歡成語辭典。', 'Hello, I’m Lin Shuhan, ten. I’ve read two hundred books; my favourite is the dictionary of idioms.', 'proud')
    .L('host', '成語辭典……你當故事書在看？', 'The dictionary of idioms… you read it like a storybook?', 'surprised')
    .L('han', '對啊。還有主持人，嚴格來說，其中一位已經十五歲，不算小朋友。', 'Yes. And, host — strictly speaking, one of us is fifteen. That’s not a kid.', 'calm', { cue: (A) => A.han.gest('point'), at: 3.5 })
    .C(laugh(1)).W(0.6)
    .L('host', '我主持二十幾年，第一次被小朋友糾正。', 'Twenty-odd years I’ve been hosting, and this is the first time a kid has corrected me in the introductions.', 'sad', { shot: close('host', { dist: 1.6 }) })
    .C(laugh(1.6, ['shuo', 'bao'])).W(1.3).C(visit('rui', 1.15)).W(1.0).C(mic('rui'))
  // 奕叡
    .L('host', '那我們來看看是哪一位……你是小朋友嗎？你比我還高耶。', 'So which one is it… are you a kid? You’re taller than me!', 'surprised', { shot: { kind: 'two', on: ['host', 'rui'], side: -1, dist: 2.4 } })
    .C(laugh(0.7)).W(0.5)
    .L('rui', '在下奕叡，龍門刀莊人士，今年十五……虛歲十六。', 'I am Yi Rui, of the Longmen Saber Manor. Fifteen this year… sixteen, by the old count.', 'calm', { cue: (A) => A.rui.gest('bow') })
    .L('host', '「在下」？你是從古裝劇的片場，直接走過來的嗎？', '“I am”? Did you walk straight here off the set of a costume drama?', 'surprised')
    .C(laugh(1.3, ['shuo'])).W(1.0)
    .L('host', '還有你背後那把刀……我們是比寫字，不是比砍字喔。', 'And that saber on your back… on this show we write words, we don’t chop them.', 'happy', { cue: (A) => A.host.gest('point'), at: 1.0 })
    .C(laugh(1.6)).W(1.2)
    .L('rui', '主持人放心。刀不出鞘，只出字。', 'Have no fear, sir. The blade stays sheathed. Only words come out.', 'proud')
    .C((A, F) => { F.sfx('sample', pick(F, 'ooh'), 0.8); set(F).crowd('ooh', 2); }).W(0.8)
    .L('host', '好帥！這句我要拿去用。', 'So cool! I’m stealing that line.', 'excited', { cue: (A) => A.host.gest('cheer') })
    .C(laugh(0.7)).C((A) => { A.shuo.still = false; }).C(visit('shuo')).W(1.2).C(mic('shuo'))
  // 奕碩
    .L('host', '旁邊這位小朋友，你為什麼帶了一顆足球來？', 'And you, next to him — why have you brought a football?', 'surprised')
    .L('shuo', '我是奕碩，他是我哥！這是我的球，我去哪裡，它就去哪裡！', 'I’m Yi Shuo, he’s my brother! This is my ball — wherever I go, it goes!', 'excited')
    .L('host', '那比賽的時候，它要去哪裡？', 'So during the game, where does it go?', 'thinking')
    .L('shuo', '它可以幫我按鈴！你看——', 'It can buzz for me! Watch —', 'excited')
    .C((A, F) => { // the kick: up off his foot, over the podium, into the host's hands
      const b = A.shuo.hero.ball, from = b.getWorldPosition(F.P(0, 0)); b.visible = false; A.shuo.gest('jump'); F.sfx('kick'); F.put('ball', 'ball', from); const h = A.host.pos;
      const to = h.clone(); to.x += 0.1; to.y = 1.05; to.z += 0.25; fly(F, 'ball', from, to, 0.9, 1.6, () => { F.sfx('thud', 0.5); A.host.gest('catch', { hold: true }); F.give('ball', 'host', 'R', [0, 0.02, 0.12]); });
    })
    .S({ kind: 'at', pos: [pod('shuo').x + 2.4, 1.3, pod('shuo').z + 3.2], look: [pod('shuo').x - 0.2, 1.4, pod('shuo').z + 0.8], fov: 46 }).W(1.4)
    .C((A, F) => { F.sfx('sample', pick(F, 'ooh'), 0.9); set(F).crowd('ooh', 2); }).W(0.6)
    .L('host', '……好，這顆球，我先幫你保管。我們這是「一字千金」，不是「一腳千金」。', '…Right. I’ll look after this ball for you. This show is “A Word Worth Gold”, not “A Kick Worth Gold”.', 'calm', { shot: { kind: 'two', on: ['host', 'shuo'], side: -1, dist: 2.2 } })
    .C(laugh(2, ['rui', 'bao', 'lei'])).W(1.6)
    .L('shuo', '啊——我的球！', 'Noooo — my ball!', 'sad', { cue: (A) => A.shuo.gest('scared') })
    .C((A, F) => { F.walk('host', -6.0, 0.25, { speed: 1.8 }); A.host.gest('catch', { hold: true }); }).W(1.6)
    .C((A, F) => { A.host.gesture = null; F.put('ball', 'ball', P3(F, -6.4, 0.66, -0.35)); F.sfx('bounce'); A.shuo.still = true; })
    .C(visit('bao')).W(1.8).C(mic('bao')).C((A) => A.bao.gest('eat'))
  // 王大寶
    .L('host', '這位小朋友……你在吃什麼？', 'And you… what are you eating?', 'surprised', { shot: { kind: 'two', on: ['host', 'bao'], side: -1, dist: 2.2 } })
    .L('bao', '雞腿。我緊張的時候，就會想吃東西。', 'A drumstick. When I’m nervous I want to eat.', 'shy')
    .L('host', '那你什麼時候不緊張？', 'And when aren’t you nervous?', 'thinking')
    .L('bao', '吃飽的時候。', 'When I’m full.', 'calm', { cue: (A) => A.bao.gest('eat'), at: 0.8 })
    .C(laugh(1.5, ['lei', 'yuan'])).W(1.2)
    .L('host', '我懂，我也是。', 'I get it. Me too.', 'calm', { shot: close('host', { dist: 1.6 }) })
    .C(laugh(1.4)).W(1.0)
    .L('bao', '我叫王大寶！我的專長是吃很多，而且吃很快！', 'I’m Wang Dabao! I’m good at eating a lot, and eating fast!', 'happy')
    .C(clap(2)).C(visit('yuan')).W(1.6).C(mic('yuan'))
  // 張圓圓
    .L('host', '最後一位，妹妹你好，你叫什麼名字？', 'And last — hello, little one, what’s your name?', 'happy', { shot: { kind: 'two', on: ['host', 'yuan'], side: -1, dist: 2.0 } })
    .L('yuan', '……張圓圓。', '…Zhang Yuanyuan.', 'shy')
    .L('host', '什麼？大聲一點，後面的阿姨會聽不到喔。', 'What’s that? A bit louder — the aunties at the back can’t hear you.', 'surprised', { cue: (A) => A.host.gest('kneelmic', { hold: true }) })
    .L('yuan', '……張、圓、圓。', '…Zhang. Yuan. Yuan.', 'shy', { gap: 0.6 })
    .C((A) => { A.host.gesture = null; }).W(0.4)
    .L('host', '好。我跟各位說，通常越小聲的，越可怕。', 'Okay. Let me tell you all something: it’s usually the quietest ones who are the scariest.', 'thinking', { shot: close('host', { dist: 1.8 }) })
    .C(laugh(1.4)).W(1.1)
    .C((A, F) => F.walk('host', HX, HZ, { speed: 1.8 })).S(MASTER).W(2.4).C((A, F) => F.face('host', [0, 7]))
    .L('host', '好！六位小朋友都到齊了，比賽正式開始！', 'Right! All six are here. Let the game begin!', 'excited', { shot: HOSTW, cue: (A, F) => { F.sfx('jingle'); set(F).lights('party'); } })
    .C(clap(4)).W(2.0).C((A, F) => set(F).lights('show'));
});

// ================================================================ 3 第一關 字音大考驗: readings
scene({ set: 'studio', tod: 'night', focus: [0, 0], place: placeAll(), setup: (A, F) => { SCORES([0, 0, 0, 0, 0, 0])(A, F); still(A); F.put('ball', 'ball', P3(F, -6.4, 0.66, -0.35)); A.shuo.hero.ball.visible = false; } }, (sc) => {
  const R = '第一關　字音大考驗', PTS = '每題 100 分';
  sc.S(SCREEN).C(screen('round', { n: '第一關', name: '字音大考驗', sub: '說出正確的讀音，答對得 100 分' })).W(0.6)
    .L('host', '第一關，字音大考驗！搶答正確的讀音，答對一百分！', 'Round one: the reading test! Buzz in with the right reading — a hundred points!', 'excited', { keep: true })
    .S(HOSTW).L('host', '第一題——', 'Question one —', 'calm', { keep: true })
    .C(screen('q', { round: R, pts: PTS, word: '龜裂' })).C(buzz('lei'), 0.15).S(close('lei')).W(0.9)
    .L('host', '小雷，我「第一題」三個字才剛說完而已。', 'Xiaolei, I’ve only just said “question one”.', 'surprised')
    .C(laugh(1)).W(0.6)
    .L('lei', '烏龜裂開！', 'A tortoise cracking open!', 'excited', { cue: wrong('lei'), at: 1.2 })
    .C(laugh(2, ['bao', 'shuo'])).W(1.4)
    .L('host', '烏龜裂開……很有畫面，但是錯了。', 'A tortoise cracking open… very vivid. But wrong.', 'thinking', { shot: close('host', { dist: 1.6 }) })
    .C(laugh(1)).W(0.5).C(buzz('han')).S(close('han')).W(0.6)
    .L('han', '念「ㄐㄩㄣ ㄌㄧㄝˋ」。龜裂，就是乾得裂開，像田裡的土一樣。', 'It’s read “jun-lie”. It means cracked from drought, like the soil in a field.', 'calm', { say: '念君裂。君裂，就是乾得裂開，像田裡的土一樣。', keep: true })
    .C(right('han', 100)).C(screen('q', { round: R, pts: PTS, word: '龜裂', answer: 'ㄐㄩㄣ　ㄌㄧㄝˋ' }), 0.2).W(1.4)
    .L('host', '答對了！一百分！書涵果然是看辭典長大的。', 'Correct! One hundred points! Shuhan really did grow up on the dictionary.', 'happy')
    .L('host', '第二題——', 'Question two —', 'calm', { keep: true, shot: SCREEN, cue: screen('q', { round: R, pts: PTS, word: '莘莘學子' }), at: 0.6 })
    .W(0.8).C((A) => { A.bao.gest('eat'); }).W(0.8).C(buzz('bao')).S(close('bao')).W(0.5)
    .L('bao', '辛辛……辛拉麵學子？', 'Shin… Shin Ramyun students?', 'thinking', { cue: wrong('bao'), at: 2.0 })
    .C(laugh(2, ['lei', 'shuo', 'host'])).W(1.6)
    .L('host', '大寶，你的腦袋裡，是不是只有菜單？', 'Dabao, is there anything in your head but a menu?', 'surprised')
    .L('bao', '還有甜點。', 'There’s dessert, too.', 'shy')
    .C(laugh(1.8)).W(1.4).C(buzz('rui')).S(close('rui')).W(0.5)
    .L('rui', '念「ㄕㄣ ㄕㄣ學子」，形容學生眾多。', 'It’s read “shen-shen xuezi”: a great many students.', 'calm', { say: '念身身學子，形容學生眾多。', keep: true })
    .C(right('rui', 100)).C(screen('q', { round: R, pts: PTS, word: '莘莘學子', answer: 'ㄕㄣ　ㄕㄣ　ㄒㄩㄝˊ　ㄗˇ' }), 0.2).W(1.3)
    .L('host', '正確！奕叡很穩喔，跟他的刀一樣穩。', 'Correct! Yi Rui is steady — as steady as his saber.', 'happy')
    .L('shuo', '哥好厲害！', 'You’re amazing, brother!', 'excited', { cue: (A) => A.shuo.gest('cheer') })
    .L('host', '第三題——', 'Question three —', 'calm', { shot: SCREEN, cue: screen('q', { round: R, pts: PTS, word: '一曝十寒' }), at: 0.6 })
    .W(0.4).C(buzz('shuo')).S(close('shuo')).W(0.5)
    .L('shuo', '一爆十寒！像我的球一樣，一踢就爆！', 'Yi BAO shi han! Like my ball — one kick and BOOM!', 'excited', { cue: wrong('shuo'), at: 2.6 })
    .C(laugh(1.8, ['bao', 'lei'])).W(1.3)
    .L('host', '你的球爆了，我們節目也要爆了。', 'If your ball goes boom, so does our show.', 'thinking', { shot: close('host', { dist: 1.6 }) })
    .C(laugh(1.2)).W(1.0).C(buzz('yuan')).S(close('yuan')).W(0.6)
    .L('host', '圓圓有按嗎？我看到燈亮了……圓圓，請回答。', 'Did Yuanyuan buzz? I saw her light… Yuanyuan, your answer.', 'surprised', { shot: { kind: 'two', on: ['host', 'yuan'], side: -1, dist: 2.6 } })
    .L('yuan', '……ㄆㄨˋ。一曝十寒。', '…“Pu”. Yi pu shi han.', 'shy', { say: '……鋪。一鋪十寒。' })
    .C((A, F) => F.walk('host', pod('yuan').x + 0.2, pod('yuan').z + 1.0, { speed: 2.2 })).W(1.3).C((A, F) => { F.face('host', 'yuan'); A.host.gest('kneelmic', { hold: true }); })
    .L('host', '什麼？再說一次？', 'Sorry? Once more?', 'surprised', { shot: { kind: 'two', on: ['host', 'yuan'], side: -1, dist: 1.8 } })
    .L('yuan', '……ㄆㄨˋ。曬太陽的意思。', '…“Pu”. It means to sun something.', 'shy', { say: '……鋪。曬太陽的意思。', gap: 0.5 })
    .C(right('yuan', 100)).C(screen('q', { round: R, pts: PTS, word: '一曝十寒', answer: 'ㄧ　ㄆㄨˋ　ㄕˊ　ㄏㄢˊ' }), 0.2).C((A) => { A.host.gesture = null; }, 0.6).W(1.2)
    .L('host', '答對了！我就說吧，越小聲的，越可怕！', 'Correct! What did I tell you — the quietest are the scariest!', 'excited', { shot: MASTER })
    .C(laugh(1.4)).C((A, F) => F.walk('host', HX, HZ, { speed: 1.8 })).W(2.4).C((A, F) => F.face('host', [0, -1.6]))
    .L('host', '第一關結束！書涵、奕叡、圓圓各一百分，其他三位零分……但是笑點滿分！', 'End of round one! Shuhan, Yi Rui and Yuanyuan, a hundred each. The other three: zero… but full marks for laughs!', 'happy', { shot: KIDS })
    .C(laugh(1.6, ['lei', 'bao', 'shuo'])).W(1.4);
});

// ================================================================ 4 第二關 錯字大搜查: the wrong character
scene({ set: 'studio', tod: 'night', focus: [0, 0], place: placeAll(), setup: (A, F) => { SCORES([0, 100, 100, 0, 0, 100])(A, F); still(A); F.put('ball', 'ball', P3(F, -6.4, 0.66, -0.35)); A.shuo.hero.ball.visible = false; } }, (sc) => {
  const R = '第二關　錯字大搜查', PTS = '每題 100 分';
  sc.S(SCREEN).C(screen('round', { n: '第二關', name: '錯字大搜查', sub: '找出寫錯的字，說出正確的字' })).W(0.6)
    .L('host', '第二關，錯字大搜查！成語裡有一個錯字，請把它找出來！', 'Round two: hunt the mistake! One character in the idiom is wrong — find it!', 'excited', { keep: true })
    .L('host', '第一題，再接再勵。', 'Question one: zai jie zai li.', 'calm', { shot: SCREEN, cue: screen('q', { round: R, pts: PTS, word: '再接再勵' }), at: 0.4 })
    .C(buzz('lei'), 0.05).S(close('lei')).W(0.5)
    .L('lei', '再接再……再接一次！', 'Again and… again once more!', 'excited', { cue: wrong('lei'), at: 1.6 })
    .C(laugh(1)).W(0.6)
    .L('host', '你是在接電話嗎？', 'Are you answering the phone?', 'surprised', { shot: close('host', { dist: 1.6 }) })
    .C(laugh(1.6)).W(1.1).C(buzz('shuo')).S(close('shuo')).W(0.5)
    .L('shuo', '「勵」錯了！要寫「厲害」的「厲」！我爹每次都說：碩兒，要再接再厲！', 'The “li” is wrong! It’s the “li” of “li-hai”, mighty! My father always says, “Shuo, keep at it — zai jie zai li!”', 'excited', { keep: true })
    .C(right('shuo', 100)).C(screen('q', { round: R, pts: PTS, word: '再接再勵', mark: 3, fix: '厲' }), 0.2).W(1.2)
    .L('host', '答對了！看來你爹常常要你再接再厲喔？', 'Correct! Sounds like your father tells you that a lot?', 'happy')
    .L('shuo', '因為我常常踢破燈籠。', 'Because I keep kicking lanterns to pieces.', 'shy')
    .C(laugh(1.8, ['rui'])).W(1.4)
    .L('host', '第二題，迫不急待。', 'Question two: po bu ji dai.', 'calm', { shot: SCREEN, cue: screen('q', { round: R, pts: PTS, word: '迫不急待' }), at: 0.4 })
    .C(buzz('lei'), 0.05).S(close('lei')).W(0.5)
    .L('host', '小雷，又是你！這次你想好了嗎？', 'Xiaolei, you again! Have you thought this time?', 'surprised', { shot: { kind: 'two', on: ['host', 'lei'], side: -1, dist: 3.0 } })
    .L('lei', '想好了！「急」錯了，要寫「及格」的「及」！迫不及待！', 'I have! The “ji” is wrong — it’s the “ji” of “ji-ge”, passing! Po bu ji dai!', 'excited', { gap: 0.4 })
    .C(right('lei', 100)).C(screen('q', { round: R, pts: PTS, word: '迫不急待', mark: 2, fix: '及' }), 0.2).C((A) => A.lei.gest('jump'), 0.3).W(1.0)
    .L('lei', '耶——我終於有分數了！', 'Yesss — I finally have points!', 'excited', { cue: (A) => A.lei.gest('jump') })
    .L('host', '恭喜！先按再想，終於想對了一次！', 'Congratulations! Buzz first, think later — and this time the thinking worked!', 'happy', { shot: HOSTW })
    .C(laugh(1)).C(clap(3), 0.3).W(1.6)
    .L('host', '第三題，一股作氣。', 'Question three: yi gu zuo qi.', 'calm', { shot: SCREEN, cue: screen('q', { round: R, pts: PTS, word: '一股作氣' }), at: 0.4 })
    .W(0.5).C(buzz('rui')).S(close('rui')).W(0.5)
    .L('rui', '「股」應為「鼓」，擊鼓的鼓。《左傳》有云：一鼓作氣，再而衰，三而竭。', 'The “gu” should be a drum. As the Zuo Zhuan says: at the first drum courage rises, at the second it flags, at the third it is spent.', 'calm', { keep: true })
    .C(right('rui', 200)).C(screen('q', { round: R, pts: PTS, word: '一股作氣', mark: 1, fix: '鼓' }), 0.2).W(1.3)
    .L('host', '哇，連出處都說出來了！你家是開補習班的嗎？', 'Wow, he even gave the source! Does your family run a cram school?', 'surprised')
    .L('rui', '是開刀莊的。', 'A saber manor.', 'calm', { gap: 0.6 })
    .C(laugh(2, ['shuo', 'han'])).W(1.6)
    .L('host', '最後一題，走頭無路。', 'Last one: zou tou wu lu.', 'calm', { shot: SCREEN, cue: screen('q', { round: R, pts: PTS, word: '走頭無路' }), at: 0.4 })
    .W(0.5).C(buzz('bao')).S(close('bao')).W(0.5)
    .L('bao', '走頭……是不是走去吃豬頭？', 'Zou tou… does it mean go and eat a pig’s head?', 'thinking', { cue: wrong('bao'), at: 2.6 })
    .C(laugh(2, ['lei', 'host'])).W(1.6)
    .L('host', '大寶，我建議你比賽完，先去吃飯。', 'Dabao, I recommend you go and eat as soon as we’re done.', 'calm', { shot: close('host', { dist: 1.6 }) })
    .C(laugh(1)).W(0.5).C(buzz('shuo')).S(close('shuo')).W(0.5)
    .L('shuo', '「頭」錯了！是「投」，投球的投！走投無路！', 'The “tou” is wrong! It’s the “tou” of throwing a ball! Zou tou wu lu!', 'excited', { keep: true })
    .C(right('shuo', 200)).C(screen('q', { round: R, pts: PTS, word: '走頭無路', mark: 1, fix: '投' }), 0.2).W(1.2)
    .L('host', '只要跟球有關係的，你都會耶！', 'Anything to do with a ball, you know it!', 'surprised')
    .L('shuo', '球是我的老師！', 'The ball is my teacher!', 'proud')
    .C(laugh(1.2)).W(1.0)
    .L('host', '第二關結束！奕叡、奕碩兩百分領先，大寶……還在暖身。', 'End of round two! Yi Rui and Yi Shuo lead with two hundred. Dabao… is still warming up.', 'happy', { shot: KIDS })
    .C(laugh(1)).W(0.6)
    .L('bao', '我是大器晚成！', 'I’m a late bloomer!', 'proud', { cue: (A) => A.bao.gest('cheer') })
    .C((A, F) => { F.sfx('sample', pick(F, 'ooh'), 0.8); set(F).crowd('ooh', 1.5); }).W(0.8)
    .L('host', '欸！這個成語你用得很好耶！可惜這一關已經結束了。', 'Hey! You used that idiom perfectly! Shame the round’s over.', 'surprised', { shot: close('host', { dist: 1.7 }) })
    .C(laugh(1.8, ['bao'])).W(1.4);
});

// ================================================================ 5 第三關 成語填空: the missing character
scene({ set: 'studio', tod: 'night', focus: [0, 0], place: placeAll(), setup: (A, F) => { SCORES([100, 100, 200, 200, 0, 100])(A, F); still(A); F.put('ball', 'ball', P3(F, -6.4, 0.66, -0.35)); A.shuo.hero.ball.visible = false; } }, (sc) => {
  const R = '第三關　成語填空', PTS = '每題 200 分';
  sc.S(SCREEN).C(screen('round', { n: '第三關', name: '成語填空', sub: '補上缺少的字，每題 200 分' })).W(0.6)
    .L('host', '第三關，成語填空！每題兩百分，可能大翻盤喔！', 'Round three: fill the gap! Two hundred a question — anything could happen!', 'excited', { keep: true })
    .L('host', '第一題：畫蛇添——什麼？', 'Question one: draw a snake and add — what?', 'calm', { shot: SCREEN, cue: screen('q', { round: R, pts: PTS, word: '畫蛇添＿' }), at: 0.3 })
    .C(buzz('shuo'), 0.0).S(close('shuo')).W(0.4)
    .L('shuo', '足！足球的足！', 'Feet! The “zu” of football!', 'excited', { keep: true })
    .C(right('shuo', 400)).C(screen('q', { round: R, pts: PTS, word: '畫蛇添＿', mark: 3, fix: '足' }), 0.2).W(1.1)
    .L('host', '我就知道！這題根本是幫你出的嘛。', 'I knew it! That question was practically written for you.', 'happy', { shot: close('host', { dist: 1.6 }) })
    .C(laugh(1)).W(0.6)
    .L('host', '第二題：對牛彈——什麼？', 'Question two: to play — what — to a cow?', 'calm', { shot: SCREEN, cue: screen('q', { round: R, pts: PTS, word: '對牛彈＿' }), at: 0.3 })
    .W(0.5).C(buzz('bao')).S(close('bao')).W(0.5)
    .L('bao', '牛……牛肉麵！', 'Cow… beef noodle soup!', 'excited', { cue: wrong('bao'), at: 1.6 })
    .C(laugh(2.2, ['lei', 'shuo', 'yuan', 'host'])).W(1.9)
    .L('host', '對牛彈牛肉麵……那頭牛應該很感動。', 'Playing beef noodle soup to a cow… that cow must be very moved.', 'thinking', { shot: close('host', { dist: 1.6 }) })
    .C(laugh(1.8)).W(1.3).C(buzz('han')).S(close('han')).W(0.5)
    .L('han', '琴，彈琴的琴。比喻對不懂的人講道理，白費力氣。', 'A zither — “qin”. It means reasoning with someone who can’t understand: a waste of breath.', 'calm', { keep: true })
    .C(right('han', 300)).C(screen('q', { round: R, pts: PTS, word: '對牛彈＿', mark: 3, fix: '琴' }), 0.2).W(1.2)
    .L('host', '答對了！就像我現在，叫小雷不要先按鈴一樣。', 'Correct! Just like me telling Xiaolei not to buzz too early.', 'happy', { shot: HOSTW })
    .L('lei', '蛤？', 'Huh?', 'surprised', { gap: 0.2 })
    .C(laugh(1.6)).W(1.3)
    .L('host', '大寶，我給你一個特別題。答對了，送你兩百分！', 'Dabao, here’s a special one just for you. Get it right and the two hundred are yours!', 'happy', { shot: { kind: 'two', on: ['host', 'bao'], side: -1, dist: 3.4 } })
    .L('bao', '真的嗎？', 'Really?', 'surprised')
    .L('host', '什麼吞虎嚥？就是吃東西吃得又快又急的樣子。', 'Something “gulps like a tiger” — what? It’s eating fast and greedily.', 'calm', { shot: SCREEN, cue: screen('q', { round: R, pts: PTS, word: '＿吞虎嚥', hint: '吃得又快又急' }), at: 0.3 })
    .L('bao', '狼！狼吞虎嚥！這個我最會了！', 'Wolf! Wolfs it down like a tiger! I’m the best at that!', 'excited', { gap: 0.15, shot: close('bao'), cue: buzz('bao') })
    .C(right('bao', 200)).C(screen('q', { round: R, pts: PTS, word: '＿吞虎嚥', mark: 0, fix: '狼' }), 0.2).C((A) => A.bao.gest('jump'), 0.4).C(clap(5), 0.6).W(1.6)
    .L('host', '恭喜大寶！用一輩子的吃飯經驗，換來的兩百分！', 'Congratulations, Dabao! Two hundred points, earned by a lifetime of eating!', 'excited', { shot: MASTER })
    .C(laugh(1.6)).W(1.3)
    .L('host', '第四題：什麼發制人？', 'Question four: strike — what — to win?', 'calm', { shot: SCREEN, cue: screen('q', { round: R, pts: PTS, word: '＿發制人' }), at: 0.3 })
    .C(buzz('lei'), 0.0).S(close('lei')).W(0.5)
    .L('host', '小雷又搶到了！請回答！', 'Xiaolei’s in first again! Your answer!', 'excited', { keep: true })
    .W(0.8).L('lei', '……我忘了。', '…I forgot.', 'shy', { cue: wrong('lei'), at: 0.9 })
    .C(laugh(2.2, ['han', 'bao', 'host'])).W(1.8)
    .L('host', '其實這題就是在說你：先發制人。可惜你先發了，但是沒有制到人。', 'The answer is you: “strike first”. Shame you struck first and didn’t win.', 'thinking', { shot: close('host', { dist: 1.6 }) })
    .C(laugh(1.4)).W(0.6).C(buzz('rui')).S(close('rui')).W(0.4)
    .L('rui', '先。先發制人。', '“First”. Strike first to win.', 'calm', { keep: true })
    .C(right('rui', 400)).C(screen('q', { round: R, pts: PTS, word: '＿發制人', mark: 0, fix: '先' }), 0.2).W(1.2)
    .L('host', '最後一題：一什麼雙鵰？', 'Last question: one — what — two eagles?', 'calm', { shot: SCREEN, cue: screen('q', { round: R, pts: PTS, word: '一＿雙鵰' }), at: 0.3 })
    .W(0.6).C((A, F) => { buzz('han')(A, F); buzz('yuan')(A, F); }).S({ kind: 'two', on: ['han', 'yuan'], side: -1, dist: 4.6 }).W(0.6)
    .L('host', '兩個同時按！我看一下……圓圓快了一點點！', 'Both at once! Let me see… Yuanyuan was a hair faster!', 'surprised', { shot: HOSTW })
    .L('yuan', '……箭。', '…Arrow.', 'shy', { shot: close('yuan') })
    .C(right('yuan', 300)).C(screen('q', { round: R, pts: PTS, word: '一＿雙鵰', mark: 1, fix: '箭' }), 0.2).W(1.2)
    .L('host', '答對了！現場的觀眾有聽到嗎？我是用讀唇的！', 'Correct! Could the audience hear that? I had to read her lips!', 'excited', { shot: close('host', { dist: 1.7 }) })
    .C(laugh(1.6)).W(1.3)
    .L('host', '第三關結束！我們來看看分數——', 'End of round three! Let’s look at the scores —', 'excited', { shot: SCREEN, cue: (A, F) => { F.sfx('drumroll', 2.2); set(F).screen('scores', { title: '第三關結束', rows: [['奕叡', 400, '#2a3a8a'], ['奕碩', 400, '#d8462a'], ['林書涵', 300, '#3a7ad8'], ['張圓圓', 300, '#e86aa0'], ['王大寶', 200, '#f08a2a'], ['陳小雷', 100, '#e8b81a']] }); }, at: 1.2 })
    .W(1.6)
    .L('host', '最高分是……奕叡跟奕碩，一樣四百分！兄弟倆一起進入決戰！', 'At the top… Yi Rui and Yi Shuo, four hundred each! The brothers go through to the final together!', 'excited', { shot: BROS, cue: (A, F) => { F.sfx('jingle'); set(F).lights('party'); }, at: 2.4 })
    .C((A, F) => { F.sfx('sample', pick(F, 'cheer'), 0.9); set(F).crowd('cheer', 4); A.shuo.gest('jump'); }).W(1.6)
    .L('shuo', '哥！我們一起進決賽了！', 'Brother! We’re both in the final!', 'excited', { shot: BROS })
    .L('rui', '嗯。決賽場上，可不讓你。', 'Mm. In the final, I won’t go easy on you.', 'proud', { keep: true })
    .L('shuo', '我才不要你讓呢！', 'I don’t want you to!', 'angry', { keep: true })
    .C((A, F) => set(F).lights('show')).W(0.6)
    .L('host', '其他四位小朋友也都很棒，掌聲給他們！', 'The other four were wonderful too — a big hand for them!', 'happy', { shot: KIDS, cue: clap(5), at: 2.6 })
    .C((A) => { for (const n of ['lei', 'han', 'bao', 'yuan']) A[n].gest(n === 'yuan' ? 'bow' : 'wave'); }).W(1.4)
    .L('bao', '主持人，那……有沒有便當？', 'Host, um… is there a lunch box?', 'shy', { shot: close('bao') })
    .C(laugh(1.8)).W(1.3)
    .L('host', '有！工作人員待會兒送過去！', 'There is! The crew will bring it right over!', 'happy', { shot: close('host', { dist: 1.7 }) })
    .C(laugh(0.7)).W(0.6);
});

// ================================================================ 6 決戰 一字千金: the final
scene({ set: 'studio', tod: 'night', focus: [0, 0], place: placeAll(), setup: (A, F) => { SCORES([100, 300, 400, 400, 200, 300])(A, F); still(A); F.put('ball', 'ball', P3(F, -6.4, 0.66, -0.35)); A.shuo.hero.ball.visible = false; set(F).lights('dim'); } }, (sc) => {
  const R = '決戰　一字千金', PTS = '每題 1000 分';
  const write = (A) => { A.rui.gest('write', { hold: true }); A.shuo.gest('write', { hold: true }); };
  // the answer boards, one prop for each thing written (a prop keeps what it was made with)
  const board = (who, text) => (A, F) => { const n = who + ':' + text; F.put(n, 'board:' + text, F.P(0, -9)); F.give(n, who, 'R', [0.06, 0.04, who === 'rui' ? 0.24 : 0.14]); A[who].gest('show', { hold: true }); F.sfx('swoosh'); };
  const boards = (a, b) => (A, F) => { board('rui', a)(A, F); board('shuo', b)(A, F); };
  const down = (A, F) => { for (const n of ['rui:ㄉㄚˊ', 'shuo:ㄉㄚˊ', 'rui:龜', 'shuo:龜', 'rui:弟', 'shuo:哥']) if (F.prop(n)) F.hide(n); A.rui.gesture = null; A.shuo.gesture = null; };
  sc.S({ kind: 'at', pos: [0, 1.6, 5.0], look: [0, 1.4, -4], fov: 40, drift: [0, 0, -0.18] }).C((A, F) => { F.sfx('drumroll', 2.6); set(F).screen('final', { a: '奕叡', b: '奕碩' }); }).W(3.0)
    .L('host', '最後決戰，一字千金！每題一千分，兩位同時寫在板子上！', 'The final: A Word Worth Gold! A thousand a question — you both write on your boards at once!', 'excited', { shot: HOSTW })
    .L('host', '第一題：三個「龍」字疊在一起，念什麼？', 'Question one: three “dragon” characters stacked together — how is it read?', 'calm', { shot: SCREEN, cue: screen('ask', { round: R, pts: PTS, big: '龘', foot: '三個龍疊在一起，念什麼？' }), at: 0.3 })
    .C(write).C((A, F) => F.sfx('ticktock', 4)).S(BROS).W(4.4)
    .L('host', '時間到！請亮板！', 'Time! Boards up!', 'excited', { shot: HOSTW })
    .C(boards('ㄉㄚˊ', 'ㄉㄚˊ')).S(BROS).W(0.5)
    .L('rui', 'ㄉㄚˊ。', '“Da”.', 'calm', { keep: true, say: '達。' })
    .L('shuo', 'ㄉㄚˊ！', '“Da”!', 'excited', { keep: true, gap: 0.05, say: '達！' })
    .C((A, F) => { F.sfx('ding'); set(F).score(2, 1400); set(F).score(3, 1400); set(F).crowd('clap', 3); F.sfx('sample', pick(F, 'applause'), 0.7); }).W(1.4)
    .L('host', '兩個都對！你們家是不是每天都在寫龍啊？', 'Both right! Does your family write dragons every day?', 'surprised', { shot: close('host', { dist: 1.7 }) })
    .C(down)
    .L('shuo', '我們家叫龍門刀莊，門口就有兩條龍！', 'Our home is called the Longmen — the Dragon Gate — Saber Manor! There are two dragons on the gate!', 'excited')
    .C(laugh(1)).W(0.8)
    .L('host', '第二題：請寫出「烏龜」的「龜」，一筆都不能錯！', 'Question two: write the “gui” of “tortoise” — not one stroke wrong!', 'calm', { shot: SCREEN, cue: screen('ask', { round: R, pts: PTS, text: '寫出「烏龜」的「龜」', foot: '一筆都不能錯' }), at: 0.3 })
    .C(write).C((A, F) => F.sfx('ticktock', 4)).S({ kind: 'close', on: 'shuo', side: 1, dist: 1.4, down: 0.3 }).W(2.2).S({ kind: 'close', on: 'rui', side: -1, dist: 1.5, down: 0.3 }).W(2.2)
    .L('host', '時間到！亮板！', 'Time! Boards up!', 'excited', { shot: HOSTW })
    .C(boards('龜', '龜')).S(BROS).W(0.8)
    .L('host', '我來數一數……一、二、三……十六畫！兩隻烏龜都對！', 'Let me count… one, two, three… sixteen strokes! Both tortoises are right!', 'excited', { shot: { kind: 'prop', on: 'shuo:龜', fov: 30 } })
    .C((A, F) => { F.sfx('ding'); set(F).score(2, 2400); set(F).score(3, 2400); set(F).crowd('clap', 3); F.sfx('sample', pick(F, 'applause'), 0.7); }).W(1.4).C(down)
    .L('host', '怎麼又平手？製作單位，題目還有嗎？', 'A draw again? Producers — do we have any questions left?', 'worried', { shot: close('host', { dist: 1.6 }) })
    .C(laugh(1.6)).W(1.3)
    .C((A, F) => { F.sfx('warm', 22); set(F).lights('dim'); })
    .L('host', '好。最後一題，決定今天的冠軍。', 'All right. One last question, for tonight’s championship.', 'calm', { shot: { kind: 'close', on: 'host', side: -1, dist: 2.0, push: 0.04 } })
    .L('host', '請寫一個字，代表你心中，最重要的人。', 'Write one character: the person who matters most to you.', 'calm', { shot: SCREEN, cue: screen('ask', { round: R, pts: PTS, text: '寫一個字', foot: '代表你心中最重要的人', size: 120 }), at: 0.3 })
    .C(write).S(BROS).W(2.6).S({ kind: 'close', on: 'rui', side: -1, dist: 1.4, down: 0.2, push: 0.04 }).W(2.0).S({ kind: 'close', on: 'shuo', side: 1, dist: 1.4, down: 0.2, push: 0.04 }).W(2.0)
    .L('host', '時間到。奕叡，請亮板。', 'Time. Yi Rui, your board.', 'calm', { shot: HOSTW })
    .C(board('rui', '弟')).S({ kind: 'prop', on: 'rui:弟', fov: 30 }).W(1.2)
    .L('rui', '弟。我心中最重要的人，是我弟弟。', '“Younger brother”. The person who matters most to me is my little brother.', 'calm', { shot: close('rui', { dist: 1.7 }) })
    .C((A, F) => F.face('shuo', 'rui')).W(0.6)
    .L('host', '奕碩，換你。', 'Yi Shuo, your turn.', 'calm', { shot: HOSTW })
    .C(board('shuo', '哥')).S({ kind: 'prop', on: 'shuo:哥', fov: 30 }).W(1.2)
    .L('shuo', '哥！我心中最重要的人，是我哥！', '“Big brother”! The person who matters most to me is my big brother!', 'excited', { shot: close('shuo', { dist: 1.5 }) })
    .C((A, F) => { F.sfx('sample', pick(F, 'aww'), 1); set(F).crowd('aww', 4); F.face('rui', 'shuo'); }).S(BROS).W(2.4)
    .L('host', '哥哥寫「弟」，弟弟寫「哥」……', 'The big brother writes “little brother”, the little brother writes “big brother”…', 'sad', { shot: { kind: 'close', on: 'host', side: -1, dist: 1.7, push: 0.05 } })
    .L('host', '我主持這麼多年，第一次在節目上，被小朋友弄哭……', 'All these years hosting, and this is the first time a kid has made me cry on air…', 'sad', { cue: (A) => A.host.gest('cry', { hold: true }), at: 0.6 })
    .C(laugh(0.6)).C((A, F) => { F.sfx('sample', pick(F, 'aww'), 0.7); }, 0.4).W(1.6).C((A) => { A.host.gesture = null; })
    .L('host', '這題我判不下去。我宣布——今天的冠軍：奕叡、奕碩，平手！', 'I can’t judge this one. I declare — tonight’s champions: Yi Rui and Yi Shuo, a draw!', 'excited', { shot: MASTER, cue: (A, F) => { F.sfx('drumroll', 1.6); }, at: 1.2 })
    .C((A, F) => { F.callout({ zh: '平手！', en: 'A draw!' }, { dur: 2.2 }); set(F).screen('tie', { sub: '雙冠軍　奕叡・奕碩' }); set(F).lights('party'); set(F).confetti(); F.sfx('jingle'); F.sfx('coins'); F.sfx('sample', pick(F, 'cheer'), 1); set(F).crowd('cheer', 6); down(A, F); A.shuo.gest('jump'); for (const n of ['lei', 'han', 'bao', 'yuan']) A[n].gest('clap'); })
    .S({ kind: 'at', pos: [0, 2.2, 4.6], look: [0, 1.6, -2.4], fov: 52, drift: [0, 0.06, -0.15] }).W(2.6)
    .C((A, F) => { F.walk('shuo', pod('shuo').x - 0.45, pod('shuo').z - 0.95, { speed: 1.2 }); F.walk('rui', pod('rui').x + 0.45, pod('rui').z - 0.95, { speed: 1.2 }); }).W(1.2)
    .C((A, F) => { F.face('shuo', 'rui'); F.face('rui', 'shuo'); A.shuo.gest('hug', { hold: true }); A.rui.gest('hug', { hold: true }); F.sfx('sample', pick(F, 'aww'), 0.6); }).S({ kind: 'two', on: ['rui', 'shuo'], side: -1, dist: 2.2 }).W(1.2)
    .L('shuo', '哥！我們平手！跟在家裡比的時候一樣！', 'Brother! It’s a draw! Just like when we have a go at home!', 'excited', { keep: true })
    .L('rui', '再來一百次，也是平手。', 'A hundred more times, and still a draw.', 'proud', { keep: true })
    .C(clap(5)).W(2.0);
});

// ================================================================ 7 尾聲 two thousand gold, a lunch box, and the ball
scene({ set: 'studio', tod: 'night', focus: [0, 0], place: { ...placeAll(), rui: { x: pod('rui').x + 0.45, z: pod('rui').z - 0.95, yaw: 0.4 }, shuo: { x: pod('shuo').x - 0.45, z: pod('shuo').z - 0.95, yaw: -0.4 } },
  setup: (A, F) => { SCORES([100, 300, 2400, 2400, 200, 300])(A, F); still(A); F.put('ball', 'ball', P3(F, -6.4, 0.66, -0.35)); A.shuo.hero.ball.visible = false; set(F).screen('tie', { sub: '雙冠軍　奕叡・奕碩' }); } }, (sc) => {
  sc.S(HOSTW)
    .L('host', '一字千金，兩個冠軍，就是兩千金……製作人，你的臉怎麼綠了？', 'A word worth gold, two champions — that’s two lots of gold… Producer, why has your face gone green?', 'happy', { keep: true })
    .C(laugh(2.2)).W(1.8)
    .L('bao', '主持人，那我的便當呢？', 'Host, so where’s my lunch box?', 'shy', { shot: close('bao') })
    .C(laugh(1.8, ['host', 'lei'])).W(1.3)
    .L('host', '好啦好啦！今天的《一字千金》就到這裡，我們下次見！', 'All right, all right! That’s all for tonight’s A Word Worth Gold — see you next time!', 'happy', { shot: MASTER, cue: (A) => A.host.gest('wave') })
    .C(clap(5)).C((A, F) => { F.walk('host', -6.0, 0.3, { speed: 1.8 }); }).W(1.4)
    .C((A, F) => { F.give('ball', 'host', 'R', [0, 0.02, 0.12]); A.host.gest('catch', { hold: true }); const L = pod('shuo'); F.walk('host', L.x - 0.6, L.z + 0.7, { speed: 1.9 }); }).S(MASTER).W(3.4)
    .C((A, F) => F.face('host', 'shuo'))
    .L('host', '對了，奕碩，你的球，還你。', 'Oh, and Yi Shuo — your ball. Here you go.', 'happy', { shot: { kind: 'two', on: ['host', 'shuo'], side: -1, dist: 2.2 } })
    .C((A, F) => { A.host.gesture = null; F.give('ball', 'shuo', 'R', [0, 0.02, 0.12]); A.shuo.gest('catch', { hold: true }); F.face('shuo', 'host'); }).W(0.8)
    .L('shuo', '謝謝主持人！我要踢一個慶祝球！', 'Thank you, sir! I’m so happy — I’m going to kick a celebration ball!', 'excited')
    .L('host', '等一下！不要在這裡——', 'Wait! Not in here —', 'scared', { cue: (A) => A.host.gest('scared'), at: 0.2 })
    .C((A, F) => { // too late: up off his foot, over the podiums, into the middle of the great screen
      A.shuo.gesture = null; F.face('shuo', [0, -5.4], true); A.shuo.gest('jump'); F.sfx('kick'); const from = F.prop('ball').G.position.clone(); F.prop('ball').held = null;
      fly(F, 'ball', from, P3(F, 0.4, 2.7, -5.3), 0.75, 1.2, () => { F.sfx('spark'); F.sfx('crash'); F.set().screen('static'); F.set().lights('show'); fly(F, 'ball', P3(F, 0.4, 2.7, -5.3), P3(F, 0.9, 0.16, -3.6), 0.7, 0.4, () => F.sfx('bounce')); });
    }, 0.1)
    .S({ kind: 'at', pos: [2.4, 1.6, 2.6], look: [0, 2.3, -5.4], fov: 46 }).W(1.6)
    .C((A, F) => { F.sfx('sample', pick(F, 'ooh'), 1); set(F).crowd('ooh', 2.4); for (const n of ['lei', 'han', 'bao', 'yuan', 'rui']) A[n].gest('scared'); }).W(1.6)
    .L('host', '……下次比賽，請不要帶球！', '…Next time, please DON’T bring a ball!', 'shout', { shot: close('host', { dist: 1.6 }), cue: (A) => A.host.gest('facepalm'), at: 1.4 })
    .C(laugh(2.4, ['bao', 'lei', 'han', 'yuan', 'rui'])).S(MASTER).W(3.0)
    .L('shuo', '……對不起啦！', '…Sorry!', 'shy', { shot: close('shuo') })
    .C(laugh(1.6)).S({ kind: 'at', pos: [0, 4.4, 9.4], look: [0, 1.6, -3.5], fov: 50, drift: [0, 0.08, 0.1] }).W(5.5);
}, );

// ---------------------------------------------------------------- laid end to end
let T0 = 0; const lines = [], cues = [], shots = [], scenes = [], say = [];
for (const s of SCENES) {
  scenes.push({ t: T0, set: s.set, tod: s.tod, ambience: s.ambience, focus: s.focus, caption: s.caption, place: s.place, room: STUDIO.room, setup: s.setup });
  for (const [t, ...r] of s.lines) lines.push([T0 + t, ...r]); say.push(...s.say);
  for (const [t, f] of s.cues) cues.push([T0 + t, f]);
  for (const [t, sh] of s.shots) shots.push([T0 + t, sh]);
  T0 += s.len;
}
cues.sort((a, b) => a[0] - b[0]); shots.sort((a, b) => a[0] - b[0]);
export const SHOW1 = {
  id: 'show1', len: T0, voiced: true, audioV: 1, pace: 12, scenes, lines, cues, shots, say,
  samplesV: 3, samples: ['applause_long', ...Object.entries(TAKES).flatMap(([b, n]) => Array.from({ length: n }, (_, i) => b + (i + 1)))],
  title: { zh: ['龍門雙奕　番外篇', '一字千金'], en: ['The Longmen Brothers — a special', 'A Word Worth Gold'] },
  end: { zh: '《一字千金》兒童特別節目　完', en: 'The End' },
  blurb: { zh: '奕叡和奕碩去參加曾國城主持的國字比賽《一字千金》！六個小朋友：先按再想的小雷、把辭典當故事書的書涵、滿腦子食物的大寶、小聲到要蹲下來聽的圓圓……最後的決戰，兄弟倆寫下的字讓主持人判不下去。播放中可以拖曳畫面轉視角。', en: 'Yi Rui and Yi Shuo go on “A Word Worth Gold”, a children’s quiz show of Chinese characters. Six kids: one who buzzes before he thinks, one who reads the dictionary for fun, one whose head is full of food, one who whispers… and in the final, the brothers write words the host just can’t judge. Drag the picture to look around while it plays.' },
  cast: {
    host: ['host', { team: 'show' }], lei: ['xiaolei', { team: 'show' }], han: ['shuhan', { team: 'show' }], rui: ['yirui', { team: 'show' }],
    shuo: ['yishuo', { team: 'show' }], bao: ['dabao', { team: 'show' }], yuan: ['yuanyuan', { team: 'show' }],
  },
};
