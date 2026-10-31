"""Original layered casting accents, punchier flight and impact. No samples.

Keeps the 350ms charge / 600ms flight clock. Voice remains synthetic nonverbal
sound design. Run after the base library exists; only seven cues are changed.
"""
from pathlib import Path
import importlib.util,json,shutil
import numpy as np
from scipy.signal import butter,sosfilt
from scipy.io import wavfile

HERE=Path(__file__).resolve().parent
spec=importlib.util.spec_from_file_location('base_audio',HERE/'generate_audio.py');base=importlib.util.module_from_spec(spec);spec.loader.exec_module(base)
FS=48000;RNG=np.random.default_rng(2026103008);STEMS=HERE/'casting-v8-stems';STEMS.mkdir(exist_ok=True)
new={};mixes={}
def noise(d,lo,hi):return sosfilt(butter(3,[lo,hi],'bandpass',fs=FS,output='sos'),RNG.normal(0,1,round(d*FS)))
def envelope(d,attack=.001,decay=.09):
    t=np.arange(round(d*FS))/FS;x=(1-np.exp(-t/attack))*np.exp(-t/decay);x[-240:]*=np.linspace(1,0,min(len(x),240));return x
def tone(d,hz,decay=.1):
    t=np.arange(round(d*FS))/FS;return (np.sin(2*np.pi*hz*t)+.24*np.sin(2*np.pi*hz*2.01*t))*envelope(d,.001,decay)
def mix(d,layers):
    out=np.zeros(round(d*FS))
    for at,x in layers:
        i=round(at*FS);n=min(len(x),len(out)-i)
        if n>0:out[i:i+n]+=x[:n]
    return out
def export(name,d,layers,peak,description):
    parts=[]
    for label,at,x in layers:
        padded=mix(d,[(at,x)]);parts.append(padded);wavfile.write(STEMS/f'{name}__{label}.wav',FS,padded.astype(np.float32))
    x=sum(parts);x-=x.mean();x=np.tanh(x*1.15);x*=10**(peak/20)/max(1e-9,np.abs(x).max());x[:8]*=np.linspace(0,1,8);x[-240:]*=np.linspace(1,0,240)
    source=STEMS/f'{name}__mix.wav';wavfile.write(source,FS,x.astype(np.float32));master=HERE/'masters'/f'{name}.wav';runtime=base.RUNTIME/f'{name}.wav'
    for p in [master,runtime]:
        old=HERE/'casting-v8-before'/('master' if p==master else 'runtime')/p.name
        if p.exists() and not old.exists():old.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(p,old)
    base.run('-y','-i',source,'-ar',48000,'-ac',1,'-c:a','pcm_s24le',master);base.run('-y','-i',source,'-ar',44100,'-ac',1,'-c:a','pcm_s16le',runtime)
    level=base.measure(runtime,d);assert level['true_peak_db']<=-1
    new[name]={'cue':name,'file':runtime.name,'duration':d,'sample_rate':44100,'channels':1,'format':'PCM16','bytes':runtime.stat().st_size,'loop':False,'description':description,'lufs_method':'complete cue repeated to >=3 s',**level,'design_version':8,'layers':[row[0] for row in layers]};mixes[name]=x

d=.35;t=np.arange(round(d*FS))/FS;swell=(.18+.82*(t/d)**1.7)*np.minimum(1,t/.003);phase=2*np.pi*np.cumsum(210+220*(t/d)**2)/FS
export('sfx_orb_charge',d,[('palm_resonance',0,(np.sin(phase)+.2*np.sin(phase*2.03))*swell*.30),('inward_air',0,noise(d,650,4400)*swell*.36),('gather_grain',0,noise(d,2600,8200)*(.3+.7*np.sin(2*np.pi*32*t)**2)*swell*.12)],-12.5,'350ms inward swell aligned to visible orb growth and squeeze')
export('sfx_orb_release',.16,[('palm_snap',0,noise(.055,1500,9200)*envelope(.055,.0005,.012)*.5),('pressure_body',0,tone(.16,132,.045)*.65),('low_thump',.003,tone(.14,67,.035)*.30),('bright_edge',.018,tone(.12,2050,.028)*.15)],-8.5,'One short palm snap and pressure thump at actual release, once per volley')
d=.46;t=np.arange(round(d*FS))/FS
voice=base.voiced(d,[(0,206),(.14,235),(.42,186),(1,142)],'gasp');vocal_env=np.minimum(1,t/.018)*np.exp(-np.maximum(0,t-.14)/.18)
export('vo_medusa_cast',d,[('alto_shout',0,voice*.8),('chest_resonance',0,(np.sin(2*np.pi*104*t)+.18*np.sin(2*np.pi*207*t))*vocal_env*.25),('breath_grit',0,noise(d,780,4300)*vocal_env*.20)],-9,'Synthetic nonverbal chest-led casting shout; attack occurs near the release flick, not a human voice recording')
d=.60;t=np.arange(round(d*FS))/FS;shape=(.28+.72*np.sin(np.pi*np.minimum(1,t/.59))**.8)*np.minimum(1,t/.002)
export('sfx_orb_fly',d,[('wind_pressure',0,noise(d,190,2300)*shape*.7),('air_shear',0,noise(d,1900,7500)*shape**1.5*.26),('rotating_glass',0,(tone(d,1280,.3)+tone(d,1937,.24))*(.3+.7*np.sin(2*np.pi*16*t)**2)*.16)],-11.5,'600ms layered wind pressure, shear and rotating glass; positional pan follows the thrown orb')
for size,d,f,peak in [('s',.42,1130,-9.5),('m',.50,980,-8.5),('l',.58,820,-7.5)]:
    export('sfx_orb_hit_'+size,d,[('contact_crack',0,noise(.075,1100,8200)*envelope(.075,.0005,.014)*.42),('marble_weight',0,tone(d,155 if size=='l' else 185,.065)*.62),('low_impact',.003,tone(.22,64 if size=='l' else 78,.055)*.30),('crystal_body',.005,(tone(d,f,.18)+tone(d,f*1.51,.13)*.42)*.48),('glitter_tail',.065,mix(d-.065,[(i*.052,tone(.12,f*(2.1+i*.4),.025)*(.10-i*.018)) for i in range(4)]))],peak,'Sharp contact, low stone weight, crystal body and short sparkle tail; '+size+' intensity')

path=HERE/'audio_metadata.json';meta=json.loads(path.read_text(encoding='utf-8'));known={item['cue'] for item in meta['files']};meta['files']=[new.get(item['cue'],item) for item in meta['files']]+[item for name,item in new.items() if name not in known];meta['runtime_bytes']=sum(item['bytes'] for item in meta['files']);meta['casting_design_version']=8;assert meta['runtime_bytes']<12_000_000;path.write_text(json.dumps(meta,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
report={'version':8,'seed':2026103008,'provenance':'Original deterministic synthesis. No external recordings or samples. Cast voice remains a synthetic nonverbal sketch.','formats':'PCM16 44.1k mono runtime, PCM24 48k mono masters, float editable stems','timing':{'chargeMs':350,'voiceBeforeReleaseMs':100,'releaseAccentMs':160,'flightMs':600},'cues':list(new.values())}
(HERE/'CASTING_V8_SOUND_DESIGN.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
montage=mix(3.4,[(1.10,mixes['sfx_orb_charge']*.95),(1.35,mixes['vo_medusa_cast']*1.7),(1.45,mixes['sfx_orb_release']*1.1),(1.45,mixes['sfx_orb_fly']*1.4),(2.05,mixes['sfx_orb_hit_m']*1.15)]);montage=np.tanh(montage*1.2);montage*=10**(-3/20)/max(1e-9,np.abs(montage).max());wavfile.write(HERE/'CASTING_V8_SOUND_DESIGN.wav',FS,(montage*32767).astype(np.int16))
print(json.dumps({'updatedCues':len(new),'totalCues':len(meta['files']),'runtimeBytes':meta['runtime_bytes'],'maximumTruePeakDb':max(item['true_peak_db'] for item in new.values())},indent=2))
