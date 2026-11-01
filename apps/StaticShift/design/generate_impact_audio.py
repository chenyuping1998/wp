"""Contact cues: hardware thump + fast ink-like crack, no third-party samples."""
from pathlib import Path
import numpy as np,wave,json
SR=24000;out=Path(__file__).resolve().parents[1]/'static/assets/audio/radio';rng=np.random.default_rng(8941020)
report={}
for name,root,duration,weight in [('reel_stop',125,.12,.20),('bandit_land',72,.23,.70),('collect_stamp',58,.32,.86),('tumbler_up',49,.48,.90),('bigwin_slam',43,.55,1.0)]:
 t=np.arange(int(duration*SR))/SR
 # Exponential pitch drop: the sub has a clear short attack, not a sustained boom.
 phase=2*np.pi*(root*t+2.4*(1-np.exp(-t*42)))
 sub=np.sin(phase)*np.exp(-t*(17 if name=='reel_stop' else 12))*.62*weight
 noise=rng.normal(0,1,len(t));crack=(noise-np.roll(noise,1))*np.exp(-t*115)*.11
 box=np.sin(2*np.pi*root*3.03*t)*np.exp(-t*36)*.17
 x=(sub+crack+box)*np.minimum(1,t/.0008)
 if name=='tumbler_up':
  for k,f in enumerate([196,294,392]):
   start=.055+k*.045;u=np.maximum(0,t-start);x+=np.sin(2*np.pi*f*u)*np.exp(-u*21)*(t>=start)*.10
 if name=='bigwin_slam':x+=np.sin(2*np.pi*86*t)*np.exp(-t*9)*.15
 x=np.tanh(x*1.4)*.82;peak=float(abs(x).max());assert peak<.94
 with wave.open(str(out/(name+'.wav')),'wb') as w:w.setparams((1,2,SR,0,'NONE','not compressed'));w.writeframes((x*32767).astype('<i2').tobytes())
 report[name]={'durationMs':round(duration*1000),'peak':round(peak,4),'rms':round(float(np.sqrt(np.mean(x*x))),4)}
(Path(__file__).parent/'qa/IMPACT_AUDIO.json').write_text(json.dumps(report,indent=2));print(report)
