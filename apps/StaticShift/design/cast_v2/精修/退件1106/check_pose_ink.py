from pathlib import Path
import subprocess,sys,json
from concurrent.futures import ThreadPoolExecutor
P=Path(__file__).resolve().parent;CHECK=Path.home()/'tools/spine-generator/scripts/check_outline_ink.py'
def check(f):
 r=subprocess.run([sys.executable,str(CHECK),str(f)],capture_output=True,text=True);return f.stem,json.loads(r.stdout)
for ch in ['dj','host']:
 D=P/'candidate'/ch;files=sorted((D/'qa/transparent-poses').glob('*.png'))
 with ThreadPoolExecutor(max_workers=3)as ex:out=dict(ex.map(check,files))
 (D/'qa/pose-outline-report.json').write_text(json.dumps(out,indent=2));print(ch,{k:{'verdict':v['verdict'],'uninked':v['uninked_px'],'runs':v['runs']}for k,v in out.items()},flush=True)
