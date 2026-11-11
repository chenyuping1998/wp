from pathlib import Path
import json
from PIL import Image,ImageDraw
A=Path('/Users/stone/stake-engine/wp/apps/HardTime');Q=A/'design/qa/character_fix_20261029'
for who in ['prisoner','warden']:
 d=A/f'static/assets/castLayers/{who}_spine_v2';m=json.loads((d/'layers.json').read_text())
 for page in range((len(m['layers'])+3)//4):
  layers=m['layers'][page*4:page*4+4];sheet=Image.new('RGB',(1200,900),'#333333');draw=ImageDraw.Draw(sheet)
  for i,l in enumerate(layers):
   im=Image.open(d/l['texture']).convert('RGBA');im=im.crop(im.getbbox());im.thumbnail((280,820))
   for j,bg in enumerate(['#f0f0f0','#191919']):
    x=i*300+j*150;thumb=im.copy();thumb.thumbnail((145,810));sheet.paste(Image.new('RGB',(150,900),bg),(x,0));sheet.paste(thumb,(x+(150-thumb.width)//2,45),thumb)
   draw.text((i*300+5,12),l['name'],fill='#e33')
  sheet.save(Q/f'{who}_layers_{page}.jpg')
 for clip in ['idle','react','reactBig','blink']:
  frames=sorted((Q/'runtime').glob(who+'_wide_'+clip+'_*.png'))
  # Native render shoulder-to-hip detail, including transition and peak.
  sheet=Image.new('RGB',(1600,720),'#333');dr=ImageDraw.Draw(sheet)
  for i,idx in enumerate([0,24,32,40,48,60,84,120]):
   im=Image.open(frames[idx]);im=im.crop((int(im.width*.25),int(im.height*.125),int(im.width*.75),int(im.height*.5625)));im.thumbnail((395,330));x=(i%4)*400;y=(i//4)*360
   sheet.paste(im,(x,y+25));dr.text((x+3,y+3),f'{clip} {idx/60:.2f}s',fill='white')
  sheet.save(Q/f'{who}_{clip}_joints.jpg')
  ims=[]
  for f in frames[::3]:
   im=Image.open(f).convert('RGB');im.thumbnail((600,800));ims.append(im)
  ims[0].save(Q/f'{who}_{clip}.gif',save_all=True,append_images=ims[1:],duration=50,loop=0)
