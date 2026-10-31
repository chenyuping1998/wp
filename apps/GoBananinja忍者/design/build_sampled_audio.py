"""Sample-based themed audio. No oscillators/noise generators.

Rebuild offline: python design/build_sampled_audio.py
Dependencies: numpy scipy soundfile pyloudnorm imageio-ffmpeg (requirements-sampled-audio.txt).
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

THEME = 'ninja'
HERE = Path(__file__).resolve().parent
SOURCE = HERE / 'source/sampled_audio_v1'
RAW = SOURCE / 'raw'
OUT = HERE.parent / ('static/assets/audio/' + THEME)
DELIVERY = SOURCE / 'rendered'
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



DRUM='BDrumNew_hit_v5_rr1_Sum.wav'
WOOD=[f'foley/bfh1_wood_hit_{i:02d}.ogg' for i in range(1,4)]
GLASS='foley/bfh1_glass_hit_01.ogg'
BREAK='foley/bfh1_glass_breaking_02.ogg'
AIR='sci-fi-sounds/thrusterFire_001.ogg'
WATER='sci-fi-sounds/slime_000.ogg'
PLUCK='BowedPsaltery_C4_Main_Pluck_rr1.wav' if THEME=='ninja' else 'Marimba_hit_Outrigger_C4_med_01.wav'
FLUTE='AltRecorder_Stac_C4_rr1_Main.wav'
PIANO='FMPiano_C4_vl3.wav'

def duration(name,default):
    meta=BASELINE.get(name)
    return meta['frames']/meta['sample_rate'] if meta else default

def note(pitch,seconds=.3,pad=False):
    c=rate(sample(FLUTE if pad and THEME=='ninja' else PIANO if pad else PLUCK),pitch-60)
    return fade(filt(fit(c,seconds),high=4200 if pad else 6500),.025 if pad else .0003,min(.1,seconds*.3))

def chord(pitch,seconds=.6):
    intervals=(0,7,14) if THEME=='ninja' else (0,3,7,14)
    return mix(seconds,[(note(pitch+i,seconds,pad=True),0,.3) for i in intervals])

def hit(index,seconds=.16):
    if THEME=='ninja':
        return mix(seconds,[(fit(sample(WOOD[index%3]),seconds),0,.6),(fit(rate(sample(DRUM),index*.7),seconds),0,.3)])
    return mix(seconds,[(fit(rate(sample(GLASS),index*2),seconds),0,.45),
                        (fit(sample(f'foley/bfh1_hit_{index%5+1:02d}.ogg'),seconds),0,.25),
                        (fit(sample(WATER),seconds),0,.15)])

def fanfare(seconds,tier=0):
    motif=[60,62,67,69,72,74,79,72] if THEME=='ninja' else [60,63,67,70,74,75,79,72]
    layers=[]
    step=min(.19,max(.08,(seconds-.25)/8))
    for i,pitch in enumerate(motif):
        at=i*step
        if at<seconds-.1:layers.append((note(pitch,min(.38,seconds-at)),at,.6))
    if tier:
        for i,at in enumerate(np.arange(0,seconds-.22,.34)):
            layers.append((fade(fit(sample(DRUM),.25)),float(at),.2+.025*tier))
        if tier>=3:
            for i,at in enumerate(np.arange(1.4,seconds-.6,.17)):
                layers.append((note(motif[i%8]+12,.25),float(at),.12+.02*tier))
        layers.append((chord(60,min(.7,seconds*.4)),max(0,seconds-.8),.45))
    return room(mix(seconds,layers),.10 if THEME=='ninja' else .20)

def music(bpm,feature):
    beat=60/bpm;seconds=64*beat;layers=[]
    for bar in range(16):
        root=([48,53,55,48] if THEME=='ninja' else [48,44,51,46])[(bar//2)%4]
        at=bar*4*beat
        # Sparse main bed leaves foreground stops intelligible. Feature adds
        # subdivisions and an upper-register answer in the same harmonic family.
        layers.append((chord(root+12,beat*3.2),at,.12,-.3))
        for i,off in enumerate([0,7,12,7,0,7,14,7]):
            layers.append((note(root+off,beat*.4),at+i*.5*beat,.18 if i%2 else .25,(-1 if i%2 else 1)*.28))
        for b in ([0,2] if not feature else [0,1.5,2,3.5]):
            layers.append((fade(fit(filt(sample(DRUM),high=1800),.32)),at+b*beat,.43))
        for b in [1,3]:layers.append((fade(fit(sample(WOOD[bar%3]),.16)),at+b*beat,.22))
        if feature:
            for i in range(8):layers.append((fade(fit(sample('HiHat_HitC_v3_rr1_Mid.wav'),.08)),at+(i*.5+.03*(i%2))*beat,.06))
        if bar%4==3:
            for i,off in enumerate([12,14,19,24]):layers.append((note(root+off,beat*.45,pad=THEME=='ninja'),at+(i*.5+.25)*beat,.1 if not feature else .17,.3))
        if THEME=='alchemy' and bar%4==2:
            layers.append((fade(filt(fit(sample(WATER),.5),low=300,high=3500)),at+2.5*beat,.045,-.6))
    return mix(seconds,layers,stereo=True,wrap=True)

def db(x):
    return float(20*np.log10(max(1e-12, x)))


def true_peak(a):
    return np.max(np.abs(resample_poly(a, 4, 1, axis=0)))


def master(c, peak_db=-4, lufs=None, loop=False):
    # Last subdivision is a musical breath; no MP3 encoder silence in the loop.
    c = fade(c, .008 if loop else .00005, min(.075, len(c.audio)/SR*.08), .05)
    a = c.audio
    if lufs is not None:
        loud = pyln.Meter(SR).integrated_loudness(a)
        a = a * 10**((lufs-loud)/20)
        a *= min(1, 10**(-1.8/20)/max(1e-9, true_peak(a)))
    else:
        a *= 10**(peak_db/20)/max(1e-9, true_peak(a))
    return Clip(a, c.sources)


# Cinematic feature accents retain the original animation duration/onset.
FEATURE_WEIGHT = {
 'slash_draw': .35, 'slash_hit': 1.0, 'slash_finale': 1.55,
 'gong_feature': 1.4, 'fs_intro': .8, 'bigwin_blast': 1.25,
 'wild_expand': .8, 'grenade_blast': 1.0, 'fuse_sizzle': .3,
 'dynamite_blast': 1.0, 'dynamite_blast_big': 1.55,
 'fullboard_chain': .85, 'fullboard_stamp': 1.5, 'ladder_up': .5,
 'symbol_reveal': .45,
}
def feature_finish(name, c):
    weight = FEATURE_WEIGHT[name]
    seconds = len(c.audio)/SR
    # Broad presence dip, not a brickwall: retain air but avoid the sharp
    # 2.4–5.8k band that accumulates when several feature cues overlap.
    body = filt(c, low=38, high=7200)
    harsh = filt(body, low=2400, high=5800)
    body = Clip(body.audio-harsh.audio*.52, body.sources)
    layers = [(body,0,1)]
    if name not in ['slash_draw','fuse_sizzle']:
        low = fade(fit(filt(rate(sample(DRUM),-5),low=40,high=260),seconds),.002,min(.35,seconds*.35))
        chest = fade(fit(filt(sample('foley/bfh1_hit_04.ogg'),low=240,high=1600),min(seconds,.32)),.002,.10)
        # Keep a warm wooden attack audible on small speakers as well as subs.
        wood=filt(fit(sample(WOOD[0]),min(seconds,.24)),low=320,high=2200)
        wood=fade(wood,.002,.09)
        wood=wood.gain(.7/max(.001,true_peak(wood.audio)))
        layers += [(low,0,.42*weight),(chest,0,.22*weight),(wood,0,.65*weight)]
        if weight>1.3:
            layers.append((fade(fit(filt(rate(sample(DRUM),-2),high=700),min(.35,seconds)),.002,.18),.045,.15))
    else:
        # A sampled air/pressure intake sets up contrast before the impact.
        intake=filt(fit(sample(AIR),seconds),low=450,high=3300)
        ramp=np.linspace(.06,.7,len(intake.audio))
        layers.append((Clip(intake.audio*ramp,intake.sources),0,.2))
    return room(mix(seconds,layers),.16 if weight<1.3 else .23)

def deliver(name, c, peak_db=-4, stereo=False, loop=False, lufs=None, bpm=None):
    if name in FEATURE_WEIGHT:
        c=feature_finish(name,c)
        peak_db=-3.2 if FEATURE_WEIGHT[name]<1.3 else -2.8
        if name in ['slash_draw','fuse_sizzle']:peak_db=-8
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
        assert np.max(np.abs(section[0]-section[-1])) < .005, ('Decoded loop seam',name,section[0],section[-1])
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


def build():
    for p in [OUT,DELIVERY,PREVIEW]:p.mkdir(parents=True,exist_ok=True)
    main,fg=(108,138) if THEME=='ninja' else (128,154)
    deliver('bgm_main',music(main,False),stereo=True,loop=True,lufs=-20,bpm=main)
    deliver('bgm_freespin',music(fg,True),stereo=True,loop=True,lufs=-20,bpm=fg)
    deliver('btn',fit(sample('interface-sounds/click_003.ogg'),.075),-11)
    deliver('spin',mix(duration('spin',.42),[(fade(fit(filt(sample(AIR),low=550,high=4500),.30)),0,.25),(hit(0,.18),0,.5)]),-6)
    for i in range(1,6):deliver(f'reel_stop_{i}',hit(i,.18),-8+i*.3)
    tension=mix(2,[(hit(i,.13),i*.25,.12+i*.018) for i in range(8)],wrap=True)
    deliver('reel_tension',tension,-12,loop=True)
    for i,off in enumerate([0,2,4,7,12],1):
        d=duration(f'scatter_{i}',.9)
        c=mix(d,[(fit(rate(sample(GLASS),off),d),0,.45),(note(72+off,d,pad=True),0,.25)])
        deliver(f'scatter_{i}',room(c,.18),-5+i*.3)
    deliver('pluck_low',note(48,duration('pluck_low',.65)),-7)
    for name,tier,default in [('win_gliss',0,1.2),('win_gliss_big',1,2.1),('fs_intro',2,2.15),
        ('mult_update',0,.7),('wild_expand',2,1.8),('win_panel',1,1.4),('win_cap',6,3),
        ('win_big',1,2.45),('win_super',2,3.05),('win_mega',3,3.6),('win_epic',4,4.2),('win_max',5,4.8)]:
        deliver(name,fanfare(duration(name,default),tier),-5 if not tier else -4,
                stereo=name in ['win_big','win_super','win_mega','win_epic','win_max','win_cap'])
    for name in ['gong_feature','bigwin_blast','grenade_blast','press_blast','dynamite_blast','dynamite_blast_big','fullboard_stamp']:
        if THEME=='ninja' and name not in ['gong_feature','bigwin_blast','grenade_blast']:continue
        d=duration(name,1.3)
        c=mix(d,[(fit(sample(DRUM),d),0,.6),(hit(3,min(d,.3)),0,.45),
                 (chord(48,min(d,.8)),0,.4),(filt(fit(sample(AIR),min(d,.6)),low=650),.01,.1)])
        deliver(name,room(c,.16),-3.7)
    if THEME=='ninja':
        for name in ['slash_draw','slash_hit','slash_finale']:
            d=duration(name,.7)
            air=fade(filt(fit(sample(AIR),min(.45,d)),low=850,high=6300),.004,.23)
            layers=[(air,0,.35)]
            if name!='slash_draw':layers += [(hit(4,.24),0,.65),(fit(sample(BREAK),min(d,.38)),0,.10)]
            deliver(name,mix(d,layers),-7 if name=='slash_draw' else -4.5)
    else:
        d=duration('fuse_sizzle',.38)
        deliver('fuse_sizzle',mix(d,[(fade(fit(rate(sample(WATER),-12),.075),.001,.02),i*.08,.45) for i in range(4)]),-9)
        deliver('symbol_shatter',filt(fit(sample(BREAK),duration('symbol_shatter',.95)),low=1000,high=5700),-10)
        deliver('smoke_puff',fade(filt(fit(sample('sci-fi-sounds/slime_001.ogg'),duration('smoke_puff',.95)),high=5800),.002,.4),-12)
        deliver('symbol_reveal',fanfare(duration('symbol_reveal',1.2)), -6)
        deliver('ladder_up',fanfare(duration('ladder_up',1.2)), -6)
        deliver('cave_quake',filt(fit(rate(sample(DRUM),-9),duration('cave_quake',.95)),high=500),-10)
        d=duration('fullboard_chain',1.7)
        deliver('fullboard_chain',mix(d,[(hit(i,.25),i*.19,.6) for i in range(5)]),-5)
    c=mix(duration('coin_shimmer',1.2),[(note(72+i*2,.25),i*.1,.3) for i in range(6)])
    deliver('coin_shimmer',c,-10)
    roll=[]
    for i in range(16):roll.append((fade(fit(sample(WOOD[i%3] if THEME=='ninja' else 'interface-sounds/click_003.ogg'),.055),.001,.015),i*.125,.055))
    for i in range(4):roll.append((note(60+[0,7,12,7][i],.21),i*.5,.055))
    deliver('win_rollup_loop',mix(2,roll,wrap=True),-15,loop=True)
    deliver('win_rollup_end',mix(1,[(chord(60,.85),0,.5),(hit(3,.3),0,.5)]),-5)
    for p in (SOURCE/'approved').iterdir():shutil.copy2(p,OUT/p.name);shutil.copy2(p,DELIVERY/p.name)
    for ext in ['json','ts']:
        text=json.dumps(LOOPS,indent=2)
        if ext=='ts':text='// Generated by build_sampled_audio.py.\nexport default '+text+' as const;'
        (HERE.parent/('src/game/sampledAudioLoops.'+ext)).write_text(text+'\n')
    (SOURCE/'LICENSES.json').write_text(json.dumps(LICENSES,indent=2)+'\n')
    allowed={x['output_filename'] for x in LICENSES}|{p.name for p in (SOURCE/'approved').iterdir()}
    for folder in [OUT,DELIVERY]:
        assert folder.resolve().is_relative_to(HERE.parent.resolve())
        for p in folder.iterdir():
            if p.is_file() and p.suffix in ['.wav','.mp3','.json'] and p.name not in allowed:p.unlink()
    sf.write(str(PREVIEW/'main_two_cycles.wav'),np.tile(RENDERED['bgm_main'].audio,(2,1)),SR,subtype='PCM_16')
    showcase()
    (PREVIEW/'audio_metrics.json').write_text(json.dumps(METRICS,indent=2)+'\n')
    print(THEME,len(allowed),'files',round(sum(p.stat().st_size for p in OUT.iterdir())/1e6,2),'MB')

def showcase():
    layers=[]
    def add(name,at,gain=.75):layers.append((RENDERED[name],at,gain))
    add('bgm_main',0,.65);add('spin',5)
    for i in range(1,6):add(f'reel_stop_{i}',5.5+i*.22)
    add('win_gliss',9)
    for i in range(1,4):add(f'scatter_{i}',12+i*.7)
    add('reel_tension',14,.5);add('gong_feature',17)
    add('slash_draw' if THEME=='ninja' else 'fuse_sizzle',22)
    add('slash_hit' if THEME=='ninja' else 'dynamite_blast',22.72 if THEME=='ninja' else 22.38)
    add('slash_finale' if THEME=='ninja' else 'dynamite_blast_big',26)
    add('win_big',31);add('coin_shimmer',31)
    bed=RENDERED['win_rollup_loop'];a=np.tile(bed.audio,5)[:n(8.12)];a[-n(.12):]*=np.linspace(1,0,n(.12));layers.append((Clip(a,bed.sources),31,.7))
    add('win_mega',35);add('win_rollup_end',39.12);add('win_max',40)
    # Main scene fades to feature; never cut a music buffer at an arbitrary sample.
    base=layers[0][0];a=fit(base,18.45).audio;a[-n(.45):]*=np.linspace(1,0,n(.45))[:,None];layers[0]=(Clip(a,base.sources),0,.65)
    fg=RENDERED['bgm_freespin'];a=np.tile(fg.audio,(2,1))[:n(27)];a[:n(.45)]*=np.linspace(0,1,n(.45))[:,None];layers.append((Clip(a,fg.sources),18,.65))
    sf.write(str(PREVIEW/'showcase.wav'),master(mix(45,layers,stereo=True),-1.5).audio,SR,subtype='PCM_16')

if __name__=='__main__':build()
