#!/usr/bin/env python3
"""Composite painted premium art onto the procedural ranked value plate.

    python design/plate_painted.py            # stage only
    python design/plate_painted.py --install

The painted symbols draw better than the procedural ones, but installing them
bare cost the game its pay hierarchy: the ranked plate was what carried value,
and painted subjects sat straight on the board. Measured at the true 105px cell
on RGB(40,10,66), that took Spearman(pay, contrast) from +0.80 to +0.62, put the
Ace (2x) at 42.8% ink against the flamingo (50x) at 21.2%, and left h4/h5
(30x/10x) out-contrasting h1 (400x). It also made the board inconsistent, since
the specials kept their plates.

This puts the two halves together: the model's drawing on the generator's
ranked, hue-washed cell. Chasing coverage through the prompt instead would only
have produced a fatter flamingo.

Plate rank follows pay order — h1 is rank 0 (lightest, richest cell) through h5
at rank 4. See PLATE_RAMP in neon.py for why the ramp is monotone above the
board's own luminance.
"""

from __future__ import annotations

import argparse
import shutil
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

try:
    from PIL import Image
except ImportError:
    sys.exit("PIL missing — use the anaconda python, not system python3.")

from neon import premium_plate  # noqa: E402

DESIGN = Path(__file__).resolve().parent
PAINTED = DESIGN / "_painted"
STAGE = DESIGN / "_plated"
BACKUP = DESIGN / "_backup_pre_rebuild"
SHIPPED = DESIGN.parent / "static/assets/sprites/hotMiamiSymbols"

OUT = 512
# Identity hues, fixed by the 2026-08-07 rebuild and reused by the painted art.
PREMIUMS = {
    "h1": (0, (0x50, 0xF0, 0xFF)),
    "h2": (1, (0xA8, 0x6C, 0xFF)),
    "h3": (2, (0xFF, 0x46, 0x96)),
    "h4": (3, (0xFF, 0xC8, 0x28)),
    "h5": (4, (0x96, 0xFF, 0x3C)),
}
# The drawing sits inside the plate, not edge to edge — the rim has to stay
# visible as the rank cue.
SUBJECT_FRAC = 0.78


def build(key: str, rank: int, hue: tuple[int, int, int], subject_frac: float) -> Image.Image:
    src = PAINTED / f"{key}.png"
    if not src.exists():
        sys.exit(f"missing {src} — run process_source_art.py first")
    plate = premium_plate(OUT, rank=rank, wash=hue).convert("RGBA")
    if plate.size != (OUT, OUT):
        plate = plate.resize((OUT, OUT), Image.LANCZOS)

    art = Image.open(src).convert("RGBA")
    box = art.getbbox()
    if box:
        art = art.crop(box)
    inner = int(OUT * subject_frac)
    art.thumbnail((inner, inner), Image.LANCZOS)

    canvas = Image.new("RGBA", (OUT, OUT), (0, 0, 0, 0))
    canvas.alpha_composite(plate)
    canvas.alpha_composite(art, ((OUT - art.width) // 2, (OUT - art.height) // 2))
    return canvas


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--install", action="store_true")
    ap.add_argument("--subject", type=float, default=SUBJECT_FRAC,
                    help="fraction of the cell the drawing occupies (default %(default)s)")
    args = ap.parse_args()

    STAGE.mkdir(parents=True, exist_ok=True)
    for key, (rank, hue) in PREMIUMS.items():
        im = build(key, rank, hue, args.subject)
        im.save(STAGE / f"{key}.png")
        a = im.getchannel("A").histogram()
        ink = 100.0 * sum(a[128:]) / (OUT * OUT)
        print(f"{key}: rank {rank}  staged  ink {ink:5.1f}% of cell")

    if not args.install:
        print("\nStaged to design/_plated/. Review, then --install.")
        return
    if not BACKUP.exists():
        sys.exit("refusing to --install: design/_backup_pre_rebuild/ is missing.")
    for key in PREMIUMS:
        shutil.copy2(STAGE / f"{key}.png", SHIPPED / f"{key}.png")
        print(f"{key}: installed")


if __name__ == "__main__":
    main()
