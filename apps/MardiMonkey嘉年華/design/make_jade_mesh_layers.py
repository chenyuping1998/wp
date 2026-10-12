"""Layers for Jade Teahouse's mesh wins (src/game/meshWin/*).

The symbol art is already cut out: every high, W, S and P is a transparent
painting drawn over a separate paper card (Symbol.svelte), so the painting
itself IS the subject and needs no cutting. What this writes:

  jadeMesh/<sym>_shadow.png   a soft drop shadow from the subject's alpha,
                              quarter size (SymbolMeshWin scales it up)
  jadeMesh/l<n>_subject.png   the royals' letters (A K Q J 10), baked in the
                              game font at exactly the size and place
                              Symbol.svelte typesets them, so a letter can leap
                              off its label the way the paintings leap off
                              their cards
  jadeMesh/l<n>_shadow.png    and their shadows

Run from the app root:  python design/make_jade_mesh_layers.py
"""

from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

APP = Path(__file__).resolve().parents[1]
SYMBOLS = APP / "static/assets/sprites/sushiSymbols"
OUT = APP / "static/assets/sprites/jadeMesh"
FONT = APP / "static/fonts/sushi/Fascinate-Regular.ttf"
SIZE = 512

# Symbol.svelte / SymbolSprite.svelte: Text anchor 0.5, fontSize 62 (51 for
# "10") on a label drawn SYMBOL_SIZE (140) wide; the layer is 512 wide.
SYMBOL_SIZE = 140
INK = (0x1E, 0x1B, 0x1A, 255)
LETTERS = {"l1": "A", "l2": "K", "l3": "Q", "l4": "J", "l5": "10"}


def shadow(subject: Image.Image) -> Image.Image:
    """Black silhouette, blurred, quarter size."""
    alpha = subject.getchannel("A")
    small = alpha.resize((SIZE // 4, SIZE // 4), Image.LANCZOS)
    pad = Image.new("L", small.size, 0)
    pad.paste(small, (0, 0))
    blurred = pad.filter(ImageFilter.GaussianBlur(3))
    out = Image.new("RGBA", small.size, (20, 26, 22, 0))
    out.putalpha(blurred)
    return out


def letter(text: str) -> Image.Image:
    font_px = (62 if len(text) == 1 else 51) * SIZE / SYMBOL_SIZE
    font = ImageFont.truetype(str(FONT), round(font_px))
    try:
        font.set_variation_by_axes([400])
    except OSError:
        pass
    ascent, descent = font.getmetrics()
    width = font.getlength(text)
    # pixi centres the text's measured box: advance width x (ascent + descent)
    x = SIZE / 2 - width / 2
    y = SIZE / 2 - (ascent + descent) / 2
    im = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    ImageDraw.Draw(im).text((x, y), text, font=font, fill=INK)
    return im


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    for name in ("h1", "h2", "h3", "h4", "w", "s", "p"):
        subject = Image.open(SYMBOLS / f"{name}.png").convert("RGBA")
        assert subject.size == (SIZE, SIZE), name
        shadow(subject).save(OUT / f"{name}_shadow.png", optimize=True)
    for name, text in LETTERS.items():
        subject = letter(text)
        bbox = subject.getbbox()
        subject.save(OUT / f"{name}_subject.png", optimize=True)
        shadow(subject).save(OUT / f"{name}_shadow.png", optimize=True)
        print(f"{name} {text!r}: ink bbox (256 canvas) {[round(v / 2, 1) for v in bbox]}")
    print(f"wrote {OUT}")


if __name__ == "__main__":
    main()
