"""Feature focus: mastering and spectral budgets, with equal-peak A/B listening."""
from pathlib import Path
import json,shutil
import numpy as np
import soundfile as sf
from scipy.signal import resample_poly
APP=Path(__file__).resolve().parent.parent
THEME='ninja' if 'ninja' in APP.name else 'alchemy'
ROOT=APP/'design/source/feature_audio_v2';ROOT.mkdir(parents=True,exist_ok=True)
BEFORE=ROOT/'before';BEFORE.mkdir(exist_ok=True)
LIVE=APP/'static/assets/audio'/THEME
names=['slash_draw','slash_hit','slash_finale','gong_feature','wild_expand'] if THEME=='ninja' else ['fuse_sizzle','dynamite_blast','dynamite_blast_big','fullboard_stamp','gong_feature','fs_intro','ladder_up']
def read(p):
 a,sr=sf.read(str(p),always_2d=True);assert sr==44100;return a.mean(axis=1)
def metrics(a):
 p=np.abs(np.fft.rfft(a))**2;hz=np.fft.rfftfreq(len(a),1/44100);total=max(1e-20,p.sum())
 return dict(true_peak_db=float(20*np.log10(max(1e-12,np.max(np.abs(resample_poly(a,4,1)))))),body_40_400=float(p[(hz>=40)&(hz<400)].sum()/total),presence_2400_5800=float(p[(hz>=2400)&(hz<5800)].sum()/total),air_above_5500=float(p[hz>=5500].sum()/total),rms_db=float(20*np.log10(max(1e-12,np.sqrt(np.mean(a*a))))))
report={}
for name in names:
 before=BEFORE/(name+'.wav')
 if not before.exists():
  prior=APP/'build/assets/audio'/THEME/(name+'.wav')
  assert prior.exists(),'Previous build needed to create the first A/B snapshot'
  shutil.copy2(prior,before)
 a=read(LIVE/(name+'.wav'));m=metrics(a)
 assert m['true_peak_db']<=-1
 # Independent budgets for brittle top-end and upper-mid accumulation.
 assert m['air_above_5500'] < .05,(name,m)
 assert m['presence_2400_5800'] < .30,(name,m)
 report[name]=dict(before=metrics(read(before)),after=m)
# Same peak on both versions, so the comparison does not reward a volume boost.
compare=names[1:3]+['gong_feature'];slot=3.5;length=round(len(compare)*2*slot*44100);audio=np.zeros(length)
timeline=[]
for i,name in enumerate(compare):
 for j,(version,path) in enumerate([('before',BEFORE/(name+'.wav')),('after',LIVE/(name+'.wav'))]):
  a=read(path);a*=10**(-6/20)/max(1e-9,np.max(np.abs(resample_poly(a,4,1))))
  start=round((i*2+j)*slot*44100);audio[start:start+min(len(a),length-start)]+=a[:length-start]
  timeline.append(dict(at=(i*2+j)*slot,cue=name,version=version,comparison_peak_db=-6))
sf.write(str(ROOT/'feature_ab.wav'),audio,44100,subtype='PCM_16')
(ROOT/'comparison_timeline.json').write_text(json.dumps(timeline,indent=2)+'\n')
(ROOT/'feature_metrics.json').write_text(json.dumps(report,indent=2)+'\n')
print(THEME, 'feature mastering/spectral budgets PASS')
for name,row in report.items():
 m=row['after'];print(name,'body',round(m['body_40_400']*100,1),'presence',round(m['presence_2400_5800']*100,1),'top',round(m['air_above_5500']*100,2))
