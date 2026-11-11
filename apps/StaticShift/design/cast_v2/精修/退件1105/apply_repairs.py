"""Registered generated contour patches + organic alpha masks, no rig/game changes."""
from pathlib import Path
import json,ast,shutil
from PIL import Image,ImageDraw
import numpy as np
from scipy import ndimage as ndi
import cv2
P=Path(__file__).resolve().parent; SIZE=(1024,1536); yy,xx=np.mgrid[:1536,:1024]
def aopen(f):return np.array(Image.open(f).convert('RGBA'))
def solid(a):return a[:,:,3]>128
def sdf(m):return ndi.distance_transform_edt(m)-ndi.distance_transform_edt(~m)
def compose(L,order):
 im=Image.new('RGBA',SIZE)
 for n in order:im.alpha_composite(Image.fromarray(L[n]))
 return np.array(im)
def organic_patch(L,order,gen,weight,names):
 old=compose(L,order);om=solid(old);gm=ndi.gaussian_filter(solid(gen).astype(float),1.6)>.5;w=weight
 sd=sdf(om)*(1-w)+sdf(gm)*w;newa=np.clip(sd+.5,0,1)*255
 # Keep the exact original alpha wherever the repair does not act.
 newa=np.where(w>0,newa,old[:,:,3]).astype('uint8');nm=newa>0
 oldidx=ndi.distance_transform_edt(~om,return_distances=False,return_indices=True)
 target=old.copy(); target[:,:,:3]=old[oldidx[0],oldidx[1],:3];target[:,:,3]=newa
 # Copy generated contour art onto the repaired perimeter. Interior skin and
 # all sleeve/hand details retain their original pixels.
 ge=gm&~ndi.binary_erosion(gm,iterations=2);gi=ndi.distance_transform_edt(~ge,return_distances=False,return_indices=True)
 edge=nm&(ndi.distance_transform_edt(nm)<5.2)&(w>.001)
 # A nearest generated boundary supplies its actual ink, never a synthetic stroke.
 for c in range(3):target[:,:,c][edge]=gen[:,:,c][gi[0][edge],gi[1][edge]]
 # Overlay target pixels only on the visible owner; concealed overlaps stay intact.
 owner=np.full(om.shape,-1)
 for i,n in enumerate(order):owner[L[n][:,:,3]>100]=i
 nearowner=owner[oldidx[0],oldidx[1]]
 for n in names:
  i=order.index(n);a=L[n].copy();saved=a.copy();orig=a[:,:,3].copy();clip=(w>0)&(a[:,:,3]>0)&~nm;a[clip,3]=0
  rim=(w>0)&((nearowner==i)|((~om)&((len(names)==1)or n=='pelvis')))&nm&(edge|~om)
  a[rim,:3]=target[rim,:3];a[rim,3]=target[rim,3]
  # Near repaired boundary align existing owner alpha to the same antialias.
  z=(w>0)&(owner==i)&nm;a[z,3]=newa[z]
  # Preserve the original complete rolled sleeve and its outer ink.
  if n.startswith('arm_') and n.endswith('_upper') and len(names)>1:
   r,g,b=saved[:,:,:3].astype(float).transpose(2,0,1);cloth=(r>150)&(g>r*.82)&(b>r*.68)&(saved[:,:,3]>40);cloth=ndi.binary_dilation(cloth,iterations=6)&(saved[:,:,3]>0);a[cloth]=saved[cloth]
  a[a[:,:,3]==0,:3]=0;L[n]=a
 return old,compose(L,order)
for ch in ['dj','host']:
 B=P/'修前交件'/ch;D=P/'candidate'/ch;shutil.rmtree(D,ignore_errors=True);shutil.copytree(B,D);shutil.rmtree(D/'qa');(D/'qa').mkdir()
 layout=json.loads((B/'layout.json').read_text());order=layout['draw_order'];J=layout['joints'];L={f.stem:aopen(f)for f in (B/'layers').glob('*.png')}
 for side in ['l','r']:
  n=ch+'_'+side;b=ast.literal_eval((P/(n+'_crop.txt')).read_text());g=np.zeros((1536,1024,4),np.uint8);reg=aopen(P/(n+'_registered.png'));g[b[1]:b[3],b[0]:b[2]]=reg
  E=np.array(J['elbow_'+side],float);W=np.array(J['wrist_'+side],float);v=(W-E)/np.linalg.norm(W-E);q=(xx-E[0])*v[0]+(yy-E[1])*v[1];cross=-(xx-E[0])*v[1]+(yy-E[1])*v[0]
  # Retract only the protruding hidden elbow root, leaving the forearm shaft,
  # wrist and total joint-to-joint length exactly in place. The generated
  # organic contour is carried along the registration, no chord cuts.
  if side=='r':
   shift=18 if ch=='dj' else 21;d=np.hypot(xx-E[0],yy-E[1]);warp=shift*np.exp(-((q+18)/31)**2)*np.clip((65-d)/20,0,1)
   mx=(xx-v[0]*warp).astype('float32');my=(yy-v[1]*warp).astype('float32');g=cv2.remap(g,mx,my,cv2.INTER_CUBIC)
  er=np.hypot(xx-E[0],yy-E[1]);wr=np.hypot(xx-W[0],yy-W[1]);weight=np.clip((90-er)/20,0,1)
  if side=='l':weight=np.maximum(weight,np.clip((65-wr)/20,0,1))
  # Do not pull repaired geometry over unchanged sleeve cloth.
  names=[f'arm_{side}_upper',f'arm_{side}_lower','hand_l_hip' if side=='l' else 'hand_r_grip']
  old,new=organic_patch(L,order,g,weight,names)
 if ch=='dj':
  g=np.zeros((1536,1024,4),np.uint8);reg=aopen(P/'dj_waist_registered.png');g[720:880,290:780]=reg
  # Only waist band, away from the two pocket flaps.
  w=np.clip((yy-762)/10,0,1)*np.clip((849-yy)/18,0,1)*np.clip((xx-310)/20,0,1)*np.clip((750-xx)/20,0,1)
  organic_patch(L,order,g,w,['leg_l_upper','leg_r_upper','pelvis'])
 if ch=='host':
  n='host_l';b=ast.literal_eval((P/(n+'_crop.txt')).read_text());g=np.zeros((1536,1024,4),np.uint8);g[b[1]:b[3],b[0]:b[2]]=aopen(P/(n+'_registered.png'));w=np.clip((28-np.hypot(xx-455,yy-360))/10,0,1);organic_patch(L,order,g,w,['arm_l_upper'])
 if ch=='dj':
  g=np.zeros((1536,1024,4),np.uint8);g[285:405,540:655]=aopen(P/'dj_neck_registered.png');w=np.clip((26-np.hypot(xx-595,yy-330))/10,0,1);organic_patch(L,order,g,w,['neck'])
 for side in ['l','r']:
  E=np.array(J['elbow_'+side],float);W=np.array(J['wrist_'+side],float);v=(W-E)/np.linalg.norm(W-E);low=L[f'arm_{side}_lower']
  # Continuous pigment at every interchangeable wrist: reuse this same source
  # forearm's skin, feathered over the old hard-edged color-match rectangle.
  q=(xx-W[0])*v[0]+(yy-W[1])*v[1];cross=-(xx-W[0])*v[1]+(yy-W[1])*v[0]
  sm=(abs(q)<14)&(abs(cross)<9)&(low[:,:,3]>200);rgb=np.median(low[sm,:3],axis=0)
  for n in [n for n in L if n.startswith('hand_'+side)]:
   a=L[n];r,g,b=a[:,:,:3].astype(float).transpose(2,0,1);skin=(r>80)&(g>r*.45)&(g<r*.90)&(b>g*.35)&(b<g*.95)
   w=np.clip((65-q)/30,0,1)*np.clip((95-np.hypot(xx-W[0],yy-W[1]))/30,0,1)*skin
   # Preserve source hatching and jewelry, blend warm pigments only.
   a[:,:,:3]=(a[:,:,:3]*(1-w[:,:,None])+rgb*w[:,:,None]).clip(0,255).astype('uint8')
   # The concealed hand root follows the actual forearm silhouette.
   L[n]=a
 for n,a in L.items():
  lab,num=ndi.label(a[:,:,3]>0)
  if num>1:
   sizes=np.bincount(lab.ravel());sizes[0]=0;a[lab!=sizes.argmax()]=0
  a[a[:,:,3]==0,:3]=0;L[n]=a;Image.fromarray(a).save(D/'layers'/(n+'.png'))
 layout['joints']=J;(D/'layout.json').write_text(json.dumps(layout,indent=2)+'\n')
 im=Image.fromarray(compose(L,order));im.save(D/'assembled.png');im.save(D/'master.png');bg=Image.new('RGBA',SIZE,'#e5e2d6');bg.alpha_composite(im);bg.convert('RGB').save(D/'qa/repaired-paper.jpg')
 print(ch,'candidate written')
