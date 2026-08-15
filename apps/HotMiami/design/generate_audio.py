"""Synthesize the Hot Miami sound effect set.

    python generate_audio.py

Writes 16-bit stereo WAVs into ../static/assets/audio/miami/sfx/. Re-running is
idempotent - every file is rebuilt from scratch.

The game shipped with the sibling GoBananas app's jungle set (gongs, wooden
plucks, a monkey hoot). This replaces it with the palette the theme actually
belongs to: detuned saw stacks, FM bells, filtered-noise sweeps and the hard-cut
gated reverb that defines 80s production.

No filters are implemented as filters. A time-varying lowpass would need a
per-sample feedback loop, which is slow in Python; instead the saw stacks are
built additively and each harmonic's amplitude is scaled by a moving rolloff, so
a "filter sweep" falls out of the synthesis and stays fully vectorised.
"""

import math
import os
import wave

import numpy as np

SR = 44100
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.abspath(os.path.join(HERE, "..", "static", "assets", "audio", "miami", "sfx"))

rng = np.random.default_rng(20260805)  # fixed seed: rebuilds are byte-identical


# ---------------------------------------------------------------------------
# Primitives
# ---------------------------------------------------------------------------
def t_axis(seconds):
    return np.arange(int(SR * seconds)) / SR


def env_ad(n, attack, decay, curve=2.0):
    """Attack-decay envelope, `attack`/`decay` in seconds."""
    a = max(1, int(SR * attack))
    d = max(1, n - a)
    rise = np.linspace(0.0, 1.0, a) ** 0.6
    fall = np.linspace(1.0, 0.0, d) ** curve
    return np.concatenate([rise, fall])[:n]


def env_adsr(n, attack, decay, sustain, release):
    a, d, r = (max(1, int(SR * x)) for x in (attack, decay, release))
    s = max(1, n - a - d - r)
    return np.concatenate(
        [
            np.linspace(0, 1, a) ** 0.7,
            np.linspace(1, sustain, d),
            np.full(s, sustain),
            np.linspace(sustain, 0, r) ** 1.6,
        ]
    )[:n]


def saw_stack(freq_curve, t, voices=7, detune=0.16, harmonics=28, rolloff=None):
    """Additive supersaw.

    `freq_curve` may be a scalar or a per-sample array (pitch sweeps).
    `rolloff` is a per-sample cutoff in Hz; harmonics above it are faded out,
    which is what gives the sound its filter movement.
    """
    freq = np.asarray(freq_curve, dtype=float)
    if freq.ndim == 0:
        freq = np.full(t.shape, float(freq))
    out = np.zeros_like(t)
    for v in range(voices):
        # spread voices symmetrically around the centre pitch
        offset = (v - (voices - 1) / 2) / max(1, (voices - 1) / 2)
        f = freq * (1.0 + detune * offset / 100.0 * 12.0)
        phase = 2 * np.pi * np.cumsum(f) / SR
        for h in range(1, harmonics + 1):
            amp = 1.0 / h
            if rolloff is not None:
                amp = amp / (1.0 + (f * h / np.maximum(rolloff, 1.0)) ** 3)
            out += amp * np.sin(phase * h)
    return out / voices


def fm_bell(freq, t, ratio=2.41, index=6.0, decay=1.6):
    """FM bell - the shimmer layer."""
    mod_env = np.exp(-t * decay * 2.2)
    mod = np.sin(2 * np.pi * freq * ratio * t) * index * mod_env
    return np.sin(2 * np.pi * freq * t + mod) * np.exp(-t * decay)


def noise(n):
    return rng.uniform(-1.0, 1.0, n)


def band_noise(n, low, high, sweep_to=None):
    """Noise shaped in the frequency domain, optionally swept."""
    spec = np.fft.rfft(noise(n))
    freqs = np.fft.rfftfreq(n, 1 / SR)
    mask = ((freqs > low) & (freqs < high)).astype(float)
    shaped = np.fft.irfft(spec * mask, n)
    if sweep_to is not None:
        # crude sweep: crossfade into a second band so the noise appears to move
        spec2 = np.fft.rfft(noise(n))
        mask2 = ((freqs > sweep_to[0]) & (freqs < sweep_to[1])).astype(float)
        shaped2 = np.fft.irfft(spec2 * mask2, n)
        ramp = np.linspace(0, 1, n)
        shaped = shaped * (1 - ramp) + shaped2 * ramp
    return shaped


def fft_convolve(signal, impulse):
    n = len(signal) + len(impulse) - 1
    size = 1 << (n - 1).bit_length()
    out = np.fft.irfft(np.fft.rfft(signal, size) * np.fft.rfft(impulse, size), size)
    return out[: len(signal)]


def gated_reverb(x, room=0.34, gate=0.20, mix=0.5):
    """Big bright reverb cut off hard - the 80s drum sound.

    The gate is the point: a natural tail sounds like a concert hall, a tail
    chopped mid-decay sounds like 1984.
    """
    ir_len = int(SR * room)
    ir = noise(ir_len) * np.exp(-np.linspace(0, 6, ir_len))
    wet = fft_convolve(x, ir)
    hold = int(SR * gate)
    env = np.ones(len(wet))
    if hold < len(env):
        env[hold:] = 0.0
        fade = min(int(SR * 0.02), len(env) - hold)
        if fade > 0:
            env[hold : hold + fade] = np.linspace(1, 0, fade)
    wet = wet * env
    peak = np.max(np.abs(wet)) or 1.0
    return x * (1 - mix) + wet / peak * mix


def widen(mono, spread=0.012):
    """Haas-style stereo width; synthwave leans wide."""
    delay = int(SR * spread)
    left = np.concatenate([mono, np.zeros(delay)])
    right = np.concatenate([np.zeros(delay), mono])
    return np.stack([left, right], axis=1)


def save(name, audio, peak=0.89):
    if audio.ndim == 1:
        audio = widen(audio)
    audio = np.nan_to_num(audio)
    m = np.max(np.abs(audio)) or 1.0
    audio = audio / m * peak
    pcm = (audio * 32767).astype("<i2")
    path = os.path.join(OUT, f"{name}.wav")
    with wave.open(path, "wb") as f:
        f.setnchannels(2)
        f.setsampwidth(2)
        f.setframerate(SR)
        f.writeframes(pcm.tobytes())
    print(f"  {name}.wav  {len(audio) / SR:.2f}s")


# A minor pentatonic - the scale this genre lives in.
def note(semitone, base=220.0):
    return base * 2 ** (semitone / 12)


SCALE = [0, 3, 5, 7, 10, 12, 15, 17, 19, 22, 24]


# ---------------------------------------------------------------------------
# Sounds
# ---------------------------------------------------------------------------
def s_btn():
    t = t_axis(0.09)
    body = np.sin(2 * np.pi * 1180 * t) + 0.5 * np.sin(2 * np.pi * 2360 * t)
    return body * env_ad(len(t), 0.002, 0.085, curve=3.0) * 0.5


def s_spin():
    t = t_axis(0.55)
    sweep = np.linspace(180, 900, len(t))
    body = saw_stack(sweep, t, voices=5, rolloff=np.linspace(600, 5200, len(t)))
    air = band_noise(len(t), 900, 4000, sweep_to=(3000, 11000)) * 0.5
    return (body * 0.7 + air) * env_ad(len(t), 0.01, 0.54, curve=1.6)


def s_reel_stop():
    t = t_axis(0.13)
    thump = np.sin(2 * np.pi * np.linspace(220, 90, len(t)) * t) * env_ad(len(t), 0.001, 0.12, 3.5)
    tick = band_noise(len(t), 2200, 9000) * env_ad(len(t), 0.0005, 0.045, 5.0)
    return gated_reverb(thump * 0.9 + tick * 0.6, room=0.16, gate=0.07, mix=0.28)


def s_reel_tension():
    t = t_axis(2.6)
    rise = np.linspace(1.0, 2.6, len(t))
    body = saw_stack(note(0) * rise, t, voices=7, rolloff=np.linspace(400, 4200, len(t)))
    pulse = 0.5 + 0.5 * np.sin(2 * np.pi * np.linspace(5, 14, len(t)) * t)
    env = env_adsr(len(t), 0.25, 0.2, 0.85, 0.4)
    return body * (0.65 + 0.35 * pulse) * env * 0.8


def s_scatter(index):
    """Five rising hits - each landing scatter raises the stakes."""
    t = t_axis(0.75)
    f = note(SCALE[index + 2])
    bell = fm_bell(f, t, ratio=1.99, index=5.0 + index, decay=2.4)
    stab = saw_stack(f, t, voices=5, rolloff=np.linspace(1400 + index * 500, 700, len(t)))
    mix = bell * 0.75 + stab * 0.4 * env_ad(len(t), 0.004, 0.3, 2.5)
    return gated_reverb(mix * env_ad(len(t), 0.003, 0.72, 1.4), room=0.3, gate=0.22, mix=0.42)


def s_pluck_low():
    t = t_axis(0.5)
    f = note(-12)
    body = fm_bell(f, t, ratio=1.0, index=3.2, decay=4.5)
    sub = np.sin(2 * np.pi * f * t) * env_ad(len(t), 0.002, 0.45, 2.2)
    click = band_noise(len(t), 1500, 6000) * env_ad(len(t), 0.0005, 0.03, 6.0) * 0.4
    return (body * 0.8 + sub * 0.7 + click) * 0.9


def s_mult_update():
    t = t_axis(0.26)
    sweep = np.linspace(700, 1900, len(t))
    body = np.sin(2 * np.pi * np.cumsum(sweep) / SR)
    body += 0.4 * np.sin(2 * np.pi * np.cumsum(sweep * 1.5) / SR)
    return body * env_ad(len(t), 0.004, 0.25, 2.4) * 0.6


def _arp(degrees, step, dur, voices=6, bell_mix=0.5):
    total = int(SR * (step * (len(degrees) - 1) + dur))
    out = np.zeros(total)
    for i, deg in enumerate(degrees):
        t = t_axis(dur)
        f = note(deg)
        v = saw_stack(f, t, voices=voices, rolloff=np.linspace(3200, 1200, len(t)))
        v = v * env_ad(len(t), 0.005, dur * 0.95, 2.0)
        b = fm_bell(f * 2, t, ratio=2.01, index=4.0, decay=3.0) * bell_mix
        start = int(SR * step * i)
        seg = (v * 0.8 + b)[: total - start]
        out[start : start + len(seg)] += seg
    return out


def s_win_gliss():
    return gated_reverb(_arp([0, 3, 7, 10, 12], 0.085, 0.36), room=0.26, gate=0.2, mix=0.35) * 0.9


def s_win_gliss_big():
    body = _arp([0, 3, 7, 10, 12, 15, 19, 24], 0.09, 0.55, voices=7, bell_mix=0.7)
    return gated_reverb(body, room=0.4, gate=0.3, mix=0.45)


def s_coin_shimmer():
    t = t_axis(1.3)
    out = np.zeros(len(t))
    for _ in range(14):
        start = int(rng.uniform(0, 0.75) * SR)
        seg_t = t_axis(0.5)
        f = note(rng.choice(SCALE[4:]) + 24)
        seg = fm_bell(f, seg_t, ratio=3.02, index=4.5, decay=5.0)
        seg = seg[: len(t) - start]
        out[start : start + len(seg)] += seg * rng.uniform(0.5, 1.0)
    return gated_reverb(out, room=0.3, gate=0.5, mix=0.4) * 0.75


def s_fs_intro():
    t = t_axis(2.2)
    chord = np.zeros(len(t))
    for deg in (0, 7, 12, 15, 19):
        chord += saw_stack(note(deg), t, voices=7, rolloff=np.linspace(500, 5000, len(t)))
    chord *= env_adsr(len(t), 0.12, 0.4, 0.7, 0.9) / 5
    riser = band_noise(len(t), 400, 3000, sweep_to=(4000, 13000)) * np.linspace(0, 1, len(t)) ** 2
    return gated_reverb(chord + riser * 0.35, room=0.42, gate=0.6, mix=0.4)


def s_gong_feature():
    t = t_axis(2.4)
    stab = np.zeros(len(t))
    for deg in (-12, 0, 3, 7):
        stab += saw_stack(note(deg), t, voices=7, rolloff=np.linspace(4800, 500, len(t)))
    stab = stab / 4 * env_ad(len(t), 0.006, 2.3, 1.5)
    bell = sum(fm_bell(note(d) * 2, t, ratio=2.4, index=7.0, decay=1.2) for d in (0, 7, 12)) / 3
    return gated_reverb(stab * 0.9 + bell * 0.5, room=0.45, gate=0.42, mix=0.5)


def s_bigwin_blast():
    t = t_axis(3.0)
    sub = np.sin(2 * np.pi * np.cumsum(np.linspace(120, 38, len(t))) / SR)
    sub *= env_ad(len(t), 0.004, 1.1, 2.0)
    blast = band_noise(len(t), 200, 9000) * env_ad(len(t), 0.002, 0.7, 3.0)
    chord = np.zeros(len(t))
    for deg in (0, 7, 12, 16, 19, 24):
        chord += saw_stack(note(deg), t, voices=7, rolloff=np.linspace(900, 6500, len(t)))
    chord = chord / 6 * env_adsr(len(t), 0.05, 0.5, 0.65, 1.2)
    shimmer = sum(fm_bell(note(d) * 4, t, ratio=3.01, index=5.0, decay=1.0) for d in (12, 19, 24)) / 3
    mix = sub * 1.0 + blast * 0.5 + chord * 0.85 + shimmer * 0.35
    return gated_reverb(mix, room=0.5, gate=0.55, mix=0.42)


def s_wild_expand():
    t = t_axis(1.4)
    sweep = np.linspace(140, 1500, len(t))
    body = saw_stack(sweep, t, voices=7, rolloff=np.linspace(500, 7000, len(t)))
    air = band_noise(len(t), 600, 3000, sweep_to=(5000, 14000))
    env = np.linspace(0, 1, len(t)) ** 1.5
    zap_t = t_axis(0.25)
    zap = np.sin(2 * np.pi * np.cumsum(np.linspace(3000, 400, len(zap_t))) / SR)
    zap *= env_ad(len(zap_t), 0.001, 0.24, 3.0)
    out = body * 0.6 * env + air * 0.4 * env
    out[-len(zap) :] += zap * 0.9
    return gated_reverb(out, room=0.3, gate=0.3, mix=0.35)


def s_neon_zap():
    """Win-line runner. Replaces the inherited 'grenade blast'."""
    t = t_axis(0.32)
    sweep = np.cumsum(np.linspace(2600, 320, len(t))) / SR
    body = np.sin(2 * np.pi * sweep) + 0.5 * np.sin(2 * np.pi * sweep * 2.01)
    fizz = band_noise(len(t), 2000, 11000) * env_ad(len(t), 0.001, 0.12, 4.0)
    return gated_reverb(
        (body * env_ad(len(t), 0.001, 0.3, 2.6) + fizz * 0.35), room=0.2, gate=0.14, mix=0.3
    )


SOUNDS = {
    "btn": s_btn,
    "spin": s_spin,
    "reel_stop": s_reel_stop,
    "reel_tension": s_reel_tension,
    "pluck_low": s_pluck_low,
    "mult_update": s_mult_update,
    "win_gliss": s_win_gliss,
    "win_gliss_big": s_win_gliss_big,
    "coin_shimmer": s_coin_shimmer,
    "fs_intro": s_fs_intro,
    "gong_feature": s_gong_feature,
    "bigwin_blast": s_bigwin_blast,
    "wild_expand": s_wild_expand,
    "neon_zap": s_neon_zap,
}


def save_group(names, clips, ceiling=0.89, step=0.14):
    """Level a set of clips by loudness, with a deliberate rising ramp.

    The five scatter hits are one escalating gesture, so the only thing that may
    change across them is intensity. Peak normalisation does not deliver that:
    gated_reverb rescales its own wet signal, so the dry/wet balance drifts and
    scatter_1 landed about a quarter the loudness of scatter_2 - the run jumped
    around instead of climbing. Matching RMS and then applying a fixed +14% per
    step makes the climb the intended one, with a shared ceiling so nothing
    clips.
    """
    clips = [np.nan_to_num(c) for c in clips]
    rms = [float(np.sqrt((c**2).mean())) or 1e-9 for c in clips]
    target = max(rms)
    scaled = [c / r * target * (1 + step * i) for i, (c, r) in enumerate(zip(clips, rms))]
    headroom = max(float(np.max(np.abs(c))) for c in scaled) or 1.0
    for name, clip in zip(names, scaled):
        stereo = widen(clip / headroom * ceiling)
        pcm = (np.clip(stereo, -1, 1) * 32767).astype("<i2")
        with wave.open(os.path.join(OUT, f"{name}.wav"), "wb") as f:
            f.setnchannels(2)
            f.setsampwidth(2)
            f.setframerate(SR)
            f.writeframes(pcm.tobytes())
        print(f"  {name}.wav  {len(stereo) / SR:.2f}s")


def main():
    os.makedirs(OUT, exist_ok=True)
    print("miami sfx:")
    for name, fn in SOUNDS.items():
        save(name, fn())
    save_group([f"scatter_{i + 1}" for i in range(5)], [s_scatter(i) for i in range(5)])
    print("done")


if __name__ == "__main__":
    main()
