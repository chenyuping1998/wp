"""Transfer existing generated side-ink strips to the preserved shaft outline.
Never outlines a protruding overlap cap: all points within the upper joint's
inscribed circle remain uninked and hidden.
"""
from pathlib import Path
import numpy as np,cv2
from PIL import Image
from scipy import ndimage as ndi
P=Path(__file__).resolve().parent

def repair_forearm(a,J,side,ch):
 E=np.array(J['elbow_'+side],float);W=np.array(J['wrist_'+side],float);v=(W-E)/np.linalg.norm(W-E);p=np.array([-v[1],v[0]]);length=float(np.linalg.norm(W-E));Q,C=np.mgrid[-60:int(np.ceil(length))+61,-100:101];mx=(E[0]+Q*v[0]+C*p[0]).astype('float32');my=(E[1]+Q*v[1]+C*p[1]).astype('float32');T=cv2.remap(a,mx,my,cv2.INTER_CUBIC);source=np.array(Image.open(P.parent/'source'/(ch+'_forearm.png')).convert('RGBA'))
 ink=source[:,:,:3]@[.299,.587,.114];alpha=source[:,:,3];out=T.copy()
 for row in range(60,min(T.shape[0],int(length)+80)):
  q=row-60;xs=np.where(T[row,:,3]>150)[0]
  if len(xs)<5:continue
  sy=int(np.clip(560+650*q/max(length,1),480,1280));sx=np.where(alpha[sy]>200)[0]
  if len(sx)<15:continue
  for reverse in [False,True]:
   edge=int(xs[-1]if reverse else xs[0]);se=int(sx[-1]if reverse else sx[0]);direction=-1 if reverse else 1
   window=np.arange(se,se+direction*22,direction);window=window[(window>=0)&(window<source.shape[1])];dark=window[ink[sy,window]<65]
   if not len(dark):continue
   # An actual opaque black source stroke is resampled to a 3px side line.
   for k in range(6):
    x=edge+direction*k
    if x<0 or x>=T.shape[1]:continue
    idx=int(np.clip(round(k/4*max(len(dark)-1,1)),0,len(dark)-1));color=source[sy,dark[idx],:3].astype(float);w=np.clip((4.5-k)/1.5,0,1);out[row,x,:3]=(color*w+out[row,x,:3]*(1-w)).clip(0,255).astype('uint8')
 # Return only shaft boundary pixels; root containment is handled by source alpha.
 yy,xx=np.mgrid[:a.shape[0],:a.shape[1]];q=(xx-E[0])*v[0]+(yy-E[1])*v[1];c=(xx-E[0])*p[0]+(yy-E[1])*p[1];b=cv2.remap(out,(c+100).astype('float32'),(q+60).astype('float32'),cv2.INTER_CUBIC);upper=np.array(Image.open(P/'candidate'/ch/'layers'/f'arm_{side}_upper.png'))if False else None
 # The caller passes the exact containment radius as a temporary private key.
 radius=J['_radius_'+side];edit=(q>=0)&(q<=length+15)&(np.hypot(xx-E[0],yy-E[1])>radius+.5)&(a[:,:,3]>0)
 # Copy RGB only. The original muscle/shaft alpha and all coordinates stay exact.
 outa=a.copy();outa[edit,:3]=b[edit,:3];return outa
