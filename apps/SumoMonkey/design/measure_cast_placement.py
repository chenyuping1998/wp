from pathlib import Path
from PIL import Image
import numpy as np,json
from scipy.spatial import ConvexHull
# Run after art and baked matrices change; alpha silhouettes ignore canvas padding.
root=Path(__file__).resolve().parents[1]
out={}
for cast in ['mg','fg']:
 d=json.loads((root/f'src/game/sumoMotion_{cast}.json').read_text());hulls={}
 for name in d['names']:
  a=np.asarray(Image.open(root/f'static/assets/sumoCast/{cast}/{name}.png').convert('RGBA'))[:,:,3]
  y,x=np.nonzero(a>8);pts=np.column_stack([x,y]);hulls[name]=pts[ConvexHull(pts).vertices]
 clips={}
 for name,clip in d['clips'].items():
  lo=np.array([np.inf,np.inf]);hi=-lo
  for frame in clip['frames']:
   for part,m in zip(d['names'],frame):
    a,b,c,e,tx,ty=m;p=hulls[part]@np.array([[a,b],[c,e]])+np.array([tx,ty]);lo=np.minimum(lo,p.min(axis=0));hi=np.maximum(hi,p.max(axis=0))
  clips[name]={'left':round(float(lo[0]/d['height']),5),'right':round(float(hi[0]/d['height']),5),'top':round(float(lo[1]/d['height']),5),'bottom':round(float(hi[1]/d['height']),5)}
 out[cast]=clips
(root/'src/game/sumoCastPlacement.json').write_text(json.dumps(out,indent=2)+'\n')
print(json.dumps(out,indent=2))
