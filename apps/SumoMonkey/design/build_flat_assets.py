"""Draw brief-specified housing and UI plates in fixed screenprint spot inks.

These are geometric production assets. All player-facing words and numbers are
left blank for the runtime font layer.
"""

from pathlib import Path
from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[1] / "static/assets/sprites"
INK = {
    "paper": "#F2E8D0",
    "green": "#1F5C4A",
    "red": "#D24A2C",
    "black": "#1E1B1A",
    "brown": "#4E2E22",
    "yellow": "#F4C21B",
}


def save(group, name, image):
    dest = ROOT / group / name
    dest.parent.mkdir(parents=True, exist_ok=True)
    image.save(dest)


def frame():
    bg = Image.new("RGBA", (1280, 1280), INK["paper"])
    d = ImageDraw.Draw(bg)
    for y in (230, 480, 730, 980):
        d.rectangle((0, y, 1280, y + 13), fill=INK["green"] + "18")
    save("sushiFrame", "frame_bg.png", bg)

    edge = Image.new("RGBA", (1280, 1280))
    d = ImageDraw.Draw(edge)
    d.rounded_rectangle((0, 0, 1279, 1279), radius=85, fill=INK["green"])
    for y in (26, 93, 1172, 1240):
        d.rectangle((70, y, 1210, y + 13), fill=INK["brown"])
    for x in (26, 93, 1172, 1240):
        d.rectangle((x, 70, x + 13, 1210), fill=INK["brown"])
    # The live board occupies the central 1000×1000 source area. Keep it open.
    d.rectangle((140, 140, 1140, 1140), fill=(0, 0, 0, 0))
    for x in (36, 1211):
        for y in (36, 1211):
            d.rectangle((x, y, x + 34, y + 34), fill=INK["black"])
            d.ellipse((x + 12, y + 12, x + 22, y + 22), fill=INK["paper"])
    save("sushiFrame", "frame_edge.png", edge)


def shutter():
    im = Image.new("RGBA", (1920, 1080), INK["green"])
    d = ImageDraw.Draw(im)
    for y in range(0, 1080, 72):
        d.rectangle((0, y, 1919, y + 8), fill=INK["black"])
        d.rectangle((0, y + 10, 1919, y + 16), fill=INK["brown"])
    save("sushiScene", "shutter.png", im)


def poster():
    im = Image.new("RGBA", (1000, 600))
    d = ImageDraw.Draw(im)
    d.polygon([(42, 26), (959, 19), (980, 566), (33, 584)], fill=INK["green"])
    d.polygon([(30, 20), (954, 29), (969, 558), (38, 570)], fill=INK["paper"])
    d.rectangle((76, 76, 924, 85), fill=INK["red"])
    d.rectangle((76, 510, 924, 519), fill=INK["red"])
    for x in (59, 935):
        for y in (46, 535):
            d.ellipse((x - 12, y - 12, x + 12, y + 12), fill=INK["green"])
    save("sushiScene", "fs_plate.png", im)


def sack(d, center, scale=1, color=None):
    cx, cy = center
    s = scale
    fill = color or INK["green"]
    d.polygon([(cx-45*s,cy-62*s),(cx+45*s,cy-62*s),(cx+64*s,cy+50*s),
               (cx+38*s,cy+72*s),(cx-39*s,cy+72*s),(cx-64*s,cy+50*s)],fill=fill)
    d.rectangle((cx-25*s,cy-81*s,cx+25*s,cy-62*s), fill=fill)
    d.line((cx-38*s,cy-63*s,cx+38*s,cy-63*s), fill=INK["black"], width=max(2,round(6*s)))
    d.arc((cx-32*s,cy-18*s,cx+32*s,cy+42*s), 30, 150, fill=INK["paper"], width=max(4,round(9*s)))


def ui():
    buy = Image.new("RGBA", (512, 256))
    d = ImageDraw.Draw(buy)
    d.polygon(((54, 38), (151, 23), (250, 39), (356, 20), (461, 43),
               (492, 188), (466, 232), (46, 232), (17, 186)), fill=INK["green"])
    d.polygon(((57, 29), (153, 13), (251, 29), (355, 11), (459, 32),
               (478, 183), (457, 219), (54, 219), (31, 181)), fill=INK["paper"])
    d.line(((50, 69), (460, 69)), fill=INK["green"], width=10)
    save("sushiUi", "buybonus_plate.png", buy)

    for name, count in (("card_bonus.png", 1), ("card_superbonus.png", 2)):
        card = Image.new("RGBA", (600, 840))
        d = ImageDraw.Draw(card)
        d.rounded_rectangle((24, 31, 575, 814), radius=45, fill=INK["brown"])
        d.rounded_rectangle((18, 18, 566, 799), radius=45, fill=INK["paper"])
        d.rounded_rectangle((36, 36, 548, 781), radius=35, outline=INK["green"], width=11)
        if count == 1:
            sack(d, (300, 310), 2.0)
        else:
            sack(d, (221, 312), 1.55)
            sack(d, (378, 312), 1.55)
        # Lower half stays blank for runtime mode title, cost and button.
        save("sushiUi", name, card)

    for name, r in (("button_plate.png", 106), ("spin_plate.png", 115)):
        plate = Image.new("RGBA", (256, 256))
        d = ImageDraw.Draw(plate)
        d.ellipse((128-r+5, 128-r+7, 128+r+5, 128+r+7), fill=INK["green"])
        d.ellipse((128-r, 128-r, 128+r, 128+r), fill=INK["paper"])
        d.ellipse((128-r+13, 128-r+13, 128+r-13, 128+r-13), outline=INK["green"], width=11)
        save("sushiUi", name, plate)

    flyer = Image.new("RGBA", (128, 128))
    d = ImageDraw.Draw(flyer)
    for cx, cy, ang in ((52, 46, 0), (75, 59, 1), (57, 79, 2)):
        d.arc((cx-25, cy-27, cx+25, cy+26), 30+ang*15, 150+ang*15, fill=INK["yellow"], width=17)
        d.arc((cx-27, cy-30, cx+27, cy+29), 30+ang*15, 150+ang*15, fill=INK["paper"], width=3)
    save("sushiFx", "collect_bananas.png", flyer)


if __name__ == "__main__":
    frame()
    shutter()
    poster()
    ui()
