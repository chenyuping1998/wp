#!/usr/bin/env python3
"""Acceptance gate for ART_BRIEF §9.1 win-audio requirements."""

from pathlib import Path
import wave
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
SFX = ROOT / "static/assets/audio/capo/sfx"
TIERS = ["big", "super", "mega", "epic"]


def analyse(path: Path):
    with wave.open(str(path)) as w:
        assert (w.getframerate(), w.getsampwidth(), w.getnchannels()) == (44100, 2, 1), path
        x = np.frombuffer(w.readframes(w.getnframes()), dtype="<i2").astype(float) / 32768
        sr = w.getframerate()
    spectrum = np.abs(np.fft.rfft(x * np.hanning(len(x)))) ** 2
    hz = np.fft.rfftfreq(len(x), 1 / sr)
    total = max(spectrum.sum(), 1e-12)
    peak = np.max(np.abs(x))
    rms = np.sqrt(np.mean(x * x))
    return {
        "seconds": len(x) / sr,
        "centroid": float((spectrum * hz).sum() / total),
        "low": float(spectrum[hz < 300].sum() / total),
        "high": float(spectrum[hz > 4000].sum() / total),
        "harsh": float(spectrum[(hz >= 6000) & (hz <= 9000)].max(initial=0) / total),
        "peak_db": float(20 * np.log10(max(peak, 1e-12))),
        "crest_db": float(20 * np.log10(max(peak / max(rms, 1e-12), 1e-12))),
        "seam": float(abs(x[0] - x[-1])),
    }


metrics = {}
for name in TIERS:
    m = analyse(SFX / f"win_tier_{name}.wav")
    metrics[name] = m
    assert m["low"] >= .22, (name, m)
    assert m["high"] <= .04, (name, m)
    assert m["harsh"] <= .001, (name, m)
    assert m["peak_db"] <= -3.0, (name, m)
    assert m["crest_db"] >= 10.0, (name, m)

centroids = [metrics[name]["centroid"] for name in TIERS]
assert all(b - a >= 150 for a, b in zip(centroids, centroids[1:])), centroids

coin = analyse(SFX / "coin_shimmer.wav")
assert coin["centroid"] <= 1200 and coin["high"] <= .03 and coin["seam"] <= .001, coin
tick = analyse(SFX / "win_line_tick.wav")
assert tick["seconds"] <= .25, tick
cap = analyse(SFX / "win_cap.wav")
assert 3.0 <= cap["seconds"] <= 4.0, cap

for name, m in [*metrics.items(), ("coin", coin), ("tick", tick), ("cap", cap)]:
    print(f"{name:5} {m['seconds']:.2f}s centroid={m['centroid']:.0f}Hz low={m['low']:.1%} high={m['high']:.2%} peak={m['peak_db']:.1f}dB crest={m['crest_db']:.1f}dB")
print("OK: ART_BRIEF §9.1 win-audio acceptance gate")
