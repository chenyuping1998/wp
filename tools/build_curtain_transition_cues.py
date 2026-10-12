"""Render fabric-led transition cues for the Mardi parade cloth and Swing curtain."""

from pathlib import Path
import wave

import numpy as np
from scipy.signal import butter, sosfilt

APPS = Path(__file__).resolve().parents[1] / "apps"
SR = 44100
RNG = np.random.default_rng(20261011)


def noise(seconds: float, low: int, high: int) -> np.ndarray:
    raw = RNG.standard_normal(round(seconds * SR))
    return sosfilt(butter(2, (low, high), btype="bandpass", fs=SR, output="sos"), raw)


def note(hz: float, seconds: float, decay: float) -> np.ndarray:
    t = np.arange(round(seconds * SR)) / SR
    signal = np.sin(2 * np.pi * hz * t) + .28 * np.sin(4 * np.pi * hz * t)
    return signal * np.minimum(1, t / .008) * np.exp(-t / decay)


def add(out: np.ndarray, at: float, sound: np.ndarray, gain: float) -> None:
    start = round(at * SR)
    end = min(len(out), start + len(sound))
    out[start:end] += sound[: end - start] * gain


def swish(seconds: float, low: int, high: int, reverse: bool = False) -> np.ndarray:
    t = np.arange(round(seconds * SR)) / SR
    env = np.sin(np.pi * t / seconds) ** 1.5
    if reverse:
        env *= 1 - .3 * t / seconds
    else:
        env *= .7 + .3 * t / seconds
    return noise(seconds, low, high) * env


def render(theme: str, stage: str) -> np.ndarray:
    seconds = {"move": .83, "cover": .46, "exit": .78}[stage]
    out = np.zeros(round(seconds * SR))
    if theme == "mardi":
        if stage == "move":
            add(out, 0, swish(.72, 500, 4900), .36)
            for at in (.12, .28, .46):
                add(out, at, note(880, .14, .055), .075)  # beads at the hem
        elif stage == "cover":
            add(out, 0, swish(.22, 180, 2300), .22)
            for at, hz in ((.03, 590), (.085, 790), (.14, 1060)):
                add(out, at, note(hz, .24, .11), .1)  # short parade flourish
        else:
            add(out, 0, swish(.69, 650, 5500, True), .31)
            add(out, .24, note(523, .35, .14), .07)
    else:
        if stage == "move":
            add(out, 0, swish(.76, 140, 2600), .32)  # heavy velvet folds
            add(out, .14, note(147, .44, .18), .12)  # quiet upright bass
        elif stage == "cover":
            add(out, 0, swish(.22, 110, 1700), .21)
            add(out, .035, note(220, .32, .12), .16)  # padded stage landing
        else:
            add(out, 0, swish(.7, 240, 3200, True), .29)
            add(out, .22, note(293.66, .39, .16), .1)
    return out


def save(path: Path, sound: np.ndarray) -> None:
    edge = 240
    sound[:edge] *= np.linspace(0, 1, edge)
    sound[-edge:] *= np.linspace(1, 0, edge)
    sound *= .55 / max(np.max(np.abs(sound)), 1e-9)
    with wave.open(str(path), "wb") as wav:
        wav.setnchannels(1)
        wav.setsampwidth(2)
        wav.setframerate(SR)
        wav.writeframes((np.clip(sound, -1, 1) * 32767).astype("<i2").tobytes())


for app, folder, theme in (
    ("MardiMonkey嘉年華", "mardi", "mardi"),
    ("SwingMonkey爵士俱樂部", "swing", "swing"),
):
    destination = APPS / app / "static/assets/audio" / folder
    for stage in ("move", "cover", "exit"):
        save(destination / f"curtain_{stage}.wav", render(theme, stage))
