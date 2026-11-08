"""Sample-based Hijaz score and synchronised foley. No oscillator/noise synthesis."""
from pathlib import Path
import json, math, hashlib, shutil, subprocess
import numpy as np
import soundfile as sf
from scipy.signal import resample_poly, butter, sosfilt
import pyloudnorm as pyln
import imageio_ffmpeg

ROOT=Path(__file__).resolve().parent
SOURCE=ROOT/'source/mummy_audio'; RAW=SOURCE/'raw'
OUT=ROOT.parent/'static/assets/audio/mummy'; OUT.mkdir(parents=True,exist_ok=True)
DELIVERY=ROOT/'source/mummy_delivery/audio'; DELIVERY.mkdir(parents=True,exist_ok=True)
FF=imageio_ffmpeg.get_ffmpeg_exe(); SR=44100; RNG=np.random.default_rng(761107)
SOURCES=json.loads((SOURCE/'SOURCES.json').read_text()); BANK={}; used=set(); license_rows=[]; report=[]
for item in SOURCES:
 p=SOURCE/item['source_file']
 if p.suffix=='.mp3':
  dst=RAW/(item['id']+'.wav')
  subprocess.run([FF,'-y','-v','error','-i',str(p),'-ar',str(SR),str(dst)],check=True)
  p=dst
 a,sr=sf.read(p,dtype='float32',always_2d=True); a=a.mean(axis=1)
 if sr!=SR:a=resample_poly(a,SR,sr)
 active=np.flatnonzero(abs(a)>max(abs(a).max()*.025,.0001))
 if len(active):a=a[max(0,active[0]-120):min(len(a),active[-1]+2000)]
 a/=max(abs(a).max(),.001);BANK[item['id']]=a

def sample(key,duration=None,semitones=0):
 used.add(key); a=BANK[key].copy()
 if semitones:
  rate=2**(semitones/12);a=np.interp(np.arange(0,len(a)-1,rate),np.arange(len(a)),a)
 if duration:
  n=round(duration*SR)
  if len(a)>n:a=a[:n]
  else:a=np.pad(a,(0,n-len(a)))
 return a
def fade(a,tail=.055,head=.001):
 a=a.copy();n=min(len(a),int(tail*SR));m=min(len(a),int(head*SR))
 a[-n:]*=np.linspace(1,0,n).reshape((-1,)+(1,)*(a.ndim-1))
 a[:m]*=np.linspace(0,1,m).reshape((-1,)+(1,)*(a.ndim-1));return a
def blank(d,stereo=False):return np.zeros((round(d*SR),2) if stereo else round(d*SR))
def add(dst,a,at=0,gain=1,pan=0,wrap=False):
 i=round(at*SR);a=a*gain
 if dst.ndim==2 and a.ndim==1:a=np.stack([a*math.sqrt((1-pan)/2),a*math.sqrt((1+pan)/2)],axis=1)
 if wrap:
  idx=(np.arange(len(a))+i)%len(dst);np.add.at(dst,idx,a);return
 n=min(len(a),len(dst)-i)
 if n>0:dst[i:i+n]+=a[:n]
def room(a,wet=.10):
 out=a.copy()
 for d,g in [(.043,.45),(.071,.3),(.113,.2)]:add(out,a,d,wet*g)
 return out
def note(midi,d=.4,key='pluck'):return fade(sample(key,d,midi-(62 if key.startswith('flute') else 60)),min(.09,d*.35))
def phrase(duration,tier=1,gold=False):
 a=blank(duration,True)
 melody=[62,63,66,69,70,74,78,81]
 for i,m in enumerate(melody[:min(8,3+tier)]):
  t=i*min(.24,duration/9);add(a,note(m,.7),t,.38,(-1)**i*.25)
  if tier>2:add(a,note(m-12,.6),t,.18,-.15)
  if tier>3:add(a,note(m,.6,'flute'),t,.16,.2)
 add(a,sample('timp',min(1.0,duration)),0,.38)
 add(a,sample('riq',min(.7,duration)),.02,.16)
 if gold:add(a,sample('zill',min(1.4,duration)),0,.18)
 return room(a)
def save(name,a,loop=False,lufs=None,stereo=False):
 if stereo and a.ndim==1:a=np.stack([a,a],axis=1)
 quiet=min(2205,max(1,round(.005*SR))) if len(a)<=2205 else 2205
 if not loop:
  body=fade(a[:-quiet],tail=min(.055,len(a)/SR*.25))
  a=np.pad(body,((0,quiet),(0,0)) if a.ndim==2 else (0,quiet))
 else:
  # circular overlap tails are mixed before export; exact sample count retained by Ogg granules.
  a=fade(a,.003,.003)
 if lufs is not None:
  loud=pyln.Meter(SR).integrated_loudness(a);a*=10**((lufs-loud)/20)
 peak=float(abs(a).max());a*=min(1,.82/max(peak,.001))
 master=DELIVERY/(name+'.wav');sf.write(master,a,SR,subtype='PCM_16')
 # Runtime uses Vorbis for long assets, keeping WAV masters for lossless editing.
 ext='.ogg' if len(a)>SR*1.5 else '.wav'; target=OUT/(name+ext)
 if ext=='.ogg':subprocess.run([FF,'-y','-v','error','-i',str(master),'-c:a','libvorbis','-q:a','4',str(target)],check=True)
 else:shutil.copy2(master,target)
 decoded,sr=sf.read(target,always_2d=True)
 # 4x oversampled peak catches intersample overshoot.
 tp=float(abs(resample_poly(decoded,4,1,axis=0)).max())
 tail=float(abs(decoded[-quiet:]).max())
 if tp>10**(-1/20):raise RuntimeError((name,'true peak',tp))
 if not loop and tail>10**(-42/20):
  # Last 50 ms stay below the specified delivery ceiling, not merely final sample.
  a[-quiet:]*=.005/max(tail,.005);sf.write(master,a,SR,subtype='PCM_16')
  if ext=='.wav':shutil.copy2(master,target)
  else:subprocess.run([FF,'-y','-v','error','-i',str(master),'-c:a','libvorbis','-q:a','4',str(target)],check=True)
 report.append(dict(name=name,file=target.name,duration=len(a)/SR,channels=1 if a.ndim==1 else 2,loop=loop,true_peak_db=20*math.log10(max(tp,1e-9)),bytes=target.stat().st_size))
 for key in sorted(used):
  row=next(x for x in SOURCES if x['id']==key).copy();row['output_filename']=target.name;license_rows.append(row)
 used.clear()
 return a

def music(bpm,fg=False):
 # Two arranged eight-bar phrases form the 16-bar loop at the requested tempo.
 beat=60/bpm;d=beat*64;a=blank(d,True)
 motif=[62,69,66,63,62,None,60,57,62,None,66,67,69,None,66,63]
 for bar in range(16):
  # Compose the eight-bar phrase; full_music repeats it with a small dynamic change.
  if bar>=8:break
  root=50 if bar%4!=3 else 45
  for b in range(4):
   at=(bar*4+b)*beat
   add(a,sample('dum',.24),at,.21,-.1,True)
   if b in [1,3]:add(a,sample('tek',.18),at+beat*.5,.16,.17,True)
   add(a,note(root,.45),at,.21,-.2,True)
   for sub in [0,.5]:add(a,sample('shaker',.1),at+beat*sub,.035 if not fg else .06,.25,True)
  for i in range(8):
   m=motif[(bar%2)*8+i]
   if m is not None:add(a,note(m,.42),bar*4*beat+i*beat*.5,.16 if not fg else .19,-.18,True)
  if fg:
   add(a,sample('riq',.3),bar*4*beat+beat,.075,.25,True)
   for i,m in enumerate([74,75,78,79,81,78,75,74] if bar%2 else [74,None,78,None,81,None,79,78]):
    if m:add(a,note(m,.3,'flute'),bar*4*beat+i*beat*.5,.10,.18,True)
 return a[:round(32*SR)] if not fg else a[:round(64*60/140/2*SR)]
# Repeat the eight-bar phrase to make 16 bars / 64 beats, retaining exact loop length.
def full_music(bpm,fg):
 short=music(bpm,fg);half=round(32*60/bpm*SR);short=short[:half]
 return np.concatenate([short,short*.96],axis=0)
save('bgm_main',full_music(120,False),True,-20)
save('bgm_freespin',full_music(140,True),True,-20)

save('btn',sample('stone',.075)*.3)
a=blank(.4);add(a,sample('dum',.26),0,.43);add(a,sample('cloth',.32),.02,.12);save('spin',a)
stone=BANK['stone'];hop=256;energy=np.array([np.mean(stone[j:j+hop]**2) for j in range(0,len(stone)-hop,hop)]);peaks=[]
for idx in np.argsort(energy)[::-1]:
 if all(abs(int(idx)-p)*hop>SR*.6 for p in peaks):peaks.append(int(idx))
 if len(peaks)==5:break
for i,(key,peak) in enumerate(zip(['dum','tek','slap','rim','tap'],sorted(peaks)),1):
 used.add('stone');start=max(0,peak*hop-350);cut=stone[start:start+round(.14*SR)];cut=cut/max(abs(cut).max(),.01)
 a=blank(.14);add(a,cut,0,.48);add(a,sample(key,.13),0,.13);save('reel_stop_'+str(i),a)
for i in range(1,6):save('scatter_'+str(i),phrase(.9,i,True).mean(axis=1))
save('win_small',phrase(1.1,1).mean(axis=1));save('win_medium',phrase(2.4,2))
save('line_draw',sample('cloth',.4)*.22)
a=blank(.25);add(a,sample('slap',.15),0,.22);add(a,sample('cat_wave',.19,semitones=2),.03,.17);save('cat_land',a)
for name,d,key in [('scarab_rise',.3,'stone_scrape'),('scarab_press',.3,'frame'),('scarab_tick',.035,'stone'),('scarab_stop',.6,'stone'),('scarab_fly',.3,'cloth'),('scarab_sink',.3,'stone_scrape'),('sun_tick',.028,'rim'),('sun_count',.4,'zill'),('sun_stop',1.3,'timp'),('coin_land',.4,'zill'),('bandage_pop',.3,'cloth')]:
 a=sample(key,d);a=a[::-1] if name.endswith(('fly','sink')) else a
 save(name,room(a*.46,.14))
for i,d in enumerate([.9,1.1,1.4],1):
 a=phrase(d,i).mean(axis=1);add(a,sample('cat_cheer',min(d,.6),i),.12,.18);save('scarab_mult_'+str(i),a)
for i,d in enumerate([3,3.5,4,4.5],1):save('sun_win_'+str(i),phrase(d,i+1,True))
for name,d,tier in [('bigwin_hit',2,3),('win_big',2.4,1),('win_super',3,2),('win_mega',3.6,3),('win_epic',4.2,4),('win_max',4.8,5),('win_panel',1.8,2),('win_cap',3.5,5),('fg_trigger',2.6,3),('fg_intro',2.2,2),('coin_reset',.6,1),('hs_tally',1.5,2),('win_rollup_end',1,2)]:save(name,phrase(d,tier,gold=name in ['win_max','win_cap']))
for name,d,key,gain in [('scarab_button_idle',2,'dum',.09),('reel_tension',2,'tek',.11),('sun_wait_loop',4,'dum',.16),('sun_score_loop',1.2,'riq',.10),('win_rollup_loop',4,'riq',.11)]:
 a=blank(d,name in ['sun_wait_loop','win_rollup_loop','sun_score_loop'])
 for i,at in enumerate(np.arange(0,d,.25 if name!='reel_tension' else .125)):
  add(a,sample(key,.19),float(at),gain*(.7+.3*(i%3)/2),wrap=True)
  if 'rollup' in name or 'score' in name:add(a,note([62,66,69,74][i%4],.21),float(at),.055,wrap=True)
 save(name,room(a,.04),True)
for name,key,d in [('cat_wave','cat_wave',.8),('cat_laugh','cat_laugh',1.6),('cat_cheer','cat_cheer',1.2),('cat_disappoint','cat_disappoint',1.2),('voice_sun_start','cat_cheer',1.4),('voice_levelup_1','cat_wave',1),('voice_levelup_2','cat_laugh',1.2),('voice_levelup_3','cat_cheer',1.6)]:
 a=blank(d);add(a,sample(key,d),0,.48);save(name,a)
a=blank(1)
for at in [0,.12,.27,.5,.62,.76]:add(a,sample('cloth',.24),at,.22 if at!=.5 else .55)
save('bandage_sweep',a)
a=blank(3);cloth=sample('cloth',3);a+=sosfilt(butter(2,250,fs=SR,output='sos'),cloth)*.15;save('tomb_rumble',a)
a=phrase(2.2,2,True);add(a,sample('timp',1),.68,.5);save('sun_show',a)
a=phrase(1.8,2,True);add(a,sample('cloth',1.5),.1,.15);save('sun_start',a)
a=phrase(3,4,True);add(a,phrase(1.5,4,True),.5,.5);save('sun_levelup',a)
a=blank(2,True)
for i in range(12):add(a,sample('riq',.3),i*.12,.11,(-1)**i*.4)
save('coin_shimmer',a)
(SOURCE/'LICENSES.json').write_text(json.dumps(license_rows,indent=2),encoding='utf-8')
(SOURCE/'audio_report.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
preview=blank(82,True)
schedule=[(0,'bgm_main',.5),(4,'spin',1)]+[(4.7+i*.19,'reel_stop_'+str(i+1),1) for i in range(5)]+[(7,'win_small',1),(7,'line_draw',1),(10,'reel_tension',.7),(10.2,'scatter_1',1),(11.2,'scatter_2',1),(12.2,'scatter_3',1),(13.5,'fg_trigger',1),(15.5,'bandage_sweep',1),(17,'scarab_rise',1),(17.3,'scarab_button_idle',.7),(18,'scarab_press',1),(22,'scarab_stop',1),(22.6,'scarab_fly',1),(22.9,'scarab_mult_2',1),(25,'scarab_mult_3',1),(28,'sun_show',1),(30,'sun_wait_loop',.8)]+[(30+i,'sun_count',.8) for i in range(5)]+[(35,'sun_start',1),(40,'sun_stop',1),(41,'sun_levelup',1),(44,'sun_start',1),(49,'sun_levelup',1),(52,'sun_start',1),(57,'sun_win_3',1),(57,'sun_score_loop',1),(62,'win_big',1),(64,'win_rollup_loop',1),(68,'win_mega',1),(71,'win_rollup_end',1),(74,'win_max',1)]
for at,name,g in schedule:
 a,_=sf.read(DELIVERY/(name+'.wav'),always_2d=True);add(preview,a if a.shape[1]==2 else a[:,0],at,g)
preview*=.8/max(abs(preview).max(),.01)
(SOURCE/'preview').mkdir(exist_ok=True);sf.write(SOURCE/'preview/showcase.wav',fade(preview),SR,subtype='PCM_16')
print('Runtime',len(report),'files',round(sum(x['bytes'] for x in report)/1048576,2),'MiB')
# Reapply the reviewed wheel emergence mix after a complete audio regeneration.
import runpy
runpy.run_path(str(Path(__file__).with_name('build_mummy_wheel_rumble.py')),run_name='__main__')
