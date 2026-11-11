from pathlib import Path
from PIL import Image
from scipy import ndimage as ndi
import numpy as np,cv2,json
from render_core import affine
P=Path(__file__).resolve().parent;Y,X=np.mgrid[:1536,:1024]
for ch,name,side,limit in [('dj','hand_r_hatheld','r',16),('host','hand_l_open','l',14),('host','hand_l_point','l',14)]:
 D=P/'candidate'/ch;J=json.loads((D/'layout.json').read_text())['joints'];W=np.array(J['wrist_'+side]);E=np.array(J['elbow_'+side]);v=(W-E)/np.linalg.norm(W-E);q=(X-W[0])*v[0]+(Y-W[1])*v[1];t=(X-W[0])*(-v[1])+(Y-W[1])*v[0];a=np.array(Image.open(D/'layers'/(name+'.png')));fore=np.array(Image.open(D/'layers'/('arm_'+side+'_lower.png')))[:,:,3];foredist=ndi.distance_transform_edt(fore>100).astype('float32');solid=a[:,:,3]>100;edge=solid&ndi.binary_dilation(a[:,:,3]<30,iterations=2)&(q<limit)&(q>-25)&(abs(t)<30);yy,xx=np.where(edge);points=np.array([xx,yy,np.ones(len(xx))]);visible=np.zeros(len(xx),bool)
 for f in json.loads((P/(ch+'-actual-frames.json')).read_text())['frames']:
  slots=dict(f['slots'])
  if name not in slots:continue
  m=np.linalg.inv(affine(slots['arm_'+side+'_lower']))@affine(slots[name]);p=m@points;z=cv2.remap(fore,p[0].astype('float32')[None,:],p[1].astype('float32')[None,:],cv2.INTER_LINEAR)[0];near=cv2.remap(foredist,p[0].astype('float32')[None,:],p[1].astype('float32')[None,:],cv2.INTER_LINEAR)[0];visible|=(z<240)|(near<2.8)
 marked=np.zeros_like(edge);marked[yy[visible],xx[visible]]=True;band=ndi.binary_dilation(marked,iterations=1)&(ndi.distance_transform_edt(solid)<=2.2)&(q<limit)&(a[:,:,3]>0);rgb=a[:,:,:3].astype(float);skin=(rgb[:,:,0]>135)&(rgb[:,:,1]>65)&(rgb[:,:,0]>rgb[:,:,1]*1.30);band&=skin;a[band,:3]=[12,6,3];a[a[:,:,3]==0,:3]=0;Image.fromarray(a).save(D/'layers'/(name+'.png'));print(ch,name,'actual exposed wrist edge ink pixels',band.sum())
for ch in ['dj','host']:
 D=P/'candidate'/ch;j=json.loads((D/'layout.json').read_text());full=Image.new('RGBA',(1024,1536))
 for n in j['draw_order']:full.alpha_composite(Image.open(D/'layers'/(n+'.png')))
 full.save(D/'assembled.png');full.save(D/'master.png')
