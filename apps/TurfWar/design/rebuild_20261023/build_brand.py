"""Compose final v3 actor plates into separate editable store/cover layers."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageEnhance, ImageFilter
import numpy as np
D=Path(__file__).resolve().parent;APP=D.parent.parent;SPR=APP/'static/assets/sprites'
def figure(who,height):
 im=Image.open(D/f'cast/{who}/full.png').convert('RGBA');im=im.crop(im.getchannel('A').getbbox());return im.resize((round(im.width*height/im.height),height),Image.Resampling.LANCZOS)
def shadowpaste(out,im,xy):
 shadow=Image.new('RGBA',im.size,'#121212');shadow.putalpha(im.getchannel('A').point(lambda a:int(a*.8)))
 out.alpha_composite(shadow,(xy[0]+14,xy[1]+8));out.alpha_composite(im,xy)
def bright(im):
 # Lift only the backdrop, retaining the source painting. Cast stays untouched.
 a=np.asarray(im.convert('RGB')).astype(float)/255;a=np.clip(a**.68*.89+.11,0,1);return Image.fromarray((a*255).astype('uint8'))
thumb=APP/'design/thumbnail';cover=APP/'design/cover';thumb.mkdir(exist_ok=True);cover.mkdir(exist_ok=True)
source=Image.open(D/'source/bg-base.png').convert('RGB');h=source.height;left=round(source.width*.68-h/2)
bg=bright(source.crop((left,0,left+h,h)).resize((1024,1024),Image.Resampling.LANCZOS));fg=Image.new('RGBA',(1024,1024))
cast=figure('mg',1450);shadowpaste(fg,cast,(round(530-cast.width/2),80))
for name,im in [('TurfWar-BG',bg),('TurfWar-FG',fg),('_street-preview',Image.alpha_composite(bg.convert('RGBA'),fg))]:im.save(thumb/f'{name}.png',optimize=True)
for name,im in [('tile_background',bg),('tile_foreground',fg)]:im.save(SPR/'turfBrand'/f'{name}.png',optimize=True)
cbg=bright(Image.open(D/'source/bg-epic.png').resize((1920,1080),Image.Resampling.LANCZOS));cfg=Image.new('RGBA',(1920,1080))
for who,cx in [('mg',975),('fg',1465)]:
 im=figure(who,890);shadowpaste(cfg,im,(round(cx-im.width/2),180))
prop=Image.open(SPR/'turfSymbols/h1.png').convert('RGBA');prop.thumbnail((310,310));shadowpaste(cfg,prop,(230,230))
assert cfg.getchannel('A').crop((1612,0,1920,152)).getextrema()==(0,0)
assert cfg.getchannel('A').crop((0,712,461,1080)).getextrema()==(0,0)
cbg.save(cover/'TurfWar-Cover-BG.png',optimize=True);cfg.save(cover/'TurfWar-Cover-FG.png',optimize=True)
preview=Image.alpha_composite(cbg.convert('RGBA'),cfg);draw=ImageDraw.Draw(preview);draw.rectangle((1612,0,1919,151),outline='#f5893d',width=4);draw.rectangle((0,712,460,1079),outline='#f5893d',width=4);preview.save(cover/'_preview_overlays.png')
for name,im in [('thumbnail',bg),('cover',cbg)]:
 y=np.asarray(im.resize((356,200))).astype(float)@[.2126,.7152,.0722];print(name,'mean',round(y.mean(),1),'dark',round(float((y<32).mean()),4));assert y.mean()>=100 and (y<32).mean()<=.3
print('Matching v3 thumbnail and cover layered exports ready.')
