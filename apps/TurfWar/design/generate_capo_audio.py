"""Build Capo Nostra's deterministic 1930s crime-jazz sound package.

The assets are synthesis-first so the repository has reproducible, royalty-free
masters.  They deliberately use dry upright bass, brushed drums, muted brass,
vibraphone and mechanical Foley instead of Hot Miami's synthwave palette.
"""

from pathlib import Path
import math
import subprocess
import wave

import numpy as np

SR = 44100
ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "static/assets/audio/capo"
SFX = OUT / "sfx"
RNG = np.random.default_rng(19331205)


def axis(seconds):
    return np.arange(round(seconds * SR)) / SR


def envelope(n, attack=.004, release=.2, power=2.0):
    a = min(n, max(1, round(attack * SR)))
    out = np.ones(n)
    out[:a] = np.linspace(0, 1, a) ** .7
    r = min(n - a, max(1, round(release * SR)))
    out[-r:] *= np.linspace(1, 0, r) ** power
    return out


def osc(freq, t, harmonics=(1, .35, .15), phase=0):
    f = np.asarray(freq)
    p = 2 * np.pi * (np.cumsum(f) / SR if f.ndim else f * t) + phase
    return sum(amp * np.sin((i + 1) * p) for i, amp in enumerate(harmonics))


def noise_band(n, low, high):
    spec = np.fft.rfft(RNG.normal(0, 1, n))
    hz = np.fft.rfftfreq(n, 1 / SR)
    spec *= (hz >= low) & (hz <= high)
    return np.fft.irfft(spec, n)


def room(x, taps=((.055, .24), (.093, .14), (.141, .08))):
    y = x.copy()
    for delay, gain in taps:
        d = round(delay * SR)
        y[d:] += x[:-d] * gain
    return y


def pitch(midi):
    return 440 * 2 ** ((midi - 69) / 12)


def bass_note(midi, seconds=.34):
    t = axis(seconds)
    f = pitch(midi) * (1 + .012 * np.exp(-t * 25))
    pluck = osc(f, t, (1, .52, .24, .12))
    finger = noise_band(len(t), 900, 3500) * np.exp(-t * 45) * .18
    return (pluck + finger) * envelope(len(t), .002, seconds * .9, 1.7)


def piano_note(midi, seconds=.55):
    t = axis(seconds)
    tone = osc(pitch(midi), t, (1, .42, .18, .08))
    hammer = noise_band(len(t), 1300, 6000) * np.exp(-t * 55) * .09
    return (tone * np.exp(-t * 4.8) + hammer) * envelope(len(t), .002, .12)


def brass_note(midi, seconds=.6, mute=True):
    t = axis(seconds)
    vib = 1 + .004 * np.sin(2 * np.pi * 5.1 * t)
    harmonics = (1, .5, .22, .09) if mute else (1, .65, .38, .2, .1)
    return osc(pitch(midi) * vib, t, harmonics) * envelope(len(t), .035, .22, 1.5)


def mix_at(length, events):
    out = np.zeros(round(length * SR))
    for start, sound, gain in events:
        i = round(start * SR)
        n = min(len(sound), len(out) - i)
        if n > 0:
            out[i:i+n] += sound[:n] * gain
    return out


def stereo(mono, width=.008):
    d = round(width * SR)
    left = mono.copy()
    right = np.concatenate((np.zeros(d), mono[:-d])) if d else mono.copy()
    return np.column_stack((left, right))


def write_wav(path, audio, peak=.88, fade=True):
    path.parent.mkdir(parents=True, exist_ok=True)
    if audio.ndim == 1:
        audio = stereo(audio)
    audio = np.nan_to_num(audio - np.mean(audio, axis=0))
    if fade:
        n = min(round(.012 * SR), len(audio) // 2)
        audio[:n] *= np.linspace(0, 1, n)[:, None]
        audio[-n:] *= np.linspace(1, 0, n)[:, None]
        audio -= np.mean(audio, axis=0)
    audio *= peak / max(1e-9, np.max(np.abs(audio)))
    pcm = np.int16(np.clip(audio, -1, 1) * 32767)
    with wave.open(str(path), "wb") as handle:
        handle.setparams((2, 2, SR, 0, "NONE", "not compressed"))
        handle.writeframes(pcm.tobytes())
    print(f"{path.relative_to(ROOT)}  {len(audio)/SR:.2f}s")


def click():
    t = axis(.11)
    return (osc(np.linspace(1050, 420, len(t)), t, (1, .3)) + noise_band(len(t), 1800, 8000) * .15) * envelope(len(t), .001, .1, 4)


def reel_stop():
    t = axis(.105)
    wood = osc(np.linspace(145, 82, len(t)), t, (1, .22)) * np.exp(-t * 36)
    felt = noise_band(len(t), 700, 3200) * np.exp(-t * 55) * .07
    return room((wood + felt) * .62, ((.027, .1),))


def spin():
    t = axis(.52)
    brush = noise_band(len(t), 350, 7000) * envelope(len(t), .008, .44, 1.6)
    ratchet = np.zeros(len(t))
    for at in np.linspace(.04, .45, 9):
        i = round(at * SR); c = click() * .18; ratchet[i:i+min(len(c),len(t)-i)] += c[:len(t)-i]
    return brush * .38 + ratchet


def scatter(level):
    chord = [60, 63, 67, 70, 72][level - 1]
    return room(mix_at(.7, [(0, piano_note(chord), .7), (.025, brass_note(chord+12, .5), .35)]))


def gliss(big=False):
    notes = ([60, 63, 67, 70, 72, 75, 79] if big else [60, 63, 67, 72])
    step = .085
    return room(mix_at(step * len(notes) + .5, [(i*step, piano_note(n, .45), .55) for i,n in enumerate(notes)] + ([(.12, brass_note(72, .7, False), .4)] if big else [])))


def gunfire():
    events = []
    for i, at in enumerate((0, .072, .143, .218, .292, .37)):
        t = axis(.22)
        crack = noise_band(len(t), 450, 12000) * np.exp(-t * 42)
        thump = osc(np.linspace(125, 55, len(t)), t, (1, .25)) * np.exp(-t * 25)
        events.append((at, room(crack*.7 + thump, ((.048,.24),(.11,.12))), .92-i*.025))
    return mix_at(.78, events)


def frame_hit():
    t = axis(.72)
    slam = osc(np.linspace(105, 39, len(t)), t, (1,.45,.2)) * np.exp(-t*9)
    latch = noise_band(len(t), 500, 5000) * np.exp(-t*30) * .22
    return room(slam + latch, ((.06,.28),(.13,.15),(.24,.08)))


def vault_open():
    t = axis(1.65); out = np.zeros(len(t))
    rumble = noise_band(len(t), 35, 430) * envelope(len(t), .06, .3) * .28
    out += rumble
    for at in (.08,.21,.34,.57):
        i=round(at*SR); c=reel_stop()*.65; out[i:i+min(len(c),len(out)-i)] += c[:len(out)-i]
    scrape = noise_band(len(t), 180, 2600) * envelope(len(t), .52, .36) * .18
    out += scrape
    return room(out, ((.09,.22),(.19,.13)))


def tension():
    length=2.4; events=[]
    times=np.cumsum(np.linspace(.24,.105,15)); times=times[times<length]
    for i,at in enumerate(times): events.append((at,bass_note(38 + (i%2)*5,.24),.55+i*.018))
    brushed=noise_band(round(length*SR),2800,9500) * (.05 + .04*np.sin(2*np.pi*4*axis(length)))
    return mix_at(length,events)+brushed


def jazz_loop(feature=False):
    bpm=132 if feature else 116; beat=60/bpm; bars=8; length=bars*4*beat
    bass_roots=[36,41,38,43,36,41,43,36]; events=[]
    for bar,root in enumerate(bass_roots):
        start=bar*4*beat
        walk=[root,root+4,root+7,root+9 if bar%2==0 else root+10]
        for j,n in enumerate(walk): events.append((start+j*beat,bass_note(n,beat*.8),.42))
        chord=[root+24,root+27,root+31,root+34]
        for j in (1,3):
            for n in chord: events.append((start+j*beat,piano_note(n,beat*.65),.12))
        if feature or bar in (1,3,6):
            for n in (root+31,root+34): events.append((start+(2.5 if feature else 3)*beat,brass_note(n,beat*.8),.13))
    mono=mix_at(length,events)
    n=len(mono); brushes=noise_band(n,2800,11000)*.035
    for i in range(bars*8):
        at=round(i*beat/2*SR); dur=min(round(.075*SR),n-at)
        brushes[at:at+dur] += noise_band(dur,3500,13000)*np.linspace(1,0,dur)*.06
    return stereo(mono+brushes,.011)


def main():
    simple = {
        "btn": click(), "spin": spin(), "reel_stop": reel_stop(), "reel_tension": tension(),
        "pluck_low": bass_note(36,.5), "win_gliss": gliss(), "win_gliss_big": gliss(True),
        "wild_expand": gunfire(), "sw_gunfire": gunfire(), "frame_big_land": frame_hit(),
        "vault_open": vault_open(), "neon_zap": vault_open(), "mult_update": scatter(2),
        "coin_shimmer": room(mix_at(1.25, [(i*.075,piano_note(84+(i%4)*3,.25),.22) for i in range(12)])),
        "gong_feature": room(mix_at(2.2, [(0,vault_open(),.7),(.68,brass_note(60,1.4,False),.4),(.7,brass_note(67,1.4,False),.35)])),
        "fs_intro": room(mix_at(2.0, [(0,vault_open(),.55),(.62,gliss(True),.7)])),
        "fs_outro": room(mix_at(1.45, [(0,piano_note(48,1.2),.5),(.18,brass_note(55,1.0),.3)])),
        "win_cap": room(mix_at(1.1, [(0,piano_note(72,.8),.6),(0,brass_note(60,.9,False),.45)])),
        "bigwin_blast": room(mix_at(1.8, [(0,brass_note(n,1.5,False),.42) for n in (60,64,67,70)] + [(0,frame_hit(),.5)])),
    }
    for i in range(1,6): simple[f"scatter_{i}"]=scatter(i)
    for name,audio in simple.items(): write_wav(SFX/f"{name}.wav",audio)
    write_wav(OUT/"bgm_base.wav",jazz_loop(False),peak=.78)
    write_wav(OUT/"bgm_feature.wav",jazz_loop(True),peak=.8)
    # Convenient brief-compatible top-level masters.
    write_wav(OUT/"FeatureTrigger.wav",simple["fs_intro"])
    # Keep the brief's legacy top-level filenames current for external reviewers.
    write_wav(ROOT/"static/assets/audio/bigwin_blast.wav",simple["bigwin_blast"])
    write_wav(ROOT/"static/assets/audio/reel_tension.wav",simple["reel_tension"])
    for wav_name in ("bgm_base", "bgm_feature", "FeatureTrigger"):
        src=OUT/f"{wav_name}.wav"; dst=OUT/f"{wav_name}.m4a"
        subprocess.run(["afconvert","-f","m4af","-d","aac","-b","192000",str(src),str(dst)],check=True)


if __name__ == "__main__":
    main()
