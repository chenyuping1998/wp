"""The transition's sliding shop door and noren (2026-10-07).

Replaces the glitch transition with Go Banandit's door rhythm: the shop's two
lattice doors slide in from the screen edges, clack together, hold while the
scene swaps, and slide back open; a noren drops from the lintel over them.

Hand-inked in ART_BRIEF §0: charcoal outline with a little wobble, flat warm
wood sampled from the reel frame (sushiFrame/frame_edge.png), beige paper panes
with one hard shadow and sparse coarse halftone, ember only on the noren seal.
Drawn at 2x and downsampled so every edge is antialiased.

Outputs (static/assets/sprites/sushiScene/):
  door.png   1400x1080, the LEFT door; its inner (meeting) stile is the right
             edge. The right door is the same art mirrored at runtime.
  noren.png  1920x420, lintel + four flaps, the seal across the centre slit.

  /Applications/anaconda3/bin/python3 design/build_sushi_door.py
"""
import math
import random
from pathlib import Path

from PIL import Image, ImageDraw

OUT = Path(__file__).resolve().parent.parent / 'static/assets/sprites/sushiScene'
S = 2  # supersample

INK = (40, 40, 40, 255)
WOOD = (199, 158, 121, 255)
WOOD_LIGHT = (214, 176, 139, 255)
WOOD_DARK = (171, 131, 97, 255)
PAPER = (239, 234, 220, 255)
PAPER_SHADE = (222, 215, 198, 255)
NOREN = (44, 42, 41, 255)
NOREN_LIGHT = (66, 63, 60, 255)
EMBER = (184, 123, 96, 255)
CREAM = (243, 240, 230, 255)

rng = random.Random(7)


def wobble_line(d, pts, width, fill=INK, amp=1.6, step=18):
    """A hand line: resample the polyline and jitter it a little."""
    out = []
    for (x0, y0), (x1, y1) in zip(pts, pts[1:]):
        n = max(1, int(math.hypot(x1 - x0, y1 - y0) / (step * S)))
        for i in range(n):
            t = i / n
            out.append((x0 + (x1 - x0) * t + rng.uniform(-amp, amp) * S,
                        y0 + (y1 - y0) * t + rng.uniform(-amp, amp) * S))
    out.append(pts[-1])
    d.line(out, fill=fill, width=int(width * S), joint='curve')


def box(d, x0, y0, x1, y1, fill, ink=4.0):
    d.rectangle([x0 * S, y0 * S, x1 * S, y1 * S], fill=fill)
    pts = [(x0 * S, y0 * S), (x1 * S, y0 * S), (x1 * S, y1 * S), (x0 * S, y1 * S), (x0 * S, y0 * S)]
    wobble_line(d, pts, ink)


def grain(d, x0, y0, x1, y1, vertical, n):
    """Sparse wood grain: long, slightly wavy, thin ink strokes."""
    for _ in range(n):
        if vertical:
            x = rng.uniform(x0 + 6, x1 - 6)
            ya, yb = sorted(rng.uniform(y0, y1) for _ in range(2))
            if yb - ya < (y1 - y0) * 0.25:
                continue
            pts = [((x + math.sin(y / 60 + x) * 2.5) * S, y * S) for y in range(int(ya), int(yb), 24)]
        else:
            y = rng.uniform(y0 + 6, y1 - 6)
            xa, xb = sorted(rng.uniform(x0, x1) for _ in range(2))
            if xb - xa < (x1 - x0) * 0.25:
                continue
            pts = [(x * S, (y + math.sin(x / 70 + y) * 2.5) * S) for x in range(int(xa), int(xb), 24)]
        if len(pts) > 1:
            d.line(pts, fill=WOOD_DARK, width=int(1.6 * S))


def halftone(d, x0, y0, x1, y1, pitch=14, rmax=2.6, fade_up=True):
    """Coarse regular dots, densest at the bottom of the pane (one shadow)."""
    for gy, y in enumerate(range(int(y0), int(y1), pitch)):
        k = (y - y0) / max(1, (y1 - y0))
        k = k if fade_up else 1 - k
        r = rmax * max(0.0, (k - 0.55) / 0.45)
        if r < 0.5:
            continue
        off = pitch / 2 if gy % 2 else 0
        for x in range(int(x0 + off), int(x1), pitch):
            d.ellipse([(x - r) * S, (y - r) * S, (x + r) * S, (y + r) * S], fill=PAPER_SHADE)


def door():
    W, H = 1400, 1080
    im = Image.new('RGBA', (W * S, H * S), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    # whole door body in wood
    box(d, 0, 0, W, H, WOOD, ink=5)
    # inner meeting stile (the edge that clacks), and the outer frame rails
    STILE, TOP, KICK = 92, 96, 250
    box(d, W - STILE, 0, W, H, WOOD_LIGHT, ink=5)
    grain(d, W - STILE, 0, W, H, True, 7)
    box(d, 0, 0, W - STILE, TOP, WOOD, ink=4.5)
    grain(d, 0, 0, W - STILE, TOP, False, 6)
    # kick plank, three boards
    ky = H - KICK
    for i in range(3):
        y0 = ky + i * KICK / 3
        box(d, 0, y0, W - STILE, y0 + KICK / 3, WOOD if i % 2 else WOOD_LIGHT, ink=4)
        grain(d, 0, y0, W - STILE, y0 + KICK / 3, False, 5)
    # lattice: paper panes between bars
    COLS, ROWS, BAR = 8, 4, 18
    pw = (W - STILE) / COLS
    ph = (ky - TOP) / ROWS
    for c in range(COLS):
        for r in range(ROWS):
            x0 = c * pw + BAR / 2
            y0 = TOP + r * ph + BAR / 2
            x1, y1 = x0 + pw - BAR, y0 + ph - BAR
            d.rectangle([x0 * S, y0 * S, x1 * S, y1 * S], fill=PAPER)
            halftone(d, x0 + 6, y0 + 6, x1 - 6, y1 - 4)
            # hard shadow under the top bar of each pane
            d.rectangle([x0 * S, y0 * S, x1 * S, (y0 + 7) * S], fill=PAPER_SHADE)
            wobble_line(d, [(x0 * S, y0 * S), (x1 * S, y0 * S), (x1 * S, y1 * S), (x0 * S, y1 * S), (x0 * S, y0 * S)], 2.6)
    # recessed pull (hikite) on the meeting stile
    cx, cy = W - STILE / 2, ky - 220
    d.rounded_rectangle([(cx - 20) * S, (cy - 70) * S, (cx + 20) * S, (cy + 70) * S], radius=18 * S, fill=WOOD_DARK)
    d.rounded_rectangle([(cx - 11) * S, (cy - 56) * S, (cx + 11) * S, (cy + 56) * S], radius=10 * S, fill=INK)
    # ink edge on the meeting side so two doors read as two pieces when shut
    wobble_line(d, [(W * S - 3 * S, 0), (W * S - 3 * S, H * S)], 7)
    im.resize((W, H), Image.LANCZOS).save(OUT / 'door.png')


def noren():
    W, H = 1920, 420
    im = Image.new('RGBA', (W * S, H * S), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    # lintel beam
    box(d, 0, 0, W, 64, WOOD, ink=5)
    grain(d, 0, 0, W, 64, False, 14)
    # rod rings + four flaps with a small gap; the centre gap is the doorway slit
    FLAPS, GAP = 4, 16
    fw = (W - GAP * (FLAPS + 1)) / FLAPS
    for i in range(FLAPS):
        x0 = GAP + i * (fw + GAP)
        x1 = x0 + fw
        hem = H - 14
        pts = [(x0, 52)]
        for k in range(0, 21):
            x = x0 + (x1 - x0) * k / 20
            pts.append((x, hem + math.sin(k * 1.3 + i) * 5))
        pts.append((x1, 52))
        d.polygon([(x * S, y * S) for x, y in pts], fill=NOREN)
        # one hard fold shadow per flap
        d.rectangle([(x0 + fw * 0.62) * S, 64 * S, (x0 + fw * 0.70) * S, (hem - 6) * S], fill=NOREN_LIGHT)
        wobble_line(d, [(x * S, y * S) for x, y in pts] + [(pts[0][0] * S, pts[0][1] * S)], 4)
        for rx in (x0 + 40, x1 - 40):
            d.ellipse([(rx - 14) * S, 40 * S, (rx + 14) * S, 68 * S], outline=INK, width=int(5 * S))
    # the seal: one maki roll emblem, centred on the slit so it splits as the
    # doorway opens (cream ring, nori band, ember filling)
    cx, cy, R = W / 2, 240, 112
    d.ellipse([(cx - R) * S, (cy - R) * S, (cx + R) * S, (cy + R) * S], fill=CREAM)
    d.ellipse([(cx - R * 0.70) * S, (cy - R * 0.70) * S, (cx + R * 0.70) * S, (cy + R * 0.70) * S], fill=NOREN)
    d.ellipse([(cx - R * 0.56) * S, (cy - R * 0.56) * S, (cx + R * 0.56) * S, (cy + R * 0.56) * S], fill=CREAM)
    d.ellipse([(cx - R * 0.30) * S, (cy - R * 0.30) * S, (cx + R * 0.30) * S, (cy + R * 0.30) * S], fill=EMBER)
    for rr, w in ((R, 6), (R * 0.70, 3.5), (R * 0.56, 3.5), (R * 0.30, 3.5)):
        pts = [(cx + math.cos(a / 40 * math.tau) * rr, cy + math.sin(a / 40 * math.tau) * rr) for a in range(41)]
        wobble_line(d, [(x * S, y * S) for x, y in pts], w, amp=0.8, step=6)
    # the doorway slit cuts through the seal
    d.rectangle([(cx - GAP / 2) * S, 64 * S, (cx + GAP / 2) * S, H * S], fill=(0, 0, 0, 0))
    im.resize((W, H), Image.LANCZOS).save(OUT / 'noren.png')


door()
noren()
print('wrote', OUT / 'door.png', OUT / 'noren.png')
