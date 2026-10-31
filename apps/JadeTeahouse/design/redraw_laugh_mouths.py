"""Open mouths that open FROM the smile line (2026-10-31).

The open-mouth faces (laugh_1..4, talk_open) had a dark oval pasted on the
face, not hung from the mouth line of the closed face: the resting smile line
ran straight through the top of the oval and its two ends were left on the
cheeks, so going from the closed face to a laugh the mouth jumped and the
lines did not meet (user, 2026-10-31: "開口跟閉合的線根本沒對齊"). Diner
Monkey's faces are built the same way, so copying them would not fix it.

Rebuilt so the opening IS the closed mouth line, parted up and down:
  1. each face starts from itself with the old oval (and its rim) put back to
     the closed face's pixels, so only the resting smile line is there
  2. the smile line's centre is traced on the closed face
  3. the whole line parts along itself: its two ends stay the corners, the
     upper lip is the line lifted and the lower lip the line dropped, both
     keeping its curve, as deep as the old oval was, so laugh_1..4 still open
     in the same steps
  4. dark interior, the tongue where the old face had one, and the lower lip
     inked at the smile line's own weight; outside the opening the line
     carries on as the cheek crease it was

Originals: design/source/_pre_mouth_20261031/<cast>/. Rerun
redraw_blink_faces.py afterwards (the closed-eye laughs are built from these),
then rebuild the atlases (HANDOFF 2026-10-31).

Run: python design/redraw_laugh_mouths.py
"""

import shutil
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage

APP = Path(__file__).resolve().parents[1]
SRC = APP / "design/source"
KEEP = SRC / "_pre_mouth_20261031"
FACES = ["laugh_1", "laugh_2", "laugh_3", "laugh_4", "talk_open"]
SS = 4
# how much of the opening is above the closed line (the jaw drops more than
# the upper lip lifts)
UP = 0.32


def load(cast, name, original=False):
    path = (KEEP if original else SRC) / cast / f"head_2_face_{name}.png"
    return np.array(Image.open(path).convert("RGBA"))


def opening(face, rest):
    """The old pasted mouth: where the face differs from the closed one, in
    the lower half — the region, its dark interior and its red tongue."""
    a = face[..., :3].astype(np.int32)
    diff = (np.abs(a - rest[..., :3].astype(np.int32)).sum(2) > 60) & (face[..., 3] > 200)
    diff[: int(face.shape[0] * 0.5)] = False
    lab, n = ndimage.label(ndimage.binary_closing(diff, iterations=2))
    sizes = ndimage.sum(np.ones_like(lab), lab, range(1, n + 1))
    region = ndimage.binary_fill_holes(lab == int(np.argmax(sizes)) + 1)
    dark = region & (a.max(2) < 110)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    tongue = region & (r > 150) & (r - g > 50) & (r - b > 40)
    return region, dark, tongue


def smile_line(rest, box):
    """The closed face's mouth line inside `box`: its centre y per column and
    its stroke weight."""
    x0, y0, x1, y1 = box
    a = rest[..., :3].astype(np.int32)
    ink = (a.max(2) < 95) & (rest[..., 3] > 200)
    win = np.zeros_like(ink)
    win[y0:y1, x0:x1] = True
    lab, n = ndimage.label(ink & win)
    # the mouth line is drawn ON skin: of the dark shapes in the box, the
    # biggest one whose surroundings are nearly all skin (the cheek fur is
    # bigger, but it borders fur and the edge of the face)
    skin = (a[..., 0] > 170) & (a[..., 0] - a[..., 2] > 50) & (rest[..., 3] > 200)
    # the line may be drawn in several strokes: keep every piece that passes
    line = np.zeros_like(ink)
    for k in range(1, n + 1):
        comp = lab == k
        ys, xs = np.nonzero(comp)
        if xs.max() - xs.min() < 3 * (ys.max() - ys.min() + 1) * 0.5:
            continue
        ring = ndimage.binary_dilation(comp, iterations=2) & ~comp
        if skin[ring].mean() > 0.7 and comp.sum() >= 6:
            line |= comp
    ys, xs = np.nonzero(line)
    cols = np.arange(xs.min(), xs.max() + 1)
    cy = np.array([ys[xs == c].mean() if (xs == c).any() else np.nan for c in cols])
    ok = ~np.isnan(cy)
    fit = np.polyfit(cols[ok], cy[ok], 4)
    weight = line.sum() / max(1, len(cols))
    return cols, np.polyval(fit, cols), weight


def redraw(cast, name, rest):
    face = load(cast, name, original=True)
    region, dark, tongue = opening(face, rest)
    dy, dx = np.nonzero(dark)
    width = dx.max() - dx.min() + 1
    depth = dy.max() - dy.min() + 1
    # 1. the old oval out: the closed face's pixels back under it and its rim
    patch = ndimage.binary_dilation(region, iterations=2)
    base = face.copy()
    base[patch] = rest[patch]
    # 2. the line, traced round where the mouth was
    box = (max(0, dx.min() - 30), max(0, dy.min() - 18), min(face.shape[1], dx.max() + 30), dy.max() + 4)
    cols, cy, weight = smile_line(rest, box)
    # 3. the WHOLE closed line parts (user, 2026-10-31: the closed line opens
    # up and down along itself): its two ends stay the corners, the upper lip
    # is the line lifted, the lower lip the line dropped, both following its
    # own curve; the opening deepens laugh_1 -> laugh_4 as the old ones did
    left, right = cols[0] + 0.5, cols[-1] - 0.5
    xs = np.linspace(left, right, 96)
    line = np.interp(xs, cols, cy)
    t = (xs - left) / (right - left)
    part = np.sin(np.pi * t) ** 0.6
    top = line - depth * UP * part
    bottom = line + depth * (1 - UP) * part
    # 4. drawn at SS x and brought down
    h, w = face.shape[:2]
    over = Image.new("RGBA", (w * SS, h * SS))
    d = ImageDraw.Draw(over)
    poly = [(x * SS, y * SS) for x, y in zip(xs, top)] + [(x * SS, y * SS) for x, y in zip(xs[::-1], bottom[::-1])]
    inside = tuple(int(v) for v in np.median(face[dark][:, :3], axis=0)) + (255,)
    d.polygon(poly, fill=inside)
    if tongue.sum() > 12:
        tc = tuple(int(v) for v in np.median(face[tongue][:, :3], axis=0)) + (255,)
        tm = Image.new("L", over.size)
        td = ImageDraw.Draw(tm)
        cx = (left + right) / 2
        floor = np.interp(cx, xs, bottom)
        rx, ry = (right - left) * 0.27, depth * 0.26
        td.ellipse(((cx - rx) * SS, (floor - ry * 1.3) * SS, (cx + rx) * SS, (floor + ry * 0.9) * SS), fill=255)
        clip = Image.new("L", over.size)
        ImageDraw.Draw(clip).polygon(poly, fill=255)
        tm = Image.fromarray(np.minimum(np.array(tm), np.array(clip)))
        over.paste(Image.new("RGBA", over.size, tc), (0, 0), tm)
    ink = (28, 20, 18, 255)
    lw = max(2.0, weight * 1.1) * SS
    d.line([(x * SS, y * SS) for x, y in zip(xs, bottom)], fill=ink, width=int(lw), joint="curve")
    d.line([(x * SS, y * SS) for x, y in zip(xs, top)], fill=ink, width=int(lw), joint="curve")
    for x, y in ((xs[0], top[0]), (xs[-1], top[-1])):
        d.ellipse(((x * SS - lw / 2), (y * SS - lw / 2), (x * SS + lw / 2), (y * SS + lw / 2)), fill=ink)
    over = over.resize((w, h), Image.Resampling.LANCZOS)
    out = Image.fromarray(base, "RGBA")
    rgb = Image.alpha_composite(out, over)
    res = np.array(rgb)
    res[..., 3] = face[..., 3]
    Image.fromarray(res, "RGBA").save(SRC / cast / f"head_2_face_{name}.png")
    return width, depth, (round(left), round(right))


def main():
    for cast in ("mg", "fg"):
        for name in FACES:
            src = SRC / cast / f"head_2_face_{name}.png"
            keep = KEEP / cast / src.name
            if not keep.exists():
                keep.parent.mkdir(parents=True, exist_ok=True)
                shutil.copyfile(src, keep)
        rest = load(cast, "rest")
        for name in FACES:
            print(cast, name, redraw(cast, name, rest))


if __name__ == "__main__":
    main()
