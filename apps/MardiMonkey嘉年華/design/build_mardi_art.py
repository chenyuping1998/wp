"""Build Mardi Monkey reel symbols from approved transparent source art.

Run from anywhere with a Python environment that has Pillow. The generated
sources remain under design/source/mardi/symbols for future edits.
"""

from pathlib import Path
from PIL import Image, ImageDraw, ImageOps

APP = Path(__file__).resolve().parents[1]
SOURCE = APP / "design/source/mardi/symbols"
SPRITES = APP / "static/assets/sprites"
SHEET = APP / "design/source/mardi/_sheets/reel_symbols_v1.png"
SYMBOLS = ("h1", "h2", "h3", "h4", "w", "p", "s")
INK = (59, 31, 92, 255)
PAPER = (255, 243, 224, 255)
EDGES = ((168, 63, 214, 255), (47, 175, 90, 255), INK,
         (255, 90, 138, 255), PAPER)


def contained(path: Path) -> Image.Image:
    src = Image.open(path).convert("RGBA")
    box = src.getchannel("A").getbbox()
    if box is None:
        raise ValueError(f"Transparent source has no subject: {path}")
    src = src.crop(box)
    src.thumbnail((420, 420), Image.Resampling.LANCZOS)
    out = Image.new("RGBA", (512, 512))
    out.alpha_composite(src, ((512 - src.width) // 2, (512 - src.height) // 2))
    return out


def label(edge: tuple[int, int, int, int]) -> Image.Image:
    im = Image.new("RGBA", (512, 512))
    draw = ImageDraw.Draw(im)
    draw.rounded_rectangle((42, 42, 470, 470), radius=38, fill=PAPER,
                           outline=INK, width=12)
    draw.line((92, 90, 420, 90), fill=edge, width=13)
    draw.line((92, 422, 420, 422), fill=edge, width=13)
    return im


def save(group: str, name: str, im: Image.Image) -> None:
    target = SPRITES / group / name
    target.parent.mkdir(parents=True, exist_ok=True)
    im.save(target, optimize=True)


def main() -> None:
    for name in ("base", "feature"):
        background = ImageOps.fit(
            Image.open(APP / f"design/source/mardi/background_{name}.png").convert("RGBA"),
            (1920, 1080), Image.Resampling.LANCZOS)
        save("sushiBackground", f"bg_{name}.png", background)
    for name in SYMBOLS:
        save("sushiSymbols", f"{name}.png", contained(SOURCE / f"{name}.png"))
    for number, edge in enumerate(EDGES, 1):
        save("sushiSymbols", f"l{number}.png", label(edge))
    save("sushiSymbols", "low_label.png", label(INK))
    plain = label(INK)
    for name in ("back_h1.png", "back_h2.png", "back_s.png"):
        save("sushiV8", name, plain)

    SHEET.parent.mkdir(parents=True, exist_ok=True)
    sheet = Image.new("RGB", (4 * 220, 2 * 250), PAPER[:3])
    draw = ImageDraw.Draw(sheet)
    for idx, name in enumerate(SYMBOLS):
        symbol = contained(SOURCE / f"{name}.png")
        symbol.thumbnail((190, 190), Image.Resampling.LANCZOS)
        x, y = idx % 4 * 220, idx // 4 * 250
        sheet.paste(symbol, (x + 15, y + 8), symbol)
        draw.text((x + 15, y + 210), name.upper(), fill=INK[:3])
    sheet.save(SHEET, optimize=True)
    print(f"Built {len(SYMBOLS)} symbols, blank labels, common backs, and {SHEET}")


if __name__ == "__main__":
    main()
