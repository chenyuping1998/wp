"""75-second arranged audition with real wheel tick deceleration and all feature beds."""
from pathlib import Path
import json,subprocess
import numpy as np
import soundfile as sf
import imageio_ffmpeg
ROOT=Path(__file__).resolve().parent;SRC=ROOT/'source/mummy_delivery/audio';OUT=ROOT/'source/mummy_audio/preview';OUT.mkdir(exist_ok=True)
SR=44100;mix=np.zeros((SR*75,2));schedule=[]
def add(name,at,gain=1,duration=None,loop=False):
 a,_=sf.read(SRC/(name+'.wav'),always_2d=True)
 if a.shape[1]==1:a=np.repeat(a,2,axis=1)*.707
 if duration:
  n=round(duration*SR)
  if loop:a=np.tile(a,(int(np.ceil(n/len(a))),1))
  a=a[:n].copy();fade=min(round(.08*SR),len(a));a[-fade:]*=np.linspace(1,0,fade)[:,None]
 start=round(at*SR);n=min(len(a),len(mix)-start)
 if n>0:mix[start:start+n]+=a[:n]*gain
 schedule.append(dict(clip=name,at=at,gain=gain,duration=n/SR))
add('bgm_main',0,.8,3.2);add('spin',3.5)
for i in range(5):add('reel_stop_'+str(i+1),4.1+i*.19)
add('win_small',5.5);add('line_draw',5.5,.45);add('reel_tension',7,.55,2.7,True)
for i in range(3):add('scatter_'+str(i+1),7+i*.9)
add('fg_trigger',10);add('bandage_sweep',12.1);add('bgm_freespin',12.8,.4,16,True)
for at,tier in [(13.3,2),(21,3)]:
 add('scarab_rise',at,.7);add('scarab_button_idle',at+.3,.4,.6,True);add('scarab_press',at+.9,.8)
 for i in range(1,43):
  t=3.9*(1-(1-i/43)**(1/3));add('scarab_tick',at+1.2+t,.27)
 add('scarab_stop',at+5.1,.8);add('scarab_fly',at+5.7,.55);add('scarab_mult_'+str(tier),at+6,.8);add('scarab_sink',at+7.2,.4)
add('sun_show',29,.8);add('voice_sun_start',29,.5);add('sun_wait_loop',29.68,.55,5,True);add('bgm_main',29,.12,31,True)
for i in range(5):add('sun_count',29.68+i,.55)
for at in [35.2,43.2,51.8]:
 add('sun_start',at,.75)
 for i in range(1,49):add('sun_tick',at+.25+3.9*(1-(1-i/49)**(1/3)),.24)
 add('sun_stop',at+4.15,.85)
for at,n in [(40.65,1),(48.65,2)]:add('sun_levelup',at,.8);add('voice_levelup_'+str(n),at,.6)
add('sun_win_3',56.75,.85);add('sun_score_loop',56.75,.5,1.2,True)
add('bgm_main',60,.25,15,True);add('bigwin_hit',60,.8);add('win_big',60,.8);add('coin_shimmer',60,.4)
add('win_rollup_loop',60.3,.55,7.7,True);add('win_mega',64,.85);add('win_rollup_end',68,.7);add('win_max',70,.9)
mix*=min(1,.82/max(abs(mix).max(),.001));mix[-2205:]*=np.linspace(1,0,2205)[:,None]
sf.write(OUT/'showcase.wav',mix,SR,subtype='PCM_16');(OUT/'showcase_timeline.json').write_text(json.dumps(schedule,indent=2))
subprocess.run([imageio_ffmpeg.get_ffmpeg_exe(),'-y','-v','error','-i',str(OUT/'showcase.wav'),'-c:a','libvorbis','-q:a','5',str(OUT/'showcase.ogg')],check=True)
print('Showcase:75s,',len(schedule),'events, with Scarab and Sun decelerating ticks')
