"""Swing Monkey sound set, second generation (2026-11-06).

User: 「動畫跟音效節奏方面要更強」. What was measured first:

- The music was not swing. tools/build_three_theme_audio.py played straight
  eighths at 154 / 172 bpm (a kick, a snare and a hat tick on a grid, a horn
  every other beat), so the "jazz club" had no swing feel at all, and nothing
  else in the game knew where its beat was.
- The four instrument phrases (H1–H4 wins) ran on their own ~107 bpm grid
  (280 ms steps) over a 154 bpm bed.
- The reel stop had 7% of its energy above 400 Hz (93% in a 174 Hz knock a
  phone speaker cannot play); collect grab 3%, sack throw 8%, the plaque slam
  18%, the W landing 19%.

This set is one band in one key. Everything pitched is in F major; the music
is a 16-bar tune on a jazz progression (the same chord table is mirrored in
src/game/musicClock.ts — check_swing_music.mjs keeps them identical), played
with a swung eighth, walking bass, ride cymbal and the hi-hat on 2 and 4.
Instrument wins are no longer whole phrases: each instrument is one note
(or one strum) that the runtime schedules on the swung grid and pitches to
the chord the band is playing at that instant.

Music: base 128 bpm, free game 160 bpm, 16 bars each, as two stems of equal
length — the BED (bass, piano, horns) and the GROOVE (drums, and in the free
game the horn backgrounds) — mixed live by Sound.svelte: the groove swells
while the reels spin or a win plays and settles when the game rests.

Loops (count bed, anticipation) are one bar of 128 bpm at 48 kHz (90 000
samples exactly) and are played at the running music's tempo and phase.

    E:/stake/math-sdk/env/Scripts/python.exe -I design/generate_swing_audio_v2.py [cue ...|cues|music]
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
import swing_dsp as D  # noqa: E402
from swing_dsp import SR, hz  # noqa: E402

APP = Path(__file__).resolve().parents[1]
OUT = APP / 'static/assets/audio/swing'
SRC = APP / 'design/source/swing/audio'
FF = imageio_ffmpeg.get_ffmpeg_exe()

# ── harmony ──────────────────────────────────────────────────────────────────
# F major. MIDI: F2 41, C3 48, F3 53, C4 60, F4 65, C5 72, F5 77.
F2, F3, F4, F5 = 41, 53, 65, 77
QUALITY = {'maj6': (0, 4, 7, 9), 'dom7': (0, 4, 7, 10), 'min7': (0, 3, 7, 10), 'min6': (0, 3, 7, 9)}
# one chord per bar: (root pitch class above F, quality). MIRRORED in
# src/game/musicClock.ts (CHORDS) — design/check_swing_music.mjs compares them.
CHORDS = [
    (0, 'maj6'), (9, 'dom7'), (2, 'min7'), (7, 'dom7'),
    (0, 'maj6'), (9, 'dom7'), (2, 'min7'), (7, 'dom7'),
    (0, 'dom7'), (5, 'maj6'), (5, 'min6'), (0, 'maj6'),
    (9, 'dom7'), (2, 'dom7'), (7, 'dom7'), (0, 'maj6'),
]
BPM_BASE, BPM_FREE = 128, 160
SWING = {BPM_BASE: 0.64, BPM_FREE: 0.6}  # where the off-beat eighth falls inside the beat
LOOP_BPM = 128
LOOP_BAR = 4 * 60 / LOOP_BPM  # 1.875 s = 90 000 samples at 48 kHz

PENTA = [0, 2, 4, 7, 9]  # F G A C D


def bass_root(pc):
    """Root in the walking-bass register, E1..D#2 (40..51)."""
    m = F2 + pc
    return m - 12 if m > 51 else m


def chord_tones(pc, quality, lo=57):
    """Chord tones (MIDI) at or above lo, one octave's worth, ascending."""
    out = []
    for iv in QUALITY[quality]:
        m = F4 - 12 + pc + iv
        while m < lo:
            m += 12
        while m >= lo + 12:
            m -= 12
        out.append(m)
    return sorted(out)


# ── output helpers ───────────────────────────────────────────────────────────

def write_wav(path, a, peak, sr=SR):
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
    """Loudest 100 ms to target_db (RMS dBFS), soft knee above 0.6 of the
    ceiling. Percussive cues normalised by PEAK came out several dB quieter
    than the sustained ones they sit beside (see the Putt notes)."""
    for _ in range(3):
        a = a * 10 ** ((target_db - loudest_db(a)) / 20)
        x = np.abs(a) / ceiling
        y = np.where(x < knee, x, knee + (1 - knee) * np.tanh((x - knee) / (1 - knee)))
        a = np.sign(a) * y * ceiling
    return a


def buf(d):
    return np.zeros(round(d * SR))


def put(dst, src, at, gain=1.0):
    return D.place(dst, src, at, SR, gain)


def room(a, t60=0.9, mix=0.12):
    return D.trim_tail(D.reverb(a, SR, t60=t60, mix=mix))


# ═════════════════════════════════════════════════════════════════════════════
# CUES
# ═════════════════════════════════════════════════════════════════════════════

def c_btn():
    a = buf(0.09)
    put(a, D.snap(0.09), 0, 0.7)
    put(a, D.woodblock(2350, 0.06), 0, 0.35)
    return a


def c_spin():
    # the drummer's two-stick count-in click and a brush swept across the snare
    a = buf(0.42)
    put(a, D.rimshot(0.12), 0, 0.55)
    put(a, D.brush_swish(0.34), 0.03, 0.55)
    put(a, D.ride(0.4), 0.0, 0.25)
    return a


def c_reel_stop():
    # rimshot crack + a woodblock tuned to F5: the runtime pitches each reel to a
    # chord tone of the bar the band is in, so a spin landing is a little line
    a = buf(0.2)
    put(a, D.rimshot(0.2), 0, 0.55)
    put(a, D.modes(0.16, [(hz(F5), 1, 30), (hz(F5) * 2.76, 0.35, 48), (hz(F5) * 5.4, 0.15, 75)]), 0, 0.6)
    put(a, D.click(0.004, 2500, 11000), 0, 0.5)
    return D.trim_tail(a)


def c_scatter(i):
    # the golden microphone: vibes + muted trumpet climbing F pentatonic; more of
    # the band answers each time (piano at 3, ride bell at 4, a shake at 5)
    m = F5 + PENTA[i % 5] + (12 if i >= 5 else 0)
    d = 0.62 + 0.1 * i
    a = buf(d + 0.4)
    put(a, D.vibes(hz(m), d + 0.3), 0, 0.55)
    put(a, D.muted_trumpet(hz(m), 0.18 + 0.03 * i, bright=0.9 + 0.1 * i), 0.0, 0.32)
    put(a, D.snap(), 0, 0.25)
    if i >= 2:
        for k, iv in enumerate((4, 7)):
            put(a, D.piano(hz(m - 12 + iv), 0.5, vel=0.7), 0.09 + 0.05 * k, 0.22)
    if i >= 3:
        put(a, D.ride(0.8, bell=1.0), 0.0, 0.22)
    if i >= 4:
        put(a, D.shake(hz(m), 0.45), 0.16, 0.12)
    return room(a, 1.0, 0.13)


def c_sack_land():
    # a record dropped on the stack: card-stock slap and a tick of the needle
    a = buf(0.2)
    put(a, D.band(D.noise(0.05), 1500, 7000) * np.exp(-D.secs(0.05) * 90), 0, 0.55)
    put(a, D.modes(0.12, [(1650, 1, 45), (2480, 0.6, 60)]), 0, 0.35)
    put(a, D.snap(0.08), 0.012, 0.2)
    return a


def c_bandit_land():
    # the bandleader's badge lands: a band hit — piano F6 stab, snare + kick, a
    # short muted-trumpet stab over it
    a = buf(0.55)
    for m in chord_tones(0, 'maj6', 62):
        put(a, D.piano(hz(m), 0.4, vel=1.0), 0, 0.18)
    put(a, D.rimshot(0.25), 0, 0.45)
    put(a, D.kick(0.3), 0, 0.3)
    for m in (F5 + 4, F5 + 9):
        put(a, D.muted_trumpet(hz(m), 0.16, bright=1.2), 0.0, 0.2)
    put(a, D.crash(0.5), 0.0, 0.12)
    return room(a)


def c_collect_grab():
    # the records lift off: a vinyl spin-up whoosh with the needle catching
    d = 0.36
    a = buf(d)
    put(a, D.whoosh(d, 900, 2600, 2400, 9000), 0, 0.6)
    t = D.secs(d)
    f = 520 + 1300 * (t / d) ** 1.4
    put(a, np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * t / d) ** 2, 0, 0.18)
    put(a, D.snap(0.08), 0.0, 0.25)
    return a


def c_coin_in():
    # each record into the collector: a vibes + piano note at F5 (the runtime
    # walks it up the chord the band is on)
    a = buf(0.4)
    put(a, D.vibes(hz(F5), 0.38, trem=6.0), 0, 0.5)
    put(a, D.piano(hz(F5 + 12), 0.25, vel=0.9), 0, 0.18)
    put(a, D.snap(0.06), 0, 0.12)
    return D.trim_tail(a)


def c_collect_stamp():
    # the band "button": kick + crash + a horn chord stab, cut off
    a = buf(0.7)
    put(a, D.kick(0.3), 0, 0.45)
    put(a, D.rimshot(0.2), 0, 0.5)
    put(a, D.crash(0.65), 0, 0.22)
    for m in (F4 + 9, F5, F5 + 4):
        put(a, D.brass(hz(m), 0.22, bright=1.15, section=2), 0, 0.16)
    put(a, D.muted_trumpet(hz(F5 + 9), 0.22, bright=1.2), 0, 0.14)
    return room(a)


def c_tumbler_up():
    # a piano run up F pentatonic, swung
    a = buf(0.65)
    for k, st in enumerate([0, 2, 4, 7, 9, 12, 14, 16]):
        at = (k // 2) * 0.13 + (k % 2) * 0.13 * 0.62
        put(a, D.piano(hz(F4 + 12 + st), 0.3, vel=0.6 + 0.04 * k), at, 0.3)
    return room(a)


def c_dial_tick():
    a = buf(0.08)
    put(a, D.chick(0.07), 0, 0.6)
    put(a, D.click(0.004, 3000, 12000), 0, 0.3)
    return a


def c_band_pickup():
    # the drummer's fill into the tease: snare triplets climbing to a ride bell
    a = buf(0.6)
    trip = 60 / LOOP_BPM / 3
    for k in range(5):
        put(a, D.snare(0.12), k * trip * 0.75, 0.22 + 0.06 * k)
    put(a, D.tom(240, 0.25), 3 * trip * 0.75, 0.14)
    put(a, D.chick(0.07), 0, 0.3)
    put(a, D.ride(0.4, bell=1.0), 5 * trip * 0.75, 0.35)
    return a


def tension_loop(feature=False):
    # One bar at 128 bpm, unpitched (it is replayed at the running tempo, so any
    # pitch would leave the key): a brush roll crescendo, ride bell eighths, the
    # kick on the beat, a tom on 4.
    n = round(LOOP_BAR * SR)
    a = np.zeros(n * 2)
    beat = LOOP_BAR / 4
    steps = 24  # triplet sixteenths
    for k in range(steps):
        acc = 1.0 if k % 6 == 0 else 0.55 + 0.02 * k
        put(a, D.snare(0.08, brush=1.0), k * LOOP_BAR / steps, 0.2 * acc * (1.25 if feature else 1))
    for q in range(4):
        put(a, D.kick(0.3), q * beat, 0.2 if q % 2 == 0 else 0.12)
        put(a, D.ride(0.5, bell=1.0), q * beat, 0.16)
        put(a, D.ride(0.4, bell=0.6), q * beat + SWING[BPM_BASE] * beat, 0.1)
    put(a, D.tom(150, 0.3), 3 * beat + SWING[BPM_BASE] * beat, 0.3)
    if feature:
        for q in (1, 3):
            put(a, D.chick(0.07), q * beat, 0.3)
    return D.fold_loop(a, n)


def c_fg_level_windup():
    # snare roll crescendo into the throw
    d = 0.32
    a = buf(d + 0.1)
    for k in range(12):
        put(a, D.snare(0.07), k * d / 12, 0.12 + 0.035 * k)
    put(a, D.brush_swish(0.3), 0, 0.3)
    return a


def c_fg_level_impact():
    # the record smashes the card: crash, kick, and a brass sforzando on F7
    a = buf(0.9)
    put(a, D.crash(0.85), 0, 0.35)
    put(a, D.kick(0.35), 0, 0.5)
    put(a, D.rimshot(0.2), 0, 0.5)
    shards = D.band(D.noise(0.35), 3000, 12000) * np.exp(-D.secs(0.35) * 14)
    put(a, shards, 0.005, 0.22)
    for m in (F4 + 4, F4 + 10, F5, F5 + 3):
        put(a, D.brass(hz(m), 0.32, bright=1.3, section=2), 0, 0.12)
    return room(a, 1.0, 0.14)


def c_fg_level_reveal():
    # a trumpet shake on C6 over a vibes F major 6
    a = buf(0.62)
    put(a, D.shake(hz(F5 + 7), 0.5), 0, 0.3)
    for k, m in enumerate(chord_tones(0, 'maj6', 72)):
        put(a, D.vibes(hz(m), 0.55), 0.02 * k, 0.16)
    put(a, D.ride(0.5, bell=1.0), 0, 0.18)
    return room(a)


def c_ambient_scene():
    # the room between songs: two glasses touching and a little murmur
    d = 1.1
    a = buf(d)
    murmur = D.band(D.noise(d), 350, 2400, slope=2) * (0.5 + 0.5 * np.sin(np.pi * D.secs(d) / d)) ** 2
    put(a, murmur, 0, 0.08)
    for at, f in ((0.12, 3150), (0.21, 3420)):
        put(a, D.modes(0.6, [(f, 1, 7), (f * 2.32, 0.5, 11), (f * 3.9, 0.2, 16)]), at, 0.12)
    return a


def c_alarm_bell():
    # the free-game trigger: the whole band shouts an F major 6 with a fill
    d = 1.6
    a = buf(d + 0.4)
    beat = 60 / BPM_BASE
    for k, at in enumerate((0, beat * 0.64, beat)):
        put(a, D.snare(0.15), at * 0.5, 0.25 + 0.08 * k)
    hit = beat * 0.5
    put(a, D.crash(1.5), hit, 0.35)
    put(a, D.kick(0.4), hit, 0.5)
    for m in chord_tones(0, 'maj6', 65):
        put(a, D.brass(hz(m), 1.0, bright=1.3, section=3), hit, 0.13)
    put(a, D.shake(hz(F5 + 9), 0.9), hit + 0.08, 0.12)
    put(a, D.sax(hz(F4 + 4), 1.0, bright=1.0), hit, 0.12)
    return room(a, 1.2, 0.14)


def c_alarm_trip():
    # the scatter count that sets it off: ride bell + vibes F-A-C
    a = buf(0.8)
    put(a, D.ride(0.8, bell=1.0), 0, 0.35)
    for k, m in enumerate((F5, F5 + 4, F5 + 7)):
        put(a, D.vibes(hz(m), 0.6), k * 0.09, 0.3)
    return room(a)


def c_sack_throw():
    # a record thrown: a fast whoosh that flutters as it spins
    d = 0.38
    t = D.secs(d)
    w = D.whoosh(d, 700, 2200, 2600, 9500) * (1 + 0.45 * np.sin(2 * np.pi * 22 * t))
    a = buf(d)
    put(a, w, 0, 0.8)
    return a


def c_shutter_down():
    # the curtain falls on the bow: a roll into a crash
    a = buf(0.9)
    for k in range(10):
        put(a, D.snare(0.08), k * 0.045, 0.1 + 0.03 * k)
    put(a, D.crash(0.6), 0.45, 0.3)
    put(a, D.kick(0.3), 0.45, 0.4)
    return a


def c_curtain_move():
    # velvet drawn along the rail: cloth noise and rings ticking
    d = 0.85
    t = D.secs(d)
    a = buf(d)
    put(a, D.band(D.noise(d), 700, 6500, slope=2) * np.sin(np.pi * t / d) ** 1.2, 0, 0.4)
    for k in range(7):
        put(a, D.modes(0.08, [(2600 + 90 * k, 1, 60), (4100, 0.4, 80)]), 0.08 + 0.1 * k, 0.12)
    return a


def c_curtain_cover():
    # the curtain meets in the middle: a soft thump with a cymbal choke
    a = buf(0.5)
    put(a, D.band(D.noise(0.2), 700, 4500) * np.exp(-D.secs(0.2) * 22), 0, 0.5)
    put(a, D.crash(0.25) * np.exp(-D.secs(0.25) * 14), 0, 0.3)
    put(a, D.tom(160, 0.25), 0, 0.12)
    put(a, D.snap(), 0, 0.3)
    return a


def c_curtain_exit():
    # curtain up: a swish and a brass swell into the room
    d = 0.85
    a = buf(d + 0.3)
    put(a, D.whoosh(d * 0.8, 600, 1800, 1800, 7000), 0, 0.35)
    for m in chord_tones(0, 'maj6', 60):
        x = D.brass(hz(m), d, bright=0.8, att=0.4, section=2)
        put(a, x, 0.05, 0.1)
    return room(a)


def c_shutter_slam():
    a = buf(0.5)
    put(a, D.kick(0.3), 0, 0.28)
    put(a, D.rimshot(0.25), 0, 0.7)
    put(a, D.crash(0.45), 0, 0.3)
    return a


def c_safe_open():
    # Buy Bonus: a big-band hit — horns + crash, the rimshot on top
    a = buf(0.8)
    put(a, D.rimshot(0.2), 0, 0.5)
    put(a, D.crash(0.75), 0, 0.25)
    put(a, D.kick(0.3), 0, 0.35)
    for m in (F4 + 4, F4 + 9, F5, F5 + 4):
        put(a, D.brass(hz(m), 0.38, bright=1.25, section=2), 0, 0.12)
    return room(a)


def c_fs_intro():
    # free-game entrance: a 2-bar shout chorus at the free game's 160 bpm
    beat = 60 / BPM_FREE
    sw = SWING[BPM_FREE]
    d = 8 * beat + 0.6
    a = buf(d)
    riff = [(0, 77, 1), (1, 81, 1), (2, 84, 2), (4, 81, 1), (5, 84, 1), (6, 86, 2),
            (8, 84, 1), (9, 81, 1), (10, 77, 1), (11, 81, 1), (12, 84, 4)]
    for s, m, L in riff:
        at = (s // 2) * beat + (s % 2) * sw * beat
        dur = L * beat / 2 * 0.92 if s < 12 else 1.4
        put(a, D.brass(hz(m), dur, bright=1.2, section=3), at, 0.16)
        put(a, D.brass(hz(m - 5), dur, bright=1.0, section=2), at, 0.1)
        put(a, D.sax(hz(m - 12), dur), at, 0.1)
    for q in range(8):
        put(a, D.ride(0.5), q * beat, 0.16)
        put(a, D.ride(0.4), q * beat + sw * beat, 0.1)
        put(a, D.kick(0.3), q * beat, 0.24 if q % 2 == 0 else 0.14)
        if q % 2:
            put(a, D.chick(0.07), q * beat, 0.3)
        put(a, D.upright(hz(bass_root([0, 0, 9, 7][q // 2] if q < 8 else 0) + (7 if q % 2 else 0)), beat), q * beat, 0.3)
    put(a, D.crash(1.5), 6 * beat, 0.3)
    return room(a, 1.3, 0.14)


def c_win_small():
    # two swung notes on vibes + piano (the runtime starts it on the grid)
    beat = 60 / BPM_BASE
    a = buf(0.75)
    for k, m in enumerate((F5, F5 + 4)):
        at = k * SWING[BPM_BASE] * beat
        put(a, D.vibes(hz(m), 0.5), at, 0.4)
        put(a, D.piano(hz(m), 0.35, vel=0.8), at, 0.2)
    put(a, D.snap(), 0, 0.2)
    return room(a)


def c_win_mid():
    # a four-note muted-trumpet lick, swung, with a piano answer
    beat = 60 / BPM_BASE
    sw = SWING[BPM_BASE]
    a = buf(1.25)
    for s, m in enumerate((F5, F5 + 2, F5 + 4, F5 + 7)):
        at = (s // 2) * beat + (s % 2) * sw * beat
        put(a, D.muted_trumpet(hz(m), 0.16 if s < 3 else 0.42, bright=1.1), at, 0.28)
        put(a, D.vibes(hz(m), 0.35), at, 0.16)
    for m in chord_tones(0, 'maj6', 62):
        put(a, D.piano(hz(m), 0.55, vel=0.85), 2 * beat, 0.12)
    put(a, D.ride(0.6, bell=0.6), 2 * beat, 0.16)
    return room(a)


def c_win_wake():
    # one vibes note per reel as the win lights up across the board (pitched to
    # the band's chord by the runtime), with a finger snap on it
    a = buf(0.55)
    put(a, D.vibes(hz(F5), 0.5, trem=5.0), 0, 0.55)
    put(a, D.snap(0.08), 0, 0.18)
    return D.trim_tail(a)


def c_count_loop():
    # the count-up bed: one bar of swing time on the ride and hi-hat, brushes
    # underneath — no pitch (it runs at the band's tempo), nothing that repeats
    # as a recognisable sting
    n = round(LOOP_BAR * SR)
    a = np.zeros(n * 2)
    beat = LOOP_BAR / 4
    sw = SWING[BPM_BASE]
    for q in range(4):
        put(a, D.ride(0.9), q * beat, 0.42)
        if q % 2:
            put(a, D.ride(0.6), q * beat - (1 - sw) * beat, 0.26)
            put(a, D.chick(0.07), q * beat, 0.5)
        put(a, D.snare(0.12, brush=1.0), q * beat + sw * beat, 0.12)
        put(a, D.brush_swish(beat * 0.9), q * beat, 0.07)
    return D.fold_loop(a, n)


def c_count_end():
    # the count lands: a horn button on F6 with the crash
    a = buf(1.0)
    put(a, D.crash(0.9), 0, 0.25)
    put(a, D.kick(0.3), 0, 0.35)
    for m in chord_tones(0, 'maj6', 65):
        put(a, D.brass(hz(m), 0.4, bright=1.2, section=2), 0, 0.12)
    put(a, D.vibes(hz(F5 + 12), 0.8), 0, 0.2)
    return room(a)


def c_bill_counter():
    # a piano tremolo into the count (big wins)
    a = buf(1.0)
    for k in range(14):
        m = (F5, F5 + 4)[k % 2]
        put(a, D.piano(hz(m), 0.18, vel=0.5 + 0.03 * k), k * 0.055, 0.12 + 0.01 * k)
    return room(a)


def c_cash_register():
    # the free game's total: the band's ending — a rising horn line to a held chord
    beat = 60 / BPM_FREE
    a = buf(1.5)
    for k, m in enumerate((F5 - 5, F5 - 1, F5 + 2)):
        put(a, D.brass(hz(m), beat * 0.45, bright=1.1, section=2), k * beat * 0.5, 0.15)
    hit = 1.5 * beat
    put(a, D.crash(1.0), hit, 0.28)
    put(a, D.kick(0.3), hit, 0.4)
    for m in chord_tones(0, 'maj6', 65):
        put(a, D.brass(hz(m), 0.75, bright=1.2, section=3), hit, 0.12)
    return room(a, 1.1, 0.14)


def c_bigwin_slam():
    # the plaque lands: rimshot + kick + crash + a low horn stab
    a = buf(0.6)
    put(a, D.rimshot(0.25), 0, 0.6)
    put(a, D.kick(0.35), 0, 0.5)
    put(a, D.crash(0.55), 0, 0.3)
    for m in (F4, F4 + 4, F4 + 9):
        put(a, D.brass(hz(m), 0.2, bright=1.4, section=2), 0, 0.12)
    return a


def fanfare(bars, tier):
    """Big-win fanfares at 128 bpm (the runtime starts them on the beat): the
    same band, more of it each tier — horn voices, register, drums, a shake
    on top at mega and up, the sax wailing over epic and max."""
    beat = 60 / BPM_BASE
    sw = SWING[BPM_BASE]
    bar = 4 * beat
    d = bars * bar + 1.2
    a = buf(d)
    lift = [0, 2, 5, 7, 12][tier]
    prog = [(0, 'maj6'), (2, 'min7'), (7, 'dom7'), (0, 'maj6')]
    # an original riff in 8ths, chord tones and passing notes
    riff = [0, 4, 7, 9, 12, 9, 7, 4]
    for b in range(bars):
        pc, q = prog[b % 4] if b < bars - 1 else (0, 'maj6')
        t0 = b * bar
        last = b == bars - 1
        tones = chord_tones(pc, q, 60 + lift)
        # horn section: the chord on 1, a stab on the "and" of 2
        for m in tones:
            put(a, D.brass(hz(m), bar * (1.2 if last else 0.4), bright=1.0 + 0.1 * tier, section=2 + (tier >= 2)), t0, 0.1 + 0.012 * tier)
            if not last:
                put(a, D.brass(hz(m), beat * 0.3, bright=1.2, section=2), t0 + (1 + sw) * beat, 0.08 + 0.01 * tier)
        # lead line
        steps = 8 if not last else 1
        for s in range(steps):
            at = t0 + (s // 2) * beat + (s % 2) * sw * beat
            m = F5 + lift + riff[(s + 3 * b) % 8]
            dur = beat * 0.4 if not last else 1.3
            put(a, D.muted_trumpet(hz(m), dur, bright=1.1 + 0.1 * tier), at, 0.2)
            if tier >= 1:
                put(a, D.vibes(hz(m), 0.4), at, 0.08 + 0.02 * tier)
        if tier >= 2 and not last:
            put(a, D.shake(hz(F5 + 7 + lift), beat * 1.5), t0 + 2 * beat, 0.08 + 0.02 * tier)
        if tier >= 3:
            put(a, D.sax(hz(F4 + 7 + lift), bar * (1.0 if last else 0.9), bright=1.0, growl=0.5), t0, 0.08)
        # drums
        for qn in range(4 if not last else 1):
            at = t0 + qn * beat
            put(a, D.ride(0.7), at, 0.16)
            put(a, D.ride(0.5), at + sw * beat, 0.1)
            put(a, D.kick(0.3), at, 0.28 if qn % 2 == 0 else 0.16 + 0.03 * tier)
            if qn % 2:
                put(a, D.chick(0.07), at, 0.28)
                put(a, D.snare(0.16), at, 0.12 + 0.03 * tier)
        put(a, D.crash(1.4), t0, 0.12 + 0.04 * tier if (b == 0 or last) else 0.06)
        # walking bass under it
        for qn in range(4 if not last else 1):
            m = bass_root(pc) + (0, 4 if q in ('maj6', 'dom7') else 3, 7, 9)[qn]
            put(a, D.upright(hz(m), beat * 0.95), t0 + qn * beat, 0.28)
    return room(a, 1.3, 0.13)


def c_win_cap():
    # the ceiling: a held F6 with a trumpet on the top F and a cymbal roll
    a = buf(1.4)
    for k in range(12):
        put(a, D.ride(0.3), k * 0.04, 0.05 + 0.01 * k)
    put(a, D.crash(1.2), 0.48, 0.3)
    for m in chord_tones(0, 'maj6', 65):
        put(a, D.brass(hz(m), 0.8, bright=1.3, section=3), 0.48, 0.12)
    put(a, D.muted_trumpet(hz(F5 + 12), 0.8, bright=1.3), 0.48, 0.18)
    return room(a, 1.2, 0.14)


# ── the instruments the H1–H4 symbols play: one note each, pitched by the
#    runtime to the band's chord, scheduled on the swung grid ───────────────

def c_inst_sax():
    return room(D.sax(hz(F4), 0.42, bright=1.6, growl=0.3), 0.8, 0.1)


def c_inst_bass():
    return D.trim_tail(D.upright(hz(F2 + 12), 0.62, slap=1.6))


def c_inst_snare():
    a = buf(0.3)
    put(a, D.snare(0.26), 0, 0.8)
    put(a, D.rimshot(0.12), 0, 0.25)
    return a


def c_inst_banjo(quality):
    return room(D.strum([hz(m) for m in chord_tones(0, quality, 53)] + [hz(F4)], 0.55), 0.6, 0.08)


LOOPS = {'reel_tension', 'reel_tension_fg', 'count_loop'}

CUES = {
    # name: (builder, loudest-100ms dBFS, needs >= 55% of its energy above 400 Hz)
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
    'coin_in': (c_coin_in, -15, True),
    'collect_stamp': (c_collect_stamp, -13.5, True),
    'tumbler_up': (c_tumbler_up, -14, True),
    'dial_tick': (c_dial_tick, -19, True),
    'band_pickup': (c_band_pickup, -15, True),
    'reel_tension': (tension_loop, -16, True),
    'reel_tension_fg': (lambda: tension_loop(True), -15.5, True),
    'fg_level_windup': (c_fg_level_windup, -15, True),
    'fg_level_impact': (c_fg_level_impact, -12.5, True),
    'fg_level_reveal': (c_fg_level_reveal, -13, True),
    'ambient_scene': (c_ambient_scene, -22, True),
    'alarm_bell': (c_alarm_bell, -12, False),
    'alarm_trip': (c_alarm_trip, -13, True),
    'sack_throw': (c_sack_throw, -15, True),
    'shutter_down': (c_shutter_down, -15, True),
    'curtain_move': (c_curtain_move, -17, True),
    'curtain_cover': (c_curtain_cover, -15, True),
    'curtain_exit': (c_curtain_exit, -15, False),
    'shutter_slam': (c_shutter_slam, -14, True),
    'safe_open': (c_safe_open, -13, True),
    'fs_intro': (c_fs_intro, -12, False),
    'win_small': (c_win_small, -14, True),
    'win_mid': (c_win_mid, -13, True),
    'win_wake': (c_win_wake, -16, True),
    'count_loop': (c_count_loop, -21, True),
    'count_end': (c_count_end, -13, True),
    'bill_counter': (c_bill_counter, -15, False),
    'cash_register': (c_cash_register, -12.5, False),
    'bigwin_slam': (c_bigwin_slam, -11.5, True),
    'win_big': (lambda: fanfare(1, 0), -12, False),
    'win_super': (lambda: fanfare(2, 1), -11.8, False),
    'win_mega': (lambda: fanfare(2, 2), -11.6, False),
    'win_epic': (lambda: fanfare(3, 3), -11.4, False),
    'win_max': (lambda: fanfare(3, 4), -11.2, False),
    'win_cap': (c_win_cap, -12.5, False),
    'inst_sax': (c_inst_sax, -15, False),
    'inst_bass': (c_inst_bass, -14, False),
    'inst_snare': (c_inst_snare, -16, True),
    'inst_banjo_maj6': (lambda: c_inst_banjo('maj6'), -15, False),
    'inst_banjo_dom7': (lambda: c_inst_banjo('dom7'), -15, False),
    'inst_banjo_min7': (lambda: c_inst_banjo('min7'), -15, False),
}


# ═════════════════════════════════════════════════════════════════════════════
# MUSIC — a 16-bar tune, two stems per loop
# ═════════════════════════════════════════════════════════════════════════════

# lead line, original: per bar (eighth index 0..7, MIDI, length in eighths)
MEL = [
    [(0, 72, 1), (1, 74, 1), (2, 77, 2), (5, 74, 1), (6, 72, 2)],
    [(0, 74, 1), (1, 78, 1), (2, 81, 3), (6, 78, 1), (7, 76, 1)],
    [(0, 74, 2), (2, 77, 1), (3, 79, 1), (4, 82, 2), (6, 79, 2)],
    [(0, 76, 1), (1, 79, 1), (2, 82, 2), (4, 81, 1), (5, 79, 1), (6, 76, 2)],
    [(0, 77, 3), (3, 74, 1), (4, 72, 1), (5, 69, 1), (6, 72, 2)],
    [(0, 78, 1), (1, 81, 1), (2, 84, 2), (4, 81, 1), (5, 78, 1), (6, 74, 2)],
    [(0, 79, 1), (1, 82, 1), (2, 86, 2), (4, 84, 1), (5, 82, 1), (6, 79, 1), (7, 77, 1)],
    [(0, 76, 2), (2, 72, 1), (3, 70, 1), (4, 67, 4)],
    [(0, 75, 1), (1, 77, 1), (2, 81, 2), (4, 84, 1), (5, 81, 1), (6, 77, 2)],
    [(0, 74, 1), (1, 77, 1), (2, 79, 2), (4, 82, 2), (6, 79, 2)],
    [(0, 77, 2), (2, 73, 1), (3, 77, 1), (4, 79, 2), (6, 77, 2)],
    [(0, 81, 3), (3, 77, 1), (4, 74, 2), (6, 72, 2)],
    [(0, 78, 1), (1, 81, 1), (2, 84, 1), (3, 86, 1), (4, 84, 2), (6, 81, 2)],
    [(0, 83, 1), (1, 86, 1), (2, 89, 2), (4, 86, 1), (5, 83, 1), (6, 79, 2)],
    [(0, 82, 1), (1, 79, 1), (2, 76, 1), (3, 79, 1), (4, 82, 2), (6, 84, 2)],
    [(0, 77, 6)],
]
MSR = SR  # 48 kHz


def pan(mono, p):
    a = (p + 1) * np.pi / 4
    return np.stack([mono * np.cos(a), mono * np.sin(a)], 1)


def render_music(feature):
    bpm = BPM_FREE if feature else BPM_BASE
    sw = SWING[bpm]
    beat = 60 / bpm
    bar = 4 * beat
    n = round(16 * bar * MSR)
    assert abs(n - 16 * bar * MSR) < 1e-6, 'the loop must be a whole number of samples'
    tail = round(3.0 * MSR)
    bed = np.zeros((n + tail, 2))
    groove = np.zeros((n + tail, 2))
    rng = np.random.default_rng(1930 + feature)

    def at8(t0, s):
        return t0 + (s // 2) * beat + (s % 2) * sw * beat

    def P(dst, mono, at, p=0.0, g=1.0):
        D.place(dst, pan(mono, p), at, MSR, g)

    RIDE = [D.ride(1.2, rng=rng) for _ in range(4)]
    RIDE_SKIP = [D.ride(0.8, rng=rng) for _ in range(3)]
    CHICK = [D.chick(0.07, rng=rng) for _ in range(3)]
    KICK = D.kick(0.3, punch=0.6)
    SN = [D.snare(0.16) for _ in range(3)]
    CRASH = D.crash(2.0, rng=rng)

    for b, (pc, q) in enumerate(CHORDS):
        t0 = b * bar
        nxt_pc, _ = CHORDS[(b + 1) % 16]
        root = bass_root(pc)
        third = 3 if q.startswith('min') else 4
        # ── bed: walking bass, quarters, chromatic approach on 4 ──
        target = bass_root(nxt_pc)
        walk = [root, root + third, root + 7, target + (1 if (b % 2) else -1)]
        if feature and b % 4 == 3:
            walk[2] = root + (9 if q.endswith('6') else 10)
        for k, m in enumerate(walk):
            P(bed, D.upright(hz(m), beat * 1.05, rng=rng), t0 + k * beat, -0.05, 0.62 if k == 0 else 0.55)
        # ── bed: piano comping (Charleston: on 1 and the "and" of 2), rootless
        voicing = chord_tones(pc, q, 58)
        comp = [(0, 0.5), (3, 0.9)] if not feature else [(0, 0.45), (3, 0.6), (5, 0.45), (7, 0.7)]
        if b % 4 == 3 and not feature:
            comp = [(1, 0.5), (4, 0.8), (7, 0.5)]
        for s, L in comp:
            for i, m in enumerate(voicing):
                P(bed, D.piano(hz(m), beat * L * 1.1, vel=0.62, rng=rng), at8(t0, s) + 0.004 * i, 0.3, 0.13)
        # ── bed: the tune — muted trumpet A section, tenor sax B section; in the
        #    free game the two play it together, the sax a sixth below
        for s, m, L in MEL[b]:
            at = at8(t0, s)
            dur = max(0.12, L * beat / 2 * 0.95 - 0.02)
            if b < 8 or feature:
                P(bed, D.muted_trumpet(hz(m), dur, bright=1.0 + 0.15 * feature), at, 0.18, 0.2)
            if b >= 8 or feature:
                P(bed, D.sax(hz(m - (9 if feature else 12)), dur, bright=0.85, rng=rng), at, -0.22, 0.2 if not feature else 0.14)
        # ── groove: ride "ding, ding-a ding", hat on 2 and 4, feathered kick,
        #    snare comping on the off-beats
        for k in range(4):
            at = t0 + k * beat
            P(groove, RIDE[(b + k) % 4], at, 0.35, 0.3 if k % 2 == 0 else 0.26)
            if k % 2 == 1 or feature:
                P(groove, RIDE_SKIP[(b + k) % 3], at - (1 - sw) * beat if k % 2 else at + sw * beat, 0.35, 0.18)
            if k % 2 == 1:
                P(groove, CHICK[k % 3], at, -0.3, 0.4)
            P(groove, KICK, at, 0.0, 0.18 if not feature else (0.34 if k % 2 == 0 else 0.22))
        comps = [(3, 0.12), (7, 0.16)] if b % 2 == 0 else [(5, 0.1), (6, 0.14)]
        if feature:
            comps = comps + [(1, 0.1), (4, 0.12)]
        for s, g in comps:
            P(groove, SN[(b + s) % 3], at8(t0, s), 0.05, g)
        if b % 4 == 3:
            # a fill on beat 4 into the next phrase
            for s, g in ((6, 0.2), (7, 0.26)):
                P(groove, SN[s % 3], at8(t0, s), 0.05, g)
            P(groove, D.tom(170, 0.3), at8(t0, 7) + (1 - sw) * beat * 0.5, -0.2, 0.25)
        if b % 4 == 0:
            P(groove, CRASH, t0, 0.4, 0.16 if b else 0.2)
        # ── free game: horn backgrounds ride in the groove stem, so they come
        #    and go with the action
        if feature and b % 2 == 1:
            for m in chord_tones(pc, q, 62):
                P(groove, D.brass(hz(m), beat * 0.35, bright=1.15, section=2), at8(t0, 3), -0.15, 0.08)
                P(groove, D.brass(hz(m), beat * 0.6, bright=1.15, section=2), at8(t0, 6), -0.15, 0.09)

    def finish(x):
        x = D.reverb(x, MSR, t60=1.2, mix=0.1, stereo=True)
        return np.stack([D.fold_loop(x[:, 0], n), D.fold_loop(x[:, 1], n)], 1)

    return finish(bed), finish(groove), bpm, n


def loudness(args):
    r = subprocess.run([FF, '-hide_banner', *args, '-af', 'loudnorm=I=-18:TP=-1:LRA=7:print_format=json',
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
        lin *= 0.89 / peak
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
        wav.unlink()
        out[stem or 'bed'] = mp3.name
    tmp.unlink(missing_ok=True)
    return dict(name=name, bpm=bpm, swing=SWING[bpm], bars=16, samples=n, sampleRate=MSR, stems=out,
                fullMixLoudness=data and data['input_i'], gainDb=round(20 * np.log10(lin), 2))


def main():
    only = set(sys.argv[1:])
    OUT.mkdir(parents=True, exist_ok=True)
    SRC.mkdir(parents=True, exist_ok=True)
    backup = SRC / 'gen1_20261106'
    if not backup.exists():
        shutil.copytree(OUT, backup)
    report, failed = {}, []
    for name, (build, peak, need_hi) in CUES.items():
        if only and name not in only and 'cues' not in only:
            continue
        a = build()
        if name not in LOOPS:
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
        manifest = dict(key='F major', loopBpm=LOOP_BPM, chords=[list(c) for c in CHORDS], loops=music)
        (SRC / 'music_manifest.json').write_text(json.dumps(manifest, indent=2), encoding='utf-8')
    if report:
        (SRC / 'cue_report_v2.json').write_text(json.dumps(report, indent=2), encoding='utf-8')
    (SRC / 'README_v2.txt').write_text(
        'Original procedural synthesis by this project (design/generate_swing_audio_v2.py + swing_dsp.py). '
        'No external recordings, samples or quoted melodies; the laugh voice is installed separately '
        '(install_laugh_voice.py). Music: 48 kHz stereo, two stems per loop (bed + groove) mixed at runtime, '
        'MP3 with Xing/LAME gapless info. Cues: mono 48 kHz 16-bit WAV.\n', encoding='utf-8')
    for name, r in report.items():
        print(f"{name:20s} {r['seconds']:5.2f}s  >400Hz {r['hi400'] * 100:5.1f}%  {r.get('loudestDb')} dB")
    for m in music:
        print(m)
    if failed:
        print('BELOW the 55% audibility floor:', ', '.join(failed))
        sys.exit(1)


if __name__ == '__main__':
    main()
