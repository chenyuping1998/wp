from pathlib import Path
from PIL import Image
import numpy as np,json
from scipy import ndimage as ndi
P=Path(__file__).resolve().parent
M=lambda z:np.array([[z[0],z[1],z[4]],[z[2],z[3],z[5]],[0,0,1.]])
for ch in ['dj','host']:
 D=P/'candidate'/ch;J=json.loads((D/'layout.json').read_text())['joints'];E=np.array(J['elbow_r']);W=np.array(J['wrist_r']);v=(W-E)/np.linalg.norm(W-E);n=np.array([-v[1],v[0]]);le=np.linalg.norm(W-E);points=[];Y,X=np.mgrid[:1536,:1024];bad={}
 for f in(D/'layers').glob('hand_r*.png'):
  a=np.array(Image.open(f));solid=a[:,:,3]>160;edge=solid&ndi.binary_dilation(a[:,:,3]<40,iterations=2);lum=a[:,:,:3]@np.array([.299,.587,.114]);ink=solid&(lum<90);noink=edge&(~ndi.binary_dilation(ink,iterations=5));q=(X-W[0])*v[0]+(Y-W[1])*v[1];root=noink&(q<5)&(q>-90);y,x=np.where(root);bad[f.stem]=np.array([x,y,np.ones(len(x))])
 for frame in json.loads((P/(ch+'-actual-frames.json')).read_text())['frames']:
  slots=dict(frame['slots']);T=M(slots['arm_r_lower']);inv=np.linalg.inv(T)
  for name in slots:
   if name not in bad:continue
   p=(inv@M(slots[name])@bad[name])[:2].T;points.extend(p)
 points=np.array(points);q=(points-E)@v;t=(points-E)@n
 print(ch,'len',le,'maximum wrist root half-width by along-arm q:')
 for z in range(-10,int(le)+40,10):
  m=(q>=z)&(q<z+10)
  if m.any():print(z,tuple(np.percentile(t[m],[0,100]).round(1)))
