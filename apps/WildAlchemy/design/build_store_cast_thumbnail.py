"""Register the actual MG cast on the store FG; no baked text or extra props."""
from pathlib import Path
from PIL import Image
APP=Path(__file__).resolve().parent.parent
name=APP.name
source=APP/('design/cast_parts/base/full.png' if name=='TurfWar' else 'design/cast_parts/crossed_arms/full.png')
im=Image.open(source).convert('RGBA');x0,y0,x1,y1=im.getchannel('A').point(lambda a:255 if a>16 else 0).getbbox()
im=im.crop((x0,y0,x1,round(y0+(y1-y0)*.66)))
scale=min(850/im.width,850/im.height);im=im.resize((round(im.width*scale),round(im.height*scale)),Image.Resampling.LANCZOS)
canvas=Image.new('RGBA',(1024,1024));canvas.alpha_composite(im,((1024-im.width)//2,1024-im.height))
out=APP/'design/thumbnail';out.mkdir(exist_ok=True);canvas.save(out/(name+'-FG.png'),optimize=True)
print(out/(name+'-FG.png'))
