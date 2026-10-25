#!/usr/bin/env python3
"""Cut H3's head-and-neck off the shipped flamingo, in code.

Three rounds of generated layer art could not separate this one symbol. Twice
the "body" came back with the head still on it, and the head layer came back as
a fragment of the wrong area — which the numeric checks in check_parts.py could
not see, because a fragment that lands on matching art still stacks back into a
perfect copy of the whole bird (silhouette IoU 1.00) and still scores well on the
redundancy test, whose measurement only covers the part's own ink.

It is separable geometrically, though, and unusually cleanly: a flamingo's neck
is in open air, so cutting it out reveals nothing that needs painting back in.
The only invented pixels are the stump cap that closes the body's shoulder, and
at rest the neck covers it entirely.

    python design/cut_flamingo_parts.py

Writes design/source/parts/h3/{body,head_neck}.png — the same place commissioned
art goes, so the rest of the pipeline (process_source_parts.py →
build_parts_manifest.py) is unchanged. They arrive with straight alpha rather
than a chroma key, which the keying step passes through untouched.

The wing stays part of the body: the delivered wing layer would have needed a
body with a wing-shaped hole in it, and the one that came back had a hard
rectangular bite instead. A peck is the motion this symbol actually wants.
"""
from __future__ import annotations
import os, sys
from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'static/assets/sprites/hotMiamiSymbols/h3.png')
OUT = os.path.join(ROOT, 'design/source/parts/h3')

# Traced against a 512² grid render of the shipped symbol (design/_parts/
# _h3_grid.png). It follows the open space around the neck and crosses it once,
# at the shoulder — the only place the two pieces touch.
NECK_CUT = [(100, 0), (310, 0), (310, 108), (258, 146), (226, 176), (196, 202), (158, 148), (100, 58)]
# Pink cap over the body's opening, in the neck's own colour, with the set's
# heavy dark outline so it reads as part of the drawing.
# Just the neck's own cross-section at the cut, not a shoulder pad. The first
# version was wider than the neck and sat proud of it, so at rest a pale pink
# oval showed on the bird's back — the cap has to hide UNDER the neck, which
# means it must be no bigger than the neck is where it was cut.
STUMP = (199, 193, 241, 223)
PINK = (255, 58, 140, 255)
INK = (10, 4, 18, 255)


def main() -> int:
    src = Image.open(SRC).convert('RGBA')
    mask = Image.new('L', src.size, 0)
    ImageDraw.Draw(mask).polygon(NECK_CUT, fill=255)
    blank = Image.new('L', src.size, 0)

    head = Image.new('RGBA', src.size, (0, 0, 0, 0))
    head.paste(src, (0, 0), Image.composite(src.getchannel('A'), blank, mask))

    body = Image.new('RGBA', src.size, (0, 0, 0, 0))
    body.paste(src, (0, 0), Image.composite(src.getchannel('A'), blank, Image.eval(mask, lambda v: 255 - v)))
    # Fill only, no outline. Giving the cap the set's dark outline drew a small
    # ring on the bird's shoulder that the shipped flat art does not have, and
    # the symbol is drawn flat at rest — so the ring appeared the moment the
    # symbol landed. The joint is covered by the neck; what it needs is to not be
    # a hole, not to be a drawn edge.
    ImageDraw.Draw(body).ellipse(STUMP, fill=PINK)

    # Drop anything the polygon caught that is not connected to the neck: a
    # corner of the bird's back fell inside the first version of the cut and
    # travelled with the head as a loose flake.
    head = _largest_island(head)

    os.makedirs(OUT, exist_ok=True)
    head.save(os.path.join(OUT, 'head_neck.png'))
    body.save(os.path.join(OUT, 'body.png'))
    for name, im in (('head_neck', head), ('body', body)):
        n = sum(1 for p in im.getdata() if p[3] > 32)
        print(f'   h3/{name:10s} {n / (im.width * im.height) * 100:5.2f}% of canvas  bbox={im.getchannel("A").point(lambda v: 255 if v > 32 else 0).getbbox()}')
    print('wrote', os.path.relpath(OUT, ROOT))
    return 0


def _largest_island(im: Image.Image) -> Image.Image:
    """Keep only the biggest connected blob of ink."""
    w, h = im.size
    alpha = im.getchannel('A').point(lambda v: 255 if v > 32 else 0).load()
    seen = [[False] * w for _ in range(h)]
    best: list[tuple[int, int]] = []
    for y in range(h):
        for x in range(w):
            if seen[y][x] or not alpha[x, y]:
                continue
            stack = [(x, y)]
            seen[y][x] = True
            island = []
            while stack:
                cx, cy = stack.pop()
                island.append((cx, cy))
                for nx, ny in ((cx + 1, cy), (cx - 1, cy), (cx, cy + 1), (cx, cy - 1)):
                    if 0 <= nx < w and 0 <= ny < h and not seen[ny][nx] and alpha[nx, ny]:
                        seen[ny][nx] = True
                        stack.append((nx, ny))
            if len(island) > len(best):
                best = island
    keep = Image.new('L', im.size, 0)
    kp = keep.load()
    for x, y in best:
        kp[x, y] = 255
    out = Image.new('RGBA', im.size, (0, 0, 0, 0))
    out.paste(im, (0, 0), keep)
    return out


if __name__ == '__main__':
    sys.exit(main())
