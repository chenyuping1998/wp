from pathlib import Path
import json,math,hashlib
import numpy as np,cv2
from PIL import Image,ImageDraw,ImageFont
P=Path(__file__).resolve().parent;PAPER='#e5e2d6';F=ImageFont.truetype('/System/Library/Fonts/Supplemental/Arial.ttf',17)
def affine(vals):a,b,c,d,e,f=vals;return np.array([[a,b,e],[c,d,f],[0,0,1.]])
def prep(D):
 out={}
 for f in (D/'layers').glob('*.png'):
  im=Image.open(f).convert('RGBA');b=im.getbbox();a=np.array(im.crop(b)).astype('float32')/255;a[:,:,:3]*=a[:,:,3:4];out[f.stem]=(a,b)
 return out
def draw(L,slots,origin,size,background=PAPER):
 out=Image.new('RGBA',size,background)
 for n,vals in slots:
  a,b=L[n];M=affine(vals);corners=np.array([[b[0],b[1],1],[b[2],b[1],1],[b[2],b[3],1],[b[0],b[3],1]]);Q=(corners@M.T)[:,:2]-origin
  if(Q.max(axis=0)<0).any()or(Q.min(axis=0)>np.array(size)).any():continue
  M[:2,2]+=M[:2,:2]@np.array(b[:2])-origin;z=cv2.warpAffine(a,M[:2],size,flags=cv2.INTER_CUBIC);raw=z[:,:,3:4].copy();z[:,:,:3]=np.where(raw>1e-6,z[:,:,:3]/np.maximum(raw,1e-6),0);z[:,:,3:4]=raw.clip(0,1);out.alpha_composite(Image.fromarray((z.clip(0,1)*255).round().astype('uint8')))
 return out

cv2.setNumThreads(1)
