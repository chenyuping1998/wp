"""Reproducible original alchemy sound design; 44.1k stereo PCM, no stock sprite.
Modal glass, fluid bubbles, filtered pressure, chamber tails and D-dorian score.
Every cue has a unique deterministic seed. Music reverbs wrap across loop edges.
"""
from pathlib import Path
import re, json, wave, hashlib
import numpy as np

APP = Path(__file__).resolve().parents[1]
OUT = APP / 'static/assets/audio/alchemy'
OUT.mkdir(parents=True, exist_ok=True)
SR = 44100
stats = {}
def hz(m): return 440 * 2 ** ((m-69)/12)
def add(dst, src, at=0, gain=1, pan=0):
    i = int(at*SR)
    if i >= len(dst): return
    n=min(len(src),len(dst)-i)
    if src.ndim==1:
        src = np.column_stack((src*np.sqrt((1-pan)/2), src*np.sqrt((1+pan)/2)))
    dst[i:i+n] += src[:n]*gain
def glass(m, seconds=.7, kind=0):
    t=np.arange(int(seconds*SR))/SR; f=hz(m)
    ratios=([1,2.756,5.404,8.93] if kind==0 else [1,2,3.01,4.12])
    v=sum((.65**i)*np.sin(2*np.pi*f*r*t + .018*np.sin(2*np.pi*4.3*t))*np.exp(-t*(3.4+i*3.2)) for i,r in enumerate(ratios))
    return v*np.minimum(1,t/.0025)
def pressure(seconds, rng, gain=1):
    t=np.arange(int(seconds*SR))/SR
    raw=rng.normal(0,1,len(t))
    low=np.convolve(raw,np.ones(19)/19,mode='same')
    deep=np.convolve(raw,np.ones(101)/101,mode='same')
    return (low-deep)*np.sin(np.pi*np.clip(t/seconds,0,1))**1.4*gain
def liquid(seconds, rng, count=12):
    v=np.zeros(int(seconds*SR))
    for _ in range(count):
        at=rng.uniform(.01,max(.02,seconds-.15)); dur=rng.uniform(.035,.13)
        t=np.arange(int(dur*SR))/SR
        f=rng.uniform(380,1250); phase=2*np.pi*f*(t+.012*(1-np.exp(-t/.012)))
        bubble=np.sin(phase)*np.exp(-t*rng.uniform(28,55))*np.minimum(1,t/.001)*rng.uniform(.1,.34)
        i=int(at*SR); n=min(len(bubble),len(v)-i);v[i:i+n]+=bubble[:n]
    return v
def room(v, loop=False):
    out=v.copy()
    for delay,g in [(.037,.13),(.071,.1),(.113,.075),(.193,.05),(.311,.025)]:
        k=int(delay*SR)
        echo=np.roll(v[:,::-1],k,axis=0)
        if not loop: echo[:k]=0
        out+=g*echo
    return out
def save(name,v,loop=False,music=False):
    v=room(v,loop)
    # Smooth soft limiter, then group mastering. Effects remain below -3 dBFS.
    v=np.tanh(v*.8)
    peak=np.max(np.abs(v));rms=np.sqrt(np.mean(v*v))
    target=.18 if music else (.14 if 'btn' in name else .23)
    scale=min(target/max(rms,1e-9),.69/max(peak,1e-9))
    v*=scale
    if not loop:
        n=min(220,len(v)//2);v[:n]*=np.linspace(0,1,n)[:,None];v[-n:]*=np.linspace(1,0,n)[:,None]
    pcm=np.round(np.clip(v,-1,1)*32767).astype('<i2')
    with wave.open(str(OUT/(name+'.wav')),'wb') as w:
        w.setnchannels(2);w.setsampwidth(2);w.setframerate(SR);w.writeframes(pcm.tobytes())
    stats[name]={'seconds':round(len(v)/SR,3),'peak_dbfs':round(20*np.log10(max(np.max(np.abs(v)),1e-9)),2),'rms_dbfs':round(20*np.log10(max(np.sqrt(np.mean(v*v)),1e-9)),2),'loop':loop}
def score(name, free=False):
    # Eight bars in 6/8; every delay and pad wraps, no empty seam.
    pulse=60/(116 if free else 96)/2; N=int(round(48*pulse*SR));pulse=N/SR/48
    v=np.zeros((N,2)); t=np.arange(N)/SR
    chords=[[50,57,60,64],[48,55,59,62],[53,57,60,64],[55,59,62,65]]
    motif=[74,76,77,81,79,76,74,72,69,72,76,74]
    for bar in range(8):
        chord=chords[(bar//2)%4];at=bar*6*pulse
        for j in range(6):
            note=chord[[0,1,2,1,3,2][j]]+12
            src=glass(note,pulse*3,1)*(.16 if free else .12)
            # Circular placement makes each phrase's tail cross the loop seam.
            tmp=np.zeros_like(v);add(tmp,src,0,1,(-.35 if j%2 else .35));v+=np.roll(tmp,int((at+j*pulse)*SR),axis=0)
        bass=chord[0]-12
        for beat in [0,3]:
            u=np.arange(int(3*pulse*SR))/SR
            src=(np.sin(2*np.pi*hz(bass)*u)+.16*np.sin(2*np.pi*hz(bass)*2*u))*np.sin(np.pi*u/(3*pulse))**1.3*.15
            tmp=np.zeros_like(v);add(tmp,src);v+=np.roll(tmp,int((at+beat*pulse)*SR),axis=0)
        if bar%2==0 or free:
            for j in range(3):
                src=glass(motif[(bar*3+j)%12],pulse*4)*.12
                tmp=np.zeros_like(v);add(tmp,src,0,1,(j-1)*.3);v+=np.roll(tmp,int((at+j*2*pulse)*SR),axis=0)
    # Very quiet continuous harmonic air, phase-closed at the buffer boundary.
    for f in [hz(50),hz(57),hz(64)]:
        f=round(f*N/SR)*SR/N
        pad=np.sin(2*np.pi*f*t)*.016
        v[:,0]+=pad;v[:,1]+=pad
    save(name,v,True,True)

source=(APP/'src/components/Sound.svelte').read_text(encoding='utf-8-sig')
body=re.search(r'const CN_SFX_FILES: Record<CnSfxName, string> = \{([\s\S]*?)\n\s*\};',source)[1]
names=sorted(set(re.findall(r"alchemy/([\w]+)\.wav",body)))
for name in names:
    rng=np.random.default_rng(int.from_bytes(hashlib.sha256(name.encode()).digest()[:4],'little'))
    if name in ['reel_tension','sfx_anticipation']:
        dur=2; t=np.arange(int(dur*SR))/SR
        v=np.column_stack((np.sin(2*np.pi*294*t),np.sin(2*np.pi*296*t)))*(.06+.04*np.sin(2*np.pi*4*t))[:,None]
        save(name,v,True);continue
    if 'fuse' in name:
        dur=.38;v=np.zeros((int(dur*SR),2));add(v,liquid(dur,rng,14),gain=.7);add(v,pressure(dur,rng),gain=.38)
    elif any(k in name for k in ['blast','shatter','smoke','quake','explode','explosion','wild_expand']):
        dur=1.35 if 'big' in name else .95
        v=np.zeros((int(dur*SR),2));add(v,pressure(dur*.9,rng),gain=1.5);add(v,liquid(dur*.85,rng,24),gain=.85,pan=-.15)
        add(v,glass(50,dur,1),.015,.09);add(v,glass(74,dur),.08,.08,pan=.35)
    elif any(k in name for k in ['voice','monkey_expand']):
        dur=2.6 if name=='monkey_expand' else .7;v=np.zeros((int(dur*SR),2))
        for at in np.arange(.04,dur-.14,.3):
            t=np.arange(int(.18*SR))/SR
            # Soft character effort: harmonically voiced breath, no fake speech.
            src=sum(np.sin(2*np.pi*hz(45)*j*t)/(j*j) for j in range(1,7))*np.sin(np.pi*t/.18)**2
            add(v,src,at,.16);add(v,pressure(.16,rng),at,.25)
    elif any(k in name for k in ['btn','reel_stop','landing','pluck_low','spin']):
        dur=.28 if 'stop' in name or 'btn' in name else .5;v=np.zeros((int(dur*SR),2))
        m=69 if 'btn' in name else 62
        add(v,glass(m,dur,1),gain=.2);add(v,pressure(min(.12,dur),rng),gain=.15)
        if 'spin' in name:add(v,liquid(dur,rng,5),gain=.5)
    else:
        tier=next((i+1 for i,k in enumerate(['win_big','win_super','win_mega','win_epic','win_max']) if name==k),0)
        dur=1.2+tier*.32
        if name in ['fullboard_chain','fullboard_stamp','fs_intro','gong_feature']:dur=1.7
        v=np.zeros((int(dur*SR),2))
        notes=[74,77,81,86] if not tier else [62,69,74,77,81,86][:tier+1]
        if 'scatter_' in name and name[-1:].isdigit():notes=[74+int(name[-1])*2,81+int(name[-1])*2]
        for j,m in enumerate(notes):add(v,glass(m,dur-j*.09),j*.09,.2,(j%3-1)*.35)
        if 'chain' in name:
            v*=.5
            for j in range(5):add(v,liquid(.3,rng,6),j*.19,.7,(j-2)*.2)
        if 'reveal' in name or 'update' in name:add(v,liquid(.6,rng,6),gain=.35)
    save(name,v)
score('bgm_main');score('bgm_freespin',True)
(OUT/'mix_manifest.json').write_text(json.dumps(stats,indent=2),encoding='utf-8')
print(f'Generated {len(stats)} original stereo alchemy cues and music loops.')
