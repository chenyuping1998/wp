"""Synthesize original, theme-specific audio cues and two seamless loops per game.

No prerecorded samples are used. WAV effects are 44.1 kHz mono 16-bit;
music is 192 kbps stereo MP3 with Xing gapless metadata.
"""
from pathlib import Path
import importlib.util
import math
import subprocess
import wave
import numpy as np
import imageio_ffmpeg
from scipy.signal import resample_poly

ROOT=Path(__file__).resolve().parents[1]
library=ROOT/'apps/DinerMonkey美式餐館/design/source/diner/audio/build_audio.py'
spec=importlib.util.spec_from_file_location('audio_dsp',library)
dsp=importlib.util.module_from_spec(spec);spec.loader.exec_module(dsp)
ORIGINAL_TONE=dsp.tone
SR=dsp.SR

def write_master_48k24(path, stereo):
    """Preserve the floating-point music mix as a 48 kHz / 24-bit WAV master."""
    samples=resample_poly(stereo,160,147,axis=0)
    pcm=np.round(np.clip(samples,-1,1)*8388607).astype('<i4')
    packed=pcm.view(np.uint8).reshape(-1,4)[:,:3].tobytes()
    with wave.open(str(path),'wb') as wav:
        wav.setnchannels(2)
        wav.setsampwidth(3)
        wav.setframerate(48000)
        wav.writeframes(packed)
THEMES={
 'monkeyking':('MonkeyKingRush齊天大聖',140,164,198),
 'pocha':('PochaMonkey韓式路邊攤',132,152,299),
 'swing':('SwingMonkey爵士俱樂部',154,172,1930),
}
CUSTOM_CUES={'collect_grab','coin_in','collect_stamp','win_small','win_mid','cash_register','fs_intro',
             'reel_stop','sack_throw','shutter_slam'}

def cue_seed(seed,name):
    return seed+77 if name=='cash_register' else seed+sum((i+1)*ord(c) for i,c in enumerate(name))

def themed_tone(theme,freq,sec=.2,decay=12,kind='piano'):
    q=dsp.t(sec); phase=2*np.pi*freq*q
    if theme=='monkeyking':
        # Small gong, board drum and plucked strings; bright but no long tail.
        if kind=='bass': x=np.sin(phase)+.25*np.sin(2*phase)
        elif kind=='brass':x=np.sin(phase)+.4*np.sin(2.9*phase)+.18*np.sin(4.2*phase)
        else:x=np.sin(phase)+.34*np.sin(2.01*phase)+.19*np.sin(3.93*phase)
    elif theme=='pocha':
        # Variety-show xylophone and clean electric-organ pips.
        if kind=='bass':x=np.sin(phase)+.15*np.sin(2*phase)
        else:x=np.sin(phase+.12*np.sin(2*np.pi*5*q))+.3*np.sin(2*phase)+.15*np.sin(4*phase)
    else:
        # Muted horn, wooden bass and dry mallet, not an old recording sample.
        if kind=='bass':x=np.sin(phase)+.3*np.sin(2*phase)
        elif kind=='bell':x=np.sin(phase)+.42*np.sin(3*phase)
        else:x=.65*np.sin(phase)+.43*np.sin(2*phase)+.17*np.sin(3*phase)
        x*=1+.13*np.sin(2*np.pi*6*q)
    return dsp.fade(x*np.exp(-decay*q),.001,min(.02,sec/5))

def cue(theme,name,sec):
    custom=CUSTOM_CUES if theme in ('pocha','swing') else set()
    x=dsp.buf(sec) if name in custom else dsp.make_sfx(name,sec)
    def add(signal,at,gain):dsp.put(x,signal,at,gain)
    if name.startswith('scatter_'):
        step=int(name[-1])-1
        if theme=='monkeyking':
            add(themed_tone(theme,[392,494,587,784,988][step],.34,10,'brass'),0,.16)
            add(dsp.noise(.08,1200,5000,45),.04,.06)
        elif theme=='pocha':
            add(themed_tone(theme,[587,740,880,1175,1480][step],.22,10),0,.2)
            add(themed_tone(theme,[740,880,1175,1480,1760][step],.17,13),.13,.13)
        else:
            add(themed_tone(theme,[523,659,784,1047,1319][step],.30,9,'brass'),0,.18)
    if name in ('bandit_land','sack_land') or (theme=='monkeyking' and name in ('collect_grab','collect_stamp','coin_in')):
        if theme=='monkeyking':
            add(dsp.noise(.12,900,4600,26),0,.16)
            add(themed_tone(theme,784,.22,14,'brass'),.05,.12)
        elif theme=='pocha':
            add(dsp.noise(.25,1200,9000,13),0,.13)
            add(themed_tone(theme,880,.15,18),.10,.15)
        else:
            add(themed_tone(theme,349,.23,10,'brass'),0,.13)
            add(themed_tone(theme,523,.17,16,'bell'),.09,.15)
    if name=='collect_grab' and theme in ('pocha','swing'):
        if theme=='pocha':
            add(dsp.noise(.23,700,4600,14),0,.18)  # tray slides forward
            add(themed_tone(theme,587,.17,16),.15,.22)
        elif theme=='swing':
            add(dsp.noise(.27,2300,7800,12),0,.12)  # brush sweep
            add(themed_tone(theme,174.6,.26,11,'bass'),.04,.24)
        else:
            add(dsp.noise(.18,700,5000,20),0,.16)
            add(themed_tone(theme,392,.19,15,'brass'),.10,.22)
    if name=='coin_in' and theme in ('pocha','swing'):
        if theme=='pocha':
            add(dsp.noise(.025,1800,7200,100),0,.12)  # chopstick tap
            add(themed_tone(theme,880,.11,27),.012,.26)
        elif theme=='swing':
            add(themed_tone(theme,349,.11,26,'bell'),0,.25)  # piano key
            add(themed_tone(theme,174.6,.09,31,'bass'),.015,.10)
        else:
            add(themed_tone(theme,784,.11,27,'brass'),0,.22)
    if name=='collect_stamp' and theme in ('pocha','swing'):
        if theme=='pocha':
            for at in (0,.06,.12):add(dsp.noise(.035,1600,6500,90),at,.14)
            add(themed_tone(theme,740,.23,13),.14,.27)  # bowl ring
        elif theme=='swing':
            add(dsp.noise(.15,2600,8500,22),0,.12)  # brushed accent
            add(themed_tone(theme,174.6,.23,11,'bass'),.035,.18)
            add(themed_tone(theme,466,.23,12,'brass'),.15,.27)
        else:
            add(dsp.snare(),0,.16)
            add(themed_tone(theme,587,.23,12,'brass'),.13,.26)
    if name in ('win_small','win_mid') and theme in ('pocha','swing'):
        notes={'pocha':(587,740,880,1175),'swing':(349,415,523,698),
               'monkeyking':(392,494,587,784)}[theme]
        length=3 if name=='win_small' else 4
        for i,f in enumerate(notes[:length]):
            at=i*(.115 if theme=='pocha' else .14 if theme=='swing' else .12)
            add(themed_tone(theme,f,.22,14,'bell' if theme=='swing' else 'brass'),at,.23)
            if theme=='swing' and i%2==0:
                add(themed_tone(theme,f/2,.17,18,'bass'),at,.10)
    if name in ('spin','reel_stop','btn'):
        if theme=='monkeyking':add(dsp.noise(.045,400,2800,95),0,.12)
        elif theme=='pocha':add(themed_tone(theme,659,.06,50),0,.12)
        else:add(themed_tone(theme,392,.09,28,'brass'),0,.13)
    if name=='reel_stop' and theme in ('pocha','swing'):
        if theme=='pocha':
            add(dsp.noise(.06,1200,5800,60),0,.18)  # bowl on counter
            add(themed_tone(theme,740,.13,26),.024,.23)
        else:
            add(dsp.noise(.055,280,2100,70),0,.18)  # wood block
            add(themed_tone(theme,174.6,.14,22,'bass'),.02,.24)
    if name=='sack_throw' and theme in ('pocha','swing'):
        if theme=='pocha':
            add(dsp.noise(.29,700,4700,13),0,.20)  # serving sweep
            add(themed_tone(theme,587,.15,17),.18,.19)
        else:
            add(dsp.noise(.30,2400,7900,14),0,.17)  # brush across snare
            add(themed_tone(theme,174.6,.22,14,'bass'),.12,.18)
    if name=='shutter_slam' and theme in ('pocha','swing'):
        if theme=='pocha':
            add(dsp.noise(.08,600,3500,53),0,.23)  # counter chop
            add(themed_tone(theme,740,.23,15),.09,.23)
        else:
            add(dsp.snare(),0,.15)
            add(themed_tone(theme,174.6,.25,11,'bass'),.035,.24)
            add(themed_tone(theme,466,.21,17,'brass'),.19,.19)
    if name in ('voice_laugh','voice_hup'):
        if theme=='monkeyking':add(themed_tone(theme,196,.18,6,'brass'),0,.10)
        elif theme=='pocha':add(themed_tone(theme,293,.17,13),0,.10)
        else:add(themed_tone(theme,233,.18,8,'brass'),0,.10)
    if name=='cash_register' and theme in ('pocha','swing'):
        # Each room pays out in its own rhythm; the existing 0.9s slot is kept.
        if theme=='pocha':
            add(dsp.noise(.055,950,6000,75),0,.15)
            for at,f in ((.11,587),(.25,740),(.44,988)):
                add(themed_tone(theme,f,.25,13),at,.24)
        elif theme=='swing':
            add(themed_tone(theme,174.6,.25,12,'bass'),0,.19)
            for at,f in ((.16,349),(.40,523),(.57,698)):
                add(themed_tone(theme,f,.24,12,'bell'),at,.23)
        else:
            add(dsp.noise(.07,550,3800,65),0,.17)
            for at,f in ((.12,392),(.30,587),(.52,784)):
                add(themed_tone(theme,f,.25,11,'brass'),at,.23)
    if name=='fs_intro' and theme in ('pocha','swing'):
        # Sign lands at 0.7s; the separate count-stamp SFX hits at 0.93s.
        if theme=='pocha':
            add(dsp.noise(.46,750,4900,6),.03,.16)  # serving tray slide
            add(dsp.noise(.09,1200,6100,38),.70,.20)  # bowl tap
            for at,f in ((1.13,587),(1.39,740),(1.66,880),(2.08,1175)):
                add(themed_tone(theme,f,.32,9),at,.23)
            add(themed_tone(theme,740,.50,5),2.30,.17)
        else:
            add(dsp.noise(.54,2300,7900,7),.03,.12)  # brushed snare
            for at in (.14,.43,.72):
                add(themed_tone(theme,174.6,.30,10,'bass'),at,.16)
            for at,f in ((1.14,349),(1.45,415),(1.78,523),(2.18,698)):
                add(themed_tone(theme,f,.33,8,'bell'),at,.23)
            add(themed_tone(theme,349,.53,5,'brass'),2.36,.17)
    return dsp.norm(dsp.fade(x,.001,.015),.72 if name.startswith('voice') else .68)

def music(theme,mode,bpm):
    beat=60/bpm; bars=16; x=dsp.buf(bars*4*beat)
    # Different original phrases and harmonic centers for the three worlds.
    scales={
      'monkeyking':[293.66,329.63,392,440,523.25,587.33,659.25,783.99],
      'pocha':[261.63,311.13,349.23,392,466.16,523.25,622.25,698.46],
      'swing':[233.08,277.18,311.13,349.23,415.30,466.16,554.37,622.25],
    }
    phrase={
      'monkeyking':[0,2,4,None,6,4,2,1,0,2,5,4,7,6,4,None],
      'pocha':[0,3,4,3,6,None,4,2,0,3,5,6,7,5,4,None],
      'swing':[0,2,4,5,7,6,4,None,3,5,6,4,2,1,0,None],
    }
    notes=scales[theme]; seq=phrase[theme]
    for k in range(bars*4):
        at=k*beat; n=notes[seq[k%16]] if seq[k%16] is not None else None
        bass=notes[(k//4*3)%8]/2
        dsp.put(x,themed_tone(theme,bass,.36,8,'bass'),at,.16)
        if theme=='monkeyking':
            dsp.put(x,dsp.kick(),at,.15)
            if k%2:dsp.put(x,dsp.snare(),at,.10)
            if k%4==3:dsp.put(x,dsp.noise(.09,950,4300,24),at+beat*.55,.06)
        elif theme=='pocha':
            dsp.put(x,dsp.kick(),at,.15)
            dsp.put(x,dsp.clap(),at+beat*.5,.075)
            if k%2:dsp.put(x,dsp.noise(.09,1900,8200,30),at,.05)
        else:
            if k%4 in (0,2):dsp.put(x,dsp.kick(),at,.11)
            if k%4 in (1,3):dsp.put(x,dsp.snare(),at,.09)
            dsp.put(x,dsp.noise(.045,2600,8200,55),at+beat*.65,.035)
        if n is not None and k%2==0:
            delay=beat*(.1 if theme=='monkeyking' else .33 if theme=='pocha' else .62)
            dsp.put(x,themed_tone(theme,n,.23,.0 if mode=='freespin' else 11,'brass' if theme!='pocha' else 'bell'),at+delay,.11)
        if mode=='freespin' and k%4==3:
            dsp.put(x,themed_tone(theme,notes[(k+3)%8],.19,14),at+beat*.7,.09)
    # Cut at a zero crossing window; the MP3 encoder adds gapless metadata.
    f=round(.008*SR);x[:f]*=np.linspace(0,1,f);x[-f:]*=np.linspace(1,0,f)
    target_peak={
        'monkeyking': {'main':.72,'freespin':.55},
        'pocha': {'main':.67,'freespin':.50},
        'swing': {'main':.55,'freespin':.55},
    }[theme][mode]
    x=dsp.norm(x,target_peak)
    return np.stack((x,np.roll(x,round(.0008*SR))*.97),axis=1)

def build(theme,app,bpm_main,bpm_free,seed):
    dsp.RNG=np.random.default_rng(seed)
    dsp.tone=lambda freq,sec=.2,decay=12,kind='piano':themed_tone(theme,freq,sec,decay,kind)
    out=ROOT/'apps'/app/'static/assets/audio'/theme
    masters=ROOT/'apps'/app/'design/source'/theme/'audio/masters'
    out.mkdir(parents=True,exist_ok=True);masters.mkdir(parents=True,exist_ok=True)
    for name,sec in dsp.DUR.items():
        if theme in ('pocha','swing') and name in CUSTOM_CUES:
            saved_rng=dsp.RNG
            dsp.RNG=np.random.default_rng(cue_seed(seed,name))
        sample=cue(theme,name,sec)
        if theme in ('pocha','swing') and name in CUSTOM_CUES:dsp.RNG=saved_rng
        dsp.wav(out/f'{name}.wav',sample)
    ffmpeg=imageio_ffmpeg.get_ffmpeg_exe()
    for mode,bpm in [('main',bpm_main),('freespin',bpm_free)]:
        stereo=music(theme,mode,bpm)
        master=masters/f'bgm_{mode}_44k16.wav';dsp.wav(master,stereo)
        write_master_48k24(masters/f'bgm_{mode}_48k24.wav',stereo)
        subprocess.run([ffmpeg,'-hide_banner','-loglevel','error','-y','-i',str(master),
                        '-codec:a','libmp3lame','-b:a','192k','-write_xing','1',
                        str(out/f'bgm_{mode}.mp3')],check=True)
    print(theme,len(dsp.DUR),'cues + two music loops')

if __name__=='__main__':
    for theme,(app,bpm_main,bpm_free,seed) in THEMES.items():build(theme,app,bpm_main,bpm_free,seed)
