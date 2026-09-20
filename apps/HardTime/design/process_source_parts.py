#!/usr/bin/env python3
"""Key the chroma background out of the LAYERED part art, without cropping it.

The layered symbols (design/source/parts/<sym>/<part>.png) are rigged, so every
part has to stay on the same 512x512 canvas at the position it occupies in the
assembled symbol. `process_source_art.py` — the script for whole symbols — trims
to the subject and re-centres it, which is exactly wrong here: it would destroy
the registration that makes the parts stack.

So this one keys, despills and feathers, and does NOTHING else:

    python design/process_source_parts.py            # stage all symbols
    python design/process_source_parts.py h3 --install

Staging goes to design/_parts/, and --install copies to
static/assets/sprites/hotMiamiParts/. Alignment is checked separately by
design/check_parts.py, which stacks the result and compares it to the artist's
own _full.png.
"""
from __future__ import annotations
import argparse, os, shutil, sys
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'design/source/parts')
STAGE = os.path.join(ROOT, 'design/_parts')
INSTALL = os.path.join(ROOT, 'static/assets/sprites/hotMiamiParts')

# Key colour per symbol. Two of them are magenta because the subject itself is
# green-ish (the car body is #2D736C) or pink (the flamingo), and keying a colour
# that appears in the art punches holes in the subject.
KEY = {
    'h1': (0, 255, 0), 'h2': (0, 255, 0), 'h3': (0, 255, 0), 'c': (0, 255, 0),
    'h4': (255, 0, 255), 'h5': (255, 0, 255),
}

# The glow-only overlays are keyed on GREEN even where the symbol's own parts are
# keyed on magenta: the light they draw is cyan/magenta/warm-white, and keying
# magenta out of a magenta glow removes the glow.
KEY_BY_FILE = {
    'h4/panel_lit.png': (0, 255, 0),
    'h5/lights_on.png': (0, 255, 0),
}

# ── h2's part set is not repairable here, and this is where the finding lives ──
#
# h2's layers all carry a speckled salmon ghost of her face, neck and chest — a
# bad export, not a keying artefact. hair_front is the one that shows, because it
# is drawn on top of everything; it was invisible for months because a rigged
# symbol only draws its part stack during a win or the ~110ms of a blink. Once
# the character symbols started drawing their stack AT REST (game/idleSway.ts)
# the ghost sat permanently over the real face — 「女人圖騰的怪怪模樣」.
#
# The ghost separates from the hair cleanly on colour (hair is gold, G-B ~79;
# ghost is salmon, R-G > 45 with G-B low), so removing it looked easy. It is not:
#
#   removing it everywhere      dropped the assembled stack's IoU against the
#                               artist's own _full.png to 0.78 — check_parts
#                               caught it
#   removing it only where
#   another layer covers        removed NOTHING. Measured: 17,170 ghost pixels,
#                               0 of them covered by head or torso
#
# That second number is the whole answer. head.png and torso.png do not paint
# her face at all — the GHOST IS THE ONLY LAYER DRAWING IT. h2 cannot be
# assembled from its parts without the artefact, so there is nothing to repair
# in this file. The fix is in game/idleSway.ts: h2 does not draw its stack at
# rest, and keeps the flat sprite it has always shipped.

# Distance in RGB below which a pixel is pure background, and above which it is
# pure subject. Between the two it is feathered, which is what keeps the black
# outline from getting a hard jagged edge.
HARD, SOFT = 90, 165


def despill(r: int, g: int, b: int, key: tuple[int, int, int]) -> tuple[int, int, int]:
    """Pull the key colour out of edge pixels that picked up a fringe of it."""
    if key[1] == 255:  # green key
        cap = max(r, b)
        if g > cap:
            g = int(cap + (g - cap) * 0.15)
    else:  # magenta key
        cap = g
        if r > cap and b > cap:
            r = int(cap + (r - cap) * 0.55)
            b = int(cap + (b - cap) * 0.55)
    return r, g, b


def key_image(path: str, key: tuple[int, int, int]) -> Image.Image:
    im = Image.open(path).convert('RGBA')
    out = Image.new('RGBA', im.size)
    src = im.load()
    dst = out.load()
    kr, kg, kb = key
    for y in range(im.height):
        for x in range(im.width):
            r, g, b, a = src[x, y]
            d = ((r - kr) ** 2 + (g - kg) ** 2 + (b - kb) ** 2) ** 0.5
            if d <= HARD:
                dst[x, y] = (0, 0, 0, 0)
            else:
                alpha = 255 if d >= SOFT else int(255 * (d - HARD) / (SOFT - HARD))
                r, g, b = despill(r, g, b, key)
                dst[x, y] = (r, g, b, min(a, alpha))
    return out


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument('symbols', nargs='*', help='h1 h2 … (default: all)')
    ap.add_argument('--install', action='store_true')
    args = ap.parse_args()

    symbols = args.symbols or sorted(d for d in os.listdir(SRC) if os.path.isdir(os.path.join(SRC, d)))
    for sym in symbols:
        key = KEY.get(sym)
        if key is None:
            print(f'!! {sym}: no key colour configured')
            return 1
        out_dir = os.path.join(STAGE, sym)
        os.makedirs(out_dir, exist_ok=True)
        for name in sorted(os.listdir(os.path.join(SRC, sym))):
            if not name.endswith('.png'):
                continue
            im = key_image(os.path.join(SRC, sym, name), KEY_BY_FILE.get(f'{sym}/{name}', key))
            im.save(os.path.join(out_dir, name))
            opaque = sum(1 for p in im.getdata() if p[3] > 32)
            print(f'   {sym}/{name:18s} kept {opaque * 100 // (im.width * im.height):3d}% of the canvas')

    if args.install:
        for sym in symbols:
            dst = os.path.join(INSTALL, sym)
            shutil.rmtree(dst, ignore_errors=True)
            os.makedirs(dst, exist_ok=True)
            for name in os.listdir(os.path.join(STAGE, sym)):
                if name.startswith('_'):
                    continue  # _full.png is a reference, not a game asset
                shutil.copy2(os.path.join(STAGE, sym, name), os.path.join(dst, name))
            print(f'installed {sym} -> {os.path.relpath(dst, ROOT)}')
    return 0


if __name__ == '__main__':
    sys.exit(main())
