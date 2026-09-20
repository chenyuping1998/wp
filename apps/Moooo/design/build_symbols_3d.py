#!/usr/bin/env python3
"""Moooo symbols, rendered rather than drawn.

    python design/build_symbols_3d.py

The reference style is chunky cartoon 3D: thick volumes, graded shading, a wet
highlight, a cool rim light, a contact shadow. `render25d.py` supplies the
lighting; this file supplies the SHAPES. Every symbol is authored as a stack of
flat masks with a colour each, and the same light is applied to all of them —
which is what makes twelve symbols look like one set rather than twelve
drawings.

Light is upper-left throughout. Do not vary it per symbol; a symbol lit from
somewhere else reads as pasted on.
"""

import os
import sys

import numpy as np
from PIL import Image, ImageDraw

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import render25d as r  # noqa: E402

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "..", "static", "assets", "sprites")
SIZE = 512

# ── palette ─────────────────────────────────────────────────────────────────
HIDE = (250, 250, 252)
PATCH = (34, 30, 46)
MUZZLE = (243, 168, 184)
MOUTH = (122, 34, 58)
TONGUE = (232, 122, 146)
HORN = (232, 220, 196)
COLLAR = (118, 66, 42)
# The bell ships WHITE and is tinted per tier at run time. Pixi's tint
# multiplies, so a bell baked in gold can only ever become a darker gold —
# brass and silver are unreachable from it.
BELL_WHITE = (255, 255, 255)


def blank():
    return Image.new("L", (SIZE, SIZE), 0)


def mask(draw_fn):
    img = blank()
    draw_fn(ImageDraw.Draw(img))
    return np.asarray(img, dtype=np.float32) / 255.0


def cow_masks(mouth_open: bool):
    """Every part of the cow, as (mask, colour, fatness) in draw order.

    Proportions are driven by one constraint: the BELL and the OPEN MOUTH must
    never overlap. The bell is composited on top at run time (it is a separate
    tinted sprite), so anything it covers is simply gone — and the first pass put
    it straight over the muzzle, which hid the open mouth completely. The mouth
    opening is the mechanic's tell; a bell that covers it defeats the symbol.

    So the head sits high and a little small, leaving a clear band at the bottom
    for the collar and the bell. The head looks under-sized alone and is right on
    the reel, where the symbol is drawn at 1.08 of the cell and overflows it.
    """
    S = SIZE
    parts = []

    # horns, behind the head
    parts.append((mask(lambda d: (
        d.polygon([(S*0.26, S*0.13), (S*0.35, S*0.03), (S*0.37, S*0.15)], fill=255),
        d.polygon([(S*0.74, S*0.13), (S*0.65, S*0.03), (S*0.63, S*0.15)], fill=255),
    )), HORN, 14))

    # ears, splayed wide
    parts.append((mask(lambda d: (
        d.ellipse([S*0.03, S*0.20, S*0.29, S*0.38], fill=255),
        d.ellipse([S*0.71, S*0.20, S*0.97, S*0.38], fill=255),
    )), HIDE, 20))
    parts.append((mask(lambda d: (
        d.ellipse([S*0.08, S*0.235, S*0.24, S*0.345], fill=255),
        d.ellipse([S*0.76, S*0.235, S*0.92, S*0.345], fill=255),
    )), MUZZLE, 10))

    head = mask(lambda d: d.ellipse([S*0.15, S*0.06, S*0.85, S*0.64], fill=255))
    parts.append((head, HIDE, 74))

    patch = mask(lambda d: (
        d.ellipse([S*0.17, S*0.08, S*0.43, S*0.32], fill=255),
        d.ellipse([S*0.63, S*0.21, S*0.83, S*0.39], fill=255),
    )) * head
    parts.append((patch, PATCH, 26))

    # The jaw drops and the whole lower face changes silhouette — the open state
    # has to be readable as a SHAPE at 130px, not as an expression.
    muzzle_bottom = 0.70 if mouth_open else 0.60
    parts.append((mask(lambda d: d.ellipse(
        [S*0.32, S*0.40, S*0.68, S*muzzle_bottom], fill=255)), MUZZLE, 32))

    if mouth_open:
        parts.append((mask(lambda d: d.ellipse(
            [S*0.38, S*0.48, S*0.62, S*0.685], fill=255)), MOUTH, 24))
        parts.append((mask(lambda d: d.ellipse(
            [S*0.44, S*0.60, S*0.56, S*0.675], fill=255)), TONGUE, 12))
    else:
        parts.append((mask(lambda d: (
            d.ellipse([S*0.41, S*0.455, S*0.465, S*0.495], fill=255),
            d.ellipse([S*0.535, S*0.455, S*0.59, S*0.495], fill=255),
        )), (198, 118, 136), 6))

    # Collar: an ARC that follows the jaw, not a straight bar. Drawn as a
    # rectangle it read as a plank floating in front of the cow — a collar has to
    # wrap something, and a straight horizontal edge cannot. It also has to
    # OVERLAP the head: hung clear of the chin it floated all over again, which
    # is the same mistake with a curve instead of a line.
    parts.append((mask(lambda d: d.arc(
        [S*0.25, S*0.34, S*0.75, S*0.74], start=38, end=142,
        fill=255, width=int(S*0.07))), COLLAR, 18))

    return parts, head


def eyes(mouth_open: bool):
    """Drawn flat on top: eyes are the one part that must NOT be shaded.

    Lighting a pupil puts a gradient across it and the gaze goes dead. The
    reference's animals all have flat black eyes with a hard white catchlight,
    and that is what gives them expression at reel size.
    """
    S = SIZE
    img = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    open_scale = 1.22 if mouth_open else 1.0
    for cx in (0.37, 0.63):
        rx, ry = S * 0.082 * open_scale, S * 0.092 * open_scale
        x, y = S * cx, S * 0.30
        d.ellipse([x - rx, y - ry, x + rx, y + ry], fill=(255, 255, 255, 255))
        d.ellipse([x - rx * 0.62, y - ry * 0.62, x + rx * 0.62, y + ry * 0.62],
                  fill=(26, 22, 34, 255))
        d.ellipse([x - rx * 0.30, y - ry * 0.52, x - rx * 0.02, y - ry * 0.20],
                  fill=(255, 255, 255, 255))
    return np.asarray(img, dtype=np.float32) / 255.0


def render_cow(mouth_open: bool):
    parts, head = cow_masks(mouth_open)
    layers = [r.solid((0, 0, 0), r.contact_shadow(head, drop=18, blur=16, alpha=0.55))]
    for m, color, fat in parts:
        layers.append(r.shade(m, color, fat=fat))
    layers.append(eyes(mouth_open))
    return r.compose(layers)


def render_bell():
    """The bell, hanging from the centre of the collar.

    Sized generously — about a quarter of the symbol's height. That looks too big
    on its own and is correct on the reel: this is the only thing on the board
    that tells the player what the cow is worth, and it has to survive 130px.
    """
    S = SIZE
    body = mask(lambda d: (
        d.pieslice([S*0.355, S*0.700, S*0.645, S*0.960], start=180, end=360, fill=255),
        d.rounded_rectangle([S*0.355, S*0.830, S*0.645, S*0.885], radius=S*0.012, fill=255),
    ))
    # the loop it hangs by, so it reads as attached to the collar above it
    loop = mask(lambda d: d.arc(
        [S*0.465, S*0.665, S*0.535, S*0.735], start=180, end=360, fill=255, width=int(S*0.022)))
    clapper = mask(lambda d: d.ellipse([S*0.472, S*0.880, S*0.528, S*0.930], fill=255))
    return r.compose([
        r.shade(loop, (232, 232, 236), fat=6),
        r.shade(body, BELL_WHITE, fat=30),
        r.shade(clapper, (208, 208, 216), fat=8),
    ])


# ── the rest of the set ─────────────────────────────────────────────────────
#
# Same light, same treatment, different shapes. `matte` is the one deliberate
# exception: the Milk Churn must not glint, because brass/silver/gold at full
# metallic saturation belong to the bell alone and a shiny churn would compete
# with the one thing on the board that carries the tier.

CREAM = (247, 238, 214)
TIMBER = (108, 74, 46)


def ground(parts):
    """A weathered plank under an object, so it sits rather than floats.

    Shared by the two symbols on the same pay tier (Hay Bale and Feed Bucket) —
    it is the only cue a player gets that two different objects are worth the
    same, so both must get exactly the same plank at exactly the same height.
    """
    S = SIZE
    parts.append((mask(lambda d: d.rounded_rectangle(
        [S*0.16, S*0.80, S*0.84, S*0.90], radius=S*0.02, fill=255)), TIMBER, 16))


def rosette(color, layers, tails=True):
    """Champion Rosette (three layers) and Runner-up Ribbon (one).

    More ribbon means more money, so the top of the paytable explains itself
    before the player opens anything. The layer count IS the difference — H1 and
    H2 must not be told apart by hue alone at 130px.
    """
    S = SIZE
    parts = []
    if tails:
        parts.append((mask(lambda d: d.polygon(
            [(S*0.40, S*0.52), (S*0.60, S*0.52), (S*0.68, S*0.94),
             (S*0.50, S*0.82), (S*0.32, S*0.94)], fill=255)),
            tuple(int(c * 0.80) for c in color), 18))
    import math

    for i in range(layers):
        radius = 0.34 - i * 0.075
        petals = 15
        pts = []
        for k in range(petals * 2):
            a = math.pi * k / petals - math.pi / 2
            rr = S * (radius if k % 2 == 0 else radius * 0.80)
            pts.append((S*0.5 + math.cos(a) * rr, S*0.44 + math.sin(a) * rr))
        shade_c = tuple(min(255, int(c * (1.0 + i * 0.14))) for c in color)
        parts.append((mask(lambda d, pts=pts: d.polygon(pts, fill=255)), shade_c, 24))
    parts.append((mask(lambda d: d.ellipse(
        [S*0.40, S*0.34, S*0.60, S*0.54], fill=255)), CREAM, 18))
    return parts


def bottle():
    S = SIZE
    return [
        (mask(lambda d: d.rounded_rectangle(
            [S*0.33, S*0.30, S*0.67, S*0.86], radius=S*0.06, fill=255)), (232, 240, 232), 40),
        (mask(lambda d: d.rounded_rectangle(
            [S*0.38, S*0.46, S*0.62, S*0.82], radius=S*0.04, fill=255)), (252, 250, 240), 22),
        (mask(lambda d: d.rounded_rectangle(
            [S*0.39, S*0.14, S*0.61, S*0.34], radius=S*0.04, fill=255)), (232, 240, 232), 20),
        (mask(lambda d: d.rounded_rectangle(
            [S*0.37, S*0.10, S*0.63, S*0.22], radius=S*0.03, fill=255)), (214, 58, 58), 16),
    ]


def bale():
    S = SIZE
    parts = [(mask(lambda d: d.rounded_rectangle(
        [S*0.14, S*0.34, S*0.86, S*0.82], radius=S*0.06, fill=255)), (206, 176, 104), 42)]
    for x in (0.36, 0.64):
        parts.append((mask(lambda d, x=x: d.rounded_rectangle(
            [S*(x-0.025), S*0.34, S*(x+0.025), S*0.82], radius=S*0.01, fill=255)),
            (150, 116, 62), 8))
    ground(parts)
    return parts


def bucket():
    S = SIZE
    parts = [
        (mask(lambda d: d.arc([S*0.24, S*0.20, S*0.76, S*0.62],
                              start=180, end=360, fill=255, width=int(S*0.035))), (120, 92, 60), 10),
        (mask(lambda d: d.polygon(
            [(S*0.26, S*0.38), (S*0.74, S*0.38), (S*0.66, S*0.82), (S*0.34, S*0.82)], fill=255)),
            (126, 182, 190), 40),
        (mask(lambda d: d.ellipse([S*0.26, S*0.33, S*0.74, S*0.44], fill=255)), (96, 150, 160), 14),
    ]
    ground(parts)
    return parts


def horn_symbol():
    S = SIZE
    return [
        (mask(lambda d: d.polygon(
            [(S*0.22, S*0.26), (S*0.22, S*0.74), (S*0.70, S*0.62), (S*0.70, S*0.38)], fill=255)),
            CREAM, 36),
        (mask(lambda d: d.ellipse([S*0.13, S*0.22, S*0.31, S*0.78], fill=255)), (214, 58, 58), 30),
        (mask(lambda d: d.ellipse([S*0.17, S*0.28, S*0.27, S*0.72], fill=255)), (150, 34, 42), 12),
        (mask(lambda d: d.rounded_rectangle(
            [S*0.68, S*0.42, S*0.86, S*0.58], radius=S*0.03, fill=255)), (58, 52, 68), 14),
    ]


def churn():
    """MATTE galvanised steel — the one symbol that must not glint."""
    S = SIZE
    grey = (154, 162, 172)
    return [
        (mask(lambda d: d.polygon(
            [(S*0.31, S*0.30), (S*0.69, S*0.30), (S*0.77, S*0.86), (S*0.23, S*0.86)], fill=255)),
            grey, 40),
        (mask(lambda d: d.rounded_rectangle(
            [S*0.35, S*0.14, S*0.65, S*0.31], radius=S*0.03, fill=255)), grey, 20),
        (mask(lambda d: d.rounded_rectangle(
            [S*0.25, S*0.56, S*0.75, S*0.64], radius=S*0.015, fill=255)), CREAM, 10),
    ]


ENAMEL = {
    "l1": ((214, 46, 62), "horseshoe"),
    "l2": ((52, 158, 78), "clover"),
    "l3": ((44, 96, 200), "wheat"),
    "l4": ((136, 84, 194), "egg"),
}


def badge(color, glyph):
    """A royal: pressed-tin enamel badge, now with real volume.

    All four royals pay identically, so they keep ONE silhouette and differ only
    in colour field and pictogram. The reference's low symbols are farm objects
    instead, which looks livelier but throws away the only cue that says "these
    four are worth the same" — so the badges stay, rendered rather than flat.
    """
    S = SIZE
    parts = [
        (mask(lambda d: d.ellipse([S*0.10, S*0.10, S*0.90, S*0.90], fill=255)), CREAM, 46),
        (mask(lambda d: d.ellipse([S*0.17, S*0.17, S*0.83, S*0.83], fill=255)), color, 40),
    ]
    c, rr = S * 0.5, S * 0.17
    if glyph == "horseshoe":
        parts.append((mask(lambda d: d.arc(
            [c-rr, c-rr, c+rr, c+rr], start=200, end=340, fill=255, width=int(S*0.06))), CREAM, 10))
    elif glyph == "clover":
        parts.append((mask(lambda d: [d.ellipse(
            [c + dx*rr*0.55 - rr*0.5, c + dy*rr*0.55 - rr*0.5,
             c + dx*rr*0.55 + rr*0.5, c + dy*rr*0.55 + rr*0.5], fill=255)
            for dx, dy in ((0, -1), (1, 0), (0, 1), (-1, 0))]), CREAM, 10))
    elif glyph == "wheat":
        def draw_wheat(d):
            d.line([c, c+rr, c, c-rr], fill=255, width=int(S*0.035))
            for i in range(4):
                y = c - rr + i * rr * 0.5
                d.line([c, y, c - rr*0.6, y - rr*0.28], fill=255, width=int(S*0.028))
                d.line([c, y, c + rr*0.6, y - rr*0.28], fill=255, width=int(S*0.028))
        parts.append((mask(draw_wheat), CREAM, 10))
    else:
        parts.append((mask(lambda d: d.ellipse(
            [c-rr*0.68, c-rr, c+rr*0.68, c+rr], fill=255)), CREAM, 14))
    return parts


def render_parts(parts, shadow_from=None, matte=False):
    base = shadow_from if shadow_from is not None else parts[0][0]
    layers = [r.solid((0, 0, 0), r.contact_shadow(base, drop=18, blur=16, alpha=0.5))]
    for m, color, fat in parts:
        if matte:
            layers.append(r.shade(m, color, fat=fat, spec=0.05, shininess=6.0, rim=0.14))
        else:
            layers.append(r.shade(m, color, fat=fat))
    return r.compose(layers)


def save(img, *parts):
    path = os.path.join(OUT, *parts)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    img.save(path)
    print("  wrote", os.path.relpath(path, os.path.join(HERE, "..")))


def main():
    save(render_cow(False), "mooooSymbols", "w.png")
    save(render_cow(True), "mooooSymbols", "w_open.png")
    save(render_bell(), "mooooSymbols", "bell.png")

    save(render_parts(rosette((198, 32, 62), 3)), "mooooSymbols", "h1.png")
    save(render_parts(rosette((38, 82, 180), 1, tails=False)), "mooooSymbols", "h2.png")
    save(render_parts(bottle()), "mooooSymbols", "h3.png")
    save(render_parts(bale()), "mooooSymbols", "h4.png")
    save(render_parts(bucket()), "mooooSymbols", "h5.png")
    save(render_parts(horn_symbol()), "mooooSymbols", "fs.png")
    save(render_parts(churn(), matte=True), "mooooSymbols", "m.png")
    for name, (color, glyph) in ENAMEL.items():
        save(render_parts(badge(color, glyph)), "mooooSymbols", f"{name}.png")


if __name__ == "__main__":
    main()
