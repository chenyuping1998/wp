"""Build the complete Strike/Mardi visual skins from approved source art.

Run: py -3 wp/tools/build_strike_mardi_art.py
The generated originals stay under each app's design/source/<theme> folder.
"""
from pathlib import Path
import importlib.util
import math
from PIL import Image, ImageDraw, ImageOps, ImageFont

ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('three_art',ROOT/'tools/build_three_theme_art.py')
base=importlib.util.module_from_spec(spec);spec.loader.exec_module(base)

THEMES={
 'strike':dict(app='StrikeMonkey保齡球館',ink='#14262E',paper='#FFF4DE',accent='#E8502E',secondary='#3FC4A8',highlight='#F5B83D',title='STRIKE MONKEY',cover='StrikeMonkey'),
 'mardi':dict(app='MardiMonkey嘉年華',ink='#291D37',paper='#FFF3DF',accent='#713AA0',secondary='#26906B',highlight='#D6AB45',title='MARDI MONKEY',cover='MardiMonkey'),
}
SOURCES={
 'strike':r'C:\Users\cheny\.codex\generated_images\01a12311-d302-7832-91b4-666e10307018\exec-3511c74f-17b8-44f6-b06e-2c7195d89fcb.png',
 'mardi':r'C:\Users\cheny\.codex\generated_images\01a12311-d302-7832-91b4-666e10307018\exec-026b063f-a88c-4643-a27e-75160729af63.png',
}

def C(v):return tuple(bytes.fromhex(v.lstrip('#')))+(255,)
def blank(size):return Image.new('RGBA',size,(0,0,0,0))
def save(app,group,name,im):
    target=app/'static/assets/sprites'/group/name
    target.parent.mkdir(parents=True,exist_ok=True);im.save(target,optimize=True)
def source_setup(theme,cfg):
    app=ROOT/'apps'/cfg['app'];src=app/'design/source'/theme
    src.mkdir(parents=True,exist_ok=True)
    for cast,alias in (('mg','master'),('fg','apprentice')):
        Image.open(src/'cast'/f'{cast}_raw.png').save(src/f'{alias}_full.png')
    img=Image.open(SOURCES[theme]).convert('RGBA')
    img.save(src/'intro_triptych.png')
    # Two isolated cast props, with the existing atlas's 256 px contract.
    props=blank((512,256));d=ImageDraw.Draw(props)
    if theme=='strike':
        d.ellipse((50,42,206,198),fill=C('#14262E'),outline=C('#E8502E'),width=12)
        for x,y in ((100,89),(146,87),(123,127)):d.ellipse((x-11,y-11,x+11,y+11),fill=C('#FFF4DE'))
        d.rounded_rectangle((330,35,435,202),30,fill=C('#FFF4DE'),outline=C('#14262E'),width=9)
        d.rectangle((342,79,423,98),fill=C('#E8502E'))
    else:
        d.line((70,219,180,35),fill=C('#291D37'),width=16)
        d.ellipse((155,14,195,54),fill=C('#D6AB45'),outline=C('#291D37'),width=8)
        for x,col in ((345,'#713AA0'),(375,'#26906B'),(405,'#D6AB45')):
            d.arc((x-39,51,x+49,188),0,180,fill=C(col),width=13)
            for y in (83,108,133):d.ellipse((x-10,y-10,x+10,y+10),fill=C(col),outline=C('#291D37'),width=3)
    p=src/'props';p.mkdir(exist_ok=True)
    props.crop((0,0,256,256)).save(p/'mg.png')
    props.crop((256,0,512,256)).save(p/'fg.png')
    props.save(src/'throw_props.png')
    # Each side of the transition uses this entire 1400px door. It must be
    # opaque edge to edge or the scene swap leaks through at the centre.
    door=blank((1400,1080));d=ImageDraw.Draw(door)
    ink,paper,accent,sec,hi=[C(cfg[k]) for k in ('ink','paper','accent','secondary','highlight')]
    d.rectangle((0,0,1399,1079),fill=ink)
    d.rectangle((24,24,1375,1055),fill=accent,outline=paper,width=16)
    if theme=='strike':
        # Bowling-lane shutters: broad flat lanes with alternating pin rails.
        for x in range(68,1390,188):
            d.rounded_rectangle((x,72,x+126,1008),25,fill=sec,outline=ink,width=13)
            d.line((x+63,117,x+63,960),fill=paper,width=10)
            for y in (232,540,848):d.ellipse((x+40,y-24,x+86,y+22),fill=hi,outline=ink,width=6)
    else:
        # Parade-float folding panels, printed with repeating bead colours.
        for x in range(68,1390,188):
            d.polygon([(x,76),(x+125,76),(x+110,1005),(x+15,1005)],fill=sec if (x//188)%2 else accent,outline=ink,width=12)
            for y,col in ((230,hi),(500,paper),(770,hi)):
                d.ellipse((x+39,y-29,x+89,y+21),fill=col,outline=ink,width=7)
    d.rectangle((1360,0,1399,1079),fill=ink)
    door.save(src/'transition_door.png')
    return app,src

def finish(theme,cfg,app,src):
    ink,paper,accent,sec,hi=[C(cfg[k]) for k in ('ink','paper','accent','secondary','highlight')]
    # Value must come from the symbol, never the card or a flash on the prize.
    common_back=Image.open(app/'static/assets/sprites/sushiSymbols/low_label.png').convert('RGBA')
    for name in ('back_h1.png','back_h2.png','back_s.png'):
        save(app,'sushiV8',name,common_back)
    # Three clean comic instruction panels. Flat inks, thick contours and
    # deliberate negative space avoid the synthetic painted look in transitions.
    symbols=app/'static/assets/sprites/sushiSymbols'
    def paste_symbol(canvas,name,box):
        icon=Image.open(symbols/f'{name}.png').convert('RGBA')
        icon.thumbnail((box[2],box[3]),Image.Resampling.LANCZOS)
        canvas.alpha_composite(icon,(box[0]+(box[2]-icon.width)//2,box[1]+(box[3]-icon.height)//2))
    for kind in ('collect','slice','receipt'):
        page=blank((1024,640));pen=ImageDraw.Draw(page)
        pen.rounded_rectangle((25,25,999,615),38,fill=paper,outline=ink,width=22)
        pen.rounded_rectangle((53,53,971,587),23,outline=accent,width=10)
        if kind=='collect':
            pen.polygon([(90,470),(240,145),(585,115),(875,430),(790,520),(280,535)],fill=sec,outline=ink,width=13)
            paste_symbol(page,'w',(100,133,310,310))
            paste_symbol(page,'p',(645,190,235,255))
            pen.line((450,310,635,310),fill=ink,width=20)
            pen.polygon([(635,310),(586,274),(586,346)],fill=ink)
        elif kind=='slice':
            for x,y,angle in ((130,152,0),(390,104,0),(650,152,0)):
                pen.rounded_rectangle((x,y,x+235,y+335),20,fill=sec if x==390 else paper,outline=ink,width=14)
            paste_symbol(page,'w',(138,170,215,220))
            paste_symbol(page,'p',(405,160,205,210))
            paste_symbol(page,'p',(660,170,205,210))
            for x in (365,625):
                pen.line((x,314,x+23,314),fill=ink,width=12)
                pen.line((x+11,303,x+11,325),fill=ink,width=12)
        else:
            pen.polygon([(120,165),(512,76),(904,165),(835,500),(512,565),(189,500)],fill=sec,outline=ink,width=18)
            paste_symbol(page,'h1',(297,128,430,390))
            for x in (140,850):
                pen.arc((x-65,220,x+65,440),270 if x<512 else 90,90 if x<512 else 270,fill=accent,width=19)
        save(app,'sushiV8',f'intro_{kind}.png',page)
    # Use the already approved night feature illustration, not an algorithmic tint.
    bg=ImageOps.fit(Image.open(src/'background_feature.png').convert('RGBA'),(1920,1080),Image.Resampling.LANCZOS)
    save(app,'sushiBackground','bg_feature.png',bg)
    # Blank logo field: runtime writes and localizes the actual title.
    logo=blank((1600,600));d=ImageDraw.Draw(logo)
    if theme=='strike':
        d.polygon([(85,300),(200,90),(1400,90),(1515,300),(1400,510),(200,510)],fill=paper,outline=ink,width=28)
        d.polygon([(130,300),(220,132),(1380,132),(1470,300),(1380,468),(220,468)],outline=accent,width=20)
        for x in (115,1485):d.ellipse((x-48,252,x+48,348),fill=ink,outline=hi,width=9)
    else:
        d.rounded_rectangle((80,105,1520,495),90,fill=paper,outline=ink,width=25)
        d.rounded_rectangle((103,128,1497,472),75,outline=accent,width=18)
        for x in (135,1465):
            for y,col in ((210,accent),(300,sec),(390,hi)):
                d.ellipse((x-20,y-20,x+20,y+20),fill=col,outline=ink,width=5)
    save(app,'sushiV8','logo_board.png',logo)
    # Preserve the original frame cutout while redrawing the surface.
    frame=blank((1280,1280));d=ImageDraw.Draw(frame)
    d.rounded_rectangle((14,14,1266,1266),55,fill=ink)
    d.rounded_rectangle((42,42,1238,1238),43,fill=paper)
    if theme=='strike':
        for x in range(120,1240,135):d.line((x,75,x,1205),fill=(221,210,188,90),width=6)
    else:
        for x in range(100,1250,190):
            d.arc((x,50,x+160,1230),80,100,fill=(113,58,160,35),width=5)
    save(app,'sushiFrame','frame_bg.png',frame)
    edge=blank((1280,1280));d=ImageDraw.Draw(edge)
    for inset,col,width in ((19,ink,26),(44,accent,16),(66,sec if theme=='mardi' else hi,7)):
        d.rounded_rectangle((inset,inset,1280-inset,1280-inset),55,outline=col,width=width)
    for x in (50,1230):
        for y in (50,1230):
            d.ellipse((x-22,y-22,x+22,y+22),fill=hi if theme=='mardi' else accent,outline=ink,width=7)
    save(app,'sushiFrame','frame_edge.png',edge)
    # Correct prop slot path and provide clean, themed transition plates.
    noren=blank((1920,420));d=ImageDraw.Draw(noren)
    d.rectangle((0,0,1919,65),fill=ink)
    if theme=='strike':
        d.polygon([(0,65),(1919,65),(1860,220),(60,220)],fill=accent,outline=ink,width=15)
        for x in range(100,1920,230):
            d.ellipse((x,105,x+35,140),fill=hi)
            d.line((x+18,145,x+18,220),fill=paper,width=9)
    else:
        for y in (120,175):d.line((0,y,1920,y),fill=ink,width=12)
        for x in range(65,1920,110):
            d.arc((x-45,165,x+45,310),0,180,fill=accent,width=10)
            for yy,col in ((258,accent),(289,sec),(320,hi)):d.ellipse((x-13,yy-13,x+13,yy+13),fill=col,outline=ink,width=3)
    save(app,'sushiScene','noren.png',noren)
    shutter=blank((1920,1080));d=ImageDraw.Draw(shutter)
    d.rectangle((0,0,1919,1079),fill=ink)
    if theme=='strike':
        for x in range(0,1920,180):d.line((x,0,x+260,1080),fill=sec,width=85)
        d.ellipse((570,150,1350,930),fill=paper,outline=accent,width=45)
        for x in (780,960,1140):d.ellipse((x-50,465,x+50,565),fill=ink)
    else:
        for x in range(0,1920,210):d.arc((x-90,40,x+170,1040),-85,85,fill=accent,width=45)
        d.rounded_rectangle((450,175,1470,905),150,fill=paper,outline=hi,width=35)
        for x in (550,1370):
            for y in range(240,850,120):d.ellipse((x-24,y-24,x+24,y+24),fill=accent if y%240 else sec,outline=ink,width=7)
    save(app,'sushiScene','shutter.png',shutter)
    # A single theme-specific wipe, used only while the game swaps scenes.
    # Flat ink and paper shapes keep the transition in the comic language.
    wipe=blank((1200,1200));d=ImageDraw.Draw(wipe)
    if theme=='strike':
        d.ellipse((20,20,1180,1180),fill=ink,outline=accent,width=24)
        d.ellipse((80,80,1120,1120),fill=sec,outline=paper,width=18)
        d.arc((155,150,1045,1040),125,305,fill=ink,width=25)
        for x,y in ((440,335),(660,290),(570,500)):
            d.ellipse((x-78,y-78,x+78,y+78),fill=ink,outline=paper,width=12)
        for y in (800,890):d.arc((180,y-140,1020,y+140),10,170,fill=accent,width=15)
    else:
        # A single moving parade fabric, with broad folds and bead strands.
        # No inset panel or plaque: the wipe must feel like a passing float.
        wipe=blank((1600,1000));d=ImageDraw.Draw(wipe)
        d.rectangle((0,0,1599,999),fill=accent)
        for x in range(-80,1700,250):
            d.polygon([(x,0),(x+90,0),(x+290,1000),(x+190,1000)],fill=ink)
            d.polygon([(x+95,0),(x+155,0),(x+355,1000),(x+290,1000)],fill=sec)
        d.arc((-120,-220,1720,880),0,180,fill=hi,width=35)
        d.arc((-70,-100,1670,980),0,180,fill=paper,width=20)
        for x in range(150,1600,145):
            y=int(400+160*math.sin(math.pi*x/1600))
            d.ellipse((x-25,y-25,x+25,y+25),fill=hi if (x//145)%2 else sec,outline=ink,width=7)
        for x in (250,800,1350):
            d.polygon([(x-55,40),(x+55,40),(x+35,240),(x,290),(x-35,240)],fill=hi,outline=ink)
    save(app,'sushiScene','transition_wipe.png',wipe)
    # Deck handoff images from the final approved sources.
    Image.open(src/'background_base.png').convert('RGB').resize((1920,1080),Image.Resampling.LANCZOS).save(app/'design/cover'/f"{cfg['cover']}-Cover-BG.png")
    # Replace the legacy scene filename with the actual new supporting character.
    fg=Image.open(src/'cast/fg_raw.png').convert('RGBA');box=fg.getchannel('A').getbbox();fg=fg.crop(box)
    fg.thumbnail((850,850),Image.Resampling.LANCZOS)
    cut=blank((1024,1024));cut.alpha_composite(fg,((1024-fg.width)//2,(1024-fg.height)//2))
    save(app,'sushiScene','chef_cut_in.png',cut)
    # Free-spin title cards use restrained hand-drawn sign shapes. Their
    # decoration is a separate texture so the runtime can give it a small,
    # delayed sway without tearing the lettering field.
    for name in ('fg_intro','fg_total'):
        card=blank((1600,1000));d=ImageDraw.Draw(card)
        if theme=='strike':
            d.polygon([(125,180),(350,80),(1250,80),(1475,180),(1475,820),(1250,920),(350,920),(125,820)],fill=ink)
            d.polygon([(160,205),(365,118),(1235,118),(1440,205),(1440,795),(1235,882),(365,882),(160,795)],fill=paper,outline=accent,width=18)
            d.rounded_rectangle((290,250,1310,765),40,outline=sec,width=12)
        else:
            d.polygon([(125,145),(800,95),(1475,145),(1415,840),(800,925),(185,840)],fill=ink)
            d.polygon([(160,178),(800,130),(1440,178),(1385,810),(800,885),(215,810)],fill=paper,outline=accent,width=19)
            d.arc((225,205,1375,425),180,360,fill=sec,width=16)
            # The lower ribbon arc intersected the subtitle at runtime.
            for x in (240,1360):
                for y,col in ((350,accent),(475,sec),(600,hi),(725,accent)):
                    d.ellipse((x-25,y-25,x+25,y+25),fill=col,outline=ink,width=6)
        save(app,'sushiV8',f'{name}.png',card)
        decor=blank((1600,1000))
        accents=('p','s') if name=='fg_intro' else ('h1','w')
        for symbol,x,y in ((accents[0],65,65),(accents[1],1310,675)):
            art=Image.open(app/'static/assets/sprites/sushiSymbols'/f'{symbol}.png').convert('RGBA')
            art.thumbnail((235,235),Image.Resampling.LANCZOS)
            decor.alpha_composite(art,(x,y))
        save(app,'sushiV8',f'{name}_decor.png',decor)
    plate=blank((1000,600));d=ImageDraw.Draw(plate)
    if theme=='strike':
        d.rounded_rectangle((35,35,965,565),58,fill=ink)
        d.rounded_rectangle((55,55,945,545),45,fill=paper,outline=accent,width=15)
        # The lane guides looked like stray vertical cuts through the copy.
    else:
        d.polygon([(38,80),(500,35),(962,80),(915,520),(500,570),(85,520)],fill=ink)
        d.polygon([(60,105),(500,58),(940,105),(890,500),(500,540),(110,500)],fill=paper,outline=accent,width=14)
        d.arc((110,115,890,310),180,360,fill=sec,width=10)
        # Keep the lower caption field free of the extra ribbon stroke.
    save(app,'sushiScene','fs_plate.png',plate)
    print(theme,'full skin built')

if __name__=='__main__':
    for theme,cfg in THEMES.items():
        app,src=source_setup(theme,cfg)
        base.make(theme,cfg)
        finish(theme,cfg,app,src)
