"""The free-standing title (sushiV8/logo_board.png), 2026-10-31.

As Swing / Saucer (2026-10-18 / 10-23): the loading-page title without its
board. The old one was "JADE TEAHOUSE" lettered on a carved signboard with
three hanging plaques under it (cup, 玉茗茶樓, lantern) - a second panel on
top of the art. This is the same carved-jade wordmark as the free-spin and
big-win titles (build_wordmarks.wordmark: gold glow, ink extrusion, gold rim,
glazed jade face, sheen), stacked JADE over TEAHOUSE, on the same 1600x600
canvas so LoadingScreen / FeatureIntro keep their layout.

The old board is kept in design/source/_pre_wordmark/logo_board.png (the
first run copies it there). build_jade_art.py no longer writes logo_board.

Run: math-sdk/env/Scripts/python.exe design/build_logo_wordmark.py
"""

import shutil
from pathlib import Path

from PIL import Image

from build_wordmarks import wordmark

APP = Path(__file__).resolve().parents[1]
OUT = APP / "static/assets/sprites/sushiV8/logo_board.png"
KEEP = APP / "design/source/_pre_wordmark/logo_board.png"


def main():
    if not KEEP.exists():
        KEEP.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(OUT, KEEP)
    canvas = Image.new("RGBA", (1600, 600))
    # JADE is the name, TEAHOUSE the place: the name carries the weight
    jade = wordmark("JADE", (1600, 330), 250, "jade")
    house = wordmark("TEAHOUSE", (1600, 260), 150, "jade")
    canvas.alpha_composite(house, (0, 330))
    canvas.alpha_composite(jade, (0, 20))
    canvas.save(OUT, optimize=True)
    print("wrote", OUT.relative_to(APP))


if __name__ == "__main__":
    main()
