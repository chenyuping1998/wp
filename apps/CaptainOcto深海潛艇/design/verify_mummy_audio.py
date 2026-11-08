"""Audit decoded runtime audio, not just masters or promised report values."""
from pathlib import Path
import json,math
import numpy as np
import soundfile as sf
from scipy.signal import resample_poly
import pyloudnorm as pyln
ROOT=Path(__file__).resolve().parent;APP=ROOT.parent
report=json.loads((ROOT/'source/mummy_audio/audio_report.json').read_text());licenses=json.loads((ROOT/'source/mummy_audio/LICENSES.json').read_text())
rows=[];errors=[];total=0
for r in report:
 p=APP/'static/assets/audio/mummy'/r['file'];a,sr=sf.read(p,always_2d=True);total+=p.stat().st_size
 quiet=round(.005*sr) if len(a)<=2205 else 2205
 tp=20*math.log10(max(float(abs(resample_poly(a,4,1,axis=0)).max()),1e-10));tail=20*math.log10(max(float(abs(a[-quiet:]).max()),1e-10));seam=float(abs(a[0]-a[-1]).max())
 sources=[x for x in licenses if x['output_filename']==r['file']]
 if sr!=44100 or tp> -1:errors.append(f'{p.name}: sample rate / true peak {sr} {tp:.2f}')
 if not r['loop'] and tail>-42:errors.append(f'{p.name}: tail {tail:.2f}dBFS')
 if p.stem in ['scarab_tick','sun_tick'] and tp< -25:errors.append(f'{p.name}: inaudible tick peak {tp:.2f}')
 if r['loop'] and seam>.003:errors.append(f'{p.name}: loop seam {seam}')
 if not sources:errors.append(f'{p.name}: missing provenance')
 for s in sources:
  if s['license']!='CC0-1.0' or not (ROOT/'source/mummy_audio'/s['source_file']).exists():errors.append(f'{p.name}: source invalid')
 row=dict(file=p.name,duration=len(a)/sr,channels=a.shape[1],true_peak_dbtp=round(tp,2),tail_window_ms=quiet/sr*1000,tail_dbfs=round(tail,2),loop_seam=seam,licensed_sources=len(sources))
 if p.stem.startswith('bgm_'):
  row['lufs']=round(pyln.Meter(sr).integrated_loudness(a),2)
  if abs(row['lufs']+20)>1:errors.append(f'{p.name}: BGM loudness {row["lufs"]}')
 rows.append(row)
if total>10*1024*1024:errors.append(f'{total} exceeds10MiB')
result=dict(passed=not errors,files=len(rows),bytes=total,errors=errors,rows=rows)
(ROOT/'source/mummy_audio/verification.json').write_text(json.dumps(result,indent=2))
print(json.dumps({k:result[k] for k in ['passed','files','bytes','errors']},indent=2));raise SystemExit(bool(errors))
