"""Read source ink triangles; no audit files are written."""
import json,sys
import numpy as np
from PIL import Image
result={}
for part in json.load(sys.stdin):
 alpha=np.asarray(Image.open(part['path']).convert('RGBA'))[:,:,3];h,w=alpha.shape;uv=np.asarray(part['uvs']).reshape(-1,2)*[w,h];visible=[]
 for i,(a,b,c) in enumerate(np.asarray(part['triangles']).reshape(-1,3)):
  tri=uv[[a,b,c]];x0,y0=np.maximum(np.floor(tri.min(axis=0)).astype(int),[0,0]);x1,y1=np.minimum(np.ceil(tri.max(axis=0)).astype(int),[w-1,h-1])
  if x1<x0 or y1<y0:continue
  yy,xx=np.mgrid[y0:y1+1,x0:x1+1]+.5;pa,pb,pc=tri;den=(pb[1]-pc[1])*(pa[0]-pc[0])+(pc[0]-pb[0])*(pa[1]-pc[1])
  if abs(den)<1e-9:continue
  l1=((pb[1]-pc[1])*(xx-pc[0])+(pc[0]-pb[0])*(yy-pc[1]))/den;l2=((pc[1]-pa[1])*(xx-pc[0])+(pa[0]-pc[0])*(yy-pc[1]))/den
  if ((l1>=0)&(l2>=0)&(1-l1-l2>=0)&(alpha[y0:y1+1,x0:x1+1]>16)).sum()>=3:visible.append(i)
 result[part['name']]=visible
json.dump(result,sys.stdout)
