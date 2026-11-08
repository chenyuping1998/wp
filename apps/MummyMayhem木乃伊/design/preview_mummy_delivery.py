"""Offline art/layout QA composites; explicitly not browser/runtime screenshots."""
from pathlib import Path
import json,math,re
import numpy as np
from PIL import Image,ImageDraw,ImageFont
ROOT=Path(__file__).resolve().parent;APP=ROOT.parent;D=ROOT/'source/mummy_delivery';S=APP/'static/assets/sprites';OUT=ROOT/'preview_mummy_20261107';OUT.mkdir(exist_ok=True)
FONT=APP/'static/fonts/LilitaOne.ttf'
def img(folder,name):
 p=S/folder/(name+'.png')
 if not p.exists():p=p.with_suffix('.webp')
 return Image.open(p).convert('RGBA')
def stamp(dst,src,box):
 x,y,w,h=map(round,box);a=src.resize((w,h),Image.Resampling.LANCZOS);dst.alpha_composite(a,(x,y))
def label(a,text,xy,size=25,fill='#f2e8d0',anchor='mm'):
 ImageDraw.Draw(a).text(xy,text,font=ImageFont.truetype(str(FONT),size),fill=fill,stroke_width=2,stroke_fill='#10303a',anchor=anchor)
# Frame fitting belongs to the asset build. QA only reads the completed texture.
refit=img('mummyFrame','frame_edge')
columns=[['H3','L5','L4','H1','L3'],['H3','H4','L2','L1','L5'],['H1','L4','L1','L3','H2'],['L2','H2','L3','H3','L1'],['L5','L1','H4','H1','L2']]
for mode,name in [('base','bg_base'),('feature','bg_feature'),('hold','bg_holdandspin')]:
 a=img('mummyBackground',name).resize((1920,1080));board=670;cx,cy=960,445;fr=board*1.28
 stamp(a,img('mummyFrame','frame_bg'),(cx-fr/2,cy-fr/2,fr,fr))
 for c in range(5):
  for r in range(5):stamp(a,img('mummySymbols','p' if mode=='hold' and (c+r)%3 else 'x' if mode=='hold' else columns[c][r].lower()),(cx-board/2+c*board/5,cy-board/2+r*board/5,board/5,board/5))
 stamp(a,refit,(cx-fr/2,cy-fr/2,fr,fr))
 cat=Image.open(D/'mascot/assembled.png').convert('RGBA');cat=cat.crop(cat.getchannel('A').getbbox());scale=740/cat.height
 stamp(a,cat,(1450,130,cat.width*scale,740))
 label(a,'MUMMY MAYHEM',(960,970),55)
 label(a,'OFFLINE ART COMPOSITE - NOT A RUNTIME SCREENSHOT',(960,1030),21)
 a.save(OUT/(mode+'_art_composite.png'))
# Four exact, identically aligned wheel faces with runtime text examples.
wheel=Image.new('RGBA',(1600,1100),'#102b36')
values={1:['UP',2,4,6,8,10,30,10,8,6,4,2],2:['UP',10,20,30,40,50,90,50,40,30,20,10],3:['UP',20,40,60,80,100,200,100,80,60,40,20],4:[2000,200,300,500,800,1000,3000,1000,800,500,300,200]}
for lv in range(1,5):
 cx=400+(lv-1)%2*800;cy=290+(lv-1)//2*540;r=205
 stamp(wheel,img('mummyWheel','disc_lv'+str(lv)),(cx-r,cy-r,r*2,r*2));stamp(wheel,img('mummyWheel','ring'),(cx-r*1.175,cy-r*1.175,r*2.35,r*2.35))
 for i,v in enumerate(values[lv]):
  ang=-math.pi/2+i*math.pi/6;label(wheel,str(v), (cx+math.cos(ang)*r*.74,cy+math.sin(ang)*r*.74),24)
 stamp(wheel,img('mummyWheel','hub'),(cx-35,cy-35,70,70));label(wheel,f'SUN WHEEL - LEVEL {lv}',(cx,cy-260),30)
wheel.save(OUT/'sun_four_levels.png')
src=(APP/'src/game/assets.ts').read_text(encoding='utf-8')
for name in ['H1','H2','H3','H4','W','S','L1','L2','L3','L4','L5']:
 key='gb'+name[0]+name[1:].lower()
 for suffix in ['', 'Glow','Sheen']:assert re.search(r'\b'+key+suffix+r'\s*:',src),f'missing runtime layer {key+suffix}'
manifest=[]
for p in D.rglob('*.png'):
 if 'originals' in p.parts or 'mascot_built' in p.parts:continue
 im=Image.open(p);manifest.append(dict(file=str(p.relative_to(D)),size=im.size,mode=im.mode))
(D/'DELIVERY_MANIFEST.json').write_text(json.dumps(manifest,indent=2));print('QA composites',OUT,'- deliverable PNGs',len(manifest))
