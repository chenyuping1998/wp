"""Neon + material rendering primitives for the Hot Miami art pipeline.

Two material systems live here, because the symbol set uses two:

* **Neon-rimmed solid objects** (the five premiums, the three specials). A solid
  body is shaded with a real bevel and a specular sweep, and a saturated neon
  tube is laid around its contour. The neon *rims* the object; it is not the
  object. The first version of this pipeline had it the other way round - the
  body was drawn at 0.88 alpha over a near-black lower gradient stop, which
  composited to as little as dE 4.9 from the board colour and left the reels
  reading as wireframe outline art.

* **Chrome letterforms** (the four card royals). One desaturated material -
  a classic chrome ramp with a hard horizon band - extruded back to a dark
  edge. Typography is what a Pillow pipeline is actually good at, so the royals
  carry weight and depth while staying colourless, which frees the whole hue
  wheel for the premiums.

Requires numpy (used for the bevel/specular shading); Pillow alone cannot do it
at a sensible speed.
"""

import math

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

# ---------------------------------------------------------------------------
# Palette - Miami / 80s vice
# ---------------------------------------------------------------------------
PALETTE = {
    "bg_deep": (9, 6, 34),
    "bg_mid": (38, 12, 68),
    "bg_warm": (94, 24, 92),
    "magenta": (255, 46, 136),
    "pink": (255, 122, 178),
    "cyan": (0, 229, 255),
    "orange": (255, 107, 53),
    "gold": (255, 209, 102),
    "purple": (138, 63, 252),
    "mint": (46, 230, 168),
    "lime": (150, 255, 60),
    "white": (255, 255, 255),
    "ink": (14, 10, 38),
    # The reel cell colour, sampled from hotMiamiFrame/frame_bg.png. Its inner
    # 1000x1000 (the region BoardFrame maps to the board) is fully opaque and
    # averages (41.7, 10.2, 67.0), so this is the background EVERY symbol is
    # judged against, in every game mode.
    "board": (40, 10, 66),
}

# Premium hue assignments. Each of the five is used by exactly one premium; the
# audit found twelve symbols sharing four hue families with four inside 8 deg.
# Measured hue of each tube colour is in the comment.
PREMIUM_HUE = {
    "h1": (80, 240, 255),   # 185 deg  ice cyan
    "h2": (168, 108, 255),  # 265 deg  violet
    "h3": (255, 70, 150),   # 334 deg  rose magenta
    "h4": (255, 200, 40),   # 045 deg  amber
    "h5": (150, 255, 60),   # 092 deg  lime
}

# Identity colours for the three specials. They are NOT on the premium wheel:
# red 003 / spring-teal 155 / orchid 300 all sit at least 25 deg away from every
# premium hue above, so nothing on the board shares a hue with anything else.
SPECIAL_HUE = {
    "w": (255, 62, 52),    # 003 deg  red
    "s": (64, 255, 146),   # 145 deg  spring green
    "c": (232, 88, 250),   # 294 deg  orchid
}

# Chrome ramp for the card royals: light / mid / hard dark horizon / mid / light.
# Deliberately blue-grey, low saturation and pitched DARKER than a showroom
# chrome, because the royals must be clearly legible against the board without
# out-contrasting a premium - the old set had the 2x palm as the second-loudest
# object on the reels.
CHROME_STOPS = [
    (0.00, (203, 212, 234)),
    (0.34, (118, 127, 155)),
    (0.47, (38, 44, 68)),
    (0.53, (55, 62, 90)),
    (0.66, (131, 141, 167)),
    (1.00, (168, 178, 202)),
]
CHROME_EDGE = (12, 12, 30)
CHROME_EXTRUDE_NEAR = (72, 78, 106)
CHROME_EXTRUDE_FAR = (18, 19, 40)

SUPERSAMPLE = 3


def _blank(size):
    return Image.new("RGBA", (size, size), (0, 0, 0, 0))


def _tint(mask, color, alpha_scale=1.0):
    """Colourise an RGBA layer's alpha channel with a flat colour."""
    alpha = mask.getchannel("A")
    if alpha_scale != 1.0:
        alpha = alpha.point(lambda v: min(255, int(v * alpha_scale)))
    solid = Image.new("RGBA", mask.size, color + (255,))
    solid.putalpha(alpha)
    return solid


def _clip_alpha(layer, mask):
    """Clip a layer's alpha to a mask - used to keep sheens inside a shape."""
    layer.putalpha(
        Image.fromarray(np.minimum(np.asarray(layer.getchannel("A")), np.asarray(mask.getchannel("A"))))
    )
    return layer


# ---------------------------------------------------------------------------
# Gradients
# ---------------------------------------------------------------------------
def multi_gradient(size, stops):
    """Vertical gradient through an arbitrary list of (t, rgb) stops."""
    width, height = size
    stops = sorted(stops)
    grad = Image.new("RGB", (1, height))
    pixels = grad.load()
    for y in range(height):
        t = y / max(1, height - 1)
        lo, hi = stops[0], stops[-1]
        for i in range(len(stops) - 1):
            if stops[i][0] <= t <= stops[i + 1][0]:
                lo, hi = stops[i], stops[i + 1]
                break
        span = hi[0] - lo[0]
        k = 0.0 if span <= 0 else (t - lo[0]) / span
        pixels[0, y] = tuple(int(lo[1][c] + (hi[1][c] - lo[1][c]) * k) for c in range(3))
    return grad.resize((width, height), Image.BICUBIC)


def vertical_gradient(size, top, bottom):
    """Vertical linear gradient as an RGB image."""
    return multi_gradient(size, [(0.0, top), (1.0, bottom)])


def radial_glow(size, center, radius, color, strength=1.0):
    """Soft radial light blob on a transparent layer."""
    layer = Image.new("RGBA", size, (0, 0, 0, 0))
    ImageDraw.Draw(layer).ellipse(
        [center[0] - radius, center[1] - radius, center[0] + radius, center[1] + radius],
        fill=color + (int(255 * strength),),
    )
    return layer.filter(ImageFilter.GaussianBlur(radius * 0.55))


def scanlines(size, spacing=4, alpha=26):
    """Subtle CRT scanline overlay."""
    layer = Image.new("RGBA", size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)
    for y in range(0, size[1], spacing):
        draw.line([(0, y), (size[0], y)], fill=(0, 0, 0, alpha), width=1)
    return layer


# ---------------------------------------------------------------------------
# Curve helpers
#
# Straight polylines are what made the organic symbols read as crude clip-art.
# Painters lay out a few control points and let these smooth them.
# ---------------------------------------------------------------------------
def smooth(points, closed=False, steps=18):
    """Catmull-Rom spline through every control point."""
    pts = list(points)
    if len(pts) < 3:
        return pts
    ring = [pts[-1], *pts, pts[0], pts[1]] if closed else [pts[0], *pts, pts[-1]]
    out = []
    for i in range(len(ring) - 3):
        p0, p1, p2, p3 = ring[i : i + 4]
        for s in range(steps):
            t = s / steps
            t2, t3 = t * t, t * t * t
            out.append(
                tuple(
                    0.5
                    * (
                        2 * p1[j]
                        + (-p0[j] + p2[j]) * t
                        + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t2
                        + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * t3
                    )
                    for j in (0, 1)
                )
            )
    if not closed:
        out.append(pts[-1])
    return out


def qbez(a, b, c, steps=24):
    """Quadratic Bezier from a to c bowed towards b."""
    return [
        (
            (1 - t) ** 2 * a[0] + 2 * (1 - t) * t * b[0] + t * t * c[0],
            (1 - t) ** 2 * a[1] + 2 * (1 - t) * t * b[1] + t * t * c[1],
        )
        for t in (s / steps for s in range(steps + 1))
    ]


def frond(origin, ctrl, tip, width=0.055, steps=26):
    """Drooping palm frond: a curved spine with a tapering blade around it.

    A straight symmetric lens radiating from a point reads as a cannabis leaf,
    not a palm. Real fronds arch up out of the crown and fall away, so the
    spine is a Bezier and the blade tapers to nothing at the tip.
    """
    spine = qbez(origin, ctrl, tip, steps)
    count = len(spine)
    left, right = [], []
    for i, (x, y) in enumerate(spine):
        t = i / (count - 1)
        half = width * math.sin(math.pi * min(1.0, t * 1.2)) * (1 - t * 0.4)
        if i == 0:
            dx, dy = spine[1][0] - x, spine[1][1] - y
        elif i == count - 1:
            dx, dy = x - spine[-2][0], y - spine[-2][1]
        else:
            dx, dy = spine[i + 1][0] - spine[i - 1][0], spine[i + 1][1] - spine[i - 1][1]
        length = math.hypot(dx, dy) or 1.0
        nx, ny = -dy / length, dx / length
        left.append((x + nx * half, y + ny * half))
        right.append((x - nx * half, y - ny * half))
    return left + right[::-1]


def leaf(origin, tip, bow=0.12, steps=22):
    """Closed lens shape - a palm frond, a petal, a wing feather."""
    ox, oy = origin
    tx, ty = tip
    mx, my = (ox + tx) / 2, (oy + ty) / 2
    dx, dy = tx - ox, ty - oy
    length = math.hypot(dx, dy) or 1.0
    nx, ny = -dy / length, dx / length
    return qbez(origin, (mx + nx * bow, my + ny * bow), tip, steps) + qbez(
        tip, (mx - nx * bow, my - ny * bow), origin, steps
    )


# ---------------------------------------------------------------------------
# Shading
# ---------------------------------------------------------------------------
def emboss(mask, radius, bump=3.0, light=(-0.62, -0.78)):
    """Lambert term for a bevel built from a mask, as a float array in -1..1.

    The mask is blurred into a height field, its gradient gives a surface
    normal, and the normal is dotted with a fixed light. The flat-surface
    response is subtracted so a flat interior comes out at exactly 0 and only
    the bevelled edges are shaded - otherwise the whole body shifts value and
    the gradient stops stop meaning what they say.
    """
    radius = max(1, int(radius))
    height = np.asarray(mask.filter(ImageFilter.GaussianBlur(radius)).getchannel("A"), dtype=np.float64) / 255.0
    gy, gx = np.gradient(height)
    nx, ny, nz = -gx * bump * radius, -gy * bump * radius, 1.0
    norm = np.sqrt(nx * nx + ny * ny + nz * nz)
    lx, ly, lz = light[0], light[1], 0.62
    lm = math.sqrt(lx * lx + ly * ly + lz * lz)
    return np.clip((nx * lx + ny * ly + nz * lz) / (norm * lm) - lz / lm, -1.0, 1.0)


def material(
    mask,
    stops,
    bevel=0.045,
    bump=3.0,
    diffuse=0.62,
    occlusion=0.42,
    spec_gain=0.55,
    spec_power=7.0,
    light=(-0.62, -0.78),
):
    """Shade a solid mask: vertical gradient, bevel, ambient occlusion, specular.

    `stops` is a list of (t, rgb). This is the function that gives a symbol a
    body you can see - it is deliberately opaque, and no stop should sit near
    the board colour or the lower half of the symbol dissolves into the reel.
    """
    size = mask.size[0]
    base = np.asarray(multi_gradient(mask.size, stops), dtype=np.float64) / 255.0
    lit = emboss(mask, size * bevel, bump, light)[..., None]
    out = base * (1.0 + diffuse * lit)
    out *= 1.0 - occlusion * np.clip(-lit, 0.0, 1.0)
    out += spec_gain * np.clip(lit, 0.0, 1.0) ** spec_power
    img = Image.fromarray((np.clip(out, 0.0, 1.0) * 255).astype(np.uint8), "RGB").convert("RGBA")
    img.putalpha(mask.getchannel("A"))
    return img


def extrude(mask, dx, dy, layers, near, far):
    """Stack offset copies of a mask back to front - a solid 3D side wall.

    This is what gives the card royals their weight. Drawn far to near with a
    plain paste, so each nearer slice covers the one behind it.
    """
    out = Image.new("RGBA", mask.size, (0, 0, 0, 0))
    for i in range(layers, 0, -1):
        t = i / layers
        color = tuple(int(far[c] + (near[c] - far[c]) * (1.0 - t)) for c in range(3))
        out.paste(_tint(mask, color), (int(round(dx * t)), int(round(dy * t))), mask)
    return out


def outline(mask, width, color):
    """Hard outline hugging a mask, drawn outside it.

    Grown with a blur-and-threshold rather than a MaxFilter: MaxFilter at the
    kernel sizes this needs on a 768px supersampled canvas costs seconds per
    symbol, and the thresholded blur is visually identical.
    """
    width = max(1.0, float(width))
    grown = Image.new("RGBA", mask.size, (0, 0, 0, 0))
    grown.putalpha(
        mask.getchannel("A")
        .filter(ImageFilter.GaussianBlur(width * 0.85))
        .point(lambda v: 255 if v > 30 else 0)
    )
    ring = Image.new("RGBA", mask.size, color + (255,))
    ring.putalpha(grown.getchannel("A"))
    return ring


# ---------------------------------------------------------------------------
# Backing plate
# ---------------------------------------------------------------------------
# Rank 0 (H1) gets the lightest, richest cell and rank 4 (H5) the plainest, so
# value separation is carried by the plate itself. The old plate composited to
# dE 3.70 from the board at its midpoint - it crossed the board's own luminance
# and read as a selected-cell highlight rather than as value. Every stop here
# sits ABOVE the board (40,10,66) in luminance; the ramp is monotone so the
# measured contrast of a cell tracks its pay.
PLATE_RAMP = [
    ((216, 222, 252), (116, 106, 186)),
    ((180, 186, 228), (90, 81, 156)),
    ((146, 152, 198), (70, 62, 130)),
    ((108, 114, 158), (50, 44, 100)),
    ((82, 87, 128), (38, 33, 82)),
]
# The identity wash is strongest on the top payer and nearly gone on the
# cheapest premium, so hue saturation is part of the value ladder too. So is the
# tint strength: amber and lime are chromatically far from the board, so at equal
# luminance they out-measure violet and rose, and the ladder would invert if
# every premium's cell were tinted equally hard.
PLATE_WASH_ALPHA = [0.44, 0.36, 0.30, 0.13, 0.07]
# Ranks 3-4 are nearly untinted on purpose. Amber and lime mixed into a violet
# steel plate go BROWN and OLIVE - and olive is the exact inherited GoBananas
# colour five separate passes have been chipping out of this game. The two
# cheapest premiums keep a neutral cell and let the object carry the hue, which
# also means a coloured cell is itself a top-tier cue.
PLATE_TINT_K = [0.62, 0.54, 0.46, 0.16, 0.10]
# One neutral platinum rim for every premium, dimming with rank. The rim used to
# be tinted with the symbol's own colour, which makes it part of the subject
# rather than a rank cue.
PLATE_RIM = [
    (255, 252, 240),
    (236, 232, 224),
    (212, 210, 208),
    (186, 186, 190),
    (158, 160, 170),
]


def _luma(c):
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]


def tint_stop(base, hue, k=0.55):
    """Blend a neutral plate stop toward an identity hue at CONSTANT luminance.

    Renormalising to the neutral's luminance is the point: it lets each premium's
    cell carry its own colour without disturbing the rank ladder, which is what
    makes measured contrast track the paytable.
    """
    mixed = [base[i] * (1 - k) + hue[i] * k for i in range(3)]
    scale = _luma(base) / max(1.0, _luma(mixed))
    return tuple(int(max(0, min(255, v * scale))) for v in mixed)


def premium_plate(size, rank=0, inset=0.045, special=None, wash=None, wash_alpha=None):
    """Rounded value cell behind a premium or special symbol.

    `rank` 0..4 selects how light the cell is; `special` overrides the ramp with
    an explicit (top, bottom, rim) for the Wild / Scatter / Collector family, who
    are not on the pay ladder and should not sit anywhere on it.

    `wash` is the symbol's identity hue, laid in as a soft radial tint inside the
    plate. It is what makes the *cell* carry the colour - Hacksaw's device, where
    each premium sits on a plate in its own colour - and it survives to 26px long
    after the drawing inside it has stopped being readable. It is deliberately a
    soft gradient, not a second hard contour: the old plate's tinted rim added an
    outline that fought the symbol's own.
    """
    if special is not None:
        top, bottom, rim_color = special
        rings = 2
        wash_alpha = 0.26 if wash_alpha is None else wash_alpha
    else:
        rank = max(0, min(len(PLATE_RAMP) - 1, rank))
        top, bottom = PLATE_RAMP[rank]
        rim_color = PLATE_RIM[rank]
        rings = 2 if rank <= 1 else 1
        wash_alpha = PLATE_WASH_ALPHA[rank] if wash_alpha is None else wash_alpha
        if wash is not None:
            k = PLATE_TINT_K[rank]
            dark = tuple(int(c * 0.42) for c in wash)
            top, bottom = tint_stop(top, wash, k), tint_stop(bottom, dark, k)

    pad = size * inset
    box = [pad, pad, size - pad, size - pad]
    radius = int(size * 0.19)

    shape = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    ImageDraw.Draw(shape).rounded_rectangle(box, radius=radius, fill=(255, 255, 255, 255))

    body = material(
        shape,
        [(0.0, top), (0.55, tuple(int(c * 0.74) for c in top)), (1.0, bottom)],
        bevel=0.030,
        bump=2.4,
        diffuse=0.5,
        occlusion=0.3,
        spec_gain=0.28,
        spec_power=9.0,
    )

    out = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    # Drop shadow so the cell sits proud of the reel rather than in it.
    out = Image.alpha_composite(
        out, _tint(shape, (0, 0, 0), 0.55).filter(ImageFilter.GaussianBlur(size * 0.022))
    )
    out = Image.alpha_composite(out, body)

    if wash is not None:
        tint = radial_glow((size, size), (size // 2, int(size * 0.52)), int(size * 0.40), wash, wash_alpha)
        out = Image.alpha_composite(out, _clip_alpha(tint, shape))

    rim = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    rim_draw = ImageDraw.Draw(rim)
    rim_draw.rounded_rectangle(box, radius=radius, outline=rim_color + (255,), width=max(2, int(size * 0.016)))
    if rings == 2:
        inner = size * (inset + 0.055)
        rim_draw.rounded_rectangle(
            [inner, inner, size - inner, size - inner],
            radius=int(radius * 0.78),
            outline=rim_color + (150,),
            width=max(1, int(size * 0.006)),
        )
    out = Image.alpha_composite(out, _tint(rim.filter(ImageFilter.GaussianBlur(size * 0.018)), rim_color, 0.6))
    out = Image.alpha_composite(out, rim)

    # Top sheen: a bright band across the upper third reads as a lit surface.
    sheen_mask = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    ImageDraw.Draw(sheen_mask).rounded_rectangle(
        [pad, pad, size - pad, size * 0.42], radius=radius, fill=(255, 255, 255, 70)
    )
    sheen = _clip_alpha(sheen_mask.filter(ImageFilter.GaussianBlur(size * 0.03)), shape)
    return Image.alpha_composite(out, sheen)


# ---------------------------------------------------------------------------
# Compositors
# ---------------------------------------------------------------------------
def render_neon(
    paint,
    color,
    size=256,
    core_width=9,
    glow_color=None,
    bloom=(30, 16, 7),
    bloom_alpha=(0.55, 0.75, 1.0),
    core=True,
):
    """Composite a neon sign from a paint callback (used for text and the frame).

    `paint(draw, width, color, box)` is invoked at several stroke widths; `box`
    is the supersampled canvas size, not the output size.
    """
    ss = size * SUPERSAMPLE
    glow_color = glow_color or color

    def layer(width, col):
        img = Image.new("RGBA", (ss, ss), (0, 0, 0, 0))
        paint(ImageDraw.Draw(img), max(1, int(width * SUPERSAMPLE)), col, ss)
        return img

    out = Image.new("RGBA", (ss, ss), (0, 0, 0, 0))
    for radius, alpha in zip(bloom, bloom_alpha):
        halo = layer(core_width + radius * 0.35, glow_color)
        halo = halo.filter(ImageFilter.GaussianBlur(radius * SUPERSAMPLE * 0.5))
        out = Image.alpha_composite(out, _tint(halo, glow_color, alpha * 0.5))
    out = Image.alpha_composite(out, layer(core_width, color))
    if core:
        inner = layer(max(2, core_width * 0.38), PALETTE["white"])
        out = Image.alpha_composite(out, _tint(inner, PALETTE["white"], 0.9))
    return out.resize((size, size), Image.LANCZOS)


def _mask_from(painter, ss):
    img = Image.new("RGBA", (ss, ss), (0, 0, 0, 0))
    painter(ImageDraw.Draw(img), ss)
    return img


CONTOUR = (10, 6, 24)


def _object_layer(spec, ss, contour=True):
    """The drawing itself - dark contour, shaded solid body, detail, neon tube.

    Returned on transparency with no plate, which is also how the contact sheet
    measures artwork-only silhouette IoU and ink coverage.
    """
    tube = spec["tube"]
    glow = spec.get("glow", tube)
    core_width = spec.get("width", 9) * ss / (256.0 * SUPERSAMPLE)

    def stroke_layer(width, col):
        img = Image.new("RGBA", (ss, ss), (0, 0, 0, 0))
        spec["stroke"](ImageDraw.Draw(img), max(1, int(width * SUPERSAMPLE)), col, ss)
        return img

    out = Image.new("RGBA", (ss, ss), (0, 0, 0, 0))
    body_mask = _mask_from(spec["fill"], ss) if spec.get("fill") else None

    # Outer bloom. Reduced from the old three-layer 30/16/7 stack: a broad soft
    # bloom over a solid body just fogs it, and averaging to mud at reel size is
    # exactly what the audit measured.
    for radius, alpha in ((13, 0.38), (5, 0.55)):
        halo = stroke_layer(core_width + radius * 0.3, glow)
        halo = halo.filter(ImageFilter.GaussianBlur(radius * SUPERSAMPLE * 0.5))
        out = Image.alpha_composite(out, _tint(halo, glow, alpha * 0.5))

    if body_mask is not None:
        # Contact shadow, then a hard dark contour. The contour is what gives the
        # shape a silhouette on a light plate; Hacksaw outlines every symbol.
        out = Image.alpha_composite(
            out, _tint(body_mask, (0, 0, 0), 0.5).filter(ImageFilter.GaussianBlur(ss * 0.012))
        )
        if contour:
            out = Image.alpha_composite(out, outline(body_mask, ss * 0.011, CONTOUR))
        out = Image.alpha_composite(out, material(body_mask, spec["body"], **spec.get("shading", {})))
        if spec.get("detail"):
            detail_mask = _mask_from(spec["detail"], ss)
            out = Image.alpha_composite(
                out, material(detail_mask, spec.get("detail_body", spec["body"]), bevel=0.02, bump=2.0)
            )

    out = Image.alpha_composite(out, stroke_layer(core_width, tube))
    if spec.get("core", True):
        inner = stroke_layer(max(2, core_width * 0.34), PALETTE["white"])
        out = Image.alpha_composite(out, _tint(inner, PALETTE["white"], 0.85))
    return out


def render_object(spec, size=256, plate=True, ss_factor=SUPERSAMPLE):
    """The premium compositor: ranked value plate, hue wash, drawing on top.

    spec keys:
        fill(draw, box)                  solid body mask - the silhouette
        stroke(draw, width, color, box)  neon tubing and interior detail
        detail(draw, box)                optional second mask drawn over the body
        body     list of (t, rgb) material stops - none may sit near the board
        tube     saturated neon colour, one hue per premium
        glow     bloom colour
        width    tube width
        rank     0..4 -> plate lightness, or None for no plate
    """
    # ss_factor is dropped below 3 for the 1024px store-tile hero: material()
    # works in float64, and a 3072px supersample would allocate ~700 MB.
    ss = int(size * ss_factor)
    out = Image.new("RGBA", (ss, ss), (0, 0, 0, 0))
    if plate and spec.get("rank") is not None:
        out = premium_plate(ss, rank=spec["rank"], wash=spec.get("wash", spec["tube"]))
    out = Image.alpha_composite(out, _object_layer(spec, ss))
    return out.resize((size, size), Image.LANCZOS)


# ---------------------------------------------------------------------------
# Specials: one plate + badge + word family
# ---------------------------------------------------------------------------
def fit_text(text, font_for, ss, cx, cy, max_w, max_h, stroke_frac=0.010):
    """White text mask fitted into a box, centred on (cx, cy) in pixels.

    Re-fits by measuring rather than trusting a point size, so "WILD" and
    "SCATTER" end up optically the same weight in their bands.
    """
    probe_size = max(8, int(ss * 0.22))
    probe = font_for(probe_size)
    measure = ImageDraw.Draw(Image.new("L", (8, 8)))
    pbox = measure.textbbox((0, 0), text, font=probe, stroke_width=0)
    pw, ph = max(1, pbox[2] - pbox[0]), max(1, pbox[3] - pbox[1])
    font = font_for(max(8, int(probe_size * min(max_w / pw, max_h / ph))))
    stroke = max(1, int(ss * stroke_frac))

    box = measure.textbbox((0, 0), text, font=font, stroke_width=stroke)
    mask = Image.new("RGBA", (ss, ss), (0, 0, 0, 0))
    ImageDraw.Draw(mask).text(
        (cx - (box[0] + box[2]) / 2, cy - (box[1] + box[3]) / 2), text, font=font,
        fill=(255, 255, 255, 255), stroke_width=stroke, stroke_fill=(255, 255, 255, 255),
    )
    return mask


def render_word(spec, font_for, size=256, plate=True):
    """Wild / Scatter / Collector: dark identity plate, badge, word.

    The three specials used to be four unrelated treatments (a bare gold letter,
    bare mint letters, a starburst, a heart) with no shared cue saying "this is
    not a paying symbol". Here they share a plate shape, a rim, a ribbon and a
    typeface, and differ only in hue, badge and word.
    """
    ss = size * SUPERSAMPLE
    out = (
        premium_plate(ss, special=spec["special"], wash=spec.get("wash"), wash_alpha=0.26)
        if plate else Image.new("RGBA", (ss, ss), (0, 0, 0, 0))
    )

    if spec.get("badge_fill"):
        bs = int(ss * spec.get("badge_scale", 0.62))
        badge_spec = {
            "fill": spec["badge_fill"], "stroke": spec["badge_stroke"],
            "body": spec["badge_body"], "tube": spec["badge_tube"],
            "glow": spec.get("badge_glow", spec["badge_tube"]),
            "width": spec.get("badge_width", 9),
            "detail": spec.get("badge_detail"), "detail_body": spec.get("badge_detail_body"),
        }
        badge = _object_layer(badge_spec, bs)
        out.alpha_composite(badge, (int((ss - bs) / 2), int(ss * spec.get("badge_y", 0.02))))

    word_font = (lambda px: font_for(px, weight=700)) if spec.get("ribbon") else font_for
    word_y = spec.get("word_y", 0.0)
    cy = ss * (0.5 + word_y)

    if spec.get("ribbon"):
        # x inset 0.115, not 0.055: the plate's corner radius is 0.19, so a band
        # this low in the cell overhangs the rounded corners at the full width.
        band_h = ss * 0.215
        band_x0, band_x1 = ss * 0.115, ss * 0.885
        band = Image.new("RGBA", (ss, ss), (0, 0, 0, 0))
        ImageDraw.Draw(band).rounded_rectangle(
            [band_x0, cy - band_h / 2, band_x1, cy + band_h / 2],
            radius=int(band_h * 0.34), fill=(255, 255, 255, 255),
        )
        out = Image.alpha_composite(
            out, _tint(band, (0, 0, 0), 0.45).filter(ImageFilter.GaussianBlur(ss * 0.012))
        )
        out = Image.alpha_composite(
            out, material(band, [(0.0, spec["ribbon"][0]), (1.0, spec["ribbon"][1])],
                          bevel=0.018, bump=2.2, diffuse=0.45, occlusion=0.3, spec_gain=0.22),
        )
        ring = Image.new("RGBA", (ss, ss), (0, 0, 0, 0))
        ImageDraw.Draw(ring).rounded_rectangle(
            [band_x0, cy - band_h / 2, band_x1, cy + band_h / 2],
            radius=int(band_h * 0.34), outline=spec["rim"] + (255,), width=max(2, int(ss * 0.008)),
        )
        out = Image.alpha_composite(out, ring)
        max_w, max_h = (band_x1 - band_x0) * 0.90, band_h * 0.62
    else:
        max_w, max_h = ss * spec.get("coverage", 0.82), ss * 0.30

    face = fit_text(spec["text"], word_font, ss, ss * 0.5, cy, max_w, max_h)
    out = Image.alpha_composite(
        out, _tint(face, (0, 0, 0), 0.55).filter(ImageFilter.GaussianBlur(ss * 0.014))
    )
    # No extrude on the word. "SCATTER" is 7 letters inside a 113px cell; a 3D
    # side wall closes the counters and the whole word turns into a smear.
    out = Image.alpha_composite(out, outline(face, ss * 0.007, spec.get("word_edge", CHROME_EDGE)))
    out = Image.alpha_composite(
        out,
        material(face, spec["word_stops"], bevel=0.020, bump=3.2, diffuse=0.5,
                 occlusion=0.3, spec_gain=0.5, spec_power=6.5),
    )
    return out.resize((size, size), Image.LANCZOS)


def render_chrome_letter(text, font_for, size=256, coverage=0.74, stops=None, rim=None):
    """The card-royal compositor: one desaturated chrome letterform, extruded.

    `font_for(px)` returns a PIL font at the requested pixel size. The glyph is
    measured and re-fitted so its ink box fills `coverage` of the canvas, which
    is what keeps A / K / Q / J optically the same weight - trusting a single
    point size gives a fat K and a thin J.
    """
    ss = size * SUPERSAMPLE
    stops = stops or CHROME_STOPS

    probe_size = int(ss * 0.5)
    probe = font_for(probe_size)
    measure = ImageDraw.Draw(Image.new("L", (8, 8)))
    pbox = measure.textbbox((0, 0), text, font=probe, stroke_width=0)
    pw, ph = max(1, pbox[2] - pbox[0]), max(1, pbox[3] - pbox[1])
    font = font_for(max(8, int(probe_size * (ss * coverage) / max(pw, ph))))
    stroke = max(1, int(ss * 0.012))

    box = measure.textbbox((0, 0), text, font=font, stroke_width=stroke)
    ox = (ss - (box[2] - box[0])) / 2 - box[0]
    oy = (ss - (box[3] - box[1])) / 2 - box[1] - ss * 0.03

    face = Image.new("RGBA", (ss, ss), (0, 0, 0, 0))
    ImageDraw.Draw(face).text(
        (ox, oy), text, font=font, fill=(255, 255, 255, 255),
        stroke_width=stroke, stroke_fill=(255, 255, 255, 255),
    )

    out = Image.new("RGBA", (ss, ss), (0, 0, 0, 0))
    shadow = _tint(face, (0, 0, 0), 0.6).filter(ImageFilter.GaussianBlur(ss * 0.02))
    out.alpha_composite(shadow, (int(ss * 0.012), int(ss * 0.022)))
    out = Image.alpha_composite(
        out, extrude(face, ss * 0.045, ss * 0.055, 22, CHROME_EXTRUDE_NEAR, CHROME_EXTRUDE_FAR)
    )
    out = Image.alpha_composite(out, outline(face, ss * 0.010, CHROME_EDGE))
    out = Image.alpha_composite(
        out,
        material(face, stops, bevel=0.026, bump=3.4, diffuse=0.55,
                 occlusion=0.34, spec_gain=0.62, spec_power=6.0),
    )

    # Cool rim light along the top-left, the one chromatic note the royals get.
    if rim:
        band = np.clip(emboss(face, ss * 0.020, 3.8), 0, 1) ** 3.0
        rim_layer = Image.fromarray(
            np.dstack([np.full(band.shape, c, dtype=np.uint8) for c in rim] + [(band * 210).astype(np.uint8)]),
            "RGBA",
        )
        out = Image.alpha_composite(out, _clip_alpha(rim_layer, face))

    return out.resize((size, size), Image.LANCZOS)
