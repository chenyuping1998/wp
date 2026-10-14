"""New pneumatic steam, UI hover and alternate collection takes; original DSP design."""
from pathlib import Path
import json,hashlib
import numpy as np
from scipy import signal
from generate_pickle_audio_v2 import *
from audio_dsp import *
REPORT_ROWS.update(json.loads(REPORT.read_text())['files'])
# Separately authored release hiss, not a duplicate of the door-opening seal.
x=mix((hiss(.36,.015,.12,4100),0,-.3),(hiss(.34,.04,.16,2900)*.7,.045,.3),(click(.014,1700,8)*.3,0))
save_sfx('door_steam',reverb(x,'room',.1,.25),-22)
save_sfx('hover',mix((click(.01,2200,7)*.3,0),(modal([2100,3700],[.18,.08],[.018,.012],.06),.008)),-29)
# Alternate physical takes: differing timing, varispeed and stereo position.
from scipy.io import wavfile
for family in ['spin','sack_land','collect_grab','coin_in','collect_stamp','dial_tick','btn','hover']:
 rate,x=wavfile.read(OUT/f'{family}.wav');x=x.astype(float).T/32768
 for k,speed in enumerate([.94,1.07]):
  y=signal.resample_poly(x,int(1000/speed),1000,axis=-1)
  y=np.roll(y,int(SR*.006*(k+1)),axis=-1);y[:,0:int(SR*.006*(k+1))]=0
  y[0]*=.94 if k==0 else 1;y[1]*=1 if k==0 else .94
  save_sfx(f'{family}_{["b","c"][k]}',y,-23 if family!='hover' else -29)
# Dedicated concluding cadence from the original FS intro, shortened into a brisk outro.
from generate_pickle_music import render_jingles
j=render_jingles()['fs_intro'];y=j[:,-int(2.6*SR):].copy();y=fade(y,.04,.28)
save_sfx('fs_outro',y,-17)
shas={}
for p in sorted(OUT.iterdir()):
 if p.suffix in ('.wav','.m4a'):
  h=hashlib.sha256(p.read_bytes()).hexdigest();shas.setdefault(h,[]).append(p.name);REPORT_ROWS.setdefault(p.name,{})['sha256']=h
REPORT.write_text(json.dumps({'files':REPORT_ROWS,'duplicates':[v for v in shas.values() if len(v)>1]},indent=1))
