"""Render transparent-layer proof from Spine4.3 baked transforms, all six clips."""
from pathlib import Path
from PIL import Image, ImageDraw
import json,math
R=Path(__file__).resolve().parent
for cast in ['mg','fg']:
 data=json.loads((R.parent/'src/game'/f'sumoMotion_{cast}.json').read_text())
 source=R.parent/'static/assets/sumoCast'/cast
 images={n:Image.open(source/f'{n}.png').convert('RGBA') for n in data['names']}
 frames=[]; S=.265; W,H=420,450
 for name,clip in data['clips'].items():
  for k in range(max(1,math.ceil(clip['duration']*12))):
   pose=clip['frames'][min(len(clip['frames'])-1,round(k/12*clip['fps']))]
   frame=Image.new('RGBA',(W,H),(29,34,48,255))
   for n,(a,b,c,d,x,y) in zip(data['names'],pose):
    a,b,c,d=a*S,b*S,c*S,d*S;x=160+x*S;y=422+y*S
    det=a*d-b*c
    inv=(d/det,-c/det,(c*y-d*x)/det,-b/det,a/det,(b*x-a*y)/det)
    layer=images[n].transform((W,H),Image.Transform.AFFINE,inv,Image.Resampling.BICUBIC)
    frame.alpha_composite(layer)
   ImageDraw.Draw(frame).text((12,12),f'SUMO MONKEY / {cast.upper()} / {name}',fill='#efe2bd')
   frames.append(frame.convert('RGB'))
 out=R/'sumo_cast'/cast/f'{cast}_spine'/'預覽.gif'
 frames[0].save(out,save_all=True,append_images=frames[1:],duration=83,loop=0)
 print(out,len(frames))
