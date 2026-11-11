#!/usr/bin/env python3
"""Each game's own event and award SFX, synthesised and reproducible.

Until 2026-10-10 Capo Nostra and Turf War shipped Hard Time's award ladder,
reel stop, Scatter tones and tension bed byte-for-byte (a 2026-09-15 request),
and Turf War also carried Capo's button, spin and feature cues. A review that
lists a game's files sees the same sounds three times over, which is exactly the
"Reused assets" / "Bad sound design" pair Go Banandit was rejected with.

The SHAPE of Hard Time's ladder is kept, because that is what was chosen: nine
stages at the same lengths (0.62 s ... 5.65 s), each a longer phrase than the
last, in a bright register, light rather than heavy. What changes is everything
the ear identifies a game by: the instrument, the scale, the groove and the
percussion.

    capo   1930s crime jazz  vibraphone, muted trumpet, upright bass, brushes;
                             C 6/9 harmony, swung eighths
    turf   street boom-bap   filtered pulse pluck, G-funk whistle lead, 808,
                             claps, scratches; C minor pentatonic, straight 16ths

Usage:  python3 design/generate_game_sfx.py capo|turf [--out DIR]
Writes 16-bit stereo 44.1 kHz WAVs (the format the award-ladder gate asserts).
"""

from pathlib import Path
import argparse

import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, sosfilt

SR = 44100


# ── primitives ───────────────────────────────────────────────────────────────

def n_of(seconds):
    return int(round(SR * seconds))


def t_of(seconds):
    return np.arange(n_of(seconds)) / SR


def midi(note):
    return 440.0 * 2 ** ((note - 69) / 12)


def env(n, attack=.004, release=.08):
    e = np.ones(n)
    a = min(n // 3, int(SR * attack))
    r = min(n // 2, int(SR * release))
    if a:
        e[:a] = np.linspace(0, 1, a)
    if r:
        e[-r:] *= np.linspace(1, 0, r) ** 1.6
    return e


class Kit:
    """Holds the RNG so every game's output is reproducible from its seed."""

    def __init__(self, seed):
        self.rng = np.random.default_rng(seed)

    def uniform(self):
        return float(self.rng.uniform())

    def noise(self, seconds, lo=None, hi=None, order=2):
        x = self.rng.normal(0, 1, n_of(seconds))
        if lo and hi:
            x = sosfilt(butter(order, (lo, hi), btype='bandpass', fs=SR, output='sos'), x)
        elif hi:
            x = sosfilt(butter(order, hi, fs=SR, output='sos'), x)
        elif lo:
            x = sosfilt(butter(order, lo, btype='highpass', fs=SR, output='sos'), x)
        return x


def place(track, sound, at):
    start = int(round(at * SR))
    if start >= len(track) or start < 0:
        return
    end = min(len(track), start + len(sound))
    track[start:end] += sound[:end - start]


def mix(*parts):
    """Sum one-shots of different lengths, all starting at zero."""
    out = np.zeros(max(len(p) for p in parts))
    for p in parts:
        out[:len(p)] += p
    return out


def echo(x, seconds, gain, taps=2):
    y = x.copy()
    d = int(SR * seconds)
    for k in range(1, taps + 1):
        if d * k < len(y):
            y[d * k:] += x[:len(y) - d * k] * gain ** k
    return y


def stereo(x, spread_ms=4.0, width=.14):
    d = max(1, int(SR * spread_ms / 1000))
    right = np.roll(x, d) * (1 - width) + x * width
    right[:d] = x[:d] * width
    return np.column_stack((x, right))


def write(path, x, peak=.86):
    path.parent.mkdir(parents=True, exist_ok=True)
    x = np.nan_to_num(np.asarray(x, dtype=float))
    if x.ndim == 1:
        x = stereo(x)
    x -= np.mean(x, axis=0)
    # land both ends on silence: the ladder gate rejects an edge above 0.01
    fade = min(len(x) // 4, int(.004 * SR))
    if fade:
        x[:fade] *= np.linspace(0, 1, fade)[:, None]
        x[-fade:] *= np.linspace(1, 0, fade)[:, None]
    m = np.max(np.abs(x))
    if m:
        x *= peak / m
    wavfile.write(path, SR, np.int16(np.clip(x, -1, 1) * 32767))


def loop_safe(x, seconds):
    """Round every component of a loop to whole cycles first; this only softens
    the seam so the loop can be restarted from a cold start without a click."""
    seam = int(.006 * SR)
    x[:seam] *= np.linspace(0, 1, seam)
    x[-seam:] *= np.linspace(1, 0, seam)
    return x


def whole(freq, seconds):
    """Nearest frequency that completes a whole number of cycles in `seconds`."""
    return max(1, round(freq * seconds)) / seconds


# ── CAPO: 1930s crime jazz ───────────────────────────────────────────────────

class Capo:
    SEED = 19331010
    # C 6/9 colour (C E G A D) instead of a plain triad; +12 like Hard Time so
    # the ladder stays in the bright C5–C7 register that reads as a reward.
    PHRASES = [
        [60, 64, 69],
        [60, 64, 67, 69],
        [60, 62, 64, 67, 69],
        [60, 64, 67, 69, 72, 74],
        [60, 64, 67, 69, 72],
        [60, 64, 67, 69, 72, 76, 74],
        [60, 62, 64, 67, 69, 72, 74, 76],
        [60, 64, 67, 69, 72, 74, 76, 79, 81, 79],
        [60, 64, 67, 69, 72, 74, 76, 79, 81, 84, 86, 84],
    ]
    FINAL = (64, 67, 69, 74)  # E G A D over C: the 6/9 the band ends on

    def __init__(self):
        self.k = Kit(self.SEED)

    def vibes(self, note, seconds, amp=.25):
        """Vibraphone: fundamental + the bar's 4th and 10th partials, motor tremolo."""
        t = t_of(seconds)
        f = midi(note)
        body = (np.sin(2 * np.pi * f * t) + .62 * np.sin(2 * np.pi * f * 3.98 * t) * np.exp(-t * 5.5)
                + .10 * np.sin(2 * np.pi * f * 9.9 * t) * np.exp(-t * 22))
        motor = 1 - .22 * (.5 + .5 * np.sin(2 * np.pi * 5.6 * t))
        mallet = self.k.noise(seconds, 1800, 4200) * np.exp(-t * 60) * .18
        return amp * (body * np.exp(-t * 3.1) * motor + mallet) * env(len(t), .002, .05)

    def trumpet(self, note, seconds, amp=.16, wah=True):
        """Harmon-muted trumpet: band-limited saw with a nasal formant that opens."""
        t = t_of(seconds)
        f = midi(note) * (1 + .004 * np.sin(2 * np.pi * 5.2 * t) * np.minimum(1, t / .25))
        phase = 2 * np.pi * np.cumsum(f) / SR
        bright = 1400 + (1600 * np.minimum(1, t / .18) if wah else 900)
        x = np.zeros_like(t)
        for h in range(1, 14):
            hz = midi(note) * h
            if hz > 7500:
                break
            formant = np.exp(-((hz - bright) / 900) ** 2) * .9 + .25
            x += formant * np.sin(h * phase) / h
        return amp * x * env(len(t), .025, .12)

    def bass(self, note, seconds, amp=.35):
        t = t_of(seconds)
        f = midi(note)
        x = np.sin(2 * np.pi * f * t) + .35 * np.sin(4 * np.pi * f * t) + .12 * np.sin(6 * np.pi * f * t)
        finger = self.k.noise(seconds, 300, 1400) * np.exp(-t * 90) * .5
        return amp * (x * np.exp(-t * 7.5) + finger) * env(len(t), .002, .04)

    def brush(self, seconds=.18, amp=.06):
        t = t_of(seconds)
        swish = self.k.noise(seconds, 1600, 5200) * np.sin(np.pi * np.minimum(1, t / seconds))
        return amp * swish

    def ride(self, seconds=.6, amp=.05):
        t = t_of(seconds)
        x = sum(np.sin(2 * np.pi * hz * t) for hz in (3150, 4370, 5260, 6810)) / 4
        x += self.k.noise(seconds, 3000, 7600) * .4
        return amp * x * np.exp(-t * 6) * env(len(t), .001, .1)

    def piano(self, notes, seconds, amp=.16):
        t = t_of(seconds)
        x = np.zeros_like(t)
        for note in notes:
            f = midi(note)
            for h, g in ((1, 1), (2, .45), (3, .22), (4, .12), (5, .06)):
                x += g * np.sin(2 * np.pi * f * h * 1.0006 ** h * t) * np.exp(-t * (2.4 + h * .9))
        hammer = self.k.noise(seconds, 900, 3600) * np.exp(-t * 80) * .25
        return amp * (x / max(1, len(notes)) + hammer) * env(len(t), .002, .1)

    # ladder
    def celebration(self, stage, seconds):
        notes = [min(n + 12, 98) for n in self.PHRASES[stage - 1]]
        x = np.zeros(n_of(seconds))
        step = min(.34, (seconds - .48) / max(1, len(notes) - 1))
        at = .03
        for i, note in enumerate(notes):
            place(x, self.vibes(note, min(.8, seconds - at), .24 + stage * .008), at)
            if stage >= 3 and i % 2 == 0:
                place(x, self.brush(.16, .035 + stage * .004), at)
            # swing: long-short pairs, the one rhythmic thing Hard Time's straight run never does
            at += step * (1.3 if i % 2 == 0 else .7)
        if stage >= 4:
            place(x, self.bass(36 + 12, .5, .16), .03)
        if stage >= 6:
            end = max(.2, seconds - .8)
            for j, note in enumerate(self.FINAL):
                place(x, self.vibes(note + (24 if stage >= 8 else 12), .75, .10), end + .012 * j)
            place(x, self.trumpet(72 + (7 if stage >= 8 else 0), .55, .11), end - .1)
        if stage >= 7:
            for r in np.arange(.05, seconds - .5, step * 2):
                place(x, self.ride(.4, .022), r)
        x = echo(x, .11, .18)
        return x * env(len(x), .003, .22)

    def sounds(self):
        S = {}
        for i, sec in enumerate((.62, .82, 1.02, 1.24), start=1):
            S[f'win_step_{i}'] = self.celebration(i, sec)
        for stage, name, sec in ((5, 'big', 1.62), (6, 'super', 2.30), (7, 'mega', 3.05),
                                 (8, 'epic', 4.35), (9, 'max', 5.65)):
            S[f'win_tier_{name}'] = self.celebration(stage, sec)
        S['win_cap'] = self.celebration(9, 3.60)

        # bigwin_blast: the band hits one chord together
        x = np.zeros(n_of(.95))
        for j, note in enumerate((60, 64, 67, 69, 74)):
            place(x, self.trumpet(note + 12, .7, .09, wah=False), .004 * j)
        place(x, self.piano((48, 55, 64, 69), .9, .30), 0)
        place(x, self.ride(.9, .05), 0)
        S['bigwin_blast'] = x

        # coin_shimmer: a vibraphone chord left ringing on the motor — 1.6 s loop
        sec = 1.6
        t = t_of(sec)
        x = np.zeros_like(t)
        for note, g in ((72, .3), (76, .24), (79, .2), (81, .16), (86, .1)):
            f = whole(midi(note), sec)
            x += g * np.sin(2 * np.pi * f * t + note)
        motor = 1 - .35 * (.5 + .5 * np.cos(2 * np.pi * whole(5, sec) * t))
        S['coin_shimmer'] = loop_safe(x * motor, sec)

        S['frame_big_land'] = mix(self.piano((36, 43, 48, 55), .65, .5), self.bass(36, .6, .3))
        S['pluck_low'] = self.bass(43, .28, .5)
        S['reel_stop'] = mix(self.bass(40, .12, .55), self.brush(.06, .05))
        S['win_line_tick'] = self.snap()

        # reel_tension: string tremolo, whole cycles so the Web Audio loop is seamless
        sec = 3.0
        t = t_of(sec)
        x = np.zeros_like(t)
        for note, g in ((45, .4), (52, .3), (57, .22), (60, .14)):
            f = whole(midi(note), sec)
            for h in range(1, 9):
                x += g * np.sin(2 * np.pi * f * h * t) / h ** 1.3
        trem = .55 + .45 * np.sin(2 * np.pi * whole(9, sec) * t) ** 2
        S['reel_tension'] = loop_safe(x * trem, sec)

        for i in range(1, 6):
            sec = .3 + i * .05
            x = mix(self.vibes(72 + [0, 4, 7, 9, 12][i - 1], sec, .3),
                    self.piano((60 + [0, 4, 7, 9, 12][i - 1],), sec, .18))
            S[f'scatter_{i}'] = x

        # glissandi: a harp-like run up the 6/9 scale
        S['win_gliss'] = self.run([72, 74, 76, 79, 81, 84, 86, 88], 1.3, .06)
        S['win_gliss_big'] = self.run([60, 64, 67, 69, 72, 74, 76, 79, 81, 84, 86, 88, 91, 93], 2.1, .055)
        place(S['win_gliss_big'], self.trumpet(79, .9, .12), 1.0)
        # Generated LAST so every sound above draws the same random numbers it
        # always did and comes out byte-identical (2026-10-12).
        S['case_open'] = self.case_open()
        return S

    def case_open(self):
        """The Violin Case opening (the expanding Wild). Replaces sw_gunfire.wav —
        the case was drawn in to get rid of the tommy gun, so it must not fire one.
        Two brass latches, the lid swinging up, then the band's 6/9 stab."""
        sec = .82
        x = np.zeros(n_of(sec))
        place(x, self.latch(), 0.0)
        place(x, self.latch(), .07)
        t = t_of(.22)
        place(x, self.k.noise(.22, 500, 2600) * np.sin(np.pi * np.minimum(1, t / .22)) * .25, .1)
        place(x, self.bass(36, .5, .45), .26)
        for j, note in enumerate((60, 64, 69, 74)):
            place(x, self.vibes(note + 12, .5, .14), .26 + .01 * j)
        place(x, self.piano((48, 55, 64), .5, .22), .26)
        return x * env(len(x), .001, .12)

    def latch(self):
        t = t_of(.06)
        click = self.k.noise(.06, 2500, 7000) * np.exp(-t * 160) + .5 * np.sin(2 * np.pi * 3100 * t) * np.exp(-t * 200)
        thunk = .4 * np.sin(2 * np.pi * 180 * t) * np.exp(-t * 60)
        return (click + thunk) * env(len(t), .0003, .02)

    def snap(self):
        t = t_of(.12)
        x = self.k.noise(.12, 1200, 3600) * np.exp(-t * 95) + .3 * np.sin(2 * np.pi * 2300 * t) * np.exp(-t * 120)
        return x * env(len(t), .0005, .03)

    def run(self, notes, seconds, step):
        x = np.zeros(n_of(seconds))
        for i, note in enumerate(notes):
            place(x, self.vibes(note, min(.7, seconds - .03 - i * step), .2), .03 + i * step)
        return echo(x, .09, .2) * env(len(x), .003, .25)


# ── TURF: street boom-bap ────────────────────────────────────────────────────

class Turf:
    SEED = 30161010
    # C minor pentatonic (C Eb F G Bb), the street's scale; same +12 register rule.
    PHRASES = [
        [60, 63, 67],
        [60, 63, 67, 70],
        [60, 63, 65, 67, 72],
        [60, 63, 67, 70, 72, 75],
        [60, 63, 67, 72, 75],
        [60, 63, 67, 70, 72, 75, 79],
        [60, 63, 65, 67, 70, 72, 75, 79],
        [60, 63, 67, 70, 72, 75, 79, 82, 84, 82],
        [60, 63, 65, 67, 70, 72, 75, 79, 82, 84, 87, 84],
    ]
    HOOK = (79, 82, 84)  # whistle answer for the upper tiers

    def __init__(self):
        self.k = Kit(self.SEED)

    def pluck(self, note, seconds, amp=.22):
        """Two detuned pulse waves through a closing low-pass: the sampler-pluck sound."""
        t = t_of(seconds)
        x = np.zeros_like(t)
        cut = 900 + 4200 * np.exp(-t * 16)
        for detune in (1.0, 1.006):
            f = midi(note) * detune
            for h in range(1, 18):
                hz = f * h
                if hz > 8000:
                    break
                duty = np.sin(np.pi * h * .32) / h  # 32 % pulse spectrum
                x += duty * np.exp(-(hz / cut) ** 2) * np.sin(2 * np.pi * hz * t)
        return amp * x * np.exp(-t * 4.2) * env(len(t), .002, .05)

    def whistle(self, note, seconds, amp=.12, scoop=-2.0):
        """G-funk lead: sine with a scoop into pitch and a late vibrato."""
        t = t_of(seconds)
        semis = scoop * np.exp(-t * 22) + .25 * np.sin(2 * np.pi * 5.8 * t) * np.minimum(1, t / .3)
        f = midi(note) * 2 ** (semis / 12)
        phase = 2 * np.pi * np.cumsum(f) / SR
        x = np.sin(phase) + .08 * np.sin(2 * phase)
        return amp * x * env(len(t), .02, .14)

    def sub808(self, note, seconds, amp=.3):
        t = t_of(seconds)
        f = midi(note) * (1 + 1.4 * np.exp(-t * 30))
        phase = 2 * np.pi * np.cumsum(f) / SR
        return amp * np.tanh(1.6 * np.sin(phase)) * np.exp(-t * 4.5) * env(len(t), .001, .06)

    def kick(self, seconds=.32, amp=.5):
        t = t_of(seconds)
        f = 52 + 110 * np.exp(-t * 38)
        phase = 2 * np.pi * np.cumsum(f) / SR
        click = self.k.noise(seconds, 1500, 4000) * np.exp(-t * 200) * .3
        return amp * (np.sin(phase) * np.exp(-t * 11) + click) * env(len(t), .0005, .04)

    def clap(self, seconds=.18, amp=.12):
        t = t_of(seconds)
        x = np.zeros_like(t)
        for d in (0, .011, .022):
            burst = self.k.noise(seconds, 900, 2800)
            gate = np.where(t >= d, np.exp(-(t - d) * (140 if d < .02 else 30)), 0)
            x += burst * gate
        return amp * x * env(len(t), .0005, .04)

    def rim(self, seconds=.1, amp=.25):
        t = t_of(seconds)
        x = .6 * np.sin(2 * np.pi * 1720 * t) * np.exp(-t * 90) + self.k.noise(seconds, 1800, 4500) * np.exp(-t * 140)
        return amp * x * env(len(t), .0003, .02)

    def scratch(self, seconds=.32, amp=.12):
        """Baby scratch: a vocal-ish tone dragged forward and back by the hand."""
        t = t_of(seconds)
        hand = np.sin(2 * np.pi * (2 / seconds) * t)  # two strokes
        f = 520 + 380 * hand
        phase = 2 * np.pi * np.cumsum(np.abs(f)) / SR
        tone = np.sin(phase) + .5 * np.sin(2 * phase) + .25 * np.sin(3 * phase)
        grit = self.k.noise(seconds, 700, 3000) * .35
        return amp * (tone + grit) * np.abs(hand) ** .6 * env(len(t), .005, .04)

    def spray(self, seconds=.3, amp=.08):
        t = t_of(seconds)
        return amp * self.k.noise(seconds, 2200, 6500, order=3) * env(len(t), .02, .1)

    def chain(self, seconds=.4, amp=.08, links=5):
        x = np.zeros(n_of(seconds))
        for i in range(links):
            t = t_of(.12)
            ping = sum(np.sin(2 * np.pi * hz * t) for hz in (1830, 2910, 4120)) / 3
            place(x, ping * np.exp(-t * 45), .02 + i * (seconds - .15) / links + self.k.uniform() * .02)
        return amp * x

    def celebration(self, stage, seconds):
        notes = [min(n + 12, 99) for n in self.PHRASES[stage - 1]]
        x = np.zeros(n_of(seconds))
        step = min(.3, (seconds - .48) / max(1, len(notes) - 1))
        for i, note in enumerate(notes):
            # straight 16ths with a push: every third note lands an eighth early
            at = .03 + i * step - (step * .25 if i % 3 == 2 else 0)
            place(x, self.pluck(note, min(.75, seconds - at), .25 + stage * .008), at)
            if stage >= 3 and i % 2 == 1:
                place(x, self.clap(.16, .05 + stage * .006), at)
        if stage >= 4:
            place(x, self.sub808(36, .55, .10 + stage * .006), .03)
        if stage >= 6:
            end = max(.2, seconds - .85)
            for j, note in enumerate(self.HOOK):
                place(x, self.whistle(note + (12 if stage >= 8 else 0), .5, .08), end + j * .14)
            place(x, self.sub808(36, .7, .12), end)
        if stage >= 8:
            place(x, self.scratch(.3, .07), .5 * seconds - .15)
        x = echo(x, .125, .16)
        return x * env(len(x), .003, .22)

    def run(self, notes, seconds, step):
        x = np.zeros(n_of(seconds))
        for i, note in enumerate(notes):
            place(x, self.pluck(note, min(.6, seconds - .03 - i * step), .2), .03 + i * step)
        return echo(x, .1, .2) * env(len(x), .003, .25)

    def sounds(self):
        S = {}
        for i, sec in enumerate((.62, .82, 1.02, 1.24), start=1):
            S[f'win_step_{i}'] = self.celebration(i, sec)
        for stage, name, sec in ((5, 'big', 1.62), (6, 'super', 2.30), (7, 'mega', 3.05),
                                 (8, 'epic', 4.35), (9, 'max', 5.65)):
            S[f'win_tier_{name}'] = self.celebration(stage, sec)
        S['win_cap'] = self.celebration(9, 3.60)

        x = np.zeros(n_of(.95))
        place(x, self.kick(.5, .7), 0)
        place(x, self.clap(.25, .3), 0)
        place(x, self.sub808(36, .9, .35), 0)
        for j, note in enumerate((60, 63, 67, 70)):
            place(x, self.pluck(note + 12, .7, .16), .003 * j)
        S['bigwin_blast'] = x

        sec = 1.6  # coin_shimmer loop: a pluck arpeggio, four bars of 16ths, whole cycles
        t = t_of(sec)
        x = np.zeros_like(t)
        seq = [72, 75, 79, 84, 79, 75, 77, 82]
        for i in range(16):
            note = seq[i % len(seq)]
            hz = whole(midi(note), sec)
            start = i * sec / 16
            tt = np.clip(t - start, 0, None)
            x += np.where(t >= start, np.sin(2 * np.pi * hz * t) * np.exp(-tt * 14), 0) * .25
        S['coin_shimmer'] = loop_safe(x, sec)

        S['frame_big_land'] = mix(self.kick(.65, .7), self.chain(.6, .1, 4), self.sub808(31, .6, .25))
        S['pluck_low'] = self.sub808(43, .28, .55)
        S['reel_stop'] = mix(self.kick(.12, .45), self.rim(.08, .18))
        S['win_line_tick'] = self.rim(.12, .4)
        S['btn'] = self.rim(.09, .5)

        x = np.zeros(n_of(.52))  # spin: a record pulled up to speed under the needle
        t = t_of(.52)
        f = 90 + 520 * (t / .52) ** 1.6
        phase = 2 * np.pi * np.cumsum(f) / SR
        x += .4 * (np.sin(phase) + .3 * np.sin(2 * phase)) * env(len(t), .01, .12)
        x += self.k.noise(.52, 600, 2400) * .08 * (t / .52)
        S['spin'] = x

        sec = 3.0  # reel_tension: an 808 drone with a hi-passed riser, whole cycles
        t = t_of(sec)
        x = .45 * np.tanh(1.4 * np.sin(2 * np.pi * whole(midi(31), sec) * t))
        x += .18 * np.sin(2 * np.pi * whole(midi(43), sec) * t)
        pulse = .6 + .4 * np.sin(2 * np.pi * whole(4, sec) * t) ** 2
        hiss = self.k.noise(sec, 1500, 4500) * .05
        S['reel_tension'] = loop_safe(x * pulse + hiss * pulse, sec)

        for i in range(1, 6):
            sec = .3 + i * .05
            note = 72 + [0, 3, 7, 10, 12][i - 1]
            x = mix(self.pluck(note, sec, .3), self.spray(min(.18, sec), .05))
            place(x, self.pluck(note + 12, sec - .05, .12), .05)
            S[f'scatter_{i}'] = x

        S['win_gliss'] = self.run([72, 75, 77, 79, 82, 84, 87, 89], 1.3, .06)
        S['win_gliss_big'] = self.run([60, 63, 65, 67, 70, 72, 75, 77, 79, 82, 84, 87, 89, 91], 2.1, .055)
        place(S['win_gliss_big'], self.whistle(84, .8, .1), 1.05)

        x = np.zeros(n_of(2.0))  # fs_intro: scratch, hook, kick-clap fill
        place(x, self.scratch(.4, .25), 0)
        for j, note in enumerate((72, 75, 79, 84)):
            place(x, self.pluck(note, .9, .22), .42 + j * .12)
        for b in range(4):
            place(x, self.kick(.3, .35), .42 + b * .3)
            place(x, self.clap(.2, .18), .57 + b * .3)
        place(x, self.whistle(84, .7, .14), 1.2)
        S['fs_intro'] = x

        x = np.zeros(n_of(1.45))  # fs_outro: the hook walking back down to the root
        for j, note in enumerate((84, 79, 75, 72)):
            place(x, self.pluck(note, .7, .24), j * .16)
        place(x, self.sub808(36, .8, .3), .64)
        S['fs_outro'] = x

        x = np.zeros(n_of(2.2))  # gong_feature: horn-section stab with a chain crash
        for j, note in enumerate((60, 63, 67, 70)):
            place(x, self.whistle(note + 12, 1.6, .1, scoop=-4.0), .01 * j)
        place(x, self.kick(.6, .6), 0)
        place(x, self.chain(1.0, .12, 7), .05)
        S['gong_feature'] = x

        x = np.zeros(n_of(.7))  # mult_update: two notes up and a clap
        place(x, self.pluck(79, .5, .26), 0)
        place(x, self.pluck(84, .5, .26), .12)
        place(x, self.clap(.2, .14), .12)
        S['mult_update'] = x
        return S


GAMES = {'capo': Capo, 'turf': Turf}
DEFAULT_OUT = {'capo': 'static/assets/audio/capo/sfx', 'turf': 'static/assets/audio/turf/sfx'}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('game', choices=GAMES)
    ap.add_argument('--out')
    ap.add_argument('--only', nargs='*', help='write just these sound names')
    args = ap.parse_args()
    root = Path(__file__).resolve().parents[1]
    out = Path(args.out) if args.out else root / DEFAULT_OUT[args.game]
    sounds = GAMES[args.game]().sounds()
    if args.only:
        sounds = {k: v for k, v in sounds.items() if k in args.only}
    for name, x in sorted(sounds.items()):
        write(out / f'{name}.wav', x)
    print(f'{args.game}: wrote {len(sounds)} files to {out}')


if __name__ == '__main__':
    main()
