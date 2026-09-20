"""Generate every Hot Miami art asset.

    /Applications/anaconda3/bin/python generate_art.py

Writes into ../static/assets/ (symbols, backgrounds, win banners, brand) plus
the favicon. Re-running is idempotent - every file is regenerated from scratch,
and nothing here is ever hand-edited.

Three symbol families are dispatched out of `symbols.SYMBOLS` by `kind`:

    royal  -> neon.render_chrome_letter   A / K / Q / J, one desaturated material
    object -> neon.render_object          five premiums, one identity hue each
    word   -> neon.render_word            Wild / Scatter / Collector, one family
    frame  -> neon.render_neon            the Collector's multiplier overlay

Run `contact_sheet.py` afterwards: it re-renders the registry at the true 105px
reel cell on the real board colour and re-measures pay-vs-contrast, body-vs-board
distance and the silhouette IoU matrix.
"""

import math
import os

from PIL import Image, ImageDraw, ImageFilter, ImageFont

from neon import (
    PALETTE,
    _tint,
    outline,
    frond,
    radial_glow,
    render_chrome_letter,
    render_neon,
    render_object,
    render_word,
    scanlines,
    smooth,
    vertical_gradient,
)
from symbols import FILE_ALIASES, SYMBOLS

HERE = os.path.dirname(os.path.abspath(__file__))
STATIC = os.path.abspath(os.path.join(HERE, "..", "static"))
SPRITES = os.path.join(STATIC, "assets", "sprites", "hotMiamiSymbols")
BACKDROP = os.path.join(STATIC, "assets", "sprites", "hotMiamiBackground")
BANNERS = os.path.join(STATIC, "assets", "sprites", "hotMiamiWinBanners")
BRAND = os.path.join(STATIC, "assets", "sprites", "hotMiamiBrand")
FONT_PATH = os.path.join(STATIC, "fonts", "TitanOne.ttf")
# Orbitron carries the wordmark, the card royals and the special words, so the
# baked type matches the in-game display face. Variable 400..900; Pillow renders
# a variable font at its default instance, so the weight axis is set explicitly.
TITLE_FONT_PATH = os.path.join(STATIC, "fonts", "Orbitron.ttf")

SYMBOL_SIZE = 256


def ensure_dirs():
    for path in (SPRITES, BACKDROP, BANNERS, BRAND):
        os.makedirs(path, exist_ok=True)


def load_font(size):
    if os.path.exists(FONT_PATH):
        return ImageFont.truetype(FONT_PATH, size)
    return ImageFont.load_default()


def load_title_font(size, weight=800):
    """Orbitron at an explicit weight off its variable axis."""
    if not os.path.exists(TITLE_FONT_PATH):
        return load_font(size)
    font = ImageFont.truetype(TITLE_FONT_PATH, max(4, int(size)))
    try:
        font.set_variation_by_axes([weight])
    except (AttributeError, OSError):
        pass  # Pillow without FreeType variable-font support
    return font


def royal_font(size, weight=900):
    return load_title_font(size, weight=weight)


# ---------------------------------------------------------------------------
# Symbols
# ---------------------------------------------------------------------------
def build_symbols():
    """Render each reel symbol as a transparent 256x256 PNG."""
    for name, spec in SYMBOLS.items():
        kind = spec["kind"]
        if kind == "royal":
            image = render_chrome_letter(
                spec["text"], royal_font, size=SYMBOL_SIZE, coverage=spec["coverage"],
                rim=(186, 200, 220),
            )
        elif kind == "object":
            image = render_object(spec, size=SYMBOL_SIZE)
        elif kind == "word":
            image = render_word(spec, royal_font, size=SYMBOL_SIZE)
        elif kind == "frame":
            image = render_neon(
                spec["stroke"], spec["color"], size=SYMBOL_SIZE,
                core_width=spec["width"], glow_color=spec["glow"],
            )
        else:
            raise ValueError(f"unknown symbol kind {kind!r} for {name}")

        for target in FILE_ALIASES.get(name, (name,)):
            image.save(os.path.join(SPRITES, f"{target}.png"))
        print(f"  symbol {name}.png ({kind}) -> {', '.join(FILE_ALIASES.get(name, (name,)))}")


# ---------------------------------------------------------------------------
# Scene primitives, shared by the three backgrounds and the store tile
# ---------------------------------------------------------------------------
def _curved_palm(draw, base, height, lean=1.0, ink=None, fronds=11):
    """Palm silhouette with CURVED fronds.

    The old `_silhouette_palm` built each blade as a symmetric straight triangle
    fan radiating from a point, which is precisely the cannabis-leaf hazard the
    submission rules name - and it was the palm in all three backgrounds. Every
    blade is now a Bezier spine with a tapering blade around it (`neon.frond`).
    """
    ink = ink or PALETTE["ink"] + (250,)
    base_x, base_y = base
    top_x = base_x + height * 0.13 * lean
    top_y = base_y - height * 0.74

    segments = 16
    for i in range(segments):
        t0, t1 = i / segments, (i + 1) / segments
        x0 = base_x + (top_x - base_x) * (t0 ** 1.5)
        y0 = base_y + (top_y - base_y) * t0
        x1 = base_x + (top_x - base_x) * (t1 ** 1.5)
        y1 = base_y + (top_y - base_y) * t1
        draw.line([(x0, y0), (x1, y1)], fill=ink, width=max(2, int(height * (0.030 - 0.020 * t0))))

    # Thin, long, well separated blades. The first cut used width = 0.30 of the
    # blade's reach and 9 blades, which fused into one dark lump - a mangrove,
    # not a palm - at tile size.
    for i in range(fronds):
        a = math.radians(192 + i * (156.0 / max(1, fronds - 1)))
        reach = height * (0.44 + 0.10 * math.sin(i * 2.3))
        ctrl = (top_x + math.cos(a) * reach * 0.52, top_y + math.sin(a) * reach * 0.86)
        tip = (top_x + math.cos(a) * reach * 1.02, top_y + math.sin(a) * reach * 0.40 + reach * 0.60)
        draw.polygon(frond((top_x, top_y), ctrl, tip, width=reach * 0.115), fill=ink)

    r = height * 0.026
    draw.ellipse([top_x - r, top_y - r, top_x + r, top_y + r], fill=ink)


def _retrosun(size, centre, radius, top, bottom, slats=True):
    """Slitted sunset disc on its own layer, clipped above the horizon."""
    w, h = size
    mask = Image.new("RGBA", size, (0, 0, 0, 0))
    ImageDraw.Draw(mask).ellipse(
        [centre[0] - radius, centre[1] - radius, centre[0] + radius, centre[1] + radius],
        fill=(255, 255, 255, 235),
    )
    disc = vertical_gradient(size, top, bottom).convert("RGBA")
    disc.putalpha(mask.getchannel("A"))
    if slats:
        cut = ImageDraw.Draw(disc)
        y, thickness, gap = centre[1] - int(radius * 0.5), max(2, int(radius * 0.035)), int(radius * 0.16)
        while y < centre[1] + radius:
            cut.rectangle([0, y, w, y + thickness], fill=(0, 0, 0, 0))
            y += gap
            thickness = int(thickness * 1.5) + 1
    return disc


def _deco_strip(draw, x0, x1, base_y, height, ink, towers=7, seed=0):
    """A low run of art-deco blocks - the city edge, well away from the reels."""
    span = (x1 - x0) / towers
    for i in range(towers):
        k = math.sin((i + seed) * 2.399) * 0.5 + 0.5
        top = base_y - height * (0.35 + 0.65 * k)
        left = x0 + i * span + span * 0.08
        right = x0 + (i + 1) * span - span * 0.08
        draw.rectangle([left, top, right, base_y], fill=ink)
        step = (right - left) * 0.24
        draw.rectangle([left + step, top - height * 0.14 * k, right - step, top], fill=ink)
        if i % 3 == 1:
            mid = (left + right) / 2
            draw.rectangle([mid - span * 0.03, top - height * 0.45 * k, mid + span * 0.03, top], fill=ink)


def _flamingo_silhouette(draw, box, ink):
    """The h3 drawing reused as a scenery silhouette - same four parts."""
    from symbols import (
        FLAMINGO_BILL, FLAMINGO_BODY, FLAMINGO_HEAD, FLAMINGO_LEGS,
        FLAMINGO_NECK, FLAMINGO_NECK_HALF, _band,
    )

    x, y, w, h = box

    def place(pairs):
        return [(x + px * w, y + py * h) for px, py in pairs]

    draw.polygon(place(smooth(FLAMINGO_BODY, closed=True)), fill=ink)
    draw.polygon(place(_band(FLAMINGO_NECK, *FLAMINGO_NECK_HALF)), fill=ink)
    hx, hy, hr = FLAMINGO_HEAD
    draw.ellipse([x + (hx - hr) * w, y + (hy - hr) * h, x + (hx + hr) * w, y + (hy + hr) * h], fill=ink)
    draw.polygon(place(smooth(FLAMINGO_BILL, closed=True, steps=8)), fill=ink)
    for hip, knee, foot in FLAMINGO_LEGS:
        draw.line(place(smooth([hip, knee, foot])), fill=ink,
                  width=max(2, int(w * 0.024)), joint="curve")


def _car_silhouette(draw, box, ink):
    """The h5 outline reused as a scenery silhouette."""
    from symbols import CAR

    x, y, w, h = box
    body = smooth(CAR) + [(0.962, 0.742), (0.055, 0.742)]
    draw.polygon([(x + px * w, y + py * h) for px, py in body], fill=ink)
    for cx in (0.285, 0.762):
        draw.ellipse(
            [x + (cx - 0.104) * w, y + (0.742 - 0.104) * h,
             x + (cx + 0.104) * w, y + (0.742 + 0.104) * h], fill=ink,
        )


def _perspective_grid(size, horizon, color, alpha=90, lanes=24, centre_x=None):
    w, h = size
    grid = Image.new("RGBA", size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(grid)
    cx = w // 2 if centre_x is None else centre_x
    for i in range(-lanes, lanes + 1):
        draw.line([(cx, horizon), (cx + i * (w // 12), h)], fill=color + (alpha,), width=3)
    y, step = horizon, 6
    while y < h:
        draw.line([(0, y), (w, y)], fill=color + (alpha - 10,), width=2)
        step = int(step * 1.42) + 2
        y += step
    return grid.filter(ImageFilter.GaussianBlur(1.2))


def _board_shade(size, strength=0.46):
    """Darken the centre of the frame, where the reels sit.

    Every Hacksaw title puts its hero BESIDE the reels and keeps the board the
    most separated region on screen. Ours had the retrosun dead centre: measured
    centre-band luminance 57.4 against 36.5 full-frame, i.e. the brightest part
    of the backdrop was directly behind the board.
    """
    w, h = size
    shade = Image.new("L", (w, h), 0)
    ImageDraw.Draw(shade).ellipse(
        [w * 0.16, -h * 0.22, w * 0.84, h * 1.22], fill=int(255 * strength)
    )
    layer = Image.new("RGBA", (w, h), (6, 2, 20, 0))
    layer.putalpha(shade.filter(ImageFilter.GaussianBlur(w * 0.06)))
    return layer


# ---------------------------------------------------------------------------
# Backgrounds - three different scenes, not one scene in three hues
# ---------------------------------------------------------------------------
def build_backgrounds(width=1920, height=1080):
    from generate_hot_miami_backgrounds import build_background
    build_background("base", "bg_base.png")
    build_background("feature", "bg_feature.png")
    build_background("epic", "bg_epic.png")


def _finish(canvas, name, width, height):
    canvas = Image.alpha_composite(canvas, _board_shade((width, height)))
    canvas = Image.alpha_composite(canvas, scanlines((width, height), spacing=4, alpha=20))
    canvas.convert("RGB").save(os.path.join(BACKDROP, f"{name}.png"))
    print(f"  {name}.png ({width}x{height})")


def build_bg_base(width=1920, height=1080):
    """BASE - Ocean Drive at dusk. Sun low and RIGHT of the board, city left."""
    canvas = vertical_gradient((width, height), (10, 5, 40), (86, 20, 84)).convert("RGBA")
    horizon = int(height * 0.66)

    canvas = Image.alpha_composite(
        canvas,
        radial_glow((width, height), (int(width * 0.80), horizon), int(height * 0.42),
                    PALETTE["orange"], 0.36),
    )
    canvas = Image.alpha_composite(
        canvas,
        _retrosun((width, height), (int(width * 0.80), horizon - int(height * 0.02)),
                  int(height * 0.20), PALETTE["gold"], PALETTE["magenta"]),
    )
    canvas = Image.alpha_composite(
        canvas, _perspective_grid((width, height), horizon, PALETTE["cyan"], 84, centre_x=int(width * 0.80))
    )

    scenery = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    draw = ImageDraw.Draw(scenery)
    _deco_strip(draw, int(width * -0.02), int(width * 0.36), horizon + 6,
                height * 0.30, (12, 6, 32, 252), towers=8, seed=1)
    _curved_palm(draw, (int(width * 0.11), horizon + int(height * 0.10)), height * 0.62, -1.0)
    _curved_palm(draw, (int(width * 0.93), horizon + int(height * 0.13)), height * 0.52, 1.0)
    _curved_palm(draw, (int(width * 0.245), horizon + int(height * 0.05)), height * 0.34, 1.0)
    canvas = Image.alpha_composite(canvas, scenery)
    _finish(canvas, "bg_base", width, height)


def build_bg_feature(width=1920, height=1080):
    """FREE SPINS - Neon Nights. No sun at all: a cold night city, a neon arch
    left, a flamingo standing right. A mode change should change the world."""
    canvas = vertical_gradient((width, height), (4, 8, 44), (10, 46, 92)).convert("RGBA")
    horizon = int(height * 0.72)

    for cx, cy, r, col, s in (
        (0.16, 0.34, 0.40, PALETTE["cyan"], 0.30),
        (0.88, 0.26, 0.30, PALETTE["magenta"], 0.26),
    ):
        canvas = Image.alpha_composite(
            canvas,
            radial_glow((width, height), (int(width * cx), int(height * cy)), int(height * r), col, s),
        )

    # Neon arch: three concentric rings on the left, the feature's own motif.
    arch = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    arch_draw = ImageDraw.Draw(arch)
    ax, ay = int(width * 0.17), int(height * 0.46)
    for i, (r, col, wdt) in enumerate((
        (0.36, PALETTE["mint"], 10), (0.27, PALETTE["cyan"], 7), (0.185, PALETTE["magenta"], 5)
    )):
        rr = int(height * r)
        arch_draw.arc([ax - rr, ay - rr, ax + rr, ay + rr], 180, 360, fill=col + (200,), width=wdt)
        arch_draw.line([(ax - rr, ay), (ax - rr, horizon)], fill=col + (150,), width=wdt)
        arch_draw.line([(ax + rr, ay), (ax + rr, horizon)], fill=col + (150,), width=wdt)
    canvas = Image.alpha_composite(canvas, arch.filter(ImageFilter.GaussianBlur(4)))
    canvas = Image.alpha_composite(canvas, arch)

    canvas = Image.alpha_composite(
        canvas, _perspective_grid((width, height), horizon, PALETTE["mint"], 70, centre_x=width // 2)
    )

    scenery = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    draw = ImageDraw.Draw(scenery)
    _deco_strip(draw, int(width * 0.60), int(width * 1.02), horizon + 6,
                height * 0.36, (6, 8, 34, 252), towers=9, seed=4)
    # Hero BESIDE the reels and standing ON the horizon, not floating in the
    # skyline: the audit's complaint about the old backdrops was that the
    # brightest, busiest thing sat directly behind the board.
    canvas = Image.alpha_composite(canvas, scenery)
    # Hero on its own layer with a neon rim, so it separates from the city
    # behind it instead of merging into one black mass.
    hero = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    _flamingo_silhouette(
        ImageDraw.Draw(hero),
        (width * 0.690, horizon - height * 0.645, height * 0.68, height * 0.68), (5, 6, 30, 255),
    )
    canvas = Image.alpha_composite(canvas, outline(hero, width * 0.0032, PALETTE["magenta"]))
    scenery = hero
    draw = ImageDraw.Draw(scenery)
    _curved_palm(draw, (int(width * 0.05), horizon + int(height * 0.06)), height * 0.44, -1.0)
    canvas = Image.alpha_composite(canvas, scenery)
    _finish(canvas, "bg_feature", width, height)


def build_bg_epic(width=1920, height=1080):
    """OCEAN DRIVE (epic) - a causeway at speed. Horizon glow bar rather than a
    disc, the convertible running along the bottom left, palms streaming right."""
    canvas = vertical_gradient((width, height), (34, 4, 34), (132, 14, 62)).convert("RGBA")
    horizon = int(height * 0.60)

    bar = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    ImageDraw.Draw(bar).rectangle(
        [0, horizon - int(height * 0.035), width, horizon + int(height * 0.012)],
        fill=PALETTE["gold"] + (215,),
    )
    canvas = Image.alpha_composite(canvas, bar.filter(ImageFilter.GaussianBlur(height * 0.035)))
    canvas = Image.alpha_composite(canvas, bar.filter(ImageFilter.GaussianBlur(3)))
    canvas = Image.alpha_composite(
        canvas, _perspective_grid((width, height), horizon, PALETTE["magenta"], 96, centre_x=width // 2)
    )

    # Speed streaks converging on the horizon, left and right of the board.
    streaks = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    sdraw = ImageDraw.Draw(streaks)
    for i in range(18):
        t = i / 17.0
        y = horizon + int(height * (0.06 + 0.52 * t * t))
        length = width * (0.10 + 0.22 * t)
        sdraw.line([(0, y), (length, y)], fill=PALETTE["gold"] + (70,), width=max(2, int(3 + 7 * t)))
        sdraw.line([(width, y), (width - length, y)], fill=PALETTE["cyan"] + (60,), width=max(2, int(3 + 7 * t)))
    canvas = Image.alpha_composite(canvas, streaks.filter(ImageFilter.GaussianBlur(2)))

    scenery = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    draw = ImageDraw.Draw(scenery)
    _deco_strip(draw, int(width * -0.02), int(width * 0.30), horizon + 4,
                height * 0.16, (16, 2, 28, 250), towers=7, seed=2)
    _deco_strip(draw, int(width * 0.70), int(width * 1.02), horizon + 4,
                height * 0.19, (16, 2, 28, 250), towers=7, seed=5)
    canvas = Image.alpha_composite(canvas, scenery)
    hero = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    _car_silhouette(ImageDraw.Draw(hero),
                    (width * 0.02, height * 0.34, width * 0.32, width * 0.32), (14, 2, 26, 255))
    canvas = Image.alpha_composite(canvas, outline(hero, width * 0.0032, PALETTE["gold"]))
    scenery = hero
    draw = ImageDraw.Draw(scenery)
    _curved_palm(draw, (int(width * 0.90), horizon + int(height * 0.22)), height * 0.66, 1.0)
    _curved_palm(draw, (int(width * 0.975), horizon + int(height * 0.05)), height * 0.40, -1.0)
    canvas = Image.alpha_composite(canvas, scenery)
    _finish(canvas, "bg_epic", width, height)


# ---------------------------------------------------------------------------
# Neon wordmark
# ---------------------------------------------------------------------------
def neon_text_layer(text, size, centre, target_h, max_w, color, glow, weight=900, core=7):
    """Neon wordmark fitted to a box on a NON-square canvas.

    The old `_neon_text` rendered on a max(w,h) square and then chose between a
    crop and a resize with `square != width`, which is false for any landscape
    canvas - so the logo took the resize branch and a 1200x1200 render was
    squashed into 1200x520. It also trusted a point size, so MIAMI overflowed
    and clipped at both edges. This measures and fits instead.
    """
    w, h = size
    ss = 2
    canvas = (w * ss, h * ss)
    measure = ImageDraw.Draw(Image.new("L", (8, 8)))

    probe_px = 200
    probe = load_title_font(probe_px, weight)
    pb = measure.textbbox((0, 0), text, font=probe)
    pw, ph = max(1, pb[2] - pb[0]), max(1, pb[3] - pb[1])
    font = load_title_font(probe_px * min(max_w * ss / pw, target_h * ss / ph), weight)
    box = measure.textbbox((0, 0), text, font=font)
    x = centre[0] * ss - (box[0] + box[2]) / 2
    y = centre[1] * ss - (box[1] + box[3]) / 2

    def layer(stroke, col):
        img = Image.new("RGBA", canvas, (0, 0, 0, 0))
        ImageDraw.Draw(img).text(
            (x, y), text, font=font, fill=col + (255,),
            stroke_width=max(0, int(stroke)), stroke_fill=col + (255,),
        )
        return img

    out = Image.new("RGBA", canvas, (0, 0, 0, 0))
    for radius, alpha in ((22, 0.40), (10, 0.62), (4, 0.85)):
        halo = layer(core * ss * 0.5 + radius * ss * 0.4, glow)
        out = Image.alpha_composite(
            out, _tint(halo.filter(ImageFilter.GaussianBlur(radius * ss * 0.55)), glow, alpha * 0.5)
        )
    out = Image.alpha_composite(out, layer(core * ss * 0.5, color))
    out = Image.alpha_composite(out, _tint(layer(0, PALETTE["white"]), PALETTE["white"], 0.92))
    return out.resize((w, h), Image.LANCZOS)


def build_logo(width=1200, height=520):
    """Two-line neon wordmark on transparent background, 1200x520."""
    canvas = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    for text, color, glow, cy, target_h, max_w in (
        ("HOT", PALETTE["magenta"], PALETTE["magenta"], height * 0.30, height * 0.30, width * 0.42),
        ("MIAMI", PALETTE["cyan"], PALETTE["purple"], height * 0.72, height * 0.34, width * 0.88),
    ):
        canvas = Image.alpha_composite(
            canvas, neon_text_layer(text, (width, height), (width * 0.5, cy), target_h, max_w, color, glow)
        )
    canvas.save(os.path.join(BRAND, "logo.png"))
    print(f"  logo.png ({width}x{height})")


# ---------------------------------------------------------------------------
# Win banners - five tiers that actually escalate
# ---------------------------------------------------------------------------
# The five shipped plaques were the identical magenta plate with only the word
# changed; this is the image a player stares at for 6 to 32 seconds. Each rung
# grows the plate, adds an ornament layer and moves the hue up the ramp that
# components/Win.svelte already uses for its glow bed (gold -> pink).
BANNER_TIERS = [
    # name, word, inset, rim, plate top/bottom, bulbs, rays, corner fans
    ("big", "BIG WIN", 0.085, (255, 176, 120), (128, 18, 92), (54, 6, 52), 18, 0, 0),
    ("superwin", "SUPER WIN", 0.070, (255, 208, 128), (150, 22, 96), (60, 8, 58), 22, 0, 1),
    ("mega", "MEGA WIN", 0.056, (255, 226, 140), (176, 30, 92), (66, 10, 60), 26, 14, 2),
    ("epic", "EPIC WIN", 0.042, (255, 240, 176), (198, 40, 84), (72, 12, 62), 30, 20, 3),
    ("max", "MAX WIN", 0.028, (255, 252, 226), (224, 56, 72), (80, 14, 64), 34, 28, 4),
]


def build_win_banners(width=1000, height=560):
    for i, (name, word, inset, rim, top, bottom, bulbs, rays, fans) in enumerate(BANNER_TIERS):
        canvas = Image.new("RGBA", (width, height), (0, 0, 0, 0))
        pad_x, pad_y = width * inset, height * inset * 1.6
        box = [pad_x, pad_y, width - pad_x, height - pad_y]
        radius = int(height * 0.10)

        if rays:
            spray = Image.new("RGBA", (width, height), (0, 0, 0, 0))
            sdraw = ImageDraw.Draw(spray)
            reach = width * 0.9
            for r in range(rays):
                a0 = math.radians(r * (360.0 / rays))
                a1 = a0 + math.radians(360.0 / rays * 0.45)
                sdraw.polygon(
                    [(width / 2, height / 2),
                     (width / 2 + math.cos(a0) * reach, height / 2 + math.sin(a0) * reach),
                     (width / 2 + math.cos(a1) * reach, height / 2 + math.sin(a1) * reach)],
                    fill=rim + (54 + i * 8,),
                )
            canvas = Image.alpha_composite(canvas, spray.filter(ImageFilter.GaussianBlur(6)))

        shape = Image.new("RGBA", (width, height), (0, 0, 0, 0))
        ImageDraw.Draw(shape).rounded_rectangle(box, radius=radius, fill=(255, 255, 255, 255))
        canvas = Image.alpha_composite(
            canvas, _tint(shape, (0, 0, 0), 0.6).filter(ImageFilter.GaussianBlur(12))
        )
        plate = vertical_gradient((width, height), top, bottom).convert("RGBA")
        plate.putalpha(shape.getchannel("A"))
        canvas = Image.alpha_composite(canvas, plate)

        deco = Image.new("RGBA", (width, height), (0, 0, 0, 0))
        ddraw = ImageDraw.Draw(deco)
        ddraw.rounded_rectangle(box, radius=radius, outline=rim + (255,), width=max(4, 6 + i * 2))
        inner = [box[0] + 18, box[1] + 18, box[2] - 18, box[3] - 18]
        ddraw.rounded_rectangle(inner, radius=int(radius * 0.8), outline=rim + (150,), width=3)

        # Marquee bulbs, denser with the tier.
        for b in range(bulbs):
            t = b / float(bulbs)
            px, py = _perimeter(inner, t)
            r = 5 + i
            ddraw.ellipse([px - r, py - r, px + r, py + r], fill=rim + (255,))

        # Corner fans - a deco flourish that only appears from SUPER WIN up.
        for f in range(fans):
            step = 16 + f * 13
            for cx, cy, sx, sy in ((box[0], box[1], 1, 1), (box[2], box[1], -1, 1),
                                   (box[0], box[3], 1, -1), (box[2], box[3], -1, -1)):
                ddraw.line(
                    [(cx + sx * step, cy + sy * (step + 46)), (cx + sx * (step + 46), cy + sy * step)],
                    fill=rim + (190,), width=4,
                )
        canvas = Image.alpha_composite(canvas, deco.filter(ImageFilter.GaussianBlur(7)))
        canvas = Image.alpha_composite(canvas, deco)

        # Amount well - kept at the same place on every tier, because
        # components/Win.svelte draws the number at a fixed bh * 0.16.
        well = Image.new("RGBA", (width, height), (0, 0, 0, 0))
        wdraw = ImageDraw.Draw(well)
        wbox = [width * 0.12, height * 0.505, width * 0.88, height * 0.815]
        wdraw.rounded_rectangle(wbox, radius=int(height * 0.055), fill=(28, 4, 30, 190))
        wdraw.rounded_rectangle(wbox, radius=int(height * 0.055), outline=rim + (170,), width=3)
        canvas = Image.alpha_composite(canvas, well)

        canvas = Image.alpha_composite(
            canvas,
            neon_text_layer(word, (width, height), (width * 0.5, height * 0.315),
                            height * 0.175, width * 0.74, rim, (255, 96, 170), core=5),
        )
        canvas.save(os.path.join(BANNERS, f"{name}.png"))
        print(f"  banner {name}.png ({word})")


def _perimeter(box, t):
    """Point at fraction t around a rectangle's perimeter."""
    x0, y0, x1, y1 = box
    w, h = x1 - x0, y1 - y0
    per = 2 * (w + h)
    d = t * per
    if d < w:
        return x0 + d, y0
    d -= w
    if d < h:
        return x1, y0 + d
    d -= h
    if d < w:
        return x1 - d, y1
    d -= w
    return x0, y1 - d


# ---------------------------------------------------------------------------
# Store tile
# ---------------------------------------------------------------------------
def build_tile_scene(size):
    """Environmental background for the tile: sky, retrosun, grid, palms.

    Stake's Tile Editor composites Background + Foreground + Gradient + Title
    itself, and its background slot says plainly: no wording, no multipliers,
    bright and vibrant. So this layer carries NO text and no hero subject - the
    flamingo ships separately as the foreground element.
    """
    canvas = vertical_gradient((size, size), (92, 26, 172), (255, 74, 150)).convert("RGBA")
    canvas = Image.alpha_composite(
        canvas, radial_glow((size, size), (int(size * 0.14), int(size * 0.10)), int(size * 0.30), PALETTE["cyan"], 0.26)
    )
    canvas = Image.alpha_composite(
        canvas, radial_glow((size, size), (int(size * 0.88), int(size * 0.08)), int(size * 0.26), PALETTE["purple"], 0.30)
    )

    horizon = int(size * 0.60)
    canvas = Image.alpha_composite(
        canvas, radial_glow((size, size), (size // 2, horizon), int(size * 0.30), PALETTE["gold"], 0.35)
    )
    sun = _retrosun((size, size), (size // 2, horizon), int(size * 0.30), PALETTE["gold"], PALETTE["magenta"])
    ImageDraw.Draw(sun).rectangle([0, horizon, size, size], fill=(0, 0, 0, 0))
    canvas = Image.alpha_composite(canvas, sun)

    grid = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    grid_draw = ImageDraw.Draw(grid)
    for i in range(-14, 15):
        grid_draw.line(
            [(size // 2, horizon), (size // 2 + i * (size // 8), size)], fill=PALETTE["cyan"] + (70,), width=3
        )
    canvas = Image.alpha_composite(canvas, grid)

    palms = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    pdraw = ImageDraw.Draw(palms)
    _curved_palm(pdraw, (int(size * 0.11), int(size * 0.98)), size * 0.62, -1.0, ink=(22, 6, 46, 250))
    _curved_palm(pdraw, (int(size * 0.90), int(size * 1.00)), size * 0.54, 1.0, ink=(22, 6, 46, 250))
    return Image.alpha_composite(canvas, palms)


def build_tile_hero(size):
    """The flamingo alone on transparency - the tile's foreground element.

    Rendered without a plate and with headroom under the feet: the shipped hero
    had the foot bars at y=1002 of 1024, hard against the bottom edge, with no
    crop margin for the Tile Editor.
    """
    bird = dict(SYMBOLS["h3"])
    bird["width"] = 11
    art = render_object(bird, size=int(size * 0.86), plate=False, ss_factor=2)
    out = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    out.alpha_composite(art, (int(size * 0.07), int(size * 0.04)))
    return out


def build_tile_assets(size=1024):
    """The two images Stake's Tile Editor asks for, plus a composed preview."""
    background = build_tile_scene(size)
    background.convert("RGB").save(os.path.join(BRAND, "tile_background.png"))
    print(f"  tile_background.png ({size}x{size}, no wording)")

    hero = build_tile_hero(size)
    hero.save(os.path.join(BRAND, "tile_foreground.png"))
    print(f"  tile_foreground.png ({size}x{size}, transparent)")

    preview = background.copy()
    scaled = hero.resize((int(size * 0.62), int(size * 0.62)), Image.LANCZOS)
    preview.alpha_composite(scaled, (int(size * 0.19), int(size * 0.10)))
    preview = Image.alpha_composite(
        preview,
        neon_text_layer("HOT MIAMI", (size, size), (size * 0.5, size * 0.86),
                        size * 0.105, size * 0.86, PALETTE["white"], PALETTE["magenta"]),
    )
    preview.convert("RGB").save(os.path.join(BRAND, "thumbnail.png"))
    print(f"  thumbnail.png ({size}x{size}, composed preview - never the Background slot)")


def build_favicon():
    """Small neon diamond favicon."""
    icon = render_object(SYMBOLS["h1"], size=128, plate=False)
    plate = Image.new("RGBA", (128, 128), PALETTE["bg_deep"] + (255,))
    plate.alpha_composite(icon)
    plate.save(os.path.join(STATIC, "favicon.png"))
    print("  favicon.png")


def main():
    ensure_dirs()
    print("symbols:")
    build_symbols()
    print("banners:")
    build_win_banners()
    print("scene:")
    build_backgrounds()
    build_logo()
    build_tile_assets()
    build_favicon()
    print("done")


if __name__ == "__main__":
    main()
