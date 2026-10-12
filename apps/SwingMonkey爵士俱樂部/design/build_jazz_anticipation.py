"""Render the two Swing Monkey anticipation loops from the game's band instruments.

The former cue used clock clicks over the reels. These phrases use upright bass,
brushes, ride cymbal and muted trumpet, with a separate tempo/key for each music
bed. Both are exact four-beat loops for Web Audio's gapless buffer playback.

Run: python design/build_jazz_anticipation.py
"""
from pathlib import Path
import wave

import numpy as np

import generate_audio_heist as band

OUT = Path(__file__).resolve().parents[1] / 'static/assets/audio/swing'
SR = band.SR


def write(name, x):
    peak = np.max(np.abs(x)) + 1e-9
    x = x * (0.64 / peak)
    # Match both ends at zero without an audible pause at the loop point.
    edge = int(0.006 * SR)
    x[:edge] *= np.sin(np.linspace(0, np.pi / 2, edge))
    x[-edge:] *= np.cos(np.linspace(0, np.pi / 2, edge))
    with wave.open(str(OUT / name), 'wb') as f:
        f.setnchannels(1)
        f.setsampwidth(2)
        f.setframerate(SR)
        f.writeframes((np.clip(x, -1, 1) * 32767).astype('<i2').tobytes())
    print(f'{name}: {len(x) / SR:.3f}s')


def make_loop(name, bpm, bass_notes, horn_notes):
    beat = 60 / bpm
    length = 4 * beat
    size = round(length * SR)
    # Leave room for the last instrument tails, then fold them into the start.
    x = np.zeros(size + int(1.4 * SR))

    for step, note in enumerate(bass_notes):
        band.place(x, band.bass(band.mtof(note), beat * .52, .5), step * beat, .42)
    for step in range(4):
        band.place(x, band.brush_swish(beat * .9, .26), step * beat, .36)
        if step in (1, 3):
            band.place(x, band.brush_tap(.35), step * beat, .25)
        band.place(x, band.ride(.28), step * beat, .16)
        # The swung ride after 2 and 4 answers the trumpet without a clock tick.
        if step in (1, 3):
            band.place(x, band.ride(.20), (step + 2 / 3) * beat, .12)
    for step, note in enumerate(horn_notes):
        at = (step + (0.14 if step % 2 == 0 else 0.28)) * beat
        band.place(x, band.trumpet(band.mtof(note), beat * .43, .5, mute=True), at, .4)

    # A small club-room tail; fold its spill across the seam before trimming.
    x = band.reverb(x, decay=.65, mix=.12, key=f'anticipation-{name}')
    loop = x[:size].copy()
    spill = x[size:]
    loop[:min(len(spill), size)] += spill[:min(len(spill), size)]
    write(name, loop)


if __name__ == '__main__':
    # Both riffs rise over an unresolved last note, then settle when the reel lands.
    make_loop('reel_tension.wav', 105, [38, 45, 41, 45], [69, 72, 74, 76])  # D minor
    make_loop('reel_tension_fg.wav', 120, [40, 47, 43, 47], [71, 74, 76, 79])  # E minor
    pickup = np.zeros(int(.42 * SR))
    band.place(pickup, band.brush_swish(.24, .34), 0, .25)
    band.place(pickup, band.trumpet(band.mtof(69), .22, .55, mute=True), .035, .5)
    write('band_pickup.wav', pickup)
