"""Split the supplied character PSD into one trimmed PNG per body part.

    py -3 design/extract_monkey_psd.py "<path to spine-pieces-project-2.psd>"

Writes design/source/monkey/*.png plus layers.json, which records each piece's
position on the original 560x912 canvas. generate_monkey_spine.mjs reads that
file to place the attachments, so the rig inherits the artist's own layout
instead of anything being eyeballed here.

Needs psd-tools:  py -3 -m pip install psd-tools

Two things about this PSD that the obvious version of this script gets wrong:

  · Every layer carries a residual alpha of 1-11 across the whole canvas -
    invisible when composited, but enough that a naive bounding box is the full
    560x912 for half the layers, and enough to leave a grey haze in the atlas.
    ALPHA_FLOOR discards it.

  · PIL's getbbox() on an RGBA image counts colour under fully transparent
    pixels, so it reports the full canvas even for cleanly keyed layers. The
    bounds have to come from the alpha channel alone.

Five layers in this file (torso 2, head 1/2/3/5 "decoration") contain nothing
but that haze - no pixel above alpha 11 anywhere. They are dropped, and the
script proves nothing was lost by rebuilding the character from the pieces it
kept and writing _compare.png next to the PSD's own flatten.
"""

import json
import os
import re
import sys
from collections import deque

from PIL import Image, ImageChops, ImageFilter
from psd_tools import PSDImage

ALPHA_FLOOR = 12
# A piece smaller than this in either dimension is not artwork. This PSD ships a
# 2x1 "Leftweapon" layer; left in, it becomes a slot and an atlas region for
# something the player can never see.
MIN_PIECE_PX = 8

APP_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(APP_ROOT, 'design', 'source', 'monkey')

# ── FUR PAINTED OVER THE SUIT ────────────────────────────────────────────────
#
# This delivery paints the gorilla's fur ON TOP of the finished spacesuit around
# the hips: black plumes hanging off the bottom of the shorts and down over both
# thighs, plus a dark cap on each thigh. Assembled it reads as a black shadow
# across the character's middle, and it is worse than a cosmetic problem — the
# plumes live on a TORSO layer while hanging over the LEGS, so once the rig moves
# a leg the fur stays behind on the hip.
#
# Removing it is safe here because the fur is painted over art that is already
# complete underneath: take the fur away and a properly drawn belt, waistband and
# fly are sitting there. Nothing has to be invented.
#
# HOW THE FUR IS TOLD FROM EVERYTHING ELSE THAT IS DARK, which is the whole
# problem — this art is line art and its outlines are black too:
#
#   · THICK. A component that survives a 3px erosion is a mass, not a stroke.
#     Outlines are two to four pixels wide and vanish under it.
#   · OFF THE SILHOUETTE. The fur hangs off the piece's edge into transparency.
#     The suit's collar opening is also a big dark mass and must be KEPT, and
#     what separates them is that the collar is fully enclosed by the artwork —
#     the same enclosed-region test the prop dechecker uses on trapped
#     background. Without it this ate a hole through the jacket's neck.
#
# WHY A LIST AND NOT A RULE. Both tests together still catch things they should
# not: run over every torso and leg piece they take 47% of the shoulder badge
# (its dark ring is thick and does reach the patch's edge) and thin the boots'
# outlines. Every statistical discriminator tried — dark fraction, bright
# fraction, component size — either missed the worst piece or flagged the badge.
# So the pieces are named, and the drift that naming a piece invites is caught by
# the audit below rather than by hoping.
DEFUR_PIECES = {'torso_0_decoration', 'left_leg_0_thigh', 'right_leg_0_thigh'}
# Anything else in the suit that looks contaminated is REPORTED, not cleaned. A
# new PSD that moves the fur to a differently-named layer would otherwise ship
# the black band again in silence, which is exactly how the last delivery's
# renamed layers nearly went out.
AUDIT_PREFIXES = ('torso', 'left_leg', 'right_leg')
# Pieces the audit flags that have been LOOKED AT and are correct. Both are the
# false positives the rule was always going to have, and leaving them warning on
# every run is how a warning stops being read:
#   torso_5_decoration  the shoulder badge. Its dark ring is thick and does reach
#                       the patch's outer edge, so it passes both tests. Cleaning
#                       it erases the badge.
#   torso_1_belt        394 opaque pixels in total — a couple of specks. The
#                       fraction is meaningless at that size.
# A piece that starts warning and is NOT on this list is the thing to look at.
AUDIT_REVIEWED = {'torso_5_decoration', 'torso_1_belt'}
DARK_MAX = 56  # below this is "black" for this palette
ERODE = 3  # a stroke is thinner than this; a mass is not


def _fur_components(image):
    """Every dark mass that hangs off the piece's silhouette.

    Returns (mask, removed_px). The mask is feathered, because a hard cut through
    painted fur leaves a stencilled edge that reads as damage.
    """
    w, h = image.size
    lum = image.convert('L')
    alpha = image.getchannel('A')
    dark = ImageChops.multiply(
        lum.point(lambda v: 255 if v < DARK_MAX else 0),
        alpha.point(lambda v: 255 if v > 40 else 0),
    )
    core = dark.filter(ImageFilter.MinFilter(2 * ERODE + 1))
    dp, cp, ap = dark.load(), core.load(), alpha.load()

    seen = [[False] * w for _ in range(h)]
    kill = Image.new('L', (w, h), 0)
    kp = kill.load()
    removed = 0
    for y0 in range(h):
        for x0 in range(w):
            if dp[x0, y0] == 0 or seen[y0][x0]:
                continue
            queue = deque([(x0, y0)])
            seen[y0][x0] = True
            comp = []
            thick = touches = False
            while queue:
                x, y = queue.popleft()
                comp.append((x, y))
                if cp[x, y]:
                    thick = True
                if x == 0 or y == 0 or x == w - 1 or y == h - 1:
                    touches = True
                for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    nx, ny = x + dx, y + dy
                    if not (0 <= nx < w and 0 <= ny < h):
                        continue
                    if ap[nx, ny] <= 40:
                        touches = True
                    if dp[nx, ny] and not seen[ny][nx]:
                        seen[ny][nx] = True
                        queue.append((nx, ny))
            if thick and touches:
                for x, y in comp:
                    kp[x, y] = 255
                removed += len(comp)
    kill = kill.filter(ImageFilter.MaxFilter(3)).filter(ImageFilter.GaussianBlur(1.6))
    return kill, removed


def defur(image):
    kill, removed = _fur_components(image)
    if removed == 0:
        return image, 0
    out = image.copy()
    op, kp = out.load(), kill.load()
    for y in range(out.size[1]):
        for x in range(out.size[0]):
            r, g, b, a = op[x, y]
            if a:
                op[x, y] = (r, g, b, int(a * (1 - kp[x, y] / 255)))
    return out, removed


def main(psd_path: str) -> None:
    os.makedirs(OUT, exist_ok=True)
    for name in os.listdir(OUT):
        if name.endswith('.png'):
            os.remove(os.path.join(OUT, name))

    psd = PSDImage.open(psd_path)
    rebuilt = Image.new('RGBA', (psd.width, psd.height), (0, 0, 0, 0))
    layers = []

    for z, layer in enumerate(psd):
        image = layer.topil()
        if image is None:
            continue
        image = image.convert('RGBA')
        alpha = image.getchannel('A').point(lambda v: 0 if v < ALPHA_FLOOR else v)
        image.putalpha(alpha)

        # layer names are "<part> - <index> - <role>" with a non-ASCII dash
        slug = '_'.join(x.strip() for x in re.split(r'[^\x20-\x7e]+', layer.name) if x.strip())
        slug = slug.replace(' ', '')

        # BEFORE the bounding box is taken, not after: the fur is most of what
        # makes these pieces as large as they are, and trimming first would leave
        # every one of them padded out to the silhouette of art that is no longer
        # in it.
        if slug in DEFUR_PIECES:
            image, cut = defur(image)
            alpha = image.getchannel('A')
            print(f'  de-furred {slug}: removed {cut:,}px')
        elif slug.startswith(AUDIT_PREFIXES) and slug not in AUDIT_REVIEWED:
            _, cut = _fur_components(image)
            opaque = sum(1 for v in alpha.get_flattened_data() if v > 40)
            if opaque and cut / opaque > 0.15:
                print(
                    f'  WARNING {slug} carries a {cut / opaque:.0%} dark mass off its'
                    ' silhouette and is NOT in DEFUR_PIECES — check the hips'
                )

        box = alpha.getbbox()
        if box is None:
            print(f'  dropped (nothing above alpha {ALPHA_FLOOR}): {slug}')
            continue

        bw, bh = box[2] - box[0], box[3] - box[1]
        if bw < MIN_PIECE_PX or bh < MIN_PIECE_PX:
            print(f'  dropped (only {bw}x{bh}px, not artwork): {slug}')
            continue

        ox, oy = layer.offset
        x, y = ox + box[0], oy + box[1]
        piece = image.crop(box)
        piece.save(os.path.join(OUT, f'{slug}.png'))
        rebuilt.alpha_composite(piece, (x, y))
        layers.append(
            {'z': z, 'name': slug, 'file': f'{slug}.png',
             'x': x, 'y': y, 'w': box[2] - box[0], 'h': box[3] - box[1]}
        )
        print(f'{slug:28s} pos=({x:3d},{y:3d}) size={box[2]-box[0]:3d}x{box[3]-box[1]:3d}')

    with open(os.path.join(OUT, 'layers.json'), 'w') as f:
        json.dump({'canvas': [psd.width, psd.height], 'layers': layers}, f, indent=1)

    # Proof that dropping those layers lost nothing: the PSD's own flatten on the
    # left, the same character rebuilt from the kept pieces on the right.
    ground = (18, 22, 10, 255)
    ref = psd.composite().convert('RGBA')
    sheet = Image.new('RGBA', (psd.width * 2 + 20, psd.height), (30, 30, 30, 255))
    sheet.alpha_composite(Image.alpha_composite(Image.new('RGBA', ref.size, ground), ref), (0, 0))
    sheet.alpha_composite(
        Image.alpha_composite(Image.new('RGBA', ref.size, ground), rebuilt), (psd.width + 20, 0)
    )
    sheet.convert('RGB').save(os.path.join(OUT, '_compare.png'))
    print(f'\n{len(layers)} pieces -> {OUT}')


if __name__ == '__main__':
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    main(sys.argv[1])
