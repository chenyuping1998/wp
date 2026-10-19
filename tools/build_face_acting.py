"""Paint compact, aligned comic face cels for the six mascot rigs.

The face remains one weighted Spine mesh. Only the pixels inside the eyes and
mouth change, so hats, hair, neck, and costume can never drift between cels.
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter, ImageChops
import numpy as np

ROOT = Path(__file__).resolve().parents[1] / "apps"
S = 4
INK = (24, 24, 21, 255)

# Coordinates are in each artist cutout's own pixels. Eye boxes exclude brows.
# mouth: box occupied by the original smile; cheek: sampled intact paint.
FACES = {
    "JadeTeahouse": {
        "mg": ([(39, 88, 64, 128), (73, 88, 121, 126)], (20, 130, 114, 174), (82, 145)),
        "fg": ([(49, 105, 87, 150), (96, 107, 132, 149)], (30, 139, 146, 180), (113, 155)),
    },
    "DinerMonkey美式餐館": {
        "mg": ([(37, 88, 65, 127), (73, 84, 120, 124)], (19, 138, 115, 184), (83, 147)),
        "fg": ([(49, 109, 87, 153), (95, 108, 134, 153)], (28, 143, 151, 199), (113, 158)),
    },
    "PochaMonkey韓式路邊攤": {
        "mg": ([(24, 74, 56, 111), (61, 76, 96, 112)], (2, 99, 119, 190), (135, 131)),
        "fg": ([(34, 100, 56, 146), (59, 97, 84, 143)], (27, 117, 119, 196), (124, 145)),
    },
    "StrikeMonkey保齡球館": {
        "mg": ([(37, 98, 59, 163), (64, 99, 107, 181)], (28, 179, 132, 245), (116, 191)),
        "fg": ([(44, 99, 67, 146), (78, 99, 107, 146)], (25, 119, 112, 188), (132, 145)),
    },
    "MardiMonkey嘉年華": {
        "mg": ([(41, 115, 65, 188), (71, 114, 113, 198)], (29, 195, 139, 272), (122, 205)),
        "fg": ([(41, 89, 70, 133), (68, 88, 108, 134)], (29, 104, 114, 177), (128, 129)),
    },
    "SwingMonkey爵士俱樂部": {
        "mg": ([(40, 91, 63, 162), (69, 92, 110, 179)], (27, 176, 131, 243), (114, 186)),
        "fg": ([(42, 125, 72, 181), (69, 123, 112, 182)], (29, 145, 123, 233), (131, 174)),
    },
}

SKIN = {
    "JadeTeahouse": {"mg": (237, 180, 112, 255), "fg": (233, 172, 112, 255)},
    "DinerMonkey美式餐館": {"mg": (240, 170, 106, 255), "fg": (250, 180, 109, 255)},
    "PochaMonkey韓式路邊攤": {"mg": (252, 188, 137, 255), "fg": (241, 176, 124, 255)},
    "StrikeMonkey保齡球館": {"mg": (253, 229, 191, 255), "fg": (247, 176, 118, 255)},
    "MardiMonkey嘉年華": {"mg": (252, 216, 164, 255), "fg": (244, 166, 112, 255)},
    "SwingMonkey爵士俱樂部": {"mg": (240, 206, 164, 255), "fg": (237, 165, 110, 255)},
}
OPEN_BASE = {("PochaMonkey韓式路邊攤", "mg"), ("PochaMonkey韓式路邊攤", "fg"),
             ("StrikeMonkey保齡球館", "fg"), ("MardiMonkey嘉年華", "fg"),
             ("SwingMonkey爵士俱樂部", "fg")}
WIDE_GRIN = {("StrikeMonkey保齡球館", "mg"), ("MardiMonkey嘉年華", "mg"),
             ("SwingMonkey爵士俱樂部", "mg")}
COMIC_MOUTH = {("PochaMonkey韓式路邊攤", "mg"): (4, 115, 105, 184)}
REWORK_FG = {("PochaMonkey韓式路邊攤", "fg"), ("StrikeMonkey保齡球館", "fg"),
             ("MardiMonkey嘉年華", "fg"), ("SwingMonkey爵士俱樂部", "fg")}
CLOSE_PATCH = {
    ("PochaMonkey韓式路邊攤", "mg"): (17, 116, 108, 181),
    ("PochaMonkey韓式路邊攤", "fg"): (51, 136, 115, 191),
    ("StrikeMonkey保齡球館", "fg"): (44, 141, 107, 188),
    ("MardiMonkey嘉年華", "fg"): (43, 120, 112, 172),
    ("SwingMonkey爵士俱樂部", "fg"): (42, 163, 118, 226),
}

def bezier(a, b, c, steps=20):
    return [((1-t)**2*a[0]+2*(1-t)*t*b[0]+t*t*c[0],
             (1-t)**2*a[1]+2*(1-t)*t*b[1]+t*t*c[1])
            for t in (i/steps for i in range(steps+1))]

def scale_points(points):
    return [(round(x*S), round(y*S)) for x,y in points]

def fresh_layer(size):
    return Image.new("RGBA", (size[0]*S, size[1]*S))

def composite(base, layer):
    return Image.alpha_composite(base, layer.resize(base.size, Image.Resampling.LANCZOS))

def soft_cheek(base, box, cheek, feather=3.5):
    x0,y0,x1,y1=box
    mask=Image.new("L", base.size)
    d=ImageDraw.Draw(mask)
    d.ellipse((x0,y0,x1,y1),fill=255)
    mask=mask.filter(ImageFilter.GaussianBlur(feather))
    mask=ImageChops.multiply(mask,base.getchannel("A"))
    fill=Image.new("RGBA",base.size,cheek)
    return Image.composite(fill,base,mask)

def blink(base, eyes, cheek):
    layer=fresh_layer(base.size)
    d=ImageDraw.Draw(layer)
    for x0,y0,x1,y1 in eyes:
        w=x1-x0; h=y1-y0
        # The cream eyeball and the lid are the same painted surface on these
        # characters. Cover only the pupil; leave brows and outer silhouette.
        d.ellipse((round(x0*S),round(y0*S),round(x1*S),round(y1*S)),fill=cheek)
        cy=y0+h*.55
        points=bezier((x0+1,cy+3),(x0+w*.52,cy+9),(x1-1,cy+1))
        d.line(scale_points(points),fill=INK,width=max(2,round(w*.085*S)),joint="curve")
        d.line(scale_points(bezier((x0+3,cy+7),(x0+w*.5,cy+11),(x1-4,cy+6))),
               fill=(91,55,33,190),width=max(1,round(w*.025*S)),joint="curve")
    return composite(base,layer)

def mouth_open(base, box, cheek, cover=False, amount=1.0):
    x0,y0,x1,y1=box; w=x1-x0; h=y1-y0
    if cover:
        base=soft_cheek(base,box,cheek,.6)
    layer=fresh_layer(base.size); d=ImageDraw.Draw(layer)
    # A shaped, inked laugh cavity lies over the center of the existing smile.
    # Keeping its corner strokes makes the drawing remain the same character.
    # Every cel is drawn over the SAME clean cheek. The mouth grows around
    # stationary corners instead of replacing a toothy grin with a sticker.
    cx=x0+w*.50
    half_width=w*(.18+.11*amount)
    cy=y0+h*(.57-.055*amount)
    half_height=h*(.085+.22*amount)
    left=cx-half_width; right=cx+half_width
    top=cy-half_height; bottom=cy+half_height
    mouth_path = (bezier((left,cy),(left+w*.025,top),(cx,top),8)
                  +bezier((cx,top),(right-w*.025,top),(right,cy),8)
                  +bezier((right,cy),(right-w*.025,bottom),(cx,bottom),8)
                  +bezier((cx,bottom),(left+w*.025,bottom),(left,cy),8))
    d.polygon(scale_points(mouth_path),fill=(43,22,25,255))
    d.line(scale_points(mouth_path+[mouth_path[0]]),fill=INK,width=round(2.2*S),joint="curve")
    if amount>.48:
        tongue_top=bottom-h*(.10+.05*amount)
        d.ellipse((round((cx-half_width*.58)*S),round(tongue_top*S),
                   round((cx+half_width*.58)*S),round((bottom-h*.015)*S)),
                  fill=(217,93,91,255))
    return composite(base,layer)

def comic_laugh(base, box, cheek, amount, cover=True):
    """A lip, upper teeth, mouth cavity and jaw drawn as one continuous pose.

    The tooth row remains attached to the same upper lip in every in-between;
    only the lower jaw and tongue travel. This follows the diner cast's acting
    construction while retaining each mascot's original ink and palette.
    """
    x0,y0,x1,y1=box; w=x1-x0; h=y1-y0
    if cover:
        base=soft_cheek(base,box,cheek,.7)
    layer=fresh_layer(base.size); d=ImageDraw.Draw(layer)
    cx=x0+w*.50
    half=w*(.24+.13*amount)
    top=y0+h*(.37-.15*amount)
    bottom=y0+h*(.50+.38*amount)
    left=cx-half; right=cx+half
    if amount<.01:
        # A closed, lifted smile is the resting face. No permanent tooth grid.
        lip=bezier((left,top+2),(cx,top+8),(right,top-3),24)
        d.line(scale_points(lip),fill=INK,width=round(2.2*S),joint="curve")
        for x,sgn in ((left,-1),(right,1)):
            d.line(scale_points(bezier((x,top+1),(x+sgn*4,top-2),(x+sgn*4,top-6),8)),
                   fill=INK,width=round(1.25*S),joint="curve")
        return composite(base,layer)
    dep=bottom-top
    lcorner=(left,top+dep*.22); rcorner=(right,top+dep*.16)
    upper=bezier(lcorner,(cx,top-dep*.13),rcorner,24)
    lower=bezier(rcorner,(cx,bottom+dep*.95),lcorner,24)
    mouth=upper+lower
    d.polygon(scale_points(mouth),fill=(49,18,24,255))
    d.line(scale_points(mouth+[mouth[0]]),fill=INK,width=round(2.1*S),joint="curve")
    # The upper gum/teeth strip follows the upper lip, including its taper at
    # the corners. Each little division stays in the same place as it opens.
    tooth_depth=dep*(.30-.055*amount)
    tooth_top=bezier((left+half*.12,top+dep*.24),(cx,top+dep*.04),(right-half*.11,top+dep*.19),20)
    tooth_bottom=bezier((right-half*.14,top+tooth_depth),(cx,top+tooth_depth*1.27),
                        (left+half*.15,top+tooth_depth*1.07),20)
    d.polygon(scale_points(tooth_top+tooth_bottom),fill=(255,246,224,255))
    d.line(scale_points(tooth_top+tooth_bottom),fill=INK,width=round(.9*S),joint="curve")
    for k in (1,2,3,4):
        tx=left+half*.25+(k/5)*(2*half*.75)
        ytop=top+dep*.13; ybot=top+tooth_depth*1.13
        d.line(scale_points(bezier((tx,ytop),(tx+1,ytop+tooth_depth*.45),(tx,ybot),6)),
               fill=(47,32,27,210),width=max(1,round(.65*S)))
    if amount>.36:
        tongue_y=bottom-dep*(.20+.22*amount)
        d.ellipse((round((cx-half*.43)*S),round(tongue_y*S),
                   round((cx+half*.43)*S),round((bottom-dep*.015)*S)),
                  fill=(218,89,86,255),outline=INK,width=max(1,round(.8*S)))
    for x,sgn,y in ((left,-1,lcorner[1]),(right,1,rcorner[1])):
        d.line(scale_points(bezier((x,y),(x+sgn*3,y-3),(x+sgn*3,y-6),7)),
               fill=INK,width=round(1.1*S),joint="curve")
    return composite(base,layer)

def mouth_closed(base, box, cheek, patch, strength=1.55):
    # Preserve the artist's own mouth, chin and cheek pixels. The local vertical
    # remap narrows the laughing cavity; its displacement eases to zero at all
    # four edges, so no rectangle or pasted-on jaw can show in the Spine mesh.
    x0,y0,x1,y1=patch
    src=np.asarray(base).astype(np.float32)
    out=src.copy()
    xx,yy=np.meshgrid(np.arange(x0,x1),np.arange(y0,y1))
    mid=(y0+y1)/2
    sx=np.sin(np.pi*(xx-x0)/(x1-x0))**2
    sy=np.sin(np.pi*(yy-y0)/(y1-y0))**2
    read_y=np.clip(yy+(yy-mid)*strength*sx*sy,0,base.height-1)
    lo=np.floor(read_y).astype(int); hi=np.minimum(lo+1,base.height-1)
    mix=(read_y-lo)[...,None]
    out[y0:y1,x0:x1]=src[lo,xx]*(1-mix)+src[hi,xx]*mix
    return Image.fromarray(np.uint8(np.clip(out,0,255)),"RGBA")

for app, casts in FACES.items():
    for cast, (eyes,mouth,cheek_at) in casts.items():
        path=ROOT/app/"design"/"source"/cast
        base=Image.open(path/"head_2_face.png").convert("RGBA")
        cheek=SKIN[app][cast]
        def save_cel(cel, state):
            cel.putalpha(base.getchannel("A"))
            cel.save(path/f"head_2_face_{state}.png")
        if (app,cast) in WIDE_GRIN or (app,cast) in COMIC_MOUTH:
            # Three original mascots had a permanent tooth grid. Keep their
            # source artwork intact and use a shared, teeth-free rest pose.
            # The Pocha lead gets the same lip/teeth/jaw construction.
            acting_box=COMIC_MOUTH.get((app,cast),mouth)
            rest=comic_laugh(base,acting_box,cheek,0.0)
            stages=[comic_laugh(base,acting_box,cheek,a) for a in (.24,.46,.72,1.0)]
            open_face=stages[-1]
            closed_face=rest
        elif (app,cast) in OPEN_BASE:
            rework=(app,cast) in REWORK_FG
            rest=mouth_closed(base,mouth,cheek,CLOSE_PATCH[(app,cast)],1.5 if rework else 1.25)
            stages=[mouth_closed(base,mouth,cheek,CLOSE_PATCH[(app,cast)],s)
                    for s in ((1.1,.75,.36,0.0) if rework else (.95,.66,.33,0.0))]
            open_face=stages[-1]
            closed_face=rest
        else:
            rest=base
            stages=[mouth_open(base,mouth,cheek,False,a) for a in (.20,.42,.68,1.0)]
            open_face=stages[-1]
            closed_face=rest
        save_cel(blink(rest,eyes,cheek),"blink")
        save_cel(rest,"rest")
        for i,stage in enumerate(stages,1):
            save_cel(stage,f"laugh_{i}")
        save_cel(blink(stages[2],eyes,cheek),"laugh_3_blink")
        save_cel(blink(stages[3],eyes,cheek),"laugh_4_blink")
        if app == "DinerMonkey美式餐館":
            painted_peak=Image.open(path/"head_2_face_peak.png").convert("RGBA")
            save_cel(blink(painted_peak,eyes,cheek),"peak_blink")
        save_cel(open_face,"talk_open")
        save_cel(closed_face,"talk_closed")
        alpha=np.asarray(base.getchannel("A"))
        for state in ("blink","rest","laugh_1","laugh_2","laugh_3","laugh_4",
                      "laugh_3_blink","laugh_4_blink","talk_open","talk_closed"):
            cel=Image.open(path/f"head_2_face_{state}.png")
            if not np.array_equal(np.asarray(cel.getchannel("A")),alpha):
                raise RuntimeError(f"Silhouette changed: {app} {cast} {state}")
        if app != "DinerMonkey美式餐館":
            left=np.asarray(open_face.convert("RGB")).astype(np.int16)
            right=np.asarray(closed_face.convert("RGB")).astype(np.int16)
            if int(np.count_nonzero(np.max(np.abs(left-right),axis=2)>20))<100:
                raise RuntimeError(f"Mouth cels do not move: {app} {cast}")
        print(app,cast,base.size,cheek)
