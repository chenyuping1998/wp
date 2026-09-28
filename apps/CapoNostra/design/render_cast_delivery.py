"""Rasterize the exact delivered mesh poses, plus a self-contained review page."""
from pathlib import Path
import json,sys
import numpy as np
from PIL import Image,ImageDraw
from scipy.ndimage import map_coordinates
ROOT=Path(__file__).resolve().parent/'cast_parts'

def render_role(role):
 folder=ROOT/role;m=json.loads((folder/'layers.manifest.json').read_text());frames=json.loads((folder/'frames.json').read_text());scale=.25;W,H=256,512
 parts={}
 for l in m['layers']:
  tex=np.asarray(Image.open(folder/l['texture']).convert('RGBA'),dtype=np.float32)/255
  tex[:,:,:3]*=tex[:,:,3:4];verts=np.array(l['rig']['verts']);tris=[]
  for tri in l['rig']['tris']:
   src=verts[tri];lo=np.maximum([0,0],np.floor(src.min(0))).astype(int);hi=np.minimum([1024,2048],np.ceil(src.max(0))).astype(int)
   if tex[lo[1]:hi[1]+1,lo[0]:hi[0]+1,3].max(initial=0)>.04:tris.append(tri)
  l['rig']['tris']=tris
  parts[l['name']]=(tex,verts,np.array(tris))
 result=[]
 for fi,f in enumerate(frames):
  out=np.zeros((H,W,4),np.float32);out[:,:,:3]=np.array([36,31,28])/255;out[:,:,3]=1
  for l in f['layers']:
   tex,rest,tris=parts[l['name']];dest=np.array(l['vertices']).reshape(-1,2)*scale
   layer=np.zeros((H,W,4),np.float32)
   for tri in tris:
    q=dest[tri];src=rest[tri];x0,y0=np.maximum([0,0],np.floor(q.min(0))).astype(int);x1,y1=np.minimum([W,H],np.ceil(q.max(0))+1).astype(int)
    if x1<=x0 or y1<=y0:continue
    yy,xx=np.mgrid[y0:y1,x0:x1];x=xx+.5-q[0,0];y=yy+.5-q[0,1];u=q[1]-q[0];v=q[2]-q[0];den=u[0]*v[1]-u[1]*v[0]
    b=(x*v[1]-y*v[0])/den;c=(y*u[0]-x*u[1])/den;a=1-b-c;mask=(a>=-1e-6)&(b>=-1e-6)&(c>=-1e-6)
    sx=a*src[0,0]+b*src[1,0]+c*src[2,0];sy=a*src[0,1]+b*src[1,1]+c*src[2,1];coords=[sy[mask],sx[mask]]
    for ch in range(4):layer[y0:y1,x0:x1,ch][mask]=map_coordinates(tex[:,:,ch],coords,order=1,mode='constant',prefilter=False)
   al=layer[:,:,3:4];out[:,:,:3]=layer[:,:,:3]+out[:,:,:3]*(1-al)
  im=Image.fromarray(np.uint8(np.clip(out[:,:,:3],0,1)*255));d=ImageDraw.Draw(im);d.text((10,10),role.upper()+' / '+f['label'],fill='#e6dfd1');result.append(im)
  if fi%20==0:print(role,'render',fi,flush=True)
 result[0].save(folder/'motion-preview.gif',save_all=True,append_images=result[1:],duration=[180]*20+[90]*48,loop=0,disposal=2)
 sheet=Image.new('RGB',(W*4,H*2),(36,31,28))
 for k,i in enumerate([0,6,12,18,24,40,56,64]):sheet.paste(result[i],((k%4)*W,(k//4)*H))
 sheet.save(folder/'motion-extremes.jpg',quality=93)
 (folder/'preview.manifest.json').write_text(json.dumps(m,separators=(',',':')))
 print(role,'finished',flush=True)

if __name__=='__main__':
 for role in sys.argv[1:] or ['mg','fg']:render_role(role)
