"""Export Jade Teahouse art from the generated sources.

The source illustrations live in design/source/jade.  This script only crops,
sizes, and composes those illustrations or draws simple UI geometry; it never
touches SushiMonkey's assets.
"""

from pathlib import Path
from PIL import Image, ImageChops, ImageDraw, ImageEnhance, ImageFilter, ImageFont, ImageOps

APP = Path(__file__).resolve().parents[1]
SOURCE = APP / "design/source/jade"
SPRITES = APP / "static/assets/sprites"
CAST = APP / "design/cast_delivery"
IVORY = (247, 244, 232, 255)
PAPER = (252, 249, 239, 255)
JADE = (123, 171, 151, 255)
DARK_JADE = (44, 92, 77, 255)
GOLD = (197, 153, 75, 255)
INK = (42, 64, 55, 255)


def save(image, folder, name):
    path = SPRITES / folder / name
    path.parent.mkdir(parents=True, exist_ok=True)
    image.save(path, optimize=True)


def font(size, cjk=False, weight=None):
    paths = [
        Path("C:/Windows/Fonts/NotoSerifTC-VF.ttf") if cjk else APP.parents[1] / "apps/DeadwoodExpress/static/fonts/Cinzel.ttf",
        Path("C:/Windows/Fonts/arial.ttf"),
    ]
    for path in paths:
        if path.exists():
            face = ImageFont.truetype(str(path), size)
            if cjk and weight is not None and path.name == "NotoSerifTC-VF.ttf":
                face.set_variation_by_axes([weight])
            return face
    return ImageFont.load_default()


def title(draw, center, text, size, fill=INK, cjk=False):
    draw.text(center, text, font=font(size, cjk), fill=fill, anchor="mm",
              stroke_width=0)


def panel(size, inset=16, radius=30, bg=PAPER, border=JADE, gold=True):
    image = Image.new("RGBA", size)
    d = ImageDraw.Draw(image)
    w, h = size
    # Printed-comic keyline and edge halftone. Keep the centre clean for type.
    d.rounded_rectangle((inset-3, inset-3, w-inset+2, h-inset+2), radius+3,
                        outline=INK, width=max(3, w//300))
    d.rounded_rectangle((inset, inset, w-inset-1, h-inset-1), radius,
                        fill=bg, outline=DARK_JADE, width=max(3, w//230))
    for x in range(inset+radius, w-inset-radius, 13):
        for y in (inset+27, h-inset-29):
            if (x//13) % 3:
                d.ellipse((x-1,y-1,x+1,y+1), fill=(65,82,70,255))
    for y in range(inset+radius, h-inset-radius, 13):
        for x in (inset+27, w-inset-29):
            if (y//13) % 3:
                d.ellipse((x-1,y-1,x+1,y+1), fill=(65,82,70,255))
    d.rounded_rectangle((inset+9, inset+9, w-inset-10, h-inset-10),
                        max(4, radius-8), outline=border, width=max(2, w//310))
    if gold:
        d.line((inset+radius, inset+17, w-inset-radius, inset+17), fill=GOLD, width=max(2,w//360))
        d.line((inset+radius, h-inset-18, w-inset-radius, h-inset-18), fill=GOLD, width=max(2,w//360))
        for x in (inset+radius, w-inset-radius):
            for y in (inset+radius, h-inset-radius):
                r = max(4,w//95)
                d.ellipse((x-r,y-r,x+r,y+r),fill=GOLD,outline=DARK_JADE,width=2)
    return image


def main():
    # Full-scene art, shown behind the reel housing.
    for mode in ("base", "feature"):
        image = Image.open(SOURCE / f"background_{mode}.png").convert("RGB")
        image = ImageOps.fit(image, (1920, 1080), Image.Resampling.LANCZOS)
        save(image, "sushiBackground", f"bg_{mode}.png")

    # Generate one independently cropped 512px file per symbol. The old contact
    # sheet let adjacent drawings cross tile boundaries (dragon on H2, tray on
    # H4); clean individual imagegen edits override those three cells.
    sheet = Image.open(SOURCE / "symbol_atlas.png").convert("RGBA")
    names = ["h1", "h2", "h3", "h4", "p", "s", "w", "low_label"]
    for index, name in enumerate(names):
        col, row = index % 4, index // 4
        box = (round(col*sheet.width/4), round(row*sheet.height/2),
               round((col+1)*sheet.width/4), round((row+1)*sheet.height/2))
        override = SOURCE / f"symbol_{name}.png"
        tile = Image.open(override).convert("RGBA") if override.exists() else sheet.crop(box)
        bbox = tile.getbbox()
        if bbox:
            tile = tile.crop(bbox)
        tile.thumbnail((480,480), Image.Resampling.LANCZOS)
        out = Image.new("RGBA", (512,512))
        out.alpha_composite(tile, ((512-tile.width)//2,(512-tile.height)//2))
        save(out, "sushiSymbols", f"{name}.png")

    # Low-pay ranks: restrained printed tea tickets, each with its own colour
    # and corner motif. The actual rank stays runtime text so language and pay
    # table remain code-driven; these cards give A/K/Q/J/10 distinct silhouettes.
    low_colours = {
        "l1": ((232,239,220,255), (46,98,76,255)),
        "l2": ((230,239,235,255), (55,101,104,255)),
        "l3": ((244,232,226,255), (136,72,68,255)),
        "l4": ((239,232,245,255), (102,77,131,255)),
        "l5": ((245,239,218,255), (144,105,43,255)),
    }
    for name, (wash, accent) in low_colours.items():
        im = Image.new("RGBA", (512,512))
        d = ImageDraw.Draw(im)
        d.rounded_rectangle((49,45,463,467),46,fill=PAPER,outline=INK,width=13)
        d.rounded_rectangle((62,58,450,454),38,outline=accent,width=11)
        d.rounded_rectangle((82,78,430,434),28,fill=wash,outline=GOLD,width=5)
        for dx,dy in ((105,104),(407,104),(105,408),(407,408)):
            d.ellipse((dx-12,dy-12,dx+12,dy+12),fill=accent)
        for x in range(113,409,17):
            for y in (91,421):
                if x % 3: d.ellipse((x,y,x+2,y+2),fill=INK)
        save(im,"sushiSymbols",f"{name}.png")

    # The frame art is an imagegen edit of the source's exact opening.  The
    # source alpha locks the inner aperture and the outer canvas geometry.
    frame = Image.open(SOURCE / "frame_edge.png").convert("RGBA")
    frame = frame.resize((1280,1280), Image.Resampling.LANCZOS)
    original = Image.open(SPRITES / "sushiFrame/frame_edge.png").convert("RGBA")
    frame.putalpha(original.getchannel("A"))
    save(frame, "sushiFrame", "frame_edge.png")
    bg = Image.new("RGBA", (1280,1280))
    d = ImageDraw.Draw(bg)
    d.rectangle((118,118,1162,1162),fill=(248,247,237,255))
    for x in range(130,1160,72):
        d.line((x,125,x+260,1155),fill=(226,236,223,35),width=2)
    save(bg,"sushiFrame","frame_bg.png")

    # Retain the source rig's coordinate space and cut polygons.  Both edited
    # full-body images keep the source stance, allowing the existing animated
    # two-character Spine pipeline to be rebuilt from the new costumes.
    CAST.mkdir(parents=True, exist_ok=True)
    for mode, source_name, height in (("mg","master_full.png",1599),
                                      ("fg","apprentice_full.png",1598)):
        im = Image.open(SOURCE/source_name).convert("RGBA")
        im = ImageOps.fit(im,(984,height),Image.Resampling.LANCZOS)
        im.save(CAST/f"{mode}_full_source.png",optimize=True)
    cut = Image.open(SOURCE/"fan_cut_in.png").convert("RGBA")
    cut = ImageOps.contain(cut,(1024,1024),Image.Resampling.LANCZOS)
    out = Image.new("RGBA",(1024,1024))
    out.alpha_composite(cut,((1024-cut.width)//2,(1024-cut.height)//2))
    save(out,"sushiScene","chef_cut_in.png")

    # Readouts, buttons and buy card art.  The shared Pixi UI reads these
    # sprites while its text and active-state colours come from uiTheme.ts.
    save(panel((1600,200),12,30),"sushiUi","bar_strip.png")
    save(panel((652,146),8,20),"sushiUi","ticker_plate.png")
    for name, lit in (("button_plate.png",False),("button_print.png",False),
                      ("button_print_on.png",True),("spin_plate.png",True)):
        im = Image.new("RGBA",(256,256))
        d = ImageDraw.Draw(im)
        d.ellipse((11,11,244,244),fill=(214,172,82,255) if name=="button_print_on.png" else ((231,243,226,255) if lit else PAPER),
                  outline=GOLD if lit else DARK_JADE,width=11)
        d.ellipse((28,28,227,227),outline=DARK_JADE if name=="button_print_on.png" else JADE,width=6)
        d.arc((43,43,212,212),20,160,fill=GOLD,width=5)
        d.arc((43,43,212,212),200,340,fill=GOLD,width=5)
        save(im,"sushiUi",name)
    buy_source = Image.open(SOURCE / "buybonus_sign_blank.png").convert("RGBA")
    buy_sign = ImageOps.contain(buy_source, (512,512), Image.Resampling.LANCZOS)
    buy_plate = Image.new("RGBA", (512,512))
    buy_plate.alpha_composite(buy_sign, ((512-buy_sign.width)//2,(512-buy_sign.height)//2))
    buy_plate.putalpha(buy_plate.getchannel("A").point(lambda a: 0 if a < 32 else a))
    save(buy_plate,"sushiUi","buybonus_plate.png")
    lit_plate = ImageEnhance.Brightness(buy_plate).enhance(1.12)
    rim = buy_plate.getchannel("A").point(lambda a: 255 if a > 128 else 0).filter(ImageFilter.MaxFilter(13))
    rim_art = Image.new("RGBA", (512,512))
    gold_rim = Image.new("RGBA", (512,512), GOLD)
    gold_rim.putalpha(rim)
    rim_art.alpha_composite(gold_rim)
    rim_art.alpha_composite(lit_plate)
    save(rim_art,"sushiUi","buybonus_plate_lit.png")
    for name in ("bonus","superbonus"):
        im=panel((600,840),18,28, PAPER, GOLD if name=="superbonus" else JADE)
        d=ImageDraw.Draw(im)
        d.rounded_rectangle((44,45,556,212),18,fill=(221,236,216,255),outline=GOLD,width=4)
        d.arc((150,610,450,800),20,160,fill=JADE,width=8)
        save(im,"sushiUi",f"card_{name}.png")

    # A single detailed door leaf is mirrored by the transition component.
    door=Image.open(SOURCE/"door_refined.png").convert("RGBA")
    door=ImageOps.fit(door,(1400,1080),Image.Resampling.LANCZOS)
    save(door,"sushiScene","door.png")
    save(ImageOps.fit(door,(1920,1080),Image.Resampling.LANCZOS),
         "sushiScene","shutter.png")
    valance=Image.open(SOURCE/"noren_refined_blank.png").convert("RGBA")
    valance=valance.resize((1920,420),Image.Resampling.LANCZOS)
    d=ImageDraw.Draw(valance)
    d.text((960,150),"玉茗茶樓",font=font(104,True,780),anchor="mm",
           fill=DARK_JADE,stroke_width=1,stroke_fill=DARK_JADE)
    save(valance,"sushiScene","noren.png")
    save(panel((1000,600),26,45),"sushiScene","fs_plate.png")

    # Reusable jade paper graphics for the intro, meters and win panels.
    v8=SPRITES/"sushiV8"
    fg_sign=Image.open(SOURCE/"fg_sign_refined_blank.png").convert("RGBA")
    fg_sign=fg_sign.resize((1600,1000),Image.Resampling.LANCZOS)
    for name in ("fg_intro.png","fg_total.png"):
        save(fg_sign,"sushiV8",name)
    scroll=Image.open(SOURCE/"intro_scroll_blank.png").convert("RGBA")
    save(scroll.resize((740,1024),Image.Resampling.LANCZOS),"sushiV8","menu_frame.png")
    logo=Image.open(SOURCE/"logo_sign_blank.png").convert("RGBA")
    logo=logo.resize((1600,600),Image.Resampling.LANCZOS)
    d=ImageDraw.Draw(logo)
    d.text((800,175),"JADE TEAHOUSE",font=font(128),anchor="mm",fill=DARK_JADE,
           stroke_width=2,stroke_fill=GOLD)
    d.text((800,405),"玉茗茶樓",font=font(70,True,780),anchor="mm",
           fill=DARK_JADE,stroke_width=1,stroke_fill=DARK_JADE)
    for symbol,x in (("p",372),("s",1240)):
        art=Image.open(SPRITES/"sushiSymbols"/f"{symbol}.png").convert("RGBA")
        art.thumbnail((132,155),Image.Resampling.LANCZOS)
        logo.alpha_composite(art,(x-art.width//2,410-art.height//2))
    save(logo,"sushiV8","logo_board.png")

    # Intro illustrations stay transparent: the card itself supplies the one
    # frame, avoiding the previous stack of two blank paper panels.
    for name, symbols in (("intro_collect",("w","p")),
                          ("intro_slice",("s","p")),
                          ("intro_receipt",("h1",))):
        im=Image.new("RGBA",(1024,640))
        d=ImageDraw.Draw(im)
        d.ellipse((260,48,764,552),fill=(230,241,225,255),outline=DARK_JADE,width=15)
        d.ellipse((281,69,743,531),outline=GOLD,width=10)
        positions=[(330,94,360),(528,248,240)] if len(symbols)==2 else [(340,92,345)]
        for symbol,(x,y,size) in zip(symbols,positions):
            art=Image.open(SPRITES/"sushiSymbols"/f"{symbol}.png").convert("RGBA")
            art.thumbnail((size,size),Image.Resampling.LANCZOS)
            im.alpha_composite(art,(x+(size-art.width)//2,y+(size-art.height)//2))
        save(im,"sushiV8",f"{name}.png")
    for name,size in (("logo_stamp.png",(512,512)),("stamp.png",(512,512)),
                      ("soy_full.png",(512,512)),("soy_empty.png",(512,512))):
        im=Image.new("RGBA",size)
        d=ImageDraw.Draw(im)
        d.ellipse((58,58,454,454),fill=(224,239,220,255) if name!="soy_empty.png" else PAPER,
                  outline=GOLD if name!="soy_empty.png" else JADE,width=21)
        if name in ("logo_stamp.png","stamp.png"):
            title(d,(256,256),"茶",190,DARK_JADE,True)
        save(im,"sushiV8",name)
    for name in ("back_h1.png","back_h2.png","back_s.png"):
        save(panel((512,512),24,50),"sushiV8",name)
    for name in ("fg_intro_decor.png","fg_total_decor.png"):
        save(Image.new("RGBA",(1600,1000)),"sushiV8",name)
    # title_free / title_total are built by design/build_wordmarks.py now
    # (carved-jade wordmarks, 2026-10-16); this flat version is kept out of the
    # way so a rerun of this script cannot overwrite them.
    for name in ():
        im=Image.new("RGBA",(1600,500))
        d=ImageDraw.Draw(im)
        d.text((800,252),"FREE SPINS" if name=="title_free.png" else "TOTAL WIN",
               font=font(160),anchor="mm",fill=DARK_JADE,
               stroke_width=2,stroke_fill=GOLD)
        save(im,"sushiV8",name)
    win_plaque=Image.open(SOURCE/"win_plaque_refined_blank.png").convert("RGBA")
    win_plaque=win_plaque.resize((1000,560),Image.Resampling.LANCZOS)
    # Shift only green pigment; gold trim, ivory payout paper and shaded
    # linework retain the generated illustration's detail.
    h,s,v=win_plaque.convert("RGB").convert("HSV").split()
    green_mask=ImageChops.multiply(
        h.point(lambda value: 255 if 48 <= value <= 145 else 0),
        s.point(lambda value: 255 if value >= 55 else 0))
    for tier in ("big","super","mega","epic","max"):
        if tier == "big":
            tier_plaque=win_plaque
        else:
            hue={"super":143,"mega":9,"epic":190,"max":28}[tier]
            shifted_h=Image.composite(Image.new("L",h.size,hue),h,green_mask)
            tier_plaque=Image.merge("HSV",(shifted_h,s,v)).convert("RGBA")
            tier_plaque.putalpha(win_plaque.getchannel("A"))
        save(tier_plaque,"sushiV8",f"win_{tier}.png")
        save(Image.new("RGBA",(1000,560)),"sushiV8",f"win_{tier}_decor.png")
    for tier in ("big","superwin","mega","epic","max"):
        im=panel((1000,560),20,40)
        d=ImageDraw.Draw(im)
        title(d,(500,270),tier.upper().replace("SUPERWIN","SUPER WIN"),100,DARK_JADE)
        save(im,"sushiWinBanners",f"{tier}.png")

    # Runtime InkNumber uses 4 × 16 single-character PNGs. Replace the copied
    # rust-shadowed Sushi font with a dark jade/gold comic print, preserving each
    # file's dimensions and therefore the existing spacing metadata.
    chars="0123456789.,×$+/"
    role_fills={"count":(39,82,67,255),"fs":(44,112,98,255),
                "plate":(132,83,47,255),"receipt":(50,70,65,255)}
    for role,fill in role_fills.items():
        for i,char in enumerate(chars):
            path=v8/f"digit_{role}_{i}.png"
            width,height=Image.open(path).size
            glyph=Image.new("RGBA",(width,height))
            d=ImageDraw.Draw(glyph)
            f=font(206)
            cy=190 if char in ".," else 128
            d.text((width//2+4,cy+5),char,font=f,anchor="mm",fill=GOLD,
                   stroke_width=3,stroke_fill=INK)
            d.text((width//2,cy),char,font=f,anchor="mm",fill=fill,
                   stroke_width=4,stroke_fill=INK)
            save(glyph,"sushiV8",path.name)

    # Tea leaves and festival paper replace the Sushi confetti. All sixteen
    # frames remain available to the original big-win particle timing.
    for i in range(16):
        im=Image.new("RGBA",(128,128))
        d=ImageDraw.Draw(im)
        if i%4==0:
            d.ellipse((30,18,98,110),fill=(116,166,139,255),outline=INK,width=7)
            d.line((64,28,64,104),fill=(231,244,221,255),width=6)
            for y in (42,62,82):
                d.line((42,y-9,64,y+7,86,y-11),fill=INK,width=3)
        elif i%4==1:
            d.polygon([(24,28),(94,15),(107,94),(38,110)],fill=(245,227,171,255))
            d.line((24,28,94,15,107,94,38,110,24,28),fill=INK,width=6)
            d.line((33,49,98,37),fill=GOLD,width=4)
        elif i%4==2:
            d.ellipse((24,24,104,104),fill=(227,238,222,255),outline=INK,width=7)
            d.ellipse((37,37,91,91),outline=GOLD,width=8)
            d.ellipse((54,54,74,74),fill=DARK_JADE)
        else:
            d.polygon([(64,15),(78,47),(113,56),(82,75),(75,112),(55,81),(18,73),(48,54)],
                      fill=(228,169,141,255))
            d.line((64,15,78,47,113,56,82,75,75,112,55,81,18,73,48,54,64,15),
                   fill=INK,width=6)
        save(im,"sushiV8",f"particle_{i}.png")
    ray=Image.new("RGBA",(1024,1024))
    rd=ImageDraw.Draw(ray)
    rd.polygon([(512,1018),(305,54),(719,54)],fill=(245,220,145,75))
    rd.line((512,1018,305,54),fill=(197,153,75,110),width=12)
    rd.line((512,1018,719,54),fill=(197,153,75,110),width=12)
    for y in range(90,810,34):
        half=int((1018-y)*0.19)
        for x in range(512-half+16,512+half,38):
            if (x+y//34)%3==0:rd.ellipse((x,y,x+4,y+4),fill=(85,124,94,90))
    save(ray,"sushiV8","ray.png")

    # Existing atlas metadata refers to banana_01..10; the atlas layout is
    # unchanged but each frame now depicts the jade cup prize object.
    cup=Image.open(SPRITES/"sushiSymbols/p.png").convert("RGBA")
    cup.thumbnail((232,232),Image.Resampling.LANCZOS)
    atlas=Image.new("RGBA",(1280,512))
    for i in range(10):
        x=(i%5)*256+(256-cup.width)//2
        y=(i//5)*256+(256-cup.height)//2
        atlas.alpha_composite(cup,(x,y))
    save(atlas,"sushiWinPlates","bananas.png")
    cup_fx=Image.new("RGBA",(128,128))
    small=cup.copy()
    small.thumbnail((116,116),Image.Resampling.LANCZOS)
    cup_fx.alpha_composite(small,((128-small.width)//2,(128-small.height)//2))
    save(cup_fx,"sushiFx","collect_bananas.png")

    print("Jade Teahouse art exported")


if __name__ == "__main__":
    main()
