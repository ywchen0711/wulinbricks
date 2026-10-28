// The engine everything here runs on: the practice ground, the duel, the films. A world of fighters: each a
// character from the cast with a place and a facing (its mark), who can stand at rest, walk to a point, make a
// gesture, perform a move, and take a blow (js/react.js); their moves' effects, the targets, the camera.
//   const W = createWorld(canvas); const a = W.add('yirui', { x, z, yaw }); a.perform('yidao'); W.step(dt); W.render();
import * as THREE from '../lib/three.module.min.js';
import { EffectComposer } from '../lib/addons/EffectComposer.js';
import { RenderPass } from '../lib/addons/RenderPass.js';
import { UnrealBloomPass } from '../lib/addons/UnrealBloomPass.js';
import { OutputPass } from '../lib/addons/OutputPass.js';
import { buildStage } from './stage.js';
import { makeTargets } from './targets.js';
import { makeFX } from './fx.js';
import { SFX } from './sound.js';
import { CAST } from './cast/index.js';
import { MOVES } from './moves/index.js';
import { GESTURES } from './gestures.js';
import { reactAt, weightOf } from './react.js';
import { resolve } from './physics.js';

export const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
export const DEF = { armR: -0.2, armL: -0.2, outR: 0, outL: 0, hipR: 0, hipL: 0, tilt: 0, roll: 0, yaw: 0, head: 0, fwd: 0, y: 0, wristR: 0, wristL: 0 };
const ease = { in: (u) => u * u * u, out: (u) => 1 - (1 - u) ** 3, smooth: (u) => u * u * (3 - 2 * u) };
export function poseAt(M, t) {
  const K = M.keys; let i = 0; while (i < K.length - 2 && t >= K[i + 1].t) i++;
  const a = K[i], b = K[i + 1], u = Math.max(0, Math.min(1, (t - a.t) / (b.t - a.t))), e = (ease[b.ease] || ease.smooth)(u), p = {};
  for (const k of Object.keys(DEF)) p[k] = (a.p[k] ?? DEF[k]) + ((b.p[k] ?? DEF[k]) - (a.p[k] ?? DEF[k])) * e;
  return p;
}
const curve = (pts, t) => { let i = 0; while (i < pts.length - 2 && t >= pts[i + 1][0]) i++; const [t0, a] = pts[i], [t1, b] = pts[i + 1]; const u = Math.max(0, Math.min(1, (t - t0) / (t1 - t0))); return a + (b - a) * ease.smooth(u); };
const within = (r, t) => t >= r[0] && t <= r[1];
const angWrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));

export function createWorld(canvas, { targets: withTargets = true } = {}) {
  const R = new THREE.WebGLRenderer({ canvas, antialias: true });
  R.shadowMap.enabled = true; R.shadowMap.type = THREE.PCFSoftShadowMap; R.toneMapping = THREE.ACESFilmicToneMapping; R.toneMappingExposure = 1.05; R.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(40, 16 / 9, 0.05, 200);
  const comp = new EffectComposer(R); comp.addPass(new RenderPass(scene, camera)); comp.addPass(new UnrealBloomPass(new THREE.Vector2(512, 512), 0.55, 0.45, 0.92)); comp.addPass(new OutputPass());
  const stage = buildStage(scene);
  { const pm = new THREE.PMREMGenerator(R), es = new THREE.Scene(); es.add(stage.sky.clone()); scene.environment = pm.fromScene(es, 0.04).texture; scene.environmentIntensity = 0.55; }
  const targets = makeTargets(scene), fx = makeFX(scene);
  targets.show(withTargets);
  for (const M of Object.values(MOVES)) M.init?.(scene);
  const W = { R, scene, camera, comp, stage, targets, fx, sfx: SFX, fighters: [], clock: 0, slow: 1, freeze: 0, useTargets: withTargets, cam: null, proj: [], _clashed: new Set(), note: null };

  // ---------------------------------------------------------------- a fighter
  W.add = (id, mark = {}) => {
    const CH = CAST[id], hero = CH.build(scene), F = hero.F;
    const f = {
      id, CH, hero, F, mark: { x: 0, z: 0, yaw: 0, ...mark }, team: mark.team ?? id + W.fighters.length, move: null, t: 0, fired: [], react: null, gesture: null, walk: null, mood: null, talk: 0, phase: W.fighters.length * 1.7,
      push: V(), lastArm: 0, lastHip: 0, p: { ...DEF },
      get pos() { return F.root.position.clone(); },
      get busy() { return !!(f.move || f.react || f.walk); },
      toWorld(v) { const y = f.mark.yaw, c = Math.cos(y), s = Math.sin(y); return V(f.mark.x + v.x * c + v.z * s, v.y, f.mark.z - v.x * s + v.z * c); },
      toLocal(v) { const y = f.mark.yaw, c = Math.cos(y), s = Math.sin(y), dx = v.x - f.mark.x, dz = v.z - f.mark.z; return V(dx * c - dz * s, v.y, dx * s + dz * c); },
      dirWorld(v) { const y = f.mark.yaw, c = Math.cos(y), s = Math.sin(y); return V(v.x * c + v.z * s, v.y, -v.x * s + v.z * c); },
      faceTo(p, now = false) { const y = Math.atan2(p.x - f.mark.x, p.z - f.mark.z); if (now) f.mark.yaw = y; else f.yawTo = y; },
      // a move, against whoever else is in the world
      perform(mid) { const M = MOVES[mid]; if (!M || f.react?.hold) return false; f.react = null; f.walk = null; f.gesture = null; for (const g of W.fighters) if (g !== f && g.move === M) return false; M.reset?.(); f.move = M; f.t = 0; f.fired = []; M.start?.(ctx(f, 0)); return true; },
      // a blow: { power 0..1 (or kind), dir (world), at (world point), hold: stay down until released }
      hit(h) {
        const kind = h.kind || weightOf(h.power ?? 0.5); if (f.move) { f.move.reset?.(); f.move = null; } f.walk = null; f.gesture = null;
        f.react = { kind, t: 0, dir: (h.dir || f.dirWorld(V(0, 0, -1))).clone().setY(0).normalize(), hold: !!h.hold, from: f.push.clone() };
        const at = h.at || f.pos.add(V(0, 0.8, 0)); fx.hitSparks(at, f.react.dir, h.fx); fx.ringAt(at, kind === 'down' ? 1 : 0.6); fx.S.shake = Math.max(fx.S.shake, kind === 'down' ? 0.35 : 0.22);
        W.freeze = kind === 'light' ? 0.05 : 0.11; SFX.thud(kind === 'down' ? 1 : kind === 'heavy' ? 0.7 : 0.4); SFX.ouch(CH.spec.age === 'kid', kind); flash(f);
      },
      release() { if (f.react) f.react.hold = false; },
      walkTo(x, z, { speed = 1.3, face } = {}) { f.walk = { to: V(x, 0, z), speed, face }; f.move = null; },
      gest(name, { hold = false, len } = {}) { const G = GESTURES[name]; if (G) f.gesture = { G, t: 0, hold, len: len ?? G.len ?? 1.2 }; },
      say(on) { f.talk = on ? 1 : 0; },
      remove() { hero.remove(); W.fighters.splice(W.fighters.indexOf(f), 1); },
    };
    W.fighters.push(f); return f;
  };
  function flash(f) { if (!f._mats) { f._mats = []; f.F.root.traverse((o) => { if (o.material && !Array.isArray(o.material) && o.material.emissive && o.material.emissive.getHex() === 0 && !f._mats.includes(o.material)) f._mats.push(o.material); }); } f._flash = 0.16; }
  const ctx = (f, mdt) => ({ fx, sfx: SFX, targets: W.useTargets ? targets : null, hero: f.hero, scene, p: f.p, t: f.t, dt: mdt, clock: W.clock, rate: W.slow, V, me: f, foes: W.fighters.filter((g) => g !== f && g.team !== f.team && !(g.react?.kind === 'down')), toWorld: f.toWorld, toLocal: f.toLocal, dirWorld: f.dirWorld, world: W, projectile: (o) => W.proj.push(o),
    peek(t) { const p = f.move ? poseAt(f.move, t) : f.CH.idle(W.clock).pose; apply(f, { ...DEF, ...p }, 0); f.F.root.updateMatrixWorld(true); } });
  function apply(f, p, speed) {
    const w = f.toWorld(V(0, 0, p.fwd)).add(f.push);
    f.F.pose({ x: w.x, y: p.y, z: w.z, yaw: f.mark.yaw + p.yaw, tilt: p.tilt, roll: p.roll, hipR: p.hipR, hipL: p.hipL, armR: p.armR, armL: p.armL, outR: p.outR, outL: p.outL, wristR: p.wristR, wristL: p.wristL, head: p.head });
    f.hero.sway(W.clock, speed);
  }

  // ---------------------------------------------------------------- a moment
  W.step = (dtReal) => {
    let dt = dtReal; if (W.freeze > 0) { W.freeze -= dtReal; dt *= 0.12; }
    W.clock += dt;
    let active = null;
    for (const f of W.fighters) {
      const M = f.move; let p, mdt = dt * W.slow, glow = 0, gather = 0, cutting = false, speed = 0, rest = null;
      if (M) {
        const near = M.hitstop != null && Math.abs(f.t - M.hitstop - 0.02) < 0.05; if (near) mdt *= 0.25; f.t += mdt;
        p = poseAt(M, f.t); if (M.glow) glow = curve(M.glow, f.t); if (M.gather && within(M.gather, f.t)) gather = Math.sin(Math.PI * (f.t - M.gather[0]) / (M.gather[1] - M.gather[0])); if (M.trail) cutting = within(M.trail, f.t);
        f.F.face(M.face(f.t)); speed = Math.min(1, (Math.abs(p.armR - f.lastArm) + Math.abs(p.hipR - f.lastHip)) / Math.max(1e-4, mdt) / 12); active = { f, glow, gather, cutting, tint: M.tint };
      } else {
        rest = f.CH.idle(W.clock + f.phase); p = { ...DEF, ...rest.pose }; let face = { ...rest.face };
        if (f.walk) { // walking to a point: legs and arms swinging, turned to where he goes
          const to = f.walk.to, here = V(f.mark.x, 0, f.mark.z), d = to.clone().sub(here), L = d.length(), step = Math.min(L, f.walk.speed * mdt);
          if (L > 0.02) { const want = Math.atan2(d.x, d.z); f.mark.yaw += angWrap(want - f.mark.yaw) * Math.min(1, mdt * 10); f.mark.x += d.x / L * step; f.mark.z += d.z / L * step; f.walkDist = (f.walkDist || 0) + step; }
          const ph = (f.walkDist || 0) / 0.3 * Math.PI, k = Math.min(1, L / 0.15);
          Object.assign(p, { hipR: Math.sin(ph) * 0.55 * k, hipL: -Math.sin(ph) * 0.55 * k, armR: -0.2 - Math.sin(ph) * 0.45 * k, armL: -0.2 + Math.sin(ph) * 0.45 * k, outR: 0.1, outL: 0.1, tilt: 0.05 * k * Math.min(1, f.walk.speed / 2), y: Math.abs(Math.cos(ph)) * 0.02 * k, yaw: 0, head: 0 });
          if (rest.ball) rest.ball = { rest: true };
          f.yawTo = null;
          if (L <= 0.02) { if (f.walk.face != null) f.mark.yaw = f.walk.face; f.walk = null; }
        }
        if (f.yawTo != null) { const dy = angWrap(f.yawTo - f.mark.yaw); f.mark.yaw += dy * Math.min(1, mdt * 7); if (Math.abs(dy) < 0.01) f.yawTo = null; else { const ph = W.clock * 12; p.hipR += Math.sin(ph) * 0.25 * Math.min(1, Math.abs(dy) * 2); p.hipL -= Math.sin(ph) * 0.25 * Math.min(1, Math.abs(dy) * 2); } }
        if ((f.gesture || f.still) && rest.ball) rest.ball = { rest: true };
        if (f.gesture) { const g = f.gesture, k = Math.min(1, g.t / 0.25) * (g.hold ? 1 : Math.min(1, (g.len - g.t) / 0.3)); const gp = typeof g.G.pose === 'function' ? g.G.pose(g.t) : g.G.pose; for (const key in gp) p[key] = p[key] + (gp[key] - p[key]) * Math.max(0, k); if (g.G.face) face = g.G.face; g.t += mdt; if (!g.hold && g.t >= g.len) f.gesture = null; }
        if (f.mood) face = { ...face, ...f.mood };
        if (f.talk) face.mouth = { ...(face.mouth || {}), open: Math.max(0, Math.sin(W.clock * 17) * 0.5 + Math.sin(W.clock * 11) * 0.3) };
        f.F.face(face);
      }
      // a blow taken, over everything
      if (f.react) {
        const r = f.react; let tt = r.t; if (r.hold && r.kind === 'down') tt = Math.min(tt, 1.6);
        const o = reactAt(r.kind, tt); for (const k in o.d) p[k] = (p[k] ?? 0) + o.d[k]; f.push.copy(r.from).multiplyScalar(1 - Math.min(1, tt / 0.3)).addScaledVector(r.dir, o.push); f.F.face(o.face);
        r.t += dt; if (o.done && !r.hold) { f.react = null; f.push.set(0, 0, 0); }
      }
      f.p = p; apply(f, p, speed); f.hero.setGlow?.(glow); f.F.root.updateMatrixWorld(true);
      if (f._flash > 0) { f._flash -= dtReal; const k = Math.max(0, f._flash / 0.16); for (const m of f._mats) { m.emissive.setRGB(1, 0.95, 0.9); m.emissiveIntensity = k * 0.9; } }
      const c = ctx(f, mdt);
      if (M) { M.events?.forEach((e, i) => { if (!f.fired[i] && f.t >= e.t) { f.fired[i] = true; e.run(c); } }); M.tick?.(c); if (f.t >= M.len) f.move = null; }
      else if (!f.react) f.CH.idleTick?.(c, rest);
      f.lastArm = p.armR; f.lastHip = p.hipR; f._mdt = mdt;
    }
    // loose things under their own physics, then whatever has met
    for (const f of W.fighters) f.hero.physics?.(dt * W.slow, W, f);
    W._dt = dt * W.slow; resolve(W, W.proj); W.proj = [];
    const A = active || { f: W.fighters[0] };
    const h = A.f?.hero, feet = A.f ? A.f.pos.setY(0) : V(), tip = h?.tip ? h.tip.getWorldPosition(V()) : feet.clone().setY(0.5), base = h?.base ? h.base.getWorldPosition(V()) : tip;
    fx.update(A.f?._mdt ?? dt, W.clock, { tip, base, glow: A.glow || 0, gather: A.gather || 0, cutting: !!A.cutting, feet, tint: A.tint });
    targets.update(dt * W.slow);
    return active;
  };

  // ---------------------------------------------------------------- the camera
  // a move's own camera, in the mover's frame
  W.moveCam = (f) => { const M = f.move, K = M.cam, t = f.t; let i = 0; while (i < K.length - 2 && t >= K[i + 1].t) i++; const a = K[i], b = K[i + 1], u = ease.smooth(Math.max(0, Math.min(1, (t - a.t) / (b.t - a.t)))); return { pos: f.toWorld(V(...a.pos).lerp(V(...b.pos), u)), look: f.toWorld(V(...a.look).lerp(V(...b.look), u)), fov: a.fov + (b.fov - a.fov) * u }; };
  W.place = (c) => { const sh = fx.S.shake * 0.12; camera.position.copy(c.pos).add(V((Math.random() - 0.5) * sh, (Math.random() - 0.5) * sh, 0)); camera.lookAt(c.look); camera.fov = c.fov || 40; camera.updateProjectionMatrix(); };
  W.render = () => comp.render();
  W.resize = (w = innerWidth, h = innerHeight) => { const d = Math.min(2, devicePixelRatio || 1); R.setPixelRatio(d); R.setSize(w, h, false); comp.setPixelRatio(d); comp.setSize(w, h); camera.aspect = w / h; camera.updateProjectionMatrix(); };
  W.clear = () => { while (W.fighters.length) W.fighters[0].remove(); fx.reset(); W._clashed.clear(); W.proj = []; for (const M of Object.values(MOVES)) M.reset?.(); };
  return W;
}

// a free camera the viewer drags round a point; give it a canvas
export function orbit(canvas, onTake) {
  const o = { on: false, yaw: 0, pitch: 0.2, dist: 4, target: V(0, 0.9, 1.5), ptrs: new Map(), pinch: 0 };
  o.take = (camera, look) => { if (o.on) return; const off = camera.position.clone().sub(look); o.target = look.clone(); o.dist = off.length(); o.yaw = Math.atan2(off.x, off.z); o.pitch = Math.asin(Math.max(-0.99, Math.min(0.99, off.y / o.dist))); o.on = true; onTake?.(); };
  o.cam = () => { const cp = Math.cos(o.pitch), pos = o.target.clone().add(V(Math.sin(o.yaw) * cp, Math.sin(o.pitch), Math.cos(o.yaw) * cp).multiplyScalar(o.dist)); pos.y = Math.max(0.12, pos.y); return { pos, look: o.target.clone(), fov: 42 }; };
  canvas.addEventListener('pointerdown', (e) => { o.ptrs.set(e.pointerId, [e.clientX, e.clientY]); canvas.setPointerCapture(e.pointerId); o.wantTake = true; if (o.ptrs.size === 2) { const [a, b] = [...o.ptrs.values()]; o.pinch = Math.hypot(a[0] - b[0], a[1] - b[1]); } });
  canvas.addEventListener('pointermove', (e) => { const p = o.ptrs.get(e.pointerId); if (!p || !o.on) return; const dx = e.clientX - p[0], dy = e.clientY - p[1]; o.ptrs.set(e.pointerId, [e.clientX, e.clientY]);
    if (o.ptrs.size === 1) { o.yaw -= dx * 0.008; o.pitch = Math.max(-0.05, Math.min(1.4, o.pitch + dy * 0.006)); } else if (o.ptrs.size === 2) { const [a, b] = [...o.ptrs.values()], d = Math.hypot(a[0] - b[0], a[1] - b[1]); if (o.pinch) o.dist = Math.max(0.8, Math.min(30, o.dist * o.pinch / d)); o.pinch = d; } });
  const up = (e) => { o.ptrs.delete(e.pointerId); o.pinch = 0; }; canvas.addEventListener('pointerup', up); canvas.addEventListener('pointercancel', up);
  canvas.addEventListener('wheel', (e) => { e.preventDefault(); o.wantTake = true; o.wheel = (o.wheel || 0) + e.deltaY; }, { passive: false });
  o.update = (camera, look) => { if (o.wantTake) { o.take(camera, look); o.wantTake = false; } if (o.wheel) { o.dist = Math.max(0.8, Math.min(30, o.dist * Math.exp(o.wheel * 0.0012))); o.wheel = 0; } };
  return o;
}
