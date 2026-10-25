"""Putt Monkey: the caddie's laugh, one "HA" per caption beat (2026-10-18).

Ported from StrikeMonkey's design/generate_laugh_voice.py; this cast's voice is
a bright, clipped sporty "ha" on /a/.

User report: when he laughs the HA!s pop but the laugh is quiet or missing.
The old voice_laugh.wav carried about 1.1 s of sound with no distinct
syllables, while the laugh it voices runs ten beats (game/laughTiming.json:
first HA! at 480 ms, then every 280 ms, face settles at 3650 ms) — so from the
third caption on he laughed in silence. Sushi Monkey's laugh reads because
every syllable is a separate, clear pulse; this keeps that and fits it to
this game's timing.

Each syllable is formant-synthesised: a breathy "h" (aspiration noise through
the vowel's resonances) into a voiced "a" (a jittered glottal sawtooth through
F1-F4 of /a/), pitch dipping within the syllable. Across the run the pitch
climbs to the middle beats and falls away, loudness swells with the captions
and eases at the end, then a short in-breath. Deterministic; no samples, no
words.

    python design/generate_laugh_voice.py
"""
from pathlib import Path
import json
import wave

import numpy as np
from scipy.signal import lfilter

APP = Path(__file__).resolve().parents[1]
OUT = APP / 'static/assets/audio/putt/voice_laugh.wav'
TIMING = json.loads((APP / 'src/game/laughTiming.json').read_text())
SR = 44100
rng = np.random.default_rng(20261018)

START = TIMING['startMs'] / 1000
GAP = TIMING['gapMs'] / 1000
BEATS = TIMING['beats']
LENGTH = START + BEATS * GAP + 0.45
x = np.zeros(int(SR * LENGTH))

# /a/ — a bright, open, cartoon vowel (formant Hz, bandwidth Hz, gain)
FORMANTS = [(800, 90, 1.0), (1250, 110, 0.7), (2650, 170, 0.32), (3450, 250, 0.16)]


def resonator(sig, f, bw):
    r = np.exp(-np.pi * bw / SR)
    a = [1, -2 * r * np.cos(2 * np.pi * f / SR), r * r]
    return lfilter([1 - r], a, sig)


def vowel(src):
    return sum(g * resonator(src, f, bw) for f, bw, g in FORMANTS)


def glottal(f0, n):
    """band-limited sawtooth along a pitch track, with a little jitter"""
    jitter = 1 + 0.012 * np.cumsum(rng.normal(size=n)) / np.sqrt(np.arange(1, n + 1))
    phase = np.cumsum(f0 * jitter) / SR
    out = np.zeros(n)
    for h in range(1, 24):
        mask = (f0 * h) < 6000
        out += mask * np.sin(2 * np.pi * h * phase) / h
    return out


VIBRATO = 0.0  # depth of a 6 Hz wobble on the pitch


def syllable(f0_start, loud, dur=0.2):
    n = int(SR * dur)
    t = np.arange(n) / SR
    # pitch falls through the syllable, as a laugh's "ha" does
    f0 = f0_start * (1 - 0.18 * (t / dur)) * (1 + VIBRATO * np.sin(2 * np.pi * 6 * t))
    voiced = glottal(f0, n)
    breath = rng.normal(size=n) * 0.35
    # "h": aspiration first, then the voice comes in under it and takes over
    h_env = np.exp(-t / 0.03)
    v_env = np.minimum(1, t / 0.025) * np.exp(-np.maximum(0, t - 0.04) / 0.07)
    sig = vowel(voiced * v_env + breath * (h_env * 0.9 + 0.12 * v_env))
    sig *= np.minimum(1, (dur - t) / 0.02)
    # each "ha" levelled on its own first — the pitch moves the harmonics across
    # F1, which alone made the middle beats twice as loud as the first ones
    return sig / np.max(np.abs(sig)) * loud


for i in range(BEATS):
    k = i / (BEATS - 1)
    # climbs to the middle beats and falls away; a little alternation so the
    # run sounds like breath going in and out rather than a sequencer
    f0 = 275 + 80 * np.sin(np.pi * k) + (12 if i % 2 else -8)
    loud = (0.82 + 0.18 * np.sin(np.pi * min(1, k * 1.4))) * (0.9 if i == BEATS - 1 else 1)
    at = int(SR * (START + i * GAP - 0.02))
    s = syllable(f0, loud, dur=0.2 if i < BEATS - 1 else 0.29)
    x[at:at + len(s)] += s[: len(x) - at]

# the in-breath after the last "ha"
n = int(SR * 0.32)
t = np.arange(n) / SR
inhale = resonator(rng.normal(size=n), 1600, 900) * np.sin(np.pi * t / t[-1]) ** 2 * 0.22
at = int(SR * (START + BEATS * GAP + 0.08))
x[at:at + n] += inhale[: len(x) - at]

x = x / np.max(np.abs(x)) * 0.92
x[-128:] *= np.linspace(1, 0, 128)
with wave.open(str(OUT), 'wb') as w:
    w.setnchannels(1)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((x * 32767).astype('<i2').tobytes())
rms = np.sqrt((x ** 2).mean())
print(OUT.name, f'{len(x) / SR:.2f}s', f'rms {20 * np.log10(rms):.1f} dBFS')
