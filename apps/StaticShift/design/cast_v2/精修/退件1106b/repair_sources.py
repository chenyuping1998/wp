from pathlib import Path
import numpy as np,cv2,json
from scipy import ndimage as ndi
from PIL import Image
P=Path(__file__).resolve().parent;mp=json.loads((P/'source-mapping.json').read_text())
def warp(a,M,size):
 z=a.astype('float32')/255;z[:,:,:3]*=z[:,:,3:4];z=cv2.warpAffine(z,M,size,flags=cv2.INTER_CUBIC);al=z[:,:,3:4].copy();z[:,:,:3]=np.where(al>1e-6,z[:,:,:3]/np.maximum(al,1e-6),0);z[:,:,3:4]=al.clip(0,1);z=(z.clip(0,1)*255).round().astype('uint8');z[z[:,:,3]==0,:3]=0;return z
for ch in ['dj','host']:
 k=ch+'_forearm_r';gen=np.array(Image.open(P/(k+'-generated.png')).convert('RGBA'));y,x=np.where(gen[:,:,3]>100);xmin,xmax=x.min(),x.max();ymin,ymax=y.min(),y.max();s=mp[k]['matrix'];scale=np.linalg.norm(np.array(s)[0,:2]);lo=256-15*scale;hi=768+7*scale
 # The generated organic contour is fitted to the existing joint anchors. No polygon/chord cuts.
 sx=(hi-lo)/(xmax-xmin);sy=sx;cy=(ymin+ymax)/2
 A=np.array([[sx,0,lo-sx*xmin],[0,sy,256-sy*cy],[0,0,1.]])
 B=np.vstack([s,[0,0,1.]])
 out=warp(gen,(np.linalg.inv(B)@A)[:2],(1024,1536));lab,n=ndi.label(out[:,:,3]>0);sizes=np.bincount(lab.ravel());sizes[0]=0;out[lab!=sizes.argmax()]=0
 Image.fromarray(out).save(P/'candidate'/ch/'layers/arm_r_lower.png')
# DJ shoulder: use only the generated rounded sleeve cap. Keep all original sleeve/cuff pixels below the cap.
orig=np.array(Image.open(P/'baseline/dj/layers/arm_r_upper.png').convert('RGBA'));gen=np.array(Image.open(P/'dj_upper_r-generated.png').convert('RGBA'));gen=cv2.resize(gen,(1024,1024),interpolation=cv2.INTER_LANCZOS4);m=mp['dj_upper_r'];s=m['scale'];ox,oy=m['offset'];bx,by,_,_=m['box'];A=np.array([[1/s,0,bx-ox/s],[0,1/s,by-oy/s]])
g=warp(gen,A,(1024,1536));yy,xx=np.mgrid[:1536,:1024];S=np.array([681,399]);E=np.array([757,567]);v=(E-S)/np.linalg.norm(E-S);q=(xx-S[0])*v[0]+(yy-S[1])*v[1]
# Smoothly tuck the repainted cap into the torso around the unchanged shoulder anchor.
f=0.70+0.30*np.clip(q/52,0,1);mx=(S[0]+(xx-S[0])/f).astype('float32');my=(S[1]+(yy-S[1])/f).astype('float32');g=cv2.remap(g,mx,my,cv2.INTER_CUBIC,borderMode=cv2.BORDER_CONSTANT)
# Crossfade within opaque red cloth, cap alpha uses only repainted contour.
t=np.clip((q-14)/25,0,1);mask=(q<39)&(((xx-S[0])**2+(yy-S[1])**2)<100**2);out=orig.copy();blend=np.rint(g*(1-t[:,:,None])+orig*t[:,:,None]).clip(0,255).astype('uint8');out[mask]=blend[mask]
# Local inpainting of old black flakes inside the peach elbow, excluding cuff and exterior ink.
dist=ndi.distance_transform_edt(orig[:,:,3]>160);skin=(orig[:,:,0]>170)&(orig[:,:,1]>100)&(orig[:,:,2]>55);sknear=ndi.binary_dilation(skin,iterations=4);flecks=(yy>514)&(yy<581)&(xx>722)&(xx<780)&(dist>4)&sknear&(~skin)
# Restrict to isolated dark debris; do not repaint the connected sleeve/cuff ink.
lab,n=ndi.label(flecks);keep=np.zeros_like(flecks)
for i in range(1,n+1):
 z=lab==i
 if z.sum()<90:keep|=z
rgb=cv2.inpaint(orig[:,:,:3],keep.astype('uint8')*255,4,cv2.INPAINT_TELEA);out[keep,:3]=rgb[keep];out[out[:,:,3]==0,:3]=0
Image.fromarray(out).save(P/'candidate/dj/layers/arm_r_upper.png')
# Host far arm: only remove the faint interior midshaft trace. Alpha, contour ink and accepted elbow are exact.
a=np.array(Image.open(P/'baseline/host/layers/arm_l_lower.png').convert('RGBA'));J=json.loads((P/'baseline/host/layout.json').read_text())['joints'];E=np.array(J['elbow_l']);W=np.array(J['wrist_l']);v=(W-E)/np.linalg.norm(W-E);q=(xx-E[0])*v[0]+(yy-E[1])*v[1];inside=ndi.distance_transform_edt(a[:,:,3]>160)>5;med=cv2.medianBlur(a[:,:,:3],5);lum=lambda z:z[:,:,0]*.299+z[:,:,1]*.587+z[:,:,2]*.114;patch=inside&(q>50)&(q<145)&(lum(a)-lum(med)>.55)&(lum(a)>95);out=a.copy();out[patch,:3]=med[patch];Image.fromarray(out).save(P/'candidate/host/layers/arm_l_lower.png');print('host far midshaft corrected RGB pixels',patch.sum(),'alpha and exterior ink unchanged')
# Assemble from the unchanged draw order.
for ch in ['dj','host']:
 D=P/'candidate'/ch;j=json.loads((D/'layout.json').read_text());full=Image.new('RGBA',(1024,1536))
 for n in j['draw_order']:full.alpha_composite(Image.open(D/'layers'/(n+'.png')))
 full.save(D/'assembled.png');full.save(D/'master.png')
