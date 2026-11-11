from pathlib import Path
from PIL import Image
import numpy as np,cv2,json
from scipy import ndimage as ndi
from scipy.interpolate import PchipInterpolator
P=Path(__file__).resolve().parent;yy,xx=np.mgrid[:1536,:1024]
for ch in ['dj','host']:
 D=P/'candidate'/ch;J=json.loads((D/'layout.json').read_text())['joints'];E=np.array(J['elbow_r']);W=np.array(J['wrist_r']);v=(W-E)/np.linalg.norm(W-E);n=np.array([-v[1],v[0]]);length=np.linalg.norm(W-E);q=(xx-E[0])*v[0]+(yy-E[1])*v[1];t=(xx-E[0])*n[0]+(yy-E[1])*n[1];a=np.array(Image.open(D/'layers/arm_r_lower.png'));scale=5;M=np.array([[*v*scale,150-scale*v@E],[*n*scale,180-scale*n@E]]);z=cv2.warpAffine(a,M,(900,360),flags=cv2.INTER_CUBIC);mask=z[:,:,3]>150;left=[];right=[]
 for x in range(900):
  y=np.where(mask[:,x])[0];left.append(y.min()if len(y)else np.nan);right.append(y.max()if len(y)else np.nan)
 left=np.array(left);right=np.array(right);valid=np.isfinite(left);xs=np.arange(900);left=np.interp(xs,xs[valid],left[valid]);right=np.interp(xs,xs[valid],right[valid]);oldrad=(right-left)/10;oldcenter=((right+left)/2-180)/5;qq=(xs-150)/5
 # Smooth deformation of painted anatomical silhouette; wrist width matches unchanged hand cuffs.
 target=PchipInterpolator([0,length*.30,length-45,length-20,length],[14 if ch=='dj'else 12,22 if ch=='dj'else 17,20 if ch=='dj'else 16,17 if ch=='dj'else 12.7,16.5 if ch=='dj'else 12.3],extrapolate=True)
 desired=target(np.clip(qq,0,length));factor=desired/np.maximum(oldrad,.1);factor[qq<0]=1;factor[qq>length]=factor[np.argmin(abs(qq-length))];factor=np.clip(factor,.7,3.4)
 fac=np.interp(q,qq,factor);cen=np.interp(q,qq,oldcenter);newcen=cen*(1-np.clip((q-(length-45))/45,0,1));source_t=cen+(t-newcen)/fac;mx=(E[0]+v[0]*q+n[0]*source_t).astype('float32');my=(E[1]+v[1]*q+n[1]*source_t).astype('float32');src=a.astype('float32')/255;src[:,:,:3]*=src[:,:,3:4];z=cv2.remap(src,mx,my,cv2.INTER_CUBIC);alpha=z[:,:,3:4].copy();z[:,:,:3]=np.where(alpha>1e-6,z[:,:,:3]/np.maximum(alpha,1e-6),0);z[:,:,3:4]=alpha.clip(0,1);a=(z.clip(0,1)*255).round().astype('uint8')
 # Concealed proximal arc: match upper-arm underpaint; no dark/grey circular trace.
 upper=np.array(Image.open(D/'layers/arm_r_upper.png'));disk=(xx-E[0])**2+(yy-E[1])**2<8**2;rgb=np.median(upper[disk&(upper[:,:,3]>240),:3],axis=0);prox=(q<2)&(np.hypot(xx-E[0],yy-E[1])<(18 if ch=='dj'else 16))&(a[:,:,3]>0);a[prox,:3]=rgb
 a[a[:,:,3]==0,:3]=0;lab,num=ndi.label(a[:,:,3]>0);sizes=np.bincount(lab.ravel());sizes[0]=0;a[lab!=sizes.argmax()]=0;Image.fromarray(a).save(D/'layers/arm_r_lower.png')
for ch in ['dj','host']:
 D=P/'candidate'/ch;j=json.loads((D/'layout.json').read_text());full=Image.new('RGBA',(1024,1536))
 for n in j['draw_order']:full.alpha_composite(Image.open(D/'layers'/(n+'.png')))
 full.save(D/'assembled.png');full.save(D/'master.png')
