"""Art-only, reproducible two-bone skinning proof. No Spine/runtime output.
Uses actual source pixels, unchanged joint coordinates and unchanged pose angles.
"""
import numpy as np
import cv2
from PIL import Image
from scipy.interpolate import LinearNDInterpolator

def deform(im,canvas_size,parent,child,pivot,axis,blend,offset):
 a=np.array(im);bbox=im.getchannel('A').getbbox()
 if bbox is None:return Image.new('RGBA',canvas_size)
 x0,y0,x1,y1=bbox;x0-=4;y0-=4;x1+=4;y1+=4
 xs=np.linspace(x0,x1,max(3,int((x1-x0)/7)+1));ys=np.linspace(y0,y1,max(3,int((y1-y0)/7)+1));Y,X=np.meshgrid(ys,xs,indexing='ij');src=np.c_[X.ravel(),Y.ravel()];h=np.c_[src,np.ones(len(src))]
 pivot=np.array(pivot,float);axis=np.array(axis,float);axis/=np.linalg.norm(axis);q=(src-pivot)@axis
 w=np.clip((q+blend)/blend,0,1);w=w*w*(3-2*w)
 dst=(h@parent.T)[:,:2]*(1-w[:,None])+(h@child.T)[:,:2]*w[:,None];dst+=offset
 b0=np.floor(dst.min(axis=0)-2).astype(int);b1=np.ceil(dst.max(axis=0)+2).astype(int);b0=np.maximum(b0,[0,0]);b1=np.minimum(b1,canvas_size)
 assert (b0>0).all() and (b1<canvas_size).all(),'skinning proof clips source'
 # Keep source triangle topology. Re-triangulating destination points would
 # connect unrelated sides of a folded elbow and produce texture holes.
 out=np.zeros((canvas_size[1],canvas_size[0],4),np.uint8);cols=len(xs);rows=len(ys)
 for iy in range(rows-1):
  for ix in range(cols-1):
   ids=[iy*cols+ix,iy*cols+ix+1,(iy+1)*cols+ix,(iy+1)*cols+ix+1]
   for ii in [[ids[0],ids[1],ids[3]],[ids[0],ids[3],ids[2]]]:
    S=src[ii].astype('float32');T=dst[ii].astype('float32');sx0,sy0=np.maximum(np.floor(S.min(axis=0)).astype(int),[0,0]);sx1,sy1=np.minimum(np.ceil(S.max(axis=0)+1).astype(int),[a.shape[1],a.shape[0]])
    if sx1<=sx0 or sy1<=sy0 or not a[sy0:sy1,sx0:sx1,3].any():continue
    lo=np.floor(T.min(axis=0)-1).astype(int);hi=np.ceil(T.max(axis=0)+1).astype(int);lo=np.maximum(lo,[0,0]);hi=np.minimum(hi,canvas_size);sz=tuple(hi-lo)
    if min(sz)<=0:continue
    M=cv2.getAffineTransform(S,(T-lo).astype('float32'));tile=cv2.warpAffine(a,M,sz,flags=cv2.INTER_CUBIC,borderMode=cv2.BORDER_CONSTANT)
    mask=np.zeros((sz[1],sz[0]),np.uint8);cv2.fillConvexPoly(mask,np.round((T-lo)*16).astype('int32'),255,shift=4)
    tile[:,:,3]=(tile[:,:,3].astype(float)*mask/255).astype('uint8');roi=out[lo[1]:hi[1],lo[0]:hi[0]];z=tile[:,:,3]>0;roi[z]=tile[z]
 return Image.fromarray(out)
