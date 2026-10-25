"""Register generated animation parts; preserve source atlases and head edits."""
from pathlib import Path
from PIL import Image,ImageChops
import json
ROOT=Path(__file__).resolve().parents[1];SRC=ROOT/'design/source/treasure';OUT=ROOT/'static/assets/treasure'
for who in ['digger','lifeguard']:
 original=Image.open(OUT/f'{who}_head.png').convert('RGBA')
 blink=Image.open(SRC/f'{who}_blink.png').convert('RGBA')
 box=blink.getchannel('A').point(lambda a:255 if a>24 else 0).getbbox()
 blink=blink.crop(box).resize(original.size,Image.Resampling.LANCZOS)
 blink.save(OUT/f'{who}_blink.png')
for source,names in [('chest_parts_v2',['chest_body','chest_lid']),('castle_parts_v2',['castle_body','castle_flag'])]:
 im=Image.open(SRC/f'{source}.png').convert('RGBA');w=im.width//2
 cells=[im.crop((i*w+4,0,(i+1)*w-4,im.height)).resize((512,512),Image.Resampling.LANCZOS) for i in range(2)]
 for cell in cells:cell.putalpha(cell.getchannel('A').point(lambda a:0 if a<72 else a))
 # The generated flag pole is registered 10% left of the central tower.
 if source=='castle_parts_v2':
  moved=Image.new('RGBA',(512,512));moved.alpha_composite(cells[1],(49,3));cells[1]=moved
 # Keep relative placement, normalise the assembled union as one object.
 union=ImageChops.lighter(cells[0].getchannel('A'),cells[1].getchannel('A'))
 box=union.point(lambda a:255 if a>24 else 0).getbbox();bw,bh=box[2]-box[0],box[3]-box[1]
 gain=min(430/bw,430/bh);size=(round(bw*gain),round(bh*gain));offset=((512-size[0])//2,(512-size[1])//2)
 prepared=[]
 for name,cell in zip(names,cells):
  canvas=Image.new('RGBA',(512,512));canvas.alpha_composite(cell.crop(box).resize(size,Image.Resampling.LANCZOS),offset);canvas.save(OUT/f'{name}.png');prepared.append(canvas)
 flat=Image.new('RGBA',(512,512))
 # Closed lid covers the opening; flag sits behind castle battlements.
 for layer in (prepared if source=='chest_parts_v2' else prepared[::-1]):flat.alpha_composite(layer)
 flat.save(OUT/('h1.png' if source=='chest_parts_v2' else 'h2.png'))
sheet=Image.new('RGB',(800,390),(255,243,210))
for i,name in enumerate(['h1','h2','h3','h4','h5','w','s','sw','l1','l2','l3','l4']):
 tile=Image.open(OUT/f'{name}.png').convert('RGBA').resize((128,128),Image.Resampling.LANCZOS);sheet.paste(tile,((i%6)*133,(i//6)*180),tile)
sheet.save(SRC/'runtime_contact_sheet.jpg')
print('Exported two registered blink heads and four aligned moving symbol parts; idle flats share the exact part composition.')
