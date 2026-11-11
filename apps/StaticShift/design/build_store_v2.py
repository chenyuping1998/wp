"""Lay out bright original store layers using the same revised cast as the game."""
from pathlib import Path
from PIL import Image,ImageOps
import shutil
APP=Path(__file__).resolve().parents[1];D=APP/'design';SP=APP/'static/assets/sprites';src=D/'source-v2/store-background.png'
bg=Image.open(src).convert('RGBA')
# 2026-11-09: the stand34 cast the game now draws (design/cast_v2/交件, art r7/r7.1),
# not the retired source/{mg,fg} cut — store art and game show the same people
CAST={'mg':'dj','fg':'host'}
def assembled(cast):
 im=Image.open(D/'cast_v2'/'交件'/CAST[cast]/'assembled.png').convert('RGBA')
 return im.crop(im.getbbox())
mg=assembled('mg');fg=assembled('fg')
def scaled(im,h):return im.resize((round(im.width*h/im.height),h),Image.Resampling.LANCZOS)
for kind in ['thumbnail','cover']:
 out=D/kind;out.mkdir(exist_ok=True)
 if kind=='thumbnail':
  size=(1024,1024);back=ImageOps.fit(bg,size,centering=(.55,.5));front=Image.new('RGBA',size)
  bust=scaled(mg.crop((0,0,mg.width,round(mg.height*.61))),1000);front.alpha_composite(bust,((1024-bust.width)//2,38));prefix='StaticShift'
 else:
  size=(1920,1080);back=ImageOps.fit(bg,size);front=Image.new('RGBA',size)
  front.alpha_composite(scaled(mg,980),(570,80));front.alpha_composite(scaled(fg,980),(1110,80));prefix='StaticShift-Cover'
 back.convert('RGB').save(out/(prefix+'-BG.png'));front.save(out/(prefix+'-FG.png'))
 composite=Image.alpha_composite(back,front);composite.save(out/'composite.png');composite.thumbnail((356,200));composite.save(out/'200px.png')
 print(kind,'built')
