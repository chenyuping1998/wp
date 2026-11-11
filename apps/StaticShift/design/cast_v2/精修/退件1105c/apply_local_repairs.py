"""Only third-round ROIs. Unselected layers and every pixel outside ROI stay r3 exact."""
from pathlib import Path
import json,shutil
import numpy as np,cv2
from scipy import ndimage as ndi
from PIL import Image
P=Path(__file__).resolve().parent;H,W=1536,1024;Y,X=np.mgrid[:H,:W];mapping=json.loads((P/'source-mapping.json').read_text())
def load(f):return np.array(Image.open(f).convert('RGBA'))
def smooth(t):t=np.clip(t,0,1);return t*t*t*(t*(t*6-15)+10)
def sdf(m):return ndi.distance_transform_edt(m)-ndi.distance_transform_edt(~m)
def register(key,meta):
 im=Image.open(P/(key+'-generated.png')).convert('RGBA').resize((1024,1024),Image.Resampling.LANCZOS);a=np.array(im);b=meta['box'];s=meta['scale'];ox,oy=meta['offset'];M=np.array([[s,0,ox-b[0]*s],[0,s,oy-b[1]*s]],np.float32)
 return cv2.warpAffine(a,M,(W,H),flags=cv2.INTER_CUBIC|cv2.WARP_INVERSE_MAP)
def blend_patch(old,g,w):
 # Blend signed silhouettes, not semi-transparent double edges.
 so=sdf(old[:,:,3]>128);sg=sdf(g[:,:,3]>128);alpha=np.clip((so*(1-w)+sg*w+.5),0,1)*255
 # Generated opaque colors extended just through the new antialias fringe.
 solid=g[:,:,3]>230;ids=ndi.distance_transform_edt(~solid,return_distances=False,return_indices=True);rgb=g[:,:,:3].copy();rgb[~solid]=g[ids[0][~solid],ids[1][~solid],:3]
 a=old.copy();zone=w>0;out=np.round(old[:,:,:3]*(1-w[:,:,None])+rgb*w[:,:,None]).clip(0,255).astype('uint8');a[zone,:3]=out[zone];a[zone,3]=np.round(alpha[zone]).astype('uint8');a[a[:,:,3]==0,:3]=0
 return a
report={}
for ch in ['dj','host']:
 D=P/'candidate'/ch;B=P/'baseline'/ch;shutil.rmtree(D/'qa');(D/'qa').mkdir();J=json.loads((B/'layout.json').read_text())['joints'];L={f.stem:load(f)for f in (B/'layers').glob('*.png')};regions={}
 for meta in mapping[ch]:
  side=meta['side'];n='leg_'+side+'_upper';a=L[n];g=register(ch+'-thigh',meta);hip=J['hip_'+side]
  # Inner edge only: do not touch outer leg, pocket, knee or hip position.
  boundary=np.full(H,np.nan)
  for y in range(H):
   xs=np.where(a[y,:,3]>128)[0]
   if len(xs):boundary[y]=xs.max()if side=='l'else xs.min()
  signed=X-boundary[:,None]if side=='l'else boundary[:,None]-X
  w=smooth((Y-(hip[1]+8))/20)*smooth(((hip[1]+145)-Y)/25)*smooth((signed+85)/20)*smooth((65-signed)/20)
  w=np.nan_to_num(w);a=blend_patch(a,g,w);L[n]=a;regions[n]={'type':'inner crotch edge','roi_pixels':int((w>0).sum())}
 if ch=='dj':
  n='arm_r_upper';a=L[n];g=register('dj-fabric',mapping['fabric']);S=np.array(J['shoulder_r']);E=np.array(J['elbow_r']);v=(E-S)/np.linalg.norm(E-S);g=cv2.warpAffine(g,np.array([[1,0,v[0]*20],[0,1,v[1]*20]],np.float32),(W,H),flags=cv2.INTER_CUBIC);q=(X-S[0])*v[0]+(Y-S[1])*v[1];w=smooth((12-q)/35)
  # Only cap and local sleeve, no detached far-canvas changes.
  w*=np.hypot(X-S[0],Y-S[1])<105
  a=blend_patch(a,g,w);L[n]=a;regions[n]={'type':'rounded sleeve cap','roi_pixels':int((w>0).sum())}
 for n,a in L.items():
  labels,count=ndi.label(a[:,:,3]>0)
  if count>1:
   sizes=np.bincount(labels.ravel());sizes[0]=0;a[labels!=sizes.argmax()]=0
  old=load(B/'layers'/(n+'.png'));changed=np.any(a!=old,axis=2)
  if changed.any():
   ys,xs=np.where(changed);regions[n]['changed_pixels']=int(changed.sum());regions[n]['changed_bbox']=[int(xs.min()),int(ys.min()),int(xs.max()+1),int(ys.max()+1)];Image.fromarray(a).save(D/'layers'/(n+'.png'))
  else:shutil.copy2(B/'layers'/(n+'.png'),D/'layers'/(n+'.png'))
 order=json.loads((B/'layout.json').read_text())['draw_order'];full=Image.new('RGBA',(W,H))
 for n in order:full.alpha_composite(Image.fromarray(L[n]))
 full.save(D/'assembled.png');full.save(D/'master.png');paper=Image.new('RGBA',(W,H),'#e5e2d6');paper.alpha_composite(full);paper.convert('RGB').save(D/'qa/assembled-paper.jpg',quality=97);report[ch]=regions
(P/'local-repair-report.json').write_text(json.dumps(report,indent=2));print(json.dumps(report,indent=2))
