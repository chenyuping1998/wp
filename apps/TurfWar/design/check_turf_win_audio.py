#!/usr/bin/env python3
"""Acceptance gate for the award-audio ladder.

2026-09-15: Turf War now ships Hard Time's win audio byte-for-byte (user request), so
this is Hard Time's gate pointed at turf/sfx. The previous ART_BRIEF §9.1 gate asserted
Turf War's own mono win set; its backup is in the session scratchpad."""

from hashlib import sha256
from pathlib import Path
import wave

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
SFX = ROOT / "static/assets/audio/turf/sfx"
NAMES = [
    "win_step_1", "win_step_2", "win_step_3", "win_step_4",
    "win_tier_big", "win_tier_super", "win_tier_mega", "win_tier_epic", "win_tier_max",
]
EXPECTED_SECONDS = [.62, .82, 1.02, 1.24, 1.62, 2.30, 3.05, 4.35, 5.65]


def analyse(path: Path):
    with wave.open(str(path)) as wav:
        assert (wav.getframerate(), wav.getsampwidth(), wav.getnchannels()) == (44100, 2, 2), path
        x = np.frombuffer(wav.readframes(wav.getnframes()), dtype="<i2").astype(float).reshape(-1, 2) / 32768
        sr = wav.getframerate()
    mono = x.mean(axis=1)
    spectrum = np.abs(np.fft.rfft(mono * np.hanning(len(mono)))) ** 2
    hz = np.fft.rfftfreq(len(mono), 1 / sr)
    total = max(spectrum.sum(), 1e-12)
    peak = np.max(np.abs(x))
    rms = np.sqrt(np.mean(x * x))
    return {
        "seconds": len(mono) / sr,
        "centroid": float((spectrum * hz).sum() / total),
        "presence": float(spectrum[(hz >= 700) & (hz <= 5000)].sum() / total),
        "harsh": float(spectrum[hz > 9000].sum() / total),
        "peak_db": float(20 * np.log10(max(peak, 1e-12))),
        "rms_db": float(20 * np.log10(max(rms, 1e-12))),
        "edge": float(max(abs(x[0]).max(), abs(x[-1]).max())),
        "digest": sha256(path.read_bytes()).hexdigest(),
    }


metrics = [analyse(SFX / f"{name}.wav") for name in NAMES]
for name, expected, metric in zip(NAMES, EXPECTED_SECONDS, metrics):
    assert abs(metric["seconds"] - expected) <= .015, (name, metric)
    assert metric["centroid"] >= 650, (name, metric)
    assert metric["presence"] >= .28, (name, metric)
    assert metric["harsh"] <= .08, (name, metric)
    assert -4.0 <= metric["peak_db"] <= -1.0, (name, metric)
    assert -30 <= metric["rms_db"] <= -10, (name, metric)
    assert metric["edge"] <= .01, (name, metric)

assert all(b["seconds"] > a["seconds"] for a, b in zip(metrics, metrics[1:])), metrics
assert len({metric["digest"] for metric in metrics}) == len(metrics)

coin = analyse(SFX / "coin_shimmer.wav")
assert 1.5 <= coin["seconds"] <= 1.7 and coin["edge"] <= .01, coin

for name, metric in zip(NAMES, metrics):
    print(
        f"{name:18} {metric['seconds']:.2f}s centroid={metric['centroid']:.0f}Hz "
        f"presence={metric['presence']:.1%} harsh={metric['harsh']:.2%} "
        f"peak={metric['peak_db']:.1f}dB rms={metric['rms_db']:.1f}dB"
    )
print("OK: nine-stage light award ladder is distinct, progressively longer, and mix-safe")
