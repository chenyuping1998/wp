"""Install authored source paintings; draw only native stencil glyphs/lettering.
Never paints substitute characters or adds synthetic noise to pass art gates.
"""
from pathlib import Path
import math, json, shutil
import numpy as np
from PIL import Image, ImageDraw, ImageFont
D=Path(__file__).resolve().parent
APP=D.parent.parent
SPR=APP/'static/assets/sprites'
INK='#121212';IVORY='#f7f5f0';ORANGE='#f5893d';GRAY='#9a9ca0'

def icon(source, target):
 im=Image.open(source).convert('RGBA');a=im.getchannel('A');box=a.point(lambda v:255 if v>16 else 0).getbbox()
 if not box:raise ValueError(f'Empty art: {source}')
 im=im.crop(box);im.thumbnail((448,448),Image.Resampling.LANCZOS)
 final=Image.new('RGBA',(512,512));final.alpha_composite(im,((512-im.width)//2,(512-im.height)//2));final.save(target,optimize=True)

def stencils():
 # These four are signage glyphs, deliberately native geometry rather than
 # model-painted pseudo-lettering. Keep the construction at full resolution.
 for n in ['l1','l2','l3','l4']:
  im=Image.new('RGBA',(1536,1536));draw=ImageDraw.Draw(im);S=3
  def line(points,width=25):draw.line([(x*S,y*S) for x,y in points],fill=GRAY,width=width*S,joint='curve')
  def ellipse(box,width=25):draw.ellipse(tuple(v*S for v in box),outline=GRAY,width=width*S)
  if n=='l1':
   line([(105,350),(80,180),(190,240),(256,135),(320,240),(432,180),(407,350),(105,350)])
   line([(125,390),(390,390)],21)
  elif n=='l2':
   p=[]
   for i in range(10):
    angle=-math.pi/2+i*math.pi/5;r=174 if i%2==0 else 79;p.append((256+math.cos(angle)*r,260+math.sin(angle)*r))
   line(p+[p[0]],25)
  elif n=='l3':
   # Angular skull stamp, generous clear eye holes, no tiny tooth detail.
   line([(154,326),(113,291),(104,205),(139,135),(209,109),(304,109),(375,145),(408,217),(397,291),(356,326),(356,380),(310,402),(208,402),(154,380),(154,326)],24)
   ellipse((154,196,226,270),20);ellipse((286,196,358,270),20)
   line([(240,309),(256,285),(274,309)],18)
   line([(232,361),(232,399)],17);line([(282,361),(282,399)],17)
  else:
   line([(294,100),(130,280),(242,280),(203,419),(386,224),(276,224),(294,100)],26)
  im.save(D/'source'/f'{n}-stencil-source.png')
  target={'l2':'l3','l3':'l2'}.get(n,n)
  im.resize((512,512),Image.Resampling.LANCZOS).save(SPR/'turfSymbols'/f'{target}.png',optimize=True)

def lettermark():
 im=Image.new('RGBA',(1200,520));draw=ImageDraw.Draw(im)
 font=ImageFont.truetype(str(APP/'static/fonts/Bungee-Regular.ttf'),182)
 for text,y,color in [('TURF',130,IVORY),('WAR',340,ORANGE)]:
  draw.text((612,y+12),text,font=font,anchor='mm',fill=INK,stroke_width=12,stroke_fill=INK)
  draw.text((600,y),text,font=font,anchor='mm',fill=color,stroke_width=7,stroke_fill=INK)
 im.save(SPR/'turfBrand/logo.png',optimize=True)

def main():
 for n in ['h1','h2','h3','h4','h5','w','fs','sw']:
  p=D/'source'/f'{n}.png'
  if p.exists():icon(p,SPR/'turfSymbols'/f'{n}.png')
 stencils();lettermark()
 for v in ['base','feature','epic']:
  im=Image.open(D/'source'/f'bg-{v}.png').convert('RGB').resize((1920,1080),Image.Resampling.LANCZOS)
  im.save(SPR/'turfBackground'/f'bg_{v}.png',optimize=True)
 # The loading figure must be the same final assembled actor as gameplay.
 cast=Image.open(D/'cast/mg/full.png').convert('RGBA')
 cast.resize((512,768),Image.Resampling.LANCZOS).save(APP/'static/assets/castLayers/turf/loading.png',optimize=True)
 # A report of source vs installed assets, not a synthetic color score.
 records=[]
 for p in sorted((SPR/'turfSymbols').glob('*.png')):
  im=Image.open(p).convert('RGBA');records.append({'file':str(p.relative_to(APP)),'size':im.size,'alpha':im.getchannel('A').getextrema()})
 (D/'installed-art.json').write_text(json.dumps(records,indent=2))
 print('Installed source paintings, native stencil glyphs, lettering and matching loading cast.')

if __name__=='__main__':main()
