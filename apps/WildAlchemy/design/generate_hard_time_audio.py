#!/usr/bin/env python3
"""Generate the royalty-free Hard Time music and event SFX as reproducible WAVs."""

from pathlib import Path
import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, sosfilt

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "static/assets/audio/hard_time"
SFX = OUT / "sfx"
SR = 44100
RNG = np.random.default_rng(14092026)


def env(n, attack=.01, release=.12):
    e = np.ones(n)
    a = min(n // 3, int(SR * attack))
    r = min(n // 2, int(SR * release))
    if a: e[:a] = np.linspace(0, 1, a)
    if r: e[-r:] = np.linspace(1, 0, r)
    return e


def tone(freq, seconds, amp=.4, phase=0):
    t = np.arange(int(SR * seconds)) / SR
    return amp * np.sin(2 * np.pi * freq * t + phase)


def sweep(f0, f1, seconds, amp=.4):
    n = int(SR * seconds)
    t = np.arange(n) / SR
    k = (f1 - f0) / seconds
    return amp * np.sin(2 * np.pi * (f0 * t + .5 * k * t * t))


def noise(seconds, amp=.2, cutoff=None):
    x = RNG.normal(0, amp, int(SR * seconds))
    if cutoff:
        x = sosfilt(butter(3, cutoff, fs=SR, output="sos"), x)
    return x


def delay(x, seconds, gain):
    d = int(SR * seconds)
    y = np.zeros(len(x) + d)
    y[:len(x)] += x
    y[d:] += x * gain
    return y


def stereo(x, width=.12):
    d = max(1, int(SR * .004))
    right = np.roll(x, d) * (1 - width) + x * width
    right[:d] = x[:d]
    return np.column_stack((x, right))


def write(path, x, peak=.86):
    path.parent.mkdir(parents=True, exist_ok=True)
    x = np.nan_to_num(x)
    if x.ndim == 1: x = stereo(x)
    x -= np.mean(x, axis=0)
    m = np.max(np.abs(x))
    if m: x *= peak / m
    wavfile.write(path, SR, np.int16(np.clip(x, -1, 1) * 32767))
    print(f"{path.relative_to(ROOT)} {len(x)/SR:.2f}s")


def impact(freq=95, seconds=.42, metal=760):
    n = int(SR * seconds)
    t = np.arange(n) / SR
    body = np.sin(2*np.pi*freq*t) * np.exp(-t*11)
    ring = np.sin(2*np.pi*metal*t) * np.exp(-t*7)
    tick = noise(seconds, .15, 4200) * np.exp(-t*28)
    return (body*.6 + ring*.35 + tick) * env(n, .001, .08)


def motif(root, seconds=1.8, layers=1):
    n = int(SR * seconds)
    x = np.zeros(n)
    notes = [root, root*1.1892, root*1.4983]
    for i, f in enumerate(notes):
        start = int(i * .28 * SR)
        length = min(n-start, int(.9*SR))
        tt = np.arange(length)/SR
        sig = np.sin(2*np.pi*f*tt) * np.exp(-tt*2.7)
        for h in range(2, layers+2): sig += np.sin(2*np.pi*f*h*tt) * (.14/h) * np.exp(-tt*(2+h*.4))
        x[start:start+length] += sig
    return delay(x, .12, .22)[:n] * env(n, .005, .3)


def midi(note):
    return 440.0 * 2 ** ((note - 69) / 12)


def bright_note(note, seconds=.55, amp=.28):
    """Short marimba/celesta hybrid with a clear, cheerful attack."""
    n = int(SR * seconds)
    t = np.arange(n) / SR
    f = midi(note)
    attack = np.minimum(1, t / .006)
    decay = np.exp(-t * 5.4)
    body = np.sin(2*np.pi*f*t)
    body += .34*np.sin(2*np.pi*f*2*t + .1)
    body += .16*np.sin(2*np.pi*f*3*t + .25)
    body += .07*np.sin(2*np.pi*f*4*t)
    click = noise(seconds, .07, 6000) * np.exp(-t * 42)
    return amp * (body * attack * decay + click)


def light_drum(seconds=.16, amp=.12):
    n = int(SR * seconds)
    t = np.arange(n) / SR
    snap = sosfilt(butter(2, 1700, btype="highpass", fs=SR, output="sos"), noise(seconds, 1))
    return amp * snap * np.exp(-t * 28) * env(n, .001, .03)


def celebration(stage, seconds):
    """One shared major-key phrase, expanded by award stage 1..9."""
    phrases = [
        [60, 64, 67],
        [60, 64, 67, 72],
        [60, 62, 64, 67, 72],
        [60, 64, 67, 71, 72, 76],
        [60, 64, 67, 72, 76],
        [60, 64, 67, 72, 76, 79, 76],
        [60, 64, 67, 71, 72, 76, 79, 84],
        [60, 64, 67, 72, 74, 76, 79, 84, 88, 84],
        [60, 64, 67, 72, 76, 79, 84, 88, 91, 96, 91, 96],
    ]
    # Keep the whole ladder in the bright C5-C7 register. The first draft used
    # C4 and measured like another low, weighty impact instead of a light reward.
    notes = [min(note + 12, 96) for note in phrases[stage - 1]]
    n = int(SR * seconds)
    x = np.zeros(n)
    spacing = min(.34, (seconds - .48) / max(1, len(notes) - 1))
    for i, note in enumerate(notes):
        start = int((.035 + i * spacing) * SR)
        sig = bright_note(note, min(.72, seconds - start / SR), .24 + stage * .008)
        end = min(n, start + len(sig))
        x[start:end] += sig[:end-start]
        if stage >= 5 and i % 2 == 0:
            drum = light_drum(.13, .055 + stage * .006)
            dend = min(n, start + len(drum))
            x[start:dend] += drum[:dend-start]
    # Higher awards add a soft upper-octave answer and a final major chord.
    if stage >= 6:
        for note in (72, 76, 79):
            start = int(max(.2, seconds - .72) * SR)
            sig = bright_note(note + (12 if stage >= 8 else 0), .68, .10)
            x[start:min(n, start+len(sig))] += sig[:max(0, min(n-start, len(sig)))]
    x = delay(x, .095, .16)[:n]
    return x * env(n, .003, .22)


def soft_key(note, seconds=.9, amp=.12):
    """Muted electric-piano note: musical, warm, and intentionally unobtrusive."""
    n = int(SR * seconds)
    t = np.arange(n) / SR
    f = midi(note)
    attack = np.minimum(1, t / .018)
    release = np.exp(-t * 2.8)
    x = np.sin(2*np.pi*f*t)
    x += .22*np.sin(2*np.pi*f*2*t + .15)
    x += .07*np.sin(2*np.pi*f*3*t + .4)
    return amp * x * attack * release


def soft_bass(note, seconds=1.1, amp=.10):
    n = int(SR * seconds)
    t = np.arange(n) / SR
    f = midi(note)
    x = np.sin(2*np.pi*f*t) + .16*np.sin(2*np.pi*f*2*t)
    return amp * x * env(n, .025, .34) * np.exp(-t * .72)


def add_at(track, sound, at):
    """Mix a one-shot into a fixed-size loop without changing its duration."""
    start = int(at * SR)
    if start >= len(track): return
    end = min(len(track), start + len(sound))
    track[start:end] += sound[:end-start]


def prison_music(feature=False):
    """Quiet minor-key heist groove; replaces the old HVAC-like noise bed."""
    bpm = 96 if feature else 90
    beat = 60 / bpm
    bars = 12
    seconds = bars * 4 * beat
    n = int(SR * seconds)
    x = np.zeros(n)

    # D-minor progression: Dm9 | Bbmaj7 | Gm9 | A7, repeated three times.
    chords = [
        ([50, 53, 57, 60, 64], 38),
        ([46, 50, 53, 57], 34),
        ([43, 46, 50, 53, 57], 31),
        ([45, 49, 52, 55], 33),
    ]
    base_melody = [69, 72, 74, 72, 69, 67, 65, 67, 69, 72, 69, 64]
    feature_melody = [69, 72, 74, 77, 76, 74, 72, 69, 67, 69, 72, 76]
    melody = feature_melody if feature else base_melody

    for bar in range(bars):
        chord, bass = chords[bar % len(chords)]
        bar_at = bar * 4 * beat
        # Sparse off-beat keys create motion without competing with game SFX.
        for step, note in enumerate(chord[1:]):
            add_at(x, soft_key(note + 12, beat * 1.35, .040 if feature else .034),
                   bar_at + (.5 + step) * beat)
        add_at(x, soft_bass(bass, beat * 1.65, .075 if feature else .062), bar_at)
        add_at(x, soft_bass(bass + (7 if bar % 4 == 3 else 12), beat * .8, .042),
               bar_at + 2 * beat)
        # One short motif per bar; leave the first beat open for reel events.
        add_at(x, soft_key(melody[bar], beat * 1.15, .048 if feature else .040),
               bar_at + 1.5 * beat)
        if feature:
            add_at(x, soft_key(melody[bar] + 7, beat * .72, .030), bar_at + 2.75 * beat)

        # Soft brushed pulse: high-passed and brief, unlike the old constant rumble.
        for pulse in range(4):
            at = bar_at + pulse * beat
            brush = sosfilt(
                butter(2, 2400, btype="highpass", fs=SR, output="sos"),
                noise(.075, .055 if feature else .042),
            )
            brush *= env(len(brush), .002, .055)
            add_at(x, brush, at)

    # Gentle stereo echo supplies atmosphere without a continuous noise floor.
    left = x + np.pad(x[:-int(.18*SR)] * .10, (int(.18*SR), 0))
    right = x + np.pad(x[:-int(.27*SR)] * .08, (int(.27*SR), 0))
    y = np.column_stack((left, right))
    # Very short edge fades prevent clicks while keeping the loop musically exact.
    fade = int(.012 * SR)
    y[:fade] *= np.linspace(0, 1, fade)[:, None]
    y[-fade:] *= np.linspace(1, 0, fade)[:, None]
    return y


def main():
    SFX.mkdir(parents=True, exist_ok=True)
    write(OUT/"bgm_base.wav", prison_music(False), .56)
    write(OUT/"bgm_feature.wav", prison_music(True), .60)

    simple = {
        "btn": impact(180, .08, 1300),
        "spin": sweep(180, 70, .34, .25)*env(int(SR*.34), .002, .14),
        "reel_stop": impact(105, .12, 980),
        "pluck_low": impact(78, .28, 620),
        "frame_big_land": impact(52, .65, 420),
        "mult_update": motif(190, .75, 1),
        "win_line_tick": impact(290, .12, 1700),
        "win_gliss": motif(170, 1.3, 1),
        "win_gliss_big": motif(145, 2.1, 2),
        "win_step_1": celebration(1, .62),
        "win_step_2": celebration(2, .82),
        "win_step_3": celebration(3, 1.02),
        "win_step_4": celebration(4, 1.24),
        "win_tier_big": celebration(5, 1.62),
        "win_tier_super": celebration(6, 2.30),
        "win_tier_mega": celebration(7, 3.05),
        "win_tier_epic": celebration(8, 4.35),
        "win_tier_max": celebration(9, 5.65),
        "fs_intro": motif(92, 2.5, 3),
        "fs_outro": motif(82, 2.2, 2)[::-1],
        "win_cap": celebration(9, 3.60),
        "bigwin_blast": celebration(5, .95),
        "gong_feature": delay(impact(48, 1.6, 240), .18, .35),
        "coin_shimmer": celebration(2, 1.60) * .42,
        "reel_tension": (tone(58, 3.0, .22)+sweep(110, 260, 3.0, .08))*env(int(SR*3), .2, .2),
        "wild_expand": sweep(210, 980, .85, .22)*env(int(SR*.85), .005, .18),
        "neon_zap": sweep(80, 38, 1.6, .35)*env(int(SR*1.6), .002, .35),
        "light_land": impact(120, .19, 1450),
        "light_double": impact(62, .48, 1120)+motif(260, .48, 2)*.45,
        "lights_carry": (tone(55, 1.4, .18)+tone(110, 1.4, .05))*env(int(SR*1.4), .18, .28),
        "tier_lockdown": motif(82, 1.8, 1),
        "tier_riot": motif(82, 2.1, 3),
        "tier_breakout": motif(82, 2.6, 5),
    }
    # Alarm is deliberately red-coded in visuals; audio uses a mechanical siren.
    t = np.arange(int(SR*2.2))/SR
    simple["alarm_transition"] = (.26*np.sin(2*np.pi*(520+110*np.sin(2*np.pi*1.45*t))*t) + sweep(90, 35, 2.2, .32))*env(len(t), .03, .3)
    for i in range(1, 6):
        simple[f"scatter_{i}"] = impact(120+i*35, .3+i*.05, 700+i*150)
    for cells, dur in enumerate((.34, .52, .70, .88), start=1):
        n = int(SR*dur)
        x = sweep(240, 1500+cells*180, dur, .22) + noise(dur, .09, 3200)
        simple[f"light_sweep_{cells}"] = x*env(n, .004, .14)
    for name, x in simple.items(): write(SFX/f"{name}.wav", x)


if __name__ == "__main__":
    main()
