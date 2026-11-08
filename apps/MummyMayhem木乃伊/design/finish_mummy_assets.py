from pathlib import Path
import json,re,copy,urllib.request
import numpy as np
from PIL import Image,ImageDraw,ImageFont,ImageFilter,ImageOps

ROOT=Path(__file__).resolve().parent;APP=ROOT.parent;D=ROOT/'source/mummy_delivery';S=APP/'static/assets/sprites';UI=S/'mummyUi';UI.mkdir(exist_ok=True)
fontdir=APP/'static/fonts'
for filename,url in [('LilitaOne.ttf','https://raw.githubusercontent.com/google/fonts/main/ofl/lilitaone/LilitaOne-Regular.ttf'),('LilitaOne-OFL.txt','https://raw.githubusercontent.com/google/fonts/main/ofl/lilitaone/OFL.txt')]:
 if not (fontdir/filename).exists():(fontdir/filename).write_bytes(urllib.request.urlopen(url).read())
for p in [APP/'src/game/fonts.ts',APP/'src/app.html']:
 s=p.read_text(encoding='utf-8').replace('Titan One','Lilita One').replace('TitanOne.ttf','LilitaOne.ttf').replace('TitanOne-OFL','LilitaOne-OFL');p.write_text(s,encoding='utf-8')
def im(cat,name):return Image.open(D/cat/(name+'.png')).convert('RGBA')
def save(a,cat,name,runtime=None):
 p=D/cat/(name+'.png');p.parent.mkdir(exist_ok=True);a.save(p)
 if runtime:a.save(S/runtime/(name+'.png'))
def place(dst,src,box):
 x,y,w,h=box;src=src.copy();src.thumbnail((w,h),Image.Resampling.LANCZOS);dst.alpha_composite(src,(x+(w-src.width)//2,y+(h-src.height)//2))
def text_asset(text,w,h):
 a=Image.new('RGBA',(w,h));slab=im('frame','fs_counter_panel').resize((w,h));a.alpha_composite(slab)
 draw=ImageDraw.Draw(a);font=ImageFont.truetype(str(fontdir/'LilitaOne.ttf'),int(h*.43));bb=draw.textbbox((0,0),text,font=font,stroke_width=3)
 draw.text(((w-(bb[2]-bb[0]))/2,(h-(bb[3]-bb[1]))/2-bb[1]),text,font=font,fill='#f2e8d0',stroke_width=3,stroke_fill='#10303a');return a
for name,text,w,h in [('title','SUN WHEEL',1200,300),('levelup','LEVEL UP!',1000,420)]:save(text_asset(text,w,h),'sun_wheel',name,'mummyWheel')
for level,color in enumerate(['#2ec4b6','#2457a6','#c8443a','#6a2c9e'],1):
 glow=Image.new('RGBA',(1400,1400),color);mask=im('sun_wheel','ring').getchannel('A').filter(ImageFilter.GaussianBlur(24));glow.putalpha(mask);save(glow,'sun_wheel','ring_glow_lv'+str(level),'mummyWheel')
g=im('fx','fx_glow');save(g.resize((640,640)),'sun_wheel','wedge_win','mummyWheel')
rays=Image.new('RGBA',(1920,1080));yy,xx=np.mgrid[0:1080,0:1920];angle=np.arctan2(yy-540,xx-960);rad=np.hypot(xx-960,yy-540)
rgba=np.full((1080,1920,4),255,dtype='uint8');rgba[:,:,3]=((.5+.5*np.cos(angle*16))**6*np.exp(-rad/700)*65).astype('uint8');save(Image.fromarray(rgba),'sun_wheel','rays','mummyWheel')
for kind,bg,hero in [('bonus','bg_feature','button'),('holdandspin','bg_holdandspin','p'),('scarab','bg_feature','button'),('sun','bg_base','hub')]:
 a=im('backgrounds',bg).resize((800,450));obj=im('scarab_wheel',hero) if hero=='button' else im('symbols','p') if hero=='p' else im('sun_wheel','hub')
 if kind in ['bonus','scarab']:
  place(a,im('scarab_wheel','arch_base'),(110,100,580,330));place(a,obj,(290,15,220,220))
 elif kind=='sun':
  place(a,im('sun_wheel','disc_lv1'),(190,20,420,420));place(a,im('sun_wheel','ring'),(155,-5,490,490));place(a,obj,(335,155,130,130))
 else:
  for i in range(5):place(a,obj,(90+i*120,110+(i%2)*60,220,220))
 save(a,'ui','buy_art_'+kind,'mummyUi');save(obj.resize((512,512)),'ui','buy_hero_'+kind,'mummyUi')
for name,base in [('scarab5','bonus'),('scarab10','bonus'),('sun','sun')]:
 a=Image.new('RGBA',(512,512));obj=im('ui','buy_hero_'+base)
 if name=='scarab10':place(a,obj,(0,80,330,330));place(a,obj,(180,180,330,330))
 else:place(a,obj,(0,0,512,512))
 save(a,'ui','buy_hero_'+name,'mummyUi')
for name in ['buybonus_stone','buybonus_stone_lit','buybonus_plate','ticker_plate']:
 size=(652,146) if name=='ticker_plate' else (800,800)
 save(im('frame','fs_counter_panel').resize(size),'ui',name,'mummyUi')
# Solid black monochrome buy icon is intentionally a native UI drawing.
icon=Image.new('RGBA',(512,512));dr=ImageDraw.Draw(icon);dr.polygon([(60,420),(256,85),(452,420)],fill='black');dr.polygon([(256,175),(151,390),(256,390)],fill=(0,0,0,0));save(icon,'ui','buy_icon','mummyUi')

import runpy
runpy.run_path(str(ROOT/"build_mummy_expressions.py"),run_name="__main__")
