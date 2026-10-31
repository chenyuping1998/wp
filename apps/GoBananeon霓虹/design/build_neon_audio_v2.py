"""Original Neon audio direction: playful turntablism / tight club drops.

No sampled game audio. Everything here is deterministic oscillator, filtered
noise or modal synthesis. Run alone to refresh the 41 redesigned deliveries;
build_neon_audio.py also calls refresh() after preserving the mascot voice.
"""
from __future__ import annotations

import hashlib
import json
import math
import shutil
import wave
from pathlib import Path

import numpy as np
import build_neon_audio as s

SR = s.SR
TAU = s.TAU
OUT = s.OUT
LIVE = s.HERE.parent / "static/assets/audio/neon"
PREVIEW = s.HERE / "source/neon_delivery/audio_preview"
RNG = np.random.default_rng(20261024)
DELIVERY: dict[str, np.ndarray] = {}


def band(dur, low=0, high=10000):
    """Band limited noise with soft FFT edges; DC is always removed."""
    n = s.nsec(dur)
    hz = np.fft.rfftfreq(n, 1 / SR)
    spec = np.fft.rfft(RNG.standard_normal(n))
    spec *= np.clip((hz - max(low, 22)) / max(50, low * .25), 0, 1)
    spec *= np.clip((high - hz) / max(200, high * .16), 0, 1)
    out = np.fft.irfft(spec, n=n)
    return out / max(.001, np.sqrt(np.mean(out * out))) * .24


def modal(f, dur=.5, decay=8, metal=.3):
    t = s.time(dur)
    out = np.zeros(len(t))
    for i, ratio in enumerate([1, 2.002, 2.76, 4.11, 5.43]):
        out += np.sin(TAU * f * ratio * t + .08 * i) * np.exp(-decay * (1 + i * .42) * t) * (1 if i == 0 else metal / i)
    return out * s.env(len(t), .0005, .06)


def air(dur, start=1800, end=5500, fall=6):
    t = s.time(dur)
    return (band(dur, 450, 8500) + .18 * s.chirp(start, end, dur)) * s.env(len(t), .002, .10, fall)


def debris(dur=.68, density=13):
    out = np.zeros(s.nsec(dur))
    for i in range(density):
        at = .006 + (i / density) ** 1.25 * (dur - .18) + float(RNG.uniform(0, .008))
        length = min(.15, dur - at)
        f = float(RNG.uniform(1100, 4200))
        grain = modal(f, length, 35, .28) + .2 * band(length, 1800, 9000) * s.env(s.nsec(length), .0005, .015, 55)
        s.add(out, grain, at, .27 * (1 - at / dur) ** 1.6)
    return out


def impact(dur=1.15, size=1):
    """Transient / phone body / sub / energy snap / gated room, separately voiced."""
    out = np.zeros(s.nsec(dur))
    t = s.time(dur)
    # The midbody (170-850 Hz) carries impact on phone speakers. The sub is
    # supportive, never the only indication that a detonation happened.
    subfreq = 45 + 100 * np.exp(-36 * t)
    sub = s.osc(subfreq, dur) * np.exp(-10.5 * t)
    phone = (s.chirp(420, 115, dur) + .31 * s.chirp(810, 230, dur)) * np.exp(-17 * t)
    crack = band(dur, 1100, 9200) * (np.exp(-115 * t) + .25 * np.exp(-29 * t))
    core = s.chirp(1700, 160, dur) * np.exp(-22 * t)
    out += (.43 * sub + .49 * phone + .76 * crack + .21 * core) * s.env(len(t), .00035, .1)
    s.add(out, modal(265, min(dur, .24), 22, .48), .006, .20)
    # Low resonant aftershock is 24ms later, creating scale without delaying the
    # first transient. A full-board hit adds a second, lower shell.
    s.add(out, modal(98 if size == 1 else 73, min(dur, .66), 8, .34), .024, .24 if size == 1 else .36)
    s.add(out, air(min(dur - .06, .72), 1700, 420, 8), .045, .14 if size == 1 else .23)
    if size > 1:
        s.add(out, modal(48, .9, 7, .55), .07, .24)
        s.add(out, debris(min(.84, dur - .1), 18), .085, .27)
        # Brief room taps, no wash under the replacement symbols.
        out = s.delay(s.delay(out, .031, .14), .057, .08)
    return np.tanh(out * 1.18) / 1.18


def electric_note(f, dur=.5, power=1):
    t = s.time(dur)
    phase = TAU * f * t + .9 * np.exp(-18 * t) * np.sin(TAU * f * 2 * t)
    x = np.sin(phase) + .20 * np.sin(phase * 2.001) * np.exp(-13 * t)
    return x * s.env(len(t), .001, .08, 5.5 / dur) * power


def brass(f, dur=.44):
    t = s.time(dur)
    x = sum(np.sin(TAU * f * (1 + (.001 if i % 2 else -.001)) * i * t) / i ** 1.5 * np.exp(-i * 1.6 * t) for i in range(1, 9))
    return x * s.env(len(t), .005, .13, 1.5)


def sampler_stab(root=220, dur=.22, bright=.34):
    """Short minor-seventh sampler pad; no long laser or sci-fi sweep."""
    t = s.time(dur)
    out = np.zeros(len(t))
    for i, ratio in enumerate([1, 1.189207, 1.498307, 1.781797]):
        phase = TAU * root * ratio * t
        out += (np.sin(phase) + bright*np.sin(phase*2)*np.exp(-18*t) + .10*np.sin(phase*3)) / (1+i*.45)
    return np.tanh(out*.7) * s.env(len(t), .0015, .045, 12)


def bass_hit(f=110, dur=.19):
    t=s.time(dur)
    phase=TAU*np.cumsum(f*(1+.13*np.exp(-60*t)))/SR
    out=np.sin(phase)+.28*np.sin(2*phase)+.15*np.sin(3*phase)
    return np.tanh(out*1.2)*s.env(len(t),.0015,.035,11)


def bass_fill(dur=.55):
    out=np.zeros(s.nsec(dur))
    for at,f,gain in [(0,110,.65),(.12,110,.38),(.24,164.813,.42),(.36,82.407,.56)]:
        if at<dur-.03: s.add(out,bass_hit(f,min(.18,dur-at)),at,gain)
    return out


def scratch(dur=.38, strokes=4, cuts=True, reverse_first=False):
    """Scratch an original 'record' grain by moving its playback position.

    Forward/reverse resampling creates the wicka articulation, rather than
    imitating it with a rising oscillator. A shaped crossfader mutes direction
    changes and cuts each stroke; the groove noise follows record speed.
    """
    record_dur=.7
    rt=s.time(record_dur)
    grain=np.zeros(len(rt))
    for harmonic in range(1,33):
        hz=165*harmonic
        # Lighter pitched grain: raise the original record 7 semitones and move
        # its vowel resonance upward, avoiding the old chesty low-mid growl.
        formant=.35*np.exp(-((hz-920)/360)**2)+.34*np.exp(-((hz-1860)/450)**2)+.16*np.exp(-((hz-3300)/620)**2)
        grain+=np.sin(TAU*hz*rt+.16*harmonic)*(formant+.10)/harmonic**.48
    grain*=.72+.28*np.sin(TAU*6.3*rt+.4)
    grain+=.035*band(record_dur,1500,6200)
    grain/=max(.01,float(np.max(np.abs(grain))))
    t=s.time(dur)
    pos=np.zeros(len(t)); gate=np.zeros(len(t)); speed=np.zeros(len(t))
    # A longer forward pull followed by a shorter return produces a recognisable
    # question/answer. Tiny 2ms fader ramps avoid artificial digital clicks.
    weights=np.array([1.12 if i%2==0 else .88 for i in range(strokes)])
    bounds=np.r_[0,np.cumsum(weights/weights.sum()*dur)]
    for i in range(strokes):
        section=(t>=bounds[i])&(t<bounds[i+1]); local=t[section]-bounds[i]; length=bounds[i+1]-bounds[i]
        u=local/length; eased=u*u*(3-2*u)
        forward=(i%2==0)!=reverse_first
        start,end=(.17,.39) if forward else (.39,.17)
        pos[section]=start+(end-start)*eased
        speed[section]=np.abs((end-start)*6*u*(1-u)/length)
        fader=np.minimum(1,local/.0025)*np.minimum(1,(length-local)/.006)
        if cuts:
            # Crossfader chirp/transformer cuts: two clean gaps during each pull.
            for a,b in [(.32,.40),(.68,.75)]:
                gap=np.minimum(np.clip((u-a)*length/.002,0,1),np.clip((b-u)*length/.002,0,1))
                fader*=1-gap
        gate[section]=fader
    record=np.interp(pos*SR,np.arange(len(grain)),grain)
    friction=band(dur,2200,7800)*np.minimum(1,speed/2)*.045
    out=(record+friction)*gate*s.env(len(t),.001,.008)
    # Playback reversals slow down through bass frequencies. Remove that rumble
    # after resampling while keeping a clear, soft-edged wicka rhythm.
    hz=np.fft.rfftfreq(len(out),1/SR)
    spectrum=np.fft.rfft(out)
    spectrum*=np.clip((hz-260)/180,0,1)
    spectrum*=np.clip((8500-hz)/1600,0,1)
    out=np.fft.irfft(spectrum,n=len(out))
    out*=s.env(len(out),.001,.008)
    return out


def dj_drop(dur=1.10, full=False):
    out=np.zeros(s.nsec(dur))
    s.add(out,impact(dur,2 if full else 1),0,.62)
    s.add(out,s.kick(.26),0,.28)
    s.add(out,sampler_stab(220,.20,.42),.006,.30 if full else .25)
    if full:
        s.add(out,bass_fill(.55),.105,.27)
        s.add(out,sampler_stab(440,.15,.4),.23,.11)
    else:
        s.add(out,bass_hit(110,.22),.06,.12)
    return out


def polish(x, peak=.72, edge_ms=.7):
    x = np.asarray(x, np.float64).copy()
    x -= np.mean(x, axis=0)
    # Gentle peak shaping leaves a distinct transient, unlike peak-normalizing
    # a flat sustained saw to the same apparent level as a hit.
    x = np.tanh(x * 1.06) / 1.06
    k = min(len(x) // 2, s.nsec(edge_ms / 1000))
    if k:
        r = np.sin(np.linspace(0, np.pi / 2, k)) ** 2
        if x.ndim == 2:
            r = r[:, None]
        x[:k] *= r
        x[-k:] *= r[::-1]
    x *= peak / max(.001, float(np.max(np.abs(x))))
    return x


def write(name, x, peak=.72, edge_ms=.7):
    x = polish(x, peak, edge_ms)
    DELIVERY[name] = x
    path = OUT / f"{name}.wav"
    with wave.open(str(path), "wb") as w:
        w.setnchannels(1 if x.ndim == 1 else 2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(np.round(x * 32767).astype("<i2").tobytes())
    LIVE.mkdir(parents=True, exist_ok=True)
    shutil.copy2(path, LIVE / path.name)


def fanfare(dur, level):
    out = np.zeros(s.nsec(dur))
    for i, (at, pitch) in enumerate([(0, "A4"), (.22, "C5"), (.44, "E5"), (.77, "A5"), (1.14, "G5"), (1.48, "A5")]):
        f = s.note(pitch)
        d = min(.66, dur - at)
        # A clipped sampler/brass layer gives the awards the same DJ identity.
        s.add(out, brass(f, d), at, .29)
        s.add(out, sampler_stab(f/2, min(.21,d), .32), at, .16)
        if level >= 2:
            s.add(out, brass(f / 2, d), at, .11)
        if i in (0, 3):
            s.add(out, impact(.42), at, .09 + level * .012)
    for i in range(level + 1):
        at = 1.8 + i * .38
        if at >= dur - .1:
            break
        s.add(out, electric_note(s.note(["C5", "E5", "G5", "A5", "C6", "E6"][i]), min(.65, dur - at)), at, .20)
    if level >= 3:
        for i, f in enumerate([220, 329.6276, 440, 523.251]):
            d = dur - 1.45
            s.add(out, s.osc(f, d) * s.env(s.nsec(d), .10, .35, 1.3), 1.45, .07)
    if level == 5:
        s.add(out, debris(.85, 16), 2.5, .18)
        s.add(out, scratch(.34,4), 2.30, .17)
        s.add(out, bass_fill(.55), 2.68, .16)
    return out


def make_sfx():
    # Every familiar action now belongs to one short, controlled tonal family.
    write("btn", electric_note(1550, .065) + .14 * modal(620, .065, 55), .46)
    x = np.zeros(s.nsec(.42)); s.add(x,sampler_stab(220,.16),0,.45); s.add(x,electric_note(880,.18),.058,.16); s.add(x,band(.16,2200,8500)*s.env(s.nsec(.16),.001,.04,24),.006,.08); write("spin", x, .61)
    x = np.zeros(s.nsec(.145)); s.add(x, modal(195, .145, 30, .48), 0, .6); s.add(x, band(.07, 1900, 6500) * s.env(s.nsec(.07), .0004, .018, 65), .002, .23); write("reel_stop", x, .62)
    # A genuinely cyclic tension bed, not a rising two-second file restarting.
    t = s.time(2); phase = TAU * (240 * t - 22 * np.cos(TAU * t / 2) / np.pi)
    x = (.32 * np.sin(phase) + .11 * np.sin(phase * 2) + .045 * np.sin(phase * 4)) * (.66 + .34 * np.sin(TAU * 8 * t))
    x += .07 * np.sin(TAU * 960 * t) * (.5 + .5 * np.sin(TAU * t / 2))
    # The first/last sample match; cyclic sinusoidal components wrap naturally.
    x[-1] = x[0]; write("reel_tension", x, .45, 0)
    write("pluck_low", s.delay(electric_note(261.626, .75), .105, .14), .48)

    for i, pitch in enumerate(["C5", "D5", "E5", "G5", "C6"], 1):
        f = s.note(pitch)
        x = modal(f, .90, 5.8, .38) + .16 * electric_note(f * 2, .90)
        x = s.delay(x, .072, .07)
        write(f"scatter_{i}", x, .62 + i * .016)

    # Pull the record back into the drop. Four forward/back transformer strokes
    # occupy the SAME 380ms charge; no extra ceremony or game waiting.
    x=scratch(.38,4,True,True)
    s.add(x,bass_hit(110,.10),0,.045)
    write("fuse_sizzle", x, .47)
    write("dynamite_blast", dj_drop(1.10,False), .78)
    write("dynamite_blast_big", dj_drop(1.34,True), .83)
    write("symbol_shatter", debris(.70, 19) + .13 * air(.70, 3000, 850, 17), .64)
    write("smoke_puff", air(.90, 1100, 280, 5.5), .43)
    write("press_blast", impact(.58, 1), .67)
    write("grenade_blast", impact(.64, 1), .70)
    # The result is played on a sampler: a short chord answer, then dry pads.
    x = np.zeros(s.nsec(1.03))
    s.add(x,sampler_stab(440,.20,.38),0,.42)
    s.add(x,sampler_stab(659.255,.16,.20),.09,.19)
    s.add(x,electric_note(1318.51,.25),.105,.11)
    write("symbol_reveal", x, .58)
    x = np.zeros(s.nsec(.21)); s.add(x,sampler_stab(440,.17,.20),0,.30); s.add(x, modal(420, .15, 32, .14),0,.27); s.add(x,band(.045,2000,6500)*s.env(s.nsec(.045),.0005,.01,40),.001,.10); write("symbol_land", x, .52)
    x = np.zeros(s.nsec(.94))
    for at, pitch in [(0,"A4"),(.10,"E5"),(.24,"A5")]: s.add(x, electric_note(s.note(pitch), .55), at, .39)
    s.add(x, air(.45, 550, 1900, 4), 0, .14); write("ladder_up", x, .64)

    x = np.zeros(s.nsec(1.20))
    for i in range(5):
        at = i * .19
        s.add(x, sampler_stab(220 * 2 ** (i * 3 / 12), .19,.32), at, .43 + i * .035)
        s.add(x, bass_hit(82.4 * 2 ** (i / 12), .15), at, .11)
    s.add(x,scratch(.25,4),.82,.22)
    write("fullboard_chain", x, .69)
    x = np.zeros(s.nsec(1.88)); s.add(x, dj_drop(1.34,True), 0, .62)
    s.add(x,sampler_stab(220,.30,.38),.025,.29)
    s.add(x,sampler_stab(440,.20,.3),.23,.17)
    s.add(x,bass_fill(.55),.48,.15)
    s.add(x, debris(.70, 16), .28, .18); write("fullboard_stamp", x, .80)

    x = np.zeros(s.nsec(2.65)); s.add(x, impact(1.34,2), 0, .5)
    for f in [220, 329.6276, 440, 523.251]: s.add(x, brass(f, 2.2), .02, .20)
    s.add(x, air(1.1, 650, 1900, 2.5), .08, .17); write("gong_feature", x, .79)
    write("fs_intro", fanfare(2.2, 2), .72)
    t = s.time(3.0)
    x = (.46 * s.osc(55 + 5*np.sin(TAU*3*t), 3) + .24*band(3,80,900)) * s.env(len(t), .003, .35, .8)
    x *= .72 + .28*np.sin(TAU*6*t)**2; write("cave_quake",x,.64)

    for name,dur,count in [("win_gliss",1.12,6),("win_gliss_big",2.6,11),("coin_shimmer",2.15,18)]:
        x = np.zeros(s.nsec(dur))
        for i in range(count):
            at = i*(dur-.5)/count
            f = s.note(["A4","C5","E5","G5","A5","C6"][i%6])
            s.add(x,electric_note(f,min(.5,dur-at)),at,.23*(1-.3*i/count))
        s.add(x,air(min(dur,.7),850,2900,7),0,.10); write(name,x,.60 if name=="coin_shimmer" else .66)
    x=np.zeros(s.nsec(1.78))
    for at,pitch in [(0,"A4"),(.09,"E5"),(.22,"A5")]: s.add(x,modal(s.note(pitch),1.4-at,5,.30),at,.33)
    s.add(x,impact(.42),0,.14); write("win_panel",x,.66)
    for level,(name,dur) in enumerate([("win_big",2.45),("win_super",3.05),("win_mega",3.60),("win_epic",4.2),("win_max",4.8)],1): write(name,fanfare(dur,level),.68+level*.023)
    write("win_cap",fanfare(3.5,5),.80)
    x=np.zeros(s.nsec(2.05)); s.add(x,impact(1.34,2),0,.65)
    for i,f in enumerate([659.255,987.767,1318.51]): s.add(x,electric_note(f,.8),.18+i*.12,.16)
    write("bigwin_blast",x,.76)
    x=np.zeros(s.nsec(2.25)); s.add(x,scratch(.43,4,True,True),0,.37); s.add(x,bass_fill(.55),.47,.18)
    for at,pitch in [(.03,"A3"),(.44,"E4"),(.92,"A4"),(1.28,"E5")]: s.add(x,brass(s.note(pitch),.7),at,.29)
    write("wild_expand",x,.68)
    x=np.zeros(s.nsec(.58)); s.add(x,electric_note(659.255,.44),0,.48); s.add(x,electric_note(987.767,.43),.07,.31); write("mult_update",x,.56)
    # Exactly follows the mascot's 3.2s preview: raise / 125BPM scratch / settle.
    # Four 480ms gestures start at .6s and finish before 2.5s.
    x=np.zeros(s.nsec(3.2)); s.add(x,modal(950,.09,40,.12),0,.018)
    for i in range(4):
        s.add(x,scratch(.44,2,True,bool(i%2)),.6+i*.48,.45 if i%2==0 else .39)
        s.add(x,band(.055,5000,10000)*s.env(s.nsec(.055),.0007,.015,50),.6+i*.48,.035)
    s.add(x,sampler_stab(440,.12,.14),2.54,.022)
    write("dj_scratch",x,.50)


def music(fast=False):
    """16 bars: swung break groove, sampler chords and sparse scratch fills."""
    beat = 60 / (128 if fast else 105)
    dur = beat*64
    extra = s.nsec(1.2)
    out = np.zeros((s.nsec(dur)+extra,2))
    chords = [("A2",["A3","C4","E4","G4"]),("F2",["F3","A3","C4","E4"]),("C3",["C4","E4","G4","B4"]),("G2",["G3","B3","D4","F4"])]
    for bar in range(16):
        root, chord = chords[bar%4]; start=bar*4*beat
        # A soft stereo FM chord avoids a full-spectrum saw hiding the effects.
        d=4*beat+.5; t=s.time(d); pad=np.zeros(len(t))
        for i,pitch in enumerate(chord):
            f=s.note(pitch)
            pad+=(s.osc(f*.999,d,phase=i*.4)+s.osc(f*1.001,d,phase=i*.7))*.105
        pad*=s.env(len(t),.10,.35, .27)
        s.add(out,pad,start,.30,-.45 if bar%2 else .45)
        kicks=[0,1,2,3] if fast else [0,1.5,2.75]
        if not fast and bar%4==3: kicks=[0,1.5,2.5,3.5]
        for b in kicks: s.add(out,s.kick(.26),start+b*beat,.32 if fast else .28)
        for b in range(4):
            at=start+b*beat
            # Snare/clap backbeat and soft ghost notes make it a played groove.
            if b in (1,3):
                sn=(band(.18,1000,8500)*np.exp(-25*s.time(.18))+.26*modal(185,.18,26,.2))*s.env(s.nsec(.18),.001,.04)
                s.add(out,sn,at,.24 if fast else .21,-.06)
                if bar%2==1:
                    s.add(out,sn,at-.125*beat,.044,.1)
                clap=band(.12,1200,5500)*s.env(s.nsec(.12),.001,.025,32)
                s.add(out,s.delay(clap,.012,.45),at,.07,.14)
            if bar%4==3 and b==3:
                for k in range(3): s.add(out,s.hat(.08),at+(.5+k*.16)*beat,.06,.3-k*.3)
        for k in range(8):
            at=start+k*beat/2+(beat*(.045 if fast else .075) if k%2 else 0)
            ht=band(.07,5200,13500)*np.exp(-55*s.time(.07))*s.env(s.nsec(.07),.0005,.02)
            s.add(out,ht,at,.11 if k%2 else .075,-.5 if k%2 else .5)
        # Bass answers the kick on swung offbeats; occasional octaves keep the
        # groove playful without turning every spin into a musical fill.
        bass_steps=[0,.5,1,1.5,2,2.5,3,3.5] if fast else [0,.75,1.5,2.25,2.75,3.5]
        for j,b in enumerate(bass_steps):
            f=s.note(root)*(2 if j in (2,5) else 1)
            d=beat*.42 if fast else beat*.53
            s.add(out,bass_hit(f,d),start+b*beat,.30 if fast else .31)
        if bar%2==0:
            s.add(out,sampler_stab(s.note(chord[0]),.18,.26),start+.75*beat,.13,-.24)
            s.add(out,sampler_stab(s.note(chord[0])*.997,.14,.22),start+2.5*beat,.09,.25)
        # A scratch is a phrase accent, not a continuous layer. Only two in the
        # main 36s loop; four in the faster free-game loop.
        if (fast and bar%4==3) or (not fast and bar in (3,11)):
            s.add(out,scratch(.24 if fast else .29,4,True),start+3.12*beat,.12 if fast else .10,-.12)
        if bar in (7,15):
            s.add(out,bass_fill(.43),start+3.10*beat,.09)
        # Sparse hook answered by a brighter arpeggio in free games. The gaps
        # are intentional: a slot bed must leave room for repeated results.
        for k in range(8):
            if not fast and (k not in (0,3,5) or bar%4==2): continue
            if fast and bar%4==3 and k in (4,6): continue
            pitch=chord[(k+(bar//4))%4]; f=s.note(pitch)*(2 if fast or k==5 else 1)
            d=beat*.72
            tone=electric_note(f,d)
            at=start+k*beat/2
            s.add(out,tone,at,.105 if fast else .11,-.32 if k%2 else .32)
            s.add(out,tone,at+beat*.75,.025,.4 if k%2 else -.4)
    n=s.nsec(dur)
    # Wrap every phrase tail rather than fading a complete song in/out.
    out[:extra]+=out[n:n+extra]; out=out[:n]
    out-=out.mean(axis=0)
    # Roundoff correction at the sample edge is under 1ms, not an audible gap.
    k=s.nsec(.0007); delta=out[0]-out[-1]
    out[-k:]+=np.linspace(0,1,k)[:,None]*delta
    return out


def preview():
    PREVIEW.mkdir(parents=True,exist_ok=True)
    metrics={}
    for name,x in DELIVERY.items():
        window=s.nsec(.05)
        mono=x.mean(axis=1) if x.ndim==2 else x
        body=np.fft.rfft(mono); hz=np.fft.rfftfreq(len(mono),1/SR)
        power=np.abs(body)**2
        db = lambda amplitude: round(20 * np.log10(max(1e-9, float(amplitude))), 2)
        metrics[name]={
            "duration":round(len(x)/SR,3),
            "peakDbFS":db(np.max(np.abs(x))),
            "rmsDbFS":db(np.sqrt(np.mean(x*x))),
            "tail50msDbFS":db(np.sqrt(np.mean(x[-window:]**2))),
            "phoneBandEnergyPct":round(float(power[(hz>=180)&(hz<=5000)].sum()/max(1e-12,power.sum())*100),1),
            "sha256":hashlib.sha256((OUT/f"{name}.wav").read_bytes()).hexdigest(),
        }
    for width in (1,5):
        k=[0,.62,.75,.88,1,1][width]
        bang=.38; smoke=bang+round(280*k)/1000
        reveal=smoke+round(220*k)/1000+max(120,round(180*k))/1000
        duration=3.2 if width==5 else 2.55
        mix=np.zeros(s.nsec(duration))
        for name,at,gain in [("fuse_sizzle",0,.75),("dynamite_blast_big" if width==5 else "dynamite_blast",bang,.82 if width==5 else .75),("symbol_shatter",bang,.32),("smoke_puff",smoke,.32),("symbol_reveal",reveal,.58)]: s.add(mix,DELIVERY[name],at,gain)
        for i in range(width): s.add(mix,DELIVERY["symbol_land"],reveal+.16+i*.075,.33+i*.035)
        write_preview(PREVIEW/f"blast_{width}_reel.wav",mix)
        metrics[f"preview_blast_{width}"]={"rawMixPeakDbFS":round(20*np.log10(np.max(np.abs(mix))),2),"duration":duration,"detonateAt":bang,"revealAt":reveal}
    montage=np.zeros(s.nsec(12))
    # New named preview avoids stale media-player cache. The first 3.2s are
    # exactly the mascot gesture, followed by small / full drops and a prize.
    for name,at,gain in [("dj_scratch",0,.52),("spin",3.28,.8),("reel_stop",3.70,.65),("fuse_sizzle",4.0,.75),("dynamite_blast",4.38,.75),("symbol_shatter",4.38,.32),("smoke_puff",4.554,.32),("symbol_reveal",4.81,.58),("symbol_land",5.03,.38),("fullboard_chain",5.70,.75),("fuse_sizzle",7.08,.75),("dynamite_blast_big",7.46,.82),("symbol_shatter",7.46,.32),("smoke_puff",7.74,.32),("symbol_reveal",8.14,.58),("symbol_land",8.38,.38),("symbol_land",8.455,.41),("symbol_land",8.53,.44),("fullboard_stamp",8.9,.8),("win_big",9.55,.7)]: s.add(montage,DELIVERY[name],at,gain)
    # The bed is quiet under the character's independent 125BPM scratches and
    # the two blast sequences, using the same duck intent as the live bus.
    bed=DELIVERY["bgm_main"][:len(montage)].mean(axis=1)
    duck=np.ones(len(montage))
    duck[:s.nsec(3.2)]*=.55
    duck[s.nsec(4):s.nsec(5.6)]*=.43
    duck[s.nsec(7.08):s.nsec(9.0)]*=.43
    montage+=bed*.32*duck
    write_preview(PREVIEW/"neon_audio_showcase.wav",montage)
    write_preview(PREVIEW/"neon_dj_showcase.wav",montage)
    write_preview(PREVIEW/"neon_dj_light_showcase.wav",montage)
    write_preview(PREVIEW/"dj_mascot_3_2s.wav",DELIVERY["dj_scratch"]*.52)
    write_preview(PREVIEW/"dj_light_mascot_3_2s.wav",DELIVERY["dj_scratch"]*.52)
    metrics["dj_gesture"]={"cycleSeconds":.48,"brushStarts":[.60,1.08,1.56,2.04],"brushEnd":2.48,"duration":3.2}
    (PREVIEW/"audio_metrics.json").write_text(json.dumps(metrics,ensure_ascii=False,indent=2),encoding="utf8")


def write_preview(path,x):
    # This is the actual event balance, with a shared -2dB output bus. No
    # individual normalization that could conceal clipping between layers.
    x=np.tanh(x*.82)
    with wave.open(str(path),"wb") as w:
        w.setnchannels(1 if x.ndim==1 else x.shape[1]);w.setsampwidth(2);w.setframerate(SR);w.writeframes(np.round(x*32767).astype("<i2").tobytes())


def refresh():
    make_sfx()
    write("bgm_main",music(False),.52,0)
    write("bgm_freespin",music(True),.56,0)
    preview()
    print(f"REFRESH: {len(DELIVERY)} original v2 cues/music, source + live synced; previews and metrics in {PREVIEW}")


if __name__ == '__main__':
    print('Legacy synthesis retired; rebuilding sample-based Neon V3.')
    from build_neon_audio_v3 import build
    build()
