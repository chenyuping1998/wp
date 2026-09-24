#!/usr/bin/env python3
"""Key the painted checkerboard off the generated wordmark and install it.

The generator was asked for a transparent background and instead PAINTED a
transparency checkerboard into the pixels — the file is RGB with no alpha channel
at all, two neutral greys (184/220) in a regular grid. Dropping it in as-is would
put a literal checker rectangle behind the logo.

Keying it by colour alone is unsafe: the wordmark's own highlights are white, and
white is one of the checker greys. What makes this tractable is that the lockup
carries a thick, closed, very dark keyline. So the background is defined
structurally instead — everything reachable from the image border without
crossing that keyline. Enclosed whites (letter faces) are never reached and
survive; the checker, which touches the border everywhere, goes.

Produces:
  static/assets/sprites/wildPartyBrand/logo.png   in-game / intro card
  design/source/tile_foreground.png               1024x1024 RGBA, store tile layer
"""

from pathlib import Path
from collections import deque

import numpy as np
from PIL import Image

GEN_DIR = Path("/Users/stone/.gemini/antigravity-ide/brain/f228d53a-9376-475a-8418-6ca43cd123ff")
RAW_IMG = GEN_DIR / "wild_party_logo_1786850274730.png"

WP_DIR = Path("/Users/stone/stake-engine/wp/apps/WildParty")
BRAND_DIR = WP_DIR / "static" / "assets" / "sprites" / "wildPartyBrand"
SOURCE_DIR = WP_DIR / "design" / "source"

# A pixel counts as keyline if every channel is this dark. The lockup's outline
# measures well under this; the darkest checker grey is 184.
KEYLINE_MAX = 90
# Safe-area margin for the store-tile layer, per the Stake cover-art note: the
# subject must sit inside the frame, never touching an edge.
SAFE_MARGIN = 0.12


def main() -> None:
    if not RAW_IMG.exists():
        raise FileNotFoundError(f"Raw image {RAW_IMG} not found")

    rgb = np.array(Image.open(RAW_IMG).convert("RGB")).astype(int)
    h, w, _ = rgb.shape
    keyline = rgb.max(2) < KEYLINE_MAX

    # flood from the border, refusing to cross the keyline
    outside = np.zeros((h, w), dtype=bool)
    q = deque()
    for x in range(w):
        for y in (0, h - 1):
            if not keyline[y, x] and not outside[y, x]:
                outside[y, x] = True
                q.append((y, x))
    for y in range(h):
        for x in (0, w - 1):
            if not keyline[y, x] and not outside[y, x]:
                outside[y, x] = True
                q.append((y, x))
    while q:
        y, x = q.popleft()
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            ny, nx = y + dy, x + dx
            if 0 <= ny < h and 0 <= nx < w and not keyline[ny, nx] and not outside[ny, nx]:
                outside[ny, nx] = True
                q.append((ny, nx))

    out = np.dstack([rgb, np.where(outside, 0, 255)]).astype(np.uint8)
    im = Image.fromarray(out, "RGBA")

    # trim to the lockup, then re-centre inside the safe area
    bbox = im.getbbox()
    if bbox:
        im = im.crop(bbox)

    BRAND_DIR.mkdir(parents=True, exist_ok=True)
    SOURCE_DIR.mkdir(parents=True, exist_ok=True)

    im.save(BRAND_DIR / "logo.png")
    print(f"[OK] Logo {im.size[0]}x{im.size[1]} -> {BRAND_DIR / 'logo.png'}")

    side = 1024
    inner = int(side * (1 - SAFE_MARGIN * 2))
    fitted = im.copy()
    fitted.thumbnail((inner, inner), Image.LANCZOS)
    tile = Image.new("RGBA", (side, side), (0, 0, 0, 0))
    tile.alpha_composite(fitted, ((side - fitted.width) // 2, (side - fitted.height) // 2))
    tile.save(SOURCE_DIR / "tile_foreground.png")
    margin = min((side - fitted.width) // 2, (side - fitted.height) // 2)
    print(
        f"[OK] tile_foreground.png {side}x{side} -> {SOURCE_DIR / 'tile_foreground.png'} "
        f"(subject {fitted.width}x{fitted.height}, clear margin {margin}px = "
        f"{margin / side * 100:.1f}%)"
    )


if __name__ == "__main__":
    main()
