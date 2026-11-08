"""Reproducible packing of ImageGen masters. Originals stay untouched.

Only crops, registration, composition, texture masks and native UI geometry are
performed here. All illustrated subjects come from volt_generated_sources.json.
"""
from pathlib import Path
import json, math, re, shutil, sys
import numpy as np
import cv2
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageEnhance, ImageOps

DESIGN=Path(__file__).resolve().parent
APP=DESIGN.parent
DEL=DESIGN/'source/volt_delivery'
SPR=APP/'static/assets/sprites'
META=json.loads((DESIGN/'volt_generated_sources.json').read_text(encoding='utf-8'))
ORIG=DEL/'originals'
ORIG.mkdir(parents=True,exist_ok=True)
for key,item in META.items():
    if item.get('path') and Path(item['path']).exists():
        dst=ORIG/(key+'.png')
        if not dst.exists(): shutil.copy2(item['path'],dst)

def src(key):
    return Image.open(ORIG/(key+'.png')).convert('RGBA')

def save(im,folder,name,size=None,runtime=None):
    if size: im=im.resize(size,Image.Resampling.LANCZOS)
    p=DEL/folder/(name+'.png');p.parent.mkdir(parents=True,exist_ok=True);im.save(p)
    if runtime:
        p=SPR/runtime/(name+'.webp');p.parent.mkdir(parents=True,exist_ok=True)
        im.save(p,quality=91,method=6)
    return im

def fit(im,size,margin=.08):
    # Alpha registration uses visible ink, not transparent export margins.
    box=im.getchannel('A').point(lambda a:255 if a>60 else 0).getbbox()
    if not box: raise ValueError('Empty source image')
    cut=im.crop(box)
    scale=min(size[0]*(1-margin*2)/cut.width,size[1]*(1-margin*2)/cut.height)
    cut=cut.resize((max(1,round(cut.width*scale)),max(1,round(cut.height*scale))),Image.Resampling.LANCZOS)
    out=Image.new('RGBA',size);out.alpha_composite(cut,((size[0]-cut.width)//2,(size[1]-cut.height)//2));return out

def blank(size): return Image.new('RGBA',size)

def ui_panel(size,fill='#1B2430'):
    # Native UI backing, sharing the same border vocabulary as the generated signs.
    im=blank(size);d=ImageDraw.Draw(im);w,h=size
    d.rounded_rectangle((6,6,w-6,h-6),min(w,h)*.12,fill=fill,outline='#C47A3A',width=max(2,round(min(w,h)*.035)))
    for x in [w*.08,w*.92]:
        for y in [h*.16,h*.84]:
            r=min(w,h)*.035;d.ellipse((x-r,y-r,x+r,y+r),fill='#b9c7cc',outline='#394552',width=1)
    return im

def backgrounds():
    specs=json.loads((DEL/'backgrounds/objects.json').read_text(encoding='utf-8'))
    props={
      'voltGear':('prop_gear',(410,410),'gear'),
      'voltLamp':('prop_lamp',(210,480),'lamp'),
      'voltElectrodes':('prop_electrodes',(352,620),'electrodes'),
      'voltTubes':('prop_tubes',(472,320),'tubes'),
      'voltCoil':('prop_coil',(418,714),'coil'),
      'voltScope':('prop_scope',(432,300),'scope'),
      'voltCables':('prop_cables',(944,204),'cables'),
      'voltBeacon':('prop_beacon',(268,332),'beacon'),
      'voltValve':('prop_valve',(332,332),'valve'),
      'voltBattery':('h4',(560,326),'battery'),
    }
    textures={}
    for key,(master,size,name) in props.items():
        im=fit(src(master),size,0)
        textures[key]=save(im,'backgrounds/parts',name,runtime='voltBackground')
    ind=ui_panel((470,116));d=ImageDraw.Draw(ind)
    for x,c in [(96,'#E2483D'),(235,'#F5C518'),(374,'#4FF0C8')]:
        d.ellipse((x-24,34,x+24,82),fill=c,outline='#101820',width=7)
    textures['voltIndicators']=save(ind,'backgrounds/parts','indicators',runtime='voltBackground')
    gauge=fit(src('meter_plate'),(330,330),0);d=ImageDraw.Draw(gauge)
    for k in range(13):
        a=math.radians(210+k*10)
        d.line((165+100*math.cos(a),165+100*math.sin(a),165+119*math.cos(a),165+119*math.sin(a)),fill='#d9e4e7',width=4)
    textures['voltGauge']=save(gauge,'backgrounds/parts','gauge',runtime='voltBackground')
    text=[]
    for mode,name,master in [('base','bg_base','volt_base_generated'),('feature','bg_feature','bg_feature_far'),('hold','bg_holdandspin','bg_holdandspin_far')]:
        far=src(master).resize((1920,1080),Image.Resampling.LANCZOS)
        save(far,'backgrounds',name+'_far',runtime='voltBackground')
        full=far.copy()
        for p in specs[mode]:
            part=textures[p['texture']].resize((p['w'],p['h']),Image.Resampling.LANCZOS)
            layer=blank((1920,1080));layer.alpha_composite(part,(p['x'],p['y']))
            save(layer,'backgrounds',name+'_obj_'+p['id'])
            full.alpha_composite(layer)
            px=p['x']+p['w']*p['pivot'][0];py=p['y']+p['h']*p['pivot'][1]
            text.append(f"{name}_obj_{p['id']}.png | {p['motion']} | pivot=({px:.1f},{py:.1f}) | period={p['period']}ms")
        save(full,'backgrounds',name)
    (DEL/'backgrounds/objects.txt').write_text('\n'.join(text)+'\n',encoding='utf-8')

def sheen(subject):
    a=np.array(subject.getchannel('A').resize((128,128)),dtype=float)/255
    y,x=np.mgrid[0:128,0:128];atlas=blank((768,512))
    for f in range(24):
        strength=np.exp(-((x+y-(-90+f/23*360))/18)**2)*a
        rgba=np.full((128,128,4),255,dtype=np.uint8);rgba[:,:,3]=(strength*160).astype('uint8')
        atlas.alpha_composite(Image.fromarray(rgba),((f%6)*128,(f//6)*128))
    return atlas

def symbols(keys=None):
    out=SPR/'voltSymbols';out.mkdir(parents=True,exist_ok=True)
    sheet=src('lows');empty=src('lows_blank').resize(sheet.size,Image.Resampling.LANCZOS)
    lows=[];lowplates=[]
    for i in range(5):
        box=(round(i*sheet.width/5),0,round((i+1)*sheet.width/5),sheet.height)
        tile=fit(sheet.crop(box),(820,820),.045)
        plate=fit(empty.crop(box),(820,820),.045)
        # Keep the letter's original ink; never regenerate a different font.
        a=np.array(tile);lum=(a[:,:,:3]*np.array([.2126,.7152,.0722])).sum(2)
        yy,xx=np.mgrid[0:820,0:820]
        mask=(lum<65)&(xx>110)&(xx<710)&(yy>125)&(yy<720)
        # Keep the letter components only; the dark corner rivets and hazard
        # stripes must stay nailed to the plate when the letter jumps.
        count,labels,stats,_=cv2.connectedComponentsWithStats(mask.astype('uint8'))
        keep=[j for j in range(1,count) if stats[j,cv2.CC_STAT_AREA]>5000]
        mask=np.isin(labels,keep)
        letter=a.copy();letter[:,:,3]=np.where(mask,a[:,:,3],0)
        lows.append(Image.fromarray(letter));lowplates.append(plate)
    # High-pay plates use the same illustrated steel plate, graded into deep slate.
    a=np.array(lowplates[0]);rgb=a[:,:,:3].astype(float)
    neutral=(rgb.max(2)-rgb.min(2))<48
    rgb[neutral]*=.24;a[:,:,:3]=np.clip(rgb,0,255).astype('uint8')
    dark=Image.fromarray(a)
    subjects={k:fit(src(k),(820,820),.085) for k in ['h1','h2','h3','h4','s']}
    bust=src('mascot_full_v2').crop((270,75,770,795))
    subjects['w']=fit(bust,(820,820),.085)
    for i in range(5): subjects['l'+str(i+1)]=lows[i]
    for k,subject in subjects.items():
        if keys is not None and k not in keys: continue
        low=k.startswith('l')
        plate=lowplates[int(k[1])-1] if low else dark
        if low: plate=ImageEnhance.Brightness(plate).enhance(.50)
        full=plate.copy();full.alpha_composite(subject)
        master=Image.new('RGBA',full.size,'#1B2430');master.alpha_composite(full)
        save(master.convert('RGB'),'symbols',k,(1024,1024))
        full.save(out/(k+'.webp'),quality=94,method=6)
        subject.save(out/(k+'_subject.webp'),quality=94,method=6)
        plate.save(out/(k+'_plate.webp'),quality=94,method=6)
        shadow=blank(subject.size);shadow.putalpha(subject.getchannel('A').filter(ImageFilter.GaussianBlur(9)))
        shadow.save(out/(k+'_shadow.webp'),quality=90,method=6)
        subject.save(out/(k+'_glow.webp'),quality=94,method=6)
        sheen(subject).save(out/(k+'_sheen.webp'),quality=90,method=6)
        cut=DEL/'symbols_cut';cut.mkdir(exist_ok=True);subject.save(cut/(k+'_subject.png'))
        if low: subject.save(out/(k+'_letter.webp'),quality=94,method=6)
    if keys is not None:return
    coin=fit(src('coin'),(820,820),.08)
    save(coin,'symbols','p',(1024,1024));coin.save(out/'p.webp',quality=94,method=6)
    socket=ui_panel((820,820),'#17212d');d=ImageDraw.Draw(socket);d.ellipse((160,160,660,660),outline='#29433e',width=10)
    save(socket,'symbols','x',(1024,1024));socket.save(out/'x.webp',quality=90,method=6)

def symbols_low():
    symbols({'l1','l2','l3','l4','l5'})

def hardware():
    # Illustrated primary hardware; exact wedge angles and numerals remain native UI.
    save(src('frame'),'frame','frame_edge',(1280,1280),'voltFrame')
    im=blank((1280,1280));ImageDraw.Draw(im).rectangle((95,95,1185,1185),fill=(20,30,41,242))
    save(im,'frame','frame_bg',runtime='voltFrame')
    for name,size in [('fs_sign',(1280,1000)),('fs_counter_panel',(1280,966))]:
        save(fit(src('sign'),size,.04),'frame',name,runtime='voltFrame')
    for master,name,size in [('meter_arch','arch_base',(1600,860)),('meter_plate','plate',(640,640)),('meter_button','button',(420,420))]:
        save(src(master),'volt_meter',name,size,'voltWheel')
    save(ImageEnhance.Brightness(src('meter_button')).enhance(1.14),'volt_meter','button_lit',(420,420),'voltWheel')
    save(src('tesla_ring'),'tesla_wheel','ring',(1400,1400),'voltWheel')
    save(fit(src('prop_coil').crop((0,0,1024,340)),(320,320),.08),'tesla_wheel','hub',runtime='voltWheel')
    # Exact annular sectors use generated metal as their surface, then receive code labels.
    metal=src('meter_plate').resize((360,300));rgb=np.array(metal)[:,:,:3]
    lum=(rgb*np.array([.2126,.7152,.0722])).sum(2)/255
    yy,xx=np.mgrid[0:300,0:360];r=np.hypot(xx-180,yy-740);ang=np.arctan2(xx-180,740-yy)
    mask=(r>465)&(r<735)&(abs(ang)<math.pi/14)
    for name,color in [('tile_normal',(150,178,183)),('tile_hot',(245,197,24)),('tile_top',(226,72,61))]:
        rgba=np.zeros((300,360,4),dtype='uint8');rgba[:,:,:3]=np.clip(np.array(color)[None,None,:]*(.68+.6*lum[:,:,None]),0,255);rgba[:,:,3]=mask*255
        save(Image.fromarray(rgba),'volt_meter',name,runtime='voltWheel')
    pointer=blank((180,240));d=ImageDraw.Draw(pointer);d.polygon([(32,20),(148,20),(90,232)],fill='#E2483D',outline='#ffe2b1',width=7)
    save(pointer,'volt_meter','pointer',runtime='voltWheel')
    # Four wheel faces share one exact 12-sector geometry.
    colors=['#4FF0C8','#3A8BFF','#F5C518','#B05CFF']
    for lv,c in enumerate(colors,1):
        face=blank((1200,1200));d=ImageDraw.Draw(face)
        col=tuple(bytes.fromhex(c[1:]));dim=tuple(round(n*.25) for n in col)
        for k in range(12):
            fill=c if k in [0,6] else col if k%2 else dim
            d.pieslice((35,35,1165,1165),-105+k*30,-75+k*30,fill=fill,outline='#C47A3A',width=7)
        d.ellipse((35,35,1165,1165),outline='#d9a064',width=12)
        save(face,'tesla_wheel',f'disc_lv{lv}',runtime='voltWheel')
    needle=blank((280,760));d=ImageDraw.Draw(needle)
    d.polygon([(140,20),(40,320),(135,285),(88,620),(170,620),(222,228),(140,262),(205,20)],fill='#F5C518',outline='#d3fff2',width=7)
    save(needle,'tesla_wheel','needle',runtime='voltWheel')
    font=APP/'static/fonts/LilitaOne.ttf'
    for name,text,size in [('title','TESLA WHEEL',(1200,300)),('levelup','LEVEL UP!',(1000,420))]:
        panel=fit(src('sign'),size,0);d=ImageDraw.Draw(panel);f=ImageFont.truetype(str(font),round(size[1]*.42))
        d.text((size[0]/2,size[1]/2),text,font=f,anchor='mm',fill='#e4fff6',stroke_width=4,stroke_fill='#23524b')
        save(panel,'tesla_wheel',name,runtime='voltWheel')
    # Soft scalar FX for additive compositing (no star particles).
    yy,xx=np.mgrid[-1:1:256j,-1:1:256j];r=np.hypot(xx,yy)
    glow=np.full((256,256,4),255,dtype='uint8');glow[:,:,3]=(np.exp(-r*r*7)*255).astype('uint8')
    for name,size in [('plate_flash',(800,800)),('button_burst',(600,600)),('tile_result_glow',(360,300))]:
        save(Image.fromarray(glow),'volt_meter',name,size,'voltWheel')
    rays=blank((1920,1080));d=ImageDraw.Draw(rays)
    for k in range(16):
        a=k*math.pi/8;d.line((960,540,960+1200*math.cos(a),540+1200*math.sin(a)),fill=(79,240,200,35),width=32)
    save(rays,'tesla_wheel','rays',runtime='voltWheel')

def presentation():
    for name in ['big','superwin','mega','epic','max']:
        save(fit(src('banner_'+name),(1000,560),.015),'banners',name,runtime='voltBanners')
    for name in ['bonus','holdandspin','volt','tesla']:
        im=src('buy_art_'+name).resize((800,450),Image.Resampling.LANCZOS)
        save(im,'ui','buy_art_'+name,runtime='voltUi')
        im.convert('RGB').save(DEL/'ui'/('buy_art_'+name+'.jpg'),quality=95)
    heroes={'bonus':'meter_button','holdandspin':'coin','tesla':'prop_coil','volt5':'h4','volt10':'h4'}
    for name,master in heroes.items():save(fit(src(master),(512,512),.08),'ui','buy_hero_'+name,runtime='voltUi')
    # The bar's existing line-art bulb is the native v4 icon; keep the same glyph in the delivery.
    icon=blank((512,512));d=ImageDraw.Draw(icon)
    d.ellipse((140,45,372,285),outline='#0a0804',width=48)
    d.line((185,260,185,350,327,350,327,260),fill='#0a0804',width=45)
    d.line((196,404,316,404),fill='#0a0804',width=42)
    save(icon,'ui','buy_icon',runtime='voltUi')
    # Native transition artwork is identical to the path drawn by TransitionAnimation.
    strike=blank((900,2160));d=ImageDraw.Draw(strike)
    points=[(530,0),(300,620),(490,600),(260,1390),(500,1160),(350,2160)]
    d.line(points,fill='#4FF0C8',width=90);d.line(points,fill='#f5fffd',width=29)
    save(strike,'transition','bolt_strike')
    yy,xx=np.mgrid[-1:1:1024j,-1:1:1024j];r=np.hypot(xx,yy)
    a=np.full((1024,1024,4),255,dtype='uint8');a[:,:,3]=(np.exp(-r*r*5)*255).astype('uint8')
    save(Image.fromarray(a),'transition','flash_glow')
    # Replace the inherited big-win particle sheet with this game's blank energy coins.
    coin=fit(src('coin'),(128,128),.07);sheet=blank((1280,128));frames={}
    for i in range(10):
        w=max(14,round(coin.width*abs(math.cos(i*math.pi/10))))
        part=coin.resize((w,128),Image.Resampling.LANCZOS)
        sheet.alpha_composite(part,(i*128+(128-w)//2,0))
        frames[str(i)]={'frame':{'x':i*128,'y':0,'w':128,'h':128},'sourceSize':{'w':128,'h':128},'spriteSourceSize':{'x':0,'y':0,'w':128,'h':128}}
    out=SPR/'voltCoins';out.mkdir(exist_ok=True);sheet.save(out/'coins.webp',quality=92,method=6)
    (out/'coins.json').write_text(json.dumps({'frames':frames,'meta':{'image':'coins.webp','scale':'1','size':{'w':1280,'h':128}}}))
    bg=src('cover_bg').resize((1920,1080),Image.Resampling.LANCZOS)
    fg=blank((1920,1080));figure=fit(src('mascot_full_v2').crop((0,65,1024,1090)),(850,1000),.025)
    fg.alpha_composite(figure,(535,80))
    save(bg,'thumbnail','cover_16x9_bg');save(fg,'thumbnail','cover_16x9_fg')
    save(ImageOps.fit(bg,(1024,1024)),'thumbnail','thumb_bg')
    thumb=blank((1024,1024));thumb.alpha_composite(fit(figure,(1024,1024),.025));save(thumb,'thumbnail','thumb_fg')
    covers=APP/'封面圖';covers.mkdir(exist_ok=True)
    bg.save(covers/'volt_bg_v1_20261108.png');fg.save(covers/'volt_character_v1_20261108.png')

if __name__=='__main__':
    sections=sys.argv[1:] or ['backgrounds','symbols','hardware','presentation']
    for section in sections:
        globals()[section]();print('Packed',section)
