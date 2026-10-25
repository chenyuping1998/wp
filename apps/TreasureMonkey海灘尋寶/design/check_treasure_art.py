from PIL import Image
from pathlib import Path
import json
ROOT=Path(__file__).resolve().parents[1];ART=ROOT/'static/assets/treasure'
names=['h1','h2','h3','h4','h5','w','s','sw','l1','l2','l3','l4']
for name in names:
 image=Image.open(ART/f'{name}.png');assert image.mode=='RGBA' and image.size==(512,512)
 alpha=image.getchannel('A');assert alpha.getextrema()==(0,255),name
 coverage=sum(v>40 for v in alpha.getdata())/(512*512);assert .12<coverage<.8,(name,coverage)
 thumb=image.resize((70,70));assert sum(v>80 for v in thumb.getchannel('A').getdata())>600,name
rig=json.loads((ART/'cast.json').read_text())
for who,parts in rig.items():
 assert len(parts)==8
 for name,p in parts.items():
  image=Image.open(ROOT/'static/assets'/p['path']);assert image.mode=='RGBA' and image.getchannel('A').getbbox(),(who,name)
 assert Image.open(ART/f'{who}_full.png').size==(480,720)
assert Image.open(ART/'bg_base.jpg').size==(1920,1080)
print('OK: 12 transparent 512px symbols, 70px occupancy, 16 nonempty rig parts, two flattened rigs and 1920×1080 beach plate. Visual review remains required.')
