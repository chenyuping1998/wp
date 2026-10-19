"""Carved-jade wordmarks for the feature and big-win titles.

The titles used to be one flat line of Cinzel (dark jade, 2px gold stroke) on
transparent - typography, not a title. These are the same letters built up as
an object: a soft gold glow, a printed ink extrusion (down-right, the
misregistration every card in this game has), an ink keyline, a gold rim with
its own gradient, a glazed jade face with a lit top edge and a shaded foot, and
one diagonal sheen. Typeset, never generated: the letterforms stay exact.

Outputs (same canvas sizes as before, so no layout code changes for titles):
  sushiV8/title_free.png, title_total.png      1600x500
  sushiV8/wordmark_{big,superwin,mega,epic,max}.png   1024x300  (Win.svelte)

Run: math-sdk/env/Scripts/python.exe design/build_wordmarks.py
"""

from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageFilter, ImageFont

APP = Path(__file__).resolve().parents[1]
OUT = APP / "static/assets/sprites/sushiV8"
FONT = APP / "static/fonts/sushi/Cinzel.ttf"
INK = (30, 27, 26)
GOLD_TOP = (247, 226, 160)
GOLD_BOTTOM = (176, 125, 52)

# face gradient (top, bottom) per title; the plaques are hue-shifted per tier
# in build_jade_art.py and these follow the same families
FACES = {
    "jade": ((222, 244, 232), (40, 110, 88)),
    "superwin": ((220, 238, 250), (36, 92, 140)),
    "mega": ((255, 222, 210), (150, 44, 38)),
    "epic": ((236, 222, 250), (88, 56, 140)),
    "max": ((255, 246, 205), (196, 138, 40)),
}


def gradient(size, top, bottom, y0, y1):
    w, h = size
    col = Image.new("RGB", (1, h))
    for y in range(h):
        k = min(1.0, max(0.0, (y - y0) / max(1, y1 - y0)))
        col.putpixel((0, y), tuple(round(a + (b - a) * k) for a, b in zip(top, bottom)))
    return col.resize((w, h))


def grow(mask, px):
    return mask.filter(ImageFilter.MaxFilter(px * 2 + 1)) if px > 0 else mask


def shift(mask, dx, dy):
    out = Image.new("L", mask.size)
    out.paste(mask, (dx, dy))
    return out


def layer(canvas, fill, mask):
    if isinstance(fill, tuple):
        fill = Image.new("RGB", canvas.size, fill[:3])
    piece = fill.convert("RGBA")
    piece.putalpha(mask)
    canvas.alpha_composite(piece)


def wordmark(text, size, font_px, face, rim_jade=False):
    w, h = size
    font = ImageFont.truetype(str(FONT), font_px)
    font.set_variation_by_axes([800])
    mask = Image.new("L", size)
    d = ImageDraw.Draw(mask)
    d.text((w // 2, h // 2), text, font=font, anchor="mm", fill=255)
    x0, y0, x1, y1 = mask.getbbox()

    rim = grow(mask, max(3, font_px // 28))
    keyline = grow(rim, max(2, font_px // 45))
    depth = max(5, font_px // 18)

    canvas = Image.new("RGBA", size)
    # 1. glow, wide and soft, so the word lifts off a dark scrim
    glow = grow(keyline, 6).filter(ImageFilter.GaussianBlur(font_px // 7))
    layer(canvas, (240, 200, 120), glow.point(lambda v: v * 0.55))
    # 2. printed extrusion, stepped so it reads as a solid block, not a shadow
    ext = Image.new("L", size)
    for k in range(1, depth + 1):
        ext = ImageChops.lighter(ext, shift(keyline, k, k))
    layer(canvas, INK, ext)
    # 3. ink keyline, 4. gold rim
    layer(canvas, INK, keyline)
    rim_top, rim_bottom = (FACES["jade"] if rim_jade else (GOLD_TOP, GOLD_BOTTOM))
    layer(canvas, gradient(size, rim_top, rim_bottom, y0, y1), rim)
    # 5. glazed face
    top, bottom = FACES[face]
    layer(canvas, gradient(size, top, bottom, y0 + (y1 - y0) * 0.1, y1), mask)
    # 6. lit top edge and shaded foot inside the face
    lit = ImageChops.subtract(mask, shift(mask, 0, max(3, font_px // 30)))
    layer(canvas, (255, 255, 255), lit.point(lambda v: v * 0.7))
    foot = ImageChops.subtract(mask, shift(mask, 0, -max(3, font_px // 26)))
    layer(canvas, INK, foot.point(lambda v: v * 0.35))
    # 7. one diagonal sheen across the face
    sheen = Image.new("L", size)
    sd = ImageDraw.Draw(sheen)
    cx = x0 + (x1 - x0) * 0.32
    band = (y1 - y0) * 0.35
    sd.polygon([(cx - band, y1), (cx, y1), (cx + (y1 - y0) * 0.8, y0), (cx + (y1 - y0) * 0.8 - band, y0)], fill=255)
    sheen = ImageChops.multiply(sheen.filter(ImageFilter.GaussianBlur(4)), mask)
    layer(canvas, (255, 255, 255), sheen.point(lambda v: v * 0.38))
    # 8. two small glints on the rim, top-left and top-right
    gd = ImageDraw.Draw(canvas)
    for gx, gy, r in ((x0 + (x1 - x0) * 0.06, y0 + 4, font_px * 0.11), (x1 - (x1 - x0) * 0.12, y0 + 2, font_px * 0.08)):
        gd.polygon([(gx, gy - r), (gx + r * 0.2, gy - r * 0.2), (gx + r, gy), (gx + r * 0.2, gy + r * 0.2),
                    (gx, gy + r), (gx - r * 0.2, gy + r * 0.2), (gx - r, gy), (gx - r * 0.2, gy - r * 0.2)],
                   fill=(255, 250, 230, 235))
    return canvas


def main():
    wordmark("FREE SPINS", (1600, 500), 124, "jade").save(OUT / "title_free.png", optimize=True)
    wordmark("TOTAL WIN", (1600, 500), 124, "jade").save(OUT / "title_total.png", optimize=True)
    tiers = {"big": ("BIG WIN", "jade"), "superwin": ("SUPER WIN", "superwin"), "mega": ("MEGA WIN", "mega"),
             "epic": ("EPIC WIN", "epic"), "max": ("MAX WIN", "max")}
    for key, (text, face) in tiers.items():
        wordmark(text, (1024, 300), 118, face, rim_jade=face == "max").save(OUT / f"wordmark_{key}.png", optimize=True)
    print("2 titles, 5 tier wordmarks")


if __name__ == "__main__":
    main()
