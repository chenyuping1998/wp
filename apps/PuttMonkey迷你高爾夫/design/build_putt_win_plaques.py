"""The big-win plaques (win_big .. win_max, 1000x560), 2026-10-18.

They were cream rounded rectangles with symbols pasted into the corners —
the same thing the user rejected on the FG boards. Now each is the course
postcard (build_putt_fg_sign.board: the Buy Bonus card's paper panel under a
view of the course), and the tiers climb by WHAT THE VIEW SHOWS and by the
postcard's printed border, not by piling on icons:

  big       daytime, the windmill hole            cream border
  superwin  daytime, the dinosaur and the volcano cream border, red pinstripe
  mega      sunset over the fence                 red border, cream pinstripe
  epic      sunset, the volcano erupting          green border, gold pinstripe
  max       the whole sunset course               gold border, ink pinstripe

The tier name and the amount are runtime type (Win.svelte): the name sits on
the seam between view and paper, the amount on the paper. Decor layers are
written empty, so nothing on the plaque moves by itself.

Run: python design/build_putt_win_plaques.py   (after build_putt_fg_sign.py)
"""
import sys
from pathlib import Path

from PIL import Image, ImageDraw

sys.path.insert(0, str(Path(__file__).resolve().parent))
from build_putt_fg_sign import SRC, board, rounded_mask, save, STRIP_Y0  # noqa: E402

PW, PH = 1000, 560
B = 26  # printed border around the card
S = 0.6
BASE = SRC / "backgrounds/background_base.png"
SUNSET = SRC / "backgrounds/background_feature_v2.png"
CREAM, RED, GREEN, GOLD, INK = (254, 244, 210), (229, 67, 47), (62, 122, 69), (255, 207, 74), (27, 42, 34)

TIERS = {
    "big": (BASE, (0, 900), 0.30, CREAM, None),
    "super": (BASE, (772, 1672), 0.32, CREAM, RED),
    "mega": (SUNSET, (386, 1286), 0.22, RED, CREAM),
    "epic": (SUNSET, (900, 1672), 0.13, GREEN, GOLD),
    "max": (SUNSET, None, 0.32, GOLD, INK),
}


def plaque(view, box, crop_y, border, stripe):
    inner = board(view, crop_y, size=(PW - 2 * B, PH - 2 * B), S=S, view_box=box)
    out = Image.new("RGBA", (PW, PH))
    rad = 30
    out.paste(Image.new("RGBA", (PW, PH), border + (255,)), (0, 0),
              rounded_mask((PW, PH), (0, 0, PW - 1, PH - 1), rad + B))
    # the outline of the print, so a cream border still has an edge
    sc = 4
    big = Image.new("L", (PW * sc, PH * sc), 0)
    d = ImageDraw.Draw(big)
    d.rounded_rectangle([sc, sc, PW * sc - sc, PH * sc - sc], (rad + B) * sc, outline=255, width=4 * sc)
    if stripe:
        d2 = Image.new("L", (PW * sc, PH * sc), 0)
        ImageDraw.Draw(d2).rounded_rectangle([11 * sc, 11 * sc, (PW - 11) * sc, (PH - 11) * sc], (rad + B - 10) * sc,
                                             outline=255, width=5 * sc)
        sl = Image.new("RGBA", (PW, PH), stripe + (255,))
        sl.putalpha(d2.resize((PW, PH), Image.Resampling.LANCZOS))
        out.alpha_composite(sl)
    il = Image.new("RGBA", (PW, PH), INK + (255,))
    il.putalpha(big.resize((PW, PH), Image.Resampling.LANCZOS))
    out.alpha_composite(il)
    out.alpha_composite(inner, (B, B))
    return out


if __name__ == "__main__":
    for tier, args in TIERS.items():
        im = plaque(*args)
        save(im, f"win_{tier}.png")
        save(Image.new("RGBA", (PW, PH)), f"win_{tier}_decor.png")
    ih = PH - 2 * B
    seam = B + ih - round((1484 - STRIP_Y0) * S) + round(10 * S)
    print(f"seam (panel top ink) at y {seam} of {PH}: {seam / PH - 0.5:+.3f} bh from centre")
