from pathlib import Path
from PIL import Image
from scipy import ndimage as ndi
import numpy as np,json,math
P=Path(__file__).resolve().parent;out={};yy,xx=np.mgrid[:1536,:1024]
for ch in ['dj','host']:
 j=json.loads((P/'candidate'/ch/'layout.json').read_text())['joints'];out[ch]={}
 for side in ['l','r']:
  u=np.array(Image.open(P/'修前交件'/ch/'layers'/f'arm_{side}_upper.png'))[:,:,3]>128
  l=np.array(Image.open(P/'candidate'/ch/'layers'/f'arm_{side}_lower.png'));lm=l[:,:,3]>160;lum=l[:,:,:3]@[.299,.587,.114];ink=lm&(lum<90);near=ndi.distance_transform_edt(~ink)<5;edge=lm&ndi.binary_dilation(~lm,iterations=2);e=np.array(j['elbow_'+side]);points=np.argwhere(edge&~near&(np.hypot(xx-e[0],yy-e[1])<75))[:,::-1]
  bends=[0,75,90,-85,-30] if side=='l' else [0,120,150,-60,30];best=None
  for dy in range(-45,31,3):
   for dx in range(-36,37,3):
    c=e+[dx,dy];counts=[]
    for deg in bends:
     a=math.radians(deg);R=np.array([[math.cos(a),-math.sin(a)],[math.sin(a),math.cos(a)]]);p=(points-c)@R.T+c;p=p.round().astype(int);counts.append(int((~u[p[:,1],p[:,0]]).sum()))
    score=max(counts)*4+sum(counts)+np.hypot(dx,dy)*.03
    if best is None or score<best[0]:best=(score,list(map(int,c)),counts)
  out[ch][side]=best;print(ch,side,'uninked-root-points',len(points),'optimum',best)
(P/'hinge-analysis.json').write_text(json.dumps(out,indent=2))
