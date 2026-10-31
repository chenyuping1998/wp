"""Original, deterministic instrument and non-verbal character synthesis.

No third-party samples or melodies. Runtime SFX PCM16/44.1k, music Vorbis;
musical masters PCM24/48k. All layered stems share a sample-aligned 32-bar clock.
"""
from pathlib import Path
import json, math, re, subprocess, sys
import numpy as np
import imageio_ffmpeg

WORK = Path('E:/stake')
FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()
SR = 48000
RNG = np.random.default_rng(20261025)
GAME = sys.argv[1]
SLUG = 'purrfia' if GAME == 'Purrfia' else 'parrot'
FOLDER = 'Purrfia喵菲亞家族' if GAME == 'Purrfia' else 'ParrotRadio鸚鵡電台'
APP = WORK / 'wp/apps' / FOLDER
SOURCE = APP / 'design/source' / SLUG / 'audio'
RUNTIME = APP / 'static/assets/audio' / SLUG
SOURCE.mkdir(parents=True, exist_ok=True)
RUNTIME.mkdir(parents=True, exist_ok=True)
META = json.loads((SOURCE/'audio_metadata.json').read_text(encoding='utf-8')) if '--music-only' in sys.argv else {}

def midi(n): return 440 * 2 ** ((n - 69) / 12)

def tone(n, dur=.4, instrument='piano'):
    f = midi(n); t = np.arange(round(dur*SR)) / SR; p = 2*np.pi*f*t
    if instrument == 'bass':
        x = np.sin(p)+.28*np.sin(2*p)+.09*np.sin(3*p); decay=3.7
    elif instrument == 'pan':
        x = sum(a*np.sin(p*h)*np.exp(-t*d) for h,a,d in [(1,1,3),(2,.28,9),(3.01,.12,15),(4.02,.05,20)]); decay=1.8
    elif instrument == 'brass':
        x = np.tanh(sum(np.sin(p*h+.025*np.sin(t*31))/h**1.2 for h in range(1,10))*1.1); decay=1.3
    elif instrument == 'organ':
        x = np.sin(p)+.27*np.sin(p*2)+.12*np.sin(p*3); decay=.7
    else:
        x = sum(np.sin(p*h)*np.exp(-t*h*.8)/h**1.7 for h in range(1,9)); decay=5.5 if instrument=='guitar' else 3.8
    e = (1-np.exp(-t/.002))*np.exp(-t*decay)
    e *= np.clip((dur-t)/.02,0,1)
    return (x*e).astype('float32')

def hit(dur=.12, kind='wood'):
    t=np.arange(round(dur*SR))/SR
    noise=RNG.normal(0,1,len(t)); high=noise-np.roll(noise,1)
    if kind=='kick': x=np.sin(2*np.pi*(48*t+7*(1-np.exp(-t*30))))*np.exp(-t*24)
    elif kind=='brush': x=np.convolve(noise,np.ones(7)/7,'same')*np.exp(-t*22)
    elif kind=='hat': x=high*np.exp(-t*65)*.3
    elif kind=='clap': x=high*(np.exp(-t*45)+.55*np.exp(-np.abs(t-.018)*140))*.3
    else: x=(np.sin(t*2*np.pi*430)+.3*np.sin(t*2*np.pi*1130))*np.exp(-t*50)+high*np.exp(-t*140)*.08
    x[:12]*=np.linspace(0,1,12);x[-min(256,len(x)):]*=np.linspace(1,0,min(256,len(x)))
    return x.astype('float32')

def add(buf, sec, x, amp=1, pan=0):
    start=round(sec*SR); ids=(start+np.arange(len(x)))%len(buf)
    if buf.ndim==1: np.add.at(buf,ids,x*amp)
    else:
        np.add.at(buf[:,0],ids,x*amp*math.sqrt((1-pan)/2))
        np.add.at(buf[:,1],ids,x*amp*math.sqrt((1+pan)/2))

def encode(name, x, music=False, bpm=None, stem=False):
    x=np.asarray(x,dtype='float32'); x-=x.mean(axis=0)
    peak=float(np.max(np.abs(x))); x*=.73/max(peak,1e-9)
    channels=1 if x.ndim==1 else 2
    raw=x.astype('<f4').tobytes()
    common=[FFMPEG,'-hide_banner','-loglevel','error','-y','-f','f32le','-ar',str(SR),'-ac',str(channels),'-i','pipe:0']
    if music:
        master=SOURCE/'masters'/f'{name}.wav';master.parent.mkdir(exist_ok=True)
        # Gentle compression before gain, no time-varying loop-boundary processing.
        target=.095 if stem else .13
        gain=min(target/max(float(np.sqrt(np.mean(x*x))),1e-6),.68/max(float(np.max(np.abs(x))),1e-6))
        x*=gain;raw=x.astype('<f4').tobytes()
        subprocess.run(common+['-c:a','pcm_s24le',str(master)],input=raw,check=True)
        out=RUNTIME/f'{name}.ogg'
        subprocess.run(common+['-c:a','libvorbis','-q:a','4',str(out)],input=raw,check=True)
    else:
        out=RUNTIME/f'{name}.wav'
        subprocess.run(common+['-ar','44100','-c:a','pcm_s16le',str(out)],input=raw,check=True)
    META[name]={'file':out.name,'seconds':len(x)/SR,'channels':channels,'sourceRate':SR,'peakDb':20*math.log10(max(1e-8,float(np.max(np.abs(x))))),'rmsDb':20*math.log10(max(1e-8,float(np.sqrt(np.mean(x*x))))),'bpm':bpm,'bars':32 if music else None,'originalSynthesis':True}

def compose(name,bpm,root,part='all'):
    beat=60/bpm; duration=128*beat; buf=np.zeros((round(duration*SR),2),dtype='float32')
    cat=SLUG=='purrfia'; progression=[0,0,5,0,7,5,0,7]; motif=[0,3,7,10,7,5,3,5] if cat else [0,4,7,9,7,2,4,5]
    for bar in range(32):
        chord=root+progression[bar%8]; minor=3 if cat else 4
        if part in ('all','l1'):
            for b,interval in enumerate([0,7,10 if cat else 12,7]):add(buf,(bar*4+b)*beat,tone(chord-24+interval,beat*.85,'bass'),.27,-.08)
            for b in (0,2):add(buf,(bar*4+b)*beat,hit(.18,'kick'),.15)
            for k in range(8):add(buf,(bar*4+k*.5+(1/6 if cat and k%2 else 0))*beat,hit(.10,'brush' if cat else 'hat'),.085,.45)
            if bar%2==0:
                for k in range(4):
                    n=root+12+motif[(bar//2*3+k)%len(motif)]
                    add(buf,(bar*4+k*.75+.5)*beat,tone(n,beat*.65,'piano' if cat else 'pan'),.14,-.3)
        if part in ('all','l2'):
            for b in (1,3):add(buf,(bar*4+b)*beat,hit(.18,'brush' if cat else 'clap'),.13,.16)
            for b in (.5,1.5,2.5,3.5):
                for n in [chord,chord+minor,chord+7,chord+10 if cat else chord+12]:add(buf,(bar*4+b)*beat,tone(n,beat*.3,'piano' if cat else 'guitar'),.065,-.45)
        if part in ('all','l3') and bar%4 in (2,3):
            for k in range(3):add(buf,(bar*4+k*.75+.25)*beat,tone(root+12+motif[(bar+k)%8],beat*.55,'brass'),.10,.3)
        if part in ('all','l4'):
            if cat:
                if bar%4==0:
                    for n in (chord,chord+minor,chord+7):add(buf,bar*4*beat,tone(n,beat*3.8,'organ'),.04,.4)
            elif bar%4==3:
                t=np.arange(round(beat*.4*SR))/SR
                scratch=RNG.normal(0,.15,len(t))*np.sin(2*np.pi*17*t)*np.exp(-t*7)
                add(buf,(bar*4+3.5)*beat,scratch,.5,.25)
    encode(name,buf,True,bpm,part!='all')

def effect(name):
    n=sum(name.encode());dur=.25
    if name.startswith('vo_'):
        dur=.75 if not any(k in name for k in ['laugh','party','purr']) else 1.7
        t=np.arange(round(dur*SR))/SR
        pitch=(130 if SLUG=='purrfia' else 530)*(1+.20*np.sin(np.pi*t/dur))
        p=2*np.pi*np.cumsum(pitch)/SR
        x=sum(np.sin(p*h)/h**1.2 for h in range(1,12))
        x*=np.sin(np.pi*t/dur)**.7
        x*=.55+.45*np.maximum(0,np.sin(2*np.pi*(23 if SLUG=='purrfia' else 7)*t))
    elif 'stinger' in name or 'bigwin' in name:
        dur=3.2 if 'stinger' in name or 'loop' not in name else 2
        x=np.zeros(round(dur*SR),dtype='float32')
        for k,v in enumerate([0,3 if SLUG=='purrfia' else 4,7,10 if SLUG=='purrfia' else 12]):add(x,k*.15,tone(62+v,dur-k*.15,'brass'),.4)
        add(x,0,hit(.3,'clap'),.35)
    elif any(k in name for k in ['slam','max','big','hit','connect','claim','trigger']):
        dur=.6 if 'claim' not in name else 1.1;x=np.zeros(round(dur*SR),dtype='float32')
        for k,v in enumerate([0,3 if SLUG=='purrfia' else 4,7,12]):add(x,k*.06,tone(62+v,dur-k*.06,'piano' if SLUG=='purrfia' else 'pan'),.4)
        add(x,0,hit(.2,'kick'),.5)
    elif any(k in name for k in ['miss','scratch','sleeve','box_open','swipe','fly','whoosh']):
        dur=.38;t=np.arange(round(dur*SR))/SR;f=np.linspace(1200,240 if 'miss' in name else 2100,len(t));p=2*np.pi*np.cumsum(f)/SR
        x=(np.sin(p)*.3+RNG.normal(0,.3,len(t)))*np.sin(np.pi*t/dur)**2
    else:
        step=int(re.findall(r'_(\d+)$',name)[0]) if re.findall(r'_(\d+)$',name) else n%5
        x=tone(62+([0,3,5,6,7,10][(step-1)%6] if SLUG=='purrfia' else step*2),dur,'piano' if SLUG=='purrfia' else 'pan')+hit(dur)*.14
    encode(name,x)

if SLUG=='purrfia':
    compose('bgm_base',90,62);compose('bgm_feature',115,65)
    names='stinger_fg_intro stinger_fg_outro sfx_chain_fill sfx_lamp_off sfx_neon_on sfx_neon_off sfx_page_turn vo_boss_hmm vo_boss_hmm_2 vo_boss_proud vo_boss_purr vo_boss_hiss vo_boss_yawn vo_boss_shock vo_boss_growl vo_boss_laugh vo_boss_laugh_2 sfx_monocle_push sfx_monocle_glint sfx_treat_push sfx_catnip_drop sfx_stamp_catch sfx_box_land sfx_box_peek sfx_box_open sfx_box_open_more sfx_box_reveal sfx_box_connect sfx_stamp_raise sfx_stamp_slam sfx_stamp_value sfx_stamp_big sfx_stamp_beam sfx_mult_sum sfx_mult_count sfx_stamp_return sfx_stamp_fade sfx_mark sfx_cell_up sfx_cell_tier sfx_cell_max sfx_cell_beam sfx_cells_clear sfx_turf_claim sfx_drop sfx_cluster_outline sfx_swipe sfx_win_to_ticker sfx_ring_land sfx_ring_tease sfx_ring_trigger sfx_spin sfx_button sfx_buybonus_hover sfx_buybonus_confirm sfx_buy_card_hover_super sfx_buybonus_confirm_super sfx_fg_plus5 sfx_bigwin_end'.split()
    names += [f'sfx_cluster_{i}' for i in range(1,7)]
else:
    compose('bgm_base',110,65)
    for part in ['l1','l2','l3','l4']:compose('bgm_feature_'+part,124,67,part)
    names='stinger_fg_intro stinger_fg_outro vo_squawk_hmm vo_squawk_good vo_squawk_call vo_squawk_call_2 vo_squawk_success vo_squawk_awkward vo_squawk_shock vo_squawk_party vo_squawk_party_2 vo_squawk_mimic_1 vo_squawk_mimic_2 vo_squawk_mimic_3 sfx_feather_puff sfx_scratch_build sfx_encore_neon sfx_record_rise sfx_spotlight sfx_encore_hold sfx_encore_hit sfx_encore_miss sfx_neon_off sfx_knob_click sfx_knob_shake_s sfx_knob_shake_m sfx_knob_shake_l sfx_knob_max sfx_mult_apply sfx_mult_count sfx_record_sleeve sfx_record_toss sfx_record_spin sfx_record_hit sfx_record_miss sfx_drop sfx_note_fly sfx_win_to_ticker sfx_mic_land sfx_mic_tease sfx_mic_trigger sfx_lights_on sfx_firework sfx_ticket sfx_spin sfx_button sfx_buybonus_hover sfx_buybonus_confirm sfx_buy_card_hover_super sfx_buybonus_confirm_super sfx_fg_plus5 sfx_bigwin_end sfx_seagull'.split()
    names += [f'sfx_win_{i}' for i in range(1,7)]+[f'sfx_flip_{i}' for i in range(1,19)]+[f'sfx_knob_led_{i}' for i in range(1,21)]+[f'sfx_record_reveal_t{i}' for i in range(1,5)]
names += [f'sfx_bigwin_{i}{suffix}' for i in range(1,6) for suffix in ['', '_loop']]
for name in ([] if '--music-only' in sys.argv else names):effect(name)
(SOURCE/'audio_metadata.json').write_text(json.dumps(META,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
manifest={name:entry['file'] for name,entry in META.items()}
(APP/'src/game/audioManifest.ts').write_text('export const GAME_AUDIO: Record<string,string> = '+json.dumps(manifest,indent=2)+';\n',encoding='utf-8')
total=sum(p.stat().st_size for p in RUNTIME.iterdir() if p.is_file())
limit=12 if SLUG=='purrfia' else 14
assert total<limit*1024*1024,(total,limit)
print(f'{GAME}: {len(META)} original cues, {total/1024/1024:.2f} MiB; 32-bar stereo music, 48k/24bit masters.')
