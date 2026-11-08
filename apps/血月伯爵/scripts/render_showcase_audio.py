"""Offline review montage of the same phase cues; not a gameplay recording."""
from pathlib import Path
import json, subprocess
import numpy as np
import imageio_ffmpeg

APP=Path(__file__).resolve().parents[1]
STAKE=APP.parents[2]
plan=json.loads((STAKE/'tmp/bloodmoon-showcase-audio-plan.json').read_text())
files=json.loads((APP/'static/bloodmoon/manifest.json').read_text(encoding='utf8'))['audio']
ffmpeg=imageio_ffmpeg.get_ffmpeg_exe()
rate=22050
mix=np.zeros((round((plan['duration']/1000+1)*rate),2),np.float32)

def add(key,at,gain,duration=None,loop=False,fade_in=0,fade_out=60):
    path=APP/'static'/files[key].lstrip('/')
    command=[ffmpeg,'-v','error']+(['-stream_loop','-1'] if loop else [])+['-i',str(path)]
    limit=duration if duration is not None else plan['duration']-at+1000
    raw=subprocess.run(command+['-t',str(limit/1000),'-ar',str(rate),'-ac','2','-f','f32le','pipe:1'],stdout=subprocess.PIPE,check=True).stdout
    sound=np.frombuffer(raw,dtype='<f4').reshape(-1,2).copy()
    for fade,reverse in [(fade_in,False),(fade_out,True)]:
        n=min(len(sound),round(fade/1000*rate))
        if n:
            ramp=np.linspace(0,1,n,dtype=np.float32)
            if reverse:sound[-n:]*=ramp[::-1,None]
            else:sound[:n]*=ramp[:,None]
    start=round(at/1000*rate);n=min(len(sound),len(mix)-start)
    if n>0:mix[start:start+n]+=sound[:n]*gain*.5625

cues=[]
for phase in plan['phases']:
    at=phase['at']
    add(phase['music'],at,.26*phase['duck'],phase['duration'],True,300,300)
    cues.extend(dict(c,at=at+c['at']) for c in phase['cues'])
    if phase['name']=='WILD':add('ngWILDvibe',at+400,.22,plan['wildEnd']-400,True,120,180)
    if phase['name']=='Epic win':add('Mega_RunNum',at,.2,phase['duration']-300,True,120,180)
cues.sort(key=lambda c:c['at'])
for i,cue in enumerate(cues):
    group='speech' if cue['key'].startswith('Chara') else 'fanfare' if cue['key'].endswith('_Start') else ''
    next_cue=next((c for c in cues[i+1:] if (group=='speech' and c['key'].startswith('Chara')) or (group=='fanfare' and c['key'].endswith('_Start'))),None) if group else None
    add(cue['key'],cue['at'],cue.get('gain',.5),next_cue['at']-cue['at'] if next_cue else None,fade_out=60)
peak=float(np.max(np.abs(mix)))
if peak>.95:mix*=.95/peak
out=STAKE/'deliverables/血月伯爵預覽/完整演出音效串接示範.mp3'
subprocess.run([ffmpeg,'-v','error','-y','-f','f32le','-ar',str(rate),'-ac','2','-i','pipe:0','-c:a','libmp3lame','-q:a','2',str(out)],input=mix.astype('<f4').tobytes(),check=True)
print(f'{len(cues)} cues; {len(mix)/rate:.2f}s; peak {peak:.3f}; {out}')
