"""Original pan, broth and sizzling cues for the Pocha pot transition."""
from pathlib import Path
import wave

import numpy as np
from scipy.signal import butter, sosfilt

SR = 32000
OUT = Path(__file__).resolve().parents[1] / 'static/assets/audio/pocha'
rng = np.random.default_rng(20261010)


def band(x, lo, hi):
    return sosfilt(butter(3, [lo, hi], 'bandpass', fs=SR, output='sos'), x)


def save(name, signal):
    signal -= signal.mean()
    signal *= 0.7 / max(1e-9, np.max(np.abs(signal)))
    signal[:128] *= np.linspace(0, 1, 128)
    signal[-256:] *= np.linspace(1, 0, 256)
    with wave.open(str(OUT / f'transition_{name}.wav'), 'wb') as file:
        file.setnchannels(1)
        file.setsampwidth(2)
        file.setframerate(SR)
        file.writeframes((signal * 32767).astype('<i2').tobytes())


def pot_sweep(duration, pull=False):
    n = int(duration * SR)
    t = np.arange(n) / SR
    k = t / duration
    env = np.sin(np.pi * k) ** (1.2 if pull else 0.75)
    scrape = band(rng.normal(size=n), 65, 550) * 2.0
    sizzle = band(rng.normal(size=n), 1600, 6600) * 0.26
    tremolo = 0.7 + 0.3 * np.sin(2 * np.pi * (8 * t + 5 * t * t))
    return (scrape + sizzle * tremolo) * env


save('move', pot_sweep(0.77))
t = np.arange(int(0.36 * SR)) / SR
contact = band(rng.normal(size=len(t)), 130, 2600) * np.exp(-t * 31)
ring = sum(a * np.sin(2 * np.pi * f * t) * np.exp(-t * decay)
           for f, a, decay in ((184, 0.6, 15), (449, 0.22, 20), (728, 0.1, 27)))
save('land', contact + ring)
save('exit', pot_sweep(0.74, pull=True) * 0.82)
