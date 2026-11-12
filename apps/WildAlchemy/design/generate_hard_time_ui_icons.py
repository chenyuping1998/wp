"""Redraw Hard Time's round-button icons as thin, legible line icons.

Ported from CapoNostra/design/generate_capo_ui_icons.py (same geometry). Hard
Time's set was made by recolouring Capo's icons to steel in
generate_hard_time_art.py — but it recoloured the PRE-redraw, heavy set, so the
fix Capo got on 2026-09-14 never reached this game. Old art kept in
design/_legacy_assets/hardTimeUiIcons/.

Why: the delivered set draws every mark with very heavy strokes and pill-shaped
fills that touch each other (paytable's rows fuse into a slab, menu's bars into
one block, settings is a solid flower with no hole) plus a soft glow. On screen
the icon box is only ~30-48px, so the gaps vanish and the marks become blobs.

Rules: strokes ~6.5% of the canvas with gaps at least as wide as a stroke, a thin
dark edge for contrast on the dark recess, no glow, ink within 0.80 of the half
canvas so icon scale 0.70 keeps every mark inside the plate recess (0.64).
Drawn at 1024 and downsampled to 256 for clean edges. Geometry only — nothing
here is traced from any reference art.
"""
import math, os, sys
from PIL import Image, ImageDraw

APP = "/Users/stone/stake-engine/wp/apps/HardTime"
LEGACY = f"{APP}/design/_legacy_assets/hardTimeUiIcons"
OUT = sys.argv[1]
N = 1024; C = N / 2
# sample the steel from the legacy file, so re-running never samples our own output
old = Image.open(f"{LEGACY}/increase.png").convert("RGBA")
px = [p for p in old.getdata() if p[3] > 250]
STEEL = tuple(sorted(px, key=lambda p: -(p[0] + p[1]))[len(px) // 3][:3]) + (255,)
EDGE = (22, 14, 8, 235)
SW = int(N * 0.078)          # gold stroke (0.065 read thin at phone size)
EW = int(N * 0.022)          # dark edge added each side
R = N * 0.40                 # ink radius budget (0.80 of half canvas)

def P(fx, fy):               # coords in units of R, centred
    return (C + fx * R, C + fy * R)

def canvas():
    return Image.new("RGBA", (N, N), (0, 0, 0, 0))

def both(draw_fn):
    """Draw every shape twice: dark, fattened, then gold on top."""
    im = canvas(); d = ImageDraw.Draw(im)
    draw_fn(d, EDGE, SW + 2 * EW, EW)
    draw_fn(d, STEEL, SW, 0)
    return im

def line(d, col, w, a, b):
    d.line([a, b], fill=col, width=int(w))
    for p in (a, b):
        d.ellipse([p[0] - w / 2, p[1] - w / 2, p[0] + w / 2, p[1] + w / 2], fill=col)

def ring(d, col, w, r):
    d.ellipse([C - r, C - r, C + r, C + r], outline=col, width=int(w))

def disc(d, col, cx, cy, r):
    d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=col)

def poly(d, col, pts, grow):
    if grow:
        cx = sum(x for x, _ in pts) / len(pts); cy = sum(y for _, y in pts) / len(pts)
        pts = [(cx + (x - cx) * 1.0, cy + (y - cy) * 1.0) for x, y in pts]
        d.polygon(pts, fill=col, outline=col, width=int(grow * 2))
    else:
        d.polygon(pts, fill=col)

ICONS = {}

ICONS["increase"] = lambda d, c, w, g: (line(d, c, w, P(-0.72, 0), P(0.72, 0)), line(d, c, w, P(0, -0.72), P(0, 0.72)))
ICONS["decrease"] = lambda d, c, w, g: line(d, c, w, P(-0.72, 0), P(0.72, 0))
ICONS["menuExit"] = lambda d, c, w, g: (line(d, c, w, P(-0.55, -0.55), P(0.55, 0.55)), line(d, c, w, P(-0.55, 0.55), P(0.55, -0.55)))

def menu(d, c, w, g):
    for y in (-0.48, 0, 0.48):
        line(d, c, w, P(-0.62, y), P(0.62, y))
ICONS["menu"] = menu

def info(d, c, w, g):
    ring(d, c, w * 0.85, R * 0.94 - w * 0.43)
    disc(d, c, *P(0, -0.40), w * 0.72 + g)
    line(d, c, w, P(0, -0.08), P(0, 0.48))
ICONS["info"] = info

def paytable(d, c, w, g):
    x0, y0 = P(-0.62, -0.76); x1, y1 = P(0.62, 0.76)
    ww = int(w * 0.85)
    d.rounded_rectangle([x0, y0, x1, y1], radius=R * 0.12, outline=c, width=ww)
    for y in (-0.36, 0.0, 0.36):
        line(d, c, w * 0.8, P(-0.30, y), P(0.30, y))
ICONS["payTable"] = paytable

def settings(d, c, w, g):
    teeth = 8; ro = 0.80; rt = 0.60; half = math.pi / teeth * 0.46
    pts = []
    for i in range(teeth):
        a = 2 * math.pi * i / teeth
        for aa, rr in ((a - half * 1.25, rt), (a - half * 0.75, ro), (a + half * 0.75, ro), (a + half * 1.25, rt)):
            pts.append(P(rr * math.cos(aa), rr * math.sin(aa)))
    if g:
        d.polygon(pts, fill=c)
        d.line(pts + [pts[0]], fill=c, width=int(g * 2), joint="curve")
    else:
        d.polygon(pts, fill=c)
    disc(d, (0, 0, 0, 0), C, C, R * 0.26 - g)          # punch the hub
ICONS["settings"] = settings

def speaker(d, c, g):
    body = [P(-0.78, -0.24), P(-0.46, -0.24), P(-0.10, -0.60), P(-0.10, 0.60), P(-0.46, 0.24), P(-0.78, 0.24)]
    d.polygon(body, fill=c)
    if g:
        d.line(body + [body[0]], fill=c, width=int(g * 2), joint="curve")

def arc(d, c, w, r, a0, a1):
    d.arc([C - r, C - r, C + r, C + r], a0, a1, fill=c, width=int(w))
    for a in (a0, a1):
        x = C + r * math.cos(math.radians(a)) - R * 0.0; y = C + r * math.sin(math.radians(a))
        d.ellipse([x - w / 2, y - w / 2, x + w / 2, y + w / 2], fill=c)

def soundOn(d, c, w, g):
    speaker(d, c, g)
    cx_shift = -0.10
    for r in (0.42, 0.74):
        rr = R * r
        box = [C + cx_shift * R - rr, C - rr, C + cx_shift * R + rr, C + rr]
        d.arc(box, -45, 45, fill=c, width=int(w * 0.82))
        for a in (-45, 45):
            x = C + cx_shift * R + rr * math.cos(math.radians(a)); y = C + rr * math.sin(math.radians(a))
            e = w * 0.41
            d.ellipse([x - e, y - e, x + e, y + e], fill=c)
ICONS["soundOn"] = soundOn

def soundOff(d, c, w, g):
    speaker(d, c, g)
    line(d, c, w * 0.82, P(0.22, -0.26), P(0.74, 0.26))
    line(d, c, w * 0.82, P(0.22, 0.26), P(0.74, -0.26))
ICONS["soundOff"] = soundOff

def autoSpin(d, c, w, g):
    r = R * 0.80 - w * 0.5
    d.arc([C - r, C - r, C + r, C + r], -60, 235, fill=c, width=int(w * 0.85))
    a = math.radians(-60); tx = C + r * math.cos(a); ty = C + r * math.sin(a)
    hs = R * 0.26 + g
    tang = a + math.pi / 2
    tip = (tx + math.cos(tang - math.pi) * 0 + math.cos(a) * 0, ty)
    head = [(tx + math.cos(a) * hs, ty + math.sin(a) * hs),
            (tx - math.cos(a) * hs, ty - math.sin(a) * hs),
            (tx + math.cos(tang + math.pi) * hs * -1.3 * -1, ty + math.sin(tang + math.pi) * hs * -1.3 * -1)]
    head = [(tx + math.cos(a) * hs, ty + math.sin(a) * hs), (tx - math.cos(a) * hs, ty - math.sin(a) * hs),
            (tx - math.cos(tang) * hs * 1.25, ty - math.sin(tang) * hs * 1.25)]
    d.polygon(head, fill=c)
    tri = [P(-0.16 - (g / R), -0.30 - (g / R)), P(0.30 + (g / R), 0), P(-0.16 - (g / R), 0.30 + (g / R))]
    d.polygon(tri, fill=c)
ICONS["autoSpin"] = autoSpin

report = []
for name, fn in ICONS.items():
    im = both(fn).resize((256, 256), Image.LANCZOS)
    im.save(os.path.join(OUT, name + ".png"))
    a = im.load(); mr = 0
    for y in range(256):
        for x in range(256):
            if a[x, y][3] > 128:
                mr = max(mr, math.hypot(x - 127.5, y - 127.5) / 128)
    report.append((name, mr))
print("steel sampled:", STEEL)
for n, mr in report:
    print(f"  {n:9} ink r={mr:.3f}  x0.70 = {mr*0.70:.3f} of button radius  {'OK' if mr*0.70 <= 0.58 else 'OVER'}")

# legibility preview: old vs new on the real plate at 64px and 36px
plate = Image.open(f"{APP}/static/assets/sprites/hardTimeUi/button_plate.png").convert("RGBA")
names = list(ICONS)
cell = 80; sheet = Image.new("RGBA", (cell * len(names), cell * 4), (18, 12, 10, 255))
for row, (src, size) in enumerate([("old", 64), ("new", 64), ("old", 36), ("new", 36)]):
    for i, n in enumerate(names):
        p = plate.resize((size, size), Image.LANCZOS)
        folder = LEGACY if src == "old" else OUT
        ic = Image.open(f"{folder}/{n}.png").convert("RGBA")
        s = int(size * 0.70); ic = ic.resize((s, s), Image.LANCZOS)
        p.alpha_composite(ic, ((size - s) // 2, (size - s) // 2))
        sheet.alpha_composite(p, (i * cell + (cell - size) // 2, row * cell + (cell - size) // 2))
sheet = sheet.resize((sheet.width * 2, sheet.height * 2), Image.NEAREST)
sheet.save(os.path.join(os.path.dirname(OUT), "icons_preview.png"))
print("preview rows: old@64, new@64, old@36, new@36 (shown 2x)")
