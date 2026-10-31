"""Audition the actual runtime mix without per-example loudness normalization."""
from pathlib import Path
import json,wave
import numpy as np

APP=Path(__file__).resolve().parent.parent
OUT=APP/'design/source/medusagaze/audio'
profiles=json.loads((OUT/'ORB_POWER_V10_MIX.json').read_text(encoding='utf-8'))['values']
profiles={p['value']:p for p in profiles}
RATE=44100
def sample(cue):
    with wave.open(str(APP/'static/assets/audio/medusa'/f'{cue}.wav'),'rb') as w:
        assert w.getnchannels()==1 and w.getsampwidth()==2 and w.getframerate()==RATE
        return np.frombuffer(w.readframes(w.getnframes()),dtype='<i2').astype(np.float64)/32768
def put(track,cue,at,gain):
    a=sample(cue)*gain;i=round(at*RATE);track[i:i+len(a)]+=a
def render(values):
    a=np.zeros(round(2.1*RATE));power=max(values)
    for cue,at in [('charge',0),('release',.35)]:
        for v in profiles[power]['sounds'][cue]:put(a,v['cue'],at,v['gain'])
    for order,value in enumerate(values):
        for cue,at in [('fly',.35+order*.2),('hit',.95+order*.2)]:
            for v in profiles[value]['sounds'][cue]:put(a,v['cue'],at,v['gain']/(len(values)**.5 if cue=='fly' else 1))
    return a*.68
cases=[([v],render([v])) for v in [2,25,100,500]]
volley=render([8,100,500])
peaks=[float(np.max(np.abs(a))) for _,a in cases]+[float(np.max(np.abs(volley)))]
assert max(peaks)<1,'The isolated audition must not clip before the runtime limiter.'
audition=np.concatenate([np.concatenate([a,np.zeros(round(.25*RATE))]) for _,a in cases])
with wave.open(str(OUT/'ORB_POWER_V10_AUDITION.wav'),'wb') as w:
    w.setnchannels(1);w.setsampwidth(2);w.setframerate(RATE);w.writeframes(np.round(audition*32767).astype('<i2').tobytes())
report={'version':10,'passed':True,'values':[2,25,100,500],'sequence':'350ms charge; release and 600ms flight; hit at 950ms; 250ms gap between examples','perExampleNormalization':False,'auditionBusGain':.68,'peakDbFS':[round(20*np.log10(p),2) for p in peaks],'lastPeakCase':'8/100/500 three-orb volley with 200ms stagger','scope':'Isolated FX mix; real gameplay also contains voice/music and uses its existing limiter. This is not an end-to-end device loudness measurement.'}
(OUT/'ORB_POWER_V10_AUDITION.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps(report,indent=2))
