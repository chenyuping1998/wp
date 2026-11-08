"""Five original, bright, phone-readable material cues; no recordings."""
from pathlib import Path
import importlib.util,json
import numpy as np
from scipy.io import wavfile
APP=Path(__file__).resolve().parent.parent
HERE=APP/'design/source/medusagaze/audio'
spec=importlib.util.spec_from_file_location('audio_base',HERE/'generate_audio.py');b=importlib.util.module_from_spec(spec);spec.loader.exec_module(b)
FS=48000;rng=np.random.default_rng(20261107)
def tone(d,f,decay=.08):
 t=np.arange(round(d*FS))/FS
 return (np.sin(2*np.pi*f*t)+.28*np.sin(2*np.pi*f*2.03*t))*b.env(len(t),.0004,decay)
def noise(d,decay=.04):
 n=round(d*FS);return b.noise(n,900,5000)*b.env(n,.0004,decay)
def mix(d,parts):
 out=np.zeros(round(d*FS))
 for at,x in parts:
  i=round(at*FS);n=min(len(x),len(out)-i)
  if n>0:out[i:i+n]+=x[:n]
 return out
jobs={
 'sfx_stone_petrify':(.18,[(0,noise(.12,.025)),(.018,tone(.15,1680,.025)*.4)],'Dry pebble tk-chk; short enough for sixteen overlapping rising-pitch cells'),
 'sfx_stone_rattle':(.46,[(i*.042,noise(.07,.015)*(.3+i*.05)+tone(.07,1040+i*66,.018)*.3) for i in range(10)],'Increasing irregular marble rattle'),
 'sfx_stone_burst':(.72,[(0,noise(.25,.055)*1.5),(0,tone(.25,840,.06)*.7)]+[(.10+i*.045,tone(.27,f,.10)*.38) for i,f in enumerate([1046,1318,1568,2093,2637,3136,4186])],'Stone burst followed by a bright lyre glissando'),
 'sfx_snake_grow':(.31,[(0,tone(.18,1100,.04)),(.025,noise(.14,.035)*.3),(.10,tone(.18,1800,.04)*.5)],'Cheeky pluck pop and dry tiny hiss'),
 'sfx_ladder_up':(1.15,[(0,noise(.07,.018)*.16)]+[(i*.16,mix(.5,[(0,tone(.5,f,.16)),(.005,tone(.5,f*1.5,.14)*.25)])) for i,f in enumerate([1046,1318,1568])]+[(.50,tone(.63,3136,.24)*.6)],'Three ascending brass-like harmonics and lyre attacks, bright bell release')}
meta=json.loads((HERE/'audio_metadata.json').read_text(encoding='utf-8'));new=[]
stems=HERE/'new-mechanics-stems';stems.mkdir(exist_ok=True)
for name,(d,parts,description) in jobs.items():
 x=mix(d,parts);x-=x.mean();x*=10**(-8/20)/max(abs(x));x[:8]*=np.linspace(0,1,8);x[-384:]*=np.linspace(1,0,384)
 source=stems/(name+'.wav');wavfile.write(source,FS,x.astype(np.float32))
 runtime=b.RUNTIME/(name+'.wav');master=HERE/'masters'/(name+'.wav')
 b.run('-y','-i',source,'-ar',44100,'-ac',1,'-c:a','pcm_s16le',runtime)
 b.run('-y','-i',source,'-ar',48000,'-ac',1,'-c:a','pcm_s24le',master)
 levels=b.measure(runtime,d);assert levels['true_peak_db']<=-1
 item={'cue':name,'file':runtime.name,'duration':d,'sample_rate':44100,'channels':1,'format':'PCM16','bytes':runtime.stat().st_size,'loop':False,'description':description,'lufs_method':'complete cue repeated to >=3 s',**levels,'design_version':'20261107'}
 meta['files']=[f for f in meta['files'] if f['cue']!=name]+[item];new.append(item)
meta['runtime_bytes']=sum(f['bytes'] for f in meta['files'])
(HERE/'audio_metadata.json').write_text(json.dumps(meta,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
(HERE/'NEW_MECHANICS_AUDIO.json').write_text(json.dumps({'provenance':'Original deterministic synthesis, no external samples','cues':new},indent=2)+'\n',encoding='utf-8')
print('Delivered five cues, runtime library:',len(meta['files']))
