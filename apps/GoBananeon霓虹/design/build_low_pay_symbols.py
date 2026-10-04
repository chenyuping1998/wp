"""Composite the original low-pay letter silhouettes onto the generated neon tier frame."""
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw
ROOT=Path(__file__).resolve().parent.parent
base=Image.open(ROOT/'design/source/neon_delivery/symbols/low_pay_blank.png').convert('RGBA').resize((1024,1024),Image.Resampling.LANCZOS)
# Image generation left isolated blue specks above the actual rim.
alpha=base.getchannel('A')
ImageDraw.Draw(alpha).rectangle((0,0,1024,48),fill=0)
base.putalpha(alpha)
for n in range(1,6):
    original=Image.open(ROOT/f'design/source/low_pay_original/l{n}.png').convert('RGB')
    a=np.asarray(original).astype(np.float32)
    luminance=a[:,:,:3].mean(axis=2)
    mask=np.clip((150-luminance)*255/85,0,255).astype('uint8')
    # Only sample the large letter; omit the old silver frame completely.
    mask[:220,:]=0;mask[780:,:]=0;mask[:,:210]=0;mask[:,810:]=0
    letter=Image.fromarray(mask,'L')
    out=base.copy()
    shadow=Image.new('RGBA',out.size,(0,0,0,0))
    shadow.paste((8,10,34,255),(9,11,1033,1035),letter)
    out.alpha_composite(shadow)
    fill=Image.new('RGBA',out.size,(196,200,231,255))
    out.paste(fill,(0,0),letter)
    for directory in [ROOT/'design/source/neon_delivery/symbols',ROOT/'static/assets/sprites/goBananasSymbolsV3']:
        out.save(directory/f'l{n}.png')
print('Built five muted neon low-pay tiles from the original letter silhouettes')

# The empty/cross symbol uses the same low-tier frame, with no hidden old letter.
cross=base.copy()
draw=ImageDraw.Draw(cross)
for a,b in [((349,349),(675,675)),((675,349),(349,675))]:
    draw.line([a,b],fill=(14,17,45,255),width=70)
for a,b in [((344,344),(670,670)),((670,344),(344,670))]:
    draw.line([a,b],fill=(158,201,224,255),width=48)
for directory in [ROOT/'design/source/neon_delivery/symbols',ROOT/'static/assets/sprites/goBananasSymbolsV3']:
    cross.save(directory/'x.png')
