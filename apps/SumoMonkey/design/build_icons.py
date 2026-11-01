"""Draw the Sushi Monkey round-button icon set as flat 8%-width line art."""

from pathlib import Path
from PIL import Image, ImageDraw
import math

OUT = Path(__file__).resolve().parents[1] / "static/assets/sprites/sushiIcons"
OUT.mkdir(parents=True, exist_ok=True)
GREEN = "#4A4846"
SIZE = 256
WIDTH = 19


def icon(name, draw):
    im = Image.new("RGBA", (SIZE, SIZE))
    d = ImageDraw.Draw(im)
    draw(d)
    im.save(OUT / f"{name}.png")


def lines(d, points, width=WIDTH):
    d.line(points, fill=GREEN, width=width, joint="curve")


for name, ys in (("menu", (75, 128, 181)),):
    icon(name, lambda d: [lines(d, (56, y, 200, y)) for y in ys])
icon("menuExit", lambda d: (lines(d, (65, 65, 191, 191)), lines(d, (191, 65, 65, 191))))
icon("increase", lambda d: (lines(d, (58, 128, 198, 128)), lines(d, (128, 58, 128, 198))))
icon("decrease", lambda d: lines(d, (58, 128, 198, 128)))
icon("spin", lambda d: d.polygon([(91, 53), (91, 203), (207, 128)], fill=GREEN))
icon("info", lambda d: (d.ellipse((45, 45, 211, 211), outline=GREEN, width=WIDTH), d.ellipse((117, 78, 139, 100), fill=GREEN), lines(d, (128, 119, 128, 178))))


def gear(d):
    for i in range(8):
        a = i * math.pi / 4
        x, y = 128 + 77 * math.cos(a), 128 + 77 * math.sin(a)
        d.ellipse((x - 14, y - 14, x + 14, y + 14), fill=GREEN)
    d.ellipse((55, 55, 201, 201), outline=GREEN, width=WIDTH)
    d.ellipse((103, 103, 153, 153), outline=GREEN, width=WIDTH)


icon("settings", gear)
icon("payTable", lambda d: (d.rounded_rectangle((56, 48, 200, 208), radius=13, outline=GREEN, width=WIDTH),
                            lines(d, (79, 96, 177, 96)), lines(d, (79, 132, 177, 132)), lines(d, (79, 168, 150, 168))))


def speaker(d):
    d.polygon([(52, 105), (82, 105), (127, 67), (127, 189), (82, 151), (52, 151)], fill=GREEN)


icon("soundOff", lambda d: (speaker(d), lines(d, (152, 92, 205, 164)), lines(d, (205, 92, 152, 164))))
icon("soundOn", lambda d: (speaker(d), d.arc((105, 72, 191, 184), -65, 65, fill=GREEN, width=WIDTH),
                           d.arc((88, 48, 224, 208), -60, 60, fill=GREEN, width=WIDTH)))
icon("autoSpin", lambda d: (d.arc((48, 48, 208, 208), 28, 320, fill=GREEN, width=WIDTH),
                            d.polygon([(183, 58), (219, 63), (195, 96)], fill=GREEN)))
icon("replay", lambda d: (d.arc((49, 49, 207, 207), 65, 350, fill=GREEN, width=WIDTH),
                          d.polygon([(51, 84), (50, 48), (91, 66)], fill=GREEN)))
# turbo: a lightning bolt. Not a bet-bar sprite (the bar draws its own vector
# bolt) — it is for the rules page's controls guide, which shows each button.
icon("turbo", lambda d: d.polygon([(146, 40), (74, 140), (124, 140), (104, 216), (184, 108), (132, 108)], fill=GREEN))
