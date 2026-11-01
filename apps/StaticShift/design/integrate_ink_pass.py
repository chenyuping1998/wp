"""Extract the approved ImageGen ink revision; no image stylization is done here."""
from pathlib import Path
from PIL import Image
import shutil,json
import numpy as np
from scipy.ndimage import label
APP=Path(__file__).resolve().parents[1];GEN=Path('/Users/stone/.codex/generated_images/01a14f88-e3e5-75b3-a3c9-274b230df0a2');SRC=APP/'design/source-v2';SRC.mkdir(exist_ok=True)
files={'background':'exec-4fb7bd97-d7a4-4136-8975-085f3e64a411.png','cast':'exec-356e89f6-4503-44ed-a1a6-76e5afdcd950.png','symbols':'exec-24ab7c48-58fd-4312-b763-cec1bee796d9.png'}
for key,name in files.items():
 if not (SRC/(key+'.png')).exists():shutil.copy2(GEN/name,SRC/(key+'.png'))
def tight(im):
 # Crop by this subject's substantial alpha components. Adjacent sheet cells
 # may intrude at their margins; those tiny fragments are not part of this sprite.
 lab,n=label(np.asarray(im.getchannel('A'))>12);counts=np.bincount(lab.ravel());counts[0]=0
 assert n;largest=int(counts.max());ids=np.where(counts>=max(64,largest*.10))[0]
 yy,xx=np.where(np.isin(lab,ids));return im.crop((int(xx.min()),int(yy.min()),int(xx.max()+1),int(yy.max()+1)))
sp=APP/'static/assets/sprites'
bg=Image.open(SRC/'background.png').convert('RGB')
for name in ['bg_base','bg_feature']:bg.save(sp/'staticShiftBackgroundInk'/f'{name}.png')
cast=Image.open(SRC/'cast.png').convert('RGBA');assert cast.getchannel('A').getextrema()[0]==0
for i,name in enumerate(['mg','fg']):tight(cast.crop((i*cast.width//2,0,(i+1)*cast.width//2,cast.height))).save(sp/'staticShiftCastInk'/f'{name}.png')
sheet=Image.open(SRC/'symbols.png').convert('RGBA');assert sheet.getchannel('A').getextrema()[0]==0
for i,key in enumerate(['h1','h2','h3','h4','l1','l2','l3','l4','l5','w','s','p']):
 x=i%4;y=i//4;top=y*sheet.height//3-(20 if key=='w' else 0);tile=tight(sheet.crop((x*sheet.width//4,top,(x+1)*sheet.width//4,(y+1)*sheet.height//3)))
 scale=480/max(tile.size);tile=tile.resize((round(tile.width*scale),round(tile.height*scale)),Image.Resampling.LANCZOS)
 out=Image.new('RGBA',(512,512));out.alpha_composite(tile,((512-tile.width)//2,(512-tile.height)//2));out.save(sp/'staticShiftSymbolsInk'/f'{key}.png')
print('Integrated original ImageGen revision: background, 2 cast, 12 symbols')
# Content revisions keep browser/platform caches from mixing old and new art.
import re,hashlib
registry=APP/'src/game/assets.ts';source=registry.read_text()
def revision(match):
 rel=match.group(1);digest=hashlib.sha256((APP/'static'/rel).read_bytes()).hexdigest()[:10]
 return "new URL('../../"+rel+"', import.meta.url).href + '?v="+digest+"'"
source=re.sub(r"new URL\('../../(assets/sprites/staticShift(?:Symbols|Cast|Background)Ink/[^']+)'\, import.meta.url\)\.href(?: \+ '\?v=[a-f0-9]+')?",revision,source)
registry.write_text(source)
# A full v2 re-extraction must not silently roll back the later reviewed redraws.
if (APP/'design/source-v3/generation.json').exists():
 from integrate_ink3 import integrate
 integrate()
