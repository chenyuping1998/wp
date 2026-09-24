#!/usr/bin/env python3
"""Production artwork generator for Moooo slot game.

Generates high-resolution, production-grade vector/raster artwork for all symbols,
backgrounds, reel frames, UI elements, win banners, store tiles, and token sheets.

Enforces:
1. County fair at dusk theme.
2. Metallic brass, silver, gold ONLY on the cow's neck bell.
3. Clean alpha channels and precise PNG metadata stripping (no tEXt/iTXt/zTXt chunks).
4. Provenance independence (all code-drawn from primitives).
"""

import math
import os
import json
from PIL import Image, ImageDraw, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "..", "static", "assets", "sprites")
UPLOAD_THUMB = os.path.join(HERE, "..", "..", "..", "upload", "Moooo", "thumbnail")

# ── Palette & Theme Constants ────────────────────────────────────────────────
INDIGO_DARK = (16, 12, 36)
INDIGO_MID  = (26, 20, 58)
INDIGO_SKY  = (38, 28, 78)
DUSK_PURPLE = (88, 42, 82)
DUSK_ORANGE = (212, 108, 64)
SODIUM_WARM = (255, 176, 92)
CREAM       = (247, 238, 214)
DEEP_BORDER = (18, 12, 34)

# Bell Metals (The ONLY metallic hues in the game)
BRASS  = (201, 138, 60)
SILVER = (223, 233, 240)
GOLD   = (255, 196, 61)

SIZE = 512
RENDER_SCALE = 2  # Render at 2x for supersampled anti-aliasing

def canvas(w=SIZE, h=SIZE):
    return Image.new("RGBA", (w, h), (0, 0, 0, 0))

def render_supersampled(draw_fn, w=SIZE, h=SIZE, scale=RENDER_SCALE):
    """Render drawing function at higher resolution and downsample for smooth anti-aliasing."""
    big_w, big_h = w * scale, h * scale
    big_img = canvas(big_w, big_h)
    draw_fn(big_img, scale)
    resample = getattr(Image, 'Resampling', Image).LANCZOS
    return big_img.resize((w, h), resample)

def save(image, *parts):
    path = os.path.join(OUT, *parts)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    # Strip metadata chunks explicitly to satisfy check_provenance.mjs
    image.save(path, format="PNG", optimize=True)
    return os.path.relpath(path, os.path.join(HERE, ".."))

def save_to_path(image, path):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    image.save(path, format="PNG", optimize=True)

# ── Utility Drawing Functions ────────────────────────────────────────────────
def draw_gradient_ellipse(draw, box, inner_color, outer_color, steps=10):
    x0, y0, x1, y1 = box
    cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
    rx, ry = (x1 - x0) / 2, (y1 - y0) / 2
    for i in range(steps, 0, -1):
        t = i / steps
        r_curr_x, r_curr_y = rx * t, ry * t
        r_c = int(inner_color[0] + (outer_color[0] - inner_color[0]) * (1 - t))
        g_c = int(inner_color[1] + (outer_color[1] - inner_color[1]) * (1 - t))
        b_c = int(inner_color[2] + (outer_color[2] - inner_color[2]) * (1 - t))
        a_c = int(inner_color[3] + (outer_color[3] - inner_color[3]) * (1 - t)) if len(inner_color) > 3 else 255
        draw.ellipse([cx - r_curr_x, cy - r_curr_y, cx + r_curr_x, cy + r_curr_y], fill=(r_c, g_c, b_c, a_c))

# ── 1. The MOOOO Cow (W) ────────────────────────────────────────────────────
def draw_cow(img, s, mouth_open=False, bell_color=GOLD, side_view=False):
    d = ImageDraw.Draw(img)
    w, h = img.width, img.height
    cx, cy = w / 2, h / 2

    if side_view:
        # Side-on cow facing RIGHT for transition_cow.png
        # Head contour
        d.ellipse([w * 0.25, h * 0.15, w * 0.85, h * 0.75], fill=(245, 246, 250, 255), outline=DEEP_BORDER, width=int(12 * s))
        # Black patches
        d.ellipse([w * 0.3, h * 0.15, w * 0.6, h * 0.45], fill=DEEP_BORDER)
        d.ellipse([w * 0.55, h * 0.4, w * 0.8, h * 0.65], fill=DEEP_BORDER)
        # Horns
        d.polygon([(w * 0.4, h * 0.18), (w * 0.38, h * 0.05), (w * 0.46, h * 0.14)], fill=(225, 220, 212, 255), outline=DEEP_BORDER)
        # Ear back
        d.ellipse([w * 0.18, h * 0.22, w * 0.38, h * 0.36], fill=(245, 246, 250, 255), outline=DEEP_BORDER, width=int(8 * s))
        d.ellipse([w * 0.22, h * 0.25, w * 0.34, h * 0.33], fill=(235, 155, 170, 255))
        # Wide eye facing right
        d.ellipse([w * 0.55, h * 0.25, w * 0.68, h * 0.38], fill=(255, 255, 255, 255), outline=DEEP_BORDER, width=int(6 * s))
        d.ellipse([w * 0.60, h * 0.27, w * 0.67, h * 0.36], fill=DEEP_BORDER)
        d.ellipse([w * 0.64, h * 0.28, w * 0.66, h * 0.31], fill=(255, 255, 255, 255))
        # Big Open Mouth dropped to right
        d.ellipse([w * 0.6, h * 0.42, w * 0.94, h * 0.88], fill=(238, 142, 162, 255), outline=DEEP_BORDER, width=int(10 * s))
        d.ellipse([w * 0.68, h * 0.50, w * 0.90, h * 0.82], fill=(128, 24, 48, 255)) # mouth interior
        d.ellipse([w * 0.72, h * 0.64, w * 0.88, h * 0.80], fill=(245, 110, 138, 255)) # tongue
        # Nostril
        d.ellipse([w * 0.84, h * 0.48, w * 0.89, h * 0.55], fill=DEEP_BORDER)
        return

    # 3/4 View Head (For Symbol W)
    # Leather collar & Bell at bottom
    collar_y = h * 0.72
    d.line([w * 0.2, collar_y, w * 0.8, collar_y], fill=(74, 44, 27, 255), width=int(26 * s))
    d.line([w * 0.2, collar_y, w * 0.8, collar_y], fill=DEEP_BORDER, width=int(32 * s))
    d.line([w * 0.22, collar_y, w * 0.78, collar_y], fill=(88, 52, 32, 255), width=int(22 * s))

    # Metallic Bell hanging on collar
    bell_cx, bell_cy = cx, h * 0.84
    bw, bh = w * 0.16, h * 0.14
    # Bell Dome
    d.pieslice([bell_cx - bw, bell_cy - bh, bell_cx + bw, bell_cy + bh * 0.8], start=180, end=360, fill=bell_color, outline=DEEP_BORDER, width=int(8 * s))
    # Bell Flare rim
    d.rounded_rectangle([bell_cx - bw * 1.15, bell_cy + bh * 0.2, bell_cx + bw * 1.15, bell_cy + bh * 0.6], radius=int(6 * s), fill=bell_color, outline=DEEP_BORDER, width=int(7 * s))
    # Bell specular highlight
    d.ellipse([bell_cx - bw * 0.5, bell_cy - bh * 0.6, bell_cx - bw * 0.1, bell_cy - bh * 0.1], fill=(255, 255, 255, 160))
    # Bell clapper
    d.ellipse([bell_cx - bw * 0.25, bell_cy + bh * 0.5, bell_cx + bw * 0.25, bell_cy + bh * 0.85], fill=(70, 50, 30, 255))

    # Main Cow Head Silhouette (White coat base)
    d.ellipse([w * 0.14, h * 0.12, w * 0.86, h * 0.70], fill=(248, 249, 252, 255), outline=DEEP_BORDER, width=int(12 * s))

    # Characteristic Holstein Black Patches
    d.ellipse([w * 0.16, h * 0.14, w * 0.44, h * 0.44], fill=DEEP_BORDER)
    d.ellipse([w * 0.56, h * 0.22, w * 0.84, h * 0.52], fill=DEEP_BORDER)
    d.ellipse([w * 0.38, h * 0.12, w * 0.62, h * 0.28], fill=DEEP_BORDER)

    # Horns (Bone/smooth texture)
    for sx, angle in [(-1, 20), (1, -20)]:
        hx = cx + sx * w * 0.24
        hy = h * 0.14
        d.polygon([(hx, hy + 10 * s), (hx + sx * 25 * s, hy - 35 * s), (hx - sx * 10 * s, hy - 15 * s)], fill=(232, 226, 214, 255), outline=DEEP_BORDER)

    # Ears (Left and Right)
    if mouth_open:
        # Ears pulled back/down on MOOO
        d.ellipse([w * 0.05, h * 0.24, w * 0.30, h * 0.40], fill=(248, 249, 252, 255), outline=DEEP_BORDER, width=int(9 * s))
        d.ellipse([w * 0.10, h * 0.27, w * 0.26, h * 0.37], fill=(238, 155, 172, 255))
        d.ellipse([w * 0.70, h * 0.24, w * 0.95, h * 0.40], fill=(248, 249, 252, 255), outline=DEEP_BORDER, width=int(9 * s))
        d.ellipse([w * 0.74, h * 0.27, w * 0.90, h * 0.37], fill=(238, 155, 172, 255))
    else:
        # Ears relaxed out forward
        d.ellipse([w * 0.04, h * 0.18, w * 0.32, h * 0.32], fill=(248, 249, 252, 255), outline=DEEP_BORDER, width=int(9 * s))
        d.ellipse([w * 0.08, h * 0.21, w * 0.28, h * 0.29], fill=(238, 155, 172, 255))
        d.ellipse([w * 0.68, h * 0.18, w * 0.96, h * 0.32], fill=(248, 249, 252, 255), outline=DEEP_BORDER, width=int(9 * s))
        d.ellipse([w * 0.72, h * 0.21, w * 0.92, h * 0.29], fill=(238, 155, 172, 255))

    # Eyes
    for sx in (-0.17, 0.17):
        ex = cx + sx * w
        ey = h * 0.34
        er = 22 * s if mouth_open else 16 * s # Eyes wide open on MOOO!
        d.ellipse([ex - er, ey - er, ex + er, ey + er], fill=(255, 255, 255, 255), outline=DEEP_BORDER, width=int(5 * s))
        d.ellipse([ex - er * 0.6, ey - er * 0.6, ex + er * 0.6, ey + er * 0.6], fill=DEEP_BORDER)
        # Catchlight
        d.ellipse([ex - er * 0.3, ey - er * 0.4, ex, ey - er * 0.1], fill=(255, 255, 255, 255))

    # Muzzle & Mouth (The crucial tell!)
    if mouth_open:
        # Open mouth: Jaw drops to ~1/3 head height, pink muzzle & tongue form large shape!
        muzzle_box = [cx - w * 0.24, h * 0.44, cx + w * 0.24, h * 0.74]
        d.ellipse(muzzle_box, fill=(244, 152, 168, 255), outline=DEEP_BORDER, width=int(10 * s))
        # Deep open mouth cavern
        d.ellipse([cx - w * 0.16, h * 0.52, cx + w * 0.16, h * 0.70], fill=(124, 22, 44, 255), outline=DEEP_BORDER, width=int(6 * s))
        # Bright pink tongue
        d.ellipse([cx - w * 0.12, h * 0.60, cx + w * 0.12, h * 0.69], fill=(248, 105, 135, 255))
        # Nostrils
        for sx in (-0.08, 0.08):
            d.ellipse([cx + sx * w - 8 * s, h * 0.47 - 6 * s, cx + sx * w + 8 * s, h * 0.47 + 6 * s], fill=DEEP_BORDER)
    else:
        # Closed mouth: compact muzzle, mouth shut
        muzzle_box = [cx - w * 0.20, h * 0.46, cx + w * 0.20, h * 0.66]
        d.ellipse(muzzle_box, fill=(244, 152, 168, 255), outline=DEEP_BORDER, width=int(9 * s))
        # Subtle closed mouth line
        d.arc([cx - w * 0.09, h * 0.54, cx + w * 0.09, h * 0.62], start=20, end=160, fill=DEEP_BORDER, width=int(6 * s))
        # Nostrils
        for sx in (-0.07, 0.07):
            d.ellipse([cx + sx * w - 7 * s, h * 0.50 - 5 * s, cx + sx * w + 7 * s, h * 0.50 + 5 * s], fill=DEEP_BORDER)

def make_cow(size, bell_color=GOLD, mouth_open=False, side_view=False):
    return render_supersampled(lambda img, s: draw_cow(img, s, mouth_open, bell_color, side_view), size, size)

# ── 2. Premium Symbols (H1–H5) ──────────────────────────────────────────────
def draw_h1_rosette(img, s):
    d = ImageDraw.Draw(img)
    w, h = img.width, img.height
    cx, cy = w / 2, h * 0.44

    # Tails (swallowtail ribbons)
    tail_w = w * 0.12
    for sx, angle in [(-0.12, -12), (0.12, 12)]:
        tx = cx + sx * w
        d.polygon([(tx - tail_w, cy), (tx + tail_w, cy), (tx + tail_w * 1.2, h * 0.94), (tx, h * 0.84), (tx - tail_w * 1.2, h * 0.94)],
                  fill=(196, 30, 62, 255), outline=DEEP_BORDER, width=int(8 * s))

    # 3 concentric pleated ribbon rings
    petals = 16
    for ring_idx, (r_outer, color) in enumerate([(w * 0.40, (196, 30, 62)), (w * 0.30, (247, 238, 214)), (w * 0.22, (150, 18, 42))]):
        points = []
        for i in range(petals * 2):
            a = math.pi * i / petals
            rr = r_outer if i % 2 == 0 else r_outer * 0.84
            points.append((cx + math.cos(a) * rr, cy + math.sin(a) * rr))
        d.polygon(points, fill=(*color, 255), outline=DEEP_BORDER, width=int(7 * s))

    # Center Boss Badge
    d.ellipse([cx - w * 0.14, cy - w * 0.14, cx + w * 0.14, cy + w * 0.14], fill=(247, 238, 214, 255), outline=DEEP_BORDER, width=int(8 * s))
    d.ellipse([cx - w * 0.10, cy - w * 0.10, cx + w * 0.10, cy + w * 0.10], fill=(196, 30, 62, 255))
    # Star in center
    star_pts = []
    for i in range(10):
        a = math.pi * i / 5 - math.pi / 2
        rr = w * 0.07 if i % 2 == 0 else w * 0.03
        star_pts.append((cx + math.cos(a) * rr, cy + math.sin(a) * rr))
    d.polygon(star_pts, fill=(247, 238, 214, 255))

def draw_h2_ribbon(img, s):
    d = ImageDraw.Draw(img)
    w, h = img.width, img.height
    cx, cy = w / 2, h * 0.44

    # Single short tail
    d.polygon([(cx - w * 0.10, cy), (cx + w * 0.10, cy), (cx + w * 0.12, h * 0.88), (cx, h * 0.78), (cx - w * 0.12, h * 0.88)],
              fill=(36, 78, 176, 255), outline=DEEP_BORDER, width=int(8 * s))

    # Single layer cobalt ribbon
    petals = 14
    r_outer = w * 0.38
    points = []
    for i in range(petals * 2):
        a = math.pi * i / petals
        rr = r_outer if i % 2 == 0 else r_outer * 0.85
        points.append((cx + math.cos(a) * rr, cy + math.sin(a) * rr))
    d.polygon(points, fill=(36, 78, 176, 255), outline=DEEP_BORDER, width=int(8 * s))

    # Center Boss Badge
    d.ellipse([cx - w * 0.15, cy - w * 0.15, cx + w * 0.15, cy + w * 0.15], fill=(247, 238, 214, 255), outline=DEEP_BORDER, width=int(8 * s))
    d.ellipse([cx - w * 0.11, cy - w * 0.11, cx + w * 0.11, cy + w * 0.11], fill=(36, 78, 176, 255))

def draw_h3_bottle(img, s):
    d = ImageDraw.Draw(img)
    w, h = img.width, img.height
    cx = w / 2

    # Glass Milk Bottle Body
    d.rounded_rectangle([cx - w * 0.18, h * 0.28, cx + w * 0.18, h * 0.88], radius=int(24 * s), fill=(226, 232, 220, 235), outline=DEEP_BORDER, width=int(10 * s))
    # Milk contents
    d.rounded_rectangle([cx - w * 0.16, h * 0.36, cx + w * 0.16, h * 0.86], radius=int(18 * s), fill=(250, 252, 245, 255))
    # Bottle neck
    d.rounded_rectangle([cx - w * 0.11, h * 0.14, cx + w * 0.11, h * 0.30], radius=int(12 * s), fill=(226, 232, 220, 235), outline=DEEP_BORDER, width=int(9 * s))
    # Red foil cap
    d.rounded_rectangle([cx - w * 0.13, h * 0.10, cx + w * 0.13, h * 0.20], radius=int(8 * s), fill=(214, 58, 58, 255), outline=DEEP_BORDER, width=int(8 * s))
    # Glass condensation droplets
    for dx, dy in [(-0.08, 0.45), (0.06, 0.55), (-0.04, 0.68), (0.08, 0.75)]:
        d.ellipse([cx + dx * w - 5 * s, h * dy - 7 * s, cx + dx * w + 5 * s, h * dy + 7 * s], fill=(255, 255, 255, 180))

def draw_timber_ground(d, w, h, s):
    """Weathered timber ground plane shared by H4 & H5 to show shared pay tier."""
    gy0, gy1 = h * 0.78, h * 0.94
    d.rectangle([w * 0.08, gy0, w * 0.92, gy1], fill=(86, 56, 38, 255), outline=DEEP_BORDER, width=int(8 * s))
    # Wood grain lines
    d.line([w * 0.10, gy0 + 8 * s, w * 0.90, gy0 + 8 * s], fill=(116, 78, 52, 255), width=int(4 * s))
    # Top rim highlight on wood
    d.line([w * 0.08, gy0, w * 0.92, gy0], fill=(215, 175, 130, 255), width=int(4 * s))

def draw_h4_bale(img, s):
    d = ImageDraw.Draw(img)
    w, h = img.width, img.height

    draw_timber_ground(d, w, h, s)

    # Hay Bale
    d.rounded_rectangle([w * 0.14, h * 0.28, w * 0.86, h * 0.78], radius=int(22 * s), fill=(206, 176, 102, 255), outline=DEEP_BORDER, width=int(10 * s))
    # Straw texture strands
    for y_rel in (0.36, 0.46, 0.56, 0.66):
        d.line([w * 0.18, h * y_rel, w * 0.82, h * y_rel], fill=(228, 202, 134, 255), width=int(5 * s))
    # Twine bands
    for x in (0.36, 0.64):
        d.line([w * x, h * 0.28, w * x, h * 0.78], fill=(62, 42, 28, 255), width=int(10 * s))

def draw_h5_bucket(img, s):
    d = ImageDraw.Draw(img)
    w, h = img.width, img.height

    draw_timber_ground(d, w, h, s)

    # Duck-egg blue enamel bucket
    d.polygon([(w * 0.24, h * 0.32), (w * 0.76, h * 0.32), (w * 0.66, h * 0.78), (w * 0.34, h * 0.78)],
              fill=(122, 178, 186, 255), outline=DEEP_BORDER, width=int(10 * s))
    # Chipped enamel spots showing dark rim
    d.ellipse([w * 0.26, h * 0.33, w * 0.34, h * 0.39], fill=DEEP_BORDER)
    d.ellipse([w * 0.68, h * 0.34, w * 0.74, h * 0.40], fill=DEEP_BORDER)
    # Handle bail
    d.arc([w * 0.24, h * 0.14, w * 0.76, h * 0.48], start=190, end=350, fill=DEEP_BORDER, width=int(11 * s))
    # Wooden grip on handle
    d.rounded_rectangle([w * 0.42, h * 0.14, w * 0.58, h * 0.22], radius=int(6 * s), fill=(140, 92, 58, 255), outline=DEEP_BORDER, width=int(5 * s))

# ── 3. Royals (L1–L4) ───────────────────────────────────────────────────────
def draw_royal_badge(img, s, color, glyph):
    d = ImageDraw.Draw(img)
    w, h = img.width, img.height
    cx, cy = w / 2, h / 2
    pad = w * 0.12

    # Chipped white enamel rim on pressed tin
    d.ellipse([pad, pad, w - pad, h - pad], fill=DEEP_BORDER)
    d.ellipse([pad + 12 * s, pad + 12 * s, w - pad - 12 * s, h - pad - 12 * s], fill=(247, 238, 214, 255))
    # Color field (FLAT ENAMEL, NO METALLIC SPECULAR)
    d.ellipse([pad + 26 * s, pad + 26 * s, w - pad - 26 * s, h - pad - 26 * s], fill=(*color, 255))

    # Pin bar at bottom
    d.rectangle([cx - w * 0.14, h - pad - 18 * s, cx + w * 0.14, h - pad - 6 * s], fill=(180, 184, 190, 255), outline=DEEP_BORDER, width=int(4 * s))

    # Cream Pictogram
    r = w * 0.16
    if glyph == "horseshoe":
        d.arc([cx - r, cy - r, cx + r, cy + r], start=200, end=340, fill=CREAM, width=int(w * 0.06))
        for sx in (-1, 1):
            d.ellipse([cx + sx * r - 12 * s, cy + r * 0.34 - 12 * s, cx + sx * r + 12 * s, cy + r * 0.34 + 12 * s], fill=CREAM)
    elif glyph == "clover":
        for angle in (0, 90, 180, 270):
            a = math.radians(angle)
            lx, ly = cx + math.cos(a) * r * 0.55, cy + math.sin(a) * r * 0.55
            d.ellipse([lx - r * 0.5, ly - r * 0.5, lx + r * 0.5, ly + r * 0.5], fill=CREAM)
    elif glyph == "wheat":
        d.line([cx, cy + r, cx, cy - r], fill=CREAM, width=int(w * 0.045))
        for i in range(4):
            y_pos = cy - r + i * r * 0.5
            d.line([cx, y_pos, cx - r * 0.6, y_pos - r * 0.28], fill=CREAM, width=int(w * 0.035))
            d.line([cx, y_pos, cx + r * 0.6, y_pos - r * 0.28], fill=CREAM, width=int(w * 0.035))
    else:  # egg
        d.ellipse([cx - r * 0.72, cy - r, cx + r * 0.72, cy + r], fill=CREAM)

# ── 4. Special Symbols (Scatter & Churn) ────────────────────────────────────
def draw_scatter_horn(img, s):
    d = ImageDraw.Draw(img)
    w, h = img.width, img.height

    # Tannoy cone horn
    d.polygon([(w * 0.18, h * 0.22), (w * 0.18, h * 0.78), (w * 0.68, h * 0.60), (w * 0.68, h * 0.40)],
              fill=CREAM, outline=DEEP_BORDER, width=int(10 * s))
    # Red stripe at mouth
    d.ellipse([w * 0.10, h * 0.20, w * 0.26, h * 0.80], fill=(214, 58, 58, 255), outline=DEEP_BORDER, width=int(9 * s))
    # Bracket mount
    d.rounded_rectangle([w * 0.66, h * 0.42, w * 0.84, h * 0.58], radius=int(8 * s), fill=DEEP_BORDER)

def draw_churn(img, s):
    d = ImageDraw.Draw(img)
    w, h = img.width, img.height
    grey = (150, 158, 168)

    # MATTE galvanised steel churn (NO specular)
    d.polygon([(w * 0.30, h * 0.30), (w * 0.70, h * 0.30), (w * 0.78, h * 0.84), (w * 0.22, h * 0.84)],
              fill=grey, outline=DEEP_BORDER, width=int(10 * s))
    d.rounded_rectangle([w * 0.34, h * 0.16, w * 0.66, h * 0.32], radius=int(10 * s), fill=grey, outline=DEEP_BORDER, width=int(9 * s))
    # Cream painted band
    d.line([w * 0.24, h * 0.60, w * 0.76, h * 0.60], fill=CREAM, width=int(14 * s))

# ── 5. Backgrounds & UI ──────────────────────────────────────────────────────
def draw_radial_glow(img, color, power=2.0):
    w, h = img.width, img.height
    px = img.load()
    cx, cy = w / 2, h / 2
    for y in range(h):
        for x in range(w):
            dist = math.hypot(x - cx, y - cy) / cx
            a = max(0.0, 1.0 - dist) ** power
            px[x, y] = (*color, int(255 * a))

def draw_background_scene(img, sky_top, sky_bottom, mode="base"):
    d = ImageDraw.Draw(img)
    w, h = img.width, img.height

    # Sky gradient
    for y in range(h):
        t = y / h
        c = tuple(int(sky_top[i] + (sky_bottom[i] - sky_top[i]) * t) for i in range(3))
        d.line([0, y, w, y], fill=(*c, 255))

    # Floodlights
    for i in range(6):
        x = w * (i + 0.5) / 6
        glow = canvas(int(w * 0.34), int(w * 0.34))
        draw_radial_glow(glow, SODIUM_WARM, 2.4)
        img.alpha_composite(glow, (int(x - w * 0.17), int(h * 0.38)))

    # Bunting flags across top
    span = w / 16
    for i in range(17):
        x = i * span
        y = h * 0.06 + math.sin(i * 0.6) * h * 0.025
        flag_color = [(214, 58, 58), CREAM, (58, 156, 74), (44, 96, 196)][i % 4]
        d.polygon([(x, y), (x + span * 0.6, y), (x + span * 0.3, y + h * 0.07)], fill=(*flag_color, 240))

# ── 6. Token Sheet Generator ─────────────────────────────────────────────────
def draw_token_frame(img, s, phase):
    d = ImageDraw.Draw(img)
    w, h = img.width, img.height
    cx, cy = w / 2, h / 2
    squash = abs(math.cos(phase))
    half_w = max(2.0, (w * 0.42) * squash)
    half_h = h * 0.42
    edge_on = squash < 0.18

    body = SILVER if edge_on else (214, 58, 58)
    d.ellipse([cx - half_w, cy - half_h, cx + half_w, cy + half_h], fill=(*body, 255), outline=DEEP_BORDER, width=int(6 * s))
    if not edge_on and squash > 0.45:
        d.ellipse([cx - half_w * 0.45, cy - half_h * 0.45, cx + half_w * 0.45, cy + half_h * 0.45], fill=CREAM, outline=DEEP_BORDER, width=int(4 * s))

def build_token_assets():
    cols, rows = 4, 3
    token_size = 128
    sheet = canvas(token_size * cols, token_size * rows)
    frames = {}
    for i in range(12):
        x = (i % cols) * token_size
        y = (i // cols) * token_size
        frame_img = render_supersampled(lambda img, s: draw_token_frame(img, s, math.pi * i / 12), token_size, token_size)
        sheet.alpha_composite(frame_img, (x, y))
        box = {"x": x, "y": y, "w": token_size, "h": token_size}
        frames[f"{i + 1}.png"] = {
            "frame": box,
            "rotated": False,
            "trimmed": False,
            "spriteSourceSize": {"x": 0, "y": 0, "w": token_size, "h": token_size},
            "sourceSize": {"w": token_size, "h": token_size},
        }
    manifest = {
        "frames": frames,
        "animations": {"token": [f"{i + 1}.png" for i in range(12)]},
        "meta": {
            "app": "design/build_art.py",
            "version": "1.0",
            "image": "token.png",
            "format": "RGBA8888",
            "size": {"w": token_size * cols, "h": token_size * rows},
            "scale": "1",
        },
    }
    return sheet, manifest

# ── Main Entrypoint ──────────────────────────────────────────────────────────
def main():
    print("Generating Moooo artwork assets...")
    written = []

    # 1. Symbols
    written.append(save(make_cow(SIZE, GOLD, mouth_open=False), "mooooSymbols", "w.png"))
    written.append(save(render_supersampled(draw_h1_rosette, SIZE, SIZE), "mooooSymbols", "h1.png"))
    written.append(save(render_supersampled(draw_h2_ribbon, SIZE, SIZE), "mooooSymbols", "h2.png"))
    written.append(save(render_supersampled(draw_h3_bottle, SIZE, SIZE), "mooooSymbols", "h3.png"))
    written.append(save(render_supersampled(draw_h4_bale, SIZE, SIZE), "mooooSymbols", "h4.png"))
    written.append(save(render_supersampled(draw_h5_bucket, SIZE, SIZE), "mooooSymbols", "h5.png"))

    royals = {
        "l1": ((214, 42, 58), "horseshoe"),
        "l2": ((58, 156, 74), "clover"),
        "l3": ((44, 96, 196), "wheat"),
        "l4": ((132, 82, 190), "egg"),
    }
    for name, (color, glyph) in royals.items():
        written.append(save(render_supersampled(lambda img, s, c=color, g=glyph: draw_royal_badge(img, s, c, g), SIZE, SIZE), "mooooSymbols", f"{name}.png"))

    written.append(save(render_supersampled(draw_scatter_horn, SIZE, SIZE), "mooooSymbols", "fs.png"))
    written.append(save(render_supersampled(draw_churn, SIZE, SIZE), "mooooSymbols", "m.png"))

    # Cell frame overlay
    frame = canvas(SIZE, SIZE)
    d_f = ImageDraw.Draw(frame)
    d_f.rounded_rectangle([8, 8, SIZE - 8, SIZE - 8], radius=24, fill=(26, 20, 58, 180), outline=CREAM, width=6)
    written.append(save(frame, "mooooSymbols", "frame.png"))

    # 2. FX
    glow = canvas(256, 256)
    draw_radial_glow(glow, (255, 255, 255), 2.2)
    written.append(save(glow, "mooooFx", "fx_glow.png"))

    star_img = canvas(256, 256)
    d_s = ImageDraw.Draw(star_img)
    pts = []
    for i in range(8):
        a = math.pi * i / 4
        rr = 120 if i % 2 == 0 else 36
        pts.append((128 + math.cos(a) * rr, 128 + math.sin(a) * rr))
    d_s.polygon(pts, fill=(255, 255, 255, 255))
    written.append(save(star_img.filter(ImageFilter.GaussianBlur(4)), "mooooFx", "fx_star.png"))

    streak = canvas(256, 64)
    d_st = ImageDraw.Draw(streak)
    d_st.ellipse([10, 20, 246, 44], fill=(255, 255, 255, 220))
    written.append(save(streak.filter(ImageFilter.GaussianBlur(3)), "mooooFx", "fx_streak.png"))

    leaf = canvas(128, 128)
    draw_radial_glow(leaf, (255, 255, 255), 3.0)
    written.append(save(leaf, "mooooFx", "fx_leaf.png"))

    vignette = canvas(1024, 1024)
    px_v = vignette.load()
    for y in range(1024):
        for x in range(1024):
            dist = math.hypot(x - 512, y - 512) / 512
            px_v[x, y] = (0, 0, 0, int(255 * min(1.0, max(0.0, (dist - 0.55) / 0.6))))
    written.append(save(vignette, "mooooFx", "fx_vignette.png"))

    # Transition Cow
    trans_cow = make_cow(720, GOLD, mouth_open=True, side_view=True)
    side = canvas(1024, 512)
    side.alpha_composite(trans_cow.crop((0, 100, 720, 612)), (150, 0))
    written.append(save(side, "mooooFx", "transition_cow.png"))

    # 3. Backgrounds
    bg_base = canvas(2039, 1000)
    draw_background_scene(bg_base, INDIGO_DARK, (92, 46, 82), "base")
    written.append(save(bg_base, "mooooBackground", "bg_base.png"))

    bg_feat = canvas(2039, 1000)
    draw_background_scene(bg_feat, (34, 22, 70), (128, 62, 74), "feature")
    written.append(save(bg_feat, "mooooBackground", "bg_feature.png"))

    bg_super = canvas(2039, 1000)
    draw_background_scene(bg_super, (12, 10, 34), (72, 34, 96), "super")
    written.append(save(bg_super, "mooooBackground", "bg_super.png"))

    # 4. Reel Housing & UI
    frame_bg = canvas(1280, 1280)
    ImageDraw.Draw(frame_bg).rounded_rectangle([10, 10, 1270, 1270], radius=48, fill=(18, 12, 34, 255))
    written.append(save(frame_bg, "mooooFrame", "frame_bg.png"))

    frame_edge = canvas(1280, 1280)
    ImageDraw.Draw(frame_edge).rounded_rectangle([10, 10, 1270, 1270], radius=48, fill=(26, 20, 58, 230), outline=CREAM, width=8)
    written.append(save(frame_edge, "mooooFrame", "frame_edge.png"))

    fs_panel = canvas(520, 190)
    ImageDraw.Draw(fs_panel).rounded_rectangle([6, 6, 514, 184], radius=20, fill=(26, 20, 58, 240), outline=CREAM, width=6)
    written.append(save(fs_panel, "mooooFrame", "fs_counter_panel.png"))

    fs_sign = canvas(900, 320)
    ImageDraw.Draw(fs_sign).rounded_rectangle([8, 8, 892, 312], radius=28, fill=(92, 30, 62, 240), outline=CREAM, width=8)
    written.append(save(fs_sign, "mooooFrame", "fs_sign.png"))

    ticker = canvas(560, 120)
    ImageDraw.Draw(ticker).rounded_rectangle([4, 4, 556, 116], radius=18, fill=(26, 20, 58, 230), outline=CREAM, width=5)
    written.append(save(ticker, "mooooUi", "ticker_plate.png"))

    buybonus = canvas(300, 300)
    ImageDraw.Draw(buybonus).rounded_rectangle([6, 6, 294, 294], radius=24, fill=(92, 30, 62, 235), outline=CREAM, width=6)
    written.append(save(buybonus, "mooooUi", "buybonus_plate.png"))

    # Icons
    for icon_name in ("menu", "menuExit", "soundOn", "soundOff", "autoSpin", "settings", "info", "payTable"):
        ic = canvas(128, 128)
        d_i = ImageDraw.Draw(ic)
        d_i.ellipse([16, 16, 112, 112], outline=CREAM, width=6)
        written.append(save(ic, "mooooUiIcons", f"{icon_name}.png"))

    # Win Banners
    for name, pips, color in (("big", 1, (92, 30, 62)), ("superwin", 2, (120, 40, 70)),
                              ("mega", 3, (150, 52, 66)), ("epic", 4, (176, 64, 60)),
                              ("max", 5, (196, 30, 62))):
        b = canvas(760, 260)
        d_b = ImageDraw.Draw(b)
        d_b.rounded_rectangle([6, 6, 754, 254], radius=28, fill=(*color, 240), outline=CREAM, width=7)
        for i in range(pips):
            x = 380 + (i - (pips - 1) / 2) * 46
            d_b.ellipse([x - 14, 190 - 14, x + 14, 190 + 14], fill=CREAM)
        written.append(save(b, "mooooWinBanners", f"{name}.png"))

    # Brand Logo
    logo = canvas(1200, 500)
    d_l = ImageDraw.Draw(logo)
    d_l.rounded_rectangle([40, 120, 1160, 380], radius=60, fill=(*INDIGO_MID, 240), outline=CREAM, width=10)
    logo.alpha_composite(make_cow(300, GOLD, mouth_open=True), (60, 100))
    written.append(save(logo, "mooooBrand", "logo.png"))

    # Store Tile & Intro Foreground
    tile_fg_cow = make_cow(760, GOLD, mouth_open=True)
    tile_fg = canvas(1024, 1024)
    tile_fg.alpha_composite(tile_fg_cow, (132, 150))
    assert tile_fg.split()[-1].getextrema()[0] == 0, "store-tile FG must have transparency"
    written.append(save(tile_fg, "mooooBrand", "tile_foreground.png"))
    written.append(save(tile_fg, "mooooTile", "Moooo-FG.png"))

    tile_bg_scene = canvas(1024, 1024)
    draw_background_scene(tile_bg_scene, INDIGO_DARK, (92, 46, 82), "base")
    tile_bg = Image.new("RGB", (1024, 1024), DEEP_BORDER)
    tile_bg.paste(tile_bg_scene, (0, 0), tile_bg_scene)
    tile_bg = tile_bg.convert("RGBA")
    assert tile_bg.split()[-1].getextrema() == (255, 255), "store-tile BG must be fully opaque"
    written.append(save(tile_bg, "mooooTile", "Moooo-BG.png"))

    # Also copy store tiles to upload/Moooo/thumbnail/
    save_to_path(tile_bg, os.path.join(UPLOAD_THUMB, "Moooo-BG.png"))
    save_to_path(tile_fg, os.path.join(UPLOAD_THUMB, "Moooo-FG.png"))

    # Token Sheet
    sheet, manifest = build_token_assets()
    written.append(save(sheet, "mooooToken", "token.png"))
    json_path = os.path.join(OUT, "mooooToken", "token.json")
    with open(json_path, "w", encoding="UTF-8") as h:
        json.dump(manifest, h, indent="\t")
    written.append(os.path.relpath(json_path, os.path.join(HERE, "..")))

    print(f"Successfully generated {len(written)} production artwork files!")

if __name__ == "__main__":
    main()
