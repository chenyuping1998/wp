"""Check the decoded wheel cues at their actual playback gain; export A/B demo."""
from pathlib import Path
import json,math,re,subprocess
import numpy as np,soundfile as sf
from scipy.signal import resample_poly
APP=Path(__file__).resolve().parent.parent
OUT=APP/'design/source/mummy_delivery/audio';OUT.mkdir(parents=True,exist_ok=True)
src=(APP/'src/components/Sound.svelte').read_text(encoding='utf-8')
master=float(re.search(r'master\.gain\.value=([\d.]+)',src)[1])
old={'scarabTick':.27,'scarabStop':.8,'scarabMult':.8,'sunTick':.24,'sunStop':.85,'sunWin':.85}
gains={cue:float(re.search(r"case '"+cue+r"':([^\n]+)",src)[1].split('playCnSfx(',1)[1].rsplit(',',1)[1].split(')',1)[0])for cue in old}
files={'scarabTick':['scarab_tick.wav'],'scarabStop':['scarab_stop.wav'],'scarabMult':[f'scarab_mult_{n}.wav'for n in range(1,4)],'sunTick':['sun_tick.wav'],'sunStop':['sun_stop.wav'],'sunWin':[f'sun_win_{n}.ogg'for n in range(1,5)]}
audio={};rows=[]
for cue,names in files.items():
 for name in names:
  a,sr=sf.read(APP/'static/assets/audio/mummy'/name,always_2d=True);assert sr==44100
  if a.shape[1]==1:a=np.repeat(a,2,axis=1)
  audio[name]=a
  peak=float(abs(resample_poly(a,4,1,axis=0)).max())*gains[cue]*master
  rows.append(dict(cue=cue,file=name,oldGain=old[cue],newGain=gains[cue],increaseDb=20*math.log10(gains[cue]/old[cue]),effectiveTruePeakDbtp=20*math.log10(max(peak,1e-10))))
assert all(r['increaseDb']>2 and r['effectiveTruePeakDbtp']<-1 for r in rows)
# Use the actual production braking curve to schedule ticks, including its
# 25ms retrigger guard. This is an A/B cue demonstration before compression.
node=APP.parents[2]/'tools/node-v22.23.1-win-x64/node.exe'
script="import{scarabSpinProgress}from'./src/game/scarabPresentation.ts';console.log(JSON.stringify(Array.from({length:235},(_,i)=>({t:i/60,o:39.55*scarabSpinProgress(Math.min(1,i/234))}))))"
frames=json.loads(subprocess.run([str(node),'--input-type=module','-e',script],cwd=APP,text=True,capture_output=True,check=True).stdout)
ticks=[];lastSeg=0;lastTick=-1
for f in frames:
 seg=math.floor(f['o']+.5)
 if seg!=lastSeg:
  lastSeg=seg
  if f['t']-lastTick>=.025:ticks.append(f['t']);lastTick=f['t']
def scarab_demo(g):
 a=np.zeros((round(7.1*44100),2))
 def put(name,t,cue):
  b=audio[name]*g[cue]*master;k=round(t*44100);a[k:k+len(b)]+=b
 for t in ticks:put('scarab_tick.wav',t,'scarabTick')
 put('scarab_stop.wav',4.26,'scarabStop');put('scarab_mult_2.wav',5.06,'scarabMult')
 return a
demo=np.concatenate([scarab_demo(old),np.zeros((22050,2)),scarab_demo(gains)])
assert abs(resample_poly(demo,4,1,axis=0)).max()<10**(-1/20)
sf.write(OUT/'wheel_volume_before_after.wav',demo,44100,subtype='PCM_16')
report=dict(passed=True,rows=rows,masterGain=master,preview='wheel_volume_before_after.wav',previewOrder='old general wheel, 0.5 second pause, new general wheel',scope='Decoded individual cue peaks at maximum SFX bus, before the existing master compressor; A/B includes ticks, stop and multiplier selection. Player volume/mute remain connected to the original SFX bus.')
(OUT/'wheel_volume_verification.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
print(json.dumps({k:report[k]for k in ['passed','masterGain','previewOrder']},indent=2));print('Gain increases dB:',{c:round(20*math.log10(gains[c]/old[c]),2)for c in old});print('Highest effective cue true peak dBTP:',round(max(r['effectiveTruePeakDbtp']for r in rows),2))
