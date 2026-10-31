from pathlib import Path
from PIL import Image,ImageChops
import json
ROOT=Path(__file__).resolve().parents[1]/'static/assets/treasure'
for name,order in [('h1',['chest_body','chest_lid']),('h2',['castle_flag','castle_body'])]:
 assembled=Image.new('RGBA',(512,512))
 for part in order:
  image=Image.open(ROOT/f'{part}.png').convert('RGBA');assert image.size==(512,512)
  assembled.alpha_composite(image)
 flat=Image.open(ROOT/f'{name}.png').convert('RGBA')
 assert ImageChops.difference(assembled,flat).getbbox() is None, f'{name} idle/art stack mismatch would flash'
for who in ['digger','lifeguard']:
 a=Image.open(ROOT/f'{who}_head.png').convert('RGBA');b=Image.open(ROOT/f'{who}_blink.png').convert('RGBA')
 assert a.size==b.size,'blink head registration must retain neutral canvas'
 aa=a.getchannel('A').point(lambda v:255 if v>72 else 0);bb=b.getchannel('A').point(lambda v:255 if v>72 else 0)
 overlap=sum(ImageChops.darker(aa,bb).getdata())/max(1,sum(ImageChops.lighter(aa,bb).getdata()))
 assert overlap>.94,(who,overlap)
 print(who,'blink silhouette overlap',round(overlap,3))
print('OK: exact idle-to-rig compositions and registered blink silhouettes')

rig=json.loads((ROOT/'cast.json').read_text(encoding='utf-8'))
for who,parts in rig.items():
 head,body=parts['head'],parts['body']
 # The head rotates about opaque neck pixels that overlap the collar's skin.
 # Hat cords contain transparent space, so they cannot be used as neck pivots.
 for part,u,v in [(head,head['ax'],head['ay']),
                  (body,(head['x']-body['x'])/body['w']+body['ax'],(head['y']-body['y'])/body['h']+body['ay'])]:
  image=Image.open(ROOT.parent/part['path']).convert('RGBA')
  px,py=round(u*image.width),round(v*image.height)
  for dx in [-3,0,3]:
   for dy in [-3,0,3]:assert image.getpixel((px+dx,py+dy))[3]>240,(who,'neck pivot must stay inside opaque neck/collar artwork')
print('OK: both anatomical neck pivots overlap opaque head and collar pixels')
