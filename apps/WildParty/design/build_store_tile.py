#!/usr/bin/env python3
"""Build the three files Stake's tile spec actually asks for.

Per stake-engine.com/docs/approval-guidelines/game-tile-requirements a
submission is THREE separate files and Stake composites them itself:

  WildParty-BG.png      1024x1024 opaque   "an environmental background that
                                            shows the world of the game"
  WildParty-FG.png      1024x1024 RGBA     "a feature character or key item",
                                            alpha must reach 0
  Silverstars-Logo.png  provider mark      reused from the sibling Hot Miami —
                                            same studio, already built to spec

The first submission sent `tile_background.png`, `tile_foreground.png` and a
pre-composited `WildParty_thumbnail_1024.png`: two files misnamed, no provider
logo, and a composite the spec explicitly does not want. The tile was rejected.

Why two source renders instead of one. The approved key art had the emblem baked
into the scene, and BG must be emblem-free or Stake's composite shows the emblem
twice — once in the background, once as the foreground layer. Keying it back out
was measured and rejected: the bloom around the emblem sits at mean luminance
0.334 and is continuous with the backdrop, so there is no alpha edge to find, and
a luminance/saturation key leaked 5.3% of the image outside the subject.

Inputs (design/source/):
  tile_bg_raw.png   the club interior, centre deliberately left open
  tile_fg_raw.png   the emblem alone on flat black, for keying

Usage:  python3 design/build_store_tile.py
"""

from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "design" / "source"
OUT = ROOT.parent.parent.parent / "upload" / "WildParty" / "thumbnail"

SIZE = 1024


def luminance(rgb: np.ndarray) -> np.ndarray:
    lin = np.where(rgb <= 0.04045, rgb / 12.92, ((rgb + 0.055) / 1.055) ** 2.4)
    return lin @ [0.2126, 0.7152, 0.0722]


def build_background() -> None:
    im = Image.open(SRC / "tile_bg_raw.png").convert("RGB").resize((SIZE, SIZE), Image.LANCZOS)
    im.save(OUT / "WildParty-BG.png")
    Y = luminance(np.asarray(im).astype(float) / 255)
    print(f"[OK] WildParty-BG.png   {SIZE}x{SIZE} RGB   mean luminance {Y.mean():.3f}")


def build_foreground() -> None:
    im = Image.open(SRC / "tile_fg_raw.png").convert("RGB").resize((SIZE, SIZE), Image.LANCZOS)
    rgb = np.asarray(im).astype(float) / 255
    Y = luminance(rgb)

    # The emblem's own outline is near-black, so luminance alone cannot be the
    # alpha: it would punch holes straight through the drawing. Instead the
    # silhouette is found from the lit parts and then filled, and luminance is
    # only allowed to shape the alpha OUTSIDE that silhouette, where it is the
    # glow falling off into the black.
    core = Y > 0.06
    core = ndimage.binary_closing(core, np.ones((9, 9)))
    solid = ndimage.binary_fill_holes(core)
    # Drop stray specks that are not part of the subject.
    labels, n = ndimage.label(solid)
    if n > 1:
        sizes = ndimage.sum(solid, labels, range(1, n + 1))
        solid = labels == (int(np.argmax(sizes)) + 1)

    # Soft glow: what is lit but outside the silhouette. Normalised so the
    # brightest halo pixel is fully opaque and the black background is fully
    # transparent.
    halo = np.clip(Y / 0.35, 0, 1) ** 0.8
    alpha = np.where(solid, 1.0, halo)

    # Feather the silhouette edge by a pixel or so; a hard binary edge on a
    # 1024px tile reads as a cut-out.
    alpha = ndimage.gaussian_filter(alpha, 1.2)
    alpha = np.clip(alpha, 0, 1)
    # Guarantee the spec's "alpha reaches 0" at the frame.
    alpha[:2, :] = alpha[-2:, :] = alpha[:, :2] = alpha[:, -2:] = 0

    out = np.dstack([np.clip(rgb, 0, 1), alpha])
    Image.fromarray((out * 255).astype(np.uint8), "RGBA").save(OUT / "WildParty-FG.png")

    transparent = 100 * (alpha < 0.03).mean()
    print(
        f"[OK] WildParty-FG.png   {SIZE}x{SIZE} RGBA  alpha 0..{alpha.max():.2f}  "
        f"transparent {transparent:.1f}%  subject {100 * solid.mean():.1f}%"
    )


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    build_background()
    build_foreground()


if __name__ == "__main__":
    main()
