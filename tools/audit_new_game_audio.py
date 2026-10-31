from pathlib import Path
import json,wave,numpy as np,subprocess,imageio_ffmpeg
ROOT=Path('E:/stake/wp/apps');ffmpeg=imageio_ffmpeg.get_ffmpeg_exe()
for folder,slug,budget in [('Purrfia喵菲亞家族','purrfia',12),('ParrotRadio鸚鵡電台','parrot',14)]:
 app=ROOT/folder;audio=app/'static/assets/audio'/slug;rows=[]
 for file in sorted(audio.iterdir()):
  if file.suffix not in ['.wav','.ogg']:continue
  raw=subprocess.run([ffmpeg,'-v','error','-i',str(file),'-f','f32le','-ac','2','-ar','48000','-'],capture_output=True,check=True).stdout
  samples=np.frombuffer(raw,dtype='<f4').reshape(-1,2);peak=float(np.max(np.abs(samples)));rms=float(np.sqrt(np.mean(samples**2)));assert peak<.999,file
  rows.append({'file':file.name,'duration':round(len(samples)/48000,4),'peakDbFS':round(20*np.log10(max(peak,1e-8)),2),'rmsDbFS':round(20*np.log10(max(rms,1e-8)),2),'bytes':file.stat().st_size})
 stems=[r for r in rows if r['file'].startswith('bgm_feature_l')]
 if stems:assert max(r['duration'] for r in stems)-min(r['duration'] for r in stems)<.0001
 total=sum(r['bytes'] for r in rows)/1024**2;assert total<budget
 report={'cues':len(rows),'runtimeMiB':round(total,2),'budgetMiB':budget,'sampleClipping':False,'synchronousFeatureStems':len(stems),'creation':'Original procedural music and nonverbal synthesized character voices, not live recordings.','measurements':rows}
 (app/'design/source'/slug/'audio/validation.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8');print(folder,len(rows),'cues',round(total,2),'MiB, no sample clipping')
