"""The transition's sliding shop door, in sound (2026-10-07). Original, synthesized.

  door_slide.wav   the two lattice doors pushed shut along their wooden track:
                   a low rolling rumble that speeds up, a dry track hiss, the
                   paper panes buzzing in their lattice (0.62s)
  door_clack.wav   the meeting stiles hitting: a hollow wooden knock (a few
                   damped body modes over a sharp contact click) with a short
                   lattice rattle after it (0.55s)
  door_open.wav    slid back open by hand: slower start, lighter, a soft cloth
                   swish of the noren lifting at the top (0.78s)

Deterministic (fixed seed), 32 kHz mono like design/generate_sushi_audio.py, so
it sits in the same set. Writes into static/assets/audio/sushi/.

  /Applications/anaconda3/bin/python3 design/generate_door_audio.py
"""
from pathlib import Path
import wave

import numpy as np
from scipy.signal import butter, sosfilt

APP = Path(__file__).resolve().parents[1]
OUT = APP / 'static/assets/audio/sushi'
SR = 32000
rng = np.random.default_rng(20261007)


def write(name, x):
    x = x / max(1e-6, np.abs(x).max()) * 0.82
    x[-64:] *= np.linspace(1, 0, 64)
    with wave.open(str(OUT / f'{name}.wav'), 'wb') as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((x * 32767).astype('<i2').tobytes())


def band(x, lo, hi):
    """Butterworth band-pass in Hz (lo=0 → low-pass)."""
    if lo <= 0:
        sos = butter(4, hi, 'lowpass', fs=SR, output='sos')
    else:
        sos = butter(4, [lo, hi], 'bandpass', fs=SR, output='sos')
    return sosfilt(sos, x)


def slide(dur, accel, bright, swish=0.0):
    n = int(SR * dur)
    t = np.arange(n) / SR
    k = t / dur
    # envelope: rises with speed, cut when the door stops
    speed = k ** accel
    env = np.minimum(1, k / 0.06) * (0.35 + 0.65 * speed) * np.minimum(1, (1 - k) / 0.04)
    # rolling rumble: wheels over track seams, rate follows speed
    phase = np.cumsum(18 + 46 * speed) / SR
    seams = 0.5 + 0.5 * np.sign(np.sin(phase * 2 * np.pi)) * 0.6
    rumble = band(rng.normal(0, 1, n), 40, 220) * 3.0 * seams
    # dry track hiss
    hiss = band(rng.normal(0, 1, n), 500, 1800 + 1400 * bright) * 0.55
    # paper panes buzzing in the lattice: a rough ~140 Hz amplitude flutter on mid noise
    buzz = band(rng.normal(0, 1, n), 250, 900) * (0.5 + 0.5 * np.sin(t * 2 * np.pi * 140)) * 0.35
    x = (rumble + hiss + buzz * speed) * env
    if swish:
        sw = band(rng.normal(0, 1, n), 900, 3500) * np.exp(-((k - 0.25) / 0.12) ** 2) * swish
        x += sw
    return x


def clack():
    dur = 0.55
    n = int(SR * dur)
    t = np.arange(n) / SR
    x = np.zeros(n)
    # hollow wooden body: damped modes, slightly inharmonic
    for f, a, d in ((182, 1.0, 26), (395, 0.7, 34), (731, 0.45, 48), (1184, 0.28, 70), (1890, 0.16, 95)):
        x += a * np.sin(2 * np.pi * f * t + rng.uniform(0, 6.28)) * np.exp(-t * d)
    # contact click
    click = rng.normal(0, 1, n) * np.exp(-t * 900)
    x += band(click, 600, 4000) * 2.0
    # lattice rattle: a few small ticks after the hit
    for at, g in ((0.045, 0.35), (0.09, 0.22), (0.14, 0.13), (0.2, 0.07)):
        i = int(at * SR)
        m = int(0.02 * SR)
        tick = rng.normal(0, 1, m) * np.exp(-np.arange(m) / SR * 380)
        x[i:i + m] += band(tick, 500, 2500) * g * 5
    return x


write('door_slide', slide(0.62, accel=1.6, bright=0.4))
write('door_clack', clack())
write('door_open', slide(0.78, accel=2.2, bright=0.2, swish=0.9) * 0.85)
print('wrote door_slide / door_clack / door_open into', OUT)
