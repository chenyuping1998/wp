"""Pickle Panic bar icons, re-inked to match the condiment royals.

    /Applications/anaconda3/bin/python3 design/build_relish_icons.py

The v2 icons (design/_backup_icons_v2_1107/) were flat dark glyphs — the
generic icon-font look. Every other picture in the game is comic ink: the
royals are letters piped in ketchup / mustard / relish with a heavy ink line,
cream gloss and a darker shade underneath. This keeps each v2 glyph's SHAPE
and re-draws it in that language:

    ink outline  (rough, ~7% of the glyph)
    relish fill  (lighter at the top, darker at the foot)
    shade        (inside the lower-right edge)
    gloss        (cream streak inside the upper-left edge, broken up)
    print shadow (ink offset down-right, like the poster's misregistration)

Output 256x256 into static/assets/pickle/icon_*_v2.png (same names, so no
code change; UiButton sizes icons by width, so the higher resolution is free).
"""

from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

APP = Path(__file__).resolve().parents[1]
SRC = APP / "design" / "_backup_icons_v2_1107"
OUT = APP / "static" / "assets" / "pickle"

S = 512          # work size
OUT_SIZE = 256
FIT = 0.80       # glyph shrinks so outline + shadow stay inside the canvas

INK = np.array([30, 27, 26], float)
CREAM = np.array([250, 240, 205], float)
TOP = np.array([150, 190, 62], float)     # relish, lit
FOOT = np.array([82, 128, 38], float)     # relish, foot
SHADE = np.array([46, 82, 30], float)

rng = np.random.default_rng(1107)


def blur(a, r):
    return np.asarray(Image.fromarray((a * 255).clip(0, 255).astype("uint8")).filter(ImageFilter.GaussianBlur(r)), float) / 255


def grow(a, r):
    """Soft dilate (r>0) / erode (r<0) of a 0..1 mask."""
    k = int(abs(r)) * 2 + 1
    img = Image.fromarray((a * 255).astype("uint8"))
    img = img.filter(ImageFilter.MaxFilter(k) if r > 0 else ImageFilter.MinFilter(k))
    return np.asarray(img, float) / 255


def shift(a, dx, dy):
    out = np.zeros_like(a)
    h, w = a.shape
    xs, xd = (slice(0, w - dx), slice(dx, w)) if dx >= 0 else (slice(-dx, w), slice(0, w + dx))
    ys, yd = (slice(0, h - dy), slice(dy, h)) if dy >= 0 else (slice(-dy, h), slice(0, h + dy))
    out[yd, xd] = a[ys, xs]
    return out


def wobble(shape, scale, amp):
    lo = rng.normal(0, 1, (shape[0] // scale + 2, shape[1] // scale + 2))
    lo = np.asarray(Image.fromarray(((lo + 3) * 40).clip(0, 255).astype("uint8")).resize(shape[::-1], Image.BICUBIC), float)
    return (lo / 255 - 0.47) * amp


def glyph_mask(path):
    im = Image.open(path).convert("RGBA")
    a = im.getchannel("A")
    bbox = a.getbbox()
    a = a.crop(bbox)
    w, h = a.size
    k = S * FIT / max(w, h)
    a = a.resize((max(1, round(w * k)), max(1, round(h * k))), Image.LANCZOS)
    canvas = Image.new("L", (S, S))
    # optical centre slightly up-left: the print shadow adds weight down-right
    canvas.paste(a, ((S - a.width) // 2 - 6, (S - a.height) // 2 - 6))
    m = np.asarray(canvas, float) / 255
    # smooth the 128px source's stair-steps, then re-threshold to a crisp edge
    m = blur(m, 3.0)
    return np.clip((m - 0.5) * 6 + 0.5, 0, 1)


def build(name):
    m = glyph_mask(SRC / f"{name}.png")
    yy = np.linspace(0, 1, S)[:, None] * np.ones((1, S))

    # rough ink line: dilate, then wobble the threshold so the edge breathes
    ink_r = 10
    ink = blur(grow(m, ink_r), 2.0)
    ink = np.clip((ink + wobble(m.shape, 24, 0.35) - 0.45) * 5, 0, 1)
    ink = np.maximum(ink, m)

    shadow = shift(ink, 12, 14) * 0.85

    fill = TOP[None, None] * (1 - yy[..., None]) + FOOT[None, None] * yy[..., None]
    rgb = fill.copy()

    # shade: inside the glyph where the mask moved up-left no longer covers
    inner = grow(m, -3)
    shade = np.clip(inner - shift(inner, -10, -12), 0, 1)
    shade = blur(shade, 2.5) * inner
    rgb = rgb * (1 - shade[..., None] * 0.85) + SHADE[None, None] * shade[..., None] * 0.85

    # gloss: inside the upper-left edge, broken into streaks
    gl = np.clip(inner - shift(inner, 9, 10), 0, 1)
    gl = grow(gl, -1)
    breaks = (wobble(m.shape, 44, 1.0) > -0.12).astype(float)
    gl = blur(gl * breaks, 1.4) * grow(m, -6)
    gl = np.clip(gl * 1.6, 0, 1)
    rgb = rgb * (1 - gl[..., None] * 0.9) + CREAM[None, None] * gl[..., None] * 0.9

    # compose: shadow (ink) < ink line < glyph
    out = np.zeros((S, S, 4), float)
    a_sh = shadow
    out[..., :3] = INK
    out[..., 3] = a_sh
    a_ink = ink
    out[..., :3] = INK
    out[..., 3] = np.maximum(a_sh, a_ink)
    body = m[..., None]
    out[..., :3] = out[..., :3] * (1 - body) + rgb * body
    out[..., 3] = np.maximum(out[..., 3], m) * 255

    img = Image.fromarray(out.clip(0, 255).astype("uint8"), "RGBA").resize((OUT_SIZE, OUT_SIZE), Image.LANCZOS)
    img.save(OUT / f"{name}.png", optimize=True)
    return img


if __name__ == "__main__":
    names = sorted(p.stem for p in SRC.glob("icon_*_v2.png"))
    sheet = Image.new("RGBA", (OUT_SIZE * len(names), OUT_SIZE * 2), (0, 0, 0, 0))
    for i, n in enumerate(names):
        im = build(n)
        bg1 = Image.new("RGBA", (OUT_SIZE, OUT_SIZE), (245, 230, 190, 255))
        bg2 = Image.new("RGBA", (OUT_SIZE, OUT_SIZE), (74, 72, 70, 255))
        bg1.alpha_composite(im)
        bg2.alpha_composite(im)
        sheet.paste(bg1, (i * OUT_SIZE, 0))
        sheet.paste(bg2, (i * OUT_SIZE, OUT_SIZE))
        print("wrote", n)
    (APP / "design" / "qa").mkdir(exist_ok=True)
    sheet.save(APP / "design" / "qa" / "relish_icons_sheet.png")
