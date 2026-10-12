"""Original, deterministic Diner Monkey cartoon-diner audio synthesis.

Run from anywhere with Python, NumPy, SciPy, and imageio-ffmpeg installed.
No samples, songs, or voices are copied from external recordings.
"""
from pathlib import Path
import math
import subprocess
import wave

import imageio_ffmpeg
import numpy as np
from scipy.signal import butter, sosfilt, resample_poly

ROOT = Path(__file__).resolve().parents[4]
OUT = ROOT / 'static/assets/audio/diner'
MASTER = Path(__file__).resolve().parent / 'masters'
OUT.mkdir(parents=True, exist_ok=True)
MASTER.mkdir(parents=True, exist_ok=True)
SR = 44100
RNG = np.random.default_rng(19501950)
CUSTOM_CUES = {'collect_grab','coin_in','collect_stamp','win_small','win_mid','cash_register','fs_intro',
               'reel_stop','sack_throw','shutter_slam'}

def cue_seed(name):
    return 19501950 + sum((i+1)*ord(c) for i,c in enumerate(name))


def buf(sec): return np.zeros(round(sec * SR), dtype=np.float64)
def t(sec): return np.arange(round(sec * SR)) / SR
def fade(x, attack=.002, release=.02):
    x = x.copy()
    a, b = min(len(x), round(attack * SR)), min(len(x), round(release * SR))
    if a: x[:a] *= np.linspace(0, 1, a)
    if b: x[-b:] *= np.linspace(1, 0, b)
    return x
def filt(x, lo=0, hi=0):
    if lo and hi: sos = butter(2, [lo, hi], btype='bandpass', fs=SR, output='sos')
    elif lo: sos = butter(2, lo, btype='highpass', fs=SR, output='sos')
    else: sos = butter(2, hi, btype='lowpass', fs=SR, output='sos')
    return sosfilt(sos, x)
def put(dst, src, at, gain=1):
    k = round(at * SR)
    if k < 0 or k >= len(dst): return
    n = min(len(src), len(dst)-k)
    dst[k:k+n] += src[:n] * gain
def tone(freq, sec=.2, decay=12, kind='piano'):
    q=t(sec); phase=2*np.pi*freq*q
    if kind=='bell': x=np.sin(phase)+.35*np.sin(phase*2.01)+.13*np.sin(phase*3.93)
    elif kind=='brass': x=.75*np.sin(phase)+.32*np.sin(2*phase)+.18*np.sin(3*phase)
    elif kind=='bass': x=np.sin(phase)+.28*np.sin(2*phase)+.08*np.sin(3*phase)
    elif kind=='guitar': x=(np.sin(phase)+.5*np.sin(2*phase)+.25*np.sin(3*phase))*np.exp(-q*8)
    else: x=np.sin(phase)+.43*np.sin(2*phase)+.22*np.sin(3*phase)
    return fade(x*np.exp(-decay*q), .001, min(.02,sec/5))
def noise(sec, lo=300, hi=6000, decay=20):
    q=t(sec); x=RNG.normal(0,1,len(q))
    x=filt(x, lo, hi)
    x=x/(np.max(np.abs(x))+1e-9)
    return fade(x*np.exp(-decay*q),.001,min(.02,sec/5))
def whistle(f0, f1, sec):
    q=t(sec); hz=np.linspace(f0,f1,len(q)); phase=2*np.pi*np.cumsum(hz)/SR
    return fade(np.sin(phase)*np.sin(np.pi*np.minimum(q/sec,1))**.5,.001,.015)
def boing(sec=.35):
    q=t(sec); hz=190+320*np.exp(-q*11)+30*np.sin(2*np.pi*13*q)*np.exp(-q*8)
    return fade(np.sin(2*np.pi*np.cumsum(hz)/SR)*np.exp(-q*8),.001,.025)
def kick():
    q=t(.19); hz=55+110*np.exp(-q*35)
    return fade(np.sin(2*np.pi*np.cumsum(hz)/SR)*np.exp(-q*25),.001,.02)
def snare(): return noise(.16,450,5000,30)+.22*tone(185,.16,28,'bass')
def clap():
    x=buf(.18)
    for at in (0,.018,.039): put(x,noise(.06,600,4500,45),at,.38)
    return x
def voice(sec, base=180):
    q=t(sec); hz=base*(1+.19*np.sin(2*np.pi*6*q))*(1+.12*q/sec)
    phase=2*np.pi*np.cumsum(hz)/SR
    x=np.sin(phase)+.33*np.sin(2*phase)+.17*np.sin(3*phase)
    x=filt(x, 170, 1800)
    return fade(x*np.exp(-q*2.5),.005,.08)
def norm(x, peak=.72):
    m=np.max(np.abs(x))+1e-9
    return x*(peak/m)
def wav(path,x,sr=SR,bits=16):
    x=np.clip(x,-.98,.98)
    if x.ndim==2: channels=x.shape[1]
    else: channels=1
    with wave.open(str(path),'wb') as w:
        w.setnchannels(channels);w.setframerate(sr);w.setsampwidth(bits//8)
        if bits==16: w.writeframes((x*32767).astype('<i2').tobytes())
        else:
            z=(x*8388607).astype('<i4').ravel()
            b=z.view('u1').reshape(-1,4)[:,:3].tobytes()
            w.writeframes(b)


def make_sfx(name, sec):
    x=buf(sec)
    def a(src,at=0,g=.3): put(x,src,at,g)
    click=noise(.055,450,4500,90)
    plate=tone(620,.18,27,'bell')
    bell=tone(910,.48,8,'bell')
    if name=='btn': a(click,0,.3);a(tone(540,.065,42),.015,.15)
    elif name=='spin': a(click,0,.23);a(bell,.015,.28);a(whistle(420,920,.22),.06,.16)
    elif name=='safe_open': a(noise(.35,250,3000,6),0,.25);a(snare(),.28,.28);a(tone(392,.15,15,'brass'),.39,.15);a(tone(494,.15,15,'brass'),.51,.15)
    elif name=='reel_stop':
        # Plate and cup settle on the counter in one compact beat.
        a(noise(.055,420,3000,73),0,.17)
        a(tone(620,.15,27,'bell'),.013,.24)
        a(tone(240,.12,27,'bass'),.026,.14)
    elif name=='reel_tension':
        for k in range(18): a(noise(.14,500,5000,10),k*.14,.09+.008*k)
        for k in range(8): a(tone(440+10*k,.18,7),k*.32,.08+.01*k)
    elif name.startswith('scatter_'):
        i=int(name[-1])-1; freqs=[523.25,659.25,783.99,1046.5,1318.5]
        a(tone(freqs[i],.5,9,'bell'),0,.4);a(click,0,.11)
        if i>=3:a(whistle(freqs[i]*1.3,freqs[i]*1.7,.18),.12,.07)
    elif name=='dial_tick': a(click,0,.34)
    elif name=='sack_land': a(plate,0,.33);a(click,.015,.12)
    elif name=='bandit_land': a(tone(165,.26,15,'bass'),0,.42);a(tone(390,.12,10,'brass'),.08,.18);a(tone(440,.12,10,'brass'),.2,.16)
    elif name=='collect_grab':
        # A plate slides across the counter, followed by a dry utensil clink.
        a(noise(.22,350,1850,17),0,.21)
        a(tone(520,.15,20,'bell'),.12,.19)
        a(noise(.065,2100,6500,70),.20,.10)
    elif name=='coin_in':
        # A small coin into the till; two quick metal contacts fit the 90ms rhythm.
        a(noise(.026,1400,6200,95),0,.17)
        a(tone(740,.105,30,'bell'),.012,.22)
        a(tone(1110,.07,42,'bell'),.057,.10)
    elif name=='collect_stamp':
        # Rubber stamp on the order ticket, then the service bell answers.
        a(tone(180,.11,34,'bass'),0,.19)
        a(noise(.07,500,3400,65),0,.22)
        a(tone(910,.23,15,'bell'),.11,.28)
    elif name=='tumbler_up':
        for k,f in enumerate((523,659,784,1046)):a(tone(f,.22,16),k*.105,.23)
        a(tone(784,.22,10,'brass'),.31,.13)
    elif name=='sack_throw':
        # An order ticket flicked across the pass.
        a(noise(.27,900,6900,14),0,.21)
        a(tone(520,.14,21,'bell'),.20,.17)
    elif name=='shutter_slam':
        # Kitchen pass clack and bell, without the old big-win explosion layer.
        a(noise(.09,250,2400,61),0,.22)
        a(tone(210,.18,19,'bass'),.026,.19)
        a(tone(910,.25,13,'bell'),.12,.26)
    elif name=='bigwin_slam': a(kick(),0,.45);a(snare(),.035,.28);a(boing(.38),.06,.19)
    elif name=='shutter_down': a(noise(.48,220,4800,4),0,.34);a(kick(),.45,.38)
    elif name=='door_slide': a(noise(.42,190,1700,3),0,.27);a(whistle(250,190,.35),.03,.12)
    elif name=='door_clack': a(click,0,.33);a(tone(230,.2,18,'bass'),.02,.26)
    elif name=='door_open': a(noise(.35,350,2400,5),0,.22);a(bell,.28,.22)
    elif name=='alarm_bell':
        for k in range(4):a(bell,k*.22,.37)
        a(voice(.45,250),.75,.13)
    elif name=='alarm_trip': a(tone(380,.23,10,'brass'),0,.3);a(tone(440,.23,10,'brass'),.24,.3);a(snare(),.35,.2)
    elif name=='fs_intro':
        # Menu board lands at 0.7s; the number stamp has its own hit at 0.93s.
        a(noise(.48,480,2500,8),.04,.15)  # counter / ticket slide
        a(tone(240,.18,18,'bass'),.70,.20)
        a(noise(.07,550,3800,75),.70,.17)
        for at,f in ((1.13,392),(1.41,523),(1.69,659),(2.11,784)):
            a(tone(f,.32,10,'piano'),at,.22)
        a(tone(910,.49,8,'bell'),2.38,.18)
    elif name in ('win_small','win_mid'):
        # Short service-bell / piano replies leave room for the collection notes.
        notes=(523,659,784) if name=='win_small' else (523,659,784,1046)
        for k,f in enumerate(notes):a(tone(f,.20,16,'piano'),k*.12,.23)
        a(noise(.038,900,4200,90),0,.10)
        if name=='win_mid':a(tone(784,.30,12,'bell'),.40,.17)
    elif name=='bill_counter':
        for k in range(17):a(click,k*.11,.13)
        for k,f in enumerate((523,659,784,659)):a(tone(f,.25,16),k*.44,.12)
    elif name=='cash_register':
        # Drawer clack, change, then a little counter bell on the final total.
        a(noise(.065,300,2300,72),0,.18)
        a(tone(220,.17,24,'bass'),.01,.16)
        a(tone(740,.18,19,'bell'),.17,.22)
        a(tone(988,.18,18,'bell'),.35,.22)
        a(tone(910,.32,10,'bell'),.54,.25)
    elif name.startswith('win_') and name not in ('win_cap',):
        tier=['win_big','win_super','win_mega','win_epic','win_max'].index(name)
        phrase=[523,659,784,1046,784,659,1046,1318]
        for k in range(4+tier):
            at=k*.37; f=phrase[k]
            a(tone(f,.38,6,'brass'),at,.22)
            a(tone(f/2,.3,9),at,.13)
            if tier>=1:a(clap(),at,.12)
            if tier>=2 and k%2==0:a(kick(),at,.18)
            if tier>=3:a(voice(.26,230+k*7),at,.05)
        a(bell,sec-.48,.24)
    elif name=='win_cap': a(tone(523,.7,4,'brass'),0,.2);a(tone(659,.7,4,'brass'),0,.18);a(tone(784,.7,4,'brass'),0,.18);a(bell,.45,.3)
    elif name=='voice_laugh':
        for k in range(5):a(voice(.32,175+22*k),k*.21,.21+.025*k)
    elif name=='voice_hup': a(voice(.28,210),0,.4)
    return norm(fade(x,.001,.015), .72 if name=='voice_laugh' else .65)


DUR={
 'btn':.14,'spin':.39,'safe_open':.78,'reel_stop':.19,'reel_tension':2.8,
 **{f'scatter_{i}':.58 for i in range(1,6)},'dial_tick':.09,
 'sack_land':.23,'bandit_land':.48,'collect_grab':.38,'coin_in':.14,
 'collect_stamp':.38,'tumbler_up':.58,'sack_throw':.38,'shutter_slam':.48,
 'shutter_down':.75,'door_slide':.58,'door_clack':.28,'door_open':.58,
 'alarm_bell':1.45,'alarm_trip':.75,'fs_intro':3.2,'win_small':.55,
 'win_mid':.95,'bill_counter':2.2,'cash_register':.9,'bigwin_slam':.55,
 'win_big':2.0,'win_super':3.0,'win_mega':4.0,'win_epic':5.0,
 'win_max':6.0,'win_cap':.95,'voice_laugh':1.45,'voice_hup':.28,
}


def music(mode, bpm):
    beat=60/bpm; bars=16; length=bars*4*beat
    x=buf(length)
    # Both modes use C major. Rests are built in so prize cues retain space.
    bass=[130.81,164.81,196,220,174.61,220,261.63,220]
    chord=[261.63,329.63,392,329.63,349.23,440,523.25,440]
    for k in range(bars*4):
        at=k*beat
        put(x,tone(bass[k%8]/2,.36,7,'bass'),at,.15)
        put(x,kick(),at,.14 if mode=='main' else .2)
        if k%2:put(x,snare(),at,.075 if mode=='main' else .13)
        if k%4 in (1,3):
            swing=.66 if mode=='main' else .5
            put(x,tone(chord[k%8],.19,15,'piano' if mode=='main' else 'guitar'),at+swing*beat,.12)
        if mode=='freespin':put(x,clap(),at+beat*.5,.075)
        else:put(x,noise(.055,1800,7000,55),at+beat*.66,.045)
        if k%8==6:
            put(x,tone(392 if mode=='main' else 523,.28,8,'brass'),at,.065)
    # Keep exactly 16 bars. Both endpoints meet at zero to avoid a click;
    # LAME writes Xing gapless delay/padding metadata for browser playback.
    n=round(.005*SR)
    x[:n]*=np.linspace(0,1,n)
    x[-n:]*=np.linspace(1,0,n)
    # Measured near -18 LUFS after MP3 encoding at this peak.
    x=norm(x,.82)
    return np.stack((x, np.roll(x,round(.0007*SR))*.98),axis=1)


def main():
    global RNG
    for name,sec in DUR.items():
        if name in CUSTOM_CUES:
            saved_rng=RNG
            RNG=np.random.default_rng(cue_seed(name))
        sample=make_sfx(name,sec)
        if name in CUSTOM_CUES:RNG=saved_rng
        wav(OUT/f'{name}.wav',sample)
    ffmpeg=imageio_ffmpeg.get_ffmpeg_exe()
    for mode,bpm in [('main',132),('freespin',152)]:
        stereo=music(mode,bpm)
        # 48 kHz, 24-bit stereo archival master, stored separately from runtime.
        master=resample_poly(stereo,160,147,axis=0)
        masterpath=MASTER/f'bgm_{mode}_48k24.wav'
        wav(masterpath,master,sr=48000,bits=24)
        src=MASTER/f'bgm_{mode}_encode.wav'
        wav(src,stereo,sr=SR,bits=16)
        subprocess.run([ffmpeg,'-hide_banner','-loglevel','error','-y','-i',str(src),
                        '-codec:a','libmp3lame','-b:a','192k','-write_xing','1',
                        str(OUT/f'bgm_{mode}.mp3')],check=True)
        src.unlink()
    print(f'Wrote {len(DUR)} original mono cues and two 192 kbps stereo loops to {OUT}')

if __name__=='__main__':main()
