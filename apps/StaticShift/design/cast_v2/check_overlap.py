from pathlib import Path
import json,numpy as np
from PIL import Image
P=Path(__file__).resolve().parent/'精修/v1'
for ch in ['dj','host']:
 D=P/ch;j=json.loads((D/'layout.json').read_text())['joints'];parts={f.stem:np.array(Image.open(f))[:,:,3]>200 for f in (D/'layers').glob('*.png')};yy,xx=np.mgrid[:1536,:1024];out={}
 for s in ['l','r']:
  hand='hand_l_hip' if s=='l' else 'hand_r_grip'
  for kind,a,b,center,start,end in [('shoulder','torso',f'arm_{s}_upper',j['shoulder_'+s],j['shoulder_'+s],j['elbow_'+s]),('elbow',f'arm_{s}_upper',f'arm_{s}_lower',j['elbow_'+s],j['elbow_'+s],j['wrist_'+s]),('wrist',f'arm_{s}_lower',hand,j['wrist_'+s],j['elbow_'+s],j['wrist_'+s]),('hip','pelvis',f'leg_{s}_upper',j['hip_'+s],j['hip_'+s],j['knee_'+s]),('knee',f'leg_{s}_upper',f'leg_{s}_lower',j['knee_'+s],j['knee_'+s],j['ankle_'+s]),('ankle',f'leg_{s}_lower',f'foot_{s}',j['ankle_'+s],[0,0],[0,1])]:
   x,y=center;region=(xx-x)**2+(yy-y)**2<90**2;m=parts[a]&parts[b]&region;Y,X=np.where(m);v=np.array(end)-start;v=v/np.linalg.norm(v);proj=(X-x)*v[0]+(Y-y)*v[1];span=float(proj.max()-proj.min()) if len(proj) else 0;out[kind+'_'+s]={'axis_overlap_px':round(span,1),'opaque_overlap_area':int(m.sum()),'at_least_40px':span>=40}
 # Every swap shares the measured wrist/neck interface, not just defaults.
 for side in ['l','r']:
  x,y=j['wrist_'+side];v=np.array(j['wrist_'+side])-j['elbow_'+side];v=v/np.linalg.norm(v)
  for name in [n for n in parts if n.startswith('hand_'+side)]:
   m=parts[f'arm_{side}_lower']&parts[name]&((xx-x)**2+(yy-y)**2<90**2);Y,X=np.where(m);proj=(X-x)*v[0]+(Y-y)*v[1];span=float(np.ptp(proj)) if len(proj) else 0;out['swap_'+name]={'axis_overlap_px':round(span,1),'opaque_overlap_area':int(m.sum()),'at_least_40px':span>=40}
 for name in [n for n in parts if n.startswith('head_')]:
  m=parts['neck']&parts[name];Y,X=np.where(m);span=float(np.ptp(Y)) if len(Y) else 0;out['swap_'+name]={'axis_overlap_px':round(span,1),'opaque_overlap_area':int(m.sum()),'at_least_40px':span>=40}
 (D/'qa/overlap-report.json').write_text(json.dumps(out,indent=2)+'\n');print(ch,[(k,v['axis_overlap_px'])for k,v in out.items()])
