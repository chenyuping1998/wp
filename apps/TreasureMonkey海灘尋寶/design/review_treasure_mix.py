"""Offline listening sample at studio levels; not a recording of platform play."""
from pathlib import Path
import wave,json
import numpy as np
ROOT=Path(__file__).resolve().parents[1];SR=44100
AUDIO=ROOT/'static/assets/audio/treasure'
def read(path):
 with wave.open(str(path)) as source:
  assert source.getframerate()==SR and source.getsampwidth()==2
  return np.frombuffer(source.readframes(source.getnframes()),dtype='<i2').astype(float).reshape(-1,source.getnchannels())/32768
d=5.8;t=np.arange(round(SR*d))/SR
music=read(ROOT/'design/source/treasure/audio/bgm_freespin_44k.wav')[:len(t)]
duck=np.ones(len(t))
for at,duration,level in [(1.18,.6,.72),(2.06,1.6,.45)]:
 attack=np.clip((t-at)/.035,0,1);release=np.clip((t-at-duration)/.28,0,1)
 duck=np.minimum(duck,1-(1-level)*attack*(1-release))
mix=music*.24*duck[:,None]
events=[(.18,'detector_lock',.48),(1.18,'sand_reveal',.55),(1.74,'chest_open',.46),(2.06,'fs_intro',.5),(3.2,'wave_transition',.5),(4.95,'plaque_flip',.38)]
for at,name,gain in events:
 data=read(AUDIO/'sfx'/f'{name}.wav');start=round(at*SR);count=min(len(data),len(mix)-start)
 mix[start:start+count]+=data[:count]*gain
mix*=np.minimum(1,t/.06)[:,None]*np.minimum(1,(d-t)/.12)[:,None]
assert np.max(np.abs(mix))<.89,'listening sample clips'
out=ROOT/'design/reviews/sound_direction_20261020.wav'
with wave.open(str(out),'wb') as output:
 output.setparams((2,2,SR,0,'NONE','not compressed'));output.writeframes(np.round(mix*32767).astype('<i2').tobytes())
for name in ['detector_lock','sand_reveal','chest_open','plaque_flip']:
 data=read(AUDIO/'sfx'/f'{name}.wav')
 assert abs(np.mean(data))<.004 and np.max(np.abs(data))<.6
 assert np.max(np.abs(data[-128:]))<.03 and np.max(np.abs(data[:4]))<.002,'edge click'
print('OK: four bounded foley cues and stereo listening sample; peak',round(20*np.log10(np.max(np.abs(mix))),2),'dBFS')
