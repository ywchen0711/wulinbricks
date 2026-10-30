// 體感 Motion: the front camera (an iPad's, a laptop's) watches the player, a pose model (MediaPipe Pose Landmarker,
// run on the device: nothing is sent anywhere) finds 33 points of their body, and this turns them into a minifig's
// pose, as in a mirror: arms swung at the shoulder and out to the side, legs at the hip, the body leaning and turning,
// the head turned, a jump. It also watches for the gesture of each hero's move:
//   chop  (奕叡 一刀啟程): both hands raised over the head, then brought down fast
//   kick  (奕碩 旋風球):   a knee or foot kicked up high
//   push  (冷笑天 笑盡天下): both palms drawn back to the hips, then pushed out in front
//   const M = createMotion({ video, overlay, onStatus }); await M.start(); each frame: M.tick(now); M.st.live, M.take()
const VISION = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14';
const MODEL = 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task';
const I = { nose: 0, earL: 7, earR: 8, shL: 11, shR: 12, elL: 13, elR: 14, wrL: 15, wrR: 16, hipL: 23, hipR: 24, knL: 25, knR: 26, anL: 27, anR: 28 };
const BONES = [[11, 12], [11, 13], [13, 15], [12, 14], [14, 16], [11, 23], [12, 24], [23, 24], [23, 25], [25, 27], [24, 26], [26, 28], [0, 11], [0, 12]];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const sub = (a, b) => [a.x - b.x, a.y - b.y, a.z - b.z], mid = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, z: (a.z + b.z) / 2, visibility: Math.min(a.visibility ?? 1, b.visibility ?? 1) });
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2], len = (a) => Math.hypot(a[0], a[1], a[2]), norm = (a) => { const l = len(a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const seen = (p, v = 0.5) => p && (p.visibility ?? 1) > v;

// a limb as a minifig joint can show it: swung out to the side first, then forward (see makeFig: Rz, then Rx).
// d is the limb's direction in the body's frame [out, up, forward]; returns [out, swing] (swing < 0 is forward)
function limb(d) {
  const out = Math.asin(clamp(d[0], -1, 1)), c = Math.cos(out);
  let swing = Math.atan2(-d[2], -d[1]); if (swing > 1.6) swing -= Math.PI * 2; // straight up is reached forward, never backward
  return [out, swing * clamp((c - 0.15) / 0.3, 0, 1)]; // held out to the side, how far forward means little: let it rest
}

export function createMotion({ video, overlay, onStatus = () => {} }) {
  let lm = null, stream = null, running = false, lastT = -1, base = null;
  const st = { cd: {}, live: null, on: false, people: 0, legs: false, events: [], arm: { chop: 0, push: 0 }, meter: {}, hold: {}, fps: 0, last: 0 };

  async function start() {
    if (running) return;
    if (!navigator.mediaDevices?.getUserMedia) throw new Error('nocam');
    onStatus('camera');
    stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }, audio: false });
    video.srcObject = stream; video.muted = true; video.playsInline = true; await video.play();
    onStatus('model');
    const { FilesetResolver, PoseLandmarker } = await import(`${VISION}/vision_bundle.mjs`);
    const files = await FilesetResolver.forVisionTasks(`${VISION}/wasm`);
    const opts = (delegate) => ({ baseOptions: { modelAssetPath: MODEL, delegate }, runningMode: 'VIDEO', numPoses: 1, minPoseDetectionConfidence: 0.5, minPosePresenceConfidence: 0.5, minTrackingConfidence: 0.5 });
    try { lm = await PoseLandmarker.createFromOptions(files, opts('GPU')); } catch (e) { lm = await PoseLandmarker.createFromOptions(files, opts('CPU')); }
    running = true; st.on = true; onStatus('ready');
  }
  function stop() { running = false; st.on = false; st.live = null; stream?.getTracks().forEach((t) => t.stop()); stream = null; video.srcObject = null; lm?.close?.(); lm = null; clearOverlay(); }

  // once a frame: run the model on the newest camera picture
  function tick(now) {
    if (!running || video.readyState < 2 || video.currentTime === lastT) return;
    lastT = video.currentTime;
    let r; try { r = lm.detectForVideo(video, now); } catch (e) { return; }
    const dt = st.last ? (now - st.last) / 1000 : 1 / 30; st.last = now; st.fps += ((1 / Math.max(1e-3, dt)) - st.fps) * 0.1;
    feed(r.landmarks?.[0], r.worldLandmarks?.[0], dt);
    draw(r.landmarks?.[0]);
  }

  // the points of one person (n: on the picture, 0..1; w: in metres round the hips) → a pose and gestures
  function feed(n, w, dt = 1 / 30) {
    if (!n || !w || !seen(n[I.shL]) || !seen(n[I.shR]) || !seen(n[I.hipL], 0.3) || !seen(n[I.hipR], 0.3)) { st.people = 0; st.live = null; for (const k in st.arm) st.arm[k] = 0; return; }
    st.people = 1;
    // the body's own frame, in metres: left (toward their left shoulder), up, forward (toward the camera)
    const shM = mid(w[I.shL], w[I.shR]), hipM = mid(w[I.hipL], w[I.hipR]);
    const upV = norm([shM.x - hipM.x, -(shM.y - hipM.y), -(shM.z - hipM.z)]); // y and z turned to point up and toward the camera
    const P = (p) => [p.x, -p.y, -p.z]; // a point with up as +y and the camera as +z
    const left = norm(sub2(P(w[I.shL]), P(w[I.shR]))), fwd = norm(cross(left, upV)), upB = norm(cross(fwd, left));
    const inBody = (v) => [dot(v, left), dot(v, upB), dot(v, fwd)];
    const live = {};
    // arms: the player's right arm drives the figure's left (a mirror), and the other way round
    for (const [side, sh, wr, el] of [['R', I.shR, I.wrR, I.elR], ['L', I.shL, I.wrL, I.elL]]) {
      const end = seen(n[wr], 0.4) ? wr : seen(n[el], 0.4) ? el : null; if (end == null) continue;
      const d = inBody(norm(sub2(P(w[end]), P(w[sh]))));
      const outward = side === 'R' ? -d[0] : d[0], [out, swing] = limb([outward, d[1], d[2]]);
      const fig = side === 'R' ? 'L' : 'R';
      live['out' + fig] = clamp(out, -0.2, 1.7) - 0.1; live['arm' + fig] = clamp(swing, -3.3, 1.2);
    }
    // legs, if the camera can see them
    st.legs = seen(n[I.knL], 0.4) && seen(n[I.knR], 0.4);
    if (st.legs) for (const [side, hp, kn, an] of [['R', I.hipR, I.knR, I.anR], ['L', I.hipL, I.knL, I.anL]]) {
      const end = seen(n[an], 0.4) ? an : kn, d = inBody(norm(sub2(P(w[end]), P(w[hp])))), [, swing] = limb([0, d[1], d[2]]);
      live['hip' + (side === 'R' ? 'L' : 'R')] = clamp(swing, -1.9, 1.0);
    }
    // the body: leaning forward and to the side, turned; in the mirror a turn to their left turns him to the screen's left
    live.tilt = clamp(Math.atan2(upV[2], upV[1]), -0.7, 0.7);
    live.roll = clamp(Math.atan2(upV[0], upV[1]), -0.6, 0.6);
    const sl = sub2(P(w[I.shL]), P(w[I.shR])); live.yaw = clamp(Math.atan2(sl[2], sl[0]), -1.2, 1.2);
    // the head: the nose against the ears
    if (seen(n[I.nose]) && seen(n[I.earL], 0.3) && seen(n[I.earR], 0.3)) { const em = (n[I.earL].x + n[I.earR].x) / 2, ew = Math.abs(n[I.earL].x - n[I.earR].x) || 0.05; live.head = clamp(-((n[I.nose].x - em) / ew) * 1.6 - live.yaw * 0.5, -1.0, 1.0); }
    // a jump (or a crouch): the hips against where they usually are
    const torso = Math.abs(mid(n[I.hipL], n[I.hipR]).y - mid(n[I.shL], n[I.shR]).y) || 0.2, hy = mid(n[I.hipL], n[I.hipR]).y;
    if (!base) base = { hy, torso }; const rise = (base.hy - hy) / base.torso;
    if (Math.abs(rise) < 0.12) { base.hy += (hy - base.hy) * Math.min(1, dt * 0.8); base.torso += (torso - base.torso) * Math.min(1, dt * 0.8); }
    live.y = clamp(rise * 0.55, -0.12, 0.6);
    live.fwd = 0;
    // a light smoothing on top of the figure's own springs, so the pose does not shiver
    const k = Math.min(1, dt * 14); st.live ||= { ...live };
    for (const key in live) st.live[key] = st.live[key] == null ? live[key] : st.live[key] + (live[key] - st.live[key]) * k;
    gestures(n, w, dt, torso);
  }
  const sub2 = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];

  // ---------------------------------------------------------------- the gestures of the moves
  function fire(name) { if ((st.cd[name] || 0) > 0) return; st.events.push(name); st.arm[name] = 0; st.hold[name] = 0; st.cd[name] = 1.3; } // once, then a rest before the next
  function gestures(n, w, dt, torso) {
    for (const k in st.cd) st.cd[k] = Math.max(0, st.cd[k] - dt);
    const nose = n[I.nose], sh = mid(n[I.shL], n[I.shR]), hip = mid(n[I.hipL], n[I.hipR]), wl = n[I.wrL], wr = n[I.wrR], both = seen(wl, 0.4) && seen(wr, 0.4);
    // chop: hands up over the head (held a moment), then down past the chest
    if (both) {
      const up = wl.y < nose.y - torso * 0.05 && wr.y < nose.y - torso * 0.05, down = wl.y > sh.y + torso * 0.35 && wr.y > sh.y + torso * 0.35;
      if (up) { st.hold.chop = (st.hold.chop || 0) + dt; if (st.hold.chop > 0.25) st.arm.chop = 1.0; }
      else { st.hold.chop = 0; if (st.arm.chop > 0) { st.arm.chop -= dt / 1.0; if (down) fire('chop'); } }
      st.meter.chop = st.arm.chop > 0 ? 0.6 + 0.4 * st.arm.chop : clamp((st.hold.chop || 0) / 0.25, 0, 1) * 0.6;
    }
    // push: palms at the hips (held a moment), then both thrust out at chest height toward the camera
    if (both) {
      const atHips = Math.abs(wl.y - hip.y) < torso * 0.35 && Math.abs(wr.y - hip.y) < torso * 0.35 && Math.abs(wl.x - wr.x) < Math.abs(n[I.hipL].x - n[I.hipR].x) * 2.6;
      const reach = (s, wi) => (w[s].z - w[wi].z), ahead = reach(I.shL, I.wrL) > 0.28 && reach(I.shR, I.wrR) > 0.28;
      const chest = wl.y < hip.y - torso * 0.2 && wr.y < hip.y - torso * 0.2 && wl.y > nose.y && wr.y > nose.y;
      if (atHips) { st.hold.push = (st.hold.push || 0) + dt; if (st.hold.push > 0.3) st.arm.push = 1.0; }
      else { st.hold.push = 0; if (st.arm.push > 0) { st.arm.push -= dt / 1.2; if (ahead && chest) fire('push'); } }
      st.meter.push = st.arm.push > 0 ? 0.6 + 0.4 * st.arm.push : clamp((st.hold.push || 0) / 0.3, 0, 1) * 0.6;
    }
    // kick: a knee up near the hips, or a foot kicked high
    st.cool = Math.max(0, (st.cool || 0) - dt);
    if (st.legs) {
      const knee = Math.min(n[I.knL].y, n[I.knR].y), ankle = Math.min(seen(n[I.anL], 0.3) ? n[I.anL].y : 9, seen(n[I.anR], 0.3) ? n[I.anR].y : 9);
      const lift = Math.max((hip.y + torso * 0.55 - knee) / (torso * 0.55), (hip.y + torso * 1.1 - ankle) / (torso * 0.9));
      st.meter.kick = clamp(lift, 0, 1);
      if (lift > 0.75 && st.cool <= 0) { st.cool = 1.5; fire('kick'); }
    } else st.meter.kick = 0;
  }
  // the gestures made since the last look
  function take() { const e = st.events; st.events = []; return e; }

  // ---------------------------------------------------------------- the little picture of the player, with their bones
  function clearOverlay() { const g = overlay?.getContext('2d'); if (g) g.clearRect(0, 0, overlay.width, overlay.height); }
  function draw(n) {
    if (!overlay) return; const g = overlay.getContext('2d'), W = overlay.width = overlay.clientWidth * (devicePixelRatio || 1), H = overlay.height = overlay.clientHeight * (devicePixelRatio || 1);
    g.clearRect(0, 0, W, H); if (!n) return;
    g.lineWidth = 4 * (devicePixelRatio || 1); g.lineCap = 'round'; g.strokeStyle = 'rgba(120,220,255,.9)';
    for (const [a, b] of BONES) { if (!seen(n[a], 0.4) || !seen(n[b], 0.4)) continue; g.beginPath(); g.moveTo(n[a].x * W, n[a].y * H); g.lineTo(n[b].x * W, n[b].y * H); g.stroke(); }
    g.fillStyle = '#ffd34d'; for (const i of [0, 15, 16, 27, 28]) if (seen(n[i], 0.4)) { g.beginPath(); g.arc(n[i].x * W, n[i].y * H, 5 * (devicePixelRatio || 1), 0, Math.PI * 2); g.fill(); }
  }
  return { start, stop, tick, feed, take, st, get running() { return running; } };
}
