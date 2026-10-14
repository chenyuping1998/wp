"""Pickle Panic — sound set v2 (2026-10-13). Replaces generate_pickle_audio.py.

Brief: design/ART_REQUEST_2026-10-13.md §S. A B-movie sci-fi diner: combo
organ, surf guitar through a spring tank, a theremin, a little brass, and the
real hardware of the place — service bells, glass jars, steel trays, a blast
door, steam. Every cue is its own sound; variants where a cue repeats a lot.

    /Applications/anaconda3/bin/python3 design/generate_pickle_audio_v2.py [--only name,name] [--no-music]

Writes static/assets/audio/pickle/*.wav (SFX, 48 kHz stereo 16-bit),
static/assets/audio/pickle/bgm_*.m4a (music stems, AAC via afconvert) and
design/audio_v2_report.json (loudness, peak, length, sha256 for every file).
"""
from __future__ import annotations

import hashlib
import json
import subprocess
import sys
import wave
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
from audio_dsp import *  # noqa: E402,F401,F403
from audio_dsp import RNG, SR  # noqa: E402

APP = Path(__file__).resolve().parents[1]
OUT = APP / 'static/assets/audio/pickle'
OUT.mkdir(parents=True, exist_ok=True)
REPORT = APP / 'design/audio_v2_report.json'


# ── loudness (ITU-R BS.1770-4) ─────────────────────────────────────────────

def _kweight(x):
    from scipy import signal as sg
    b1, a1 = [1.53512485958697, -2.69169618940638, 1.19839281085285], [1.0, -1.69065929318241, 0.73248077421585]
    b2, a2 = [1.0, -2.0, 1.0], [1.0, -1.99004745483398, 0.99007225036621]
    return sg.lfilter(b2, a2, sg.lfilter(b1, a1, x, axis=-1), axis=-1)


def lufs(x: np.ndarray) -> float:
    x = st(x)
    y = _kweight(x)
    n = y.shape[1]
    blk, hop = n_of(0.4), n_of(0.1)
    if n < blk:  # short cue: one block over the whole thing
        ms = np.mean(y ** 2, axis=1).sum()
        return -0.691 + 10 * np.log10(ms + 1e-12)
    zs = np.array([np.mean(y[:, i:i + blk] ** 2, axis=1).sum() for i in range(0, n - blk + 1, hop)])
    ls = -0.691 + 10 * np.log10(zs + 1e-12)
    zs = zs[ls > -70]
    if len(zs) == 0:
        return -70.0
    rel = -0.691 + 10 * np.log10(zs.mean()) - 10
    ls = -0.691 + 10 * np.log10(zs + 1e-12)
    zs = zs[ls > rel]
    return float(-0.691 + 10 * np.log10(zs.mean() + 1e-12))


def true_peak(x: np.ndarray) -> float:
    from scipy.signal import resample_poly
    x = st(x)
    up = resample_poly(x, 4, 1, axis=1)
    return float(20 * np.log10(np.max(np.abs(up)) + 1e-12))


def limit(x: np.ndarray, ceiling_db=-1.0) -> np.ndarray:
    """Soft-knee peak control: gentle tanh above -6 dB, then hard trim to the ceiling."""
    x = st(x)
    c = 10 ** (ceiling_db / 20)
    knee = c * 0.5
    a = np.abs(x)
    over = a > knee
    y = x.copy()
    y[over] = np.sign(x[over]) * (knee + (c - knee) * np.tanh((a[over] - knee) / (c - knee)))
    tp = 10 ** (true_peak(y) / 20)
    if tp > c:
        y *= c / tp
    return y


def master(x: np.ndarray, target_lufs: float, ceiling_db=-1.0) -> np.ndarray:
    x = st(x)
    g = 10 ** ((target_lufs - lufs(x)) / 20)
    y = limit(x * g, ceiling_db)
    # one more pass: limiting lowers loudness a little
    g2 = 10 ** ((target_lufs - lufs(y)) / 20)
    if g2 > 1.0:
        y = limit(y * min(g2, 1.6), ceiling_db)
    return y


# ── output ─────────────────────────────────────────────────────────────────

REPORT_ROWS: dict = {}


def write_wav(path: Path, x: np.ndarray):
    x = st(x)
    pcm = (np.clip(x.T, -1, 1) * 32767).astype('<i2')
    with wave.open(str(path), 'wb') as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())


def save_sfx(name: str, x: np.ndarray, target: float, ceiling=-1.0, tail_fade=0.02):
    x = fade(st(x), 0.0015, tail_fade)
    # trim trailing near-silence
    a = np.max(np.abs(x), axis=0)
    idx = np.where(a > 10 ** (-66 / 20) * max(1e-9, a.max()))[0]
    if len(idx):
        x = x[:, :min(x.shape[1], idx[-1] + n_of(0.03))]
    x = fade(master(x, target, ceiling), 0.0, 0.01)
    p = OUT / f'{name}.wav'
    write_wav(p, x)
    REPORT_ROWS[p.name] = {'lufs': round(lufs(x), 1), 'true_peak_db': round(true_peak(x), 2),
                           'seconds': round(x.shape[1] / SR, 3)}
    print(f'  {name:18s} {x.shape[1] / SR:5.2f}s  {lufs(x):6.1f} LUFS  tp {true_peak(x):5.1f}')


def mix(*parts, dur=None):
    """Sum mono/stereo parts given as (signal, start_seconds[, pan])."""
    parts = [p if len(p) == 3 else (p[0], p[1], 0.0) for p in parts]
    end = max(n_of(s) + (sig.shape[-1]) for sig, s, _ in parts)
    n = n_of(dur) if dur else end
    out = np.zeros((2, max(n, end)))
    for sig, s, p in parts:
        sig = pan(sig, p) if sig.ndim == 1 else sig
        i = n_of(s)
        out[:, i:i + sig.shape[1]] += sig
    return out[:, :n] if dur else out


# ═══════════════════════════════════════════════════════════════════════════
#  OBJECTS — the hardware of the diner / fermentation station
# ═══════════════════════════════════════════════════════════════════════════

# Service bell (struck brass dome). Partial ratios of a small hemispherical
# bell are strongly inharmonic; the hum sits below the strike tone.
BELL_R = np.array([0.51, 1.0, 1.51, 2.32, 2.97, 4.25, 5.43, 6.63])
BELL_A = np.array([0.18, 1.0, 0.35, 0.55, 0.22, 0.30, 0.12, 0.10])
BELL_D = np.array([2.2, 1.6, 0.9, 0.75, 0.5, 0.38, 0.25, 0.18])


def service_bell(f0=2093.0, dur=2.6, damp=1.0, hit=1.0):
    y = modal(f0 * BELL_R, BELL_A, BELL_D * damp, dur, detune=0.002)
    # a slow beat between the two strongest modes (a real dome is never round)
    t = tt(dur)
    y *= 1 + 0.12 * np.sin(2 * np.pi * 3.1 * t)
    s = strike(0.003, 2500, 12000) * 0.6 * hit
    y[:len(s)] += s
    return y


def glass_jar(f0=1180.0, dur=0.6, wet=1.0):
    """A heavy glass jar knocked: few clear partials + hollow cavity tok."""
    t = tt(dur)
    partials = modal(f0 * np.array([1, 2.62, 4.13, 5.81]), [1, 0.55, 0.35, 0.2], [0.35, 0.18, 0.1, 0.07], dur, detune=0.003)
    cavity = reson(noise(dur) * np.exp(-t / 0.02), f0 * 0.23, 6) * 2.5
    return partials * 0.5 + cavity


def liquid_slosh(dur=0.5, rate=7.0):
    t = tt(dur)
    x = lp(noise(dur), 900) * (0.5 + 0.5 * np.sin(2 * np.pi * rate * t) ** 2) * np.exp(-t / (dur * 0.35))
    # bubbles: tiny rising sine plips
    for k in range(5):
        st_ = RNG.uniform(0.02, dur * 0.6)
        f = RNG.uniform(500, 1100)
        bl = n_of(0.03)
        tb = np.arange(bl) / SR
        plip = np.sin(2 * np.pi * np.cumsum(f * (1 + 2.5 * tb / tb[-1])) / SR) * np.exp(-tb / 0.01)
        i = n_of(st_)
        x[i:i + bl] += 0.5 * plip[:len(x[i:i + bl])]
    return tailfade(x, 0.3)


def steel_plate(f0=180.0, dur=1.4, damp=1.0):
    """Thick steel door / tray: dense inharmonic modes."""
    r = np.array([1, 2.28, 3.85, 5.17, 6.43, 8.11, 9.6, 12.3, 14.9, 17.7])
    a = np.array([1, 0.8, 0.7, 0.55, 0.5, 0.4, 0.3, 0.25, 0.2, 0.15])
    d = np.array([1.0, 0.8, 0.6, 0.5, 0.42, 0.35, 0.3, 0.22, 0.18, 0.14]) * damp
    return modal(f0 * r, a, d, dur, detune=0.01)


def thump(dur=0.35, f=55, tau=0.12):
    t = tt(dur)
    fr = f * (1 + 1.4 * np.exp(-t / 0.02))
    return np.sin(2 * np.pi * np.cumsum(fr) / SR) * np.exp(-t / tau)


def whoosh(dur=0.5, f0=400, f1=3000, q=1.6, shape='updown'):
    t = tt(dur)
    x = noise(dur)
    if shape == 'updown':
        e = np.sin(np.pi * np.clip(t / dur, 0, 1)) ** 1.6
        y = sweep_bp(x, f0, f1, q)
    else:
        e = (t / dur) ** 1.5 * np.exp(-((t / dur - 0.85) ** 2) / 0.02)
        y = sweep_bp(x, f0, f1, q)
    return y * e


def hiss(dur=0.8, a=0.05, tail=0.4, lo=2500):
    t = tt(dur)
    e = np.clip(t / a, 0, 1) * np.exp(-np.maximum(0, t - a) / tail)
    return tailfade(hp(noise(dur), lo, 3) * e, 0.3)


def click(dur=0.012, f=3000, q=8):
    t = tt(dur)
    return reson(noise(dur) * np.exp(-t / 0.0015), f, q)


def ratchet(n=6, span=0.35, f=2600):
    out = np.zeros(n_of(span + 0.05))
    for k in range(n):
        # accelerating clicks, like a ticket wheel spun by hand
        tpos = span * (1 - (1 - k / n) ** 1.6)
        c = click(0.02, f * RNG.uniform(0.9, 1.1), 10) * (0.6 + 0.4 * RNG.random())
        i = n_of(tpos)
        out[i:i + len(c)] += c[:len(out[i:i + len(c)])]
    return out


# ═══════════════════════════════════════════════════════════════════════════
#  VOICES — two pickles, formant-synthesised
# ═══════════════════════════════════════════════════════════════════════════

def syllable(f0_start, f0_end, dur, vowel='a', scale=1.0, breath=0.25, h_dur=0.05, grit=0.0):
    n = n_of(dur)
    t = np.arange(n) / SR
    f0 = f0_start * (f0_end / f0_start) ** (t / dur)
    src = glottal(f0, open_q=0.55, jitter=0.02 + grit * 0.03, shimmer=0.1 + grit * 0.2)
    voiced = formant(src, vowel, scale)
    asp = formant(hp(noise(dur), 400) * 0.6, vowel, scale)
    # h onset: aspiration before voicing; voicing swells in after it
    hv = np.clip((t - h_dur * 0.6) / (h_dur * 0.6), 0, 1)
    e = np.clip(t / 0.01, 0, 1) * np.exp(-np.maximum(0, t - dur * 0.55) / (dur * 0.18))
    y = (voiced * hv + asp * (breath + (1 - hv) * 1.4)) * e
    if grit:
        y = sat(y * (1 + grit * 3), 1 + grit * 2)
    return y


def laugh(f0=110, scale=1.0, n=4, gap=0.17, grit=0.4, vowel='a'):
    parts = []
    for k in range(n):
        fs = f0 * (1.25 - 0.08 * k)
        fe = fs * 0.82
        d = 0.15 + (0.08 if k == n - 1 else 0)
        parts.append((syllable(fs, fe, d, vowel, scale, grit=grit), k * gap))
    y = mix(*[(p, s, 0.0) for p, s in parts])
    return tailfade(y[0] * np.sqrt(2), 0.15)


def hup(f0=120, scale=1.0, grit=0.5):
    s = syllable(f0 * 1.1, f0 * 1.35, 0.17, 'uh', scale, breath=0.35, h_dur=0.07, grit=grit)
    # the "p": lips close, a small burst
    p = bp(noise(0.02), 300, 3000) * np.exp(-tt(0.02) / 0.004) * 0.5
    y = np.zeros(len(s) + n_of(0.05))
    y[:len(s)] += s
    i = n_of(0.17)
    y[i:i + len(p)] += p
    return y


# ═══════════════════════════════════════════════════════════════════════════
#  SFX
# ═══════════════════════════════════════════════════════════════════════════

def sfx_all(only=None):
    want = (lambda n: True) if not only else (lambda n: n in only)

    # UI ────────────────────────────────────────────────────────────────────
    if want('btn'):
        # chrome toggle on a diner jukebox: two tiny clicks a few ms apart + tick
        x = mix((click(0.015, 3200, 9), 0), (click(0.015, 2100, 7) * 0.6, 0.011), (modal([4100, 6900], [0.3, 0.15], [0.02, 0.012], 0.05), 0.002))
        save_sfx('btn', reverb(x, 'room', 0.12, 0.4), -26)

    if want('spin'):
        # order wheel spun: ratchet that runs up into a whoosh, a bell-click at the end
        rat = ratchet(7, 0.32, 2400)
        w = whoosh(0.42, 500, 3600, 2.2)
        tick = modal([2700, 5600], [0.4, 0.2], [0.05, 0.02], 0.1)
        x = mix((rat, 0, -0.15), (w * 0.7, 0.04, 0.15), (tick, 0.33))
        save_sfx('spin', reverb(x, 'room', 0.15, 0.6), -22)

    # REELS ─────────────────────────────────────────────────────────────────
    for k, name in enumerate(['reel_stop', 'reel_stop_b', 'reel_stop_c']):
        if not want(name):
            continue
        # a steel tray set down on the counter: dull thud + short tray ring
        f0 = [212, 236, 197][k]
        thud = thump(0.14, [62, 70, 58][k], 0.05)
        tray = steel_plate(f0 * 3.1, 0.5, damp=0.12) * 0.25
        body = lp(noise(0.06) * np.exp(-tt(0.06) / 0.008), 900) * 0.7
        x = mix((thud, 0), (body, 0), (hp(tray, 400), 0.002, [-0.2, 0.15, 0][k]))
        save_sfx(name, reverb(x, 'room', 0.1, 0.35), -21)

    for k in range(1, 6):
        name = f'scatter_{k}'
        if not want(name):
            continue
        # the service bell: each one that lands rings higher and fuller
        f0 = 1760 * 2 ** ([0, 2, 4, 7, 12][k - 1] / 12)
        parts = [(service_bell(f0, 2.6), 0, 0)]
        if k >= 3:
            parts.append((service_bell(f0 * 2 ** (7 / 12), 2.2) * 0.6, 0.09, 0.3))
        if k >= 4:
            parts.append((thump(0.3, 80, 0.1) * 0.6, 0, 0))
            parts.append((service_bell(f0 * 2, 2.0) * 0.35, 0.18, -0.3))
        if k == 5:
            f = np.geomspace(500, 2400, n_of(0.6))
            parts.append((glide(f, 0.02, 7.0) * np.hanning(len(f)) * 0.25, 0.05, 0.2))
        save_sfx(name, reverb(mix(*parts), 'room', 0.22, 1.2), -20 + k * 0.6)

    # PICKLE JAR / COOK ───────────────────────────────────────────────────
    if want('sack_land'):
        # a jar set down hard: hollow tok, glass ring, brine sloshing inside
        x = mix((glass_jar(1240, 0.9), 0), (thump(0.12, 95, 0.04) * 0.6, 0), (liquid_slosh(0.45) * 0.35, 0.02, 0.2))
        save_sfx('sack_land', reverb(x, 'room', 0.14, 0.5), -21)

    if want('bandit_land'):
        # the little Cook lands: spring BOING + chef's knife thunk + a sizzle
        t = tt(0.6)
        f = 180 * (1 + 0.5 * np.exp(-t / 0.08)) * (1 + 0.07 * np.sin(2 * np.pi * 14 * t) * np.exp(-t / 0.25))
        boing = glide(f, 0, 1, ((1, 1), (2, 0.35), (3, 0.15))) * np.exp(-t / 0.22)
        knife = mix((thump(0.1, 120, 0.03), 0), (click(0.02, 1800, 5), 0))[0] * np.sqrt(2)
        sizzle = tailfade(bp(noise(0.7), 3000, 9000) * np.exp(-tt(0.7) / 0.18) * (0.6 + 0.4 * np.abs(np.sin(2 * np.pi * 31 * tt(0.7)))), 0.5)
        x = mix((boing, 0.01, -0.1), (knife, 0), (sizzle * 0.25, 0.04, 0.25))
        save_sfx('bandit_land', reverb(x, 'spring', 0.18, 1.2), -19)

    if want('collect_grab'):
        # lid unscrewed under pressure: suction THOONK + fizz
        t = tt(0.16)
        pop = np.sin(2 * np.pi * np.cumsum(420 * (180 / 420) ** (t / t[-1])) / SR) * np.exp(-t / 0.05)
        x = mix((click(0.015, 2400, 6) * 0.6, 0), (pop, 0.004), (hiss(0.35, 0.01, 0.12, 5000) * 0.2, 0.01, 0.2))
        save_sfx('collect_grab', reverb(x, 'room', 0.12, 0.4), -21)

    if want('coin_in'):
        # a jar's value rung into the till: glass clink + a small bright ting
        x = mix((modal([2350, 3870, 6120], [1, 0.5, 0.3], [0.12, 0.07, 0.04], 0.3), 0, -0.1),
                (modal([4186, 8370], [0.5, 0.15], [0.18, 0.08], 0.3), 0.012, 0.1))
        save_sfx('coin_in', reverb(x, 'room', 0.12, 0.5), -23)

    if want('collect_stamp'):
        # rubber stamp on the order pad: padded thud + paper slap
        x = mix((thump(0.12, 90, 0.03), 0), (bp(noise(0.08), 800, 4500) * np.exp(-tt(0.08) / 0.015) * 0.7, 0.002))
        save_sfx('collect_stamp', reverb(x, 'room', 0.1, 0.4), -21)

    # METER ────────────────────────────────────────────────────────────────
    if want('tumbler_up'):
        # Cook meter rung up: theremin swoops up an octave, bubbles boil over,
        # a short brass stab lands it
        f = np.concatenate([np.geomspace(hz('A4'), hz('A5'), n_of(0.38)), np.full(n_of(0.5), hz('A5'))])
        th = glide(f, 0.016, 6.5) * env_adsr(len(f), 0.05, 0.1, 0.8, 0.3, 0.6)
        bub = liquid_slosh(0.6, 11) * 0.35
        stab = sum(brass(hz(nm_), 0.45, 0.18) for nm_ in ('A3', 'C#4', 'E4'))
        x = mix((th * 0.5, 0, 0.15), (bub, 0.05, -0.25), (stab * 0.7, 0.36))
        save_sfx('tumbler_up', reverb(x, 'room', 0.25, 1.2), -18)

    if want('dial_tick'):
        x = mix((click(0.02, 3300, 14), 0), (modal([1870], [0.2], [0.03], 0.06), 0))
        save_sfx('dial_tick', x, -28)

    if want('reel_tension'):
        # loopable: a held surf-guitar tremolo on low E over a boiling drone.
        # Every modulation completes a whole number of cycles in the loop, so
        # the seam is invisible.
        L = 3.2
        t = tt(L)
        drone = (np.sin(2 * np.pi * 41.2 * t) + 0.4 * np.sin(2 * np.pi * 82.4 * t)) * (0.6 + 0.4 * np.sin(2 * np.pi * (2 / L * 2) * t) ** 2)
        trem_rate = 40 / L * 1.0  # 12.5 Hz: 40 cycles per loop
        g = sum(pluck(hz(n_), L, 1.4, 6.0) for n_ in ('E2', 'B2', 'E3'))
        trem = g * (0.5 + 0.5 * np.sign(np.sin(2 * np.pi * trem_rate * t)) * 0.9)
        trem = lp(trem, 2600)
        boil = lp(noise(L), 600) * (0.5 + 0.5 * np.sin(2 * np.pi * (6 / L) * t))
        x = mix((drone * 0.5, 0), (trem * 0.35, 0, -0.2), (boil * 0.2, 0, 0.3))
        x = reverb_circular(x, 'spring', 0.2, 1.4)
        x = master(x, -20)
        p = OUT / 'reel_tension.wav'
        write_wav(p, x)
        REPORT_ROWS[p.name] = {'lufs': round(lufs(x), 1), 'true_peak_db': round(true_peak(x), 2), 'seconds': L, 'loop': True}
        print(f'  reel_tension       {L:5.2f}s  loop')

    # FEATURE / TRANSITION ────────────────────────────────────────────────
    if want('alarm_bell'):
        # fire bell in the fermentation hall: striker hammering at 17 Hz
        dur = 1.9
        out = np.zeros(n_of(dur))
        bell = service_bell(980, 1.4, 0.6, hit=1.4)
        for k in range(int(1.2 * 17)):
            i = n_of(k / 17)
            seg = bell * (0.75 + 0.25 * RNG.random())
            out[i:i + len(seg)] += seg[:len(out[i:i + len(seg)])]
        out *= np.clip(1.6 - tt(dur) / dur * 1.2, 0, 1)
        save_sfx('alarm_bell', reverb(out, 'room', 0.25, 1.4), -16)

    if want('alarm_trip'):
        # sci-fi klaxon: AWOO-GA through a horn formant
        t = tt(1.0)
        f = np.where(t < 0.55, 140 + 260 * (t / 0.55) ** 0.6, 400 - 180 * ((t - 0.55) / 0.45))
        saw = sum(np.sin(h * 2 * np.pi * np.cumsum(f) / SR) / h for h in range(1, 18))
        horn = reson(saw, 900, 3) + 0.6 * reson(saw, 2100, 4)
        horn *= env_adsr(len(t), 0.02, 0.1, 0.9, 0.12, 0.88)
        save_sfx('alarm_trip', reverb(sat(horn, 2.0), 'room', 0.2, 1.0), -18)

    if want('sack_throw'):
        # jar hurled: arm swish + the brine rattling inside as it spins
        x = mix((whoosh(0.5, 300, 2600, 2.0) * 0.9, 0, -0.3), (liquid_slosh(0.45, 16) * 0.25, 0.02, 0.2), (glass_jar(1300, 0.2) * 0.12, 0.0))
        save_sfx('sack_throw', reverb(x, 'room', 0.12, 0.5), -20)

    if want('shutter_down'):
        t = tt(0.8)
        whine = sum(np.sin(h * 2 * np.pi * np.cumsum(310 - 120 * t / 0.8) / SR) / h for h in range(1, 8)) * 0.15
        rumble = lp(noise(0.8), 220) * 1.2
        x = mix((rumble * np.sin(np.pi * t / 0.8), 0), (whine * np.sin(np.pi * t / 0.8), 0, 0.2), (thump(0.3, 50, 0.1), 0.72))
        save_sfx('shutter_down', reverb(x, 'room', 0.2, 1.0), -18)

    if want('door_slide'):
        # blast doors running on their rails (0.48 s to the clack)
        d = 0.5
        t = tt(d)
        rumble = lp(noise(d), 260) * (t / d) ** 0.5
        grind = bp(noise(d), 900, 3000) * (0.5 + 0.5 * np.abs(np.sin(2 * np.pi * 23 * t))) * 0.35
        servo = sum(np.sin(h * 2 * np.pi * np.cumsum(220 + 160 * t / d) / SR) / h for h in range(1, 6)) * 0.12
        rumble_r = lp(noise(d), 240) * (t / d) ** 0.5
        x = mix((rumble, 0, -0.5), (rumble_r * 0.9, 0, 0.5), (grind, 0, 0), (servo, 0))
        save_sfx('door_slide', reverb(x, 'room', 0.15, 0.8), -19)

    if want('door_clack'):
        # SLAM: sub thump, a big steel clang, debris rattling down
        clang = steel_plate(96, 1.6, 1.0)
        sub = thump(0.6, 42, 0.22)
        debris = np.zeros(n_of(0.8))
        for k in range(14):
            c = click(0.02, RNG.uniform(1500, 5000), 6) * RNG.uniform(0.1, 0.3)
            i = n_of(0.05 + RNG.exponential(0.12))
            debris[i:i + len(c)] += c[:len(debris[i:i + len(c)])]
        x = mix((sub * 1.2, 0), (clang * 0.55, 0.003), (debris, 0.04, 0.3), (strike(0.006, 400, 6000) * 1.5, 0))
        save_sfx('door_clack', reverb(sat(x, 1.3), 'room', 0.3, 1.8), -14)

    if want('door_open'):
        # latch clunk, then the seal lets go with a long hiss as the doors part
        x = mix((thump(0.12, 85, 0.04) * 0.8, 0), (click(0.03, 1200, 4) * 0.6, 0.0),
                (hiss(0.85, 0.06, 0.35, 2200) * 0.6, 0.05, -0.2), (hiss(0.85, 0.06, 0.35, 3200) * 0.5, 0.07, 0.25),
                (lp(noise(0.6), 240) * np.sin(np.pi * tt(0.6) / 0.6) * 0.7, 0.12))
        save_sfx('door_open', reverb(x, 'room', 0.18, 1.0), -19)

    if want('shutter_slam'):
        # the stamp that slams down the FS count / the Cook's fist on the counter
        x = mix((thump(0.35, 60, 0.09) * 1.2, 0), (snare(0.25, 210, 1.2) * 0.5, 0.002),
                (steel_plate(260, 0.4, 0.3) * 0.2, 0.003, 0.2))
        save_sfx('shutter_slam', reverb(x, 'room', 0.22, 1.0), -16)

    if want('safe_open'):
        # Buy Bonus: two hatch latches, pressure hiss, power-up chirp, a ding
        f = np.geomspace(300, 1800, n_of(0.35))
        chirp = glide(f, 0.0, 5, ((1, 1), (2, 0.3), (3, 0.2))) * np.hanning(len(f)) * 0.35
        x = mix((thump(0.1, 90, 0.03), 0), (click(0.02, 1500, 5), 0), (thump(0.1, 100, 0.03), 0.09), (click(0.02, 1700, 5), 0.09),
                (hiss(0.5, 0.02, 0.18, 3000) * 0.4, 0.1, 0.2), (chirp, 0.15, -0.15), (service_bell(2637, 2.0) * 0.45, 0.46))
        save_sfx('safe_open', reverb(x, 'room', 0.2, 1.0), -17)

    # WINS: one-shots ───────────────────────────────────────────────────────
    if want('cash_register'):
        # KA-CHING: drawer bell, the drawer slamming out, coins jumping in the tray
        coins = np.zeros(n_of(0.6))
        for k in range(9):
            c = modal([RNG.uniform(3000, 6500)], [1], [0.05], 0.08) * RNG.uniform(0.15, 0.4)
            i = n_of(0.12 + RNG.exponential(0.08))
            coins[i:i + len(c)] += c[:len(coins[i:i + len(c)])]
        x = mix((thump(0.14, 110, 0.04) * 0.7, 0), (click(0.03, 900, 3) * 0.6, 0),
                (service_bell(2794, 2.2) * 0.7, 0.05), (coins, 0, 0.25))
        save_sfx('cash_register', reverb(x, 'room', 0.18, 1.0), -17)

    if want('bill_counter'):
        # the count-up's opening: till keys clacking faster and faster, one ting
        out = np.zeros(n_of(2.4))
        tpos = 0.0
        k = 0
        while tpos < 2.0:
            c = click(0.02, 2000 + 300 * (k % 3), 6) * (0.5 + 0.2 * (k % 2))
            i = n_of(tpos)
            out[i:i + len(c)] += c[:len(out[i:i + len(c)])]
            tpos += 0.11 * (1 - tpos / 2.4) + 0.03
            k += 1
        out *= np.clip(1.4 - tt(2.4) / 2.4, 0, 1)
        x = mix((out, 0, -0.1), (service_bell(3136, 1.8) * 0.4, 2.0, 0.15))
        save_sfx('bill_counter', reverb(x, 'room', 0.12, 0.8), -22)

    if want('bigwin_slam'):
        # the big-win door kick: sub drop + steel crash + cymbal, long hall tail
        t = tt(1.6)
        drop = np.sin(2 * np.pi * np.cumsum(70 * (28 / 70) ** (t / 1.6)) / SR) * np.exp(-t / 0.6)
        x = mix((drop * 1.3, 0), (steel_plate(130, 1.4, 0.8) * 0.4, 0.0, -0.2), (crash(2.2) * 0.6, 0.0, 0.25),
                (kick(0.5, 160, 40) * 0.9, 0), (snare(0.3, 180, 1.5) * 0.5, 0))
        save_sfx('bigwin_slam', reverb(sat(x, 1.3), 'room', 0.35, 2.2), -14)

    # VOICES ────────────────────────────────────────────────────────────────
    if want('voice_laugh'):
        # the Boss: big, low, gravelly HAW-HAW-HAW
        v = laugh(f0=98, scale=0.92, n=4, gap=0.19, grit=0.55, vowel='a')
        save_sfx('voice_laugh', reverb(v, 'room', 0.12, 0.6), -18)
    if want('voice_hup'):
        v = hup(f0=108, scale=0.92, grit=0.6)
        save_sfx('voice_hup', reverb(v, 'room', 0.1, 0.5), -19)
    if want('voice_laugh_fg'):
        # the Spicy Chef: quick, high cackle, ee-vowel bite
        v = laugh(f0=255, scale=1.18, n=5, gap=0.125, grit=0.35, vowel='e')
        save_sfx('voice_laugh_fg', reverb(v, 'room', 0.12, 0.6), -18)
    if want('voice_hup_fg'):
        v = hup(f0=270, scale=1.18, grit=0.3)
        save_sfx('voice_hup_fg', reverb(v, 'room', 0.1, 0.5), -19)


if __name__ == '__main__':
    only = None
    if '--only' in sys.argv:
        only = set(sys.argv[sys.argv.index('--only') + 1].split(','))
    if REPORT.exists():
        REPORT_ROWS.update(json.loads(REPORT.read_text()).get('files', {}))
    print('SFX')
    sfx_all(only)
    if '--no-music' not in sys.argv:
        from generate_pickle_music import music_all  # noqa: E402
        music_all(only, save_sfx=save_sfx, master=master, lufs=lufs, true_peak=true_peak,
                  write_wav=write_wav, report=REPORT_ROWS)
    # sha256 + uniqueness
    shas = {}
    for p in sorted(OUT.iterdir()):
        if p.suffix in ('.wav', '.m4a'):
            h = hashlib.sha256(p.read_bytes()).hexdigest()
            shas.setdefault(h, []).append(p.name)
            REPORT_ROWS.setdefault(p.name, {})['sha256'] = h
    dupes = [v for v in shas.values() if len(v) > 1]
    REPORT.write_text(json.dumps({'files': REPORT_ROWS, 'duplicates': dupes}, indent=1, ensure_ascii=False))
    print('duplicates:', dupes or 'none')

    # Full regeneration always finishes with licensed recorded human takes.
    if only is None or any(n.startswith('voice_') for n in only):
        import subprocess
        subprocess.run([sys.executable, str(APP / 'design/ingest_human_voices.py')], check=True)
    if only is None:
        import subprocess
        subprocess.run([sys.executable, str(APP / 'design/generate_v2_audio_extras.py')], check=True)
