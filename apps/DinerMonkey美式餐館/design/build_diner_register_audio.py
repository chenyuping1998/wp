"""Synthesize diner-specific cash-register anticipation cues at 112 BPM."""

from pathlib import Path
import wave

import numpy as np
from scipy.signal import butter, sosfilt

OUT = Path(__file__).resolve().parents[1] / "static" / "assets" / "audio" / "diner"
SR = 44100
RNG = np.random.default_rng(20261011)
BEAT = 60 / 112


def add(dst, at, sample, gain=1):
    start = round(at * SR)
    size = min(len(sample), len(dst) - start)
    if size > 0:
        dst[start:start + size] += sample[:size] * gain


def band_noise(length, lo, hi):
    raw = RNG.normal(0, 1, round(length * SR))
    sos = butter(2, (lo, hi), btype="bandpass", fs=SR, output="sos")
    return sosfilt(sos, raw)


def key_clack(tone=1):
    t = np.arange(round(.105 * SR)) / SR
    tap = band_noise(.105, 650, 4300) * np.exp(-t / .008)
    metal = np.sin(2 * np.pi * 640 * tone * t) * np.exp(-t / .025)
    body = np.sin(2 * np.pi * 170 * t) * np.exp(-t / .018)
    return .33 * tap + .18 * metal + .19 * body


def receipt_roller():
    t = np.arange(round(.26 * SR)) / SR
    paper = band_noise(.26, 600, 6200)
    envelope = np.minimum(1, t / .022) * np.exp(-t / .09)
    chatter = .7 + .3 * np.sin(2 * np.pi * 46 * t)
    return .14 * paper * envelope * chatter


def register_bell(duration=.45):
    t = np.arange(round(duration * SR)) / SR
    # Small service-counter bell with a bright attack and a short, soft tail.
    bell = sum(
        weight * np.sin(2 * np.pi * frequency * t) * np.exp(-t / decay)
        for frequency, weight, decay in ((1320, .65, .23), (2643, .27, .15), (3951, .11, .09))
    )
    strike = band_noise(duration, 1800, 8500) * np.exp(-t / .005)
    return .47 * bell + .1 * strike


def write(name, signal, peak):
    signal = signal.copy()
    edge = min(250, len(signal) // 4)
    signal[:edge] *= np.linspace(0, 1, edge)
    signal[-edge:] *= np.linspace(1, 0, edge)
    signal *= peak / max(1e-9, np.max(np.abs(signal)))
    path = OUT / name
    with wave.open(str(path), "wb") as target:
        target.setnchannels(1)
        target.setsampwidth(2)
        target.setframerate(SR)
        target.writeframes((np.clip(signal, -1, 1) * 32767).astype("<i2").tobytes())
    print(f"{name}: {len(signal) / SR:.3f}s")


loop = np.zeros(round(4 * BEAT * SR))
for i, beat_pos in enumerate((0, .5, 1, 1.75, 2.5, 3, 3.5)):
    add(loop, beat_pos * BEAT + .035, key_clack(1 + (i % 3) * .08), .78 if i % 2 else 1)
add(loop, 2.05 * BEAT, receipt_roller(), .9)
write("register_anticipation.wav", loop, .57)

pickup = np.zeros(round(.55 * SR))
add(pickup, .015, key_clack(), .85)
add(pickup, .075, register_bell(), .9)
write("register_pickup.wav", pickup, .64)
