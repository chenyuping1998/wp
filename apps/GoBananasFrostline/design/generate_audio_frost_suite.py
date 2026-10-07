"""Deterministic Frostline music and UI/gameplay cues. Run from any directory.

The two scene loops and five prize loops share a D-minor motif. Short cues use
the same ice/steel palette so reel stops, scatters and feature reveals belong
to one game. No preview files are written into the project.
"""
from pathlib import Path
import math
import wave

import numpy as np

OUT = Path(__file__).resolve().parents[1] / 'static/assets/audio/frost'
OUT.mkdir(parents=True, exist_ok=True)
SR = 22050
RNG = np.random.default_rng(20261003)


def hz(midi):
    return 440 * 2 ** ((midi - 69) / 12)


def add(dst, src, sec, level=1, wrap=False):
    pos = round(sec * SR)
    if wrap:
        pos %= len(dst)
        count = min(len(src), len(dst))
        first = min(count, len(dst) - pos)
        dst[pos:pos + first] += src[:first] * level
        if first < count:
            dst[:count - first] += src[first:count] * level
    elif pos < len(dst):
        n = min(len(src), len(dst) - pos)
        dst[pos:pos + n] += src[:n] * level


def write(name, data, peak=.78, loop=False):
    data = np.asarray(data, dtype=np.float64).copy()
    if loop:
        # Both sides approach zero across 12 ms; the seam is click-free and the
        # short attenuation is inaudible once per 15-40 second phrase.
        n = round(.012 * SR)
        data[:n] *= np.linspace(0, 1, n)
        data[-n:] *= np.linspace(1, 0, n)
    else:
        n = min(round(.004 * SR), len(data) // 3)
        if n:
            data[-n:] *= np.linspace(1, 0, n)
    mx = np.max(np.abs(data))
    if mx:
        data *= peak / mx
    pcm = (np.clip(data, -1, 1) * 32767).astype('<i2')
    with wave.open(str(OUT / name), 'wb') as wav:
        wav.setnchannels(1)
        wav.setsampwidth(2)
        wav.setframerate(SR)
        wav.writeframes(pcm.tobytes())
    print(f'{name}: {len(data) / SR:.2f}s, {mx:.2f} pre-normalize')


def ice(midi, dur=.9, bright=1):
    t = np.arange(round(dur * SR)) / SR
    f = hz(midi)
    # Inharmonic crystal partials over a low pitched core.
    phases = [0.3, 1.7, 2.6, .9]
    out = sum(a * np.sin(2 * np.pi * f * ratio * t + p) * np.exp(-decay * t)
              for ratio, a, decay, p in zip([1, 2.71, 4.08, 6.2],
                                            [.72, .25 * bright, .16 * bright, .07 * bright],
                                            [3.1, 6.8, 11, 18], phases))
    out *= np.minimum(1, t * 1100)
    return out


def bass(midi, dur=.45):
    t = np.arange(round(dur * SR)) / SR
    f = hz(midi)
    return (np.sin(2*np.pi*f*t) + .22*np.sin(2*np.pi*2*f*t)) * np.minimum(1, t*180) * np.exp(-5.5*t)


def pad(midis, dur):
    t = np.arange(round(dur * SR)) / SR
    env = np.minimum(1, t / .28) * np.minimum(1, (dur-t) / .38)
    out = np.zeros(len(t))
    for j, midi in enumerate(midis):
        f = hz(midi)
        out += (np.sin(2*np.pi*f*t + j*.43) + .18*np.sin(2*np.pi*(f*2.003)*t)) / len(midis)
    return out * np.maximum(0, env)


def click(dur=.12, colour=1):
    n = round(dur * SR)
    t = np.arange(n) / SR
    white = RNG.standard_normal(n)
    hp = white - np.convolve(white, np.ones(19)/19, mode='same')
    return hp * np.exp(-(31 + 8*colour)*t) * .28


def metal(dur=.5, root=65):
    t = np.arange(round(dur * SR)) / SR
    f = hz(root)
    out = sum(a*np.sin(2*np.pi*f*r*t+p)*np.exp(-d*t)
              for r,a,d,p in [(1,.45,5,0),(2.39,.29,8,1),(3.91,.19,12,2),(6.28,.1,17,.5)])
    return out * np.minimum(1, t*900)


def wind(dur, strength=.14):
    n = round(dur*SR)
    # Slow, periodic gusts avoid a static noise wash and also keep the loop seam.
    knots = RNG.normal(0, 1, max(4, math.ceil(dur*9)))
    knots = np.r_[knots[-2:], knots, knots[:2]]
    x = np.linspace(2, len(knots)-3, n)
    low = np.interp(x, np.arange(len(knots)), knots)
    t = np.arange(n)/SR
    gust = .6 + .3*np.sin(2*np.pi*t/7.5) + .1*np.sin(2*np.pi*t/2.7)
    return low * gust * strength


def scene_bgm(name, bpm, bars, feature):
    beat = 60/bpm
    length = bars*4*beat
    out = wind(length, .065 if feature else .05)
    progression = [
        ([50, 53, 57], 38),   # Dm
        ([46, 50, 53], 34),   # Bb
        ([53, 57, 60], 41),   # F
        ([48, 52, 55], 36),   # C
    ]
    motif = [74, 69, 77, 76, 74, 69, 72, 69,
             74, 77, 79, 77, 76, 72, 69, 72]
    for bar in range(bars):
        chord, root = progression[bar % 4]
        bar_at = bar*4*beat
        add(out, pad(chord, 4*beat), bar_at, .31 if feature else .36, True)
        for b in range(4):
            at = bar_at+b*beat
            if b in (0, 2):
                add(out, bass(root, .42), at, .27 if feature else .22, True)
            add(out, click(.1, .4), at, .11 if feature else .07, True)
            if feature:
                add(out, click(.07, 1), at+beat*.5, .075, True)
        # Motif repeats with four-bar harmonic motion and a rising answer.
        for step in range(8):
            if not feature and step in (3, 7):
                continue  # breathing room in the base game
            note = motif[(bar % 4)*4 + step//2]
            if step % 2:
                note -= 12 if not feature else 5
            add(out, ice(note, .5 if feature else .7, .72), bar_at+step*beat*.5,
                .14 if feature else .11, True)
        if feature and bar % 4 == 3:
            for k in range(4):
                add(out, click(.1, 1.3), bar_at+(3+k*.25)*beat, .18+.035*k, True)
    write(name, out, .59 if feature else .51, True)


scene_bgm('bgm_main.wav', 96, 16, False)
scene_bgm('bgm_freespin.wav', 128, 16, True)


def prize_bgm(name, rank):
    bpm = 118 + 5*rank
    beat = 60/bpm
    length = 8*4*beat
    out = wind(length, .045)
    roots = [38, 34, 41, 36, 38, 34, 36, 38]
    chords = [[50, 53, 57], [46, 50, 53], [53, 57, 60], [48, 52, 55]]
    melody = [74, 77, 81, 79, 77, 76, 74, 72, 74, 77, 79, 84, 81, 79, 77, 74]
    for bar in range(8):
        start = bar*4*beat
        add(out, pad(chords[bar % 4], 4*beat), start, .28, True)
        for b in range(4):
            at = start+b*beat
            add(out, bass(roots[bar], .32), at, .25+.025*rank, True)
            add(out, click(.09, 1), at, .11+.015*rank, True)
            if rank >= 2:
                add(out, click(.07, 1.3), at+beat*.5, .08, True)
            if rank >= 4:
                add(out, metal(.28, 65), at, .05, True)
        for step in range(8):
            if rank == 0 and step % 2:
                continue
            note = melody[(bar*2+step//4) % len(melody)] + (12 if rank >= 3 and step == 7 else 0)
            add(out, ice(note, .52, 1.05), start+step*beat*.5, .12+.017*rank, True)
    write(name, out, .56+.025*rank, True)


for i, name in enumerate(['big', 'superwin', 'mega', 'epic', 'max']):
    prize_bgm(f'bgm_winlevel_{name}.wav', i)


def cue(name, dur, events, peak=.77, airy=0):
    out = wind(dur, airy) if airy else np.zeros(round(dur*SR))
    for sec, signal, level in events:
        add(out, signal, sec, level)
    write(name+'.wav', out, peak, loop=name == 'reel_tension')


# UI and physical actions: immediate attacks and short tails.
cue('btn', .13, [(0, click(.09, 1.4), .9), (0, ice(86, .11), .12)], .45)
cue('spin', .58, [(0, click(.13, 1.2), .65), (.02, metal(.4, 62), .42), (.12, wind(.32, .2), 1)], .65)
cue('reel_tension', 2.0, [(.12, metal(1.3, 69), .28), (.72, metal(1.1, 76), .22)], .45, .17)
cue('pluck_low', .28, [(0, metal(.27, 53), .55)], .48)
cue('mult_update', .62, [(0, ice(81, .48), .6), (.14, ice(86, .45), .62)], .67)
cue('mult_combine', .8, [(0, ice(74, .45), .6), (.13, ice(81, .6), .7), (.3, metal(.4, 74), .4)], .71)
cue('mult_reset', .5, [(0, metal(.4, 50), .55), (.1, ice(69, .36), .22)], .58)
cue('mult_win', 1.35, [(0, ice(74, .9), .5), (.18, ice(77, .8), .55), (.36, ice(81, .9), .7)], .75)
cue('ice_burst', 1.1, [(0, click(.16, 1.7), 1.2), (.02, metal(.8, 50), .82), (.07, wind(.8, .34), 1), (.32, ice(86, .72), .3)], .84)
cue('wild_expand', 2.45, [(0, wind(2.2, .28), 1), (.24, click(.3, 1.4), .5), (.6, ice(74, 1.2), .42), (1.03, ice(81, 1.2), .5), (1.48, ice(86, .85), .8)], .83)
cue('grenade_blast', .94, [(0, click(.25, 1.9), 1), (.015, bass(38, .6), .85), (.07, wind(.75, .42), 1), (.18, metal(.6, 50), .45)], .87)
cue('gong_feature', 3.1, [(0, metal(2.6, 50), .8), (.04, ice(74, 2.8), .42), (.22, ice(81, 2.5), .28)], .85, .045)
cue('bigwin_blast', 2.3, [(0, click(.3, 1.8), .9), (0, bass(38, .9), .85), (.08, metal(1.8, 62), .7), (.3, ice(86, 1.6), .65)], .88)
cue('fs_intro', 2.7, [(0, metal(1.6, 50), .5), (.42, ice(74, 1.7), .55), (.82, ice(77, 1.6), .55), (1.25, ice(81, 1.4), .7), (1.72, click(.25, 1.4), .65)], .8, .07)
cue('coin_shimmer', 2.15, [(k*.13, ice(86+(k%4)*2, .7, .9), .28) for k in range(12)], .73)
cue('win_gliss', 1.35, [(k*.16, ice(n, .75), .43) for k,n in enumerate([69,72,74,77,81])], .72)
cue('win_gliss_big', 2.4, [(k*.21, ice(n, 1.15), .5) for k,n in enumerate([62,69,74,77,81,86,89])], .82)
cue('riser_short', .9, [(k*.12, click(.15, 1+k*.15), .22+k*.07) for k in range(6)] + [(.64, ice(81, .25), .4)], .55, .055)
cue('win_end', .95, [(0, metal(.75, 62), .45), (.07, ice(74, .7), .45), (.21, ice(69, .65), .35)], .62)
cue('win_standard', 1.45, [(0, ice(74, 1), .5), (.22, ice(77, 1), .5), (.44, ice(81, .9), .6)], .74)
cue('win_substantial', 2.25, [(k*.22, ice(n, 1.15), .43) for k,n in enumerate([69,74,77,81,86,89])], .8)
cue('youwon_panel', 1.8, [(0, metal(1.2, 62), .4), (.15, ice(81, 1.3), .5), (.4, ice(86, 1.2), .5)], .73)
cue('tumble_win', .9, [(0, ice(74, .7), .5), (.17, ice(81, .65), .5)], .65)

for k, note in enumerate([74, 77, 81, 86, 89], 1):
    cue(f'scatter_{k}', 1.08, [(0, click(.12, 1.3), .4), (.015, ice(note, .95, 1.2), .7),
                               (.26, metal(.62, note-12), .23)], .65 + k*.028)

print('Frostline suite written to', OUT)
