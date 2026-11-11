"""Rebuild Capo Nostra's five big-win plaques from the game's own painted plate.

Why: capoWinBanners/{big,superwin,mega,epic,max}.png were flat vector art —
three fill colours, hairline frame, hairline rays, a transparent interior — the
only un-painted plaque in a game whose Buy Bonus, spin and ticker plates are
painted brass on oxblood. Stake's "Low quality assets" tag names exactly this
("gradient fills", generic art); Deadwood Express was tagged for its vector
win plaques and passed the fix of reusing its painted Buy Bonus plate.

How:
  plate   capoUiPlates/buybonus_plate.png, 9-sliced to 1000x560 (corners kept
          verbatim, rim sections mirror-tiled from clean stretches, the oxblood
          well resized from a clean crop — the cash-stack ornament is left out
          because the win amount sits in the lower half)
  title   Cinzel Black (the game's TITLE_FONT) filled with the brass material
          from texture_flat_titles.py (spin-plate ring grain over bg grunge),
          bevelled, dark drop shadow — set per tier, centred in the upper half
  tier    escalation stays in code (TIER_FX glow tint/mult in Win.svelte);
          the title grows slightly with the tier

Layout matches the old files so no code moves: 1000x560, title centred around
y≈0.36h, amount drawn by Win.svelte at y = +0.16 bh from centre.

usage: python3 design/build_painted_win_banners.py [--preview OUT.png] [--write]
  --write backs the flat originals up to design/_legacy_assets/flat_win_banners_20261003/
"""

from __future__ import annotations

import argparse
import shutil
import sys
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageFilter, ImageFont, ImageOps

sys.path.insert(0, str(Path(__file__).resolve().parent))
import texture_flat_titles as tft  # noqa: E402

APP = Path(__file__).resolve().parent.parent
SPRITES = APP / "static/assets/sprites"
OUT_DIR = SPRITES / "capoWinBanners"
BACKUP = APP / "design/_legacy_assets/flat_win_banners_20261003"
FONT = APP / "static/fonts/Cinzel.ttf"

W, H = 1000, 560
TIERS = [
    ("big", "BIG WIN", 1.00),
    ("superwin", "SUPER WIN", 1.03),
    ("mega", "MEGA WIN", 1.06),
    ("epic", "EPIC WIN", 1.09),
    ("max", "MAX WIN", 1.12),
]


def mirror_tile_h(strip: Image.Image, length: int) -> Image.Image:
    out = Image.new("RGBA", (length, strip.height))
    x, flip = 0, False
    while x < length:
        out.paste(ImageOps.mirror(strip) if flip else strip, (x, 0))
        x += strip.width
        flip = not flip
    return out


def mirror_tile_v(strip: Image.Image, length: int) -> Image.Image:
    out = Image.new("RGBA", (strip.width, length))
    y, flip = 0, False
    while y < length:
        out.paste(ImageOps.flip(strip) if flip else strip, (0, y))
        y += strip.height
        flip = not flip
    return out


def build_plate() -> Image.Image:
    src = Image.open(SPRITES / "capoUiPlates/buybonus_plate.png").convert("RGBA")
    s = src.width  # 640, square
    c = 96  # corner: rim + rivet + stepped inner corner
    # clean rim stretches (the bottom ornament's hairlines reach x 100..540)
    top = src.crop((c, 0, c + 120, c))
    bot = src.crop((c + 1, s - c, c + 41, s))  # ornament hairlines start at x≈139
    left = src.crop((0, c, c, c + 120))
    right = src.crop((s - c, c, s, c + 120))
    out = Image.new("RGBA", (W, H))
    # oxblood well from a clean interior crop
    well = src.crop((150, 130, 490, 440)).resize((W - 2 * c + 8, H - 2 * c + 8), Image.Resampling.LANCZOS)
    out.paste(well, (c - 4, c - 4))
    out.alpha_composite(mirror_tile_h(top, W - 2 * c), (c, 0))
    out.alpha_composite(mirror_tile_h(bot, W - 2 * c), (c, H - c))
    out.alpha_composite(mirror_tile_v(left, H - 2 * c), (0, c))
    out.alpha_composite(mirror_tile_v(right, H - 2 * c), (W - c, c))
    out.alpha_composite(src.crop((0, 0, c, c)), (0, 0))
    out.alpha_composite(src.crop((s - c, 0, s, c)), (W - c, 0))
    out.alpha_composite(src.crop((0, s - c, c, s)), (0, H - c))
    out.alpha_composite(src.crop((s - c, s - c, s, s)), (W - c, H - c))
    return out


def title_layer(text: str, grow: float, sources) -> Image.Image:
    gold_tile, _well, grunge = sources
    font = ImageFont.truetype(str(FONT), int(118 * grow))
    try:
        font.set_variation_by_axes([900])
    except Exception:
        pass
    mask = Image.new("L", (W, H))
    d = ImageDraw.Draw(mask)
    bbox = d.textbbox((0, 0), text, font=font)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    max_w = W * 0.78
    if tw > max_w:  # SUPER WIN at the larger sizes
        font = ImageFont.truetype(str(FONT), int(118 * grow * max_w / tw))
        try:
            font.set_variation_by_axes([900])
        except Exception:
            pass
        bbox = d.textbbox((0, 0), text, font=font)
        tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    cx, cy = W / 2, H * 0.36
    d.text((cx - tw / 2 - bbox[0], cy - th / 2 - bbox[1]), text, font=font, fill=255)

    g = tft.cover(grunge, (W, H), scale=1.4)
    grain = tft.tile(gold_tile, (W, H), scale=max(1.0, th / 140))
    base = tft.gradient_map(g, [(0, (122, 88, 22)), (0.5, (204, 164, 56)), (1, (250, 220, 128))])
    gold = ImageChops.soft_light(base, grain)
    # vertical light: brighter crown of the letters, deeper feet
    ramp = Image.linear_gradient("L").resize((W, H))
    ramp = ImageOps.invert(ramp).point(lambda v: 150 + v * 105 // 255)
    gold = ImageChops.multiply(gold, Image.merge("RGB", [ramp] * 3))
    shade = tft.bevel(mask, radius=3.2, depth=3, strength=1.9)
    gold = ImageChops.overlay(gold, Image.merge("RGB", [shade] * 3))

    layer = Image.new("RGBA", (W, H))
    # cast shadow + dark keyline so the brass reads on oxblood
    keyline = mask.filter(ImageFilter.MaxFilter(7))
    shadow = ImageChops.offset(keyline, 5, 7).filter(ImageFilter.GaussianBlur(4))
    layer.alpha_composite(Image.merge("RGBA", (*[Image.new("L", (W, H), 10)] * 3, shadow.point(lambda v: v * 200 // 255))))
    layer.alpha_composite(Image.merge("RGBA", (Image.new("L", (W, H), 24), Image.new("L", (W, H), 14), Image.new("L", (W, H), 10), keyline)))
    lit = gold.convert("RGBA")
    lit.putalpha(mask)
    layer.alpha_composite(lit)
    return layer


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--preview")
    ap.add_argument("--write", action="store_true")
    args = ap.parse_args()
    sources = tft.load_sources()
    plate = build_plate()
    done = []
    for name, text, grow in TIERS:
        img = plate.copy()
        img.alpha_composite(title_layer(text, grow, sources))
        done.append(img)
        if args.write:
            rel = f"{name}.png"
            if not (BACKUP / rel).exists():
                BACKUP.mkdir(parents=True, exist_ok=True)
                shutil.copy2(OUT_DIR / rel, BACKUP / rel)
            img.save(OUT_DIR / rel, optimize=True)
        print(("wrote " if args.write else "ok    ") + name)
    if args.preview:
        sheet = Image.new("RGB", (1000, 560 * 5 // 2), (30, 30, 30))
        for i, im in enumerate(done):
            t = im.resize((500, 280), Image.Resampling.LANCZOS)
            sheet.paste(t, ((i % 2) * 500, (i // 2) * 280), t)
        sheet.save(args.preview)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
