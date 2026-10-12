"""The three intro-card scenes (FeatureIntro.svelte), Sushi Monkey style —
illustrated SCENES acting out each rule, built from this game's own art (cast
layers, symbols, fonts) with the geometry set by code. Same method as
DinerMonkey美式餐館/design/build_diner_intro_scenes.py (2026-10-10, user:
「三格說明用一樣的流程」).

  intro_collect.png  the W character standing over the ground line, three P
                     symbols sliding in to him along ink speed lines
  intro_slice.png    the FG character beside a "10" card cut in two; shards
                     fly and a P symbol takes its place
  intro_receipt.png  the game's own MAX WIN paper (THEME.check_title), an H1 on
                     its corner, clear paper where FeatureIntro typesets
                     "10,000x" at CHECK_CENTRE

plus menu_frame.png: paper, ONE ink outline and one thin accent rule (user:
「框線不要太多，可以看茶樓的作法」). Drawn as plain sprites — no mesh.

1024 x 640 transparent. The previous cards are kept in design/source/intro_old/.

    python design/build_intro_scenes.py
"""

import json
import math
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

APP = Path(__file__).resolve().parents[1]
SPR = APP / "static/assets/sprites"
OUT = SPR / "sushiV8"
W, H = 1024, 640

THEMES = {
    "MardiMonkey": dict(
        ink=(59, 31, 92, 255), paper=(255, 243, 224, 255),
        a1=(168, 63, 214, 255), a2=(47, 175, 90, 255), a3=(240, 190, 40, 255),
        font="static/fonts/sushi/Fascinate-Regular.ttf", check_title="PARADE PASS",
        ground="street",
    ),
    "StrikeMonkey": dict(
        ink=(20, 38, 46, 255), paper=(255, 244, 222, 255),
        a1=(232, 80, 46, 255), a2=(63, 196, 168, 255), a3=(240, 190, 40, 255),
        font="static/fonts/sushi/BowlbyOne-Regular.ttf", check_title="SCORE CARD",
        ground="lane",
    ),
}
GAME = next(k for k in THEMES if APP.name.startswith(k))
T = THEMES[GAME]
INK, PAPER, A1, A2, A3 = T["ink"], T["paper"], T["a1"], T["a2"], T["a3"]

CHECK_CENTRE = (600, 290)
CHECK_TILT = -5


def load(rel: str) -> Image.Image:
    return Image.open(SPR / rel).convert("RGBA")


def fit(im: Image.Image, h: int) -> Image.Image:
    return im.resize((round(im.width * h / im.height), h), Image.LANCZOS)


def trim(im: Image.Image) -> Image.Image:
    return im.crop(im.getchannel("A").getbbox())


def cast(name: str) -> Image.Image:
    src = APP / "design/source" / name
    meta = json.loads((src / "layers.json").read_text(encoding="utf-8"))
    im = Image.new("RGBA", tuple(meta["canvas"]), (0, 0, 0, 0))
    for layer in sorted(meta["layers"], key=lambda l: l["z"]):
        im.alpha_composite(Image.open(src / layer["file"]).convert("RGBA"), (layer["x"], layer["y"]))
    return trim(im)


def swoosh(d, pts, width, fill=None):
    fill = fill or INK
    n = len(pts) - 1
    for i in range(n):
        d.line([pts[i], pts[i + 1]], fill=fill, width=max(2, round(width * (1 - i / n))))


def shadow_under(im, cx, cy, rx, ry, alpha=90):
    sh = Image.new("RGBA", im.size, (0, 0, 0, 0))
    ImageDraw.Draw(sh).ellipse([cx - rx, cy - ry, cx + rx, cy + ry], fill=(20, 20, 24, alpha))
    im.alpha_composite(sh.filter(ImageFilter.GaussianBlur(8)))


def halftone_spot(im, cx, cy, rx, ry, colour, step=18, rmax=5.5):
    d = ImageDraw.Draw(im)
    for y in range(cy - ry, cy + ry, step):
        for x in range(cx - rx, cx + rx, step):
            xx = x + ((step // 2) if ((y - cy) // step) % 2 else 0)
            k = ((xx - cx) / rx) ** 2 + ((y - cy) / ry) ** 2
            if k >= 1:
                continue
            r = rmax * (1 - k) ** 0.7
            if r > 0.8:
                d.ellipse([xx - r, y - r, xx + r, y + r], fill=colour)


def tint(c, a):
    return (c[0], c[1], c[2], a)


def sym(name: str, size: int, tilt: float = 0) -> Image.Image:
    return load(f"sushiSymbols/{name}.png").resize((size, size), Image.LANCZOS).rotate(tilt, resample=Image.BICUBIC)


def ground(d):
    """what the collector stands behind: a bowling lane's edge, or a parade
    street's kerb with confetti"""
    if T["ground"] == "lane":
        d.rounded_rectangle([90, 500, 934, 560], 16, fill=(236, 196, 132, 255), outline=INK, width=6)
        for x in range(150, 900, 60):
            d.line([x, 506, x - 14, 554], fill=(206, 160, 98, 255), width=4)
        d.line([110, 516, 914, 516], fill=PAPER, width=4)
        for x in (300, 512, 724):
            d.polygon([(x - 14, 584), (x + 14, 584), (x, 566)], fill=A1, outline=INK)
    else:
        d.rounded_rectangle([90, 500, 934, 548], 14, fill=A2, outline=INK, width=6)
        d.rounded_rectangle([110, 544, 914, 594], 10, fill=A1, outline=INK, width=6)
        for i, x in enumerate(range(130, 900, 46)):
            y = 516 + (i % 3) * 8
            d.rectangle([x, y, x + 12, y + 6], fill=[A3, PAPER, A1][i % 3])


def collect():
    im = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    halftone_spot(im, 512, 330, 470, 300, tint(A1, 70))
    who = cast("mg")
    who = who.crop((0, 0, who.width, round(who.height * 0.64)))
    who = fit(who, 560)
    shadow_under(im, 512, 600, 300, 24)
    im.alpha_composite(who, (512 - who.width // 2, 4))
    d = ImageDraw.Draw(im)
    ground(d)
    for cx, cy, size, flip in ((212, 432, 200, 1), (512, 452, 210, 0), (812, 432, 200, -1)):
        if flip:
            for k, (dy, ln) in enumerate(((-46, 96), (-4, 128), (36, 84))):
                xa = cx - flip * (size // 2 - 10)
                swoosh(d, [(xa - flip * (ln + 24), cy + dy), (xa - flip * 24, cy + dy - 6)], 10 - 2 * k)
        shadow_under(im, cx, cy + size // 2 - 30, size // 2 - 30, 12)
        im.alpha_composite(sym("p", size, -8 * flip), (cx - size // 2, cy - size // 2))
    return im


def ten_card(size: int) -> Image.Image:
    c = load("sushiSymbols/l5.png").resize((size, size), Image.LANCZOS)
    c.alpha_composite(load("jadeMesh/l5_subject.png").resize((size, size), Image.LANCZOS))
    return c


def slice_card():
    im = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    halftone_spot(im, 300, 360, 330, 270, tint(A2, 80))
    who = fit(cast("fg"), 630)
    im.alpha_composite(who, (250 - who.width // 2, 6))
    # cut between the 1 and the 0, so each half keeps a whole digit; the
    # halves part sideways along the cut and the P stands in the gap
    n = 230
    card = ten_card(n)
    cut = [(n * 0.50, 0), (n * 0.42, n)]
    mask = Image.new("L", card.size, 0)
    ImageDraw.Draw(mask).polygon([(0, 0), cut[0], cut[1], (0, n)], fill=255)
    left = Image.new("RGBA", card.size, (0, 0, 0, 0))
    left.paste(card, (0, 0), mask)
    right = Image.new("RGBA", card.size, (0, 0, 0, 0))
    right.paste(card, (0, 0), Image.eval(mask, lambda v: 255 - v))
    for piece, dx in ((left, -2), (right, 2)):
        ImageDraw.Draw(piece).line([(cut[0][0] + dx, cut[0][1] + 12), (cut[1][0] + dx, cut[1][1] - 12)], fill=INK, width=5)
    cx, cy = 770, 320
    d = ImageDraw.Draw(im)
    # the cut's stroke runs on past the card, up and down
    swoosh(d, [(cx + 60, cy - 250), (cx + 20, cy - 80), (cx - 20, cy + 80), (cx - 60, cy + 250)], 10)
    swoosh(d, [(cx + 82, cy - 240), (cx + 44, cy - 80), (cx + 8, cy + 60)], 5, fill=A1)
    lr = left.rotate(8, resample=Image.BICUBIC, expand=True)
    rr_ = right.rotate(-8, resample=Image.BICUBIC, expand=True)
    im.alpha_composite(lr, (cx - lr.width // 2 - 95, cy - lr.height // 2 - 20))
    im.alpha_composite(rr_, (cx - rr_.width // 2 + 95, cy - rr_.height // 2 + 20))
    shadow_under(im, cx, cy + 92, 60, 10)
    im.alpha_composite(sym("p", 170), (cx - 85, cy - 85 + 6))
    d = ImageDraw.Draw(im)
    for sx, sy, r, a in ((cx + 180, cy - 210, 30, 20), (cx + 196, cy + 40, 26, -30), (cx - 200, cy - 190, 26, 60),
                         (cx + 140, cy + 200, 22, 110), (cx - 10, cy - 268, 20, 10)):
        pts = [(sx + r * math.cos(math.radians(a + k * 120 + (25 if k == 1 else 0))),
                sy + r * 0.75 * math.sin(math.radians(a + k * 120 + (25 if k == 1 else 0)))) for k in range(3)]
        d.polygon(pts, fill=PAPER, outline=INK, width=5)
    for sx, sy, r, c in ((cx + 214, cy - 130, 24, A1), (cx - 150, cy - 250, 20, A3)):
        pts = []
        for i in range(8):
            rr = r if i % 2 == 0 else r * 0.38
            a = math.pi / 4 * i - math.pi / 2
            pts.append((sx + rr * math.cos(a), sy + rr * math.sin(a)))
        d.polygon(pts, fill=c, outline=INK, width=4)
    return im


def check():
    k = 2
    w, h = 540, 430
    c = Image.new("RGBA", (W * k, H * k), (0, 0, 0, 0))
    d = ImageDraw.Draw(c)
    x0, y0 = CHECK_CENTRE[0] - w // 2, CHECK_CENTRE[1] - 195
    x1, y1 = x0 + w, y0 + h
    s = lambda *v: [round(a * k) for a in v]
    teeth = [(x1 - (x1 - x0) * i / 22, y1 - (10 if i % 2 else 0)) for i in range(23)]
    outline = [(x0, y0), (x1, y0)] + teeth + [(x0, y1)]
    d.polygon([(x * k + 16 * k, y * k + 16 * k) for x, y in outline], fill=A1)
    d.polygon([(x * k, y * k) for x, y in outline], fill=PAPER, outline=INK, width=7 * k)
    d.rectangle(s(x0 + 22, y0 + 34, x1 - 22, y0 + 100), fill=A2, outline=INK, width=5 * k)
    font = ImageFont.truetype(str(APP / T["font"]), 46 * k)
    tw = d.textlength(T["check_title"], font=font)
    bb = d.textbbox((0, 0), T["check_title"], font=font)
    d.text(((x0 + w / 2) * k - tw / 2, (y0 + 67) * k - (bb[1] + bb[3]) / 2), T["check_title"], font=font, fill=PAPER, stroke_width=3 * k, stroke_fill=INK)
    for y in (y0 + 128, y0 + 262):
        d.line(s(x0 + 30, y, x1 - 30, y), fill=tint(A2, 255), width=4 * k)
    if T["ground"] == "lane":
        # the score card's frame boxes
        bx = (x1 - x0 - 60) / 10
        for i in range(10):
            xa = x0 + 30 + i * bx
            d.rectangle(s(xa, y0 + 286, xa + bx, y0 + 346), outline=INK, width=3 * k)
            d.rectangle(s(xa + bx * 0.55, y0 + 286, xa + bx, y0 + 310), outline=INK, width=2 * k)
            if i < 6:
                d.line(s(xa + bx * 0.62, y0 + 306, xa + bx * 0.93, y0 + 290), fill=A1, width=3 * k)
    else:
        for i in range(3):
            y = y0 + 300 + i * 30
            d.line(s(x0 + 50, y, x0 + 260 - 30 * (i % 2), y), fill=(110, 100, 120, 255), width=4 * k)
        # a perforated stub
        for y in range(y0 + 280, y1 - 20, 14):
            d.ellipse(s(x1 - 120 - 3, y - 3, x1 - 120 + 3, y + 3), fill=INK)
    sx, sy = x1 - 70, y0 + 360
    if T["ground"] == "lane":
        return c.resize((W, H), Image.LANCZOS)  # the frame boxes fill the foot
    d.ellipse(s(sx - 40, sy - 40, sx + 40, sy + 40), outline=tint(A1, 200), width=6 * k)
    pts = []
    for i in range(10):
        rr = 22 if i % 2 == 0 else 9
        a = math.pi / 5 * i - math.pi / 2
        pts.append(((sx + rr * math.cos(a)) * k, (sy + rr * math.sin(a)) * k))
    d.polygon(pts, fill=tint(A1, 200))
    return c.resize((W, H), Image.LANCZOS)


def receipt():
    im = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    halftone_spot(im, 560, 330, 470, 290, tint(A2, 70))
    shadow_under(im, 600, 560, 320, 18)
    im.alpha_composite(check().rotate(CHECK_TILT, center=CHECK_CENTRE, resample=Image.BICUBIC))
    h1 = fit(trim(load("sushiSymbols/h1.png")), 220)
    shadow_under(im, 300, 586, 112, 14)
    im.alpha_composite(h1, (300 - h1.width // 2, 590 - h1.height))
    return im


def menu_frame():
    k = 2
    w, h = 740, 1024
    im = Image.new("RGBA", (w * k, h * k), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.rounded_rectangle([22 * k, 22 * k, (w - 22) * k, (h - 22) * k], radius=34 * k, fill=PAPER, outline=INK, width=9 * k)
    d.rounded_rectangle([40 * k, 40 * k, (w - 40) * k, (h - 40) * k], radius=22 * k, outline=A1, width=4 * k)
    return im.resize((w, h), Image.LANCZOS)


def main():
    keep = APP / "design/source/intro_old"
    keep.mkdir(parents=True, exist_ok=True)
    for name, build in (("intro_collect", collect), ("intro_slice", slice_card), ("intro_receipt", receipt), ("menu_frame", menu_frame)):
        if not (keep / f"{name}.png").exists():
            (keep / f"{name}.png").write_bytes((OUT / f"{name}.png").read_bytes())
        build().save(OUT / f"{name}.png", optimize=True)
        print(GAME, "wrote", name)


if __name__ == "__main__":
    main()
