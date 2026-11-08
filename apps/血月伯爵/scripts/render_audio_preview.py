"""Render the same reference cue plan as the browser into a review MP3."""
from pathlib import Path
import json, subprocess
import numpy as np
import imageio_ffmpeg

APP=Path(__file__).resolve().parents[1]
STAKE=APP.parents[2]
plan=json.loads((STAKE/'tmp/bloodmoon-audio-plan.json').read_text())
assets=json.loads((APP/'src/game/bloodmoonAssets.json').read_text(encoding='utf-8'))['audio']
ffmpeg=imageio_ffmpeg.get_ffmpeg_exe()
rate=44100
length=max(8.0,plan['duration']/1000+1.8)
mix=np.zeros((int(rate*length),2),dtype=np.float32)

def pcm(key,seconds):
    path=APP/'static'/assets[key].lstrip('/')
    raw=subprocess.run([ffmpeg,'-v','error','-i',str(path),'-t',str(seconds),'-ar',str(rate),'-ac','2','-f','f32le','pipe:1'],check=True,stdout=subprocess.PIPE).stdout
    return np.frombuffer(raw,dtype='<f4').reshape(-1,2).copy()

bed=pcm('ngBgm',length)
mix[:len(bed)]+=bed*.5625*.28*.46*np.minimum(1,np.arange(len(bed))/int(rate*.35))[:,None]
cues=plan['cues']+[{'at':plan['duration'],'key':'Line','gain':.4},
                    {'at':plan['duration']+200,'key':'CharaWin1','gain':.5}]
spoken=sorted(c['at'] for c in cues if c['key'].startswith('Chara'))
for cue in cues:
    start=int(cue['at']/1000*rate)
    if start>=len(mix):continue
    sound=pcm(cue['key'],length-start/rate)
    if cue['key'].startswith('Chara'):
        later=next((t for t in spoken if t>cue['at']),None)
        if later is not None:
            end=min(len(sound),int((later-cue['at'])/1000*rate))
            sound[end:]=0
            begin=max(0,end-int(rate*.06))
            if end>begin:sound[begin:end]*=np.linspace(1,0,end-begin)[:,None]
    n=min(len(sound),len(mix)-start)
    mix[start:start+n]+=sound[:n]*.5625*cue.get('gain',.5)
peak=float(np.max(np.abs(mix)))
if peak>.95:mix*=.95/peak
out=STAKE/'deliverables/血月伯爵預覽/WILD音效節奏示範.mp3'
subprocess.run([ffmpeg,'-v','error','-y','-f','f32le','-ar',str(rate),'-ac','2','-i','pipe:0','-codec:a','libmp3lame','-q:a','2',str(out)],input=mix.astype('<f4').tobytes(),check=True)
print(f'{out}: {length:.2f}s, {len(cues)} cues, peak {peak:.3f}')
