"""Hand-drawn pocha sign set. Runtime owns every changing word and amount.

The edges are deliberate ink contours, not gradients or random distress. Keep
the empty wells aligned with FeatureIntro, FreeSpinAnimation and Win.svelte.
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import math

ROOT = Path(__file__).resolve().parents[1]
V8 = ROOT / 'static/assets/sprites/sushiV8'
UI = ROOT / 'static/assets/sprites/sushiUi'
FONT = ROOT / 'static/fonts/sushi/Bungee-Regular.ttf'
S = 3
INK = '#222639'
PAPER = '#fff2dd'
RED = '#dc493d'
TEAL = '#288d91'
YELLOW = '#e9b73f'
PINK = '#e6a797'
PALE = '#f9e5c8'


def canvas(w, h):
    return Image.new('RGBA', (w*S, h*S), (0, 0, 0, 0))


def line(d, pts, color=INK, width=5, joint='curve'):
    d.line([(round(x*S), round(y*S)) for x,y in pts], fill=color, width=round(width*S), joint=joint)


def poly(d, pts, fill, outline=None, width=0):
    pts = [(round(x*S), round(y*S)) for x,y in pts]
    d.polygon(pts, fill=fill)
    if outline:
        d.line(pts+[pts[0]], fill=outline, width=round(width*S), joint='curve')


def ell(d, box, fill, outline=None, width=0):
    d.ellipse(tuple(round(a*S) for a in box), fill=fill, outline=outline, width=round(width*S))


def save(im, path, size):
    path.parent.mkdir(parents=True, exist_ok=True)
    im.resize(size, Image.Resampling.LANCZOS).save(path, optimize=True)


def dots(d, x0, y0, cols, rows, step=9, color=TEAL):
    # restrained, intentionally uneven screen-print dots only near margins
    for j in range(rows):
        for i in range(cols):
            if (i + j*3) % 5 == 0:
                continue
            x = x0 + i*step + (j%2)*2
            y = y0 + j*step + (i%3)
            ell(d, (x,y,x+1.5,y+1.5), color)


def rim(d, x0,y0,x1,y1, accent=RED, notch=False):
    if notch:
        p=[(x0+24,y0),(x1-28,y0+3),(x1,y0+28),(x1-5,y1-25),
           (x1-29,y1),(x0+29,y1-3),(x0,y1-31),(x0+4,y0+22)]
    else:
        p=[(x0+27,y0+1),(x1-31,y0-2),(x1,y0+28),(x1-4,y1-25),
           (x1-27,y1+1),(x0+29,y1-2),(x0,y1-27),(x0+3,y0+27)]
    poly(d, [(x+5,y+7) for x,y in p], INK)
    poly(d,p,PAPER,INK,7)
    line(d,[(x0+25,y0+17),(x1-27,y0+17)],accent,4)
    line(d,[(x0+24,y1-17),(x1-26,y1-17)],accent,3)


def noodle_bowl(d, cx, cy, sc=1):
    def P(points): return [(cx+x*sc,cy+y*sc) for x,y in points]
    poly(d,P([(-37,-4),(38,-4),(28,22),(-25,22)]),PAPER,INK,4)
    line(d,P([(-33,-4),(-20,4),(4,7),(27,2),(36,-4)]),RED,4)
    line(d,P([(-25,22),(0,27),(28,22)]),INK,3)
    line(d,P([(-18,-11),(-9,-22),(-4,-11),(4,-20),(11,-10),(19,-21)]),INK,3)
    line(d,P([(-28,-20),(30,-32)]),TEAL,4)
    line(d,P([(-24,-24),(34,-35)]),INK,2)


def stamp(d,cx,cy,r=22,accent=RED):
    ell(d,(cx-r,cy-r,cx+r,cy+r),PAPER,INK,3)
    ell(d,(cx-r+5,cy-r+5,cx+r-5,cy+r-5),None,accent,2)
    line(d,[(cx-r*.45,cy),(cx+r*.45,cy)],accent,3)
    line(d,[(cx,cy-r*.45),(cx,cy+r*.45)],accent,3)


def win_plate(name, accent, variant):
    w,h=1000,560; im=canvas(w,h); d=ImageDraw.Draw(im)
    rim(d,35,40,965,520,accent,notch=variant%2==0)
    # one sign face, with a subtle print offset and crooked hand-inked edges
    poly(d,[(92,94),(906,90),(926,115),(924,473),(902,491),(92,487),(73,464),(75,114)],PALE,INK,5)
    poly(d,[(143,115),(846,110),(866,135),(858,231),(840,245),(144,242),(128,225),(130,134)],accent,INK,7)
    line(d,[(149,126),(841,124)],PAPER,3)
    # amount well stays generous: center (500,386), width ~640
    poly(d,[(159,286),(842,282),(860,303),(856,446),(837,458),(163,456),(146,441),(147,305)],PAPER,INK,6)
    line(d,[(175,440),(821,441)],TEAL if variant%2 else RED,3)
    dots(d,93,285,5,8,9,accent)
    dots(d,874,285,5,8,9,accent)
    # ink food motifs are small and stay clear of the dynamic title and amount
    noodle_bowl(d,96,197,.48)
    stamp(d,905,195,19,accent)
    for x,y in ((111,74),(884,71),(106,484),(891,485)):
        ell(d,(x-5,y-5,x+5,y+5),YELLOW,INK,2)
    if variant>=2:
        line(d,[(320,72),(399,66),(475,70)],TEAL,3)
        line(d,[(524,70),(609,66),(682,72)],TEAL,3)
    if variant>=4:
        # top-tier accent is a hand-painted fabric fringe, not speed rays
        for i in range(8):
            x=235+i*74
            poly(d,[(x,39),(x+42,39),(x+36,59),(x+24,67),(x+8,57)],YELLOW,INK,2)
    save(im,V8/f'win_{name}.png',(w,h))


def fg_board(name):
    w,h=1600,1000; im=canvas(w,h); d=ImageDraw.Draw(im)
    # a single street-stall menu, rather than a box piled over a second box
    rim(d,145,181,1455,927,TEAL if name=='fg_total' else RED)
    poly(d,[(193,220),(1407,219),(1425,247),(1421,877),(1397,897),(207,895),(184,870),(188,247)],PALE,INK,7)
    # attached cloth valance; keep decor props over this board as before
    poly(d,[(163,177),(1434,178),(1438,246),(1389,244),(1372,264),(1313,244),
            (1260,263),(1195,246),(1139,264),(1072,245),(1015,261),(951,244),
            (891,263),(828,244),(769,261),(707,245),(643,263),(580,244),
            (516,263),(456,244),(393,263),(330,244),(269,263),(210,244),(158,246)],RED,INK,7)
    for i in range(13):
        x=232+i*94
        poly(d,[(x,185),(x+37,185),(x+35,233),(x+11,239)],PAPER)
    line(d,[(213,277),(1392,273)],TEAL,5)
    # text areas: title y~385, number y~600, subtitle y~799
    poly(d,[(293,315),(1295,311),(1317,336),(1308,461),(1289,477),(303,474),(280,454),(284,337)],PAPER,INK,6)
    line(d,[(312,331),(1284,328)],RED,4)
    poly(d,[(333,506),(1261,501),(1285,527),(1281,735),(1256,755),(341,752),(317,731),(318,528)],PAPER,INK,7)
    line(d,[(365,722),(1230,718)],TEAL,4)
    if name=='fg_intro':
        poly(d,[(510,773),(1095,770),(1111,787),(1108,851),(1091,864),(518,861),(501,845),(501,790)],PAPER,INK,5)
    else:
        # settlement has more room for a longer rolling amount
        line(d,[(400,785),(1197,783)],RED,4)
    dots(d,213,412,6,11,13,TEAL)
    dots(d,1304,412,6,11,13,RED)
    noodle_bowl(d,255,814,.82)
    stamp(d,1350,817,39,TEAL)
    for x,y in ((193,210),(1400,208),(188,888),(1413,885)):
        ell(d,(x-11,y-11,x+11,y+11),YELLOW,INK,4)
    save(im,V8/f'{name}.png',(w,h))


def logo():
    w,h=1600,600; im=canvas(w,h); d=ImageDraw.Draw(im)
    rim(d,57,65,1545,534,RED,True)
    poly(d,[(105,106),(1495,103),(1513,125),(1505,469),(1487,488),(115,490),(94,470),(94,129)],PALE,INK,6)
    # tied cloth strip reads as a pocha awning, not a generic marquee
    poly(d,[(112,107),(1489,105),(1492,169),(1455,166),(1431,186),(1395,166),(1357,186),
            (1318,166),(1279,185),(1242,166),(1202,187),(1163,166),(1124,186),
            (1083,167),(1046,185),(1007,166),(968,185),(928,167),(889,186),
            (848,166),(809,185),(769,167),(730,185),(690,167),(650,185),
            (610,167),(571,185),(531,166),(492,185),(452,166),(413,185),
            (373,166),(334,185),(294,166),(255,185),(216,166),(177,185),(113,169)],RED,INK,5)
    for i in range(14):
        x=157+i*95
        poly(d,[(x,112),(x+33,111),(x+27,163),(x+14,171)],PAPER)
    font=ImageFont.truetype(str(FONT),158*S)
    text='POCHA MONKEY'
    box=d.textbbox((0,0),text,font=font,stroke_width=0)
    tw=box[2]-box[0]
    x=(w*S-tw)//2
    y=252*S-box[1]
    d.text((x+4*S,y+5*S),text,font=font,fill=TEAL,stroke_width=6*S,stroke_fill=INK)
    d.text((x,y),text,font=font,fill=PAPER,stroke_width=5*S,stroke_fill=INK)
    noodle_bowl(d,166,395,.78)
    stamp(d,1431,398,50,TEAL)
    save(im,V8/'logo_board.png',(w,h))


def menu(wide=False):
    w,h=(1200,600) if wide else (740,1024)
    im=canvas(w,h);d=ImageDraw.Draw(im)
    rim(d,17,16,w-18,h-18,RED)
    poly(d,[(43,40),(w-42,39),(w-38,58),(w-41,h-57),(w-60,h-42),
            (58,h-42),(40,h-59),(41,60)],PAPER,INK,4)
    # hand-printed paper header, gently uneven baseline
    line(d,[(58,73),(w*.37,69),(w*.68,71),(w-58,68)],TEAL,4)
    if not wide:
        line(d,[(69,h*.69),(w-73,h*.685)],RED,3)
        noodle_bowl(d,w-93,h-97,.55)
        stamp(d,89,h-99,22,TEAL)
        dots(d,63,h*.76,5,8,10,TEAL)
    else:
        line(d,[(w*.43,44),(w*.43,h-44)],RED,3)
        stamp(d,w-77,h-70,20,TEAL)
    save(im,V8/('menu_frame_wide.png' if wide else 'menu_frame.png'),(w,h))


def counter():
    w,h=600,480; im=canvas(w,h);d=ImageDraw.Draw(im)
    rim(d,17,18,583,464,TEAL)
    poly(d,[(37,38),(560,36),(565,59),(561,440),(539,447),(57,447),(38,429)],PAPER,INK,5)
    poly(d,[(51,53),(548,51),(551,67),(549,125),(531,137),(67,136),(50,123)],RED,INK,5)
    line(d,[(79,257),(520,255)],YELLOW,4)
    line(d,[(69,333),(533,332)],TEAL,3)
    # four changing pips live in the 350..395 zone; footer below 420
    dots(d,49,175,4,10,9,TEAL)
    dots(d,523,175,4,10,9,RED)
    save(im,V8/'fg_counter.png',(w,h))


def buy(lit=False):
    w,h=768,384; im=canvas(w,h);d=ImageDraw.Draw(im)
    accent=YELLOW if lit else RED
    rim(d,17,25,750,362,accent,True)
    poly(d,[(42,47),(721,45),(730,66),(728,329),(709,338),(57,338),(38,318),(41,69)],PAPER,INK,5)
    poly(d,[(49,50),(717,48),(720,107),(680,106),(655,121),(625,105),
            (590,120),(554,105),(519,121),(482,106),(447,120),(410,106),
            (374,121),(338,105),(303,121),(267,105),(232,120),(196,106),
            (160,121),(124,106),(88,120),(49,107)],accent,INK,5)
    for i in range(6):
        x=119+i*100
        poly(d,[(x,56),(x+29,55),(x+26,99),(x+12,110)],PAPER)
    # central 330px text zone remains empty for the hover label
    noodle_bowl(d,91,245,.65)
    stamp(d,678,247,29,TEAL)
    line(d,[(194,313),(564,310)],TEAL,4)
    save(im,UI/('buybonus_plate_lit.png' if lit else 'buybonus_plate.png'),(w,h))


def _chicken(d,cx,cy,sc=1,turn=0):
    # one deliberately simple, legible fried-chicken silhouette
    pts=[(-54,-10),(-40,-41),(-8,-53),(31,-39),(53,-12),(41,24),
         (14,37),(-28,30),(-56,5)]
    ca,sa=math.cos(turn),math.sin(turn)
    p=[(cx+(x*ca-y*sa)*sc,cy+(x*sa+y*ca)*sc) for x,y in pts]
    poly(d,p,'#d8843c',INK,7*sc)
    line(d,[(cx-26*sc,cy-15*sc),(cx-7*sc,cy-28*sc),(cx+12*sc,cy-23*sc)],PAPER,5*sc)
    line(d,[(cx-35*sc,cy+10*sc),(cx-10*sc,cy+19*sc),(cx+13*sc,cy+7*sc)],'#a95032',5*sc)
    ell(d,(cx+12*sc,cy-4*sc,cx+20*sc,cy+4*sc),YELLOW)


def _basket(d,cx,cy,sc=1):
    # checked paper and a deep wire basket read clearly at card size
    poly(d,[(cx-148*sc,cy-54*sc),(cx+148*sc,cy-54*sc),
            (cx+121*sc,cy+91*sc),(cx-120*sc,cy+91*sc)],PAPER,INK,7*sc)
    for i in range(5):
        x=cx+(-106+i*52)*sc
        line(d,[(x,cy-48*sc),(x-10*sc,cy+83*sc)],RED,8*sc)
    for j in range(3):
        y=cy+(-22+j*48)*sc
        line(d,[(cx-137*sc,y),(cx+137*sc,y)],RED,8*sc)
    poly(d,[(cx-149*sc,cy-53*sc),(cx+149*sc,cy-53*sc),
            (cx+135*sc,cy-25*sc),(cx-135*sc,cy-25*sc)],TEAL,INK,6*sc)


def intro_art(kind):
    w,h=1024,640; im=canvas(w,h); d=ImageDraw.Draw(im)
    # A small cream print mat belongs to the illustration, not another plate.
    poly(d,[(62,77),(951,72),(966,89),(963,552),(946,568),(79,570),(58,550),(59,95)],PAPER,INK,8)
    dots(d,82,97,9,7,12,TEAL)
    dots(d,845,448,8,7,12,RED)
    if kind=='intro_collect':
        # Chicken baskets converge on the Boss's serving counter.
        poly(d,[(105,164),(891,159),(910,179),(904,245),(106,244)],RED,INK,8)
        for i in range(8):
            x=143+i*94
            poly(d,[(x,170),(x+34,169),(x+23,232),(x+2,230)],PAPER)
        poly(d,[(138,452),(887,449),(906,475),(902,536),(129,534),(122,474)],TEAL,INK,8)
        _basket(d,513,405,1.02)
        for x,y,t in ((294,304,-.18),(507,276,.15),(732,310,.24)):
            _chicken(d,x,y,.9,t)
        line(d,[(196,361),(259,389)],INK,8)
        line(d,[(813,355),(753,389)],INK,8)
        ell(d,(790,263,862,335),YELLOW,INK,6)
    elif kind=='intro_slice':
        # Three low tiles turn into one food tile, drawn as a compact comic beat.
        f=ImageFont.truetype(str(FONT),102*S)
        for idx,letter in enumerate(('10','J','Q')):
            x=110+idx*208
            poly(d,[(x,176),(x+172,172),(x+184,188),(x+180,386),(x+164,402),(x+12,403),(x,384)],PALE,INK,8)
            d.text(((x+91)*S,285*S),letter,font=f,anchor='mm',fill=INK)
        line(d,[(728,175),(709,429)],RED,17)
        line(d,[(744,165),(724,435)],INK,5)
        poly(d,[(716,271),(890,270),(909,291),(905,388),(886,410),(730,412)],TEAL,INK,8)
        _chicken(d,814,339,.79,.15)
        line(d,[(646,321),(691,321)],INK,8)
        poly(d,[(686,301),(713,321),(686,340)],INK)
    else:
        # A curling pocha bill makes the 10,000x cap unmistakable.
        poly(d,[(230,125),(748,131),(777,155),(773,452),(744,463),
                (760,501),(732,530),(247,523),(218,493),(221,149)],PAPER,INK,9)
        poly(d,[(243,145),(754,148),(755,197),(240,195)],RED)
        for y in (243,266,419,446):
            line(d,[(285,y),(708,y-3)],TEAL if y<300 else INK,5)
        f=ImageFont.truetype(str(FONT),111*S)
        d.text((501*S,349*S),'10,000x',font=f,anchor='mm',fill=INK)
        _chicken(d,190,462,.83,-.3)
        stamp(d,806,453,53,RED)
    save(im,V8/f'{kind}.png',(w,h))


if __name__=='__main__':
    for i,(name,c) in enumerate((('big',RED),('super',TEAL),('mega','#bb5c50'),('epic','#426b7e'),('max',RED))):
        win_plate(name,c,i)
    for name in ('fg_intro','fg_total'): fg_board(name)
    logo(); menu(); menu(True); counter(); buy(); buy(True)
    for name in ('intro_collect','intro_slice','intro_receipt'): intro_art(name)
    print('wrote Pocha comic sign set')
