"""Batch robust-registration candidates; full-canvas source never moves."""
from pathlib import Path
import json,sys,subprocess,argparse
from sumo_boxing_prepare import MG,FG,REPO,ROOT
p=argparse.ArgumentParser();p.add_argument('--cast',choices=['MG','FG'],required=True);args=p.parse_args()
m=json.loads((ROOT/'sumo_boxing_generated_manifest.json').read_text())[args.cast.lower()];polys=MG if args.cast=='MG' else FG
delivery=REPO/'角色生圖_相撲猴/交件'/args.cast
results={}
for name,path in m.items():
 if name=='torso':roi=[235,395,505,465] if args.cast=='MG' else [300,440,390,360]
 elif name in polys:
  pts=polys[name];left=max(0,min(q[0] for q in pts)-25);top=max(0,min(q[1] for q in pts)-25);right=min(1024,max(q[0] for q in pts)+25);bottom=min(1536,max(q[1] for q in pts)+25);roi=[left,top,right-left,bottom-top]
 else:continue
 out=delivery/'registration'/name
 command=[sys.executable,str(ROOT/'sumo_boxing_register.py'),'--source',path,'--reference',str(delivery/'clean_full.png'),'--roi',','.join(map(str,roi)),'--out',str(out)]
 done=subprocess.run(command,capture_output=True,text=True);results[name]={'ok':done.returncode==0,'detail':done.stdout.strip() if done.returncode==0 else done.stderr.strip().splitlines()[-1]}
 print(name,done.returncode,results[name]['detail'][-250:],flush=True)
(delivery/'registration').mkdir(exist_ok=True);(delivery/'registration/batch_report.json').write_text(json.dumps(results,indent=2))
