#!/usr/bin/env python3
"""Generate Wild Alchemy's own music and event sounds, reproducibly.

Theme: an alchemist's tower — glass vials and retorts, a bubbling cauldron,
open flame, a brass mortar and singing bowl, parchment underfoot.

Palette (every sound is built only from these, nothing is sampled):

  glass     struck-glass modal partials (1, 2.32, 4.25, 6.63 x f) with a slight
            doublet detune so the ring shimmers — vials, chimes, win stings
  bubbles   Minnaert bubbles (a sine whose pitch rises as it decays) scattered
            in time — the brew, points flowing into the flask, coin loop
  fire      low flickering noise bed + band-swept noise whooshes + tiny
            crackle bursts — WILD release, ladder step, feature bell
  metal     brass/bowl modal partials (1, 2.71, 5.12, 8.2 x f) with long decay
            — block landing, feature bell, tier endings
  wood and  short band-limited noise taps and low thumps — buttons, reel
  parchment stops (a vial set down on a wooden shelf)
  music     plucked harp (additive, pluck-position partials), a bowed cello
            drone, a glass-harmonica pad, frame drum and a quiet bubble
            texture. MG: D Dorian, 80 bpm, 16 bars. FG: A harmonic minor
            (Andalusian Am-G-F-E), 104 bpm, 16 bars, frame-drum groove.

Every sound is original. Nothing is copied or resynthesised from Hard Time,
Capo or any other sibling, or from the reference recordings.

Mix rules:
  * one RNG seed per sound (SEED + crc32(name)), so rebuilding one file never
    changes another and a full rebuild is bit-identical
  * one-shots start and end on silence (2 ms in, 30 ms out)
  * loops (music, coin shimmer, tension bed) are rendered CIRCULARLY: note
    tails and reverb past the loop end are folded back onto the start, and
    filters run over three tiled copies, so the seam is continuous
  * the scatter landings and the five big-win tiers are levelled as GROUPS
    with a deliberate ramp, not per-file peak normalisation
  * a 10 kHz low-pass on every one-shot keeps glass from turning shrill
  * music ships as AAC .m4a (afconvert), one-shots as 16-bit 44.1 kHz WAV

Output: static/assets/audio/wild_alchemy/{bgm_base,bgm_feature}.m4a and
static/assets/audio/wild_alchemy/sfx/*.wav, plus the silent howler stand-in
static/assets/audio/sounds.{wav,json}.

Run:  /Applications/anaconda3/bin/python3 design/generate_wild_alchemy_audio.py
"""

from __future__ import annotations

import json
import subprocess
import tempfile
import zlib
from pathlib import Path

import numpy as np
from scipy.io import wavfile
from scipy.ndimage import minimum_filter1d
from scipy.signal import butter, sosfilt

ROOT = Path(__file__).resolve().parents[1]
AUDIO = ROOT / "static/assets/audio"
OUT = AUDIO / "wild_alchemy"
SFX = OUT / "sfx"
SR = 44100
SEED = 20261110


# ── basics ───────────────────────────────────────────────────────────────────

def rng_for(name: str) -> np.random.Generator:
    return np.random.default_rng([SEED, zlib.crc32(name.encode())])


def n_of(seconds: float) -> int:
    return int(round(seconds * SR))


def t_of(n: int) -> np.ndarray:
    return np.arange(n) / SR


def midi(note: float) -> float:
    return 440.0 * 2 ** ((note - 69) / 12)


def db(x: float) -> float:
    return 10 ** (x / 20)


def place(buf: np.ndarray, sig: np.ndarray, at: float, gain: float = 1.0) -> None:
    """Mix `sig` into `buf` starting at `at` seconds (mono or stereo)."""
    s = n_of(at)
    if s >= len(buf):
        return
    e = min(len(buf), s + len(sig))
    if buf.ndim == 2 and sig.ndim == 1:
        buf[s:e] += gain * sig[: e - s, None]
    else:
        buf[s:e] += gain * sig[: e - s]


def pan(sig: np.ndarray, p: float) -> np.ndarray:
    """Equal-power pan, p in [-1, 1]."""
    a = (p + 1) * np.pi / 4
    return np.column_stack((sig * np.cos(a), sig * np.sin(a)))


def ramp_env(n: int, attack: float, release: float) -> np.ndarray:
    e = np.ones(n)
    a = min(n // 2, n_of(attack))
    r = min(n // 2, n_of(release))
    if a:
        e[:a] = np.linspace(0, 1, a) ** 1.5
    if r:
        e[-r:] *= np.linspace(1, 0, r) ** 1.5
    return e


def sos_hp(f):
    return butter(2, f, btype="highpass", fs=SR, output="sos")


def sos_lp(f, order=4):
    return butter(order, f, btype="lowpass", fs=SR, output="sos")


def sos_bp(lo, hi, order=2):
    return butter(order, [lo, hi], btype="bandpass", fs=SR, output="sos")


def filt(sos, x):
    return sosfilt(sos, x, axis=0)


def filt_circular(sos, x):
    """Filter a loop as if it repeated forever: run over 3 tiled copies."""
    n = len(x)
    tiled = np.concatenate([x, x, x], axis=0)
    return sosfilt(sos, tiled, axis=0)[n : 2 * n]


# ── synthesis primitives ─────────────────────────────────────────────────────

def glass(f, dur, amp=1.0, decay=1.0, rng=None, click=0.12):
    """Struck glass: inharmonic modes, each a slightly detuned doublet."""
    n = n_of(dur)
    t = t_of(n)
    rng = rng or np.random.default_rng(0)
    out = np.zeros(n)
    for ratio, a in zip((1, 2.32, 4.25, 6.63), (1, 0.38, 0.16, 0.06)):
        fr = f * ratio
        if fr > 8500:
            continue
        d = decay / ratio ** 0.75
        ph = rng.uniform(0, 2 * np.pi, 2)
        mode = np.sin(2 * np.pi * fr * t + ph[0]) + 0.55 * np.sin(2 * np.pi * fr * 1.0016 * t + ph[1])
        out += a * mode * np.exp(-t / d)
    out *= np.minimum(1, t / 0.0015)
    if click:
        tick = filt(sos_bp(2500, 7000), rng.normal(0, 1, n)) * np.exp(-t / 0.002)
        out += click * tick
    # never cut a ringing glass off: that step is a click (seen as a full-band
    # stripe in the spectrogram at every truncation point)
    out *= ramp_env(n, 0, min(0.12, dur / 3))
    return amp * out / 1.6


def bowl(f, dur, amp=1.0, decay=2.0, rng=None, strike=0.25):
    """Brass bowl / mortar: long metallic modes with slow beating."""
    n = n_of(dur)
    t = t_of(n)
    rng = rng or np.random.default_rng(1)
    out = np.zeros(n)
    for ratio, a in zip((1, 2.71, 5.12, 8.2), (1, 0.5, 0.22, 0.08)):
        fr = f * ratio
        if fr > 8000:
            continue
        d = decay / ratio ** 0.6
        beat = 0.6 + 0.5 * ratio
        ph = rng.uniform(0, 2 * np.pi, 2)
        mode = np.sin(2 * np.pi * fr * t + ph[0]) + 0.8 * np.sin(2 * np.pi * (fr + beat) * t + ph[1])
        out += a * mode * np.exp(-t / d)
    out *= np.minimum(1, t / 0.003)
    if strike:
        hit = filt(sos_bp(300, 2500), rng.normal(0, 1, n)) * np.exp(-t / 0.008)
        out += strike * hit
    out *= ramp_env(n, 0, min(0.25, dur / 3))
    return amp * out / 1.8


def harp(f, dur, amp=1.0, bright=1.0):
    """Plucked string: pluck-position partials, upper ones die faster."""
    n = n_of(dur)
    t = t_of(n)
    out = np.zeros(n)
    for k in range(1, 11):
        fk = f * k * np.sqrt(1 + 0.00012 * k * k)
        if fk > 7000:
            break
        a = abs(np.sin(np.pi * k * 0.22)) / k ** (1.6 - 0.3 * bright)
        out += a * np.sin(2 * np.pi * fk * t) * np.exp(-t * (1.1 + 0.9 * k))
    out *= np.minimum(1, t / 0.002)
    out *= ramp_env(n, 0, min(0.08, dur / 3))
    return amp * out


def pad(f, dur, amp=1.0, attack=0.4, release=0.6, vib=0.003):
    """Glass harmonica: near-sine, slow swell, gentle vibrato."""
    n = n_of(dur)
    t = t_of(n)
    phase = 2 * np.pi * f * (t + vib / (2 * np.pi * 5.2) * np.sin(2 * np.pi * 5.2 * t))
    out = np.sin(phase) + 0.14 * np.sin(2 * phase) + 0.05 * np.sin(3 * phase)
    return amp * out * ramp_env(n, attack, release)


def cello(f, dur, amp=1.0, attack=0.35, release=0.5):
    """Bowed drone: soft additive saw with a darkening roll-off."""
    n = n_of(dur)
    t = t_of(n)
    vib = 1 + 0.0025 * np.sin(2 * np.pi * 4.6 * t)
    phase = 2 * np.pi * f * np.cumsum(vib) / SR
    out = np.zeros(n)
    for k in range(1, 16):
        if f * k > 4000:
            break
        out += np.sin(k * phase) / k * np.exp(-f * k / 900)
    return amp * out * ramp_env(n, attack, release)


def frame_drum(dur=0.45, f=72, amp=1.0, rng=None):
    n = n_of(dur)
    t = t_of(n)
    rng = rng or np.random.default_rng(2)
    fr = f * (1 + 0.7 * np.exp(-t / 0.018))
    body = np.sin(2 * np.pi * np.cumsum(fr) / SR) * np.exp(-t / 0.16)
    slap = filt(sos_bp(180, 1100), rng.normal(0, 1, n)) * np.exp(-t / 0.02)
    return amp * (body + 0.35 * slap) * np.minimum(1, t / 0.001) * ramp_env(n, 0, min(0.05, dur / 3))


def tek(dur=0.08, amp=1.0, rng=None):
    n = n_of(dur)
    t = t_of(n)
    rng = rng or np.random.default_rng(3)
    snap = filt(sos_bp(1800, 6500), rng.normal(0, 1, n)) * np.exp(-t / 0.012)
    ring = np.sin(2 * np.pi * 820 * t) * np.exp(-t / 0.02)
    return amp * (snap * 0.8 + ring * 0.25) * np.minimum(1, t / 0.0007) * ramp_env(n, 0, dur / 3)


def bubble(f0, dur=0.07, amp=1.0, rise=1.6):
    """Minnaert bubble: pitch rises as the bubble rings down."""
    n = n_of(dur)
    t = t_of(n)
    tau = dur / 4
    f = f0 * (1 + rise * t / dur * 0.35)
    out = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / tau)
    return amp * out * np.minimum(1, t / 0.0008) * ramp_env(n, 0, dur / 4)


def bubbles(dur, rate, lo, hi, amp=1.0, rng=None, shape=None):
    """A stream of bubbles; `shape(t)` scales the rate over time (0..1)."""
    rng = rng or np.random.default_rng(4)
    n = n_of(dur)
    out = np.zeros(n)
    tt = 0.0
    while True:
        local = rate * (shape(tt / dur) if shape else 1.0)
        tt += rng.exponential(1 / max(local, 0.5))
        if tt >= dur:
            break
        if shape and rng.uniform() > shape(tt / dur):
            continue
        f0 = np.exp(rng.uniform(np.log(lo), np.log(hi)))
        b = bubble(f0, rng.uniform(0.04, 0.09), rng.uniform(0.35, 1.0))
        place(out, b, tt)
    return amp * out


def shaped_noise(dur, centre, width_oct=0.8, rng=None):
    """Noise through a band that moves: `centre(t01)` in Hz, overlap-add STFT."""
    rng = rng or np.random.default_rng(5)
    n = n_of(dur)
    frame, hop = 2048, 512
    total = n + frame
    src = rng.normal(0, 1, total)
    out = np.zeros(total)
    win = np.hanning(frame)
    hz = np.fft.rfftfreq(frame, 1 / SR)
    logf = np.log2(np.maximum(hz, 1))
    for s in range(0, n, hop):
        fc = centre(min(1.0, s / max(n - 1, 1)))
        gain = np.exp(-0.5 * ((logf - np.log2(fc)) / (width_oct / 2)) ** 2)
        spec = np.fft.rfft(src[s : s + frame] * win) * gain
        out[s : s + frame] += np.fft.irfft(spec, frame) * win
    return out[:n] / 1.5


def whoosh(dur, f0, f1, peak=0.5, width_oct=1.0, rng=None):
    """Fire/air rush: a swept band with a swell to `peak` (0..1 of dur)."""
    n = n_of(dur)
    x = shaped_noise(dur, lambda u: f0 * (f1 / f0) ** u, width_oct, rng)
    u = np.linspace(0, 1, n)
    env = np.where(u < peak, (u / peak) ** 2, np.exp(-(u - peak) / max(1e-3, (1 - peak) / 3.5)))
    return x * env * ramp_env(n, 0.004, 0.04)


def fire_bed(dur, amp=1.0, rng=None, flicker_hz=9.0):
    rng = rng or np.random.default_rng(6)
    n = n_of(dur)
    roar = filt(sos_bp(70, 520), rng.normal(0, 1, n))
    k = max(2, int(SR / flicker_hz))
    flick = np.repeat(rng.uniform(0.45, 1.0, n // k + 2), k)[:n]
    flick = np.convolve(flick, np.hanning(k) / np.hanning(k).sum(), mode="same")
    return amp * roar * flick


def crackle(dur, rate, amp=1.0, rng=None):
    rng = rng or np.random.default_rng(7)
    n = n_of(dur)
    out = np.zeros(n)
    tt = 0.0
    hp = sos_hp(1200)
    while True:
        tt += rng.exponential(1 / rate)
        if tt >= dur:
            break
        m = n_of(rng.uniform(0.002, 0.007))
        burst = filt(hp, rng.normal(0, 1, m)) * np.exp(-np.arange(m) / (m / 3))
        place(out, burst * rng.uniform(0.3, 1.0), tt)
    return amp * out


def thump(f=110, dur=0.12, drop=0.5, amp=1.0, decay=0.05):
    n = n_of(dur)
    t = t_of(n)
    fr = f * (1 + drop * np.exp(-t / 0.012))
    return amp * np.sin(2 * np.pi * np.cumsum(fr) / SR) * np.exp(-t / decay) * np.minimum(1, t / 0.001) * ramp_env(n, 0, dur / 3)


def tap(dur, lo, hi, decay, amp=1.0, rng=None):
    rng = rng or np.random.default_rng(8)
    n = n_of(dur)
    t = t_of(n)
    return amp * filt(sos_bp(lo, hi), rng.normal(0, 1, n)) * np.exp(-t / decay) * np.minimum(1, t / 0.0005) * ramp_env(n, 0, dur / 3)


# ── reverb (Schroeder, block-recursive so it is fast) ────────────────────────

def _comb(x, d, g):
    y = np.copy(x)
    k = np.array([0.5, 0.5])  # damping in the feedback path
    for s in range(d, len(y), d):
        prev = y[s - d : s]
        prev = np.convolve(prev, k, mode="same")
        e = min(len(y), s + d)
        y[s:e] += g * prev[: e - s]
    return y


def _allpass(x, d, g=0.5):
    y = np.zeros_like(x)
    xp = np.concatenate([np.zeros(d), x])
    for s in range(0, len(x), d):
        e = min(len(x), s + d)
        yprev = y[s - d : e - d] if s >= d else np.zeros(e - s)
        y[s:e] = -g * x[s:e] + xp[s:e] + g * yprev
    return y


def reverb(x, size=1.0, feedback=0.78, spread=23):
    """Mono in, stereo wet out. `x` must already carry the room for the tail."""
    x = filt(sos_lp(5500, 2), x)
    outs = []
    for side in (0, spread):
        acc = np.zeros_like(x)
        for d in (1116, 1188, 1277, 1356, 1422, 1491, 1557, 1617):
            acc += _comb(x, int((d + side) * size), feedback)
        acc /= 8
        for d in (556, 441, 341, 225):
            acc = _allpass(acc, d + side)
        outs.append(acc)
    return np.column_stack(outs)


# ── finishing ────────────────────────────────────────────────────────────────

def finish_oneshot(mono_or_st, wet=0.18, size=0.8, tail=0.35):
    """Add room, filter, fade the edges. Returns stereo float."""
    x = mono_or_st
    pad_n = n_of(tail)
    if x.ndim == 1:
        x = np.concatenate([x, np.zeros(pad_n)])
        dry = np.column_stack((x, x))
        mono = x
    else:
        x = np.concatenate([x, np.zeros((pad_n, 2))])
        dry = x
        mono = x.mean(axis=1)
    y = dry + wet * reverb(mono, size)
    y = filt(sos_hp(32), y)
    y = filt(sos_lp(10000, 2), y)
    # trim trailing near-silence, keep a short tail
    level = np.abs(y).max(axis=1)
    thresh = level.max() * db(-60)
    last = np.nonzero(level > thresh)[0]
    end = min(len(y), (last[-1] if len(last) else len(y)) + n_of(0.03))
    y = y[:end]
    y *= ramp_env(len(y), 0.002, 0.03)[:, None]
    return y


def finish_loop(mono_or_st, length_s, wet=0.2, size=1.0):
    """Fold everything past the loop end back onto the start (circular)."""
    n = n_of(length_s)
    x = mono_or_st
    if x.ndim == 1:
        dry = np.column_stack((x, x))
        mono = x
    else:
        dry, mono = x, x.mean(axis=1)
    wetsig = reverb(np.concatenate([mono, np.zeros(n_of(2.5))]), size)
    total = np.zeros((max(len(dry), len(wetsig)), 2))
    total[: len(dry)] += dry
    total[: len(wetsig)] += wet * wetsig
    folded = np.zeros((n, 2))
    for s in range(0, len(total), n):
        chunk = total[s : s + n]
        folded[: len(chunk)] += chunk
    folded = filt_circular(sos_hp(32), folded)
    folded = filt_circular(sos_lp(10000, 2), folded)
    folded -= folded.mean(axis=0)
    return folded


def peak_to(x, peak_db):
    m = np.abs(x).max()
    return x * (db(peak_db) / m) if m else x


def shave(x, by_db=3.0):
    """Smooth peak limiter: pull only the top `by_db` of transients down.

    Gain is computed per sample, spread with a 10 ms minimum filter (so it is
    already down before the peak arrives) and smoothed with a 5 ms window, so it
    rides the envelope instead of clipping the waveform.
    """
    level = np.abs(x).max(axis=1) if x.ndim == 2 else np.abs(x)
    ceiling = level.max() * db(-by_db)
    gain = np.minimum(1.0, ceiling / np.maximum(level, 1e-9))
    gain = minimum_filter1d(gain, n_of(0.010))
    win = np.hanning(n_of(0.005))
    gain = np.convolve(gain, win / win.sum(), mode="same")
    return x * (gain[:, None] if x.ndim == 2 else gain)


def rms_l(x):
    return float(np.sqrt(np.mean(x[:, 0] ** 2)))


def write_wav(path: Path, x: np.ndarray) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    assert np.abs(x).max() < 0.999, (path, np.abs(x).max())
    wavfile.write(path, SR, np.int16(np.round(np.clip(x, -1, 1) * 32767)))
    print(f"  {path.relative_to(ROOT)}  {len(x) / SR:5.2f}s")


# ── the sounds ───────────────────────────────────────────────────────────────

def s_btn():
    r = rng_for("btn")
    x = tap(0.09, 1400, 5200, 0.009, 0.8, r) + 0.5 * thump(620, 0.09, 0.2, 1, 0.012)
    return finish_oneshot(x, wet=0.05, tail=0.05)


def s_spin():
    r = rng_for("spin")
    n = n_of(0.42)
    x = np.zeros(n)
    # cork pop, then an airy lift and two little bubbles
    t = t_of(n_of(0.06))
    f = 220 + 520 * np.exp(-t / 0.006)
    pop = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.018)
    place(x, pop + tap(0.06, 900, 3600, 0.004, 0.8, r), 0.0)
    place(x, whoosh(0.34, 700, 2600, 0.45, 0.9, r) * 0.45, 0.02)
    place(x, bubble(620, 0.07, 0.35), 0.12)
    place(x, bubble(880, 0.06, 0.28), 0.19)
    return finish_oneshot(x, wet=0.1, tail=0.1)


def s_reel_stop():
    r = rng_for("reel_stop")
    x = thump(118, 0.17, 0.45, 1.0, 0.045)
    x += tap(0.17, 280, 1300, 0.018, 0.55, r)
    x += glass(2350, 0.17, 0.16, 0.05, r, click=0)
    return finish_oneshot(x, wet=0.06, tail=0.06)


def s_reel_stop_block():
    """A merged block lands: mortar on the bench, glassware rattling."""
    r = rng_for("reel_stop_block")
    n = n_of(0.5)
    x = np.zeros(n)
    place(x, thump(66, 0.45, 0.8, 1.0, 0.09), 0)
    place(x, bowl(196, 0.45, 0.42, 0.15, r, strike=0.4), 0.004)
    for i, at in enumerate(sorted(r.uniform(0.02, 0.16, 4))):
        place(x, glass(r.uniform(1700, 2900), 0.2, 0.18 - 0.03 * i, 0.06, r, click=0.2), at)
    x *= ramp_env(n, 0.001, 0.12)
    return finish_oneshot(x, wet=0.1, size=0.6, tail=0.06)


def s_vial_fill():
    """Glass plink with bubbles: points into the flask, a frame lighting."""
    r = rng_for("vial_fill")
    n = n_of(0.46)
    x = np.zeros(n)
    place(x, glass(midi(81), 0.46, 0.75, 0.22, r), 0)       # A5
    place(x, glass(midi(88), 0.4, 0.25, 0.14, r, click=0), 0.035)  # E6
    for i, f in enumerate((540, 700, 900)):
        place(x, bubble(f, 0.07, 0.4), 0.05 + 0.045 * i)
    return finish_oneshot(x, wet=0.2, tail=0.25)


def s_scatter(i):
    """Castle scatter landing i (1..5): rising glass bell, more fire each step."""
    r = rng_for(f"scatter_{i}")
    notes = (74, 76, 81, 83, 86)  # D5 E5 A5 B5 D6
    dur = 0.34 + 0.07 * i
    n = n_of(dur)
    x = np.zeros(n)
    place(x, glass(midi(notes[i - 1]), dur, 0.9, 0.22 + 0.04 * i, r), 0)
    place(x, glass(midi(notes[i - 1] + 7), dur, 0.22, 0.14, r, click=0), 0.02)
    place(x, bowl(midi(50), dur, 0.25 + 0.04 * i, 0.3, r, strike=0.1), 0)
    if i >= 3:
        place(x, whoosh(dur * 0.8, 300, 1400, 0.25, 1.0, r) * (0.12 * (i - 2)), 0)
        place(x, crackle(dur * 0.8, 30 + 10 * i, 0.15, r), 0.02)
    return finish_oneshot(x, wet=0.22, tail=0.3)


def s_wild_charge():
    """WILD forecast: the brew starts to boil and a glass tone climbs."""
    r = rng_for("wild_charge")
    dur = 1.3
    n = n_of(dur)
    x = np.zeros(n)
    place(x, bubbles(dur, 55, 280, 1100, 0.32, r, shape=lambda u: 0.15 + 0.85 * u ** 1.3), 0)
    fizz = shaped_noise(dur, lambda u: 600 * 5 ** u, 0.9, r)
    x += 0.35 * fizz * np.linspace(0, 1, n) ** 2
    t = t_of(n)
    f = midi(57) * 2 ** (7 / 12 * np.clip(t / 1.0, 0, 1) ** 1.5)   # A3 -> E4
    tone = np.sin(2 * np.pi * np.cumsum(f) / SR)
    tone += 0.18 * np.sin(4 * np.pi * np.cumsum(f) / SR)
    x += 0.32 * tone * np.linspace(0, 1, n) ** 1.2
    x *= ramp_env(n, 0.15, 0.18)
    return finish_oneshot(x, wet=0.25, tail=0.35)


def s_wild_release():
    """trans_out: the alchemist leaps, a gout of flame turns into the swarm."""
    r = rng_for("wild_release")
    dur = 1.0
    n = n_of(dur)
    x = np.zeros((n, 2))
    place(x, thump(70, 0.5, 0.9, 0.8, 0.12), 0.0)
    rush = whoosh(dur, 260, 2400, 0.28, 1.1, r)
    t = t_of(n)
    x += np.column_stack((rush * (1 - 0.35 * t), rush * (0.65 + 0.35 * t))) * 0.75
    place(x, fire_bed(0.8, 0.5, r) * ramp_env(n_of(0.8), 0.05, 0.5), 0.05)
    for _ in range(9):
        at = r.uniform(0.18, 0.75)
        place(x, pan(glass(r.uniform(2000, 3600), 0.25, 0.12, 0.05, r, click=0.1), r.uniform(-0.8, 0.8)), at)
    return finish_oneshot(x, wet=0.2, tail=0.4)


def s_ladder_step():
    """Ladder step: flame bursts from the flask, a bowl rings under the X2."""
    r = rng_for("ladder_step")
    dur = 1.35
    n = n_of(dur)
    x = np.zeros(n)
    place(x, whoosh(0.7, 200, 1800, 0.35, 1.2, r) * 0.9, 0.0)
    place(x, fire_bed(0.9, 0.5, r) * ramp_env(n_of(0.9), 0.02, 0.6), 0.05)
    place(x, bowl(midi(50), 1.0, 0.85, 0.7, r, strike=0.5), 0.3)   # D3, the X2 lands
    for k, note in enumerate((74, 78, 81)):                         # D5 F#5 A5
        place(x, glass(midi(note), 0.9, 0.36, 0.35, r), 0.33 + 0.03 * k)
    return finish_oneshot(x, wet=0.24, tail=0.45)


def s_plus_spins():
    """+3 spins (also the buy flourish): three rising chimes and a fireball."""
    r = rng_for("plus_spins")
    dur = 0.95
    n = n_of(dur)
    x = np.zeros(n)
    for k, note in enumerate((81, 85, 88)):                         # A5 C#6 E6
        place(x, glass(midi(note), 0.7, 0.5, 0.28, r), 0.09 * k)
    place(x, whoosh(0.5, 400, 1600, 0.6, 1.0, r) * 0.4, 0.25)
    place(x, thump(90, 0.3, 0.6, 0.5, 0.08), 0.52)
    return finish_oneshot(x, wet=0.22, tail=0.35)


def s_line_win():
    """A line paid: two quick glass chimes over a harp note."""
    r = rng_for("line_win")
    n = n_of(0.62)
    x = np.zeros(n)
    place(x, harp(midi(62), 0.6, 0.55), 0)                          # D4
    place(x, glass(midi(74), 0.55, 0.45, 0.2, r), 0.0)              # D5
    place(x, glass(midi(81), 0.5, 0.42, 0.2, r), 0.075)             # A5
    return finish_oneshot(x, wet=0.2, tail=0.3)


def s_feature_bell():
    """Feature triggered: the great bowl, a roar of flame, a glass chord."""
    r = rng_for("feature_bell")
    dur = 2.2
    n = n_of(dur)
    x = np.zeros(n)
    place(x, bowl(midi(38), dur, 1.0, 1.4, r, strike=0.6), 0)       # D2
    place(x, bowl(midi(50), dur, 0.45, 1.0, r, strike=0.2), 0.01)
    place(x, fire_bed(1.6, 0.7, r) * ramp_env(n_of(1.6), 0.3, 1.0), 0.05)
    place(x, whoosh(1.2, 150, 900, 0.3, 1.2, r) * 0.6, 0.0)
    for k, note in enumerate((69, 74, 78, 81)):                     # A4 D5 F#5 A5
        place(x, pad(midi(note), 1.8, 0.14, 0.5, 0.8), 0.25 + 0.05 * k)
    return finish_oneshot(x, wet=0.3, size=1.1, tail=0.6)


def s_transition():
    """Scene wipe (also the loading reveal): a swirl of ink and flame."""
    r = rng_for("transition")
    dur = 1.9
    n = n_of(dur)
    t = t_of(n)
    swirl = shaped_noise(dur, lambda u: 500 * 2 ** (1.4 * np.sin(np.pi * u) + 0.6 * np.sin(6 * np.pi * u)), 1.0, r)
    env = np.sin(np.pi * np.clip(t / dur, 0, 1)) ** 1.4
    p = np.sin(2 * np.pi * 0.9 * t)
    x = np.column_stack((swirl * env * (0.7 - 0.3 * p), swirl * env * (0.7 + 0.3 * p)))
    low = filt(sos_lp(220), r.normal(0, 1, n)) * env * 2.2
    x += low[:, None] * 0.5
    sparkle = bubbles(dur, 18, 900, 2200, 0.15, r, shape=lambda u: np.sin(np.pi * u))
    x += sparkle[:, None]
    return finish_oneshot(x, wet=0.2, tail=0.3)


def s_fs_intro():
    """Free-spin panel: harp run up an A minor chord, then the E-major lift."""
    r = rng_for("fs_intro")
    dur = 3.2
    n = n_of(dur)
    x = np.zeros(n)
    place(x, frame_drum(0.6, 70, 0.9, r), 0)
    for k, note in enumerate((57, 60, 64, 69, 72, 76, 81)):         # A3..A5
        place(x, harp(midi(note), 1.6, 0.42), 0.04 + 0.085 * k)
    for note in (64, 68, 71, 76):                                   # E major
        place(x, pad(midi(note), 2.2, 0.16, 0.25, 0.9), 0.75)
    place(x, frame_drum(0.6, 70, 0.7, r), 0.75)
    place(x, bowl(midi(40), 2.4, 0.5, 1.0, r, strike=0.3), 0.75)    # E2
    for k, note in enumerate((88, 92, 95)):                         # E6 G#6 B6
        place(x, glass(midi(note), 1.2, 0.18, 0.4, r), 0.8 + 0.06 * k)
    place(x, bubbles(2.0, 20, 500, 1400, 0.12, r), 0.9)
    return finish_oneshot(x, wet=0.28, size=1.1, tail=0.5)


def s_fs_outro():
    """Free spins over: a harp cadence that settles back home in D."""
    r = rng_for("fs_outro")
    dur = 3.0
    n = n_of(dur)
    x = np.zeros(n)
    for k, note in enumerate((76, 72, 69, 64)):                     # E5 C5 A4 E4 (Am)
        place(x, harp(midi(note), 1.2, 0.38), 0.11 * k)
    for note in (57, 61, 64, 67):                                   # A7 (dominant)
        place(x, pad(midi(note), 0.95, 0.12, 0.15, 0.4), 0.45)
    for k, note in enumerate((62, 66, 69, 74, 78)):                 # D major home
        place(x, harp(midi(note), 1.8, 0.4), 1.15 + 0.05 * k)
        place(x, pad(midi(note), 1.8, 0.1, 0.2, 1.0), 1.15)
    place(x, bowl(midi(50), 1.8, 0.45, 1.0, r, strike=0.3), 1.15)
    place(x, glass(midi(86), 1.4, 0.25, 0.5, r), 1.2)
    return finish_oneshot(x, wet=0.3, size=1.1, tail=0.5)


TIER_LENGTHS = {"big": 1.6, "super": 2.2, "mega": 2.9, "epic": 3.6, "max": 4.6}


def s_tier(stage, name):
    """Big-win sting `stage` 1..5: one D-major phrase that grows each tier."""
    r = rng_for(f"win_tier_{name}")
    dur = TIER_LENGTHS[name]
    phrases = [
        [62, 66, 69, 74],
        [62, 66, 69, 74, 78, 81],
        [62, 66, 69, 74, 76, 78, 81, 86],
        [62, 66, 69, 74, 78, 81, 86, 81, 86, 90],
        [62, 66, 69, 74, 78, 81, 86, 90, 86, 90, 93, 98],
    ][stage - 1]
    n = n_of(dur)
    x = np.zeros(n)
    final_at = dur - 0.9 - 0.05 * stage
    spacing = (final_at - 0.05) / len(phrases)
    for k, note in enumerate(phrases):
        at = 0.04 + k * spacing
        place(x, harp(midi(note), 0.9, 0.34), at)
        place(x, glass(midi(note), 0.8, 0.26 + 0.02 * stage, 0.24, r), at + 0.004)
        if stage >= 2 and k % 2 == 0:
            place(x, frame_drum(0.4, 74, 0.12 + 0.03 * stage, r), at)
        if stage >= 3 and k % 2 == 1:
            place(x, tek(0.08, 0.2 + 0.03 * stage, r), at)
    # the landing chord: bowl + harp + glass harmonica, bigger each tier
    chord = (62, 69, 74, 78, 81) if stage < 4 else (50, 62, 69, 74, 78, 81, 86)
    place(x, bowl(midi(chord[0]), 1.0 + 0.05 * stage, 0.22 + 0.04 * stage, 0.8, r, strike=0.15), final_at)
    # strummed, not struck at one sample: seven simultaneous onsets were the
    # peak that capped the top tiers' loudness
    for k, note in enumerate(chord[1:]):
        place(x, harp(midi(note), 0.95, 0.24), final_at + 0.025 * k)
        place(x, pad(midi(note), 0.95, 0.06 + 0.012 * stage, 0.08, 0.6), final_at)
    if stage >= 2:
        place(x, bubbles(dur - 0.2, 10 + 8 * stage, 600, 1800, 0.10 + 0.02 * stage, r), 0.1)
    if stage >= 4:
        place(x, whoosh(1.0, 250, 2000, 0.4, 1.1, r) * (0.18 + 0.05 * (stage - 4)), final_at - 0.45)
        place(x, fire_bed(1.0, 0.18, r) * ramp_env(n_of(1.0), 0.2, 0.6), final_at - 0.3)
    x *= ramp_env(n, 0.002, 0.25)
    return finish_oneshot(x, wet=0.26, size=1.0, tail=0.0)


def s_win_cap():
    """Max-win stop: the whole lab rings — bowls, a brass-like chord, a cascade."""
    r = rng_for("win_cap")
    dur = 3.6
    n = n_of(dur)
    x = np.zeros(n)
    place(x, bowl(midi(38), dur, 1.0, 1.6, r, strike=0.6), 0)
    place(x, bowl(midi(50), dur, 0.5, 1.2, r, strike=0.3), 0.02)
    for note in (50, 54, 57, 62, 66):                               # D major, bowed
        place(x, cello(midi(note), 3.2, 0.12, 0.08, 1.4), 0.0)
    for k, note in enumerate((98, 93, 90, 86, 81, 78, 74, 78, 81, 86, 90)):
        place(x, glass(midi(note), 0.9, 0.2, 0.3, r), 0.12 + 0.11 * k)
    place(x, frame_drum(0.6, 66, 0.9, r), 0)
    place(x, frame_drum(0.6, 66, 0.7, r), 1.4)
    return finish_oneshot(x, wet=0.3, size=1.1, tail=0.4)


def s_coin_loop():
    """Count-up bed: gold glitter and soft bubbling, seamless at 2.0 s."""
    r = rng_for("coin_shimmer")
    length = 2.0
    n = n_of(length + 1.0)
    x = np.zeros((n, 2))
    notes = (74, 76, 78, 81, 83, 86, 88)
    for k in range(26):
        at = (k + r.uniform(-0.3, 0.3)) * length / 26 % length
        note = notes[r.integers(len(notes))]
        place(x, pan(glass(midi(note), 0.6, r.uniform(0.18, 0.32), 0.12, r, click=0.06), r.uniform(-0.7, 0.7)), at)
    bub = bubbles(length, 30, 500, 1500, 0.18, r)
    x[: len(bub)] += bub[:, None]
    return finish_loop(x, length, wet=0.25, size=0.9)


def s_tension_loop():
    """Spare tension bed (no tease in this game today): cauldron on the boil."""
    r = rng_for("reel_tension")
    length = 2.4
    n = n_of(length + 1.0)
    x = np.zeros(n)
    t = t_of(n)
    x += cello(midi(38), length + 1.0, 0.35, 0.01, 0.01) * (0.8 + 0.2 * np.sin(2 * np.pi * t / length * 2))
    bub = bubbles(length, 40, 160, 700, 0.5, r)
    x[: len(bub)] += bub
    fb = fire_bed(length, 0.25, r)
    x[: len(fb)] += fb
    return finish_loop(x, length, wet=0.2, size=1.0)


# ── music ────────────────────────────────────────────────────────────────────

def music(feature: bool) -> np.ndarray:
    """One loop of the MG (D Dorian) or FG (A harmonic minor) track."""
    r = rng_for("bgm_feature" if feature else "bgm_base")
    bpm = 104 if feature else 80
    beat = 60 / bpm
    bars = 16
    length = bars * 4 * beat
    n = n_of(length + 4.0)
    x = np.zeros((n, 2))

    if feature:
        # Andalusian cadence: Am | G | F | E
        chords = [([57, 60, 64], 45), ([55, 59, 62], 43), ([53, 57, 60], 41), ([56, 59, 64], 40)]
        melody = [
            [76, 77, 76, 72], [74, 72, 71, 74], [72, 71, 69, 72], [71, 68, 71, 76],
            [81, 80, 77, 76], [74, 76, 77, 74], [72, 74, 76, 72], [71, 72, 71, 68],
        ]
    else:
        # D Dorian: Dm9 | Cadd9 | G/B | Am7
        chords = [([62, 65, 69, 64], 38), ([60, 64, 67, 62], 36), ([59, 62, 67, 69], 35), ([57, 60, 64, 67], 33)]
        melody = [
            [69, None, 72, 74], [76, None, 74, 72], [71, None, 74, 71], [69, None, None, 67],
            [69, None, 72, 77], [76, None, 72, 74], [71, None, 67, 71], [69, None, None, None],
        ]

    for bar in range(bars):
        notes, root = chords[bar % 4]
        at = bar * 4 * beat
        # bowed drone on the root, a long glass-harmonica chord above it
        place(x, pan(cello(midi(root), 4 * beat + 0.6, 0.11 if feature else 0.13, 0.5, 0.6), -0.15), at)
        for k, note in enumerate(notes[:3]):
            place(x, pan(pad(midi(note + 12), 4 * beat + 0.5, 0.030, 0.9, 0.9), 0.4 - 0.4 * k), at)
        # harp arpeggio: eighths in MG, sixteenths in FG
        steps = 16 if feature else 8
        arp = (notes + [n_ + 12 for n_ in notes])
        order = [0, 1, 2, 3, 4, 2, 3, 1] if not feature else [0, 2, 1, 3, 2, 4, 3, 5, 4, 3, 2, 1, 2, 3, 1, 2]
        for s in range(steps):
            if not feature and s == 0:
                continue  # leave the downbeat for the reel stops
            note = arp[order[s % len(order)] % len(arp)]
            vel = (0.085 if s % (steps // 4) == 0 else 0.06) * (1.1 if feature else 1.0)
            vel *= r.uniform(0.85, 1.0)
            place(x, pan(harp(midi(note), 0.9, vel, 0.8), 0.35 * np.sin(s)), at + s * 4 * beat / steps)
        # melody: glass bells, one phrase per bar, varied on the second pass
        phrase = melody[bar % 8]
        if bar >= 8 and not feature:
            phrase = [p + (2 if (p and i == 3 and bar % 2) else 0) if p else None for i, p in enumerate(phrase)]
        for i, note in enumerate(phrase):
            if note is None:
                continue
            g = glass(midi(note), 1.2, 0.07 if feature else 0.075, 0.45, r, click=0.04)
            g += harp(midi(note), 1.2, 0.05)
            place(x, pan(g, 0.2), at + (i + (0.5 if not feature else 0)) * beat)
        # percussion
        if feature:
            for b, (kind, amp) in enumerate([("dum", 0.42), ("tek", 0.12), ("tek", 0.1), ("dum", 0.3),
                                             ("tek", 0.12), ("dum", 0.28), ("tek", 0.1), ("tek", 0.14)]):
                pos = at + b * beat / 2
                if kind == "dum":
                    place(x, frame_drum(0.4, 70, amp, r), pos)
                else:
                    place(x, pan(tek(0.07, amp, r), 0.3), pos)
        else:
            place(x, frame_drum(0.5, 64, 0.26, r), at)
            place(x, frame_drum(0.4, 72, 0.12, r), at + 2.5 * beat)
            for b in (1, 3):
                place(x, pan(tap(0.05, 3000, 8000, 0.01, 0.05, r), -0.3), at + b * beat)
    # bubbling texture: the brew, always on, quiet
    bub = bubbles(length, 7 if not feature else 11, 300, 1100, 0.05, r)
    x[: len(bub)] += pan(bub, -0.3)

    y = finish_loop(x, length, wet=0.32, size=1.15)
    return y


def encode_m4a(wav_path: Path, m4a_path: Path) -> None:
    m4a_path.parent.mkdir(parents=True, exist_ok=True)
    subprocess.run(
        ["afconvert", "-f", "m4af", "-d", "aac", "-b", "160000", str(wav_path), str(m4a_path)],
        check=True,
    )
    print(f"  {m4a_path.relative_to(ROOT)}  ({m4a_path.stat().st_size // 1024} KB)")


def write_silent_sprite() -> None:
    """The template howler sprite stays as a silent stand-in (see Sound.svelte)."""
    path = AUDIO / "sounds.json"
    data = json.loads(path.read_text())
    data["_comment"] = (
        "Wild Alchemy silent stand-in for the template howler sprite. Every cue this game "
        "plays is routed to its own files in static/assets/audio/wild_alchemy via "
        "components/Sound.svelte (SPRITE_TO_CN); the keys stay so an unmapped name falls "
        "through to silence instead of another game's sample. Regenerated by "
        "design/generate_wild_alchemy_audio.py."
    )
    data["src"] = ["./assets/audio/sounds.wav"]
    path.write_text(json.dumps(data, indent="\t") + "\n")
    # 0.25 s of digital silence, 44.1 kHz mono (the HT/Capo stand-in was 0.2 s @ 22.05 kHz)
    wavfile.write(AUDIO / "sounds.wav", SR, np.zeros(n_of(0.25), dtype=np.int16))
    print("  static/assets/audio/sounds.{json,wav} (silent stand-in)")


def main() -> None:
    print("one-shots")
    singles = {
        "btn": (s_btn(), -1.5),
        "spin": (s_spin(), -1.5),
        "reel_stop": (s_reel_stop(), -1.5),
        "reel_stop_block": (s_reel_stop_block(), -1.5),
        "vial_fill": (s_vial_fill(), -1.5),
        "wild_charge": (s_wild_charge(), -4.0),
        "wild_release": (s_wild_release(), -1.5),
        "ladder_step": (s_ladder_step(), -1.5),
        "plus_spins": (s_plus_spins(), -2.0),
        "line_win": (s_line_win(), -1.5),
        "feature_bell": (s_feature_bell(), -1.5),
        "transition": (s_transition(), -2.5),
        "fs_intro": (s_fs_intro(), -1.5),
        "fs_outro": (s_fs_outro(), -1.5),
        "win_cap": (s_win_cap(), -1.5),
    }
    for name, (x, peak) in singles.items():
        write_wav(SFX / f"{name}.wav", peak_to(x, peak))

    # Scatter landings play as one gesture: levelled by RMS on one channel with
    # a deliberate +1 dB-per-landing ramp, under a -1.5 dBFS peak ceiling.
    print("scatter group")
    for i in range(1, 6):
        x = s_scatter(i)
        gain = min(db(-23.0 + (i - 1)) / rms_l(x), db(-1.5) / np.abs(x).max())
        write_wav(SFX / f"scatter_{i}.wav", x * gain)

    # Big-win tiers: levelled by RMS on one channel, +0.9 dB per tier, with a
    # -1.5 dBFS peak ceiling so the loudest tier cannot clip.
    print("big-win tier group")
    target = [-19.5, -18.8, -18.1, -17.4, -16.7]
    for stage, name in enumerate(TIER_LENGTHS, start=1):
        x = shave(s_tier(stage, name), 3.0)
        gain = min(db(target[stage - 1]) / rms_l(x), db(-1.5) / np.abs(x).max())
        write_wav(SFX / f"win_tier_{name}.wav", x * gain)

    print("loops")
    write_wav(SFX / "coin_shimmer.wav", peak_to(s_coin_loop(), -4.0))
    write_wav(SFX / "reel_tension.wav", peak_to(s_tension_loop(), -6.0))

    print("music")
    with tempfile.TemporaryDirectory() as tmp:
        for name, feature in (("bgm_base", False), ("bgm_feature", True)):
            y = music(feature)
            # match the outgoing set's music level: about -22.5 dB RMS on one channel
            y = y * min(db(-22.5) / rms_l(y), db(-3.0) / np.abs(y).max())
            wav = Path(tmp) / f"{name}.wav"
            wavfile.write(wav, SR, np.int16(np.round(np.clip(y, -1, 1) * 32767)))
            encode_m4a(wav, OUT / f"{name}.m4a")

    write_silent_sprite()


if __name__ == "__main__":
    main()
