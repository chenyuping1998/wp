"""Audit delivered layers and pixel-level art gates without rewriting art."""
from pathlib import Path
from PIL import Image,ImageChops
import json,numpy as np
D=Path(__file__).resolve().parent/'source/volt_delivery';luma=np.array([.2126,.7152,.0722]);metrics={}
for k in ['h1','h2','h3','h4','w','s','l1','l2','l3','l4','l5']:
 a=np.array(Image.open(D/'symbols'/f'{k}.png').convert('RGB'));c=(a*luma).sum(2)[205:819,205:819];metrics[k]={'central60Mean':round(float(c.mean()),3),'bright150Coverage':round(float((c>150).mean()),5)}
hi=[metrics[k] for k in ['h1','h2','h3','h4','w','s']];lo=[metrics[k] for k in ['l1','l2','l3','l4','l5']]
assert min(v['central60Mean'] for v in hi)>=70
assert max(v['central60Mean'] for v in lo)<=min(v['central60Mean'] for v in hi)
assert max(v['bright150Coverage'] for v in lo)<=min(v['bright150Coverage'] for v in hi)
scenes={};props=json.loads((D/'backgrounds/objects.json').read_text(encoding='utf-8'))
for mode,prefix in [('base','bg_base'),('feature','bg_feature'),('hold','bg_holdandspin')]:
 files=list((D/'backgrounds').glob(prefix+'_obj_*.png'));assert 5<=len(files)<=8
 im=Image.open(D/'backgrounds'/f'{prefix}_far.png').convert('RGBA')
 # Respect the authored draw order: cables and electrodes may overlap.
 for p in props[mode]:
  layer=Image.open(D/'backgrounds'/f'{prefix}_obj_{p["id"]}.png').convert('RGBA');assert layer.size==(1920,1080);im.alpha_composite(layer)
 diff=np.max(np.abs(np.asarray(im,dtype=int)-np.asarray(Image.open(D/'backgrounds'/f'{prefix}.png'),dtype=int)));assert diff==0
 assert all(p['period']>=15000 for p in props[mode]);scenes[mode]={'objects':len(files),'maxCompositePixelError':int(diff),'minLoopMs':min(p['period'] for p in props[mode])}
old=json.loads((D/'art_metrics.json').read_text());old['symbols']=metrics;old['backgrounds']=scenes;(D/'art_metrics.json').write_text(json.dumps(old,indent=2),encoding='utf-8')
print(json.dumps({'passed':True,'backgrounds':scenes}))
