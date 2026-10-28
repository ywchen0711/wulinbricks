// Renders an episode to a video file for YouTube: every frame stepped exactly (no dropped frames whatever the machine),
// 1920x1080 at 30 frames a second, with the subtitles, cards and words over it, and the full soundtrack made offline
// (voices, sound effects, ambience). Needs Chrome, ffmpeg, and `npm install` (puppeteer-core).
//   node tools/render.mjs ep1                  -> renders/ep1.mp4 (Chinese subtitles)
//   node tools/render.mjs ep1 --lang en        -> renders/ep1.en.mp4
//   node tools/render.mjs ep1 --from 60 --to 70 (a piece, for checking)
import http from 'http'; import fs from 'fs'; import path from 'path'; import { spawn } from 'child_process';
import puppeteer from 'puppeteer-core';

const args = process.argv.slice(2), ep = args.find((a) => !a.startsWith('--')) || 'ep1', opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const lang = opt('lang', 'zh'), fps = +opt('fps', 30), W = +opt('w', 1920), H = +opt('h', 1080), from = +opt('from', 0), to = opt('to', null);
const CHROME = opt('chrome', process.platform === 'win32' ? 'C:/Program Files/Google/Chrome/Application/chrome.exe' : '/usr/bin/google-chrome');
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/(\w:)/, '$1')), '..');
fs.mkdirSync(path.join(ROOT, 'renders'), { recursive: true });
const OUT = path.join(ROOT, 'renders', `${ep}${lang === 'zh' ? '' : '.' + lang}${from || to ? `.${from}-${to}` : ''}.mp4`);

// a small server for the site
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.mp3': 'audio/mpeg', '.png': 'image/png', '.jpg': 'image/jpeg' };
const server = http.createServer((q, r) => { const p = path.join(ROOT, decodeURIComponent(q.url.split('?')[0])); if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'Content-Type': TYPES[path.extname(p)] || 'application/octet-stream' }); fs.createReadStream(p).pipe(r); });
await new Promise((ok) => server.listen(0, ok)); const port = server.address().port;

const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--autoplay-policy=no-user-gesture-required', '--enable-gpu', '--ignore-gpu-blocklist', '--use-angle=d3d11'] });
const page = await browser.newPage(); page.on('pageerror', (e) => console.error('page:', e.message));
await page.setViewport({ width: W, height: H, deviceScaleFactor: 1 });
await page.goto(`http://localhost:${port}/film.html?ep=${ep}&lang=${lang}`); await page.waitForFunction('window.DONE && window.FILM && FILM.S.voiceReady', { timeout: 120000 });
await page.evaluate(() => document.fonts.ready);
await page.addStyleTag({ content: '#start,#ctl,#cam,.hub-btn,#hub{display:none!important}' });
const len = await page.evaluate(() => FILM.EP.len), end = to != null ? +to : len;
console.log(`${ep}: ${len.toFixed(1)} s -> ${OUT}`);

// the soundtrack, first
const t0 = Date.now(); const wav64 = await page.evaluate(() => FILM.renderAudio()); const WAV = OUT.replace(/\.mp4$/, '.wav'); fs.writeFileSync(WAV, Buffer.from(wav64, 'base64')); console.log(`sound: ${((Date.now() - t0) / 1000).toFixed(0)} s`);

// then the pictures, piped into ffmpeg
const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-i', '-', '-ss', String(from), '-t', String(end - from), '-i', WAV, '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p', '-r', String(fps), '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11', '-ar', '48000', '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', '-shortest', OUT], { stdio: ['pipe', 'inherit', 'inherit'] });
await page.evaluate(() => FILM.renderStart());
let n = 0; const total = Math.ceil(end * fps), t1 = Date.now();
while (n < total) {
  await page.evaluate((fps) => FILM.renderFrame(fps), fps); n++;
  if (n / fps < from) continue;
  const img = await page.screenshot({ type: 'jpeg', quality: 92 });
  if (!ff.stdin.write(img)) await new Promise((ok) => ff.stdin.once('drain', ok));
  if (n % (fps * 10) === 0) { const el = (Date.now() - t1) / 1000, rate = n / el; console.log(`${(n / fps).toFixed(0)} / ${end.toFixed(0)} s   ${rate.toFixed(1)} frames/s   about ${((total - n) / rate / 60).toFixed(1)} min left`); }
}
ff.stdin.end(); await new Promise((ok) => ff.on('close', ok));
fs.unlinkSync(WAV); await browser.close(); server.close();
console.log(`done: ${OUT} (${(fs.statSync(OUT).size / 1e6).toFixed(0)} MB) in ${((Date.now() - t0) / 60000).toFixed(1)} min`);
