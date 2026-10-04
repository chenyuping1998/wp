"""Cut a transparent prop out of a framed symbol tile.

DOES NOT WORK ON THIS GAME'S RAINFOREST TILES. Read the next section before
reaching for it. Kept because the record of what was tried is worth more than
the file, and because it does work on art with a clean flat background.


The transition throws a grenade across the live board, and what it throws has to
be a cut-out. Using the tile itself would send a stone plate complete with frame
and rivets sailing through the air — which is exactly what gen-2 did before
someone noticed, and why a separate `grenade.png` exists at all.

HOW THE CUT WORKS

Flood fill inward from the border, not a colour key. A colour key cannot work
here: the plate is green and so is the pineapple, so any threshold wide enough to
take the background also eats the fruit.

WHAT STOPS THE FLOOD: EDGE STRENGTH, NOT COLOUR

Two simpler tests were tried first and both failed on this art, for reasons
worth keeping:

  luminance ("never cross into anything dark, that is the outline")
      The pineapple's internal scale lines are as dark as its outer outline —
      both around 66-88 — and the tile's own vignette is darker still, 31 at the
      corners. The guard rejected the border seeds outright and the fill never
      started.

  local colour step ("stop at a sharp change")
      The outline is ANTI-ALIASED. From plate to outline the luminance ramps
      90 -> 82 -> 71 -> 60 -> 50 -> 40, and every one of those steps is small.
      The flood walked down the ramp, through the outline, and into the fruit,
      which is what produced a cut-out with its own linework eaten away and
      white holes where the scale lines used to be.

      That version measured as fine — it removed 70.5% of the tile, close to the
      expected background share — because a proportion cannot tell you WHICH
      pixels went.

So the test is the gradient MAGNITUDE at each pixel. An anti-aliased ramp is
high-gradient along its whole length, so the fill stops at the first pixel of
the outline instead of walking down it, and the outline is kept as part of the
subject. Flat background, however dark or bright, is low-gradient and is taken.

WHY IT FAILS HERE

Five approaches were measured against h2 (the pineapple grenade tile):

  luminance guard        the fruit's internal scale lines are as dark as its
                         outline (66-88) and the tile vignette darker still (31),
                         so the border seeds were rejected and nothing ran
  local colour step      the outline is anti-aliased: 90 -> 82 -> 71 -> 60 -> 50,
                         every step small, so the flood walked THROUGH it and ate
                         the linework
  gradient wall          the plate's painted grain has gradients overlapping the
                         weaker parts of the outline. Sweeping the threshold gives
                         44% kept (flood boxed in by grain, background left on) or
                         10% kept (flood finds a weak pixel and fills the fruit).
                         Nothing in between.
  wall dilation          closes the leak but thickens the grain walls too, so the
                         flood is boxed in harder: 44-56%
  centre component       cannot help — the leftover plate is CONNECTED to the
                         subject, so it is all one component

The lesson from the second one is the one worth keeping: it measured as correct.
It removed 70.5% of the tile, which is close to the expected background share,
and the result had holes punched through the fruit. A proportion cannot tell you
WHICH pixels went.

WHAT TO DO INSTEAD

Generate the prop as its own image with a transparent background. One prompt,
and the alpha is authored rather than inferred.

Usage:  python design/cut_prop.py <source-image> <out.png> [--pad 8]
"""

import os
import sys
from collections import deque

from PIL import Image

# Gradient magnitude above which the fill will not enter a pixel. Swept against
# how much of the tile comes away, and cross-checked by eye on the silhouette —
# a proportion alone cannot tell you whether the right pixels went.
EDGE_STOP = 55
# The gradient is measured on a slightly blurred copy so the plate's painted
# grain does not read as edges.
EDGE_BLUR = 1.2
# How many 3x3 dilations to close gaps in the edge wall.
WALL_CLOSE = 2
# Alpha edge softening, in pixels.
FEATHER = 1.5
# Surviving shapes smaller than this share of the largest one are discarded as
# flood-fill leftovers rather than parts of the subject.
ISLAND_MIN_FRACTION = 0.35


def _touches(comp, other, w, h):
    """Is any pixel of `comp` adjacent to `other`? Parts of one prop that the
    flood separated — a ring against a lever — should stay together."""
    for i in comp:
        x0, y0 = i % w, i // w
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            nx, ny = x0 + dx, y0 + dy
            if 0 <= nx < w and 0 <= ny < h and (ny * w + nx) in other:
                return True
    return False


def edge_map(rgb):
    """Per-pixel gradient magnitude, 0..255, on a blurred luminance copy."""
    from PIL import ImageFilter

    grey = rgb.convert("L").filter(ImageFilter.GaussianBlur(EDGE_BLUR))
    # Sobel, as two 3x3 convolutions. PIL's FIND_EDGES is a Laplacian and rings
    # on both sides of a line, which would wall the fill off a pixel early and
    # leave a halo of background attached to the subject.
    kx = ImageFilter.Kernel((3, 3), (-1, 0, 1, -2, 0, 2, -1, 0, 1), scale=1, offset=128)
    ky = ImageFilter.Kernel((3, 3), (-1, -2, -1, 0, 0, 0, 1, 2, 1), scale=1, offset=128)
    gx = grey.filter(kx).load()
    gy = grey.filter(ky).load()
    w, h = grey.size
    mag = Image.new("L", (w, h))
    mp = mag.load()
    for y in range(h):
        for x in range(w):
            m = abs(gx[x, y] - 128) + abs(gy[x, y] - 128)
            mp[x, y] = 255 if m > 255 else m

    # CLOSE THE WALL BEFORE FLOODING.
    #
    # A gradient wall is only as good as its weakest pixel. Where the outline
    # runs against a background of similar tone its gradient dips, and a single
    # weak pixel is a doorway: the flood goes through it and fills the fruit's
    # smooth interior. That is the 43% -> 10% cliff seen when sweeping the
    # threshold, with nothing usable in between.
    #
    # Dilating the wall closes those gaps. The cost is that the fill now stops a
    # pixel or two further out, leaving a hair of background attached — which is
    # invisible under the feather, and far cheaper than a hole through the prop.
    wall = mag.point(lambda v: 255 if v > EDGE_STOP else 0)
    for _ in range(WALL_CLOSE):
        wall = wall.filter(ImageFilter.MaxFilter(3))
    return bytearray(wall.get_flattened_data())


def cut(img):
    rgb = img.convert("RGB")
    w, h = rgb.size
    px = rgb.load()
    mag = edge_map(rgb)

    outside = bytearray(w * h)
    q = deque()

    def seed(x, y):
        i = y * w + x
        if outside[i] or mag[i]:
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
            if outside[i]:
                continue
            if mag[i]:
                continue
            outside[i] = 1
            q.append((nx, ny))

    # Drop islands the flood could not reach.
    #
    # A dark crack or a shadow enclosed by a step larger than the tolerance ends
    # up walled off from the border and survives as a stray blob — this tile kept
    # 249 pixels along its bottom edge that way. They are invisible against a
    # dark background and yet they defeat the trim below, which then leaves the
    # prop with the tile's whole empty margin still attached.
    #
    # Everything smaller than a fraction of the biggest surviving shape goes.
    kept = [i for i in range(w * h) if not outside[i]]
    seen = bytearray(w * h)
    components = []
    for start in kept:
        if seen[start]:
            continue
        comp = [start]
        seen[start] = 1
        stack = [start]
        while stack:
            i = stack.pop()
            x0, y0 = i % w, i // w
            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                nx, ny = x0 + dx, y0 + dy
                if not (0 <= nx < w and 0 <= ny < h):
                    continue
                j = ny * w + nx
                if seen[j] or outside[j]:
                    continue
                seen[j] = 1
                comp.append(j)
                stack.append(j)
        components.append(comp)

    # KEEP THE SUBJECT, NOT "WHATEVER SURVIVED".
    #
    # The flood does not clear the whole background: the plate's painted grain
    # forms gradient walls that box it in, so roughly a sixth of the plate is
    # left behind in patches. Sweeping the threshold does not fix that — there is
    # a cliff between "stops early and leaves 43% of the tile" and "finds a weak
    # spot in the outline and floods the fruit's smooth interior, leaving 10%".
    # No setting sits between them.
    #
    # So the survivors are filtered by WHERE THEY ARE instead of how big they
    # are. The subject is centred by construction — these are symbol tiles — so
    # the component covering the centre is the subject, and every other surviving
    # patch is plate the flood could not reach. Components close in size to the
    # subject are kept too, for a prop whose parts do not touch.
    if components:
        centre = (h // 2) * w + (w // 2)
        subject = next((c for c in components if centre in set(c)), None)
        if subject is None:
            subject = max(components, key=len)
        keep_from = len(subject) * ISLAND_MIN_FRACTION
        subject_set = set(subject)
        for comp in components:
            if comp is subject:
                continue
            if len(comp) >= keep_from and _touches(comp, subject_set, w, h):
                continue
            for i in comp:
                outside[i] = 1

    # Fill holes: anything now marked outside that cannot reach the border is
    # enclosed by the subject and belongs to it. Without this a bright highlight
    # inside the fruit that the flood happened to reach would punch a window
    # straight through the prop.
    reachable = bytearray(w * h)
    q2 = deque()
    for x in range(w):
        for y in (0, h - 1):
            i = y * w + x
            if outside[i] and not reachable[i]:
                reachable[i] = 1
                q2.append(i)
    for y in range(h):
        for x in (0, w - 1):
            i = y * w + x
            if outside[i] and not reachable[i]:
                reachable[i] = 1
                q2.append(i)
    while q2:
        i = q2.popleft()
        x0, y0 = i % w, i // w
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            nx, ny = x0 + dx, y0 + dy
            if not (0 <= nx < w and 0 <= ny < h):
                continue
            j = ny * w + nx
            if reachable[j] or not outside[j]:
                continue
            reachable[j] = 1
            q2.append(j)
    for i in range(w * h):
        if outside[i] and not reachable[i]:
            outside[i] = 0

    alpha = Image.new("L", (w, h), 255)
    ap = alpha.load()
    for y in range(h):
        row = y * w
        for x in range(w):
            if outside[row + x]:
                ap[x, y] = 0

    if FEATHER > 0:
        from PIL import ImageFilter

        alpha = alpha.filter(ImageFilter.GaussianBlur(FEATHER))

    out = rgb.convert("RGBA")
    out.putalpha(alpha)
    return out


def trim(img, pad=8):
    """Crop to the subject, then pad — a prop is positioned by its own centre,
    so leaving the tile's empty margins on would offset it in every scene that
    draws it."""
    bbox = img.getchannel("A").point(lambda v: 255 if v > 6 else 0).getbbox()
    if not bbox:
        return img
    x0, y0, x1, y1 = bbox
    x0 = max(0, x0 - pad)
    y0 = max(0, y0 - pad)
    x1 = min(img.width, x1 + pad)
    y1 = min(img.height, y1 + pad)
    return img.crop((x0, y0, x1, y1))


def main():
    if len(sys.argv) < 3:
        print(__doc__)
        sys.exit(1)
    src, dest = sys.argv[1], sys.argv[2]
    pad = 8
    if "--pad" in sys.argv:
        pad = int(sys.argv[sys.argv.index("--pad") + 1])

    img = Image.open(src)
    img.load()
    before = img.size
    out = trim(cut(img), pad)

    # Refuse to write an implausible cut rather than leaving a broken prop in the
    # game. A subject occupies roughly a quarter to a half of its tile; anything
    # outside that means the flood either barely ran or ate the subject, and both
    # produce a file that looks plausible in a listing and wrong on screen.
    opaque = sum(1 for v in out.getchannel("A").get_flattened_data() if v > 200)
    share = opaque / (out.width * out.height)
    if not 0.18 <= share <= 0.62:
        print(f"REFUSED: {share * 100:.1f}% of the result is opaque, outside the "
              f"plausible 18-62% band for a cut-out subject.")
        print("  Nothing was written. See the module docstring — this method does "
              "not work on painted tiles with grainy backgrounds.")
        sys.exit(2)

    os.makedirs(os.path.dirname(dest) or ".", exist_ok=True)
    out.save(dest, "PNG", optimize=True)

    print(f"{os.path.basename(src)} {before[0]}x{before[1]} -> "
          f"{os.path.basename(dest)} {out.width}x{out.height}")
    print(f"  {opaque / (out.width * out.height) * 100:.1f}% of the result is opaque")
    print(f"  {os.path.getsize(dest) / 1024:.0f} KB")


if __name__ == "__main__":
    main()
