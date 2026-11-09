"""Authored stencil strokes and stamped control plates, from native geometry.
No raster retouching, random texture or artificial colour-count padding.
The original symbol silhouettes and stroke registration are preserved.
"""
from pathlib import Path
import math, shutil
from PIL import Image, ImageDraw
APP=Path(__file__).resolve().parent.parent
OUT=APP/'static/assets/sprites'
BACK=APP/'design/qa/review_fix_20261103/before-assets'
BACK.mkdir(parents=True,exist_ok=True)
S=3

def keep(path):
 p=BACK/path.parent.name/path.name;p.parent.mkdir(parents=True,exist_ok=True)
 if not p.exists():shutil.copy2(path,p)

def glyph(name):
 im=Image.new('RGBA',(512*S,512*S));d=ImageDraw.Draw(im)
 def stroke(points,width=25,closed=False):
  pts=points+[points[0]] if closed else points
  def line(dx,dy,w,color):d.line([((x+dx)*S,(y+dy)*S) for x,y in pts],fill=color,width=w*S,joint='curve')
  # Dark registration edge, underprinted warm steel, then the lighter face.
  line(2,3,width+8,'#17191c');line(0,0,width,'#777b7b');line(-1,-2,width-6,'#acaaa2')
  # Broken chisel highlights belong to the top-facing edges of each stroke.
  for i,((x,y),(xx,yy)) in enumerate(zip(pts,pts[1:])):
   if i%3==2:continue
   a=.12;b=.48 if i%2 else .76
   d.line([((x+(xx-x)*a-2)*S,(y+(yy-y)*a-3)*S),((x+(xx-x)*b-2)*S,(y+(yy-y)*b-3)*S)],fill='#c2beb2',width=3*S)
 def oval(box,width=20):
  x0,y0,x1,y1=box
  pts=[((x0+x1)/2+(x1-x0)/2*math.cos(i*math.tau/72),(y0+y1)/2+(y1-y0)/2*math.sin(i*math.tau/72)) for i in range(73)]
  stroke(pts,width)
 if name=='l1':
  stroke([(105,350),(80,180),(190,240),(256,135),(320,240),(432,180),(407,350),(105,350)])
  stroke([(125,390),(390,390)],21)
 elif name=='l2':
  stroke([(154,326),(113,291),(104,205),(139,135),(209,109),(304,109),(375,145),(408,217),(397,291),(356,326),(356,380),(310,402),(208,402),(154,380),(154,326)],24)
  oval((154,196,226,270));oval((286,196,358,270));stroke([(240,309),(256,285),(274,309)],18)
  stroke([(232,361),(232,399)],17);stroke([(282,361),(282,399)],17)
 elif name=='l3':
  pts=[]
  for i in range(10):
   a=-math.pi/2+i*math.pi/5;r=174 if i%2==0 else 79;pts.append((256+math.cos(a)*r,260+math.sin(a)*r))
  stroke(pts,25,True)
 else:stroke([(294,100),(130,280),(242,280),(203,419),(386,224),(276,224),(294,100)],26)
 return im.resize((512,512),Image.Resampling.LANCZOS)

def plate(n,active=False):
 spin=n=='spin_plate';size=336 if spin else 300
 im=Image.new('RGBA',(size*S,size*S));d=ImageDraw.Draw(im)
 cx=size/2;cy=170 if spin else (136 if n=='drawer_plate' else 150);r=158 if spin else (132 if n=='drawer_plate' else 140)
 def disc(rad,color,dy=0):d.ellipse(((cx-rad)*S,(cy-rad+dy)*S,(cx+rad)*S,(cy+rad+dy)*S),fill=color)
 disc(r,'#17191c');disc(r-4,'#b4aca0');disc(r-11,'#55585d');disc(r-17,'#17191c');disc(r-22,'#b66a30' if active or spin else '#747571');disc(r-29,'#17191c');disc(r-34,'#9c5a22' if active else '#2b2e33')
 # Two rim-lit arcs, recessed lower edge and four engraved fastener slots.
 for start,end,col in [(202,285,'#e0d6be'),(20,102,'#707575')]:
  rr=r-7;d.arc(((cx-rr)*S,(cy-rr)*S,(cx+rr)*S,(cy+rr)*S),start,end,fill=col,width=3*S)
 for a in [45,135,225,315]:
  x=cx+(r-22)*math.cos(math.radians(a));y=cy+(r-22)*math.sin(math.radians(a))
  d.line(((x-3)*S,(y+3)*S,(x+3)*S,(y-3)*S),fill='#17191c',width=2*S)
 return im.resize((size,size),Image.Resampling.LANCZOS)

if __name__=='__main__':
 for n in ['l1','l2','l3','l4']:
  p=OUT/'turfSymbols'/f'{n}.png';keep(p);glyph(n).save(p,optimize=True)
 for n in ['button_plate','button_plate_active','spin_plate','drawer_plate']:
  p=OUT/'turfUi'/f'{n}.png';keep(p);plate(n,n.endswith('active')).save(p,optimize=True)
 print('Installed four registered stencil glyphs + four native stamped plates; originals retained.')
