#!/usr/bin/env python3
"""Fit H5's delivered wheels to the wheels in the shipped car art.

The third round of layer art came back with genuinely complete wheels — full
circles with rims, which is what a wheel has to be if it is going to turn — but
drawn larger and brighter than the wheels in the shipped symbol. That matters
because SymbolArt draws the flat sprite while a symbol is at rest and only swaps
to the part stack for the landing and the win: a stack that does not match the
flat art makes the car change its face the instant it lands.

Rather than ask for a fourth round, the fit is measurable, so it is searched:
for each wheel, try a range of scales and offsets, composite it over the body
layer, and keep whichever lands closest to the shipped h5.png in the wheel's own
area. The result is checked afterwards by design/check_parts.py, which fails the
build if the assembled stack drifts from the shipped symbol at all.

    python design/fit_car_wheels.py

Idempotent: the delivered files are kept as wheel_*_raw.png and the fitted
versions are written to wheel_*.png, so re-running fits the raw art again rather
than fitting an already-fitted wheel.
"""
from __future__ import annotations
import os, sys
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PARTS = os.path.join(ROOT, 'design/source/parts/h5')
SHIPPED = os.path.join(ROOT, 'static/assets/sprites/hotMiamiSymbols/h5.png')
KEY = (255, 0, 255)


def keyed(path: str) -> Image.Image:
    """Same keying as process_source_parts.py, inline so the search can run on
    the raw delivery without staging it first."""
    im = Image.open(path).convert('RGBA')
    out = Image.new('RGBA', im.size)
    src, dst = im.load(), out.load()
    for y in range(im.height):
        for x in range(im.width):
            r, g, b, a = src[x, y]
            d = ((r - KEY[0]) ** 2 + (g - KEY[1]) ** 2 + (b - KEY[2]) ** 2) ** 0.5
            dst[x, y] = (0, 0, 0, 0) if d <= 90 else (r, g, b, a if d >= 165 else int(255 * (d - 90) / 75))
    return out


def transformed(wheel: Image.Image, scale: float, dx: int, dy: int) -> Image.Image:
    box = wheel.getchannel('A').point(lambda v: 255 if v > 32 else 0).getbbox()
    cx, cy = (box[0] + box[2]) / 2, (box[1] + box[3]) / 2
    w, h = wheel.size
    small = wheel.resize((max(1, int(w * scale)), max(1, int(h * scale))), Image.LANCZOS)
    out = Image.new('RGBA', wheel.size, (0, 0, 0, 0))
    out.alpha_composite(small, (int(cx - cx * scale + dx), int(cy - cy * scale + dy)))
    return out


def wheel_wells(body: Image.Image, shipped: Image.Image) -> list[Image.Image]:
    """The two regions the wheels are supposed to fill.

    Found by diffing the body layer against the shipped car: what the artist
    removed IS the wheel, and the leftover dark disc is exactly the area a fitted
    wheel has to cover. Using a fixed region matters — scoring inside the wheel's
    own ink instead let the search shrink the wheel to nothing, because a smaller
    wheel measures a smaller (and better-matching) patch. The first run of this
    script did exactly that and reported a "best fit" at half size.
    """
    ba, sa = list(body.convert('RGB').getdata()), list(shipped.convert('RGB').getdata())
    ship_ink = list(shipped.getchannel('A').point(lambda v: 255 if v > 40 else 0).getdata())
    w, h = body.size
    mask = Image.new('L', body.size, 0)
    mp = mask.load()
    for i, m in enumerate(ship_ink):
        if not m:
            continue
        if abs(ba[i][0] - sa[i][0]) + abs(ba[i][1] - sa[i][1]) + abs(ba[i][2] - sa[i][2]) > 90:
            mp[i % w, i // w] = 255

    # split into connected blobs and keep the two biggest — the two wheel wells
    seen = [[False] * w for _ in range(h)]
    blobs = []
    for y in range(h):
        for x in range(w):
            if seen[y][x] or not mp[x, y]:
                continue
            stack, blob = [(x, y)], []
            seen[y][x] = True
            while stack:
                cx, cy = stack.pop()
                blob.append((cx, cy))
                for nx, ny in ((cx + 1, cy), (cx - 1, cy), (cx, cy + 1), (cx, cy - 1)):
                    if 0 <= nx < w and 0 <= ny < h and not seen[ny][nx] and mp[nx, ny]:
                        seen[ny][nx] = True
                        stack.append((nx, ny))
            if len(blob) > 400:
                blobs.append(blob)
    blobs.sort(key=len, reverse=True)
    wells = []
    for blob in blobs[:2]:
        m = Image.new('L', body.size, 0)
        q = m.load()
        for x, y in blob:
            q[x, y] = 255
        wells.append(m)
    # front wheel is the right-hand one in this three-quarter view
    wells.sort(key=lambda m: m.getbbox()[0], reverse=True)
    return wells


def score(body: Image.Image, wheel: Image.Image, shipped: Image.Image, well: Image.Image) -> float:
    comp = body.copy()
    comp.alpha_composite(wheel)
    box = well.getbbox()
    ca = list(comp.convert('RGB').crop(box).getdata())
    sa = list(shipped.convert('RGB').crop(box).getdata())
    ma = list(well.crop(box).getdata())
    n = sum(1 for m in ma if m)
    if not n:
        return 1e9
    return sum(
        abs(ca[i][0] - sa[i][0]) + abs(ca[i][1] - sa[i][1]) + abs(ca[i][2] - sa[i][2])
        for i, m in enumerate(ma) if m
    ) / (3 * n)


def main() -> int:
    shipped = Image.open(SHIPPED).convert('RGBA')
    body = keyed(os.path.join(PARTS, 'body.png'))

    wells = wheel_wells(body, shipped)
    if len(wells) != 2:
        print(f'!! found {len(wells)} wheel wells in the body layer, expected 2')
        return 1

    for name, well in zip(('wheel_front', 'wheel_rear'), wells):
        print(f'   {name} well bbox {well.getbbox()}')
        raw_path = os.path.join(PARTS, f'{name}_raw.png')
        if not os.path.exists(raw_path):
            os.rename(os.path.join(PARTS, f'{name}.png'), raw_path)
        wheel = keyed(raw_path)

        best = (1e9, 1.0, 0, 0)
        # coarse then fine: the wheels are within a dozen pixels and a third of
        # their size of right, so there is no need to search the whole canvas.
        for scale in [x / 100 for x in range(40, 121, 5)]:
            for dx in range(-24, 25, 4):
                for dy in range(-24, 25, 4):
                    s = score(body, transformed(wheel, scale, dx, dy), shipped, well)
                    if s < best[0]:
                        best = (s, scale, dx, dy)
        _, scale, dx, dy = best
        for fine_scale in [scale + x / 100 for x in range(-4, 5)]:
            for fdx in range(dx - 3, dx + 4):
                for fdy in range(dy - 3, dy + 4):
                    s = score(body, transformed(wheel, fine_scale, fdx, fdy), shipped, well)
                    if s < best[0]:
                        best = (s, fine_scale, fdx, fdy)

        s, scale, dx, dy = best
        fitted = transformed(wheel, scale, dx, dy)
        # Written back with the magenta key so the rest of the pipeline treats it
        # exactly like delivered art.
        flat = Image.new('RGBA', fitted.size, KEY + (255,))
        flat.alpha_composite(fitted)
        flat.save(os.path.join(PARTS, f'{name}.png'))
        print(f'   {name}: scale {scale:.2f}, offset ({dx:+d}, {dy:+d}) -> {s:.1f} mean levels vs the shipped car')
    return 0


if __name__ == '__main__':
    sys.exit(main())
