"""Preview a staged texture correction against existing real baked bone motion.
Adjusts the crop offset only; never changes the bake, live assets or skeleton.
"""
from pathlib import Path
from PIL import Image,ImageDraw
import json,math,argparse
ROOT=Path(__file__).resolve().parent;APP=ROOT.parent;REPO=ROOT.parents[3]
p=argparse.ArgumentParser();p.add_argument('--cast',choices=['mg','fg'],required=True);p.add_argument('--full-bake',action='store_true');args=p.parse_args();cast=args.cast
stage=REPO/'角色生圖_相撲猴/交件'/cast.upper()/'staged';data=json.loads((APP/f'src/game/sumoMotion_{cast}.json').read_text());old=json.loads((ROOT/f'sumo_cast/{cast}/crops.json').read_text());new=json.loads((stage/'crops.json').read_text())
OUT=REPO/'dist/sumomonkey-boxing-evidence';OUT.mkdir(exist_ok=True,parents=True)
if args.full_bake:data=json.loads((OUT/f'{cast}-staged-real-bone-motion.json').read_text())
W,H,S=500,640,.36
imgs={n:Image.open(stage/('layers' if args.full_bake else 'textures')/f'{n}.png').convert('RGBA') for n in data['names']}
frames=[]
for name,clip in data['clips'].items():
 for phase in [0,.5,1]:
  t=clip['duration']*phase;pose=clip['frames'][min(len(clip['frames'])-1,round(t*clip['fps']))];out=Image.new('RGBA',(W,H),'#efeadc')
  for n,(a,b,c,d,e,f) in zip(data['names'],pose):
   dx=0 if args.full_bake else new[n][0]-old[n][0];dy=0 if args.full_bake else new[n][1]-old[n][1];e+=a*dx+c*dy;f+=b*dx+d*dy
   a,b,c,d=a*S,b*S,c*S,d*S;e=230+e*S;f=590+f*S;det=a*d-b*c
   inv=(d/det,-c/det,(c*f-d*e)/det,-b/det,a/det,(b*e-a*f)/det)
   out.alpha_composite(imgs[n].transform((W,H),Image.Transform.AFFINE,inv,Image.Resampling.BICUBIC))
  ImageDraw.Draw(out).text((15,15),f'{cast} staged / {name} / {phase:.1f}',fill='#282828');out.convert('RGB').save(OUT/f'{cast}-repaired-{name}-{phase:.1f}.png');frames.append(out)
sheet=Image.new('RGB',(W*3,H*math.ceil(len(frames)/3)),'#efeadc')
for i,im in enumerate(frames):sheet.paste(im,(i%3*W,i//3*H))
sheet.save(OUT/f'{cast}-repaired-motion-contact.png');print(OUT/f'{cast}-repaired-motion-contact.png')
