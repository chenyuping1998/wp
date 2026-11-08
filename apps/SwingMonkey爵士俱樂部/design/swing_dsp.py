"""Small numpy-only synthesis kit (copied from PuttMonkey design/putt_dsp.py, 48 kHz) plus the jazz club kit for Swing Monkey (2026-11-06).

No scipy on this machine, so everything is either vectorised modal / additive
synthesis (exact decaying sines), FFT-domain filtering, or Karplus-Strong run
one period at a time. All original synthesis; no samples, no quoted melodies.
"""
from __future__ import annotations

import math
import numpy as np

SR = 48000
RNG = np.random.default_rng(1962)


def secs(d, sr=SR):
    return np.arange(max(1, round(d * sr))) / sr


def hz(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def place(dst, src, start_s, sr=SR, gain=1.0):
    """Mix src into dst at start_s (seconds). Mono or stereo, matching dst."""
    i = int(round(start_s * sr))
    if i >= len(dst):
        return dst
    if i < 0:
        src = src[-i:]
        i = 0
    n = min(len(src), len(dst) - i)
    if n > 0:
        dst[i:i + n] += src[:n] * gain
    return dst


def fade(a, fin=0.002, fout=0.02, sr=SR):
    n = len(a)
    e = np.ones(n)
    k = min(n, max(1, int(fin * sr)))
    e[:k] = np.linspace(0, 1, k)
    k = min(n, max(1, int(fout * sr)))
    e[n - k:] *= np.linspace(1, 0, k)
    return a * (e if a.ndim == 1 else e[:, None])


# ── spectra ──────────────────────────────────────────────────────────────────

def band(x, lo=None, hi=None, sr=SR, slope=4.0):
    """Zero-phase FFT band-pass with soft (Butterworth-like) edges."""
    n = len(x)
    N = 1 << int(math.ceil(math.log2(max(2, n))))
    X = np.fft.rfft(x, N)
    f = np.fft.rfftfreq(N, 1 / sr)
    g = np.ones_like(f)
    if lo:
        g *= 1 / np.sqrt(1 + (lo / np.maximum(f, 1e-3)) ** (2 * slope))
    if hi:
        g *= 1 / np.sqrt(1 + (f / hi) ** (2 * slope))
    return np.fft.irfft(X * g, N)[:n]


def periodic_band(n, lo, hi, sr=SR, rng=RNG, slope=2.0):
    """Band-limited noise exactly n samples long that loops with no seam."""
    f = np.fft.rfftfreq(n, 1 / sr)
    spec = np.exp(1j * rng.uniform(0, 2 * np.pi, len(f)))
    spec *= 1 / np.sqrt(1 + (lo / np.maximum(f, 1e-3)) ** (2 * slope)) / np.sqrt(1 + (f / hi) ** (2 * slope))
    spec[0] = 0
    x = np.fft.irfft(spec, n)
    return x / (np.abs(x).max() + 1e-12)


def noise(d, sr=SR, rng=RNG):
    return rng.normal(0, 1, max(1, round(d * sr)))


def sweep_noise(d, lo0, hi0, lo1, hi1, sr=SR, rng=RNG, curve=1.0):
    """Noise whose pass band moves from (lo0,hi0) to (lo1,hi1): STFT overlap-add."""
    x = noise(d + 0.05, sr, rng)
    win = 1024
    hop = 256
    w = np.hanning(win)
    out = np.zeros(len(x) + win)
    norm = np.zeros(len(x) + win)
    f = np.fft.rfftfreq(win, 1 / sr)
    for s in range(0, len(x) - win, hop):
        k = (s / max(1, len(x) - win)) ** curve
        lo = lo0 * (lo1 / lo0) ** k
        hi = hi0 * (hi1 / hi0) ** k
        g = 1 / np.sqrt(1 + (lo / np.maximum(f, 1e-3)) ** 6) / np.sqrt(1 + (f / hi) ** 6)
        seg = np.fft.irfft(np.fft.rfft(x[s:s + win] * w) * g, win)
        out[s:s + win] += seg * w
        norm[s:s + win] += w * w
    out = out / np.maximum(norm, 1e-3)
    return out[:round(d * sr)]


def hi_share(a, sr=SR, cut=400):
    S = np.abs(np.fft.rfft(a)) ** 2
    f = np.fft.rfftfreq(len(a), 1 / sr)
    return float(S[f >= cut].sum() / max(1e-12, S.sum()))


# ── struck things: modal synthesis ──────────────────────────────────────────

def modes(d, parts, sr=SR, attack=0.0008, pitch_drop=0.0, drop_ms=18):
    """parts: [(freq, amp, decay_per_s)]. Optional quick pitch drop at the strike."""
    t = secs(d, sr)
    out = np.zeros_like(t)
    bend = 1 + pitch_drop * np.exp(-t / (drop_ms / 1000))
    for f, a, dec in parts:
        ph = 2 * np.pi * np.cumsum(f * bend) / sr
        out += a * np.sin(ph + RNG.uniform(0, 2 * np.pi)) * np.exp(-dec * t)
    return out * np.minimum(1, t / attack)


def click(d=0.006, lo=1800, hi=9000, sr=SR, decay=900):
    t = secs(d, sr)
    return band(noise(d, sr), lo, hi, sr) * np.exp(-decay * t)


def marimba(f, d=0.6, sr=SR, hard=1.0):
    p = modes(d, [(f, 1.0, 5.5), (f * 3.99, 0.32 * hard, 16), (f * 10.65, 0.10 * hard, 38)], sr)
    return p + 0.25 * hard * place(np.zeros_like(p), click(0.004, 1500, 7000, sr), 0, sr)


def vibes(f, d=1.4, sr=SR, trem=5.6):
    t = secs(d, sr)
    p = modes(d, [(f, 1.0, 1.6), (f * 4.0, 0.22, 7), (f * 9.9, 0.05, 20)], sr, attack=0.002)
    return p * (1 - 0.28 * (0.5 + 0.5 * np.sin(2 * np.pi * trem * t)))


def glock(f, d=1.0, sr=SR):
    return modes(d, [(f, 1.0, 3.2), (f * 2.71, 0.45, 7), (f * 5.15, 0.22, 12), (f * 8.93, 0.10, 20)], sr)


def bell(f, d=1.5, sr=SR, bright=1.0):
    """FM bell: the golden flag's chime."""
    t = secs(d, sr)
    idx = (3.2 * bright) * np.exp(-t * 3.5) + 0.4
    mod = np.sin(2 * np.pi * f * 1.4 * t) * idx
    car = np.sin(2 * np.pi * f * t + mod) * np.exp(-t * 2.4)
    car += 0.35 * np.sin(2 * np.pi * f * 2.76 * t) * np.exp(-t * 5)
    car += 0.18 * np.sin(2 * np.pi * f * 5.4 * t) * np.exp(-t * 9)
    return car * np.minimum(1, t / 0.001)


def tink(d=0.18, f0=2350, sr=SR, ring=1.0):
    """Putter face on a ball: hard, bright, inharmonic, very short."""
    p = modes(d, [(f0, 1.0, 46 / ring), (f0 * 1.63, 0.6, 60 / ring), (f0 * 2.82, 0.42, 85 / ring),
                  (f0 * 3.55, 0.25, 110 / ring), (f0 * 0.41, 0.35, 70)], sr)
    return p + 0.8 * place(np.zeros_like(p), click(0.003, 2500, 12000, sr, 1400), 0, sr)


def thock(f=330, d=0.16, sr=SR, body=1.0, bright=1.0):
    """Hard wooden knock: the reel landing on its stop."""
    p = modes(d, [(f, 1.0 * body, 34), (f * 2.31, 0.75, 48), (f * 4.12, 0.5 * bright, 70),
                  (f * 6.8, 0.25 * bright, 95)], sr, pitch_drop=0.07)
    return p + 0.9 * bright * place(np.zeros_like(p), click(0.005, 2200, 10000, sr, 1000), 0, sr)


def cup(d=0.5, sr=SR, hits=((0, 1.0), (0.072, 0.5), (0.118, 0.32), (0.152, 0.2), (0.178, 0.12)), pitch=1.0):
    """Ball into the cup: a hollow plastic strike, then the ball settling."""
    out = np.zeros(round(d * sr))
    for k, (at, g) in enumerate(hits):
        p = modes(max(0.05, d - at), [(620 * pitch, 1.0, 20), (1180 * pitch, 0.8, 26), (1710 * pitch, 0.55, 32),
                                       (2450 * pitch, 0.35, 44), (3300 * pitch, 0.2, 60)], sr)
        p += 0.5 * place(np.zeros_like(p), click(0.004, 1500, 8000, sr), 0, sr)
        place(out, p, at, sr, g * (1 if k == 0 else 0.85))
    return out


# ── plucked / blown ─────────────────────────────────────────────────────────

def ks(f, d, sr=SR, t60=1.2, bright=0.6, rng=RNG):
    """Karplus-Strong, one period at a time (vectorised inside each period)."""
    N = max(2, int(round(sr / f)))
    n = round(d * sr)
    y = np.zeros(n + 2 * N + 2)
    burst = rng.uniform(-1, 1, N)
    # darker pluck = smoother burst
    k = max(1, int((1 - bright) * 6))
    if k > 1:
        burst = np.convolve(burst, np.ones(k) / k, 'same')
    y[:N] = burst - burst.mean()
    g = 10 ** (-3 / max(1e-3, f * t60))
    for s in range(N, len(y), N):
        e = min(s + N, len(y))
        idx = np.arange(s, e)
        y[s:e] = g * 0.5 * (y[idx - N] + y[idx - N - 1])
    return fade(y[:n], 0.0005, 0.03, sr)


def additive(f, d, sr=SR, amps=None, cutoff=None, vib=(5.5, 0.004, 0.18), detune=0.0):
    """Harmonic stack with a moving low-pass (cutoff(t) in Hz) — brass, reeds, pads."""
    t = secs(d, sr)
    vr, vd, vdel = vib
    vibr = 1 + vd * np.sin(2 * np.pi * vr * t) * np.clip((t - vdel) / 0.15, 0, 1)
    ph = 2 * np.pi * np.cumsum(f * (1 + detune) * vibr) / sr
    out = np.zeros_like(t)
    K = int(min(48, (sr * 0.45) // f))
    fc = cutoff(t) if cutoff is not None else np.full_like(t, 6000.0)
    for k in range(1, K + 1):
        a = amps(k) if amps else 1.0 / k
        lp = 1 / (1 + (k * f / fc) ** 4)
        out += a * lp * np.sin(k * ph)
    return out


def brass(f, d, sr=SR, bright=1.0, att=0.028, rel=0.09, section=3):
    t = secs(d, sr)
    env = np.minimum(1, t / att) * (0.82 + 0.18 * np.exp(-t * 6)) * np.clip((d - t) / rel, 0, 1)
    cut = lambda tt: f * (1.6 + 7.5 * bright * (np.minimum(1, tt / 0.05) * (0.55 + 0.45 * np.exp(-tt * 5))))
    out = np.zeros_like(t)
    for i in range(section):
        dt = (i - (section - 1) / 2) * 0.0035
        out += additive(f, d, sr, cutoff=cut, detune=dt, vib=(5.2 + i * 0.3, 0.005, 0.16))
    return out * env / section


def pad(freqs, d, sr=SR, att=0.25, rel=0.4, bright=0.35):
    t = secs(d, sr)
    env = np.minimum(1, t / att) * np.clip((d - t) / rel, 0, 1)
    out = np.zeros_like(t)
    for f in freqs:
        for dt in (-0.004, 0.004):
            out += additive(f, d, sr, amps=lambda k: 1 / k ** 1.4, cutoff=lambda tt: np.full_like(tt, f * (2 + 6 * bright)),
                            detune=dt, vib=(4.1, 0.002, 0.0))
    return out * env / (2 * len(freqs))


# ── drums & foley ────────────────────────────────────────────────────────────

def kick(d=0.32, sr=SR, punch=1.0):
    t = secs(d, sr)
    f = 48 + 105 * np.exp(-t * 32)
    body = np.sin(2 * np.pi * np.cumsum(f) / sr) * np.exp(-t * 9)
    beater = band(noise(0.012, sr), 1800, 7000, sr) * np.exp(-secs(0.012, sr) * 400)
    return body + 0.55 * punch * place(np.zeros_like(body), beater, 0, sr)


def snare(d=0.22, sr=SR, brush=0.0):
    t = secs(d, sr)
    n = band(noise(d, sr), 1200, 9000, sr) * np.exp(-t * (18 if brush else 26))
    tone_ = np.sin(2 * np.pi * 196 * t) * np.exp(-t * 30) + 0.5 * np.sin(2 * np.pi * 330 * t) * np.exp(-t * 40)
    a = 0.9 * n + 0.45 * (1 - brush) * tone_
    if brush:
        a *= np.minimum(1, t / 0.012)
    return a


def clap(d=0.25, sr=SR):
    out = np.zeros(round(d * sr))
    for k, at in enumerate((0, 0.009, 0.019)):
        b = band(noise(0.03, sr), 900, 3800, sr) * np.exp(-secs(0.03, sr) * 160)
        place(out, b, at, sr, 0.8 if k < 2 else 1.0)
    tail = band(noise(d - 0.02, sr), 1000, 4500, sr) * np.exp(-secs(d - 0.02, sr) * 22)
    place(out, tail, 0.02, sr, 0.35)
    return out


def hat(d=0.06, sr=SR, open_=False):
    t = secs(d, sr)
    return band(noise(d, sr), 6500, 16000, sr) * np.exp(-t * (14 if open_ else 70))


def shaker(d=0.07, sr=SR):
    t = secs(d, sr)
    env = np.minimum(1, t / 0.012) * np.exp(-t * 45)
    return band(noise(d, sr), 3800, 11000, sr) * env


def woodblock(f=1600, d=0.09, sr=SR):
    return modes(d, [(f, 1.0, 55), (f * 2.65, 0.4, 90)], sr) + 0.3 * place(np.zeros(round(d * sr)), click(0.003), 0, sr)


def applause(d, sr=SR, density=55, env=None, rng=RNG, lo=900, hi=5200):
    """A crowd of individual claps (each its own spectrum), not shaped noise."""
    n = round(d * sr)
    out = np.zeros(n)
    templates = []
    for _ in range(28):
        c = rng.uniform(1200, 3800)
        L = rng.uniform(0.012, 0.03)
        b = band(noise(L, sr, rng), c * 0.55, c * 1.7, sr) * np.exp(-secs(L, sr) * rng.uniform(140, 260))
        templates.append(b / (np.abs(b).max() + 1e-9))
    count = int(density * d)
    times = np.sort(rng.uniform(0, d, count))
    for at in times:
        g = rng.uniform(0.25, 1.0) * (env(at) if env else 1.0)
        place(out, templates[rng.integers(len(templates))], at, sr, g)
    return band(out, lo, hi, sr, 2)


def ooh(d, sr=SR, voices=10, f_lo=170, f_hi=290, rise=1.12, vowel=(330, 900), rng=RNG):
    """A small crowd going "oooh": glide-up voices through a fixed vowel formant."""
    t = secs(d, sr)
    out = np.zeros_like(t)
    F1, F2 = vowel
    for v in range(voices):
        f0 = rng.uniform(f_lo, f_hi)
        glide = f0 * (1 + (rise - 1) * np.clip(t / (d * 0.7), 0, 1) ** 1.5) * (1 + 0.006 * np.sin(2 * np.pi * rng.uniform(4, 6) * t))
        ph = 2 * np.pi * np.cumsum(glide) / sr
        K = int(4200 // f0)
        voice = np.zeros_like(t)
        for k in range(1, K + 1):
            fk = k * f0 * (1 + (rise - 1) * 0.5)
            fmt = np.exp(-((fk - F1) / 140) ** 2) + 0.55 * np.exp(-((fk - F2) / 220) ** 2) + 0.06
            voice += fmt / k ** 0.6 * np.sin(k * ph)
        on = rng.uniform(0, 0.08)
        out += voice * np.clip((t - on) / 0.12, 0, 1)
    breath = band(noise(d, sr, rng), 600, 3200, sr) * 0.04
    return (out / voices + breath) * np.clip((d - t) / (d * 0.35), 0, 1)


def chirp_bird(d=0.12, f0=3200, f1=4600, sr=SR):
    t = secs(d, sr)
    f = f0 + (f1 - f0) * np.sin(np.pi * t / d)
    a = np.sin(2 * np.pi * np.cumsum(f) / sr) * np.sin(np.pi * t / d) ** 2
    return a


def whoosh(d, lo0=300, hi0=900, lo1=1800, hi1=6000, sr=SR, shape=None):
    t = secs(d, sr)
    x = sweep_noise(d, lo0, hi0, lo1, hi1, sr)
    env = shape(t) if shape else np.sin(np.pi * np.clip(t / d, 0, 1)) ** 1.5
    return x * env


def reverb(x, sr=SR, t60=1.1, mix=0.18, pre=0.012, bright=6500, rng=RNG, stereo=False):
    L = int(sr * min(3.0, t60 * 1.2))
    t = np.arange(L) / sr
    def ir():
        r = rng.normal(0, 1, L) * np.exp(-6.9 * t / t60)
        r = band(r, 180, bright, sr, 2)
        r[: int(pre * sr)] = 0
        return r / np.sqrt((r ** 2).sum() + 1e-12)
    def conv(sig, h):
        n = len(sig) + len(h)
        N = 1 << int(math.ceil(math.log2(n)))
        return np.fft.irfft(np.fft.rfft(sig, N) * np.fft.rfft(h, N), N)[: len(sig) + L]
    if x.ndim == 1 and not stereo:
        wet = conv(x, ir())
        dry = np.concatenate([x, np.zeros(L)])
        return dry + mix * wet * 3
    xs = x if x.ndim == 2 else np.stack([x, x], 1)
    outs = []
    for ch in range(2):
        wet = conv(xs[:, ch], ir())
        dry = np.concatenate([xs[:, ch], np.zeros(L)])
        outs.append(dry + mix * wet * 3)
    return np.stack(outs, 1)


def trim_tail(a, sr=SR, floor_db=-60, keep=0.03):
    m = np.abs(a if a.ndim == 1 else a.max(1))
    pk = m.max() + 1e-12
    idx = np.where(m > pk * 10 ** (floor_db / 20))[0]
    end = (idx[-1] if len(idx) else len(a) - 1) + int(keep * sr)
    return fade(a[: min(len(a), end)], 0, keep, sr)


def fold_loop(a, n):
    """Make a seamless loop of n samples: everything past n wraps onto the start."""
    out = a[:n].copy()
    rest = a[n:]
    while len(rest):
        k = min(n, len(rest))
        out[:k] += rest[:k]
        rest = rest[k:]
    return out


# ═════════════════════════════════════════════════════════════════════════════
# THE JAZZ CLUB KIT (Swing Monkey, 2026-11-06)
# ═════════════════════════════════════════════════════════════════════════════

def ride(d=1.4, sr=SR, bell=0.0, rng=RNG):
    """Ride cymbal: a stick ping on a cluster of inharmonic modes plus wash.
    bell > 0 moves the strike toward the bell (fewer, purer, longer partials)."""
    t = secs(d, sr)
    parts = [(2870, 0.55, 4.2), (3460, 0.5, 4.8), (4150, 0.42, 5.5), (5020, 0.38, 6.4), (5890, 0.3, 7.5),
             (6930, 0.24, 8.4), (8110, 0.18, 9.6), (9420, 0.12, 11)]
    if bell:
        parts += [(1840, 0.9 * bell, 2.6), (2760, 0.5 * bell, 3.1), (4410, 0.3 * bell, 3.8)]
    p = modes(d, parts, sr, attack=0.0004)
    wash = band(noise(d, sr, rng), 4200, 14500, sr, 2) * np.exp(-t * 3.2) * np.minimum(1, t / 0.004)
    ping = band(noise(0.01, sr, rng), 3000, 12000, sr) * np.exp(-secs(0.01, sr) * 520)
    out = 0.55 * p + 0.33 * wash
    return place(out, ping, 0, sr, 0.7)


def crash(d=2.2, sr=SR, rng=RNG):
    t = secs(d, sr)
    wash = band(noise(d, sr, rng), 2600, 15000, sr, 2) * np.exp(-t * 1.9)
    body = modes(d, [(1730, 0.4, 3), (2510, 0.35, 3.4), (3390, 0.3, 4), (4630, 0.25, 4.5)], sr)
    return (wash * 0.8 + 0.3 * body) * np.minimum(1, t / 0.003)


def chick(d=0.07, sr=SR, rng=RNG):
    """Hi-hat closed with the foot: a short 'tsk' on 2 and 4."""
    t = secs(d, sr)
    a = band(noise(d, sr, rng), 5200, 13000, sr) * np.exp(-t * 60) * np.minimum(1, t / 0.002)
    return a + 0.25 * band(noise(d, sr, rng), 700, 2200, sr) * np.exp(-t * 90)


def snap(d=0.12, sr=SR, rng=RNG):
    """Finger snap."""
    t = secs(d, sr)
    a = band(noise(d, sr, rng), 1600, 5200, sr, 3) * np.exp(-t * 85)
    a += 0.6 * modes(d, [(2350, 1, 70), (3180, 0.6, 90)], sr)
    return a * np.minimum(1, t / 0.0008)


def rimshot(d=0.22, sr=SR, rng=RNG):
    """Stick across the rim: the crack the reels land on."""
    t = secs(d, sr)
    crack = band(noise(d, sr, rng), 1500, 9000, sr) * np.exp(-t * 55)
    ring = modes(d, [(910, 0.55, 32), (1430, 0.5, 40), (2120, 0.35, 55), (3270, 0.25, 70)], sr)
    head = np.sin(2 * np.pi * 220 * t) * np.exp(-t * 38) * 0.35
    return (0.9 * crack + ring + head) * np.minimum(1, t / 0.0006)


def tom(f=180, d=0.35, sr=SR, rng=RNG):
    t = secs(d, sr)
    fr = f * (1 + 0.25 * np.exp(-t * 30))
    body = np.sin(2 * np.pi * np.cumsum(fr) / sr) * np.exp(-t * 9)
    stick = band(noise(0.02, sr, rng), 1500, 7000, sr) * np.exp(-secs(0.02, sr) * 220)
    return place(body, stick, 0, sr, 0.6)


def brush_swish(d=0.4, sr=SR, rng=RNG):
    t = secs(d, sr)
    env = np.sin(np.pi * np.clip(t / d, 0, 1)) ** 1.3
    return sweep_noise(d, 1800, 5200, 3000, 9500, sr, rng) * env


def piano(f, d=0.9, sr=SR, vel=0.8, rng=RNG):
    """Stiff-string piano note: inharmonic partials, brighter when hit harder,
    two strings a hair apart, a felt-hammer knock."""
    t = secs(d, sr)
    B = 0.00035
    out = np.zeros_like(t)
    K = int(min(16, (sr * 0.45) // f))
    for k in range(1, K + 1):
        fk = k * f * math.sqrt(1 + B * k * k)
        a = (1 / k ** (1.5 - 0.6 * vel)) * (1 if k < 9 else 0.5)
        dec = 1.1 + 0.55 * k + f / 900
        for cents in (-0.9, 0.9):
            out += 0.5 * a * np.sin(2 * np.pi * fk * 2 ** (cents / 1200) * t + rng.uniform(0, 6.28)) * np.exp(-dec * t)
    hammer = band(noise(0.012, sr, rng), 800, 5000, sr) * np.exp(-secs(0.012, sr) * 300)
    out = place(out, hammer, 0, sr, 0.25 * vel)
    return out * np.minimum(1, t / 0.0015) * np.clip((d - t) / 0.05, 0, 1)


def upright(f, d=0.6, sr=SR, rng=RNG, slap=1.0):
    """Upright bass, plucked: a dark string, the finger's thump, a little
    fret-board slap that lets a phone speaker find the note."""
    s = ks(f, d, sr, t60=0.85, bright=0.42, rng=rng)
    t = secs(d, sr)
    s += 0.45 * np.sin(2 * np.pi * f * t) * np.exp(-t * 6)
    s += 0.22 * np.sin(4 * np.pi * f * t) * np.exp(-t * 9)
    finger = band(noise(0.03, sr, rng), 500, 2600, sr) * np.exp(-secs(0.03, sr) * 140)
    return fade(place(s, finger, 0, sr, 0.35 * slap), 0.001, 0.04, sr)


def muted_trumpet(f, d, sr=SR, bright=1.0):
    """Harmon-mute trumpet: a brass tone squeezed through a nasal 1.5–2.6 kHz band."""
    x = brass(f, d, sr, bright=bright, att=0.022, rel=0.07, section=1)
    nasal = band(x, 1300, 2800, sr, 2)
    return band(0.55 * x + 1.1 * nasal, 420, 7000, sr, 2)


def sax(f, d, sr=SR, bright=0.8, rng=RNG, growl=0.0):
    """Tenor-ish reed: breathy attack, delayed vibrato, buzzy upper partials."""
    t = secs(d, sr)
    env = np.minimum(1, t / 0.03) * (0.85 + 0.15 * np.exp(-t * 7)) * np.clip((d - t) / 0.08, 0, 1)
    cut = lambda tt: f * (2.2 + 6 * bright * (0.6 + 0.4 * np.exp(-tt * 4)))
    x = additive(f, d, sr, amps=lambda k: (1 / k ** 0.85) * (1.0 if k % 2 else 0.7), cutoff=cut, vib=(5.0, 0.007, 0.18))
    if growl:
        x *= 1 + growl * 0.25 * np.sin(2 * np.pi * 31 * t)
    breath = band(noise(d, sr, rng), 1400, 6500, sr) * 0.05 * (0.4 + np.exp(-t * 12))
    return (x + breath) * env


def banjo(f, d=0.5, sr=SR, rng=RNG):
    """One banjo string: a bright pluck through a drum-head resonator."""
    s = ks(f, d, sr, t60=0.45, bright=0.95, rng=rng)
    head = band(s, 900, 4200, sr, 2)
    return 0.6 * s + 0.7 * head


def strum(freqs, d=0.5, sr=SR, spread=0.011, rng=RNG, down=True):
    out = np.zeros(round(d * sr))
    order = freqs if down else freqs[::-1]
    for i, f in enumerate(order):
        place(out, banjo(f, d - i * spread, sr, rng), i * spread, sr, 1 / (1 + 0.1 * i))
    return out


def shake(f, d, sr=SR):
    """Brass 'shake': a lip trill a minor third wide climbing in speed."""
    t = secs(d, sr)
    rate = 7 + 6 * (t / d)
    wob = 0.5 + 0.5 * np.sign(np.sin(2 * np.pi * np.cumsum(rate) / sr))
    f_t = f * (1 + 0.19 * wob)
    ph = 2 * np.pi * np.cumsum(f_t) / sr
    x = sum((1 / k) * np.sin(k * ph) for k in range(1, 9))
    return x * np.minimum(1, t / 0.03) * np.clip((d - t) / 0.08, 0, 1)
