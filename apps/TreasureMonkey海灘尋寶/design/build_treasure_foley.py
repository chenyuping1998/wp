"""Deterministic original foley layers; no recordings or third-party samples."""
from pathlib import Path
import json, wave
import numpy as np
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'static/assets/audio/treasure/sfx'
MASTER=ROOT/'design/source/treasure/audio'
SR=44100
rng=np.random.default_rng(201026)
def env(t,d,attack=.004,release=.035):
 return np.minimum(1,t/attack)*np.minimum(1,(d-t)/release).clip(0,1)
def resonant(f,d,decay=16):
 t=np.arange(round(d*SR))/SR
 return sum(np.sin(2*np.pi*f*h*t)*np.exp(-t*decay*h)/h**1.8 for h in [1,2,3])*env(t,d)
def friction(d,decay=7,blur=12):
 t=np.arange(round(d*SR))/SR
 n=rng.standard_normal(len(t))
 n=np.convolve(n,np.ones(blur)/blur,'same')
 return n*np.exp(-decay*t)*env(t,d)
def mix(d,parts):
 out=np.zeros(round(d*SR))
 for at,x,gain in parts:
  start=round(at*SR);count=min(len(x),len(out)-start)
  if count>0:out[start:start+count]+=x[:count]*gain
 return out
cues={
 'detector_lock':mix(.27,[(0,resonant(1046,.085,23),.55),(.103,resonant(1568,.14,21),.4)]),
 'sand_reveal':mix(.62,[(0,friction(.49,3.5,7),.75),(.055,friction(.34,5,24),.45),(.14,resonant(1760,.28,17),.055)]),
 'chest_open':mix(.46,[(0,friction(.28,5,28),.45),(.015,resonant(185,.17,24),.20),(.17,resonant(390,.18,27),.20),(.22,resonant(1174,.19,19),.06)]),
 'plaque_flip':mix(.22,[(0,resonant(310,.11,33),.32),(.014,friction(.09,28,5),.3),(.054,resonant(1244,.14,23),.16)]),
}
manifest={}
for name,data in cues.items():
 data-=np.mean(data)
 data*=env(np.arange(len(data))/SR,len(data)/SR,.003,.02)
 data=data/max(np.max(np.abs(data)),1e-9)*.58
 with wave.open(str(OUT/f'{name}.wav'),'wb') as output:
  output.setparams((1,2,SR,0,'NONE','not compressed'));output.writeframes(np.round(data*32767).astype('<i2').tobytes())
 manifest[name]={'seconds':len(data)/SR,'peak_dbfs':float(20*np.log10(np.max(np.abs(data)))),'rms_dbfs':float(20*np.log10(np.sqrt(np.mean(data**2))))}
(MASTER/'foley_manifest.json').write_text(json.dumps(manifest,indent=2),encoding='utf-8')
print('Wrote four original layered detector/sand/chest/plaque cues, 44.1 kHz mono PCM16')
