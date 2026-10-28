// The film player: an episode (js/films/<ep>.js) played out by the cast on the engine, scene by scene. Each scene
// is on a set at an hour of the day and places whoever is in it; its cues make them walk, turn, gesture, perform their
// moves and take their blows; its lines are spoken in the characters' own recorded voices (audio/<ep>.json, made by
// tools/voices.py), the mouth following the voice, with subtitles; its shots frame the camera on the actors where
// they are. A cue can raise a character's entrance card (name, title, four-line poem, the world slowed), call out a
// move's name, or slow the world for a strike. Seeking replays from the start of the scene, silently.
//   film.html?ep=ep1&t=120&lang=en; window.FILM for tests.
import * as THREE from '../lib/three.module.min.js';
import { createWorld, orbit, V } from './engine.js';
import { wake, mute, SFX, audio } from './sound.js';
import { CAST } from './cast/index.js';
import { SETS } from './sets.js';
import { propShelf } from './props.js';
import { EP1 } from './films/ep1.js';
import { PROTO } from './films/proto.js';

const EPS = { ep1: EP1, proto: PROTO };
const $ = (id) => document.getElementById(id), q = new URLSearchParams(location.search);
let lang = q.get('lang') === 'en' ? 'en' : 'zh';
const EP = EPS[q.get('ep')] || EP1;
const cv = $('cv'), W = createWorld(cv, { targets: false, dof: true }), O = orbit(cv, () => { $('cam').hidden = false; });
const props = propShelf(W.scene);
const S = { t: 0, playing: false, cue: 0, A: {}, shot: -1, cam: null, scene: -1, sim: false, voice: null, buffers: {}, heard: new Set(), src: null, intro: null, callout: null, slowmo: null, title: null, caption: null };
const scenes = EP.scenes;
const origin = () => SETS[scenes[Math.max(0, S.scene)]?.set || 'road'];
// the same chances every time a scene is played, so that seeking to a moment shows what playing to it would
const seeded = (s) => () => { s = (s + 0x6d2b79f5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };

// ---------------------------------------------------------------- what the cues can do
const F = {
  hold(name) { const f = S.A[name]; if (f?.react) f.react.hold = true; },
  release(name) { S.A[name]?.release(); },
  X: (x) => origin().x + x, Z: (z) => origin().z + z, P: (x, z) => V(origin().x + x, 0, origin().z + z),
  walk(name, x, z, o = {}) { const f = S.A[name]; f.show(true); f.walkTo(origin().x + x, origin().z + z, o); },
  face(name, what, now) { const f = S.A[name], p = typeof what === 'string' ? (S.A[what]?.pos || props.items[what]?.G.position) : V(origin().x + what[0], 0, origin().z + what[1]); if (p) f.faceTo(p, now); },
  intro(name, o = {}) { S.intro = { who: name, t0: S.t, dur: o.dur ?? 6.5, poem: o.poem !== false }; },
  callout(text, o = {}) { S.callout = { text, t0: S.t, dur: o.dur ?? 1.8 }; if (!S.sim) SFX.gong?.(0.5); },
  slow(k = 0.3, dur = 1.2) { S.slowmo = { k, t0: S.t, dur }; },
  title(dur = 6) { S.title = { t0: S.t, dur }; },
  sfx(name, ...a) { SFX[name]?.(...a); },
  put: (name, kind, pos, rot) => props.put(name, kind, pos, rot),
  give: (name, who, side, off) => props.hold(name, S.A[who], side, off),
  hide: (name) => props.hide(name),
  prop: (name) => props.items[name],
};

// ---------------------------------------------------------------- the cast and the scenes
function build() {
  W.clear(); props.clear(); S.A = {}; W.clock = 0; W.freeze = 0;
  for (const [name, [id, o = {}]] of Object.entries(EP.cast)) { const f = W.add(id, { ...o, x: 0, z: -999, yaw: 0 }); f.name = name; f.voice = !!EP.voiced; f.show(false); S.A[name] = f; }
}
function enterScene(i) {
  S.scene = i; const sc = scenes[i], O0 = SETS[sc.set]; Math.random = seeded(1000 + i * 77);
  W.stage.time(sc.tod || 'day'); W.stage.focus(O0.x + (sc.focus?.[0] ?? 0), O0.z + (sc.focus?.[1] ?? 2));
  props.clear(); W.fx.reset();
  for (const [name, f] of Object.entries(S.A)) {
    const pl = sc.place?.[name];
    f.move = null; f.react = null; f.walk = null; f.gesture = null; f.push.set(0, 0, 0); f.mood = null; f.still = false; f.stayDown = false; f.yawTo = null; f.attend = null; f.lookLock = false; f.feel = null; f.act = null; if (f.hero.loose) f.hero.loose = null;
    if (!pl) { f.show(false); f.mark.x = O0.x; f.mark.z = O0.z - 999; continue; }
    f.show(pl.show !== false); f.mark.x = O0.x + pl.x; f.mark.z = O0.z + pl.z; f.mark.y = pl.y || 0; f.mark.yaw = pl.yaw ?? 0;
    if (pl.gest) f.gest(pl.gest, { hold: true });
  }
  for (const [name, pl] of Object.entries(sc.place || {})) if (pl.faceTo) F.face(name, pl.faceTo, true);
  S.lastSpeaker = null; S.lastLine = -1;
  sc.setup?.(S.A, F);
  S.caption = sc.caption ? { text: sc.caption, t0: sc.t } : null;
  if (!S.sim && S.playing) SFX.ambience(sc.ambience || null);
  S.cam = null;
}
const sceneAt = (t) => { let i = 0; while (i < scenes.length - 1 && scenes[i + 1].t <= t) i++; return i; };

// ---------------------------------------------------------------- the lines: who speaks, for how long, how loud
const durOf = (i) => S.voice?.lines?.[i]?.dur ?? Math.max(1.2, EP.lines[i][2].length * 0.24);
const lineAt = (t) => { for (let i = EP.lines.length - 1; i >= 0; i--) { const L = EP.lines[i]; if (t >= L[0] && t < L[0] + durOf(i) + 0.35) return i; if (L[0] < t - 30) break; } return -1; };
async function loadVoices() {
  if (!EP.voiced) { S.voice = null; return; }
  try { S.voice = await (await fetch(`audio/${EP.id}.json?v=${EP.audioV || 1}`)).json(); } catch (e) { S.voice = null; }
}
async function buffer(i) {
  const v = S.voice?.lines?.[i]; if (!v) return null; if (S.buffers[i]) return S.buffers[i];
  const { ac } = audio(); if (!ac) return null; const ab = await (await fetch(`audio/${v.file}`)).arrayBuffer(); S.buffers[i] = await ac.decodeAudioData(ab); return S.buffers[i];
}
function speak(i, offset) { // play a line's recording from where the film is in it
  buffer(i).then((b) => { if (!b || !S.playing) return; const { ac, out } = audio(); const s = ac.createBufferSource(); s.buffer = b; s.connect(out); s.start(0, Math.max(0, offset)); S.src = s; });
}

// who looks at whom while a line is spoken: those near the speaker turn to him; he turns to whoever he answers (the
// last to speak to him), or the nearest; a cue can fix someone's gaze (F.look); a shout or a cry makes the others start
function attention(li) {
  const L = EP.lines[li], spk = S.A[L[1]]; if (!spk || spk.hidden) return;
  const near = Object.values(S.A).filter((f) => f !== spk && !f.hidden && f.pos.distanceTo(spk.pos) < 9);
  if (S.lastLine !== li) {
    S.lastLine = li;
    if (['shout', 'surprised', 'scared', 'angry'].includes(L[4])) for (const f of near) if (f.pos.distanceTo(spk.pos) < 5 && f.act) f.act.startle = 1;
    const prev = S.lastSpeaker && S.lastSpeaker !== spk && !S.lastSpeaker.hidden ? S.lastSpeaker : null;
    spk.addressee = prev && prev.pos.distanceTo(spk.pos) < 9 ? prev : near.sort((a, b) => a.pos.distanceTo(spk.pos) - b.pos.distanceTo(spk.pos))[0] || null;
    S.lastSpeaker = spk;
  }
  for (const f of near) if (!f.lookLock) f.attend = spk;
  if (!spk.lookLock) spk.attend = spk.addressee;
}
F.look = (name, what) => { const f = S.A[name]; if (!f) return; if (what == null) { f.lookLock = false; f.attend = null; return; } f.lookLock = true; f.attend = typeof what === 'string' ? S.A[what] : V(origin().x + what[0], 1, origin().z + what[1]); };
// ---------------------------------------------------------------- time passing
function advance(dt) {
  S.t += dt;
  const si = sceneAt(S.t); if (si !== S.scene) enterScene(si);
  while (S.cue < EP.cues.length && EP.cues[S.cue][0] <= S.t) { const [ct, fn] = EP.cues[S.cue]; if (ct >= scenes[S.scene].t) fn(S.A, F); S.cue++; }
  const li = lineAt(S.t);
  for (const f of Object.values(S.A)) { f.talk = 0; if (f.feelUntil && S.t > f.feelUntil) { f.feel = null; f.feelUntil = 0; } }
  if (li >= 0) attention(li);
  if (li >= 0) { const L = EP.lines[li], f = S.A[L[1]], v = S.voice?.lines?.[li], k = S.t - L[0];
    if (f) { f.feel = L[4] || 'calm'; f.feelUntil = L[0] + durOf(li) + 1.5; }
    if (f) f.talk = v?.env ? (v.env[Math.floor(k * 30)] ?? 0) / 100 : (k < durOf(li) ? 1 : 0);
    if (!S.sim && S.playing && !S.heard.has(li) && k < durOf(li)) { S.heard.add(li); if (S.voice) speak(li, k); else SFX.talk(f?.CH.spec.age === 'kid'); }
  }
  // the world, slowed while a card is up or a strike is shown slowly
  let slow = 1;
  if (S.slowmo) { const u = (S.t - S.slowmo.t0) / S.slowmo.dur; if (u >= 0 && u <= 1) slow = Math.min(slow, S.slowmo.k + (1 - S.slowmo.k) * Math.max(0, 1 - Math.min(u, 1 - u) / 0.12)); }
  if (S.intro) { const u = S.t - S.intro.t0; if (u >= 0 && u < S.intro.dur) slow = Math.min(slow, 0.35); }
  W.slow = slow; W.step(dt); props.update(S.t);
}
function seek(t) {
  t = Math.max(0, Math.min(EP.len, t)); mute(true); S.sim = true; S.src?.stop?.(); S.heard.clear();
  build(); const si = sceneAt(t); S.scene = -1; S.t = scenes[si].t; enterScene(si);
  S.cue = 0; while (S.cue < EP.cues.length && EP.cues[S.cue][0] < S.t) S.cue++;
  S.intro = S.callout = S.slowmo = S.title = null;
  const n = Math.round((t - S.t) * 60); for (let i = 0; i < n; i++) advance(1 / 60);
  for (let i = 0; i < EP.lines.length; i++) if (EP.lines[i][0] < t - 0.05) S.heard.add(i);
  S.sim = false; mute(false); S.cam = null;
}

// ---------------------------------------------------------------- the shots, framed on the actors where they are
const head = (f) => f.F.headP.getWorldPosition(V()).add(V(0, 0.15 * f.F.height / 1.5, 0));
const facing = (f) => V(Math.sin(f.mark.yaw), 0, Math.cos(f.mark.yaw));
const faceDir = (f) => { const q = f.F.headP.getWorldQuaternion(new THREE.Quaternion()), d = V(0, 0, 1).applyQuaternion(q).setY(0); return d.lengthSq() > 1e-4 ? d.normalize() : facing(f); }; // where his face is turned
const rot = (v, a) => v.clone().applyAxisAngle(V(0, 1, 0), a);
const local = (a) => V(origin().x + a[0], a[1], origin().z + a[2]);
const lens = (fov) => Math.tan(17 * Math.PI / 180) / Math.tan(fov / 2 * Math.PI / 180); // how much further back a longer lens stands, for the same framing
// set the subject off-centre, with room on the side he looks toward
function compose(c, subj, dir, k = 0.28) {
  const fwd = c.look.clone().sub(c.pos).normalize(), right = V().crossVectors(fwd, V(0, 1, 0)).normalize(), half = c.look.distanceTo(c.pos) * Math.tan((c.fov / 2) * Math.PI / 180) * (W.camera.aspect || 1.78);
  const side = Math.sign(dir.dot(right)) || 1; c.look.addScaledVector(right, side * k * half * 0.5); return c;
}
function frameShot(s, t0) {
  const A = S.A, dt = S.t - t0;
  if (s.kind === 'at') { const look = s.follow ? head(A[s.follow]) : local(s.look); return { pos: local(s.pos).add(V(...(s.drift || [0, 0, 0])).multiplyScalar(dt)), look, fov: s.fov || 42 }; }
  if (s.kind === 'move') { const f = A[s.on]; if (f.move) return W.moveCam(f); return frameShot({ kind: 'close', on: s.on, side: 1, dist: 2.0 }, t0); }
  if (s.kind === 'close' && A[s.on].react?.kind === 'down' && A[s.on].react.t > 0.6) { const f = A[s.on], h = head(f), side = rot(facing(f), (s.side || 1) * 1.2); return { pos: h.clone().add(V(0, 1.25, 0)).addScaledVector(side, 0.8), look: h.clone(), fov: 30, subject: h }; }
  if (s.kind === 'close') {
    const f = A[s.on], h = head(f), fw = faceDir(f), fov = s.fov || 25, push = s.push ?? 0.015, d = ((s.dist || 1.7) * f.F.height / 1.5 + 0.4) * lens(fov) * (1 - Math.min(0.3, dt * push));
    const pos = h.clone().addScaledVector(rot(fw, (s.side || 1) * (s.angle ?? 0.5)), d).add(V(0, s.low ? 0.5 : s.up ?? 0.06 * lens(fov), 0));
    return compose({ pos, look: h.clone().add(V(0, -0.1 - (s.down || 0), 0)), fov, subject: h }, f, fw);
  }
  if (s.kind === 'over' || s.kind === 'talk') {
    // over the shoulder of whoever listens, onto whoever speaks; a talk shot follows the lines between the people in it
    let spk = A[s.to], lis = A[s.from];
    if (s.kind === 'talk') {
      const li = lineAt(S.t), who = li >= 0 ? EP.lines[li][1] : null;
      if (who && s.on.includes(who)) S.talkLast = who; const sp = s.on.includes(S.talkLast) ? S.talkLast : s.on[0];
      spk = A[sp]; const ad = spk.addressee && s.on.includes(spk.addressee.name) ? spk.addressee.name : s.on.find((n) => n !== sp); lis = A[ad];
    }
    const a = head(lis), b = head(spk), ax = a.clone().sub(b).setY(0).normalize(), fov = s.fov || 30, k = lens(fov) * 0.85;
    // keep to one side of the line between the two (the 180° rule)
    const base = head(A[(s.on || [s.from, s.to])[1]]).sub(head(A[(s.on || [s.from, s.to])[0]])).setY(0).normalize(), P0 = V(base.z, 0, -base.x).multiplyScalar(s.side || 1);
    let perp = V(ax.z, 0, -ax.x); if (perp.dot(P0) < 0) perp.multiplyScalar(-1);
    const pos = a.clone().addScaledVector(ax, (s.dist || 1.0) * k).addScaledVector(perp, 0.42 * k).add(V(0, 0.08, 0));
    return compose({ pos, look: b.clone().add(V(0, -0.1, 0)), fov, subject: b, key: spk.name }, spk, faceDir(spk), 0.22);
  }
  if (s.kind === 'prop') { const it = props.items[s.on], p = it?.G.position.clone() || V(); if (it?.held) { const f = it.held.f, fw = facing(f), sd = V(fw.z, 0, -fw.x); return { pos: p.clone().addScaledVector(fw, s.above ? 0.5 : 0.75).addScaledVector(sd, 0.25).add(V(0, s.above ? 0.55 : 0.12, 0)), look: p.clone().add(V(0, 0.03, 0)), fov: s.fov || 32, subject: p }; } return { pos: p.clone().add(V(...(s.off || [0.35, 0.25, 0.45]))), look: p, fov: s.fov || 30, subject: p }; }
  const ids = s.on, hs = ids.map((n) => head(A[n])), c = hs.reduce((m, v) => m.add(v), V()).divideScalar(hs.length);
  const ax = hs[1].clone().sub(hs[0]).setY(0); if (ax.lengthSq() < 1e-4) ax.set(1, 0, 0); ax.normalize(); const perp = V(ax.z, 0, -ax.x).multiplyScalar(s.side || 1);
  const span = Math.max(...hs.map((h) => h.distanceTo(c))) * 2, fov = s.fov || (s.kind === 'two' ? 30 : 36), d = (s.dist || span * 1.1 + 1.8) * (s.kind === 'two' ? lens(fov) * 0.9 : lens(fov) * 0.85);
  return { pos: c.clone().addScaledVector(perp, d).add(V(0, s.high ? 2.4 : s.kind === 'two' ? 0.35 : 0.9, 0)).add(V(...(s.drift || [0, 0, 0])).multiplyScalar(dt)), look: c.clone().add(V(0, -0.25, 0)), fov, subject: c };
}
// a hand-held breath on every shot
function handheld(c) { const t = S.t, d = c.pos.distanceTo(c.look); c.pos.add(V(Math.sin(t * 0.9) * 0.6 + Math.sin(t * 2.3) * 0.3, Math.sin(t * 1.3 + 1) * 0.5, Math.sin(t * 0.7 + 2) * 0.4).multiplyScalar(0.006 * d)); c.look.add(V(Math.sin(t * 1.1 + 3), Math.sin(t * 0.8 + 4) * 0.6, 0).multiplyScalar(0.003 * d)); return c; }
// anyone standing between the lens and the face it is on is left out of this frame
function clearFaces(c) {
  const out = [], seg = c.look.clone().sub(c.pos), L = seg.length(); seg.normalize();
  for (const f of Object.values(S.A)) {
    if (f.hidden || !f.F.root.visible) continue;
    for (const p of [head(f), f.F.root.position.clone().add(V(0, f.F.height * 0.55, 0))]) {
      const d = p.clone().sub(c.pos), along = d.dot(seg); if (along < 0.15 || along > L - 0.25) continue;
      if (d.addScaledVector(seg, -along).length() < 0.4) { out.push(f); f.F.root.visible = false; if (f.hero.ball) f.hero.ball.visible = false; break; }
    }
  }
  return () => { for (const f of out) { f.F.root.visible = true; if (f.hero.ball) f.hero.ball.visible = true; } };
}
function camera() {
  let i = 0; while (i < EP.shots.length - 1 && EP.shots[i + 1][0] <= S.t) i++;
  const [t0, s] = EP.shots[i], c = frameShot(s, t0), key = i + ':' + (c.key || '');
  if (S.shot !== key || !S.cam) { S.shot = key; S.cam = { pos: c.pos.clone(), look: c.look.clone(), fov: c.fov, subject: c.subject }; }
  else { const k = s.kind === 'move' ? 1 : s.ease ?? 0.1; S.cam.pos.lerp(c.pos, k); S.cam.look.lerp(c.look, k); S.cam.fov += (c.fov - S.cam.fov) * k; S.cam.subject = c.subject; }
  // indoors the lens stays inside the room
  const room = scenes[S.scene]?.room; if (room) { const o = origin(); S.cam.pos.x = Math.max(o.x + room[0], Math.min(o.x + room[1], S.cam.pos.x)); S.cam.pos.z = Math.max(o.z + room[2], Math.min(o.z + room[3], S.cam.pos.z)); S.cam.pos.y = Math.min(room[4] ?? 9, S.cam.pos.y); }
  const out = handheld({ pos: S.cam.pos.clone(), look: S.cam.look.clone(), fov: S.cam.fov });
  W.focus((S.cam.subject || out.look).distanceTo(out.pos), out.fov);
  return out;
}

// ---------------------------------------------------------------- words over the picture
function overlays() {
  const t = S.t, li = lineAt(t), sub = $('sub');
  if (li >= 0) { const L = EP.lines[li], who = S.A[L[1]], html = `<b style="color:${who.CH.spec.colors.top}">${who.CH.name[lang]}</b>${lang === 'zh' ? L[2] : L[3]}`; if (sub.dataset.h !== html) { sub.innerHTML = html; sub.dataset.h = html; } sub.style.opacity = 1; } else sub.style.opacity = 0;
  // a character's entrance: the name in great characters, the title, the poem line by line
  const it = $('intro'); if (S.intro && t - S.intro.t0 < S.intro.dur && t >= S.intro.t0) {
    const u = t - S.intro.t0, C = S.A[S.intro.who].CH, k = Math.min(1, u / 0.5, (S.intro.dur - u) / 0.6), key = S.intro.who + lang + S.intro.poem;
    if (it.dataset.k !== key) { it.dataset.k = key; it.innerHTML = `<div class="ititle">${C.title[lang]}</div><div class="iname">${C.name[lang]}</div><div class="ipoem">${S.intro.poem && C.poem ? C.poem[lang].map((l) => `<span>${l}</span>`).join('') : ''}</div>`; it.className = lang; }
    it.style.opacity = k; [...it.querySelectorAll('.ipoem span')].forEach((s, i) => { s.style.opacity = Math.max(0, Math.min(1, (u - 1.0 - i * 0.9) / 0.5)); });
  } else it.style.opacity = 0;
  const co = $('callout'); if (S.callout && t >= S.callout.t0 && t - S.callout.t0 < S.callout.dur) { const u = t - S.callout.t0; co.textContent = S.callout.text[lang] ?? S.callout.text; co.style.opacity = Math.min(1, u / 0.12, (S.callout.dur - u) / 0.4); co.style.transform = `translate(-50%, -50%) scale(${1.25 - Math.min(0.25, u * 1.2)})`; } else co.style.opacity = 0;
  const cap = $('caption'); if (S.caption && t - S.caption.t0 < 4.5 && t >= S.caption.t0) { cap.textContent = S.caption.text[lang]; cap.style.opacity = Math.max(0, Math.min(1, (t - S.caption.t0 - 0.4) / 0.6, (4.5 - (t - S.caption.t0)) / 0.6)); } else cap.style.opacity = 0;
  const ti = $('title'); if (S.title && t >= S.title.t0 && t - S.title.t0 < S.title.dur) { const u = t - S.title.t0; ti.innerHTML = `<small>${EP.title[lang][0]}</small>${EP.title[lang][1]}`; ti.style.opacity = Math.min(1, u / 0.8, (S.title.dur - u) / 0.8); } else ti.style.opacity = 0;
  const ek = Math.max(0, Math.min(1, (t - (EP.len - 5)) * 1.2)); $('end').style.opacity = ek; $('end').textContent = EP.end[lang];
  // fades: into the film, out of it, and between scenes
  let fade = Math.max(0, 1 - t / 0.8, (t - (EP.len - 1.2)) / 1.2);
  for (const sc of scenes) { if (sc.t <= 0 || sc.cut) continue; const d = t - sc.t; if (d > -0.5 && d < 0.6) fade = Math.max(fade, d < 0 ? (d + 0.5) / 0.5 : 1 - d / 0.6); }
  if (S.title && t >= S.title.t0 && t - S.title.t0 < S.title.dur) fade = Math.max(fade, Math.min(0.85, (t - S.title.t0) / 0.5, (S.title.t0 + S.title.dur - t) / 0.5));
  $('fade').style.opacity = Math.min(1, fade);
  $('scrub').value = t / EP.len; $('time').textContent = `${fmt(t)} / ${fmt(EP.len)}`;
}
const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

// ---------------------------------------------------------------- playing
function play() { wake(); if (S.t >= EP.len - 0.05) seek(0); S.playing = true; $('pp').textContent = '❚❚'; $('start').hidden = true; SFX.ambience(scenes[S.scene]?.ambience || null); const li = lineAt(S.t); if (li >= 0) S.heard.delete(li); }
function pause() { S.playing = false; $('pp').textContent = '▶'; S.src?.stop?.(); SFX.ambience(null); for (let i = 0; i < EP.lines.length; i++) if (EP.lines[i][0] < S.t) S.heard.add(i); }
$('go').onclick = play;
$('pp').onclick = () => (S.playing ? pause() : play());
$('scrub').onchange = (e) => { const was = S.playing; seek(+e.target.value * EP.len); if (was) { const li = lineAt(S.t); if (li >= 0) S.heard.delete(li); SFX.ambience(scenes[S.scene]?.ambience || null); } };
$('lang').onclick = () => { lang = lang === 'zh' ? 'en' : 'zh'; texts(); };
$('cam').onclick = () => { O.on = false; $('cam').hidden = true; };
cv.addEventListener('dblclick', () => $('cam').click());
addEventListener('keydown', (e) => { if (e.code === 'Space') { e.preventDefault(); $('pp').click(); } if (e.code === 'ArrowRight') { seek(Math.min(EP.len, S.t + 10)); } if (e.code === 'ArrowLeft') { seek(Math.max(0, S.t - 10)); } });
function texts() {
  document.documentElement.lang = lang === 'zh' ? 'zh-Hant' : 'en';
  $('st').innerHTML = `<small>${EP.title[lang][0]}</small>${EP.title[lang][1]}`; $('go').textContent = lang === 'zh' ? '▶ 開演' : '▶ Play';
  $('lang').textContent = lang === 'zh' ? 'EN' : '中'; $('cam').textContent = lang === 'zh' ? '🎬 回到導演鏡頭' : '🎬 Director’s camera'; $('back').textContent = lang === 'zh' ? '← 角色與招式' : '← Characters & moves';
  $('blurb').textContent = (EP.blurb || {})[lang] || ''; document.title = `${EP.title.zh[0]} ${EP.title.zh[1]}`;
  $('intro').dataset.k = '';
}
let last = performance.now();
function loop(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  if (S.playing) { advance(dt); if (S.t >= EP.len) { S.t = EP.len; pause(); $('start').hidden = false; } }
  const c = camera(); O.update(W.camera, c.look); const cc = O.on ? O.cam() : c; W.place(cc); const back = clearFaces(cc); W.render(); back(); overlays();
  requestAnimationFrame(loop);
}
W.resize(); addEventListener('resize', () => W.resize());
texts(); seek(+(q.get('t') || 0)); requestAnimationFrame(loop);
loadVoices().then(() => { S.voiceReady = true; if (S.voice) seek(S.t); });
window.FILM = { W, S, EP, F, seek, play, pause, frame(t) { seek(t); const c = camera(); W.place(c); const back = clearFaces(c); W.render(); back(); overlays(); }, cast: CAST };
window.DONE = true;
