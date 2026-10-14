"""Processed CC0 human recordings, never a generated or cloned voice.

Sources/provenance are in source/production_v2/voice_sources/LICENSES.md.
Run AFTER the procedural SFX generator; it intentionally replaces its voices.
"""
from pathlib import Path
import json, hashlib, sys, wave, zipfile, shutil
import numpy as np
from scipy.signal import resample_poly, resample, butter, sosfilt
sys.path.insert(0,str(Path(__file__).resolve().parent))
import generate_pickle_audio_v2 as mix

ROOT=Path(__file__).resolve().parents[1]
SRC=ROOT/'design/source/production_v2/voice_sources'
OUT=ROOT/'static/assets/audio/pickle'

def read(p):
    with wave.open(str(p)) as w:
        rate=w.getframerate(); channels=w.getnchannels()
        assert w.getsampwidth()==2
        a=np.frombuffer(w.readframes(w.getnframes()),dtype='<i2').astype(float)/32768
    a=a.reshape(-1,channels).mean(axis=1)
    return resample_poly(a,48000,rate)

def process(a,ratio):
    # Conventional varispeed and EQ of the actual performance, no speech model.
    a=resample(a,max(1,round(len(a)/ratio)))
    a=sosfilt(butter(2,[95,7200],btype='bandpass',fs=48000,output='sos'),a)
    active=np.flatnonzero(np.abs(a)>max(abs(a))*.025)
    assert len(active)
    a=a[max(0,active[0]-480):min(len(a),active[-1]+1440)]
    left=a.copy(); right=np.roll(a,72)*.97
    right[:72]=0
    return np.stack([left,right])

with zipfile.ZipFile(SRC/'yelling-sounds.zip') as z:
    for n in ['3grunt1.wav','3grunt2.wav','3grunt3.wav','3grunt4.wav','3grunt5.wav','3grunt6.wav']:
        key=next(k for k in z.namelist() if k.endswith('/'+n))
        (SRC/n).write_bytes(z.read(key))

laugh=read(SRC/'laugh_source.wav')
old=ROOT/'design/source/production_v2/voice_synth_backup'
old.mkdir(exist_ok=True)
for fg in [False,True]:
    suffix='_fg' if fg else ''
    for i in range(3):
        variant='' if i==0 else '_'+chr(ord('a')+i)
        names=[f'voice_laugh{suffix}{variant}',f'voice_hup{suffix}{variant}']
        for name in names:
            src=OUT/(name+'.wav')
            if src.exists() and not (old/src.name).exists():shutil.copy2(src,old/src.name)
        start=(1.72 if fg else .04)+i*.10
        clip=laugh[round(start*48000):round((start+2.05)*48000)]
        mix.save_sfx(names[0],process(clip,(1.37 if fg else .93)+i*.035),-18,ceiling=-1.0)
        effort=read(SRC/f'3grunt{4+i if fg else 1+i}.wav')
        mix.save_sfx(names[1],process(effort,(1.48 if fg else .94)+i*.025),-19,ceiling=-1.0)

report=json.loads((ROOT/'design/audio_v2_report.json').read_text())
for name,stats in mix.REPORT_ROWS.items():
    stats['sha256']=hashlib.sha256((OUT/name).read_bytes()).hexdigest()
    stats['source']='CC0 human recording, conventional varispeed/EQ'
    report['files'][name]=stats
sha=[v['sha256'] for v in report['files'].values()]
assert len(sha)==len(set(sha))
report['duplicates']=[]
(ROOT/'design/audio_v2_report.json').write_text(json.dumps(report,indent=2)+'\n')
print('12 unique human-recording cues; all 48kHz stereo and true peak <= -1 dBTP.')
