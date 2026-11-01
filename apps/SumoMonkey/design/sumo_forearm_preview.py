"""Render old/new actual baked clips and high-detail arm comparisons."""
from pathlib import Path
from PIL import Image,ImageDraw
import json,math
A=Path(__file__).resolve().parents[1];R=A.parents[2];O=R/'dist/sumomonkey-forearm-fix';B=O/'before';O.mkdir(exist_ok=True)
ns={'__file__':str(A/'design/sumo_redissect_v2_preview.py')}
s=(A/'design/sumo_redissect_v2_preview.py').read_text().split('casts = {}')[0].replace('190+x*S, 420+y*S','W*.45+x*S, H*.94+y*S')
exec(s,ns);render=ns['render'];load=ns['source'];W,H=420,450
for cast in ['mg','fg']:
 old,new=load(B,cast),load(A,cast);frames=[];sheet=Image.new('RGB',(W*5,H*6),'#efeadc');arm=Image.new('RGB',(760*2,320*18),'#efeadc')
 for row,(name,clip) in enumerate(new[0]['clips'].items()):
  for k in range(math.ceil(clip['duration']*15)):
   t=k/15;f=Image.new('RGB',(W*2,H));f.paste(render(*old,name,t,cast+' BEFORE'),(0,0));f.paste(render(*new,name,t,cast+' AFTER'),(W,0));frames.append(f)
  for col,t in enumerate([0,clip['duration']*.25,clip['duration']*.5,clip['duration']*.75,clip['duration']]):
   pic=render(*new,name,t,cast+' '+name+f' {t:.2f}s');sheet.paste(pic,(col*W,row*H))
  for k,t in enumerate([clip['duration']*.2,clip['duration']*.5,clip['duration']*.8]):
   for c,source in enumerate([old,new]):
    pic=render(*source,name,t,cast+(' BEFORE' if c==0 else ' AFTER'));pic=pic.crop((0,95,380,255)).resize((760,320),Image.Resampling.LANCZOS)
    ImageDraw.Draw(pic).text((8,8),name+f' {t:.2f}s '+('BEFORE' if c==0 else 'AFTER'),fill='#c47d60');arm.paste(pic,(c*760,(row*3+k)*320))
 frames[0].save(O/f'{cast}-forearm-before-after.gif',save_all=True,append_images=frames[1:],duration=67,loop=0)
 sheet.save(O/f'{cast}-six-motion-review.png');arm.save(O/f'{cast}-arm-detail.png')
 for i in range(3):sheet.crop((0,i*900,2100,(i+1)*900)).save(O/f'{cast}-motion-{i}.png')
 for i in range(6):arm.crop((0,i*960,1520,(i+1)*960)).save(O/f'{cast}-arms-{i}.png')
 print(cast,len(frames),'actual baked frames rendered')
# Inspect each changed source part alone on a light and dark backing.
review=Image.new('RGB',(1200,1200),'#efeadc')
for row,(cast,side,segment) in enumerate((c,s,t) for c in ['mg','fg'] for s in ['front','back'] for t in ['upper','lower']):
 im=Image.open(A/f'design/sumo_cast/{cast}/layers/arm_{side}_{segment}.png').convert('RGBA');im=im.crop(im.getbbox());im.thumbnail((265,120))
 for col,bg in enumerate(['#efeadc','#333b4b']):
  x=(row%4)*300;y=(row//4)*600+col*300;review.paste(bg,(x,y,x+300,y+300));review.paste(im,(x+(300-im.width)//2,y+80),im);ImageDraw.Draw(review).text((x+8,y+8),cast+' '+side+' '+segment,fill='#c47d60')
review.save(O/'changed-layers-light-dark.png')
