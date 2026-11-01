"""Compose platform BG/FG layers from original key art and original cast cutouts."""
from pathlib import Path
from PIL import Image, ImageOps
import shutil, json

APP=Path(__file__).resolve().parents[1]
SRC=APP/'design/source/production'
THUMB=APP/'design/thumbnail';COVER=APP/'design/cover'
THUMB.mkdir(exist_ok=True);COVER.mkdir(exist_ok=True)

def character(name,height):
    folder=APP/'design/source'/name
    meta=json.loads((folder/'layers.json').read_text())
    im=Image.new('RGBA',tuple(meta['canvas']))
    for layer in sorted(meta['layers'],key=lambda v:v['z']):
        im.alpha_composite(Image.open(folder/layer['file']).convert('RGBA'),(layer['x'],layer['y']))
    im=im.crop(im.getchannel('A').getbbox())
    return im.resize((round(im.width*height/im.height),height),Image.Resampling.LANCZOS)

bg=ImageOps.fit(Image.open(THUMB/'PicklePanic-BG.png' if (THUMB/'PicklePanic-BG.png').exists() else SRC/'thumbnail_bg.png').convert('RGB'),(1024,1024),method=Image.Resampling.LANCZOS)
fg=Image.new('RGBA',(1024,1024));hero=character('mg',870);fg.alpha_composite(hero,(580-hero.width//2,90))
bg.save(THUMB/'PicklePanic-BG.png');fg.save(THUMB/'PicklePanic-FG.png')
Image.alpha_composite(bg.convert('RGBA'),fg).save(THUMB/'PicklePanic-preview.png')
bg=ImageOps.fit(Image.open(COVER/'PicklePanic-Cover-BG.png' if (COVER/'PicklePanic-Cover-BG.png').exists() else SRC/'cover_bg.png').convert('RGB'),(1920,1080),method=Image.Resampling.LANCZOS)
fg=Image.new('RGBA',(1920,1080))
for name,cx,top,height in [('mg',1140,170,865),('fg',1550,205,825)]:
    hero=character(name,height);fg.alpha_composite(hero,(cx-hero.width//2,top))
bg.save(COVER/'PicklePanic-Cover-BG.png');fg.save(COVER/'PicklePanic-Cover-FG.png')
Image.alpha_composite(bg.convert('RGBA'),fg).save(COVER/'PicklePanic-preview.png')
print('Built 1024 thumbnail with one hero and 1920×1080 cover layers; FG has real alpha and no text.')

# Standing card heroes use the same final assembly as the runtime atlas.
for name,filename in [("mg","buy_boss.png"),("fg","buy_chef.png")]:
    hero=character(name,412);hero.thumbnail((192,412),Image.Resampling.LANCZOS)
    card=Image.new("RGBA",(198,420));card.alpha_composite(hero,((198-hero.width)//2,3))
    card.save(APP/"static/assets/pickle"/filename)
