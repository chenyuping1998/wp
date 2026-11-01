from pathlib import Path
import json,wave,hashlib
import numpy as np
D=Path(__file__).resolve().parent;A=D.parents[2];O=A/'static/assets/audio/hypno'
for row in json.loads((D/'metadata.json').read_text()):
 p=O/(row['cue']+'.wav');assert hashlib.sha256(p.read_bytes()).hexdigest()==row['sha256']
 with wave.open(str(p)) as w:
  assert w.getsampwidth()==2 and w.getframerate()==row['sampleRate'];assert w.getnframes()==row['frames'];v=np.frombuffer(w.readframes(w.getnframes()),'<i2')/32768
 assert np.isfinite(v).all() and np.max(np.abs(v))<.95 and np.sqrt(np.mean(v*v))>.001
 if row['loop']:assert row['edgeDelta']<.005
budget=sum(p.stat().st_size for p in (A/'static/assets/audio').rglob('*') if p.is_file());assert budget<12000000
print('14 new audio cues: source hashes, PCM decode, finite non-silent signal, headroom, loop boundaries; total audio',budget,'bytes')
