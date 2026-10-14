#!/usr/bin/env python3
"""Art Deco store tile foreground: the Don plus the Violin Case, over the paper sunburst.

ART_BRIEF.md §9: the tile is paper-white dominant (a black tile fails
check_thumbnail.py's dark<32 gate), the FG is a cutout with >= 10% margin all round
and headroom above the head for the platform's title overlay, no weapon, no text.
The FG is composed from the delivered cast art (design/cast_parts/mg/full.png) and
the special-wild symbol, so it is the same Don and the same case the player meets.

  build_store_tile_artdeco.py
      -> static/assets/sprites/capoBrand/tile_foreground_v2.png   (1024, RGBA)
      -> design/_artdeco/tile_preview.png                          (BG + FG check)
"""

from __future__ import annotations

from pathlib import Path

from PIL import Image

APP = Path(__file__).resolve().parent.parent
BRAND = APP / "static/assets/sprites/capoBrand"
DON = APP / "design/cast_parts/mg/full.png"
CASE = APP / "static/assets/sprites/capoSymbols/sw.png"
SIZE = 1024
MARGIN = 0.10


def main() -> None:
    fg = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))

    don = Image.open(DON).convert("RGBA")
    box = don.getchannel("A").getbbox()
    import json
    hips_y = json.loads((DON.parent / "layers.json").read_text())["joints"]["hips"][1]
    don = don.crop((box[0], box[1], box[2], hips_y))
    # Current Don half-body crop: hat at 16%, hip line on the 90% safe line.
    h = min(int(SIZE * (0.90 - 0.16)), round(SIZE * 0.60 * don.height / don.width))
    w = round(don.width * h / don.height)
    don = don.resize((w, h), Image.LANCZOS)
    fg.alpha_composite(don, (int(SIZE * 0.60 - w / 2), int(SIZE * 0.16)))

    case = Image.open(CASE).convert("RGBA")
    case = case.crop(case.getchannel("A").getbbox())
    ch = int(SIZE * 0.42)
    cw = round(case.width * ch / case.height)
    case = case.resize((cw, ch), Image.LANCZOS)
    fg.alpha_composite(case, (int(SIZE * MARGIN), int(SIZE * 0.90) - ch))

    box = fg.getchannel("A").getbbox()
    lo, hi = SIZE * MARGIN, SIZE * (1 - MARGIN)
    assert box[0] >= lo - 1 and box[2] <= hi + 1 and box[3] <= hi + 1, f"FG outside the 10% margin: {box}"
    out = BRAND / "tile_foreground_v2.png"
    fg.save(out)

    bg = Image.open(BRAND / "tile_background_v3.png").convert("RGBA")
    preview = Image.alpha_composite(bg, fg)
    preview.save(APP / "design/_artdeco/tile_preview.png")
    print(f"wrote {out.relative_to(APP)}  ink box {box}")


if __name__ == "__main__":
    main()
