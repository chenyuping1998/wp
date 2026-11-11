from pathlib import Path
import json,math
import numpy as np
from scipy import ndimage as ndi
from PIL import Image,ImageDraw,ImageFont
P=Path(__file__).resolve().parent;B=P.parent/'退件1105/修前交件';FONT=ImageFont.truetype('/System/Library/Fonts/Supplemental/Arial.ttf',16)
for ch in ['dj','host']:
 D=P/'candidate'/ch;outdir=D/'qa/exact-alpha-diffs';outdir.mkdir(exist_ok=True);report={};tiles=[]
 for f in sorted((D/'layers').glob('*.png')):
  old=np.array(Image.open(B/ch/'layers'/f.name).convert('RGBA'));new=np.array(Image.open(f).convert('RGBA'));delta=old[:,:,3].astype('int16')-new[:,:,3].astype('int16');removed=np.maximum(delta,0).astype('uint8');added=np.maximum(-delta,0).astype('uint8')
  if not removed.any()and not added.any():continue
  Image.fromarray(removed).save(outdir/(f.stem+'-removed.png'));Image.fromarray(added).save(outdir/(f.stem+'-added.png'));report[f.stem]={'removed_alpha_pixels':int((removed>0).sum()),'added_alpha_pixels':int((added>0).sum()),'removed_alpha_coverage':int(removed.astype('uint64').sum()),'added_alpha_coverage':int(added.astype('uint64').sum())}
  mask=removed>0;labels,n=ndi.label(ndi.binary_dilation(mask,iterations=3))
  for i,sl in enumerate(ndi.find_objects(labels),1):
   m=(labels==i)&mask
   if not m.any():continue
   y,x=sl;b=(max(0,x.start-8),max(0,y.start-8),min(1024,x.stop+8),min(1536,y.stop+8));diff=old.copy();diff[m,:3]=[225,20,40];tile=Image.new('RGBA',(500,290),'#e5e2d6')
   for j,a in enumerate([diff,new]):
    im=Image.fromarray(a).crop(b);im.thumbnail((245,250));tile.alpha_composite(im,(j*250+2,30))
   ImageDraw.Draw(tile).text((3,3),f.stem+' #'+str(i)+' red = removed',font=FONT,fill='#222222');tiles.append(tile)
 for start in range(0,len(tiles),16):
  subset=tiles[start:start+16];sheet=Image.new('RGBA',(2000,math.ceil(len(subset)/4)*290),'#e5e2d6')
  for i,t in enumerate(subset):sheet.alpha_composite(t,((i%4)*500,(i//4)*290))
  sheet.convert('RGB').save(outdir/('regions-'+str(start//16+1)+'.jpg'),quality=96)
 (outdir/'report.json').write_text(json.dumps(report,indent=2)+'\n');print(ch,'exact removed regions',len(tiles),'pages',math.ceil(len(tiles)/16),flush=True)
