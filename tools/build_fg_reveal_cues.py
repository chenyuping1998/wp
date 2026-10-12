"""Render the five distinct short sounds heard when an FG replacement settles."""

from pathlib import Path
import wave

import numpy as np
from scipy.signal import butter, sosfilt


ROOT = Path(__file__).resolve().parents[1] / "apps"
SR = 44_100
RNG = np.random.default_rng(20261012)


def tone(hz: float, duration: float, decay: float, partials=(1, .28, .09)) -> np.ndarray:
    t = np.arange(round(duration * SR)) / SR
    body = sum(amp * np.sin(2 * np.pi * hz * (i + 1) * t) for i, amp in enumerate(partials))
    return body * np.minimum(1, t / .003) * np.exp(-t / decay)


def noise(duration: float, low: float, high: float, decay: float) -> np.ndarray:
    t = np.arange(round(duration * SR)) / SR
    raw = RNG.standard_normal(len(t))
    filtered = sosfilt(butter(2, (low, high), btype="bandpass", fs=SR, output="sos"), raw)
    return filtered * np.exp(-t / decay)


def put(dst: np.ndarray, src: np.ndarray, at: float, gain: float) -> None:
    start = round(at * SR)
    end = min(len(dst), start + len(src))
    dst[start:end] += src[:end - start] * gain


def render(theme: str) -> np.ndarray:
    x = np.zeros(round(.52 * SR))
    if theme == "jade":
        # Three plucked strings answer a porcelain cup at the reveal.
        for at, hz in ((0, 392), (.085, 523.25), (.17, 659.25)):
            put(x, tone(hz, .28, .075, (1, .38, .11)), at, .19)
        put(x, tone(1060, .22, .065, (1, .12, .25)), .19, .12)
        put(x, noise(.045, 2300, 7800, .012), .19, .045)
    elif theme == "diner":
        # Order slips click into place and the service bell rings twice.
        put(x, noise(.065, 1100, 7000, .014), 0, .095)
        for at, hz, gain in ((.045, 920, .26), (.185, 1210, .17)):
            put(x, tone(hz, .31, .115, (1, .27, .08)), at, gain)
        put(x, tone(240, .12, .032), .04, .15)
    elif theme == "strike":
        # Three staggered pin contacts lead to the scoring monitor's ping.
        put(x, tone(145, .16, .04, (1, .45, .15)), 0, .24)
        for at, hz in ((.04, 680), (.105, 930), (.165, 790)):
            put(x, tone(hz, .15, .046, (1, .32, .12)), at, .19)
            put(x, noise(.03, 1300, 8000, .008), at, .06)
        put(x, tone(1175, .25, .1, (1, .13, .04)), .22, .13)
    elif theme == "mardi":
        # A compact street-brass response with two dry tambourine accents.
        for hz in (349.23, 440, 523.25):
            put(x, tone(hz, .38, .15, (1, .5, .22, .08)), .055, .16)
        for at in (0, .14):
            put(x, noise(.09, 2100, 9200, .022), at, .12)
        put(x, tone(175, .15, .045), 0, .19)
    else:  # swing
        # Upright bass pickup, soft piano voicing, then a brushed cymbal tail.
        put(x, tone(146.83, .34, .12, (1, .24, .07)), 0, .23)
        for hz in (349.23, 440, 523.25, 622.25):
            put(x, tone(hz, .37, .11, (1, .2, .055)), .065, .095)
        put(x, noise(.3, 3500, 12000, .11), .085, .045)
    return x


for app, folder, theme in (
    ("JadeTeahouse", "sushi", "jade"),
    ("DinerMonkey美式餐館", "diner", "diner"),
    ("StrikeMonkey保齡球館", "strike", "strike"),
    ("MardiMonkey嘉年華", "mardi", "mardi"),
    ("SwingMonkey爵士俱樂部", "swing", "swing"),
):
    samples = render(theme)
    edge = round(.015 * SR)
    samples[-edge:] *= np.linspace(1, 0, edge)
    samples *= .58 / max(1e-9, np.max(np.abs(samples)))
    target = ROOT / app / "static/assets/audio" / folder / "fg_level_reveal.wav"
    target.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(target), "wb") as wav:
        wav.setnchannels(1)
        wav.setsampwidth(2)
        wav.setframerate(SR)
        wav.writeframes((np.clip(samples, -1, 1) * 32767).astype("<i2").tobytes())
    print(target.relative_to(ROOT), f"{len(samples) / SR:.2f}s")
