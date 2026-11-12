#!/usr/bin/env python3
"""Install the generated Buy Bonus plate at the runtime's exact 640px contract."""

from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "design/source/capoUiPlates/buybonus_plate_v2_source.png"
OLD = ROOT / "static/assets/sprites/capoUiPlates/buybonus_plate.png"
OUTPUT = OLD


def main() -> None:
    generated = Image.open(SOURCE).convert("RGB")
    generated = generated.resize((640, 640), Image.Resampling.LANCZOS)

    # Keep the proven runtime silhouette and genuine transparent exterior. The
    # generated preview contains a checkerboard outside the plate, so its RGB
    # must never be used as transparency evidence.
    alpha = Image.open(OLD).convert("RGBA").getchannel("A")
    result = generated.convert("RGBA")
    result.putalpha(alpha)
    result.save(OUTPUT, optimize=True)


if __name__ == "__main__":
    main()
