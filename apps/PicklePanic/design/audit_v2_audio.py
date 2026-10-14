"""Measure the shipped decoded WAV/AAC, not pre-encoding masters."""
from pathlib import Path
import subprocess,json,hashlib
from scipy.io import wavfile
import numpy as np
from generate_pickle_audio_v2 import lufs,true_peak
ROOT=Path(__file__).resolve().parents[1];p=ROOT/'static/assets/audio/pickle';cache=ROOT/'design/source/production_v2/audio_decoded';cache.mkdir(exist_ok=True);rows=[]
for f in sorted(p.iterdir()):
 if f.suffix not in ['.wav','.m4a']:continue
 target=f
 if f.suffix=='.m4a':
  target=cache/(f.stem+'.wav');subprocess.run(['/usr/bin/afconvert','-f','WAVE','-d','LEI16','-r','48000',str(f),str(target)],check=True,stdout=subprocess.DEVNULL)
 rate,x=wavfile.read(target);assert rate==48000 and x.ndim==2 and x.shape[1]==2,(f,rate,x.shape);x=x.astype(float).T/32768
 rows.append({'file':f.name,'seconds':round(x.shape[1]/rate,3),'lufs':round(lufs(x),2),'true_peak_db':round(true_peak(x),2),'sha256':hashlib.sha256(f.read_bytes()).hexdigest()})
assert len({r['sha256']for r in rows})==len(rows),'duplicate audio'
assert max(r['true_peak_db']for r in rows)<=-1,'true peak exceeds -1 dBTP'
(ROOT/'design/source/production_v2/audio_decoded_loudness.json').write_text(json.dumps(rows,indent=2))
(ROOT/'design/source/production_v2/audio_loudness.csv').write_text('file,seconds,LUFS,dBTP\n'+'\n'.join(f"{r['file']},{r['seconds']},{r['lufs']},{r['true_peak_db']}"for r in rows)+'\n')
print(len(rows),'unique stereo 48kHz files; max true peak',max(r['true_peak_db']for r in rows))
