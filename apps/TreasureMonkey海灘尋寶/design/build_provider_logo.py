#!/usr/bin/env python3
"""Silverstars provider logo — transparent, high resolution, legible small.

    /Applications/anaconda3/envs/math-sdk/bin/python design/build_provider_logo.py

Stake requires three assets for the store tile
(`docs/approval-guidelines/game-tile-requirements`): a background, a foreground,
and a **Provider Logo** — "High resolution PNG with a transparent background",
"Should be clear and legible at small sizes". We had no provider logo at all.

What existed was `wp/apps/WildParty/static/silverstar.png`: 502x561, and an
*illustration* rather than a mark — the star sits in a painted night-time casino
with a starfield, golden light rays, a slot-machine reel and a pair of cherries,
all on an opaque background. Three separate reasons it cannot be submitted:

  * the background is opaque, and it is photographic, so it cannot be keyed out
  * 502px is not "high resolution" for an asset Stake composites
  * at the size a provider logo is actually shown, the rays, the studs, the
    cherries and the reel stop being objects and become noise around the star

So this is drawn rather than cut out. It keeps what identifies the studio — the
five-point chrome star, the diamond studs set into its band, the red 777 — and
drops what only works at poster size. That is the normal difference between an
illustration and a mark, not a reduction in ambition.

Everything is vector-drawn at 4x and downsampled, so it can be reissued at any
size, and there is no third-party artwork or font baked into it.

Wordmark
--------

The "SILVER STARS" lockup is set in Cinzel, which is the face the studio already
uses (`wp/apps/WildParty/static/cinzel.woff2`) and is SIL OFL. PIL cannot read
woff2 without a brotli decoder, so the wordmark is drawn only when a readable
Cinzel is present at design/source/Cinzel.ttf; otherwise the script emits the
mark on its own and says so. The mark alone is a valid provider logo — it is the
half that survives being shown at 64px — but the lockup is preferred where there
is room.
"""

from __future__ import annotations

import math
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

DESIGN = Path(__file__).resolve().parent
APP = DESIGN.parent
OUT_DIR = DESIGN / "_brand"
OUT_DIR.mkdir(parents=True, exist_ok=True)
TITAN = APP / "static" / "fonts" / "TitanOne.ttf"
CINZEL = DESIGN / "source" / "Cinzel.ttf"

SS = 4
CANVAS = 1024  # final mark size; the lockup is taller

# Chrome ramp, top to bottom. Five stops rather than two: a two-stop gradient is
# a plastic bevel, and the thing that makes metal read as metal is the dark band
# between two lights, which needs at least three.
CHROME = [
    (0.00, (250, 252, 255)),
    (0.30, (176, 187, 203)),
    (0.50, (255, 255, 255)),
    (0.72, (124, 136, 156)),
    (1.00, (226, 234, 244)),
]
STEEL = (46, 54, 70)      # the band's own edge
GEM = (247, 251, 255)
GEM_SHADE = (168, 196, 226)
RED = (196, 26, 40)
RED_LIGHT = (232, 74, 78)
GOLD = (232, 186, 92)
GOLD_LIGHT = (255, 232, 160)
INK = (26, 22, 38)


def ramp(t: float) -> tuple[int, int, int]:
    for (t0, c0), (t1, c1) in zip(CHROME, CHROME[1:]):
        if t <= t1:
            f = 0.0 if t1 == t0 else (t - t0) / (t1 - t0)
            return tuple(int(a + (b - a) * f) for a, b in zip(c0, c1))
    return CHROME[-1][1]


def star_points(cx: float, cy: float, r: float, rotation: float = -math.pi / 2, points: int = 5):
    """Outer vertices of a regular n-point star, first point straight up."""
    return [
        (cx + r * math.cos(rotation + i * 2 * math.pi / points),
         cy + r * math.sin(rotation + i * 2 * math.pi / points))
        for i in range(points)
    ]


def star_polygon(cx: float, cy: float, r_out: float, r_in: float, rotation: float = -math.pi / 2, points: int = 5):
    """The full 10-vertex outline, alternating outer and inner radius."""
    verts = []
    for i in range(points * 2):
        r = r_out if i % 2 == 0 else r_in
        a = rotation + i * math.pi / points
        verts.append((cx + r * math.cos(a), cy + r * math.sin(a)))
    return verts


def vertical_gradient(size: int) -> Image.Image:
    grad = Image.new("RGB", (1, size))
    px = grad.load()
    for y in range(size):
        px[0, y] = ramp(y / (size - 1))
    return grad.resize((size, size), Image.BILINEAR)


def band_mask(size: int, cx, cy, r_out, r_in, thickness: float) -> Image.Image:
    """The star's rim: the star, minus a concentric smaller star."""
    outer = Image.new("L", (size, size), 0)
    ImageDraw.Draw(outer).polygon(star_polygon(cx, cy, r_out, r_in), fill=255)
    inner = Image.new("L", (size, size), 0)
    k = 1 - thickness
    ImageDraw.Draw(inner).polygon(star_polygon(cx, cy, r_out * k, r_in * k), fill=255)
    from PIL import ImageChops

    return ImageChops.subtract(outer, inner)


def build_mark(size: int = CANVAS) -> Image.Image:
    s = size * SS
    cx = cy = s / 2
    r_out = s * 0.475
    r_in = r_out * 0.500
    thickness = 0.255

    img = Image.new("RGBA", (s, s), (0, 0, 0, 0))

    # A dark inner disc behind the 777, so the numerals read on a light page as
    # well as a dark one. Kept inside the star's inner radius so it never shows
    # outside the silhouette.
    core = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    ImageDraw.Draw(core).polygon(
        star_polygon(cx, cy, r_out * (1 - thickness), r_in * (1 - thickness)),
        fill=(22, 18, 34, 236),
    )
    img = Image.alpha_composite(img, core)

    # The chrome band.
    mask = band_mask(s, cx, cy, r_out, r_in, thickness)
    chrome = vertical_gradient(s).convert("RGBA")
    chrome.putalpha(mask)
    img = Image.alpha_composite(img, chrome)

    # Edge lines on both sides of the band. Drawn as outlines of the two star
    # polygons rather than as a stroke on the mask, so the corners stay sharp.
    edges = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    ed = ImageDraw.Draw(edges)
    lw = max(2, int(s * 0.0045))
    ed.line(star_polygon(cx, cy, r_out, r_in) + [star_polygon(cx, cy, r_out, r_in)[0]],
            fill=STEEL + (255,), width=lw, joint="curve")
    k = 1 - thickness
    ed.line(star_polygon(cx, cy, r_out * k, r_in * k) + [star_polygon(cx, cy, r_out * k, r_in * k)[0]],
            fill=STEEL + (230,), width=lw, joint="curve")
    img = Image.alpha_composite(img, edges)

    # Diamond studs, walked along the centre line of the band. Spaced by arc
    # length rather than by vertex, so the runs up a long edge and around a point
    # are studded at the same density.
    mid = star_polygon(cx, cy, r_out * (1 - thickness / 2), r_in * (1 - thickness / 2))
    path = mid + [mid[0]]
    seg_len = [math.dist(path[i], path[i + 1]) for i in range(len(path) - 1)]
    total = sum(seg_len)
    step = total / 46
    gems = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    gd = ImageDraw.Draw(gems)
    rr = s * 0.0125
    walked = 0.0
    i = 0
    acc = 0.0
    while walked < total and i < len(seg_len):
        while i < len(seg_len) and walked > acc + seg_len[i]:
            acc += seg_len[i]
            i += 1
        if i >= len(seg_len):
            break
        f = (walked - acc) / seg_len[i]
        x = path[i][0] + (path[i + 1][0] - path[i][0]) * f
        y = path[i][1] + (path[i + 1][1] - path[i][1]) * f
        gd.ellipse([x - rr, y - rr, x + rr, y + rr], fill=GEM_SHADE + (255,))
        gd.ellipse([x - rr * 0.66, y - rr * 0.72, x + rr * 0.66, y + rr * 0.5], fill=GEM + (255,))
        walked += step
    img = Image.alpha_composite(img, gems)

    # 777 — three numerals, gold-edged, on the dark core.
    #
    # Drawn one glyph at a time with tracking added, not as the string "777".
    # Set solid, the three sevens touch: Titan One's terminals are rounded and
    # heavy, and once each numeral is fattened further by an ink stroke and a
    # gold stroke they merge into one red mass that reads as "m" by 96px. The
    # legibility sheet is what showed this — at 1024 the string version looks
    # perfectly fine. Tracking them apart is what buys back the two small sizes.
    font = ImageFont.truetype(str(TITAN), int(s * 0.150))
    d = ImageDraw.Draw(img)
    track = s * 0.022
    glyphs = "777"
    widths = [d.textlength(g, font=font) for g in glyphs]
    total_w = sum(widths) + track * (len(glyphs) - 1)
    probe = d.textbbox((0, 0), glyphs, font=font)
    ty = cy - (probe[3] - probe[1]) / 2 - probe[1] + s * 0.010

    def run(dx, dy, width, fill):
        x = cx - total_w / 2 + dx
        for g, gw in zip(glyphs, widths):
            d.text((x, ty + dy), g, font=font, fill=fill + (255,),
                   stroke_width=int(width), stroke_fill=fill + (255,))
            x += gw + track

    run(0, 0, s * 0.012, INK)
    run(0, 0, s * 0.007, GOLD)
    run(0, 0, s * 0.003, RED)
    run(-s * 0.003, -s * 0.003, 0, RED_LIGHT)

    return img.resize((size, size), Image.LANCZOS)


def build_lockup(mark: Image.Image) -> Image.Image | None:
    """Mark over the SILVER STARS wordmark. Needs a readable Cinzel."""
    if not CINZEL.exists():
        return None
    w = mark.width
    out = Image.new("RGBA", (w, int(w * 1.30)), (0, 0, 0, 0))
    out.paste(mark, (0, 0), mark)
    d = ImageDraw.Draw(out)
    # The two lines sit below the star and tuck slightly under its lower points,
    # the way the studio's own artwork locks them up, rather than floating in a
    # separate block.
    for line, yf, sf in (("SILVER", 0.985, 0.168), ("STARS", 1.155, 0.168)):
        font = ImageFont.truetype(str(CINZEL), int(w * sf))
        # Cinzel ships variable on a 400..900 weight axis; without this it renders
        # at 400, which is a text weight and disappears next to the chrome star.
        try:
            font.set_variation_by_axes([700])
        except (AttributeError, OSError):
            pass
        bbox = d.textbbox((0, 0), line, font=font, stroke_width=int(w * 0.014))
        x = w / 2 - (bbox[2] - bbox[0]) / 2 - bbox[0]
        y = w * yf - (bbox[3] - bbox[1]) / 2 - bbox[1]
        for width, fill in ((w * 0.014, INK), (w * 0.006, GOLD), (0, GOLD_LIGHT)):
            d.text((x, y), line, font=font, fill=fill + (255,),
                   stroke_width=int(width), stroke_fill=fill + (255,))
    return out


def legibility_sheet(img: Image.Image, path: Path):
    """The check the spec actually asks for: does it survive being small?

    Two rows — on Stake's dark chrome and on white — because a transparent logo
    gets composited onto whatever the page is, and a mark that only works on one
    of those is not finished.
    """
    sizes = [256, 128, 96, 64, 48, 32]
    pad = 16
    width = sum(sizes) + pad * (len(sizes) + 1)
    row = max(sizes) + pad * 2
    sheet = Image.new("RGB", (width, row * 2), (26, 28, 34))
    ImageDraw.Draw(sheet).rectangle([0, row, width, row * 2], fill=(255, 255, 255))
    for band in (0, 1):
        x = pad
        for sz in sizes:
            scaled = img.copy()
            scaled.thumbnail((sz, sz), Image.LANCZOS)
            sheet.paste(scaled, (x, band * row + (row - scaled.height) // 2), scaled)
            x += sz + pad
    sheet.save(path)


def main():
    mark = build_mark()
    mark.save(OUT_DIR / "Silverstars-Mark.png")
    print(f"[OK] Silverstars-Mark.png  {mark.size}")

    legibility_sheet(mark, OUT_DIR / "legibility_mark.png")

    lockup = build_lockup(mark)
    if lockup is None:
        print("[--] wordmark skipped: no readable Cinzel at design/source/Cinzel.ttf")
        print("     (the repo ships it as woff2 only, which PIL cannot decode)")
    else:
        lockup.save(OUT_DIR / "Silverstars-Logo.png")
        print(f"[OK] Silverstars-Logo.png  {lockup.size}")
        legibility_sheet(lockup, OUT_DIR / "legibility_lockup.png")
    print(f"     sheets in {OUT_DIR}")


if __name__ == "__main__":
    main()
