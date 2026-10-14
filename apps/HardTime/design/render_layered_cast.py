"""Render an offline GIF from vertices exported by production castMotion.ts.
No separate animation implementation: run check_layered_cast.mjs --frames first.
"""
from pathlib import Path
import json, math
import numpy as np
from PIL import Image, ImageDraw
from scipy.ndimage import map_coordinates

ROOT=Path(__file__).resolve().parent/'cast_parts/base'
manifest=json.loads((ROOT/'layers.json').read_text())
frames=json.loads((ROOT/'frames.json').read_text())
S=.375;W,H=384,768
parts={}
for p in manifest['layers']:
 tex=np.asarray(Image.open(ROOT/p['texture']).convert('RGBA'),dtype=np.float32)/255
 tex[:,:,:3]*=tex[:,:,3:4]
 verts=np.array(p['rig']['verts'],float)
 tris=[]
 for tri in p['rig']['tris']:
  src=verts[tri]
  lo=np.maximum([0,0],np.floor(src.min(0))).astype(int)
  hi=np.minimum([1024,2048],np.ceil(src.max(0))).astype(int)
  if tex[lo[1]:hi[1]+1,lo[0]:hi[0]+1,3].max(initial=0)<.01:continue
  tris.append(tri)
 parts[p['name']]=(tex,verts,np.array(tris))

def render(frame):
 out=np.zeros((H,W,4),np.float32);out[:,:,:3]=np.array([37,41,36])/255;out[:,:,3]=1
 for p in frame['layers']:
  tex,rest,tris=parts[p['name']];dest=np.array(p['vertices']).reshape(-1,2)*S
  layer=np.zeros((H,W,4),np.float32)
  for tri in tris:
   q=dest[tri];src=rest[tri]
   x0,y0=np.maximum([0,0],np.floor(q.min(0))).astype(int)
   x1,y1=np.minimum([W,H],np.ceil(q.max(0))+1).astype(int)
   if x1<=x0 or y1<=y0:continue
   yy,xx=np.mgrid[y0:y1,x0:x1];x=xx+.5-q[0,0];y=yy+.5-q[0,1]
   u=q[1]-q[0];v=q[2]-q[0];den=u[0]*v[1]-u[1]*v[0]
   b=(x*v[1]-y*v[0])/den;c=(y*u[0]-x*u[1])/den;a=1-b-c
   mask=(a>=-1e-6)&(b>=-1e-6)&(c>=-1e-6)
   sx=a*src[0,0]+b*src[1,0]+c*src[2,0];sy=a*src[0,1]+b*src[1,1]+c*src[2,1]
   coords=[sy[mask],sx[mask]]
   for ch in range(4):layer[y0:y1,x0:x1,ch][mask]=map_coordinates(tex[:,:,ch],coords,order=1,mode='constant',prefilter=False)
  alpha=layer[:,:,3:4]
  out[:,:,:3]=layer[:,:,:3]+out[:,:,:3]*(1-alpha)
 im=Image.fromarray(np.uint8(np.clip(out[:,:,:3],0,1)*255))
 d=ImageDraw.Draw(im);d.text((12,12),'HARD TIME  |  LAYERED RIG',fill='#d4be90')
 label='IDLE' if frame['timeMs']<1000 or frame['timeMs']>=2070 else 'TRIGGER'
 d.text((12,H-24),label,fill='#d4be90')
 return im

result=[]
for i,f in enumerate(frames[::2]):
 im=render(f);result.append(im)
 if i in [0,13,17,25]:im.save(ROOT/f'pose_{f["timeMs"]:04d}.png')
 if i%10==0:print('rendered',i,flush=True)
# Fixed palette for stable clothing textures; this offline preview omits glow.
palette=Image.fromarray(np.vstack([np.asarray(result[i]) for i in [0,13,17,25]])).quantize(colors=256)
indexed=[im.quantize(palette=palette,dither=Image.Dither.NONE) for im in result]
indexed[0].save(ROOT/'idle-trigger.gif',save_all=True,append_images=indexed[1:],duration=100,loop=0,disposal=2)
sheet=Image.new('RGB',(W*4,H))
for j,i in enumerate([0,10,13,25]):sheet.paste(result[i],(j*W,0))
sheet.save(ROOT/'motion-contact.png')
print(ROOT/'idle-trigger.gif',flush=True)
