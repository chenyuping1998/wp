"""Go Bananeon UI art v2: chrome bezels, neon tubes, dark glass.

Review 2026-10-31 flagged "low quality assets" and "inconsistent art style":
the painted, glossy symbols and backgrounds sat inside flat PIL rectangles
(build_neon_delivery.py). This redraws the same pieces as lit materials so
they read as the same world as the symbols:

  chrome  a height field (rounded bevel) shaded with an environment map of the
          synthwave scene: pale sky above, a hard dark horizon, magenta floor
          glow below, plus a top-left specular
  neon    a glass tube along a path: white-hot core, saturated body, two-stage
          glow that spills onto the metal around it
  glass   dark violet panel, inner shadow, one diagonal sheen, faint scanlines

GEOMETRY IS UNCHANGED. Every box below is the one build_neon_delivery.py drew
(and the mesh rigs in src/game/meshWin were measured on): frameEdge rails,
fsSign planks, fsCounter plate. Only the material changes.

    python design/build_neon_ui_v2.py            # write previews to design/neon_ui_v2/
    python design/build_neon_ui_v2.py --install  # also copy into static/assets
"""

import shutil
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont
from scipy import ndimage

HERE = Path(__file__).parent
OUT = HERE / "neon_ui_v2"
SPR = HERE.parent / "static" / "assets" / "sprites"
FONT = HERE.parent / "static" / "fonts" / "TitanOne.ttf"
SS = 2  # supersampling

CYAN = (0.20, 0.92, 1.00)
MAGENTA = (1.00, 0.20, 0.82)
LIME = (0.70, 1.00, 0.25)
VIOLET = (0.62, 0.40, 1.00)
RNG = np.random.default_rng(7)


# ---------------------------------------------------------------- canvas


class Canvas:
    """Premultiplied float RGBA at SS x the final size; coordinates in final px."""

    def __init__(self, w, h):
        self.w, self.h = w, h
        H, W = h * SS, w * SS
        self.C = np.zeros((H, W, 3), np.float32)
        self.A = np.zeros((H, W), np.float32)
        ys, xs = np.mgrid[0:H, 0:W].astype(np.float32)
        self.x = (xs + 0.5) / SS
        self.y = (ys + 0.5) / SS

    def over(self, rgb, a):
        a = np.clip(a, 0, 1)[..., None]
        self.C = rgb * a + self.C * (1 - a)
        self.A = a[..., 0] + self.A * (1 - a[..., 0])

    def add(self, color, g):
        g = np.clip(g, 0, None)
        self.C += np.asarray(color, np.float32) * g[..., None]
        self.A = self.A + np.clip(g, 0, 1) * (1 - self.A)

    def clear(self, mask):
        keep = 1 - np.clip(mask, 0, 1)
        self.C *= keep[..., None]
        self.A *= keep

    def image(self):
        A = np.clip(self.A, 0, 1)
        rgb = np.where(A[..., None] > 1e-4, self.C / np.maximum(A, 1e-4)[..., None], 0)
        rgba = np.dstack([np.clip(rgb, 0, 1), A])
        im = Image.fromarray((rgba * 255 + 0.5).astype(np.uint8), "RGBA")
        return im.resize((self.w, self.h), Image.Resampling.LANCZOS)


def sdf_rrect(cv, box, r):
    """Signed distance (final px) to a rounded rect; negative inside."""
    x0, y0, x1, y1 = box
    cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
    bx, by = (x1 - x0) / 2 - r, (y1 - y0) / 2 - r
    qx = np.abs(cv.x - cx) - bx
    qy = np.abs(cv.y - cy) - by
    out = np.hypot(np.maximum(qx, 0), np.maximum(qy, 0))
    return out + np.minimum(np.maximum(qx, qy), 0) - r


def cover(d):
    """Anti-aliased coverage of the region d < 0 (d in final px)."""
    return np.clip(0.5 - d * SS, 0, 1)


def inset(box, n):
    return (box[0] + n, box[1] + n, box[2] - n, box[3] - n)


def rounded(t, R):
    """Quarter-circle bevel profile: 0 at the edge, 1 once R inside."""
    u = np.clip(t / R, 0, 1)
    return np.sqrt(1 - (1 - u) ** 2)


# ---------------------------------------------------------------- materials

LIGHT = np.array([-0.45, -0.65, 0.62], np.float32)
LIGHT /= np.linalg.norm(LIGHT)


def env(u):
    """Synthwave environment seen in chrome. u = how far the reflection points UP."""
    stops = [
        (-1.00, (0.10, 0.06, 0.20)),
        (-0.55, (0.55, 0.16, 0.55)),  # magenta floor glow
        (-0.22, (0.30, 0.12, 0.42)),
        (-0.02, (0.07, 0.06, 0.16)),  # hard horizon
        (0.03, (0.55, 0.62, 0.78)),
        (0.30, (0.80, 0.90, 1.00)),
        (0.70, (0.96, 0.98, 1.00)),
        (1.00, (0.70, 0.84, 1.00)),
    ]
    xs = np.array([s[0] for s in stops])
    out = np.zeros(u.shape + (3,), np.float32)
    for k in range(3):
        out[..., k] = np.interp(u, xs, [s[1][k] for s in stops])
    return out


def chrome(cv, height, mask, tint=(1, 1, 1), tilt=0.28, gain=1.0):
    """Shade a height field (final px units) as polished chrome, composite over."""
    h = ndimage.gaussian_filter(height * SS, 0.8)
    gy, gx = np.gradient(h)
    n = np.dstack([-gx, -gy, np.ones_like(h)])
    n /= np.linalg.norm(n, axis=2, keepdims=True)
    # reflect the view (0,0,1): R = 2 nz n - v
    R = 2 * n[..., 2:3] * n
    R[..., 2] -= 1
    # the canvas's own vertical position nudges the horizon, so a flat top face
    # still runs light-to-dark down a long rail instead of reading as grey
    u = -R[..., 1] + tilt * (0.5 - cv.y / cv.h)
    col = env(u)
    spec = np.clip((R * LIGHT).sum(2), 0, 1) ** 36
    diff = np.clip((n * LIGHT).sum(2), 0, 1)
    col = col * (0.55 + 0.45 * diff[..., None]) + spec[..., None] * 0.9
    grain = ndimage.gaussian_filter(RNG.standard_normal(h.shape).astype(np.float32), 1.2) * 0.035
    col = col * (1 + grain[..., None]) * np.asarray(tint, np.float32) * gain
    cv.over(np.clip(col, 0, 1.4), mask)


def bevel_ring(cv, outer, r_out, inner, r_in, depth=10.0, round_px=10.0, **kw):
    """A chrome band between two rounded rects, rounded on both edges."""
    d_o = sdf_rrect(cv, outer, r_out)
    d_i = sdf_rrect(cv, inner, r_in)
    t_out, t_in = -d_o, d_i
    h = depth * np.minimum(rounded(t_out, round_px), rounded(t_in, round_px))
    mask = cover(d_o) * (1 - cover(d_i))
    chrome(cv, np.where(mask > 0, h, 0), mask, **kw)


def bevel_plate(cv, box, r, depth=8.0, round_px=8.0, **kw):
    d = sdf_rrect(cv, box, r)
    chrome(cv, depth * rounded(-d, round_px), cover(d), **kw)


def channel(cv, outer, r_out, inner, r_in, color=(0.03, 0.02, 0.08)):
    """The dark recess a tube sits in, darker toward its walls."""
    d_o = sdf_rrect(cv, outer, r_out)
    d_i = sdf_rrect(cv, inner, r_in)
    mask = cover(d_o) * (1 - cover(d_i))
    wall = np.minimum(-d_o, d_i)
    shade = 0.55 + 0.45 * np.clip(wall / 6, 0, 1)
    cv.over(np.asarray(color, np.float32) * shade[..., None], mask)


def tube(cv, box, r, color, radius=5.0, glow=1.0, region=None):
    """Neon tube along the outline of a rounded rect."""
    d = np.abs(sdf_rrect(cv, box, r))
    region = 1 if region is None else region
    c = np.asarray(color, np.float32)
    g = (0.55 * np.exp(-((d / (radius * 3.2)) ** 2)) + 0.22 * np.exp(-d / (radius * 7))) * glow
    cv.add(c * 0.9, g * region)
    body = cover(d - radius) * region
    across = np.clip(d / radius, 0, 1)
    core = np.exp(-((across / 0.42) ** 2))
    rgb = c * (0.75 + 0.25 * (1 - across))[..., None]
    rgb = rgb * (1 - core[..., None] * 0.85) + core[..., None] * 0.85
    cv.over(np.clip(rgb * 1.08, 0, 1), body)


def tube_line(cv, p0, p1, color, radius=4.0, glow=1.0):
    (x0, y0), (x1, y1) = p0, p1
    vx, vy = x1 - x0, y1 - y0
    L2 = vx * vx + vy * vy
    t = np.clip(((cv.x - x0) * vx + (cv.y - y0) * vy) / L2, 0, 1)
    d = np.hypot(cv.x - (x0 + t * vx), cv.y - (y0 + t * vy))
    c = np.asarray(color, np.float32)
    g = (0.55 * np.exp(-((d / (radius * 3.2)) ** 2)) + 0.2 * np.exp(-d / (radius * 7))) * glow
    cv.add(c * 0.9, g)
    across = np.clip(d / radius, 0, 1)
    core = np.exp(-((across / 0.42) ** 2))
    rgb = c * (1 - core[..., None] * 0.85) + core[..., None] * 0.85
    cv.over(np.clip(rgb * 1.08, 0, 1), cover(d - radius))


def glass(cv, box, r, alpha=0.95, top=(0.11, 0.09, 0.26), bottom=(0.05, 0.04, 0.13), scan=True):
    d = sdf_rrect(cv, box, r)
    mask = cover(d) * alpha
    v = np.clip((cv.y - box[1]) / (box[3] - box[1]), 0, 1)[..., None]
    rgb = np.asarray(top, np.float32) * (1 - v) + np.asarray(bottom, np.float32) * v
    # inner shadow under the bezel
    rgb = rgb * (0.45 + 0.55 * np.clip(-d / 26, 0, 1))[..., None]
    if scan:
        rgb = rgb * (1 - 0.06 * (np.floor(cv.y / 3) % 2 == 0))[..., None]
    # one broad diagonal sheen across the upper left
    s = (cv.x - box[0]) + 0.75 * (cv.y - box[1])
    span = (box[2] - box[0]) * 0.55
    sheen = np.exp(-(((s - span * 0.45) / (span * 0.16)) ** 2)) * 0.07
    sheen *= np.clip(1 - v[..., 0] * 1.4, 0, 1)
    rgb = rgb + sheen[..., None]
    cv.over(np.clip(rgb, 0, 1), mask)
    # crisp glint along the top inner edge
    edge = np.exp(-((d + 3) / 1.4) ** 2) * np.clip(1 - v[..., 0] * 3, 0, 1) * 0.35
    cv.add((0.75, 0.85, 1.0), edge * (d < 0))


def bolt(cv, cx, cy, R):
    r = np.hypot(cv.x - cx, cv.y - cy)
    h = np.sqrt(np.clip(R * R - r * r, 0, None)) * 0.55
    m = cover(r - R)
    # soft drop shadow first
    cv.over(np.zeros(3, np.float32), np.exp(-((r - R * 0.6) / (R * 0.7)) ** 2) * 0.35 * (r > R * 0.8))
    chrome(cv, h, m, tilt=0.0)
    # hex socket
    ang = np.arctan2(cv.y - cy, cv.x - cx)
    hexr = R * 0.42 / np.cos(((ang + np.pi / 6) % (np.pi / 3)) - np.pi / 6)
    cv.over(np.array([0.05, 0.04, 0.10], np.float32), cover(r - hexr) * 0.9)


def save(cv, rel):
    path = OUT / rel
    path.parent.mkdir(parents=True, exist_ok=True)
    cv.image().save(path)
    print("wrote", path.relative_to(HERE))


# ---------------------------------------------------------------- pieces


def frame_edge():
    # Same footprint as v1: housing 24..1256, opening clear from 91.
    cv = Canvas(1280, 1280)
    outer = (24, 24, 1256, 1256)
    # contact shadow on the scene behind
    d = sdf_rrect(cv, outer, 78)
    cv.over(np.zeros(3, np.float32), np.exp(-np.clip(d, 0, None) / 9) * 0.55 * (d > 0))
    bevel_ring(cv, outer, 78, inset(outer, 22), 62, depth=11, round_px=11)
    bevel_ring(cv, inset(outer, 22), 62, inset(outer, 40), 50, depth=9, round_px=9, tilt=0.4)
    channel(cv, inset(outer, 40), 50, inset(outer, 60), 38)
    # magenta all round, cyan carried down the sides (v1's colour plan)
    tube(cv, inset(outer, 50), 44, MAGENTA, radius=4.6, glow=0.6)
    side = np.clip((np.abs(cv.y - 640) < 470) * 1.0, 0, 1)
    side = ndimage.gaussian_filter(side, 30 * SS)
    near_side = np.minimum(np.abs(cv.x - 74), np.abs(cv.x - 1206)) < 26
    tube(cv, inset(outer, 50), 44, CYAN, radius=4.8, glow=0.6, region=side * near_side)
    bevel_ring(cv, inset(outer, 60), 38, inset(outer, 68), 32, depth=5, round_px=4)
    cv.clear(cover(sdf_rrect(cv, inset(outer, 67), 33)))
    save(cv, "frame/frame_edge.png")


def frame_bg():
    cv = Canvas(1280, 1280)
    box = (14, 14, 1266, 1266)
    glass(cv, box, 50, alpha=0.88, top=(0.09, 0.07, 0.22), bottom=(0.04, 0.03, 0.11), scan=False)
    # reel lanes: the board is the centred 1000 (140..1140); five 200px reels
    for i in range(1, 5):
        x = 140 + 200 * i
        lane = np.exp(-(((cv.x - x) / 1.6) ** 2)) * 0.10 * (np.abs(cv.y - 640) < 500)
        cv.add((0.45, 0.35, 0.95), lane)
    save(cv, "frame/frame_bg.png")


def signboard(rel, size, box, strips=False):
    cv = Canvas(*size)
    d = sdf_rrect(cv, box, 63)
    cv.over(np.zeros(3, np.float32), np.exp(-np.clip(d, 0, None) / 14) * 0.6 * (d > 0))
    glass(cv, inset(box, 30), 40)
    bevel_ring(cv, box, 63, inset(box, 24), 44, depth=12, round_px=12)
    channel(cv, inset(box, 22), 46, inset(box, 40), 32)
    tube(cv, inset(box, 31), 39, MAGENTA, radius=4.4, glow=0.6)
    bevel_ring(cv, inset(box, 40), 32, inset(box, 46), 28, depth=4, round_px=3)
    if strips:
        height = box[3] - box[1]
        for y in (box[1] + height // 3, box[1] + 2 * height // 3):
            bar = (box[0] + 40, y - 9, box[2] - 40, y + 9)
            db = sdf_rrect(cv, bar, 9)
            cv.over(np.zeros(3, np.float32), cover(db - 6) * 0.5 * (1 - cover(db)))
            chrome(cv, 6 * rounded(-db, 8), cover(db), tilt=0.1)
            tube_line(cv, (box[0] + 140, y + 17), (box[2] - 140, y + 17), CYAN, radius=2.4, glow=0.7)
    save(cv, rel)


def ticker():
    cv = Canvas(652, 146)
    box = (8, 10, 644, 136)
    glass(cv, inset(box, 12), 22)
    bevel_ring(cv, box, 33, inset(box, 9), 25, depth=4.5, round_px=4.5)
    tube(cv, inset(box, 13), 21, CYAN, radius=2.4, glow=0.55)
    save(cv, "ui/ticker_plate.png")


def ladder(lit):
    cv = Canvas(112, 192)
    box = (12, 14, 100, 178)
    bevel_ring(cv, box, 40, inset(box, 8), 32, depth=5, round_px=5)
    inner = inset(box, 8)
    if lit:
        glass(cv, inner, 32, top=(0.42, 0.10, 0.62), bottom=(0.18, 0.04, 0.36), scan=False)
        di = sdf_rrect(cv, inner, 32)
        core = np.exp(-((np.hypot(cv.x - 56, cv.y - 96) / 34) ** 2))
        cv.add(MAGENTA, core * 0.7 * cover(di))
        tube(cv, inset(box, 11), 29, CYAN, radius=2.2, glow=0.8)
    else:
        glass(cv, inner, 32, top=(0.07, 0.06, 0.15), bottom=(0.03, 0.03, 0.08), scan=False)
    # lightning glyph (the Pulse Bomb charge)
    pts = [(64, 52), (40, 102), (56, 102), (48, 142), (74, 88), (58, 88), (68, 52)]
    m = Image.new("L", (112 * SS, 192 * SS))
    ImageDraw.Draw(m).polygon([(x * SS, y * SS) for x, y in pts], fill=255)
    m = np.asarray(m, np.float32) / 255
    if lit:
        cv.add(CYAN, ndimage.gaussian_filter(m, 7 * SS) * 1.4)
        cv.over(np.array([0.92, 0.98, 1.0], np.float32), m)
    else:
        edge = m - ndimage.binary_erosion(m > 0.5, iterations=3 * SS)
        cv.over(np.array([0.30, 0.26, 0.48], np.float32), np.clip(edge, 0, 1))
    save(cv, f"ui/ladder_stick_{'lit' if lit else 'off'}.png")


def chrome_text(cv, words, color, cy, max_w, size):
    font = ImageFont.truetype(str(FONT), size * SS)
    while True:
        bb = font.getbbox(words)
        if bb[2] - bb[0] <= max_w * SS or size < 40:
            break
        size -= 2
        font = ImageFont.truetype(str(FONT), size * SS)
    H, W = cv.A.shape
    m = Image.new("L", (W, H))
    x = (W - (bb[2] - bb[0])) / 2 - bb[0]
    y = cy * SS - (bb[1] + bb[3]) / 2
    ImageDraw.Draw(m).text((x, y), words, font=font, fill=255)
    m = np.asarray(m, np.float32) / 255
    inside = ndimage.distance_transform_edt(m > 0.5) / SS
    c = np.asarray(color, np.float32)
    # neon halo, then a dark outline, then the chrome-candy letters
    outline_d = ndimage.distance_transform_edt(m < 0.5) / SS
    cv.add(c, np.exp(-outline_d / 16) * 0.75)
    cv.over(np.array([0.04, 0.03, 0.10], np.float32), np.clip(1 - (outline_d - 7) * SS * 0.5, 0, 1))
    tint_v = np.clip((cv.y - (cy - size * 0.36)) / (size * 0.72), 0, 1)[..., None]
    tint = (1 - tint_v) * np.array([1.0, 1.0, 1.0], np.float32) + tint_v * (0.08 + 1.0 * c)
    h = 8 * rounded(inside, 8)
    hs = ndimage.gaussian_filter(h * SS, 2.0 * SS)
    gy, gx = np.gradient(hs)
    n = np.dstack([-gx, -gy, np.ones_like(hs)])
    n /= np.linalg.norm(n, axis=2, keepdims=True)
    R = 2 * n[..., 2:3] * n
    R[..., 2] -= 1
    u = -R[..., 1] + 0.5 * (cy - cv.y) / size
    col = env(u) * 0.7 + 0.3
    spec = np.clip((R * LIGHT).sum(2), 0, 1) ** 8
    col = col * tint + spec[..., None] * 0.22
    cv.over(np.clip(col, 0, 1), m)


def banner(name, words, color, level):
    cv = Canvas(1000, 560)
    box = (36, 44, 964, 516)
    d = sdf_rrect(cv, box, 64)
    cv.over(np.zeros(3, np.float32), np.exp(-np.clip(d, 0, None) / 12) * 0.6 * (d > 0))
    glass(cv, inset(box, 26), 42)
    bevel_ring(cv, box, 64, inset(box, 20), 46, depth=11, round_px=10)
    channel(cv, inset(box, 19), 47, inset(box, 34), 36)
    tube(cv, inset(box, 27), 39, color, radius=4.0, glow=0.5 + 0.06 * level)
    if level == 5:
        fade = np.clip((150 - np.abs(cv.y - 280)) / 60, 0, 1)
        tube(cv, inset(box, 27), 39, CYAN, radius=4.0, glow=0.7,
             region=fade * (np.minimum(cv.x - 36, 964 - cv.x) < 60))
    bevel_ring(cv, inset(box, 34), 36, inset(box, 39), 32, depth=3, round_px=3)
    # amount well under the title
    well = (110, 342, 890, 470)
    dw = sdf_rrect(cv, well, 30)
    cv.over(np.array([0.02, 0.02, 0.06], np.float32), cover(dw) * 0.55)
    tube_line(cv, (150, 331), (850, 331), color, radius=2.6, glow=0.7)
    # crest: one lit pip per tier on a chrome tab at the top edge
    tab = (500 - 30 - 22 * level, 22, 500 + 30 + 22 * level, 66)
    dt = sdf_rrect(cv, tab, 20)
    cv.over(np.zeros(3, np.float32), cover(dt - 5) * 0.5 * (1 - cover(dt)))
    chrome(cv, 7 * rounded(-dt, 8), cover(dt), tilt=0.1)
    for i in range(level):
        px = 500 + (i - (level - 1) / 2) * 44
        r = np.hypot(cv.x - px, cv.y - 44)
        cv.add(color, np.exp(-r / 7) * 0.9)
        cv.over(np.clip(np.asarray(color, np.float32) * 0.5 + 0.55, 0, 1), cover(r - 7.5))
    chrome_text(cv, words, color, 210, 780, 140)
    save(cv, f"banners/{name}.png")


# ---------------------------------------------------------------- bet bar
# Plate art for the shared bar's sprite slots (uiTheme.sprites): `button` /
# `buttonActive` discs, the `bet` spin plate and the compactBottom `bar` strip,
# plus neon versions of the mono icons. Discs are 256 with the rim at 8..248;
# the dark well inside the tube is 0.77 of the plate (buttonIconScale) and the
# spin plate's lit face 0.70 (betIconScale).

ICON_SRC = SPR / "goBananasUiIconsMono"
ICONS = ["menu", "menuExit", "settings", "info", "payTable", "soundOn", "soundOff", "autoSpin", "replay"]


def disc(rel, lit):
    cv = Canvas(256, 256)
    box = (8, 8, 248, 248)
    r = np.hypot(cv.x - 128, cv.y - 128)
    cv.over(np.zeros(3, np.float32), np.exp(-np.clip(r - 120, 0, None) / 4) * 0.5 * (r > 118))
    if lit:
        glass(cv, inset(box, 14), 106, top=(0.86, 0.20, 0.70), bottom=(0.42, 0.04, 0.38), scan=False)
        cv.add(MAGENTA, np.exp(-((r / 70) ** 2)) * 0.35)
    else:
        glass(cv, inset(box, 14), 106, top=(0.12, 0.11, 0.27), bottom=(0.04, 0.04, 0.12), scan=False)
    bevel_ring(cv, box, 120, inset(box, 14), 106, depth=7, round_px=7)
    tube(cv, inset(box, 21), 99, (1.0, 0.75, 0.95) if lit else CYAN, radius=2.4, glow=0.55)
    save(cv, rel)


def spin_plate():
    cv = Canvas(256, 256)
    box = (6, 6, 250, 250)
    r = np.hypot(cv.x - 128, cv.y - 128)
    cv.over(np.zeros(3, np.float32), np.exp(-np.clip(r - 122, 0, None) / 4) * 0.55 * (r > 120))
    glass(cv, inset(box, 20), 102, top=(0.92, 0.24, 0.76), bottom=(0.46, 0.04, 0.42), scan=False)
    cv.add((1.0, 0.55, 0.92), np.exp(-(((r - 20) / 60) ** 2)) * 0.25 * np.clip((150 - cv.y) / 70, 0, 1))
    bevel_ring(cv, box, 122, inset(box, 20), 102, depth=10, round_px=10)
    channel(cv, inset(box, 20), 102, inset(box, 30), 92, color=(0.10, 0.02, 0.10))
    tube(cv, inset(box, 25), 97, MAGENTA, radius=3.0, glow=0.7)
    save(cv, "ui/spin_plate.png")


def bar_strip():
    cv = Canvas(1600, 200)
    box = (6, 8, 1594, 192)
    d = sdf_rrect(cv, box, 46)
    cv.over(np.zeros(3, np.float32), np.exp(-np.clip(d, 0, None) / 5) * 0.55 * (d > 0))
    glass(cv, inset(box, 12), 36, top=(0.09, 0.08, 0.22), bottom=(0.03, 0.03, 0.10))
    bevel_ring(cv, box, 46, inset(box, 12), 36, depth=6, round_px=6)
    tube(cv, inset(box, 17), 31, MAGENTA, radius=2.3, glow=0.5,
         region=np.clip((cv.y - 60) / -30, 0, 1))
    tube(cv, inset(box, 17), 31, CYAN, radius=2.3, glow=0.5,
         region=np.clip((cv.y - 140) / 30, 0, 1))
    save(cv, "ui/bar_strip.png")


def neon_icon(name, mask, color=CYAN):
    """A white-hot glyph with a coloured halo, from a coverage mask at SS x 256."""
    cv = Canvas(256, 256)
    cv.add(color, ndimage.gaussian_filter(mask, 7 * SS) * 1.5)
    edge = np.clip(mask - ndimage.gaussian_filter(mask, 1.5 * SS), 0, 1)
    rgb = np.ones(3, np.float32) * 0.97
    cv.over(rgb, mask)
    cv.add(color, edge * 0.6)
    save(cv, f"icons/{name}.png")


def icons():
    for name in ICONS:
        im = Image.open(ICON_SRC / f"{name}.png").convert("RGBA").resize((256 * SS, 256 * SS), Image.Resampling.LANCZOS)
        a = np.asarray(im, np.float32) / 255
        # the mono set is white glyphs in a dark keyline; keep the white
        lum = a[..., :3].mean(2)
        neon_icon(name, np.clip((lum - 0.45) / 0.3, 0, 1) * a[..., 3])
    for name, plus in (("increase", True), ("decrease", False)):
        m = Image.new("L", (256 * SS, 256 * SS))
        d = ImageDraw.Draw(m)
        c, half, w = 128 * SS, 70 * SS, 13 * SS
        d.rounded_rectangle((c - half, c - w, c + half, c + w), radius=w, fill=255)
        if plus:
            d.rounded_rectangle((c - w, c - half, c + w, c + half), radius=w, fill=255)
        neon_icon(name, np.asarray(m, np.float32) / 255)


TIERS = [
    ("big", "BIG WIN", CYAN, 1),
    ("superwin", "SUPER WIN", LIME, 2),
    ("mega", "MEGA WIN", MAGENTA, 3),
    ("epic", "EPIC WIN", VIOLET, 4),
    ("max", "MAX WIN", MAGENTA, 5),
]

INSTALL = {
    "frame/frame_edge.png": "goBananasFrame/frame_edge.png",
    "frame/frame_bg.png": "goBananasFrame/frame_bg.png",
    "frame/fs_sign.png": "goBananasFrame/fs_sign.png",
    "frame/fs_counter_panel.png": "goBananasFrame/fs_counter_panel.png",
    "ui/ticker_plate.png": "goBananasUi/ticker_plate.png",
    "ui/ladder_stick_lit.png": "goBananasUi/ladder_stick_lit.png",
    "ui/ladder_stick_off.png": "goBananasUi/ladder_stick_off.png",
    **{f"banners/{n}.png": f"goBananasWinBanners/{n}.png" for n, *_ in TIERS},
    "ui/button.png": "goBananeonUi/button.png",
    "ui/button_on.png": "goBananeonUi/button_on.png",
    "ui/spin_plate.png": "goBananeonUi/spin_plate.png",
    "ui/bar_strip.png": "goBananeonUi/bar_strip.png",
    **{f"icons/{n}.png": f"goBananeonUiIcons/{n}.png" for n in ICONS + ["increase", "decrease"]},
}


def main():
    only = [a for a in sys.argv[1:] if not a.startswith("--")]
    jobs = {
        "frame_edge": frame_edge,
        "frame_bg": frame_bg,
        "fs_sign": lambda: signboard("frame/fs_sign.png", (1280, 1000), (67, 96, 1213, 904), strips=True),
        "fs_counter": lambda: signboard("frame/fs_counter_panel.png", (1280, 966), (122, 133, 1158, 851)),
        "ticker": ticker,
        "ladder": lambda: (ladder(True), ladder(False)),
        "banners": lambda: [banner(*t) for t in TIERS],
        "bar": lambda: (disc("ui/button.png", False), disc("ui/button_on.png", True), spin_plate(), bar_strip()),
        "icons": icons,
    }
    for name, job in jobs.items():
        if not only or name in only:
            job()
    if "--install" in sys.argv:
        for src, dst in INSTALL.items():
            if (OUT / src).exists():
                (SPR / dst).parent.mkdir(parents=True, exist_ok=True)
                shutil.copyfile(OUT / src, SPR / dst)
                print("installed", dst)


if __name__ == "__main__":
    main()
