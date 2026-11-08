"""Install generated UI/orb/brand art with proportional registration only."""
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import json,hashlib,shutil
import numpy as np
import cv2
APP=Path(__file__).resolve().parent.parent;ROOT=APP/'design/source/medusagaze';SRC=ROOT/'ui/generated';DEST=APP/'static/assets/sprites';ARCHIVE=ROOT/'legacy-placeholders'
files=[]
def box(im):return im.getchannel('A').point(lambda a:255 if a>16 else 0).getbbox()
def fit(im,size,fill=.94,tight=False):
    im=im.convert('RGBA');im=im.crop(box(im));im.thumbnail((round(size[0]*fill),round(size[1]*fill)),Image.Resampling.LANCZOS)
    if tight:return im
    out=Image.new('RGBA',size);out.alpha_composite(im,((size[0]-im.width)//2,(size[1]-im.height)//2));return out
def install(name,im,size,source,fill=.94,tight=False):
    target=DEST/name;target.parent.mkdir(parents=True,exist_ok=True);old=ARCHIVE/name
    if target.exists() and not old.exists():old.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(target,old)
    out=fit(im,size,fill,tight);out.save(target)
    files.append({'runtime':str(target.relative_to(APP)).replace('\\','/'),'source':source,'size':out.size,'bytes':target.stat().st_size,'sha256':hashlib.sha256(target.read_bytes()).hexdigest()})
def read(name):return Image.open(SRC/name).convert('RGBA')
for name,target,size in [('capital_original.png','medusaFrame/capital.png',(256,256)),('lintel_original.png','medusaFrame/lintel.png',(512,128)),('column_original.png','medusaFrame/column.png',(128,512))]:
    if (SRC/name).exists():install(target,read(name),size,name,1,True)
if (SRC/'disc_states.png').exists():
    im=read('disc_states.png');cw=im.width//2
    for i,name in enumerate(['button_disc.png','button_disc_on.png']):install('medusaUi/'+name,im.crop((i*cw,0,(i+1)*cw,im.height)),(256,256),'disc_states.png',.95)
if (SRC/'buy_shield.png').exists():
    im=read('buy_shield.png')
    for name in ['buybonus_plate.png','buybonus_plate_lit.png']:install('medusaUi/'+name,im,(640,640),'buy_shield.png',.92)
if (SRC/'total_states.png').exists():
    im=read('total_states.png');rh=im.height/3
    for i,name in enumerate(['total_plate.png','total_plate_mid.png','total_plate_high.png']):install('medusaUi/'+name,im.crop((0,round(i*rh),im.width,round((i+1)*rh))),(512,320),'total_states.png',.96)
if (SRC/'scroll.png').exists():
    im=read('scroll.png');install('medusaUi/fs_sign.png',im,(1706,922),'scroll.png',.98)
    install('medusaUi/fs_counter_panel.png',im,(512,320),'scroll.png',.97)
    install('medusaUi/ticker_plate.png',im,(652,146),'scroll.png',1)
if (SRC/'bar.png').exists():install('medusaUi/bar_strip.png',read('bar.png'),(1600,200),'bar.png',1)
if (SRC/'logo.png').exists():install('medusaBrand/logo.png',read('logo.png'),(1600,600),'logo.png',.95)
if (SRC/'loader.png').exists():
    install('medusaBrand/loader.png',read('loader.png'),(384,384),'loader.png',.9)
    ring=Image.open(DEST/'medusaBrand/loader.png');frames=ROOT/'ui/loader_frames';frames.mkdir(exist_ok=True)
    for i in range(12):ring.rotate(-i*30,Image.Resampling.BICUBIC).save(frames/f'loader_{i:02d}.png')
banner_layout={}
for tier in ['big','superwin','mega','epic','max']:
    name=f'win_{tier}.png'
    if not (SRC/name).exists():continue
    install(f'medusaWinBanners/{tier}.png',read(name),(1500,740),name,1,True)
    im=Image.open(DEST/f'medusaWinBanners/{tier}.png');a=np.array(im);h,w=a.shape[:2]
    mask=((a[:,:,0]>180)&(a[:,:,1]>160)&(a[:,:,2]>110)&(a[:,:,3]>200)).astype(np.uint8)
    n,labels,stats,centers=cv2.connectedComponentsWithStats(mask,8);idx=max(range(1,n),key=lambda i:stats[i,cv2.CC_STAT_AREA]);x,y,ww,hh=stats[idx,:4]
    banner_layout[tier]={'width':w,'height':h,'textY':float((y+hh/2-h/2)/h),'textHeight':float(hh/h),'textWidth':float(ww/w)}
if banner_layout:(APP/'src/game/medusaBannerLayout.json').write_text(json.dumps(banner_layout,indent=2)+'\n',encoding='utf-8')
if (SRC/'cover.png').exists():
    im=read('cover.png');w,h=im.size;target=(1920,1080);ratio=16/9
    if w/h>ratio:dx=(w-h*ratio)/2;im=im.crop((round(dx),0,round(w-dx),h))
    else:dy=(h-w/ratio)/2;im=im.crop((0,round(dy),w,round(h-dy)))
    im=im.resize(target,Image.Resampling.LANCZOS);im.convert('RGB').save(ROOT/'ui/MedusaGaze_cover.jpg',quality=95)
    branded=im.copy();logo=fit(read('logo.png'),(900,400),.97,True);branded.alpha_composite(logo,(90,320));branded.convert('RGB').save(ROOT/'ui/MedusaGaze_cover_branded.jpg',quality=95)
if (SRC/'tile_foreground.png').exists():
    brand=DEST/'medusaBrand';brand.mkdir(exist_ok=True);foreground=fit(read('tile_foreground.png'),(1024,1024),1)
    foreground.save(brand/'tile_foreground.png');shutil.copy2(brand/'tile_foreground.png',ROOT/'ui/tile_foreground.png')
    background=Image.open(DEST/'medusaBackground/bg_base.jpg').convert('RGB');bw,bh=background.size;background=background.crop(((bw-bh)//2,0,(bw+bh)//2,bh)).resize((1024,1024),Image.Resampling.LANCZOS)
    background.save(brand/'tile_background.jpg',quality=95);background.save(ROOT/'ui/tile_background.jpg',quality=95)
    composite=background.convert('RGBA');composite.alpha_composite(foreground);composite.convert('RGB').save(ROOT/'ui/MedusaGaze_tile.jpg',quality=95)
if (SRC/'favicon.png').exists():
    icon=fit(read('favicon.png'),(128,128),.96);icon.save(APP/'static/favicon.png');icon.save(APP/'static/favicon.ico',sizes=[(16,16),(32,32),(48,48),(64,64)])
turn=ROOT/'cast/medusa_turnaround_original.png'
if turn.exists():fit(Image.open(turn),(2048,1024),.98).save(ROOT/'cast/medusa_turnaround.png')
for color in ['green','purple','gold']:
    name=f'orb_{color}.png'
    if (SRC/name).exists():install('medusaOrbs/'+name,read(name),(512,512),name,.85)
for i in range(1,4):
    name=f'intro_{i}.png'
    if (SRC/name).exists():
        im=read(name);target=DEST/'medusaIntro'/name;old=ARCHIVE/'medusaIntro'/name
        if target.exists() and not old.exists():old.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(target,old)
        # An opaque 4:3 illustration: center-crop to fit its card without stretching.
        ratio=4/3;w,h=im.size
        if w/h>ratio:dx=(w-h*ratio)/2;im=im.crop((round(dx),0,round(w-dx),h))
        else:dy=(h-w/ratio)/2;im=im.crop((0,round(dy),w,round(h-dy)))
        im=im.resize((960,720),Image.Resampling.LANCZOS);im.save(target)
        files.append({'runtime':str(target.relative_to(APP)).replace('\\','/'),'source':name,'size':im.size,'bytes':target.stat().st_size,'sha256':hashlib.sha256(target.read_bytes()).hexdigest()})
(ROOT/'ui/manifest.json').write_text(json.dumps({'tool':'built-in image_gen','preparation':'Preserved true alpha, crop/proportional registration, no procedural replacement painting','files':files},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
import math
sheet=Image.new('RGB',(1400,math.ceil(len(files)/4)*260+55),'#12333e');draw=ImageDraw.Draw(sheet);font=ImageFont.truetype('C:/Windows/Fonts/arial.ttf',15)
draw.text((20,12),'MEDUSA GAZE / PRODUCTION UI, FRAME, ORBS AND BRAND',font=font,fill='#f2c14e')
for i,item in enumerate(files):
    im=Image.open(APP/item['runtime']).convert('RGBA');im.thumbnail((310,205),Image.Resampling.LANCZOS);x=20+(i%4)*350;y=55+(i//4)*260
    sheet.paste(im,(x+(310-im.width)//2,y+(205-im.height)//2),im);draw.text((x,y+213),Path(item['runtime']).name,font=font,fill='#eee6d5')
sheet.save(ROOT/'_sheets/completion_ui_contact.jpg',quality=94,subsampling=0)
print(json.dumps({'installedArtFiles':len(files),'bytes':sum(f['bytes'] for f in files)},indent=2))
