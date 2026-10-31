"""Deterministic export of generated atlas cells and native UI plates. Original atlases remain intact."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageChops
import json
ROOT=Path(__file__).resolve().parents[1]; SRC=ROOT/'design/source/treasure'; OUT=ROOT/'static/assets/treasure'
OUT.mkdir(parents=True,exist_ok=True)
# Runtime compositing exports: preserve original painted pixels in source;
# feather the trailing edge over an opaque water plate to avoid a hard seam.
wave=Image.open(SRC/'wave_surf_v2.png').convert('RGBA')
water=wave.crop((0,0,int(wave.width*.5),wave.height));water.putalpha(255);water.save(OUT/'wave_water_v2.png')
alpha=wave.getchannel('A');fade=Image.new('L',wave.size);fade.putdata([round(255*min(1,x/(wave.width*.18))) for y in range(wave.height) for x in range(wave.width)])
wave.putalpha(ImageChops.multiply(alpha,fade));wave.save(OUT/'wave_surf_v2.png')
def trim(im):
 im=im.convert('RGBA'); alpha=im.getchannel('A'); box=alpha.point(lambda x:255 if x>16 else 0).getbbox()
 return im.crop(box) if box else im
def export_cell(im,box,name,occupancy=.84):
 tile=trim(im.crop(tuple(round(v) for v in box))); tile.thumbnail((round(512*occupancy),round(512*occupancy)),Image.Resampling.LANCZOS)
 canvas=Image.new('RGBA',(512,512)); canvas.alpha_composite(tile,((512-tile.width)//2,(512-tile.height)//2))
 # Remove tiny disconnected atlas bleed without changing any painted subject pixels.
 alpha=canvas.getchannel('A');small=alpha.resize((128,128),Image.Resampling.NEAREST);bits=list(small.point(lambda a:255 if a>16 else 0).getdata());seen=set();groups=[]
 for start,value in enumerate(bits):
  if not value or start in seen:continue
  stack=[start];seen.add(start);group=[]
  while stack:
   pos=stack.pop();group.append(pos);x=pos%128;y=pos//128
   for q in ([pos-1] if x else [])+([pos+1] if x<127 else [])+([pos-128] if y else [])+([pos+128] if y<127 else []):
    if bits[q] and q not in seen:seen.add(q);stack.append(q)
  groups.append(group)
 if groups:
  largest=max(map(len,groups));keep=Image.new('L',(128,128));pixels=keep.load()
  for group in groups:
   if len(group)<max(4,largest*.004):continue
   for pos in group:pixels[pos%128,pos//128]=255
  mask=keep.resize((512,512),Image.Resampling.NEAREST).filter(ImageFilter.MaxFilter(9));canvas.putalpha(ImageChops.multiply(alpha,mask))
 canvas.save(OUT/f'{name}.png')
 return tile
im=Image.open(SRC/'symbols.png'); w,h=im.size
for i,name in enumerate(['h1','h2','h3','h4','h5','w','s','sw']):export_cell(im,((i%4)*w/4,(i//4)*h/2,(i%4+1)*w/4,(i//4+1)*h/2),name)
im=Image.open(SRC/'lowSymbols.png');w,h=im.size
for i in range(4):export_cell(im,(i*w/4,0,(i+1)*w/4,h),f'l{i+1}',.65)
bg=Image.open(SRC/'background.png').convert('RGB');bg.resize((1920,1080),Image.Resampling.LANCZOS).save(OUT/'bg_base.jpg',quality=93)
# Foreground will be animated separately; no baked pan across the whole beach.
parts=['head','body','arm_l','arm_r','legs','tail','tool','belt']
layout={
 'head':{'x':236,'y':240,'w':245,'h':240,'ax':.5,'ay':.86},
 'body':{'x':240,'y':229,'w':227,'h':218,'ax':.5,'ay':0},
 'legs':{'x':240,'y':414,'w':236,'h':259,'ax':.5,'ay':0},
 'tail':{'x':315,'y':465,'w':155,'h':155,'ax':.13,'ay':.75},
 'arm_r':{'x':314,'y':268,'w':142,'h':186,'ax':.22,'ay':.05},
 'arm_l':{'x':166,'y':267,'w':180,'h':192,'ax':.54,'ay':.08},
 'tool':{'x':183,'y':425,'w':180,'h':245,'ax':.76,'ay':0},
 'belt':{'x':254,'y':444,'w':117,'h':72,'ax':.5,'ay':.5},
}
manifest={}
for who in ['digger','lifeguard']:
 atlas=Image.open(SRC/f'{who}Rig.png').convert('RGBA');w,h=atlas.size
 cuts=[[0,.265,.535,.79,1],[0,.285,.5,.77,1]] if who=='digger' else [[0,.27,.52,.77,1],[0,.28,.5,.75,1]]
 manifest[who]={}
 for i,name in enumerate(parts):
  row=i//4;col=i%4; tile=trim(atlas.crop((round(cuts[row][col]*w),round(row*h/2),round(cuts[row][col+1]*w),round((row+1)*h/2))))
  # The grip is already painted in arm_l. Export only the continuation of the shaft;
  # otherwise the assembly would show a second detector display / shovel D-handle.
  if name=='tool':tile=trim(tile.crop((0,round(tile.height*.27),tile.width,tile.height)))
  # The jacket already carries the belt. Avoid displaying the lower body's duplicate.
  if name=='legs':tile=trim(tile.crop((0,round(tile.height*.10),tile.width,tile.height)))
  tile.save(OUT/f'{who}_{name}.png'); manifest[who][name]={**layout[name],'path':f'treasure/{who}_{name}.png'}
  if who=='lifeguard' and name=='body': manifest[who][name]['trimSleeves']=True
  if who=='lifeguard' and name=='arm_l': manifest[who][name].update(x=190,y=280,ax=.23,ay=.23)
  if who=='lifeguard' and name=='arm_r': manifest[who][name].update(x=290,y=275,ax=.15,ay=.4)
  if who=='lifeguard' and name=='tool': manifest[who][name].update(x=233,y=400,w=180,h=280,ax=.76,ay=0)
 # Flatten exactly the same exported rig at rest for boot screens, never derive parts from this composite.
 from export_treasure_cast import export_cast
 export_cast(who,manifest[who])
(OUT/'cast.json').write_text(json.dumps(manifest,indent=2),encoding='utf-8')
(ROOT/'src/game/treasureCastRig.json').write_text(json.dumps(manifest,indent=2),encoding='utf-8')

# Native UI extends the existing frame and plaque system; illustrated assets above come from ImageGen.
INK='#2A1A12';WOOD='#A96E40';SAND='#F3D397';CREAM='#FFF4D7';TEAL='#328A91';RED='#D94A38'
FONT=ROOT/'static/fonts/TitanOne.ttf'
def plate(name,w,h,text='',fill=CREAM,accent=TEAL,border=10):
 c=Image.new('RGBA',(w,h));d=ImageDraw.Draw(c)
 d.rounded_rectangle((border,border,w-border-1,h-border-1),radius=min(35,h//5),fill=fill,outline=INK,width=border)
 d.line((border*2,h-border*2,w-border*2,h-border*2),fill=WOOD,width=max(2,border//3))
 if text:
  font=ImageFont.truetype(str(FONT),max(12,round(min(h*.38,w/(len(text)*.64)))))
  d.text((w/2,h*.42),text,font=font,fill=accent,stroke_width=max(1,border//5),stroke_fill=INK,anchor='mm')
 c.save(OUT/f'{name}.png')
for name,text in [('logo','TREASURE MONKEY'),('title_soldier','BEACH SWEEP'),('title_capo','HIDDEN COVE'),('title_don','LOST LAGOON')]:plate(name,1024,360,text)
for i,name in enumerate(['big','superwin','mega','epic','max']):plate('win_'+name,1000,560,['BIG FIND','SUPER FIND','MEGA FIND','EPIC FIND','MAX FIND'][i],accent=RED if i>=3 else TEAL)
for name,w,h in [('fs_sign',1100,680),('fs_panel',640,180),('ticker',800,120),('buybonus',400,160),('button',220,180),('spin',260,260)]:plate(name,w,h,fill=RED if name=='spin' else CREAM,border=8)
# 1280-square frame fits the donor board's 1.153 scale. Inner window is transparent.
c=Image.new('RGBA',(1280,1280));d=ImageDraw.Draw(c)
d.rounded_rectangle((20,20,1260,1260),radius=50,fill=WOOD,outline=INK,width=14)
d.rounded_rectangle((74,74,1206,1206),radius=18,fill=(0,0,0,0),outline=INK,width=12)
for x,y in [(45,45),(1235,45),(45,1235),(1235,1235)]:d.ellipse((x-14,y-14,x+14,y+14),fill=SAND,outline=INK,width=4)
c.save(OUT/'frame_edge.png')
Image.new('RGBA',(1280,1280),'#EDDBAF').save(OUT/'frame_bg.png')
for size in [1,2,3]:
 n=256*size;c=Image.new('RGBA',(n,n));d=ImageDraw.Draw(c)
 d.rounded_rectangle((8,8,n-8,n-8),radius=20,fill=(243,211,151,30),outline=TEAL,width=9)
 for x,y in [(15,15),(n-15,15),(15,n-15),(n-15,n-15)]:d.ellipse((x-9,y-9,x+9,y+9),fill=RED,outline=INK,width=3)
 c.save(OUT/f'dig_zone_{size}.png'); c.save(OUT/f'dig_zone_edge_{size}.png')
Image.new('RGBA',(64,64)).save(OUT/'empty.png')
# QA: compare the actual exported symbols at production sizes.
sheet=Image.new('RGB',(800,390),CREAM);d=ImageDraw.Draw(sheet)
for i,name in enumerate(['h1','h2','h3','h4','h5','w','s','sw','l1','l2','l3','l4']):
 tile=Image.open(OUT/f'{name}.png').resize((128,128),Image.Resampling.LANCZOS);sheet.paste(tile,((i%6)*133,(i//6)*180),tile)
 d.text(((i%6)*133+10,(i//6)*180+135),name,fill=INK)
sheet.save(SRC/'runtime_contact_sheet.jpg')
print('Exported 12 symbols, 2 layered rigs, beach plate and native theme UI to',OUT)
