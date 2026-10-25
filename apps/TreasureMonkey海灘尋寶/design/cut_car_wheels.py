#!/usr/bin/env python3
"""Cut H5's wheels out of the shipped car art so they can turn.

The commissioned layers did not work for this symbol. The wheels themselves came
back complete and rotatable, but drawn bigger and brighter than the car's own,
and the matching "car with no wheels" had large dark discs punched through the
BODYWORK around each arch — so no scaling of the loose wheels could rebuild the
shipped car, which is what the stack has to match (the symbol is drawn flat at
rest and only stacks for the landing and the win).

Cutting them out of the shipped art instead gives back exactly the shipped
pixels, and a wheel is the one shape where this is safe: it is a circle, so
rotating it cannot misalign with what is around it, and the parts of it hidden
behind the arch were dark to begin with — a turning wheel simply shows dark
where the arch used to cover it.

    python design/cut_car_wheels.py

Writes design/source/parts/h5/{body,wheel_front,wheel_rear}.png with straight
alpha (the keying step passes that through untouched). The commissioned files are
kept as *_raw.png.
"""
from __future__ import annotations
import os, sys
from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'static/assets/sprites/hotMiamiSymbols/h5.png')
OUT = os.path.join(ROOT, 'design/source/parts/h5')

# Traced against design/_parts/_h5_grid.png. (centre x, centre y, radius),
# in 512² canvas pixels. The front wheel is the near one, in three-quarter view.
WHEELS = {
    'wheel_front': (309, 296, 31),
    'wheel_rear': (460, 242, 23),
}
# The arch interior behind a wheel. Sampled rather than guessed: see main().


def main() -> int:
    src = Image.open(SRC).convert('RGBA')
    body = src.copy()

    for name, (cx, cy, r) in WHEELS.items():
        circle = Image.new('L', src.size, 0)
        ImageDraw.Draw(circle).ellipse((cx - r, cy - r, cx + r, cy + r), fill=255)

        wheel = Image.new('RGBA', src.size, (0, 0, 0, 0))
        wheel.paste(src, (0, 0), Image.composite(src.getchannel('A'), Image.new('L', src.size, 0), circle))
        wheel.save(os.path.join(OUT, f'{name}.png'))

        # Fill the hole with the darkest colour already inside it — the shadow
        # under the arch — so the well reads as a well rather than a cut-out.
        px = src.load()
        darkest = min(
            ((px[x, y][0] + px[x, y][1] + px[x, y][2], px[x, y]) for y in range(cy - r, cy + r) for x in range(cx - r, cx + r)
             if (x - cx) ** 2 + (y - cy) ** 2 <= r * r and px[x, y][3] > 40),
            default=(0, (12, 6, 20, 255)),
        )[1]
        ImageDraw.Draw(body).ellipse((cx - r, cy - r, cx + r, cy + r), fill=darkest)
        print(f'   {name}: centre ({cx}, {cy}) r={r}, well filled with #{darkest[0]:02X}{darkest[1]:02X}{darkest[2]:02X}')

    body.save(os.path.join(OUT, 'body.png'))

    # prove the stack still is the shipped car
    stack = Image.new('RGBA', src.size, (0, 0, 0, 0))
    stack.alpha_composite(body)
    for name in WHEELS:
        stack.alpha_composite(Image.open(os.path.join(OUT, f'{name}.png')).convert('RGBA'))
    sa, pa = list(stack.convert('RGB').getdata()), list(src.convert('RGB').getdata())
    ma = list(stack.getchannel('A').point(lambda v: 255 if v > 40 else 0).getdata())
    n = sum(1 for m in ma if m)
    drift = sum(
        abs(sa[i][0] - pa[i][0]) + abs(sa[i][1] - pa[i][1]) + abs(sa[i][2] - pa[i][2])
        for i, m in enumerate(ma) if m
    ) / (3 * n)
    print(f'   stack vs shipped car: {drift:.2f} mean levels')
    return 0


if __name__ == '__main__':
    sys.exit(main())
