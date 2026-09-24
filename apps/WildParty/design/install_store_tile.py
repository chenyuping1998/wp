#!/usr/bin/env python3
"""Assemble the layered store tile: background, foreground, and the composite.

Stake's back office takes the flattened tile, but the sibling Hot Miami ships all
three because round 6 of Go Bananas' review was lost on cover composition — the
reviewer asked for the subject to be moved inside the frame, and a flattened tile
cannot give back pixels that were never kept.

A note on why this art is BRIGHTER than the game it sells. The in-game palette is
violet-black; this tile is a lit purple room over an amber floor. That is
deliberate and it follows the sibling: Hot Miami's tile is a warm sunset beach
while its board is a dark neon night. A store tile competes in a grid of
thumbnails, and the handoff's own note for this game asks for "整體明亮、鮮豔色調、
邊緣避免過暗". Palette discipline governs the board, where symbols have to stay
separable; it does not govern the shop window.

Inputs (design/source/):
  tile_background_raw.png     the lit club scene, no lettering anywhere
  tile_foreground_keyed.png   headphones/vinyl/mirrorball emblem, real alpha

Outputs (design/source/, copied into upload/WildParty/thumbnail/ by hand):
  tile_background.png            1024x1024 RGB
  tile_foreground.png            1024x1024 RGBA
  WildParty_thumbnail_1024.png   1024x1024 RGB composite
"""

from pathlib import Path

import numpy as np
from PIL import Image

WP_DIR = Path(__file__).resolve().parent.parent
SOURCE_DIR = WP_DIR / "design" / "source"

RAW_BG = SOURCE_DIR / "tile_background_raw.png"
RAW_FG = SOURCE_DIR / "tile_foreground_keyed.png"

SIDE = 1024
# Stake want the subject complete and inside a safe area, with the background
# bleeding to the edges. Anything under this gets flagged.
MIN_MARGIN_FRAC = 0.08


def defringe_checker(fg: Image.Image) -> Image.Image:
    """Strip the checkerboard the supplied key left behind.

    The foreground arrived with a hard binary alpha — no partial-alpha pixels at
    all — keyed off a source that had a transparency checkerboard PAINTED into it
    rather than a real alpha channel. Two kinds of residue survive that: loose
    squares clinging to the subject, and a grey-mauve fringe where the laser
    streaks' soft outer glow was blended against the checker before keying.
    """
    a = np.array(fg).astype(int)
    al, rgb = a[..., 3], a[..., :3]
    sat = rgb.max(2) - rgb.min(2)
    level = rgb.max(2)
    # TWO masks, deliberately different widths — using one for both jobs wrecked
    # the artwork once already.
    #
    # `halo` is wide, and is only ever used to DELETE from the outside in. The
    # laser streaks were drawn with a soft outer glow, and keying that glow against
    # a checkerboard turned it into a grey-mauve fringe whose mid tones sit nowhere
    # near the two checker levels. What keeps a wide mask safe here is the
    # reachability test: the emblem's dark keyline (level < 90) and the streaks
    # themselves (saturation > 100) both block the flood, so nothing interior is
    # ever reached.
    halo = (sat < 60) & (level > 120) & (level < 238)
    # `checker` is narrow, and is the only thing allowed to be INPAINTED. Enclosed
    # pixels cannot be tested by reachability, so the colour test is all there is —
    # and at halo width it matched the silver headphones and the mirrorball facets,
    # smearing 24,878 pixels of real art.
    checker = (sat < 26) & (
        (np.abs(level - 176) <= 14) | (np.abs(level - 210) <= 14)
    )

    h, w = al.shape
    reachable = al < 20  # start from the transparent background
    frontier = list(zip(*np.where(reachable)))
    seen = reachable.copy()
    from collections import deque

    q = deque(frontier)
    kill = np.zeros_like(seen)
    while q:
        y, x = q.popleft()
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            ny, nx = y + dy, x + dx
            if 0 <= ny < h and 0 <= nx < w and not seen[ny, nx] and halo[ny, nx]:
                seen[ny, nx] = True
                kill[ny, nx] = True
                q.append((ny, nx))

    a[..., 3] = np.where(kill, 0, al)

    # Whatever checker is left is ENCLOSED — squares that the key trapped inside
    # the laser streaks, so the flood above could never reach them. Deleting them
    # would punch holes through the artwork, so they are inpainted instead:
    # repeatedly replaced by the average of their non-checker opaque neighbours,
    # which pulls the streak's own colour across them.
    stuck = checker & (a[..., 3] >= 250)
    remaining = int(stuck.sum())
    if remaining:
        rgbf = a[..., :3].astype(float)
        good = (a[..., 3] >= 250) & ~stuck
        for _ in range(12):
            if not stuck.any():
                break
            acc = np.zeros_like(rgbf)
            cnt = np.zeros(stuck.shape, dtype=float)
            for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                src = np.roll(np.roll(rgbf, dy, 0), dx, 1)
                ok = np.roll(np.roll(good, dy, 0), dx, 1)
                acc += src * ok[..., None]
                cnt += ok
            fillable = stuck & (cnt > 0)
            if not fillable.any():
                break
            rgbf[fillable] = (acc[fillable] / cnt[fillable][..., None])
            good |= fillable
            stuck &= ~fillable
        a[..., :3] = np.clip(rgbf, 0, 255)

    print(f"[OK] de-fringe removed {int(kill.sum())} checker pixels, "
          f"inpainted {remaining - int(stuck.sum())} enclosed")
    return Image.fromarray(a.astype(np.uint8), "RGBA")


def main() -> None:
    for p in (RAW_BG, RAW_FG):
        if not p.exists():
            raise FileNotFoundError(f"{p} not found")

    bg = Image.open(RAW_BG).convert("RGB").resize((SIDE, SIDE), Image.LANCZOS)
    fg = Image.open(RAW_FG).convert("RGBA")
    if fg.size != (SIDE, SIDE):
        fg = fg.resize((SIDE, SIDE), Image.LANCZOS)

    fg = defringe_checker(fg)

    alpha = np.array(fg)[..., 3]
    ys, xs = np.where(alpha > 20)
    if len(xs) == 0:
        raise ValueError("foreground has no opaque pixels — is it really keyed?")
    margin = min(xs.min(), SIDE - 1 - xs.max(), ys.min(), SIDE - 1 - ys.max())
    frac = margin / SIDE
    status = "OK" if frac >= MIN_MARGIN_FRAC else "TOO TIGHT"
    print(f"[{status}] foreground clear margin {margin}px = {frac * 100:.1f}% "
          f"(minimum {MIN_MARGIN_FRAC * 100:.0f}%)")
    if frac < MIN_MARGIN_FRAC:
        raise SystemExit("subject is too close to the edge — this is what round 6 was about")

    bg.save(SOURCE_DIR / "tile_background.png")
    fg.save(SOURCE_DIR / "tile_foreground.png")

    composite = bg.convert("RGBA")
    composite.alpha_composite(fg)
    composite.convert("RGB").save(SOURCE_DIR / "WildParty_thumbnail_1024.png")

    for name in ("tile_background.png", "tile_foreground.png", "WildParty_thumbnail_1024.png"):
        print(f"[OK] {name} -> {SOURCE_DIR / name}")


if __name__ == "__main__":
    main()
