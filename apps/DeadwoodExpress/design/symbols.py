"""Symbol geometry for Hot Miami.

Three families, deliberately built from three different devices so a player can
rank them without reading them:

* **Card royals** (`l1`..`l4` = A / K / Q / J). One desaturated chrome material,
  no backing plate, drawn small. Typography is what a Pillow pipeline does well,
  and making the lows colourless hands the entire hue wheel to the premiums.

* **Premiums** (`h1`..`h5`). Each gets a rank-ramped value plate washed in **one
  hue used by no other symbol**, a solid shaded body with a hard dark contour,
  and a neon rim. The audit found twelve symbols sharing four hue families with
  four of them inside 8 degrees of each other.

* **Specials** (`w`, `s`/`fs`, `c`). One plate + ribbon + word family in three
  hues that sit on none of the premium slots, so they read as "not a paying
  symbol" before they are read at all.

**Silhouette budget.** The audit's worst defect was h4 boombox vs h5 convertible
at IoU 0.60 - two premiums that were both "warm horizontal mass with two circles
low". Five large objects in one square cell will always overlap somewhat, so the
five are given five deliberately different gross extents and the contact sheet
re-measures the whole IoU matrix on every run:

    h1  large centred rhombus, full height      (0.16-0.84 x 0.05-0.95)
    h2  wide low band with a stepped spire      (0.055-0.945 x 0.135-0.90)
    h3  tall asymmetric diagonal, hooked bill   (0.126-0.898 x 0.072-0.952)
    h4  compact upright block, handle above     (0.235-0.765 x 0.17-0.775)
    h5  wide low wedge, streaks trailing left   (0.00-0.96 x 0.40-0.85)

Painters take normalised 0..1 coordinates scaled by `box`, the supersampled
canvas size chosen by the compositor - never a fixed 256.

    fill(draw, box)                  solid body mask -> the silhouette
    stroke(draw, width, color, box)  neon tubing and interior detail
    detail(draw, box)                second mask shaded over the body
"""

import math

from neon import PALETTE, PREMIUM_HUE, SPECIAL_HUE, smooth

WHITE = (255, 255, 255, 255)


# ---------------------------------------------------------------------------
# Drawing helpers
# ---------------------------------------------------------------------------
def _pts(pairs, box):
    return [(x * box, y * box) for x, y in pairs]


def _line(draw, pairs, box, width, color):
    draw.line(_pts(pairs, box), fill=color + (255,), width=width, joint="curve")


def _poly(draw, pairs, box, width, color):
    points = _pts(pairs, box)
    draw.line(points + [points[0]], fill=color + (255,), width=width, joint="curve")


def _solid(draw, pairs, box):
    draw.polygon(_pts(pairs, box), fill=WHITE)


def _ellipse(draw, cx, cy, rx, ry, box, width, color):
    draw.ellipse(
        [(cx - rx) * box, (cy - ry) * box, (cx + rx) * box, (cy + ry) * box],
        outline=color + (255,), width=width,
    )


def _disc(draw, cx, cy, rx, ry, box):
    draw.ellipse([(cx - rx) * box, (cy - ry) * box, (cx + rx) * box, (cy + ry) * box], fill=WHITE)


def _arc(draw, cx, cy, rx, ry, start, end, box, width, color):
    draw.arc(
        [(cx - rx) * box, (cy - ry) * box, (cx + rx) * box, (cy + ry) * box],
        start, end, fill=color + (255,), width=width,
    )


def _arc_mask(draw, cx, cy, rx, ry, start, end, box, width):
    """Thick arc painted into a mask - a solid band, not an outline."""
    draw.arc(
        [(cx - rx) * box, (cy - ry) * box, (cx + rx) * box, (cy + ry) * box],
        start, end, fill=WHITE, width=max(1, int(width * box)),
    )


def _rect(draw, x0, y0, x1, y1, box):
    draw.rectangle([x0 * box, y0 * box, x1 * box, y1 * box], fill=WHITE)


def _round_rect(draw, x0, y0, x1, y1, r, box):
    draw.rounded_rectangle([x0 * box, y0 * box, x1 * box, y1 * box], radius=int(r * box), fill=WHITE)


def _band(points, half, half_end=None, steps=18):
    """Closed outline of a constant-width band running along a spline.

    Used for the flamingo's neck: a `draw.line` gives a filled stroke but no
    contour to lay the neon tube on, and the old bird's neck was a uniform tube
    with no outline at all, which is half of why it read as a duck.
    """
    spine = smooth(points, steps=steps)
    n = len(spine)
    half_end = half if half_end is None else half_end
    left, right = [], []
    for i, (x, y) in enumerate(spine):
        w = half + (half_end - half) * (i / max(1, n - 1))
        if i == 0:
            dx, dy = spine[1][0] - x, spine[1][1] - y
        elif i == n - 1:
            dx, dy = x - spine[-2][0], y - spine[-2][1]
        else:
            dx, dy = spine[i + 1][0] - spine[i - 1][0], spine[i + 1][1] - spine[i - 1][1]
        length = math.hypot(dx, dy) or 1.0
        nx, ny = -dy / length, dx / length
        left.append((x + nx * w, y + ny * w))
        right.append((x - nx * w, y - ny * w))
    return left + right[::-1]


def _half(width):
    return max(1, width // 2)


def _third(width):
    return max(1, width // 3)


# ===========================================================================
# H1 - Neon Diamond   rank 0, hue 187 (ice cyan)
# Silhouette category: large centred rhombus, single point at the bottom, full
# cell height. Narrowed from the old 0.045-0.955 so it stops being a superset of
# every other premium's mask.
# ===========================================================================
DIAMOND = [
    (0.50, 0.052), (0.735, 0.150), (0.842, 0.400),
    (0.50, 0.948), (0.158, 0.400), (0.265, 0.150),
]


def diamond_fill(draw, box):
    _solid(draw, DIAMOND, box)


def diamond_stroke(draw, width, color, box):
    _poly(draw, DIAMOND, box, width, color)
    _line(draw, [(0.158, 0.400), (0.842, 0.400)], box, _half(width), color)      # girdle
    _poly(draw, [(0.345, 0.196), (0.655, 0.196), (0.762, 0.400), (0.238, 0.400)], box, _half(width), color)
    for a, b in (((0.345, 0.196), (0.265, 0.150)), ((0.655, 0.196), (0.735, 0.150)),
                 ((0.238, 0.400), (0.265, 0.150)), ((0.762, 0.400), (0.735, 0.150)),
                 ((0.345, 0.196), (0.50, 0.052)), ((0.655, 0.196), (0.50, 0.052))):
        _line(draw, [a, b], box, _third(width), color)
    for x in (0.238, 0.369, 0.50, 0.631, 0.762):
        _line(draw, [(x, 0.400), (0.50, 0.948)], box, _third(width), color)


# ===========================================================================
# H2 - Art-deco skyline   rank 1, hue 266 (violet)
# Was a filled retrosun with outline-only towers: unreadable at reel size, and
# it duplicated the background motif, which is the wallpaper of the whole game.
# The sun is gone entirely. The buildings now carry all the mass in a wide low
# band with two stepped mid towers and a central spire, and the lit-window grid
# is an internal texture no other symbol has.
# Silhouette category: wide bottom band + thin vertical spire.
# ===========================================================================
SKYLINE = [
    (0.055, 0.900), (0.055, 0.665), (0.135, 0.665), (0.135, 0.600), (0.215, 0.600),
    (0.215, 0.475), (0.245, 0.475), (0.245, 0.425), (0.305, 0.425), (0.305, 0.475),
    (0.335, 0.475), (0.335, 0.600), (0.405, 0.600),
    (0.405, 0.335), (0.437, 0.335), (0.437, 0.255), (0.4825, 0.255), (0.4825, 0.135),
    (0.5175, 0.135), (0.5175, 0.255), (0.563, 0.255), (0.563, 0.335), (0.595, 0.335),
    (0.595, 0.600), (0.665, 0.600), (0.665, 0.475), (0.695, 0.475), (0.695, 0.425),
    (0.755, 0.425), (0.755, 0.475), (0.785, 0.475), (0.785, 0.600), (0.865, 0.600),
    (0.865, 0.665), (0.945, 0.665), (0.945, 0.900),
]
# (x0, x1, y, count) - lit window bands, two per row
WINDOW_ROWS = [
    (0.085, 0.115, 0.700, 1), (0.085, 0.115, 0.775, 1), (0.085, 0.115, 0.850, 1),
    (0.885, 0.915, 0.700, 1), (0.885, 0.915, 0.775, 1), (0.885, 0.915, 0.850, 1),
    (0.165, 0.195, 0.635, 1), (0.165, 0.195, 0.710, 1), (0.165, 0.195, 0.785, 1),
    (0.805, 0.835, 0.635, 1), (0.805, 0.835, 0.710, 1), (0.805, 0.835, 0.785, 1),
    (0.240, 0.310, 0.510, 2), (0.240, 0.310, 0.585, 2), (0.240, 0.310, 0.660, 2),
    (0.240, 0.310, 0.735, 2), (0.240, 0.310, 0.810, 2),
    (0.690, 0.760, 0.510, 2), (0.690, 0.760, 0.585, 2), (0.690, 0.760, 0.660, 2),
    (0.690, 0.760, 0.735, 2), (0.690, 0.760, 0.810, 2),
    (0.428, 0.572, 0.375, 2), (0.428, 0.572, 0.450, 2), (0.428, 0.572, 0.525, 2),
    (0.428, 0.572, 0.600, 2), (0.428, 0.572, 0.675, 2), (0.428, 0.572, 0.750, 2),
    (0.428, 0.572, 0.825, 2),
]


def skyline_fill(draw, box):
    _solid(draw, SKYLINE, box)


def skyline_windows(draw, box):
    for x0, x1, y, count in WINDOW_ROWS:
        step = (x1 - x0) / count
        for i in range(count):
            _rect(draw, x0 + i * step, y, x0 + i * step + step * 0.62, y + 0.030, box)


def skyline_stroke(draw, width, color, box):
    _poly(draw, SKYLINE, box, width, color)
    # Deco setbacks: the horizontal banding that says "1930s Miami Beach".
    _line(draw, [(0.437, 0.335), (0.563, 0.335)], box, _third(width), color)
    _line(draw, [(0.4825, 0.255), (0.5175, 0.255)], box, _third(width), color)
    _line(draw, [(0.055, 0.900), (0.945, 0.900)], box, width, color)
    _line(draw, [(0.055, 0.790), (0.945, 0.790)], box, _third(width), color)


# ===========================================================================
# H3 - Flamingo   rank 2, hue 330 (hot pink)
# Rebuilt from the audit: the old bird was a plain egg with a uniform tube neck,
# a spoonbill beak and 1px legs. Body is fuller and lower, the neck is a real S,
# the beak has a kinked tip, the wing is a filled shape and the legs are solid
# with visible feet. A short thick neck turns a flamingo into a duck, so the
# neck stays long and the head small.
# Silhouette category: tall asymmetric diagonal with a hooked top.
# ===========================================================================
FLAMINGO_BODY = [
    (0.472, 0.590), (0.556, 0.520), (0.686, 0.512), (0.812, 0.552),
    (0.902, 0.538), (0.880, 0.622), (0.858, 0.716), (0.760, 0.800),
    (0.626, 0.826), (0.508, 0.780), (0.450, 0.690),
]
# The neck TAPERS - wide where it leaves the shoulder, narrow at the head. A
# constant-width tube plus an equally fat bill is what made the first cut read
# as a balloon animal.
FLAMINGO_NECK = [(0.566, 0.672), (0.470, 0.486), (0.418, 0.326), (0.414, 0.192)]
FLAMINGO_NECK_HALF = (0.046, 0.024)
FLAMINGO_HEAD = (0.406, 0.132, 0.048)
# Deep at the base, hooked hard down at the tip, and clearly narrower than the
# head where the two meet.
FLAMINGO_BILL = [
    (0.390, 0.094), (0.332, 0.152), (0.288, 0.236), (0.336, 0.240),
    (0.362, 0.184), (0.408, 0.158),
]
FLAMINGO_LEGS = (
    ((0.604, 0.796), (0.584, 0.880), (0.604, 0.958)),
    ((0.712, 0.788), (0.734, 0.874), (0.712, 0.958)),
)
# A crescent lying along the back, not a bean in the middle of the flank.
FLAMINGO_WING = [
    (0.548, 0.632), (0.664, 0.586), (0.812, 0.618),
    (0.836, 0.688), (0.720, 0.724), (0.592, 0.700),
]


def flamingo_fill(draw, box):
    _solid(draw, smooth(FLAMINGO_BODY, closed=True), box)
    _solid(draw, _band(FLAMINGO_NECK, *FLAMINGO_NECK_HALF), box)
    _disc(draw, FLAMINGO_HEAD[0], FLAMINGO_HEAD[1], FLAMINGO_HEAD[2], FLAMINGO_HEAD[2], box)
    _solid(draw, smooth(FLAMINGO_BILL, closed=True, steps=8), box)
    for hip, knee, foot in FLAMINGO_LEGS:
        draw.line(_pts(smooth([hip, knee, foot]), box), fill=WHITE,
                  width=max(2, int(box * 0.019)), joint="curve")
        _rect(draw, foot[0] - 0.014, foot[1] - 0.010, foot[0] + 0.056, foot[1] + 0.010, box)


def flamingo_wing(draw, box):
    _solid(draw, smooth(FLAMINGO_WING, closed=True), box)


def flamingo_stroke(draw, width, color, box):
    _poly(draw, smooth(FLAMINGO_BODY, closed=True), box, width, color)
    _poly(draw, _band(FLAMINGO_NECK, *FLAMINGO_NECK_HALF), box, _half(width), color)
    _ellipse(draw, FLAMINGO_HEAD[0], FLAMINGO_HEAD[1], FLAMINGO_HEAD[2], FLAMINGO_HEAD[2],
             box, _half(width), color)
    _poly(draw, smooth(FLAMINGO_BILL, closed=True, steps=8), box, _half(width), color)
    _line(draw, smooth([(0.308, 0.204), (0.288, 0.236), (0.336, 0.240)]), box, _half(width), color)
    _poly(draw, smooth(FLAMINGO_WING, closed=True), box, _third(width), color)
    _line(draw, smooth([(0.596, 0.660), (0.700, 0.628), (0.808, 0.654)]), box, _third(width), color)
    _ellipse(draw, 0.418, 0.120, 0.017, 0.017, box, _third(width), color)
    for hip, knee, foot in FLAMINGO_LEGS:
        _line(draw, smooth([hip, knee, foot]), box, _third(width), color)
        _line(draw, [(foot[0] - 0.014, foot[1]), (foot[0] + 0.056, foot[1])], box, _third(width), color)


# ===========================================================================
# H4 - Boombox   rank 3, hue 40 (amber)
# HALF OF THE h4/h5 COLLISION FIX. The old boombox was a WIDE horizontal box
# (0.055-0.945 x 0.305-0.775) with two circles low - the same gross shape as the
# convertible, IoU 0.60. It is now UPRIGHT: a narrower portrait body carried by a
# tall arched handle, so the mass is vertical and the top edge is an arch rather
# than a straight lid.
# Silhouette category: compact upright block with an arch above it.
# ===========================================================================
def boombox_fill(draw, box):
    _round_rect(draw, 0.352, 0.170, 0.648, 0.228, 0.024, box)          # carry bar
    _rect(draw, 0.352, 0.204, 0.402, 0.330, box)                        # posts
    _rect(draw, 0.598, 0.204, 0.648, 0.330, box)
    _round_rect(draw, 0.235, 0.298, 0.765, 0.775, 0.045, box)


def boombox_speakers(draw, box):
    for cx in (0.362, 0.638):
        _disc(draw, cx, 0.606, 0.100, 0.100, box)
    _round_rect(draw, 0.408, 0.340, 0.592, 0.446, 0.014, box)


def boombox_stroke(draw, width, color, box):
    draw.rounded_rectangle(
        [0.352 * box, 0.170 * box, 0.648 * box, 0.228 * box],
        radius=int(0.024 * box), outline=color + (255,), width=_half(width),
    )
    for x0, x1 in ((0.352, 0.402), (0.598, 0.648)):
        _poly(draw, [(x0, 0.214), (x1, 0.214), (x1, 0.320), (x0, 0.320)], box, _third(width), color)
    draw.rounded_rectangle(
        [0.235 * box, 0.298 * box, 0.765 * box, 0.775 * box],
        radius=int(0.045 * box), outline=color + (255,), width=width,
    )
    for cx in (0.362, 0.638):
        _ellipse(draw, cx, 0.606, 0.100, 0.100, box, _half(width), color)
        _ellipse(draw, cx, 0.606, 0.060, 0.060, box, _third(width), color)
        _ellipse(draw, cx, 0.606, 0.025, 0.025, box, _half(width), color)
    draw.rounded_rectangle(
        [0.408 * box, 0.340 * box, 0.592 * box, 0.446 * box],
        radius=int(0.014 * box), outline=color + (255,), width=_third(width),
    )
    _ellipse(draw, 0.448, 0.393, 0.024, 0.024, box, _third(width), color)
    _ellipse(draw, 0.552, 0.393, 0.024, 0.024, box, _third(width), color)
    for x in (0.390, 0.430, 0.470, 0.510, 0.550, 0.590):
        _line(draw, [(x, 0.700), (x, 0.736)], box, _third(width), color)


# ===========================================================================
# H5 - Convertible   rank 4, hue 92 (lime)
# THE OTHER HALF OF THE FIX. Kept as a low wide wedge in the bottom of the cell
# with a long raked diagonal and three speed streaks trailing left, i.e. the
# opposite extent to the now-upright boombox. Wheels are arcs cut by the sill,
# not a free-standing pair of circles.
# Hue moved amber(40) -> lime(92).
# ===========================================================================
CAR = [
    (0.055, 0.742), (0.052, 0.652), (0.135, 0.618), (0.245, 0.600),
    (0.352, 0.596), (0.436, 0.452), (0.560, 0.418), (0.688, 0.446),
    (0.775, 0.560), (0.905, 0.588), (0.958, 0.640), (0.962, 0.742),
]
STREAKS = [(0.00, 0.185, 0.492, 0.020), (0.00, 0.285, 0.560, 0.024), (0.00, 0.135, 0.690, 0.018)]
CAR_GLASS = [(0.462, 0.472), (0.548, 0.444), (0.586, 0.452), (0.598, 0.538), (0.482, 0.542)]


def car_fill(draw, box):
    _solid(draw, smooth(CAR) + [(0.962, 0.742), (0.055, 0.742)], box)
    for cx in (0.285, 0.762):
        _disc(draw, cx, 0.742, 0.104, 0.104, box)
    for x0, x1, y, h in STREAKS:
        _solid(draw, [(x0, y), (x1, y - h * 0.5), (x1 + 0.055, y + h * 0.5), (x0, y + h)], box)


def car_glass(draw, box):
    _solid(draw, CAR_GLASS, box)


def car_stroke(draw, width, color, box):
    _line(draw, smooth(CAR), box, width, color)
    _line(draw, [(0.055, 0.742), (0.962, 0.742)], box, width, color)
    _poly(draw, CAR_GLASS, box, _third(width), color)
    _line(draw, [(0.352, 0.596), (0.372, 0.700)], box, _third(width), color)      # door shut
    _line(draw, [(0.905, 0.615), (0.952, 0.615)], box, _third(width), color)      # tail light
    for cx in (0.285, 0.762):
        _arc(draw, cx, 0.742, 0.104, 0.104, 0, 180, box, _half(width), color)
        _arc(draw, cx, 0.742, 0.044, 0.044, 0, 180, box, _third(width), color)
    for x0, x1, y, h in STREAKS:
        _line(draw, [(x0, y + h * 0.5), (x1, y + h * 0.5)], box, _third(width), color)


# ===========================================================================
# Specials - Wild / Scatter / Collector badges
# ===========================================================================
def _star_points(cx, cy, outer, inner, spokes, phase=0.0):
    return [
        (
            cx + math.cos(math.pi * 2 * i / (spokes * 2) - math.pi / 2 + phase)
            * (outer if i % 2 == 0 else inner),
            cy + math.sin(math.pi * 2 * i / (spokes * 2) - math.pi / 2 + phase)
            * (outer if i % 2 == 0 else inner),
        )
        for i in range(spokes * 2)
    ]


def scatter_fill(draw, box):
    _solid(draw, _star_points(0.50, 0.50, 0.455, 0.195, 8), box)
    _disc(draw, 0.50, 0.50, 0.140, 0.140, box)


def scatter_stroke(draw, width, color, box):
    _poly(draw, _star_points(0.50, 0.50, 0.455, 0.195, 8), box, width, color)
    _poly(draw, _star_points(0.50, 0.50, 0.258, 0.110, 8, math.pi / 8), box, _third(width), color)
    _ellipse(draw, 0.50, 0.50, 0.140, 0.140, box, _half(width), color)


COLLECTOR_HEART = [
    (0.50, 0.885), (0.135, 0.515), (0.115, 0.305), (0.268, 0.165),
    (0.428, 0.238), (0.50, 0.335), (0.572, 0.238), (0.732, 0.165),
    (0.885, 0.305), (0.865, 0.515),
]


def collector_fill(draw, box):
    _solid(draw, smooth(COLLECTOR_HEART, closed=True), box)


def collector_facets(draw, box):
    _solid(draw, [(0.50, 0.335), (0.268, 0.352), (0.185, 0.490), (0.50, 0.558)], box)


def collector_stroke(draw, width, color, box):
    _poly(draw, smooth(COLLECTOR_HEART, closed=True), box, width, color)
    _line(draw, [(0.50, 0.335), (0.50, 0.885)], box, _half(width), color)
    for a in ((0.185, 0.405), (0.815, 0.405), (0.268, 0.215), (0.732, 0.215)):
        _line(draw, [a, (0.50, 0.558)], box, _third(width), color)
    _line(draw, [(0.185, 0.490), (0.815, 0.490)], box, _third(width), color)


# ---------------------------------------------------------------------------
# Neon Frame overlay (the Collector's multiplier frame) - unchanged geometry
# ---------------------------------------------------------------------------
def frame_border(draw, width, color, box):
    _poly(draw, [(0.04, 0.04), (0.96, 0.04), (0.96, 0.96), (0.04, 0.96)], box, width, color)
    _poly(draw, [(0.12, 0.12), (0.88, 0.12), (0.88, 0.88), (0.12, 0.88)], box, _half(width), color)
    for x, y in ((0.04, 0.04), (0.96, 0.04), (0.96, 0.96), (0.04, 0.96)):
        _ellipse(draw, x, y, 0.04, 0.04, box, _half(width), color)


# ---------------------------------------------------------------------------
# Registry
#
# `body` stops are the material gradient. NONE of them may land near the board
# colour (40, 10, 66) - the old set faded every body to a near-black ink stop,
# which composited L4's lower half to dE 4.9 and is why the reels read as
# outline art. contact_sheet.py re-measures this every run.
# ---------------------------------------------------------------------------
def _premium(name, rank, stroke, fill, body, detail=None, detail_body=None, width=9, glow=None):
    tube = PREMIUM_HUE[name]
    return {
        "kind": "object", "rank": rank, "tube": tube, "glow": glow or tube, "width": width,
        "stroke": stroke, "fill": fill, "body": body, "wash": tube,
        "detail": detail, "detail_body": detail_body,
    }


def _word_ramp(light, horizon):
    """White -> identity tint -> horizon band -> tint -> white. One shared shape
    for all three specials, so the family reads as a family.

    The dark band is deliberately NARROW and not very dark. At 113px a wide dark
    horizon through the middle of a 7-letter word eats the counters and the word
    turns to mush - the first cut of this had WILD unreadable on its own plate.
    """
    return [(0.00, (255, 255, 255)), (0.42, light), (0.50, horizon),
            (0.58, light), (1.00, (255, 255, 255))]


SYMBOLS = {
    # ---- card royals: one chrome material, no plate, no hue -----------------
    "l1": {"kind": "royal", "text": "A", "coverage": 0.76},
    "l2": {"kind": "royal", "text": "K", "coverage": 0.76},
    "l3": {"kind": "royal", "text": "Q", "coverage": 0.74},
    "l4": {"kind": "royal", "text": "J", "coverage": 0.72},

    # ---- premiums: one hue each, plate lightness ramped by pay rank ---------
    "h1": _premium(
        "h1", 0, diamond_stroke, diamond_fill,
        body=[(0.00, (240, 253, 255)), (0.36, (150, 233, 252)), (0.42, (86, 196, 236)),
              (1.00, (36, 132, 194))],
        width=10,
    ),
    "h2": _premium(
        "h2", 1, skyline_stroke, skyline_fill,
        body=[(0.00, (206, 178, 255)), (0.45, (142, 100, 232)), (1.00, (70, 38, 152))],
        detail=skyline_windows,
        detail_body=[(0.0, (255, 255, 240)), (1.0, (236, 226, 255))], width=9,
    ),
    "h3": _premium(
        "h3", 2, flamingo_stroke, flamingo_fill,
        body=[(0.00, (255, 216, 234)), (0.40, (255, 128, 180)), (1.00, (206, 26, 112))],
        detail=flamingo_wing,
        detail_body=[(0.0, (255, 238, 247)), (1.0, (240, 104, 166))], width=9,
    ),
    "h4": _premium(
        "h4", 3, boombox_stroke, boombox_fill,
        body=[(0.00, (255, 242, 186)), (0.45, (252, 202, 62)), (1.00, (172, 112, 14))],
        detail=boombox_speakers,
        detail_body=[(0.0, (92, 58, 22)), (1.0, (46, 26, 9))], width=9,
    ),
    "h5": _premium(
        "h5", 4, car_stroke, car_fill,
        body=[(0.00, (198, 236, 150)), (0.42, (126, 206, 62)), (1.00, (34, 108, 30))],
        detail=car_glass,
        detail_body=[(0.0, (186, 224, 216)), (1.0, (78, 146, 132))], width=9,
    ),

    # ---- specials: one plate + ribbon + word family, off every pay ramp ------
    # Plates are DARK and saturated where the premiums' are light and neutral,
    # so the family is separable from the pay ladder at a glance.
    "w": {
        "kind": "word", "text": "WILD", "coverage": 0.80,
        "special": ((146, 26, 40), (58, 8, 20), (255, 226, 208)),
        "wash": SPECIAL_HUE["w"],
        "word_stops": _word_ramp((255, 214, 206), (196, 74, 66)),
        "word_edge": (44, 6, 12), "rim": (255, 226, 208), "word_y": 0.0,
    },
    "s": {
        "kind": "word", "text": "SCATTER", "coverage": 0.84,
        "special": ((18, 98, 62), (6, 36, 28), (206, 255, 224)),
        "wash": SPECIAL_HUE["s"],
        "ribbon": ((16, 90, 58), (5, 32, 24)),
        "badge_fill": scatter_fill, "badge_stroke": scatter_stroke,
        "badge_body": [(0.00, (240, 255, 246)), (0.42, (150, 250, 186)), (1.00, (30, 162, 96))],
        "badge_tube": SPECIAL_HUE["s"], "badge_width": 9,
        "badge_scale": 0.60, "badge_y": 0.055,
        "word_stops": _word_ramp((206, 255, 226), (46, 154, 106)),
        "word_edge": (4, 32, 22), "rim": (206, 255, 224), "word_y": 0.278,
    },
    "c": {
        "kind": "word", "text": "COLLECT", "coverage": 0.84,
        "special": ((168, 34, 184), (62, 12, 72), (252, 226, 255)),
        "wash": SPECIAL_HUE["c"],
        "ribbon": ((124, 24, 136), (44, 8, 52)),
        "badge_fill": collector_fill, "badge_stroke": collector_stroke,
        "badge_body": [(0.00, (255, 226, 252)), (0.40, (232, 128, 255)), (1.00, (128, 30, 158))],
        "badge_detail": collector_facets,
        "badge_detail_body": [(0.0, (255, 240, 254)), (1.0, (198, 104, 224))],
        "badge_tube": SPECIAL_HUE["c"], "badge_width": 10,
        "badge_scale": 0.58, "badge_y": 0.060,
        "word_stops": _word_ramp((250, 214, 255), (152, 62, 168)),
        "word_edge": (30, 4, 44), "rim": (250, 216, 255), "word_y": 0.278,
    },

    # ---- reel-cell frame overlay ------------------------------------------
    # Gold, deliberately: frontend-presentation settled gold as this game's
    # "money" colour and the multiplier text inside the frame is 0xffd166.
    "frame": {"kind": "frame", "stroke": frame_border, "color": PALETTE["gold"],
              "glow": PALETTE["orange"], "width": 8},
}

# 5-of-a-kind pay, from math-sdk/games/hot_miami/game_config.py:53-81. Only used
# by contact_sheet.py, to check the visual hierarchy still tracks the paytable.
PAY_RANK = {"h1": 400, "h2": 200, "h3": 50, "h4": 30, "h5": 10,
            "l1": 2, "l2": 2, "l3": 2, "l4": 2}

ROYALS = ("l1", "l2", "l3", "l4")
PREMIUMS = ("h1", "h2", "h3", "h4", "h5")
SPECIALS = ("w", "s", "c")

# hmS in game/assets.ts points at fs.png, so the Scatter art must be written
# there as well as to the historic s.png. Keeping both identical is what
# resolves the orphan: whichever file a future change wires up, it is right.
FILE_ALIASES = {"s": ("s", "fs")}
