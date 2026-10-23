"""Compose the finished own street cast into loading, store tile and cover.

Separate BG/FG layers remain editable. Nothing is staged to upload/ here.
"""
from pathlib import Path
import shutil
import numpy as np
from PIL import Image, ImageDraw, ImageFont

D=Path(__file__).resolve().parent
APP=D.parent
SPR=APP/'static/assets/sprites'
INK='#121212'
WHITE='#F7F5F0'
ORANGE='#F5893D'
BACKUP=D/'_legacy_assets/pre_street_brand'

def write(im,path):
 if path.exists():
  saved=BACKUP/path.relative_to(APP)
  if not saved.exists():
   saved.parent.mkdir(parents=True,exist_ok=True)
   shutil.copy2(path,saved)
 path.parent.mkdir(parents=True,exist_ok=True)
 im.save(path,optimize=True)

# Crossed-arm art already carries the correct rest pose.
REST={'mg':{},'fg':{}}
TIERS={'mg':'LAYERED_TIERS','fg':'KINGPIN_TIERS'}

def posed(who):
 import json,subprocess
 layers=APP/'static/assets/castLayers/turf'/('base' if who=='mg' else 'fg')
 out=subprocess.run(['node',str(D/'pose_layered_verts.mjs'),str(layers/'layers.manifest.json'),
  str(APP/'src/game/castMotion.ts'),str(APP/'src/game/layeredCastMotion.ts')+'#'+TIERS[who],
  json.dumps(REST[who])],check=True,capture_output=True,text=True).stdout
 d=json.loads(out)
 im=Image.new('RGBA',(1024,2048))
 for name in d['order']:
  L=d['layers'][name]
  tex=Image.open(layers/f'{name}.png').convert('RGBA')
  cx,cy=L['crop'][:2]
  dst=np.array(L['dst']).reshape(-1,2)
  layer=Image.new('RGBA',im.size)
  for t in L['tris']:
   S=np.array([[L['src'][k][0]-cx,L['src'][k][1]-cy] for k in t]);T=dst[list(t)]
   x0,y0=np.floor(T.min(0)).astype(int)-1;x1,y1=np.ceil(T.max(0)).astype(int)+1
   try:M=np.linalg.solve(np.c_[T,np.ones(3)],S)
   except np.linalg.LinAlgError:continue
   a,b,c=M[:,0];e,f,g=M[:,1]
   patch=tex.transform((x1-x0,y1-y0),Image.AFFINE,(a,b,a*x0+b*y0+c,e,f,e*x0+f*y0+g),resample=Image.BILINEAR)
   mask=Image.new('L',patch.size);ImageDraw.Draw(mask).polygon([(p[0]-x0,p[1]-y0) for p in T],fill=255)
   layer.paste(patch,(x0,y0),mask)
  im.alpha_composite(layer)
 return im

def figure(who,height):
 im=posed(who)
 im=im.crop(im.getchannel('A').getbbox())
 return im.resize((round(im.width*height/im.height),height),Image.Resampling.LANCZOS)

def title():
 im=Image.new('RGBA',(1000,500))
 draw=ImageDraw.Draw(im)
 font=ImageFont.truetype(str(APP/'static/fonts/Bungee-Regular.ttf'),170)
 draw.text((500,170),'TURF',font=font,anchor='mm',fill=ORANGE,stroke_width=12,stroke_fill=INK)
 draw.text((500,335),'WAR',font=font,anchor='mm',fill=WHITE,stroke_width=12,stroke_fill=INK)
 return im.crop(im.getchannel('A').getbbox())

def main():
 thumb=D/'thumbnail'
 cover=D/'cover'
 bg=Image.open(D/'_street/street_brand/tile_background.png').convert('RGB').resize((1024,1024))
 fg=Image.new('RGBA',(1024,1024))
 # One character, no baked title or provider mark (review-findings §4: the
 # platform's Tile Editor sets the title over the tile). ~90px of headroom.
 cast=figure('mg',934)
 fg.alpha_composite(cast,(round(512-cast.width/2+40),90))
 write(bg,thumb/'TurfWar-BG.png')
 write(fg,thumb/'TurfWar-FG.png')
 write(Image.alpha_composite(bg.convert('RGBA'),fg),thumb/'_street-preview.png')
 # Keep platform's provider mark as a separate, unchanged layer.
 provider=thumb/'Silverstars-Logo.png'
 if not provider.exists():
  shutil.copy2(D/'_brand/Silverstars-Logo.png',provider)
 for name,im in [('tile_background',bg),('tile_foreground',fg)]:
  write(im,SPR/f'turfBrand/{name}.png')
  write(im,D/f'_brand/{name}.png')
 loading=posed('mg').resize((512,1024),Image.Resampling.LANCZOS)
 write(loading,APP/'static/assets/castLayers/turf/loading.png')
 cbg=Image.open(SPR/'turfBackground/bg_epic.png').convert('RGB').resize((1920,1080),Image.Resampling.LANCZOS)
 cfg=Image.new('RGBA',(1920,1080))
 # Cover reserves the star pill (upper-right16%x14%) and the thumbnail
 # (bottom-left24%x34%). Both characters stand outside these overlays.
 for who,cx in [('mg',970),('fg',1490)]:
  cast=figure(who,890)
  cfg.alpha_composite(cast,(round(cx-cast.width/2),180))
 sticker=Image.open(SPR/'turfSymbols/h1.png').convert('RGBA')
 sticker.thumbnail((300,300),Image.Resampling.LANCZOS)
 cfg.alpha_composite(sticker,(195,240))
 alpha=cfg.getchannel('A')
 assert alpha.crop((1612,0,1920,152)).getextrema()==(0,0),'rating overlay occupied'
 assert alpha.crop((0,712,461,1080)).getextrema()==(0,0),'thumbnail overlay occupied'
 write(cbg,cover/'TurfWar-Cover-BG.png')
 write(cfg,cover/'TurfWar-Cover-FG.png')
 preview=Image.alpha_composite(cbg.convert('RGBA'),cfg)
 draw=ImageDraw.Draw(preview)
 draw.rectangle((1612,0,1919,151),outline=ORANGE,width=4)
 draw.rectangle((0,712,460,1079),outline=ORANGE,width=4)
 write(preview,cover/'_preview_overlays.png')
 for name,im in [('tile',bg),('cover',cbg)]:
  y=np.asarray(im.resize((356,200))).astype(float)@[.2126,.7152,.0722]
  assert y.mean()>=100 and (y<32).mean()<=.3,f'{name} is too dark'
  print(name,'mean luminance',round(y.mean(),1),'dark fraction',round(float((y<32).mean()),4))
 print('Brand art rebuilt in design/thumbnail, design/cover and runtime static; upload untouched.')

if __name__=='__main__':main()
