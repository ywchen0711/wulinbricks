// 武林積木 Wulin Bricks: the martial world's people as minifigures, one at a time, with their moves. This page shows a
// character on the practice ground: he stands on guard and breathes; press a move and he performs it, with its qi,
// its sounds, and a camera that follows it (drag to look round yourself; the button gives the camera back).
//   ?slow=1 starts in slow motion; window.APP for tests (APP.sim(t) runs the move to a moment).
import * as THREE from '../lib/three.module.min.js';
import { EffectComposer } from '../lib/addons/EffectComposer.js';
import { RenderPass } from '../lib/addons/RenderPass.js';
import { UnrealBloomPass } from '../lib/addons/UnrealBloomPass.js';
import { OutputPass } from '../lib/addons/OutputPass.js';
import { buildStage } from './stage.js';
import { makeTargets } from './targets.js';
import { makeFX } from './fx.js';
import { SFX, wake } from './sound.js';
import { CAST } from './cast/index.js';
import { MOVES } from './moves/index.js';

const $ = (id) => document.getElementById(id), q = new URLSearchParams(location.search);
const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
let lang = q.get('lang') === 'en' ? 'en' : 'zh';

// ---------------------------------------------------------------- the picture
const cv = $('cv'), R = new THREE.WebGLRenderer({ canvas: cv, antialias: true });
R.shadowMap.enabled = true; R.shadowMap.type = THREE.PCFSoftShadowMap; R.toneMapping = THREE.ACESFilmicToneMapping; R.toneMappingExposure = 1.05; R.outputColorSpace = THREE.SRGBColorSpace;
const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(40, 16 / 9, 0.05, 200);
const comp = new EffectComposer(R); comp.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(512, 512), 0.55, 0.45, 0.92); comp.addPass(bloom); comp.addPass(new OutputPass());
function resize() { const w = innerWidth, h = innerHeight, d = Math.min(2, devicePixelRatio || 1); R.setPixelRatio(d); R.setSize(w, h, false); comp.setPixelRatio(d); comp.setSize(w, h); camera.aspect = w / h; camera.updateProjectionMatrix(); }
addEventListener('resize', resize);

const stage = buildStage(scene);
{ // reflections for the steel and the plastic: the dusk sky, blurred into an environment
  const pm = new THREE.PMREMGenerator(R), es = new THREE.Scene(); es.add(stage.sky.clone()); scene.environment = pm.fromScene(es, 0.04).texture; scene.environmentIntensity = 0.55;
}
const targets = makeTargets(scene), fx = makeFX(scene);
for (const M of Object.values(MOVES)) M.init?.(scene);
let CH = null, hero = null, F = null;
function cast(id) { // put a character on the practice ground
  if (hero) hero.remove(); S.move = null; for (const M of Object.values(MOVES)) M.reset?.(); fx.reset(); if (targets.broken) targets.build();
  CH = CAST[id] || CAST.yirui; hero = CH.build(scene); F = hero.F; free.on = false;
  try { localStorage.setItem('wulin.cast', CH.id); } catch (e) { /* */ }
  if (typeof texts === 'function') texts();
}

// ---------------------------------------------------------------- poses
const DEF = { armR: -0.2, armL: -0.2, outR: 0, outL: 0, hipR: 0, hipL: 0, tilt: 0, roll: 0, yaw: 0, head: 0, fwd: 0, y: 0, wristR: 0, wristL: 0 };
const ease = { in: (u) => u * u * u, out: (u) => 1 - (1 - u) ** 3, smooth: (u) => u * u * (3 - 2 * u) };
function poseAt(M, t) {
  const K = M.keys; let i = 0; while (i < K.length - 2 && t >= K[i + 1].t) i++;
  const a = K[i], b = K[i + 1], u = Math.max(0, Math.min(1, (t - a.t) / (b.t - a.t))), e = (ease[b.ease] || ease.smooth)(u), p = {};
  for (const k of Object.keys(DEF)) p[k] = (a.p[k] ?? DEF[k]) + ((b.p[k] ?? DEF[k]) - (a.p[k] ?? DEF[k])) * e;
  return p;
}
const curve = (pts, t) => { let i = 0; while (i < pts.length - 2 && t >= pts[i + 1][0]) i++; const [t0, a] = pts[i], [t1, b] = pts[i + 1]; const u = Math.max(0, Math.min(1, (t - t0) / (t1 - t0))); return a + (b - a) * ease.smooth(u); };
const within = (r, t) => t >= r[0] && t <= r[1];
function apply(p, clock, speed) {
  F.pose({ x: 0, y: p.y, z: p.fwd, yaw: p.yaw, tilt: p.tilt, roll: p.roll, hipR: p.hipR, hipL: p.hipL, armR: p.armR, armL: p.armL, outR: p.outR, outL: p.outL, wristR: p.wristR, wristL: p.wristL, head: p.head });
  hero.sway(clock, speed);
}

// ---------------------------------------------------------------- the move being played
const S = { move: null, t: 0, clock: 0, slow: q.has('slow'), fired: [], lastArm: 0 };
const rate = () => (S.slow ? 0.25 : 1);
const ctx = (p, mdt) => ({ fx, sfx: SFX, targets, hero, scene, p, t: S.t, dt: mdt, clock: S.clock, rate: rate(), V, peek });
function peek(t) { const p = S.move ? poseAt(S.move, t) : CH.idle(S.clock).pose; apply({ ...DEF, ...p }, S.clock, 0); F.root.updateMatrixWorld(true); } // pose him at a moment, to find where things will be
function start(id) {
  wake(); const M = MOVES[id]; if (!M) return;
  if (targets.broken) targets.build();
  for (const m of Object.values(MOVES)) m.reset?.(); fx.reset(); S.move = M; S.t = 0; S.fired = [];
  M.start?.(ctx(poseAt(M, 0), 0));
  document.querySelectorAll('[data-move]').forEach((b) => b.classList.toggle('on', b.dataset.move === id));
}
function step(dt) {
  S.clock += dt;
  const M = S.move; let p, glow = 0, gather = 0, cutting = false, speed = 0, mdt = dt, rest = null;
  if (M) {
    // a moment's stillness at the move's strongest instant
    const near = M.hitstop != null && Math.abs(S.t - M.hitstop - 0.02) < 0.05; mdt = dt * rate() * (near ? 0.25 : 1); S.t += mdt;
    const t = S.t; p = poseAt(M, t);
    if (M.glow) glow = curve(M.glow, t); if (M.gather && within(M.gather, t)) gather = Math.sin(Math.PI * (t - M.gather[0]) / (M.gather[1] - M.gather[0])); if (M.trail) cutting = within(M.trail, t);
    F.face(M.face(t));
    speed = Math.min(1, (Math.abs(p.armR - S.lastArm) + Math.abs(p.hipR - (S.lastHip ?? p.hipR))) / Math.max(1e-4, mdt) / 12); S.lastArm = p.armR; S.lastHip = p.hipR;
  } else { rest = CH.idle(S.clock); p = { ...DEF, ...rest.pose }; F.face(rest.face); }
  apply(p, S.clock, speed); hero.setGlow?.(glow);
  F.root.updateMatrixWorld(true);
  const c = ctx(p, mdt);
  if (M) { M.events?.forEach((e, i) => { if (!S.fired[i] && S.t >= e.t) { S.fired[i] = true; e.run(c); } }); M.tick?.(c); if (S.t >= M.len) { S.move = null; document.querySelectorAll('[data-move]').forEach((b) => b.classList.remove('on')); } }
  else CH.idleTick?.(c, rest);
  const feet = V(0, 0, p.fwd), tip = hero.tip ? hero.tip.getWorldPosition(V()) : feet.clone().setY(0.5), base = hero.base ? hero.base.getWorldPosition(V()) : tip;
  fx.update(mdt, S.clock, { tip, base, glow, gather, cutting, feet });
  targets.update(mdt);
  return p;
}

// ---------------------------------------------------------------- the camera: the move's own, or the viewer's
var free = { on: false, yaw: 0, pitch: 0.2, dist: 4, target: V(0, 0.9, 1.5), ptrs: new Map(), pinch: 0 };
function autoCam() {
  const M = S.move;
  if (!M) { const a = Math.sin(S.clock * 0.18) * 0.25, c = MOVES[CH.moves[0]].cam[0]; const pos = V(...c.pos).applyAxisAngle(V(0, 1, 0), a); return { pos, look: V(...c.look), fov: c.fov }; }
  const K = M.cam, t = S.t; let i = 0; while (i < K.length - 2 && t >= K[i + 1].t) i++;
  const a = K[i], b = K[i + 1], u = ease.smooth(Math.max(0, Math.min(1, (t - a.t) / (b.t - a.t))));
  return { pos: V(...a.pos).lerp(V(...b.pos), u), look: V(...a.look).lerp(V(...b.look), u), fov: a.fov + (b.fov - a.fov) * u };
}
function placeCamera() {
  let c;
  if (free.on) { const cp = Math.cos(free.pitch); c = { pos: free.target.clone().add(V(Math.sin(free.yaw) * cp, Math.sin(free.pitch), Math.cos(free.yaw) * cp).multiplyScalar(free.dist)), look: free.target.clone(), fov: 42 }; c.pos.y = Math.max(0.12, c.pos.y); }
  else c = autoCam();
  const sh = fx.S.shake * 0.12; c.pos.add(V((Math.random() - 0.5) * sh, (Math.random() - 0.5) * sh, 0));
  camera.position.copy(c.pos); camera.lookAt(c.look); camera.fov = c.fov; camera.updateProjectionMatrix();
}
function takeCam() { if (free.on) return; const look = autoCam().look, off = camera.position.clone().sub(look); free.target = look.clone(); free.dist = off.length(); free.yaw = Math.atan2(off.x, off.z); free.pitch = Math.asin(Math.max(-0.99, Math.min(0.99, off.y / free.dist))); free.on = true; $('auto').classList.remove('on'); }
function giveBack() { free.on = false; $('auto').classList.add('on'); }
{
  const ok = (e) => e.target === cv;
  cv.addEventListener('pointerdown', (e) => { free.ptrs.set(e.pointerId, [e.clientX, e.clientY]); cv.setPointerCapture(e.pointerId); takeCam(); if (free.ptrs.size === 2) { const [a, b] = [...free.ptrs.values()]; free.pinch = Math.hypot(a[0] - b[0], a[1] - b[1]); } });
  cv.addEventListener('pointermove', (e) => { const p = free.ptrs.get(e.pointerId); if (!p) return; const dx = e.clientX - p[0], dy = e.clientY - p[1]; free.ptrs.set(e.pointerId, [e.clientX, e.clientY]);
    if (free.ptrs.size === 1) { free.yaw -= dx * 0.008; free.pitch = Math.max(-0.05, Math.min(1.4, free.pitch + dy * 0.006)); } else if (free.ptrs.size === 2) { const [a, b] = [...free.ptrs.values()], d = Math.hypot(a[0] - b[0], a[1] - b[1]); if (free.pinch) free.dist = Math.max(0.8, Math.min(30, free.dist * free.pinch / d)); free.pinch = d; } });
  const up = (e) => { free.ptrs.delete(e.pointerId); free.pinch = 0; }; cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
  cv.addEventListener('wheel', (e) => { if (!ok(e)) return; e.preventDefault(); takeCam(); free.dist = Math.max(0.8, Math.min(30, free.dist * Math.exp(e.deltaY * 0.0012))); }, { passive: false });
  cv.addEventListener('dblclick', giveBack);
}

// ---------------------------------------------------------------- the page
function texts() {
  document.documentElement.lang = lang === 'zh' ? 'zh-Hant' : 'en';
  $('cast').innerHTML = Object.values(CAST).map((C) => `<button data-cast="${C.id}" class="${C.id === CH.id ? 'on' : ''}">${C.name[lang]}<small>${C.title[lang]}</small></button>`).join('');
  $('name').textContent = CH.name[lang]; $('ename').textContent = lang === 'zh' ? CH.name.en : CH.name.zh; $('title').textContent = CH.title[lang]; $('bio').textContent = CH.bio[lang];
  $('moves').innerHTML = CH.moves.map((id, i) => { const M = MOVES[id]; return `<button data-move="${id}"><b>${M.name[lang]}</b><kbd>${i + 1}</kbd><small>${M.desc[lang]}</small></button>`; }).join('');
  $('slow').textContent = lang === 'zh' ? '慢動作' : 'Slow motion'; $('reset').textContent = lang === 'zh' ? '重置靶子' : 'Reset targets'; $('auto').textContent = lang === 'zh' ? '🎬 自動鏡頭' : '🎬 Auto camera'; $('lang').textContent = lang === 'zh' ? 'EN' : '中';
  $('hint').textContent = lang === 'zh' ? '按招式（或空白鍵）出招．Tab 換人．拖曳畫面轉視角，滾輪縮放，雙擊回到自動鏡頭' : 'Press a move (or Space). Tab changes who. Drag to look around, wheel to zoom, double-click for the auto camera';
  $('slow').classList.toggle('on', S.slow);
}
document.addEventListener('click', (e) => { const b = e.target.closest('[data-move]'); if (b) start(b.dataset.move); const c = e.target.closest('[data-cast]'); if (c && c.dataset.cast !== CH.id) cast(c.dataset.cast); });
$('slow').onclick = () => { S.slow = !S.slow; texts(); };
$('reset').onclick = () => { targets.build(); fx.reset(); };
$('auto').onclick = giveBack;
$('lang').onclick = () => { lang = lang === 'zh' ? 'en' : 'zh'; texts(); };
addEventListener('keydown', (e) => { if (e.code === 'Space') { e.preventDefault(); start(CH.moves[0]); } const n = /^Digit([1-9])$/.exec(e.code); if (n && CH.moves[n[1] - 1]) start(CH.moves[n[1] - 1]); if (e.code === 'Tab') { e.preventDefault(); const ids = Object.keys(CAST); cast(ids[(ids.indexOf(CH.id) + 1) % ids.length]); } if (e.code === 'KeyS') $('slow').click(); if (e.code === 'KeyR') $('reset').click(); if (e.code === 'KeyC') (free.on ? giveBack() : takeCam()); });

let last = performance.now();
function loop(now) { const dt = Math.min(0.05, (now - last) / 1000); last = now; step(dt); placeCamera(); comp.render(); requestAnimationFrame(loop); }
cast(q.get('who') || (() => { try { return localStorage.getItem('wulin.cast'); } catch (e) { return null; } })() || 'yirui');
resize(); texts(); giveBack(); requestAnimationFrame(loop);
window.APP = {
  get hero() { return hero; }, cast, CAST, MOVES, start, free, takeCam, giveBack, camera, S,
  // run the move from its start to a moment, at a steady 60 frames a second, and draw it (for tests and pictures)
  sim(t, id = CH.moves[0]) { const sl = S.slow; S.slow = false; start(id); let n = 0; while (S.move && S.t < t && n++ < 2000) step(1 / 60); placeCamera(); comp.render(); S.slow = sl; return S.t; },
  render() { placeCamera(); comp.render(); },
};
window.DONE = true;
