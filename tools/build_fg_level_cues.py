"""Render short, theme-specific FG meter level-up cues for the six games."""

from pathlib import Path
import wave

import numpy as np
from scipy.signal import butter, sosfilt

ROOT = Path(__file__).resolve().parents[1] / "apps"
SR = 44100
RNG = np.random.default_rng(20261011)


def noise(length: float, low: float, high: float) -> np.ndarray:
    samples = RNG.standard_normal(round(length * SR))
    return sosfilt(butter(2, (low, high), btype="bandpass", fs=SR, output="sos"), samples)


def tone(hz: float, length: float, decay: float, harmonics=(1.0, .3, .1)) -> np.ndarray:
    t = np.arange(round(length * SR)) / SR
    body = sum(a * np.sin(2 * np.pi * hz * (i + 1) * t) for i, a in enumerate(harmonics))
    return body * np.minimum(1, t / .003) * np.exp(-t / decay)


def sweep(length: float, low: float, high: float, rising=True) -> np.ndarray:
    t = np.arange(round(length * SR)) / SR
    envelope = (t / length if rising else 1 - t / length) ** 1.2
    return noise(length, low, high) * envelope


def add(dst: np.ndarray, start: float, src: np.ndarray, gain: float = 1) -> None:
    begin = round(start * SR)
    end = min(len(dst), begin + len(src))
    if end > begin:
        dst[begin:end] += src[:end - begin] * gain


def hit(hz: float, length: float = .22) -> np.ndarray:
    t = np.arange(round(length * SR)) / SR
    return tone(hz, length, .11, (1, .4, .13)) + noise(length, 1500, 10000) * np.exp(-t / .007) * .14


def render(theme: str) -> tuple[np.ndarray, np.ndarray]:
    wind = np.zeros(round(.31 * SR))
    impact = np.zeros(round(.67 * SR))
    if theme == "jade":
        add(wind, 0, sweep(.26, 750, 5200), .11)  # silk fan
        add(wind, .18, tone(740, .13, .065), .12)
        add(impact, .012, hit(1100, .38), .45)  # porcelain and wooden counter
        add(impact, .06, tone(554, .42, .2, (1, .16, .05)), .26)
        add(impact, .12, hit(1540, .27), .2)
    elif theme == "diner":
        for at in (.015, .07, .13, .19):
            add(wind, at, sweep(.07, 1250, 7600), .12)  # fluttering order slip
        add(impact, .012, tone(1380, .6, .31, (1, .35, .14)), .39)  # service bell
        add(impact, .02, hit(250, .22), .19)  # tray lands
        add(impact, .14, tone(1840, .38, .18), .13)
    elif theme == "pocha":
        add(wind, .01, sweep(.26, 900, 8200), .17)  # sizzling pan swipe
        add(wind, .17, hit(930, .12), .11)
        add(impact, .012, hit(490, .38), .45)  # pan and chopstick
        add(impact, .055, hit(1090, .33), .26)
        add(impact, .19, tone(700, .36, .16), .12)
    elif theme == "mardi":
        for at in (.015, .095, .175):
            add(wind, at, hit(1700, .095), .16)  # parade tambourine
        add(impact, .012, noise(.24, 420, 9200) * np.exp(-np.arange(round(.24 * SR)) / SR / .055), .24)
        for hz in (349, 440, 523):
            add(impact, .025, tone(hz, .46, .19, (1, .5, .22)), .15)  # brass chord
        add(impact, .14, hit(1460, .25), .12)
    elif theme == "strike":
        add(wind, 0, sweep(.3, 80, 1100), .2)  # ball approaching pins
        for at in (.045, .12, .2):
            add(wind, at, tone(165, .09, .035), .08)
        add(impact, .012, hit(260, .32), .28)
        for at, hz in ((.045, 760), (.095, 930), (.155, 640), (.23, 1080)):
            add(impact, at, hit(hz, .29), .23)  # four staggered pinfalls
        add(impact, .2, noise(.34, 120, 3500) * np.exp(-np.arange(round(.34 * SR)) / SR / .11), .1)
    else:  # swing
        add(wind, .005, sweep(.27, 1900, 9500), .08)  # brushed cymbal
        add(wind, .06, tone(147, .24, .1, (1, .24, .08)), .2)
        add(impact, .012, hit(590, .3), .26)  # rim shot
        for hz in (293.66, 349.23, 440):
            add(impact, .025, tone(hz, .58, .24, (1, .27, .08)), .16)  # compact piano chord
        add(impact, .16, noise(.27, 2800, 10000) * np.exp(-np.arange(round(.27 * SR)) / SR / .09), .055)
    return wind, impact


def save(path: Path, samples: np.ndarray, peak: float) -> None:
    edge = min(220, len(samples) // 4)
    samples[:edge] *= np.linspace(0, 1, edge)
    samples[-edge:] *= np.linspace(1, 0, edge)
    samples *= peak / max(1e-9, np.max(np.abs(samples)))
    path.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(path), "wb") as target:
        target.setnchannels(1)
        target.setsampwidth(2)
        target.setframerate(SR)
        target.writeframes((np.clip(samples, -1, 1) * 32767).astype("<i2").tobytes())
    print(path.relative_to(ROOT), f"{len(samples) / SR:.2f}s")


for app, folder, theme in (
    ("JadeTeahouse", "sushi", "jade"),
    ("DinerMonkey美式餐館", "diner", "diner"),
    ("PochaMonkey韓式路邊攤", "pocha", "pocha"),
    ("MardiMonkey嘉年華", "mardi", "mardi"),
    ("StrikeMonkey保齡球館", "strike", "strike"),
    ("SwingMonkey爵士俱樂部", "swing", "swing"),
):
    windup, impact = render(theme)
    folder_path = ROOT / app / "static" / "assets" / "audio" / folder
    save(folder_path / "fg_level_windup.wav", windup, .53)
    save(folder_path / "fg_level_impact.wav", impact, .64)
