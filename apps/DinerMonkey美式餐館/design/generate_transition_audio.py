"""Original flutter, slap and peel cues for the diner's thrown flyer."""
from pathlib import Path
import wave

import numpy as np
from scipy.signal import butter, sosfilt

SR = 32000
OUT = Path(__file__).resolve().parents[1] / 'static/assets/audio/diner'
rng = np.random.default_rng(20261010)


def band(x, lo, hi):
    return sosfilt(butter(3, [lo, hi], 'bandpass', fs=SR, output='sos'), x)


def save(name, signal):
    signal -= signal.mean()
    signal *= 0.66 / max(1e-9, np.max(np.abs(signal)))
    signal[:128] *= np.linspace(0, 1, 128)
    signal[-256:] *= np.linspace(1, 0, 256)
    with wave.open(str(OUT / f'flyer_{name}.wav'), 'wb') as file:
        file.setnchannels(1)
        file.setsampwidth(2)
        file.setframerate(SR)
        file.writeframes((signal * 32767).astype('<i2').tobytes())


def flutter(duration, pull=False):
    n = int(duration * SR)
    t = np.arange(n) / SR
    k = t / duration
    wind = band(rng.normal(size=n), 900, 6300) * 0.35
    env = np.sin(np.pi * k) ** (1.2 if pull else 0.7)
    signal = wind * env
    # Three light folds of paper catch the air. No low track rumble or
    # mechanical scrape: this should never resemble the old sliding doors.
    marks = (0.08, 0.28, 0.52) if not pull else (0.04, 0.19, 0.35)
    for at in marks:
        start = round(at * SR)
        length = round(0.08 * SR)
        flick = band(rng.normal(size=length), 650, 5500)
        flick *= np.exp(-np.arange(length) / SR * 48)
        signal[start:start + length] += flick * (0.65 if pull else 0.82)
    return signal


save('flight', flutter(0.81))
t = np.arange(int(0.28 * SR)) / SR
slap = band(rng.normal(size=len(t)), 360, 4800) * np.exp(-t * 42)
slap += band(rng.normal(size=len(t)), 110, 480) * np.exp(-t * 55) * 0.22
save('land', slap)
save('peel', flutter(0.68, pull=True) * 0.8)
