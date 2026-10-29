"""The studio audience from real recordings, all CC0 (public domain), cut into pieces and layered:
  freesound.org (previews):  Kinoton 383207 (sitcom laughter 9x), HowardV 581528 (live comedy laughter), Evil_Ear_Recordings
    524775 (comedy laughter, Edinburgh), Sadiquecat 794349 (300 children laughing at a play), ehohnke 242244 and
    ChrisReierson 507983 (small group laughter), phmiller42 124996 and WhisperPotato 547589 ("aww"), noah0189 264499
    (game-show oohs and ahhs), HowardV 264376 (a small crowd gasping), jayfrosting 333405 (cheer), maplegirlie 254715
    (cheering), tec_studio 361557 and 361558 (applause)
  bigsoundbank.com:  #0019 applause, 150 people, studio
Put the files in tools/raw_crowd/ (fs<id>.mp3, bsb0019.mp3) and run  python tools/crowd_real.py  -> audio/sfx/*.mp3"""
import os, subprocess
HERE = os.path.dirname(os.path.abspath(__file__)); RAW = os.path.join(HERE, 'raw_crowd'); OUT = os.path.join(os.path.dirname(HERE), 'audio', 'sfx')
K, H, E, KIDS = 'fs383207', 'fs581528', 'fs524775', 'fs794349'
# name: [(file, start, length, volume, delay)], fade out
R = {
    'laugh_s1': [(K, 7.6, 2.5, 1, 0)], 'laugh_s2': [(K, 40.4, 2.1, 1, 0)], 'laugh_s3': [('fs242244', 0, 2.0, 1, 0)], 'laugh_s4': [('fs507983', 0, 2.3, 1, 0)],
    'laugh_m1': [(K, 10.9, 3.3, 1, 0), (H, 2, 3.3, 0.35, 0.1)], 'laugh_m2': [(K, 15.2, 2.7, 1, 0), (E, 7.0, 2.8, 0.4, 0)], 'laugh_m3': [(K, 19.2, 3.8, 1, 0)],
    'laugh_m4': [(K, 35.6, 3.5, 1, 0), (H, 5, 3.4, 0.35, 0.2)], 'laugh_m5': [(E, 7.0, 2.8, 1, 0), (K, 10.9, 3.0, 0.4, 0.15)], 'laugh_m6': [(E, 18.0, 3.2, 1, 0)],
    'laugh_b1': [(K, 0, 6.4, 1, 0), (H, 8, 6, 0.5, 0.2)], 'laugh_b2': [(K, 24.1, 4.2, 1, 0), (E, 0, 3.6, 0.6, 0.1)], 'laugh_b3': [(K, 30.0, 4.3, 1, 0), ('bsb0019', 3, 4, 0.3, 1.6)],
    'laugh_b4': [(KIDS, 0.3, 5.2, 1, 0), (K, 0, 5.5, 0.45, 0.2)],
    'aww1': [('fs124996', 0, 2.0, 1, 0), ('fs547589', 0, 1.2, 0.7, 0.12)], 'aww2': [('fs124996', 0, 2.0, 1, 0), ('fs124996', 0, 2.0, 0.6, 0.18)],
    'ooh1': [('fs264499', 2.27, 1.95, 1, 0)], 'ooh2': [('fs264499', 11.3, 1.7, 1, 0)], 'ooh3': [('fs264499', 6.05, 1.55, 1, 0)], 'ooh4': [('fs264376', 0, 2.4, 1, 0)],
    'cheer1': [('fs333405', 0, 4.0, 1, 0), ('bsb0019', 4, 5, 0.6, 0.3)], 'cheer2': [('fs254715', 42.5, 5.5, 1, 0), ('fs333405', 0, 3.5, 0.7, 0.2)],
    'applause1': [('fs361557', 0, 6.0, 1, 0)], 'applause2': [('fs361558', 0, 5.0, 1, 0)], 'applause3': [('bsb0019', 2, 4.5, 1, 0)], 'applause_long': [('bsb0019', 2, 9, 1, 0), ('fs361558', 0, 8.6, 0.5, 0.4)],
}
for name, parts in R.items():
    args = ['ffmpeg', '-y', '-loglevel', 'error']; fl = []
    for k, (f, ss, t, v, d) in enumerate(parts):
        args += ['-ss', str(ss), '-t', str(t), '-i', os.path.join(RAW, f + '.mp3')]
        fl.append(f'[{k}]aresample=44100,aformat=channel_layouts=stereo,afade=t=in:d=0.04,afade=t=out:st={max(0.1, t - 0.7)}:d=0.7,volume={v},adelay={int(d * 1000)}|{int(d * 1000)}[a{k}]')
    fl.append(''.join(f'[a{k}]' for k in range(len(parts))) + f'amix=inputs={len(parts)}:normalize=0,highpass=f=90,loudnorm=I=-17:TP=-1.5[o]')
    subprocess.run(args + ['-filter_complex', ';'.join(fl), '-map', '[o]', '-ar', '44100', '-b:a', '128k', os.path.join(OUT, name + '.mp3')], check=True); print('made', name)
