"""Cut a subject off an OPAQUE painted plate, for use as a thrown prop.

This is the problem gen-3's cut_prop.py failed at, and it is worth saying why it
is tractable here when it was not there.

gen-3's tiles were painted rainforest scenery: the subject was green foliage on a
green mossy plate, and the two shared hue, value AND texture. Five approaches
were tried — luminance guard, local colour step, gradient wall, wall dilation,
centre-component — and every one of them walked straight through the outline,
because there was no measurable property that separated subject from ground.

This game's plates are dark, desaturated slate and its dynamite is bright,
saturated red. Measured off b.png:

    plate      (55,59,60) (47,50,55) (36,37,39) (30,30,30)   max<=110, sat<=25
    dynamite   (192,29,20) (238,112,90) (213,67,52)          sat 100-172
    rope       (195,167,127) (125,91,63)                     bright or saturated

So the test is "dark AND desaturated", the two are separated on both axes at
once, and the flood is seeded from the border so a genuinely dark part of the
subject cannot be keyed out from the inside.

WHAT THIS CANNOT DO: A SUBJECT THAT LIGHTS THE PLATE.

It cuts the dynamite bundle and its rope perfectly. It cannot cut the lit fuse,
and the reason is worth recording so nobody spends the afternoon I just spent.

The spark at the end of the fuse throws light onto the stone around it. Lit stone
is neither dark nor grey — measured on b.jpg it runs (137,136,131), (158,141,115),
(190,173,147), (162,119,74) — and the tan binding rope runs (195,167,127),
(125,91,63). The two overlap on BOTH axes at once, so no threshold separates
them. Four attempts, each measured:

  max 120 / sat 28   bundle and rope perfect, torn chunk of plate on the fuse
  max 175 / sat 48   halo mostly gone, and the binding rope is eaten with it
  max 200 / sat 55   worse: the bundle edges go too
  saturation core    the warm halo passes the core test, dilation fills the rest,
    + dilation       and loose rock chips on the plate are kept as debris

THE FIX IS UPSTREAM, NOT HERE. Ask for the prop as a transparent-background
render — a checkerboard, the way the earlier dynamite came — and design/dechecker.py
handles it in one pass, spark and all. On a checkerboard the background is KNOWN
(two flat tones) instead of painted, which is the whole difference.

Usage:  python design/cut_from_plate.py <in.png> <out.png> [--pad 6]
"""

import os
import sys
from collections import deque

from PIL import Image, ImageFilter

# Plate is anything no brighter than this in its strongest channel...
PLATE_MAX = 120
# ...and no more colourful than this (max channel minus min channel).
PLATE_SAT = 28
# The painted outline around the subject bleeds into the plate. Eroding the kept
# region by this removes the halo it would otherwise leave.
ERODE = 1
FEATHER = 1.0
# Detached scraps smaller than this share of the largest island are dropped —
# a soft edge that faded into the plate comes back as confetti.
ISLAND_MIN_SHARE = 0.02


def cut(img):
    rgb = img.convert("RGB")
    w, h = rgb.size
    px = rgb.load()

    def is_plate(p):
        return max(p) <= PLATE_MAX and (max(p) - min(p)) <= PLATE_SAT

    outside = bytearray(w * h)
    q = deque()

    def seed(x, y):
        i = y * w + x
        if outside[i] or not is_plate(px[x, y]):
            return
        outside[i] = 1
        q.append((x, y))

    for x in range(w):
        seed(x, 0)
        seed(x, h - 1)
    for y in range(h):
        seed(0, y)
        seed(w - 1, y)

    while q:
        x, y = q.popleft()
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            nx, ny = x + dx, y + dy
            if not (0 <= nx < w and 0 <= ny < h):
                continue
            i = ny * w + nx
            if outside[i] or not is_plate(px[nx, ny]):
                continue
            outside[i] = 1
            q.append((nx, ny))

    # Everything the flood could not reach is either the subject or a pocket of
    # plate enclosed by it. Both are islands; the small ones are scraps.
    seen = bytearray(w * h)
    islands = []
    for sy in range(h):
        for sx in range(w):
            i0 = sy * w + sx
            if seen[i0] or outside[i0]:
                continue
            comp, stack = [], [(sx, sy)]
            seen[i0] = 1
            while stack:
                x, y = stack.pop()
                comp.append((x, y))
                for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    nx, ny = x + dx, y + dy
                    if not (0 <= nx < w and 0 <= ny < h):
                        continue
                    j = ny * w + nx
                    if seen[j] or outside[j]:
                        continue
                    seen[j] = 1
                    stack.append((nx, ny))
            islands.append(comp)

    dropped = 0
    if islands:
        biggest = max(len(c) for c in islands)
        for comp in islands:
            if len(comp) >= biggest * ISLAND_MIN_SHARE:
                continue
            for x, y in comp:
                outside[y * w + x] = 1
            dropped += 1

    alpha = Image.new("L", (w, h), 255)
    ap = alpha.load()
    for y in range(h):
        row = y * w
        for x in range(w):
            if outside[row + x]:
                ap[x, y] = 0

    if ERODE:
        alpha = alpha.filter(ImageFilter.MinFilter(1 + 2 * ERODE))
    if FEATHER:
        alpha = alpha.filter(ImageFilter.GaussianBlur(FEATHER))

    out = rgb.convert("RGBA")
    out.putalpha(alpha)
    return out, dropped


def trim(img, pad=6):
    bbox = img.getchannel("A").point(lambda v: 255 if v > 6 else 0).getbbox()
    if not bbox:
        return img
    x0, y0, x1, y1 = bbox
    return img.crop(
        (max(0, x0 - pad), max(0, y0 - pad), min(img.width, x1 + pad), min(img.height, y1 + pad))
    )


def main():
    if len(sys.argv) < 3:
        print(__doc__)
        sys.exit(1)
    src, dest = sys.argv[1], sys.argv[2]
    pad = int(sys.argv[sys.argv.index("--pad") + 1]) if "--pad" in sys.argv else 6

    img = Image.open(src)
    img.load()
    cutout, dropped = cut(img)
    out = trim(cutout, pad)

    opaque = sum(1 for v in out.getchannel("A").get_flattened_data() if v > 200)
    share = opaque / (out.width * out.height)
    print(f"{os.path.basename(src)} {img.width}x{img.height} -> "
          f"{os.path.basename(dest)} {out.width}x{out.height}")
    print(f"  detached scraps dropped: {dropped}")
    print(f"  {share * 100:.1f}% of the result is opaque")

    # The same guard cut_prop.py carried. A cut that removed almost nothing, or
    # almost everything, is a failed cut that LOOKS like a number — gen-3's worst
    # attempt measured as 70.5% removed and had eaten the subject's outline.
    # Refusing is better than shipping a broken prop.
    if not 0.25 <= share <= 0.90:
        print("REFUSED: outside the plausible band for a trimmed cut-out. Nothing written.")
        sys.exit(2)

    out.save(dest, "PNG", optimize=True)
    print(f"  {os.path.getsize(dest) / 1024:.0f} KB")


if __name__ == "__main__":
    main()
