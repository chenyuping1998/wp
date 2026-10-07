"""Turn a painted-on transparency checkerboard into a real alpha channel.

Image generators asked for "a transparent background" often answer with a JPEG
of the CHECKERBOARD — the grey-and-white tiles a paint program draws to SHOW
transparency, rendered as opaque pixels. The file looks right in a preview and
carries no alpha at all.

That is a much easier problem than cutting a subject out of painted scenery,
and it is worth keeping the two apart (see cut_prop.py, which cannot do the
other one). Here the background is SYNTHETIC and known:

  · exactly two flat tones, measured off this file
  · flat, so JPEG leaves it clean apart from ringing near the outline

FROSTLINE'S CHECKER IS NOT ACHROMATIC, which is the one change from the copy
this was taken from (apps/GoBoomana). That generator drew the checkerboard in
greys, so the test there could be "achromatic AND near one of two scalar tones".
This delivery's checker is blue: measured off the border, the two tones are
(17,26,33) and (78,90,102), with channel spreads of 16 and 24. The inherited
CHROMA_MAX of 20 would have passed the dark tone and REJECTED the light one, so
half the checkerboard would have survived as opaque pixels.

So the tones are full RGB triples here and the test is distance to the nearer of
them. What kept the grey parts of the subject safe was never the achromatic
test anyway — it is the flood from the border, which cannot reach a steel ring
in the middle of the artwork whatever colour it is.

Usage:  python design/dechecker.py <in.jpg> <out.png> [--pad 8]
"""

import os
import sys
from collections import deque

from PIL import Image, ImageFilter

# The two checker tones. Read from the file rather than assumed — a different
# generator uses a different pair.
TONE_TOLERANCE = 26
# How far R, G and B may differ from each other before a pixel counts as
# coloured rather than grey. JPEG ringing near the outline tints the checker
# slightly, so this cannot be zero.
CHROMA_MAX = 20
# Alpha edge softening, in pixels.
FEATHER = 1.0
# The dark outline that JPEG smeared into the background comes back as a grey
# halo. Eroding the kept region by this much removes it.
ERODE = 1
# How much brighter the green channel may run before a pixel stops counting as
# checker. A glowing part of the artwork casts light ONTO the checkerboard, and
# the tinted result fails a plain achromatic test — the visor's glow came back as
# a rectangular block of checkerboard stuck to the character's head.
#
# Safe because it only relaxes ONE channel while still requiring red and blue to
# sit on a checker tone and to match each other. Tinted checker is (230, 250,
# 230): red and blue on tone, green lifted. The visor itself is (60, 255, 120):
# red and blue nowhere near a tone, so it is never touched.
#
# The halo is background, not artwork, and it is right to lose it: a glow baked
# into a cut-out is lit for the background it was generated against and will look
# wrong over any other one. It belongs in the composite.
CAST_MAX = 42
# A glowing part of the artwork does not merely ADD colour to the checkerboard,
# it MULTIPLIES: the checker shows through the light, darkened in the channels
# the light lacks. Measured against tones of 255 and 201:
#
#   ( 181, 216, 192 )  a green visor's halo   (gen-3's gorilla)
#   ( 228, 170,  96 )  a headlamp beam        (this one)
#
# No tolerance on the plain tone test covers either without also swallowing the
# artwork's own mid tones, so tinted checker gets its own test.
#
# It identifies the SHAPE of a tinted tone rather than a particular hue, because
# the first version only understood green and this pack's beam is orange:
#
#   · the BRIGHTEST channel is still near a checker tone — a multiply darkens
#     every channel but leaves the strongest one closest to where it started
#   · the DARKEST channel is still light — this is paper under a coloured light,
#     not a dark object
#
# Safe to keep loose because it is only ever reached by the flood, and the flood
# cannot get inside the figure: this art is drawn with a dark outline all the way
# round it (measured at (19, 9, 0)), which no brightness-gated test can cross.
GLOW_FLOOR = 80
# How far the brightest channel may sit from a tone, as a FRACTION of the
# brightest tone. Proportional rather than fixed, because it has to do two jobs
# at once and the two images that need it have checkerboards of very different
# brightness:
#
#   tones 255/202, a headlamp beam   darkest sample 228, i.e. 27 from 255
#   tones 148/114, a burning fuse    halo band 180-208, i.e. up to 60 from 148
#
# A fixed 35 catches the first and leaves the second as a ring of surviving
# checker squares around the spark; a fixed 60 catches both but, on the dark
# checkerboard, also reaches the spark ITSELF at 255 and deletes it.
#
# Scaled to the tone, the same number does both: 0.45 x 148 = 67 removes the
# halo and stops well short of the 255 spark, while 0.45 x 255 = 115 comfortably
# covers the beam. The cap is what protects bright artwork — anything much
# brighter than the paper it is printed on is light, not lit paper.
TINT_TONE_FRACTION = 0.45
TINT_TONE_MIN = 35
# 0.80 WITH A NEUTRALITY GUARD WAS TRIED AND REVERTED.
#
# Widening the ceiling to reach a strongly lit checker reaches the light source
# too, so the wider version came with a guard that kept near-white pixels. It
# made both test images worse, not better: on the dynamite it ate the tan fuse
# arc and left the spark floating detached, and on the miner the headlamp beam
# came back as a solid block of checkerboard beside his head.
#
# The lesson is that the ceiling and the guard interact — loosening one to fix
# one image quietly re-opened the other. 0.45 is what both images agree on.
# Opaque islands smaller than this share of the largest one are dropped. A cut
# out prop is one object; a detached scrap is the part of a soft edge — smoke,
# spray — that happened to survive, and it reads as damage.
ISLAND_MIN_SHARE = 0.02
# An enclosed pocket of checkerboard must be at least this many pixels, and must
# contain BOTH tones, before it is removed. See remove_pockets.
POCKET_MIN = 40
POCKET_TONE_SHARE = 0.2


def _far(a, b):
    """Largest per-channel difference between two colours."""
    return max(abs(a[0] - b[0]), abs(a[1] - b[1]), abs(a[2] - b[2]))


def detect_tones(img, band=6):
    """The two commonest colours around the border, as RGB triples.

    No chroma filter: the checker may be tinted, and whatever the border is
    mostly made of IS the checker — the subject does not reach the edge of a
    render that was asked for on a transparent background. The two are required
    to be far apart so a single tone's JPEG noise cannot be mistaken for two.
    """
    from collections import Counter

    px = img.load()
    w, h = img.size
    seen = Counter()
    for x in range(w):
        for y in list(range(band)) + list(range(h - band, h)):
            seen[px[x, y][:3]] += 1
    for y in range(h):
        for x in list(range(band)) + list(range(w - band, w)):
            seen[px[x, y][:3]] += 1
    tones = []
    for value, _ in seen.most_common():
        if all(_far(value, t) > TONE_TOLERANCE * 2 for t in tones):
            tones.append(value)
        if len(tones) == 2:
            break
    return tones


def cut(img):
    rgb = img.convert("RGB")
    w, h = rgb.size
    px = rgb.load()
    tones = detect_tones(rgb)
    if len(tones) < 2:
        raise SystemExit(f"expected two checker tones, found {tones}")

    def tone_of(p):
        """Which checker tone this pixel sits on, or None.

        Plain per-channel distance to the measured triples. Green is allowed to
        run brighter than the tone by CAST_MAX, which is what a coloured light
        in the artwork does to the checkerboard behind it.
        """
        r, g, b = p[:3]
        for t in tones:
            if abs(r - t[0]) > TONE_TOLERANCE or abs(b - t[2]) > TONE_TOLERANCE:
                continue
            if g < t[1] - TONE_TOLERANCE or g > t[1] + CAST_MAX:
                continue
            return t
        return None

    brightest = max(max(t) for t in tones)
    tint_tolerance = max(TINT_TONE_MIN, brightest * TINT_TONE_FRACTION)

    def is_tinted_checker(p):
        """Checkerboard with a coloured light falling on it. See GLOW_FLOOR."""
        if min(p[:3]) < GLOW_FLOOR:
            return False
        return any(abs(max(p[:3]) - max(t)) <= tint_tolerance for t in tones)

    def is_checker(p):
        return tone_of(p) is not None or is_tinted_checker(p)

    outside = bytearray(w * h)
    q = deque()

    def seed(x, y):
        i = y * w + x
        if outside[i] or not is_checker(px[x, y]):
            return
        outside[i] = 1
        q.append((x, y))

    for x in range(w):
        seed(x, 0)
        seed(x, h - 1)
    for y in range(h):
        seed(0, y)
        seed(w - 1, y)

    # Flooded, not keyed globally: the lever is steel and would pass the colour
    # test on its own, but it is enclosed by the subject's outline and the flood
    # never reaches it.
    while q:
        x, y = q.popleft()
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            nx, ny = x + dx, y + dy
            if not (0 <= nx < w and 0 <= ny < h):
                continue
            i = ny * w + nx
            if outside[i] or not is_checker(px[nx, ny]):
                continue
            outside[i] = 1
            q.append((nx, ny))

    # POCKETS THE BORDER CANNOT REACH.
    #
    # The flood enters from the edges, so background enclosed by the subject —
    # the gap between an arm and the body, the space inside a bent elbow — is
    # never visited and stays opaque. On this character it left a white slab
    # under one arm.
    #
    # Removing every leftover checker-coloured pixel would be wrong: the artwork
    # has its own near-white highlights on the vials and the blade, and they sit
    # squarely on the 255 tone. What separates a pocket from a highlight is that
    # a pocket is CHECKERED — it contains both tones, alternating. A highlight is
    # one tone. So a component is removed only if both tones are well
    # represented in it, which no flat highlight ever manages.
    def remove_pockets():
        seen = bytearray(w * h)
        removed = 0
        for sy in range(h):
            for sx in range(w):
                i0 = sy * w + sx
                if seen[i0] or outside[i0] or not is_checker(px[sx, sy]):
                    continue
                comp = []
                stack = [(sx, sy)]
                seen[i0] = 1
                # Tinted pixels belong to no tone. They still count toward the
                # component's size, just not toward the both-tones test.
                counts = {t: 0 for t in tones}
                counts[None] = 0
                while stack:
                    x, y = stack.pop()
                    comp.append((x, y))
                    counts[tone_of(px[x, y])] += 1
                    for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                        nx, ny = x + dx, y + dy
                        if not (0 <= nx < w and 0 <= ny < h):
                            continue
                        j = ny * w + nx
                        if seen[j] or outside[j] or not is_checker(px[nx, ny]):
                            continue
                        seen[j] = 1
                        stack.append((nx, ny))
                if len(comp) < POCKET_MIN:
                    continue
                if min(counts[t] for t in tones) / len(comp) < POCKET_TONE_SHARE:
                    continue  # one tone only: a highlight, not a pocket
                for x, y in comp:
                    outside[y * w + x] = 1
                removed += 1
        return removed

    pockets = remove_pockets()

    def drop_islands():
        """Keep the object; drop the scraps.

        A soft edge that fades into the background — smoke, spray, a glow's
        outer falloff — comes back as a handful of disconnected fragments once
        the flood has eaten the middle of it. On this prop it left a broken arc
        of smoke floating above the bundle, which reads as damage rather than as
        smoke. Anything under ISLAND_MIN_SHARE of the biggest island goes.
        """
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
        if not islands:
            return 0
        biggest = max(len(c) for c in islands)
        dropped = 0
        for comp in islands:
            if len(comp) >= biggest * ISLAND_MIN_SHARE:
                continue
            for x, y in comp:
                outside[y * w + x] = 1
            dropped += 1
        return dropped

    islands = drop_islands()

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
    return out, tones, pockets, islands


def trim(img, pad=8):
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
    pad = int(sys.argv[sys.argv.index("--pad") + 1]) if "--pad" in sys.argv else 8

    img = Image.open(src)
    img.load()
    cutout, tones, pockets, islands = cut(img)
    out = trim(cutout, pad)

    opaque = sum(1 for v in out.getchannel("A").get_flattened_data() if v > 200)
    share = opaque / (out.width * out.height)
    print(f"{os.path.basename(src)} {img.width}x{img.height} -> "
          f"{os.path.basename(dest)} {out.width}x{out.height}")
    print(f"  checker tones detected: {tones}")
    print(f"  enclosed pockets removed: {pockets}")
    print(f"  detached scraps dropped:  {islands}")
    print(f"  {share * 100:.1f}% of the result is opaque")

    # Same guard as cut_prop: refuse to ship an implausible cut rather than leave
    # a broken prop in the game.
    if not 0.25 <= share <= 0.85:
        print("REFUSED: outside the plausible band for a trimmed cut-out. "
              "Nothing written.")
        sys.exit(2)

    out.save(dest, "PNG", optimize=True)
    print(f"  {os.path.getsize(dest) / 1024:.0f} KB")


if __name__ == "__main__":
    main()
