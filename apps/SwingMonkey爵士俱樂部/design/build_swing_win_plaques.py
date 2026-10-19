"""The big-win plaques (win_big .. win_max, 1000x560), 2026-10-18.

They were a flat red panel with a starburst behind it and a sax / a monkey
badge pasted beside them (the decor layers) — the thing the user rejected on
Putt / Strike. Now each is the gig ticket of build_swing_fg_sign.board (a
window onto the club over the ticket's paper), and the tiers climb by WHAT THE
WINDOW SHOWS and by the printed border, not by piling on icons:

  big       the house: a table lamp and a cocktail       cream border
  superwin  the band's corner: bass and drums            cream border, red pinstripe
  mega      the spotlight on the curtain                 red border, cream pinstripe
  epic      the band on the spotlit floor                ink border, gold pinstripe
  max       the whole stage under the valance            gold border, a row of
                                                         marquee bulbs round it

The tier name and the amount are runtime type (Win.svelte): the name sits on
the seam between window and paper (SEAM_Y there), the amount on the paper.
Decor layers are written empty, so nothing on the plaque moves by itself.

Run: python design/build_swing_win_plaques.py   (after build_swing_fg_sign.py)
"""
import sys
from pathlib import Path

from PIL import Image, ImageDraw

sys.path.insert(0, str(Path(__file__).resolve().parent))
from build_swing_fg_sign import BG, GOLD, INK, PAPER, RED, board, rounded_mask, save  # noqa: E402

PW, PH = 1000, 560
B = 26  # printed border around the ticket
IH = PH - 2 * B
SEAM = 236  # window bottom inside the ticket
HOUSE, LIT = BG / "bg_base.png", BG / "bg_feature.png"

TIERS = {
    "big": (HOUSE, (0, 760, 1000), PAPER, None, False),
    "super": (HOUSE, (0, 380, 1000), PAPER, RED, False),
    "mega": (LIT, (330, 190, 1130), RED, PAPER, False),
    "epic": (LIT, (60, 470, 1460), INK, GOLD, False),
    "max": (LIT, (0, 110, 1920), GOLD, INK, True),
}


def layer(size, draw_fn, colour, sc=4):
    big = Image.new("L", (size[0] * sc, size[1] * sc), 0)
    draw_fn(ImageDraw.Draw(big), sc)
    out = Image.new("RGBA", size, colour + (255,))
    out.putalpha(big.resize(size, Image.Resampling.LANCZOS))
    return out


def plaque(view, box, border, stripe, bulbs):
    inner = board(view, box, size=(PW - 2 * B, IH), seam=SEAM, k=0.6, ticket=False)
    out = Image.new("RGBA", (PW, PH))
    rad = 30
    out.paste(Image.new("RGBA", (PW, PH), border + (255,)), (0, 0),
              rounded_mask((PW, PH), (0, 0, PW - 1, PH - 1), rad + B))
    if stripe:
        out.alpha_composite(layer((PW, PH), lambda d, s: d.rounded_rectangle(
            [11 * s, 11 * s, (PW - 11) * s, (PH - 11) * s], (rad + B - 10) * s, outline=255, width=5 * s), stripe))
    if bulbs:
        # marquee bulbs on the border's centre line, evenly round the rectangle
        # (corners skipped): ink rim, cream glass, a gold-white core
        y0, y1, x0, x1 = B / 2, PH - B / 2, B / 2, PW - B / 2
        pts = []
        step = 46
        for x in range(int(x0 + rad + 12), int(x1 - rad - 6), step):
            pts += [(x, y0), (x, y1)]
        for y in range(int(y0 + rad + 22), int(y1 - rad - 6), step):
            pts += [(x0, y), (x1, y)]
        r = 8.5
        out.alpha_composite(layer((PW, PH), lambda d, s: [d.ellipse(
            [(x - r - 2.5) * s, (y - r - 2.5) * s, (x + r + 2.5) * s, (y + r + 2.5) * s], fill=255) for x, y in pts], INK))
        out.alpha_composite(layer((PW, PH), lambda d, s: [d.ellipse(
            [(x - r) * s, (y - r) * s, (x + r) * s, (y + r) * s], fill=255) for x, y in pts], (255, 240, 200)))
        out.alpha_composite(layer((PW, PH), lambda d, s: [d.ellipse(
            [(x - r * .45 - 1.5) * s, (y - r * .45 - 1.5) * s, (x + r * .45 - 1.5) * s, (y + r * .45 - 1.5) * s], fill=255)
            for x, y in pts], (255, 255, 246)))
    # the outline of the print, so a cream border still has an edge
    out.alpha_composite(layer((PW, PH), lambda d, s: d.rounded_rectangle(
        [s, s, PW * s - s, PH * s - s], (rad + B) * s, outline=255, width=4 * s), INK))
    out.alpha_composite(inner, (B, B))
    return out


if __name__ == "__main__":
    for tier, args in TIERS.items():
        save(plaque(*args), f"win_{tier}.png")
        save(Image.new("RGBA", (PW, PH)), f"win_{tier}_decor.png")
    seam = B + SEAM + 4
    print(f"seam (window's bottom rule) at y {seam} of {PH}: {seam / PH - 0.5:+.3f} bh from centre")
