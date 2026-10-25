from pathlib import Path
from PIL import Image,ImageChops
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
