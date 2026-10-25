from pathlib import Path
import wave,json,hashlib,subprocess
import numpy as np
import imageio_ffmpeg
ROOT=Path(__file__).resolve().parents[1];AUDIO=ROOT/'static/assets/audio/treasure'
hashes=set();cues=list((AUDIO/'sfx').glob('*.wav'))
assert len(cues)>=33
for file in cues:
 with wave.open(str(file)) as wav:
  assert (wav.getnchannels(),wav.getframerate(),wav.getsampwidth())==(1,44100,2),file
  data=np.frombuffer(wav.readframes(wav.getnframes()),dtype='<i2').astype(float)/32768
 assert len(data)>100 and np.max(np.abs(data))<.89 and np.max(np.abs(data))>.1,file
 assert np.any(np.abs(data[:221])>.001),'slow onset: '+file.name
 hashes.add(hashlib.sha256(file.read_bytes()).hexdigest())
assert len(hashes)==len(cues),'duplicate cues'
for name in ['bgm_main','bgm_freespin']:
 file=AUDIO/f'{name}.mp3'
 decoded=subprocess.run([imageio_ffmpeg.get_ffmpeg_exe(),'-v','error','-i',str(file),'-f','f32le','-ac','2','-ar','44100','-'],stdout=subprocess.PIPE,check=True).stdout
 data=np.frombuffer(decoded,dtype='<f4');assert len(data)>44100*2*14 and np.max(np.abs(data))<.95,file
 print(name,'seconds',round(len(data)/88200,2),'RMS dBFS',round(float(20*np.log10(np.sqrt(np.mean(data**2)))),1))
sprite=json.loads((AUDIO/'sounds.json').read_text());assert len(sprite['sprite'])==52 and sprite['src']==['./assets/audio/treasure/treasure_sprite.mp3']
size=sum(p.stat().st_size for p in AUDIO.rglob('*') if p.is_file());assert size<12_000_000
print('OK:',len(cues),'unique mono 44.1kHz cues, 2 decoded music loops, 52 fallback entries, runtime',round(size/1e6,2),'MB')
