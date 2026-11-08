"""Install only character assets, expression pages and matching cover foregrounds."""
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import json,shutil,runpy
ROOT=Path(__file__).resolve().parent;APP=ROOT.parent;D=ROOT/'source/mummy_delivery'
runtime=APP/'static/assets/spines/mummyCat'
for p in (D/'mascot_built/game').iterdir():shutil.copy2(p,runtime/p.name)
runpy.run_path(str(ROOT/'build_mummy_expressions.py'),run_name='__main__')
cat=Image.open(D/'mascot/assembled.png').convert('RGBA');cat=cat.crop(cat.getchannel('A').getbbox());td=D/'thumbnail'
for name,size in [('cover_16x9_fg',(1920,1080)),('thumb_fg',(1024,1024))]:
 fg=Image.new('RGBA',size);a=cat.copy();a.thumbnail((int(size[0]*.78),int(size[1]*.96)),Image.Resampling.LANCZOS)
 fg.alpha_composite(a,(int(size[0]*.62-a.width*.5) if size[0]>1100 else (size[0]-a.width)//2,size[1]-a.height));fg.save(td/(name+'.png'))
 bg=Image.open(td/('cover_16x9_bg.png' if size[0]>1100 else 'thumb_bg.png')).convert('RGBA');bg.alpha_composite(fg);bg.save(td/(name+'_composite.png'))
before=Image.open(D/'mascot_versions/v1_tail_belly/assembled.png').convert('RGBA');after=Image.open(D/'mascot/assembled.png').convert('RGBA')
comparison=Image.new('RGBA',(1100,850),'#10303a')
for i,(text,src) in enumerate([('BEFORE',before),('AFTER',after)]):
 src=src.resize((512,768),Image.Resampling.LANCZOS);comparison.alpha_composite(src,(i*550+19,65))
 ImageDraw.Draw(comparison).text((i*550+275,32),text,font=ImageFont.truetype(str(APP/'static/fonts/LilitaOne.ttf'),28),fill='#f2e8d0',anchor='mm')
comparison.save(ROOT/'preview_mummy_20261107/character_tail_belly_v2.png')
print('Installed character v2; refreshed expression pages and cover foregrounds')
