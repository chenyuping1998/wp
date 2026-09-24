#!/usr/bin/env python3
"""Knock the chroma key out of a packed Spine atlas.

The rigs arrive with the key still in the sheet — 75-78% of the texture is
opaque #00FF00 — because the parts were packed straight from the keyed source.
In game that renders as green blocks, not as a character.

Doing it here rather than asking for it again: it is one mechanical step, the
same keying the symbol parts already go through (design/process_source_parts.py),
and it does not touch the skeleton or the atlas coordinates.

    python design/dekey_spine_atlas.py static/assets/spines/cast_guy/cast_guy.png

Writes in place, after saving the original alongside as *.keyed.png once.
"""
from __future__ import annotations

import shutil
import sys
from pathlib import Path

from PIL import Image

KEY = (0, 255, 0)
# Same thresholds as process_source_parts.py: below HARD it is pure background,
# above SOFT pure subject, and between the two it feathers — which is what keeps
# the black outline from going jagged.
HARD, SOFT = 90, 165


def dekey(path: Path) -> None:
    backup = path.with_suffix('.keyed.png')
    if not backup.exists():
        shutil.copy2(path, backup)

    image = Image.open(backup).convert('RGBA')
    src = image.load()
    out = Image.new('RGBA', image.size)
    dst = out.load()
    kr, kg, kb = KEY
    for y in range(image.height):
        for x in range(image.width):
            r, g, b, a = src[x, y]
            d = ((r - kr) ** 2 + (g - kg) ** 2 + (b - kb) ** 2) ** 0.5
            if d <= HARD:
                dst[x, y] = (0, 0, 0, 0)
                continue
            # green despill on the fringe, or every outline keeps a lime halo
            cap = max(r, b)
            if g > cap:
                g = int(cap + (g - cap) * 0.15)
            alpha = 255 if d >= SOFT else int(255 * (d - HARD) / (SOFT - HARD))
            dst[x, y] = (r, g, b, min(a, alpha))
    out.save(path)
    opaque = sum(1 for p in out.getdata() if p[3] > 32)
    print(f'{path}: {opaque * 100 // (out.width * out.height)}% of the sheet is subject')


if __name__ == '__main__':
    for arg in sys.argv[1:]:
        dekey(Path(arg))
