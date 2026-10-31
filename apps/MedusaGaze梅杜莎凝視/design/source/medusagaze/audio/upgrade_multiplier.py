"""Original multiplier sound design v2: material layers, no samples or voices.
Mono 44.1k/16 runtime, 48k/24 masters; Web Audio supplies positional panning.
"""
from pathlib import Path
import importlib.util,json,math,shutil
import numpy as np
from scipy.signal import butter,sosfilt
from scipy.io import wavfile

HERE=Path(__file__).resolve().parent
spec=importlib.util.spec_from_file_location('base_audio',HERE/'generate_audio.py');base=importlib.util.module_from_spec(spec);spec.loader.exec_module(base)
FS=48000;RNG=np.random.default_rng(2026102502);STEMS=HERE/'multiplier-v2-stems';STEMS.mkdir(exist_ok=True);PREVIOUS=HERE/'previous_multiplier_v1';PREVIOUS.mkdir(exist_ok=True)
def noise(d,lo,hi):
 n=round(d*FS);return sosfilt(butter(3,[lo,hi],'bandpass',fs=FS,output='sos'),RNG.normal(0,1,n))
def pulse(d,attack=.001,decay=.09):
 t=np.arange(round(d*FS))/FS;out=(1-np.exp(-t/attack))*np.exp(-t/decay);out[-min(len(t),240):]*=np.linspace(1,0,min(len(t),240));return out
def modal(d,f,decay=.12):
 t=np.arange(round(d*FS))/FS
 return sum(np.sin(2*np.pi*f*ratio*t+index*.17)*np.exp(-t/(decay/(1+index*.3)))/((index+1)**1.4) for index,ratio in enumerate([1,1.51,2.08,2.71,3.67]))*pulse(d,.0006,decay*2)
def mix(d,layers):
 x=np.zeros(round(d*FS))
 for at,a in layers:
  i=round(at*FS);n=min(len(a),len(x)-i)
  if n>0:x[i:i+n]+=a[:n]
 return x
def export(name,d,layers,peak,description,loop=False):
 parts=[]
 for label,at,x in layers:
  padded=mix(d,[(at,x)]);parts.append(padded)
  wavfile.write(STEMS/f'{name}__{label}.wav',FS,padded.astype(np.float32))
 x=sum(parts);x-=x.mean();x*=10**(peak/20)/max(1e-9,np.max(np.abs(x)));x[:8]*=np.linspace(0,1,8);x[-240:]*=np.linspace(1,0,240)
 source=STEMS/f'{name}__mix.wav';wavfile.write(source,FS,x.astype(np.float32))
 master=HERE/'masters'/f'{name}.wav';runtime=base.RUNTIME/f'{name}.wav'
 for p in [master,runtime]:
  old=PREVIOUS/('master_' if p==master else 'runtime_')/p.name
  if p.exists() and not old.exists():old.parent.mkdir(exist_ok=True);shutil.copy2(p,old)
 base.run('-y','-i',source,'-ar',48000,'-ac',1,'-c:a','pcm_s24le',master)
 base.run('-y','-i',source,'-ar',44100,'-ac',1,'-c:a','pcm_s16le',runtime)
 level=base.measure(runtime,d);assert level['true_peak_db']<=-1
 new[name]={'cue':name,'file':runtime.name,'duration':d,'sample_rate':44100,'channels':1,'format':'PCM16','bytes':runtime.stat().st_size,'loop':loop,'description':description,'lufs_method':'complete cue repeated to >=3 s',**level,'design_version':2,'layers':[v[0] for v in layers]}
 mixes[name]=x

new={};mixes={}
d=.22;t=np.arange(round(d*FS))/FS
export('sfx_glasses_slide',d,[('hinge_friction',0,noise(d,550,6200)*pulse(d,.002,.045)*.65),('rim_tick',.015,modal(.07,1580,.025)*.35),('frame_settle',.105,modal(.09,910,.035)*.25)],-13,'Dry eyewear hinge rub, first finger contact, short rim settle; no voice or whistle')
export('sfx_glasses_on',.12,[('frame_click',0,modal(.12,1260,.025)),('finger_release',.02,noise(.08,900,5500)*pulse(.08,.001,.018)*.2)],-14,'Small plastic/gold frame click matching the return pose')
d=.28;t=np.arange(round(d*FS))/FS
export('sfx_gaze_charge',d,[('serpent_air',0,noise(d,360,3300)*pulse(d,.006,.11)*.75),('warm_resonance',0,modal(d,310,.13)*.28),('prism_grain',.035,noise(.20,2100,6500)*pulse(.20,.014,.075)*.28)],-14,'Restrained airy anticipation with warm material resonance, followed by deliberate quiet hold')
d=.76;t=np.arange(round(d*FS))/FS
export('sfx_gaze_beam',d,[('focus_snap',0,noise(.12,1600,7800)*pulse(.12,.0007,.028)*.55),('glass_resonance',0,modal(d,1170,.25)*.36),('radiating_air',.025,noise(.68,700,4200)*pulse(.68,.035,.28)*.27),('gathering_prism',.19,modal(.53,1620,.20)*pulse(.53,.035,.22)*.20)],-11,'Green-eye focus, spreading airy radiance and gathering prism resonance; one unhurried performance at every turbo tier')

d=.60;t=np.arange(round(d*FS))/FS;shape=(.12+.88*np.sin(np.pi*np.minimum(1,t/.56))**1.1)*np.minimum(1,t/.008)
export('sfx_orb_fly',d,[('air_body',0,noise(d,330,2800)*shape*.65),('air_edge',0,noise(d,2700,8000)*shape**2*.3),('spinning_prism',0,modal(d,1780,.30)*(.25+.75*np.sin(2*np.pi*19*t)**2)*.14)],-13,'Six-hundred-ms granular flight and rotating glass texture; same duration and pitch at all turbo tiers, panned along the orb trajectory')
for size,d,pitch,peak in [('s',.42,1130,-11),('m',.50,980,-10),('l',.58,820,-9)]:
 export('sfx_orb_hit_'+size,d,[('contact_bite',0,noise(.10,1050,7200)*pulse(.10,.0004,.018)*.5),('marble_body',0,modal(d,245 if size=='l' else 320,.055)*.45),('crystal_ring',.008,modal(d,pitch,.16 if size=='s' else .23)*.62),('falling_sparkles',.062,mix(d-.062,[(0,modal(.14,pitch*2.11,.045)*.14),(.055,modal(.12,pitch*2.72,.03)*.10),(.106,modal(.10,pitch*3.09,.02)*.065)]))],peak,'Immediate contact bite, short marble body, inharmonic crystal ring, descending micro-sparkles; '+size+' intensity')
for variant in [1,2]:
 d=.48;layers=[('fracture_snap',0,noise(.08,900,7500)*pulse(.08,.0004,.015)*.5),('stone_stress',0,modal(.18,460 if variant==1 else 390,.055)*.4)]
 for index,at in enumerate([.038,.073,.119,.176,.245,.326]):layers.append((f'chip_{index+1}',at,noise(.095,520+index*110,5000)*pulse(.095,.0005,.02)*(.31-index*.035)))
 export('sfx_orb_crack'+('' if variant==1 else '_2'),d,layers,-12,'Dry brittle fracture, staggered falling stone chips; no cartoon wah or low boom')
export('sfx_total_mult_up',.42,[('inlay_taps',0,mix(.42,[(i*.055,modal(.15,f,.055)*(.3-i*.025)) for i,f in enumerate([760,920,1130,1450,1790])])),('gold_shimmer',.05,noise(.34,2600,6900)*pulse(.34,.025,.12)*.15)],-13,'Five restrained gold-inlay ticks follow the 400 ms cumulative count')
export('sfx_total_to_win',.28,[('release_air',0,noise(.28,700,5500)*pulse(.28,.003,.055)*.4),('score_seal',.10,modal(.18,1550,.075)*.5)],-12,'Short plate-to-score release and a precise score seal, without a long electronic sweep')
export('sfx_mult_count',.24,[('fine_ticking',0,mix(.24,[(i*.048,modal(.043,1180+i*37,.008)*.25) for i in range(5)])),('soft_grain',0,noise(.24,1800,4200)*pulse(.24,.001,.035)*.055)],-22,'Quiet fine-grained counting texture; leaves amount and impact readable',True)

meta_path=HERE/'audio_metadata.json';meta=json.loads(meta_path.read_text(encoding='utf-8'));meta['files']=[new.get(item['cue'],item) for item in meta['files']];meta['runtime_bytes']=sum(item['bytes'] for item in meta['files']);meta['multiplier_design_version']=4;assert meta['runtime_bytes']<12_000_000
meta_path.write_text(json.dumps(meta,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
report={'version':4,'seed':2026102502,'provenance':'Original deterministic material synthesis; no downloaded samples, models, third-party recordings or voices.','formats':'Mono PCM16 44.1k runtime; PCM24 48k masters; editable float stems','cues':list(new.values())}
(HERE/'MULTIPLIER_V4_SOUND_DESIGN.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
montage=mix(3.4,[(0,mixes['sfx_gaze_charge']*.65),(.2,mixes['sfx_glasses_slide']*.85),(.6,mixes['sfx_gaze_beam']*.75),(1.45,mixes['sfx_orb_fly']*.8),(2.05,mixes['sfx_orb_hit_m']), (2.38,mixes['sfx_glasses_on']*.75)]);montage*=10**(-3/20)/max(1e-9,np.abs(montage).max());wavfile.write(HERE/'MULTIPLIER_V4_SOUND_DESIGN.wav',FS,(montage*32767).astype(np.int16))
print(json.dumps({'updatedCues':len(new),'runtimeBytes':meta['runtime_bytes'],'maximumTruePeakDb':max(x['true_peak_db'] for x in new.values())},indent=2))
