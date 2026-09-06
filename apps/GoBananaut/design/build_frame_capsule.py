"""Rebuild the reel housing as an airlock hatch, from cut parts.

WHY PARTS AND NOT ONE PAINTING
------------------------------
Two whole-frame generations came back with the same geometry: an opening about
38% x 70% of the canvas at aspect 0.54. The housing needs 77% x 94.4% at aspect
0.833 - the board is 5 reels of 6 rows behind a thin lip, which is a proportion
no image model volunteers, because it averages towards a picture frame. Asking a
third time would have been asking the same question again.

So the model was asked for the thing it IS good at - one hatch, drawn well - and
the geometry is done here, where it is arithmetic instead of luck. The art that
arrived (design/source/_hatch.png) has the right vocabulary: dark gunmetal,
brass locking dogs down one side, a grab handle down the other, a brass sealing
ring, rivets, hazard chevrons. All of that is reused verbatim; only its LAYOUT is
rebuilt.

The rails are 9-sliced: rounded end caps, a tiling middle, and the hardware
(dogs, handle) pasted as patches. Nothing is stretched across an axis it was not
drawn for, so no rivet turns into an oval.

ONE SCALE PER RAIL
------------------
Every part of the left border is scaled by the same 168/253, so bevel, plate,
rivets and dogs stay in proportion with each other. The sealing ring is the one
exception: it is held at a constant 26px on all four sides. The top and bottom
borders are only 40px tall (FRAME_SCALE.y is 1.06 - the housing is a lip there,
not a frame), so a ring at the rail's own scale would not fit, and a ring that
changes thickness at the corners reads as a mistake in a way that a ring thinner
than its source does not.

Usage:  python design/build_frame_capsule.py [--apply]
"""

import os
import sys

from PIL import Image, ImageChops, ImageDraw, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
APP = os.path.dirname(HERE)
SRC = os.path.join(HERE, "source", "_hatch.png")
OUT_DIR = os.path.join(APP, "static/assets/sprites/goBananasFrame")
PREVIEW = os.path.join(HERE, "source", "_frame_build.png")

# Target geometry. Matches FRAME_SCALE in src/game/constants.ts and the board the
# reels occupy; if one moves the other must.
BOARD_W, BOARD_H = 1120, 1344
BORDER_X, BORDER_Y = 168, 40
FRAME_W, FRAME_H = BOARD_W + BORDER_X * 2, BOARD_H + BORDER_Y * 2
RING = 26  # sealing-ring thickness, the same on all four sides
OUTER_R = 30  # outer corner radius
INNER_R = 26  # opening corner radius

# Source zones, measured off _hatch.png (1024x1024).
BEVEL_L = (64, 96)
PLATE_L = (96, 205)
RIVET_L = (205, 262)
RING_L = (262, 317)
RIVET_R = (752, 812)
PLATE_R = (812, 972)
BEVEL_R = (950, 972)
BODY_Y = (68, 956)
DOGS_Y = ((200, 345), (440, 585), (683, 828))  # each dog plus its lower tab

# left border, outer to inner: bevel | dog plate | rivet strip | ring
W_BEVEL, W_PLATE, W_RIVET = 21, 83, 38
assert W_BEVEL + W_PLATE + W_RIVET + RING == BORDER_X


def cut(im, xz, y0, y1):
    return im.crop((xz[0], y0, xz[1], y1))


def fit(im, w, h):
    return im.resize((max(1, int(round(w))), max(1, int(round(h)))), Image.LANCZOS)


def feather_paste(dst, patch, x, y, ramp=14):
    """Paste with the top and bottom edges ramped out.

    A patch cut from the plate meets tiled plate above and below it. The two have
    the same mottle statistics but not the same pixels, so a hard edge shows as a
    hairline. A short ramp buries it; the plate has no structure running across
    that seam for the blend to smear.
    """
    a = Image.new("L", patch.size, 255)
    d = ImageDraw.Draw(a)
    for i in range(ramp):
        v = int(255 * i / ramp)
        d.line([(0, i), (patch.size[0], i)], fill=v)
        d.line([(0, patch.size[1] - 1 - i), (patch.size[0], patch.size[1] - 1 - i)], fill=v)
    dst.paste(patch, (int(x), int(y)), a)


def tile_column(dst, tile, x, y0, y1):
    """Fill a vertical span with a tile, alternating flips.

    Flipping every other repeat kills the marching rhythm a plain tile gives on a
    surface this tall - 1424px is twenty-odd repeats, and the eye finds a period
    that long.
    """
    n = max(1, int(round((y1 - y0) / tile.size[1])))
    step = (y1 - y0) / n
    t = fit(tile, tile.size[0], step)
    for i in range(n):
        piece = t if i % 2 == 0 else t.transpose(Image.FLIP_TOP_BOTTOM)
        dst.paste(piece, (int(x), int(round(y0 + i * step))))


def build_left(src):
    by0, by1 = BODY_Y
    rail = Image.new("RGB", (BORDER_X - RING, FRAME_H))
    s = W_PLATE / (PLATE_L[1] - PLATE_L[0])

    # The caps hold the rounded ends the panel outline was drawn with; only the
    # straight middle is repeated.
    mid = fit(cut(src, PLATE_L, 350, 430), W_PLATE, 80 * s)
    tile_column(rail, mid, W_BEVEL, 0, FRAME_H)
    cap_t = fit(cut(src, PLATE_L, by0, 200), W_PLATE, (200 - by0) * s)
    cap_b = fit(cut(src, PLATE_L, 828, by1), W_PLATE, (by1 - 828) * s)
    rail.paste(cap_t, (W_BEVEL, 0))
    rail.paste(cap_b, (W_BEVEL, FRAME_H - cap_b.size[1]))

    for i, (dy0, dy1) in enumerate(DOGS_Y):
        dog = fit(cut(src, PLATE_L, dy0, dy1), W_PLATE, (dy1 - dy0) * s)
        cy = FRAME_H * (0.25 + 0.25 * i)
        feather_paste(rail, dog, W_BEVEL, cy - dog.size[1] / 2)

    # One repeat cut centred on a rivet, so tiling cannot land a rivet half off
    # the end of the rail.
    sr = W_RIVET / (RIVET_L[1] - RIVET_L[0])
    tile_column(rail, fit(cut(src, RIVET_L, 397, 472), W_RIVET, 75 * sr), W_BEVEL + W_PLATE, 0, FRAME_H)
    tile_column(rail, fit(cut(src, BEVEL_L, 400, 480), W_BEVEL, 80), 0, 0, FRAME_H)
    return rail


def build_right(src):
    by0, by1 = BODY_Y
    rail = Image.new("RGB", (BORDER_X - RING, FRAME_H))
    s = W_PLATE / (PLATE_R[1] - PLATE_R[0])

    # This rail is pasted BESIDE the ring, not under it, so its own origin is
    # already inside the ring: rivets first, then plate, then the outer bevel.
    tile_column(rail, fit(cut(src, PLATE_R, 200, 330), W_PLATE, 130 * s), W_RIVET, 0, FRAME_H)
    cap_t = fit(cut(src, PLATE_R, by0, 190), W_PLATE, (190 - by0) * s)
    cap_b = fit(cut(src, PLATE_R, 800, by1), W_PLATE, (by1 - 800) * s)
    rail.paste(cap_t, (W_RIVET, 0))
    rail.paste(cap_b, (W_RIVET, FRAME_H - cap_b.size[1]))

    handle = fit(cut(src, PLATE_R, 350, 690), W_PLATE, 340 * s)
    feather_paste(rail, handle, W_RIVET, FRAME_H / 2 - handle.size[1] / 2, ramp=20)

    sr = W_RIVET / (RIVET_R[1] - RIVET_R[0])
    tile_column(rail, fit(cut(src, RIVET_R, 397, 472), W_RIVET, 75 * sr), 0, 0, FRAME_H)
    tile_column(rail, fit(cut(src, BEVEL_R, 400, 480), W_BEVEL, 80), W_RIVET + W_PLATE, 0, FRAME_H)
    return rail


def build_lip(src):
    """The top and bottom borders.

    Only 14px of these survive outside the ring, so the plate there is a sliver
    of gunmetal carrying hazard chevrons. The chevrons are drawn rather than cut:
    at 14px the source stripes would need a horizontal tile period found to the
    pixel, and a stripe that mis-tiles is more visible than one that is not the
    original stripe.
    """
    h = BORDER_Y - RING
    lip = src.crop((350, 120, 700, 140)).resize((FRAME_W, h), Image.LANCZOS)
    d = ImageDraw.Draw(lip, "RGBA")
    for i in range(-2, FRAME_W // 34 + 2):
        x = i * 34
        d.polygon([(x, h), (x + 17, h), (x + 17 + h, 0), (x + h, 0)], fill=(196, 160, 58, 205))
    return lip


def build_ring(src):
    """The brass sealing ring: RING nested rounded-rect outlines, shaded as a tube.

    The first version resampled the source ring's own cross-section, and it came
    out a black band. That ring is 55px of mostly soot with one narrow specular,
    and squeezing it into 26 keeps the soot and loses the specular - the thing
    that made it read as brass at all. So the SECTION is drawn here, from the
    source's own brass values, and only the palette is inherited.

    Nesting is what makes the corners work: a cut ring would have to be mitred,
    and brass does not survive a mitre that does not line its grooves up.
    """
    # the metal, taken off the ring's lit pixels rather than guessed
    ys = range(180, 820, 3)
    lit = sorted(
        (src.getpixel((x, y)) for x in range(*RING_L) for y in ys),
        key=lambda c: sum(c),
    )
    bright = lit[int(len(lit) * 0.985)]
    mid = lit[int(len(lit) * 0.75)]
    dark = tuple(int(c * 0.28) for c in mid)
    spec = tuple(min(255, int(c * 1.22)) for c in bright)

    def lerp(a, b, t):
        t = max(0.0, min(1.0, t))
        return tuple(int(x + (y - x) * t) for x, y in zip(a, b))

    prof = []
    for i in range(RING):
        t = i / (RING - 1)
        # the barrel of the tube, fullest in the middle and rolling off to the
        # two edges where it meets plate and glass
        c = lerp(dark, mid, 1.0 - abs(t - 0.46) * 1.9)
        # the highlight sits high on the section, not on its centreline: the
        # housing is lit from above, so the top of the roll catches it
        c = lerp(c, spec, 0.9 * pow(2.718, -(((t - 0.28) / 0.17) ** 2)))
        # and a machined groove below it, which is what tells the eye this is a
        # seal and not a plain bead
        c = tuple(int(v * (1 - 0.6 * pow(2.718, -(((t - 0.76) / 0.07) ** 2)))) for v in c)
        if t < 0.05 or t > 0.97:
            c = dark
        prof.append(c)

    ring = Image.new("RGBA", (FRAME_W, FRAME_H), (0, 0, 0, 0))
    rd = ImageDraw.Draw(ring)
    for i, c in enumerate(prof):
        x0, y0 = BORDER_X - RING + i, BORDER_Y - RING + i
        rd.rounded_rectangle(
            [x0, y0, FRAME_W - 1 - x0, FRAME_H - 1 - y0],
            radius=max(2, INNER_R + (RING - i)),
            outline=c + (255,),
            width=2,
        )

    # One soft directional pass, so the ring is lit from the upper left like the
    # rest of the housing instead of being uniformly bright all the way round.
    # 205..255: the darkest corner loses a fifth of its value and the brightest
    # loses nothing. A wider swing turned the whole ring back to soot.
    lm = Image.linear_gradient("L").rotate(-45, expand=True)
    lm = lm.resize((FRAME_W, FRAME_H), Image.BILINEAR).point(lambda v: 205 + (v * 50) // 255)
    r, g, b, al = ring.split()
    out = Image.merge("RGB", tuple(ImageChops.multiply(ch, lm) for ch in (r, g, b)))
    out.putalpha(al)
    return out


def main(apply_it):
    src = Image.open(SRC).convert("RGB")

    frame = Image.new("RGBA", (FRAME_W, FRAME_H), (0, 0, 0, 0))
    frame.paste(build_left(src), (0, 0))
    frame.paste(build_right(src), (FRAME_W - (BORDER_X - RING), 0))
    lip = build_lip(src)
    frame.paste(lip, (0, 0))
    frame.paste(lip.transpose(Image.FLIP_TOP_BOTTOM), (0, FRAME_H - lip.size[1]))
    frame.alpha_composite(build_ring(src))

    # Cut the opening and round the outside.
    mask = Image.new("L", (FRAME_W, FRAME_H), 0)
    md = ImageDraw.Draw(mask)
    md.rounded_rectangle([0, 0, FRAME_W - 1, FRAME_H - 1], radius=OUTER_R, fill=255)
    md.rounded_rectangle(
        [BORDER_X, BORDER_Y, FRAME_W - 1 - BORDER_X, FRAME_H - 1 - BORDER_Y],
        radius=INNER_R,
        fill=0,
    )
    frame.putalpha(mask)

    # A contact shadow just inside the opening, so the board sits UNDER the hatch
    # rather than beside it.
    shade = Image.new("RGBA", (FRAME_W, FRAME_H), (0, 0, 0, 0))
    ImageDraw.Draw(shade).rounded_rectangle(
        [BORDER_X - 2, BORDER_Y - 2, FRAME_W - 1 - BORDER_X + 2, FRAME_H - 1 - BORDER_Y + 2],
        radius=INNER_R,
        outline=(0, 0, 0, 150),
        width=14,
    )
    shade = shade.filter(ImageFilter.GaussianBlur(7))
    shade.putalpha(ImageChops.multiply(shade.getchannel("A"), mask))
    frame.alpha_composite(shade)

    # An outer rim, for the same reason as the inner one but the opposite way
    # round. The background plate is itself a riveted bulkhead in the same
    # gunmetal, so at the housing's outside edge two pieces of grey metal meet
    # with nothing between them and the housing stops reading as an object. A
    # darkened lip and a hairline give it an edge to end on. It is drawn INSIDE
    # the sprite rather than as a drop shadow because the sprite is exactly the
    # size the layout aligns to, and growing it would move the board.
    rim = Image.new("RGBA", (FRAME_W, FRAME_H), (0, 0, 0, 0))
    rd = ImageDraw.Draw(rim)
    for i in range(12):
        rd.rounded_rectangle(
            [i, i, FRAME_W - 1 - i, FRAME_H - 1 - i],
            radius=max(2, OUTER_R - i),
            outline=(0, 0, 0, int(150 * (1 - i / 12) ** 1.4)),
            width=2,
        )
    rd.rounded_rectangle(
        [0, 0, FRAME_W - 1, FRAME_H - 1], radius=OUTER_R, outline=(0, 0, 0, 210), width=3
    )
    rim.putalpha(ImageChops.multiply(rim.getchannel("A"), mask))
    frame.alpha_composite(rim)

    # The plate behind the reels came over from the jungle build and is still
    # tinted olive - (14, 19, 6). It is nearly black so the hue is easy to miss,
    # but every symbol is keyed against it and green is the one direction this
    # theme never goes. Retinted through luminance, so the painted mottle and
    # vignette survive and only the hue moves.
    #
    # This rewrites the file in place, so it has to be idempotent: a second
    # --apply must not tint an already-tinted plate a second time and walk the
    # hue further each run. The green channel still leading the blue one is what
    # says the olive is still there.
    bg_path = os.path.join(OUT_DIR, "frame_bg.png")
    bg = Image.open(bg_path)
    r0, g0, b0 = bg.convert("RGB").resize((1, 1), Image.BOX).getpixel((0, 0))
    if g0 <= b0:
        print("frame_bg already retinted, left alone")
        tint = bg
    else:
        lum = bg.convert("L")
        tint = Image.merge(
            "RGB",
            (
                lum.point(lambda v: int(v * 0.78)),
                lum.point(lambda v: int(v * 0.94)),
                lum.point(lambda v: min(255, int(v * 1.30))),
            ),
        )
        tint.putalpha(bg.getchannel("A") if bg.mode == "RGBA" else Image.new("L", bg.size, 255))

    frame.save(PREVIEW)
    print(f"preview -> {PREVIEW}  {frame.size}")
    if apply_it:
        frame.save(os.path.join(OUT_DIR, "frame_edge.png"))
        tint.save(bg_path)
        print("applied -> frame_edge.png, frame_bg.png")


if __name__ == "__main__":
    main("--apply" in sys.argv)
