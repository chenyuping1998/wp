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

import numpy as np
from PIL import Image, ImageFilter

# Plate is anything no brighter than this in its strongest channel...
# ...and no more colourful than this (max channel minus min channel).
#
# RE-MEASURED FOR THE CAPTAIN PACK, whose plate is a mid-tone grey-blue shipping
# container panel rather than the dark slate these were first tuned to. Sampled
# off h2.png, the four corners for plate and the sphere's centre for subject:
#
#     plate    brightness p50 66, p99 132, max 173   saturation p99 25, max 33
#     mine     brightness p10 192, p50 213           saturation p10 167
#
# Separated on both axes with room to spare, so the AND test still holds. At the
# inherited 120 the brightest ribs of the panel (up to 173) failed the test and
# survived the flood as debris around the subject.
PLATE_MAX = 175
PLATE_SAT = 40
# ...AND NOT INK. The subject's own outline was being keyed out with the plate,
# and everything else on this file was working around it.
#
# The mine is drawn with a heavy near-BLACK contour, thickest where the horns
# meet the sphere. Black is dark and it is perfectly desaturated, so it passes
# both tests above — the flood walked straight through the outline at every horn
# root and took the junction with it, which is why each horn came out floating
# next to the sphere with a rounded notch bitten out between them.
#
# A square close of radius 10 used to hide that by bridging the notch, and paid
# for it with a wedge of panel welded into every junction. Removing the outline
# from the plate test fixes the cause instead, and it takes one channel to do:
# this panel is painted BLUE-grey and the ink is neutral-to-warm. Measured, the
# panel's darkest grooves run (51,60,67), (78,91,99), (77,85,90) — blue ahead of
# red by 16 to 22 — while the contour sits at (20,20,22) and below, blue ahead of
# red by 2. Nothing on this plate is both that dark and that neutral except the
# drawing.
INK_MAX = 110
INK_BLUE = 8
# The painted outline around the subject bleeds into the plate. Eroding the kept
# region by this removes the halo it would otherwise leave.
ERODE = 1
FEATHER = 1.0
# Radius of the closing that seals dark channels reaching the silhouette.
#
# THE CLOSE IS VERTICAL ONLY, and that is the whole point of it.
#
# The leak this exists to plug is ONE feature: the mine's seam band, a horizontal
# strip of chipped paint showing bare grey metal. It is plate-coloured on both
# axes and it touches the silhouette at the left and right of the sphere, so it
# is a channel and the flood walks the length of it, eating the seam out and
# leaving the mine sliced across the middle.
#
# A SQUARE close seals it, and pays for it everywhere else. A close bridges any
# concavity narrower than twice its radius in ANY direction, and the gaps where
# the horns meet the sphere are exactly that size — so at radius 8 it welded a
# wedge of the panel's shadow into each junction and left a hard straight edge
# across the horn, which is what "the edges look dirty" was. Shrinking it did not
# help: at 4 the seam leaks again.
#
# A vertical line element cannot do that. The seam is thin vertically and long
# horizontally, so a vertical close shuts it; the horn junctions open upward and
# sideways and are tall, so a vertical close does not reach across them. The
# outer silhouette is untouched either way, because a close never moves a
# boundary it cannot bridge.
#
# Swept on a checkerboard at 0, 6 and 10: 0 leaves the seam eaten and notches at
# the two lower horn roots, 6 seals both, 10 is indistinguishable from 6. 8 is 6
# with a margin.
CLOSE_V = 6
# Radius of an opening (erode then dilate) run after the holes are filled. It
# removes any alpha structure thinner than twice the radius and leaves everything
# else where it is.
#
# One thing on this prop needs it: the mine is drawn hanging from a shackle, and
# above the shackle is a mooring wire two or three pixels wide that ran off the
# top of the tile. Cut out and thrown, it is a loose hair trailing off the prop
# that tumbles with it. 3 takes the wire and leaves the shackle, which is about
# twenty across.
OPEN = 3
# How far the finished edge is peeled back THROUGH PLATE-COLOURED PIXELS ONLY.
#
# The close and the fill both work on the alpha and neither looks at colour
# again, so whatever panel they welded in stays welded. This peels it back off:
# starting from the transparent side, a pixel is given up if it still passes the
# plate test, and the peel stops the moment it meets the subject's own paint —
# which is saturated red here, nowhere near the test.
#
# Bounded rather than run to exhaustion, and the horn ends are why. Each horn is
# drawn as a cut cylinder with bare grey metal at the tip; that grey is plate-
# coloured and it touches the silhouette, so an unbounded peel eats up the horn
# from its end.
#
# THE PEEL USES A WIDER COLOUR TEST THAN THE FLOOD, and the mine's cast shadow is
# why.
#
# The flood's test has to be strict, because it runs to exhaustion across the
# whole plate and one wrong pixel opens a channel into the subject. The shadow
# the mine throws on the panel is not caught by it: red light bounces into that
# shadow, so it measures warm — sampled along the left horn it runs (126,99,82),
# (146,115,94), (153,117,93), saturation 44 to 60 against the flood's ceiling of
# 40 — and it survived as a soft grey-brown halo hugging the silhouette.
#
# The peel can afford the wider test precisely because it is bounded and because
# it stops at the first pixel that fails: it never travels, it only pares. The
# ceiling sits at 60 with the mine's own outline measuring 67 and up, which is
# not a lot of daylight, and it is the reason this is six pixels rather than
# unbounded.
# TWO PASSES, because the two kinds of leftover need opposite settings.
#
#   (10, 40)  DEEP and STRICT. What is left hanging off the silhouette after the
#             ink guard is the panel's own dark rib lines - neutral grey, and
#             nothing on the mine's edge is neutral, so this can afford to reach
#             ten pixels in.
#   (4, 60)   SHALLOW and WIDE. The mine's cast shadow on the panel is warm,
#             because red light bounces into it: sampled along the left horn it
#             runs (126,99,82), (146,115,94), (153,117,93), saturation 44 to 60
#             against the flood's ceiling of 40. Catching it needs the ceiling
#             raised to 60 - which is only 7 below the mine's own outline, so
#             this pass must not travel.
#
# Order matters: strict first. Run the wide pass first and it walks along the
# warm shadow into ground the strict pass would have stopped at.
PEEL_MAX = 175
PEEL_PASSES = ((10, 40), (4, 60))
# ONLY THE LARGEST ISLAND SURVIVES.
#
# A thrown prop is one object. Everything the flood could not reach is either
# that object or something else on the plate, and there is no third case — so
# the rule is "keep the biggest piece" rather than a size threshold.
#
# The threshold was 2% of the largest island, and the ink guard above is what
# made it insufficient: rust streaks are warm, so they are not plate by the
# saturation test and never were, but they used to be attached to the subject by
# the same channels the ink guard has now sealed. Cut loose they arrived as four
# large scraps in the corners of the tile, every one of them well over 2%.
KEEP_LARGEST_ISLAND = True


def close_vertical(alpha, radius):
    """Morphological close with a VERTICAL line element. See CLOSE_V.

    Written out rather than reached for in a library because PIL's MaxFilter and
    MinFilter are square-only, and square is exactly what this must not be.
    """
    a = np.asarray(alpha, dtype=np.uint8)
    h = a.shape[0]
    grown = a.copy()
    for k in range(1, radius + 1):
        grown[k:] = np.maximum(grown[k:], a[:-k])
        grown[:-k] = np.maximum(grown[:-k], a[k:])
    shrunk = grown.copy()
    for k in range(1, radius + 1):
        shrunk[k:] = np.minimum(shrunk[k:], grown[:-k])
        shrunk[:-k] = np.minimum(shrunk[:-k], grown[k:])
    # Out of frame counts as opaque for the erosion half, or the top and bottom
    # `radius` rows are shaved off whatever happens to be there.
    shrunk[:radius] = grown[:radius]
    shrunk[h - radius:] = grown[h - radius:]
    # .copy(): fromarray hands back a buffer-backed image that PIL marks
    # read-only, and the hole fill below writes through alpha.load().
    return Image.fromarray(shrunk, "L").copy()


def keep_largest(alpha):
    """Drop every opaque region except the biggest one.

    RUN LAST, and that is the whole reason it exists as a separate pass.

    The same rule is applied to the flood's islands much earlier, where it is
    about what the flood could not reach. It has to be applied again here
    because the steps in between can SEVER things: the edge peel and the opening
    both remove a few pixels, and a rust streak that was hanging off the
    subject by a four-pixel thread comes out of them as its own object, floating
    in the corner of the tile. Measured on the mine: four such scraps, 21 to
    4,933 pixels, all of them attached at flood time.
    """
    a = np.asarray(alpha, dtype=np.uint8)
    h, w = a.shape
    on = a > 128
    seen = np.zeros((h, w), bool)
    best, best_size = None, 0
    for sy in range(h):
        for sx in range(w):
            if not on[sy, sx] or seen[sy, sx]:
                continue
            comp, stack = [], [(sx, sy)]
            seen[sy, sx] = True
            while stack:
                x, y = stack.pop()
                comp.append((x, y))
                for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    nx, ny = x + dx, y + dy
                    if 0 <= nx < w and 0 <= ny < h and on[ny, nx] and not seen[ny, nx]:
                        seen[ny, nx] = True
                        stack.append((nx, ny))
            if len(comp) > best_size:
                best, best_size = comp, len(comp)
    if best is None:
        return alpha, 0
    keep = np.zeros((h, w), bool)
    for x, y in best:
        keep[y, x] = True
    dropped = int(on.sum()) - best_size
    out = np.where(keep, a, 0).astype(np.uint8)
    return Image.fromarray(out, "L").copy(), dropped


def cut(img):
    rgb = img.convert("RGB")
    w, h = rgb.size
    px = rgb.load()

    def is_ink(p):
        return max(p) <= INK_MAX and (p[2] - p[0]) < INK_BLUE

    def is_plate(p):
        return max(p) <= PLATE_MAX and (max(p) - min(p)) <= PLATE_SAT and not is_ink(p)

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
    if islands and KEEP_LARGEST_ISLAND:
        keep = max(islands, key=len)
        for comp in islands:
            if comp is keep:
                continue
            # Marked outside rather than deleted: an enclosed pocket of plate is
            # an island too, and putting it back outside is exactly what lets the
            # hole fill below recover it as a hole.
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

    # SEAL CHANNELS THE FLOOD CAME IN THROUGH.
    #
    # The island logic above recovers a dark pocket that the subject fully
    # encloses. It cannot recover a dark feature that REACHES THE SILHOUETTE,
    # because that is a channel to the outside and the flood simply walks in.
    #
    # The captain pack's mine has exactly that: a dark, desaturated seam band
    # running edge to edge across the sphere. It passes the plate test on both
    # axes, it touches the outline on both sides, and the first cut came out with
    # the mine sliced clean in half.
    #
    # A morphological close seals any channel narrower than twice the radius
    # while leaving the outer silhouette where it was. Set it from the widest
    # such channel in the subject, not higher: an oversized close will bridge
    # genuine gaps, and on this pack it would weld the horns to the sphere.
    if CLOSE_V:
        alpha = close_vertical(alpha, CLOSE_V)

    # FILL WHAT THE FLOOD LEFT INSIDE THE SUBJECT.
    #
    # The close seals narrow channels, but widening it far enough to catch every
    # leak is the wrong lever — on this pack the remaining leaks are at the
    # horn-to-sphere junctions, and a close big enough to shut those welds the
    # horns into the sphere.
    #
    # This is the principled version: flood the TRANSPARENT region from the
    # border, and anything transparent the flood cannot reach is enclosed by the
    # subject and therefore a hole, whatever its size or shape. It cannot touch
    # the outer silhouette, because the silhouette is by definition reachable.
    ap = alpha.load()
    reached = bytearray(w * h)
    q = deque()
    for x in range(w):
        for y in (0, h - 1):
            if not ap[x, y] and not reached[y * w + x]:
                reached[y * w + x] = 1
                q.append((x, y))
    for y in range(h):
        for x in (0, w - 1):
            if not ap[x, y] and not reached[y * w + x]:
                reached[y * w + x] = 1
                q.append((x, y))
    while q:
        x, y = q.popleft()
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            nx, ny = x + dx, y + dy
            if not (0 <= nx < w and 0 <= ny < h):
                continue
            j = ny * w + nx
            if reached[j] or ap[nx, ny]:
                continue
            reached[j] = 1
            q.append((nx, ny))
    filled = 0
    for y in range(h):
        row = y * w
        for x in range(w):
            if not ap[x, y] and not reached[row + x]:
                ap[x, y] = 255
                filled += 1
    if filled:
        print(f"  holes filled: {filled} px")

    # Peel leftover ground back off the edge — see PEEL_PASSES.
    ap = alpha.load()
    for depth, peel_sat in PEEL_PASSES:
        for _ in range(depth):
            doomed = []
            for y in range(h):
                for x in range(w):
                    if not ap[x, y]:
                        continue
                    p = px[x, y]
                    if max(p) > PEEL_MAX or (max(p) - min(p)) > peel_sat:
                        continue
                    for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                        nx, ny = x + dx, y + dy
                        if not (0 <= nx < w and 0 <= ny < h) or not ap[nx, ny]:
                            doomed.append((x, y))
                            break
            if not doomed:
                break
            for x, y in doomed:
                ap[x, y] = 0

    # Thin tendrils, after the holes are filled so a hole cannot be mistaken for
    # one. See OPEN.
    if OPEN:
        size = 1 + 2 * OPEN
        alpha = alpha.filter(ImageFilter.MinFilter(size)).filter(ImageFilter.MaxFilter(size))

    if ERODE:
        alpha = alpha.filter(ImageFilter.MinFilter(1 + 2 * ERODE))
    alpha, severed = keep_largest(alpha)
    if severed:
        print(f"  severed scraps dropped: {severed} px")

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
