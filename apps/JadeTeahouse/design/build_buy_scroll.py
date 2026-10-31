"""The Buy Bonus plate as a hand-scroll that opens under the pointer (2026-10-31).

User: like Treasure Monkey's scroll symbol, closed at rest and opening when
the mouse is over it, while still reading as the Buy Bonus entrance when
closed. Built from the game's own scroll art (the FG settlement's paper and
bamboo rods, sushiV8/scroll_paper.png + scroll_rod.png), Treasure's way: the
paper is revealed outward from the centre between the two rods, which sit on
its edges; the gold corner brackets only come out when it is fully open.

"Closed" is HALF rolled, not shut: a band of paper stays out between the rods,
and that is where the shared button sets its "BUY BONUS" label (two lines), so
at rest it is a scroll with BUY BONUS written on it, not an anonymous prop.

  buy_scroll_0.png   at rest (open 0.56) - the plate
  buy_scroll_1..5    opening, played once by the shared button on hover
                     (uiTheme.buyBonusHoverFrames); the last one stays up

800x800 canvases, scroll centred, so the button's box and plate scale keep
working as they did for the bamboo plate.

Run: python design/build_buy_scroll.py
"""

from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

APP = Path(__file__).resolve().parents[1]
V8 = APP / "static/assets/sprites/sushiV8"
OUT = APP / "static/assets/sprites/sushiUi"
N = 800
PAPER_W, PAPER_H = 600, 338
ROD_H = 384
ROD_W = round(ROD_H * 122 / 1022)
OPENS = [0.56, 0.68, 0.8, 0.9, 0.97, 1.0]


def frame(open_):
    paper = Image.open(V8 / "scroll_paper.png").convert("RGBA").resize((PAPER_W, PAPER_H), Image.Resampling.LANCZOS)
    rod = Image.open(V8 / "scroll_rod.png").convert("RGBA").resize((ROD_W, ROD_H), Image.Resampling.LANCZOS)
    c = N // 2
    span = PAPER_W / 2 * open_
    canvas = Image.new("RGBA", (N, N))
    # a soft shadow under the whole scroll, so it sits on the scene
    shadow = Image.new("L", (N, N))
    sh = np.zeros((N, N), np.float32)
    x0, x1 = int(c - span - ROD_W), int(c + span + ROD_W)
    sh[c - PAPER_H // 2 + 14 : c + PAPER_H // 2 + 22, x0 + 6 : x1 + 6] = 1
    shadow = Image.fromarray((sh * 120).astype(np.uint8)).filter(ImageFilter.GaussianBlur(14))
    canvas.alpha_composite(Image.merge("RGBA", (Image.new("L", (N, N), 20),) * 3 + (shadow,)))
    # the paper, revealed from the centre: the middle 2*span of it
    px0 = int(round(PAPER_W / 2 - span))
    strip = paper.crop((px0, 0, PAPER_W - px0, PAPER_H))
    a = np.array(strip).astype(np.float32)
    # the paper darkens where it curls into each rod
    w = a.shape[1]
    xs = np.arange(w)
    curl = np.minimum(xs, w - 1 - xs)
    shade = 1 - 0.28 * np.exp(-curl / 14.0) * (1 - open_ * 0.6)
    a[..., :3] *= shade[None, :, None]
    canvas.alpha_composite(Image.fromarray(a.clip(0, 255).astype(np.uint8)), (c - w // 2, c - PAPER_H // 2))
    # the rods on its edges
    for side in (-1, 1):
        x = int(round(c + side * span - ROD_W / 2))
        canvas.alpha_composite(rod, (x, c - ROD_H // 2))
    return canvas


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    for i, o in enumerate(OPENS):
        frame(o).save(OUT / f"buy_scroll_{i}.png", optimize=True)
    print(f"wrote {len(OPENS)} frames to {OUT.relative_to(APP)}")
    span = PAPER_W / 2 * OPENS[0] + ROD_W
    print("closed bounds x %.3f..%.3f  y %.3f..%.3f" % ((N / 2 - span) / N, (N / 2 + span) / N, (N / 2 - ROD_H / 2) / N, (N / 2 + ROD_H / 2) / N))


if __name__ == "__main__":
    main()
