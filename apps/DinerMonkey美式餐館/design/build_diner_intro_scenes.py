"""The three intro-card scenes (FeatureIntro.svelte), Sushi Monkey style, for
Diner Monkey (2026-10-09, user: 「三格說明圖做精緻一點，像壽司猴那樣」).

Sushi Monkey's cards are illustrated SCENES that act out each rule. Codex's
first Diner cards were comic bursts with heads pasted in. These rebuild the
scenes from Diner's own art — the cast figure, the Carhop cut-in, the symbol
and prop art — with the geometry set by code (the part-based method, as Jade
Teahouse's design/build_intro_scenes.py did):

  intro_collect.png  the Chef behind the counter, three order trays sliding
                     in to him along ink speed lines
  intro_slice.png    the Carhop skates through a "10" card and cuts it in two;
                     paper shards fly and an order tray takes its place
  intro_receipt.png  a diner GUEST CHECK, a burger on its corner, clear paper
                     where FeatureIntro typesets "10,000x" (CHECK_CLEAR below)

1024 x 640 transparent, like the originals; drawn as plain sprites (no mesh:
an intro card's art is cut by FeatureIntro's box, and a mesh on it tore).
Also writes menu_frame.png, the single-rule card behind them. build_diner_art.py
no longer writes any of these. Codex's burst versions are kept in
design/source/diner/intro_burst/.

    python design/build_diner_intro_scenes.py
"""

import json
import math
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

APP = Path(__file__).resolve().parents[1]
SPR = APP / "static/assets/sprites"
OUT = SPR / "sushiV8"
W, H = 1024, 640
INK = (27, 27, 27, 255)
PAPER = (251, 245, 230, 255)
RED = (226, 52, 43, 255)
CYAN = (31, 163, 200, 255)
MINT = (143, 211, 193, 255)
CHROME = (219, 224, 226, 255)
FONT = APP / "static/fonts/sushi/Bangers-Regular.ttf"

# where FeatureIntro typesets "10,000x" on the guest check: centre and the
# clear box's size, in this 1024 x 640 frame (after the check's tilt)
CHECK_CENTRE = (600, 290)
CHECK_TILT = -5  # degrees, counter-clockwise positive (PIL)


def load(rel: str) -> Image.Image:
    return Image.open(SPR / rel).convert("RGBA")


def fit(im: Image.Image, h: int) -> Image.Image:
    return im.resize((round(im.width * h / im.height), h), Image.LANCZOS)


def trim(im: Image.Image) -> Image.Image:
    return im.crop(im.getchannel("A").getbbox())


def swoosh(d: ImageDraw.ImageDraw, pts, width: float, fill=INK):
    """a tapering ink speed-line along a polyline (thick at the start)"""
    n = len(pts) - 1
    for i in range(n):
        w = max(2, round(width * (1 - i / n)))
        d.line([pts[i], pts[i + 1]], fill=fill, width=w)


def shadow_under(im: Image.Image, cx: int, cy: int, rx: int, ry: int, alpha=90):
    sh = Image.new("RGBA", im.size, (0, 0, 0, 0))
    ImageDraw.Draw(sh).ellipse([cx - rx, cy - ry, cx + rx, cy + ry], fill=(20, 20, 24, alpha))
    im.alpha_composite(sh.filter(ImageFilter.GaussianBlur(8)))


def halftone_spot(im: Image.Image, cx: int, cy: int, rx: int, ry: int, colour, step=18, rmax=5.5):
    """a comic-print dot field fading out from the centre — the ground a figure
    stands on, in the poster's own halftone"""
    d = ImageDraw.Draw(im)
    for y in range(cy - ry, cy + ry, step):
        for x in range(cx - rx, cx + rx, step):
            off = (step // 2) if ((y - cy) // step) % 2 else 0
            xx = x + off
            k = ((xx - cx) / rx) ** 2 + ((y - cy) / ry) ** 2
            if k >= 1:
                continue
            r = rmax * (1 - k) ** 0.7
            if r > 0.8:
                d.ellipse([xx - r, y - r, xx + r, y + r], fill=colour)


def tray(size: int, tilt: float = 0) -> Image.Image:
    t = load("sushiSymbols/p.png").resize((size, size), Image.LANCZOS)
    return t.rotate(tilt, resample=Image.BICUBIC, expand=False)


# ---------------------------------------------------------------------------

def collect() -> Image.Image:
    im = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    halftone_spot(im, 512, 330, 470, 300, (226, 52, 43, 70))
    chef = trim(Image.open(APP / "design/source/diner/master_full.png").convert("RGBA"))
    chef = chef.crop((0, 0, chef.width, round(chef.height * 0.62)))  # to the apron's hem
    chef = fit(chef, 560)
    shadow_under(im, 512, 600, 300, 24)
    im.alpha_composite(chef, (512 - chef.width // 2, 6))
    # the counter top he stands behind: a chrome rail with the red face below
    d = ImageDraw.Draw(im)
    d.rounded_rectangle([90, 500, 934, 548], 18, fill=CHROME, outline=INK, width=6)
    d.line([112, 512, 912, 512], fill=PAPER, width=5)
    d.rounded_rectangle([110, 544, 914, 600], 10, fill=RED, outline=INK, width=6)
    for x in range(150, 900, 75):
        d.ellipse([x - 5, 567, x + 5, 577], fill=CHROME, outline=INK, width=2)
    # the trays slide in along the counter from both sides, speed lines behind
    for cx, cy, size, flip in ((212, 432, 210, 1), (512, 452, 220, 0), (812, 432, 210, -1)):
        if flip:
            for k, (dy, ln) in enumerate(((-46, 96), (-4, 128), (36, 84))):
                xa = cx - flip * (size // 2 - 6)
                swoosh(d, [(xa - flip * (ln + 24), cy + dy), (xa - flip * 24, cy + dy - 6)], 10 - 2 * k)
        shadow_under(im, cx, cy + size // 2 - 36, size // 2 - 24, 12)
        im.alpha_composite(tray(size, -8 * flip), (cx - size // 2, cy - size // 2))
    return im


def ten_card(size: int) -> Image.Image:
    """the royals' "10" card as the board draws it: paper, grey keyline, ink 10"""
    k = 2
    c = Image.new("RGBA", (size * k, size * k), (0, 0, 0, 0))
    d = ImageDraw.Draw(c)
    m = size * k * 0.07
    d.rounded_rectangle([m, m, size * k - m, size * k - m], radius=size * k * 0.09, fill=INK)
    m2 = m + size * k * 0.035
    d.rounded_rectangle([m2, m2, size * k - m2, size * k - m2], radius=size * k * 0.07, fill=CHROME)
    m3 = m2 + size * k * 0.04
    d.rounded_rectangle([m3, m3, size * k - m3, size * k - m3], radius=size * k * 0.05, fill=PAPER, outline=INK, width=round(size * k * 0.012))
    c = c.resize((size, size), Image.LANCZOS)
    ten = load("jadeMesh/l5_subject.png").resize((size, size), Image.LANCZOS)
    c.alpha_composite(ten)
    return c


def slice_card() -> Image.Image:
    im = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    halftone_spot(im, 300, 360, 330, 270, (244, 143, 177, 80))
    girl = fit(trim(load("sushiScene/chef_cut_in.png")), 640)
    im.alpha_composite(girl, (-70, 0))
    # the "10" card, cut on a shallow diagonal straight through the 10, its
    # halves thrown apart along the cut: the top up and right, the foot down
    n = 230
    card = ten_card(n)
    cut = [(0, n * 0.62), (n, n * 0.38)]
    mask = Image.new("L", card.size, 0)
    ImageDraw.Draw(mask).polygon([(0, 0), (n, 0), cut[1], cut[0]], fill=255)
    top = Image.new("RGBA", card.size, (0, 0, 0, 0))
    top.paste(card, (0, 0), mask)
    bottom = Image.new("RGBA", card.size, (0, 0, 0, 0))
    bottom.paste(card, (0, 0), Image.eval(mask, lambda v: 255 - v))
    # ink along each cut edge, so the halves read as cut card, not fading paper
    for piece, dy in ((top, -2), (bottom, 2)):
        ImageDraw.Draw(piece).line([(cut[0][0] + 14, cut[0][1] + dy), (cut[1][0] - 14, cut[1][1] + dy)], fill=INK, width=5)
    cx, cy = 760, 320
    d = ImageDraw.Draw(im)
    # the cut: one hard ink stroke from her skate's line, through the gap
    swoosh(d, [(cx - 340, cy + 120), (cx - 170, cy + 66), (cx, cy + 12), (cx + 220, cy - 58)], 11)
    swoosh(d, [(cx - 310, cy + 144), (cx - 140, cy + 92), (cx + 30, cy + 40)], 5, fill=PINK)
    tr = top.rotate(9, resample=Image.BICUBIC, expand=True)
    br = bottom.rotate(-8, resample=Image.BICUBIC, expand=True)
    im.alpha_composite(tr, (cx - tr.width // 2 + 40, cy - tr.height // 2 - 92))
    im.alpha_composite(br, (cx - br.width // 2 - 44, cy - br.height // 2 + 88))
    # and in the gap, the order tray that takes its place
    shadow_under(im, cx + 6, cy + 74, 92, 12)
    t = tray(184)
    im.alpha_composite(t, (cx - 92 + 6, cy - 92 + 4))
    d = ImageDraw.Draw(im)
    for sx, sy, r, a in ((cx + 180, cy - 210, 30, 20), (cx + 196, cy + 40, 26, -30), (cx - 200, cy - 190, 26, 60),
                         (cx + 140, cy + 200, 22, 110), (cx - 250, cy + 210, 20, -70), (cx - 10, cy - 268, 20, 10)):
        pts = [(sx + r * math.cos(math.radians(a + k * 120 + (25 if k == 1 else 0))),
                sy + r * 0.75 * math.sin(math.radians(a + k * 120 + (25 if k == 1 else 0)))) for k in range(3)]
        d.polygon(pts, fill=PAPER, outline=INK, width=5)
    # two comic sparkles
    for sx, sy, r in ((cx + 214, cy - 130, 24), (cx - 150, cy - 250, 20)):
        pts = []
        for i in range(8):
            rr = r if i % 2 == 0 else r * 0.38
            a = math.pi / 4 * i - math.pi / 2
            pts.append((sx + rr * math.cos(a), sy + rr * math.sin(a)))
        d.polygon(pts, fill=(244, 143, 177, 255), outline=INK, width=4)
    return im


def guest_check() -> Image.Image:
    """the check itself, upright, on a canvas centred on CHECK_CENTRE"""
    k = 2
    w, h = 540, 430
    c = Image.new("RGBA", (W * k, H * k), (0, 0, 0, 0))
    d = ImageDraw.Draw(c)
    x0 = CHECK_CENTRE[0] - w // 2
    y0 = CHECK_CENTRE[1] - 195  # the clear paper's middle is y0 + 195
    x1, y1 = x0 + w, y0 + h
    s = lambda *v: [round(a * k) for a in v]
    # torn bottom edge
    teeth = []
    n = 22
    for i in range(n + 1):
        teeth.append((x1 - (x1 - x0) * i / n, y1 - (10 if i % 2 else 0)))
    outline = [(x0, y0), (x1, y0)] + teeth + [(x0, y1)]
    # the misregistered red shadow every card in the game has
    d.polygon([(x * k + 16 * k, y * k + 16 * k) for x, y in outline], fill=RED)
    d.polygon([(x * k, y * k) for x, y in outline], fill=PAPER, outline=INK, width=7 * k)
    # header: GUEST CHECK on a red band, the pad's binding above it
    d.rectangle(s(x0 + 4, y0 + 4, x1 - 4, y0 + 30), fill=CHROME)
    d.line(s(x0, y0 + 32, x1, y0 + 32), fill=INK, width=5 * k)
    d.rectangle(s(x0 + 22, y0 + 50, x1 - 22, y0 + 112), fill=RED, outline=INK, width=5 * k)
    font = ImageFont.truetype(str(FONT), 52 * k)
    text = "GUEST CHECK"
    tw = d.textlength(text, font=font)
    d.text(((x0 + w / 2) * k - tw / 2, (y0 + 52) * k), text, font=font, fill=PAPER, stroke_width=3 * k, stroke_fill=INK)
    # the clear paper the total is typeset on: a double rule above and below
    for y in (y0 + 128, y0 + 262):
        d.line(s(x0 + 30, y, x1 - 30, y), fill=MINT, width=4 * k)
    # the items below, in pencil, on mint ruled lines
    for i in range(4):
        y = y0 + 292 + i * 30
        d.line(s(x0 + 30, y, x1 - 30, y), fill=MINT, width=3 * k)
        if i < 3:
            d.line(s(x0 + 50, y - 12, x0 + 220 - 30 * (i % 2), y - 12), fill=(110, 110, 120, 255), width=4 * k)
            d.line(s(x1 - 140, y - 12, x1 - 60, y - 12), fill=(110, 110, 120, 255), width=4 * k)
    # a red paid-style ring stamp, no words
    sx, sy = x1 - 92, y0 + 346
    d.ellipse(s(sx - 52, sy - 52, sx + 52, sy + 52), outline=(226, 52, 43, 200), width=7 * k)
    d.ellipse(s(sx - 38, sy - 38, sx + 38, sy + 38), outline=(226, 52, 43, 160), width=3 * k)
    pts = []
    for i in range(10):
        rr = 26 if i % 2 == 0 else 11
        a = math.pi / 5 * i - math.pi / 2
        pts.append(((sx + rr * math.cos(a)) * k, (sy + rr * math.sin(a)) * k))
    d.polygon(pts, fill=(226, 52, 43, 190))
    return c.resize((W, H), Image.LANCZOS)


def receipt() -> Image.Image:
    im = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    halftone_spot(im, 560, 330, 470, 290, (31, 163, 200, 70))
    shadow_under(im, 600, 560, 320, 18)
    check = guest_check().rotate(CHECK_TILT, center=CHECK_CENTRE, resample=Image.BICUBIC)
    im.alpha_composite(check)
    # the burger on the check's corner, as if just served with it
    burger = fit(trim(Image.open(APP / "design/source/diner/props/mg_burger.png").convert("RGBA")), 210)
    shadow_under(im, 300, 586, 112, 14)
    im.alpha_composite(burger, (300 - burger.width // 2, 586 - burger.height + 10))
    # a pencil tucked across the top
    d = ImageDraw.Draw(im)
    # pencil across the check's top-right corner
    d.line([(790, 52), (952, 112)], fill=INK, width=24)
    d.line([(796, 54), (946, 110)], fill=(247, 197, 49, 255), width=14)
    d.polygon([(950, 104), (984, 126), (944, 122)], fill=(230, 200, 160, 255), outline=INK)
    d.line([(786, 50), (806, 57)], fill=PINK, width=18)
    return im


PINK = (244, 143, 177, 255)


def menu_frame() -> Image.Image:
    """The card behind each scene: paper, ONE ink outline and one thin red rule
    inside it (user, 2026-10-10: 「框線不要太多，可以看茶樓的作法」 — Jade's card
    is a single frame). The old one stacked an ink edge, a red rule, a cyan
    rule, two checker rows and four rivets."""
    k = 2
    w, h = 740, 1024
    im = Image.new("RGBA", (w * k, h * k), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.rounded_rectangle([22 * k, 22 * k, (w - 22) * k, (h - 22) * k], radius=34 * k, fill=PAPER, outline=INK, width=9 * k)
    d.rounded_rectangle([40 * k, 40 * k, (w - 40) * k, (h - 40) * k], radius=22 * k, outline=RED, width=4 * k)
    return im.resize((w, h), Image.LANCZOS)


def main():
    keep = APP / "design/source/diner/intro_burst"
    keep.mkdir(parents=True, exist_ok=True)
    for name, build in (("intro_collect", collect), ("intro_slice", slice_card), ("intro_receipt", receipt)):
        if not (keep / f"{name}.png").exists():
            (keep / f"{name}.png").write_bytes((OUT / f"{name}.png").read_bytes())
        build().save(OUT / f"{name}.png", optimize=True)
        print("wrote", name)
    menu_frame().save(OUT / "menu_frame.png", optimize=True)
    print("wrote menu_frame")


if __name__ == "__main__":
    main()
