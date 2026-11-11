"""Only organic elbow underpaint/contours. Shoulder, cuff cloth, shafts and wrists locked."""
from pathlib import Path
import json,shutil
import numpy as np,cv2
from scipy import ndimage as ndi
from PIL import Image
P=Path(__file__).resolve().parent;H,W=1536,1024;Y,X=np.mgrid[:H,:W]
def smooth(t):t=np.clip(t,0,1);return t*t*t*(t*(t*6-15)+10)
def sdf(m):return ndi.distance_transform_edt(m)-ndi.distance_transform_edt(~m)
def clean(a):
 a[a[:,:,3]==0,:3]=0;lab,n=ndi.label(a[:,:,3]>0)
 if n>1:
  counts=np.bincount(lab.ravel());counts[0]=0;a[lab!=counts.argmax()]=0
 return a
report={}
for ch in ['dj','host']:
 B=P/'baseline'/ch;D=P/'candidate'/ch;J=json.loads((B/'layout.json').read_text())['joints'];L={f.stem:np.array(Image.open(f).convert('RGBA'))for f in (B/'layers').glob('*.png')};details={}
 gen=np.array(Image.open(P/(ch+'-straight-generated.png')).convert('RGBA'));r,g,b=gen[:,:,:3].astype(float).transpose(2,0,1);ink=(gen[:,:,3]>230)&(r<22)&(g<22)&(b<22);black=np.median(gen[ink,:3],axis=0)
 for side in ['l','r']:
  E=np.array(J['elbow_'+side],float);S=np.array(J['shoulder_'+side],float);Wrist=np.array(J['wrist_'+side],float);v=(E-S)/np.linalg.norm(E-S);vl=(Wrist-E)/np.linalg.norm(Wrist-E);q=(X-E[0])*v[0]+(Y-E[1])*v[1];c=-(X-E[0])*v[1]+(Y-E[1])*v[0];ql=(X-E[0])*vl[0]+(Y-E[1])*vl[1];cl=-(X-E[0])*vl[1]+(Y-E[1])*vl[0];rad=np.hypot(X-E[0],Y-E[1]);upper=L[f'arm_{side}_upper'].copy();lower=L[f'arm_{side}_lower'].copy();blendlen=min(65,float(np.linalg.norm(Wrist-E))-30);rj=(25 if ch=='dj'else 23.5)if side=='l'else(18 if ch=='dj'else 16);tiplen=31 if side=='l'else rj+5
  sample=(ql>28)&(ql<52)&(abs(cl)<9)&(lower[:,:,3]>230);rgb=np.median(lower[sample,:3],axis=0)
  # Classify cloth including its ink by nearest non-black source pigment.
  rr,gg,bb=upper[:,:,:3].astype(float).transpose(2,0,1);opaque=upper[:,:,3]>128
  hsv=cv2.cvtColor(upper[:,:,:3],cv2.COLOR_RGB2HSV);cf=opaque&((rr>160)&(gg>140)&(bb>120)if ch=='host'else(hsv[:,:,0]<=8)&(hsv[:,:,1]>100)&(rr>70)&(q<-15))
  cbins=np.arange(-160,161);edge=[]
  for z in cbins:
   vals=q[cf&(abs(c-z)<1.2)];edge.append(float(vals.max())if len(vals)else np.nan)
  edge=np.array(edge);valid=np.isfinite(edge);edge=np.interp(cbins,cbins[valid],edge[valid]);edge=ndi.gaussian_filter1d(edge,1.6);boundary=np.interp(c,cbins,edge)+3.5
  cloth=(q<=boundary)&(c>=cbins[valid].min()-2)&(c<=cbins[valid].max()+2)&(upper[:,:,3]>0)
  # Rounded taper of the upper hidden end, with a smooth return to original flesh.
  stem=rj+np.maximum(-q,0)*.12;tip=rj*np.sqrt(np.maximum(0,1-(np.maximum(q,0)/tiplen)**2));width=np.where(q<0,stem,tip)
  sections=np.arange(-110,65);bounds=[]
  for z in sections:
   vals=c[(upper[:,:,3]>128)&(abs(q-z)<1)];bounds.append([vals.min(),vals.max()]if len(vals)else[-rj,rj])
  bounds=ndi.gaussian_filter1d(np.array(bounds),2.1,axis=0);lo0=np.interp(q,sections,bounds[:,0]);hi0=np.interp(q,sections,bounds[:,1]);w=smooth((q+70)/50)*(rad<96);w*=~cloth
  low=lo0*(1-w)-width*w;high=hi0*(1-w)+width*w;d=np.minimum(c-low,high-c);d=np.minimum(d,tiplen-q);zone=w>0;upper[zone,3]=np.round(np.clip(d[zone]+.5,0,1)*255).astype('uint8')
  # Lower root: narrow concealed cap; continuous natural taper back to the unchanged shaft.
  old=lower[:,:,3]>128;lo=np.zeros(H);hi=np.zeros(H)
  # Sample original left/right half-width along each 1px longitudinal section.
  sections=np.arange(-30,100);bounds=[]
  for z in sections:
   vals=cl[old&(abs(ql-z)<.9)];bounds.append([vals.min(),vals.max()]if len(vals)else[-(rj+1),rj+1])
  bounds=np.array(bounds);oldlo=np.interp(ql,sections,bounds[:,0]);oldhi=np.interp(ql,sections,bounds[:,1]);f=smooth((blendlen-ql)/blendlen);low=oldlo*(1-f)-(rj-1)*f;high=oldhi*(1-f)+(rj-1)*f;capR=rj-1;cap=np.sqrt(np.maximum(0,capR**2-ql**2));low=np.where(ql<0,-cap,low);high=np.where(ql<0,cap,high);d=np.minimum(cl-low,high-cl);d=np.where(ql<-capR,-1,d);zone=(ql<blendlen)&(rad<96);feather=smooth((blendlen-ql)/14);newd=sdf(old)*(1-feather)+d*feather;lower[zone,3]=np.round(np.clip(newd[zone]+.5,0,1)*255).astype('uint8')
  if side=='r':lower[ql<0,3]=L[f'arm_{side}_lower'][ql<0,3]
  # Repaint only joint flesh with registered generated pigment, chroma-matched
  # to the original shaft. Shared central pigment is rotation invariant.
  for name,a,weight in [(f'arm_{side}_upper',upper,w*smooth((87-rad)/25)),(f'arm_{side}_lower',lower,zone*smooth((blendlen-ql)/22))]:
   lum=a[:,:,:3]@[.299,.587,.114];material=(a[:,:,3]>0)
   if name.endswith('upper'):material&=~cloth&((lum>120)|(q>=0))
   else:material&=((lum>120)|(ql<30))
   a[:,:,:3]=np.round(a[:,:,:3]*(1-(weight*material)[:,:,None])+rgb*(weight*material)[:,:,None]).clip(0,255).astype('uint8')
  original=L[f'arm_{side}_upper'];upper[cloth]=original[cloth]
  # Any cap arc exposed by the unchanged original poses must remain inked;
  # always-covered underpaint stays skin-colored. Evaluate the real rig too.
  matrices=[]
  def mat(vals):
   a,b,c,d,e,f=vals;return np.array([[a,b,e],[c,d,f],[0,0,1.]])
  for fr in json.loads((P/(ch+'-actual-frames.json')).read_text())['frames']:
   slots=dict(fr['slots']);matrices.append(np.linalg.inv(mat(slots[f'arm_{side}_upper']))@mat(slots[f'arm_{side}_lower']))
  ua=np.arctan2(v[1],v[0]);la=np.arctan2(vl[1],vl[0])
  for ang in [0,75,90,-85,-30,120,150,-60,30,np.degrees(ua-la)]:
   t=np.radians(ang);R=np.array([[np.cos(t),-np.sin(t)],[np.sin(t),np.cos(t)]]);A=np.eye(3);A[:2,:2]=R;A[:2,2]=E-R@E;matrices.append(A)
  origin=E.astype(int)-100;vis=np.zeros((200,200),bool)
  for C in matrices:
   C=C.copy();C[:2,2]-=origin;covered=cv2.warpAffine(lower[:,:,3],C[:2],(200,200),flags=cv2.INTER_LINEAR);vis|=covered<220
  visible=np.zeros((H,W),bool);visible[origin[1]:origin[1]+200,origin[0]:origin[0]+200]=vis
  # Ink belongs only to external side contours. Upper overlap hidden at rest
  # stays uninked; the lower proximal cap stays uninked below q=-3.
  for a,mask in [(upper,zone if False else (w>0)&~cloth),(lower,(ql<blendlen)&(rad<96))]:
   distance=ndi.distance_transform_edt(a[:,:,3]>128);band=(distance<3.3)&(a[:,:,3]>0)&mask
   if a is upper:band&=(q<=0)|visible
   else:band&=ql>=0
   a[band,:3]=black
  # No change to sleeve fabric or the original shoulder root.
  original=L[f'arm_{side}_upper'];upper[cloth]=original[cloth]
  upper=clean(upper);lower=clean(lower);L[f'arm_{side}_upper']=upper;L[f'arm_{side}_lower']=lower;details[side]={'joint_half_width_px':rj,'root_pigment':rgb.tolist(),'upper_roi':'skin q>-68 and radius<96; cloth preserved','lower_roi':'q<65 and radius<96; wrist unchanged'}
 for n,a in L.items():
  if n.startswith('arm_'):Image.fromarray(a).save(D/'layers'/(n+'.png'))
  else:shutil.copy2(B/'layers'/(n+'.png'),D/'layers'/(n+'.png'))
 full=Image.new('RGBA',(1024,1536))
 for n in json.loads((B/'layout.json').read_text())['draw_order']:full.alpha_composite(Image.fromarray(L[n]))
 full.save(D/'assembled.png');full.save(D/'master.png');report[ch]=details
(P/'repair-report.json').write_text(json.dumps(report,indent=2));print(json.dumps(report,indent=2))
