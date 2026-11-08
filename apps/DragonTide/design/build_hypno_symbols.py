from PIL import Image,ImageOps
from pathlib import Path
import json,hashlib
r=Path(__file__).resolve().parent;a=r.parent;o=a/'static/assets/sprites/hypnoSymbols';o.mkdir(exist_ok=True)
def hull(points):
 points=sorted(set(points))
 def cross(o,a,b):return (a[0]-o[0])*(b[1]-o[1])-(a[1]-o[1])*(b[0]-o[0])
 low=[];high=[]
 for p in points:
  while len(low)>=2 and cross(low[-2],low[-1],p)<=0:low.pop()
  low.append(p)
 for p in reversed(points):
  while len(high)>=2 and cross(high[-2],high[-1],p)<=0:high.pop()
  high.append(p)
 return low[:-1]+high[:-1]
meta={}
for p in (r/'board_preview_v5_6x5/symbols').glob('*.png'):
 im=Image.open(p).convert('RGBA');im=im.crop(im.getbbox());limit=400 if p.stem=='S' else 420;small=ImageOps.contain(im,(limit,limit),Image.Resampling.LANCZOS);canvas=Image.new('RGBA',(512,512));canvas.alpha_composite(small,((512-small.width)//2,(512-small.height)//2));dest=o/(p.stem.lower()+'.png');canvas.save(dest);alpha=canvas.getchannel('A');pix=alpha.load();edges=[]
 for y in range(512):
  xs=[x for x in range(512) if pix[x,y]>32]
  if xs:edges.extend([(min(xs),y),(max(xs),y)])
 meta[p.stem]={'hull':hull(edges),'sourceSha256':hashlib.sha256(p.read_bytes()).hexdigest(),'sha256':hashlib.sha256(dest.read_bytes()).hexdigest(),'visibleBounds':canvas.getbbox()}
(r/'hypno-symbols-manifest.json').write_text(json.dumps(meta,indent=2)+'\n')
print('Ten independently retained circus symbols registered to 512px canvases.')
