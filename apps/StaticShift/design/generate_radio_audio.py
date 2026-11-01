"""Static Shift audio: two music loops + the radio-studio cue set.

    python3 design/generate_radio_audio.py

Deterministic synthesis, no sampled recordings. Writes static/assets/audio/radio/.

HISTORY (2026-10-24, user: 「有怪怪的音效嗎」). The first version wrote the two
music loops and then re-made every file Sound.svelte points at as a generic
four-note chime — including bgm_main and bgm_freespin, which matched the same
'radio/…wav' pattern. Both music beds shipped as a 0.65 s chime on loop, and
25 cues (wins, scatters, alerts, "voices") were the same chime transposed. Now:

  * the music loops are written once, wrapped so the last bar's tails ring
    into the first (a seamless loop), and nothing else touches them;
  * every cue below is designed for its moment in a radio studio — dial
    detents, tape transport, FM static, station idents, an ON AIR alert;
  * the five contact cues (reel_stop, bandit_land, collect_stamp, tumbler_up,
    bigwin_slam) belong to design/generate_impact_audio.py and are skipped;
  * the big-win tiers escalate in length, voice count, register and drums.
"""
from pathlib import Path
import json
import wave

import numpy as np

SR = 44100
OUT = Path(__file__).resolve().parents[1] / 'static/assets/audio/radio'
OUT.mkdir(exist_ok=True)
rng = np.random.default_rng(8942026)
IMPACT = {'reel_stop', 'bandit_land', 'collect_stamp', 'tumbler_up', 'bigwin_slam'}
report = {}


# ── building blocks ─────────────────────────────────────────────────────────
def T(dur):
    return np.arange(int(dur * SR)) / SR


def mtof(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def env(t, a=0.004, d=8.0):
    return np.minimum(1, t / max(a, 1e-4)) * np.exp(-d * t)


def osc(f, t, kind='sine', bright=6):
    """band-limited-ish: saw/square from a few harmonics, so nothing aliases"""
    ph = 2 * np.pi * f * t if np.isscalar(f) else 2 * np.pi * np.cumsum(f) / SR
    if kind == 'sine':
        return np.sin(ph)
    if kind == 'tri':
        return sum(((-1) ** k) * np.sin((2 * k + 1) * ph) / (2 * k + 1) ** 2 for k in range(4)) * 0.81
    if kind == 'saw':
        return sum(np.sin(n * ph) / n for n in range(1, bright + 1)) * 0.6
    if kind == 'square':
        return sum(np.sin((2 * k + 1) * ph) / (2 * k + 1) for k in range(bright // 2 + 1)) * 0.8
    raise ValueError(kind)


def band(x, lo, hi):
    """FFT band-pass"""
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(len(x), 1 / SR)
    X[(f < lo) | (f > hi)] = 0
    return np.fft.irfft(X, len(x))


def lowpass(x, hi):
    return band(x, 0, hi)


def noise(n):
    return rng.normal(0, 1, n)


def tail(x, frac=0.35):
    """raised-cosine fade over the last `frac` of x: noise never stops dead"""
    n = max(1, int(len(x) * frac))
    x = x.copy()
    x[-n:] *= 0.5 + 0.5 * np.cos(np.linspace(0, np.pi, n))
    return x


def reverb(x, size=1.1, mix=0.22, tone=5000):
    """convolution with a decaying, darkened noise tail"""
    ir_t = T(size)
    ir = tail(lowpass(noise(len(ir_t)), tone) * np.exp(-ir_t * 6.5 / size), 0.4)
    ir[0] = 0
    ir /= np.sqrt((ir ** 2).sum()) + 1e-9
    n = len(x) + len(ir)
    wet = np.fft.irfft(np.fft.rfft(x, n) * np.fft.rfft(ir, n), n)[: len(x) + len(ir) - 1]
    out = np.zeros(len(wet))
    out[: len(x)] += x * (1 - mix)
    return out + wet * mix * 1.6


def put(dst, x, at, gain=1.0, wrap=False):
    i = int(at * SR)
    if wrap:
        idx = (np.arange(len(x)) + i) % len(dst)
        np.add.at(dst, idx, x * gain)
        return
    n = min(len(x), len(dst) - i)
    if n > 0:
        dst[i:i + n] += x[:n] * gain


def crackle(n, density=40, amp=0.3):
    x = np.zeros(n)
    k = rng.integers(0, n, int(density * n / SR))
    x[k] = rng.normal(0, amp, len(k))
    return band(x, 1500, 9000)


def chime(m, dur=0.6, d=6, kind='sine', gain=1.0):
    t = T(dur)
    f = mtof(m)
    x = osc(f, t, kind) + 0.35 * osc(f * 2.0, t) * np.exp(-t * d * 1.5) + 0.12 * osc(f * 3.01, t) * np.exp(-t * d * 2.5)
    return tail(x * env(t, 0.003, d), 0.25) * gain


def brass(m, dur, gain=1.0, cutoff=3200):
    t = T(dur)
    f = mtof(m) * (1 + 0.004 * np.sin(2 * np.pi * 5.2 * t))  # a touch of vibrato
    x = osc(f, t, 'saw', 10)
    a = np.minimum(1, t / 0.03) * np.minimum(1, (dur - t) / 0.08).clip(0, 1)
    return tail(lowpass(x * a, cutoff), 0.12) * gain


def kick(dur=0.35, f0=52, amt=2.6):
    t = T(dur)
    return np.sin(2 * np.pi * (f0 * t + amt * (1 - np.exp(-t * 30)))) * np.exp(-t * 11)


def snare(dur=0.25):
    t = T(dur)
    return band(noise(len(t)), 900, 7000) * np.exp(-t * 22) * 0.6 + np.sin(2 * np.pi * 190 * t) * np.exp(-t * 30) * 0.4


def hat(dur=0.08):
    t = T(dur)
    return band(noise(len(t)), 6000, 14000) * np.exp(-t * 60)


def cymbal(dur=1.6):
    t = T(dur)
    return tail(band(noise(len(t)), 3500, 15000) * np.exp(-t * 2.6) * np.minimum(1, t / 0.002), 0.4)


def sweep(f0, f1, dur, kind='sine', curve=2.0):
    t = T(dur)
    f = f0 + (f1 - f0) * (t / dur) ** curve
    return osc(f, t, kind)


def static_bed(dur, lo=800, hi=5000, flutter=7.0):
    t = T(dur)
    return band(noise(len(t)), lo, hi) * (0.6 + 0.4 * np.sin(2 * np.pi * flutter * t + rng.uniform(0, 6)))


def save(name, x, peak=0.85, loud=None, loop=False):
    """loud: target dBFS of the loudest 50 ms; otherwise peak-normalised.
    loop: the file wraps onto itself — no edge fades, they would dip at the seam"""
    x = np.asarray(x, float)
    x = x - x.mean()
    if not loop:
        fade = min(len(x), int(0.006 * SR))
        x[-fade:] *= np.linspace(1, 0, fade)      # no click at the end
        x[:32] *= np.linspace(0, 1, 32)          # nor at the start
    if loud is not None:
        w = int(0.05 * SR)
        r = np.sqrt(np.convolve(x * x, np.ones(w) / w, 'valid').max())
        x *= 10 ** (loud / 20) / max(r, 1e-9)
        if np.abs(x).max() > 0.95:
            x *= 0.95 / np.abs(x).max()
    else:
        x *= peak / max(np.abs(x).max(), 1e-9)
    with wave.open(str(OUT / (name + '.wav')), 'wb') as w:
        w.setparams((1, 2, SR, 0, 'NONE', 'not compressed'))
        w.writeframes((np.clip(x, -1, 1) * 32767).astype('<i2').tobytes())
    w50 = int(0.05 * SR)
    report[name] = {
        'sec': round(len(x) / SR, 2),
        'peak': round(float(np.abs(x).max()), 3),
        'loud50ms_dB': round(20 * np.log10(np.sqrt(np.convolve(x * x, np.ones(w50) / w50, 'valid').max()) + 1e-9), 1),
    }


# ── music: the two beds (unchanged design, now a seamless wrap) ─────────────
def tone(freq, dur=0.2, decay=12):
    t = T(dur)
    return (np.sin(2 * np.pi * freq * t) + 0.2 * np.sin(2 * np.pi * freq * 2.005 * t)) * np.exp(-decay * t) * np.minimum(1, t / 0.004)


notes = [48, 55, 58, 62, 44, 51, 55, 58, 46, 53, 56, 60, 43, 50, 53, 57]
for feature, bpm in [(False, 92), (True, 112)]:
    beat = 60 / bpm
    x = np.zeros(int(32 * beat * SR))
    for bar in range(8):
        chord = notes[(bar % 4) * 4:(bar % 4 + 1) * 4]
        for n in chord:
            put(x, tone(mtof(n + 12), beat * 3.95, 1.9), bar * 4 * beat, 0.045, wrap=True)
        for k in range(8):
            at = (bar * 4 + k / 2) * beat
            pitch = chord[0] + (12 if k % 4 == 3 else 0)
            put(x, tone(mtof(pitch), beat * 0.49, 9), at, 0.15, wrap=True)
            put(x, hat(0.13) * 0.9, at, 0.012 if k % 2 == 0 else 0.018, wrap=True)
        for k in [0, 2]:
            put(x, kick(0.23, 48, 2), (bar * 4 + k) * beat, 0.17, wrap=True)
        for k in [1, 3]:
            put(x, snare(0.18) * 0.7, (bar * 4 + k) * beat, 0.05, wrap=True)
        if feature or bar % 2:
            for k, n in enumerate([chord[2] + 24, chord[1] + 24, chord[3] + 24]):
                put(x, tone(mtof(n), 0.35, 9), (bar * 4 + 2 + k * 0.5) * beat, 0.038, wrap=True)
    # a thread of tape hiss and vinyl-ish crackle: the studio is never silent
    x = np.tanh(x * 1.3) * 0.8 + band(noise(len(x)), 2000, 9000) * 0.0025 + crackle(len(x), 6, 0.05)
    save('bgm_freespin' if feature else 'bgm_main', x, loud=-17, loop=True)


# ── the cue set ────────────────────────────────────────────────────────────
cues = {}

# UI: a hardware switch (two contacts, a body knock), short and dry
t = T(0.09)
x = np.zeros(len(t))
put(x, band(noise(220), 2500, 9000) * np.exp(-np.arange(220) / 30), 0, 0.9)
put(x, band(noise(220), 1800, 6000) * np.exp(-np.arange(220) / 40), 0.018, 0.5)
put(x, np.sin(2 * np.pi * 420 * T(0.05)) * np.exp(-T(0.05) * 90), 0, 0.5)
cues['btn'] = (x, -22)

# SPIN: the tape transport engages — motor whirr rising, capstan thunk
x = np.zeros(int(0.55 * SR))
put(x, sweep(90, 420, 0.5, 'saw', 1.4) * env(T(0.5), 0.02, 3) * 0.35, 0)
put(x, band(noise(int(0.5 * SR)), 300, 2500) * np.sin(np.pi * T(0.5) / 0.5) ** 2 * 0.25, 0)
put(x, kick(0.12, 110, 1.2) * 0.6, 0)
cues['spin'] = (x, -19)

# SCATTER 1-5: a Tape Deck lands — cassette clunk + a rising ident note,
# each reel a step up C minor pentatonic, each a little longer and wider
scale = [60, 63, 65, 67, 70]
for i in range(5):
    dur = 0.8 + 0.1 * i
    x = np.zeros(int(dur * SR))
    put(x, kick(0.15, 95, 1.0) * 0.5 + band(noise(int(0.15 * SR)), 1500, 6000) * np.exp(-T(0.15) * 40) * 0.4, 0)
    m = scale[i] + 12
    put(x, chime(m, dur - 0.05, 4.5, 'tri'), 0.03, 0.7)
    put(x, chime(m + 7, dur - 0.1, 5.5, 'sine'), 0.05, 0.3 + 0.05 * i)
    if i >= 2:
        put(x, chime(m + 12, dur - 0.15, 6, 'sine'), 0.07, 0.2)
    cues[f'scatter_{i + 1}'] = (reverb(x, 1.0, 0.25), -16 + 0.6 * i)

# SIGNAL PACK lands: a short station blip through a burst of static
x = np.zeros(int(0.28 * SR))
put(x, tail(static_bed(0.2, 1200, 6000, 30) * np.exp(-T(0.2) * 18), 0.5) * 0.5, 0)
put(x, chime(84, 0.22, 16, 'square') * 0.5, 0.02)
cues['sack_land'] = (x, -20)

# RELAY collects: a tuning sweep — the whistle of a dial passing stations
x = sweep(500, 2400, 0.42, 'sine', 1.6) * env(T(0.42), 0.02, 3.5) * 0.5
x = x + static_bed(0.42, 1500, 6000, 18) * np.sin(np.pi * T(0.42) / 0.42) * 0.25
cues['collect_grab'] = (x, -19)

# each pack arriving at the Relay: a bright counter ping (pitched up per pack)
x = np.zeros(int(0.32 * SR))
put(x, chime(88, 0.32, 13, 'sine'), 0)
put(x, chime(95, 0.2, 18, 'sine'), 0, 0.4)
cues['coin_in'] = (x, -21)

# DIAL detent tick: a tiny resonant click
t = T(0.07)
x = band(noise(len(t)), 2000, 8000) * np.exp(-t * 140) * 0.8 + np.sin(2 * np.pi * 1300 * t) * np.exp(-t * 70) * 0.4
cues['dial_tick'] = (x, -24)

# REEL TENSION (loops under the last reels): FM static breathing on a
# 4 Hz pulse with a low warning tone. Built so the ends meet: integer cycles.
dur = 2.0
t = T(dur)
pulse = 0.55 + 0.45 * np.sin(2 * np.pi * 4 * t)
x = band(noise(len(t)), 900, 4500) * pulse * 0.35
x += np.sin(2 * np.pi * 110 * t) * 0.25 + np.sin(2 * np.pi * 165 * t) * 0.12 * pulse
# the noise is made periodic by band-filtering in the FFT (a circular filter),
# and 4 Hz / 110 Hz / 165 Hz all complete whole cycles in 2.0 s: x wraps cleanly
cues['reel_tension'] = (x, -20)

# FREE SPINS TRIGGER BELL: the ON AIR alert — two-tone studio chime, twice
x = np.zeros(int(1.7 * SR))
for k, (a, b) in enumerate([(76, 81), (76, 81)]):
    put(x, chime(a, 0.5, 5, 'sine'), k * 0.55, 0.8)
    put(x, chime(b, 0.6, 4.5, 'sine'), k * 0.55 + 0.18, 0.9)
put(x, tail(static_bed(1.7, 1500, 5000, 6) * np.minimum(1, T(1.7) / 0.1), 0.5) * 0.04, 0)
cues['alarm_bell'] = (reverb(x, 1.3, 0.3), -15)

# SCATTER WIN (during the trigger): the signal locks — sweep up into a held
# chord with a tremolo, like a carrier coming in clear
x = np.zeros(int(1.3 * SR))
put(x, sweep(300, 1200, 0.35, 'tri', 1.5) * env(T(0.35), 0.01, 1) * 0.4, 0)
for m in [72, 75, 79]:
    put(x, chime(m, 0.95, 2.8, 'tri') * (0.75 + 0.25 * np.sin(2 * np.pi * 9 * T(0.95))), 0.3, 0.45)
cues['alarm_trip'] = (reverb(x, 1.2, 0.28), -16)

# BUY / SUPER SPIN WHOOSH: tape fast-forward whoosh
x = band(noise(int(0.6 * SR)), 400, 6000) * np.sin(np.pi * T(0.6) / 0.6) ** 1.5 * 0.6
x += sweep(200, 900, 0.6, 'saw', 1.2) * np.sin(np.pi * T(0.6) / 0.6) ** 2 * 0.15
cues['sack_throw'] = (x, -19)

# TRANSITION: the shutter comes down — tape rewinding, pitch falling
x = band(noise(int(0.8 * SR)), 300, 5000) * np.sin(np.pi * T(0.8) / 0.8) * 0.5
x += sweep(900, 140, 0.8, 'saw', 0.7) * np.sin(np.pi * T(0.8) / 0.8) * 0.2
cues['shutter_down'] = (x, -18)

# STAMP: the big studio switch thrown, a body thunk and a relay clack
x = np.zeros(int(0.6 * SR))
put(x, kick(0.45, 60, 1.8) * 0.9, 0)
put(x, band(noise(int(0.08 * SR)), 1500, 8000) * np.exp(-T(0.08) * 60), 0, 0.7)
put(x, band(noise(int(0.06 * SR)), 2500, 9000) * np.exp(-T(0.06) * 80), 0.05, 0.4)
cues['shutter_slam'] = (reverb(x, 0.6, 0.15), -14)

# BUY BONUS PRESS: the power comes up — a hum, a mic pop, a rising tone
x = np.zeros(int(0.75 * SR))
put(x, kick(0.2, 80, 1.5) * 0.7, 0)
put(x, (np.sin(2 * np.pi * 60 * T(0.6)) * 0.3 + np.sin(2 * np.pi * 120 * T(0.6)) * 0.2) * np.exp(-T(0.6) * 4), 0)
put(x, sweep(400, 1600, 0.5, 'tri', 1.3) * env(T(0.5), 0.05, 3) * 0.35, 0.12)
cues['safe_open'] = (x, -16)

# FREE SPINS INTRO JINGLE: the station ident — brass motif over a hit
x = np.zeros(int(2.6 * SR))
motif = [(67, 0.0, 0.22), (72, 0.22, 0.22), (75, 0.44, 0.22), (79, 0.66, 1.4)]
for m, at, d in motif:
    put(x, brass(m, d, 0.5), at)
    put(x, brass(m - 12, d, 0.25), at)
for m in [60, 63, 67]:
    put(x, brass(m, 1.5, 0.18, 2200), 0.66)
put(x, kick(0.4) * 0.8, 0.66)
put(x, cymbal(1.8) * 0.25, 0.66)
put(x, snare() * 0.4, 0.0)
put(x, snare() * 0.4, 0.22)
put(x, snare() * 0.5, 0.44)
cues['fs_intro'] = (reverb(x, 1.6, 0.25), -13)

# SMALL / MID WIN: bright two- and three-note chimes
x = np.zeros(int(0.7 * SR))
put(x, chime(79, 0.5, 7, 'sine'), 0)
put(x, chime(84, 0.6, 6, 'sine'), 0.09)
cues['win_small'] = (reverb(x, 0.9, 0.2), -19)
x = np.zeros(int(1.0 * SR))
for k, m in enumerate([79, 84, 88]):
    put(x, chime(m, 0.75, 5, 'sine'), k * 0.08)
put(x, chime(67, 0.9, 3, 'tri') * 0.4, 0.16)
cues['win_mid'] = (reverb(x, 1.0, 0.22), -17)

# COUNT-UP START: the dial spins — ticks accelerating then settling
x = np.zeros(int(1.5 * SR))
times = np.cumsum(np.linspace(0.11, 0.035, 26))
times = times[times < 1.35]
for k, at in enumerate(times):
    tk = tail(band(noise(int(0.05 * SR)), 2000, 8000) * np.exp(-T(0.05) * 150) + np.sin(2 * np.pi * (900 + 15 * k) * T(0.05)) * np.exp(-T(0.05) * 90) * 0.5, 0.4)
    put(x, tk, at, 0.6)
cues['bill_counter'] = (x, -22)

# FREE SPINS TOTAL PANEL: the sign-off — a warm resolved chord and a bell
x = np.zeros(int(1.8 * SR))
for m in [60, 64, 67, 72]:
    put(x, brass(m, 1.2, 0.2, 2400), 0.05)
put(x, chime(84, 1.5, 2.5, 'sine') * 0.7, 0)
put(x, chime(91, 1.2, 3.5, 'sine') * 0.3, 0.02)
cues['cash_register'] = (reverb(x, 1.5, 0.3), -15)

# WIN END (count-up finished): a short button-up chord
x = np.zeros(int(1.2 * SR))
for m in [72, 76, 79]:
    put(x, chime(m, 1.0, 3.5, 'tri'), 0.0, 0.5)
put(x, kick(0.3) * 0.4, 0)
cues['win_cap'] = (reverb(x, 1.2, 0.25), -16)


# BIG-WIN TIERS: one recipe, five rungs. Each rung is longer, adds a voice,
# climbs in register and fills the drums in more; the top two add a cymbal
# swell and a final stab.
def fanfare(level):
    dur = [1.7, 2.1, 2.6, 3.1, 3.7][level]
    x = np.zeros(int((dur + 0.3) * SR))
    root = 60 + [0, 2, 3, 5, 7][level]
    steps = [0, 7, 12] if level < 2 else [0, 4, 7, 12] if level < 4 else [0, 4, 7, 12, 16]
    step_t = 0.16 - 0.015 * level
    for k, iv in enumerate(steps):
        put(x, brass(root + iv, step_t * 1.3, 0.45), k * step_t)
    hold = len(steps) * step_t
    voices = [root, root + 4, root + 7] + ([root + 12] if level >= 1 else []) + ([root + 16] if level >= 3 else [])
    for m in voices:
        put(x, brass(m, dur - hold, 0.22, 2600 + 300 * level), hold)
        if level >= 2:
            put(x, brass(m - 12, dur - hold, 0.12, 1800), hold)
    put(x, chime(root + 24, dur - hold, 1.8, 'sine') * 0.35, hold)
    beats = np.arange(0, dur - 0.2, [0.4, 0.3, 0.25, 0.2, 0.16][level])
    for k, at in enumerate(beats):
        put(x, kick(0.3) * 0.5, at)
        if k % 2 == 1:
            put(x, snare() * 0.35, at)
        if level >= 2:
            put(x, hat() * 0.5, at + 0.5 * (beats[1] - beats[0]) if len(beats) > 1 else at)
    if level >= 3:
        put(x, tail(cymbal(dur) * np.linspace(0.05, 0.5, int(dur * SR)), 0.25) * 0.6, 0)
        for m in voices[:3]:
            put(x, brass(m + 12, 0.35, 0.3, 3600), dur - 0.35)
        put(x, kick(0.5) * 0.9, dur - 0.35)
    return reverb(x, 1.4 + 0.2 * level, 0.25)


for level, name in enumerate(['win_big', 'win_super', 'win_mega', 'win_epic', 'win_max']):
    cues[name] = (fanfare(level), -14 + 0.6 * level)

# The two mascot voice slots are not called by Static Shift's cast; they get
# short radio stingers rather than staying chimes, in case a beat uses them.
x = np.zeros(int(0.9 * SR))
for m in [72, 76, 79, 84]:
    put(x, brass(m, 0.6, 0.25, 3000), 0.0)
put(x, tail(static_bed(0.3, 1500, 6000, 25) * np.exp(-T(0.3) * 8), 0.5) * 0.3, 0)
cues['voice_laugh'] = (reverb(x, 1.0, 0.25), -16)
x = np.zeros(int(0.4 * SR))
put(x, brass(67, 0.25, 0.4, 3000), 0)
put(x, brass(72, 0.2, 0.4, 3000), 0.1)
cues['voice_hup'] = (x, -18)

for name, (x, loud) in cues.items():
    if name in IMPACT:
        continue
    save(name, x, loud=loud, loop=name == 'reel_tension')

(Path(__file__).parent / 'qa/RADIO_AUDIO.json').write_text(json.dumps(report, indent=1))
print(f'music loops + {len(cues)} cues written to {OUT.relative_to(Path(__file__).resolve().parents[1])}')
