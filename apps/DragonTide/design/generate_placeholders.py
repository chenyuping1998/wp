"""Stand-in art for Medusa Gaze.

Everything the game loads is drawn here so the app boots and its sizing, timing
and contrast can be judged before the commissioned art arrives
(proposals/MedusaGaze梅杜莎凝視/MEDUSA_美術需求單.md). Delivered art overwrites
these files in place: same folders, same names, same sizes.

The drawings follow the brief's house rules so they are not misleading stand-ins:
one even outline colour, flat fills, no gradients on symbols, every symbol its
own silhouette, no text baked into anything but the title wordmark.

Usage:  E:/stake/math-sdk/env/Scripts/python.exe design/generate_placeholders.py
"""

import math
import os

from PIL import Image, ImageDraw, ImageFilter, ImageFont

APP = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SPRITES = os.path.join(APP, "static", "assets", "sprites")
TITAN = os.path.join(APP, "static", "fonts", "TitanOne.ttf")
GREEK = "C:/Windows/Fonts/arialbd.ttf"

INK = (42, 31, 36, 255)
SKIN = (140, 203, 110, 255)
SKIN_SH = (111, 174, 87, 255)
SNAKE = (62, 158, 110, 255)
BELLY = (233, 215, 138, 255)
CORAL = (232, 114, 94, 255)
MAGENTA = (194, 51, 138, 255)
GOLD = (242, 182, 50, 255)
GOLD_SH = (203, 142, 30, 255)
MARBLE = (239, 232, 216, 255)
MARBLE_SH = (213, 204, 182, 255)
STONE = (169, 163, 154, 255)
STONE_SH = (133, 127, 119, 255)
SKY = (127, 198, 230, 255)
TEAL_BOARD = (30, 73, 80, 255)
DUSK = (43, 35, 80, 255)
GAZE = (184, 255, 90, 255)
WHITE = (255, 255, 255, 255)


def out(folder, name, img):
    path = os.path.join(SPRITES, folder, name)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    if name.endswith(".jpg"):
        img.convert("RGB").save(path, quality=88)
    else:
        img.save(path)
    return path


def canvas(w, h, fill=(0, 0, 0, 0)):
    return Image.new("RGBA", (w, h), fill)


def ss(w, h):
    """Draw at 2x and downsample so outlines are anti-aliased."""
    img = canvas(w * 2, h * 2)
    return img, ImageDraw.Draw(img)


def done(img):
    return img.resize((img.width // 2, img.height // 2), Image.LANCZOS)


def font(path, size):
    return ImageFont.truetype(path, size)


# ── symbols (256x256) ────────────────────────────────────────────────────────

LW = 14  # outline at 2x


def sym_shield():
    img, d = ss(256, 256)
    d.ellipse([28, 28, 484, 484], fill=GOLD, outline=INK, width=LW)
    d.ellipse([78, 78, 434, 434], fill=MARBLE, outline=INK, width=LW // 2)
    # Medusa relief: face, snake tufts, sunglasses
    for a in range(0, 360, 45):
        x = 256 + math.cos(math.radians(a)) * 128
        y = 236 + math.sin(math.radians(a)) * 118
        d.ellipse([x - 34, y - 34, x + 34, y + 34], fill=SNAKE, outline=INK, width=8)
    d.ellipse([160, 150, 352, 350], fill=SKIN, outline=INK, width=10)
    d.rounded_rectangle([164, 214, 250, 262], 18, fill=INK)
    d.rounded_rectangle([262, 214, 348, 262], 18, fill=INK)
    d.line([250, 230, 262, 230], fill=INK, width=8)
    d.arc([214, 270, 298, 320], 20, 160, fill=INK, width=8)
    return done(img)


def sym_crown():
    img, d = ss(256, 256)
    pts = [(70, 380), (70, 190), (160, 280), (256, 150), (352, 280), (442, 190), (442, 380)]
    d.polygon(pts, fill=GOLD, outline=INK)
    d.line(pts + [pts[0]], fill=INK, width=LW, joint="curve")
    d.rectangle([70, 360, 442, 420], fill=GOLD_SH, outline=INK, width=LW)
    for x in (150, 256, 362):
        d.ellipse([x - 22, 370, x + 22, 410], fill=CORAL, outline=INK, width=6)
    # sleeping snake curled on top
    d.arc([190, 96, 322, 196], 180, 360, fill=SNAKE, width=34)
    d.arc([190, 96, 322, 196], 180, 360, fill=INK, width=6)
    d.ellipse([300, 120, 350, 160], fill=SNAKE, outline=INK, width=6)
    d.line([312, 138, 336, 138], fill=INK, width=5)
    return done(img)


def sym_helmet():
    img, d = ss(256, 256)
    d.chord([96, 70, 416, 420], 180, 360, fill=STONE, outline=INK, width=LW)
    d.rectangle([96, 244, 416, 430], fill=STONE, outline=INK, width=LW)
    d.rectangle([150, 250, 362, 300], fill=INK)
    d.rectangle([232, 250, 280, 420], fill=INK)
    # startled eyes peeking out of the slit
    for x in (190, 322):
        d.ellipse([x - 22, 254, x + 22, 298], fill=WHITE)
        d.ellipse([x - 5, 270, x + 5, 280], fill=INK)
    # crest
    d.chord([150, 20, 362, 160], 180, 360, fill=CORAL, outline=INK, width=LW)
    return done(img)


def sym_lyre():
    img, d = ss(256, 256)
    d.arc([92, 60, 252, 420], 90, 270, fill=GOLD, width=46)
    d.arc([260, 60, 420, 420], 270, 90, fill=GOLD, width=46)
    d.arc([92, 60, 252, 420], 90, 270, fill=INK, width=8)
    d.arc([260, 60, 420, 420], 270, 90, fill=INK, width=8)
    d.rounded_rectangle([110, 100, 402, 140], 16, fill=GOLD_SH, outline=INK, width=8)
    d.rounded_rectangle([150, 400, 362, 450], 16, fill=GOLD_SH, outline=INK, width=8)
    for x in (200, 238, 276):
        d.line([x, 140, x, 400], fill=INK, width=6)
    # the broken string, curled
    d.line([314, 140, 314, 250], fill=INK, width=6)
    d.arc([300, 240, 344, 284], 0, 270, fill=INK, width=6)
    return done(img)


def sym_amphora():
    img, d = ss(256, 256)
    terra = (214, 120, 70, 255)
    d.ellipse([120, 140, 392, 440], fill=terra, outline=INK, width=LW)
    d.rectangle([200, 60, 312, 170], fill=terra, outline=INK, width=LW)
    d.rounded_rectangle([180, 40, 332, 80], 14, fill=terra, outline=INK, width=LW)
    d.arc([70, 110, 210, 280], 100, 260, fill=INK, width=20)
    d.arc([302, 110, 442, 280], 280, 80, fill=INK, width=20)
    d.rectangle([150, 270, 362, 320], fill=INK)
    # tiny running figure on the band
    d.ellipse([244, 276, 262, 294], fill=terra)
    d.line([253, 294, 245, 314], fill=terra, width=6)
    d.line([253, 300, 268, 290], fill=terra, width=6)
    d.polygon([(230, 60), (250, 60), (240, 90)], fill=INK)  # the chip in the rim
    return done(img)


def sym_laurel():
    img, d = ss(256, 256)
    leaf = (92, 160, 72, 255)
    # leaves run up each side of a ring, from the bottom towards the top
    for side in (-1, 1):
        for i in range(7):
            a = math.radians(-70 + i * 22)
            cx = 256 + side * math.cos(a) * 165
            cy = 256 - math.sin(a) * 165
            if i == 4 and side > 0:
                continue  # the dropped leaf
            d.ellipse([cx - 40, cy - 24, cx + 40, cy + 24], fill=leaf, outline=INK, width=8)
    d.polygon([(232, 420), (280, 420), (300, 470), (212, 470)], fill=CORAL, outline=INK)
    return done(img)


def sym_gem(letter, color, shape):
    img, d = ss(256, 256)
    box = [80, 80, 432, 432]
    if shape == "round":
        d.ellipse(box, fill=color, outline=INK, width=LW)
    elif shape == "square":
        d.rounded_rectangle(box, 44, fill=color, outline=INK, width=LW)
    elif shape == "diamond":
        d.polygon([(256, 60), (452, 256), (256, 452), (60, 256)], fill=color, outline=INK)
        d.line([(256, 60), (452, 256), (256, 452), (60, 256), (256, 60)], fill=INK, width=LW)
    else:  # drop
        d.ellipse([100, 170, 412, 460], fill=color, outline=INK, width=LW)
        d.polygon([(256, 50), (380, 240), (132, 240)], fill=color)
        d.line([(132, 240), (256, 50), (380, 240)], fill=INK, width=LW)
    hi = tuple(min(255, c + 60) for c in color[:3]) + (255,)
    f = font(GREEK, 200)
    d.text((262, 272), letter, font=f, anchor="mm", fill=INK)
    d.text((256, 262), letter, font=f, anchor="mm", fill=hi)
    return done(img)


# ── orbs, fx ─────────────────────────────────────────────────────────────────


def orb(color, rim):
    img, d = ss(256, 256)
    d.ellipse([20, 20, 492, 492], fill=rim, outline=INK, width=LW)
    d.ellipse([80, 80, 432, 432], fill=color, outline=INK, width=8)
    # dark centre so the program's number reads; slit pupil behind it
    d.ellipse([140, 140, 372, 372], fill=(20, 26, 22, 235))
    d.ellipse([236, 96, 276, 416], fill=(0, 0, 0, 120))
    d.ellipse([120, 96, 190, 150], fill=(255, 255, 255, 160))
    return done(img)


def radial(size, inner=1.0, power=2.0, color=WHITE):
    img = canvas(size, size)
    px = img.load()
    c = (size - 1) / 2
    for y in range(size):
        for x in range(size):
            r = math.hypot(x - c, y - c) / c
            a = max(0.0, 1 - r) ** power * inner
            px[x, y] = color[:3] + (int(255 * min(1, a)),)
    return img


def star(size=128):
    img = canvas(size, size)
    d = ImageDraw.Draw(img)
    c = size / 2
    d.polygon([(c, 4), (c + 10, c - 10), (size - 4, c), (c + 10, c + 10), (c, size - 4),
               (c - 10, c + 10), (4, c), (c - 10, c - 10)], fill=WHITE)
    return img.filter(ImageFilter.GaussianBlur(2))


def streak(size=128):
    img = canvas(size, size)
    d = ImageDraw.Draw(img)
    d.ellipse([4, size / 2 - 10, size - 4, size / 2 + 10], fill=WHITE)
    return img.filter(ImageFilter.GaussianBlur(6))


def vignette(size=256):
    img = canvas(size, size)
    px = img.load()
    c = (size - 1) / 2
    for y in range(size):
        for x in range(size):
            r = math.hypot(x - c, y - c) / c
            a = max(0.0, min(1.0, (r - 0.55) / 0.5)) ** 1.6
            px[x, y] = (8, 10, 16, int(200 * a))
    return img


def crack(stage):
    img, d = ss(256, 256)
    rays = 3 + stage * 2
    for i in range(rays):
        a = math.radians(i * 360 / rays + stage * 17)
        pts = [(256, 256)]
        r = 0
        while r < 150 + stage * 40:
            r += 40
            jitter = math.radians(((i * 7 + r) % 5 - 2) * 9)
            pts.append((256 + math.cos(a + jitter) * r, 256 + math.sin(a + jitter) * r))
        d.line(pts, fill=(94, 89, 83, 255), width=10, joint="curve")
    return done(img)


def rubble():
    img, d = ss(64, 64)
    d.polygon([(20, 40), (70, 14), (112, 40), (100, 100), (36, 110)], fill=STONE, outline=INK)
    d.line([(20, 40), (70, 14), (112, 40), (100, 100), (36, 110), (20, 40)], fill=INK, width=6)
    return done(img)


# ── scene ────────────────────────────────────────────────────────────────────


def background(night):
    w, h = 1920, 1080
    img = canvas(w, h, DUSK if night else SKY)
    d = ImageDraw.Draw(img)
    hills = (52, 70, 96, 255) if night else (150, 196, 120, 255)
    temple = (90, 84, 120, 255) if night else MARBLE
    d.ellipse([-300, 640, 1100, 1300], fill=hills)
    d.ellipse([800, 600, 2300, 1300], fill=hills)
    # temple on the far hill
    d.polygon([(1240, 600), (1560, 600), (1400, 520)], fill=temple, outline=INK)
    d.rectangle([1260, 600, 1540, 720], fill=temple, outline=INK, width=4)
    for x in range(1280, 1540, 50):
        d.line([x, 610, x, 715], fill=INK, width=3)
    if not night:
        for cx, cy, s in ((300, 180, 1.0), (980, 120, 0.8), (1600, 240, 1.1)):
            for dx, r in ((-80, 60), (0, 85), (90, 65)):
                d.ellipse([cx + dx * s - r * s, cy - r * s, cx + dx * s + r * s, cy + r * s], fill=WHITE)
    else:
        for i in range(60):
            x, y = (i * 733) % w, (i * 389) % 520
            d.ellipse([x, y, x + 4, y + 4], fill=(255, 245, 200, 200))
    # plaza floor and framing columns
    floor = (70, 62, 98, 255) if night else MARBLE_SH
    d.rectangle([0, 900, w, h], fill=floor)
    col = (110, 100, 140, 255) if night else MARBLE
    for x in (60, 260, 1560, 1760):
        d.rectangle([x, 220, x + 110, 900], fill=col, outline=INK, width=6)
        d.rectangle([x - 20, 190, x + 130, 230], fill=col, outline=INK, width=6)
        for k in range(1, 4):
            d.line([x + k * 27, 235, x + k * 27, 890], fill=INK, width=3)
    if night:
        for x in (210, 1710):
            d.polygon([(x - 40, 900), (x + 40, 900), (x + 20, 860), (x - 20, 860)], fill=INK)
            d.ellipse([x - 30, 800, x + 30, 870], fill=(255, 160, 60, 255))
    # comedic statues at the edges of the plaza
    for x, y in ((470, 760), (1420, 770)):
        d.ellipse([x - 40, y - 150, x + 40, y - 70], fill=STONE, outline=INK, width=5)
        d.rectangle([x - 50, y - 70, x + 50, y + 70], fill=STONE, outline=INK, width=5)
        d.line([x - 50, y - 50, x - 110, y - 160], fill=STONE, width=24)
        d.line([x + 50, y - 50, x + 110, y - 160], fill=STONE, width=24)
        d.rectangle([x - 70, y + 70, x + 70, y + 130], fill=STONE_SH, outline=INK, width=5)
    return img


# ── UI ───────────────────────────────────────────────────────────────────────


def plate(w, h, fill=MARBLE, border=GOLD):
    img, d = ss(w, h)
    d.rounded_rectangle([8, 8, w * 2 - 8, h * 2 - 8], h // 2, fill=border, outline=INK, width=10)
    d.rounded_rectangle([34, 34, w * 2 - 34, h * 2 - 34], h // 2 - 20, fill=fill, outline=INK, width=6)
    return done(img)


def buy_shield():
    img, d = ss(640, 640)
    pts = [(640, 60), (1180, 200), (1120, 760), (640, 1220), (160, 760), (100, 200)]
    d.polygon(pts, fill=GOLD, outline=INK)
    d.line(pts + [pts[0]], fill=INK, width=20)
    inner = [(640, 150), (1080, 260), (1030, 730), (640, 1110), (250, 730), (200, 260)]
    d.polygon(inner, fill=MARBLE)
    # Medusa in relief, sunglasses on
    for a in range(0, 360, 40):
        x = 640 + math.cos(math.radians(a)) * 230
        y = 560 + math.sin(math.radians(a)) * 210
        d.ellipse([x - 60, y - 60, x + 60, y + 60], fill=SNAKE, outline=INK, width=10)
    d.ellipse([460, 380, 820, 760], fill=SKIN, outline=INK, width=14)
    d.rounded_rectangle([470, 500, 630, 590], 30, fill=INK)
    d.rounded_rectangle([650, 500, 810, 590], 30, fill=INK)
    d.arc([560, 610, 720, 700], 20, 160, fill=INK, width=12)
    return done(img)


def total_plate():
    img, d = ss(512, 320)
    d.rounded_rectangle([10, 10, 1014, 630], 60, fill=GOLD, outline=INK, width=14)
    d.rounded_rectangle([50, 50, 974, 590], 44, fill=(60, 30, 70, 255), outline=INK, width=8)
    # cameo portrait on the left, the ×N goes on the right
    d.ellipse([90, 120, 410, 520], fill=MARBLE, outline=INK, width=10)
    for a in range(0, 360, 45):
        x = 250 + math.cos(math.radians(a)) * 110
        y = 300 + math.sin(math.radians(a)) * 120
        d.ellipse([x - 34, y - 34, x + 34, y + 34], fill=SNAKE, outline=INK, width=6)
    d.ellipse([175, 210, 325, 390], fill=SKIN, outline=INK, width=8)
    d.rounded_rectangle([180, 270, 248, 304], 12, fill=MAGENTA)
    d.rounded_rectangle([252, 270, 320, 304], 12, fill=MAGENTA)
    return done(img)


def tablet(w, h):
    img, d = ss(w, h)
    d.rounded_rectangle([10, 10, w * 2 - 10, h * 2 - 10], 40, fill=MARBLE, outline=INK, width=16)
    d.rounded_rectangle([60, 60, w * 2 - 60, h * 2 - 60], 28, outline=MARBLE_SH, width=10)
    return done(img)


def fs_sign():
    w, h = 1706, 922
    img = canvas(w, h, (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.rounded_rectangle([20, 60, w - 20, h - 20], 60, fill=MARBLE, outline=INK, width=12)
    d.rounded_rectangle([90, 120, w - 90, h - 90], 40, outline=GOLD, width=10)
    # scroll ends
    for x in (20, w - 120):
        d.rounded_rectangle([x, 20, x + 100, h - 2], 50, fill=MARBLE_SH, outline=INK, width=10)
    return img.convert("RGB")


def win_banner(tier):
    w, h = 1352, 194
    img, d = ss(w, h)
    ribbon = [CORAL, (123, 92, 200, 255), GOLD, (62, 158, 110, 255), (255, 210, 80, 255)][tier]
    d.polygon([(0, 60), (140, 60), (180, 194), (140, 328), (0, 328), (60, 194)], fill=ribbon, outline=INK)
    d.polygon([(w * 2, 60), (w * 2 - 140, 60), (w * 2 - 180, 194), (w * 2 - 140, 328), (w * 2, 328), (w * 2 - 60, 194)],
              fill=ribbon, outline=INK)
    d.rounded_rectangle([140, 20, w * 2 - 140, 368], 60, fill=ribbon, outline=INK, width=12)
    d.rounded_rectangle([180, 50, w * 2 - 180, 338], 44, outline=MARBLE, width=8)
    leaves = 1 + tier
    for i in range(leaves):
        for side in (-1, 1):
            x = w + side * (w - 260 - i * 70)
            d.ellipse([x - 34, 150, x + 34, 238], fill=(92, 160, 72, 255), outline=INK, width=6)
    return done(img)


def icon(name):
    img, d = ss(256, 256)
    W = 40
    c = 256
    if name == "menu":
        for y in (160, 256, 352):
            d.rounded_rectangle([110, y - 22, 402, y + 22], 22, fill=WHITE)
    elif name == "menuExit":
        d.line([150, 150, 362, 362], fill=WHITE, width=W)
        d.line([362, 150, 150, 362], fill=WHITE, width=W)
    elif name == "settings":
        for a in range(0, 360, 45):
            x, y = c + math.cos(math.radians(a)) * 150, c + math.sin(math.radians(a)) * 150
            d.ellipse([x - 40, y - 40, x + 40, y + 40], fill=WHITE)
        d.ellipse([110, 110, 402, 402], fill=WHITE)
        d.ellipse([200, 200, 312, 312], fill=(0, 0, 0, 0))
    elif name == "info":
        d.ellipse([226, 100, 286, 160], fill=WHITE)
        d.rounded_rectangle([222, 200, 290, 412], 24, fill=WHITE)
    elif name == "payTable":
        for y in (150, 256, 362):
            d.ellipse([110, y - 26, 162, y + 26], fill=WHITE)
            d.rounded_rectangle([190, y - 20, 410, y + 20], 20, fill=WHITE)
    elif name in ("soundOn", "soundOff"):
        d.polygon([(100, 200), (180, 200), (280, 110), (280, 402), (180, 312), (100, 312)], fill=WHITE)
        if name == "soundOn":
            d.arc([220, 160, 380, 352], -50, 50, fill=WHITE, width=28)
            d.arc([220, 100, 440, 412], -50, 50, fill=WHITE, width=28)
        else:
            d.line([320, 200, 420, 312], fill=WHITE, width=30)
            d.line([420, 200, 320, 312], fill=WHITE, width=30)
    elif name in ("autoSpin", "spin"):
        d.arc([110, 110, 402, 402], 30, 330, fill=WHITE, width=W)
        d.polygon([(372, 120), (420, 230), (310, 220)], fill=WHITE)
        if name == "autoSpin":
            d.ellipse([226, 226, 286, 286], fill=WHITE)
    elif name == "decrease":
        d.rounded_rectangle([110, 236, 402, 276], 20, fill=WHITE)
    elif name == "increase":
        d.rounded_rectangle([110, 236, 402, 276], 20, fill=WHITE)
        d.rounded_rectangle([236, 110, 276, 402], 20, fill=WHITE)
    elif name == "turbo":
        d.polygon([(290, 70), (140, 290), (250, 290), (210, 442), (372, 210), (262, 210)], fill=WHITE)
    return done(img)


def bar_strip():
    """Bet-bar strip: deep teal, one ink edge, a thin gold keyline (sliced by the
    shared UiBarStrip: the outer 96px at each end are caps, the middle stretches)."""
    w, h = 1600, 200
    img, d = ss(w, h)
    d.rounded_rectangle([8, 8, w * 2 - 8, h * 2 - 8], 56, fill=TEAL_BOARD, outline=INK, width=14)
    d.rounded_rectangle([30, 30, w * 2 - 30, h * 2 - 30], 40, outline=GOLD, width=5)
    return done(img)


def button_disc(lit):
    img, d = ss(256, 256)
    d.ellipse([10, 10, 502, 502], fill=GOLD if lit else TEAL_BOARD, outline=INK, width=16)
    d.ellipse([34, 34, 478, 478], outline=MARBLE if not lit else (255, 240, 190, 255), width=6)
    return done(img)


def auto_arrow():
    """Auto spin: a thick outer arc and a thin inner arc forming a C, the outer
    one ending in an arrowhead."""
    img, d = ss(256, 256)
    d.arc([96, 96, 416, 416], 40, 330, fill=WHITE, width=44)
    d.arc([168, 168, 344, 344], 40, 330, fill=WHITE, width=18)
    a = math.radians(330)
    tip = (256 + math.cos(a) * 160, 256 + math.sin(a) * 160)
    d.polygon([(tip[0] - 40, tip[1] - 58), (tip[0] + 74, tip[1] - 6), (tip[0] - 26, tip[1] + 56)], fill=WHITE)
    return done(img)


def buy_shield_lit():
    img = buy_shield()
    glow = Image.new("RGBA", img.size, (0, 0, 0, 0))
    mask = img.getchannel("A").filter(ImageFilter.GaussianBlur(10))
    glow.paste(GAZE, (0, 0), mask)
    out_img = Image.alpha_composite(glow, img)
    return out_img


def wordmark():
    w, h = 1600, 600
    img = canvas(w, h)
    d = ImageDraw.Draw(img)
    big = font(TITAN, 300)
    small = font(TITAN, 150)
    for dx, dy in [(x, y) for x in range(-16, 17, 4) for y in range(-16, 17, 4) if x * x + y * y <= 256]:
        d.text((w / 2 + dx, 230 + dy), "MEDUSA", font=big, anchor="mm", fill=INK)
        d.text((w / 2 + dx, 470 + dy), "GAZE", font=small, anchor="mm", fill=INK)
    d.text((w / 2, 242), "MEDUSA", font=big, anchor="mm", fill=SKIN_SH)
    d.text((w / 2, 230), "MEDUSA", font=big, anchor="mm", fill=SKIN)
    d.text((w / 2, 478), "GAZE", font=small, anchor="mm", fill=GOLD_SH)
    d.text((w / 2, 470), "GAZE", font=small, anchor="mm", fill=GOLD)
    return img


def medusa_head(d, cx, cy, r, glasses="on"):
    """Placeholder Medusa head: snake burst, green face, sunglasses state."""
    for a in range(0, 360, 40):
        x = cx + math.cos(math.radians(a)) * r * 1.05
        y = cy - r * 0.1 + math.sin(math.radians(a)) * r * 0.95
        d.ellipse([x - r * 0.33, y - r * 0.33, x + r * 0.33, y + r * 0.33], fill=SNAKE, outline=INK, width=6)
    d.ellipse([cx - r * 0.72, cy - r * 0.8, cx + r * 0.72, cy + r * 0.8], fill=SKIN, outline=INK, width=8)
    ey = cy - r * 0.12 + (r * 0.22 if glasses == "down" else 0)
    if glasses == "off":
        for dx in (-0.3, 0.3):
            ex = cx + dx * r
            d.ellipse([ex - r * 0.2, cy - r * 0.32, ex + r * 0.2, cy + r * 0.08], fill=GAZE, outline=INK, width=5)
            d.rectangle([ex - r * 0.03, cy - r * 0.26, ex + r * 0.03, cy + r * 0.02], fill=INK)
    else:
        if glasses == "down":
            for dx in (-0.3, 0.3):
                ex = cx + dx * r
                d.ellipse([ex - r * 0.18, cy - r * 0.42, ex + r * 0.18, cy - r * 0.08], fill=WHITE, outline=INK, width=5)
                d.ellipse([ex - r * 0.04, cy - r * 0.29, ex + r * 0.04, cy - r * 0.21], fill=INK)
        d.rounded_rectangle([cx - r * 0.62, ey - r * 0.04, cx - r * 0.04, ey + r * 0.26], r * 0.12, fill=MAGENTA, outline=INK, width=5)
        d.rounded_rectangle([cx + r * 0.04, ey - r * 0.04, cx + r * 0.62, ey + r * 0.26], r * 0.12, fill=MAGENTA, outline=INK, width=5)
    d.arc([cx - r * 0.3, cy + r * 0.2, cx + r * 0.3, cy + r * 0.55], 20, 160, fill=INK, width=6)


# pose -> (glasses, mouth, arm): the eight states Medusa.svelte switches between
POSES = {
    "idle": ("on", "smile", "down"),
    "fgIdle": ("up", "smile", "down"),
    "peek": ("down", "smirk", "glasses"),
    "gaze": ("off", "smirk", "glasses"),
    "smug": ("on", "smile", "point"),
    "annoyed": ("on", "flat", "down"),
    "shock": ("off", "open", "up"),
    "laugh": ("off", "laugh", "up"),
}


def medusa_face(d, cx, cy, r, glasses, mouth):
    medusa_head(d, cx, cy, r, glasses="on" if glasses == "up" else glasses)
    # cover the default smile, then draw the pose's mouth
    d.rectangle([cx - r * 0.34, cy + r * 0.18, cx + r * 0.34, cy + r * 0.6], fill=SKIN)
    if mouth == "smile":
        d.arc([cx - r * 0.3, cy + r * 0.2, cx + r * 0.3, cy + r * 0.55], 20, 160, fill=INK, width=6)
    elif mouth == "smirk":
        d.arc([cx - r * 0.1, cy + r * 0.2, cx + r * 0.35, cy + r * 0.5], 10, 150, fill=INK, width=6)
    elif mouth == "flat":
        d.line([cx - r * 0.25, cy + r * 0.4, cx + r * 0.22, cy + r * 0.32], fill=INK, width=6)
    elif mouth == "open":
        d.ellipse([cx - r * 0.14, cy + r * 0.22, cx + r * 0.14, cy + r * 0.56], fill=INK)
    elif mouth == "laugh":
        d.chord([cx - r * 0.34, cy + r * 0.1, cx + r * 0.34, cy + r * 0.62], 0, 180, fill=INK)
        d.rectangle([cx - r * 0.16, cy + r * 0.36, cx + r * 0.16, cy + r * 0.44], fill=WHITE)  # the overbite
    if glasses == "up":
        # cover the lenses with eyes, push the glasses up onto the snakes
        d.rectangle([cx - r * 0.64, cy - r * 0.2, cx + r * 0.64, cy + r * 0.16], fill=SKIN)
        for dx in (-0.3, 0.3):
            ex = cx + dx * r
            d.ellipse([ex - r * 0.18, cy - r * 0.2, ex + r * 0.18, cy + r * 0.12], fill=WHITE, outline=INK, width=5)
            d.ellipse([ex - r * 0.04, cy - r * 0.08, ex + r * 0.04, cy], fill=INK)
        d.rounded_rectangle([cx - r * 0.6, cy - r * 0.86, cx - r * 0.06, cy - r * 0.6], r * 0.1, fill=MAGENTA, outline=INK, width=5)
        d.rounded_rectangle([cx + r * 0.06, cy - r * 0.86, cx + r * 0.6, cy - r * 0.6], r * 0.1, fill=MAGENTA, outline=INK, width=5)
    if glasses == "on" and mouth == "flat":
        # rolled-up eyes peeking over the lenses
        for dx in (-0.3, 0.3):
            ex = cx + dx * r
            d.chord([ex - r * 0.16, cy - r * 0.36, ex + r * 0.16, cy - r * 0.04], 180, 360, fill=WHITE, outline=INK, width=4)


def medusa_pose(pose):
    glasses, mouth, arm = POSES[pose]
    # full figure, 512x1024, three-quarter facing left (towards the board)
    img, d = ss(512, 1024)
    cx = 520
    # toga and legs
    d.polygon([(360, 760), (680, 760), (720, 1980), (320, 1980)], fill=CORAL, outline=INK)
    d.line([(360, 760), (320, 1980)], fill=INK, width=12)
    d.line([(680, 760), (720, 1980)], fill=INK, width=12)
    d.rectangle([340, 1080, 700, 1130], fill=GOLD, outline=INK, width=8)
    d.rectangle([380, 1980, 470, 2030], fill=SKIN, outline=INK, width=8)
    d.rectangle([570, 1980, 660, 2030], fill=SKIN, outline=INK, width=8)
    # back arm on the hip
    d.line([(690, 800), (820, 1000), (700, 1110)], fill=SKIN, width=60, joint="curve")
    # front arm: down / pinching the glasses / pointing at the board / thrown up
    arm_path = {
        "down": [(350, 800), (280, 1050), (300, 1260)],
        "glasses": [(350, 800), (240, 720), (420, 520)],
        "point": [(350, 800), (200, 860), (60, 820)],
        "up": [(350, 800), (220, 560), (200, 380)],
    }[arm]
    d.line(arm_path, fill=SKIN, width=60, joint="curve")
    hx, hy = arm_path[-1]
    d.ellipse([hx - 44, hy - 44, hx + 44, hy + 44], fill=SKIN, outline=INK, width=8)
    # pearls
    for i in range(9):
        a = math.radians(200 + i * 17.5)
        px, py = cx + math.cos(a) * 130, 760 - math.sin(a) * 60
        d.ellipse([px - 18, py - 18, px + 18, py + 18], fill=WHITE, outline=INK, width=5)
    medusa_face(d, cx, 470, 230, glasses, mouth)
    body = done(img)
    # head only, 512x512, for portrait where there is no room for the figure
    himg, hd = ss(512, 512)
    medusa_face(hd, 512, 540, 330, glasses, mouth)
    return body, done(himg)


def intro_card(n):
    w, h = 960, 720
    img = canvas(w, h, SKY if n < 3 else DUSK)
    d = ImageDraw.Draw(img)
    if n == 1:
        cell = 90
        ox, oy = (w - cell * 6) / 2, (h - cell * 6) / 2
        d.rounded_rectangle([ox - 16, oy - 16, ox + cell * 6 + 16, oy + cell * 6 + 16], 16, fill=MARBLE, outline=INK, width=6)
        d.rectangle([ox, oy, ox + cell * 6, oy + cell * 6], fill=TEAL_BOARD)
        lit = {(0, 1), (1, 4), (2, 0), (2, 5), (3, 2), (4, 1), (5, 3), (5, 5)}
        gem = sym_gem("Ω", (214, 52, 64, 255), "round").resize((cell - 10, cell - 10))
        stone = Image.new("RGBA", gem.size, STONE)
        stone.putalpha(gem.getchannel("A"))
        for r_ in range(6):
            for c in range(6):
                if (r_, c) in lit:
                    img.alpha_composite(stone, (int(ox + r_ * cell + 5), int(oy + c * cell + 5)))
    elif n == 2:
        medusa_head(d, 250, 380, 150, glasses="down")
        for i, x in enumerate(range(430, 820, 90)):
            d.ellipse([x - 8 - i * 3, 340 - i * 6, x + 8 + i * 3, 356 + i * 6], fill=GAZE)
        img.alpha_composite(orb(GAZE, SNAKE).resize((150, 150)), (760, 270))
    else:
        medusa_head(d, 230, 400, 140, glasses="off")
        plate = total_plate().resize((420, 262))
        img.alpha_composite(plate, (480, 230))
        for i, color in enumerate([(GAZE, SNAKE), ((190, 130, 255, 255), (110, 60, 170, 255)), ((255, 220, 110, 255), GOLD_SH)]):
            img.alpha_composite(orb(*color).resize((96, 96)), (390 + i * 40, 110 + i * 60))
    d.rectangle([0, 0, w - 1, h - 1], outline=INK, width=10)
    return img


def main():
    written = []
    S = "medusaSymbols"
    written += [out(S, "s.png", sym_shield()), out(S, "h1.png", sym_crown()), out(S, "h2.png", sym_helmet()),
                out(S, "h3.png", sym_lyre()), out(S, "h4.png", sym_amphora()), out(S, "h5.png", sym_laurel())]
    gems = [("Ω", (214, 52, 64, 255), "round"), ("Σ", (52, 104, 214, 255), "square"),
            ("Φ", (34, 160, 150, 255), "diamond"), ("Ψ", (232, 160, 40, 255), "drop")]
    for i, (letter, color, shape) in enumerate(gems, 1):
        written.append(out(S, f"l{i}.png", sym_gem(letter, color, shape)))

    O = "medusaOrbs"
    written += [out(O, "orb_green.png", orb(GAZE, SNAKE)),
                out(O, "orb_purple.png", orb((190, 130, 255, 255), (110, 60, 170, 255))),
                out(O, "orb_gold.png", orb((255, 220, 110, 255), GOLD_SH))]

    F = "medusaFx"
    written += [out(F, "fx_glow.png", radial(128)), out(F, "fx_star.png", star()),
                out(F, "fx_streak.png", streak()), out(F, "fx_vignette.png", vignette()),
                out(F, "fx_rubble.png", rubble())]
    for i in (1, 2, 3):
        written.append(out(F, f"fx_crack_{i}.png", crack(i)))

    B = "medusaBackground"
    written += [out(B, "bg_base.jpg", background(False)), out(B, "bg_free.jpg", background(True))]

    U = "medusaUi"
    written += [out(U, "ticker_plate.png", plate(652, 146)), out(U, "buybonus_plate.png", buy_shield()),
                out(U, "total_plate.png", total_plate()), out(U, "fs_counter_panel.png", tablet(512, 320)),
                out(U, "fs_sign.jpg", fs_sign()), out(U, "bar_strip.png", bar_strip()),
                out(U, "button_disc.png", button_disc(False)), out(U, "button_disc_on.png", button_disc(True)),
                out(U, "buybonus_plate_lit.png", buy_shield_lit())]

    W = "medusaWinBanners"
    for i, tier in enumerate(["big", "superwin", "mega", "epic", "max"]):
        written.append(out(W, f"{tier}.png", win_banner(i)))

    I = "medusaUiIcons"
    for name in ["menu", "menuExit", "settings", "info", "payTable", "soundOn", "soundOff", "autoSpin",
                 "spin", "decrease", "increase", "turbo"]:
        written.append(out(I, f"{name}.png", auto_arrow() if name == "autoSpin" else icon(name)))

    written.append(out("medusaBrand", "logo.png", wordmark()))
    for n in (1, 2, 3):
        written.append(out("medusaIntro", f"intro_{n}.png", intro_card(n)))
    for pose in POSES:
        body, head = medusa_pose(pose)
        written.append(out("medusaCast", f"body_{pose}.png", body))
        written.append(out("medusaCast", f"head_{pose}.png", head))
    print(f"wrote {len(written)} files")


if __name__ == "__main__":
    main()
