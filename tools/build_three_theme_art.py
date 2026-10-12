"""Build the three Jade-derived visual skins from their original source art.

Run from anywhere: python wp/tools/build_three_theme_art.py
The generated source illustrations remain in each app's design/source folder.
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageOps, ImageEnhance, ImageFont, ImageFilter
import math

ROOT = Path(__file__).resolve().parents[1] / 'apps'
THEMES = {
    'monkeyking': dict(app='MonkeyKingRush齊天大聖', ink='#172b3e', paper='#fff6df',
        accent='#d93629', secondary='#227f86', highlight='#f5bb48', title='MONKEY KING RUSH',
        motif='cloud', cover='MonkeyKingRush'),
    'pocha': dict(app='PochaMonkey韓式路邊攤', ink='#202638', paper='#fff4e8',
        accent='#e94036', secondary='#20a6b4', highlight='#ffd34d', title='POCHA MONKEY',
        motif='canopy', cover='PochaMonkey'),
    'swing': dict(app='SwingMonkey爵士俱樂部', ink='#241d1c', paper='#f8e8c6',
        accent='#a82b35', secondary='#926543', highlight='#ecc06a', title='SWING MONKEY',
        motif='record', cover='SwingMonkey'),
}

def rgba(hexcolor):
    return tuple(bytes.fromhex(hexcolor.lstrip('#'))) + (255,)

def blank(size): return Image.new('RGBA', size, (0, 0, 0, 0))

def contain(path, size, pad=16):
    im = Image.open(path).convert('RGBA')
    box = im.getchannel('A').getbbox()
    if box: im = im.crop(box)
    im.thumbnail((size[0]-2*pad, size[1]-2*pad), Image.Resampling.LANCZOS)
    out = blank(size)
    out.alpha_composite(im, ((size[0]-im.width)//2, (size[1]-im.height)//2))
    return out

def fit(path, size):
    return ImageOps.fit(Image.open(path).convert('RGBA'), size, Image.Resampling.LANCZOS)

def burst(cx, cy, rx, ry, points=16):
    return [(round(cx+rx*(1 if i%2 == 0 else .79)*math.cos(math.pi*i/points-math.pi/2)),
             round(cy+ry*(1 if i%2 == 0 else .79)*math.sin(math.pi*i/points-math.pi/2)))
            for i in range(points*2)]

def make(theme, cfg):
    app = ROOT / cfg['app']; src = app/'design/source'/theme
    sprites = app/'static/assets/sprites'; ink=rgba(cfg['ink']); paper=rgba(cfg['paper'])
    accent=rgba(cfg['accent']); secondary=rgba(cfg['secondary']); hi=rgba(cfg['highlight'])
    def save(group, name, im):
        p=sprites/group/name; p.parent.mkdir(parents=True, exist_ok=True); im.save(p, optimize=True)
    def art(name, size): return contain(src/'symbols'/f'{name}.png', size)
    # The two hand props are separate in the rig, so FG can throw its own item.
    prop_sheet=Image.open(src/'throw_props.png').convert('RGBA')
    for cast,region in (('mg',(0,0,prop_sheet.width//2,prop_sheet.height)),
                        ('fg',(prop_sheet.width//2,0,prop_sheet.width,prop_sheet.height))):
        piece=prop_sheet.crop(region)
        bounds=piece.getchannel('A').getbbox()
        if bounds: piece=piece.crop(bounds)
        piece.thumbnail((232,232),Image.Resampling.LANCZOS)
        prop=blank((256,256))
        prop.alpha_composite(piece,((256-piece.width)//2,(256-piece.height)//2))
        prop_dir=src/'props';prop_dir.mkdir(parents=True,exist_ok=True)
        prop.save(prop_dir/f'{cast}.png',optimize=True)
    def panel(size, edge=accent, inner=paper, margin=18):
        im=blank(size); d=ImageDraw.Draw(im);w,h=size
        d.rounded_rectangle((margin,margin,w-margin,h-margin),32,fill=ink,outline=ink,width=7)
        d.rounded_rectangle((margin+12,margin+12,w-margin-12,h-margin-12),24,fill=inner,outline=edge,width=10)
        return im
    # Seven independently generated, genuinely transparent symbols.
    for name in ('w','p','s','h1','h2','h3','h4'):
        save('sushiSymbols',f'{name}.png',art(name,(512,512)))
    for i in range(1,6):
        im=panel((512,512),[accent,secondary,hi,paper,accent][i-1],paper,42)
        d=ImageDraw.Draw(im)
        if theme=='monkeyking':
            d.rectangle((86,72,426,118),fill=accent)
            d.polygon([(86,396),(426,396),(390,444),(122,444)],fill=accent)
        elif theme=='pocha':
            for x in range(75,440,65): d.rectangle((x,75,x+30,95),fill=secondary)
            d.rectangle((92,414,420,431),fill=secondary)
        else:
            d.ellipse((80,80,432,432),outline=ink,width=10)
            d.ellipse((105,105,407,407),outline=secondary,width=6)
        save('sushiSymbols',f'l{i}.png',im)
    save('sushiSymbols','low_label.png',panel((512,512),secondary,paper,42))
    # Shadow meshes follow the new silhouettes, rather than the tea utensils.
    for name in ('w','p','s','h1','h2','h3','h4'):
        original=sprites/'jadeMesh'/f'{name}_shadow.png'
        if original.exists():
            size=Image.open(original).size
            alpha=art(name,size).getchannel('A').filter(ImageFilter.GaussianBlur(max(3,size[0]//48)))
            shadow=Image.new('RGBA',size,ink)
            shadow.putalpha(alpha.point(lambda v:int(v*.42)))
            save('jadeMesh',f'{name}_shadow.png',shadow)
    # Three source panels are one deliberate narrative sequence. Their wide
    # runtime cards use plain paper margins so the art has no side stripes.
    strip=Image.open(src/'intro_triptych.png').convert('RGB'); third=strip.width//3
    for i,name in enumerate(('collect','slice','receipt')):
        tile=strip.crop((i*third+8,0,(i+1)*third-8,strip.height))
        tile=ImageOps.fit(tile,(640,640),Image.Resampling.LANCZOS)
        im=Image.new('RGBA',(1024,640),paper)
        im.alpha_composite(tile.convert('RGBA'),(192,0))
        save('sushiV8',f'intro_{name}.png',im)
    # Environment plates. Feature light changes are generated from the same
    # viewpoint so the board and character do not jump on transition.
    base=fit(src/'background_base.png',(1920,1080)).convert('RGB')
    save('sushiBackground','bg_base.png',base.convert('RGBA'))
    feature=ImageEnhance.Color(base).enhance(1.2)
    wash=Image.new('RGB',base.size,cfg['accent'])
    feature=Image.blend(feature,wash,.12 if theme!='swing' else .08)
    save('sushiBackground','bg_feature.png',feature.convert('RGBA'))
    # Reel frame, controls, menu, title and bonus cards share one local visual
    # grammar per theme instead of the inherited teahouse green.
    fb=panel((1280,1280),secondary,paper,58)
    save('sushiFrame','frame_bg.png',fb)
    edge=blank((1280,1280));d=ImageDraw.Draw(edge)
    for inset,color,width in ((26,ink,24),(48,accent,19),(70,hi,10)):
        d.rounded_rectangle((inset,inset,1280-inset,1280-inset),48,outline=color,width=width)
    save('sushiFrame','frame_edge.png',edge)
    bar=panel((1600,200),accent,paper if theme in ('monkeyking','pocha') else ink,4); d=ImageDraw.Draw(bar)
    if theme=='monkeyking':
        # The bottom strip is a reading surface. Keep its centre quiet so the
        # balance, win and bet labels retain contrast at phone size.
        d.rounded_rectangle((30,27,1570,171),23,outline=secondary,width=5)
        d.line((82,37,1518,37),fill=hi,width=5)
        d.line((82,160,1518,160),fill=hi,width=4)
        for x,flip in ((43,1),(1557,-1)):
            d.arc((x-25,72,x+25,130),205 if flip==1 else 25,345 if flip==1 else 165,
                  fill=secondary,width=6)
    elif theme=='pocha':
        # A bright counter receipt with a thin awning trim. Keep the middle
        # clear for balance, win and bet instead of running diagonal stripes
        # behind the values.
        d.rounded_rectangle((27,27,1573,171),20,outline=secondary,width=5)
        d.line((72,38,1528,38),fill=hi,width=7)
        d.line((72,160,1528,160),fill=hi,width=4)
        for x in (45,1555):
            d.ellipse((x-12,87,x+12,111),fill=accent,outline=ink,width=3)
    else:
        d.line((30,45,1570,45),fill=hi,width=9)
    if theme=='swing':
        for x in range(80,1580,100): d.ellipse((x,10,x+22,32),fill=hi)
    save('sushiUi','bar_strip.png',bar)
    for name,color in [('spin_plate',accent),('button_plate',ink),('button_print',ink),('button_print_on',secondary)]:
        im=blank((256,256));d=ImageDraw.Draw(im)
        d.ellipse((9,9,247,247),fill=ink)
        d.ellipse((20,20,236,236),fill=color,outline=paper,width=11)
        d.arc((40,40,216,216),193,320,fill=hi,width=13)
        save('sushiUi',f'{name}.png',im)
    # UI pictograms keep their existing readable geometry, with theme ink.
    icon_dir=sprites/'sushiIcons'
    for p in icon_dir.glob('*.png'):
        im=Image.open(p).convert('RGBA')
        alpha=im.getchannel('A')
        colored=Image.new('RGBA',im.size,paper if theme!='swing' else hi)
        colored.putalpha(alpha)
        save('sushiIcons',p.name,colored)
    for lit in (False,True):
        if theme=='monkeyking':
            # A compact, horizontal palace pass. The open centre belongs to the
            # localized caption; ornament stays in the two side caps.
            im=blank((768,384));d=ImageDraw.Draw(im)
            d.rounded_rectangle((12,46,756,338),42,fill=ink)
            d.rounded_rectangle((21,54,747,330),36,fill=hi if lit else accent)
            d.rounded_rectangle((33,66,735,318),28,fill=paper)
            d.rounded_rectangle((47,80,721,304),19,outline=secondary,width=7)
            d.line((126,100,642,100),fill=hi,width=8)
            d.line((126,283,642,283),fill=hi,width=7)
            # Gold seals and cloud curls give this an identity without making
            # the button a large blank square.
            for cx in (88,680):
                d.ellipse((cx-25,166,cx+25,216),fill=hi,outline=ink,width=5)
                d.arc((cx-14,175,cx+14,203),20,300,fill=accent,width=5)
            d.arc((58,99,174,183),170,350,fill=secondary,width=6)
            d.arc((594,201,710,285),0,180,fill=secondary,width=6)
            if lit:
                d.rounded_rectangle((48,80,720,303),18,outline=accent,width=8)
        elif theme=='pocha':
            # Small food-stall order ticket: solid silhouette, no giant empty
            # square and no decorative stars around the food artwork.
            im=blank((768,384));d=ImageDraw.Draw(im)
            d.rounded_rectangle((13,48,755,336),35,fill=ink)
            d.rounded_rectangle((22,55,746,329),30,fill=hi if lit else accent)
            d.rounded_rectangle((34,68,734,316),23,fill=paper)
            d.rounded_rectangle((48,81,720,303),15,outline=secondary,width=6)
            for x in range(64,720,52):
                d.rectangle((x,72,x+26,88),fill=accent if lit else secondary)
            d.line((119,280,649,280),fill=secondary,width=7)
            for cx in (85,683):
                d.ellipse((cx-23,165,cx+23,211),fill=accent,outline=ink,width=4)
                d.line((cx-11,189,cx+11,189),fill=paper,width=5)
            if lit:
                d.rounded_rectangle((48,81,720,303),15,outline=accent,width=7)
        else:
            im=panel((512,512),hi if lit else accent,paper,35)
        if theme=='swing':
            d=ImageDraw.Draw(im);d.ellipse((54,54,458,458),outline=ink,width=14)
        save('sushiUi','buybonus_plate_lit.png' if lit else 'buybonus_plate.png',im)
    for name,sym in [('bonus','p'),('superbonus','w')]:
        im=panel((600,840),secondary if name=='bonus' else accent,paper,20)
        im.alpha_composite(art(sym,(330,330)),(135,70))
        d=ImageDraw.Draw(im)
        for y in (475,540,605): d.line((105,y,495,y),fill=secondary,width=6)
        save('sushiUi',f'card_{name}.png',im)
    save('sushiUi','ticker_plate.png',panel((652,146),secondary,paper,6))
    mf=panel((740,1024),accent,paper,18);d=ImageDraw.Draw(mf)
    if theme=='monkeyking':
        for y in (34,981): d.rounded_rectangle((23,y,717,y+15),7,fill=ink)
    elif theme=='swing':
        for x in range(65,700,100):d.ellipse((x,26,x+22,48),fill=hi)
    else:
        for x in range(62,700,52):d.line((x,27,x+24,59),fill=secondary,width=7)
    save('sushiV8','menu_frame.png',mf)
    logo=panel((1600,600),accent,paper,45)
    d=ImageDraw.Draw(logo)
    if theme=='swing':
        for x in (100,1500): d.ellipse((x-44,255,x+44,343),fill=ink,outline=hi,width=10)
    elif theme=='monkeyking':
        d.polygon(burst(800,300,720,268,23),outline=accent,width=19)
    else:
        for x in range(115,1500,80):d.ellipse((x-10,60,x+10,80),fill=hi)
    # Logo copy is typeset here, not baked into any image-generation prompt.
    font_path=app/'static/fonts/sushi'
    display_font={
        'monkeyking':'MaShanZheng-Latin.ttf',
        'pocha':'BlackHanSans-Regular.ttf',
        'swing':'Shrikhand-Regular.ttf',
    }.get(theme,'Anton-Regular.ttf')
    candidates=[font_path/display_font,font_path/'Anton-Regular.ttf',Path('C:/Windows/Fonts/arialbd.ttf')]
    chosen=next((p for p in candidates if p.exists()),candidates[-1])
    size=183
    while size>50:
        f=ImageFont.truetype(str(chosen),size)
        if d.textbbox((0,0),cfg['title'],font=f,stroke_width=2)[2]<1250:break
        size-=4
    d.text((800,300),cfg['title'],font=f,anchor='mm',fill=accent,stroke_width=4,stroke_fill=ink)
    save('sushiV8','logo_board.png',logo)
    save('sushiV8','logo_stamp.png',art('w',(512,512)))
    for name,col,edge in [('back_h1',accent,ink),('back_h2',paper,accent),('back_s',secondary,hi)]:
        save('sushiV8',f'{name}.png',panel((512,512),edge,col,18))
    for name,col in [('soy_empty',secondary),('soy_full',hi),('stamp',accent)]:
        im=blank((512,512));d=ImageDraw.Draw(im)
        if name=='stamp':d.polygon(burst(256,256,223,223,18),fill=col,outline=ink,width=15)
        else:
            d.ellipse((65,65,447,447),fill=paper if name=='soy_empty' else col,outline=ink,width=17)
            d.ellipse((116,116,396,396),outline=secondary,width=12)
        save('sushiV8',f'{name}.png',im)
    # Four numerals systems, each sized to its existing runtime texture.
    digit_chars='0123456789.,×$+/'
    role_color={'count':accent,'fs':hi,'plate':secondary,'receipt':ink}
    for role,col in role_color.items():
        for i,ch in enumerate(digit_chars):
            path=sprites/'sushiV8'/f'digit_{role}_{i}.png'
            if not path.exists():continue
            size=Image.open(path).size
            im=blank(size);d=ImageDraw.Draw(im)
            font_size=min(215,max(90,int(size[1]*.78)))
            f=ImageFont.truetype(str(chosen),font_size)
            d.text((size[0]//2,size[1]//2),ch,font=f,anchor='mm',fill=paper if role=='receipt' else col,
                   stroke_width=5,stroke_fill=ink)
            save('sushiV8',path.name,im)
    for name,col in [('fg_intro',secondary),('fg_total',accent)]:
        im=blank((1600,1000));d=ImageDraw.Draw(im)
        if theme=='monkeyking':
            # A heavenly edict unfurls between two red/gold scroll rollers.
            d.rounded_rectangle((145,105,1455,905),42,fill=ink,outline=hi,width=18)
            d.rounded_rectangle((213,124,1387,886),25,fill=paper,outline=accent,width=15)
            for x in (105,1450):
                d.rounded_rectangle((x,75,x+45,930),18,fill=accent,outline=ink,width=10)
                for y in (105,850):d.ellipse((x-8,y,x+53,y+45),fill=hi,outline=ink,width=7)
            for x in range(290,1320,125): d.arc((x,166,x+90,246),180,350,fill=secondary,width=9)
        elif theme=='pocha':
            # An oversized order ticket hangs from the striped stall awning.
            d.rounded_rectangle((190,65,1410,935),28,fill=paper,outline=ink,width=22)
            for x in range(210,1400,105):
                d.rectangle((x,66,x+52,167),fill=accent,outline=ink,width=5)
                d.rectangle((x+52,66,x+105,167),fill=paper,outline=ink,width=5)
            d.rounded_rectangle((265,205,1335,842),25,outline=secondary,width=15)
            # Keep the ticket's top trim; the lower rule ran behind the caption.
            d.line((280,245,1320,245),fill=hi,width=12)
            for y in range(145,950,64):
                d.ellipse((170,y,210,y+27),fill=ink)
                d.ellipse((1390,y,1430,y+27),fill=ink)
        else:
            # Jazz intertitle: velvet frame and side lamps leave the lettering
            # field clear. The old iris arcs and rails crossed both captions.
            d.rounded_rectangle((65,45,1535,955),75,fill=ink,outline=hi,width=18)
            d.rounded_rectangle((135,105,1465,895),55,fill=paper,outline=accent,width=28)
            for x in (190,1410):
                for y in (220,350,480,610,740):d.ellipse((x-17,y-17,x+17,y+17),fill=hi)
        save('sushiV8',f'{name}.png',im)
        deco=blank((1600,1000))
        for sym,x,y in ([('w',75,55),('p',1300,705)] if name=='fg_intro' else [('p',70,720),('w',1300,55)]):
            deco.alpha_composite(art(sym,(220,220)),(x,y))
        save('sushiV8',f'{name}_decor.png',deco)
    for name in ('title_free','title_total'):
        im=blank((1600,500));d=ImageDraw.Draw(im)
        if theme=='monkeyking':
            d.polygon([(80,110),(1520,110),(1450,390),(150,390)],fill=paper,outline=ink,width=18)
            d.rectangle((155,125,1445,375),outline=accent,width=14)
            for x in (85,1515):d.ellipse((x-55,192,x+55,302),fill=hi,outline=ink,width=12)
            for x in range(250,1430,150):d.arc((x,340,x+105,430),190,350,fill=secondary,width=10)
        elif theme=='pocha':
            d.rounded_rectangle((95,70,1505,430),28,fill=paper,outline=ink,width=17)
            d.rounded_rectangle((170,125,1430,375),20,outline=secondary,width=13)
            for x in range(100,1500,120):d.rectangle((x,53,x+58,117),fill=accent,outline=ink,width=5)
            for x in (140,1460):d.ellipse((x-25,230,x+25,280),fill=ink)
        else:
            d.polygon([(120,90),(1480,90),(1410,245),(1480,410),(120,410),(190,245)],fill=accent,outline=ink,width=20)
            d.polygon([(210,135),(1390,135),(1365,365),(235,365)],fill=paper,outline=hi,width=12)
            for x in (140,1460):d.polygon(burst(x,250,56,56,8),fill=hi,outline=ink,width=8)
        save('sushiV8',f'{name}.png',im)
    for i,name in enumerate(('big','super','mega','epic','max')):
        im=blank((1000,560));d=ImageDraw.Draw(im)
        if i in (0,1):d.rounded_rectangle((70-i*20,45-i*15,930+i*20,520+i*15),55,fill=accent,outline=ink,width=22)
        elif i==2:d.polygon(burst(500,280,470,265,18),fill=accent,outline=ink,width=18)
        elif i==3:
            d.rounded_rectangle((25,15,975,545),30,fill=ink,outline=hi,width=22)
            d.rounded_rectangle((75,65,925,495),20,fill=secondary,outline=paper,width=12)
        else:
            for a in range(0,360,20):
                q=math.radians(a);d.line((500,280,500+600*math.cos(q),280+380*math.sin(q)),fill=hi,width=22)
            d.polygon(burst(500,280,470,270,20),fill=accent,outline=ink,width=19)
        d.rounded_rectangle((210,85,790,246),25,fill=accent,outline=ink,width=13)
        d.rounded_rectangle((255,265,745,465),25,fill=paper,outline=ink,width=13)
        save('sushiV8',f'win_{name}.png',im)
        save('sushiWinBanners','superwin.png' if name=='super' else f'{name}.png',im)
        deco=blank((1000,560))
        deco.alpha_composite(art(('h1','s','p','w','w')[i],(180+35*i,180+35*i)),(20,240-20*i))
        save('sushiV8',f'win_{name}_decor.png',deco)
    # Intro scene and feature transition receive theme cues.
    save('sushiScene','chef_cut_in.png',contain(src/'apprentice_full.png',(1024,1024),40))
    roof=blank((1920,420));d=ImageDraw.Draw(roof)
    d.rectangle((0,0,1919,100),fill=ink)
    if theme=='monkeyking':
        d.rectangle((0,55,1919,210),fill=accent,outline=hi,width=15)
        for x in range(0,1920,160):
            d.arc((x,125,x+195,375),0,180,fill=hi,width=19)
            d.ellipse((x+68,120,x+115,168),fill=hi,outline=ink,width=5)
    elif theme=='pocha':
        for x in range(0,1920,160):
            d.rectangle((x,75,x+80,350),fill=accent,outline=ink,width=10)
            d.rectangle((x+80,75,x+160,350),fill=paper,outline=ink,width=10)
            d.arc((x,270,x+160,410),0,180,fill=secondary,width=13)
    else:
        d.rectangle((0,75,1919,390),fill=accent,outline=hi,width=17)
        for x in range(0,1920,125):
            d.line((x,90,x-35,375),fill=ink,width=17)
            d.line((x+30,95,x+5,360),fill=secondary,width=9)
        d.line((0,385,1920,385),fill=hi,width=17)
    save('sushiScene','noren.png',roof)
    door=Image.open(src/'transition_door.png').convert('RGBA').resize((1400,1080),Image.Resampling.LANCZOS)
    save('sushiScene','door.png',door)
    shutter=blank((1920,1080));d=ImageDraw.Draw(shutter)
    d.rectangle((0,0,1919,1079),fill=ink)
    if theme=='swing':
        for r in (1080,870,660,450,250):d.ellipse((960-r,540-r*.57,960+r,540+r*.57),outline=accent if r%2 else paper,width=70)
        d.ellipse((725,310,1195,770),fill=paper,outline=hi,width=22)
    elif theme=='pocha':
        for y in range(0,1080,150):
            d.rectangle((0,y,1919,y+75),fill=accent)
            d.line((0,y,1919,y),fill=paper,width=13)
        d.rounded_rectangle((510,225,1410,855),35,fill=paper,outline=secondary,width=35)
    else:
        for a in range(0,360,16):
            q=math.radians(a);d.line((960,540,960+1400*math.cos(q),540+900*math.sin(q)),fill=hi,width=35)
        d.polygon(burst(960,540,610,390,20),fill=paper,outline=accent,width=25)
    save('sushiScene','shutter.png',shutter)
    save('sushiScene','fs_plate.png',panel((1000,600),accent,paper,25))
    # Symbol-driven ancillary effects replace the most visible old fruit art.
    save('sushiFx','collect_bananas.png',art('p',(128,128)))
    atlas=blank((1280,512))
    for i in range(10):atlas.alpha_composite(art('p',(240,240)),((i%5)*256+8,(i//5)*256+8))
    save('sushiWinPlates','bananas.png',atlas)
    for i in range(16):save('sushiV8',f'particle_{i}.png',art(('p','s','h1','h4')[i%4],(128,128)))
    ray=blank((1024,1024));rd=ImageDraw.Draw(ray)
    for a in range(0,360,24):
        q=math.radians(a);r=math.radians(a+11)
        rd.polygon([(512,512),(512+720*math.cos(q),512+720*math.sin(q)),
                    (512+720*math.cos(r),512+720*math.sin(r))],fill=accent if a%48 else hi)
    save('sushiV8','ray.png',ray)
    # Submission artwork: separate background and transparent foreground.
    thumb_dir=app/'design/thumbnail'; cover_dir=app/'design/cover'
    thumb_dir.mkdir(exist_ok=True);cover_dir.mkdir(exist_ok=True)
    ImageOps.fit(base,(1024,1024),Image.Resampling.LANCZOS,centering=(.49,.5)).save(thumb_dir/'BG.png')
    mg=contain(src/'master_full.png',(1024,1024),10);mg.save(thumb_dir/'FG.png')
    comp=Image.open(thumb_dir/'BG.png').convert('RGBA');comp.alpha_composite(mg)
    comp.resize((200,200),Image.Resampling.LANCZOS).save(thumb_dir/'composite_200.png')
    base.save(cover_dir/f"{cfg['cover']}-Cover-BG.png")
    contain(src/'master_full.png',(1920,1080),25).save(cover_dir/f"{cfg['cover']}-Cover-FG.png")
    # Compact contact sheet checks the core art and the three explanation beats.
    paths=[sprites/'sushiSymbols'/f'{n}.png' for n in ('w','p','s','h1','h2','h3','h4')]
    paths += [sprites/'sushiV8'/f'intro_{n}.png' for n in ('collect','slice','receipt')]
    paths += [sprites/'sushiBackground/bg_base.png',thumb_dir/'composite_200.png']
    sheet=Image.new('RGB',(1200,math.ceil(len(paths)/4)*245),paper[:3]);sd=ImageDraw.Draw(sheet)
    font=ImageFont.truetype('C:/Windows/Fonts/arial.ttf',17)
    for i,p in enumerate(paths):
        im=Image.open(p).convert('RGBA');im.thumbnail((275,210),Image.Resampling.LANCZOS)
        x=(i%4)*300+(300-im.width)//2;y=(i//4)*245+5
        sheet.paste(im,(x,y),im)
        sd.text(((i%4)*300+150,(i//4)*245+225),p.stem,font=font,anchor='mm',fill=ink[:3])
    sheets=src/'_sheets';sheets.mkdir(exist_ok=True)
    sheet.save(sheets/f'{theme}_art_contact.png')
    print(theme, 'visual skin built', sheets/f'{theme}_art_contact.png')

if __name__=='__main__':
    for name,cfg in THEMES.items():make(name,cfg)
