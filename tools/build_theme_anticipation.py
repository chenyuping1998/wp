"""Deterministic, theme-specific anticipation cues for four Monkey games.

Run from any directory with ``python tools/build_theme_anticipation.py``.
The loop is a quiet scene sound; the one-shot announces its start.
"""

from pathlib import Path
import wave

import numpy as np
from scipy.signal import butter, sosfilt

ROOT = Path(__file__).resolve().parents[1] / "apps"
SR = 44100
RNG = np.random.default_rng(20261011)


def noise(seconds, low=100, high=10000):
    samples = RNG.standard_normal(round(seconds * SR))
    return sosfilt(butter(2, (low, high), btype="bandpass", fs=SR, output="sos"), samples)


def note(hz, seconds, decay=.14, partials=(1, .38, .14)):
    t = np.arange(round(seconds * SR)) / SR
    signal = sum(a * np.sin(2 * np.pi * hz * (i + 1) * t) for i, a in enumerate(partials))
    return signal * np.minimum(1, t / .004) * np.exp(-t / decay)


def add(dst, start, src, gain=1):
    begin = round(start * SR)
    length = min(len(src), len(dst) - begin)
    if length > 0:
        dst[begin:begin + length] += src[:length] * gain


def clink(hz=1070, seconds=.18):
    t = np.arange(round(seconds * SR)) / SR
    impact = noise(seconds, 1900, 9500) * np.exp(-t / .006) * .18
    return note(hz, seconds, .095, (1, .32, .1)) + impact


def snare(seconds=.16):
    t = np.arange(round(seconds * SR)) / SR
    return noise(seconds, 500, 10500) * np.exp(-t / .032) * .23


def save(folder, name, sound, peak):
    sound = sound.copy()
    edge = min(320, len(sound) // 4)
    sound[:edge] *= np.linspace(0, 1, edge)
    sound[-edge:] *= np.linspace(1, 0, edge)
    sound *= peak / max(1e-9, np.max(np.abs(sound)))
    path = folder / name
    with wave.open(str(path), "wb") as target:
        target.setnchannels(1)
        target.setsampwidth(2)
        target.setframerate(SR)
        target.writeframes((np.clip(sound, -1, 1) * 32767).astype("<i2").tobytes())
    print(f"{path.relative_to(ROOT)}: {len(sound) / SR:.2f}s")


def jade():
    loop = np.zeros(round(2.4 * SR))
    for at, hz in ((.04, 392), (.62, 440), (1.23, 523), (1.82, 440)):
        add(loop, at, note(hz, .46, .21, (1, .18, .06)), .28)
        add(loop, at + .13, clink(1120, .16), .11)
    # The teahouse has small porcelain and plucked-string sounds, not a dial.
    pickup = np.zeros(round(.48 * SR))
    add(pickup, .02, clink(1320, .36), .55)
    add(pickup, .12, note(659, .30, .15), .18)
    return loop, pickup


def pocha():
    loop = np.zeros(round(2.25 * SR))
    t = np.arange(len(loop)) / SR
    loop += noise(2.25, 650, 6200) * (.018 + .012 * np.sin(2 * np.pi * 2.4 * t) ** 2)
    for at, hz in ((.08, 790), (.53, 930), (1.10, 820), (1.69, 980)):
        add(loop, at, clink(hz), .19)
    pickup = np.zeros(round(.5 * SR))
    add(pickup, .015, clink(1090, .4), .46)
    add(pickup, .095, snare(.25), .08)  # a brief ladle scrape
    return loop, pickup


def mardi():
    loop = np.zeros(round(2.0 * SR))
    for at in (.04, .54, 1.04, 1.54):
        add(loop, at, snare(), .22)
        add(loop, at + .25, clink(1380, .12), .12)
    for at, hz in ((.06, 349), (.57, 440), (1.07, 523), (1.57, 440)):
        add(loop, at, note(hz, .3, .115, (1, .58, .2)), .2)
    pickup = np.zeros(round(.5 * SR))
    add(pickup, .015, note(523, .36, .19, (1, .62, .25)), .4)
    add(pickup, .05, snare(), .16)
    return loop, pickup


def strike():
    loop = np.zeros(round(2.4 * SR))
    t = np.arange(len(loop)) / SR
    # Distant ball on polished wood, with a spare pin lightly counting beats.
    loop += noise(2.4, 75, 850) * (.035 + .012 * np.sin(2 * np.pi * 4.2 * t))
    for at in (.13, .72, 1.33, 1.92):
        add(loop, at, note(205, .16, .055, (1, .3)), .17)
        add(loop, at + .17, clink(740, .12), .10)
    pickup = np.zeros(round(.52 * SR))
    add(pickup, .02, note(280, .18, .07, (1, .3)), .48)
    add(pickup, .14, clink(840, .31), .28)
    return loop, pickup


for app, folder, maker in (
    ("JadeTeahouse", "sushi", jade),
    ("PochaMonkey韓式路邊攤", "pocha", pocha),
    ("MardiMonkey嘉年華", "mardi", mardi),
    ("StrikeMonkey保齡球館", "strike", strike),
):
    destination = ROOT / app / "static" / "assets" / "audio" / folder
    destination.mkdir(parents=True, exist_ok=True)
    bed, cue = maker()
    save(destination, "anticipation_theme.wav", bed, .52)
    save(destination, "anticipation_pickup.wav", cue, .61)

# These are single, restrained room sounds. The player hears one every
# 14–22 seconds while the music is playing, rather than another loop in the mix.
def jade_room():
    sound = np.zeros(round(.65 * SR))
    add(sound, .05, clink(1190, .42), .38)
    add(sound, .18, note(290, .22, .06), .1)
    return sound


def pocha_room():
    sound = np.zeros(round(.88 * SR))
    t = np.arange(round(.72 * SR)) / SR
    add(sound, .05, noise(.72, 550, 5900) * np.exp(-t / .26), .13)
    add(sound, .24, clink(760, .22), .14)
    return sound


def mardi_room():
    sound = np.zeros(round(.78 * SR))
    add(sound, .04, snare(.32), .28)
    add(sound, .29, snare(.28), .19)
    add(sound, .46, note(523, .26, .12, (1, .45, .1)), .14)
    return sound


def swing_room():
    sound = np.zeros(round(.74 * SR))
    t = np.arange(round(.45 * SR)) / SR
    add(sound, .03, note(147, .68, .24, (1, .24, .08)), .24)
    add(sound, .22, noise(.45, 2400, 9800) * np.exp(-t / .12), .055)
    return sound


ambient = {
    ("JadeTeahouse", "sushi"): jade_room,
    ("PochaMonkey韓式路邊攤", "pocha"): pocha_room,
    ("MardiMonkey嘉年華", "mardi"): mardi_room,
    ("SwingMonkey爵士俱樂部", "swing"): swing_room,
}
for (app, folder), maker in ambient.items():
    destination = ROOT / app / "static" / "assets" / "audio" / folder
    destination.mkdir(parents=True, exist_ok=True)
    save(destination, "ambient_scene.wav", maker(), .48)
