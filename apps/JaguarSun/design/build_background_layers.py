#!/usr/bin/env python3
"""Cut the near-camera band out of each background so it can move on its own.

    python design/build_background_layers.py [--install]

The backgrounds are one flat plate, so the whole picture drifts as a block —
which is not parallax, it is a slow pan. Depth needs the thing CLOSE to camera
to travel further than the thing behind it, and the round-2 art finally has
something close to camera: the yacht deck on the right.

There is no layered source, so the near band is cut from the plate itself: the
right NEAR_FRACTION of the image, full height, drawn back over the plate at a
larger drift. It covers its own original — the crop starts inside the dark empty
middle, well left of the deck, so the seam has nothing to sit on and the copy
underneath is hidden by the copy on top.

That constraint is why the crop is generous rather than tight to the railing: it
has to keep covering the original as it slides.
"""
from __future__ import annotations
import argparse, os, sys
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'static/assets/sprites/hotMiamiBackground')
# From x = 64% to the right edge. The deck starts around 69%, so there is 5% of
# dark plate in front of it — about 96px at 1920, which is far more than the
# +-14px the near layer ever travels.
NEAR_FRACTION = 0.36


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument('--install', action='store_true')
    args = ap.parse_args()
    for name in ('bg_base.png', 'bg_feature.png', 'bg_epic.png'):
        im = Image.open(os.path.join(SRC, name)).convert('RGB')
        x0 = int(im.width * (1 - NEAR_FRACTION))
        near = im.crop((x0, 0, im.width, im.height))
        out = os.path.join(SRC, name.replace('.png', '_near.png'))
        if args.install:
            near.save(out)
            print(f'   wrote {os.path.relpath(out, ROOT)}  {near.size}')
        else:
            print(f'   would write {os.path.relpath(out, ROOT)}  {near.size}')
    return 0


if __name__ == '__main__':
    sys.exit(main())
