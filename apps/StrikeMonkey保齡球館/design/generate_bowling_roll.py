"""Make the short lane roll used while the transition bowling ball enters.

Original synthesized cue, deterministic and timed to TransitionAnimation's
900 ms entrance. The low wooden rumble and small lane-seam taps fade before
the cover clack, which fires about 80 ms after the ball reaches centre.
"""
from pathlib import Path
import wave

import numpy as np
from scipy.signal import butter, sosfilt

SR = 32000
DURATION = 0.90
OUT = Path(__file__).resolve().parents[1] / 'static/assets/audio/strike/bowling_roll.wav'
rng = np.random.default_rng(20261010)
n = round(SR * DURATION)
t = np.arange(n) / SR
k = t / DURATION


def band_noise(lo, hi):
    sos = butter(3, [lo, hi], btype='bandpass', fs=SR, output='sos')
    return sosfilt(sos, rng.normal(size=n))


# Match the ball's smoothstep motion: still at the edges, fastest mid-lane.
speed = 6 * k * (1 - k)
speed = np.clip(speed, 0, 1.5)
envelope = (0.2 + 0.8 * speed) * np.minimum(1, t / 0.035)
envelope *= np.minimum(1, (DURATION - t) / 0.07)

# Heavy ball on varnished wood: rumble carries the weight, a little dry
# grain keeps it readable on small speakers without becoming a whoosh.
rumble = band_noise(48, 270) * 2.5
wood_grain = band_noise(280, 1050) * 0.7
body = np.sin(2 * np.pi * (78 * t + 0.9 * np.sin(2 * np.pi * 7 * t))) * 0.12
audio = (rumble + wood_grain + body) * envelope

# Faint, irregular floor-board contacts. These sit inside the roll instead of
# sounding like separate pin strikes.
for at, strength in ((0.12, 0.10), (0.27, 0.13), (0.43, 0.15),
                     (0.58, 0.13), (0.73, 0.10)):
    start = round(at * SR)
    length = round(0.035 * SR)
    tap = rng.normal(size=length) * np.exp(-np.arange(length) / SR * 135)
    tap = sosfilt(butter(2, [95, 650], btype='bandpass', fs=SR, output='sos'), tap)
    audio[start:start + length] += tap * strength

audio -= np.mean(audio)
audio *= 0.7 / max(1e-9, np.max(np.abs(audio)))
audio[-64:] *= np.linspace(1, 0, 64)
OUT.parent.mkdir(parents=True, exist_ok=True)
with wave.open(str(OUT), 'wb') as output:
    output.setnchannels(1)
    output.setsampwidth(2)
    output.setframerate(SR)
    output.writeframes((audio * 32767).astype('<i2').tobytes())
print(OUT)
