"""Art for the free-spin splashes and big wins, composed from this game's own
generated illustrations (design/source/jade, sushiSymbols) plus drawn pieces.
No new generation, no lettering.

  C  particles      sushiV8/fx_tealeaf_{0..3}.png, fx_cloud_{0..2}.png, fx_steam.png
  A1 intro sign     sushiV8/sign_cord.png (tileable red cord)
  A2 settlement     sushiV8/scroll_rod.png, scroll_paper.png
  D  win tiers      sushiV8/win_deco_{superwin,mega,epic,max}.png

Run: math-sdk/env/Scripts/python.exe design/build_splash_parts.py
"""

import math
import random
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageFilter

APP = Path(__file__).resolve().parents[1]
SOURCE = APP / "design/source/jade"
SPRITES = APP / "static/assets/sprites"
OUT = SPRITES / "sushiV8"
INK = (30, 27, 26, 255)
GOLD = (214, 170, 84, 255)
JADE = (123, 171, 151, 255)
DARK_JADE = (44, 92, 77, 255)


def save(im, name):
    im.save(OUT / name, optimize=True)


def trim(im, pad=4):
    box = im.getchannel("A").getbbox()
    if not box:
        return im
    x0, y0, x1, y1 = box
    return im.crop((max(0, x0 - pad), max(0, y0 - pad), min(im.width, x1 + pad), min(im.height, y1 + pad)))


def key_gold(crop):
    """Keep the gold ornament and the ink that outlines it; drop the green rod
    and cream paper around it."""
    hsv = crop.convert("RGB").convert("HSV")
    h, s, v = hsv.split()
    gold = Image.eval(h, lambda x: 255 if 14 <= x <= 42 else 0)
    gold = ImageChops.multiply(gold, Image.eval(s, lambda x: 255 if x > 70 else 0))
    gold = ImageChops.multiply(gold, Image.eval(v, lambda x: 255 if x > 90 else 0))
    gold = gold.filter(ImageFilter.MedianFilter(3))
    near = gold.filter(ImageFilter.MaxFilter(7))
    dark = Image.eval(v, lambda x: 255 if x < 80 else 0)
    alpha = ImageChops.lighter(gold, ImageChops.multiply(near, dark))
    # close pinholes, soften the cut edge a touch
    alpha = alpha.filter(ImageFilter.MaxFilter(3)).filter(ImageFilter.MinFilter(3))
    alpha = alpha.filter(ImageFilter.GaussianBlur(0.6))
    out = crop.copy()
    out.putalpha(alpha)
    return trim(out)


# ── C. particles ─────────────────────────────────────────────────────────────

def tea_leaf(seed, size=128):
    rng = random.Random(seed)
    s = 4
    W = size * s
    im = Image.new("RGBA", (W, W))
    d = ImageDraw.Draw(im)
    L = W * rng.uniform(0.78, 0.86)
    Wd = L * rng.uniform(0.30, 0.38)
    bend = rng.uniform(-0.04, 0.04)
    pts_top, pts_bot = [], []
    for i in range(41):
        t = i / 40
        x = (W - L) / 2 + L * t
        width = Wd * math.sin(math.pi * t) ** 0.8 * (1 - 0.25 * t)
        cy = W / 2 + L * bend * math.sin(math.pi * t)
        # serrated edge, the way a tea leaf is
        saw = 1 + 0.06 * (1 if i % 4 < 2 else -1) * (0.3 < t < 0.95)
        pts_top.append((x, cy - width / 2 * saw))
        pts_bot.append((x, cy + width / 2 * saw))
    outline = pts_top + pts_bot[::-1]
    d.polygon(outline, fill=INK)
    inner = Image.new("L", (W, W))
    ImageDraw.Draw(inner).polygon(outline, fill=255)
    inner = inner.filter(ImageFilter.MinFilter(4 * s + 1))
    top = (150, 196, 128)
    bottom = (58, 112, 74)
    grad = Image.new("RGBA", (W, W))
    gd = ImageDraw.Draw(grad)
    for y in range(W):
        k = y / W
        gd.line((0, y, W, y), fill=tuple(round(a + (b - a) * k) for a, b in zip(top, bottom)) + (255,))
    im.paste(grad, (0, 0), inner)
    # midrib and a few veins in ink
    rib = [(x, (a[1] + b[1]) / 2) for (x, _), a, b in zip(pts_top, pts_top, pts_bot)]
    d.line(rib[2:-2], fill=INK, width=3 * s // 2)
    for i in range(6, 36, 6):
        x, y = rib[i]
        for side in (-1, 1):
            d.line((x, y, x + L * 0.08, y + side * Wd * 0.32), fill=INK, width=s)
    # a lit edge on the top side
    d.line(pts_top[6:34], fill=(214, 236, 196, 255), width=s)
    return trim(im.resize((size, size), Image.Resampling.LANCZOS))


def steam(size=256):
    """one soft wisp, rising and curling"""
    im = Image.new("L", (size, size))
    d = ImageDraw.Draw(im)
    pts = []
    for i in range(48):
        t = i / 47
        pts.append((size * (0.5 + 0.16 * math.sin(t * 5.2)), size * (0.92 - 0.84 * t)))
    for w, v in ((0.16, 90), (0.09, 170), (0.04, 230)):
        d.line(pts, fill=v, width=int(size * w), joint="curve")
    im = im.filter(ImageFilter.GaussianBlur(size * 0.035))
    # fade toward the top, where steam thins out
    fade = Image.linear_gradient("L").resize((size, size)).point(lambda y: int(255 * (y / 255) ** 0.6))
    im = ImageChops.multiply(im, fade)
    out = Image.new("RGBA", (size, size), (255, 252, 240, 0))
    out.putalpha(im)
    return out


def particles():
    for i in range(4):
        save(tea_leaf(40 + i), f"fx_tealeaf_{i}.png")
    scroll = Image.open(SOURCE / "intro_scroll_blank.png").convert("RGBA")
    clouds = [
        key_gold(scroll.crop((62, 1338, 292, 1428))),  # the rod's big cloud
        key_gold(scroll.crop((178, 132, 298, 192))),  # the top rod's small one
        key_gold(scroll.crop((775, 1338, 1010, 1428))),  # the rod's other cloud
    ]
    for i, c in enumerate(clouds):
        c.thumbnail((160, 160), Image.Resampling.LANCZOS)
        save(c, f"fx_cloud_{i}.png")
    save(steam(), "fx_steam.png")


# ── A1. the intro board's cords ──────────────────────────────────────────────

def sign_cords():
    scroll = Image.open(SOURCE / "intro_scroll_blank.png").convert("RGBA")
    # the scroll's hanging rope: x 132..164 is one twisted strand, y 0..60
    # repeats cleanly, so it tiles vertically
    cord = scroll.crop((130, 0, 166, 60))
    save(cord.resize((cord.width * 2, cord.height * 2), Image.Resampling.LANCZOS), "sign_cord.png")
    # the loop where it ties on
    knot = trim(scroll.crop((112, 56, 194, 118)), 2)
    save(knot.resize((knot.width * 2, knot.height * 2), Image.Resampling.LANCZOS), "sign_knot.png")


# ── A2. the settlement hand-scroll ───────────────────────────────────────────

def drop_cream(im):
    """Clear the cream paper that shows around a cut piece."""
    hsv = im.convert("RGB").convert("HSV")
    _, s, v = hsv.split()
    cream = ImageChops.multiply(Image.eval(s, lambda x: 255 if x < 45 else 0), Image.eval(v, lambda x: 255 if x > 200 else 0))
    alpha = ImageChops.subtract(im.getchannel("A"), cream.filter(ImageFilter.MaxFilter(3)))
    out = im.copy()
    out.putalpha(alpha)
    return out


def scroll_parts():
    scroll = Image.open(SOURCE / "intro_scroll_blank.png").convert("RGBA")
    # the bottom bamboo rod (no rope loops on it), stood upright: the
    # settlement unrolls sideways, so its rods are the left and right ends
    rod = drop_cream(scroll.crop((28, 1318, 1050, 1440)))
    rod = trim(rod, 2).rotate(90, expand=True)
    save(rod, "scroll_rod.png")

    save(paper_sheet(scroll, 1600, 900), "scroll_paper.png")
    # the Tea Master meter's cut-in card (BanditMeter.svelte, 1.3:1) - the same
    # paper, framed on all four sides, no rods
    save(paper_sheet(scroll, 1300, 1000, sides=True), "cutin_paper.png")


def paper_sheet(scroll, W, H, sides=False):
    """the scroll's own cream, stretched, with a printed keyline and its
    halftone shading top and bottom, and the four gold brackets"""
    sheet = scroll.crop((260, 420, 800, 1000)).resize((W, H), Image.Resampling.LANCZOS)
    d = ImageDraw.Draw(sheet)
    rng = random.Random(7)
    for band_y, step in ((0, 1), (H - 1, -1)):
        for row in range(26):
            y = band_y + step * (8 + row * 7)
            r = 2.6 * (1 - row / 26)
            if r < 0.6:
                continue
            for x in range(14 + (row % 2) * 6, W, 12):
                d.ellipse((x - r, y - r, x + r, y + r), fill=(176, 160, 120, 150))
    d.line((0, 6, W, 6), fill=INK, width=5)
    d.line((0, H - 7, W, H - 7), fill=INK, width=5)
    d.line((0, 16, W, 16), fill=GOLD, width=3)
    d.line((0, H - 17, W, H - 17), fill=GOLD, width=3)
    if sides:
        d.line((6, 0, 6, H), fill=INK, width=5)
        d.line((W - 7, 0, W - 7, H), fill=INK, width=5)
        d.line((16, 16, 16, H - 17), fill=GOLD, width=3)
        d.line((W - 17, 16, W - 17, H - 17), fill=GOLD, width=3)
    bracket = key_gold(scroll.crop((104, 200, 300, 336)))
    bracket = bracket.resize((bracket.width * 2, bracket.height * 2), Image.Resampling.LANCZOS)
    for flip_x in (False, True):
        for flip_y in (False, True):
            b = bracket
            if flip_x:
                b = b.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
            if flip_y:
                b = b.transpose(Image.Transpose.FLIP_TOP_BOTTOM)
            sheet.alpha_composite(b, (W - b.width - 24 if flip_x else 24, H - b.height - 24 if flip_y else 24))
    return sheet


# ── D. big-win tier ornaments ────────────────────────────────────────────────
#
# Drawn OVER the plaque (win_{tier}.png, 1000x560) on a taller canvas so the
# crown can stand above it and the pendants hang below: 1000x800, the plaque
# occupying y 120..680. Each tier adds to the one below it:
#   superwin  jade pendants on both sides
#   mega      + a gold cloud crown either side of the top crest
#   epic      + a pair of gold dragons on the upper corners
#   max       + jade cups heaped at the foot, and a gold glow round the edge

DECOR = (1000, 800)
PLAQUE_Y = 120


def decor_parts():
    fg = Image.open(SPRITES / "sushiV8/fg_intro.png").convert("RGBA")
    pendant = trim(fg.crop((8, 204, 84, 672)))
    scroll = Image.open(SOURCE / "intro_scroll_blank.png").convert("RGBA")
    cloud = key_gold(scroll.crop((62, 1338, 292, 1428)))
    teapot = Image.open(SPRITES / "sushiSymbols/h1.png").convert("RGBA")
    dragon = key_gold(teapot.crop((404, 20, 512, 336)))
    cup = trim(Image.open(SPRITES / "sushiSymbols/p.png").convert("RGBA"))
    plaque = Image.open(SPRITES / "sushiV8/win_big.png").convert("RGBA")
    return pendant, cloud, dragon, cup, plaque


def tier_decor(level, parts):
    pendant, cloud, dragon, cup, plaque = parts
    W, H = DECOR
    im = Image.new("RGBA", DECOR)
    if level >= 4:
        # gold glow round the plaque, kept OUTSIDE its edge so it never washes the art
        a = Image.new("L", DECOR)
        a.paste(plaque.getchannel("A"), (0, PLAQUE_Y))
        glow = a.filter(ImageFilter.MaxFilter(21)).filter(ImageFilter.GaussianBlur(22))
        glow = ImageChops.subtract(glow, a)
        layer = Image.new("RGBA", DECOR, (255, 214, 120, 0))
        layer.putalpha(glow.point(lambda v: min(255, int(v * 1.3))))
        im.alpha_composite(layer)
    if level >= 1:
        p = pendant.resize((int(pendant.width * 0.62), int(pendant.height * 0.62)), Image.Resampling.LANCZOS)
        y = PLAQUE_Y + 250
        im.alpha_composite(p, (2, y))
        im.alpha_composite(p.transpose(Image.Transpose.FLIP_LEFT_RIGHT), (W - p.width - 2, y))
    if level >= 2:
        c = cloud.resize((int(cloud.width * 0.95), int(cloud.height * 0.95)), Image.Resampling.LANCZOS)
        y = PLAQUE_Y - c.height + 58
        im.alpha_composite(c.transpose(Image.Transpose.FLIP_LEFT_RIGHT), (W // 2 - 62 - c.width, y))
        im.alpha_composite(c, (W // 2 + 62, y))
    if level >= 3:
        dg = dragon.resize((int(dragon.width * 1.0), int(dragon.height * 1.0)), Image.Resampling.LANCZOS)
        # the handle's dragon faces left; on the right corner it looks in
        im.alpha_composite(dg, (W - dg.width - 10, PLAQUE_Y - 96))
        im.alpha_composite(dg.transpose(Image.Transpose.FLIP_LEFT_RIGHT), (10, PLAQUE_Y - 96))
    if level >= 4:
        size = 132
        for i, (dx, dy) in enumerate(((-150, 26), (150, 26), (-76, 8), (76, 8), (0, -6))):
            c = cup.resize((size, int(size * cup.height / cup.width)), Image.Resampling.LANCZOS)
            im.alpha_composite(c, (W // 2 + dx - c.width // 2, PLAQUE_Y + 560 - c.height // 2 + dy))
    return im


def tier_decors():
    parts = decor_parts()
    for name, level in (("big", 0), ("super", 1), ("mega", 2), ("epic", 3), ("max", 4)):
        save(tier_decor(level, parts), f"win_{name}_decor.png")


# ── the free-spin counter and the WAYS strip ─────────────────────────────────
#
# Both were drawn in code in Sushi Monkey's print style (a red misregistered
# offset, a pink rule) — the one place left on screen in another game's
# language. They are now cut from the logo signboard's own carving
# (logo_sign_blank.png): one bay of its lower rail for the counter, the top
# plank for the strip.

def counter_plate():
    sign = Image.open(SOURCE / "logo_sign_blank.png").convert("RGBA")
    # one bay, cut at the outer edges of its two posts
    bay = sign.crop((178, 300, 782, 712))
    # the counter is 1.25:1 (FreeSpinCounter W x H); the bay is 1.47:1. Take the
    # difference out of the plain paper in the middle of the bay rather than
    # stretching the carving: rows 150..250 of the crop are paper and posts only.
    top, mid, bottom = bay.crop((0, 0, bay.width, 150)), bay.crop((0, 150, bay.width, 250)), bay.crop((0, 250, bay.width, bay.height))
    target_h = round(bay.width / 1.25)
    mid = mid.resize((bay.width, target_h - top.height - bottom.height), Image.Resampling.LANCZOS)
    out = Image.new("RGBA", (bay.width, target_h))
    out.alpha_composite(top, (0, 0))
    out.alpha_composite(mid, (0, top.height))
    out.alpha_composite(bottom, (0, top.height + mid.height))
    save(out.resize((1000, 800), Image.Resampling.LANCZOS), "counter_plate.png")


def ways_plate():
    sign = Image.open(SOURCE / "logo_sign_blank.png").convert("RGBA")
    plank = sign.crop((20, 20, 2030, 320))
    H = 200
    k = H / plank.height
    plank = plank.resize((round(plank.width * k), H), Image.Resampling.LANCZOS)
    cap = round(270 * k)
    W = 1800
    left, right = plank.crop((0, 0, cap, H)), plank.crop((plank.width - cap, 0, plank.width, H))
    middle = plank.crop((cap, 0, plank.width - cap, H)).resize((W - 2 * cap, H), Image.Resampling.LANCZOS)
    out = Image.new("RGBA", (W, H))
    out.alpha_composite(left, (0, 0))
    out.alpha_composite(middle, (cap, 0))
    out.alpha_composite(right, (W - cap, 0))
    save(out, "ways_plate.png")


if __name__ == "__main__":
    counter_plate()
    ways_plate()
    particles()
    sign_cords()
    scroll_parts()
    tier_decors()
    print("particles, cords, scroll and tier ornaments exported")
