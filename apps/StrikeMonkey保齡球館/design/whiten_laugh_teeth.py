"""Make the laugh faces read as a toothy grin.

The redrawn laugh heads (design/redraw/v1/*_laugh_generated.png, aligned into
design/source/<cast>/head_2_face_laugh_*.png) already paint an upper row of
teeth inside the open mouth - but in the same cream as the eye whites, only a
touch lighter than the muzzle (b ~212 vs ~176). At game size it reads as skin,
so the laugh looks like an open mouth with a tongue and no teeth.

This finds that pale band (the pale component touching the mouth cavity, which
is the dark blob next to the tongue - so the eye whites are never touched) and
lifts it to clean white, with the cavity edge under it kept as ink.

Idempotent: originals are copied once to design/source/_pre_teeth/<cast>/ and
every run starts from them. Re-run after redraw_cast_build.py rewrites the
faces, then regenerate the Spine:

    python design/whiten_laugh_teeth.py
    CAST=mg node design/generate_monkey_spine.mjs E:/stake/tools/gen   (and fg)
"""
import shutil
import sys
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage as nd

ROOT = Path(__file__).resolve().parent / 'source'
BACKUP = ROOT / '_pre_teeth'
FACES = ['laugh_1', 'laugh_2', 'laugh_3', 'laugh_4', 'laugh_3_blink', 'laugh_4_blink']
# The Bowler's band is already thick enough; only the Pinsetter's needs growing.
MIN_TEETH = {'mg': 0, 'fg': 6}
WHITE = np.array([255, 255, 251], float)


def mouth_cavity(a):
    r, g, b, al = (a[..., i] for i in range(4))
    lum = (r * 3 + g * 6 + b) / 10
    dark = nd.binary_opening((lum < 70) & (al > 200), iterations=2)
    tongue = (r > 170) & (g < 140) & (b < 140) & (r - g > 60) & (al > 200)
    tl, n = nd.label(tongue)
    if not n:
        return None
    sizes = nd.sum(tongue, tl, range(1, n + 1))
    tongue = tl == (int(np.argmax(sizes)) + 1)
    near = nd.binary_dilation(tongue, iterations=3)
    lab, k = nd.label(dark)
    best, best_n = None, 0
    for i in range(1, k + 1):
        m = lab == i
        hit = (m & near).sum()
        if hit > best_n:
            best, best_n = m, hit
    return best


def whiten(src, dst, min_teeth):
    a = np.array(Image.open(src).convert('RGBA')).astype(float)
    cav = mouth_cavity(a)
    if cav is None:
        raise SystemExit(f'no mouth found in {src}')
    r, g, b, al = (a[..., i] for i in range(4))
    pale = (b >= 192) & (r >= 232) & (g >= 222) & (al > 200)
    lab, k = nd.label(pale)
    touch = nd.binary_dilation(cav, iterations=3)
    ys, xs = np.nonzero(cav)
    keep = np.zeros_like(pale)
    for i in range(1, k + 1):
        m = lab == i
        if not (m & touch).any():
            continue
        # teeth sit on top of the cavity; a pale fleck below its middle is a
        # highlight on the lip or tongue, not a tooth
        my = np.nonzero(m)[0].mean()
        if my > (ys.min() + ys.max()) / 2:
            continue
        keep |= m
    if keep.sum() < 60:
        # a nearly closed laugh drawing has no teeth showing; leave it as drawn
        shutil.copy2(src, dst)
        return 0
    # A band thinner than MIN_TEETH px (the Pinsetter's) vanishes at game size;
    # grow it down into the cavity, column by column, so the dark under it
    # stays as the line between the teeth and the mouth.
    cols = np.nonzero(keep.any(axis=0))[0]
    top = np.array([np.nonzero(keep[:, x])[0].min() for x in cols], float)
    bot = np.array([np.nonzero(keep[:, x])[0].max() for x in cols], float)
    grow = min_teeth - np.median(bot - top + 1)
    if grow > 0:
        # one smooth lower edge for the whole row: the painted edge, averaged
        # over 7 columns (it is anti-aliased, so it steps), then pushed down.
        # Per-column growth gives icicles.
        k = np.ones(7) / 7
        pad = np.pad(bot, 3, mode='edge')
        edge = np.convolve(pad, k, mode='valid') + grow
        # taper to the painted edge at both corners of the mouth
        n = len(cols)
        ramp = np.minimum(1, np.minimum(np.arange(n), np.arange(n)[::-1]) / 4)
        edge = bot + (edge - bot) * ramp
        # the opened cavity mask misses its anti-aliased rim, which left dark
        # stripes through the grown teeth; growth only needs "is it mouth-dark"
        lum = (r * 3 + g * 6 + b) / 10
        inside = (lum < 110) & (al > 200)
        grown = keep.copy()
        for x, y0, y1 in zip(cols, bot, edge):
            for y in range(int(y0) + 1, int(round(y1)) + 1):
                # leave at least 2px of cavity under the teeth as the line
                if y + 2 < keep.shape[0] and inside[y, x] and inside[y + 2, x]:
                    grown[y, x] = True
        keep = grown
    # soft edge: anti-aliased rim pixels go part of the way, so the band keeps
    # the painter's line instead of getting a hard pixel stair
    zone = nd.binary_dilation(keep, iterations=1) & ~cav
    t = np.clip((b - 172) / 28, 0, 1) * zone
    t = np.maximum(t, keep.astype(float))
    for c in range(3):
        a[..., c] = a[..., c] * (1 - t) + WHITE[c] * t
    Image.fromarray(a.round().clip(0, 255).astype(np.uint8)).save(dst)
    return int(keep.sum())


def main():
    casts = sys.argv[1:] or ['mg', 'fg']
    for cast in casts:
        (BACKUP / cast).mkdir(parents=True, exist_ok=True)
        for face in FACES:
            cur = ROOT / cast / f'head_2_face_{face}.png'
            orig = BACKUP / cast / cur.name
            if not orig.exists():
                shutil.copy2(cur, orig)
            n = whiten(orig, cur, MIN_TEETH[cast])
            print(f'{cast} {face}: {n} px of teeth')


if __name__ == '__main__':
    main()
