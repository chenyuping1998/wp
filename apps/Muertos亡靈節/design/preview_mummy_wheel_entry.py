"""Offline composition of the actual wheel textures and cat-face start cue."""
from pathlib import Path
import re,math
from PIL import Image,ImageDraw,ImageFont
ROOT=Path(__file__).resolve().parent;APP=ROOT.parent;OUT=ROOT/'preview_mummy_20261107/seven_fixes'
source=(APP/'src/game/assets.ts').read_text(encoding='utf-8-sig')
def asset(key):
 p=re.search(r'\b'+key+r':\s*\{[^}]*?new URL\([\'\"]([^\'\"]+)',source,re.S).group(1)
 return Image.open(APP/'static'/re.sub(r'^(\.\./)+','',p)).convert('RGBA')
a=Image.new('RGBA',(900,740),'#102c34');draw=ImageDraw.Draw(a)
FONT=APP/'static/fonts/LilitaOne.ttf'
def text(s,x,y,size,fill='#fff3c4'):
 draw.text((x,y),s,font=ImageFont.truetype(str(FONT),round(size)),fill=fill,anchor='mm',stroke_width=max(2,round(size*.09)),stroke_fill='#241b0f')
def stamp(im,x,y,w,h,anchor=(.5,.5),angle=0):
 im=im.resize((round(w),round(h)),Image.Resampling.LANCZOS)
 if angle:im=im.rotate(-angle,Image.Resampling.BICUBIC,expand=True)
 a.alpha_composite(im,(round(x-im.width*anchor[0]),round(y-im.height*anchor[1])))
W=650;cx=450;cy=545;ro=.4*W;ri=.275*W;rp=.2*W
text('OFFLINE WHEEL MATERIAL PREVIEW',450,38,24)
stamp(asset('mummyArch'),cx,cy,ro*2.16,ro*1.16,(.5,1))
tiles=[]
for i,v in enumerate([2,12,4,32,6,16,8]):
 angle=math.pi/2-(i-3)*math.pi/7;r=(ri+ro)/2;x=cx+math.cos(angle)*r;y=cy-math.sin(angle)*r
 stamp(asset('mummyTileTop' if v>=32 else 'mummyTileHot' if v>=12 else 'mummyTile'),x,y,W*.22,W*.15,angle=math.degrees(math.pi/2-angle));tiles.append((v,x,y))
stamp(asset('mummyPlate'),cx,cy,rp*2.12,rp*2.12)
stamp(asset('mummyButton'),cx,cy-ro-W*.02,W*.19,W*.19)
stamp(asset('mummyWheelCat'),cx,cy-ro-W*.022,W*.135,W*.135)
for v,x,y in tiles:text(f'{v}X',x,y,W*.05)
text('1X',cx,cy-rp*.07-10,W*.095,'#ffd76a')
text('CLICK TO SPIN',cx,cy-ro-W*.02-W*.135,W*.03,'#ffe5a5')
text('TURBO: 2.90s SPIN + 0.34s SETTLE',450,702,19,'#d5c18d')
a.convert('RGB').save(OUT/'wheel_entry.png');print('Wheel material preview saved')
