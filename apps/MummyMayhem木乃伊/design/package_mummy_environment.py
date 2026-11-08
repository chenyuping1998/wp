from pathlib import Path
import json,shutil
from PIL import Image,ImageDraw,ImageFilter,ImageOps
import numpy as np
ROOT=Path(__file__).resolve().parent;APP=ROOT.parent;D=ROOT/'source/mummy_delivery';S=APP/'static/assets/sprites/mummyBackground'
meta=json.loads((ROOT/'generated_sources.json').read_text(encoding='utf-8'))
zones={'bg_base':[(0,0,.115,.42),(.9,.04,1,.46),(.15,0,.39,.25),(.44,0,.95,.1)],
 'bg_feature':[(.18,.48,.28,.76),(.78,.46,.9,.77)],'bg_holdandspin':[(.19,0,.35,.13),(.69,0,.87,.13)]}
for name,boxes in zones.items():
 src=Image.open(D/'backgrounds'/(name+'.png')).convert('RGBA');far=Image.open(D/'originals'/(name+'_far.png')).convert('RGBA').resize(src.size,Image.Resampling.LANCZOS)
 far.save(D/'backgrounds'/(name+'_far.png'));far.save(S/(name+'_far.png'))
 mask=Image.new('L',src.size);dr=ImageDraw.Draw(mask)
 for l,t,r,b in boxes:dr.rectangle((int(l*1920),int(t*1080),int(r*1920),int(b*1080)),fill=255)
 mask=mask.filter(ImageFilter.GaussianBlur(10));props=src.copy();props.putalpha(mask);props.save(D/'backgrounds'/(name+'_props.png'));props.save(S/(name+'_props.png'))
 if name=='bg_base':
  for suffix,subset in [('torches',boxes[:2]),('linen',boxes[2:])]:
   m=Image.new('L',src.size);dr=ImageDraw.Draw(m)
   for l,t,r,b in subset:dr.rectangle((int(l*1920),int(t*1080),int(r*1920),int(b*1080)),fill=255)
   layer=src.copy();layer.putalpha(m.filter(ImageFilter.GaussianBlur(10)));layer.save(S/(name+'_'+suffix+'.png'))
# Bright store cover layers. Subject alone in FG, no title baked into either FG.
cover=Image.open(D/'originals/cover.png').convert('RGB').resize((1920,1080),Image.Resampling.LANCZOS)
td=D/'thumbnail';td.mkdir(exist_ok=True);cover.save(td/'cover_16x9_bg.png');ImageOps.fit(cover,(1024,1024),centering=(.45,.5)).save(td/'thumb_bg.png')
cat=Image.open(D/'mascot/assembled.png').convert('RGBA');cat=cat.crop(cat.getchannel('A').getbbox())
for name,size in [('cover_16x9_fg',(1920,1080)),('thumb_fg',(1024,1024))]:
 fg=Image.new('RGBA',size);a=cat.copy();a.thumbnail((int(size[0]*.78),int(size[1]*.96)),Image.Resampling.LANCZOS)
 fg.alpha_composite(a,(int(size[0]*.62-a.width*.5) if size[0]>1100 else (size[0]-a.width)//2,size[1]-a.height));fg.save(td/(name+'.png'))
 bg=Image.open(td/('cover_16x9_bg.png' if size[0]>1100 else 'thumb_bg.png')).convert('RGBA');bg.alpha_composite(fg);bg.save(td/(name+'_composite.png'))
 if name=='thumb_fg':
  a=np.array(bg.convert('RGB').resize((200,200)));lum=a@np.array([.2126,.7152,.0722]);stats=dict(mean=float(lum.mean()),p10=float(np.percentile(lum,10)),dark_fraction=float((lum<32).mean()));(td/'verification.json').write_text(json.dumps(stats,indent=2));assert stats['mean']>=80 and stats['p10']>=35 and stats['dark_fraction']<=.3,stats
p=APP/'src/game/assets.ts';s=p.read_text(encoding='utf-8')
for prefix,name in [('Base','bg_base'),('Feature','bg_feature'),('Hold','bg_holdandspin')]:
 s=s.replace(f'mummyBackground/{name}.png',f'mummyBackground/{name}_far.png')
 key='mummy'+prefix+'Props'
 if key+':' not in s:s=s.replace('export default {',f"export default {{\n {key}: {{type:'sprite',src:new URL('../../assets/sprites/mummyBackground/{name}_props.png',import.meta.url).href,preload:true}},",1)
s=s.replace('mummyBackground/bg_base_props.png','mummyBackground/bg_base_torches.png')
if 'mummyBaseLinen:' not in s:s=s.replace('export default {',"export default {\n mummyBaseLinen:{type:'sprite',src:new URL('../../assets/sprites/mummyBackground/bg_base_linen.png',import.meta.url).href,preload:true},",1)
p.write_text(s,encoding='utf-8')
print('Packaged nine background layers and four bright cover layers')
