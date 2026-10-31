"""Closed-eye faces, redrawn (2026-10-31).

The three eyes-closed expressions of each cast (head_2_face_blink,
_laugh_3_blink, _laugh_4_blink) were made by laying a flat skin-coloured oval
over each eye and ruling a line across it. At the face's 210px source size,
scaled up in the game, the ovals read as pale patches stuck on the face, and
on the apprentice the lashes and pupils showed round their edges. Held for
the length of a laugh they were the most visible flaw on the characters.

Rebuilt from the OPEN face of the same expression (rest / laugh_3 / laugh_4):
  1. each eye is traced on the open face: grown from its eye-white through
     the iris, rim and lashes, kept to the eye's own rows (the old ovals only
     locate the two eyes)
  2. that area is filled from the skin round it only (a normalised blur of the
     skin pixels, plus a little grain), so neither a flat oval nor the fur and
     ink beside the eye (which an in-paint drags in) shows
  3. the lid is drawn in the art's own ink and line weight: a smiling ^ arc on
     the laughs, a lowered lid curve with a lash flick on the plain blink

Originals: design/source/_pre_blink_20261031/<cast>/ (first run copies them).
Then rebuild the atlas: see the end of the 2026-10-31 HANDOFF entry.

Run: python design/redraw_blink_faces.py   (system Python: needs opencv, which the math-sdk venv lacks)
"""

import shutil
from pathlib import Path

import cv2
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage

APP = Path(__file__).resolve().parents[1]
SRC = APP / "design/source"
KEEP = SRC / "_pre_blink_20261031"
SS = 4  # the lids are drawn at 4x and brought down, for a clean anti-aliased line
INK = (32, 24, 20, 255)

PAIRS = {"blink": "rest", "laugh_3_blink": "laugh_3", "laugh_4_blink": "laugh_4"}


def eye_masks(open_rgba, old_rgba):
    """One mask per eye, traced on the OPEN face: grown from the eye-white
    through every non-skin pixel touching it (iris, pupil, rim line, lashes),
    held to the eye's own rows so it never reaches the brow. The old ovals only
    say where the two eyes are."""
    a = open_rgba[..., :3].astype(np.int32)
    b = old_rgba[..., :3].astype(np.int32)
    diff = (np.abs(a - b).sum(2) > 40) & (open_rgba[..., 3] > 200)
    # eyes only: the old blink may differ round the mouth too, and that blob
    # is big enough to be taken for an eye
    diff[int(diff.shape[0] * 0.62):] = False
    labels, n = ndimage.label(ndimage.binary_closing(ndimage.binary_opening(diff), iterations=3))
    sizes = ndimage.sum(np.ones_like(labels), labels, range(1, n + 1))
    keep = [i + 1 for i in np.argsort(sizes)[::-1][:2] if sizes[i] > 30]
    hsv = cv2.cvtColor(open_rgba[..., :3], cv2.COLOR_RGB2HSV).astype(np.int32)
    ref = skin_ref(open_rgba)
    nonskin = (np.abs(a - ref).sum(2) > 110) & (open_rgba[..., 3] > 200)
    white = (hsv[..., 1] < 60) & (hsv[..., 2] > 185)
    masks = []
    for k in keep:
        oval = ndimage.binary_fill_holes(labels == k)
        seeds = white & ndimage.binary_dilation(oval, iterations=6)
        if seeds.sum() < 4:
            masks.append(ndimage.binary_dilation(oval, iterations=1))
            continue
        # the eye lives inside its whites' hull, grown a lash-length
        pts = np.stack(np.nonzero(seeds)[::-1], 1).astype(np.int32)
        hull = np.zeros(diff.shape, np.uint8)
        cv2.fillConvexPoly(hull, cv2.convexHull(pts), 1)
        reach = ndimage.binary_dilation(hull.astype(bool), iterations=5)
        m = ndimage.binary_fill_holes(((nonskin | white) & reach) | hull.astype(bool))
        masks.append(ndimage.binary_dilation(m, iterations=1))
    masks.sort(key=lambda m: np.nonzero(m)[1].mean())
    return masks


def skin_ref(rgba):
    """The face's skin tone: the median of the warm, light, saturated pixels."""
    hsv = cv2.cvtColor(rgba[..., :3], cv2.COLOR_RGB2HSV).astype(np.int32)
    skin = (hsv[..., 0] >= 5) & (hsv[..., 0] <= 25) & (hsv[..., 1] > 80) & (hsv[..., 2] > 170) & (rgba[..., 3] > 200)
    return np.median(rgba[..., :3][skin], axis=0)


def skin_fill(rgba, hole):
    """Fill the hole from the SKIN round it only (normalised convolution), so
    fur and ink next to the eye never bleed in the way an in-paint drags them."""
    rgb = rgba[..., :3].astype(np.float32)
    ref = skin_ref(rgba)
    skin = (np.abs(rgb - ref).sum(2) < 90) & ~hole & (rgba[..., 3] > 200)
    out = rgb.copy()
    for sigma in (3, 6, 12):
        wgt = ndimage.gaussian_filter(skin.astype(np.float32), sigma)
        est = np.dstack([ndimage.gaussian_filter(rgb[..., c] * skin, sigma) for c in range(3)]) / np.maximum(wgt, 1e-4)[..., None]
        todo = hole & (wgt > 0.05)
        out[todo] = est[todo]
        if (hole & ~todo).sum() == 0:
            break
    # a whisper of the skin's own grain, so the fill is not dead flat
    grain = ndimage.gaussian_filter(np.random.default_rng(3).standard_normal(hole.shape), 0.7) * 3
    out[hole] += grain[hole][:, None]
    feather = ndimage.gaussian_filter(hole.astype(np.float32), 0.8)
    res = rgb * (1 - feather[..., None]) + out * feather[..., None]
    res[hole] = out[hole]
    return np.clip(res, 0, 255).astype(np.uint8)


def lid(draw, m, smile):
    ys, xs = np.nonzero(m)
    x0, x1 = xs.min(), xs.max()
    cy = (ys.min() + ys.max()) / 2
    w = x1 - x0
    l, r = x0 + w * 0.14, x1 - w * 0.14
    pts = []
    for i in range(21):
        t = i / 20
        x = l + (r - l) * t
        bow = 4 * t * (1 - t)
        # laugh: a ^ arc, crown up; blink: the lid lowered, sagging a touch
        y = cy + (-1 if smile else 1) * bow * w * (0.2 if smile else 0.1) + (w * 0.08 if smile else w * 0.05)
        pts.append((x * SS, y * SS))
    width = max(2, round(w * 0.075)) * SS
    draw.line(pts, fill=INK, width=width, joint="curve")
    for (px, py) in (pts[0], pts[-1]):
        draw.ellipse((px - width / 2, py - width / 2, px + width / 2, py + width / 2), fill=INK)
    if not smile:
        # one short lash flick at the outer corner
        outer = pts[-1] if xs.mean() > m.shape[1] / 2 else pts[0]
        s = 1 if outer is pts[-1] else -1
        draw.line([outer, (outer[0] + s * w * 0.14 * SS, outer[1] + w * 0.06 * SS)], fill=INK, width=int(width * 0.8))


def redraw(cast, closed, open_name):
    dst = SRC / cast / f"head_2_face_{closed}.png"
    keep = KEEP / cast / dst.name
    if not keep.exists():
        keep.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(dst, keep)
    old = np.array(Image.open(keep).convert("RGBA"))
    opened = np.array(Image.open(SRC / cast / f"head_2_face_{open_name}.png").convert("RGBA"))
    masks = eye_masks(opened, old)
    hole = np.zeros(opened.shape[:2], bool)
    for m in masks:
        hole |= m
    rgb = skin_fill(opened, hole)
    out = np.dstack([rgb, opened[..., 3]])
    h, w = hole.shape
    lines = Image.new("RGBA", (w * SS, h * SS))
    d = ImageDraw.Draw(lines)
    for m in masks:
        lid(d, m, smile=closed.startswith("laugh"))
    lines = lines.resize((w, h), Image.Resampling.LANCZOS)
    img = Image.fromarray(out.astype(np.uint8), "RGBA")
    img.alpha_composite(lines)
    img.save(dst)
    return len(masks)


def main():
    for cast in ("mg", "fg"):
        for closed, open_name in PAIRS.items():
            n = redraw(cast, closed, open_name)
            print(cast, closed, "eyes:", n)


if __name__ == "__main__":
    main()
