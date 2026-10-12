"""The three intro-card scenes (FeatureIntro.svelte), Sushi Monkey style.

Sushi Monkey's cards are illustrated SCENES that act out each rule — the chef
sweeping plates to himself, the apprentice slicing through a "10" card, a
receipt printing out with "10,000x" typeset on it. Jade's were small round
medallions with symbols pasted in. These rebuild the scenes from Jade's own
art (the cast PSD layers, the cut-in, the symbols, the label cards), with the
geometry set by code — the part-based method, not a regeneration:

  intro_collect.png  the Tea Master, three jade cups swept in toward him
  intro_slice.png    the apprentice's fan cuts a "10" card in two; paper
                     shards fly and a jade cup takes its place
  intro_receipt.png  a tea bill unrolling off its rod, a red seal on it, and
                     clear paper where FeatureIntro typesets "10,000x"

1024 x 640 transparent, like the originals. The medallion versions are kept in
design/source/intro_medallions/.

    python design/build_intro_scenes.py
"""

import json
import math
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

APP = Path(__file__).resolve().parents[1]
SPR = APP / "static/assets/sprites"
OUT = SPR / "sushiV8"
W, H = 1024, 640
INK = (32, 44, 40, 255)
PAPER = (246, 241, 226, 255)


def load(rel: str) -> Image.Image:
    return Image.open(SPR / rel).convert("RGBA")


def fit(im: Image.Image, h: int) -> Image.Image:
    return im.resize((round(im.width * h / im.height), h), Image.LANCZOS)


def cast(name: str) -> Image.Image:
    """the full cast figure, assembled from its PSD layers in their own order"""
    src = APP / "design/source" / name
    meta = json.loads((src / "layers.json").read_text(encoding="utf-8"))
    im = Image.new("RGBA", tuple(meta["canvas"]), (0, 0, 0, 0))
    for layer in sorted(meta["layers"], key=lambda l: l["z"]):
        im.alpha_composite(Image.open(src / layer["file"]).convert("RGBA"), (layer["x"], layer["y"]))
    return im


def swoosh(d: ImageDraw.ImageDraw, pts, width: float):
    """a tapering ink speed-line along a polyline (thick at the start)"""
    n = len(pts) - 1
    for i in range(n):
        w = max(2, round(width * (1 - i / n)))
        d.line([pts[i], pts[i + 1]], fill=INK, width=w)


def arc(c, r, a0, a1, steps=18):
    return [(c[0] + r * math.cos(math.radians(a)), c[1] + r * math.sin(math.radians(a)))
            for a in [a0 + (a1 - a0) * i / steps for i in range(steps + 1)]]


def shadow_under(im: Image.Image, cx: int, cy: int, rx: int, ry: int):
    sh = Image.new("RGBA", im.size, (0, 0, 0, 0))
    ImageDraw.Draw(sh).ellipse([cx - rx, cy - ry, cx + rx, cy + ry], fill=(20, 30, 26, 90))
    im.alpha_composite(sh.filter(ImageFilter.GaussianBlur(8)))


def collect() -> Image.Image:
    im = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    master = cast("mg").crop((40, 0, 520, 700))  # down to mid-thigh
    master = fit(master, 600)
    shadow_under(im, 512, 600, 300, 26)
    im.alpha_composite(master, (512 - master.width // 2, 8))
    cup = load("sushiSymbols/p.png")
    d = ImageDraw.Draw(im)
    # the cups slide in from the sides along swept ink lines
    for cx, cy, size, flip in ((206, 520, 200, 1), (512, 548, 210, 0), (818, 520, 200, -1)):
        if flip:
            # speed lines trailing behind the cup: it is sliding in to him
            for k, (dy, ln) in enumerate(((-50, 90), (-5, 120), (40, 80))):
                xa = cx - flip * (size // 2 - 4)
                swoosh(d, [(xa - flip * (ln + 20), cy + dy), (xa - flip * 20, cy + dy - 6)][:: 1], 9 - 2 * k)
        c = cup.resize((size, size), Image.LANCZOS).rotate(-8 * flip, resample=Image.BICUBIC, expand=False)
        shadow_under(im, cx, cy + size // 2 - 26, size // 2 - 20, 12)
        im.alpha_composite(c, (cx - size // 2, cy - size // 2))
    return im


def slice_card() -> Image.Image:
    im = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    girl = fit(cast_cut_in(), 640).transpose(Image.FLIP_LEFT_RIGHT)
    im.alpha_composite(girl, (-40, 0))
    # the "10" card, cut on a diagonal; its halves part along the cut
    card = load("sushiSymbols/l5.png").resize((300, 300), Image.LANCZOS)
    ten = load("jadeMesh/l5_subject.png").resize((300, 300), Image.LANCZOS)
    card.alpha_composite(ten)
    mask = Image.new("L", card.size, 0)
    ImageDraw.Draw(mask).polygon([(0, 0), (300, 0), (300, 90), (0, 210)], fill=255)
    top = Image.new("RGBA", card.size, (0, 0, 0, 0))
    top.paste(card, (0, 0), mask)
    bottom = Image.new("RGBA", card.size, (0, 0, 0, 0))
    bottom.paste(card, (0, 0), Image.eval(mask, lambda v: 255 - v))
    cx, cy = 770, 360
    d = ImageDraw.Draw(im)
    # the cut itself: one hard ink stroke across the gap
    swoosh(d, [(cx - 330, cy + 70), (cx - 150, cy + 10), (cx + 40, cy - 50), (cx + 230, cy - 115)], 10)
    # the halves part along the cut: the top flies up and right, the foot drops
    im.alpha_composite(top.rotate(14, resample=Image.BICUBIC, expand=True), (cx - 120, cy - 330))
    im.alpha_composite(bottom.rotate(-12, resample=Image.BICUBIC, expand=True), (cx - 230, cy - 80))
    # and in the gap, the jade cup that takes its place
    cup = load("sushiSymbols/p.png").resize((210, 210), Image.LANCZOS)
    shadow_under(im, cx + 10, cy + 105, 110, 14)
    im.alpha_composite(cup, (cx - 95, cy - 95))
    d = ImageDraw.Draw(im)
    for sx, sy, r, a in ((cx + 190, cy - 250, 34, 20), (cx + 215, cy + 10, 28, -30), (cx - 250, cy - 170, 30, 60),
                         (cx + 130, cy + 160, 24, 110), (cx - 300, cy + 140, 22, -70), (cx - 30, cy - 280, 22, 10)):
        pts = [(sx + r * math.cos(math.radians(a + k * 120 + (25 if k == 1 else 0))),
                sy + r * 0.75 * math.sin(math.radians(a + k * 120 + (25 if k == 1 else 0)))) for k in range(3)]
        d.polygon(pts, fill=PAPER, outline=INK, width=5)
    return im


def cast_cut_in() -> Image.Image:
    return load("sushiScene/chef_cut_in.png")


def receipt() -> Image.Image:
    """the bill as a handscroll: unrolled between its two rollers, tilted a
    little, clear paper where FeatureIntro typesets "10,000x" (x 600..880,
    y 300..410 of the 1024 x 640 frame), a red seal and a few lines of items"""
    big = 2
    im = Image.new("RGBA", (W * big, H * big), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    s = lambda pts: [(x * big, y * big) for x, y in pts]
    x0, x1 = 210, 900
    centre = lambda x: 236 + 0.17 * (x - x0) + 8 * math.sin((x - x0) / 120)
    half = lambda x: 92 + 26 * (x - x0) / (x1 - x0)
    xs = [x0 + (x1 - x0) * i / 60 for i in range(61)]
    top = [(x, centre(x) - half(x)) for x in xs]
    bottom = [(x, centre(x) + half(x)) for x in xs]
    d.polygon(s(top + bottom[::-1]), fill=PAPER, outline=INK, width=6 * big)
    # a border rule just inside the edge, like a printed bill
    d.line(s([(x, centre(x) - half(x) + 16) for x in xs]), fill=(196, 160, 96, 255), width=3 * big)
    d.line(s([(x, centre(x) + half(x) - 16) for x in xs]), fill=(196, 160, 96, 255), width=3 * big)
    # the items, in ink, down the left of the bill
    for i in range(4):
        xa = 262
        y = centre(xa) - 50 + i * 30
        d.line(s([(xa, y), (xa + 150 - 26 * (i % 2), y + 26)]), fill=(120, 110, 96, 255), width=4 * big)
    # the red seal, below the items
    sx, sy = 300, centre(300) + 58
    d.rounded_rectangle(s([(sx - 30, sy - 30), (sx + 30, sy + 30)]), radius=8 * big, fill=(184, 72, 58, 255), outline=(120, 40, 30, 255), width=4 * big)
    d.rectangle(s([(sx - 19, sy - 19), (sx + 19, sy + 19)]), outline=(246, 220, 200, 255), width=4 * big)
    d.line(s([(sx, sy - 15), (sx, sy + 15)]), fill=(246, 220, 200, 255), width=5 * big)
    d.line(s([(sx - 15, sy), (sx + 15, sy)]), fill=(246, 220, 200, 255), width=5 * big)
    # the rollers: wood wound with paper, jade caps; the right one fatter
    for x, r in ((x0, 26), (x1, 34)):
        c, h = centre(x), half(x) + 20
        d.rounded_rectangle(s([(x - r, c - h), (x + r, c + h)]), radius=r * big, fill=(238, 230, 210, 255), outline=INK, width=6 * big)
        d.line(s([(x - r + 8, c - h + 18), (x - r + 8, c + h - 18)]), fill=(200, 190, 168, 255), width=4 * big)
        d.rounded_rectangle(s([(x - 9, c - h - 34), (x + 9, c + h + 34)]), radius=8 * big, fill=(96, 70, 48, 255), outline=INK, width=4 * big)
        for y in (c - h - 40, c + h + 26):
            d.ellipse(s([(x - 17, y), (x + 17, y + 20)]), fill=(120, 176, 150, 255), outline=INK, width=4 * big)
    im = im.resize((W, H), Image.LANCZOS)
    out = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    shadow_under(out, 560, 560, 380, 22)
    out.alpha_composite(im)
    return out


def main():
    keep = APP / "design/source/intro_medallions"
    keep.mkdir(parents=True, exist_ok=True)
    for name, build in (("intro_collect", collect), ("intro_slice", slice_card), ("intro_receipt", receipt)):
        if not (keep / f"{name}.png").exists():
            (keep / f"{name}.png").write_bytes((OUT / f"{name}.png").read_bytes())
        build().save(OUT / f"{name}.png", optimize=True)
        print("wrote", name)


if __name__ == "__main__":
    main()
