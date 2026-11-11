import sys, json
import numpy as np
from PIL import Image, ImageDraw
APP='/Users/stone/stake-engine/wp/apps/TurfWar/static/assets/castLayers/turf/v5/'
variant, poses, out, crop, scale, cols = sys.argv[1:7]
x0c,y0c,x1c,y1c = map(int,crop.split(',')); sc=float(scale); cols=int(cols)
bg=tuple(map(int,sys.argv[7].split(','))) if len(sys.argv)>7 else (32,36,46)
W,H=int((x1c-x0c)*sc),int((y1c-y0c)*sc)
texc={}
def tex(n):
  if n not in texc: texc[n]=np.asarray(Image.open(APP+variant+'/'+n+'.png').convert('RGBA')).astype(np.float32)
  return texc[n]
frames=json.load(open(poses)); tiles=[]
for f in frames:
  canvas=np.zeros((H,W,3),np.float32); canvas[...]=bg
  for s in f['slots']:
    tx=tex(s['name']); th,tw=tx.shape[:2]
    V=(np.asarray(s['verts'])-(x0c,y0c))*sc; UV=np.asarray(s['uvs']).reshape(-1,2); T=np.asarray(s['tris']).reshape(-1,3)
    layer=np.zeros((H,W,4),np.float32)
    for a,b,c in T:
      pa,pb,pc=V[a],V[b],V[c]
      bx0,by0=np.floor(np.minimum(np.minimum(pa,pb),pc)).astype(int); bx1,by1=np.ceil(np.maximum(np.maximum(pa,pb),pc)).astype(int)
      bx0,by0=max(bx0,0),max(by0,0); bx1,by1=min(bx1,W-1),min(by1,H-1)
      if bx1<bx0 or by1<by0: continue
      yy,xx=np.mgrid[by0:by1+1,bx0:bx1+1]+0.5
      d=(pb[1]-pc[1])*(pa[0]-pc[0])+(pc[0]-pb[0])*(pa[1]-pc[1])
      if abs(d)<1e-9: continue
      l1=((pb[1]-pc[1])*(xx-pc[0])+(pc[0]-pb[0])*(yy-pc[1]))/d
      l2=((pc[1]-pa[1])*(xx-pc[0])+(pa[0]-pc[0])*(yy-pc[1]))/d
      l3=1-l1-l2; m=(l1>=-1e-4)&(l2>=-1e-4)&(l3>=-1e-4)
      if not m.any(): continue
      u=l1*UV[a,0]+l2*UV[b,0]+l3*UV[c,0]; v=l1*UV[a,1]+l2*UV[b,1]+l3*UV[c,1]
      px=np.clip((u*tw).astype(int),0,tw-1); py=np.clip((v*th).astype(int),0,th-1)
      sub=layer[by0:by1+1,bx0:bx1+1]; sub[m]=tx[py[m],px[m]]
    al=layer[...,3:4]/255; canvas=layer[...,:3]*al+canvas*(1-al)
  im=Image.fromarray(canvas.astype(np.uint8)); ImageDraw.Draw(im).text((6,6),f['label'],fill=(255,220,0)); tiles.append(im)
rows=(len(tiles)+cols-1)//cols
sh=Image.new('RGB',(W*cols,H*rows),(0,0,0))
for i,t in enumerate(tiles): sh.paste(t,((i%cols)*W,(i//cols)*H))
sh.save(out,quality=88); print(out,len(tiles),sh.size)
