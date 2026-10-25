"""Original deterministic Medusa sound library. No samples / models / network.

Requires Python 3.11+, numpy, scipy, imageio-ffmpeg (or FFMPEG env path).
Run from any directory: python design/source/medusagaze/audio/generate_audio.py
Runtime SFX: PCM16/44.1k mono; loops: Vorbis/44.1k; masters: PCM24/48k.
The deliberately synthetic vocal sketches are NOT a completed voice recording.
"""
from __future__ import annotations

import concurrent.futures
import json
import math
import os
from pathlib import Path
import re
import subprocess
import tempfile

import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, resample_poly, sosfilt

HERE = Path(__file__).resolve().parent
APP = HERE.parents[3]
RUNTIME = APP / "static/assets/audio/medusa"
MASTERS = HERE / "masters"
WAV_REFERENCE = HERE / "wav-reference"
FS = 48000
RNG = np.random.default_rng(20261024)
FFMPEG = os.environ.get("FFMPEG")
if not FFMPEG:
    import imageio_ffmpeg
    FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()


def run(*args):
    return subprocess.run([str(FFMPEG), "-hide_banner", "-nostdin", *map(str, args)],
                          capture_output=True, text=True, encoding="utf-8", errors="replace", check=True)


def noise(n, low=800, high=8500):
    x = RNG.normal(0, 1, n)
    return sosfilt(butter(2, [low, high], "bandpass", fs=FS, output="sos"), x)


def env(n, attack=.002, decay=.2):
    t = np.arange(n) / FS
    e = (1 - np.exp(-t / attack)) * np.exp(-t / decay)
    end = min(n, max(1, int(.008 * FS)))
    e[-end:] *= np.linspace(1, 0, end)
    return e


def midi(n):
    return 440 * 2 ** ((n - 69) / 12)


def note(f, dur=.3, kind="lyre", velocity=1):
    n = int(round(dur * FS))
    t = np.arange(n) / FS
    phase = 2 * np.pi * f * t
    if kind == "lyre":
        x = sum(np.sin(phase * h + .12*h) * np.exp(-t*(3+h*.9)) / h**1.55
                for h in range(1, 9))
        e = env(n, .0006, max(.08, dur*.7))
    elif kind == "flute":
        p = phase + .035*np.sin(2*np.pi*5*t)
        x = np.sin(p) + .12*np.sin(2*p) + .04*np.sin(3*p) + .06*noise(n, 1800, 6000)
        e = env(n, .012, dur*2)
        e *= np.minimum(1, np.maximum(0, (dur-t)/.07))
    elif kind == "brass":
        x = sum(np.sin(h*phase + .018*h*np.sin(2*np.pi*5*t))/h**1.3 for h in range(1, 10))
        x = np.tanh(x*1.3)
        e = env(n, .008, dur*1.2) * np.minimum(1, np.maximum(0, (dur-t)/.04))
    elif kind == "bass":
        x = np.sin(phase) + .3*np.sin(phase*2) + .08*np.sin(phase*3)
        e = env(n, .001, .14)
    elif kind == "bell":
        x = sum(np.sin(phase*r) * a*np.exp(-t*d) for r,a,d in
                [(1,1,3),(2.76,.28,8),(5.4,.15,11),(8.93,.06,15)])
        e = env(n, .0005, max(.12,dur))
    else:  # woody, low resonant xylophone
        x = np.sin(phase) + .4*np.sin(phase*3.01)*np.exp(-t*22)
        e = env(n, .0004, .07)
    return x*e*velocity


def mix(dur, events):
    out = np.zeros(round(dur*FS))
    for sec,x in events:
        start = round(sec*FS)
        if start >= len(out):
            continue
        n = min(len(x),len(out)-start)
        out[start:start+n] += x[:n]
    return out


def slide(dur, f0, f1, bright=.1):
    n=round(dur*FS); t=np.arange(n)/FS
    f=np.geomspace(f0,f1,n)
    p=2*np.pi*np.cumsum(f)/FS
    return (np.sin(p)+bright*np.sin(2*p))*env(n,.001,dur*.5)


def chips(dur=.32, pitch=1000, amount=10):
    events=[]
    for i in range(amount):
        at=i/amount*dur*.65 + (0 if i == 0 else RNG.uniform(0,.012))
        d=min(.08,dur-at)
        x=note(pitch*RNG.uniform(.6,2),d,"wood")*.45
        x+=noise(len(x),1500,11000)*env(len(x),.0002,.009)*.28
        events.append((at,x))
    return mix(dur,events)


def arp(dur=.42, notes=(72,76,79,84), kind="lyre"):
    return mix(dur,[(i*dur*.13,note(midi(n),dur-i*dur*.13,kind,.6)) for i,n in enumerate(notes)])


def voiced(dur, contour, emotion="hmm"):
    """Consistent synthetic nasal alto formant sketch; no recorded human voice."""
    n=round(dur*FS); t=np.arange(n)/FS
    f=np.interp(t,[p[0]*dur for p in contour],[p[1] for p in contour])
    f*=1+.009*np.sin(2*np.pi*5.6*t)
    phase=2*np.pi*np.cumsum(f)/FS
    harmonics=np.arange(1,40)
    formants=(420,1050,2550) if emotion=="hmm" else (670,1250,2600)
    x=np.zeros(n)
    for h in harmonics:
        hz=f*h
        strength=sum(np.exp(-.5*((hz-fr)/(70+fr*.045))**2)*a for fr,a in zip(formants,[1,.65,.22]))
        x+=np.sin(phase*h)*strength/h**.55
    e=env(n,.012,dur*1.3)
    if emotion in ("laugh","cry"):
        pulse=np.maximum(0,np.sin(2*np.pi*(4.7 if emotion=="laugh" else 4.1)*t+.2))**1.6
        e*=pulse
    if emotion=="gasp":
        x+=noise(n,1200,7000)*np.exp(-t*7)*.65
    return x*e


SPECS={}


def add(name,x,peak=-6,desc="",loop=False):
    x=np.asarray(x,dtype=np.float64)
    x-=np.mean(x,axis=0)
    x*=10**(peak/20)/max(1e-8,np.max(np.abs(x)))
    if not loop:
        # 0.15 ms anti-click ramp: first audible content well inside 5 ms.
        ramp=min(8,len(x)); x[:ramp]*=np.linspace(0,1,ramp)
    SPECS[name] = {"audio":x, "description":desc, "loop":loop}


def make_sfx():
    for i,pitch in enumerate((660,784,932,1109,1319),1):
        add(f"sfx_petrify_{i}",note(pitch,.235,"wood")*.85+chips(.235,pitch,7)*.22,-8,"ascending stone crack / 連消石化")
    add("sfx_crumble",chips(.38,1650,15),-12,"small pebbles in a bowl")
    add("sfx_drop",note(180,.17,"wood")+.15*note(480,.17,"wood"),-17,"quiet cascade landing")
    add("sfx_reel_stop",note(205,.135,"wood")+.15*chips(.135,1800,3),-11,"reel landing")
    add("sfx_win_mark",arp(.28,(72,79),"lyre"),-12,"winning symbol pluck")
    add("sfx_spin",arp(.32,(60,64,67,72,76),"lyre"),-10,"quick lyre strum")
    add("sfx_button",note(720,.09,"wood"),-15,"wood button tick")
    add("sfx_glasses_slide",mix(.235,[(0,slide(.18,1400,520)),(.11,note(2400,.125,"bell",.5))]),-12,"plastic slide / glint")
    add("sfx_glasses_on",chips(.13,1500,2),-13,"plastic click")
    add("sfx_gaze_charge",slide(.285,170,1050,.3),-10,"rising cartoon magic")
    add("sfx_gaze_beam",slide(.36,1200,260,.2),-10,"bright magic beam")
    add("sfx_orb_fly",mix(.42,[(0,noise(round(.32*FS),1800,8000)*env(round(.32*FS),.001,.09)*.18),(.06,slide(.32,600,1350,.05)*.25),(.13,note(2093,.27,"bell",.15))]),-13,"short airy flight / bell tail")
    for size,kind,nn,pk in [("s","wood",76,-9),("m","bell",81,-8),("l","bell",84,-7)]:
        x=arp(.55,(nn,nn+4,nn+7),kind)
        if size=="l": x+=mix(.55,[(0,note(midi(60),.3,"brass",.4)),(.055,note(midi(67),.3,"brass",.3))])
        add(f"sfx_orb_hit_{size}",x,pk,f"orb {size}: wood → bell → bell+brass")
    for variant in (1,2):
        x=mix(.58,[(0,slide(.45,500 if variant==1 else 420,160,.85)*.6),(.12,chips(.38,1700,9)*.25)])
        # Time-varying upper harmonics give the cartoon wah-wah contour.
        x*=.65+.35*np.sin(np.linspace(0,np.pi*5,len(x)))**2
        add("sfx_orb_crack"+("" if variant==1 else "_2"),x,-9,"comic descending wah + stone")
    add("sfx_mult_count",arp(.32,(72,76,79,84),"wood"),-17,"light multiplier count loop",True)
    add("sfx_total_mult_up",arp(.48,(72,76,79,84,88),"lyre")+mix(.48,[(.21,note(2637,.27,"bell",.2))]),-10,"ascending lyre / bell")
    add("sfx_total_to_win",slide(.36,420,1680,.1)+arp(.36,(79,84),"bell")*.4,-10,"plate beam / bright impact")
    add("sfx_scatter_land",note(midi(74),.48,"bell")+chips(.48,2400,3)*.2,-10,"shield clang / bell")
    n=round(.76*FS);t=np.arange(n)/FS
    add("sfx_scatter_tease",(np.sin(2*np.pi*660*t)+.35*np.sin(2*np.pi*990*t))*(.6+.4*np.sin(2*np.pi*13*t))*env(n,.002,.3),-18,"light expectation tremolo")
    add("sfx_scatter_trigger",arp(.92,(72,76,79,84),"bell"),-9,"rising shield fanfare")
    add("sfx_buybonus_hover",note(1200,.24,"bell"),-18,"soft shield hover")
    add("sfx_buybonus_confirm",mix(.82,[(0,slide(.7,390,1900)),(.35,noise(round(.4*FS),3000,14000)*env(round(.4*FS),.0002,.09)*.4)]),-10,"whistle up / cymbal")
    add("sfx_fg_plus5",mix(.95,[(0,note(160,.16,"wood")),(.04,arp(.85,(60,64,67,72),"brass"))]),-8,"stamp / brass phrase")
    add("sfx_statues_crack",chips(.65,1600,18)+slide(.65,260,100,.5)*np.cos(np.arange(round(.65*FS))/FS*38),-12,"stone / spring boing")
    for i in range(1,6):
        duration=2+i*.25
        events=[]
        for j,note_num in enumerate((60,64,67,72,76,79,84)[:i+2]):
            events.append((j*.16,note(midi(note_num),.65,"brass",.5)))
            events.append((j*.16,note(midi(note_num+12),.8,"bell",.35)))
        events.append((0,noise(round(.4*FS),3000,14000)*env(round(.4*FS),.0005,.1)*.15))
        add(f"sfx_bigwin_{i}",mix(duration,events),-8,f"big win tier {i} intro")
        add(f"sfx_bigwin_{i}_loop",arp(1.6,(72,76,79,84,79,76,72),"lyre")*.7+arp(1.6,(60,64,67),"bell")*.25,-14,f"big win tier {i} tail loop",True)
    voice_specs={
        "hmm":(.55,[(0,180),(.25,218),(.7,202),(1,180)],"hmm"),
        "peek":(.37,[(0,178),(.4,195),(1,260)],"hmm"),
        "annoyed":(.55,[(0,205),(.2,190),(1,145)],"hmm"),
        "gasp":(.74,[(0,210),(.45,370),(1,310)],"gasp"),
        "laugh":(1.75,[(0,200),(.35,255),(.7,220),(1,170)],"laugh"),
        "laugh_2":(1.84,[(0,210),(.35,265),(.7,235),(1,185)],"laugh"),
        "cry_happy":(1.9,[(0,245),(.3,285),(.7,225),(1,205)],"cry"),
    }
    for name,(dur,contour,emotion) in voice_specs.items():
        add(f"vo_medusa_{name}",voiced(dur,contour,emotion),-13,"SYNTHETIC ALTO SKETCH — replace with one actor")
    n=round(.56*FS)
    hiss=mix(.56,[(0,noise(round(.27*FS),3200,11000)*env(round(.27*FS),.001,.07)),(.11,noise(round(.28*FS),4000,13000)*env(round(.28*FS),.001,.08)),(.27,noise(round(.27*FS),2700,9500)*env(round(.27*FS),.001,.07))])
    add("sfx_snakes_hiss",hiss,-17,"three staggered cute snake hisses")
    add("sfx_snake_yawn",mix(.76,[(0,voiced(.65,[(0,290),(.4,440),(1,210)],"hmm")),(.62,note(1000,.12,"wood",.3))]),-18,"synthetic tiny snake yawn / lip tick")
    n=round(.96*FS);t=np.arange(n)/FS
    add("sfx_snakes_laugh",noise(n,3500,11000)*env(n,.001,.45)*np.maximum(0,np.sin(2*np.pi*6*t))**2,-17,"hissy laughter rhythm")
    # Intros and outros share the original theme and C-major harmony.
    add("stinger_fg_intro",mix(3.5,[(0,arp(2.8,(72,76,79,81,79,76),"brass")),(.22,slide(.9,600,1900)),(.8,arp(2.6,(60,64,67,72,76),"lyre"))]),-8,"theme brass / rising slide whistle")
    add("stinger_fg_outro",mix(3.65,[(0,arp(2.2,(79,76,74,72),"brass")),(.7,arp(2.6,(48,55,60,64,67,72),"lyre")),(2.4,noise(round(1.1*FS),3200,14000)*env(round(1.1*FS),.0003,.25)*.2)]),-9,"theme cadence / lyre arpeggio / cymbal")


def stereo_add(out,at,x,pan=0):
    at=round(at*FS)%len(out)
    p=(pan+1)*np.pi/4
    sig=np.column_stack([x*np.cos(p),x*np.sin(p)])
    n=min(len(sig),len(out)-at)
    out[at:at+n]+=sig[:n]
    if n<len(sig): out[:len(sig)-n]+=sig[n:]


def music(feature=False):
    bpm=135 if feature else 120
    bars=36 if feature else 32
    beat=60/bpm
    out=np.zeros((round(bars*4*beat*FS),2))
    # Newly composed two-bar call / two-bar answer. 2:1 swung eighth notes.
    motif=[(0,72),(.667,76),(1,79),(1.667,76),(2,74),(2.667,72),(3.5,67),
           (4,69),(4.667,72),(5,76),(5.667,79),(6.5,76),(7.0,74),(7.667,72)]
    roots=[48,53,50,55,48,57,53,55]
    for bar in range(bars):
        root=roots[bar%8]
        chord=[root,root+4 if root%12 in (0,5,7) else root+3,root+7]
        for b in range(4):
            sec=(bar*4+b)*beat
            stereo_add(out,sec,note(midi(root-12+(7 if b%2 else 0)),.25,"bass",.26),-.05)
            # Featherweight brush / hand drum; no heavy low rumble.
            brush=noise(round(.12*FS),3500,12000)*env(round(.12*FS),.0006,.035)*(.032 if b%2 else .018)
            stereo_add(out,sec,brush,.35)
            if feature:
                stereo_add(out,sec+beat*.667,note(240,.13,"wood",.055),.65)
            if b%2:
                for cn in chord:
                    stereo_add(out,sec,note(midi(cn+12),.28,"lyre",.072),-.55)
        phrase=(bar//4)%4
        if bar%4 in (0,1):
            for off,nn in motif:
                if int(off//4)!=bar%4: continue
                transpose=0 if phrase!=2 else 5
                stereo_add(out,(bar*4+off%4)*beat,note(midi(nn+transpose),.38,"lyre",.24),-.3)
        elif bar%4==2:
            for j,nn in enumerate((79,81,79,76)):
                stereo_add(out,(bar*4+j*.667)*beat,note(midi(nn),.43,"flute",.115),.37)
        else:
            for j,nn in enumerate((74,76,72)):
                stereo_add(out,(bar*4+j)*beat,note(midi(nn),.45,"flute",.13),.37)
        if feature and bar%4 in (1,3):
            for j,cn in enumerate(chord):
                stereo_add(out,(bar*4+2.667)*beat,note(midi(cn+12),.28,"brass",.08),.1+j*.2)
    # Circular room reflections preserve the loop's decay across its boundary.
    out+=np.roll(out,round(.073*FS),axis=0)[:,::-1]*.12
    out+=np.roll(out,round(.127*FS),axis=0)*.06
    return out


def ambience(night=False):
    dur=12; n=round(dur*FS)
    out=np.zeros((n,2))
    wind=sosfilt(butter(2,900,fs=FS,output="sos"),RNG.normal(0,1,n))*.014
    # Circular smoothing at the seam eliminates filtered-noise state mismatch.
    fade=2048; bridge=(wind[-fade:]+wind[:fade])*.5
    wind[:fade]=bridge;wind[-fade:]=bridge
    stereo_add(out,0,wind,0)
    if night:
        for k in range(30):
            at=k*.39
            chirp=note(4200+RNG.uniform(-250,250),.11,"flute",.018)
            stereo_add(out,at,chirp,.6*math.sin(k))
        for k in range(22):
            stereo_add(out,k*.53,chips(.065,2500,2)*.014,-.5)
    else:
        for at in (1.2,4.7,8.4):
            coo=mix(.7,[(0,note(390,.45,"flute",.025)),(.26,note(310,.4,"flute",.022))])
            stereo_add(out,at,coo,-.55)
    return out


def measure(path, duration=None):
    # EBU R128 requires a >=400 ms window. Repeat complete short cues to at
    # least 3 seconds for a finite, comparable audition figure (documented).
    repeat=max(0,math.ceil(3/duration)-1) if duration and duration<3 else 0
    input_args=(["-stream_loop",repeat] if repeat else [])+["-i",path]
    result=run(*input_args,"-af","loudnorm=I=-18:TP=-1:LRA=11:print_format=json","-f","null","-")
    raw=re.search(r'\{\s*"input_i"[\s\S]*?\}',result.stderr).group(0)
    obj=json.loads(raw)
    return {"lufs":float(obj["input_i"]),"true_peak_db":float(obj["input_tp"])}


def write_float(path,x):
    wavfile.write(path,FS,x.astype(np.float32))


def deliver():
    RUNTIME.mkdir(parents=True,exist_ok=True); MASTERS.mkdir(parents=True,exist_ok=True); WAV_REFERENCE.mkdir(parents=True,exist_ok=True)
    metadata=[]
    with tempfile.TemporaryDirectory(prefix="medusa-audio-") as tmp:
        for name,spec in SPECS.items():
            x=spec["audio"]
            src=Path(tmp)/(name+".wav")
            write_float(src,x)
            is_bgm=name.startswith("bgm_")
            if is_bgm:
                # Linear gain only: loudnorm dynamic processing would change the
                # start and end independently and compromise circular rendering.
                level=measure(src)
                gain=10**((-18-level["lufs"])/20)
                x=x*gain
                if np.max(np.abs(x))>10**(-2/20):
                    x=np.tanh(x*1.1)/1.1
                    write_float(src,x)
                    x*=10**((-18-measure(src)["lufs"])/20)
                write_float(src,x)
            master=MASTERS/(name+".wav")
            run("-y","-i",src,"-ar",48000,"-c:a","pcm_s24le",master)
            if is_bgm:
                run("-y","-i",master,"-ar",44100,"-c:a","pcm_s16le",WAV_REFERENCE/(name+".wav"))
            compressed=is_bgm or name.startswith("amb_")
            runtime=RUNTIME/(name+(".ogg" if compressed else ".wav"))
            args=["-y","-i",src,"-ar",44100]
            if compressed: args += ["-c:a","libvorbis","-q:a","5"]
            else: args += ["-ac",1,"-c:a","pcm_s16le"]
            run(*args,runtime)
            metadata.append({"cue":name,"file":runtime.name,"duration":round(len(x)/FS,6),
                             "sample_rate":44100,"channels":2 if x.ndim==2 else 1,
                             "format":"Vorbis q5" if compressed else "PCM16",
                             "bytes":runtime.stat().st_size,"loop":spec["loop"],
                             "description":spec["description"]})
            print("Wrote",name,flush=True)
    def inspect(item):
        item.update(measure(RUNTIME/item["file"],item["duration"]))
        item["lufs_method"]="complete cue repeated to >=3 s" if item["duration"]<3 else "whole file"
        return item
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        metadata=list(pool.map(inspect,metadata))
    total=sum(m["bytes"] for m in metadata)
    (HERE/"audio_metadata.json").write_text(json.dumps({"seed":20261024,"runtime_bytes":total,"files":metadata},ensure_ascii=False,indent=2,allow_nan=False),encoding="utf-8")
    lines=["# Medusa Gaze audio levels", "", "Deterministic original synthesis; seed 20261024. Measured on delivered runtime files using FFmpeg 7.1 `loudnorm` (EBU R128 integrated LUFS / oversampled true peak). For cues shorter than 3 s, the complete file is repeated to at least 3 s to provide finite LUFS (R128 otherwise has no valid 400 ms window on a short cue). These repeated-cue LUFS are audition references; peaks and in-game gains govern SFX matching. Longer files are measured in full.", "", f"Runtime library: **{total:,} bytes ({total/1e6:.2f} MB), {len(metadata)} files**. Masters excluded from download budget.","", "| File | Seconds | Format / Hz / channels | Peak dBTP | LUFS-I | Bytes |", "|---|---:|---|---:|---:|---:|"]
    for m in metadata:
        lines.append(f'| `{m["file"]}` | {m["duration"]:.3f} | {m["format"]} / {m["sample_rate"]} / {m["channels"]} | {m["true_peak_db"]:.2f} | {m["lufs"]:.2f} | {m["bytes"]:,} |')
    lines += ["", "All WAV SFX are mono PCM16 / 44.1 kHz; every master is PCM24 / 48 kHz. Both BGM loops are exactly 64.000 s: base 32 bars at 120 BPM, feature 36 bars at 135 BPM. Theme and harmony are original and shared. BGM runtime delivery uses Vorbis to meet the 12 MB budget; 44.1 kHz stereo PCM16 reference WAVs are delivered separately in `wav-reference/` and are intentionally excluded from shipping.", "", "Voices prefixed `vo_medusa_` are synthetic alto formant **audition sketches**, not human voice acting. No crowd recording is supplied. Physical laptop speaker / 20-spin listening sign-off and final voice actor session remain manual acceptance tasks."]
    (HERE/"LEVELS.md").write_text("\n".join(lines)+"\n",encoding="utf-8")
    assert total<=12_000_000,total
    assert all(m["true_peak_db"]<=-1 for m in metadata),"True peak exceeds -1 dBTP"
    print(f"DELIVERED {len(metadata)} files / {total:,} bytes")


if __name__=="__main__":
    make_sfx()
    add("bgm_base",music(False),-4,"original theme / 120 BPM / 32 bars",True)
    add("bgm_feature",music(True),-4,"same theme / 135 BPM / 36 bars",True)
    add("amb_plaza",ambience(False),-29,"synthesized distant doves / breeze",True)
    add("amb_night",ambience(True),-29,"synthesized crickets / brazier",True)
    deliver()
    import runpy
    runpy.run_path(str(HERE/"build_preview.py"))
