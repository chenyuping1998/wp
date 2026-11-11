from pathlib import Path
from PIL import Image,ImageDraw
import json
P=Path(__file__).resolve().parent
names=['board_frame','board_frame_fg','cell_card','logo','logo_small','bar_plate','intro_card']
canvas=Image.new('RGB',(1200,7*270),'#808080');draw=ImageDraw.Draw(canvas)
report={}
for i,name in enumerate(names):
 im=Image.open(P/(name+'.png')).convert('RGBA')
 report[name]={'size':im.size,'alpha_range':im.getchannel('A').getextrema()}
 assert im.getchannel('A').getextrema()==(0,255),name
 for col,bg in enumerate(['#e9e8e0','#15191f']):
  area=Image.new('RGBA',(600,270),bg);thumb=im.copy();thumb.thumbnail((560,220));area.alpha_composite(thumb,((600-thumb.width)//2,32+(220-thumb.height)//2));canvas.paste(area.convert('RGB'),(col*600,i*270))
 draw.text((8,i*270+8),name,fill='#111111');draw.text((608,i*270+8),name,fill='#eeeeea')
for name in names[:2]:
 im=Image.open(P/(name+'.png'));assert im.crop((120,170,1520,1290)).getchannel('A').getbbox() is None
assert Image.open(P/'board_frame.png').getchannel('A').tobytes()==Image.open(P/'board_frame_fg.png').getchannel('A').tobytes()
assert Image.open(P/'cell_card.png').getpixel((140,140))[3]==255
canvas.save(P/'contact-light-dark.jpg',quality=95)
logo=Image.new('RGB',(440,170),'#15191f')
for i,name in enumerate(['logo','logo_small']):
 im=Image.open(P/(name+'.png')).convert('RGBA');im.thumbnail((200,150));logo.paste(im,(i*220,(170-im.height)//2),im)
logo.save(P/'logo-200px.jpg',quality=98)
(P/'verification.json').write_text(json.dumps({'checks':'PASS: sizes, alpha, exact aperture, identical MG/FG alpha, opaque card center','assets':report},indent=2)+'\n')
print('PASS: seven PNGs, real alpha, identical frame geometry, exact transparent aperture, opaque cell center')
