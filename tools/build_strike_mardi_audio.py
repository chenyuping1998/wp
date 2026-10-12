"""Original procedural sound sets for Strike and Mardi Monkey.

Run: py -3 wp/tools/build_strike_mardi_audio.py
Each runtime cue is mono 44.1 kHz WAV; music is gapless-tagged 192k MP3.
"""
from pathlib import Path
import importlib.util
import subprocess
import wave
import numpy as np
import imageio_ffmpeg
from scipy.signal import resample_poly

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('dsp', ROOT/'apps/DinerMonkey美式餐館/design/source/diner/audio/build_audio.py')
dsp = importlib.util.module_from_spec(spec)
spec.loader.exec_module(dsp)
SR = dsp.SR
CONFIG = {
    'strike': ('StrikeMonkey保齡球館',132,156,1957),
    'mardi': ('MardiMonkey嘉年華',104,126,2026),
}
CUSTOM_CUES={'collect_grab','coin_in','collect_stamp','win_small','win_mid','cash_register','fs_intro',
             'reel_stop','sack_throw','shutter_slam'}

def cue_seed(seed,name):
    return seed+77 if name=='cash_register' else seed+sum((i+1)*ord(c) for i,c in enumerate(name))

def tone(theme, freq, seconds=.23, decay=11):
    t=dsp.t(seconds)
    ph=2*np.pi*freq*t
    if theme=='strike':
        # Clipped electric organ and plucked surf guitar.
        x=np.sin(ph)+.38*np.sin(2*ph)+.14*np.sin(3*ph)
        x*=1+.07*np.sin(2*np.pi*6*t)
    else:
        # Rounded parade brass with a second harmonic buzz.
        x=np.sin(ph)+.58*np.sin(2*ph)+.24*np.sin(3*ph)+.09*np.sin(4*ph)
        x*=1+.04*np.sin(2*np.pi*5*t)
    return dsp.fade(x*np.exp(-decay*t),.001,min(.018,seconds/6))

def sfx(theme, name, seconds):
    custom=CUSTOM_CUES
    x=dsp.buf(seconds) if name in custom else dsp.make_sfx(name,seconds)
    add=lambda signal,at,gain:dsp.put(x,signal,at,gain)
    if name.startswith('scatter_'):
        i=int(name[-1])-1
        notes=([392,494,587,784,988] if theme=='strike' else [349,440,523,698,880])
        add(tone(theme,notes[i],.42,8),0,.2)
        if theme=='mardi':add(dsp.noise(.08,950,4700,45),.06,.06)
    elif name=='reel_stop':
        if theme=='strike':
            add(dsp.noise(.065,180,1600,55),0,.24)
            add(tone(theme,392,.13,25),.035,.18)
        else:
            add(dsp.noise(.07,1800,7600,60),0,.18)
            add(tone(theme,523,.13,25),.026,.21)
    elif name=='sack_throw':
        if theme=='strike':
            add(dsp.noise(.31,120,1300,7),0,.27)  # lane roll
            add(tone(theme,196,.13,23),.18,.15)
        else:
            add(dsp.snare(),0,.14)
            add(dsp.noise(.28,1300,6300,13),.05,.13)
            add(tone(theme,440,.13,22),.22,.16)
    elif name=='shutter_slam':
        if theme=='strike':
            for at in (0,.06,.13):add(dsp.noise(.08,220,2800,55),at,.21)
            add(tone(theme,196,.23,15),.10,.22)
        else:
            add(dsp.snare(),0,.22)
            add(tone(theme,349,.25,13),.065,.23)
            add(tone(theme,523,.18,19),.20,.15)
    elif name in ('door_clack','sack_land','bandit_land'):
        add(dsp.noise(.10,180,1600,26),0,.15 if theme=='strike' else .12)
    elif name=='collect_grab':
        if theme=='strike':
            add(dsp.noise(.30,120,1150,8),0,.24)  # ball rolling on a lane
            add(tone(theme,196,.17,14),.04,.20)
            add(tone(theme,392,.15,17),.20,.16)
        else:
            add(dsp.snare(),0,.15)
            add(tone(theme,349,.22,13),.05,.22)
            add(tone(theme,523,.16,18),.20,.16)
    elif name=='coin_in':
        if theme=='strike':
            add(dsp.noise(.035,650,3500,100),0,.16)  # pin click
            add(tone(theme,784,.115,28),.012,.24)
        else:
            add(dsp.noise(.045,2400,8500,80),0,.15)  # bead / tambourine
            add(tone(theme,698,.105,28),.015,.23)
    elif name=='collect_stamp':
        if theme=='strike':
            for at in (0,.065,.12):add(dsp.noise(.052,400,3100,85),at,.17)
            add(tone(theme,392,.23,11),.14,.29)
        else:
            add(dsp.snare(),0,.17)
            add(dsp.noise(.06,2400,8000,70),.10,.11)
            add(tone(theme,587,.23,12),.12,.27)
    elif name in ('win_small','win_mid'):
        notes=(392,494,587) if theme=='strike' else (349,440,523)
        if name=='win_mid': notes+=((784,) if theme=='strike' else (698,))
        for i,f in enumerate(notes):
            add(tone(theme,f,.22,13),i*(.11 if theme=='strike' else .14),.24)
        if theme=='strike':add(dsp.noise(.05,500,3000,75),0,.11)
        else:add(dsp.snare(),0,.10)
    elif name=='tumbler_up':
        add(tone(theme,784 if theme=='strike' else 587,.22,17),.02,.15)
    elif name in ('voice_laugh','voice_hup'):
        # Non-verbal monkey exclamation, no spoken words.
        add(tone(theme,233 if theme=='strike' else 293,.20,7),0,.14)
    elif name=='cash_register':
        # Feature payout: a compact, theme-specific answer to the counting bed.
        add(dsp.noise(.055,450,3800,85),0,.18)
        if theme=='strike':
            add(tone(theme,392,.22,14),.10,.27)
            add(tone(theme,587,.24,12),.28,.25)
            add(tone(theme,784,.30,10),.46,.22)
        else:
            add(dsp.snare(),.08,.09)
            add(tone(theme,349,.25,12),.14,.23)
            add(tone(theme,523,.25,12),.34,.25)
            add(tone(theme,698,.29,10),.52,.21)
    elif name=='fs_intro':
        # The sign lands at 0.7s; the separate stamp SFX hits at 0.93s.
        if theme=='strike':
            add(dsp.noise(.55,130,1250,5),.04,.19)  # lane roll
            add(dsp.noise(.10,400,3000,32),.70,.24)  # pin impact
            for at,f in ((1.13,392),(1.39,494),(1.65,587),(2.08,784)):
                add(tone(theme,f,.34,8),at,.24)
            add(tone(theme,392,.54,5),2.30,.18)
        else:
            for at in (.08,.31,.54):add(dsp.snare(),at,.11)
            add(dsp.snare(),.70,.20)
            for at,f in ((1.13,349),(1.42,440),(1.71,523),(2.10,698)):
                add(tone(theme,f,.36,7),at,.24)
            add(tone(theme,523,.56,5),2.34,.18)
    return dsp.norm(dsp.fade(x,.001,.015),.7)

def music(theme,mode,bpm):
    beat=60/bpm
    bars=16
    x=dsp.buf(bars*4*beat)
    scale=([220,246.94,277.18,329.63,369.99,440,493.88,554.37]
           if theme=='strike' else [174.61,196,220,261.63,293.66,349.23,392,440])
    phrase=([0,2,4,5,7,5,4,None,0,3,5,4,2,1,0,None]
            if theme=='strike' else [0,2,4,5,7,6,4,2,3,5,6,7,5,4,2,None])
    for k in range(bars*4):
        at=k*beat
        dsp.put(x,tone(theme,scale[(k//4*3)%8]/2,.36,7),at,.15)
        dsp.put(x,dsp.kick(),at,.14)
        if theme=='strike':
            if k%2:dsp.put(x,dsp.snare(),at,.10)
            dsp.put(x,dsp.noise(.045,1900,8000,50),at+beat*.5,.035)
        else:
            # Second-line cadence: loose snare, off-beat tambourine.
            dsp.put(x,dsp.snare(),at+beat*.35,.08)
            dsp.put(x,dsp.noise(.065,2300,8500,38),at+beat*.65,.055)
        n=phrase[k%16]
        if n is not None and (k%2==0 or theme=='mardi'):
            dsp.put(x,tone(theme,scale[n],.24 if mode=='main' else .32,8),at+beat*(.12 if theme=='strike' else .25),.105)
        if mode=='freespin' and k%4==3:
            dsp.put(x,tone(theme,scale[(k+3)%8],.18,14),at+beat*.72,.09)
    fade=round(.008*SR)
    x[:fade]*=np.linspace(0,1,fade)
    x[-fade:]*=np.linspace(1,0,fade)
    x=dsp.norm(x,.59 if mode=='main' else .53)
    return np.stack((x,np.roll(x,round(.0008*SR))*.97),axis=1)

def master(path,stereo):
    pcm=np.round(np.clip(resample_poly(stereo,160,147,axis=0),-1,1)*8388607).astype('<i4')
    packed=pcm.view(np.uint8).reshape(-1,4)[:,:3].tobytes()
    with wave.open(str(path),'wb') as out:
        out.setnchannels(2);out.setsampwidth(3);out.setframerate(48000);out.writeframes(packed)

def build(theme,app,bpm_main,bpm_free,seed):
    dsp.RNG=np.random.default_rng(seed)
    out=ROOT/'apps'/app/'static/assets/audio'/theme
    sources=ROOT/'apps'/app/'design/source'/theme/'audio/masters'
    out.mkdir(parents=True,exist_ok=True);sources.mkdir(parents=True,exist_ok=True)
    for name,seconds in dsp.DUR.items():
        if name in CUSTOM_CUES:
            saved_rng=dsp.RNG
            dsp.RNG=np.random.default_rng(cue_seed(seed,name))
        sample=sfx(theme,name,seconds)
        if name in CUSTOM_CUES:dsp.RNG=saved_rng
        dsp.wav(out/f'{name}.wav',sample)
    ffmpeg=imageio_ffmpeg.get_ffmpeg_exe()
    for mode,bpm in [('main',bpm_main),('freespin',bpm_free)]:
        stereo=music(theme,mode,bpm)
        wav=sources/f'bgm_{mode}_44k16.wav'
        dsp.wav(wav,stereo)
        master(sources/f'bgm_{mode}_48k24.wav',stereo)
        subprocess.run([ffmpeg,'-hide_banner','-loglevel','error','-y','-i',str(wav),'-codec:a','libmp3lame','-b:a','192k','-write_xing','1',str(out/f'bgm_{mode}.mp3')],check=True)
    print(theme,len(dsp.DUR),'cues and two loops')

if __name__=='__main__':
    for name,config in CONFIG.items():build(name,*config)
