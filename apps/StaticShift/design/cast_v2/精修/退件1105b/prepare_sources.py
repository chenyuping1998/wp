from pathlib import Path
import json,math,shutil
import numpy as np,cv2
from PIL import Image
P=Path(__file__).resolve().parent;B=P.parent/'退件1105/candidate'
if not(P/'baseline').exists():
 for ch in ['dj','host']:shutil.copytree(B/ch,P/'baseline'/ch)
meta={}
for ch in ['dj','host']:
 j=json.loads((B/ch/'layout.json').read_text())['joints']
 for kind,prox,dist in [('arm','shoulder','elbow'),('leg','hip','knee')]:
  for side in ['l','r']:
   n=f'{ch}_{kind}_{side}';a=np.array(Image.open(B/ch/'layers'/f'{kind}_{side}_upper.png').convert('RGBA'));S=np.array(j[prox+'_'+side],float);E=np.array(j[dist+'_'+side],float);v=(E-S)/np.linalg.norm(E-S);cross=np.array([v[1],-v[0]]);R=np.array([cross,v]);t=np.array([256,480])-R@E;M=np.c_[R,t];out=cv2.warpAffine(a,M,(512,640),flags=cv2.INTER_CUBIC)
   Image.fromarray(out).save(P/(n+'_input.png'));meta[n]={'matrix':M.tolist(),'joint_normalized':[256,480],'proximal':S.tolist(),'distal':E.tolist(),'source':f'{kind}_{side}_upper.png'}
(P/'source-mapping.json').write_text(json.dumps(meta,indent=2))
