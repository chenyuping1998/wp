"""Prepare Go Bananeon art delivery from generated source images.

The hard-edged panels and lettering are drawn here so text and transparent
centres remain exact. Generated painterly art is mapped in SOURCES below.
"""

from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageEnhance, ImageStat

ROOT = Path(__file__).parent / "source" / "neon_delivery"
GEN = Path(r"C:\Users\cheny\.codex\generated_images\01a0ff1d-0ced-7aa3-8a78-9df65de31327")
FONT = r"C:\Windows\Fonts\arialbd.ttf"
CYAN = (34, 238, 255)
MAGENTA = (255, 43, 214)
LIME = (184, 255, 60)
VIOLET = (155, 92, 255)
INDIGO = (46, 42, 88)

SOURCES = {
    "symbols/h1.png": "exec-825ed043-52df-4a04-9cd8-1bfdc8f2e841.png",
    "symbols/h2.png": "exec-067a9895-7be9-4b02-846d-1687565f9024.png",
    "symbols/h3.png": "exec-2073524d-43ec-4e14-b9d2-10e46652ac1b.png",
    "symbols/h4.png": "exec-d645cc63-2616-43cc-8e74-c0c1a8c80caf.png",
    "symbols/w.png": "exec-cf1731e3-592b-4923-9d02-f4c46330340e.png",
    "symbols/s.png": "exec-c466e21c-16e9-4e4a-8a51-eb18ef14e1e6.png",
    "symbols/b.png": "exec-b1653737-6596-4842-93a1-7adaa3894345.png",
    "symbols/p.png": "exec-4f0c547a-4764-47f5-9fe7-70e7e3c44aa7.png",
    "symbols/bomb_prop.png": "exec-fa452553-5803-4f67-bc53-d9b71ec88654.png",
    "backgrounds/bg_base.png": "exec-f19dee85-aa6d-4809-8cdb-af2a4a65a04d.png",
    "backgrounds/bg_feature.png": "exec-1d2b2a1d-f1e2-4088-b94d-6d2766c04cd1.png",
    "backgrounds/bg_holdandspin.png": "exec-215a21a1-1dc0-4a8c-aef4-d66f23046f57.png",
    "ui/buy_art_bonus.jpg": "exec-f6d89086-80b6-420d-b92c-b62790b32a5b.png",
    "ui/buy_art_holdandspin.jpg": "exec-496765bb-eecf-42a8-80f1-f006fddf5d34.png",
    "thumbnail/thumb_bg.png": "exec-9ddadf96-b6b6-46a7-9ee6-f00607e9009d.png",
    "mascot/mascot_full.png": "exec-b232eb66-d48b-4e0b-b6a5-1816177af051.png",
}


def save(im, name):
    path = ROOT / name
    path.parent.mkdir(parents=True, exist_ok=True)
    im.save(path)


def standardize():
    for name, source in SOURCES.items():
        im = Image.open(GEN / source)
        if name.startswith("backgrounds/"):
            im = im.resize((1920, 1080), Image.Resampling.LANCZOS)
        elif name.startswith("ui/buy_art"):
            im = im.convert("RGB").resize((800, 450), Image.Resampling.LANCZOS)
        elif name.startswith("mascot/"):
            im = im.convert("RGBA").resize((1024, 1707), Image.Resampling.LANCZOS)
        else:
            im = im.resize((1024, 1024), Image.Resampling.LANCZOS)
        save(im, name)


def rounded_layer(size, box, radius, fill, outline=None, width=1):
    layer = Image.new("RGBA", size)
    d = ImageDraw.Draw(layer)
    d.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=width)
    return layer


def glow(im, box, color, radius=20, width=6, corner=30):
    layer = Image.new("RGBA", im.size)
    d = ImageDraw.Draw(layer)
    d.rounded_rectangle(box, radius=corner, outline=(*color, 220), width=width)
    blur = layer.filter(ImageFilter.GaussianBlur(radius))
    im.alpha_composite(blur)
    im.alpha_composite(layer)


def low_symbols():
    # All five are produced from one layout and font, differing only in glyph.
    for index, glyph in enumerate(["A", "K", "Q", "J", "10"], 1):
        im = Image.new("RGB", (1024, 1024), (215, 213, 222))
        d = ImageDraw.Draw(im)
        d.rounded_rectangle((44, 44, 980, 980), radius=112, fill=(207, 204, 214), outline=(247, 247, 251), width=17)
        d.rounded_rectangle((75, 75, 949, 949), radius=90, outline=(169, 168, 185), width=12)
        d.rounded_rectangle((96, 96, 928, 928), radius=77, fill=(216, 214, 223), outline=(240, 238, 247), width=7)
        # Subtle translucent acrylic sheen, restricted to the tile.
        d.polygon([(111, 120), (570, 120), (260, 905), (111, 905)], fill=(221, 219, 228))
        d.line([(136, 154), (868, 154)], fill=(248, 247, 250), width=8)
        font_size = 580 if glyph != "10" else 490
        font = ImageFont.truetype(FONT, font_size)
        bbox = d.textbbox((0, 0), glyph, font=font, stroke_width=0)
        x = (1024 - (bbox[2] - bbox[0])) / 2 - bbox[0]
        y = (1024 - (bbox[3] - bbox[1])) / 2 - bbox[1] - 10
        d.text((x + 7, y + 12), glyph, font=font, fill=(119, 114, 142))
        d.text((x - 3, y - 5), glyph, font=font, fill=(255, 255, 255))
        d.text((x, y), glyph, font=font, fill=(36, 30, 72))
        save(im, f"symbols/l{index}.png")


def frame_edge():
    im = Image.new("RGBA", (1280, 1280))
    d = ImageDraw.Draw(im)
    d.rounded_rectangle((24, 24, 1256, 1256), radius=78, fill=(35, 38, 66, 255), outline=(185, 204, 226, 255), width=15)
    d.rounded_rectangle((47, 47, 1233, 1233), radius=64, outline=(108, 127, 158, 255), width=17)
    glow(im, (63, 63, 1217, 1217), MAGENTA, radius=16, width=13, corner=59)
    side = Image.new("RGBA", im.size)
    sd = ImageDraw.Draw(side)
    sd.line((63, 130, 63, 1150), fill=(*CYAN, 255), width=13)
    sd.line((1217, 130, 1217, 1150), fill=(*CYAN, 255), width=13)
    im.alpha_composite(side.filter(ImageFilter.GaussianBlur(17)))
    im.alpha_composite(side)
    d = ImageDraw.Draw(im)
    for x in (55, 1225):
        for y in (55, 1225):
            d.ellipse((x-20, y-20, x+20, y+20), fill=(210, 221, 234, 255), outline=(73, 85, 111, 255), width=7)
    # Guarantee the complete playable interior is alpha zero.
    d.rounded_rectangle((91, 91, 1189, 1189), radius=35, fill=(0, 0, 0, 0))
    save(im, "frame/frame_edge.png")


def frame_bg():
    im = Image.new("RGBA", (1280, 1280), (26, 23, 63, 187))
    d = ImageDraw.Draw(im)
    d.rounded_rectangle((11, 11, 1269, 1269), radius=45, outline=(94, 115, 160, 105), width=11)
    save(im, "frame/frame_bg.png")


def signboard(name, size, box, strips=False, notch=False):
    im = Image.new("RGBA", size)
    d = ImageDraw.Draw(im)
    d.rounded_rectangle(box, radius=63, fill=(31, 29, 70, 244), outline=(190, 205, 224, 255), width=18)
    inset = (box[0]+21, box[1]+21, box[2]-21, box[3]-21)
    glow(im, inset, MAGENTA, radius=22, width=10, corner=52)
    d = ImageDraw.Draw(im)
    d.rounded_rectangle((box[0]+42,box[1]+42,box[2]-42,box[3]-42), radius=35, outline=(80, 105, 143, 255), width=5)
    if strips:
        height = box[3]-box[1]
        for y in (box[1]+height//3, box[1]+2*height//3):
            d.line((box[0]+34,y,box[2]-34,y), fill=(187,203,220,255), width=18)
            d.line((box[0]+40,y+10,box[2]-40,y+10), fill=(95,73,127,230), width=5)
    if notch:
        x = size[0]//2
        d.rounded_rectangle((x-105,box[1]+34,x+105,box[1]+132), radius=31, fill=(16,17,47,255), outline=(82,220,243,220), width=7)
    for x in (box[0]+35,box[2]-35):
        for y in (box[1]+35,box[3]-35):
            d.ellipse((x-10,y-10,x+10,y+10), fill=(211,224,235,255))
    save(im, name)


def button(name, lit):
    im = Image.new("RGBA", (800,800))
    d = ImageDraw.Draw(im)
    d.rounded_rectangle((45,45,755,755), radius=150, fill=(35,33,75,252), outline=(191,207,224,255), width=25)
    d.rounded_rectangle((75,75,725,725), radius=130, outline=(78,103,139,255), width=9)
    color = MAGENTA if lit else (117,92,125)
    if lit:
        glow(im,(103,103,697,697),color,radius=28,width=15,corner=111)
    else:
        d.rounded_rectangle((103,103,697,697), radius=111, outline=(*color,230), width=15)
    d = ImageDraw.Draw(im)
    d.arc((128,128,672,672), 205, 298, fill=(155,162,199,90), width=10)
    save(im,name)


def ticker():
    im = Image.new("RGBA", (652,146))
    d = ImageDraw.Draw(im)
    d.rounded_rectangle((8,10,644,136), radius=33, fill=(30,29,72,248), outline=(174,199,219,255), width=8)
    glow(im,(17,19,635,127),CYAN,radius=8,width=4,corner=28)
    save(im,"ui/ticker_plate.png")


def neon_text(im, words, color):
    d = ImageDraw.Draw(im)
    font_size = 132
    while font_size > 55:
        font = ImageFont.truetype(FONT, font_size)
        box = d.textbbox((0,0), words, font=font, stroke_width=4)
        if box[2]-box[0] <= 810:
            break
        font_size -= 2
    x = (1000-(box[2]-box[0]))/2-box[0]
    y = 147-box[1]
    halo = Image.new("RGBA",im.size)
    hd = ImageDraw.Draw(halo)
    hd.text((x,y),words,font=font,fill=(*color,240),stroke_width=9,stroke_fill=(*color,255))
    im.alpha_composite(halo.filter(ImageFilter.GaussianBlur(17)))
    d = ImageDraw.Draw(im)
    d.text((x,y),words,font=font,fill=(246,250,255,255),stroke_width=4,stroke_fill=(*color,255))


def banner(name,words,color,level):
    im = Image.new("RGBA",(1000,560))
    d = ImageDraw.Draw(im)
    d.rounded_rectangle((36,44,964,516),radius=64,fill=(30,29,70,246),outline=(179,202,222,255),width=17)
    glow(im,(57,65,943,495),color,radius=18+level*2,width=9,corner=48)
    if level == 5:
        cyan = Image.new("RGBA",im.size)
        cd = ImageDraw.Draw(cyan)
        cd.line((67,122,67,438),fill=(*CYAN,255),width=12)
        cd.line((933,122,933,438),fill=(*CYAN,255),width=12)
        cd.line((220,75,780,75),fill=(*CYAN,255),width=7)
        im.alpha_composite(cyan.filter(ImageFilter.GaussianBlur(15)))
        im.alpha_composite(cyan)
    d = ImageDraw.Draw(im)
    d.line((108,331,892,331),fill=(112,134,167,230),width=6)
    neon_text(im,words,color)
    # Upper-corner sparks increase with prize rank; lower amount field remains empty.
    d = ImageDraw.Draw(im)
    for i in range(level):
        x = 99+i*26
        d.line((x,78,x,113),fill=(*color,230),width=5)
        d.line((x-16,95,x+16,95),fill=(*color,230),width=5)
        x = 901-i*26
        d.line((x,78,x,113),fill=(*color,230),width=5)
        d.line((x-16,95,x+16,95),fill=(*color,230),width=5)
    save(im,name)


def thumb_fg():
    mascot = Image.open(ROOT/"mascot/mascot_full.png").convert("RGBA")
    # Upper-body crop keeps precisely the same character as Wild and full mascot.
    crop = mascot.crop((15,0,1010,1190))
    crop.thumbnail((980,1000),Image.Resampling.LANCZOS)
    im = Image.new("RGBA",(1024,1024))
    im.alpha_composite(crop,((1024-crop.width)//2,1024-crop.height))
    save(im,"thumbnail/thumb_fg.png")


def main():
    standardize()
    low_symbols()
    frame_edge()
    frame_bg()
    signboard("frame/fs_sign.png",(1280,1000),(67,96,1213,904),strips=True)
    signboard("frame/fs_counter_panel.png",(1280,966),(122,133,1158,851),notch=True)
    button("ui/buybonus_stone.png",False)
    button("ui/buybonus_stone_lit.png",True)
    ticker()
    for name,words,color,level in [
        ("big","BIG WIN",CYAN,1),
        ("superwin","SUPER WIN",LIME,2),
        ("mega","MEGA WIN",MAGENTA,3),
        ("epic","EPIC WIN",VIOLET,4),
        ("max","MAX WIN",MAGENTA,5),
    ]:
        banner(f"banners/{name}.png",words,color,level)
    thumb_fg()
    print(f"Prepared {len(list(ROOT.rglob('*.*')))} files in {ROOT}")


if __name__ == "__main__":
    main()
