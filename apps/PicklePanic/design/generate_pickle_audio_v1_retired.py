"""Original garage-synth score and glass/pressure/comic effects, no sampled audio."""
from pathlib import Path
import json, wave
import numpy as np

APP=Path(__file__).resolve().parents[1]
OUT=APP/'static/assets/audio/pickle';OUT.mkdir(parents=True,exist_ok=True)
SR=32000
rng=np.random.default_rng(12102026)

def write(path,x):
    x=np.tanh(x*1.15)*.72
    fade=min(400,len(x)//4);x[:fade]*=np.linspace(0,1,fade);x[-fade:]*=np.linspace(1,0,fade)
    with wave.open(str(path),'wb') as w:
        w.setnchannels(1);w.setsampwidth(2);w.setframerate(SR);w.writeframes((x*32767).astype('<i2').tobytes())

def note(f,d=.35,pluck=11):
    t=np.arange(int(SR*d))/SR
    return np.tanh(1.6*(np.sin(2*np.pi*f*t)+.3*np.sin(6*np.pi*f*t)+.16*np.sin(10*np.pi*f*t)))*np.exp(-t*pluck)*.28

def add(dst,src,at,gain=1):
    i=int(at*SR);n=min(len(src),len(dst)-i)
    if i>=0 and n>0:dst[i:i+n]+=src[:n]*gain

names=['btn','spin','reel_stop','sack_land','bandit_land','collect_grab','coin_in','collect_stamp','tumbler_up','dial_tick','reel_tension','alarm_bell','alarm_trip','sack_throw','shutter_down','shutter_slam','safe_open','fs_intro','win_small','win_mid','bill_counter','cash_register','bigwin_slam','win_big','win_super','win_mega','win_epic','win_max','win_cap','voice_laugh','voice_hup','door_slide','door_clack','door_open']+[f'scatter_{i}'for i in range(1,6)]
for i,name in enumerate(names):
    d=1.6 if name.startswith('win_') or name=='fs_intro' else .65
    x=np.zeros(int(SR*d));t=np.arange(len(x))/SR;f=220*2**((i%9)/12)
    if name.startswith('scatter_'):f=440*2**((int(name[-1])-1)*2/12)
    if name in ['sack_land','collect_grab','coin_in','dial_tick']:
        x=np.sin(t*2*np.pi*(1200+i*43))*np.exp(-t*25)*.27+np.sin(t*2*np.pi*710)*np.exp(-t*38)*.12
    elif name.startswith('door_') or name in ['shutter_down','shutter_slam','spin','sack_throw','alarm_trip']:
        x=rng.normal(0,.1,len(x))*np.exp(-t*7)+np.sin(2*np.pi*(95*t+35*t*t))*np.exp(-t*9)*.22
        if 'clack' in name or 'slam' in name:x+=rng.normal(0,.24,len(x))*np.exp(-t*40)
    elif name.startswith('voice_'):
        for j in range(3 if name=='voice_laugh' else 1):add(x,note(115+j*13,.14,12),j*.17,.8)
    else:
        for j in range(4 if d>1 else 2):add(x,note(f*2**(j*3/12),.4),j*.12,.8)
    write(OUT/(name+'.wav'),x)

for mode,bpm in [('main',110),('freespin',126)]:
    beat=60/bpm;dur=32*beat;x=np.zeros(int(SR*dur));scale=[110,130.81,146.83,164.81,196,220]
    riff=[0,0,2,3,0,4,3,2,0,1,2,4,3,2,1,0]
    for step in range(64):
        at=step*beat/2
        add(x,note(scale[riff[step%16]]*2,.34,10),at,.65 if mode=='main' else .8)
        if step%2==0:add(x,note(scale[riff[step%16]]/2,.4,8),at,.6)
        if step%4==0:
            t=np.arange(int(SR*.15))/SR;add(x,np.sin(2*np.pi*(60*t+35*(1-np.exp(-t*22))/22))*np.exp(-t*25)*.35,at)
        if step%4==2:
            t=np.arange(int(SR*.14))/SR;add(x,rng.normal(0,.15,len(t))*np.exp(-t*35),at)
        if step%2==1:
            t=np.arange(int(SR*.045))/SR;add(x,rng.normal(0,.08,len(t))*np.exp(-t*90),at)
    write(OUT/f'bgm_{mode}.wav',x)

spec=json.loads((APP/'static/assets/audio/sounds.json').read_text())
end=max(v[0]+v[1]for v in spec['sprite'].values())/1000;x=np.zeros(int(SR*(end+.1)))
for i,(_,v) in enumerate(spec['sprite'].items()):add(x,note(330*2**((i%10)/12),min(.4,v[1]/1000)),v[0]/1000,.6)
write(APP/'static/assets/audio/sounds.wav',x)
print('Generated 39 original glass/pressure/comic cues and two garage-synth loops.')
