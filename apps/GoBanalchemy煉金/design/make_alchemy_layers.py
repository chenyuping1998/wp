"""Go Banalchemy's winning symbols split into PLATE + SUBJECT layers, so the
subject itself leaps, flips and squashes on a plate that stays put (the user,
2026-10-04: 「獎圖動態不要整個格子跳動，而是圖案本身跳動」). The Boat method
(wp/.claude/skills/mesh-cast-rig, "The same method on reel SYMBOLS").

For h1-h4 and l1-l5 it writes, at 512px, to goBanalchemyMesh/:

    {n}_plate.png    the tile with the subject lifted off it (the hole filled)
    {n}_subject.png  the subject alone: what the mesh deforms
    {n}_shadow.png   a soft dark silhouette (128px), laid on the plate under the
                     subject while it is in the air

and for the Scatter, whose medallion already stands on transparency: s_subject
(the art itself), a fully transparent s_plate and its shadow. The Wild (a
portrait filling its tile) cannot be cut and stays a panel.

HOW A SUBJECT IS FOUND.
  · slate tiles (h1-h4): the slate is dark navy — red near 0, blue over red,
    lum < 75. A hand HULL per symbol (the rigs' 256 canvas) bounds the search;
    slate-like pixels reachable from outside the hull are plate, the rest is
    subject. A LARGE enclosed slate pocket (the window inside the lantern's
    guard, between the cart's flasks) goes back to the plate too: the
    background showing through must not ride along with the subject.
  · porcelain tiles (l1-l5): the ink is the only dark thing; the subject is the
    dark letter grown by its bevel.

THE PLATE UNDER IT: low frequencies from a push-pull fill of the hole's rim,
high frequencies (grain, veins) from the other tiles of the same kind at the
same position, where their own subjects do not cover it.

Usage: python design/make_alchemy_layers.py
"""
from __future__ import annotations

from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from scipy import ndimage as ndi

APP = Path(__file__).resolve().parents[1]
SRC = APP / 'static/assets/sprites/goBanalchemySymbols'
import os
OUT = Path(os.environ['LAYERS_OUT']) if os.environ.get('LAYERS_OUT') else APP / 'static/assets/sprites/goBanalchemyMesh'
OUT.mkdir(parents=True, exist_ok=True)

SIZE = 512
K = SIZE / 256

# hulls in the 256 canvas (generous: the colour test does the real cut)
HULLS = {
    'h1': [(92, 6), (164, 6), (170, 30), (206, 40), (210, 190), (188, 196), (188, 242), (68, 242), (66, 196), (46, 190), (50, 40), (86, 30)],
    'h2': [(32, 104), (36, 40), (98, 52), (128, 2), (154, 32), (208, 32), (224, 96), (210, 150), (206, 232), (50, 232), (48, 150)],
    'h3': [(22, 20), (60, 14), (96, 70), (140, 100), (160, 60), (190, 20), (232, 22), (234, 70), (190, 110), (166, 132), (226, 196), (220, 224), (192, 222), (140, 160), (110, 190), (80, 226), (36, 222), (30, 168), (66, 140), (96, 128), (70, 90), (24, 70)],
    'h4': [(22, 84), (48, 30), (114, 10), (150, 10), (216, 24), (238, 82), (232, 114), (234, 204), (150, 234), (30, 206)],
    'l1': [(40, 40), (176, 40), (216, 176), (216, 204), (40, 204)],
    'l2': [(44, 40), (208, 40), (212, 204), (44, 204)],
    'l3': [(68, 40), (190, 40), (208, 170), (208, 202), (68, 202)],
    'l4': [(52, 42), (204, 42), (204, 202), (52, 202)],
    'l5': [(44, 42), (212, 42), (212, 202), (44, 202)],
}
# regions where the subject is SOLID: the repaint (2026-10-15) fills the
# lantern's glass with dark swirls the slate test reads as background pockets,
# which left holes in the elixir. Holes inside these ellipses go back to the
# subject. (cx, cy, rx, ry) in the 256 canvas.
SOLID = {'h1': (130, 123, 47, 44)}
SLATE = ['h1', 'h2', 'h3', 'h4']
LETTERS = ['l1', 'l2', 'l3', 'l4', 'l5']
INNER = 10 * K   # the copper frame and its rim never belong to a subject


def read(n):
    return np.asarray(Image.open(SRC / f'{n}.png').convert('RGBA').resize((SIZE, SIZE), Image.LANCZOS), np.float32)


def save(n, rgba):
    Image.fromarray(np.clip(rgba, 0, 255).astype(np.uint8), 'RGBA').save(OUT / n, optimize=True)


def hull_mask(pts):
    im = Image.new('L', (SIZE, SIZE), 0)
    ImageDraw.Draw(im).polygon([(x * K, y * K) for x, y in pts], fill=255)
    return np.asarray(im) > 0


def grow(m, r):
    return ndi.binary_dilation(m, iterations=r)


def slate_subject(rgb, hull):
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    lum = (r + g + b) / 3
    slate = (lum < 75) & (r < 45) & (b > r + 15)
    yy, xx = np.mgrid[0:SIZE, 0:SIZE]
    band = (xx < INNER) | (yy < INNER) | (xx >= SIZE - INNER) | (yy >= SIZE - INNER)
    lab, n = ndi.label(slate | ~hull | band)
    outside = set(np.unique(lab[~hull | band])) - {0}
    plate = np.isin(lab, list(outside))
    # large slate pockets enclosed by the subject: background, not subject
    plab, pn = ndi.label(slate & ~plate)
    if pn:
        sizes = ndi.sum(np.ones_like(plab), plab, range(1, pn + 1))
        for i, s in enumerate(sizes, 1):
            if s > 260:
                plate |= plab == i
    subj = hull & ~plate & ~band
    subj = ndi.binary_opening(subj, iterations=1)
    # drop specks; keep everything big
    lab, n = ndi.label(subj)
    if n:
        sizes = ndi.sum(subj, lab, range(1, n + 1))
        subj = np.isin(lab, [i + 1 for i, s in enumerate(sizes) if s > 120])
    # the subject's own dark outline: dark px hugging it
    ring = grow(subj, 3) & ~subj & (lum < 40) & hull & ~band
    return subj | ring


def letter_subject(rgb, hull):
    lum = rgb[..., :3].mean(-1)
    ink = (lum < 120) & hull
    lab, n = ndi.label(ink)
    sizes = ndi.sum(ink, lab, range(1, n + 1))
    ink = np.isin(lab, [i + 1 for i, s in enumerate(sizes) if s > 400])
    # the bevel round the engraving: light rim and its shade
    return grow(ink, 9) & hull


def push_pull(rgb, known):
    """fill unknown px from the known ones, coarse to fine"""
    levels = []
    c, w = rgb * known[..., None], known.astype(np.float32)
    while min(w.shape) > 4:
        levels.append((c, w))
        h, wd = (w.shape[0] + 1) // 2 * 2, (w.shape[1] + 1) // 2 * 2
        c = np.pad(c, ((0, h - c.shape[0]), (0, wd - c.shape[1]), (0, 0)))
        w = np.pad(w, ((0, h - w.shape[0]), (0, wd - w.shape[1])))
        c = c.reshape(h // 2, 2, wd // 2, 2, 3).sum((1, 3))
        w = w.reshape(h // 2, 2, wd // 2, 2).sum((1, 3))
    est = c / np.maximum(w, 1e-6)[..., None]
    for c, w in reversed(levels):
        up = np.repeat(np.repeat(est, 2, 0), 2, 1)[: w.shape[0], : w.shape[1]]
        up = ndi.uniform_filter(up, size=(3, 3, 1))
        a = np.clip(w, 0, 1)[..., None]
        est = (c / np.maximum(w, 1e-6)[..., None]) * a + up * (1 - a)
    return est


def highpass(rgb):
    return rgb - ndi.gaussian_filter(rgb, sigma=(4, 4, 0))


def build(group, finder):
    arts = {n: read(n) for n in group}
    masks = {n: finder(arts[n][..., :3], hull_mask(HULLS[n])) for n in group}
    yy, xx = np.mgrid[0:SIZE, 0:SIZE] / K
    for n, (cx, cy, rx, ry) in SOLID.items():
        if n in masks:
            inside = ((xx - cx) / rx) ** 2 + ((yy - cy) / ry) ** 2 <= 1
            masks[n] = masks[n] | (ndi.binary_fill_holes(masks[n]) & inside)
    # donors also include the dynamite tile for the slate (same slate)
    donors = dict(arts)
    dmask = dict(masks)
    if group is SLATE:
        bb = read('b')
        donors['b'] = bb
        dmask['b'] = slate_subject(bb[..., :3], hull_mask([(26, 18), (230, 18), (230, 210), (26, 210)]))
    for n in group:
        rgb = arts[n][..., :3]
        lum = rgb.mean(-1)
        if group is SLATE:
            r, g, bl = rgb[..., 0], rgb[..., 1], rgb[..., 2]
            # CLEAN slate is navy: green well under blue. The subjects' painted
            # glow (cyan round the tongs, green round the lantern, violet round
            # the crystal) passes the subject test as slate but not this one, and
            # left on the plate it was a ghost of the subject when it leapt.
            clean = (r < 30) & (g < 0.5 * bl + 8) & (lum < 70) & (lum > 18)
            hole = grow(masks[n], 3) | (grow(masks[n], 34) & ~clean)
            hole = ndi.binary_fill_holes(ndi.binary_closing(hole, iterations=4))
            known = ~hole & clean
        else:
            hole = grow(masks[n], 4)
            # porcelain only: not the ink, not the bevel's shade
            known = ~grow(hole, 3) & (lum > 170)
        base = push_pull(rgb, known)
        if group is SLATE:
            # deep inside a big hole the rim's tone (the subject's contact shade)
            # would fill a black blob: blend toward the tile's own clean slate
            depth = ndi.distance_transform_edt(hole)
            mean = rgb[known].mean(0)
            w = np.clip(depth / 36, 0, 0.85)[..., None]
            base = base * (1 - w) + mean * w
        hf = np.zeros_like(rgb)
        filled = np.zeros(hole.shape, bool)
        for d, art in donors.items():
            if d == n:
                continue
            # a letter's bevel shade reaches well past its ink: keep a wider
            # berth, or the donor's letter shows as a ghost on the plate
            use = hole & ~filled & ~grow(dmask[d], 3 if group is SLATE else 14)
            hf[use] = highpass(art[..., :3])[use]
            filled |= use
        plate = rgb.copy()
        fill = np.clip(base + hf, 0, 255)
        # feather the fill's edge into the original over a few px
        soft = ndi.gaussian_filter(hole.astype(np.float32), 1.5)
        soft = np.maximum(soft, hole)[..., None]
        plate = plate * (1 - soft) + fill * soft
        a = arts[n][..., 3:4]
        save(f'{n}_plate.png', np.concatenate([plate, a], -1))
        # the subject: its own pixels, alpha feathered by half a px
        alpha = ndi.gaussian_filter(masks[n].astype(np.float32), 0.6)
        alpha = np.where(masks[n], 1.0, alpha * 0.9) * (a[..., 0] / 255)
        sub = np.concatenate([rgb * (alpha[..., None] > 0), alpha[..., None] * 255], -1)
        save(f'{n}_subject.png', sub)
        shadow(n, alpha)
        print(n, 'subject px', int(masks[n].sum()), 'hole filled by donors', f'{filled.sum() / max(1, hole.sum()):.0%}')


def shadow(n, alpha):
    sil = ndi.gaussian_filter(alpha, 7)
    sh = np.zeros((SIZE, SIZE, 4), np.float32)
    sh[..., 3] = np.clip(sil * 1.2, 0, 1) * 255
    Image.fromarray(sh.astype(np.uint8), 'RGBA').resize((128, 128), Image.LANCZOS).save(OUT / f'{n}_shadow.png', optimize=True)


def scatter():
    s = read('s')
    save('s_subject.png', s)
    save('s_plate.png', np.zeros_like(s))
    shadow('s', s[..., 3] / 255)
    print('s: the medallion is its own subject; transparent plate')


if __name__ == '__main__':
    build(SLATE, slate_subject)
    build(LETTERS, letter_subject)
    scatter()
