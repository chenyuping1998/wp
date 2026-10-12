"""Build Diner Monkey runtime sprites from approved illustration sources.

The generated originals stay in design/source/diner. This script creates the
fixed-size, transparent assets expected by the Jade/Sushi runtime keys.
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageOps, ImageFilter
import colorsys
import math
import numpy as np

APP=Path(__file__).resolve().parents[1]
SRC=APP/'design/source/diner'
DEST=APP/'static/assets/sprites'
INK=(27,27,27,255); PAPER=(251,245,230,255); NEWS=(242,232,207,255)
RED=(226,52,43,255); CYAN=(31,163,200,255); MINT=(143,211,193,255)
PINK=(244,143,177,255); CHROME=(219,224,226,255); DARK=(54,59,62,255)
YELLOW=(247,197,49,255)

def blank(size):return Image.new('RGBA',size,(0,0,0,0))
# Owned by other scripts since 2026-10-09: the intro scenes and their frame
# (design/build_diner_intro_scenes.py). Re-running this script used to put the
# old burst cards back, under meshes measured on the new scenes.
OWNED_ELSEWHERE={'sushiV8/intro_collect.png','sushiV8/intro_slice.png','sushiV8/intro_receipt.png','sushiV8/menu_frame.png'}
def save(im,folder,name):
    if f'{folder}/{name}' in OWNED_ELSEWHERE:return
    p=DEST/folder/name;p.parent.mkdir(parents=True,exist_ok=True)
    im.save(p,optimize=True)
def fit(path,size):return ImageOps.fit(Image.open(path).convert('RGBA'),size,Image.Resampling.LANCZOS)
def contain(path,size,pad=0):
    source=Image.open(path).convert('RGBA'); bbox=source.getchannel('A').getbbox()
    if bbox:source=source.crop(bbox)
    source.thumbnail((size[0]-2*pad,size[1]-2*pad),Image.Resampling.LANCZOS)
    out=blank(size);out.alpha_composite(source,((size[0]-source.width)//2,(size[1]-source.height)//2));return out
def overlay(im,part,xy,size=None):
    if size:part=part.resize(size,Image.Resampling.LANCZOS)
    im.alpha_composite(part,xy)
def line(draw,pts,fill=INK,width=8,joint='curve'):draw.line(pts,fill=fill,width=width,joint=joint)
def burst(cx,cy,rx,ry,n=18,inner=.83):
    pts=[]
    for i in range(n*2):
        a=2*math.pi*i/(n*2)-math.pi/2
        r=1 if i%2==0 else inner
        pts.append((round(cx+rx*r*math.cos(a)),round(cy+ry*r*math.sin(a))))
    return pts
def panel(size,accent=RED,inset=20,radius=34,fill=PAPER):
    w,h=size;im=blank(size);d=ImageDraw.Draw(im)
    d.rounded_rectangle((inset,inset,w-inset,h-inset),radius,fill=fill,outline=INK,width=max(5,w//150))
    d.rounded_rectangle((inset+10,inset+10,w-inset-10,h-inset-10),max(8,radius-10),outline=accent,width=max(4,w//230))
    return im
def font(size):
    p=APP/'static/fonts/sushi/Bangers-Regular.ttf'
    return ImageFont.truetype(str(p),size)
def place_art(canvas,path,box,angle=0):
    """Place an existing clean cutout inside a comic panel without baking type."""
    src=Image.open(path).convert('RGBA')
    bounds=src.getchannel('A').getbbox()
    if bounds:src=src.crop(bounds)
    src.thumbnail((box[2]-box[0],box[3]-box[1]),Image.Resampling.LANCZOS)
    if angle:src=src.rotate(angle,Image.Resampling.BICUBIC,expand=True)
    canvas.alpha_composite(src,(round((box[0]+box[2]-src.width)/2),round((box[1]+box[3]-src.height)/2)))
def dots(draw,box,color=INK,step=27,radius=3):
    for y in range(box[1],box[3],step):
        for x in range(box[0]+(step//2 if (y//step)%2 else 0),box[2],step):
            draw.ellipse((x-radius,y-radius,x+radius,y+radius),fill=color)
def speed_lines(draw,x0,y0,x1,y1,color=INK,count=4,width=9):
    for i in range(count):
        off=i*23
        draw.line((x0,y0+off,x1-(i%2)*80,y1+off),fill=color,width=max(3,width-i))
def yellow_restrict(im):
    a=np.array(im)
    r,g,b=a[:,:,0],a[:,:,1],a[:,:,2]
    mask=(r>175)&(g>115)&(g>r*.52)&(b<145)&(r>b*1.4)&(a[:,:,3]>0)
    a[mask,0]=235;a[mask,1]=175;a[mask,2]=104
    return Image.fromarray(a,'RGBA')

def symbols():
    for name in ('h1','h2','h3','h4','p','s','w'):
        im=contain(SRC/'symbols'/f'{name}.png',(512,512),24)
        if name!='s':im=yellow_restrict(im)
        save(im,'sushiSymbols',f'{name}.png')
    borders=[RED,CYAN,MINT,PINK,CHROME]
    for i in range(6):
        im=blank((512,512));d=ImageDraw.Draw(im)
        col=borders[i%5] if i<5 else RED
        d.rounded_rectangle((47,47,465,465),34,fill=INK,outline=INK,width=6)
        d.rounded_rectangle((61,61,451,451),27,fill=col)
        d.rounded_rectangle((78,78,434,434),19,fill=PAPER,outline=INK,width=7)
        for y in (84,428):
            for x in range(105,417,24):d.ellipse((x,y,x+5,y+5),fill=INK)
        for x in (82,426):d.line((x,116,x,396),fill=INK,width=4)
        save(im,'sushiSymbols',f'l{i+1}.png' if i<5 else 'low_label.png')

def backgrounds_frames():
    for mode in ('base','feature'):
        save(fit(SRC/f'background_{mode}.png',(1920,1080)),'sushiBackground',f'bg_{mode}.png')
    bg=blank((1280,1280));d=ImageDraw.Draw(bg)
    d.rectangle((70,70,1210,1210),fill=NEWS)
    for x in range(90,1210,64):
        for y in range(90,1210,64):
            if (x//64+y//64)%2==0:d.rectangle((x,y,x+64,y+64),fill=(238,233,218,255))
    save(bg,'sushiFrame','frame_bg.png')
    frame_edge()

def frame_edge():
    # Draw our own silhouette. Reusing the old frame's alpha brought back
    # heavy corner shadows outside the ink rim.
    frame=blank((1280,1280));d=ImageDraw.Draw(frame)
    for pad,col,width in ((31,INK,10),(45,CHROME,20),(69,RED,13),(82,PAPER,8)):
        d.rounded_rectangle((pad,pad,1280-pad,1280-pad),46,outline=col,width=width)
    for x in (86,1194):
        for y in (86,1194):
            d.ellipse((x-13,y-13,x+13,y+13),fill=PAPER,outline=INK,width=5)
    save(frame,'sushiFrame','frame_edge.png')
    # New filename keeps browsers from reusing the old frame with black lugs.
    save(frame,'sushiFrame','frame_edge_clean.png')

def background_props():
    target=SRC/'bg_props';target.mkdir(parents=True,exist_ok=True)
    # Separate clean cels allow independent runtime motion over either plate.
    fan=blank((256,256));d=ImageDraw.Draw(fan)
    for a in (0,120,240):
        th=math.radians(a)
        pts=[]
        for rr,aa in ((22,a-25),(105,a-13),(115,a+11),(20,a+20)):
            rad=math.radians(aa);pts.append((128+rr*math.cos(rad),128+rr*math.sin(rad)))
        d.polygon(pts,fill=CHROME,outline=INK,width=8)
    d.ellipse((102,102,154,154),fill=RED,outline=INK,width=9)
    lamp=blank((256,256));d=ImageDraw.Draw(lamp)
    d.arc((25,18,231,236),182,358,fill=CYAN,width=17)
    d.arc((45,34,211,218),183,356,fill=RED,width=10)
    sign=blank((384,170));d=ImageDraw.Draw(sign)
    d.rounded_rectangle((10,10,374,160),28,fill=INK,outline=RED,width=9)
    d.rounded_rectangle((26,25,358,145),20,outline=CYAN,width=7)
    d.text((192,85),'OPEN',font=font(105),anchor='mm',fill=PAPER,stroke_width=2,stroke_fill=RED)
    steam=blank((256,256));d=ImageDraw.Draw(steam)
    for off in (0,70,140):
        d.arc((16+off,14,101+off,230),70,276,fill=INK,width=9)
        d.arc((39+off,18,130+off,228),102,257,fill=PAPER,width=4)
    for name,im in [('fan',fan),('jukebox',lamp),('open',sign),('steam',steam)]:
        im.save(target/f'{name}.png',optimize=True)
        save(im,'sushiBackground',f'prop_{name}.png')

def ui(bar_only=False):
    # A chrome diner countertop with a red acrylic face, matching the approved
    # sample. Transparent around the bar so mobile crops remain clean.
    im=blank((1600,200));d=ImageDraw.Draw(im)
    d.rounded_rectangle((0,12,1599,194),22,fill=DARK,outline=INK,width=10)
    d.rounded_rectangle((10,18,1589,70),13,fill=CHROME,outline=INK,width=7)
    d.line((38,32,1562,32),fill=PAPER,width=9)
    d.rounded_rectangle((16,72,1584,182),15,fill=RED,outline=INK,width=9)
    d.line((33,91,1567,91),fill=(255,187,168,255),width=8)
    d.line((33,166,1567,166),fill=INK,width=9)
    # Keep the acrylic face clear: small chrome rivets read like inactive
    # controls once the real UI buttons are laid over the strip.
    save(im,'sushiUi','bar_strip.png')
    if bar_only:
        return
    # Sample's red jukebox button, with hard white crescent and black keyline.
    for name in ('spin_plate','button_plate','button_print','button_print_on'):
        im=blank((256,256));d=ImageDraw.Draw(im)
        base=RED if name=='spin_plate' else CYAN if name=='button_print_on' else PAPER
        d.ellipse((8,8,248,248),fill=INK)
        d.ellipse((18,18,238,238),fill=CHROME)
        d.ellipse((27,27,229,229),fill=base,outline=INK,width=8)
        d.arc((43,42,212,201),200,300,fill=(255,245,230,255),width=13)
        d.arc((48,51,208,211),20,100,fill=(50,34,32,255),width=7)
        if name=='spin_plate':d.arc((27,27,229,229),310,350,fill=PAPER,width=6)
        save(im,'sushiUi',name+'.png')
    im=panel((652,146),CYAN,8,20,fill=(231,235,225,255));d=ImageDraw.Draw(im)
    d.rounded_rectangle((40,26,612,120),12,fill=PAPER,outline=INK,width=6)
    save(im,'sushiUi','ticker_plate.png')
    for lit in (False,True):
        im=blank((512,512));d=ImageDraw.Draw(im)
        col=CYAN if lit else RED
        d.line((124,16,124,145),fill=INK,width=12);d.line((388,16,388,145),fill=INK,width=12)
        for x in (124,388):d.ellipse((x-15,5,x+15,35),fill=CHROME,outline=INK,width=5)
        d.rounded_rectangle((50,130,462,448),38,fill=INK)
        d.rounded_rectangle((63,143,449,435),30,fill=col,outline=CHROME,width=15)
        d.rounded_rectangle((90,170,422,406),20,fill=PAPER,outline=INK,width=8)
        for x in range(110,420,43):
            d.ellipse((x-5,152,x+5,162),fill=PAPER)
        save(im,'sushiUi','buybonus_plate_lit.png' if lit else 'buybonus_plate.png')
    for name,sym,accent in [('bonus','h1',CYAN),('superbonus','p',RED)]:
        im=panel((600,840),accent,18,30);d=ImageDraw.Draw(im)
        d.rectangle((43,44,557,310),fill=NEWS,outline=INK,width=7)
        art=Image.open(DEST/'sushiSymbols'/f'{sym}.png').convert('RGBA').resize((235,235))
        im.alpha_composite(art,(183,58))
        d.line((90,340,510,340),fill=INK,width=6)
        for y in (420,484,548):d.line((85,y,515,y),fill=CHROME,width=5)
        save(im,'sushiUi',f'card_{name}.png')
    icons=['autoSpin','decrease','increase','info','menu','menuExit','payTable','replay','settings','soundOff','soundOn','spin','turbo']
    for name in icons:
        im=blank((256,256));d=ImageDraw.Draw(im);c=PAPER
        if name in ('decrease','increase'):
            d.line((55,128,201,128),fill=c,width=23)
            if name=='increase':d.line((128,55,128,201),fill=c,width=23)
        elif name in ('spin','autoSpin','replay'):
            d.arc((50,50,206,206),35,312,fill=c,width=18)
            d.polygon([(179,45),(213,80),(165,91)],fill=c)
            if name=='autoSpin':d.arc((76,76,180,180),35,312,fill=c,width=9)
        elif name in ('menu','menuExit'):
            for y in (72,128,184):d.line((57,y,199,y),fill=c,width=16)
            if name=='menuExit':d.line((84,75,172,181),fill=RED,width=13)
        elif name=='info':
            d.ellipse((52,52,204,204),outline=c,width=16);d.ellipse((119,78,137,96),fill=c);d.line((128,115,128,177),fill=c,width=17)
        elif name=='payTable':
            d.rounded_rectangle((56,52,200,204),14,outline=c,width=15)
            for y in (98,136,174):d.line((80,y,176,y),fill=c,width=10)
        elif name=='settings':
            d.ellipse((79,79,177,177),outline=c,width=19)
            for i in range(8):
                a=i*math.pi/4;cx,cy=128,128
                d.line((cx+55*math.cos(a),cy+55*math.sin(a),cx+82*math.cos(a),cy+82*math.sin(a)),fill=c,width=17)
        elif name.startswith('sound'):
            d.polygon([(53,105),(89,105),(130,70),(130,186),(89,151),(53,151)],outline=c)
            d.line((53,105,89,105,130,70,130,186,89,151,53,151,53,105),fill=c,width=13)
            if name=='soundOn':d.arc((124,62,207,194),285,75,fill=c,width=13)
            else:d.line((157,93,203,163),fill=RED,width=13)
        elif name=='turbo':
            d.polygon([(148,41),(65,137),(120,137),(92,214),(190,108),(132,108)],fill=c)
        save(im,'sushiIcons',name+'.png')
        if name not in ('decrease','increase','spin','turbo'):
            # The print bar has cream buttons, so its glyphs need dark ink.
            ink=Image.new('RGBA',im.size,INK)
            ink.putalpha(im.getchannel('A'))
            save(ink,'sushiIcons','print_'+name+'.png')

def scene():
    save(contain(SRC/'chef_cut_in.png',(1024,1024),8),'sushiScene','chef_cut_in.png')
    im=blank((1920,420));d=ImageDraw.Draw(im)
    # The awning is a moving foreground cel, with printed scallops and a
    # checkerboard hem that reads even during the half-second door slam.
    d.rectangle((0,0,1919,290),fill=PAPER)
    for x in range(0,1920,160):
        col=RED if (x//160)%2==0 else PAPER
        d.rectangle((x,0,x+160,300),fill=col)
        d.ellipse((x,226,x+160,384),fill=col,outline=INK,width=8)
        if col==PAPER:dots(d,(x+22,45,x+138,225),(205,186,168,255),29,3)
    d.rectangle((0,11,1919,40),fill=INK)
    for x in range(0,1920,50):d.rectangle((x,297,x+25,323),fill=INK if (x//50)%2==0 else PAPER)
    d.line((0,292,1919,292),fill=INK,width=13)
    save(im,'sushiScene','noren.png')
    im=blank((1400,1080));d=ImageDraw.Draw(im)
    for x in (0,700):
        d.rounded_rectangle((x+12,0,x+688,1070),29,fill=INK)
        d.rounded_rectangle((x+32,18,x+668,1050),24,fill=RED,outline=CHROME,width=17)
        d.rounded_rectangle((x+66,60,x+634,1002),16,fill=PAPER,outline=INK,width=13)
        d.rectangle((x+78,678,x+622,960),fill=MINT,outline=INK,width=10)
        for yy in range(696,951,55):
            for xx in range(x+96,x+607,58):
                if ((xx-x)//58+yy//55)%2==0:d.rectangle((xx,yy,xx+28,yy+28),fill=(215,229,215,255))
        d.ellipse((x+193,188,x+507,502),fill=INK)
        d.ellipse((x+207,202,x+493,488),fill=CHROME)
        d.ellipse((x+230,225,x+470,465),fill=(152,205,211,255),outline=INK,width=13)
        d.arc((x+240,234,x+460,455),195,260,fill=PAPER,width=19)
        d.line((x+168,598,x+532,598),fill=INK,width=16)
        d.line((x+174,615,x+526,615),fill=CHROME,width=11)
        for yy in (90,990):
            for xx in (x+103,x+597):d.ellipse((xx-10,yy-10,xx+10,yy+10),fill=CHROME,outline=INK,width=4)
    place_art(im,DEST/'sushiSymbols/h1.png',(232,246,461,438),-7)
    place_art(im,DEST/'sushiSymbols/s.png',(932,246,1161,438),7)
    save(im,'sushiScene','door.png')
    badge=blank((900,480));bd=ImageDraw.Draw(badge)
    bd.polygon(burst(450,240,415,205,20,.74),fill=INK)
    bd.polygon(burst(450,226,392,190,20,.74),fill=RED,outline=PAPER,width=10)
    bd.rounded_rectangle((185,123,715,342),35,fill=PAPER,outline=INK,width=18)
    for sx in (120,770):
        for j in range(3):bd.line((sx,160+j*55,sx+(80 if sx<450 else -80),118+j*55),fill=INK,width=11)
    save(badge,'sushiScene','order_up_badge.png')
    im=Image.new('RGBA',(1920,1080),RED);d=ImageDraw.Draw(im)
    for k in range(0,360,18):
        a=math.radians(k);b=math.radians(k+8)
        d.polygon([(960,540),(960+1500*math.cos(a),540+1500*math.sin(a)),(960+1500*math.cos(b),540+1500*math.sin(b))],fill=YELLOW)
    d.polygon(burst(960,540,560,395,22,.84),fill=PAPER,outline=INK,width=19)
    save(im,'sushiScene','shutter.png')
    im=panel((1000,600),RED,24,30,fill=INK);d=ImageDraw.Draw(im)
    d.rounded_rectangle((58,56,942,544),20,fill=(40,53,49,255),outline=PAPER,width=10)
    save(im,'sushiScene','fs_plate.png')

def v8():
    # Card backs encode value without baking any copy into their blank centres.
    for name,fill,border in [('back_h1',RED,INK),('back_h2',PAPER,RED),('back_s',INK,YELLOW)]:
        im=blank((512,512));d=ImageDraw.Draw(im)
        d.rounded_rectangle((20,20,492,492),46,fill=fill,outline=border,width=23)
        save(im,'sushiV8',name+'.png')
    for name,accent in [('fg_intro',CYAN),('fg_total',RED)]:
        im=panel((1600,1000),accent,45,38);d=ImageDraw.Draw(im)
        d.rectangle((94,90,1506,910),outline=INK,width=11)
        save(im,'sushiV8',name+'.png')
        deco=blank((1600,1000));dd=ImageDraw.Draw(deco)
        for x,y in ((100,100),(1500,100),(100,900),(1500,900)):
            dd.polygon(burst(x,y,74,74,10,.67),fill=accent,outline=INK,width=7)
        if name=='fg_total':
            for k in range(3):dd.ellipse((1270+k*40,790-k*22,1510+k*30,870-k*18),outline=INK,width=7)
        save(deco,'sushiV8',name+'_decor.png')
    for name in ('title_free','title_total'):
        im=blank((1600,500));d=ImageDraw.Draw(im)
        d.polygon([(80,128),(240,85),(1360,85),(1520,128),(1450,250),(1520,370),(1360,410),(240,410),(80,370),(150,250)],fill=RED,outline=INK,width=20)
        d.rounded_rectangle((250,140,1350,360),20,fill=PAPER,outline=INK,width=11)
        save(im,'sushiV8',name+'.png')
    im=panel((740,1024),RED,25,25)
    d=ImageDraw.Draw(im)
    for y in (66,956):
        for x in range(82,700,48):d.rectangle((x,y,x+22,y+24),fill=INK)
    save(im,'sushiV8','menu_frame.png')
    # Blank logo sign; FeatureIntro/LoadingScreen add DINER MONKEY via Pixi text.
    im=blank((1600,600));d=ImageDraw.Draw(im)
    d.rounded_rectangle((50,60,1550,540),90,fill=INK)
    d.rounded_rectangle((65,75,1535,525),75,fill=RED,outline=CHROME,width=24)
    d.rounded_rectangle((125,135,1475,465),50,fill=PAPER,outline=INK,width=14)
    save(im,'sushiV8','logo_board.png')
    save(Image.open(DEST/'sushiSymbols/w.png').convert('RGBA'),'sushiV8','logo_stamp.png')
    for name in ('stamp','soy_empty','soy_full'):
        im=blank((512,512));d=ImageDraw.Draw(im)
        if name=='stamp':d.polygon(burst(256,256,225,225,17,.78),fill=RED,outline=INK,width=17)
        else:
            d.ellipse((75,316,437,420),fill=CHROME,outline=INK,width=12)
            d.rounded_rectangle((125,104,387,346),25,fill=PAPER,outline=INK,width=17)
            if name=='soy_full':
                d.ellipse((143,118,370,180),fill=(89,52,35,255),outline=INK,width=7)
                for x in (190,256,322):d.arc((x-30,25,x+25,150),15,180,fill=INK,width=8)
        save(im,'sushiV8',name+'.png')
    intro=[('collect','w','p',CYAN),('slice','p','low_label',PINK),('receipt','p','h1',RED)]
    for name,left,right,col in intro:
        im=blank((1024,640));d=ImageDraw.Draw(im)
        d.polygon(burst(512,320,435,270,18,.88),fill=PAPER,outline=INK,width=10)
        a=Image.open(DEST/'sushiSymbols'/f'{left}.png').convert('RGBA').resize((400,400))
        b=Image.open(DEST/'sushiSymbols'/f'{right}.png').convert('RGBA').resize((280,280))
        im.alpha_composite(a,(190,100));im.alpha_composite(b,(580,300))
        for j in range(3):d.line((650+j*22,160+j*15,895+j*18,120+j*9),fill=col,width=10)
        save(im,'sushiV8',f'intro_{name}.png')
    tier=['big','super','mega','epic','max']
    for i,name in enumerate(tier):
        im=blank((1000,560));d=ImageDraw.Draw(im)
        if i==0:
            d.polygon([(145,70),(855,70),(885,470),(115,470)],fill=PAPER,outline=INK,width=18)
            d.ellipse((476,28,524,76),fill=RED,outline=INK,width=9)
        elif i==1:
            d.rounded_rectangle((80,60,920,450),98,fill=PAPER,outline=INK,width=18)
            d.polygon([(240,450),(330,445),(280,526)],fill=PAPER,outline=INK,width=13)
        elif i==2:d.polygon(burst(500,280,455,255,18,.73),fill=RED,outline=INK,width=17)
        elif i==3:
            d.rounded_rectangle((56,45,944,515),58,fill=INK,outline=RED,width=20)
            d.rounded_rectangle((91,80,909,480),35,fill=PAPER,outline=CYAN,width=15)
        else:
            for angle in range(0,360,25):
                a=math.radians(angle);d.line((500,280,500+600*math.cos(a),280+370*math.sin(a)),fill=RED,width=21)
            d.polygon(burst(500,280,465,248,21,.77),fill=PAPER,outline=INK,width=20)
        # A clean paper island lets runtime title/numerals remain readable.
        d.rounded_rectangle((265,177,735,388),27,fill=PAPER,outline=INK,width=10)
        save(im,'sushiV8',f'win_{name}.png')
        save(im,'sushiWinBanners','superwin.png' if name=='super' else name+'.png')
        deco=blank((1000,560));dd=ImageDraw.Draw(deco)
        for j in range(i+1):
            sym='s' if i==1 else 'h1' if j%2==0 else 'h3'
            piece=Image.open(DEST/'sushiSymbols'/f'{sym}.png').convert('RGBA')
            piece.thumbnail((115,115),Image.Resampling.LANCZOS)
            x=60+(j%3)*90 if j%2==0 else 840-(j%3)*90
            y=60+(j%3)*145
            deco.alpha_composite(piece,(x,y))
        save(deco,'sushiV8',f'win_{name}_decor.png')
    # All 4 x 16 glyph files retain current widths and baseline.
    chars='0123456789.,×$+/'
    colors={'count':RED,'fs':PINK,'plate':CYAN,'receipt':INK}
    for role,col in colors.items():
        for i,char in enumerate(chars):
            path=DEST/'sushiV8'/f'digit_{role}_{i}.png'
            size=Image.open(path).size;im=blank(size);d=ImageDraw.Draw(im)
            f=font(215 if role!='receipt' else 180)
            y=198 if char in '.,' else 128
            d.text((size[0]//2+3,y+4),char,font=f,anchor='mm',fill=CHROME,stroke_width=3,stroke_fill=INK)
            d.text((size[0]//2,y),char,font=f,anchor='mm',fill=PAPER if role=='receipt' else col,stroke_width=5,stroke_fill=INK)
            save(im,'sushiV8',path.name)
    motifs=['h1','h3','h4','s','p','w']
    for i in range(16):
        im=blank((128,128))
        if i%4<3:
            src=Image.open(DEST/'sushiSymbols'/f'{motifs[i%6]}.png').convert('RGBA')
            src.thumbnail((100,100),Image.Resampling.LANCZOS)
            im.alpha_composite(src,((128-src.width)//2,(128-src.height)//2))
        else:ImageDraw.Draw(im).polygon(burst(64,64,54,54,8,.5),fill=RED,outline=INK,width=5)
        save(im,'sushiV8',f'particle_{i}.png')
    im=blank((1024,1024));d=ImageDraw.Draw(im)
    for a in range(0,360,30):
        p=math.radians(a);q=math.radians(a+12)
        d.polygon([(512,512),(512+720*math.cos(p),512+720*math.sin(p)),(512+720*math.cos(q),512+720*math.sin(q))],fill=RED if a%60 else YELLOW)
    save(im,'sushiV8','ray.png')
    atlas=blank((1280,512));p=Image.open(DEST/'sushiSymbols/h1.png').convert('RGBA')
    p.thumbnail((190,190),Image.Resampling.LANCZOS)
    for i in range(10):atlas.alpha_composite(p,((i%5)*256+(256-p.width)//2,(i//5)*256+(256-p.height)//2))
    save(atlas,'sushiWinPlates','bananas.png')
    save(contain(DEST/'sushiSymbols/h1.png',(128,128),5),'sushiFx','collect_bananas.png')

def presentation():
    """The five player-facing comic beats, all with blank live-type areas."""
    # Roadside marquee: the title remains Pixi text so localization and scaling
    # never inherit pixels from the art.
    im=blank((1600,600));d=ImageDraw.Draw(im)
    d.polygon([(85,260),(220,150),(1380,150),(1515,260),(1380,450),(220,450)],fill=INK)
    d.polygon([(105,260),(235,170),(1365,170),(1495,260),(1365,430),(235,430)],fill=RED,outline=CHROME,width=18)
    d.rounded_rectangle((185,155,1415,445),60,fill=INK)
    d.rounded_rectangle((210,180,1390,420),43,fill=PAPER,outline=CHROME,width=15)
    for x in list(range(245,1370,78)):
        d.ellipse((x-10,162,x+10,182),fill=PAPER,outline=INK,width=4)
        d.ellipse((x-10,418,x+10,438),fill=PAPER,outline=INK,width=4)
    for x in (105,1495):
        d.ellipse((x-35,224,x+35,294),fill=CYAN,outline=INK,width=9)
        d.ellipse((x-12,247,x+12,271),fill=PAPER)
    save(im,'sushiV8','logo_board.png')

    # Every explanation card is a tiny narrative panel; source characters and
    # symbols share the same linework as the reel art.
    cards=[('collect',CYAN),('slice',PINK),('receipt',RED)]
    for name,accent in cards:
        im=blank((1024,640));d=ImageDraw.Draw(im)
        d.polygon(burst(512,315,465,293,18,.83),fill=INK)
        d.polygon(burst(512,305,445,275,18,.83),fill=PAPER,outline=accent,width=15)
        dots(d,(110,95,910,545),(207,197,175,255),38,3)
        if name=='collect':
            place_art(im,APP/'design/source/mg/head_2_face_peak.png',(65,110,488,540),8)
            for box,rot in [((470,150,665,360),-13),((620,245,830,450),8),((770,150,965,355),-8)]:
                place_art(im,DEST/'sushiSymbols/p.png',box,rot)
            speed_lines(d,405,470,890,500,accent,4,13)
        elif name=='slice':
            place_art(im,APP/'design/source/fg/head_2_face_peak.png',(40,90,425,530),-7)
            place_art(im,DEST/'sushiSymbols/low_label.png',(435,150,690,445),13)
            place_art(im,DEST/'sushiSymbols/p.png',(690,140,975,480),-13)
            speed_lines(d,410,490,910,360,accent,4,15)
            for x,y in ((755,105),(858,510),(929,220)):
                d.polygon(burst(x,y,42,42,8,.45),fill=accent,outline=INK,width=5)
        else:
            # A long unprinted diner ticket curls out of its machine.
            d.rounded_rectangle((95,115,516,350),30,fill=CHROME,outline=INK,width=17)
            d.rounded_rectangle((140,160,480,335),14,fill=INK)
            d.polygon([(210,309),(565,292),(790,520),(572,561),(450,475),(250,463)],fill=PAPER,outline=INK,width=16)
            for j in range(5):
                yy=351+j*31;d.line((280,yy,520+j*38,yy+13),fill=(132,127,111,255),width=6)
            place_art(im,DEST/'sushiSymbols/h1.png',(610,80,930,365),-12)
            for x,y in ((575,145),(885,440)):
                d.polygon(burst(x,y,44,44,7,.5),fill=accent,outline=INK,width=5)
        save(im,'sushiV8',f'intro_{name}.png')

    # Ticket-like frame behind the three panels, leaving ample space for text.
    frame=panel((740,1024),RED,18,29);fd=ImageDraw.Draw(frame)
    for y in (36,980):
        for x in range(54,712,39):fd.rectangle((x,y,x+19,y+19),fill=INK)
    fd.rounded_rectangle((43,63,697,952),20,outline=CYAN,width=7)
    for x,y in ((71,79),(669,79),(71,933),(669,933)):
        fd.ellipse((x-9,y-9,x+9,y+9),fill=RED,outline=INK,width=4)
    save(frame,'sushiV8','menu_frame.png')

    # FG invitation: a lit diner menu board and giant untouched paper field.
    for name,col in [('fg_intro',CYAN),('fg_total',RED)]:
        im=blank((1600,1000));d=ImageDraw.Draw(im)
        d.polygon([(95,83),(1505,83),(1548,150),(1548,908),(1478,953),(122,953),(52,908),(52,150)],fill=INK)
        d.rounded_rectangle((84,90,1516,923),40,fill=col,outline=CHROME,width=20)
        d.rounded_rectangle((132,126,1468,895),30,fill=INK)
        d.rounded_rectangle((170,255,1430,864),23,fill=PAPER,outline=CHROME,width=14)
        for x in range(198,1430,82):
            d.ellipse((x-13,168,x+13,194),fill=YELLOW if name=='fg_intro' else RED,outline=INK,width=5)
        # The lower paper edge stays open for the subtitle; the old row of
        # checkerboard teeth read as a stray line at game scale.
        save(im,'sushiV8',f'{name}.png')
        deco=blank((1600,1000));dd=ImageDraw.Draw(deco)
        if name=='fg_intro':
            place_art(deco,DEST/'sushiSymbols/s.png',(105,90,390,315),-12)
            place_art(deco,DEST/'sushiSymbols/s.png',(1210,90,1495,315),12)
            for j in range(3):
                dd.line((245-j*22,277+j*24,105-j*18,387+j*33),fill=RED,width=11)
                dd.line((1355+j*22,277+j*24,1495+j*18,387+j*33),fill=RED,width=11)
        else:
            for j in range(4):
                place_art(deco,DEST/'sushiSymbols/h1.png',(40+j*38,686-j*42,190+j*50,862-j*42),(-1)**j*13)
                dd.ellipse((1335+j*25,707-j*47,1510+j*16,785-j*47),fill=PAPER,outline=INK,width=10)
        save(deco,'sushiV8',f'{name}_decor.png')
    for name,col in [('title_free',RED),('title_total',CYAN)]:
        ribbon=blank((1600,500));rd=ImageDraw.Draw(ribbon)
        rd.polygon([(80,115),(280,65),(1320,65),(1520,115),(1445,245),(1520,385),(1320,430),(280,430),(80,385),(155,245)],fill=INK)
        rd.polygon([(111,123),(295,87),(1305,87),(1489,123),(1415,245),(1489,377),(1305,408),(295,408),(111,377),(185,245)],fill=col,outline=PAPER,width=16)
        rd.rounded_rectangle((256,145,1344,350),18,fill=PAPER,outline=INK,width=13)
        save(ribbon,'sushiV8',name+'.png')

    # Five distinct escalating comic silhouettes. The red header and cream
    # amount well deliberately match Win.svelte's live title/number positions.
    tiers=['big','super','mega','epic','max']
    for i,name in enumerate(tiers):
        im=blank((1000,560));d=ImageDraw.Draw(im)
        if i==0:
            d.polygon([(114,37),(860,37),(887,501),(138,501)],fill=PAPER,outline=INK,width=20)
            for yy in (48,500):
                for xx in range(170,858,44):d.ellipse((xx-5,yy-5,xx+5,yy+5),fill=INK)
        elif i==1:
            d.rounded_rectangle((73,30,928,474),96,fill=CYAN,outline=INK,width=20)
            d.polygon([(240,457),(357,450),(272,534)],fill=CYAN,outline=INK,width=15)
        elif i==2:
            d.polygon(burst(500,276,475,270,18,.72),fill=RED,outline=INK,width=21)
        elif i==3:
            d.rounded_rectangle((47,19,953,541),75,fill=INK,outline=RED,width=24)
            d.rounded_rectangle((76,47,924,514),52,outline=CYAN,width=19)
            for x in range(132,915,86):d.ellipse((x-11,41,x+11,63),fill=PAPER)
        else:
            for a in range(0,360,18):
                rad=math.radians(a);rad2=math.radians(a+8)
                d.polygon([(500,280),(500+700*math.cos(rad),280+440*math.sin(rad)),(500+700*math.cos(rad2),280+440*math.sin(rad2))],fill=RED if a%36 else YELLOW)
            d.polygon(burst(500,280,479,266,23,.75),fill=PAPER,outline=INK,width=19)
        d.rounded_rectangle((205,85,795,244),28,fill=RED,outline=INK,width=16)
        d.rounded_rectangle((250,255,750,464),28,fill=PAPER,outline=INK,width=14)
        for xx in (227,773):
            for yy in (282,427):d.ellipse((xx-8,yy-8,xx+8,yy+8),fill=CHROME,outline=INK,width=3)
        save(im,'sushiV8',f'win_{name}.png')
        save(im,'sushiWinBanners','superwin.png' if name=='super' else name+'.png')
        deco=blank((1000,560));dd=ImageDraw.Draw(deco)
        if name=='big':
            place_art(deco,DEST/'sushiSymbols/h1.png',(38,220,235,488),-12)
            dd.line((802,290,948,254),fill=INK,width=16)
            dd.line((820,340,970,328),fill=INK,width=11)
        elif name=='super':
            for box,ang in [((15,210,230,490),-12),((770,205,985,490),12)]:place_art(deco,DEST/'sushiSymbols/s.png',box,ang)
        elif name=='mega':
            place_art(deco,DEST/'sushiSymbols/h1.png',(5,195,238,501),-15)
            place_art(deco,DEST/'sushiSymbols/h3.png',(765,170,990,475),15)
        elif name=='epic':
            for x in (95,900):
                for j in range(4):dd.polygon(burst(x,135+j*98,28,42,6,.55),fill=RED,outline=INK,width=4)
            place_art(deco,DEST/'sushiSymbols/h2.png',(0,225,210,517),-12)
        else:
            place_art(deco,APP/'design/source/mg/head_2_face_peak.png',(7,155,255,485),10)
            place_art(deco,APP/'design/source/fg/head_2_face_peak.png',(745,155,993,485),-10)
        save(deco,'sushiV8',f'win_{name}_decor.png')

def promo():
    thumb=fit(SRC/'thumbnail_bg.png',(1024,1024))
    thumb.save(APP/'design/thumbnail/BG.png')
    mg=contain(SRC/'master_full.png',(1024,1024),8)
    mg.save(APP/'design/thumbnail/FG.png')
    comp=thumb.copy();comp.alpha_composite(mg)
    comp.resize((200,200),Image.Resampling.LANCZOS).save(APP/'design/thumbnail/composite_200.png')
    cover=ImageOps.fit(thumb,(1920,1080),Image.Resampling.LANCZOS,centering=(.45,.5))
    cover.save(APP/'design/cover/DinerMonkey-Cover-BG.png')
    fg=contain(SRC/'master_full.png',(1920,1080),20)
    fg.save(APP/'design/cover/DinerMonkey-Cover-FG.png')

def sheet():
    files=list(sorted((DEST/'sushiSymbols').glob('*.png')))
    files+=[DEST/'sushiUi/bar_strip.png',DEST/'sushiUi/spin_plate.png',DEST/'sushiBackground/bg_base.png',DEST/'sushiBackground/bg_feature.png']
    w=1000;cell=(200,210);out=Image.new('RGB',(w,math.ceil(len(files)/5)*cell[1]),PAPER[:3]);d=ImageDraw.Draw(out)
    for i,p in enumerate(files):
        im=Image.open(p).convert('RGBA');im.thumbnail((175,175),Image.Resampling.LANCZOS)
        x=(i%5)*200+(200-im.width)//2;y=(i//5)*210+5
        out.paste(im,(x,y),im)
        d.text(((i%5)*200+100,(i//5)*210+194),p.stem,anchor='mm',fill=INK[:3],font=ImageFont.truetype('C:/Windows/Fonts/arial.ttf',17))
    target=SRC/'_sheets';target.mkdir(parents=True,exist_ok=True)
    out.save(target/'diner_art_contact.png')
    # A complete delivery index, including the four digit sets and particles.
    # The smaller sheet above is the quick visual read; this one catches missing
    # or accidentally old assets before a batch is handed off.
    all_files=sorted(p for p in DEST.glob('sushi*/*.png') if p.parent.name!='sushiFx' or p.name=='collect_bananas.png')
    all_files += [APP/'design/thumbnail/composite_200.png',APP/'design/cover/DinerMonkey-Cover-BG.png',APP/'design/cover/DinerMonkey-Cover-FG.png']
    cols=10;cw,ch=125,145
    full=Image.new('RGB',(cols*cw,math.ceil(len(all_files)/cols)*ch),PAPER[:3]);fd=ImageDraw.Draw(full)
    small_font=ImageFont.truetype('C:/Windows/Fonts/arial.ttf',11)
    for i,p in enumerate(all_files):
        item=Image.open(p).convert('RGBA');item.thumbnail((113,112),Image.Resampling.LANCZOS)
        x=(i%cols)*cw+(cw-item.width)//2;y=(i//cols)*ch+3
        full.paste(item,(x,y),item)
        fd.text(((i%cols)*cw+cw//2,(i//cols)*ch+128),p.stem,anchor='mm',fill=INK[:3],font=small_font)
    full.save(target/'diner_all_assets_contact.png')
    featured=[('TITLE','sushiV8/logo_board.png'),('CHEF','sushiV8/intro_collect.png'),
        ('FREE SPINS','sushiV8/intro_slice.png'),('MAX WIN','sushiV8/intro_receipt.png'),
        ('DOORS','sushiScene/door.png'),('ORDER UP','sushiScene/order_up_badge.png'),
        ('FG SIGN','sushiV8/fg_intro.png'),('BIG','sushiV8/win_big.png'),
        ('SUPER','sushiV8/win_super.png'),('MEGA','sushiV8/win_mega.png'),
        ('EPIC','sushiV8/win_epic.png'),('MAX','sushiV8/win_max.png')]
    featured_sheet=Image.new('RGB',(1600,math.ceil(len(featured)/3)*315),PAPER[:3]);sd=ImageDraw.Draw(featured_sheet)
    label_font=ImageFont.truetype('C:/Windows/Fonts/arial.ttf',18)
    for i,(label,rel) in enumerate(featured):
        item=Image.open(DEST/rel).convert('RGBA')
        if rel.startswith('sushiV8/win_') or rel=='sushiV8/fg_intro.png':
            decor=DEST/rel.replace('.png','_decor.png')
            if decor.exists():item.alpha_composite(Image.open(decor).convert('RGBA'))
        item.thumbnail((500,275),Image.Resampling.LANCZOS)
        x=(i%3)*533+(533-item.width)//2;y=(i//3)*315+5
        featured_sheet.paste(item,(x,y),item)
        sd.text(((i%3)*533+266,(i//3)*315+292),label,anchor='mm',fill=INK[:3],font=label_font)
    featured_sheet.save(target/'diner_presentation_contact.png')

def main():
    symbols();backgrounds_frames();background_props();ui();scene();v8();presentation();promo();sheet()
    print('Diner Monkey sprites, UI bar, promo, and contact sheet exported')

if __name__=='__main__':main()
