#!/usr/bin/env python3
"""Placeholder art for Moooo, generated rather than borrowed.

    python design/build_placeholder_art.py

Every file this writes is DRAWN HERE, from primitives. Nothing is copied from a
sibling app and nothing comes from a template, which is not a stylistic
preference — the Hot Miami submission shipped third-party template assets to
Stake for months because they arrived with a starter kit and nobody looked at
them. `design/check_provenance.mjs` hashes every asset against every sibling
app's; art that is generated cannot fail that check because there is nothing for
it to collide with.

SCOPE: backgrounds, frame, UI, banners, brand, tile, fx and the token sheet.
The twelve reel SYMBOLS and the bell come from build_symbols_3d.py instead.

These are PLACEHOLDERS. They exist so the game can be run, played and verified
before any real art exists, which is the order the brief asks for: build the
mechanic first, decorate afterwards. Each symbol is a flat shape in its final
palette so the board reads at a glance and the SIZES and CONTRAST are honest,
but none of it is the drawing described in docs/handoff/moooo_SYMBOLS.md.

The palette IS real, though, and so is the one rule that matters:

    Brass, silver and gold appear at full saturation on the cow's bell and
    nowhere else. Everything else is cloth, enamel, paper, wood or matte steel.

So the royals here are flat enamel discs, the premiums are cloth/glass/wood
colours, and the only metallic values in the whole set are the three bells.
"""

import math
import os

from PIL import Image, ImageDraw, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "..", "static", "assets", "sprites")

# ── county fair at dusk ──────────────────────────────────────────────────────
INDIGO = (26, 20, 58)
DEEP = (16, 11, 38)
SODIUM = (255, 176, 92)
CREAM = (247, 238, 214)

# The three bell metals. Three HUES, not three brightnesses of one hue — that
# distinction is the correction to Hot Miami, whose frames were all the same gold
# and could only be told apart by reading the number inside them.
BRASS = (201, 138, 60)
SILVER = (223, 233, 240)
GOLD = (255, 196, 61)

# Royals: flat enamel, deliberately NON-metallic so they stay out of the bell's
# colour language. Four hues, one silhouette — they all pay the same, so they are
# one designed set wearing four faces.
ROYALS = {
    "l1": ((214, 42, 58), "horseshoe"),
    "l2": ((58, 156, 74), "clover"),
    "l3": ((44, 96, 196), "wheat"),
    "l4": ((132, 82, 190), "egg"),
}

# Premiums: prize-table objects, no metal.
PREMIUMS = {
    "h1": ((196, 30, 62), "rosette"),      # Champion Rosette
    "h2": ((36, 78, 176), "rosette"),      # Runner-up Ribbon
    "h3": ((226, 232, 220), "bottle"),     # Glass Milk Bottle
    "h4": ((198, 168, 96), "bale"),        # Hay Bale
    "h5": ((122, 178, 186), "bucket"),     # Enamel Feed Bucket
}

SIZE = 512


def canvas(w=SIZE, h=SIZE):
    return Image.new("RGBA", (w, h), (0, 0, 0, 0))


def save(image, *parts):
    path = os.path.join(OUT, *parts)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    image.save(path)
    return os.path.relpath(path, os.path.join(HERE, ".."))


def outlined(draw, shape, fill, width=10):
    """Every symbol carries a dark keyline. At a 118px cell a shape without one
    dissolves into whatever is behind it, and the background here is a dusk sky
    that is neither light nor dark."""
    shape(draw, fill, DEEP, width)


def disc(size, color, glyph):
    """A royal: pressed-tin enamel badge. Identical silhouette for all four."""
    img = canvas(size, size)
    d = ImageDraw.Draw(img)
    pad = size * 0.12
    d.ellipse([pad, pad, size - pad, size - pad], fill=(*DEEP, 255))
    d.ellipse([pad + 12, pad + 12, size - pad - 12, size - pad - 12], fill=(*CREAM, 255))
    d.ellipse([pad + 26, pad + 26, size - pad - 26, size - pad - 26], fill=(*color, 255))

    c = size / 2
    r = size * 0.16
    if glyph == "horseshoe":
        d.arc([c - r, c - r, c + r, c + r], start=200, end=340, fill=(*CREAM, 255), width=int(size * 0.055))
        for sx in (-1, 1):
            d.ellipse([c + sx * r - 12, c + r * 0.34 - 12, c + sx * r + 12, c + r * 0.34 + 12], fill=(*CREAM, 255))
    elif glyph == "clover":
        for angle in (0, 90, 180, 270):
            a = math.radians(angle)
            cx, cy = c + math.cos(a) * r * 0.55, c + math.sin(a) * r * 0.55
            d.ellipse([cx - r * 0.5, cy - r * 0.5, cx + r * 0.5, cy + r * 0.5], fill=(*CREAM, 255))
    elif glyph == "wheat":
        d.line([c, c + r, c, c - r], fill=(*CREAM, 255), width=int(size * 0.04))
        for i in range(4):
            y = c - r + i * r * 0.5
            d.line([c, y, c - r * 0.6, y - r * 0.28], fill=(*CREAM, 255), width=int(size * 0.032))
            d.line([c, y, c + r * 0.6, y - r * 0.28], fill=(*CREAM, 255), width=int(size * 0.032))
    else:  # egg
        d.ellipse([c - r * 0.72, c - r, c + r * 0.72, c + r], fill=(*CREAM, 255))
    return img


def rosette(size, color):
    """H1/H2 — pleated ribbon. H1 gets three layers, H2 one: more ribbon means
    more money, so the top of the paytable explains itself."""
    img = canvas(size, size)
    d = ImageDraw.Draw(img)
    c = size / 2
    # tails first, behind the boss
    d.polygon([(c - size * 0.1, c), (c + size * 0.1, c), (c + size * 0.16, size * 0.94), (c, size * 0.8),
               (c - size * 0.16, size * 0.94)], fill=(*color, 255))
    for ring, radius in enumerate((0.34, 0.26, 0.18)):
        r = size * radius
        points = []
        petals = 14
        for i in range(petals * 2):
            a = math.pi * i / petals
            rr = r if i % 2 == 0 else r * 0.82
            points.append((c + math.cos(a) * rr, c * 0.86 + math.sin(a) * rr))
        shade = tuple(min(255, int(v * (1 + ring * 0.16))) for v in color)
        d.polygon(points, fill=(*shade, 255), outline=(*DEEP, 255))
    d.ellipse([c - size * 0.1, c * 0.86 - size * 0.1, c + size * 0.1, c * 0.86 + size * 0.1],
              fill=(*CREAM, 255), outline=(*DEEP, 255), width=6)
    return img


def bottle(size, color):
    img = canvas(size, size)
    d = ImageDraw.Draw(img)
    c = size / 2
    d.rounded_rectangle([c - size * 0.17, size * 0.3, c + size * 0.17, size * 0.86], radius=22,
                        fill=(*color, 255), outline=(*DEEP, 255), width=9)
    d.rounded_rectangle([c - size * 0.1, size * 0.16, c + size * 0.1, size * 0.32], radius=12,
                        fill=(*color, 255), outline=(*DEEP, 255), width=9)
    d.rounded_rectangle([c - size * 0.11, size * 0.13, c + size * 0.11, size * 0.21], radius=8,
                        fill=(214, 58, 58, 255), outline=(*DEEP, 255), width=7)
    return img


def bale(size, color):
    img = canvas(size, size)
    d = ImageDraw.Draw(img)
    d.rounded_rectangle([size * 0.14, size * 0.3, size * 0.86, size * 0.78], radius=26,
                        fill=(*color, 255), outline=(*DEEP, 255), width=10)
    for x in (0.36, 0.64):
        d.line([size * x, size * 0.3, size * x, size * 0.78], fill=(*DEEP, 255), width=9)
    return img


def bucket(size, color):
    img = canvas(size, size)
    d = ImageDraw.Draw(img)
    d.polygon([(size * 0.24, size * 0.34), (size * 0.76, size * 0.34),
               (size * 0.66, size * 0.82), (size * 0.34, size * 0.82)],
              fill=(*color, 255), outline=(*DEEP, 255), width=10)
    d.arc([size * 0.24, size * 0.16, size * 0.76, size * 0.5], start=190, end=350,
          fill=(*DEEP, 255), width=11)
    return img


def bell_shape(d, size, fill):
    """The cowbell alone, in whatever colour is asked for.

    Split out of `cow` so the SYMBOL can ship without a bell and the bell can be
    drawn over it and tinted at run time. Baking a colour in was actively wrong:
    the client tints from BELL_COLORS, nothing tinted the symbol sprite, so every
    landed cow showed a GOLD bell no matter its tier — while the expansion column
    beside it correctly drew brass. The game contradicted itself about the same
    cow on the same spin, and at meter level 1 roughly 99% of cows are not gold.
    """
    c = size / 2
    d.pieslice([c - size * 0.11, size * 0.7, c + size * 0.11, size * 0.94], start=180, end=360,
               fill=fill, outline=(*DEEP, 255), width=7)
    d.rectangle([c - size * 0.11, size * 0.81, c + size * 0.11, size * 0.86], fill=fill,
                outline=(*DEEP, 255), width=6)


def bell(size, color=(255, 255, 255)):
    """Standalone bell sprite, drawn white so a Pixi tint lands on the true hue.

    Pixi tint multiplies, so a bell baked in gold can only ever be tinted DARKER
    gold — silver and brass are unreachable from it. White is the only base that
    reproduces all three.
    """
    img = canvas(size, size)
    bell_shape(ImageDraw.Draw(img), size, (*color, 255))
    return img


def cow(size, mouth_open=False, with_bell=None):
    """The MOOOO wild. Black and white on purpose: maximum contrast against a warm
    dusk palette, and it leaves the bell as the only saturated colour on the
    symbol so the tier reads before anything else does.

    `with_bell` is for the compositions that want a self-contained cow (the logo,
    the store tile, the transition). The REEL symbol ships bell-less and gets its
    bell as a tinted overlay — see `bell_shape`.
    """
    img = canvas(size, size)
    d = ImageDraw.Draw(img)
    c = size / 2
    d.ellipse([size * 0.16, size * 0.14, size * 0.84, size * 0.72],
              fill=(250, 250, 252, 255), outline=(*DEEP, 255), width=10)
    for box in ([size * 0.2, size * 0.2, size * 0.42, size * 0.42],
                [size * 0.58, size * 0.34, size * 0.78, size * 0.52]):
        d.ellipse(box, fill=(*DEEP, 255))
    for sx in (0.3, 0.66):  # eyes
        eye_r = 16 * (1.25 if mouth_open else 1.0)  # eyes widen with the moo
        d.ellipse([size * sx - eye_r, size * 0.34 - eye_r, size * sx + eye_r, size * 0.34 + eye_r],
                  fill=(*DEEP, 255))
    # The mouth is the tell, so open is a SILHOUETTE change plus a new colour,
    # not an expression: the jaw drops to about a third of the head height and
    # the dark mouth interior becomes a large new shape. A subtle mouth is an
    # invisible mouth at the 130px the symbol is actually drawn at.
    muzzle = [size * 0.34, size * 0.5, size * 0.66, size * (0.84 if mouth_open else 0.68)]
    d.ellipse(muzzle, fill=(242, 168, 178, 255), outline=(*DEEP, 255), width=8)
    if mouth_open:
        d.ellipse([size * 0.39, size * 0.58, size * 0.61, size * 0.80], fill=(120, 30, 48, 255),
                  outline=(*DEEP, 255), width=6)
        d.ellipse([size * 0.44, size * 0.70, size * 0.56, size * 0.79], fill=(226, 122, 140, 255))
    # collar
    d.line([size * 0.24, size * 0.72, size * 0.76, size * 0.72], fill=(96, 58, 40, 255), width=16)
    if with_bell is not None:
        bell_shape(d, size, (*with_bell, 255))
    return img


def horn(size):
    """The scatter: a show-ground tannoy. A cone collides with nothing else on
    the board, and it is the object that announces things at a fair."""
    img = canvas(size, size)
    d = ImageDraw.Draw(img)
    d.polygon([(size * 0.2, size * 0.22), (size * 0.2, size * 0.78),
               (size * 0.68, size * 0.6), (size * 0.68, size * 0.4)],
              fill=(*CREAM, 255), outline=(*DEEP, 255), width=10)
    d.ellipse([size * 0.12, size * 0.2, size * 0.28, size * 0.8],
              fill=(214, 58, 58, 255), outline=(*DEEP, 255), width=9)
    d.rounded_rectangle([size * 0.66, size * 0.42, size * 0.84, size * 0.58], radius=8,
                        fill=(*DEEP, 255))
    return img


def churn(size):
    """The Milk Churn. MATTE galvanised steel — cool grey, no specular — because
    it must never compete with the bell metals."""
    img = canvas(size, size)
    d = ImageDraw.Draw(img)
    grey = (150, 158, 168)
    d.polygon([(size * 0.3, size * 0.3), (size * 0.7, size * 0.3),
               (size * 0.78, size * 0.84), (size * 0.22, size * 0.84)],
              fill=(*grey, 255), outline=(*DEEP, 255), width=10)
    d.rounded_rectangle([size * 0.34, size * 0.16, size * 0.66, size * 0.32], radius=10,
                        fill=(*grey, 255), outline=(*DEEP, 255), width=9)
    d.line([size * 0.24, size * 0.6, size * 0.76, size * 0.6], fill=(*CREAM, 255), width=14)
    return img


def radial(size, color, power=2.0):
    img = canvas(size, size)
    px = img.load()
    c = size / 2
    for y in range(size):
        for x in range(size):
            dist = math.hypot(x - c, y - c) / c
            a = max(0.0, 1.0 - dist) ** power
            px[x, y] = (*color, int(255 * a))
    return img


def star(size):
    img = canvas(size, size)
    d = ImageDraw.Draw(img)
    c = size / 2
    pts = []
    for i in range(8):
        a = math.pi * i / 4
        r = c * (0.95 if i % 2 == 0 else 0.3)
        pts.append((c + math.cos(a) * r, c + math.sin(a) * r))
    d.polygon(pts, fill=(255, 255, 255, 255))
    return img.filter(ImageFilter.GaussianBlur(size * 0.02))


def streak(w, h):
    img = canvas(w, h)
    px = img.load()
    for y in range(h):
        for x in range(w):
            fx = 1.0 - abs(x / w * 2 - 1)
            fy = 1.0 - abs(y / h * 2 - 1)
            px[x, y] = (255, 255, 255, int(255 * (fx**1.5) * (fy**2.5)))
    return img


def vignette(size):
    img = canvas(size, size)
    px = img.load()
    c = size / 2
    for y in range(size):
        for x in range(size):
            dist = math.hypot(x - c, y - c) / c
            px[x, y] = (0, 0, 0, int(255 * min(1.0, max(0.0, (dist - 0.55) / 0.6))))
    return img


def gradient(w, h, top, bottom):
    img = Image.new("RGBA", (w, h))
    d = ImageDraw.Draw(img)
    for y in range(h):
        t = y / h
        d.line([0, y, w, y], fill=tuple(int(top[i] + (bottom[i] - top[i]) * t) for i in range(3)) + (255,))
    return img


def background(w, h, sky_top, sky_bottom, bunting=True):
    img = gradient(w, h, sky_top, sky_bottom)
    d = ImageDraw.Draw(img)
    # floodlight pools along the horizon
    for i in range(6):
        x = w * (i + 0.5) / 6
        glow = radial(int(w * 0.34), SODIUM, 2.4)
        img.alpha_composite(glow, (int(x - w * 0.17), int(h * 0.42)))
    if bunting:
        span = w / 14
        for i in range(15):
            x = i * span
            y = h * 0.08 + math.sin(i * 0.7) * h * 0.02
            color = [(214, 58, 58), (247, 238, 214), (58, 156, 74), (44, 96, 196)][i % 4]
            d.polygon([(x, y), (x + span * 0.5, y), (x + span * 0.25, y + h * 0.06)],
                      fill=(*color, 235))
    return img


def plate(w, h, color, radius=26):
    img = canvas(w, h)
    d = ImageDraw.Draw(img)
    d.rounded_rectangle([4, 4, w - 4, h - 4], radius=radius, fill=(*color, 225),
                        outline=(*CREAM, 220), width=5)
    return img


def icon(size, kind):
    img = canvas(size, size)
    d = ImageDraw.Draw(img)
    c = size / 2
    w = int(size * 0.09)
    if kind == "menu":
        for i in (-1, 0, 1):
            d.line([size * 0.24, c + i * size * 0.2, size * 0.76, c + i * size * 0.2], fill=(*CREAM, 255), width=w)
    elif kind == "menuExit":
        d.line([size * 0.28, size * 0.28, size * 0.72, size * 0.72], fill=(*CREAM, 255), width=w)
        d.line([size * 0.72, size * 0.28, size * 0.28, size * 0.72], fill=(*CREAM, 255), width=w)
    elif kind == "soundOn":
        d.polygon([(size * 0.26, size * 0.4), (size * 0.42, size * 0.4), (size * 0.58, size * 0.24),
                   (size * 0.58, size * 0.76), (size * 0.42, size * 0.6), (size * 0.26, size * 0.6)],
                  fill=(*CREAM, 255))
        d.arc([size * 0.56, size * 0.3, size * 0.86, size * 0.7], start=300, end=60, fill=(*CREAM, 255), width=w)
    elif kind == "soundOff":
        d.polygon([(size * 0.26, size * 0.4), (size * 0.42, size * 0.4), (size * 0.58, size * 0.24),
                   (size * 0.58, size * 0.76), (size * 0.42, size * 0.6), (size * 0.26, size * 0.6)],
                  fill=(*CREAM, 255))
        d.line([size * 0.64, size * 0.38, size * 0.86, size * 0.62], fill=(*CREAM, 255), width=w)
        d.line([size * 0.86, size * 0.38, size * 0.64, size * 0.62], fill=(*CREAM, 255), width=w)
    elif kind == "autoSpin":
        d.arc([size * 0.22, size * 0.22, size * 0.78, size * 0.78], start=40, end=320, fill=(*CREAM, 255), width=w)
        d.polygon([(size * 0.74, size * 0.16), (size * 0.86, size * 0.34), (size * 0.62, size * 0.34)],
                  fill=(*CREAM, 255))
    elif kind == "settings":
        d.ellipse([size * 0.34, size * 0.34, size * 0.66, size * 0.66], outline=(*CREAM, 255), width=w)
        for i in range(8):
            a = math.pi * i / 4
            d.line([c + math.cos(a) * size * 0.3, c + math.sin(a) * size * 0.3,
                    c + math.cos(a) * size * 0.42, c + math.sin(a) * size * 0.42],
                   fill=(*CREAM, 255), width=w)
    elif kind == "info":
        d.ellipse([size * 0.22, size * 0.22, size * 0.78, size * 0.78], outline=(*CREAM, 255), width=w)
        d.line([c, size * 0.44, c, size * 0.68], fill=(*CREAM, 255), width=w)
        d.ellipse([c - w * 0.6, size * 0.3, c + w * 0.6, size * 0.3 + w * 1.2], fill=(*CREAM, 255))
    else:  # payTable
        d.rounded_rectangle([size * 0.24, size * 0.2, size * 0.76, size * 0.8], radius=10,
                            outline=(*CREAM, 255), width=w)
        for i in range(3):
            y = size * (0.34 + i * 0.16)
            d.line([size * 0.34, y, size * 0.66, y], fill=(*CREAM, 255), width=int(w * 0.7))
    return img


def banner(w, h, color, pips):
    img = canvas(w, h)
    d = ImageDraw.Draw(img)
    d.rounded_rectangle([6, 6, w - 6, h - 6], radius=28, fill=(*color, 240),
                        outline=(*CREAM, 240), width=7)
    for i in range(pips):
        x = w / 2 + (i - (pips - 1) / 2) * 46
        d.ellipse([x - 14, h * 0.72 - 14, x + 14, h * 0.72 + 14], fill=(*CREAM, 255))
    return img


def main():
    written = []

        # NOTE: the twelve reel symbols and the bell are NOT written here any more.
    # They are rendered by design/build_symbols_3d.py, which lights them instead
    # of drawing them flat. Running this script must never clobber those — two
    # generators writing the same filenames is a trap that silently undoes an
    # afternoon's work the next time somebody regenerates the backgrounds.
    written.append(save(plate(SIZE, SIZE, INDIGO, radius=18), "mooooSymbols", "frame.png"))

    written.append(save(radial(256, (255, 255, 255), 2.2), "mooooFx", "fx_glow.png"))
    written.append(save(star(256), "mooooFx", "fx_star.png"))
    written.append(save(streak(256, 64), "mooooFx", "fx_streak.png"))
    written.append(save(radial(128, (255, 255, 255), 3.0), "mooooFx", "fx_leaf.png"))
    written.append(save(vignette(1024), "mooooFx", "fx_vignette.png"))

    side = canvas(1024, 512)
    side.alpha_composite(cow(480, mouth_open=True, with_bell=GOLD).resize((720, 720)).crop((0, 100, 720, 612)), (150, 0))
    written.append(save(side, "mooooFx", "transition_cow.png"))

    written.append(save(background(2039, 1000, INDIGO, (92, 46, 82)), "mooooBackground", "bg_base.png"))
    written.append(save(background(2039, 1000, (34, 22, 70), (128, 62, 74)), "mooooBackground", "bg_feature.png"))
    written.append(save(background(2039, 1000, (12, 10, 34), (72, 34, 96)), "mooooBackground", "bg_super.png"))

    written.append(save(plate(1280, 1280, (0, 0, 0), radius=64), "mooooFrame", "frame_bg.png"))
    written.append(save(plate(1280, 1280, INDIGO, radius=64), "mooooFrame", "frame_edge.png"))
    written.append(save(plate(520, 190, INDIGO), "mooooFrame", "fs_counter_panel.png"))
    written.append(save(plate(900, 320, (92, 30, 62)), "mooooFrame", "fs_sign.png"))

    written.append(save(plate(560, 120, INDIGO), "mooooUi", "ticker_plate.png"))
    written.append(save(plate(300, 300, (92, 30, 62)), "mooooUi", "buybonus_plate.png"))

    for kind in ("menu", "menuExit", "soundOn", "soundOff", "autoSpin", "settings", "info", "payTable"):
        written.append(save(icon(128, kind), "mooooUiIcons", f"{kind}.png"))

    for name, pips, color in (("big", 1, (92, 30, 62)), ("superwin", 2, (120, 40, 70)),
                              ("mega", 3, (150, 52, 66)), ("epic", 4, (176, 64, 60)),
                              ("max", 5, (196, 30, 62))):
        written.append(save(banner(760, 260, color, pips), "mooooWinBanners", f"{name}.png"))

    logo = canvas(1200, 500)
    d = ImageDraw.Draw(logo)
    d.rounded_rectangle([40, 120, 1160, 380], radius=60, fill=(*INDIGO, 240), outline=(*CREAM, 240), width=10)
    logo.alpha_composite(cow(300, mouth_open=True, with_bell=GOLD), (60, 100))
    written.append(save(logo, "mooooBrand", "logo.png"))

    # Store-tile / intro foreground: the cast that flanks the opening card. Hot
    # Miami's is two painted characters; Moooo's placeholder is a cow standing in
    # a floodlit ring, cropped tall so the intro can bleed it off both edges.
    tile = canvas(1024, 1024)
    ring = radial(900, SODIUM, 1.6)
    tile.alpha_composite(ring, (62, 300))
    tile.alpha_composite(cow(620, mouth_open=True, with_bell=GOLD), (202, 240))
    written.append(save(tile, "mooooBrand", "tile_foreground.png"))

    # ── Store tile ───────────────────────────────────────────────────────────
    #
    # Stake wants exactly THREE files (see the game-tile requirements page, and
    # upload/HotMiami/thumbnail/README.md, which was written after we shipped
    # two of them under the wrong names):
    #
    #   <Game>-BG.png    1024x1024 OPAQUE       the world of the game
    #   <Game>-FG.png    1024x1024 TRANSPARENT  a feature character or key item
    #   <Studio>-Logo.png             TRANSPARENT  the provider mark
    #
    # BG and FG together must stay under 3 MB. The provider logo is the studio's
    # and is shared across its games, so it is not generated here - it is copied
    # into the upload bundle from the existing one.
    # Flattened onto an opaque plate. The spec says the background is opaque, and
    # the bunting draws at alpha 235 — so composited straight out, the file's
    # minimum alpha was 235 and it would have gone up as "opaque" without being
    # it. Checked rather than assumed; see the assert below.
    tile_bg = Image.new("RGBA", (1024, 1024), (*DEEP, 255))
    tile_bg.alpha_composite(background(1024, 1024, INDIGO, (92, 46, 82)).convert("RGBA"))
    assert tile_bg.split()[-1].getextrema() == (255, 255), "store-tile BG must be fully opaque"
    written.append(save(tile_bg, "mooooTile", "Moooo-BG.png"))

    tile_fg = canvas(1024, 1024)
    tile_fg.alpha_composite(cow(760, mouth_open=True, with_bell=GOLD), (132, 150))
    assert tile_fg.split()[-1].getextrema()[0] == 0, "store-tile FG must have real transparency"
    written.append(save(tile_fg, "mooooTile", "Moooo-FG.png"))

    written.extend(write_token_sheet())

    print(f"wrote {len(written)} placeholder files")
    for path in written:
        print("  ", path)



# ── prize-token sheet ────────────────────────────────────────────────────────
#
# The big-win rain. Hot Miami rained coins from `SD2_Coin.json` — a TexturePacker
# sheet carried in with a template, 2.5MB of 684px frames under a filename naming
# somebody else's game. Moooo rains PRIZE TOKENS instead, which is both its own
# asset and the more on-theme object: you do not win coins at a county fair, you
# win a rosette.
#
# Twelve frames of one token turning edge-on and back, laid out 4x3, in the
# TexturePacker JSON shape ParticleEmitter expects.

TOKEN_FRAMES = 12
TOKEN_SIZE = 128


def token_frame(size, phase):
    """One frame of a token rotating about its vertical axis."""
    img = canvas(size, size)
    d = ImageDraw.Draw(img)
    c = size / 2
    # cos gives the foreshortened width; abs so it turns through edge-on and
    # comes back rather than mirroring into a negative width
    squash = abs(math.cos(phase))
    half_w = max(2.0, (size * 0.42) * squash)
    half_h = size * 0.42
    edge_on = squash < 0.18

    body = SILVER if edge_on else (214, 58, 58)
    d.ellipse([c - half_w, c - half_h, c + half_w, c + half_h],
              fill=(*body, 255), outline=(*DEEP, 255), width=6)
    if not edge_on and squash > 0.45:
        d.ellipse([c - half_w * 0.45, c - half_h * 0.45, c + half_w * 0.45, c + half_h * 0.45],
                  fill=(*CREAM, 255), outline=(*DEEP, 255), width=4)
    return img


def token_sheet():
    cols, rows = 4, 3
    sheet = canvas(TOKEN_SIZE * cols, TOKEN_SIZE * rows)
    frames = {}
    for i in range(TOKEN_FRAMES):
        x = (i % cols) * TOKEN_SIZE
        y = (i // cols) * TOKEN_SIZE
        sheet.alpha_composite(token_frame(TOKEN_SIZE, math.pi * i / TOKEN_FRAMES), (x, y))
        box = {"x": x, "y": y, "w": TOKEN_SIZE, "h": TOKEN_SIZE}
        frames[f"{i + 1}.png"] = {
            "frame": box,
            "rotated": False,
            "trimmed": False,
            "spriteSourceSize": {"x": 0, "y": 0, "w": TOKEN_SIZE, "h": TOKEN_SIZE},
            "sourceSize": {"w": TOKEN_SIZE, "h": TOKEN_SIZE},
        }
    manifest = {
        "frames": frames,
        "animations": {"token": [f"{i + 1}.png" for i in range(TOKEN_FRAMES)]},
        "meta": {
            "app": "design/build_placeholder_art.py",
            "version": "1.0",
            "image": "token.png",
            "format": "RGBA8888",
            "size": {"w": TOKEN_SIZE * cols, "h": TOKEN_SIZE * rows},
            "scale": "1",
        },
    }
    return sheet, manifest


def write_token_sheet():
    import json

    sheet, manifest = token_sheet()
    path = save(sheet, "mooooToken", "token.png")
    json_path = os.path.join(OUT, "mooooToken", "token.json")
    with open(json_path, "w", encoding="UTF-8") as handle:
        json.dump(manifest, handle, indent="\t")
    return [path, os.path.relpath(json_path, os.path.join(HERE, ".."))]

if __name__ == "__main__":
    main()
