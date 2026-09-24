#!/usr/bin/env python3
"""Moooo scene art — backgrounds, frame, banners, UI, brand, tile, transition.

    python design/build_scene_3d.py

Companion to `build_symbols_3d.py`, which owns the twelve reel symbols and the
bell. The split is by filename and must stay that way: only that script writes
`sprites/mooooSymbols/`, only this one writes everything else. Two generators
sharing filenames is how an afternoon's work gets silently flattened the next
time somebody regenerates a background.

Backgrounds are PAINTED (gradients, glows, silhouettes) because a sky has no
surface to light. Everything with a form — plaques, the housing, the wordmark,
the cow — goes through `render25d` so it carries the same light as the symbols.
"""

import math
import os
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFont

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import render25d as r  # noqa: E402

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "..", "static", "assets", "sprites")
FONTS = os.path.join(HERE, "..", "static", "fonts")

# ── county fair at dusk ─────────────────────────────────────────────────────
SKY_TOP = (18, 14, 48)
SKY_MID = (58, 30, 78)
SKY_LOW = (150, 62, 84)
HORIZON = (226, 118, 82)
SODIUM = (255, 176, 92)
CREAM = (247, 238, 214)
TIMBER = (104, 70, 44)
TIMBER_HI = (146, 102, 64)
DEEP = (16, 11, 38)

# ── UI plate stock (2026-08-26) ─────────────────────────────────────────────
#
# These three plates were (26,18,52) / (44,28,70) / (40,26,66) — indigo and
# violet, from when the bet bar was Hot Miami's magenta-and-cyan. game/uiTheme.ts
# is now timber and aged brass (sampled off frame_edge.png), so an indigo plate
# under a brass border was the last cool thing left in the strip.
#
# PLATE_DARK is the same value as uiTheme's panelFill 0x1d1209, so the drawn
# plates and the vector panels behind them share one darkest tone.
PLATE_DARK = (29, 18, 9)      # 0x1d1209 — ticker, free-spin counter
BOARD_PLATE = (22, 15, 34)    # board interior: warmed off 0x181830, but kept
                              # dark and slightly cool so symbol art still lifts
                              # off it. This one is deliberately NOT timber —
                              # see the note at its save() call.

BUNTING = [(214, 58, 58), (247, 238, 214), (58, 156, 74), (44, 96, 196), (232, 168, 60)]


def save(img, *parts):
    path = os.path.join(OUT, *parts)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    img.save(path)
    print("  wrote", os.path.relpath(path, os.path.join(HERE, "..")))


def mask_rgba(size, draw_fn):
    img = Image.new("L", size, 0)
    draw_fn(ImageDraw.Draw(img))
    return np.asarray(img, dtype=np.float32) / 255.0


def vgrad(size, stops):
    """Vertical gradient from (position, colour) stops."""
    w, h = size
    img = Image.new("RGB", size)
    d = ImageDraw.Draw(img)
    for y in range(h):
        t = y / (h - 1)
        lo = max([s for s in stops if s[0] <= t], key=lambda s: s[0])
        hi = min([s for s in stops if s[0] >= t], key=lambda s: s[0])
        span = (hi[0] - lo[0]) or 1.0
        k = (t - lo[0]) / span
        d.line([0, y, w, y], fill=tuple(int(lo[1][i] + (hi[1][i] - lo[1][i]) * k) for i in range(3)))
    return img.convert("RGBA")


def glow(size, center, radius, color, power=2.0, strength=1.0):
    """One soft light pool, as an additive RGBA layer."""
    w, h = size
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    d = np.sqrt((xx - center[0]) ** 2 + (yy - center[1]) ** 2) / radius
    a = np.clip(1.0 - d, 0.0, 1.0) ** power * strength
    rgb = np.array(color, dtype=np.float32) / 255.0
    return np.dstack([np.broadcast_to(rgb, (h, w, 3)).copy(), a])


def add_layers(base: Image.Image, layers):
    """Additive composite — light adds, it does not cover."""
    out = np.asarray(base.convert("RGBA"), dtype=np.float32) / 255.0
    for layer in layers:
        out[..., :3] = np.clip(out[..., :3] + layer[..., :3] * layer[..., 3:4], 0, 1)
    return Image.fromarray((out * 255).astype(np.uint8), "RGBA")


def bunting(img, y0, span, sag, rows=1):
    """Strings of triangular flags, hung on a CATENARY.

    Straight strings were the giveaway in the placeholder — bunting hangs, and a
    level row of flags reads as a graphic rather than as something strung across
    a field.
    """
    d = ImageDraw.Draw(img)
    w, _ = img.size
    for row in range(rows):
        base_y = y0 + row * 46
        n = max(6, int(w / span))
        pts = []
        for i in range(n + 1):
            t = i / n
            pts.append((t * w, base_y + math.sin(t * math.pi) * sag))
        d.line(pts, fill=(*DEEP, 220), width=4)
        for i in range(n):
            x0, yy0 = pts[i]
            x1, yy1 = pts[i + 1]
            c = BUNTING[(i + row) % len(BUNTING)]
            d.polygon([(x0, yy0), (x1, yy1), ((x0 + x1) / 2, (yy0 + yy1) / 2 + span * 0.62)],
                      fill=(*c, 235), outline=(*DEEP, 200))


def treeline(img, y, amp, color):
    d = ImageDraw.Draw(img)
    w, h = img.size
    pts = [(0, h)]
    x = 0
    while x < w:
        step = 70 + (x % 53)
        pts.append((x, y + math.sin(x * 0.011) * amp - (x % 37)))
        x += step
    pts.append((w, h))
    d.polygon(pts, fill=color)


def ferris_wheel(img, cx, cy, radius, color):
    """A wheel on the skyline — the one shape that says 'fair' at a glance."""
    d = ImageDraw.Draw(img)
    d.ellipse([cx - radius, cy - radius, cx + radius, cy + radius], outline=color, width=7)
    d.ellipse([cx - radius * 0.10, cy - radius * 0.10, cx + radius * 0.10, cy + radius * 0.10],
              fill=color)
    for i in range(12):
        a = math.pi * 2 * i / 12
        d.line([cx, cy, cx + math.cos(a) * radius, cy + math.sin(a) * radius], fill=color, width=4)
        d.ellipse([cx + math.cos(a) * radius - 11, cy + math.sin(a) * radius - 11,
                   cx + math.cos(a) * radius + 11, cy + math.sin(a) * radius + 11], fill=color)
    d.line([cx - radius * 0.7, cy + radius, cx, cy], fill=color, width=8)
    d.line([cx + radius * 0.7, cy + radius, cx, cy], fill=color, width=8)


def background(size, *, lit, super_mode=False):
    w, h = size
    stops = [(0.0, SKY_TOP), (0.34, SKY_MID), (0.62, SKY_LOW), (0.80, HORIZON), (1.0, (52, 24, 44))]
    if super_mode:
        stops = [(0.0, (8, 6, 28)), (0.34, (34, 16, 62)), (0.62, (110, 40, 92)),
                 (0.80, (214, 96, 96)), (1.0, (34, 14, 34))]
    img = vgrad(size, stops)

    # stars, only in the upper third where the sky is dark enough to hold them
    d = ImageDraw.Draw(img)
    rng = np.random.default_rng(7)
    for _ in range(150):
        x, y = rng.uniform(0, w), rng.uniform(0, h * 0.34)
        s = rng.uniform(1.0, 2.6)
        a = int(rng.uniform(60, 190) * (1 - y / (h * 0.34)))
        d.ellipse([x, y, x + s, y + s], fill=(255, 246, 230, a))

    ferris_wheel(img, w * 0.16, h * 0.50, h * 0.20, (*DEEP, 235))
    treeline(img, h * 0.70, h * 0.035, (*DEEP, 255))

    # floodlight poles along the show ring
    poles = 7
    lights = []
    for i in range(poles):
        x = w * (i + 0.5) / poles
        d.line([x, h * 0.72, x, h * 0.50], fill=(*DEEP, 255), width=7)
        d.ellipse([x - 16, h * 0.485, x + 16, h * 0.515], fill=(*SODIUM, 255))
        lights.append(glow(size, (x, h * 0.50), h * (0.34 if lit else 0.26), SODIUM,
                           power=2.2, strength=0.75 if lit else 0.5))
        lights.append(glow(size, (x, h * 0.80), h * 0.22, SODIUM, power=2.6, strength=0.35))

    # the show-ring rail the reels sit behind
    d.rectangle([0, h * 0.80, w, h], fill=(*DEEP, 235))
    for rail_y in (0.815, 0.87):
        d.rectangle([0, h * rail_y, w, h * rail_y + h * 0.018], fill=(*TIMBER, 255))

    img = add_layers(img, lights)
    bunting(img, h * 0.09, w / 15, h * 0.05, rows=2 if lit else 1)

    if super_mode:
        # beams sweeping the sky — the 250x round should look like an event
        beams = []
        for i, x in enumerate((0.30, 0.52, 0.74)):
            beams.append(glow(size, (w * x, h * 0.10), h * 0.55, (255, 214, 170),
                              power=1.5, strength=0.22))
        img = add_layers(img, beams)

    # vignette so the reels always have something to sit against
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    dist = np.sqrt(((xx - w / 2) / (w / 2)) ** 2 + ((yy - h / 2) / (h / 2)) ** 2)
    v = np.clip((dist - 0.55) / 0.75, 0, 1) * 0.72
    arr = np.asarray(img.convert("RGBA"), dtype=np.float32) / 255.0
    arr[..., :3] *= (1 - v)[..., None]
    return Image.fromarray((arr * 255).astype(np.uint8), "RGBA").convert("RGB").convert("RGBA")


# ── plaques, housing, UI ────────────────────────────────────────────────────

def plaque(size, mask_fn, color, *, fat=30, rim=0.30):
    """A lit plate. Used for every panel so they all catch the same light."""
    m = mask_rgba(size, mask_fn)
    return r.compose([
        r.solid((0, 0, 0), r.contact_shadow(m, drop=12, blur=14, alpha=0.45)),
        r.shade(m, color, fat=fat, rim=rim),
    ])


def rosette_mask(size, cx, cy, radius, petals=16, inner=0.80):
    def draw(d):
        pts = []
        for k in range(petals * 2):
            a = math.pi * k / petals - math.pi / 2
            rr = radius if k % 2 == 0 else radius * inner
            pts.append((cx + math.cos(a) * rr, cy + math.sin(a) * rr))
        d.polygon(pts, fill=255)
    return draw


def win_banner(tier: int):
    """Five escalating plaques, 760x260.

    They must differ by SHAPE, not by a number of dots on one plate — that was
    the placeholder, and "every win tier looks the same" is a review comment the
    sibling game actually received. So the silhouette grows: a plain plank, then
    a bevelled plate, then a rosette behind it, then rays, then rays plus a full
    starburst.

    No text: the win amount and the tier name are drawn by the game.
    """
    W, H = 760, 260
    palette = [(120, 62, 52), (150, 58, 66), (182, 52, 66), (206, 44, 70), (226, 40, 76)]
    color = palette[tier]
    layers = []

    if tier >= 3:  # rays behind everything, from the centre
        # Length is capped so the rays END inside the canvas. Run to full width
        # and they hit the edge as a hard straight cut, which reads as a
        # rendering mistake rather than as a burst.
        def rays(d):
            reach = H * 0.92
            for i in range(16):
                a = math.pi * 2 * i / 16 + 0.1
                d.polygon([(W / 2, H / 2),
                           (W / 2 + math.cos(a - 0.06) * reach, H / 2 + math.sin(a - 0.06) * reach),
                           (W / 2 + math.cos(a + 0.06) * reach, H / 2 + math.sin(a + 0.06) * reach)],
                          fill=255)
        m = mask_rgba((W, H), rays)
        layers.append(r.shade(m, tuple(int(c * 0.55) for c in color), fat=40, rim=0.10))

    if tier >= 2:  # rosette collar
        m = mask_rgba((W, H), rosette_mask((W, H), W / 2, H / 2, H * 0.52, petals=22))
        layers.append(r.shade(m, tuple(min(255, int(c * 1.15)) for c in color), fat=26))

    if tier >= 4:  # starburst points on the top tier only
        m = mask_rgba((W, H), rosette_mask((W, H), W / 2, H / 2, H * 0.62, petals=10, inner=0.45))
        layers.append(r.shade(m, (250, 214, 120), fat=20, rim=0.42))

    plate = mask_rgba((W, H), lambda d: d.rounded_rectangle(
        [W * 0.10, H * 0.24, W * 0.90, H * 0.78], radius=H * 0.16, fill=255))
    layers.append(r.solid((0, 0, 0), r.contact_shadow(plate, drop=10, blur=12, alpha=0.45)))
    layers.append(r.shade(plate, color, fat=34))
    inner = mask_rgba((W, H), lambda d: d.rounded_rectangle(
        [W * 0.125, H * 0.30, W * 0.875, H * 0.72], radius=H * 0.13, fill=255))
    layers.append(r.shade(inner, tuple(int(c * 0.72) for c in color), fat=16, rim=0.12))
    return r.compose(layers)


def reel_housing():
    """frame_edge.png — the housing drawn OVER the reels.

    Its alpha bbox must fill 0.939 of the 1280 square (0.939063 as rendered;
    the 0.938 written here before 2026-08-26 was 1 - 2*0.031 rounded, not a
    measurement): the board-size
    constant in stateGame.svelte.ts is calibrated against that ratio, so a
    housing that reaches further makes the whole board come out the wrong size.
    The placeholder filled 0.995 and would have thrown the layout off.
    """
    S = 1280
    pad = S * 0.031  # -> bbox 0.939063
    outer = mask_rgba((S, S), lambda d: d.rounded_rectangle(
        [pad, pad, S - pad, S - pad], radius=S * 0.06, fill=255))
    inner = mask_rgba((S, S), lambda d: d.rounded_rectangle(
        [S * 0.085, S * 0.085, S * 0.915, S * 0.915], radius=S * 0.035, fill=255))
    band = np.clip(outer - inner, 0, 1)

    bolts = mask_rgba((S, S), lambda d: [
        d.ellipse([x - S * 0.014, y - S * 0.014, x + S * 0.014, y + S * 0.014], fill=255)
        for x in (S * 0.075, S * 0.925) for y in (S * 0.075, S * 0.925)])
    return r.compose([
        r.shade(band, TIMBER, fat=34),
        r.shade(bolts, (196, 186, 168), fat=8, rim=0.5),
    ])


def icon(kind, size=128):
    """UI glyphs. Flat cream with a soft drop — they live at 32px, where a bevel
    turns to mud."""
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    S, c, w = size, size / 2, int(size * 0.09)
    F = (*CREAM, 255)
    if kind == "menu":
        for i in (-1, 0, 1):
            d.rounded_rectangle([S*0.22, c + i*S*0.20 - w/2, S*0.78, c + i*S*0.20 + w/2],
                                radius=w/2, fill=F)
    elif kind == "menuExit":
        for a in (45, -45):
            box = Image.new("RGBA", (size, size), (0, 0, 0, 0))
            ImageDraw.Draw(box).rounded_rectangle(
                [S*0.22, c - w/2, S*0.78, c + w/2], radius=w/2, fill=F)
            img.alpha_composite(box.rotate(a, resample=Image.BICUBIC, center=(c, c)))
    elif kind in ("soundOn", "soundOff"):
        d.polygon([(S*0.24, S*0.40), (S*0.40, S*0.40), (S*0.56, S*0.22),
                   (S*0.56, S*0.78), (S*0.40, S*0.60), (S*0.24, S*0.60)], fill=F)
        if kind == "soundOn":
            for rr in (0.16, 0.26):
                d.arc([c + S*0.02 - S*rr, c - S*rr, c + S*0.02 + S*rr, c + S*rr],
                      start=300, end=60, fill=F, width=int(w*0.8))
        else:
            for a in (45, -45):
                box = Image.new("RGBA", (size, size), (0, 0, 0, 0))
                ImageDraw.Draw(box).rounded_rectangle(
                    [S*0.62, c - w*0.4, S*0.88, c + w*0.4], radius=w/2, fill=F)
                img.alpha_composite(box.rotate(a, resample=Image.BICUBIC, center=(S*0.75, c)))
    elif kind == "autoSpin":
        d.arc([S*0.20, S*0.20, S*0.80, S*0.80], start=35, end=305, fill=F, width=w)
        d.polygon([(S*0.78, S*0.10), (S*0.92, S*0.34), (S*0.62, S*0.32)], fill=F)
    elif kind == "settings":
        for i in range(8):
            a = math.pi * i / 4
            d.rounded_rectangle([c + math.cos(a)*S*0.30 - w*0.7, c + math.sin(a)*S*0.30 - w*0.7,
                                 c + math.cos(a)*S*0.30 + w*0.7, c + math.sin(a)*S*0.30 + w*0.7],
                                radius=w*0.5, fill=F)
        d.ellipse([S*0.30, S*0.30, S*0.70, S*0.70], outline=F, width=w)
    elif kind == "info":
        d.ellipse([S*0.18, S*0.18, S*0.82, S*0.82], outline=F, width=w)
        d.rounded_rectangle([c - w*0.55, S*0.44, c + w*0.55, S*0.70], radius=w*0.5, fill=F)
        d.ellipse([c - w*0.62, S*0.28, c + w*0.62, S*0.28 + w*1.24], fill=F)
    else:  # payTable
        d.rounded_rectangle([S*0.22, S*0.16, S*0.78, S*0.84], radius=S*0.09, outline=F, width=w)
        for i in range(3):
            y = S * (0.34 + i * 0.17)
            d.rounded_rectangle([S*0.34, y - w*0.35, S*0.66, y + w*0.35], radius=w*0.35, fill=F)
    return img


def wordmark(size=(1200, 500)):
    """MOOOO, set in Titan One and lit like everything else.

    The placeholder logo had no lettering at all — the game's name was missing
    from its own logo. Real letterforms shaded by the same renderer keep the
    wordmark in the same world as the symbols.
    """
    W, H = size
    font = ImageFont.truetype(os.path.join(FONTS, "TitanOne.ttf"), 250)
    text = "MOOOO"
    tmp = Image.new("L", size, 0)
    d = ImageDraw.Draw(tmp)
    bbox = d.textbbox((0, 0), text, font=font)
    tx = (W - (bbox[2] - bbox[0])) / 2 - bbox[0]
    ty = (H - (bbox[3] - bbox[1])) / 2 - bbox[1]
    d.text((tx, ty), text, font=font, fill=255)
    m = np.asarray(tmp, dtype=np.float32) / 255.0

    outline = Image.new("L", size, 0)
    od = ImageDraw.Draw(outline)
    for dx in range(-9, 10, 3):
        for dy in range(-9, 10, 3):
            od.text((tx + dx, ty + dy), text, font=font, fill=255)
    om = np.asarray(outline, dtype=np.float32) / 255.0

    return r.compose([
        r.solid((0, 0, 0), r.contact_shadow(om, drop=16, blur=18, alpha=0.6)),
        r.shade(om, (44, 26, 62), fat=26, rim=0.16),
        r.shade(m, (242, 196, 74), fat=22, spec=0.75, shininess=36.0, rim=0.30),
    ])


def side_cow(size=(1024, 512)):
    """The transition cow — SIDE ON, facing right, in a 2:1 frame.

    The placeholder used a front-facing head, and the transition slides it across
    the screen: a cow looking at you being dragged sideways. The reel symbol is
    three-quarters to camera because that is the angle at which an opening mouth
    reads in a cell; this is a different job and needs a different drawing.
    """
    W, H = size
    parts = []
    body = mask_rgba(size, lambda d: d.ellipse([W*0.20, H*0.28, W*0.72, H*0.86], fill=255))
    parts.append((body, (250, 250, 252), 60))
    parts.append((mask_rgba(size, lambda d: (
        d.ellipse([W*0.28, H*0.36, W*0.44, H*0.60], fill=255),
        d.ellipse([W*0.52, H*0.52, W*0.66, H*0.72], fill=255),
    )) * body, (34, 30, 46), 24))
    # legs
    for x in (0.28, 0.40, 0.56, 0.66):
        parts.append((mask_rgba(size, lambda d, x=x: d.rounded_rectangle(
            [W*x, H*0.74, W*(x+0.055), H*0.97], radius=W*0.02, fill=255)), (238, 238, 244), 14))
    # head at the right-hand end, muzzle forward
    parts.append((mask_rgba(size, lambda d: d.ellipse(
        [W*0.66, H*0.22, W*0.88, H*0.60], fill=255)), (250, 250, 252), 40))
    parts.append((mask_rgba(size, lambda d: d.ellipse(
        [W*0.82, H*0.38, W*0.94, H*0.56], fill=255)), (243, 168, 184), 20))
    parts.append((mask_rgba(size, lambda d: d.polygon(
        [(W*0.70, H*0.22), (W*0.74, H*0.10), (W*0.78, H*0.24)], fill=255)), (232, 220, 196), 12))
    # tail
    parts.append((mask_rgba(size, lambda d: d.arc(
        [W*0.10, H*0.30, W*0.26, H*0.66], start=100, end=250, fill=255, width=int(W*0.018))),
        (238, 238, 244), 8))

    layers = [r.solid((0, 0, 0), r.contact_shadow(body, drop=20, blur=18, alpha=0.5))]
    for m, c, fat in parts:
        layers.append(r.shade(m, c, fat=fat))
    eye = Image.new("RGBA", size, (0, 0, 0, 0))
    ed = ImageDraw.Draw(eye)
    ed.ellipse([W*0.755, H*0.30, W*0.795, H*0.36], fill=(26, 22, 34, 255))
    ed.ellipse([W*0.762, H*0.305, W*0.776, H*0.325], fill=(255, 255, 255, 255))
    layers.append(np.asarray(eye, dtype=np.float32) / 255.0)
    return r.compose(layers)


def token_sheet():
    """12 frames of a prize rosette turning, 4x3 of 128px, plus its manifest.

    Rained on a big win. A rosette, not a coin: you do not win coins at a county
    fair, and the sibling apps still rain a coin sheet that arrived with a
    starter template under another studio's filename.
    """
    import json

    F, cols, rows = 128, 4, 3
    sheet = Image.new("RGBA", (F * cols, F * rows), (0, 0, 0, 0))
    frames = {}
    for i in range(12):
        phase = math.pi * i / 12
        squash = abs(math.cos(phase))
        half = max(3.0, F * 0.36 * squash)
        edge_on = squash < 0.18
        color = (223, 233, 240) if edge_on else (206, 40, 70)
        m = mask_rgba((F, F), lambda d, half=half: d.ellipse(
            [F/2 - half, F*0.12, F/2 + half, F*0.88], fill=255))
        img = r.compose([r.shade(m, color, fat=14)])
        if not edge_on and squash > 0.45:
            boss = mask_rgba((F, F), lambda d, half=half: d.ellipse(
                [F/2 - half*0.42, F*0.36, F/2 + half*0.42, F*0.64], fill=255))
            img = r.compose([np.asarray(img, dtype=np.float32)/255.0, r.shade(boss, CREAM, fat=6)])
        x, y = (i % cols) * F, (i // cols) * F
        sheet.alpha_composite(img, (x, y))
        frames[f"{i+1}.png"] = {
            "frame": {"x": x, "y": y, "w": F, "h": F},
            "rotated": False, "trimmed": False,
            "spriteSourceSize": {"x": 0, "y": 0, "w": F, "h": F},
            "sourceSize": {"w": F, "h": F},
        }
    manifest = {
        "frames": frames,
        "animations": {"token": [f"{i+1}.png" for i in range(12)]},
        "meta": {"app": "design/build_scene_3d.py", "version": "1.0", "image": "token.png",
                 "format": "RGBA8888", "size": {"w": F*cols, "h": F*rows}, "scale": "1"},
    }
    return sheet, manifest


def main():
    save(background((2039, 1000), lit=False), "mooooBackground", "bg_base.png")
    save(background((2039, 1000), lit=True), "mooooBackground", "bg_feature.png")
    save(background((2039, 1000), lit=True, super_mode=True), "mooooBackground", "bg_super.png")

    for i, name in enumerate(("big", "superwin", "mega", "epic", "max")):
        save(win_banner(i), "mooooWinBanners", f"{name}.png")

    save(reel_housing(), "mooooFrame", "frame_edge.png")
    # The board interior stays a shade cooler than the cabinet on purpose. It is
    # the ground every symbol is read against, and twelve warm objects on a warm
    # plate lose their edges — the royals in particular, which carry rank by
    # contrast rather than by size (see LOW_SYMBOL_SIZE in constants.ts). Warmed
    # from 0x181830 far enough to stop reading as violet, no further.
    save(plaque((1280, 1280), lambda d: d.rounded_rectangle(
        [40, 40, 1240, 1240], radius=70, fill=255), BOARD_PLATE, fat=40), "mooooFrame", "frame_bg.png")
    save(plaque((900, 320), lambda d: d.rounded_rectangle(
        [20, 20, 880, 300], radius=60, fill=255), (150, 44, 66)), "mooooFrame", "fs_sign.png")
    save(plaque((520, 190), lambda d: d.rounded_rectangle(
        [12, 12, 508, 178], radius=44, fill=255), PLATE_DARK), "mooooFrame", "fs_counter_panel.png")

    save(plaque((560, 120), lambda d: d.rounded_rectangle(
        [8, 8, 552, 112], radius=40, fill=255), PLATE_DARK), "mooooUi", "ticker_plate.png")
    save(plaque((300, 300), lambda d: d.rounded_rectangle(
        [10, 10, 290, 290], radius=54, fill=255), (150, 44, 66)), "mooooUi", "buybonus_plate.png")

    for kind in ("menu", "menuExit", "settings", "info", "payTable", "soundOn", "soundOff", "autoSpin"):
        save(icon(kind), "mooooUiIcons", f"{kind}.png")

    save(wordmark(), "mooooBrand", "logo.png")
    save(side_cow(), "mooooFx", "transition_cow.png")

    # Store tile: BG must be fully opaque, FG must have real transparency.
    # Asserted rather than trusted — the first pass shipped a "background" whose
    # minimum alpha was 235 because the bunting drew semi-transparent.
    import build_symbols_3d as sym

    tile_bg = Image.new("RGBA", (1024, 1024), (*DEEP, 255))
    tile_bg.alpha_composite(background((1024, 1024), lit=True))
    assert tile_bg.split()[-1].getextrema() == (255, 255), "store-tile BG must be opaque"
    save(tile_bg, "mooooTile", "Moooo-BG.png")

    cow = sym.render_cow(True)
    bell = sym.render_bell()
    hero = Image.alpha_composite(cow, bell).resize((880, 880), Image.LANCZOS)
    tile_fg = Image.new("RGBA", (1024, 1024), (0, 0, 0, 0))
    tile_fg.alpha_composite(hero, (72, 100))
    assert tile_fg.split()[-1].getextrema()[0] == 0, "store-tile FG must be transparent"
    save(tile_fg, "mooooTile", "Moooo-FG.png")

    # The intro card bleeds this off BOTH side edges, so the subject has to sit
    # smaller and centred than looks right in the file — at full bleed the first
    # pass showed two enormous half-faces and nothing else.
    small = Image.alpha_composite(cow, bell).resize((620, 620), Image.LANCZOS)
    front = Image.new("RGBA", (1024, 1024), (0, 0, 0, 0))
    front.alpha_composite(small, (202, 300))
    save(front, "mooooBrand", "tile_foreground.png")

    sheet, manifest = token_sheet()
    save(sheet, "mooooToken", "token.png")
    path = os.path.join(OUT, "mooooToken", "token.json")
    with open(path, "w", encoding="UTF-8") as handle:
        json.dump(manifest, handle, indent="\t")
    print("  wrote", os.path.relpath(path, os.path.join(HERE, "..")))


if __name__ == "__main__":
    import json  # noqa: F401  (used by main via token_sheet's manifest write)
    main()
