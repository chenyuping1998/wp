"""The big-win plaques (win_big .. win_max, 1000x560), 2026-10-18.

They were a red title band over a cream well with symbols pasted beside them
(the decor layers) — the same thing the user rejected on Putt Monkey's FG
boards. Now each is the lane-side marquee of build_strike_fg_sign.board (a
window onto the alley over the Buy Bonus card's paper), and the tiers climb by
WHAT THE WINDOW SHOWS and by the printed border, not by piling on icons:

  big       house lights, the pin decks                        cream border
  superwin  house lights, the Googie sign                      cream border, red pinstripe
  mega      the pin decks at night, violet                     red border, cream pinstripe
  epic      night, the Googie sign                             teal border, gold pinstripe
  max       the whole alley at night                           gold border, ink pinstripe

The tier name and the amount are runtime type (Win.svelte): the name sits on
the seam between window and paper (SEAM_Y there), the amount on the paper.
Decor layers are written empty, so nothing on the plaque moves by itself.

Run: python design/build_strike_win_plaques.py   (after build_strike_fg_sign.py)
"""
import sys
from pathlib import Path

from PIL import Image, ImageDraw

sys.path.insert(0, str(Path(__file__).resolve().parent))
from build_strike_fg_sign import BG, INK, PAPER, RED, TEAL, board, rounded_mask, save  # noqa: E402

PW, PH = 1000, 560
B = 26  # printed border around the marquee
IH = PH - 2 * B
SEAM = 236  # window bottom inside the marquee
GOLD = (255, 207, 74)
BASE, NIGHT = BG / "bg_base.png", BG / "bg_feature.png"

TIERS = {
    "big": (BASE, (300, 215, 1500), PAPER, None),
    "super": (BASE, (560, 30, 1920), PAPER, RED),
    "mega": (NIGHT, (300, 215, 1500), RED, PAPER),
    "epic": (NIGHT, (560, 30, 1920), TEAL, GOLD),
    "max": (NIGHT, (0, 40, 1920), GOLD, INK),
}


def plaque(view, box, border, stripe):
    inner = board(view, box, size=(PW - 2 * B, IH), seam=SEAM, k=0.6)
    out = Image.new("RGBA", (PW, PH))
    rad = 30
    out.paste(Image.new("RGBA", (PW, PH), border + (255,)), (0, 0),
              rounded_mask((PW, PH), (0, 0, PW - 1, PH - 1), rad + B))
    sc = 4
    if stripe:
        d2 = Image.new("L", (PW * sc, PH * sc), 0)
        ImageDraw.Draw(d2).rounded_rectangle([11 * sc, 11 * sc, (PW - 11) * sc, (PH - 11) * sc], (rad + B - 10) * sc,
                                             outline=255, width=5 * sc)
        sl = Image.new("RGBA", (PW, PH), stripe + (255,))
        sl.putalpha(d2.resize((PW, PH), Image.Resampling.LANCZOS))
        out.alpha_composite(sl)
    # the outline of the print, so a cream border still has an edge
    big = Image.new("L", (PW * sc, PH * sc), 0)
    ImageDraw.Draw(big).rounded_rectangle([sc, sc, PW * sc - sc, PH * sc - sc], (rad + B) * sc, outline=255, width=4 * sc)
    il = Image.new("RGBA", (PW, PH), INK + (255,))
    il.putalpha(big.resize((PW, PH), Image.Resampling.LANCZOS))
    out.alpha_composite(il)
    out.alpha_composite(inner, (B, B))
    return out


if __name__ == "__main__":
    for tier, args in TIERS.items():
        save(plaque(*args), f"win_{tier}.png")
        save(Image.new("RGBA", (PW, PH)), f"win_{tier}_decor.png")
    seam = B + SEAM + 4
    print(f"seam (window's bottom rule) at y {seam} of {PH}: {seam / PH - 0.5:+.3f} bh from centre")
