from pathlib import Path
from PIL import Image
import numpy as np,cv2,json
P=Path(__file__).resolve().parent;yy,xx=np.mgrid[:1536,:1024]
for ch,delta in [('dj',np.array([1,4,6])),('host',np.array([0,6,11]))]:
 D=P/'candidate'/ch;J=json.loads((D/'layout.json').read_text())['joints'];E=np.array(J['elbow_r']);W=np.array(J['wrist_r']);v=(W-E)/np.linalg.norm(W-E);n=np.array([-v[1],v[0]]);le=np.linalg.norm(W-E);q=(xx-E[0])*v[0]+(yy-E[1])*v[1];t=(xx-E[0])*n[0]+(yy-E[1])*n[1];a=np.array(Image.open(D/'layers/arm_r_lower.png'))
 if ch=='dj':
  qs=np.where(q>le-8,le-8+(q-le+8)*.72,q);mx=(E[0]+v[0]*qs+n[0]*t).astype('float32');my=(E[1]+v[1]*qs+n[1]*t).astype('float32');z=a.astype('float32')/255;z[:,:,:3]*=z[:,:,3:4];z=cv2.remap(z,mx,my,cv2.INTER_CUBIC);al=z[:,:,3:4].copy();z[:,:,:3]=np.where(al>1e-6,z[:,:,:3]/np.maximum(al,1e-6),0);z[:,:,3:4]=al.clip(0,1);a=(z.clip(0,1)*255).round().astype('uint8')
 rgb=a[:,:,:3].astype(float);lum=rgb@np.array([.299,.587,.114]);skin=(lum>100)&(a[:,:,3]>0);rgb-=delta;anchor=np.array(Image.open(P/'baseline'/ch/'layers/arm_r_lower.png'))[E[1],E[0],:3];w=np.clip((25-q)/25,0,1);w=w*w*(3-2*w);rgb=rgb*(1-w[:,:,None])+anchor*w[:,:,None];a[skin,:3]=rgb.clip(0,255).round().astype('uint8')[skin];a[a[:,:,3]==0,:3]=0;Image.fromarray(a).save(D/'layers/arm_r_lower.png')
for ch in ['dj','host']:
 D=P/'candidate'/ch;j=json.loads((D/'layout.json').read_text());full=Image.new('RGBA',(1024,1536))
 for n in j['draw_order']:full.alpha_composite(Image.open(D/'layers'/(n+'.png')))
 full.save(D/'assembled.png');full.save(D/'master.png')
