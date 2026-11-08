"""Audible reel stops, button and spin for Jade Teahouse (2026-11-01).

As Go Bananinja the same day: a cue that keeps most of its energy below
400 Hz is silent on a phone or laptop speaker at any volume. Measured here:
btn.wav 6% above 400 Hz, spin.wav 21%, reel_stop.wav 52% - and the one
reel_stop file served all five reels, pitched up, through ONE cached audio
element, so each stop cut the previous one off.

Re-rendered from real CC0 recordings (the same takes Bananinja's audio uses;
copied into design/source/audible_v1/raw with their licence rows):

  reel_stop_1..5  a bamboo/wood knock high-passed into 450-4200 Hz with a
                  small click on top and a trace of drum for weight, pitched
                  a step per reel (the last reel the brightest)
  btn             a short switch click, band-limited
  spin            a wood knock with a marimba pluck under it (the teahouse's
                  struck-wood voice), bright enough to carry
  door_clack      the transition's lattice doors meeting (was 33% above 400 Hz)
  sack_throw      file name kept: now the Master's offer as the doors close,
                  three rising marimba notes (it was a throw whoosh, 21%)
  alarm_trip      file name kept: the Scatter win, a marimba fifth struck
                  twice (was 17%)

Every output keeps >= 60% of its energy above 400 Hz (asserted).

Run: python design/build_audible_cues.py   (system Python: numpy, scipy, soundfile)
"""

import json
import shutil
from pathlib import Path

import numpy as np
import soundfile as sf
from scipy.signal import butter, resample_poly, sosfilt

APP = Path(__file__).resolve().parents[1]
SRC = APP / "design/source/audible_v1"
RAW = SRC / "raw"
NINJA = APP.parent / "GoBananinja忍者/design/source/sampled_audio_v1"
OUT = APP / "static/assets/audio/sushi"
SR = 44100
USED = [
    "foley/bfh1_wood_hit_01.ogg",
    "foley/bfh1_wood_hit_02.ogg",
    "foley/bfh1_wood_hit_03.ogg",
    "interface-sounds/click_003.ogg",
    "interface-sounds/switch_002.ogg",
    "BDrumNew_hit_v5_rr1_Sum.wav",
    "Marimba_hit_Outrigger_C4_med_01.wav",
    "foley/bfh1_glass_hit_01.ogg",
    "BowedPsaltery_C4_Main_Pluck_rr1.wav",
]
# the gong-mode pentatonic the cups climb, in semitones from C4
PENTA = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21]


def bring_samples():
    """Copy the takes and their licence rows in once, so this app stands alone."""
    sources = json.loads((NINJA / "SOURCES.json").read_text(encoding="utf8")) if NINJA.exists() else {}
    rows = {}
    for key in USED:
        dst = RAW / key
        if not dst.exists():
            dst.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(NINJA / "raw" / key, dst)
        if key in sources:
            rows[key] = sources[key]
    if rows:
        (SRC / "SOURCES.json").write_text(json.dumps(rows, indent=2, ensure_ascii=False) + "\n", encoding="utf8")
    for lic in ["VCSL-LICENSE.txt", "interface-sounds-LICENSE.txt"]:
        if (NINJA / lic).exists() and not (SRC / lic).exists():
            shutil.copyfile(NINJA / lic, SRC / lic)


def sample(key):
    a, sr = sf.read(str(RAW / key), always_2d=True)
    a = a.mean(axis=1)
    if sr != SR:
        from math import gcd
        d = gcd(SR, sr)
        a = resample_poly(a, SR // d, sr // d)
    active = np.flatnonzero(np.abs(a) > max(0.0002, np.abs(a).max() * 0.009))
    if len(active):
        a = a[max(0, active[0] - 8):]
    a = a - a.mean()
    return a / max(0.001, np.abs(a).max())


def rate(a, semitones):
    step = 2 ** (semitones / 12)
    return np.interp(np.arange(0, len(a) - 1, step), np.arange(len(a)), a)


def hp(a, f, order=2):
    return sosfilt(butter(order, f, "highpass", fs=SR, output="sos"), a)


def lp(a, f):
    return sosfilt(butter(2, f, "lowpass", fs=SR, output="sos"), a)


def fit(a, seconds):
    out = np.zeros(round(seconds * SR))
    out[: min(len(out), len(a))] = a[: len(out)]
    return out


def fade(a, attack=0.0003, release=0.09):
    a = a.copy()
    k = max(1, round(attack * SR))
    a[:k] *= np.linspace(0, 1, k)
    r = round(release * SR)
    a[-r:] *= np.linspace(1, 0, r) ** 2
    return a


def master(a, peak_db):
    a = a / max(1e-6, np.abs(a).max()) * 10 ** (peak_db / 20)
    return a


def share_above(a, f=400):
    X = np.abs(np.fft.rfft(a)) ** 2
    fr = np.fft.rfftfreq(len(a), 1 / SR)
    return X[fr >= f].sum() / max(1e-12, X.sum())


def reel_stop(i, seconds=0.2):
    up = (i - 1) * 0.8
    wood = lp(hp(hp(rate(sample(USED[(i - 1) % 3]), up), 450), 450), 4200)
    tick = lp(hp(hp(rate(sample(USED[3]), up), 700), 700), 5200)
    body = lp(hp(rate(sample(USED[5]), up), 90), 240)
    return fade(fit(wood, seconds) * 0.8 + fit(tick, seconds) * 0.35 + fit(body, seconds) * 0.06)


def btn(seconds=0.09):
    return fade(fit(lp(hp(hp(sample(USED[4]), 600), 600), 6000), seconds), release=0.04)


def spin(seconds=0.42):
    wood = lp(hp(hp(rate(sample(USED[1]), 2), 400), 400), 4500)
    marimba = hp(sample(USED[6]), 300)
    tick = lp(hp(sample(USED[3]), 700), 5200)
    return fade(fit(wood, seconds) * 0.7 + fit(marimba, seconds) * 0.45 + fit(tick, seconds) * 0.3, release=0.2)


def door_clack(seconds=0.5):
    # the lattice doors meeting: two wood knocks a hair apart, low but kept above 350 Hz
    a = lp(hp(hp(rate(sample(USED[0]), -3), 420), 420), 4000)
    b = lp(hp(hp(rate(sample(USED[2]), -3), 380), 380), 4000)
    body = lp(hp(sample(USED[5]), 70), 220)
    out = fit(a, seconds) * 0.85
    out[round(0.035 * SR):] += fit(b, seconds)[: len(out) - round(0.035 * SR)] * 0.6
    return fade(out + fit(body, seconds) * 0.05, release=0.25)


def offer(seconds=0.9):
    # the Master offers the cup as the doors close (sfx_superfreespin): three
    # rising marimba notes over a light wood tap
    m = hp(sample(USED[6]), 300)
    out = np.zeros(round(seconds * SR))
    for k, (st, at) in enumerate([(0, 0.0), (5, 0.11), (9, 0.22)]):
        n = rate(m, st)
        i = round(at * SR)
        out[i:] += fit(n, seconds)[: len(out) - i] * (0.6 + 0.15 * k)
    tap = lp(hp(hp(sample(USED[1]), 450), 450), 4200)
    return fade(out + fit(tap, seconds) * 0.4, release=0.35)


def scatter_win(seconds=1.0):
    # the lanterns pay (sfx_scatter_win_v2): a bright marimba fifth, struck twice
    m = hp(sample(USED[6]), 300)
    out = np.zeros(round(seconds * SR))
    for st, at, g in [(7, 0.0, 0.7), (12, 0.0, 0.5), (7, 0.18, 0.55), (14, 0.18, 0.45)]:
        i = round(at * SR)
        out[i:] += fit(rate(m, st), seconds)[: len(out) - i] * g
    return fade(out, release=0.4)


# ---- the cup collection (2026-11-01, user: make it more fun) --------------
# Each Jade Cup pours into its Tea Master and rings one note higher than the
# last on a plucked psaltery (the nearest recorded voice to a guzheng), with a
# porcelain clink on top - a long collection plays a little climbing tune.

def cup_clink(i, seconds=0.55):
    deg = PENTA[i % len(PENTA)]
    pluck = hp(rate(sample(USED[8]), deg), 250)
    glass = lp(hp(hp(rate(sample(USED[7]), deg + 5), 1200), 1200), 9000)
    return fade(fit(pluck, seconds) * 0.75 + fit(glass, seconds) * 0.35, release=0.3)


def collect_grab(seconds=0.4):
    # the cups lift off the board: a quick two-note pluck upward and a light tap
    p = hp(sample(USED[8]), 250)
    out = fit(rate(p, -5), seconds) * 0.55
    i = round(0.07 * SR)
    out[i:] += fit(rate(p, 2), seconds)[: len(out) - i] * 0.6
    tap = lp(hp(hp(sample(USED[2]), 450), 450), 4200)
    return fade(out + fit(tap, seconds) * 0.35, release=0.18)


def collect_done(seconds=1.2):
    # the Master's tally complete: a rolled psaltery chord, marimba under it
    p = hp(sample(USED[8]), 250)
    m = hp(sample(USED[6]), 300)
    out = np.zeros(round(seconds * SR))
    for k, st in enumerate([12, 16, 19, 24]):
        i = round(k * 0.045 * SR)
        out[i:] += fit(rate(p, st), seconds)[: len(out) - i] * 0.5
    out += fit(rate(m, 12), seconds) * 0.35
    return fade(out, release=0.6)


def seal_thud(seconds=0.45):
    # the cinnabar chop pressed onto the tag: a firm wood knock, a dry paper
    # slap on top, a trace of drum - kept mostly above 400 Hz
    knock = lp(hp(hp(rate(sample(USED[0]), -2), 420), 420), 3800)
    slap = lp(hp(hp(sample(USED[4]), 900), 900), 7000)
    body = lp(hp(sample(USED[5]), 70), 220)
    return fade(fit(knock, seconds) * 0.85 + fit(slap, seconds) * 0.3 + fit(body, seconds) * 0.06, release=0.2)


def main():
    bring_samples()
    outs = {f"reel_stop_{i}": (reel_stop(i), -6 + i * 0.3) for i in range(1, 6)}
    outs["btn"] = (btn(), -9)
    outs["spin"] = (spin(), -6)
    outs["door_clack"] = (door_clack(), -3)
    outs["sack_throw"] = (offer(), -6)
    outs["alarm_trip"] = (scatter_win(), -5)
    for i in range(len(PENTA)):
        outs[f"cup_clink_{i}"] = (cup_clink(i), -7 + i * 0.25)
    outs["collect_grab"] = (collect_grab(), -8)
    outs["collect_done"] = (collect_done(), -5)
    outs["collect_stamp"] = (seal_thud(), -3)
    for name, (a, peak) in outs.items():
        a = master(a, peak)
        share = share_above(a)
        assert share >= 0.6, (name, share)
        sf.write(str(OUT / f"{name}.wav"), a, SR, subtype="PCM_16")
        print(f"{name:12s} {len(a) / SR:.2f}s  >400Hz {share * 100:.0f}%")


if __name__ == "__main__":
    main()
