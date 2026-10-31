"""Verify V3 licenses, exact timing, mastering, decoded loops and delivery parity."""
from pathlib import Path
import hashlib
import json
import subprocess
import numpy as np
import soundfile as sf
from scipy.signal import resample_poly
import pyloudnorm as pyln
import imageio_ffmpeg

HERE=Path(__file__).resolve().parent
APP=HERE.parent
SOURCE=HERE/'source/neon_audio_v3'
LIVE=APP/'static/assets/audio/neon'
DELIVERY=HERE/'source/neon_delivery/audio'
SR=44100
FFMPEG=imageio_ffmpeg.get_ffmpeg_exe()
BASELINE=json.loads((SOURCE/'TIMING_BASELINE.json').read_text())
LICENSES=json.loads((SOURCE/'LICENSES.json').read_text(encoding='utf8'))
LOOPS=json.loads((APP/'src/game/neonAudioLoops.json').read_text())
APPROVED={'voice_roar.wav','voice_effort.wav','monkey_expand.mp3'}
STEREO={'win_big','win_super','win_mega','win_epic','win_max','win_cap'}
names=({f'{name}.wav' for name in BASELINE}-{'bgm_main.wav','bgm_freespin.wav','reel_stop.wav'})
names|={'bgm_main.mp3','bgm_freespin.mp3','monkey_expand.mp3','win_rollup_loop.wav','win_rollup_end.wav'}
names|={f'reel_stop_{i}.wav' for i in range(1,6)}
assert names=={p.name for p in LIVE.iterdir() if p.is_file()}
assert names=={p.name for p in DELIVERY.iterdir() if p.is_file()}
assert {row['output_filename'] for row in LICENSES}==names-APPROVED
for row in LICENSES:
    assert all(row.get(k) for k in ['output_filename','source_url','author','license','original_filename'])
    assert row['license']=='CC0-1.0',row
    path=SOURCE/row['source_file']
    assert path.resolve().is_relative_to(SOURCE.resolve())
    assert hashlib.sha256(path.read_bytes()).hexdigest()==row['source_sha256'],path

def db(value):return float(20*np.log10(max(1e-12,value)))
def peak(a):return db(np.max(np.abs(resample_poly(a,4,1,axis=0))))
def decode(path,sr=SR):
    result=subprocess.run([FFMPEG,'-v','error','-i',str(path),'-f','f32le','-ar',str(sr),'-ac','2','-'],capture_output=True,check=True)
    return np.frombuffer(result.stdout,'<f4').reshape(-1,2)

report={}
for name in sorted(names):
    path=LIVE/name
    assert path.read_bytes()==(DELIVERY/name).read_bytes(),('delivery mismatch',name)
    if name in APPROVED:
        assert path.read_bytes()==(SOURCE/'approved'/name).read_bytes(),('approved voice changed',name)
    if path.suffix=='.mp3':
        a=decode(path)
        assert peak(a)<=-1,(name,peak(a))
        if path.stem in LOOPS:
            meta=LOOPS[path.stem]
            start=round(meta['trimStartSeconds']*SR)
            a=a[start:start+meta['frames']]
            assert len(a)==meta['frames']
            assert abs(len(a)/SR-16*4*60/meta['bpm'])<1/SR
            loudness=pyln.Meter(SR).integrated_loudness(a)
            assert -21<=loudness<=-19,(name,loudness)
            assert np.max(np.abs(a[0]-a[-1]))<.005,('decoded MP3 seam',name)
            assert db(np.sqrt(np.mean(a[-round(.05*SR):]**2))) < -42,('MP3 tail',name)
            b=decode(path,48000)
            begin=round(meta['trimStartSeconds']*48000)
            frames=round(meta['frames']*48000/SR)
            b=b[begin:begin+frames]
            assert len(b)==frames
            reference=resample_poly(a,160,147,axis=0)[:frames]
            correlation=float(np.corrcoef(b.ravel(),reference.ravel())[0,1])
            assert correlation>.99,(name,'48k trim',correlation)
            assert np.max(np.abs(b[0]-b[-1]))<.005,(name,'48k seam')
            sf.write(str(SOURCE/'preview'/(path.stem+'_two_cycles.wav')),np.tile(a,(2,1)),SR,subtype='PCM_16')
            report[name]=dict(lufs=float(loudness),true_peak_db=peak(a),seam_delta=float(np.max(np.abs(a[0]-a[-1]))),correlation_48k=correlation)
        continue
    info=sf.info(str(path))
    assert info.samplerate==SR and info.subtype=='PCM_16',(name,info)
    assert info.channels==(2 if path.stem in STEREO else 1),(name,info.channels)
    a,_=sf.read(str(path),always_2d=True)
    assert peak(a)<=-1,(name,peak(a))
    tail=db(np.sqrt(np.mean(a[-round(.05*SR):]**2)))
    assert tail < -42,(name,'tail',tail)
    if path.stem in BASELINE:
        assert info.frames==BASELINE[path.stem]['frames'],('timing changed',name,info.frames)
    if name not in APPROVED and path.stem!='dj_scratch':
        active=np.flatnonzero(np.max(np.abs(a),axis=1)>.005)
        assert len(active) and active[0]/SR < .008,('late onset',name)
    if path.stem in ['reel_tension','win_rollup_loop']:
        assert abs(info.duration-2)<1/SR
        assert np.max(np.abs(a[0]-a[-1]))<.0001,('loop seam',name)
    report[name]=dict(true_peak_db=peak(a),tail_50ms_db=tail)
dj,_=sf.read(str(LIVE/'dj_scratch.wav'))
for at in [.60,1.08,1.56,2.04,2.54]:
    assert np.sqrt(np.mean(dj[round(at*SR):round((at+.16)*SR)]**2))>.004,('DJ missing stroke',at)
assert np.max(np.abs(dj[:round(.59*SR)]))<.001,'DJ hand raise should be quiet'
assert np.max(np.abs(dj[round(2.85*SR):]))<.001,'DJ tail exceeds animation'
fuse,_=sf.read(str(LIVE/'fuse_sizzle.wav'))
for at in [0,.092,.184,.276]:
    assert np.sqrt(np.mean(fuse[round(at*SR):round((at+.04)*SR)]**2))>.008,('fuse missing stroke',at)
chain,_=sf.read(str(LIVE/'fullboard_chain.wav'))
for at in [0,.19,.38,.57,.76]:
    assert np.sqrt(np.mean(chain[round(at*SR):round((at+.07)*SR)]**2))>.015,('fullboard missing pulse',at)
assert 'const IGNITE_EVERY_MS = 190' in (APP/'src/components/FullBoard.svelte').read_text(encoding='utf8')
assert len({hashlib.sha256((LIVE/f'reel_stop_{i}.wav').read_bytes()).hexdigest() for i in range(1,6)})==5
size=sum(p.stat().st_size for p in LIVE.iterdir() if p.is_file())
assert size<=10_000_000,('audio budget exceeded',size)
show=sf.info(str(SOURCE/'preview/v3_showcase.wav'))
assert show.samplerate==SR and show.channels==2 and abs(show.duration-60)<1/SR
assert not (LIVE.parent/'sounds.mp3').exists() and not (LIVE.parent/'sounds.json').exists()
assert not (LIVE.parent/'jungle').exists()
(SOURCE/'preview/validation.json').write_text(json.dumps(dict(files=report,bytes=size,files_count=len(names),approved_unchanged=sorted(APPROVED),provenance_rows=len(LICENSES)),indent=2)+'\n')
print(f'PASS: {len(names)} files / {size:,} bytes; CC0 provenance, source/live parity, approved voices unchanged; exact timings, true peak, tails, 44.1k/48k MP3 seams, DJ/fuse/fullboard beats and 60s showcase')
