// The film player: an episode (js/films/<ep>.js) played out by the cast on the engine. Its cues make them walk, turn,
// gesture, perform their moves and take their blows; its lines are shown with the speaker's mouth moving; its shots
// place the camera, framed on wherever the actors are at that moment. Seeking replays the episode from the start
// to the moment, silently. ?ep=ep1 &t=30 &lang=en; window.FILM for tests.
import { createWorld, orbit, V } from './engine.js';
import { wake, mute, SFX } from './sound.js';
import { CAST } from './cast/index.js';
import { EP1 } from './films/ep1.js';

const EPS = { ep1: EP1 };
const $ = (id) => document.getElementById(id), q = new URLSearchParams(location.search);
let lang = q.get('lang') === 'en' ? 'en' : 'zh';
const EP = EPS[q.get('ep')] || EP1;
const cv = $('cv'), W = createWorld(cv, { targets: false }), O = orbit(cv, () => { $('cam').hidden = false; });
const S = { t: 0, playing: false, cue: 0, A: {}, shot: -1, cam: null, lastBlip: 0 };

// ---------------------------------------------------------------- the actors
const F = {
  hold(name) { const f = S.A[name]; if (f?.react) f.react.hold = true; },
  release(name) { S.A[name]?.release(); },
};
function build() {
  W.clear(); S.A = {}; S.cue = 0; S.shot = -1; S.t = 0; W.clock = 0; W.freeze = 0;
  for (const [name, [id, mark]] of Object.entries(EP.cast)) S.A[name] = W.add(id, { ...mark });
}
const lineAt = (t) => EP.lines.find((l) => t >= l[0] && t < l[1]);
function advance(dt) { // film time on by dt: cues fired, the world stepped, the speakers' mouths
  S.t += dt;
  while (S.cue < EP.cues.length && EP.cues[S.cue][0] <= S.t) { EP.cues[S.cue][1](S.A, F); S.cue++; }
  const L = lineAt(S.t); for (const [n, f] of Object.entries(S.A)) f.say(L && L[2] === n);
  if (L && S.t - S.lastBlip > 0.11) { SFX.talk(S.A[L[2]]?.CH.spec.age === 'kid'); S.lastBlip = S.t; }
  W.step(dt);
}
function seek(t) { mute(true); build(); const n = Math.round(t * 60); for (let i = 0; i < n; i++) advance(1 / 60); mute(false); S.cam = null; }

// ---------------------------------------------------------------- the shots, framed on the actors where they are
const head = (f) => f.F.headP.getWorldPosition(V()).add(V(0, 0.15 * f.F.height / 1.5, 0));
const facing = (f) => V(Math.sin(f.mark.yaw), 0, Math.cos(f.mark.yaw));
const rot = (v, a) => v.clone().applyAxisAngle(V(0, 1, 0), a);
function frameShot(s, t0) {
  const A = S.A, dt = S.t - t0;
  if (s.kind === 'at') { const look = s.follow ? head(A[s.follow]) : V(...s.look); return { pos: V(...s.pos).add(V(-(s.drift || 0) * dt, 0, 0)), look, fov: s.fov || 42 }; }
  if (s.kind === 'move') { const f = A[s.on]; if (f.move) return W.moveCam(f); return frameShot({ kind: 'close', on: s.on, side: 1, dist: 1.8 }, t0); }
  if (s.kind === 'close' && A[s.on].react?.kind === 'down' && A[s.on].react.t > 0.6) { const f = A[s.on], h = head(f), side = rot(facing(f), (s.side || 1) * 1.2); return { pos: h.clone().add(V(0, 1.05, 0)).addScaledVector(side, 0.7), look: h.clone(), fov: 36 }; } // lying down: from above his face
  if (s.kind === 'close') { const f = A[s.on], h = head(f), fw = facing(f), d = (s.dist || 1.7) * f.F.height / 1.5 + 0.4; const pos = h.clone().addScaledVector(rot(fw, (s.side || 1) * 0.55), d).add(V(0, s.low ? 0.55 : 0.05, 0)); return { pos, look: h.clone().add(V(0, -0.08, 0)), fov: 34 }; }
  if (s.kind === 'over') { const a = head(A[s.from]), b = head(A[s.to]), ax = a.clone().sub(b).setY(0).normalize(), perp = V(ax.z, 0, -ax.x); return { pos: a.clone().addScaledVector(ax, (s.dist || 1.8) * 1.0).addScaledVector(perp, 0.95).add(V(0, 0.05, 0)), look: b.clone().add(V(0, -0.12, 0)), fov: 36 }; }
  const ids = s.kind === 'two' ? s.on : s.on, hs = ids.map((n) => head(A[n])), c = hs.reduce((m, v) => m.add(v), V()).divideScalar(hs.length);
  const ax = hs[1].clone().sub(hs[0]).setY(0); if (ax.lengthSq() < 1e-4) ax.set(1, 0, 0); ax.normalize(); const perp = V(ax.z, 0, -ax.x).multiplyScalar(s.side || 1);
  const span = Math.max(...hs.map((h) => h.distanceTo(c))) * 2, d = s.dist || span * 1.1 + 1.8;
  return { pos: c.clone().addScaledVector(perp, d).add(V(-(s.drift || 0) * dt, s.high ? 2.4 : s.kind === 'two' ? 0.3 : 0.9, 0)), look: c.clone().add(V(0, -0.25, 0)), fov: s.kind === 'two' ? 36 : 42 };
}
function camera() {
  let i = 0; while (i < EP.shots.length - 1 && EP.shots[i + 1][0] <= S.t) i++;
  const [t0, s] = EP.shots[i], c = frameShot(s, t0);
  if (S.shot !== i || !S.cam) { S.shot = i; S.cam = { pos: c.pos.clone(), look: c.look.clone(), fov: c.fov }; }
  else { const k = s.kind === 'move' ? 1 : 0.12; S.cam.pos.lerp(c.pos, k); S.cam.look.lerp(c.look, k); S.cam.fov += (c.fov - S.cam.fov) * k; }
  return S.cam;
}

// ---------------------------------------------------------------- words over the picture
function overlays() {
  const t = S.t, L = lineAt(t), sub = $('sub');
  if (L) { const who = S.A[L[2]], html = `<b style="color:${who.CH.spec.colors.top}">${who.CH.name[lang]}</b>${lang === 'zh' ? L[3] : L[4]}`; if (sub.dataset.h !== html) { sub.innerHTML = html; sub.dataset.h = html; } sub.style.opacity = 1; } else sub.style.opacity = 0;
  const ti = $('title'), tk = Math.max(0, Math.min(1, (t - 0.3) * 2, (2.4 - t) * 2)); ti.style.opacity = tk; ti.innerHTML = `<small>${EP.title[lang][0]}</small>${EP.title[lang][1]}`;
  const ek = Math.max(0, Math.min(1, (t - (EP.len - 4)) * 1.5)); $('end').style.opacity = ek; $('end').textContent = EP.end[lang];
  $('fade').style.opacity = Math.max(0, 1 - t / 0.8, (t - (EP.len - 1.2)) / 1.2);
  $('scrub').value = t / EP.len; $('time').textContent = `${fmt(t)} / ${fmt(EP.len)}`;
}
const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

// ---------------------------------------------------------------- playing
function play() { wake(); if (S.t >= EP.len - 0.05) seek(0); S.playing = true; $('pp').textContent = '❚❚'; $('start').hidden = true; }
function pause() { S.playing = false; $('pp').textContent = '▶'; }
$('go').onclick = play;
$('pp').onclick = () => (S.playing ? pause() : play());
$('scrub').onchange = (e) => { seek(+e.target.value * EP.len); };
$('lang').onclick = () => { lang = lang === 'zh' ? 'en' : 'zh'; texts(); };
$('cam').onclick = () => { O.on = false; $('cam').hidden = true; };
cv.addEventListener('dblclick', () => $('cam').click());
addEventListener('keydown', (e) => { if (e.code === 'Space') { e.preventDefault(); $('pp').click(); } if (e.code === 'ArrowRight') seek(Math.min(EP.len, S.t + 5)); if (e.code === 'ArrowLeft') seek(Math.max(0, S.t - 5)); });
function texts() {
  document.documentElement.lang = lang === 'zh' ? 'zh-Hant' : 'en';
  $('st').innerHTML = `<small>${EP.title[lang][0]}</small>${EP.title[lang][1]}`; $('go').textContent = lang === 'zh' ? '▶ 開演' : '▶ Play';
  $('lang').textContent = lang === 'zh' ? 'EN' : '中'; $('cam').textContent = lang === 'zh' ? '🎬 回到導演鏡頭' : '🎬 Director’s camera'; $('back').textContent = lang === 'zh' ? '← 角色與招式' : '← Characters & moves';
  $('blurb').textContent = lang === 'zh' ? '奕碩在村外玩球，碰上了黑風寨的三個壞人……播放中可以拖曳畫面轉視角。' : 'Yi Shuo is playing ball outside the village when three bandits of the Black Wind come along… Drag the picture to look around while it plays.';
  S.cam = null;
}
let last = performance.now();
function loop(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  if (S.playing) { advance(dt); if (S.t >= EP.len) { S.t = EP.len; pause(); $('start').hidden = false; } }
  const c = camera(); O.update(W.camera, c.look); W.place(O.on ? O.cam() : c); W.render(); overlays();
  requestAnimationFrame(loop);
}
W.resize(); addEventListener('resize', () => W.resize());
texts(); seek(+(q.get('t') || 0)); requestAnimationFrame(loop);
window.FILM = { W, S, EP, seek, play, pause, frame(t) { seek(t); const c = camera(); W.place(c); W.render(); overlays(); }, cast: CAST };
window.DONE = true;
