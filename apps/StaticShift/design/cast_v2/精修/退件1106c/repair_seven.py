from pathlib import Path
from PIL import Image
import numpy as np,cv2,json
from scipy import ndimage as ndi
P=Path(__file__).resolve().parent;Y,X=np.mgrid[:1536,:1024];cv2.setNumThreads(1)
def load(ch,n):return np.array(Image.open(P/'baseline'/ch/'layers'/(n+'.png')).convert('RGBA'))
def save(ch,n,a):
 lab,k=ndi.label(a[:,:,3]>0);sz=np.bincount(lab.ravel());sz[0]=0;a[lab!=sz.argmax()]=0;a[a[:,:,3]==0,:3]=0;Image.fromarray(a).save(P/'candidate'/ch/'layers'/(n+'.png'))
def coords(ch,side):
 J=json.loads((P/'baseline'/ch/'layout.json').read_text())['joints'];E=np.array(J['elbow_'+side]);W=np.array(J['wrist_'+side]);v=(W-E)/np.linalg.norm(W-E);q=(X-W[0])*v[0]+(Y-W[1])*v[1];t=(X-W[0])*(-v[1])+(Y-W[1])*v[0];return E,W,v,q,t
# DJ forearm: unchanged joint-fitted silhouette; clear opaque ink on distal/wrist half.
a=load('dj','arm_r_lower');E,W,v,q,t=coords('dj','r');dist=ndi.distance_transform_edt(a[:,:,3]>140);zone=q>-57;soft=(a[:,:,3]>0)&(a[:,:,3]<245)&zone;edge=(dist<=2.1)&(a[:,:,3]>0)&zone;lum=a[:,:,:3]@np.array([.299,.587,.114]);skin=(dist>2.1)&zone&(a[:,:,3]>140)
# Generated repaint supplies a clean peach underpaint; match r6 palette to avoid a second seam.
g=np.array(Image.open(P/'dj-arm_r_lower-generated.png').convert('RGBA'));body=(g[:,:,3]>220)&(g[:,:,0]>200)&(g[:,:,1]>100);base=np.median(g[body,:3],axis=0);base+=np.array([251,161,111])-base;a[skin,:3]=base;a[skin,3]=255;a[edge,:3]=[12,6,3]
# Keep antialias only outside the 50%-coverage contour; no pale skin fringe alongside ink.
a[soft&edge,:3]=[12,6,3];save('dj','arm_r_lower',a)
# Hand-root corrections are restricted to overlap skin and the small wrist junction.
for ch,n,side,S in [('dj','hand_r_hatheld','r',34.),('host','hand_l_open','l',35.),('host','hand_l_point','l',35.)]:
 a=load(ch,n);E,W,v,q,t=coords(ch,side);original=a.copy();base=np.array([251,161,111]if ch=='dj'else[191,115,64]);rgb=a[:,:,:3].astype(float);is_skin=(rgb[:,:,0]>170)&(rgb[:,:,1]>80)&(rgb[:,:,1]<195)&(rgb[:,:,2]<175)&(a[:,:,3]>0)
 if ch=='dj':source=(q<16)&(abs(t)<27)&(is_skin|((t>15)&(a[:,:,3]>0)))
 else:source=(q<2)&(abs(t)<30)&(a[:,:,3]>0)
 alpha=np.where(source,a[:,:,3],0).astype('float32')
 # Smooth radial contraction of the excessive wrist-root, never a straight cut/chord.
 anchor=15. if ch=='dj'else 0.;rel=q-anchor;k=1+rel/S;qs=np.where(k>.04,anchor+rel/np.maximum(k,.04),-10000);ts=np.where(k>.04,t/np.maximum(k,.04),0);mx=(W[0]+v[0]*qs-v[1]*ts).astype('float32');my=(W[1]+v[1]*qs+v[0]*ts).astype('float32');new=cv2.remap(alpha,mx,my,cv2.INTER_LINEAR,borderMode=cv2.BORDER_CONSTANT);new=ndi.gaussian_filter(new,.65);domain=(q<anchor-.5)&(q>anchor-S+1)&(abs(t)<30);new[~domain]=0
 if ch=='dj':mask=(q<anchor-.5)&(abs(t)<28)&(source|(new>1));protected=(a[:,:,3]>0)&(~is_skin)&(t<15)
 else:mask=(q<-.5)&(abs(t)<30)&((a[:,:,3]>0)|(new>1));protected=np.zeros_like(mask)
 mask&=~protected;a[mask,:3]=base;a[mask,3]=np.rint(new[mask]).clip(0,255).astype('uint8')
 # Isolated old root specks are debris, not headphone/finger ink.
 if ch=='dj':
  dark=(original[:,:,:3]@np.array([.299,.587,.114])<80)&(original[:,:,3]>160);labels,count=ndi.label(dark)
  for i,sl in enumerate(ndi.find_objects(labels),1):
   if sl is None:continue
   zz=labels==i
   if zz.sum()<=8 and np.all(q[zz]<-8)and np.all(abs(t[zz])<25):a[zz]=0
 else:
  # Round only the wrist junction; the fingers and green ring (q >= 18) stay exact.
  solid=a[:,:,3]>130;sm=ndi.gaussian_filter(solid.astype(float),.7);newsolid=sm>.5;d=ndi.distance_transform_edt(newsolid);z=(q>=-.5)&(q<12)&(abs(t)<30);a[z,3]=np.rint(np.clip((sm[z]-.36)/.28,0,1)*255).astype('uint8');a[z,:3]=base;ink=z&newsolid&(d<=2.0);a[ink,:3]=[10,5,3]
 save(ch,n,a)
# Host near wrist: fade sculpted shading into the original wrist tone, not a rectangular patch.
a=load('host','arm_r_lower');E,W,v,q,t=coords('host','r');lum=a[:,:,:3]@np.array([.299,.587,.114]);s=np.clip((q+35)/24,0,1);s=s*s*(3-2*s);skin=(lum>95)&(a[:,:,3]>0)&(q>-35);rgb=a[:,:,:3]*(1-s[:,:,None])+np.array([192,116,65])*s[:,:,None];a[skin,:3]=rgb.round().clip(0,255).astype('uint8')[skin];save('host','arm_r_lower',a)
# Host normal grip root: same skin underpaint, feather only the tiny concealed overlap edge.
a=load('host','hand_r_grip');mask=np.array(Image.open(P/'../退件1106b/followup/host-grip-permitted-root-mask.png'))>0;alpha=ndi.gaussian_filter(a[:,:,3].astype(float),.45);z=mask&(a[:,:,3]>0);a[z,:3]=[192,116,65];a[z,3]=np.rint(alpha[z]).clip(0,255).astype('uint8');save('host','hand_r_grip',a)
# Host far wrist: clean the distal junction only. Accepted elbow and rest of shaft are exact.
a=load('host','arm_l_lower');E,W,v,q,t=coords('host','l');solid=a[:,:,3]>150;sm=ndi.gaussian_filter(solid.astype(float),.6);d=ndi.distance_transform_edt(sm>.5);z=(q>-22)&(q<20)&(a[:,:,3]>0);a[z,3]=np.rint(np.clip((sm[z]-.3)/.4,0,1)*255).astype('uint8');a[z,:3]=[191,115,64];ink=z&(d<=2)&(q<18);a[ink,:3]=[10,5,3];save('host','arm_l_lower',a)
for ch in ['dj','host']:
 D=P/'candidate'/ch;full=Image.new('RGBA',(1024,1536));J=json.loads((D/'layout.json').read_text())
 for n in J['draw_order']:full.alpha_composite(Image.open(D/'layers'/(n+'.png')))
 full.save(D/'assembled.png');full.save(D/'master.png')
print('Seven scoped source candidates updated; host hand_r_hatheld remains untouched pending scope confirmation')
