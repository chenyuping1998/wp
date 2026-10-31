"""Validate licensed sample delivery, native-rate loop trim, timing and parity."""
from pathlib import Path
import hashlib,json,re,subprocess
import numpy as np
import soundfile as sf
from scipy.signal import resample_poly
import pyloudnorm as pyln
import imageio_ffmpeg
APP=Path(__file__).resolve().parent.parent
SOURCE=APP/'design/source/sampled_audio_v1'
THEME='ninja' if 'ninja' in APP.name else 'alchemy'
LIVE=APP/'static/assets/audio'/THEME
DELIVERY=SOURCE/'rendered'
SR=44100
licenses=json.loads((SOURCE/'LICENSES.json').read_text())
loops=json.loads((APP/'src/game/sampledAudioLoops.json').read_text())
baseline=json.loads((SOURCE/'TIMING_BASELINE.json').read_text())
approved={p.name for p in (SOURCE/'approved').iterdir()}
expected={r['output_filename'] for r in licenses}|approved
actual={p.name for p in LIVE.iterdir() if p.is_file()}
assert actual==expected,(actual-expected,expected-actual)
assert expected=={p.name for p in DELIVERY.iterdir() if p.is_file()}
for row in licenses:
 assert row['license']=='CC0-1.0'
 assert all(row.get(k) for k in ['source_url','author','original_filename','source_sha256'])
 p=SOURCE/row['source_file'];assert p.resolve().is_relative_to(SOURCE.resolve())
 assert hashlib.sha256(p.read_bytes()).hexdigest()==row['source_sha256']
def db(x):return float(20*np.log10(max(1e-12,x)))
def peak(a):return db(np.max(np.abs(resample_poly(a,4,1,axis=0))))
def decode(p,sr=SR):
 p=subprocess.run([imageio_ffmpeg.get_ffmpeg_exe(),'-v','error','-i',str(p),'-ar',str(sr),'-ac','2','-f','f32le','-'],capture_output=True,check=True)
 return np.frombuffer(p.stdout,'<f4').reshape(-1,2)
report={}
for name in sorted(expected):
 p=LIVE/name;assert p.read_bytes()==(DELIVERY/name).read_bytes()
 if name in approved:
  assert p.read_bytes()==(SOURCE/'approved'/name).read_bytes();continue
 if p.suffix=='.mp3':
  a=decode(p);assert peak(a)<=-1
  meta=loops[p.stem];start=round(meta['trimStartSeconds']*SR);a=a[start:start+meta['frames']]
  assert len(a)==meta['frames']
  assert abs(len(a)/SR-64*60/meta['bpm'])<1/SR
  loud=pyln.Meter(SR).integrated_loudness(a);assert -21<=loud<=-19,(name,loud)
  assert np.max(np.abs(a[0]-a[-1]))<.005
  b=decode(p,48000);start=round(meta['trimStartSeconds']*48000);frames=round(meta['frames']*48000/SR);b=b[start:start+frames]
  ref=resample_poly(a,160,147,axis=0)[:frames];corr=float(np.corrcoef(b.ravel(),ref.ravel())[0,1]);assert corr>.99
  assert np.max(np.abs(b[0]-b[-1]))<.005
  report[name]=dict(lufs=float(loud),true_peak=peak(a),trim_correlation_48k=corr)
 else:
  info=sf.info(str(p));a,_=sf.read(str(p),always_2d=True)
  assert info.samplerate==SR and info.subtype=='PCM_16'
  assert peak(a)<=-1,(name,peak(a))
  tail=db(np.sqrt(np.mean(a[-round(.05*SR):]**2)));assert tail<-42,(name,tail)
  if p.stem in baseline and p.stem not in ['btn','reel_stop']:
   target=baseline[p.stem]['frames']/baseline[p.stem]['sample_rate'];assert abs(info.duration-target)<=1/SR,(name,info.duration,target)
  if p.stem in ['reel_tension','win_rollup_loop']:assert np.max(np.abs(a[0]-a[-1]))<.0001
  active=np.flatnonzero(np.max(np.abs(a),axis=1)>.005);assert len(active) and active[0]/SR<.008,(name,'late onset')
  report[name]=dict(true_peak=peak(a),tail_50ms_db=tail)
assert len({hashlib.sha256((LIVE/f'reel_stop_{i}.wav').read_bytes()).hexdigest() for i in range(1,6)})==5
text=(APP/'src/components/Sound.svelte').read_text(encoding='utf8')
for f in re.findall(r"\w+: '((?:ninja|alchemy)/[^']+)'",text):assert (APP/'static/assets/audio'/f).is_file(),f
assert 'sound.players' not in text and 'sound.load' not in text
assets=(APP/'src/game/assets.ts').read_text(encoding='utf8');assert 'audio/sounds' not in assets
assert not (LIVE.parent/'jungle').exists() and not (LIVE.parent/'sounds.mp3').exists()
size=sum(p.stat().st_size for p in LIVE.iterdir() if p.is_file());assert size<10_000_000,size
preview=sf.info(str(SOURCE/'preview/showcase.wav'));assert abs(preview.duration-45)<1/SR
(SOURCE/'preview/validation.json').write_text(json.dumps(dict(theme=THEME,files=len(expected),bytes=size,provenance_rows=len(licenses),metrics=report),indent=2)+'\n')
print(f'PASS {THEME}: {len(expected)} files / {size:,} bytes; CC0 provenance, exact cue timing, original voices, true peak/tails, 44.1k/48k loop trim, delivery parity and 45s showcase')
