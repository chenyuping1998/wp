"""Pickle Panic sound kit: the DSP building blocks for generate_pickle_audio_v2.py.

Everything is synthesised from first principles (no samples), but not the way
v1 was — v1 pitched one sine pluck by a cue's index, so half the set came out
byte-identical. Here every sound is built from the physics of the thing it is:

  modal()      struck objects as damped inharmonic partials (bells, jars, steel)
  pluck()      plucked strings as additive harmonics with frequency-dependent
               decay and a pick-position comb (surf guitar, bass)
  organ()      drawbar additive + rotary speaker wobble (Farfisa-ish combo organ)
  glide()      continuous-phase oscillator over a frequency curve (theremin)
  brass()      saw stacks whose harmonics open and close with a filter envelope,
               done additively so the "filter" can move without an IIR loop
  kick/snare/hat/...  the drum kit
  room()/spring()     synthetic impulse responses for fftconvolve

All arrays are float64; stereo is shape (2, n). Nothing here writes files.
"""
from __future__ import annotations

import numpy as np
from scipy import signal

SR = 48000
RNG = np.random.default_rng(20261013)


# ── basics ─────────────────────────────────────────────────────────────────

def n_of(dur: float) -> int:
    return max(1, int(round(dur * SR)))


def tt(dur: float) -> np.ndarray:
    return np.arange(n_of(dur)) / SR


def noise(dur: float) -> np.ndarray:
    return RNG.standard_normal(n_of(dur))


def midi(m: float) -> float:
    return 440.0 * 2 ** ((m - 69) / 12)


NOTE = {'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3, 'E': 4, 'F': 5, 'F#': 6, 'Gb': 6,
        'G': 7, 'G#': 8, 'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11}


def nm(name: str) -> int:
    """'E3' -> midi number."""
    if name[1:2] in ('#', 'b'):
        p, o = name[:2], int(name[2:])
    else:
        p, o = name[:1], int(name[1:])
    return 12 * (o + 1) + NOTE[p]


def hz(name: str) -> float:
    return midi(nm(name))


def env_ad(n: int, attack: float, decay_tau: float) -> np.ndarray:
    t = np.arange(n) / SR
    a = np.clip(t / max(attack, 1e-4), 0, 1)
    return a * np.exp(-np.maximum(0, t - attack) / decay_tau)


def env_adsr(n: int, a: float, d: float, s: float, r: float, gate: float) -> np.ndarray:
    """gate = seconds held before release."""
    t = np.arange(n) / SR
    e = np.where(t < a, t / max(a, 1e-4), 1.0)
    dec = np.clip((t - a) / max(d, 1e-4), 0, 1)
    e = np.where(t >= a, 1 - (1 - s) * dec, e)
    rel = np.clip((t - gate) / max(r, 1e-4), 0, 1)
    held = np.interp(min(gate, t[-1] if len(t) else 0), t, e) if len(t) else 0
    e = np.where(t >= gate, held * (1 - rel), e)
    return e


def fade(x: np.ndarray, fin: float = 0.002, fout: float = 0.01) -> np.ndarray:
    x = x.copy()
    n = x.shape[-1]
    a, b = min(n, n_of(fin)), min(n, n_of(fout))
    if a > 1:
        x[..., :a] *= np.linspace(0, 1, a)
    if b > 1:
        x[..., -b:] *= np.linspace(1, 0, b)
    return x


def sat(x: np.ndarray, drive: float = 1.5) -> np.ndarray:
    return np.tanh(x * drive) / np.tanh(drive)


# ── filters ────────────────────────────────────────────────────────────────

def _sos(kind, f, order=2):
    nyq = SR / 2
    if kind == 'band':
        lo, hi = f
        lo, hi = max(10, lo), min(nyq * 0.98, hi)
        return signal.butter(order, [lo, hi], 'band', fs=SR, output='sos')
    return signal.butter(order, min(nyq * 0.98, max(10, f)), kind, fs=SR, output='sos')


def lp(x, f, order=2):
    return signal.sosfilt(_sos('low', f, order), x, axis=-1)


def hp(x, f, order=2):
    return signal.sosfilt(_sos('high', f, order), x, axis=-1)


def bp(x, lo, hi, order=2):
    return signal.sosfilt(_sos('band', (lo, hi), order), x, axis=-1)


def reson(x, f, q):
    """Two-pole resonator (constant peak gain)."""
    b, a = signal.iirpeak(min(f, SR / 2 * 0.95), q, fs=SR)
    return signal.lfilter(b, a, x, axis=-1)


def sweep_bp(x, f0, f1, q=4.0, block=256, curve='exp'):
    """Band-pass whose centre moves from f0 to f1 over the clip (blockwise)."""
    out = np.zeros_like(x)
    n = len(x)
    nb = int(np.ceil(n / block))
    zi = None
    for i in range(nb):
        k = i / max(1, nb - 1)
        f = f0 * (f1 / f0) ** k if curve == 'exp' else f0 + (f1 - f0) * k
        bw = f / q
        sos = signal.butter(1, [max(20, f - bw / 2), min(SR / 2 * 0.95, f + bw / 2)], 'band', fs=SR, output='sos')
        if zi is None:
            zi = np.zeros((sos.shape[0], 2))
        seg = x[i * block:(i + 1) * block]
        y, zi = signal.sosfilt(sos, seg, zi=zi)
        out[i * block:(i + 1) * block] = y
    return out


# ── space ──────────────────────────────────────────────────────────────────

def pan(x: np.ndarray, p: float = 0.0) -> np.ndarray:
    """Mono -> stereo, constant power. p in [-1, 1]."""
    a = (p + 1) * np.pi / 4
    return np.vstack([x * np.cos(a), x * np.sin(a)])


def st(x: np.ndarray) -> np.ndarray:
    return x if x.ndim == 2 else pan(x, 0)


def widen(x: np.ndarray, ms: float = 9.0) -> np.ndarray:
    """Haas-style width for a mono source: right channel slightly late."""
    d = n_of(ms / 1000)
    l = x
    r = np.concatenate([np.zeros(d), x[:-d]]) if d < len(x) else x
    return np.vstack([l, r]) / np.sqrt(2) * 1.25


def room_ir(dur=1.4, bright=6000, predelay=0.012, stereo=True):
    n = n_of(dur)
    t = np.arange(n) / SR
    out = []
    for ch in range(2 if stereo else 1):
        nz = RNG.standard_normal(n)
        # high frequencies die faster: split in two bands with different decays
        lo = lp(nz, 1200) * np.exp(-t / (dur * 0.30))
        hi = hp(nz, 1200) * np.exp(-t / (dur * 0.14))
        ir = lp(lo + 0.6 * hi, bright)
        # a few early reflections
        for k in range(6):
            i = n_of(predelay + 0.004 * k + RNG.uniform(0, 0.012))
            if i < n:
                ir[i] += RNG.uniform(0.3, 0.7) * (1 if RNG.random() > 0.5 else -1)
        pd = n_of(predelay)
        ir = np.concatenate([np.zeros(pd), ir[:-pd]])
        out.append(ir / np.sqrt(np.sum(ir ** 2)))
    return np.array(out)


def spring_ir(dur=2.2, period=0.031, stereo=True):
    """Surf spring tank: a train of dispersive chirps (high arrives first)."""
    n = n_of(dur)
    out = []
    for ch in range(2 if stereo else 1):
        ir = np.zeros(n)
        cl = n_of(0.022)
        tc = np.arange(cl) / SR
        # dispersive chirp: frequency falls from 4k to 250 Hz across the burst
        f = 4000 * (250 / 4000) ** (tc / tc[-1])
        ph = 2 * np.pi * np.cumsum(f) / SR
        chirp = np.sin(ph) * np.hanning(cl)
        k = 0
        pos = n_of(0.006 + 0.002 * ch)
        while pos + cl < n:
            amp = np.exp(-pos / SR / (dur * 0.28)) * (1 if k % 2 == 0 else -0.8)
            ir[pos:pos + cl] += chirp * amp
            pos += n_of(period * RNG.uniform(0.92, 1.08))
            k += 1
        ir += 0.15 * RNG.standard_normal(n) * np.exp(-np.arange(n) / SR / (dur * 0.25))
        ir = bp(ir, 180, 5000)
        out.append(ir / np.sqrt(np.sum(ir ** 2)))
    return np.array(out)


_IR_CACHE: dict = {}


def reverb(x: np.ndarray, kind='room', wet=0.25, dur=1.4, **kw) -> np.ndarray:
    key = (kind, dur, tuple(sorted(kw.items())))
    if key not in _IR_CACHE:
        _IR_CACHE[key] = room_ir(dur, **kw) if kind == 'room' else spring_ir(dur, **kw)
    ir = _IR_CACHE[key]
    x = st(x)
    n = x.shape[1] + ir.shape[1] - 1
    wetsig = np.vstack([signal.fftconvolve(x[c], ir[c])[:n] for c in range(2)])
    dry = np.pad(x, ((0, 0), (0, n - x.shape[1])))
    return dry * (1 - wet * 0.5) + wetsig * wet


def reverb_circular(x: np.ndarray, kind='room', wet=0.25, dur=1.4, **kw) -> np.ndarray:
    """Reverb for a LOOP: the tail wraps onto the start so the loop is seamless."""
    L = x.shape[-1]
    y = reverb(x, kind, wet, dur, **kw)
    out = y[:, :L].copy()
    tail = y[:, L:]
    while tail.shape[1] > 0:
        k = min(L, tail.shape[1])
        out[:, :k] += tail[:, :k]
        tail = tail[:, k:]
    return out


# ── sources ────────────────────────────────────────────────────────────────

def modal(freqs, amps, decays, dur, phase_rand=True, detune=0.0):
    """Struck object: sum of exponentially damped sines."""
    t = tt(dur)
    y = np.zeros_like(t)
    for f, a, d in zip(freqs, amps, decays):
        if f >= SR / 2 * 0.95:
            continue
        ph = RNG.uniform(0, 2 * np.pi) if phase_rand else 0
        ff = f * (1 + detune * RNG.uniform(-1, 1))
        y += a * np.sin(2 * np.pi * ff * t + ph) * np.exp(-t / d)
    return tailfade(y)


def tailfade(x: np.ndarray, frac: float = 0.35) -> np.ndarray:
    """Raised-cosine release over the last `frac` of a clip, so a resonance that
    is still ringing when its buffer ends dies away instead of being cut (a cut
    is a click, and it shows as a hard vertical edge on a spectrogram)."""
    n = x.shape[-1]
    k = max(2, int(n * frac))
    w = np.ones(n)
    w[-k:] = 0.5 * (1 + np.cos(np.linspace(0, np.pi, k)))
    return x * w


def strike(dur=0.004, lo=1500, hi=9000):
    """The contact noise of a hit."""
    x = noise(dur) * np.exp(-tt(dur) / (dur / 4))
    return bp(x, lo, hi)


def pluck(f, dur, bright=1.0, decay=1.2, pickpos=0.18, nh=None, inharm=0.00008):
    """Plucked string, additive. Higher harmonics decay faster."""
    t = tt(dur)
    if nh is None:
        nh = int(min(60, (SR / 2 * 0.9) // f))
    h = np.arange(1, nh + 1)
    fh = f * h * np.sqrt(1 + inharm * h ** 2)
    keep = fh < SR / 2 * 0.92
    h, fh = h[keep], fh[keep]
    amp = np.abs(np.sin(np.pi * h * pickpos)) / h ** (1.15 / max(0.4, bright))
    tau = decay / (1 + (fh / 1800.0) ** 1.3 / max(0.3, bright))
    ph = RNG.uniform(0, 2 * np.pi, len(h))
    y = np.zeros_like(t)
    # chunk over harmonics to cap memory
    for i in range(0, len(h), 16):
        sl = slice(i, i + 16)
        y += (amp[sl, None] * np.sin(2 * np.pi * fh[sl, None] * t[None, :] + ph[sl, None])
              * np.exp(-t[None, :] / tau[sl, None])).sum(0)
    att = np.clip(t / 0.0015, 0, 1)
    return y * att / max(1e-9, np.max(np.abs(y)))


def additive(f, dur, partials, decays=None, vib=0.0, vib_rate=5.5):
    t = tt(dur)
    ph_mod = vib * np.sin(2 * np.pi * vib_rate * t) / vib_rate if vib else 0
    y = np.zeros_like(t)
    for i, (r, a) in enumerate(partials):
        if f * r >= SR / 2 * 0.95:
            continue
        e = np.exp(-t / decays[i]) if decays is not None else 1
        y += a * np.sin(2 * np.pi * f * r * t + 2 * np.pi * f * r * ph_mod) * e
    return y


def organ(f, dur, gate=None, leslie=6.2, perc=True):
    """Combo organ: drawbars 8' 4' 2-2/3' 2' + a bit of square-ish buzz."""
    gate = dur if gate is None else gate
    t = tt(dur)
    bars = [(0.5, 0.25), (1, 1.0), (2, 0.7), (3, 0.45), (4, 0.35), (5, 0.12), (6, 0.18), (8, 0.12)]
    y = np.zeros_like(t)
    wob = 0.0025 * np.sin(2 * np.pi * leslie * t)
    for r, a in bars:
        fr = f * r
        if fr > SR / 2 * 0.9:
            continue
        y += a * np.sin(2 * np.pi * fr * (t + wob / (2 * np.pi)))
    if perc:
        y += 0.5 * np.sin(2 * np.pi * f * 3 * t) * np.exp(-t / 0.12)
    am = 1 + 0.18 * np.sin(2 * np.pi * leslie * t + 1.3)
    e = env_adsr(len(t), 0.006, 0.05, 0.85, 0.06, gate)
    return sat(y * am * e * 0.35, 1.3)


def glide(freq_curve: np.ndarray, vib_depth=0.012, vib_rate=5.6, harmonics=((1, 1), (2, 0.12), (3, 0.05))):
    """Continuous-phase oscillator over a per-sample frequency curve (theremin)."""
    n = len(freq_curve)
    t = np.arange(n) / SR
    f = freq_curve * (1 + vib_depth * np.sin(2 * np.pi * vib_rate * t + 0.3 * np.sin(2 * np.pi * 0.37 * t)))
    ph = 2 * np.pi * np.cumsum(f) / SR
    y = np.zeros(n)
    for r, a in harmonics:
        y += a * np.sin(r * ph)
    return y


def brass(f, dur, gate=None, bright=1.0, detune=0.004, voices=3):
    """Saw-stack brass with a filter envelope, done additively."""
    gate = dur if gate is None else gate
    t = tt(dur)
    # cutoff in multiples of f: swells open on the attack, settles, closes on release
    cut = 1.5 + bright * (10 * (1 - np.exp(-t / 0.05)) * np.exp(-t / 0.5) + 5)
    cut = cut * np.where(t > gate, np.exp(-(t - gate) / 0.08), 1)
    nh = int(min(40, (SR / 2 * 0.9) // f))
    y = np.zeros_like(t)
    for v in range(voices):
        dv = 1 + detune * (v - (voices - 1) / 2)
        ph0 = RNG.uniform(0, 2 * np.pi)
        for h in range(1, nh + 1):
            g = 1 / h / (1 + np.exp((h - cut) * 1.4))
            y += g * np.sin(2 * np.pi * f * dv * h * t + ph0 * h)
    e = env_adsr(len(t), 0.025, 0.15, 0.8, 0.09, gate)
    return sat(y * e / voices * 0.6, 1.6)


# ── drums ──────────────────────────────────────────────────────────────────

def kick(dur=0.45, f0=150, f1=46, punch=1.0):
    t = tt(dur)
    f = f1 + (f0 - f1) * np.exp(-t / 0.035)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.22)
    click = hp(noise(dur), 2500) * np.exp(-t / 0.004) * 0.35 * punch
    return sat(body + click, 1.8)


def snare(dur=0.3, tone=190, snap=1.0):
    t = tt(dur)
    shell = (np.sin(2 * np.pi * tone * t) + 0.5 * np.sin(2 * np.pi * tone * 1.72 * t)) * np.exp(-t / 0.05)
    wires = bp(noise(dur), 1500, 9000) * np.exp(-t / 0.11) * snap
    return sat(0.8 * shell + 1.1 * wires, 1.4)


def hat(dur=0.05, open_=False):
    d = 0.32 if open_ else dur
    t = tt(d)
    x = hp(noise(d), 7000, 3)
    # a little metallic ring from a few high square partials
    ring = sum(np.sign(np.sin(2 * np.pi * f * t)) for f in (3420, 5310, 6790)) * 0.06
    e = np.exp(-t / (0.12 if open_ else 0.018))
    return (x + hp(ring, 6000)) * e


def tamb(dur=0.18):
    t = tt(dur)
    jingles = modal([6200, 7900, 9300, 11200], [1, 0.8, 0.6, 0.4], [0.05, 0.04, 0.035, 0.03], dur)
    shake = bp(noise(dur), 5000, 14000) * np.exp(-t / 0.04)
    return 0.6 * jingles + shake


def clap(dur=0.25):
    t = tt(dur)
    x = np.zeros_like(t)
    for k, off in enumerate((0, 0.009, 0.019)):
        i = n_of(off)
        seg = bp(noise(dur - off), 900, 5000) * np.exp(-np.arange(len(t) - i) / SR / (0.01 if k < 2 else 0.08))
        x[i:] += seg
    return x


def tom(f=110, dur=0.5):
    t = tt(dur)
    fr = f * (1 + 0.6 * np.exp(-t / 0.04))
    return sat(np.sin(2 * np.pi * np.cumsum(fr) / SR) * np.exp(-t / 0.2) + 0.2 * bp(noise(dur), 200, 2000) * np.exp(-t / 0.03), 1.4)


def crash(dur=2.4):
    t = tt(dur)
    x = hp(noise(dur), 3000) * np.exp(-t / 0.8)
    metal = modal(np.array([523, 811, 1193, 1607, 2311, 3197, 4417]) * 1.7, [0.3] * 7, [1.1, 0.9, 0.8, 0.7, 0.6, 0.5, 0.4], dur)
    return tailfade(0.7 * x + 0.25 * hp(metal, 800), 0.4)


# ── voice (formant) ─────────────────────────────────────────────────────────

VOWELS = {
    # F1, F2, F3 (Hz) and bandwidths, adult male; scaled for the female voice
    'a': ((730, 90), (1090, 110), (2440, 170)),
    'u': ((300, 70), (870, 90), (2240, 150)),
    'uh': ((640, 90), (1190, 110), (2390, 170)),
    'e': ((530, 80), (1840, 100), (2480, 160)),
}


def glottal(f0_curve: np.ndarray, open_q=0.6, jitter=0.01, shimmer=0.08):
    """Rosenberg-ish glottal pulse train with jitter/shimmer for a rough voice."""
    n = len(f0_curve)
    f = f0_curve * (1 + jitter * lp(RNG.standard_normal(n), 30))
    ph = np.cumsum(f) / SR
    frac = ph % 1.0
    pulse = np.where(frac < open_q, 0.5 * (1 - np.cos(np.pi * frac / open_q)), np.cos(np.pi * (frac - open_q) / (2 * (1 - open_q))))
    pulse = np.where(frac < open_q, pulse, np.maximum(0, pulse))
    cyc = np.floor(ph)
    amp = 1 + shimmer * np.sin(cyc * 2.39)
    d = np.diff(pulse, prepend=0) * amp  # radiation: differentiate
    return d / (np.max(np.abs(d)) + 1e-9)


def formant(src: np.ndarray, vowel='a', scale=1.0, gains=(1.0, 0.6, 0.35)):
    y = np.zeros_like(src)
    for (f, bw), g in zip(VOWELS[vowel], gains):
        fs_ = f * scale
        y += g * reson(src, fs_, fs_ / (bw * scale))
    return y
