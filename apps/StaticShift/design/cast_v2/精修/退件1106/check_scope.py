from pathlib import Path
import json,hashlib
import numpy as np,cv2
from PIL import Image
P=Path(__file__).resolve().parent;Y,X=np.mgrid[:1536,:1024];sha=lambda f:hashlib.sha256(f.read_bytes()).hexdigest();report={}
for ch in ['dj','host']:
 B=P/'baseline'/ch;D=P/'candidate'/ch;J=json.loads((B/'layout.json').read_text())['joints'];out={'changed_layers':{},'unchanged_layers':[]}
 for f in sorted((D/'layers').glob('*.png')):
  n=f.stem;old=np.array(Image.open(B/'layers'/f.name));new=np.array(Image.open(f));delta=np.any(old!=new,axis=2)
  if not delta.any():assert sha(f)==sha(B/'layers'/f.name);out['unchanged_layers'].append(n);continue
  assert n in {'arm_l_upper','arm_l_lower','arm_r_upper','arm_r_lower'},(ch,n)
  side=n.split('_')[1];E=np.array(J['elbow_'+side]);rad=np.hypot(X-E[0],Y-E[1]);assert not delta[rad>=96].any(),(ch,n,'outside elbow radius')
  W=np.array(J['wrist_'+side]);wrist=(X-W[0])**2+(Y-W[1])**2<25**2;assert n.endswith('upper')or not delta[wrist].any(),(ch,n,'wrist changed')
  ys,xs=np.where(delta);out['changed_layers'][n]={'changed_pixels':int(delta.sum()),'bbox':[int(xs.min()),int(ys.min()),int(xs.max()+1),int(ys.max()+1)],'sha256':sha(f),'outside_elbow_96px_unchanged':True,'wrist_25px_RGBA_unchanged':bool(not delta[wrist].any())if n.endswith('lower')else 'wrist belongs to lower layer'}
  if n.endswith('upper'):
   shoulder=np.array(J['shoulder_'+side]);zone=(X-shoulder[0])**2+(Y-shoulder[1])**2<60**2;assert not delta[zone].any(),(ch,n,'shoulder changed')
   r,g,b=old[:,:,:3].astype(float).transpose(2,0,1);hsv=cv2.cvtColor(old[:,:,:3],cv2.COLOR_RGB2HSV);cloth=(old[:,:,3]>128)&((r>160)&(g>140)&(b>120)if ch=='host'else(hsv[:,:,0]<=8)&(hsv[:,:,1]>100)&(r>70));out['changed_layers'][n]['cloth_colored_pixels_changed']=int((cloth&delta).sum())
 assert len(out['changed_layers'])==4;assert len(out['unchanged_layers'])==22;report[ch]=out
(P/'scope-report.json').write_text(json.dumps(report,indent=2)+'\n');print('SCOPE: 8 local elbow layers; 44 source files byte-identical. All shoulder roots and wrist pixels unchanged.');print({ch:{n:r.get('cloth_colored_pixels_changed')for n,r in v['changed_layers'].items()if n.endswith('upper')}for ch,v in report.items()})
