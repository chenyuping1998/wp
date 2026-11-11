from pathlib import Path
from PIL import Image
import json,subprocess,sys,numpy as np
P=Path(__file__).resolve().parent;ns={'__file__':str(P/'render_actual_elbows.py')};src=(P/'render_actual_elbows.py').read_text().split("for ch in ['dj','host']:")[0].replace("Image.new('RGBA',size,PAPER)","Image.new('RGBA',size)");exec(src,ns)
for ch in ['dj','host']:
 D=P/'candidate'/ch;L=ns['prep'](D);frames=json.loads((P/(ch+'-actual-frames.json')).read_text())['frames'];out={};q=D/'qa/actual-keyposes';q.mkdir(exist_ok=True)
 for anim,t in [('gaze',.9),('win_big',.6),('win_big_loop',.5),('win_big_end',.2),('win_big_end',.25),('win_big_end',.3)]:
  f=min([f for f in frames if f['anim']==anim],key=lambda f:abs(f['time']-t));name=anim+'-'+str(f['time']);im=ns['draw'](L,f['slots'],np.array([0,0]),(2200,2300));im.save(q/(name+'.png'));r=subprocess.run([sys.executable,str(Path.home()/'tools/spine-generator/scripts/check_outline_ink.py'),str(q/(name+'.png')),'--out',str(q/(name+'-ink.jpg'))],capture_output=True,text=True);out[name]=json.loads(r.stdout)
 (q/'report.json').write_text(json.dumps(out,indent=2)+'\n');print(ch,{k:(v['verdict'],v['uninked_px'])for k,v in out.items()},flush=True)
