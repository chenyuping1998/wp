"""Precise source cuts and concealed-anatomy repairs, authorized by Stone."""
from PIL import Image, ImageDraw, ImageChops, ImageFilter
import re
from pathlib import Path

SIZE=(1024,1536)
S=3


def path_points(path):
    tokens=re.findall(r'[MLCZ]|-?\d+(?:\.\d+)?',path)
    points=[]; pos=0; current=(0,0); start=None
    while pos<len(tokens):
        cmd=tokens[pos];pos+=1
        if cmd in ('M','L'):
            current=(float(tokens[pos]),float(tokens[pos+1]));pos+=2
            points.append(current)
            if start is None:start=current
        elif cmd=='C':
            vals=list(map(float,tokens[pos:pos+6]));pos+=6
            p0=current;p1=vals[:2];p2=vals[2:4];p3=vals[4:]
            for k in range(1,65):
                t=k/64;u=1-t
                points.append((u*u*u*p0[0]+3*u*u*t*p1[0]+3*u*t*t*p2[0]+t*t*t*p3[0],
                               u*u*u*p0[1]+3*u*u*t*p1[1]+3*u*t*t*p2[1]+t*t*t*p3[1]))
            current=tuple(p3)
        elif cmd=='Z':points.append(start)
    return points


def shape(path,color,stroke=(22,13,12,255),width=7):
    im=Image.new('RGBA',(SIZE[0]*S,SIZE[1]*S));d=ImageDraw.Draw(im)
    pts=[(round(x*S),round(y*S)) for x,y in path_points(path)]
    d.polygon(pts,fill=color)
    if stroke:d.line(pts,fill=stroke,width=width*S,joint='curve')
    return im.resize(SIZE,Image.Resampling.LANCZOS)


def clip(image,points):
    m=Image.new('L',SIZE);ImageDraw.Draw(m).polygon(points,fill=255)
    r=image.copy();r.putalpha(ImageChops.multiply(image.getchannel('A'),m));return r


def split_joint(image,y,x,radius=48,upper=True):
    m=Image.new('L',SIZE);d=ImageDraw.Draw(m)
    d.rectangle((0,0,1024,y) if upper else (0,y,1024,1536),fill=255)
    d.ellipse((x-radius,y-radius,x+radius,y+radius),fill=255)
    r=image.copy();r.putalpha(ImageChops.multiply(image.getchannel('A'),m));return r


def source_paint(shape_image,master):
    # No old composite pixels: its coat/leg contact lines would become ghosts.
    return shape_image


def remove_hidden_cap_lines(image,bottom):
    image=image.copy();p=image.load()
    for y in range(780,bottom):
        for x in range(270,650):
            r,g,b,a=p[x,y]
            if a>0:p[x,y]=(112,65,38,a)
    return image


def sleeve(start,end,upper):
    """Curved, naturally tapered cloth; concealed caps have no perimeter stroke."""
    import math
    x0,y0=start;x1,y1=end;length=math.hypot(x1-x0,y1-y0)
    ux=(x1-x0)/length;uy=(y1-y0)/length
    def pos(u,v):return ((x0+u*ux-v*uy)*S,(y0+u*uy+v*ux)*S)
    def bezier(p0,p1,p2,p3,n=40):
        result=[]
        for i in range(n+1):
            t=i/n;q=1-t
            result.append(pos(q*q*q*p0[0]+3*q*q*t*p1[0]+3*q*t*t*p2[0]+t*t*t*p3[0],q*q*q*p0[1]+3*q*q*t*p1[1]+3*q*t*t*p2[1]+t*t*t*p3[1]))
        return result
    result=Image.new('RGBA',(SIZE[0]*S,SIZE[1]*S));d=ImageDraw.Draw(result)
    # Width tapers throughout the anatomy, rather than joining equal cylinders.
    r0,r1=(24,14) if upper else (14,12)
    top=bezier((-7,-r0*.72),(length*.26,-r0*1.04),(length*.69,-r1*1.22),(length,-r1))
    bottom=bezier((length,r1),(length*.73,r1*.96),(length*.25,r0*.72),(-7,r0*.72))
    end=bezier((length,-r1),(length+r1*.8,-r1*.72),(length+r1*.8,r1*.72),(length,r1))
    startcap=bezier((-7,r0*.72),(-r0*.85,r0*.66),(-r0*.85,-r0*.66),(-7,-r0*.72))
    d.polygon(top+end+bottom+startcap,fill=(196,17,38,255))
    # Cloth planes curve with the sleeve; no round red discs at either joint.
    shade=bezier((1,r0*.35),(length*.36,r0*.24),(length*.68,r1*.23),(length,r1*.35))
    d.polygon(shade+bottom,fill=(146,17,32,255))
    highlight=bezier((2,-r0*.45),(length*.32,-r0*.50),(length*.62,-r1*.67),(length-12,-r1*.65))
    d.line(highlight,fill=(217,30,48,255),width=4*S,joint='curve')
    # Only longitudinal cloth edges are inked. Round overlap ends stay plain.
    d.line(top[5:-3],fill=(25,12,14,255),width=5*S,joint='curve')
    d.line(bottom[3:-5],fill=(25,12,14,255),width=5*S,joint='curve')
    # Small offset folds, clearly cloth rather than a transverse joint ring.
    fold=bezier((length*.68,-r1*.67),(length*.73,-r1*.25),(length*.75,r1*.03),(length*.81,r1*.12),16)
    d.line(fold,fill=(112,16,28,255),width=2*S,joint='curve')
    if not upper:
        cuff=[pos(length-27,-20),pos(length+10,-20),pos(length+10,20),pos(length-27,20)]
        d.polygon(cuff,fill=(255,244,215,255));d.line(cuff+[cuff[0]],fill=(25,12,14,255),width=4*S,joint='curve')
        x,y=pos(length-9,8);rr=4*S
        d.ellipse((x-rr,y-rr,x+rr,y+rr),fill=(210,160,91,255),outline=(45,27,17,255),width=2*S)
    return result.resize(SIZE,Image.Resampling.LANCZOS)


def make(master):
    parts={};brown=(112,65,38,255)
    pelvis=shape('M342 799 C385 811 460 816 514 792 C533 824 550 863 546 889 C522 921 495 927 472 916 C441 940 404 949 372 931 C343 924 327 899 328 868 Z',brown,stroke=None)
    parts['pelvis']=remove_hidden_cap_lines(pelvis,950)
    left=shape('M376 855 C397 851 426 860 449 883 C430 943 388 1025 350 1090 C384 1143 409 1221 460 1330 C453 1351 427 1359 403 1348 C387 1291 370 1215 340 1156 C309 1124 284 1106 288 1080 C302 1021 343 924 376 855 Z',brown)
    left=remove_hidden_cap_lines(left,933)
    parts['leg_l_upper']=split_joint(left,1092,331,46,True)
    parts['leg_l_lower']=split_joint(left,1092,331,46,False)
    right=shape('M448 862 C474 849 505 859 527 882 C554 962 585 1036 607 1095 C629 1168 669 1264 710 1334 C704 1354 678 1366 651 1354 C637 1296 596 1204 570 1134 C541 1081 513 1004 480 940 C458 915 446 887 448 862 Z',brown)
    right=remove_hidden_cap_lines(right,935)
    parts['leg_r_upper']=split_joint(right,1105,571,45,True)
    parts['leg_r_lower']=split_joint(right,1105,571,45,False)
    arm_l=clip(master,[(344,505),(315,507),(291,523),(130,643),(122,658),
                       (129,681),(232,783),(254,802),(282,782),(302,744),
                       (286,721),(216,662),(315,615),(341,575)])
    parts['arm_l_upper']=clip(arm_l,[(108,620),(345,490),(376,589),(184,720),(116,703)])
    parts['arm_l_lower']=clip(arm_l,[(116,640),(193,622),(321,742),(291,824),(217,804)])
    # A complete near upper sleeve, with concealed elbow underpainting. It
    # cannot be taken from a composite rectangle containing the raised cuff.
    upper=shape('M560 519 C581 505 601 516 616 543 L703 678 C719 700 726 726 715 745 C703 763 681 761 663 746 L551 587 C537 565 539 535 560 519 Z',(193,18,38,255))
    parts['arm_r_upper']=upper
    lower=clip(master,[(553,621),(569,607),(596,626),(639,666),(694,707),
                       (715,732),(711,755),(695,770),(671,763),(623,728),
                       (577,680),(550,660),(541,645)])
    # Cuff belongs here; any brown pixels are remnants of the overlapping hand.
    pixels=lower.load()
    for y in range(595,685):
        for x in range(525,625):
            r,g,b,a=pixels[x,y]
            if a and 30<g<125 and 1.25*g<r<2.8*g and g>1.12*b:
                pixels[x,y]=(0,0,0,0)
    parts['arm_r_lower']=lower
    # Repair all four anatomical pieces at their existing pose and dimensions.
    # Whole source limbs are never stretched or used as overlapping fragments.
    for side,shoulder,elbow,wrist in [('l',(327,553),(165,668),(279,757)),('r',(581,565),(679,723),(573,635))]:
        parts[f'arm_{side}_upper']=sleeve(shoulder,elbow,True)
        parts[f'arm_{side}_lower']=sleeve(elbow,wrist,False)
    parts['hand_l_hip']=clip(master,[(279,735),(306,717),(339,722),(348,746),
                                    (345,777),(332,804),(311,821),(281,818),
                                    (266,798),(277,775)])
    # Cuffs belong only to forearms; remove their small boundary triangles
    # from hand masks and add no replacement fragments.
    def hand_only(image):
        image=image.copy();p=image.load()
        skin=Image.new('L',SIZE);mask=skin.load()
        for y in range(image.height):
            for x in range(image.width):
                r,g,b,a=p[x,y]
                if a and 20<g<150 and r<210 and 1.2*g<r<3*g and b<120:
                    mask[x,y]=255
                if a and ((r>150 and g>125 and b>80) or (r>80 and r>3.2*g)):
                    p[x,y]=(0,0,0,0)
        # Keep the actual black hand outline, but reject cuff/lapel strokes
        # that have no skin behind them. Nothing is painted onto the hand.
        skin=skin.filter(ImageFilter.MaxFilter(9))
        image.putalpha(ImageChops.multiply(image.getchannel('A'),skin))
        return image
    parts['hand_l_hip']=hand_only(parts['hand_l_hip'])
    root=Path(__file__).resolve().parent
    grip=clip(Image.open(root/'attempts/hand_r_grip-before-repair.png').convert('RGBA'),
              [(396,486),(642,486),(642,600),(582,615),(545,660),(500,640),(399,642)])
    grip=hand_only(grip)
    box=grip.getchannel('A').point(lambda v:255 if v>128 else 0).getbbox()
    registered=Image.new('RGBA',SIZE)
    registered.alpha_composite(grip.crop(box).resize((135,133),Image.Resampling.LANCZOS),(458,509))
    parts['hand_r_grip']=registered
    hat=Image.open(root/'raw_layers/hat.png').convert('RGBA')
    box=hat.getchannel('A').point(lambda v:255 if v>128 else 0).getbbox()
    held=Image.new('RGBA',SIZE)
    held.alpha_composite(hat.crop(box).resize((447,299),Image.Resampling.LANCZOS),(185,274))
    held.alpha_composite(registered)
    parts['hand_r_hatheld']=held
    parts['neck']=shape('M343 480 C388 450 459 443 490 461 L515 537 C486 565 398 569 339 546 C339 523 340 501 343 480 Z',brown,stroke=None)
    tail=Image.new('RGBA',(SIZE[0]*S,SIZE[1]*S));d=ImageDraw.Draw(tail)
    pts=[(round(x*S),round(y*S)) for x,y in path_points('M615 1018 C674 1077 739 1107 812 1083 C902 1055 907 987 883 928 C860 864 810 821 762 861')]
    for color,width in [((22,13,12,255),62),(brown,49)]:
        d.line(pts,fill=color,width=width*S,joint='curve')
        rr=width*S/2
        for x,y in [pts[0],pts[-1]]:d.ellipse((x-rr,y-rr,x+rr,y+rr),fill=color)
    tail=tail.resize(SIZE,Image.Resampling.LANCZOS)
    parts['_tail_full_reference']=tail
    # Split by progress along the same continuous source curve, with overlap.
    # Polygon wedges leave tiny triangular missing areas on curved silhouettes.
    curve=path_points('M615 1018 C674 1077 739 1107 812 1083 C902 1055 907 987 883 928 C860 864 810 821 762 861')
    first=min(range(len(curve)),key=lambda k:(curve[k][0]-790)**2+(curve[k][1]-1088)**2)
    second=min(range(len(curve)),key=lambda k:(curve[k][0]-895)**2+(curve[k][1]-970)**2)
    canvases={n:Image.new('RGBA',SIZE) for n in ['tail_1','tail_2','tail_3']}
    pixels={n:im.load() for n,im in canvases.items()};src=tail.load();box=tail.getbbox()
    for yy in range(box[1],box[3]):
        for xx in range(box[0],box[2]):
            color=src[xx,yy]
            if not color[3]:continue
            k=min(range(len(curve)),key=lambda i:(curve[i][0]-xx)**2+(curve[i][1]-yy)**2)
            if k<=first+10:pixels['tail_1'][xx,yy]=color
            if first-10<=k<=second+10:pixels['tail_2'][xx,yy]=color
            if k>=second-10:pixels['tail_3'][xx,yy]=color
    parts.update(canvases)
    # Round the concealed ends, instead of leaving rectangular corners past
    # a joint. The foreground half remains the original full source curve.
    ends={'tail_1':[(first,1)],'tail_2':[(first,-1),(second,1)],'tail_3':[(second,-1)]}
    for name,boundaries in ends.items():
        image=parts[name];px=image.load();bounds=image.getbbox()
        for index,side in boundaries:
            cx,cy=curve[index];vx=curve[index+2][0]-curve[index-2][0];vy=curve[index+2][1]-curve[index-2][1]
            for yy in range(bounds[1],bounds[3]):
                for xx in range(bounds[0],bounds[2]):
                    dx,dy=xx-cx,yy-cy
                    if side*(dx*vx+dy*vy)>0 and dx*dx+dy*dy>(24 if side==1 else 31)**2:px[xx,yy]=(0,0,0,0)
    # Underpainting is narrower than the 24.5px painted shaft. It remains
    # behind the original side ink; never repaint the outline with a brown disc.
    for name,centers in {'tail_1':[(790,1088)],'tail_2':[(790,1088),(895,970)],'tail_3':[(895,970)]}.items():
        backing=Image.new('RGBA',SIZE);paint=ImageDraw.Draw(backing)
        for x,y in centers:
            # Only the REAR segment carries a narrow inked round socket. The
            # foreground open end covers its cross-line, while the rear socket
            # supplies continuous outer ink when the tail bends.
            rear=(name=='tail_2' and (x,y)==(790,1088)) or name=='tail_3'
            if rear:
                paint.ellipse((x-30,y-30,x+30,y+30),fill=(22,13,12,255))
                paint.ellipse((x-24,y-24,x+24,y+24),fill=brown)
            else:paint.ellipse((x-23,y-23,x+23,y+23),fill=brown)
        backing.alpha_composite(parts[name]);parts[name]=backing
    return parts
