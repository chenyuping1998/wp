"""Original procedural music and foley. No third-party recordings or quoted melodies."""
from pathlib import Path
import numpy as np
import math,wave,json,re,subprocess,shutil
import imageio_ffmpeg

APP=Path(__file__).resolve().parents[1]
SAUCER=APP.name.startswith("Saucer")
THEME="saucer" if SAUCER else "putt"
OUT=APP/"static/assets/audio"/THEME
SRC=APP/"design/source"/THEME/"audio"
FF=imageio_ffmpeg.get_ffmpeg_exe()
RNG=np.random.default_rng(1939 if SAUCER else 1962)
def hz(m):return 440*2**((m-69)/12)
def env(t,d,decay=7):
 return np.minimum(1,t/.004)*np.exp(-t*decay)*np.minimum(1,(d-t)/.025).clip(0,1)
def tone(f,d,sr=44100,kind="bell",end=None):
 t=np.arange(round(d*sr))/sr
 if kind=="theremin":
  freq=np.linspace(f,end or f*1.03,len(t))*(1+.007*np.sin(2*np.pi*5.7*t))
  phase=2*np.pi*np.cumsum(freq)/sr
  a=np.sin(phase)+.18*np.sin(2*phase)
 elif kind=="wood":
  a=np.sin(2*np.pi*f*t)+.4*np.sin(2*np.pi*f*2.76*t)
 elif kind=="pluck":
  a=sum(np.sin(2*np.pi*f*k*t)/k**1.5 for k in (1,2,3,4))
 else:
  a=np.sin(2*np.pi*f*t)+.35*np.sin(2*np.pi*f*2.002*t)+.13*np.sin(2*np.pi*f*3.98*t)
 return a*env(t,d,2.3 if kind=="theremin" else 13 if kind=="wood" else 7)
def noise(d,sr=44100):
 n=round(d*sr);t=np.arange(n)/sr
 raw=RNG.normal(0,.3,n)
 filtered=raw.copy();filtered[1:]-=.7*raw[:-1]
 return filtered*env(t,d,15)
def glide(d,up=True,sr=44100):
 t=np.arange(round(d*sr))/sr
 f=np.linspace(240,950,len(t)) if up else np.linspace(720,120,len(t))
 p=np.cumsum(f*(1+.05*np.sin(t*2*np.pi*9)))*2*np.pi/sr
 return (np.sin(p)+.16*np.sin(2*p))*np.minimum(1,t/.006)*np.minimum(1,(d-t)/.035).clip(0,1)*.35
def moo(d=.3,sr=44100):
 t=np.arange(round(d*sr))/sr
 # Low voiced fundamental with a closing nasal vowel: a rounded moo.
 f=125+28*np.sin(np.pi*t/d)-25*t/d+2*np.sin(2*np.pi*5*t)
 phase=np.cumsum(f)*2*np.pi/sr
 a=np.zeros(len(t))
 for k in range(1,19):
  formants=.28+1.5*np.exp(-.5*((k*f-460)/150)**2)+.55*np.exp(-.5*((k*f-1050)/220)**2)
  a+=np.sin(k*phase)*formants/k**1.15
 return a*np.sin(np.pi*t/d)**.65*.36

def monkey_chuckle(d,sr=44100):
 # Three soft, breathy oo/ee chatters, with no long human-style laugh.
 a=np.zeros(round(d*sr))
 for start,length,base in ((0,.10,410),(.14,.12,475),(.31,.14,390)):
  t=np.arange(round(length*sr))/sr
  f=base+95*np.sin(np.pi*t/length)+12*np.sin(2*np.pi*24*t)
  p=np.cumsum(f)*2*np.pi/sr
  voice=sum(np.sin(k*p)/k**1.6 for k in range(1,7))
  breath=np.random.default_rng(730+round(start*100)).normal(0,.035,len(t))
  add(a,(voice+breath)*np.sin(np.pi*t/length)**1.3,start*sr)
 return a
def add(dst,src,start):
 i=round(start);n=min(len(src),len(dst)-i)
 if n>0:dst[i:i+n]+=src[:n]
def wav(path,a,sr=44100,bits=16,peak=.7):
 a=np.nan_to_num(a);m=np.max(np.abs(a)) if len(a) else 1
 if m>0:a=a/m*peak
 path.parent.mkdir(parents=True,exist_ok=True)
 with wave.open(str(path),"wb")as f:
  f.setnchannels(1 if a.ndim==1 else a.shape[1]);f.setframerate(sr);f.setsampwidth(bits//8)
  if bits==24:
   data=(a.reshape(-1)*8388607).astype("<i4").view(np.uint8).reshape(-1,4)[:,:3].tobytes()
  else:data=(a*32767).astype("<i2").tobytes()
  f.writeframes(data)
def cue(name,d):
 sr=44100;a=np.zeros(round(d*sr))
 if name.startswith("scatter"):
  step=int(name[-1])-1;notes=[62,65,69,72,74]
  a+=tone(hz(notes[step]),d)*.45
  if SAUCER:a+=glide(d)*.3
 elif name.startswith("win_") or name in ("cash_register","fs_intro","safe_open","collect_stamp","tumbler_up","fg_level_reveal"):
  roots=[62,65,69,72,74,77] if SAUCER else [60,64,67,69,72,76]
  gap=.13 if d<1 else .25
  count=max(2,int(d/gap)-1)
  for i in range(count):
   note=roots[(i+(2 if "max" in name else 0))%len(roots)]
   t=min(.46,d-i*gap)
   if t>0:add(a,tone(hz(note),t,kind="theremin" if SAUCER else "pluck")*.6,i*gap*sr)
  if SAUCER and name in ("win_max","fg_level_reveal"):add(a,moo(),max(0,(d-.32)*sr))
 elif name in ("reel_stop","sack_land","fg_level_impact","bigwin_slam","shutter_slam","door_clack"):
  a+=tone(110 if SAUCER else 185,d,kind="wood")*.6+noise(d)*.3
 elif name in ("coin_in","btn","dial_tick","spin"):
  a+=tone(660 if SAUCER else 830,d,kind="bell" if SAUCER else "wood")*.6
 elif SAUCER and name=="voice_laugh":
  a+=monkey_chuckle(d)
 elif SAUCER and name=="collect_grab":
  add(a,moo(d-.06)*1.8,.02*sr)
  a+=glide(d)*.16
 elif SAUCER and name=="saucer_beam":
  a+=glide(d)*.28
  add(a,moo(.7)*1.4,.16*sr)
 elif name in ("voice_laugh","voice_hup"):
  for i in range(4 if "laugh" in name else 1):add(a,moo(.12),i*.16*sr)
 elif name in ("golf_roll","golf_cup"):
  a+=tone(140,d,kind="wood")*.5
  if name=="golf_roll":
   for t in np.arange(0,d,.085):add(a,noise(min(.04,d-t))*.3,t*sr)
  else:a+=tone(320,d,kind="wood")*.25
 elif SAUCER:
  a+=glide(d,up=name not in ("sack_throw","bandit_land"))
  if name in ("collect_grab","saucer_beam","ambient_far"):add(a,moo(),min(d-.3,.18)*sr)
 else:
  a+=tone(190,d,kind="wood")*.3+noise(d)*.12
  for i in range(3):
   dur=min(.18,d-i*.12)
   if dur>0:add(a,tone(hz([67,72,76][i]),dur,kind="pluck")*.35,i*.12*sr)
 # Noise and all oscillators have a short end ramp; no abrupt waveform cuts.
 t=np.arange(len(a))/sr
 a*=np.minimum(1,(d-t)/.02).clip(0,1)
 return a
def music(feature):
 sr=48000;bpm=(140 if feature else 112) if SAUCER else (136 if feature else 104)
 beat=60/bpm;duration=16*4*beat;n=round(duration*sr)
 mono=np.zeros(n)
 roots=[38,41,43,38] if SAUCER else [36,41,43,36]
 melody=[62,65,69,72,69,65,64,62,65,69,74,72,69,67,65,64] if SAUCER else [64,67,69,72,71,67,64,62,65,69,72,76,74,72,69,67]
 for bar in range(16):
  root=roots[(bar//4)%4]
  for b in range(4):
   start=(bar*4+b)*beat
   bass=root+(7 if b in (1,3) else 0)
   add(mono,tone(hz(bass),beat*.72,sr,"pluck")*.17,start*sr)
   add(mono,tone(62,.10,sr,"wood")*.09,start*sr)
   if b%2:add(mono,noise(.10,sr)*.10,start*sr)
   for off in (.5,):
    add(mono,tone(hz(root+24+(4 if not SAUCER else 3)),beat*.3,sr,"pluck")*.08,(start+off*beat)*sr)
  for k in range(4):
   start=(bar*4+k*.75+.15)*beat
   note=melody[(bar*3+k)%len(melody)]+(12 if feature and k==3 else 0)
   add(mono,tone(hz(note),beat*.59,sr,"theremin" if SAUCER else "pluck")*.14,start*sr)
  if feature:
   for k in range(8):
    add(mono,tone(hz(root+36+[0,3 if SAUCER else 4,7,12][k%4]),beat*.19,sr,"bell")*.045,(bar*4+k*.5)*beat*sr)
 # All phrases end before the loop boundary; the master begins and ends at zero.
 stereo=np.stack([mono,mono*.96],axis=1)
 stem=SRC/f'bgm_{"freespin" if feature else "main"}'
 wav(stem.with_suffix(".wav"),stereo,sr,24,.70)
 dst=OUT/(stem.name+".mp3")
 # Loudness normalization is measured, then applied linearly before gapless MP3.
 check=subprocess.run([FF,"-hide_banner","-i",str(stem.with_suffix(".wav")),"-af","loudnorm=I=-18:TP=-1:LRA=7:print_format=json","-f","null","-"],capture_output=True,text=True,encoding="utf-8",errors="replace")
 blocks=re.findall(r'\{[^{}]*"input_i"[^{}]*\}',check.stderr,re.S)
 data=json.loads(blocks[-1]) if blocks else {}
 filt="loudnorm=I=-18:TP=-1:LRA=7"
 if data:
  filt+=f":measured_I={data['input_i']}:measured_TP={data['input_tp']}:measured_LRA={data['input_lra']}:measured_thresh={data['input_thresh']}:offset={data['target_offset']}:linear=true"
 subprocess.run([FF,"-y","-hide_banner","-loglevel","error","-i",str(stem.with_suffix(".wav")),"-af",filt,"-ar","48000","-ac","2","-c:a","libmp3lame","-b:a","192k","-write_xing","1",str(dst)],check=True)
 return dict(file=dst.name,bpm=bpm,bars=16,samples=n,sampleRate=sr,sourceLoudness=data)
def main():
 OUT.mkdir(parents=True,exist_ok=True);SRC.mkdir(parents=True,exist_ok=True)
 backup=SRC/"previous"
 if not backup.exists():shutil.copytree(OUT,backup)
 durations={
 "btn":.08,"spin":.16,"reel_stop":.14,"sack_land":.22,"bandit_land":.38,"collect_grab":.72,
 "coin_in":.12,"collect_stamp":.32,"tumbler_up":.55,"dial_tick":.07,"anticipation_theme":2.2,
 "anticipation_pickup":.5,"fg_level_windup":.55,"fg_level_impact":.4,"fg_level_reveal":.72,
 "alarm_bell":1.2,"alarm_trip":.72,"sack_throw":.35,"shutter_slam":.45,"safe_open":.6,
 "fs_intro":3.0,"win_small":.5,"win_mid":.9,"bill_counter":1.8,"cash_register":.85,
 "bigwin_slam":.48,"win_big":2.0,"win_super":3.0,"win_mega":4.0,"win_epic":5.0,"win_max":6.0,
 "win_cap":.9,"voice_laugh":.8,"voice_hup":.2,"ambient_far":1.2,
 "shutter_down":.4,"door_slide":.6,"door_clack":.2,"door_open":.6,"reel_tension":2.2}
 durations.update({f"scatter_{i}":.5 for i in range(1,6)})
 durations.update({"saucer_fly":.88,"saucer_beam":1.2}if SAUCER else {"golf_roll":.9,"golf_cup":.45})
 for name,d in durations.items():
  wav(OUT/(name+".wav"),cue(name,d),peak=.4 if name in ("btn","coin_in","dial_tick") else .65)
 report=[music(False),music(True)]
 (SRC/"music_manifest.json").write_text(json.dumps(report,indent=2))
 (SRC/"README.txt").write_text("Original procedural synthesis by this project. No external recordings, samples, voices, or quoted melodies. Music masters: 48kHz stereo 24-bit WAV. Runtime: 192kbps gapless MP3, measured -18 LUFS normalization. Foley: mono 44.1kHz 16-bit WAV. Animal/character calls are synthesized, not recordings.\\n".replace("\\n","\n"))
 print(f"{THEME}: {len(durations)} original cues, two sixteen-bar music loops, {sum(p.stat().st_size for p in OUT.iterdir() if p.is_file())/1024/1024:.2f} MiB runtime audio")
if __name__=="__main__":main()
