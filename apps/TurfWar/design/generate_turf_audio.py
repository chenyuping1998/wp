"""Deterministic original boom-bap loop and street Foley for Turf War."""
from pathlib import Path
import shutil, wave
import numpy as np

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT/'static/assets/audio/turf'
SR=44100
rng=np.random.default_rng(3016)
OUT.mkdir(parents=True,exist_ok=True)
shutil.copytree(ROOT/'static/assets/audio/capo/sfx',OUT/'sfx',dirs_exist_ok=True)
def time(n): return np.arange(round(n*SR))/SR
def noise(n):
    x=rng.normal(0,1,round(n*SR))
    return np.convolve(x,np.ones(5)/5,mode='same')
def kick():
    t=time(.38);return np.sin(2*np.pi*(48*t+4*(1-np.exp(-t*35))))*np.exp(-t*12)
def snare():
    t=time(.22);return (noise(.22)*.7+np.sin(2*np.pi*175*t)*.3)*np.exp(-t*24)
def hat():
    t=time(.07);x=rng.normal(0,1,len(t));return np.diff(x,prepend=0)*np.exp(-t*75)*.12
def put(x,s,at,g=1):
    i=round(at*SR);n=min(len(s),len(x)-i)
    if n>0:x[i:i+n]+=s[:n]*g
def save(name,x):
    x=np.tanh(x)*.72
    x[:220]*=np.linspace(0,1,220);x[-440:]*=np.linspace(1,0,440)
    with wave.open(str(OUT/name),'wb') as f:
        f.setnchannels(1);f.setsampwidth(2);f.setframerate(SR);f.writeframes((x*32767).astype('<i2').tobytes())
for mode,bpm in [('base',78),('feature',88)]:
    beat=60/bpm;x=np.zeros(round(beat*32*SR))
    for b in range(32):
        if b%4 in (0,2):put(x,kick(),b*beat,.65)
        if b%4 in (1,3):put(x,snare(),b*beat,.32)
        put(x,hat(),b*beat,.7);put(x,hat(),(b+.57)*beat,.38)
        if b%2==0:
            t=time(beat*1.7);freq=[49,49,58.27,43.65][(b//8)%4]
            bass=np.sin(2*np.pi*freq*t)*np.exp(-t*2)*.22
            put(x,bass,b*beat)
    save('bgm_'+mode+'.wav',x)
t=time(.7);s=noise(.7)*np.exp(-((t-.16)/.075)**2)*.65
put(s,kick(),.19,.8)
for at in [.23,.29,.37,.44]:
    tt=time(.12);chip=(np.sin(2*np.pi*2100*tt)+np.sin(2*np.pi*3370*tt))*np.exp(-tt*43)*.12
    put(s,chip,at)
save('sfx/sw_bat_swing.wav',s)
t=time(.8);slam=noise(.8)*np.exp(-t*11)*.45+np.sin(2*np.pi*82*t)*np.exp(-t*8)*.4
for at in [.09,.17,.26]:put(slam,snare(),at,.22)
save('sfx/shutter_slam.wav',slam)
save('sfx/frame_big_land.wav',kick()*.8)
t=time(1.2);build=np.sin(2*np.pi*(42*t+18*t*t))*(t/1.2)*.28
for at in [.15,.32,.49,.66,.83]:put(build,kick(),at,.25)
put(build,slam,.9,.65);save('sfx/big_score_buildup.wav',build)
save('sfx/reel_tension.wav',np.sin(2*np.pi*55*time(1.6))*(.25+.15*np.sin(2*np.pi*5*time(1.6))))
save('sfx/bigwin_blast.wav',slam*.8)
print('Turf War boom-bap and Foley exported')
