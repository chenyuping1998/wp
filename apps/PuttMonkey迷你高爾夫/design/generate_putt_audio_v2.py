"""Putt Monkey sound set, second generation (2026-11-06).

Why a second generation: the first (generate_putt_audio.py) sent every cue that
was not a scatter, a win or a "wood" hit through ONE fallback branch — a 190 Hz
knock, a little noise and the same three plucks — so the trigger bell, the
door, the anticipation riser, the count-up, the collect grab and a dozen more
were literally the same sound (identical spectra in the measurement). The
reel stop and every impact had 80%+ of their energy under 400 Hz, which a
phone or laptop speaker does not reproduce: the reels landed in silence there.

This set is designed cue by cue around the course: putter tinks, ball clacks,
the hollow cup, turf, a polite crowd, the clubhouse bell, a brass band. Every
pitched cue is in C major (C pentatonic for the melodic ones) so that whatever
sounds over the music is in key with it, and the per-reel / per-ball pitch
steps the runtime applies (Sound.svelte) walk the same pentatonic scale.

Also writes the music: two 16-bar loops (base 120 bpm, free game 140 bpm), each
as TWO stems of identical length — the bed and a groove layer — that the
runtime starts on the same audio-clock instant and mixes: the groove swells
while the reels are spinning and settles when they rest (adaptive music).

    E:/stake/math-sdk/env/Scripts/python.exe -I design/generate_putt_audio_v2.py
"""
from __future__ import annotations

import json
import re
import shutil
import subprocess
import sys
import wave
from pathlib import Path

import numpy as np
import imageio_ffmpeg

sys.path.insert(0, str(Path(__file__).resolve().parent))
from putt_dsp import *  # noqa: E402,F401,F403
import putt_dsp as D  # noqa: E402

APP = Path(__file__).resolve().parents[1]
OUT = APP / 'static/assets/audio/putt'
SRC = APP / 'design/source/putt/audio'
FF = imageio_ffmpeg.get_ffmpeg_exe()

# C major / C pentatonic, MIDI
C4, D4, E4, F4, G4, A4, B4 = 60, 62, 64, 65, 67, 69, 71
PENTA = [0, 2, 4, 7, 9]


def penta(step, base=72):
    o, k = divmod(step, 5)
    return base + 12 * o + PENTA[k]


def write_wav(path, a, peak, sr=SR):
    """peak=None writes the samples as they are (already levelled)."""
    a = np.nan_to_num(np.asarray(a, dtype=float))
    m = np.max(np.abs(a)) if a.size else 1.0
    if peak is not None and m > 0:
        a = a / m * peak
    path.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(path), 'wb') as f:
        f.setnchannels(1 if a.ndim == 1 else a.shape[1])
        f.setframerate(sr)
        f.setsampwidth(2)
        f.writeframes((np.clip(a, -1, 1) * 32767).astype('<i2').tobytes())


def loudest_db(a, sr=SR, win_s=0.1):
    win = max(1, min(len(a), int(sr * win_s)))
    c = np.convolve(a ** 2, np.ones(win) / win, 'valid')
    return 10 * np.log10(c.max() + 1e-12)


def level(a, target_db, knee=0.6, ceiling=0.94):
    """Bring the loudest 100 ms to target_db (dBFS RMS), then a soft knee so a
    transient's first millisecond cannot clip. Percussive cues have a crest
    factor far above the old sustained placeholders; normalising them by PEAK
    left the reel stop 4 dB quieter than the click it replaced."""
    for _ in range(3):
        a = a * 10 ** ((target_db - loudest_db(a)) / 20)
        x = np.abs(a) / ceiling
        y = np.where(x < knee, x, knee + (1 - knee) * np.tanh((x - knee) / (1 - knee)))
        a = np.sign(a) * y * ceiling
    return a


# ═════════════════════════════════════════════════════════════════════════════
# CUES
# ═════════════════════════════════════════════════════════════════════════════

def c_btn():
    return D.woodblock(2100, 0.07) * 0.7 + D.place(np.zeros(round(0.07 * SR)), D.click(0.004, 3000, 12000), 0)


def c_spin():
    # the putter tinks the ball, the reels whoosh off
    a = np.zeros(round(0.32 * SR))
    D.place(a, D.tink(0.2, 2500), 0, gain=0.9)
    D.place(a, D.whoosh(0.26, 500, 1500, 2200, 8000), 0.02, gain=0.35)
    return a


def c_reel_stop():
    # wood knock tuned to C5 (523 Hz) so the per-reel pentatonic steps are notes
    a = D.thock(523.25, 0.17, body=0.9, bright=1.2)
    a += 0.22 * D.marimba(hz(84), 0.17, hard=0.6)
    return D.trim_tail(a)


def c_scatter(i):
    # the golden flag: a bell climbing C E G A C, more of it each time
    f = hz(penta(i, 79))  # G5 A5 C6 D6 E6 — bright, above everything
    d = 0.7 + 0.12 * i
    a = D.bell(f, d, bright=0.9 + 0.12 * i) * 0.8
    a += 0.45 * D.glock(f * 2, d)
    if i >= 2:
        a += 0.25 * D.bell(f * 1.5, d, bright=0.6)  # a fifth over it
    if i >= 3:
        sw = D.whoosh(0.5, 2500, 6000, 5000, 14000) * 0.12
        a = D.place(a, sw, 0)
    a = D.reverb(a, t60=1.2, mix=0.16)
    return D.trim_tail(a)


def c_sack_land():
    # golf ball (P) set down: a plastic clack and two little bounces
    a = np.zeros(round(0.26 * SR))
    for at, g in ((0, 1.0), (0.085, 0.42), (0.14, 0.18)):
        hit = D.modes(0.08, [(1850, 1, 70), (2900, 0.6, 95), (720, 0.5, 55)])
        hit += 0.6 * D.place(np.zeros(len(hit)), D.click(0.003, 2500, 11000), 0)
        D.place(a, hit, at, gain=g)
    return a


def c_bandit_land():
    # the Golfer (W) lands: a solid knock with a short brass "ta-da" chord
    a = np.zeros(round(0.46 * SR))
    D.place(a, D.thock(392, 0.2, body=1.0, bright=1.2), 0, gain=0.9)
    for m in (C4 + 12, E4 + 12, G4 + 12):
        D.place(a, D.brass(hz(m), 0.3, bright=1.1), 0.025, gain=0.34)
    D.place(a, D.hat(0.3, open_=True), 0.02, gain=0.12)
    return D.trim_tail(D.reverb(a, t60=0.8, mix=0.12))


def c_collect_grab():
    # the collection starts: the putter is drawn back, the crowd leans in
    a = np.zeros(round(0.8 * SR))
    D.place(a, D.whoosh(0.42, 400, 1000, 1400, 5200, shape=lambda t: (t / 0.42) ** 1.6 * np.clip((0.42 - t) / 0.06, 0, 1)), 0, gain=0.6)
    D.place(a, D.ooh(0.78, voices=8, f_lo=180, f_hi=260, rise=1.08), 0.0, gain=0.35)
    D.place(a, D.tink(0.12, 3100, ring=0.6), 0.4, gain=0.25)
    return a


def c_putt_tap():
    return D.tink(0.16, 2350)


def c_putt_sink():
    a = D.cup(0.52)
    return D.trim_tail(D.reverb(a, t60=0.45, mix=0.1))


def c_putt_roll_loop():
    # rolling over turf: periodic, so the Web Audio loop has no seam
    n = round(1.2 * SR)
    loop = D.periodic_band(n, 380, 2600)
    t = np.arange(n) / SR
    wob = 0.75 + 0.25 * np.cos(2 * np.pi * 10 * t)  # 12 ball turns a loop
    tone = 0.35 * np.sin(2 * np.pi * 250 * t) * (0.6 + 0.4 * np.cos(2 * np.pi * 10 * t))
    out = loop * wob / (np.abs(loop).max() + 1e-9) + tone * 0.3
    return out


def c_coin_in():
    # a prize added: one bright marimba note (pitched up the scale per ball)
    a = D.marimba(hz(84), 0.22, hard=1.2) + 0.35 * D.glock(hz(96), 0.22)
    return D.trim_tail(a)


def c_collect_stamp():
    # the scorecard stamp: rubber thump, paper slap, pencil tick
    a = np.zeros(round(0.36 * SR))
    D.place(a, D.modes(0.12, [(210, 0.8, 30), (520, 0.9, 40), (1350, 0.5, 70)], pitch_drop=0.1), 0)
    D.place(a, D.band(D.noise(0.06), 1200, 6500) * np.exp(-D.secs(0.06) * 60), 0.004, gain=0.9)
    D.place(a, D.woodblock(2600, 0.05), 0.12, gain=0.35)
    return D.trim_tail(a)


def c_tumbler_up():
    a = np.zeros(round(0.6 * SR))
    for k, m in enumerate((C4 + 12, E4 + 12, G4 + 12, C4 + 24)):
        D.place(a, D.marimba(hz(m), 0.35), k * 0.06, gain=0.7 + 0.1 * k)
    return D.trim_tail(D.reverb(a, t60=0.7, mix=0.12))


def c_dial_tick():
    return D.woodblock(1750, 0.06)


def c_tension_loop():
    # a drum roll on the brushes over a held dominant (G): the tease. One bar
    # of 120 bpm, built three bars long and folded, so it loops without a seam.
    bar = 2.0
    n = round(bar * SR)
    a = np.zeros(n * 2)
    step = bar / 32
    for k in range(32):
        acc = 1.0 if k % 8 == 0 else 0.62 if k % 2 == 0 else 0.45
        D.place(a, D.snare(0.09, brush=1.0), k * step, gain=0.32 * acc)
    for b in range(4):
        D.place(a, D.kick(0.3, punch=0.9), b * 0.5, gain=0.3 if b % 2 == 0 else 0.18)
    a = D.fold_loop(a, n)
    t = np.arange(n) / SR
    trem = 0.5 + 0.5 * np.sin(2 * np.pi * 8 * t)
    for m, g in ((G4 - 12, 0.12), (D4, 0.14), (G4, 0.16), (B4, 0.12), (D4 + 12, 0.08)):
        f = round(hz(m) * bar) / bar  # whole cycles per loop: no click at the wrap
        a += g * trem * (np.sin(2 * np.pi * f * t) + 0.3 * np.sin(4 * np.pi * f * t) + 0.12 * np.sin(6 * np.pi * f * t))
    return a


def c_anticipation_pickup():
    a = np.zeros(round(0.6 * SR))
    D.place(a, D.band(D.ooh(0.6, voices=10, f_lo=220, f_hi=330, rise=1.18, vowel=(420, 1050)), 450, None), 0, gain=0.55)
    D.place(a, D.whoosh(0.55, 600, 1500, 3000, 9000, shape=lambda t: (t / 0.55) ** 2 * np.clip((0.55 - t) / 0.05, 0, 1)), 0, gain=0.35)
    return a


def c_fg_level_windup():
    a = D.whoosh(0.55, 350, 900, 1800, 7000, shape=lambda t: (t / 0.55) ** 1.4 * np.clip((0.55 - t) / 0.04, 0, 1))
    a = D.place(a, D.tink(0.08, 3300, ring=0.5), 0.46, gain=0.12)
    return a


def c_fg_level_impact():
    a = np.zeros(round(0.45 * SR))
    D.place(a, D.tink(0.24, 2250, ring=1.4), 0, gain=0.9)
    D.place(a, D.thock(262, 0.25, body=1.0, bright=1.0), 0, gain=0.7)
    D.place(a, D.whoosh(0.3, 1500, 4000, 800, 2600, shape=lambda t: np.exp(-t * 9)), 0.01, gain=0.3)
    return D.trim_tail(D.reverb(a, t60=0.7, mix=0.12))


def c_fg_level_reveal():
    # a three-note brass call G C E, the band answering the putt
    a = np.zeros(round(0.85 * SR))
    for k, (m, d) in enumerate(((G4, 0.12), (C4 + 12, 0.12), (E4 + 12, 0.5))):
        D.place(a, D.brass(hz(m), d, bright=1.1), k * 0.11, gain=0.7)
        D.place(a, D.marimba(hz(m + 12), 0.3), k * 0.11, gain=0.3)
    D.place(a, D.glock(hz(G4 + 24), 0.5), 0.22, gain=0.25)
    return D.trim_tail(D.reverb(a, t60=1.0, mix=0.16))


def c_alarm_bell():
    # free game triggered: the clubhouse bell, twice, and the crowd rising
    a = np.zeros(round(1.7 * SR))
    for at, g in ((0, 1.0), (0.36, 0.85)):
        b = D.bell(hz(C4 + 24), 1.3, bright=1.2)
        D.place(b, D.bell(hz(G4 + 24), 1.2, bright=0.8), 0, gain=0.5)
        D.place(a, b, at, gain=0.55 * g)
    D.place(a, D.ooh(1.0, voices=12, f_lo=180, f_hi=300, rise=1.25, vowel=(520, 1150)), 0.25, gain=0.35)
    D.place(a, D.applause(1.25, density=70, env=lambda t: min(1, t / 0.4) * max(0, 1 - t / 1.25)), 0.45, gain=0.35)
    return D.trim_tail(D.reverb(a, t60=1.5, mix=0.18))


def c_alarm_trip():
    # "hole in one!": a brass hit and a cymbal, crowd cheering under it
    a = np.zeros(round(1.0 * SR))
    for m in (C4, E4, G4, C4 + 12):
        D.place(a, D.brass(hz(m), 0.55, bright=1.3), 0, gain=0.3)
    D.place(a, D.hat(0.9, open_=True), 0, gain=0.25)
    D.place(a, D.kick(0.3), 0, gain=0.5)
    D.place(a, D.applause(0.95, density=90, env=lambda t: max(0, 1 - t / 0.95)), 0.05, gain=0.4)
    return D.trim_tail(D.reverb(a, t60=1.2, mix=0.15))


def c_sack_throw():
    # a ball flying past the camera (transition): a doppler whoosh
    d = 0.45
    t = D.secs(d)
    a = D.whoosh(d, 900, 2400, 400, 1300, shape=lambda t: np.exp(-((t - 0.2) / 0.09) ** 2))
    a += 0.2 * np.sin(2 * np.pi * np.cumsum(1900 - 900 * t / d) / SR) * np.exp(-((t - 0.2) / 0.07) ** 2)
    return a


def c_shutter_down():
    # a flag cloth snapping in the wind
    a = np.zeros(round(0.42 * SR))
    for k, at in enumerate((0, 0.07, 0.12)):
        f = D.band(D.noise(0.07), 700, 4200) * np.exp(-D.secs(0.07) * 45)
        D.place(a, f, at, gain=(1.0, 0.6, 0.35)[k])
    return a


def c_door_slide():
    return D.whoosh(0.6, 300, 900, 1500, 5500)


def c_door_clack():
    return D.trim_tail(D.thock(440, 0.2, body=1.0, bright=1.1))


def c_door_open():
    return D.whoosh(0.6, 600, 1600, 2600, 9000, shape=lambda t: np.sin(np.pi * np.clip(t / 0.6, 0, 1)) ** 2)


def c_golf_roll():
    # a ball rolling across the screen and slowing down (transition)
    d = 0.95
    t = D.secs(d)
    x = D.band(D.noise(d), 420, 2800, slope=2)
    rate = 16 - 9 * t / d
    ph = np.cumsum(rate) / SR
    a = x * (0.7 + 0.3 * np.cos(2 * np.pi * ph)) * np.sin(np.pi * np.clip(t / d, 0, 1)) ** 0.6
    a = D.place(a, D.tink(0.12, 2600, ring=0.7), 0, gain=0.5)
    return a


def c_golf_cup():
    a = np.zeros(round(1.1 * SR))
    D.place(a, D.cup(0.55, pitch=0.92), 0)
    D.place(a, D.applause(0.8, density=50, env=lambda t: min(1, t / 0.1) * max(0, 1 - t / 0.8)), 0.2, gain=0.32)
    return D.trim_tail(D.reverb(a, t60=0.8, mix=0.12))


def c_ambient_far():
    # the course in the distance: a couple of birds, very far off
    a = np.zeros(round(1.4 * SR))
    for at, f0, f1, d in ((0.0, 3300, 4800, 0.09), (0.13, 3600, 5100, 0.08), (0.62, 2900, 4300, 0.14), (0.85, 3100, 4500, 0.1)):
        D.place(a, D.chirp_bird(d, f0, f1), at, gain=0.6)
    return D.trim_tail(D.reverb(D.band(a, 1500, 7000), t60=1.6, mix=0.35))


def c_shutter_slam():
    a = D.thock(440, 0.4, body=0.8, bright=1.3)
    D.place(a, D.hat(0.3, open_=True), 0, gain=0.3)
    return D.trim_tail(a)


def c_safe_open():
    # Buy Bonus pressed: a club drawn from the bag — metal shing, bag thump
    a = np.zeros(round(0.65 * SR))
    D.place(a, D.whoosh(0.32, 2000, 5000, 4500, 14000, shape=lambda t: (t / 0.32) ** 0.8 * np.exp(-t * 4)), 0, gain=0.5)
    D.place(a, D.modes(0.6, [(2650, 0.6, 7), (4100, 0.4, 10), (5900, 0.25, 14)]), 0.12, gain=0.3)
    D.place(a, D.thock(330, 0.18, body=1.0, bright=0.8), 0.0, gain=0.6)
    return D.trim_tail(D.reverb(a, t60=0.8, mix=0.12))


def c_fs_intro():
    # free game opening fanfare: band + marimba, in C, ends on the tonic chord
    d = 3.0
    a = np.zeros(round(d * SR))
    beat = 60 / 140
    line = [(0, G4, 0.5), (0.5, C4 + 12, 0.5), (1, E4 + 12, 0.5), (1.5, G4 + 12, 1.0), (2.5, E4 + 12, 0.5),
            (3, G4 + 12, 0.5), (3.5, C4 + 24, 2.5)]
    for at, m, L in line:
        D.place(a, D.brass(hz(m), L * beat * 0.95, bright=1.2), at * beat, gain=0.45)
        D.place(a, D.marimba(hz(m + 12), 0.4), at * beat, gain=0.3)
    for m in (C4, E4, G4):
        D.place(a, D.brass(hz(m), 2.5 * beat, bright=0.9), 3.5 * beat, gain=0.22)
    for k in range(7):
        D.place(a, D.snare(0.12), k * beat * 0.5, gain=0.18 + 0.03 * k)
    D.place(a, D.kick(), 3.5 * beat, gain=0.6)
    D.place(a, D.hat(1.2, open_=True), 3.5 * beat, gain=0.22)
    D.place(a, D.applause(1.4, density=80, env=lambda t: min(1, t / 0.2) * max(0, 1 - t / 1.4)), 3.5 * beat, gain=0.3)
    return D.trim_tail(D.reverb(a, t60=1.4, mix=0.16))


def c_win_small():
    # under the reel-by-reel win notes: a soft tonic hit and a shaker swell
    a = np.zeros(round(0.55 * SR))
    for m in (C4 + 12, G4 + 12, E4 + 24):
        D.place(a, D.marimba(hz(m), 0.5, hard=0.8), 0, gain=0.4)
    for k in range(4):
        D.place(a, D.shaker(0.07), 0.0625 * k, gain=0.25 + 0.05 * k)
    return D.trim_tail(D.reverb(a, t60=0.8, mix=0.12))


def c_win_mid():
    a = np.zeros(round(1.0 * SR))
    for k, m in enumerate((C4 + 12, E4 + 12, G4 + 12, C4 + 24, E4 + 24)):
        D.place(a, D.marimba(hz(m), 0.5), k * 0.0625, gain=0.55)
        D.place(a, D.vibes(hz(m), 0.8), k * 0.0625, gain=0.18)
    D.place(a, D.glock(hz(G4 + 24), 0.6), 0.32, gain=0.3)
    return D.trim_tail(D.reverb(a, t60=1.0, mix=0.15))


def c_win_wake():
    # one note per reel as the win lights up across the board (pitched per reel
    # up the pentatonic scale by the runtime): mallet + a little putter tink
    a = D.marimba(hz(79), 0.32, hard=1.1) * 0.8 + 0.3 * D.vibes(hz(79), 0.32)
    a = D.place(a, D.tink(0.06, 3400, ring=0.5), 0, gain=0.12)
    return D.trim_tail(a)


def c_count_loop():
    # the count-up bed: woodblock 16ths on a 120 bpm bar, accents on the beat,
    # shaker in between — rhythmic, no recognisable attack to repeat on
    bar = 2.0
    n = round(bar * SR)
    a = np.zeros(n * 2)
    for k in range(16):
        at = k * (bar / 16)
        on = k % 4 == 0
        D.place(a, D.woodblock(1950 if on else 2650, 0.05), at, gain=0.55 if on else 0.3)
        D.place(a, D.shaker(0.06), at + bar / 32, gain=0.18)
    return D.fold_loop(a, n)


def c_count_end():
    a = np.zeros(round(0.9 * SR))
    D.place(a, D.bell(hz(C4 + 24), 0.9, bright=0.8), 0, gain=0.5)
    for m in (C4 + 12, E4 + 12, G4 + 12):
        D.place(a, D.marimba(hz(m), 0.6), 0, gain=0.35)
    return D.trim_tail(D.reverb(a, t60=1.0, mix=0.14))


def c_bill_counter():
    # first beat of a big-win count: a band hit to start the roll
    a = np.zeros(round(0.9 * SR))
    D.place(a, D.snare(0.2), 0, gain=0.5)
    D.place(a, D.kick(), 0, gain=0.5)
    for k in range(6):
        D.place(a, D.snare(0.1, brush=1.0), 0.0625 * (k + 1), gain=0.18 + 0.04 * k)
    return D.trim_tail(a)


def c_cash_register():
    # free game total panel: the clubhouse bell and a round of applause
    a = np.zeros(round(1.4 * SR))
    D.place(a, D.bell(hz(G4 + 12), 1.2, bright=1.0), 0, gain=0.5)
    D.place(a, D.bell(hz(C4 + 24), 1.2, bright=1.0), 0.14, gain=0.45)
    D.place(a, D.applause(1.3, density=85, env=lambda t: min(1, t / 0.15) * max(0, 1 - t / 1.3)), 0.05, gain=0.42)
    return D.trim_tail(D.reverb(a, t60=1.2, mix=0.15))


def c_bigwin_slam():
    a = np.zeros(round(0.8 * SR))
    D.place(a, D.kick(0.4), 0, gain=0.7)
    D.place(a, D.snare(0.25), 0, gain=0.55)
    D.place(a, D.hat(0.7, open_=True), 0, gain=0.3)
    for m in (C4, G4, C4 + 12, E4 + 12):
        D.place(a, D.brass(hz(m), 0.32, bright=1.4), 0, gain=0.28)
    D.place(a, D.tink(0.2, 2300), 0, gain=0.35)
    return D.trim_tail(D.reverb(a, t60=1.1, mix=0.15))


def fanfare(d, tier):
    """Big-win fanfares: same band, more of it each tier — length, voices,
    register, drums and crowd all climb. 140 bpm so it sits over either bed."""
    beat = 60 / 140
    a = np.zeros(round(d * SR))
    prog = [(C4, E4, G4), (F4, A4, C4 + 12), (G4, B4, D4 + 12), (C4 + 12, E4 + 12, G4 + 12)]
    lift = [0, 0, 2, 5, 7][tier]  # each tier sits higher
    bars = max(1, int(d / (4 * beat)))
    melody = [0, 4, 7, 12, 9, 7, 12, 16]
    for bar in range(bars + 1):
        chord = prog[min(bar, 3) if bar < 4 else 3]
        t0 = bar * 4 * beat
        if t0 >= d - 0.3:
            break
        last = t0 + 4 * beat >= d - 0.3
        L = min(4 * beat, d - t0 - 0.15)
        for m in chord:
            D.place(a, D.brass(hz(m + lift), L * (1 if last else 0.9), bright=0.9 + 0.12 * tier), t0, gain=0.16 + 0.02 * tier)
        # melody 8ths on top
        for k in range(8 if not last else 1):
            at = t0 + k * beat / 2
            if at > d - 0.25:
                break
            m = 72 + lift + melody[(k + bar * 3) % len(melody)]
            dur = beat / 2 if not last else min(2.5, d - at - 0.1)
            D.place(a, D.marimba(hz(m), max(0.15, dur)), at, gain=0.3)
            if tier >= 1:
                D.place(a, D.glock(hz(m + 12), 0.4), at, gain=0.12 + 0.03 * tier)
            if tier >= 3 and k % 2 == 0:
                D.place(a, D.brass(hz(m), beat / 2 * 0.9, bright=1.2), at, gain=0.14)
        # drums
        for b in range(4):
            at = t0 + b * beat
            if at > d - 0.2:
                break
            D.place(a, D.kick(), at, gain=0.45 if b % 2 == 0 or tier >= 2 else 0.25)
            if b % 2:
                D.place(a, D.snare(0.2), at, gain=0.3 + 0.03 * tier)
            for h in range(2 if tier < 2 else 4):
                D.place(a, D.hat(0.05), at + h * beat / (2 if tier < 2 else 4), gain=0.12)
        if last:
            D.place(a, D.hat(1.5, open_=True), t0, gain=0.25)
            D.place(a, D.kick(0.5), t0, gain=0.6)
            break
    crowd_from = 0.3 if tier >= 2 else d * 0.45
    D.place(a, D.applause(d - crowd_from, density=60 + 15 * tier,
                          env=lambda t: min(1, t / 0.5) * max(0, 1 - t / (d - crowd_from))), crowd_from, gain=0.18 + 0.05 * tier)
    if tier >= 3:
        D.place(a, D.ooh(1.4, voices=14, f_lo=190, f_hi=320, rise=1.3, vowel=(650, 1150)), 0.2, gain=0.22)
    return D.trim_tail(D.reverb(a, t60=1.5, mix=0.16))


def c_win_cap():
    a = np.zeros(round(1.0 * SR))
    for m in (C4, E4, G4, C4 + 12):
        D.place(a, D.brass(hz(m), 0.5, bright=1.1), 0, gain=0.28)
    D.place(a, D.bell(hz(C4 + 24), 0.9), 0.02, gain=0.35)
    D.place(a, D.hat(0.6, open_=True), 0, gain=0.2)
    return D.trim_tail(D.reverb(a, t60=1.2, mix=0.16))


LOOPS = {'putt_roll_loop', 'anticipation_theme', 'reel_tension', 'count_loop'}

CUES = {
    # name: (builder, loudest-100ms dBFS, needs_hi_share) — the hi-share floor keeps a cue
    # audible on phone speakers (>= 55% of its energy above 400 Hz)
    'btn': (c_btn, -19, True),
    'spin': (c_spin, -15, True),
    'reel_stop': (c_reel_stop, -14, True),
    'scatter_1': (lambda: c_scatter(0), -11.5, True),
    'scatter_2': (lambda: c_scatter(1), -11.3, True),
    'scatter_3': (lambda: c_scatter(2), -11.1, True),
    'scatter_4': (lambda: c_scatter(3), -10.9, True),
    'scatter_5': (lambda: c_scatter(4), -10.7, True),
    'sack_land': (c_sack_land, -18, True),
    'bandit_land': (c_bandit_land, -13, True),
    'collect_grab': (c_collect_grab, -15, True),
    'putt_tap': (c_putt_tap, -17, True),
    'putt_sink': (c_putt_sink, -15, True),
    'putt_roll_loop': (c_putt_roll_loop, -22, True),
    'coin_in': (c_coin_in, -15, True),
    'collect_stamp': (c_collect_stamp, -14, True),
    'tumbler_up': (c_tumbler_up, -13, True),
    'dial_tick': (c_dial_tick, -18, True),
    'anticipation_theme': (c_tension_loop, -14.5, False),
    'reel_tension': (c_tension_loop, -14.5, False),
    'anticipation_pickup': (c_anticipation_pickup, -14, True),
    'fg_level_windup': (c_fg_level_windup, -14, True),
    'fg_level_impact': (c_fg_level_impact, -12.5, True),
    'fg_level_reveal': (c_fg_level_reveal, -12, True),
    'alarm_bell': (c_alarm_bell, -12.5, True),
    'alarm_trip': (c_alarm_trip, -12.5, False),
    'sack_throw': (c_sack_throw, -14, True),
    'shutter_down': (c_shutter_down, -15, True),
    'door_slide': (c_door_slide, -15, True),
    'door_clack': (c_door_clack, -15, True),
    'door_open': (c_door_open, -15, True),
    'golf_roll': (c_golf_roll, -15, True),
    'golf_cup': (c_golf_cup, -13.5, True),
    'ambient_far': (c_ambient_far, -17, True),
    'shutter_slam': (c_shutter_slam, -14, True),
    'safe_open': (c_safe_open, -13, True),
    'fs_intro': (c_fs_intro, -11.5, False),
    'win_small': (c_win_small, -14, False),
    'win_mid': (c_win_mid, -13, True),
    'win_wake': (c_win_wake, -15, True),
    'count_loop': (c_count_loop, -21, True),
    'count_end': (c_count_end, -13, True),
    'bill_counter': (c_bill_counter, -13, False),
    'cash_register': (c_cash_register, -12.5, True),
    'bigwin_slam': (c_bigwin_slam, -11.5, False),
    'win_big': (lambda: fanfare(2.4, 0), -11.8, False),
    'win_super': (lambda: fanfare(3.2, 1), -11.6, False),
    'win_mega': (lambda: fanfare(4.2, 2), -11.4, False),
    'win_epic': (lambda: fanfare(5.2, 3), -11.2, False),
    'win_max': (lambda: fanfare(6.2, 4), -11, False),
    'win_cap': (c_win_cap, -12.5, False),
}


# ═════════════════════════════════════════════════════════════════════════════
# MUSIC — two stems per loop
# ═════════════════════════════════════════════════════════════════════════════

MSR = 48000

# 16 bars, C major. A: C Am F G | C Am Dm7 G7   B: F G Em Am | F G C C
PROG = [
    (48, (60, 64, 67)), (45, (57, 60, 64)), (41, (57, 60, 65)), (43, (59, 62, 67)),
    (48, (60, 64, 67)), (45, (57, 60, 64)), (50, (57, 60, 65)), (43, (59, 62, 65)),
    (41, (57, 60, 65)), (43, (59, 62, 67)), (40, (59, 64, 67)), (45, (57, 60, 64)),
    (41, (57, 60, 65)), (43, (59, 62, 67)), (48, (60, 64, 67)), (48, (60, 64, 67)),
]
# melody in 8ths: (start, midi, length) per bar; None = rest. Original.
MEL = [
    [(0, 76, 1), (1, 79, 1), (2, 81, 2), (4, 79, 1), (5, 76, 1), (6, 74, 2)],
    [(0, 72, 1), (1, 76, 1), (2, 81, 1), (3, 79, 1), (4, 76, 3)],
    [(0, 69, 1), (1, 72, 1), (2, 77, 2), (4, 76, 1), (5, 74, 1), (6, 72, 2)],
    [(0, 71, 1), (1, 74, 1), (2, 79, 3), (5, 77, 1), (6, 74, 1), (7, 71, 1)],
    [(0, 76, 1), (1, 79, 1), (2, 81, 2), (4, 84, 1), (5, 81, 1), (6, 79, 2)],
    [(0, 76, 1), (1, 72, 1), (2, 76, 1), (3, 81, 1), (4, 79, 2), (6, 76, 2)],
    [(0, 74, 1), (1, 77, 1), (2, 81, 1), (3, 84, 1), (4, 81, 2), (6, 77, 2)],
    [(0, 79, 2), (2, 77, 1), (3, 74, 1), (4, 71, 2), (6, 67, 1)],
    [(0, 84, 2), (2, 81, 1), (3, 77, 1), (4, 81, 2), (6, 84, 1), (7, 86, 1)],
    [(0, 83, 2), (2, 79, 1), (3, 74, 1), (4, 79, 3)],
    [(0, 83, 1), (1, 79, 1), (2, 76, 2), (4, 79, 1), (5, 83, 1), (6, 88, 2)],
    [(0, 84, 2), (2, 81, 2), (4, 76, 2), (6, 79, 2)],
    [(0, 81, 1), (1, 84, 1), (2, 89, 2), (4, 88, 1), (5, 86, 1), (6, 84, 2)],
    [(0, 86, 1), (1, 83, 1), (2, 79, 1), (3, 83, 1), (4, 86, 2), (6, 83, 2)],
    [(0, 88, 3), (3, 86, 1), (4, 84, 2), (6, 79, 2)],
    [(0, 84, 4)],
]


def pan(mono, p):
    """p in [-1, 1] → equal-power stereo."""
    a = (p + 1) * np.pi / 4
    return np.stack([mono * np.cos(a), mono * np.sin(a)], 1)


def render_music(feature):
    bpm = 140 if feature else 120
    beat = 60 / bpm
    bar = 4 * beat
    total = 16 * bar
    n = round(total * MSR)
    tail = round(3.0 * MSR)
    bed = np.zeros((n + tail, 2))
    groove = np.zeros((n + tail, 2))
    sr = MSR
    rng = np.random.default_rng(1962 + feature)

    def put(dst, mono, at, p=0.0, g=1.0):
        D.place(dst, pan(mono, p), at, sr, g)

    # pre-render drums once (reused hits sound like a kit, not a synth)
    K = D.kick(0.35, sr)
    SN = D.snare(0.22, sr, brush=0.0 if feature else 0.6)
    CL = D.clap(0.25, sr)
    HH = [D.hat(0.05, sr) for _ in range(3)]
    OH = D.hat(0.35, sr, open_=True)
    SH = [D.shaker(0.07, sr) for _ in range(3)]
    WB = D.woodblock(1700, 0.08, sr)

    for b, (root, chord) in enumerate(PROG):
        t0 = b * bar
        # ── bed: bass ──
        if feature:
            for k in range(8):
                m = root - 12 + (0 if k % 4 != 3 else 7)
                put(bed, D.ks(hz(m), beat * 0.48, sr, t60=0.6, bright=0.4, rng=rng), t0 + k * beat / 2, 0.0, 0.42 if k % 2 == 0 else 0.3)
        else:
            pattern = [(0, 0, 1.6), (2, 7, 1.0), (3.5, 5 if b % 2 else 4, 0.5)]
            for at, iv, L in pattern:
                m = root - 12 + iv
                put(bed, D.ks(hz(m), beat * L * 0.95, sr, t60=0.9, bright=0.4, rng=rng), t0 + at * beat, 0.0, 0.5)
        # ── bed: ukulele-ish chords on the off-beats ──
        strums = range(8) if feature else (1, 3, 5, 7)
        for k in strums:
            at = t0 + k * beat / 2
            down = k % 2 == 1
            for s, m in enumerate(chord if down else chord[::-1]):
                put(bed, D.ks(hz(m), beat * 0.4, sr, t60=0.35, bright=0.75, rng=rng), at + s * 0.007, -0.35 + 0.15 * s,
                    0.15 if (feature and not down) else 0.2)
        # ── bed: soft pad, B section only ──
        if b >= 8:
            put(bed, D.pad([hz(m) for m in chord], bar, sr, att=0.4, rel=0.5, bright=0.3), t0, 0.25, 0.22)
        # ── bed: melody ──
        for at, m, L in MEL[b]:
            dur = L * beat / 2
            mm = m + (12 if feature and b >= 8 else 0)
            if b < 8 or feature:
                note = D.marimba(hz(mm), max(0.25, dur * 1.6), sr)
                put(bed, note, t0 + at * beat / 2, 0.12, 0.3)
            if b >= 8:
                put(bed, D.vibes(hz(mm), max(0.4, dur * 2), sr), t0 + at * beat / 2, -0.15, 0.26)
            if feature:
                put(bed, D.glock(hz(mm + 12), 0.5, sr), t0 + at * beat / 2, 0.3, 0.08)
        # ── groove ──
        for q in range(4):
            at = t0 + q * beat
            if feature or q % 2 == 0:
                put(groove, K, at, 0.0, 0.62 if q % 2 == 0 else 0.45)
            if q % 2 == 1:
                put(groove, SN, at, 0.05, 0.36)
                put(groove, CL, at, -0.1, 0.22 if feature else 0.14)
            for s in range(4 if feature else 2):
                sub = at + s * beat / (4 if feature else 2)
                if feature or s == 1:
                    put(groove, HH[(q + s) % 3], sub, 0.35, 0.16 if s % 2 else 0.1)
            for s in range(4):
                put(groove, SH[(q * 4 + s) % 3], at + s * beat / 4, -0.4, 0.09 if s % 2 else 0.05)
        if b % 4 == 3:
            # a little woodblock pick-up into the next phrase
            for k, (m_at, gg) in enumerate(((3.0, 0.3), (3.25, 0.25), (3.5, 0.32), (3.75, 0.4))):
                put(groove, WB, t0 + m_at * beat, 0.2 - 0.1 * k, gg)
        if b == 15 or b == 7:
            put(groove, OH, t0 + 3.5 * beat, 0.3, 0.12)

    def finish(x):
        x = D.reverb(x, sr, t60=1.3, mix=0.12, stereo=True)
        x = np.stack([D.fold_loop(x[:, 0], n), D.fold_loop(x[:, 1], n)], 1)
        return x

    return finish(bed), finish(groove), bpm, n


def loudness(path_or_args):
    r = subprocess.run([FF, '-hide_banner', *path_or_args, '-af', 'loudnorm=I=-18:TP=-1:LRA=7:print_format=json',
                        '-f', 'null', '-'], capture_output=True, text=True, encoding='utf-8', errors='replace')
    blocks = re.findall(r'\{[^{}]*"input_i"[^{}]*\}', r.stderr, re.S)
    return json.loads(blocks[-1]) if blocks else None


def write_music(feature):
    bed, groove, bpm, n = render_music(feature)
    full = bed + groove
    name = 'bgm_freespin' if feature else 'bgm_main'
    tmp = SRC / f'{name}_full.wav'
    write_wav(tmp, full, 0.9, MSR)
    data = loudness(['-i', str(tmp)])
    scale = 0.9 / np.abs(full).max()
    gain_db = -18 - float(data['input_i']) if data else 0
    lin = scale * 10 ** (gain_db / 20)
    peak = np.abs(full).max() * lin
    if peak > 0.89:
        lin *= 0.89 / peak  # true-peak headroom wins over loudness
    out = {}
    for stem, x in (('', bed), ('_groove', groove)):
        wav = SRC / f'{name}{stem}.wav'
        y = np.clip(x * lin, -1, 1)
        with wave.open(str(wav), 'wb') as f:
            f.setnchannels(2)
            f.setframerate(MSR)
            f.setsampwidth(2)
            f.writeframes((y * 32767).astype('<i2').tobytes())
        mp3 = OUT / f'{name}{stem}.mp3'
        subprocess.run([FF, '-y', '-hide_banner', '-loglevel', 'error', '-i', str(wav), '-ar', str(MSR), '-ac', '2',
                        '-c:a', 'libmp3lame', '-b:a', '160k' if stem else '192k', '-write_xing', '1', str(mp3)], check=True)
        out[stem or 'bed'] = mp3.name
    tmp.unlink(missing_ok=True)
    return dict(name=name, bpm=bpm, bars=16, samples=n, sampleRate=MSR, stems=out,
                fullMixLoudness=data and data['input_i'], gainDb=round(20 * np.log10(lin), 2))


def main():
    only = set(sys.argv[1:])
    OUT.mkdir(parents=True, exist_ok=True)
    SRC.mkdir(parents=True, exist_ok=True)
    backup = SRC / 'gen1_20261106'
    if not backup.exists():
        shutil.copytree(OUT, backup)
    report = {}
    failed = []
    for name, (build, peak, need_hi) in CUES.items():
        if only and name not in only and 'cues' not in only:
            continue
        a = build()
        if name not in LOOPS:  # a fade at a loop's wrap would be a dip every pass
            a = D.fade(a, 0.0005, 0.01)
        share = D.hi_share(a)
        report[name] = dict(seconds=round(len(a) / SR, 3), hi400=round(share, 3))
        if need_hi and share < 0.55:
            failed.append(f'{name} {share:.2f}')
        a = level(a, peak)
        report[name]['loudestDb'] = round(loudest_db(a), 1)
        write_wav(OUT / f'{name}.wav', a, None)
    music = []
    if not only or 'music' in only:
        music = [write_music(False), write_music(True)]
        (SRC / 'music_manifest.json').write_text(json.dumps(music, indent=2), encoding='utf-8')
    (SRC / 'cue_report_v2.json').write_text(json.dumps(report, indent=2), encoding='utf-8')
    (SRC / 'README.txt').write_text(
        'Original procedural synthesis by this project (design/generate_putt_audio_v2.py + putt_dsp.py). '
        'No external recordings, samples or quoted melodies; the laugh voice is installed separately '
        '(install_laugh_voice.py). Music: 48 kHz stereo, two stems per loop (bed + groove), '
        'mixed at runtime; runtime MP3 with Xing/LAME gapless info. Foley: mono 44.1 kHz 16-bit WAV.\n',
        encoding='utf-8')
    for name, r in report.items():
        print(f"{name:22s} {r['seconds']:5.2f}s  >400Hz {r['hi400'] * 100:5.1f}%  {r.get('loudestDb')} dB")
    for m in music:
        print(m)
    if failed:
        print('BELOW the 55% audibility floor:', ', '.join(failed))
        sys.exit(1)


if __name__ == '__main__':
    main()
