"""Give the flat plates a printed surface — paper tooth, halftone shading, ink
speckle — without moving a single edge.

    python3 design/print_finish.py

The first submission was rejected with "Reused assets" next to plates that
measured 1-5 fill colours (check_review_tags.py: "flat-fill art ... reads as
vector/placeholder"). The screenprint style is flat ink by design, but real
screenprint is not flat: the paper shows its grain, a solid shows pinholes, and
shading is a halftone. This pass adds exactly that.

Shapes and alpha are untouched (the win plaque is a mesh whose regions were
measured on this canvas — src/game/meshWin/banner.ts), so nothing in code
moves. Originals are backed up once to design/_flat_backup/ and every run reads
from there, so it re-runs safely and `--restore` puts them back.

The win tiers also escalate: a halftone sunburst behind the title band, faint
on BIG and dense on MAX, so the five plaques stop being one plate in five
colours.
"""

import os
import shutil
import sys

import numpy as np
from PIL import Image

APP = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SPR = os.path.join(APP, "static", "assets", "sprites")
BACK = os.path.join(APP, "design", "_flat_backup")

INK = np.array((30, 27, 26), float)

TIERS = ["big", "superwin", "mega", "epic", "max"]
TARGETS = [(f"sushiWinBanners/{t}.png", i) for i, t in enumerate(TIERS)] + [
    ("sushiScene/fs_plate.png", None),
    ("sushiScene/shutter.png", None),
    ("sushiUi/buybonus_plate.png", "card"),
    # full-screen backdrops: mottle only (no per-pixel fibre, which would make
    # a 1920x1080 PNG several MB), quantised so it still compresses
    ("sushiBackground/bg_base.png", "bg"),
    ("sushiBackground/bg_feature.png", "bg"),
]


def halftone(h, w, pitch, cov, angle=45):
    yy, xx = np.mgrid[0:h, 0:w].astype(float)
    a = np.deg2rad(angle)
    u = (xx * np.cos(a) + yy * np.sin(a)) / pitch
    v = (-xx * np.sin(a) + yy * np.cos(a)) / pitch
    d = np.hypot(u - np.round(u), v - np.round(v))
    return d < np.sqrt(np.clip(cov, 0, 1) / np.pi)


def finish(rel, tier, rng):
    src = os.path.join(BACK, rel)
    dst = os.path.join(SPR, rel)
    if not os.path.exists(src):
        os.makedirs(os.path.dirname(src), exist_ok=True)
        shutil.copy2(dst, src)
    im = np.asarray(Image.open(src).convert("RGBA"), float)
    h, w = im.shape[:2]
    rgb, a = im[..., :3], im[..., 3]
    solid = a > 8

    # which pixels are ink (keep crisp) and how light each one is
    lum = rgb @ np.array([0.299, 0.587, 0.114])
    ink = np.linalg.norm(rgb - INK, axis=-1) < 40
    paper = lum > 200
    # the plate's own paper exactly (the amount well is a darker cream and
    # keeps clear, so the number on it stays readable)
    rim = np.linalg.norm(rgb - np.array((242, 232, 208)), axis=-1) < 6

    out = rgb.copy()

    # 1. tooth: low-frequency mottle + fibre, stronger on paper than on ink
    lo = rng.normal(0, 1, (h // 24 + 2, w // 24 + 2))
    lo = np.asarray(Image.fromarray(((lo + 3) * 40).clip(0, 255).astype("uint8")).resize((w, h), Image.BICUBIC), float)
    lo = (lo - lo.mean()) / (lo.std() + 1e-6)
    hi = rng.normal(0, 1, (h, w))
    tooth = lo * 4.5 + hi * 3.5
    if tier == "bg":
        tooth = np.round(lo * 1.6) * 2.5
    out += (tooth * np.where(ink, 0.3, 1.0))[..., None]

    # 2. halftone shading toward the foot of every shape (not on ink lines)
    ys = np.nonzero(solid.any(axis=1))[0]
    y0, y1 = (ys[0], ys[-1]) if len(ys) else (0, h - 1)
    t = np.clip((np.arange(h)[:, None] - y0) / max(1, y1 - y0), 0, 1) * np.ones((1, w))
    cov = np.clip((t - 0.45) / 0.55, 0, 1) ** 1.4 * 0.38
    dots = halftone(h, w, max(5.0, w / 150), cov) & solid & ~ink
    if tier != "bg":
        out[dots] = out[dots] * 0.8

    # backdrops are KNOCKED BACK toward the paper instead: 25% everywhere,
    # easing up to 45% across the right third where the cast stands. On the
    # full-strength backdrop the Bandit's red and green were the sun's and the
    # warehouse's own inks and he disappeared into them; halftone dots made it
    # worse, and a pale panel behind him read as a white slab (user,
    # 2026-10-04). A gradient has no edge to see.
    if tier == "bg":
        xg = np.linspace(0, 1, w)[None, :, None]
        kb = 0.25 + 0.20 * np.clip((xg - 0.55) / 0.3, 0, 1) ** 1.5
        out = out * (1 - kb) + np.array((242, 232, 208), float) * kb

    # 3. the tier sunburst: halftone rays fanning from above the plate, in the
    #    paper only, denser each tier
    if isinstance(tier, int):
        cx, cy = w / 2, h * 0.32
        yy, xx = np.mgrid[0:h, 0:w].astype(float)
        ang = np.arctan2(yy - cy, xx - cx)
        rays = 10 + 2 * tier
        stripe = (np.sin(ang * rays) > 0.15)
        dist = np.hypot((xx - cx) / w, (yy - cy) / h)
        rc = np.clip(0.10 + 0.07 * tier - dist * 0.25, 0, 0.5)
        rdots = halftone(h, w, max(5.0, w / 170), rc, angle=15) & stripe & rim & solid
        tint = np.array((210, 74, 44), float) if tier % 2 == 0 else np.array((31, 92, 74), float)
        out[rdots] = out[rdots] * 0.35 + tint * 0.65

    # 4. pinholes: a solid colour that did not quite cover — sparse paper specks
    colour = solid & ~ink & ~paper
    pin = (rng.random((h, w)) < (0.0 if tier == "bg" else 0.004)) & colour
    pin = np.asarray(Image.fromarray((pin * 255).astype("uint8")).resize((w, h)).convert("L"), float) > 0
    out[pin] = out[pin] * 0.4 + np.array((242, 232, 208)) * 0.6

    res = np.dstack([out.clip(0, 255), a]).astype("uint8")

    # "card": printed like every other card in the game — an ink edge and the
    # red plate printed low and right. The sack was paper on a paper-and-green
    # backdrop and melted into it (2026-10-04).
    if tier == "card":
        from PIL import ImageFilter
        body = Image.fromarray(res)
        m = body.split()[3].point(lambda v: 255 if v > 100 else 0)
        edge = m.filter(ImageFilter.MaxFilter(9))
        canvas = Image.new("RGBA", body.size, (0, 0, 0, 0))
        red = Image.new("RGBA", body.size, (210, 74, 44, 255))
        canvas.paste(red, (7, 7), edge)
        canvas.paste(Image.new("RGBA", body.size, (30, 27, 26, 255)), (0, 0), edge)
        canvas.alpha_composite(body)
        res = np.asarray(canvas)
    Image.fromarray(res).save(dst, optimize=True)
    n = len(np.unique(res[solid][:, :3], axis=0))
    print(f"{rel:40s} colours {n:6d}  {os.path.getsize(dst) // 1024} KB")


def main():
    if "--restore" in sys.argv:
        for rel, _ in TARGETS:
            src = os.path.join(BACK, rel)
            if os.path.exists(src):
                shutil.copy2(src, os.path.join(SPR, rel))
                print("restored", rel)
        return
    rng = np.random.default_rng(20261004)
    for rel, tier in TARGETS:
        finish(rel, tier, rng)


if __name__ == "__main__":
    main()
