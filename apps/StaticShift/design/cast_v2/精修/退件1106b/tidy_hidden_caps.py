from pathlib import Path
from PIL import Image
import numpy as np,cv2,json
from scipy import ndimage as ndi
P=Path(__file__).resolve().parent;yy,xx=np.mgrid[:1536,:1024]
for ch in ['dj','host']:
 D=P/'candidate'/ch;J=json.loads((D/'layout.json').read_text())['joints'];E=np.array(J['elbow_r']);W=np.array(J['wrist_r']);v=(W-E)/np.linalg.norm(W-E);q=(xx-E[0])*v[0]+(yy-E[1])*v[1];r=np.hypot(xx-E[0],yy-E[1]);a=np.array(Image.open(D/'layers/arm_r_lower.png'));lum=a[:,:,0]*.299+a[:,:,1]*.587+a[:,:,2]*.114
 # Only the concealed half-cap is uninked. Every contour from elbow toward wrist stays inked.
 mask=(q<0)&(r<(17 if ch=='dj'else 15))&(a[:,:,3]>0)&(lum<100)
 rgb=cv2.inpaint(a[:,:,:3],mask.astype('uint8')*255,4,cv2.INPAINT_TELEA);a[mask,:3]=rgb[mask];a[a[:,:,3]==0,:3]=0;Image.fromarray(a).save(D/'layers/arm_r_lower.png')
# Clean the local speckle field inside DJ's exposed elbow, keep the outside contour.
f=P/'candidate/dj/layers/arm_r_upper.png';a=np.array(Image.open(f));dist=ndi.distance_transform_edt(a[:,:,3]>160);lum=a[:,:,0]*.299+a[:,:,1]*.587+a[:,:,2]*.114;med=cv2.medianBlur(a[:,:,:3],5);ml=med[:,:,0]*.299+med[:,:,1]*.587+med[:,:,2]*.114;mask=(yy>510)&(yy<582)&(xx>720)&(dist>4)&(ml-lum>3);rgb=cv2.inpaint(a[:,:,:3],mask.astype('uint8')*255,3,cv2.INPAINT_TELEA);a[mask,:3]=rgb[mask]
# Remove residual partial-alpha shoulder double edges; retain a single clean painted organic cap.
S=np.array([681,399]);E=np.array([757,567]);v=(E-S)/np.linalg.norm(E-S);q=(xx-S[0])*v[0]+(yy-S[1])*v[1];zone=(q<40)&(a[:,:,3]>0);weak=zone&(a[:,:,3]<100);a[weak]=0;lab,n=ndi.label(a[:,:,3]>0);sz=np.bincount(lab.ravel());sz[0]=0;a[lab!=sz.argmax()]=0;a[a[:,:,3]==0,:3]=0;Image.fromarray(a).save(f)
for ch in ['dj','host']:
 D=P/'candidate'/ch;j=json.loads((D/'layout.json').read_text());out=Image.new('RGBA',(1024,1536))
 for n in j['draw_order']:out.alpha_composite(Image.open(D/'layers'/(n+'.png')))
 out.save(D/'assembled.png');out.save(D/'master.png')
