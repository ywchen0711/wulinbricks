// 武林積木 Wulin Bricks: the martial world's people as minifigures, with their moves. Two modes:
//   練功場 practice: one character on the practice ground, its moves tried on a post and a wall
//   對打 duel: the two brothers face each other, to try their moves on someone, and how each takes a blow
// (the films are in film.html). ?who=yishuo ?mode=duel ?slow=1; window.APP for tests.
import { createWorld, orbit, V } from './engine.js';
import { wake } from './sound.js';
import { CAST, HEROES } from './cast/index.js';
import { MOVES } from './moves/index.js';
import { createMotion } from './motion.js';

const $ = (id) => document.getElementById(id), q = new URLSearchParams(location.search);
let lang = q.get('lang') === 'en' ? 'en' : 'zh';
const cv = $('cv'), W = createWorld(cv), O = orbit(cv, () => $('auto').classList.remove('on'));
const S = { mode: 'practice', who: 'yirui', slow: q.has('slow'), auto: false, autoTurn: 0, idleFor: 0, duel: [HEROES.includes(q.get('a')) ? q.get('a') : 'yirui', HEROES.includes(q.get('b')) ? q.get('b') : 'yishuo'] };
const T = (zh, en) => (lang === 'zh' ? zh : en);

// 體感 motion: the camera watches the player; the hero copies them as in a mirror, and the gesture of his move sets it off
const GEST = {
  yirui: { g: 'chop', move: 'yidao', how: ['雙手高舉過頭，停一下，再用力往下劈！', 'Raise both hands over your head, hold, then chop down hard!'] },
  yishuo: { g: 'kick', move: 'xuanfeng', how: ['把膝蓋抬到腰那麼高，或用力往上踢腳！', 'Bring a knee up to your waist, or kick a foot up high!'] },
  xiaotian: { g: 'push', move: 'xiaojin', how: ['雙掌收到腰邊，停一下，再一起往前推出去！', 'Draw both palms to your hips, hold, then thrust them both forward!'] },
};
let MO = null;
const motion = () => (MO ||= createMotion({ video: $('cam'), overlay: $('bones'), onStatus: (s) => { S.mstat = s; texts(); } }));
async function camOn() {
  wake(); try { await motion().start(); } catch (e) { S.mstat = e.message === 'nocam' || e.name === 'NotAllowedError' || e.name === 'NotFoundError' ? 'denied' : 'error'; console.error(e); texts(); }
}

// ---------------------------------------------------------------- setting the scene
function setup(mode, who = S.who) {
  W.clear(); S.mode = mode; S.who = who; S.auto = false; O.on = false; $('auto').classList.add('on');
  if (mode === 'practice' || mode === 'motion') { W.useTargets = true; W.targets.show(true); if (W.targets.broken) W.targets.build(); W.add(who, { x: 0, z: 0, yaw: 0 }); }
  else { W.useTargets = false; W.targets.show(false); W.add(S.duel[0], { x: 0, z: 0, yaw: 0 }); W.add(S.duel[1], { x: 0, z: 5.4, yaw: Math.PI }); }
  try { localStorage.setItem('wulin.cast', who); } catch (e) { /* */ }
  $('camBox').hidden = mode !== 'motion'; if (mode !== 'motion' && MO?.running) MO.stop();
  texts();
}
const hero = () => W.fighters[0];
function perform(f, id) { wake(); if (S.mode !== 'duel' && W.targets.broken) W.targets.build(); if (f.perform(id)) document.querySelectorAll('[data-move]').forEach((b) => b.classList.toggle('on', b.dataset.move === id && +b.dataset.f === W.fighters.indexOf(f))); }
// a blow from nowhere, to see how he takes it: from the front, at the weight asked
function test(i, kind) { wake(); const f = W.fighters[i]; if (!f) return; f.hit({ kind, dir: f.dirWorld(V(0, 0, -1)), at: f.pos.add(V(0, f.CH.spec.age === 'kid' ? 0.6 : 0.95, 0)) }); }

// ---------------------------------------------------------------- the camera
function autoCam() {
  if (S.mode === 'motion') { const f = hero(); if (f.move) return W.moveCam(f); const k = f.F.height / 1.5; const side = innerWidth > 760 ? -0.85 * k : 0; return { pos: f.toWorld(V(side, 0.95 * k, 4.2 * k)), look: f.toWorld(V(side, 0.68 * k, 0)), fov: 40 }; } // straight on, as in a mirror, the hero to the right of the card
  if (S.mode === 'practice') {
    const f = hero(); if (f.move) return W.moveCam(f);
    const c = MOVES[f.CH.moves[0]].cam[0], a = Math.sin(W.clock * 0.18) * 0.25; return { pos: f.toWorld(V(...c.pos).applyAxisAngle(V(0, 1, 0), a)), look: f.toWorld(V(...c.look)), fov: c.fov };
  }
  // the duel, from the side: both in the frame, a little closer on whoever is acting or being struck
  const [a, b] = W.fighters, mid = a.pos.add(b.pos).multiplyScalar(0.5), act = W.fighters.find((f) => f.react) || W.fighters.find((f) => f.move);
  const span = a.pos.distanceTo(b.pos), focus = act ? mid.clone().lerp(act.pos, 0.35) : mid;
  S.camFocus = (S.camFocus || focus.clone()).lerp(focus, 0.04); const d = 4.2 + span * 0.85, k = 0.11 * d; // off-centre, clear of the panel on the left
  return { pos: V(S.camFocus.x + d, 1.5 + Math.sin(W.clock * 0.2) * 0.1, S.camFocus.z + 0.8), look: V(S.camFocus.x, 0.55, S.camFocus.z + k * 2.2), fov: 40 };
}

// ---------------------------------------------------------------- the page
function texts() {
  document.documentElement.lang = lang === 'zh' ? 'zh-Hant' : 'en';
  $('modes').innerHTML = [['practice', T('練功場', 'Practice')], ['duel', T('對打', 'Duel')], ['motion', T('🎥 體感', '🎥 Motion')]].map(([m, n]) => `<button data-mode="${m}" class="${S.mode === m ? 'on' : ''}">${n}</button>`).join('') + `<a href="film.html${lang === 'en' ? '?lang=en' : ''}">${T('🎬 劇情', '🎬 Story')}</a><a href="film.html?ep=show1${lang === 'en' ? '&lang=en' : ''}">${T('🏆 一字千金', '🏆 A Word Worth Gold')}</a>`;
  $('card').hidden = S.mode === 'duel'; $('duelp').hidden = S.mode !== 'duel';
  $('slow').textContent = T('慢動作', 'Slow motion'); $('reset').textContent = T('重置靶子', 'Reset targets'); $('reset').hidden = S.mode === 'duel'; $('auto').textContent = T('🎬 自動鏡頭', '🎬 Auto camera'); $('lang').textContent = lang === 'zh' ? 'EN' : '中';
  $('slow').classList.toggle('on', S.slow);
  $('motionp').hidden = S.mode !== 'motion'; $('bio').hidden = S.mode === 'motion';
  if (S.mode !== 'duel') {
    const CH = CAST[S.who];
    $('cast').innerHTML = HEROES.map((id) => { const C = CAST[id]; return `<button data-cast="${id}" class="${id === S.who ? 'on' : ''}">${C.name[lang]}<small>${C.title[lang]}</small></button>`; }).join('');
    $('name').textContent = CH.name[lang]; $('ename').textContent = lang === 'zh' ? CH.name.en : CH.name.zh; $('title').textContent = CH.title[lang]; $('bio').textContent = CH.bio[lang];
    $('moves').innerHTML = CH.moves.map((id, i) => { const M = MOVES[id]; return `<button data-move="${id}" data-f="0"><b>${M.name[lang]}</b><kbd>${i + 1}</kbd><small>${M.desc[lang]}</small></button>`; }).join('');
    $('hint').textContent = T('按招式（或空白鍵）出招．Tab 換人．拖曳畫面轉視角，滾輪縮放，雙擊回到自動鏡頭', 'Press a move (or Space). Tab changes who. Drag to look around, wheel to zoom, double-click for the auto camera');
    if (S.mode === 'motion') { motionTexts(); $('hint').textContent = T('跟著鏡頭動，比出招式的動作就會出招．也可以按招式按鈕', 'Move in front of the camera and make the gesture to set off the move, or press the move button'); }
  } else {
    $('duelp').innerHTML = `<h2>${T('對打', 'Sparring')}</h2>` + W.fighters.map((f, i) => `<div class="fr"><select data-pick="${i}">${HEROES.map((id) => `<option value="${id}" ${id === f.id ? 'selected' : ''}>${CAST[id].name[lang]}</option>`).join('')}</select>${f.CH.moves.map((id) => `<button data-move="${id}" data-f="${i}">${MOVES[id].name[lang]}</button>`).join('')}
      <div class="tests"><span>${T('挨打測試', 'Take a blow')}</span><button data-test="light" data-f="${i}">${T('輕擊', 'Light')}</button><button data-test="heavy" data-f="${i}">${T('重擊', 'Heavy')}</button><button data-test="down" data-f="${i}">${T('擊倒', 'Down')}</button></div></div>`).join('')
      + `<button id="together">${T('⚔ 同時出招', '⚔ Both at once')}</button><button id="autoduel" class="${S.auto ? 'on' : ''}">${T('▶ 自動對打', '▶ Auto sparring')}</button>`;
    $('hint').textContent = T('按招式攻擊對方，或用挨打測試看被打的反應．拖曳畫面轉視角', 'Attack with a move, or try how each takes a blow. Drag to look around');
  }
}
document.addEventListener('click', (e) => {
  const m = e.target.closest('[data-move]'); if (m) perform(W.fighters[+m.dataset.f], m.dataset.move);
  const c = e.target.closest('[data-cast]'); if (c && c.dataset.cast !== S.who) setup(S.mode === 'motion' ? 'motion' : 'practice', c.dataset.cast);
  const md = e.target.closest('[data-mode]'); if (md && md.dataset.mode !== S.mode) setup(md.dataset.mode);
  const t = e.target.closest('[data-test]'); if (t) test(+t.dataset.f, t.dataset.test);
  if (e.target.id === 'together') together();
  if (e.target.id === 'autoduel') { wake(); S.auto = !S.auto; S.idleFor = 0; texts(); }
});
document.addEventListener('change', (e) => { const s = e.target.closest('[data-pick]'); if (s) { S.duel[+s.dataset.pick] = s.value; setup('duel'); } });
$('slow').onclick = () => { S.slow = !S.slow; texts(); };
$('reset').onclick = () => { W.targets.build(); W.fx.reset(); };
$('auto').onclick = () => { O.on = false; $('auto').classList.add('on'); };
cv.addEventListener('dblclick', () => $('auto').click());
$('lang').onclick = () => { lang = lang === 'zh' ? 'en' : 'zh'; texts(); };
addEventListener('keydown', (e) => {
  if (e.code === 'Space') { e.preventDefault(); const f = S.mode === 'practice' ? hero() : W.fighters[S.autoTurn++ % 2]; perform(f, f.CH.moves[0]); }
  const n = /^Digit([1-9])$/.exec(e.code); if (n && S.mode === 'practice' && hero().CH.moves[n[1] - 1]) perform(hero(), hero().CH.moves[n[1] - 1]);
  if (e.code === 'Tab') { e.preventDefault(); if (S.mode !== 'duel') setup(S.mode, HEROES[(HEROES.indexOf(S.who) + 1) % HEROES.length]); }
  if (e.code === 'KeyS') $('slow').click(); if (e.code === 'KeyR') $('reset').click(); if (e.code === 'KeyC') { if (O.on) $('auto').click(); else O.wantTake = true; }
});

function motionTexts() {
  const G = GEST[S.who], M = MOVES[G.move], st = S.mstat, on = MO?.running;
  const msg = { camera: T('正在開啟鏡頭……', 'Opening the camera...'), model: T('正在載入動作辨識（第一次要下載約 15 MB）……', 'Loading the pose model (about 15 MB the first time)...'), ready: '', denied: T('沒辦法使用鏡頭。請在瀏覽器設定裡允許這個網站使用相機。', 'The camera cannot be used. Please allow this site to use the camera in the browser settings.'), error: T('動作辨識載入失敗，請重新整理再試一次。', 'The pose model failed to load. Please reload and try again.') }[st] || '';
  $('motionp').innerHTML = `<h2>${T('體感出招', 'Move with your body')}</h2>`
    + (on ? '' : `<button id="camOn">${T('📷 開啟鏡頭', '📷 Turn on the camera')}</button>`)
    + `<p class="mstat">${msg || (on ? T('站到離螢幕兩、三公尺遠，讓全身都入鏡。', 'Stand two or three metres back so your whole body is in the picture.') : T('開啟前置鏡頭後，積木人會像照鏡子一樣跟著你動。畫面只在這台裝置上處理，不會上傳。', 'Turn on the front camera and the minifig copies you like a mirror. The picture is only processed on this device, never sent anywhere.'))}</p>`
    + `<div class="gest"><b>${M.name[lang]}</b><span>${G.how[lang === 'zh' ? 0 : 1]}</span><div class="meter"><i id="meter"></i></div></div>`;
  if ($('camOn')) $('camOn').onclick = camOn;
}
function motionFrame() {
  const f = hero(); if (!f) return;
  if (!MO?.running) { f.live = null; return; }
  MO.tick(performance.now());
  f.live = !f.move && !f.react && MO.st.live ? MO.st.live : null;
  const G = GEST[f.id], m = $('meter'); if (m) m.style.width = Math.round((MO.st.meter[G.g] || 0) * 100) + '%';
  $('look').hidden = !!MO.st.people; if (!MO.st.people) $('look').textContent = T('看不到你喔，請站到鏡頭前面', 'I cannot see you: step in front of the camera');
  for (const e of MO.take()) if (e === G.g && !f.busy) { perform(f, G.move); const el = $('note'); el.textContent = MOVES[G.move].name[lang] + '！'; el.classList.remove('show'); void el.offsetWidth; el.classList.add('show'); }
}

// both strike at the same moment: their blows meet in the middle
function together() { wake(); for (const f of W.fighters) if (f.busy) return; for (const f of W.fighters) perform(f, f.CH.moves[0]); }
// a word over the picture when blows meet
W.note = (kind, at, o) => {
  if (kind === 'bump') return; const el = $('note');
  el.textContent = kind === 'cancel' ? T('抵銷！', 'Cancelled out!') : T(`${o.win.owner.CH.name.zh}的${o.win.name.zh}勝出！`, `${o.win.owner.CH.name.en}’s ${o.win.name.en} wins!`);
  el.classList.remove('show'); void el.offsetWidth; el.classList.add('show');
};
// the brothers taking turns, when asked
function autoDuel(dt) {
  if (!S.auto || S.mode !== 'duel') return;
  const busy = W.fighters.some((f) => f.busy); S.idleFor = busy ? 0 : S.idleFor + dt;
  if (S.idleFor > 0.9) { const n = S.autoTurn++; if (n % 3 === 2) together(); else { const f = W.fighters[n % 2]; perform(f, f.CH.moves[0]); } S.idleFor = 0; }
}
function frame(dt) {
  if (S.mode === 'motion') motionFrame();
  W.slow = S.slow ? 0.25 : 1; W.step(dt); autoDuel(dt);
  if (!W.fighters.some((f) => f.move)) document.querySelectorAll('[data-move].on').forEach((b) => b.classList.remove('on'));
  const c = autoCam(); O.update(W.camera, c.look); W.place(O.on ? O.cam() : c); W.render();
}
let last = performance.now();
function loop(now) { const dt = Math.min(0.05, (now - last) / 1000); last = now; frame(dt); requestAnimationFrame(loop); }
const saved = (() => { try { return localStorage.getItem('wulin.cast'); } catch (e) { return null; } })();
W.resize(); addEventListener('resize', () => W.resize());
setup(['duel', 'motion'].includes(q.get('mode')) ? q.get('mode') : 'practice', HEROES.includes(q.get('who')) ? q.get('who') : HEROES.includes(saved) ? saved : 'yirui');
requestAnimationFrame(loop);
window.APP = {
  W, S, setup, perform, test, O, together, motion, GEST,
  // run a move from its start to a moment at a steady 60 frames a second, and draw it (for tests and pictures)
  sim(t, id, i = 0) { const f = W.fighters[i]; perform(f, id || f.CH.moves[0]); let n = 0; while (f.move && f.t < t && n++ < 3000) W.step(1 / 60); this.render(); return f.t; },
  run(sec) { for (let i = 0; i < sec * 60; i++) { W.step(1 / 60); autoDuel(1 / 60); } this.render(); },
  render() { const c = autoCam(); W.place(O.on ? O.cam() : c); W.render(); },
};
window.DONE = true;
