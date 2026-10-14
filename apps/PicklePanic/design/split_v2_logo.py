"""Lossless segmentation of eleven original drawn glyphs; no glyph redraw."""
from pathlib import Path
from PIL import Image
from scipy.ndimage import label,find_objects,binary_erosion,distance_transform_edt
import numpy as np,json
ROOT=Path(__file__).resolve().parents[1];p=ROOT/'static/assets/pickle';out=ROOT/'design/source/production_v2/logo_layers';out.mkdir(exist_ok=True)
im=np.array(Image.open(p/'logo_letters_v2.png').convert('RGBA'));lab,n=label(binary_erosion(im[:,:,3]>128,iterations=4));items=[]
for i,s in enumerate(find_objects(lab),1):
 if (lab[s]==i).sum()>1200:items.append((s[1].start,i,s))
items.sort()
if len(items)!=11:
 # Connected ink bridges: measured narrow seams keep each original pixel intact.
 cuts=[0,239,314,455,603,718,864,1034,1159,1307,1391,1600]
 regions=np.zeros(lab.shape,int)
 for y in range(im.shape[0]):
  seams=[0]
  for center in cuts[1:-1]:
   lo,hi=center-9,center+10
   scores=im[y,lo:hi,3].astype(float)+np.abs(np.arange(lo,hi)-center)*4
   seams.append(lo+int(scores.argmin()))
  seams.append(1600)
  for index in range(11):regions[y,seams[index]:seams[index+1]]=index+1
 items=[(cuts[i],i+1,(slice(170,430),slice(cuts[i],cuts[i+1])))for i in range(11)]
else:
 seeds=np.zeros(lab.shape,int)
 for index,(_,i,_) in enumerate(items):seeds[lab==i]=index+1
 _,nearest=distance_transform_edt(seeds==0,return_indices=True);regions=seeds[tuple(nearest)]
records=[]
for index,(x,i,s) in enumerate(items):
 a=im.copy();a[:,:,3]=im[:,:,3]*(regions==index+1);f=f'logo_letter_{index}_v2.png';Image.fromarray(a).save(out/f);box=Image.fromarray(a).getbbox() or (0,0,1,1);Image.fromarray(a).crop(box).save(p/f)
 records.append({'key':f'gbLogoLetter{index}V2','letter':'PICKLEPANIC'[index],'pivot':[(s[1].start+s[1].stop)/2,s[0].stop],'box':list(box)})
(out/'pivots.json').write_text(json.dumps(records,indent=2));(ROOT/'src/game/logoLetters.ts').write_text('export const LOGO_LETTERS = '+json.dumps(records,indent=2)+';\n')
s=(ROOT/'src/game/assets.ts').read_text();keys=''.join(f"\t{r['key']}: {{type:'sprite',src:new URL('../../assets/pickle/logo_letter_{i}_v2.png',import.meta.url).href,preload:true}},\n" for i,r in enumerate(records));keys+="\tgbLogoBaseV2: {type:'sprite',src:new URL('../../assets/pickle/logo_base_v2.png',import.meta.url).href,preload:true},\n";import re
s=re.sub(r'\tgbLogo(?:Letter\d+|Base)V2: \{[^\n]+\n','',s)
s=s.replace('export default {','export default {\n'+keys);(ROOT/'src/game/assets.ts').write_text(s)
Image.fromarray(im).resize((640,240),Image.Resampling.LANCZOS).save(out/'logo_corner_640.png')
