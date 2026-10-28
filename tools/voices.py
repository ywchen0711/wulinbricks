"""Records an episode's lines in the characters' voices (edge-tts neural voices) and measures each recording's loudness
30 times a second (0..100) for the mouths.

    node tools/lines.mjs ep1 > tools/lines.json
    python tools/voices.py tools/lines.json      # -> audio/ep1/NNN.mp3 and audio/ep1.json; lists lines that run into the next

Each character (by cast id) has a voice, a pitch and a speed; a feeling changes them a little (raised and quick when
angry or shouting, high when surprised or scared, slow and low when sad or thinking). Needs edge-tts and ffmpeg.
The storyteller and the Alliance chief share a voice, pitched apart: they are the same man.
"""
import asyncio, json, os, subprocess, sys, array

import edge_tts

HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)
VOICES = {  # cast id: (voice, pitch Hz, rate %)
    'baixian': ('zh-TW-YunJheNeural', -2, -8), 'situ': ('zh-TW-YunJheNeural', -16, -12),
    'changfeng': ('zh-CN-YunyangNeural', -6, -6), 'yirui': ('zh-CN-YunxiNeural', -3, 0), 'yishuo': ('zh-CN-YunxiaNeural', 2, 4),
    'tiewusi': ('zh-CN-YunjianNeural', -10, -4), 'guard1': ('zh-CN-YunjianNeural', -2, 8), 'guard2': ('zh-CN-YunyangNeural', 2, 10),
    'heixiong': ('zh-CN-YunjianNeural', -22, 2), 'daoba': ('zh-CN-YunyangNeural', -12, 6), 'shouhou': ('zh-CN-YunxiNeural', 18, 16),
    'abo': ('zh-CN-YunyangNeural', -18, -14), 'dashen': ('zh-CN-liaoning-XiaobeiNeural', 0, 6), 'xiaofan': ('zh-CN-YunxiNeural', 6, 4),
    'xiaotian': ('zh-CN-YunjianNeural', -14, -6),
}
FEEL = {'happy': (5, 4), 'excited': (12, 12), 'laugh': (6, 6), 'surprised': (16, 10), 'scared': (12, 12), 'sad': (-10, -10), 'worried': (-4, -4),
        'thinking': (-6, -8), 'shy': (2, -8), 'angry': (6, 12), 'shout': (10, 14), 'calm': (0, -4), 'proud': (3, 2)}

async def say(text, voice, pitch, rate, path):
    if os.path.exists(path) and os.path.getsize(path) > 0: return
    await edge_tts.Communicate(text, voice, rate=f'{rate:+d}%', pitch=f'{pitch:+d}Hz').save(path)

def envelope(path):
    raw = subprocess.run(['ffmpeg', '-loglevel', 'error', '-i', path, '-ac', '1', '-ar', '12000', '-f', 's16le', '-'], capture_output=True).stdout
    a = array.array('h'); a.frombytes(raw[: len(raw) // 2 * 2]); n = 400; out = []
    for i in range(0, len(a), n):
        seg = a[i:i + n]; out.append((sum(x * x for x in seg) / max(1, len(seg))) ** 0.5)
    peak = max(out) if out else 1
    return [round(min(100, v / peak * 130)) for v in out], len(a) / 12000

async def main():
    L = json.load(open(sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, 'lines.json'), encoding='utf-8'))
    ep = L['ep']; d = os.path.join(ROOT, 'audio', ep); os.makedirs(d, exist_ok=True)
    out = []
    for ln in L['lines']:
        v, p, r = VOICES.get(ln['cast'], ('zh-CN-YunxiNeural', 0, 0)); fp, fr = FEEL.get(ln['feel'], (0, 0))
        name = f"{ln['i']:03d}.mp3"; path = os.path.join(d, name)
        for attempt in range(4):
            try: await say(ln['text'], v, p + fp, r + fr, path); break
            except Exception as e: print('retry', ln['i'], e); await asyncio.sleep(2)
        env, dur = envelope(path)
        out.append({'i': ln['i'], 'file': f'{ep}/{name}', 'dur': round(dur, 2), 'env': env})
        print(f"{ln['i']:3d} {dur:5.2f}s {ln['cast']:10s} {ln['text']}")
    json.dump({'ep': ep, 'lines': out}, open(os.path.join(ROOT, 'audio', f'{ep}.json'), 'w', encoding='utf-8'), ensure_ascii=False)
    durs = json.dumps([o['dur'] for o in out])
    open(os.path.join(ROOT, 'js', 'films', f'{ep}.durs.js'), 'w', encoding='utf-8').write(
        f'// How long each line of {ep} runs as recorded (seconds), by line, written by tools/voices.py.\nexport const DURS = {durs};\n')
    # lines that run past the start of the next one
    for a, b, o in zip(L['lines'], L['lines'][1:], out):
        if a['t'] + o['dur'] + 0.2 > b['t']: print(f"OVERLAP line {a['i']} ({a['t']:.1f}+{o['dur']:.1f}s) runs into line {b['i']} at {b['t']:.1f} by {a['t'] + o['dur'] + 0.2 - b['t']:.1f}s")

asyncio.run(main())
