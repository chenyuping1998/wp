"""Runtime lettering: local type -> dry-ink / engraved / stamp / dot glyphs.
No generated image contains lettering. Deterministic ink masks, separate glyphs.
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import json, math, random
APP=Path(__file__).resolve().parents[1]; OUT=APP/'static/assets/sprites/sushiV8';OUT.mkdir(exist_ok=True)
FONT=APP/'static/fonts/sushi/Bungee-Regular.ttf'
chars='0123456789.,×$+/'
meta={}
for role in ['count','fs','plate','receipt']:
 meta[role]={}
 font=ImageFont.truetype(str(FONT if role!='receipt' else '/System/Library/Fonts/SFNSMono.ttf'),210)
 for i,ch in enumerate(chars):
  box=font.getbbox(ch); w=max(40,box[2]-box[0]+32)
  mask=Image.new('L',(w,256));d=ImageDraw.Draw(mask);d.text((16-box[0],(256-box[3]+box[1])//2-box[1]),ch,font=font,fill=255)
  if role!='receipt':
   warped=Image.new('L',mask.size)
   for y in range(256):warped.paste(mask.crop((0,y,w,y+1)),(round(2*math.sin(y*.045+i)),y))
   mask=warped;d=ImageDraw.Draw(mask);rng=random.Random(880+i)
   for k in range(28 if role=='count' else 12):
    x=rng.randrange(w);y=rng.randrange(256)
    if mask.getpixel((x,y))>240:d.line((x,y,x+rng.randrange(2,9),y-1),fill=0,width=1)
  else:
   # Receipt dots: a coarse readable print matrix rather than a full font fill.
   small=mask.resize((max(8,w//6),42),Image.Resampling.LANCZOS); dots=Image.new('L',mask.size);d=ImageDraw.Draw(dots)
   for y in range(42):
    for x in range(small.width):
     if small.getpixel((x,y))>80:d.ellipse((x*6,y*6,x*6+4,y*6+4),fill=255)
   mask=dots
  out=Image.new('RGBA',mask.size)
  if role=='count':out.paste('#B87B60',(5,5),mask)
  elif role=='fs':out.paste('#D3CDBD',(2,3),mask)
  out.paste('#A86E56' if role=='plate' else '#282828',(0,0),mask)
  out.save(OUT/f'digit_{role}_{i}.png',optimize=True)
  meta[role][ch]={'key':f'v8Digit{role}{i}','width':w,'advance':w-6,'height':256}
(APP/'src/game/v8Digits.json').write_text(json.dumps(meta,indent=2))
(APP/'src/game/v8Digits.ts').write_text('export default '+json.dumps(meta,indent=2)+';\n')
# Dry brush title art. Typeset first, then perforate the ink; never model text.
for name,label in [('title_free','FREE SPINS'),('title_total','TOTAL WIN')]:
 font=ImageFont.truetype(str(FONT),190);box=font.getbbox(label);mask=Image.new('L',(1600,500));d=ImageDraw.Draw(mask);d.text(((1600-(box[2]-box[0]))//2,100-box[1]),label,font=font,fill=255,stroke_width=1)
 rng=random.Random(1971);d=ImageDraw.Draw(mask)
 for k in range(180):
  x=rng.randrange(150,1450);y=rng.randrange(110,290)
  if mask.getpixel((x,y))>240:d.line((x,y,x+rng.randrange(4,18),y-2),fill=0,width=2)
 out=Image.new('RGBA',mask.size);out.paste('#B87B60',(5,6),mask);out.paste('#282828',(0,0),mask)
 if name=='title_total':
  f=ImageFont.truetype('/System/Library/Fonts/Supplemental/Arial Unicode.ttf',72);d=ImageDraw.Draw(out);d.text((800,355),'お会計',font=f,fill='#282828',anchor='mm')
 out.save(OUT/f'{name}.png',optimize=True)
# Original code-native ink seals / soy dish icons extend our established UI.
for name in ['stamp','soy_full','soy_empty']:
 im=Image.new('RGBA',(512,512));d=ImageDraw.Draw(im)
 for n in range(2):
  pts=[(256+(218-n*12+3*math.sin(i*1.7))*math.cos(i*math.pi/90),256+(218-n*12+3*math.sin(i*1.7))*math.sin(i*math.pi/90)) for i in range(181)]
  d.line(pts,fill='#282828' if name!='stamp' else '#B87B60',width=5 if name=='stamp' else 12)
 if name=='soy_full':d.ellipse((100,120,412,400),fill='#282828');d.arc((130,140,380,380),205,300,fill='#B87B60',width=14)
 im.save(OUT/f'{name}.png',optimize=True)
(OUT/'type_recipe.txt').write_text('Bungee glyph source, deterministic variable ink displacement and dry-brush perforation. Count offset terracotta, FS engraved charcoal, plate terracotta uneven stamp, receipt monospace dot matrix. Titles are typeset then ink treated. No generated lettering.\n')
print('64 glyphs, two ink titles, empty seal and soy dishes exported')
