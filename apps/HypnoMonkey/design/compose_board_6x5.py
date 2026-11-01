"""Deterministic 6-reel / 5-row review from separated existing raster sources."""
from pathlib import Path
from collections import Counter
from PIL import Image, ImageDraw, ImageFont, ImageOps, ImageFilter
import hashlib,json,shutil
R=Path(__file__).resolve().parent;O=R/'board_preview_v5_6x5';O.mkdir(exist_ok=True);(O/'symbols').mkdir(exist_ok=True)
source=Image.open(R/'board_preview_v4_5x6/HypnoMonkey-overall-5x6.png').convert('RGBA')
bgpath=R/'board_preview_v4_5x6/background-clean.png';mgpath=R/'cast_mg/assembled.png'
# Only existing symbol cells are extracted. Excludes every grid rule and cast pixel.
boxes={'H1':(702,255,846,356),'H2':(253,141,389,249),'H3':(399,254,544,356),'H4':(553,141,692,248),'H5':(854,141,1001,248),'L1':(398,141,544,248),'L2':(551,253,694,356),'L3':(700,141,846,248),'L4':(252,254,390,356),'S':(554,365,693,467)}
symbols={}
for name,box in boxes.items():
 im=source.crop(box)
 from collections import deque
 original=list(im.getdata());w,h=im.size
 def ispaper(index):
  red,green,blue,a=original[index]
  return red>85 and green>75 and blue>60 and max(red,green,blue)-min(red,green,blue)<48 and abs(red-green)<30
 # Flood only the surrounding paper, preserving enclosed cream/white highlights.
 background=set();queue=deque(i for i in range(w*h) if (i<w or i>=w*(h-1) or i%w in [0,w-1]) and ispaper(i))
 while queue:
  i=queue.popleft()
  if i in background:continue
  background.add(i);x=i%w;y=i//w
  for j in ([i-1] if x else [])+([i+1] if x<w-1 else [])+([i-w] if y else [])+([i+w] if y<h-1 else []):
   if j not in background and ispaper(j):queue.append(j)
 pixels=[(red,green,blue,0 if i in background or (name=='H5' and 85<red<220 and max(red,green,blue)-min(red,green,blue)<70 and abs(red-green)<35) else a) for i,(red,green,blue,a) in enumerate(original)]
 im.putdata(pixels)
 # Keep the largest connected illustration, excluding all grid/frame splinters.
 solid={i for i,p in enumerate(pixels) if p[3]};regions=[]
 while solid:
  queue=deque([solid.pop()]);region=set(queue)
  while queue:
   i=queue.popleft();x=i%w;y=i//w
   for j in ([i-1] if x else [])+([i+1] if x<w-1 else [])+([i-w] if y else [])+([i+w] if y<h-1 else []):
    if j in solid:solid.remove(j);region.add(j);queue.append(j)
  regions.append(region)
 keep=max(regions,key=len);im.putdata([(r,g,b,a if i in keep else 0) for i,(r,g,b,a) in enumerate(pixels)])
 im=im.crop(im.getbbox());im.save(O/'symbols'/f'{name}.png');symbols[name]=im
W,H=1920,1080
background=ImageOps.fit(Image.open(bgpath).convert('RGBA'),(W,H));background.save(O/'background.png')
board=[['H2','L1','H4','L3','H5','L2'],['L4','H3','L2','H1','L1','H5'],['H1','L3','S','L4','H2','L3'],['L2','H5','L1','H3','L4','H4'],['H4','L4','H2','L2','S','L1']]
assert len(board)==5 and all(len(row)==6 for row in board)
assert set(sum(board,[]))==set(boxes)
INK='#2b1b16';PAPER='#f2e3bd';GRAY='#b8b1a4';RED='#8c2929';GOLD='#c69b59'
fontpath=R.parent/'static/fonts/TitanOne.ttf'
def font(size):return ImageFont.truetype(str(fontpath),size)
def text(layer,xy,label,size,fill=PAPER):
 d=ImageDraw.Draw(layer);f=font(size);b=d.textbbox((0,0),label,font=f)
 d.text((xy[0]-(b[0]+b[2])/2,xy[1]-(b[1]+b[3])/2),label,font=f,fill=fill)
def empty():return Image.new('RGBA',(W,H))
frame=empty();d=ImageDraw.Draw(frame);BX,BY,C=334,218,144;BW,BH=C*6,C*5
# Retained painted wood frame and its title; no source character or scene area.
# Rebuild rails from clean uninterrupted wood, excluding the old hanging
# watch and any cast pixels near the original right rail.
wood=source.crop((174,420,218,750)).resize((80,850))
frame.alpha_composite(wood,(254,100));frame.alpha_composite(wood,(1198,100))
for x in [254,1198]:
 d.ellipse((x+16,45,x+64,94),fill=GOLD,outline=INK,width=4)
 d.rounded_rectangle((x-5,82,x+85,127),radius=9,fill='#95622e',outline=INK,width=5)
 d.rounded_rectangle((x-6,907,x+86,953),radius=6,fill='#95622e',outline=INK,width=5)
title=source.crop((244,0,1005,136)).resize((864,154))
title.putdata([(r,g,b,0 if b>r*1.08 and g>r else a) for r,g,b,a in title.getdata()])
frame.alpha_composite(title,(334,58))
d.rectangle((BX-9,BY-9,BX+BW+8,BY+BH+8),fill=INK)
for row in range(5):
 for col in range(6):
  x=BX+C*col;y=BY+C*row;d.rectangle((x+2,y+2,x+C-2,y+C-2),fill=GRAY)
bottom=source.crop((244,803,1006,840)).resize((864,32));frame.alpha_composite(bottom,(334,938))
frame.save(O/'frame-and-board.png')
icons=empty()
for row,line in enumerate(board):
 for col,name in enumerate(line):
  im=ImageOps.contain(symbols[name],(126,126),Image.Resampling.LANCZOS)
  icons.alpha_composite(im,(BX+col*C+(C-im.width)//2,BY+row*C+(C-im.height)//2))
icons.save(O/'board-symbols.png')
cast=empty();mg=Image.open(mgpath).convert('RGBA');mg=mg.crop(mg.getbbox());mg=ImageOps.contain(mg,(548,815),Image.Resampling.LANCZOS);cast.alpha_composite(mg,(1300+(548-mg.width)//2,966-mg.height));cast.save(O/'character.png')
ui=empty();d=ImageDraw.Draw(ui)
d.rounded_rectangle((0,981,1919,1079),radius=15,fill='#201e1b',outline=GOLD,width=4)
for x,title,value in [(430,'BALANCE','1,000.00'),(780,'BET','1.00'),(1110,'WIN','0.00')]:
 text(ui,(x,1003),title,17);text(ui,(x,1040),value,29)
d.ellipse((1700,934,1838,1072),fill=PAPER,outline=INK,width=7);d.arc((1730,964,1810,1044),20,310,fill=INK,width=12);d.polygon([(1809,968),(1809,995),(1783,980)],fill=INK)
d.rounded_rectangle((25,440,221,562),radius=14,fill=RED,outline=INK,width=5);text(ui,(123,475),'FREE SPINS',20);text(ui,(123,523),'100x',29)
watchpath=R.parent/'static/assets/sprites/hypnoWatches/watch-bronze.png'
if watchpath.exists():
 watch=Image.open(watchpath).convert('RGBA').resize((210,210),Image.Resampling.LANCZOS);ui.alpha_composite(watch,(18,217));text(ui,(123,217+210*300/512),'x2',31,INK)
ui.save(O/'ui.png')
full=background.copy()
for layer in [frame,icons,cast,ui]:full.alpha_composite(layer)
full.convert('RGB').save(O/'HypnoMonkey-overall-6x5.jpg',quality=96);full.save(O/'HypnoMonkey-overall-6x5.png')
# Full symbol review beside the current separated cast, no old portraits.
sheet=Image.new('RGBA',(1600,740),PAPER)
for i,(name,im) in enumerate(symbols.items()):
 x=i%5*320;y=i//5*350;dd=ImageDraw.Draw(sheet);dd.rounded_rectangle((x+12,y+18,x+308,y+302),radius=10,fill=GRAY,outline=INK,width=3)
 im=ImageOps.contain(im,(245,245),Image.Resampling.LANCZOS);sheet.alpha_composite(im,(x+(320-im.width)//2,y+36+(245-im.height)//2));text(sheet,(x+160,y+326),name,23,INK)
sheet.convert('RGB').save(O/'all-symbols.jpg',quality=96)
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
shutil.copyfile(mgpath,O/'source-character.png')
manifest={'status':'separated-assets-concept-not-runtime-not-user-approved','columns':6,'rows':5,'cells':30,'board':board,'symbolCounts':dict(Counter(sum(board,[]))),'sourceSymbolBoxes':boxes,'sources':{str(p.relative_to(R)):sha(p) for p in [bgpath,mgpath,R/'board_preview_v4_5x6/HypnoMonkey-overall-5x6.png']},'compositionLayers':['background.png','frame-and-board.png','board-symbols.png','character.png','ui.png'],'note':'Actual deterministic composition of independent layers; current registered MG source. Existing symbols retained from v4 concept, not final runtime art. No package/platform update.'}
if (R/'watch_art/manifest.json').exists():manifest['sources']['watch_art/manifest.json']=sha(R/'watch_art/manifest.json')
(O/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
print(O/'HypnoMonkey-overall-6x5.png')
