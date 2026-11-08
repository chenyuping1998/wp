"""Saucer Monkey: the cues that carry the rhythm, rebuilt so a phone can play them (2026-11-06).

User: 動態跟動畫跟音效節奏要更強. Measured first: the reel stop, the big-win slam, the collect stamp, the FG
level impact, the sack landing, the shutter and door hits and the small-win chime all had 95-97% of their energy
below 400 Hz (generate_saucer_audio.py builds them from a 110 Hz "wood" tone). Phone and laptop speakers roll off
under ~300-400 Hz, so the beats the animation lands on were close to silent — the same fault the ninja's stops had
(memory gobananinja-info-reelstop-20261101). The collection's tractor bed was 0% above 400 Hz.

This script runs AFTER generate_saucer_audio.py and build_collection_audio.py (package.json audio:build) and
overwrites only those cues, plus the new ones the symbol acts and the trigger tell play:

    act_rise    the symbol leaving its card: a short rising air whoosh
    act_land    the symbol landing back: a small card "tock"
    sym_h1      ray gun: a falling "pew" with crackle
    sym_h2      helmet antenna spring: boing
    sym_h3      foil hat tuning in: a warbling signal
    sym_h4      moon soda: cap pop and fizz
    sym_w       the captain: a theremin "woo-oo"
    sym_s       golden saucer: a rising saucer warble
    tease_blip  the captain's sensor pricking up (the trigger tell)

Every percussive cue keeps a little low body but puts most of its energy at 500 Hz - 5 kHz; check_punch_audio
(at the end) fails the run if any of them is under 55% above 400 Hz. Original synthesis, no samples.
"""
from pathlib import Path
import wave

import numpy as np

APP = Path(__file__).resolve().parents[1]
OUT = APP / 'static/assets/audio/saucer'
SR = 44100
rng = np.random.default_rng(20261106)


def T(d):
    return np.arange(round(d * SR)) / SR


def write(name, a, peak=0.65):
    a = np.nan_to_num(a)
    n = len(a)
    # 3 ms fade in, 20 ms fade out: no clicks at the ends
    ramp = np.minimum(1, np.arange(n) / (0.003 * SR)) * np.minimum(1, (n - 1 - np.arange(n)) / (0.02 * SR)).clip(0, 1)
    a = a * ramp
    a = a / max(1e-9, np.max(np.abs(a))) * peak
    with wave.open(str(OUT / f'{name}.wav'), 'wb') as f:
        f.setparams((1, 2, SR, n, 'NONE', 'not compressed'))
        f.writeframes((a * 32767).astype('<i2').tobytes())


def bandnoise(d, lo, hi):
    """white noise band-limited in the frequency domain"""
    n = round(d * SR)
    spec = np.fft.rfft(rng.normal(0, 1, n))
    fr = np.fft.rfftfreq(n, 1 / SR)
    spec *= (fr >= lo) & (fr <= hi)
    out = np.fft.irfft(spec, n)
    return out / max(1e-9, np.max(np.abs(out)))


def sweep(d, f0, f1, curve=4.0, harm=(1.0,)):
    """a tone gliding f0 -> f1 (exponential-ish), with optional harmonics"""
    t = T(d)
    k = 1 - np.exp(-curve * t / d)
    k /= max(1e-9, k[-1])
    f = f0 + (f1 - f0) * k
    ph = 2 * np.pi * np.cumsum(f) / SR
    return sum(a * np.sin((i + 1) * ph) for i, a in enumerate(harm))


def dec(d, rate):
    return np.exp(-rate * T(d))


def place(dst, src, at):
    i = round(at * SR)
    n = min(len(src), len(dst) - i)
    if n > 0:
        dst[i:i + n] += src[:n]


# ── the beats ───────────────────────────────────────────────────────────────
def tock(d, body_hz, drop=0.55, click=0.5, sub=0.18, ring=0.0):
    """a percussive hit: noise click + a pitched body that drops + a little sub; optional metallic ring"""
    a = np.zeros(round(d * SR))
    place(a, bandnoise(0.012, 1800, 7000) * dec(0.012, 260) * click, 0)
    place(a, sweep(d, body_hz, body_hz * drop, 6, (1, 0.35, 0.12)) * dec(d, 22) * 0.9, 0.001)
    place(a, sweep(d, 150, 95, 5) * dec(d, 18) * sub, 0)
    if ring:
        t = T(d)
        place(a, (np.sin(2 * np.pi * 1180 * t) + 0.6 * np.sin(2 * np.pi * 1870 * t) + 0.3 * np.sin(2 * np.pi * 2960 * t)) * dec(d, 9) * ring, 0.004)
    return a


def reel_stop():
    # a firm wooden "tock" on the reel frame: body 640 Hz dropping, crisp click
    return tock(0.16, 640, 0.6, click=0.55, sub=0.16)


def bigwin_slam():
    d = 0.62
    a = tock(d, 520, 0.5, click=0.9, sub=0.3, ring=0.35)
    # the plaque's sheet metal shivering
    place(a, bandnoise(0.25, 2200, 6000) * dec(0.25, 16) * 0.22, 0.01)
    return a


def collect_stamp():
    d = 0.3
    a = tock(d, 520, 0.5, click=0.7, sub=0.14)
    place(a, bandnoise(0.06, 900, 3200) * dec(0.06, 55) * 0.45, 0.002)
    return a


def fg_level_impact():
    d = 0.42
    a = tock(d, 560, 0.52, click=0.8, sub=0.26, ring=0.22)
    place(a, bandnoise(0.18, 1500, 5200) * dec(0.18, 20) * 0.2, 0.006)
    return a


def sack_land():
    return tock(0.22, 470, 0.62, click=0.3, sub=0.14)


def shutter_slam():
    d = 0.45
    a = tock(d, 600, 0.6, click=0.9, sub=0.12)
    t = T(d)
    place(a, np.sign(np.sin(2 * np.pi * 38 * t)) * bandnoise(d, 900, 4200) * dec(d, 12) * 0.3, 0.01)
    return a


def door_clack():
    a = tock(0.2, 820, 0.7, click=0.8, sub=0.1)
    place(a, tock(0.12, 1020, 0.7, click=0.5, sub=0) * 0.6, 0.055)
    return a


def win_small():
    # a bright two-note chime up a fourth (D5 -> G5) — the small-win "ding" a phone can play
    d = 0.5
    a = np.zeros(round(d * SR))
    for i, f in enumerate((587.3, 784.0)):
        t = T(0.42)
        tone = np.sin(2 * np.pi * f * t) + 0.32 * np.sin(2 * np.pi * f * 2.0 * t) + 0.12 * np.sin(2 * np.pi * f * 3.01 * t)
        place(a, tone * dec(0.42, 9) * 0.6, i * 0.085)
    return a


def scatter(step):
    # a rising ladder, one rung per scatter; each rung an octave-doubled bell with a saucer glide on top
    d = 0.5
    notes = [74, 77, 81, 84, 86]
    f = 440 * 2 ** ((notes[step] - 69) / 12)
    t = T(d)
    bell = np.sin(2 * np.pi * f * t) + 0.45 * np.sin(2 * np.pi * f * 2.0 * t) + 0.18 * np.sin(2 * np.pi * f * 3.98 * t)
    a = bell * dec(d, 6.5) * 0.6
    a += sweep(d, f * 0.75, f * 1.5, 3, (1, 0.2)) * dec(d, 7) * 0.22
    place(a, bandnoise(0.01, 2500, 8000) * 0.25, 0)
    return a


def tractor_loop():
    # periodic over 1.6 s: every frequency and modulation completes whole cycles at the boundary
    # (all multiples of 1/1.6 = 0.625 Hz), so the Web Audio loop stays seamless
    d = 1.6
    t = T(d)
    hum = sum(np.sin(2 * np.pi * f * t + 0.12 * np.sin(2 * np.pi * 5 * t)) / k for k, f in enumerate((130, 195, 390), 1))
    # the beam's audible voice: a soft warbling pair a phone can carry
    warble = np.sin(2 * np.pi * 520 * t + 2.2 * np.sin(2 * np.pi * 5 * t)) + 0.55 * np.sin(2 * np.pi * 780 * t + 1.6 * np.sin(2 * np.pi * 5 * t))
    a = 0.3 * hum + 0.7 * warble * (0.75 + 0.25 * np.cos(2 * np.pi * 2.5 * t))
    n = len(t)
    spec = np.exp(1j * rng.uniform(0, 2 * np.pi, n // 2 + 1))
    fr = np.fft.rfftfreq(n, 1 / SR)
    spec *= (fr >= 900) & (fr <= 3200)
    air = np.fft.irfft(spec, n)
    a += air / max(1e-9, np.max(np.abs(air))) * 0.08
    return a


# ── the symbol acts ─────────────────────────────────────────────────────────
def act_rise():
    d = 0.26
    a = np.zeros(round(d * SR))
    t = T(d)
    env = np.sin(np.pi * np.minimum(1, t / d)) ** 1.5
    # noise that sweeps upward: filter by mixing bands with moving weights
    lo, hi = bandnoise(d, 500, 1400), bandnoise(d, 1400, 4200)
    k = t / d
    place(a, (lo * (1 - k) + hi * k) * env * 0.5, 0)
    place(a, sweep(d, 420, 980, 2, (1, 0.25)) * env * 0.35, 0)
    return a


def act_land():
    return tock(0.17, 760, 0.62, click=0.45, sub=0.08)


def sym_h1():
    d = 0.42
    a = np.zeros(round(d * SR))
    # pew: a bright falling zap, square-ish, with crackle
    place(a, sweep(d, 2600, 320, 5, (1, 0, 0.33, 0, 0.2)) * dec(d, 7.5) * 0.7, 0)
    crack = bandnoise(d, 2500, 9000) * (rng.random(round(d * SR)) < 0.012) * 3
    place(a, crack * dec(d, 10) * 0.35, 0)
    return a


def sym_h2():
    d = 0.5
    t = T(d)
    f = 430 * (1 + 0.32 * np.exp(-6 * t) * np.sin(2 * np.pi * 15 * t)) * (1 + 0.25 * np.exp(-9 * t))
    ph = 2 * np.pi * np.cumsum(f) / SR
    return (np.sin(ph) + 0.45 * np.sin(2 * ph) + 0.2 * np.sin(3 * ph)) * dec(d, 5.5) * 0.7


def sym_h3():
    d = 0.52
    t = T(d)
    f = 920 + 160 * np.sin(2 * np.pi * 17 * t) + 300 * t / d
    ph = 2 * np.pi * np.cumsum(f) / SR
    gate = 0.6 + 0.4 * (np.sin(2 * np.pi * 34 * t) > 0)
    a = (np.sin(ph) + 0.3 * np.sin(2 * ph)) * gate * np.sin(np.pi * t / d) ** 0.8 * 0.6
    a += bandnoise(d, 2500, 6000) * 0.05 * np.sin(np.pi * t / d)
    return a


def sym_h4():
    d = 0.55
    a = np.zeros(round(d * SR))
    # the cap pop: a hollow knock and a quick upward blip
    place(a, tock(0.08, 980, 1.25, click=0.9, sub=0) * 0.8, 0)
    # fizz: high hiss with sparse bubble ticks, dying away
    fz = bandnoise(d - 0.03, 3000, 9000) * 0.18
    ticks = np.zeros(len(fz))
    for at in rng.uniform(0, d - 0.08, 26):
        place(ticks, sweep(0.012, 2600 + 1800 * rng.random(), 4200, 2) * dec(0.012, 250), at)
    place(a, (fz + ticks * 0.35) * dec(d - 0.03, 5), 0.03)
    return a


def sym_w():
    d = 0.46
    t = T(d)
    f = np.interp(t, [0, 0.12, 0.3, d], [620, 930, 760, 700]) * (1 + 0.012 * np.sin(2 * np.pi * 6.2 * t))
    ph = 2 * np.pi * np.cumsum(f) / SR
    return (np.sin(ph) + 0.2 * np.sin(2 * ph)) * np.minimum(1, t / 0.03) * np.exp(-2.6 * t) * 0.7


def sym_s():
    d = 0.6
    t = T(d)
    f = (560 + 520 * (t / d) ** 0.8) + 130 * np.sin(2 * np.pi * 9 * t)
    ph = 2 * np.pi * np.cumsum(f) / SR
    a = (np.sin(ph) + 0.35 * np.sin(2 * ph)) * np.sin(np.pi * t / d) ** 0.7 * 0.6
    a += bandnoise(d, 1200, 4000) * 0.06 * np.sin(np.pi * t / d)
    return a


def tease_blip():
    d = 0.3
    a = np.zeros(round(d * SR))
    for i, f in enumerate((1320, 1760)):
        t = T(0.07)
        place(a, (np.sin(2 * np.pi * f * t) + 0.2 * np.sin(4 * np.pi * f * t)) * np.sin(np.pi * t / 0.07) * 0.6, i * 0.11)
    return a


CUES = {
    'reel_stop': reel_stop, 'bigwin_slam': bigwin_slam, 'collect_stamp': collect_stamp,
    'fg_level_impact': fg_level_impact, 'sack_land': sack_land, 'shutter_slam': shutter_slam,
    'door_clack': door_clack, 'win_small': win_small, 'tractor_loop': tractor_loop,
    **{f'scatter_{i + 1}': (lambda i=i: scatter(i)) for i in range(5)},
    'act_rise': act_rise, 'act_land': act_land, 'sym_h1': sym_h1, 'sym_h2': sym_h2, 'sym_h3': sym_h3,
    'sym_h4': sym_h4, 'sym_w': sym_w, 'sym_s': sym_s, 'tease_blip': tease_blip,
}
PEAK = {'tractor_loop': 0.32, 'act_rise': 0.5, 'act_land': 0.55}


def hi_share(a):
    s = np.abs(np.fft.rfft(a)) ** 2
    fr = np.fft.rfftfreq(len(a), 1 / SR)
    return s[fr > 400].sum() / max(1e-12, s.sum())


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    bad = []
    for name, make in CUES.items():
        a = make()
        write(name, a, PEAK.get(name, 0.65))
        share = hi_share(a)
        print(f'{name:16s} {len(a) / SR:5.2f}s  {share * 100:5.1f}% above 400 Hz')
        if share < 0.55:
            bad.append(name)
    if bad:
        raise SystemExit(f'check_punch_audio: under 55% above 400 Hz (a phone will barely play it): {", ".join(bad)}')
    print(f'saucer punch audio: {len(CUES)} cues written to {OUT}')


if __name__ == '__main__':
    main()
