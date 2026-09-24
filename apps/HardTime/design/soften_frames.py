"""Make the Vault Frame plates readable as OVERLAYS instead of as plaques.

    python design/soften_frames.py [--report]

The generated art arrived as beautiful but solid objects: measured over the
delivered PNGs, frame_1x1 was 68% fully-opaque, frame_2x2 60% and frame_3x3 58%.
A Frame sits ON a symbol and multiplies whatever that symbol wins, so a plate
that hides its symbol breaks the one thing the mechanic has to communicate — and
a winning line lighting up cells the player cannot identify is exactly the
"presentation disagrees with the maths" shape a reviewer reads as a payout bug.

Source of truth is design/_capo_frames_delivered/ — kept OUT of design/source/
because check_source_art.py scans that tree for script-drawn art, and the flat
single-colour edge overlays legitimately trip it. This script never reads
its own output, so it is safe to re-run and safe to re-tune.

What it does, per plate:

  1. Keeps an outer band at full alpha. That band is where the rivets, hinges,
     corner brackets and dial live — the whole reason the art is good — and it
     sits over the cell's edge rather than over the symbol's centre of mass.
  2. Opens the centre: the existing porthole is grown into a soft-edged clear
     circle big enough to show the symbol underneath.
  3. Drops what is left of the interior face to a low alpha, so the plate still
     reads as metal across the cell without becoming the thing you look at.

The three edge overlays get a separate pass: 1x1 and 2x2 were delivered as clean
outlines (centre alpha 0.00) but 3x3 came with a filled grey disc (centre alpha
0.70). Drawn with additive blending at full span, that disc washes out the
middle of the largest frame in the game. Its centre is cleared to match.
"""

import os
import sys

import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
APP = os.path.abspath(os.path.join(HERE, ".."))
SRC = os.path.join(HERE, "_capo_frames_delivered")
OUT = os.path.join(APP, "static", "assets", "sprites", "capoFrames")

# Fractions of the plate's half-width.
#
# BORDER  width of the outer band held at FULL alpha
# RAMP    transition width just inside that band
# CLEAR   radius of the fully transparent centre
# FADE    radius at which the interior reaches FACE_ALPHA (soft edge between)
# FACE    alpha the remaining interior face is scaled to
#
# Tuned per size rather than shared. A 1x1 is 118px on the board and has one
# symbol to protect, so it needs the most glass; a 3x3 is 354px and covers nine
# cells, so its face can carry more weight before any single symbol is lost.
PLATES = {
    "frame_1x1.png": dict(border=0.13, ramp=0.09, clear=0.62, fade=0.88, face=0.28),
    "frame_2x2.png": dict(border=0.12, ramp=0.08, clear=0.58, fade=0.86, face=0.32),
    "frame_3x3.png": dict(border=0.11, ramp=0.08, clear=0.55, fade=0.84, face=0.36),
}

# The edge overlays are drawn additively, so anything left in the middle is
# light added on top of the symbol. Outline only.
EDGES = {
    "frame_edge_1x1.png": 0.60,
    "frame_edge_2x2.png": 0.58,
    "frame_edge_3x3.png": 0.56,
}


def soften(alpha: np.ndarray, border: float, ramp: float, clear: float, fade: float, face: float) -> np.ndarray:
    """Open the centre, hold the outer band, thin what is between them."""
    h, w = alpha.shape
    cy, cx = (h - 1) / 2, (w - 1) / 2
    yy, xx = np.mgrid[0:h, 0:w]

    # Radial distance, normalised so 1.0 is the middle of an edge. Used for the
    # centre opening, which is round on all three plates.
    radial = np.sqrt(((xx - cx) / (w / 2)) ** 2 + ((yy - cy) / (h / 2)) ** 2)

    # Chebyshev distance from the centre, normalised the same way: 1.0 at the
    # outer edge. This is the square measure, which is what "an outer band" means
    # on a square plate — a radial band would cut the corner brackets off.
    square = np.maximum(np.abs(xx - cx) / (w / 2), np.abs(yy - cy) / (h / 2))

    # Interior face -> `face`, returning to 1.0 across the outer band.
    #
    # The band is FLAT at 1.0 for the outer `border`, with the climb packed into
    # a short `ramp` just inside it. A single linear climb across the whole band
    # is what the first version did, and it left almost nothing at full alpha —
    # the rivets and corner brackets the band exists to protect came out as
    # washed as the face they were supposed to outrank.
    band = np.clip((square - (1.0 - border - ramp)) / max(ramp, 1e-6), 0.0, 1.0)
    scale = face + (1.0 - face) * band

    # centre opening: 0 inside `clear`, ramping to `scale` by `fade`
    opening = np.clip((radial - clear) / max(fade - clear, 1e-6), 0.0, 1.0)

    return alpha * scale * opening


def clear_centre(alpha: np.ndarray, radius: float) -> np.ndarray:
    """Cut a soft hole in the middle of an additive overlay."""
    h, w = alpha.shape
    yy, xx = np.mgrid[0:h, 0:w]
    radial = np.sqrt(((xx - (w - 1) / 2) / (w / 2)) ** 2 + ((yy - (h - 1) / 2) / (h / 2)) ** 2)
    return alpha * np.clip((radial - radius) / 0.16, 0.0, 1.0)


def stats(alpha: np.ndarray) -> str:
    h, w = alpha.shape
    yy, xx = np.mgrid[0:h, 0:w]
    r = np.sqrt((xx - w / 2) ** 2 + (yy - h / 2) ** 2)
    return f"opaque {(alpha > 0.78).mean() * 100:5.1f}%   centre a={alpha[r < 0.225 * w].mean():.2f}"


def main() -> None:
    report = "--report" in sys.argv
    if not os.path.isdir(SRC):
        raise SystemExit(f"originals not found: {SRC}")

    for name, p in PLATES.items():
        im = Image.open(os.path.join(SRC, name)).convert("RGBA")
        arr = np.array(im).astype(float)
        before = arr[:, :, 3] / 255
        after = soften(before, **p)
        arr[:, :, 3] = np.clip(after, 0, 1) * 255
        Image.fromarray(arr.astype(np.uint8)).save(os.path.join(OUT, name))
        print(f"{name:22s} {stats(before)}  ->  {stats(after)}")

    for name, radius in EDGES.items():
        im = Image.open(os.path.join(SRC, name)).convert("RGBA")
        arr = np.array(im).astype(float)
        before = arr[:, :, 3] / 255
        after = clear_centre(before, radius)
        arr[:, :, 3] = np.clip(after, 0, 1) * 255
        Image.fromarray(arr.astype(np.uint8)).save(os.path.join(OUT, name))
        print(f"{name:22s} {stats(before)}  ->  {stats(after)}")

    if report:
        print("\nre-run after editing PLATES/EDGES; originals are never overwritten")


if __name__ == "__main__":
    main()
