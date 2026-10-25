#!/usr/bin/env python3
"""Generate the §9.1 low-fatigue Capo Nostra win sound package.

All deliverables are deterministic, royalty-free, 44.1 kHz / 16-bit / mono.
The four ladder cues add real voices at each tier rather than re-pitching one cue.
"""

from pathlib import Path
import json
import math
import wave

import numpy as np

SR = 44_100
ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "static/assets/audio/capo/sfx"
RNG = np.random.default_rng(19330910)


def tone(freq: float, seconds: float, brightness: float = 0.25) -> np.ndarray:
    t = np.arange(round(seconds * SR)) / SR
    # Brass-like but deliberately dark: energy-bearing partials stop below 4 kHz.
    x = np.sin(2 * np.pi * freq * t)
    for harmonic, gain in ((2, brightness), (3, brightness * .38), (4, brightness * .14)):
        x += gain * np.sin(2 * np.pi * freq * harmonic * t + harmonic * .17)
    return x


def env(seconds: float, attack: float = .018, release: float = .34) -> np.ndarray:
    n = round(seconds * SR)
    a = min(n, max(1, round(attack * SR)))
    r = min(n - a, max(1, round(release * SR)))
    e = np.ones(n)
    e[:a] = np.linspace(0, 1, a) ** .7
    e[-r:] *= np.linspace(1, 0, r) ** 2.4
    return e


def voice(freq: float, seconds: float, brightness: float = .2) -> np.ndarray:
    t = np.arange(round(seconds * SR)) / SR
    vibrato = 1 + .0025 * np.sin(2 * np.pi * 5.1 * t)
    phase = 2 * np.pi * np.cumsum(freq * vibrato) / SR
    x = np.sin(phase) + brightness * np.sin(2 * phase + .2) + brightness * .32 * np.sin(3 * phase)
    return x * env(seconds)


def drum(seconds: float = .55, fundamental: float = 62) -> np.ndarray:
    t = np.arange(round(seconds * SR)) / SR
    f = fundamental + 38 * np.exp(-t * 25)
    phase = 2 * np.pi * np.cumsum(f) / SR
    return np.sin(phase) * np.exp(-t * 8.5)


def mix(length: float, events: list[tuple[float, np.ndarray, float]]) -> np.ndarray:
    out = np.zeros(round(length * SR))
    for start, audio, gain in events:
        at = round(start * SR)
        n = min(len(audio), len(out) - at)
        if n > 0:
            out[at:at + n] += audio[:n] * gain
    return out


def tier(which: str) -> tuple[np.ndarray, int]:
    cfg = {
        "big": (1.45, [196, 247], [0, .19, .38], 3),
        "super": (1.85, [220, 277, 330], [0, .17, .34, .72], 5),
        "mega": (2.35, [247, 311, 370, 494], [0, .15, .30, .56, .86], 8),
        "epic": (2.95, [277, 349, 415, 554, 698], [0, .14, .28, .52, .78, 1.04], 11),
    }
    length, horns, hits, voice_count = cfg[which]
    events: list[tuple[float, np.ndarray, float]] = []
    # Upright-bass root: every tier retains physical low-frequency weight.
    root = {"big": 55, "super": 65, "mega": 73.4, "epic": 82.4}[which]
    for i, at in enumerate(hits):
        events.append((at, voice(root * (1 if i % 2 == 0 else 1.5), .48, .08), .88))
        events.append((at, drum(.42, root), .78))
        for j, hz in enumerate(horns):
            events.append((at + .012 * j, voice(hz, .48 + .06 * j, .16 + .035 * j), .23))
    if which in ("super", "mega", "epic"):
        # Sax response, pitched higher per tier to make the cues structurally distinct.
        response = {"super": 440, "mega": 587, "epic": 784}[which]
        events.append((length * .49, voice(response, length * .34, .24), .20))
    # Distinct acoustic upper voices separate the spectral identities without
    # removing the bass foundation. These are reeds/brass registers, not a
    # re-pitched copy of the same mix.
    accents = {
        "big": (),
        "super": ((660, .55), (825, .35)),
        "mega": ((880, .62), (1175, .44)),
        "epic": ((1175, .82), (1568, .62)),
    }[which]
    for i, (hz, gain) in enumerate(accents):
        events.append((.16 + i * .19, voice(hz, length * .48, .16), gain))
    if which in ("mega", "epic"):
        # Timpani roll, still entirely below the harshness band.
        for at in np.linspace(length * .58, length * .78, 7 if which == "mega" else 10):
            events.append((float(at), drum(.34, root * .82), .23))
    if which == "epic":
        # Organ/choir-like low sustain and a final physical impact.
        events += [(.72, voice(110, 1.72, .05), .30), (.72, voice(165, 1.72, .05), .20)]
        events.append((2.31, drum(.62, 48), 1.15))
    return mix(length, events), voice_count


def max_win() -> np.ndarray:
    events = []
    for at, chord in ((0, (55, 110, 165, 220)), (.72, (65, 130, 195, 260)), (1.48, (73.4, 147, 220, 294)), (2.28, (82.4, 165, 247, 330))):
        events.append((at, drum(.72, chord[0]), .95))
        events.extend((at + i * .012, voice(hz, 1.05, .15 + i * .03), .28) for i, hz in enumerate(chord[1:]))
    events.extend(((2.62, voice(110, 1.0, .06), .34), (2.62, voice(165, 1.0, .06), .24), (3.02, drum(.65, 44), 1.2)))
    return mix(3.55, events)


def line_tick() -> np.ndarray:
    seconds = .18
    t = np.arange(round(seconds * SR)) / SR
    wood = np.sin(2 * np.pi * (420 - 180 * t / seconds) * t) * np.exp(-t * 34)
    felt = RNG.normal(0, 1, len(t)) * np.exp(-t * 58)
    # Smooth low-pass without scipy.
    felt = np.convolve(felt, np.ones(19) / 19, mode="same")
    return (wood + felt * .16) * env(seconds, .001, .16)


def coin_loop() -> np.ndarray:
    # Integer-cycle partials and periodic modulation make sample 0 and sample N
    # continuous; this is coins settling on velvet, not glass sparkle.
    seconds = 1.6
    t = np.arange(round(seconds * SR)) / SR
    x = np.zeros_like(t)
    for hz, gain, phase in ((275, .34, 0), (385, .23, .7), (550, .14, 1.4), (825, .07, 2.1)):
        cycles = round(hz * seconds)
        exact = cycles / seconds
        trem = .58 + .42 * np.cos(2 * np.pi * (2 / seconds) * t + phase)
        x += gain * trem * np.sin(2 * np.pi * exact * t + phase)
    x += .16 * np.sin(2 * np.pi * 110 * t) * (0.6 + .4 * np.cos(2 * np.pi * t / seconds))
    seam = round(.008 * SR)
    x[:seam] *= np.linspace(0, 1, seam)
    x[-seam:] *= np.linspace(1, 0, seam)
    return x


def write(name: str, audio: np.ndarray, target_peak_db: float = -3.2) -> None:
    audio = np.nan_to_num(audio - np.mean(audio))
    # Sparse musical cues naturally retain >=10 dB crest; do not compress them.
    peak = 10 ** (target_peak_db / 20)
    audio *= peak / max(1e-9, np.max(np.abs(audio)))
    pcm = np.int16(np.clip(audio, -1, 1) * 32767)
    path = OUT / name
    path.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(path), "wb") as f:
        f.setparams((1, 2, SR, 0, "NONE", "not compressed"))
        f.writeframes(pcm.tobytes())


def main() -> None:
    voices = {}
    for name in ("big", "super", "mega", "epic"):
        audio, count = tier(name)
        write(f"win_tier_{name}.wav", audio)
        voices[name] = count
    write("win_cap.wav", max_win())
    write("win_line_tick.wav", line_tick())
    write("coin_shimmer.wav", coin_loop(), -4.0)
    (ROOT / "design/capo-win-audio-voices.json").write_text(
        json.dumps(voices, indent=2) + "\n", encoding="utf-8"
    )


if __name__ == "__main__":
    main()
