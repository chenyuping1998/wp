"""Render a local visual QA sheet with runtime text and the existing decor layers."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
P = ROOT / 'static/assets/sprites/sushiV8'
FONT = ROOT / 'static/fonts/sushi/Bungee-Regular.ttf'
NUMBER = ROOT / 'static/fonts/sushi/Anton-Regular.ttf'
sheet = Image.new('RGB', (1500, 1650), '#d7d1c7')
for i,(key,title) in enumerate((('big','BIG WIN'),('super','SUPER WIN'),('mega','MEGA WIN'),('epic','EPIC WIN'),('max','MAX WIN'))):
    im = Image.open(P/f'win_{key}.png').convert('RGBA')
    decor = P/f'win_{key}_decor.png'
    if decor.exists(): im.alpha_composite(Image.open(decor).convert('RGBA'))
    d=ImageDraw.Draw(im)
    d.text((500,179),title,font=ImageFont.truetype(str(FONT),83),anchor='mm',fill='#fff5e7',stroke_width=3,stroke_fill='#222639')
    d.text((560,386),'$ 123.45',font=ImageFont.truetype(str(NUMBER),105),anchor='mm',fill='#222639')
    x=(i%2)*750+20;y=(i//2)*380+14
    out=im.resize((700,392),Image.Resampling.LANCZOS)
    sheet.paste(out,(x,y),out)
for j,key in enumerate(('fg_intro','fg_total')):
    im=Image.open(P/f'{key}.png').convert('RGBA')
    decor=P/f'{key}_decor.png'
    if decor.exists(): im.alpha_composite(Image.open(decor).convert('RGBA'))
    d=ImageDraw.Draw(im)
    d.text((800,390),'FREE SPINS' if j==0 else 'TOTAL WIN',font=ImageFont.truetype(str(FONT),112),anchor='mm',fill='#222639')
    d.text((800,605),'10' if j==0 else '$ 123.45',font=ImageFont.truetype(str(NUMBER),210),anchor='mm',fill='#222639')
    if j==0:d.text((800,800),'AWARDED',font=ImageFont.truetype(str(FONT),58),anchor='mm',fill='#222639')
    out=im.resize((700,438),Image.Resampling.LANCZOS)
    sheet.paste(out,(j*750+20,1200),out)
sheet.save(ROOT/'design/pocha_comic_runtime_review.png')
