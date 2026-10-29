"""Makes the studio audience's sounds for the quiz show (audio/sfx/*.mp3): laughter, an "aww", an "ooh", cheering, and
applause, by layering many neural voices (edge-tts) at different pitches and moments, with claps synthesised under
them, in a room.   python tools/crowd.py      (needs edge-tts and ffmpeg)"""
import asyncio, os, random, subprocess, wave, struct, math
import edge_tts

HERE = os.path.dirname(os.path.abspath(__file__)); OUT = os.path.join(os.path.dirname(HERE), 'audio', 'sfx'); TMP = os.path.join(OUT, '_tmp')
os.makedirs(TMP, exist_ok=True)
VOICES = ['zh-CN-XiaoxiaoNeural', 'zh-CN-XiaoyiNeural', 'zh-CN-YunxiNeural', 'zh-CN-YunjianNeural', 'zh-TW-HsiaoChenNeural', 'zh-TW-HsiaoYuNeural',
          'zh-TW-YunJheNeural', 'zh-CN-YunyangNeural', 'zh-CN-liaoning-XiaobeiNeural', 'zh-CN-shaanxi-XiaoniNeural', 'zh-CN-YunxiaNeural']
SOUNDS = {  # name: (texts, how many voices, spread of start in seconds, applause seconds under it)
    'laugh1': (['哈哈哈哈！', '哈哈哈', '呵呵呵呵', '哈哈哈哈哈', '哈哈，哈哈哈'], 14, 0.35, 0),
    'laugh2': (['哈哈哈哈哈哈！', '哈哈哈哈哈', '呵呵呵呵呵呵', '哈哈哈哈，哈哈', '哈哈哈，哈哈哈'], 18, 0.5, 2.2),
    'laugh3': (['呵呵', '哈哈', '呵呵呵', '哈哈哈'], 10, 0.25, 0),
    'aww': (['喔～～', '噢～～', '喔～～～', '哇～～'], 14, 0.3, 0),
    'ooh': (['喔！', '哇！', '欸！', '喔喔！'], 12, 0.2, 0),
    'cheer': (['哇！', '耶！', '好棒！', '喔耶！', '太厲害了！', '哇喔！'], 16, 0.5, 4.0),
}
rnd = random.Random(7)

def claps(path, secs, density=26, sr=44100):
    n = int(sr * secs); buf = [0.0] * n
    for k in range(int(secs * density * 12)):
        t = rnd.random() * secs; env = min(1, t / 0.4) * min(1, (secs - t) / 1.2); i0 = int(t * sr)
        if rnd.random() > env: continue
        f = rnd.uniform(0.25, 0.7); amp = rnd.uniform(0.15, 0.4); lp = 0
        for j in range(int(sr * 0.03)):
            if i0 + j >= n: break
            w = rnd.uniform(-1, 1); lp += (w - lp) * f; buf[i0 + j] += (w - lp) * amp * math.exp(-j / (sr * 0.006))
    peak = max(1e-6, max(abs(v) for v in buf))
    with wave.open(path, 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr); w.writeframes(b''.join(struct.pack('<h', int(v / peak * 0.8 * 32767)) for v in buf))

async def main():
    for name, (texts, n, spread, clap) in SOUNDS.items():
        parts = []
        for i in range(n):
            v = VOICES[i % len(VOICES)]; text = rnd.choice(texts); p = rnd.randint(-25, 30); r = rnd.randint(0, 35)
            path = os.path.join(TMP, f'{name}_{i}.mp3')
            for a in range(6):
                if os.path.exists(path) and os.path.getsize(path) > 2000: break # made before
                try:
                    await asyncio.wait_for(edge_tts.Communicate(text, v, rate=f'+{r}%', pitch=f'{p:+d}Hz').save(path), 25)
                    if os.path.getsize(path) > 2000: break
                except Exception as e: print('retry', e); await asyncio.sleep(2)
                text = rnd.choice(texts) # some voices give nothing back for some laughs: try another
            if not os.path.exists(path) or os.path.getsize(path) <= 2000: continue
            parts.append((path, rnd.uniform(0, spread), rnd.uniform(0.35, 0.9), rnd.uniform(-0.8, 0.8)))
        if clap: cp = os.path.join(TMP, f'{name}_claps.wav'); claps(cp, clap); parts.append((cp, 0.15, 0.9, 0))
        args = ['ffmpeg', '-y', '-loglevel', 'error']
        for p, *_ in parts: args += ['-i', p]
        fl = []
        for k, (p, d, g, pan) in enumerate(parts):
            l, r = (1 - pan) / 2 + 0.25, (1 + pan) / 2 + 0.25
            fl.append(f'[{k}]aresample=44100,pan=stereo|c0={l:.2f}*c0|c1={r:.2f}*c0,volume={g:.2f},adelay={int(d * 1000)}|{int(d * 1000)}[a{k}]')
        fl.append(''.join(f'[a{k}]' for k in range(len(parts))) + f'amix=inputs={len(parts)}:normalize=0,lowpass=f=6500,aecho=0.8:0.6:45|90:0.25|0.15,loudnorm=I=-16[o]')
        args += ['-filter_complex', ';'.join(fl), '-map', '[o]', '-ar', '44100', '-b:a', '128k', os.path.join(OUT, f'{name}.mp3')]
        subprocess.run(args, check=True); print('made', name)
    # plain applause, short and long
    for name, secs in [('applause', 3.5), ('applause_long', 7)]:
        cp = os.path.join(TMP, f'{name}.wav'); claps(cp, secs)
        subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', cp, '-af', 'aecho=0.8:0.5:40|80:0.25|0.12,highpass=f=300,loudnorm=I=-18', '-ac', '2', '-b:a', '128k', os.path.join(OUT, f'{name}.mp3')], check=True); print('made', name)

asyncio.run(main())
