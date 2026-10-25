"""Original deterministic ceramic clicks, retro synth and pentatonic kitchen loops."""
from pathlib import Path
import json, wave
import numpy as np

APP=Path(__file__).resolve().parents[1]
OUT=APP/'static/assets/audio/sushi'
OUT.mkdir(parents=True,exist_ok=True)
SR=32000
rng=np.random.default_rng(19712026)

def write(path,x):
    x=np.clip(x,-.9,.9)
    with wave.open(str(path),'wb') as w:
        w.setnchannels(1);w.setsampwidth(2);w.setframerate(SR)
        w.writeframes((x*32767).astype('<i2').tobytes())

def note(freq,dur=.22,decay=16):
    t=np.arange(int(SR*dur))/SR
    x=(np.sin(t*freq*2*np.pi)+.22*np.sin(t*freq*4.02*np.pi)+.08*np.sin(t*freq*7.01*np.pi))
    return x*np.exp(-t*decay)*np.minimum(1,t/.004)*.24

def add(dst,src,at,gain=1):
    i=int(at*SR);n=min(len(src),len(dst)-i)
    if n>0:dst[i:i+n]+=src[:n]*gain

names=['btn','spin','reel_stop','sack_land','bandit_land','collect_grab','coin_in','collect_stamp',
 'tumbler_up','dial_tick','reel_tension','alarm_bell','alarm_trip','sack_throw','shutter_down',
 'shutter_slam','safe_open','fs_intro','win_small','win_mid','bill_counter','cash_register',
 'bigwin_slam','win_big','win_super','win_mega','win_epic','win_max','win_cap','voice_laugh','voice_hup']
for n in range(1,6):names.append(f'scatter_{n}')
for i,name in enumerate(names):
    dur=1.9 if name.startswith('win_') or name=='fs_intro' else .65
    x=np.zeros(int(SR*dur));freq=330*2**((i%12)/12)
    if name.startswith('scatter_'):freq=440*2**((int(name[-1])-1)*2/12)
    for j in range(5 if dur>1 else 2):add(x,note(freq*2**(j*2/12),.35),j*.14)
    if any(s in name for s in ('shutter','spin','throw','tension','trip')):
        t=np.arange(len(x))/SR;x+=rng.normal(0,.065,len(x))*np.exp(-t*8)
    if name.startswith('voice'):
        # Nonverbal monkey-like synth chirps, no spoken words.
        x*=.2
        for j in range(6 if name=='voice_laugh' else 2):add(x,note(160+j*18,.1,20),j*.09,.8)
    write(OUT/(name+'.wav'),x)

for mode,bpm in [('main',105),('freespin',120)]:
    beat=60/bpm;dur=32*beat;x=np.zeros(int(SR*dur))
    scale=[293.66,329.63,349.23,440,466.16,587.33]
    phrase=[0,2,3,1,0,4,3,2,0,1,3,5,4,3,2,1]
    for step in range(64):
        at=step*beat/2
        if step%2==0 or mode=='freespin':add(x,note(scale[phrase[step%16]],.35,13),at,.45)
        if step%4==0:add(x,note(scale[0]/4,.5,9),at,.75)
        if step%4==2:add(x,note(110,.12,35),at,.4)
        if step%2==1:
            tick=rng.normal(0,.035,int(SR*.055))*np.exp(-np.arange(int(SR*.055))/SR*90)
            add(x,tick,at,.5)
    # Exact loop length; endpoint is silent and tail fits inside the phrase.
    x[-300:]*=np.linspace(1,0,300)
    write(OUT/f'bgm_{mode}.wav',x)

# Legacy generic-event sprite remains available with fresh synthesized samples.
p=APP/'static/assets/audio/sounds.json'; spec=json.loads(p.read_text())
end=max(v[0]+v[1] for v in spec['sprite'].values())/1000
x=np.zeros(int(SR*(end+.1)))
for i,(_,v) in enumerate(spec['sprite'].items()):
    at=v[0]/1000;dur=v[1]/1000
    add(x,note(330*2**((i%12)/12),min(.5,dur)),at,.7)
write(APP/'static/assets/audio/sounds.wav',x)
print('Wrote 38 original Sushi Monkey cues and generic event atlas')
