"""Draw clean low-pay cards and the Pocha street-stall Buy Bonus sign.

All lettering remains in the runtime UI. Run from any directory with Python/Pillow.
"""
from pathlib import Path
from PIL import Image, ImageDraw

SPR = Path(__file__).resolve().parents[1] / "static/assets/sprites"
NAVY = "#20283b"
PAPER = "#fff3e7"
RED = "#eb4036"
CYAN = "#20a7b5"


def canvas(size):
    return Image.new("RGBA", (size[0] * 3, size[1] * 3), (0, 0, 0, 0))


def finish(image, path, size):
    path.parent.mkdir(parents=True, exist_ok=True)
    image.resize(size, Image.Resampling.LANCZOS).save(path, optimize=True)


def low_cards():
    for name, edge in (("l1", RED), ("l2", CYAN), ("l3", "#ffce4c"),
                       ("l4", PAPER), ("l5", RED)):
        im = canvas((512, 512))
        d = ImageDraw.Draw(im)
        s = 3
        d.rounded_rectangle((42*s, 42*s, 470*s, 470*s), radius=34*s, fill=NAVY)
        d.rounded_rectangle((54*s, 54*s, 458*s, 458*s), radius=25*s,
                            fill=PAPER, outline=edge, width=11*s)
        finish(im, SPR / "sushiSymbols" / f"{name}.png", (512, 512))


def sign(lit=False):
    size = (768, 384)
    im = canvas(size)
    d = ImageDraw.Draw(im)
    s = 3
    def box(x0, y0, x1, y1):
        return (x0*s, y0*s, x1*s, y1*s)

    # An enamel-framed fabric sign: one face and one awning, no stacked plaques.
    d.rounded_rectangle(box(17, 35, 751, 350), radius=47*s, fill=NAVY)
    d.rounded_rectangle(box(32, 45, 736, 334), radius=34*s,
                        fill="#fcf0db", outline=("#ffce4c" if lit else RED), width=13*s)
    d.rounded_rectangle(box(45, 56, 723, 316), radius=27*s,
                        outline=NAVY, width=7*s)
    # Red pocha canopy with broad, hand-printed cream fabric stripes.
    d.rounded_rectangle(box(49, 58, 719, 109), radius=18*s,
                        fill=("#ff6944" if lit else RED))
    for x in (153, 268, 383, 498, 613):
        d.polygon([(x*s, 58*s), ((x+32)*s, 58*s),
                   ((x+15)*s, 107*s), ((x-17)*s, 107*s)], fill="#fff3e7")
    d.line([(55*s, 111*s), (713*s, 111*s)], fill=NAVY, width=7*s)
    # Rounded fabric hem. No bloom or white flash; hover changes spot ink only.
    d.line([(78*s, 311*s), (690*s, 311*s)], fill=RED, width=8*s)
    for x in range(81, 691, 61):
        d.arc(box(x, 307, x+60, 333), 0, 180, fill=NAVY, width=5*s)
    finish(im, SPR / "sushiUi" / ("buybonus_plate_lit.png" if lit else "buybonus_plate.png"), size)


if __name__ == "__main__":
    low_cards()
    sign()
    sign(lit=True)
