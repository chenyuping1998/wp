#!/usr/bin/env python3
"""Placeholder audio sprite for Moooo, synthesised rather than borrowed.

    python design/build_placeholder_audio.py

Writes static/assets/audio/sounds.wav and sounds.json — a Howler audio sprite,
one clip per sound name the game asks for, generated from oscillators here.

Same reasoning as the art generator: nothing is copied from a sibling app or a
template, so `design/check_provenance.mjs` has nothing to collide with. Hot
Miami's audio arrived as one 400-second sprite of unknown origin, which is
exactly the kind of asset nobody re-checks before submitting.

These are PLACEHOLDERS and they sound like it. Their job is to let the game boot,
let every `soundOnce` call resolve to a real clip, and make it audible WHEN a
beat fires so the timing can be judged. The clips are pitched by family — reel
stops low and short, scatter stops rising in pitch, bells bright — so a
playthrough is legible by ear even though none of it is the final sound design.

The sound NAMES are read from src/game/sound.ts rather than restated, so this
cannot drift out of step with what the game actually asks for. A name in the game
with no clip here is a silent failure at run time; a clip here with no name in
the game is dead weight in the download.
"""

import json
import math
import os
import re
import struct
import wave

HERE = os.path.dirname(os.path.abspath(__file__))
APP = os.path.abspath(os.path.join(HERE, ".."))
OUT = os.path.join(APP, "static", "assets", "audio")

RATE = 44100
GAP_MS = 250  # silence between clips, so a sprite offset that is slightly off
              # bleeds into silence rather than into the next sound


def read_sound_names():
    """Pull the sound names out of src/game/sound.ts."""
    source = open(os.path.join(APP, "src", "game", "sound.ts"), encoding="UTF-8").read()
    block = source[source.index("export type MusicName"):source.index("export type SoundName")]
    names = re.findall(r"'([a-z0-9_]+)'", block)
    seen, ordered = set(), []
    for name in names:
        if name not in seen:
            seen.add(name)
            ordered.append(name)
    return ordered


def envelope(i, total, attack=0.01, release=0.4):
    t = i / total
    a = min(1.0, t / attack) if attack else 1.0
    r = min(1.0, (1.0 - t) / release) if release else 1.0
    return a * r


def tone(freq, ms, kind="sine", volume=0.28):
    n = int(RATE * ms / 1000)
    out = []
    for i in range(n):
        t = i / RATE
        if kind == "sine":
            v = math.sin(2 * math.pi * freq * t)
        elif kind == "square":
            v = 1.0 if math.sin(2 * math.pi * freq * t) >= 0 else -1.0
        elif kind == "sweep":
            v = math.sin(2 * math.pi * (freq + freq * 1.5 * (i / n)) * t)
        else:  # noise-ish, deterministic so the file is reproducible
            v = math.sin(t * freq * 97.3) * math.sin(t * freq * 41.7)
        out.append(v * volume * envelope(i, n))
    return out


def clip_for(name):
    """Pitch and shape by family, so a playthrough is legible by ear."""
    if name.startswith("bgm_"):
        return tone(196, 1600, "sine", 0.12)
    if name.startswith("jng_"):
        return tone(392, 900, "sweep", 0.22)
    if name.startswith("sfx_reel_stop"):
        index = int(name[-1]) if name[-1].isdigit() else 1
        return tone(150 + index * 12, 120, "square", 0.18)
    if name.startswith("sfx_scatter_stop"):
        index = int(name[-1]) if name[-1].isdigit() else 1
        return tone(440 * (1.16 ** index), 380, "sine", 0.3)
    if name.startswith("sfx_multiplier") or name.startswith("sfx_wild"):
        return tone(660, 320, "sweep", 0.26)
    if name.startswith("sfx_winlevel") or name.startswith("sfx_scatter_win"):
        return tone(523, 600, "sine", 0.28)
    if name.startswith("sfx_anticipation"):
        return tone(220, 700, "sweep", 0.2)
    if name.startswith("sfx_btn"):
        return tone(880, 70, "square", 0.16)
    if name.startswith("tumble_"):
        return tone(330, 260, "sine", 0.22)
    return tone(330, 300, "sine", 0.24)


def read_cn_sfx_names():
    """The individual one-shot files Sound.svelte loads with `new Audio(...)`.

    A second audio path alongside the sprite, and one the asset gate cannot see:
    the URL is assembled as `${base}/assets/audio/${CN_SFX_FILES[name]}`, so
    neither line contains a resolvable path and nothing checks these exist. Hot
    Miami's copies lived under `audio/miami/sfx/`, and until this was noticed a
    Moooo build was requesting that folder by name and 404ing on every one.

    Read from the component rather than restated here, for the same reason the
    sprite names are: a list in two places is a list that drifts.
    """
    source = open(os.path.join(APP, "src", "components", "Sound.svelte"), encoding="UTF-8").read()
    return sorted(set(re.findall(r"moooo/sfx/([a-z0-9_]+)\.wav", source)))


def write_wav(path, samples):
    with wave.open(path, "w") as handle:
        handle.setnchannels(1)
        handle.setsampwidth(2)
        handle.setframerate(RATE)
        handle.writeframes(
            b"".join(struct.pack("<h", int(max(-1.0, min(1.0, v)) * 32767)) for v in samples)
        )


def main():
    names = read_sound_names()
    os.makedirs(OUT, exist_ok=True)

    samples = []
    sprite = {}
    gap = [0.0] * int(RATE * GAP_MS / 1000)
    for name in names:
        start_ms = len(samples) / RATE * 1000
        clip = clip_for(name)
        samples.extend(clip)
        duration_ms = len(clip) / RATE * 1000
        # Music loops; everything else is one-shot. Howler reads the third
        # element as the loop flag.
        sprite[name] = [round(start_ms), round(duration_ms, 2)] + ([True] if name.startswith("bgm_") else [])
        samples.extend(gap)

    path = os.path.join(OUT, "sounds.wav")
    write_wav(path, samples)

    config = {name: {"volume": 0.35 if name.startswith("bgm_") else 1} for name in names}
    manifest = {"sprite": sprite, "src": ["./assets/audio/sounds.wav"], "config": config}
    with open(os.path.join(OUT, "sounds.json"), "w", encoding="UTF-8") as handle:
        json.dump(manifest, handle, indent="\t")

    seconds = len(samples) / RATE
    print(f"wrote {path} ({seconds:.1f}s, {len(names)} clips)")
    print(f"wrote {os.path.join(OUT, 'sounds.json')}")

    sfx_dir = os.path.join(OUT, "moooo", "sfx")
    os.makedirs(sfx_dir, exist_ok=True)
    cn_names = read_cn_sfx_names()
    for name in cn_names:
        write_wav(os.path.join(sfx_dir, f"{name}.wav"), clip_for(f"sfx_{name}"))
    print(f"wrote {len(cn_names)} one-shot files to {sfx_dir}")

    # Looping background tracks. Built from two whole cycles of a low chord so
    # the end meets the start exactly — a loop that ends on a decaying tail
    # clicks every time round, which is the one thing a placeholder must not
    # teach you to ignore.
    bgm_dir = os.path.join(OUT, "moooo")
    os.makedirs(bgm_dir, exist_ok=True)
    for name, root in (("bgm_base", 110.0), ("bgm_freespin", 146.83)):
        cycles = 8
        n = int(RATE * cycles / root) * 4
        samples = [
            0.10 * (math.sin(2 * math.pi * root * i / RATE) + 0.5 * math.sin(2 * math.pi * root * 1.5 * i / RATE))
            for i in range(n)
        ]
        write_wav(os.path.join(bgm_dir, f"{name}.wav"), samples)
    print(f"wrote 2 looping tracks to {bgm_dir}")


if __name__ == "__main__":
    main()
