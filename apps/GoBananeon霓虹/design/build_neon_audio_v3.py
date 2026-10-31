"""Sample-based Neon V3. No oscillators/noise generators.

Rebuild offline: python design/build_neon_audio_v3.py
Dependencies: numpy scipy soundfile pyloudnorm imageio-ffmpeg (requirements-audio-v3.txt).
Original samples, author/license evidence and timing baseline live beside SOURCES.json.
"""
from __future__ import annotations
from dataclasses import dataclass
from pathlib import Path
from functools import lru_cache
import hashlib
import json
import shutil
import subprocess

import numpy as np
import soundfile as sf
from scipy.signal import butter, sosfilt, resample_poly
import pyloudnorm as pyln
import imageio_ffmpeg

HERE = Path(__file__).resolve().parent
SOURCE = HERE / 'source/neon_audio_v3'
RAW = SOURCE / 'raw'
OUT = HERE.parent / 'static/assets/audio/neon'
DELIVERY = HERE / 'source/neon_delivery/audio'
PREVIEW = SOURCE / 'preview'
SR = 44100
FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()
SOURCES = json.loads((SOURCE / 'SOURCES.json').read_text(encoding='utf8'))
BASELINE = json.loads((SOURCE / 'TIMING_BASELINE.json').read_text())
RENDERED = {}
LICENSES = []
METRICS = {}
LOOPS = {}


@dataclass
class Clip:
    audio: np.ndarray
    sources: frozenset[str] = frozenset()

    def gain(self, value):
        return Clip(self.audio * value, self.sources)


def n(seconds):
    return round(seconds * SR)


def read(path):
    if Path(path).suffix == '.mp3':
        data = subprocess.run([FFMPEG, '-v', 'error', '-i', str(path), '-ar', str(SR),
                               '-ac', '2', '-f', 'f32le', '-'], capture_output=True, check=True)
        return np.frombuffer(data.stdout, '<f4').reshape(-1, 2).astype(np.float64)
    a, sr = sf.read(str(path), always_2d=True)
    if sr != SR:
        from math import gcd
        d = gcd(SR, sr)
        a = resample_poly(a, SR // d, sr // d, axis=0)
    return a


@lru_cache(maxsize=None)
def sample(key):
    a = read(RAW / key).mean(axis=1)
    # Remove recorded pre-roll; retain the original transient, no phase rotation.
    active = np.flatnonzero(np.abs(a) > max(.0002, np.max(np.abs(a)) * .009))
    if len(active):
        a = a[max(0, active[0] - 8):]
    a = a - np.mean(a)
    a /= max(.001, np.max(np.abs(a)))
    return Clip(a, frozenset([key]))


def fit(c, seconds):
    a = np.zeros((n(seconds),) + c.audio.shape[1:])
    a[:min(len(a), len(c.audio))] = c.audio[:len(a)]
    return Clip(a, c.sources)


def rate(c, semitones):
    step = 2 ** (semitones / 12)
    pos = np.arange(0, len(c.audio) - 1, step)
    return Clip(np.interp(pos, np.arange(len(c.audio)), c.audio), c.sources)


def cut(c, start, end):
    return Clip(c.audio[n(start):n(end)].copy(), c.sources)


def filt(c, low=None, high=None):
    a = c.audio
    if low:
        a = sosfilt(butter(2, low, 'highpass', fs=SR, output='sos'), a, axis=0)
    if high:
        a = sosfilt(butter(2, high, 'lowpass', fs=SR, output='sos'), a, axis=0)
    return Clip(a, c.sources)


def fade(c, attack=.001, release=.08, quiet_tail=0):
    a = c.audio.copy()
    k = min(n(attack), len(a))
    if k:
        a[:k] *= np.linspace(0, 1, k).reshape((-1,) + (1,) * (a.ndim - 1))
    end = len(a) - n(quiet_tail)
    start = max(0, end - n(release))
    a[start:end] *= np.linspace(1, 0, end - start).reshape((-1,) + (1,) * (a.ndim - 1)) ** 2
    a[end:] = 0
    return Clip(a, c.sources)


def mix(seconds, layers, stereo=False, wrap=False):
    a = np.zeros((n(seconds), 2) if stereo else n(seconds))
    sources = set()
    for c, at, gain, *pan in layers:
        b = c.audio * gain
        if stereo and b.ndim == 1:
            p = pan[0] if pan else 0
            b = b[:, None] * np.array([np.sqrt((1-p)/2), np.sqrt((1+p)/2)])
        if not stereo and b.ndim == 2:
            b = b.mean(axis=1)
        start = n(at)
        if wrap:
            np.add.at(a, (np.arange(len(b)) + start) % len(a), b)
        elif start < len(a):
            length = min(len(b), len(a)-start)
            a[start:start+length] += b[:length]
        sources.update(c.sources)
    return Clip(a, frozenset(sources))


def room(c, wet=.14):
    # Early reflections from the recording itself; no generated impulse/noise.
    return mix(len(c.audio)/SR, [(c, 0, 1), (filt(c, high=3800), .037, wet),
                                (filt(c, high=2600), .079, wet*.65),
                                (filt(c, high=2100), .131, wet*.4)])


CLAVI = 'Clavisynth_C4_vl2.wav'
BASS = 'Clavisynth_C2_vl3.wav'
PIANO = 'FMPiano_C4_vl3.wav'
KICK = 'BDrumNew_hit_v5_rr1_Sum.wav'
SNARE = 'snare_f1.wav'
HAT = 'HiHat_HitC_v3_rr1_Mid.wav'
CLAP = 'Clap_rr1.wav'
SCRATCH = 'backspin.mp3'
HIT = 'foley/bfh1_hit_04.ogg'
GLASS = 'foley/bfh1_glass_breaking_02.ogg'
CLICK = 'interface-sounds/click_003.ogg'
ZAP = 'sci-fi-sounds/laserLarge_000.ogg'
BOOM = 'sci-fi-sounds/lowFrequency_explosion_000.ogg'
AIR = 'sci-fi-sounds/thrusterFire_001.ogg'


def note(midi, duration=.3, bass=False, pad=False):
    key = BASS if bass else PIANO if pad else CLAVI
    # VCSL names use scientific pitch (C4 = MIDI 60).
    root = 36 if bass else 60
    c = rate(sample(key), midi-root)
    c = fit(c, duration)
    return fade(filt(c, high=1600 if bass else 4800 if pad else 7200),
                attack=.035 if pad else .001, release=min(.15, duration*.3))


def chord(midi, seconds=.6, pad=False):
    return mix(seconds, [(note(midi+v, seconds, pad=pad), 0, .45) for v in (0, 3, 7, 10)])


def phrase(seconds, tier=0, motif=None):
    motif = motif or [60, 63, 67, 70, 72, 67, 75, 72]
    layers = []
    step = .15 if seconds < 1.5 else .235
    for i, pitch in enumerate(motif):
        at = i*step
        if at > seconds-.18:
            break
        layers.append((note(pitch, min(.4, seconds-at)), at, .6))
        if tier >= 2:
            layers.append((note(pitch+12, .22), at+.014, .15+.025*tier))
    layers += [(chord(60, min(seconds, .8+.15*tier), pad=True), 0, .24+.06*tier),
               (fade(fit(sample(KICK), .3)), 0, .32)]
    if tier:
        for i in range(1, int(seconds/.23)):
            at = .23*i
            if at < seconds-.15:
                layers.append((fade(fit(sample(SNARE), .18)), at, .12+.025*tier))
        # Develop the motif through the full tier duration, then resolve at the
        # actual end of the animation (longer tiers must not be padded silence).
        if tier >= 2:
            for i, at in enumerate(np.arange(1.88, seconds-.7, .16)):
                pitch = [72, 79, 75, 82, 79, 84][i % 6]
                layers.append((note(pitch, .28), float(at), .18+.02*tier))
        coda = max(.35, seconds-.85)
        layers.extend([(chord(60, .8, pad=True), coda, .3+.04*tier),
                       (note(36, .65, bass=True), coda, .3),
                       (fade(fit(sample(KICK), .28)), coda, .35)])
    return room(mix(seconds, layers), .12)


def db(x):
    return float(20*np.log10(max(1e-12, x)))


def true_peak(a):
    return np.max(np.abs(resample_poly(a, 4, 1, axis=0)))


def master(c, peak_db=-4, lufs=None, loop=False):
    # Last subdivision is a musical breath; no MP3 encoder silence in the loop.
    c = fade(c, .0002 if loop else .00005, min(.075, len(c.audio)/SR*.08), .05)
    a = c.audio
    if lufs is not None:
        loud = pyln.Meter(SR).integrated_loudness(a)
        a = a * 10**((lufs-loud)/20)
        a *= min(1, 10**(-1.8/20)/max(1e-9, true_peak(a)))
    else:
        a *= 10**(peak_db/20)/max(1e-9, true_peak(a))
    return Clip(a, c.sources)


def deliver(name, c, peak_db=-4, stereo=False, loop=False, lufs=None, bpm=None):
    if stereo and c.audio.ndim == 1:
        c = Clip(np.stack([c.audio, np.roll(c.audio, 137)*.87], axis=1), c.sources)
    c = master(c, peak_db, lufs, loop)
    filename = name+'.wav'
    sf.write(str(OUT/filename), c.audio, SR, subtype='PCM_16')
    if name.startswith('bgm_'):
        # No Xing/LAME gapless metadata => decoder output retains exactly 1105
        # encoder+decoder delay samples. Guard audio allows unambiguous trimming.
        # Runtime trims guard+delay at the decoder's actual output sample rate.
        guard = n(.1)
        padded = np.pad(c.audio, ((guard, guard), (0, 0)))
        temp = PREVIEW/(name+'_encode.wav')
        sf.write(str(temp), padded, SR, subtype='PCM_16')
        filename = name+'.mp3'
        subprocess.run([FFMPEG, '-v', 'error', '-y', '-i', str(temp), '-codec:a',
                        'libmp3lame', '-b:a', '192k', '-write_xing', '0', str(OUT/filename)], check=True)
        # Verify lossy decoded alignment against the mastered sample, not an assumed timestamp.
        decoded = read(OUT/filename)
        start = guard+1105
        section = decoded[start:start+len(c.audio)]
        corr = np.corrcoef(section[:n(3)].ravel(), c.audio[:n(3)].ravel())[0, 1]
        assert corr > .98, ('MP3 delay mismatch', name, corr)
        LOOPS[name] = dict(trimStartSeconds=start/SR, frames=len(c.audio), sampleRate=SR,
                           bpm=bpm, bars=16, correlation=float(corr))
        METRICS[name] = dict(lufs=float(pyln.Meter(SR).integrated_loudness(section)),
                             truePeakDbTP=db(true_peak(decoded)), loopCorrelation=float(corr))
        (OUT/(name+'.wav')).unlink()
        temp.unlink()
    else:
        METRICS[name] = dict(truePeakDbTP=db(true_peak(c.audio)),
                             tail50msDbFS=db(np.sqrt(np.mean(c.audio[-n(.05):]**2))))
    RENDERED[name] = c
    for key in sorted(c.sources):
        LICENSES.append(dict(output_filename=filename, **SOURCES[key],
                             source_file='raw/'+key,
                             source_sha256=hashlib.sha256((RAW/key).read_bytes()).hexdigest()))
    shutil.copy2(OUT/filename, DELIVERY/filename)


def music(bpm, energy):
    beat = 60/bpm
    duration = 64*beat
    layers = []
    # Cm9 / Abmaj7 / Ebmaj7 / Bb6; identical harmonic family for both scenes.
    roots = [48, 44, 51, 46]
    for bar in range(16):
        root = roots[(bar//2)%4]
        at = bar*4*beat
        voicing = [root+12, root+15 if root==48 else root+16, root+19, root+22]
        for i, pitch in enumerate(voicing):
            pad = note(pitch, beat*3.6, pad=True)
            layers.append((pad, at, .115, -.45+i*.3))
        for b in ([0, 1.5, 2, 3.25] if not energy else [0, 1, 2, 3]):
            kick = fade(fit(filt(sample(KICK), high=2800), .24), .001, .10)
            layers.append((kick, at+b*beat, .62))
        for b in [1, 3]:
            layers.extend([(fade(fit(sample(SNARE), .24)), at+b*beat+.009, .25),
                           (fade(fit(sample(CLAP), .22)), at+b*beat+.018, .16)])
        for step in range(8 if not energy else 16):
            division = 2 if not energy else 4
            swing = .035*beat if step%2 else 0
            layers.append((fade(fit(sample(HAT), .09)), at+step/division*beat+swing,
                           .075 if step%2 else .12, -.28 if step%2 else .25))
        pattern = [0, 0, 7, 0, 12, 7, 10, 7]
        for i, off in enumerate(pattern):
            layers.append((note(root-12+off, beat*.38, bass=True), at+i*.5*beat,
                           .40 if i%2==0 else .28))
        if bar%4 in ([2,3] if energy else [3]):
            for i, off in enumerate([12, 19, 22, 19]):
                layers.append((note(root+off, beat*.5), at+(i*.5+.25)*beat, .08 if not energy else .15, .25))
        if bar%8==7:
            scratch = fade(fit(filt(rate(sample(SCRATCH), 3), low=850, high=6500), .23))
            layers.append((scratch, at+3.1*beat, .075, -.2))
    return mix(duration, layers, stereo=True, wrap=True)


def build():
    for path in [OUT, DELIVERY, PREVIEW]:
        path.mkdir(parents=True, exist_ok=True)
    deliver('bgm_main', music(105, False), stereo=True, loop=True, lufs=-20, bpm=105)
    deliver('bgm_freespin', music(128, True), stereo=True, loop=True, lufs=-20, bpm=128)
    # Most frequent cues are deliberately dry and short.
    deliver('btn', fit(sample(CLICK), .065), -10)
    deliver('spin', mix(.42, [(fit(sample(SCRATCH), .28), 0, .32),
                             (fade(fit(sample(KICK), .20)), .012, .55)]), -5.5)
    for i in range(1, 6):
        key = f'foley/bfh1_hit_{i:02d}.ogg'
        c = mix(.145, [(fade(fit(filt(sample(key), high=5200), .13), .0001, .045), 0, .5),
                       (note(43+i*2, .12, bass=True), 0, .22+i*.03)])
        deliver(f'reel_stop_{i}', c, -8+i*.4)
    tension = mix(2, [(fade(fit(sample(KICK), .19)), at, .3+at*.12)
                      for at in [0, .5, 1, 1.5]] +
                     [(fade(fit(filt(sample(AIR), low=500, high=6000), 2), .08, .10), 0, .22)], wrap=True)
    deliver('reel_tension', tension, -8, loop=True)
    for i, off in enumerate([0, 2, 4, 7, 12], 1):
        # Real glass resonances reserved for golden Scatter, never the normal wins.
        bell = rate(sample('foley/bfh1_glass_hit_01.ogg'), off)
        c = mix(.9, [(room(fit(bell, .85), .22), 0, .55),
                     (note(72+off, .75, pad=True), 0, .25),
                     (chord(60+off, .65), 0, .06*i)])
        deliver(f'scatter_{i}', c, -5+i*.4)
    deliver('pluck_low', note(36, .75, bass=True), -6.5)
    # Same eight-note victory motif develops with every tier; no bell layers.
    for name, tier in [('win_gliss',0),('win_gliss_big',1),('win_panel',1),
                       ('win_big',1),('win_super',2),('win_mega',3),('win_epic',4),
                       ('win_max',5),('win_cap',6),('fs_intro',3),('wild_expand',2),
                       ('ladder_up',0),('mult_update',0),('symbol_reveal',0)]:
        duration = BASELINE[name]['frames']/SR
        c = phrase(duration, tier)
        deliver(name, c, -6 if tier==0 else -4+.28*tier,
                stereo=name in ['win_big','win_super','win_mega','win_epic','win_max','win_cap'])
    deliver('symbol_land', note(60, .21, pad=True), -7.5)
    for name, seconds, weight in [('dynamite_blast',1.10,.7),('dynamite_blast_big',1.34,1.2),
                                   ('grenade_blast',.64,.6),('press_blast',.58,.55),
                                   ('fullboard_stamp',1.88,1.3),('bigwin_blast',2.05,1.1),
                                   ('gong_feature',2.65,1.1)]:
        c = mix(seconds, [(fit(sample(HIT), .34), 0, .6),
                          (filt(fit(sample(BOOM), seconds), high=2400), 0, weight*.5),
                          (filt(fit(sample(ZAP), seconds), low=420), 0, .21),
                          (fit(sample(GLASS), min(.7,seconds)), .015, .12),
                          (chord(48, min(seconds,.85)), 0, .25)])
        deliver(name, room(c, .14), -4 if weight<1 else -2.5)
    deliver('symbol_shatter', filt(fit(sample(GLASS), .7), low=1300), -9)
    deliver('smoke_puff', fade(filt(fit(sample(AIR), .9), low=900, high=5800), .002, .55), -12)
    deliver('cave_quake', filt(fit(rate(sample(BOOM), -7), 3), low=40, high=900), -7)
    scratch = filt(cut(sample(SCRATCH), .15, .65), low=850, high=6800)
    # Exactly the animation's existing four stroke positions and closing cut.
    dj = [(fade(fit(rate(scratch, shift), .22), .002, .08), at, gain)
          for at,shift,gain in [(.60,0,.3),(1.08,2,.27),(1.56,-1,.28),(2.04,3,.25),(2.54,5,.16)]]
    deliver('dj_scratch', mix(3.2, dj), -13)
    fuse = [(fade(fit(rate(scratch, i*2), .082), .001, .025), at, .5)
            for i,at in enumerate([0,.092,.184,.276])]
    deliver('fuse_sizzle', mix(.38, fuse), -8)
    # FullBoard's five pulses are 190ms apart (read from FullBoard.svelte).
    chain = [(mix(.35, [(fit(sample(HIT), .14), 0, .3), (note(48+i*3, .3),0,.35)]),
              i*.19, .7) for i in range(5)]
    deliver('fullboard_chain', mix(1.2, chain), -5)
    # Smooth digital tally/percussion bed: quiet ticks, no repeated chime attack.
    roll = []
    for i in range(16):
        roll += [(fade(fit(filt(sample(CLICK), low=1400, high=4800), .035), .001, .015), i*.125, .09),
                 (note(60+[0,3,7,10][i%4], .12), i*.125, .06)]
    for i in range(4):
        roll.append((fade(fit(filt(sample(KICK), high=600), .16)), i*.5, .16))
    deliver('win_rollup_loop', mix(2, roll, wrap=True), -13, loop=True)
    deliver('win_rollup_end', mix(1, [(chord(60, .85),0,.45),
                                     (fade(fit(sample(KICK), .28)),0,.55),
                                     (fade(fit(sample(CLAP), .25)),0,.22)]), -4)
    shimmer = [(note(72+[0,7,10,15,19,24][i], .4), i*.16, .2-i*.018) for i in range(6)]
    deliver('coin_shimmer', mix(2.15, shimmer), -9)
    # Approved mascot recordings are copied byte-for-byte, never mastered here.
    for path in (SOURCE/'approved').iterdir():
        shutil.copy2(path, OUT/path.name)
        shutil.copy2(path, DELIVERY/path.name)
    (HERE.parent/'src/game/neonAudioLoops.json').write_text(json.dumps(LOOPS, indent=2)+'\n')
    (HERE.parent/'src/game/neonAudioLoops.ts').write_text(
        '// Generated by design/build_neon_audio_v3.py; measured MP3 trim boundaries.\n'
        + 'export default '+json.dumps(LOOPS, indent=2)+' as const;\n')
    (SOURCE/'LICENSES.json').write_text(json.dumps(LICENSES, indent=2, ensure_ascii=False)+'\n', encoding='utf8')
    # Remove V2 files superseded by V3, only in the two explicit audio destinations.
    allowed = {item['output_filename'] for item in LICENSES} | {p.name for p in (SOURCE/'approved').iterdir()}
    for folder in [OUT, DELIVERY]:
        for path in folder.iterdir():
            if path.is_file() and path.suffix in ['.wav','.mp3'] and path.name not in allowed:
                path.unlink()
    showcase()
    (PREVIEW/'audio_metrics.json').write_text(json.dumps(METRICS,indent=2)+'\n')
    print(f'V3: {len(allowed)} audio files; {sum(p.stat().st_size for p in OUT.iterdir())/1e6:.2f} MB; {len(LICENSES)} provenance rows')


def showcase():
    layers = []
    def add(name, at, gain=1):
        layers.append((RENDERED[name], at, gain))
    add('bgm_main', 0, .72)
    add('spin', 7, .75)
    for i in range(1,6): add(f'reel_stop_{i}', 7.5+i*.22, .8)
    add('win_gliss', 10, .8)
    for i in range(1,4): add(f'scatter_{i}', 13+(i-1)*.8, .7)
    add('reel_tension', 14.7, .6)
    add('gong_feature', 17, .75)
    add('fs_intro', 18, .65)
    # Crossfade between the same harmonic family with the runtime's 450ms ramp.
    base = layers[0][0]
    a = base.audio[:n(19.45)].copy()
    a[-n(.45):] *= np.linspace(1,0,n(.45))[:,None]
    layers[0] = (Clip(a,base.sources),0,.72)
    fg = RENDERED['bgm_freespin']
    a = np.tile(fg.audio,(2,1))[:n(41)]
    a[:n(.45)] *= np.linspace(0,1,n(.45))[:,None]
    layers.append((Clip(a,fg.sources),19,.72))
    for start,big in [(23,False),(29,True)]:
        add('fuse_sizzle',start,.75)
        add('dynamite_blast_big' if big else 'dynamite_blast',start+.38,.82 if big else .75)
        add('symbol_shatter',start+.415,.32)
        add('smoke_puff',start+.58,.32)
        add('symbol_reveal',start+.72,.58)
        for i in range(5 if big else 1):add('symbol_land',start+1+i*.1,.4)
    add('fullboard_chain',28,.7)
    add('fullboard_stamp',30.8,.7)
    add('bigwin_blast',35,.75)
    add('coin_shimmer',35,.8)
    add('win_big',35,.8)
    bed = RENDERED['win_rollup_loop']
    a = np.tile(bed.audio, 7)[:n(12.12)]
    a[-n(.12):] *= np.linspace(1,0,n(.12))
    layers.append((Clip(a,bed.sources),35,.7))
    add('win_mega',40,.82)
    add('win_rollup_end',47.12,.8)
    add('win_max',51,.88)
    add('win_cap',56,.8)
    c = mix(60,layers,stereo=True)
    c = master(c,-1.5)
    sf.write(str(PREVIEW/'v3_showcase.wav'),c.audio,SR,subtype='PCM_16')
    (PREVIEW/'TIMELINE.json').write_text(json.dumps(dict(main=0,spin=7,small_win=10,
        scatter=13,feature=17,single_blast=23,full_blast=29,big_rollup=35,
        mega=40,rollup_end=47.12,max=51,cap=56),indent=2))


if __name__ == '__main__':
    build()
