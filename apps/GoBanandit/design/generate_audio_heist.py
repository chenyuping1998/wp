#!/usr/bin/env python3
"""Go Banandit heist-caper sound set — synthesized from scratch, numpy/scipy only.

    python3 design/generate_audio_heist.py

Writes static/assets/audio/heist/*.wav. Nothing here is copied or resampled
from another game: the first submission shipped the Go Bananas jungle set
byte-for-byte and came back "Bad sound design" + "Reused assets" (2026-10-04).

The world is a 60s caper poster, so the palette is a small spy-jazz combo plus
the hardware of a robbery:

  band      upright bass, brushed kit + ride, vibraphone, Rhodes, muted and
            open trumpet section; in the free game a surf-twang guitar,
            combo organ and a straight beat (the heist is on)
  hardware  safe-dial ratchet, lock tumblers, cloth sacks and coins, a bill
            counter, a cash register, a roller shutter, an alarm bell

Every cue the game has its own moment for gets its own sound — the sack
landing, each sack arriving at the Bandit, the collect stamp, the shutter, the
alarm — instead of the template's multiplier sounds standing in for them.
Deterministic (seeded) so a re-run reproduces the files.
"""
import os
import wave

import numpy as np
import scipy.signal as ss

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, '..', 'static', 'assets', 'audio', 'heist')
os.makedirs(OUT, exist_ok=True)

SR = 44100
SR_BGM = 32000
rng = np.random.default_rng(20261004)


# ─── plumbing ────────────────────────────────────────────────────────────────
def tt(dur, sr=SR):
    return np.arange(int(round(dur * sr))) / sr


def zeros(dur, sr=SR):
    return np.zeros(int(round(dur * sr)))


def noise(n):
    return rng.uniform(-1, 1, n)


def _filt(x, kind, fc, sr, order=2):
    nyq = sr / 2
    if kind == 'band':
        wn = [max(1, fc[0]) / nyq, min(nyq - 1, fc[1]) / nyq]
    else:
        wn = min(fc, nyq - 1) / nyq
    sos = ss.butter(order, wn, btype=kind, output='sos')
    return ss.sosfilt(sos, x)


def lp(x, fc, sr=SR, order=2):
    return _filt(x, 'low', fc, sr, order)


def hp(x, fc, sr=SR, order=2):
    return _filt(x, 'high', fc, sr, order)


def bp(x, lo, hi, sr=SR, order=2):
    return _filt(x, 'band', (lo, hi), sr, order)


def place(dst, src, at, gain=1.0, sr=SR):
    i = int(round(at * sr))
    if i >= len(dst):
        return dst
    n = min(len(src), len(dst) - i)
    dst[i:i + n] += src[:n] * gain
    return dst


def fade(x, sr=SR, a=0.003, r=0.02):
    x = x.copy()
    na, nr = int(a * sr), int(r * sr)
    if na:
        x[:na] *= np.linspace(0, 1, na)
    if nr:
        x[-nr:] *= np.linspace(1, 0, nr)
    return x


def norm(x, peak=0.89):
    m = np.max(np.abs(x)) + 1e-9
    return x * (peak / m)


def mtof(m):
    return 440.0 * 2 ** ((m - 69) / 12)


_IR_CACHE = {}


def reverb(x, sr=SR, decay=1.2, mix=0.22, tone=6500, pre=0.012, key='room'):
    """Convolution with a synthetic room tail (decaying filtered noise)."""
    ck = (key, sr, decay, tone, pre)
    if ck not in _IR_CACHE:
        n = int(decay * sr)
        t = np.arange(n) / sr
        ir = noise(n) * np.exp(-6.9 * t / decay)
        ir = lp(ir, tone, sr)
        ir = hp(ir, 180, sr)
        # early reflections
        for d, g in ((0.011, 0.5), (0.019, 0.35), (0.027, 0.3), (0.041, 0.2)):
            k = int(d * sr)
            if k < n:
                ir[k] += g * 3
        ir = np.concatenate([np.zeros(int(pre * sr)), ir])
        ir /= np.sqrt(np.sum(ir ** 2)) + 1e-9
        _IR_CACHE[ck] = ir
    ir = _IR_CACHE[ck]
    wet = ss.fftconvolve(x, ir)
    out = np.zeros(len(wet))
    out[:len(x)] += x
    return out + wet * mix


def write(name, x, sr=SR, peak=0.89, tail=0.02):
    x = norm(x, peak)
    if tail:  # drop the reverb's inaudible end (below -54 dB of the peak)
        loud = np.nonzero(np.abs(x) > peak * 0.002)[0]
        if len(loud):
            x = x[:min(len(x), loud[-1] + int(0.03 * sr))]
    x = fade(x, sr, 0.001, tail)
    data = (np.clip(x, -1, 1) * 32767).astype('<i2')
    path = os.path.join(OUT, name)
    with wave.open(path, 'wb') as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(sr)
        w.writeframes(data.tobytes())
    print(f'wrote {name:24s} {len(x) / sr:5.2f}s {os.path.getsize(path) // 1024:5d}KB')


# ─── band instruments ────────────────────────────────────────────────────────
def bass(f, dur, vel=1.0, sr=SR):
    """Upright bass pluck: decaying harmonic stack, finger thump, small
    pitch drop on the attack."""
    t = tt(dur + 0.25, sr)
    out = np.zeros_like(t)
    drop = 1 + 0.018 * np.exp(-t / 0.03)
    for n in range(1, 9):
        amp = 1 / n ** 1.35
        tau = 0.9 / n ** 0.75
        ph = 2 * np.pi * np.cumsum(f * n * drop) / sr
        out += amp * np.exp(-t / tau) * np.sin(ph + rng.uniform(0, 6.28))
    thump = lp(noise(len(t)), 400, sr) * np.exp(-t / 0.012) * 0.8
    out = out + thump
    # damp at note end (player lifts the finger)
    off = int(dur * sr)
    rel = np.ones_like(t)
    rel[off:] = np.exp(-(t[off:] - t[off]) / 0.05)
    out = lp(out * rel, 1800, sr)
    return out * vel


def bass_pick(f, dur, vel=1.0, sr=SR):
    """Electric bass with a pick — the free game's tighter, brighter low end."""
    t = tt(dur + 0.12, sr)
    out = np.zeros_like(t)
    for n in range(1, 12):
        out += (1 / n ** 1.1) * np.exp(-t / (0.7 / n ** 0.5)) * np.sin(2 * np.pi * f * n * t)
    out += hp(noise(len(t)), 2000, sr) * np.exp(-t / 0.004) * 0.4
    off = int(dur * sr)
    out[off:] *= np.exp(-(t[off:] - t[off]) / 0.03)
    return lp(np.tanh(out * 1.4), 2600, sr) * vel


def vibes(f, dur=1.6, vel=1.0, trem=5.2, sr=SR):
    """Vibraphone: aluminium-bar partials (1, ~4, ~10), soft mallet, motor tremolo."""
    t = tt(dur, sr)
    out = np.zeros_like(t)
    for ratio, amp, tau in ((1.0, 1.0, 1.4), (3.99, 0.28, 0.32), (9.9, 0.07, 0.07)):
        out += amp * np.exp(-t / tau) * np.sin(2 * np.pi * f * ratio * t + rng.uniform(0, 6.28))
    mallet = lp(noise(len(t)), 2500, sr) * np.exp(-t / 0.004) * 0.25
    am = 1 - 0.32 * (0.5 + 0.5 * np.sin(2 * np.pi * trem * t))
    return (out * am + mallet) * vel


def rhodes(f, dur, vel=1.0, sr=SR):
    """Electric piano (FM tine): bark on the attack, soft bell, long body."""
    t = tt(dur + 0.4, sr)
    idx = 1.6 * vel * np.exp(-t / 0.22) + 0.25
    mod = np.sin(2 * np.pi * f * t)
    body = np.sin(2 * np.pi * f * t + idx * mod)
    tine = 0.12 * np.sin(2 * np.pi * f * 14 * t) * np.exp(-t / 0.05)
    env = np.exp(-t / 1.6)
    off = int(dur * sr)
    env[off:] *= np.exp(-(t[off:] - t[off]) / 0.12)
    return (body + tine) * env * vel


def _saw(f_curve, sr, top=7000):
    """Band-limited saw from a frequency curve (additive)."""
    ph = 2 * np.pi * np.cumsum(f_curve) / sr
    out = np.zeros_like(f_curve)
    fmax = np.max(f_curve)
    for k in range(1, int(top / fmax) + 1):
        out += np.sin(k * ph) / k
    return out


def trumpet(f, dur, vel=1.0, mute=True, fall=False, shake=False, sr=SR):
    """Trumpet. Muted = harmon-mute nasal formants; open = brassy, brighter
    with growl. `fall` drops the pitch at the end, `shake` is a lip trill."""
    t = tt(dur + 0.15, sr)
    vib = 1 + 0.006 * np.sin(2 * np.pi * 5.6 * t) * np.clip((t - 0.18) / 0.2, 0, 1)
    scoop = 1 - 0.035 * np.exp(-t / 0.035)
    fc = f * vib * scoop
    if shake:
        fc = fc * (1 + 0.06 * (0.5 + 0.5 * np.sign(np.sin(2 * np.pi * 9 * t))) * np.clip((t - 0.1) / 0.1, 0, 1))
    if fall:
        k = np.clip((t - dur * 0.6) / (dur * 0.4), 0, 1)
        fc = fc * (1 - 0.25 * k ** 2)
    raw = _saw(fc, sr)
    att = np.clip(t / (0.025 if not mute else 0.04), 0, 1)
    rel = np.where(t < dur, 1.0, np.exp(-(t - dur) / 0.05))
    env = att * rel * (1 - 0.15 * np.clip(t / 0.4, 0, 1))
    x = raw * env
    if mute:
        x = bp(x, 900, 1900, sr) * 1.4 + bp(x, 2400, 3600, sr) * 0.8 + lp(x, 500, sr) * 0.2
    else:
        bright = 0.35 + 0.65 * np.clip(t / 0.06, 0, 1)
        x = lp(x, 3800, sr) * bright + bp(x, 1100, 1700, sr) * 0.5
        x = np.tanh(x * 1.6)
    return x * vel


def brass_chord(notes, dur, vel=1.0, mute=False, fall=False, shake=False, sr=SR):
    out = zeros(dur + 0.2, sr)
    for i, m in enumerate(notes):
        detune = 1 + rng.uniform(-0.003, 0.003)
        place(out, trumpet(mtof(m) * detune, dur, 1.0, mute=mute, fall=fall, shake=shake, sr=sr),
              rng.uniform(0, 0.012), 1 / len(notes) ** 0.6, sr)
    return out * vel


def organ(f, dur, vel=1.0, sr=SR):
    """Combo organ: drawbar stack through a Leslie (AM + slight vibrato)."""
    t = tt(dur + 0.08, sr)
    lesl = 1 + 0.004 * np.sin(2 * np.pi * 6.3 * t)
    ph = 2 * np.pi * np.cumsum(f * lesl) / sr
    out = np.zeros_like(t)
    for r, a in ((1, 1), (2, 0.7), (3, 0.45), (4, 0.35), (6, 0.2), (8, 0.18)):
        out += a * np.sin(r * ph)
    out *= 1 - 0.18 * (0.5 + 0.5 * np.sin(2 * np.pi * 6.3 * t + 1.3))
    env = np.clip(t / 0.01, 0, 1) * np.where(t < dur, 1, np.exp(-(t - dur) / 0.03))
    click = hp(noise(len(t)), 3000, sr) * np.exp(-t / 0.003) * 0.3
    return lp(np.tanh(out * 0.6) * env + click, 5000, sr) * vel


def twang(f, dur, vel=1.0, sr=SR):
    """Surf guitar note: bright pluck through a spring, tremolo-picked 16ths."""
    t = tt(dur + 0.3, sr)
    out = np.zeros_like(t)
    step = 0.1
    k = 0
    while k * step < dur:
        tk = t - k * step
        m = tk >= 0
        p = np.zeros_like(t)
        for n in range(1, 10):
            p[m] += (1 / n) * np.exp(-tk[m] / (0.25 / n ** 0.4)) * np.sin(2 * np.pi * f * n * tk[m])
        out += p * (0.85 if k % 2 else 1.0)
        k += 1
    out = np.tanh(out * 1.8)
    out = bp(out, 180, 4200, sr)
    return out * vel


# ─── drums ───────────────────────────────────────────────────────────────────
def kick(vel=1.0, soft=False, sr=SR):
    t = tt(0.4, sr)
    f = 48 + (110 if not soft else 60) * np.exp(-t / 0.03)
    x = np.sin(2 * np.pi * np.cumsum(f) / sr) * np.exp(-t / (0.18 if not soft else 0.12))
    x += lp(noise(len(t)), 1500, sr) * np.exp(-t / 0.004) * (0.3 if not soft else 0.1)
    return x * vel


def snare(vel=1.0, sr=SR):
    t = tt(0.3, sr)
    body = np.sin(2 * np.pi * 185 * t) * np.exp(-t / 0.05) * 0.6
    wires = bp(noise(len(t)), 1800, 9000, sr) * np.exp(-t / 0.075)
    return (body + wires) * vel


def brush_tap(vel=1.0, sr=SR):
    t = tt(0.18, sr)
    x = bp(noise(len(t)), 1500, 7000, sr) * np.exp(-t / 0.03)
    x += np.sin(2 * np.pi * 200 * t) * np.exp(-t / 0.02) * 0.25
    return x * vel


def brush_swish(dur, vel=1.0, sr=SR):
    t = tt(dur, sr)
    env = np.sin(np.pi * np.clip(t / dur, 0, 1)) ** 1.5
    return bp(noise(len(t)), 2500, 8000, sr) * env * vel


_RIDE = {}


def ride(vel=1.0, sr=SR):
    if sr not in _RIDE:
        t = tt(1.6, sr)
        x = np.zeros_like(t)
        for _ in range(16):
            f = rng.uniform(3000, 9500)
            x += rng.uniform(0.3, 1) * np.sin(2 * np.pi * f * t + rng.uniform(0, 6.28)) * np.exp(-t / rng.uniform(0.25, 0.9))
        x = x / 16 + np.sin(2 * np.pi * 5200 * t) * np.exp(-t / 0.5) * 0.12
        x += hp(noise(len(t)), 6000, sr) * np.exp(-t / 0.35) * 0.35
        x += hp(noise(len(t)), 2000, sr) * np.exp(-t / 0.006) * 0.6  # stick
        _RIDE[sr] = x
    return _RIDE[sr] * vel


def hat(vel=1.0, open_=False, sr=SR):
    t = tt(0.35 if open_ else 0.08, sr)
    x = hp(noise(len(t)), 7000, sr, 3) * np.exp(-t / (0.12 if open_ else 0.018))
    return x * vel


def crash(vel=1.0, dur=2.2, sr=SR):
    t = tt(dur, sr)
    x = np.zeros_like(t)
    for _ in range(24):
        f = rng.uniform(2200, 11000)
        x += np.sin(2 * np.pi * f * t + rng.uniform(0, 6.28)) * np.exp(-t / rng.uniform(0.4, 1.4))
    x = x / 24 + hp(noise(len(t)), 3500, sr) * np.exp(-t / 0.7) * 0.8
    return x * np.clip(t / 0.002, 0, 1) * vel


def tom(f=110, vel=1.0, sr=SR):
    t = tt(0.45, sr)
    fc = f * (1 + 0.4 * np.exp(-t / 0.02))
    x = np.sin(2 * np.pi * np.cumsum(fc) / sr) * np.exp(-t / 0.2)
    x += bp(noise(len(t)), 300, 3000, sr) * np.exp(-t / 0.01) * 0.3
    return x * vel


def timpani(f=73, vel=1.0, sr=SR):
    t = tt(1.6, sr)
    x = np.zeros_like(t)
    for r, a, tau in ((1, 1, 0.9), (1.5, 0.5, 0.6), (1.98, 0.3, 0.4), (2.44, 0.18, 0.3)):
        x += a * np.sin(2 * np.pi * f * r * t) * np.exp(-t / tau)
    x += lp(noise(len(t)), 900, sr) * np.exp(-t / 0.02) * 0.6
    return x * vel


def snap(vel=1.0, sr=SR):
    t = tt(0.12, sr)
    return bp(noise(len(t)), 1800, 5500, sr) * np.exp(-t / 0.012) * vel


# ─── hardware ────────────────────────────────────────────────────────────────
def click(f=3800, vel=1.0, dur=0.035, sr=SR):
    """A small metal click — dial detent, latch, tumbler."""
    t = tt(dur, sr)
    x = np.sin(2 * np.pi * f * t) * np.exp(-t / 0.004)
    x += np.sin(2 * np.pi * f * 1.73 * t) * np.exp(-t / 0.002) * 0.6
    x += hp(noise(len(t)), 2500, sr) * np.exp(-t / 0.0015) * 0.8
    return x * vel


def clunk(f=95, vel=1.0, sr=SR):
    """Heavy bolt / lever: low knock plus a short metal ring."""
    t = tt(0.5, sr)
    x = np.sin(2 * np.pi * f * (1 + 0.3 * np.exp(-t / 0.01)) * t) * np.exp(-t / 0.07)
    for r in (7.1, 11.3, 17.9):
        x += 0.12 * np.sin(2 * np.pi * f * r * t) * np.exp(-t / 0.12)
    x += lp(noise(len(t)), 2500, sr) * np.exp(-t / 0.008) * 0.7
    return x * vel


def bell_strike(f, vel=1.0, dur=1.6, sr=SR):
    """Struck bell (alarm / register) — inharmonic partials."""
    t = tt(dur, sr)
    x = np.zeros_like(t)
    for r, a, tau in ((1, 1, 0.9), (2.32, 0.55, 0.5), (4.25, 0.3, 0.25), (6.63, 0.18, 0.14), (8.8, 0.08, 0.08)):
        x += a * np.sin(2 * np.pi * f * r * t + rng.uniform(0, 6.28)) * np.exp(-t / tau)
    x += hp(noise(len(t)), 4000, sr) * np.exp(-t / 0.002) * 0.4
    return x * vel


def coin(f=None, vel=1.0, sr=SR):
    f = f or rng.uniform(4200, 6200)
    t = tt(0.35, sr)
    x = np.zeros_like(t)
    for r, a, tau in ((1, 1, 0.16), (1.47, 0.6, 0.11), (2.09, 0.4, 0.07), (2.76, 0.25, 0.05)):
        x += a * np.sin(2 * np.pi * f * r * t + rng.uniform(0, 6.28)) * np.exp(-t / tau)
    return x * vel


def cloth_thump(vel=1.0, sr=SR):
    """A full cloth sack set down: soft low thud and rustle."""
    t = tt(0.4, sr)
    x = np.sin(2 * np.pi * 85 * (1 + 0.5 * np.exp(-t / 0.015)) * t) * np.exp(-t / 0.06)
    x += bp(noise(len(t)), 300, 2500, sr) * np.exp(-t / 0.05) * 0.5
    x += bp(noise(len(t)), 2500, 7000, sr) * np.exp(-t / 0.09) * 0.12  # rustle
    return x * vel


def whoosh(dur, vel=1.0, lo=300, hi=3000, sr=SR):
    t = tt(dur, sr)
    env = np.sin(np.pi * np.clip(t / dur, 0, 1)) ** 2
    n = noise(len(t))
    # sweep the band upward across the swing
    a = bp(n, lo, lo * 3, sr)
    b = bp(n, hi / 3, hi, sr)
    k = np.clip(t / dur, 0, 1)
    return (a * (1 - k) + b * k) * env * vel


# ─── SFX ─────────────────────────────────────────────────────────────────────
def sfx():
    # button: one detent of a safe dial
    write('btn.wav', click(4300, 1.0, 0.06) + click(2100, 0.4, 0.06), peak=0.45)

    # spin: the dial spun hard — a ratchet that slows, then the handle thrown
    x = zeros(0.55)
    times = np.cumsum(np.linspace(0.018, 0.045, 11))
    for i, at in enumerate(times):
        place(x, click(rng.uniform(3600, 4600), 0.75 - i * 0.03), at)
    place(x, clunk(120, 0.9), times[-1] + 0.03)
    write('spin.wav', reverb(x, decay=0.35, mix=0.12), peak=0.75)

    # reel stop: a drawer of the vault closing on felt — a deadened wood knock
    # (the five stops rise via playbackRate in Sound.svelte)
    t = tt(0.2)
    x = np.sin(2 * np.pi * 150 * (1 + 0.25 * np.exp(-t / 0.008)) * t) * np.exp(-t / 0.035)
    x += bp(noise(len(t)), 600, 3200, SR) * np.exp(-t / 0.006) * 0.5
    x += click(2600, 0.15, 0.2)
    write('reel_stop.wav', x, peak=0.7)

    # scatters 1..5: the vault plan unrolled — a rising vibes line on D minor,
    # each with a lock tumbler falling into place; louder and brighter as they go
    for i, m in enumerate((74, 77, 81, 84, 86)):
        x = zeros(1.4)
        place(x, vibes(mtof(m), 1.3, 1.0), 0.0)
        place(x, vibes(mtof(m + 12), 0.8, 0.25 + 0.05 * i), 0.02)
        place(x, click(3000 + i * 300, 0.5), 0.0)
        place(x, clunk(140 + i * 10, 0.25), 0.0)
        write(f'scatter_{i + 1}.wav', reverb(x, decay=1.0, mix=0.18), peak=0.6 + 0.04 * i)

    # sack landing on the reels — cloth thump with the coins inside settling
    x = zeros(0.45)
    place(x, cloth_thump(1.0), 0)
    for k in range(5):
        place(x, coin(None, 0.12), 0.02 + k * 0.022 + rng.uniform(0, 0.01))
    write('sack_land.wav', x, peak=0.55)

    # bandit landing: a muted-trumpet "wah-wah" and a finger snap — he's arrived
    x = zeros(0.75)
    place(x, snap(0.8), 0)
    place(x, trumpet(mtof(62), 0.16, 0.9, mute=True), 0.02)
    place(x, trumpet(mtof(65), 0.32, 1.0, mute=True, fall=True), 0.2)
    place(x, bass(mtof(38), 0.3, 0.8), 0.02)
    write('bandit_land.wav', reverb(x, decay=0.8, mix=0.16), peak=0.7)

    # collect start: the bag snapped open — a swing whoosh and a cloth crack
    x = zeros(0.5)
    place(x, whoosh(0.32, 1.0, 250, 4000), 0)
    place(x, snap(0.6), 0.26)
    place(x, cloth_thump(0.4), 0.27)
    write('collect_grab.wav', x, peak=0.6)

    # each sack arriving in the Bandit's bag — coins pouring in; Sound.svelte
    # raises the pitch sack by sack so a long collect climbs
    x = zeros(0.45)
    place(x, cloth_thump(0.55), 0)
    for k in range(7):
        place(x, coin(None, 0.35 * (1 - k / 9)), 0.012 + k * 0.03 + rng.uniform(0, 0.012))
    place(x, vibes(mtof(81), 0.4, 0.25), 0.01)
    write('coin_in.wav', x, peak=0.6)

    # collect multiplied (free game ×2/×3/×10): a rubber stamp and a brass hit
    x = zeros(1.3)
    place(x, clunk(80, 1.0), 0)
    place(x, kick(0.8), 0)
    place(x, brass_chord([62, 65, 69, 72], 0.5, 1.0, mute=False, fall=True), 0.03)
    place(x, crash(0.25, 1.1), 0.03)
    write('collect_stamp.wav', reverb(x, decay=1.2, mix=0.2), peak=0.82)

    # meter step (lock tumblers falling, then a chime) — rate per level in Sound
    x = zeros(1.1)
    for k in range(3):
        place(x, click(3200 + k * 400, 0.8), k * 0.07)
    place(x, clunk(150, 0.4), 0.21)
    place(x, vibes(mtof(81), 0.9, 0.7), 0.22)
    place(x, vibes(mtof(86), 0.9, 0.5), 0.3)
    write('tumbler_up.wav', reverb(x, decay=1.0, mix=0.2), peak=0.7)

    # dial tick (anticipation start, meter update)
    x = zeros(0.4)
    place(x, click(3600, 1.0), 0)
    place(x, click(3900, 0.7), 0.06)
    place(x, vibes(mtof(93), 0.3, 0.3), 0.06)
    write('dial_tick.wav', reverb(x, decay=0.6, mix=0.15), peak=0.5)

    # reel tension: a seamless 2 s loop at 120 bpm — ticking clock hats,
    # a heartbeat on the bass and a trembling vibes cluster
    L = 2.0
    x = zeros(L + 2)
    for b in range(8):
        place(x, hat(0.35 if b % 2 else 0.6), b * 0.25)
        place(x, click(5200, 0.12), b * 0.25)
    for b in (0, 1):
        place(x, bass(mtof(38), 0.18, 0.9), b * 1.0)
        place(x, bass(mtof(38), 0.18, 0.6), b * 1.0 + 0.2)
    for m in (69, 70):  # A + Bb rub: the alarm hasn't gone yet
        place(x, vibes(mtof(m + 12), L, 0.22, trem=8), 0)
    x = reverb(x, decay=0.8, mix=0.18)
    loop = x[:int(L * SR)].copy()
    tail = x[int(L * SR):]
    loop[:len(tail)] += tail[:len(loop)]
    write('reel_tension.wav', loop, peak=0.6, tail=0.0)

    # alarm bell (free game triggered): an electric bell clapper at ~22 Hz,
    # a brass stab under the first strike
    x = zeros(2.2)
    for k in range(int(1.6 * 22)):
        g = 0.55 + 0.45 * (k % 2)
        place(x, bell_strike(1180, g * (1 - k / 60), 0.6), k / 22)
    place(x, brass_chord([62, 65, 68, 71], 0.6, 0.9, mute=False), 0)
    place(x, timpani(73, 0.9), 0)
    write('alarm_bell.wav', reverb(x, decay=1.4, mix=0.22), peak=0.85)

    # the trip: the scatter that sets it off — two-tone siren whoop + hit
    t = tt(1.4)
    f = 700 + 300 * (0.5 + 0.5 * np.sign(np.sin(2 * np.pi * 3.5 * t)))
    siren = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.7) * np.clip(t / 0.02, 0, 1)
    siren = lp(np.tanh(siren * 2), 3500)
    x = zeros(1.6)
    place(x, siren, 0, 0.5)
    place(x, brass_chord([74, 77, 80, 83], 0.35, 1.0, mute=False), 0)
    place(x, crash(0.5, 1.4), 0)
    place(x, kick(1.0), 0)
    write('alarm_trip.wav', reverb(x, decay=1.2, mix=0.2), peak=0.85)

    # sack thrown at the shutter (the transition's wind-up)
    x = zeros(0.6)
    place(x, whoosh(0.5, 1.0, 200, 2500), 0)
    write('sack_throw.wav', x, peak=0.55)

    # the roller shutter coming down — slats rattling faster as it falls
    x = zeros(0.75)
    at = 0.0
    gap = 0.06
    while at < 0.55:
        place(x, bp(noise(int(0.03 * SR)), 900, 5000) * np.exp(-tt(0.03) / 0.008), at, 0.7)
        place(x, click(rng.uniform(1500, 2600), 0.35, 0.05), at)
        at += gap
        gap = max(0.022, gap * 0.88)
    t = tt(0.75)
    place(x, lp(noise(len(t)), 220) * np.clip(t / 0.4, 0, 1) * 1.6, 0)  # rumble
    write('shutter_down.wav', x, peak=0.7)

    # the shutter hitting the floor — also the free-spin count stamped on
    x = zeros(1.6)
    place(x, clunk(70, 1.0), 0)
    place(x, kick(1.0), 0)
    t = tt(1.0)
    ring = sum(np.sin(2 * np.pi * f * t) * np.exp(-t / tau) * a
               for f, a, tau in ((310, 0.3, 0.5), (523, 0.2, 0.35), (911, 0.15, 0.25), (1460, 0.1, 0.2)))
    place(x, ring, 0)
    place(x, bp(noise(len(t)), 800, 6000) * np.exp(-t / 0.05) * 0.6, 0)
    write('shutter_slam.wav', reverb(x, decay=1.3, mix=0.25), peak=0.88)

    # BUY BONUS: the safe door's bolt thrown back and the door swinging
    x = zeros(1.0)
    place(x, click(3000, 0.6), 0)
    place(x, click(3400, 0.6), 0.05)
    place(x, clunk(90, 1.0), 0.1)
    t = tt(0.7)
    creak = np.sin(2 * np.pi * np.cumsum(180 + 60 * np.sin(2 * np.pi * 1.5 * t) + rng.normal(0, 6, len(t))) / SR)
    creak = bp(np.tanh(creak * 3), 400, 2800) * np.sin(np.pi * t / 0.7) * 0.25
    place(x, creak, 0.2)
    place(x, brass_chord([62, 66, 69], 0.25, 0.6, mute=True), 0.12)
    write('safe_open.wav', reverb(x, decay=0.9, mix=0.18), peak=0.82)

    # free-game intro: the crew's theme stated once by the horns
    x = zeros(3.0)
    hits = [(0.0, [62, 65, 69, 76], 0.18), (0.27, [62, 65, 69, 76], 0.18),
            (0.6, [63, 67, 70, 77], 0.18), (0.87, [64, 68, 71, 78], 0.18),
            (1.2, [62, 65, 69, 74, 81], 1.2)]
    for at, chord, d in hits:
        place(x, brass_chord(chord, d, 1.0, mute=False, shake=d > 1), at)
        place(x, bass(mtof(chord[0] - 24), d + 0.05, 0.9), at)
        place(x, snare(0.6) if d < 1 else kick(1.0), at)
    place(x, crash(0.7, 1.8), 1.2)
    place(x, vibes(mtof(86), 1.6, 0.5), 1.2)
    write('fs_intro.wav', reverb(x, decay=1.6, mix=0.24), peak=0.88)

    # small win: two vibes notes and a walk-up on the bass
    x = zeros(1.2)
    place(x, vibes(mtof(74), 1.0, 0.8), 0)
    place(x, vibes(mtof(81), 1.0, 0.8), 0.14)
    for k, m in enumerate((38, 41, 45)):
        place(x, bass(mtof(m), 0.12, 0.7), k * 0.07)
    write('win_small.wav', reverb(x, decay=1.0, mix=0.2), peak=0.6)

    # bigger line win (feature total arrives, scatter pay)
    x = zeros(2.0)
    for k, m in enumerate((74, 77, 81, 84)):
        place(x, vibes(mtof(m), 1.4, 0.8), k * 0.09)
    place(x, brass_chord([62, 65, 69, 72], 0.7, 0.7, mute=True), 0.36)
    place(x, ride(0.4), 0.36)
    write('win_mid.wav', reverb(x, decay=1.4, mix=0.22), peak=0.75)

    # bill counter — a riffle of notes under the count-up (one pass)
    x = zeros(2.3)
    at = 0.0
    while at < 2.0:
        place(x, hp(noise(int(0.012 * SR)), 2200) * np.exp(-tt(0.012) / 0.003), at, 0.6)
        place(x, click(rng.uniform(1100, 1500), 0.1, 0.03), at)
        at += 1 / 34 + rng.uniform(-0.002, 0.002)
    t = tt(2.3)
    x += lp(noise(len(t)), 300) * 0.25 * np.clip(t / 0.05, 0, 1) * np.clip((2.1 - t) / 0.2, 0, 1)  # motor
    for k in range(6):
        place(x, coin(None, 0.15), 0.3 + k * 0.33)
    write('bill_counter.wav', x, peak=0.55)

    # cash register: the total-win panel
    x = zeros(1.8)
    for k in range(3):
        place(x, click(2400 + 300 * k, 0.6, 0.05), k * 0.05)
    place(x, clunk(110, 0.6), 0.16)
    place(x, bell_strike(2350, 1.0, 1.4), 0.18)
    place(x, whoosh(0.35, 0.4, 400, 2000), 0.2)  # drawer
    place(x, clunk(70, 0.5), 0.52)
    place(x, brass_chord([69, 74, 77, 81], 0.6, 0.6, mute=False), 0.18)
    write('cash_register.wav', reverb(x, decay=1.3, mix=0.2), peak=0.82)

    # big-win slam: low brass sforzando, timpani, crash
    x = zeros(2.4)
    place(x, brass_chord([38, 45, 50, 53], 0.9, 1.0, mute=False, fall=True), 0)
    place(x, brass_chord([62, 65, 69, 74], 0.9, 0.8, mute=False, fall=True), 0.0)
    place(x, timpani(55, 1.0), 0)
    place(x, kick(1.0), 0)
    place(x, crash(0.8, 2.2), 0)
    write('bigwin_slam.wav', reverb(x, decay=1.8, mix=0.25), peak=0.9)

    # tier fanfares: each longer, higher and busier than the last
    def fanfare(name, stabs, hold, top, drums):
        x = zeros(hold + stabs * 0.24 + 1.6)
        base = [62, 65, 69, 72]
        at = 0.0
        for s in range(stabs):
            chord = [m + 2 * s for m in base]
            place(x, brass_chord(chord, 0.16, 0.85), at)
            place(x, bass(mtof(chord[0] - 24), 0.18, 0.8), at)
            place(x, snare(0.5), at)
            if drums > 1:
                place(x, tom(140 - s * 12, 0.5), at + 0.12)
            at += 0.24
        final = [m + top for m in (62, 65, 69, 74, 77)]
        place(x, brass_chord(final, hold, 1.0, shake=True), at)
        place(x, bass(mtof(38 + top - 12), hold, 1.0), at)
        place(x, kick(1.0), at)
        place(x, crash(0.8, hold + 1.2), at)
        place(x, vibes(mtof(final[-1] + 12), hold + 0.5, 0.4), at)
        if drums > 2:  # snare roll under the hold
            k = 0
            while k * 0.045 < hold * 0.8:
                place(x, snare(0.15 + 0.2 * k * 0.045 / hold), at + k * 0.045)
                k += 1
            place(x, timpani(73, 0.9), at)
        write(name, reverb(x, decay=1.8, mix=0.25), peak=0.88)

    fanfare('win_big.wav', 1, 1.0, 0, 1)
    fanfare('win_super.wav', 2, 1.2, 2, 1)
    fanfare('win_mega.wav', 3, 1.4, 4, 2)
    fanfare('win_epic.wav', 4, 1.7, 5, 3)
    fanfare('win_max.wav', 5, 2.1, 7, 3)

    # max win reached: the big ending — band hit, register, alarm, held chord
    x = zeros(4.2)
    place(x, brass_chord([62, 66, 69, 74, 78, 81], 2.4, 1.0, shake=True), 0)
    place(x, bass(mtof(38), 2.4, 1.0), 0)
    place(x, timpani(55, 1.0), 0)
    place(x, crash(1.0, 3.5), 0)
    place(x, bell_strike(2350, 0.6, 1.4), 0.3)
    k = 0
    while k * 0.045 < 2.0:
        place(x, snare(0.15 + 0.25 * k / 44), k * 0.045)
        k += 1
    place(x, kick(1.0), 2.45)
    place(x, brass_chord([62, 66, 69, 74, 78, 81], 0.25, 1.0), 2.45)
    place(x, crash(1.0, 1.5), 2.45)
    write('win_cap.wav', reverb(x, decay=2.0, mix=0.26), peak=0.9)


# ─── voices: the two monkeys (formant-synth) ─────────────────────────────────
def voice(segments, sr=SR):
    """segments: (dur, f0_from, f0_to, F1, F2, breath, gain). Glottal pulse
    train through two resonators — a throat, not a whistle."""
    total = sum(s[0] for s in segments) + 0.2
    out = zeros(total, sr)
    at = 0.0
    for dur, f0a, f0b, F1, F2, breath, g in segments:
        t = tt(dur, sr)
        f0 = f0a * (f0b / f0a) ** (t / dur) * (1 + 0.02 * np.sin(2 * np.pi * 7 * t))
        ph = np.cumsum(f0) / sr
        pulse = (np.diff(np.floor(ph), prepend=0) > 0).astype(float)
        src = lp(pulse, 3500, sr) + noise(len(t)) * breath
        y = np.zeros_like(t)
        for F, bw, a in ((F1, 120, 1.0), (F2, 200, 0.6), (F2 * 1.7, 300, 0.25)):
            b, a_ = ss.iirpeak(F / (sr / 2), F / bw)
            y += ss.lfilter(b, a_, src) * a
        env = np.sin(np.pi * np.clip(t / dur, 0, 1)) ** 0.6
        place(out, y * env * g, at, 1.0, sr)
        at += dur
    return out


def voices():
    # the Bandit's laugh over the chest-beat (six strikes in ~2.6 s):
    # a low "huh" then a wheezing snicker that climbs
    segs = [(0.3, 180, 150, 650, 1100, 0.15, 1.0), (0.12, 0, 0, 0, 0, 0, 0)]
    for k in range(6):
        f = 300 + k * 18
        segs.append((0.14, f, f * 0.92, 750, 1500, 0.55, 0.85))
        segs.append((0.2, 0, 0, 0, 0, 0, 0))
    segs.append((0.35, 420, 560, 800, 1700, 0.3, 0.9))
    # silent segments: give them a harmless pitch so the maths stays finite
    segs = [s if s[1] else (s[0], 100, 100, 500, 1000, 0, 0) for s in segs]
    write('voice_laugh.wav', reverb(voice(segs), decay=0.6, mix=0.12), peak=0.8)

    # the throw: a clipped "hup!"
    segs = [(0.07, 240, 260, 500, 900, 0.5, 0.6), (0.16, 320, 260, 700, 1200, 0.25, 1.0)]
    write('voice_hup.wav', reverb(voice(segs), decay=0.4, mix=0.1), peak=0.8)


# ─── music ───────────────────────────────────────────────────────────────────
def render_loop(name, length, events, sr=SR_BGM, decay=1.6, mix=0.2, peak=0.8):
    """events: list of (time, buffer, gain). Rendered past the end and the
    tail wrapped onto the start, so the loop point is seamless."""
    x = zeros(length + 3.0, sr)
    for at, buf, g in events:
        place(x, buf, at, g, sr)
    x = reverb(x, sr, decay=decay, mix=mix, key='bgm')
    n = int(length * sr)
    loop = x[:n].copy()
    tail = x[n:]
    m = min(len(tail), n)
    loop[:m] += tail[:m]
    write(name, loop, sr, peak=peak, tail=0.0)


def bgm_main():
    """Cool spy-jazz: 12-bar D-minor blues, 112 bpm swing, two choruses.
    Chorus 1 muted trumpet, chorus 2 vibes; chromatic A-Bb-B-Bb line on the
    Rhodes; walking bass, brushes, ride."""
    sr = SR_BGM
    bpm = 112
    beat = 60 / bpm
    bar = 4 * beat
    sw = lambda e: (e // 2 + (2 / 3 if e % 2 else 0)) * beat  # swung eighth -> sec

    form = ['Dm7'] * 4 + ['Gm7'] * 2 + ['Dm7'] * 2 + ['Bb7', 'A7', 'Dm7', 'A7']
    roots = {'Dm7': 38, 'Gm7': 43, 'Bb7': 34, 'A7': 33}
    tones = {'Dm7': [0, 3, 7, 10], 'Gm7': [0, 3, 7, 10], 'Bb7': [0, 4, 7, 10], 'A7': [0, 4, 7, 10]}
    voicing = {'Dm7': [65, 69, 72, 76], 'Gm7': [65, 70, 74, 77], 'Bb7': [62, 65, 68, 72], 'A7': [61, 64, 67, 70]}
    chroma = [57, 58, 59, 58]  # A Bb B Bb

    melody = {
        1: [(4, 1, 74), (5, 1, 77), (6, 2, 79)],
        2: [(0, 1, 80), (1, 5, 79)],
        3: [(6, 1, 77), (7, 1, 74)],
        4: [(0, 3, 79), (3, 1, 77), (4, 4, 74)],
        5: [(6, 2, 72)],
        6: [(0, 6, 74)],
        8: [(0, 2, 77), (2, 2, 80), (4, 4, 82)],
        9: [(0, 3, 81), (3, 1, 79), (4, 4, 73)],
        10: [(0, 8, 74)],
        11: [(4, 1, 76), (5, 1, 79), (6, 2, 81)],
    }

    ev = []
    nbars = len(form) * 2
    for b in range(nbars):
        chorus = b // len(form)
        bi = b % len(form)
        ch = form[bi]
        nxt = form[(bi + 1) % len(form)]
        t0 = b * bar
        r = roots[ch]
        # walking bass: root, chord tone, chord tone, chromatic approach
        line = [r, r + rng.choice(tones[ch][1:3]), r + rng.choice(tones[ch][2:]),
                roots[nxt] + rng.choice([-1, 1])]
        if bi == len(form) - 1 and chorus == 1:
            line[3] = roots[form[0]] - 1
        for k, m in enumerate(line):
            ev.append((t0 + k * beat, bass(mtof(m), beat * 0.92, 0.95 if k == 0 else 0.8, sr), 0.95))
        # ride: 1, 2, a-2, 3, 4, a-4
        for e in (0, 2, 3, 4, 6, 7):
            if e in (3, 7):
                at = t0 + sw(e)
            else:
                at = t0 + (e // 2) * beat
            ev.append((at, ride(0.55 if e % 2 else 0.4, sr), 0.28))
        # hats on 2 & 4, brushes swishing every beat, feathered kick
        for k in range(4):
            ev.append((t0 + k * beat, brush_swish(beat, 0.25, sr), 0.6))
            ev.append((t0 + k * beat, kick(0.25, soft=True, sr=sr), 0.6))
        for k in (1, 3):
            ev.append((t0 + k * beat, hat(0.5, sr=sr), 0.5))
        # comping: snare taps on swung off-beats
        for e in rng.choice([1, 3, 5, 7], size=rng.integers(1, 3), replace=False):
            ev.append((t0 + sw(int(e)), brush_tap(0.5, sr), 0.45))
        # Rhodes: a short stab on the and-of-2, sometimes on 1
        ev.append((t0 + sw(3), sum_chord(voicing[ch], beat * 0.9, 0.45, sr), 0.42))
        if rng.random() < 0.4:
            ev.append((t0, sum_chord(voicing[ch], beat * 0.6, 0.35, sr), 0.38))
        # the chromatic line under Dm bars
        if ch == 'Dm7':
            ev.append((t0, rhodes(mtof(chroma[bi % 4]), bar * 0.95, 0.35, sr), 0.35))
        # melody
        for e, ln, m in melody.get(bi, []):
            d = max(beat * 0.3, sw(e + ln) - sw(e)) if e + ln < 8 else bar - sw(e)
            if chorus == 0:
                ev.append((t0 + sw(e), trumpet(mtof(m), d * 0.95, 0.75, mute=True, sr=sr), 0.6))
            else:
                ev.append((t0 + sw(e), vibes(mtof(m), max(1.0, d * 1.6), 0.9, sr=sr), 0.55))
        # chorus 2: trumpet holds long backgrounds instead
        if chorus == 1 and bi in (0, 4, 8):
            ev.append((t0, trumpet(mtof(69 if bi != 8 else 68), bar * 1.8, 0.4, mute=True, sr=sr), 0.32))
    render_loop('bgm_main.wav', nbars * bar, ev, decay=1.5, mix=0.2, peak=0.75)


def sum_chord(notes, dur, vel, sr):
    out = None
    for m in notes:
        r = rhodes(mtof(m), dur, vel, sr)
        out = r if out is None else out[:len(r)] + r[:len(out)]
    return out / len(notes) ** 0.5


def bgm_free():
    """The heist is on: E-minor surf-spy, 150 bpm straight. Chorus 1 organ
    melody over horn hits, chorus 2 tremolo surf guitar; picked bass ostinato,
    driving kit."""
    sr = SR_BGM
    bpm = 150
    beat = 60 / bpm
    bar = 4 * beat
    e8 = beat / 2
    form = ['Em'] * 4 + ['Am'] * 2 + ['Em'] * 2 + ['C', 'B7', 'Em', 'B7']
    roots = {'Em': 40, 'Am': 45, 'C': 36, 'B7': 35}
    ost = [0, 0, 3, 0, 5, 6, 7, 3]  # E E G E A Bb B G — the spy run
    stab = {'Em': [64, 67, 71], 'Am': [64, 69, 72], 'C': [64, 67, 72], 'B7': [63, 66, 69, 71]}
    mel = {
        0: [(0, 4, 76), (4, 2, 79), (6, 2, 78)],
        1: [(0, 6, 76), (6, 2, 71)],
        2: [(0, 2, 74), (2, 2, 76), (4, 4, 79)],
        3: [(0, 8, 78)],
        4: [(0, 4, 81), (4, 4, 79)],
        5: [(0, 4, 76), (4, 4, 72)],
        6: [(0, 8, 71)],
        7: [(4, 2, 74), (6, 2, 75)],
        8: [(0, 4, 76), (4, 4, 79)],
        9: [(0, 4, 78), (4, 4, 75)],
        10: [(0, 8, 76)],
        11: [(0, 4, 71), (4, 4, 75)],
    }
    ev = []
    nbars = len(form) * 2
    for b in range(nbars):
        chorus = b // len(form)
        bi = b % len(form)
        ch = form[bi]
        t0 = b * bar
        r = roots[ch]
        pat = ost if ch in ('Em', 'Am') else [0, 0, 7, 0, 10, 7, 5, 4] if ch == 'B7' else [0, 0, 4, 0, 7, 9, 7, 4]
        for k, iv in enumerate(pat):
            ev.append((t0 + k * e8, bass_pick(mtof(r + iv), e8 * 0.85, 0.9 if k % 2 == 0 else 0.7, sr), 0.85))
        # drums
        for k in range(8):
            ev.append((t0 + k * e8, hat(0.6 if k % 2 == 0 else 0.4, open_=(k == 7 and bi % 2), sr=sr), 0.35))
        for k in (0, 3, 4):  # kick 1, and-of-2, 3
            ev.append((t0 + k * e8, kick(1.0, sr=sr), 0.75))
        for k in (2, 6):
            ev.append((t0 + k * e8, snare(0.9, sr), 0.55))
        if bi == len(form) - 1:  # tom fill into the top
            for k, f in enumerate((180, 160, 140, 120, 100, 90)):
                ev.append((t0 + 2 * beat + k * (beat / 3), tom(f, 0.8, sr), 0.6))
        if bi == 0:
            ev.append((t0, crash(0.6, 2.0, sr), 0.35))
        # horn hits on the and-of-4 / 1, organ pad underneath
        if bi % 2 == 1:
            ev.append((t0 + 7 * e8, brass_chord(stab[ch], e8 * 0.9, 0.7, sr=sr), 0.35))
        for m in stab[ch]:
            ev.append((t0, organ(mtof(m - 12), bar * 0.98, 0.18, sr), 0.4))
        # melody
        for e, ln, m in mel.get(bi, []):
            d = ln * e8
            if chorus == 0:
                ev.append((t0 + e * e8, organ(mtof(m), d * 0.9, 0.5, sr), 0.42))
            else:
                ev.append((t0 + e * e8, twang(mtof(m - 12), d * 0.95, 0.6, sr), 0.5))
    render_loop('bgm_freespin.wav', nbars * bar, ev, decay=1.1, mix=0.22, peak=0.78)


if __name__ == '__main__':
    import sys
    which = set(sys.argv[1:]) or {'sfx', 'voices', 'main', 'free'}
    if 'sfx' in which:
        sfx()
    if 'voices' in which:
        voices()
    if 'main' in which:
        bgm_main()
    if 'free' in which:
        bgm_free()


def sprite():
    """Rebuild the template sprite (sounds.json + sounds.wav) from THIS set.
    Sound.svelte maps every name to a heist clip, so the sprite should never
    sound — but it is still preloaded and shipped, and it must not be the Go
    Bananas file. Each key points at the clip it is routed to (22 kHz)."""
    import json
    import re
    src = open(os.path.join(HERE, '..', 'src', 'components', 'Sound.svelte')).read()
    body = src[src.index('const SPRITE_TO_CN'):]
    body = body[:body.index('\n\t};')]
    route = dict(re.findall(r"(\w+): \{ name: '(\w+)'", body))
    route.update({'sfx_anticipation': 'reel_tension', 'sfx_bigwin_coinloop': 'bill_counter',
                  'bgm_main': 'reel_tension', 'bgm_freespin': 'reel_tension',
                  'bgm_winlevel_big': 'win_big', 'bgm_winlevel_superwin': 'win_super',
                  'bgm_winlevel_mega': 'win_mega', 'bgm_winlevel_epic': 'win_epic',
                  'bgm_winlevel_max': 'win_max'})
    sr = 22050
    clips, offsets, parts, at = {}, {}, [], 0
    for key, clip in sorted(route.items()):
        if clip not in offsets:
            with wave.open(os.path.join(OUT, clip + '.wav')) as w:
                x = np.frombuffer(w.readframes(w.getnframes()), '<i2').astype(float)
            y = ss.resample_poly(x, 1, 2).astype('<i2')
            offsets[clip] = (at, len(y) / sr * 1000)
            parts += [y, np.zeros(int(0.1 * sr), '<i2')]
            at += (len(y) / sr + 0.1) * 1000
        clips[key] = offsets[clip]
    data = np.concatenate(parts)
    aud = os.path.join(OUT, '..')
    with wave.open(os.path.join(aud, 'sounds.wav'), 'wb') as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(sr)
        w.writeframes(data.tobytes())
    loops = {'sfx_anticipation', 'sfx_bigwin_coinloop', 'bgm_main', 'bgm_freespin'} | {k for k in route if k.startswith('bgm_winlevel')}
    js = {'src': ['./assets/audio/sounds.wav'],
          'sprite': {k: [round(v[0], 1), round(v[1], 1)] + ([True] if k in loops else []) for k, v in sorted(clips.items())},
          'config': {k: {'volume': 1} for k in sorted(clips)}}
    json.dump(js, open(os.path.join(aud, 'sounds.json'), 'w'), indent=1)
    print(f'wrote sounds.wav {len(data) / sr:.1f}s {os.path.getsize(os.path.join(aud, "sounds.wav")) // 1024}KB, {len(clips)} keys')


if __name__ == '__main__' and 'sprite' in __import__('sys').argv[1:]:
    sprite()
