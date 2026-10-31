"""Rasterise actual prize mesh coordinates for a local QA animation."""
from PIL import Image,ImageDraw
from pathlib import Path
import json,numpy as np,sys
p=Path(sys.argv[1]);frames=json.loads((p/'frames.json').read_text(encoding='utf-8'));textures={};images=[]
for f in frames:
 im=Image.new('RGBA',(720,480),(20,35,46,255));d=ImageDraw.Draw(im)
 for n,name in enumerate(['S','H1','H2','H3','H4','L1']):d.text((n%3*240+8,n//3*240+8),name+' '+str(round(f['t'],2)),fill='white')
 for layer in f['layers']:
  tex=textures.setdefault(layer['file'],Image.open(layer['file']).convert('RGBA'));v=np.array(layer['positions']).reshape(-1,2);uv=np.array(layer['uvs']).reshape(-1,2)*tex.size
  for k in range(0,len(layer['triangles']),3):
   ids=layer['triangles'][k:k+3];dst=v[ids];src=uv[ids];lo=np.maximum([0,0],np.floor(dst.min(axis=0)-1)).astype(int);hi=np.minimum([720,480],np.ceil(dst.max(axis=0)+1)).astype(int)
   if np.any(hi<=lo):continue
   a=np.linalg.solve(np.c_[dst,np.ones(3)],src).T;a[:,2]+=a[:,:2]@lo;tile=tex.transform(tuple(hi-lo),Image.Transform.AFFINE,tuple(a.flat),Image.Resampling.BILINEAR);mask=Image.new('L',tile.size);ImageDraw.Draw(mask).polygon([tuple(x-lo) for x in dst],fill=255);tile.putalpha(Image.fromarray((np.asarray(tile.getchannel('A'),dtype=float)*np.asarray(mask)/255).astype('uint8')));im.alpha_composite(tile,tuple(lo))
 images.append(im.convert('RGB'))
palette=images[0].quantize(colors=256);indexed=[im.quantize(palette=palette,dither=Image.Dither.NONE) for im in images];indexed[0].save(p/'prizes.gif',save_all=True,append_images=indexed[1:],duration=40,loop=0,optimize=False)
sheet=Image.new('RGB',(1440,960));
for k,i in enumerate([0,11,22,34]):sheet.paste(images[i],(k%2*720,k//2*480))
sheet.save(p/'prizes.png');print(p/'prizes.gif',flush=True)
