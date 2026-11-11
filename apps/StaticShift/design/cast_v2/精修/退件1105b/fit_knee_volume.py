"""Fit generated inked knee ends to the original trouser volume; no muscle cut."""
from pathlib import Path
import numpy as np,cv2
from scipy import ndimage as ndi
from PIL import Image
P=Path(__file__).resolve().parent
for ch in ['dj','host']:
 for s in ['l','r']:
  n=f'{ch}_leg_{s}';f=P/(n+'_registered.png');g=np.array(Image.open(f).convert('RGBA'));old=np.array(Image.open(P/(n+'_input.png')).convert('RGBA'))
  if not(P/(n+'_registered-before-volume.png')).exists():Image.fromarray(g).save(P/(n+'_registered-before-volume.png'))
  else:g=np.array(Image.open(P/(n+'_registered-before-volume.png')).convert('RGBA'))
  om=old[:,:,3]>128;gm=g[:,:,3]>128;closed=cv2.morphologyEx(om.astype('uint8'),cv2.MORPH_CLOSE,cv2.getStructuringElement(cv2.MORPH_ELLIPSE,(45,45)))>0;target=(ndi.gaussian_filter(closed.astype(float),1.35)>.5)|(ndi.distance_transform_edt(om)>3);Y,X=np.where(target);end=int(Y.max());GY,GX=np.where(gm);gend=int(GY.max());yy,xx=np.mgrid[:640,:512];srcy=400+(yy-400)*(gend-400)/max(end-400,1);srcx=xx.astype(float)
  for y in range(400,end+1):
   tx=np.where(target[y])[0];gy=int(np.clip(round(srcy[y,0]),0,639));gx=np.where(gm[gy])[0]
   if not len(tx)or not len(gx):continue
   srcx[y]=gx.min()+(np.arange(512)-tx.min())/max(tx.max()-tx.min(),1)*(gx.max()-gx.min())
  warped=cv2.remap(g,srcx.astype('float32'),srcy.astype('float32'),cv2.INTER_CUBIC);out=old.copy();w=np.clip((yy-415)/20,0,1);out[:,:,:3]=(old[:,:,:3]*(1-w[:,:,None])+warped[:,:,:3]*w[:,:,None]).clip(0,255).astype('uint8');alpha=(np.clip(ndi.distance_transform_edt(target)-ndi.distance_transform_edt(~target)+.5,0,1)*255).astype('uint8');out[:,:,3]=np.where(yy>415,alpha,old[:,:,3]);out[out[:,:,3]==0,:3]=0;Image.fromarray(out).save(f)
  # Strictly preserve every 3px-inside original cap pixel.
  assert not ((ndi.distance_transform_edt(om)>3)&(out[:,:,3]==0)).any(),n
print('Knee generation fitted to original 3px-inside volume, organic corners only')
