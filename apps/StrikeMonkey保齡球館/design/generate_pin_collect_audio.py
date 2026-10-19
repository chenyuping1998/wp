"""Original cues for the Bowler's pin collection (2026-10-18).

  pin_clack.wav  a maple pin knocking into the Bowler: a dry wooden click on
                 top of a short tuned body (C5, with the wood's inharmonic
                 partials), so the client can step it up a pentatonic scale
                 with playbackRate and the collection plays as a little run.
  pin_whoosh.wav the pin tumbling off its cell: a short airy swish that
                 rises and fades — quiet, under the clacks.

Deterministic; synthesized, no samples.

    python design/generate_pin_collect_audio.py
"""
from pathlib import Path
import wave

import numpy as np
from scipy.signal import butter, sosfilt

SR = 44100
OUT = Path(__file__).resolve().parents[1] / 'static/assets/audio/strike'
rng = np.random.default_rng(20261018)


def write(name, x):
    x = x / max(1e-9, np.max(np.abs(x))) * 0.89
    x[-64:] *= np.linspace(1, 0, 64)
    data = (x * 32767).astype('<i2')
    with wave.open(str(OUT / name), 'wb') as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(data.tobytes())
    print(name, f'{len(x) / SR:.3f}s')


def band(x, lo, hi, order=3):
    return sosfilt(butter(order, [lo, hi], btype='bandpass', fs=SR, output='sos'), x)


# ── pin_clack ──────────────────────────────────────────────────────────────
n = int(SR * 0.32)
t = np.arange(n) / SR
f0 = 523.25  # C5
# wood: the fundamental plus the bar's stretched partials, each dying faster
body = (np.sin(2 * np.pi * f0 * t) * np.exp(-t / 0.075)
        + 0.45 * np.sin(2 * np.pi * f0 * 2.76 * t) * np.exp(-t / 0.035)
        + 0.22 * np.sin(2 * np.pi * f0 * 5.40 * t) * np.exp(-t / 0.018))
# the knock: a hard, short, band-limited click at contact
click = band(rng.normal(size=n), 1800, 7000) * np.exp(-t / 0.006) * 0.9
thump = np.sin(2 * np.pi * 140 * t) * np.exp(-t / 0.02) * 0.5
clack = body * 0.8 + click + thump
clack *= np.minimum(1, t / 0.0015)
write('pin_clack.wav', clack)

# ── pin_whoosh ─────────────────────────────────────────────────────────────
n = int(SR * 0.24)
t = np.arange(n) / SR
k = t / t[-1]
noise = rng.normal(size=n)
# a band that sweeps up as the pin leaves: two filtered passes crossfaded
lo = band(noise, 500, 1800)
hi = band(noise, 1500, 5200)
sweep = lo * (1 - k) + hi * k
env = np.sin(np.pi * np.clip(k, 0, 1)) ** 1.6
# the tumble: a soft flutter at the pin's spin rate
env *= 0.75 + 0.25 * np.sin(2 * np.pi * 22 * t)
write('pin_whoosh.wav', sweep * env * 0.6)
