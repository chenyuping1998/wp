# -*- coding: utf-8 -*-
"""
Pull a character off a flat background and give it a real alpha channel.

    python rig/dekey.py character.jpg [-o out.png] [--tol 18] [--feather 1.4]

This is a rescue, not a preferred path. Ask for a transparent PNG when you can:
a flattened JPEG has already thrown away the edge, and everything below is
estimating what used to be there.

Three things it gets right that a threshold does not:

**White inside the figure survives.** The background is found by flooding from
the image border, not by "this pixel is white". A threshold punches holes
through white shoes and a white t-shirt -- exactly what this character has.

**The edge is not a hard cut.** A binary mask leaves stair-steps that the mesh
then rotates, and stair-steps that move read as crawling. The mask is blurred by
`--feather` px so the boundary gets partial alpha, the way anti-aliased art
originally had it.

**The white halo is removed.** An anti-aliased edge pixel is a mix of the art
and the background it was flattened onto: `c = a*F + (1-a)*bg`. Keeping `c` and
just adding alpha leaves every edge too light -- a pale rim all round the figure
that is very visible against a dark game background. Solving for `F` puts the
real colour back.
"""
from __future__ import print_function
import argparse
import os
import sys

import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage


def dekey(path, tol=18, feather=1.4, bg=None):
    im = Image.open(path).convert('RGB')
    A = np.asarray(im).astype(np.float64)
    H, W, _ = A.shape
    if bg is None:
        corners = [A[0, 0], A[0, -1], A[-1, 0], A[-1, -1]]
        bg = np.median(np.stack(corners), 0)

    near = np.abs(A - bg).max(2) <= tol

    # background = the part of `near` connected to the border. Anything else
    # that happens to be this colour is part of the character.
    lab, n = ndimage.label(near)
    border = set(lab[0].tolist()) | set(lab[-1].tolist()) \
        | set(lab[:, 0].tolist()) | set(lab[:, -1].tolist())
    border.discard(0)
    back = np.zeros_like(near)
    for i in border:
        back |= lab == i
    inner = int(near.sum() - back.sum())

    alpha = Image.fromarray(((~back) * 255).astype('uint8'), 'L')
    if feather:
        alpha = alpha.filter(ImageFilter.GaussianBlur(feather))
    a = np.asarray(alpha).astype(np.float64) / 255.0

    # un-matte: c = a*F + (1-a)*bg  ->  F = (c - (1-a)*bg) / a
    a3 = a[..., None]
    F = np.where(a3 > 0.02, (A - (1 - a3) * bg) / np.maximum(a3, 0.02), A)
    F = np.clip(F, 0, 255)

    out = np.dstack([F, a * 255]).astype('uint8')
    return Image.fromarray(out, 'RGBA'), dict(bg=tuple(bg.astype(int)),
                                              background_px=int(back.sum()),
                                              interior_same_colour=inner,
                                              size=(W, H))


if __name__ == '__main__':
    import sys as _sys
    for _s in (_sys.stdout, _sys.stderr):  # Windows 的管線預設 cp950，agent 讀到會是亂碼
        if hasattr(_s, 'reconfigure'):
            _s.reconfigure(encoding='utf-8', errors='replace')
    ap = argparse.ArgumentParser()
    ap.add_argument('image')
    ap.add_argument('-o', '--out')
    ap.add_argument('--tol', type=int, default=18)
    ap.add_argument('--feather', type=float, default=1.4)
    a = ap.parse_args()
    img, info = dekey(a.image, a.tol, a.feather)
    out = a.out or os.path.splitext(a.image)[0] + '_cut.png'
    img.save(out)
    print('background #%02X%02X%02X, %.1f%% of the image'
          % (info['bg'] + (100.0 * info['background_px'] / (info['size'][0] * info['size'][1]),)))
    print('%d px of the same colour INSIDE the figure were kept '
          '(white shoes, t-shirt, highlights)' % info['interior_same_colour'])
    print('wrote %s' % out)
