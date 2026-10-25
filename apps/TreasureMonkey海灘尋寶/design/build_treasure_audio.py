"""Original, deterministic Treasure Monkey synthesis. No external recordings or melodies."""
from pathlib import Path
import json, wave, subprocess
import numpy as np
import imageio_ffmpeg

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'static/assets/audio/treasure'
MASTER=ROOT/'design/source/treasure/audio'
OUT.mkdir(parents=True,exist_ok=True); (OUT/'sfx').mkdir(exist_ok=True); MASTER.mkdir(parents=True,exist_ok=True)
FFMPEG=imageio_ffmpeg.get_ffmpeg_exe()
SR=44100
rng=np.random.default_rng(181026)
def envelope(t,d): return np.minimum(t/.003,1)*np.minimum((d-t)/.025,1).clip(0,1)
def tone(f,d,kind='bell'):
 t=np.arange(round(d*SR))/SR
 if kind=='accordion':
  x=sum((.55**(h-1))*np.sin(2*np.pi*f*h*t+0.018*np.sin(2*np.pi*4.8*t)) for h in range(1,7)); env=(1-np.exp(-t*90))*np.exp(-t/d*2.3)
 elif kind=='guitar':
  x=sum(np.sin(2*np.pi*f*h*t)*np.exp(-t*(3+h*3))/h**1.25 for h in range(1,9)); env=1
 elif kind=='bass': x=np.sin(2*np.pi*f*t)+.22*np.sin(4*np.pi*f*t); env=np.exp(-t*8)
 elif kind=='whistle': x=np.sin(2*np.pi*f*t+.035*np.sin(2*np.pi*5*t)); env=np.sin(np.pi*t/d)**.8
 else: x=sum(np.sin(2*np.pi*f*h*t)*np.exp(-t*(6+h*4))/h**1.6 for h in [1,2,3,5]); env=1
 return x*env*envelope(t,d)
def noise(d,decay=8):
 t=np.arange(round(d*SR))/SR; n=rng.standard_normal(len(t)); n=n-np.convolve(n,np.ones(35)/35,'same')
 return n*np.exp(-t*decay)*envelope(t,d)
def mix(parts,d):
 x=np.zeros(round(d*SR))
 for at,sound,gain in parts:
  i=round(at*SR); end=min(len(x),i+len(sound))
  if end>i:x[i:end]+=sound[:end-i]*gain
 return x
def write(path,x,peak=.77):
 x=np.asarray(x); x=x/(max(np.max(np.abs(x)),1e-9))*peak
 with wave.open(str(path),'wb') as w:
  w.setparams((1 if x.ndim==1 else x.shape[1],2,SR,0,'NONE','not compressed')); w.writeframes((x*32767).astype('<i2').tobytes())
def encode(src,dst,*args): subprocess.run([FFMPEG,'-v','error','-y','-i',str(src),*args,str(dst)],check=True)
def beep_run(d=.75):
 parts=[]; at=0
 while at<d-.08:
  u=at/d; parts.append((at,tone(760+u*260,.06,'whistle'),.45)); at+=.16-.10*u
 return mix(parts,d)
def coin(d=.45,f=1400):
 t=np.arange(round(d*SR))/SR
 return (np.sin(2*np.pi*f*t)*np.exp(-t*13)+.5*np.sin(2*np.pi*f*2.73*t)*np.exp(-t*22)+.22*np.sin(2*np.pi*f*4.11*t)*np.exp(-t*30))*envelope(t,d)
def flourish(d,steps):
 scale=[62,66,69,74,78,81,86,90]
 parts=[(i*d/(steps+2),tone(440*2**((scale[i%8]-69)/12),min(.8,d-i*d/(steps+2)),'accordion'),.37) for i in range(steps)]
 parts+=[(min(d-.2,.13*i),coin(.18,1150+70*i),.10) for i in range(steps)]
 return mix(parts,d)
cues={
 'btn':coin(.11,950), 'spin':mix([(0,beep_run(.28),.5),(.07,tone(587,.28,'accordion'),.3)],.38),
 'reel_stop':mix([(0,noise(.18,23),.40),(.015,coin(.13,540),.14)],.22),
 'reel_tension':beep_run(1.2), 'pluck_low':coin(.28,1100),
 'win_line_tick':coin(.25,1280), 'coin_shimmer':coin(.6,1500),
 'wild_expand':mix([(0,beep_run(.55),.45),(.52,noise(.45,12),.25),(.6,coin(.5,1250),.35)],1.15),
 'frame_big_land':mix([(0,noise(.32,13),.55),(.07,tone(146,.28,'bass'),.3)],.42),
 'mult_update':mix([(0,tone(880,.12,'whistle'),.4),(.10,coin(.35,1550),.4)],.5),
 'wave_transition':noise(.95,1.8)*np.sin(np.linspace(0,np.pi,round(.95*SR))),
 'sand_loop':noise(.8,0)*.4,
}
for i in range(1,6): cues[f'scatter_{i}']=mix([(0,tone(560*2**(i/12),.22,'whistle'),.4),(.07,coin(.34,900+140*i),.35)],.48)
for name,d,steps in [('win_gliss',.8,4),('win_gliss_big',1.2,6),('win_step_1',.62,3),('win_step_2',.82,4),('win_step_3',1.02,5),('win_step_4',1.24,6),('win_tier_big',1.62,7),('win_tier_super',2.3,9),('win_tier_mega',3.05,11),('win_tier_epic',4.35,14),('win_tier_max',5.65,18),('gong_feature',1.1,6),('bigwin_blast',1.35,7),('fs_intro',1.6,8),('fs_outro',1.9,9),('win_cap',2.4,12)]: cues[name]=flourish(d,steps)
for name,x in cues.items(): write(OUT/'sfx'/f'{name}.wav',x)
def bgm(bpm):
 beat=60/bpm; length=round(32*beat*SR); stereo=np.zeros((length,2))
 def add(at,x,gain,pan=0):
  ids=(np.arange(len(x))+round(at*SR))%length
  stereo[ids,0]+=x*gain*np.sqrt((1-pan)/2); stereo[ids,1]+=x*gain*np.sqrt((1+pan)/2)
 chords=[[62,66,69],[59,62,66],[55,59,62],[57,61,64]]
 melody=[74,78,81,78,76,74,69,73,74,78,76,69,67,71,74,73,78,81,86,81,78,76,74,69,71,74,78,74,73,69,73,74]
 for b in range(32):
  chord=chords[(b//4)%4]; at=b*beat
  add(at,tone(440*2**((chord[0]-12-69)/12),beat*.85,'bass'),.22,-.1)
  for j,note in enumerate(chord): add(at+.02*j,tone(440*2**((note-69)/12),beat*.8,'guitar'),.15,.4)
  add(at,noise(.1,38),.035,-.4)
  if b%2:add(at,noise(.12,24),.07,.15)
  add(at+beat*.5,noise(.055,55),.022,-.3)
  add(at,tone(440*2**((melody[b]-69)/12),beat*.74,'accordion'),.12,-.25)
  if b>=16 and b%2==0:add(at+beat*.5,tone(440*2**((melody[b]+12-69)/12),beat*.45,'whistle'),.045,.3)
 for delay,gain in [(0.043,.12),(.079,.08),(.127,.04)]: stereo+=np.roll(stereo,round(delay*SR),axis=0)*gain
 peak=np.max(np.abs(stereo)); stereo=stereo/max(peak,1e-9)*.65
 return stereo
for name,bpm in [('bgm_main',112),('bgm_freespin',132)]:
 wav=MASTER/f'{name}_44k.wav'; write(wav,bgm(bpm),.65)
 encode(wav,MASTER/f'{name}_master.wav','-ar','48000','-c:a','pcm_s24le')
 encode(wav,OUT/f'{name}.mp3','-c:a','libmp3lame','-b:a','192k')

# Replace every legacy fallback sprite cue too, so an uncommon event cannot play donor audio.
old=json.loads((ROOT/'static/assets/audio/sounds.json').read_text(encoding='utf-8-sig'))
sprite={}; tracks=[]; cursor=0
for name,entry in old['sprite'].items():
 if name.startswith('bgm_'): x=bgm(132 if 'freespin' in name else 112); x=x[:min(len(x),8*SR)].mean(axis=1)
 elif 'scatter' in name:x=cues['scatter_3']
 elif 'wild' in name:x=cues['wild_expand']
 elif 'btn' in name:x=cues['spin' if 'spin' in name else 'btn']
 elif 'reel' in name or 'landing' in name:x=cues['reel_stop']
 elif 'anticipation' in name:x=cues['reel_tension']
 elif 'win' in name or 'tumble' in name:x=cues['win_gliss']
 else:x=cues['mult_update']
 x=x/max(np.max(np.abs(x)),1e-9)*.6
 sprite[name]=[round(cursor/SR*1000,3),round(len(x)/SR*1000,3),bool(len(entry)>2 and entry[2])]
 tracks.extend([x,np.zeros(round(.12*SR))]); cursor+=len(x)+round(.12*SR)
write(MASTER/'treasure_sprite.wav',np.concatenate(tracks),.72)
encode(MASTER/'treasure_sprite.wav',OUT/'treasure_sprite.mp3','-c:a','libmp3lame','-b:a','192k')
old['sprite']=sprite; old['src']=['./assets/audio/treasure/treasure_sprite.mp3']; old.pop('urls',None)
(OUT/'sounds.json').write_text(json.dumps(old,indent=2),encoding='utf-8')
(MASTER/'README.md').write_text('Original deterministic synthesis by build_treasure_audio.py. No sampled recordings, no borrowed melody. Main 112 BPM and feature 132 BPM, D major, 16 two-beat bars. Accordion-like reeds, plucked guitar, upright-bass-like sine body, cajon noise and whistle. SFX 44.1 kHz mono PCM16, BGM MP3 stereo 192 kbps; masters 48 kHz PCM24. Subject to listening and final mix review.\n',encoding='utf-8')
report={name:{'seconds':len(x)/SR,'peak_dbfs':float(20*np.log10(.77))} for name,x in cues.items()}
(MASTER/'manifest.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
print(f'Wrote {len(cues)} original cues, 2 music loops, and {len(sprite)} fallback sprite entries; {sum(p.stat().st_size for p in OUT.rglob("*") if p.is_file())/1e6:.2f} MB runtime')
