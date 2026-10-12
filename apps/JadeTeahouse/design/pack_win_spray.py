"""The win spray's sprite sheet (sushiWinPlates/bananas.png — the key and the
frame layout are inherited from the banana spray; WinCoins gives each particle
one random frame).

It was ten copies of the jade cup at one angle, and at spray size the cup's
big blank prize disc made every particle read as a white blob. These are ten
different things from the teahouse, cut from the game's own art:

  0-2  the three tea-filled cups off the H4 tray
  3    the jade cup (P)          4  the lidded gaiwan (H2)
  5    the lantern (S)           6  the steamer (H3)
  7    a tea leaf                8  a jade coin
  9    the teapot (H1)

Each frame is 256 x 256, the item centred and filling ~80% of it, so the
emitter's scale gives them all a similar size.

    python design/pack_win_spray.py
"""

from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

APP = Path(__file__).resolve().parents[1]
SPR = APP / "static/assets/sprites"
CELL = 256
COLS, ROWS = 5, 2


def item(rel: str, ellipse=None, max_up=2.4) -> Image.Image:
    """the art (or an ellipse cut out of it: cx, cy, rx, ry in the 512px art),
    trimmed to its ink and centred; never blown up more than `max_up`"""
    im = Image.open(SPR / rel).convert("RGBA")
    if ellipse:
        cx, cy, rx, ry = ellipse
        mask = Image.new("L", im.size, 0)
        ImageDraw.Draw(mask).ellipse([cx - rx, cy - ry, cx + rx, cy + ry], fill=255)
        mask = mask.filter(ImageFilter.GaussianBlur(1.2))
        alpha = Image.eval(im.getchannel("A"), lambda a: a)
        im.putalpha(Image.composite(alpha, Image.new("L", im.size, 0), mask))
    bbox = im.getchannel("A").point(lambda a: 255 if a > 24 else 0).getbbox()
    im = im.crop(bbox)
    k = min(max_up, CELL * 0.8 / max(im.size))
    im = im.resize((max(1, round(im.width * k)), max(1, round(im.height * k))), Image.LANCZOS)
    cell = Image.new("RGBA", (CELL, CELL), (0, 0, 0, 0))
    cell.alpha_composite(im, ((CELL - im.width) // 2, (CELL - im.height) // 2))
    return cell


def main():
    # crops in the 512px symbol art (the rigs' 256 canvas x 2)
    frames = [
        item("sushiSymbols/h4.png", (152, 216, 56, 52)),   # left cup  (76,108) x2
        item("sushiSymbols/h4.png", (272, 178, 56, 52)),   # middle    (136,89)
        item("sushiSymbols/h4.png", (380, 216, 56, 52)),   # right     (190,108)
        item("sushiSymbols/p.png"),
        item("sushiSymbols/h2.png"),
        item("sushiSymbols/s.png"),
        item("sushiSymbols/h3.png"),
        item("sushiV8/particle_0.png", max_up=1.3),
        item("sushiV8/particle_2.png", max_up=1.3),
        item("sushiSymbols/h1.png"),
    ]
    sheet = Image.new("RGBA", (CELL * COLS, CELL * ROWS), (0, 0, 0, 0))
    for i, f in enumerate(frames):
        sheet.alpha_composite(f, ((i % COLS) * CELL, (i // COLS) * CELL))
    sheet.save(SPR / "sushiWinPlates/bananas.png", optimize=True)
    print("wrote sushiWinPlates/bananas.png", sheet.size)


if __name__ == "__main__":
    main()
