"""Original gesture foley. Five small close sounds, no external recordings."""
from pathlib import Path
import importlib.util,json
import numpy as np
from scipy.signal import butter,sosfilt
from scipy.io import wavfile

HERE=Path(__file__).resolve().parent
spec=importlib.util.spec_from_file_location('base_audio',HERE/'generate_audio.py')
base=importlib.util.module_from_spec(spec);spec.loader.exec_module(base)
FS=48000;RNG=np.random.default_rng(2026103109)
STEMS=HERE/'character-v9-stems';STEMS.mkdir(exist_ok=True)
new={}
def air(d,lo,hi):return sosfilt(butter(3,[lo,hi],'bandpass',fs=FS,output='sos'),RNG.normal(size=round(d*FS)))
def env(d,decay,attack=.001):
 t=np.arange(round(d*FS))/FS
 return (1-np.exp(-t/attack))*np.exp(-t/decay)
def ring(d,hz,decay):
 t=np.arange(round(d*FS))/FS
 return (np.sin(2*np.pi*hz*t)+.22*np.sin(2*np.pi*hz*2.77*t))*env(d,decay)
def export(name,d,layers,peak,description):
 parts=[]
 for label,at,signal in layers:
  padded=np.zeros(round(d*FS));i=round(at*FS);n=min(len(signal),len(padded)-i)
  padded[i:i+n]=signal[:n];parts.append(padded)
  wavfile.write(STEMS/f'{name}__{label}.wav',FS,padded.astype(np.float32))
 signal=sum(parts);signal-=signal.mean();signal=np.tanh(signal)
 signal*=10**(peak/20)/max(np.abs(signal).max(),1e-9)
 signal[:8]*=np.linspace(0,1,8);signal[-240:]*=np.linspace(1,0,240)
 source=STEMS/f'{name}__mix.wav';wavfile.write(source,FS,signal.astype(np.float32))
 master=HERE/'masters'/f'{name}.wav';runtime=base.RUNTIME/f'{name}.wav'
 base.run('-y','-i',source,'-ar',48000,'-ac',1,'-c:a','pcm_s24le',master)
 base.run('-y','-i',source,'-ar',44100,'-ac',1,'-c:a','pcm_s16le',runtime)
 levels=base.measure(runtime,d);assert levels['true_peak_db']<=-9
 new[name]={'cue':name,'file':runtime.name,'duration':d,'sample_rate':44100,'channels':1,'format':'PCM16','bytes':runtime.stat().st_size,'loop':False,'description':description,'lufs_method':'complete cue repeated to >=3 s',**levels,'design_version':9,'layers':[p[0] for p in layers]}

d=.28;t=np.arange(round(d*FS))/FS
export('sfx_medusa_gather',d,[('silk_pull',0,air(d,380,3900)*env(d,.13)*(.30+.70*np.sin(np.pi*t/d)**2)),('close_air',.025,air(.20,130,1100)*env(.20,.11)*.38)],-14,'Soft sleeve and inward air at elbow retraction; no musical success tone')
export('sfx_medusa_wrist',.14,[('wrist_air',0,air(.14,1100,7800)*env(.14,.035)),('gold_click',.007,ring(.10,1760,.019)*.32)],-12,'Short wrist flick with one tiny bracelet click, just before palm release')
export('sfx_medusa_jewel',.22,[('gold_touch',0,ring(.22,2380,.043)),('chain_follow',.045,ring(.16,3150,.034)*.43),('soft_contact',0,air(.07,1700,6500)*env(.07,.012)*.35)],-15,'Two unequal gold contacts follow the thumb-up or raised hand')
export('sfx_medusa_tail',.32,[('scale_brush',0,air(.32,190,2200)*env(.32,.14)),('scales_follow',.065,air(.23,850,4800)*env(.23,.06)*.28)],-16,'Low dry scale brush at delayed tail-tip follow-through')
export('sfx_snake_snap',.12,[('jaw_contact',0,air(.12,900,5600)*env(.12,.017)),('small_body',0,ring(.12,330,.018)*.55),('breathy_release',.018,air(.09,1800,7800)*env(.09,.027)*.20)],-13,'Compact snake jaw snap; quiet enough for an occasional individual double bite')
path=HERE/'audio_metadata.json';meta=json.loads(path.read_text(encoding='utf-8'));known={item['cue'] for item in meta['files']}
meta['files']=[new.get(item['cue'],item) for item in meta['files']]+[item for name,item in new.items() if name not in known]
meta['runtime_bytes']=sum(item['bytes'] for item in meta['files']);meta['character_design_version']=9
path.write_text(json.dumps(meta,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
report={'version':9,'seed':2026103109,'provenance':'Original deterministic foley synthesis; no samples or voice recording. Existing synthetic character voices retained.','cues':list(new.values()),'alignment':'Spine event marks, not detached timers','runtimeBytes':meta['runtime_bytes'],'totalCues':len(meta['files'])}
(HERE/'CHARACTER_V9_SOUND_DESIGN.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'addedCues':len(new),'totalCues':len(meta['files']),'maxPeakDb':max(v['true_peak_db'] for v in new.values())}))
