"""Original deterministic circus sound design. No sampled voices or third-party music."""
from pathlib import Path
import json, wave, hashlib
import numpy as np
D=Path(__file__).resolve().parent;A=D.parents[2];O=A/'static/assets/audio/hypno';O.mkdir(parents=True,exist_ok=True)
SR=22050;rng=np.random.default_rng(20261028);mapping={};meta=[]
def save(cue,x,loop=False):
 x=np.asarray(x);peak=float(np.max(np.abs(x)));x=x*(.65/max(1,peak));pcm=(np.clip(x,-1,1)*32767).astype('<i2');p=O/(cue+'.wav')
 with wave.open(str(p),'wb') as w:w.setnchannels(1 if pcm.ndim==1 else pcm.shape[1]);w.setsampwidth(2);w.setframerate(SR);w.writeframes(pcm.tobytes())
 mapping[cue]=p.name;meta.append({'cue':cue,'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'frames':len(x),'sampleRate':SR,'channels':1 if x.ndim==1 else x.shape[1],'peak':float(np.max(np.abs(x))),'rms':float(np.sqrt(np.mean(x*x))),'loop':loop,'edgeDelta':float(np.max(np.abs(x[0]-x[-1])))})
def env(t,d):return np.minimum(1,t/.003)*np.minimum(1,(d-t)/.025)
for i in range(1,6):
 d=.20;t=np.arange(int(SR*d))/SR;n=rng.uniform(-1,1,len(t));rough=n-np.roll(n,1);pulse=(.55+.45*np.sin(2*np.pi*(65+i*12)*t))**2
 x=rough*pulse*np.exp(-t*(12-i))*.17*env(t,d);save('sfx_paper_'+str(i),x)
t=np.arange(int(SR*.55))/SR;n=rng.uniform(-1,1,len(t));save('sfx_paper_burst',(n-np.roll(n,1))*.21*np.exp(-t*8)*env(t,.55))
for cue,d,f0,f1 in [('sfx_hypno_charge',.3,180,540),('sfx_hypno_spiral',.4,800,240)]:
 t=np.arange(int(SR*d))/SR;phase=2*np.pi*(f0*t+(f1-f0)*t*t/(2*d));x=(np.sin(phase)+.24*np.sin(phase*2))*env(t,d)*np.sin(np.pi*t/d)*.21;save(cue,x)
t=np.arange(int(SR*.32))/SR;x=np.zeros(len(t))
for at,f in [(0,1500),(.16,1900)]:
 u=t-at;m=u>=0;x[m]+=np.sin(2*np.pi*f*u[m])*np.exp(-u[m]*90)*.3
save('sfx_watch_tick',x*env(t,.32))
t=np.arange(int(SR*.3))/SR;save('sfx_balloon_squeak',np.sin(2*np.pi*(550*t+90*np.sin(t*14)/14))*np.sin(np.pi*t/.3)**2*.12)
# Original 12-bar 3/4 circus waltz: reed harmonics, alternating bass/chord accompaniment.
beat=.5;duration=18.;N=int(duration*SR)
melody=[72,76,79,77,76,74,71,74,77,76,74,72,69,72,76,74,72,71,67,71,74,72,71,69,72,76,79,81,79,77,76,74,71,72,67,72]
chords=[[48,52,55],[48,52,55],[43,47,50],[43,47,50],[45,48,52],[45,48,52],[43,47,50],[43,47,50],[48,52,55],[53,57,60],[43,47,50],[48,52,55]]
def note(buf,at,midi,d,amp,reed=True,pan=0):
 start=round(at*SR);count=min(round(d*SR),N-start)
 if count<=0:return
 t=np.arange(count)/SR;f=440*2**((midi-69)/12);v=np.zeros(count)
 for k,a in ([(1,1),(2,.32),(3,.17),(4,.07)] if reed else [(1,1),(2,.15)]):v+=np.sin(2*np.pi*f*k*t)*a
 envelope=np.minimum(1,t/.012)*np.minimum(1,(count/SR-t)/.055);v*=envelope*amp
 buf[start:start+count,0]+=v*(1-pan*.25);buf[start:start+count,1]+=v*(1+pan*.25)
for mode in ['base','feature']:
 buf=np.zeros((N,2))
 for i,m in enumerate(melody):note(buf,i*beat,m+(12 if mode=='feature' and i%6==0 else 0),beat*.85,.052,True,-.3)
 for bar,chord in enumerate(chords):
  note(buf,bar*beat*3,chord[0]-12,beat*.8,.064,False,.2)
  for b in [1,2]:
   for m in chord:note(buf,(bar*3+b)*beat,m+12,beat*.58,.018,True,.4)
 if mode=='feature':
  for i,m in enumerate(melody[::3]):note(buf,i*1.5+.75,m+12,.26,.017,False,.5)
 save('bgm_circus_'+mode,buf,True)
# Quiet mechanical fairground bed, independent from music; no imitation crowd or voice.
for name in ['plaza','stage']:
 t=np.arange(SR*6)/SR;x=np.zeros(len(t))
 for at in np.arange(0,6,.5):
  u=t-at;m=(u>=0)&(u<.08);x[m]+=np.sin(2*np.pi*(1400 if name=='plaza' else 1750)*u[m])*np.exp(-u[m]*95)*.025
 save('amb_circus_'+name,x*env(t,6),True)
(D/'metadata.json').write_text(json.dumps(meta,indent=2)+'\n')
(A/'src/game/hypnoAudioManifest.ts').write_text('// Original deterministic circus cues; rebuild design/demedusa_1028/audio/build.py\nexport const HYPNO_AUDIO: Record<string,string> = '+json.dumps(mapping,indent=2)+';\n')
print('Rendered',len(meta),'original cues;',sum(p.stat().st_size for p in O.glob('*.wav')),'bytes')
