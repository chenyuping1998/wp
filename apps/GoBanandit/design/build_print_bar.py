"""Go Banandit's own bet bar, printed like the rest of the poster.

    python3 design/build_print_bar.py

Writes into static/assets/sprites/bananditUi/:
  bar_strip.png        3800x256  the strip (uiTheme.sprites.bar, sliced: caps 96)
  button_print.png      256x256  round control at rest (uiTheme.sprites.button)
  button_print_on.png   256x256  the same, switched ON (sprites.buttonActive)

Why: the first submission ran the "platform" casing — Hot Miami's flat dark
strip — and was tagged "Poor bet UI bar" alongside "Reused assets"
(2026-10-04). Here the strip is the same paper, ink and misregistered red
shadow as the intro cards and the reel frame, so the bar belongs to this game.

Built for slicing: UiBarStrip keeps the two 96px caps and stretches the
middle, so everything between the caps is horizontally uniform (grain is
generated at the size it is drawn, the middle is stretched ~1.0x on 16:9).
Drawn at 2x the size it lands at, so edges stay clean.
"""

import os

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

APP = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(APP, "static", "assets", "sprites", "bananditUi")

PAPER = (242, 232, 208)
GREEN = (31, 92, 74)
RED = (210, 74, 44)
INK = (30, 27, 26)

rng = np.random.default_rng(20261004)


def grain(w, h, amount=7, levels=5):
    """Paper tooth: soft low-frequency mottling plus fine fibre, quantised to a
    few levels so the PNG stays small."""
    lo = rng.normal(0, 1, (h // 16 + 2, w // 16 + 2))
    lo = np.array(Image.fromarray(((lo + 3) * 40).clip(0, 255).astype("uint8")).resize((w, h), Image.BICUBIC), float)
    lo = (lo - lo.mean()) / (lo.std() + 1e-6)
    hi = rng.normal(0, 1, (h, w))
    g = lo * 0.6 + hi * 0.5
    g = np.round(g / 1.2 * (levels / 2)) / (levels / 2)
    return g * amount


def paper_rgba(w, h):
    base = np.zeros((h, w, 4), float)
    base[..., :3] = PAPER
    base[..., :3] += grain(w, h)[..., None]
    base[..., 3] = 255
    return base


def halftone_mask(w, h, pitch, coverage):
    """Halftone dots: coverage (h,w) in 0..1 -> boolean dot mask on a 45° grid."""
    yy, xx = np.mgrid[0:h, 0:w].astype(float)
    u = (xx + yy) / np.sqrt(2) / pitch
    v = (xx - yy) / np.sqrt(2) / pitch
    du = u - np.round(u)
    dv = v - np.round(v)
    d = np.sqrt(du ** 2 + dv ** 2)
    r = np.sqrt(np.clip(coverage, 0, 1) / np.pi)
    return d < r


def bar_strip():
    W, H = 3800, 256
    S = 4  # supersample for the shapes
    pad = 10  # room for the red offset on the right and bottom
    rad = 26
    edge = 7

    # shapes at 4x, then down
    def rr(img_size, box, r, fill):
        im = Image.new("L", img_size, 0)
        ImageDraw.Draw(im).rounded_rectangle([c * S for c in box], r * S, fill=fill)
        return im

    size = (W * S, H * S)
    body_box = (0, 0, W - pad - 1, H - pad - 1)
    shadow_box = (pad, pad, W - 1, H - 1)
    shadow = rr(size, shadow_box, rad, 255).resize((W, H), Image.LANCZOS)
    outer = rr(size, body_box, rad, 255).resize((W, H), Image.LANCZOS)
    inner_box = (edge, edge, W - pad - 1 - edge, H - pad - 1 - edge)
    inner = rr(size, inner_box, rad - edge, 255).resize((W, H), Image.LANCZOS)
    rule_box = (edge + 9, edge + 9, W - pad - 1 - edge - 9, H - pad - 1 - edge - 9)
    rule_o = rr(size, rule_box, rad - edge - 9, 255).resize((W, H), Image.LANCZOS)
    rule_i = rr(size, (rule_box[0] + 3, rule_box[1] + 3, rule_box[2] - 3, rule_box[3] - 3),
                rad - edge - 12, 255).resize((W, H), Image.LANCZOS)

    a = lambda im: np.asarray(im, float)[..., None] / 255
    out = np.zeros((H, W, 4), float)

    # 1. red misregistration, offset down-right
    out[..., :3] = RED
    out[..., 3:] = a(shadow) * 255

    # 2. ink edge
    k = a(outer)
    out[..., :3] = out[..., :3] * (1 - k) + np.array(INK) * k
    out[..., 3:] = np.maximum(out[..., 3:], k * 255)

    # 3. paper face, with a green halftone rising from the foot (a printed
    #    shadow, the way the poster shades)
    face = paper_rgba(W, H)
    yy = np.linspace(0, 1, H)[:, None] * np.ones((1, W))
    cov = np.clip((yy - 0.55) / 0.45, 0, 1) ** 1.6 * 0.32
    dots = halftone_mask(W, H, 7.0, cov)
    face[dots, :3] = face[dots, :3] * 0.25 + np.array(GREEN) * 0.75
    ki = a(inner)
    out[..., :3] = out[..., :3] * (1 - ki) + face[..., :3] * ki

    # 4. thin green rule inside the edge
    rule = a(rule_o) - a(rule_i)
    out[..., :3] = out[..., :3] * (1 - rule * 0.85) + np.array(GREEN) * rule * 0.85

    # 5. the caps: bandit-sweater stripes on a narrow band at each end
    band = 34
    yy, xx = np.mgrid[0:H, 0:W]
    stripe = ((xx + yy) // 14) % 2 == 0
    for x0, x1 in ((edge, edge + band), (W - pad - 1 - edge - band, W - pad - 1 - edge)):
        m = (xx >= x0) & (xx < x1) & (ki[..., 0] > 0.5)
        sel = m & stripe
        out[sel, :3] = RED
        # an ink rule closes the band off from the face
        xr = x1 if x0 < W / 2 else x0
        cl = (np.abs(xx - xr) < 2) & (ki[..., 0] > 0.5)
        out[cl, :3] = INK

    Image.fromarray(out.clip(0, 255).astype("uint8"), "RGBA").save(os.path.join(OUT, "bar_strip.png"), optimize=True)


def disc(on=False):
    N = 256
    S = 4
    c = N * S / 2

    def circle(r, dx=0, dy=0):
        im = Image.new("L", (N * S, N * S), 0)
        ImageDraw.Draw(im).ellipse([c - r * S + dx * S, c - r * S + dy * S, c + r * S + dx * S, c + r * S + dy * S], fill=255)
        return np.asarray(im.resize((N, N), Image.LANCZOS), float)[..., None] / 255

    out = np.zeros((N, N, 4), float)
    R = 116
    sh = circle(R, 7, 7)
    out[..., :3] = RED
    out[..., 3:] = sh * 255
    ring = circle(R)
    out[..., :3] = out[..., :3] * (1 - ring) + np.array(INK) * ring
    out[..., 3:] = np.maximum(out[..., 3:], ring * 255)
    face_m = circle(R - 12)
    face = paper_rgba(N, N)
    yy = np.linspace(0, 1, N)[:, None] * np.ones((1, N))
    cov = np.clip((yy - 0.5) / 0.5, 0, 1) ** 1.5 * 0.3
    dots = halftone_mask(N, N, 6.0, cov)
    face[dots, :3] = face[dots, :3] * 0.3 + np.array(GREEN) * 0.7
    out[..., :3] = out[..., :3] * (1 - face_m) + face[..., :3] * face_m
    if on:
        # switched on: a thick red ring printed inside the ink edge
        band = circle(R - 12) - circle(R - 30)
        out[..., :3] = out[..., :3] * (1 - band) + np.array(RED) * band
    else:
        band = circle(R - 20) - circle(R - 24)
        out[..., :3] = out[..., :3] * (1 - band * 0.8) + np.array(GREEN) * band * 0.8
    name = "button_print_on.png" if on else "button_print.png"
    Image.fromarray(out.clip(0, 255).astype("uint8"), "RGBA").save(os.path.join(OUT, name), optimize=True)


if __name__ == "__main__":
    bar_strip()
    disc(False)
    disc(True)
    for n in ("bar_strip.png", "button_print.png", "button_print_on.png"):
        p = os.path.join(OUT, n)
        print(n, Image.open(p).size, os.path.getsize(p) // 1024, "KB")
