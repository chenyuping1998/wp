#!/usr/bin/env python3
"""Generate Turf War's low-fatigue §9.1 win-audio package."""

from pathlib import Path
import json
import wave

import numpy as np

SR = 44_100
ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "static/assets/audio/turf/sfx"
RNG = np.random.default_rng(20260910)


def envelope(seconds: float, attack: float = .006, release: float = .32) -> np.ndarray:
    n = round(seconds * SR)
    a = max(1, min(n, round(attack * SR)))
    r = max(1, min(n - a, round(release * SR)))
    e = np.ones(n)
    e[:a] = np.linspace(0, 1, a) ** .7
    e[-r:] *= np.linspace(1, 0, r) ** 2.2
    return e


def voice(freq: float, seconds: float, grit: float = .12) -> np.ndarray:
    t = np.arange(round(seconds * SR)) / SR
    phase = 2 * np.pi * np.cumsum(freq * (1 + .002 * np.sin(2 * np.pi * 4.8 * t))) / SR
    x = np.sin(phase) + grit * np.sin(2 * phase + .3) + grit * .28 * np.sin(3 * phase)
    return x * envelope(seconds)


def sub(seconds: float = .62, fundamental: float = 52) -> np.ndarray:
    t = np.arange(round(seconds * SR)) / SR
    phase = 2 * np.pi * np.cumsum(fundamental + 52 * np.exp(-t * 24)) / SR
    return np.sin(phase) * np.exp(-t * 6.8)


def metal(seconds: float = .18, center: float = 760) -> np.ndarray:
    t = np.arange(round(seconds * SR)) / SR
    noise = RNG.normal(0, 1, len(t))
    noise = noise - np.convolve(noise, np.ones(41) / 41, mode="same")
    ring = np.sin(2 * np.pi * center * t) + .35 * np.sin(2 * np.pi * center * 1.47 * t)
    return (ring * .7 + noise * .09) * np.exp(-t * 24) * envelope(seconds, .001, .14)


def hat(seconds: float = .08) -> np.ndarray:
    t = np.arange(round(seconds * SR)) / SR
    x = RNG.normal(0, 1, len(t))
    x -= np.convolve(x, np.ones(13) / 13, mode="same")
    return x * np.exp(-t * 58) * envelope(seconds, .001, .06)


def mix(length: float, events: list[tuple[float, np.ndarray, float]]) -> np.ndarray:
    out = np.zeros(round(length * SR))
    for at, sound, gain in events:
        start = round(at * SR)
        n = min(len(sound), len(out) - start)
        if n > 0:
            out[start:start + n] += sound[:n] * gain
    return out


def tier(name: str) -> tuple[np.ndarray, int]:
    cfg = {
        "big": (1.40, 49, (220,), (0, .34), 3),
        "super": (1.80, 55, (660, 880), (0, .28, .62), 5),
        "mega": (2.30, 61.7, (880, 1175, 1480), (0, .22, .44, .76), 8),
        "epic": (2.90, 65.4, (1320, 1760, 2200, 2860), (0, .20, .40, .66, .94), 11),
    }
    length, root, upper, hits, count = cfg[name]
    events: list[tuple[float, np.ndarray, float]] = []
    for i, at in enumerate(hits):
        events.append((at, sub(.58, root * (1 if i % 2 == 0 else 1.12)), 1.18))
        events.append((at + .018, voice(root * 2, .48, .05), .32))
        for j, hz in enumerate(upper):
            upper_gain = {"big": .10, "super": .36, "mega": .42, "epic": .46}[name]
            events.append((at + .014 * j, voice(hz, .44 + .04 * j, .05), upper_gain + .05 * j))
        events.append((at + .025, metal(.14, 610 + 170 * len(upper)), .10 + .025 * len(upper)))
    if name in ("mega", "epic"):
        for at in np.arange(.18, length - .35, .095 if name == "mega" else .072):
            events.append((float(at), hat(.055), .020 if name == "mega" else .026))
    if name == "super":
        events.append((.84, voice(330, .62, .08), .18))
    if name == "mega":
        events.append((1.18, voice(988, .72, .10), .22))
    if name == "epic":
        events.extend(((.70, voice(98, 1.70, .03), .30), (.70, voice(147, 1.70, .03), .20)))
        events.append((2.28, sub(.62, 43.7), 1.15))
    return mix(length, events), count


def max_win() -> np.ndarray:
    events = []
    for i, at in enumerate((0, .66, 1.34, 2.05, 2.72)):
        root = (44, 49, 55, 61.7, 65.4)[i]
        events += [(at, sub(.70, root), 1.0), (at + .02, voice(root * 4, .72, .10), .25)]
        events.append((at + .03, metal(.22, 680 + i * 170), .12))
    events += [(1.15, voice(110, 2.2, .03), .26), (1.15, voice(165, 2.2, .03), .18)]
    return mix(3.55, events)


def line_tick() -> np.ndarray:
    return mix(.18, [(0, metal(.16, 510), .36), (0, sub(.12, 92), .42)])


def coin_loop() -> np.ndarray:
    seconds = 1.6
    t = np.arange(round(seconds * SR)) / SR
    x = np.zeros_like(t)
    for hz, gain, phase in ((110, .30, 0), (220, .26, .5), (330, .20, 1.1), (550, .10, 1.7), (825, .04, 2.3)):
        exact = round(hz * seconds) / seconds
        trem = .60 + .40 * np.cos(2 * np.pi * 2 * t / seconds + phase)
        x += gain * trem * np.sin(2 * np.pi * exact * t + phase)
    seam = round(.008 * SR)
    x[:seam] *= np.linspace(0, 1, seam)
    x[-seam:] *= np.linspace(1, 0, seam)
    return x


def blast() -> np.ndarray:
    return mix(.92, [(0, sub(.82, 44), 1.25), (.012, voice(176, .62, .08), .30), (.018, metal(.24, 720), .14)])


def write(name: str, audio: np.ndarray, peak_db: float = -3.2) -> None:
    audio = np.nan_to_num(audio - np.mean(audio))
    target = 10 ** (peak_db / 20)
    audio *= target / max(1e-9, np.max(np.abs(audio)))
    pcm = np.int16(np.clip(audio, -1, 1) * 32767)
    OUT.mkdir(parents=True, exist_ok=True)
    with wave.open(str(OUT / name), "wb") as f:
        f.setparams((1, 2, SR, 0, "NONE", "not compressed"))
        f.writeframes(pcm.tobytes())


def main() -> None:
    counts = {}
    for name in ("big", "super", "mega", "epic"):
        audio, counts[name] = tier(name)
        write(f"win_tier_{name}.wav", audio)
    write("win_cap.wav", max_win())
    write("win_line_tick.wav", line_tick())
    write("coin_shimmer.wav", coin_loop(), -4.0)
    write("bigwin_blast.wav", blast(), -3.2)
    (ROOT / "design/turf-win-audio-voices.json").write_text(json.dumps(counts, indent=2) + "\n")


if __name__ == "__main__":
    main()
