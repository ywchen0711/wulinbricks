// Things the films hand about: made once, put in the world, laid on the floor, or held in someone's hand.
//   token 執法令: a gilt plate with 令 on it, on a red cord (the Law Hall's warrant token)
//   jade  青龍鑰: a quarter-disc of green jade carved with a dragon, glowing a little (one of the four keys)
//   cup   a white teacup
import * as THREE from '../lib/three.module.min.js';
import { plastic, rbox } from './brick/minifig.js';

function textTex(ch, bg, fg, size = 180) { const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d'); g.fillStyle = bg; g.fillRect(0, 0, 256, 256); g.strokeStyle = fg; g.lineWidth = 10; g.strokeRect(14, 14, 228, 228); g.fillStyle = fg; g.font = `900 ${size}px "Noto Serif TC", serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(ch, 128, 138); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }
function jadeTex() { const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d'); const r = g.createRadialGradient(128, 128, 20, 128, 128, 140); r.addColorStop(0, '#9ae8b8'); r.addColorStop(1, '#2a8a5a'); g.fillStyle = r; g.fillRect(0, 0, 256, 256); g.strokeStyle = 'rgba(20,70,40,0.7)'; g.lineWidth = 7; g.beginPath(); for (let i = 0; i <= 40; i++) { const a = i / 40 * Math.PI * 1.6, rr = 40 + i * 1.8; g.lineTo(128 + Math.cos(a) * rr * 0.9, 128 + Math.sin(a) * rr * 0.9); } g.stroke(); g.beginPath(); g.arc(70, 90, 10, 0, 6.3); g.stroke(); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }

export function makeProp(kind) {
  const G = new THREE.Group(), add = (m) => { m.castShadow = true; G.add(m); return m; };
  if (kind === 'token') {
    const face = new THREE.MeshPhysicalMaterial({ map: textTex('令', '#c89a2a', '#5a1a0a'), metalness: 0.6, roughness: 0.3 }), gold = plastic('#c89a2a', { metalness: 0.6, roughness: 0.3 });
    add(new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.22, 0.03), [gold, gold, gold, gold, face, face]));
    const cord = add(new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.008, 6, 16), plastic('#c02a2a'))); cord.position.y = 0.14;
  } else if (kind === 'jade') {
    const m = new THREE.MeshPhysicalMaterial({ map: jadeTex(), roughness: 0.15, clearcoat: 1, transmission: 0.2, emissive: '#2aa86a', emissiveIntensity: 0.2 });
    const g = new THREE.CylinderGeometry(0.11, 0.11, 0.03, 24, 1, false, 0, Math.PI / 2); g.rotateX(Math.PI / 2); add(new THREE.Mesh(g, m));
    const glow = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 12), new THREE.MeshBasicMaterial({ color: '#5ad890', transparent: true, opacity: 0.12, blending: THREE.AdditiveBlending, depthWrite: false })); glow.position.set(0.05, 0.05, 0); G.add(glow); G.userData.glow = glow;
  } else if (kind === 'cup') { add(new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.035, 0.06, 16), plastic('#f0ece0'))); }
  return G;
}

// a film's props: put one down, give it to someone, take it away
export function propShelf(scene) {
  const items = {};
  return {
    items,
    put(name, kind, pos, rot = 0) { let p = items[name]; if (!p) { p = items[name] = { G: makeProp(kind) }; } p.held = null; scene.add(p.G); p.G.position.copy(pos); p.G.rotation.set(0, rot, 0); p.G.visible = true; return p; },
    hold(name, f, side = 'R', off = [0, -0.04, 0.06]) { const p = items[name]; if (p) p.held = { f, side, off }; },
    hide(name) { const p = items[name]; if (p) { p.G.visible = false; p.held = null; } },
    clear() { for (const p of Object.values(items)) { p.G.visible = false; p.held = null; } },
    update(t) { for (const p of Object.values(items)) { if (p.held) { const h = p.held.f.F.hands[p.held.side === 'R' ? 0 : 1]; h.updateMatrixWorld(true); const w = h.localToWorld(new THREE.Vector3(...p.held.off.map((v) => v / 0.0375))); p.G.position.copy(w); p.G.rotation.y = p.held.f.mark.yaw; } if (p.G.userData.glow) p.G.userData.glow.material.opacity = 0.1 + Math.sin(t * 3) * 0.04; } },
  };
}
