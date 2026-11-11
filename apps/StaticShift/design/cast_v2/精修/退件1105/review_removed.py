from pathlib import Path
from PIL import Image,ImageDraw
import numpy as np
from scipy import ndimage as ndi
P=Path(__file__).resolve().parent
for ch in ['dj','host']:
 D=P/'candidate'/ch;tiles=[]
 for f in sorted((D/'layers').glob('*.png')):
  before=np.array(Image.open(P/'修前交件'/ch/'layers'/f.name));after=np.array(Image.open(f));removed=before[:,:,3].astype(int)-after[:,:,3].astype(int)>32
  lab,n=ndi.label(ndi.binary_dilation(removed,iterations=2))
  for i,sl in enumerate(ndi.find_objects(lab),1):
   m=(lab==i)&removed
   if m.sum()<2:continue
   ys,xs=sl;b=(max(0,xs.start-8),max(0,ys.start-8),min(1024,xs.stop+8),min(1536,ys.stop+8));diff=before.copy();diff[m,:3]=[220,20,40];tile=Image.new('RGBA',(400,270),'#e5e2d6')
   for j,a in enumerate([diff,after]):
    im=Image.fromarray(a).crop(b);im.thumbnail((195,240));tile.alpha_composite(im,(j*200,25))
   ImageDraw.Draw(tile).text((2,4),f.stem+' #'+str(i)+' removed '+str(int(m.sum())),fill='black');tiles.append(tile)
 for start in range(0,len(tiles),16):
  ts=tiles[start:start+16];sheet=Image.new('RGBA',(1600,((len(ts)+3)//4)*270),'#e5e2d6')
  for i,t in enumerate(ts):sheet.alpha_composite(t,((i%4)*400,(i//4)*270))
  sheet.convert('RGB').save(D/'qa'/('removed-regions-'+str(start//16+1)+'.jpg'),quality=96)
 print(ch,'removed connected regions',len(tiles))
