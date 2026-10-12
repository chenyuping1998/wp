"""Buy Bonus as a diner MENU CARD (2026-10-09, user: 「長條的類似菜單」).

A tall card instead of the square hanging sign: red header with a chrome badge
holding the burger, cream paper where the game typesets BUY BONUS (the label is
centred on the box, so the paper's middle stays clear), a checker band at the
foot. The lit copy (hover) swaps the red for the cyan, as the old plate did.

Canvas 500 x 800 = the box's 1 : 1.6 (uiTheme.buyBonusBoxAspect) drawn at
buyBonusPlateScale 1.25, so the card itself is the middle 400 x 640.
"""
from pathlib import Path
from PIL import Image, ImageDraw

APP = Path(__file__).resolve().parents[1]
OUT = APP / "static/assets/sprites/sushiUi"
SYM = APP / "static/assets/sprites/sushiSymbols"
INK = (27, 27, 27, 255); PAPER = (251, 245, 230, 255); RED = (226, 52, 43, 255)
CYAN = (31, 163, 200, 255); CHROME = (219, 224, 226, 255); SHADE = (231, 221, 196, 255)
K = 2  # drawn at 2x, reduced
W, H = 500, 800
X0, Y0, X1, Y1 = 50, 80, 450, 720


def s(*v):
    return tuple(round(a * K) for a in v)


def card(accent) -> Image.Image:
    im = Image.new("RGBA", (W * K, H * K), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    # the misregistered ink shadow every card in the game has
    d.rounded_rectangle(s(X0 + 12, Y0 + 12, X1 + 12, Y1 + 12), 30 * K, fill=INK)
    d.rounded_rectangle(s(X0, Y0, X1, Y1), 30 * K, fill=PAPER, outline=INK, width=10 * K)
    # header band
    hy = Y0 + 175
    d.rounded_rectangle(s(X0 + 12, Y0 + 12, X1 - 12, hy), 20 * K, fill=accent, outline=INK, width=6 * K)
    d.line(s(X0 + 34, Y0 + 32, X1 - 34, Y0 + 32), fill=(255, 205, 190, 255) if accent == RED else (190, 236, 248, 255), width=7 * K)
    for x in (X0 + 40, X1 - 40):
        d.ellipse(s(x - 9, hy - 34, x + 9, hy - 16), fill=CHROME, outline=INK, width=3 * K)
    # chrome badge with the burger, overlapping the header's foot
    cx, cy, r = (X0 + X1) / 2, hy - 62, 74
    d.ellipse(s(cx - r - 8, cy - r - 8, cx + r + 8, cy + r + 8), fill=INK)
    d.ellipse(s(cx - r, cy - r, cx + r, cy + r), fill=CHROME)
    d.ellipse(s(cx - r + 12, cy - r + 12, cx + r - 12, cy + r - 12), fill=PAPER, outline=INK, width=5 * K)
    burger = Image.open(SYM / "h1.png").convert("RGBA").resize(s(118, 118), Image.LANCZOS)
    im.alpha_composite(burger, s(cx - 59, cy - 61))
    # dotted leaders above and below the label's paper
    for y in (Y0 + 228, Y1 - 150):
        for x in range(X0 + 50, X1 - 40, 22):
            d.ellipse(s(x - 4, y - 4, x + 4, y + 4), fill=SHADE)
    # checker band at the foot
    by0, by1 = Y1 - 112, Y1 - 52
    d.rectangle(s(X0 + 24, by0, X1 - 24, by1), fill=PAPER, outline=INK, width=5 * K)
    n = 10
    cw = (X1 - 24 - (X0 + 24)) / n
    for i in range(n):
        for j in range(2):
            if (i + j) % 2 == 0:
                x = X0 + 24 + i * cw
                y = by0 + j * (by1 - by0) / 2
                d.rectangle(s(x, y, x + cw, y + (by1 - by0) / 2), fill=accent)
    d.rectangle(s(X0 + 24, by0, X1 - 24, by1), outline=INK, width=5 * K)
    return im.resize((W, H), Image.LANCZOS)


card(RED).save(OUT / "buybonus_plate.png", optimize=True)
card(CYAN).save(OUT / "buybonus_plate_lit.png", optimize=True)
print("wrote", OUT / "buybonus_plate.png", OUT / "buybonus_plate_lit.png")
