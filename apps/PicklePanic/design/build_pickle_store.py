"""Compose platform BG/FG layers from original key art and original cast cutouts."""
from pathlib import Path
from PIL import Image, ImageOps
import shutil

APP=Path(__file__).resolve().parents[1]
SRC=APP/'design/source/production'
THUMB=APP/'design/thumbnail';COVER=APP/'design/cover'
THUMB.mkdir(exist_ok=True);COVER.mkdir(exist_ok=True)

def character(name,height):
    im=Image.open(SRC/f'{name}.png').convert('RGBA');im=im.crop(im.getchannel('A').getbbox())
    return im.resize((round(im.width*height/im.height),height),Image.Resampling.LANCZOS)

bg=ImageOps.fit(Image.open(SRC/'thumbnail_bg.png').convert('RGB'),(1024,1024),method=Image.Resampling.LANCZOS)
fg=Image.new('RGBA',(1024,1024));hero=character('mg',870);fg.alpha_composite(hero,(580-hero.width//2,90))
bg.save(THUMB/'PicklePanic-BG.png');fg.save(THUMB/'PicklePanic-FG.png')
Image.alpha_composite(bg.convert('RGBA'),fg).save(THUMB/'PicklePanic-preview.png')
bg=ImageOps.fit(Image.open(SRC/'cover_bg.png').convert('RGB'),(1920,1080),method=Image.Resampling.LANCZOS)
fg=Image.new('RGBA',(1920,1080))
for name,cx,top,height in [('mg',1140,170,865),('fg',1550,205,825)]:
    hero=character(name,height);fg.alpha_composite(hero,(cx-hero.width//2,top))
bg.save(COVER/'PicklePanic-Cover-BG.png');fg.save(COVER/'PicklePanic-Cover-FG.png')
Image.alpha_composite(bg.convert('RGBA'),fg).save(COVER/'PicklePanic-preview.png')
print('Built 1024 thumbnail with one hero and 1920×1080 cover layers; FG has real alpha and no text.')
