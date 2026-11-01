"""Mechanical runtime sizing of approved native generated assets; no recoloring."""
from pathlib import Path
from PIL import Image
APP=Path(__file__).resolve().parents[1]
SRC=APP/'design/source/symbols'
DEST=APP/'static/assets/sprites/sushiSymbols'
for name in ('h1','h2','h3','h4','w','s','p'):
    im=Image.open(SRC/f'{name}.png').convert('RGBA')
    box=im.getchannel('A').getbbox()
    if not box: raise ValueError(f'Empty symbol {name}')
    im=im.crop(box)
    im.thumbnail((460,460),Image.Resampling.LANCZOS)
    out=Image.new('RGBA',(512,512))
    out.alpha_composite(im,((512-im.width)//2,(512-im.height)//2))
    out.save(DEST/f'{name}.png',optimize=True)
    print(name,box,'->',im.size)
