"""Export transparent platform layers and pack runtime plate particles."""
from pathlib import Path
import json
from PIL import Image, ImageOps
APP=Path(__file__).resolve().parents[1]; DESIGN=APP/'design'; SPR=APP/'static/assets/sprites'
bg=Image.open(DESIGN/'source/backgrounds/bg_base.png').convert('RGB')
hero=Image.open(DESIGN/'cast_delivery/mg_full_source.png').convert('RGBA')
hero=hero.crop(hero.getchannel('A').getbbox())
thumb=DESIGN/'thumbnail'; thumb.mkdir(exist_ok=True)
ImageOps.fit(bg,(1024,1024)).save(thumb/'SushiMonkey-BG.png',optimize=True)
fg=Image.new('RGBA',(1024,1024)); im=hero.copy(); im.thumbnail((880,970),Image.Resampling.LANCZOS)
fg.alpha_composite(im,((1024-im.width)//2,1024-im.height))
fg.save(thumb/'SushiMonkey-FG.png',optimize=True)
cover=DESIGN/'cover'; cover.mkdir(exist_ok=True)
ImageOps.fit(bg,(1920,1080)).save(cover/'SushiMonkey-Cover-BG.png',optimize=True)
fg=Image.new('RGBA',(1920,1080)); im=hero.copy(); im.thumbnail((630,1000),Image.Resampling.LANCZOS)
fg.alpha_composite(im,(1000,1080-im.height))
fg.save(cover/'SushiMonkey-Cover-FG.png',optimize=True)
plate=Image.open(SPR/'sushiSymbols/p.png').convert('RGBA')
sheet=Image.new('RGBA',(1280,512)); frames={}
for i in range(10):
    frame=Image.new('RGBA',(256,256)); im=plate.copy(); im.thumbnail((190,190),Image.Resampling.LANCZOS)
    im=im.rotate(i*31,resample=Image.Resampling.BICUBIC,expand=True)
    frame.alpha_composite(im,((256-im.width)//2,(256-im.height)//2))
    x,y=(i%5)*256,(i//5)*256; sheet.alpha_composite(frame,(x,y))
    frames[f'banana_{i+1:02}.png']={'frame':{'x':x,'y':y,'w':256,'h':256},'rotated':False,'trimmed':False,
      'spriteSourceSize':{'x':0,'y':0,'w':256,'h':256},'sourceSize':{'w':256,'h':256}}
out=SPR/'sushiWinPlates';out.mkdir(exist_ok=True)
sheet.save(out/'bananas.png',optimize=True)
(out/'bananas.json').write_text(json.dumps({'frames':frames,'meta':{'image':'bananas.png','scale':'1','size':{'w':1280,'h':512}}}))
plate.resize((128,128),Image.Resampling.LANCZOS).save(SPR/'sushiFx/collect_bananas.png',optimize=True)
print('Exported thumbnail, cover and sushi plate particle atlas')
