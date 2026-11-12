#!/usr/bin/env python3
"""Light the neon in the background art.

    python design/build_background_bloom.py            # write design/_bg + a strip
    python design/build_background_bloom.py --install  # ...and overwrite the shipped PNGs

The delivered backgrounds are flat vector: correct composition, correct values,
and every neon sign is a flat coloured shape with no light coming off it.
Measured against the set they replaced, their edge density is 4.9 against 10-15
— less than half the detail — which is what "flat" means numerically.

A bloom pass is the cheapest way to buy back the difference, and it is the right
one for this art specifically: a neon tube in the real world IS a bright line
plus a halo, and the halo is the only part missing. Extract what is already
bright, blur it wide, and screen it back over the plate. Nothing is repainted;
the drawing stays exactly where it was.

Two passes rather than one, because a single radius reads as fog: a tight one
gives the tube its own edge glow, a wide one gives the scene its atmosphere.

Idempotent by keeping the originals aside on the first run — blooming an
already-bloomed plate compounds and washes the whole image out.
"""
from __future__ import annotations
import argparse, os, shutil, sys
from PIL import Image, ImageFilter, ImageChops

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'static/assets/sprites/hotMiamiBackground')
KEEP = os.path.join(ROOT, 'design/_bg/original')
OUT = os.path.join(ROOT, 'design/_bg')

# Only pixels brighter than this contribute. High, because the point is to light
# the NEON — the lit windows, the tube outlines, the sun — and not to raise the
# whole plate. 150 keeps the mid-purple sky out of it.
THRESHOLD = 150
# 2026-08-26: dialled back from 12/0.85 + 60/0.5. At that strength the wide pass
# screened a halo over everything bright and the city's hard vector edges went
# soft — which is the opposite of what this art needs. It is already short on
# detail (edge density 4.9 against 10-15 for the set it replaced); a bloom that
# eats edges spends the little there is.
TIGHT_RADIUS, TIGHT_GAIN = 8, 0.6
WIDE_RADIUS, WIDE_GAIN = 40, 0.28


def bloom(im: Image.Image) -> Image.Image:
    grey = im.convert('L')
    # Keep the colour of what is glowing: mask the original by its own
    # brightness, so a cyan tube blooms cyan and a gold window blooms gold.
    mask = grey.point(lambda v: 0 if v < THRESHOLD else min(255, int((v - THRESHOLD) * 255 / (255 - THRESHOLD))))
    lit = Image.new('RGB', im.size, (0, 0, 0))
    lit.paste(im, mask=mask)

    out = im
    for radius, gain in ((TIGHT_RADIUS, TIGHT_GAIN), (WIDE_RADIUS, WIDE_GAIN)):
        halo = lit.filter(ImageFilter.GaussianBlur(radius))
        halo = Image.eval(halo, lambda v: int(v * gain))
        out = ImageChops.screen(out, halo)
    return out


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument('--install', action='store_true')
    args = ap.parse_args()

    os.makedirs(KEEP, exist_ok=True)
    made = []
    for name in ('bg_base.png', 'bg_feature.png', 'bg_epic.png'):
        kept = os.path.join(KEEP, name)
        if not os.path.exists(kept):
            shutil.copy2(os.path.join(SRC, name), kept)
        before = Image.open(kept).convert('RGB')
        after = bloom(before)
        after.save(os.path.join(OUT, name))
        made.append((name, before, after))
        b = sum(before.convert('L').getdata()) / (before.width * before.height)
        a = sum(after.convert('L').getdata()) / (after.width * after.height)
        print(f'   {name:<16} brightness {b:5.1f} -> {a:5.1f}')

    strip = Image.new('RGB', (960, 270 * len(made)), (0, 0, 0))
    for i, (_, before, after) in enumerate(made):
        strip.paste(before.resize((480, 270), Image.LANCZOS), (0, i * 270))
        strip.paste(after.resize((480, 270), Image.LANCZOS), (480, i * 270))
    strip.save(os.path.join(OUT, '_compare.png'))
    print(f'wrote {os.path.relpath(os.path.join(OUT, "_compare.png"), ROOT)} (left: flat, right: bloomed)')

    if args.install:
        for name, _, after in made:
            after.save(os.path.join(SRC, name))
        print(f'installed 3 backgrounds -> {os.path.relpath(SRC, ROOT)}')
    return 0


if __name__ == '__main__':
    sys.exit(main())
