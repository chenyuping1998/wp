"""Deterministic 44.1 kHz synthwave/arcade sound delivery for Go Bananeon.

Run: python design/build_neon_audio.py
The gorilla voice retains the project's existing generated formant performance;
the music and remaining effects are newly synthesized here.
"""

from __future__ import annotations

import math
import subprocess
import wave
from pathlib import Path

import numpy as np

SR = 44100
HERE = Path(__file__).parent
OUT = HERE / "source" / "neon_delivery" / "audio"
OLD = HERE.parent / "static" / "assets" / "audio" / "jungle"
OUT.mkdir(parents=True, exist_ok=True)
RNG = np.random.default_rng(20261003)
TAU = 2 * np.pi


def nsec(seconds: float) -> int:
    return round(seconds * SR)


def time(seconds: float) -> np.ndarray:
    return np.arange(nsec(seconds), dtype=np.float64) / SR


def env(length: int, attack: float = .005, release: float = .12, decay: float = 0.0) -> np.ndarray:
    x = np.arange(length, dtype=np.float64) / SR
    duration = length / SR
    a = np.minimum(1.0, x / max(attack, 1 / SR))
    r = np.minimum(1.0, (duration - x) / max(release, 1 / SR))
    return a * r * np.exp(-decay * x)


def osc(freq: float | np.ndarray, seconds: float, kind: str = "sine", phase: float = 0) -> np.ndarray:
    t = time(seconds)
    if np.isscalar(freq):
        p = TAU * float(freq) * t + phase
    else:
        p = TAU * np.cumsum(freq[: len(t)]) / SR + phase
    if kind == "sine":
        return np.sin(p)
    if kind == "square":
        return sum(np.sin(h * p) / h for h in (1, 3, 5, 7, 9)) * (4 / np.pi) * .65
    if kind == "saw":
        return sum(np.sin(h * p) / h for h in range(1, 10)) * .56
    if kind == "triangle":
        return sum(((-1) ** ((h - 1) // 2)) * np.sin(h * p) / (h * h) for h in (1, 3, 5, 7, 9)) * .83
    raise ValueError(kind)


def chirp(start: float, end: float, seconds: float, kind: str = "sine") -> np.ndarray:
    t = time(seconds)
    f = start * np.power(end / start, t / seconds)
    return osc(f, seconds, kind)


def noise(seconds: float, low: float = 0, high: float = SR / 2) -> np.ndarray:
    x = RNG.standard_normal(nsec(seconds))
    spectrum = np.fft.rfft(x)
    hz = np.fft.rfftfreq(len(x), 1 / SR)
    edge = 200.0
    if low > 0:
        spectrum *= np.clip((hz - low) / edge, 0, 1)
    if high < SR / 2:
        spectrum *= np.clip((high - hz) / edge, 0, 1)
    y = np.fft.irfft(spectrum, n=len(x))
    peak = np.max(np.abs(y)) or 1
    return y / peak


def add(dst: np.ndarray, src: np.ndarray, at: float = 0, gain: float = 1, pan: float = 0) -> None:
    start = nsec(at)
    if start >= len(dst) or start + len(src) <= 0:
        return
    a = max(0, start)
    b = min(len(dst), start + len(src))
    s = src[a - start : b - start] * gain
    if dst.ndim == 1:
        dst[a:b] += s
    else:
        angle = (pan + 1) * np.pi / 4
        dst[a:b, 0] += s * math.cos(angle)
        dst[a:b, 1] += s * math.sin(angle)


def delay(x: np.ndarray, seconds: float, gain: float) -> np.ndarray:
    y = x.copy()
    k = nsec(seconds)
    if k < len(x):
        y[k:] += x[:-k] * gain
    return y


def bell(freq: float, dur: float = 1.0, bright: float = 1) -> np.ndarray:
    t = time(dur)
    x = (
        np.sin(TAU * freq * t) * np.exp(-3.2 * t)
        + .55 * np.sin(TAU * freq * 2.01 * t) * np.exp(-5.5 * t)
        + .26 * bright * np.sin(TAU * freq * 3.92 * t) * np.exp(-8 * t)
    )
    return x * env(len(t), .001, .09)


def pluck(freq: float, dur: float = .5, kind: str = "triangle") -> np.ndarray:
    x = osc(freq, dur, kind) + .18 * osc(freq * 2, dur, "sine")
    return x * env(len(x), .002, .08, 8 / max(dur, .1))


def synth_note(freq: float, dur: float, kind: str = "square", attack: float = .008, release: float = .09) -> np.ndarray:
    x = osc(freq, dur, kind)
    if kind in ("square", "saw"):
        x += .11 * osc(freq * 1.003, dur, kind)
    return x * env(len(x), attack, release, .5)


def bass(freq: float, dur: float = .33, funky: bool = False) -> np.ndarray:
    t = time(dur)
    f = freq * (1 + .18 * np.exp(-32 * t))
    x = osc(f, dur, "saw") * .55 + osc(freq, dur, "sine") * .45
    if funky:
        x += .24 * osc(freq * 2, dur, "triangle")
    return x * env(len(t), .002, .08, 7 if funky else 4)


def kick(dur: float = .34) -> np.ndarray:
    t = time(dur)
    f = 47 + 112 * np.exp(-33 * t)
    x = osc(f, dur) * np.exp(-13 * t)
    x += noise(dur, 2500, 9000) * .11 * np.exp(-95 * t)
    return x * env(len(t), .001, .025)


def snare(dur: float = .24, gated: bool = True) -> np.ndarray:
    t = time(dur)
    x = noise(dur, 600, 11000) * np.exp(-(17 if gated else 11) * t)
    x += .36 * osc(185, dur) * np.exp(-22 * t)
    return x * env(len(t), .001, .015)


def hat(dur: float = .11) -> np.ndarray:
    t = time(dur)
    return noise(dur, 4500, 15000) * np.exp(-55 * t) * env(len(t), .0006, .009)


def thump(dur: float = .5, freq: float = 90) -> np.ndarray:
    t = time(dur)
    x = chirp(freq * 2.3, freq, dur) * np.exp(-8 * t)
    x += .17 * noise(dur, 80, 700) * np.exp(-16 * t)
    return x * env(len(t), .001, .045)


def sparkles(dur: float, count: int = 7, low: float = 650, high: float = 1800) -> np.ndarray:
    out = np.zeros(nsec(dur))
    for i in range(count):
        at = (i / max(count, 1)) * max(0, dur - .15)
        freq = low + (high - low) * (i / max(count - 1, 1))
        add(out, bell(freq, min(.4, dur - at)), at, .65)
    return out


def pulse_blast(dur: float, big: bool = False) -> np.ndarray:
    x = np.zeros(nsec(dur))
    add(x, thump(min(.75, dur), 72 if big else 105), 0, 1.0)
    length = min(.85, dur)
    t = time(length)
    zap = chirp(1600 if big else 1250, 130 if big else 210, length, "saw")
    add(x, zap * np.exp(-7 * t), .015, .42)
    add(x, noise(min(dur, 1.0), 650, 9000) * env(nsec(min(dur, 1.0)), .001, .14, 4), .01, .28)
    if big:
        add(x, chirp(120, 50, 1.0) * env(nsec(1.0), .001, .18, 3), .06, .43)
        add(x, sparkles(min(dur - .25, .9), 9), .25, .26)
    return x


def normalize(x: np.ndarray, peak: float = .78, edge_ms: float = 2) -> np.ndarray:
    x = np.asarray(x, dtype=np.float64).copy()
    if edge_ms:
        k = min(len(x) // 2, nsec(edge_ms / 1000))
        ramp = np.linspace(0, 1, k, endpoint=False)
        if x.ndim == 2:
            ramp = ramp[:, None]
        x[:k] *= ramp
        x[-k:] *= ramp[::-1]
    m = float(np.max(np.abs(x))) or 1
    x *= min(1, peak / m) if m < peak * .25 else peak / m
    return np.clip(x, -.9, .9)


def write(name: str, x: np.ndarray, peak: float = .78, edge_ms: float = 2) -> None:
    x = normalize(x, peak, edge_ms)
    channels = 1 if x.ndim == 1 else x.shape[1]
    pcm = np.round(x * 32767).astype("<i2")
    path = OUT / name
    with wave.open(str(path), "wb") as w:
        w.setnchannels(channels)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())
    print(f"{name:25} {len(x) / SR:5.2f}s  {channels}ch")


def note(name: str) -> float:
    names = {"C": 0, "C#": 1, "D": 2, "D#": 3, "E": 4, "F": 5, "F#": 6, "G": 7, "G#": 8, "A": 9, "A#": 10, "B": 11}
    octave = int(name[-1])
    semitone = names[name[:-1]]
    return 440 * 2 ** ((12 * (octave + 1) + semitone - 69) / 12)


def pad_chord(notes: list[str], dur: float) -> np.ndarray:
    x = np.zeros(nsec(dur))
    for i, n in enumerate(notes):
        f = note(n)
        x += .34 * osc(f, dur, "saw", i * .7) + .18 * osc(f * .998, dur, "triangle")
    return x * env(len(x), .13, .24, .10)


def music(fast: bool) -> np.ndarray:
    bpm = 128 if fast else 105
    beat = 60 / bpm
    bars = 16
    dur = bars * 4 * beat
    out = np.zeros((nsec(dur), 2), dtype=np.float64)
    progression = [
        (["A3", "C4", "E4", "G4"], "A2"),
        (["F3", "A3", "C4", "E4"], "F2"),
        (["C3", "E3", "G3", "B3"], "C3"),
        (["G3", "B3", "D4", "F4"], "G2"),
    ]
    motif_main = ["A4", "C5", "E5", "G5", "E5", "D5", "C5", "A4", "C5", "D5", "E5", "C5", "B4", "G4", "A4", "E5"]
    motif_fast = ["A4", "C5", "E5", "A5", "G5", "E5", "C5", "E5", "F5", "A5", "C6", "A5", "G5", "E5", "D5", "C5"]
    for bar in range(bars):
        bar_time = bar * 4 * beat
        chord, root = progression[bar % 4]
        add(out, pad_chord(chord, 4 * beat + .18), bar_time, .25 if fast else .33, -.28 if bar % 2 else .28)
        # LinnDrum/808-style four-beat groove.
        for b in range(4):
            at = bar_time + b * beat
            add(out, kick(), at, .55 if fast else .48, 0)
            if b in (1, 3):
                add(out, snare(), at, .44 if fast else .37, -.12)
            if fast and b in (0, 2):
                add(out, snare(.17), at + .75 * beat, .12, .2)
        for h in range(8):
            add(out, hat(), bar_time + h * beat / 2, .16 if fast else .12, -.3 if h % 2 else .3)
        # Funky slap bass in main; driving eighths in free spins.
        for b in range(8 if fast else 6):
            if not fast and b in (3, 5):
                continue
            at = bar_time + b * beat / 2
            f = note(root)
            if b in (3, 7):
                f *= 1.5
            add(out, bass(f, .27 if fast else .38, funky=not fast), at, .25 if fast else .31, .05)
        motif = motif_fast if fast else motif_main
        if bar % 4 == 3:
            motif = motif[8:] + motif[:8]
        for k in range(8):
            pitch = note(motif[(bar % 2) * 8 + k])
            if not fast and k in (2, 6):
                continue
            sound = synth_note(pitch, .27 if fast else .37, "saw" if fast else "square", .004, .08)
            at = bar_time + k * beat / 2
            add(out, sound, at, .17 if fast else .15, -.16 if k % 2 else .16)
            if fast and k in (0, 4):
                add(out, synth_note(pitch * 2, .3, "triangle"), at, .055, .4)
    # Wrap short phrase tails, then microfade the exact edge for click-free loops.
    return out


def make_music() -> None:
    write("bgm_main.wav", music(False), .68, 5)
    write("bgm_freespin.wav", music(True), .72, 5)


def make_sfx() -> None:
    # UI and reels.
    write("btn.wav", pluck(1480, .08, "square") + .23 * noise(.08, 2500, 12000) * env(nsec(.08), .0005, .03, 40), .58)
    x = np.zeros(nsec(.5)); add(x, chirp(230, 1600, .42, "saw") * env(nsec(.42), .004, .06, 1.2), 0, .55); add(x, noise(.36, 1200, 9000) * env(nsec(.36), .004, .08, 4), 0, .14); write("spin.wav", x)
    x = np.zeros(nsec(.16)); add(x, thump(.16, 160), 0, .7); add(x, bell(1400, .11), .01, .28); write("reel_stop.wav", x)
    t = time(2.0); x = chirp(160, 1800, 2.0, "saw") * (.18 + .17 * np.sin(TAU * 8 * t)) * env(len(t), .01, .12); x += noise(2.0, 900, 7000) * np.linspace(0, .18, len(t)); write("reel_tension.wav", x)
    write("pluck_low.wav", delay(pluck(220, .9), .11, .24), .5)
    x = sparkles(1.25, 9, 700, 1900) + .25 * chirp(500, 2200, 1.25, "triangle") * env(nsec(1.25), .005, .22); write("symbol_reveal.wav", x)

    # Scatter is one bell family transposed through C D E G C.
    for i, pitch in enumerate(["C5", "D5", "E5", "G5", "C6"], 1):
        x = bell(note(pitch), 1.0)
        x += .19 * bell(note(pitch) * 2, 1.0)
        if i == 5:
            x += .14 * sparkles(1.0, 5, 1200, 2300)
        write(f"scatter_{i}.wav", x, .68)

    # Pulse bomb and Overdrive ladder.
    x = noise(.38, 1200, 11500) * env(nsec(.38), .001, .11, 2)
    x *= .63 + .37 * np.sin(TAU * 83 * time(.38))
    write("fuse_sizzle.wav", x, .58)
    write("dynamite_blast.wav", pulse_blast(1.3), .78)
    write("dynamite_blast_big.wav", pulse_blast(1.5, True), .82)
    x = np.zeros(nsec(1.0))
    for j in range(7):
        add(x, bell(2200 + 220 * j, .32), j * .072, .23)
    add(x, noise(.65, 1800, 15000) * env(nsec(.65), .001, .2, 4), 0, .32)
    write("symbol_shatter.wav", x)
    x = noise(1.1, 300, 7500) * env(nsec(1.1), .001, .2, 2)
    x += .24 * chirp(1100, 180, 1.1) * env(nsec(1.1), .001, .2, 3)
    write("smoke_puff.wav", x, .56)
    write("press_blast.wav", thump(.7, 65) + .2 * chirp(350, 55, .7) * env(nsec(.7), .001, .14), .75)
    x = np.zeros(nsec(1.1)); add(x, bell(660, .23), 0, .45); add(x, chirp(440, 1320, .85, "saw") * env(nsec(.85), .003, .11), .09, .46); add(x, bell(1320, .4), .7, .35); write("ladder_up.wav", x)

    x = np.zeros(nsec(1.3))
    for j in range(5):
        add(x, chirp(500 + j * 180, 1300 + j * 330, .25, "saw") * env(nsec(.25), .002, .09), j * .19, .43)
        add(x, thump(.25, 150 + j * 30), j * .19, .16)
    write("fullboard_chain.wav", x)
    x = np.zeros(nsec(2.2)); add(x, pulse_blast(1.5, True), 0, .72)
    for f in [note("A3"), note("E4"), note("A4"), note("C5")]:
        add(x, synth_note(f, 2.2, "saw", .003, .3), 0, .2)
    add(x, sparkles(1.5, 10), .55, .2); write("fullboard_stamp.wav", x, .82)

    # Feature entrance.
    x = np.zeros(nsec(3.0)); add(x, thump(.8, 55), 0, .8)
    for f in [note("A3"), note("C4"), note("E4"), note("A4")]:
        add(x, synth_note(f, 3.0, "saw", .002, .45), 0, .22)
    add(x, chirp(350, 2400, 1.7, "saw") * env(nsec(1.7), .01, .18), .1, .19)
    write("gong_feature.wav", x, .83)
    x = np.zeros(nsec(2.4))
    for at, pitch in [(0,"A4"),(.31,"C5"),(.62,"E5"),(.93,"A5"),(1.28,"G5"),(1.62,"A5")]:
        add(x, synth_note(note(pitch), .7, "saw"), at, .45)
    add(x, snare(.28), 1.91, .22); write("fs_intro.wav", x)
    t = time(3.3); x = osc(47 + 5 * np.sin(TAU * 3.2 * t), 3.3) * env(len(t), .002, .23, .25)
    x += noise(3.3, 30, 320) * (.2 + .15 * np.sin(TAU * 6 * t)) * env(len(t), .001, .3)
    write("cave_quake.wav", x, .7)

    # Win sweeps and plaques.
    for name, dur, high in [("win_gliss.wav",1.3,1900),("win_gliss_big.wav",3.0,2700)]:
        x = chirp(380, high, dur, "triangle") * env(nsec(dur), .003, .17, .3)
        x += sparkles(dur, 11 if dur > 2 else 6, 900, 2100) * .32
        if dur > 2:
            x += noise(dur, 1400, 12000) * np.linspace(0, .23, nsec(dur)) * env(nsec(dur), .01, .18)
        write(name, x, .7)
    x = np.zeros(nsec(2.1)); add(x, bell(880,.8),0,.5); add(x,bell(1108,.8),.15,.44); add(x,bell(1320,1.4),.32,.5); write("win_panel.wav",x)
    fanfare = [(0,"A4"),(.34,"C5"),(.68,"E5"),(1.02,"A5"),(1.44,"G5"),(1.78,"A5")]
    for level,(name,dur) in enumerate([("win_big.wav",2.7),("win_super.wav",3.3),("win_mega.wav",3.9),("win_epic.wav",4.5),("win_max.wav",5.1)],1):
        x = np.zeros(nsec(dur))
        for at,pitch in fanfare:
            if at >= dur-.3: continue
            add(x,synth_note(note(pitch),min(.82,dur-at),"saw"),at,.36)
            if level>=2: add(x,synth_note(note(pitch)/2,min(.9,dur-at),"square"),at,.12)
        for j in range(level):
            at = 1.9 + j * .42
            if at < dur-.12: add(x,bell(note(["C5","E5","G5","A5","C6"][j]),min(.9,dur-at)),at,.24)
        if level>=3:
            add(x,sparkles(dur-1.5,6+level*2,950,2600),1.5,.13)
        if level>=4:
            for f in [note("A3"),note("C4"),note("E4")]: add(x,synth_note(f,dur,"triangle",.07,.3),0,.1)
        if level==5:
            add(x,chirp(450,2700,1.4,"saw")*env(nsec(1.4),.003,.12),2.7,.14)
        for j in range(min(level+1,5)):
            at = .04 + j*.14
            add(x,snare(.24),at,.10+.015*level)
        write(name,x,.74+level*.017)
    x = np.zeros(nsec(3.8))
    for at,pitch in [(0,"A4"),(.36,"C5"),(.72,"E5"),(1.08,"A5"),(1.44,"C6")]:
        add(x,synth_note(note(pitch),1.7,"saw"),at,.36)
    for f in [note("A3"),note("E4"),note("A4")]: add(x,synth_note(f,2.3,"triangle",.01,.4),1.5,.16)
    write("win_cap.wav",x,.82)
    x=np.zeros(nsec(2.4)); add(x,pulse_blast(1.6,True),0,.7); add(x,sparkles(1.8,10),.45,.3); write("bigwin_blast.wav",x)
    x=np.zeros(nsec(2.4))
    for j in range(18): add(x,bell(650+(j%7)*190,.65),j*.095,.23)
    write("coin_shimmer.wav",x,.62)
    x=np.zeros(nsec(2.6)); add(x,noise(1.0,600,6500)*env(nsec(1.0),.001,.25),0,.27)
    add(x,chirp(250,1900,1.6,"saw")*env(nsec(1.6),.003,.2),.1,.38); add(x,bell(1320,.8),1.55,.3)
    write("wild_expand.wav",x)
    x=np.zeros(nsec(.7)); add(x,pluck(880,.36,"square"),0,.46); add(x,pluck(1320,.5,"square"),.12,.42); write("mult_update.wav",x)
    write("grenade_blast.wav",pulse_blast(.72),.71)


def preserve_voice() -> None:
    # Existing synthetic formant gorilla calls carry the character's identity.
    for name in ["voice_roar.wav", "voice_effort.wav"]:
        with wave.open(str(OLD/name),"rb") as w:
            assert w.getframerate()==SR and w.getsampwidth()==2
            raw=w.readframes(w.getnframes())
            channels=w.getnchannels()
        x=np.frombuffer(raw,dtype="<i2").astype(np.float64).reshape(-1,channels).mean(axis=1)/32768
        # Move the first audible formant to the trigger without changing clip length.
        onset=np.flatnonzero(np.abs(x)>.005)
        if len(onset):
            shift=max(0,int(onset[0])-nsec(.001))
            if shift:
                x=np.pad(x[shift:],(0,shift))
        # Very light oscillator sheen, leaving the throat/formants audible.
        t=np.arange(len(x))/SR
        x=x*(.94+.06*np.sin(TAU*31*t))
        write(name,x,.78)
    # The legacy MP3 is about 4.4 s; rebuild the required six hoots at 1.8 s.
    with wave.open(str(OUT/"voice_roar.wav"),"rb") as w:
        roar=np.frombuffer(w.readframes(w.getnframes()),dtype="<i2").astype(np.float64)/32768
    x=np.zeros(nsec(1.8))
    for i in range(6):
        source_at=nsec(.46+i*.30)
        hoot=roar[source_at:source_at+nsec(.22)].copy()
        hoot*=env(len(hoot),.004,.055)
        at=i*.285
        add(x,hoot,at,.86)
        add(x,thump(.18,100+i*3),at,.13)
    temp=OUT/"monkey_expand_encode.wav"
    write(temp.name,x,.75)
    try:
        import imageio_ffmpeg
        encoder=imageio_ffmpeg.get_ffmpeg_exe()
        subprocess.run(
            [encoder,"-y","-loglevel","error","-i",str(temp),"-codec:a","libmp3lame","-qscale:a","2","-ar","44100","-ac","1",str(OUT/"monkey_expand.mp3")],
            check=True,
        )
    finally:
        temp.unlink(missing_ok=True)
    print("monkey_expand.mp3         1.80s, six gorilla hoots")


if __name__ == "__main__":
    make_music()
    make_sfx()
    preserve_voice()
