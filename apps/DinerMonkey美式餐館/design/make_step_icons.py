"""The bet stepper's − / + for the 'print' bar (uiTheme.icons increase /
decrease). The template draws them as text in the game font, and Bangers'
minus sits low and thin, off the disc's centre. These are drawn: ink bars of
equal weight, exactly centred on the 256 canvas like the other print icons."""
from pathlib import Path
from PIL import Image, ImageDraw

APP = Path(__file__).resolve().parents[1]
OUT = APP / "static/assets/sprites/sushiIcons"
INK = (27, 27, 27, 255)
K = 4
HALF_LEN, HALF_W = 70, 19  # canvas px: a 140-long bar, 38 thick


def bar(d: ImageDraw.ImageDraw, horizontal: bool) -> None:
    c = 128 * K
    a, b = HALF_LEN * K, HALF_W * K
    box = [c - a, c - b, c + a, c + b] if horizontal else [c - b, c - a, c + b, c + a]
    d.rounded_rectangle(box, radius=b, fill=INK)


for name, vertical in (("print_decrease", False), ("print_increase", True)):
    im = Image.new("RGBA", (256 * K, 256 * K), (27, 27, 27, 0))
    d = ImageDraw.Draw(im)
    bar(d, True)
    if vertical:
        bar(d, False)
    im.resize((256, 256), Image.LANCZOS).save(OUT / f"{name}.png", optimize=True)
    print("wrote", OUT / f"{name}.png")
