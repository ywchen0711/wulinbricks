// 《一字千金》's studio, in bricks: a round stage of deep blue tiles ringed in gold; at the back a great screen in a gold
// frame under the show's name, coin towers either side; six contestants' podiums in an arc, each in its child's colour
// with a name plate, a score in lit digits and a red buzzer on top; the host's mark at the left with his little desk;
// the audience on four rows of risers facing the stage (bricks people, who laugh, clap and cheer); a truss of lamps
// overhead with key lights and sweeping coloured beams; confetti and gold coins to fall at the end.
//   const st = studio(scene, O); st.screen('q', { round, word, mark, answer }); st.score(i, n, 'good'); st.buzz(i);
//   st.crowd('laugh'); st.lights('party'); st.confetti(); st.reset()   — all driven by the set's own clock (tick(dt))
import * as THREE from '../lib/three.module.min.js';
import { kit, P, BH, PH } from './brick/bricks.js';
import { plastic, rbox } from './brick/minifig.js';

// where the six stand, and the host (in the set's own coordinates): podiums in a shallow arc, angled to the audience
export const STUDIO = {
  podium(i) { const x = (i - 2.5) * 1.55, z = -1.9 + 0.16 * (i - 2.5) ** 2, yaw = Math.atan2(-x, 8 - z) * 0.8; return { x, z, yaw, stand: [x - Math.sin(yaw) * 0.55, z - Math.cos(yaw) * 0.55] }; },
  host: [-5.0, 0.9],
  room: [-8.4, 8.4, -4.9, 9.4, 6.2],
};
const rng = (s) => () => ((s = (s * 16807) % 2147483647) / 2147483647);
const FONT = '"Noto Sans TC", "Noto Serif TC", sans-serif', SERIF = '"Noto Serif TC", serif';

// ---------------------------------------------------------------- what the screen shows
function drawScreen(g, W, H, mode, d = {}, t = 0) {
  const bg = g.createRadialGradient(W / 2, H * 0.55, 40, W / 2, H / 2, W * 0.7); bg.addColorStop(0, mode === 'final' || mode === 'tie' ? '#8a1a2a' : '#3a1a6a'); bg.addColorStop(1, mode === 'final' || mode === 'tie' ? '#2a0610' : '#0e0a2a'); g.fillStyle = bg; g.fillRect(0, 0, W, H);
  g.save(); g.translate(W / 2, H * 0.55); for (let i = 0; i < 24; i++) { g.rotate(Math.PI / 12); g.fillStyle = i % 2 ? 'rgba(255,210,90,0.06)' : 'rgba(255,255,255,0.025)'; g.beginPath(); g.moveTo(0, 0); g.lineTo(W, -60); g.lineTo(W, 60); g.fill(); } g.restore(); // rays
  const gold = (y0, y1) => { const gr = g.createLinearGradient(0, y0, 0, y1); gr.addColorStop(0, '#fff2a8'); gr.addColorStop(0.5, '#f0c030'); gr.addColorStop(1, '#a8701a'); return gr; };
  const big = (text, y, size, fill = gold(y - size / 2, y + size / 2), font = SERIF) => { g.font = `900 ${size}px ${font}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineWidth = size / 9; g.strokeStyle = '#2a0a0a'; g.lineJoin = 'round'; g.strokeText(text, W / 2, y); g.fillStyle = fill; g.fillText(text, W / 2, y); };
  const coin = (x, y, r) => { g.fillStyle = gold(y - r, y + r); g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); g.strokeStyle = '#a8701a'; g.lineWidth = r / 6; g.stroke(); g.fillStyle = '#a8701a'; g.font = `900 ${r}px ${SERIF}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('金', x, y + 2); };
  const bar = (text, pts) => { g.fillStyle = 'rgba(0,0,0,0.45)'; g.fillRect(0, 0, W, 78); g.fillStyle = '#f0c030'; g.fillRect(0, 76, W, 4); g.font = `700 40px ${FONT}`; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillStyle = '#fff'; g.fillText(text, 30, 40); if (pts) { g.textAlign = 'right'; g.fillStyle = '#ffd84a'; g.fillText(pts, W - 30, 40); } };
  if (mode === 'logo') { for (const [x, y, r] of [[120, 120, 50], [W - 120, 130, 44], [150, H - 110, 40], [W - 160, H - 100, 52]]) coin(x, y, r); big('一字千金', H * 0.46, 190); g.font = `700 46px ${FONT}`; g.fillStyle = '#fff'; g.textAlign = 'center'; g.fillText(d.sub || '兒童特別節目', W / 2, H * 0.78); }
  if (mode === 'round') { g.font = `700 58px ${FONT}`; g.fillStyle = '#ffd84a'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(d.n, W / 2, H * 0.27); big(d.name, H * 0.52, 150, '#ffffff'); g.font = `600 40px ${FONT}`; g.fillStyle = '#e8e0ff'; g.fillText(d.sub || '', W / 2, H * 0.8); }
  if (mode === 'q') { // the characters in tiles, one may be marked (wrong, in red) or blank; the reading or the right one below
    bar(d.round || '', d.pts); const chars = [...d.word], n = chars.length, s = Math.min(200, (W - 120) / n - 18), x0 = W / 2 - (n * (s + 18) - 18) / 2, y0 = H * 0.25;
    chars.forEach((ch, i) => { const x = x0 + i * (s + 18), m = d.mark === i, fixed = m && d.fix;
      g.fillStyle = m ? (fixed ? '#2a8a4a' : '#a81a2a') : '#f6f2e6'; g.beginPath(); g.roundRect(x, y0, s, s, 16); g.fill(); g.strokeStyle = '#f0c030'; g.lineWidth = 6; g.stroke();
      g.fillStyle = m ? '#fff' : '#1a1430'; g.font = `900 ${s * 0.74}px ${SERIF}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(fixed ? d.fix : ch === '＿' ? '' : ch, x + s / 2, y0 + s / 2 + 6);
      if (ch === '＿' && !fixed) { g.fillStyle = '#c8c0e0'; g.font = `900 ${s * 0.6}px ${FONT}`; g.fillText('？', x + s / 2, y0 + s / 2 + 4); } });
    if (d.answer) { g.font = `900 64px ${FONT}`; g.fillStyle = '#ffd84a'; g.textAlign = 'center'; g.fillText(d.answer, W / 2, H * 0.86); }
    else if (d.hint) { g.font = `600 44px ${FONT}`; g.fillStyle = '#e8e0ff'; g.textAlign = 'center'; g.fillText(d.hint, W / 2, H * 0.86); }
  }
  if (mode === 'scores') { bar(d.title || '目前分數'); const rows = d.rows, max = Math.max(1, ...rows.map((r) => r[1]));
    rows.forEach(([name, n, c], i) => { const y = 112 + i * 70, w = (W - 470) * n / max; g.fillStyle = 'rgba(255,255,255,0.08)'; g.fillRect(250, y, W - 470, 52); g.fillStyle = c; g.fillRect(250, y, Math.max(6, w), 52); g.font = `700 40px ${FONT}`; g.textAlign = 'right'; g.textBaseline = 'middle'; g.fillStyle = '#fff'; g.fillText(name, 230, y + 27); g.textAlign = 'left'; g.fillStyle = '#ffd84a'; g.fillText(String(n), W - 200, y + 27); }); }
  if (mode === 'final') { g.font = `700 54px ${FONT}`; g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('最後決戰', W / 2, H * 0.2); big('一字千金', H * 0.46, 170); g.font = `900 64px ${SERIF}`; g.fillStyle = '#fff'; g.fillText(d.a + '　ＶＳ　' + d.b, W / 2, H * 0.78); }
  if (mode === 'ask') { bar(d.round || '', d.pts); g.font = `900 ${d.size || 84}px ${SERIF}`; g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle'; (d.lines || (d.text ? [d.text] : [])).forEach((l, i, a) => g.fillText(l, W / 2, H * 0.52 + (i - (a.length - 1) / 2) * (d.size || 84) * 1.25)); if (d.big) { big(d.big, H * 0.52, 260); } if (d.foot) { g.font = `600 42px ${FONT}`; g.fillStyle = '#ffd84a'; g.fillText(d.foot, W / 2, H * 0.88); } }
  if (mode === 'tie') { for (let i = 0; i < 40; i++) { const r = rng(i + 3); g.fillStyle = ['#ffd84a', '#ff5a7a', '#5ad8ff', '#7aff8a', '#ffffff'][i % 5]; g.fillRect(r() * W, r() * H, 14, 22); } big('平手！', H * 0.4, 200); g.font = `900 70px ${SERIF}`; g.fillStyle = '#fff'; g.textAlign = 'center'; g.fillText(d.sub || '雙冠軍', W / 2, H * 0.74); }
  if (mode === 'off') { g.fillStyle = '#050508'; g.fillRect(0, 0, W, H); }
}

export function studio(scene, O) {
  const G = new THREE.Group(); G.position.set(O.x, -PH, O.z); scene.add(G); const K = kit(G), lamps = [];
  const at = (m, x, y, z, ry = 0) => { m.position.set(O.x + x, y, O.z + z); m.rotation.y = ry; m.userData.setPiece = true; scene.add(m); return m; };
  K.baseplate(0, 2, 80, 80, '#10121e');
  // the round stage and its gold rim
  for (let x = -7.2 + 2 * P; x < 7.3; x += 4 * P) for (let z = -5.2 + 2 * P; z < 5.3; z += 4 * P) { const r = Math.hypot(x, (z + 0.6) * 1.15); if (r > 7.3) continue; K.brick(x, 0, z, 4, 4, 'tile', r > 6.6 ? '#d8a838' : (Math.round(x / 1.2) + Math.round(z / 1.2)) % 2 ? '#1c2a62' : '#223276'); }
  for (let a = 0; a < Math.PI * 2; a += Math.PI / 16) K.round(Math.cos(a) * 3.2, 0, -0.6 + Math.sin(a) * 2.8, 2, 'tile', '#f0c858'); // an inner gold ring
  // the back wall, the screen in its frame, the name above, coin towers
  for (let x = -9.6 + 2 * P; x < 9.7; x += 4 * P) for (let r = 0; r < 17; r++) K.brick(x, r * BH, -5.6, 4, 1, 'brick', r % 4 === 3 ? '#d8a838' : '#2a1640');
  for (const s of [-1, 1]) for (let z = -5.2; z < 9.8; z += 4 * P) for (let r = 0; r < 17; r++) K.brick(s * 9.8, r * BH, z, 1, 4, 'brick', r % 4 === 3 ? '#6a3a9a' : '#1e1030'); // the side walls
  for (let x = -9.6 + 2 * P; x < 9.7; x += 4 * P) for (let r = 0; r < 17; r++) K.brick(x, r * BH, 10.0, 4, 1, 'brick', '#140c20'); // behind the audience
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(20, 16), new THREE.MeshStandardMaterial({ color: '#06060c', roughness: 1 })); ceil.rotation.x = Math.PI / 2; at(ceil, 0, 6.3, 2.2);
  const SW = 6.4, SH = 3.4, cv = document.createElement('canvas'); cv.width = 1024; cv.height = 544; const sg = cv.getContext('2d'); const stex = new THREE.CanvasTexture(cv); stex.colorSpace = THREE.SRGBColorSpace; stex.anisotropy = 8;
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(SW, SH), new THREE.MeshBasicMaterial({ map: stex, toneMapped: false })); at(scr, 0, 2.55, -5.38);
  const noiseC = document.createElement('canvas'); noiseC.width = 160; noiseC.height = 85; const ntex = new THREE.CanvasTexture(noiseC); ntex.magFilter = THREE.NearestFilter;
  for (let x = -3.4; x <= 3.41; x += 2 * P) { K.brick(x, 0.72, -5.42, 2, 1, 'brick', '#d8a838'); K.brick(x, 4.22, -5.42, 2, 1, 'plate', '#d8a838'); }
  for (const s of [-1, 1]) for (let r = 2; r < 12; r++) K.brick(s * 3.42, r * BH, -5.42, 1, 1, 'brick', '#d8a838');
  const name = (() => { const c = document.createElement('canvas'); c.width = 1200; c.height = 300; const g = c.getContext('2d'); const gr = g.createLinearGradient(0, 0, 0, 300); gr.addColorStop(0, '#a8141e'); gr.addColorStop(1, '#5a0810'); g.fillStyle = gr; g.beginPath(); g.roundRect(6, 6, 1188, 288, 60); g.fill(); g.strokeStyle = '#ffd84a'; g.lineWidth = 12; g.stroke(); g.font = `900 210px ${SERIF}`; g.textAlign = 'center'; g.textBaseline = 'middle'; const tg = g.createLinearGradient(0, 40, 0, 260); tg.addColorStop(0, '#fff6b8'); tg.addColorStop(0.55, '#f2c030'); tg.addColorStop(1, '#b07a1a'); g.lineWidth = 16; g.strokeStyle = '#3a0606'; g.strokeText('一字千金', 600, 160); g.fillStyle = tg; g.fillText('一字千金', 600, 160); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return new THREE.Mesh(new THREE.PlaneGeometry(4.4, 1.1), new THREE.MeshBasicMaterial({ map: t, transparent: true, toneMapped: false })); })();
  at(name, 0, 5.05, -5.36);
  const coinFace = (() => { const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'); g.fillStyle = '#e8b830'; g.fillRect(0, 0, 128, 128); g.strokeStyle = '#a8701a'; g.lineWidth = 8; g.beginPath(); g.arc(64, 64, 54, 0, Math.PI * 2); g.stroke(); g.fillStyle = '#a8701a'; g.font = `900 72px ${SERIF}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('金', 64, 68); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
  const goldM = plastic('#e8b830', { metalness: 0.7, roughness: 0.25 });
  for (const s of [-1, 1]) { for (let i = 0; i < 9; i++) K.round(s * 4.6, i * PH * 1.0, -5.0, 4, 'plate', i % 2 ? '#e8b830' : '#d8a028'); const c = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.75, 0.14, 32), [goldM, new THREE.MeshPhysicalMaterial({ map: coinFace, metalness: 0.6, roughness: 0.3 }), goldM]); c.rotation.x = Math.PI / 2; c.castShadow = true; at(c, s * 6.4, 3.6, -5.45); const c2 = c.clone(); c2.scale.setScalar(0.6); at(c2, s * 5.6, 2.0, -5.47); }
  // the truss overhead and the lamps on it
  for (const z of [-3.2, 2.6]) for (let x = -8.4; x <= 8.41; x += 4 * P) K.brick(x, 5.6, z, 4, 1, 'brick', '#5a5a64');
  const bulbs = []; for (const z of [-3.2, 2.6]) for (let x = -7.8; x <= 7.81; x += 1.2) { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 0.22, 12), new THREE.MeshBasicMaterial({ color: '#ffe8b0', toneMapped: false })); at(b, x, 5.4, z); bulbs.push(b); }
  const key = new THREE.SpotLight('#fff4e4', 60, 22, 0.6, 0.5, 1.6); key.position.set(O.x, 5.6, O.z + 4.5); key.target.position.set(O.x, 0.6, O.z - 1.4); key.castShadow = true; key.shadow.mapSize.set(1024, 1024); key.shadow.bias = -0.0005; scene.add(key, key.target);
  const keyH = new THREE.SpotLight('#ffe8d0', 28, 18, 0.45, 0.6, 1.6); keyH.position.set(O.x - 2.5, 5.4, O.z + 4.0); keyH.target.position.set(O.x - 5, 0.8, O.z + 0.8); scene.add(keyH, keyH.target);
  const wash = [['#5a3aff', -6, -4], ['#ff3a8a', 6, -4], ['#3ab8ff', 0, -4.6]].map(([c, x, z]) => { const l = new THREE.PointLight(c, 6, 9, 1.6); l.position.set(O.x + x, 3.6, O.z + z); scene.add(l); return l; });
  const fillA = new THREE.PointLight('#c8d0ff', 5, 16, 1.4); fillA.position.set(O.x, 3.5, O.z + 7.5); scene.add(fillA);
  // sweeping beams: cones of coloured light, seen in the haze
  const beams = []; for (let i = 0; i < 6; i++) { const g = new THREE.ConeGeometry(0.7, 6, 20, 1, true); g.translate(0, -3, 0); const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: '#8a7aff', transparent: true, opacity: 0.08, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false })); at(m, -7 + i * 2.8, 5.5, i % 2 ? -3.2 : 2.6); beams.push(m); }
  // the host's desk at the left, a small lectern with the show's coin on it
  { const x = -6.4, z = -0.4; for (let r = 0; r < 3; r++) K.brick(x, r * BH, z, 3, 3, 'brick', r === 2 ? '#d8a838' : '#7a0a14'); K.brick(x, 3 * BH, z, 4, 4, 'plate', '#2a1640'); const c = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.05, 24), [goldM, new THREE.MeshPhysicalMaterial({ map: coinFace, metalness: 0.6, roughness: 0.3 }), goldM]); c.rotation.x = Math.PI / 2 - 0.3; at(c, x, 0.62, z + 0.47); }
  // ---- the six podiums
  const COLORS = ['#e8b81a', '#3a7ad8', '#2a3a8a', '#d8462a', '#f08a2a', '#e86aa0'];
  const pods = [];
  for (let i = 0; i < 6; i++) {
    const L = STUDIO.podium(i), g = new THREE.Group(); at(g, L.x, 0, L.z, L.yaw);
    const body = new THREE.Mesh(rbox(1.15, 0.5, 0.78, 0.06), plastic(COLORS[i])); body.position.y = 0.25; body.castShadow = true; body.receiveShadow = true; g.add(body);
    const top = new THREE.Mesh(rbox(1.25, 0.08, 0.88, 0.03), plastic('#f4f2ec')); top.position.y = 0.54; top.castShadow = true; g.add(top);
    for (let k = 0; k < 4; k++) { const st = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.05, 12), plastic('#f4f2ec')); st.position.set(-0.45 + k * 0.3, 0.605, -0.28); g.add(st); }
    const btnM = new THREE.MeshPhysicalMaterial({ color: '#c81a1a', emissive: '#ff2a1a', emissiveIntensity: 0, roughness: 0.25, clearcoat: 1 });
    const btn = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.15, 0.08, 20), btnM); btn.position.set(0, 0.62, 0.12); g.add(btn);
    const glowM = new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.0, toneMapped: false });
    const ring = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.05, 0.83), glowM); ring.position.y = 0.04; g.add(ring); // a strip of light at its foot
    const c = document.createElement('canvas'); c.width = 512; c.height = 236; const pg = c.getContext('2d'), tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
    const face = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.46), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false })); face.position.set(0, 0.27, 0.395); g.add(face);
    pods.push({ g, btn, btnM, ring, glowM, pg, tex, name: '', score: 0, color: COLORS[i], flash: null });
  }
  const drawPod = (p) => { const g = p.pg; g.fillStyle = p.color; g.fillRect(0, 0, 512, 236); g.fillStyle = '#0a0a10'; g.beginPath(); g.roundRect(46, 14, 420, 122, 20); g.fill(); g.strokeStyle = '#f0c030'; g.lineWidth = 6; g.stroke();
    g.font = `900 100px "Noto Sans TC", monospace`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = p.flash === 'bad' ? '#ff5a4a' : '#ffd84a'; g.shadowColor = g.fillStyle; g.shadowBlur = 18; g.fillText(String(p.score), 256, 80); g.shadowBlur = 0;
    g.fillStyle = '#ffffff'; g.font = `900 74px ${FONT}`; g.fillText(p.name, 256, 190); p.tex.needsUpdate = true; };
  // ---- the audience: bricks people on four rows of risers, all facing the stage
  const ROWS = 4, PER = 20, people = [];
  for (let r = 0; r < ROWS; r++) { const z = 6.3 + r * 0.85, y = r * 2 * BH; for (let x = -8.4 + 2 * P; x < 8.5; x += 4 * P) { for (let k = 0; k < 2 * r + 1; k++) K.brick(x, k * BH, z + 0.1, 4, 3, 'brick', '#2a2a34'); K.brick(x, y + BH, z + 0.25, 4, 2, 'plate', '#a8141e'); } }
  const pr = rng(11), shirt = ['#d8462a', '#3a7ad8', '#2a8a4a', '#f2c21a', '#e86aa0', '#f4f4f0', '#5a3a9a', '#2a2a2a', '#f08a2a', '#7ab8e8'], hairC = ['#1a1210', '#2a1a10', '#5a3a1a', '#8a8a8a', '#d8b040', '#141012'];
  for (let r = 0; r < ROWS; r++) for (let i = 0; i < PER; i++) { const x = -7.9 + i * (15.8 / (PER - 1)) + (pr() - 0.5) * 0.12; people.push({ x, y: r * 2 * BH + BH + PH + 0.02, z: 6.3 + r * 0.85 + 0.2, ph: pr() * 6.28, sp: 0.8 + pr() * 0.5, shirt: shirt[Math.floor(pr() * shirt.length)], hair: hairC[Math.floor(pr() * hairC.length)], kid: pr() < 0.25 }); }
  const N = people.length, faceT = (() => { const c = document.createElement('canvas'); c.width = 256; c.height = 64; const g = c.getContext('2d'); g.fillStyle = '#f6c42a'; g.fillRect(0, 0, 256, 64); g.fillStyle = '#1a1210'; for (const x of [116, 140]) { g.beginPath(); g.arc(x, 26, 4.5, 0, Math.PI * 2); g.fill(); } g.lineWidth = 4; g.strokeStyle = '#1a1210'; g.beginPath(); g.arc(128, 34, 11, 0.2, Math.PI - 0.2); g.stroke(); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
  const inst = (geo, mat) => { const m = new THREE.InstancedMesh(geo, mat, N); m.castShadow = false; m.receiveShadow = true; m.frustumCulled = false; G.add(m); return m; };
  const torsoI = inst(new THREE.BoxGeometry(0.36, 0.4, 0.22), new THREE.MeshStandardMaterial({ roughness: 0.5 })), headI = inst(new THREE.CylinderGeometry(0.12, 0.12, 0.22, 16), new THREE.MeshStandardMaterial({ map: faceT, roughness: 0.4 })),
    hairI = inst(new THREE.SphereGeometry(0.135, 16, 8, 0, Math.PI * 2, 0, Math.PI * 0.55), new THREE.MeshStandardMaterial({ roughness: 0.5 })), armI = inst(new THREE.BoxGeometry(0.09, 0.32, 0.1).translate(0, -0.14, 0), new THREE.MeshStandardMaterial({ roughness: 0.5 })), arm2I = inst(new THREE.BoxGeometry(0.09, 0.32, 0.1).translate(0, -0.14, 0), new THREE.MeshStandardMaterial({ roughness: 0.5 }));
  const cc = new THREE.Color(); people.forEach((p, i) => { torsoI.setColorAt(i, cc.set(p.shirt)); armI.setColorAt(i, cc.set(p.shirt)); arm2I.setColorAt(i, cc.set(p.shirt)); hairI.setColorAt(i, cc.set(p.hair)); headI.setColorAt(i, cc.set('#ffffff')); });
  const M4 = new THREE.Matrix4(), Q = new THREE.Quaternion(), E = new THREE.Euler(), Vp = new THREE.Vector3(), Sc = new THREE.Vector3(1, 1, 1);
  const place = (im, i, x, y, z, rx, ry, rz, s = 1) => { Q.setFromEuler(E.set(rx, ry, rz)); Sc.setScalar(s); M4.compose(Vp.set(x, y, z), Q, Sc); im.setMatrixAt(i, M4); };
  // ---- confetti and coins
  const CN = 420, conf = inst2(new THREE.PlaneGeometry(0.07, 0.11), new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, toneMapped: false }), CN), CO = 90, coins = inst2(new THREE.CylinderGeometry(0.09, 0.09, 0.02, 16), new THREE.MeshPhysicalMaterial({ color: '#f0c030', metalness: 0.8, roughness: 0.25, emissive: '#5a3a00' }), CO);
  function inst2(geo, mat, n) { const m = new THREE.InstancedMesh(geo, mat, n); m.frustumCulled = false; m.visible = false; scene.add(m); m.position.set(O.x, 0, O.z); return m; }
  const confC = ['#ffd84a', '#ff5a7a', '#5ad8ff', '#7aff8a', '#ffffff', '#c87aff']; for (let i = 0; i < CN; i++) conf.setColorAt(i, cc.set(confC[i % confC.length]));
  // ---------------------------------------------------------------- the state, and its clock
  const S = { t: 0, mood: 'idle', moodT: 0, moodLen: 0, lights: 'show', lightsT: 0, conf: -1, screen: null, static: false };
  const screen = (mode, d) => { S.screen = [mode, d]; S.static = mode === 'static'; if (!S.static) { drawScreen(sg, cv.width, cv.height, mode, d, S.t); stex.needsUpdate = true; scr.material.map = stex; } else scr.material.map = ntex; scr.material.needsUpdate = true; };
  const api = {
    lamps, STUDIO,
    reset() { S.t = 0; S.mood = 'idle'; S.lights = 'show'; S.conf = -1; conf.visible = coins.visible = false; screen('logo', {}); pods.forEach((p) => { p.score = 0; p.flash = null; p.flashT = -9; p.buzzT = -9; drawPod(p); }); },
    names(list) { list.forEach((n, i) => { pods[i].name = n; drawPod(pods[i]); }); },
    screen,
    scores(list) { list.forEach((n, i) => { pods[i].score = n; pods[i].flash = null; drawPod(pods[i]); }); },
    score(i, n, how = 'good') { const p = pods[i]; p.score = n; p.flash = how; p.flashT = S.t; drawPod(p); },
    flash(i, how) { const p = pods[i]; p.flash = how; p.flashT = S.t; drawPod(p); },
    buzz(i) { pods[i].buzzT = S.t; },
    crowd(mood, len = 3) { S.mood = mood; S.moodT = S.t; S.moodLen = len; },
    lights(mode) { S.lights = mode; S.lightsT = S.t; },
    confetti() { S.conf = S.t; conf.visible = coins.visible = true; },
    time() { lamps.forEach((l) => (l.intensity = 2)); },
    tick(dt) {
      S.t += dt; const t = S.t;
      // the podiums: a buzzer lit and pulsing, the strip at the foot green for right, red for wrong, fading
      for (const p of pods) { const b = t - p.buzzT, f = t - p.flashT; p.btnM.emissiveIntensity = b >= 0 && b < 2.2 ? 1.6 * (0.6 + 0.4 * Math.sin(b * 18)) : 0; p.btn.position.y = 0.62 - (b >= 0 && b < 0.15 ? 0.03 : 0);
        if (f >= 0 && f < 2.5 && p.flash) { p.glowM.color.set(p.flash === 'bad' ? '#ff3a2a' : '#4aff7a'); p.glowM.opacity = 0.9 * (1 - f / 2.5) * (0.7 + 0.3 * Math.sin(f * 20)); } else if (b >= 0 && b < 2.2) { p.glowM.color.set('#ffffff'); p.glowM.opacity = 0.6 * (1 - b / 2.2); } else p.glowM.opacity = 0;
        if (p.flash && f > 2.5) { p.flash = null; drawPod(p); } }
      // the lights: steady for the show, low and warm for the final question, a party at the end
      const L = S.lights, party = L === 'party', dim = L === 'dim';
      key.intensity += ((dim ? 30 : 60) - key.intensity) * Math.min(1, dt * 3); keyH.intensity += ((dim ? 12 : 28) - keyH.intensity) * Math.min(1, dt * 3); fillA.intensity += ((dim ? 1.5 : 5) - fillA.intensity) * Math.min(1, dt * 3);
      wash.forEach((l, i) => { l.intensity = (dim ? 2 : 6) * (party ? 1.3 + Math.sin(t * 6 + i * 2) * 0.6 : 1); if (party) l.color.setHSL((t * 0.3 + i / 3) % 1, 0.9, 0.55); });
      beams.forEach((b, i) => { const sp = party ? 2.4 : 0.5; b.rotation.z = Math.sin(t * sp + i * 1.3) * (party ? 0.8 : 0.45); b.rotation.x = Math.cos(t * sp * 0.8 + i) * 0.35; b.material.opacity = dim ? 0.02 : party ? 0.16 : 0.07; if (party) b.material.color.setHSL((t * 0.4 + i / 6) % 1, 1, 0.6); else b.material.color.set(i % 2 ? '#8a7aff' : '#ffb84a'); });
      bulbs.forEach((b, i) => { const on = party ? (Math.floor(t * 8) + i) % 3 === 0 : dim ? false : (Math.floor(t * 1.5) + i) % 2 === 0; b.material.color.set(on ? (party ? ['#ff5a7a', '#5ad8ff', '#ffd84a'][i % 3] : '#ffe8b0') : '#5a4a3a'); });
      if (S.static) { const g = noiseC.getContext('2d'), im = g.createImageData(160, 85), r = rng(Math.floor(t * 30) + 1); for (let i = 0; i < im.data.length; i += 4) { const v = r() * 255; im.data[i] = im.data[i + 1] = im.data[i + 2] = v; im.data[i + 3] = 255; } g.putImageData(im, 0, 0); ntex.needsUpdate = true; }
      // the audience
      const u = t - S.moodT, live = u < S.moodLen, mood = live ? S.mood : 'idle', fade = live ? Math.min(1, u / 0.25, (S.moodLen - u) / 0.6) : 0;
      people.forEach((p, i) => {
        const q = t * p.sp + p.ph; let bob = Math.sin(q * 0.7) * 0.004, lean = Math.sin(q * 0.4) * 0.03, tilt = 0, aR = 0.1, aL = 0.1, aRx = 0, aLx = 0;
        if (mood === 'laugh') { bob += Math.abs(Math.sin(q * 9)) * 0.025 * fade; tilt = (0.25 + Math.sin(q * 9) * 0.06) * fade; lean += (i % 3 === 0 ? 0.15 * Math.sin(q * 4.5) : 0) * fade; aRx = 0.4 * fade; aLx = (i % 4 === 0 ? 1.2 : 0.3) * fade; }
        if (mood === 'clap') { const k = Math.abs(Math.sin(q * 12)); aRx = 1.25 * fade; aLx = 1.25 * fade; aR = 0.1 + (0.25 - 0.3 * k) * fade; aL = aR; bob += k * 0.006 * fade; }
        if (mood === 'cheer') { const k = Math.sin(q * 7); aRx = -2.8 * fade; aLx = -2.8 * fade; aR = aL = 0.3 + 0.2 * k * fade; bob += Math.max(0, k) * 0.07 * fade; }
        if (mood === 'aww') { tilt = -0.12 * fade; lean += Math.sin(q * 1.2) * 0.12 * fade; aRx = (i % 2 ? 1.6 : 0.2) * fade; aLx = (i % 2 ? 1.6 : 0.2) * fade; }
        if (mood === 'ooh') { tilt = 0.15 * fade; aRx = aLx = (i % 3 === 0 ? 2.2 : 0.5) * fade; }
        const s = p.kid ? 0.82 : 1, y = p.y + bob, ry = 0;
        place(torsoI, i, p.x, y + 0.2 * s, p.z, tilt * 0.4, ry, lean * 0.5, s);
        const hy = y + (0.4 + 0.13) * s; place(headI, i, p.x + Math.sin(lean) * 0.05, hy, p.z + Math.sin(tilt) * 0.06, tilt, ry + lean, 0, s); place(hairI, i, p.x + Math.sin(lean) * 0.05, hy + 0.07 * s, p.z + Math.sin(tilt) * 0.09, tilt, ry + lean, 0, s);
        place(armI, i, p.x + 0.225 * s, y + 0.38 * s, p.z, aRx, 0, aR, s); place(arm2I, i, p.x - 0.225 * s, y + 0.38 * s, p.z, aLx, 0, -aL, s);
      });
      for (const m of [torsoI, headI, hairI, armI, arm2I]) { m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true; }
      // confetti and coins, fluttering down for a while from above the stage
      if (S.conf >= 0) { const c = t - S.conf, r = rng(77);
        for (let i = 0; i < CN; i++) { const x0 = (r() - 0.5) * 14, z0 = -3.5 + r() * 9, d = r() * 2.5, sp = 0.7 + r() * 0.5, k = Math.max(0, c - d), y = 6.2 - k * sp, ph = r() * 6.28; if (y < 0.02) { place(conf, i, x0, 0.02, z0, -Math.PI / 2, ph, 0); continue; } place(conf, i, x0 + Math.sin(k * 2 + ph) * 0.3, c < d ? 9 : y, z0 + Math.cos(k * 1.7 + ph) * 0.2, k * 5 + ph, k * 3, ph); }
        for (let i = 0; i < CO; i++) { const x0 = (r() - 0.5) * 10, z0 = -2.8 + r() * 5, d = r() * 2, k = Math.max(0, c - d), y = Math.max(0.02, 6.2 - k * k * 4.9), ph = r() * 6.28; place(coins, i, x0, c < d ? 9 : y, z0, y > 0.02 ? k * 7 + ph : 0, ph, y > 0.02 ? k * 5 : 0); }
        conf.instanceMatrix.needsUpdate = true; coins.instanceMatrix.needsUpdate = true; if (conf.instanceColor) conf.instanceColor.needsUpdate = true; }
    },
  };
  K.done(); api.reset(); return api;
}
