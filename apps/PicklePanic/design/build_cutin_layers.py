"""Cut the FG chop cut-in (upgrade_cutin.png) into three layers so the chef can
actually move while she chops the royals (user 2026-10-16:
「我要 FG 砍圖騰的時候角色也有動態」). Before this the card was one static
punch drawing that only slid and tilted as a whole.

    arm     the punching arm, shoulder to fist — swings about SHOULDER
    sparks  the three yellow shards under the fist — pop on the hit
    body    everything else; the trunk is extended under the arm's inner edge
            (UNDERLAY px, nearest-colour fill) so the joint never opens when the
            arm turns. Same lesson as the cast trunks: the underlay stays at the
            joint, it does not run down the arm.

All three keep the 768x768 canvas, so they stack with the same anchor.

    /Applications/anaconda3/bin/python3 design/build_cutin_layers.py
"""
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage

APP = Path(__file__).resolve().parents[1]
SRC = APP / 'static/assets/pickle/upgrade_cutin.png'
OUT = APP / 'static/assets/pickle'

# Everything left of the arm/trunk seam and above the shards is arm: the seam
# runs from the shoulder cap down the trunk's left contour to the apron corner.
ARM = [(0, 262), (300, 262), (360, 276), (410, 296), (408, 350), (392, 410), (372, 460), (352, 505),
       (345, 545), (326, 596), (316, 660), (0, 660)]
# The shards are picked by colour inside this band (yellow / cream), then grown a
# few px to take their ink outline; the green under them stays with the fist.
SPARK_BAND = [(0, 596), (330, 596), (318, 660), (300, 768), (0, 768)]
SHOULDER = (365, 315)  # pivot, also written into BanditMeter.svelte
UNDERLAY = 60


def mask(poly, size):
    m = Image.new('L', size, 0)
    ImageDraw.Draw(m).polygon(poly, fill=255)
    return np.array(m) > 127


def main():
    im = np.array(Image.open(SRC).convert('RGBA'))
    H, W = im.shape[:2]
    opaque = im[:, :, 3] > 8
    band = mask(SPARK_BAND, (W, H)) & opaque
    r, g, b = (im[:, :, k].astype(int) for k in range(3))
    yellow = band & (r > 170) & (g > 140) & (b < 190) & (r > b + 40)
    sparks = band & (ndimage.binary_dilation(yellow, iterations=9) | (band & (np.mgrid[0:H, 0:W][0] > 650)))
    sparks &= ~((g > r + 15) & (g > b + 15))  # fist green under the shards stays with the arm
    rows = np.mgrid[0:H, 0:W][0]
    sparks &= yellow | (rows >= 612)  # outline pickup never bites into the knuckles
    arm = mask(ARM, (W, H)) & opaque & ~sparks
    # the shards' long outline strokes reach in under the fist: anything not
    # joined to the arm's main body belongs to the shards
    lab, n = ndimage.label(arm)
    if n > 1:
        sizes = ndimage.sum(arm, lab, range(1, n + 1))
        main_id = 1 + int(np.argmax(sizes))
        stray = arm & (lab != main_id)
        sparks |= stray & (rows >= 560)
        arm &= ~stray | (rows < 560)
    body = opaque & ~arm & ~sparks
    # islands left in the body (shard outline tips under the fist) would show the
    # moment the arm moves: they go to the shards
    lab, n = ndimage.label(body)
    if n > 1:
        sizes = ndimage.sum(body, lab, range(1, n + 1))
        tiny = np.isin(lab, 1 + np.nonzero(sizes < sizes.max() * 0.02)[0])
        sparks |= tiny
        body &= ~tiny

    # body underlay: trunk colour carried a short way in under the arm's inner
    # edge (pixels of the arm within UNDERLAY of the body), nearest-pixel fill
    dist, (iy, ix) = ndimage.distance_transform_edt(~body, return_indices=True)
    # only up at the shoulder/chest: lower down it showed as a dark strip by the
    # apron when the fist pulled back
    grow = arm & (dist <= UNDERLAY) & (np.mgrid[0:H, 0:W][0] < 500)
    body_rgba = np.zeros_like(im)
    body_rgba[body] = im[body]
    body_rgba[grow] = im[iy[grow], ix[grow]]
    body_rgba[grow, 3] = 255

    def layer(m):
        out = np.zeros_like(im)
        out[m] = im[m]
        # keep the soft anti-aliased rim the polygon cut through
        rim = ndimage.binary_dilation(m, iterations=1) & ~m & (im[:, :, 3] > 0)
        out[rim] = im[rim]
        return out

    Image.fromarray(layer(arm)).save(OUT / 'upgrade_cutin_arm.png')
    Image.fromarray(layer(sparks)).save(OUT / 'upgrade_cutin_sparks.png')
    Image.fromarray(body_rgba).save(OUT / 'upgrade_cutin_body.png')
    print(f'arm {int(arm.sum())} px, sparks {int(sparks.sum())} px, body {int(body.sum())} px + underlay {int(grow.sum())} px')


if __name__ == '__main__':
    main()
