"""Heavier wheel arrival from retained CC0 stone, scrape and timpani recordings."""
from pathlib import Path
import json,shutil,math
import numpy as np,soundfile as sf
from scipy.signal import butter,sosfilt,resample_poly
ROOT=Path(__file__).resolve().parent;APP=ROOT.parent;S=ROOT/'source/mummy_audio';D=ROOT/'source/mummy_delivery/audio';OUT=APP/'static/assets/audio/mummy';SR=44100
backup=D/'versions/before_living_audio';backup.mkdir(parents=True,exist_ok=True)
for n in ['scarab_rise.wav','sun_show.ogg']:
 if not (backup/n).exists():shutil.copy2(OUT/n,backup/n)
sources=json.loads((S/'SOURCES.json').read_text(encoding='utf-8'));bank={}
for key in ['stone','stone_scrape','timp']:
 a,sr=sf.read(S/'raw'/(key+'.wav'),always_2d=True);a=a.mean(axis=1)
 if sr!=SR:a=resample_poly(a,SR,sr)
 ix=np.flatnonzero(abs(a)>max(abs(a).max()*.02,1e-5));a=a[max(0,ix[0]-200):] if len(ix) else a
 bank[key]=a/max(abs(a).max(),1e-6)
def pitched(key,rate,n):
 a=bank[key];v=np.interp(np.arange(0,len(a)-1,rate),np.arange(len(a)),a);return np.pad(v[:n],(0,max(0,n-len(v))))
def band(a,lo,hi):return sosfilt(butter(3,[lo,hi],btype='bandpass',fs=SR,output='sos'),a)
def rumble(d):
 n=round(d*SR);a=band(pitched('stone',.43,n),45,680)*.8
 a+=band(pitched('stone',.62,n),70,950)*.35
 a+=band(pitched('stone_scrape',.7,n),220,1700)*.15
 a+=band(pitched('timp',.79,n),42,260)*.2
 a[:int(.012*SR)]*=np.linspace(0,1,int(.012*SR));a[-int(.2*SR):]*=np.linspace(1,0,int(.2*SR));a[-2205:]=0
 a*=10**(-24/20)/(np.sqrt(np.mean(a*a))+1e-9);return a
report=json.loads((S/'audio_report.json').read_text(encoding='utf-8'));licenses=json.loads((S/'LICENSES.json').read_text(encoding='utf-8'))
bed=rumble(.95)
old_rise,_=sf.read(backup/'scarab_rise.wav',always_2d=True)
sf.write(OUT/'scarab_rise.wav',bed,SR,subtype='PCM_16');sf.write(D/'scarab_rise.wav',bed,SR,subtype='PCM_16')
sun,sr=sf.read(backup/'sun_show.ogg',always_2d=True);sun[:len(bed)]+=np.column_stack([bed,bed])*.65
sun*=min(1,10**(-1.5/20)/(abs(resample_poly(sun,4,1,axis=0)).max()+1e-9));sun[-2205:]=0
sf.write(D/'sun_show.wav',sun,SR,subtype='PCM_16')
import imageio_ffmpeg,subprocess
subprocess.run([imageio_ffmpeg.get_ffmpeg_exe(),'-y','-v','error','-i',str(D/'sun_show.wav'),'-c:a','libvorbis','-q:a','4',str(OUT/'sun_show.ogg')],check=True)
for name in ['scarab_rise','sun_show']:
 p=OUT/(name+('.wav' if name=='scarab_rise' else '.ogg'));a,sr=sf.read(p,always_2d=True);tp=20*math.log10(max(abs(resample_poly(a,4,1,axis=0)).max(),1e-10));assert tp<=-1
 row=next(r for r in report if r['name']==name);row.update(duration=len(a)/sr,channels=a.shape[1],true_peak_db=tp,bytes=p.stat().st_size)
 inherited=[r for r in licenses if r['output_filename']==p.name];licenses=[r for r in licenses if r['output_filename']!=p.name]
 for src in inherited+[dict(s,output_filename=p.name)for s in sources if s['id']in ['stone','stone_scrape','timp']]:
  if not any(v['id']==src['id']and v['output_filename']==p.name for v in licenses):licenses.append(src)
(S/'audio_report.json').write_text(json.dumps(report,indent=2));(S/'LICENSES.json').write_text(json.dumps(licenses,indent=2))
old_rms=float(np.sqrt(np.mean(old_rise**2)))*.6;new_rms=float(np.sqrt(np.mean(bed**2)))*.9
result=dict(passed=True,duration=.95,recorded_sources=['stone','stone_scrape','timp'],scarab_bus_gain=.9,arrival_rms_gain_db=20*math.log10(new_rms/max(old_rms,1e-9)),true_peak_dbtp=20*math.log10(abs(resample_poly(bed,4,1)).max()))
(D/'wheel_rumble_report.json').write_text(json.dumps(result,indent=2));print(json.dumps(result,indent=2))
demo=np.concatenate([old_rise.mean(axis=1)*.6,np.zeros(SR//2),bed*.9,np.zeros(SR//2)]);sf.write(D/'wheel_rumble_before_after.wav',demo,SR)
