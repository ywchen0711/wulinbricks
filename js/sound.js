// The sounds of a move, synthesised: the qi gathering (a rising hum and wind), the cut (a hiss of steel), the crescent
// leaving (a deep thump and a ringing), its flight (a tearing whoosh), and bricks split and falling (cracks, clatter).
let ac = null, out = null;
export function wake() { if (!ac) { ac = new (window.AudioContext || window.webkitAudioContext)(); out = ac.createGain(); out.gain.value = 0.5; const c = ac.createDynamicsCompressor(); out.connect(c).connect(ac.destination); } if (ac.state === 'suspended') ac.resume(); }
const now = () => ac.currentTime;
function noise(dur, { at = 0, f0 = 800, f1 = 800, q = 1, vol = 0.4, type = 'bandpass', a = 0.01 } = {}) {
  const t = now() + at, n = Math.ceil(ac.sampleRate * dur), b = ac.createBuffer(1, n, ac.sampleRate), d = b.getChannelData(0); for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
  const s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain(); s.buffer = b; f.type = type; f.Q.value = q; f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(f1, t + dur);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); s.connect(f).connect(g).connect(out); s.start(t); s.stop(t + dur + 0.05);
}
function tone(f0, f1, dur, { at = 0, vol = 0.3, type = 'sine', a = 0.01 } = {}) {
  const t = now() + at, o = ac.createOscillator(), g = ac.createGain(); o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + dur);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); o.connect(g).connect(out); o.start(t); o.stop(t + dur + 0.05);
}
export const SFX = {
  flick() { if (!ac) return; tone(260, 420, 0.12, { vol: 0.35, type: 'triangle' }); noise(0.05, { f0: 1500, f1: 900, q: 2, vol: 0.2 }); },
  windup(rate = 1) { if (!ac) return; const k = 1 / rate; noise(0.75 * k, { f0: 250, f1: 2200, q: 3, vol: 0.28, a: 0.5 * k }); noise(0.75 * k, { f0: 600, f1: 3200, q: 6, vol: 0.12, a: 0.6 * k }); },
  kick() { if (!ac) return; tone(150, 45, 0.25, { vol: 0.9 }); noise(0.08, { f0: 2500, f1: 600, q: 0.8, vol: 0.5, type: 'lowpass' }); },
  whirl(rate = 1) { if (!ac) return; const k = 1 / rate; noise(0.7 * k, { f0: 3000, f1: 500, q: 4, vol: 0.35, a: 0.03 }); noise(0.7 * k, { f0: 1200, f1: 300, q: 2, vol: 0.25, a: 0.05 }); },
  blast(big = 1) { if (!ac) return; tone(90, 28, 0.6, { vol: 0.8 * big }); noise(0.4, { f0: 1800, f1: 150, q: 0.7, vol: 0.55 * big, type: 'lowpass' }); for (let i = 0; i < 10; i++) { const at = 0.15 + Math.random() * 0.8; noise(0.05, { at, f0: 1800 + Math.random() * 2600, f1: 1500, q: 6, vol: 0.1 + Math.random() * 0.12, a: 0.003 }); } },
  bounce() { if (!ac) return; tone(180, 90, 0.12, { vol: 0.45, type: 'triangle' }); },
  trap() { if (!ac) return; tone(140, 80, 0.1, { vol: 0.35, type: 'triangle' }); noise(0.05, { f0: 900, f1: 500, q: 1, vol: 0.15 }); },
  gather(rate = 1) { if (!ac) return; const k = 1 / rate; noise(0.8 * k, { f0: 300, f1: 1800, q: 2, vol: 0.18, a: 0.5 * k }); tone(110, 220, 0.8 * k, { vol: 0.12, a: 0.6 * k, type: 'triangle' }); tone(660, 1320, 0.8 * k, { vol: 0.04, a: 0.7 * k }); },
  cut(rate = 1) { if (!ac) return; noise(0.22 / rate, { f0: 6000, f1: 900, q: 1.5, vol: 0.5 }); },
  launch(rate = 1) { if (!ac) return; const k = 1 / rate; tone(140, 40, 0.5 * k, { vol: 0.7, type: 'sine' }); noise(0.35 * k, { f0: 1200, f1: 200, q: 0.8, vol: 0.4, type: 'lowpass' }); tone(1760, 1700, 1.2 * k, { vol: 0.06, at: 0.02, a: 0.02 }); tone(2640, 2600, 0.9 * k, { vol: 0.04, at: 0.02 }); noise(0.9 * k, { at: 0.05, f0: 2500, f1: 600, q: 3, vol: 0.25, a: 0.1 }); },
  hit(big = 1) { if (!ac) return; noise(0.12, { f0: 3000, f1: 1500, q: 1, vol: 0.5 * big }); tone(90, 50, 0.3, { vol: 0.4 * big }); for (let i = 0; i < 7; i++) { const at = 0.25 + Math.random() * 0.6; noise(0.05, { at, f0: 2200 + Math.random() * 2500, f1: 1800, q: 6, vol: 0.12 + Math.random() * 0.1, a: 0.003 }); } },
};
