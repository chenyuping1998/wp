#!/usr/bin/env python3
"""The Violin Case's light column: a paper-white Art Deco stepped beam.

Replaces sw_column_beam.png, which was the Tommy Gun's red comic-print beam and
cannot be tinted white (a tint multiplies, so red art stays red). ART_BRIEF §6:
`sw_column_beam` is redone in code as a paper-white stepped column.

The beam is three nested hard-edged bands, brightest in the middle — the same
stepped-value rule as the symbols (§0.2), so it reads as part of the art rather
than as a soft glow. It is uniform along its length because WildColumns stretches
it down the reel as the fill sweeps. White, so the component can tint it.

  build_sw_beam.py            -> static/assets/sprites/capoFx/sw_column_beam_deco.png
"""

from __future__ import annotations

from pathlib import Path

import numpy as np
from PIL import Image

APP = Path(__file__).resolve().parent.parent
OUT = APP / "static/assets/sprites/capoFx/sw_column_beam_deco.png"

W, H = 256, 1024
SS = 4  # supersample so the band edges come back anti-aliased after the downscale

# (half-width as a fraction of the texture width, alpha), outermost first
BANDS = [(0.50, 0.18), (0.36, 0.42), (0.22, 0.70), (0.09, 0.95)]


def main() -> None:
    w = W * SS
    x = (np.arange(w) + 0.5) / w - 0.5
    alpha = np.zeros(w)
    for half, a in BANDS:
        alpha[np.abs(x) <= half] = a
    row = np.round(alpha * 255).astype(np.uint8)
    a_img = Image.fromarray(np.tile(row, (8, 1)), "L").resize((W, 8), Image.LANCZOS)
    a_full = a_img.resize((W, H), Image.NEAREST)
    rgba = Image.merge("RGBA", (Image.new("L", (W, H), 255),) * 3 + (a_full,))
    rgba.save(OUT)
    print(f"wrote {OUT.relative_to(APP)} {rgba.size}")


if __name__ == "__main__":
    main()
