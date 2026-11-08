"""Offline listen: one base spin that pays a small win, then a mega win, over the
128 BPM bed — the 11-01 cues first, then the 11-06 rhythm pass (same timeline).

  python design/preview_rhythm_20261106.py <folder with the 11-01 wavs>

Needs imageio_ffmpeg (or a shim) to decode the bed. Levels follow Sound.svelte:
music 0.7 x pref, ducked under the fanfare; effects at their runtime levels.
Writes design/source/sampled_audio_v1/preview/rhythm_20261106.wav and a
timeline json beside it. The grid maths is the runtime's (beatClock / toGrid).
"""
import json, subprocess, sys
from pathlib import Path
import numpy as np
import soundfile as sf
import imageio_ffmpeg

APP = Path(__file__).resolve().parent.parent
LIVE = APP / 'static/assets/audio/alchemy'
OUT = APP / 'design/source/sampled_audio_v1/preview'
BEFORE = Path(sys.argv[1])
SR = 44100
loops = json.loads((APP / 'src/game/sampledAudioLoops.json').read_text())


def bed(seconds):
    meta = loops['bgm_main']
    raw = subprocess.run([imageio_ffmpeg.get_ffmpeg_exe(), '-v', 'error', '-i', str(LIVE / 'bgm_main.mp3'), '-ar', str(SR), '-ac', '2', '-f', 'f32le', '-'], capture_output=True, check=True).stdout
    a = np.frombuffer(raw, '<f4').reshape(-1, 2).astype(np.float64)
    s = round(meta['trimStartSeconds'] * SR)
    a = a[s:s + meta['frames']]
    return np.tile(a, (int(seconds * SR / len(a)) + 1, 1))[:round(seconds * SR)]


def wav(folder, name):
    a, sr = sf.read(str(folder / (name + '.wav')), always_2d=True)
    assert sr == SR
    return a if a.shape[1] == 2 else np.repeat(a, 2, axis=1)


SIX = 60 / 128 / 4
def grid(t, div):  # next line of `div` per beat at or after t (Sound.toGrid / msToGrid)
    period = 60 / 128 / div
    k = np.ceil((t - .018) / period)
    return max(t, k * period)


def timeline(after):
    seconds = 12.0
    music = bed(seconds) * .49
    fx = np.zeros_like(music)
    duck = np.ones(len(music))
    events = []

    def put(folder, name, at, level):
        a = wav(folder, name) * level * .8
        i = round(at * SR)
        n = min(len(a), len(fx) - i)
        fx[i:i + n] += a[:n]
        events.append(dict(at=round(at, 4), cue=name, level=round(level, 3)))

    src = LIVE if after else BEFORE
    # five stops, 145ms apart (SPIN_OPTIONS reelSpinDelay)
    for i in range(1, 6):
        put(src, f'reel_stop_{i}', 1.30 + (i - 1) * .145, (.66 + (i - 1) * .05) if after else .5)
    win_at = 2.10
    if after:
        t0 = grid(win_at, 4)
        lands = {0: ('win_land_big', 3), 1: ('win_land_big', 3), 2: ('win_land', 2)}
        for reel in range(3):
            put(LIVE, f'win_step_{reel + 1}', t0 + reel * SIX, .5 + (reel + 1) * .05)
            name, count = lands[reel]
            put(LIVE, name, t0 + reel * SIX + 8 * SIX, min(.85, .55 + .07 * count))
        # round 2: the amount's 1s count-up ticks on the grid, then lands
        cu = grid(t0 + 2 * SIX + .95, 4)
        tick = wav(LIVE, 'win_rollup_loop')[:round(1.0 * SR)] * .42 * .8
        tick[-round(.12 * SR):] *= np.linspace(1, 0, round(.12 * SR))[:, None]
        fx[round(cu * SR):round(cu * SR) + len(tick)] += tick
        events.append(dict(at=round(cu, 4), cue='win_rollup_loop (light)', level=.42))
        put(LIVE, 'win_count_end', cu + 1.0, .7)
    else:
        put(BEFORE, 'win_gliss', win_at, .8)
    # the mega win: blast on the slam, fanfare on the next eighth, ticks on a sixteenth
    slam = 5.37
    put(src, 'bigwin_blast', slam, 1.05)
    fan = grid(slam, 2) if after else slam
    put(src, 'win_mega', fan, 1.2)
    duck[round(slam * SR):round((slam + 1.9) * SR)] = (.38 if after else .42) / .7
    roll = grid(slam, 4) if after else slam
    loop = wav(src, 'win_rollup_loop')
    end = 9.6
    a = np.tile(loop, (int((end - roll) * SR / len(loop)) + 2, 1))[:round((end - roll) * SR)] * .65 * .8
    a[-round(.12 * SR):] *= np.linspace(1, 0, round(.12 * SR))[:, None]
    fx[round(roll * SR):round(roll * SR) + len(a)] += a
    put(src, 'coin_shimmer', slam, .65)
    put(src, 'win_rollup_end', end + .12, .75)
    return music * duck[:, None] + fx, events


before, eb = timeline(False)
after, ea = timeline(True)
gap = np.zeros((round(.8 * SR), 2))
mixd = np.concatenate([before, gap, after])
mixd *= 10 ** (-1.5 / 20) / max(1e-9, np.max(np.abs(mixd)))
OUT.mkdir(parents=True, exist_ok=True)
sf.write(str(OUT / 'rhythm_20261106.wav'), mixd, SR, subtype='PCM_16')
(OUT / 'rhythm_20261106.json').write_text(json.dumps(dict(before=eb, after_starts_at=12.8, after=ea), indent=2) + '\n')
print('wrote', OUT / 'rhythm_20261106.wav')
